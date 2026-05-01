"use client";

import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { BrainCircuit, MailCheck, Play, Send, Sparkles } from "lucide-react";
import { performanceSnapshots } from "@/lib/data/demo-data";
import type { Campaign, TodayTaskRecord } from "@/lib/domain";
import { useAppUser } from "@/components/auth/app-user-context";
import {
  Button,
  Card,
  ConsoleTable,
  ControlPanel,
  InlineAction,
  Pill,
  QueueLane,
  ReadinessChecklist,
  SectionHeader,
  SignalList,
  StatusBadge,
  Td,
  Th,
  TableHead,
} from "@/components/ui";
import { cn } from "@/lib/utils";

const filters = ["All", "Needs Bari", "Needs Blue", "Ready for Keap", "Sent", "Learning", "Blocked"];

function formatLabel(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function riskTone(risk: string) {
  if (risk === "red") return "red";
  if (risk === "yellow") return "amber";
  return "green";
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

function toCampaign(record: {
  campaignId: string;
  name: string;
  type: string;
  goal: string;
  channels: string[];
  audience: string;
  audienceId?: string;
  offer: string;
  offerId?: string;
  primaryCta?: string;
  sendWindow?: string;
  successMetric?: string;
  allowedClaims: string[];
  knownExclusions: string[];
  sourceMapping?: string;
  keapTagMapping?: string;
  ownerId?: string;
  ownerName: string;
  stage: string;
  status: Campaign["status"];
  riskLevel: Campaign["riskLevel"];
  pendingApprovals: Campaign["pendingApprovals"];
  bariApprovalRequired: boolean;
  blueApprovalRequired: boolean;
  internalApprovalRequired: boolean;
  bariApprovalStatus?: Campaign["bariApprovalStatus"];
  blueApprovalStatus?: Campaign["blueApprovalStatus"];
  internalApprovalStatus?: Campaign["internalApprovalStatus"];
  copyStatus?: string;
  keapPrepStatus?: string;
  responseStatus?: string;
  learningStatus?: string;
  nextAction: string;
  createdAt: number;
  updatedAt: number;
  lastActivityAt?: number;
  sortOrder: number;
  archived?: boolean;
  notes?: string;
}): Campaign {
  return {
    id: record.campaignId,
    name: record.name,
    type: record.type,
    goal: record.goal,
    channels: record.channels,
    audience: record.audience,
    audienceId: record.audienceId,
    offer: record.offer,
    offerId: record.offerId,
    primaryCta: record.primaryCta,
    sendWindow: record.sendWindow,
    successMetric: record.successMetric,
    allowedClaims: record.allowedClaims,
    knownExclusions: record.knownExclusions,
    sourceMapping: record.sourceMapping,
    keapTagMapping: record.keapTagMapping,
    ownerId: record.ownerId,
    ownerName: record.ownerName,
    stage: record.stage,
    status: record.status,
    riskLevel: record.riskLevel,
    pendingApprovals: record.pendingApprovals,
    bariApprovalRequired: record.bariApprovalRequired,
    blueApprovalRequired: record.blueApprovalRequired,
    internalApprovalRequired: record.internalApprovalRequired,
    bariApprovalStatus: record.bariApprovalStatus,
    blueApprovalStatus: record.blueApprovalStatus,
    internalApprovalStatus: record.internalApprovalStatus,
    copyStatus: record.copyStatus,
    keapPrepStatus: record.keapPrepStatus,
    responseStatus: record.responseStatus,
    learningStatus: record.learningStatus,
    nextAction: record.nextAction,
    createdAt: new Date(record.createdAt).toISOString(),
    updatedAt: new Date(record.updatedAt).toISOString(),
    lastActivityAt: record.lastActivityAt ? new Date(record.lastActivityAt).toISOString() : new Date(record.updatedAt).toISOString(),
    sortOrder: record.sortOrder,
    archived: record.archived,
    notes: record.notes,
  };
}

function createCampaignId() {
  return `camp_${Date.now()}`;
}

function splitLines(value: string) {
  return value.split("\n").map((line) => line.trim()).filter(Boolean);
}

export function DashboardSection() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"current" | "history">("current");
  const [undoTaskId, setUndoTaskId] = useState<string | null>(null);
  const [undoVisible, setUndoVisible] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const seedAttemptedRef = useRef(false);
  const TASK_RETURN_KEY = "oc_task_return_context";
  const todayTasks = useQuery(api.todayTasks.listTodayTasks);
  const seedDefaultTodayTasksIfEmpty = useMutation(api.todayTasks.seedDefaultTodayTasksIfEmpty);
  const completeTodayTask = useMutation(api.todayTasks.completeTodayTask);
  const restoreTodayTask = useMutation(api.todayTasks.restoreTodayTask);

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
        eyebrow="TODAY"
        title="Today"
        description="A focused list of current tasks, approvals, replies, and system items that need attention."
      />
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
            currentTasks.length ? currentTasks.map((task) => (
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
                <StatusBadge tone={priorityTone(task.priority)}>{task.category}</StatusBadge>
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
            )) : (
              <div className="rounded-xl border border-dashed border-slate-800 bg-slate-950/70 px-4 py-8 text-center text-sm text-slate-300">
                No current tasks. You&apos;re clear for now.
              </div>
            )
          ) : (
            historyTasks.length ? historyTasks.map((task) => (
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
                <StatusBadge tone="gray">{task.category}</StatusBadge>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-100">{task.title}</p>
                  <p className="mt-1 truncate text-xs text-slate-300">{task.context}</p>
                  <p className="mt-1 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-slate-400">{task.sourceLabel} · Completed {formatTimestamp(task.completedAt)}</p>
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
            )) : (
              <div className="rounded-xl border border-dashed border-slate-800 bg-slate-950/70 px-4 py-8 text-center text-sm text-slate-300">
                No completed items yet.
              </div>
            )
          )}
        </div>
      </ControlPanel>
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

  const campaigns: Campaign[] = useMemo(() => (campaignRecords ?? []).map((record: Parameters<typeof toCampaign>[0]) => toCampaign(record)), [campaignRecords]);
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
        eyebrow="Campaign records"
        title="Campaigns"
        description="Operational campaign list with stage, risk, owner, next action, and handoff readiness."
        actions={<Link href="/campaigns/new"><Button><Play className="mr-2 h-4 w-4" /> Create Campaign</Button></Link>}
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
                <Th>Campaign</Th>
                <Th>Type</Th>
                <Th>Audience</Th>
                <Th>Offer</Th>
                <Th>Stage</Th>
                <Th>Risk</Th>
                <Th>Owner</Th>
                <Th>Next action</Th>
                <Th>Open</Th>
              </tr>
            </TableHead>
            <tbody>
              {campaignRecords === undefined ? (
                <tr>
                  <td className="px-4 py-6 text-sm text-slate-300" colSpan={9}>Loading campaigns from Convex.</td>
                </tr>
              ) : !filteredCampaigns.length ? (
                <tr>
                  <td className="px-4 py-6 text-sm text-slate-300" colSpan={9}>No campaigns found.</td>
                </tr>
              ) : filteredCampaigns.map((campaign) => (
                <tr className={selectedCampaign?.id === campaign.id ? "bg-slate-900/85" : ""} key={campaign.id} onClick={() => setSelectedId(campaign.id)}>
                  <Td>
                    <div>
                      <p className="font-semibold text-slate-100">{campaign.name}</p>
                      <p className="mt-1 text-xs text-slate-400">{formatLabel(campaign.status)}</p>
                    </div>
                  </Td>
                  <Td>{campaign.type}</Td>
                  <Td>{campaign.audience}</Td>
                  <Td>{offerName(campaign)}</Td>
                  <Td>{stageForCampaign(campaign)}</Td>
                  <Td><StatusBadge tone={riskTone(campaign.riskLevel)}>{campaign.riskLevel}</StatusBadge></Td>
                  <Td>{ownerName(campaign)}</Td>
                  <Td className="max-w-[18rem] text-slate-300">{campaign.nextAction}</Td>
                  <Td>
                    <button onClick={() => setSelectedId(campaign.id)} type="button">
                      <InlineAction>Open</InlineAction>
                    </button>
                  </Td>
                </tr>
              ))}
            </tbody>
          </ConsoleTable>
          <ControlPanel className="p-4">
            {selectedCampaign ? (
              <div className="space-y-3 text-sm">
                <p className="text-sm font-semibold text-slate-100">Selected campaign</p>
                <div className="rounded-lg border border-slate-800 bg-slate-950/70 px-3 py-2 text-slate-300">Campaign name: <span className="text-slate-100">{selectedCampaign.name}</span></div>
                <div className="rounded-lg border border-slate-800 bg-slate-950/70 px-3 py-2 text-slate-300">Campaign type: <span className="text-slate-100">{selectedCampaign.type}</span></div>
                <div className="rounded-lg border border-slate-800 bg-slate-950/70 px-3 py-2 text-slate-300">Current stage: <span className="text-slate-100">{stageForCampaign(selectedCampaign)}</span></div>
                <div className="rounded-lg border border-slate-800 bg-slate-950/70 px-3 py-2 text-slate-300">Risk: <span className="text-slate-100">{selectedCampaign.riskLevel}</span></div>
                <div className="rounded-lg border border-slate-800 bg-slate-950/70 px-3 py-2 text-slate-300">Owner: <span className="text-slate-100">{ownerName(selectedCampaign)}</span></div>
                <div className="rounded-lg border border-slate-800 bg-slate-950/70 px-3 py-2 text-slate-300">Audience: <span className="text-slate-100">{selectedCampaign.audience}</span></div>
                <div className="rounded-lg border border-slate-800 bg-slate-950/70 px-3 py-2 text-slate-300">Offer: <span className="text-slate-100">{offerName(selectedCampaign)}</span></div>
                <div className="rounded-lg border border-slate-800 bg-slate-950/70 px-3 py-2 text-slate-300">Approvals required: <span className="text-slate-100">{pendingApprovals(selectedCampaign)}</span></div>
                <div className="rounded-lg border border-slate-800 bg-slate-950/70 px-3 py-2 text-slate-300">Next action: <span className="text-slate-100">{selectedCampaign.nextAction}</span></div>
                <div className="rounded-lg border border-slate-800 bg-slate-950/70 px-3 py-2 text-slate-300">Last activity: <span className="text-slate-100">{lastActivityForCampaign(selectedCampaign)}</span></div>
                <div className="rounded-lg border border-slate-800 bg-slate-950/70 px-3 py-2 text-slate-300">Handoff state: <span className="text-slate-100">{selectedCampaign.status === "ready_for_keap" ? "Ready for Keap handoff" : "In progress"}</span></div>
                <div className="flex flex-wrap gap-2 pt-2">
                  <Link href={`/campaigns/${selectedCampaign.id}`}><Button variant="secondary">Open full campaign</Button></Link>
                  {selectedCampaign.pendingApprovals.includes("bari") ? <Link href="/reviews/bari"><Button variant="secondary">Open Bari Review</Button></Link> : null}
                  {selectedCampaign.pendingApprovals.includes("blue") ? <Link href="/reviews/blue"><Button variant="secondary">Open Blue Review</Button></Link> : null}
                  {selectedCampaign.status === "ready_for_keap" ? <Link href="/reviews/internal"><Button variant="secondary">Open Internal Approval</Button></Link> : null}
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-300">Select a campaign to inspect details.</p>
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
    audienceSegment: "",
    exclusions: "",
    sourceMapping: "",
    offerSelection: "",
    promiseCta: "",
    allowedClaims: "",
    sendWindow: "",
    successMetric: "",
    primaryCta: "",
  });
  const libraryRecords = useQuery(api.library.listLibraryItems);
  const createCampaignRecord = useMutation(api.campaigns.createCampaignRecord);
  const actorName = appUser.displayName || appUser.clerkUserId || "console_operator";
  const actorId = appUser.clerkUserId || "user_operator";

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
      heading: "Campaign intent",
      helper: "Define what this campaign is trying to accomplish.",
      items: [
        { label: "Campaign name", placeholder: "Example: Cold Lead Reactivation — May Week 2", field: "campaignName" },
        { label: "Campaign goal", placeholder: "Example: Reactivate dormant warm leads", field: "campaignGoal" },
        { label: "Campaign type", placeholder: "Example: Reactivation, nurture, event invite", field: "campaignType" },
      ],
    },
    {
      heading: "Audience",
      helper: "Choose who this campaign is for and who should be excluded.",
      items: [
        { label: "Audience / segment", placeholder: "Example: Dormant warm leads", field: "audienceSegment" },
        { label: "Allowed exclusions", placeholder: "One exclusion per line", field: "exclusions", multiline: true },
        { label: "Source mapping", placeholder: "Example: Keap tag or manual audience", field: "sourceMapping" },
      ],
    },
    {
      heading: "Offer / lead magnet",
      helper: "Select what the audience is being offered and what claims are allowed.",
      items: [
        { label: "Offer selection", placeholder: "Example: Free SAGE Strategy Call", field: "offerSelection" },
        { label: "Promise / CTA", placeholder: "Example: Book your call", field: "promiseCta" },
        { label: "Allowed claims", placeholder: "One approved claim per line", field: "allowedClaims", multiline: true },
      ],
    },
    {
      heading: "Execution",
      helper: "Define timing, CTA, and success metric.",
      items: [
        { label: "Send window", placeholder: "Example: Tue–Thu morning", field: "sendWindow" },
        { label: "Success metric", placeholder: "Example: bookings, replies, clicks", field: "successMetric" },
        { label: "Primary CTA", placeholder: "Example: Book your call", field: "primaryCta" },
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
      const patch = Object.fromEntries(
        Object.entries({
          name: form.campaignName.trim() || "Untitled campaign",
          type: form.campaignType.trim() || "campaign",
          goal: form.campaignGoal.trim() || "Campaign goal",
          channels: ["email"],
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
        eyebrow="Campaign configuration"
        title="Create Campaign"
        description="Configure the campaign system state, route likely approvals, and generate the first agent draft."
        actions={<button onClick={() => void saveCampaign("draft")} type="button"><Button><Play className="mr-2 h-4 w-4" /> Run Agent Draft</Button></button>}
      />
      {feedback ? <ControlPanel className="border-sky-500/30 bg-sky-500/10 p-3 text-sm text-sky-100">{feedback}</ControlPanel> : null}
      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="grid gap-4">
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
        </div>
        <QueueLane
          title="Campaign Build Readiness"
          count={`${checklist.filter((item) => item.complete).length}/${checklist.length}`}
          tone="blue"
          subtitle="Operator checklist before draft creation and approval routing."
          action={<button onClick={() => void saveCampaign("save")} type="button"><Button variant="secondary">Save Intake</Button></button>}
        >
          <ReadinessChecklist items={checklist} />
        </QueueLane>
      </section>
    </div>
  );
}

export function CampaignDetailSection({ campaignId }: { campaignId?: string }) {
  const [seedAttempted, setSeedAttempted] = useState(false);
  const campaignRecord = useQuery(api.campaigns.getCampaignRecordByCampaignId, campaignId ? { campaignId } : "skip");
  const approvalRecords = useQuery(api.approvals.listApprovalItems);
  const allCampaigns = useQuery(api.campaigns.listCampaignRecords);
  const responseRecords = useQuery(api.responses.listResponseRecords);
  const seedDefaultCampaignRecordsIfEmpty = useMutation(api.campaigns.seedDefaultCampaignRecordsIfEmpty);
  const seededFallback: Campaign[] = useMemo(() => (allCampaigns ?? []).map((record: Parameters<typeof toCampaign>[0]) => toCampaign(record)), [allCampaigns]);

  useEffect(() => {
    if (allCampaigns === undefined || allCampaigns.length > 0 || seedAttempted) return;
    setSeedAttempted(true);
    void seedDefaultCampaignRecordsIfEmpty().catch(() => {
      setSeedAttempted(false);
    });
  }, [allCampaigns, seedAttempted, seedDefaultCampaignRecordsIfEmpty]);

  const campaign = useMemo(() => {
    if (campaignRecord) return toCampaign(campaignRecord as never);
    return seededFallback.find((item) => item.id === campaignId) ?? seededFallback[0];
  }, [campaignId, campaignRecord, seededFallback]);
  const relatedApprovals = useMemo(
    () => ((approvalRecords ?? []) as Array<{ linkedCampaignId?: string; title: string; owner: string; riskLevel: string; description: string }>).filter((approval) => approval.linkedCampaignId === campaign?.id),
    [approvalRecords, campaign?.id],
  );
  const perf = performanceSnapshots.find((item) => item.campaignId === campaign?.id);
  const relatedResponses = useMemo(
    () => ((responseRecords ?? []) as Array<{ campaignId?: string; campaignName?: string; summary: string }>).filter((response) => response.campaignId === campaign?.id || response.campaignName === campaign?.name),
    [responseRecords, campaign?.id, campaign?.name],
  );
  const reply = relatedResponses[0];

  if (!campaign) {
    return (
      <div className="space-y-5">
        <SectionHeader eyebrow="Campaign record" title="Campaign" description="Loading campaign record." actions={<Link href="/campaigns"><Button variant="secondary">Back to Campaigns</Button></Link>} />
        <ControlPanel className="p-4 text-sm text-slate-300">Loading campaign from Convex.</ControlPanel>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <SectionHeader
        eyebrow="Campaign record"
        title={campaign.name}
        description={`${campaign.goal} for ${campaign.audience}. Current stage: ${stageForCampaign(campaign)}.`}
        actions={
          <>
            <StatusBadge tone={riskTone(campaign.riskLevel)}>{campaign.riskLevel} risk</StatusBadge>
            <Link href="/campaigns"><Button variant="secondary">Back to Campaigns</Button></Link>
          </>
        }
      />
      <section className="grid gap-4 xl:grid-cols-[1fr_0.8fr]">
        <ControlPanel className="p-4">
          <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-slate-400">Overview</p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {[
              ["Goal", campaign.goal],
              ["Channels", campaign.channels.join(", ")],
              ["Audience", campaign.audience],
              ["Offer", offerName(campaign)],
              ["Owner", ownerName(campaign)],
              ["Approvals", pendingApprovals(campaign)],
              ["Next action", campaign.nextAction],
              ["Last activity", lastActivityForCampaign(campaign)],
            ].map(([label, value]) => (
              <div key={label as string} className="rounded-lg border border-slate-800 bg-slate-950/70 px-3 py-3">
                <p className="text-[0.62rem] font-bold uppercase tracking-[0.18em] text-slate-400">{label as string}</p>
                <p className="mt-2 text-sm text-slate-100">{value as string}</p>
              </div>
            ))}
          </div>
        </ControlPanel>
        <div className="grid gap-4">
          <QueueLane title="Approval Requirements" count={relatedApprovals.length} tone="amber" subtitle="Current human gates for this campaign.">
            <SignalList items={relatedApprovals.map((approval) => ({ label: approval.title, value: approval.owner, tone: riskTone(approval.riskLevel), detail: approval.description }))} />
          </QueueLane>
          <QueueLane title="Response / Performance" count={(reply ? 1 : 0) + (perf ? 1 : 0)} tone="purple" subtitle="Live signals attached to this campaign.">
            <div className="space-y-2">
              {reply ? <div className="rounded-lg border border-slate-800 bg-slate-950/70 px-3 py-3 text-sm text-slate-300">{reply.summary}</div> : null}
              {perf ? <div className="rounded-lg border border-slate-800 bg-slate-950/70 px-3 py-3 text-sm text-slate-300">{perf.summary}</div> : null}
            </div>
          </QueueLane>
        </div>
      </section>
      <section className="grid gap-4 md:grid-cols-3">
        <Card><MailCheck className="h-5 w-5 text-amber-300" /><h3 className="mt-3 text-lg font-semibold text-slate-100">Review console</h3><p className="mt-2 text-sm text-slate-300">Open Bari, Blue, or Internal review lanes as approvals are triggered.</p></Card>
        <Card><Send className="h-5 w-5 text-emerald-300" /><h3 className="mt-3 text-lg font-semibold text-slate-100">Keap prep</h3><p className="mt-2 text-sm text-slate-300">Export remains manual/demo until live integration keys are configured.</p></Card>
        <Card><BrainCircuit className="h-5 w-5 text-violet-300" /><h3 className="mt-3 text-lg font-semibold text-slate-100">Learning loop</h3><p className="mt-2 text-sm text-slate-300">Edit patterns and performance outcomes feed the learning library after review.</p></Card>
      </section>
    </div>
  );
}

export function CampaignRouteSection({ slug }: { slug?: string[] }) {
  if (slug?.[1] === "new") return <CampaignIntakeSection />;
  if (slug?.[1]) return <CampaignDetailSection campaignId={slug[1]} />;
  return <CampaignListSection />;
}
