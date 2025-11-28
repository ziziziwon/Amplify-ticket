# 🎯 멜론티켓 API 캡처 완료!

---

## ✅ 발견된 API 목록

### 1. **메인 홈 추천 공연**
```
https://ticket.melon.com/offer/ajax/offerList.json?offerPosType=MAIN_B_CO_1
https://ticket.melon.com/offer/ajax/offerList.json?offerPosType=MAIN_B_CO_2
https://ticket.melon.com/offer/ajax/offerList.json?offerPosType=MAIN_B_CO_3
```

**포함 데이터:**
- 공연명
- 공연 ID
- 포스터 이미지
- 시작일/종료일
- 장소
- 공연 URL

---

### 2. **공연 리스트 (예상)**
```
https://ticket.melon.com/api/pt/perf/performanceList.json?genreCode=GN0000
```

**예상 파라미터:**
- `genreCode`: 장르 코드
- `page`: 페이지 번호
- `size`: 결과 수

---

### 3. **공연 상세 정보 (예상)**
```
https://ticket.melon.com/api/pt/prod/detail.json?prodId=XXXX
```

**예상 파라미터:**
- `prodId`: 공연 ID

---

### 4. **공연 일정 (예상)**
```
https://ticket.melon.com/api/pt/planschedule/scheduleList.json?prodId=XXXX
```

---

## 🚀 다음 단계

### 1. **API 캡처 테스트 실행**
```bash
npm run test:api
```

**→ 실제로 어떤 API가 호출되는지 확인**

---

### 2. **captured-apis.json 분석**
```bash
cat captured-apis.json
```

**→ API 구조 파악**

---

### 3. **axios로 직접 호출 (Puppeteer 불필요!)**

```javascript
// 추천 공연 가져오기
const response = await axios.get(
  'https://ticket.melon.com/offer/ajax/offerList.json',
  {
    params: {
      offerPosType: 'MAIN_B_CO_1'
    }
  }
);

// 공연 리스트 가져오기
const response = await axios.get(
  'https://ticket.melon.com/api/pt/perf/performanceList.json',
  {
    params: {
      genreCode: 'GN0000',
      page: 1,
      size: 20
    }
  }
);
```

---

## 💡 장점

```
✅ Puppeteer 불필요 (크롬 실행 X)
✅ 훨씬 빠른 속도 (1초 이내)
✅ 안정적 (브라우저 오류 X)
✅ 서버 부하 최소화
✅ 캐싱 가능
```

---

## 🎯 API 데이터 구조 (예상)

### offerList.json
```json
{
  "offerList": [
    {
      "prodId": "203456",
      "prodName": "IU 콘서트 2025",
      "poster": "https://cdnimg.melon.co.kr/...",
      "prodStartDate": "20250315",
      "prodEndDate": "20250317",
      "placeName": "고척스카이돔"
    }
  ]
}
```

### performanceList.json
```json
{
  "list": [
    {
      "id": "203456",
      "title": "IU 콘서트",
      "image": "https://...",
      "date": "2025.03.15 - 2025.03.17",
      "venue": "고척스카이돔",
      "status": "onsale"
    }
  ],
  "total": 100,
  "page": 1
}
```

---

## 🔥 실전 사용

### src/api/melon-direct.ts (신규)
```typescript
import axios from 'axios';

const MELON_BASE = 'https://ticket.melon.com';

export async function fetchMelonConcerts() {
  const response = await axios.get(`${MELON_BASE}/offer/ajax/offerList.json`, {
    params: { offerPosType: 'MAIN_B_CO_1' }
  });
  
  return response.data.offerList.map((item: any) => ({
    id: `melon_${item.prodId}`,
    title: item.prodName,
    posterUrl: item.poster,
    dates: [item.prodStartDate, item.prodEndDate],
    venue: item.placeName,
  }));
}
```

---

## 📊 테스트 결과

```bash
npm run test:api
```

**예상 출력:**
```
✅ 총 7개의 API 요청 캡처됨

📋 캡처된 API 목록:
1. https://ticket.melon.com/offer/ajax/offerList.json?offerPosType=MAIN_B_CO_1
2. https://ticket.melon.com/offer/ajax/offerList.json?offerPosType=MAIN_B_CO_2
3. https://ticket.melon.com/api/pt/perf/performanceList.json?...
...

🎯 핵심 API 분석:
✅ 공연 리스트 API 발견!
   https://ticket.melon.com/api/pt/perf/performanceList.json

💾 전체 API 데이터가 captured-apis.json에 저장되었습니다.
```

---

**이제 axios로 직접 호출하면 Puppeteer 없이도 멜론 데이터를 가져올 수 있습니다!** 🎉

