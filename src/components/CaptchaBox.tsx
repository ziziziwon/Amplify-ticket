import React, { useState, useRef, useEffect } from "react";
import IconifyIcon from "./Icon/IconifyIcon";
import "./CaptchaBox.css";

interface CaptchaBoxProps {
  onSuccess: () => void;
}

export default function CaptchaBox({ onSuccess }: CaptchaBoxProps) {
  const [value, setValue] = useState("");
  const [code, setCode] = useState("");
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // 캡차 코드 생성 및 이미지 렌더링
  useEffect(() => {
    generateCaptcha();
  }, []);

  const generateCaptcha = () => {
    // 랜덤 코드 생성 (5자리 대문자 + 숫자)
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let newCode = "";
    for (let i = 0; i < 5; i++) {
      newCode += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCode(newCode);

    // Canvas에 휘어진 텍스트 그리기
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      canvas.width = 200;
      canvas.height = 60;

      // 배경
      ctx.fillStyle = "#f5f5f5";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 노이즈 라인
      ctx.strokeStyle = "#ddd";
      for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height);
        ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height);
        ctx.stroke();
      }

      // 텍스트 그리기 (각 글자마다 다른 각도로)
      ctx.font = "bold 32px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      for (let i = 0; i < newCode.length; i++) {
        const char = newCode[i];
        const x = 40 + i * 32;
        const y = 30;

        // 각 글자마다 랜덤 회전
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate((Math.random() - 0.5) * 0.4); // -20도 ~ +20도
        ctx.fillStyle = `hsl(${Math.random() * 60 + 200}, 70%, 40%)`; // 파란색 계열
        ctx.fillText(char, 0, 0);
        ctx.restore();
      }

      // 노이즈 점
      for (let i = 0; i < 30; i++) {
        ctx.fillStyle = `rgba(0, 0, 0, ${Math.random() * 0.3})`;
        ctx.fillRect(
          Math.random() * canvas.width,
          Math.random() * canvas.height,
          2,
          2
        );
      }
    }
  };

  const handleVerify = () => {
    if (value.toUpperCase() === code) {
      onSuccess();
    } else {
      alert("인증 문자가 일치하지 않습니다.");
      setValue("");
      generateCaptcha();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleVerify();
    }
  };

  return (
    <div className="captcha-box">
      <div className="captcha-header">
        <IconifyIcon icon="mdi:shield-check" width={32} height={32} />
        <h2 className="captcha-title">인증 문자 입력</h2>
        <p className="captcha-subtitle">
          아래에 표시된 문자를 정확히 입력해주세요
        </p>
      </div>

      <div className="captcha-content">
        <div className="captcha-image-wrapper">
          <canvas ref={canvasRef} className="captcha-canvas" />
          <button
            className="captcha-refresh"
            onClick={generateCaptcha}
            title="새로고침"
          >
            <IconifyIcon icon="mdi:refresh" width={20} height={20} />
          </button>
        </div>

        <div className="captcha-input-wrapper">
          <input
            type="text"
            className="captcha-input"
            value={value}
            onChange={(e) => setValue(e.target.value.toUpperCase())}
            onKeyPress={handleKeyPress}
            placeholder="위의 문자를 입력하세요"
            maxLength={5}
            autoFocus
          />
          <button className="captcha-verify-button" onClick={handleVerify}>
            확인
          </button>
        </div>
      </div>
    </div>
  );
}
