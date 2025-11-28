import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTicketStore } from "../../stores/useTicketStore";
import Logo from "../Logo";
import UserMenu from "../UserMenu";
import IconifyIcon from "../Icon/IconifyIcon";
import "./Header.css";

export default function Header() {
  const navigate = useNavigate();
  const { basket } = useTicketStore();
  const [searchText, setSearchText] = useState("");

  return (
    <div className="header-wrapper">
      {/*  Top Banner */}
      <div className="header-banner" onClick={() => navigate("/events")}>
        <div className="header-banner-container">
          <div className="header-banner-content">
            <IconifyIcon icon="mdi:fire" className="header-banner-icon" width={16} height={16} />
            <span className="header-banner-text">2025 봄 페스티벌 얼리버드 예매 오픈!</span>
            <span className="header-banner-date">~2/28</span>
          </div>
        </div>
      </div>

      {/* 🎯 Main Header */}
      <div className="header-main">
        <div className="header-main-container">
          {/* 로고 */}
          <div className="header-logo" onClick={() => navigate("/")}>
            <Logo variant="solid" height={28} />
          </div>

          {/* 대형 검색바 - 중앙 */}
          <div className="header-search">
            <div className="header-search-input-wrapper">
              <input
                type="text"
                className="header-search-input"
                placeholder="공연, 아티스트 검색"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter" && searchText.trim()) {
                    navigate(`/shows?search=${encodeURIComponent(searchText.trim())}`);
                  }
                }}
              />
              <IconifyIcon icon="mdi:magnify" className="header-search-icon" width={20} height={20} />
            </div>
          </div>

          {/* Spacer */}
          <div className="header-spacer" />

          {/* 우측 유틸 메뉴 */}
          <div className="header-menu">
            {/* 이벤트 */}
            <button
              className="header-menu-button"
              onClick={() => navigate("/events")}
            >
              이벤트
            </button>

            {/* 고객센터 */}
            <button
              className="header-menu-button"
              onClick={() => navigate("/support")}
            >
              고객센터
            </button>

            {/* 공지사항 */}
            <button
              className="header-menu-button"
              onClick={() => navigate("/notice")}
            >
              공지사항
            </button>

            {/* 구분선 */}
            <div className="header-menu-divider" />

            {/* 장바구니 */}
            <button
              className="header-cart-button"
              onClick={() => navigate("/basket")}
            >
              <IconifyIcon icon="mdi:cart" className="header-cart-icon" width={20} height={20} />
              {basket.length > 0 && (
                <span className="header-cart-badge">{basket.length}</span>
              )}
            </button>

            {/* 사용자 메뉴 */}
            <UserMenu />
          </div>
        </div>
      </div>
    </div>
  );
}

