import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthLayout from "../../components/Auth/AuthLayout";
import IconifyIcon from "../../components/Icon/IconifyIcon";
import "./SignupComplete.css";

export default function SignupComplete() {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    // 5초 후 자동으로 홈으로 이동
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate("/", { replace: true });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [navigate]);

  return (
    <AuthLayout title="가입 완료" subtitle="">
      <div className="signup-complete-container">
        {/* 성공 아이콘 */}
        <div className="signup-complete-icon-wrapper">
          <IconifyIcon icon="mdi:check-circle" width={64} height={64} className="signup-complete-icon" />
        </div>

        {/* 축하 메시지 */}
        <h1 className="signup-complete-title">
          환영합니다! <IconifyIcon icon="mdi:party-popper" width={24} height={24} style={{ verticalAlign: "middle", marginLeft: "4px" }} />
        </h1>

        <p className="signup-complete-message">
          AMPLIFY 회원가입이 완료되었습니다.
        </p>

        <p className="signup-complete-submessage">
          이제 특별한 공연을 예매할 수 있습니다.
        </p>

        {/* 액션 버튼들 */}
        <div className="signup-complete-buttons">
          <button
            className="signup-complete-button primary"
            onClick={() => navigate("/", { replace: true })}
          >
            홈으로 가기
          </button>

          <button
            className="signup-complete-button secondary"
            onClick={() => navigate("/shows", { replace: true })}
          >
            공연 둘러보기
          </button>
        </div>

        {/* 자동 이동 안내 */}
        <span className="signup-complete-countdown">
          {countdown}초 후 자동으로 홈으로 이동합니다
        </span>
      </div>
    </AuthLayout>
  );
}

