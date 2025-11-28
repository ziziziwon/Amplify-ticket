/**
 * Hybrid Event API
 * 
 * Ticketmaster (해외 투어) + Firestore (국내 공연) 데이터를 통합하여 제공
 * 
 * 전략:
 * 1. Ticketmaster에서 한국 내한 공연 데이터 가져오기
 * 2. Firestore에서 국내 기획 공연 데이터 가져오기
 * 3. 두 데이터를 합쳐서 반환
 */

import { EventItem, SortType } from "./fetchEvents";
import { fetchEvents as fetchFirestoreEvents } from "./fetchEvents";
import { fetchKoreanConcerts } from "./ticketmaster";

// 데이터 소스 설정
const USE_TICKETMASTER = true; // Ticketmaster API 사용 여부
const USE_FIRESTORE = true;    // Firestore 사용 여부

/**
 * Hybrid: Ticketmaster + Firestore 공연 데이터 통합
 * 
 * @param category - 카테고리
 * @param sortType - 정렬 방식
 * @returns 통합된 EventItem 배열
 */
export async function fetchHybridEvents(
  category?: string,
  sortType: SortType = "popularity"
): Promise<EventItem[]> {
  const results: EventItem[] = [];

  try {
    // 1. Ticketmaster 데이터 (해외 투어 내한 공연)
    if (USE_TICKETMASTER) {
      try {
        const ticketmasterEvents = await fetchKoreanConcerts(category, 0, 50);
        results.push(...ticketmasterEvents);
        console.log(`🎫 Ticketmaster: ${ticketmasterEvents.length}개`);
      } catch (error) {
        console.warn("⚠️  Ticketmaster 데이터 로드 실패, 계속 진행...");
      }
    }

    // 2. Firestore 데이터 (국내 기획 공연)
    if (USE_FIRESTORE) {
      try {
        const firestoreEvents = await fetchFirestoreEvents(category, sortType);
        results.push(...firestoreEvents);
        console.log(`🔥 Firestore: ${firestoreEvents.length}개`);
      } catch (error) {
        console.warn("⚠️  Firestore 데이터 로드 실패, 계속 진행...");
      }
    }

    // 3. 중복 제거 (같은 공연이 두 소스에 모두 있을 경우)
    const uniqueEvents = deduplicateEvents(results);

    // 4. 정렬 적용
    const sortedEvents = sortEvents(uniqueEvents, sortType);

    console.log(`✅ 총 ${sortedEvents.length}개의 공연 로드 (Ticketmaster + Firestore)`);

    return sortedEvents;
  } catch (error) {
    console.error("❌ Hybrid Events 로드 오류:", error);
    return [];
  }
}

/**
 * 중복 이벤트 제거
 * 
 * 같은 공연이 Ticketmaster와 Firestore 양쪽에 있을 수 있으므로
 * 제목과 날짜가 비슷하면 하나만 남김
 */
function deduplicateEvents(events: EventItem[]): EventItem[] {
  const seen = new Map<string, EventItem>();

  for (const event of events) {
    // 키: 제목 + 첫 번째 날짜
    const key = `${event.title.toLowerCase()}_${event.dates[0]}`;
    
    if (!seen.has(key)) {
      seen.set(key, event);
    } else {
      // 이미 있으면 Firestore 데이터 우선 (더 상세함)
      const existing = seen.get(key)!;
      if (!event.id.startsWith("tm_")) {
        seen.set(key, event); // Firestore 데이터로 덮어쓰기
      }
    }
  }

  return Array.from(seen.values());
}

/**
 * 이벤트 정렬
 */
function sortEvents(events: EventItem[], sortType: SortType): EventItem[] {
  const sorted = [...events];

  // 과거 공연 필터링
  const now = new Date();
  const upcoming = sorted.filter((event) => {
    const eventDate = new Date(event.dates[0]);
    return eventDate > now;
  });

  switch (sortType) {
    case "popularity":
      return upcoming.sort((a, b) => b.popularity - a.popularity);
    
    case "latest":
    case "deadline":
      return upcoming.sort(
        (a, b) => new Date(a.dates[0]).getTime() - new Date(b.dates[0]).getTime()
      );
    
    case "price_low":
      return upcoming.sort((a, b) => {
        const minA = Math.min(...Object.values(a.priceTable));
        const minB = Math.min(...Object.values(b.priceTable));
        return minA - minB;
      });
    
    case "price_high":
      return upcoming.sort((a, b) => {
        const maxA = Math.max(...Object.values(a.priceTable));
        const maxB = Math.max(...Object.values(b.priceTable));
        return maxB - maxA;
      });
    
    default:
      return upcoming;
  }
}

/**
 * 데이터 소스 정보 가져오기
 */
export function getDataSources() {
  return {
    ticketmaster: USE_TICKETMASTER,
    firestore: USE_FIRESTORE,
  };
}

