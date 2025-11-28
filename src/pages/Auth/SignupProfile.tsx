import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AuthLayout from "../../components/Auth/AuthLayout";
import { validateNickname, validatePhone, validateBirthYear } from "../../utils/validation";
import { useTicketStore } from "../../stores/useTicketStore";
import "./SignupProfile.css";

export default function SignupProfile() {
  const navigate = useNavigate();
  const { setUser } = useTicketStore();

  const [nickname, setNickname] = useState("");
  const [phone, setPhone] = useState("");
  const [birthYear, setBirthYear] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Auth 세션 재확인 및 로그인 유지 (페이지 로드 시 1회만 실행)
  useEffect(() => {
    const ensureAuth = async () => {
      // localStorage에서 값 가져오기 (useEffect 내부에서 직접)
      const savedUid = localStorage.getItem("signup_uid");
      const savedEmail = localStorage.getItem("signup_email");
      const savedPassword = localStorage.getItem("signup_password");
      
      if (!savedUid || !savedEmail) {
        console.log("❌ uid 또는 email이 없습니다. 회원가입 처음으로 이동");
        navigate("/signup", { replace: true });
        return;
      }

      // 비밀번호를 가져와서 재로그인 (Firestore 권한 확보용)
      if (savedPassword) {
        try {
          console.log("🔐 3단계: Auth 세션 재확인 중...");
          const { signInWithEmailAndPassword } = await import("firebase/auth");
          const { auth } = await import("../../firebase");
          
          await signInWithEmailAndPassword(auth, savedEmail, savedPassword);
          console.log("✅ Auth 세션 확인 완료! Firestore 접근 가능");
        } catch (error) {
          console.log("⚠️ 재로그인 실패, 하지만 계속 진행:", error);
        }
      }
    };

    ensureAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 페이지 로드 시 1회만 실행

  // 닉네임 검증
  const nicknameValidation = validateNickname(nickname);
  const isValid = nicknameValidation.isValid;

  // 생년 옵션 생성 (현재년도 - 100 ~ 현재년도)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 100 }, (_, i) => currentYear - i);

  const handleSignup = async () => {
    if (!isValid) {
      setError("닉네임을 확인해주세요.");
      return;
    }
    
    // localStorage에서 uid와 email 가져오기
    const uid = localStorage.getItem("signup_uid");
    const email = localStorage.getItem("signup_email");
    
    if (!uid || !email) {
      setError("사용자 정보를 찾을 수 없습니다. 처음부터 다시 시도해주세요.");
      return;
    }

    // 전화번호 검증 (선택)
    if (phone && !validatePhone(phone)) {
      setError("올바른 휴대폰 번호를 입력해주세요. (예: 010-1234-5678)");
      return;
    }

    // 생년 검증 (선택)
    const birthYearNum = birthYear ? parseInt(birthYear) : null;
    if (birthYearNum && !validateBirthYear(birthYearNum)) {
      setError("올바른 생년을 선택해주세요.");
      return;
    }

    try {
      setLoading(true);
      
      console.log("🔥 3단계: Firestore에 사용자 문서 생성 시작");
      console.log("uid:", uid);
      console.log("email:", email);

      // Firestore에 사용자 문서 생성 (처음 생성)
      const { doc, setDoc, serverTimestamp } = await import("firebase/firestore");
      const { db } = await import("../../firebase");
      
      const userDocRef = doc(db, "users", uid);
      const userData = {
        email: email,
        nickname: nickname,
        phone: phone || null,
        birthYear: birthYearNum,
        provider: "email",
        ticketCount: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      
      console.log("📝 Firestore에 저장할 데이터:", userData);
      
      await setDoc(userDocRef, userData);
      
      console.log("✅ Firestore 사용자 문서 생성 완료!");

      // Zustand 스토어에 사용자 정보 저장
      setUser({
        uid: uid,
        email: email,
        displayName: nickname,
      });
      
      // localStorage 정리
      localStorage.removeItem("signup_uid");
      localStorage.removeItem("signup_email");
      localStorage.removeItem("signup_password");
      
      console.log("✅ 회원가입 전체 플로우 완료!");

      // 완료 페이지로 이동
      navigate("/signup/complete", { replace: true });
    } catch (error: any) {
      console.error("❌ Firestore 저장 실패:", error);
      console.error("에러 코드:", error.code);
      console.error("에러 메시지:", error.message);
      
      if (error.code === "permission-denied") {
        setError("Firestore 권한이 거부되었습니다. Firebase Console에서 보안 규칙을 확인해주세요.");
      } else {
        setError(error.message || "프로필 저장에 실패했습니다.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="프로필 설정"
      subtitle="거의 다 왔어요! 프로필을 입력해주세요"
      showBackButton
    >
      <div className="signup-profile-form">
        {/* 단계 표시 */}
        <div className="signup-profile-step">3/3 단계</div>

        {error && (
          <div className="signup-profile-error">{error}</div>
        )}

        {/* 닉네임 (필수) */}
        <div className="signup-profile-input-group">
          <label className="signup-profile-input-label">닉네임</label>
          <input
            type="text"
            className={`signup-profile-input ${nickname.length > 0 && !nicknameValidation.isValid ? "error" : ""}`}
            placeholder="2-10자 이내"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            autoFocus
            required
          />
          <div className={`signup-profile-helper ${nickname.length > 0 && !nicknameValidation.isValid ? "error" : ""}`}>
            {nickname.length > 0 && !nicknameValidation.isValid
              ? nicknameValidation.error
              : "티켓 예매 시 사용되는 이름입니다"}
          </div>
        </div>

        {/* 생년 (선택) */}
        <div className="signup-profile-input-group">
          <label className="signup-profile-input-label">생년 (선택)</label>
          <select
            className="signup-profile-select"
            value={birthYear}
            onChange={(e) => setBirthYear(e.target.value)}
          >
            <option value="">선택 안 함</option>
            {years.map((year) => (
              <option key={year} value={year}>
                {year}년
              </option>
            ))}
          </select>
          <div className="signup-profile-helper">선예매 및 나이 인증 시 사용됩니다</div>
        </div>

        {/* 휴대폰 번호 (선택) */}
        <div className="signup-profile-input-group">
          <label className="signup-profile-input-label">휴대폰 번호 (선택)</label>
          <input
            type="tel"
            className="signup-profile-input"
            placeholder="010-1234-5678"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <div className="signup-profile-helper">티켓 예매 정보를 받을 수 있습니다</div>
        </div>

        {/* 회원가입 완료 버튼 */}
        <button
          className="signup-profile-button"
          onClick={handleSignup}
          disabled={!isValid || loading}
        >
          {loading ? "처리 중..." : "회원가입 완료"}
        </button>

        {/* 개인정보 안내 */}
        <div className="signup-profile-privacy">
          <p className="signup-profile-privacy-text">
            회원가입 시 AMPLIFY의{" "}
            <a className="signup-profile-privacy-link">이용약관</a>
            {" "}및{" "}
            <a className="signup-profile-privacy-link">개인정보처리방침</a>
            에 동의하게 됩니다.
          </p>
        </div>
      </div>
    </AuthLayout>
  );
}

