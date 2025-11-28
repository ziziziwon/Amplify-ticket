import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

// Firebase 설정
// 실제 프로젝트 설정값 (amplify-ticket)
const firebaseConfig = {
  apiKey: "AIzaSyC7siZLBVhl40GaFmkHtVa90Q86_JdwRQQ",
  authDomain: "amplify-ticket.firebaseapp.com",
  projectId: "amplify-ticket",
  storageBucket: "amplify-ticket.firebasestorage.app",
  messagingSenderId: "887474337924",
  appId: "1:887474337924:web:be1221167a13ddb8f1ead1",
  measurementId: "G-18NFY6R2S8"
};

// Firebase 초기화
const app = initializeApp(firebaseConfig);

// Firestore 데이터베이스
export const db = getFirestore(app);

// Firebase 인증
export const auth = getAuth(app);

// Firebase 스토리지
export const storage = getStorage(app);

export default app;

