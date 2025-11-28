import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useTicketStore } from "../stores/useTicketStore";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * 인증이 필요한 라우트를 보호하는 컴포넌트
 * 로그인하지 않은 사용자는 로그인 페이지로 리다이렉트
 */
export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user } = useTicketStore();
  const location = useLocation();

  if (!user) {
    // 로그인하지 않은 경우, 로그인 페이지로 이동
    // 현재 위치를 state로 전달하여 로그인 후 돌아올 수 있게 함
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

