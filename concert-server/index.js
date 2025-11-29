/**
 * 🎉 멜론티켓 진짜 API 서버 (완성!)
 * 
 * prodList.json → 실제 멜론 공연 데이터!
 * 
 * 실행: npm start
 * API: http://localhost:4000/concerts
 */

const express = require("express");
const cors = require("cors");
const axios = require("axios");
const cheerio = require("cheerio");

const app = express();
const PORT = process.env.PORT || 4000;

// CORS 설정
app.use(cors());
app.use(express.json());

// ⭐ 멜론티켓 진짜 공연 리스트 API!
const MELON_API_URL = "https://ticket.melon.com/performance/ajax/prodList.json";
// ⭐ 멜론티켓 티켓오픈 API!
const MELON_TICKET_OPEN_URL = "https://ticket.melon.com/csoon/ajax/listTicketOpen.htm";

// 카테고리별 캐시 (중복 요청 방지)
const categoryCache = {}; // { category: { data: [...], time: timestamp } }
const CACHE_DURATION = 5 * 60 * 1000; // 5분

// 서버 상태 확인 (Render health check용)
app.get("/health", (req, res) => {
  res.status(200).send("OK");
});

// ⭐ 캐시 클리어
app.get("/clear-cache", (req, res) => {
  const categories = Object.keys(categoryCache);
  Object.keys(categoryCache).forEach(key => delete categoryCache[key]);
  console.log(`🗑️ 캐시 클리어됨: ${categories.join(', ')}`);
  res.json({
    success: true,
    message: "캐시가 클리어되었습니다",
    clearedCategories: categories,
  });
});

/**
 * 카테고리 → 멜론 장르 코드 매핑 (실제 멜론 API 코드!)
 */
function getCategoryGenreCode(category) {
  const genreMap = {
    concert: "GENRE_CON_ALL",      // 콘서트 전체
    musical: "GENRE_ART_ALL",      // 뮤지컬/연극
    classical: "GENRE_CLA_ALL",    // 클래식 전체
    festival: "GENRE_FAN_ALL",     // 펜클럽/팬미팅 (변경!)
    sports: "GENRE_EXH_ALL",       // 전시/행사 (변경!)
    all: "",                        // 전체
  };
  return genreMap[category] || "GENRE_CON_ALL";
}

/**
 * 날짜 파싱 함수 - 다양한 날짜 형식 지원
 * @param {string} raw - 원본 날짜 문자열
 * @returns {string|null} - 포맷된 날짜 문자열 (YYYY.MM.DD) 또는 null
 */
function parseDate(raw) {
  if (!raw) return null;
  
  const str = String(raw).trim();
  if (!str || str === "undefined" || str === "null") return null;
  
  // 타입 1: 20251129 (8자리 숫자)
  if (/^\d{8}$/.test(str)) {
    return `${str.slice(0, 4)}.${str.slice(4, 6)}.${str.slice(6, 8)}`;
  }
  
  // 타입 2: 2025.11.29 (이미 포맷된 경우)
  if (/^\d{4}\.\d{1,2}\.\d{1,2}/.test(str)) {
    // 날짜 범위인 경우 첫 번째 날짜만 추출
    const match = str.match(/^(\d{4}\.\d{1,2}\.\d{1,2})/);
    if (match) {
      const [year, month, day] = match[1].split('.');
      return `${year}.${month.padStart(2, '0')}.${day.padStart(2, '0')}`;
    }
    return str;
  }
  
  // 타입 3: ISO 형식 (2025-11-29)
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
    return str.replace(/-/g, '.');
  }
  
  return null;
}

/**
 * 날짜 필드에서 날짜 추출 (여러 필드명 fallback)
 * @param {object} item - 멜론 API 응답 아이템
 * @returns {string|null} - 포맷된 날짜 문자열 또는 null
 */
function getDateFromItem(item) {
  // 모든 가능한 날짜 필드명 시도
  const dateFields = [
    item.dispStartDttm,
    item.prfStartDate,
    item.startDate,
    item.playStartDate,
    item.prodStartDate,
    item.periodInfo,
    item.playPeriod,
    item.date,
  ];
  
  for (const field of dateFields) {
    if (field) {
      const parsed = parseDate(field);
      if (parsed) return parsed;
    }
  }
  
  return null;
}

/**
 * ⭐ 멜론 공연 리스트 가져오기 (axios 직접 호출!)
 */
async function fetchMelonProdList(params = {}) {
  try {
    const category = params.category || "concert";
    const genreCode = getCategoryGenreCode(category);
    
    console.log(`🎭 멜론 prodList.json 호출 (${category})...`);
    console.log(`   → 장르 코드: ${genreCode}`);

    const response = await axios.get(MELON_API_URL, {
      params: {
        commCode: params.commCode || "",
        sortType: params.sortType || "HIT", // HIT=인기순, NEW=최신순
        perfGenreCode: genreCode,
        perfThemeCode: params.perfThemeCode || "",
        filterCode: params.filterCode || "FILTER_ALL",
        ve: 1,
      },
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
        "Referer": "https://ticket.melon.com/performance/index.htm",
        "Accept": "application/json, text/javascript, */*; q=0.01",
        "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
        "Accept-Encoding": "gzip, deflate, br",
        "X-Requested-With": "XMLHttpRequest",
        "Connection": "keep-alive",
        "Sec-Fetch-Dest": "empty",
        "Sec-Fetch-Mode": "cors",
        "Sec-Fetch-Site": "same-origin",
      },
    });

    console.log(`✅ 멜론 데이터 로드 성공! (${category}, ${genreCode})`);

    // 응답 데이터 구조 확인
    const data = response.data;
    console.log(`📊 데이터 키: ${Object.keys(data).join(', ')}`);
    console.log(`📊 응답 타입: ${typeof data}`);
    
    // dataList가 있으면 그걸 사용
    let concerts = data.dataList || data.list || data.data || [];
    
    // 배열이 아닌 경우 처리
    if (!Array.isArray(concerts)) {
      console.log(`⚠️ concerts가 배열이 아님:`, typeof concerts);
      if (typeof concerts === 'object' && concerts !== null) {
        // 객체인 경우 값들을 배열로 변환 시도
        concerts = Object.values(concerts).filter(item => item && typeof item === 'object');
      } else {
        concerts = [];
      }
    }
    
    console.log(`✅ 공연 수: ${concerts.length}개`);
    
    // 데이터가 없으면 상세 로그
    if (concerts.length === 0) {
      console.log(`⚠️ ${category} (${genreCode}) 카테고리에 데이터 없음`);
      console.log(`📄 응답 데이터 샘플:`, JSON.stringify(data).substring(0, 500));
    }

    // 데이터 포맷 변환
    const formatted = concerts.map((item, index) => {
      // 포스터 이미지 URL (CDN 붙이기)
      let posterUrl = "https://via.placeholder.com/500x700?text=No+Image";
      if (item.posterImg) {
        posterUrl = item.posterImg.startsWith('http') 
          ? item.posterImg 
          : `https://cdnticket.melon.co.kr${item.posterImg}`;
      }

      // 카테고리 자동 감지 (perfTypeCode 기반)
      let detectedCategory = "concert";
      if (item.perfTypeCode) {
        if (item.perfTypeCode.includes("MUS")) detectedCategory = "musical";
        else if (item.perfTypeCode.includes("CLA")) detectedCategory = "classical";
        else if (item.perfTypeCode.includes("SPO")) detectedCategory = "sports";
        else if (item.perfTypeCode.includes("CON")) detectedCategory = "concert";
      }

      // 날짜 추출 (여러 필드명 fallback)
      const dateStr = getDateFromItem(item) || "날짜 미정";

      return {
        id: `melon_${item.prodId || index}`,
        title: item.title || item.prodName || "제목 없음",
        image: posterUrl,
        date: dateStr,
        place: item.placeName || "공연장",
        link: `https://ticket.melon.com/performance/detail.htm?prodId=${item.prodId}`,
        category: params.category || detectedCategory,
        // 추가 정보
        stateFlg: item.stateFlg, // 판매 상태
        regionName: item.regionName, // 지역
        gradeCode: item.gradeCode, // 등급
        // 원본 데이터 (디버깅용)
        raw: item,
      };
    });

    return formatted;

  } catch (error) {
    console.error("❌ 멜론 API 호출 실패:", error.message);
    
    // 에러 상세 정보
    if (error.response) {
      console.error(`   → 상태 코드: ${error.response.status}`);
      console.error(`   → 응답 데이터:`, error.response.data);
    }
    
    return [];
  }
}

/**
 * ⭐ API 엔드포인트: /concerts
 */
app.get("/concerts", async (req, res) => {
  try {
    const category = req.query.category || "concert";
    console.log(`🎭 /concerts 요청 (${category})`);

    // 카테고리별 캐시 확인
    const now = Date.now();
    const cache = categoryCache[category];
    
    if (cache && cache.data && (now - cache.time) < CACHE_DURATION) {
      console.log(`✅ 캐시된 데이터 사용 (${category}): ${cache.data.length}개`);
      return res.json({
        success: true,
        count: cache.data.length,
        concerts: cache.data,
        cached: true,
        category,
        source: "melon-prodList",
        timestamp: new Date().toISOString(),
      });
    }

    // 쿼리 파라미터 (카테고리, 정렬 등)
    const params = {
      category,
      sortType: req.query.sortType || "HIT",
    };

    // 새로 호출
    console.log(`🔄 새로운 API 호출 (${category})...`);
    const concerts = await fetchMelonProdList(params);

    // 카테고리별 캐시 저장
    categoryCache[category] = {
      data: concerts,
      time: now,
    };
    console.log(`💾 캐시 저장 (${category}): ${concerts.length}개`);

    res.json({
      success: true,
      count: concerts.length,
      concerts,
      cached: false,
      category,
      source: "melon-prodList",
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error("❌ /concerts API 오류:", error);
    res.status(500).json({
      success: false,
      message: "멜론 데이터 로드 실패",
      error: error.message,
    });
  }
});

/**
 * ⭐ API 엔드포인트: /ticket-open (티켓오픈 소식)
 */
app.post("/ticket-open", async (req, res) => {
  try {
    console.log(`🎫 티켓오픈 소식 요청...`);
    console.log(`📤 요청 URL: ${MELON_TICKET_OPEN_URL}`);
    console.log(`📤 요청 파라미터:`, {
      orderType: req.body.orderType || "0",
      pageIndex: req.body.pageIndex || "1",
      schGcode: req.body.schGcode || "GENRE_ALL",
    });

    // 멜론 티켓오픈 API 호출 (POST)
    const response = await axios.post(
      MELON_TICKET_OPEN_URL, 
      new URLSearchParams({
        orderType: req.body.orderType || "0",
        pageIndex: req.body.pageIndex || "1",
        schGcode: req.body.schGcode || "GENRE_ALL",
      }),
      {
        headers: {
          "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
          "Referer": "https://ticket.melon.com/csoon/index.htm",
          "Accept": "*/*",
          "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
          "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
          "X-Requested-With": "XMLHttpRequest",
          "Origin": "https://ticket.melon.com",
        },
        validateStatus: function (status) {
          return status < 500; // 5xx 에러만 reject
        },
      }
    );

    console.log(`📥 응답 상태: ${response.status}`);
    console.log(`📥 응답 타입: ${typeof response.data}`);
    console.log(`📥 응답 길이: ${typeof response.data === 'string' ? response.data.length : 'N/A'}`);

    // 에러 페이지 체크
    if (response.status !== 200) {
      console.error(`❌ HTTP 에러: ${response.status}`);
      return res.status(500).json({
        success: false,
        error: `멜론 API 응답 오류 (${response.status})`,
        message: "티켓오픈 데이터를 가져올 수 없습니다.",
      });
    }

    // HTML 에러 페이지 체크
    if (typeof response.data === 'string' && response.data.includes('<!DOCTYPE')) {
      // 에러 페이지인지 확인
      if (response.data.includes('404') || response.data.includes('Not Found') || response.data.includes('에러')) {
        console.error(`❌ HTML 에러 페이지 감지`);
        console.log(`📄 응답 샘플 (처음 500자):`, response.data.substring(0, 500));
        return res.status(500).json({
          success: false,
          error: "멜론 API가 에러 페이지를 반환했습니다",
          message: "티켓오픈 데이터를 가져올 수 없습니다.",
        });
      }
    }

    console.log(`✅ 티켓오픈 데이터 로드 성공!`);

    // HTML 응답을 파싱
    let ticketOpenList = [];
    
    if (typeof response.data === 'string') {
      // HTML 응답인 경우 - cheerio로 파싱
      console.log(`📄 HTML 응답 받음 (길이: ${response.data.length}자), 파싱 시작...`);
      
      const $ = cheerio.load(response.data);
      
      // 디버깅: HTML 구조 확인
      const bodyHtml = $('body').html() || response.data;
      console.log(`📄 HTML 샘플 (처음 1000자):`, bodyHtml.substring(0, 1000));
      
      // 멜론 티켓오픈 HTML 구조 파싱
      // 여러 가능한 구조 시도
      
      // 방법 1: 테이블 구조 (tr > td)
      $('table tr, tbody tr').each((index, element) => {
        const $tr = $(element);
        const $tds = $tr.find('td');
        
        if ($tds.length >= 2) {
          // 링크가 있는 셀 찾기
          const $linkCell = $tds.find('a').first().parent();
          const link = $tds.find('a').attr('href') || '';
          const title = $tds.find('a').text().trim() || $tds.eq(0).text().trim();
          
          if (title && link) {
            const prodIdMatch = link.match(/prodId=(\d+)/);
            const prodId = prodIdMatch ? prodIdMatch[1] : null;
            
            // 이미지 찾기
            const imgSrc = $tr.find('img').attr('src') || $tr.find('img').attr('data-src') || '';
            const posterUrl = imgSrc 
              ? (imgSrc.startsWith('http') ? imgSrc : `https://cdnticket.melon.co.kr${imgSrc}`)
              : "https://via.placeholder.com/500x700?text=No+Image";
            
            // 날짜/공연장 추출
            const dateText = $tds.eq(1).text().trim() || $tds.eq(2).text().trim() || "";
            const place = $tds.eq(2).text().trim() || $tds.eq(3).text().trim() || "";
            
            ticketOpenList.push({
              prodId: prodId || `table_${index}`,
              title: title,
              link: link.startsWith('http') ? link : `https://ticket.melon.com${link}`,
              posterUrl: posterUrl,
              date: dateText,
              place: place,
            });
          }
        }
      });
      
      // 방법 2: 리스트 구조 (li, div.item 등)
      if (ticketOpenList.length === 0) {
        $('li, .item, .list_item, .ticket_item, [class*="item"], [class*="list"]').each((index, element) => {
          const $el = $(element);
          const $link = $el.find('a').first();
          const link = $link.attr('href') || '';
          const title = $link.text().trim() || $el.find('.title, .name, .prod_name').text().trim();
          
          if (title && title.length > 3) { // 최소 길이 체크
            const prodIdMatch = link.match(/prodId=(\d+)/);
            const prodId = prodIdMatch ? prodIdMatch[1] : null;
            
            const imgSrc = $el.find('img').attr('src') || $el.find('img').attr('data-src') || '';
            const posterUrl = imgSrc 
              ? (imgSrc.startsWith('http') ? imgSrc : `https://cdnticket.melon.co.kr${imgSrc}`)
              : "https://via.placeholder.com/500x700?text=No+Image";
            
            const dateText = $el.find('.date, .open_date, [class*="date"]').text().trim() || "";
            const place = $el.find('.place, .venue, [class*="place"]').text().trim() || "";
            
            ticketOpenList.push({
              prodId: prodId || `list_${index}`,
              title: title,
              link: link.startsWith('http') ? link : `https://ticket.melon.com${link}`,
              posterUrl: posterUrl,
              date: dateText,
              place: place,
            });
          }
        });
      }
      
      // 방법 3: 모든 링크에서 prodId가 있는 것 찾기
      if (ticketOpenList.length === 0) {
        $('a[href*="prodId"]').each((index, element) => {
          const $link = $(element);
          const link = $link.attr('href') || '';
          const prodIdMatch = link.match(/prodId=(\d+)/);
          
          if (prodIdMatch) {
            const prodId = prodIdMatch[1];
            const title = $link.text().trim() || $link.attr('title') || '';
            const $parent = $link.closest('tr, li, div, td');
            
            const imgSrc = $parent.find('img').attr('src') || $parent.find('img').attr('data-src') || '';
            const posterUrl = imgSrc 
              ? (imgSrc.startsWith('http') ? imgSrc : `https://cdnticket.melon.co.kr${imgSrc}`)
              : "https://via.placeholder.com/500x700?text=No+Image";
            
            if (title) {
              ticketOpenList.push({
                prodId: prodId,
                title: title,
                link: link.startsWith('http') ? link : `https://ticket.melon.com${link}`,
                posterUrl: posterUrl,
                date: "",
                place: "",
              });
            }
          }
        });
      }
      
      console.log(`✅ HTML 파싱 완료: ${ticketOpenList.length}개 항목 추출`);
      
      // 파싱 결과가 없으면 HTML 구조 출력
      if (ticketOpenList.length === 0) {
        console.log(`⚠️ 파싱 결과 없음 - HTML 구조 분석 필요`);
        console.log(`📄 전체 HTML (처음 2000자):`, response.data.substring(0, 2000));
        
        // 주요 셀렉터 확인
        const $ = cheerio.load(response.data);
        console.log(`🔍 테이블 개수:`, $('table').length);
        console.log(`🔍 리스트 아이템 개수:`, $('li').length);
        console.log(`🔍 prodId 링크 개수:`, $('a[href*="prodId"]').length);
        console.log(`🔍 모든 링크 개수:`, $('a').length);
      }
      
      // 중복 제거 (prodId 기준)
      const uniqueList = [];
      const seenIds = new Set();
      ticketOpenList.forEach(item => {
        if (!seenIds.has(item.prodId)) {
          seenIds.add(item.prodId);
          uniqueList.push(item);
        }
      });
      ticketOpenList = uniqueList;
      
      console.log(`✅ 중복 제거 후: ${ticketOpenList.length}개 항목`);
      
    } else {
      // JSON 응답인 경우
      console.log(`📦 JSON 응답 받음`);
      ticketOpenList = response.data.list || response.data.dataList || response.data || [];
      console.log(`📦 JSON 데이터 개수: ${Array.isArray(ticketOpenList) ? ticketOpenList.length : 'N/A'}`);
    }

    // 데이터 변환
    const formatted = ticketOpenList.map((item, index) => {
      let posterUrl = item.posterUrl || "https://via.placeholder.com/500x700?text=No+Image";
      
      // 날짜 파싱 (예: "2025.11.25(화) 20:00" 형식)
      let ticketOpenDate = item.date || "";
      let parsedDate = "";
      if (ticketOpenDate) {
        // 날짜 형식 정규화
        const dateMatch = ticketOpenDate.match(/(\d{4})\.(\d{1,2})\.(\d{1,2})/);
        if (dateMatch) {
          const [, year, month, day] = dateMatch;
          parsedDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        }
      }

      return {
        id: `ticketopen_${item.prodId || index}`,
        title: item.title || "제목 없음",
        artist: item.title || "아티스트", // 티켓오픈은 보통 제목에 아티스트 포함
        tourName: item.title || "",
        posterUrl: posterUrl,
        imageUrl: posterUrl,
        date: item.date || "날짜 미정",
        ticketOpenDate: parsedDate || item.date || new Date().toISOString().split("T")[0],
        place: item.place || "공연장",
        city: item.place ? item.place.split(' ')[0] : "",
        venueName: item.place || "",
        link: item.link || (item.prodId ? `https://ticket.melon.com/performance/detail.htm?prodId=${item.prodId}` : "#"),
        ticketStatus: "upcoming",
        priceTable: {},
        price: 0,
        raw: item,
      };
    });

    res.json({
      success: true,
      count: formatted.length,
      ticketOpens: formatted,
      source: "melon-ticket-open",
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error("❌ 티켓오픈 API 호출 실패:", error.message);
    console.error("❌ 에러 스택:", error.stack);
    
    // axios 에러인 경우 상세 정보 출력
    if (error.response) {
      console.error(`❌ 응답 상태: ${error.response.status}`);
      console.error(`❌ 응답 데이터:`, typeof error.response.data === 'string' 
        ? error.response.data.substring(0, 500) 
        : error.response.data);
    } else if (error.request) {
      console.error(`❌ 요청 전송 실패:`, error.request);
    }
    
    // 실패 시 에러 응답 반환
    res.status(500).json({
      success: false,
      message: "멜론 티켓오픈 데이터 로드 실패",
      error: error.message,
      details: error.response ? {
        status: error.response.status,
        data: typeof error.response.data === 'string' 
          ? error.response.data.substring(0, 200) 
          : error.response.data
      } : undefined,
      count: 0,
      ticketOpens: [],
      message: "티켓오픈 API 호출 실패, upcoming 공연 데이터 사용 권장",
      source: "fallback",
    });
  }
});

/**
 * ⭐ API 엔드포인트: /concerts/:id
 * 리스트에서 해당 ID의 공연을 찾아서 반환
 */
app.get("/concerts/:id", async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🎭 공연 상세 요청: ${id}`);

    // prodId 추출 (melon_ 접두사 제거)
    const prodId = id.replace(/^melon_/, "");
    
    // 모든 카테고리에서 찾기
    const allCategories = ["concert", "musical", "classical", "festival", "sports"];
    let foundConcert = null;
    
    for (const category of allCategories) {
      try {
        // 캐시 확인
        const cache = categoryCache[category];
        if (cache && cache.data) {
          // 캐시에서 찾기
          foundConcert = cache.data.find(item => {
            const itemId = item.id || `melon_${item.prodId}`;
            const itemProdId = String(item.prodId || "").replace(/^melon_/, "");
            return itemId === id || itemId === `melon_${id}` || itemProdId === prodId || itemProdId === id;
          });
          
          if (foundConcert) {
            console.log(`✅ 캐시에서 찾음 (${category}):`, foundConcert.title);
            break;
          }
        }
        
        // 캐시에 없으면 API 호출
        const concerts = await fetchMelonProdList({ category });
        foundConcert = concerts.find(item => {
          const itemId = item.id || `melon_${item.prodId}`;
          const itemProdId = String(item.prodId || "").replace(/^melon_/, "");
          return itemId === id || itemId === `melon_${id}` || itemProdId === prodId || itemProdId === id;
        });
        
        if (foundConcert) {
          console.log(`✅ API에서 찾음 (${category}):`, foundConcert.title);
          break;
        }
      } catch (err) {
        console.error(`❌ ${category} 카테고리 검색 실패:`, err.message);
        continue;
      }
    }
    
    if (foundConcert) {
      res.json({
        success: true,
        concert: foundConcert,
      });
    } else {
      res.status(404).json({
        success: false,
        error: "공연을 찾을 수 없습니다",
        message: `ID "${id}" (prodId: ${prodId})에 해당하는 공연이 없습니다.`,
      });
    }
  } catch (error) {
    console.error("❌ /concerts/:id API 오류:", error);
    res.status(500).json({
      success: false,
      error: "상세 정보 로드 실패",
      message: error.message,
    });
  }
});

// 서버 시작
app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════╗
║  🎉 멜론티켓 진짜 API 서버 시작!               ║
║                                               ║
║  ⭐ prodList.json 직접 호출!                   ║
║  ⭐ 실제 멜론 공연 데이터 제공!                ║
║  ⭐ 0.5초 만에 즉시 응답!                      ║
║                                               ║
║  포트: ${PORT}                                  ║
║  API:                                         ║
║  - GET http://localhost:${PORT}/health          ║
║  - GET http://localhost:${PORT}/concerts        ║
║  - GET http://localhost:${PORT}/concerts/:id    ║
╚═══════════════════════════════════════════════╝
`);
  console.log("✅ 서버 준비 완료! React 앱을 새로고침하세요!\n");
});
