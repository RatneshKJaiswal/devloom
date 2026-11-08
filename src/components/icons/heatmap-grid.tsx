import React from "react";

export function HeatmapGridIcon({
  className = "w-5 h-5",
  ...props
}: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      {/* 3x3 Heatmap Contribution Grid */}
      <rect x="2" y="2" width="4" height="4" rx="1.2" fill="currentColor" fillOpacity="0.35" />
      <rect x="8" y="2" width="4" height="4" rx="1.2" fill="currentColor" fillOpacity="0.85" />
      <rect x="14" y="2" width="4" height="4" rx="1.2" fill="currentColor" fillOpacity="0.3" />

      <rect x="2" y="8" width="4" height="4" rx="1.2" fill="currentColor" fillOpacity="0.6" />
      <rect x="8" y="8" width="4" height="4" rx="1.2" fill="currentColor" fillOpacity="1.0" />
      <rect x="14" y="8" width="4" height="4" rx="1.2" fill="currentColor" fillOpacity="0.75" />

      <rect x="2" y="14" width="4" height="4" rx="1.2" fill="currentColor" fillOpacity="0.9" />
      <rect x="8" y="14" width="4" height="4" rx="1.2" fill="currentColor" fillOpacity="0.45" />
      <rect x="14" y="14" width="4" height="4" rx="1.2" fill="currentColor" fillOpacity="1.0" />
    </svg>
  );
}
