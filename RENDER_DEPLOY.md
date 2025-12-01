# 🚀 Render 배포 가이드 (완벽 버전)

## 📋 문제 분석

현재 프로젝트 구조:
```
Amplify-ticket/
├── package.json          (프론트엔드 - 많은 의존성)
├── concert-server/
│   ├── package.json      (백엔드 - 작은 의존성)
│   └── index.js
└── render.yaml
```

**문제점:**
- Render가 `rootDir: concert-server`를 제대로 인식하지 못함
- 루트에서 `npm install`을 실행하여 프론트엔드 의존성을 설치하려고 시도
- 프론트엔드 의존성이 너무 커서 설치가 오래 걸리거나 실패

## ✅ 해결 방법 1: Blueprint 사용 (권장)

### 1단계: render.yaml 확인
`render.yaml`이 프로젝트 루트에 있는지 확인:
```bash
ls -la render.yaml
```

### 2단계: GitHub에 푸시
```bash
git add render.yaml
git commit -m "fix: Render 배포 설정"
git push origin main
```

### 3단계: Render에서 Blueprint 생성
1. Render 대시보드 → "New +" → "Blueprint"
2. GitHub 저장소 연결: `ziziziwon/Amplify-ticket`
3. `render.yaml` 자동 감지 확인
4. "Apply" 클릭

### 4단계: 배포 확인
- 빌드 로그에서 `cd concert-server` 후 `npm install` 실행되는지 확인
- Health check: `https://amplify-concert-server.onrender.com/health`

## ✅ 해결 방법 2: 수동 Web Service 생성 (Blueprint 실패 시)

### 1단계: Render에서 Web Service 생성
1. Render 대시보드 → "New +" → "Web Service"
2. GitHub 저장소 연결: `ziziziwon/Amplify-ticket`

### 2단계: 설정 입력
- **Name**: `amplify-concert-server`
- **Environment**: `Node`
- **Region**: `Frankfurt`
- **Branch**: `main`
- **Root Directory**: `concert-server` ⭐ **중요!**
- **Build Command**: `npm install`
- **Start Command**: `node index.js`
- **Plan**: `Free`

### 3단계: Environment Variables
- `NODE_ENV` = `production`

### 4단계: Health Check
- **Health Check Path**: `/health`

### 5단계: Create Web Service
- "Create Web Service" 클릭
- 배포 시작

## ✅ 해결 방법 3: .renderignore 파일 생성 (선택사항)

프론트엔드 파일을 제외하여 빌드 속도 향상:

```bash
# .renderignore 파일 생성
cat > .renderignore << EOF
# 프론트엔드 파일 제외
src/
public/
build/
package.json
package-lock.json
tsconfig.json
*.md
!concert-server/README.md
EOF
```

## 🔍 문제 해결 체크리스트

### render.yaml 확인
- [ ] `render.yaml`이 프로젝트 루트에 있음
- [ ] `rootDir: concert-server` 설정되어 있음
- [ ] `startCommand: node index.js` 설정되어 있음
- [ ] `healthCheckPath: /health` 설정되어 있음

### concert-server 확인
- [ ] `concert-server/package.json` 존재
- [ ] `concert-server/index.js` 존재
- [ ] `concert-server/index.js`에 `/health` 엔드포인트 있음

### GitHub 확인
- [ ] `render.yaml`이 Git에 포함되어 있음
- [ ] 최신 커밋이 GitHub에 푸시됨

### Render 확인
- [ ] Blueprint 또는 Web Service 생성됨
- [ ] Root Directory가 `concert-server`로 설정됨
- [ ] Build Command가 `npm install`로 설정됨
- [ ] Start Command가 `node index.js`로 설정됨

## 🐛 디버깅

### 빌드 로그 확인
Render 대시보드 → Logs 탭에서 확인:
```
==> Cloning from https://github.com/ziziziwon/Amplify-ticket
==> Checking out commit...
==> Using Node.js version...
==> Running build command 'npm install'...  ← concert-server 디렉토리에서 실행되어야 함
```

### Health Check 테스트
```bash
curl https://amplify-concert-server.onrender.com/health
# 응답: OK
```

### 서버 로그 확인
Render 대시보드 → Logs 탭에서 서버 시작 메시지 확인:
```
╔═══════════════════════════════════════════════╗
║  🎉 멜론티켓 진짜 API 서버 시작!               ║
║  포트: 4000 (또는 Render가 지정한 포트)        ║
╚═══════════════════════════════════════════════╝
```

## 📝 배포 후 작업

### 1. 서비스 URL 확인
Render 대시보드에서 서비스 URL 확인:
- 예: `https://amplify-concert-server.onrender.com`

### 2. 프론트엔드 빌드
```bash
REACT_APP_MELON_API_URL=https://amplify-concert-server.onrender.com npm run build
```

### 3. 카페24에 업로드
- `build/` 폴더의 모든 파일을 카페24 서버의 `/amplify` 디렉토리에 업로드

## ⚠️ 주의사항

1. **Render 무료 플랜 제한**
   - 15분간 요청이 없으면 sleep 상태로 전환
   - 첫 요청 시 약 30초 정도의 cold start 시간 소요
   - Uptime Robot 등을 사용하여 주기적으로 `/health` 호출 권장

2. **포트 설정**
   - Render는 자동으로 `PORT` 환경 변수를 설정
   - `index.js`에서 `process.env.PORT || 4000` 사용 중이므로 문제없음

3. **Health Check**
   - `/health` 엔드포인트가 `200 OK`를 반환해야 함
   - Health check 실패 시 서버가 재시작될 수 있음



