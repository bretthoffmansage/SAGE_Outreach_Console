"use client";

import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { useEffect, useRef } from "react";
import { ControlPanel, SectionHeader, StatusBadge } from "@/components/ui";

const seedBtnClass =
  "focus-ring inline-flex items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-3.5 py-2 text-sm font-semibold text-slate-100 transition hover:bg-slate-800";

function titleCaseSnake(s: string): string {
  if (!s) return "";
  return s.replace(/_/g, " ").replace(/\b\w/g, (ch) => ch.toUpperCase());
}

function humanizeConnectorPlatform(p: string): string {
  const k = p.trim().toLowerCase();
  const map: Record<string, string> = {
    meta_ads: "Meta Ads",
    instagram: "Instagram",
    facebook: "Facebook",
    meta: "Meta",
    youtube: "YouTube",
    tiktok: "TikTok",
    x: "X",
    pinterest: "Pinterest",
    mixed: "Mixed",
    manual: "Manual",
    demo: "Demo",
  };
  return map[k] ?? titleCaseSnake(p);
}

function humanizeConnectorField(s: string): string {
  const k = s.toLowerCase();
  if (k === "demo") return "Demo";
  if (k === "manual") return "Manual";
  if (k === "read_only_future") return "Read-only future";
  if (k === "dry_run") return "Dry-run";
  if (k === "analysis_only") return "Analysis-only";
  if (k === "recommendation_only") return "Recommendation-only";
  if (k === "review_assist") return "Review assist";
  if (k === "partial") return "Partial";
  if (k === "planned") return "Planned";
  if (k === "completed") return "Completed";
  if (k === "draft") return "Draft";
  return titleCaseSnake(s);
}

function humanizeConnectorSafetyMode(safetyMode?: string, agentRole?: string): string {
  const key = `${(safetyMode ?? "").toLowerCase()} · ${(agentRole ?? "").toLowerCase()}`;
  const map: Record<string, string> = {
    "dry_run · readiness": "Dry-run readiness",
    "planned · mapper": "Planned mapper",
    "analysis_only · patterns": "Analysis-only patterns",
    "review_assist · trends": "Review-assist trends",
    "analysis_only · summary": "Analysis-only summary",
    "recommendation_only · recommend": "Recommendation-only",
    "guardrail · safety": "Guardrail",
  };
  const fallback = [humanizeConnectorField(safetyMode ?? ""), humanizeConnectorField(agentRole ?? "")].filter(Boolean).join(" · ");
  return map[key] ?? (fallback || "—");
}

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
    <div className="mx-auto max-w-7xl space-y-5">
      <SectionHeader
        eyebrow="Intelligence"
        title="Platform Connector Intelligence"
        description="Future read-only connector context for Meta, Instagram, Facebook, Meta Ads, and other platforms. This page tracks planned analysis, mapping, and recommendation layers only. No platform APIs, OAuth, webhooks, posting, ad edits, or budget changes are enabled."
      />

      <div className="flex flex-wrap gap-2">
        <StatusBadge tone="gray">Planned / manual</StatusBadge>
        <StatusBadge tone="amber">No write actions</StatusBadge>
        <StatusBadge tone="blue">Dry-run agents</StatusBadge>
      </div>

      <ControlPanel className="border-slate-800 bg-slate-950/60 p-4">
        <p className="text-sm font-semibold text-slate-100">Safety</p>
        <p className="mt-2 text-sm leading-relaxed text-slate-300">
          Future platform connector data can support analysis and recommendations, but external writes must be designed separately with explicit approval gates.
          This page does not enable posting, ad edits, budget changes, audience changes, or account mutations.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-slate-400">
          Platform connector insights can eventually feed Performance, Trend, and Copy Intelligence after review.
        </p>
      </ControlPanel>

      <ControlPanel className="p-4">
        <p className="text-sm font-semibold text-slate-100">Connector readiness</p>
        <p className="mt-1 text-xs text-slate-500">Planned posture only — no live platform connection in this build.</p>
        <dl className="mt-3 grid gap-2 text-sm text-slate-300 sm:grid-cols-2">
          <div className="flex flex-wrap justify-between gap-2 rounded-lg border border-slate-800 bg-slate-950/50 px-3 py-2">
            <dt className="text-slate-500">Meta / Instagram / Facebook</dt>
            <dd className="text-slate-100">Planned / manual</dd>
          </div>
          <div className="flex flex-wrap justify-between gap-2 rounded-lg border border-slate-800 bg-slate-950/50 px-3 py-2">
            <dt className="text-slate-500">Meta Ads</dt>
            <dd className="text-slate-100">Planned / manual</dd>
          </div>
          <div className="flex flex-wrap justify-between gap-2 rounded-lg border border-slate-800 bg-slate-950/50 px-3 py-2">
            <dt className="text-slate-500">API calls</dt>
            <dd className="text-slate-100">Disabled</dd>
          </div>
          <div className="flex flex-wrap justify-between gap-2 rounded-lg border border-slate-800 bg-slate-950/50 px-3 py-2">
            <dt className="text-slate-500">OAuth / webhooks</dt>
            <dd className="text-slate-100">Not configured</dd>
          </div>
          <div className="flex flex-wrap justify-between gap-2 rounded-lg border border-slate-800 bg-slate-950/50 px-3 py-2">
            <dt className="text-slate-500">Writes</dt>
            <dd className="text-slate-100">Disabled</dd>
          </div>
          <div className="flex flex-wrap justify-between gap-2 rounded-lg border border-slate-800 bg-slate-950/50 px-3 py-2">
            <dt className="text-slate-500">Source mode</dt>
            <dd className="text-slate-100">Demo / manual</dd>
          </div>
        </dl>
      </ControlPanel>

      <ControlPanel className="p-4">
        <p className="text-sm font-semibold text-slate-100">Platform connector agents</p>
        <p className="mt-1 text-xs text-slate-500">Configured in Convex; demo provider — structured dry-run posture only.</p>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {(agents ?? []).length ? (
            (agents ?? []).map((a: Record<string, unknown>) => (
              <li className="rounded-xl border border-slate-800 bg-slate-950/50 p-3" key={String(a.agentId)}>
                <p className="text-sm font-semibold text-slate-100">{String(a.displayName ?? a.agentId)}</p>
                <p className="mt-1 text-xs leading-relaxed text-slate-400">{String(a.shortDescription ?? "—")}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <StatusBadge tone="amber">{humanizeConnectorSafetyMode(String(a.safetyMode), String(a.agentRole))}</StatusBadge>
                  <StatusBadge tone={a.enabled === false ? "gray" : "green"}>{a.enabled === false ? "Disabled" : "Configured (dry-run)"}</StatusBadge>
                </div>
              </li>
            ))
          ) : (
            <li className="col-span-full text-sm text-slate-500">No agent rows yet — open this page once to seed defaults.</li>
          )}
        </ul>
      </ControlPanel>

      <ControlPanel className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-sm font-semibold text-slate-100">Platform insights (demo / manual)</p>
            <p className="mt-1 text-xs text-slate-500">Observations and patterns — not raw metrics. Labels show source mode and status.</p>
          </div>
          <button
            className={seedBtnClass}
            onClick={() => {
              void seedInsights({}).catch(() => {});
            }}
            type="button"
          >
            Seed demo insights if empty
          </button>
        </div>
        <p className="mt-2 text-xs text-slate-500">Seeds demo or manual-shaped records only — not live platform pulls.</p>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {(insights ?? []).length ? (
            (insights ?? []).map((row: Record<string, unknown>) => (
              <li className="rounded-xl border border-slate-800 bg-slate-950/50 p-3" key={String(row.insightId)}>
                <p className="text-sm font-semibold text-slate-100">{String(row.title ?? row.insightId)}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <StatusBadge tone="gray">{humanizeConnectorPlatform(String(row.platform ?? ""))}</StatusBadge>
                  <StatusBadge tone="blue">{humanizeConnectorField(String(row.insightType ?? ""))}</StatusBadge>
                  <StatusBadge tone="amber">{humanizeConnectorField(String(row.status ?? ""))}</StatusBadge>
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  Source: {humanizeConnectorField(String(row.sourceSystem ?? ""))} · Mode: {humanizeConnectorField(String(row.sourceMode ?? ""))}
                </p>
                <p className="mt-2 text-xs leading-relaxed text-slate-400">{String(row.summary ?? "").slice(0, 280)}</p>
                <p className="mt-2 text-xs text-slate-500">
                  Review / trust: {humanizeConnectorField(String(row.status ?? "unreviewed"))}
                  {row.riskLevel ? ` · Risk: ${humanizeConnectorField(String(row.riskLevel))}` : ""}
                </p>
              </li>
            ))
          ) : (
            <li className="col-span-full text-sm text-slate-500">No platform insights yet.</li>
          )}
        </ul>
      </ControlPanel>
    </div>
  );
}
