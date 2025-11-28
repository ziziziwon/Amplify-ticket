import React from "react";

interface IconifyIconProps {
  icon: string;
  className?: string;
  style?: React.CSSProperties;
  width?: number | string;
  height?: number | string;
  color?: string;
}

/**
 * Iconify 아이콘 컴포넌트 (SVG mask 방식)
 * CSS mask를 사용하여 색상을 자유롭게 변경 가능
 */
export default function IconifyIcon({
  icon,
  className = "",
  style = {},
  width = 24,
  height = 24,
  color = "currentColor",
}: IconifyIconProps) {
  const iconUrl = `https://api.iconify.design/${icon}.svg`;

  return (
    <span
      className={`iconify-icon ${className}`}
      style={{
        display: "inline-block",
        width: typeof width === "number" ? `${width}px` : width,
        height: typeof height === "number" ? `${height}px` : height,
        maskImage: `url(${iconUrl})`,
        maskSize: "contain",
        maskRepeat: "no-repeat",
        maskPosition: "center",
        WebkitMaskImage: `url(${iconUrl})`,
        WebkitMaskSize: "contain",
        WebkitMaskRepeat: "no-repeat",
        WebkitMaskPosition: "center",
        backgroundColor: color,
        ...style,
      }}
      aria-hidden="true"
    />
  );
}


