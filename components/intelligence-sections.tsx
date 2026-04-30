"use client";

import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import Link from "next/link";
import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { Bot, Braces, ChevronLeft, GitBranch, RotateCcw, Save, ShieldAlert, Sparkles } from "lucide-react";
import { defaultAgentConfigs, getDefaultAgentConfig, getDefaultAgentRuntimeState } from "@/lib/agent-config";
import { agentRunSteps, campaigns, learningInsights, performanceSnapshots, responses } from "@/lib/data/demo-data";
import type { AgentConfigRecord } from "@/lib/domain";
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
  if (["waiting_for_human", "human_pause", "needs_config", "pending"].includes(status)) return "amber";
  if (["failed", "blocked", "error"].includes(status)) return "red";
  if (["running"].includes(status)) return "blue";
  return "gray";
}

const responseQueues = ["Needs Reply", "Hot Leads", "Questions", "Objections", "Complaints", "Unsubscribes", "Testimonials", "Unmatched", "All Synced"];
const agentDetailTabs = ["overview", "prompt", "io", "rules", "routing", "runtime", "runs"] as const;
type AgentDetailTab = (typeof agentDetailTabs)[number];
const actionButtonStyles = "focus-ring inline-flex items-center justify-center gap-2 rounded-lg border px-3.5 py-2 text-sm font-semibold transition";
const inputStyles = "console-field-control focus-ring w-full rounded-lg border border-slate-700 bg-slate-950/80 px-3 py-2 text-slate-100 placeholder:text-slate-500";
const textareaStyles = `${inputStyles} min-h-[120px] resize-y`;

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

export function AgentRunsSection() {
  const runRows = agentRunSteps.map((step, index) => {
    const campaign = campaigns[index % campaigns.length];
    const isCompleted = step.status === "completed";
    return {
      id: step.id,
      runLabel: `run-${index + 1}`,
      campaignName: campaign?.name ?? "Campaign context",
      currentAgent: step.agentName,
      status: step.status,
      startedFinished: isCompleted ? "14:05 / 14:06" : "14:05 / --",
      blockers: step.status === "waiting_for_human" ? "Waiting for Bari approval" : "No critical blocker",
      outputSummary: step.summary,
      structuredOutputs: step.structuredOutputs,
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
    <div className="space-y-5">
      <SectionHeader
        eyebrow="OPERATIONAL LOG"
        title="Agent Runs"
        description="Inspect current and historical agent executions, pauses, blockers, and structured outputs."
      />
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <ControlPanel className="p-3"><p className="text-xs uppercase tracking-[0.16em] text-slate-400">Total runs</p><p className="mt-1 text-xl font-semibold text-slate-100">{summaryStats.total}</p></ControlPanel>
        <ControlPanel className="p-3"><p className="text-xs uppercase tracking-[0.16em] text-slate-400">Completed</p><p className="mt-1 text-xl font-semibold text-emerald-200">{summaryStats.completed}</p></ControlPanel>
        <ControlPanel className="p-3"><p className="text-xs uppercase tracking-[0.16em] text-slate-400">Waiting for human</p><p className="mt-1 text-xl font-semibold text-amber-200">{summaryStats.waitingForHuman}</p></ControlPanel>
        <ControlPanel className="p-3"><p className="text-xs uppercase tracking-[0.16em] text-slate-400">Errors / blockers</p><p className="mt-1 text-xl font-semibold text-rose-200">{summaryStats.errors}</p></ControlPanel>
        <ControlPanel className="p-3"><p className="text-xs uppercase tracking-[0.16em] text-slate-400">Running</p><p className="mt-1 text-xl font-semibold text-sky-200">{summaryStats.running}</p></ControlPanel>
      </section>
      <ConsoleTable>
        <TableHead>
          <tr>
            <Th>Run</Th>
            <Th>Campaign</Th>
            <Th>Current / last agent</Th>
            <Th>Status</Th>
            <Th>Started / finished</Th>
            <Th>Errors / blockers</Th>
            <Th>Output summary</Th>
            <Th>Open</Th>
          </tr>
        </TableHead>
        <tbody>
          {runRows.map((run) => (
            <tr className={selectedRun?.id === run.id ? "bg-slate-900/80" : ""} key={run.id} onClick={() => setSelectedRunId(run.id)}>
              <Td>{run.runLabel}</Td>
              <Td className="min-w-[14rem]">{run.campaignName}</Td>
              <Td>{run.currentAgent}</Td>
              <Td><StatusBadge tone={tone(run.status)}>{run.status.replace(/_/g, " ")}</StatusBadge></Td>
              <Td>{run.startedFinished}</Td>
              <Td>{run.blockers}</Td>
              <Td className="max-w-[22rem] text-slate-300">{run.outputSummary}</Td>
              <Td><button className="focus-ring rounded" onClick={() => setSelectedRunId(run.id)} type="button"><InlineAction>Details</InlineAction></button></Td>
            </tr>
          ))}
        </tbody>
      </ConsoleTable>
      <ControlPanel className="p-4">
        <div className="flex items-center gap-2">
          <Braces className="h-4 w-4 text-sky-300" />
          <p className="text-sm font-semibold text-slate-100">Selected run structured output</p>
        </div>
        {selectedRun ? (
          <pre className="mt-3 overflow-auto rounded-lg border border-slate-800 bg-slate-950/75 p-3 text-xs leading-6 text-slate-300">{JSON.stringify(selectedRun.structuredOutputs, null, 2)}</pre>
        ) : (
          <div className="mt-3 rounded-lg border border-slate-800 bg-slate-950/75 p-3 text-xs leading-6 text-slate-300">No run selected.</div>
        )}
      </ControlPanel>
    </div>
  );
}

export function LangGraphSection() {
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [activeDetailTab, setActiveDetailTab] = useState<AgentDetailTab>("overview");
  const [draftConfigMap, setDraftConfigMap] = useState<Record<string, AgentConfigRecord>>({});
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isWorking, setIsWorking] = useState(false);
  const timersRef = useRef<number[]>([]);
  const seedAttemptedRef = useRef(false);

  const agentConfigs = useQuery(api.agents.listAgentConfigs);
  const runtimeStates = useQuery(api.agents.listAgentRuntimeStates);
  const selectedRuns = useQuery(
    api.agents.listAgentRunsByAgentId,
    selectedAgentId ? { agentId: selectedAgentId } : "skip",
  );

  const seedDefaultAgentConfigsIfEmpty = useMutation(api.agents.seedDefaultAgentConfigsIfEmpty);
  const seedDefaultAgentRuntimeStatesIfEmpty = useMutation(api.agents.seedDefaultAgentRuntimeStatesIfEmpty);
  const seedDefaultAgentRunsIfEmpty = useMutation(api.agents.seedDefaultAgentRunsIfEmpty);
  const upsertAgentConfig = useMutation(api.agents.upsertAgentConfig);
  const upsertAgentRuntimeState = useMutation(api.agents.upsertAgentRuntimeState);
  const createAgentRun = useMutation(api.agents.createAgentRun);
  const upsertAgentRun = useMutation(api.agents.upsertAgentRun);
  const resetDemoAgentRuntimeState = useMutation(api.agents.resetDemoAgentRuntimeState);

  useEffect(() => {
    return () => {
      for (const timer of timersRef.current) {
        window.clearTimeout(timer);
      }
    };
  }, []);

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

  const persistedConfigMap = useMemo(
    () => buildRecordMap(agentConfigs ?? defaultAgentConfigs),
    [agentConfigs],
  );
  const runtimeMap = useMemo(
    () => buildRecordMap(runtimeStates ?? []),
    [runtimeStates],
  );
  const effectiveConfigMap = useMemo(
    () => ({
      ...persistedConfigMap,
      ...draftConfigMap,
    }),
    [draftConfigMap, persistedConfigMap],
  );
  const orderedConfigs = useMemo(
    () => [...Object.values(effectiveConfigMap)].sort((left, right) => left.workflowOrder - right.workflowOrder),
    [effectiveConfigMap],
  );

  const selectedConfig = selectedAgentId ? effectiveConfigMap[selectedAgentId] ?? null : null;
  const selectedRuntime = selectedAgentId ? runtimeMap[selectedAgentId] ?? null : null;
  const selectedRunsList = selectedRuns ?? [];

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
          ...selectedConfig,
          configVersion: (persistedConfigMap[selectedAgentId]?.configVersion ?? selectedConfig.configVersion) + 1,
          lastEditedAt: savedAt,
          lastEditedBy: "demo_operator",
          updatedAt: savedAt,
          updatedBy: "demo_operator",
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
          ...fallbackConfig,
          configVersion: (persistedConfigMap[selectedAgentId]?.configVersion ?? fallbackConfig.configVersion) + 1,
          lastEditedAt: savedAt,
          lastEditedBy: "demo_operator",
          updatedAt: savedAt,
          updatedBy: "demo_operator",
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

    const startedAt = Date.now();
    const runId = `demo-${selectedAgentId}-${startedAt}`;
    const taskSequence = [
      { label: "Reading config context", detail: "Loading prompt scaffolding, rules, and required context sources." },
      { label: "Executing agent logic", detail: `Running ${selectedConfig.displayName} with ${selectedConfig.preferredProvider} / ${selectedConfig.preferredModel}.` },
      { label: "Preparing handoff output", detail: "Validating output contract and runtime summary for the next workflow node." },
    ];

    for (const timer of timersRef.current) {
      window.clearTimeout(timer);
    }
    timersRef.current = [];

    setIsWorking(true);
    try {
      await upsertAgentRuntimeState({
        agentId: selectedAgentId,
        patch: {
          ...(selectedRuntime ?? getDefaultAgentRuntimeState(selectedAgentId)),
          status: "running",
          isRunning: true,
          currentTaskLabel: taskSequence[0].label,
          currentTaskDetail: taskSequence[0].detail,
          lastStartedAt: startedAt,
          lastRunId: runId,
          lastError: undefined,
          updatedAt: startedAt,
        },
      });

      await createAgentRun({
        runId,
        campaignId: "camp_reactivation_may",
        agentId: selectedAgentId,
        status: "running",
        inputSnapshot: `${selectedConfig.displayName} demo test harness`,
        outputSummary: "Running seeded demo test.",
        outputJson: JSON.stringify({ provider: selectedConfig.preferredProvider, model: selectedConfig.preferredModel }, null, 2),
        startedAt,
      });
    } catch {
      setFeedback("Unable to run test agent. Check Convex connection.");
      setIsWorking(false);
      return;
    }

    taskSequence.slice(1).forEach((task, index) => {
      const timer = window.setTimeout(() => {
        void upsertAgentRuntimeState({
          agentId: selectedAgentId,
          patch: {
            currentTaskLabel: task.label,
            currentTaskDetail: task.detail,
            updatedAt: Date.now(),
          },
        }).catch(() => {
          setFeedback("Unable to update runtime state. Check Convex connection.");
        });
      }, (index + 1) * 900);
      timersRef.current.push(timer);
    });

    const completeTimer = window.setTimeout(() => {
      const finishedAt = Date.now();
      const outputSummary = `${selectedConfig.displayName} demo test completed with structured output scaffolding intact.`;

      void Promise.all([
        upsertAgentRuntimeState({
          agentId: selectedAgentId,
          patch: {
            ...(selectedRuntime ?? getDefaultAgentRuntimeState(selectedAgentId)),
            status: "complete",
            isRunning: false,
            currentTaskLabel: "Demo test complete",
            currentTaskDetail: "Runtime fields updated successfully for future live LangGraph execution.",
            lastFinishedAt: finishedAt,
            lastOutputSummary: outputSummary,
            lastRunId: runId,
            updatedAt: finishedAt,
          },
        }),
        upsertAgentRun({
          runId,
          patch: {
            campaignId: "camp_reactivation_may",
            agentId: selectedAgentId,
            status: "complete",
            finishedAt,
            outputSummary,
            outputJson: JSON.stringify(
              {
                currentTaskLabel: "Demo test complete",
                nextAgentIds: selectedConfig.nextAgentIds,
                handoffConditions: selectedConfig.handoffConditions,
              },
              null,
              2,
            ),
          },
        }),
      ])
        .then(() => {
          setFeedback(`${selectedConfig.displayName} test run completed.`);
        })
        .catch(() => {
          setFeedback("Unable to update test run results. Check Convex connection.");
        })
        .finally(() => {
          setIsWorking(false);
        });
    }, 3200);
    timersRef.current.push(completeTimer);
  };

  if (agentConfigs === undefined || runtimeStates === undefined || (selectedAgentId && selectedRuns === undefined)) {
    return (
      <div className="space-y-5">
        <SectionHeader eyebrow="Active Agents" title="Active Agents" />
        <ControlPanel className="p-4">
          <p className="text-sm text-slate-300">Loading agent configs from Convex.</p>
        </ControlPanel>
      </div>
    );
  }

  if (!orderedConfigs.length) {
    return (
      <div className="space-y-5">
        <SectionHeader eyebrow="Active Agents" title="Active Agents" />
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
      <div className="space-y-5">
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
              Back to LangGraph map
            </button>
            <div>
              <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-slate-400">{selectedConfig.category}</p>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <h2 className="text-2xl font-semibold tracking-tight text-slate-50 md:text-3xl">{selectedConfig.displayName}</h2>
                <StatusBadge tone={tone(selectedRuntime.status)}>{statusLabel(selectedRuntime.status)}</StatusBadge>
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
                      <p className="mt-1 text-xs text-slate-400">Reactive runtime shape for future live LangGraph execution.</p>
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
    <div className="space-y-5">
      <SectionHeader eyebrow="Active Agents" title="Active Agents" />
      <ControlPanel className="p-4">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {orderedConfigs.map((config, index) => {
            const runtime = runtimeMap[config.agentId];
            const nextLabel = config.nextAgentIds.length
              ? config.nextAgentIds
                  .map((nextId) => effectiveConfigMap[nextId]?.displayName ?? nextId)
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
                  actionLabel="Configure"
                  clickable
                  currentTaskLabel={runtime?.currentTaskLabel}
                  isRunning={runtime?.isRunning}
                  label={config.displayName}
                  meta={index < orderedConfigs.length - 1 ? `Next: ${nextLabel}` : nextLabel}
                  state={statusLabel(runtime?.status ?? "pending")}
                  tone={tone(runtime?.status ?? "pending")}
                />
              </button>
            );
          })}
        </div>
      </ControlPanel>
      <ControlPanel className="p-4">
        <div className="flex items-start gap-3">
          <ShieldAlert className="mt-0.5 h-4 w-4 text-amber-300" />
          <p className="text-sm leading-6 text-slate-300">Human approval remains authoritative between Approval Router and Keap/Zapier Prep. Any high-risk claims, founder voice work, or blocked rules pause the flow here.</p>
        </div>
      </ControlPanel>
    </div>
  );
}

export function ResponsesSection() {
  return (
    <div className="space-y-5">
      <SectionHeader
        eyebrow="Signal monitor"
        title="Response Intelligence"
        description="Monitor inbound replies, urgency, sentiment, match confidence, and manual reply posture. No auto-send in MVP."
      />
      <div className="flex flex-wrap gap-2">
        {responseQueues.map((queue, index) => <StatusBadge key={queue} tone={index === 0 ? "amber" : index === 1 ? "green" : "gray"}>{queue}</StatusBadge>)}
      </div>
      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <ConsoleTable>
          <TableHead>
            <tr>
              <Th>Classification</Th>
              <Th>Urgency</Th>
              <Th>Sentiment</Th>
              <Th>Matched campaign</Th>
              <Th>Summary</Th>
              <Th>Recommended action</Th>
              <Th>Suggested reply</Th>
            </tr>
          </TableHead>
          <tbody>
            {responses.map((item) => (
              <tr key={item.id}>
                <Td>{item.classification.replace(/_/g, " ")}</Td>
                <Td><StatusBadge tone={item.urgency === "high" ? "red" : item.urgency === "medium" ? "amber" : "green"}>{item.urgency}</StatusBadge></Td>
                <Td>{item.sentiment}</Td>
                <Td className="min-w-[15rem]">{campaigns.find((campaign) => campaign.id === item.campaignId)?.name ?? "Unmatched"} · {Math.round(item.matchConfidence * 100)}%</Td>
                <Td className="min-w-[18rem] max-w-[30rem] whitespace-normal text-slate-300">{item.summary}</Td>
                <Td>Manual reply review</Td>
                <Td>Draft only</Td>
              </tr>
            ))}
          </tbody>
        </ConsoleTable>
        <QueueLane title="Signal Snapshot" count={responses.length} tone="blue" subtitle="Manual response handling only.">
          <SignalList
            items={[
              { label: "Needs reply", value: 1, tone: "amber" },
              { label: "Hot leads", value: 1, tone: "green" },
              { label: "Unmatched", value: 0, tone: "gray" },
              { label: "No auto-send", value: "active", tone: "red" },
            ]}
          />
        </QueueLane>
      </section>
    </div>
  );
}

export function PerformanceSection() {
  const telemetry = performanceSnapshots.reduce(
    (accumulator, snapshot) => ({
      sent: accumulator.sent + snapshot.sent,
      delivered: accumulator.delivered + snapshot.delivered,
      replies: accumulator.replies + snapshot.replies,
      conversions: accumulator.conversions + snapshot.conversions,
      openRateWeightedSum: accumulator.openRateWeightedSum + snapshot.openRate * snapshot.sent,
      clickRateWeightedSum: accumulator.clickRateWeightedSum + snapshot.clickRate * snapshot.sent,
    }),
    { sent: 0, delivered: 0, replies: 0, conversions: 0, openRateWeightedSum: 0, clickRateWeightedSum: 0 },
  );
  const openRate = telemetry.sent ? Math.round((telemetry.openRateWeightedSum / telemetry.sent) * 100) : 0;
  const clickRate = telemetry.sent ? Math.round((telemetry.clickRateWeightedSum / telemetry.sent) * 100) : 0;

  return (
    <div className="space-y-5">
      <SectionHeader
        eyebrow="Telemetry"
        title="Performance"
        description="Campaign outcomes, offer performance, response signals, and learning candidates in one telemetry view."
      />
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
        <ControlPanel className="p-3"><p className="text-xs uppercase tracking-[0.16em] text-slate-400">Sent</p><p className="mt-1 text-xl font-semibold text-slate-100">{telemetry.sent}</p></ControlPanel>
        <ControlPanel className="p-3"><p className="text-xs uppercase tracking-[0.16em] text-slate-400">Delivered</p><p className="mt-1 text-xl font-semibold text-slate-100">{telemetry.delivered}</p></ControlPanel>
        <ControlPanel className="p-3"><p className="text-xs uppercase tracking-[0.16em] text-slate-400">Open rate</p><p className="mt-1 text-xl font-semibold text-sky-200">{openRate}%</p></ControlPanel>
        <ControlPanel className="p-3"><p className="text-xs uppercase tracking-[0.16em] text-slate-400">Click rate</p><p className="mt-1 text-xl font-semibold text-sky-200">{clickRate}%</p></ControlPanel>
        <ControlPanel className="p-3"><p className="text-xs uppercase tracking-[0.16em] text-slate-400">Replies</p><p className="mt-1 text-xl font-semibold text-amber-200">{telemetry.replies}</p></ControlPanel>
        <ControlPanel className="p-3"><p className="text-xs uppercase tracking-[0.16em] text-slate-400">Conversions</p><p className="mt-1 text-xl font-semibold text-emerald-200">{telemetry.conversions}</p></ControlPanel>
        <ControlPanel className="p-3"><p className="text-xs uppercase tracking-[0.16em] text-slate-400">Learning candidates</p><p className="mt-1 text-xl font-semibold text-violet-200">{learningInsights.length}</p></ControlPanel>
      </section>
      <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <ConsoleTable>
          <TableHead>
            <tr>
              <Th>Campaign</Th>
              <Th>Sent</Th>
              <Th>Delivered</Th>
              <Th>Open rate</Th>
              <Th>Click rate</Th>
              <Th>Replies</Th>
              <Th>Conversions</Th>
              <Th>Signal</Th>
            </tr>
          </TableHead>
          <tbody>
            {performanceSnapshots.map((snapshot) => {
              const campaign = campaigns.find((item) => item.id === snapshot.campaignId);
              return (
                <tr key={snapshot.id}>
                  <Td>{campaign?.name}</Td>
                  <Td>{snapshot.sent}</Td>
                  <Td>{snapshot.delivered}</Td>
                  <Td>{Math.round(snapshot.openRate * 100)}%</Td>
                  <Td>{Math.round(snapshot.clickRate * 100)}%</Td>
                  <Td>{snapshot.replies}</Td>
                  <Td>{snapshot.conversions}</Td>
                  <Td className="min-w-[16rem] max-w-[22rem] whitespace-normal text-slate-300">{snapshot.summary}</Td>
                </tr>
              );
            })}
          </tbody>
        </ConsoleTable>
        <QueueLane title="Learning Candidates" count={learningInsights.length} tone="purple" subtitle="Review before making guidance authoritative.">
          <SignalList items={learningInsights.map((item) => ({ label: item.title, value: `${Math.round(item.confidence * 100)}%`, tone: item.status === "candidate" ? "amber" : "green", detail: item.summary }))} />
        </QueueLane>
      </section>
    </div>
  );
}

export function IntelligenceRouteSection({ slug }: { slug?: string[] }) {
  if (slug?.[1] === "langgraph") return <LangGraphSection />;
  if (slug?.[1] === "agent-runs") return <AgentRunsSection />;
  if (slug?.[1] === "responses") return <ResponsesSection />;
  if (slug?.[1] === "performance") return <PerformanceSection />;

  return (
    <div className="space-y-5">
      <SectionHeader eyebrow="Intelligence" title="Intelligence Hub" description="Open the signal monitor, telemetry, agent runs, or LangGraph map." />
      <section className="grid gap-4 md:grid-cols-2">
        <ControlPanel className="p-4">
          <GitBranch className="h-5 w-5 text-sky-300" />
          <h3 className="mt-3 text-lg font-semibold text-slate-100">LangGraph Map</h3>
          <p className="mt-2 text-sm text-slate-300">Visual workflow lanes and human approval pauses.</p>
          <div className="mt-4"><Link href="/intelligence/langgraph"><Button variant="secondary">Open workflow</Button></Link></div>
        </ControlPanel>
        <ControlPanel className="p-4">
          <Bot className="h-5 w-5 text-violet-300" />
          <h3 className="mt-3 text-lg font-semibold text-slate-100">Agent Runs</h3>
          <p className="mt-2 text-sm text-slate-300">Roster, structured output snapshots, and blockers.</p>
          <div className="mt-4"><Link href="/intelligence/agent-runs"><Button variant="secondary">Open runs</Button></Link></div>
        </ControlPanel>
      </section>
    </div>
  );
}
