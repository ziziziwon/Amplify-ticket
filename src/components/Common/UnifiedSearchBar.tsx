import React from "react";
import IconifyIcon from "../Icon/IconifyIcon";
import "./UnifiedSearchBar.css";

interface UnifiedSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onSearch?: (value: string) => void;
  size?: "small" | "medium";
  fullWidth?: boolean;
}

/**
 * 통일된 검색창 컴포넌트
 * 모든 페이지에서 일관된 검색창 디자인과 동작을 제공
 */
export default function UnifiedSearchBar({
  value,
  onChange,
  placeholder = "검색...",
  onSearch,
  size = "medium",
  fullWidth = true,
}: UnifiedSearchBarProps) {
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && onSearch) {
      onSearch(value);
    }
  };

  return (
    <div className={`unified-search-bar ${size === "small" ? "small" : ""}`} style={{ width: fullWidth ? "100%" : "auto" }}>
      <IconifyIcon icon="mdi:magnify" width={20} height={20} className="unified-search-bar-icon" />
      <input
        type="text"
        className="unified-search-bar-input"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyPress={handleKeyPress}
      />
    </div>
  );
}

