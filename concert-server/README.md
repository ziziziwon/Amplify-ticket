# 🎭 멜론티켓 크롤링 서버

Node.js + Puppeteer를 사용한 멜론티켓 실시간 크롤링 API

---

## 🚀 빠른 시작

### 1단계: 패키지 설치
```bash
cd concert-server
npm install
```

**설치되는 패키지:**
- `puppeteer` - 브라우저 자동화
- `express` - API 서버
- `cors` - React 연동
- `nodemon` - 개발용 자동 재시작

---

### 2단계: 테스트 (중요!)
```bash
npm run test
```

**성공하면:**
```
✅ 브라우저 실행 성공!
✅ 페이지 로딩 완료!
✅ 스크린샷 저장: melon-screenshot.png
✅ 테스트 완료!
```

**크롬 창이 자동으로 열리고 멜론 페이지가 로딩됩니다!**

---

### 3단계: 서버 실행
```bash
npm start
```

**서버 시작:**
```
╔═══════════════════════════════════════════╗
║  🎭 멜론티켓 크롤링 서버 시작!            ║
║  포트: 4000                               ║
╚═══════════════════════════════════════════╝
```

---

## 📡 API 엔드포인트

### 1. 서버 상태 확인
```bash
curl http://localhost:4000/health
```

**응답:**
```json
{
  "status": "ok",
  "message": "멜론티켓 크롤링 서버 작동 중",
  "timestamp": "2025-01-24T03:12:00.000Z"
}
```

---

### 2. 콘서트 목록 크롤링
```bash
curl http://localhost:4000/concerts
```

**응답:**
```json
{
  "success": true,
  "count": 20,
  "apiCaptured": 5,
  "concerts": [
    {
      "title": "IU 콘서트 2025",
      "image": "https://...",
      "date": "2025.03.15 - 2025.03.17",
      "venue": "고척스카이돔"
    }
  ],
  "capturedAPIs": [...],
  "timestamp": "2025-01-24T03:12:00.000Z"
}
```

---

### 3. 공연 상세 정보
```bash
curl http://localhost:4000/concerts/PF123456
```

**응답:**
```json
{
  "success": true,
  "concert": {
    "title": "IU 콘서트 2025",
    "date": "2025.03.15 - 2025.03.17",
    "venue": "고척스카이돔",
    "price": "R석 99,000원",
    "description": "..."
  }
}
```

---

## 🔗 React 연동

### React에서 호출:
```typescript
// src/api/melon.ts
export async function fetchMelonConcerts() {
  const response = await fetch("http://localhost:4000/concerts");
  const data = await response.json();
  return data.concerts;
}

// 사용
const concerts = await fetchMelonConcerts();
```

---

## 🛠️ 개발 모드

```bash
npm run dev
```

**nodemon으로 자동 재시작 활성화**

---

## 🐛 문제 해결

### 1. Puppeteer 설치 오류
```bash
# Chromium 수동 다운로드
npx puppeteer browsers install chrome
```

### 2. 포트 이미 사용 중
```bash
# 포트 변경: index.js의 PORT 수정
const PORT = 5000; // 4000 → 5000
```

### 3. 크롤링 실패
```bash
# headless: false로 변경하여 디버깅
headless: false // 브라우저 창 보기
```

---

## ⚡ 성능 최적화

### 1. 이미지 로딩 차단 (속도 향상)
```javascript
await page.setRequestInterception(true);
page.on('request', (req) => {
  if (req.resourceType() === 'image') {
    req.abort();
  } else {
    req.continue();
  }
});
```

### 2. 캐싱 (Redis/메모리)
```javascript
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5분
```

---

## 🎯 다음 단계

1. ✅ **테스트 실행** → 브라우저 자동 실행 확인
2. ✅ **서버 실행** → API 호출 테스트
3. ✅ **React 연동** → useShows 훅 수정
4. ⏳ **실제 데이터 구조 분석** → 멜론 API 파악
5. ⏳ **데이터 변환** → EventItem 형식으로 매핑

---

## 📌 중요 사항

⚠️ **크롤링 주의사항:**
- 과도한 요청 금지 (1초당 1-2회 제한)
- User-Agent 설정 필수
- robots.txt 준수
- 개인 프로젝트/학습용으로만 사용

⚠️ **상업적 사용 금지**
- 멜론티켓 이용약관 확인 필요
- 공식 API가 있다면 그것 사용 권장

---

## 🎉 완료!

이제 멜론티켓 데이터를 실시간으로 크롤링할 수 있습니다!

**서버 실행 → React 연동 → 완성!** 🚀

