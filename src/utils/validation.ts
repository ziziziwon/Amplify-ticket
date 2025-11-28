/**
 * AMPLIFY - 입력 값 검증 유틸리티
 */

/**
 * 이메일 형식 검증
 */
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * 비밀번호 검증
 * - 최소 8자
 * - 영문 + 숫자 조합
 */
export const validatePassword = (password: string): { 
  isValid: boolean; 
  errors: string[] 
} => {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push("8자 이상 입력해주세요");
  }

  if (!/[a-zA-Z]/.test(password)) {
    errors.push("영문을 포함해주세요");
  }

  if (!/[0-9]/.test(password)) {
    errors.push("숫자를 포함해주세요");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * 비밀번호 확인 검증
 */
export const validatePasswordConfirm = (
  password: string,
  passwordConfirm: string
): boolean => {
  return password === passwordConfirm && password.length > 0;
};

/**
 * 닉네임 검증
 * - 2-10자
 * - 특수문자 제외
 */
export const validateNickname = (nickname: string): { 
  isValid: boolean; 
  error?: string 
} => {
  if (nickname.length < 2) {
    return { isValid: false, error: "2자 이상 입력해주세요" };
  }

  if (nickname.length > 10) {
    return { isValid: false, error: "10자 이하로 입력해주세요" };
  }

  if (!/^[a-zA-Z0-9가-힣]+$/.test(nickname)) {
    return { isValid: false, error: "특수문자는 사용할 수 없습니다" };
  }

  return { isValid: true };
};

/**
 * 휴대폰 번호 검증 (선택)
 * - 010-1234-5678 or 01012345678
 */
export const validatePhone = (phone: string): boolean => {
  if (!phone) return true; // 선택 필드이므로 빈 값 허용
  const phoneRegex = /^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$/;
  return phoneRegex.test(phone);
};

/**
 * 생년 검증
 * - 1900 ~ 현재년도
 */
export const validateBirthYear = (year: number | null): boolean => {
  if (!year) return true; // 선택 필드
  const currentYear = new Date().getFullYear();
  return year >= 1900 && year <= currentYear;
};

