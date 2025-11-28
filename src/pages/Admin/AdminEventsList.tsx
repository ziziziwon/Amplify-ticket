import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import IconifyIcon from "../../components/Icon/IconifyIcon";
import MainLayout from "../../components/Layout/MainLayout";
import { Event } from "../../types";
import { eventsService } from "../../firebase/services";
import { Timestamp } from "firebase/firestore";
import { seedDummyEvents } from "../../utils/seedEvents";

type SortType = "latest" | "deadline" | "popular";
type FilterType = "all" | "ongoing" | "scheduled" | "ended" | "announced";

const AdminEventsList: React.FC = () => {
  const navigate = useNavigate();

  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  // 검색 및 필터
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<FilterType>("all");
  const [sortType, setSortType] = useState<SortType>("latest");

  // 통계
  const [stats, setStats] = useState({
    total: 0,
    ongoing: 0,
    scheduled: 0,
    ended: 0,
    announced: 0,
  });

  // 이벤트 생성/수정 다이얼로그
  const [openDialog, setOpenDialog] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [formData, setFormData] = useState({
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
  });

  useEffect(() => {
    loadEvents();
  }, [sortType]);

  useEffect(() => {
    applyFilters();
  }, [events, searchTerm, filterStatus]);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const data = await eventsService.getAll(sortType);
      setEvents(data);
      calculateStats(data);
    } catch (error) {
      console.error("이벤트 로드 실패:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (data: Event[]) => {
    const stats = {
      total: data.length,
      ongoing: data.filter((e) => e.status === "ongoing").length,
      scheduled: data.filter((e) => e.status === "scheduled").length,
      ended: data.filter((e) => e.status === "ended").length,
      announced: data.filter((e) => e.isWinnerAnnounced).length,
    };
    setStats(stats);
  };

  const applyFilters = () => {
    let filtered = [...events];

    // 상태 필터
    if (filterStatus !== "all") {
      if (filterStatus === "announced") {
        filtered = filtered.filter((e) => e.isWinnerAnnounced);
      } else {
        filtered = filtered.filter((e) => e.status === filterStatus);
      }
    }

    // 검색어 필터
    if (searchTerm) {
      filtered = filtered.filter(
        (e) =>
          e.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          e.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredEvents(filtered);
  };

  const handleCreate = () => {
    setEditingEvent(null);
    const now = new Date();
    const formatted = now.toISOString().slice(0, 16);
    setFormData({
      title: "",
      description: "",
      imageUrl: "",
      bannerUrl: "",
      startDate: formatted,
      endDate: formatted,
      announcementDate: formatted,
      benefits: "",
      conditions: "",
      maxParticipantsPerUser: 1,
      winnerCount: 1,
    });
    setOpenDialog(true);
  };

  const handleEdit = (event: Event) => {
    setEditingEvent(event);

    const formatDateForInput = (timestamp: any) => {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toISOString().slice(0, 16);
    };

    setFormData({
      title: event.title,
      description: event.description,
      imageUrl: event.imageUrl,
      bannerUrl: event.bannerUrl || "",
      startDate: formatDateForInput(event.startDate),
      endDate: formatDateForInput(event.endDate),
      announcementDate: formatDateForInput(event.announcementDate),
      benefits: event.benefits,
      conditions: event.conditions,
      maxParticipantsPerUser: event.maxParticipantsPerUser,
      winnerCount: event.winnerCount,
    });
    setOpenDialog(true);
  };

  const handleDelete = async (eventId: string) => {
    if (!window.confirm("정말 삭제하시겠습니까?")) return;

    try {
      await eventsService.delete(eventId);
      alert("삭제되었습니다.");
      loadEvents();
    } catch (error) {
      console.error("삭제 실패:", error);
      alert("삭제에 실패했습니다.");
    }
  };

  const handleSeedEvents = async () => {
    if (!window.confirm("샘플 이벤트 5개를 생성하시겠습니까?")) return;

    try {
      setLoading(true);
      await seedDummyEvents();
      alert("샘플 이벤트가 생성되었습니다!");
      loadEvents();
    } catch (error) {
      console.error("샘플 이벤트 생성 실패:", error);
      alert("샘플 이벤트 생성에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      if (!formData.title || !formData.description) {
        alert("제목과 설명을 입력해주세요.");
        return;
      }

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
        status: "scheduled" as const,
        viewCount: 0,
        participantCount: 0,
        isWinnerAnnounced: false,
      };

      if (editingEvent) {
        // 수정
        await eventsService.update(editingEvent.id, eventData);
        alert("수정되었습니다.");
      } else {
        // 생성
        await eventsService.create(eventData);
        alert("생성되었습니다.");
      }

      setOpenDialog(false);
      loadEvents();
    } catch (error) {
      console.error("저장 실패:", error);
      alert("저장에 실패했습니다.");
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString("ko-KR");
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

  return (
    <MainLayout>
      <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "24px" }}>
        {/* 헤더 */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "16px",
            marginBottom: "32px",
          }}
        >
          <div style={{ flex: 1, minWidth: "200px" }}>
            <h4
              style={{
                fontWeight: 700,
                marginBottom: "8px",
                fontFamily: "var(--font-family-base)",
                fontSize: "2rem",
                margin: 0,
              }}
            >
              이벤트 관리
            </h4>
            <p
              style={{
                color: "#707070",
                fontFamily: "var(--font-family-base)",
                fontSize: "0.875rem",
                margin: 0,
              }}
            >
              이벤트를 생성하고 관리하세요
            </p>
          </div>
          <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
            {events.length === 0 && (
              <button
                onClick={handleSeedEvents}
                style={{
                  backgroundColor: "transparent",
                  border: "1px solid var(--primary-main)",
                  color: "var(--primary-main)",
                  fontWeight: 600,
                  padding: "10px 24px",
                  borderRadius: "6px",
                  fontFamily: "var(--font-family-base)",
                  cursor: "pointer",
                  fontSize: "1rem",
                  flexShrink: 0,
                }}
              >
                샘플 이벤트 생성
              </button>
            )}
            <button
              onClick={handleCreate}
              style={{
                backgroundColor: "var(--primary-main)",
                color: "white",
                fontWeight: 600,
                border: "none",
                padding: "10px 24px",
                borderRadius: "6px",
                fontFamily: "var(--font-family-base)",
                cursor: "pointer",
                fontSize: "1rem",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                flexShrink: 0,
              }}
            >
              <IconifyIcon icon="mdi:plus" width={20} height={20} />
              이벤트 생성
            </button>
          </div>
        </div>

        {/* 통계 카드 */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
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
            }}
          >
            <h4
              style={{
                fontWeight: 700,
                color: "var(--primary-main)",
                fontSize: "2rem",
                margin: "0 0 8px 0",
                fontFamily: "var(--font-family-base)",
              }}
            >
              {stats.total}
            </h4>
            <p
              style={{
                color: "#707070",
                fontSize: "0.875rem",
                margin: 0,
                fontFamily: "var(--font-family-base)",
              }}
            >
              전체 이벤트
            </p>
          </div>
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "12px",
              padding: "24px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
              border: "1px solid #E0E0E0",
            }}
          >
            <h4
              style={{
                fontWeight: 700,
                color: "#2E7D32",
                fontSize: "2rem",
                margin: "0 0 8px 0",
                fontFamily: "var(--font-family-base)",
              }}
            >
              {stats.ongoing}
            </h4>
            <p
              style={{
                color: "#707070",
                fontSize: "0.875rem",
                margin: 0,
                fontFamily: "var(--font-family-base)",
              }}
            >
              진행중
            </p>
          </div>
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "12px",
              padding: "24px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
              border: "1px solid #E0E0E0",
            }}
          >
            <h4
              style={{
                fontWeight: 700,
                color: "#0288D1",
                fontSize: "2rem",
                margin: "0 0 8px 0",
                fontFamily: "var(--font-family-base)",
              }}
            >
              {stats.scheduled}
            </h4>
            <p
              style={{
                color: "#707070",
                fontSize: "0.875rem",
                margin: 0,
                fontFamily: "var(--font-family-base)",
              }}
            >
              예정
            </p>
          </div>
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "12px",
              padding: "24px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
              border: "1px solid #E0E0E0",
            }}
          >
            <h4
              style={{
                fontWeight: 700,
                color: "#707070",
                fontSize: "2rem",
                margin: "0 0 8px 0",
                fontFamily: "var(--font-family-base)",
              }}
            >
              {stats.ended}
            </h4>
            <p
              style={{
                color: "#707070",
                fontSize: "0.875rem",
                margin: 0,
                fontFamily: "var(--font-family-base)",
              }}
            >
              종료
            </p>
          </div>
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "12px",
              padding: "24px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
              border: "1px solid #E0E0E0",
            }}
          >
            <h4
              style={{
                fontWeight: 700,
                color: "#ED6C02",
                fontSize: "2rem",
                margin: "0 0 8px 0",
                fontFamily: "var(--font-family-base)",
              }}
            >
              {stats.announced}
            </h4>
            <p
              style={{
                color: "#707070",
                fontSize: "0.875rem",
                margin: 0,
                fontFamily: "var(--font-family-base)",
              }}
            >
              당첨자 발표
            </p>
          </div>
        </div>

        {/* 검색 및 필터 */}
        <div
          style={{
            backgroundColor: "white",
            borderRadius: "12px",
            padding: "24px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
            border: "1px solid #E0E0E0",
            marginBottom: "24px",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {/* 검색 */}
            <div style={{ position: "relative", width: "100%" }}>
              <div
                style={{
                  position: "absolute",
                  left: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#999",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <IconifyIcon icon="mdi:magnify" width={20} height={20} />
              </div>
              <input
                type="text"
                placeholder="이벤트 제목 또는 설명 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: "100%",
                  padding: "12px 12px 12px 40px",
                  borderRadius: "6px",
                  border: "1px solid #E0E0E0",
                  fontFamily: "var(--font-family-base)",
                  fontSize: "1rem",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>

            {/* 필터 및 정렬 */}
            <div
              style={{
                display: "flex",
                gap: "16px",
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              <div style={{ minWidth: "200px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "4px",
                    fontSize: "0.75rem",
                    color: "#707070",
                    fontFamily: "var(--font-family-base)",
                  }}
                >
                  상태 필터
                </label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as FilterType)}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: "4px",
                    border: "1px solid #E0E0E0",
                    fontFamily: "var(--font-family-base)",
                    fontSize: "0.875rem",
                    outline: "none",
                    backgroundColor: "white",
                  }}
                >
                  <option value="all">전체</option>
                  <option value="ongoing">진행중</option>
                  <option value="scheduled">예정</option>
                  <option value="ended">종료</option>
                  <option value="announced">당첨자 발표됨</option>
                </select>
              </div>

              <div style={{ minWidth: "200px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "4px",
                    fontSize: "0.75rem",
                    color: "#707070",
                    fontFamily: "var(--font-family-base)",
                  }}
                >
                  정렬
                </label>
                <select
                  value={sortType}
                  onChange={(e) => setSortType(e.target.value as SortType)}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: "4px",
                    border: "1px solid #E0E0E0",
                    fontFamily: "var(--font-family-base)",
                    fontSize: "0.875rem",
                    outline: "none",
                    backgroundColor: "white",
                  }}
                >
                  <option value="latest">최신순</option>
                  <option value="deadline">마감 임박순</option>
                  <option value="popular">참여자 많은순</option>
                </select>
              </div>

              <div style={{ flexGrow: 1 }} />

              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "transparent",
                  color: "var(--primary-main)",
                  border: "1px solid var(--primary-main)",
                  borderRadius: "16px",
                  padding: "4px 12px",
                  fontSize: "0.8125rem",
                  fontFamily: "var(--font-family-base)",
                  height: "32px",
                  boxSizing: "border-box",
                }}
              >
                {filteredEvents.length}개 이벤트
              </div>
            </div>
          </div>
        </div>

        {/* 이벤트 목록 */}
        <div
          style={{
            backgroundColor: "white",
            borderRadius: "12px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
            border: "1px solid #E0E0E0",
            overflow: "hidden",
          }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ backgroundColor: "#F5F5F5" }}>
                <th
                  style={{
                    padding: "16px",
                    textAlign: "left",
                    fontWeight: 700,
                    fontSize: "0.875rem",
                    color: "#232323",
                    fontFamily: "var(--font-family-base)",
                  }}
                >
                  썸네일
                </th>
                <th
                  style={{
                    padding: "16px",
                    textAlign: "left",
                    fontWeight: 700,
                    fontSize: "0.875rem",
                    color: "#232323",
                    fontFamily: "var(--font-family-base)",
                  }}
                >
                  상태
                </th>
                <th
                  style={{
                    padding: "16px",
                    textAlign: "left",
                    fontWeight: 700,
                    fontSize: "0.875rem",
                    color: "#232323",
                    fontFamily: "var(--font-family-base)",
                  }}
                >
                  제목
                </th>
                <th
                  style={{
                    padding: "16px",
                    textAlign: "left",
                    fontWeight: 700,
                    fontSize: "0.875rem",
                    color: "#232323",
                    fontFamily: "var(--font-family-base)",
                  }}
                >
                  기간
                </th>
                <th
                  style={{
                    padding: "16px",
                    textAlign: "center",
                    fontWeight: 700,
                    fontSize: "0.875rem",
                    color: "#232323",
                    fontFamily: "var(--font-family-base)",
                  }}
                >
                  참여자
                </th>
                <th
                  style={{
                    padding: "16px",
                    textAlign: "center",
                    fontWeight: 700,
                    fontSize: "0.875rem",
                    color: "#232323",
                    fontFamily: "var(--font-family-base)",
                  }}
                >
                  조회수
                </th>
                <th
                  style={{
                    padding: "16px",
                    textAlign: "center",
                    fontWeight: 700,
                    fontSize: "0.875rem",
                    color: "#232323",
                    fontFamily: "var(--font-family-base)",
                  }}
                >
                  당첨자
                </th>
                <th
                  style={{
                    padding: "16px",
                    textAlign: "center",
                    fontWeight: 700,
                    fontSize: "0.875rem",
                    color: "#232323",
                    fontFamily: "var(--font-family-base)",
                  }}
                >
                  관리
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} style={{ padding: "64px", textAlign: "center" }}>
                    <p style={{ color: "#707070", margin: 0 }}>로딩 중...</p>
                  </td>
                </tr>
              ) : filteredEvents.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: "64px", textAlign: "center" }}>
                    <p style={{ color: "#707070", margin: 0 }}>
                      {searchTerm || filterStatus !== "all"
                        ? "검색 결과가 없습니다."
                        : "등록된 이벤트가 없습니다."}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredEvents.map((event) => (
                  <tr
                    key={event.id}
                    onClick={() => navigate(`/admin/events/${event.id}/detail`)}
                    style={{
                      cursor: "pointer",
                      borderBottom: "1px solid #E0E0E0",
                      transition: "background-color 0.2s",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.backgroundColor = "#FAFAFA")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.backgroundColor = "transparent")
                    }
                  >
                    <td style={{ padding: "16px" }}>
                      <img
                        src={event.imageUrl}
                        alt={event.title}
                        style={{
                          width: "60px",
                          height: "60px",
                          objectFit: "cover",
                          borderRadius: "4px",
                          display: "block",
                        }}
                      />
                    </td>
                    <td style={{ padding: "16px" }}>
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
                    </td>
                    <td style={{ padding: "16px" }}>
                      <p
                        style={{
                          fontWeight: 500,
                          fontSize: "0.875rem",
                          margin: 0,
                          color: "#232323",
                          fontFamily: "var(--font-family-base)",
                        }}
                      >
                        {event.title}
                      </p>
                    </td>
                    <td style={{ padding: "16px" }}>
                      <p
                        style={{
                          fontSize: "0.875rem",
                          margin: 0,
                          color: "#232323",
                          fontFamily: "var(--font-family-base)",
                        }}
                      >
                        {formatDate(event.startDate)} ~{" "}
                        {formatDate(event.endDate)}
                      </p>
                    </td>
                    <td style={{ padding: "16px", textAlign: "center" }}>
                      <div
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          padding: "4px 8px",
                          borderRadius: "16px",
                          border: "1px solid #E0E0E0",
                          fontSize: "0.75rem",
                          color: "#707070",
                        }}
                      >
                        <IconifyIcon icon="mdi:account-group" width={16} height={16} />
                        {event.participantCount}
                      </div>
                    </td>
                    <td style={{ padding: "16px", textAlign: "center" }}>
                      <div
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          padding: "4px 8px",
                          borderRadius: "16px",
                          border: "1px solid #E0E0E0",
                          fontSize: "0.75rem",
                          color: "#707070",
                        }}
                      >
                        <IconifyIcon icon="mdi:eye" width={16} height={16} />
                        {event.viewCount}
                      </div>
                    </td>
                    <td style={{ padding: "16px", textAlign: "center" }}>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          padding: "4px 8px",
                          borderRadius: "12px",
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          backgroundColor: event.isWinnerAnnounced
                            ? "#E8F5E9"
                            : "#F5F5F5",
                          color: event.isWinnerAnnounced ? "#2E7D32" : "#707070",
                          fontFamily: "var(--font-family-base)",
                        }}
                      >
                        <IconifyIcon icon="mdi:trophy" width={16} height={16} />
                        {event.isWinnerAnnounced
                          ? `${event.winnerCount}명 발표`
                          : "미발표"}
                      </span>
                    </td>
                    <td
                      style={{ padding: "16px", textAlign: "center" }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "center",
                          gap: "8px",
                        }}
                      >
                        <button
                          onClick={() =>
                            navigate(`/admin/events/${event.id}/detail`)
                          }
                          title="상세 관리"
                          style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            padding: "4px",
                            color: "var(--primary-main)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <IconifyIcon icon="mdi:cog" width={20} height={20} />
                        </button>
                        <button
                          onClick={() => handleEdit(event)}
                          title="수정"
                          style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            padding: "4px",
                            color: "#707070",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <IconifyIcon icon="mdi:pencil" width={20} height={20} />
                        </button>
                        <button
                          onClick={() => handleDelete(event.id)}
                          title="삭제"
                          style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            padding: "4px",
                            color: "#d32f2f",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <IconifyIcon icon="mdi:delete" width={20} height={20} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* 이벤트 생성/수정 다이얼로그 */}
        {openDialog && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0,0,0,0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1300,
            }}
          >
            <div
              style={{
                backgroundColor: "white",
                borderRadius: "12px",
                padding: "24px",
                width: "100%",
                maxWidth: "600px",
                maxHeight: "90vh",
                overflowY: "auto",
                boxShadow:
                  "0px 11px 15px -7px rgba(0,0,0,0.2), 0px 24px 38px 3px rgba(0,0,0,0.14), 0px 9px 46px 8px rgba(0,0,0,0.12)",
              }}
            >
              <h2
                style={{
                  fontWeight: 600,
                  fontFamily: "var(--font-family-base)",
                  fontSize: "1.25rem",
                  margin: "0 0 16px 0",
                }}
              >
                {editingEvent ? "이벤트 수정" : "이벤트 생성"}
              </h2>
              <div style={{ marginTop: "16px", display: "flex", flexDirection: "column", gap: "16px" }}>
                <div>
                  <label style={{ display: "block", marginBottom: "8px", fontSize: "0.875rem", color: "#707070" }}>이벤트 제목 *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    style={{ width: "100%", padding: "10px", borderRadius: "4px", border: "1px solid #E0E0E0", boxSizing: "border-box" }}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: "8px", fontSize: "0.875rem", color: "#707070" }}>이벤트 설명 *</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={4}
                    style={{ width: "100%", padding: "10px", borderRadius: "4px", border: "1px solid #E0E0E0", boxSizing: "border-box", resize: "vertical" }}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: "8px", fontSize: "0.875rem", color: "#707070" }}>썸네일 이미지 URL *</label>
                  <input
                    type="text"
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                    style={{ width: "100%", padding: "10px", borderRadius: "4px", border: "1px solid #E0E0E0", boxSizing: "border-box" }}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: "8px", fontSize: "0.875rem", color: "#707070" }}>배너 이미지 URL (선택)</label>
                  <input
                    type="text"
                    value={formData.bannerUrl}
                    onChange={(e) => setFormData({ ...formData, bannerUrl: e.target.value })}
                    style={{ width: "100%", padding: "10px", borderRadius: "4px", border: "1px solid #E0E0E0", boxSizing: "border-box" }}
                  />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div>
                    <label style={{ display: "block", marginBottom: "8px", fontSize: "0.875rem", color: "#707070" }}>시작일시 *</label>
                    <input
                      type="datetime-local"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      style={{ width: "100%", padding: "10px", borderRadius: "4px", border: "1px solid #E0E0E0", boxSizing: "border-box" }}
                      required
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: "8px", fontSize: "0.875rem", color: "#707070" }}>종료일시 *</label>
                    <input
                      type="datetime-local"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      style={{ width: "100%", padding: "10px", borderRadius: "4px", border: "1px solid #E0E0E0", boxSizing: "border-box" }}
                      required
                    />
                  </div>
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: "8px", fontSize: "0.875rem", color: "#707070" }}>당첨자 발표일시 *</label>
                  <input
                    type="datetime-local"
                    value={formData.announcementDate}
                    onChange={(e) => setFormData({ ...formData, announcementDate: e.target.value })}
                    style={{ width: "100%", padding: "10px", borderRadius: "4px", border: "1px solid #E0E0E0", boxSizing: "border-box" }}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: "8px", fontSize: "0.875rem", color: "#707070" }}>이벤트 혜택</label>
                  <textarea
                    value={formData.benefits}
                    onChange={(e) => setFormData({ ...formData, benefits: e.target.value })}
                    rows={3}
                    style={{ width: "100%", padding: "10px", borderRadius: "4px", border: "1px solid #E0E0E0", boxSizing: "border-box", resize: "vertical" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: "8px", fontSize: "0.875rem", color: "#707070" }}>참여 조건</label>
                  <textarea
                    value={formData.conditions}
                    onChange={(e) => setFormData({ ...formData, conditions: e.target.value })}
                    rows={3}
                    style={{ width: "100%", padding: "10px", borderRadius: "4px", border: "1px solid #E0E0E0", boxSizing: "border-box", resize: "vertical" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: "8px", fontSize: "0.875rem", color: "#707070" }}>당첨자 수</label>
                  <input
                    type="number"
                    value={formData.winnerCount}
                    onChange={(e) => setFormData({ ...formData, winnerCount: parseInt(e.target.value) || 1 })}
                    min={1}
                    style={{ width: "100%", padding: "10px", borderRadius: "4px", border: "1px solid #E0E0E0", boxSizing: "border-box" }}
                  />
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "24px" }}>
                <button
                  onClick={() => setOpenDialog(false)}
                  style={{
                    padding: "8px 16px",
                    border: "none",
                    backgroundColor: "transparent",
                    color: "#707070",
                    cursor: "pointer",
                    fontWeight: 600,
                    fontSize: "0.875rem",
                  }}
                >
                  취소
                </button>
                <button
                  onClick={handleSave}
                  style={{
                    padding: "8px 24px",
                    border: "none",
                    backgroundColor: "var(--primary-main)",
                    color: "white",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontWeight: 600,
                    fontSize: "0.875rem",
                  }}
                >
                  저장
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default AdminEventsList;

