import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import IconifyIcon from "../../components/Icon/IconifyIcon";
import MainLayout from "../../components/Layout/MainLayout";
import { Event, EventParticipant } from "../../types";
import {
  eventsService,
  eventParticipantsService,
  eventWinnersService,
} from "../../firebase/services";
import { useTicketStore } from "../../stores/useTicketStore";
import "./EventDetail.css";

const EventDetail: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { user } = useTicketStore();

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasParticipated, setHasParticipated] = useState(false);
  const [isWinner, setIsWinner] = useState(false);

  // 응모 폼 상태
  const [openForm, setOpenForm] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    phone: "",
    agreePrivacy: false,
    agreeEvent: false,
    agreeSms: false,
  });
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (eventId) {
      loadEvent();
    }
  }, [eventId]);

  useEffect(() => {
    if (event && user) {
      checkUserStatus();
      // 조회수 증가
      eventsService.incrementViewCount(event.id);
    }
  }, [event, user]);

  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        email: user.email || "",
      }));
    }
  }, [user]);

  const loadEvent = async () => {
    if (!eventId) return;

    try {
      setLoading(true);
      const data = await eventsService.getById(eventId);
      setEvent(data);
    } catch (error) {
      console.error("이벤트 로드 실패:", error);
    } finally {
      setLoading(false);
    }
  };

  const checkUserStatus = async () => {
    if (!event || !user) return;

    // 참여 여부 확인
    const participated = await eventParticipantsService.checkParticipation(
      event.id,
      user.uid
    );
    setHasParticipated(participated);

    // 당첨 여부 확인
    if (event.isWinnerAnnounced) {
      const winner = await eventWinnersService.checkWinner(event.id, user.uid);
      setIsWinner(winner);
    }
  };

  const handleParticipateClick = () => {
    if (!user) {
      navigate("/login");
      return;
    }

    if (hasParticipated) {
      alert("이미 참여한 이벤트입니다.");
      return;
    }

    if (event?.status === "ended") {
      alert("종료된 이벤트입니다.");
      return;
    }

    if (event?.status === "scheduled") {
      alert("아직 시작하지 않은 이벤트입니다.");
      return;
    }

    setOpenForm(true);
  };

  const handleFormChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    setFormError("");
  };

  const handleSubmit = async () => {
    if (!event || !user) return;

    // 유효성 검사
    if (!formData.email || !formData.phone) {
      setFormError("이메일과 전화번호를 입력해주세요.");
      return;
    }

    if (!formData.agreePrivacy || !formData.agreeEvent) {
      setFormError("필수 동의 항목에 체크해주세요.");
      return;
    }

    try {
      setSubmitting(true);

      const participantData: Omit<
        EventParticipant,
        "id" | "eventId" | "participatedAt"
      > = {
        userId: user.uid,
        email: formData.email,
        phone: formData.phone,
        nickname: user.displayName || "익명",
        agreePrivacy: formData.agreePrivacy,
        agreeEvent: formData.agreeEvent,
        agreeSms: formData.agreeSms,
      };

      await eventParticipantsService.participate(event.id, participantData);

      alert("이벤트 참여가 완료되었습니다!");
      setOpenForm(false);
      setHasParticipated(true);

      // 이벤트 정보 새로고침
      loadEvent();
    } catch (error: any) {
      console.error("참여 실패:", error);
      setFormError(error.message || "참여에 실패했습니다.");
    } finally {
      setSubmitting(false);
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

  if (loading) {
    return (
      <MainLayout>
        <div className="eventdetail-container">
          <div className="eventdetail-loading">
            <div className="spinner"></div>
            <p className="eventdetail-loading-text">로딩 중...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!event) {
    return (
      <MainLayout>
        <div className="eventdetail-container">
          <div className="eventdetail-error">
            <p className="eventdetail-error-text">이벤트를 찾을 수 없습니다.</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="eventdetail-container">
        {/* 상단 배너 */}
        <div
          className="eventdetail-banner"
          style={{
            backgroundImage: `url(${event.bannerUrl || event.imageUrl})`,
          }}
        />

        <div className="eventdetail-content">
          {/* 왼쪽: 이벤트 정보 */}
          <div className="eventdetail-main">
            {/* 상태 및 제목 */}
            <div className="eventdetail-chips">
              <span
                className="eventdetail-status-chip"
                style={{ backgroundColor: getStatusColor(event.status) }}
              >
                {getStatusText(event.status)}
              </span>
              {hasParticipated && (
                <span className="eventdetail-chip eventdetail-chip-primary">
                  <IconifyIcon icon="mdi:check-circle" width={16} height={16} />
                  참여완료
                </span>
              )}
              {isWinner && (
                <span className="eventdetail-chip eventdetail-chip-error">
                  <IconifyIcon icon="mdi:trophy" width={16} height={16} />
                  당첨
                </span>
              )}
            </div>

            <h1 className="eventdetail-title">{event.title}</h1>

            {/* 통계 */}
            <div className="eventdetail-stats">
              <div className="eventdetail-stat-item">
                <IconifyIcon icon="mdi:account-group" width={20} height={20} />
                <span className="eventdetail-stat-text">
                  참여자 {event.participantCount}명
                </span>
              </div>
              <div className="eventdetail-stat-item">
                <IconifyIcon icon="mdi:eye" width={20} height={20} />
                <span className="eventdetail-stat-text">
                  조회수 {event.viewCount}
                </span>
              </div>
            </div>

            <hr className="eventdetail-divider" />

            {/* 상세 설명 */}
            <h2 className="eventdetail-section-title">이벤트 설명</h2>
            <p className="eventdetail-text">{event.description}</p>

            {/* 혜택 */}
            <h2 className="eventdetail-section-title">이벤트 혜택</h2>
            <p className="eventdetail-text">{event.benefits}</p>

            {/* 참여 조건 */}
            <h2 className="eventdetail-section-title">참여 조건</h2>
            <p className="eventdetail-text">{event.conditions}</p>
          </div>

          {/* 오른쪽: 참여하기 카드 */}
          <div className="eventdetail-sidebar">
            <div className="eventdetail-sidebar-card">
              <h3 className="eventdetail-sidebar-title">이벤트 정보</h3>

              <div className="eventdetail-sidebar-info">
                <div className="eventdetail-info-item">
                  <span className="eventdetail-info-label">이벤트 기간</span>
                  <span className="eventdetail-info-value">
                    {formatDate(event.startDate)} ~ {formatDate(event.endDate)}
                  </span>
                </div>

                <div className="eventdetail-info-item">
                  <span className="eventdetail-info-label">당첨자 발표</span>
                  <span className="eventdetail-info-value">
                    {formatDate(event.announcementDate)}
                  </span>
                </div>

                <div className="eventdetail-info-item">
                  <span className="eventdetail-info-label">당첨자 수</span>
                  <span className="eventdetail-info-value">
                    {event.winnerCount}명
                  </span>
                </div>
              </div>

              <button
                className="eventdetail-participate-button"
                onClick={handleParticipateClick}
                disabled={
                  hasParticipated ||
                  event.status === "ended" ||
                  event.status === "scheduled"
                }
              >
                {hasParticipated
                  ? "참여 완료"
                  : event.status === "ended"
                  ? "종료된 이벤트"
                  : event.status === "scheduled"
                  ? "예정된 이벤트"
                  : "참여하기"}
              </button>

              {event.isWinnerAnnounced && (
                <button
                  className="eventdetail-winners-button"
                  onClick={() => navigate(`/events/${event.id}/winners`)}
                >
                  당첨자 발표 보기
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 참여 폼 모달 */}
        {openForm && (
          <div className="eventdetail-modal-overlay" onClick={() => setOpenForm(false)}>
            <div className="eventdetail-modal" onClick={(e) => e.stopPropagation()}>
              <div className="eventdetail-modal-header">
                <h2 className="eventdetail-modal-title">이벤트 참여하기</h2>
                <button
                  className="eventdetail-modal-close"
                  onClick={() => setOpenForm(false)}
                >
                  <IconifyIcon icon="mdi:close" width={24} height={24} />
                </button>
              </div>

              <div className="eventdetail-modal-content">
                {formError && (
                  <div className="eventdetail-alert eventdetail-alert-error">
                    {formError}
                  </div>
                )}

                <div className="eventdetail-form-group">
                  <label className="eventdetail-form-label">이메일</label>
                  <input
                    type="email"
                    className="eventdetail-form-input"
                    value={formData.email}
                    onChange={(e) => handleFormChange("email", e.target.value)}
                    disabled
                  />
                </div>

                <div className="eventdetail-form-group">
                  <label className="eventdetail-form-label">전화번호</label>
                  <input
                    type="tel"
                    className="eventdetail-form-input"
                    placeholder="010-1234-5678"
                    value={formData.phone}
                    onChange={(e) => handleFormChange("phone", e.target.value)}
                  />
                </div>

                <div className="eventdetail-form-group">
                  <label className="eventdetail-checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.agreePrivacy}
                      onChange={(e) =>
                        handleFormChange("agreePrivacy", e.target.checked)
                      }
                    />
                    <span className="eventdetail-checkbox-text">
                      개인정보 수집 및 이용 동의 (필수)
                    </span>
                  </label>
                </div>

                <div className="eventdetail-form-group">
                  <label className="eventdetail-checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.agreeEvent}
                      onChange={(e) =>
                        handleFormChange("agreeEvent", e.target.checked)
                      }
                    />
                    <span className="eventdetail-checkbox-text">
                      이벤트 참여 동의 (필수)
                    </span>
                  </label>
                </div>

                <div className="eventdetail-form-group">
                  <label className="eventdetail-checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.agreeSms}
                      onChange={(e) =>
                        handleFormChange("agreeSms", e.target.checked)
                      }
                    />
                    <span className="eventdetail-checkbox-text">
                      당첨 문자 알림 동의 (선택)
                    </span>
                  </label>
                </div>
              </div>

              <div className="eventdetail-modal-actions">
                <button
                  className="eventdetail-modal-button eventdetail-modal-button-cancel"
                  onClick={() => setOpenForm(false)}
                >
                  취소
                </button>
                <button
                  className="eventdetail-modal-button eventdetail-modal-button-submit"
                  onClick={handleSubmit}
                  disabled={submitting}
                >
                  {submitting ? "처리 중..." : "참여하기"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default EventDetail;
