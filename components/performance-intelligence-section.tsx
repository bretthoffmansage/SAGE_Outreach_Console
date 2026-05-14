"use client";

import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAppUser } from "@/components/auth/app-user-context";
import {
  ConsoleTable,
  ControlPanel,
  SectionHeader,
  StatusBadge,
  TableHead,
  Td,
  Th,
} from "@/components/ui";
import { learningInsights } from "@/lib/data/demo-data";
import { cn } from "@/lib/utils";

const btnBase =
  "focus-ring inline-flex items-center justify-center gap-2 rounded-lg px-3.5 py-2 text-sm font-semibold transition disabled:opacity-60";
const btnPrimary = `${btnBase} border border-sky-500/60 bg-sky-500 text-slate-950 hover:bg-sky-400`;
const btnSecondary = `${btnBase} border border-slate-700 bg-slate-900 text-slate-100 hover:bg-slate-800`;

const FUTURE_INTEGRATIONS = [
  { name: "YouTube Analytics", mode: "Planned · read-only future" },
  { name: "Meta / Instagram / Facebook", mode: "Planned · read-only future" },
  { name: "Meta Ads / Meta connector", mode: "Planned · read-only future" },
  { name: "TikTok Analytics", mode: "Planned · read-only future" },
  { name: "X.com Analytics", mode: "Planned · read-only future" },
  { name: "Pinterest Analytics", mode: "Planned · read-only future" },
  { name: "Emailmarketing.com metrics", mode: "Planned · read-only future" },
  { name: "Keap / registration tracking", mode: "Planned · read-only future" },
  { name: "Google Analytics", mode: "Planned · read-only future" },
] as const;

const PLATFORMS = [
  "youtube",
  "youtube_shorts",
  "email",
  "facebook",
  "instagram",
  "meta",
  "meta_ads",
  "tiktok",
  "x",
  "pinterest",
  "linkedin",
  "keap",
  "landing_page",
  "registration_page",
  "mixed",
  "manual",
  "other",
] as const;

const CONTENT_TYPES = [
  "full_video",
  "short",
  "reel",
  "email",
  "email_sequence",
  "social_post",
  "meme",
  "carousel",
  "ad",
  "landing_page",
  "registration_page",
  "cta",
  "campaign_summary",
  "other",
] as const;

const SOURCE_SYSTEMS = [
  "manual",
  "demo",
  "import",
  "youtube_future",
  "meta_future",
  "meta_connector_future",
  "tiktok_future",
  "pinterest_future",
  "x_future",
  "emailmarketing_future",
  "keap_future",
  "google_analytics_future",
  "agent_generated",
] as const;

const METRIC_STATUSES = ["draft", "partial", "complete", "needs_review", "verified", "stale", "error"] as const;

const SOURCE_MODES = ["manual", "demo", "imported", "read_only_sync", "read_only_future", "estimated", "planned"] as const;

type SnapshotRow = Record<string, unknown> & {
  snapshotId: string;
  platform: string;
  metricDate: string;
  sourceSystem: string;
};

function nzStr(v: unknown): string {
  return typeof v === "string" ? v : "";
}

function nzNum(v: unknown): number {
  return typeof v === "number" && !Number.isNaN(v) ? v : 0;
}

function toneForStatus(s: string) {
  if (s === "verified" || s === "complete") return "green";
  if (s === "needs_review" || s === "partial" || s === "draft") return "amber";
  if (s === "error" || s === "stale") return "red";
  return "gray";
}

function toneForSource(s: string) {
  if (s === "demo") return "amber";
  if (s === "manual" || s === "import") return "blue";
  if (s.endsWith("_future")) return "gray";
  return "gray";
}

function titleCaseSnake(s: string): string {
  if (!s) return "";
  return s.replace(/_/g, " ").replace(/\b\w/g, (ch) => ch.toUpperCase());
}

function humanizePerformancePlatform(p: string): string {
  const k = p.trim().toLowerCase();
  const map: Record<string, string> = {
    meta_ads: "Meta Ads",
    instagram: "Instagram",
    facebook: "Facebook",
    meta: "Meta",
    youtube: "YouTube",
    youtube_shorts: "YouTube Shorts",
    email: "Email",
    tiktok: "TikTok",
    x: "X",
    pinterest: "Pinterest",
    linkedin: "LinkedIn",
    keap: "Keap",
    landing_page: "Landing page",
    registration_page: "Registration page",
    mixed: "Mixed",
    manual: "Manual",
    other: "Other",
  };
  return map[k] ?? titleCaseSnake(p);
}

function humanizeSourceOrModeLabel(s: string): string {
  const k = s.toLowerCase();
  if (k === "demo") return "Demo";
  if (k === "manual") return "Manual";
  if (k === "import" || k === "imported") return "Imported";
  if (k === "read_only_sync") return "Read-only sync";
  if (k === "read_only_future") return "Read-only future";
  if (k === "estimated") return "Estimated";
  if (k === "planned") return "Planned";
  if (k === "partial") return "Partial";
  if (k === "verified") return "Verified";
  if (k === "needs_review") return "Needs review";
  if (k === "complete") return "Complete";
  if (k === "draft") return "Draft";
  if (k === "stale") return "Stale";
  if (k === "error") return "Error";
  if (k.endsWith("_future")) {
    const base = k.replace(/_future$/, "");
    return `${titleCaseSnake(base)} (planned)`;
  }
  return titleCaseSnake(s);
}

function humanizeMetricStatusLabel(s: string): string {
  return humanizeSourceOrModeLabel(s);
}

function humanizeReviewStatusLabel(s: string): string {
  const k = s.toLowerCase();
  if (k === "approved") return "Approved";
  if (k === "draft") return "Draft";
  if (k === "pending") return "Pending";
  return titleCaseSnake(s);
}

function humanizeDataSourcesCell(raw: string): string {
  if (!raw.trim()) return "—";
  return raw
    .split(/[,;]/)
    .map((t) => t.trim())
    .filter(Boolean)
    .map(humanizeSourceOrModeLabel)
    .join(" · ");
}

function groupSum<T extends Record<string, unknown>>(
  rows: T[],
  key: string,
  sumKeys: string[],
): Array<{ label: string } & Record<string, number>> {
  const m = new Map<string, Record<string, number>>();
  for (const r of rows) {
    const k = nzStr(r[key]) || "(not set)";
    if (!m.has(k)) m.set(k, { n: 0 });
    const cur = m.get(k)!;
    cur.n += 1;
    for (const sk of sumKeys) {
      cur[sk] = (cur[sk] ?? 0) + nzNum(r[sk]);
    }
  }
  return [...m.entries()].map(([label, vals]) => ({ label, ...vals })) as Array<{ label: string } & Record<string, number>>;
}

export function PerformanceIntelligenceSection() {
  const searchParams = useSearchParams();
  const campaignFromUrl = searchParams.get("campaign")?.trim() ?? "";
  const snapshotFromUrl = searchParams.get("snapshot")?.trim() ?? "";
  const { email: operatorEmail } = useAppUser();

  const [campaignId, setCampaignId] = useState(campaignFromUrl);
  const [platform, setPlatform] = useState("");
  const [contentType, setContentType] = useState("");
  const [sourceSystem, setSourceSystem] = useState("");
  const [metricStatus, setMetricStatus] = useState("");
  const [dateStart, setDateStart] = useState("");
  const [dateEnd, setDateEnd] = useState("");
  const [search, setSearch] = useState("");

  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [saveError, setSaveError] = useState<string | null>(null);
  const [dryMessage, setDryMessage] = useState<string | null>(null);
  const [learningForm, setLearningForm] = useState({ title: "", summary: "", evidence: "", recommendation: "", confidence: "0.65" });

  const seededRef = useRef(false);
  const section10SeededRef = useRef(false);
  const agentsSeededRef = useRef(false);

  useEffect(() => {
    if (campaignFromUrl) setCampaignId(campaignFromUrl);
  }, [campaignFromUrl]);

  useEffect(() => {
    if (snapshotFromUrl) setSearch(snapshotFromUrl);
  }, [snapshotFromUrl]);

  const snapshotArgs = useMemo(
    () => ({
      campaignId: campaignId || undefined,
      platform: platform || undefined,
      contentType: contentType || undefined,
      sourceSystem: sourceSystem || undefined,
      metricStatus: metricStatus || undefined,
      dateRangeStart: dateStart || undefined,
      dateRangeEnd: dateEnd || undefined,
      search: search.trim() || undefined,
      limit: 500,
    }),
    [campaignId, platform, contentType, sourceSystem, metricStatus, dateStart, dateEnd, search],
  );

  const summaryFilter = useMemo(
    () => ({
      campaignId: campaignId || undefined,
      dateRangeStart: dateStart || undefined,
      dateRangeEnd: dateEnd || undefined,
    }),
    [campaignId, dateStart, dateEnd],
  );

  const snapshots = useQuery(api.performance.listPerformanceSnapshots, snapshotArgs);
  const campaignSummaries = useQuery(api.performance.listCampaignPerformanceSummary, summaryFilter);
  const platformSummaries = useQuery(api.performance.listPlatformPerformanceSummary, summaryFilter);
  const reviews = useQuery(api.performance.listPerformanceReviews, { campaignId: campaignId || undefined, limit: 25 });
  const perfLearnings = useQuery(api.performance.listLearningCandidatesFromPerformance);
  const campaigns = useQuery(api.campaigns.listCampaignRecords);
  const productionAssets = useQuery(api.productionAssets.listProductionAssets, { limit: 200 });
  const trendSignals = useQuery(api.trendSignals.listTrendSignals, { limit: 200 });

  const seedSnapshots = useMutation(api.performance.seedDefaultPerformanceSnapshotsIfEmpty);
  const seedSection10Snapshot = useMutation(api.performance.seedSection10MetaPerformanceSnapshotIfMissing);
  const seedAgents = useMutation(api.agents.seedPerformanceIntelligenceAgentsIfMissing);
  const upsertSnapshot = useMutation(api.performance.upsertPerformanceSnapshot);
  const deleteSnapshot = useMutation(api.performance.deletePerformanceSnapshot);
  const runDryRun = useMutation(api.performance.runPerformanceReviewDryRun);
  const createLearning = useMutation(api.performance.createLearningCandidateFromPerformance);

  useEffect(() => {
    if (seededRef.current) return;
    seededRef.current = true;
    void seedSnapshots({}).catch(() => {});
  }, [seedSnapshots]);

  useEffect(() => {
    if (agentsSeededRef.current) return;
    agentsSeededRef.current = true;
    void seedAgents({}).catch(() => {});
  }, [seedAgents]);

  useEffect(() => {
    if (section10SeededRef.current) return;
    section10SeededRef.current = true;
    void seedSection10Snapshot({}).catch(() => {});
  }, [seedSection10Snapshot]);

  const rows = (snapshots ?? []) as SnapshotRow[];

  const totals = useMemo(() => {
    let views = 0;
    let clicks = 0;
    let registrations = 0;
    let engagement = 0;
    const campaignsTracked = new Set<string>();
    let needsReview = 0;
    for (const r of rows) {
      views += nzNum(r.views) + nzNum(r.impressions);
      clicks += nzNum(r.clicks) + nzNum(r.emailClicks);
      registrations += nzNum(r.registrations);
      engagement += nzNum(r.engagement) || nzNum(r.likes) + nzNum(r.comments) + nzNum(r.shares) + nzNum(r.saves);
      if (r.campaignId) campaignsTracked.add(nzStr(r.campaignId));
      if (r.metricStatus === "needs_review" || r.metricStatus === "draft" || r.metricStatus === "partial") needsReview += 1;
    }
    const topPlat = [...(platformSummaries ?? [])].sort((a, b) => nzNum(b.viewsOrImpressions) - nzNum(a.viewsOrImpressions))[0];
    const topics = groupSum(rows, "topicLabel", ["views", "clicks", "registrations"]).sort((a, b) => nzNum(b.views) - nzNum(a.views));
    const hooks = groupSum(rows, "hookLabel", ["views", "clicks"]).sort((a, b) => nzNum(b.views) - nzNum(a.views));
    const ctas = groupSum(rows, "ctaLabel", ["clicks", "registrations"]).sort((a, b) => nzNum(b.clicks) - nzNum(a.clicks));
    return {
      views,
      clicks,
      registrations,
      engagement,
      campaignsTracked: campaignsTracked.size,
      needsReview,
      topPlatform: humanizePerformancePlatform(nzStr(topPlat?.platform)) || "—",
      bestTopic: topics[0]?.label ?? "—",
      bestHook: hooks[0]?.label ?? "—",
      bestCta: ctas[0]?.label ?? "—",
      topicRows: topics.slice(0, 8),
      hookRows: hooks.slice(0, 8),
      ctaRows: ctas.slice(0, 8),
      contentTypeRows: groupSum(rows, "contentType", ["views", "clicks"]).slice(0, 10),
    };
  }, [rows, platformSummaries]);

  const metaSlice = useMemo(() => {
    const set = new Set(["meta", "facebook", "instagram", "meta_ads"]);
    return rows.filter((r) => set.has(r.platform));
  }, [rows]);

  const metaTotals = useMemo(() => {
    let reach = 0;
    let clicks = 0;
    let engagement = 0;
    let registrations = 0;
    let spend = 0;
    let snapCount = 0;
    const sourceHints = new Set<string>();
    for (const r of metaSlice) {
      snapCount += 1;
      reach += nzNum(r.reach) + nzNum(r.impressions);
      clicks += nzNum(r.clicks);
      engagement += nzNum(r.engagement) || nzNum(r.likes) + nzNum(r.comments) + nzNum(r.shares) + nzNum(r.saves);
      registrations += nzNum(r.registrations);
      spend += nzNum(r.spend);
      if (r.sourceMode) sourceHints.add(humanizeSourceOrModeLabel(nzStr(r.sourceMode)));
      if (r.sourceSystem) sourceHints.add(humanizeSourceOrModeLabel(nzStr(r.sourceSystem)));
    }
    return { snapCount, reach, clicks, engagement, registrations, spend, sourceHints: [...sourceHints].join(", ") || "—" };
  }, [metaSlice]);

  const openNew = useCallback(() => {
    setEditingId(null);
    setSaveError(null);
    setForm({
      campaignId: campaignId || "",
      platform: "youtube",
      contentType: "full_video",
      contentTitle: "",
      contentUrl: "",
      metricDate: new Date().toISOString().slice(0, 10),
      sourceSystem: "manual",
      sourceMode: "manual",
      metricStatus: "partial",
      views: "",
      impressions: "",
      clicks: "",
      registrations: "",
      engagement: "",
      opens: "",
      openRate: "",
      emailClicks: "",
      emailClickRate: "",
      likes: "",
      comments: "",
      shares: "",
      saves: "",
      spend: "",
      costPerClick: "",
      costPerRegistration: "",
      hookLabel: "",
      topicLabel: "",
      ctaLabel: "",
      audienceLabel: "",
      copyVariantLabel: "",
      creativeVariantLabel: "",
      campaignLabel: "",
      adSetLabel: "",
      adLabel: "",
      placementLabel: "",
      objectiveLabel: "",
      productionAssetId: "",
      trendId: "",
      notes: "",
    });
    setEditorOpen(true);
  }, [campaignId]);

  const openEdit = useCallback((row: SnapshotRow) => {
    setEditingId(row.snapshotId);
    setSaveError(null);
    const f: Record<string, string> = {};
    const keys = [
      "campaignId",
      "campaignName",
      "platform",
      "contentType",
      "contentTitle",
      "contentUrl",
      "metricDate",
      "sourceSystem",
      "sourceMode",
      "metricStatus",
      "impressions",
      "reach",
      "views",
      "clicks",
      "clickThroughRate",
      "registrations",
      "opens",
      "openRate",
      "emailClicks",
      "emailClickRate",
      "likes",
      "comments",
      "shares",
      "saves",
      "engagement",
      "spend",
      "costPerClick",
      "costPerRegistration",
      "hookLabel",
      "topicLabel",
      "ctaLabel",
      "audienceLabel",
      "copyVariantLabel",
      "creativeVariantLabel",
      "campaignLabel",
      "adSetLabel",
      "adLabel",
      "placementLabel",
      "objectiveLabel",
      "productionAssetId",
      "trendId",
      "libraryRecordId",
      "notes",
    ] as const;
    for (const k of keys) {
      const v = row[k];
      f[k] = typeof v === "number" ? String(v) : typeof v === "string" ? v : "";
    }
    setForm(f);
    setEditorOpen(true);
  }, []);

  const parsePatch = useCallback(() => {
    const num = (s: string) => {
      const t = s.trim();
      if (!t) return undefined;
      const n = Number(t);
      return Number.isFinite(n) ? n : undefined;
    };
    const patch: Record<string, unknown> = {
      platform: form.platform?.trim(),
      metricDate: form.metricDate?.trim(),
      sourceSystem: form.sourceSystem?.trim(),
      sourceMode: form.sourceMode?.trim() || undefined,
      metricStatus: form.metricStatus?.trim() || undefined,
      contentType: form.contentType?.trim() || undefined,
      contentTitle: form.contentTitle?.trim() || undefined,
      contentUrl: form.contentUrl?.trim() || undefined,
      campaignId: form.campaignId?.trim() || undefined,
      campaignName: form.campaignName?.trim() || undefined,
      hookLabel: form.hookLabel?.trim() || undefined,
      topicLabel: form.topicLabel?.trim() || undefined,
      ctaLabel: form.ctaLabel?.trim() || undefined,
      audienceLabel: form.audienceLabel?.trim() || undefined,
      copyVariantLabel: form.copyVariantLabel?.trim() || undefined,
      creativeVariantLabel: form.creativeVariantLabel?.trim() || undefined,
      campaignLabel: form.campaignLabel?.trim() || undefined,
      adSetLabel: form.adSetLabel?.trim() || undefined,
      adLabel: form.adLabel?.trim() || undefined,
      placementLabel: form.placementLabel?.trim() || undefined,
      objectiveLabel: form.objectiveLabel?.trim() || undefined,
      productionAssetId: form.productionAssetId?.trim() || undefined,
      trendId: form.trendId?.trim() || undefined,
      libraryRecordId: form.libraryRecordId?.trim() || undefined,
      notes: form.notes?.trim() || undefined,
    };
    const nkeys = [
      "impressions",
      "reach",
      "views",
      "clicks",
      "clickThroughRate",
      "registrations",
      "opens",
      "openRate",
      "emailClicks",
      "emailClickRate",
      "likes",
      "comments",
      "shares",
      "saves",
      "engagement",
      "spend",
      "costPerClick",
      "costPerRegistration",
    ] as const;
    for (const k of nkeys) {
      const v = num(form[k] ?? "");
      if (v !== undefined) patch[k] = v;
    }
    const cid = nzStr(patch.campaignId);
    if (cid && campaigns?.length) {
      const c = campaigns.find((x: { campaignId: string }) => x.campaignId === cid);
      if (c?.name) patch.campaignName = c.name;
    }
    return patch;
  }, [form, campaigns]);

  const saveSnapshot = async () => {
    setSaveError(null);
    try {
      const patch = parsePatch();
      if (!nzStr(patch.platform) || !nzStr(patch.metricDate) || !nzStr(patch.sourceSystem)) {
        setSaveError("Platform, metric date, and source system are required.");
        return;
      }
      const hasMetric =
        nzNum(patch.views) +
          nzNum(patch.impressions) +
          nzNum(patch.clicks) +
          nzNum(patch.registrations) +
          nzNum(patch.engagement) +
          nzNum(patch.opens) >
        0;
      if (!hasMetric && !nzStr(patch.notes)) {
        setSaveError("Add at least one metric or notes (partial data is allowed).");
        return;
      }
      await upsertSnapshot({ snapshotId: editingId ?? undefined, patch });
      setEditorOpen(false);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Save failed");
    }
  };

  const runDry = async () => {
    setDryMessage(null);
    try {
      const res = await runDryRun({
        campaignId: campaignId || undefined,
        dateRangeStart: dateStart || undefined,
        dateRangeEnd: dateEnd || undefined,
        platform: platform || undefined,
        createdBy: operatorEmail || undefined,
      });
      setDryMessage(`Dry run saved as review ${res.reviewId}. Run ${res.runId}.`);
    } catch (e) {
      setDryMessage(e instanceof Error ? e.message : "Dry run failed");
    }
  };

  const submitLearning = async () => {
    try {
      await createLearning({
        title: learningForm.title.trim(),
        summary: learningForm.summary.trim(),
        evidence: learningForm.evidence.trim(),
        recommendation: learningForm.recommendation.trim(),
        confidence: Number(learningForm.confidence) || 0.5,
        relatedCampaignId: campaignId || undefined,
        relatedPlatform: platform || undefined,
        relatedContentType: contentType || undefined,
        snapshotIds: editingId ? [editingId] : undefined,
      });
      setLearningForm({ title: "", summary: "", evidence: "", recommendation: "", confidence: "0.65" });
    } catch {
      /* keep form */
    }
  };

  const inputClass =
    "w-full rounded-md border border-slate-700 bg-slate-950/90 px-3 py-2 text-sm text-slate-100 outline-none placeholder:text-slate-500";

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <SectionHeader
        eyebrow="Performance Intelligence"
        title="Performance Intelligence"
        description="Track campaign results, compare launch patterns, and turn performance evidence into reviewable campaign learnings."
      />

      <div className="flex flex-wrap gap-2">
        <StatusBadge tone="amber">Manual metrics</StatusBadge>
        <StatusBadge tone="gray">Read-only integrations planned</StatusBadge>
        <StatusBadge tone="blue">Human-reviewed learnings</StatusBadge>
      </div>

      <ControlPanel className="border-amber-900/40 bg-amber-950/20 p-4">
        <p className="text-sm font-semibold text-amber-100">Data source notice</p>
        <p className="mt-2 text-sm leading-relaxed text-slate-300">
          Performance data may be manual, demo, or imported until platform integrations are connected. Use source labels to distinguish verified data from
          placeholders. This page does not call live analytics APIs.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-slate-300">
          Meta, Facebook, Instagram, and Meta Ads data can be entered manually today. Future read-only connector support can pull insights into Performance
          Intelligence. Write actions such as ad creation, campaign edits, and budget changes are not enabled.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-slate-400">
          Source labels, snapshot rows, and learning candidates are not trusted until reviewed and approved in Campaign Learnings.
        </p>
      </ControlPanel>

      <ControlPanel className="p-4">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Filters</p>
        <div className="mt-3 grid gap-3 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
          <label className="grid gap-1 text-sm">
            <span className="text-slate-400">Campaign</span>
            <select className={inputClass} onChange={(e) => setCampaignId(e.target.value)} value={campaignId}>
              <option value="">All campaigns</option>
              {(campaigns ?? []).map((c: { campaignId: string; name: string }) => (
                <option key={c.campaignId} value={c.campaignId}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-sm">
            <span className="text-slate-400">Platform</span>
            <select className={inputClass} onChange={(e) => setPlatform(e.target.value)} value={platform}>
              <option value="">All</option>
              {PLATFORMS.map((p) => (
                <option key={p} value={p}>
                  {humanizePerformancePlatform(p)}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-sm">
            <span className="text-slate-400">Content type</span>
            <select className={inputClass} onChange={(e) => setContentType(e.target.value)} value={contentType}>
              <option value="">All</option>
              {CONTENT_TYPES.map((p) => (
                <option key={p} value={p}>
                  {titleCaseSnake(p)}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-sm">
            <span className="text-slate-400">Source system</span>
            <select className={inputClass} onChange={(e) => setSourceSystem(e.target.value)} value={sourceSystem}>
              <option value="">All</option>
              {SOURCE_SYSTEMS.map((p) => (
                <option key={p} value={p}>
                  {humanizeSourceOrModeLabel(p)}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-sm">
            <span className="text-slate-400">Metric status</span>
            <select className={inputClass} onChange={(e) => setMetricStatus(e.target.value)} value={metricStatus}>
              <option value="">All</option>
              {METRIC_STATUSES.map((p) => (
                <option key={p} value={p}>
                  {humanizeMetricStatusLabel(p)}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-sm">
            <span className="text-slate-400">Search</span>
            <input className={inputClass} onChange={(e) => setSearch(e.target.value)} placeholder="Title, notes, labels…" value={search} />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="text-slate-400">Date from</span>
            <input className={inputClass} onChange={(e) => setDateStart(e.target.value)} type="date" value={dateStart} />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="text-slate-400">Date to</span>
            <input className={inputClass} onChange={(e) => setDateEnd(e.target.value)} type="date" value={dateEnd} />
          </label>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <button className={btnPrimary} onClick={() => void openNew()} type="button">
            Add Performance Snapshot
          </button>
          <button className={btnSecondary} onClick={() => void runDry()} type="button">
            Run performance review dry-run
          </button>
        </div>
        <p className="mt-3 text-xs leading-relaxed text-slate-500">
          Future connectors and Copy Intelligence can use reviewed performance signals once approved — use the Intelligence tab bar to open those views when
          needed.
        </p>
        {dryMessage ? <p className="mt-2 text-sm text-slate-400">{dryMessage}</p> : null}
      </ControlPanel>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
        <ControlPanel className="p-3">
          <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Campaigns tracked</p>
          <p className="mt-1 text-xl font-semibold text-slate-100">{totals.campaignsTracked || "—"}</p>
        </ControlPanel>
        <ControlPanel className="p-3">
          <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Total views / impressions</p>
          <p className="mt-1 text-xl font-semibold text-slate-100">{rows.length ? totals.views : "—"}</p>
        </ControlPanel>
        <ControlPanel className="p-3">
          <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Total clicks + email clicks</p>
          <p className="mt-1 text-xl font-semibold text-slate-100">{rows.length ? totals.clicks : "—"}</p>
        </ControlPanel>
        <ControlPanel className="p-3">
          <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Registrations</p>
          <p className="mt-1 text-xl font-semibold text-slate-100">{rows.length ? totals.registrations : "—"}</p>
        </ControlPanel>
        <ControlPanel className="p-3">
          <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Top platform (by views)</p>
          <p className="mt-1 text-lg font-semibold text-sky-200">{totals.topPlatform}</p>
        </ControlPanel>
        <ControlPanel className="p-3">
          <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Best topic label</p>
          <p className="mt-1 text-sm font-semibold text-slate-100">{totals.bestTopic}</p>
        </ControlPanel>
        <ControlPanel className="p-3">
          <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Best hook label</p>
          <p className="mt-1 text-sm font-semibold text-slate-100">{totals.bestHook}</p>
        </ControlPanel>
        <ControlPanel className="p-3">
          <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Best CTA label</p>
          <p className="mt-1 text-sm font-semibold text-slate-100">{totals.bestCta}</p>
        </ControlPanel>
        <ControlPanel className="p-3">
          <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Needs review (in view)</p>
          <p className="mt-1 text-xl font-semibold text-amber-200">{totals.needsReview}</p>
        </ControlPanel>
        <ControlPanel className="p-3">
          <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Library learning candidates (demo)</p>
          <p className="mt-1 text-xl font-semibold text-violet-200">{learningInsights.length}</p>
          <p className="mt-1 text-[0.65rem] text-slate-500">Plus Convex candidates below</p>
        </ControlPanel>
      </section>

      <ControlPanel className="p-4">
        <p className="text-sm font-semibold text-slate-100">Meta / Instagram / Facebook (manual slice)</p>
        <p className="mt-1 text-xs text-slate-500">
          Aggregates snapshots whose platform is Meta, Facebook, Instagram, or Meta Ads in this view — not a live connector.
        </p>
        {metaTotals.snapCount === 0 ? (
          <p className="mt-3 text-sm text-slate-400">No Meta performance snapshots yet in the current filters.</p>
        ) : (
          <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs uppercase tracking-wide text-slate-500">Manual snapshots</dt>
              <dd className="text-lg font-semibold text-slate-100">{metaTotals.snapCount}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-slate-500">Source labels (modes / systems)</dt>
              <dd className="text-slate-300">{metaTotals.sourceHints}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-slate-500">Reach + impressions</dt>
              <dd className="text-lg font-semibold text-slate-100">{metaTotals.reach}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-slate-500">Clicks</dt>
              <dd className="text-lg font-semibold text-slate-100">{metaTotals.clicks}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-slate-500">Engagement (stored or derived)</dt>
              <dd className="text-lg font-semibold text-slate-100">{metaTotals.engagement}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-slate-500">Registrations</dt>
              <dd className="text-lg font-semibold text-slate-100">{metaTotals.registrations}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-xs uppercase tracking-wide text-slate-500">Spend (if entered)</dt>
              <dd className="text-lg font-semibold text-slate-100">{metaTotals.spend > 0 ? metaTotals.spend : "—"}</dd>
            </div>
          </dl>
        )}
      </ControlPanel>

      <div className="grid gap-4 xl:grid-cols-2">
        <ControlPanel className="p-4">
          <p className="text-sm font-semibold text-slate-100">Platform performance</p>
          <p className="mt-1 text-xs text-slate-500">Aggregates respect current campaign / date filters.</p>
          <ConsoleTable className="mt-3">
            <TableHead>
              <tr>
                <Th>Platform</Th>
                <Th>Count</Th>
                <Th>Views / impr.</Th>
                <Th>Clicks</Th>
                <Th>Regs</Th>
                <Th>Engagement</Th>
                <Th>Sources</Th>
              </tr>
            </TableHead>
            <tbody>
              {(platformSummaries ?? []).length ? (
                (platformSummaries ?? []).map((p: Record<string, unknown>) => (
                  <tr key={nzStr(p.platform)}>
                    <Td>{humanizePerformancePlatform(nzStr(p.platform))}</Td>
                    <Td>{nzNum(p.contentCount)}</Td>
                    <Td>{nzNum(p.viewsOrImpressions)}</Td>
                    <Td>{nzNum(p.clicks)}</Td>
                    <Td>{nzNum(p.registrations)}</Td>
                    <Td>{nzNum(p.engagement)}</Td>
                    <Td className="max-w-[12rem] whitespace-normal text-xs text-slate-400">{humanizeDataSourcesCell(nzStr(p.dataSources))}</Td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="border-t border-slate-800 px-4 py-3 align-top text-slate-200" colSpan={7}>
                    <p className="text-sm text-slate-400">No performance snapshots yet.</p>
                    <p className="mt-1 text-xs text-slate-500">Add manual snapshots in this view to populate aggregates. Planned read-only connectors are not wired in this build.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </ConsoleTable>
        </ControlPanel>

        <ControlPanel className="p-4">
          <p className="text-sm font-semibold text-slate-100">Campaign comparison</p>
          <p className="mt-1 text-xs text-slate-500">Weekly launch packets — totals from snapshots in filter scope.</p>
          <ConsoleTable className="mt-3">
            <TableHead>
              <tr>
                <Th>Campaign</Th>
                <Th>Publish</Th>
                <Th>Views</Th>
                <Th>Clicks</Th>
                <Th>Regs</Th>
                <Th>Top platform</Th>
              </tr>
            </TableHead>
            <tbody>
              {(campaignSummaries ?? []).filter((c: Record<string, unknown>) => nzStr(c.campaignId)).length ? (
                (campaignSummaries ?? [])
                  .filter((c: Record<string, unknown>) => nzStr(c.campaignId))
                  .map((c: Record<string, unknown>) => (
                    <tr key={nzStr(c.campaignId)}>
                      <Td>{nzStr(c.campaignName) || nzStr(c.campaignId)}</Td>
                      <Td className="text-xs text-slate-400">{nzStr(c.publishDate) || "—"}</Td>
                      <Td>{nzNum(c.totalViews)}</Td>
                      <Td>{nzNum(c.totalClicks) + nzNum(c.totalEmailClicks)}</Td>
                      <Td>{nzNum(c.totalRegistrations)}</Td>
                      <Td className="text-xs">{humanizePerformancePlatform(nzStr(c.topPlatformByViews)) || "—"}</Td>
                    </tr>
                  ))
              ) : (
                <tr>
                  <td className="border-t border-slate-800 px-4 py-3 align-top text-slate-200" colSpan={6}>
                    <p className="text-sm text-slate-400">No linked campaign aggregates yet.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </ConsoleTable>
        </ControlPanel>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <ControlPanel className="p-4">
          <p className="text-sm font-semibold text-slate-100">Topic · hook · CTA comparison</p>
          <div className="mt-3 grid gap-4 lg:grid-cols-3">
            <div>
              <p className="text-xs font-bold uppercase text-slate-500">Topics</p>
              <ul className="mt-2 space-y-1 text-sm text-slate-300">
                {totals.topicRows.length ? totals.topicRows.map((t) => <li key={t.label}>{t.label}: views {Math.round(t.views ?? 0)}</li>) : <li>—</li>}
              </ul>
            </div>
            <div>
              <p className="text-xs font-bold uppercase text-slate-500">Hooks</p>
              <ul className="mt-2 space-y-1 text-sm text-slate-300">
                {totals.hookRows.length ? totals.hookRows.map((t) => <li key={t.label}>{t.label}: views {Math.round(t.views ?? 0)}</li>) : <li>—</li>}
              </ul>
            </div>
            <div>
              <p className="text-xs font-bold uppercase text-slate-500">CTAs</p>
              <ul className="mt-2 space-y-1 text-sm text-slate-300">
                {totals.ctaRows.length ? totals.ctaRows.map((t) => <li key={t.label}>{t.label}: clicks {Math.round(t.clicks ?? 0)}</li>) : <li>—</li>}
              </ul>
            </div>
          </div>
          <p className="mt-3 text-xs text-slate-500">
            Content types:{" "}
            {totals.contentTypeRows.map((r) => `${titleCaseSnake(r.label)} (${Math.round(r.views ?? 0)} views)`).join(" · ") || "—"}
          </p>
        </ControlPanel>

        <ControlPanel className="p-4">
          <p className="text-sm font-semibold text-slate-100">Performance reviews</p>
          <p className="mt-1 text-xs text-slate-500">Includes demo review and dry-run outputs. No external calls.</p>
          <ul className="mt-3 max-h-56 space-y-2 overflow-y-auto text-sm">
            {(reviews ?? []).map((r: Record<string, unknown>) => (
              <li className="rounded border border-slate-800 bg-slate-950/50 p-2" key={nzStr(r.reviewId)}>
                <p className="font-medium text-slate-200">{titleCaseSnake(nzStr(r.reviewType))}</p>
                <p className="text-xs text-slate-500">{nzStr(r.campaignName) || nzStr(r.campaignId) || "All campaigns"}</p>
                <p className="mt-1 text-xs text-slate-400 line-clamp-2">{nzStr(r.summary)}</p>
                <div className="mt-1 flex flex-wrap gap-1">
                  <StatusBadge tone={r.status === "approved" ? "green" : "amber"}>{humanizeReviewStatusLabel(nzStr(r.status))}</StatusBadge>
                  {r.sourceMode ? <StatusBadge tone="gray">{humanizeSourceOrModeLabel(nzStr(r.sourceMode))}</StatusBadge> : null}
                </div>
              </li>
            ))}
          </ul>
        </ControlPanel>
      </div>

      <ControlPanel className="p-4">
        <p className="text-sm font-semibold text-slate-100">Performance snapshots</p>
        {snapshots === undefined ? (
          <p className="mt-2 text-sm text-slate-400">Loading…</p>
        ) : !rows.length ? (
          <p className="mt-2 text-sm text-slate-400">
            No performance snapshots yet. Add manual entries with &quot;Add Performance Snapshot&quot; to build this table.
          </p>
        ) : (
          <ConsoleTable className="mt-3">
            <TableHead>
              <tr>
                <Th>Title</Th>
                <Th>Campaign</Th>
                <Th>Platform</Th>
                <Th>Date</Th>
                <Th>Key metrics</Th>
                <Th>Source</Th>
                <Th>Status</Th>
                <Th>Action</Th>
              </tr>
            </TableHead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.snapshotId}>
                  <Td className="max-w-[14rem] whitespace-normal">{nzStr(r.contentTitle) || r.snapshotId}</Td>
                  <Td className="text-xs">{nzStr(r.campaignName) || nzStr(r.campaignId) || "—"}</Td>
                  <Td>{humanizePerformancePlatform(nzStr(r.platform))}</Td>
                  <Td className="text-xs">{r.metricDate}</Td>
                  <Td className="max-w-[12rem] whitespace-normal text-xs text-slate-400">
                    v:{nzNum(r.views) || nzNum(r.impressions)} · clk:{nzNum(r.clicks) + nzNum(r.emailClicks)} · reg:{nzNum(r.registrations)}
                  </Td>
                  <Td>
                    <StatusBadge tone={toneForSource(nzStr(r.sourceSystem))}>{humanizeSourceOrModeLabel(nzStr(r.sourceSystem))}</StatusBadge>
                  </Td>
                  <Td>
                    <StatusBadge tone={toneForStatus(nzStr(r.metricStatus))}>
                      {humanizeMetricStatusLabel(nzStr(r.metricStatus) || "unset")}
                    </StatusBadge>
                  </Td>
                  <Td>
                    <button className="text-sky-300 hover:underline" onClick={() => openEdit(r)} type="button">
                      Edit
                    </button>
                  </Td>
                </tr>
              ))}
            </tbody>
          </ConsoleTable>
        )}
      </ControlPanel>

      <div className="grid gap-4 xl:grid-cols-2">
        <ControlPanel className="p-4">
          <p className="text-sm font-semibold text-slate-100">Learning candidates from performance</p>
          <p className="mt-1 text-xs text-slate-400">Drafts sourced from snapshots and dry-runs — keep separate from approved playbook learnings.</p>
          <ul className="mt-3 space-y-2 text-sm text-slate-300">
            {(perfLearnings ?? []).map((l: Record<string, unknown>) => (
              <li className="rounded border border-slate-800/80 p-2" key={nzStr(l.recordId)}>
                <p className="font-medium">{nzStr(l.title)}</p>
                <p className="text-xs text-slate-500">{nzStr(l.summary)}</p>
              </li>
            ))}
          </ul>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <p className="text-xs font-bold uppercase text-slate-500 sm:col-span-2">Create learning candidate</p>
            <p className="text-xs leading-relaxed text-slate-500 sm:col-span-2">
              Learning candidates are not trusted until reviewed and approved in Campaign Learnings.
            </p>
            <input className={inputClass} onChange={(e) => setLearningForm((s) => ({ ...s, title: e.target.value }))} placeholder="Title" value={learningForm.title} />
            <textarea
              className={cn(inputClass, "min-h-[3.5rem] sm:col-span-2")}
              onChange={(e) => setLearningForm((s) => ({ ...s, summary: e.target.value }))}
              placeholder="Summary"
              value={learningForm.summary}
            />
            <textarea
              className={cn(inputClass, "min-h-[3.5rem] sm:col-span-2")}
              onChange={(e) => setLearningForm((s) => ({ ...s, evidence: e.target.value }))}
              placeholder="Evidence"
              value={learningForm.evidence}
            />
            <textarea
              className={cn(inputClass, "min-h-[3.5rem] sm:col-span-2")}
              onChange={(e) => setLearningForm((s) => ({ ...s, recommendation: e.target.value }))}
              placeholder="Recommendation"
              value={learningForm.recommendation}
            />
            <input className={inputClass} onChange={(e) => setLearningForm((s) => ({ ...s, confidence: e.target.value }))} placeholder="Confidence (0–1)" value={learningForm.confidence} />
            <div className="flex flex-wrap items-center gap-2 sm:col-span-2">
              <button className={btnSecondary} onClick={() => void submitLearning()} type="button">
                Save as Campaign Learning Candidate
              </button>
            </div>
            <p className="text-xs text-slate-500 sm:col-span-2">
              When ready, open Libraries → Campaign Learnings from the main navigation to review and promote candidates.
            </p>
          </div>
        </ControlPanel>

        <ControlPanel className="p-4">
          <p className="text-sm font-semibold text-slate-100">Copy Intelligence relationship</p>
          <p className="mt-2 text-sm leading-relaxed text-slate-300">
            Approved performance learnings can inform future hooks, CTAs, topics, and platform tone in Copy Intelligence. Candidates stay optional until promoted
            in Campaign Learnings.
          </p>
          <p className="mt-3 text-sm font-semibold text-slate-100">Evidence links</p>
          <p className="mt-2 text-sm text-slate-400">
            Snapshots can reference <code className="text-slate-300">trendId</code> and <code className="text-slate-300">productionAssetId</code> for evidence
            trails. Trend performance rollups remain minimal in v1.
          </p>
        </ControlPanel>
      </div>

      <details className="overflow-hidden rounded-lg border border-slate-800 bg-slate-950/50">
        <summary className="cursor-pointer list-none px-4 py-3 text-sm font-semibold text-slate-200 marker:content-none hover:bg-slate-900/60 [&::-webkit-details-marker]:hidden">
          Planned read-only integrations <span className="font-normal text-slate-500">(expand)</span>
        </summary>
        <div className="border-t border-slate-800 px-4 py-3">
          <p className="text-xs text-slate-500">Not connected in this build.</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {FUTURE_INTEGRATIONS.map((row) => (
              <div className="rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2" key={row.name}>
                <p className="text-sm text-slate-200">{row.name}</p>
                <p className="mt-1 text-xs text-slate-500">{row.mode}</p>
              </div>
            ))}
          </div>
        </div>
      </details>

      {editorOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-slate-700 bg-slate-950 p-5 shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <p className="text-lg font-semibold text-slate-100">{editingId ? "Edit snapshot" : "Add Performance Snapshot"}</p>
              <button className="text-slate-400 hover:text-slate-200" onClick={() => setEditorOpen(false)} type="button">
                Close
              </button>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="grid gap-1 text-sm sm:col-span-2">
                <span className="text-slate-400">Campaign</span>
                <select className={inputClass} onChange={(e) => setForm((f) => ({ ...f, campaignId: e.target.value }))} value={form.campaignId ?? ""}>
                  <option value="">Not linked</option>
                  {(campaigns ?? []).map((c: { campaignId: string; name: string }) => (
                    <option key={c.campaignId} value={c.campaignId}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-1 text-sm">
                <span className="text-slate-400">Platform *</span>
                <select className={inputClass} onChange={(e) => setForm((f) => ({ ...f, platform: e.target.value }))} value={form.platform ?? ""}>
                  {PLATFORMS.map((p) => (
                    <option key={p} value={p}>
                      {humanizePerformancePlatform(p)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-1 text-sm">
                <span className="text-slate-400">Content type</span>
                <select className={inputClass} onChange={(e) => setForm((f) => ({ ...f, contentType: e.target.value }))} value={form.contentType ?? ""}>
                  {CONTENT_TYPES.map((p) => (
                    <option key={p} value={p}>
                      {titleCaseSnake(p)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-1 text-sm sm:col-span-2">
                <span className="text-slate-400">Content title</span>
                <input className={inputClass} onChange={(e) => setForm((f) => ({ ...f, contentTitle: e.target.value }))} value={form.contentTitle ?? ""} />
              </label>
              <label className="grid gap-1 text-sm sm:col-span-2">
                <span className="text-slate-400">Content URL</span>
                <input className={inputClass} onChange={(e) => setForm((f) => ({ ...f, contentUrl: e.target.value }))} value={form.contentUrl ?? ""} />
              </label>
              <label className="grid gap-1 text-sm">
                <span className="text-slate-400">Metric date *</span>
                <input className={inputClass} onChange={(e) => setForm((f) => ({ ...f, metricDate: e.target.value }))} type="date" value={form.metricDate ?? ""} />
              </label>
              <label className="grid gap-1 text-sm">
                <span className="text-slate-400">Source system *</span>
                <select className={inputClass} onChange={(e) => setForm((f) => ({ ...f, sourceSystem: e.target.value }))} value={form.sourceSystem ?? ""}>
                  {SOURCE_SYSTEMS.map((p) => (
                    <option key={p} value={p}>
                      {humanizeSourceOrModeLabel(p)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-1 text-sm">
                <span className="text-slate-400">Source mode</span>
                <select className={inputClass} onChange={(e) => setForm((f) => ({ ...f, sourceMode: e.target.value }))} value={form.sourceMode ?? ""}>
                  {SOURCE_MODES.map((p) => (
                    <option key={p} value={p}>
                      {humanizeSourceOrModeLabel(p)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-1 text-sm">
                <span className="text-slate-400">Metric status</span>
                <select className={inputClass} onChange={(e) => setForm((f) => ({ ...f, metricStatus: e.target.value }))} value={form.metricStatus ?? ""}>
                  {METRIC_STATUSES.map((p) => (
                    <option key={p} value={p}>
                      {humanizeMetricStatusLabel(p)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-1 text-sm">
                <span className="text-slate-400">Views</span>
                <input className={inputClass} inputMode="numeric" onChange={(e) => setForm((f) => ({ ...f, views: e.target.value }))} value={form.views ?? ""} />
              </label>
              <label className="grid gap-1 text-sm">
                <span className="text-slate-400">Impressions</span>
                <input className={inputClass} inputMode="numeric" onChange={(e) => setForm((f) => ({ ...f, impressions: e.target.value }))} value={form.impressions ?? ""} />
              </label>
              <label className="grid gap-1 text-sm">
                <span className="text-slate-400">Clicks</span>
                <input className={inputClass} inputMode="numeric" onChange={(e) => setForm((f) => ({ ...f, clicks: e.target.value }))} value={form.clicks ?? ""} />
              </label>
              <label className="grid gap-1 text-sm">
                <span className="text-slate-400">Registrations</span>
                <input className={inputClass} inputMode="numeric" onChange={(e) => setForm((f) => ({ ...f, registrations: e.target.value }))} value={form.registrations ?? ""} />
              </label>
              <label className="grid gap-1 text-sm">
                <span className="text-slate-400">Engagement</span>
                <input className={inputClass} inputMode="numeric" onChange={(e) => setForm((f) => ({ ...f, engagement: e.target.value }))} value={form.engagement ?? ""} />
              </label>
              <label className="grid gap-1 text-sm">
                <span className="text-slate-400">Opens</span>
                <input className={inputClass} inputMode="numeric" onChange={(e) => setForm((f) => ({ ...f, opens: e.target.value }))} value={form.opens ?? ""} />
              </label>
              <label className="grid gap-1 text-sm">
                <span className="text-slate-400">Open rate %</span>
                <input className={inputClass} inputMode="decimal" onChange={(e) => setForm((f) => ({ ...f, openRate: e.target.value }))} value={form.openRate ?? ""} />
              </label>
              <label className="grid gap-1 text-sm">
                <span className="text-slate-400">Email clicks</span>
                <input className={inputClass} inputMode="numeric" onChange={(e) => setForm((f) => ({ ...f, emailClicks: e.target.value }))} value={form.emailClicks ?? ""} />
              </label>
              <label className="grid gap-1 text-sm sm:col-span-2">
                <span className="text-slate-400">Production asset</span>
                <select
                  className={inputClass}
                  onChange={(e) => setForm((f) => ({ ...f, productionAssetId: e.target.value }))}
                  value={form.productionAssetId ?? ""}
                >
                  <option value="">None</option>
                  {(productionAssets ?? []).map((a: { productionAssetId: string; title: string }) => (
                    <option key={a.productionAssetId} value={a.productionAssetId}>
                      {a.title}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-1 text-sm sm:col-span-2">
                <span className="text-slate-400">Trend signal</span>
                <select className={inputClass} onChange={(e) => setForm((f) => ({ ...f, trendId: e.target.value }))} value={form.trendId ?? ""}>
                  <option value="">None</option>
                  {(trendSignals ?? []).map((t: { trendId: string; title: string }) => (
                    <option key={t.trendId} value={t.trendId}>
                      {t.title}
                    </option>
                  ))}
                </select>
              </label>
              <div className="sm:col-span-2">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Labels (hooks, topics, Meta structure)</p>
                <div className="mt-2 grid gap-3 sm:grid-cols-2">
                  <label className="grid gap-1 text-sm">
                    <span className="text-slate-400">Hook label</span>
                    <input className={inputClass} onChange={(e) => setForm((f) => ({ ...f, hookLabel: e.target.value }))} value={form.hookLabel ?? ""} />
                  </label>
                  <label className="grid gap-1 text-sm">
                    <span className="text-slate-400">Topic label</span>
                    <input className={inputClass} onChange={(e) => setForm((f) => ({ ...f, topicLabel: e.target.value }))} value={form.topicLabel ?? ""} />
                  </label>
                  <label className="grid gap-1 text-sm">
                    <span className="text-slate-400">CTA label</span>
                    <input className={inputClass} onChange={(e) => setForm((f) => ({ ...f, ctaLabel: e.target.value }))} value={form.ctaLabel ?? ""} />
                  </label>
                  <label className="grid gap-1 text-sm">
                    <span className="text-slate-400">Audience label</span>
                    <input className={inputClass} onChange={(e) => setForm((f) => ({ ...f, audienceLabel: e.target.value }))} value={form.audienceLabel ?? ""} />
                  </label>
                  <label className="grid gap-1 text-sm">
                    <span className="text-slate-400">Campaign label</span>
                    <input className={inputClass} onChange={(e) => setForm((f) => ({ ...f, campaignLabel: e.target.value }))} value={form.campaignLabel ?? ""} />
                  </label>
                  <label className="grid gap-1 text-sm">
                    <span className="text-slate-400">Ad set label</span>
                    <input className={inputClass} onChange={(e) => setForm((f) => ({ ...f, adSetLabel: e.target.value }))} value={form.adSetLabel ?? ""} />
                  </label>
                  <label className="grid gap-1 text-sm">
                    <span className="text-slate-400">Ad label</span>
                    <input className={inputClass} onChange={(e) => setForm((f) => ({ ...f, adLabel: e.target.value }))} value={form.adLabel ?? ""} />
                  </label>
                  <label className="grid gap-1 text-sm">
                    <span className="text-slate-400">Placement label</span>
                    <input className={inputClass} onChange={(e) => setForm((f) => ({ ...f, placementLabel: e.target.value }))} value={form.placementLabel ?? ""} />
                  </label>
                  <label className="grid gap-1 text-sm sm:col-span-2">
                    <span className="text-slate-400">Objective label</span>
                    <input className={inputClass} onChange={(e) => setForm((f) => ({ ...f, objectiveLabel: e.target.value }))} value={form.objectiveLabel ?? ""} />
                  </label>
                </div>
              </div>
              <label className="grid gap-1 text-sm sm:col-span-2">
                <span className="text-slate-400">Notes</span>
                <textarea className={cn(inputClass, "min-h-[5rem]")} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} value={form.notes ?? ""} />
              </label>
            </div>
            {saveError ? <p className="mt-3 text-sm text-red-300">{saveError}</p> : null}
            <div className="mt-4 flex flex-wrap gap-2">
              <button className={btnPrimary} onClick={() => void saveSnapshot()} type="button">
                Save snapshot
              </button>
              {editingId ? (
                <button
                  className={btnSecondary}
                  onClick={() => {
                    void deleteSnapshot({ snapshotId: editingId }).then(() => setEditorOpen(false));
                  }}
                  type="button"
                >
                  Delete
                </button>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
