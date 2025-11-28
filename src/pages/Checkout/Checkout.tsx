import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import MainLayout from "../../components/Layout/MainLayout";
import showsData from "../../data/shows.json";
import { Show, BuyerInfo, PaymentMethod, Order } from "../../types";
import { useTicketStore } from "../../stores/useTicketStore";
import { formatSeatInfo, formatPrice, formatDate } from "../../utils/formatters";
import { PAYMENT_METHODS } from "../../utils/constants";
import "./Checkout.css";

export default function Checkout() {
  const navigate = useNavigate();
  const { basket, clearBasket, setCurrentOrder } = useTicketStore();
  const shows = showsData as unknown as Show[];

  const [buyerInfo, setBuyerInfo] = useState<BuyerInfo>({
    name: "",
    phone: "",
    email: "",
  });

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("card");
  const [agreeTerms, setAgreeTerms] = useState(false);

  const totalPrice = basket.reduce((sum, seat) => sum + seat.price, 0);

  const handlePayment = () => {
    if (!buyerInfo.name || !buyerInfo.phone || !buyerInfo.email) {
      alert("예매자 정보를 모두 입력해주세요.");
      return;
    }

    if (!agreeTerms) {
      alert("취소/환불 규정에 동의해주세요.");
      return;
    }

    const order: Order = {
      orderId: `ORDER-${Date.now()}`,
      userId: "user123",
      showId: basket[0]?.showId || "",
      date: basket[0]?.date || "",
      seats: basket,
      totalAmount: totalPrice,
      buyerInfo,
      paymentInfo: {
        method: paymentMethod,
        approvalNumber: `APPR-${Date.now()}`,
        paidAt: new Date().toISOString(),
      },
      qrCodeUrl: `https://qr.example.com/${Date.now()}`,
      status: "confirmed",
      createdAt: new Date().toISOString(),
    };

    setCurrentOrder(order);
    clearBasket();

    alert("결제가 완료되었습니다!");
    navigate("/tickets");
  };

  if (basket.length === 0) {
    return (
      <MainLayout>
        <div className="checkout-container checkout-empty">
          <h2 className="checkout-empty-title">장바구니가 비어있습니다</h2>
          <button className="checkout-browse-button" onClick={() => navigate("/shows")}>
            공연 둘러보기
          </button>
        </div>
      </MainLayout>
    );
  }

  const show = shows.find((s) => s.showId === basket[0]?.showId);

  return (
    <MainLayout>
      <div className="checkout-container">
        <h1 className="checkout-title">결제하기</h1>

        {/* 주문 정보 */}
        <div className="checkout-card checkout-order-card">
          <h2 className="checkout-card-title">주문 정보</h2>

          {show && (
            <>
              <p className="checkout-show-name">{show.artist} - {show.tourName}</p>
              <p className="checkout-show-date">{formatDate(basket[0]?.date || "")}</p>
            </>
          )}

          <hr className="checkout-divider" />

          <div className="checkout-seats-list">
            {basket.map((seat) => (
              <div key={seat.seatId} className="checkout-seat-item">
                <span className="checkout-seat-info">{formatSeatInfo(seat)}</span>
                <span className="checkout-seat-price">{formatPrice(seat.price)}</span>
              </div>
            ))}
          </div>

          <hr className="checkout-divider" />

          <div className="checkout-total">
            <h3 className="checkout-total-label">총 결제금액</h3>
            <span className="checkout-total-price">{formatPrice(totalPrice)}</span>
          </div>
        </div>

        {/* 예매자 정보 */}
        <div className="checkout-card">
          <h2 className="checkout-card-title">예매자 정보</h2>

          <div className="checkout-form-group">
            <label htmlFor="buyer-name" className="checkout-label">이름</label>
            <input
              id="buyer-name"
              type="text"
              className="checkout-input"
              value={buyerInfo.name}
              onChange={(e) => setBuyerInfo({ ...buyerInfo, name: e.target.value })}
              required
            />
          </div>

          <div className="checkout-form-group">
            <label htmlFor="buyer-phone" className="checkout-label">휴대폰 번호</label>
            <input
              id="buyer-phone"
              type="tel"
              className="checkout-input"
              placeholder="010-0000-0000"
              value={buyerInfo.phone}
              onChange={(e) => setBuyerInfo({ ...buyerInfo, phone: e.target.value })}
              required
            />
          </div>

          <div className="checkout-form-group">
            <label htmlFor="buyer-email" className="checkout-label">이메일</label>
            <input
              id="buyer-email"
              type="email"
              className="checkout-input"
              placeholder="example@email.com"
              value={buyerInfo.email}
              onChange={(e) => setBuyerInfo({ ...buyerInfo, email: e.target.value })}
              required
            />
          </div>
        </div>

        {/* 결제수단 */}
        <div className="checkout-card">
          <h2 className="checkout-card-title">결제수단</h2>

          <div className="checkout-radio-group">
            {PAYMENT_METHODS.map((method) => (
              <label key={method.value} className="checkout-radio-label">
                <input
                  type="radio"
                  name="payment-method"
                  value={method.value}
                  checked={paymentMethod === method.value}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  className="checkout-radio-input"
                />
                <span className="checkout-radio-text">{method.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* 동의 */}
        <div className="checkout-card">
          <h2 className="checkout-card-title">취소/환불 규정</h2>

          <div className="checkout-alert checkout-alert-info">
            <ul className="checkout-terms-list">
              <li>공연 당일 취소/환불 불가</li>
              <li>공연 3일 전까지: 전액 환불</li>
              <li>공연 2일 전: 90% 환불</li>
              <li>공연 1일 전: 80% 환불</li>
            </ul>
          </div>

          <label className="checkout-checkbox-label">
            <input
              type="checkbox"
              checked={agreeTerms}
              onChange={(e) => setAgreeTerms(e.target.checked)}
              className="checkout-checkbox-input"
            />
            <span className="checkout-checkbox-text">위 규정을 확인했으며 동의합니다</span>
          </label>
        </div>

        {/* 결제 버튼 */}
        <button className="checkout-payment-button" onClick={handlePayment}>
          {formatPrice(totalPrice)} 결제하기
        </button>
      </div>
    </MainLayout>
  );
}
