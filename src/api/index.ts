/**
 * AMPLIFY API 모듈
 * 
 * Firestore + Ticketmaster API를 한 곳에서 관리
 */

export {
  fetchEvents,
  fetchUpcomingEvents,
  fetchPopularEvents,
  type EventItem,
  type SortType,
} from "./fetchEvents";

export { fetchEventById } from "./fetchEventById";

export {
  fetchKoreanConcerts,
  searchKoreanConcerts,
  checkTicketmasterConnection,
} from "./ticketmaster";

export { fetchTicketmasterById } from "./fetchTicketmasterById";

export {
  fetchKopisPerformances,
  fetchKopisById,
  checkKopisConnection,
} from "./kopis";

export {
  fetchMelonConcerts,
  fetchMelonConcertById,
  checkMelonServer,
} from "./melon";

export {
  fetchAllMelonConcerts,
  fetchMelonConcertsByCategory,
  fetchMelonOfferList,
  fetchMelonProdList,
} from "./melon-direct";

export {
  getCoordsByAddress,
  type KakaoCoords,
} from "./kakao";

