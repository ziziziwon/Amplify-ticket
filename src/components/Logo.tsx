import React from "react";
import { useNavigate } from "react-router-dom";
import "./Logo.css";

interface LogoProps {
  variant?: "solid" | "gradient";
  height?: number;
}

/**
 * AMPLIFY 브랜드 로고 컴포넌트
 * 
 * @param variant - "solid" (Mist Indigo) 또는 "gradient" (Mist Indigo → Slate Violet)
 * @param height - 로고 높이 (기본값: 28px)
 */
export default function Logo({ variant = "solid", height = 28 }: LogoProps) {
  const navigate = useNavigate();
  const logoSrc = variant === "gradient" ? "/logo-gradient.svg" : "/logo.svg";

  return (
    <div
      className={`logo-container ${variant}`}
      onClick={() => navigate("/")}
      style={{ height: `${height + 4}px` }}
    >
      <img 
        src={logoSrc} 
        alt="AMPLIFY - 소리를 키우다, 무대를 키우다" 
        style={{ 
          height: `${height}px`, 
          width: 'auto',
          display: 'block'
        }} 
      />
    </div>
  );
}
