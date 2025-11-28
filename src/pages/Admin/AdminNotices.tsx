import React, { useState, useEffect } from "react";
import IconifyIcon from "../../components/Icon/IconifyIcon";
import MainLayout from "../../components/Layout/MainLayout";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  Timestamp,
  orderBy,
  query,
} from "firebase/firestore";
import { db } from "../../firebase";
import "./AdminNotices.css";

interface Notice {
  id: string;
  title: string;
  content: string;
  important: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export default function AdminNotices() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentNotice, setCurrentNotice] = useState<Partial<Notice>>({
    title: "",
    content: "",
    important: false,
  });

  // 공지사항 목록 가져오기
  useEffect(() => {
    fetchNotices();
  }, []);

  const fetchNotices = async () => {
    try {
      const q = query(collection(db, "notices"), orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      const noticesList: Notice[] = [];
      querySnapshot.forEach((doc) => {
        noticesList.push({
          id: doc.id,
          ...doc.data(),
        } as Notice);
      });
      setNotices(noticesList);
    } catch (error) {
      console.error("공지사항 조회 실패:", error);
    } finally {
      setLoading(false);
    }
  };

  // 공지사항 추가
  const handleAddNotice = async () => {
    if (!currentNotice.title || !currentNotice.content) {
      alert("제목과 내용을 입력해주세요.");
      return;
    }

    try {
      await addDoc(collection(db, "notices"), {
        ...currentNotice,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      alert("공지사항이 등록되었습니다.");
      setOpenDialog(false);
      resetForm();
      fetchNotices();
    } catch (error) {
      console.error("공지사항 등록 실패:", error);
      alert("공지사항 등록에 실패했습니다.");
    }
  };

  // 공지사항 수정
  const handleUpdateNotice = async () => {
    if (!currentNotice.id) return;

    try {
      const noticeRef = doc(db, "notices", currentNotice.id);
      await updateDoc(noticeRef, {
        title: currentNotice.title,
        content: currentNotice.content,
        important: currentNotice.important,
        updatedAt: Timestamp.now(),
      });
      alert("공지사항이 수정되었습니다.");
      setOpenDialog(false);
      resetForm();
      fetchNotices();
    } catch (error) {
      console.error("공지사항 수정 실패:", error);
      alert("공지사항 수정에 실패했습니다.");
    }
  };

  // 공지사항 삭제
  const handleDeleteNotice = async (id: string) => {
    if (!window.confirm("정말 삭제하시겠습니까?")) return;

    try {
      await deleteDoc(doc(db, "notices", id));
      alert("공지사항이 삭제되었습니다.");
      fetchNotices();
    } catch (error) {
      console.error("공지사항 삭제 실패:", error);
      alert("공지사항 삭제에 실패했습니다.");
    }
  };

  // 폼 초기화
  const resetForm = () => {
    setCurrentNotice({
      title: "",
      content: "",
      important: false,
    });
    setEditMode(false);
  };

  // 수정 모드 열기
  const openEditDialog = (notice: Notice) => {
    setCurrentNotice(notice);
    setEditMode(true);
    setOpenDialog(true);
  };

  // 새 공지 작성 모드 열기
  const openAddDialog = () => {
    resetForm();
    setOpenDialog(true);
  };

  return (
    <MainLayout>
      <div className="admin-notices-page">
        <div className="admin-notices-container">
          {/* 헤더 */}
          <div className="admin-notices-header">
            <div className="admin-notices-header-text">
              <h1 className="admin-notices-title">공지사항 관리</h1>
              <p className="admin-notices-subtitle">
                메인 페이지 및 공지사항 페이지에 표시될 공지를 관리합니다
              </p>
            </div>
            <button className="admin-notices-add-button" onClick={openAddDialog}>
              <IconifyIcon icon="mdi:plus" width={20} height={20} />
              공지 작성
            </button>
          </div>

          {/* 공지사항 테이블 */}
          <div className="admin-notices-table-card">
            <table className="admin-notices-table">
              <thead>
                <tr>
                  <th>중요</th>
                  <th>제목</th>
                  <th>작성일</th>
                  <th className="admin-notices-th-action">관리</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={4} className="admin-notices-empty-cell">
                      <p className="admin-notices-loading-text">로딩 중...</p>
                    </td>
                  </tr>
                ) : notices.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="admin-notices-empty-cell">
                      <p className="admin-notices-empty-text">등록된 공지사항이 없습니다</p>
                    </td>
                  </tr>
                ) : (
                  notices.map((notice) => (
                    <tr key={notice.id} className="admin-notices-table-row">
                      <td>
                        {notice.important && (
                          <span className="admin-notices-important-chip">중요</span>
                        )}
                      </td>
                      <td>
                        <p className="admin-notices-title-text">{notice.title}</p>
                      </td>
                      <td>
                        <p className="admin-notices-date">
                          {notice.createdAt?.toDate().toLocaleDateString("ko-KR")}
                        </p>
                      </td>
                      <td className="admin-notices-td-action">
                        <button
                          className="admin-notices-action-button"
                          onClick={() => openEditDialog(notice)}
                        >
                          <IconifyIcon icon="mdi:pencil" width={20} height={20} />
                        </button>
                        <button
                          className="admin-notices-action-button admin-notices-action-button-danger"
                          onClick={() => handleDeleteNotice(notice.id)}
                        >
                          <IconifyIcon icon="mdi:delete" width={20} height={20} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 공지 작성/수정 다이얼로그 */}
      {openDialog && (
        <div className="admin-notices-dialog-overlay" onClick={() => setOpenDialog(false)}>
          <div className="admin-notices-dialog" onClick={(e) => e.stopPropagation()}>
            <h2 className="admin-notices-dialog-title">
              {editMode ? "공지사항 수정" : "공지사항 작성"}
            </h2>
            <div className="admin-notices-dialog-content">
              <div className="admin-notices-dialog-switch-wrapper">
                <label className="admin-notices-dialog-switch-label">
                  <input
                    type="checkbox"
                    className="admin-notices-dialog-switch"
                    checked={currentNotice.important || false}
                    onChange={(e) =>
                      setCurrentNotice({
                        ...currentNotice,
                        important: e.target.checked,
                      })
                    }
                  />
                  <span className="admin-notices-dialog-switch-slider"></span>
                  중요 공지
                </label>
              </div>
              <div className="admin-notices-dialog-form-group">
                <label className="admin-notices-dialog-label">제목</label>
                <input
                  type="text"
                  className="admin-notices-dialog-input"
                  value={currentNotice.title || ""}
                  onChange={(e) =>
                    setCurrentNotice({ ...currentNotice, title: e.target.value })
                  }
                />
              </div>
              <div className="admin-notices-dialog-form-group">
                <label className="admin-notices-dialog-label">내용</label>
                <textarea
                  className="admin-notices-dialog-textarea"
                  rows={8}
                  value={currentNotice.content || ""}
                  onChange={(e) =>
                    setCurrentNotice({ ...currentNotice, content: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="admin-notices-dialog-actions">
              <button
                className="admin-notices-dialog-button admin-notices-dialog-button-cancel"
                onClick={() => setOpenDialog(false)}
              >
                취소
              </button>
              <button
                className="admin-notices-dialog-button admin-notices-dialog-button-primary"
                onClick={editMode ? handleUpdateNotice : handleAddNotice}
              >
                {editMode ? "수정" : "등록"}
              </button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
