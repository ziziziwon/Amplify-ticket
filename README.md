# 🎸 AMPLIFY - 소리를 키우다, 무대를 키우다

전세계 아티스트의 내한 공연 티켓팅 플랫폼

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-19.1.1-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-4.9.5-blue.svg)](https://www.typescriptlang.org/)
[![Firebase](https://img.shields.io/badge/Firebase-12.6.0-orange.svg)](https://firebase.google.com/)

## 📋 프로젝트 개요

**AMPLIFY**는 한국 대형 공연장 기반의 내한 공연 전문 티켓팅 플랫폼입니다.

> "소리를 키우다, 무대를 키우다" - Amplify the sound, Amplify the stage

### 주요 기능

- 🏠 **Landing/Home**: 최신 공연, 공연장별 보기, 카테고리별 필터링
- 🎤 **공연 리스트**: 필터링, 검색, 정렬, 랭킹 시스템
- 🎸 **공연 상세**: 회차 선택, 가격표, 공연장 정보, 카카오맵 연동
- 🔐 **인증예매**: CAPTCHA, 선예매 코드 입력, SMS 인증
- 🪑 **좌석 선택**: 인터랙티브 SVG 좌석맵, 실시간 좌석 상태, 드래그/확대/축소
- 🛒 **장바구니**: 선택 좌석 확인, 수량 조절
- 💳 **결제**: 예매자 정보, 결제수단 선택, 팝업 결제 플로우
- 🎫 **티켓함**: QR 코드 자동 생성, 티켓 다운로드, 예매 취소
- 🔧 **관리자**: 공연/좌석/예매자 관리, 통계 대시보드, 이벤트 관리

## 🛠 기술 스택

### Frontend
- **React 19.1.1** - 최신 React 기능 활용
- **TypeScript 4.9.5** - 타입 안정성
- **Material-UI (MUI) 7.3.5** - UI 컴포넌트 라이브러리
- **Zustand 5.0.8** - 경량 상태 관리
- **React Router v7.9.5** - 클라이언트 사이드 라우팅
- **Emotion** - CSS-in-JS 스타일링
- **Framer Motion 12.23.24** - 애니메이션
- **Swiper 12.0.3** - 슬라이더 컴포넌트

### Backend & Services
- **Firebase 12.6.0**
  - Firestore - 실시간 데이터베이스
  - Authentication - 사용자 인증
  - Storage - 파일 저장소
- **Axios 1.13.2** - HTTP 클라이언트

### Utilities
- **QR Code** - 티켓 QR 코드 생성
- **Date-fns 4.1.0** - 날짜 처리
- **Chart.js 4.5.0** - 관리자 대시보드 차트
- **Iconify React 6.0.2** - 아이콘 라이브러리

## 📁 프로젝트 구조

```
amplify-ticket/
├── public/                 # 정적 파일
│   ├── index.html         # 메인 HTML
│   ├── seat-popup.html    # 좌석 선택 팝업
│   └── assets/            # 이미지, 로고
├── src/
│   ├── api/               # 외부 API 연동
│   │   ├── melon.ts       # 멜론티켓 API
│   │   ├── ticketmaster.ts # Ticketmaster API
│   │   └── kopis.ts       # KOPIS API
│   ├── components/        # 재사용 가능한 컴포넌트
│   │   ├── Layout/        # Header, Footer, MainLayout
│   │   ├── SeatMap/       # SVG 좌석맵 컴포넌트
│   │   ├── PaymentPopup/  # 결제 팝업
│   │   ├── Auth/          # 인증 관련 컴포넌트
│   │   └── Admin/         # 관리자 컴포넌트
│   ├── pages/             # 페이지 컴포넌트
│   │   ├── Home/          # 홈 페이지
│   │   ├── Shows/         # 공연 리스트, 상세
│   │   ├── Reserve/       # 좌석 선택, 결제
│   │   ├── MyTickets/     # 티켓함
│   │   ├── Admin/         # 관리자 페이지
│   │   └── Events/        # 이벤트 페이지
│   ├── stores/            # 상태 관리 (Zustand)
│   │   └── useTicketStore.ts
│   ├── hooks/             # 커스텀 훅
│   │   ├── useShows.ts
│   │   └── useVenues.ts
│   ├── types/             # TypeScript 타입 정의
│   ├── utils/             # 유틸리티 함수
│   │   ├── constants.ts   # 상수
│   │   ├── formatters.ts  # 포맷팅 함수
│   │   └── validation.ts  # 유효성 검사
│   ├── firebase/          # Firebase 설정
│   │   ├── config.ts      # Firebase 초기화
│   │   └── services.ts    # Firestore 서비스
│   └── data/              # 정적 데이터
│       ├── shows.json     # 공연 데이터
│       ├── venues.json    # 공연장 데이터
│       └── seatmaps/      # 좌석맵 JSON
└── concert-server/        # 멜론티켓 API 프록시 서버
```

## 🚀 시작하기

### 필수 요구사항

- Node.js 16.x 이상
- npm 또는 yarn
- Firebase 프로젝트

### 1. 저장소 클론

```bash
git clone https://github.com/ziziziwon/Amplify-ticket.git
cd Amplify-ticket
```

### 2. 패키지 설치

```bash
npm install
```

### 3. 환경 변수 설정

프로젝트 루트에 `.env` 파일을 생성하세요.

```bash
# .env 파일 생성
touch .env
```

`.env` 파일에 다음 내용을 추가하세요:

```env
# 멜론티켓 백엔드 API URL
# 개발 환경: http://localhost:4000
# 프로덕션 환경: Render 배포된 서버 URL
REACT_APP_MELON_API_URL=http://localhost:4000
```

**프로덕션 환경 변수 (`.env.production`):**
```env
REACT_APP_MELON_API_URL=https://amplify-concert-server-bqur.onrender.com
```

필요한 환경 변수:
- `REACT_APP_MELON_API_URL`: 멜론티켓 백엔드 서버 URL
  - 개발: `http://localhost:4000`
  - 프로덕션: `https://amplify-concert-server-bqur.onrender.com`
- Firebase 설정 정보 (코드에 직접 설정됨)

### 4. Firebase 설정

`src/firebase/config.ts` 파일에서 Firebase 설정을 본인의 프로젝트 설정으로 변경하세요.

```typescript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
};
```

### 5. Firestore 규칙 설정

`firestore.rules` 파일을 Firebase Console에서 업로드하거나, 다음 규칙을 적용하세요:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 사용자 데이터
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      match /tickets/{ticketId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
    // 공연 데이터
    match /shows/{showId} {
      allow read: if true;
      allow write: if request.auth != null && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    // 주문 데이터
    match /orders/{orderId} {
      allow read: if request.auth != null && (resource.data.userId == request.auth.uid || get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
      allow create: if request.auth != null;
      allow update: if request.auth != null && (resource.data.userId == request.auth.uid || get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
    }
  }
}
```

### 6. 백엔드 서버 실행 (멜론티켓 API)

별도 터미널에서 백엔드 서버를 실행하세요:

```bash
cd concert-server
npm install
npm start
```

백엔드 서버는 `http://localhost:4000`에서 실행됩니다.

### 7. 개발 서버 실행

```bash
npm start
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 을 열어 확인하세요.

### 7. 프로덕션 빌드

```bash
npm run build
```

빌드된 파일은 `build/` 디렉토리에 생성됩니다.

## 🚀 배포 가이드

### 프론트엔드 배포 (카페24 서버)

1. **프로덕션 빌드 생성**
   ```bash
   npm run build
   ```

2. **환경 변수 설정**
   프로덕션 환경에서는 `.env.production` 파일을 생성하거나, 빌드 전에 환경 변수를 설정하세요:
   ```bash
   # .env.production 파일 생성
   REACT_APP_MELON_API_URL=https://your-backend-server.com
   ```

3. **빌드 파일 업로드**
   - `build/` 폴더의 모든 파일을 카페24 서버의 `/amplify` 디렉토리에 업로드
   - `.htaccess` 파일도 함께 업로드 (SPA 라우팅 지원)

### 백엔드 서버 배포

백엔드 서버(`concert-server`)는 별도로 배포해야 합니다. 카페24는 일반적으로 Node.js 서버를 지원하지 않으므로, 다음 옵션 중 하나를 선택하세요:

#### 옵션 1: Render 배포 (권장) ⭐

**Render는 무료 플랜을 제공하며, 자동 배포가 가능합니다.**

1. **Render 계정 생성**
   - [Render.com](https://render.com)에 가입
   - GitHub 계정으로 연동 권장

2. **GitHub에 코드 푸시**
   ```bash
   git add .
   git commit -m "feat: Render 배포 설정 추가"
   git push origin main
   ```

3. **Render에서 서비스 생성**
   - Render 대시보드에서 "New +" → "Blueprint" 선택
   - GitHub 저장소 연결
   - `render.yaml` 파일이 자동으로 감지됨
   - "Apply" 클릭하여 서비스 생성

4. **또는 수동으로 Web Service 생성**
   - Render 대시보드에서 "New +" → "Web Service" 선택
   - GitHub 저장소 연결
   - 설정:
     - **Name**: `amplify-concert-server`
     - **Environment**: `Node`
     - **Region**: `Frankfurt`
     - **Root Directory**: `concert-server`
     - **Build Command**: `npm install --production`
     - **Start Command**: `node index.js`
     - **Plan**: `Free` (또는 `Starter`)

5. **환경 변수 설정 (선택사항)**
   - Render 대시보드 → Environment 탭
   - `NODE_ENV=production` (자동 설정됨)
   - `PORT`는 Render가 자동으로 설정

6. **배포 완료 후 URL 확인**
   - Render 대시보드에서 서비스 URL 확인 (예: `https://amplify-concert-server-bqur.onrender.com`)
   - Health check: `https://amplify-concert-server-bqur.onrender.com/health`
   - 응답: `{"status":"ok"}` (JSON 형식)

7. **프론트엔드 환경 변수 설정**
   ```bash
   # .env.production 파일 생성
   REACT_APP_MELON_API_URL=https://amplify-concert-server-bqur.onrender.com
   ```
   
   또는 빌드 시 직접 설정:
   ```bash
   REACT_APP_MELON_API_URL=https://amplify-concert-server-bqur.onrender.com npm run build
   ```

**✅ 현재 배포된 서버:**
- 백엔드 URL: `https://amplify-concert-server-bqur.onrender.com`
- Health Check: `https://amplify-concert-server-bqur.onrender.com/health`
- 프론트엔드: 카페24 서버 (`/amplify` 경로)

**⚠️ Render 무료 플랜 제한사항:**
- 15분간 요청이 없으면 서버가 sleep 상태로 전환됨
- 첫 요청 시 약 30초 정도의 cold start 시간이 소요될 수 있음
- 월 750시간 무료 (약 31일 24시간 운영 가능)

**💡 해결 방법:**
- Uptime Robot 등의 서비스를 사용하여 5분마다 `/health` 엔드포인트를 호출하여 서버를 깨어있게 유지
- 또는 Starter 플랜($7/월)으로 업그레이드하여 항상 활성 상태 유지

#### 옵션 2: Railway 배포

**Railway는 더 빠른 응답 속도를 제공합니다.**

1. [Railway.app](https://railway.app)에 가입
2. "New Project" → "Deploy from GitHub repo" 선택
3. 저장소 선택 후 `concert-server` 디렉토리 지정
4. 자동으로 배포됨
5. 배포 후 받은 URL을 프론트엔드에 설정

#### 옵션 3: Heroku 배포

**Heroku는 안정적인 플랫폼입니다.**

```bash
cd concert-server
heroku create amplify-concert-server
git push heroku main
```

배포 후 받은 URL을 프론트엔드의 `.env.production`에 설정:
```env
REACT_APP_MELON_API_URL=https://amplify-concert-server.herokuapp.com
```

#### 옵션 2: 별도 VPS 서버 사용

VPS 서버(예: AWS EC2, DigitalOcean)에 백엔드 서버를 배포:
```bash
cd concert-server
npm install
# PM2로 프로세스 관리
pm2 start index.js --name melon-api
```

#### 옵션 3: 카페24가 Node.js를 지원하는 경우

카페24에서 Node.js를 지원한다면:
1. `concert-server` 폴더를 카페24 서버에 업로드
2. 서버에서 `npm install` 실행
3. PM2 또는 forever로 프로세스 실행
4. 프론트엔드 `.env.production`에 카페24 서버의 백엔드 URL 설정

### 환경 변수 설정 요약

**개발 환경 (`.env`):**
```env
REACT_APP_MELON_API_URL=http://localhost:4000
```

**프로덕션 환경 (`.env.production` 또는 빌드 시 설정):**
```env
REACT_APP_MELON_API_URL=https://your-backend-server.com
```

**빌드 시 환경 변수 설정:**
```bash
REACT_APP_MELON_API_URL=https://your-backend-server.com npm run build
```

## 📊 데이터 구조

### Firestore Collections

#### 1. shows (공연)
```typescript
{
  showId: string;
  artist: string;
  tourName: string;
  venueId: string;
  city: string;
  dates: string[];
  posterUrl: string;
  priceTable: { [grade: string]: number };
  ticketStatus: "upcoming" | "presale" | "onsale" | "soldout";
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

#### 2. venues (공연장)
```typescript
{
  venueId: string;
  name: string;
  city: string;
  address: string;
  lat: number;
  lng: number;
  capacity: number;
  seatMapFile: string;
  description?: string;
  imageUrl?: string;
}
```

#### 3. orders (주문)
```typescript
{
  orderId: string;
  userId: string;
  showId: string;
  date: string;
  time?: string;
  seats: SelectedSeat[];
  totalPrice: number;
  buyerInfo: {
    name: string;
    phone: string;
    email: string;
  };
  paymentMethod: "card" | "bank" | "virtual";
  status: "pending" | "confirmed" | "cancelled" | "refunded";
  createdAt: Timestamp;
  cancelledAt?: Timestamp;
}
```

#### 4. users/{userId}/tickets (사용자 티켓)
```typescript
{
  id: string;
  orderId: string;
  showId: string;
  date: string;
  seats: SelectedSeat[];
  totalPrice: number;
  status: "confirmed" | "cancelled";
  purchasedAt: Timestamp;
  cancelledAt?: Timestamp;
}
```

#### 5. events (이벤트/추첨)
```typescript
{
  eventId: string;
  title: string;
  description: string;
  type: "lottery" | "firstcome";
  showId: string;
  startDate: Timestamp;
  endDate: Timestamp;
  maxParticipants: number;
  status: "upcoming" | "ongoing" | "ended";
}
```

## 🎨 디자인 가이드

### Brand Colors (2025 Identity)

- **Mist Indigo** (#4C4F7A): 브랜드 메인 컬러 - 공연장의 암부 + 스모크 + 잔광 무드
- **Slate Violet** (#7062A6): 서브 브랜드 톤, 그라데이션
- **Neon Peach** (#FF8C55): 액센트 컬러 - 선예매/티켓오픈 알림
- **Soft Gray** (#F5F5F5): 섹션 배경
- **Text Dark** (#232323): 메인 텍스트
- **Sub Gray** (#707070): 보조 텍스트

### Typography

- **English**: General Sans (모던, 브랜드 느낌)
- **Korean**: SUIT / LINE Seed KR (UI/UX 최적화)
- **Display**: Neue Haas Grotesk Display (히어로/아티스트명)

### Design Philosophy

> "무대의 어둠과 빛을 담은 Mist Indigo 기반에 Neon Peach 조명을 얹은, 희소성 있는 프리미엄 콘서트 티켓팅 플랫폼"

**Brand Mood**: 포멀하지만 감각적 · 공연장의 암부 + 스모크 + 네온 잔광

📖 **자세한 브랜드 가이드**: [BRAND_IDENTITY.md](./BRAND_IDENTITY.md)

## 🔑 주요 기능 설명

### 1. 인터랙티브 SVG 좌석맵
- 실시간 좌석 상태 확인
- 드래그로 지도 이동, 확대/축소 기능
- 좌석 클릭으로 선택/해제
- 최대 4매 선택 제한
- 등급별 색상 구분 (VIP, R, S, A)
- 선택된 좌석 가격 라벨 표시

### 2. 인증 예매
- CAPTCHA 보안 인증
- 선예매 코드 검증
- 팬클럽/공식 코드 지원
- SMS 인증 (구현 예정)

### 3. 결제 플로우
- 팝업 기반 결제 프로세스
- 다양한 결제수단 지원 (카드, 계좌이체, 가상계좌)
- 예매자 정보 입력 및 검증
- 취소/환불 규정 동의
- 결제 완료 후 자동 팝업 닫기

### 4. 티켓함
- QR 코드 자동 생성
- 티켓 상세 정보 확인
- 예매 취소 기능
- 공연 안내 정보

### 5. 관리자 대시보드
- 실시간 통계 (예매 수, 매출, 사용자 수)
- 공연 관리 (CRUD)
- 예매 관리 및 취소 처리
- 이벤트/추첨 관리
- 공지사항 관리

## 🎯 주요 특징

### ✨ 사용자 경험 (UX)
- 직관적인 좌석 선택 인터페이스
- 부드러운 애니메이션 및 전환 효과
- 실시간 피드백 및 상태 표시

### 🔒 보안
- Firebase Authentication 통합
- Firestore 보안 규칙 적용
- CAPTCHA 인증
- 사용자 권한 관리

### 🚀 성능
- 코드 스플리팅
- 이미지 최적화
- 지연 로딩 (Lazy Loading)
- 효율적인 상태 관리

## 📝 TODO

- [x] 기본 티켓팅 플로우 구현
- [x] SVG 좌석맵 구현
- [x] Firebase 연동
- [x] 관리자 대시보드
- [x] 예매 취소 기능
- [ ] 반응형 디자인 (모바일 최적화)
- [ ] 카카오맵 API 완전 연동
- [ ] 실제 결제 모듈 연동 (토스페이먼츠)
- [ ] 이메일 알림 시스템
- [ ] SMS 인증 완전 구현
- [ ] 대기자 관리 시스템
- [ ] 모바일 반응형 최적화 완료
- [ ] 다국어 지원 (i18n)
- [ ] PWA 지원
- [ ] 성능 모니터링 (Sentry)

## 🤝 기여하기

프로젝트에 기여하고 싶으시다면 다음 단계를 따라주세요:

1. **Fork the Project**
2. **Create your Feature Branch** (`git checkout -b feature/AmazingFeature`)
3. **Commit your Changes** (`git commit -m 'Add some AmazingFeature'`)
4. **Push to the Branch** (`git push origin feature/AmazingFeature`)
5. **Open a Pull Request**

### 코딩 스타일

- TypeScript 사용
- ESLint 규칙 준수
- 컴포넌트는 함수형 컴포넌트 사용
- CSS는 CSS Modules 또는 Emotion 사용

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 있습니다. 자세한 내용은 [LICENSE](./LICENSE) 파일을 참조하세요.

## 📧 연락처

프로젝트 관련 문의: [GitHub Issues](https://github.com/ziziziwon/Amplify-ticket/issues)

---

Made with ❤️ for K-Culture fans worldwide

**AMPLIFY** - 소리를 키우다, 무대를 키우다
