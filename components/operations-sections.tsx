"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useAction, useMutation, useQuery } from "convex/react";
import { ArrowLeft, Download, KeyRound, Send, Settings2 } from "lucide-react";
import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";
import { useAppUser } from "@/components/auth/app-user-context";
import { ProductionBridgeSection } from "@/components/production-bridge-section";
import { Button, ConsoleTable, ControlPanel, QueueLane, SectionHeader, SignalList, StatusBadge, StatusDot, Td, Th, TableHead } from "@/components/ui";
import { OPERATIONS_CATEGORY_SECTIONS, operationsCategoryForIntegrationId } from "@/lib/operations-integration-ui";

type IntegrationRecord = Doc<"integrationConnections">;
type CampaignRecord = Doc<"campaigns">;
type KeapSyncJobRecord = Doc<"keapSyncJobs">;

const META_INTEGRATION_IDS = new Set(["meta_platform", "meta_ads", "instagram", "facebook", "meta_connector_mcp"]);

const INTEGRATIONS_WITH_CONNECTOR_POSTURE = new Set<string>([...META_INTEGRATION_IDS, "hermes_runtime"]);

function tone(status: string) {
  if (status === "connected") return "green";
  if (status === "manual_mode" || status === "demo_fallback") return "blue";
  if (status === "missing_credentials") return "amber";
  if (status === "error") return "red";
  if (status === "not_configured") return "gray";
  return "gray";
}

function titleCaseSnake(s: string): string {
  if (!s) return "";
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatStatus(status: string) {
  const k = status.toLowerCase();
  const map: Record<string, string> = {
    connected: "Connected",
    manual_mode: "Manual mode",
    demo_fallback: "Demo fallback",
    missing_credentials: "Missing credentials",
    not_configured: "Not configured",
    error: "Error",
    manual_fallback: "Manual fallback",
    planned: "Planned",
    read_only_future: "Read-only future",
    read_only: "Read-only",
  };
  return map[k] ?? titleCaseSnake(status);
}

function humanizeConnectorModeDisplay(mode?: string | null): string {
  if (!mode) return "—";
  const k = mode.toLowerCase();
  const map: Record<string, string> = {
    read_only_default: "Read-only default",
    read_only_future: "Read-only future",
    read_only_sync: "Read-only sync",
  };
  return map[k] ?? titleCaseSnake(mode);
}

function humanizeSafetyLevelDisplay(level?: string | null): string {
  if (!level) return "—";
  const k = level.toLowerCase();
  const map: Record<string, string> = {
    approval_required: "Approval required",
    read_only_default: "Read-only default",
    no_write_actions: "No write actions",
  };
  return map[k] ?? titleCaseSnake(level);
}

function formatTimestamp(value?: number) {
  if (!value) return "Not checked";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(value);
}

function useSeedIntegrations(records: IntegrationRecord[] | undefined) {
  const seedDefaults = useMutation(api.integrations.seedDefaultIntegrationRecordsIfEmpty);
  const seedMeta = useMutation(api.integrations.seedMetaIntegrationRecordsIfMissing);
  const seedHermes = useMutation(api.integrations.seedHermesRuntimeIntegrationIfMissing);
  const [seedAttempted, setSeedAttempted] = useState(false);
  const metaSeededRef = useRef(false);
  const [seedError, setSeedError] = useState<string | null>(null);

  useEffect(() => {
    if (records === undefined || seedAttempted) return;
    if (records.length > 0) {
      setSeedAttempted(true);
      return;
    }
    setSeedAttempted(true);
    void seedDefaults()
      .then(() => setSeedError(null))
      .catch(() => setSeedError("Unable to load integration records."));
  }, [records, seedAttempted, seedDefaults]);

  useEffect(() => {
    if (records === undefined || metaSeededRef.current) return;
    metaSeededRef.current = true;
    void seedMeta({}).catch(() => {});
    void seedHermes({}).catch(() => {});
  }, [records, seedMeta, seedHermes]);

  return seedError;
}

function PlannedIntegrationCard({ name, purpose, relatedWorkflows }: { name: string; purpose: string; relatedWorkflows: string }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-600/50 bg-slate-950/30 px-3 py-2.5 opacity-95">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="text-sm font-semibold text-slate-200">{name}</p>
        <StatusBadge tone="gray">Planned</StatusBadge>
      </div>
      <p className="mt-1 text-xs leading-snug text-slate-500">{purpose}</p>
      <div className="mt-2 space-y-1 border-t border-slate-800/60 pt-2 text-[0.65rem] leading-snug text-slate-500">
        <p>
          <span className="text-slate-600">Mode</span> · Manual · <span className="text-slate-600">Safety</span> · Read-only
        </p>
        <p>
          <span className="text-slate-600">Setup</span> · Future integration · <span className="text-slate-600">Sync</span> · Not connected
        </p>
        <p className="text-slate-600">
          Workflows: <span className="text-slate-500">{relatedWorkflows}</span>
        </p>
      </div>
    </div>
  );
}

function IntegrationRecordButton({
  integration,
  onSelect,
}: {
  integration: IntegrationRecord;
  onSelect: (integrationId: string) => void;
}) {
  const modeLabel = integration.connectorMode
    ? humanizeConnectorModeDisplay(integration.connectorMode)
    : integration.status === "connected"
      ? "Live check"
      : "Manual / dry-run";
  const safetyLabel = integration.safetyLevel
    ? humanizeSafetyLevelDisplay(integration.safetyLevel)
    : integration.status === "connected"
      ? "Approval required for writes"
      : "Read-only / draft";

  return (
    <button
      type="button"
      onClick={() => onSelect(integration.integrationId)}
      className="focus-ring block w-full rounded-xl border border-slate-800 bg-slate-950/75 px-3 py-2.5 text-left transition hover:border-slate-700 hover:bg-slate-900/90"
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <StatusDot tone={tone(integration.status)} />
            <p className="text-sm font-semibold text-slate-100">{integration.name}</p>
            <StatusBadge tone={tone(integration.status)}>{integration.statusLabel || formatStatus(integration.status)}</StatusBadge>
          </div>
          <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-400">{integration.purpose}</p>
          <div className="mt-2 space-y-1 text-[0.65rem] leading-snug text-slate-500">
            <p>
              <span className="text-slate-600">Mode</span> · {modeLabel} · <span className="text-slate-600">Safety</span> · {safetyLabel}
            </p>
            <p>
              <span className="text-slate-600">Last check</span> · {formatTimestamp(integration.lastCheckAt)} · <span className="text-slate-600">Last sync</span> ·{" "}
              {integration.lastSync ? formatTimestamp(integration.lastSync) : "Not synced"}
            </p>
            <p className="line-clamp-2 text-slate-600">
              Setup:{" "}
              <span className="text-slate-500">
                {integration.missingEnvVars?.length
                  ? "Missing credentials — open detail for required keys"
                  : integration.setupNotes || "See detail for environment variables and checks"}
              </span>
            </p>
            <p className="text-slate-600">
              Workflows: <span className="text-slate-500">{integration.relatedWorkflows ?? "Launch coordination, Intelligence, Reviews"}</span>
            </p>
          </div>
        </div>
        <span className="shrink-0 pt-0.5 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-slate-500">Details</span>
      </div>
    </button>
  );
}

function IntegrationDetail({
  integration,
  onBack,
  canManage,
}: {
  integration: IntegrationRecord;
  onBack: () => void;
  canManage: boolean;
}) {
  const checkConnection = useAction(api.runtimePrep.checkIntegrationConnection);
  const runMetaReadiness = useMutation(api.integrations.runMetaConnectorReadinessCheck);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [metaReadinessText, setMetaReadinessText] = useState<string | null>(null);
  const [metaReadinessBusy, setMetaReadinessBusy] = useState(false);
  const isMetaIntegration = META_INTEGRATION_IDS.has(integration.integrationId);
  const showConnectorPosture = INTEGRATIONS_WITH_CONNECTOR_POSTURE.has(integration.integrationId);

  async function handleCheckConnection() {
    setIsChecking(true);
    setError(null);
    try {
      const result = await checkConnection({ integrationId: integration.integrationId });
      setMessage(result.result ?? "Connection check recorded.");
    } catch {
      setError("Unable to update integration. Check Convex connection.");
    } finally {
      setIsChecking(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <button type="button" onClick={onBack} className="focus-ring inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-950/80 px-3 py-2 text-sm font-semibold text-slate-200">
          <ArrowLeft className="h-4 w-4" /> Back to integrations
        </button>
        <div className="flex gap-2">
          {isMetaIntegration ? (
            <button
              type="button"
              className="rounded-lg disabled:cursor-not-allowed disabled:opacity-60"
              disabled={metaReadinessBusy || !canManage}
              onClick={() => {
                setMetaReadinessBusy(true);
                setMetaReadinessText(null);
                void runMetaReadiness({ integrationId: integration.integrationId })
                  .then((r) => {
                    const lines = [
                      r.summary,
                      r.noExternalCallNotice,
                      r.missingSetupItems.length ? `Missing / unchecked: ${r.missingSetupItems.slice(0, 12).join("; ")}` : "",
                    ].filter(Boolean);
                    setMetaReadinessText(lines.join("\n\n"));
                  })
                  .catch(() => {
                    setMetaReadinessText("Meta readiness check could not complete. No external Meta API calls were made.");
                  })
                  .finally(() => setMetaReadinessBusy(false));
              }}
            >
              <Button variant="secondary">{metaReadinessBusy ? "Running…" : "Run Meta connector readiness check"}</Button>
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => void handleCheckConnection()}
            className="rounded-lg disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isChecking || !canManage}
          >
            <Button variant="secondary">{isChecking ? "Checking..." : "Check connection"}</Button>
          </button>
          <button
            type="button"
            onClick={() => setMessage(integration.setupInstructions || `Review required env vars and fallback notes for ${integration.name}.`)}
            className="rounded-lg"
            disabled={!canManage}
          >
            <Button><Settings2 className="mr-2 h-4 w-4" /> Setup</Button>
          </button>
        </div>
      </div>

      <SectionHeader
        eyebrow="Operations"
        title={integration.name}
        description={integration.description || integration.purpose}
        actions={<StatusBadge tone={tone(integration.status)}>{integration.statusLabel || formatStatus(integration.status)}</StatusBadge>}
      />

      {message ? (
        <ControlPanel className="p-4">
          <p className="text-sm text-slate-200">{message}</p>
        </ControlPanel>
      ) : null}

      {error ? (
        <ControlPanel className="border-rose-500/40 p-4">
          <p className="text-sm text-rose-200">{error}</p>
        </ControlPanel>
      ) : null}

      {metaReadinessText ? (
        <ControlPanel className="p-4">
          <p className="text-sm font-semibold text-slate-100">Meta connector readiness dry-run</p>
          <p className="mt-2 text-sm leading-relaxed text-slate-300">
            Checks local configuration and Convex integration records only. It does not call Meta APIs, print secret values, or enable posting, ad edits, budget changes, or audience mutations.
          </p>
          <pre className="mt-2 whitespace-pre-wrap text-sm text-slate-300">{metaReadinessText}</pre>
        </ControlPanel>
      ) : null}

      {showConnectorPosture && (integration.plannedCapabilities?.length || integration.disabledCapabilities?.length) ? (
        <ControlPanel className="p-4">
          <p className="text-sm font-semibold text-slate-100">Connector posture</p>
          <div className="mt-3 grid gap-3 md:grid-cols-2 text-sm">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Planned capabilities</p>
              <ul className="mt-1 list-inside list-disc text-slate-400">
                {(integration.plannedCapabilities ?? []).map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Disabled in this phase</p>
              <ul className="mt-1 list-inside list-disc text-slate-400">
                {(integration.disabledCapabilities ?? []).map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            </div>
          </div>
          {integration.requiredScopes ? (
            <p className="mt-3 text-xs text-slate-500">
              <span className="font-semibold text-slate-400">Future scopes (placeholder):</span> {integration.requiredScopes}
            </p>
          ) : null}
        </ControlPanel>
      ) : null}

      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <ControlPanel className="p-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3 text-slate-100">
            <KeyRound className="h-4 w-4 text-sky-300" />
            <p className="text-sm font-semibold">Required environment variables</p>
          </div>
          <div className="mt-4 grid gap-2">
            {integration.envKeys.map((envKey) => {
              const configured = integration.configuredEnvVars?.includes(envKey);
              const missing = integration.missingEnvVars?.includes(envKey);
              return (
                <div key={envKey} className="rounded-lg border border-slate-800 bg-slate-950/70 px-3 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-mono text-slate-100">{envKey}</p>
                    <StatusBadge tone={configured ? "green" : missing ? "amber" : "gray"}>
                      {configured ? "Detected" : missing ? "Missing" : "Unchecked"}
                    </StatusBadge>
                  </div>
                </div>
              );
            })}
          </div>
        </ControlPanel>

        <div className="grid gap-4">
          <QueueLane title="Connection status" count={integration.statusLabel || formatStatus(integration.status)} tone={tone(integration.status)} subtitle={integration.healthSummary || integration.setupNotes || integration.notes || integration.purpose}>
            <SignalList
              items={[
                { label: "Last check", value: formatTimestamp(integration.lastCheckAt), tone: "blue", detail: integration.lastCheckResult || "No connection check recorded yet." },
                { label: "Last synced", value: formatTimestamp(integration.lastSync), tone: integration.lastSync ? "green" : "amber", detail: "Convex timestamp only — not an external sync claim." },
                { label: "Fallback behavior", value: integration.fallback, tone: "amber", detail: "Used when live credentials are unavailable." },
                { label: "Setup mode", value: integration.setupNotes || integration.statusLabel || formatStatus(integration.status), tone: tone(integration.status), detail: integration.notes || "Current setup state for this integration." },
              ]}
            />
          </QueueLane>

          <ControlPanel className="p-4">
            <p className="text-sm font-semibold text-slate-100">Setup instructions</p>
            <div className="mt-4 space-y-3 text-sm text-slate-300">
              <div className="rounded-lg border border-slate-800 bg-slate-950/70 px-3 py-3">
                {integration.setupInstructions || `Add the required env vars for ${integration.name}, then run a connection check from this detail view.`}
              </div>
              <div className="rounded-lg border border-slate-800 bg-slate-950/70 px-3 py-3">
                Connection notes: {integration.notes || integration.setupNotes || "No additional setup notes recorded."}
              </div>
            </div>
          </ControlPanel>
        </div>
      </section>
    </div>
  );
}

export function IntegrationsSection() {
  const appUser = useAppUser();
  const integrations = useQuery(api.integrations.listIntegrationRecords);
  const overallHealth = useQuery(api.integrations.getOverallSystemHealth);
  const seedError = useSeedIntegrations(integrations);
  const runMetaReadiness = useMutation(api.integrations.runMetaConnectorReadinessCheck);
  const [selectedIntegrationId, setSelectedIntegrationId] = useState<string | null>(null);
  const [metaReadinessText, setMetaReadinessText] = useState<string | null>(null);
  const [metaReadinessBusy, setMetaReadinessBusy] = useState(false);
  const canManageIntegrations = appUser.role === "admin" || appUser.role === "operator";

  const selectedIntegration = useMemo(
    () => (integrations as IntegrationRecord[] | undefined)?.find((integration: IntegrationRecord) => integration.integrationId === selectedIntegrationId) ?? null,
    [integrations, selectedIntegrationId],
  );

  useEffect(() => {
    if (selectedIntegrationId && integrations && !(integrations as IntegrationRecord[]).some((integration: IntegrationRecord) => integration.integrationId === selectedIntegrationId)) {
      setSelectedIntegrationId(null);
    }
  }, [integrations, selectedIntegrationId]);

  const integrationsByCategory = useMemo(() => {
    const list = (integrations ?? []) as IntegrationRecord[];
    const map: Partial<Record<string, IntegrationRecord[]>> = {};
    for (const section of OPERATIONS_CATEGORY_SECTIONS) {
      map[section.id] = [];
    }
    for (const integration of list) {
      const bucket = operationsCategoryForIntegrationId(integration.integrationId);
      if (!map[bucket]) map[bucket] = [];
      map[bucket]!.push(integration);
    }
    for (const key of Object.keys(map)) {
      const arr = map[key];
      if (arr) arr.sort((a, b) => a.sortOrder - b.sortOrder);
    }
    return map as Record<string, IntegrationRecord[]>;
  }, [integrations]);

  if (integrations === undefined) {
    return (
      <div className="mx-auto max-w-7xl space-y-5">
        <SectionHeader
          eyebrow="Operations"
          title="Integrations"
          description="Grouped connection readiness for production assets, knowledge sync, social platforms, email/CRM, and AI/runtime. Most cards are planned, manual, or read-only until credentials and approval policies are intentionally enabled."
        />
        <ControlPanel className="p-4">
          <p className="text-sm text-slate-300">Loading integration records...</p>
        </ControlPanel>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      {!selectedIntegration ? (
        <>
          <SectionHeader
            eyebrow="Operations"
            title="Integrations"
            description="Grouped connection readiness for production assets, knowledge sync, social platforms, email/CRM, and AI/runtime. Most cards are planned, manual, or read-only until credentials and approval policies are intentionally enabled."
            actions={overallHealth ? <StatusBadge tone={overallHealth.status === "healthy" ? "green" : overallHealth.status === "warning" ? "amber" : "red"}>{`System ${overallHealth.status}`}</StatusBadge> : undefined}
          />
          {overallHealth?.status === "warning" ? (
            <ControlPanel className="border-amber-500/30 bg-amber-950/20 p-3">
              <p className="text-sm text-amber-100">
                <span className="font-semibold">System warning:</span> Missing credentials or planned/manual integrations require setup before live checks. Open
                each integration card for required keys — no external calls run from this list.
              </p>
            </ControlPanel>
          ) : null}
          {seedError ? (
            <ControlPanel className="border-rose-500/40 p-4">
              <p className="text-sm text-rose-200">{seedError}</p>
            </ControlPanel>
          ) : null}
          <ControlPanel className="p-4">
            <p className="text-sm font-semibold text-slate-100">Meta connector readiness dry-run</p>
            <p className="mt-1 text-xs leading-relaxed text-slate-500">
              Checks local configuration and Convex integration records only. It does not call Meta APIs, print secret values, or enable posting, ad edits, budget changes, or audience mutations.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                className="rounded-lg disabled:cursor-not-allowed disabled:opacity-60"
                disabled={metaReadinessBusy || !canManageIntegrations}
                onClick={() => {
                  setMetaReadinessBusy(true);
                  setMetaReadinessText(null);
                  void runMetaReadiness({})
                    .then((r) => {
                      const lines = [
                        r.summary,
                        r.noExternalCallNotice,
                        r.missingSetupItems.length ? `Missing / unchecked: ${r.missingSetupItems.slice(0, 8).join("; ")}` : "",
                        r.configuredItems.length ? `Present keys: ${r.configuredItems.slice(0, 8).join("; ")}` : "",
                      ].filter(Boolean);
                      setMetaReadinessText(lines.join("\n\n"));
                    })
                    .catch(() => {
                      setMetaReadinessText("Meta readiness check could not complete. No external Meta API calls were made.");
                    })
                    .finally(() => setMetaReadinessBusy(false));
                }}
              >
                <Button variant="secondary">{metaReadinessBusy ? "Running…" : "Run Meta connector readiness check"}</Button>
              </button>
            </div>
            {metaReadinessText ? (
              <pre className="mt-3 whitespace-pre-wrap rounded-lg border border-slate-800 bg-slate-950/70 p-3 text-xs text-slate-300">{metaReadinessText}</pre>
            ) : null}
          </ControlPanel>
          {!integrations.length ? (
            <ControlPanel className="p-4">
              <p className="text-sm text-slate-300">No Convex integration records yet — roadmap cards below still describe future bridges.</p>
            </ControlPanel>
          ) : null}
          <div className="space-y-6">
            {OPERATIONS_CATEGORY_SECTIONS.map((section) => {
              const live = integrationsByCategory[section.id] ?? [];
              const showSection = live.length > 0 || section.placeholders.length > 0;
              if (!showSection) return null;
              const collapsible = section.id === "publishing_social" || section.id === "ai_runtime";
              const grid = (
                <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                  {live.map((integration) => (
                    <IntegrationRecordButton integration={integration} key={integration.integrationId} onSelect={setSelectedIntegrationId} />
                  ))}
                  {section.placeholders.map((placeholder) => (
                    <PlannedIntegrationCard
                      key={placeholder.name}
                      name={placeholder.name}
                      purpose={placeholder.purpose}
                      relatedWorkflows={placeholder.relatedWorkflows}
                    />
                  ))}
                </div>
              );
              if (collapsible) {
                return (
                  <details key={section.id} className="overflow-hidden rounded-lg border border-slate-800 bg-slate-950/30">
                    <summary className="cursor-pointer list-none px-3 py-2.5 marker:content-none hover:bg-slate-900/50 [&::-webkit-details-marker]:hidden">
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <p className="text-sm font-semibold text-slate-100">{section.title}</p>
                        <span className="text-xs text-slate-500">
                          {live.length} configured · {section.placeholders.length} planned
                        </span>
                      </div>
                      <p className="mt-1 line-clamp-2 text-xs text-slate-500">{section.description}</p>
                    </summary>
                    <div className="border-t border-slate-800 px-3 py-3">{grid}</div>
                  </details>
                );
              }
              return (
                <div className="space-y-3" key={section.id}>
                  <div className="border-b border-slate-800 pb-2">
                    <p className="text-sm font-semibold text-slate-100">{section.title}</p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">{section.description}</p>
                  </div>
                  {grid}
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <IntegrationDetail integration={selectedIntegration} onBack={() => setSelectedIntegrationId(null)} canManage={canManageIntegrations} />
      )}
    </div>
  );
}

function humanizeKeapJobStatus(status?: string): string {
  if (!status) return "Not prepared";
  const k = status.toLowerCase();
  const map: Record<string, string> = {
    draft: "Draft",
    ready_for_manual_export: "Ready for manual export",
    exported_manually: "Exported manually",
    error: "Error",
  };
  return map[k] ?? titleCaseSnake(status);
}

export function KeapOperationsSection() {
  const appUser = useAppUser();
  const integrations = useQuery(api.integrations.listIntegrationRecords);
  const campaigns = useQuery(api.campaigns.listCampaignRecords);
  const jobs = useQuery(api.keapSync.listKeapSyncJobs);
  const seedError = useSeedIntegrations(integrations);
  const prepareKeapManualExport = useAction(api.runtimePrep.prepareKeapManualExport);
  const queueKeapManualHandoff = useAction(api.runtimePrep.queueKeapManualHandoff);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPreparing, setIsPreparing] = useState(false);
  const [isQueueing, setIsQueueing] = useState(false);
  const canManageIntegrations = appUser.role === "admin" || appUser.role === "operator";

  const keapIntegration = (integrations as IntegrationRecord[] | undefined)?.find((integration: IntegrationRecord) => integration.integrationId === "keap") ?? null;
  const readyCampaigns: CampaignRecord[] = useMemo(
    () => ((campaigns ?? []) as CampaignRecord[]).filter((campaign: CampaignRecord) => campaign.status === "ready_for_keap"),
    [campaigns],
  );
  const latestJobByCampaignId = useMemo(() => {
    const map = new Map<string, KeapSyncJobRecord>();
    for (const job of (jobs ?? []) as KeapSyncJobRecord[]) {
      if (!job.campaignId) continue;
      if (!map.has(job.campaignId)) {
        map.set(job.campaignId, job);
      }
    }
    return map;
  }, [jobs]);

  async function prepareReadyCampaignExports() {
    if (!readyCampaigns.length) return;
    setIsPreparing(true);
    setError(null);
    try {
      await Promise.all(readyCampaigns.map((campaign) => prepareKeapManualExport({ campaignId: campaign.campaignId })));
      setMessage("Handoff export packages prepared (local queue only — nothing sent externally).");
    } catch {
      setError("Unable to update integration. Check Convex connection.");
    } finally {
      setIsPreparing(false);
    }
  }

  async function queueReadyCampaignHandoffs() {
    if (!readyCampaigns.length) return;
    setIsQueueing(true);
    setError(null);
    try {
      await Promise.all(readyCampaigns.map((campaign) => queueKeapManualHandoff({ campaignId: campaign.campaignId })));
      setMessage("Manual handoff packages queued (local only — nothing sent to ESP or CRM).");
    } catch {
      setError("Unable to update integration. Check Convex connection.");
    } finally {
      setIsQueueing(false);
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <SectionHeader
        eyebrow="Operations"
        title="Email / CRM Handoff"
        description="Manual handoff and export posture for Emailmarketing.com, Keap/CRM registration tracking, and webhook prep. Operators prepare packages; no auto-send, no automatic campaign execution, and no live CRM API calls in this build."
        actions={
          <>
            <button className="rounded-lg disabled:cursor-not-allowed disabled:opacity-60" disabled={!canManageIntegrations || isPreparing || !readyCampaigns.length} onClick={() => void prepareReadyCampaignExports()} type="button">
              <Button>
                <Download className="mr-2 h-4 w-4" /> {isPreparing ? "Preparing…" : "Prepare handoff export"}
              </Button>
            </button>
            <button className="rounded-lg disabled:cursor-not-allowed disabled:opacity-60" disabled={!canManageIntegrations || isQueueing || !readyCampaigns.length} onClick={() => void queueReadyCampaignHandoffs()} type="button">
              <Button variant="secondary">
                <Send className="mr-2 h-4 w-4" /> {isQueueing ? "Queueing…" : "Queue manual handoff"}
              </Button>
            </button>
          </>
        }
      />
      <p className="text-xs leading-relaxed text-slate-500">
        Creates or queues a manual package only. Nothing is sent to Emailmarketing.com, Keap, Zapier, or external systems from this action.
      </p>
      {message ? (
        <ControlPanel className="p-4">
          <p className="text-sm text-slate-200">{message}</p>
        </ControlPanel>
      ) : null}
      {error ? (
        <ControlPanel className="border-rose-500/40 p-4">
          <p className="text-sm text-rose-200">{error}</p>
        </ControlPanel>
      ) : null}
      {seedError ? (
        <ControlPanel className="border-rose-500/40 p-4">
          <p className="text-sm text-rose-200">{seedError}</p>
        </ControlPanel>
      ) : null}
      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <ControlPanel className="p-4">
          <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div>
              <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-slate-400">Connection + Jobs</p>
              <p className="mt-1 text-sm text-slate-300">{keapIntegration?.healthSummary || keapIntegration?.fallback || "Loading CRM / email handoff status…"}</p>
            </div>
            <StatusBadge tone={tone(keapIntegration?.status || "not_configured")}>
              {keapIntegration?.statusLabel || (keapIntegration ? formatStatus(keapIntegration.status) : "Loading")}
            </StatusBadge>
          </div>
          <ConsoleTable className="mt-4">
            <TableHead>
              <tr>
                <Th>Campaign</Th>
                <Th>Status</Th>
                <Th>Audience / CRM tag mapping</Th>
                <Th>Pending export</Th>
                <Th>Errors</Th>
              </tr>
            </TableHead>
            <tbody>
              {campaigns === undefined ? (
                <tr>
                  <td className="border-t border-slate-800 px-4 py-3 align-top text-slate-200" colSpan={5}>Loading manual export queue…</td>
                </tr>
              ) : readyCampaigns.length ? (
                readyCampaigns.map((campaign: CampaignRecord) => (
                  <tr key={campaign.campaignId}>
                    <Td>{campaign.name}</Td>
                    <Td>
                      <StatusBadge tone="green">Ready for handoff</StatusBadge>
                    </Td>
                    <Td>{campaign.keapTagMapping || "Pending tag mapping"}</Td>
                    <Td>{humanizeKeapJobStatus(latestJobByCampaignId.get(campaign.campaignId)?.status)}</Td>
                    <Td>{latestJobByCampaignId.get(campaign.campaignId)?.error ? latestJobByCampaignId.get(campaign.campaignId)?.error : "None"}</Td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="border-t border-slate-800 px-4 py-3 align-top text-slate-200" colSpan={5}>
                    No campaigns are in Ready for handoff status for manual export yet.
                  </td>
                </tr>
              )}
            </tbody>
          </ConsoleTable>
        </ControlPanel>
        <QueueLane
          count={readyCampaigns.length}
          subtitle="Manual handoff only until live CRM/email policies are approved."
          title="Readiness + controls"
          tone={keapIntegration?.status === "connected" ? "green" : "blue"}
        >
          <SignalList
            items={[
              {
                label: "Connection status",
                value: keapIntegration?.statusLabel || formatStatus(keapIntegration?.status || "not_configured"),
                tone: tone(keapIntegration?.status || "not_configured"),
              },
              { label: "Last sync", value: formatTimestamp(keapIntegration?.lastSync), tone: keapIntegration?.lastSync ? "green" : "amber" },
              { label: "Available tag mappings", value: readyCampaigns.filter((campaign) => Boolean(campaign.keapTagMapping)).length, tone: "green" },
              { label: "Pending exports", value: ((jobs ?? []) as KeapSyncJobRecord[]).filter((job: KeapSyncJobRecord) => job.status === "draft" || job.status === "ready_for_manual_export").length, tone: "amber" },
              { label: "Errors", value: keapIntegration?.status === "error" ? 1 : 0, tone: keapIntegration?.status === "error" ? "red" : "green" },
            ]}
          />
        </QueueLane>
      </section>
    </div>
  );
}

export function OperationsRouteSection({ slug }: { slug?: string[] }) {
  const child = slug?.[1];
  if (!child || child === "integrations") return <IntegrationsSection />;
  if (child === "keap") return <KeapOperationsSection />;
  if (child === "production-bridge") return <ProductionBridgeSection />;
  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <SectionHeader
        eyebrow="Operations"
        title="Operations route not found"
        description={`"/operations/${child}" is not mapped. Use Integrations, Email / CRM Handoff, or Production Bridge — unknown paths are not redirected to external subsystems.`}
      />
      <ControlPanel className="p-4">
        <p className="text-sm text-slate-300">Pick a valid Operations area from the tab bar or use the links below.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link className="text-sm font-semibold text-sky-400 hover:underline" href="/operations/integrations">
            Integrations
          </Link>
          <span className="text-slate-600">·</span>
          <Link className="text-sm font-semibold text-sky-400 hover:underline" href="/operations/keap">
            Email / CRM Handoff
          </Link>
          <span className="text-slate-600">·</span>
          <Link className="text-sm font-semibold text-sky-400 hover:underline" href="/operations/production-bridge">
            Production Bridge
          </Link>
        </div>
      </ControlPanel>
    </div>
  );
}
