/**
 * Firestore에서 특정 공연 상세 정보를 가져오는 API
 * 
 * 사용법:
 * const event = await fetchEventById('show_concert_001');
 */

import { db } from "../firebase/config";
import { doc, getDoc } from "firebase/firestore";
import { EventItem } from "./fetchEvents";

/**
 * 공연 ID로 상세 정보 가져오기
 * 
 * @param id - 공연 ID (showId)
 * @returns EventItem 또는 null
 */
export async function fetchEventById(id: string): Promise<EventItem | null> {
  try {
    const docRef = doc(db, "shows", id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      console.warn(`⚠️  공연을 찾을 수 없습니다: ${id}`);
      return null;
    }

    return {
      id: docSnap.id,
      showId: docSnap.id,
      ...docSnap.data(),
    } as EventItem;
  } catch (error) {
    console.error("❌ fetchEventById 오류:", error);
    throw error;
  }
}

