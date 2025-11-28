import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import MainLayout from "../../components/Layout/MainLayout";
import IconifyIcon from "../../components/Icon/IconifyIcon";
import { useTicketStore } from "../../stores/useTicketStore";
import { Show, SelectedSeat, PaymentMethod, BuyerInfo, Order } from "../../types";
import { formatDate, formatPrice } from "../../utils/formatters";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../firebase";
import { fetchMelonConcertById } from "../../api";
import "./PaymentSuccess.css";

// UUID 생성 함수
const generateUUID = () => {
  return `ticket-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

interface PaymentSuccessState {
  show?: Show;
  showId?: string;
  selectedSeats: SelectedSeat[];
  buyerInfo: BuyerInfo;
  paymentMethod: PaymentMethod;
  totalPrice: number;
  date: string;
  time: string;
}

export default function PaymentSuccess() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, clearSeats } = useTicketStore();
  const [saving, setSaving] = useState(true);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const state = location.state as PaymentSuccessState | null;

  useEffect(() => {
    if (!state) {
      navigate("/shows");
      return;
    }

    // Firestore에 티켓 저장
    const saveTicket = async () => {
      if (!user?.uid) {
        setError("로그인이 필요합니다.");
        setSaving(false);
        return;
      }

      try {
        const ticketId = generateUUID();
        const orderId = `ORDER-${Date.now()}`;

        // show 정보가 없으면 showId로부터 가져오기
        let showData = state.show;
        if (!showData && state.showId) {
          // showId로 공연 정보 가져오기
          try {
            if (state.showId.startsWith("melon_")) {
              const melonShow = await fetchMelonConcertById(state.showId);
              if (melonShow) {
                showData = {
                  showId: melonShow.showId || state.showId,
                  artist: melonShow.artist || melonShow.title || "공연",
                  tourName: melonShow.tourName || melonShow.title || "",
                  posterUrl: melonShow.posterUrl || (melonShow as any).imageUrl || "",
                  venueId: melonShow.venueId || "",
                  ...(melonShow as any), // 추가 필드 포함
                } as Show;
              }
            }
          } catch (err) {
            console.error("공연 정보 가져오기 실패:", err);
          }
          
          // 여전히 없으면 기본 정보 사용
          if (!showData) {
            showData = {
              showId: state.showId,
              artist: "공연 정보",
              tourName: "공연",
              posterUrl: "",
              venueId: "",
            } as Show;
          }
        }

        if (!showData) {
          setError("공연 정보가 없습니다.");
          setSaving(false);
          return;
        }

        // users/{uid}/tickets/{ticketId} 구조로 저장 (공연 정보 전체 포함)
        const ticketData = {
          id: ticketId,
          orderId,
          // 공연 기본 정보
          showId: showData.showId,
          title: showData.artist || showData.tourName || "공연",
          subtitle: showData.tourName || "",
          artist: showData.artist || "",
          tourName: showData.tourName || "",
          poster: showData.posterUrl || "",
          posterUrl: showData.posterUrl || "", // 호환성 유지
          venue: (showData as any).venue || (showData as any).venueName || "",
          venueId: showData.venueId || "",
          hall: (showData as any).hall || "",
          runtime: (showData as any).runtime || "",
          ageLimit: (showData as any).ageLimit || "",
          // 공연 날짜/시간
          date: state.date,
          time: state.time,
          // 좌석 정보
          seats: state.selectedSeats,
          // 예매 정보
          totalPrice: state.totalPrice,
          buyerInfo: state.buyerInfo,
          paymentMethod: state.paymentMethod,
          status: "confirmed",
          purchasedAt: serverTimestamp(),
          createdAt: serverTimestamp(),
        };

        await setDoc(doc(db, "users", user.uid, "tickets", ticketId), ticketData);

        // Order도 저장 (공연 정보 포함)
        const order: any = {
          orderId,
          userId: user.uid,
          showId: showData.showId,
          // 공연 기본 정보
          title: showData.artist || showData.tourName || "공연",
          subtitle: showData.tourName || "",
          artist: showData.artist || "",
          tourName: showData.tourName || "",
          poster: showData.posterUrl || "",
          posterUrl: showData.posterUrl || "", // 호환성 유지
          venue: (showData as any).venue || (showData as any).venueName || "",
          venueId: showData.venueId || "",
          hall: (showData as any).hall || "",
          runtime: (showData as any).runtime || (showData as any).runningTime || "",
          ageLimit: (showData as any).ageLimit || "",
          // 공연 날짜/시간
          date: state.date,
          time: state.time,
          // 좌석 정보
          seats: state.selectedSeats,
          // 결제 금액
          totalAmount: state.totalPrice,
          // 구매자 정보
          buyerInfo: state.buyerInfo,
          // 결제 정보
          paymentInfo: {
            method: state.paymentMethod,
            approvalNumber: `APPR-${Date.now()}`,
            paidAt: new Date().toISOString(),
          },
          qrCodeUrl: `https://qr.example.com/${ticketId}`,
          status: "confirmed",
          createdAt: serverTimestamp(),
        };

        // Order 컬렉션에도 저장 (선택사항)
        await setDoc(doc(db, "orders", orderId), order);

        setSaved(true);
        clearSeats(); // 좌석 선택 초기화
      } catch (err: any) {
        console.error("티켓 저장 실패:", err);
        setError(err.message || "티켓 저장에 실패했습니다.");
      } finally {
        setSaving(false);
      }
    };

    saveTicket();
  }, [state, user, navigate, clearSeats]);

  // show 정보 가져오기 (state에서 또는 showId로)
  const showData = state?.show || (state?.showId ? {
    showId: state.showId,
    artist: "공연 정보",
    tourName: "공연",
    posterUrl: "",
    venueId: "",
  } as Show : null);

  if (!state || !showData) {
    return null;
  }

  return (
    <MainLayout>
      <div className="payment-success-container">
        {saving ? (
          <div className="payment-success-loading">
            <div className="payment-success-spinner"></div>
            <p>결제를 처리하는 중...</p>
          </div>
        ) : error ? (
          <div className="payment-success-error">
            <IconifyIcon icon="mdi:alert-circle" width={48} height={48} />
            <h2>결제 처리 중 오류가 발생했습니다</h2>
            <p>{error}</p>
            <button
              className="payment-success-button"
              onClick={() => navigate("/shows")}
            >
              공연 목록으로
            </button>
          </div>
        ) : (
          <div className="payment-success-content">
            {/* 성공 메시지 */}
            <div className="payment-success-header">
              <div className="payment-success-icon">
                <IconifyIcon icon="mdi:check-circle" width={64} height={64} />
              </div>
              <h1 className="payment-success-title">결제가 완료되었습니다!</h1>
              <p className="payment-success-subtitle">
                예매가 정상적으로 완료되었습니다. 티켓은 마이티켓에서 확인하실 수 있습니다.
              </p>
            </div>

            {/* 티켓 정보 카드 */}
            <div className="payment-success-ticket-card">
              {showData.posterUrl && (
                <img
                  src={showData.posterUrl}
                  alt={showData.artist}
                  className="payment-success-poster"
                />
              )}
              <div className="payment-success-ticket-info">
                <h2 className="payment-success-show-name">{showData.artist}</h2>
                <p className="payment-success-show-tour">{showData.tourName}</p>

                <div className="payment-success-ticket-details">
                  <div className="payment-success-detail-row">
                    <IconifyIcon icon="mdi:calendar" width={20} height={20} />
                    <span>{formatDate(state.date)}</span>
                  </div>
                  <div className="payment-success-detail-row">
                    <IconifyIcon icon="mdi:clock-outline" width={20} height={20} />
                    <span>{state.time}</span>
                  </div>
                  <div className="payment-success-detail-row">
                    <IconifyIcon icon="mdi:seat" width={20} height={20} />
                    <span>
                      {state.selectedSeats.map((s) => `${s.section}${s.row}-${s.number}`).join(", ")}
                    </span>
                  </div>
                  <div className="payment-success-detail-row">
                    <IconifyIcon icon="mdi:currency-krw" width={20} height={20} />
                    <span>{formatPrice(state.totalPrice)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 예매자 정보 */}
            <div className="payment-success-buyer-card">
              <h3 className="payment-success-card-title">예매자 정보</h3>
              <div className="payment-success-buyer-info">
                <div className="payment-success-buyer-row">
                  <span>이름</span>
                  <span>{state.buyerInfo.name}</span>
                </div>
                <div className="payment-success-buyer-row">
                  <span>이메일</span>
                  <span>{state.buyerInfo.email}</span>
                </div>
                <div className="payment-success-buyer-row">
                  <span>전화번호</span>
                  <span>{state.buyerInfo.phone}</span>
                </div>
                <div className="payment-success-buyer-row">
                  <span>결제 수단</span>
                  <span>
                    {state.paymentMethod === "card"
                      ? "신용카드"
                      : state.paymentMethod === "bank"
                      ? "무통장입금"
                      : state.paymentMethod === "toss"
                      ? "토스페이"
                      : "카카오페이"}
                  </span>
                </div>
              </div>
            </div>

            {/* 액션 버튼 */}
            <div className="payment-success-actions">
              <button
                className="payment-success-button payment-success-button-primary"
                onClick={() => navigate("/tickets")}
              >
                <IconifyIcon icon="mdi:ticket-confirmation" width={20} height={20} />
                내 티켓 보기
              </button>
              <button
                className="payment-success-button payment-success-button-secondary"
                onClick={() => navigate("/shows")}
              >
                공연 더보기
              </button>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}

