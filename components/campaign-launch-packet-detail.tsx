"use client";

import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { applyProductionAssetToFormFields, ProductionBridgeAssetPicker } from "@/components/production-bridge-asset-picker";
import { buildCampaignSavePatch, mapConvexCampaignRecordToCampaign } from "@/lib/campaign-mapper";
import {
  APPROVAL_TYPE_LABELS,
  deriveLaunchReadinessStrip,
  labelForCampaignKind,
  labelForLaunchType,
  READINESS_STATUS_LABELS,
  selectOptionsFromLabels,
  showCreativeHandoffTimelineRisk,
  statusBadgeTone,
  CAMPAIGN_KIND_LABELS,
  HANDOFF_STATUS_LABELS,
  LAUNCH_TYPE_LABELS,
  ROLLOUT_CADENCE_LABELS,
  SHORTS_STATUS_LABELS,
  SOCIAL_COPY_STATUS_LABELS,
  TRANSCRIPT_STATUS_LABELS,
  THUMBNAIL_STATUS_LABELS,
  YOUTUBE_STATUS_LABELS,
  ASSET_READINESS_LABELS,
} from "@/lib/campaign-launch-packet";
import type { Campaign } from "@/lib/domain";
import { Button, ControlPanel, SectionHeader, StatusBadge } from "@/components/ui";
import { cn } from "@/lib/utils";

const inputClass = "w-full rounded-md border border-slate-700 bg-slate-950/90 px-3 py-2 text-sm text-slate-100 outline-none placeholder:text-slate-500";
const textareaClass =
  "min-h-[6rem] w-full rounded-md border border-slate-700 bg-slate-950/90 px-3 py-2 text-sm text-slate-100 outline-none placeholder:text-slate-500";

function FieldLabel({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <div className="mb-1.5">
      <span className="text-sm font-medium text-slate-200">{children}</span>
      {hint ? <p className="mt-0.5 text-xs text-slate-500">{hint}</p> : null}
    </div>
  );
}

function hrefForReviewOwner(owner: string) {
  if (owner === "bari") return "/reviews/bari";
  if (owner === "blue") return "/reviews/blue";
  if (owner === "internal") return "/reviews/internal";
  return "/reviews/all";
}

export function CampaignLaunchPacketDetail({ campaignId }: { campaignId: string }) {
  const campaignRecord = useQuery(api.campaigns.getCampaignRecordByCampaignId, { campaignId });
  const allRecords = useQuery(api.campaigns.listCampaignRecords);
  const approvalRecords = useQuery(api.approvals.listApprovalItems);
  const responseRecords = useQuery(api.responses.listResponseRecords);
  const upsertCampaignRecord = useMutation(api.campaigns.upsertCampaignRecord);
  const runCampaignHeartbeat = useMutation(api.heartbeat.runCampaignHeartbeat);
  const linkAssetToCampaign = useMutation(api.productionAssets.linkAssetToCampaign);
  const seedDefaultProductionAssetsIfEmpty = useMutation(api.productionAssets.seedDefaultProductionAssetsIfEmpty);

  const [draft, setDraft] = useState<Campaign | null>(null);
  const [baseline, setBaseline] = useState<Campaign | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [heartbeatRunning, setHeartbeatRunning] = useState(false);
  const [heartbeatFeedback, setHeartbeatFeedback] = useState<string | null>(null);
  const [taskReturn, setTaskReturn] = useState<{ returnRoute: string } | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.sessionStorage.getItem("oc_task_return_context");
      if (!raw) {
        setTaskReturn(null);
        return;
      }
      const parsed = JSON.parse(raw) as { active?: boolean; source?: string; returnRoute?: string; destinationMode?: string };
      if (parsed.active && parsed.source === "today" && parsed.returnRoute && parsed.destinationMode === "campaign") {
        setTaskReturn({ returnRoute: parsed.returnRoute });
      } else {
        setTaskReturn(null);
      }
    } catch {
      setTaskReturn(null);
    }
  }, [campaignId]);

  const resolvedRecord = useMemo(() => {
    if (campaignRecord) return campaignRecord;
    return (allRecords ?? []).find((r: { campaignId: string }) => r.campaignId === campaignId) ?? null;
  }, [campaignRecord, allRecords, campaignId]);

  useEffect(() => {
    if (!resolvedRecord) return;
    const c = mapConvexCampaignRecordToCampaign(resolvedRecord as never);
    setDraft(c);
    setBaseline(structuredClone(c));
    setFeedback(null);
  }, [resolvedRecord]);

  const isDirty = useMemo(() => {
    if (!draft || !baseline) return false;
    return JSON.stringify(draft) !== JSON.stringify(baseline);
  }, [draft, baseline]);

  const linkedAsset = useQuery(
    api.productionAssets.getProductionAsset,
    draft?.sourceProductionAssetId?.trim() ? { productionAssetId: draft.sourceProductionAssetId.trim() } : "skip",
  );
  const trendsForPacket = useQuery(api.trendSignals.listTrendSignals, { campaignId, limit: 12 });
  const prodProbe = useQuery(api.productionAssets.listProductionAssets, { limit: 1 });
  const perfSummaryRows = useQuery(api.performance.listCampaignPerformanceSummary, { campaignId });
  const perfSnapshotsMini = useQuery(api.performance.listPerformanceSnapshots, { campaignId, limit: 20 });
  const perfReviewsMini = useQuery(api.performance.listPerformanceReviews, { campaignId, limit: 3 });
  const perfLearningsAll = useQuery(api.performance.listLearningCandidatesFromPerformance);

  useEffect(() => {
    if (prodProbe === undefined || prodProbe.length > 0) return;
    void seedDefaultProductionAssetsIfEmpty().catch(() => {
      /* non-fatal */
    });
  }, [prodProbe, seedDefaultProductionAssetsIfEmpty]);

  const hasManualSourceSnapshot =
    Boolean(draft?.sourceProductionAssetTitle?.trim()) ||
    Boolean(draft?.sourceProductionAssetUrl?.trim()) ||
    Boolean(draft?.frameIoUrl?.trim());
  const hasLinkedId = Boolean(draft?.sourceProductionAssetId?.trim());
  const hasAnySource = hasLinkedId || hasManualSourceSnapshot;

  const applySnapshotFromCache = useCallback(async () => {
    if (!draft?.id || !draft.sourceProductionAssetId?.trim()) return;
    try {
      await linkAssetToCampaign({ campaignId: draft.id, productionAssetId: draft.sourceProductionAssetId.trim() });
      setFeedback("Snapshot refreshed from Production Bridge cache.");
    } catch {
      setFeedback("Could not refresh snapshot from cache.");
    }
  }, [draft?.id, draft?.sourceProductionAssetId, linkAssetToCampaign]);

  const handlePickerAsset = useCallback(
    (asset: Parameters<typeof applyProductionAssetToFormFields>[0]) => {
      const snap = applyProductionAssetToFormFields(asset);
      setDraft((d) => (d ? { ...d, ...snap } : d));
      setFeedback("Source asset selected from Production Bridge cache.");
    },
    [],
  );

  const update = useCallback(<K extends keyof Campaign>(key: K, value: Campaign[K]) => {
    setDraft((d) => (d ? { ...d, [key]: value } : d));
  }, []);

  const readinessStrip = useMemo(() => deriveLaunchReadinessStrip(draft), [draft]);

  const perfRow = useMemo(() => {
    const rows = (perfSummaryRows ?? []) as Array<Record<string, unknown>>;
    return rows.find((r) => r.campaignId === campaignId) ?? null;
  }, [perfSummaryRows, campaignId]);

  const perfLearningsForCampaign = useMemo(() => {
    const rows = (perfLearningsAll ?? []) as Array<{ title?: string; summary?: string; payload?: { linkedCampaignIds?: string[] } }>;
    return rows.filter((r) => (r.payload?.linkedCampaignIds ?? []).includes(campaignId));
  }, [perfLearningsAll, campaignId]);

  const perfSourcesLabel = useMemo(() => {
    const snaps = (perfSnapshotsMini ?? []) as Array<{ sourceSystem?: string }>;
    if (!snaps.length) return (perfRow as { snapshotCount?: number } | null)?.snapshotCount ? "Convex (aggregated)" : "No snapshots yet";
    const u = [...new Set(snaps.map((s) => s.sourceSystem).filter(Boolean))];
    return `Convex · ${u.join(", ")}`;
  }, [perfSnapshotsMini, perfRow]);

  const relatedApprovals = useMemo(() => {
    return ((approvalRecords ?? []) as Array<Record<string, unknown>>).filter(
      (a) => (a.linkedCampaignId as string | undefined) === campaignId,
    );
  }, [approvalRecords, campaignId]);

  const relatedResponses = useMemo(() => {
    if (!draft) return [];
    return ((responseRecords ?? []) as Array<{ campaignId?: string; campaignName?: string; summary: string }>).filter(
      (r) => r.campaignId === draft.id || r.campaignName === draft.name,
    );
  }, [responseRecords, draft]);

  const save = async () => {
    if (!draft?.name?.trim()) {
      setFeedback("Campaign name is required.");
      return;
    }
    setSaving(true);
    setFeedback(null);
    try {
      const patch = buildCampaignSavePatch(draft);
      await upsertCampaignRecord({ campaignId: draft.id, patch: patch as never });
      const next = structuredClone(draft);
      setBaseline(next);
      setFeedback("Launch packet saved.");
    } catch (e) {
      setFeedback(e instanceof Error ? e.message : "Save failed. Check Convex connection.");
    } finally {
      setSaving(false);
    }
  };

  const reset = () => {
    if (!baseline) return;
    setDraft(structuredClone(baseline));
    setFeedback(null);
  };

  const blockersText = draft?.blockers?.join("\n") ?? "";

  const softWarnings = useMemo(() => {
    if (!draft) return [];
    const w: string[] = [];
    if (draft.emailBriefStatus === "sent" && !draft.emailBriefBody?.trim()) w.push("Email brief marked sent but body is empty.");
    if (draft.creativeBriefStatus === "sent" && !draft.creativeBriefBody?.trim()) w.push("Creative brief marked sent but body is empty.");
    if (draft.readinessStatus === "ready" && !draft.youtubeScheduledUrl?.trim()) w.push("Readiness is “ready” but scheduled YouTube URL is missing.");
    if (!draft.publishDate?.trim()) w.push("Publish date not set — add when known.");
    return w;
  }, [draft]);

  if (resolvedRecord === undefined || allRecords === undefined) {
    return (
      <div className="space-y-5">
        <SectionHeader eyebrow="Launch packet" title="Loading…" description="Loading from Convex." />
        <ControlPanel className="p-4 text-sm text-slate-300">Loading…</ControlPanel>
      </div>
    );
  }

  if (!draft) {
    return (
      <div className="space-y-5">
        <SectionHeader
          eyebrow="Launch packet"
          title="Not found"
          description="No campaign record matches this id."
          actions={
            <Link href="/campaigns">
              <Button variant="secondary">Back to campaigns</Button>
            </Link>
          }
        />
      </div>
    );
  }

  const pendingApprovalCount = relatedApprovals.filter((a) => a.status === "pending").length;
  const creativeRisk = showCreativeHandoffTimelineRisk(draft);

  return (
    <div className="space-y-5">
      <SectionHeader
        eyebrow="Weekly Launch Packet"
        title={draft.name}
        description={`${draft.campaignKind ? labelForCampaignKind(draft.campaignKind) : labelForCampaignKind(draft.type)} · ${draft.launchType ? labelForLaunchType(draft.launchType) : "Launch type not set"} · Stage: ${draft.stage}`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {isDirty ? <StatusBadge tone="amber">Unsaved changes</StatusBadge> : <StatusBadge tone="green">Saved</StatusBadge>}
            <StatusBadge tone={statusBadgeTone(draft.readinessStatus ?? draft.riskLevel)}>
              {draft.readinessStatus ? (READINESS_STATUS_LABELS[draft.readinessStatus] ?? draft.readinessStatus) : draft.riskLevel}
            </StatusBadge>
            <button disabled={!isDirty || saving} onClick={() => void save()} type="button">
              <Button variant="primary">{saving ? "Saving…" : "Save changes"}</Button>
            </button>
            <button disabled={!isDirty} onClick={reset} type="button">
              <Button variant="secondary">Reset unsaved</Button>
            </button>
            <Link href="/reviews/all">
              <Button variant="secondary">Open review queue</Button>
            </Link>
            <Link href="/campaigns">
              <Button variant="secondary">Back to campaigns</Button>
            </Link>
            {taskReturn ? (
              <Link href={taskReturn.returnRoute}>
                <Button variant="secondary">Back to tasks</Button>
              </Link>
            ) : null}
            <Link href="/intelligence/langgraph">
              <Button variant="secondary">Run packet draft (dry-run)</Button>
            </Link>
          </div>
        }
      />

      {feedback ? (
        <div
          className={cn(
            "rounded-lg border px-3 py-2 text-sm",
            feedback.includes("saved") || feedback.includes("Snapshot") || feedback.includes("selected from Production") ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-100" : "border-rose-500/30 bg-rose-500/10 text-rose-100",
          )}
        >
          {feedback}
        </div>
      ) : null}

      {softWarnings.length ? (
        <ControlPanel className="p-4">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-400">Soft checks (do not block save)</p>
          <ul className="mt-2 list-inside list-disc text-sm text-amber-100/90">
            {softWarnings.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        </ControlPanel>
      ) : null}

      <ControlPanel className="p-4" id="packet-summary">
        <div className="flex flex-wrap items-end justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-slate-400">Packet summary</p>
            <p className="mt-1 text-sm text-slate-300">
              Owner: <span className="text-slate-100">{draft.ownerName}</span>
              {draft.publishDate ? (
                <>
                  {" "}
                  · Publish: <span className="text-slate-100">{draft.publishDate}</span>
                </>
              ) : null}
              {draft.prepWeekStart ? (
                <>
                  {" "}
                  · Prep week starts: <span className="text-slate-100">{draft.prepWeekStart}</span>
                </>
              ) : null}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Last saved: {new Date(draft.updatedAt).toLocaleString()} · Pending approvals: {pendingApprovalCount}
            </p>
          </div>
          <p className="max-w-xl text-sm text-slate-200">
            <span className="font-semibold text-slate-100">Next action: </span>
            {draft.nextAction}
          </p>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {readinessStrip.map((row) => (
            <div className="flex min-w-[10rem] flex-1 flex-col gap-1 rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2" key={row.key}>
              <span className="text-[0.62rem] font-bold uppercase tracking-[0.16em] text-slate-500">{row.label}</span>
              <StatusBadge tone={row.tone}>{row.status}</StatusBadge>
            </div>
          ))}
        </div>
      </ControlPanel>

      <ControlPanel className="p-4">
        <p className="text-sm font-semibold text-slate-100">Campaign Heartbeat</p>
        <p className="mt-1 text-xs text-slate-500">
          Last check: {draft.heartbeatLastCheckedAt ? new Date(draft.heartbeatLastCheckedAt).toLocaleString() : "Not run for this packet yet."}
        </p>
        {draft.heartbeatSummary ? <p className="mt-2 text-sm text-slate-300">{draft.heartbeatSummary}</p> : null}
        {heartbeatFeedback ? <p className="mt-2 text-xs text-emerald-200">{heartbeatFeedback}</p> : null}
        <div className="mt-3">
          <button
            className="focus-ring rounded-lg border border-sky-500/60 bg-sky-500 px-3.5 py-2 text-sm font-semibold text-slate-950 hover:bg-sky-400 disabled:opacity-60"
            disabled={heartbeatRunning}
            onClick={() => {
              setHeartbeatFeedback(null);
              setHeartbeatRunning(true);
              void runCampaignHeartbeat({ campaignId, checkType: "campaign_detail_check", source: "campaign_detail" })
                .then((r) => {
                  setHeartbeatRunning(false);
                  setHeartbeatFeedback(
                    `Heartbeat completed for this packet. ${r.createdTaskIds.length} new task(s), ${r.updatedTaskIds.length} updated.`,
                  );
                })
                .catch(() => {
                  setHeartbeatRunning(false);
                  setHeartbeatFeedback("Heartbeat could not run. Check Convex connection.");
                });
            }}
            type="button"
          >
            {heartbeatRunning ? "Running…" : "Run check for this packet"}
          </button>
        </div>
      </ControlPanel>

      <ControlPanel className="p-4" id="packet-overview">
        <p className="text-sm font-semibold text-slate-100">Overview</p>
        <p className="mt-1 text-xs text-slate-500">Strategy and launch timing for this packet.</p>
        <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <label className="grid gap-1">
            <FieldLabel>Campaign name</FieldLabel>
            <input className={inputClass} onChange={(e) => update("name", e.target.value)} value={draft.name} />
          </label>
          <label className="grid gap-1">
            <FieldLabel>Campaign kind</FieldLabel>
            <select className={inputClass} onChange={(e) => update("campaignKind", e.target.value)} value={draft.campaignKind ?? ""}>
              <option value="">Use legacy type / not set</option>
              {selectOptionsFromLabels(CAMPAIGN_KIND_LABELS).map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1">
            <FieldLabel>Launch type</FieldLabel>
            <select className={inputClass} onChange={(e) => update("launchType", e.target.value)} value={draft.launchType ?? ""}>
              <option value="">Not set</option>
              {selectOptionsFromLabels(LAUNCH_TYPE_LABELS).map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1">
            <FieldLabel hint="Usually Wednesday full-video publish">Publish date</FieldLabel>
            <input className={inputClass} onChange={(e) => update("publishDate", e.target.value)} type="date" value={draft.publishDate ?? ""} />
          </label>
          <label className="grid gap-1">
            <FieldLabel hint="Monday starting prep sprint">Prep week start</FieldLabel>
            <input className={inputClass} onChange={(e) => update("prepWeekStart", e.target.value)} type="date" value={draft.prepWeekStart ?? ""} />
          </label>
          <label className="grid gap-1">
            <FieldLabel>Launch readiness status</FieldLabel>
            <select className={inputClass} onChange={(e) => update("readinessStatus", e.target.value)} value={draft.readinessStatus ?? ""}>
              <option value="">Not set</option>
              {selectOptionsFromLabels(READINESS_STATUS_LABELS).map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 md:col-span-2">
            <FieldLabel>Campaign angle</FieldLabel>
            <textarea className={textareaClass} onChange={(e) => update("campaignAngle", e.target.value)} value={draft.campaignAngle ?? ""} />
          </label>
          <label className="grid gap-1">
            <FieldLabel>Primary audience</FieldLabel>
            <input className={inputClass} onChange={(e) => update("primaryAudience", e.target.value)} placeholder="Also in Audience field below" value={draft.primaryAudience ?? ""} />
          </label>
          <label className="grid gap-1">
            <FieldLabel>Primary CTA</FieldLabel>
            <input className={inputClass} onChange={(e) => update("primaryCta", e.target.value)} value={draft.primaryCta ?? ""} />
          </label>
          <label className="grid gap-1">
            <FieldLabel>Audience (legacy / linked)</FieldLabel>
            <input className={inputClass} onChange={(e) => update("audience", e.target.value)} value={draft.audience} />
          </label>
          <label className="grid gap-1">
            <FieldLabel>Campaign goal (legacy summary)</FieldLabel>
            <textarea className={textareaClass} onChange={(e) => update("goal", e.target.value)} value={draft.goal} />
          </label>
          <label className="grid gap-1">
            <FieldLabel>Stage</FieldLabel>
            <input className={inputClass} onChange={(e) => update("stage", e.target.value)} value={draft.stage} />
          </label>
          <label className="grid gap-1">
            <FieldLabel>Internal lead / owner name</FieldLabel>
            <input className={inputClass} onChange={(e) => update("ownerName", e.target.value)} value={draft.ownerName} />
          </label>
        </div>
      </ControlPanel>

      <ControlPanel className="p-4" id="packet-source">
        <p className="text-sm font-semibold text-slate-100">Source asset and Production Bridge</p>
        <p className="mt-1 text-xs text-slate-500">
          Production Hub stays the system of record for files and lifecycle. This packet stores references and snapshots only — no live Production Hub API
          calls from Outreach Console.
        </p>

        {!hasAnySource ? (
          <div className="mt-3 rounded-lg border border-slate-800 bg-slate-950/50 px-3 py-3 text-sm text-slate-300">
            <p>No source asset linked yet.</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Link href="/campaigns/new">
                <Button variant="secondary">
                  Select from Production Hub
                </Button>
              </Link>
              <span className="text-xs text-slate-500">or enter asset fields manually below.</span>
            </div>
          </div>
        ) : null}

        {hasLinkedId && linkedAsset === undefined ? (
          <p className="mt-3 text-xs text-slate-400">Loading Production Bridge cache…</p>
        ) : null}

        {hasLinkedId && linkedAsset === null ? (
          <div className="mt-3 rounded-lg border border-amber-500/25 bg-amber-500/5 px-3 py-2 text-xs text-amber-100/90">
            The linked asset was not found in the local Production Bridge cache. The launch packet still has saved asset details below.
          </div>
        ) : null}

        {linkedAsset ? (
          <div className="mt-3 space-y-2 rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-3 text-xs text-slate-300">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-semibold text-slate-100">Linked Production Bridge asset</p>
              {typeof linkedAsset.lastSyncedAt === "number" && Date.now() - linkedAsset.lastSyncedAt > 14 * 24 * 60 * 60 * 1000 ? (
                <StatusBadge tone="amber">Stale cache</StatusBadge>
              ) : null}
            </div>
            <dl className="grid gap-1 sm:grid-cols-2">
              <div>
                <dt className="text-slate-500">Title</dt>
                <dd className="text-slate-100">{linkedAsset.title}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Asset type</dt>
                <dd>{linkedAsset.assetType}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Readiness</dt>
                <dd>{linkedAsset.readinessStatus ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Production stage</dt>
                <dd>{linkedAsset.productionStage ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Publishing stage</dt>
                <dd>{linkedAsset.publishingStage ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Transcript status</dt>
                <dd>{linkedAsset.transcriptStatus ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Thumbnail status</dt>
                <dd>{linkedAsset.thumbnailStatus ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Shorts</dt>
                <dd>
                  {linkedAsset.readyShortsCount ?? 0}/{linkedAsset.shortsCount ?? 0} ready
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Mux</dt>
                <dd>{linkedAsset.muxPlaybackId?.trim() ? `${linkedAsset.muxPlaybackId} (${linkedAsset.muxStatus ?? "unknown"})` : linkedAsset.muxStatus ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Last synced</dt>
                <dd>{linkedAsset.lastSyncedAt ? new Date(linkedAsset.lastSyncedAt).toLocaleString() : "—"}</dd>
              </div>
            </dl>
            <div className="flex flex-wrap gap-3 pt-1">
              {linkedAsset.frameIoUrl ? (
                <a className="text-sky-400 underline" href={linkedAsset.frameIoUrl} rel="noreferrer" target="_blank">
                  Frame.io
                </a>
              ) : null}
              {linkedAsset.productionHubUrl ? (
                <a className="text-sky-400 underline" href={linkedAsset.productionHubUrl} rel="noreferrer" target="_blank">
                  Production Hub
                </a>
              ) : null}
            </div>
            {linkedAsset.transcriptSummary ? (
              <p className="border-t border-slate-800 pt-2 text-slate-400">
                <span className="font-semibold text-slate-300">Transcript summary: </span>
                {linkedAsset.transcriptSummary}
              </p>
            ) : null}
          </div>
        ) : hasManualSourceSnapshot && !hasLinkedId ? (
          <p className="mt-3 text-xs text-slate-400">Manual source fields are saved on this packet (no Production Bridge ID).</p>
        ) : null}

        <div className="mt-4">
          <ProductionBridgeAssetPicker onSelect={handlePickerAsset} />
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={!draft.sourceProductionAssetId?.trim()}
            onClick={() => void applySnapshotFromCache()}
          >
            <Button variant="secondary">Use selected asset snapshot</Button>
          </button>
          <Link href="/operations/production-bridge">
            <Button variant="secondary">Production Bridge cache</Button>
          </Link>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="grid gap-1">
            <FieldLabel>Source Production Asset ID</FieldLabel>
            <input className={inputClass} onChange={(e) => update("sourceProductionAssetId", e.target.value)} value={draft.sourceProductionAssetId ?? ""} />
          </label>
          <label className="grid gap-1">
            <FieldLabel>Source Production Asset Title</FieldLabel>
            <input className={inputClass} onChange={(e) => update("sourceProductionAssetTitle", e.target.value)} value={draft.sourceProductionAssetTitle ?? ""} />
          </label>
          <label className="grid gap-1 md:col-span-2">
            <FieldLabel>Source Production Asset URL</FieldLabel>
            <input className={inputClass} onChange={(e) => update("sourceProductionAssetUrl", e.target.value)} value={draft.sourceProductionAssetUrl ?? ""} />
          </label>
          <label className="grid gap-1">
            <FieldLabel>Frame.io URL</FieldLabel>
            <input className={inputClass} onChange={(e) => update("frameIoUrl", e.target.value)} value={draft.frameIoUrl ?? ""} />
          </label>
          <label className="grid gap-1">
            <FieldLabel>Mux playback ID</FieldLabel>
            <input className={inputClass} onChange={(e) => update("muxPlaybackId", e.target.value)} value={draft.muxPlaybackId ?? ""} />
          </label>
          <label className="grid gap-1">
            <FieldLabel>Transcript status</FieldLabel>
            <select className={inputClass} onChange={(e) => update("transcriptStatus", e.target.value)} value={draft.transcriptStatus ?? ""}>
              <option value="">Not set</option>
              {selectOptionsFromLabels(TRANSCRIPT_STATUS_LABELS).map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1">
            <FieldLabel>Thumbnail status</FieldLabel>
            <select className={inputClass} onChange={(e) => update("thumbnailStatus", e.target.value)} value={draft.thumbnailStatus ?? ""}>
              <option value="">Not set</option>
              {selectOptionsFromLabels(THUMBNAIL_STATUS_LABELS).map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1">
            <FieldLabel>Asset readiness</FieldLabel>
            <select className={inputClass} onChange={(e) => update("assetReadinessStatus", e.target.value)} value={draft.assetReadinessStatus ?? ""}>
              <option value="">Not set</option>
              {selectOptionsFromLabels(ASSET_READINESS_LABELS).map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 md:col-span-2">
            <FieldLabel>Related shorts / reels notes</FieldLabel>
            <textarea className={textareaClass} onChange={(e) => update("relatedShortsNotes", e.target.value)} value={draft.relatedShortsNotes ?? ""} />
          </label>
          <label className="grid gap-1 md:col-span-2">
            <FieldLabel>Production notes</FieldLabel>
            <textarea className={textareaClass} onChange={(e) => update("productionNotes", e.target.value)} value={draft.productionNotes ?? ""} />
          </label>
        </div>
        <div className="mt-4 border-t border-slate-800 pt-3">
          <p className="text-xs font-semibold text-slate-400">Content Library (planned)</p>
          <button
            className="mt-2 cursor-not-allowed rounded-md border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-500"
            disabled
            type="button"
          >
            Add transcript summary to Library — planned
          </button>
        </div>
      </ControlPanel>

      <div className="grid gap-4 md:grid-cols-2">
        <ControlPanel className="p-4" id="packet-youtube">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <p className="text-sm font-semibold text-slate-100">YouTube release</p>
            <Link
              className="shrink-0 text-xs font-semibold text-sky-400 hover:text-sky-300 hover:underline"
              href={`/intelligence/copy?campaign=${encodeURIComponent(campaignId)}`}
            >
              Improve with Copy Intelligence
            </Link>
          </div>
          <p className="mt-1 text-xs text-slate-500">Console-only — no live YouTube scheduling.</p>
          {draft.youtubeScheduledUrl?.trim() ? (
            <p className="mt-2 text-xs">
              <StatusBadge tone="green">Scheduled link present</StatusBadge>{" "}
              <a className="text-sky-300 underline" href={draft.youtubeScheduledUrl} rel="noopener noreferrer" target="_blank">
                Open link
              </a>
            </p>
          ) : (
            <p className="mt-2 text-xs text-amber-200/90">Scheduled YouTube link not added — needed for Emailmarketing.com CTA.</p>
          )}
          <div className="mt-4 grid gap-3">
            <label className="grid gap-1">
              <FieldLabel>YouTube status</FieldLabel>
              <select className={inputClass} onChange={(e) => update("youtubeStatus", e.target.value)} value={draft.youtubeStatus ?? ""}>
                <option value="">Not set</option>
                {selectOptionsFromLabels(YOUTUBE_STATUS_LABELS).map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1">
              <FieldLabel>YouTube title</FieldLabel>
              <input className={inputClass} onChange={(e) => update("youtubeTitle", e.target.value)} value={draft.youtubeTitle ?? ""} />
            </label>
            <label className="grid gap-1">
              <FieldLabel>YouTube description</FieldLabel>
              <textarea className={textareaClass} onChange={(e) => update("youtubeDescription", e.target.value)} value={draft.youtubeDescription ?? ""} />
            </label>
            <label className="grid gap-1">
              <FieldLabel>Pinned comment</FieldLabel>
              <textarea className={textareaClass} onChange={(e) => update("youtubePinnedComment", e.target.value)} value={draft.youtubePinnedComment ?? ""} />
            </label>
            <label className="grid gap-1">
              <FieldLabel>Scheduled video URL</FieldLabel>
              <input className={inputClass} onChange={(e) => update("youtubeScheduledUrl", e.target.value)} value={draft.youtubeScheduledUrl ?? ""} />
            </label>
            <label className="grid gap-1">
              <FieldLabel>Scheduled at (local datetime)</FieldLabel>
              <input className={inputClass} onChange={(e) => update("youtubeScheduledAt", e.target.value)} type="datetime-local" value={draft.youtubeScheduledAt ?? ""} />
            </label>
            <label className="grid gap-1">
              <FieldLabel>YouTube notes</FieldLabel>
              <textarea className={textareaClass} onChange={(e) => update("youtubeNotes", e.target.value)} value={draft.youtubeNotes ?? ""} />
            </label>
          </div>
        </ControlPanel>

        <ControlPanel className="p-4" id="packet-email">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <p className="text-sm font-semibold text-slate-100">Email Handoff</p>
            <Link
              className="shrink-0 text-xs font-semibold text-sky-400 hover:text-sky-300 hover:underline"
              href={`/intelligence/copy?campaign=${encodeURIComponent(campaignId)}`}
            >
              Draft Email Brief with Copy Intelligence
            </Link>
          </div>
          <p className="mt-1 text-xs text-slate-500">Emailmarketing.com — manual paste and status only; no API send.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              className="rounded-md border border-slate-600 bg-slate-900 px-2 py-1 text-xs font-semibold text-slate-200 hover:bg-slate-800"
              onClick={() => {
                const u = draft.youtubeScheduledUrl?.trim();
                if (u) update("emailCtaLink", u);
              }}
              type="button"
            >
              Use YouTube URL as email CTA link
            </button>
          </div>
          <div className="mt-4 grid gap-3">
            <label className="grid gap-1">
              <FieldLabel>Email brief status</FieldLabel>
              <select className={inputClass} onChange={(e) => update("emailBriefStatus", e.target.value)} value={draft.emailBriefStatus ?? ""}>
                <option value="">Not set</option>
                {selectOptionsFromLabels(HANDOFF_STATUS_LABELS).map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1">
              <FieldLabel>Email CTA link</FieldLabel>
              <input className={inputClass} onChange={(e) => update("emailCtaLink", e.target.value)} value={draft.emailCtaLink ?? ""} />
            </label>
            <label className="grid gap-1">
              <FieldLabel>Brief body (paste for Emailmarketing.com)</FieldLabel>
              <textarea className={textareaClass} onChange={(e) => update("emailBriefBody", e.target.value)} value={draft.emailBriefBody ?? ""} />
            </label>
            <label className="grid gap-1">
              <FieldLabel>Brief sent at</FieldLabel>
              <input className={inputClass} onChange={(e) => update("emailBriefSentAt", e.target.value)} type="datetime-local" value={draft.emailBriefSentAt ?? ""} />
            </label>
            <label className="grid gap-1">
              <FieldLabel>Brief confirmed at</FieldLabel>
              <input className={inputClass} onChange={(e) => update("emailBriefConfirmedAt", e.target.value)} type="datetime-local" value={draft.emailBriefConfirmedAt ?? ""} />
            </label>
            <label className="grid gap-1">
              <FieldLabel>Sequence notes</FieldLabel>
              <textarea className={textareaClass} onChange={(e) => update("emailSequenceNotes", e.target.value)} value={draft.emailSequenceNotes ?? ""} />
            </label>
            <label className="grid gap-1">
              <FieldLabel>Subject line ideas</FieldLabel>
              <textarea className={textareaClass} onChange={(e) => update("emailSubjectIdeas", e.target.value)} value={draft.emailSubjectIdeas ?? ""} />
            </label>
            <label className="grid gap-1">
              <FieldLabel>Internal handoff notes</FieldLabel>
              <textarea className={textareaClass} onChange={(e) => update("emailHandoffNotes", e.target.value)} value={draft.emailHandoffNotes ?? ""} />
            </label>
          </div>
        </ControlPanel>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <ControlPanel className="p-4" id="packet-creative">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <p className="text-sm font-semibold text-slate-100">Creative Handoff</p>
            <Link
              className="shrink-0 text-xs font-semibold text-sky-400 hover:text-sky-300 hover:underline"
              href={`/intelligence/copy?campaign=${encodeURIComponent(campaignId)}`}
            >
              Draft Creative Brief with Copy Intelligence
            </Link>
          </div>
          <p className="mt-1 text-xs text-slate-500">Creative owner (e.g. Brandon) — track brief and shorts status manually.</p>
          {creativeRisk ? (
            <p className="mt-2 rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-1.5 text-xs text-amber-100">
              Prep-week Wednesday has passed and the creative brief is not confirmed sent — check timeline.
            </p>
          ) : null}
          <div className="mt-4 grid gap-3">
            <label className="grid gap-1">
              <FieldLabel>Creative owner</FieldLabel>
              <input className={inputClass} onChange={(e) => update("creativeOwner", e.target.value)} placeholder="Brandon, Internal, Contractor…" value={draft.creativeOwner ?? ""} />
            </label>
            <label className="grid gap-1">
              <FieldLabel>Creative brief status</FieldLabel>
              <select className={inputClass} onChange={(e) => update("creativeBriefStatus", e.target.value)} value={draft.creativeBriefStatus ?? ""}>
                <option value="">Not set</option>
                {selectOptionsFromLabels(HANDOFF_STATUS_LABELS).map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1">
              <FieldLabel>Creative brief body</FieldLabel>
              <textarea className={textareaClass} onChange={(e) => update("creativeBriefBody", e.target.value)} value={draft.creativeBriefBody ?? ""} />
            </label>
            <label className="grid gap-1">
              <FieldLabel>Brief sent at</FieldLabel>
              <input className={inputClass} onChange={(e) => update("creativeBriefSentAt", e.target.value)} type="datetime-local" value={draft.creativeBriefSentAt ?? ""} />
            </label>
            <label className="grid gap-1">
              <FieldLabel>Brief confirmed at</FieldLabel>
              <input className={inputClass} onChange={(e) => update("creativeBriefConfirmedAt", e.target.value)} type="datetime-local" value={draft.creativeBriefConfirmedAt ?? ""} />
            </label>
            <label className="grid gap-1">
              <FieldLabel>Shorts / reels status</FieldLabel>
              <select className={inputClass} onChange={(e) => update("shortsStatus", e.target.value)} value={draft.shortsStatus ?? ""}>
                <option value="">Not set</option>
                {selectOptionsFromLabels(SHORTS_STATUS_LABELS).map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1">
              <FieldLabel>Deliverables requested</FieldLabel>
              <input className={inputClass} onChange={(e) => update("shortFormDeliverablesRequested", e.target.value)} value={draft.shortFormDeliverablesRequested ?? ""} />
            </label>
            <label className="grid gap-1">
              <FieldLabel>Deliverables received</FieldLabel>
              <input className={inputClass} onChange={(e) => update("shortFormDeliverablesReceived", e.target.value)} value={draft.shortFormDeliverablesReceived ?? ""} />
            </label>
            <label className="grid gap-1">
              <FieldLabel>Creative notes</FieldLabel>
              <textarea className={textareaClass} onChange={(e) => update("creativeNotes", e.target.value)} value={draft.creativeNotes ?? ""} />
            </label>
          </div>
        </ControlPanel>

        <ControlPanel className="p-4" id="packet-social">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <p className="text-sm font-semibold text-slate-100">Social Rollout</p>
            <div className="flex flex-wrap gap-2">
              <Link
                className="shrink-0 text-xs font-semibold text-sky-400 hover:text-sky-300 hover:underline"
                href={`/intelligence/trends?campaign=${encodeURIComponent(campaignId)}`}
              >
                Trend Intelligence
              </Link>
              <Link
                className="shrink-0 text-xs font-semibold text-sky-400 hover:text-sky-300 hover:underline"
                href={`/intelligence/copy?campaign=${encodeURIComponent(campaignId)}`}
              >
                Draft Social Copy with Copy Intelligence
              </Link>
            </div>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Plan and copy status — no auto-post. Meta connector is not connected; capture captions and notes manually. Future read-only insights can complement
            Performance and Trend Intelligence. Friday readiness is not blocked when Meta fields are empty.
          </p>
          <div className="mt-3 rounded-lg border border-slate-800 bg-slate-950/50 p-3">
            <p className="text-xs font-semibold text-slate-200">Related trend ideas</p>
            <p className="mt-1 text-xs text-slate-500">
              Link approved or candidate trends when planning reels, memes, and captions. Packet IDs on trends are manual; nothing auto-posts.
            </p>
            {(trendsForPacket ?? []).length === 0 ? (
              <p className="mt-2 text-xs text-slate-500">No trends linked to this packet yet.</p>
            ) : (
              <ul className="mt-2 space-y-1.5 text-xs">
                {(trendsForPacket ?? []).map((t: { trendId: string; title: string; status: string }) => (
                  <li className="flex flex-wrap items-center justify-between gap-2" key={t.trendId}>
                    <span className="text-slate-300">{t.title}</span>
                    <Link className="text-sky-400 hover:underline" href={`/intelligence/trends?trend=${encodeURIComponent(t.trendId)}`}>
                      View
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            <Link className="mt-2 inline-block text-xs font-semibold text-sky-400 hover:underline" href={`/intelligence/trends?campaign=${encodeURIComponent(campaignId)}`}>
              Add or link trend ideas
            </Link>
          </div>
          <div className="mt-4 grid gap-3">
            <label className="grid gap-1">
              <FieldLabel>Social copy status</FieldLabel>
              <select className={inputClass} onChange={(e) => update("socialCopyStatus", e.target.value)} value={draft.socialCopyStatus ?? ""}>
                <option value="">Not set</option>
                {selectOptionsFromLabels(SOCIAL_COPY_STATUS_LABELS).map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1">
              <FieldLabel>Rollout cadence status</FieldLabel>
              <select className={inputClass} onChange={(e) => update("rolloutCadenceStatus", e.target.value)} value={draft.rolloutCadenceStatus ?? ""}>
                <option value="">Not set</option>
                {selectOptionsFromLabels(ROLLOUT_CADENCE_LABELS).map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1">
              <FieldLabel>Rollout notes (cadence + platforms)</FieldLabel>
              <textarea className={textareaClass} onChange={(e) => update("rolloutNotes", e.target.value)} value={draft.rolloutNotes ?? ""} />
            </label>
            <label className="grid gap-1">
              <FieldLabel>Meta / Feed caption</FieldLabel>
              <textarea className={textareaClass} onChange={(e) => update("metaCaption", e.target.value)} value={draft.metaCaption ?? ""} />
            </label>
            <label className="grid gap-1">
              <FieldLabel>Meta status</FieldLabel>
              <input className={inputClass} onChange={(e) => update("metaStatus", e.target.value)} value={draft.metaStatus ?? ""} />
            </label>
            <label className="grid gap-1">
              <FieldLabel>Facebook caption</FieldLabel>
              <textarea className={textareaClass} onChange={(e) => update("facebookCaption", e.target.value)} value={draft.facebookCaption ?? ""} />
            </label>
            <label className="grid gap-1">
              <FieldLabel>Facebook status</FieldLabel>
              <input className={inputClass} onChange={(e) => update("facebookStatus", e.target.value)} value={draft.facebookStatus ?? ""} />
            </label>
            <label className="grid gap-1">
              <FieldLabel>Meta Ads notes (future)</FieldLabel>
              <textarea className={textareaClass} onChange={(e) => update("metaAdsNotes", e.target.value)} value={draft.metaAdsNotes ?? ""} />
            </label>
            <label className="grid gap-1">
              <FieldLabel>Meta performance notes</FieldLabel>
              <textarea className={textareaClass} onChange={(e) => update("metaPerformanceNotes", e.target.value)} value={draft.metaPerformanceNotes ?? ""} />
            </label>
            <label className="grid gap-1">
              <FieldLabel>Instagram caption</FieldLabel>
              <textarea className={textareaClass} onChange={(e) => update("instagramCaption", e.target.value)} value={draft.instagramCaption ?? ""} />
            </label>
            <label className="grid gap-1">
              <FieldLabel>Instagram status</FieldLabel>
              <input className={inputClass} onChange={(e) => update("instagramStatus", e.target.value)} value={draft.instagramStatus ?? ""} />
            </label>
            <label className="grid gap-1">
              <FieldLabel>TikTok caption</FieldLabel>
              <textarea className={textareaClass} onChange={(e) => update("tiktokCaption", e.target.value)} value={draft.tiktokCaption ?? ""} />
            </label>
            <label className="grid gap-1">
              <FieldLabel>TikTok status</FieldLabel>
              <input className={inputClass} onChange={(e) => update("tiktokStatus", e.target.value)} value={draft.tiktokStatus ?? ""} />
            </label>
            <label className="grid gap-1">
              <FieldLabel>X.com post</FieldLabel>
              <textarea className={textareaClass} onChange={(e) => update("xPost", e.target.value)} value={draft.xPost ?? ""} />
            </label>
            <label className="grid gap-1">
              <FieldLabel>X.com status</FieldLabel>
              <input className={inputClass} onChange={(e) => update("xStatus", e.target.value)} value={draft.xStatus ?? ""} />
            </label>
            <label className="grid gap-1">
              <FieldLabel>Pinterest title</FieldLabel>
              <input className={inputClass} onChange={(e) => update("pinterestTitle", e.target.value)} value={draft.pinterestTitle ?? ""} />
            </label>
            <label className="grid gap-1">
              <FieldLabel>Pinterest description</FieldLabel>
              <textarea className={textareaClass} onChange={(e) => update("pinterestDescription", e.target.value)} value={draft.pinterestDescription ?? ""} />
            </label>
            <label className="grid gap-1">
              <FieldLabel>Pinterest status</FieldLabel>
              <input className={inputClass} onChange={(e) => update("pinterestStatus", e.target.value)} value={draft.pinterestStatus ?? ""} />
            </label>
            <label className="grid gap-1">
              <FieldLabel>YouTube Shorts caption</FieldLabel>
              <textarea className={textareaClass} onChange={(e) => update("youtubeShortsCaption", e.target.value)} value={draft.youtubeShortsCaption ?? ""} />
            </label>
            <label className="grid gap-1">
              <FieldLabel>YouTube Shorts status</FieldLabel>
              <input className={inputClass} onChange={(e) => update("youtubeShortsStatus", e.target.value)} value={draft.youtubeShortsStatus ?? ""} />
            </label>
            <label className="grid gap-1">
              <FieldLabel>Meme / engagement ideas</FieldLabel>
              <textarea className={textareaClass} onChange={(e) => update("memeEngagementIdeas", e.target.value)} value={draft.memeEngagementIdeas ?? ""} />
            </label>
          </div>
        </ControlPanel>
      </div>

      <ControlPanel className="p-4" id="packet-reviews">
        <p className="text-sm font-semibold text-slate-100">Review Gates</p>
        <p className="mt-1 text-xs text-slate-500">Linked approval items from Convex — Bari and Blue only when this packet requires them.</p>
        <div className="mt-3 grid gap-2 md:grid-cols-3">
          <div className="rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2 text-xs">
            <p className="font-bold uppercase tracking-[0.14em] text-slate-500">Internal</p>
            <p className="mt-1 text-slate-200">{draft.internalApprovalRequired ? formatGate(draft.internalApprovalStatus) : "Not required"}</p>
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2 text-xs">
            <p className="font-bold uppercase tracking-[0.14em] text-slate-500">Blue</p>
            <p className="mt-1 text-slate-200">{draft.blueApprovalRequired ? formatGate(draft.blueApprovalStatus) : "Not escalated"}</p>
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2 text-xs">
            <p className="font-bold uppercase tracking-[0.14em] text-slate-500">Bari</p>
            <p className="mt-1 text-slate-200">{draft.bariApprovalRequired ? formatGate(draft.bariApprovalStatus) : "Not escalated"}</p>
          </div>
        </div>
        {relatedApprovals.length ? (
          <div className="mt-4 border-t border-slate-800 pt-3">
            <p className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-slate-500">Approval items</p>
            <div className="mt-2 space-y-2">
              {relatedApprovals.map((a) => (
                <div className="flex flex-wrap items-start justify-between gap-2 rounded-lg border border-slate-800 bg-slate-950/50 px-3 py-2 text-xs" key={String(a.approvalId)}>
                  <div>
                    <p className="font-semibold text-slate-100">{String(a.title)}</p>
                    <p className="mt-0.5 text-slate-400">
                      {APPROVAL_TYPE_LABELS[String(a.type)] ?? String(a.type)} · {String(a.owner)}
                    </p>
                    <p className="mt-1 text-slate-300">{String(a.description ?? "")}</p>
                    <p className="mt-1 text-slate-500">Status: {String(a.status)}</p>
                  </div>
                  <Link className="shrink-0 text-sky-300 hover:underline" href={hrefForReviewOwner(String(a.owner))}>
                    Open queue
                  </Link>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="mt-3 text-xs text-slate-500">No approval rows linked to this campaign id.</p>
        )}
      </ControlPanel>

      <ControlPanel className="p-4" id="packet-blockers">
        <p className="text-sm font-semibold text-slate-100">Blockers & notes</p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="grid gap-1 md:col-span-2">
            <FieldLabel hint="One per line">Blockers</FieldLabel>
            <textarea
              className={textareaClass}
              onChange={(e) =>
                update(
                  "blockers",
                  e.target.value
                    .split("\n")
                    .map((l) => l.trim())
                    .filter(Boolean),
                )
              }
              value={blockersText}
            />
          </label>
          <label className="grid gap-1 md:col-span-2">
            <FieldLabel>Internal notes</FieldLabel>
            <textarea className={textareaClass} onChange={(e) => update("internalNotes", e.target.value)} value={draft.internalNotes ?? ""} />
          </label>
          <label className="grid gap-1 md:col-span-2">
            <FieldLabel>Next action</FieldLabel>
            <textarea className={textareaClass} onChange={(e) => update("nextAction", e.target.value)} value={draft.nextAction} />
          </label>
          <label className="grid gap-1 md:col-span-2">
            <FieldLabel>Risk notes</FieldLabel>
            <textarea className={textareaClass} onChange={(e) => update("riskNotes", e.target.value)} value={draft.riskNotes ?? ""} />
          </label>
        </div>
      </ControlPanel>

      <ControlPanel className="p-4">
        <p className="text-sm font-semibold text-slate-100">Campaign Performance & Learning</p>
        <p className="mt-1 text-xs text-slate-500">
          Performance Intelligence stores structured snapshots in Convex. Treat metrics as manual, demo, or imported unless source labels show verified sync —
          no live analytics warehouse in this build.
        </p>
        {perfRow && Number(perfRow.snapshotCount) > 0 ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
              <p className="text-xs uppercase text-slate-500">Snapshots</p>
              <p className="mt-1 text-lg font-semibold text-slate-100">{String(perfRow.snapshotCount)}</p>
            </div>
            <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
              <p className="text-xs uppercase text-slate-500">Views / impressions</p>
              <p className="mt-1 text-lg font-semibold text-slate-100">{String(perfRow.totalViews ?? 0)}</p>
            </div>
            <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
              <p className="text-xs uppercase text-slate-500">Clicks + email clicks</p>
              <p className="mt-1 text-lg font-semibold text-slate-100">
                {Number(perfRow.totalClicks ?? 0) + Number(perfRow.totalEmailClicks ?? 0)}
              </p>
            </div>
            <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
              <p className="text-xs uppercase text-slate-500">Registrations</p>
              <p className="mt-1 text-lg font-semibold text-slate-100">{String(perfRow.totalRegistrations ?? 0)}</p>
            </div>
            <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
              <p className="text-xs uppercase text-slate-500">Top platform (by views)</p>
              <p className="mt-1 text-sm font-semibold text-sky-200">{String(perfRow.topPlatformByViews || "—")}</p>
            </div>
            <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
              <p className="text-xs uppercase text-slate-500">Latest metric date</p>
              <p className="mt-1 text-sm font-semibold text-slate-200">{String(perfRow.latestMetricDate || "—")}</p>
            </div>
          </div>
        ) : (
          <p className="mt-3 text-sm text-slate-400">
            No performance snapshots yet for this campaign. Add manual metrics for a launch campaign or connect future analytics integrations through Operations.
          </p>
        )}
        {(perfReviewsMini ?? []).length > 0 ? (
          <p className="mt-3 text-xs text-slate-400">
            Latest review: {(perfReviewsMini as Array<{ summary?: string }>)[0]?.summary?.slice(0, 220)}
            {(perfReviewsMini as Array<{ summary?: string }>)[0]?.summary && (perfReviewsMini as Array<{ summary?: string }>)[0]!.summary!.length > 220 ? "…" : ""}
          </p>
        ) : null}
        {perfLearningsForCampaign.length > 0 ? (
          <p className="mt-2 text-xs text-amber-200/90">
            {perfLearningsForCampaign.length} performance-linked learning candidate(s) — review in Campaign Learnings before trusting in copy workflows.
          </p>
        ) : null}
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <label className="grid gap-1">
            <FieldLabel>Performance status (manual)</FieldLabel>
            <input className={inputClass} onChange={(e) => update("performanceStatus", e.target.value)} value={draft.performanceStatus ?? ""} />
          </label>
          <label className="grid gap-1">
            <FieldLabel>Metrics source</FieldLabel>
            <input className={inputClass} readOnly value={perfSourcesLabel} />
          </label>
          <label className="grid gap-1 md:col-span-2">
            <FieldLabel>Performance notes</FieldLabel>
            <textarea className={textareaClass} onChange={(e) => update("performanceNotes", e.target.value)} value={draft.performanceNotes ?? ""} />
          </label>
          <label className="grid gap-1 md:col-span-2">
            <FieldLabel>Learning notes</FieldLabel>
            <textarea className={textareaClass} onChange={(e) => update("learningNotes", e.target.value)} value={draft.learningNotes ?? ""} />
          </label>
          <label className="grid gap-1">
            <FieldLabel>Best hook</FieldLabel>
            <input className={inputClass} onChange={(e) => update("bestHook", e.target.value)} value={draft.bestHook ?? ""} />
          </label>
          <label className="grid gap-1">
            <FieldLabel>Best-performing platform</FieldLabel>
            <input className={inputClass} onChange={(e) => update("bestPlatform", e.target.value)} value={draft.bestPlatform ?? ""} />
          </label>
          <label className="grid gap-1 md:col-span-2">
            <FieldLabel>Registration impact notes</FieldLabel>
            <textarea className={textareaClass} onChange={(e) => update("registrationImpactNotes", e.target.value)} value={draft.registrationImpactNotes ?? ""} />
          </label>
        </div>
        <div className="mt-3 flex flex-wrap gap-3">
          <Link className="text-sm text-sky-300 underline-offset-2 hover:underline" href={`/intelligence/performance?campaign=${encodeURIComponent(campaignId)}`}>
            Open Performance Intelligence
          </Link>
          <Link className="text-sm text-sky-300 underline-offset-2 hover:underline" href={`/intelligence/performance?campaign=${encodeURIComponent(campaignId)}`}>
            Add performance snapshot
          </Link>
        </div>
        {relatedResponses[0] ? <p className="mt-3 text-xs text-slate-400">Latest response signal: {relatedResponses[0].summary}</p> : null}
      </ControlPanel>

      <div className="flex flex-wrap gap-2 border-t border-slate-800 pt-4">
        <button disabled={!isDirty || saving} onClick={() => void save()} type="button">
          <Button variant="primary">{saving ? "Saving…" : "Save changes"}</Button>
        </button>
        <button disabled={!isDirty} onClick={reset} type="button">
          <Button variant="secondary">Reset unsaved</Button>
        </button>
      </div>
    </div>
  );
}

function formatGate(status?: string) {
  if (!status) return "Waiting";
  return status.replace(/_/g, " ");
}
