import { useEffect, useRef, useState } from "react";
import IconifyIcon from "./Icon/IconifyIcon";
import "./ShowMap.css";

interface ShowMapProps {
  address: string;
  venueName?: string;
}

declare global {
  interface Window {
    kakao: any;
  }
}

export default function ShowMap({ address, venueName }: ShowMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 카카오 지도 로드 및 렌더링
  useEffect(() => {
    if (!address || !mapRef.current) {
      setLoading(false);
      setError("주소 정보가 없습니다.");
      return;
    }

    const { kakao } = window as any;

    // SDK 로드 대기
    if (!kakao || !kakao.maps) {
      const checkInterval = setInterval(() => {
        if (window.kakao && window.kakao.maps) {
          clearInterval(checkInterval);
          loadMap();
        }
      }, 100);

      const timeout = setTimeout(() => {
        clearInterval(checkInterval);
        if (!window.kakao || !window.kakao.maps) {
          setError("카카오 지도 SDK 로드 시간이 초과되었습니다.");
          setLoading(false);
        }
      }, 5000);

      return () => {
        clearInterval(checkInterval);
        clearTimeout(timeout);
      };
    }

    loadMap();

    function loadMap() {
      const { kakao } = window as any;

      kakao.maps.load(() => {
        try {
          setLoading(true);
          setError(null);

          // 주소 정제 (괄호 제거)
          const cleanAddress = address.replace(/\(.*?\)/g, "").trim();

          // Geocoder를 사용하여 주소를 좌표로 변환
          const geocoder = new kakao.maps.services.Geocoder();

          // 1차 시도: 정제된 주소로 검색
          geocoder.addressSearch(cleanAddress, (result: any, status: any) => {
            if (status === kakao.maps.services.Status.OK) {
              const coords = new kakao.maps.LatLng(result[0].y, result[0].x);

              // 지도 생성
              const map = new kakao.maps.Map(mapRef.current, {
                center: coords,
                level: 3,
              });

              // 마커 생성
              const marker = new kakao.maps.Marker({
                map: map,
                position: coords,
              });

              // 인포윈도우 생성 (선택사항)
              if (venueName) {
                const infowindow = new kakao.maps.InfoWindow({
                  content: `<div style="padding: 8px; font-size: 12px; font-weight: bold;">${venueName}</div>`,
                });

                // 마커 클릭 시 인포윈도우 표시
                kakao.maps.event.addListener(marker, "click", () => {
                  infowindow.open(map, marker);
                });

                // 초기에 인포윈도우 표시
                infowindow.open(map, marker);
              }

              setLoading(false);
            } else {
              // 2차 시도: 원본 주소로 재시도
              if (cleanAddress !== address) {
                geocoder.addressSearch(address, (result2: any, status2: any) => {
                  if (status2 === kakao.maps.services.Status.OK) {
                    const coords = new kakao.maps.LatLng(result2[0].y, result2[0].x);

                    const map = new kakao.maps.Map(mapRef.current, {
                      center: coords,
                      level: 3,
                    });

                    const marker = new kakao.maps.Marker({
                      map: map,
                      position: coords,
                    });

                    if (venueName) {
                      const infowindow = new kakao.maps.InfoWindow({
                        content: `<div style="padding: 8px; font-size: 12px; font-weight: bold;">${venueName}</div>`,
                      });

                      kakao.maps.event.addListener(marker, "click", () => {
                        infowindow.open(map, marker);
                      });

                      infowindow.open(map, marker);
                    }

                    setLoading(false);
                  } else {
                    setError(`주소를 찾을 수 없습니다: ${address}`);
                    setLoading(false);
                  }
                });
              } else {
                setError(`주소를 찾을 수 없습니다: ${address}`);
                setLoading(false);
              }
            }
          });
        } catch (err: any) {
          console.error("❌ 지도 로드 실패:", err);
          setError(err.message || "지도를 불러오는데 실패했습니다.");
          setLoading(false);
        }
      });
    }
  }, [address, venueName]);

  if (error) {
    return (
      <div className="showmap-error">
        <IconifyIcon icon="mdi:alert-circle" width={24} height={24} />
        <p>{error}</p>
        {address && (
          <p className="showmap-error-address">
            <IconifyIcon icon="mdi:map-marker" width={16} height={16} />
            {address}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="showmap-container">
      {loading && (
        <div className="showmap-loading">
          <div className="showmap-spinner"></div>
          <p>지도를 불러오는 중...</p>
        </div>
      )}
      <div
        ref={mapRef}
        className="showmap-map"
        style={{
          display: loading ? "none" : "block",
        }}
      />
      {!loading && !error && (
        <div className="showmap-info">
          <IconifyIcon icon="mdi:map-marker" width={16} height={16} />
          <span>{address}</span>
        </div>
      )}
    </div>
  );
}
