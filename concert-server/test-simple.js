/**
 * 🔥 간단한 Puppeteer 테스트
 * 
 * 브라우저가 제대로 실행되는지만 확인
 * 
 * 실행: node test-simple.js
 */

const puppeteer = require('puppeteer');

(async () => {
  console.log('🚀 Puppeteer 테스트 시작...');
  
  try {
    console.log('1️⃣ 브라우저 실행 시도...');
    
    const browser = await puppeteer.launch({
      headless: false, // 창이 보이게
      executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      args: ['--no-sandbox'],
    });
    
    console.log('✅ 브라우저 실행 성공!');
    console.log('2️⃣ 새 페이지 생성...');
    
    const page = await browser.newPage();
    console.log('✅ 페이지 생성 성공!');
    
    console.log('3️⃣ 멜론티켓 접속 시도...');
    
    await page.goto('https://ticket.melon.com/performance/index.htm', {
      waitUntil: 'networkidle2',
      timeout: 30000,
    });
    
    console.log('✅ 멜론티켓 접속 성공!');
    
    const title = await page.title();
    console.log(`📄 페이지 제목: ${title}`);
    
    console.log('⏳ 5초 후 종료...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    await browser.close();
    console.log('✅ 테스트 완료!');
    
  } catch (error) {
    console.error('❌ 오류 발생:', error.message);
    console.error('📋 전체 에러:', error);
  }
})();

