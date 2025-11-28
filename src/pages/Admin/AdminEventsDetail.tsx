import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

import IconifyIcon from "../../components/Icon/IconifyIcon";
import MainLayout from "../../components/Layout/MainLayout";
import { Event, EventParticipant, EventWinner } from "../../types";
import {
  eventsService,
  eventParticipantsService,
  eventWinnersService,
} from "../../firebase/services";
import { Timestamp } from "firebase/firestore";



const AdminEventsDetail: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();

  const [event, setEvent] = useState<Event | null>(null);
  const [participants, setParticipants] = useState<EventParticipant[]>([]);
  const [selectedWinners, setSelectedWinners] = useState<EventWinner[]>([]);
  const [existingWinners, setExistingWinners] = useState<EventWinner[]>([]);

  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [winnerCount, setWinnerCount] = useState(1);
  const [showConfirm, setShowConfirm] = useState(false);
  const [saving, setSaving] = useState(false);

  // 수정 다이얼로그
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    imageUrl: string;
    bannerUrl: string;
    startDate: string;
    endDate: string;
    announcementDate: string;
    benefits: string;
    conditions: string;
    maxParticipantsPerUser: number;
    winnerCount: number;
    status: "scheduled" | "ongoing" | "ended";
  }>({
    title: "",
    description: "",
    imageUrl: "",
    bannerUrl: "",
    startDate: "",
    endDate: "",
    announcementDate: "",
    benefits: "",
    conditions: "",
    maxParticipantsPerUser: 1,
    winnerCount: 1,
    status: "scheduled",
  });

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
      setWinnerCount(eventData?.winnerCount || 1);

      // 수정 폼 데이터 설정
      if (eventData) {
        const formatDateForInput = (timestamp: any) => {
          const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
          return date.toISOString().slice(0, 16);
        };

        setFormData({
          title: eventData.title,
          description: eventData.description,
          imageUrl: eventData.imageUrl,
          bannerUrl: eventData.bannerUrl || "",
          startDate: formatDateForInput(eventData.startDate),
          endDate: formatDateForInput(eventData.endDate),
          announcementDate: formatDateForInput(eventData.announcementDate),
          benefits: eventData.benefits,
          conditions: eventData.conditions,
          maxParticipantsPerUser: eventData.maxParticipantsPerUser,
          winnerCount: eventData.winnerCount,
          status: eventData.status,
        });
      }

      // 참여자 목록 로드
      const participantsData = await eventParticipantsService.getAll(eventId);
      setParticipants(participantsData);

      // 기존 당첨자 로드
      if (eventData?.isWinnerAnnounced) {
        const winnersData = await eventWinnersService.getAll(eventId);
        setExistingWinners(winnersData);
        setSelectedWinners(winnersData);
      }
    } catch (error) {
      console.error("데이터 로드 실패:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLottery = async () => {
    if (!eventId) return;

    if (winnerCount > participants.length) {
      alert(`참여자(${participants.length}명)보다 많은 당첨자를 선정할 수 없습니다.`);
      return;
    }

    if (winnerCount < 1) {
      alert("당첨자 수는 1명 이상이어야 합니다.");
      return;
    }

    try {
      const winners = await eventWinnersService.selectWinners(eventId, winnerCount);
      setSelectedWinners(winners);
      alert(`${winners.length}명의 당첨자가 선정되었습니다.`);
    } catch (error: any) {
      console.error("추첨 실패:", error);
      alert(error.message || "추첨에 실패했습니다.");
    }
  };

  const handleSaveWinners = async () => {
    if (!eventId) return;

    if (selectedWinners.length === 0) {
      alert("추첨을 먼저 진행해주세요.");
      return;
    }

    try {
      setSaving(true);
      await eventWinnersService.saveWinners(eventId, selectedWinners);
      alert("당첨자가 확정되었습니다!");
      setShowConfirm(false);

      // 데이터 새로고침
      loadData();
    } catch (error) {
      console.error("저장 실패:", error);
      alert("저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleAnnouncement = async () => {
    if (!eventId || !event) return;

    const newStatus = !event.isWinnerAnnounced;
    const message = newStatus
      ? "당첨자를 공개하시겠습니까?"
      : "당첨자 공개를 취소하시겠습니까?";

    if (!window.confirm(message)) return;

    try {
      await eventWinnersService.toggleAnnouncement(eventId, newStatus);
      alert(newStatus ? "당첨자가 공개되었습니다." : "당첨자 공개가 취소되었습니다.");
      loadData();
    } catch (error) {
      console.error("상태 변경 실패:", error);
      alert("상태 변경에 실패했습니다.");
    }
  };

  const handleExportParticipantsCSV = () => {
    if (participants.length === 0) {
      alert("참여자가 없습니다.");
      return;
    }

    // CSV 데이터 생성
    const headers = ["번호", "닉네임", "이메일", "전화번호", "참여일시"];
    const rows = participants.map((participant, index) => [
      index + 1,
      participant.nickname,
      participant.email,
      participant.phone,
      participant.participatedAt.toDate
        ? participant.participatedAt.toDate().toLocaleString("ko-KR")
        : new Date(participant.participatedAt).toLocaleString("ko-KR"),
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.join(",")),
    ].join("\n");

    // BOM 추가 (엑셀에서 한글 깨짐 방지)
    const BOM = "\uFEFF";
    const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${event?.title || "event"}_participants.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExportWinnersCSV = () => {
    if (selectedWinners.length === 0) {
      alert("당첨자가 없습니다.");
      return;
    }

    // CSV 데이터 생성
    const headers = ["번호", "닉네임", "이메일", "전화번호"];
    const rows = selectedWinners.map((winner, index) => [
      index + 1,
      winner.nickname,
      winner.email,
      winner.phone,
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.join(",")),
    ].join("\n");

    // BOM 추가
    const BOM = "\uFEFF";
    const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${event?.title || "event"}_winners.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleUpdateEvent = async () => {
    if (!eventId) return;

    try {
      const eventData = {
        title: formData.title,
        description: formData.description,
        imageUrl: formData.imageUrl,
        bannerUrl: formData.bannerUrl,
        startDate: Timestamp.fromDate(new Date(formData.startDate)),
        endDate: Timestamp.fromDate(new Date(formData.endDate)),
        announcementDate: Timestamp.fromDate(new Date(formData.announcementDate)),
        benefits: formData.benefits,
        conditions: formData.conditions,
        maxParticipantsPerUser: formData.maxParticipantsPerUser,
        winnerCount: formData.winnerCount,
        status: formData.status,
      };

      await eventsService.update(eventId, eventData);
      alert("수정되었습니다.");
      setOpenEditDialog(false);
      loadData();
    } catch (error) {
      console.error("수정 실패:", error);
      alert("수정에 실패했습니다.");
    }
  };

  const handleDeleteEvent = async () => {
    if (!eventId) return;

    if (
      !window.confirm(
        "정말 삭제하시겠습니까?\n\n관련된 모든 데이터(참여자, 당첨자)가 함께 삭제됩니다."
      )
    ) {
      return;
    }

    try {
      await eventsService.delete(eventId);
      alert("삭제되었습니다.");
      navigate("/admin/events");
    } catch (error) {
      console.error("삭제 실패:", error);
      alert("삭제에 실패했습니다.");
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString("ko-KR");
  };

  const formatDateTime = (timestamp: any) => {
    if (!timestamp) return "";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString("ko-KR");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ongoing":
        return "success";
      case "scheduled":
        return "info";
      case "ended":
        return "default";
      default:
        return "default";
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
        <div style={{ padding: "24px", textAlign: "center" }}>
          <p>로딩 중...</p>
        </div>
      </MainLayout>
    );
  }

  if (!event) {
    return (
      <MainLayout>
        <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "24px", textAlign: "center", paddingTop: "80px" }}>
          <p>이벤트를 찾을 수 없습니다.</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "24px" }}>
        {/* 헤더 */}
        <button
          onClick={() => navigate("/admin/events")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginBottom: "16px",
            background: "none",
            border: "none",
            color: "var(--primary-main)",
            cursor: "pointer",
            fontSize: "0.875rem",
            fontWeight: 600,
            padding: 0,
            fontFamily: "var(--font-family-base)",
          }}
        >
          <IconifyIcon icon="mdi:arrow-left" width={20} height={20} />
          이벤트 목록으로
        </button>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: "32px",
            flexWrap: "wrap",
            gap: "16px",
          }}
        >
          <div>
            <h4
              style={{
                fontWeight: 700,
                marginBottom: "8px",
                fontFamily: "var(--font-family-base)",
                fontSize: "2rem",
                margin: "0 0 8px 0",
              }}
            >
              {event.title}
            </h4>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span
                style={{
                  display: "inline-block",
                  padding: "4px 8px",
                  borderRadius: "12px",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  backgroundColor:
                    event.status === "ongoing"
                      ? "#E8F5E9"
                      : event.status === "scheduled"
                        ? "#E1F5FE"
                        : "#F5F5F5",
                  color:
                    event.status === "ongoing"
                      ? "#2E7D32"
                      : event.status === "scheduled"
                        ? "#0288D1"
                        : "#707070",
                  fontFamily: "var(--font-family-base)",
                }}
              >
                {getStatusText(event.status)}
              </span>
              {event.isWinnerAnnounced && (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                    padding: "4px 8px",
                    borderRadius: "12px",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    backgroundColor: "#E8F5E9",
                    color: "#2E7D32",
                    fontFamily: "var(--font-family-base)",
                  }}
                >
                  <IconifyIcon icon="mdi:check-circle" width={16} height={16} />
                  당첨자 발표됨
                </span>
              )}
            </div>
          </div>

          <div style={{ display: "flex", gap: "8px" }}>
            <button
              onClick={() => setOpenEditDialog(true)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 16px",
                borderRadius: "6px",
                border: "1px solid #E0E0E0",
                backgroundColor: "white",
                color: "#232323",
                cursor: "pointer",
                fontWeight: 600,
                fontFamily: "var(--font-family-base)",
                fontSize: "0.875rem",
              }}
            >
              <IconifyIcon icon="mdi:pencil" width={20} height={20} />
              수정
            </button>
            <button
              onClick={handleDeleteEvent}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 16px",
                borderRadius: "6px",
                border: "1px solid #d32f2f",
                backgroundColor: "white",
                color: "#d32f2f",
                cursor: "pointer",
                fontWeight: 600,
                fontFamily: "var(--font-family-base)",
                fontSize: "0.875rem",
              }}
            >
              <IconifyIcon icon="mdi:delete" width={20} height={20} />
              삭제
            </button>
          </div>
        </div>

        {/* 통계 카드 */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: "24px",
            marginBottom: "32px",
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "12px",
              padding: "24px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
              border: "1px solid #E0E0E0",
              display: "flex",
              alignItems: "center",
              gap: "16px",
            }}
          >
            <IconifyIcon icon="mdi:account-group" width={40} height={40} style={{ color: "#667eea" }} />
            <div>
              <h4
                style={{
                  fontWeight: 700,
                  fontSize: "2rem",
                  margin: 0,
                  fontFamily: "var(--font-family-base)",
                }}
              >
                {participants.length}
              </h4>
              <p
                style={{
                  color: "#707070",
                  fontSize: "0.875rem",
                  margin: 0,
                  fontFamily: "var(--font-family-base)",
                }}
              >
                총 참여자
              </p>
            </div>
          </div>

          <div
            style={{
              backgroundColor: "white",
              borderRadius: "12px",
              padding: "24px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
              border: "1px solid #E0E0E0",
              display: "flex",
              alignItems: "center",
              gap: "16px",
            }}
          >
            <IconifyIcon icon="mdi:trophy" width={40} height={40} style={{ color: "#10b981" }} />
            <div>
              <h4
                style={{
                  fontWeight: 700,
                  fontSize: "2rem",
                  margin: 0,
                  fontFamily: "var(--font-family-base)",
                }}
              >
                {selectedWinners.length}
              </h4>
              <p
                style={{
                  color: "#707070",
                  fontSize: "0.875rem",
                  margin: 0,
                  fontFamily: "var(--font-family-base)",
                }}
              >
                당첨자 수
              </p>
            </div>
          </div>

          <div
            style={{
              backgroundColor: "white",
              borderRadius: "12px",
              padding: "24px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
              border: "1px solid #E0E0E0",
              display: "flex",
              alignItems: "center",
              gap: "16px",
            }}
          >
            <IconifyIcon icon="mdi:eye" width={40} height={40} style={{ color: "#2196f3" }} />
            <div>
              <h4
                style={{
                  fontWeight: 700,
                  fontSize: "2rem",
                  margin: 0,
                  fontFamily: "var(--font-family-base)",
                }}
              >
                {event.viewCount}
              </h4>
              <p
                style={{
                  color: "#707070",
                  fontSize: "0.875rem",
                  margin: 0,
                  fontFamily: "var(--font-family-base)",
                }}
              >
                조회수
              </p>
            </div>
          </div>

          <div
            style={{
              backgroundColor: "white",
              borderRadius: "12px",
              padding: "24px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
              border: "1px solid #E0E0E0",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                cursor: selectedWinners.length === 0 ? "not-allowed" : "pointer",
                opacity: selectedWinners.length === 0 ? 0.5 : 1,
              }}
            >
              <input
                type="checkbox"
                checked={event.isWinnerAnnounced}
                onChange={handleToggleAnnouncement}
                disabled={selectedWinners.length === 0}
                style={{ width: "20px", height: "20px" }}
              />
              <div>
                <p
                  style={{
                    fontWeight: 700,
                    fontSize: "0.875rem",
                    margin: 0,
                    fontFamily: "var(--font-family-base)",
                  }}
                >
                  당첨자 공개
                </p>
                <p
                  style={{
                    color: "#707070",
                    fontSize: "0.75rem",
                    margin: 0,
                    fontFamily: "var(--font-family-base)",
                  }}
                >
                  {event.isWinnerAnnounced ? "공개중" : "비공개"}
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* 탭 네비게이션 */}
        <div style={{ borderBottom: "1px solid #E0E0E0", marginBottom: 0 }}>
          <div style={{ display: "flex", gap: "2px" }}>
            {[
              { label: "이벤트 정보", icon: "mdi:information-outline" },
              { label: "참여자 목록", icon: "mdi:account-group-outline" },
              { label: "추첨 관리", icon: "mdi:dice-multiple-outline" },
              { label: "당첨자 목록", icon: "mdi:trophy-outline" },
            ].map((tab, index) => (
              <button
                key={index}
                onClick={() => setTabValue(index)}
                style={{
                  padding: "12px 24px",
                  backgroundColor: tabValue === index ? "white" : "#F5F5F5",
                  border: "1px solid #E0E0E0",
                  borderBottom: tabValue === index ? "none" : "1px solid #E0E0E0",
                  borderRadius: "8px 8px 0 0",
                  color: tabValue === index ? "var(--primary-main)" : "#707070",
                  fontWeight: tabValue === index ? 700 : 500,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  fontFamily: "var(--font-family-base)",
                  fontSize: "0.875rem",
                  marginBottom: "-1px",
                  position: "relative",
                  zIndex: tabValue === index ? 1 : 0,
                }}
              >
                <IconifyIcon icon={tab.icon} width={20} height={20} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* 탭 패널 1: 이벤트 정보 */}
        {tabValue === 0 && (
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "0 0 12px 12px",
              padding: "24px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
              border: "1px solid #E0E0E0",
              borderTop: "none",
            }}
          >
            <div style={{ display: "flex", gap: "32px", alignItems: "flex-start" }}>
              <img
                src={event.imageUrl}
                alt={event.title}
                style={{
                  width: "300px",
                  height: "200px",
                  objectFit: "cover",
                  borderRadius: "8px",
                  border: "1px solid #E0E0E0",
                }}
              />
              <div style={{ flex: 1 }}>
                <h6 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "16px", fontFamily: "var(--font-family-base)" }}>
                  상세 정보
                </h6>
                <div style={{ display: "grid", gap: "12px" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "100px 1fr", gap: "16px" }}>
                    <span style={{ color: "#707070", fontWeight: 600 }}>설명</span>
                    <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{event.description}</p>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "100px 1fr", gap: "16px" }}>
                    <span style={{ color: "#707070", fontWeight: 600 }}>기간</span>
                    <p style={{ margin: 0 }}>
                      {formatDateTime(event.startDate)} ~ {formatDateTime(event.endDate)}
                    </p>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "100px 1fr", gap: "16px" }}>
                    <span style={{ color: "#707070", fontWeight: 600 }}>발표일</span>
                    <p style={{ margin: 0 }}>{formatDateTime(event.announcementDate)}</p>
                  </div>
                  {event.benefits && (
                    <div style={{ display: "grid", gridTemplateColumns: "100px 1fr", gap: "16px" }}>
                      <span style={{ color: "#707070", fontWeight: 600 }}>혜택</span>
                      <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{event.benefits}</p>
                    </div>
                  )}
                  {event.conditions && (
                    <div style={{ display: "grid", gridTemplateColumns: "100px 1fr", gap: "16px" }}>
                      <span style={{ color: "#707070", fontWeight: 600 }}>참여 조건</span>
                      <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{event.conditions}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 탭 패널 2: 참여자 목록 */}
        {tabValue === 1 && (
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "0 0 12px 12px",
              padding: "24px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
              border: "1px solid #E0E0E0",
              borderTop: "none",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "16px",
              }}
            >
              <h6 style={{ fontSize: "1.25rem", fontWeight: 700, margin: 0, fontFamily: "var(--font-family-base)" }}>
                참여자 목록
              </h6>
              <button
                onClick={handleExportParticipantsCSV}
                disabled={participants.length === 0}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "8px 16px",
                  borderRadius: "6px",
                  border: "1px solid #E0E0E0",
                  backgroundColor: "white",
                  color: participants.length === 0 ? "#BDBDBD" : "#232323",
                  cursor: participants.length === 0 ? "not-allowed" : "pointer",
                  fontWeight: 600,
                  fontFamily: "var(--font-family-base)",
                  fontSize: "0.875rem",
                }}
              >
                <IconifyIcon icon="mdi:download" width={20} height={20} />
                엑셀 다운로드
              </button>
            </div>

            {participants.length === 0 ? (
              <div
                style={{
                  padding: "16px",
                  backgroundColor: "#E3F2FD",
                  color: "#0D47A1",
                  borderRadius: "8px",
                  fontSize: "0.875rem",
                  fontFamily: "var(--font-family-base)",
                }}
              >
                아직 참여자가 없습니다.
              </div>
            ) : (
              <div
                style={{
                  border: "1px solid #E0E0E0",
                  borderRadius: "8px",
                  overflow: "hidden",
                }}
              >
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ backgroundColor: "#F5F5F5" }}>
                      <th style={{ padding: "16px", textAlign: "center", fontWeight: 700, fontSize: "0.875rem", color: "#232323" }}>번호</th>
                      <th style={{ padding: "16px", textAlign: "left", fontWeight: 700, fontSize: "0.875rem", color: "#232323" }}>닉네임</th>
                      <th style={{ padding: "16px", textAlign: "left", fontWeight: 700, fontSize: "0.875rem", color: "#232323" }}>이메일</th>
                      <th style={{ padding: "16px", textAlign: "left", fontWeight: 700, fontSize: "0.875rem", color: "#232323" }}>전화번호</th>
                      <th style={{ padding: "16px", textAlign: "left", fontWeight: 700, fontSize: "0.875rem", color: "#232323" }}>참여일시</th>
                    </tr>
                  </thead>
                  <tbody>
                    {participants.map((participant, index) => (
                      <tr key={participant.id} style={{ borderBottom: "1px solid #E0E0E0" }}>
                        <td style={{ padding: "16px", textAlign: "center", fontSize: "0.875rem", color: "#232323" }}>{index + 1}</td>
                        <td style={{ padding: "16px", fontSize: "0.875rem", color: "#232323" }}>{participant.nickname}</td>
                        <td style={{ padding: "16px", fontSize: "0.875rem", color: "#232323", fontFamily: "monospace" }}>{participant.email}</td>
                        <td style={{ padding: "16px", fontSize: "0.875rem", color: "#232323", fontFamily: "monospace" }}>{participant.phone}</td>
                        <td style={{ padding: "16px", fontSize: "0.875rem", color: "#232323" }}>{formatDateTime(participant.participatedAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* 탭 패널 3: 추첨 관리 */}
        {tabValue === 2 && (
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "0 0 12px 12px",
              padding: "24px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
              border: "1px solid #E0E0E0",
              borderTop: "none",
            }}
          >
            <h6 style={{ fontSize: "1.25rem", fontWeight: 700, margin: "0 0 16px 0", fontFamily: "var(--font-family-base)" }}>
              랜덤 추첨
            </h6>

            {event.isWinnerAnnounced ? (
              <div
                style={{
                  padding: "16px",
                  backgroundColor: "#E3F2FD",
                  color: "#0D47A1",
                  borderRadius: "8px",
                  marginBottom: "16px",
                  fontSize: "0.875rem",
                  fontFamily: "var(--font-family-base)",
                }}
              >
                이미 당첨자가 확정되었습니다. 재추첨을 원하시면 당첨자 공개를 먼저 취소해주세요.
              </div>
            ) : (
              <>
                <div style={{ display: "flex", gap: "16px", alignItems: "center", marginBottom: "24px", flexWrap: "wrap" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <label style={{ fontSize: "0.875rem", color: "#707070" }}>당첨자 수</label>
                    <input
                      type="number"
                      value={winnerCount}
                      onChange={(e) => setWinnerCount(parseInt(e.target.value) || 1)}
                      min={1}
                      max={participants.length}
                      style={{
                        padding: "8px 12px",
                        borderRadius: "4px",
                        border: "1px solid #E0E0E0",
                        width: "80px",
                      }}
                    />
                  </div>

                  <button
                    onClick={handleLottery}
                    disabled={participants.length === 0}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "10px 24px",
                      borderRadius: "6px",
                      border: "none",
                      backgroundColor: participants.length === 0 ? "#E0E0E0" : "var(--primary-main)",
                      color: "white",
                      cursor: participants.length === 0 ? "not-allowed" : "pointer",
                      fontWeight: 600,
                      fontFamily: "var(--font-family-base)",
                      fontSize: "0.875rem",
                    }}
                  >
                    <IconifyIcon icon="mdi:shuffle" width={20} height={20} />
                    랜덤 추첨하기
                  </button>

                  {selectedWinners.length > 0 && !event.isWinnerAnnounced && (
                    <button
                      onClick={() => setShowConfirm(true)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        padding: "10px 24px",
                        borderRadius: "6px",
                        border: "none",
                        backgroundColor: "#2E7D32",
                        color: "white",
                        cursor: "pointer",
                        fontWeight: 600,
                        fontFamily: "var(--font-family-base)",
                        fontSize: "0.875rem",
                      }}
                    >
                      <IconifyIcon icon="mdi:content-save" width={20} height={20} />
                      당첨자 확정하기
                    </button>
                  )}
                </div>

                {participants.length === 0 && (
                  <div
                    style={{
                      padding: "16px",
                      backgroundColor: "#FFF3E0",
                      color: "#E65100",
                      borderRadius: "8px",
                      fontSize: "0.875rem",
                      fontFamily: "var(--font-family-base)",
                    }}
                  >
                    참여자가 없어 추첨을 진행할 수 없습니다.
                  </div>
                )}

                {selectedWinners.length > 0 && !event.isWinnerAnnounced && (
                  <div
                    style={{
                      padding: "16px",
                      backgroundColor: "#E8F5E9",
                      color: "#2E7D32",
                      borderRadius: "8px",
                      fontSize: "0.875rem",
                      fontFamily: "var(--font-family-base)",
                    }}
                  >
                    {selectedWinners.length}명의 당첨자가 선정되었습니다. "당첨자 확정하기" 버튼을 눌러 확정해주세요.
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* 탭 패널 4: 당첨자 목록 */}
        {tabValue === 3 && (
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "0 0 12px 12px",
              padding: "24px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
              border: "1px solid #E0E0E0",
              borderTop: "none",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "16px",
              }}
            >
              <h6 style={{ fontSize: "1.25rem", fontWeight: 700, margin: 0, fontFamily: "var(--font-family-base)" }}>
                {event.isWinnerAnnounced ? "확정 당첨자" : "선정된 당첨자"}
              </h6>
              <button
                onClick={handleExportWinnersCSV}
                disabled={selectedWinners.length === 0}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "8px 16px",
                  borderRadius: "6px",
                  border: "1px solid #E0E0E0",
                  backgroundColor: "white",
                  color: selectedWinners.length === 0 ? "#BDBDBD" : "#232323",
                  cursor: selectedWinners.length === 0 ? "not-allowed" : "pointer",
                  fontWeight: 600,
                  fontFamily: "var(--font-family-base)",
                  fontSize: "0.875rem",
                }}
              >
                <IconifyIcon icon="mdi:download" width={20} height={20} />
                엑셀 다운로드
              </button>
            </div>

            {selectedWinners.length === 0 ? (
              <div
                style={{
                  padding: "16px",
                  backgroundColor: "#E3F2FD",
                  color: "#0D47A1",
                  borderRadius: "8px",
                  fontSize: "0.875rem",
                  fontFamily: "var(--font-family-base)",
                }}
              >
                아직 당첨자가 없습니다.
              </div>
            ) : (
              <div
                style={{
                  border: "1px solid #E0E0E0",
                  borderRadius: "8px",
                  overflow: "hidden",
                }}
              >
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ backgroundColor: "#F5F5F5" }}>
                      <th style={{ padding: "16px", textAlign: "center", fontWeight: 700, fontSize: "0.875rem", color: "#232323" }}>번호</th>
                      <th style={{ padding: "16px", textAlign: "left", fontWeight: 700, fontSize: "0.875rem", color: "#232323" }}>닉네임</th>
                      <th style={{ padding: "16px", textAlign: "left", fontWeight: 700, fontSize: "0.875rem", color: "#232323" }}>이메일</th>
                      <th style={{ padding: "16px", textAlign: "left", fontWeight: 700, fontSize: "0.875rem", color: "#232323" }}>전화번호</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedWinners.map((winner, index) => (
                      <tr key={winner.id} style={{ borderBottom: "1px solid #E0E0E0" }}>
                        <td style={{ padding: "16px", textAlign: "center", fontSize: "0.875rem", color: "#232323" }}>{index + 1}</td>
                        <td style={{ padding: "16px", fontSize: "0.875rem", color: "#232323" }}>{winner.nickname}</td>
                        <td style={{ padding: "16px", fontSize: "0.875rem", color: "#232323", fontFamily: "monospace" }}>{winner.email}</td>
                        <td style={{ padding: "16px", fontSize: "0.875rem", color: "#232323", fontFamily: "monospace" }}>{winner.phone}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* 수정 다이얼로그 */}
        {/* 수정 다이얼로그 */}
        {openEditDialog && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              backgroundColor: "rgba(0, 0, 0, 0.5)",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              zIndex: 1000,
            }}
          >
            <div
              style={{
                backgroundColor: "white",
                borderRadius: "12px",
                padding: "24px",
                width: "90%",
                maxWidth: "600px",
                maxHeight: "90vh",
                overflowY: "auto",
                boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
              }}
            >
              <h2
                style={{
                  fontSize: "1.5rem",
                  fontWeight: 700,
                  marginBottom: "24px",
                  fontFamily: "var(--font-family-base)",
                }}
              >
                이벤트 수정
              </h2>

              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "8px",
                      fontSize: "0.875rem",
                      fontWeight: 600,
                      color: "#232323",
                    }}
                  >
                    이벤트 제목
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: "6px",
                      border: "1px solid #E0E0E0",
                      fontSize: "0.875rem",
                      fontFamily: "var(--font-family-base)",
                    }}
                  />
                </div>

                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "8px",
                      fontSize: "0.875rem",
                      fontWeight: 600,
                      color: "#232323",
                    }}
                  >
                    설명
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={4}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: "6px",
                      border: "1px solid #E0E0E0",
                      fontSize: "0.875rem",
                      fontFamily: "var(--font-family-base)",
                      resize: "vertical",
                    }}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div>
                    <label
                      style={{
                        display: "block",
                        marginBottom: "8px",
                        fontSize: "0.875rem",
                        fontWeight: 600,
                        color: "#232323",
                      }}
                    >
                      시작일
                    </label>
                    <input
                      type="datetime-local"
                      name="startDate"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        borderRadius: "6px",
                        border: "1px solid #E0E0E0",
                        fontSize: "0.875rem",
                        fontFamily: "var(--font-family-base)",
                      }}
                    />
                  </div>
                  <div>
                    <label
                      style={{
                        display: "block",
                        marginBottom: "8px",
                        fontSize: "0.875rem",
                        fontWeight: 600,
                        color: "#232323",
                      }}
                    >
                      종료일
                    </label>
                    <input
                      type="datetime-local"
                      name="endDate"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        borderRadius: "6px",
                        border: "1px solid #E0E0E0",
                        fontSize: "0.875rem",
                        fontFamily: "var(--font-family-base)",
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "8px",
                      fontSize: "0.875rem",
                      fontWeight: 600,
                      color: "#232323",
                    }}
                  >
                    당첨자 발표일
                  </label>
                  <input
                    type="datetime-local"
                    name="announcementDate"
                    value={formData.announcementDate}
                    onChange={(e) => setFormData({ ...formData, announcementDate: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: "6px",
                      border: "1px solid #E0E0E0",
                      fontSize: "0.875rem",
                      fontFamily: "var(--font-family-base)",
                    }}
                  />
                </div>

                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "8px",
                      fontSize: "0.875rem",
                      fontWeight: 600,
                      color: "#232323",
                    }}
                  >
                    이미지 URL
                  </label>
                  <input
                    type="text"
                    name="imageUrl"
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: "6px",
                      border: "1px solid #E0E0E0",
                      fontSize: "0.875rem",
                      fontFamily: "var(--font-family-base)",
                    }}
                  />
                </div>

                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "8px",
                      fontSize: "0.875rem",
                      fontWeight: 600,
                      color: "#232323",
                    }}
                  >
                    혜택
                  </label>
                  <textarea
                    name="benefits"
                    value={formData.benefits}
                    onChange={(e) => setFormData({ ...formData, benefits: e.target.value })}
                    rows={2}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: "6px",
                      border: "1px solid #E0E0E0",
                      fontSize: "0.875rem",
                      fontFamily: "var(--font-family-base)",
                      resize: "vertical",
                    }}
                  />
                </div>

                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "8px",
                      fontSize: "0.875rem",
                      fontWeight: 600,
                      color: "#232323",
                    }}
                  >
                    참여 조건
                  </label>
                  <textarea
                    name="conditions"
                    value={formData.conditions}
                    onChange={(e) => setFormData({ ...formData, conditions: e.target.value })}
                    rows={2}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: "6px",
                      border: "1px solid #E0E0E0",
                      fontSize: "0.875rem",
                      fontFamily: "var(--font-family-base)",
                      resize: "vertical",
                    }}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div>
                    <label
                      style={{
                        display: "block",
                        marginBottom: "8px",
                        fontSize: "0.875rem",
                        fontWeight: 600,
                        color: "#232323",
                      }}
                    >
                      당첨자 수
                    </label>
                    <input
                      type="number"
                      name="winnerCount"
                      value={formData.winnerCount}
                      onChange={(e) => setFormData({ ...formData, winnerCount: parseInt(e.target.value) || 1 })}
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        borderRadius: "6px",
                        border: "1px solid #E0E0E0",
                        fontSize: "0.875rem",
                        fontFamily: "var(--font-family-base)",
                      }}
                    />
                  </div>
                  <div>
                    <label
                      style={{
                        display: "block",
                        marginBottom: "8px",
                        fontSize: "0.875rem",
                        fontWeight: 600,
                        color: "#232323",
                      }}
                    >
                      1인당 참여 제한
                    </label>
                    <input
                      type="number"
                      name="maxParticipantsPerUser"
                      value={formData.maxParticipantsPerUser}
                      onChange={(e) => setFormData({ ...formData, maxParticipantsPerUser: parseInt(e.target.value) || 1 })}
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        borderRadius: "6px",
                        border: "1px solid #E0E0E0",
                        fontSize: "0.875rem",
                        fontFamily: "var(--font-family-base)",
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "8px",
                      fontSize: "0.875rem",
                      fontWeight: 600,
                      color: "#232323",
                    }}
                  >
                    상태
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: "6px",
                      border: "1px solid #E0E0E0",
                      fontSize: "0.875rem",
                      fontFamily: "var(--font-family-base)",
                      backgroundColor: "white",
                    }}
                  >
                    <option value="scheduled">예정됨</option>
                    <option value="ongoing">진행중</option>
                    <option value="ended">종료됨</option>
                  </select>
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "8px",
                  marginTop: "24px",
                }}
              >
                <button
                  onClick={() => setOpenEditDialog(false)}
                  style={{
                    padding: "10px 24px",
                    borderRadius: "6px",
                    border: "1px solid #E0E0E0",
                    backgroundColor: "white",
                    color: "#232323",
                    cursor: "pointer",
                    fontWeight: 600,
                    fontFamily: "var(--font-family-base)",
                    fontSize: "0.875rem",
                  }}
                >
                  취소
                </button>
                <button
                  onClick={handleUpdateEvent}
                  style={{
                    padding: "10px 24px",
                    borderRadius: "6px",
                    border: "none",
                    backgroundColor: "var(--primary-main)",
                    color: "white",
                    cursor: "pointer",
                    fontWeight: 600,
                    fontFamily: "var(--font-family-base)",
                    fontSize: "0.875rem",
                  }}
                >
                  수정
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 당첨자 확정 확인 다이얼로그 */}
        {showConfirm && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              backgroundColor: "rgba(0, 0, 0, 0.5)",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              zIndex: 1000,
            }}
          >
            <div
              style={{
                backgroundColor: "white",
                borderRadius: "12px",
                padding: "24px",
                width: "90%",
                maxWidth: "400px",
                boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
              }}
            >
              <h2
                style={{
                  fontSize: "1.25rem",
                  fontWeight: 700,
                  marginBottom: "16px",
                  fontFamily: "var(--font-family-base)",
                }}
              >
                당첨자 확정
              </h2>
              <div
                style={{
                  padding: "16px",
                  backgroundColor: "#E3F2FD",
                  color: "#0D47A1",
                  borderRadius: "8px",
                  marginBottom: "16px",
                  fontSize: "0.875rem",
                  fontFamily: "var(--font-family-base)",
                }}
              >
                당첨자를 확정하시겠습니까?
                <br />
                확정 후에는 당첨자 목록을 수정할 수 없습니다.
              </div>
              <p
                style={{
                  fontSize: "0.875rem",
                  color: "#707070",
                  margin: "0 0 24px 0",
                  fontFamily: "var(--font-family-base)",
                }}
              >
                총 {selectedWinners.length}명의 당첨자가 저장됩니다.
              </p>

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "8px",
                }}
              >
                <button
                  onClick={() => setShowConfirm(false)}
                  style={{
                    padding: "10px 24px",
                    borderRadius: "6px",
                    border: "1px solid #E0E0E0",
                    backgroundColor: "white",
                    color: "#232323",
                    cursor: "pointer",
                    fontWeight: 600,
                    fontFamily: "var(--font-family-base)",
                    fontSize: "0.875rem",
                  }}
                >
                  취소
                </button>
                <button
                  onClick={handleSaveWinners}
                  disabled={saving}
                  style={{
                    padding: "10px 24px",
                    borderRadius: "6px",
                    border: "none",
                    backgroundColor: "#2E7D32",
                    color: "white",
                    cursor: saving ? "not-allowed" : "pointer",
                    fontWeight: 600,
                    fontFamily: "var(--font-family-base)",
                    fontSize: "0.875rem",
                    opacity: saving ? 0.7 : 1,
                  }}
                >
                  {saving ? "저장 중..." : "확정하기"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default AdminEventsDetail;

