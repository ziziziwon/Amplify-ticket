/**
 * 한국문화정보원 공연예술통합전산망(KOPIS) API 연동
 * 
 * 한국 공연 데이터를 가장 넓게 다루는 공식 API
 * (연극, 뮤지컬, 콘서트, 클래식, 국악, 무용, 페스티벌 등)
 * 
 * API Documentation: https://www.culture.go.kr/openapi/
 */

import axios from "axios";
import { EventItem } from "./fetchEvents";

const API_KEY = process.env.REACT_APP_KOPIS_API_KEY;
// ⭐ 공공데이터포털 실제 API 호출 URL
const BASE_URL = "http://www.kopis.or.kr/openApi/restful/pblprfr";

// KOPIS 장르 코드 매핑
const GENRE_CODES: Record<string, string> = {
  concert: "CCCD", // 대중음악
  musical: "GGGA", // 뮤지컬
  classical: "CCCA", // 클래식
  festival: "AAAA", // 연극 (축제는 별도 없음)
  sports: "EEEB", // 복합
};

// KOPIS API 응답 타입
interface KopisPerformance {
  mt20id: string;        // 공연ID
  prfnm: string;         // 공연명
  prfpdfrom: string;     // 공연시작일
  prfpdto: string;       // 공연종료일
  fcltynm: string;       // 공연시설명(공연장)
  poster: string;        // 포스터이미지
  genrenm: string;       // 공연장르명
  prfstate: string;      // 공연상태 (공연예정, 공연중, 공연완료)
  area?: string;         // 지역
}

interface KopisDetailResponse {
  mt20id: string;
  prfnm: string;
  prfpdfrom: string;
  prfpdto: string;
  fcltynm: string;
  prfcast?: string;      // 출연진
  prfcrew?: string;      // 제작진
  prfruntime?: string;   // 런타임
  prfage?: string;       // 관람연령
  pcseguidance?: string; // 가격
  poster: string;
  sty?: string;          // 소개이미지
  genrenm: string;
  prfstate: string;
  dtguidance?: string;   // 공연시간
}

/**
 * KOPIS XML 응답을 JSON으로 파싱
 */
function parseXML(xmlString: string): any {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlString, "text/xml");
  
  // XML을 간단한 객체로 변환
  const db = xmlDoc.getElementsByTagName("db");
  const results: any[] = [];
  
  for (let i = 0; i < db.length; i++) {
    const item = db[i];
    const obj: any = {};
    
    for (let j = 0; j < item.children.length; j++) {
      const child = item.children[j];
      obj[child.tagName] = child.textContent || "";
    }
    
    results.push(obj);
  }
  
  return results;
}

/**
 * KOPIS 데이터를 EventItem으로 변환
 */
function convertKopisToEventItem(perf: KopisPerformance): EventItem {
  // 날짜 범위 생성
  const startDate = perf.prfpdfrom.replace(/\./g, "-");
  const endDate = perf.prfpdto.replace(/\./g, "-");
  
  // 카테고리 매핑
  let category = "concert";
  const genreLower = perf.genrenm?.toLowerCase() || "";
  
  if (genreLower.includes("뮤지컬")) {
    category = "musical";
  } else if (genreLower.includes("클래식") || genreLower.includes("오페라") || genreLower.includes("국악")) {
    category = "classical";
  } else if (genreLower.includes("축제")) {
    category = "festival";
  } else if (genreLower.includes("콘서트") || genreLower.includes("대중음악")) {
    category = "concert";
  }

  // 티켓 상태 매핑
  let ticketStatus = "upcoming";
  if (perf.prfstate === "공연중") {
    ticketStatus = "onsale";
  } else if (perf.prfstate === "공연완료") {
    ticketStatus = "soldout";
  } else if (perf.prfstate === "공연예정") {
    ticketStatus = "upcoming";
  }

  // 가격 테이블 (기본값)
  const priceTable: Record<string, number> = {
    "R석": 99000,
    "S석": 77000,
    "A석": 55000,
  };

  return {
    id: `kopis_${perf.mt20id}`,
    showId: `kopis_${perf.mt20id}`,
    title: perf.prfnm,
    artist: perf.prfnm,
    tourName: perf.prfnm,
    category,
    genre: perf.genrenm || "기타",
    dates: [startDate, endDate],
    city: perf.area || "서울",
    venueId: `venue_${perf.fcltynm?.replace(/\s/g, "_")}`,
    posterUrl: perf.poster || "https://via.placeholder.com/500x700?text=No+Image",
    ticketStatus,
    ticketOpenDate: startDate,
    priceTable,
    description: `${perf.prfnm} - ${perf.fcltynm}에서 열리는 공연`,
    popularity: 80,
    createdAt: new Date(),
    updatedAt: new Date(),
    // KOPIS 전용 필드
    kopisId: perf.mt20id,
    venueName: perf.fcltynm,
  };
}

/**
 * KOPIS에서 공연 목록 가져오기
 * 
 * @param category - 카테고리 (concert, musical, classical, festival, sports)
 * @param page - 페이지 번호 (1부터 시작)
 * @param rows - 페이지당 결과 수
 * @returns EventItem 배열
 */
export async function fetchKopisPerformances(
  category?: string,
  page: number = 1,
  rows: number = 50
): Promise<EventItem[]> {
  if (!API_KEY) {
    console.warn("⚠️  KOPIS API 키가 설정되지 않았습니다.");
    return [];
  }

  try {
    // 현재 날짜
    const today = new Date();
    const stdate = today.toISOString().split("T")[0].replace(/-/g, "");
    
    // 3개월 후
    const futureDate = new Date();
    futureDate.setMonth(futureDate.getMonth() + 3);
    const eddate = futureDate.toISOString().split("T")[0].replace(/-/g, "");

    // API 요청 파라미터
    const params: Record<string, string | number> = {
      service: API_KEY,
      stdate,
      eddate,
      cpage: page,
      rows,
      signgucode: "",
      signgucodesub: "",
    };

    // 장르 코드 추가
    if (category && GENRE_CODES[category]) {
      params.shcate = GENRE_CODES[category];
    }

    console.log("🎭 KOPIS API 호출:", BASE_URL, params);

    const response = await axios.get(BASE_URL, {
      params,
      responseType: "text", // XML 텍스트로 받기
    });

    // XML 파싱
    const performances = parseXML(response.data);

    console.log(`✅ KOPIS에서 ${performances.length}개의 공연 데이터 로드`);

    // 데이터 변환
    const converted = performances.map((perf: any) => convertKopisToEventItem(perf));
    
    // ⭐ 같은 공연을 그룹화 (같은 이름의 공연은 날짜만 합침)
    const groupedMap = new Map<string, EventItem>();
    
    converted.forEach((event: EventItem) => {
      const key = event.title;
      
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
    console.error("❌ KOPIS API 오류:", error);
    
    if (axios.isAxiosError(error)) {
      const axiosError = error as any;
      if (axiosError.response?.status === 401) {
        console.error("🔑 API 키가 유효하지 않습니다. .env 파일을 확인하세요.");
      }
    }
    
    return [];
  }
}

/**
 * KOPIS에서 특정 공연 상세 정보 가져오기
 * 
 * @param kopisId - KOPIS 공연 ID (kopis_ 접두사 제거한 값)
 * @returns EventItem 또는 null
 */
export async function fetchKopisById(kopisId: string): Promise<EventItem | null> {
  if (!API_KEY) {
    console.warn("⚠️  KOPIS API 키가 설정되지 않았습니다.");
    return null;
  }

  try {
    // kopis_ 접두사 제거
    const id = kopisId.replace("kopis_", "");
    
    console.log(`🎭 KOPIS 상세 조회: ${id}`);

    const response = await axios.get(`${BASE_URL}/${id}`, {
      params: {
        service: API_KEY,
      },
      responseType: "text", // XML 텍스트로 받기
    });

    // XML 파싱
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(response.data, "text/xml");
    const db = xmlDoc.getElementsByTagName("db")[0];
    
    if (!db) {
      console.warn(`⚠️  공연을 찾을 수 없습니다: ${id}`);
      return null;
    }

    // XML에서 데이터 추출
    const detail: any = {};
    for (let i = 0; i < db.children.length; i++) {
      const child = db.children[i];
      detail[child.tagName] = child.textContent || "";
    }

    console.log(`✅ KOPIS 상세 정보 로드: ${detail.prfnm}`);

    // 가격 파싱
    const priceTable: Record<string, number> = {};
    if (detail.pcseguidance) {
      const priceText = detail.pcseguidance;
      // "R석 99,000원, S석 77,000원" 형식 파싱
      const priceMatches = priceText.matchAll(/([가-힣A-Z]+석)\s*([\d,]+)원/g);
      for (const match of priceMatches) {
        const grade = match[1];
        const price = parseInt(match[2].replace(/,/g, ""));
        priceTable[grade] = price;
      }
    }
    
    // 가격 정보 없으면 기본값
    if (Object.keys(priceTable).length === 0) {
      priceTable["R석"] = 99000;
      priceTable["S석"] = 77000;
      priceTable["A석"] = 55000;
    }

    // EventItem으로 변환
    const startDate = detail.prfpdfrom.replace(/\./g, "-");
    const endDate = detail.prfpdto.replace(/\./g, "-");

    let category = "concert";
    const genreLower = detail.genrenm?.toLowerCase() || "";
    
    if (genreLower.includes("뮤지컬")) {
      category = "musical";
    } else if (genreLower.includes("클래식") || genreLower.includes("오페라") || genreLower.includes("국악")) {
      category = "classical";
    } else if (genreLower.includes("축제")) {
      category = "festival";
    }

    let ticketStatus = "upcoming";
    if (detail.prfstate === "공연중") {
      ticketStatus = "onsale";
    } else if (detail.prfstate === "공연완료") {
      ticketStatus = "soldout";
    }

    return {
      id: `kopis_${detail.mt20id}`,
      showId: `kopis_${detail.mt20id}`,
      title: detail.prfnm,
      artist: detail.prfcast || detail.prfnm,
      tourName: detail.prfnm,
      category,
      genre: detail.genrenm || "기타",
      dates: [startDate, endDate],
      city: "서울",
      venueId: `venue_${detail.fcltynm?.replace(/\s/g, "_")}`,
      posterUrl: detail.poster || "https://via.placeholder.com/500x700?text=No+Image",
      ticketStatus,
      ticketOpenDate: startDate,
      priceTable,
      description: detail.dtguidance || `${detail.prfnm} - ${detail.fcltynm}에서 열리는 공연`,
      popularity: 85,
      createdAt: new Date(),
      updatedAt: new Date(),
      kopisId: detail.mt20id,
      venueName: detail.fcltynm,
    };
  } catch (error) {
    console.error("❌ KOPIS 상세 조회 오류:", error);
    return null;
  }
}

/**
 * KOPIS API 상태 확인
 */
export async function checkKopisConnection(): Promise<boolean> {
  if (!API_KEY) {
    console.error("❌ KOPIS API 키가 없습니다.");
    return false;
  }

  try {
    const today = new Date().toISOString().split("T")[0].replace(/-/g, "");
    
    await axios.get(BASE_URL, {
      params: {
        service: API_KEY,
        stdate: today,
        eddate: today,
        cpage: 1,
        rows: 1,
      },
    });
    
    console.log("✅ KOPIS API 연결 성공!");
    return true;
  } catch (error) {
    console.error("❌ KOPIS API 연결 실패:", error);
    return false;
  }
}

