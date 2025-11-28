import React, { useEffect, useState } from "react";
import IconifyIcon from "../../components/Icon/IconifyIcon";
import MainLayout from "../../components/Layout/MainLayout";
import { collection, getDocs, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "../../firebase";
import "./AdminUsers.css";

interface UserData {
  uid: string;
  email: string;
  nickname: string;
  phone?: string | null;
  birthYear?: number | null;
  provider: string;
  role?: "user" | "admin" | "banned";
  ticketCount: number;
  createdAt: any;
}

export default function AdminUsers() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserData[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [newRole, setNewRole] = useState<"user" | "admin" | "banned">("user");
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const usersSnapshot = await getDocs(collection(db, "users"));
        const usersData = usersSnapshot.docs.map((doc) => ({
          uid: doc.id,
          ...doc.data(),
        })) as UserData[];

        // 최근 가입순 정렬
        usersData.sort((a, b) => {
          const aTime = a.createdAt?.toDate?.() || new Date(0);
          const bTime = b.createdAt?.toDate?.() || new Date(0);
          return bTime.getTime() - aTime.getTime();
        });

        setUsers(usersData);
        setFilteredUsers(usersData);
        console.log("사용자 데이터 로딩 완료:", usersData.length, "명");
      } catch (error) {
        console.error("사용자 데이터 로딩 실패:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const filtered = users.filter(
        (user) =>
          user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.nickname?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers(users);
    }
  }, [searchQuery, users]);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, user: UserData) => {
    setAnchorEl(event.currentTarget);
    setSelectedUser(user);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedUser(null);
  };

  const handleRoleChange = () => {
    if (selectedUser) {
      setNewRole(selectedUser.role || "user");
      setRoleDialogOpen(true);
    }
    handleMenuClose();
  };

  const handleRoleUpdate = async () => {
    if (!selectedUser) return;

    try {
      setUpdating(true);

      // Firestore 업데이트
      await updateDoc(doc(db, "users", selectedUser.uid), {
        role: newRole,
        updatedAt: new Date(),
      });

      // 로컬 상태 업데이트
      setUsers(
        users.map((user) =>
          user.uid === selectedUser.uid ? { ...user, role: newRole } : user
        )
      );

      setRoleDialogOpen(false);
      setSelectedUser(null);

      console.log("사용자 권한 변경 완료:", selectedUser.email, "→", newRole);
    } catch (error) {
      console.error("사용자 권한 변경 실패:", error);
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
    handleMenuClose();
  };

  const handleDelete = async () => {
    if (!selectedUser) return;

    try {
      setUpdating(true);

      // Firestore에서 삭제
      await deleteDoc(doc(db, "users", selectedUser.uid));
      
      // 실제로는 Firebase Auth에서도 삭제해야 함 (Admin SDK 필요)
      // await auth.deleteUser(selectedUser.uid);

      // 로컬 상태 업데이트
      setUsers(users.filter((u) => u.uid !== selectedUser.uid));
      setDeleteDialogOpen(false);
      setSelectedUser(null);

      console.log("사용자 삭제 완료:", selectedUser.email);
    } catch (error) {
      console.error("사용자 삭제 실패:", error);
    } finally {
      setUpdating(false);
    }
  };

  const getRoleChip = (role?: string) => {
    const config: Record<string, { label: string; color: string; icon: string; gradient?: boolean }> = {
      admin: {
        label: "관리자",
        color: "#f59e0b",
        icon: "mdi:shield-crown",
        gradient: false,
      },
      banned: {
        label: "정지",
        color: "#ef4444",
        icon: "mdi:block-helper",
        gradient: false,
      },
      user: {
        label: "일반",
        color: "#667eea",
        icon: "mdi:account",
        gradient: true,
      },
    };

    const { label, color, icon, gradient } = config[role || "user"];

    return (
      <span
        className="admin-users-role-chip"
        style={{
          background: gradient ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" : color,
        }}
      >
        <IconifyIcon icon={icon} width={14} height={14} />
        {label}
      </span>
    );
  };

  return (
    <MainLayout>
      <div className="admin-users-page">
        <div className="admin-users-container">
          {/* 헤더 */}
          <div className="admin-users-header">
            <div className="admin-users-header-text">
              <h1 className="admin-users-title">사용자 관리</h1>
              <p className="admin-users-subtitle">전체 {filteredUsers.length}명</p>
            </div>
          </div>

          {/* 통계 */}
          <div className="admin-users-stats-grid">
            <div className="admin-users-stat-card">
              <p className="admin-users-stat-label">전체 회원</p>
              <h2 className="admin-users-stat-value">{users.length}</h2>
            </div>
            <div className="admin-users-stat-card">
              <p className="admin-users-stat-label">관리자</p>
              <h2 className="admin-users-stat-value admin-users-stat-value-orange">
                {users.filter((u) => u.role === "admin").length}
              </h2>
            </div>
            <div className="admin-users-stat-card">
              <p className="admin-users-stat-label">정지된 회원</p>
              <h2 className="admin-users-stat-value">{users.filter((u) => u.role === "banned").length}</h2>
            </div>
          </div>

          {/* 검색 */}
          <div className="admin-users-search-card">
            <div className="admin-users-search-wrapper">
              <IconifyIcon icon="mdi:magnify" width={20} height={20} className="admin-users-search-icon" />
              <input
                type="text"
                className="admin-users-search-input"
                placeholder="이메일 또는 닉네임으로 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* 테이블 */}
          <div className="admin-users-table-card">
            <table className="admin-users-table">
              <thead>
                <tr>
                  <th>이메일</th>
                  <th>닉네임</th>
                  <th>가입방법</th>
                  <th>역할</th>
                  <th>예매내역</th>
                  <th>가입일</th>
                  <th className="admin-users-th-action">액션</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="admin-users-empty-cell">
                      <p className="admin-users-loading-text">로딩 중...</p>
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="admin-users-empty-cell">
                      <p className="admin-users-empty-text">검색 결과가 없습니다</p>
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.uid} className="admin-users-table-row">
                      <td>
                        <p className="admin-users-email">{user.email}</p>
                      </td>
                      <td>
                        <p className="admin-users-nickname">{user.nickname || "-"}</p>
                      </td>
                      <td>
                        <span className="admin-users-provider-chip">
                          {user.provider === "google"
                            ? "Google"
                            : user.provider === "kakao"
                            ? "Kakao"
                            : "Email"}
                        </span>
                      </td>
                      <td>{getRoleChip(user.role)}</td>
                      <td>
                        <p className="admin-users-ticket-count">{user.ticketCount}건</p>
                      </td>
                      <td>
                        <p className="admin-users-date">
                          {user.createdAt?.toDate?.()
                            ? new Date(user.createdAt.toDate()).toLocaleDateString("ko-KR")
                            : "-"}
                        </p>
                      </td>
                      <td className="admin-users-td-action">
                        <button
                          className="admin-users-action-button"
                          onClick={(e) => handleMenuOpen(e, user)}
                        >
                          <IconifyIcon icon="mdi:dots-vertical" width={20} height={20} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* 액션 메뉴 */}
          {anchorEl && (
            <div
              className="admin-users-action-menu"
              style={{ top: anchorEl.offsetTop + 30, left: anchorEl.offsetLeft }}
            >
              <button className="admin-users-menu-item" onClick={handleRoleChange}>
                <IconifyIcon icon="mdi:shield-crown" width={20} height={20} />
                권한 변경
              </button>
              <button className="admin-users-menu-item admin-users-menu-item-danger" onClick={handleDeleteClick}>
                <IconifyIcon icon="mdi:delete" width={20} height={20} />
                삭제
              </button>
            </div>
          )}

          {/* 권한 변경 다이얼로그 */}
          {roleDialogOpen && (
            <div className="admin-users-dialog-overlay" onClick={() => setRoleDialogOpen(false)}>
              <div className="admin-users-dialog" onClick={(e) => e.stopPropagation()}>
                <h2 className="admin-users-dialog-title">사용자 권한 변경</h2>
                <div className="admin-users-dialog-content">
                  <p className="admin-users-dialog-email">{selectedUser?.email}</p>
                  <div className="admin-users-dialog-form-group">
                    <label className="admin-users-dialog-label">권한</label>
                    <select
                      className="admin-users-dialog-select"
                      value={newRole}
                      onChange={(e) => setNewRole(e.target.value as any)}
                    >
                      <option value="user">일반 사용자</option>
                      <option value="admin">관리자</option>
                      <option value="banned">정지</option>
                    </select>
                  </div>
                </div>
                <div className="admin-users-dialog-actions">
                  <button
                    className="admin-users-dialog-button admin-users-dialog-button-cancel"
                    onClick={() => setRoleDialogOpen(false)}
                    disabled={updating}
                  >
                    취소
                  </button>
                  <button
                    className="admin-users-dialog-button admin-users-dialog-button-primary"
                    onClick={handleRoleUpdate}
                    disabled={updating}
                  >
                    {updating ? "변경 중..." : "변경"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 삭제 확인 다이얼로그 */}
          {deleteDialogOpen && (
            <div className="admin-users-dialog-overlay" onClick={() => setDeleteDialogOpen(false)}>
              <div className="admin-users-dialog" onClick={(e) => e.stopPropagation()}>
                <h2 className="admin-users-dialog-title">사용자 삭제</h2>
                <div className="admin-users-dialog-content">
                  <div className="admin-users-dialog-warning">
                    <IconifyIcon icon="mdi:alert" width={24} height={24} />
                    <p>이 작업은 되돌릴 수 없습니다!</p>
                  </div>
                  <p className="admin-users-dialog-text">
                    <strong>{selectedUser?.email}</strong>
                    <br />
                    사용자를 완전히 삭제하시겠습니까?
                  </p>
                </div>
                <div className="admin-users-dialog-actions">
                  <button
                    className="admin-users-dialog-button admin-users-dialog-button-cancel"
                    onClick={() => setDeleteDialogOpen(false)}
                    disabled={updating}
                  >
                    취소
                  </button>
                  <button
                    className="admin-users-dialog-button admin-users-dialog-button-danger"
                    onClick={handleDelete}
                    disabled={updating}
                  >
                    {updating ? "삭제 중..." : "삭제"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
