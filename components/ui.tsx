import type { ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const toneMap: Record<string, string> = {
  green: "border-emerald-400/40 bg-emerald-400/16 text-emerald-100",
  amber: "border-amber-400/40 bg-amber-400/18 text-amber-100",
  red: "border-rose-400/40 bg-rose-400/18 text-rose-100",
  blue: "border-sky-400/40 bg-sky-400/18 text-sky-100",
  purple: "border-violet-400/40 bg-violet-400/18 text-violet-100",
  gray: "border-slate-500 bg-slate-800 text-slate-100",
};

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <section
      className={cn("panel-console rounded-2xl p-5 shadow-[0_20px_50px_rgba(0,0,0,0.25)]", className)}
    >
      {children}
    </section>
  );
}

export function ControlPanel({ children, className }: { children: ReactNode; className?: string }) {
  return <Card className={cn("overflow-hidden", className)}>{children}</Card>;
}

export function Pill({ children, tone = "gray" }: { children: ReactNode; tone?: "green" | "amber" | "red" | "blue" | "purple" | "gray" | string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-md border px-2.5 py-1 text-[0.68rem] font-bold uppercase tracking-[0.16em]",
        toneMap[tone] ?? toneMap.gray,
      )}
    >
      {children}
    </span>
  );
}

export function StatusDot({ tone = "gray", className }: { tone?: string; className?: string }) {
  const colors: Record<string, string> = {
    green: "bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.8)]",
    amber: "bg-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.8)]",
    red: "bg-rose-400 shadow-[0_0_12px_rgba(251,113,133,0.8)]",
    blue: "bg-sky-400 shadow-[0_0_12px_rgba(56,189,248,0.8)]",
    purple: "bg-violet-400 shadow-[0_0_12px_rgba(167,139,250,0.8)]",
    gray: "bg-slate-500",
  };

  return <span className={cn("inline-block h-2.5 w-2.5 rounded-full", colors[tone] ?? colors.gray, className)} />;
}

export function StatusBadge({ children, tone = "gray", className }: { children: ReactNode; tone?: string; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2 rounded-md border border-slate-700 bg-slate-900/90 px-2.5 py-1 text-xs font-semibold text-slate-200", className)}>
      <StatusDot tone={tone} />
      {children}
    </span>
  );
}

export function Button({
  children,
  variant = "primary",
  className,
}: {
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  className?: string;
}) {
  const variants = {
    primary: "border border-sky-500/60 bg-sky-500 text-slate-950 hover:bg-sky-400",
    secondary: "border border-slate-700 bg-slate-900 text-slate-100 hover:bg-slate-800",
    ghost: "border border-transparent bg-transparent text-slate-300 hover:bg-slate-900",
    danger: "border border-rose-500/50 bg-rose-500/18 text-rose-100 hover:bg-rose-500/28",
  };

  return (
    <span
      className={cn(
        "focus-ring inline-flex items-center justify-center rounded-lg px-3.5 py-2 text-sm font-semibold transition disabled:opacity-60",
        variants[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function SectionHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  void title;
  return (
    <div className="flex flex-col justify-between gap-3 border-b border-slate-800 pb-3 md:flex-row md:items-end">
      <div>
        {eyebrow ? <p className="text-[0.68rem] font-bold uppercase tracking-[0.24em] text-slate-400">{eyebrow}</p> : null}
        {description ? <p className={cn("max-w-4xl text-sm leading-6 text-slate-300", eyebrow ? "mt-1.5" : "")}>{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

export function ConsoleTable({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("overflow-hidden rounded-xl border border-slate-700 bg-slate-950/80", className)}>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm [&_tbody_tr]:transition-colors [&_tbody_tr:hover]:bg-slate-900/90 [&_tbody_tr:nth-child(even)]:bg-slate-950/40">{children}</table>
      </div>
    </div>
  );
}

export function TableHead({ children }: { children: ReactNode }) {
  return <thead className="sticky top-0 z-10 bg-slate-900/95 text-left text-[0.68rem] font-bold uppercase tracking-[0.18em] text-slate-300">{children}</thead>;
}

export function Th({ children, className }: { children: ReactNode; className?: string }) {
  return <th className={cn("px-4 py-3 font-bold", className)}>{children}</th>;
}

export function Td({ children, className }: { children: ReactNode; className?: string }) {
  return <td className={cn("border-t border-slate-800 px-4 py-3 align-top text-slate-200", className)}>{children}</td>;
}

export function QueueLane({
  title,
  count,
  tone,
  subtitle,
  action,
  children,
}: {
  title: string;
  count: number | string;
  tone: string;
  subtitle?: string;
  action?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <ControlPanel className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <StatusDot tone={tone} />
            <p className="text-sm font-semibold text-slate-100">{title}</p>
          </div>
          {subtitle ? <p className="mt-1 text-xs text-slate-400">{subtitle}</p> : null}
        </div>
        <Pill tone={tone}>{count}</Pill>
      </div>
      {children ? <div className="mt-4">{children}</div> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </ControlPanel>
  );
}

export function PipelineStage({
  title,
  count,
  tone,
  warning,
}: {
  title: string;
  count: number | string;
  tone: string;
  warning?: string;
}) {
  return (
    <div className="min-w-[140px] rounded-xl border border-slate-800 bg-slate-950/70 p-3">
      <div className="flex items-center justify-between gap-3">
        <StatusDot tone={tone} />
        <span className="text-lg font-semibold text-slate-50">{count}</span>
      </div>
      <p className="mt-3 text-sm font-semibold text-slate-100">{title}</p>
      <p className="mt-1 text-[0.72rem] text-slate-400">{warning ?? "Nominal"}</p>
    </div>
  );
}

export function SignalList({ items }: { items: Array<{ label: string; value: string | number; tone: string; detail?: string }> }) {
  return (
    <div className="grid gap-2">
      {items.map((item) => (
        <div key={item.label} className="flex items-center justify-between gap-3 rounded-lg border border-slate-800 bg-slate-950/65 px-3 py-2.5">
          <div>
            <div className="flex items-center gap-2">
              <StatusDot tone={item.tone} />
              <span className="text-sm font-medium text-slate-100">{item.label}</span>
            </div>
            {item.detail ? <p className="mt-1 text-xs text-slate-400">{item.detail}</p> : null}
          </div>
          <span className="text-sm font-semibold text-slate-200">{item.value}</span>
        </div>
      ))}
    </div>
  );
}

export function AgentActivityBars({ active }: { active: boolean }) {
  if (!active) return null;

  return (
    <span className="inline-flex h-4 items-end gap-1" aria-hidden="true">
      {[0, 1, 2].map((index) => (
        <span
          key={index}
          className="agent-activity-bar w-1 rounded-full bg-sky-400"
          style={{ animationDelay: `${index * 0.16}s` }}
        />
      ))}
    </span>
  );
}

export function AgentNode({
  label,
  state,
  tone,
  meta,
  isRunning,
  currentTaskLabel,
  clickable,
  actionLabel,
}: {
  label: string;
  state: string;
  tone: string;
  meta?: string;
  isRunning?: boolean;
  currentTaskLabel?: string;
  clickable?: boolean;
  actionLabel?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-slate-800 bg-slate-950/70 p-3 transition",
        clickable ? "cursor-pointer hover:border-sky-500/40 hover:bg-slate-900/90" : "",
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-100">{label}</p>
          {currentTaskLabel && isRunning ? (
            <p className="mt-1 truncate text-xs text-sky-200">{currentTaskLabel}</p>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          <AgentActivityBars active={Boolean(isRunning || state === "running")} />
          <StatusDot tone={tone} />
        </div>
      </div>
      <p className="mt-2 text-xs uppercase tracking-[0.16em] text-slate-400">{state}</p>
      {meta ? <p className="mt-2 text-xs leading-5 text-slate-300">{meta}</p> : null}
      {clickable ? (
        <div className="mt-3 flex items-center justify-end text-xs font-semibold uppercase tracking-[0.16em] text-sky-200">
          {actionLabel ?? "Configure"}
          <ChevronRight className="ml-1 h-3.5 w-3.5" />
        </div>
      ) : null}
    </div>
  );
}

export function ReadinessChecklist({
  items,
}: {
  items: Array<{ label: string; complete: boolean; tone?: string; detail?: string }>;
}) {
  return (
    <div className="grid gap-2">
      {items.map((item) => (
        <div key={item.label} className="rounded-lg border border-slate-800 bg-slate-950/65 px-3 py-2.5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <StatusDot tone={item.complete ? item.tone ?? "green" : "gray"} />
              <span className="text-sm font-medium text-slate-100">{item.label}</span>
            </div>
            <span className="text-[0.68rem] font-bold uppercase tracking-[0.16em] text-slate-400">
              {item.complete ? "ready" : "pending"}
            </span>
          </div>
          {item.detail ? <p className="mt-1 text-xs text-slate-400">{item.detail}</p> : null}
        </div>
      ))}
    </div>
  );
}

export function InlineAction({ children }: { children: ReactNode }) {
  return <span className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.16em] text-sky-300">{children}<ChevronRight className="h-3.5 w-3.5" /></span>;
}
