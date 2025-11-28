import React, { useEffect, useState } from "react";
import { Navigate, Link } from "react-router-dom";
import { useTicketStore } from "../stores/useTicketStore";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import "./AdminRoute.css";

interface AdminRouteProps {
  children: React.ReactNode;
}

/**
 * 관리자 전용 라우트 보호 컴포넌트
 * - 로그인 확인
 * - Firestore에서 user.role === "admin" 확인
 * - 관리자가 아니면 홈으로 리다이렉트
 */
export default function AdminRoute({ children }: AdminRouteProps) {
  const { user } = useTicketStore();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdminRole = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const role = userData.role || "user";
          
          console.log(`🔐 관리자 권한 체크: ${user.email} → role: ${role}`);
          
          if (role === "admin") {
            setIsAdmin(true);
          } else {
            setIsAdmin(false);
          }
        } else {
          setIsAdmin(false);
        }
      } catch (error) {
        console.error("❌ 관리자 권한 확인 실패:", error);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    checkAdminRole();
  }, [user]);

  if (loading) {
    return (
      <div className="admin-route-loading">
        <div className="spinner"></div>
        <p className="admin-route-loading-text">권한 확인 중...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
    return (
      <div className="admin-route-denied">
        <h2 className="admin-route-denied-title">접근 권한이 없습니다</h2>
        <p className="admin-route-denied-text">관리자 전용 페이지입니다.</p>
        <Link to="/" className="admin-route-home-link">홈으로 이동</Link>
      </div>
    );
  }

  return <>{children}</>;
}
