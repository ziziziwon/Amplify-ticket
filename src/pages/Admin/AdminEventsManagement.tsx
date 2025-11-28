import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import IconifyIcon from "../../components/Icon/IconifyIcon";
import MainLayout from "../../components/Layout/MainLayout";
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, Timestamp } from "firebase/firestore";
import { db } from "../../firebase";

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

export default function AdminEventsManagement() {
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);

  // Form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [period, setPeriod] = useState("");
  const [status, setStatus] = useState("진행중");
  const [image, setImage] = useState("");
  const [color, setColor] = useState("#FF8C55");
  const [type, setType] = useState<EventType[]>(["all"]);

  // Fetch events from Firestore (or use local data)
  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      // For now, using local sample data
      // In production, fetch from Firestore: collection(db, "events")
      const sampleEvents: Event[] = [
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
      ];
      setEvents(sampleEvents);
      setLoading(false);
    } catch (error) {
      console.error("이벤트 로딩 실패:", error);
      setLoading(false);
    }
  };

  const handleOpenDialog = (event?: Event) => {
    if (event) {
      setEditingEvent(event);
      setTitle(event.title);
      setDescription(event.description);
      setPeriod(event.period);
      setStatus(event.status);
      setImage(event.image);
      setColor(event.color);
      setType(event.type);
    } else {
      setEditingEvent(null);
      setTitle("");
      setDescription("");
      setPeriod("");
      setStatus("진행중");
      setImage("");
      setColor("#FF8C55");
      setType(["all"]);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingEvent(null);
  };

  const handleSaveEvent = async () => {
    try {
      const eventData = {
        title,
        description,
        period,
        status,
        image,
        color,
        type,
      };

      if (editingEvent) {
        // Update existing event
        // await updateDoc(doc(db, "events", editingEvent.id), eventData);
        setEvents(events.map(e => e.id === editingEvent.id ? { ...e, ...eventData } : e));
        alert("이벤트가 수정되었습니다!");
      } else {
        // Create new event
        // const docRef = await addDoc(collection(db, "events"), eventData);
        const newEvent: Event = {
          id: `event-${Date.now()}`,
          ...eventData,
        };
        setEvents([...events, newEvent]);
        alert("이벤트가 생성되었습니다!");
      }

      handleCloseDialog();
    } catch (error) {
      console.error("이벤트 저장 실패:", error);
      alert("이벤트 저장에 실패했습니다.");
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!window.confirm("정말 이 이벤트를 삭제하시겠습니까?")) return;

    try {
      // await deleteDoc(doc(db, "events", eventId));
      setEvents(events.filter(e => e.id !== eventId));
      alert("이벤트가 삭제되었습니다!");
    } catch (error) {
      console.error("이벤트 삭제 실패:", error);
      alert("이벤트 삭제에 실패했습니다.");
    }
  };

  const handleTypeChange = (value: EventType) => {
    if (type.includes(value)) {
      setType(type.filter(t => t !== value));
    } else {
      setType([...type, value]);
    }
  };

  return (
    <MainLayout>
      <div
        style={{
          backgroundColor: "#F5F5F5",
          minHeight: "100vh",
          paddingBottom: "32px",
        }}
      >
        <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "24px", paddingTop: "24px" }}>
          {/* Header */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "24px",
            }}
          >
            <div>
              <h4
                style={{
                  fontWeight: 800,
                  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  backgroundClip: "text",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  marginBottom: "4px",
                  fontFamily: "var(--font-family-base)",
                  fontSize: "2rem",
                  margin: "0 0 4px 0",
                }}
              >
                이벤트 관리
              </h4>
              <p
                style={{
                  color: "#999",
                  fontSize: "0.875rem",
                  fontFamily: "var(--font-family-base)",
                  margin: 0,
                }}
              >
                사용자 이벤트를 생성하고 관리합니다
              </p>
            </div>
            <button
              onClick={() => handleOpenDialog()}
              style={{
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                border: "none",
                color: "white",
                fontWeight: 600,
                padding: "10px 24px",
                borderRadius: "8px",
                boxShadow: "0 4px 12px rgba(102, 126, 234, 0.3)",
                fontFamily: "var(--font-family-base)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                fontSize: "0.875rem",
              }}
            >
              <IconifyIcon icon="mdi:plus" width={20} height={20} />
              이벤트 생성
            </button>
          </div>

          {/* Events Grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: "24px",
            }}
          >
            {events.map((event) => (
              <div
                key={event.id}
                style={{
                  border: "1px solid #e0e0e0",
                  borderRadius: "12px",
                  overflow: "hidden",
                  backgroundColor: "#fff",
                  transition: "all 0.2s",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                }}
              >
                <div style={{ position: "relative" }}>
                  <img
                    src={event.image}
                    alt={event.title}
                    style={{
                      width: "100%",
                      height: "200px",
                      objectFit: "cover",
                      display: "block",
                    }}
                  />
                  <span
                    style={{
                      position: "absolute",
                      top: "12px",
                      right: "12px",
                      background: event.status === "진행중"
                        ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                        : event.status === "예정"
                          ? "#667eea"
                          : event.color,
                      color: "white",
                      fontWeight: 600,
                      fontSize: "0.6875rem",
                      padding: "4px 8px",
                      borderRadius: "8px",
                      fontFamily: "var(--font-family-base)",
                    }}
                  >
                    {event.status}
                  </span>
                </div>
                <div style={{ padding: "16px" }}>
                  <h6
                    style={{
                      fontWeight: 700,
                      color: "#232323",
                      marginBottom: "8px",
                      fontSize: "1rem",
                      fontFamily: "var(--font-family-base)",
                      margin: "0 0 8px 0",
                    }}
                  >
                    {event.title}
                  </h6>
                  <p
                    style={{
                      color: "#707070",
                      marginBottom: "8px",
                      fontSize: "0.8125rem",
                      fontFamily: "var(--font-family-base)",
                      margin: "0 0 8px 0",
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {event.description}
                  </p>
                  <span
                    style={{
                      color: "#9CA3AF",
                      display: "block",
                      marginBottom: "8px",
                      fontFamily: "var(--font-family-base)",
                      fontSize: "0.75rem",
                    }}
                  >
                    {event.period}
                  </span>
                  <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                    {event.type.map((t) => (
                      <span
                        key={t}
                        style={{
                          fontSize: "0.625rem",
                          padding: "2px 6px",
                          backgroundColor: "#F5F5F5",
                          color: "#707070",
                          borderRadius: "4px",
                          fontFamily: "var(--font-family-base)",
                        }}
                      >
                        {t === "all" ? "전체 이벤트" : t === "winner" ? "당첨자발표" : "참여이벤트"}
                      </span>
                    ))}
                  </div>
                </div>
                <div style={{ padding: "0 16px 16px 16px", display: "flex", gap: "8px" }}>
                  <button
                    onClick={() => handleOpenDialog(event)}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#4C4F7A",
                      cursor: "pointer",
                      padding: "4px",
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <IconifyIcon icon="mdi:pencil" width={20} height={20} />
                  </button>
                  <button
                    onClick={() => handleDeleteEvent(event.id)}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#FF5252",
                      cursor: "pointer",
                      padding: "4px",
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <IconifyIcon icon="mdi:delete" width={20} height={20} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Empty State */}
          {events.length === 0 && !loading && (
            <div
              style={{
                textAlign: "center",
                padding: "80px 0",
                backgroundColor: "#fff",
                borderRadius: "12px",
                border: "1px solid #D7D7D7",
              }}
            >
              <h6
                style={{
                  fontWeight: 700,
                  color: "#707070",
                  marginBottom: "16px",
                  fontFamily: "var(--font-family-base)",
                  fontSize: "1.25rem",
                  margin: "0 0 16px 0",
                }}
              >
                등록된 이벤트가 없습니다
              </h6>
              <p
                style={{
                  color: "#9CA3AF",
                  marginBottom: "24px",
                  fontFamily: "var(--font-family-base)",
                  fontSize: "0.875rem",
                  margin: "0 0 24px 0",
                }}
              >
                새로운 이벤트를 생성해보세요
              </p>
              <button
                onClick={() => handleOpenDialog()}
                style={{
                  backgroundColor: "#FF8C55",
                  border: "none",
                  color: "white",
                  fontWeight: 600,
                  padding: "10px 24px",
                  borderRadius: "8px",
                  fontFamily: "var(--font-family-base)",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  fontSize: "0.875rem",
                }}
              >
                <IconifyIcon icon="mdi:plus" width={20} height={20} />
                이벤트 생성
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit Dialog */}
      {openDialog && (
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
                margin: "0 0 24px 0",
              }}
            >
              {editingEvent ? "이벤트 수정" : "이벤트 생성"}
            </h2>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={{ display: "block", marginBottom: "8px", fontSize: "0.875rem", fontWeight: 600, color: "#232323" }}>제목</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: "6px", border: "1px solid #E0E0E0", fontSize: "0.875rem", fontFamily: "var(--font-family-base)" }}
                />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "8px", fontSize: "0.875rem", fontWeight: 600, color: "#232323" }}>설명</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: "6px", border: "1px solid #E0E0E0", fontSize: "0.875rem", fontFamily: "var(--font-family-base)", resize: "vertical" }}
                />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "8px", fontSize: "0.875rem", fontWeight: 600, color: "#232323" }}>기간</label>
                <input
                  type="text"
                  placeholder="예: 2025.01.01 ~ 2025.12.31"
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: "6px", border: "1px solid #E0E0E0", fontSize: "0.875rem", fontFamily: "var(--font-family-base)" }}
                />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "8px", fontSize: "0.875rem", fontWeight: 600, color: "#232323" }}>이미지 URL</label>
                <input
                  type="text"
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: "6px", border: "1px solid #E0E0E0", fontSize: "0.875rem", fontFamily: "var(--font-family-base)" }}
                />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "8px", fontSize: "0.875rem", fontWeight: 600, color: "#232323" }}>상태</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: "6px", border: "1px solid #E0E0E0", fontSize: "0.875rem", fontFamily: "var(--font-family-base)", backgroundColor: "white" }}
                >
                  <option value="진행중">진행중</option>
                  <option value="종료">종료</option>
                  <option value="당첨자발표">당첨자발표</option>
                </select>
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "8px", fontSize: "0.875rem", fontWeight: 600, color: "#232323" }}>색상</label>
                <select
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: "6px", border: "1px solid #E0E0E0", fontSize: "0.875rem", fontFamily: "var(--font-family-base)", backgroundColor: "white" }}
                >
                  <option value="#FF8C55">Neon Peach (#FF8C55)</option>
                  <option value="#4C4F7A">Mist Indigo (#4C4F7A)</option>
                  <option value="#7062A6">Slate Violet (#7062A6)</option>
                </select>
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "8px", fontSize: "0.875rem", fontWeight: 600, color: "#232323" }}>표시 카테고리</label>
                <div style={{ display: "flex", gap: "8px" }}>
                  {(["all", "winner", "participated"] as EventType[]).map((t) => (
                    <button
                      key={t}
                      onClick={() => handleTypeChange(t)}
                      style={{
                        backgroundColor: type.includes(t) ? "#FF8C55" : "#F5F5F5",
                        color: type.includes(t) ? "#fff" : "#707070",
                        fontWeight: 600,
                        cursor: "pointer",
                        border: "none",
                        padding: "6px 12px",
                        borderRadius: "16px",
                        fontSize: "0.8125rem",
                        fontFamily: "var(--font-family-base)",
                      }}
                    >
                      {t === "all" ? "전체 이벤트" : t === "winner" ? "당첨자발표" : "참여이벤트"}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "24px" }}>
              <button
                onClick={handleCloseDialog}
                style={{
                  padding: "10px 24px",
                  borderRadius: "6px",
                  border: "1px solid #E0E0E0",
                  backgroundColor: "white",
                  color: "#707070",
                  cursor: "pointer",
                  fontWeight: 600,
                  fontFamily: "var(--font-family-base)",
                  fontSize: "0.875rem",
                }}
              >
                취소
              </button>
              <button
                onClick={handleSaveEvent}
                style={{
                  padding: "10px 24px",
                  borderRadius: "6px",
                  border: "none",
                  backgroundColor: "#FF8C55",
                  color: "white",
                  cursor: "pointer",
                  fontWeight: 600,
                  fontFamily: "var(--font-family-base)",
                  fontSize: "0.875rem",
                }}
              >
                {editingEvent ? "수정" : "생성"}
              </button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
