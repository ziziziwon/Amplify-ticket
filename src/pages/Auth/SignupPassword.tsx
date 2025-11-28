import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import AuthLayout from "../../components/Auth/AuthLayout";
import IconifyIcon from "../../components/Icon/IconifyIcon";
import { validatePassword, validatePasswordConfirm } from "../../utils/validation";
import "./SignupPassword.css";

export default function SignupPassword() {
  const navigate = useNavigate();
  const location = useLocation();
  const email = (location.state as any)?.email;

  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // 이메일이 없으면 첫 단계로 리다이렉트
  useEffect(() => {
    if (!email) {
      navigate("/signup", { replace: true });
    }
  }, [email, navigate]);

  // 비밀번호 검증 결과
  const passwordValidation = validatePassword(password);
  const isPasswordMatch = validatePasswordConfirm(password, passwordConfirm);

  // 전체 유효성
  const isValid = passwordValidation.isValid && isPasswordMatch;

  const handleNext = async () => {
    if (!isValid) return;
    
    setError("");
    setLoading(true);

    try {
      console.log("🔥 2단계: Auth 계정만 생성 시작");
      
      // ⚠️ Auth 계정만 생성 (Firestore는 3단계에서!)
      const { createUserWithEmailAndPassword } = await import("firebase/auth");
      const { auth } = await import("../../firebase");
      
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      console.log("✅ Auth 계정 생성 완료:", userCredential.user.uid);
      console.log("⚠️ Firestore는 3단계에서 저장됩니다");
      
      // uid와 email을 localStorage에 임시 저장 (프로필 단계에서 사용)
      localStorage.setItem("signup_uid", userCredential.user.uid);
      localStorage.setItem("signup_email", email);
      localStorage.setItem("signup_password", password); // 3단계에서 필요
      
      // 다음 단계로 이동
      navigate("/signup/profile", { replace: false });
      
    } catch (error: any) {
      console.error("❌ Auth 계정 생성 실패:", error);
      
      if (error.code === "auth/email-already-in-use") {
        setError("이미 사용 중인 이메일입니다.");
      } else if (error.code === "auth/weak-password") {
        setError("비밀번호가 너무 약합니다.");
      } else {
        setError(error.message || "계정 생성 중 오류가 발생했습니다.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="비밀번호 설정"
      subtitle="안전한 비밀번호를 만들어주세요"
      showBackButton
    >
      <div className="signup-password-form">
        {/* 단계 표시 */}
        <div className="signup-password-step">2/3 단계</div>

        {/* 이메일 표시 */}
        <div style={{ marginBottom: "24px", padding: "16px", backgroundColor: "#F5F5F5", borderRadius: "6px" }}>
          <div style={{ color: "#707070", fontSize: "13px", fontFamily: "SUIT, LINE Seed KR, Pretendard, sans-serif" }}>
            가입 이메일: <strong style={{ color: "#232323" }}>{email}</strong>
          </div>
        </div>

        {error && (
          <div className="signup-password-error">{error}</div>
        )}

        {/* 비밀번호 입력 */}
        <div className="signup-password-input-group">
          <label className="signup-password-input-label">비밀번호</label>
          <div className="signup-password-input-wrapper">
            <input
              type={showPassword ? "text" : "password"}
              className="signup-password-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              autoFocus
              placeholder="비밀번호를 입력하세요"
            />
            <button
              type="button"
              className="signup-password-input-icon"
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

        {/* 비밀번호 확인 */}
        <div className="signup-password-input-group">
          <label className="signup-password-input-label">비밀번호 확인</label>
          <div className="signup-password-input-wrapper">
            <input
              type={showPasswordConfirm ? "text" : "password"}
              className="signup-password-input"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              autoComplete="new-password"
              placeholder="비밀번호를 다시 입력하세요"
            />
            <button
              type="button"
              className="signup-password-input-icon"
              onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
            >
              {showPasswordConfirm ? (
                <IconifyIcon icon="mdi:eye-off" width={20} height={20} />
              ) : (
                <IconifyIcon icon="mdi:eye" width={20} height={20} />
              )}
            </button>
          </div>
        </div>

        {/* 비밀번호 조건 체크리스트 */}
        <div className="signup-password-requirements">
          <div className="signup-password-requirements-title">비밀번호 조건</div>
          <ul className="signup-password-requirements-list">
            {[
              { label: "8자 이상", checked: password.length >= 8 },
              { label: "영문 포함", checked: /[a-zA-Z]/.test(password) },
              { label: "숫자 포함", checked: /[0-9]/.test(password) },
              { label: "비밀번호 일치", checked: isPasswordMatch },
            ].map((item, index) => (
              <li key={index} className={`signup-password-requirement-item ${item.checked ? "valid" : "invalid"}`}>
                <span className="signup-password-requirement-icon">
                  {item.checked ? (
                    <IconifyIcon icon="mdi:check-circle" width={16} height={16} />
                  ) : (
                    <IconifyIcon icon="mdi:circle-outline" width={16} height={16} />
                  )}
                </span>
                <span>{item.label}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* 다음 버튼 */}
        <button
          className="signup-password-button"
          onClick={handleNext}
          disabled={!isValid || loading}
        >
          {loading ? "처리 중..." : "다음"}
        </button>
      </div>
    </AuthLayout>
  );
}

