/**
 * ⭐ 멜론티켓 offerList.json 기반 서버
 * 
 * 실제 멜론 API 데이터 사용!
 * offerList.json → React 전달
 * 
 * 실행: node index-offerlist.js
 */

const express = require("express");
const cors = require("cors");
const puppeteer = require("puppeteer");

const app = express();
const PORT = 4000;

// CORS 설정
app.use(cors());
app.use(express.json());

// 캐시
let cachedData = null;
let lastFetchTime = null;
const CACHE_DURATION = 10 * 60 * 1000; // 10분

// 서버 상태 확인
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    message: "멜론티켓 offerList 서버 (실제 데이터!)",
    cached: cachedData !== null,
    timestamp: new Date().toISOString(),
  });
});

/**
 * ⭐ Puppeteer로 offerList.json 캡처 (실제 멜론 데이터!)
 */
async function fetchMelonOfferList() {
  console.log("🎭 멜론 offerList.json 캡처 시작...");

  let browser;
  const capturedData = [];

  try {
    browser = await puppeteer.launch({
      headless: "new",
      executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });

    const page = await browser.newPage();
    
    // CDP 활성화
    const client = await page.target().createCDPSession();
    await client.send('Network.enable');

    // API 캡처
    client.on('Network.responseReceived', async (params) => {
      const url = params.response.url;
      
      if (url.includes('offerList.json')) {
        try {
          const responseBody = await client.send('Network.getResponseBody', {
            requestId: params.requestId,
          });
          const data = JSON.parse(responseBody.body);
          console.log(`✅ offerList.json 캡처: ${url}`);
          capturedData.push({ url, data });
        } catch (e) {
          // 파싱 실패 무시
        }
      }
    });

    // 멜론 메인 페이지 접속
    console.log("🌐 멜론 메인 페이지 접속...");
    await page.goto("https://ticket.melon.com/main/index.htm", {
      waitUntil: "networkidle0",
      timeout: 30000,
    });

    // API 대기
    await new Promise(resolve => setTimeout(resolve, 3000));

    console.log(`✅ 총 ${capturedData.length}개 offerList API 캡처`);

    await browser.close();

    // 데이터 변환
    const concerts = [];
    capturedData.forEach(api => {
      if (api.data.data && Array.isArray(api.data.data)) {
        api.data.data.forEach(item => {
          concerts.push({
            id: `melon_${item.offerId || item.productId}`,
            title: item.offerName || item.productName || "제목 없음",
            image: item.posterImg || item.poster || "https://via.placeholder.com/500x700?text=No+Image",
            date: `${item.playStartDate || item.prodStartDate} - ${item.playEndDate || item.prodEndDate}`,
            place: item.playPlaceName || item.place?.placeName || "공연장",
            link: `https://ticket.melon.com/performance/detail.htm?prodId=${item.offerId || item.productId}`,
            category: "concert",
          });
        });
      }
    });

    console.log(`✅ 최종 ${concerts.length}개 공연 추출`);
    return concerts;

  } catch (error) {
    console.error("❌ 캡처 오류:", error.message);
    if (browser) {
      await browser.close();
    }
    return [];
  }
}

/**
 * ⭐ API 엔드포인트: /concerts
 */
app.get("/concerts", async (req, res) => {
  try {
    console.log("🎭 /concerts 요청");

    // 캐시 확인
    const now = Date.now();
    if (cachedData && lastFetchTime && (now - lastFetchTime) < CACHE_DURATION) {
      console.log("✅ 캐시된 데이터 사용");
      return res.json({
        success: true,
        count: cachedData.length,
        concerts: cachedData,
        cached: true,
        source: "melon-offerList",
        timestamp: new Date().toISOString(),
      });
    }

    // 새로 크롤링
    console.log("🔄 새로운 크롤링 시작...");
    const concerts = await fetchMelonOfferList();

    // 캐시 저장
    cachedData = concerts;
    lastFetchTime = now;

    res.json({
      success: true,
      count: concerts.length,
      concerts,
      cached: false,
      source: "melon-offerList",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ /concerts API 오류:", error);
    res.status(500).json({
      success: false,
      message: "크롤링 실패",
      error: error.message,
    });
  }
});

/**
 * ⭐ API 엔드포인트: /concerts/:id
 */
app.get("/concerts/:id", (req, res) => {
  const { id } = req.params;
  res.json({
    success: true,
    detail: {
      id,
      message: "상세 정보는 추후 구현",
    },
  });
});

// 서버 시작
app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════╗
║  🎭 멜론티켓 offerList 서버 시작!              ║
║                                               ║
║  ⭐ 실제 멜론 API 데이터 사용!                 ║
║  ⭐ offerList.json 캡처 → React 전달!         ║
║                                               ║
║  포트: ${PORT}                                  ║
║  API:                                         ║
║  - GET http://localhost:${PORT}/health          ║
║  - GET http://localhost:${PORT}/concerts        ║
║  - GET http://localhost:${PORT}/concerts/:id    ║
╚═══════════════════════════════════════════════╝
`);
});

