import React from "react";
import { useNavigate } from "react-router-dom";
import MainLayout from "../../components/Layout/MainLayout";
import IconifyIcon from "../../components/Icon/IconifyIcon";
import showsData from "../../data/shows.json";
import { Show } from "../../types";
import { useTicketStore } from "../../stores/useTicketStore";
import { formatSeatInfo, formatPrice, formatDate } from "../../utils/formatters";
import { GRADE_COLORS } from "../../utils/constants";
import "./Basket.css";

export default function Basket() {
  const navigate = useNavigate();
  const { basket, clearBasket } = useTicketStore();
  const shows = showsData as unknown as Show[];

  const totalPrice = basket.reduce((sum, seat) => sum + seat.price, 0);

  const handleCheckout = () => {
    if (basket.length === 0) {
      alert("장바구니가 비어있습니다.");
      return;
    }
    navigate("/checkout");
  };

  const handleClearBasket = () => {
    if (window.confirm("장바구니를 비우시겠습니까?")) {
      clearBasket();
    }
  };

  return (
    <MainLayout>
      <div className="basket-container">
        {/* 헤더 */}
        <div className="basket-header">
          <h1 className="basket-title">장바구니</h1>
          {basket.length > 0 && (
            <button className="basket-clear-button" onClick={handleClearBasket}>
              전체 삭제
            </button>
          )}
        </div>

        {basket.length === 0 ? (
          // 빈 장바구니
          <div className="basket-empty">
            <IconifyIcon icon="mdi:cart-outline" width={48} height={48} className="basket-empty-icon" />
            <div className="basket-empty-text">장바구니가 비어있습니다</div>
            <button className="basket-empty-button" onClick={() => navigate("/shows")}>
              공연 둘러보기
            </button>
          </div>
        ) : (
          <>
            {/* 주의사항 */}
            <div className="basket-warning">
              <IconifyIcon icon="mdi:alert" width={16} height={16} className="basket-warning-icon" />
              <span>선택하신 좌석은 10분간 예약됩니다. 시간 내에 결제를 완료해주세요.</span>
            </div>

            {/* 장바구니 아이템 */}
            <div className="basket-items">
              {basket.map((seat) => {
                const show = shows.find((s) => s.showId === seat.showId);
                if (!show) return null;

                return (
                  <div key={seat.seatId} className="basket-item">
                    <div className="basket-item-content">
                      {/* 공연 정보 */}
                      <div className="basket-item-info">
                        <div className="basket-item-title">{show.artist}</div>
                        <div className="basket-item-subtitle">{show.tourName}</div>

                        <div className="basket-item-badges">
                          <span
                            className="basket-item-badge"
                            style={{
                              backgroundColor: GRADE_COLORS[seat.grade] || "#9CA3AF",
                            }}
                          >
                            {seat.grade}
                          </span>
                        </div>

                        <div className="basket-item-detail">
                          <IconifyIcon icon="mdi:calendar" width={16} height={16} style={{ marginRight: "4px", verticalAlign: "middle" }} />
                          {formatDate(seat.date)}
                        </div>
                        <div className="basket-item-detail">
                          <IconifyIcon icon="mdi:seat" width={16} height={16} style={{ marginRight: "4px", verticalAlign: "middle" }} />
                          {formatSeatInfo(seat)}
                        </div>
                      </div>

                      {/* 가격 */}
                      <div className="basket-item-price">
                        <div className="basket-item-price-value">{formatPrice(seat.price)}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 결제 정보 */}
            <div className="basket-summary">
              <div className="basket-summary-row">
                <span className="basket-summary-label">티켓 수량</span>
                <span className="basket-summary-value">{basket.length}매</span>
              </div>
              <hr className="basket-summary-divider" />
              <div className="basket-summary-total">
                <span className="basket-summary-total-label">총 결제금액</span>
                <span className="basket-summary-total-value">{formatPrice(totalPrice)}</span>
              </div>

              <button className="basket-checkout-button" onClick={handleCheckout}>
                결제하기
              </button>
            </div>
          </>
        )}
      </div>
    </MainLayout>
  );
}

