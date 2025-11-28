import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
  increment,
  writeBatch,
  limit,
} from "firebase/firestore";
import { db } from "./config";
import { Show, Order, Venue, PresaleCode, Event, EventParticipant, EventWinner, EventSortType } from "../types";

// 컬렉션 이름
const COLLECTIONS = {
  SHOWS: "shows",
  VENUES: "venues",
  ORDERS: "orders",
  SEAT_STATUS: "seatStatus",
  PRESALE_CODES: "presaleCodes",
  USERS: "users",
  EVENTS: "events",
  EVENT_PARTICIPANTS: "eventParticipants",
  EVENT_WINNERS: "eventWinners",
};

// 공연 정렬 타입
export type ShowSortType = "latest" | "popularity" | "deadline" | "price_low" | "price_high";

// 공연 CRUD
export const showsService = {
  // 모든 공연 가져오기
  getAll: async (): Promise<Show[]> => {
    const querySnapshot = await getDocs(collection(db, COLLECTIONS.SHOWS));
    return querySnapshot.docs.map((doc) => ({ ...doc.data(), showId: doc.id } as Show));
  },

  // 카테고리별 공연 가져오기 (정렬 포함)
  getByCategory: async (
    category: string,
    sortType: ShowSortType = "latest"
  ): Promise<Show[]> => {
    let q;

    if (category === "all") {
      // 전체 공연
      q = query(collection(db, COLLECTIONS.SHOWS));
    } else {
      // 특정 카테고리
      q = query(
        collection(db, COLLECTIONS.SHOWS),
        where("category", "==", category)
      );
    }

    // 정렬 추가
    switch (sortType) {
      case "latest":
        q = query(q, orderBy("dates", "asc"));
        break;
      case "popularity":
        q = query(q, orderBy("ticketStatus", "asc")); // onsale > presale > upcoming
        break;
      case "deadline":
        q = query(q, orderBy("dates", "asc"));
        break;
      case "price_low":
        // Firestore에서는 직접 불가능, 클라이언트에서 정렬
        break;
      case "price_high":
        // Firestore에서는 직접 불가능, 클라이언트에서 정렬
        break;
    }

    const querySnapshot = await getDocs(q);
    let shows = querySnapshot.docs.map((doc) => ({ ...doc.data(), showId: doc.id } as Show));

    // 가격 정렬은 클라이언트에서 처리
    if (sortType === "price_low") {
      shows.sort((a, b) => {
        const minPriceA = Math.min(...Object.values(a.priceTable));
        const minPriceB = Math.min(...Object.values(b.priceTable));
        return minPriceA - minPriceB;
      });
    } else if (sortType === "price_high") {
      shows.sort((a, b) => {
        const maxPriceA = Math.max(...Object.values(a.priceTable));
        const maxPriceB = Math.max(...Object.values(b.priceTable));
        return maxPriceB - maxPriceA;
      });
    }

    return shows;
  },

  // 티켓 오픈 예정 공연 가져오기
  getUpcoming: async (limitCount: number = 10): Promise<Show[]> => {
    const q = query(
      collection(db, COLLECTIONS.SHOWS),
      where("ticketStatus", "==", "upcoming"),
      orderBy("ticketOpenDate", "asc"),
      limit(limitCount)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({ ...doc.data(), showId: doc.id } as Show));
  },

  // 인기 공연 가져오기 (판매 중인 공연)
  getPopular: async (limitCount: number = 10): Promise<Show[]> => {
    const q = query(
      collection(db, COLLECTIONS.SHOWS),
      where("ticketStatus", "==", "onsale"),
      limit(limitCount)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({ ...doc.data(), showId: doc.id } as Show));
  },

  // 특정 공연 가져오기
  getById: async (showId: string): Promise<Show | null> => {
    const docRef = doc(db, COLLECTIONS.SHOWS, showId);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? (docSnap.data() as Show) : null;
  },

  // 공연 생성
  create: async (show: Show): Promise<void> => {
    await setDoc(doc(db, COLLECTIONS.SHOWS, show.showId), show);
  },

  // 공연 수정
  update: async (showId: string, data: Partial<Show>): Promise<void> => {
    await updateDoc(doc(db, COLLECTIONS.SHOWS, showId), data);
  },

  // 공연 삭제
  delete: async (showId: string): Promise<void> => {
    await deleteDoc(doc(db, COLLECTIONS.SHOWS, showId));
  },
};

// 공연장 CRUD
export const venuesService = {
  getAll: async (): Promise<Venue[]> => {
    const querySnapshot = await getDocs(collection(db, COLLECTIONS.VENUES));
    return querySnapshot.docs.map((doc) => ({ ...doc.data(), venueId: doc.id } as Venue));
  },

  getById: async (venueId: string): Promise<Venue | null> => {
    const docRef = doc(db, COLLECTIONS.VENUES, venueId);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? (docSnap.data() as Venue) : null;
  },
};

// 주문 CRUD
export const ordersService = {
  // 주문 생성
  create: async (order: Order): Promise<void> => {
    await setDoc(doc(db, COLLECTIONS.ORDERS, order.orderId), {
      ...order,
      createdAt: Timestamp.now(),
    });
  },

  // 사용자별 주문 조회
  getByUserId: async (userId: string): Promise<Order[]> => {
    const q = query(
      collection(db, COLLECTIONS.ORDERS),
      where("userId", "==", userId),
      orderBy("createdAt", "desc")
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({ ...doc.data(), orderId: doc.id } as Order));
  },

  // 특정 주문 조회
  getById: async (orderId: string): Promise<Order | null> => {
    const docRef = doc(db, COLLECTIONS.ORDERS, orderId);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? (docSnap.data() as Order) : null;
  },

  // 주문 상태 변경
  updateStatus: async (orderId: string, status: Order["status"]): Promise<void> => {
    await updateDoc(doc(db, COLLECTIONS.ORDERS, orderId), { status });
  },
};

// 좌석 상태 관리
export const seatStatusService = {
  // 특정 공연/날짜의 좌석 상태 가져오기
  getStatus: async (showId: string, date: string): Promise<Record<string, string>> => {
    const docRef = doc(db, COLLECTIONS.SEAT_STATUS, `${showId}_${date}`);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? (docSnap.data() as Record<string, string>) : {};
  },

  // 좌석 상태 업데이트
  updateStatus: async (
    showId: string,
    date: string,
    seatId: string,
    status: string
  ): Promise<void> => {
    const docRef = doc(db, COLLECTIONS.SEAT_STATUS, `${showId}_${date}`);
    await updateDoc(docRef, { [seatId]: status });
  },

  // 여러 좌석 상태 한번에 업데이트
  updateMultiple: async (
    showId: string,
    date: string,
    updates: Record<string, string>
  ): Promise<void> => {
    const docRef = doc(db, COLLECTIONS.SEAT_STATUS, `${showId}_${date}`);
    await updateDoc(docRef, updates);
  },
};

// 선예매 코드 관리
export const presaleCodesService = {
  // 코드 검증
  verify: async (code: string, showId: string): Promise<boolean> => {
    const q = query(
      collection(db, COLLECTIONS.PRESALE_CODES),
      where("code", "==", code),
      where("showId", "==", showId),
      where("isUsed", "==", false)
    );
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) return false;

    const codeDoc = querySnapshot.docs[0];
    const codeData = codeDoc.data() as PresaleCode;
    
    // 유효기간 확인
    const now = new Date();
    const validUntil = new Date(codeData.validUntil);
    
    return now <= validUntil;
  },

  // 코드 사용 처리
  use: async (code: string, userId: string): Promise<void> => {
    const q = query(
      collection(db, COLLECTIONS.PRESALE_CODES),
      where("code", "==", code)
    );
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const codeDoc = querySnapshot.docs[0];
      await updateDoc(codeDoc.ref, {
        isUsed: true,
        usedBy: userId,
      });
    }
  },
};

// ===================================
// 이벤트 서비스
// ===================================

// 유틸리티: 이벤트 상태 계산
const calculateEventStatus = (startDate: any, endDate: any) => {
  const now = new Date();
  const start = startDate.toDate ? startDate.toDate() : new Date(startDate);
  const end = endDate.toDate ? endDate.toDate() : new Date(endDate);
  
  if (now < start) return "scheduled";
  if (now > end) return "ended";
  return "ongoing";
};

// 유틸리티: 이메일 마스킹
export const maskEmail = (email: string): string => {
  const [local, domain] = email.split("@");
  if (local.length <= 2) {
    return `${local[0]}***@${domain}`;
  }
  const visiblePart = local.substring(0, Math.min(4, Math.floor(local.length / 2)));
  return `${visiblePart}****@${domain}`;
};

// 유틸리티: 전화번호 마스킹
export const maskPhone = (phone: string): string => {
  // 010-1234-5678 -> 010-****-5678
  const cleaned = phone.replace(/[^0-9]/g, "");
  if (cleaned.length === 11) {
    return `${cleaned.substring(0, 3)}-****-${cleaned.substring(7)}`;
  }
  // 기본 마스킹
  return phone.replace(/(\d{3})-?(\d{3,4})-?(\d{4})/, "$1-****-$3");
};

// 유틸리티: Fisher-Yates Shuffle
const shuffleArray = <T,>(array: T[]): T[] => {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

// 이벤트 CRUD
export const eventsService = {
  // 모든 이벤트 가져오기 (필터 & 정렬)
  getAll: async (sortType: EventSortType = "latest"): Promise<Event[]> => {
    let q;
    
    switch (sortType) {
      case "deadline":
        q = query(collection(db, COLLECTIONS.EVENTS), orderBy("endDate", "asc"));
        break;
      case "popular":
        q = query(collection(db, COLLECTIONS.EVENTS), orderBy("participantCount", "desc"));
        break;
      case "latest":
      default:
        q = query(collection(db, COLLECTIONS.EVENTS), orderBy("createdAt", "desc"));
        break;
    }
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        status: calculateEventStatus(data.startDate, data.endDate),
      } as Event;
    });
  },

  // 특정 이벤트 가져오기
  getById: async (eventId: string): Promise<Event | null> => {
    const docRef = doc(db, COLLECTIONS.EVENTS, eventId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) return null;
    
    const data = docSnap.data();
    return {
      ...data,
      id: docSnap.id,
      status: calculateEventStatus(data.startDate, data.endDate),
    } as Event;
  },

  // 이벤트 생성 (관리자)
  create: async (eventData: Omit<Event, "id" | "createdAt" | "updatedAt">): Promise<string> => {
    const docRef = doc(collection(db, COLLECTIONS.EVENTS));
    await setDoc(docRef, {
      ...eventData,
      viewCount: 0,
      participantCount: 0,
      isWinnerAnnounced: false,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    return docRef.id;
  },

  // 이벤트 수정 (관리자)
  update: async (eventId: string, data: Partial<Event>): Promise<void> => {
    await updateDoc(doc(db, COLLECTIONS.EVENTS, eventId), {
      ...data,
      updatedAt: Timestamp.now(),
    });
  },

  // 이벤트 삭제 (관리자)
  delete: async (eventId: string): Promise<void> => {
    await deleteDoc(doc(db, COLLECTIONS.EVENTS, eventId));
  },

  // 조회수 증가
  incrementViewCount: async (eventId: string): Promise<void> => {
    await updateDoc(doc(db, COLLECTIONS.EVENTS, eventId), {
      viewCount: increment(1),
    });
  },

  // 상태별 이벤트 가져오기
  getByStatus: async (status: "scheduled" | "ongoing" | "ended"): Promise<Event[]> => {
    const allEvents = await eventsService.getAll();
    return allEvents.filter(event => event.status === status);
  },
};

// 이벤트 참여자 관리
export const eventParticipantsService = {
  // 참여하기
  participate: async (
    eventId: string,
    participantData: Omit<EventParticipant, "id" | "eventId" | "participatedAt">
  ): Promise<void> => {
    const participantRef = doc(db, COLLECTIONS.EVENTS, eventId, "participants", participantData.userId);
    
    // 중복 참여 확인
    const participantSnap = await getDoc(participantRef);
    if (participantSnap.exists()) {
      throw new Error("이미 참여한 이벤트입니다.");
    }
    
    // 참여 정보 저장
    await setDoc(participantRef, {
      ...participantData,
      id: participantData.userId,
      eventId,
      participatedAt: Timestamp.now(),
    });
    
    // 이벤트의 참여자 수 증가
    await updateDoc(doc(db, COLLECTIONS.EVENTS, eventId), {
      participantCount: increment(1),
    });
  },

  // 참여 여부 확인
  checkParticipation: async (eventId: string, userId: string): Promise<boolean> => {
    const participantRef = doc(db, COLLECTIONS.EVENTS, eventId, "participants", userId);
    const participantSnap = await getDoc(participantRef);
    return participantSnap.exists();
  },

  // 참여자 목록 가져오기 (관리자)
  getAll: async (eventId: string): Promise<EventParticipant[]> => {
    const q = query(
      collection(db, COLLECTIONS.EVENTS, eventId, "participants"),
      orderBy("participatedAt", "desc")
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => doc.data() as EventParticipant);
  },

  // 사용자가 참여한 이벤트 목록
  getByUserId: async (userId: string): Promise<Event[]> => {
    const allEvents = await eventsService.getAll();
    const participatedEvents: Event[] = [];
    
    for (const event of allEvents) {
      const hasParticipated = await eventParticipantsService.checkParticipation(event.id, userId);
      if (hasParticipated) {
        participatedEvents.push(event);
      }
    }
    
    return participatedEvents;
  },
};

// 이벤트 당첨자 관리
export const eventWinnersService = {
  // 랜덤 추첨 (관리자)
  selectWinners: async (eventId: string, winnerCount: number): Promise<EventWinner[]> => {
    // 참여자 목록 가져오기
    const participants = await eventParticipantsService.getAll(eventId);
    
    if (participants.length === 0) {
      throw new Error("참여자가 없습니다.");
    }
    
    if (winnerCount > participants.length) {
      throw new Error(`참여자(${participants.length}명)보다 많은 당첨자를 선정할 수 없습니다.`);
    }
    
    // Fisher-Yates 셔플
    const shuffled = shuffleArray(participants);
    const selectedParticipants = shuffled.slice(0, winnerCount);
    
    // 당첨자 정보 변환 (마스킹 처리)
    const winners: EventWinner[] = selectedParticipants.map((p) => ({
      id: `${eventId}_${p.userId}`,
      eventId,
      userId: p.userId,
      email: maskEmail(p.email),
      phone: maskPhone(p.phone),
      nickname: p.nickname,
      selectedAt: Timestamp.now(),
      notified: false,
    }));
    
    return winners;
  },

  // 당첨자 확정 및 저장 (관리자)
  saveWinners: async (eventId: string, winners: EventWinner[]): Promise<void> => {
    const batch = writeBatch(db);
    
    // 기존 당첨자 삭제 (재추첨 대비)
    const existingWinners = await eventWinnersService.getAll(eventId);
    existingWinners.forEach((winner) => {
      const winnerRef = doc(db, COLLECTIONS.EVENTS, eventId, "winners", winner.id);
      batch.delete(winnerRef);
    });
    
    // 새 당첨자 저장
    winners.forEach((winner) => {
      const winnerRef = doc(db, COLLECTIONS.EVENTS, eventId, "winners", winner.id);
      batch.set(winnerRef, winner);
    });
    
    // 이벤트 발표 상태 업데이트
    const eventRef = doc(db, COLLECTIONS.EVENTS, eventId);
    batch.update(eventRef, {
      isWinnerAnnounced: true,
      winnerCount: winners.length,
      updatedAt: Timestamp.now(),
    });
    
    await batch.commit();
  },

  // 당첨자 목록 가져오기
  getAll: async (eventId: string): Promise<EventWinner[]> => {
    const q = query(
      collection(db, COLLECTIONS.EVENTS, eventId, "winners"),
      orderBy("selectedAt", "desc")
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => doc.data() as EventWinner);
  },

  // 내가 당첨됐는지 확인
  checkWinner: async (eventId: string, userId: string): Promise<boolean> => {
    const winners = await eventWinnersService.getAll(eventId);
    return winners.some((winner) => winner.userId === userId);
  },

  // 발표 상태 변경 (관리자)
  toggleAnnouncement: async (eventId: string, isAnnounced: boolean): Promise<void> => {
    await updateDoc(doc(db, COLLECTIONS.EVENTS, eventId), {
      isWinnerAnnounced: isAnnounced,
      updatedAt: Timestamp.now(),
    });
  },
};

