import { collection, addDoc, Timestamp } from "firebase/firestore";
import { db } from "../firebase";

// 원래 공지 페이지의 더미 데이터
const dummyNotices = [
  {
    title: "[필독] AMPLIFY 서비스 이용 약관 개정 안내",
    content:
      "안녕하세요. AMPLIFY입니다. 서비스 이용 약관이 개정되어 안내드립니다...",
    important: true,
  },
  {
    title: "설 연휴 고객센터 운영 안내",
    content: "설 연휴 기간 동안 고객센터 운영 시간이 변경됩니다...",
    important: false,
  },
  {
    title: "신규 회원 가입 이벤트 진행 중!",
    content: "지금 가입하고 5,000원 할인 쿠폰을 받아가세요...",
    important: false,
  },
  {
    title: "개인정보 처리방침 변경 안내",
    content: "개인정보 처리방침이 일부 변경되었습니다...",
    important: true,
  },
  {
    title: "서버 점검 안내 (1/25 02:00 ~ 04:00)",
    content: "안정적인 서비스 제공을 위한 서버 점검이 진행됩니다...",
    important: false,
  },
  {
    title: "모바일 앱 업데이트 안내 (v2.0)",
    content: "새로운 기능이 추가된 v2.0 업데이트가 출시되었습니다...",
    important: false,
  },
  {
    title: "첫 결제 10% 할인 이벤트",
    content: "처음 티켓을 구매하시는 분께 10% 할인 쿠폰 증정...",
    important: false,
  },
  {
    title: "결제 수단 추가 안내 (카카오페이, 네이버페이)",
    content: "간편결제 수단이 추가되었습니다...",
    important: false,
  },
  {
    title: "연말연시 배송 지연 안내",
    content: "연말연시 기간 동안 배송이 지연될 수 있습니다...",
    important: false,
  },
  {
    title: "VIP 멤버십 서비스 출시",
    content: "특별한 혜택이 가득한 VIP 멤버십을 만나보세요...",
    important: false,
  },
];

// Firestore에 더미 데이터 추가하는 함수
export async function seedNotices() {
  try {
    console.log("공지사항 더미 데이터 추가 시작...");

    for (const notice of dummyNotices) {
      await addDoc(collection(db, "notices"), {
        ...notice,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      console.log(`공지사항 추가됨: ${notice.title}`);
    }

    console.log("✅ 모든 공지사항이 성공적으로 추가되었습니다!");
    return { success: true, count: dummyNotices.length };
  } catch (error) {
    console.error("❌ 공지사항 추가 실패:", error);
    return { success: false, error };
  }
}

// 개발 환경에서만 실행되도록 하는 헬퍼 함수
export function initializeDummyNotices() {
  if (process.env.NODE_ENV === "development") {
    // window 객체에 함수를 추가하여 콘솔에서 직접 실행 가능하게 함
    (window as any).seedNotices = seedNotices;
    console.log(
      "💡 더미 공지사항을 추가하려면 콘솔에서 'seedNotices()'를 실행하세요."
    );
  }
}

