import React from "react";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export default function Logo({ className = "", size = "md" }: LogoProps) {
  // Height sizing mapping for responsive layout
  const heights = {
    sm: "h-9",
    md: "h-16",
    lg: "h-24",
  };

  return (
    <div className={`flex flex-col items-center justify-center ${className} select-none`}>
      <svg viewBox="0 0 24 24" className={`${heights[size]} w-auto`} fill="#f5c518"><path d="M13 2L3 14h7l-1 8 10-12h-7l1-8z"/></svg>
      
      {/* Brand text matching user's logo tagline */}
      <div className="text-center mt-2">
        <span
          className={`font-sans font-extrabold tracking-wider text-neutral-150 uppercase block leading-tight ${
            size === "lg" ? "text-xl" : size === "md" ? "text-base" : "text-xs"
          }`}
        >
          Volts
        </span>
        <span
          className={`text-amber-400 font-mono font-bold block ${
            size === "lg" ? "text-xs tracking-[0.25em] mt-0.5" : size === "md" ? "text-[10px] tracking-[0.2em] mt-0.5" : "text-[8px] tracking-[0.15em]"
          }`}
        >
          BY VOLTS
        </span>
      </div>
    </div>
  );
}
