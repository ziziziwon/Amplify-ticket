import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import IconifyIcon from "./Icon/IconifyIcon";
import { formatPrice } from "../utils/formatters";
import "./PaymentPopup.css";

interface Seat {
  id: string;
  zone: string;
  price: number;
}

export default function PaymentPopup() {
  const [searchParams] = useSearchParams();
  const [selectedSeats, setSelectedSeats] = useState<Seat[]>([]);
  const [buyerInfo, setBuyerInfo] = useState({
    name: "",
    phone: "",
    email: "",
  });
  const [paymentMethod, setPaymentMethod] = useState("card");

  useEffect(() => {
    // URL에서 좌석 정보 및 공연 정보 가져오기
    const seatsParam = searchParams.get("seats");
    const showIdParam = searchParams.get("showId");
    const dateParam = searchParams.get("date");
    const timeParam = searchParams.get("time");
    
    if (seatsParam) {
      try {
        const seats = JSON.parse(seatsParam);
        setSelectedSeats(seats);
      } catch (e) {
        console.error("좌석 정보 파싱 실패:", e);
      }
    }
    
    // URL 파라미터를 state에 저장 (나중에 전달하기 위해)
    if (showIdParam) {
      (window as any).__paymentShowId = showIdParam;
    }
    if (dateParam) {
      (window as any).__paymentDate = dateParam;
    }
    if (timeParam) {
      (window as any).__paymentTime = timeParam;
    }

    // 메인 창에서 닫기 메시지 수신
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data.type === "close:popup") {
        window.close();
      }
    };

    window.addEventListener("message", handleMessage);
    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, [searchParams]);

  const totalPrice = selectedSeats.reduce((sum, seat) => sum + seat.price, 0);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === "paymentMethod") {
      setPaymentMethod(value);
    } else {
      setBuyerInfo((prev) => ({ ...prev, [name]: value }));
    }
  };

  const [isProcessing, setIsProcessing] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!buyerInfo.name || !buyerInfo.phone || !buyerInfo.email) {
      alert("예매자 정보를 모두 입력해주세요.");
      return;
    }

    setIsProcessing(true);

    // 결제 완료 처리 (실제로는 결제 API 호출)
    const showId = (window as any).__paymentShowId || searchParams.get("showId");
    const date = (window as any).__paymentDate || searchParams.get("date");
    const time = (window as any).__paymentTime || searchParams.get("time");
    
    // 메인 창으로 메시지 전송 (모든 예매 정보 포함)
    if (window.opener) {
      try {
        // 메시지 전송
        window.opener.postMessage(
          {
            type: "payment:completed",
            showId,
            date,
            time,
            seats: selectedSeats,
            buyerInfo,
            paymentMethod,
            totalPrice,
          },
          window.location.origin
        );
        
        // 성공 메시지 표시
        setIsCompleted(true);
        
        // 페이드 아웃 애니메이션 시작
        setTimeout(() => {
          setIsClosing(true);
        }, 1500); // 1.5초 후 페이드 아웃 시작
        
        // 메시지가 전달될 시간을 주고 자연스럽게 팝업 닫기
        setTimeout(() => {
          window.close();
        }, 2000); // 2초 후 팝업 닫기
      } catch (error) {
        console.error("결제 처리 중 오류:", error);
        alert("결제 처리 중 오류가 발생했습니다.");
        setIsProcessing(false);
      }
    } else {
      // 팝업이 아닌 경우 PaymentSuccess로 직접 이동
      alert("결제가 완료되었습니다!");
      setIsProcessing(false);
    }
  };

  // 결제 완료 상태일 때 성공 메시지 표시
  if (isCompleted) {
    return (
      <div className={`payment-popup ${isClosing ? "payment-popup-closing" : ""}`}>
        <div className="payment-popup-header">
          <h2 className="payment-popup-title">결제 완료</h2>
        </div>
        <div className="payment-popup-content" style={{ textAlign: "center", padding: "60px 20px" }}>
          <div style={{ marginBottom: "20px" }}>
            <IconifyIcon icon="mdi:check-circle" width={64} height={64} style={{ color: "#10b981" }} />
          </div>
          <h3 style={{ fontSize: "20px", fontWeight: "600", marginBottom: "10px", color: "#232323" }}>
            결제가 완료되었습니다!
          </h3>
          <p style={{ fontSize: "14px", color: "#707070" }}>
            예매가 정상적으로 완료되었습니다.
            <br />
            잠시 후 창이 닫힙니다...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="payment-popup">
      <div className="payment-popup-header">
        <h2 className="payment-popup-title">결제하기</h2>
        <button
          className="payment-popup-close"
          onClick={() => window.close()}
          title="닫기"
          disabled={isProcessing}
        >
          <IconifyIcon icon="mdi:close" width={24} height={24} />
        </button>
      </div>

      <div className="payment-popup-content">
        {/* 주문 요약 */}
        <div className="payment-popup-section">
          <h3 className="payment-popup-section-title">주문 요약</h3>
          <div className="payment-popup-seats">
            {selectedSeats.map((seat) => (
              <div key={seat.id} className="payment-popup-seat-item">
                <span>{seat.zone}석 {seat.id}</span>
                <span>{formatPrice(seat.price)}</span>
              </div>
            ))}
          </div>
          <div className="payment-popup-total">
            <span>총 결제 금액</span>
            <span className="payment-popup-total-price">
              {formatPrice(totalPrice)}
            </span>
          </div>
        </div>

        {/* 예매자 정보 */}
        <form onSubmit={handleSubmit} className="payment-popup-form">
          <div className="payment-popup-section">
            <h3 className="payment-popup-section-title">예매자 정보</h3>
            <div className="payment-popup-input-group">
              <label htmlFor="name">이름</label>
              <input
                type="text"
                id="name"
                name="name"
                value={buyerInfo.name}
                onChange={handleInputChange}
                required
                placeholder="홍길동"
              />
            </div>
            <div className="payment-popup-input-group">
              <label htmlFor="phone">연락처</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={buyerInfo.phone}
                onChange={handleInputChange}
                required
                placeholder="010-1234-5678"
              />
            </div>
            <div className="payment-popup-input-group">
              <label htmlFor="email">이메일</label>
              <input
                type="email"
                id="email"
                name="email"
                value={buyerInfo.email}
                onChange={handleInputChange}
                required
                placeholder="example@email.com"
              />
            </div>
          </div>

          {/* 결제 수단 */}
          <div className="payment-popup-section">
            <h3 className="payment-popup-section-title">결제 수단</h3>
            <div className="payment-popup-input-group">
              <label htmlFor="paymentMethod">결제 방식</label>
              <select
                id="paymentMethod"
                name="paymentMethod"
                value={paymentMethod}
                onChange={handleInputChange}
              >
                <option value="card">신용카드</option>
                <option value="bank">계좌이체</option>
                <option value="virtual">가상계좌</option>
                <option value="phone">휴대폰 결제</option>
              </select>
            </div>
          </div>

          <button 
            type="submit" 
            className="payment-popup-submit"
            disabled={isProcessing}
          >
            {isProcessing ? (
              <>
                <div className="payment-popup-spinner" style={{ 
                  border: "2px solid rgba(255, 255, 255, 0.3)",
                  borderTop: "2px solid white",
                  borderRadius: "50%",
                  width: "20px",
                  height: "20px",
                  animation: "spin 0.8s linear infinite",
                  display: "inline-block",
                  marginRight: "8px"
                }}></div>
                처리 중...
              </>
            ) : (
              <>
                <IconifyIcon icon="mdi:credit-card-check" width={20} height={20} />
                결제하기
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

