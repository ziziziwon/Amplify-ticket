// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyC7siZLBVhl40GaFmkHtVa90Q86_JdwRQQ",
  authDomain: "amplify-ticket.firebaseapp.com",
  projectId: "amplify-ticket",
  storageBucket: "amplify-ticket.firebasestorage.app",
  messagingSenderId: "887474337924",
  appId: "1:887474337924:web:be1221167a13ddb8f1ead1",
  measurementId: "G-18NFY6R2S8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Analytics (선택사항, 웹에서만 작동)
let analytics;
if (typeof window !== 'undefined') {
  analytics = getAnalytics(app);
}

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;

