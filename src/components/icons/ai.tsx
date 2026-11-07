import React from "react";

export function AIIcon({ className = "w-4 h-4", ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      {...props}
    >
      {/* Primary 4-pointed smooth star */}
      <path
        d="M12 2C12 7.52 7.52 12 2 12C7.52 12 12 16.48 12 22C12 16.48 16.48 12 22 12C16.48 12 12 7.52 12 2Z"
        fill="currentColor"
      />
      {/* Secondary accent star */}
      <path
        d="M19 2C19 4.2 17.2 6 15 6C17.2 6 19 7.8 19 10C19 7.8 20.8 6 23 6C20.8 6 19 4.2 19 2Z"
        fill="currentColor"
        opacity="0.85"
      />
    </svg>
  );
}
