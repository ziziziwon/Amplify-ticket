import React, { useState, useEffect } from "react";
import CaptchaBox from "../components/CaptchaBox";
import SeatMap from "../components/SeatMap/SeatMap";
import PaymentMock from "../components/PaymentMock";
import { useTicketStore } from "../stores/useTicketStore";
import { SelectedSeat as TypesSelectedSeat, Show, PriceTable } from "../types";
import { formatDate, formatPrice } from "../utils/formatters";
import { MAX_TICKETS_PER_USER } from "../utils/constants";
import { fetchMelonConcertById } from "../api";
import IconifyIcon from "../components/Icon/IconifyIcon";
import "./SeatPopupApp.css";

// SeatMap에서 사용하는 좌석 타입
interface SeatMapSeat {
  id: string;
  x: number;
  y: number;
  price: number;
  zone: string;
}

export default function SeatPopupApp() {
  // URL 파라미터에서 정보 가져오기
  const getUrlParam = (name: string) => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
  };

  const showId = getUrlParam("showId");
  const date = getUrlParam("date");
  const time = getUrlParam("time");

  const [verified, setVerified] = useState(false);
  const [show, setShow] = useState<Show | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSeats, setSelectedSeats] = useState<SeatMapSeat[]>([]);

  const { selectedSeats: storeSelectedSeats, addSeat, removeSeat } = useTicketStore();

  // 공연 정보 로드
  useEffect(() => {
    if (!showId) {
      setError("공연 ID가 없습니다.");
      setLoading(false);
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
  }, [showId]);

  // 좌석 선택 핸들러 (SeatMap에서 호출)
  const handleSeatSelect = (seats: SeatMapSeat[]) => {
    setSelectedSeats(seats);
    
    // Zustand store에도 동기화
    // 기존 store의 좌석 중 현재 showId와 일치하는 것만 제거
    storeSelectedSeats.forEach((seat) => {
      if (seat.showId === showId) {
        removeSeat(seat.seatId);
      }
    });
    
    // 새로운 좌석 추가
    seats.forEach((seat) => {
      const seatData: TypesSelectedSeat = {
        seatId: seat.id,
        showId: showId || "",
        date: date || "",
        section: seat.zone,
        row: seat.id.split("-")[2] || "1", // L-1-1 또는 R-1-1에서 행 번호 추출
        number: seat.id.split("-")[3] || "1", // 좌석 번호 추출
        grade: seat.zone,
        price: seat.price,
      };
      addSeat(seatData);
    });
  };

  // 좌석 선택 완료
  const handleComplete = () => {
    if (selectedSeats.length === 0) {
      alert("좌석을 선택해주세요.");
      return;
    }

    // 메인 앱으로 데이터 전송
    if (window.opener) {
      window.opener.postMessage(
        {
          type: "seat:selected",
          seats: selectedSeats,
          showId,
          date,
          time,
        },
        window.location.origin
      );
      window.close();
    } else {
      alert("좌석 선택이 완료되었습니다.");
    }
  };

  const totalPrice = selectedSeats.reduce((sum, seat) => sum + seat.price, 0);

  if (loading) {
    return (
      <div className="seat-popup-loading">
        <div className="seat-popup-spinner"></div>
        <p>공연 정보를 불러오는 중...</p>
      </div>
    );
  }

  if (error || !show) {
    return (
      <div className="seat-popup-error">
        <IconifyIcon icon="mdi:alert-circle" width={48} height={48} />
        <h2>공연 정보를 불러올 수 없습니다</h2>
        <p>{error || "공연 정보가 없습니다."}</p>
        <button className="seat-popup-close-button" onClick={() => window.close()}>
          닫기
        </button>
      </div>
    );
  }

  return (
    <div className="seat-popup-app">
      {/* 헤더 */}
      <div className="seat-popup-header">
        <div className="seat-popup-header-content">
          <h1 className="seat-popup-title">좌석 선택</h1>
          <button
            className="seat-popup-close"
            onClick={() => window.close()}
            title="닫기"
          >
            <IconifyIcon icon="mdi:close" width={24} height={24} />
          </button>
        </div>
        <div className="seat-popup-show-info">
          <h2 className="seat-popup-show-name">{show.artist} - {show.tourName}</h2>
          <div className="seat-popup-show-details">
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

      {/* 콘텐츠 */}
      <div className="seat-popup-content">
        {!verified ? (
          <div className="seat-popup-captcha-wrapper">
            <CaptchaBox onSuccess={() => setVerified(true)} />
          </div>
        ) : (
          <div className="seat-popup-seat-wrapper">
            <div className="seat-popup-map-section">
              <SeatMap
                onSelectSeats={handleSeatSelect}
                selectedSeats={selectedSeats}
                maxSeats={MAX_TICKETS_PER_USER}
              />
            </div>

            <div className="seat-popup-sidebar">
              <PaymentMock 
                selectedSeats={selectedSeats}
                showId={showId || undefined}
                date={date || undefined}
                time={time || undefined}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
