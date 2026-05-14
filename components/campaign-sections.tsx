"use client";

import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { HeartPulse, Play, Sparkles } from "lucide-react";
import { CampaignLaunchPacketDetail } from "@/components/campaign-launch-packet-detail";
import { mapConvexCampaignRecordToCampaign } from "@/lib/campaign-mapper";
import {
  ASSET_READINESS_LABELS,
  CAMPAIGN_KIND_LABELS,
  deriveLaunchReadinessStrip,
  labelForCampaignKind,
  LAUNCH_TYPE_LABELS,
  READINESS_STATUS_LABELS,
  selectOptionsFromLabels,
  THUMBNAIL_STATUS_LABELS,
  TRANSCRIPT_STATUS_LABELS,
} from "@/lib/campaign-launch-packet";
import { applyProductionAssetToFormFields, ProductionBridgeAssetPicker } from "@/components/production-bridge-asset-picker";
import { resolveCheckDate, selectActiveLaunchCampaign } from "@/lib/campaign-heartbeat";
import { campaignMatchesLaunchFilter } from "@/lib/launch-packet-filters";
import type { Campaign, TodayTaskRecord } from "@/lib/domain";
import { useAppUser } from "@/components/auth/app-user-context";
import {
  Button,
  ControlPanel,
  Pill,
  ReadinessChecklist,
  SectionHeader,
  StatusBadge,
  StatusDot,
} from "@/components/ui";
import { cn } from "@/lib/utils";

const LAUNCH_PACKET_FILTERS = [
  "All",
  "Active",
  "Needs review",
  "At risk",
  "Blocked",
  "Ready",
  "Published",
  "Learning",
  "Bari review",
  "Blue review",
] as const;

function displayPacketStatus(campaign: Campaign): string {
  if (campaign.status === "blocked" || campaign.readinessStatus === "blocked") return "Blocked";
  if (campaign.status === "sent") return "Published";
  if (campaign.status === "learning_complete") return "Learning";
  if (campaign.status === "ready_for_keap") return "Ready for handoff";
  if (campaign.status === "needs_bari_review" || campaign.status === "needs_blue_review" || campaign.status === "needs_internal_review") {
    return "Needs review";
  }
  if (campaign.pendingApprovals?.length) return "Needs review";
  if (campaign.riskLevel === "red" || campaign.readinessStatus === "at_risk") return "At risk";
  if (campaign.riskLevel === "yellow" || campaign.readinessStatus === "needs_attention") return "Needs attention";
  return "Active";
}

function statusToneForPacket(campaign: Campaign): "green" | "amber" | "red" | "blue" | "gray" {
  const label = displayPacketStatus(campaign);
  if (label === "Blocked") return "red";
  if (label === "At risk" || label === "Needs attention") return "amber";
  if (label === "Needs review") return "amber";
  if (label === "Ready for handoff") return "green";
  if (label === "Published" || label === "Learning") return "blue";
  return "green";
}

function sortPacketsForList(a: Campaign, b: Campaign): number {
  const rank = (c: Campaign) => {
    if (c.status === "blocked" || c.readinessStatus === "blocked") return 0;
    if (c.riskLevel === "red" || c.readinessStatus === "at_risk") return 1;
    if (c.status === "needs_bari_review" || c.status === "needs_blue_review" || c.status === "needs_internal_review" || (c.pendingApprovals?.length ?? 0) > 0) return 2;
    if (c.readinessStatus === "needs_attention" || c.riskLevel === "yellow") return 3;
    if (c.status === "ready_for_keap") return 4;
    if (c.status === "sent" || c.status === "learning_complete") return 8;
    return 5;
  };
  const dr = rank(a) - rank(b);
  if (dr !== 0) return dr;
  const da = a.publishDate?.trim() ? Date.parse(a.publishDate) : Number.POSITIVE_INFINITY;
  const db = b.publishDate?.trim() ? Date.parse(b.publishDate) : Number.POSITIVE_INFINITY;
  if (Number.isFinite(da) && Number.isFinite(db) && da !== db) return da - db;
  return (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
}

function stageLabelForCampaign(campaign: Campaign) {
  const s = stageForCampaign(campaign);
  if (s === "Keap Prep" || s === "Handoff Prep") return "Handoff prep";
  return s;
}

function emailHandoffLine(campaign: Campaign): string {
  if (campaign.status === "ready_for_keap") return "Ready for manual handoff (Emailmarketing.com and registration tracking)";
  return "In progress";
}

function sourceAudienceLine(campaign: Campaign): string {
  const m = campaign.sourceMapping?.trim();
  if (!m) return "Not set";
  if (m.toLowerCase().includes("keap")) return m.replace(/Keap/gi, "CRM").replace(/keap/gi, "crm");
  return m;
}

function formatLabel(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function shortPacketStatus(value: string | undefined) {
  if (!value?.trim()) return "—";
  return formatLabel(value);
}

function stageForCampaign(campaign: Campaign) {
  if (campaign.stage) return campaign.stage;
  const stages: Record<string, string> = {
    intake_draft: "Intake",
    agent_drafting: "Copy",
    needs_bari_review: "Bari Review",
    needs_blue_review: "Blue Review",
    needs_internal_review: "Internal Approval",
    ready_for_keap: "Handoff prep",
    sent: "Published",
    reporting: "Responses",
    learning_complete: "Learning",
    blocked: "Blocked",
    approved: "Approved",
    scheduled: "Scheduled",
  };
  return stages[campaign.status] ?? formatLabel(campaign.status);
}

function ownerName(campaign: Campaign) {
  return campaign.ownerName ?? "Unassigned";
}

function offerName(campaign: Campaign) {
  return campaign.offer || "No offer selected";
}

function pendingApprovals(campaign: Campaign) {
  return campaign.pendingApprovals.length ? campaign.pendingApprovals.join(", ") : "none";
}

function campaignMatchesFilter(campaign: Campaign, filter: string) {
  return campaignMatchesLaunchFilter(campaign, filter);
}

function lastActivityForCampaign(campaign: Campaign) {
  return new Date(campaign.lastActivityAt ?? campaign.updatedAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

function formatTimestamp(value?: number) {
  if (!value) return "Not available";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function createCampaignId() {
  return `camp_${Date.now()}`;
}

function splitLines(value: string) {
  return value.split("\n").map((line) => line.trim()).filter(Boolean);
}

const DEMO_LAUNCH_PACKET = "Weekly Launch — Virtual Events Still Matter";
const DEMO_PUBLISH_LABEL = "Next Wednesday";

function heartbeatMissingFromCampaign(campaign: Campaign | null): string {
  if (!campaign) return "YouTube scheduled link, creative brief confirmation";
  const parts: string[] = [];
  if (!campaign.youtubeScheduledUrl?.trim()) parts.push("Scheduled YouTube link");
  if (campaign.emailBriefStatus && !["sent", "confirmed"].includes(campaign.emailBriefStatus)) parts.push("Email handoff confirmation");
  if (campaign.creativeBriefStatus && !["sent", "confirmed"].includes(campaign.creativeBriefStatus)) parts.push("Creative brief confirmation");
  if (campaign.pendingApprovals.includes("bari")) parts.push("Bari founder-voice review");
  if (campaign.pendingApprovals.includes("blue")) parts.push("Blue strategy / claims review");
  if (campaign.pendingApprovals.includes("internal")) parts.push("Internal launch readiness");
  if (campaign.status === "ready_for_keap" && !campaign.keapTagMapping?.trim()) parts.push("Audience/source mapping");
  return parts.length ? parts.join("; ") : "YouTube scheduled link, creative brief confirmation";
}

function heartbeatRiskFromCampaign(campaign: Campaign | null): string {
  if (!campaign) {
    return "Shorts may not be ready by Friday if Brandon has not received the brief.";
  }
  if (campaign.riskLevel === "red") {
    return `${campaign.name}: strategic or compliance risk — review before handoffs.`;
  }
  if (campaign.riskLevel === "yellow") {
    return "Dependencies may slip if handoffs are not confirmed by Thursday.";
  }
  return "No major timing risks flagged for this prep window.";
}

function launchReadinessRows(campaign: Campaign | null) {
  return deriveLaunchReadinessStrip(campaign);
}

export function DashboardSection() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"current" | "history">("current");
  const [undoTaskId, setUndoTaskId] = useState<string | null>(null);
  const [undoVisible, setUndoVisible] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [heartbeatMsg, setHeartbeatMsg] = useState<string | null>(null);
  const [heartbeatRunning, setHeartbeatRunning] = useState(false);
  const seedAttemptedRef = useRef(false);
  const TASK_RETURN_KEY = "oc_task_return_context";
  const todayTasks = useQuery(api.todayTasks.listTodayTasks);
  const campaignRecords = useQuery(api.campaigns.listCampaignRecords);
  const approvalItems = useQuery(api.approvals.listApprovalItems);
  const latestHeartbeat = useQuery(api.heartbeat.getLatestHeartbeatCheck, {});
  const seedDefaultTodayTasksIfEmpty = useMutation(api.todayTasks.seedDefaultTodayTasksIfEmpty);
  const completeTodayTask = useMutation(api.todayTasks.completeTodayTask);
  const restoreTodayTask = useMutation(api.todayTasks.restoreTodayTask);
  const runCampaignHeartbeat = useMutation(api.heartbeat.runCampaignHeartbeat);

  useEffect(() => {
    if (todayTasks === undefined || seedAttemptedRef.current || todayTasks.length > 0) return;
    seedAttemptedRef.current = true;
    void seedDefaultTodayTasksIfEmpty().catch(() => {
      setFeedback("Unable to update task. Check Convex connection.");
      seedAttemptedRef.current = false;
    });
  }, [seedDefaultTodayTasksIfEmpty, todayTasks]);

  const tasks: TodayTaskRecord[] = (todayTasks ?? []) as TodayTaskRecord[];
  const currentTasks = tasks.filter((task) => task.status === "current");
  const historyTasks = tasks.filter((task) => task.status === "completed");

  const campaigns: Campaign[] = useMemo(
    () => (campaignRecords ?? []).map((record) => mapConvexCampaignRecordToCampaign(record as never)),
    [campaignRecords],
  );

  const pendingReviewStatuses = useMemo(() => new Set(["pending", "changes_requested"]), []);

  const homeLaunchMetrics = useMemo(() => {
    if (campaignRecords === undefined) return null;
    const pendingApprovals = (approvalItems ?? []).filter((a) => pendingReviewStatuses.has(a.status));
    const internalPending = pendingApprovals.filter((a) => a.owner === "internal").length;
    const bluePending = pendingApprovals.filter((a) => a.owner === "blue").length;
    const bariPending = pendingApprovals.filter((a) => a.owner === "bari").length;
    return [
      {
        label: "Active launch packets",
        value: campaigns.filter((c) => campaignMatchesLaunchFilter(c, "Active")).length,
        tone: "blue" as const,
        helper: "Packets in flight before publish, learning, or hard block.",
      },
      {
        label: "Needs review",
        value: pendingApprovals.length,
        tone: "amber" as const,
        helper:
          pendingApprovals.length > 0
            ? `Pending review items — Internal ${internalPending} · Blue ${bluePending} · Bari ${bariPending}.`
            : "Launch packets with pending internal, strategy, founder voice, or readiness review.",
      },
      {
        label: "At risk",
        value: campaigns.filter((c) => campaignMatchesLaunchFilter(c, "At risk")).length,
        tone: "amber" as const,
        helper: "Risk or readiness flags need attention before launch.",
      },
      {
        label: "Ready for handoff",
        value: campaigns.filter((c) => c.status === "ready_for_keap").length,
        tone: "green" as const,
        helper: "Packets ready for the next manual handoff or launch step.",
      },
      {
        label: "Blocked",
        value: campaigns.filter((c) => campaignMatchesLaunchFilter(c, "Blocked")).length,
        tone: "red" as const,
        helper: "Packets blocked by missing source, handoff, review, or readiness items.",
      },
    ];
  }, [approvalItems, campaignRecords, campaigns, pendingReviewStatuses]);
  const [heartbeatCheckDate] = useState(() => resolveCheckDate(Date.now()));
  const activeCampaign = useMemo(
    () => selectActiveLaunchCampaign(campaigns, heartbeatCheckDate),
    [campaigns, heartbeatCheckDate],
  );

  const launchPacketName = activeCampaign?.name ?? DEMO_LAUNCH_PACKET;
  const readinessState =
    latestHeartbeat?.status === "blocked"
      ? "Blocked"
      : latestHeartbeat?.status === "at_risk"
        ? "At risk"
        : latestHeartbeat?.status === "needs_attention"
          ? "Needs attention"
          : latestHeartbeat?.status === "clear"
            ? "Clear"
            : latestHeartbeat?.status === "no_active_campaign"
              ? "No active packet"
              : activeCampaign?.riskLevel === "red"
                ? "At risk"
                : activeCampaign?.riskLevel === "yellow"
                  ? "Needs attention"
                  : activeCampaign
                    ? "In progress"
                    : "Planned prep";
  const suggestedNext =
    latestHeartbeat?.recommendedActions?.[0] ??
    activeCampaign?.nextAction ??
    "Capture scheduled YouTube link, then send handoffs to Emailmarketing.com and Brandon.";
  const checkpointLabel = latestHeartbeat?.currentCheckpoint ?? "Run Campaign Heartbeat for today’s checkpoint";
  const missingLine =
    latestHeartbeat?.missingItems?.length ? latestHeartbeat.missingItems.join("; ") : heartbeatMissingFromCampaign(activeCampaign);
  const riskLine =
    latestHeartbeat?.riskItems?.length ? latestHeartbeat.riskItems.join("; ") : heartbeatRiskFromCampaign(activeCampaign);
  const lastHeartbeatAt = latestHeartbeat?.createdAt ?? activeCampaign?.heartbeatLastCheckedAt;
  const readinessRows = useMemo(() => launchReadinessRows(activeCampaign), [activeCampaign]);

  useEffect(() => {
    if (!undoTaskId) return;
    setUndoVisible(true);
    const timer = window.setTimeout(() => {
      setUndoVisible(false);
      const cleanup = window.setTimeout(() => setUndoTaskId(null), 220);
      return () => window.clearTimeout(cleanup);
    }, 4000);
    return () => window.clearTimeout(timer);
  }, [undoTaskId]);

  const completeTask = (taskId: string) => {
    void completeTodayTask({ taskId })
      .then((result) => {
        if (!result.success) {
          setFeedback("Unable to update task. Check Convex connection.");
          return;
        }
        setFeedback(null);
        setUndoTaskId(taskId);
        setUndoVisible(true);
      })
      .catch(() => {
        setFeedback("Unable to update task. Check Convex connection.");
      });
  };

  const restoreTask = (taskId: string) => {
    void restoreTodayTask({ taskId })
      .then((result) => {
        if (!result.success) {
          setFeedback("Unable to update task. Check Convex connection.");
          return;
        }
        setFeedback(null);
        if (undoTaskId === taskId) {
          setUndoTaskId(null);
          setUndoVisible(false);
        }
      })
      .catch(() => {
        setFeedback("Unable to update task. Check Convex connection.");
      });
  };

  const undoLastComplete = () => {
    if (!undoTaskId) return;
    restoreTask(undoTaskId);
  };

  const navigateFromTask = (task: TodayTaskRecord) => {
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem(
        TASK_RETURN_KEY,
        JSON.stringify({
          active: true,
          source: "today",
          destinationMode: task.destinationMode,
          taskId: task.taskId,
          returnRoute: "/dashboard",
        }),
      );
    }
    router.push(task.sourceRoute);
  };

  const priorityTone = (priority: TodayTaskRecord["priority"]) => {
    if (priority === "red") return "red";
    if (priority === "amber") return "amber";
    if (priority === "green") return "green";
    if (priority === "blue") return "blue";
    return "gray";
  };

  const heartbeatRailBadgeTone = useMemo(() => {
    if (readinessState === "Blocked" || readinessState === "At risk") return "red";
    if (readinessState === "Needs attention") return "amber";
    if (readinessState === "Clear") return "green";
    if (readinessState === "No active packet") return "gray";
    return "blue";
  }, [readinessState]);

  const runHeartbeatFromHome = useCallback(() => {
    setHeartbeatMsg(null);
    setHeartbeatRunning(true);
    void runCampaignHeartbeat({ checkType: "manual", source: "home_button" })
      .then((r) => {
        setHeartbeatRunning(false);
        setHeartbeatMsg(
          `Campaign Heartbeat completed. ${r.createdTaskIds.length} new task(s), ${r.updatedTaskIds.length} updated, ${r.skippedTaskKeys.length} skipped (already done).`,
        );
      })
      .catch(() => {
        setHeartbeatRunning(false);
        setFeedback("Campaign Heartbeat could not run. Check Convex connection.");
      });
  }, [runCampaignHeartbeat]);

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <SectionHeader
        eyebrow="HOME"
        title="Daily command center"
        description="Today’s launch coordination hub: tasks, Campaign Heartbeat, handoffs, readiness, reviews, and follow-ups. Human-controlled and dry-run by default."
      />

      {homeLaunchMetrics ? (
        <div className="rounded-xl border border-slate-800 bg-slate-950/40 px-4 py-3 md:px-5">
          <p className="text-[0.65rem] font-bold uppercase tracking-[0.14em] text-slate-500">Launch packet pulse</p>
          <p className="mt-1 text-[0.65rem] leading-4 text-slate-500">
            Counts from saved launch packets and review queue. Hover a chip for detail. Blue and Bari appear when escalations are assigned.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {homeLaunchMetrics.map((item) => (
              <span
                className="inline-flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-950/70 px-3 py-1.5 text-xs text-slate-200"
                key={item.label}
                title={item.helper}
              >
                <span
                  className={`h-2 w-2 shrink-0 rounded-full ${
                    item.tone === "green"
                      ? "bg-emerald-400"
                      : item.tone === "amber"
                        ? "bg-amber-400"
                        : item.tone === "red"
                          ? "bg-rose-400"
                          : "bg-sky-400"
                  }`}
                />
                <span className="font-semibold">{item.label}</span>
                <span className="text-slate-50">{item.value}</span>
              </span>
            ))}
          </div>
        </div>
      ) : null}

      <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[minmax(0,2.1fr)_minmax(0,1fr)] lg:items-start lg:gap-6">
        <aside className="order-1 min-w-0 space-y-4 lg:sticky lg:top-24 lg:order-2 lg:self-start">
          <ControlPanel className="p-4">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-800 pb-3">
              <div className="flex min-w-0 items-start gap-2">
                <HeartPulse className="mt-0.5 h-4 w-4 shrink-0 text-sky-300" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-100">Campaign Heartbeat</p>
                  <p className="mt-1 text-xs leading-5 text-slate-400">
                    Daily checker for launch readiness, handoffs, and missing items.
                  </p>
                </div>
              </div>
              <StatusBadge tone={heartbeatRailBadgeTone}>{readinessState}</StatusBadge>
            </div>
            <p className="mt-3 text-[0.7rem] leading-5 text-slate-500">
              Hermes by Nous can coordinate approved heartbeat workflows from the office Mac mini once connected. For now, heartbeat checks stay in-app and human-triggered.
            </p>

            <div className="mt-4 grid gap-2.5 text-xs">
              <div className="flex items-baseline justify-between gap-3 border-b border-slate-800/80 py-1.5">
                <span className="shrink-0 font-bold uppercase tracking-[0.12em] text-slate-500">Active launch packet</span>
                <span className="min-w-0 truncate text-right text-slate-200">
                  {activeCampaign ? (
                    <Link className="text-sky-300 underline-offset-2 hover:underline" href={`/campaigns/${activeCampaign.id}`}>
                      {launchPacketName}
                    </Link>
                  ) : (
                    launchPacketName
                  )}
                </span>
              </div>
              <div className="flex items-baseline justify-between gap-3 border-b border-slate-800/80 py-1.5">
                <span className="font-bold uppercase tracking-[0.12em] text-slate-500">Next publish</span>
                <span className="truncate text-right text-slate-200">{activeCampaign?.publishDate?.trim() || DEMO_PUBLISH_LABEL}</span>
              </div>
              <div className="flex items-baseline justify-between gap-3 border-b border-slate-800/80 py-1.5">
                <span className="font-bold uppercase tracking-[0.12em] text-slate-500">Today’s checkpoint</span>
                <span className="min-w-0 truncate text-right text-slate-200">{checkpointLabel}</span>
              </div>
              <div className="flex items-baseline justify-between gap-3 border-b border-slate-800/80 py-1.5">
                <span className="font-bold uppercase tracking-[0.12em] text-slate-500">Last checked</span>
                <span className="shrink-0 text-right text-slate-300">{lastHeartbeatAt ? formatTimestamp(lastHeartbeatAt) : "Not run yet"}</span>
              </div>
            </div>

            <div className="mt-4 rounded-lg border border-slate-800 bg-slate-950/50 px-3 py-2.5">
              <p className="text-[0.65rem] font-bold uppercase tracking-[0.14em] text-slate-500">What needs attention</p>
              <p className="mt-1.5 text-xs leading-5 text-slate-300">
                <span className="font-semibold text-slate-200">Missing:</span> {missingLine}
              </p>
              <p className="mt-1.5 text-xs leading-5 text-slate-300">
                <span className="font-semibold text-slate-200">At risk:</span> {riskLine}
              </p>
            </div>

            <div className="mt-3 rounded-lg border border-slate-800 bg-slate-950/50 px-3 py-2.5">
              <p className="text-[0.65rem] font-bold uppercase tracking-[0.14em] text-slate-500">Next action</p>
              <p className="mt-1.5 text-sm leading-snug text-slate-100">{suggestedNext}</p>
            </div>

            {heartbeatMsg ? (
              <div className="mt-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-100">{heartbeatMsg}</div>
            ) : null}

            <div className="mt-4 flex flex-col gap-2 border-t border-slate-800 pt-4">
              <button
                className="focus-ring w-full rounded-lg border border-sky-500/60 bg-sky-500 px-3.5 py-2.5 text-sm font-semibold text-slate-950 hover:bg-sky-400 disabled:opacity-60"
                disabled={heartbeatRunning}
                onClick={runHeartbeatFromHome}
                type="button"
              >
                {heartbeatRunning ? "Running…" : "Run Campaign Heartbeat"}
              </button>
              <div className="flex flex-col gap-2 sm:flex-row sm:gap-2">
                <Link className="block flex-1" href="/intelligence/heartbeat">
                  <Button className="w-full" variant="secondary">
                    Heartbeat history
                  </Button>
                </Link>
                {!activeCampaign ? (
                  <Link className="block flex-1" href="/campaigns/new">
                    <Button className="w-full" variant="secondary">
                      Create launch packet
                    </Button>
                  </Link>
                ) : null}
              </div>
            </div>
            <p className="mt-3 text-[0.65rem] leading-4 text-slate-500">
              Reads saved Weekly Launch Packet fields only. No auto-send, auto-post, or external API calls.
            </p>
          </ControlPanel>

          <ControlPanel className="p-4">
            <p className="text-sm font-semibold text-slate-100">Launch Readiness</p>
            <p className="mt-1 text-xs leading-5 text-slate-400">
              Current launch packet status across source asset, YouTube, email, creative, social, review gates, and launch readiness. Statuses reflect saved launch packet fields, not live platform checks.
            </p>
            <div className="mt-3 space-y-2 border-t border-slate-800 pt-3">
              <div className="flex min-w-0 items-center justify-between gap-3 text-xs">
                <span className="shrink-0 text-slate-500">Active launch packet</span>
                <span className="min-w-0 truncate text-right font-medium text-slate-200" title={launchPacketName}>
                  {launchPacketName}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3 text-xs">
                <span className="text-slate-500">Publish date</span>
                <span className="shrink-0 text-slate-200">{activeCampaign?.publishDate?.trim() || DEMO_PUBLISH_LABEL}</span>
              </div>
              {readinessRows.map((row) => (
                <div className="flex min-w-0 items-center justify-between gap-3 text-xs" key={row.key}>
                  <span className="min-w-0 shrink text-slate-500">{row.label}</span>
                  <div className="max-w-[11rem] shrink-0 truncate text-right" title={row.status}>
                    <StatusBadge className="max-w-full justify-end truncate" tone={row.tone}>
                      {row.status}
                    </StatusBadge>
                  </div>
                </div>
              ))}
            </div>
          </ControlPanel>

          <ControlPanel className="p-4">
            <p className="text-sm font-semibold text-slate-100">External Follow-ups</p>
            <p className="mt-1 text-xs leading-5 text-slate-400">
              Dependencies outside the console that need manual coordination. The app does not contact these owners automatically.
            </p>
            <ul className="mt-3 space-y-2 border-t border-slate-800 pt-3">
              <li className="flex min-w-0 items-start gap-2 text-xs text-slate-300">
                <StatusDot className="mt-1 shrink-0" tone="amber" />
                <span className="min-w-0">
                  <span className="font-semibold text-slate-200">Brandon</span>
                  <span className="text-slate-500"> — </span>
                  <span className="text-slate-300">Creative brief not confirmed (follow-up needed).</span>
                </span>
              </li>
              <li className="flex min-w-0 items-start gap-2 text-xs text-slate-300">
                <StatusDot className="mt-1 shrink-0" tone="amber" />
                <span className="min-w-0">
                  <span className="font-semibold text-slate-200">Emailmarketing.com</span>
                  <span className="text-slate-500"> — </span>
                  <span className="text-slate-300">Scheduled YouTube link not confirmed.</span>
                </span>
              </li>
              <li className="flex min-w-0 items-start gap-2 text-xs text-slate-300">
                <StatusDot className="mt-1 shrink-0" tone="gray" />
                <span className="min-w-0">
                  <span className="font-semibold text-slate-200">Production Hub</span>
                  <span className="text-slate-500"> — </span>
                  <span className="text-slate-300">Thumbnail status not confirmed in packet.</span>
                </span>
              </li>
            </ul>
          </ControlPanel>
        </aside>

        <div className="order-2 min-w-0 space-y-4 lg:order-1">
          <div className="space-y-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-100">Today Tasks</h2>
              <p className="mt-1 text-sm text-slate-400">Current launch coordination tasks, reviews, handoffs, and readiness checks.</p>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <button onClick={() => setActiveTab("current")} type="button">
                  <Pill tone={activeTab === "current" ? "blue" : "gray"}>Current {currentTasks.length}</Pill>
                </button>
                <button onClick={() => setActiveTab("history")} type="button">
                  <Pill tone={activeTab === "history" ? "blue" : "gray"}>Completed {historyTasks.length}</Pill>
                </button>
              </div>
              {activeTab === "current" ? (
                <p className="text-xs text-slate-500">Click the checkbox to complete a task.</p>
              ) : null}
            </div>

            <ControlPanel className="relative p-4">
              {feedback ? (
                <div className="mb-3 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-100">
                  {feedback}
                </div>
              ) : null}

              {undoTaskId ? (
                <div
                  className={cn(
                    "pointer-events-auto absolute right-4 top-4 z-10 rounded-lg border border-slate-700 bg-slate-900/95 px-3 py-2 text-xs text-slate-200 transition-opacity duration-200",
                    undoVisible ? "opacity-100" : "opacity-0",
                  )}
                >
                  <button className="focus-ring font-semibold text-sky-200" onClick={undoLastComplete} type="button">
                    Undo
                  </button>
                </div>
              ) : null}

              <div className="space-y-3">
                {todayTasks === undefined ? (
                  <div className="rounded-xl border border-dashed border-slate-800 bg-slate-950/70 px-4 py-8 text-center text-sm text-slate-300">
                    Loading tasks from Convex.
                  </div>
                ) : !tasks.length ? (
                  <div className="rounded-xl border border-dashed border-slate-800 bg-slate-950/70 px-4 py-8 text-center text-sm text-slate-300">
                    Seeding default tasks.
                  </div>
                ) : activeTab === "current" ? (
                  currentTasks.length ? (
                    currentTasks.map((task) => (
                      <div
                        className="focus-ring flex w-full items-center gap-4 rounded-xl border border-slate-800 bg-slate-950/70 px-4 py-4 text-left transition hover:border-slate-700 hover:bg-slate-900/80"
                        key={task.taskId}
                        onClick={() => navigateFromTask(task)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            navigateFromTask(task);
                          }
                        }}
                        role="button"
                        tabIndex={0}
                      >
                        <div className="flex min-w-0 flex-1 flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-4">
                          <div className="flex shrink-0 flex-wrap items-center gap-2">
                            <StatusBadge tone={priorityTone(task.priority)}>{task.category}</StatusBadge>
                            {task.sourceType === "heartbeat" ? <Pill tone="blue">Heartbeat</Pill> : null}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-base font-semibold leading-snug text-slate-100">{task.title}</p>
                            <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-400">{task.context}</p>
                            <p className="mt-1 text-[0.68rem] font-medium uppercase tracking-[0.12em] text-slate-500">{task.sourceLabel}</p>
                          </div>
                        </div>
                        <button
                          aria-label={`Complete ${task.title}`}
                          className="focus-ring grid h-8 w-8 shrink-0 place-items-center self-center rounded border border-slate-600 bg-slate-900 text-slate-300 hover:border-slate-500"
                          onClick={(event) => {
                            event.stopPropagation();
                            completeTask(task.taskId);
                          }}
                          type="button"
                        />
                      </div>
                    ))
                  ) : (
                    <div className="rounded-xl border border-dashed border-slate-800 bg-slate-950/70 px-4 py-8 text-center">
                      <p className="text-sm leading-6 text-slate-300">
                        No current tasks. Run Campaign Heartbeat or open a launch packet to create the next set of work.
                      </p>
                      <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                        <button
                          className="focus-ring rounded-lg border border-sky-500/60 bg-sky-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-sky-400 disabled:opacity-60"
                          disabled={heartbeatRunning}
                          onClick={runHeartbeatFromHome}
                          type="button"
                        >
                          {heartbeatRunning ? "Running…" : "Run Campaign Heartbeat"}
                        </button>
                        <Link href="/campaigns">
                          <Button variant="secondary">Open Campaigns</Button>
                        </Link>
                      </div>
                    </div>
                  )
                ) : historyTasks.length ? (
                  historyTasks.map((task) => (
                    <div
                      className="focus-ring flex w-full items-center gap-4 rounded-xl border border-slate-800/90 bg-slate-950/50 px-4 py-3.5 text-left opacity-90 transition hover:border-slate-700 hover:bg-slate-900/70"
                      key={task.taskId}
                      onClick={() => navigateFromTask(task)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          navigateFromTask(task);
                        }
                      }}
                      role="button"
                      tabIndex={0}
                    >
                      <div className="flex min-w-0 flex-1 flex-col gap-1 sm:flex-row sm:items-center sm:gap-4">
                        <div className="flex shrink-0 flex-wrap items-center gap-2">
                          <StatusBadge tone="gray">{task.category}</StatusBadge>
                          {task.sourceType === "heartbeat" ? <Pill tone="blue">Heartbeat</Pill> : null}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-slate-300">{task.title}</p>
                          <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">{task.context}</p>
                          <p className="mt-1 text-[0.65rem] font-medium uppercase tracking-[0.12em] text-slate-600">
                            {task.sourceLabel} · Completed {formatTimestamp(task.completedAt)}
                          </p>
                        </div>
                      </div>
                      <button
                        className="focus-ring self-center rounded-md border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-800"
                        onClick={(event) => {
                          event.stopPropagation();
                          restoreTask(task.taskId);
                        }}
                        type="button"
                      >
                        Restore
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="rounded-xl border border-dashed border-slate-800 bg-slate-950/70 px-4 py-8 text-center text-sm text-slate-400">
                    No completed items yet.
                  </div>
                )}
              </div>
            </ControlPanel>
          </div>
        </div>
      </div>
    </div>
  );
}

export function CampaignListSection() {
  const [activeFilter, setActiveFilter] = useState("All");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [seedAttempted, setSeedAttempted] = useState(false);
  const campaignRecords = useQuery(api.campaigns.listCampaignRecords);
  const seedDefaultCampaignRecordsIfEmpty = useMutation(api.campaigns.seedDefaultCampaignRecordsIfEmpty);

  useEffect(() => {
    if (campaignRecords === undefined || campaignRecords.length > 0 || seedAttempted) return;
    setSeedAttempted(true);
    void seedDefaultCampaignRecordsIfEmpty().catch(() => {
      setFeedback("Unable to save campaign. Check Convex connection.");
      setSeedAttempted(false);
    });
  }, [campaignRecords, seedAttempted, seedDefaultCampaignRecordsIfEmpty]);

  const campaigns: Campaign[] = useMemo(() => (campaignRecords ?? []).map((record) => mapConvexCampaignRecordToCampaign(record as never)), [campaignRecords]);
  const filteredCampaigns: Campaign[] = useMemo(
    () => campaigns.filter((campaign) => campaignMatchesFilter(campaign, activeFilter)),
    [activeFilter, campaigns],
  );
  const sortedFilteredCampaigns = useMemo(() => [...filteredCampaigns].sort(sortPacketsForList), [filteredCampaigns]);

  useEffect(() => {
    if (!sortedFilteredCampaigns.length) {
      setSelectedId(null);
      return;
    }
    if (!selectedId || !sortedFilteredCampaigns.some((c) => c.id === selectedId)) {
      setSelectedId(sortedFilteredCampaigns[0].id);
    }
  }, [sortedFilteredCampaigns, selectedId]);

  const selectedCampaign = sortedFilteredCampaigns.find((campaign) => campaign.id === selectedId) ?? null;

  const summaryStrip = [
    { label: "Active", value: campaigns.filter((c) => campaignMatchesLaunchFilter(c, "Active")).length, tone: "blue" },
    { label: "Needs review", value: campaigns.filter((c) => campaignMatchesLaunchFilter(c, "Needs review")).length, tone: "amber" },
    { label: "At risk", value: campaigns.filter((c) => campaignMatchesLaunchFilter(c, "At risk")).length, tone: "amber" },
    { label: "Ready", value: campaigns.filter((c) => c.status === "ready_for_keap").length, tone: "green" },
    { label: "Blocked", value: campaigns.filter((c) => campaignMatchesLaunchFilter(c, "Blocked")).length, tone: "red" },
    { label: "Published", value: campaigns.filter((c) => c.status === "sent").length, tone: "blue" },
    { label: "Learning", value: campaigns.filter((c) => c.status === "learning_complete").length, tone: "blue" },
  ];

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <SectionHeader
        eyebrow="Launch coordination"
        title="Weekly Launch Campaigns"
        description="Plan, prepare, review, hand off, and track launch packets from source asset to YouTube release, Emailmarketing.com handoff, creative handoff, social rollout, and learning. Publishing, Production Hub sync, and external platform actions stay manual or read-only until you enable them."
        actions={
          <Link href="/campaigns/new">
            <Button>
              <Play className="mr-2 h-4 w-4" /> Create Launch Packet
            </Button>
          </Link>
        }
      />

      <ControlPanel className="p-4 md:p-5">
        {feedback ? <div className="mb-4 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-100">{feedback}</div> : null}
        <div className="mb-4 flex flex-wrap items-center gap-2 border-b border-slate-800 pb-3">
          {summaryStrip.map((item) => (
            <span className="inline-flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-950/70 px-3 py-1.5 text-xs text-slate-200" key={item.label}>
              <span className={`h-2 w-2 rounded-full ${item.tone === "green" ? "bg-emerald-400" : item.tone === "amber" ? "bg-amber-400" : item.tone === "red" ? "bg-rose-400" : "bg-sky-400"}`} />
              <span className="font-semibold">{item.label}</span>
              <span className="text-slate-50">{item.value}</span>
            </span>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-3">
          {LAUNCH_PACKET_FILTERS.map((filter) => (
            <button key={filter} onClick={() => setActiveFilter(filter)} type="button">
              <Pill tone={filter === activeFilter ? "blue" : "gray"}>{filter}</Pill>
            </button>
          ))}
        </div>

        {campaignRecords !== undefined && campaigns.length === 0 ? (
          <div className="mt-6 rounded-xl border border-dashed border-slate-700 bg-slate-950/50 px-6 py-10 text-center">
            <p className="text-sm leading-6 text-slate-300">
              No launch packets yet. Create your first launch packet to coordinate source asset, YouTube release, Emailmarketing.com handoff, creative handoff, social rollout, reviews, and readiness.
            </p>
            <div className="mt-4 flex justify-center">
              <Link href="/campaigns/new">
                <Button>
                  <Play className="mr-2 h-4 w-4" /> Create Launch Packet
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <section className="mt-4 flex flex-col gap-6 lg:grid lg:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)] lg:items-start lg:gap-6">
            <div className="order-1 min-w-0 space-y-3">
              {campaignRecords === undefined ? (
                <p className="text-sm text-slate-400">Loading launch packets from Convex.</p>
              ) : !sortedFilteredCampaigns.length ? (
                <p className="text-sm text-slate-400">No launch packets match this filter.</p>
              ) : (
                sortedFilteredCampaigns.map((campaign) => {
                  const selected = selectedCampaign?.id === campaign.id;
                  const readinessMini = launchReadinessRows(campaign);
                  return (
                    <button
                      className={cn(
                        "focus-ring w-full rounded-xl border px-4 py-4 text-left transition",
                        selected ? "border-sky-500/50 bg-slate-900/90 shadow-[inset_0_0_0_1px_rgba(56,189,248,0.25)]" : "border-slate-800 bg-slate-950/70 hover:border-slate-700 hover:bg-slate-900/80",
                      )}
                      key={campaign.id}
                      onClick={() => setSelectedId(campaign.id)}
                      type="button"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-base font-semibold text-slate-100">{campaign.name}</p>
                          <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-400">
                            {labelForCampaignKind(campaign.campaignKind ?? campaign.type)}
                            {campaign.sourceProductionAssetTitle?.trim() ? ` · ${campaign.sourceProductionAssetTitle}` : ""}
                            {campaign.campaignAngle?.trim() ? ` · ${campaign.campaignAngle}` : ""}
                          </p>
                        </div>
                        <div className="flex shrink-0 flex-col items-end gap-2">
                          <StatusBadge tone={statusToneForPacket(campaign)}>{displayPacketStatus(campaign)}</StatusBadge>
                          <span className="text-xs text-slate-400">{campaign.publishDate?.trim() || "Publish date not set"}</span>
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {readinessMini.map((row) => (
                          <span
                            className="inline-flex items-center gap-1 rounded-md border border-slate-800 bg-slate-950/90 px-2 py-0.5 text-[0.65rem] font-medium text-slate-300"
                            key={row.key}
                          >
                            <span className="text-slate-500">{row.label}:</span>
                            <span className="max-w-[7rem] truncate text-slate-200">{row.status}</span>
                          </span>
                        ))}
                      </div>
                      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-800/80 pt-3 text-xs text-slate-400">
                        <span className="min-w-0 flex-1 text-slate-300">
                          <span className="font-semibold text-slate-500">Next: </span>
                          <span className="line-clamp-2">{campaign.nextAction}</span>
                        </span>
                        <span className="shrink-0 text-slate-500">Owner: {ownerName(campaign)}</span>
                      </div>
                      <div className="mt-2 flex justify-end">
                        <Link className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.14em] text-sky-300 hover:text-sky-200" href={`/campaigns/${campaign.id}`} onClick={(e) => e.stopPropagation()}>
                          Open packet
                        </Link>
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            <aside className="order-2 min-w-0 lg:sticky lg:top-24 lg:self-start">
              <ControlPanel className="p-4">
                {selectedCampaign ? (
                  <div className="space-y-5 text-sm">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Summary</p>
                      <p className="mt-2 text-lg font-semibold leading-snug text-slate-100">{selectedCampaign.name}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <StatusBadge tone={statusToneForPacket(selectedCampaign)}>{displayPacketStatus(selectedCampaign)}</StatusBadge>
                        <span className="text-xs text-slate-400">{labelForCampaignKind(selectedCampaign.campaignKind ?? selectedCampaign.type)}</span>
                      </div>
                      <dl className="mt-3 space-y-2 text-xs">
                        <div className="flex justify-between gap-3">
                          <dt className="text-slate-500">Publish date</dt>
                          <dd className="text-right text-slate-200">{selectedCampaign.publishDate?.trim() || "Not set"}</dd>
                        </div>
                        <div className="flex justify-between gap-3">
                          <dt className="text-slate-500">Owner</dt>
                          <dd className="text-right text-slate-200">{ownerName(selectedCampaign)}</dd>
                        </div>
                        <div className="flex justify-between gap-3">
                          <dt className="text-slate-500">Primary audience</dt>
                          <dd className="max-w-[14rem] text-right text-slate-200">{selectedCampaign.primaryAudience?.trim() || selectedCampaign.audience}</dd>
                        </div>
                        <div className="flex justify-between gap-3">
                          <dt className="text-slate-500">Primary CTA</dt>
                          <dd className="max-w-[14rem] text-right text-slate-200">{selectedCampaign.primaryCta?.trim() || offerName(selectedCampaign)}</dd>
                        </div>
                      </dl>
                    </div>

                    <div className="border-t border-slate-800 pt-4">
                      <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Readiness</p>
                      <p className="mt-1 text-[0.7rem] text-slate-500">Statuses reflect saved launch packet fields, not live platform checks.</p>
                      <div className="mt-3 space-y-2">
                        {launchReadinessRows(selectedCampaign).map((row) => (
                          <div className="flex items-center justify-between gap-2 text-xs" key={row.key}>
                            <span className="text-slate-500">{row.label}</span>
                            <StatusBadge className="max-w-[10rem] shrink-0 truncate" tone={row.tone}>
                              {row.status}
                            </StatusBadge>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="border-t border-slate-800 pt-4">
                      <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Handoffs</p>
                      <dl className="mt-2 space-y-2 text-xs">
                        <div className="flex justify-between gap-3">
                          <dt className="text-slate-500">Emailmarketing.com</dt>
                          <dd className="text-right text-slate-200">{emailHandoffLine(selectedCampaign)}</dd>
                        </div>
                        <div className="flex justify-between gap-3">
                          <dt className="text-slate-500">Creative (Brandon)</dt>
                          <dd className="text-right text-slate-200">{shortPacketStatus(selectedCampaign.creativeBriefStatus)}</dd>
                        </div>
                        <div className="flex justify-between gap-3">
                          <dt className="text-slate-500">Source asset</dt>
                          <dd className="max-w-[12rem] truncate text-right text-slate-200" title={selectedCampaign.sourceProductionAssetTitle ?? ""}>
                            {selectedCampaign.sourceProductionAssetTitle?.trim() || "Not selected"}
                          </dd>
                        </div>
                      </dl>
                    </div>

                    <div className="border-t border-slate-800 pt-4">
                      <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Review / next action</p>
                      <dl className="mt-2 space-y-2 text-xs">
                        <div className="flex justify-between gap-3">
                          <dt className="text-slate-500">Pending reviews</dt>
                          <dd className="text-right text-slate-200">{pendingApprovals(selectedCampaign)}</dd>
                        </div>
                        <div className="flex flex-col gap-1">
                          <dt className="text-slate-500">Next action</dt>
                          <dd className="text-slate-100">{selectedCampaign.nextAction}</dd>
                        </div>
                        {selectedCampaign.blockers?.length ? (
                          <div className="flex flex-col gap-1">
                            <dt className="text-slate-500">Blockers</dt>
                            <dd className="text-amber-200/90">{selectedCampaign.blockers.join("; ")}</dd>
                          </div>
                        ) : null}
                        <div className="flex justify-between gap-3">
                          <dt className="text-slate-500">Audience / source mapping</dt>
                          <dd className="max-w-[12rem] text-right text-slate-200">{sourceAudienceLine(selectedCampaign)}</dd>
                        </div>
                        <div className="flex justify-between gap-3">
                          <dt className="text-slate-500">Stage</dt>
                          <dd className="text-right text-slate-200">{stageLabelForCampaign(selectedCampaign)}</dd>
                        </div>
                      </dl>
                    </div>

                    <div className="flex flex-col gap-2 border-t border-slate-800 pt-4">
                      <Link href={`/campaigns/${selectedCampaign.id}`}>
                        <Button className="w-full" variant="secondary">
                          Open full launch packet
                        </Button>
                      </Link>
                      <div className="flex flex-wrap gap-2">
                        {selectedCampaign.pendingApprovals.includes("bari") ? (
                          <Link href="/reviews/bari">
                            <Button variant="secondary">Bari review</Button>
                          </Link>
                        ) : null}
                        {selectedCampaign.pendingApprovals.includes("blue") ? (
                          <Link href="/reviews/blue">
                            <Button variant="secondary">Blue review</Button>
                          </Link>
                        ) : null}
                        {selectedCampaign.status === "ready_for_keap" ? (
                          <Link href="/reviews/internal">
                            <Button variant="secondary">Internal approval</Button>
                          </Link>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-slate-400">
                    {sortedFilteredCampaigns.length ? "Select a launch packet from the list." : "No packets match this filter. Try another filter or create a launch packet."}
                  </p>
                )}
              </ControlPanel>
            </aside>
          </section>
        )}
      </ControlPanel>
    </div>
  );
}

export function CampaignIntakeSection() {
  const appUser = useAppUser();
  const router = useRouter();
  const [feedback, setFeedback] = useState<string | null>(null);
  const [form, setForm] = useState({
    campaignName: "",
    campaignGoal: "",
    campaignType: "",
    campaignKind: "weekly_content_launch",
    launchType: "youtube_full_video",
    publishDate: "",
    prepWeekStart: "",
    campaignAngle: "",
    primaryAudience: "",
    sourceProductionAssetId: "",
    sourceAssetTitle: "",
    sourceAssetUrl: "",
    frameIoUrl: "",
    muxPlaybackId: "",
    transcriptStatus: "",
    thumbnailStatus: "",
    assetReadinessStatus: "",
    relatedShortsNotes: "",
    productionNotes: "",
    creativeOwner: "Brandon",
    readinessStatus: "not_started",
    audienceSegment: "",
    exclusions: "",
    sourceMapping: "",
    offerSelection: "",
    promiseCta: "",
    allowedClaims: "",
    sendWindow: "",
    successMetric: "",
    primaryCta: "",
    youtubeTitle: "",
    youtubeDescription: "",
    emailBriefBody: "",
    creativeBriefBody: "",
    rolloutNotes: "",
  });
  const libraryRecords = useQuery(api.library.listLibraryItems);
  const prodAssetsProbe = useQuery(api.productionAssets.listProductionAssets, { limit: 1 });
  const createCampaignRecord = useMutation(api.campaigns.createCampaignRecord);
  const seedDefaultProductionAssetsIfEmpty = useMutation(api.productionAssets.seedDefaultProductionAssetsIfEmpty);
  const actorName = appUser.displayName || appUser.clerkUserId || "console_operator";
  const actorId = appUser.clerkUserId || "user_operator";

  useEffect(() => {
    if (prodAssetsProbe === undefined || prodAssetsProbe.length > 0) return;
    void seedDefaultProductionAssetsIfEmpty().catch(() => {
      /* non-fatal */
    });
  }, [prodAssetsProbe, seedDefaultProductionAssetsIfEmpty]);

  const handleSelectProductionAsset = useCallback((asset: Parameters<typeof applyProductionAssetToFormFields>[0]) => {
    const snap = applyProductionAssetToFormFields(asset);
    setForm((f) => ({
      ...f,
      ...snap,
      sourceAssetTitle: snap.sourceProductionAssetTitle,
      sourceAssetUrl: snap.sourceProductionAssetUrl,
    }));
  }, []);

  const bariApprovalRequired = useMemo(() => {
    const source = `${form.campaignName} ${form.campaignGoal} ${form.campaignType} ${form.offerSelection}`.toLowerCase();
    return source.includes("founder") || source.includes("reactivation") || source.includes("bari");
  }, [form]);
  const blueApprovalRequired = useMemo(() => {
    const source = `${form.campaignName} ${form.campaignGoal} ${form.campaignType} ${form.promiseCta} ${form.allowedClaims}`.toLowerCase();
    return source.includes("webinar") || source.includes("guarantee") || source.includes("urgency") || source.includes("claim");
  }, [form]);
  const audienceSourceReady = form.sourceMapping.trim().length > 0;
  const checklist = [
    { label: "Source asset selected or manual source planned", complete: Boolean(form.sourceProductionAssetId.trim() || form.sourceAssetTitle.trim()), tone: "green" },
    { label: "Launch name added", complete: Boolean(form.campaignName.trim()), tone: "green" },
    { label: "Goal or angle defined", complete: Boolean(form.campaignGoal.trim() || form.campaignAngle.trim()), tone: "green" },
    { label: "Audience selected", complete: Boolean(form.audienceSegment.trim()), tone: "green" },
    { label: "CTA selected", complete: Boolean(form.primaryCta.trim() || form.promiseCta.trim()), tone: "green" },
    { label: "Publish date set", complete: Boolean(form.publishDate.trim()), tone: "green" },
    { label: "Email handoff notes started", complete: Boolean(form.emailBriefBody.trim()), tone: "amber" },
    { label: "Creative handoff notes started", complete: Boolean(form.creativeBriefBody.trim()), tone: "amber" },
    {
      label: "Audience source identified",
      complete: audienceSourceReady,
      tone: "amber",
      detail: "Optional. Newsletter segment, prior attendees, CRM tag, or manual list.",
    },
  ];
  const intakeSections: Array<{
    heading: string;
    helper: string;
    items: Array<{ label: string; placeholder: string; field: keyof typeof form; multiline?: boolean }>;
  }> = [
    {
      heading: "Launch intent",
      helper: "Name the packet and describe what this weekly launch should achieve.",
      items: [
        { label: "Launch packet name", placeholder: "Example: Weekly Launch — Virtual Events Still Matter", field: "campaignName" },
        { label: "Campaign goal", placeholder: "Example: Drive views and registrations from next week’s full-video release", field: "campaignGoal" },
        { label: "Campaign kind (describe)", placeholder: "Example: Weekly content launch, event campaign, shorts rollout", field: "campaignType" },
      ],
    },
    {
      heading: "Audience and CTA",
      helper: "Who this launch speaks to, exclusions, and how you will track the audience source.",
      items: [
        { label: "Audience / segment", placeholder: "Example: Speakers, authors, coaches, prior attendees, or warm YouTube viewers", field: "audienceSegment" },
        { label: "Allowed exclusions", placeholder: "One exclusion per line", field: "exclusions", multiline: true },
        { label: "Source mapping", placeholder: "Example: Newsletter segment, warm audience, prior attendees, manual list, or CRM tag", field: "sourceMapping" },
      ],
    },
    {
      heading: "Offer / CTA",
      helper: "Define the main next step, offer, and any approved claims for this launch.",
      items: [
        { label: "Offer selection", placeholder: "Example: Watch the full video, register for the September event, join the waitlist, or get the guide", field: "offerSelection" },
        { label: "Promise / CTA", placeholder: "Example: Watch the full video or register for the event", field: "promiseCta" },
        { label: "Allowed claims", placeholder: "One approved claim per line", field: "allowedClaims", multiline: true },
      ],
    },
    {
      heading: "Initial copy and handoff notes",
      helper: "Add initial timing, success metric, YouTube copy, Emailmarketing.com brief notes, creative brief notes, and social rollout notes.",
      items: [
        { label: "Send window", placeholder: "Example: Launch week mornings", field: "sendWindow" },
        { label: "Success metric", placeholder: "Example: YouTube views, email clicks, registrations, replies", field: "successMetric" },
        { label: "Primary CTA", placeholder: "Example: Watch the full video or register for the event", field: "primaryCta" },
        { label: "YouTube title (optional)", placeholder: "Draft public title", field: "youtubeTitle" },
        { label: "YouTube description (optional)", placeholder: "Draft description", field: "youtubeDescription", multiline: true },
        { label: "Email brief body (optional)", placeholder: "Paste Emailmarketing.com brief draft", field: "emailBriefBody", multiline: true },
        { label: "Creative brief body (optional)", placeholder: "Paste Brandon / creative brief", field: "creativeBriefBody", multiline: true },
        { label: "Social rollout notes (optional)", placeholder: "Cadence, platform notes, reels, captions, memes", field: "rolloutNotes", multiline: true },
      ],
    },
  ];

  const updateField = (field: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const saveCampaign = async (mode: "save" | "draft") => {
    const status = mode === "draft" ? "agent_drafting" : "intake_draft";
    const stage = mode === "draft" ? "Copy" : "Intake";
    const nextAction =
      mode === "draft"
        ? "Copy Intelligence draft queued from intake (dry-run; no send or post)."
        : "Continue shaping the launch packet from the Campaigns list.";
    const riskLevel = blueApprovalRequired ? "red" : bariApprovalRequired ? "yellow" : "green";
    const pendingApprovals = [
      ...(bariApprovalRequired ? (["bari"] as const) : []),
      ...(blueApprovalRequired ? (["blue"] as const) : []),
      "internal",
    ];
    const availableLibraryRecords = (libraryRecords ?? []) as Array<{ type: string; name: string; recordId: string }>;
    const matchingOffer = availableLibraryRecords.find((item) => item.type !== "audience" && item.name.toLowerCase() === form.offerSelection.trim().toLowerCase());
    const matchingAudience = availableLibraryRecords.find((item) => item.type === "audience" && item.name.toLowerCase() === form.audienceSegment.trim().toLowerCase());

    try {
      const campaignId = createCampaignId();
      const weeklyChannels = form.campaignKind === "weekly_content_launch" || form.campaignKind === "weekly_launch";
      const patch = Object.fromEntries(
        Object.entries({
          name: form.campaignName.trim() || "Untitled campaign",
          type: form.campaignType.trim() || "campaign",
          goal: form.campaignGoal.trim() || "Campaign goal",
          channels: weeklyChannels ? (["email", "youtube", "social"] as const) : (["email"] as const),
          audience: form.audienceSegment.trim() || "Unspecified audience",
          audienceId: matchingAudience?.recordId,
          offer: form.offerSelection.trim() || "No offer selected",
          offerId: matchingOffer?.recordId,
          primaryCta: form.primaryCta.trim() || form.promiseCta.trim() || undefined,
          sendWindow: form.sendWindow.trim() || undefined,
          successMetric: form.successMetric.trim() || undefined,
          allowedClaims: splitLines(form.allowedClaims),
          knownExclusions: splitLines(form.exclusions),
          sourceMapping: form.sourceMapping.trim() || undefined,
          keapTagMapping: form.sourceMapping.trim() || undefined,
          ownerId: actorId,
          ownerName: actorName,
          stage,
          status,
          riskLevel,
          pendingApprovals,
          bariApprovalRequired,
          blueApprovalRequired,
          internalApprovalRequired: true,
          bariApprovalStatus: bariApprovalRequired ? "pending" : undefined,
          blueApprovalStatus: blueApprovalRequired ? "pending" : undefined,
          internalApprovalStatus: "pending",
          copyStatus: mode === "draft" ? "Drafting in progress" : "Intake saved",
          keapPrepStatus: audienceSourceReady ? "Audience / source mapping noted" : "Add audience or source mapping when ready",
          responseStatus: "Queued",
          learningStatus: "Pending",
          nextAction,
          notes: form.promiseCta.trim() || undefined,
          campaignKind: form.campaignKind.trim() || undefined,
          launchType: form.launchType.trim() || undefined,
          publishDate: form.publishDate.trim() || undefined,
          prepWeekStart: form.prepWeekStart.trim() || undefined,
          readinessStatus: form.readinessStatus.trim() || undefined,
          campaignAngle: form.campaignAngle.trim() || undefined,
          primaryAudience: form.primaryAudience.trim() || form.audienceSegment.trim() || undefined,
          sourceProductionAssetId: form.sourceProductionAssetId.trim() || undefined,
          sourceProductionAssetTitle: form.sourceAssetTitle.trim() || undefined,
          sourceProductionAssetUrl: form.sourceAssetUrl.trim() || undefined,
          frameIoUrl: form.frameIoUrl.trim() || undefined,
          muxPlaybackId: form.muxPlaybackId.trim() || undefined,
          transcriptStatus: form.transcriptStatus.trim() || undefined,
          thumbnailStatus: form.thumbnailStatus.trim() || undefined,
          assetReadinessStatus: form.assetReadinessStatus.trim() || undefined,
          relatedShortsNotes: form.relatedShortsNotes.trim() || undefined,
          productionNotes: form.productionNotes.trim() || undefined,
          creativeOwner: form.creativeOwner.trim() || undefined,
          youtubeTitle: form.youtubeTitle.trim() || undefined,
          youtubeDescription: form.youtubeDescription.trim() || undefined,
          emailBriefBody: form.emailBriefBody.trim() || undefined,
          creativeBriefBody: form.creativeBriefBody.trim() || undefined,
          rolloutNotes: form.rolloutNotes.trim() || undefined,
        }).filter(([, value]) => value !== undefined),
      );
      await createCampaignRecord({
        campaignId,
        patch: patch as never,
      });
      router.push("/campaigns");
    } catch {
      setFeedback("Unable to save campaign. Check Convex connection.");
    }
  };

  return (
    <div className="mx-auto w-full max-w-7xl space-y-5">
      <div>
        <SectionHeader
          eyebrow="Launch packet"
          title="Create Launch Packet"
          description="Start from a production asset, campaign idea, or manual intake. A launch packet keeps the source asset, YouTube release, Emailmarketing.com brief, creative handoff, social rollout, approvals, and readiness tasks organized in one place."
          actions={
            <button onClick={() => void saveCampaign("draft")} type="button">
              <Button variant="secondary">
                <Play className="mr-2 h-4 w-4" /> Draft with Copy Intelligence
              </Button>
            </button>
          }
        />
        <p className="mt-2 text-xs text-slate-500">Draft with Copy Intelligence is draft-only. It does not send, post, or publish.</p>
      </div>
      {feedback ? <ControlPanel className="border-sky-500/30 bg-sky-500/10 p-3 text-sm text-sky-100">{feedback}</ControlPanel> : null}
      <section className="flex flex-col gap-6 lg:grid lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] lg:items-start lg:gap-6">
        <aside className="order-1 space-y-4 lg:sticky lg:top-24 lg:order-2 lg:self-start">
          <ControlPanel className="p-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div>
                <p className="text-sm font-semibold text-slate-100">Launch Packet Checklist</p>
                <p className="mt-1 text-xs text-slate-500">
                  Complete the basics before saving. Review and approval routing can be refined after the packet is created.
                </p>
              </div>
              <StatusBadge tone="blue">
                {checklist.filter((item) => item.complete).length}/{checklist.length}
              </StatusBadge>
            </div>
            <div className="mt-4 rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2 text-xs text-slate-300">
              <p className="font-semibold text-slate-200">Selected source asset</p>
              {form.sourceAssetTitle.trim() || form.sourceProductionAssetId.trim() ? (
                <dl className="mt-2 space-y-1">
                  <div className="flex justify-between gap-2">
                    <dt className="text-slate-500">Title</dt>
                    <dd className="max-w-[12rem] truncate text-right text-slate-100">{form.sourceAssetTitle.trim() || "—"}</dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-slate-500">Readiness</dt>
                    <dd className="text-right text-slate-100">{form.assetReadinessStatus ? formatLabel(form.assetReadinessStatus) : "—"}</dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-slate-500">Transcript</dt>
                    <dd className="text-right text-slate-100">{form.transcriptStatus ? formatLabel(form.transcriptStatus) : "—"}</dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-slate-500">Shorts</dt>
                    <dd className="text-right text-slate-100">{form.relatedShortsNotes.trim() ? "See notes" : "—"}</dd>
                  </div>
                </dl>
              ) : (
                <p className="mt-2 text-slate-500">No source asset selected.</p>
              )}
            </div>
            <div className="mt-4">
              <ReadinessChecklist items={checklist} />
            </div>
            <div className="mt-4 rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2 text-xs text-slate-400">
              <p className="font-semibold text-slate-200">Review routing</p>
              <p className="mt-1 leading-relaxed">
                Optional after save. Add Blue or Bari review only when strategy, claims, founder voice, or sensitive copy needs escalation.
              </p>
            </div>
            <button className="mt-4 w-full" onClick={() => void saveCampaign("save")} type="button">
              <Button className="w-full">Save Launch Packet</Button>
            </button>
          </ControlPanel>
        </aside>

        <div className="order-2 min-w-0 space-y-4 lg:order-1">
          <ControlPanel className="p-4">
            <p className="text-sm font-semibold text-slate-100">Source asset</p>
            <p className="mt-1 text-xs leading-5 text-slate-400">
              Select a production asset to start from, or leave blank and enter source details manually in Launch Defaults.
            </p>
            <div className="mt-3 space-y-3">
              <ProductionBridgeAssetPicker onSelect={handleSelectProductionAsset} />
              {form.sourceProductionAssetId.trim() || form.sourceAssetTitle.trim() ? (
                <div className="rounded-lg border border-emerald-500/25 bg-emerald-500/5 px-3 py-2 text-xs text-emerald-100/90">
                  Source asset fields are populated when a Production Bridge asset is selected. You can edit them manually in Launch Defaults if needed.
                </div>
              ) : null}
            </div>
          </ControlPanel>
          {intakeSections.map((section) => (
            <ControlPanel key={section.heading} className="p-4">
              <div className="mb-4 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-sky-300" />
                <p className="text-sm font-semibold text-slate-100">{section.heading}</p>
              </div>
              <p className="mb-4 text-sm text-slate-300">{section.helper}</p>
              <div className="grid gap-3 md:grid-cols-2">
                {section.items.map((item) => (
                  <label key={item.label} className="grid gap-2 text-sm text-slate-200">
                    <span className="font-medium">{item.label}</span>
                    <div className="rounded-lg border border-slate-700 bg-slate-950/90 p-3">
                      {item.multiline ? (
                        <textarea
                          className="min-h-[5rem] w-full border-0 bg-transparent text-sm text-slate-100 outline-none placeholder:text-slate-500"
                          onChange={(event) => updateField(item.field, event.target.value)}
                          placeholder={item.placeholder}
                          value={form[item.field]}
                        />
                      ) : (
                        <input
                          className="w-full border-0 bg-transparent text-sm text-slate-100 outline-none placeholder:text-slate-500"
                          onChange={(event) => updateField(item.field, event.target.value)}
                          placeholder={item.placeholder}
                          value={form[item.field]}
                        />
                      )}
                    </div>
                  </label>
                ))}
              </div>
            </ControlPanel>
          ))}
          <ControlPanel className="p-4">
            <p className="text-sm font-semibold text-slate-100">Launch Defaults</p>
            <p className="mt-1 text-xs text-slate-500">
              Saved to the new launch packet. These can be edited later from the packet detail page. Source asset fields populate from Production Bridge when
              you select an asset above.
            </p>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <label className="grid gap-2 text-sm text-slate-200">
                <span className="font-medium">Campaign kind</span>
                <select
                  className="rounded-lg border border-slate-700 bg-slate-950/90 px-3 py-2 text-sm text-slate-100"
                  onChange={(event) => updateField("campaignKind", event.target.value)}
                  value={form.campaignKind}
                >
                  {selectOptionsFromLabels(CAMPAIGN_KIND_LABELS).map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-2 text-sm text-slate-200">
                <span className="font-medium">Launch type</span>
                <select
                  className="rounded-lg border border-slate-700 bg-slate-950/90 px-3 py-2 text-sm text-slate-100"
                  onChange={(event) => updateField("launchType", event.target.value)}
                  value={form.launchType}
                >
                  {selectOptionsFromLabels(LAUNCH_TYPE_LABELS).map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-2 text-sm text-slate-200">
                <span className="font-medium">Publish date</span>
                <input
                  className="rounded-lg border border-slate-700 bg-slate-950/90 px-3 py-2 text-sm text-slate-100"
                  onChange={(event) => updateField("publishDate", event.target.value)}
                  type="date"
                  value={form.publishDate}
                />
              </label>
              <label className="grid gap-2 text-sm text-slate-200">
                <span className="font-medium">Prep week start (Monday)</span>
                <input
                  className="rounded-lg border border-slate-700 bg-slate-950/90 px-3 py-2 text-sm text-slate-100"
                  onChange={(event) => updateField("prepWeekStart", event.target.value)}
                  type="date"
                  value={form.prepWeekStart}
                />
              </label>
              <label className="grid gap-2 text-sm text-slate-200 md:col-span-2">
                <span className="font-medium">Campaign angle</span>
                <textarea
                  className="min-h-[4rem] w-full rounded-lg border border-slate-700 bg-slate-950/90 px-3 py-2 text-sm text-slate-100"
                  onChange={(event) => updateField("campaignAngle", event.target.value)}
                  placeholder="Strategic angle for this launch"
                  value={form.campaignAngle}
                />
              </label>
              <label className="grid gap-2 text-sm text-slate-200 md:col-span-2">
                <span className="font-medium">Primary audience</span>
                <span className="text-xs font-normal text-slate-500">Optional. If blank, Audience / segment from above is used when you save.</span>
                <input
                  className="rounded-lg border border-slate-700 bg-slate-950/90 px-3 py-2 text-sm text-slate-100"
                  onChange={(event) => updateField("primaryAudience", event.target.value)}
                  placeholder="Refine audience description for packet detail"
                  value={form.primaryAudience}
                />
              </label>
              <label className="grid gap-2 text-sm text-slate-200 md:col-span-2">
                <span className="font-medium">Source Production Asset ID</span>
                <input
                  className="rounded-lg border border-slate-700 bg-slate-950/90 px-3 py-2 text-sm text-slate-100"
                  onChange={(event) => updateField("sourceProductionAssetId", event.target.value)}
                  placeholder="From Production Bridge cache or leave blank for manual-only"
                  value={form.sourceProductionAssetId}
                />
              </label>
              <label className="grid gap-2 text-sm text-slate-200">
                <span className="font-medium">Source asset title</span>
                <input
                  className="rounded-lg border border-slate-700 bg-slate-950/90 px-3 py-2 text-sm text-slate-100"
                  onChange={(event) => updateField("sourceAssetTitle", event.target.value)}
                  placeholder="Working title from Production Hub or manual"
                  value={form.sourceAssetTitle}
                />
              </label>
              <label className="grid gap-2 text-sm text-slate-200">
                <span className="font-medium">Source asset URL</span>
                <input
                  className="rounded-lg border border-slate-700 bg-slate-950/90 px-3 py-2 text-sm text-slate-100"
                  onChange={(event) => updateField("sourceAssetUrl", event.target.value)}
                  placeholder="https://…"
                  value={form.sourceAssetUrl}
                />
              </label>
              <label className="grid gap-2 text-sm text-slate-200">
                <span className="font-medium">Frame.io URL</span>
                <input
                  className="rounded-lg border border-slate-700 bg-slate-950/90 px-3 py-2 text-sm text-slate-100"
                  onChange={(event) => updateField("frameIoUrl", event.target.value)}
                  value={form.frameIoUrl}
                />
              </label>
              <label className="grid gap-2 text-sm text-slate-200">
                <span className="font-medium">Mux playback ID</span>
                <input
                  className="rounded-lg border border-slate-700 bg-slate-950/90 px-3 py-2 text-sm text-slate-100"
                  onChange={(event) => updateField("muxPlaybackId", event.target.value)}
                  value={form.muxPlaybackId}
                />
              </label>
              <label className="grid gap-2 text-sm text-slate-200">
                <span className="font-medium">Transcript status</span>
                <select
                  className="rounded-lg border border-slate-700 bg-slate-950/90 px-3 py-2 text-sm text-slate-100"
                  onChange={(event) => updateField("transcriptStatus", event.target.value)}
                  value={form.transcriptStatus}
                >
                  <option value="">Not set</option>
                  {selectOptionsFromLabels(TRANSCRIPT_STATUS_LABELS).map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-2 text-sm text-slate-200">
                <span className="font-medium">Thumbnail status</span>
                <select
                  className="rounded-lg border border-slate-700 bg-slate-950/90 px-3 py-2 text-sm text-slate-100"
                  onChange={(event) => updateField("thumbnailStatus", event.target.value)}
                  value={form.thumbnailStatus}
                >
                  <option value="">Not set</option>
                  {selectOptionsFromLabels(THUMBNAIL_STATUS_LABELS).map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-2 text-sm text-slate-200">
                <span className="font-medium">Asset readiness</span>
                <select
                  className="rounded-lg border border-slate-700 bg-slate-950/90 px-3 py-2 text-sm text-slate-100"
                  onChange={(event) => updateField("assetReadinessStatus", event.target.value)}
                  value={form.assetReadinessStatus}
                >
                  <option value="">Not set</option>
                  {selectOptionsFromLabels(ASSET_READINESS_LABELS).map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-2 text-sm text-slate-200 md:col-span-2">
                <span className="font-medium">Related shorts / reels notes</span>
                <textarea
                  className="min-h-[3rem] w-full rounded-lg border border-slate-700 bg-slate-950/90 px-3 py-2 text-sm text-slate-100"
                  onChange={(event) => updateField("relatedShortsNotes", event.target.value)}
                  value={form.relatedShortsNotes}
                />
              </label>
              <label className="grid gap-2 text-sm text-slate-200 md:col-span-2">
                <span className="font-medium">Production notes</span>
                <textarea
                  className="min-h-[3rem] w-full rounded-lg border border-slate-700 bg-slate-950/90 px-3 py-2 text-sm text-slate-100"
                  onChange={(event) => updateField("productionNotes", event.target.value)}
                  value={form.productionNotes}
                />
              </label>
              <label className="grid gap-2 text-sm text-slate-200">
                <span className="font-medium">Creative owner</span>
                <input
                  className="rounded-lg border border-slate-700 bg-slate-950/90 px-3 py-2 text-sm text-slate-100"
                  onChange={(event) => updateField("creativeOwner", event.target.value)}
                  value={form.creativeOwner}
                />
              </label>
              <label className="grid gap-2 text-sm text-slate-200">
                <span className="font-medium">Initial readiness</span>
                <select
                  className="rounded-lg border border-slate-700 bg-slate-950/90 px-3 py-2 text-sm text-slate-100"
                  onChange={(event) => updateField("readinessStatus", event.target.value)}
                  value={form.readinessStatus}
                >
                  {selectOptionsFromLabels(READINESS_STATUS_LABELS).map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </ControlPanel>
          <button className="mt-4 w-full" onClick={() => void saveCampaign("save")} type="button">
            <Button className="w-full" variant="secondary">
              Save Launch Packet
            </Button>
          </button>
        </div>
      </section>
    </div>
  );
}

export function CampaignDetailSection({ campaignId }: { campaignId?: string }) {
  const [seedAttempted, setSeedAttempted] = useState(false);
  const allCampaigns = useQuery(api.campaigns.listCampaignRecords);
  const seedDefaultCampaignRecordsIfEmpty = useMutation(api.campaigns.seedDefaultCampaignRecordsIfEmpty);

  useEffect(() => {
    if (allCampaigns === undefined || allCampaigns.length > 0 || seedAttempted) return;
    setSeedAttempted(true);
    void seedDefaultCampaignRecordsIfEmpty().catch(() => {
      setSeedAttempted(false);
    });
  }, [allCampaigns, seedAttempted, seedDefaultCampaignRecordsIfEmpty]);

  if (!campaignId) {
    return <div className="p-4 text-sm text-slate-300">No campaign selected.</div>;
  }
  return <CampaignLaunchPacketDetail campaignId={campaignId} />;
}

export function CampaignRouteSection({ slug }: { slug?: string[] }) {
  if (slug?.[1] === "new" || slug?.[1] === "create") return <CampaignIntakeSection />;
  if (slug?.[1]) return <CampaignDetailSection campaignId={slug[1]} />;
  return <CampaignListSection />;
}
