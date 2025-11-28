import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import Home from "./pages/Home/Home";
import ShowList from "./pages/Shows/ShowList";
import ShowDetail from "./pages/Shows/ShowDetail";
import Verification from "./pages/Verification/Verification";
import SeatMap from "./pages/Seats/SeatMap";
import Basket from "./pages/Basket/Basket";
import Checkout from "./pages/Checkout/Checkout";
import SelectSeats from "./pages/Reserve/SelectSeats";
import Payment from "./pages/Reserve/Payment";
import PaymentSuccess from "./pages/Reserve/PaymentSuccess";
import PaymentPopup from "./components/PaymentPopup";
import MyTickets from "./pages/MyTickets/MyTickets";
import SeatPopupApp from "./screens/SeatPopupApp";
import TicketDetail from "./pages/MyTickets/TicketDetail";
import { autoSeedIfNeeded } from "./utils/seedShows";

// Category Pages
import Concert from "./pages/Categories/Concert";
import Musical from "./pages/Categories/Musical";
import Classical from "./pages/Categories/Classical";
import Festival from "./pages/Categories/Festival";
import Sports from "./pages/Categories/Sports";

// Service Pages
import Support from "./pages/Support/Support";
import Notice from "./pages/Notice/Notice";

// Event Pages
import EventList from "./pages/Events/EventList";
import EventDetail from "./pages/Events/EventDetail";
import EventWinners from "./pages/Events/EventWinners";
import MyEvents from "./pages/Events/MyEvents";

// Admin Event Pages
import AdminEventsList from "./pages/Admin/AdminEventsList";
import AdminEventsDetail from "./pages/Admin/AdminEventsDetail";

// Admin Pages
import AdminDashboard from "./pages/Admin/AdminDashboard";
import AdminEvents from "./pages/Admin/AdminEvents";
import AdminEventDetail from "./pages/Admin/AdminEventDetail";
import AdminUsers from "./pages/Admin/AdminUsers";
import AdminTickets from "./pages/Admin/AdminTickets";
import AdminNotices from "./pages/Admin/AdminNotices";
import AdminInquiries from "./pages/Admin/AdminInquiries";
import AdminEventsManagement from "./pages/Admin/AdminEventsManagement";

// Auth Pages
import Login from "./pages/Auth/Login";
import SignupEmail from "./pages/Auth/SignupEmail";
import SignupPassword from "./pages/Auth/SignupPassword";
import SignupProfile from "./pages/Auth/SignupProfile";
import SignupComplete from "./pages/Auth/SignupComplete";

// Protected Routes
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";
import ScrollToTop from "./components/ScrollToTop";

// Firebase & Store
import { auth, db } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useTicketStore } from "./stores/useTicketStore";
import { initializeDummyNotices } from "./utils/seedNotices";
import { initializeDummyEvents } from "./utils/seedEvents";

// AppContent: BrowserRouter 내부에서 useNavigate 사용
function AppContent() {
  const navigate = useNavigate();
  const { setUser } = useTicketStore();

  // 개발 환경에서 더미 데이터 함수 초기화
  useEffect(() => {
    initializeDummyNotices();
    initializeDummyEvents();
    
    // ⭐ Firestore에 공연 샘플 데이터 자동 시딩
    autoSeedIfNeeded();
  }, []);

  // 팝업에서 전송된 메시지 수신
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // 보안: 같은 origin에서만 메시지 수신
      if (event.origin !== window.location.origin) return;

      if (event.data.type === "seat:selected") {
        const { seats, showId, date, time } = event.data;
        // 좌석 선택 완료 후 결제 페이지로 이동
        navigate(`/payment?showId=${showId}&date=${date}&time=${time}`);
      } else if (event.data.type === "payment:completed") {
        const { showId, date, time, seats, buyerInfo, paymentMethod, totalPrice } = event.data;
        // 결제 완료 후 PaymentSuccess 페이지로 이동 (state로 데이터 전달)
        navigate("/payment/success", {
          state: {
            showId,
            date,
            time,
            selectedSeats: seats,
            buyerInfo,
            paymentMethod,
            totalPrice,
          },
        });
        // 팝업창에 닫기 메시지 전송 (팝업이 아직 열려있을 경우)
        if (event.source && event.source !== window) {
          try {
            (event.source as Window).postMessage(
              { type: "close:popup" },
              window.location.origin
            );
          } catch (e) {
            // 팝업이 이미 닫혔을 수 있음
            console.log("팝업 닫기 메시지 전송 실패 (이미 닫혔을 수 있음)");
          }
        }
      }
    };

    window.addEventListener("message", handleMessage);
    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, [navigate]);

  // Firebase Auth 상태 복원
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // 로그인 상태 - Firestore에서 사용자 정보 가져오기
        try {
          const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email || "",
              displayName: userData.nickname || firebaseUser.displayName || "",
              role: userData.role || "user",
            });
          } else {
            // Firestore에 문서가 없으면 기본값
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email || "",
              displayName: firebaseUser.displayName || "",
              role: "user",
            });
          }
        } catch (error) {
          console.error("사용자 정보 로드 실패:", error);
          // 에러 발생해도 기본 정보는 설정
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email || "",
            displayName: firebaseUser.displayName || "",
            role: "user",
          });
        }
      } else {
        // 로그아웃 상태
        setUser(null);
      }
    });

    // 컴포넌트 언마운트 시 리스너 해제
    return () => unsubscribe();
  }, [setUser]);

  return (
    <>
      <ScrollToTop />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/shows" element={<ShowList />} />
        <Route path="/shows/:showId" element={<ShowDetail />} />
        <Route path="/verification" element={<Verification />} />
        <Route path="/seats" element={<SeatMap />} />
        <Route path="/basket" element={<Basket />} />
        <Route path="/reserve/seats" element={<SelectSeats />} />
        <Route path="/seat-popup" element={<SeatPopupApp />} />
        <Route path="/payment-popup" element={<PaymentPopup />} />
        <Route path="/payment" element={<Payment />} />
        <Route path="/payment/success" element={<PaymentSuccess />} />
        
        {/* Category Routes */}
        <Route path="/categories/concert" element={<Concert />} />
        <Route path="/categories/musical" element={<Musical />} />
        <Route path="/categories/classical" element={<Classical />} />
        <Route path="/categories/festival" element={<Festival />} />
        <Route path="/categories/sports" element={<Sports />} />
        
        {/* Service Routes */}
        <Route path="/events" element={<EventList />} />
        <Route path="/events/:eventId" element={<EventDetail />} />
        <Route path="/events/:eventId/winners" element={<EventWinners />} />
        <Route path="/my-events" element={
          <ProtectedRoute>
            <MyEvents />
          </ProtectedRoute>
        } />
        <Route path="/support" element={<Support />} />
        <Route path="/notice" element={<Notice />} />
        
        {/* Protected Routes - 로그인 필요 */}
        <Route path="/checkout" element={
          <ProtectedRoute>
            <Checkout />
          </ProtectedRoute>
        } />
        <Route path="/tickets" element={
          <ProtectedRoute>
            <MyTickets />
          </ProtectedRoute>
        } />
        <Route path="/tickets/:orderId" element={
          <ProtectedRoute>
            <TicketDetail />
          </ProtectedRoute>
        } />
        
        {/* Auth Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignupEmail />} />
        <Route path="/signup/password" element={<SignupPassword />} />
        <Route path="/signup/profile" element={<SignupProfile />} />
        <Route path="/signup/complete" element={<SignupComplete />} />
        
        {/* Admin Routes - 관리자 전용 */}
        <Route path="/admin" element={
          <AdminRoute>
            <AdminDashboard />
          </AdminRoute>
        } />
        <Route path="/admin/dashboard" element={
          <AdminRoute>
            <AdminDashboard />
          </AdminRoute>
        } />
        <Route path="/admin/shows" element={
          <AdminRoute>
            <AdminEvents />
          </AdminRoute>
        } />
        <Route path="/admin/shows/edit/:showId" element={
          <AdminRoute>
            <AdminEventDetail />
          </AdminRoute>
        } />
        <Route path="/admin/users" element={
          <AdminRoute>
            <AdminUsers />
          </AdminRoute>
        } />
        <Route path="/admin/tickets" element={
          <AdminRoute>
            <AdminTickets />
          </AdminRoute>
        } />
        <Route path="/admin/notices" element={
          <AdminRoute>
            <AdminNotices />
          </AdminRoute>
        } />
        <Route path="/admin/inquiries" element={
          <AdminRoute>
            <AdminInquiries />
          </AdminRoute>
        } />
        <Route path="/admin/events-management" element={
          <AdminRoute>
            <AdminEventsManagement />
          </AdminRoute>
        } />
        <Route path="/admin/events" element={
          <AdminRoute>
            <AdminEventsList />
          </AdminRoute>
        } />
        <Route path="/admin/events/:eventId/detail" element={
          <AdminRoute>
            <AdminEventsDetail />
          </AdminRoute>
        } />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter basename="/amplify">
      <AppContent />
    </BrowserRouter>
  );
}
