import React, { useState, useMemo, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import MainLayout from "../../components/Layout/MainLayout";
import IconifyIcon from "../../components/Icon/IconifyIcon";
import { TICKET_STATUS_CONFIG } from "../../utils/constants";
import { formatDate, formatPrice } from "../../utils/formatters";
import { useShowsByCategory } from "../../hooks/useShows";
import "./ShowList.css";

export default function ShowList() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // ⭐ 멜론 티켓 실시간 데이터 사용
  const categoryFromParams = searchParams.get("category") || "concert";
  const searchFromParams = searchParams.get("search") || "";
  const { shows, loading, error } = useShowsByCategory(categoryFromParams, "latest");
  
  // 검색 필터만 유지
  const [searchText, setSearchText] = useState(searchFromParams);

  // URL 파라미터가 변경될 때 검색어 동기화
  useEffect(() => {
    setSearchText(searchFromParams);
  }, [searchFromParams]);

  // ⭐ 검색만 지원 (간단한 필터링)
  const filteredShows = useMemo(() => {
    const query = searchText.toLowerCase().trim();
    if (!query) return shows;
    
    return shows.filter(
      (show: any) =>
        show.artist?.toLowerCase().includes(query) ||
        show.tourName?.toLowerCase().includes(query) ||
        show.title?.toLowerCase().includes(query) ||
        show.venueName?.toLowerCase().includes(query) ||
        show.city?.toLowerCase().includes(query)
    );
  }, [shows, searchText]);

  return (
    <MainLayout>
      <div className="show-list-container">
        {/* 헤더 */}
        <div className="show-list-header">
          <h1 className="show-list-title">공연 목록</h1>
          <p className="show-list-subtitle">실시간 공연 정보를 확인하세요</p>
        </div>

        {/* 검색 섹션 */}
        <div className="show-list-search-section">
          <div className="show-list-search-header">
            <h2 className="show-list-search-title">
              <IconifyIcon icon="mdi:music" width={20} height={20} style={{ marginRight: "8px", verticalAlign: "middle" }} />
              전체 공연
            </h2>
            <div className="show-list-count">
              총 <strong>{filteredShows.length}</strong>개 공연
            </div>
          </div>
          
          <div className="show-list-search-wrapper">
            <input
              type="text"
              className="show-list-search-input"
              placeholder="아티스트, 공연명 검색..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
            <IconifyIcon icon="mdi:magnify" width={20} height={20} className="show-list-search-icon" />
          </div>
        </div>
      
        {/* 로딩 상태 */}
        {loading && (
          <div className="show-list-loading">
            <div className="show-list-loading-spinner"></div>
          </div>
        )}

        {/* 에러 상태 */}
        {error && (
          <div className="show-list-error">
            <div className="show-list-error-title">데이터를 불러오는데 실패했습니다</div>
            <div className="show-list-error-message">{error.message}</div>
          </div>
        )}

        {/* 공연 리스트 */}
        {!loading && !error && (
          <div className="show-list-grid">
            {filteredShows.map((show: any) => {
              const statusConfig = TICKET_STATUS_CONFIG[show.ticketStatus as keyof typeof TICKET_STATUS_CONFIG] || TICKET_STATUS_CONFIG.onsale;
              const minPrice = show.priceTable ? Math.min(...(Object.values(show.priceTable) as number[])) : 0;

              return (
                <div
                  key={show.showId}
                  className="show-list-card"
                  onClick={() => navigate(`/shows/${show.showId}`, {
                    state: {
                      venueName: show.venueName || show.city,
                      address: (show as any).address || (show as any).venueAddress,
                      runningTime: show.runningTime,
                      priceInfo: show.priceTable,
                    }
                  })}
                >
                  {/* 포스터 */}
                  <div className="show-list-poster">
                    <img
                      src={show.posterUrl}
                      alt={show.artist || show.title}
                      className="show-list-image"
                    />
                    <span className="show-list-status-badge">{statusConfig.label}</span>
                  </div>

                  {/* 정보 */}
                  <div className="show-list-content">
                    <div className="show-list-card-title">{show.artist || show.title}</div>
                    <div className="show-list-card-venue">
                      <IconifyIcon icon="mdi:map-marker" width={14} height={14} className="show-list-card-venue-icon" />
                      <span>{show.venueName || show.city || "공연장"}</span>
                    </div>
                    <div className="show-list-card-date">
                      <IconifyIcon icon="mdi:calendar" width={14} height={14} className="show-list-card-date-icon" />
                      <span>
                        {show.dates && show.dates.length > 0 
                          ? formatDate(show.dates[0])
                          : "날짜 미정"}
                      </span>
                    </div>
                    {minPrice > 0 && (
                      <div className="show-list-card-price">{formatPrice(minPrice)}원~</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 공연 없음 */}
        {!loading && !error && filteredShows.length === 0 && (
          <div className="show-list-empty">
            <IconifyIcon icon="mdi:drama-masks" width={48} height={48} className="show-list-empty-icon" />
            <div className="show-list-empty-text">
              {searchText ? "검색 결과가 없습니다" : "공연이 없습니다"}
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
