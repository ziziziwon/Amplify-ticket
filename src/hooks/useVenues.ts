import { useState, useEffect } from "react";
import { Venue } from "../types";
import venuesData from "../data/venues.json";
// import { venuesService } from "../firebase/services";

/**
 * 공연장 목록을 가져오는 커스텀 훅
 * 실제 사용 시 Firebase에서 데이터를 가져오도록 수정
 */
export function useVenues() {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchVenues() {
      try {
        setLoading(true);
        
        // 로컬 JSON 데이터 사용 (개발용)
        setVenues(venuesData as Venue[]);
        
        // Firebase 사용 시 주석 해제
        // const data = await venuesService.getAll();
        // setVenues(data);
        
        setLoading(false);
      } catch (err) {
        setError(err as Error);
        setLoading(false);
      }
    }

    fetchVenues();
  }, []);

  return { venues, loading, error };
}

/**
 * 특정 공연장 정보를 가져오는 커스텀 훅
 */
export function useVenue(venueId: string) {
  const [venue, setVenue] = useState<Venue | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchVenue() {
      try {
        setLoading(true);
        
        // 로컬 JSON 데이터 사용 (개발용)
        const venues = venuesData as Venue[];
        const found = venues.find((v) => v.venueId === venueId);
        setVenue(found || null);
        
        // Firebase 사용 시 주석 해제
        // const data = await venuesService.getById(venueId);
        // setVenue(data);
        
        setLoading(false);
      } catch (err) {
        setError(err as Error);
        setLoading(false);
      }
    }

    fetchVenue();
  }, [venueId]);

  return { venue, loading, error };
}

