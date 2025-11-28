// ===================================
// 사용자 정보
// ===================================

export interface User {
  uid: string;
  email: string;
  nickname: string;
  phone?: string | null;
  birthYear?: number | null;
  provider: "email" | "google" | "kakao";
  role?: "user" | "admin" | "banned"; // 사용자 역할
  ticketCount: number;
  createdAt: any; // Firestore Timestamp
  updatedAt: any;
}

// ===================================
// 공연 정보
// ===================================

// 날짜-시간 구조 (멜론 스타일)
export interface ShowDateTime {
  date: string; // ISO date string (예: "2025-11-28")
  times: string[]; // 시간 배열 (예: ["15:00", "20:00"])
}

export interface Show {
  showId: string;
  artist: string;
  tourName: string;
  venueId: string;
  city: string;
  dates: string[]; // ISO date strings (기존 호환성 유지)
  dateTimes?: ShowDateTime[]; // 날짜-시간 구조 (멜론 스타일, 우선 사용)
  posterUrl: string;
  priceTable: PriceTable;
  description?: string;
  genre?: string; // 하위 장르 (K-POP, Pop, Rock 등)
  category?: "concert" | "musical" | "classical" | "festival" | "sports"; // API 기반 카테고리
  ticketStatus: TicketStatus;
  seatGrades: string[];
  
  // 랭킹 및 인기도 관련
  viewCount?: number; // 조회수 (Firestore에서 관리)
  popularity?: number; // 인기 지수 (API score 또는 자체 계산)
  bookingCount?: number; // 예매 건수 (Firestore에서 관리)
  
  // 티켓 오픈 정보
  ticketOpenDate?: string; // 티켓 오픈일 (ISO date) - 관리자 입력 또는 API
  presaleOpenDate?: string; // 선예매 오픈일 (ISO date)
  onsaleEndDate?: string; // 판매 종료일 (ISO date)
  
  // 추가 정보
  organizer?: string; // 주최사
  bookingLink?: string; // 예매 링크 (멜론티켓/인터파크 등)
  venueName?: string; // 공연장 이름 (리스트에서 전달용)
  runningTime?: string; // 관람시간
  createdAt?: any; // 등록일 (Firestore Timestamp)
  updatedAt?: any; // 수정일 (Firestore Timestamp)
}

// 가격표
export type PriceTable = Record<string, number>;

// 티켓 상태
export type TicketStatus = "upcoming" | "presale" | "onsale" | "soldout";

// 공연장 정보
export interface Venue {
  venueId: string;
  name: string;
  city: string;
  address: string;
  lat: number;
  lng: number;
  capacity: number;
  seatMapFile: string; // JSON 파일명
  description?: string;
  imageUrl?: string;
}

// 좌석 정보
export interface Seat {
  seatId: string;
  section: string; // A, B, C, Standing 등
  row?: string;
  number?: string;
  grade: string; // VIP, R, S, A, Standing
  x: number; // 좌석맵 좌표
  y: number;
  status: SeatStatus;
}

export type SeatStatus = "available" | "reserved" | "soldout" | "hold";

// 좌석맵 데이터
export interface SeatMap {
  venueId: string;
  sections: SeatSection[];
  standingAreas?: StandingArea[];
}

export interface SeatSection {
  sectionId: string;
  name: string;
  grade: string;
  rows: SeatRow[];
}

export interface SeatRow {
  rowId: string;
  seats: Seat[];
}

export interface StandingArea {
  areaId: string;
  name: string;
  grade: string;
  capacity: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

// 선택된 좌석 정보
export interface SelectedSeat {
  seatId: string;
  showId: string;
  date: string;
  section: string;
  row?: string;
  number?: string;
  grade: string;
  price: number;
}

// 주문 정보
export interface Order {
  orderId: string;
  userId: string;
  showId: string;
  date: string;
  seats: SelectedSeat[];
  totalAmount: number;
  buyerInfo: BuyerInfo;
  paymentInfo?: PaymentInfo;
  qrCodeUrl?: string;
  status: OrderStatus;
  createdAt: string;
}

export type OrderStatus = "pending" | "confirmed" | "cancelled" | "refunded";

// 예매자 정보
export interface BuyerInfo {
  name: string;
  phone: string;
  email: string;
}

// 결제 정보
export interface PaymentInfo {
  method: PaymentMethod;
  cardNumber?: string;
  approvalNumber?: string;
  paidAt?: string;
}

export type PaymentMethod = "card" | "bank" | "toss" | "kakao";

// 선예매 코드
export interface PresaleCode {
  codeId: string;
  code: string;
  showId: string;
  validUntil: string;
  isUsed: boolean;
  usedBy?: string;
  type: "fanclub" | "official" | "special";
}

// 필터 옵션
export interface ShowFilters {
  city?: string;
  venue?: string;
  dateFrom?: string;
  dateTo?: string;
  genre?: string;
  ticketStatus?: TicketStatus;
  priceMin?: number;
  priceMax?: number;
}

// 기존 User 타입은 상단의 새로운 User 타입으로 대체됨

// ===================================
// 공지사항
// ===================================

export interface Notice {
  id: string;
  title: string;
  content: string;
  important: boolean; // 중요 공지 여부
  createdAt: any; // Firestore Timestamp
  updatedAt: any; // Firestore Timestamp
}

// ===================================
// 1:1 문의
// ===================================

export type InquiryCategory = 
  | "booking" // 예매/결제
  | "refund" // 환불/취소
  | "account" // 회원정보
  | "event" // 공연/행사
  | "other"; // 기타

export interface Inquiry {
  id: string;
  userId: string;
  userEmail: string;
  category: InquiryCategory; // 문의 카테고리
  title: string;
  content: string;
  status: "pending" | "answered";
  answer?: string;
  createdAt: any; // Firestore Timestamp
  answeredAt?: any; // Firestore Timestamp
}

// ===================================
// 이벤트 시스템
// ===================================

// 이벤트 상태
export type EventStatus = "scheduled" | "ongoing" | "ended";

// 이벤트 정보
export interface Event {
  id: string;
  title: string; // 이벤트 제목
  description: string; // 이벤트 설명
  imageUrl: string; // 썸네일 이미지
  bannerUrl?: string; // 배너 이미지 (선택)
  startDate: any; // 이벤트 시작일 (Firestore Timestamp)
  endDate: any; // 이벤트 종료일 (Firestore Timestamp)
  announcementDate: any; // 당첨자 발표일 (Firestore Timestamp)
  status: EventStatus; // 이벤트 상태
  benefits: string; // 이벤트 혜택 설명
  conditions: string; // 참여 조건
  maxParticipantsPerUser: number; // 1인당 최대 참여 횟수 (기본: 1)
  viewCount: number; // 조회수
  participantCount: number; // 참여자 수
  winnerCount: number; // 당첨자 수
  isWinnerAnnounced: boolean; // 당첨자 발표 여부
  createdAt: any; // 생성일 (Firestore Timestamp)
  updatedAt: any; // 수정일 (Firestore Timestamp)
}

// 이벤트 참여 정보
export interface EventParticipant {
  id: string; // 문서 ID (userId와 동일)
  eventId: string; // 이벤트 ID
  userId: string; // 사용자 ID
  email: string; // 이메일
  phone: string; // 전화번호
  nickname: string; // 닉네임
  agreePrivacy: boolean; // 개인정보 수집 동의
  agreeEvent: boolean; // 이벤트 참여 동의
  agreeSms: boolean; // 문자 알림 동의 (선택)
  participatedAt: any; // 참여일 (Firestore Timestamp)
}

// 이벤트 당첨자 정보
export interface EventWinner {
  id: string; // 문서 ID
  eventId: string; // 이벤트 ID
  userId: string; // 사용자 ID
  email: string; // 이메일 (마스킹 처리됨)
  phone: string; // 전화번호 (마스킹 처리됨)
  nickname: string; // 닉네임
  selectedAt: any; // 당첨 선정일 (Firestore Timestamp)
  notified: boolean; // 알림 발송 여부
}

// 이벤트 필터 타입
export type EventFilterType = "all" | "winners" | "my_events";

// 이벤트 정렬 타입
export type EventSortType = "latest" | "deadline" | "popular";

