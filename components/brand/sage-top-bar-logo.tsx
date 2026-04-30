"use client";

import { cn } from "@/lib/utils";

export function SageTopBarLogo({ className }: { className?: string }) {
  return (
    <div
      aria-label="SAGE logo"
      className={cn("pointer-events-none flex h-full min-w-[96px] items-center justify-start overflow-visible", className)}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        alt="SAGE"
        className="block h-auto w-[56px] object-contain opacity-[0.92] [filter:hue-rotate(25deg)_saturate(1.35)_brightness(1.12)] [image-rendering:auto] [backface-visibility:hidden] [transform-style:preserve-3d] [will-change:transform] [mix-blend-mode:screen] [transform:rotate(28deg)] [transform-origin:center_center]"
        src="/sage-logo-transparent.png"
      />
    </div>
  );
}

