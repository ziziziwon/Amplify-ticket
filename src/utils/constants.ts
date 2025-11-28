// 좌석 등급별 컬러
export const GRADE_COLORS: Record<string, string> = {
  VIP: "#8B5CF6", // Purple
  PLATINUM: "#F59E0B", // Amber
  R: "#EF4444", // Red
  S: "#3B82F6", // Blue
  A: "#10B981", // Green
  Standing: "#6B7280", // Gray
};

// 티켓 상태별 컬러 및 라벨
export const TICKET_STATUS_CONFIG = {
  upcoming: { label: "오픈예정", color: "#9CA3AF" },
  presale: { label: "선예매", color: "#F59E0B" },
  onsale: { label: "일반판매", color: "#10B981" },
  soldout: { label: "매진", color: "#EF4444" },
};

// 좌석 상태별 컬러
export const SEAT_STATUS_COLORS = {
  available: "#E5E7EB",
  reserved: "#FEE2E2",
  soldout: "#D1D5DB",
  hold: "#FEF3C7",
};

// 도시 목록
export const CITIES = ["Seoul", "Busan", "Incheon", "Daegu"];

// 장르 목록 (레거시 - 하위 호환용)
export const GENRES = ["Pop", "Rock", "K-pop", "EDM", "Hip-hop", "Indie", "Jazz"];

// 🎯 공연 카테고리 (API 기반 - Ticketmaster/Songkick)
export const CATEGORIES = [
  {
    id: "all",
    label: "HOME",
    description: "모든 공연",
  },
  {
    id: "concert",
    label: "콘서트",
    description: "최고의 라이브 공연을 만나보세요",
    subGenres: ["K-POP", "Pop", "Rock", "EDM", "R&B", "Jazz", "Hip-Hop"],
  },
  {
    id: "musical",
    label: "뮤지컬·연극",
    description: "감동과 열정의 무대를 경험하세요",
    subGenres: ["Musical", "Theatre"],
  },
  {
    id: "classical",
    label: "클래식",
    description: "클래식 음악의 아름다움을 느껴보세요",
    subGenres: ["Orchestra", "Opera", "Chamber Music"],
  },
  {
    id: "festival",
    label: "펜클럽·팬미팅",
    description: "아티스트와 함께하는 특별한 만남",
    subGenres: ["펜미팅", "팬사인회", "하이터치", "토크쇼"],
  },
  {
    id: "sports",
    label: "전시·행사",
    description: "다양한 문화 전시와 특별한 행사",
    subGenres: ["전시회", "박람회", "컨벤션", "특별행사"],
  },
] as const;

// 카테고리 타입
export type CategoryId = typeof CATEGORIES[number]["id"];

// 카테고리 색상 (AMPLIFY 브랜드 기반)
export const CATEGORY_COLORS: Record<string, string> = {
  all: "#232323", // Text Dark
  concert: "#4C4F7A", // Mist Indigo
  musical: "#7062A6", // Slate Violet
  classical: "#5B4B8A", // Deep Purple
  festival: "#FF8C55", // Neon Peach
  sports: "#E74C3C", // Red
};

// 결제수단
export const PAYMENT_METHODS = [
  { value: "card", label: "신용카드" },
  { value: "bank", label: "무통장입금" },
  { value: "toss", label: "토스페이" },
  { value: "kakao", label: "카카오페이" },
];

// 1인당 최대 예매 가능 매수
export const MAX_TICKETS_PER_USER = 4;

// 예매 시간 제한 (분)
export const RESERVATION_TIME_LIMIT = 10;

