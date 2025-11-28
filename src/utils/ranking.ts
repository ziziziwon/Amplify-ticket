import { Show } from "../types";

/**
 * 공연 랭킹 계산 유틸리티
 * 
 * 랭킹 기준:
 * 1. 조회수 (viewCount) - 40%
 * 2. 예매 건수 (bookingCount) - 30%
 * 3. 인기 지수 (popularity) - 20%
 * 4. 최신순 (createdAt) - 10%
 */

/**
 * 종합 인기 점수 계산
 */
export const calculatePopularityScore = (show: Show): number => {
  const viewCount = show.viewCount || 0;
  const bookingCount = show.bookingCount || 0;
  const popularity = show.popularity || 0;
  const createdAt = show.createdAt?.toDate?.() || new Date(0);
  
  // 최신도 계산 (7일 이내면 높은 점수)
  const daysSinceCreated = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
  const recencyScore = Math.max(0, 100 - daysSinceCreated * 2); // 50일 이후 0점
  
  // 가중치 적용
  const score =
    viewCount * 0.4 +
    bookingCount * 3 * 0.3 + // 예매는 더 중요하므로 x3
    popularity * 0.2 +
    recencyScore * 0.1;
  
  return Math.round(score * 100) / 100;
};

/**
 * 조회수 기반 랭킹
 */
export const getRankingByViews = (shows: Show[], limit: number = 10): Show[] => {
  return [...shows]
    .sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0))
    .slice(0, limit);
};

/**
 * 예매율 기반 랭킹
 */
export const getRankingByBookings = (shows: Show[], limit: number = 10): Show[] => {
  return [...shows]
    .sort((a, b) => (b.bookingCount || 0) - (a.bookingCount || 0))
    .slice(0, limit);
};

/**
 * 인기 지수 기반 랭킹 (종합)
 */
export const getRankingByPopularity = (shows: Show[], limit: number = 10): Show[] => {
  return [...shows]
    .map((show) => ({
      ...show,
      score: calculatePopularityScore(show),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
};

/**
 * 최근 등록순 랭킹
 */
export const getRankingByRecent = (shows: Show[], limit: number = 10): Show[] => {
  return [...shows]
    .sort((a, b) => {
      const aTime = a.createdAt?.toDate?.()?.getTime() || 0;
      const bTime = b.createdAt?.toDate?.()?.getTime() || 0;
      return bTime - aTime;
    })
    .slice(0, limit);
};

/**
 * 지역별 인기 랭킹
 */
export const getRankingByCity = (
  shows: Show[],
  city: string,
  limit: number = 10
): Show[] => {
  return getRankingByPopularity(shows.filter((s) => s.city === city), limit);
};

/**
 * 카테고리별 인기 랭킹
 */
export const getRankingByCategory = (
  shows: Show[],
  category: string,
  limit: number = 10
): Show[] => {
  return getRankingByPopularity(
    shows.filter((s) => s.category === category),
    limit
  );
};

/**
 * 티켓 오픈 예정 공연 (오픈일 기준 정렬)
 */
export const getUpcomingTicketOpens = (shows: Show[], limit: number = 10): Show[] => {
  const now = new Date();
  
  return [...shows]
    .filter((show) => {
      if (!show.ticketOpenDate) return false;
      const openDate = new Date(show.ticketOpenDate);
      return openDate > now; // 아직 오픈 안 한 공연만
    })
    .sort((a, b) => {
      const aDate = new Date(a.ticketOpenDate!).getTime();
      const bDate = new Date(b.ticketOpenDate!).getTime();
      return aDate - bDate; // 가까운 순
    })
    .slice(0, limit);
};

/**
 * 선예매 진행 중인 공연
 */
export const getPresaleShows = (shows: Show[], limit: number = 10): Show[] => {
  const now = new Date();
  
  return [...shows]
    .filter((show) => {
      if (!show.presaleOpenDate || !show.ticketOpenDate) return false;
      const presaleDate = new Date(show.presaleOpenDate);
      const openDate = new Date(show.ticketOpenDate);
      return now >= presaleDate && now < openDate;
    })
    .sort((a, b) => {
      const aDate = new Date(a.ticketOpenDate!).getTime();
      const bDate = new Date(b.ticketOpenDate!).getTime();
      return aDate - bDate;
    })
    .slice(0, limit);
};

/**
 * 매진 임박 공연 (판매율 기준)
 * TODO: 실제 좌석 데이터와 연동 필요
 */
export const getSoldOutSoonShows = (shows: Show[], limit: number = 10): Show[] => {
  return [...shows]
    .filter((show) => show.ticketStatus === "onsale")
    .sort((a, b) => (b.bookingCount || 0) - (a.bookingCount || 0))
    .slice(0, limit);
};

/**
 * 랭킹 타입별 라벨
 */
export const RANKING_TYPES = {
  popular: { label: "인기 랭킹", icon: "🔥" },
  views: { label: "조회수 TOP", icon: "👀" },
  bookings: { label: "예매 TOP", icon: "🎫" },
  recent: { label: "최신 공연", icon: "🆕" },
  ticketOpen: { label: "티켓오픈 예정", icon: "⏰" },
  presale: { label: "선예매 진행중", icon: "⭐" },
  soldOutSoon: { label: "매진임박", icon: "🔴" },
} as const;

export type RankingType = keyof typeof RANKING_TYPES;









