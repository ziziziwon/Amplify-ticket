import React, { useState, useEffect } from "react";
import MainLayout from "../../components/Layout/MainLayout";
import IconifyIcon from "../../components/Icon/IconifyIcon";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "../../firebase";
import { Notice as NoticeType } from "../../types";
import "./Notice.css";

export default function Notice() {
  const [notices, setNotices] = useState<NoticeType[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNotice, setSelectedNotice] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;

  // Firestore에서 공지사항 불러오기
  useEffect(() => {
    fetchNotices();
  }, []);

  const fetchNotices = async () => {
    try {
      const q = query(collection(db, "notices"), orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      const noticesList: NoticeType[] = [];
      querySnapshot.forEach((doc) => {
        noticesList.push({
          id: doc.id,
          ...doc.data(),
        } as NoticeType);
      });
      setNotices(noticesList);
    } catch (error) {
      console.error("공지사항 조회 실패:", error);
    } finally {
      setLoading(false);
    }
  };

  // NEW 표시 여부 (7일 이내)
  const isNew = (createdAt: any) => {
    const now = new Date();
    const noticeDate = createdAt.toDate();
    const diffDays = Math.floor(
      (now.getTime() - noticeDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    return diffDays <= 7;
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    setSelectedNotice(null);
  };

  const paginatedNotices = notices.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  const totalPages = Math.ceil(notices.length / itemsPerPage);

  if (loading) {
    return (
      <MainLayout>
        <div className="notice-loading">
          <div className="notice-loading-spinner"></div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      {/* Hero Section */}
      <div className="notice-hero">
        <div className="notice-hero-container">
          <div className="notice-hero-header">
            <IconifyIcon icon="mdi:bullhorn" width={48} height={48} className="notice-hero-icon" />
            <h1 className="notice-hero-title">공지사항</h1>
          </div>
          <p className="notice-hero-subtitle">AMPLIFY의 새로운 소식을 확인하세요</p>
        </div>
      </div>

      <div className="notice-container">
        <div className={`notice-grid ${selectedNotice ? "with-detail" : ""}`}>
          {/* 공지사항 리스트 */}
          <div className="notice-list-paper">
            <div className="notice-list-header">
              <h2 className="notice-list-title">
                전체 공지사항
                <span className="notice-list-count">{notices.length}</span>
              </h2>
            </div>

            <ul className="notice-list">
              {paginatedNotices.length === 0 ? (
                <li className="notice-list-empty">등록된 공지사항이 없습니다</li>
              ) : (
                paginatedNotices.map((notice) => (
                  <li
                    key={notice.id}
                    className={`notice-item ${selectedNotice === notice.id ? "selected" : ""}`}
                    onClick={() => setSelectedNotice(notice.id)}
                  >
                    <div className="notice-item-badges">
                      {notice.important && (
                        <span className="notice-badge important">중요</span>
                      )}
                      {isNew(notice.createdAt) && (
                        <span className="notice-badge new">NEW</span>
                      )}
                    </div>
                    <div className="notice-item-title">{notice.title}</div>
                    <div className="notice-item-date">
                      {notice.createdAt.toDate().toLocaleDateString("ko-KR")}
                    </div>
                  </li>
                ))
              )}
            </ul>

            <div className="notice-pagination">
              <ul className="notice-pagination-list">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                  <li
                    key={pageNum}
                    className={`notice-pagination-item ${page === pageNum ? "active" : ""}`}
                    onClick={() => handlePageChange(pageNum)}
                  >
                    {pageNum}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* 선택된 공지사항 상세 */}
          {selectedNotice && (
            <div className={`notice-detail-paper ${selectedNotice ? "visible" : ""}`}>
              {notices
                .filter((n) => n.id === selectedNotice)
                .map((notice) => (
                  <div key={notice.id}>
                    <div className="notice-detail-badges">
                      {notice.important && (
                        <span className="notice-badge important">중요</span>
                      )}
                      {isNew(notice.createdAt) && (
                        <span className="notice-badge new">NEW</span>
                      )}
                    </div>
                    <h2 className="notice-detail-title">{notice.title}</h2>
                    <div className="notice-detail-meta">
                      작성일: {notice.createdAt.toDate().toLocaleDateString("ko-KR")}
                      {notice.updatedAt.toMillis() !== notice.createdAt.toMillis() &&
                        ` | 수정일: ${notice.updatedAt.toDate().toLocaleDateString("ko-KR")}`}
                    </div>
                    <div className="notice-detail-content">{notice.content}</div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}

