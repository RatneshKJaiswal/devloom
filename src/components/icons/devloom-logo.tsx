import React from "react";

interface DevLoomMarkProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
}

export function DevLoomMark({ className = "w-6 h-6", ...props }: DevLoomMarkProps) {
  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <defs>
        {/* Primary gradient: Electric Blue to Cyan */}
        <linearGradient id="dl-blue-grad" x1="4" y1="4" x2="36" y2="36" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#4285F4" />
          <stop offset="50%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#38BDF8" />
        </linearGradient>

        {/* Emerald accent: representing resolved code / success */}
        <linearGradient id="dl-accent-grad" x1="10" y1="26" x2="32" y2="14" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#34A853" />
          <stop offset="100%" stopColor="#10B981" />
        </linearGradient>

        {/* Violet accent: representing learnings / intelligence */}
        <linearGradient id="dl-violet-grad" x1="8" y1="8" x2="28" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#818CF8" />
          <stop offset="100%" stopColor="#6366F1" />
        </linearGradient>

        {/* Subtle glow filter */}
        <filter id="dl-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="1.2" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Loom warp threads (vertical loom pillars) */}
      <line x1="11" y1="8" x2="11" y2="32" stroke="url(#dl-blue-grad)" strokeWidth="3" strokeLinecap="round" />
      <line x1="17" y1="8" x2="17" y2="32" stroke="url(#dl-violet-grad)" strokeWidth="2.4" strokeLinecap="round" opacity="0.85" />

      {/* Loom weft loops forming the "D" curve (interwoven ribbon) */}
      <path
        d="M 11 9.5 C 11 9.5, 22 7, 27.5 12.5 C 32.5 17, 32.5 23, 27.5 27.5 C 22 33, 11 30.5, 11 30.5"
        stroke="url(#dl-blue-grad)"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Inner weaving cross-thread (weft shuttle line) */}
      <path
        d="M 8 20 H 25.5 C 28.5 20, 29.5 17.5, 28 15.5 C 26.5 13.5, 22 14.5, 19.5 16.5"
        stroke="url(#dl-accent-grad)"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Weaving intersection nodes (nexus points) */}
      <circle cx="11" cy="20" r="2.2" fill="#60A5FA" filter="url(#dl-glow)" />
      <circle cx="17" cy="20" r="1.8" fill="#34A853" />
      <circle cx="26" cy="20" r="2" fill="#38BDF8" />
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
      className={`relative rounded-xl bg-gradient-to-br from-[#1c212c] via-[#13151b] to-[#0c0d11] border border-blue-500/30 flex items-center justify-center shadow-md shadow-blue-500/20 overflow-hidden group shrink-0 ${className}`}
      {...props}
    >
      {/* Subtle ambient background glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-transparent to-emerald-500/10 opacity-75 group-hover:opacity-100 transition-opacity" />
      <DevLoomMark className="w-[72%] h-[72%] relative z-10 drop-shadow-[0_1px_4px_rgba(59,130,246,0.35)]" />
    </div>
  );
}
