import React, { useState, useEffect } from "react";
import IconifyIcon from "../../components/Icon/IconifyIcon";
import MainLayout from "../../components/Layout/MainLayout";
import {
  collection,
  getDocs,
  updateDoc,
  doc,
  Timestamp,
  orderBy,
  query,
} from "firebase/firestore";
import { db } from "../../firebase";
import type { InquiryCategory } from "../../types";
import "./AdminInquiries.css";

// 문의 카테고리 레이블
const INQUIRY_CATEGORY_LABELS: Record<InquiryCategory, string> = {
  booking: "예매/결제",
  refund: "환불/취소",
  account: "회원정보",
  event: "공연/행사",
  other: "기타",
};

interface Inquiry {
  id: string;
  userId: string;
  userEmail: string;
  category: InquiryCategory;
  title: string;
  content: string;
  status: "pending" | "answered";
  answer?: string;
  createdAt: Timestamp;
  answeredAt?: Timestamp;
}

export default function AdminInquiries() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [currentInquiry, setCurrentInquiry] = useState<Inquiry | null>(null);
  const [answer, setAnswer] = useState("");
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // 문의 내역 가져오기
  useEffect(() => {
    fetchInquiries();
  }, []);

  const fetchInquiries = async () => {
    try {
      const q = query(collection(db, "inquiries"), orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      const inquiriesList: Inquiry[] = [];
      querySnapshot.forEach((doc) => {
        inquiriesList.push({
          id: doc.id,
          ...doc.data(),
        } as Inquiry);
      });
      setInquiries(inquiriesList);
    } catch (error) {
      console.error("문의 내역 조회 실패:", error);
    } finally {
      setLoading(false);
    }
  };

  // 답변 작성 다이얼로그 열기
  const openAnswerDialog = (inquiry: Inquiry) => {
    setCurrentInquiry(inquiry);
    setAnswer(inquiry.answer || "");
    setOpenDialog(true);
  };

  // 답변 제출
  const handleSubmitAnswer = async () => {
    if (!currentInquiry || !answer) {
      alert("답변 내용을 입력해주세요.");
      return;
    }

    try {
      const inquiryRef = doc(db, "inquiries", currentInquiry.id);
      await updateDoc(inquiryRef, {
        answer,
        status: "answered",
        answeredAt: Timestamp.now(),
      });

      alert("답변이 등록되었습니다.");
      setOpenDialog(false);
      setAnswer("");
      setCurrentInquiry(null);
      fetchInquiries();
    } catch (error) {
      console.error("답변 등록 실패:", error);
      alert("답변 등록에 실패했습니다.");
    }
  };

  // 행 확장/축소
  const toggleRow = (id: string) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  // 필터링된 문의 목록
  const filteredInquiries = inquiries.filter((inquiry) => {
    const categoryMatch =
      categoryFilter === "all" || inquiry.category === categoryFilter;
    const statusMatch =
      statusFilter === "all" || inquiry.status === statusFilter;
    return categoryMatch && statusMatch;
  });

  return (
    <MainLayout>
      <div className="admin-inquiries-page">
        <div className="admin-inquiries-container">
          {/* 헤더 */}
          <div className="admin-inquiries-header">
            <div className="admin-inquiries-header-text">
              <h1 className="admin-inquiries-title">1:1 문의 관리</h1>
              <p className="admin-inquiries-subtitle">
                사용자 문의에 답변하고 처리 상황을 관리합니다
              </p>
            </div>
            <div className="admin-inquiries-filters">
              <select
                className="admin-inquiries-filter-select"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="all">전체 유형</option>
                {Object.entries(INQUIRY_CATEGORY_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
              <select
                className="admin-inquiries-filter-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">전체 상태</option>
                <option value="pending">답변대기</option>
                <option value="answered">답변완료</option>
              </select>
            </div>
          </div>

          {/* 통계 카드 */}
          <div className="admin-inquiries-stats-grid">
            <div className="admin-inquiries-stat-card">
              <p className="admin-inquiries-stat-label">전체 문의</p>
              <h2 className="admin-inquiries-stat-value">{filteredInquiries.length}</h2>
            </div>
            <div className="admin-inquiries-stat-card">
              <p className="admin-inquiries-stat-label">답변 대기</p>
              <h2 className="admin-inquiries-stat-value admin-inquiries-stat-value-orange">
                {filteredInquiries.filter((i) => i.status === "pending").length}
              </h2>
            </div>
          </div>

          {/* 문의 테이블 */}
          <div className="admin-inquiries-table-card">
            <table className="admin-inquiries-table">
              <thead>
                <tr>
                  <th className="admin-inquiries-th-expand"></th>
                  <th className="admin-inquiries-th-center">문의유형</th>
                  <th>제목</th>
                  <th>작성자</th>
                  <th>작성일</th>
                  <th className="admin-inquiries-th-center">상태</th>
                  <th className="admin-inquiries-th-center">관리</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="admin-inquiries-empty-cell">
                      <p className="admin-inquiries-loading-text">로딩 중...</p>
                    </td>
                  </tr>
                ) : filteredInquiries.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="admin-inquiries-empty-cell">
                      <p className="admin-inquiries-empty-text">
                        {inquiries.length === 0
                          ? "문의 내역이 없습니다"
                          : "조건에 맞는 문의가 없습니다"}
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredInquiries.map((inquiry) => (
                    <React.Fragment key={inquiry.id}>
                      <tr className="admin-inquiries-table-row">
                        <td>
                          <button
                            className="admin-inquiries-expand-button"
                            onClick={() => toggleRow(inquiry.id)}
                          >
                            <IconifyIcon
                              icon={expandedRow === inquiry.id ? "mdi:chevron-up" : "mdi:chevron-down"}
                              width={20}
                              height={20}
                            />
                          </button>
                        </td>
                        <td className="admin-inquiries-td-center">
                          <span className="admin-inquiries-category-chip">
                            {INQUIRY_CATEGORY_LABELS[inquiry.category]}
                          </span>
                        </td>
                        <td>
                          <p className="admin-inquiries-title-text">{inquiry.title}</p>
                        </td>
                        <td>
                          <p className="admin-inquiries-email">{inquiry.userEmail}</p>
                        </td>
                        <td>
                          <p className="admin-inquiries-date">
                            {inquiry.createdAt?.toDate().toLocaleDateString("ko-KR")}
                          </p>
                        </td>
                        <td className="admin-inquiries-td-center">
                          <span
                            className={`admin-inquiries-status-chip ${
                              inquiry.status === "answered" ? "answered" : "pending"
                            }`}
                          >
                            {inquiry.status === "answered" ? "답변완료" : "답변대기"}
                          </span>
                        </td>
                        <td className="admin-inquiries-td-center">
                          <button
                            className="admin-inquiries-answer-button"
                            onClick={() => openAnswerDialog(inquiry)}
                          >
                            <IconifyIcon icon="mdi:reply" width={20} height={20} />
                            {inquiry.status === "answered" ? "수정" : "답변"}
                          </button>
                        </td>
                      </tr>
                      {/* 확장된 내용 */}
                      {expandedRow === inquiry.id && (
                        <tr className="admin-inquiries-expanded-row">
                          <td colSpan={7} className="admin-inquiries-expanded-cell">
                            <div className="admin-inquiries-expanded-content">
                              <div className="admin-inquiries-expanded-section">
                                <h4 className="admin-inquiries-expanded-label">문의 내용:</h4>
                                <p className="admin-inquiries-expanded-text">{inquiry.content}</p>
                              </div>
                              {inquiry.answer && (
                                <div className="admin-inquiries-expanded-section admin-inquiries-expanded-answer">
                                  <h4 className="admin-inquiries-expanded-label admin-inquiries-expanded-label-answer">
                                    답변 내용:
                                  </h4>
                                  <p className="admin-inquiries-expanded-text">{inquiry.answer}</p>
                                  <p className="admin-inquiries-expanded-date">
                                    답변일:{" "}
                                    {inquiry.answeredAt?.toDate().toLocaleDateString("ko-KR")}
                                  </p>
                                </div>
                              )}
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

      {/* 답변 작성 다이얼로그 */}
      {openDialog && currentInquiry && (
        <div className="admin-inquiries-dialog-overlay" onClick={() => setOpenDialog(false)}>
          <div className="admin-inquiries-dialog" onClick={(e) => e.stopPropagation()}>
            <h2 className="admin-inquiries-dialog-title">문의 답변</h2>
            <div className="admin-inquiries-dialog-content">
              <div className="admin-inquiries-dialog-inquiry-box">
                <span className="admin-inquiries-dialog-category-chip">
                  {INQUIRY_CATEGORY_LABELS[currentInquiry.category]}
                </span>
                <h3 className="admin-inquiries-dialog-inquiry-title">
                  제목: {currentInquiry.title}
                </h3>
                <p className="admin-inquiries-dialog-inquiry-content">{currentInquiry.content}</p>
                <p className="admin-inquiries-dialog-inquiry-meta">
                  작성자: {currentInquiry.userEmail} |{" "}
                  {currentInquiry.createdAt?.toDate().toLocaleDateString("ko-KR")}
                </p>
              </div>
              <div className="admin-inquiries-dialog-form-group">
                <label className="admin-inquiries-dialog-label">답변 내용</label>
                <textarea
                  className="admin-inquiries-dialog-textarea"
                  rows={8}
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="답변 내용을 작성해주세요. 작성된 답변은 사용자의 이메일로 발송됩니다."
                />
              </div>
            </div>
            <div className="admin-inquiries-dialog-actions">
              <button
                className="admin-inquiries-dialog-button admin-inquiries-dialog-button-cancel"
                onClick={() => setOpenDialog(false)}
              >
                취소
              </button>
              <button
                className="admin-inquiries-dialog-button admin-inquiries-dialog-button-primary"
                onClick={handleSubmitAnswer}
              >
                답변 등록
              </button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
