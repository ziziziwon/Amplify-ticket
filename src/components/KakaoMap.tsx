import React, { useEffect } from "react";

interface KakaoMapProps {
  address: string;
}

declare global {
  interface Window {
    kakao: any;
  }
}

const KakaoMap: React.FC<KakaoMapProps> = ({ address }) => {
  useEffect(() => {
    if (!window.kakao || !window.kakao.maps) return;

    const geocoder = new window.kakao.maps.services.Geocoder();

    geocoder.addressSearch(address, function (result: any, status: any) {
      if (status === window.kakao.maps.services.Status.OK) {
        const container = document.getElementById("map");
        const options = {
          center: new window.kakao.maps.LatLng(result[0].y, result[0].x),
          level: 3,
        };

        const map = new window.kakao.maps.Map(container, options);
        new window.kakao.maps.Marker({
          map,
          position: new window.kakao.maps.LatLng(result[0].y, result[0].x),
        });
      }
    });
  }, [address]);

  return (
    <div
      id="map"
      style={{
        width: "100%",
        height: "300px",
        borderRadius: "12px",
        border: "1px solid #eee",
      }}
    />
  );
};

export default KakaoMap;

