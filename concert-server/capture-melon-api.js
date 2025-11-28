/**
 * ⭐ 멜론티켓 API 완전 캡처 (XHR 후킹 + CDP)
 * 
 * prodList.json / performanceList.json 확실하게 잡기!
 * 
 * 실행: node capture-melon-api.js
 */

const puppeteer = require("puppeteer");
const fs = require("fs");

(async () => {
  console.log("🎭 멜론티켓 API 완전 캡처 시작...\n");

  let browser;
  const capturedAPIs = [];

  try {
    browser = await puppeteer.launch({
      headless: false, // 브라우저 보이게 (디버깅용)
      executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--window-size=1920,1080'
      ]
    });

    const page = await browser.newPage();

    // ⭐ CDP (Chrome DevTools Protocol) 활성화
    const client = await page.target().createCDPSession();
    await client.send('Network.enable');

    console.log("🔍 CDP 네트워크 감시 시작...\n");

    // ⭐ CDP로 모든 네트워크 요청 감시
    client.on('Network.responseReceived', async (params) => {
      const url = params.response.url;
      const type = params.response.mimeType;

      // JSON 응답만 캡처
      if (type && type.includes('application/json')) {
        if (
          url.includes('prodList') ||
          url.includes('performanceList') ||
          url.includes('offerList') ||
          url.includes('/api/pt/') ||
          url.includes('/offer/ajax/')
        ) {
          try {
            const responseBody = await client.send('Network.getResponseBody', {
              requestId: params.requestId,
            });
            
            const data = JSON.parse(responseBody.body);
            
            capturedAPIs.push({
              url,
              method: params.response.status,
              timestamp: new Date().toISOString(),
              data,
            });

            console.log(`📦 API 캡처: ${url.split('/').pop()}`);
            console.log(`   → ${Object.keys(data).join(', ')}\n`);
          } catch (e) {
            // 파싱 실패 무시
          }
        }
      }
    });

    // 1단계: 멜론 메인 페이지
    console.log("🌐 1단계: 멜론 메인 페이지 접속...");
    await page.goto("https://ticket.melon.com/main/index.htm", {
      waitUntil: "networkidle0",
      timeout: 60000,
    });
    console.log("✅ 메인 페이지 로딩 완료\n");
    await new Promise(resolve => setTimeout(resolve, 3000));

    // 2단계: 공연 리스트 페이지
    console.log("🎭 2단계: 공연 리스트 페이지로 이동...");
    await page.goto("https://ticket.melon.com/performance/index.htm", {
      waitUntil: "networkidle0",
      timeout: 60000,
    });
    console.log("✅ 공연 리스트 페이지 로딩 완료\n");
    await new Promise(resolve => setTimeout(resolve, 5000));

    // 3단계: 페이지 스크롤 (Lazy Loading 트리거)
    console.log("📜 3단계: 페이지 스크롤 (추가 API 트리거)...");
    for (let i = 0; i < 3; i++) {
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    console.log("✅ 스크롤 완료\n");

    // 4단계: 장르 탭 클릭 시도
    console.log("👆 4단계: 장르 탭 클릭 시도...");
    const tabSelectors = [
      '.tab_list button',
      '.filter_area button',
      '.genre_tab button',
      'button[data-genre]',
    ];
    
    for (const selector of tabSelectors) {
      try {
        const buttons = await page.$$(selector);
        if (buttons.length > 0) {
          console.log(`   → ${buttons.length}개 버튼 발견 (${selector})`);
          for (let i = 0; i < Math.min(buttons.length, 3); i++) {
            await buttons[i].click();
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
          break;
        }
      } catch (e) {
        // 다음 선택자 시도
      }
    }
    console.log("✅ 탭 클릭 완료\n");

    // 5단계: 추가 대기
    console.log("⏳ 5단계: 최종 API 대기 중 (5초)...");
    await new Promise(resolve => setTimeout(resolve, 5000));

    // 결과 분석
    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("📊 캡처 결과");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
    console.log(`✅ 총 ${capturedAPIs.length}개 API 캡처됨\n`);

    // 핵심 API 찾기
    const prodListAPI = capturedAPIs.find(api => api.url.includes('prodList'));
    const performanceAPI = capturedAPIs.find(api => api.url.includes('performanceList'));
    const offerListAPI = capturedAPIs.find(api => api.url.includes('offerList'));

    console.log("🎯 핵심 API 분석:\n");

    if (prodListAPI) {
      console.log("🎉🎉🎉 prodList.json 발견! (공연 리스트!)");
      console.log(`   URL: ${prodListAPI.url}`);
      console.log(`   데이터 키: ${Object.keys(prodListAPI.data).join(', ')}`);
      console.log(`   공연 수: ${prodListAPI.data.data?.length || prodListAPI.data.list?.length || '?'}\n`);
    }

    if (performanceAPI) {
      console.log("🎉🎉🎉 performanceList.json 발견! (공연 리스트!)");
      console.log(`   URL: ${performanceAPI.url}`);
      console.log(`   데이터 키: ${Object.keys(performanceAPI.data).join(', ')}`);
      console.log(`   공연 수: ${performanceAPI.data.data?.length || performanceAPI.data.list?.length || '?'}\n`);
    }

    if (offerListAPI) {
      console.log("✅ offerList.json 발견! (추천 공연)");
      console.log(`   URL: ${offerListAPI.url}`);
      console.log(`   공연 수: ${offerListAPI.data.offerList?.length || '?'}\n`);
    }

    if (!prodListAPI && !performanceAPI && !offerListAPI) {
      console.log("❌ 핵심 API를 찾지 못했습니다.\n");
      console.log("📋 캡처된 API 목록:");
      capturedAPIs.forEach((api, i) => {
        console.log(`   ${i + 1}. ${api.url.split('/').pop()}`);
      });
    }

    // 결과 파일 저장
    const outputFile = "captured-melon-apis.json";
    fs.writeFileSync(outputFile, JSON.stringify(capturedAPIs, null, 2));
    console.log(`\n💾 전체 API 데이터가 ${outputFile}에 저장되었습니다.\n`);

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    // 브라우저 유지 (확인용)
    console.log("🔍 브라우저를 확인하세요. (자동 종료되지 않음)");
    console.log("   종료하려면 Ctrl+C를 누르세요.\n");

    // await browser.close();

  } catch (error) {
    console.error("\n❌ 오류 발생:", error.message);
    if (browser) {
      await browser.close();
    }
  }
})();

