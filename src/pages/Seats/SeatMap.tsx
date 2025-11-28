import React from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import MainLayout from "../../components/Layout/MainLayout";
import showsData from "../../data/shows.json";
import kspodomeData from "../../data/seatmaps/kspodome.json";
import { Show, SeatMap as SeatMapType, Seat, SelectedSeat } from "../../types";
import { useTicketStore } from "../../stores/useTicketStore";
import { formatSeatInfo, formatPrice } from "../../utils/formatters";
import { GRADE_COLORS, MAX_TICKETS_PER_USER } from "../../utils/constants";
import "./SeatMap.css";

export default function SeatMap() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const showId = searchParams.get("showId");
  const date = searchParams.get("date");

  const { selectedSeats, addSeat, removeSeat, moveToBasket } = useTicketStore();

  const shows = showsData as unknown as Show[];
  const show = shows.find((s) => s.showId === showId);
  const seatMapData = kspodomeData as SeatMapType;

  if (!show || !date) {
    return (
      <MainLayout>
        <div className="seatmap-container seatmap-empty">
          <h2 className="seatmap-empty-title">잘못된 접근입니다</h2>
          <button className="seatmap-back-button" onClick={() => navigate("/shows")}>
            공연 목록으로
          </button>
        </div>
      </MainLayout>
    );
  }

  const handleSeatClick = (seat: Seat) => {
    if (seat.status !== "available") {
      alert("선택할 수 없는 좌석입니다.");
      return;
    }

    const isSelected = selectedSeats.find((s) => s.seatId === seat.seatId);

    if (isSelected) {
      removeSeat(seat.seatId);
    } else {
      if (selectedSeats.length >= MAX_TICKETS_PER_USER) {
        alert(`최대 ${MAX_TICKETS_PER_USER}매까지 선택 가능합니다.`);
        return;
      }

      const selectedSeat: SelectedSeat = {
        seatId: seat.seatId,
        showId: show.showId,
        date: date,
        section: seat.section,
        row: seat.row,
        number: seat.number,
        grade: seat.grade,
        price: show.priceTable[seat.grade] || 0,
      };
      addSeat(selectedSeat);
    }
  };

  const handleMoveToBasket = () => {
    if (selectedSeats.length === 0) {
      alert("좌석을 선택해주세요.");
      return;
    }

    moveToBasket();
    navigate("/basket");
  };

  const totalPrice = selectedSeats.reduce((sum, seat) => sum + seat.price, 0);

  return (
    <MainLayout>
      <div className="seatmap-container">
        {/* 헤더 */}
        <div className="seatmap-header">
          <h1 className="seatmap-title">좌석 선택</h1>
          <p className="seatmap-subtitle">{show.artist} - {show.tourName}</p>
        </div>

        {/* 알림 */}
        <div className="seatmap-alert seatmap-alert-info">
          최대 {MAX_TICKETS_PER_USER}매까지 선택 가능합니다
        </div>

        <div className="seatmap-grid">
          {/* 왼쪽: 좌석맵 */}
          <div className="seatmap-map-wrapper">
            <div className="seatmap-map-card">
              {/* 무대 */}
              <div className="seatmap-stage">STAGE</div>

              {/* 좌석맵 */}
              <div className="seatmap-sections">
                {seatMapData.sections.map((section) => (
                  <div key={section.sectionId} className="seatmap-section">
                    <h3 className="seatmap-section-title">
                      {section.name} ({section.grade})
                    </h3>

                    {section.rows.map((row) => (
                      <div key={row.rowId} className="seatmap-row">
                        <span className="seatmap-row-label">{row.rowId}</span>
                        <div className="seatmap-seats">
                          {row.seats.map((seat) => {
                            const isSelected = selectedSeats.find(
                              (s) => s.seatId === seat.seatId
                            );
                            const isAvailable = seat.status === "available";

                            return (
                              <button
                                key={seat.seatId}
                                className={`seatmap-seat ${isSelected ? "selected" : ""} ${!isAvailable ? "unavailable" : ""}`}
                                onClick={() => handleSeatClick(seat)}
                                disabled={!isAvailable}
                                style={{
                                  backgroundColor: isSelected
                                    ? "#667eea"
                                    : isAvailable
                                    ? GRADE_COLORS[seat.grade] || "#E5E7EB"
                                    : "#D1D5DB",
                                }}
                              >
                                {seat.number}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                ))}

                {/* 스탠딩 구역 */}
                {seatMapData.standingAreas &&
                  seatMapData.standingAreas.map((area) => (
                    <div
                      key={area.areaId}
                      className="seatmap-standing-area"
                      style={{
                        backgroundColor: GRADE_COLORS[area.grade] || "#9CA3AF",
                      }}
                    >
                      <p className="seatmap-standing-name">{area.name}</p>
                      <p className="seatmap-standing-info">
                        {area.grade} · 최대 {area.capacity}명
                      </p>
                    </div>
                  ))}
              </div>

              {/* 범례 */}
              <div className="seatmap-legend">
                {Object.entries(GRADE_COLORS).map(([grade, color]) => (
                  <div key={grade} className="seatmap-legend-item">
                    <span
                      className="seatmap-legend-color"
                      style={{ backgroundColor: color }}
                    />
                    <span className="seatmap-legend-text">{grade}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 오른쪽: 선택된 좌석 */}
          <div className="seatmap-sidebar">
            <div className="seatmap-sidebar-card">
              <h2 className="seatmap-sidebar-title">
                선택한 좌석 ({selectedSeats.length}/{MAX_TICKETS_PER_USER})
              </h2>

              {selectedSeats.length === 0 ? (
                <div className="seatmap-empty-seats">
                  <p>좌석을 선택해주세요</p>
                </div>
              ) : (
                <>
                  <div className="seatmap-selected-list">
                    {selectedSeats.map((seat) => (
                      <div key={seat.seatId} className="seatmap-selected-item">
                        <div className="seatmap-selected-header">
                          <span
                            className="seatmap-selected-chip"
                            style={{
                              backgroundColor: GRADE_COLORS[seat.grade] || "#9CA3AF",
                            }}
                          >
                            {seat.grade}
                          </span>
                          <button
                            className="seatmap-remove-button"
                            onClick={() => removeSeat(seat.seatId)}
                          >
                            삭제
                          </button>
                        </div>
                        <p className="seatmap-selected-info">{formatSeatInfo(seat)}</p>
                        <p className="seatmap-selected-price">{formatPrice(seat.price)}</p>
                      </div>
                    ))}
                  </div>

                  {/* 합계 */}
                  <div className="seatmap-summary">
                    <span className="seatmap-summary-label">총 결제금액</span>
                    <span className="seatmap-summary-price">{formatPrice(totalPrice)}</span>
                  </div>

                  {/* 버튼 */}
                  <button className="seatmap-basket-button" onClick={handleMoveToBasket}>
                    장바구니로 이동
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
