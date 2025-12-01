/**
 * 멜론티켓 크롤링 API 연동
 * 
 * concert-server에서 크롤링한 데이터를 가져옵니다
 */

import { EventItem } from "./fetchEvents";

// 환경 변수에서 API URL 가져오기 (없으면 기본값 사용)
// 개발: http://localhost:4000
// 프로덕션: 백엔드 서버 URL (예: https://api.yourdomain.com 또는 카페24 서버 URL)
const MELON_API_URL = process.env.REACT_APP_MELON_API_URL || "http://localhost:4000";

/**
 * 멜론티켓 서버 상태 확인 (재시도 로직 포함)
 * 
 * Render 무료 플랜의 cold start 대응:
 * - 첫 요청 시 최대 30초까지 대기
 * - 최대 3회 재시도
 */
export async function checkMelonServer(retries: number = 3): Promise<boolean> {
  const maxRetries = retries;
  let attempt = 0;
  
  while (attempt < maxRetries) {
    try {
      // 첫 시도는 15초, 이후는 10초 타임아웃
      const timeout = attempt === 0 ? 15000 : 10000;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      if (attempt > 0) {
        console.log(`🔄 멜론 서버 재시도 중... (${attempt + 1}/${maxRetries})`);
      }
      
      const response = await fetch(`${MELON_API_URL}/health`, {
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      const data = await response.json();
      
      if (data.status === "ok") {
        if (attempt > 0) {
          console.log(`✅ 멜론 서버 연결 성공 (${attempt + 1}번째 시도)`);
        }
        return true;
      }
      
      throw new Error("서버 응답이 올바르지 않습니다");
    } catch (error: any) {
      attempt++;
      
      if (error.name === 'AbortError') {
        if (attempt < maxRetries) {
          console.warn(`⏱️ 멜론 서버 연결 타임아웃 (${attempt}/${maxRetries}) - 재시도 중...`);
          // 재시도 전 대기 (점진적 백오프)
          await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
        } else {
          console.warn(`⏱️ 멜론 서버 연결 타임아웃 (${maxRetries}회 시도 실패)`);
        }
      } else {
        if (attempt < maxRetries) {
          console.warn(`❌ 멜론 서버 연결 실패 (${attempt}/${maxRetries}):`, error.message || error, "- 재시도 중...");
          await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
        } else {
          console.warn(`❌ 멜론 서버 연결 실패 (${maxRetries}회 시도 실패):`, error.message || error);
        }
      }
    }
  }
  
  return false;
}

/**
 * 멜론티켓 콘서트 목록 가져오기 (재시도 로직 포함)
 * 
 * @param category - 카테고리 (concert, musical, classical, festival, sports)
 * @param sortType - 정렬 타입 (popularity=인기순, deadline=공연일자순, latest=최신순)
 * @param retries - 재시도 횟수 (기본값: 2)
 * @returns EventItem 배열
 */
export async function fetchMelonConcerts(category: string = "concert", sortType: string = "popularity", retries: number = 2): Promise<EventItem[]> {
  const maxRetries = retries;
  let attempt = 0;
  
  // sortType 변환: popularity -> HIT, deadline -> DATE, latest -> RECENT
  const melonSortMap: { [key: string]: string } = {
    "popularity": "HIT",      // 인기순
    "deadline": "DATE",       // 공연일자순
    "latest": "RECENT",       // 최신순
  };
  const melonSort = melonSortMap[sortType] || "HIT";
  
  while (attempt <= maxRetries) {
    try {
      const currentAttempt = attempt; // loop 안에서 안전하게 사용하기 위해 복사
      
      if (currentAttempt === 0) {
        console.log(`🎭 멜론티켓 데이터 요청 중 (${category}, ${sortType} -> ${melonSort})...`);
      } else {
        console.log(`🔄 멜론티켓 데이터 재요청 중... (${currentAttempt + 1}/${maxRetries + 1})`);
      }
      
      // 타임아웃 설정 (첫 시도는 20초, 이후는 15초)
      const timeout = currentAttempt === 0 ? 20000 : 15000;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      const response = await fetch(`${MELON_API_URL}/concerts?category=${category}&sortType=${melonSort}`, {
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      const data = await response.json();
    
      if (!data.success) {
        throw new Error(data.error || "멜론 크롤링 실패");
      }
      
      if (currentAttempt > 0) {
        console.log(`✅ 멜론 서버 연결 성공 (${currentAttempt + 1}번째 시도)`);
      }
      console.log(`✅ 멜론에서 ${data.count}개의 공연 로드`);
      
      // 데이터가 없으면 로그 출력
      if (!data.concerts || data.concerts.length === 0) {
        console.warn(`⚠️ ${category} 카테고리에 데이터 없음 (count: ${data.count})`);
        console.log(`📄 응답 데이터:`, data);
      }
      
      // 멜론 데이터를 EventItem 형식으로 변환
      const events: EventItem[] = (data.concerts || []).map((concert: any, index: number) => {
      // 서버에서 반환하는 필드명에 맞게 매핑
      const title = concert.title || concert.prodName || "제목 없음";
      const place = concert.place || concert.placeName || concert.venue || "공연장";
      const image = concert.image || concert.posterUrl || concert.posterImg || "https://via.placeholder.com/500x700?text=No+Image";
      
      // 날짜 추출 (서버에서 이미 파싱된 날짜 사용, 없으면 fallback)
      const date = concert.date || concert.periodInfo || concert.playPeriod || 
                   concert.dispStartDttm || concert.prfStartDate || concert.startDate || 
                   concert.playStartDate || concert.prodStartDate || null;
      
      const regionName = concert.regionName || concert.city || "서울";
      const stateFlg = concert.stateFlg || "판매중";
      
      // 티켓 상태 매핑
      let ticketStatus: "upcoming" | "presale" | "onsale" | "soldout" = "onsale";
      if (stateFlg === "판매중" || stateFlg === "ONSALE") ticketStatus = "onsale";
      else if (stateFlg === "선예매" || stateFlg === "PRESALE") ticketStatus = "presale";
      else if (stateFlg === "매진" || stateFlg === "SOLD_OUT") ticketStatus = "soldout";
      else if (stateFlg === "오픈예정" || stateFlg === "UPCOMING") ticketStatus = "upcoming";
      
      return {
        id: concert.id || `melon_${concert.prodId || index}`,
        showId: concert.id || `melon_${concert.prodId || index}`,
        title: title,
        artist: title, // 멜론은 제목에 아티스트 포함
        tourName: title,
        category: concert.category || category, // 서버에서 전달된 카테고리 사용
        genre: "대중음악",
        dates: date ? (Array.isArray(date) ? date : [date]) : [new Date().toISOString().split("T")[0]],
        city: regionName,
        venueId: `venue_${place.replace(/\s/g, "_")}`,
        posterUrl: image,
        ticketStatus: ticketStatus,
        ticketOpenDate: concert.ticketOpenDate || concert.openDate || date,
        priceTable: concert.priceTable || {
          "R석": 99000,
          "S석": 77000,
          "A석": 55000,
        },
        description: `${title} - ${place}에서 열리는 공연`,
        popularity: 90,
        createdAt: new Date(),
        updatedAt: new Date(),
        venueName: place,
        link: concert.link || `https://ticket.melon.com/performance/detail.htm?prodId=${concert.prodId}`,
      };
      });
      
      return events;
    } catch (error: any) {
      const currentAttempt = attempt; // loop 안에서 안전하게 사용하기 위해 복사
      attempt++;
      
      if (error.name === 'AbortError') {
        if (currentAttempt < maxRetries) {
          console.warn(`⏱️ 멜론 데이터 요청 타임아웃 (${currentAttempt + 1}/${maxRetries + 1}) - 재시도 중...`);
          // 재시도 전 대기 (점진적 백오프)
          await new Promise(resolve => setTimeout(resolve, 2000 * (currentAttempt + 1)));
          continue;
        } else {
          console.error(`❌ 멜론 데이터 로드 실패 (타임아웃): ${maxRetries + 1}회 시도 실패`);
        }
      } else {
        if (currentAttempt < maxRetries) {
          console.warn(`❌ 멜론 데이터 로드 실패 (${currentAttempt + 1}/${maxRetries + 1}):`, error.message || error, "- 재시도 중...");
          await new Promise(resolve => setTimeout(resolve, 2000 * (currentAttempt + 1)));
          continue;
        } else {
          console.error(`❌ 멜론 데이터 로드 실패: ${maxRetries + 1}회 시도 실패`, error);
        }
      }
      
      // 모든 재시도 실패 시 빈 배열 반환
      return [];
    }
  }
  
  return [];
}

/**
 * 멜론티켓 티켓오픈 소식 가져오기
 * 
 * @param orderType - 정렬 타입 (0=기본, 1=오픈일순 등)
 * @param pageIndex - 페이지 번호
 * @param schGcode - 장르 코드 (GENRE_ALL=전체)
 * @returns EventItem 배열
 */
export async function fetchMelonTicketOpen(
  orderType: string = "0",
  pageIndex: string = "1",
  schGcode: string = "GENRE_ALL"
): Promise<EventItem[]> {
  try {
    console.log(`🎫 멜론티켓 티켓오픈 소식 요청 중...`);
    
    const response = await fetch(`${MELON_API_URL}/ticket-open`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        orderType,
        pageIndex,
        schGcode,
      }),
    });
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || "티켓오픈 데이터 로드 실패");
    }
    
    console.log(`✅ 멜론에서 ${data.count}개의 티켓오픈 소식 로드`);
    
    // 티켓오픈 데이터를 EventItem 형식으로 변환
    const events: EventItem[] = data.ticketOpens.map((item: any, index: number) => {
      return {
        id: item.id || `ticketopen_${index}`,
        showId: item.id || `ticketopen_${index}`,
        title: item.title || item.artist || "제목 없음",
        artist: item.artist || item.title || "아티스트",
        tourName: item.tourName || item.title || "",
        category: "concert",
        genre: "대중음악",
        dates: item.date ? [item.date] : [new Date().toISOString().split("T")[0]],
        city: item.city || "서울",
        venueId: `venue_${(item.venueName || item.place || "").replace(/\s/g, "_")}`,
        posterUrl: item.posterUrl || item.imageUrl || "https://via.placeholder.com/500x700?text=No+Image",
        ticketStatus: "upcoming",
        ticketOpenDate: item.ticketOpenDate || item.date || new Date().toISOString().split("T")[0],
        priceTable: item.priceTable || {},
        description: `${item.title} - ${item.place || item.venueName || "공연장"}에서 열리는 공연`,
        popularity: 90,
        createdAt: new Date(),
        updatedAt: new Date(),
        venueName: item.venueName || item.place || "공연장",
        link: item.link || "#",
      };
    });
    
    return events;
  } catch (error) {
    console.error("❌ 멜론 티켓오픈 데이터 로드 실패:", error);
    return [];
  }
}

/**
 * 멜론티켓 특정 공연 상세 정보 가져오기
 * 
 * @param concertId - 공연 ID (예: "melon_211662")
 * @returns EventItem 또는 null
 */
export async function fetchMelonConcertById(concertId: string): Promise<EventItem | null> {
  try {
    // melon_ 접두사 제거
    const prodId = concertId.replace("melon_", "");
    
    console.log(`🎵 멜론티켓 상세 정보 요청: ${concertId} → prodId: ${prodId}`);
    
    // 방법 1: 서버의 /concerts/:id 엔드포인트 시도
    try {
      const response = await fetch(`${MELON_API_URL}/concerts/${prodId}`);
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.success && data.concert) {
          const concert = data.concert;
          console.log(`✅ 서버에서 상세 정보 로드 성공:`, concert.title || concert.prodName);
          
          // 서버에서 반환하는 데이터 구조에 맞게 매핑
          const title = concert.title || concert.prodName || "제목 없음";
          const place = concert.place || concert.placeName || concert.venue || "공연장";
          const image = concert.image || concert.posterUrl || concert.posterImg || "https://via.placeholder.com/500x700?text=No+Image";
          
          // 날짜 처리
          const date = concert.date || concert.periodInfo || concert.playPeriod || 
                       concert.dispStartDttm || concert.prfStartDate || concert.startDate || 
                       concert.playStartDate || concert.prodStartDate || null;
          const dates = date ? (Array.isArray(date) ? date : [date]) : [new Date().toISOString().split("T")[0]];
          
          const regionName = concert.regionName || concert.city || "서울";
          const stateFlg = concert.stateFlg || "판매중";
          
          // 티켓 상태 매핑
          let ticketStatus: "upcoming" | "presale" | "onsale" | "soldout" = "onsale";
          if (stateFlg === "판매중" || stateFlg === "ONSALE") ticketStatus = "onsale";
          else if (stateFlg === "선예매" || stateFlg === "PRESALE") ticketStatus = "presale";
          else if (stateFlg === "매진" || stateFlg === "SOLD_OUT") ticketStatus = "soldout";
          else if (stateFlg === "오픈예정" || stateFlg === "UPCOMING") ticketStatus = "upcoming";
          
          return {
            id: concertId,
            showId: concertId,
            title: title,
            artist: title,
            tourName: title,
            category: concert.category || "concert",
            genre: concert.genre || "대중음악",
            dates: dates,
            city: regionName,
            venueId: `venue_${place.replace(/\s/g, "_")}`,
            posterUrl: image,
            ticketStatus: ticketStatus,
            ticketOpenDate: concert.ticketOpenDate || concert.openDate || date || dates[0],
            priceTable: concert.priceTable || {
              "R석": 99000,
              "S석": 77000,
              "A석": 55000,
            },
            description: concert.description || `${title} - ${place}에서 열리는 공연`,
            popularity: 90,
            createdAt: new Date(),
            updatedAt: new Date(),
            venueName: place,
            link: concert.link || `https://ticket.melon.com/performance/detail.htm?prodId=${prodId}`,
          };
        }
      }
    } catch (serverError) {
      console.log(`⚠️ 서버 /concerts/:id 엔드포인트 실패, 리스트에서 찾기 시도...`);
    }
    
    // 방법 2: 리스트 API에서 해당 ID 찾기 (Fallback)
    console.log(`🔄 리스트 API에서 ID 찾기: ${concertId}`);
    const allCategories = ["concert", "musical", "classical", "festival", "sports"];
    
    for (const category of allCategories) {
      try {
        const listData = await fetchMelonConcerts(category, "popularity");
        const found = listData.find(item => item.id === concertId || item.showId === concertId);
        
        if (found) {
          console.log(`✅ 리스트에서 찾음 (${category}):`, found.title);
          return found;
        }
      } catch (err) {
        // 다음 카테고리 시도
        continue;
      }
    }
    
    console.error(`❌ 공연 데이터 없음: ${concertId} (모든 카테고리에서 찾기 실패)`);
    return null;
    
  } catch (error: any) {
    console.error("❌ 멜론 상세 정보 로드 실패:", error);
    return null;
  }
}

