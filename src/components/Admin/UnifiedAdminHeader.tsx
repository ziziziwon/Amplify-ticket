import React from "react";
import "./UnifiedAdminHeader.css";

interface UnifiedAdminHeaderProps {
  title: string;
  subtitle: string;
  actionButton?: {
    label: string;
    icon?: React.ReactNode;
    onClick: () => void;
  };
}

/**
 * 통일된 관리자 페이지 헤더 컴포넌트
 * 모든 Admin 페이지에서 일관된 디자인을 사용하기 위한 공통 컴포넌트
 */
export default function UnifiedAdminHeader({
  title,
  subtitle,
  actionButton,
}: UnifiedAdminHeaderProps) {
  return (
    <div className="unified-admin-header">
      <div className="unified-admin-header-left">
        <h1 className="unified-admin-header-title">{title}</h1>
        <p className="unified-admin-header-subtitle">{subtitle}</p>
      </div>
      {actionButton && (
        <button
          className="unified-admin-header-button"
          onClick={actionButton.onClick}
        >
          {actionButton.icon}
          {actionButton.label}
        </button>
      )}
    </div>
  );
}

