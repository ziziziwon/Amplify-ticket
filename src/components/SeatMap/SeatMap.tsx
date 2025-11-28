import React, { useState, useRef, useEffect, useMemo } from "react";
import { seatData } from "../../utils/seatData";
import "./SeatMap.css";

interface SelectedSeat {
  id: string;
  x: number;
  y: number;
  price: number;
  zone: string;
}

interface SeatMapProps {
  onSelectSeats?: (seats: SelectedSeat[]) => void;
  selectedSeats?: SelectedSeat[];
  maxSeats?: number;
}

// 좌석 ID에서 zone과 price 추출
const getZoneFromId = (id: string): string => {
  const parts = id.split("-");
  return parts[0]; // VIP, R, S, A
};

const getPriceFromZone = (zone: string): number => {
  const zoneData = seatData.find((z) => z.zone === zone);
  return zoneData?.price || 0;
};

// 제공된 SVG 구조의 좌석 데이터
const seatPositions: Array<{ id: string; cx: number; cy: number; zone: string }> = [
  // VIP-C
  { id: "VIP-C-1-1", cx: 380, cy: 170, zone: "VIP" },
  { id: "VIP-C-1-2", cx: 420, cy: 170, zone: "VIP" },
  { id: "VIP-C-1-3", cx: 460, cy: 170, zone: "VIP" },
  { id: "VIP-C-2-1", cx: 380, cy: 210, zone: "VIP" },
  { id: "VIP-C-2-2", cx: 420, cy: 210, zone: "VIP" },
  { id: "VIP-C-2-3", cx: 460, cy: 210, zone: "VIP" },
  // VIP-L
  { id: "VIP-L-1-1", cx: 240, cy: 170, zone: "VIP" },
  { id: "VIP-L-1-2", cx: 200, cy: 170, zone: "VIP" },
  { id: "VIP-L-1-3", cx: 160, cy: 170, zone: "VIP" },
  { id: "VIP-L-2-1", cx: 240, cy: 210, zone: "VIP" },
  { id: "VIP-L-2-2", cx: 200, cy: 210, zone: "VIP" },
  { id: "VIP-L-2-3", cx: 160, cy: 210, zone: "VIP" },
  // VIP-R
  { id: "VIP-R-1-1", cx: 600, cy: 170, zone: "VIP" },
  { id: "VIP-R-1-2", cx: 640, cy: 170, zone: "VIP" },
  { id: "VIP-R-1-3", cx: 680, cy: 170, zone: "VIP" },
  { id: "VIP-R-2-1", cx: 600, cy: 210, zone: "VIP" },
  { id: "VIP-R-2-2", cx: 640, cy: 210, zone: "VIP" },
  { id: "VIP-R-2-3", cx: 680, cy: 210, zone: "VIP" },
  // R-C
  { id: "R-C-1-1", cx: 360, cy: 260, zone: "R" },
  { id: "R-C-1-2", cx: 400, cy: 260, zone: "R" },
  { id: "R-C-1-3", cx: 440, cy: 260, zone: "R" },
  { id: "R-C-1-4", cx: 480, cy: 260, zone: "R" },
  { id: "R-C-2-1", cx: 360, cy: 300, zone: "R" },
  { id: "R-C-2-2", cx: 400, cy: 300, zone: "R" },
  { id: "R-C-2-3", cx: 440, cy: 300, zone: "R" },
  { id: "R-C-2-4", cx: 480, cy: 300, zone: "R" },
  // R-L
  { id: "R-L-1-1", cx: 240, cy: 260, zone: "R" },
  { id: "R-L-1-2", cx: 200, cy: 260, zone: "R" },
  { id: "R-L-1-3", cx: 160, cy: 260, zone: "R" },
  { id: "R-L-1-4", cx: 120, cy: 260, zone: "R" },
  { id: "R-L-2-1", cx: 240, cy: 300, zone: "R" },
  { id: "R-L-2-2", cx: 200, cy: 300, zone: "R" },
  { id: "R-L-2-3", cx: 160, cy: 300, zone: "R" },
  { id: "R-L-2-4", cx: 120, cy: 300, zone: "R" },
  // R-R
  { id: "R-R-1-1", cx: 600, cy: 260, zone: "R" },
  { id: "R-R-1-2", cx: 640, cy: 260, zone: "R" },
  { id: "R-R-1-3", cx: 680, cy: 260, zone: "R" },
  { id: "R-R-1-4", cx: 720, cy: 260, zone: "R" },
  { id: "R-R-2-1", cx: 600, cy: 300, zone: "R" },
  { id: "R-R-2-2", cx: 640, cy: 300, zone: "R" },
  { id: "R-R-2-3", cx: 680, cy: 300, zone: "R" },
  { id: "R-R-2-4", cx: 720, cy: 300, zone: "R" },
  // S-C
  { id: "S-C-1-1", cx: 340, cy: 350, zone: "S" },
  { id: "S-C-1-2", cx: 380, cy: 350, zone: "S" },
  { id: "S-C-1-3", cx: 420, cy: 350, zone: "S" },
  { id: "S-C-1-4", cx: 460, cy: 350, zone: "S" },
  { id: "S-C-1-5", cx: 500, cy: 350, zone: "S" },
  { id: "S-C-2-1", cx: 340, cy: 390, zone: "S" },
  { id: "S-C-2-2", cx: 380, cy: 390, zone: "S" },
  { id: "S-C-2-3", cx: 420, cy: 390, zone: "S" },
  { id: "S-C-2-4", cx: 460, cy: 390, zone: "S" },
  { id: "S-C-2-5", cx: 500, cy: 390, zone: "S" },
  // S-L
  { id: "S-L-1-1", cx: 240, cy: 350, zone: "S" },
  { id: "S-L-1-2", cx: 200, cy: 350, zone: "S" },
  { id: "S-L-1-3", cx: 160, cy: 350, zone: "S" },
  { id: "S-L-1-4", cx: 120, cy: 350, zone: "S" },
  { id: "S-L-2-1", cx: 240, cy: 390, zone: "S" },
  { id: "S-L-2-2", cx: 200, cy: 390, zone: "S" },
  { id: "S-L-2-3", cx: 160, cy: 390, zone: "S" },
  { id: "S-L-2-4", cx: 120, cy: 390, zone: "S" },
  // S-R
  { id: "S-R-1-1", cx: 600, cy: 350, zone: "S" },
  { id: "S-R-1-2", cx: 640, cy: 350, zone: "S" },
  { id: "S-R-1-3", cx: 680, cy: 350, zone: "S" },
  { id: "S-R-1-4", cx: 720, cy: 350, zone: "S" },
  { id: "S-R-2-1", cx: 600, cy: 390, zone: "S" },
  { id: "S-R-2-2", cx: 640, cy: 390, zone: "S" },
  { id: "S-R-2-3", cx: 680, cy: 390, zone: "S" },
  { id: "S-R-2-4", cx: 720, cy: 390, zone: "S" },
  // A-C
  { id: "A-C-1-1", cx: 330, cy: 440, zone: "A" },
  { id: "A-C-1-2", cx: 370, cy: 440, zone: "A" },
  { id: "A-C-1-3", cx: 410, cy: 440, zone: "A" },
  { id: "A-C-1-4", cx: 450, cy: 440, zone: "A" },
  { id: "A-C-1-5", cx: 490, cy: 440, zone: "A" },
  { id: "A-C-1-6", cx: 530, cy: 440, zone: "A" },
  { id: "A-C-2-1", cx: 330, cy: 480, zone: "A" },
  { id: "A-C-2-2", cx: 370, cy: 480, zone: "A" },
  { id: "A-C-2-3", cx: 410, cy: 480, zone: "A" },
  { id: "A-C-2-4", cx: 450, cy: 480, zone: "A" },
  { id: "A-C-2-5", cx: 490, cy: 480, zone: "A" },
  { id: "A-C-2-6", cx: 530, cy: 480, zone: "A" },
  // A-L
  { id: "A-L-1-1", cx: 240, cy: 440, zone: "A" },
  { id: "A-L-1-2", cx: 200, cy: 440, zone: "A" },
  { id: "A-L-1-3", cx: 160, cy: 440, zone: "A" },
  { id: "A-L-1-4", cx: 120, cy: 440, zone: "A" },
  { id: "A-L-2-1", cx: 240, cy: 480, zone: "A" },
  { id: "A-L-2-2", cx: 200, cy: 480, zone: "A" },
  { id: "A-L-2-3", cx: 160, cy: 480, zone: "A" },
  { id: "A-L-2-4", cx: 120, cy: 480, zone: "A" },
  // A-R
  { id: "A-R-1-1", cx: 600, cy: 440, zone: "A" },
  { id: "A-R-1-2", cx: 640, cy: 440, zone: "A" },
  { id: "A-R-1-3", cx: 680, cy: 440, zone: "A" },
  { id: "A-R-1-4", cx: 720, cy: 440, zone: "A" },
  { id: "A-R-2-1", cx: 600, cy: 480, zone: "A" },
  { id: "A-R-2-2", cx: 640, cy: 480, zone: "A" },
  { id: "A-R-2-3", cx: 680, cy: 480, zone: "A" },
  { id: "A-R-2-4", cx: 720, cy: 480, zone: "A" },
];

export default function SeatMap({ 
  onSelectSeats, 
  selectedSeats: externalSelectedSeats,
  maxSeats = 4 
}: SeatMapProps) {
  const [internalSelectedSeats, setInternalSelectedSeats] = useState<SelectedSeat[]>([]);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const drag = useRef({ active: false, x: 0, y: 0 });
  const [soldSeats, setSoldSeats] = useState<Set<string>>(new Set());

  // 외부에서 selectedSeats를 받으면 그것을 사용, 아니면 내부 state 사용
  const selectedSeats = externalSelectedSeats || internalSelectedSeats;

  // 매진 좌석 초기화 (랜덤)
  useEffect(() => {
    const sold = new Set<string>();
    // 10% 확률로 매진
    seatPositions.forEach((seat) => {
      if (Math.random() < 0.1) {
        sold.add(seat.id);
      }
    });
    setSoldSeats(sold);
  }, []);

  /* --- 확대/축소 버튼 --- */
  const zoom = (v: number) => setScale((p) => Math.min(2, Math.max(0.6, p + v)));

  const handleResetView = () => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
  };

  /* --- 드래그 이동 --- */
  const onMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    const target = e.target as HTMLElement;
    if (target.closest('g[data-seat-id]')) {
      return; // 좌석 클릭은 드래그로 처리하지 않음
    }
    
    if (e.button === 0) {
      drag.current = { active: true, x: e.clientX, y: e.clientY };
    }
  };

  const onMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!drag.current.active) return;

    setOffset((prev) => ({
      x: prev.x + (e.clientX - drag.current.x),
      y: prev.y + (e.clientY - drag.current.y),
    }));

    drag.current.x = e.clientX;
    drag.current.y = e.clientY;
  };

  const onMouseUp = () => {
    drag.current.active = false;
  };

  const onMouseLeave = () => {
    drag.current.active = false;
  };

  /* --- 좌석 클릭 --- */
  const handleSeatClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    const seatGroup = (e.currentTarget as HTMLElement).closest('g[data-seat-id]');
    if (!seatGroup) return;

    const seatId = seatGroup.getAttribute('data-seat-id');
    if (!seatId) return;

    // 매진 좌석 체크
    if (soldSeats.has(seatId)) {
      alert("이미 예매된 좌석입니다.");
      return;
    }

    // 좌석 정보 추출
    const seatPos = seatPositions.find((s) => s.id === seatId);
    if (!seatPos) return;

    const price = getPriceFromZone(seatPos.zone);

    const seat: SelectedSeat = {
      id: seatId,
      x: seatPos.cx,
      y: seatPos.cy,
      price,
      zone: seatPos.zone,
    };

    // 선택/해제
    let list = [...selectedSeats];
    const exists = list.find((s) => s.id === seatId);

    if (exists) {
      list = list.filter((s) => s.id !== seatId);
    } else {
      if (list.length >= maxSeats) {
        alert(`최대 ${maxSeats}매까지 선택 가능합니다.`);
        return;
      }
      list = [...list, seat];
    }

    // 상태 업데이트
    if (externalSelectedSeats === undefined) {
      setInternalSelectedSeats(list);
    }
    
    // 부모 컴포넌트에 알림
    if (onSelectSeats) {
      onSelectSeats(list);
    }
  };

  // SVG 뷰포트 크기
  const viewBoxWidth = 840;
  const viewBoxHeight = 650;

  // 좌석을 블록별로 그룹화
  const seatsByBlock = useMemo(() => {
    const blocks: Record<string, typeof seatPositions> = {};
    seatPositions.forEach((seat) => {
      const parts = seat.id.split("-");
      const blockKey = `${parts[0]}-${parts[1]}`; // VIP-C, VIP-L, R-C, etc.
      if (!blocks[blockKey]) {
        blocks[blockKey] = [];
      }
      blocks[blockKey].push(seat);
    });
    return blocks;
  }, []);

  return (
    <div className="seatmap-wrapper">
      {/* 확대/축소 컨트롤 */}
      <div className="zoom-controls">
        <button onClick={() => zoom(0.08)} title="확대">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 3V13M3 8H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>
        <button onClick={() => zoom(-0.08)} title="축소">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M3 8H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>
        <button onClick={handleResetView} title="초기화">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 2L10 4H9C10.1 4 11 4.9 11 6V7H13V6C13 4.3 11.7 3 10 3H9L8 2ZM4 4H5L4 2L2 4H3C1.9 4 1 4.9 1 6V7H3V6C3 4.3 4.3 3 6 3H5L4 4Z" fill="currentColor"/>
          </svg>
        </button>
      </div>

      {/* SVG 좌석맵 */}
      <div className="seatmap-svg-container">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
          className="seatmap-svg"
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseLeave}
          style={{
            cursor: drag.current.active ? "grabbing" : "grab",
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
            transformOrigin: "center center",
          }}
        >
          <defs>
            <linearGradient id="stageGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#6A5DE8"/>
              <stop offset="100%" stopColor="#A085FF"/>
            </linearGradient>
          </defs>

          {/* STAGE */}
          <rect x="320" y="40" width="200" height="50" rx="10" fill="url(#stageGrad)"/>
          <text x="420" y="75" textAnchor="middle" fontSize="20" fontWeight="700" fill="#fff">STAGE</text>

          {/* 구역별 라벨 (가격 표시) */}
          <text x="420" y="140" textAnchor="middle" fill="#666" fontSize="14" fontWeight="600">VIP석 150,000원</text>
          <text x="420" y="235" textAnchor="middle" fill="#666" fontSize="14" fontWeight="600">R석 110,000원</text>
          <text x="420" y="330" textAnchor="middle" fill="#666" fontSize="14" fontWeight="600">S석 88,000원</text>
          <text x="420" y="425" textAnchor="middle" fill="#666" fontSize="14" fontWeight="600">A석 66,000원</text>

          {/* 좌석 렌더링 - 블록별로 그룹화 */}
          {Object.entries(seatsByBlock).map(([blockKey, seats]) => (
            <g key={blockKey} id={blockKey} className="seat">
              {seats.map((seatPos) => {
                const isSelected = selectedSeats.some((s) => s.id === seatPos.id);
                const isSold = soldSeats.has(seatPos.id);
                return (
                  <g
                    key={seatPos.id}
                    data-seat-id={seatPos.id}
                    onClick={handleSeatClick}
                    className={`seat ${isSold ? "sold" : isSelected ? "selected" : ""}`}
                    style={{ cursor: isSold ? "not-allowed" : "pointer" }}
                  >
                    <circle
                      cx={seatPos.cx}
                      cy={seatPos.cy}
                      r="12"
                      className={isSold ? "sold" : isSelected ? "selected" : ""}
                    />
                  </g>
                );
              })}
            </g>
          ))}

          {/* 선택된 좌석에 가격 라벨 표시 */}
          {selectedSeats.map((seat) => (
            <text
              key={seat.id}
              x={seat.x}
              y={seat.y - 20}
              textAnchor="middle"
              fontSize="10"
              fill="#7b61ff"
              fontWeight="700"
              className="seat-price-label"
              pointerEvents="none"
            >
              {seat.price.toLocaleString()}
            </text>
          ))}
        </svg>
      </div>

      {/* 범례 */}
      <div className="seatmap-legend">
        <div className="legend-item">
          <div className="legend-color available"></div>
          <span>예매 가능</span>
        </div>
        <div className="legend-item">
          <div className="legend-color selected"></div>
          <span>선택한 좌석</span>
        </div>
        <div className="legend-item">
          <div className="legend-color sold"></div>
          <span>매진</span>
        </div>
      </div>
    </div>
  );
}
