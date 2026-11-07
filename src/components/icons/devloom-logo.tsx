import React from "react";

interface DevLoomMarkProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
}

export function DevLoomMark({ className = "w-6 h-6", ...props }: DevLoomMarkProps) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      {/* Top wing bar */}
      <path
        d="M 11.0 20.07 L 75.64 20.07 L 89.0 43.48 L 85.19 49.96 L 71.1 26.88 L 14.89 26.88 Z"
        fill="currentColor"
      />
      {/* Middle chevron wing */}
      <path
        d="M 18.29 33.36 L 67.86 33.36 L 81.22 56.6 L 68.18 79.93 L 60.41 79.93 L 73.37 56.6 L 63.97 40.16 L 22.18 40.16 Z"
        fill="currentColor"
      />
      {/* Inner checkmark chevron */}
      <path
        d="M 62.35 50.28 L 65.92 56.6 L 51.98 79.93 L 44.69 79.93 L 38.38 68.75 L 42.26 62.11 L 49.07 72.48 Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function DevLoomLogo({
  className = "h-8 w-8",
  ...props
}: {
  className?: string;
  [key: string]: any;
}) {
  return (
    <div
      className={`relative rounded-xl bg-gradient-to-br from-[#181a20] via-[#101216] to-[#08090b] border border-white/10 flex items-center justify-center shadow-md shadow-black/40 overflow-hidden group shrink-0 ${className}`}
      {...props}
    >
      <div className="absolute inset-0 bg-radial from-white/[0.08] to-transparent pointer-events-none" />
      <DevLoomMark className="w-[74%] h-[74%] text-white relative z-10 drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]" />
    </div>
  );
}
