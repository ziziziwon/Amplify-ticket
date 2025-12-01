# 🔧 Render 빌드 문제 해결

## 🚨 문제 분석

**증상:** `npm install` 단계에서 멈춤

**원인:**
1. `puppeteer` 패키지가 `dependencies`에 포함되어 있음
2. Puppeteer는 Chromium 브라우저를 포함하므로 매우 무거움 (수백 MB)
3. Render 무료 플랜에서 설치 시 타임아웃 발생 가능
4. 실제로 `index.js`에서는 puppeteer를 사용하지 않음 (axios, cheerio만 사용)

## ✅ 해결 방법

### 1. puppeteer를 devDependencies로 이동
```json
{
  "dependencies": {
    "axios": "^1.13.2",
    "cheerio": "^1.1.2",
    "cors": "^2.8.5",
    "express": "^4.18.2"
  },
  "devDependencies": {
    "nodemon": "^3.0.2",
    "puppeteer": "^21.6.1"
  }
}
```

### 2. render.yaml 빌드 명령 수정
```yaml
buildCommand: npm install --production
```

이렇게 하면:
- 프로덕션 빌드 시 `devDependencies` 제외
- puppeteer 설치 스킵
- 빌드 시간 대폭 단축 (수백 MB → 수십 MB)

## 📊 빌드 시간 비교

**이전:**
- puppeteer 포함: ~5-10분 (타임아웃 가능)
- 설치 패키지 크기: ~300-400MB

**수정 후:**
- puppeteer 제외: ~30초-1분
- 설치 패키지 크기: ~50MB

## 🔍 확인 사항

### index.js에서 puppeteer 사용 여부
```bash
grep -r "require.*puppeteer" concert-server/index.js
# 결과: 없음 (puppeteer 미사용)
```

### 프로덕션 빌드 테스트
```bash
cd concert-server
npm install --production
# puppeteer가 설치되지 않아야 함
```

## 🚀 배포 후 확인

1. Render 대시보드 → Logs 탭
2. 빌드 로그에서 `npm install --production` 실행 확인
3. 빌드 시간이 1분 이내로 단축되었는지 확인
4. 서버 정상 시작 확인

## 📝 참고

- `puppeteer`는 테스트 파일(`test-*.js`)에서만 사용됨
- 프로덕션 환경에서는 axios로 직접 API 호출하므로 puppeteer 불필요
- 로컬 개발 시에는 `npm install` (devDependencies 포함) 사용 가능



