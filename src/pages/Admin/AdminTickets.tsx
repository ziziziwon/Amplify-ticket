import React, { useEffect, useState } from "react";
import IconifyIcon from "../../components/Icon/IconifyIcon";
import MainLayout from "../../components/Layout/MainLayout";
import { collection, getDocs, doc, updateDoc, query, orderBy, where, getDoc } from "firebase/firestore";
import { db } from "../../firebase";
import showsData from "../../data/shows.json";
import { Show } from "../../types";
import { formatDate, formatPrice } from "../../utils/formatters";
import "./AdminTickets.css";

interface TicketOrder {
  orderId: string;
  userId: string;
  userEmail: string;
  showId: string;
  showTitle: string;
  date: string;
  time?: string;
  seats: Array<{ seatId: string; grade: string; price: number; section?: string; row?: string; number?: string }>;
  totalAmount: number;
  status: "confirmed" | "cancelled" | "refunded";
  createdAt: any;
  buyerInfo?: {
    name: string;
    email: string;
    phone: string;
  };
}

export default function AdminTickets() {
  const shows = showsData as unknown as Show[];
  const [tickets, setTickets] = useState<TicketOrder[]>([]);
  const [filteredTickets, setFilteredTickets] = useState<TicketOrder[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedTicket, setSelectedTicket] = useState<TicketOrder | null>(null);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        setLoading(true);
        
        // Firestore orders collection에서 데이터 가져오기
        const ticketsQuery = query(collection(db, "orders"), orderBy("createdAt", "desc"));
        const ticketsSnapshot = await getDocs(ticketsQuery);
        
        const ticketsData: TicketOrder[] = ticketsSnapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            orderId: data.orderId || doc.id,
            userId: data.userId || "",
            userEmail: data.buyerInfo?.email || data.userEmail || "",
            showId: data.showId || "",
            showTitle: data.title || data.artist || data.tourName || "공연 정보 없음",
            date: data.date || "",
            time: data.time || "",
            seats: data.seats || [],
            totalAmount: data.totalAmount || 0,
            status: data.status || "confirmed",
            createdAt: data.createdAt,
            buyerInfo: data.buyerInfo,
          };
        });

        setTickets(ticketsData);
        setFilteredTickets(ticketsData);
        console.log("예매 데이터 로딩 완료:", ticketsData.length, "건");
      } catch (error) {
        console.error("예매 데이터 로딩 실패:", error);
        // 인덱스가 없을 수 있으므로, 정렬 없이 다시 시도
        try {
          const ticketsSnapshot = await getDocs(collection(db, "orders"));
          const ticketsData: TicketOrder[] = ticketsSnapshot.docs.map((doc) => {
            const data = doc.data();
            return {
              orderId: data.orderId || doc.id,
              userId: data.userId || "",
              userEmail: data.buyerInfo?.email || data.userEmail || "",
              showId: data.showId || "",
              showTitle: data.title || data.artist || data.tourName || "공연 정보 없음",
              date: data.date || "",
              time: data.time || "",
              seats: data.seats || [],
              totalAmount: data.totalAmount || 0,
              status: data.status || "confirmed",
              createdAt: data.createdAt,
              buyerInfo: data.buyerInfo,
            };
          });
          
          // 수동으로 정렬 (최신순)
          ticketsData.sort((a, b) => {
            const aTime = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
            const bTime = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
            return bTime - aTime;
          });
          
          setTickets(ticketsData);
          setFilteredTickets(ticketsData);
          console.log("예매 데이터 로딩 완료 (정렬 없이):", ticketsData.length, "건");
        } catch (fallbackError) {
          console.error("예매 데이터 로딩 실패 (fallback):", fallbackError);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchTickets();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const filtered = tickets.filter(
        (ticket) =>
          ticket.orderId.toLowerCase().includes(searchQuery.toLowerCase()) ||
          ticket.userEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
          ticket.showTitle.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredTickets(filtered);
    } else {
      setFilteredTickets(tickets);
    }
  }, [searchQuery, tickets]);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, ticket: TicketOrder) => {
    setAnchorEl(event.currentTarget);
    setSelectedTicket(ticket);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedTicket(null);
  };

  const handleView = () => {
    if (selectedTicket) {
      console.log("티켓 상세 보기:", selectedTicket.orderId);
      // navigate(`/admin/tickets/${selectedTicket.orderId}`);
    }
    handleMenuClose();
  };

  const handleCancelClick = () => {
    setCancelDialogOpen(true);
    handleMenuClose();
  };

  const handleCancel = async () => {
    if (!selectedTicket) return;

    try {
      setUpdating(true);

      // Firestore에서 orderId로 문서 찾기
      let orderDocRef = null;
      
      // 방법 1: orderId 필드로 검색
      try {
        const ordersQuery = query(
          collection(db, "orders"),
          where("orderId", "==", selectedTicket.orderId)
        );
        const ordersSnapshot = await getDocs(ordersQuery);
        if (!ordersSnapshot.empty) {
          orderDocRef = ordersSnapshot.docs[0].ref;
        }
      } catch (e) {
        console.warn("orderId 필드 검색 실패:", e);
      }

      // 방법 2: 문서 ID가 orderId인 경우
      if (!orderDocRef) {
        try {
          const directDocRef = doc(db, "orders", selectedTicket.orderId);
          const directDocSnap = await getDoc(directDocRef);
          if (directDocSnap.exists()) {
            orderDocRef = directDocRef;
          }
        } catch (e) {
          console.warn("직접 문서 조회 실패:", e);
        }
      }

      // 방법 3: 전체 조회 후 찾기 (fallback)
      if (!orderDocRef) {
        try {
          const allOrdersSnapshot = await getDocs(collection(db, "orders"));
          allOrdersSnapshot.docs.forEach((d) => {
            const data = d.data();
            if (data.orderId === selectedTicket.orderId || d.id === selectedTicket.orderId) {
              orderDocRef = d.ref;
            }
          });
        } catch (e) {
          console.warn("전체 조회 실패:", e);
        }
      }

      if (orderDocRef) {
        // Firestore 업데이트
        await updateDoc(orderDocRef, {
          status: "cancelled",
          cancelledAt: new Date(),
          cancelledBy: "admin",
        });
      } else {
        console.warn("주문 문서를 찾을 수 없습니다:", selectedTicket.orderId);
      }

      // 로컬 상태 업데이트
      setTickets(
        tickets.map((ticket) =>
          ticket.orderId === selectedTicket.orderId
            ? { ...ticket, status: "cancelled" as const }
            : ticket
        )
      );
      
      setFilteredTickets(
        filteredTickets.map((ticket) =>
          ticket.orderId === selectedTicket.orderId
            ? { ...ticket, status: "cancelled" as const }
            : ticket
        )
      );

      setCancelDialogOpen(false);
      setSelectedTicket(null);

      alert("예매가 취소되었습니다.");
      console.log("예매 취소 완료:", selectedTicket.orderId);
    } catch (error: any) {
      console.error("예매 취소 실패:", error);
      alert(`예매 취소에 실패했습니다: ${error.message || "알 수 없는 오류"}`);
    } finally {
      setUpdating(false);
    }
  };

  const getStatusChip = (status: string) => {
    const config: Record<string, { label: string; color: string; gradient?: boolean }> = {
      confirmed: { label: "확정", color: "#667eea", gradient: true },
      cancelled: { label: "취소", color: "#999", gradient: false },
      refunded: { label: "환불완료", color: "#f59e0b", gradient: false },
    };

    const { label, color, gradient } = config[status] || config.confirmed;

    return (
      <span
        className="admin-tickets-status-chip"
        style={{
          background: gradient ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" : color,
        }}
      >
        {label}
      </span>
    );
  };

  const getTotalStats = () => {
    const totalTickets = tickets.length;
    const totalRevenue = tickets
      .filter((t) => t.status === "confirmed")
      .reduce((sum, t) => sum + t.totalAmount, 0);
    const cancelledCount = tickets.filter((t) => t.status === "cancelled").length;

    return { totalTickets, totalRevenue, cancelledCount };
  };

  const stats = getTotalStats();

  return (
    <MainLayout>
      <div className="admin-tickets-page">
        <div className="admin-tickets-container">
          {/* 헤더 */}
          <div className="admin-tickets-header">
            <div className="admin-tickets-header-text">
              <h1 className="admin-tickets-title">예매 관리</h1>
              <p className="admin-tickets-subtitle">전체 {filteredTickets.length}건</p>
            </div>
          </div>

          {/* 통계 */}
          <div className="admin-tickets-stats-grid">
            <div className="admin-tickets-stat-card">
              <p className="admin-tickets-stat-label">총 예매 건수</p>
              <h2 className="admin-tickets-stat-value">{stats.totalTickets}</h2>
            </div>
            <div className="admin-tickets-stat-card">
              <p className="admin-tickets-stat-label">총 매출</p>
              <h2 className="admin-tickets-stat-value">{formatPrice(stats.totalRevenue)}</h2>
            </div>
            <div className="admin-tickets-stat-card">
              <p className="admin-tickets-stat-label">취소 건수</p>
              <h2 className="admin-tickets-stat-value">{stats.cancelledCount}</h2>
            </div>
          </div>

          {/* 검색 */}
          <div className="admin-tickets-search-card">
            <div className="admin-tickets-search-wrapper">
              <IconifyIcon icon="mdi:magnify" width={20} height={20} className="admin-tickets-search-icon" />
              <input
                type="text"
                className="admin-tickets-search-input"
                placeholder="예매번호, 이메일, 공연명으로 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* 테이블 */}
          <div className="admin-tickets-table-card">
            <table className="admin-tickets-table">
              <thead>
                <tr>
                  <th>예매번호</th>
                  <th>예매자</th>
                  <th>공연명</th>
                  <th>관람일</th>
                  <th>좌석수</th>
                  <th>금액</th>
                  <th>상태</th>
                  <th className="admin-tickets-th-action">액션</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="admin-tickets-empty-cell">
                      <p className="admin-tickets-loading-text">로딩 중...</p>
                    </td>
                  </tr>
                ) : filteredTickets.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="admin-tickets-empty-cell">
                      <p className="admin-tickets-empty-text">예매 내역이 없습니다</p>
                      <p className="admin-tickets-empty-subtext">
                        실제 예매 데이터는 Firestore의 'orders' 컬렉션에서 가져옵니다.
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredTickets.map((ticket) => (
                    <tr key={ticket.orderId} className="admin-tickets-table-row">
                      <td>
                        <p className="admin-tickets-order-id">{ticket.orderId.slice(0, 12)}...</p>
                      </td>
                      <td>
                        <p className="admin-tickets-email">{ticket.userEmail}</p>
                      </td>
                      <td>
                        <p className="admin-tickets-show-title">{ticket.showTitle}</p>
                      </td>
                      <td>
                        <p className="admin-tickets-date">{formatDate(ticket.date)}</p>
                      </td>
                      <td>
                        <p className="admin-tickets-seat-count">{ticket.seats.length}매</p>
                      </td>
                      <td>
                        <p className="admin-tickets-amount">{formatPrice(ticket.totalAmount)}</p>
                      </td>
                      <td>{getStatusChip(ticket.status)}</td>
                      <td className="admin-tickets-td-action">
                        <button
                          className="admin-tickets-action-button"
                          onClick={(e) => handleMenuOpen(e, ticket)}
                        >
                          <IconifyIcon icon="mdi:dots-vertical" width={20} height={20} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* 액션 메뉴 */}
          {anchorEl && (
            <div
              className="admin-tickets-action-menu"
              style={{ top: anchorEl.offsetTop + 30, left: anchorEl.offsetLeft }}
            >
              <button className="admin-tickets-menu-item" onClick={handleView}>
                <IconifyIcon icon="mdi:eye" width={20} height={20} />
                상세 보기
              </button>
              {selectedTicket?.status === "confirmed" && (
                <button className="admin-tickets-menu-item admin-tickets-menu-item-danger" onClick={handleCancelClick}>
                  <IconifyIcon icon="mdi:close" width={20} height={20} />
                  취소 처리
                </button>
              )}
            </div>
          )}

          {/* 취소 확인 다이얼로그 */}
          {cancelDialogOpen && (
            <div className="admin-tickets-dialog-overlay" onClick={() => setCancelDialogOpen(false)}>
              <div className="admin-tickets-dialog" onClick={(e) => e.stopPropagation()}>
                <h2 className="admin-tickets-dialog-title">예매 취소</h2>
                <div className="admin-tickets-dialog-content">
                  <div className="admin-tickets-dialog-warning">
                    <IconifyIcon icon="mdi:alert" width={24} height={24} />
                    <p>관리자 권한으로 취소 처리합니다.</p>
                  </div>
                  <div className="admin-tickets-dialog-info">
                    <p><strong>예매번호:</strong> {selectedTicket?.orderId.slice(0, 16)}...</p>
                    <p><strong>예매자:</strong> {selectedTicket?.userEmail}</p>
                    <p><strong>공연:</strong> {selectedTicket?.showTitle}</p>
                  </div>
                  <p className="admin-tickets-dialog-note">
                    취소 후 환불 처리는 별도로 진행해야 합니다.
                  </p>
                </div>
                <div className="admin-tickets-dialog-actions">
                  <button
                    className="admin-tickets-dialog-button admin-tickets-dialog-button-cancel"
                    onClick={() => setCancelDialogOpen(false)}
                    disabled={updating}
                  >
                    취소
                  </button>
                  <button
                    className="admin-tickets-dialog-button admin-tickets-dialog-button-danger"
                    onClick={handleCancel}
                    disabled={updating}
                  >
                    {updating ? "처리 중..." : "취소 처리"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
