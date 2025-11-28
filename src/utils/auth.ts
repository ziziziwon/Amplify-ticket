/**
 * AMPLIFY - Firebase 인증 유틸리티
 */

import { auth, db } from "../firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  signInWithPopup,
  User,
} from "firebase/auth";
import {
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  collection,
  where,
  serverTimestamp,
} from "firebase/firestore";

export interface UserProfile {
  nickname: string;
  phone?: string | null;
  birthYear?: number | null;
}

export interface UserData extends UserProfile {
  email: string;
  provider: "email" | "google" | "kakao";
  ticketCount: number;
  createdAt: any;
  updatedAt: any;
}

/**
 * 이메일 중복 확인
 * Firestore 권한 없이도 체크 가능하도록 Auth API 사용
 */
export const checkEmailDuplicate = async (email: string): Promise<boolean> => {
  try {
    // Firebase Auth API 사용 (Firestore 권한 불필요)
    const { fetchSignInMethodsForEmail } = await import("firebase/auth");
    const signInMethods = await fetchSignInMethodsForEmail(auth, email);
    
    // 가입된 이메일이면 signInMethods가 빈 배열이 아님
    const isDuplicate = signInMethods.length > 0;
    console.log(`📧 이메일 중복 체크: ${email} → ${isDuplicate ? "이미 가입됨" : "사용 가능"}`);
    return isDuplicate;
  } catch (error: any) {
    // auth/invalid-email 등의 에러는 무시
    if (error.code === "auth/invalid-email") {
      return false;
    }
    console.error("❌ Email duplicate check error:", error);
    throw new Error("이메일 확인 중 오류가 발생했습니다.");
  }
};

/**
 * 이메일 회원가입
 */
export const signUpWithEmail = async (
  email: string,
  password: string,
  profile: UserProfile
): Promise<User> => {
  try {
    console.log("🔥 회원가입 시작:", email);
    
    // Firebase Auth 계정 생성
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    
    console.log("✅ Auth 계정 생성 완료:", userCredential.user.uid);

    // Firestore에 사용자 데이터 저장
    const userDocRef = doc(db, "users", userCredential.user.uid);
    const userData = {
      email: email,
      nickname: profile.nickname || "",
      phone: profile.phone || null,
      birthYear: profile.birthYear || null,
      provider: "email",
      ticketCount: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    
    console.log("📝 Firestore에 저장 시도:", userData);
    
    await setDoc(userDocRef, userData);
    
    console.log("✅ Firestore 저장 완료!");

    return userCredential.user;
  } catch (error: any) {
    console.error("❌ 회원가입 에러:", error);
    console.error("에러 코드:", error.code);
    console.error("에러 메시지:", error.message);
    
    if (error.code === "auth/email-already-in-use") {
      throw new Error("이미 사용 중인 이메일입니다.");
    } else if (error.code === "auth/weak-password") {
      throw new Error("비밀번호가 너무 약합니다.");
    } else if (error.code === "permission-denied") {
      throw new Error("Firestore 권한이 거부되었습니다. Firebase Console에서 보안 규칙을 확인해주세요.");
    } else {
      throw new Error(`회원가입 중 오류가 발생했습니다: ${error.message}`);
    }
  }
};

/**
 * 이메일 로그인
 */
export const signInWithEmail = async (
  email: string,
  password: string
): Promise<User> => {
  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
    return userCredential.user;
  } catch (error: any) {
    console.error("Login error:", error);
    
    if (
      error.code === "auth/user-not-found" ||
      error.code === "auth/wrong-password" ||
      error.code === "auth/invalid-credential"
    ) {
      throw new Error("이메일 또는 비밀번호가 잘못되었습니다.");
    } else {
      throw new Error("로그인 중 오류가 발생했습니다.");
    }
  }
};

/**
 * Google 로그인
 */
export const signInWithGoogle = async (): Promise<User> => {
  try {
    const provider = new GoogleAuthProvider();
    
    // 추가 OAuth 스코프 설정 (필요시)
    provider.addScope('profile');
    provider.addScope('email');
    
    // 사용자 선택 화면 표시 (이미 로그인한 경우에도)
    provider.setCustomParameters({
      prompt: 'select_account'
    });
    
    console.log("🔵 Google 로그인 시작...");
    console.log("현재 도메인:", window.location.origin);
    
    const result = await signInWithPopup(auth, provider);
    
    console.log("✅ Google 로그인 성공:", result.user.uid);
    
    // Firestore에 사용자 정보 확인 및 생성
    const userRef = doc(db, "users", result.user.uid);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      // 처음 로그인하는 경우 사용자 데이터 생성
      console.log("📝 새 사용자 데이터 생성 중...");
      await setDoc(userRef, {
        email: result.user.email,
        nickname: result.user.displayName || "사용자",
        phone: null,
        birthYear: null,
        provider: "google",
        ticketCount: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      console.log("✅ 사용자 데이터 생성 완료");
    } else {
      console.log("✅ 기존 사용자 로그인");
    }
    
    return result.user;
  } catch (error: any) {
    console.error("❌ Google 로그인 에러:", error);
    console.error("에러 코드:", error.code);
    console.error("에러 메시지:", error.message);
    
    // 자세한 에러 처리
    if (error.code === "auth/popup-closed-by-user") {
      throw new Error("로그인이 취소되었습니다.");
    } else if (error.code === "auth/popup-blocked") {
      throw new Error("팝업이 차단되었습니다. 브라우저 설정에서 팝업을 허용해주세요.");
    } else if (error.code === "auth/unauthorized-domain") {
      throw new Error("인증되지 않은 도메인입니다. Firebase Console에서 승인된 도메인을 확인해주세요.");
    } else if (error.code === "auth/operation-not-allowed") {
      throw new Error("Google 로그인이 활성화되지 않았습니다. Firebase Console에서 확인해주세요.");
    } else if (error.code === "auth/network-request-failed") {
      throw new Error("네트워크 오류가 발생했습니다. 인터넷 연결을 확인해주세요.");
    } else {
      throw new Error(`Google 로그인 중 오류가 발생했습니다: ${error.message || error.code || "알 수 없는 오류"}`);
    }
  }
};

/**
 * 로그아웃
 */
export const signOut = async (): Promise<void> => {
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    console.error("Logout error:", error);
    throw new Error("로그아웃 중 오류가 발생했습니다.");
  }
};

/**
 * 사용자 데이터 가져오기
 */
export const getUserData = async (uid: string): Promise<UserData | null> => {
  try {
    const userRef = doc(db, "users", uid);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      return userSnap.data() as UserData;
    }
    
    return null;
  } catch (error) {
    console.error("Get user data error:", error);
    return null;
  }
};

/**
 * 사용자 프로필 업데이트
 */
export const updateUserProfile = async (
  uid: string,
  profile: Partial<UserProfile>
): Promise<void> => {
  try {
    console.log("📝 프로필 업데이트 시작:", uid);
    console.log("업데이트 데이터:", profile);
    
    const userRef = doc(db, "users", uid);
    await setDoc(
      userRef,
      {
        ...profile,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
    
    console.log("✅ 프로필 업데이트 완료!");
  } catch (error: any) {
    console.error("❌ 프로필 업데이트 에러:", error);
    throw new Error("프로필 업데이트 중 오류가 발생했습니다.");
  }
};

/**
 * 기본 회원가입 (이메일 + 비밀번호만)
 * 프로필은 나중에 updateUserProfile로 업데이트
 */
export const signUpBasic = async (
  email: string,
  password: string
): Promise<User> => {
  try {
    console.log("🔥 기본 회원가입 시작:", email);
    
    // Firebase Auth 계정 생성
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    
    console.log("✅ Auth 계정 생성 완료:", userCredential.user.uid);

    // Firestore에 기본 사용자 데이터 저장
    const userDocRef = doc(db, "users", userCredential.user.uid);
    const userData = {
      email: email,
      nickname: "", // 나중에 업데이트
      phone: null,
      birthYear: null,
      provider: "email",
      ticketCount: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    
    console.log("📝 Firestore에 기본 정보 저장 시도");
    
    await setDoc(userDocRef, userData);
    
    console.log("✅ Firestore 기본 정보 저장 완료!");

    return userCredential.user;
  } catch (error: any) {
    console.error("❌ 기본 회원가입 에러:", error);
    
    if (error.code === "auth/email-already-in-use") {
      throw new Error("이미 사용 중인 이메일입니다.");
    } else if (error.code === "auth/weak-password") {
      throw new Error("비밀번호가 너무 약합니다.");
    } else if (error.code === "permission-denied") {
      throw new Error("Firestore 권한이 거부되었습니다. Firebase Console에서 보안 규칙을 확인해주세요.");
    } else {
      throw new Error(`회원가입 중 오류가 발생했습니다: ${error.message}`);
    }
  }
};

