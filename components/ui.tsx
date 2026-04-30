import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <section className={cn("rounded-3xl border border-[#eadfce] bg-white/78 p-6 shadow-sm", className)}>{children}</section>;
}

export function Pill({ children, tone = "gray" }: { children: ReactNode; tone?: "green" | "amber" | "red" | "blue" | "purple" | "gray" | string }) {
  const tones: Record<string, string> = {
    green: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    amber: "bg-amber-50 text-amber-700 ring-amber-200",
    red: "bg-red-50 text-red-700 ring-red-200",
    blue: "bg-blue-50 text-blue-700 ring-blue-200",
    purple: "bg-purple-50 text-purple-700 ring-purple-200",
    gray: "bg-slate-100 text-slate-600 ring-slate-200",
  };
  return <span className={cn("inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1", tones[tone] ?? tones.gray)}>{children}</span>;
}

export function Button({ children, variant = "primary" }: { children: ReactNode; variant?: "primary" | "secondary" }) {
  return (
    <span
      className={cn(
        "focus-ring inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-semibold transition",
        variant === "primary"
          ? "bg-[#172033] text-white shadow-lg shadow-slate-900/10 hover:bg-[#24304a]"
          : "border border-[#eadfce] bg-white/70 text-[#172033] hover:bg-white",
      )}
    >
      {children}
    </span>
  );
}
