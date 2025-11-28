/**
 * 🎯 멜론티켓 내부 API 캡처 테스트
 * 
 * 목적: 멜론이 사용하는 실제 API 엔드포인트 찾기
 * 
 * 실행: npm run test:api
 */

const puppeteer = require('puppeteer');

(async () => {
  console.log('🎯 멜론티켓 API 캡처 시작...\n');
  
  const browser = await puppeteer.launch({
    headless: false,
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    args: ['--no-sandbox'],
  });

  const page = await browser.newPage();
  
  // ⭐ 모든 API 요청 캡처
  const capturedAPIs = [];
  
  page.on("response", async (response) => {
    const url = response.url();
    
    // API 관련 URL만 필터링 (prodList.json 우선)
    if (
      url.includes("prodList.json") ||
      url.includes("offerList.json") ||
      url.includes("/ajax/") ||
      url.includes("/api/") || 
      url.includes(".json")
    ) {
      try {
        const contentType = response.headers()["content-type"] || "";
        
        // JSON 응답만 처리
        if (contentType.includes("application/json")) {
          const json = await response.json();
          
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          console.log('🎯 API 발견!');
          console.log('📍 URL:', url);
          console.log('📦 데이터 구조:', Object.keys(json).join(', '));
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
          
          capturedAPIs.push({
            url,
            data: json,
            timestamp: new Date().toISOString(),
          });
        }
      } catch (e) {
        // JSON 파싱 실패는 무시
      }
    }
  });
  
  console.log('🌐 멜론티켓 메인 페이지 접속 중...\n');
  
  try {
    await page.goto('https://ticket.melon.com/main/index.htm', {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    });
    console.log('✅ 메인 페이지 로딩 완료\n');
  } catch (e) {
    console.log('⚠️  페이지 로딩 오류 (계속 진행):', e.message, '\n');
  }
  
  console.log('⏳ 메인 페이지 API 대기 (5초)...\n');
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  console.log('🎭 공연 리스트 페이지로 이동...\n');
  
  try {
    await page.goto('https://ticket.melon.com/performance/index.htm', {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    });
    console.log('✅ 공연 리스트 페이지 로딩 완료\n');
  } catch (e) {
    console.log('⚠️  페이지 로딩 오류 (계속 진행):', e.message, '\n');
  }
  
  // 페이지 안정화 대기
  console.log('⏳ 페이지 안정화 대기 (3초)...\n');
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // 🎯 스크롤 다운 (prodList.json 트리거!)
  console.log('📜 페이지 스크롤 다운... (prodList.json 트리거)\n');
  
  try {
    // 여러 번 스크롤 (더 많은 API 호출)
    for (let i = 1; i <= 3; i++) {
      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight);
      });
      console.log(`   → 스크롤 ${i}회 완료\n`);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  } catch (e) {
    console.log('⚠️  스크롤 오류:', e.message, '\n');
  }
  
  // 🎯 "더보기" 버튼 클릭 시도
  console.log('👆 "더보기" 버튼 클릭 시도...\n');
  
  try {
    const moreButtonSelectors = [
      '.main_section .more_btn',
      '.more_btn',
      'button.more',
      '.btn_more',
      'a.more',
    ];
    
    let clicked = false;
    
    for (const selector of moreButtonSelectors) {
      try {
        await page.click(selector);
        console.log(`✅ "더보기" 버튼 클릭 성공! (선택자: ${selector})\n`);
        clicked = true;
        await new Promise(resolve => setTimeout(resolve, 3000));
        break;
      } catch (e) {
        // 다음 선택자 시도
      }
    }
    
    if (!clicked) {
      console.log('⚠️  "더보기" 버튼 클릭 실패 (모든 선택자 시도)\n');
      console.log('   → 스크롤만으로 prodList.json 캡처 시도\n');
    }
  } catch (e) {
    console.log('⚠️  "더보기" 버튼 클릭 오류:', e.message, '\n');
  }
  
  console.log('⏳ API 호출 대기 중 (5초)...\n');
  console.log('   → 🎯 prodList.json 찾는 중... (진짜 핵심 API!)\n');
  
  // 충분한 시간 대기
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 캡처 결과');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log(`✅ 총 ${capturedAPIs.length}개의 API 요청 캡처됨\n`);
  
  if (capturedAPIs.length > 0) {
    console.log('📋 캡처된 API 목록:\n');
    capturedAPIs.forEach((api, index) => {
      console.log(`${index + 1}. ${api.url}`);
    });
    
    // 🎯 중요한 API 찾기
    const prodListAPI = capturedAPIs.find(api => 
      api.url.includes('prodList.json')
    );
    
    const offerListAPI = capturedAPIs.find(api => 
      api.url.includes('offerList.json')
    );
    
    const detailAPI = capturedAPIs.find(api => 
      api.url.includes('detail')
    );
    
    const scheduleAPI = capturedAPIs.find(api => 
      api.url.includes('schedule')
    );
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎯 핵심 API 분석:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    if (prodListAPI) {
      console.log('🎯✅✅✅ 공연 상품 리스트 API 발견! (진짜 핵심!) 🎉');
      console.log(`   ${prodListAPI.url}\n`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🔥🔥🔥 대성공! prodList.json 캡처 완료!');
      console.log('🔥 이제 axios로 직접 호출 가능합니다!');
      console.log('🔥 Puppeteer 불필요! 0.1초 만에 데이터 로딩!');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    } else {
      console.log('❌ prodList.json API 미발견');
      console.log('   → 스크롤 또는 "더보기" 클릭이 제대로 작동하지 않았을 수 있습니다.\n');
    }
    
    if (offerListAPI) {
      console.log('✅ 추천 공연 API 발견! (offerList.json)');
      console.log(`   ${offerListAPI.url}\n`);
    }
    
    if (detailAPI) {
      console.log('✅ 상세 정보 API 발견!');
      console.log(`   ${detailAPI.url}\n`);
    }
    
    if (scheduleAPI) {
      console.log('✅ 일정 API 발견!');
      console.log(`   ${scheduleAPI.url}\n`);
    }
    
    // 캡처된 API를 JSON 파일로 저장
    const fs = require('fs');
    fs.writeFileSync(
      'captured-apis.json',
      JSON.stringify(capturedAPIs, null, 2)
    );
    console.log('💾 전체 API 데이터가 captured-apis.json에 저장되었습니다.\n');
    
    // 첫 번째 API의 전체 데이터 출력
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔍 첫 번째 API 샘플 데이터:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log(JSON.stringify(capturedAPIs[0].data, null, 2).substring(0, 1000));
    console.log('\n... (전체 데이터는 captured-apis.json 참고)\n');
  } else {
    console.log('❌ API 요청이 캡처되지 않았습니다.');
    console.log('   → 페이지 구조 확인 필요\n');
  }
  
  await browser.close();
  console.log('\n✅ 테스트 완료!');
})();

