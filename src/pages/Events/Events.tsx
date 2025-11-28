import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import IconifyIcon from "../../components/Icon/IconifyIcon";
import MainLayout from "../../components/Layout/MainLayout";
import "./Events.css";

// 이벤트 타입 정의
type EventType = "all" | "winner" | "participated";

interface Event {
  id: string;
  title: string;
  description: string;
  period: string;
  status: string;
  image: string;
  color: string;
  type: EventType[];
}

// 임시 이벤트 데이터
const events: Event[] = [
  {
    id: "event-1",
    title: "신규 회원 가입 이벤트",
    description: "지금 가입하고 5,000원 할인 쿠폰을 받아가세요!",
    period: "2025.01.01 ~ 2025.12.31",
    status: "진행중",
    image: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800",
    color: "#FF8C55",
    type: ["all", "participated"],
  },
  {
    id: "event-2",
    title: "선예매 특별 할인",
    description: "선예매 티켓 구매 시 최대 30% 할인 혜택!",
    period: "2025.02.01 ~ 2025.02.28",
    status: "진행중",
    image: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800",
    color: "#4C4F7A",
    type: ["all"],
  },
  {
    id: "event-3",
    title: "월간 럭키드로우",
    description: "매월 추첨을 통해 VIP 티켓을 무료로 드립니다!",
    period: "2025.01.01 ~ 2025.12.31",
    status: "진행중",
    image: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800",
    color: "#7062A6",
    type: ["all", "participated"],
  },
  {
    id: "event-4",
    title: "첫 결제 10% 할인",
    description: "처음 티켓을 구매하시는 분께 10% 할인 쿠폰 증정!",
    period: "2025.01.15 ~ 2025.03.31",
    status: "진행중",
    image: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800",
    color: "#FF8C55",
    type: ["all"],
  },
  {
    id: "event-5",
    title: "친구 추천 이벤트",
    description: "친구를 초대하고 둘 다 3,000원 할인 쿠폰을 받으세요!",
    period: "2025.01.01 ~ 2025.06.30",
    status: "진행중",
    image: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800",
    color: "#4C4F7A",
    type: ["all", "participated"],
  },
  {
    id: "event-6",
    title: "VIP 멤버십 출시",
    description: "VIP 멤버십 가입 시 무료 배송과 특별 혜택을 받아보세요!",
    period: "2025.02.01 ~ 상시",
    status: "진행중",
    image: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=800",
    color: "#7062A6",
    type: ["all"],
  },
  {
    id: "winner-1",
    title: "1월 럭키드로우 당첨자 발표",
    description: "1월 럭키드로우 이벤트 당첨자를 발표합니다. 축하드립니다!",
    period: "발표일: 2025.01.31",
    status: "당첨자발표",
    image: "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800",
    color: "#4C4F7A",
    type: ["all", "winner"],
  },
  {
    id: "winner-2",
    title: "콜드플레이 내한 초대 이벤트 당첨자",
    description: "콜드플레이 서울 공연 VIP 티켓 당첨자 명단을 확인하세요!",
    period: "발표일: 2025.01.20",
    status: "당첨자발표",
    image: "https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=800",
    color: "#FF8C55",
    type: ["all", "winner"],
  },
  {
    id: "winner-3",
    title: "💎 설 연휴 특별 경품 당첨자",
    description: "설 연휴 특별 경품 이벤트 당첨자를 발표합니다!",
    period: "발표일: 2025.02.10",
    status: "당첨자발표",
    image: "https://images.unsplash.com/photo-1513151233558-d860c5398176?w=800",
    color: "#7062A6",
    type: ["all", "winner"],
  },
];

export default function Events() {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  // 상태별 필터링
  const filteredEvents = events.filter((event) => {
    if (statusFilter === "all") return true;
    if (statusFilter === "ongoing") return event.status === "진행중";
    if (statusFilter === "winner") return event.status === "당첨자발표";
    return true;
  });

  // 행 확장/축소
  const toggleRow = (id: string) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  const getStatusColor = (status: string) => {
    if (status === "진행중") return "#FF8C55";
    if (status === "당첨자발표") return "#4C4F7A";
    return "#707070";
  };

  return (
    <MainLayout>
      <div className="events-page">
        <div className="events-container">
          {/* 헤더 */}
          <div className="events-header">
            <div className="events-header-text">
              <h1 className="events-title">이벤트 관리</h1>
              <p className="events-subtitle">진행 중인 이벤트를 확인하고 관리합니다</p>
            </div>
            <div className="events-filter-wrapper">
              <select
                className="events-filter-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">전체 상태</option>
                <option value="ongoing">진행중</option>
                <option value="winner">당첨자발표</option>
              </select>
            </div>
          </div>

          {/* 통계 카드 */}
          <div className="events-stats-grid">
            <div className="events-stat-card">
              <p className="events-stat-label">전체 이벤트</p>
              <h2 className="events-stat-value">{filteredEvents.length}</h2>
            </div>
            <div className="events-stat-card">
              <p className="events-stat-label">진행중</p>
              <h2 className="events-stat-value events-stat-value-orange">
                {events.filter((e) => e.status === "진행중").length}
              </h2>
            </div>
          </div>

          {/* 이벤트 테이블 */}
          <div className="events-table-card">
            <div className="events-table-container">
              <table className="events-table">
                <thead>
                  <tr>
                    <th className="events-th events-th-expand"></th>
                    <th className="events-th">이벤트명</th>
                    <th className="events-th">기간</th>
                    <th className="events-th events-th-center">상태</th>
                    <th className="events-th events-th-center">관리</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEvents.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="events-empty-cell">
                        <p className="events-empty-text">이벤트가 없습니다</p>
                      </td>
                    </tr>
                  ) : (
                    filteredEvents.map((event) => (
                      <React.Fragment key={event.id}>
                        <tr className="events-table-row">
                          <td className="events-td">
                            <button
                              className="events-expand-button"
                              onClick={() => toggleRow(event.id)}
                            >
                              <IconifyIcon
                                icon={expandedRow === event.id ? "mdi:chevron-up" : "mdi:chevron-down"}
                                width={20}
                                height={20}
                              />
                            </button>
                          </td>
                          <td className="events-td">
                            <p className="events-event-title">{event.title}</p>
                          </td>
                          <td className="events-td">
                            <p className="events-event-period">{event.period}</p>
                          </td>
                          <td className="events-td events-td-center">
                            <span
                              className="events-status-chip"
                              style={{ backgroundColor: getStatusColor(event.status) }}
                            >
                              {event.status}
                            </span>
                          </td>
                          <td className="events-td events-td-center">
                            <button
                              className="events-view-button"
                              onClick={() => navigate(`/events/${event.id}`)}
                            >
                              <IconifyIcon icon="mdi:eye" width={20} height={20} />
                              상세보기
                            </button>
                          </td>
                        </tr>
                        {/* 확장된 내용 */}
                        {expandedRow === event.id && (
                          <tr className="events-expanded-row">
                            <td colSpan={5} className="events-expanded-cell">
                              <div className="events-expanded-content">
                                <img
                                  src={event.image}
                                  alt={event.title}
                                  className="events-expanded-image"
                                />
                                <div className="events-expanded-text">
                                  <p className="events-expanded-label">이벤트 설명:</p>
                                  <p className="events-expanded-description">{event.description}</p>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
