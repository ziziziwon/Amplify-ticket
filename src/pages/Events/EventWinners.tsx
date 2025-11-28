import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import IconifyIcon from "../../components/Icon/IconifyIcon";
import MainLayout from "../../components/Layout/MainLayout";
import { Event, EventWinner } from "../../types";
import { eventsService, eventWinnersService } from "../../firebase/services";
import { useTicketStore } from "../../stores/useTicketStore";
import "./EventWinners.css";

const EventWinners: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { user } = useTicketStore();

  const [event, setEvent] = useState<Event | null>(null);
  const [winners, setWinners] = useState<EventWinner[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUserWinner, setIsUserWinner] = useState(false);

  useEffect(() => {
    if (eventId) {
      loadData();
    }
  }, [eventId]);

  const loadData = async () => {
    if (!eventId) return;

    try {
      setLoading(true);

      // 이벤트 정보 로드
      const eventData = await eventsService.getById(eventId);
      setEvent(eventData);

      // 당첨자 발표가 되지 않았으면 로드 안 함
      if (!eventData?.isWinnerAnnounced) {
        setLoading(false);
        return;
      }

      // 당첨자 목록 로드
      const winnersData = await eventWinnersService.getAll(eventId);
      setWinners(winnersData);

      // 내가 당첨됐는지 확인
      if (user) {
        const isWinner = winnersData.some((w) => w.userId === user.uid);
        setIsUserWinner(isWinner);
      }
    } catch (error) {
      console.error("데이터 로드 실패:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const isAnnouncementDatePassed = () => {
    if (!event?.announcementDate) return false;
    const announcementDate = event.announcementDate.toDate
      ? event.announcementDate.toDate()
      : new Date(event.announcementDate);
    return new Date() >= announcementDate;
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="eventwinners-container">
          <div className="eventwinners-loading">
            <div className="spinner"></div>
            <p className="eventwinners-loading-text">로딩 중...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!event) {
    return (
      <MainLayout>
        <div className="eventwinners-container">
          <div className="eventwinners-error">
            <p className="eventwinners-error-text">이벤트를 찾을 수 없습니다.</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  // 발표 전
  if (!event.isWinnerAnnounced || !isAnnouncementDatePassed()) {
    return (
      <MainLayout>
        <div className="eventwinners-container eventwinners-container-narrow">
          <button
            className="eventwinners-back-button"
            onClick={() => navigate(`/events/${eventId}`)}
          >
            <IconifyIcon icon="mdi:arrow-left" width={20} height={20} />
            돌아가기
          </button>

          <div className="eventwinners-card">
            <div className="eventwinners-card-content eventwinners-card-content-centered">
              <IconifyIcon icon="mdi:trophy" width={80} height={80} className="eventwinners-icon-large" />
              <h2 className="eventwinners-title-large">{event.title}</h2>
              <h3 className="eventwinners-subtitle">당첨자 발표 예정</h3>
              <p className="eventwinners-text">
                {formatDate(event.announcementDate)}에 발표됩니다.
              </p>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  // 발표 후
  return (
    <MainLayout>
      <div className="eventwinners-container">
        <button
          className="eventwinners-back-button"
          onClick={() => navigate(`/events/${eventId}`)}
        >
          <IconifyIcon icon="mdi:arrow-left" width={20} height={20} />
          돌아가기
        </button>

        {/* 헤더 */}
        <div className="eventwinners-header">
          <IconifyIcon icon="mdi:trophy" width={60} height={60} className="eventwinners-icon" />
          <h1 className="eventwinners-title">당첨자 발표</h1>
          <h2 className="eventwinners-subtitle">{event.title}</h2>
          <p className="eventwinners-date">발표일: {formatDate(event.announcementDate)}</p>
        </div>

        {/* 당첨 여부 알림 */}
        {user && isUserWinner && (
          <div className="eventwinners-alert eventwinners-alert-success">
            <IconifyIcon icon="mdi:trophy" width={20} height={20} />
            <div className="eventwinners-alert-content">
              <h3 className="eventwinners-alert-title">
                <IconifyIcon icon="mdi:party-popper" width={20} height={20} style={{ marginRight: "8px", verticalAlign: "middle" }} />
                축하합니다! 당첨되셨습니다!
              </h3>
              <p className="eventwinners-alert-text">
                당첨자 정보를 확인해주세요. 등록하신 연락처로 안내가 발송됩니다.
              </p>
            </div>
          </div>
        )}

        {/* 안내 메시지 */}
        <div className="eventwinners-alert eventwinners-alert-info">
          <p className="eventwinners-alert-bullet">
            • 당첨자 정보는 개인정보 보호를 위해 마스킹 처리되어 표시됩니다.
          </p>
          <p className="eventwinners-alert-bullet">
            • 당첨자에게는 등록하신 이메일 및 전화번호로 별도 안내됩니다.
          </p>
        </div>

        {/* 당첨자 목록 */}
        <div className="eventwinners-card">
          <div className="eventwinners-card-header">
            <h3 className="eventwinners-card-title">당첨자 명단</h3>
            <span className="eventwinners-chip">
              <IconifyIcon icon="mdi:trophy" width={20} height={20} />
              총 {winners.length}명
            </span>
          </div>

          {winners.length === 0 ? (
            <div className="eventwinners-empty">
              <p className="eventwinners-empty-text">당첨자가 없습니다.</p>
            </div>
          ) : (
            <div className="eventwinners-table-container">
              <table className="eventwinners-table">
                <thead>
                  <tr>
                    <th className="eventwinners-th eventwinners-th-center">번호</th>
                    <th className="eventwinners-th">닉네임</th>
                    <th className="eventwinners-th">이메일</th>
                    <th className="eventwinners-th">전화번호</th>
                  </tr>
                </thead>
                <tbody>
                  {winners.map((winner, index) => (
                    <tr
                      key={winner.id}
                      className={`eventwinners-tr ${user && winner.userId === user.uid ? "eventwinners-tr-highlight" : ""}`}
                    >
                      <td className="eventwinners-td eventwinners-td-center">{index + 1}</td>
                      <td className="eventwinners-td">
                        <div className="eventwinners-td-content">
                          <span>{winner.nickname}</span>
                          {user && winner.userId === user.uid && (
                            <span className="eventwinners-chip eventwinners-chip-success">본인</span>
                          )}
                        </div>
                      </td>
                      <td className="eventwinners-td">
                        <span className="eventwinners-td-monospace">{winner.email}</span>
                      </td>
                      <td className="eventwinners-td">
                        <span className="eventwinners-td-monospace">{winner.phone}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* 안내사항 */}
        <div className="eventwinners-card eventwinners-card-margin">
          <h3 className="eventwinners-card-title">당첨자 유의사항</h3>
          <ul className="eventwinners-notice-list">
            <li className="eventwinners-notice-item">
              • 당첨자에게는 등록하신 연락처로 개별 안내됩니다.
            </li>
            <li className="eventwinners-notice-item">
              • 경품 수령 기한 내 연락이 닿지 않을 경우 당첨이 취소될 수 있습니다.
            </li>
            <li className="eventwinners-notice-item">
              • 본인 확인을 위해 가입 시 사용한 정보가 필요할 수 있습니다.
            </li>
            <li className="eventwinners-notice-item">
              • 문의사항은 고객센터를 통해 문의해주세요.
            </li>
          </ul>
        </div>
      </div>
    </MainLayout>
  );
};

export default EventWinners;
