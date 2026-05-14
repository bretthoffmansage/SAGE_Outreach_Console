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
import type { Campaign, TodayTaskRecord } from "@/lib/domain";
import { useAppUser } from "@/components/auth/app-user-context";
import {
  Button,
  ConsoleTable,
  ControlPanel,
  InlineAction,
  Pill,
  QueueLane,
  ReadinessChecklist,
  SectionHeader,
  StatusBadge,
  StatusDot,
  Td,
  Th,
  TableHead,
} from "@/components/ui";
import { cn } from "@/lib/utils";

const filters = ["All", "Needs Bari", "Needs Blue", "Ready for Keap", "Sent", "Learning", "Blocked"];

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
    ready_for_keap: "Keap Prep",
    sent: "Sent",
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
  if (filter === "All") return true;
  if (filter === "Needs Bari") return campaign.pendingApprovals.includes("bari");
  if (filter === "Needs Blue") return campaign.pendingApprovals.includes("blue");
  if (filter === "Ready for Keap") return campaign.status === "ready_for_keap";
  if (filter === "Sent") return campaign.status === "sent";
  if (filter === "Learning") return campaign.status === "learning_complete";
  if (filter === "Blocked") return campaign.status === "blocked";
  return true;
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

const DEMO_LAUNCH_PACKET = "Weekly Launch — Virtual Event Cost Shift";
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
  if (campaign.status === "ready_for_keap" && !campaign.keapTagMapping?.trim()) parts.push("Keap tag mapping");
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
  const [heartbeatCheckDate] = useState(() => resolveCheckDate(Date.now()));
  const activeCampaign = useMemo(
    () => selectActiveLaunchCampaign(campaigns, heartbeatCheckDate),
    [campaigns, heartbeatCheckDate],
  );

  const launchPacketName = activeCampaign?.name ?? DEMO_LAUNCH_PACKET;
  const prepFocus = activeCampaign?.nextAction ?? "Schedule next week’s full video and send handoffs";
  const heartbeatStatusLabel = latestHeartbeat?.status
    ? latestHeartbeat.status.replace(/_/g, " ")
    : activeCampaign?.heartbeatStatus?.replace(/_/g, " ") ?? "Not run yet";
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
  const heartbeatSummaryLine = latestHeartbeat?.summary ?? activeCampaign?.heartbeatSummary ?? "Run a check to generate tasks from your Weekly Launch Packet.";
  const lastHeartbeatAt = latestHeartbeat?.createdAt ?? activeCampaign?.heartbeatLastCheckedAt;
  const readinessRows = useMemo(() => launchReadinessRows(activeCampaign), [activeCampaign]);
  const reviewTasksInToday = currentTasks.filter((t) => t.destinationMode === "review").length;
  const integrationTasksInToday = currentTasks.filter((t) => t.destinationMode === "operations").length;

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

  return (
    <div className="space-y-5">
      <SectionHeader
        eyebrow="HOME"
        title="Daily command center"
        description="What needs attention today? Weekly launch prep, Campaign Heartbeat, handoffs, readiness, reviews, and integrations — human-controlled; manual and dry-run by default."
      />

      <div className="grid gap-5 xl:grid-cols-[1fr_22rem] xl:items-start">
        <div className="min-w-0 space-y-4">
          <div className="space-y-2">
            <div>
              <h2 className="text-base font-semibold text-slate-100">Today Tasks</h2>
              <p className="mt-1 text-xs text-slate-400">
                Current launch coordination tasks, reviews, handoffs, and readiness checks.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <button onClick={() => setActiveTab("current")} type="button">
                  <Pill tone={activeTab === "current" ? "blue" : "gray"}>Current {currentTasks.length}</Pill>
                </button>
                <button onClick={() => setActiveTab("history")} type="button">
                  <Pill tone={activeTab === "history" ? "blue" : "gray"}>History {historyTasks.length}</Pill>
                </button>
              </div>
              {activeTab === "current" ? (
                <p className="text-xs text-slate-400">Click box to complete task</p>
              ) : null}
            </div>

            <ControlPanel className="relative p-3">
              {feedback ? (
                <div className="mb-3 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-100">
                  {feedback}
                </div>
              ) : null}

              {undoTaskId ? (
                <div
                  className={cn(
                    "pointer-events-auto absolute right-3 top-3 z-10 rounded-lg border border-slate-700 bg-slate-900/95 px-3 py-2 text-xs text-slate-200 transition-opacity duration-200",
                    undoVisible ? "opacity-100" : "opacity-0",
                  )}
                >
                  <button className="focus-ring font-semibold text-sky-200" onClick={undoLastComplete} type="button">
                    Undo
                  </button>
                </div>
              ) : null}

              <div className="max-h-[68vh] space-y-2 overflow-auto pr-1">
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
                        className="focus-ring flex w-full items-center gap-3 rounded-xl border border-slate-800 bg-slate-950/70 px-3 py-3 text-left transition hover:border-slate-700 hover:bg-slate-900/80"
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
                        <div className="flex shrink-0 flex-col items-start gap-1">
                          <StatusBadge tone={priorityTone(task.priority)}>{task.category}</StatusBadge>
                          {task.sourceType === "heartbeat" ? <Pill tone="blue">Heartbeat</Pill> : null}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-slate-100">{task.title}</p>
                          <p className="mt-1 truncate text-xs text-slate-300">{task.context}</p>
                          <p className="mt-1 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-slate-400">{task.sourceLabel}</p>
                        </div>
                        <button
                          aria-label={`Complete ${task.title}`}
                          className="focus-ring grid h-6 w-6 shrink-0 place-items-center rounded border border-slate-600 bg-slate-900 text-slate-300"
                          onClick={(event) => {
                            event.stopPropagation();
                            completeTask(task.taskId);
                          }}
                          type="button"
                        />
                      </div>
                    ))
                  ) : (
                    <div className="rounded-xl border border-dashed border-slate-800 bg-slate-950/70 px-4 py-8 text-center text-sm text-slate-300">
                      No current tasks. You&apos;re clear for now.
                    </div>
                  )
                ) : historyTasks.length ? (
                  historyTasks.map((task) => (
                    <div
                      className="focus-ring flex w-full items-center gap-3 rounded-xl border border-slate-800 bg-slate-950/70 px-3 py-3 text-left transition hover:border-slate-700 hover:bg-slate-900/80"
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
                      <div className="flex shrink-0 flex-col items-start gap-1">
                        <StatusBadge tone="gray">{task.category}</StatusBadge>
                        {task.sourceType === "heartbeat" ? <Pill tone="blue">Heartbeat</Pill> : null}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-100">{task.title}</p>
                        <p className="mt-1 truncate text-xs text-slate-300">{task.context}</p>
                        <p className="mt-1 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-slate-400">
                          {task.sourceLabel} · Completed {formatTimestamp(task.completedAt)}
                        </p>
                      </div>
                      <button
                        className="focus-ring rounded-md border border-slate-700 bg-slate-900 px-2.5 py-1 text-xs font-semibold text-slate-200 hover:bg-slate-800"
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
                  <div className="rounded-xl border border-dashed border-slate-800 bg-slate-950/70 px-4 py-8 text-center text-sm text-slate-300">
                    No completed items yet.
                  </div>
                )}
              </div>
            </ControlPanel>
          </div>
        </div>

        <aside className="space-y-4">
          <ControlPanel className="p-4">
            <div className="flex items-start gap-2 border-b border-slate-800 pb-3">
              <HeartPulse className="mt-0.5 h-4 w-4 shrink-0 text-sky-300" />
              <div>
                <p className="text-sm font-semibold text-slate-100">Campaign Heartbeat</p>
                <p className="mt-1 text-xs leading-5 text-slate-400">
                  Daily scheduler/checker for launch readiness, handoffs, and missing items. Hermes by Nous on the office Mac mini can later run or coordinate approved heartbeat checks once the Hermes Local Runtime is connected in Operations; for now, checks stay in-app and human-triggered.
                </p>
              </div>
            </div>
            <dl className="mt-3 space-y-2.5 text-xs">
              <div className="flex flex-col gap-0.5">
                <dt className="font-bold uppercase tracking-[0.14em] text-slate-500">Heartbeat status</dt>
                <dd className="text-slate-300">{heartbeatStatusLabel}</dd>
              </div>
              <div className="flex flex-col gap-0.5">
                <dt className="font-bold uppercase tracking-[0.14em] text-slate-500">Summary</dt>
                <dd className="text-slate-300">{heartbeatSummaryLine}</dd>
              </div>
              <div className="flex flex-col gap-0.5">
                <dt className="font-bold uppercase tracking-[0.14em] text-slate-500">Current prep focus</dt>
                <dd className="text-slate-200">{prepFocus}</dd>
              </div>
              <div className="flex flex-col gap-0.5">
                <dt className="font-bold uppercase tracking-[0.14em] text-slate-500">Next publish date</dt>
                <dd className="text-slate-200">{activeCampaign?.publishDate?.trim() || DEMO_PUBLISH_LABEL}</dd>
              </div>
              <div className="flex flex-col gap-0.5">
                <dt className="font-bold uppercase tracking-[0.14em] text-slate-500">Active launch packet</dt>
                <dd className="text-slate-200">
                  {activeCampaign ? (
                    <Link className="text-sky-300 underline-offset-2 hover:underline" href={`/campaigns/${activeCampaign.id}`}>
                      {launchPacketName}
                    </Link>
                  ) : (
                    launchPacketName
                  )}
                </dd>
              </div>
              <div className="flex flex-col gap-0.5">
                <dt className="font-bold uppercase tracking-[0.14em] text-slate-500">Today&apos;s checkpoint</dt>
                <dd className="text-slate-200">{checkpointLabel}</dd>
              </div>
              <div className="flex flex-col gap-0.5">
                <dt className="font-bold uppercase tracking-[0.14em] text-slate-500">Friday readiness</dt>
                <dd className="text-slate-200">Confirm handoffs, scheduled link, and social copy before end of week.</dd>
              </div>
              <div className="flex flex-col gap-0.5">
                <dt className="font-bold uppercase tracking-[0.14em] text-slate-500">Readiness state</dt>
                <dd>
                  <StatusBadge
                    tone={
                      readinessState === "Blocked" || readinessState === "At risk"
                        ? "red"
                        : readinessState === "Needs attention" || readinessState === "No active packet"
                          ? "amber"
                          : readinessState === "Clear"
                            ? "green"
                            : "blue"
                    }
                  >
                    {readinessState}
                  </StatusBadge>
                </dd>
              </div>
              <div className="flex flex-col gap-0.5">
                <dt className="font-bold uppercase tracking-[0.14em] text-slate-500">Missing items</dt>
                <dd className="text-slate-300">{missingLine}</dd>
              </div>
              <div className="flex flex-col gap-0.5">
                <dt className="font-bold uppercase tracking-[0.14em] text-slate-500">At-risk items</dt>
                <dd className="text-slate-300">{riskLine}</dd>
              </div>
              <div className="flex flex-col gap-0.5">
                <dt className="font-bold uppercase tracking-[0.14em] text-slate-500">Suggested next action</dt>
                <dd className="text-slate-200">{suggestedNext}</dd>
              </div>
              <div className="flex flex-col gap-0.5">
                <dt className="font-bold uppercase tracking-[0.14em] text-slate-500">Last heartbeat check</dt>
                <dd className="text-slate-300">{lastHeartbeatAt ? formatTimestamp(lastHeartbeatAt) : "Not run yet"}</dd>
              </div>
              <div className="flex flex-col gap-0.5">
                <dt className="font-bold uppercase tracking-[0.14em] text-slate-500">Review tasks (Today)</dt>
                <dd className="text-slate-300">
                  {reviewTasksInToday ? (
                    <>
                      {reviewTasksInToday} in Current —{" "}
                      <Link className="text-sky-300 underline-offset-2 hover:underline" href="/reviews/all">
                        open approvals
                      </Link>
                    </>
                  ) : (
                    "None in Current — check History or queues when items land."
                  )}
                </dd>
              </div>
              <div className="flex flex-col gap-0.5">
                <dt className="font-bold uppercase tracking-[0.14em] text-slate-500">Integration / ops (Today)</dt>
                <dd className="text-slate-300">
                  {integrationTasksInToday ? (
                    <>
                      {integrationTasksInToday} in Current —{" "}
                      <Link className="text-sky-300 underline-offset-2 hover:underline" href="/operations/integrations">
                        open integrations
                      </Link>
                    </>
                  ) : (
                    "None in Current tasks."
                  )}
                </dd>
              </div>
            </dl>
            {heartbeatMsg ? (
              <div className="mt-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-100">{heartbeatMsg}</div>
            ) : null}
            <div className="mt-3 flex flex-wrap gap-2 border-t border-slate-800 pt-3">
              <button
                className="focus-ring rounded-lg border border-sky-500/60 bg-sky-500 px-3.5 py-2 text-sm font-semibold text-slate-950 hover:bg-sky-400 disabled:opacity-60"
                disabled={heartbeatRunning}
                onClick={() => {
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
                }}
                type="button"
              >
                {heartbeatRunning ? "Running…" : "Run Campaign Heartbeat"}
              </button>
              {!activeCampaign ? (
                <Link href="/campaigns/new">
                  <Button variant="secondary">Create Launch Packet</Button>
                </Link>
              ) : null}
              <Link href="/intelligence/heartbeat">
                <Button variant="secondary">Heartbeat history</Button>
              </Link>
            </div>
            <p className="mt-3 border-t border-slate-800 pt-3 text-[0.65rem] leading-4 text-slate-500">
              Deterministic checker — reads Weekly Launch Packet fields only. No auto-send, post, or external API calls.
            </p>
          </ControlPanel>

          <ControlPanel className="p-4">
            <p className="text-sm font-semibold text-slate-100">Launch Readiness</p>
            <p className="mt-1 text-xs leading-5 text-slate-400">
              Current launch packet status across publishing, email, creative, and rollout prep. Illustrative statuses — not live platform checks.
            </p>
            <div className="mt-3 space-y-2 border-t border-slate-800 pt-3">
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="text-slate-500">Active launch packet</span>
                <span className="max-w-[11rem] truncate text-right font-medium text-slate-200">{launchPacketName}</span>
              </div>
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="text-slate-500">Publish date</span>
                <span className="text-slate-200">{activeCampaign?.publishDate?.trim() || DEMO_PUBLISH_LABEL}</span>
              </div>
              {readinessRows.map((row) => (
                <div className="flex items-center justify-between gap-2 text-xs" key={row.key}>
                  <span className="text-slate-500">{row.label}</span>
                  <StatusBadge tone={row.tone}>{row.status}</StatusBadge>
                </div>
              ))}
            </div>
          </ControlPanel>

          <ControlPanel className="p-4">
            <p className="text-sm font-semibold text-slate-100">External follow-ups</p>
            <p className="mt-1 text-xs leading-5 text-slate-400">Dependencies outside this console — coordinate manually until integrations are enabled.</p>
            <ul className="mt-3 space-y-2 border-t border-slate-800 pt-3 text-xs text-slate-300">
              <li className="flex gap-2">
                <StatusDot tone="amber" className="mt-1.5 shrink-0" />
                <span>
                  <span className="font-semibold text-slate-200">Brandon:</span> Creative brief not confirmed
                </span>
              </li>
              <li className="flex gap-2">
                <StatusDot tone="amber" className="mt-1.5 shrink-0" />
                <span>
                  <span className="font-semibold text-slate-200">Emailmarketing.com:</span> Waiting on scheduled YouTube link
                </span>
              </li>
              <li className="flex gap-2">
                <StatusDot tone="gray" className="mt-1.5 shrink-0" />
                <span>
                  <span className="font-semibold text-slate-200">Production Hub:</span> Selected video thumbnail status unknown
                </span>
              </li>
            </ul>
          </ControlPanel>
        </aside>
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
  const filteredCampaigns: Campaign[] = useMemo(() => campaigns.filter((campaign) => campaignMatchesFilter(campaign, activeFilter)), [activeFilter, campaigns]);
  const selectedCampaign = filteredCampaigns.find((campaign) => campaign.id === selectedId) ?? filteredCampaigns[0];
  const summaryStrip = [
    { label: "Active", value: campaigns.filter((campaign) => campaign.status !== "archived").length, tone: "blue" },
    { label: "Needs Bari", value: campaigns.filter((campaign) => campaign.pendingApprovals.includes("bari")).length, tone: "amber" },
    { label: "Needs Blue", value: campaigns.filter((campaign) => campaign.pendingApprovals.includes("blue")).length, tone: "red" },
    { label: "Ready for Keap", value: campaigns.filter((campaign) => campaign.status === "ready_for_keap").length, tone: "green" },
    { label: "Blocked", value: campaigns.filter((campaign) => campaign.status === "blocked").length, tone: "red" },
  ];

  return (
    <div className="space-y-5">
      <SectionHeader
        eyebrow="Launch coordination"
        title="Weekly Launch Campaigns"
        description="Plan, prepare, review, hand off, and track content-driven campaigns from source asset to rollout. Records are Convex-backed; publishing and Production Hub bridges are manual until integrations are enabled."
        actions={
          <Link href="/campaigns/new">
            <Button>
              <Play className="mr-2 h-4 w-4" /> Create Launch Packet
            </Button>
          </Link>
        }
      />

      <ControlPanel className="p-4">
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
          {filters.map((filter) => (
            <button key={filter} onClick={() => setActiveFilter(filter)} type="button">
              <Pill tone={filter === activeFilter ? "blue" : "gray"}>{filter}</Pill>
            </button>
          ))}
        </div>
        <section className="mt-4 grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
          <ConsoleTable>
            <TableHead>
              <tr>
                <Th>Launch packet</Th>
                <Th>Kind</Th>
                <Th>Audience</Th>
                <Th>Offer</Th>
                <Th>Stage</Th>
                <Th>Publish</Th>
                <Th>Packet readiness</Th>
                <Th>YouTube</Th>
                <Th>Email</Th>
                <Th>Creative</Th>
                <Th>Social</Th>
                <Th>Blockers</Th>
                <Th>Owner</Th>
                <Th>Next launch action</Th>
                <Th>Open</Th>
              </tr>
            </TableHead>
            <tbody>
              {campaignRecords === undefined ? (
                <tr>
                  <td className="px-4 py-6 text-sm text-slate-300" colSpan={15}>
                    Loading launch packets from Convex.
                  </td>
                </tr>
              ) : !filteredCampaigns.length ? (
                <tr>
                  <td className="px-4 py-6 text-sm text-slate-300" colSpan={15}>
                    No launch packets match this filter.
                  </td>
                </tr>
              ) : (
                filteredCampaigns.map((campaign) => (
                  <tr className={selectedCampaign?.id === campaign.id ? "bg-slate-900/85" : ""} key={campaign.id} onClick={() => setSelectedId(campaign.id)}>
                    <Td>
                      <div>
                        <p className="font-semibold text-slate-100">{campaign.name}</p>
                        <p className="mt-1 text-xs text-slate-400">{formatLabel(campaign.status)}</p>
                      </div>
                    </Td>
                    <Td className="max-w-[8rem] truncate text-xs">{labelForCampaignKind(campaign.campaignKind ?? campaign.type)}</Td>
                    <Td className="max-w-[10rem] truncate text-xs">{campaign.audience}</Td>
                    <Td className="max-w-[8rem] truncate text-xs">{offerName(campaign)}</Td>
                    <Td className="text-xs">{stageForCampaign(campaign)}</Td>
                    <Td className="text-xs">{campaign.publishDate?.trim() || "—"}</Td>
                    <Td className="text-xs">{shortPacketStatus(campaign.readinessStatus)}</Td>
                    <Td className="text-xs">{shortPacketStatus(campaign.youtubeStatus)}</Td>
                    <Td className="text-xs">{shortPacketStatus(campaign.emailBriefStatus)}</Td>
                    <Td className="text-xs">{shortPacketStatus(campaign.creativeBriefStatus)}</Td>
                    <Td className="text-xs">{shortPacketStatus(campaign.socialCopyStatus)}</Td>
                    <Td className="text-xs">{campaign.blockers?.length ? `${campaign.blockers.length}` : "—"}</Td>
                    <Td>{ownerName(campaign)}</Td>
                    <Td className="max-w-[14rem] text-slate-300">{campaign.nextAction}</Td>
                    <Td>
                      <button onClick={() => setSelectedId(campaign.id)} type="button">
                        <InlineAction>Open</InlineAction>
                      </button>
                    </Td>
                  </tr>
                ))
              )}
            </tbody>
          </ConsoleTable>
          <ControlPanel className="p-4">
            {selectedCampaign ? (
              <div className="space-y-4 text-sm">
                <div>
                  <p className="text-sm font-semibold text-slate-100">Selected launch packet</p>
                  <p className="mt-1 text-xs text-slate-500">Summary fields from Convex. Publishing and handoff lines are illustrative unless noted.</p>
                </div>
                <div className="rounded-lg border border-slate-800 bg-slate-950/70 px-3 py-2 text-slate-300">
                  Launch name: <span className="text-slate-100">{selectedCampaign.name}</span>
                </div>
                <div className="rounded-lg border border-slate-800 bg-slate-950/70 px-3 py-2 text-slate-300">
                  Campaign kind: <span className="text-slate-100">{labelForCampaignKind(selectedCampaign.campaignKind ?? selectedCampaign.type)}</span>
                </div>
                <div className="rounded-lg border border-slate-800 bg-slate-950/70 px-3 py-2 text-slate-300">
                  Stage: <span className="text-slate-100">{stageForCampaign(selectedCampaign)}</span>
                </div>
                <div className="rounded-lg border border-slate-800 bg-slate-950/70 px-3 py-2 text-slate-300">
                  Readiness (risk): <span className="text-slate-100">{selectedCampaign.riskLevel}</span>
                </div>
                <div className="rounded-lg border border-slate-800 bg-slate-950/70 px-3 py-2 text-slate-300">
                  Owner: <span className="text-slate-100">{ownerName(selectedCampaign)}</span>
                </div>
                <div className="rounded-lg border border-slate-800 bg-slate-950/70 px-3 py-2 text-slate-300">
                  Audience: <span className="text-slate-100">{selectedCampaign.audience}</span>
                </div>
                <div className="rounded-lg border border-slate-800 bg-slate-950/70 px-3 py-2 text-slate-300">
                  CTA / offer: <span className="text-slate-100">{offerName(selectedCampaign)}</span>
                </div>
                <div className="rounded-lg border border-slate-800 bg-slate-950/70 px-3 py-2 text-slate-300">
                  Pending approvals: <span className="text-slate-100">{pendingApprovals(selectedCampaign)}</span>
                </div>
                <div className="rounded-lg border border-slate-800 bg-slate-950/70 px-3 py-2 text-slate-300">
                  Next launch action: <span className="text-slate-100">{selectedCampaign.nextAction}</span>
                </div>
                <div className="rounded-lg border border-slate-800 bg-slate-950/70 px-3 py-2 text-slate-300">
                  Source asset (mapping):{" "}
                  <span className="text-slate-100">{selectedCampaign.sourceMapping?.trim() || "Not tracked yet"}</span>
                </div>
                <div className="rounded-lg border border-slate-800 bg-slate-950/70 px-3 py-2 text-slate-300">
                  Publish date: <span className="text-slate-100">{selectedCampaign.publishDate?.trim() || "Not set"}</span>
                </div>
                <div className="rounded-lg border border-slate-800 bg-slate-950/70 px-3 py-2 text-slate-300">
                  Last activity: <span className="text-slate-100">{lastActivityForCampaign(selectedCampaign)}</span>
                </div>
                <div className="rounded-lg border border-slate-800 bg-slate-950/70 px-3 py-2 text-slate-300">
                  Email / CRM handoff prep:{" "}
                  <span className="text-slate-100">
                    {selectedCampaign.status === "ready_for_keap" ? "Ready for Keap handoff (manual export)" : "In progress"}
                  </span>
                </div>
                <div className="border-t border-slate-800 pt-3">
                  <p className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-slate-500">Launch readiness (illustrative)</p>
                  <div className="mt-2 space-y-2">
                    {launchReadinessRows(selectedCampaign).map((row) => (
                      <div className="flex items-center justify-between gap-2 text-xs" key={row.key}>
                        <span className="text-slate-500">{row.label}</span>
                        <StatusBadge tone={row.tone}>{row.status}</StatusBadge>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  <Link href={`/campaigns/${selectedCampaign.id}`}>
                    <Button variant="secondary">Open full launch packet</Button>
                  </Link>
                  {selectedCampaign.pendingApprovals.includes("bari") ? (
                    <Link href="/reviews/bari">
                      <Button variant="secondary">Open Bari Review</Button>
                    </Link>
                  ) : null}
                  {selectedCampaign.pendingApprovals.includes("blue") ? (
                    <Link href="/reviews/blue">
                      <Button variant="secondary">Open Blue Review</Button>
                    </Link>
                  ) : null}
                  {selectedCampaign.status === "ready_for_keap" ? (
                    <Link href="/reviews/internal">
                      <Button variant="secondary">Open Internal Approval</Button>
                    </Link>
                  ) : null}
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-300">Select a launch packet to inspect summary and readiness hints.</p>
            )}
          </ControlPanel>
        </section>
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
  const keapMappingReady = form.sourceMapping.trim().length > 0;
  const checklist = [
    { label: "Goal defined", complete: Boolean(form.campaignGoal.trim()), tone: "green" },
    { label: "Audience selected", complete: Boolean(form.audienceSegment.trim()), tone: "green" },
    { label: "Offer selected", complete: Boolean(form.offerSelection.trim()), tone: "green" },
    { label: "CTA selected", complete: Boolean(form.primaryCta.trim()), detail: form.primaryCta.trim() ? undefined : "Awaiting operator choice." },
    { label: "Approval rules known", complete: Boolean(form.offerSelection.trim() || form.allowedClaims.trim()), tone: "amber", detail: "Bari and Blue rules inferred from the current intake." },
    { label: "Bari voice required?", complete: bariApprovalRequired, tone: "amber", detail: bariApprovalRequired ? "Triggered for founder-signed or reactivation copy." : "Not currently required." },
    { label: "Blue approval likely?", complete: blueApprovalRequired, tone: "red", detail: blueApprovalRequired ? "Likely due to strategic claim or urgency language." : "Not currently required." },
    { label: "Keap mapping ready?", complete: keapMappingReady, detail: keapMappingReady ? undefined : "Add source mapping or tag details." },
  ];
  const intakeSections: Array<{
    heading: string;
    helper: string;
    items: Array<{ label: string; placeholder: string; field: keyof typeof form; multiline?: boolean }>;
  }> = [
    {
      heading: "Launch packet intent",
      helper: "Define the coordinated push: content release, offer, event, or weekly launch goal.",
      items: [
        { label: "Launch packet name", placeholder: "Example: Weekly Launch — Virtual Event Cost Shift", field: "campaignName" },
        { label: "Campaign goal", placeholder: "Example: Drive registrations for the weekly full-video release", field: "campaignGoal" },
        { label: "Campaign type", placeholder: "Example: Weekly launch, reactivation, nurture, event invite", field: "campaignType" },
      ],
    },
    {
      heading: "Audience",
      helper: "Choose who this launch is for and who should be excluded.",
      items: [
        { label: "Audience / segment", placeholder: "Example: Engaged newsletter subscribers", field: "audienceSegment" },
        { label: "Allowed exclusions", placeholder: "One exclusion per line", field: "exclusions", multiline: true },
        { label: "Source mapping", placeholder: "Example: Keap tag or manual audience", field: "sourceMapping" },
      ],
    },
    {
      heading: "Offer / lead magnet",
      helper: "Select what the audience is being offered and what claims are allowed for this launch.",
      items: [
        { label: "Offer selection", placeholder: "Example: Free SAGE Strategy Call", field: "offerSelection" },
        { label: "Promise / CTA", placeholder: "Example: Book your call", field: "promiseCta" },
        { label: "Allowed claims", placeholder: "One approved claim per line", field: "allowedClaims", multiline: true },
      ],
    },
    {
      heading: "Execution",
      helper: "Timing, primary CTA, success metric, and optional first-pass packet copy.",
      items: [
        { label: "Send window", placeholder: "Example: Launch week mornings", field: "sendWindow" },
        { label: "Success metric", placeholder: "Example: registrations, replies, clicks", field: "successMetric" },
        { label: "Primary CTA", placeholder: "Example: Save your seat", field: "primaryCta" },
        { label: "YouTube title (optional)", placeholder: "Draft public title", field: "youtubeTitle" },
        { label: "YouTube description (optional)", placeholder: "Draft description", field: "youtubeDescription", multiline: true },
        { label: "Email brief body (optional)", placeholder: "Paste Emailmarketing.com brief draft", field: "emailBriefBody", multiline: true },
        { label: "Creative brief body (optional)", placeholder: "Paste Brandon / creative brief", field: "creativeBriefBody", multiline: true },
        { label: "Social rollout notes (optional)", placeholder: "Cadence / platform notes", field: "rolloutNotes", multiline: true },
      ],
    },
  ];

  const updateField = (field: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const saveCampaign = async (mode: "save" | "draft") => {
    const status = mode === "draft" ? "agent_drafting" : "intake_draft";
    const stage = mode === "draft" ? "Copy" : "Intake";
    const nextAction = mode === "draft"
      ? "Agent draft queued from campaign intake."
      : "Complete the intake or run an agent draft.";
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
          keapPrepStatus: keapMappingReady ? "Mapped" : "Needs mapping",
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
          primaryAudience: form.primaryAudience.trim() || undefined,
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
    <div className="space-y-5">
      <SectionHeader
        eyebrow="Launch packet"
        title="Create Launch Packet"
        description="Start from a production asset, campaign idea, or manual intake. A launch packet keeps the video release, email handoff, creative brief, social rollout, approvals, and readiness tasks organized in one place."
        actions={
          <button onClick={() => void saveCampaign("draft")} type="button">
            <Button>
              <Play className="mr-2 h-4 w-4" /> Run Agent Draft
            </Button>
          </button>
        }
      />
      {feedback ? <ControlPanel className="border-sky-500/30 bg-sky-500/10 p-3 text-sm text-sky-100">{feedback}</ControlPanel> : null}
      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="grid gap-4">
          <div className="space-y-3">
            <ProductionBridgeAssetPicker onSelect={handleSelectProductionAsset} />
            {form.sourceProductionAssetId.trim() || form.sourceAssetTitle.trim() ? (
              <ControlPanel className="border-emerald-500/20 bg-emerald-500/5 p-3 text-xs text-emerald-100/90">
                Source asset fields are populated. The launch packet will store a snapshot when you save — submit the form when ready.
              </ControlPanel>
            ) : null}
          </div>
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
            <p className="text-sm font-semibold text-slate-100">Weekly Launch Packet defaults</p>
            <p className="mt-1 text-xs text-slate-500">Saved to Convex with the new campaign — edit anytime on the launch packet detail page.</p>
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
                <input
                  className="rounded-lg border border-slate-700 bg-slate-950/90 px-3 py-2 text-sm text-slate-100"
                  onChange={(event) => updateField("primaryAudience", event.target.value)}
                  placeholder="Who this launch speaks to"
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
        </div>
        <QueueLane
          title="Launch packet readiness"
          count={`${checklist.filter((item) => item.complete).length}/${checklist.length}`}
          tone="blue"
          subtitle="Operator checklist before draft creation and approval routing."
          action={
            <button onClick={() => void saveCampaign("save")} type="button">
              <Button variant="secondary">Save Intake</Button>
            </button>
          }
        >
          <ReadinessChecklist items={checklist} />
        </QueueLane>
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
