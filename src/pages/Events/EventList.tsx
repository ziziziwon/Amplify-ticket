import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import IconifyIcon from "../../components/Icon/IconifyIcon";
import MainLayout from "../../components/Layout/MainLayout";
import { Event, EventFilterType, EventSortType } from "../../types";
import { eventsService, eventWinnersService, eventParticipantsService } from "../../firebase/services";
import { useTicketStore } from "../../stores/useTicketStore";
import "./EventList.css";

const EventList: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useTicketStore();
  
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [filterType, setFilterType] = useState<EventFilterType>("all");
  const [sortType, setSortType] = useState<EventSortType>("latest");
  
  const [myEventIds, setMyEventIds] = useState<Set<string>>(new Set());
  const [winnerEventIds, setWinnerEventIds] = useState<Set<string>>(new Set());

  // 이벤트 목록 로드
  useEffect(() => {
    loadEvents();
  }, [sortType]);

  // 필터링
  useEffect(() => {
    applyFilter();
  }, [filterType, events, myEventIds, winnerEventIds]);

  // 사용자의 참여/당첨 정보 로드
  useEffect(() => {
    if (user) {
      loadUserEventInfo();
    }
  }, [user, events]);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const data = await eventsService.getAll(sortType);
      setEvents(data);
    } catch (error) {
      console.error("이벤트 로드 실패:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserEventInfo = async () => {
    if (!user) return;
    
    const participated = new Set<string>();
    const won = new Set<string>();
    
    for (const event of events) {
      // 참여 여부 확인
      const hasParticipated = await eventParticipantsService.checkParticipation(event.id, user.uid);
      if (hasParticipated) {
        participated.add(event.id);
      }
      
      // 당첨 여부 확인
      if (event.isWinnerAnnounced) {
        const isWinner = await eventWinnersService.checkWinner(event.id, user.uid);
        if (isWinner) {
          won.add(event.id);
        }
      }
    }
    
    setMyEventIds(participated);
    setWinnerEventIds(won);
  };

  const applyFilter = () => {
    let filtered = [...events];
    
    switch (filterType) {
      case "winners":
        // 당첨자 발표된 이벤트만
        filtered = filtered.filter(event => event.isWinnerAnnounced);
        break;
      case "my_events":
        // 내가 참여한 이벤트만
        if (user) {
          filtered = filtered.filter(event => myEventIds.has(event.id));
        } else {
          filtered = [];
        }
        break;
      case "all":
      default:
        break;
    }
    
    setFilteredEvents(filtered);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ongoing":
        return "#10b981";
      case "scheduled":
        return "#3b82f6";
      case "ended":
        return "#6b7280";
      default:
        return "#6b7280";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "ongoing":
        return "진행중";
      case "scheduled":
        return "예정";
      case "ended":
        return "종료";
      default:
        return status;
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).replace(/\. /g, ".").replace(/\.$/, "");
  };

  const handleEventClick = (eventId: string) => {
    navigate(`/events/${eventId}`);
  };

  const handleTabChange = (newValue: EventFilterType) => {
    if (newValue === "my_events" && !user) {
      navigate("/login");
      return;
    }
    setFilterType(newValue);
  };

  return (
    <MainLayout>
      {/* Hero Section */}
      <div className="eventlist-hero-section">
        <div className="eventlist-hero-content">
          <h1 className="eventlist-hero-title">이벤트</h1>
          <p className="eventlist-hero-subtitle">
            다양한 이벤트에 참여하고 혜택을 받아보세요
          </p>
        </div>
      </div>

      {/* 탭 메뉴 */}
      <div className="eventlist-tabs-container">
        <div className="eventlist-tabs-wrapper">
          <ul className="eventlist-tabs-list">
            <li>
              <button
                className={`eventlist-tab ${filterType === "all" ? "active" : ""}`}
                onClick={() => handleTabChange("all")}
              >
                전체 이벤트
              </button>
            </li>
            <li>
              <button
                className={`eventlist-tab ${filterType === "winners" ? "active" : ""}`}
                onClick={() => handleTabChange("winners")}
              >
                당첨자 발표
              </button>
            </li>
            <li>
              <button
                className={`eventlist-tab ${filterType === "my_events" ? "active" : ""}`}
                onClick={() => handleTabChange("my_events")}
              >
                참여 이벤트
              </button>
            </li>
          </ul>
        </div>
      </div>

      {/* 컨텐츠 영역 */}
      <div className="eventlist-main-content">
        {/* 정렬 */}
        <div className="eventlist-toolbar">
          <p className="eventlist-count">전체 {filteredEvents.length}개</p>
          <div className="eventlist-sort-wrapper">
            <label htmlFor="sort-select" className="eventlist-sort-label">정렬</label>
            <select
              id="sort-select"
              className="eventlist-sort-select"
              value={sortType}
              onChange={(e) => setSortType(e.target.value as EventSortType)}
            >
              <option value="latest">최신순</option>
              <option value="deadline">마감 임박</option>
              <option value="popular">인기순</option>
            </select>
          </div>
        </div>

        {/* 이벤트 목록 */}
        {loading ? (
          <div className="eventlist-loading">
            <div className="spinner"></div>
            <p className="eventlist-loading-text">로딩 중...</p>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="eventlist-empty-state">
            <p className="eventlist-empty-text">
              {filterType === "my_events"
                ? "참여한 이벤트가 없습니다."
                : "진행 중인 이벤트가 없습니다."}
            </p>
          </div>
        ) : (
          <div className="eventlist-grid">
            {filteredEvents.map((event) => (
              <div
                key={event.id}
                className="eventlist-card"
                onClick={() => handleEventClick(event.id)}
              >
                {/* 썸네일 */}
                <div className="eventlist-card-image-wrapper">
                  <img
                    src={event.imageUrl}
                    alt={event.title}
                    className="eventlist-card-image"
                  />
                </div>
                
                <div className="eventlist-card-content">
                  {/* 상태 뱃지 */}
                  <div className="eventlist-card-chips">
                    <span
                      className="eventlist-status-chip"
                      style={{ backgroundColor: getStatusColor(event.status) }}
                    >
                      {getStatusText(event.status)}
                    </span>
                    {myEventIds.has(event.id) && (
                      <span className="eventlist-chip eventlist-chip-outlined">참여완료</span>
                    )}
                    {winnerEventIds.has(event.id) && (
                      <span className="eventlist-chip eventlist-chip-error">당첨</span>
                    )}
                  </div>

                  {/* 제목 */}
                  <h3 className="eventlist-card-title">{event.title}</h3>

                  {/* 설명 */}
                  <p className="eventlist-card-description">
                    {event.description}
                  </p>

                  {/* 기간 */}
                  <div className="eventlist-card-meta">
                    <div className="eventlist-meta-item">
                      <IconifyIcon icon="mdi:calendar-today" width={16} height={16} />
                      <span className="eventlist-meta-text">
                        {formatDate(event.startDate)} ~ {formatDate(event.endDate)}
                      </span>
                    </div>

                    {/* 통계 */}
                    <div className="eventlist-card-stats">
                      <div className="eventlist-stat-item">
                        <IconifyIcon icon="mdi:account-group" width={16} height={16} />
                        <span className="eventlist-stat-text">{event.participantCount}명</span>
                      </div>
                      <div className="eventlist-stat-item">
                        <IconifyIcon icon="mdi:eye" width={16} height={16} />
                        <span className="eventlist-stat-text">{event.viewCount}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default EventList;
