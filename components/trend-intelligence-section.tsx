"use client";

import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { LineChart, Link2, Plus, Radar, ShieldAlert } from "lucide-react";
import { useAppUser } from "@/components/auth/app-user-context";
import { ControlPanel, SectionHeader, StatusBadge } from "@/components/ui";
import {
  labelForPlatform,
  scoreBand,
  SOURCE_SYSTEMS,
  TREND_PLATFORMS,
  TREND_STATUSES,
  TREND_TYPES,
} from "@/lib/trend-intelligence-constants";
import { cn } from "@/lib/utils";

type TrendRow = Record<string, unknown> & {
  trendId: string;
  title: string;
  platform: string;
  status: string;
  updatedAt: number;
};

const btnBase =
  "focus-ring inline-flex items-center justify-center gap-2 rounded-lg px-3.5 py-2 text-sm font-semibold transition disabled:opacity-60";
const btnPrimary = `${btnBase} border border-sky-500/60 bg-sky-500 text-slate-950 hover:bg-sky-400`;
const btnSecondary = `${btnBase} border border-slate-700 bg-slate-900 text-slate-100 hover:bg-slate-800`;
const btnGhost = `${btnBase} border border-transparent bg-transparent text-slate-300 hover:bg-slate-900`;
const field = "console-field-control focus-ring w-full rounded-lg border border-slate-700 bg-slate-950/80 px-3 py-2 text-slate-100";

function linesToArr(s: string) {
  return s
    .split(/\r?\n/)
    .map((x) => x.trim())
    .filter(Boolean);
}

const TREND_AGENTS = [
  { id: "trend_scout_agent", name: "Trend Scout", mode: "dry_run", purpose: "Record or discover signals from manual research or future connectors." },
  { id: "trend_fit_agent", name: "Trend Fit", mode: "review_assist", purpose: "Brand, audience, and campaign relevance scoring." },
  { id: "content_adaptation_agent", name: "Content Adaptation", mode: "draft_only", purpose: "Reel, meme, caption, and creative-brief directions." },
  { id: "trend_risk_agent", name: "Trend Risk", mode: "review_assist", purpose: "Gimmick, stale, misleading, or compliance-sensitive usage." },
  { id: "platform_pattern_agent", name: "Platform Pattern", mode: "learning_candidate", purpose: "Playbook-style pattern summaries." },
  { id: "trend_to_campaign_mapper", name: "Trend-to-Campaign Mapper", mode: "review_assist", purpose: "Suggests which launch packets fit a trend." },
  { id: "trend_learning_agent", name: "Trend Learning", mode: "learning_candidate", purpose: "Learning candidates after use — human approval required." },
] as const;

export function TrendIntelligenceSection() {
  const searchParams = useSearchParams();
  const trendFromUrl = searchParams.get("trend")?.trim() ?? "";
  const campaignFromUrl = searchParams.get("campaign")?.trim() ?? "";
  const { email } = useAppUser();

  const [search, setSearch] = useState("");
  const [platform, setPlatform] = useState("");
  const [status, setStatus] = useState("");
  const [trendType, setTrendType] = useState("");
  const [tagFilter, setTagFilter] = useState("");
  const [selectedId, setSelectedId] = useState<string>("");
  const [showAdd, setShowAdd] = useState(false);
  const [dryBusy, setDryBusy] = useState(false);

  const seedTrends = useMutation(api.trendSignals.seedDefaultTrendSignalsIfEmpty);
  const seedMetaTrendDemos = useMutation(api.trendSignals.seedMetaTrendDemosIfMissing);
  const seedAgents = useMutation(api.agents.seedTrendIntelligenceAgentsIfMissing);
  const upsertTrend = useMutation(api.trendSignals.upsertTrendSignal);
  const updateStatus = useMutation(api.trendSignals.updateTrendSignalStatus);
  const linkCampaign = useMutation(api.trendSignals.linkTrendToCampaign);
  const saveSwipe = useMutation(api.trendSignals.saveTrendToSwipeFile);
  const savePlaybook = useMutation(api.trendSignals.saveTrendAsPlaybookCandidate);
  const saveLearning = useMutation(api.trendSignals.saveTrendAsLearningCandidate);
  const runDry = useMutation(api.trendResearchRuns.runTrendResearchDryRun);

  const seedOnce = useRef(false);
  useEffect(() => {
    if (seedOnce.current) return;
    seedOnce.current = true;
    void seedTrends({}).catch(() => {});
    void seedMetaTrendDemos({}).catch(() => {});
    void seedAgents({}).catch(() => {});
  }, [seedAgents, seedMetaTrendDemos, seedTrends]);

  const listArgs = useMemo(
    () => ({
      search: search.trim() || undefined,
      platform: platform || undefined,
      status: status || undefined,
      trendType: trendType || undefined,
      tag: tagFilter.trim() || undefined,
      limit: 80,
    }),
    [search, platform, status, trendType, tagFilter],
  );

  const trends = (useQuery(api.trendSignals.listTrendSignals, listArgs) ?? []) as TrendRow[];
  const allTrendsForStats = (useQuery(api.trendSignals.listTrendSignals, { limit: 300 }) ?? []) as TrendRow[];
  const detail = useQuery(api.trendSignals.getTrendSignal, selectedId ? { trendId: selectedId } : "skip");
  const campaigns = useQuery(api.campaigns.listCampaignRecords, {});
  const researchRuns = useQuery(api.trendResearchRuns.listTrendResearchRuns, { limit: 12 });
  const trendConfigs = useQuery(api.agents.listAgentConfigs, { groupId: "trend_intelligence" });

  useEffect(() => {
    if (trendFromUrl) setSelectedId(trendFromUrl);
  }, [trendFromUrl]);

  const stats = useMemo(() => {
    const all = allTrendsForStats;
    const now = Date.now();
    const monthAgo = now - 30 * 86400000;
    return {
      total: all.length,
      candidate: all.filter((t) => t.status === "candidate").length,
      approved: all.filter((t) => t.status === "approved").length,
      linked: all.filter((t) => ((t.relatedCampaignIds as string[] | undefined) ?? []).length > 0).length,
      highFit: all.filter((t) => typeof t.brandFitScore === "number" && t.brandFitScore >= 80).length,
      highRisk: all.filter((t) => typeof t.riskScore === "number" && t.riskScore >= 60).length,
      stale: all.filter((t) => t.status === "stale" || t.timeliness === "stale").length,
      usedThisMonth: all.filter((t) => t.status === "used" && typeof t.usedAt === "number" && t.usedAt >= monthAgo).length,
      platforms: new Set(all.map((t) => t.platform)).size,
    };
  }, [allTrendsForStats]);

  const [form, setForm] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!detail) return;
    const d = detail as Record<string, unknown>;
    const arr = (k: string) => (Array.isArray(d[k]) ? (d[k] as string[]).join("\n") : "");
    setForm({
      title: String(d.title ?? ""),
      summary: String(d.summary ?? ""),
      platform: String(d.platform ?? ""),
      trendType: String(d.trendType ?? ""),
      status: String(d.status ?? "candidate"),
      sourceSystem: String(d.sourceSystem ?? "manual"),
      sourceUrl: String(d.sourceUrl ?? ""),
      sourceLabel: String(d.sourceLabel ?? ""),
      timeliness: String(d.timeliness ?? "unknown"),
      relevanceScore: d.relevanceScore !== undefined ? String(d.relevanceScore) : "",
      brandFitScore: d.brandFitScore !== undefined ? String(d.brandFitScore) : "",
      audienceFitScore: d.audienceFitScore !== undefined ? String(d.audienceFitScore) : "",
      riskScore: d.riskScore !== undefined ? String(d.riskScore) : "",
      effortLevel: String(d.effortLevel ?? ""),
      confidence: d.confidence !== undefined ? String(d.confidence) : "",
      tags: arr("tags"),
      suggestedUses: arr("suggestedUses"),
      adaptationIdeas: arr("adaptationIdeas"),
      hookIdeas: arr("hookIdeas"),
      captionIdeas: arr("captionIdeas"),
      memeIdeas: arr("memeIdeas"),
      creativeBriefNotes: String(d.creativeBriefNotes ?? ""),
      platformNotes: String(d.platformNotes ?? ""),
      riskNotes: String(d.riskNotes ?? ""),
      approvalNotes: String(d.approvalNotes ?? ""),
      linkCampaignId: campaignFromUrl,
    });
  }, [detail, campaignFromUrl]);

  const saveDetail = useCallback(async () => {
    if (!selectedId) return;
    const patch = {
      title: form.title,
      summary: form.summary,
      platform: form.platform,
      trendType: form.trendType || undefined,
      status: form.status,
      sourceSystem: form.sourceSystem,
      sourceUrl: form.sourceUrl || undefined,
      sourceLabel: form.sourceLabel || undefined,
      timeliness: form.timeliness || undefined,
      relevanceScore: form.relevanceScore ? Number(form.relevanceScore) : undefined,
      brandFitScore: form.brandFitScore ? Number(form.brandFitScore) : undefined,
      audienceFitScore: form.audienceFitScore ? Number(form.audienceFitScore) : undefined,
      riskScore: form.riskScore ? Number(form.riskScore) : undefined,
      effortLevel: form.effortLevel || undefined,
      confidence: form.confidence ? Number(form.confidence) : undefined,
      tags: linesToArr(form.tags),
      suggestedUses: linesToArr(form.suggestedUses),
      adaptationIdeas: linesToArr(form.adaptationIdeas),
      hookIdeas: linesToArr(form.hookIdeas),
      captionIdeas: linesToArr(form.captionIdeas),
      memeIdeas: linesToArr(form.memeIdeas),
      creativeBriefNotes: form.creativeBriefNotes || undefined,
      platformNotes: form.platformNotes || undefined,
      riskNotes: form.riskNotes || undefined,
      approvalNotes: form.approvalNotes || undefined,
    };
    await upsertTrend({ trendId: selectedId, patch });
  }, [form, selectedId, upsertTrend]);

  const [newTrend, setNewTrend] = useState({
    title: "",
    platform: "instagram",
    trendType: "reel_format",
    summary: "",
    sourceUrl: "",
    sourceLabel: "",
    tags: "",
    status: "candidate",
  });

  const createTrend = useCallback(async () => {
    if (!newTrend.title.trim()) return;
    const res = await upsertTrend({
      patch: {
        title: newTrend.title.trim(),
        platform: newTrend.platform,
        trendType: newTrend.trendType,
        summary: newTrend.summary.trim(),
        sourceUrl: newTrend.sourceUrl.trim() || undefined,
        sourceLabel: newTrend.sourceLabel.trim() || undefined,
        status: newTrend.status,
        sourceSystem: "manual",
        tags: linesToArr(newTrend.tags),
      },
    });
    setShowAdd(false);
    setSelectedId(res.trendId);
    setNewTrend({
      title: "",
      platform: "instagram",
      trendType: "reel_format",
      summary: "",
      sourceUrl: "",
      sourceLabel: "",
      tags: "",
      status: "candidate",
    });
  }, [newTrend, upsertTrend]);

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Intelligence"
        title="Trend Intelligence"
        description="Capture and evaluate platform trends, short-form formats, meme ideas, and social patterns before turning them into campaign-safe content. Outside examples are inspiration only — approved means safe to adapt, not to copy verbatim."
      />

      <div className="flex flex-wrap gap-2">
        <StatusBadge tone="gray">Manual / research-only</StatusBadge>
        <StatusBadge tone="amber">Human-controlled</StatusBadge>
        <StatusBadge tone="gray">No live scraping in this build</StatusBadge>
      </div>

      <ControlPanel className="border-slate-800 bg-slate-950/60 p-4">
        <p className="text-sm font-semibold text-slate-100">Meta and Instagram trend signals</p>
        <p className="mt-2 text-sm leading-relaxed text-slate-300">
          Meta and Instagram trend signals are currently manual or planned. Future connector support may help identify content patterns and performance signals,
          but trend ideas should still be reviewed for brand fit before use. Demo signals are labeled — they are not live platform pulls.
        </p>
      </ControlPanel>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total signals", value: stats.total },
          { label: "Candidates", value: stats.candidate },
          { label: "Approved", value: stats.approved },
          { label: "Linked to campaigns", value: stats.linked },
          { label: "High brand fit (80+)", value: stats.highFit },
          { label: "Higher risk (60+)", value: stats.highRisk },
          { label: "Stale / marked stale", value: stats.stale },
          { label: "Used (30d)", value: stats.usedThisMonth },
          { label: "Platforms (distinct)", value: stats.platforms },
        ].map((c) => (
          <ControlPanel className="p-3" key={c.label}>
            <p className="text-[0.65rem] font-bold uppercase tracking-[0.16em] text-slate-500">{c.label}</p>
            <p className="mt-1 text-2xl font-semibold text-slate-100">{c.value}</p>
          </ControlPanel>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <button className={btnPrimary} onClick={() => setShowAdd((v) => !v)} type="button">
          <Plus className="h-4 w-4" />
          Add trend signal
        </button>
        <button
          className={btnSecondary}
          disabled={dryBusy}
          onClick={() => {
            setDryBusy(true);
            void runDry({
              platform: platform || undefined,
              campaignId: campaignFromUrl || undefined,
              query: search || undefined,
              createdBy: email ?? undefined,
            })
              .finally(() => setDryBusy(false));
          }}
          type="button"
        >
          <Radar className="h-4 w-4" />
          {dryBusy ? "Running…" : "Run trend research dry run"}
        </button>
        <Link className={btnGhost} href="/intelligence/copy">
          Copy Intelligence
        </Link>
        <Link className={btnGhost} href="/operations/integrations">
          <Link2 className="h-4 w-4" />
          Operations / integrations
        </Link>
      </div>

      {showAdd ? (
        <ControlPanel className="p-4">
          <p className="text-sm font-semibold text-slate-100">New trend signal</p>
          <p className="mt-1 text-xs text-slate-500">Defaults to candidate — not auto-approved. Tags: one per line.</p>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <label className="grid gap-1 text-xs">
              <span className="text-slate-400">Title</span>
              <input className={field} onChange={(e) => setNewTrend((n) => ({ ...n, title: e.target.value }))} value={newTrend.title} />
            </label>
            <label className="grid gap-1 text-xs">
              <span className="text-slate-400">Platform</span>
              <select className={field} onChange={(e) => setNewTrend((n) => ({ ...n, platform: e.target.value }))} value={newTrend.platform}>
                {TREND_PLATFORMS.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1 text-xs">
              <span className="text-slate-400">Trend type</span>
              <select className={field} onChange={(e) => setNewTrend((n) => ({ ...n, trendType: e.target.value }))} value={newTrend.trendType}>
                {TREND_TYPES.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1 text-xs">
              <span className="text-slate-400">Status</span>
              <select className={field} onChange={(e) => setNewTrend((n) => ({ ...n, status: e.target.value }))} value={newTrend.status}>
                {TREND_STATUSES.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1 text-xs md:col-span-2">
              <span className="text-slate-400">Summary</span>
              <textarea className={field} onChange={(e) => setNewTrend((n) => ({ ...n, summary: e.target.value }))} rows={3} value={newTrend.summary} />
            </label>
            <label className="grid gap-1 text-xs">
              <span className="text-slate-400">Source URL (optional)</span>
              <input className={field} onChange={(e) => setNewTrend((n) => ({ ...n, sourceUrl: e.target.value }))} value={newTrend.sourceUrl} />
            </label>
            <label className="grid gap-1 text-xs">
              <span className="text-slate-400">Source label</span>
              <input className={field} onChange={(e) => setNewTrend((n) => ({ ...n, sourceLabel: e.target.value }))} value={newTrend.sourceLabel} />
            </label>
            <label className="grid gap-1 text-xs md:col-span-2">
              <span className="text-slate-400">Tags (one per line)</span>
              <textarea className={field} onChange={(e) => setNewTrend((n) => ({ ...n, tags: e.target.value }))} rows={2} value={newTrend.tags} />
            </label>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button className={btnPrimary} onClick={() => void createTrend()} type="button">
              Save trend
            </button>
            <button className={btnGhost} onClick={() => setShowAdd(false)} type="button">
              Cancel
            </button>
          </div>
        </ControlPanel>
      ) : null}

      <ControlPanel className="p-4">
        <p className="text-sm font-semibold text-slate-100">Filters</p>
        <div className="mt-3 grid gap-3 md:grid-cols-3 lg:grid-cols-6">
          <label className="grid gap-1 text-xs">
            <span className="text-slate-400">Search</span>
            <input className={field} onChange={(e) => setSearch(e.target.value)} placeholder="Title or summary" value={search} />
          </label>
          <label className="grid gap-1 text-xs">
            <span className="text-slate-400">Platform</span>
            <select className={field} onChange={(e) => setPlatform(e.target.value)} value={platform}>
              <option value="">All</option>
              {TREND_PLATFORMS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-xs">
            <span className="text-slate-400">Status</span>
            <select className={field} onChange={(e) => setStatus(e.target.value)} value={status}>
              <option value="">All</option>
              {TREND_STATUSES.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-xs">
            <span className="text-slate-400">Trend type</span>
            <select className={field} onChange={(e) => setTrendType(e.target.value)} value={trendType}>
              <option value="">All</option>
              {TREND_TYPES.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-xs">
            <span className="text-slate-400">Tag contains</span>
            <input className={field} onChange={(e) => setTagFilter(e.target.value)} value={tagFilter} />
          </label>
        </div>
      </ControlPanel>

      <div className="grid gap-4 lg:grid-cols-2">
        <ControlPanel className="p-4">
          <div className="flex items-center gap-2">
            <LineChart className="h-4 w-4 text-sky-400" />
            <p className="text-sm font-semibold text-slate-100">Trend signals</p>
          </div>
          {trends.length === 0 ? (
            <p className="mt-3 text-xs text-slate-500">
              No trend signals yet. Add a manual trend signal to start tracking short-form ideas, meme formats, platform patterns, or social hooks.
            </p>
          ) : (
            <div className="mt-3 max-h-[480px] space-y-2 overflow-y-auto">
              {trends.map((t) => (
                <button
                  className={cn(
                    "w-full rounded-lg border px-3 py-2 text-left text-xs transition",
                    selectedId === t.trendId ? "border-sky-500/50 bg-sky-950/30" : "border-slate-800 bg-slate-950/50 hover:border-slate-600",
                  )}
                  key={t.trendId}
                  onClick={() => setSelectedId(t.trendId)}
                  type="button"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-semibold text-slate-100">{t.title}</span>
                    <StatusBadge tone="gray">{labelForPlatform(t.platform)}</StatusBadge>
                  </div>
                  <p className="mt-1 text-slate-500">
                    {String(t.trendType ?? "—")} · {t.status} · brand {scoreBand(t.brandFitScore as number | undefined)} · risk{" "}
                    {scoreBand(t.riskScore as number | undefined)}
                  </p>
                  <p className="mt-1 line-clamp-2 text-slate-400">{(t.summary as string) ?? ""}</p>
                </button>
              ))}
            </div>
          )}
        </ControlPanel>

        <ControlPanel className="p-4">
          <p className="text-sm font-semibold text-slate-100">Detail &amp; adaptation</p>
          {!selectedId || !detail ? (
            <p className="mt-3 text-xs text-slate-500">Select a trend to edit scores, adaptation ideas, and library actions.</p>
          ) : (
            <div className="mt-3 space-y-3 text-xs">
              <p className="text-slate-500">
                Trend ID: <code className="text-sky-300">{selectedId}</code>
              </p>
              <div className="grid gap-2 md:grid-cols-2">
                <label className="grid gap-1">
                  <span className="text-slate-400">Title</span>
                  <input className={field} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} value={form.title} />
                </label>
                <label className="grid gap-1">
                  <span className="text-slate-400">Status</span>
                  <select className={field} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))} value={form.status}>
                    {TREND_STATUSES.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-1">
                  <span className="text-slate-400">Platform</span>
                  <select className={field} onChange={(e) => setForm((f) => ({ ...f, platform: e.target.value }))} value={form.platform}>
                    {TREND_PLATFORMS.map((p) => (
                      <option key={p.value} value={p.value}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-1">
                  <span className="text-slate-400">Trend type</span>
                  <select className={field} onChange={(e) => setForm((f) => ({ ...f, trendType: e.target.value }))} value={form.trendType}>
                    {TREND_TYPES.map((p) => (
                      <option key={p.value} value={p.value}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-1">
                  <span className="text-slate-400">Source system</span>
                  <select className={field} onChange={(e) => setForm((f) => ({ ...f, sourceSystem: e.target.value }))} value={form.sourceSystem}>
                    {SOURCE_SYSTEMS.map((p) => (
                      <option key={p.value} value={p.value}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-1">
                  <span className="text-slate-400">Timeliness</span>
                  <input className={field} onChange={(e) => setForm((f) => ({ ...f, timeliness: e.target.value }))} value={form.timeliness} />
                </label>
                <label className="grid gap-1 md:col-span-2">
                  <span className="text-slate-400">Summary</span>
                  <textarea className={field} onChange={(e) => setForm((f) => ({ ...f, summary: e.target.value }))} rows={3} value={form.summary} />
                </label>
                <label className="grid gap-1">
                  <span className="text-slate-400">Brand fit (0–100)</span>
                  <input className={field} onChange={(e) => setForm((f) => ({ ...f, brandFitScore: e.target.value }))} value={form.brandFitScore} />
                </label>
                <label className="grid gap-1">
                  <span className="text-slate-400">Risk (0–100)</span>
                  <input className={field} onChange={(e) => setForm((f) => ({ ...f, riskScore: e.target.value }))} value={form.riskScore} />
                </label>
                <label className="grid gap-1 md:col-span-2">
                  <span className="text-slate-400">Tags (one per line)</span>
                  <textarea className={field} onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))} rows={2} value={form.tags} />
                </label>
                <label className="grid gap-1 md:col-span-2">
                  <span className="text-slate-400">Adaptation ideas (one per line)</span>
                  <textarea className={field} onChange={(e) => setForm((f) => ({ ...f, adaptationIdeas: e.target.value }))} rows={3} value={form.adaptationIdeas} />
                </label>
                <label className="grid gap-1 md:col-span-2">
                  <span className="text-slate-400">Hook / caption / meme ideas (one per line each block combined)</span>
                  <textarea className={field} onChange={(e) => setForm((f) => ({ ...f, hookIdeas: e.target.value }))} placeholder="Hooks" rows={2} value={form.hookIdeas} />
                </label>
                <label className="grid gap-1 md:col-span-2">
                  <span className="text-slate-400">Creative brief notes (for Brandon / creative)</span>
                  <textarea className={field} onChange={(e) => setForm((f) => ({ ...f, creativeBriefNotes: e.target.value }))} rows={3} value={form.creativeBriefNotes} />
                </label>
                <label className="grid gap-1 md:col-span-2">
                  <span className="text-slate-400">Risk notes</span>
                  <textarea className={field} onChange={(e) => setForm((f) => ({ ...f, riskNotes: e.target.value }))} rows={2} value={form.riskNotes} />
                </label>
              </div>
              <div className="flex flex-wrap gap-2 border-t border-slate-800 pt-3">
                <button className={btnPrimary} onClick={() => void saveDetail()} type="button">
                  Save changes
                </button>
                <button
                  className={btnSecondary}
                  onClick={() => void updateStatus({ trendId: selectedId, status: "approved", reviewedBy: email ?? "operator" })}
                  type="button"
                >
                  Mark approved
                </button>
                <button className={btnSecondary} onClick={() => void updateStatus({ trendId: selectedId, status: "used" })} type="button">
                  Mark used
                </button>
                <button className={btnGhost} onClick={() => void updateStatus({ trendId: selectedId, status: "archived" })} type="button">
                  Archive
                </button>
              </div>
              <div className="grid gap-2 border-t border-slate-800 pt-3 md:grid-cols-2">
                <label className="grid gap-1">
                  <span className="text-slate-400">Link to campaign</span>
                  <select className={field} onChange={(e) => setForm((f) => ({ ...f, linkCampaignId: e.target.value }))} value={form.linkCampaignId ?? ""}>
                    <option value="">Select…</option>
                    {(campaigns ?? []).map((c: { campaignId: string; name: string }) => (
                      <option key={c.campaignId} value={c.campaignId}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="flex items-end">
                  <button
                    className={btnSecondary}
                    disabled={!form.linkCampaignId}
                    onClick={() => {
                      if (!form.linkCampaignId) return;
                      void linkCampaign({ trendId: selectedId, campaignId: form.linkCampaignId });
                    }}
                    type="button"
                  >
                    Link campaign
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <button className={btnSecondary} onClick={() => void saveSwipe({ trendId: selectedId })} type="button">
                  Save to Swipe File
                </button>
                <button className={btnSecondary} onClick={() => void savePlaybook({ trendId: selectedId })} type="button">
                  Save playbook candidate
                </button>
                <button className={btnSecondary} onClick={() => void saveLearning({ trendId: selectedId })} type="button">
                  Save learning candidate
                </button>
              </div>
              <p className="text-[0.65rem] text-slate-500">
                Library saves create candidate records with inspiration_only or explicit candidate status — never auto-approved.
              </p>
            </div>
          )}
        </ControlPanel>
      </div>

      <ControlPanel className="p-4">
        <p className="text-sm font-semibold text-slate-100">Trend Intelligence agents</p>
        <p className="mt-1 text-xs text-slate-500">Configured agents: {trendConfigs?.length ?? 0}. Dry-run / review-assist posture — no auto-post.</p>
        <ul className="mt-3 grid gap-2 md:grid-cols-2">
          {TREND_AGENTS.map((a) => (
            <li className="rounded-lg border border-slate-800 bg-slate-950/50 px-3 py-2 text-xs text-slate-300" key={a.id}>
              <span className="font-semibold text-slate-100">{a.name}</span>{" "}
              <StatusBadge tone="gray">{a.mode}</StatusBadge>
              <p className="mt-1 text-slate-500">{a.purpose}</p>
            </li>
          ))}
        </ul>
      </ControlPanel>

      <ControlPanel className="p-4">
        <p className="text-sm font-semibold text-slate-100">Recent trend research runs</p>
        {(researchRuns ?? []).length === 0 ? (
          <p className="mt-2 text-xs text-slate-500">No research runs yet. Dry run logs sessions without browsing the web.</p>
        ) : (
          <ul className="mt-2 space-y-2 text-xs text-slate-400">
            {(researchRuns ?? []).map((r: { runId: string; summary?: string; status: string; startedAt: number }) => (
              <li className="rounded border border-slate-800 px-2 py-1.5" key={r.runId}>
                <span className="font-mono text-sky-300">{r.runId}</span> · {r.status} · {new Date(r.startedAt).toLocaleString()}
                {r.summary ? <p className="mt-1 text-slate-500">{r.summary}</p> : null}
              </li>
            ))}
          </ul>
        )}
      </ControlPanel>

      <ControlPanel className="p-4">
        <div className="flex items-center gap-2">
          <ShieldAlert className="h-4 w-4 text-amber-300" />
          <p className="text-sm font-semibold text-slate-100">Copy Intelligence &amp; trust</p>
        </div>
        <p className="mt-2 text-xs text-slate-400">
          Approved or used trends can inform Copy Intelligence as trusted context later. Candidate trends stay optional inspiration. Rejected,
          archived, and stale trends should not feed automation unless explicitly reopened.
        </p>
      </ControlPanel>
    </div>
  );
}
