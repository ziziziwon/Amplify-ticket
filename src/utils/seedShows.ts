/**
 * Firestore에 공연 샘플 데이터를 추가하는 유틸리티
 * 
 * 사용법:
 * 1. Firebase 프로젝트 설정 완료 후
 * 2. 콘솔에서: import { seedShows } from './utils/seedShows'; seedShows();
 * 3. 또는 App.tsx에서 개발 모드일 때 자동 실행
 */

import { collection, doc, setDoc, getDocs, Timestamp } from "firebase/firestore";
import { db } from "../firebase/config";

const COLLECTION_NAME = "shows"; // 또는 "events"로 변경 가능

// 샘플 공연 데이터
const sampleShows = [
  // 콘서트
  {
    showId: "show_concert_001",
    title: "2025 Coldplay World Tour",
    artist: "Coldplay",
    tourName: "Music of the Spheres World Tour",
    category: "concert",
    genre: "Rock",
    dates: ["2025-02-15", "2025-02-16", "2025-02-17"],
    city: "Seoul",
    venueId: "venue_gocheok",
    posterUrl: "https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=500",
    ticketStatus: "onsale",
    ticketOpenDate: "2025-01-10T14:00:00",
    priceTable: {
      VIP: 220000,
      R: 165000,
      S: 143000,
      A: 121000,
    },
    description: "전 세계를 열광시킨 Coldplay의 내한 공연",
    popularity: 95,
  },
  {
    showId: "show_concert_002",
    title: "2025 BTS Jungkook Solo Concert",
    artist: "Jungkook",
    tourName: "Golden Tour",
    category: "concert",
    genre: "K-POP",
    dates: ["2025-03-20", "2025-03-21"],
    city: "Seoul",
    venueId: "venue_kspo",
    posterUrl: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=500",
    ticketStatus: "presale",
    ticketOpenDate: "2025-02-01T20:00:00",
    priceTable: {
      VIP: 198000,
      R: 143000,
      S: 121000,
    },
    description: "정국 첫 솔로 월드투어 서울 공연",
    popularity: 98,
  },
  {
    showId: "show_concert_003",
    title: "Ed Sheeran Mathematics Tour",
    artist: "Ed Sheeran",
    tourName: "Mathematics Tour 2025",
    category: "concert",
    genre: "Pop",
    dates: ["2025-04-05"],
    city: "Seoul",
    venueId: "venue_jamsil",
    posterUrl: "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=500",
    ticketStatus: "upcoming",
    ticketOpenDate: "2025-03-01T14:00:00",
    priceTable: {
      R: 176000,
      S: 143000,
      A: 110000,
    },
    description: "에드 시런의 감성 넘치는 무대",
    popularity: 88,
  },

  // 뮤지컬
  {
    showId: "show_musical_001",
    title: "Wicked Korea",
    artist: "Wicked",
    tourName: "위키드 내한 공연",
    category: "musical",
    genre: "Musical",
    dates: ["2025-02-01", "2025-02-02", "2025-02-03"],
    city: "Seoul",
    venueId: "venue_charlotte",
    posterUrl: "https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?w=500",
    ticketStatus: "onsale",
    priceTable: {
      VIP: 180000,
      R: 150000,
      S: 120000,
      A: 90000,
    },
    description: "브로드웨이 대표 뮤지컬 위키드",
    popularity: 92,
  },
  {
    showId: "show_musical_002",
    title: "The Phantom of the Opera",
    artist: "오페라의 유령",
    tourName: "2025 서울 공연",
    category: "musical",
    genre: "Musical",
    dates: ["2025-03-10", "2025-03-11", "2025-03-12"],
    city: "Seoul",
    venueId: "venue_sejong",
    posterUrl: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=500",
    ticketStatus: "onsale",
    priceTable: {
      VIP: 170000,
      R: 140000,
      S: 110000,
    },
    description: "세계에서 가장 사랑받는 뮤지컬",
    popularity: 90,
  },

  // 클래식
  {
    showId: "show_classical_001",
    title: "Berliner Philharmoniker",
    artist: "Berlin Philharmonic Orchestra",
    tourName: "2025 Asia Tour",
    category: "classical",
    genre: "Orchestra",
    dates: ["2025-04-20"],
    city: "Seoul",
    venueId: "venue_lotte",
    posterUrl: "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=500",
    ticketStatus: "presale",
    ticketOpenDate: "2025-02-15T14:00:00",
    priceTable: {
      VIP: 250000,
      R: 200000,
      S: 150000,
      A: 100000,
    },
    description: "세계 최고의 오케스트라 베를린 필하모닉",
    popularity: 85,
  },

  // 페스티벌
  {
    showId: "show_festival_001",
    title: "Seoul Music Festival 2025",
    artist: "Various Artists",
    tourName: "SMF 2025",
    category: "festival",
    genre: "Music Festival",
    dates: ["2025-05-15", "2025-05-16", "2025-05-17"],
    city: "Seoul",
    venueId: "venue_olympic",
    posterUrl: "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=500",
    ticketStatus: "upcoming",
    ticketOpenDate: "2025-03-20T14:00:00",
    priceTable: {
      "1Day": 150000,
      "3Day": 400000,
    },
    description: "서울 최대 음악 페스티벌",
    popularity: 94,
  },

  // 스포츠
  {
    showId: "show_sports_001",
    title: "FC Seoul vs Jeonbuk",
    artist: "FC Seoul",
    tourName: "K리그1 2025",
    category: "sports",
    genre: "축구",
    dates: ["2025-03-25"],
    city: "Seoul",
    venueId: "venue_worldcup",
    posterUrl: "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=500",
    ticketStatus: "onsale",
    priceTable: {
      VIP: 50000,
      R: 35000,
      S: 25000,
      A: 15000,
    },
    description: "FC 서울 홈경기",
    popularity: 75,
  },
];

/**
 * Firestore에 샘플 공연 데이터 추가
 */
export async function seedShows() {
  try {
    console.log("🌱 공연 샘플 데이터 시딩 시작...");

    // 이미 데이터가 있는지 확인
    const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
    
    if (!querySnapshot.empty) {
      console.log("⚠️  이미 공연 데이터가 존재합니다. 시딩을 건너뜁니다.");
      console.log(`📊 현재 공연 수: ${querySnapshot.size}개`);
      return;
    }

    // 샘플 데이터 추가
    const promises = sampleShows.map(async (show) => {
      const docRef = doc(db, COLLECTION_NAME, show.showId);
      await setDoc(docRef, {
        ...show,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      console.log(`✅ ${show.artist} 추가 완료`);
    });

    await Promise.all(promises);

    console.log("🎉 샘플 데이터 시딩 완료!");
    console.log(`📊 총 ${sampleShows.length}개의 공연이 추가되었습니다.`);
    
  } catch (error) {
    console.error("❌ 시딩 중 오류 발생:", error);
    throw error;
  }
}

/**
 * 개발 모드에서만 자동 시딩 실행
 */
export async function autoSeedIfNeeded() {
  if (process.env.NODE_ENV === "development") {
    try {
      await seedShows();
    } catch (error) {
      console.error("자동 시딩 실패:", error);
    }
  }
}

