import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import IconifyIcon from "../../components/Icon/IconifyIcon";
import MainLayout from "../../components/Layout/MainLayout";
import { Event } from "../../types";
import { eventParticipantsService, eventWinnersService } from "../../firebase/services";
import { useTicketStore } from "../../stores/useTicketStore";
import "./MyEvents.css";

const MyEvents: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useTicketStore();

  const [myEvents, setMyEvents] = useState<Event[]>([]);
  const [winnerEventIds, setWinnerEventIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadMyEvents();
    } else {
      navigate("/login");
    }
  }, [user]);

  const loadMyEvents = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // 내가 참여한 이벤트 목록 가져오기
      const events = await eventParticipantsService.getByUserId(user.uid);
      setMyEvents(events);

      // 당첨 여부 확인
      const won = new Set<string>();
      for (const event of events) {
        if (event.isWinnerAnnounced) {
          const isWinner = await eventWinnersService.checkWinner(event.id, user.uid);
          if (isWinner) {
            won.add(event.id);
          }
        }
      }
      setWinnerEventIds(won);
    } catch (error) {
      console.error("내 이벤트 로드 실패:", error);
    } finally {
      setLoading(false);
    }
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
    return date
      .toLocaleDateString("ko-KR", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      })
      .replace(/\. /g, ".")
      .replace(/\.$/, "");
  };

  const handleEventClick = (eventId: string) => {
    navigate(`/events/${eventId}`);
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="myevents-container">
          <div className="myevents-loading">
            <div className="spinner"></div>
            <p className="myevents-loading-text">로딩 중...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="myevents-container">
        {/* 헤더 */}
        <div className="myevents-header">
          <h1 className="myevents-title">참여한 이벤트</h1>
          <p className="myevents-subtitle">내가 참여한 이벤트 목록입니다</p>
          <p className="myevents-count">총 {myEvents.length}개</p>
        </div>

        {/* 이벤트 목록 */}
        {myEvents.length === 0 ? (
          <div className="myevents-empty-state">
            <p className="myevents-empty-text">참여한 이벤트가 없습니다.</p>
          </div>
        ) : (
          <div className="myevents-grid">
            {myEvents.map((event) => (
              <div
                key={event.id}
                className="myevents-card"
                onClick={() => handleEventClick(event.id)}
              >
                {/* 썸네일 */}
                <div className="myevents-card-image-wrapper">
                  <img
                    src={event.imageUrl}
                    alt={event.title}
                    className="myevents-card-image"
                  />
                </div>

                <div className="myevents-card-content">
                  {/* 상태 뱃지 */}
                  <div className="myevents-card-chips">
                    <span
                      className="myevents-status-chip"
                      style={{ backgroundColor: getStatusColor(event.status) }}
                    >
                      {getStatusText(event.status)}
                    </span>
                    <span className="myevents-chip myevents-chip-primary">
                      <IconifyIcon icon="mdi:check-circle" width={16} height={16} />
                      참여완료
                    </span>
                    {winnerEventIds.has(event.id) && (
                      <span className="myevents-chip myevents-chip-error">
                        <IconifyIcon icon="mdi:trophy" width={16} height={16} />
                        당첨
                      </span>
                    )}
                    {event.isWinnerAnnounced && !winnerEventIds.has(event.id) && (
                      <span className="myevents-chip myevents-chip-outlined">미당첨</span>
                    )}
                  </div>

                  {/* 제목 */}
                  <h3 className="myevents-card-title">{event.title}</h3>

                  {/* 설명 */}
                  <p className="myevents-card-description">{event.description}</p>

                  {/* 기간 */}
                  <div className="myevents-card-meta">
                    <div className="myevents-meta-item">
                      <IconifyIcon icon="mdi:calendar-today" width={16} height={16} />
                      <span className="myevents-meta-text">
                        {formatDate(event.startDate)} ~ {formatDate(event.endDate)}
                      </span>
                    </div>

                    {/* 발표일 */}
                    {event.announcementDate && (
                      <div className="myevents-meta-item">
                        <IconifyIcon icon="mdi:trophy" width={16} height={16} />
                        <span className="myevents-meta-text">
                          발표: {formatDate(event.announcementDate)}
                        </span>
                      </div>
                    )}
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

export default MyEvents;
