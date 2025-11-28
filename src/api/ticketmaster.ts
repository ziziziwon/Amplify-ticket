/**
 * Ticketmaster Discovery API 연동
 * 
 * 전 세계 공연 데이터 중 한국(KR) 공연만 필터링하여 가져옵니다.
 * 
 * API Documentation: https://developer.ticketmaster.com/products-and-docs/apis/discovery-api/v2/
 */

import axios from "axios";
import { EventItem } from "./fetchEvents";

const API_KEY = process.env.REACT_APP_TICKETMASTER_API_KEY;
const BASE_URL = "https://app.ticketmaster.com/discovery/v2/events.json";

// Ticketmaster API 응답 타입
interface TicketmasterEvent {
  id: string;
  name: string;
  url: string;
  images?: Array<{
    url: string;
    ratio?: string;
    width?: number;
    height?: number;
  }>;
  dates?: {
    start?: {
      localDate?: string;
      localTime?: string;
    };
    status?: {
      code?: string;
    };
  };
  classifications?: Array<{
    segment?: {
      name?: string;
    };
    genre?: {
      name?: string;
    };
  }>;
  priceRanges?: Array<{
    type?: string;
    currency?: string;
    min?: number;
    max?: number;
  }>;
  _embedded?: {
    venues?: Array<{
      name?: string;
      city?: {
        name?: string;
      };
      country?: {
        name?: string;
        countryCode?: string;
      };
      address?: {
        line1?: string;
      };
    }>;
  };
}

interface TicketmasterResponse {
  _embedded?: {
    events?: TicketmasterEvent[];
  };
  page?: {
    size?: number;
    totalElements?: number;
    totalPages?: number;
    number?: number;
  };
}

/**
 * 한국 내한 공연 데이터 가져오기
 * 
 * @param category - 카테고리 (concert, sports 등) - 선택사항
 * @param page - 페이지 번호 (0부터 시작)
 * @param size - 페이지당 결과 수
 * @returns EventItem 배열
 */
export async function fetchKoreanConcerts(
  category?: string,
  page: number = 0,
  size: number = 50  // ⭐ 50개로 늘림 (페이지네이션용)
): Promise<EventItem[]> {
  if (!API_KEY) {
    console.warn("⚠️  Ticketmaster API 키가 설정되지 않았습니다.");
    return [];
  }

  try {
    // API 요청 파라미터
    const params: Record<string, string | number> = {
      apikey: API_KEY,
      countryCode: "US", // 🇺🇸 미국 데이터 (한국은 데이터 없음)
      locale: "en",      // 영어
      page,
      size,
    };

    // 카테고리 필터 (music, sports 등)
    if (category) {
      if (category === "concert" || category === "musical" || category === "classical" || category === "festival") {
        params.classificationName = "music";
      } else if (category === "sports") {
        params.classificationName = "sports";
      }
    } else {
      params.classificationName = "music";
    }

    console.log("🎫 Ticketmaster API 호출:", params);

    const response = await axios.get<TicketmasterResponse>(BASE_URL, { params });
    const events = response.data._embedded?.events || [];

    console.log(`✅ Ticketmaster에서 ${events.length}개의 공연 데이터 로드`);

    // Ticketmaster 데이터를 우리 형식으로 변환
    const converted = events.map((ev: TicketmasterEvent) => convertTicketmasterToEventItem(ev));
    
    // ⭐ 같은 공연을 그룹화 (같은 이름의 공연은 날짜만 합침)
    const groupedMap = new Map<string, EventItem>();
    
    converted.forEach(event => {
      const key = event.title; // 공연 이름으로 그룹화
      
      if (groupedMap.has(key)) {
        // 이미 존재하면 날짜만 추가
        const existing = groupedMap.get(key)!;
        const allDates = [...existing.dates, ...event.dates];
        // 날짜 중복 제거 및 정렬
        const uniqueDates = Array.from(new Set(allDates)).sort();
        existing.dates = uniqueDates;
      } else {
        // 새로운 공연 추가
        groupedMap.set(key, { ...event });
      }
    });
    
    const groupedEvents = Array.from(groupedMap.values());
    
    console.log(`🎯 그룹화 후: ${converted.length}개 → ${groupedEvents.length}개`);
    
    return groupedEvents;
  } catch (error) {
    console.error("❌ Ticketmaster API 오류:", error);
    
    if (axios.isAxiosError(error)) {
      const axiosError = error as any;
      if (axiosError.response?.status === 401) {
        console.error("🔑 API 키가 유효하지 않습니다. .env 파일을 확인하세요.");
      } else if (axiosError.response?.status === 429) {
        console.error("⏱️  API 호출 제한에 도달했습니다. 잠시 후 다시 시도하세요.");
      }
    }
    
    return [];
  }
}

/**
 * 특정 아티스트의 한국 공연 검색
 * 
 * @param artistName - 아티스트 이름
 * @returns EventItem 배열
 */
export async function searchKoreanConcerts(artistName: string): Promise<EventItem[]> {
  if (!API_KEY) {
    console.warn("⚠️  Ticketmaster API 키가 설정되지 않았습니다.");
    return [];
  }

  try {
    const params = {
      apikey: API_KEY,
      countryCode: "KR",
      locale: "ko-KR",
      keyword: artistName,
      classificationName: "music",
      size: 50,
    };

    const response = await axios.get<TicketmasterResponse>(BASE_URL, { params });
    const events = response.data._embedded?.events || [];

    console.log(`🔍 "${artistName}" 검색 결과: ${events.length}개`);

    return events.map((ev: TicketmasterEvent) => convertTicketmasterToEventItem(ev));
  } catch (error) {
    console.error("❌ Ticketmaster 검색 오류:", error);
    return [];
  }
}

/**
 * Ticketmaster 데이터를 우리 EventItem 형식으로 변환
 */
function convertTicketmasterToEventItem(ev: TicketmasterEvent): EventItem {
  // 이미지 선택 (16:9 비율 우선, 없으면 첫 번째)
  const image = ev.images?.find((img) => img.ratio === "16_9") || ev.images?.[0];
  
  // 가격 범위
  const priceRange = ev.priceRanges?.[0];
  const priceTable: Record<string, number> = {};
  
  if (priceRange) {
    if (priceRange.min) priceTable["최저가"] = priceRange.min;
    if (priceRange.max) priceTable["최고가"] = priceRange.max;
  } else {
    priceTable["일반"] = 0; // 가격 정보 없음
  }

  // 카테고리 매핑 (더 세밀하게)
  const segment = ev.classifications?.[0]?.segment?.name?.toLowerCase() || "";
  const genreName = ev.classifications?.[0]?.genre?.name?.toLowerCase() || "";
  let category = "concert";
  
  if (segment.includes("sport")) {
    category = "sports";
  } else if (segment.includes("arts") || segment.includes("theatre")) {
    category = "musical";
  } else if (genreName.includes("classical") || genreName.includes("opera")) {
    category = "classical";
  } else if (genreName.includes("festival")) {
    category = "festival";
  } else if (segment.includes("music")) {
    category = "concert";
  }

  // 장르
  const genre = ev.classifications?.[0]?.genre?.name || "기타";

  // 공연장 정보
  const venue = ev._embedded?.venues?.[0];
  const venueName = venue?.name || "미정";
  const city = venue?.city?.name || "Seoul";

  // 날짜
  const localDate = ev.dates?.start?.localDate || new Date().toISOString().split("T")[0];

  return {
    id: `tm_${ev.id}`,
    showId: `tm_${ev.id}`,
    title: ev.name,
    artist: ev.name,
    tourName: ev.name,
    category,
    genre,
    dates: [localDate],
    city,
    venueId: `venue_${venue?.name?.replace(/\s/g, "_")}`,
    posterUrl: image?.url || "https://via.placeholder.com/500x700?text=No+Image",
    ticketStatus: getTicketStatus(ev.dates?.status?.code),
    ticketOpenDate: localDate,
    priceTable,
    description: `${ev.name} - ${venueName}에서 열리는 공연`,
    popularity: 80, // Ticketmaster 데이터는 기본 80점
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

/**
 * Ticketmaster 상태 코드를 우리 형식으로 변환
 */
function getTicketStatus(statusCode?: string): string {
  switch (statusCode) {
    case "onsale":
      return "onsale";
    case "offsale":
      return "soldout";
    case "cancelled":
    case "postponed":
      return "soldout";
    default:
      return "upcoming";
  }
}

/**
 * Ticketmaster API 상태 확인
 */
export async function checkTicketmasterConnection(): Promise<boolean> {
  if (!API_KEY) {
    console.error("❌ Ticketmaster API 키가 없습니다.");
    return false;
  }

  try {
    const response = await axios.get(BASE_URL, {
      params: {
        apikey: API_KEY,
        countryCode: "KR",
        size: 1,
      },
    });
    
    console.log("✅ Ticketmaster API 연결 성공!");
    return true;
  } catch (error) {
    console.error("❌ Ticketmaster API 연결 실패:", error);
    return false;
  }
}

