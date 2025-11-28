import { eventsService } from "../firebase/services";
import { Timestamp } from "firebase/firestore";

/**
 * 임시 이벤트 데이터 생성 함수
 * 개발/테스트용으로 샘플 이벤트를 Firestore에 추가합니다.
 */
export const seedDummyEvents = async () => {
  try {

    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const nextWeek = new Date(now);
    nextWeek.setDate(nextWeek.getDate() + 7);
    
    const nextMonth = new Date(now);
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    const dummyEvents = [
      {
        title: "2025 봄 페스티벌 얼리버드 예매권 이벤트",
        description: "2025년 최대 규모의 봄 페스티벌 얼리버드 티켓을 무료로 드립니다! 총 100명을 추첨하여 2인 티켓을 증정합니다.",
        imageUrl: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=800&h=600&fit=crop",
        bannerUrl: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=1200&h=400&fit=crop",
        startDate: Timestamp.now(),
        endDate: Timestamp.fromDate(nextWeek),
        announcementDate: Timestamp.fromDate(new Date(nextWeek.getTime() + 24 * 60 * 60 * 1000)),
        benefits: "• 2025 봄 페스티벌 2인 티켓 (VIP석 or R석)\n• 페스티벌 굿즈 랜덤 증정\n• 백스테이지 투어 기회",
        conditions: "• AMPLIFY 회원 가입 필수\n• 1인 1회 참여 가능\n• 개인정보 수집 동의 필수\n• 당첨 시 본인 인증 필요",
        maxParticipantsPerUser: 1,
        winnerCount: 100,
        status: "scheduled" as const,
        viewCount: 0,
        participantCount: 0,
        isWinnerAnnounced: false,
      },
      {
        title: "K-POP 콘서트 VIP 티켓 응모 이벤트",
        description: "인기 K-POP 아티스트의 단독 콘서트 VIP 티켓을 드립니다! 당첨자 50명에게는 사인회 참여 기회까지!",
        imageUrl: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&h=600&fit=crop",
        bannerUrl: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=1200&h=400&fit=crop",
        startDate: Timestamp.fromDate(tomorrow),
        endDate: Timestamp.fromDate(new Date(nextWeek.getTime() + 3 * 24 * 60 * 60 * 1000)),
        announcementDate: Timestamp.fromDate(new Date(nextWeek.getTime() + 5 * 24 * 60 * 60 * 1000)),
        benefits: "• K-POP 콘서트 VIP 티켓 1매\n• 사인회 참여권\n• 포토카드 세트\n• 아티스트 굿즈 랜덤박스",
        conditions: "• AMPLIFY 회원 가입 필수\n• SNS 공유 필수\n• 1인 1회 참여 가능\n• 당첨 후 7일 이내 수령 필수",
        maxParticipantsPerUser: 1,
        winnerCount: 50,
        status: "scheduled" as const,
        viewCount: 0,
        participantCount: 0,
        isWinnerAnnounced: false,
      },
      {
        title: "뮤지컬 '위키드' 프리미어 초대권 증정",
        description: "브로드웨이 대표 뮤지컬 '위키드' 한국 공연 프리미어 초대권을 드립니다. 레드카펫 행사 참여 포함!",
        imageUrl: "https://images.unsplash.com/photo-1503095396549-807759245b35?w=800&h=600&fit=crop",
        bannerUrl: "https://images.unsplash.com/photo-1503095396549-807759245b35?w=1200&h=400&fit=crop",
        startDate: Timestamp.fromDate(new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000)),
        endDate: Timestamp.fromDate(new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000)),
        announcementDate: Timestamp.fromDate(new Date(now.getTime() + 12 * 24 * 60 * 60 * 1000)),
        benefits: "• 뮤지컬 '위키드' 프리미어 초대권 2매\n• 레드카펫 행사 참여\n• 배우 사인회 참여\n• 오리지널 OST CD 증정",
        conditions: "• AMPLIFY 회원 가입 필수\n• 이메일 인증 필수\n• 1인 1회 참여 가능\n• 프리미어 당일 참석 가능한 분",
        maxParticipantsPerUser: 1,
        winnerCount: 30,
        status: "scheduled" as const,
        viewCount: 0,
        participantCount: 0,
        isWinnerAnnounced: false,
      },
      {
        title: "클래식 음악회 VIP 라운지 체험권",
        description: "세계적인 오케스트라의 내한 공연 VIP 라운지 체험권을 드립니다. 최고급 서비스와 함께하는 특별한 경험!",
        imageUrl: "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=800&h=600&fit=crop",
        bannerUrl: "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=1200&h=400&fit=crop",
        startDate: Timestamp.fromDate(new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)),
        endDate: Timestamp.fromDate(nextMonth),
        announcementDate: Timestamp.fromDate(new Date(nextMonth.getTime() + 2 * 24 * 60 * 60 * 1000)),
        benefits: "• 클래식 음악회 VIP석 티켓\n• VIP 라운지 이용권\n• 프리미엄 케이터링 서비스\n• 지휘자와의 만남",
        conditions: "• AMPLIFY 프리미엄 회원 또는 일반 회원 가입\n• 공연 관람 리뷰 작성 필수\n• 1인 1회 참여 가능",
        maxParticipantsPerUser: 1,
        winnerCount: 20,
        status: "scheduled" as const,
        viewCount: 0,
        participantCount: 0,
        isWinnerAnnounced: false,
      },
      {
        title: "스포츠 경기 코트사이드 좌석 이벤트",
        description: "프로 농구 플레이오프 코트사이드 좌석에서 경기를 관람하세요! 선수들의 생생한 플레이를 가장 가까이에서!",
        imageUrl: "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800&h=600&fit=crop",
        bannerUrl: "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=1200&h=400&fit=crop",
        startDate: Timestamp.fromDate(new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000)),
        endDate: Timestamp.fromDate(new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000)),
        announcementDate: Timestamp.fromDate(new Date(now.getTime() + 17 * 24 * 60 * 60 * 1000)),
        benefits: "• 프로 농구 플레이오프 코트사이드 좌석 2매\n• 선수 라커룸 투어\n• 팀 유니폼 증정\n• VIP 주차권",
        conditions: "• AMPLIFY 회원 가입 필수\n• 스포츠 관람 후기 작성 동의\n• 1인 1회 참여 가능\n• 경기 당일 참석 가능한 분",
        maxParticipantsPerUser: 1,
        winnerCount: 40,
        status: "scheduled" as const,
        viewCount: 0,
        participantCount: 0,
        isWinnerAnnounced: false,
      },
    ];

    console.log("임시 이벤트 데이터 생성 중...");

    for (const eventData of dummyEvents) {
      await eventsService.create(eventData);
      console.log(`✅ 이벤트 생성: ${eventData.title}`);
    }

    console.log(`🎉 총 ${dummyEvents.length}개의 임시 이벤트가 생성되었습니다!`);
  } catch (error) {
    console.error("임시 이벤트 생성 실패:", error);
    throw error;
  }
};

/**
 * 개발 환경에서만 실행되는 초기화 함수
 */
export const initializeDummyEvents = async () => {
  if (process.env.NODE_ENV === "development") {
    // 페이지 로드 시 한 번만 실행
    const hasSeeded = sessionStorage.getItem("eventsSeeded");
    if (!hasSeeded) {
      try {
        // 기존 이벤트 확인
        const existingEvents = await eventsService.getAll();
        if (existingEvents.length === 0) {
          await seedDummyEvents();
          console.log("✅ 초기 샘플 이벤트가 자동으로 생성되었습니다.");
        }
        sessionStorage.setItem("eventsSeeded", "true");
      } catch (error) {
        console.error("초기 이벤트 생성 중 오류:", error);
      }
    }
  }
};

