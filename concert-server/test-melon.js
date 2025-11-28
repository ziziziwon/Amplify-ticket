/**
 * ✅ 2단계: 멜론티켓 페이지 실제로 띄워보기 (테스트)
 * 
 * 실행 방법:
 * npm run test
 * 
 * 성공하면: 크롬 창이 자동으로 열리고 멜론 페이지가 로딩됨
 */

const puppeteer = require("puppeteer");

(async () => {
  console.log("🎭 멜론티켓 크롤링 테스트 시작...");
  
  try {
    // 브라우저 실행 (headless: false = 창이 보임)
    const browser = await puppeteer.launch({
      headless: false, // 개발 중에는 false로 (디버깅용)
      executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', // ⭐ Mac Chrome 경로
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-blink-features=AutomationControlled',
      ],
    });

    console.log("✅ 브라우저 실행 성공!");

    const page = await browser.newPage();

    // User-Agent 설정 (봇 차단 방지)
    await page.setUserAgent(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    );

    console.log("🌐 멜론티켓 페이지 접속 중...");

    // 멜론티켓 콘서트 페이지 접속
    await page.goto("https://ticket.melon.com/performance/index.htm", {
      waitUntil: "networkidle2",
      timeout: 30000,
    });

    console.log("✅ 페이지 로딩 완료!");
    console.log("📸 5초 후 스크린샷 촬영...");

    // 5초 대기
    await new Promise(resolve => setTimeout(resolve, 5000));

    // 스크린샷 저장
    await page.screenshot({ path: "melon-screenshot.png", fullPage: true });
    console.log("✅ 스크린샷 저장: melon-screenshot.png");

    // 페이지 제목 확인
    const title = await page.title();
    console.log(`📄 페이지 제목: ${title}`);

    // 10초 후 자동 종료
    console.log("⏳ 10초 후 브라우저 종료...");
    await new Promise(resolve => setTimeout(resolve, 10000));

    await browser.close();
    console.log("✅ 테스트 완료!");
    
  } catch (error) {
    console.error("❌ 오류 발생:", error.message);
    process.exit(1);
  }
})();

