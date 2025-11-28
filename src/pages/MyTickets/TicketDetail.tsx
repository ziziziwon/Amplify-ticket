import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import IconifyIcon from "../../components/Icon/IconifyIcon";
import QRCode from "react-qr-code";
import MainLayout from "../../components/Layout/MainLayout";
import showsData from "../../data/shows.json";
import venuesData from "../../data/venues.json";
import { Show, Venue } from "../../types";
import { useTicketStore } from "../../stores/useTicketStore";
import { formatDate, formatTime, formatSeatInfo, formatPrice } from "../../utils/formatters";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../../firebase";
import "./TicketDetail.css";

export default function TicketDetail() {
  const navigate = useNavigate();
  const { orderId } = useParams<{ orderId: string }>();
  const { currentOrder, user } = useTicketStore();
  const [ticket, setTicket] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const shows = showsData as unknown as Show[];
  const venues = venuesData as Venue[];

  // Firestore에서 티켓 정보 가져오기
  useEffect(() => {
    const fetchTicket = async () => {
      if (!orderId || !user?.uid) {
        setError("주문 정보를 찾을 수 없습니다.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // users/{uid}/tickets에서 orderId로 찾기
        const ticketsQuery = query(
          collection(db, "users", user.uid, "tickets"),
          where("orderId", "==", orderId)
        );
        const ticketsSnapshot = await getDocs(ticketsQuery);

        if (!ticketsSnapshot.empty) {
          const ticketDoc = ticketsSnapshot.docs[0];
          const ticketData = {
            id: ticketDoc.id,
            ...ticketDoc.data(),
            purchasedAt: ticketDoc.data().purchasedAt?.toDate 
              ? ticketDoc.data().purchasedAt.toDate() 
              : ticketDoc.data().purchasedAt,
          };
          setTicket(ticketData);
        } else {
          // orders 컬렉션에서도 찾기 시도
          const ordersQuery = query(
            collection(db, "orders"),
            where("orderId", "==", orderId)
          );
          const ordersSnapshot = await getDocs(ordersQuery);

          if (!ordersSnapshot.empty) {
            const orderDoc = ordersSnapshot.docs[0];
            const orderData = {
              id: orderDoc.id,
              ...orderDoc.data(),
            };
            setTicket(orderData);
          } else {
            setError("티켓을 찾을 수 없습니다.");
          }
        }
      } catch (err: any) {
        console.error("티켓 조회 실패:", err);
        setError(err.message || "티켓을 불러오는데 실패했습니다.");
      } finally {
        setLoading(false);
      }
    };

    fetchTicket();
  }, [orderId, user]);

  if (loading) {
    return (
      <MainLayout>
        <div className="ticketdetail-container">
          <div className="ticketdetail-loading">
            <div className="ticketdetail-spinner"></div>
            <p>티켓을 불러오는 중...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (error || !ticket) {
    return (
      <MainLayout>
        <div className="ticketdetail-container ticketdetail-error-container">
          <h2 className="ticketdetail-error-title">티켓을 찾을 수 없습니다</h2>
          <p className="ticketdetail-error-text">{error || "티켓 정보가 없습니다."}</p>
          <button
            className="ticketdetail-error-button"
            onClick={() => navigate("/tickets")}
          >
            마이티켓으로 이동
          </button>
        </div>
      </MainLayout>
    );
  }

  const show = shows.find((s) => s.showId === ticket.showId) || {
    showId: ticket.showId,
    artist: ticket.title || ticket.artist || "공연",
    tourName: ticket.subtitle || ticket.tourName || "",
    posterUrl: ticket.poster || ticket.posterUrl || "",
    venueId: ticket.venueId || "",
  } as Show;
  
  const venue = ticket.venue 
    ? { name: ticket.venue } as Venue
    : (show.venueId ? venues.find((v) => v.venueId === show.venueId) : null);

  return (
    <MainLayout>
      <div className="ticketdetail-container">
        {/* 헤더 */}
        <div className="ticketdetail-header">
          <button
            className="ticketdetail-back-button"
            onClick={() => navigate("/tickets")}
          >
            <IconifyIcon icon="mdi:arrow-left" width={24} height={24} />
          </button>
          <h1 className="ticketdetail-title">티켓 상세</h1>
        </div>

        {/* 티켓 카드 */}
        <div className="ticketdetail-card">
          {/* 헤더 - 공연 정보 */}
          <div className="ticketdetail-card-header">
            <span className={`ticketdetail-status-chip ${
              ticket.status === "cancelled" ? "cancelled" : ""
            }`}>
              {ticket.status === "cancelled" ? "취소됨" : "티켓발급완료"}
            </span>
            <h2 className="ticketdetail-artist">{show.artist}</h2>
            {show.tourName && (
              <h3 className="ticketdetail-tourname">{show.tourName}</h3>
            )}
          </div>

          <div className="ticketdetail-card-content">
            {/* QR 코드 */}
            <div className="ticketdetail-qr-section">
              <p className="ticketdetail-qr-label">입장 시 아래 QR코드를 제시해주세요</p>
              <div className="ticketdetail-qr-wrapper">
                <QRCode value={ticket.qrCodeUrl || ticket.orderId || orderId || ""} size={220} />
              </div>
              <p className="ticketdetail-qr-orderid">예매번호: {ticket.orderId || orderId}</p>
            </div>

            <hr className="ticketdetail-divider" />

            {/* 공연 정보 */}
            <div className="ticketdetail-info-section">
              <h3 className="ticketdetail-info-title">공연 정보</h3>
              <div className="ticketdetail-info-grid">
                <div className="ticketdetail-info-item">
                  <span className="ticketdetail-info-label">공연명</span>
                  <span className="ticketdetail-info-value">{show.artist}</span>
                </div>
                {show.tourName && (
                  <div className="ticketdetail-info-item">
                    <span className="ticketdetail-info-label">부제목</span>
                    <span className="ticketdetail-info-value">{show.tourName}</span>
                  </div>
                )}
                <div className="ticketdetail-info-item">
                  <span className="ticketdetail-info-label">관람일</span>
                  <span className="ticketdetail-info-value">
                    {formatDate(ticket.date)} {ticket.time && `· ${ticket.time}`}
                  </span>
                </div>
                {venue && (
                  <div className="ticketdetail-info-item">
                    <span className="ticketdetail-info-label">공연장</span>
                    <span className="ticketdetail-info-value">{venue.name}</span>
                  </div>
                )}
                {ticket.hall && (
                  <div className="ticketdetail-info-item">
                    <span className="ticketdetail-info-label">홀</span>
                    <span className="ticketdetail-info-value">{ticket.hall}</span>
                  </div>
                )}
              </div>
            </div>

            <hr className="ticketdetail-divider" />

            {/* 좌석 정보 */}
            <div className="ticketdetail-info-section">
              <h3 className="ticketdetail-info-title">좌석 정보</h3>
              <div className="ticketdetail-seats-list">
                {ticket.seats && ticket.seats.length > 0 ? (
                  ticket.seats.map((seat: any, index: number) => (
                    <div key={seat.seatId || index} className="ticketdetail-seat-item">
                      <span className="ticketdetail-seat-grade">{seat.grade || seat.zone}석</span>
                      <span className="ticketdetail-seat-info">
                        {seat.section || seat.zone} {seat.row && `${seat.row}열`} {seat.number && `${seat.number}번`}
                      </span>
                      <span className="ticketdetail-seat-price">{formatPrice(seat.price)}</span>
                    </div>
                  ))
                ) : (
                  <p className="ticketdetail-no-seats">좌석 정보가 없습니다</p>
                )}
              </div>
            </div>

            <hr className="ticketdetail-divider" />

            {/* 결제 정보 */}
            <div className="ticketdetail-info-section">
              <h3 className="ticketdetail-info-title">결제 정보</h3>
              <div className="ticketdetail-info-grid">
                <div className="ticketdetail-info-item">
                  <span className="ticketdetail-info-label">결제 금액</span>
                  <span className="ticketdetail-info-value">
                    {formatPrice(ticket.totalPrice || ticket.totalAmount || 0)}
                  </span>
                </div>
                {ticket.buyerInfo && (
                  <>
                    <div className="ticketdetail-info-item">
                      <span className="ticketdetail-info-label">예매자</span>
                      <span className="ticketdetail-info-value">{ticket.buyerInfo.name}</span>
                    </div>
                    <div className="ticketdetail-info-item">
                      <span className="ticketdetail-info-label">연락처</span>
                      <span className="ticketdetail-info-value">{ticket.buyerInfo.phone}</span>
                    </div>
                    <div className="ticketdetail-info-item">
                      <span className="ticketdetail-info-label">이메일</span>
                      <span className="ticketdetail-info-value">{ticket.buyerInfo.email}</span>
                    </div>
                  </>
                )}
                {ticket.paymentMethod && (
                  <div className="ticketdetail-info-item">
                    <span className="ticketdetail-info-label">결제 수단</span>
                    <span className="ticketdetail-info-value">
                      {ticket.paymentMethod === "card" ? "신용카드" :
                       ticket.paymentMethod === "bank" ? "계좌이체" :
                       ticket.paymentMethod === "virtual" ? "가상계좌" :
                       ticket.paymentMethod === "phone" ? "휴대폰 결제" :
                       ticket.paymentMethod}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <hr className="ticketdetail-divider" />

            {/* 총 결제금액 */}
            <div className="ticketdetail-total-section">
              <h3 className="ticketdetail-total-label">총 결제금액</h3>
              <h2 className="ticketdetail-total-value">
                {formatPrice(ticket.totalPrice || ticket.totalAmount || 0)}
              </h2>
            </div>
          </div>
        </div>

        {/* 액션 버튼 */}
        <div className="ticketdetail-actions">
          <button className="ticketdetail-action-button ticketdetail-action-button-primary">
            <IconifyIcon icon="mdi:download" width={20} height={20} />
            티켓 다운로드
          </button>
          <button className="ticketdetail-action-button ticketdetail-action-button-secondary">
            <IconifyIcon icon="mdi:share-variant" width={20} height={20} />
            공유하기
          </button>
        </div>

        {/* 안내사항 */}
        <div className="ticketdetail-notice-box">
          <h3 className="ticketdetail-notice-title">티켓 안내사항</h3>
          <ul className="ticketdetail-notice-list">
            <li>티켓은 공연 당일 입장 시 QR코드를 스캔하여 사용합니다.</li>
            <li>공연 시작 30분 전부터 입장이 가능합니다.</li>
            <li>티켓 취소는 공연 7일 전까지 가능하며, 취소 수수료가 발생할 수 있습니다.</li>
            <li>타인에게 양도 시 공연장 입장이 불가할 수 있으니 유의해 주세요.</li>
          </ul>
        </div>
      </div>
    </MainLayout>
  );
}
