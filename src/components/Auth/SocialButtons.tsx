import React from "react";
import { signInWithGoogle } from "../../utils/auth";
import { useNavigate } from "react-router-dom";
import IconifyIcon from "../Icon/IconifyIcon";
import "./SocialButtons.css";

interface SocialButtonsProps {
  mode?: "login" | "signup";
  onSuccess?: () => void;
}

/**
 * 소셜 로그인 버튼 컴포넌트
 * - Google 로그인
 * - 향후 Kakao 추가 가능
 */
export default function SocialButtons({ mode = "login", onSuccess }: SocialButtonsProps) {
  const navigate = useNavigate();
  const [loading, setLoading] = React.useState(false);

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      await signInWithGoogle();
      
      if (onSuccess) {
        onSuccess();
      } else {
        navigate("/");
      }
    } catch (error: any) {
      alert(error.message || "Google 로그인에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* 구분선 */}
      <div className="social-buttons-divider">
        <span className="social-buttons-divider-text">또는</span>
      </div>

      {/* Google 로그인 */}
      <button
        className="social-button"
        onClick={handleGoogleLogin}
        disabled={loading}
      >
        <IconifyIcon icon="mdi:google" width={20} height={20} className="social-button-icon" />
        {mode === "login" ? "Google로 로그인" : "Google로 시작하기"}
      </button>
    </div>
  );
}

