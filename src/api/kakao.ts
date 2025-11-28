/**
 * 카카오 로컬 API - 주소를 좌표로 변환
 */

export interface KakaoCoords {
  lat: number;
  lng: number;
}

/**
 * 주소 정제 함수 - 괄호 및 특수문자 제거
 * @param address - 원본 주소
 * @returns 정제된 주소
 */
function cleanAddress(address: string): string {
  if (!address) return "";
  
  // 1. 괄호와 그 안의 내용 제거 (예: "티켓링크 라이브 아레나 (구 올림픽공원 핸드볼경기장)" → "티켓링크 라이브 아레나")
  let cleaned = address.replace(/\([^)]*\)/g, "").trim();
  
  // 2. 연속된 공백 제거
  cleaned = cleaned.replace(/\s+/g, " ").trim();
  
  // 3. 앞뒤 공백 제거
  cleaned = cleaned.trim();
  
  return cleaned;
}

/**
 * 주소를 카카오 로컬 API로 좌표로 변환
 * 
 * @param address - 검색할 주소 (예: "서울 송파구 올림픽로 424" 또는 "티켓링크 라이브 아레나 (구 올림픽공원 핸드볼경기장)")
 * @returns 좌표 정보 (lat, lng) 또는 null
 */
export async function getCoordsByAddress(address: string): Promise<KakaoCoords | null> {
  const REST_API_KEY = process.env.REACT_APP_KAKAO_REST_API_KEY;

  if (!REST_API_KEY) {
    console.error("❌ REACT_APP_KAKAO_REST_API_KEY가 설정되지 않았습니다.");
    return null;
  }

  if (!address || address.trim() === "") {
    console.error("❌ 주소가 비어있습니다.");
    return null;
  }

  // 주소 정제 (괄호 제거)
  const cleanedAddress = cleanAddress(address);
  
  if (!cleanedAddress) {
    console.error("❌ 정제된 주소가 비어있습니다.");
    return null;
  }

  try {
    // 1차 시도: 정제된 주소로 검색
    const response = await fetch(
      `https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(cleanedAddress)}`,
      {
        headers: {
          Authorization: `KakaoAK ${REST_API_KEY}`,
        },
      }
    );

    if (!response.ok) {
      console.error(`❌ 카카오 API 요청 실패: ${response.status} ${response.statusText}`);
      return null;
    }

    const data = await response.json();

    if (data.documents && data.documents.length > 0) {
      const { x, y } = data.documents[0]; // x: 경도(longitude), y: 위도(latitude)
      console.log(`✅ 주소 검색 성공: ${cleanedAddress} → (${y}, ${x})`);
      return {
        lat: Number(y),
        lng: Number(x),
      };
    }

    // 2차 시도: 정제된 주소로 실패하면 원본 주소로 재시도
    if (cleanedAddress !== address) {
      console.log(`⚠️ 정제된 주소로 실패, 원본 주소로 재시도: ${address}`);
      const response2 = await fetch(
        `https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(address)}`,
        {
          headers: {
            Authorization: `KakaoAK ${REST_API_KEY}`,
          },
        }
      );
      
      if (response2.ok) {
        const data2 = await response2.json();
        if (data2.documents && data2.documents.length > 0) {
          const { x, y } = data2.documents[0];
          console.log(`✅ 원본 주소로 검색 성공: ${address} → (${y}, ${x})`);
          return {
            lat: Number(y),
            lng: Number(x),
          };
        }
      }
    }

    console.warn(`⚠️ 주소를 찾을 수 없습니다: ${cleanedAddress} (원본: ${address})`);
    return null;
  } catch (error: any) {
    console.error("❌ 카카오 API 요청 중 오류:", error);
    return null;
  }
}

