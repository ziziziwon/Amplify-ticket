# 🔧 문제 해결 가이드

## 현재 상황

```
✅ Express 서버: 정상 (포트 4000)
✅ /health: OK
❌ Puppeteer 브라우저: 실행 실패
❌ /concerts: socket hang up
```

---

## 🚨 "socket hang up" 오류

### 원인
Puppeteer 브라우저가 실행되지 않아서 크롤링이 실패하는 상황

### 증상
```
FetchError: request to http://localhost:4000/concerts failed, reason: socket hang up
```

---

## ✅ 해결 방법

### 1단계: Chrome 경로 확인
```bash
# Mac에서 Chrome 위치 확인
ls /Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome
```

**있으면:** ✅ 정상  
**없으면:** Chrome 설치 필요

---

### 2단계: 간단한 테스트 실행
```bash
cd concert-server
node test-simple.js
```

**성공 시:**
```
✅ 브라우저 실행 성공!
✅ 페이지 생성 성공!
✅ 멜론티켓 접속 성공!
📄 페이지 제목: 멜론티켓
```

**실패 시:**
- Chrome 경로 오류
- 권한 문제
- Puppeteer 미설치

---

### 3단계: 서버 재시작
```bash
# 기존 서버 종료 (Ctrl+C)
npm start
```

**서버 실행 후 /concerts 호출:**
```bash
curl http://localhost:4000/concerts
```

---

## 🔍 디버깅 체크리스트

### ✅ Chrome 설치 확인
```bash
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --version
```

### ✅ Puppeteer 설치 확인
```bash
npm list puppeteer
```

### ✅ 브라우저 창이 뜨는지 확인
```bash
node test-simple.js
```

**크롬 창이 자동으로 열리고 멜론 페이지가 로딩되어야 합니다!**

---

## 🐛 자주 발생하는 오류

### 1. "Chromium not found"
```bash
# 해결
npx puppeteer browsers install chrome
```

### 2. "Protocol error (Target.setDiscoverTargets)"
```javascript
// 해결: headless: false로 변경
headless: false
```

### 3. "Navigation timeout of 30000 ms exceeded"
```javascript
// 해결: timeout 늘리기
timeout: 60000 // 30초 → 60초
```

### 4. Mac M1/M2에서 실행 안 됨
```javascript
// 해결: executablePath 명시
executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
```

---

## 📊 현재 설정 (수정됨)

### index.js
```javascript
const browser = await puppeteer.launch({
  headless: false, // ⭐ 창 보기
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  args: ['--no-sandbox'],
});
```

**이렇게 하면:**
1. 크롬 창이 자동으로 열림
2. 멜론 페이지 로딩
3. 크롤링 데이터 수집
4. API 응답 반환

---

## 🎯 테스트 순서

1. **간단한 테스트**
   ```bash
   node test-simple.js
   ```

2. **전체 테스트**
   ```bash
   npm run test
   ```

3. **서버 실행**
   ```bash
   npm start
   ```

4. **API 호출**
   ```bash
   curl http://localhost:4000/concerts
   ```

5. **React 확인**
   ```
   http://localhost:3000/categories/concert
   ```

---

## 💡 성공 신호

### 터미널 (concert-server)
```
✅ 브라우저 실행 성공!
🌐 멜론티켓 페이지 접속 중...
✅ 페이지 로딩 완료!
✅ 크롤링 완료: 20개의 공연 발견
```

### 브라우저
- Chrome 창이 자동으로 열림
- 멜론티켓 페이지 로딩
- 공연 목록 표시

### React 콘솔 (F12)
```
🎭 멜론티켓 모드: 실시간 크롤링
✅ 멜론에서 20개의 공연 로드
```

---

## 🚀 지금 해야 할 일

1. **서버 재시작** (파일 수정됨)
   ```bash
   cd concert-server
   # Ctrl+C로 기존 서버 종료
   npm start
   ```

2. **간단한 테스트**
   ```bash
   node test-simple.js
   ```

3. **크롬 창 확인**
   - 자동으로 열리는지
   - 멜론 페이지가 로딩되는지

4. **API 테스트**
   ```bash
   curl http://localhost:4000/concerts
   ```

---

**이제 크롬 창이 자동으로 열리고 크롤링이 작동해야 합니다!** 🚀

