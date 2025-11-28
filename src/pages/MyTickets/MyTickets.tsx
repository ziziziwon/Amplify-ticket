import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import IconifyIcon from "../../components/Icon/IconifyIcon";
import QRCode from "react-qr-code";
import MainLayout from "../../components/Layout/MainLayout";
import showsData from "../../data/shows.json";
import venuesData from "../../data/venues.json";
import { Show, Venue } from "../../types";
import { useTicketStore } from "../../stores/useTicketStore";
import { formatDate, formatPrice } from "../../utils/formatters";
import { doc, getDoc, collection, getDocs, query, orderBy, updateDoc, where, deleteDoc } from "firebase/firestore";
import { db } from "../../firebase";
import "./MyTickets.css";

export default function MyTickets() {
  const navigate = useNavigate();
  const { currentOrder, user } = useTicketStore();
  const [selectedTab, setSelectedTab] = useState(0);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);

  const shows = showsData as unknown as Show[];
  const venues = venuesData as Venue[];

  // Firestore에서 사용자 프로필 및 티켓 가져오기
  useEffect(() => {
    const fetchData = async () => {
      if (user?.uid) {
        try {
          setLoading(true);
          
          // 프로필 가져오기
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            setUserProfile(userDoc.data());
          }

          // 티켓 가져오기 (users/{uid}/tickets)
          try {
            const ticketsQuery = query(
              collection(db, "users", user.uid, "tickets"),
              orderBy("purchasedAt", "desc")
            );
            const ticketsSnapshot = await getDocs(ticketsQuery);
            let ticketsData = ticketsSnapshot.docs
              .map((doc) => {
                const data = doc.data();
                // 문서가 존재하고 필수 필드가 있는 경우만 반환
                if (!data || (!data.orderId && !doc.id) || !data.date) {
                  return null;
                }
                return {
                  id: doc.id,
                  ...data,
                  // purchasedAt이 Timestamp인 경우 Date로 변환
                  purchasedAt: data.purchasedAt?.toDate ? data.purchasedAt.toDate() : data.purchasedAt,
                  createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt,
                };
              })
              .filter((ticket: any) => ticket !== null); // null 값 제거
            
            // tickets에 공연 정보가 없으면 orders에서 가져오기
            if (ticketsData.length > 0) {
              try {
                const ordersQuery = query(
                  collection(db, "orders"),
                  orderBy("createdAt", "desc")
                );
                const ordersSnapshot = await getDocs(ordersQuery);
                const ordersData = ordersSnapshot.docs.map((doc) => {
                  const data = doc.data();
                  return {
                    id: doc.id,
                    orderId: data.orderId || doc.id,
                    ...data,
                  };
                });
                
                // tickets와 orders를 orderId로 매칭하여 공연 정보 보완
                ticketsData = ticketsData.map((ticket: any) => {
                  const order: any = ordersData.find((o: any) => o.orderId === ticket.orderId);
                  if (order && !ticket.title) {
                    // 공연 정보가 없으면 order에서 가져오기
                    return {
                      ...ticket,
                      title: order.title || ticket.artist,
                      subtitle: order.subtitle || ticket.tourName,
                      poster: order.poster || ticket.posterUrl,
                      posterUrl: order.poster || order.posterUrl || ticket.posterUrl,
                      venue: order.venue || ticket.venue,
                      hall: order.hall || ticket.hall,
                      runtime: order.runtime || ticket.runtime,
                      ageLimit: order.ageLimit || ticket.ageLimit,
                    };
                  }
                  return ticket;
                });
              } catch (ordersError) {
                console.warn("orders 조회 실패:", ordersError);
              }
            }
            
            // 먼저 날짜순 정렬 (최신순) - 중복 제거 전에 정렬
            ticketsData.sort((a: any, b: any) => {
              const aTime = a.purchasedAt ? new Date(a.purchasedAt).getTime() : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
              const bTime = b.purchasedAt ? new Date(b.purchasedAt).getTime() : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
              return bTime - aTime;
            });
            
            // 유효한 티켓만 필터링 및 중복 제거
            // 1차: orderId 기준 중복 제거 (가장 최신 것만 유지)
            // 2차: 같은 공연(showId), 같은 날짜(date), 같은 금액(totalPrice)인 경우 하나만 유지
            const seenOrderIds = new Set<string>();
            const seenTicketKeys = new Set<string>();
            
            const uniqueTickets = ticketsData
              .filter((ticket: any) => {
                // 필수 필드가 있는 티켓만 유지
                if (!ticket || !ticket.date) return false;
                
                const orderId = ticket.orderId || ticket.id;
                if (!orderId) return false;
                
                // orderId 기준으로 중복 제거 (이미 정렬되어 있으므로 첫 번째만 유지)
                if (seenOrderIds.has(orderId)) {
                  return false; // 이미 본 orderId는 제외
                }
                seenOrderIds.add(orderId);
                
                // 같은 공연, 날짜, 금액인 경우 중복 제거
                const ticketKey = `${ticket.showId || ''}_${ticket.date || ''}_${ticket.totalPrice || 0}`;
                if (seenTicketKeys.has(ticketKey)) {
                  return false; // 이미 본 조합은 제외
                }
                seenTicketKeys.add(ticketKey);
                
                return true;
              });
            
            setTickets(uniqueTickets);
          } catch (queryError: any) {
            // purchasedAt 인덱스가 없을 수 있으므로, 인덱스 없이도 가져오기 시도
            console.warn("purchasedAt 정렬 실패, 전체 조회:", queryError);
            const ticketsSnapshot = await getDocs(collection(db, "users", user.uid, "tickets"));
            let ticketsData = ticketsSnapshot.docs
              .map((docSnapshot) => {
                const data = docSnapshot.data();
                // 문서가 존재하고 필수 필드가 있는 경우만 반환
                if (!data || (!data.orderId && !docSnapshot.id) || !data.date) {
                  return null;
                }
                return {
                  id: docSnapshot.id,
                  ...data,
                  purchasedAt: data.purchasedAt?.toDate ? data.purchasedAt.toDate() : data.purchasedAt,
                  createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt,
                };
              })
              .filter((ticket: any) => ticket !== null); // null 값 제거
            
            // orders에서 공연 정보 보완
            try {
              const ordersSnapshot = await getDocs(collection(db, "orders"));
              const ordersData = ordersSnapshot.docs.map((doc) => {
                const data = doc.data();
                return {
                  id: doc.id,
                  orderId: data.orderId || doc.id,
                  ...data,
                };
              });
              
              ticketsData = ticketsData.map((ticket: any) => {
                const order: any = ordersData.find((o: any) => o.orderId === ticket.orderId);
                if (order && !ticket.title) {
                  return {
                    ...ticket,
                    title: order.title || ticket.artist,
                    subtitle: order.subtitle || ticket.tourName,
                    poster: order.poster || ticket.posterUrl,
                    posterUrl: order.poster || order.posterUrl || ticket.posterUrl,
                    venue: order.venue || ticket.venue,
                    hall: order.hall || ticket.hall,
                    runtime: order.runtime || ticket.runtime,
                    ageLimit: order.ageLimit || ticket.ageLimit,
                  };
                }
                return ticket;
              });
            } catch (err) {
              console.error("orders 조회 실패:", err);
            }
            
            // null 값 제거
            ticketsData = ticketsData.filter((ticket: any) => ticket !== null);
            
            // 먼저 날짜순 정렬 (최신순) - 중복 제거 전에 정렬
            ticketsData.sort((a, b) => {
              const aTime = a?.purchasedAt ? new Date(a.purchasedAt).getTime() : (a?.createdAt ? new Date(a.createdAt).getTime() : 0);
              const bTime = b?.purchasedAt ? new Date(b.purchasedAt).getTime() : (b?.createdAt ? new Date(b.createdAt).getTime() : 0);
              return bTime - aTime;
            });
            
            // 유효한 티켓만 필터링 및 중복 제거
            // 1차: orderId 기준 중복 제거 (가장 최신 것만 유지)
            // 2차: 같은 공연(showId), 같은 날짜(date), 같은 금액(totalPrice)인 경우 하나만 유지
            const seenOrderIds = new Set<string>();
            const seenTicketKeys = new Set<string>();
            const ticketsToDelete: Array<{ docId: string; orderId: string }> = [];
            
            const uniqueTickets = ticketsData
              .filter((ticket: any) => {
                // 필수 필드가 있는 티켓만 유지
                if (!ticket || !ticket.date) {
                  // 유효하지 않은 티켓은 삭제 대상에 추가
                  if (ticket && ticket.id) {
                    ticketsToDelete.push({ docId: ticket.id, orderId: ticket.orderId || ticket.id });
                  }
                  return false;
                }
                
                const orderId = ticket.orderId || ticket.id;
                if (!orderId) {
                  if (ticket.id) {
                    ticketsToDelete.push({ docId: ticket.id, orderId: "" });
                  }
                  return false;
                }
                
                // orderId 기준으로 중복 제거 (이미 정렬되어 있으므로 첫 번째만 유지)
                if (seenOrderIds.has(orderId)) {
                  // 중복된 티켓은 삭제 대상에 추가
                  ticketsToDelete.push({ docId: ticket.id, orderId });
                  return false; // 이미 본 orderId는 제외
                }
                seenOrderIds.add(orderId);
                
                // 같은 공연, 날짜, 금액인 경우 중복 제거
                const ticketKey = `${ticket.showId || ''}_${ticket.date || ''}_${ticket.totalPrice || 0}`;
                if (seenTicketKeys.has(ticketKey)) {
                  // 중복된 티켓은 삭제 대상에 추가
                  ticketsToDelete.push({ docId: ticket.id, orderId });
                  return false; // 이미 본 조합은 제외
                }
                seenTicketKeys.add(ticketKey);
                
                return true;
              });
            
            // 중복 및 유효하지 않은 티켓을 Firestore에서 삭제
            if (ticketsToDelete.length > 0) {
              try {
                const deletePromises = ticketsToDelete.map(({ docId }) => {
                  if (docId) {
                    return deleteDoc(doc(db, "users", user.uid, "tickets", docId)).catch((err) => {
                      console.warn(`티켓 삭제 실패 (${docId}):`, err);
                    });
                  }
                  return Promise.resolve();
                });
                await Promise.all(deletePromises);
                console.log(`중복/유효하지 않은 티켓 ${ticketsToDelete.length}개 삭제 완료`);
              } catch (error) {
                console.error("티켓 삭제 중 오류:", error);
              }
            }
            
            setTickets(uniqueTickets);
          }
        } catch (error) {
          console.error("데이터 로딩 실패:", error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchData();
  }, [user]);

  // 취소 모달 열기
  const handleOpenCancelModal = (ticket: any) => {
    setSelectedTicket(ticket);
    setShowCancelModal(true);
  };

  // 취소 모달 닫기
  const handleCloseCancelModal = () => {
    setShowCancelModal(false);
    setSelectedTicket(null);
  };

  // 티켓 취소 함수
  const handleCancelTicket = async () => {
    if (!user?.uid || !selectedTicket) {
      alert("로그인이 필요합니다.");
      handleCloseCancelModal();
      return;
    }

    const ticket = selectedTicket;
    const orderId = ticket.orderId || ticket.id;
    const ticketId = ticket.id;
    
    // 취소 가능 여부 확인
    const isCancelled = ticket.status === "cancelled";
    const hasValidDate = ticket.date && ticket.date.trim() !== "";
    let isFutureDate = false;
    
    if (hasValidDate) {
      try {
        const ticketDate = new Date(ticket.date);
        const now = new Date();
        ticketDate.setHours(0, 0, 0, 0);
        now.setHours(0, 0, 0, 0);
        isFutureDate = ticketDate >= now;
      } catch (e) {
        isFutureDate = false;
      }
    }
    
    if (isCancelled) {
      alert("이미 취소된 티켓입니다.");
      handleCloseCancelModal();
      return;
    }
    
    if (!hasValidDate || !isFutureDate) {
      alert("취소 가능한 기간이 지났거나 유효하지 않은 티켓입니다.");
      handleCloseCancelModal();
      return;
    }

    try {
      setCancellingId(orderId);

      // users/{uid}/tickets/{ticketId} 업데이트
      if (ticketId) {
        const ticketRef = doc(db, "users", user.uid, "tickets", ticketId);
        await updateDoc(ticketRef, {
          status: "cancelled",
          cancelledAt: new Date(),
        });
      }

      // orders/{orderId} 업데이트
      if (orderId) {
        try {
          const ordersQuery = query(
            collection(db, "orders"),
            where("orderId", "==", orderId)
          );
          const ordersSnapshot = await getDocs(ordersQuery);
          
          if (!ordersSnapshot.empty) {
            const orderDoc = ordersSnapshot.docs[0];
            await updateDoc(orderDoc.ref, {
              status: "cancelled",
              cancelledAt: new Date(),
            });
          }
        } catch (orderError) {
          console.warn("orders 업데이트 실패:", orderError);
          // tickets 업데이트는 성공했으므로 계속 진행
        }
      }

      // 로컬 상태 업데이트
      setTickets((prevTickets) =>
        prevTickets.map((t) =>
          (t.orderId === orderId || t.id === ticketId)
            ? { ...t, status: "cancelled", cancelledAt: new Date() }
            : t
        )
      );

      alert("예매가 취소되었습니다.");
    } catch (error: any) {
      console.error("예매 취소 실패:", error);
      alert(`예매 취소에 실패했습니다: ${error.message || "알 수 없는 오류"}`);
    } finally {
      setCancellingId(null);
    }
  };

  // 로그인 체크
  if (!user) {
    return (
      <MainLayout>
        <div className="mytickets-container mytickets-login-required">
          <h2 className="mytickets-login-title">로그인이 필요합니다</h2>
          <p className="mytickets-login-text">티켓을 확인하려면 로그인해주세요</p>
          <button
            className="mytickets-login-button"
            onClick={() => navigate("/login")}
          >
            로그인하기
          </button>
        </div>
      </MainLayout>
    );
  }

  // 티켓 목록은 이미 useEffect에서 중복 제거되어 있으므로 그대로 사용
  const orders = tickets.length > 0 ? tickets : (currentOrder ? [currentOrder] : []);

  return (
    <MainLayout>
      <div className="mytickets-container">
        {/* 프로필 카드 */}
        <div className="mytickets-profile-card">
          <div className="mytickets-profile-content">
            {/* 왼쪽: 프로필 정보 */}
            <div className="mytickets-profile-info">
              <div className="mytickets-avatar">
                <IconifyIcon icon="mdi:account-circle-outline" width={50} height={50} />
              </div>
              <div className="mytickets-profile-details">
                <div className="mytickets-profile-header">
                  <h3 className="mytickets-profile-email">{user.email}</h3>
                  <span className="mytickets-provider-chip">
                    {userProfile?.provider === "google" ? "Google 로그인" : "이메일 로그인"}
                  </span>
                </div>
                <p className="mytickets-profile-name">
                  {userProfile?.nickname || user.displayName || "회원"}님
                </p>
              </div>
            </div>

            {/* 오른쪽: 통계 */}
            <div className="mytickets-stats">
              <div className="mytickets-stat-item">
                <h4 className="mytickets-stat-value">{orders.length}</h4>
                <p className="mytickets-stat-label">예매내역</p>
              </div>
              <div className="mytickets-stat-item">
                <h4 className="mytickets-stat-value">0</h4>
                <p className="mytickets-stat-label">할인쿠폰</p>
              </div>
              <div className="mytickets-stat-item">
                <h4 className="mytickets-stat-value">0</h4>
                <p className="mytickets-stat-label">공연예매권</p>
              </div>
            </div>
          </div>
        </div>

        {/* 탭 메뉴 */}
        <div className="mytickets-tabs-container">
          <ul className="mytickets-tabs-list">
            <li>
              <button
                className={`mytickets-tab ${selectedTab === 0 ? "active" : ""}`}
                onClick={() => setSelectedTab(0)}
              >
                <IconifyIcon icon="mdi:ticket-confirmation-outline" width={20} height={20} />
                마이티켓 홈
              </button>
            </li>
            <li>
              <button
                className={`mytickets-tab ${selectedTab === 1 ? "active" : ""}`}
                onClick={() => setSelectedTab(1)}
              >
                <IconifyIcon icon="mdi:ticket-outline" width={20} height={20} />
                예매확인/취소
              </button>
            </li>
            <li>
              <button
                className={`mytickets-tab ${selectedTab === 2 ? "active" : ""}`}
                onClick={() => setSelectedTab(2)}
              >
                <IconifyIcon icon="mdi:gift-outline" width={20} height={20} />
                할인쿠폰
              </button>
            </li>
          </ul>
        </div>

        {/* 콘텐츠 영역 */}
        {selectedTab === 0 && (
          <div className="mytickets-content">
            {/* 최근 예매섹션 */}
            <div className="mytickets-section">
              <h2 className="mytickets-section-title">최근 예매</h2>

              {loading ? (
                <div className="mytickets-loading">
                  <div className="mytickets-spinner"></div>
                  <p>티켓을 불러오는 중...</p>
                </div>
              ) : orders.length === 0 ? (
                <div className="mytickets-empty-state">
                  <p className="mytickets-empty-text">예매한 티켓이 없습니다</p>
                  <button
                    className="mytickets-empty-button"
                    onClick={() => navigate("/shows")}
                  >
                    공연 둘러보기
                  </button>
                </div>
              ) : (
                <div className="mytickets-orders-list">
                  {orders.map((ticket) => {
                    const foundShow = shows.find((s) => s.showId === ticket.showId);
                    const show = foundShow || {
                      showId: ticket.showId,
                      artist: ticket.artist,
                      tourName: ticket.tourName,
                      posterUrl: ticket.posterUrl,
                      venueId: ticket.venueId || "",
                    };
                    const venueId = foundShow?.venueId || ticket.venueId;
                    const venue = venueId ? venues.find((v) => v.venueId === venueId) : null;
                    const orderId = ticket.orderId || ticket.id;

                    return (
                      <div
                        key={ticket.id || orderId}
                        className="mytickets-order-card"
                        onClick={() => navigate(`/tickets/${orderId}`)}
                      >
                        <div className="mytickets-order-grid">
                          {/* 예매일 */}
                          <div className="mytickets-order-date">
                            <span className="mytickets-order-label">예매일</span>
                            <span className="mytickets-order-value">
                              {ticket.purchasedAt
                                ? (ticket.purchasedAt instanceof Date
                                    ? ticket.purchasedAt.toLocaleDateString("ko-KR")
                                    : ticket.purchasedAt?.toDate
                                    ? ticket.purchasedAt.toDate().toLocaleDateString("ko-KR")
                                    : new Date(ticket.purchasedAt).toLocaleDateString("ko-KR"))
                                : ticket.createdAt
                                ? (ticket.createdAt instanceof Date
                                    ? ticket.createdAt.toLocaleDateString("ko-KR")
                                    : new Date(ticket.createdAt).toLocaleDateString("ko-KR"))
                                : "-"}
                            </span>
                          </div>

                          {/* 공연정보 */}
                          <div className="mytickets-order-show">
                            {(ticket.poster || ticket.posterUrl) && (
                              <img
                                src={ticket.poster || ticket.posterUrl}
                                alt={ticket.title || ticket.artist || "공연"}
                                className="mytickets-order-poster"
                              />
                            )}
                            <div className="mytickets-order-show-info">
                              <span className="mytickets-order-status-chip">티켓발급</span>
                              <h4 className="mytickets-order-artist">
                                {ticket.title || ticket.artist || "공연"}
                              </h4>
                              {ticket.subtitle && (
                                <p className="mytickets-order-subtitle">{ticket.subtitle}</p>
                              )}
                              <p className="mytickets-order-venue">
                                {formatDate(ticket.date)} {ticket.time && `· ${ticket.time}`}
                                {ticket.venue && ` · ${ticket.venue}`}
                                {!ticket.venue && venue && ` · ${venue.name}`}
                              </p>
                              {ticket.hall && (
                                <p className="mytickets-order-hall">{ticket.hall}</p>
                              )}
                            </div>
                          </div>

                          {/* 예매정보 */}
                          <div className="mytickets-order-details">
                            <span className="mytickets-order-label">예매정보</span>
                            <p className="mytickets-order-detail-text">
                              예매번호: {orderId.slice(0, 10)}...
                            </p>
                            <p className="mytickets-order-detail-text">
                              관람일: {formatDate(ticket.date)}
                            </p>
                            <p className="mytickets-order-detail-text">
                              매수: {ticket.seats?.length || 0}매
                            </p>
                            <p className="mytickets-order-detail-text">
                              금액: {formatPrice(ticket.totalPrice || 0)}
                            </p>
                          </div>

                          {/* QR 코드 미리보기 */}
                          <div className="mytickets-order-qr">
                            <QRCode value={ticket.id || orderId} size={80} />
                          </div>

                          {/* 상태 */}
                          <div className="mytickets-order-action">
                            <button className="mytickets-view-button">티켓보기</button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 예매확인/취소 페이지 */}
        {selectedTab === 1 && (
          <div className="mytickets-content">
            <div className="mytickets-section">
              <h2 className="mytickets-section-title">예매확인/취소</h2>

              {loading ? (
                <div className="mytickets-loading">
                  <div className="mytickets-spinner"></div>
                  <p>티켓을 불러오는 중...</p>
                </div>
              ) : orders.length === 0 ? (
                <div className="mytickets-empty-state">
                  <p className="mytickets-empty-text">예매한 티켓이 없습니다</p>
                  <button
                    className="mytickets-empty-button"
                    onClick={() => navigate("/shows")}
                  >
                    공연 둘러보기
                  </button>
                </div>
              ) : (
                <div className="mytickets-orders-list">
                  {orders.map((ticket) => {
                    const orderId = ticket.orderId || ticket.id;
                    // 취소 가능 조건: 취소되지 않았고, 공연일이 아직 지나지 않은 경우
                    // status가 없거나 "confirmed"인 경우도 취소 가능
                    const isCancelled = ticket.status === "cancelled";
                    const hasValidDate = ticket.date && ticket.date.trim() !== "";
                    let isFutureDate = false;
                    
                    if (hasValidDate) {
                      try {
                        const ticketDate = new Date(ticket.date);
                        const now = new Date();
                        // 날짜만 비교 (시간 제외)
                        ticketDate.setHours(0, 0, 0, 0);
                        now.setHours(0, 0, 0, 0);
                        isFutureDate = ticketDate >= now;
                      } catch (e) {
                        // 날짜 파싱 실패 시 취소 불가로 처리
                        isFutureDate = false;
                      }
                    }
                    
                    const canCancel = !isCancelled && hasValidDate && isFutureDate;

                    return (
                      <div
                        key={ticket.id || orderId}
                        className="mytickets-order-card"
                      >
                        <div className="mytickets-order-grid">
                          {/* 예매일 */}
                          <div className="mytickets-order-date">
                            <span className="mytickets-order-label">예매일</span>
                            <span className="mytickets-order-value">
                              {ticket.purchasedAt
                                ? (ticket.purchasedAt instanceof Date
                                    ? ticket.purchasedAt.toLocaleDateString("ko-KR")
                                    : ticket.purchasedAt?.toDate
                                    ? ticket.purchasedAt.toDate().toLocaleDateString("ko-KR")
                                    : new Date(ticket.purchasedAt).toLocaleDateString("ko-KR"))
                                : ticket.createdAt
                                ? (ticket.createdAt instanceof Date
                                    ? ticket.createdAt.toLocaleDateString("ko-KR")
                                    : new Date(ticket.createdAt).toLocaleDateString("ko-KR"))
                                : "-"}
                            </span>
                          </div>

                          {/* 공연정보 */}
                          <div className="mytickets-order-show">
                            {(ticket.poster || ticket.posterUrl) && (
                              <img
                                src={ticket.poster || ticket.posterUrl}
                                alt={ticket.title || ticket.artist || "공연"}
                                className="mytickets-order-poster"
                              />
                            )}
                            <div className="mytickets-order-show-info">
                              <span className={`mytickets-order-status-chip ${
                                ticket.status === "cancelled" ? "cancelled" : ""
                              }`}>
                                {ticket.status === "cancelled" ? "취소됨" : "티켓발급"}
                              </span>
                              <h4 className="mytickets-order-artist">
                                {ticket.title || ticket.artist || "공연"}
                              </h4>
                              {ticket.subtitle && (
                                <p className="mytickets-order-subtitle">{ticket.subtitle}</p>
                              )}
                              <p className="mytickets-order-venue">
                                {formatDate(ticket.date)} {ticket.time && `· ${ticket.time}`}
                                {ticket.venue && ` · ${ticket.venue}`}
                              </p>
                              {ticket.hall && (
                                <p className="mytickets-order-hall">{ticket.hall}</p>
                              )}
                            </div>
                          </div>

                          {/* 예매정보 */}
                          <div className="mytickets-order-details">
                            <span className="mytickets-order-label">예매정보</span>
                            <p className="mytickets-order-detail-text">
                              예매번호: {orderId}
                            </p>
                            <p className="mytickets-order-detail-text">
                              관람일: {formatDate(ticket.date)}
                            </p>
                            <p className="mytickets-order-detail-text">
                              매수: {ticket.seats?.length || 0}매
                            </p>
                            <p className="mytickets-order-detail-text">
                              금액: {formatPrice(ticket.totalPrice || 0)}
                            </p>
                          </div>

                          {/* 액션 버튼 */}
                          <div className="mytickets-order-action">
                            
                            {ticket.status === "cancelled" ? (
                              <span className="mytickets-cancelled-badge">취소됨</span>
                            ) : (
                              <button
                                className="mytickets-order-cancel-button"
                                onClick={() => handleOpenCancelModal(ticket)}
                                disabled={cancellingId === orderId}
                              >
                                <IconifyIcon icon="mdi:close-circle" width={16} height={16} />
                                {cancellingId === orderId ? "취소 중..." : "취소"}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {selectedTab === 2 && (
          <div className="mytickets-empty-state">
            <p className="mytickets-empty-text">사용 가능한 쿠폰이 없습니다</p>
          </div>
        )}

        {/* 취소 확인 모달 */}
        {showCancelModal && selectedTicket && (
          <div className="mytickets-modal-overlay" onClick={handleCloseCancelModal}>
            <div className="mytickets-modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="mytickets-modal-header">
                <h3 className="mytickets-modal-title">예매 취소 확인</h3>
                <button
                  className="mytickets-modal-close"
                  onClick={handleCloseCancelModal}
                >
                  <IconifyIcon icon="mdi:close" width={24} height={24} />
                </button>
              </div>
              
              <div className="mytickets-modal-body">
                <div className="mytickets-modal-warning">
                  <IconifyIcon icon="mdi:alert-circle" width={48} height={48} />
                  <p className="mytickets-modal-warning-text">
                    정말 예매를 취소하시겠습니까?
                  </p>
                </div>

                <div className="mytickets-modal-ticket-info">
                  <div className="mytickets-modal-info-row">
                    <span className="mytickets-modal-info-label">공연명</span>
                    <span className="mytickets-modal-info-value">
                      {selectedTicket.title || selectedTicket.artist || "공연"}
                    </span>
                  </div>
                  <div className="mytickets-modal-info-row">
                    <span className="mytickets-modal-info-label">관람일</span>
                    <span className="mytickets-modal-info-value">
                      {formatDate(selectedTicket.date)} {selectedTicket.time && `· ${selectedTicket.time}`}
                    </span>
                  </div>
                  <div className="mytickets-modal-info-row">
                    <span className="mytickets-modal-info-label">예매번호</span>
                    <span className="mytickets-modal-info-value">
                      {selectedTicket.orderId || selectedTicket.id}
                    </span>
                  </div>
                  <div className="mytickets-modal-info-row">
                    <span className="mytickets-modal-info-label">결제 금액</span>
                    <span className="mytickets-modal-info-value mytickets-modal-price">
                      {formatPrice(selectedTicket.totalPrice || 0)}
                    </span>
                  </div>
                </div>

                <div className="mytickets-modal-notice">
                  <p className="mytickets-modal-notice-text">
                    ⚠️ 취소 후 환불은 영업일 기준 3-5일 소요됩니다.
                  </p>
                  <p className="mytickets-modal-notice-text">
                    ⚠️ 공연일 7일 이내 취소 시 취소 수수료가 발생할 수 있습니다.
                  </p>
                </div>
              </div>

              <div className="mytickets-modal-footer">
                <button
                  className="mytickets-modal-button mytickets-modal-button-cancel"
                  onClick={handleCloseCancelModal}
                >
                  돌아가기
                </button>
                <button
                  className="mytickets-modal-button mytickets-modal-button-confirm"
                  onClick={handleCancelTicket}
                  disabled={cancellingId === (selectedTicket.orderId || selectedTicket.id)}
                >
                  {cancellingId === (selectedTicket.orderId || selectedTicket.id) ? (
                    <>
                      <div className="mytickets-modal-spinner-small"></div>
                      취소 중...
                    </>
                  ) : (
                    "예매 취소하기"
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
