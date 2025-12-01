# 🎉 Render 배포 성공!

## ✅ 배포 완료

**백엔드 서버 URL:**
```
https://amplify-concert-server-bqur.onrender.com
```

**Health Check:**
```
https://amplify-concert-server-bqur.onrender.com/health
```

## 🚀 다음 단계: 프론트엔드 빌드

### 1. 환경 변수 설정 후 빌드

```bash
REACT_APP_MELON_API_URL=https://amplify-concert-server-bqur.onrender.com npm run build
```

### 2. 빌드 파일 확인

빌드가 완료되면 `build/` 폴더에 다음 파일들이 생성됩니다:
- `index.html`
- `static/` (CSS, JS 파일)
- `.htaccess` (SPA 라우팅 지원)

### 3. 카페24 서버에 업로드

1. `build/` 폴더의 모든 파일을 카페24 서버의 `/amplify` 디렉토리에 업로드
2. `.htaccess` 파일도 함께 업로드 (SPA 라우팅 지원)

### 4. 배포 확인

1. 프론트엔드 접속: `https://your-cafe24-domain.com/amplify`
2. 브라우저 개발자 도구 → Network 탭에서 API 호출 확인
3. 멜론 데이터가 정상적으로 로드되는지 확인

## 🔍 API 엔드포인트 테스트

### Health Check
```bash
curl https://amplify-concert-server-bqur.onrender.com/health
# 응답: OK
```

### 공연 목록 조회
```bash
curl https://amplify-concert-server-bqur.onrender.com/concerts?category=concert
```

### 특정 공연 상세
```bash
curl https://amplify-concert-server-bqur.onrender.com/concerts/melon_123456
```

## ⚠️ 주의사항

### Render 무료 플랜 제한
- 15분간 요청이 없으면 sleep 상태로 전환
- 첫 요청 시 약 30초 정도의 cold start 시간 소요
- 서버를 깨어있게 유지하려면:
  - Uptime Robot 등을 사용하여 5분마다 `/health` 호출
  - 또는 Starter 플랜($7/월)으로 업그레이드

### 환경 변수 설정
프론트엔드 빌드 시 반드시 환경 변수를 설정해야 합니다:
```bash
REACT_APP_MELON_API_URL=https://amplify-concert-server-bqur.onrender.com npm run build
```

환경 변수를 설정하지 않으면 기본값(`http://localhost:4000`)을 사용하여 프로덕션에서 작동하지 않습니다.

## 📝 배포 체크리스트

- [x] 백엔드 서버 배포 완료
- [x] Health check 정상 작동
- [ ] 프론트엔드 빌드 (환경 변수 설정)
- [ ] 카페24 서버에 빌드 파일 업로드
- [ ] 프론트엔드에서 API 호출 확인
- [ ] 멜론 데이터 로드 확인

## 🎯 완료!

이제 프론트엔드를 빌드하고 카페24 서버에 업로드하면 됩니다!



