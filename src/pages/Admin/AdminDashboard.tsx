import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import IconifyIcon from "../../components/Icon/IconifyIcon";
import MainLayout from "../../components/Layout/MainLayout";
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import { db } from "../../firebase";
import { eventsService } from "../../firebase/services";
import { useShowsByCategory } from "../../hooks/useShows";
import "./AdminDashboard.css";

interface DashboardStats {
  totalUsers: number;
  todayUsers: number;
  totalShows: number;
  activeShows: number;
  totalTickets: number;
  todayTickets: number;
  totalEvents: number;
  activeEvents: number;
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  
  // ⭐ 실시간 멜론 공연 데이터 사용
  const { shows: melonShows, loading: melonLoading } = useShowsByCategory("concert", "popularity");
  
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    todayUsers: 0,
    totalShows: 0,
    activeShows: 0,
    totalTickets: 0,
    todayTickets: 0,
    totalEvents: 0,
    activeEvents: 0,
  });
  
  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // 1. 사용자 통계
        const usersSnapshot = await getDocs(collection(db, "users"));
        const totalUsers = usersSnapshot.size;
        
        // 오늘 가입자 (24시간 이내)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayUsers = usersSnapshot.docs.filter((doc) => {
          const data = doc.data();
          const createdAt = data.createdAt?.toDate();
          return createdAt && createdAt >= today;
        }).length;

        // 최근 가입자 5명
        const usersQuery = query(
          collection(db, "users"),
          orderBy("createdAt", "desc"),
          limit(5)
        );
        const recentUsersSnapshot = await getDocs(usersQuery);
        const recentUsersData = recentUsersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));

        // 2. 티켓 통계 (orders collection에서 가져오기)
        let totalTickets = 0;
        let todayTickets = 0;
        
        try {
          const ordersQuery = query(
            collection(db, "orders"),
            orderBy("createdAt", "desc")
          );
          const ordersSnapshot = await getDocs(ordersQuery);
          totalTickets = ordersSnapshot.size;
          
          // 오늘 예매 건수 (24시간 이내)
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          todayTickets = ordersSnapshot.docs.filter((doc) => {
            const data = doc.data();
            const createdAt = data.createdAt?.toDate();
            return createdAt && createdAt >= today;
          }).length;
        } catch (error) {
          console.warn("티켓 통계 로딩 실패 (인덱스 없을 수 있음):", error);
          // 인덱스가 없을 경우 정렬 없이 조회
          try {
            const ordersSnapshot = await getDocs(collection(db, "orders"));
            totalTickets = ordersSnapshot.size;
            
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            todayTickets = ordersSnapshot.docs.filter((doc) => {
              const data = doc.data();
              const createdAt = data.createdAt?.toDate();
              return createdAt && createdAt >= today;
            }).length;
          } catch (fallbackError) {
            console.error("티켓 통계 로딩 실패 (fallback):", fallbackError);
          }
        }
        
        // 3. 이벤트 통계
        const allEvents = await eventsService.getAll();
        const activeEvents = allEvents.filter(e => e.status === "ongoing").length;
        
        // ⭐ 멜론 공연 데이터 통계
        const totalShows = melonShows.length;
        const activeShows = melonShows.filter((s: any) => 
          s.ticketStatus === "onsale" || s.ticketStatus === "presale"
        ).length;
        
        setStats({
          totalUsers,
          todayUsers,
          totalShows,
          activeShows,
          totalTickets,
          todayTickets,
          totalEvents: allEvents.length,
          activeEvents,
        });
        
        setRecentUsers(recentUsersData);
        
      } catch (error) {
        console.error("대시보드 데이터 로딩 실패:", error);
      } finally {
        setLoading(false);
      }
    };

    if (!melonLoading) {
      fetchDashboardData();
    }
  }, [melonShows, melonLoading]);

  const statCards = [
    {
      title: "전체 회원",
      value: stats.totalUsers,
      change: `+${stats.todayUsers} 오늘`,
      icon: "mdi:account-group",
      color: "#667eea",
      bgColor: "rgba(102, 126, 234, 0.1)",
    },
    {
      title: "실시간 공연",
      value: stats.totalShows,
      change: `진행중 ${stats.activeShows}개`,
      icon: "mdi:calendar",
      color: "#764ba2",
      bgColor: "rgba(118, 75, 162, 0.1)",
    },
    {
      title: "진행 중 이벤트",
      value: stats.activeEvents,
      change: `전체 ${stats.totalEvents}개`,
      icon: "mdi:trending-up",
      color: "#10b981",
      bgColor: "rgba(16, 185, 129, 0.1)",
    },
    {
      title: "전체 예매",
      value: stats.totalTickets,
      change: `+${stats.todayTickets} 오늘`,
      icon: "mdi:ticket-confirmation",
      color: "#f59e0b",
      bgColor: "rgba(245, 158, 11, 0.1)",
    },
  ];

  return (
    <MainLayout>
      <div className="admin-dashboard-page">
        <div className="admin-dashboard-container">
          {/* 헤더 */}
          <div className="admin-dashboard-header">
            <div className="admin-dashboard-header-text">
              <h1 className="admin-dashboard-title">관리자 대시보드</h1>
              <p className="admin-dashboard-subtitle">AMPLIFY 티켓 시스템 전체 현황</p>
            </div>
            <button
              className="admin-dashboard-add-button"
              onClick={() => navigate("/admin/events/create")}
            >
              <IconifyIcon icon="mdi:plus" width={20} height={20} />
              공연 등록
            </button>
          </div>

          {/* 통계 카드 */}
          <div className="admin-dashboard-stats-grid">
            {statCards.map((card, index) => (
              <div key={index} className="admin-dashboard-stat-card">
                <div className="admin-dashboard-stat-card-header">
                  <p className="admin-dashboard-stat-card-title">{card.title}</p>
                  <div
                    className="admin-dashboard-stat-card-icon"
                    style={{ backgroundColor: card.bgColor }}
                  >
                    <IconifyIcon icon={card.icon} width={40} height={40} style={{ color: card.color }} />
                  </div>
                </div>
                <h2 className="admin-dashboard-stat-card-value">{card.value}</h2>
                <p className="admin-dashboard-stat-card-change">{card.change}</p>
              </div>
            ))}
          </div>

          {/* 메인 콘텐츠 */}
          <div className="admin-dashboard-main-grid">
            {/* 왼쪽: 공연 목록 */}
            <div className="admin-dashboard-shows-card">
              <div className="admin-dashboard-shows-header">
                <div className="admin-dashboard-shows-header-text">
                  <h3 className="admin-dashboard-shows-title">실시간 공연 현황</h3>
                  <p className="admin-dashboard-shows-subtitle">멜론티켓 실시간 데이터</p>
                </div>
                <button
                  className="admin-dashboard-shows-button"
                  onClick={() => navigate("/shows")}
                >
                  전체보기
                </button>
              </div>
              
              {melonLoading ? (
                <div className="admin-dashboard-loading">
                  <div className="spinner"></div>
                </div>
              ) : (
                <ul className="admin-dashboard-shows-list">
                  {melonShows.slice(0, 5).map((show: any, index: number) => (
                    <React.Fragment key={show.showId || index}>
                      {index > 0 && <hr className="admin-dashboard-divider" />}
                      <li
                        className="admin-dashboard-show-item"
                        onClick={() => navigate(`/shows/${show.showId}`)}
                      >
                        <img
                          src={show.posterUrl}
                          alt={show.artist || show.title}
                          className="admin-dashboard-show-poster"
                        />
                        <div className="admin-dashboard-show-info">
                          <p className="admin-dashboard-show-artist">{show.artist || show.title}</p>
                          <div className="admin-dashboard-show-meta">
                            <p className="admin-dashboard-show-venue">{show.venueName || show.city}</p>
                            <span className="admin-dashboard-show-status-chip">
                              {show.ticketStatus === "onsale" ? "판매중" : "오픈예정"}
                            </span>
                          </div>
                        </div>
                      </li>
                    </React.Fragment>
                  ))}
                </ul>
              )}
            </div>

            {/* 오른쪽: 최근 가입자 */}
            <div className="admin-dashboard-users-card">
              <div className="admin-dashboard-users-header">
                <h3 className="admin-dashboard-users-title">최근 가입자</h3>
                <button
                  className="admin-dashboard-users-button"
                  onClick={() => navigate("/admin/users")}
                >
                  전체보기
                </button>
              </div>
              <ul className="admin-dashboard-users-list">
                {recentUsers.length === 0 ? (
                  <li className="admin-dashboard-empty-user">
                    <p className="admin-dashboard-empty-user-text">가입자가 없습니다</p>
                  </li>
                ) : (
                  recentUsers.map((user, index) => (
                    <React.Fragment key={user.id}>
                      {index > 0 && <hr className="admin-dashboard-divider" />}
                      <li className="admin-dashboard-user-item">
                        <div className="admin-dashboard-user-info">
                          <p className="admin-dashboard-user-email">{user.email}</p>
                          <p className="admin-dashboard-user-date">
                            {user.createdAt?.toDate().toLocaleDateString("ko-KR")}
                          </p>
                        </div>
                        <span className={`admin-dashboard-user-role-chip ${user.role === "admin" ? "admin" : "user"}`}>
                          {user.role === "admin" ? "관리자" : "일반"}
                        </span>
                      </li>
                    </React.Fragment>
                  ))
                )}
              </ul>
            </div>
          </div>

          {/* 빠른 액션 */}
          <div className="admin-dashboard-actions-grid">
            <button
              className="admin-dashboard-action-button"
              onClick={() => navigate("/admin/shows")}
            >
              공연 관리
            </button>
            <button
              className="admin-dashboard-action-button"
              onClick={() => navigate("/admin/tickets")}
            >
              예매 관리
            </button>
            <button
              className="admin-dashboard-action-button"
              onClick={() => navigate("/admin/users")}
            >
              사용자 관리
            </button>
            <button
              className="admin-dashboard-action-button"
              onClick={() => navigate("/admin/notices")}
            >
              공지 관리
            </button>
            <button
              className="admin-dashboard-action-button"
              onClick={() => navigate("/admin/inquiries")}
            >
              문의 관리
            </button>
            <button
              className="admin-dashboard-action-button admin-dashboard-action-button-orange"
              onClick={() => navigate("/admin/events")}
            >
              이벤트 관리
            </button>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
