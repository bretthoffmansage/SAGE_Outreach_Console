"use client";

import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { ControlPanel, SectionHeader, StatusBadge } from "@/components/ui";

const btnGhost =
  "focus-ring inline-flex items-center justify-center gap-2 rounded-lg px-3.5 py-2 text-sm font-semibold transition border border-transparent bg-transparent text-slate-300 hover:bg-slate-900";

export function PlatformConnectorIntelligenceSection() {
  const seedInsights = useMutation(api.platformInsights.seedDefaultPlatformInsightsIfEmpty);
  const seedAgents = useMutation(api.agents.seedPlatformConnectorIntelligenceAgentsIfMissing);
  const insights = useQuery(api.platformInsights.listPlatformInsights, { limit: 24 });
  const agents = useQuery(api.agents.listAgentConfigs, { groupId: "platform_connector_intelligence" });

  const once = useRef(false);
  useEffect(() => {
    if (once.current) return;
    once.current = true;
    void seedInsights({}).catch(() => {});
    void seedAgents({}).catch(() => {});
  }, [seedAgents, seedInsights]);

  return (
    <div className="space-y-5">
      <SectionHeader
        eyebrow="Intelligence"
        title="Platform Connector Intelligence"
        description="Future read-only connectors for Meta, Instagram, Facebook, and Meta Ads — analysis, mapping, and draft recommendations only. This phase does not call Meta APIs, OAuth, or webhooks."
      />

      <div className="flex flex-wrap gap-2">
        <StatusBadge tone="gray">Planned / manual</StatusBadge>
        <StatusBadge tone="amber">No write actions</StatusBadge>
        <StatusBadge tone="blue">Dry-run agents</StatusBadge>
      </div>

      <ControlPanel className="border-slate-800 bg-slate-950/60 p-4">
        <p className="text-sm font-semibold text-slate-100">Safety</p>
        <p className="mt-2 text-sm leading-relaxed text-slate-300">
          Future Meta write actions must be designed separately with explicit approval gates. This pass does not enable posting, ad edits, budget changes, or
          audience mutations. Demo and manual platform insights stay labeled — only reviewed or approved insights should become trusted context for Copy
          Intelligence.
        </p>
      </ControlPanel>

      <div className="flex flex-wrap gap-2">
        <Link className={btnGhost} href="/operations/integrations">
          Operations — integrations
        </Link>
        <Link className={btnGhost} href="/intelligence/performance">
          Performance Intelligence
        </Link>
        <Link className={btnGhost} href="/intelligence/trends">
          Trend Intelligence
        </Link>
        <Link className={btnGhost} href="/intelligence/copy">
          Copy Intelligence
        </Link>
      </div>

      <ControlPanel className="p-4">
        <p className="text-sm font-semibold text-slate-100">Platform connector agents</p>
        <p className="mt-1 text-xs text-slate-500">Configured in Convex; demo provider — structured dry-run posture only.</p>
        <ul className="mt-3 space-y-2 text-sm text-slate-300">
          {(agents ?? []).length ? (
            (agents ?? []).map((a) => (
              <li className="flex flex-wrap items-baseline justify-between gap-2 rounded-lg border border-slate-800 bg-slate-950/50 px-3 py-2" key={a.agentId}>
                <span className="font-medium text-slate-100">{a.displayName}</span>
                <span className="text-xs text-slate-500">
                  {a.safetyMode ?? "—"} · {a.agentRole ?? "role"}
                </span>
              </li>
            ))
          ) : (
            <li className="text-slate-500">No agent rows yet — open this page once to seed defaults.</li>
          )}
        </ul>
      </ControlPanel>

      <ControlPanel className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-semibold text-slate-100">Platform insights (demo / manual)</p>
          <button
            type="button"
            className="focus-ring inline-flex items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-3.5 py-2 text-sm font-semibold text-slate-100 transition hover:bg-slate-800"
            onClick={() => {
              void seedInsights({}).catch(() => {});
            }}
          >
            Seed demo insights if empty
          </button>
        </div>
        <p className="mt-1 text-xs text-slate-500">Observations and patterns — not raw metrics. Labels show source mode and status.</p>
        <ul className="mt-3 space-y-2 text-sm">
          {(insights ?? []).length ? (
            (insights ?? []).map((row: Record<string, unknown>) => (
              <li className="rounded-lg border border-slate-800 bg-slate-950/50 px-3 py-2" key={String(row.insightId)}>
                <p className="font-medium text-slate-100">{String(row.title ?? row.insightId)}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {String(row.platform ?? "")} · {String(row.insightType ?? "")} · {String(row.status ?? "")} · source: {String(row.sourceSystem ?? "")} (
                  {String(row.sourceMode ?? "")})
                </p>
                <p className="mt-1 text-xs text-slate-400">{String(row.summary ?? "").slice(0, 200)}</p>
              </li>
            ))
          ) : (
            <li className="text-slate-500">No platform insights yet.</li>
          )}
        </ul>
      </ControlPanel>
    </div>
  );
}
