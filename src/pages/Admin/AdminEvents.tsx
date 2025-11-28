import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import MainLayout from "../../components/Layout/MainLayout";
import { formatDate } from "../../utils/formatters";
import { useShowsByCategory } from "../../hooks/useShows";
import UnifiedSearchBar from "../../components/Common/UnifiedSearchBar";
import "./AdminEvents.css";

export default function AdminEvents() {
  const navigate = useNavigate();
  
  // ⭐ 멜론티켓 실시간 데이터 사용
  const { shows: melonShows, loading } = useShowsByCategory("concert", "latest");
  const [filteredShows, setFilteredShows] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedShow, setSelectedShow] = useState<any | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (searchQuery) {
      const filtered = melonShows.filter(
        (show: any) =>
          show.artist?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          show.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          show.tourName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          show.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          show.venueName?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredShows(filtered);
    } else {
      setFilteredShows(melonShows);
    }
  }, [searchQuery, melonShows]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setAnchorEl(null);
        setSelectedShow(null);
      }
    };

    if (anchorEl) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [anchorEl]);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, show: any) => {
    setAnchorEl(event.currentTarget);
    setSelectedShow(show);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedShow(null);
  };

  const handleView = () => {
    if (selectedShow) {
      window.open(selectedShow.link || `https://ticket.melon.com`, "_blank");
    }
    handleMenuClose();
  };

  const getStatusChip = (status: string) => {
    const config: Record<string, { label: string; color: string }> = {
      onsale: { label: "판매중", color: "#667eea" },
      presale: { label: "선예매", color: "#764ba2" },
      upcoming: { label: "오픈예정", color: "#999" },
      soldout: { label: "매진", color: "#ef4444" },
    };

    const { label, color } = config[status] || config.onsale;

    return (
      <span className="admin-shows-status-badge" style={{ backgroundColor: color }}>
        {label}
      </span>
    );
  };

  return (
    <MainLayout>
      <div className="admin-events-container">
        <div className="admin-events-content">
          {/* 헤더 */}
          <div className="admin-events-header">
            <div>
              <h1 className="admin-events-title">공연 관리</h1>
              <p className="admin-events-subtitle">멜론티켓 실시간 데이터 · 전체 {filteredShows.length}개 공연</p>
            </div>
            <button
              className="admin-events-button"
              onClick={() => alert("공연 등록 기능은 준비 중입니다")}
            >
              <span>+</span>
              공연 등록
            </button>
          </div>

          {/* 검색 */}
          <div className="admin-events-search-paper">
            <UnifiedSearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="공연명, 아티스트, 공연장, 도시로 검색..."
            />
          </div>

          {/* 로딩 상태 */}
          {loading && (
            <div className="admin-events-loading">
              <div className="notice-loading-spinner"></div>
            </div>
          )}

          {/* 공연 목록 테이블 */}
          {!loading && (
            <div className="admin-events-table-paper">
              <table className="admin-events-table">
                <thead className="admin-events-table-head">
                  <tr>
                    <th className="admin-events-table-header-cell">포스터</th>
                    <th className="admin-events-table-header-cell">아티스트</th>
                    <th className="admin-events-table-header-cell">투어명</th>
                    <th className="admin-events-table-header-cell">공연장</th>
                    <th className="admin-events-table-header-cell">도시</th>
                    <th className="admin-events-table-header-cell">날짜</th>
                    <th className="admin-events-table-header-cell">상태</th>
                    <th className="admin-events-table-header-cell">액션</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredShows.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="admin-events-empty">
                        {searchQuery ? "검색 결과가 없습니다" : "공연이 없습니다"}
                      </td>
                    </tr>
                  ) : (
                    filteredShows.map((show: any) => (
                      <tr key={show.showId} className="admin-events-table-row">
                        <td className="admin-events-table-cell">
                          <img
                            src={show.posterUrl}
                            alt={show.artist || show.title}
                            className="admin-events-poster"
                          />
                        </td>
                        <td className="admin-events-table-cell admin-events-artist">
                          {show.artist || show.title}
                        </td>
                        <td className="admin-events-table-cell" style={{ maxWidth: "250px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {show.tourName || show.title || "-"}
                        </td>
                        <td className="admin-events-table-cell">{show.venueName || "-"}</td>
                        <td className="admin-events-table-cell">{show.city || "-"}</td>
                        <td className="admin-events-table-cell">
                          {show.dates && show.dates.length > 0 ? (
                            <>
                              <div style={{ fontWeight: 500 }}>{show.dates.length}회차</div>
                              <div style={{ color: "#999", fontSize: "12px" }}>{formatDate(show.dates[0])}~</div>
                            </>
                          ) : (
                            <div style={{ color: "#999" }}>날짜 미정</div>
                          )}
                        </td>
                        <td className="admin-events-table-cell">
                          {getStatusChip(show.ticketStatus)}
                        </td>
                        <td className="admin-events-table-cell" style={{ position: "relative" }}>
                          <button
                            className="admin-events-menu-button"
                            onClick={(e) => handleMenuOpen(e, show)}
                          >
                            ⋮
                          </button>
                          {anchorEl && selectedShow?.showId === show.showId && (
                            <div ref={menuRef} className="admin-events-menu" style={{ position: "absolute", right: 0, top: "100%", zIndex: 1000 }}>
                              <button className="admin-events-menu-item" onClick={handleView}>
                                <span className="admin-events-menu-item-icon">👁️</span>
                                상세 보기
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
