/**
 * 멜론티켓 Direct API (Puppeteer 불필요!)
 * 
 * axios로 직접 호출 - 0.1초 만에 데이터 로딩
 */

import axios from 'axios';
import { EventItem } from './fetchEvents';

const MELON_BASE = 'https://ticket.melon.com';

/**
 * 멜론 추천 공연 (offerList.json)
 * 메인 홈 추천 블록
 */
export async function fetchMelonOfferList(offerPosType: string = 'MAIN_B_CO_1') {
  try {
    const response = await axios.get(`${MELON_BASE}/offer/ajax/offerList.json`, {
      params: { offerPosType },
    });
    
    console.log(`✅ 멜론 추천 공연 로드: ${offerPosType}`);
    
    return response.data;
  } catch (error) {
    console.error('❌ offerList 로드 실패:', error);
    return { offerList: [] };
  }
}

/**
 * 멜론 전체 공연 리스트 (prodList.json)
 * 🎯 진짜 공연 데이터!
 */
export async function fetchMelonProdList(params: {
  menuId?: string;
  size?: number;
  page?: number;
  prodCategory?: string;
} = {}) {
  try {
    const response = await axios.get(`${MELON_BASE}/offer/ajax/prodList.json`, {
      params: {
        menuId: params.menuId || '100101',
        size: params.size || 100,
        page: params.page || 1,
        prodCategory: params.prodCategory || '',
      },
    });
    
    console.log(`✅ 멜론 공연 리스트 로드: ${response.data.data?.length || 0}개`);
    
    return response.data;
  } catch (error) {
    console.error('❌ prodList 로드 실패:', error);
    return { result: 'FAIL', data: [] };
  }
}

/**
 * 멜론 데이터를 EventItem 형식으로 변환
 */
export function convertMelonToEventItem(melonData: any): EventItem {
  return {
    id: `melon_${melonData.productId || melonData.prodId}`,
    showId: `melon_${melonData.productId || melonData.prodId}`,
    title: melonData.productName || melonData.prodName || '제목 없음',
    artist: melonData.productName || melonData.prodName || '제목 없음',
    tourName: melonData.productName || melonData.prodName || '제목 없음',
    category: getCategoryFromGenre(melonData.genreCode),
    genre: melonData.genreName || '기타',
    dates: [
      melonData.startDate || melonData.prodStartDate,
      melonData.endDate || melonData.prodEndDate,
    ].filter(Boolean),
    city: melonData.place?.placeName || melonData.placeName || '서울',
    venueId: `venue_${melonData.place?.placeId || melonData.placeId || 'unknown'}`,
    posterUrl: melonData.posterImg || melonData.poster || 'https://via.placeholder.com/500x700?text=No+Image',
    ticketStatus: getTicketStatus(melonData.prodStatus || melonData.status),
    ticketOpenDate: melonData.startDate || melonData.prodStartDate || new Date().toISOString().split('T')[0],
    priceTable: {
      'R석': 99000,
      'S석': 77000,
      'A석': 55000,
    },
    description: `${melonData.productName || melonData.prodName} - ${melonData.place?.placeName || melonData.placeName || '공연장'}에서 열리는 공연`,
    popularity: 90,
    createdAt: new Date(),
    updatedAt: new Date(),
    venueName: melonData.place?.placeName || melonData.placeName || '공연장',
  };
}

/**
 * 장르 코드를 카테고리로 변환
 */
function getCategoryFromGenre(genreCode?: string): string {
  if (!genreCode) return 'concert';
  
  // GN0001: 콘서트, GN0002: 뮤지컬, GN0003: 연극 등
  if (genreCode.startsWith('GN0001')) return 'concert';
  if (genreCode.startsWith('GN0002')) return 'musical';
  if (genreCode.startsWith('GN0003')) return 'classical';
  if (genreCode.startsWith('GN0004')) return 'festival';
  
  return 'concert';
}

/**
 * 티켓 상태 변환
 */
function getTicketStatus(status?: string): string {
  if (!status) return 'onsale';
  
  const statusLower = status.toLowerCase();
  
  if (statusLower.includes('onsale') || statusLower.includes('판매중')) return 'onsale';
  if (statusLower.includes('soldout') || statusLower.includes('매진')) return 'soldout';
  if (statusLower.includes('upcoming') || statusLower.includes('오픈예정')) return 'upcoming';
  if (statusLower.includes('presale') || statusLower.includes('선예매')) return 'presale';
  
  return 'onsale';
}

/**
 * 🎯 통합 API: 모든 멜론 공연 데이터 가져오기
 */
export async function fetchAllMelonConcerts(): Promise<EventItem[]> {
  try {
    console.log('🎭 멜론티켓 데이터 로딩 시작...');
    
    // 1. 추천 공연 3개 블록
    const [offer1, offer2, offer3] = await Promise.all([
      fetchMelonOfferList('MAIN_B_CO_1'),
      fetchMelonOfferList('MAIN_B_CO_2'),
      fetchMelonOfferList('MAIN_B_CO_3'),
    ]);
    
    const offerData = [
      ...(offer1.offerList || []),
      ...(offer2.offerList || []),
      ...(offer3.offerList || []),
    ];
    
    console.log(`✅ 추천 공연: ${offerData.length}개`);
    
    // 2. 전체 공연 리스트
    const prodListResponse = await fetchMelonProdList({ size: 100 });
    const prodData = prodListResponse.data || [];
    
    console.log(`✅ 전체 공연: ${prodData.length}개`);
    
    // 3. 데이터 병합 및 중복 제거
    const allData = [...offerData, ...prodData];
    
    // ID 기준 중복 제거
    const uniqueData = Array.from(
      new Map(
        allData.map(item => [
          item.productId || item.prodId,
          item
        ])
      ).values()
    );
    
    console.log(`✅ 중복 제거 후: ${uniqueData.length}개`);
    
    // 4. EventItem으로 변환
    const events = uniqueData.map(convertMelonToEventItem);
    
    console.log(`🎉 멜론티켓 데이터 로딩 완료: ${events.length}개`);
    
    return events;
  } catch (error) {
    console.error('❌ 멜론 데이터 로딩 실패:', error);
    return [];
  }
}

/**
 * 🎯 카테고리별 공연 가져오기
 */
export async function fetchMelonConcertsByCategory(category: string): Promise<EventItem[]> {
  try {
    // 카테고리 코드 매핑
    const categoryMap: Record<string, string> = {
      concert: 'GN0001',
      musical: 'GN0002',
      classical: 'GN0003',
      festival: 'GN0004',
    };
    
    const genreCode = categoryMap[category] || '';
    
    console.log(`🎭 멜론 ${category} 공연 로딩...`);
    
    const response = await fetchMelonProdList({
      prodCategory: genreCode,
      size: 50,
    });
    
    const events = (response.data || []).map(convertMelonToEventItem);
    
    console.log(`✅ ${category} 공연: ${events.length}개`);
    
    return events;
  } catch (error) {
    console.error(`❌ ${category} 데이터 로딩 실패:`, error);
    return [];
  }
}

