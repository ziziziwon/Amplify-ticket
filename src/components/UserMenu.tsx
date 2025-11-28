import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTicketStore } from "../stores/useTicketStore";
import { signOut } from "../utils/auth";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import IconifyIcon from "./Icon/IconifyIcon";
import "./UserMenu.css";

/**
 * 사용자 메뉴 컴포넌트
 * - 로그인한 경우: 마이페이지, 로그아웃 메뉴 표시
 * - 로그인하지 않은 경우: 로그인 버튼
 */
export default function UserMenu() {
  const navigate = useNavigate();
  const { user, setUser } = useTicketStore();
  const [isOpen, setIsOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // 관리자 권한 확인
  useEffect(() => {
    const checkAdminRole = async () => {
      if (!user) {
        setIsAdmin(false);
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const role = userData.role || "user";
          setIsAdmin(role === "admin");
        }
      } catch (error) {
        console.error("관리자 권한 확인 실패:", error);
        setIsAdmin(false);
      }
    };

    checkAdminRole();
  }, [user]);

  // 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleClick = () => {
    if (user) {
      setIsOpen(!isOpen);
    } else {
      navigate("/login");
    }
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleMyTickets = () => {
    handleClose();
    navigate("/tickets");
  };

  const handleMyEvents = () => {
    handleClose();
    navigate("/my-events");
  };

  const handleAdmin = () => {
    handleClose();
    navigate("/admin/dashboard");
  };

  const handleLogout = async () => {
    try {
      await signOut();
      setUser(null);
      handleClose();
      navigate("/");
    } catch (error: any) {
      alert(error.message || "로그아웃에 실패했습니다.");
    }
  };

  return (
    <div className="user-menu-wrapper" ref={menuRef}>
      <button
        className={`user-menu-button ${user ? "logged-in" : ""}`}
        onClick={handleClick}
      >
        <IconifyIcon icon="mdi:account" className="user-menu-icon" width={24} height={24} />
        {user && (
          <span className={`user-status-dot ${isAdmin ? "admin" : "user"}`}></span>
        )}
      </button>

      {user && isOpen && (
        <div className="user-menu-dropdown">
          {/* 사용자 정보 */}
          <div className="user-menu-user-info">
            <div className="user-menu-user-header">
              <span className="user-menu-user-name">{user.displayName}</span>
              {isAdmin && (
                <span className="user-menu-admin-badge">관리자</span>
              )}
            </div>
            <div className="user-menu-user-email">{user.email}</div>
          </div>

          <hr className="user-menu-divider" />

          {/* 내 티켓 */}
          <button className="user-menu-item" onClick={handleMyTickets}>
            <IconifyIcon icon="mdi:ticket-confirmation" className="user-menu-item-icon" width={20} height={20} />
            <span className="user-menu-item-text">내 티켓</span>
          </button>

          {/* 참여한 이벤트 */}
          <button className="user-menu-item" onClick={handleMyEvents}>
            <IconifyIcon icon="mdi:trophy" className="user-menu-item-icon" width={20} height={20} />
            <span className="user-menu-item-text">참여한 이벤트</span>
          </button>

          {/* 관리자 메뉴 - admin만 표시 */}
          {isAdmin && (
            <button className="user-menu-item admin-item" onClick={handleAdmin}>
              <IconifyIcon icon="mdi:shield-crown" className="user-menu-item-icon" width={20} height={20} />
              <span className="user-menu-item-text">관리자</span>
            </button>
          )}

          <hr className="user-menu-divider" />

          {/* 로그아웃 */}
          <button className="user-menu-item logout-item" onClick={handleLogout}>
            <IconifyIcon icon="mdi:logout" className="user-menu-item-icon" width={20} height={20} />
            <span className="user-menu-item-text">로그아웃</span>
          </button>
        </div>
      )}
    </div>
  );
}

