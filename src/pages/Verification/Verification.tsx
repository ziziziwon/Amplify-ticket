import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import MainLayout from "../../components/Layout/MainLayout";
import "./Verification.css";

export default function Verification() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const showId = searchParams.get("showId");
  const date = searchParams.get("date");

  const [captchaInput, setCaptchaInput] = useState("");
  const [presaleCode, setPresaleCode] = useState("");
  const [error, setError] = useState("");

  const captchaText = "TICKET2025";

  const handleVerify = () => {
    setError("");

    if (captchaInput.toUpperCase() !== captchaText) {
      setError("보안문자가 일치하지 않습니다.");
      return;
    }

    if (!presaleCode) {
      setError("선예매 코드를 입력해주세요.");
      return;
    }

    if (presaleCode.length < 8) {
      setError("올바른 선예매 코드를 입력해주세요.");
      return;
    }

    alert("인증이 완료되었습니다!");
    navigate(`/seats?showId=${showId}&date=${date}`);
  };

  return (
    <MainLayout>
      <div className="verification-container">
        <div className="verification-card">
          <h1 className="verification-title">인증 예매</h1>
          <p className="verification-subtitle">선예매 진행을 위해 인증이 필요합니다</p>

          {error && (
            <div className="verification-alert verification-alert-error">
              {error}
            </div>
          )}

          {/* CAPTCHA */}
          <div className="verification-section">
            <label className="verification-label">보안문자 입력</label>
            <div className="verification-captcha-box">
              <span className="verification-captcha-text">{captchaText}</span>
            </div>
            <input
              type="text"
              className="verification-input"
              placeholder="위의 문자를 입력하세요"
              value={captchaInput}
              onChange={(e) => setCaptchaInput(e.target.value)}
            />
          </div>

          {/* 선예매 코드 */}
          <div className="verification-section">
            <label className="verification-label">선예매 코드</label>
            <input
              type="text"
              className="verification-input"
              placeholder="선예매 코드를 입력하세요 (예: FC123456)"
              value={presaleCode}
              onChange={(e) => setPresaleCode(e.target.value)}
            />
            <p className="verification-helper-text">
              * 팬클럽 또는 공식 선예매 코드를 입력하세요
            </p>
          </div>

          {/* 버튼 */}
          <div className="verification-actions">
            <button className="verification-button verification-button-cancel" onClick={() => navigate(-1)}>
              취소
            </button>
            <button className="verification-button verification-button-submit" onClick={handleVerify}>
              인증하기
            </button>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
