import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import MainLayout from "../../components/Layout/MainLayout";
import IconifyIcon from "../../components/Icon/IconifyIcon";
import { Event } from "../../types";
import { formatDate, formatPrice } from "../../utils/formatters";
import { TICKET_STATUS_CONFIG, CATEGORIES } from "../../utils/constants";
import { eventsService } from "../../firebase/services";
import { useShowsByCategory } from "../../hooks/useShows";
import "./Home.css";

export default function Home() {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [selectedTab, setSelectedTab] = useState(0);
  const [events, setEvents] = useState<Event[]>([]);

  // ⭐ 멜론티켓 실시간 데이터 가져오기
  const { shows: popularShowsData, loading: popularLoading } = useShowsByCategory("concert", "popularity");
  const { shows: latestShowsData, loading: latestLoading } = useShowsByCategory("concert", "latest");

  const loading = popularLoading || latestLoading;

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
    if (routes[index]) {
      navigate(routes[index]);
    }
  };

  // ⭐ 멜론티켓 데이터 처리
  const mainSlides = popularShowsData.slice(0, 5);
  const newShows = latestShowsData.slice(0, 8);
  const rankingShows = popularShowsData.slice(0, 10);

  // 이벤트 데이터 로드
  useEffect(() => {
    const loadEvents = async () => {
      try {
        const eventsData = await eventsService.getAll("latest");
        setEvents(eventsData.slice(0, 4));
      } catch (error) {
        console.error("이벤트 로드 실패:", error);
      }
    };
    loadEvents();
  }, []);

  const handleNextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % mainSlides.length);
  };

  const handlePrevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + mainSlides.length) % mainSlides.length);
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="loading-container">
          <div className="loading-spinner"></div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      {/* 카테고리 탭 */}
      <div className="category-tabs">
        <div className="category-tabs-container">
          <ul className="category-tabs-list">
            {CATEGORIES.map((category, index) => (
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

      {/* 메인 슬라이더 */}
      <div className="main-slider">
        <div className="main-slider-container">
          {mainSlides.map((show: any, index: number) => (
            <div
              key={show.id || show.showId || index}
              className={`main-slide ${currentSlide === index ? "active" : ""}`}
              onClick={() => navigate(`/shows/${show.id || show.showId}`, {
                state: {
                  venueName: show.venueName || show.city,
                  address: (show as any).address || (show as any).venueAddress,
                  runningTime: show.runningTime,
                  priceInfo: show.priceTable,
                }
              })}
              style={{
                backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(0,0,0,0.7)), url(${show.posterUrl || show.imageUrl})`,
              }}
            >
              <div className="slide-content">
                <h2>{show.artist || show.title}</h2>
                <h5>{show.tourName || show.title}</h5>
                <div className="slide-info">
                  <span
                    className="status-chip"
                    style={{
                      background:
                        show.ticketStatus === "onsale" || show.ticketStatus === "presale"
                          ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                          : TICKET_STATUS_CONFIG[show.ticketStatus as keyof typeof TICKET_STATUS_CONFIG]?.color || "#999",
                    }}
                  >
                    {TICKET_STATUS_CONFIG[show.ticketStatus as keyof typeof TICKET_STATUS_CONFIG]?.label || "판매중"}
                  </span>
                  <span className="slide-date">
                    <IconifyIcon icon="mdi:calendar" width={16} height={16} className="slide-date-icon" />
                    <span>{show.date || formatDate(show.dates?.[0] || new Date())}</span>
                  </span>
                </div>
              </div>
            </div>
          ))}

          <button className="slider-control prev" onClick={handlePrevSlide}>
            ‹
          </button>
          <button className="slider-control next" onClick={handleNextSlide}>
            ›
          </button>

          <div className="slider-indicators">
            {mainSlides.map((_, index) => (
              <button
                key={index}
                className={`slider-indicator ${currentSlide === index ? "active" : ""}`}
                onClick={() => setCurrentSlide(index)}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="home-container">
        {/* 이벤트 + 랭킹 */}
        <div className="three-cards">
          {/* 이벤트 */}
          <div className="card-box">
            <div className="card-header">
              <div className="card-title">
                <IconifyIcon icon="mdi:trophy" width={20} height={20} className="card-title-icon" />
                <span className="card-title-text">이벤트</span>
              </div>
              <button className="card-more" onClick={() => navigate("/events")}>
                더보기
              </button>
            </div>
            <div className="event-card-wrapper">
              <div className="event-grid">
                {events.length > 0 ? (
                  events.map((event) => {
                    const startDate = event.startDate?.toDate ? event.startDate.toDate() : new Date(event.startDate);
                    const endDate = event.endDate?.toDate ? event.endDate.toDate() : new Date(event.endDate);
                    const formatEventDate = (date: Date) => {
                      const year = date.getFullYear();
                      const month = String(date.getMonth() + 1).padStart(2, "0");
                      const day = String(date.getDate()).padStart(2, "0");
                      return `${year}.${month}.${day}`;
                    };
                    const dateRange = `${formatEventDate(startDate)} ~ ${formatEventDate(endDate)}`;
                    const statusLabel = event.status === "ongoing" ? "진행중" : event.status === "scheduled" ? "예정" : "종료";
                    
                    return (
                      <div
                        key={event.id}
                        className="event-card"
                        onClick={() => navigate(`/events/${event.id}`)}
                      >
                        <div className="event-card-image-wrapper">
                          <img
                            src={event.imageUrl}
                            alt={event.title}
                            className="event-card-image"
                          />
                          <div className="event-card-status-badge">{statusLabel}</div>
                        </div>
                        <div className="event-card-content">
                          <div className="event-card-title">{event.title}</div>
                          <div className="event-card-info">
                            <div className="event-card-date">
                              <IconifyIcon icon="mdi:calendar-range" width={10} height={10} className="event-card-date-icon" />
                              <span>{dateRange}</span>
                            </div>
                            {event.participantCount > 0 && (
                              <div className="event-card-participants">
                                <IconifyIcon icon="mdi:account-group" width={10} height={10} className="event-card-participants-icon" />
                                <span>{event.participantCount.toLocaleString()}명</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="empty-state">진행 중인 이벤트가 없습니다</div>
                )}
              </div>
            </div>
          </div>

          {/* 랭킹 */}
          <div className="card-box">
            <div className="card-header">
              <div className="card-title">
                <IconifyIcon icon="mdi:chart-line" width={20} height={20} className="card-title-icon" />
                <span className="card-title-text">랭킹</span>
              </div>
              <ul className="ranking-tabs">
                <li><button className="ranking-tab active">전체</button></li>
                <li><button className="ranking-tab">콘서트</button></li>
                <li><button className="ranking-tab">뮤지컬</button></li>
                <li><button className="ranking-tab">클래식</button></li>
              </ul>
            </div>
            <ul className="ranking-list">
              {rankingShows.slice(0, 5).map((show: any, index: number) => {
                const minPrice = show.priceTable ? Math.min(...(Object.values(show.priceTable) as number[])) : 0;
                return (
                  <li key={show.id || show.showId || index} className="ranking-item">
                    <button
                      className="ranking-item-button"
                      onClick={() => navigate(`/shows/${show.id || show.showId}`, {
                state: {
                  venueName: show.venueName || show.city,
                  address: (show as any).address || (show as any).venueAddress,
                  runningTime: show.runningTime,
                  priceInfo: show.priceTable,
                }
              })}
                    >
                      <div className="ranking-item-left">
                        <span className={`ranking-number ${index < 3 ? "top3" : "other"}`}>
                          {index + 1}
                        </span>
                        {index < 3 && (
                          <span className="ranking-badge">
                            {index === 0 ? (
                              <IconifyIcon icon="mdi:fire" width={18} height={18} />
                            ) : (
                              <IconifyIcon icon="mdi:trending-up" width={18} height={18} />
                            )}
                          </span>
                        )}
                      </div>
                      <div className="ranking-item-thumbnail">
                        <img
                          src={show.posterUrl || show.imageUrl}
                          alt={show.artist || show.title}
                          className="ranking-thumbnail-image"
                        />
                      </div>
                      <div className="ranking-item-content">
                        <div className="ranking-item-title">{show.artist || show.title}</div>
                        {show.tourName && (
                          <div className="ranking-item-subtitle">{show.tourName}</div>
                        )}
                        <div className="ranking-item-info">
                          <div className="ranking-item-date">
                            <IconifyIcon icon="mdi:calendar" width={14} height={14} className="ranking-item-date-icon" />
                            <span>{show.date || formatDate(show.dates?.[0] || new Date())}</span>
                          </div>
                          {minPrice > 0 && (
                            <div className="ranking-item-price">{formatPrice(minPrice)}~</div>
                          )}
                        </div>
                      </div>
                      <div className="ranking-item-arrow">
                        <IconifyIcon icon="mdi:chevron-right" width={20} height={20} />
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        {/* 빠른 예매 바로가기 */}
        <div className="quick-access">
          <div className="quick-access-grid">
            {[
              { label: "콘서트", icon: "mdi:microphone", route: "/categories/concert" },
              { label: "뮤지컬·연극", icon: "mdi:drama-masks", route: "/categories/musical" },
              { label: "클래식", icon: "mdi:violin", route: "/categories/classical" },
              { label: "펜클럽·팬미팅", icon: "mdi:tent", route: "/categories/festival" },
              { label: "전시·행사", icon: "mdi:image", route: "/categories/sports" },
            ].map((category) => (
              <button
                key={category.label}
                className="quick-access-button"
                onClick={() => navigate(category.route)}
              >
                <IconifyIcon icon={category.icon} width={24} height={24} className="quick-access-icon" />
                <span className="quick-access-label">{category.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* NEW 공연 */}
        <div>
          <div className="section-header">
            <h3 className="section-title">
              <IconifyIcon icon="mdi:sparkles" width={20} height={20} style={{ marginRight: "8px", verticalAlign: "middle" }} />
              NEW 공연
            </h3>
            <button className="section-more" onClick={() => navigate("/shows")}>
              더보기
            </button>
          </div>
          <div className="shows-grid">
            {newShows.map((show: any) => {
              const minPrice = show.priceTable ? Math.min(...(Object.values(show.priceTable) as number[])) : 0;

              return (
                <div
                  key={show.id || show.showId}
                  className="show-card"
                  onClick={() => navigate(`/shows/${show.id || show.showId}`, {
                state: {
                  venueName: show.venueName || show.city,
                  address: (show as any).address || (show as any).venueAddress,
                  runningTime: show.runningTime,
                  priceInfo: show.priceTable,
                }
              })}
                >
                  <img
                    src={show.posterUrl || show.imageUrl}
                    alt={show.artist || show.title}
                    className="show-card-image"
                  />
                  <div className="show-card-content">
                    <div className="show-card-title">{show.artist || show.title}</div>
                    <div className="show-card-subtitle">{show.tourName || show.title}</div>
                    <div className="show-card-footer">
                      <span className="show-card-date">
                        <IconifyIcon icon="mdi:calendar" width={14} height={14} className="show-card-date-icon" />
                        <span>{show.date || formatDate(show.dates?.[0] || new Date())}</span>
                      </span>
                      <span className="show-card-price">{formatPrice(minPrice)}~</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
