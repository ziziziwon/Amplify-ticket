/**
 * Firestore에서 공연 목록을 가져오는 API
 * 
 * 사용법:
 * const events = await fetchEvents('concert');
 * const allEvents = await fetchEvents();
 */

import { db } from "../firebase/config";
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  QueryConstraint,
} from "firebase/firestore";

// 공연 데이터 타입
export interface EventItem {
  id: string;
  showId: string;
  title: string;
  artist: string;
  tourName: string;
  category: string;      // concert | musical | classical | festival | sports
  genre: string;
  dates: string[];
  city: string;
  venueId: string;
  posterUrl: string;
  ticketStatus: string;  // upcoming | presale | onsale | soldout
  ticketOpenDate?: string;
  priceTable: {
    [grade: string]: number;
  };
  description?: string;
  popularity: number;
  createdAt?: any;
  updatedAt?: any;
  // ⭐ Ticketmaster 전용 필드 (선택적)
  ticketmasterUrl?: string;
  ticketmasterEventId?: string;
  venueName?: string;
  // ⭐ KOPIS 전용 필드 (선택적)
  kopisId?: string;
  // ⭐ 멜론티켓 전용 필드 (선택적)
  link?: string;
  bookingLink?: string;
}

// 정렬 타입
export type SortType = "latest" | "popularity" | "deadline" | "price_low" | "price_high";

/**
 * 카테고리별 공연 목록 가져오기
 * 
 * @param category - 카테고리 (concert, musical, classical, festival, sports)
 * @param sortType - 정렬 방식 (latest, popularity, deadline, price_low, price_high)
 * @returns EventItem 배열
 */
export async function fetchEvents(
  category?: string,
  sortType: SortType = "popularity"
): Promise<EventItem[]> {
  try {
    const constraints: QueryConstraint[] = [];

    // 카테고리 필터
    if (category && category !== "all") {
      constraints.push(where("category", "==", category));
    }

    // 정렬 (Firestore에서 가능한 것만)
    if (sortType === "popularity") {
      constraints.push(orderBy("popularity", "desc"));
    } else if (sortType === "latest" || sortType === "deadline") {
      constraints.push(orderBy("dates", "asc"));
    }

    // 쿼리 실행
    const q = query(collection(db, "shows"), ...constraints);
    const snapshot = await getDocs(q);

    // 데이터 매핑
    let events: EventItem[] = snapshot.docs.map((doc) => ({
      id: doc.id,
      showId: doc.id,
      ...doc.data(),
    })) as EventItem[];

    // 예정된 공연만 필터링 (과거 공연 제외)
    const now = new Date();
    events = events.filter((event) => {
      const eventDate = new Date(event.dates[0]);
      return eventDate > now;
    });

    // 가격 정렬은 클라이언트에서 처리 (Firestore에서 불가능)
    if (sortType === "price_low") {
      events.sort((a, b) => {
        const minPriceA = Math.min(...Object.values(a.priceTable));
        const minPriceB = Math.min(...Object.values(b.priceTable));
        return minPriceA - minPriceB;
      });
    } else if (sortType === "price_high") {
      events.sort((a, b) => {
        const maxPriceA = Math.max(...Object.values(a.priceTable));
        const maxPriceB = Math.max(...Object.values(b.priceTable));
        return maxPriceB - maxPriceA;
      });
    }

    return events;
  } catch (error) {
    console.error("❌ fetchEvents 오류:", error);
    throw error;
  }
}

/**
 * 티켓 오픈 예정 공연 가져오기
 * 
 * @param limitCount - 가져올 개수
 * @returns EventItem 배열
 */
export async function fetchUpcomingEvents(limitCount: number = 10): Promise<EventItem[]> {
  try {
    const q = query(
      collection(db, "shows"),
      where("ticketStatus", "==", "upcoming"),
      orderBy("ticketOpenDate", "asc")
    );

    const snapshot = await getDocs(q);
    const events: EventItem[] = snapshot.docs
      .map((doc) => ({
        id: doc.id,
        showId: doc.id,
        ...doc.data(),
      }))
      .slice(0, limitCount) as EventItem[];

    return events;
  } catch (error) {
    console.error("❌ fetchUpcomingEvents 오류:", error);
    throw error;
  }
}

/**
 * 인기 공연 가져오기
 * 
 * @param limitCount - 가져올 개수
 * @returns EventItem 배열
 */
export async function fetchPopularEvents(limitCount: number = 10): Promise<EventItem[]> {
  try {
    const q = query(
      collection(db, "shows"),
      where("ticketStatus", "==", "onsale"),
      orderBy("popularity", "desc")
    );

    const snapshot = await getDocs(q);
    const events: EventItem[] = snapshot.docs
      .map((doc) => ({
        id: doc.id,
        showId: doc.id,
        ...doc.data(),
      }))
      .slice(0, limitCount) as EventItem[];

    return events;
  } catch (error) {
    console.error("❌ fetchPopularEvents 오류:", error);
    throw error;
  }
}

