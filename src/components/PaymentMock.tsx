import React from "react";
import { useNavigate } from "react-router-dom";
import IconifyIcon from "./Icon/IconifyIcon";
import { formatPrice } from "../utils/formatters";
import "./PaymentMock.css";

interface Seat {
  id: string;
  zone: string;
  price: number;
}

interface PaymentMockProps {
  selectedSeats: Seat[];
  showId?: string;
  date?: string;
  time?: string;
}

export default function PaymentMock({ 
  selectedSeats, 
  showId,
  date,
  time 
}: PaymentMockProps) {
  const navigate = useNavigate();

  const totalPrice = selectedSeats.reduce((sum, seat) => sum + seat.price, 0);

  const handleCheckout = () => {
    if (selectedSeats.length === 0) {
      alert("좌석을 선택해주세요.");
      return;
    }

    // 결제 팝업 열기
    const params = new URLSearchParams();
    params.set("seats", JSON.stringify(selectedSeats));
    if (showId) params.set("showId", showId);
    if (date) params.set("date", date);
    if (time) params.set("time", time);

    window.open(
      `/payment-popup?${params.toString()}`,
      "paymentPopup",
      "width=500,height=700,scrollbars=yes,resizable=yes"
    );
  };

  return (
    <div className="payment-mock">
      <div className="payment-mock-header">
        <h3 className="payment-mock-title">선택한 좌석</h3>
        <span className="payment-mock-count">{selectedSeats.length}매</span>
      </div>

      <div className="payment-mock-seats">
        {selectedSeats.length === 0 ? (
          <div className="payment-mock-empty">
            <IconifyIcon icon="mdi:seat" width={48} height={48} />
            <p>좌석을 선택해주세요</p>
          </div>
        ) : (
          <div className="payment-mock-seat-list">
            {selectedSeats.map((seat) => (
              <div key={seat.id} className="payment-mock-seat-item">
                <div className="payment-mock-seat-info">
                  <span className="payment-mock-seat-zone">{seat.zone}석</span>
                  <span className="payment-mock-seat-number">{seat.id}</span>
                </div>
                <span className="payment-mock-seat-price">
                  {formatPrice(seat.price)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="payment-mock-summary">
        <div className="payment-mock-summary-row">
          <span>좌석 금액</span>
          <span>{formatPrice(totalPrice)}</span>
        </div>
        <div className="payment-mock-summary-row">
          <span>예매 수수료</span>
          <span>{formatPrice(0)}</span>
        </div>
        <div className="payment-mock-summary-divider"></div>
        <div className="payment-mock-summary-row payment-mock-total">
          <span>총 결제 금액</span>
          <span>{formatPrice(totalPrice)}</span>
        </div>
      </div>

      <button
        className="payment-mock-button"
        onClick={handleCheckout}
        disabled={selectedSeats.length === 0}
      >
        <IconifyIcon icon="mdi:credit-card" width={20} height={20} />
        결제하기
      </button>
    </div>
  );
}

