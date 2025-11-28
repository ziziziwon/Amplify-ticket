import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthLayout from "../../components/Auth/AuthLayout";
import SocialButtons from "../../components/Auth/SocialButtons";
import { validateEmail } from "../../utils/validation";
import { checkEmailDuplicate } from "../../utils/auth";
import "./SignupEmail.css";

export default function SignupEmail() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleNext = async () => {
    setError("");

    // 이메일 형식 검증
    if (!validateEmail(email)) {
      setError("올바른 이메일 주소를 입력해주세요.");
      return;
    }

    try {
      setLoading(true);
      
      // 이메일 중복 확인
      const isDuplicate = await checkEmailDuplicate(email);
      
      if (isDuplicate) {
        setError("이미 사용 중인 이메일입니다. 로그인해주세요.");
        return;
      }

      // 다음 단계로 이동 (이메일을 state로 전달)
      navigate("/signup/password", { state: { email } });
    } catch (error: any) {
      setError(error.message || "이메일 확인 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const isValid = validateEmail(email);

  return (
    <AuthLayout
      title="회원가입"
      subtitle="AMPLIFY와 함께 특별한 공연을 경험하세요"
      showBackButton
    >
      <div className="signup-email-form">
        {/* 에러 메시지 */}
        {error && (
          <div className="signup-email-error">{error}</div>
        )}

        {/* 단계 표시 */}
        <div className="signup-email-step">1/3 단계</div>

        {/* 이메일 입력 */}
        <div className="signup-email-input-group">
          <label className="signup-email-input-label">이메일</label>
          <input
            type="email"
            className="signup-email-input"
            placeholder="example@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter" && isValid && !loading) {
                handleNext();
              }
            }}
            autoComplete="email"
            autoFocus
          />
          <div className="signup-email-helper">이메일 주소로 로그인하게 됩니다</div>
        </div>

        {/* 다음 버튼 */}
        <button
          className="signup-email-button"
          onClick={handleNext}
          disabled={!isValid || loading}
        >
          {loading ? "처리 중..." : "다음"}
        </button>

        {/* 소셜 회원가입 */}
        <SocialButtons mode="signup" onSuccess={() => navigate("/")} />

        {/* 로그인 링크 */}
        <div className="signup-email-link">
          이미 계정이 있으신가요?{" "}
          <a onClick={() => navigate("/login")}>
            로그인
          </a>
        </div>
      </div>
    </AuthLayout>
  );
}

