import React from "react";
import { useNavigate } from "react-router-dom";
import Logo from "../Logo";
import IconifyIcon from "../Icon/IconifyIcon";
import "./AuthLayout.css";

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  showBackButton?: boolean;
}

/**
 * 인증 페이지 공통 레이아웃
 * - AMPLIFY 브랜드 스타일 적용
 * - 중앙 정렬 폼
 * - 로고 상단 고정
 */
export default function AuthLayout({
  children,
  title,
  subtitle,
  showBackButton = false,
}: AuthLayoutProps) {
  const navigate = useNavigate();

  return (
    <div className="auth-layout">
      {/* 로고 */}
      <div className="auth-layout-logo">
        <Logo variant="solid" height={32} />
      </div>

      {/* 메인 폼 */}
      <div className="auth-layout-main">
        <div className="auth-layout-paper">
          {/* 뒤로가기 버튼 */}
          {showBackButton && (
            <div className="auth-layout-back">
              <button className="auth-layout-back-button" onClick={() => navigate(-1)}>
                <IconifyIcon icon="mdi:arrow-left" width={16} height={16} />
                뒤로가기
              </button>
            </div>
          )}

          {/* 제목 */}
          <h1 className="auth-layout-title">{title}</h1>

          {/* 부제목 */}
          {subtitle && (
            <p className="auth-layout-subtitle">{subtitle}</p>
          )}

          {/* 폼 컨텐츠 */}
          {children}
        </div>
      </div>

      {/* 푸터 */}
      <div className="auth-layout-footer">
        <p className="auth-layout-footer-text">© 2025 AMPLIFY. All rights reserved.</p>
      </div>
    </div>
  );
}

