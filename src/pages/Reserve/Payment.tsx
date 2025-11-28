import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import MainLayout from "../../components/Layout/MainLayout";
import IconifyIcon from "../../components/Icon/IconifyIcon";
import { useTicketStore } from "../../stores/useTicketStore";
import { SelectedSeat, Show, PaymentMethod } from "../../types";
import { formatDate, formatPrice } from "../../utils/formatters";
import { PAYMENT_METHODS } from "../../utils/constants";
import { fetchMelonConcertById } from "../../api";
import "./Payment.css";

export default function Payment() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const showId = searchParams.get("showId");
  const date = searchParams.get("date");
  const time = searchParams.get("time");

  const { selectedSeats, user, clearSeats } = useTicketStore();
  const [show, setShow] = useState<Show | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 결제 정보
  const [buyerInfo, setBuyerInfo] = useState({
    name: user?.displayName || "",
    email: user?.email || "",
    phone: "",
  });
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("card");

  useEffect(() => {
    if (!showId || !date || !time) {
      setError("필수 정보가 누락되었습니다.");
      setLoading(false);
      return;
    }

    if (selectedSeats.length === 0) {
      navigate("/shows");
      return;
    }

    async function loadShow() {
      try {
        setLoading(true);
        setError(null);

        if (showId && showId.startsWith("melon_")) {
          const melonShow = await fetchMelonConcertById(showId);
          if (melonShow) {
            setShow({
              showId: melonShow.showId || showId || "",
              artist: melonShow.artist || melonShow.title,
              tourName: melonShow.tourName || melonShow.title,
              venueId: melonShow.venueId || "",
              city: melonShow.city || "",
              dates: Array.isArray(melonShow.dates) ? melonShow.dates : [],
              posterUrl: melonShow.posterUrl || (melonShow as any).imageUrl || "",
              priceTable: melonShow.priceTable || {},
              ticketStatus: (melonShow.ticketStatus as any) || "onsale",
              seatGrades: (melonShow as any).seatGrades || ["VIP", "R", "S", "A"],
            });
          }
        }
      } catch (err: any) {
        console.error("공연 정보 로드 실패:", err);
        setError(err.message || "공연 정보를 불러오는데 실패했습니다.");
      } finally {
        setLoading(false);
      }
    }

    loadShow();
  }, [showId, date, time, selectedSeats, navigate]);

  const totalPrice = selectedSeats.reduce((sum, seat) => sum + seat.price, 0);
  const serviceFee = 0; // 수수료 (포폴용으로 0원)
  const finalPrice = totalPrice + serviceFee;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // 유효성 검사
    if (!buyerInfo.name.trim()) {
      alert("이름을 입력해주세요.");
      return;
    }
    if (!buyerInfo.email.trim()) {
      alert("이메일을 입력해주세요.");
      return;
    }
    if (!buyerInfo.phone.trim()) {
      alert("전화번호를 입력해주세요.");
      return;
    }

    // 결제 완료 페이지로 이동 (state로 데이터 전달)
    navigate("/payment/success", {
      state: {
        show,
        selectedSeats,
        buyerInfo,
        paymentMethod,
        totalPrice: finalPrice,
        date,
        time,
      },
    });
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="payment-loading">
          <div className="payment-spinner"></div>
          <p>결제 정보를 불러오는 중...</p>
        </div>
      </MainLayout>
    );
  }

  if (error || !show) {
    return (
      <MainLayout>
        <div className="payment-error">
          <IconifyIcon icon="mdi:alert-circle" width={48} height={48} />
          <h2>결제 정보를 불러올 수 없습니다</h2>
          <p>{error || "공연 정보가 없습니다."}</p>
          <button className="payment-back-button" onClick={() => navigate(-1)}>
            돌아가기
          </button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="payment-container">
        {/* 헤더 */}
        <div className="payment-header">
          <button className="payment-back" onClick={() => navigate(-1)}>
            <IconifyIcon icon="mdi:arrow-left" width={24} height={24} />
          </button>
          <h1 className="payment-title">결제 정보 입력</h1>
        </div>

        <div className="payment-content">
          {/* 주문 상세 요약 */}
          <div className="payment-summary-card">
            <h2 className="payment-card-title">주문 상세</h2>

            {/* 공연 정보 */}
            <div className="payment-show-info">
              {show.posterUrl && (
                <img
                  src={show.posterUrl}
                  alt={show.artist}
                  className="payment-show-image"
                />
              )}
              <div className="payment-show-details">
                <h3 className="payment-show-name">{show.artist}</h3>
                <p className="payment-show-tour">{show.tourName}</p>
                <div className="payment-show-meta">
                  <span>
                    <IconifyIcon icon="mdi:calendar" width={16} height={16} />
                    {formatDate(date || "")}
                  </span>
                  <span>
                    <IconifyIcon icon="mdi:clock-outline" width={16} height={16} />
                    {time}
                  </span>
                </div>
              </div>
            </div>

            <hr className="payment-divider" />

            {/* 좌석 정보 */}
            <div className="payment-seats-section">
              <h4 className="payment-section-title">선택한 좌석</h4>
              <div className="payment-seats-list">
                {selectedSeats.map((seat) => (
                  <div key={seat.seatId} className="payment-seat-item">
                    <span className="payment-seat-info">
                      {seat.section}구역 {seat.row}열 {seat.number}번 ({seat.grade})
                    </span>
                    <span className="payment-seat-price">{formatPrice(seat.price)}</span>
                  </div>
                ))}
              </div>
            </div>

            <hr className="payment-divider" />

            {/* 가격 요약 */}
            <div className="payment-price-summary">
              <div className="payment-price-row">
                <span>좌석 금액</span>
                <span>{formatPrice(totalPrice)}</span>
              </div>
              <div className="payment-price-row">
                <span>예매 수수료</span>
                <span>{formatPrice(serviceFee)}</span>
              </div>
              <div className="payment-price-row payment-price-total">
                <span>총 결제 금액</span>
                <span>{formatPrice(finalPrice)}</span>
              </div>
            </div>
          </div>

          {/* 결제 정보 입력 폼 */}
          <div className="payment-form-card">
            <h2 className="payment-card-title">결제 정보</h2>

            <form onSubmit={handleSubmit} className="payment-form">
              {/* 이름 */}
              <div className="payment-form-group">
                <label className="payment-label">
                  이름 <span className="payment-required">*</span>
                </label>
                <input
                  type="text"
                  className="payment-input"
                  value={buyerInfo.name}
                  onChange={(e) =>
                    setBuyerInfo({ ...buyerInfo, name: e.target.value })
                  }
                  required
                />
              </div>

              {/* 이메일 */}
              <div className="payment-form-group">
                <label className="payment-label">
                  이메일 <span className="payment-required">*</span>
                </label>
                <input
                  type="email"
                  className="payment-input"
                  value={buyerInfo.email}
                  onChange={(e) =>
                    setBuyerInfo({ ...buyerInfo, email: e.target.value })
                  }
                  required
                />
              </div>

              {/* 전화번호 */}
              <div className="payment-form-group">
                <label className="payment-label">
                  전화번호 <span className="payment-required">*</span>
                </label>
                <input
                  type="tel"
                  className="payment-input"
                  placeholder="010-1234-5678"
                  value={buyerInfo.phone}
                  onChange={(e) =>
                    setBuyerInfo({ ...buyerInfo, phone: e.target.value })
                  }
                  required
                />
              </div>

              {/* 결제 수단 */}
              <div className="payment-form-group">
                <label className="payment-label">
                  결제 수단 <span className="payment-required">*</span>
                </label>
                <div className="payment-methods">
                  {PAYMENT_METHODS.map((method) => (
                    <label key={method.value} className="payment-method-option">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value={method.value}
                        checked={paymentMethod === method.value}
                        onChange={(e) =>
                          setPaymentMethod(e.target.value as PaymentMethod)
                        }
                      />
                      <span>{method.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* 결제 버튼 */}
              <button type="submit" className="payment-submit-button">
                <IconifyIcon icon="mdi:credit-card" width={20} height={20} />
                {formatPrice(finalPrice)} 결제하기
              </button>
            </form>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

