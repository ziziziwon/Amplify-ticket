import { useState, useEffect } from "react";
import { Show } from "../types";
import showsData from "../data/shows.json";
import { showsService, ShowSortType } from "../firebase/services";
import { fetchEvents, fetchEventById, EventItem, SortType } from "../api";
import { fetchHybridEvents } from "../api/hybridEvents";

// 데이터 소스 설정
// "json" - 로컬 JSON 파일 (개발용)
// "firestore" - Firestore만 사용
// "ticketmaster" - Ticketmaster만 사용
// "hybrid" - Ticketmaster + Firestore 통합 (⭐ 권장)
type DataSource = "json" | "firestore" | "ticketmaster" | "kopis" | "melon" | "melon-direct" | "hybrid";

// ⭐ 데이터 소스 선택
// "json" - 로컬 JSON (개발용)
// "melon" - 멜론티켓 서버 (localhost:4000) ⭐ 진짜 데이터!
// "firestore" - Firestore 데이터베이스
const DATA_SOURCE: DataSource = "melon"; // ⭐ 멜론 서버 연결!

/**
 * 공연 목록을 가져오는 커스텀 훅
 * 실제 사용 시 Firebase에서 데이터를 가져오도록 수정
 */
export function useShows() {
  const [shows, setShows] = useState<Show[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchShows() {
      try {
        setLoading(true);
        
        if (DATA_SOURCE === "firestore") {
          const data = await showsService.getAll();
          setShows(data);
        } else {
          // 로컬 JSON 데이터 사용 (개발용)
          setShows(showsData as unknown as Show[]);
        }
        
        setLoading(false);
      } catch (err) {
        setError(err as Error);
        setLoading(false);
      }
    }

    fetchShows();
  }, []);

  return { shows, loading, error };
}

/**
 * 카테고리별 공연 목록을 가져오는 커스텀 훅
 * 
 * ⭐ Hybrid 버전: Ticketmaster + Firestore + JSON 지원
 * 
 * @param category - 카테고리 ID (concert, musical, classical, festival, sports, all)
 * @param sortType - 정렬 타입 (latest, popularity, deadline, price_low, price_high)
 */
export function useShowsByCategory(category: string, sortType: ShowSortType = "latest") {
  const [shows, setShows] = useState<Show[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchShows() {
      try {
        setLoading(true);
        
        if (DATA_SOURCE === "hybrid") {
          // ⭐ Hybrid: Ticketmaster + Firestore
          console.log("🌐 Hybrid 모드: Ticketmaster + Firestore 데이터 로드");
          const data = await fetchHybridEvents(category, sortType as SortType);
          setShows(data as unknown as Show[]);
        } else if (DATA_SOURCE === "firestore") {
          // Firestore만 사용
          console.log("🔥 Firestore 모드");
          const data = await fetchEvents(category, sortType as SortType);
          setShows(data as unknown as Show[]);
        } else if (DATA_SOURCE === "ticketmaster") {
          // Ticketmaster만 사용
          console.log("🎫 Ticketmaster 모드");
          const { fetchKoreanConcerts } = await import("../api/ticketmaster");
          const data = await fetchKoreanConcerts(category);
          setShows(data as unknown as Show[]);
        } else if (DATA_SOURCE === "kopis") {
          // ⭐ KOPIS API 사용 (한국 공연 전문)
          console.log("🎭 KOPIS 모드: 한국문화정보원 API");
          const { fetchKopisPerformances } = await import("../api/kopis");
          const data = await fetchKopisPerformances(category);
          setShows(data as unknown as Show[]);
        } else if (DATA_SOURCE === "melon") {
          // ⭐ 멜론티켓 크롤링 사용
          console.log(`🎭 멜론티켓 모드: ${category} 데이터 로드 (정렬: ${sortType})`);
          const { fetchMelonConcerts } = await import("../api/melon");
          const data = await fetchMelonConcerts(category, sortType);
          setShows(data as unknown as Show[]);
        } else if (DATA_SOURCE === "melon-direct") {
          // ⭐ 멜론티켓 직접 호출 (Puppeteer 불필요!)
          console.log("🎭 멜론티켓 Direct 모드: axios 직접 호출");
          const { fetchMelonConcertsByCategory } = await import("../api/melon-direct");
          const data = await fetchMelonConcertsByCategory(category);
          setShows(data as unknown as Show[]);
        } else {
          // 로컬 JSON 데이터 사용 (개발용)
          console.log("📂 JSON 모드: 로컬 데이터 사용");
          let filtered = showsData as unknown as Show[];
          
          // 카테고리 필터링 (category 필드가 있는 경우만)
          if (category !== "all" && filtered.length > 0 && filtered[0].category) {
            filtered = filtered.filter((show) => show.category === category);
            console.log(`🔍 카테고리 "${category}" 필터링: ${filtered.length}개`);
          } else {
            // category 필드가 없으면 모든 데이터 표시
            console.log(`📋 전체 데이터 표시: ${filtered.length}개`);
          }
          
          // 예정된 공연만
          const beforeFilter = filtered.length;
          filtered = filtered.filter((show) => new Date(show.dates[0]) > new Date());
          console.log(`📅 예정된 공연만 필터링: ${beforeFilter}개 → ${filtered.length}개`);
          
          // 정렬
          switch (sortType) {
            case "latest":
              filtered.sort((a, b) => new Date(a.dates[0]).getTime() - new Date(b.dates[0]).getTime());
              break;
            case "popularity":
              const statusPriority: Record<string, number> = { onsale: 1, presale: 2, upcoming: 3, soldout: 4 };
              filtered.sort((a, b) => {
                const priorityA = statusPriority[a.ticketStatus] || 999;
                const priorityB = statusPriority[b.ticketStatus] || 999;
                return priorityA - priorityB;
              });
              break;
            case "deadline":
              filtered.sort((a, b) => new Date(a.dates[0]).getTime() - new Date(b.dates[0]).getTime());
              break;
            case "price_low":
              filtered.sort((a, b) => {
                const minPriceA = Math.min(...Object.values(a.priceTable));
                const minPriceB = Math.min(...Object.values(b.priceTable));
                return minPriceA - minPriceB;
              });
              break;
            case "price_high":
              filtered.sort((a, b) => {
                const maxPriceA = Math.max(...Object.values(a.priceTable));
                const maxPriceB = Math.max(...Object.values(b.priceTable));
                return maxPriceB - maxPriceA;
              });
              break;
          }
          
          setShows(filtered);
        }
        
        setLoading(false);
      } catch (err) {
        setError(err as Error);
        setLoading(false);
      }
    }

    fetchShows();
  }, [category, sortType]);

  return { shows, loading, error };
}

/**
 * 특정 공연 정보를 가져오는 커스텀 훅
 */
export function useShow(showId: string) {
  const [show, setShow] = useState<Show | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchShow() {
      try {
        setLoading(true);
        
        if (DATA_SOURCE === "hybrid" || DATA_SOURCE === "firestore") {
          const data = await fetchEventById(showId);
          setShow(data as unknown as Show);
        } else {
          // 로컬 JSON 데이터 사용 (개발용)
          const shows = showsData as unknown as Show[];
          const found = shows.find((s) => s.showId === showId);
          setShow(found || null);
        }
        
        setLoading(false);
      } catch (err) {
        setError(err as Error);
        setLoading(false);
      }
    }

    fetchShow();
  }, [showId]);

  return { show, loading, error };
}

