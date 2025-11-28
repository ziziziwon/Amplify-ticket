import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import MainLayout from "../../components/Layout/MainLayout";
import IconifyIcon from "../../components/Icon/IconifyIcon";
import SeatMap from "../../components/SeatMap/SeatMap";
import { useTicketStore } from "../../stores/useTicketStore";
import { SelectedSeat, Show, TicketStatus } from "../../types";
import { formatDate, formatPrice } from "../../utils/formatters";
import { GRADE_COLORS, MAX_TICKETS_PER_USER } from "../../utils/constants";
import { fetchMelonConcertById } from "../../api";
import "./SelectSeats.css";

// SeatMap에서 사용하는 좌석 타입
interface SeatMapSeat {
  id: string;
  x: number;
  y: number;
  price: number;
  zone: string;
}

export default function SelectSeats() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const showId = searchParams.get("showId");
  const date = searchParams.get("date");
  const time = searchParams.get("time");

  const { selectedSeats: storeSelectedSeats, addSeat, removeSeat, clearSeats, setCurrentShow } = useTicketStore();
  const [show, setShow] = useState<Show | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSeats, setSelectedSeats] = useState<SeatMapSeat[]>([]);

  useEffect(() => {
    if (!showId || !date || !time) {
      setError("필수 정보가 누락되었습니다.");
      setLoading(false);
      return;
    }

    async function loadShow() {
      try {
        setLoading(true);
        setError(null);

        // 멜론티켓 공연 로드
        if (showId && showId.startsWith("melon_")) {
          const melonShow = await fetchMelonConcertById(showId);
          if (melonShow) {
            setShow({
              showId: melonShow.showId || showId,
              artist: melonShow.artist || melonShow.title,
              tourName: melonShow.tourName || melonShow.title,
              venueId: melonShow.venueId || "",
              city: melonShow.city || "",
              dates: Array.isArray(melonShow.dates) ? melonShow.dates : [],
              posterUrl: melonShow.posterUrl || (melonShow as any).imageUrl || "",
              priceTable: melonShow.priceTable || {},
              ticketStatus: (melonShow.ticketStatus as TicketStatus) || "onsale",
              seatGrades: (melonShow as any).seatGrades || ["VIP", "R", "S", "A"],
            });
            if (showId && date) {
              setCurrentShow(showId, date);
            }
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
    clearSeats(); // 좌석 선택 초기화
  }, [showId, date, time, setCurrentShow, clearSeats]);

  // SeatMap에서 호출되는 좌석 선택 핸들러
  const handleSeatSelect = (seats: SeatMapSeat[]) => {
    setSelectedSeats(seats);
    
    // Zustand store에도 동기화
    // 기존 선택된 좌석 제거
    storeSelectedSeats.forEach((seat) => {
      removeSeat(seat.seatId);
    });
    
    // 새로운 좌석 추가
    seats.forEach((seat) => {
      const seatData: SelectedSeat = {
        seatId: seat.id,
        showId: showId || "",
        date: `${date}T${time}:00`,
        section: seat.zone,
        row: "1",
        number: seat.id.split("-")[1] || "1",
        grade: seat.zone,
        price: seat.price,
      };
      addSeat(seatData);
    });
  };

  const handleNext = () => {
    if (selectedSeats.length === 0) {
      alert("좌석을 선택해주세요.");
      return;
    }
    if (!showId || !date || !time) {
      alert("필수 정보가 누락되었습니다.");
      return;
    }
    navigate(`/payment?showId=${showId}&date=${date}&time=${time}`);
  };

  const totalPrice = selectedSeats.reduce((sum, seat) => sum + seat.price, 0);

  if (loading) {
    return (
      <MainLayout>
        <div className="select-seats-loading">
          <div className="select-seats-spinner"></div>
          <p>좌석 정보를 불러오는 중...</p>
        </div>
      </MainLayout>
    );
  }

  if (error || !show) {
    return (
      <MainLayout>
        <div className="select-seats-error">
          <IconifyIcon icon="mdi:alert-circle" width={48} height={48} />
          <h2>좌석 정보를 불러올 수 없습니다</h2>
          <p>{error || "공연 정보가 없습니다."}</p>
          <button className="select-seats-back-button" onClick={() => navigate(-1)}>
            돌아가기
          </button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="select-seats-container">
        {/* 헤더 */}
        <div className="select-seats-header">
          <button className="select-seats-back" onClick={() => navigate(-1)}>
            <IconifyIcon icon="mdi:arrow-left" width={24} height={24} />
          </button>
          <h1 className="select-seats-title">좌석 선택</h1>
        </div>

        {/* 공연 정보 */}
        <div className="select-seats-show-info">
          <h2 className="select-seats-show-name">{show.artist} - {show.tourName}</h2>
          <div className="select-seats-show-details">
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

        <div className="select-seats-content">
          {/* 좌석도 */}
          <div className="select-seats-map-section">
            <SeatMap
              onSelectSeats={handleSeatSelect}
              selectedSeats={selectedSeats}
              maxSeats={MAX_TICKETS_PER_USER}
            />
          </div>

          {/* 선택한 좌석 및 가격 */}
          <div className="select-seats-sidebar">
            <div className="select-seats-selected">
              <h3 className="select-seats-sidebar-title">선택한 좌석</h3>
              {selectedSeats.length === 0 ? (
                <p className="select-seats-empty">좌석을 선택해주세요</p>
              ) : (
                <div className="select-seats-list">
                  {selectedSeats.map((seat) => (
                    <div key={seat.id} className="select-seats-item">
                      <div className="select-seats-item-info">
                        <span
                          className="select-seats-grade"
                          style={{ color: GRADE_COLORS[seat.zone] || "#666" }}
                        >
                          {seat.zone}
                        </span>
                        <span className="select-seats-seat-info">
                          {seat.zone}석 {seat.id}
                        </span>
                      </div>
                      <div className="select-seats-item-actions">
                        <span className="select-seats-item-price">{formatPrice(seat.price)}</span>
                        <button
                          className="select-seats-remove"
                          onClick={() => {
                            const newSeats = selectedSeats.filter((s) => s.id !== seat.id);
                            handleSeatSelect(newSeats);
                          }}
                        >
                          <IconifyIcon icon="mdi:close" width={16} height={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="select-seats-summary">
              <div className="select-seats-summary-row">
                <span>좌석 금액</span>
                <span>{formatPrice(totalPrice)}</span>
              </div>
              <div className="select-seats-summary-row">
                <span>예매 수수료</span>
                <span>{formatPrice(0)}</span>
              </div>
              <div className="select-seats-summary-row select-seats-total">
                <span>총 결제 금액</span>
                <span>{formatPrice(totalPrice)}</span>
              </div>
            </div>

            <button
              className="select-seats-next-button"
              onClick={handleNext}
              disabled={selectedSeats.length === 0}
            >
              다음 단계
            </button>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

