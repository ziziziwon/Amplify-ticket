/**
 * 🔥 직접 URL 테스트
 * 
 * 멜론티켓 페이지가 제대로 열리는지 확인
 */

const puppeteer = require('puppeteer');

(async () => {
  console.log('🚀 멜론티켓 직접 테스트...');
  
  const browser = await puppeteer.launch({
    headless: false,
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    args: ['--no-sandbox'],
  });

  const page = await browser.newPage();
  
  console.log('1️⃣ 멜론티켓 메인 페이지 접속...');
  
  try {
    await page.goto('https://ticket.melon.com/performance/index.htm', {
      waitUntil: 'load',
      timeout: 60000,
    });
    console.log('✅ 페이지 접속 성공!');
  } catch (error) {
    console.log('⚠️  페이지 접속 오류:', error.message);
    console.log('   → Chrome 창이 열렸다면 정상입니다. 계속 진행...');
  }
  
  // 페이지 완전 안정화 대기 (중요!)
  console.log('⏳ 페이지 안정화 대기 (8초)...');
  await new Promise(resolve => setTimeout(resolve, 8000));
  
  // 현재 URL 확인
  try {
    const currentUrl = page.url();
    console.log(`📍 현재 URL: ${currentUrl}`);
  } catch (e) {
    console.log('⚠️  URL 조회 실패 (무시)');
  }
  
  // 페이지 제목 확인
  try {
    const title = await page.title();
    console.log(`📄 페이지 제목: ${title}`);
  } catch (e) {
    console.log('⚠️  제목 조회 실패 (무시)');
  }
  
  // HTML 구조 확인
  const hasContent = await page.evaluate(() => {
    const lists = [
      document.querySelectorAll('.performance_list li').length,
      document.querySelectorAll('.poster_list li').length,
      document.querySelectorAll('.concert-item').length,
      document.querySelectorAll('.list_wrap li').length,
    ];
    return {
      performance_list: lists[0],
      poster_list: lists[1],
      concert_item: lists[2],
      list_wrap: lists[3],
      total: lists.reduce((a, b) => a + b, 0),
    };
  });
  
  console.log('📊 발견된 콘텐츠:', hasContent);
  
  // 스크린샷
  await page.screenshot({ path: 'melon-direct.png', fullPage: true });
  console.log('📸 스크린샷 저장: melon-direct.png');
  
  console.log('⏳ 10초 후 종료...');
  await new Promise(resolve => setTimeout(resolve, 10000));
  
  await browser.close();
  console.log('✅ 테스트 완료!');
})();

