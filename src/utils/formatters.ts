/**
 * 날짜 정규화 함수 - 다양한 날짜 형식을 "YYYY-MM-DD" 형식으로 변환
 * @param raw - 원본 날짜 문자열 (예: "2026.03.14", "2026년 03월 14일", "20260314", "2026-03-14")
 * @returns 정규화된 날짜 문자열 (예: "2026-03-14")
 */
export function normalizeDate(raw: string | undefined | null): string {
  if (!raw) return "";
  
  const str = String(raw).trim();
  if (!str || str === "undefined" || str === "null" || str === "NaN") return "";
  
  // 1) 특수문자 제거 → 숫자만 추출
  const numbers = str.replace(/[^0-9]/g, "");
  
  // 2) 길이가 8자리면 YYYYMMDD로 가정
  if (numbers.length === 8) {
    const y = numbers.slice(0, 4);
    const m = numbers.slice(4, 6);
    const d = numbers.slice(6, 8);
    return `${y}-${m}-${d}`; // JS가 읽을 수 있는 포맷
  }
  
  // 3) 이미 ISO 형식인 경우 (YYYY-MM-DD)
  const isoMatch = str.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (isoMatch) {
    const [, year, month, day] = isoMatch;
    return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }
  
  // 4) 점(.)으로 구분된 형식 (YYYY.MM.DD)
  const dotMatch = str.match(/^(\d{4})\.(\d{1,2})\.(\d{1,2})/);
  if (dotMatch) {
    const [, year, month, day] = dotMatch;
    return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }
  
  // 5) 한글 포함 형식 (YYYY년 MM월 DD일)
  const koreanMatch = str.match(/(\d{4})년\s*(\d{1,2})월\s*(\d{1,2})일/);
  if (koreanMatch) {
    const [, year, month, day] = koreanMatch;
    return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }
  
  console.warn("normalizeDate 실패:", raw);
  return str; // fallback
}

/**
 * 날짜 파싱 함수 - 다양한 날짜 형식 지원
 */
function parseDateString(raw: string | undefined | null): Date | null {
  if (!raw) return null;
  
  const normalized = normalizeDate(raw);
  if (!normalized) return null;
  
  const date = new Date(normalized);
  if (!isNaN(date.getTime())) {
    return date;
  }
  
  return null;
}

// 날짜 포맷팅
export function formatDate(dateString: string | undefined | null): string {
  if (!dateString) return "날짜 미정";
  
  const date = parseDateString(dateString);
  
  if (!date || isNaN(date.getTime())) {
    return "날짜 미정";
  }
  
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const weekday = ["일", "월", "화", "수", "목", "금", "토"][date.getDay()];
  
  return `${year}.${month}.${day} (${weekday})`;
}

/**
 * 한국어 날짜 포맷팅 (멜론 스타일)
 * @param dateString - 날짜 문자열 (다양한 형식 지원)
 * @returns "2026년 3월 14일 토요일" 형식의 문자열
 */
export function formatKoreanDate(dateString: string | undefined | null): string {
  if (!dateString) return "날짜 미정";
  
  const normalized = normalizeDate(dateString);
  if (!normalized) return "날짜 미정";
  
  const date = new Date(normalized);
  if (isNaN(date.getTime())) {
    console.warn("formatKoreanDate: 유효하지 않은 날짜:", dateString);
    return "날짜 미정";
  }
  
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const weekday = ["일", "월", "화", "수", "목", "금", "토"][date.getDay()];
  
  return `${year}년 ${month}월 ${day}일 ${weekday}요일`;
}

// 시간 포맷팅
export function formatTime(dateString: string): string {
  const date = new Date(dateString);
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  
  return `${hours}:${minutes}`;
}

// 가격 포맷팅
export function formatPrice(price: number): string {
  return price.toLocaleString("ko-KR") + "원";
}

// 좌석 정보 포맷팅
export function formatSeatInfo(seat: { section: string; row?: string; number?: string }): string {
  if (seat.row && seat.number) {
    return `${seat.section}구역 ${seat.row}열 ${seat.number}번`;
  }
  return `${seat.section}구역`;
}

// 전화번호 포맷팅
export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, "");
  
  if (cleaned.length === 11) {
    return cleaned.replace(/(\d{3})(\d{4})(\d{4})/, "$1-$2-$3");
  } else if (cleaned.length === 10) {
    return cleaned.replace(/(\d{3})(\d{3})(\d{4})/, "$1-$2-$3");
  }
  
  return phone;
}

// 카드번호 마스킹
export function maskCardNumber(cardNumber: string): string {
  const cleaned = cardNumber.replace(/\D/g, "");
  
  if (cleaned.length === 16) {
    return cleaned.replace(/(\d{4})(\d{4})(\d{4})(\d{4})/, "$1-****-****-$4");
  }
  
  return cardNumber;
}

