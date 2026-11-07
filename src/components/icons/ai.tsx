import React from "react";

export function AIIcon({ className = "w-4 h-4", ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      {/* Central neural intelligence core */}
      <circle cx="12" cy="12" r="3" fill="currentColor" fillOpacity="0.25" />
      {/* Neural lattice interconnect pathways */}
      <path d="M12 2v4" />
      <path d="M12 18v4" />
      <path d="M4.93 4.93l2.83 2.83" />
      <path d="M16.24 16.24l2.83 2.83" />
      <path d="M2 12h4" />
      <path d="M18 12h4" />
      <path d="M4.93 19.07l2.83-2.83" />
      <path d="M16.24 7.76l2.83-2.83" />
      {/* Peripheral node points */}
      <circle cx="12" cy="2" r="1.2" fill="currentColor" />
      <circle cx="12" cy="22" r="1.2" fill="currentColor" />
      <circle cx="2" cy="12" r="1.2" fill="currentColor" />
      <circle cx="22" cy="12" r="1.2" fill="currentColor" />
      <circle cx="4.93" cy="4.93" r="1" fill="currentColor" />
      <circle cx="19.07" cy="4.93" r="1" fill="currentColor" />
      <circle cx="4.93" cy="19.07" r="1" fill="currentColor" />
      <circle cx="19.07" cy="19.07" r="1" fill="currentColor" />
    </svg>
  );
}
