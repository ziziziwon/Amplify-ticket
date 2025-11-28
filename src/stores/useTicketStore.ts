import { create } from "zustand";
import { persist } from "zustand/middleware";
import { SelectedSeat, Order } from "../types";

// 인증 사용자 정보 (간단한 버전)
interface AuthUser {
  uid: string;
  email: string;
  displayName: string;
  role?: "user" | "admin" | "banned";
}

interface TicketStore {
  // 사용자
  user: AuthUser | null;
  setUser: (user: AuthUser | null) => void;

  // 선택된 좌석
  selectedSeats: SelectedSeat[];
  addSeat: (seat: SelectedSeat) => void;
  removeSeat: (seatId: string) => void;
  clearSeats: () => void;

  // 현재 선택중인 공연 정보
  currentShowId: string | null;
  currentShowDate: string | null;
  setCurrentShow: (showId: string, date: string) => void;

  // 장바구니
  basket: SelectedSeat[];
  moveToBasket: () => void;
  clearBasket: () => void;

  // 주문
  currentOrder: Order | null;
  setCurrentOrder: (order: Order | null) => void;
}

export const useTicketStore = create<TicketStore>()(
  persist(
    (set) => ({
      // 사용자
      user: null,
      setUser: (user) => set({ user }),

      // 선택된 좌석
      selectedSeats: [],
      addSeat: (seat) =>
        set((state) => {
          // 최대 4매 제한
          if (state.selectedSeats.length >= 4) {
            alert("최대 4매까지 선택 가능합니다.");
            return state;
          }
          // 중복 체크
          if (state.selectedSeats.find((s) => s.seatId === seat.seatId)) {
            return state;
          }
          return { selectedSeats: [...state.selectedSeats, seat] };
        }),
      removeSeat: (seatId) =>
        set((state) => ({
          selectedSeats: state.selectedSeats.filter((s) => s.seatId !== seatId),
        })),
      clearSeats: () => set({ selectedSeats: [] }),

      // 현재 공연
      currentShowId: null,
      currentShowDate: null,
      setCurrentShow: (showId, date) =>
        set({ currentShowId: showId, currentShowDate: date }),

      // 장바구니
      basket: [],
      moveToBasket: () =>
        set((state) => ({
          basket: [...state.selectedSeats],
          selectedSeats: [],
        })),
      clearBasket: () => set({ basket: [] }),

      // 주문
      currentOrder: null,
      setCurrentOrder: (order) => set({ currentOrder: order }),
    }),
    {
      name: "amplify-ticket-storage", // localStorage 키 이름
    }
  )
);

