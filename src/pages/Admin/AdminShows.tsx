import React, { useState } from "react";
import MainLayout from "../../components/Layout/MainLayout";
import { formatDate, formatPrice } from "../../utils/formatters";
import { TICKET_STATUS_CONFIG } from "../../utils/constants";
import { useShowsByCategory } from "../../hooks/useShows";
import UnifiedSearchBar from "../../components/Common/UnifiedSearchBar";
import "./AdminShows.css";

export default function AdminShows() {
  // ⭐ 멜론티켓 실시간 데이터 사용
  const { shows: melonShows, loading } = useShowsByCategory("concert", "latest");
  const [searchText, setSearchText] = useState("");

  // 검색 필터링
  const filteredShows = melonShows.filter((show: any) =>
    show.artist?.toLowerCase().includes(searchText.toLowerCase()) ||
    show.title?.toLowerCase().includes(searchText.toLowerCase()) ||
    show.venueName?.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <MainLayout>
      <div className="admin-shows-container">
        {/* 헤더 */}
        <div className="admin-shows-header">
          <div>
            <h1 className="admin-shows-title">공연 관리</h1>
            <p className="admin-shows-subtitle">멜론티켓 실시간 데이터 · 전체 {filteredShows.length}개 공연</p>
          </div>
          <button
            className="admin-shows-button"
            onClick={() => alert("공연 추가 기능은 준비 중입니다")}
          >
            + 공연 등록
          </button>
        </div>

        {/* 검색 */}
        <div className="admin-shows-search">
          <UnifiedSearchBar
            value={searchText}
            onChange={setSearchText}
            placeholder="아티스트, 공연명, 공연장 검색..."
            size="small"
            fullWidth={false}
          />
        </div>

        {/* 로딩 상태 */}
        {loading && (
          <div className="admin-shows-loading">
            <div className="notice-loading-spinner"></div>
          </div>
        )}

        {/* 공연 리스트 테이블 */}
        {!loading && (
          <div className="admin-shows-table-container">
            <table className="admin-shows-table">
              <thead className="admin-shows-table-head">
                <tr>
                  <th className="admin-shows-table-header-cell">포스터</th>
                  <th className="admin-shows-table-header-cell">아티스트</th>
                  <th className="admin-shows-table-header-cell">투어명</th>
                  <th className="admin-shows-table-header-cell">공연장</th>
                  <th className="admin-shows-table-header-cell">도시</th>
                  <th className="admin-shows-table-header-cell">날짜</th>
                  <th className="admin-shows-table-header-cell">상태</th>
                  <th className="admin-shows-table-header-cell">액션</th>
                </tr>
              </thead>
              <tbody>
                {filteredShows.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="admin-shows-empty">
                      {searchText ? "검색 결과가 없습니다" : "공연이 없습니다"}
                    </td>
                  </tr>
                ) : (
                  filteredShows.map((show: any) => {
                    const statusConfig = TICKET_STATUS_CONFIG[show.ticketStatus as keyof typeof TICKET_STATUS_CONFIG] || TICKET_STATUS_CONFIG.onsale;

                    return (
                      <tr key={show.showId} className="admin-shows-table-row">
                        <td className="admin-shows-table-cell">
                          <img
                            src={show.posterUrl}
                            alt={show.artist || show.title}
                            className="admin-shows-poster"
                          />
                        </td>
                        <td className="admin-shows-table-cell admin-shows-artist">
                          {show.artist || show.title}
                        </td>
                        <td className="admin-shows-table-cell" style={{ maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {show.tourName || show.title || "-"}
                        </td>
                        <td className="admin-shows-table-cell">{show.venueName || "-"}</td>
                        <td className="admin-shows-table-cell">{show.city || "-"}</td>
                        <td className="admin-shows-table-cell">
                          {show.dates && show.dates.length > 0 ? (
                            <>
                              <div style={{ fontWeight: 500 }}>{show.dates.length}회차</div>
                              <div style={{ color: "#999", fontSize: "12px" }}>{formatDate(show.dates[0])}~</div>
                            </>
                          ) : (
                            <div style={{ color: "#999" }}>날짜 미정</div>
                          )}
                        </td>
                        <td className="admin-shows-table-cell">
                          <span className="admin-shows-status-badge">{statusConfig.label}</span>
                        </td>
                        <td className="admin-shows-table-cell">
                          <button
                            className="admin-shows-action-button"
                            onClick={() => window.open(show.link || `https://ticket.melon.com`, "_blank")}
                          >
                            상세
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
