import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import MainLayout from "../../components/Layout/MainLayout";
import IconifyIcon from "../../components/Icon/IconifyIcon";
import ShowMap from "../../components/ShowMap";
import { Show, Venue } from "../../types";
import { formatDate, formatPrice, formatKoreanDate } from "../../utils/formatters";
import { TICKET_STATUS_CONFIG } from "../../utils/constants";
import { useTicketStore } from "../../stores/useTicketStore";
import { showsService } from "../../firebase/services";
import { useVenue } from "../../hooks/useVenues";
import { fetchTicketmasterById, fetchKopisById, fetchMelonConcertById } from "../../api";
import "./ShowDetail.css";

interface LocationState {
  venueName?: string;
  address?: string; // 공연장 주소
  runningTime?: string;
  priceInfo?: any;
}

export default function ShowDetail() {
  const { showId } = useParams<{ showId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { setCurrentShow } = useTicketStore();
  
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"detail" | "venue" | "booking">("detail");
  const [show, setShow] = useState<Show | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // 방법 1: 리스트에서 전달받은 venueName, address (state)
  const locationState = location.state as LocationState | null;
  const [venueName, setVenueName] = useState<string | null>(locationState?.venueName || null);
  const [venueAddress, setVenueAddress] = useState<string | null>(locationState?.address || null);

  const isTicketmasterShow = showId?.startsWith("tm_");
  const isKopisShow = showId?.startsWith("kopis_");
  const isMelonShow = showId?.startsWith("melon_");

  // Venue 정보 가져오기
  const { venue, loading: venueLoading } = useVenue(show?.venueId || "");

  useEffect(() => {
    async function loadShow() {
      if (!showId) {
        setLoading(false);
        setError("공연 ID가 없습니다.");
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // 1. 멜론티켓 공연
        if (isMelonShow) {
          console.log("🎵 멜론티켓 공연 로딩:", showId);
          try {
            const melonShow = await fetchMelonConcertById(showId);
            
            if (melonShow) {
              // dates 배열을 dateTimes 형식으로 변환
              const dates = Array.isArray(melonShow.dates) ? melonShow.dates : (melonShow.dates ? [melonShow.dates] : []);
              const dateTimes = dates.map((dateStr: string) => {
                const date = dateStr.split('T')[0];
                const timeMatch = dateStr.match(/T(\d{2}):(\d{2})/);
                const times = timeMatch 
                  ? [`${timeMatch[1]}:${timeMatch[2]}`]
                  : ["15:00", "20:00"]; // 멜론 공연 기본 시간대
                return { date, times };
              });

              // 방법 2: venueName, address가 state에 없으면 API 응답에서 가져오기 (fallback)
              if (!venueName) {
                const apiVenueName = (melonShow as any).venueName;
                if (apiVenueName) {
                  setVenueName(apiVenueName);
                }
              }
              
              // 주소도 fallback으로 가져오기
              if (!venueAddress) {
                const apiAddress = (melonShow as any).address || (melonShow as any).venueAddress;
                if (apiAddress) {
                  setVenueAddress(apiAddress);
                }
              }

              setShow({
                showId: melonShow.showId || showId,
                artist: melonShow.artist || melonShow.title,
                tourName: melonShow.tourName || melonShow.title,
                venueId: melonShow.venueId,
                city: melonShow.city,
                dates: dates,
                dateTimes: dateTimes.length > 0 ? dateTimes : undefined,
                posterUrl: melonShow.posterUrl,
                priceTable: melonShow.priceTable || {},
                description: melonShow.description,
                genre: melonShow.genre,
                ticketStatus: melonShow.ticketStatus as any,
                ticketOpenDate: melonShow.ticketOpenDate,
                seatGrades: melonShow.priceTable ? Object.keys(melonShow.priceTable) : [],
                bookingLink: (melonShow as any).link,
                venueName: venueName || (melonShow as any).venueName,
              } as Show);
            } else {
              setError(`공연 정보를 찾을 수 없습니다. (ID: ${showId})`);
            }
          } catch (err: any) {
            console.error("멜론티켓 공연 로드 실패:", err);
            setError(`공연 정보를 불러오는데 실패했습니다: ${err.message || "알 수 없는 오류"}`);
          }
        }
        // 2. KOPIS 공연
        else if (isKopisShow) {
          const kopisShow = await fetchKopisById(showId);
          if (kopisShow) {
            setShow({
              showId: kopisShow.showId,
              artist: kopisShow.artist,
              tourName: kopisShow.tourName,
              venueId: kopisShow.venueId,
              city: kopisShow.city,
              dates: kopisShow.dates,
              posterUrl: kopisShow.posterUrl,
              priceTable: kopisShow.priceTable,
              description: kopisShow.description,
              genre: kopisShow.genre,
              ticketStatus: kopisShow.ticketStatus,
              ticketOpenDate: kopisShow.ticketOpenDate,
              seatGrades: Object.keys(kopisShow.priceTable),
            } as Show);
          } else {
            setError("공연 정보를 찾을 수 없습니다.");
          }
        }
        // 3. Ticketmaster 공연
        else if (isTicketmasterShow) {
          const tmShow = await fetchTicketmasterById(showId);
          if (tmShow) {
            setShow({
              showId: tmShow.showId,
              artist: tmShow.artist,
              tourName: tmShow.tourName,
              venueId: tmShow.venueId,
              city: tmShow.city,
              dates: tmShow.dates,
              posterUrl: tmShow.posterUrl,
              priceTable: tmShow.priceTable,
              description: tmShow.description,
              genre: tmShow.genre,
              ticketStatus: tmShow.ticketStatus,
              ticketOpenDate: tmShow.ticketOpenDate,
              seatGrades: Object.keys(tmShow.priceTable),
              bookingLink: (tmShow as any).ticketmasterUrl,
            } as Show);
          } else {
            setError("공연 정보를 찾을 수 없습니다.");
          }
        }
        // 4. Firestore 또는 로컬 데이터
        else {
          // Firestore에서 먼저 시도
          const firestoreShow = await showsService.getById(showId);
          if (firestoreShow) {
            setShow({ ...firestoreShow, showId });
          } else {
            setError("공연 정보를 찾을 수 없습니다.");
          }
        }
      } catch (err) {
        console.error("❌ 공연 로드 실패:", err);
        setError("공연 정보를 불러오는데 실패했습니다.");
      } finally {
        setLoading(false);
      }
    }

    loadShow();
  }, [showId, isTicketmasterShow, isKopisShow, isMelonShow]);

  const statusConfig = show ? (TICKET_STATUS_CONFIG[show.ticketStatus as keyof typeof TICKET_STATUS_CONFIG] || TICKET_STATUS_CONFIG.upcoming) : null;

  // 공연 기간 계산
  const getDateRange = () => {
    if (!show || !show.dates || show.dates.length === 0) return "날짜 미정";
    if (show.dates.length === 1) return formatDate(show.dates[0]);
    
    const sortedDates = [...show.dates].sort();
    const startDate = formatDate(sortedDates[0]);
    const endDate = formatDate(sortedDates[sortedDates.length - 1]);
    return `${startDate} ~ ${endDate}`;
  };

  // 최소/최대 가격 계산
  const getPriceRange = () => {
    if (!show || !show.priceTable) return null;
    const prices = Object.values(show.priceTable);
    if (prices.length === 0) return null;
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    if (minPrice === maxPrice) return formatPrice(minPrice);
    return `${formatPrice(minPrice)} ~ ${formatPrice(maxPrice)}`;
  };

  // dates 배열을 dateTimes 형식으로 변환하는 헬퍼 함수
  const getDateTimes = (): { date: string; times: string[] }[] => {
    if (!show) return [];
    
    // dateTimes가 있으면 우선 사용
    if (show.dateTimes && show.dateTimes.length > 0) {
      return show.dateTimes;
    }
    
    // dates 배열이 있으면 변환 (기본 시간대 추가)
    if (show.dates && show.dates.length > 0) {
      return show.dates.map((dateStr) => {
        // ISO 형식에서 날짜만 추출
        const date = dateStr.split('T')[0];
        // 시간 정보가 있으면 추출, 없으면 기본값
        const timeMatch = dateStr.match(/T(\d{2}):(\d{2})/);
        const times = timeMatch 
          ? [`${timeMatch[1]}:${timeMatch[2]}`]
          : ["15:00", "20:00"]; // 기본 시간대
        return { date, times };
      });
    }
    
    return [];
  };

  const handleBooking = () => {
    if (isKopisShow) {
      alert("한국 공연 예매는 준비 중입니다.");
      return;
    }

    if (!show) return;

    if (show.ticketStatus === "soldout") {
      alert("매진된 공연입니다.");
      return;
    }

    if (show.ticketStatus === "upcoming") {
      alert("아직 예매가 시작되지 않았습니다.");
      return;
    }

    // 날짜/시간 선택 검증
    const dateTimes = getDateTimes();
    if (dateTimes.length > 0) {
      if (!selectedDate) {
        alert("공연 일자를 선택해주세요.");
        return;
      }
      if (!selectedTime) {
        alert("공연 시간을 선택해주세요.");
        return;
      }
    } else if (show.dates && show.dates.length > 0 && !selectedDate) {
      alert("공연 일자를 선택해주세요.");
      return;
    }

    // 팝업창으로 좌석 선택 열기
    const date = selectedDate || (show.dates && show.dates[0] ? show.dates[0].split('T')[0] : "");
    const time = selectedTime || (dateTimes.length > 0 && dateTimes[0].times.length > 0 ? dateTimes[0].times[0] : "15:00");
    
    // 선예매인 경우 인증 페이지로, 일반 예매는 팝업으로 좌석 선택
    if (show.ticketStatus === "presale") {
      const fullDateTime = time ? `${date}T${time}:00` : date;
      setCurrentShow(show.showId, fullDateTime);
      navigate(`/verification?showId=${showId}&date=${fullDateTime}`);
    } else {
      setCurrentShow(show.showId, date);
      // 팝업창 열기 (React Router 경로 사용)
      // 카페24 서버 호환성을 위해 절대 경로 사용
      const publicUrl = process.env.PUBLIC_URL || "";
      const popupUrl = `${window.location.origin}${publicUrl}/seat-popup?showId=${showId}&date=${date}&time=${time}`;
      window.open(
        popupUrl,
        "seatPopup",
        "width=1200,height=900,scrollbars=yes,resizable=yes"
      );
    }
  };

  if (loading || venueLoading) {
    return (
      <MainLayout>
        <div className="showdetail-loading">
          <div className="showdetail-spinner"></div>
          <p className="showdetail-loading-text">공연 정보를 불러오는 중...</p>
        </div>
      </MainLayout>
    );
  }

  if (error || !show || !statusConfig) {
    return (
      <MainLayout>
        <div className="showdetail-error">
          <IconifyIcon icon="mdi:alert-circle" width={48} height={48} className="showdetail-error-icon" />
          <h2 className="showdetail-error-title">{error || "공연을 찾을 수 없습니다"}</h2>
          <button className="showdetail-back-button" onClick={() => navigate("/shows")}>
            공연 목록으로 돌아가기
          </button>
        </div>
      </MainLayout>
    );
  }

  const priceRange = getPriceRange();
  const dateRange = getDateRange();
  const dateTimes = getDateTimes();

  // 선택된 날짜의 시간 목록 가져오기
  const getTimesForSelectedDate = (): string[] => {
    if (!selectedDate) return [];
    const dateTime = dateTimes.find((dt: { date: string; times: string[] }) => dt.date === selectedDate);
    return dateTime?.times || [];
  };

  return (
    <MainLayout>
      <div className="showdetail-container">
        {/* 멜론티켓 스타일 히어로 영역 */}
        <div className="showdetail-hero">
          {/* 왼쪽: 포스터 */}
          <div className="showdetail-hero-poster">
            <img
              src={show.posterUrl}
              alt={show.artist}
              className="showdetail-poster-image"
            />
          </div>

          {/* 오른쪽: 공연 정보 및 예매 */}
          <div className="showdetail-hero-content">
            {/* 제목 */}
            <h1 className="showdetail-hero-title">{show.artist}</h1>
            
            {/* 배지 영역 (제목 아래로 이동) */}
            <div className="showdetail-hero-header">
              <span
                className="showdetail-status-badge"
                style={{ 
                  background: statusConfig.color,
                  color: "#fff"
                }}
              >
                {statusConfig.label}
              </span>
              {show.genre && (
                <span className="showdetail-genre-badge">{show.genre}</span>
              )}
            </div>
            {show.tourName && show.tourName !== show.artist && (
              <p className="showdetail-hero-subtitle">{show.tourName}</p>
            )}

            {/* 공연 정보 카드 */}
            <div className="showdetail-info-card">
              <div className="showdetail-info-row">
                <div className="showdetail-info-label">
                  <IconifyIcon icon="mdi:calendar-range" width={18} height={18} />
                  <span>공연기간</span>
                </div>
                <div className="showdetail-info-value">{dateRange}</div>
              </div>
              <div className="showdetail-info-row">
                <div className="showdetail-info-label">
                  <IconifyIcon icon="mdi:clock-outline" width={18} height={18} />
                  <span>관람시간</span>
                </div>
                <div className="showdetail-info-value">120분</div>
              </div>
              <div className="showdetail-info-row">
                <div className="showdetail-info-label">
                  <IconifyIcon icon="mdi:music-note" width={18} height={18} />
                  <span>장르</span>
                </div>
                <div className="showdetail-info-value">{show.genre || "-"}</div>
              </div>
              <div className="showdetail-info-row">
                <div className="showdetail-info-label">
                  <IconifyIcon icon="mdi:map-marker" width={18} height={18} />
                  <span>공연장</span>
                </div>
                <div className="showdetail-info-value">
                  {venueName || venue?.name || show.city || "-"}
                </div>
              </div>
              <div className="showdetail-info-row">
                <div className="showdetail-info-label">
                  <IconifyIcon icon="mdi:account-group" width={18} height={18} />
                  <span>관람등급</span>
                </div>
                <div className="showdetail-info-value">전체관람가</div>
              </div>
            </div>

            {/* 멜론 스타일 날짜/시간 선택 */}
            {dateTimes.length > 0 && (
              <div className="showdetail-datetime-selector">
                {/* 날짜 선택 */}
                <div className="showdetail-date-selector">
                  <div className="showdetail-selector-header">
                    <IconifyIcon icon="mdi:calendar" width={20} height={20} />
                    <span>날짜 선택</span>
                  </div>
                  <div className="showdetail-date-list">
                    {dateTimes.map((dt: { date: string; times: string[] }, index: number) => {
                      const isSelected = selectedDate === dt.date;
                      return (
                        <button
                          key={index}
                          className={`showdetail-date-item ${isSelected ? "selected" : ""}`}
                          onClick={() => {
                            setSelectedDate(dt.date);
                            setSelectedTime(""); // 날짜 변경 시 시간 초기화
                          }}
                        >
                          {formatKoreanDate(dt.date)}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 시간 선택 */}
                {selectedDate && (
                  <div className="showdetail-time-selector">
                    <div className="showdetail-selector-header">
                      <IconifyIcon icon="mdi:clock-outline" width={20} height={20} />
                      <span>시간 선택</span>
                    </div>
                    <div className="showdetail-time-list">
                      {getTimesForSelectedDate().map((time, index) => {
                        const isSelected = selectedTime === time;
                        return (
                          <button
                            key={index}
                            className={`showdetail-time-item ${isSelected ? "selected" : ""}`}
                            onClick={() => setSelectedTime(time)}
                          >
                            {time}
                          </button>
                        );
                      })}
                    </div>
                    {getTimesForSelectedDate().length > 0 && (
                      <div className="showdetail-time-hint">
                        선택한 회차의 잔여석과 가격을 확인 할 수 있어요!
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* 예매 버튼 */}
            <button
              className="showdetail-booking-button"
              onClick={handleBooking}
              disabled={
                show.ticketStatus === "soldout" || 
                show.ticketStatus === "upcoming" ||
                (dateTimes.length > 0 && (!selectedDate || !selectedTime))
              }
            >
              {isKopisShow ? (
                <>
                  <IconifyIcon icon="mdi:drama-masks" width={20} height={20} />
                  예매하기 (준비 중)
                </>
              ) : show.ticketStatus === "soldout" ? (
                "매진"
              ) : show.ticketStatus === "upcoming" ? (
                "예매 오픈 대기"
              ) : (
                <>
                  <IconifyIcon icon="mdi:ticket-confirmation" width={20} height={20} />
                  예매하기
                </>
              )}
            </button>
          </div>
        </div>

        {/* 하단 탭 메뉴 */}
        <div className="showdetail-tabs">
          <button
            className={`showdetail-tab ${activeTab === "detail" ? "active" : ""}`}
            onClick={() => setActiveTab("detail")}
          >
            상세정보
          </button>
          <button
            className={`showdetail-tab ${activeTab === "venue" ? "active" : ""}`}
            onClick={() => setActiveTab("venue")}
          >
            공연장정보
          </button>
          <button
            className={`showdetail-tab ${activeTab === "booking" ? "active" : ""}`}
            onClick={() => setActiveTab("booking")}
          >
            예매안내
          </button>
        </div>

        {/* 탭 컨텐츠 */}
        <div className="showdetail-tab-content">
          {activeTab === "detail" && (
            <div className="showdetail-tab-panel">
              {/* 가격표 */}
              {show.priceTable && Object.keys(show.priceTable).length > 0 && (
                <div className="showdetail-price-section">
                  <h3 className="showdetail-section-subtitle">좌석 등급 및 가격</h3>
                  <div className="showdetail-price-grid">
                    {Object.entries(show.priceTable).map(([grade, price]: [string, number]) => (
                      <div key={grade} className="showdetail-price-card">
                        <div className="showdetail-price-grade">
                          <span className="showdetail-grade-name">{grade}</span>
                        </div>
                        <div className="showdetail-price-value">{formatPrice(price)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 공연 설명 */}
              <div className="showdetail-description-section">
                <h3 className="showdetail-section-subtitle">공연 소개</h3>
                <div className="showdetail-description-content">
                  {show.description ? (
                    <p>{show.description}</p>
                  ) : (
                    <p className="showdetail-description-empty">
                      해당 공연에 대한 상세 설명이 아직 제공되지 않습니다.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === "venue" && (
            <div className="showdetail-tab-panel">
              <div className="showdetail-venue-section">
                <h3 className="showdetail-section-subtitle">공연장 안내</h3>
                {/* 공연장 이름 또는 주소가 있으면 표시 */}
                {(venue || venueName || venueAddress) ? (
                  <div className="showdetail-venue-card">
                    <h4 className="showdetail-venue-name">{venueName || venue?.name || "공연장"}</h4>
                    {/* 주소 표시: venue.address > venueAddress 순서 */}
                    {(venue?.address || venueAddress) && (
                      <div className="showdetail-venue-info">
                        <IconifyIcon icon="mdi:map-marker" width={18} height={18} />
                        <span>{venue?.address || venueAddress}</span>
                      </div>
                    )}
                    {venue?.description && (
                      <p className="showdetail-venue-description">{venue.description}</p>
                    )}
                    {/* 지도 표시: 주소가 있으면 지도 렌더링 */}
                    {(venue?.address || venueAddress) ? (
                      <div className="showdetail-venue-map-wrapper">
                        <ShowMap 
                          address={venue?.address || venueAddress || ""} 
                          venueName={venueName || venue?.name || "공연장"} 
                        />
                      </div>
                    ) : (
                      <div className="showdetail-venue-map">
                        <IconifyIcon icon="mdi:map" width={24} height={24} />
                        <span>주소 정보가 없습니다</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="showdetail-description-empty">공연장 정보가 없습니다.</p>
                )}
              </div>
            </div>
          )}

          {activeTab === "booking" && (
            <div className="showdetail-tab-panel">
              <div className="showdetail-booking-guide">
                <h3 className="showdetail-section-subtitle">예매 안내</h3>
                <div className="showdetail-guide-content">
                  <div className="showdetail-guide-item">
                    <IconifyIcon icon="mdi:information" width={20} height={20} />
                    <div>
                      <strong>예매 방법</strong>
                      <p>원하시는 날짜와 시간을 선택한 후 예매하기 버튼을 클릭해주세요.</p>
                    </div>
                  </div>
                  <div className="showdetail-guide-item">
                    <IconifyIcon icon="mdi:credit-card" width={20} height={20} />
                    <div>
                      <strong>결제 방법</strong>
                      <p>신용카드, 체크카드, 계좌이체 등 다양한 결제 수단을 이용하실 수 있습니다.</p>
                    </div>
                  </div>
                  <div className="showdetail-guide-item">
                    <IconifyIcon icon="mdi:ticket-confirmation" width={20} height={20} />
                    <div>
                      <strong>티켓 수령</strong>
                      <p>예매 완료 후 이메일로 티켓이 발송됩니다. 공연 당일 현장에서도 수령 가능합니다.</p>
                    </div>
                  </div>
                  <div className="showdetail-guide-item">
                    <IconifyIcon icon="mdi:alert-circle" width={20} height={20} />
                    <div>
                      <strong>취소 및 환불</strong>
                      <p>공연일 7일 전까지 취소 시 전액 환불됩니다. 자세한 내용은 고객센터로 문의해주세요.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
