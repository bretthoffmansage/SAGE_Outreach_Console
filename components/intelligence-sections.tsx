"use client";

import { api } from "@/convex/_generated/api";
import { useAction, useMutation, useQuery } from "convex/react";
import Link from "next/link";
import { type ReactNode, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, RotateCcw, Save, ShieldAlert, Sparkles } from "lucide-react";
import { defaultAgentConfigs, getDefaultAgentConfig } from "@/lib/agent-config";
import {
  COPY_INTELLIGENCE_PLANNED_LAYER_NAMES,
  compareIntelligenceGroupKeys,
  INTELLIGENCE_GROUP_LABELS,
  INTELLIGENCE_GROUP_SORT_KEYS,
  type IntelligenceGroupKey,
  intelligenceGroupKeyForAgentId,
  intelligenceGroupLabelForAgentId,
  INTELLIGENCE_HUB_CARDS,
} from "@/lib/intelligence-groups";
import { agentRunSteps, campaigns, learningInsights } from "@/lib/data/demo-data";
import type { AgentConfigRecord } from "@/lib/domain";
import { CopyIntelligenceSection } from "@/components/copy-intelligence-section";
import { TrendIntelligenceSection } from "@/components/trend-intelligence-section";
import { PerformanceIntelligenceSection } from "@/components/performance-intelligence-section";
import { PlatformConnectorIntelligenceSection } from "@/components/platform-connector-intelligence-section";
import { useAppUser } from "@/components/auth/app-user-context";
import { cn } from "@/lib/utils";
import {
  AgentActivityBars,
  AgentNode,
  Button,
  ConsoleTable,
  ControlPanel,
  InlineAction,
  QueueLane,
  SectionHeader,
  SignalList,
  StatusBadge,
  StatusDot,
  Td,
  Th,
  TableHead,
} from "@/components/ui";

function tone(status: string) {
  if (["completed", "complete", "ready", "demo"].includes(status)) return "green";
  if (["waiting_for_human", "human_pause", "needs_config", "pending", "idle"].includes(status)) return "amber";
  if (["failed", "blocked", "error"].includes(status)) return "red";
  if (["running"].includes(status)) return "blue";
  return "gray";
}

function mapAgentCardStatus(raw?: string): string {
  const s = (raw ?? "pending").toLowerCase();
  if (s === "pending" || s === "idle" || s === "needs_config") return "Planned";
  if (s === "ready" || s === "complete" || s === "completed" || s === "demo") return "Ready";
  if (s === "running") return "Running";
  if (s === "failed" || s === "blocked" || s === "error") return "Error";
  if (s === "human_pause" || s === "waiting_for_human") return "Human review";
  return raw ? raw.replace(/_/g, " ") : "Planned";
}

function humanizeAgentDisplayName(name: string): string {
  return name
    .replace(/\bKeap\s*\/\s*Zapier Prep( Agent)?\b/gi, "Manual Handoff Prep")
    .replace(/\bZapier Prep\b/gi, "Integration handoff prep");
}

function formatAgentRunStatusLabel(status: string): string {
  const s = status.toLowerCase();
  if (s === "completed") return "Completed";
  if (s === "waiting_for_human") return "Waiting for human";
  if (s === "running") return "Running";
  if (s === "failed" || s === "error") return "Error";
  if (s === "blocked") return "Blocked";
  if (s === "pending" || s === "queued") return "Planned / pending";
  return status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function humanizeAgentRunLabel(name: string): string {
  if (name.includes("Campaign Heartbeat Agent")) return "Launch readiness agent";
  if (name.includes("Voice Matching Agent")) return "Voice alignment agent";
  if (name.includes("Approval Router")) return "Review routing agent";
  return name;
}

function formatResponseSourceLabel(source?: string): string {
  if (!source) return "Unknown";
  if (source === "Manual import") return "Manual import (HelpDesk-style)";
  if (source === "Email") return "Email";
  return source.replace(/_/g, " ");
}

function formatSentimentDisplay(s: string): string {
  if (!s) return "—";
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function matchedLaunchPacketName(item: { campaignId?: string; campaignName?: string }, campaignNameById: Map<string, string>): string {
  return item.campaignName ?? (item.campaignId ? campaignNameById.get(item.campaignId) : undefined) ?? "Unmatched";
}

const responseQueues = ["Needs Reply", "Hot Leads", "Questions", "Objections", "Complaints", "Unsubscribes", "Testimonials", "Unmatched", "All Synced"];
const agentDetailTabs = ["overview", "prompt", "io", "rules", "routing", "runtime", "runs"] as const;
type AgentDetailTab = (typeof agentDetailTabs)[number];
type AgentRuntimeRecord = {
  agentId: string;
  status: string;
  isRunning: boolean;
  currentTaskLabel?: string;
  currentTaskDetail?: string;
  lastStartedAt?: number;
  lastFinishedAt?: number;
  lastRunId?: string;
  lastError?: string;
  lastOutputSummary?: string;
  updatedAt: number;
};
type AgentRunRecord = {
  runId: string;
  campaignId?: string;
  agentId: string;
  status: string;
  inputSnapshot?: string;
  outputSummary?: string;
  outputJson?: string;
  startedAt: number;
  finishedAt?: number;
  error?: string;
};
type ResponseRecord = ReturnType<typeof toResponseRecord>;
const actionButtonStyles = "focus-ring inline-flex items-center justify-center gap-2 rounded-lg border px-3.5 py-2 text-sm font-semibold transition";
const inputStyles = "console-field-control focus-ring w-full rounded-lg border border-slate-700 bg-slate-950/80 px-3 py-2 text-slate-100 placeholder:text-slate-500";
const textareaStyles = `${inputStyles} min-h-[120px] resize-y`;

function toResponseRecord(record: {
  responseId: string;
  title: string;
  classification: string;
  status: string;
  sentiment: "positive" | "neutral" | "negative";
  urgency: "low" | "medium" | "high";
  summary: string;
  originalMessage?: string;
  senderName?: string;
  senderEmail?: string;
  receivedAt: number;
  campaignId?: string;
  campaignName?: string;
  matchConfidence?: number;
  recommendedAction: string;
  suggestedReply?: string;
  suggestedReplyStatus?: string;
  noAutoSend: boolean;
  assignedTo?: string;
  source?: string;
  sourceMessageId?: string;
  helpdeskThreadId?: string;
  tags: string[];
  createdAt: number;
  updatedAt: number;
  resolvedAt?: number;
  resolvedBy?: string;
  notes?: string;
  sortOrder: number;
}) {
  return {
    id: record.responseId,
    title: record.title,
    classification: record.classification,
    status: record.status,
    sentiment: record.sentiment,
    urgency: record.urgency,
    summary: record.summary,
    originalMessage: record.originalMessage,
    senderName: record.senderName,
    senderEmail: record.senderEmail,
    receivedAt: record.receivedAt,
    campaignId: record.campaignId,
    campaignName: record.campaignName,
    matchConfidence: record.matchConfidence,
    recommendedAction: record.recommendedAction,
    suggestedReply: record.suggestedReply,
    suggestedReplyStatus: record.suggestedReplyStatus,
    noAutoSend: record.noAutoSend,
    assignedTo: record.assignedTo,
    source: record.source,
    sourceMessageId: record.sourceMessageId,
    helpdeskThreadId: record.helpdeskThreadId,
    tags: record.tags,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    resolvedAt: record.resolvedAt,
    resolvedBy: record.resolvedBy,
    notes: record.notes,
    sortOrder: record.sortOrder,
  };
}

function sanitizeAgentConfigForConvex(config: AgentConfigRecord) {
  return {
    agentId: config.agentId,
    displayName: config.displayName,
    shortDescription: config.shortDescription,
    workflowOrder: config.workflowOrder,
    category: config.category,
    enabled: config.enabled,
    systemPrompt: config.systemPrompt,
    taskPromptTemplate: config.taskPromptTemplate,
    styleGuidance: config.styleGuidance,
    requiredContextSources: config.requiredContextSources,
    exampleReferences: config.exampleReferences,
    preferredProvider: config.preferredProvider,
    preferredModel: config.preferredModel,
    temperature: config.temperature,
    maxTokens: config.maxTokens,
    structuredOutputRequired: config.structuredOutputRequired,
    inputSchemaJson: config.inputSchemaJson,
    outputSchemaJson: config.outputSchemaJson,
    requiredInputs: config.requiredInputs,
    optionalInputs: config.optionalInputs,
    requiredOutputs: config.requiredOutputs,
    escalationMarkers: config.escalationMarkers,
    confidenceField: config.confidenceField,
    riskField: config.riskField,
    activeRules: config.activeRules,
    blockingRules: config.blockingRules,
    warningRules: config.warningRules,
    allowedActions: config.allowedActions,
    disallowedActions: config.disallowedActions,
    humanApprovalRequired: config.humanApprovalRequired,
    canCreateApprovalItems: config.canCreateApprovalItems,
    canModifyCopy: config.canModifyCopy,
    canReadLibraries: config.canReadLibraries,
    canTriggerIntegrations: config.canTriggerIntegrations,
    nextAgentIds: config.nextAgentIds,
    fallbackAgentId: config.fallbackAgentId,
    blockedRoute: config.blockedRoute,
    humanPauseRoute: config.humanPauseRoute,
    handoffConditions: config.handoffConditions,
    retryPolicy: config.retryPolicy,
    maxRetries: config.maxRetries,
    configVersion: config.configVersion,
    lastEditedBy: config.lastEditedBy,
    lastEditedAt: config.lastEditedAt,
    notes: config.notes,
    updatedAt: Date.now(),
    updatedBy: config.lastEditedBy,
  };
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

function statusLabel(status: string) {
  return status.replace(/_/g, " ");
}

function buildRecordMap<T extends { agentId: string }>(records: T[]) {
  return records.reduce<Record<string, T>>((accumulator, record) => {
    accumulator[record.agentId] = { ...record };
    return accumulator;
  }, {});
}

function toLines(value: string[]) {
  return value.join("\n");
}

function fromLines(value: string) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function LabeledField({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <label className="grid gap-2">
      <div>
        <p className="console-field-label text-slate-300">{label}</p>
        {description ? <p className="mt-1 text-xs leading-5 text-slate-400">{description}</p> : null}
      </div>
      {children}
    </label>
  );
}

function ToggleField({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-lg border border-slate-800 bg-slate-950/65 px-3 py-2.5">
      <span className="console-field-control text-slate-200">{label}</span>
      <input
        checked={checked}
        className="focus-ring h-4 w-4 rounded border-slate-600 bg-slate-900 text-sky-400"
        onChange={(event) => onChange(event.target.checked)}
        type="checkbox"
      />
    </label>
  );
}

function IntelligenceHubSection() {
  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <SectionHeader
        eyebrow="Intelligence"
        title="Intelligence hub"
        description="Weekly launch and marketing coordination: Copy Intelligence, Trend signals, Performance patterns, Campaign Heartbeat audit, connectors, and learning loops — mostly configurable, draft-only, and dry-run until you intentionally enable live systems. Hermes by Nous on the office Mac mini is a planned local runtime layer for approved coordination when Operations connects a runtime endpoint — not an uncontrolled autonomous actor."
      />
      <section className="grid gap-3 lg:grid-cols-3">
        {INTELLIGENCE_HUB_CARDS.map((card) => (
          <Link
            className={cn("focus-ring block rounded-xl", card.emphasis ? "lg:col-span-2" : "")}
            href={card.href}
            key={card.id}
          >
            <ControlPanel
              className={cn(
                "h-full p-4 transition hover:border-slate-600",
                card.emphasis ? "border-sky-500/30 bg-slate-950/85" : "",
              )}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-lg font-semibold text-slate-100">{card.title}</h3>
                {card.emphasis ? <StatusBadge tone="blue">Core</StatusBadge> : <StatusBadge tone="gray">Area</StatusBadge>}
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-300">{card.description}</p>
              {card.plannedNote ? <p className="mt-2 text-xs text-slate-500">{card.plannedNote}</p> : null}
              <p className="mt-3 text-xs font-semibold uppercase tracking-[0.16em] text-sky-300">Open linked surface</p>
            </ControlPanel>
          </Link>
        ))}
      </section>
      <ControlPanel className="p-4">
        <p className="text-sm font-semibold text-slate-100">Intelligence routes</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link href="/intelligence/copy">
            <Button variant="secondary">Copy Intelligence</Button>
          </Link>
          <Link href="/intelligence/trends">
            <Button variant="secondary">Trend Intelligence</Button>
          </Link>
          <Link href="/intelligence/performance">
            <Button variant="secondary">Performance Intelligence</Button>
          </Link>
          <Link href="/intelligence/heartbeat">
            <Button variant="secondary">Campaign Heartbeat</Button>
          </Link>
          <Link href="/intelligence/platform-connector">
            <Button variant="secondary">Platform Connector</Button>
          </Link>
          <Link href="/intelligence/responses">
            <Button variant="secondary">Response Intelligence</Button>
          </Link>
          <Link href="/intelligence/agent-runs">
            <Button variant="secondary">Agent Runs</Button>
          </Link>
          <Link href="/intelligence/langgraph">
            <Button variant="secondary">Runtime Map</Button>
          </Link>
        </div>
      </ControlPanel>
    </div>
  );
}

export function AgentRunsSection() {
  const runRows = agentRunSteps.map((step, index) => {
    const campaign = campaigns[index % campaigns.length];
    const isCompleted = step.status === "completed";
    return {
      id: step.id,
      runLabel: `run-${index + 1}`,
      campaignName: campaign?.name ?? "Campaign context",
      campaignId: campaign?.id,
      currentAgent: humanizeAgentRunLabel(step.agentName),
      rawAgentName: step.agentName,
      status: step.status,
      startedFinished: isCompleted ? "14:05 / 14:06" : "14:05 / --",
      blockers: step.status === "waiting_for_human" ? "Waiting for Bari approval" : "No critical blocker",
      outputSummary: step.summary,
      structuredOutputs: step.structuredOutputs,
      safetyMode: "dry_run",
      recommendedNext:
        step.status === "waiting_for_human"
          ? "Pause for human review before the chain continues."
          : "Continue the dry-run chain when the operator is ready — no external write.",
    };
  });
  const [selectedRunId, setSelectedRunId] = useState<string>(runRows[0]?.id ?? "");
  const selectedRun = runRows.find((run) => run.id === selectedRunId) ?? runRows[0];
  const summaryStats = {
    total: runRows.length,
    completed: runRows.filter((run) => run.status === "completed").length,
    waitingForHuman: runRows.filter((run) => run.status === "waiting_for_human").length,
    errors: runRows.filter((run) => run.status === "failed").length,
    running: runRows.filter((run) => run.status === "running").length,
  };

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <SectionHeader
        eyebrow="Intelligence"
        title="Agent Runs"
        description="Review dry-run and configured agent activity across copy workflows, heartbeat checks, response triage, performance reviews, and learning loops. Runs remain audit records until live execution is intentionally connected."
      />
      <div className="flex flex-wrap gap-2">
        <StatusBadge tone="gray">Dry-run / audit</StatusBadge>
        <StatusBadge tone="amber">Human approval required</StatusBadge>
        <StatusBadge tone="gray">No external writes</StatusBadge>
        <StatusBadge tone="blue">Hermes-ready future</StatusBadge>
      </div>
      <p className="text-xs text-slate-500">
        Hermes by Nous can later coordinate approved workflows from the office Mac mini once connected — this view stays read-only audit posture until then.
      </p>
      <section className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
        <ControlPanel className="p-3">
          <p className="text-[0.65rem] font-semibold uppercase tracking-wide text-slate-500">Total runs</p>
          <p className="mt-1 text-xl font-semibold text-slate-100">{summaryStats.total}</p>
        </ControlPanel>
        <ControlPanel className="p-3">
          <p className="text-[0.65rem] font-semibold uppercase tracking-wide text-slate-500">Completed</p>
          <p className="mt-1 text-xl font-semibold text-emerald-200">{summaryStats.completed}</p>
        </ControlPanel>
        <ControlPanel className="p-3">
          <p className="text-[0.65rem] font-semibold uppercase tracking-wide text-slate-500">Waiting for human</p>
          <p className="mt-1 text-xl font-semibold text-amber-200">{summaryStats.waitingForHuman}</p>
        </ControlPanel>
        <ControlPanel className="p-3">
          <p className="text-[0.65rem] font-semibold uppercase tracking-wide text-slate-500">Errors / blockers</p>
          <p className="mt-1 text-xl font-semibold text-rose-200">{summaryStats.errors}</p>
        </ControlPanel>
        <ControlPanel className="p-3">
          <p className="text-[0.65rem] font-semibold uppercase tracking-wide text-slate-500">Running</p>
          <p className="mt-1 text-xl font-semibold text-sky-200">{summaryStats.running}</p>
        </ControlPanel>
      </section>

      <div className="grid gap-4 lg:grid-cols-5">
        <div className="space-y-2 lg:col-span-2">
          <p className="text-sm font-semibold text-slate-100">Runs</p>
          <div className="max-h-[min(28rem,70vh)] space-y-2 overflow-y-auto pr-1">
            {runRows.map((run) => (
              <button
                className={cn(
                  "w-full rounded-xl border px-3 py-2.5 text-left text-sm transition",
                  selectedRun?.id === run.id ? "border-sky-500/40 bg-sky-950/25" : "border-slate-800 bg-slate-950/55 hover:border-slate-600",
                )}
                key={run.id}
                onClick={() => setSelectedRunId(run.id)}
                type="button"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-semibold text-slate-100">{run.runLabel}</span>
                  <StatusBadge tone={tone(run.status)}>{formatAgentRunStatusLabel(run.status)}</StatusBadge>
                </div>
                <p className="mt-1 text-xs text-slate-500">{run.campaignName}</p>
                <p className="mt-0.5 text-xs text-slate-400">{run.currentAgent}</p>
                <p className="mt-1 line-clamp-2 text-xs text-slate-500">{run.outputSummary}</p>
              </button>
            ))}
          </div>
        </div>

        <ControlPanel className="p-4 lg:col-span-3">
          {selectedRun ? (
            <div className="space-y-4 text-sm">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Summary</p>
                <dl className="mt-2 grid gap-2 text-slate-300 sm:grid-cols-2">
                  <div className="rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2">
                    <dt className="text-xs text-slate-500">Run ID</dt>
                    <dd className="font-mono text-xs text-sky-200">{selectedRun.id}</dd>
                  </div>
                  <div className="rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2">
                    <dt className="text-xs text-slate-500">Workflow / campaign</dt>
                    <dd className="text-slate-100">{selectedRun.campaignName}</dd>
                  </div>
                  <div className="rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2">
                    <dt className="text-xs text-slate-500">Current or last agent</dt>
                    <dd className="text-slate-100">{selectedRun.currentAgent}</dd>
                  </div>
                  <div className="rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2">
                    <dt className="text-xs text-slate-500">Status</dt>
                    <dd>
                      <StatusBadge tone={tone(selectedRun.status)}>{formatAgentRunStatusLabel(selectedRun.status)}</StatusBadge>
                    </dd>
                  </div>
                  <div className="rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2 sm:col-span-2">
                    <dt className="text-xs text-slate-500">Started / completed</dt>
                    <dd className="text-slate-200">{selectedRun.startedFinished}</dd>
                  </div>
                  <div className="rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2 sm:col-span-2">
                    <dt className="text-xs text-slate-500">Blocker or human wait</dt>
                    <dd className="text-slate-200">{selectedRun.blockers}</dd>
                  </div>
                </dl>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Output summary</p>
                <p className="mt-2 leading-relaxed text-slate-300">{selectedRun.outputSummary}</p>
                <p className="mt-2 text-xs text-slate-500">
                  <span className="font-semibold text-slate-400">Recommended next step:</span> {selectedRun.recommendedNext}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  <span className="font-semibold text-slate-400">Safety mode:</span>{" "}
                  {selectedRun.safetyMode === "dry_run" ? "Dry-run" : selectedRun.safetyMode.replace(/_/g, " ")}
                </p>
              </div>
              <details className="rounded-lg border border-slate-800 bg-slate-950/50">
                <summary className="cursor-pointer list-none px-3 py-2 text-xs font-semibold text-slate-200 marker:content-none hover:bg-slate-900/60 [&::-webkit-details-marker]:hidden">
                  Structured output <span className="font-normal text-slate-500">(debug)</span>
                </summary>
                <pre className="max-h-64 overflow-auto border-t border-slate-800 p-3 text-xs leading-6 text-slate-400">
                  {JSON.stringify(selectedRun.structuredOutputs, null, 2)}
                </pre>
              </details>
            </div>
          ) : (
            <p className="text-sm text-slate-400">No run selected.</p>
          )}
        </ControlPanel>
      </div>
    </div>
  );
}

export function LangGraphSection() {
  const appUser = useAppUser();
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [activeDetailTab, setActiveDetailTab] = useState<AgentDetailTab>("overview");
  const [draftConfigMap, setDraftConfigMap] = useState<Record<string, AgentConfigRecord>>({});
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isWorking, setIsWorking] = useState(false);
  const [groupFilter, setGroupFilter] = useState<"all" | IntelligenceGroupKey>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "planned" | "ready" | "running" | "error">("all");
  const seedAttemptedRef = useRef(false);

  const agentConfigs = useQuery(api.agents.listAgentConfigs, {});
  const runtimeStates = useQuery(api.agents.listAgentRuntimeStates);
  const selectedRuns = useQuery(
    api.agents.listAgentRunsByAgentId,
    selectedAgentId ? { agentId: selectedAgentId } : "skip",
  );

  const seedDefaultAgentConfigsIfEmpty = useMutation(api.agents.seedDefaultAgentConfigsIfEmpty);
  const seedDefaultAgentRuntimeStatesIfEmpty = useMutation(api.agents.seedDefaultAgentRuntimeStatesIfEmpty);
  const seedDefaultAgentRunsIfEmpty = useMutation(api.agents.seedDefaultAgentRunsIfEmpty);
  const upsertAgentConfig = useMutation(api.agents.upsertAgentConfig);
  const runAgentDryRun = useAction(api.runtimePrep.runAgentDryRun);
  const resetDemoAgentRuntimeState = useMutation(api.agents.resetDemoAgentRuntimeState);

  useEffect(() => {
    if (agentConfigs === undefined || seedAttemptedRef.current || agentConfigs.length > 0) return;

    seedAttemptedRef.current = true;
    void (async () => {
      try {
        const seededConfigs = await seedDefaultAgentConfigsIfEmpty();
        await Promise.all([
          seedDefaultAgentRuntimeStatesIfEmpty(),
          seedDefaultAgentRunsIfEmpty(),
        ]);
        if (seededConfigs.seeded) {
          setFeedback("Default agent configs seeded.");
        }
      } catch {
        setFeedback("Unable to seed default agent configs. Check Convex connection.");
        seedAttemptedRef.current = false;
      }
    })();
  }, [
    agentConfigs,
    seedDefaultAgentConfigsIfEmpty,
    seedDefaultAgentRuntimeStatesIfEmpty,
    seedDefaultAgentRunsIfEmpty,
  ]);

  const persistedConfigMap: Record<string, AgentConfigRecord> = useMemo(
    () => buildRecordMap(agentConfigs ?? defaultAgentConfigs) as Record<string, AgentConfigRecord>,
    [agentConfigs],
  );
  const runtimeMap: Record<string, AgentRuntimeRecord> = useMemo(
    () => buildRecordMap(runtimeStates ?? []) as Record<string, AgentRuntimeRecord>,
    [runtimeStates],
  );
  const effectiveConfigMap: Record<string, AgentConfigRecord> = useMemo(
    () => ({
      ...persistedConfigMap,
      ...draftConfigMap,
    }),
    [draftConfigMap, persistedConfigMap],
  );
  const orderedConfigs: AgentConfigRecord[] = useMemo(
    () => [...Object.values(effectiveConfigMap)].sort((left, right) => left.workflowOrder - right.workflowOrder),
    [effectiveConfigMap],
  );

  const cardsSource = useMemo(() => {
    let list = orderedConfigs;
    if (groupFilter !== "all") {
      list = list.filter((c) => intelligenceGroupKeyForAgentId(c.agentId) === groupFilter);
    }
    if (statusFilter !== "all") {
      list = list.filter((c) => {
        const m = mapAgentCardStatus(runtimeMap[c.agentId]?.status);
        if (statusFilter === "planned") return m === "Planned";
        if (statusFilter === "ready") return m === "Ready";
        if (statusFilter === "running") return m === "Running";
        if (statusFilter === "error") return m === "Error";
        return true;
      });
    }
    return list;
  }, [orderedConfigs, groupFilter, statusFilter, runtimeMap]);

  const groupedCards = useMemo(() => {
    const buckets = new Map<IntelligenceGroupKey | null, AgentConfigRecord[]>();
    for (const cfg of cardsSource) {
      const key = intelligenceGroupKeyForAgentId(cfg.agentId);
      const arr = buckets.get(key) ?? [];
      arr.push(cfg);
      buckets.set(key, arr);
    }
    return buckets;
  }, [cardsSource]);

  const sortedGroupKeys = useMemo(
    () => [...groupedCards.keys()].sort((a, b) => compareIntelligenceGroupKeys(a, b)),
    [groupedCards],
  );
  const selectedConfig = selectedAgentId ? effectiveConfigMap[selectedAgentId] ?? null : null;
  const selectedRuntime: AgentRuntimeRecord | null = selectedAgentId ? runtimeMap[selectedAgentId] ?? null : null;
  const selectedRunsList: AgentRunRecord[] = (selectedRuns ?? []) as AgentRunRecord[];
  const actorName = appUser.displayName || appUser.clerkUserId || "console_operator";

  const updateConfig = <K extends keyof AgentConfigRecord>(agentId: string, key: K, value: AgentConfigRecord[K]) => {
    setDraftConfigMap((current) => ({
      ...current,
      [agentId]: {
        ...(current[agentId] ?? persistedConfigMap[agentId]),
        [key]: value,
      },
    }));
  };

  const saveConfiguration = async () => {
    if (!selectedAgentId || !selectedConfig) return;

    setIsWorking(true);
    try {
      const savedAt = Date.now();
      await upsertAgentConfig({
        agentId: selectedAgentId,
        patch: {
          ...sanitizeAgentConfigForConvex(selectedConfig),
          configVersion: (persistedConfigMap[selectedAgentId]?.configVersion ?? selectedConfig.configVersion) + 1,
          lastEditedAt: savedAt,
          lastEditedBy: actorName,
          updatedAt: savedAt,
          updatedBy: actorName,
        },
      });
      setDraftConfigMap((current) => {
        const next = { ...current };
        delete next[selectedAgentId];
        return next;
      });
      setFeedback(`${selectedConfig.displayName} configuration saved to Convex.`);
    } catch {
      setFeedback("Unable to save configuration. Check Convex connection.");
    } finally {
      setIsWorking(false);
    }
  };

  const resetDemoState = async () => {
    if (!selectedAgentId) return;

    const fallbackConfig = getDefaultAgentConfig(selectedAgentId);
    if (!fallbackConfig) return;

    setIsWorking(true);
    try {
      const savedAt = Date.now();
      await upsertAgentConfig({
        agentId: selectedAgentId,
        patch: {
          ...sanitizeAgentConfigForConvex(fallbackConfig),
          configVersion: (persistedConfigMap[selectedAgentId]?.configVersion ?? fallbackConfig.configVersion) + 1,
          lastEditedAt: savedAt,
          lastEditedBy: actorName,
          updatedAt: savedAt,
          updatedBy: actorName,
        },
      });
      await resetDemoAgentRuntimeState({ agentId: selectedAgentId });
      setDraftConfigMap((current) => {
        const next = { ...current };
        delete next[selectedAgentId];
        return next;
      });
      setFeedback(`${fallbackConfig.displayName} demo state reset.`);
    } catch {
      setFeedback("Unable to reset configuration. Check Convex connection.");
    } finally {
      setIsWorking(false);
    }
  };

  const testAgent = async () => {
    if (!selectedAgentId || !selectedConfig) return;

    setIsWorking(true);
    try {
      await runAgentDryRun({
        agentId: selectedAgentId,
        campaignId: "camp_reactivation_may",
      });
      setFeedback(`${selectedConfig.displayName} test run completed.`);
    } catch {
      setFeedback("Unable to run test agent. Check Convex connection.");
    } finally {
      setIsWorking(false);
    }
  };

  if (agentConfigs === undefined || runtimeStates === undefined || (selectedAgentId && selectedRuns === undefined)) {
    return (
      <div className="mx-auto max-w-7xl space-y-5">
        <SectionHeader
          eyebrow="Intelligence"
          title="Intelligence Runtime Map"
          description="Multi-agent copy and coordination graph — configurable, dry-run friendly, human approval first. Loading agent configs from Convex."
        />
        <ControlPanel className="p-4">
          <p className="text-sm text-slate-300">Loading agent configs from Convex.</p>
        </ControlPanel>
      </div>
    );
  }

  if (!orderedConfigs.length) {
    return (
      <div className="mx-auto max-w-7xl space-y-5">
        <SectionHeader
          eyebrow="Intelligence"
          title="Intelligence Runtime Map"
          description="Multi-agent copy and coordination graph — configurable, dry-run friendly, human approval first."
        />
        <ControlPanel className="p-4">
          <p className="text-sm text-slate-300">Seeding default agent configs.</p>
        </ControlPanel>
        {feedback ? (
          <ControlPanel className="p-4">
            <p className="text-sm text-slate-300">{feedback}</p>
          </ControlPanel>
        ) : null}
      </div>
    );
  }

  if (selectedAgentId && selectedConfig && selectedRuntime) {
    const activeAgentId = selectedAgentId;

    return (
      <div className="mx-auto max-w-7xl space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-950/70 p-5">
          <div className="space-y-3">
            <button
              className={cn(actionButtonStyles, "border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800")}
              onClick={() => {
                setSelectedAgentId(null);
                setActiveDetailTab("overview");
              }}
              type="button"
            >
              <ChevronLeft className="h-4 w-4" />
              Back to runtime map
            </button>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge tone="blue">{intelligenceGroupLabelForAgentId(activeAgentId)}</StatusBadge>
                <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-slate-500">Category · {selectedConfig.category}</p>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <h2 className="text-2xl font-semibold tracking-tight text-slate-50 md:text-3xl">{humanizeAgentDisplayName(selectedConfig.displayName)}</h2>
                <StatusBadge tone={tone(selectedRuntime.status)}>{mapAgentCardStatus(selectedRuntime.status)}</StatusBadge>
              </div>
              <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-300">{selectedConfig.shortDescription}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              className={cn(actionButtonStyles, "border-slate-700 bg-slate-900 text-slate-100 hover:bg-slate-800")}
              disabled={isWorking}
              onClick={() => {
                void testAgent();
              }}
              type="button"
            >
              <Sparkles className="h-4 w-4" />
              Test agent
            </button>
            <button
              className={cn(actionButtonStyles, "border-slate-700 bg-slate-900 text-slate-100 hover:bg-slate-800")}
              disabled={isWorking}
              onClick={() => {
                void resetDemoState();
              }}
              type="button"
            >
              <RotateCcw className="h-4 w-4" />
              Reset demo state
            </button>
            <button
              className={cn(actionButtonStyles, "border-sky-500/60 bg-sky-500 text-slate-950 hover:bg-sky-400")}
              disabled={isWorking}
              onClick={() => {
                void saveConfiguration();
              }}
              type="button"
            >
              <Save className="h-4 w-4" />
              Save configuration
            </button>
          </div>
        </div>

        {feedback ? (
          <div
            className={cn(
              "rounded-xl px-4 py-3 text-sm",
              feedback.startsWith("Unable")
                ? "border border-rose-500/30 bg-rose-500/10 text-rose-100"
                : "border border-sky-500/30 bg-sky-500/10 text-sky-100",
            )}
          >
            {feedback}
          </div>
        ) : null}

        <div className="overflow-x-auto">
          <div className="flex min-w-max gap-2 rounded-xl border border-slate-800 bg-slate-950/60 p-2">
            {agentDetailTabs.map((tab) => {
              const labelMap: Record<AgentDetailTab, string> = {
                overview: "Overview",
                prompt: "Prompt",
                io: "I/O Contract",
                rules: "Rules",
                routing: "Routing",
                runtime: "Runtime",
                runs: "Runs",
              };
              const isActive = activeDetailTab === tab;
              return (
                <button
                  aria-pressed={isActive}
                  className={cn(
                    "focus-ring rounded-lg border border-transparent px-3 py-1.5 text-sm font-medium text-slate-300 transition hover:border-slate-700 hover:bg-slate-900/80",
                    isActive && "border-sky-500/40 bg-slate-900 text-sky-200 shadow-[inset_0_-2px_0_0_rgba(56,189,248,0.9)]",
                  )}
                  key={tab}
                  onClick={() => setActiveDetailTab(tab)}
                  type="button"
                >
                  {labelMap[tab]}
                </button>
              );
            })}
          </div>
        </div>

        {activeDetailTab === "overview" ? (
          <section className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <ControlPanel className="p-3">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Status</p>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <StatusBadge tone={tone(selectedRuntime.status)}>{statusLabel(selectedRuntime.status)}</StatusBadge>
                  <AgentActivityBars active={selectedRuntime.isRunning || selectedRuntime.status === "running"} />
                </div>
                <p className="mt-3 text-sm font-semibold text-slate-100">{selectedRuntime.currentTaskLabel ?? "No live task"}</p>
                <p className="mt-1 text-xs leading-5 text-slate-400">{selectedRuntime.currentTaskDetail ?? "Runtime is ready for future live execution updates."}</p>
              </ControlPanel>

              <ControlPanel className="p-3">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Provider / Model</p>
                <div className="mt-3 grid gap-2 text-sm text-slate-300">
                  <div className="flex items-center justify-between gap-3"><span>Provider</span><span className="text-slate-100">{selectedConfig.preferredProvider}</span></div>
                  <div className="flex items-center justify-between gap-3"><span>Model</span><span className="truncate text-slate-100">{selectedConfig.preferredModel}</span></div>
                  <div className="flex items-center justify-between gap-3"><span>Structured output</span><span className="text-slate-100">{selectedConfig.structuredOutputRequired ? "Required" : "Optional"}</span></div>
                  <div className="flex items-center justify-between gap-3"><span>Temp / Tokens</span><span className="text-slate-100">{selectedConfig.temperature} / {selectedConfig.maxTokens}</span></div>
                </div>
              </ControlPanel>

              <ControlPanel className="p-3">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Last run</p>
                <div className="mt-3 grid gap-2 text-sm text-slate-300">
                  <div className="flex items-center justify-between gap-3"><span>Started</span><span className="text-slate-100">{formatTimestamp(selectedRuntime.lastStartedAt)}</span></div>
                  <div className="flex items-center justify-between gap-3"><span>Finished</span><span className="text-slate-100">{formatTimestamp(selectedRuntime.lastFinishedAt)}</span></div>
                  <div className="flex items-center justify-between gap-3"><span>Run ID</span><span className="truncate text-slate-100">{selectedRuntime.lastRunId ?? "Not available"}</span></div>
                </div>
                {selectedRuntime.lastError ? (
                  <p className="mt-2 text-xs text-rose-200">Error: {selectedRuntime.lastError}</p>
                ) : null}
              </ControlPanel>

              <ControlPanel className="p-3">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Enabled</p>
                <div className="mt-3 grid gap-2 text-sm text-slate-300">
                  <div className="flex items-center justify-between gap-3"><span>Agent enabled</span><span className="text-slate-100">{selectedConfig.enabled ? "Yes" : "No"}</span></div>
                  <div className="flex items-center justify-between gap-3"><span>Workflow order</span><span className="text-slate-100">{selectedConfig.workflowOrder}</span></div>
                  <div className="flex items-center justify-between gap-3"><span>Category</span><span className="text-slate-100">{selectedConfig.category}</span></div>
                  <div className="flex items-center justify-between gap-3">
                    <span>Intelligence area (UI)</span>
                    <span className="text-right text-slate-100">{intelligenceGroupLabelForAgentId(activeAgentId)}</span>
                  </div>
                </div>
              </ControlPanel>
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
              <ControlPanel className="p-4">
                <div className="flex items-center gap-2">
                  <StatusDot tone="blue" />
                  <h3 className="text-sm font-semibold text-slate-100">Agent Role & Purpose</h3>
                </div>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <LabeledField label="Display name">
                    <input className={inputStyles} onChange={(event) => updateConfig(activeAgentId, "displayName", event.target.value)} type="text" value={selectedConfig.displayName} />
                  </LabeledField>
                  <LabeledField label="Category">
                    <input className={inputStyles} onChange={(event) => updateConfig(activeAgentId, "category", event.target.value)} type="text" value={selectedConfig.category} />
                  </LabeledField>
                </div>
                <div className="mt-4">
                  <LabeledField label="Short description">
                    <textarea className={`${inputStyles} min-h-[84px] resize-y`} onChange={(event) => updateConfig(activeAgentId, "shortDescription", event.target.value)} value={selectedConfig.shortDescription} />
                  </LabeledField>
                </div>
              </ControlPanel>

              <ControlPanel className="p-4">
                <h3 className="text-sm font-semibold text-slate-100">Required Context Sources</h3>
                <div className="mt-3 flex flex-wrap gap-2">
                  {selectedConfig.requiredContextSources.length ? selectedConfig.requiredContextSources.map((source) => (
                    <span className="rounded-full border border-slate-700 bg-slate-900/70 px-2.5 py-1 text-xs text-slate-200" key={source}>
                      {source}
                    </span>
                  )) : (
                    <span className="text-sm text-slate-400">No context sources configured.</span>
                  )}
                </div>
                <div className="mt-4">
                  <LabeledField label="Edit context sources" description="One source per line.">
                    <textarea className={`${inputStyles} min-h-[84px] resize-y`} onChange={(event) => updateConfig(activeAgentId, "requiredContextSources", fromLines(event.target.value))} value={toLines(selectedConfig.requiredContextSources)} />
                  </LabeledField>
                </div>
              </ControlPanel>

              <ControlPanel className="p-4">
                <h3 className="text-sm font-semibold text-slate-100">Last Output Summary</h3>
                <p className="mt-3 text-sm leading-6 text-slate-200">{selectedRuntime.lastOutputSummary ?? "No output recorded yet."}</p>
              </ControlPanel>

              <ControlPanel className="p-4">
                <h3 className="text-sm font-semibold text-slate-100">Config Metadata</h3>
                <div className="mt-4 grid gap-2 text-sm text-slate-300">
                  <div className="flex items-center justify-between gap-3"><span>Agent ID</span><span className="text-slate-100">{selectedConfig.agentId}</span></div>
                  <div className="flex items-center justify-between gap-3"><span>Config version</span><span className="text-slate-100">{selectedConfig.configVersion}</span></div>
                  <div className="flex items-center justify-between gap-3"><span>Last edited by</span><span className="text-slate-100">{selectedConfig.lastEditedBy ?? "system_seed"}</span></div>
                  <div className="flex items-center justify-between gap-3"><span>Last edited at</span><span className="text-slate-100">{formatTimestamp(selectedConfig.lastEditedAt)}</span></div>
                </div>
                <p className="mt-3 text-xs text-slate-400">Persists via Convex `agentConfigs`; runtime and run history sync through `agentRuntimeStates` and `agentRuns`.</p>
                {selectedConfig.notes ? <p className="mt-2 text-xs text-slate-300">Notes: {selectedConfig.notes}</p> : null}
              </ControlPanel>
            </div>
          </section>
        ) : null}

        <section className="grid gap-4 xl:grid-cols-1">
          {activeDetailTab === "prompt" || activeDetailTab === "io" || activeDetailTab === "rules" || activeDetailTab === "routing" ? (
            <div className="space-y-4">
              {activeDetailTab === "prompt" ? (
                <ControlPanel className="p-4">
                  <div className="flex items-center gap-2">
                    <StatusDot tone="purple" />
                    <h3 className="text-sm font-semibold text-slate-100">Prompt Configuration</h3>
                  </div>
                  <div className="mt-4 grid gap-4">
                    <LabeledField label="System prompt">
                      <textarea className={textareaStyles} onChange={(event) => updateConfig(activeAgentId, "systemPrompt", event.target.value)} value={selectedConfig.systemPrompt} />
                    </LabeledField>
                    <LabeledField label="Task prompt template">
                      <textarea className={textareaStyles} onChange={(event) => updateConfig(activeAgentId, "taskPromptTemplate", event.target.value)} value={selectedConfig.taskPromptTemplate} />
                    </LabeledField>
                    <LabeledField label="Style guidance">
                      <textarea className={textareaStyles} onChange={(event) => updateConfig(activeAgentId, "styleGuidance", event.target.value)} value={selectedConfig.styleGuidance ?? ""} />
                    </LabeledField>
                    <LabeledField label="Example references">
                      <textarea className={textareaStyles} onChange={(event) => updateConfig(activeAgentId, "exampleReferences", fromLines(event.target.value))} value={toLines(selectedConfig.exampleReferences ?? [])} />
                    </LabeledField>
                  </div>
                </ControlPanel>
              ) : null}

              {activeDetailTab === "io" ? (
                <ControlPanel className="p-4">
                  <div className="flex items-center gap-2">
                    <StatusDot tone="green" />
                    <h3 className="text-sm font-semibold text-slate-100">Input / Output Contracts</h3>
                  </div>
                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <LabeledField label="Input schema JSON">
                      <textarea className={`${textareaStyles} console-code`} onChange={(event) => updateConfig(activeAgentId, "inputSchemaJson", event.target.value)} value={selectedConfig.inputSchemaJson} />
                    </LabeledField>
                    <LabeledField label="Output schema JSON">
                      <textarea className={`${textareaStyles} console-code`} onChange={(event) => updateConfig(activeAgentId, "outputSchemaJson", event.target.value)} value={selectedConfig.outputSchemaJson} />
                    </LabeledField>
                    <LabeledField label="Required inputs">
                      <textarea className={textareaStyles} onChange={(event) => updateConfig(activeAgentId, "requiredInputs", fromLines(event.target.value))} value={toLines(selectedConfig.requiredInputs)} />
                    </LabeledField>
                    <LabeledField label="Required outputs">
                      <textarea className={textareaStyles} onChange={(event) => updateConfig(activeAgentId, "requiredOutputs", fromLines(event.target.value))} value={toLines(selectedConfig.requiredOutputs)} />
                    </LabeledField>
                    <LabeledField label="Optional inputs">
                      <textarea className={textareaStyles} onChange={(event) => updateConfig(activeAgentId, "optionalInputs", fromLines(event.target.value))} value={toLines(selectedConfig.optionalInputs)} />
                    </LabeledField>
                    <LabeledField label="Escalation markers">
                      <textarea className={textareaStyles} onChange={(event) => updateConfig(activeAgentId, "escalationMarkers", fromLines(event.target.value))} value={toLines(selectedConfig.escalationMarkers)} />
                    </LabeledField>
                  </div>
                </ControlPanel>
              ) : null}

              {activeDetailTab === "rules" ? (
                <ControlPanel className="p-4">
                  <div className="flex items-center gap-2">
                    <StatusDot tone="amber" />
                    <h3 className="text-sm font-semibold text-slate-100">Rules & Guardrails</h3>
                  </div>
                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <LabeledField label="Active rules">
                      <textarea className={textareaStyles} onChange={(event) => updateConfig(activeAgentId, "activeRules", fromLines(event.target.value))} value={toLines(selectedConfig.activeRules)} />
                    </LabeledField>
                    <LabeledField label="Blocking rules">
                      <textarea className={textareaStyles} onChange={(event) => updateConfig(activeAgentId, "blockingRules", fromLines(event.target.value))} value={toLines(selectedConfig.blockingRules)} />
                    </LabeledField>
                    <LabeledField label="Warning rules">
                      <textarea className={textareaStyles} onChange={(event) => updateConfig(activeAgentId, "warningRules", fromLines(event.target.value))} value={toLines(selectedConfig.warningRules)} />
                    </LabeledField>
                    <LabeledField label="Allowed actions">
                      <textarea className={textareaStyles} onChange={(event) => updateConfig(activeAgentId, "allowedActions", fromLines(event.target.value))} value={toLines(selectedConfig.allowedActions)} />
                    </LabeledField>
                    <LabeledField label="Disallowed actions">
                      <textarea className={textareaStyles} onChange={(event) => updateConfig(activeAgentId, "disallowedActions", fromLines(event.target.value))} value={toLines(selectedConfig.disallowedActions)} />
                    </LabeledField>
                  </div>
                  <div className="mt-4 grid gap-2 md:grid-cols-2">
                    <ToggleField checked={selectedConfig.humanApprovalRequired} label="Human approval required" onChange={(next) => updateConfig(activeAgentId, "humanApprovalRequired", next)} />
                    <ToggleField checked={selectedConfig.canCreateApprovalItems} label="Can create approval items" onChange={(next) => updateConfig(activeAgentId, "canCreateApprovalItems", next)} />
                    <ToggleField checked={selectedConfig.canModifyCopy} label="Can modify copy" onChange={(next) => updateConfig(activeAgentId, "canModifyCopy", next)} />
                    <ToggleField checked={selectedConfig.canReadLibraries} label="Can read libraries" onChange={(next) => updateConfig(activeAgentId, "canReadLibraries", next)} />
                    <ToggleField checked={selectedConfig.canTriggerIntegrations} label="Can trigger integrations" onChange={(next) => updateConfig(activeAgentId, "canTriggerIntegrations", next)} />
                    <ToggleField checked={selectedConfig.enabled} label="Agent enabled" onChange={(next) => updateConfig(activeAgentId, "enabled", next)} />
                  </div>
                </ControlPanel>
              ) : null}

              {activeDetailTab === "routing" ? (
                <ControlPanel className="p-4">
                  <div className="flex items-center gap-2">
                    <StatusDot tone="blue" />
                    <h3 className="text-sm font-semibold text-slate-100">Routing & Handoff</h3>
                  </div>
                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <LabeledField label="Next agent IDs">
                      <textarea className={textareaStyles} onChange={(event) => updateConfig(activeAgentId, "nextAgentIds", fromLines(event.target.value))} value={toLines(selectedConfig.nextAgentIds)} />
                    </LabeledField>
                    <LabeledField label="Handoff conditions">
                      <textarea className={textareaStyles} onChange={(event) => updateConfig(activeAgentId, "handoffConditions", fromLines(event.target.value))} value={toLines(selectedConfig.handoffConditions)} />
                    </LabeledField>
                    <LabeledField label="Fallback agent">
                      <input className={inputStyles} onChange={(event) => updateConfig(activeAgentId, "fallbackAgentId", event.target.value)} type="text" value={selectedConfig.fallbackAgentId ?? ""} />
                    </LabeledField>
                    <LabeledField label="Blocked route">
                      <input className={inputStyles} onChange={(event) => updateConfig(activeAgentId, "blockedRoute", event.target.value)} type="text" value={selectedConfig.blockedRoute ?? ""} />
                    </LabeledField>
                    <LabeledField label="Human pause route">
                      <input className={inputStyles} onChange={(event) => updateConfig(activeAgentId, "humanPauseRoute", event.target.value)} type="text" value={selectedConfig.humanPauseRoute ?? ""} />
                    </LabeledField>
                    <LabeledField label="Retry policy">
                      <input className={inputStyles} onChange={(event) => updateConfig(activeAgentId, "retryPolicy", event.target.value)} type="text" value={selectedConfig.retryPolicy ?? ""} />
                    </LabeledField>
                    <LabeledField label="Max retries">
                      <input className={inputStyles} min={0} onChange={(event) => updateConfig(activeAgentId, "maxRetries", Number(event.target.value) || 0)} type="number" value={selectedConfig.maxRetries} />
                    </LabeledField>
                  </div>
                </ControlPanel>
              ) : null}
            </div>
          ) : null}

          {activeDetailTab === "runtime" || activeDetailTab === "runs" ? (
            <div className="space-y-4">
              {activeDetailTab === "runtime" ? (
                <ControlPanel className="p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-100">Runtime Status</p>
                      <p className="mt-2 text-xs leading-5 text-slate-400">
                        Reactive runtime shape for Copy Intelligence layers. Hermes by Nous on the office Mac mini is a planned separate local runtime for approved coordination — not wired from this panel until Operations configures a runtime endpoint.
                      </p>
                    </div>
                    <StatusBadge tone={tone(selectedRuntime.status)}>{statusLabel(selectedRuntime.status)}</StatusBadge>
                  </div>
                  <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/65 p-3">
                    <div className="flex items-center gap-3">
                      <AgentActivityBars active={selectedRuntime.isRunning || selectedRuntime.status === "running"} />
                      <div>
                        <p className="text-sm font-semibold text-slate-100">{selectedRuntime.currentTaskLabel ?? "No live task"}</p>
                        <p className="mt-1 text-xs leading-5 text-slate-400">{selectedRuntime.currentTaskDetail ?? "Runtime is ready for future live execution updates."}</p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 grid gap-3 text-sm text-slate-300">
                    <div className="flex items-center justify-between gap-3"><span>Last started</span><span className="text-slate-100">{formatTimestamp(selectedRuntime.lastStartedAt)}</span></div>
                    <div className="flex items-center justify-between gap-3"><span>Last finished</span><span className="text-slate-100">{formatTimestamp(selectedRuntime.lastFinishedAt)}</span></div>
                    <div className="flex items-center justify-between gap-3"><span>Last run ID</span><span className="truncate text-slate-100">{selectedRuntime.lastRunId ?? "Not available"}</span></div>
                  </div>
                  <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/65 p-3">
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Last output summary</p>
                    <p className="mt-2 text-sm leading-6 text-slate-200">{selectedRuntime.lastOutputSummary ?? "No output summary recorded."}</p>
                  </div>
                  {selectedRuntime.lastError ? (
                    <div className="mt-4 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3">
                      <p className="text-xs font-bold uppercase tracking-[0.16em] text-rose-200">Last error</p>
                      <p className="mt-2 text-sm leading-6 text-rose-100">{selectedRuntime.lastError}</p>
                    </div>
                  ) : null}
                </ControlPanel>
              ) : null}

              {activeDetailTab === "runs" ? (
                <ControlPanel className="p-4">
                  <p className="text-sm font-semibold text-slate-100">Recent Runs</p>
                  <div className="mt-4 space-y-3">
                    {selectedRunsList.length ? selectedRunsList.slice(0, 5).map((run) => (
                      <div key={run.runId} className="rounded-xl border border-slate-800 bg-slate-950/65 p-3">
                        <div className="flex items-center justify-between gap-3">
                          <p className="truncate text-sm font-semibold text-slate-100">{run.runId}</p>
                          <StatusBadge tone={tone(run.status)}>{statusLabel(run.status)}</StatusBadge>
                        </div>
                        <p className="mt-2 text-xs text-slate-400">{formatTimestamp(run.startedAt)}{run.finishedAt ? ` → ${formatTimestamp(run.finishedAt)}` : " → running"}</p>
                        <p className="mt-2 text-sm leading-6 text-slate-300">{run.outputSummary ?? "No output summary recorded."}</p>
                        <p className="mt-2 text-xs font-semibold uppercase tracking-[0.16em] text-sky-200">Open details</p>
                      </div>
                    )) : (
                      <div className="rounded-xl border border-slate-800 bg-slate-950/65 p-3 text-sm text-slate-300">
                        No runs recorded for this agent yet.
                      </div>
                    )}
                  </div>
                </ControlPanel>
              ) : null}
            </div>
          ) : null}
        </section>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <SectionHeader
        eyebrow="Intelligence"
        title="Intelligence Runtime Map"
        description="Map configured and planned intelligence layers across Copy, Trend, Performance, Platform Connector, Learning, Response, and Campaign Heartbeat. Most nodes are dry-run or planned; live execution remains disabled until intentionally enabled."
      />
      <ControlPanel className="p-4">
        <p className="text-sm font-semibold text-slate-100">Filter map</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            className={cn(
              "focus-ring rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition",
              groupFilter === "all" ? "border-sky-500/50 bg-sky-950/40 text-sky-200" : "border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800",
            )}
            onClick={() => setGroupFilter("all")}
            type="button"
          >
            All groups
          </button>
          {INTELLIGENCE_GROUP_SORT_KEYS.map((key) => (
            <button
              className={cn(
                "focus-ring rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition",
                groupFilter === key ? "border-sky-500/50 bg-sky-950/40 text-sky-200" : "border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800",
              )}
              key={key}
              onClick={() => setGroupFilter(key)}
              type="button"
            >
              {INTELLIGENCE_GROUP_LABELS[key]}
            </button>
          ))}
        </div>
        <p className="mt-4 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Status</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {(
            [
              ["all", "All"],
              ["planned", "Planned"],
              ["ready", "Ready"],
              ["running", "Running"],
              ["error", "Error"],
            ] as const
          ).map(([val, label]) => (
            <button
              className={cn(
                "focus-ring rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition",
                statusFilter === val ? "border-sky-500/50 bg-sky-950/40 text-sky-200" : "border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800",
              )}
              key={val}
              onClick={() => setStatusFilter(val)}
              type="button"
            >
              {label}
            </button>
          ))}
        </div>
      </ControlPanel>
      <details className="overflow-hidden rounded-lg border border-slate-800 bg-slate-950/60">
        <summary className="cursor-pointer list-none px-3 py-2.5 text-sm font-semibold text-slate-200 marker:content-none hover:bg-slate-900/70 [&::-webkit-details-marker]:hidden">
          Copy Intelligence — planned agent layers <span className="font-normal text-slate-500">(roadmap; not all are live nodes)</span>
        </summary>
        <div className="border-t border-slate-800 px-3 py-3">
          <ul className="grid gap-1 text-xs leading-5 text-slate-400 sm:grid-cols-2">
            {COPY_INTELLIGENCE_PLANNED_LAYER_NAMES.map((name) => (
              <li key={name}>· {name}</li>
            ))}
          </ul>
        </div>
      </details>
      <div className="space-y-8">
        {sortedGroupKeys.map((gk) => {
          const list = groupedCards.get(gk) ?? [];
          if (!list.length) return null;
          return (
            <section className="space-y-3" key={String(gk)}>
              <h3 className="text-sm font-semibold tracking-wide text-slate-200">{gk ? INTELLIGENCE_GROUP_LABELS[gk] : "Workflow"}</h3>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                {list.map((config) => {
                  const runtime = runtimeMap[config.agentId];
                  const nextLabel = config.nextAgentIds.length
                    ? config.nextAgentIds
                        .map((nextId) => humanizeAgentDisplayName(effectiveConfigMap[nextId]?.displayName ?? nextId))
                        .join(", ")
                    : "Workflow terminal node";

                  return (
                    <button
                      aria-label={`Open ${config.displayName} configuration`}
                      className="focus-ring rounded-xl text-left"
                      key={config.agentId}
                      onClick={() => {
                        setSelectedAgentId(config.agentId);
                        setActiveDetailTab("overview");
                        setFeedback(null);
                      }}
                      type="button"
                    >
                      <AgentNode
                        actionLabel="View config"
                        clickable
                        currentTaskLabel={runtime?.currentTaskLabel}
                        groupLabel={intelligenceGroupLabelForAgentId(config.agentId)}
                        isRunning={runtime?.isRunning}
                        label={humanizeAgentDisplayName(config.displayName)}
                        meta={config.nextAgentIds.length > 0 ? `Next: ${nextLabel}` : nextLabel}
                        state={mapAgentCardStatus(runtime?.status)}
                        tone={tone(runtime?.status ?? "pending")}
                      />
                    </button>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
      {groupFilter === "all" || groupFilter === "runtime_hermes" ? (
        <ControlPanel className="p-4">
          <h3 className="text-sm font-semibold text-slate-100">{INTELLIGENCE_GROUP_LABELS.runtime_hermes}</h3>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Hermes by Nous can later coordinate approved workflows from the office Mac mini once Operations connects the runtime endpoint. Until then, this map is configuration and dry-run visibility — not live autonomous execution.
          </p>
        </ControlPanel>
      ) : null}
      <ControlPanel className="p-4">
        <div className="flex items-start gap-3">
          <ShieldAlert className="mt-0.5 h-4 w-4 text-amber-300" />
          <p className="text-sm leading-6 text-slate-300">
            Human approval remains authoritative between review routing and any manual handoff or integration prep. High-risk claims, founder voice work, and blocked rules pause the flow. Agents suggest and structure; operators decide. Chains remain configurable and dry-run until live execution is intentionally enabled.
          </p>
        </div>
      </ControlPanel>
    </div>
  );
}

export function ResponsesSection() {
  const appUser = useAppUser();
  const [activeFilter, setActiveFilter] = useState("All Synced");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [notesDraft, setNotesDraft] = useState("");
  const [replyDraft, setReplyDraft] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [seedAttempted, setSeedAttempted] = useState(false);
  const responseRecords = useQuery(api.responses.listResponseRecords);
  const campaignRecords = useQuery(api.campaigns.listCampaignRecords);
  const seedDefaultResponseRecordsIfEmpty = useMutation(api.responses.seedDefaultResponseRecordsIfEmpty);
  const updateSuggestedReply = useMutation(api.responses.updateSuggestedReply);
  const updateResponseNotes = useMutation(api.responses.updateResponseNotes);
  const markResponseResolved = useMutation(api.responses.markResponseResolved);
  const markResponseNeedsReply = useMutation(api.responses.markResponseNeedsReply);

  useEffect(() => {
    if (responseRecords === undefined || responseRecords.length > 0 || seedAttempted) return;
    setSeedAttempted(true);
    void seedDefaultResponseRecordsIfEmpty().catch(() => {
      setFeedback("Unable to load response records.");
      setSeedAttempted(false);
    });
  }, [responseRecords, seedAttempted, seedDefaultResponseRecordsIfEmpty]);

  const responses: ResponseRecord[] = useMemo(() => (responseRecords ?? []).map((record: Parameters<typeof toResponseRecord>[0]) => toResponseRecord(record)), [responseRecords]);
  const campaignNameById: Map<string, string> = useMemo(
    () => new Map((campaignRecords ?? []).map((campaign: { campaignId: string; name: string }) => [campaign.campaignId, campaign.name])),
    [campaignRecords],
  );
  const filterCount = (queue: string) => {
    if (queue === "All Synced") return responses.length;
    if (queue === "Needs Reply") return responses.filter((item) => item.classification === "Needs Reply" || item.status === "needs_reply").length;
    if (queue === "Hot Leads") return responses.filter((item) => item.tags.includes("hot_lead") || (item.sentiment === "positive" && item.urgency !== "low")).length;
    if (queue === "Questions") return responses.filter((item) => item.tags.includes("question")).length;
    if (queue === "Objections") return responses.filter((item) => item.classification === "Objections" || item.tags.includes("objection")).length;
    if (queue === "Complaints") return responses.filter((item) => item.classification === "Complaints" || item.tags.includes("complaint")).length;
    if (queue === "Unsubscribes") return responses.filter((item) => item.classification === "Unsubscribes" || item.tags.includes("unsubscribe")).length;
    if (queue === "Testimonials") return responses.filter((item) => item.classification === "Testimonials" || item.tags.includes("testimonial")).length;
    if (queue === "Unmatched") return responses.filter((item) => !item.campaignId && !item.campaignName).length;
    return 0;
  };
  const filteredResponses = useMemo(() => {
    if (activeFilter === "All Synced") return responses;
    return responses.filter((item) => {
      if (activeFilter === "Needs Reply") return item.classification === "Needs Reply" || item.status === "needs_reply";
      if (activeFilter === "Hot Leads") return item.tags.includes("hot_lead") || (item.sentiment === "positive" && item.urgency !== "low");
      if (activeFilter === "Questions") return item.tags.includes("question");
      if (activeFilter === "Objections") return item.classification === "Objections" || item.tags.includes("objection");
      if (activeFilter === "Complaints") return item.classification === "Complaints" || item.tags.includes("complaint");
      if (activeFilter === "Unsubscribes") return item.classification === "Unsubscribes" || item.tags.includes("unsubscribe");
      if (activeFilter === "Testimonials") return item.classification === "Testimonials" || item.tags.includes("testimonial");
      if (activeFilter === "Unmatched") return !item.campaignId && !item.campaignName;
      return true;
    });
  }, [activeFilter, responses]);

  useEffect(() => {
    if (!filteredResponses.length) return;
    setSelectedId((prev) => (prev && filteredResponses.some((r) => r.id === prev) ? prev : filteredResponses[0].id));
  }, [activeFilter, filteredResponses]);

  const selectedResponse = useMemo(() => {
    if (!filteredResponses.length) return null;
    return filteredResponses.find((item) => item.id === selectedId) ?? filteredResponses[0];
  }, [filteredResponses, selectedId]);
  const actorName = appUser.displayName || appUser.clerkUserId || "console_operator";

  useEffect(() => {
    setNotesDraft(selectedResponse?.notes ?? "");
    setReplyDraft(selectedResponse?.suggestedReply ?? "");
  }, [selectedResponse]);

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <SectionHeader
        eyebrow="Signal monitor"
        title="Response Intelligence"
        description="Classify inbound replies against launch packets, triage urgency and sentiment, and keep suggested replies in draft-only mode for manual review. Nothing auto-sends."
      />
      <div className="flex flex-wrap gap-2">
        <StatusBadge tone="amber">Draft-only replies</StatusBadge>
        <StatusBadge tone="blue">Manual review</StatusBadge>
        <StatusBadge tone="gray">No auto-send</StatusBadge>
        <StatusBadge tone="gray">HelpDesk / manual source</StatusBadge>
      </div>
      <div className="flex flex-wrap gap-2">
        {responseQueues.map((queue, index) => (
          <button key={queue} onClick={() => setActiveFilter(queue)} type="button">
            <StatusBadge tone={queue === activeFilter ? "blue" : index === 0 ? "amber" : index === 1 ? "green" : "gray"}>
              {queue} {filterCount(queue)}
            </StatusBadge>
          </button>
        ))}
      </div>
      {feedback ? (
        <ControlPanel className={cn("p-3 text-sm", feedback.startsWith("Unable") ? "border-rose-500/30 bg-rose-500/10 text-rose-100" : "border-sky-500/30 bg-sky-500/10 text-sky-100")}>
          {feedback}
        </ControlPanel>
      ) : null}
      <section className="grid gap-4 lg:grid-cols-2 lg:items-start">
        <div className="min-w-0 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Response list</p>
          <div className="max-h-[min(70vh,36rem)] space-y-2 overflow-y-auto pr-1">
            {responseRecords === undefined ? (
              <ControlPanel className="p-4 text-sm text-slate-400">Loading response records.</ControlPanel>
            ) : !filteredResponses.length ? (
              <ControlPanel className="p-4 text-sm text-slate-400">No response records in this filter.</ControlPanel>
            ) : (
              filteredResponses.map((item) => {
                const packet = matchedLaunchPacketName(item, campaignNameById);
                const needsReply = item.classification === "Needs Reply" || item.status === "needs_reply";
                const hotLead = item.tags.includes("hot_lead") || (item.sentiment === "positive" && item.urgency !== "low");
                return (
                  <button
                    className={cn(
                      "focus-ring w-full rounded-xl border p-3 text-left transition",
                      selectedResponse?.id === item.id ? "border-sky-500/50 bg-sky-950/25" : "border-slate-800 bg-slate-950/50 hover:border-slate-700 hover:bg-slate-900/60",
                    )}
                    key={item.id}
                    onClick={() => setSelectedId(item.id)}
                    type="button"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-slate-100">{item.classification}</span>
                      <StatusBadge tone={item.urgency === "high" ? "red" : item.urgency === "medium" ? "amber" : "green"}>{item.urgency}</StatusBadge>
                      <span className="text-xs text-slate-500">{formatSentimentDisplay(item.sentiment)}</span>
                      {needsReply ? (
                        <StatusBadge tone="amber">Needs reply</StatusBadge>
                      ) : null}
                      {hotLead ? (
                        <StatusBadge tone="green">Hot lead</StatusBadge>
                      ) : null}
                    </div>
                    <p className="mt-1 truncate text-xs text-sky-200/90" title={packet}>
                      {packet}
                      {item.matchConfidence !== undefined ? ` · ${Math.round(item.matchConfidence * 100)}% match` : ""}
                    </p>
                    <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-400">{item.summary}</p>
                  </button>
                );
              })
            )}
          </div>
        </div>
        <div className="min-w-0 space-y-4">
          <QueueLane count={responses.length} subtitle="Queue counts for triage. Nothing sends from this screen." title="Signal snapshot" tone="blue">
            <SignalList
              items={[
                { label: "Needs reply", value: filterCount("Needs Reply"), tone: "amber" },
                { label: "Hot leads", value: filterCount("Hot Leads"), tone: "green" },
                { label: "Unmatched", value: filterCount("Unmatched"), tone: "gray" },
                { label: "Draft-only posture", value: responses.every((item) => item.noAutoSend) ? "On" : "Mixed", tone: "red" },
              ]}
            />
          </QueueLane>
          <ControlPanel className="p-4">
            {selectedResponse ? (
              <div className="space-y-5">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Summary</h3>
                  <p className="mt-2 text-sm font-semibold text-slate-100">{selectedResponse.title}</p>
                  <dl className="mt-3 grid gap-2 text-sm text-slate-300">
                    <div className="flex flex-wrap justify-between gap-2 rounded-lg border border-slate-800/80 bg-slate-950/50 px-3 py-2">
                      <dt className="text-slate-500">Classification</dt>
                      <dd className="text-slate-100">{selectedResponse.classification}</dd>
                    </div>
                    <div className="flex flex-wrap justify-between gap-2 rounded-lg border border-slate-800/80 bg-slate-950/50 px-3 py-2">
                      <dt className="text-slate-500">Urgency / sentiment</dt>
                      <dd className="text-slate-100">
                        {selectedResponse.urgency} / {formatSentimentDisplay(selectedResponse.sentiment)}
                      </dd>
                    </div>
                    <div className="flex flex-wrap justify-between gap-2 rounded-lg border border-slate-800/80 bg-slate-950/50 px-3 py-2">
                      <dt className="text-slate-500">Matched launch packet</dt>
                      <dd className="max-w-[16rem] text-right text-slate-100">{matchedLaunchPacketName(selectedResponse, campaignNameById)}</dd>
                    </div>
                    <div className="flex flex-wrap justify-between gap-2 rounded-lg border border-slate-800/80 bg-slate-950/50 px-3 py-2">
                      <dt className="text-slate-500">Recommended action</dt>
                      <dd className="text-right text-slate-100">{selectedResponse.recommendedAction}</dd>
                    </div>
                    <div className="flex flex-wrap justify-between gap-2 rounded-lg border border-slate-800/80 bg-slate-950/50 px-3 py-2">
                      <dt className="text-slate-500">Received</dt>
                      <dd className="text-slate-100">{formatTimestamp(selectedResponse.receivedAt)}</dd>
                    </div>
                    <div className="flex flex-wrap justify-between gap-2 rounded-lg border border-slate-800/80 bg-slate-950/50 px-3 py-2">
                      <dt className="text-slate-500">Source</dt>
                      <dd className="text-slate-100">{formatResponseSourceLabel(selectedResponse.source)}</dd>
                    </div>
                  </dl>
                </div>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Original message</h3>
                  <div className="mt-2 rounded-lg border border-slate-800 bg-slate-950/70 px-3 py-3 text-sm leading-relaxed text-slate-300">
                    <p className="whitespace-pre-wrap">{selectedResponse.originalMessage ?? "No original message captured."}</p>
                  </div>
                </div>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Suggested reply</h3>
                  <p className="mt-1 text-xs text-slate-500">Editable draft only — copy into your mail tool or CRM when ready. Nothing auto-sends from Outreach Console.</p>
                  <label className="mt-2 grid gap-2">
                    <textarea className={textareaStyles} onChange={(event) => setReplyDraft(event.target.value)} value={replyDraft} />
                  </label>
                </div>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Operator notes</h3>
                  <label className="mt-2 grid gap-2">
                    <textarea className={cn(textareaStyles, "min-h-[88px]")} onChange={(event) => setNotesDraft(event.target.value)} value={notesDraft} />
                  </label>
                </div>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Actions</h3>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <button
                      className={cn(actionButtonStyles, "border-slate-700 bg-slate-900 text-slate-100 hover:bg-slate-800")}
                      onClick={() => {
                        void updateSuggestedReply({ responseId: selectedResponse.id, suggestedReply: replyDraft, suggestedReplyStatus: "draft_only" })
                          .then(() => setFeedback("Response saved."))
                          .catch(() => setFeedback("Unable to save response. Check Convex connection."));
                      }}
                      type="button"
                    >
                      Save suggested reply
                    </button>
                    <button
                      className={cn(actionButtonStyles, "border-slate-700 bg-slate-900 text-slate-100 hover:bg-slate-800")}
                      onClick={() => {
                        void updateResponseNotes({ responseId: selectedResponse.id, notes: notesDraft })
                          .then(() => setFeedback("Response saved."))
                          .catch(() => setFeedback("Unable to save response. Check Convex connection."));
                      }}
                      type="button"
                    >
                      Save notes
                    </button>
                    <button
                      className={cn(actionButtonStyles, "border-slate-700 bg-slate-900 text-slate-100 hover:bg-slate-800")}
                      onClick={() => {
                        void markResponseNeedsReply({ responseId: selectedResponse.id })
                          .then(() => setFeedback("Response saved."))
                          .catch(() => setFeedback("Unable to save response. Check Convex connection."));
                      }}
                      type="button"
                    >
                      Mark needs reply
                    </button>
                    <button
                      className={cn(actionButtonStyles, "border-sky-500/60 bg-sky-500 text-slate-950 hover:bg-sky-400")}
                      onClick={() => {
                        void markResponseResolved({ responseId: selectedResponse.id, resolvedBy: actorName })
                          .then(() => setFeedback("Response saved."))
                          .catch(() => setFeedback("Unable to save response. Check Convex connection."));
                      }}
                      type="button"
                    >
                      Mark resolved
                    </button>
                  </div>
                </div>
                <p className="border-t border-slate-800 pt-3 text-xs text-slate-500">Suggested replies remain drafts only. No auto-send.</p>
              </div>
            ) : (
              <p className="text-sm text-slate-400">Select a response from the list.</p>
            )}
          </ControlPanel>
        </div>
      </section>
    </div>
  );
}

export function HeartbeatHistorySection() {
  const rows = useQuery(api.heartbeat.listHeartbeatChecks, { limit: 25 });

  const toneForHb = (s: string) => {
    if (s === "clear") return "green";
    if (s === "blocked") return "red";
    if (s === "at_risk") return "amber";
    if (s === "no_active_campaign") return "gray";
    return "blue";
  };

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <SectionHeader
        eyebrow="Campaign Heartbeat"
        title="Campaign Heartbeat Audit"
        description="Audit trail for deterministic Weekly Launch Packet readiness checks. Home remains the daily place to run Campaign Heartbeat; this page shows check history, rule posture, and future Hermes local runtime context."
      />
      <div className="grid gap-3 lg:grid-cols-2">
        <ControlPanel className="p-4">
          <p className="text-sm font-semibold text-slate-100">Current mode</p>
          <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-400">
            <li>
              <span className="font-medium text-slate-200">Mode:</span> In-app / human-triggered
            </li>
            <li>
              <span className="font-medium text-slate-200">External calls:</span> None
            </li>
            <li>
              <span className="font-medium text-slate-200">Task writes:</span> Today Tasks only
            </li>
            <li>
              <span className="font-medium text-slate-200">Auto-send / post:</span> Disabled
            </li>
          </ul>
        </ControlPanel>
        <ControlPanel className="p-4">
          <p className="text-sm font-semibold text-slate-100">What Heartbeat checks</p>
          <ul className="mt-3 list-inside list-disc space-y-1.5 text-sm leading-6 text-slate-400">
            <li>Source asset</li>
            <li>YouTube scheduled link</li>
            <li>Emailmarketing.com handoff</li>
            <li>Brandon / creative handoff</li>
            <li>Social rollout</li>
            <li>Review gates</li>
            <li>Launch readiness</li>
            <li>Performance follow-up (when applicable)</li>
          </ul>
        </ControlPanel>
        <ControlPanel className="p-4 lg:col-span-2">
          <p className="text-sm font-semibold text-slate-100">Future Hermes coordination</p>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Hermes by Nous can later coordinate approved heartbeat workflows from the office Mac mini once Operations has a configured runtime endpoint. Until then, checks are in-app and human-triggered — Hermes is not running checks in this build.
          </p>
        </ControlPanel>
      </div>
      <ControlPanel className="p-4">
        <p className="text-sm font-semibold text-slate-100">Recent checks</p>
        {rows === undefined ? (
          <p className="mt-3 text-sm text-slate-400">Loading…</p>
        ) : !rows.length ? (
          <p className="mt-3 text-sm text-slate-400">
            No heartbeat checks recorded yet. Run Campaign Heartbeat from Home to create the first check.
          </p>
        ) : (
          <ConsoleTable>
            <TableHead>
              <tr>
                <Th>Date</Th>
                <Th>Type</Th>
                <Th>Campaign</Th>
                <Th>Status</Th>
                <Th>Checkpoint</Th>
                <Th>Summary</Th>
                <Th>Tasks</Th>
              </tr>
            </TableHead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.checkId}>
                  <Td>{r.checkDate}</Td>
                  <Td className="text-xs text-slate-400">{r.checkType}</Td>
                  <Td>{r.campaignName}</Td>
                  <Td>
                    <StatusBadge tone={toneForHb(r.status)}>{r.status.replace(/_/g, " ")}</StatusBadge>
                  </Td>
                  <Td className="max-w-[11rem] whitespace-normal text-xs">{r.currentCheckpoint}</Td>
                  <Td className="max-w-[26rem] whitespace-normal text-sm text-slate-300">{r.summary}</Td>
                  <Td className="text-xs text-slate-400">
                    +{r.createdTaskIds.length} new · {r.updatedTaskIds.length} updated
                  </Td>
                </tr>
              ))}
            </tbody>
          </ConsoleTable>
        )}
      </ControlPanel>
      <div className="flex flex-wrap gap-2">
        <Link href="/dashboard">
          <Button variant="secondary">Home — run heartbeat</Button>
        </Link>
        <Link href="/intelligence/hub">
          <Button variant="ghost">Back to Intelligence</Button>
        </Link>
      </div>
    </div>
  );
}

export function IntelligenceRouteSection({ slug }: { slug?: string[] }) {
  if (slug?.[1] === "hub") return <IntelligenceHubSection />;
  if (slug?.[1] === "heartbeat") return <HeartbeatHistorySection />;
  if (slug?.[1] === "langgraph") return <LangGraphSection />;
  if (!slug?.[1] || slug?.[1] === "copy") {
    return (
      <Suspense fallback={<div className="rounded-xl border border-slate-800 bg-slate-950/60 p-6 text-sm text-slate-400">Loading Copy Intelligence…</div>}>
        <CopyIntelligenceSection />
      </Suspense>
    );
  }
  if (slug?.[1] === "trends") {
    return (
      <Suspense fallback={<div className="rounded-xl border border-slate-800 bg-slate-950/60 p-6 text-sm text-slate-400">Loading Trend Intelligence…</div>}>
        <TrendIntelligenceSection />
      </Suspense>
    );
  }
  if (slug?.[1] === "agent-runs") return <AgentRunsSection />;
  if (slug?.[1] === "responses") return <ResponsesSection />;
  if (slug?.[1] === "performance") {
    return (
      <Suspense fallback={<div className="rounded-xl border border-slate-800 bg-slate-950/60 p-6 text-sm text-slate-400">Loading Performance Intelligence…</div>}>
        <PerformanceIntelligenceSection />
      </Suspense>
    );
  }
  if (slug?.[1] === "platform-connector") {
    return (
      <Suspense
        fallback={<div className="rounded-xl border border-slate-800 bg-slate-950/60 p-6 text-sm text-slate-400">Loading Platform Connector Intelligence…</div>}
      >
        <PlatformConnectorIntelligenceSection />
      </Suspense>
    );
  }

  return <IntelligenceHubSection />;
}
