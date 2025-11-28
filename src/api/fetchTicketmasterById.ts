/**
 * Ticketmaster에서 특정 공연 상세 정보 가져오기
 */

import axios from "axios";
import { EventItem } from "./fetchEvents";

const API_KEY = process.env.REACT_APP_TICKETMASTER_API_KEY;
const BASE_URL = "https://app.ticketmaster.com/discovery/v2/events";

interface TicketmasterEvent {
  id: string;
  name: string;
  url: string;
  info?: string;
  pleaseNote?: string;
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

/**
 * Ticketmaster ID로 공연 상세 정보 가져오기
 * 
 * @param ticketmasterId - Ticketmaster 이벤트 ID (tm_ 접두사 제거한 값)
 * @returns EventItem 또는 null
 */
export async function fetchTicketmasterById(ticketmasterId: string): Promise<EventItem | null> {
  if (!API_KEY) {
    console.warn("⚠️  Ticketmaster API 키가 설정되지 않았습니다.");
    return null;
  }

  try {
    // tm_ 접두사 제거
    const eventId = ticketmasterId.replace("tm_", "");
    
    console.log(`🎫 Ticketmaster 상세 조회: ${eventId}`);

    const response = await axios.get<TicketmasterEvent>(`${BASE_URL}/${eventId}.json`, {
      params: {
        apikey: API_KEY,
        locale: "en",
      },
    });

    const ev = response.data;

    if (!ev) {
      console.warn(`⚠️  이벤트를 찾을 수 없습니다: ${eventId}`);
      return null;
    }

    console.log(`✅ Ticketmaster 상세 정보 로드: ${ev.name}`);

    // 이미지 선택
    const image = ev.images?.find((img) => img.ratio === "16_9") || ev.images?.[0];

    // 가격 범위
    const priceRange = ev.priceRanges?.[0];
    const priceTable: Record<string, number> = {};

    if (priceRange) {
      if (priceRange.min) priceTable["최저가"] = priceRange.min;
      if (priceRange.max) priceTable["최고가"] = priceRange.max;
    } else {
      priceTable["일반"] = 0;
    }

    // 카테고리 매핑
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
    const localTime = ev.dates?.start?.localTime || "19:00:00";

    // 티켓 상태
    const ticketStatus = getTicketStatus(ev.dates?.status?.code);

    // 상세 설명
    const description = ev.info || ev.pleaseNote || `${ev.name} - ${venueName}에서 열리는 공연`;

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
      ticketStatus,
      ticketOpenDate: localDate,
      priceTable,
      description,
      popularity: 80,
      createdAt: new Date(),
      updatedAt: new Date(),
      // Ticketmaster 전용 필드
      ticketmasterUrl: ev.url,
      ticketmasterEventId: ev.id,
      venueName,
    };
  } catch (error) {
    console.error("❌ Ticketmaster 상세 조회 오류:", error);
    return null;
  }
}

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

