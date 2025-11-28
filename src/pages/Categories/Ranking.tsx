import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import IconifyIcon from "../../components/Icon/IconifyIcon";
import MainLayout from "../../components/Layout/MainLayout";
import showsData from "../../data/shows.json";
import { Show } from "../../types";
import { formatDate } from "../../utils/formatters";
import { TICKET_STATUS_CONFIG, CATEGORIES } from "../../utils/constants";
import { getRankingByPopularity } from "../../utils/ranking";
import "./Ranking.css";

export default function Ranking() {
  const navigate = useNavigate();
  const location = useLocation();
  const shows = showsData as unknown as Show[];
  const [selectedTab, setSelectedTab] = useState(6); // 랭킹은 인덱스 6

  // URL과 동기화
  React.useEffect(() => {
    const currentPath = location.pathname;
    const routes = [
      "/",
      "/categories/concert",
      "/categories/musical",
      "/categories/classical",
      "/categories/festival",
      "/categories/sports",
      "/categories/ranking",
    ];
    const index = routes.indexOf(currentPath);
    if (index !== -1) {
      setSelectedTab(index);
    }
  }, [location.pathname]);

  // 예정된 공연만
  const upcomingShows = shows.filter(
    (show) => new Date(show.dates[0]) > new Date()
  );

  // 인기도 기준 랭킹
  const rankingShows = getRankingByPopularity(upcomingShows, 20);

  // 카테고리 탭 클릭 핸들러
  const handleTabChange = (index: number) => {
    const routes = [
      "/",
      "/categories/concert",
      "/categories/musical",
      "/categories/classical",
      "/categories/festival",
      "/categories/sports",
      "/categories/ranking",
    ];
    navigate(routes[index]);
  };

  return (
    <MainLayout>
      {/* 카테고리 탭 */}
      <div className="ranking-tabs-container">
        <div className="ranking-tabs-wrapper">
          <ul className="ranking-tabs-list">
            {CATEGORIES.map((category, index) => (
              <li key={category.id}>
                <button
                  className={`ranking-tab ${selectedTab === index ? "active" : ""}`}
                  onClick={() => {
                    setSelectedTab(index);
                    handleTabChange(index);
                  }}
                >
                  {category.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Hero Section */}
      <div className="ranking-hero-section">
        <div className="ranking-hero-content">
          <div className="ranking-hero-header">
            <IconifyIcon icon="mdi:trending-up" width={48} height={48} />
            <h1 className="ranking-hero-title">랭킹</h1>
          </div>
          <p className="ranking-hero-subtitle">
            지금 가장 인기 있는 공연을 확인하세요
          </p>
        </div>
      </div>

      {/* 랭킹 리스트 */}
      <div className="ranking-main-content">
        <div className="ranking-header">
          <h2 className="ranking-title">인기 공연 TOP {rankingShows.length}</h2>
        </div>

        {/* 공연 카드 그리드 */}
        <div className="ranking-grid">
          {rankingShows.map((show, index) => {
            const statusConfig = TICKET_STATUS_CONFIG[show.ticketStatus];
            return (
              <div
                key={show.showId}
                className="ranking-card"
                onClick={() => navigate(`/shows/${show.showId}`)}
              >
                {/* 랭킹 배지 */}
                <div className={`ranking-badge ${index < 3 ? "top-three" : ""}`}>
                  {index + 1}
                </div>

                <div className="ranking-card-image-wrapper">
                  <img
                    src={show.posterUrl}
                    alt={show.tourName}
                    className="ranking-card-image"
                  />
                  <span
                    className="ranking-status-chip"
                    style={{ backgroundColor: statusConfig.color }}
                  >
                    {statusConfig.label}
                  </span>
                </div>
                <div className="ranking-card-content">
                  <h3 className="ranking-card-artist">{show.artist}</h3>
                  <p className="ranking-card-tourname">{show.tourName}</p>
                  <p className="ranking-card-date">{formatDate(show.dates[0])}</p>
                  <p className="ranking-card-city">{show.city}</p>
                </div>
              </div>
            );
          })}
        </div>

        {rankingShows.length === 0 && (
          <div className="ranking-empty-state">
            <p className="ranking-empty-text">랭킹 정보가 없습니다</p>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
