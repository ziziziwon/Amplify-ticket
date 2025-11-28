import React, { useState, useEffect } from "react";
import IconifyIcon from "../../components/Icon/IconifyIcon";
import MainLayout from "../../components/Layout/MainLayout";
import { useTicketStore } from "../../stores/useTicketStore";
import { db } from "../../firebase";
import { collection, addDoc, Timestamp, query, where, getDocs, doc, updateDoc, deleteDoc } from "firebase/firestore";
import type { Inquiry, InquiryCategory } from "../../types";


// 문의 카테고리 레이블
const INQUIRY_CATEGORY_LABELS: Record<InquiryCategory, string> = {
  booking: "예매/결제",
  refund: "환불/취소",
  account: "회원정보",
  event: "공연/행사",
  other: "기타",
};

// 이용안내 상세 데이터
const guideDetails = {
  booking: [
    {
      step: "1",
      title: "회원가입, 로그인 후 분야인증",
      content:
        "예매 전, AMPLIFY 회원가입 후 기본인증 및 확인해 주세요.\n예매를 위해서는 본인인증 절차가 필요하므로, 설정 메뉴에서 본인인증을 완성하시길 확인해 주세요.",
    },
    {
      step: "2",
      title: "관람하고자 하는 공연선 선택",
      content:
        "AMPLIFY에서 제공하는 여러 메뉴를 통해 관람하고자 하는 공연을 선택해 주세요.",
    },
    {
      step: "3",
      title: "공연 날짜 및 시간 선택",
      content:
        "공연 페이지에서 날짜와 시간을 선택해, 예매 가능한 회차를 확인 후 예매하기 버튼을 눌러주세요.",
    },
    {
      step: "4",
      title: "좌석 선택",
      content:
        "좌석 배치도에서 원하시는 좌석을 선택하실 수 있습니다. 선택 가능한 좌석은 파란색으로 표시됩니다.",
    },
    {
      step: "5",
      title: "할인/쿠폰 적용 및 결제",
      content:
        "보유하신 할인권이나 쿠폰을 적용하실 수 있으며, 원하시는 결제수단을 선택하여 결제를 진행해주세요.",
    },
    {
      step: "6",
      title: "예매 완료",
      content:
        "예매가 완료되면 예매 확인 메일이 발송되며, 마이페이지에서 예매 내역을 확인하실 수 있습니다.",
    },
  ],
  cancel: [
    {
      step: "1",
      title: "예매 취소 가능 시간",
      content:
        "공연 시작 24시간 전까지 취소가 가능합니다.\n단, 일부 공연의 경우 취소 가능 시간이 다를 수 있으니 예매 시 확인해 주세요.",
    },
    {
      step: "2",
      title: "취소 수수료",
      content:
        "예매 후 7일 이내: 무료\n예매 후 8일~공연 10일 전: 티켓금액의 10%\n공연 9일~7일 전: 티켓금액의 20%\n공연 6일~3일 전: 티켓금액의 30%",
    },
    {
      step: "3",
      title: "환불 처리",
      content:
        "취소 신청 후 영업일 기준 3~5일 이내에 결제하신 카드사를 통해 환불됩니다.\n현금 결제의 경우 계좌 이체로 환불 처리됩니다.",
    },
    {
      step: "4",
      title: "취소 방법",
      content:
        "마이페이지 > 예매내역에서 취소하실 공연을 선택하신 후 취소하기 버튼을 클릭해주세요.\n취소 수수료를 확인하신 후 최종 취소를 진행하실 수 있습니다.",
    },
  ],
  ticket: [
    {
      step: "1",
      title: "모바일 티켓 (QR코드)",
      content:
        "예매 완료 후 마이페이지에서 QR 코드를 확인하실 수 있습니다.\n공연장 입장 시 QR 코드를 제시해주시면 됩니다.",
    },
    {
      step: "2",
      title: "현장 수령",
      content:
        "공연 당일 공연장 매표소에서 신분증을 지참하신 후 티켓을 수령하실 수 있습니다.\n예매 시 선택한 결제 카드를 지참해주세요.",
    },
    {
      step: "3",
      title: "우편 배송",
      content:
        "예매 후 3~5일 이내에 등록하신 주소로 배송됩니다.\n배송비는 3,000원이 추가되며, 공연 7일 전까지 예매하신 경우에만 선택 가능합니다.",
    },
    {
      step: "4",
      title: "티켓 분실 시",
      content:
        "모바일 티켓: 마이페이지에서 재출력 가능\n실물 티켓: 분실 시 재발급 불가능하오니 주의해주세요",
    },
  ],
};

// FAQ 데이터
const faqData = [
  {
    category: "예매·취소",
    questions: [
      {
        q: "티켓 예매는 어떻게 하나요?",
        a: "원하시는 공연을 선택하신 후, 날짜와 좌석을 선택하여 결제하시면 됩니다. 로그인이 필요합니다.",
      },
      {
        q: "예매 취소는 어떻게 하나요?",
        a: "마이페이지 > 예매내역에서 취소하실 수 있습니다. 공연 시작 24시간 전까지 취소 가능하며, 취소 수수료가 부과될 수 있습니다.",
      },
      {
        q: "환불은 언제 받을 수 있나요?",
        a: "취소 신청 후 영업일 기준 3~5일 이내에 결제하신 카드사를 통해 환불됩니다.",
      },
      {
        q: "예매 확인은 어디서 하나요?",
        a: "마이페이지 > 예매내역에서 확인하실 수 있습니다.",
      },
      {
        q: "좌석 변경이 가능한가요?",
        a: "좌석 변경은 불가능합니다. 취소 후 재예매를 진행해주셔야 합니다.",
      },
    ],
  },
  {
    category: "결제",
    questions: [
      {
        q: "어떤 결제 수단을 사용할 수 있나요?",
        a: "신용카드, 체크카드, 계좌이체, 간편결제(카카오페이, 네이버페이 등)를 지원합니다.",
      },
      {
        q: "결제가 완료되지 않았어요",
        a: "결제 화면에서 오류가 발생하면 고객센터로 문의 주시기 바랍니다. 카드사 승인 문제일 수 있습니다.",
      },
      {
        q: "할부 결제가 가능한가요?",
        a: "신용카드 할부 결제가 가능하며, 무이자 할부 이벤트는 카드사별로 상이합니다.",
      },
      {
        q: "영수증 발급이 가능한가요?",
        a: "마이페이지 > 예매내역에서 영수증을 출력하실 수 있습니다.",
      },
    ],
  },
  {
    category: "티켓 발권",
    questions: [
      {
        q: "티켓은 어떻게 받나요?",
        a: "모바일 티켓으로 발권되며, 마이페이지에서 QR 코드를 확인하실 수 있습니다.",
      },
      {
        q: "현장에서 티켓 수령이 가능한가요?",
        a: "일부 공연의 경우 현장 수령이 가능합니다. 예매 시 안내 문구를 확인해 주세요.",
      },
      {
        q: "티켓을 분실했어요",
        a: "모바일 티켓은 마이페이지에서 재출력 가능합니다. 실물 티켓은 분실 시 재발급이 불가능합니다.",
      },
      {
        q: "QR 코드가 표시되지 않아요",
        a: "네트워크 연결을 확인하신 후, 앱을 재시작해주세요. 문제가 지속되면 고객센터로 문의해주세요.",
      },
    ],
  },
  {
    category: "회원정보",
    questions: [
      {
        q: "비밀번호를 잊어버렸어요",
        a: "로그인 화면에서 '비밀번호 찾기'를 클릭하시면 이메일로 재설정 링크가 발송됩니다.",
      },
      {
        q: "회원 탈퇴는 어떻게 하나요?",
        a: "마이페이지 > 회원정보 수정에서 회원 탈퇴가 가능합니다. 탈퇴 시 모든 데이터가 삭제됩니다.",
      },
      {
        q: "회원 정보를 변경하고 싶어요",
        a: "마이페이지 > 회원정보 수정에서 변경 가능합니다.",
      },
      {
        q: "이메일 인증을 다시 받고 싶어요",
        a: "마이페이지 > 회원정보에서 이메일 재인증을 진행하실 수 있습니다.",
      },
    ],
  },
];

export default function Support() {
  const { user } = useTicketStore();
  const [activeTab, setActiveTab] = useState(0);
  const [guideSubTab, setGuideSubTab] = useState(0);
  const [searchText, setSearchText] = useState("");
  const [expandedFaq, setExpandedFaq] = useState<string | false>(false);

  // 문의 관련 state
  const [openInquiryDialog, setOpenInquiryDialog] = useState(false);
  const [inquiryCategory, setInquiryCategory] = useState<string>("booking");
  const [inquiryTitle, setInquiryTitle] = useState("");
  const [inquiryContent, setInquiryContent] = useState("");
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loadingInquiries, setLoadingInquiries] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [expandedInquiry, setExpandedInquiry] = useState<string | null>(null);
  const [editingInquiry, setEditingInquiry] = useState<Inquiry | null>(null);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [editCategory, setEditCategory] = useState<string>("booking");
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const handleFaqChange =
    (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
      setExpandedFaq(isExpanded ? panel : false);
    };

  // 문의 내역 불러오기
  const fetchMyInquiries = async () => {
    if (!user) return;

    setLoadingInquiries(true);
    console.log(`📋 문의 내역 조회 시작: ${user.uid}`);
    try {
      const q = query(
        collection(db, "inquiries"),
        where("userId", "==", user.uid)
      );
      const querySnapshot = await getDocs(q);
      const inquiriesList: Inquiry[] = [];
      querySnapshot.forEach((doc) => {
        inquiriesList.push({
          id: doc.id,
          ...doc.data(),
        } as Inquiry);
      });
      // 클라이언트 측에서 정렬
      inquiriesList.sort((a, b) => {
        const timeA = a.createdAt?.toMillis() || 0;
        const timeB = b.createdAt?.toMillis() || 0;
        return timeB - timeA;
      });
      setInquiries(inquiriesList);
      console.log(`📊 조회된 문서 수: ${querySnapshot.size}`);
      console.log(`✅ 문의 내역 조회 성공: ${inquiriesList.length}`);
    } catch (error) {
      console.error("❌ 문의 내역 조회 실패:", error);
      alert("문의 내역을 불러오는데 실패했습니다. 다시 시도해주세요.");
    } finally {
      setLoadingInquiries(false);
    }
  };

  // 탭 변경 시 문의 내역 불러오기
  useEffect(() => {
    if (activeTab === 2 && user) {
      fetchMyInquiries();
    }
  }, [activeTab, user]);

  // 문의 제출
  const handleSubmitInquiry = async () => {
    console.log("🔍 [DEBUG] handleSubmitInquiry 시작");
    console.log("🔍 [DEBUG] user 상태:", user);

    if (!user) {
      console.error("❌ [DEBUG] user가 없습니다");
      alert("로그인이 필요합니다.");
      return;
    }

    if (!inquiryTitle.trim()) {
      console.error("❌ [DEBUG] 제목이 없습니다");
      alert("문의 제목을 입력해주세요.");
      return;
    }

    if (!inquiryContent.trim()) {
      console.error("❌ [DEBUG] 내용이 없습니다");
      alert("문의 내용을 입력해주세요.");
      return;
    }

    setSubmitting(true);
    console.log("📝 문의 등록 시작:", {
      userId: user.uid,
      userEmail: user.email,
      title: inquiryTitle,
      contentLength: inquiryContent.length,
    });

    try {
      const inquiryData = {
        userId: user.uid,
        userEmail: user.email,
        category: inquiryCategory as InquiryCategory,
        title: inquiryTitle.trim(),
        content: inquiryContent.trim(),
        status: "pending" as const,
        createdAt: Timestamp.now(),
      };

      console.log("💾 Firestore 저장 시도:", inquiryData);
      console.log("📍 컬렉션 경로: inquiries");

      const docRef = await addDoc(collection(db, "inquiries"), inquiryData);
      console.log("✅ 문의 등록 성공! Document ID:", docRef.id);
      console.log("✅ Firestore 경로:", `inquiries/${docRef.id}`);

      alert("문의가 성공적으로 등록되었습니다.");
      setInquiryCategory("booking");
      setInquiryTitle("");
      setInquiryContent("");
      setOpenInquiryDialog(false);

      // 문의 내역 새로고침
      console.log("🔄 문의 내역 새로고침 시작");
      await fetchMyInquiries();
    } catch (error: any) {
      console.error("❌ 문의 등록 실패:", error);
      console.error("❌ 에러 코드:", error?.code);
      console.error("❌ 에러 메시지:", error?.message);
      console.error("❌ 전체 에러 객체:", JSON.stringify(error, null, 2));

      if (error?.code === "permission-denied") {
        alert("권한이 없습니다. Firestore 규칙을 확인해주세요.\n\nFirebase Console > Firestore > 규칙에서 다음을 설정하세요:\n\nmatch /inquiries/{document} {\n  allow read, write: if request.auth != null;\n}");
      } else {
        alert(`문의 등록에 실패했습니다.\n\n에러: ${error?.message || '알 수 없는 오류'}\n\n다시 시도해주세요.`);
      }
    } finally {
      setSubmitting(false);
      console.log("🏁 [DEBUG] handleSubmitInquiry 종료");
    }
  };

  // 문의 수정 다이얼로그 열기
  const handleOpenEditDialog = (inquiry: Inquiry) => {
    setEditingInquiry(inquiry);
    setEditCategory(inquiry.category);
    setEditTitle(inquiry.title);
    setEditContent(inquiry.content);
    setOpenEditDialog(true);
  };

  // 문의 수정 제출
  const handleUpdateInquiry = async () => {
    if (!editingInquiry) return;

    if (!editTitle.trim()) {
      alert("문의 제목을 입력해주세요.");
      return;
    }

    if (!editContent.trim()) {
      alert("문의 내용을 입력해주세요.");
      return;
    }

    setSubmitting(true);
    console.log("✏️ 문의 수정 시작:", editingInquiry.id);

    try {
      const inquiryRef = doc(db, "inquiries", editingInquiry.id);
      await updateDoc(inquiryRef, {
        category: editCategory as InquiryCategory,
        title: editTitle.trim(),
        content: editContent.trim(),
      });

      console.log("✅ 문의 수정 성공");
      alert("문의가 성공적으로 수정되었습니다.");
      setOpenEditDialog(false);
      setEditingInquiry(null);
      setEditCategory("booking");
      setEditTitle("");
      setEditContent("");

      // 문의 내역 새로고침
      await fetchMyInquiries();
    } catch (error: any) {
      console.error("❌ 문의 수정 실패:", error);
      alert(`문의 수정에 실패했습니다.\n\n에러: ${error?.message || '알 수 없는 오류'}`);
    } finally {
      setSubmitting(false);
    }
  };

  // 문의 삭제
  const handleDeleteInquiry = async (inquiryId: string, inquiryTitle: string) => {
    if (!window.confirm(`"${inquiryTitle}" 문의를 삭제하시겠습니까?\n\n삭제된 문의는 복구할 수 없습니다.`)) {
      return;
    }

    console.log("🗑️ 문의 삭제 시작:", inquiryId);

    try {
      const inquiryRef = doc(db, "inquiries", inquiryId);
      await deleteDoc(inquiryRef);

      console.log("✅ 문의 삭제 성공");
      alert("문의가 성공적으로 삭제되었습니다.");

      // 문의 내역 새로고침
      await fetchMyInquiries();
    } catch (error: any) {
      console.error("❌ 문의 삭제 실패:", error);
      alert(`문의 삭제에 실패했습니다.\n\n에러: ${error?.message || '알 수 없는 오류'}`);
    }
  };

  // 검색 필터링된 FAQ
  const filteredFAQ = faqData.map((cat) => ({
    ...cat,
    questions: cat.questions.filter(
      (item) =>
        item.q.toLowerCase().includes(searchText.toLowerCase()) ||
        item.a.toLowerCase().includes(searchText.toLowerCase())
    ),
  }));

  // 현재 선택된 이용안내 데이터
  const getCurrentGuideData = () => {
    switch (guideSubTab) {
      case 0:
        return guideDetails.booking;
      case 1:
        return guideDetails.cancel;
      case 2:
        return guideDetails.ticket;
      default:
        return guideDetails.booking;
    }
  };

  return (
    <MainLayout>
      {/* Hero Section */}
      <div
        style={{
          backgroundColor: "var(--primary-main)",
          color: "white",
          paddingTop: "32px",
          paddingBottom: "32px",
          marginBottom: 0,
        }}
      >
        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 24px" }}>
          <h3
            style={{
              fontWeight: 800,
              fontFamily: "var(--font-family-heading)",
              marginBottom: "16px",
              fontSize: "3rem",
              margin: 0,
            }}
          >
            고객센터
          </h3>
          <h6
            style={{
              fontWeight: 400,
              opacity: 0.9,
              fontFamily: "var(--font-family-base)",
              fontSize: "1.25rem",
              margin: 0,
              marginTop: "16px",
            }}
          >
            문의사항을 빠르게 해결해드립니다
          </h6>
        </div>
      </div>

      {/* 메인 탭 메뉴 */}
      <div
        style={{
          backgroundColor: "#fff",
          borderBottom: "1px solid #E0E0E0",
          position: "sticky",
          top: 105,
          zIndex: 99,
        }}
      >
        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 24px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              minHeight: "56px",
            }}
          >
            {["이용안내", "FAQ", "나의 문의 내역"].map((label, index) => (
              <button
                key={index}
                onClick={() => setActiveTab(index)}
                style={{
                  fontSize: "15px",
                  fontWeight: 600,
                  color: activeTab === index ? "var(--primary-main)" : "#707070",
                  background: "none",
                  border: "none",
                  borderBottom: activeTab === index ? "3px solid var(--primary-main)" : "3px solid transparent",
                  padding: "16px 24px",
                  cursor: "pointer",
                  fontFamily: "var(--font-family-base)",
                  minWidth: "120px",
                  transition: "all 0.2s",
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 컨텐츠 영역 */}
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "32px 24px" }}>
        {/* 이용안내 탭 */}
        {activeTab === 0 && (
          <div>
            {/* 서브 탭 - 네모 버튼 형태 */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: "16px",
                marginBottom: "24px",
                maxWidth: "900px",
                marginLeft: "auto",
                marginRight: "auto",
              }}
            >
              {["예매방법", "취소/환불", "발권/배송"].map((label, index) => (
                <div
                  key={index}
                  onClick={() => setGuideSubTab(index)}
                  style={{
                    padding: "16px",
                    borderRadius: "8px",
                    border: `2px solid ${guideSubTab === index ? "var(--primary-main)" : "#E0E0E0"
                      }`,
                    backgroundColor: guideSubTab === index ? "var(--primary-main)" : "#fff",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    textAlign: "center",
                  }}
                >
                  <span
                    style={{
                      fontSize: "16px",
                      fontWeight: 700,
                      color: guideSubTab === index ? "#fff" : "#232323",
                      fontFamily: "var(--font-family-base)",
                      display: "block",
                    }}
                  >
                    {label}
                  </span>
                </div>
              ))}
            </div>

            {/* 이용안내 내용 */}
            <div
              style={{
                backgroundColor: "#FAFAFA",
                borderRadius: "12px",
                padding: "32px",
              }}
            >
              <h5
                style={{
                  fontWeight: 700,
                  color: "#232323",
                  marginBottom: "24px",
                  fontFamily: "var(--font-family-base)",
                  fontSize: "1.5rem",
                  marginTop: 0,
                }}
              >
                {guideSubTab === 0 && "AMPLIFY의 예매 방법을 안내드립니다."}
                {guideSubTab === 1 && "취소 및 환불 방법을 안내드립니다."}
                {guideSubTab === 2 && "티켓 발권 및 배송 방법을 안내드립니다."}
              </h5>

              {getCurrentGuideData().map((item, index) => (
                <div
                  key={index}
                  style={{
                    marginBottom: "24px",
                    paddingBottom: "24px",
                    borderBottom:
                      index < getCurrentGuideData().length - 1
                        ? "1px solid #E0E0E0"
                        : "none",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "16px",
                      marginBottom: "16px",
                    }}
                  >
                    <div
                      style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "50%",
                        backgroundColor: "var(--primary-main)",
                        color: "white",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 700,
                        fontSize: "18px",
                        flexShrink: 0,
                        fontFamily: "var(--font-family-base)",
                      }}
                    >
                      {item.step}
                    </div>
                    <div style={{ flex: 1 }}>
                      <h6
                        style={{
                          fontWeight: 700,
                          color: "#232323",
                          marginBottom: "12px",
                          fontFamily: "var(--font-family-base)",
                          fontSize: "1.25rem",
                          marginTop: 0,
                        }}
                      >
                        {item.title}
                      </h6>
                      <p
                        style={{
                          color: "#707070",
                          lineHeight: 1.8,
                          whiteSpace: "pre-line",
                          fontFamily: "var(--font-family-base)",
                          margin: 0,
                        }}
                      >
                        {item.content}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* 문의 안내 */}
            <div
              style={{
                marginTop: "48px",
                padding: "32px",
                backgroundColor: "#F5F5F5",
                borderRadius: "12px",
                textAlign: "center",
              }}
            >
              <h6
                style={{
                  fontWeight: 700,
                  color: "#232323",
                  marginBottom: "16px",
                  fontFamily: "var(--font-family-base)",
                  fontSize: "1.25rem",
                  marginTop: 0,
                }}
              >
                추가 문의사항이 있으신가요?
              </h6>
              <p
                style={{
                  color: "#707070",
                  marginBottom: "24px",
                  fontFamily: "var(--font-family-base)",
                  fontSize: "0.875rem",
                }}
              >
                고객센터: 1588-1234 (평일 09:00 ~ 18:00)
                <br />
                이메일: support@amplify.com
              </p>
              <button
                onClick={() => {
                  if (!user) {
                    alert("로그인이 필요합니다.");
                    window.location.href = "/login";
                  } else {
                    setOpenInquiryDialog(true);
                  }
                }}
                style={{
                  backgroundColor: "var(--primary-main)",
                  color: "white",
                  fontWeight: 600,
                  border: "none",
                  padding: "12px 32px",
                  borderRadius: "6px",
                  fontFamily: "var(--font-family-base)",
                  cursor: "pointer",
                  fontSize: "1rem",
                }}
              >
                1:1 문의하기
              </button>
            </div>
          </div>
        )}

        {/* FAQ 탭 */}
        {activeTab === 1 && (
          <div>
            {/* 검색창 */}
            <div
              style={{
                marginBottom: "24px",
                position: "relative",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  left: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#707070",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <IconifyIcon icon="mdi:magnify" width={20} height={20} />
              </div>
              <input
                type="text"
                placeholder="궁금하신 내용을 검색해보세요"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                style={{
                  width: "100%",
                  padding: "12px 12px 12px 40px",
                  borderRadius: "8px",
                  border: "1px solid #E0E0E0",
                  fontSize: "1rem",
                  fontFamily: "var(--font-family-base)",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>

            {/* FAQ 아코디언 */}
            {filteredFAQ.map((cat, catIndex) =>
              cat.questions.length > 0 ? (
                <div key={catIndex} style={{ marginBottom: "24px" }}>
                  <h6
                    style={{
                      fontWeight: 700,
                      color: "var(--primary-main)",
                      marginBottom: "16px",
                      fontFamily: "var(--font-family-base)",
                      fontSize: "1.25rem",
                      marginTop: 0,
                    }}
                  >
                    {cat.category}
                  </h6>
                  {cat.questions.map((item, index) => {
                    const panelId = `panel-${catIndex}-${index}`;
                    const isExpanded = expandedFaq === panelId;

                    return (
                      <div
                        key={panelId}
                        style={{
                          marginBottom: "8px",
                          border: "1px solid #E0E0E0",
                          borderRadius: "8px",
                          overflow: "hidden",
                        }}
                      >
                        <div
                          onClick={() => setExpandedFaq(isExpanded ? false : panelId)}
                          style={{
                            padding: "16px",
                            cursor: "pointer",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            backgroundColor: "#fff",
                          }}
                        >
                          <span
                            style={{
                              fontWeight: 600,
                              color: "#232323",
                              fontFamily: "var(--font-family-base)",
                            }}
                          >
                            Q. {item.q}
                          </span>
                          <IconifyIcon
                            icon={isExpanded ? "mdi:chevron-up" : "mdi:chevron-down"}
                            width={20}
                            height={20}
                            color="#707070"
                          />
                        </div>
                        {isExpanded && (
                          <div
                            style={{
                              padding: "16px",
                              backgroundColor: "#F5F5F5",
                              borderTop: "1px solid #E0E0E0",
                            }}
                          >
                            <p
                              style={{
                                color: "#707070",
                                lineHeight: 1.8,
                                fontFamily: "var(--font-family-base)",
                                margin: 0,
                              }}
                            >
                              A. {item.a}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : null
            )}

            {filteredFAQ.every((cat) => cat.questions.length === 0) && (
              <div
                style={{
                  textAlign: "center",
                  paddingTop: "32px",
                  paddingBottom: "32px",
                }}
              >
                <p
                  style={{
                    color: "#707070",
                    fontFamily: "var(--font-family-base)",
                    margin: 0,
                  }}
                >
                  검색 결과가 없습니다
                </p>
              </div>
            )}
          </div>
        )}

        {/* 나의 문의 내역 탭 */}
        {activeTab === 2 && (
          <div>
            {!user ? (
              <div
                style={{
                  textAlign: "center",
                  paddingTop: "32px",
                  paddingBottom: "32px",
                }}
              >
                <h6
                  style={{
                    color: "#707070",
                    marginBottom: "16px",
                    fontFamily: "var(--font-family-base)",
                    fontSize: "1.25rem",
                    fontWeight: 700,
                    marginTop: 0,
                  }}
                >
                  로그인이 필요합니다
                </h6>
                <p
                  style={{
                    color: "#999",
                    marginBottom: "24px",
                    fontFamily: "var(--font-family-base)",
                    fontSize: "0.875rem",
                  }}
                >
                  1:1 문의 내역을 확인하려면 로그인해주세요
                </p>
              </div>
            ) : loadingInquiries ? (
              <div
                style={{
                  textAlign: "center",
                  paddingTop: "32px",
                  paddingBottom: "32px",
                }}
              >
                <div className="spinner" style={{ border: "4px solid #f3f3f3", borderTop: "4px solid var(--primary-main)", borderRadius: "50%", width: "30px", height: "30px", animation: "spin 1s linear infinite", margin: "0 auto" }}></div>
                <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
              </div>
            ) : inquiries.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  paddingTop: "32px",
                  paddingBottom: "32px",
                }}
              >
                <h6
                  style={{
                    color: "#707070",
                    marginBottom: "16px",
                    fontFamily: "var(--font-family-base)",
                    fontSize: "1.25rem",
                    fontWeight: 700,
                    marginTop: 0,
                  }}
                >
                  문의 내역이 없습니다
                </h6>
                <button
                  onClick={() => setOpenInquiryDialog(true)}
                  style={{
                    backgroundColor: "var(--primary-main)",
                    color: "white",
                    fontWeight: 600,
                    border: "none",
                    padding: "12px 32px",
                    borderRadius: "6px",
                    fontFamily: "var(--font-family-base)",
                    cursor: "pointer",
                    fontSize: "1rem",
                  }}
                >
                  1:1 문의하기
                </button>
              </div>
            ) : (
              <div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "24px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                    <h6
                      style={{
                        fontWeight: 600,
                        fontFamily: "var(--font-family-base)",
                        fontSize: "1.25rem",
                        margin: 0,
                        color: "#232323",
                      }}
                    >
                      나의 문의 내역
                    </h6>
                    <div style={{ minWidth: "150px" }}>
                      <select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        style={{
                          width: "100%",
                          padding: "8px 12px",
                          borderRadius: "4px",
                          border: "1px solid #E0E0E0",
                          fontFamily: "var(--font-family-base)",
                          fontSize: "14px",
                          outline: "none",
                        }}
                      >
                        <option value="all">전체</option>
                        {Object.entries(INQUIRY_CATEGORY_LABELS).map(
                          ([key, label]) => (
                            <option key={key} value={key}>
                              {label}
                            </option>
                          )
                        )}
                      </select>
                    </div>
                  </div>
                  <button
                    onClick={() => setOpenInquiryDialog(true)}
                    style={{
                      backgroundColor: "var(--primary-main)",
                      color: "white",
                      fontWeight: 600,
                      border: "none",
                      padding: "8px 24px",
                      borderRadius: "6px",
                      fontFamily: "var(--font-family-base)",
                      cursor: "pointer",
                      fontSize: "0.875rem",
                    }}
                  >
                    1:1 문의하기
                  </button>
                </div>

                <div
                  style={{
                    border: "1px solid #D7D7D7",
                    borderRadius: "8px",
                    overflow: "hidden",
                  }}
                >
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ backgroundColor: "#F5F5F5" }}>
                        <th style={{ padding: "16px", width: "40px" }} />
                        <th
                          style={{
                            padding: "16px",
                            fontWeight: 700,
                            fontSize: "14px",
                            color: "#232323",
                            fontFamily: "var(--font-family-base)",
                            textAlign: "center",
                            width: "110px",
                          }}
                        >
                          문의유형
                        </th>
                        <th
                          style={{
                            padding: "16px",
                            fontWeight: 700,
                            fontSize: "14px",
                            color: "#232323",
                            fontFamily: "var(--font-family-base)",
                            textAlign: "left",
                          }}
                        >
                          제목
                        </th>
                        <th
                          style={{
                            padding: "16px",
                            fontWeight: 700,
                            fontSize: "14px",
                            color: "#232323",
                            fontFamily: "var(--font-family-base)",
                            textAlign: "center",
                            width: "120px",
                          }}
                        >
                          작성일
                        </th>
                        <th
                          style={{
                            padding: "16px",
                            fontWeight: 700,
                            fontSize: "14px",
                            color: "#232323",
                            fontFamily: "var(--font-family-base)",
                            textAlign: "center",
                            width: "90px",
                          }}
                        >
                          상태
                        </th>
                        <th
                          style={{
                            padding: "16px",
                            fontWeight: 700,
                            fontSize: "14px",
                            color: "#232323",
                            fontFamily: "var(--font-family-base)",
                            textAlign: "center",
                            width: "100px",
                          }}
                        >
                          관리
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {inquiries
                        .filter(
                          (inquiry) =>
                            categoryFilter === "all" ||
                            inquiry.category === categoryFilter
                        )
                        .map((inquiry, index) => (
                          <React.Fragment key={inquiry.id}>
                            <tr
                              style={{
                                borderBottom:
                                  index === inquiries.length - 1 &&
                                    expandedInquiry !== inquiry.id
                                    ? "none"
                                    : "1px solid #E0E0E0",
                                backgroundColor: "#fff",
                              }}
                            >
                              <td style={{ padding: "16px", textAlign: "center" }}>
                                <button
                                  onClick={() =>
                                    setExpandedInquiry(
                                      expandedInquiry === inquiry.id
                                        ? null
                                        : inquiry.id
                                    )
                                  }
                                  style={{
                                    background: "none",
                                    border: "none",
                                    cursor: "pointer",
                                    padding: "4px",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    color: "#707070",
                                  }}
                                >
                                  <IconifyIcon
                                    icon={expandedInquiry === inquiry.id ? "mdi:chevron-up" : "mdi:chevron-down"}
                                    width={16}
                                    height={16}
                                  />
                                </button>
                              </td>
                              <td style={{ padding: "16px", textAlign: "center" }}>
                                <span
                                  style={{
                                    backgroundColor: "#E8EAF6",
                                    color: "var(--primary-main)",
                                    fontWeight: 600,
                                    fontSize: "12px",
                                    padding: "4px 8px",
                                    borderRadius: "12px",
                                    fontFamily: "var(--font-family-base)",
                                    display: "inline-block",
                                  }}
                                >
                                  {INQUIRY_CATEGORY_LABELS[inquiry.category]}
                                </span>
                              </td>
                              <td
                                style={{
                                  padding: "16px",
                                  fontFamily: "var(--font-family-base)",
                                  fontSize: "14px",
                                  color: "#232323",
                                  fontWeight: 500,
                                }}
                              >
                                {inquiry.title}
                              </td>
                              <td
                                style={{
                                  padding: "16px",
                                  fontFamily: "var(--font-family-base)",
                                  fontSize: "13px",
                                  color: "#707070",
                                  textAlign: "center",
                                }}
                              >
                                {inquiry.createdAt
                                  ?.toDate()
                                  .toLocaleDateString("ko-KR", {
                                    year: "numeric",
                                    month: "2-digit",
                                    day: "2-digit",
                                  })
                                  .replace(/\./g, ".")
                                  .slice(0, -1)}
                              </td>
                              <td style={{ padding: "16px", textAlign: "center" }}>
                                <span
                                  style={{
                                    backgroundColor:
                                      inquiry.status === "answered"
                                        ? "var(--primary-main)"
                                        : "#FF8C55",
                                    color: "white",
                                    fontWeight: 600,
                                    fontSize: "12px",
                                    padding: "4px 8px",
                                    borderRadius: "12px",
                                    fontFamily: "var(--font-family-base)",
                                    display: "inline-block",
                                  }}
                                >
                                  {inquiry.status === "answered"
                                    ? "답변완료"
                                    : "답변대기"}
                                </span>
                              </td>
                              <td style={{ padding: "16px", textAlign: "center" }}>
                                <div
                                  style={{
                                    display: "flex",
                                    gap: "4px",
                                    justifyContent: "center",
                                  }}
                                >
                                  {inquiry.status === "pending" && (
                                    <>
                                      <button
                                        onClick={() =>
                                          handleOpenEditDialog(inquiry)
                                        }
                                        title="수정"
                                        style={{
                                          background: "none",
                                          border: "none",
                                          cursor: "pointer",
                                          padding: "4px",
                                          color: "var(--primary-main)",
                                          display: "flex",
                                          alignItems: "center",
                                          justifyContent: "center",
                                        }}
                                      >
                                        <IconifyIcon icon="mdi:pencil" width={20} height={20} />
                                      </button>
                                      <button
                                        onClick={() =>
                                          handleDeleteInquiry(
                                            inquiry.id,
                                            inquiry.title
                                          )
                                        }
                                        title="삭제"
                                        style={{
                                          background: "none",
                                          border: "none",
                                          cursor: "pointer",
                                          padding: "4px",
                                          color: "#FF8C55",
                                          display: "flex",
                                          alignItems: "center",
                                          justifyContent: "center",
                                        }}
                                      >
                                        <IconifyIcon icon="mdi:delete" width={20} height={20} />
                                      </button>
                                    </>
                                  )}
                                  {inquiry.status === "answered" && (
                                    <span
                                      style={{
                                        backgroundColor: "#E8EAF6",
                                        color: "var(--primary-main)",
                                        fontSize: "11px",
                                        fontWeight: 600,
                                        padding: "2px 6px",
                                        borderRadius: "4px",
                                        display: "inline-block",
                                      }}
                                    >
                                      완료
                                    </span>
                                  )}
                                </div>
                              </td>
                            </tr>
                            {expandedInquiry === inquiry.id && (
                              <tr>
                                <td
                                  colSpan={6}
                                  style={{
                                    padding: 0,
                                    borderBottom:
                                      index !== inquiries.length - 1
                                        ? "1px solid #E0E0E0"
                                        : "none",
                                  }}
                                >
                                  <div style={{ padding: "16px" }}>
                                    <h6
                                      style={{
                                        fontWeight: 700,
                                        marginBottom: "12px",
                                        color: "#232323",
                                        fontSize: "14px",
                                        fontFamily: "var(--font-family-base)",
                                        marginTop: 0,
                                      }}
                                    >
                                      문의 내용
                                    </h6>
                                    <div
                                      style={{
                                        padding: "20px",
                                        backgroundColor: "#FAFAFA",
                                        marginBottom: "16px",
                                        border: "1px solid #E0E0E0",
                                        borderRadius: "6px",
                                      }}
                                    >
                                      <p
                                        style={{
                                          whiteSpace: "pre-wrap",
                                          lineHeight: 1.7,
                                          color: "#232323",
                                          fontSize: "14px",
                                          fontFamily: "var(--font-family-base)",
                                          margin: 0,
                                        }}
                                      >
                                        {inquiry.content}
                                      </p>
                                    </div>

                                    {inquiry.status === "answered" &&
                                      inquiry.answer && (
                                        <>
                                          <h6
                                            style={{
                                              fontWeight: 700,
                                              marginBottom: "12px",
                                              marginTop: "20px",
                                              color: "var(--primary-main)",
                                              fontSize: "14px",
                                              fontFamily: "var(--font-family-base)",
                                            }}
                                          >
                                            관리자 답변
                                          </h6>
                                          <div
                                            style={{
                                              padding: "20px",
                                              backgroundColor: "#F0F0FF",
                                              border: "1px solid #D0D0F0",
                                              borderRadius: "6px",
                                            }}
                                          >
                                            <p
                                              style={{
                                                whiteSpace: "pre-wrap",
                                                lineHeight: 1.7,
                                                color: "#232323",
                                                fontSize: "14px",
                                                fontFamily: "var(--font-family-base)",
                                                margin: 0,
                                              }}
                                            >
                                              {inquiry.answer}
                                            </p>
                                            <span
                                              style={{
                                                display: "block",
                                                marginTop: "12px",
                                                paddingTop: "12px",
                                                borderTop: "1px solid #E0E0F0",
                                                color: "#707070",
                                                fontSize: "12px",
                                                fontFamily: "var(--font-family-base)",
                                              }}
                                            >
                                              답변일:{" "}
                                              {inquiry.answeredAt
                                                ?.toDate()
                                                .toLocaleDateString("ko-KR")}
                                            </span>
                                          </div>
                                        </>
                                      )}
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 문의 작성 다이얼로그 */}
        {openInquiryDialog && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0,0,0,0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1300,
            }}
          >
            <div
              style={{
                backgroundColor: "white",
                borderRadius: "12px",
                padding: "24px",
                width: "100%",
                maxWidth: "600px",
                maxHeight: "90vh",
                overflowY: "auto",
                boxShadow:
                  "0px 11px 15px -7px rgba(0,0,0,0.2), 0px 24px 38px 3px rgba(0,0,0,0.14), 0px 9px 46px 8px rgba(0,0,0,0.12)",
              }}
            >
              <h2
                style={{
                  fontWeight: 600,
                  fontFamily: "var(--font-family-base)",
                  fontSize: "1.25rem",
                  margin: "0 0 16px 0",
                }}
              >
                1:1 문의하기
              </h2>
              <div style={{ marginTop: "16px" }}>
                <div style={{ marginBottom: "16px" }}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "8px",
                      fontFamily: "var(--font-family-base)",
                      fontSize: "1rem",
                      color: "#707070",
                    }}
                  >
                    문의 유형
                  </label>
                  <select
                    value={inquiryCategory}
                    onChange={(e) => setInquiryCategory(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "12px",
                      borderRadius: "4px",
                      border: "1px solid #E0E0E0",
                      fontFamily: "var(--font-family-base)",
                      fontSize: "1rem",
                      outline: "none",
                    }}
                  >
                    {Object.entries(INQUIRY_CATEGORY_LABELS).map(([key, label]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
                <div style={{ marginBottom: "16px" }}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "8px",
                      fontFamily: "var(--font-family-base)",
                      fontSize: "1rem",
                      color: "#707070",
                    }}
                  >
                    제목
                  </label>
                  <input
                    type="text"
                    value={inquiryTitle}
                    onChange={(e) => setInquiryTitle(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "12px",
                      borderRadius: "4px",
                      border: "1px solid #E0E0E0",
                      fontFamily: "var(--font-family-base)",
                      fontSize: "1rem",
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
                <div style={{ marginBottom: "16px" }}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "8px",
                      fontFamily: "var(--font-family-base)",
                      fontSize: "1rem",
                      color: "#707070",
                    }}
                  >
                    문의 내용
                  </label>
                  <textarea
                    rows={6}
                    value={inquiryContent}
                    onChange={(e) => setInquiryContent(e.target.value)}
                    placeholder="문의하실 내용을 자세히 작성해주세요."
                    style={{
                      width: "100%",
                      padding: "12px",
                      borderRadius: "4px",
                      border: "1px solid #E0E0E0",
                      fontFamily: "var(--font-family-base)",
                      fontSize: "1rem",
                      outline: "none",
                      resize: "vertical",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "8px",
                  marginTop: "24px",
                }}
              >
                <button
                  onClick={() => setOpenInquiryDialog(false)}
                  style={{
                    color: "#707070",
                    fontFamily: "var(--font-family-base)",
                    backgroundColor: "transparent",
                    border: "none",
                    padding: "8px 16px",
                    cursor: "pointer",
                    fontSize: "0.875rem",
                    fontWeight: 600,
                  }}
                >
                  취소
                </button>
                <button
                  onClick={handleSubmitInquiry}
                  disabled={submitting}
                  style={{
                    backgroundColor: "var(--primary-main)",
                    color: "white",
                    fontFamily: "var(--font-family-base)",
                    border: "none",
                    padding: "8px 24px",
                    borderRadius: "6px",
                    cursor: submitting ? "not-allowed" : "pointer",
                    fontSize: "0.875rem",
                    fontWeight: 600,
                    opacity: submitting ? 0.7 : 1,
                  }}
                >
                  {submitting ? "등록 중..." : "문의하기"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 문의 수정 다이얼로그 */}
        {openEditDialog && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0,0,0,0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1300,
            }}
          >
            <div
              style={{
                backgroundColor: "white",
                borderRadius: "12px",
                padding: "24px",
                width: "100%",
                maxWidth: "600px",
                maxHeight: "90vh",
                overflowY: "auto",
                boxShadow:
                  "0px 11px 15px -7px rgba(0,0,0,0.2), 0px 24px 38px 3px rgba(0,0,0,0.14), 0px 9px 46px 8px rgba(0,0,0,0.12)",
              }}
            >
              <h2
                style={{
                  fontWeight: 600,
                  fontFamily: "var(--font-family-base)",
                  fontSize: "1.25rem",
                  margin: "0 0 16px 0",
                }}
              >
                문의 수정
              </h2>
              <div style={{ marginTop: "16px" }}>
                <div style={{ marginBottom: "16px" }}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "8px",
                      fontFamily: "var(--font-family-base)",
                      fontSize: "1rem",
                      color: "#707070",
                    }}
                  >
                    문의 유형
                  </label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "12px",
                      borderRadius: "4px",
                      border: "1px solid #E0E0E0",
                      fontFamily: "var(--font-family-base)",
                      fontSize: "1rem",
                      outline: "none",
                    }}
                  >
                    {Object.entries(INQUIRY_CATEGORY_LABELS).map(([key, label]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
                <div style={{ marginBottom: "16px" }}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "8px",
                      fontFamily: "var(--font-family-base)",
                      fontSize: "1rem",
                      color: "#707070",
                    }}
                  >
                    제목
                  </label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "12px",
                      borderRadius: "4px",
                      border: "1px solid #E0E0E0",
                      fontFamily: "var(--font-family-base)",
                      fontSize: "1rem",
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
                <div style={{ marginBottom: "16px" }}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "8px",
                      fontFamily: "var(--font-family-base)",
                      fontSize: "1rem",
                      color: "#707070",
                    }}
                  >
                    문의 내용
                  </label>
                  <textarea
                    rows={6}
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    placeholder="문의하실 내용을 자세히 작성해주세요."
                    style={{
                      width: "100%",
                      padding: "12px",
                      borderRadius: "4px",
                      border: "1px solid #E0E0E0",
                      fontFamily: "var(--font-family-base)",
                      fontSize: "1rem",
                      outline: "none",
                      resize: "vertical",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
                <p
                  style={{
                    display: "block",
                    marginTop: "8px",
                    color: "#FF8C55",
                    fontFamily: "var(--font-family-base)",
                    fontSize: "0.75rem",
                    margin: 0,
                  }}
                >
                  ※ 관리자 답변이 등록되면 수정할 수 없습니다.
                </p>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "8px",
                  marginTop: "24px",
                }}
              >
                <button
                  onClick={() => setOpenEditDialog(false)}
                  style={{
                    color: "#707070",
                    fontFamily: "var(--font-family-base)",
                    backgroundColor: "transparent",
                    border: "none",
                    padding: "8px 16px",
                    cursor: "pointer",
                    fontSize: "0.875rem",
                    fontWeight: 600,
                  }}
                >
                  취소
                </button>
                <button
                  onClick={handleUpdateInquiry}
                  disabled={submitting}
                  style={{
                    backgroundColor: "var(--primary-main)",
                    color: "white",
                    fontFamily: "var(--font-family-base)",
                    border: "none",
                    padding: "8px 24px",
                    borderRadius: "6px",
                    cursor: submitting ? "not-allowed" : "pointer",
                    fontSize: "0.875rem",
                    fontWeight: 600,
                    opacity: submitting ? 0.7 : 1,
                  }}
                >
                  {submitting ? "수정 중..." : "수정 완료"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
