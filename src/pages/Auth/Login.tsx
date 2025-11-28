import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import AuthLayout from "../../components/Auth/AuthLayout";
import SocialButtons from "../../components/Auth/SocialButtons";
import IconifyIcon from "../../components/Icon/IconifyIcon";
import { signInWithEmail } from "../../utils/auth";
import { validateEmail } from "../../utils/validation";
import { useTicketStore } from "../../stores/useTicketStore";
import "./Login.css";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setUser } = useTicketStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // 이전 페이지 URL 가져오기
  const from = (location.state as any)?.from?.pathname || "/";

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // 유효성 검사
    if (!validateEmail(email)) {
      setError("올바른 이메일 주소를 입력해주세요.");
      return;
    }

    if (!password) {
      setError("비밀번호를 입력해주세요.");
      return;
    }

    try {
      setLoading(true);
      const user = await signInWithEmail(email, password);
      
      // Zustand 스토어에 사용자 정보 저장
      setUser({
        uid: user.uid,
        email: user.email || "",
        displayName: user.displayName || "",
      });

      // 이전 페이지 또는 홈으로 이동
      navigate(from, { replace: true });
    } catch (error: any) {
      setError(error.message || "로그인에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleSocialSuccess = () => {
    navigate(from, { replace: true });
  };

  return (
    <AuthLayout title="로그인" subtitle="AMPLIFY에 오신 것을 환영합니다">
      <form className="login-form" onSubmit={handleLogin}>
        {/* 에러 메시지 */}
        {error && (
          <div className="login-error">{error}</div>
        )}

        {/* 이메일 입력 */}
        <div className="login-input-group">
          <label className="login-input-label">이메일</label>
          <div className="login-input-wrapper">
            <input
              type="email"
              className="login-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              placeholder="이메일을 입력하세요"
            />
          </div>
        </div>

        {/* 비밀번호 입력 */}
        <div className="login-input-group">
          <label className="login-input-label">비밀번호</label>
          <div className="login-input-wrapper">
            <input
              type={showPassword ? "text" : "password"}
              className="login-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              placeholder="비밀번호를 입력하세요"
            />
            <button
              type="button"
              className="login-input-icon"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <IconifyIcon icon="mdi:eye-off" width={20} height={20} />
              ) : (
                <IconifyIcon icon="mdi:eye" width={20} height={20} />
              )}
            </button>
          </div>
        </div>

        {/* 로그인 버튼 */}
        <button
          type="submit"
          className="login-button"
          disabled={loading}
        >
          {loading ? "로그인 중..." : "로그인"}
        </button>

        {/* 소셜 로그인 */}
        <SocialButtons mode="login" onSuccess={handleSocialSuccess} />

        {/* 회원가입 링크 */}
        <div className="login-signup-link">
          아직 계정이 없으신가요?{" "}
          <a onClick={() => navigate("/signup")}>
            회원가입
          </a>
        </div>
      </form>
    </AuthLayout>
  );
}

