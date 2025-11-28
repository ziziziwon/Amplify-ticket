import React, { useState, useMemo, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import MainLayout from "../../components/Layout/MainLayout";
import IconifyIcon from "../../components/Icon/IconifyIcon";
import { formatDate, formatPrice } from "../../utils/formatters";
import { TICKET_STATUS_CONFIG, CATEGORIES } from "../../utils/constants";
import { useShowsByCategory } from "../../hooks/useShows";
import { ShowSortType } from "../../firebase/services";

// ⭐ Swiper 라이브러리 import
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination as SwiperPagination, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import "./CategoryPage.css";

interface CategoryPageProps {
  categoryId: string;
}

export default function CategoryPage({ categoryId }: CategoryPageProps) {
  const navigate = useNavigate();
  const location = useLocation();
  
  // 현재 카테고리 정보
  const currentCategory = CATEGORIES.find((cat: any) => cat.id === categoryId) || CATEGORIES[0];
  const categoryIndex = CATEGORIES.findIndex((cat: any) => cat.id === categoryId);
  
  const [selectedTab, setSelectedTab] = useState(categoryIndex);
  const [sortType, setSortType] = useState<ShowSortType>("popularity");
  const [subGenreTab, setSubGenreTab] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12; // 페이지당 12개씩 표시

  // 현재 경로에 따라 selectedTab 동기화
  useEffect(() => {
    const pathToIndex: { [key: string]: number } = {
      "/": 0,
      "/categories/concert": 1,
      "/categories/musical": 2,
      "/categories/classical": 3,
      "/categories/festival": 4,
      "/categories/sports": 5,
    };
    const currentIndex = pathToIndex[location.pathname];
    if (currentIndex !== undefined) {
      setSelectedTab(currentIndex);
    }
  }, [location.pathname]);

  // ⭐ Custom Hook으로 데이터 가져오기 - API 구조
  const { shows, loading, error } = useShowsByCategory(categoryId, sortType);

  // 배너용 상위 공연 (8개)
  const bannerShows = useMemo(() => {
    return shows.slice(0, 8);
  }, [shows]);

  // ⭐ 서브 장르로 필터링된 공연
  const filteredShows = useMemo(() => {
    // subGenreTab이 0이면 "전체"
    if (subGenreTab === 0) return shows;
    
    // 해당 카테고리의 서브 장르가 있는지 확인
    if (!('subGenres' in currentCategory) || !currentCategory.subGenres) return shows;
    
    const selectedGenre = currentCategory.subGenres[subGenreTab - 1]; // -1: "전체" 탭 때문에
    
    // 장르 이름으로 필터링 (간단한 방식: title에 장르명이 포함되어 있으면 포함)
    // 실제로는 서버에서 더 정확한 장르 정보를 주는 게 좋지만, 지금은 클라이언트에서 처리
    return shows;
    // TODO: 실제 장르 필터링은 show 데이터에 genre 정보가 있어야 함
  }, [shows, subGenreTab, currentCategory]);

  // ⭐ 페이지네이션 처리
  const paginatedShows = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredShows.slice(startIndex, endIndex);
  }, [filteredShows, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredShows.length / itemsPerPage);

  // 카테고리 탭 클릭 핸들러
  const handleTabChange = (index: number) => {
    const routes = [
      "/",
      "/categories/concert",
      "/categories/musical",
      "/categories/classical",
      "/categories/festival",
      "/categories/sports",
    ];
    navigate(routes[index]);
  };

  // 카테고리 배열 (타입 처리)
  const categoriesArray = CATEGORIES as readonly {
    readonly id: string;
    readonly label: string;
    readonly description: string;
    readonly subGenres?: readonly string[];
  }[];

  // 날짜 범위 포맷팅
  const formatDateRange = (dates: string[]) => {
    if (dates.length === 0) return "";
    if (dates.length === 1) return formatDate(dates[0]);
    
    const startDate = new Date(dates[0]);
    const endDate = new Date(dates[dates.length - 1]);
    
    const startFormatted = `${startDate.getFullYear()}.${String(startDate.getMonth() + 1).padStart(2, '0')}.${String(startDate.getDate()).padStart(2, '0')}`;
    const endFormatted = `${endDate.getFullYear()}.${String(endDate.getMonth() + 1).padStart(2, '0')}.${String(endDate.getDate()).padStart(2, '0')}`;
    
    if (startFormatted === endFormatted) return startFormatted;
    return `${startFormatted} - ${endFormatted}`;
  };

  return (
    <MainLayout>
      {/* 카테고리 탭 */}
      <div className="category-tabs-wrapper">
        <div className="category-tabs-container">
          <ul className="category-tabs-list">
            {categoriesArray.map((category: any, index: number) => (
              <li key={category.id}>
                <button
                  className={`category-tab ${selectedTab === index ? "active" : ""}`}
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

      {/* ⭐ Swiper 배너 슬라이더 */}
      {bannerShows.length > 0 && (
        <div className="category-banner">
          <div className="category-banner-container">
            <h3 className="category-banner-title">인기 공연</h3>
            <Swiper
              modules={[Navigation, SwiperPagination, Autoplay]}
              spaceBetween={20}
              slidesPerView={4}
              navigation
              pagination={{ 
                clickable: true,
                bulletActiveClass: 'swiper-pagination-bullet-active',
              }}
              autoplay={{ delay: 3500, disableOnInteraction: false }}
              loop={bannerShows.length >= 4}
              breakpoints={{
                320: { slidesPerView: 1 },
                640: { slidesPerView: 2 },
                900: { slidesPerView: 3 },
                1200: { slidesPerView: 4 },
              }}
              className="category-swiper"
              style={{ 
                '--swiper-navigation-color': '#667eea',
                '--swiper-pagination-color': '#667eea',
              } as any}
            >
              {bannerShows.map((show) => (
                <SwiperSlide key={show.showId}>
                  <div
                    className="category-banner-card"
                    onClick={() => navigate(`/shows/${show.showId}`, {
                      state: {
                        venueName: show.venueName || show.city,
                        address: (show as any).address || (show as any).venueAddress,
                        runningTime: show.runningTime,
                        priceInfo: show.priceTable,
                      }
                    })}
                  >
                    <img
                      src={show.posterUrl}
                      alt={show.artist}
                      className="category-banner-image"
                    />
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        </div>
      )}

      {/* ⭐ 서브 장르 탭 */}
      {'subGenres' in currentCategory && currentCategory.subGenres && currentCategory.subGenres.length > 0 && (
        <div className="sub-genre-tabs-wrapper">
          <div className="sub-genre-tabs-container">
            <ul className="sub-genre-tabs-list">
              <li>
                <button
                  className={`sub-genre-tab ${subGenreTab === 0 ? "active" : ""}`}
                  onClick={() => setSubGenreTab(0)}
                >
                  전체
                </button>
              </li>
              {currentCategory.subGenres.map((genre: string, index: number) => (
                <li key={genre}>
                  <button
                    className={`sub-genre-tab ${subGenreTab === index + 1 ? "active" : ""}`}
                    onClick={() => setSubGenreTab(index + 1)}
                  >
                    {genre}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* 공연 리스트 */}
      <div className="category-page-container">
        {/* 헤더: 아이콘 버튼 + 정렬 */}
        <div className="category-header">
          {/* 좌측: 총 공연 수 */}
          <div className="category-count">
            총 <strong>{filteredShows.length}</strong>개의 공연
          </div>

          {/* 우측: 정렬 세그먼트 */}
          <div className="category-sort-wrapper">
            <button
              className={`category-sort-button ${sortType === "popularity" ? "active" : ""}`}
              onClick={() => setSortType("popularity")}
            >
              인기순
            </button>
            <button
              className={`category-sort-button ${sortType === "deadline" ? "active" : ""}`}
              onClick={() => setSortType("deadline")}
            >
              공연일순
            </button>
            <button
              className={`category-sort-button ${sortType === "latest" ? "active" : ""}`}
              onClick={() => setSortType("latest")}
            >
              최신순
            </button>
          </div>
        </div>

        {/* 로딩 상태 */}
        {loading && (
          <div className="category-loading">
            <div className="category-loading-spinner"></div>
          </div>
        )}

        {/* 에러 상태 */}
        {error && (
          <div className="category-error">
            <div className="category-error-title">데이터를 불러오는데 실패했습니다</div>
            <div className="category-error-message">{error.message}</div>
          </div>
        )}

        {/* 공연 카드 그리드 */}
        {!loading && !error && (
          <div className="category-shows-grid">
            {paginatedShows.map((show) => {
              const statusConfig = TICKET_STATUS_CONFIG[show.ticketStatus];
              const minPrice = show.priceTable 
                ? Math.min(...(Object.values(show.priceTable) as number[])) 
                : 0;

              return (
                <div
                  key={show.showId}
                  className="category-show-card"
                  onClick={() => navigate(`/shows/${show.showId}`)}
                >
                  {/* 포스터 */}
                  <div className="category-show-poster">
                    <img
                      src={show.posterUrl}
                      alt={show.artist}
                      className="category-show-image"
                    />
                    {/* 상태 배지 - 포스터 위에 표시 */}
                    <div className="category-show-status-overlay">
                      <span className="category-show-badge category-show-badge-overlay">{statusConfig.label}</span>
                      {show.ticketStatus === "onsale" && (
                        <span className="category-show-badge category-show-badge-onsale category-show-badge-overlay">판매중</span>
                      )}
                    </div>
                  </div>

                  {/* 정보 */}
                  <div className="category-show-content">
                    <div className="category-show-title">{show.artist}</div>
                    {show.tourName && (
                      <div className="category-show-subtitle">{show.tourName}</div>
                    )}
                    <div className="category-show-date">
                      <IconifyIcon icon="mdi:calendar" width={14} height={14} className="category-show-date-icon" />
                      <span>{formatDateRange(show.dates)}</span>
                    </div>
                    {minPrice > 0 && (
                      <div className="category-show-price">
                        <span className="category-show-price-value">{formatPrice(minPrice)}~</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 공연 없음 */}
        {!loading && !error && shows.length === 0 && (
          <div className="category-empty">
            <IconifyIcon icon="mdi:drama-masks" width={48} height={48} className="category-empty-icon" />
            <div className="category-empty-text">예정된 공연이 없습니다</div>
          </div>
        )}

        {/* ⭐ 페이지네이션 */}
        {!loading && !error && totalPages > 1 && (
          <div className="category-pagination">
            <button
              className="category-pagination-button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            >
              <span className="category-pagination-icon">‹</span>
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                className={`category-pagination-button ${currentPage === page ? "active" : ""}`}
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </button>
            ))}

            <button
              className="category-pagination-button"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
            >
              <span className="category-pagination-icon">›</span>
            </button>
          </div>
        )}
      </div>
    </MainLayout>
  );
}

