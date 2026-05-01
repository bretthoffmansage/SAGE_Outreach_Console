"use client";

import { useEffect, useMemo, useState } from "react";
import { useAction, useMutation, useQuery } from "convex/react";
import { ArrowLeft, ChevronRight, Download, KeyRound, Send, Settings2 } from "lucide-react";
import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";
import { useAppUser } from "@/components/auth/app-user-context";
import { Button, ConsoleTable, ControlPanel, QueueLane, SectionHeader, SignalList, StatusBadge, StatusDot, Td, Th, TableHead } from "@/components/ui";

type IntegrationRecord = Doc<"integrationConnections">;
type CampaignRecord = Doc<"campaigns">;
type KeapSyncJobRecord = Doc<"keapSyncJobs">;

function tone(status: string) {
  if (status === "connected") return "green";
  if (status === "manual_mode" || status === "demo_fallback") return "blue";
  if (status === "missing_credentials") return "amber";
  if (status === "error") return "red";
  return "gray";
}

function formatStatus(status: string) {
  return status.replace(/_/g, " ");
}

function formatTimestamp(value?: number) {
  if (!value) return "not checked";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(value);
}

function useSeedIntegrations(records: IntegrationRecord[] | undefined) {
  const seedDefaults = useMutation(api.integrations.seedDefaultIntegrationRecordsIfEmpty);
  const [seedAttempted, setSeedAttempted] = useState(false);
  const [seedError, setSeedError] = useState<string | null>(null);

  useEffect(() => {
    if (records === undefined || records.length > 0 || seedAttempted) return;
    setSeedAttempted(true);
    void seedDefaults()
      .then(() => setSeedError(null))
      .catch(() => setSeedError("Unable to load integration records."));
  }, [records, seedAttempted, seedDefaults]);

  return seedError;
}

function IntegrationList({
  integrations,
  onSelect,
}: {
  integrations: IntegrationRecord[];
  onSelect: (integrationId: string) => void;
}) {
  return (
    <div className="space-y-2">
      {integrations.map((integration) => (
        <button
          key={integration.integrationId}
          type="button"
          onClick={() => onSelect(integration.integrationId)}
          className="focus-ring block w-full rounded-xl border border-slate-800 bg-slate-950/75 px-4 py-3 text-left transition hover:border-slate-700 hover:bg-slate-900/90"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-3">
                <StatusDot tone={tone(integration.status)} />
                <p className="text-sm font-semibold text-slate-100">{integration.name}</p>
                <StatusBadge tone={tone(integration.status)}>{integration.statusLabel || formatStatus(integration.status)}</StatusBadge>
              </div>
              <p className="mt-2 text-sm text-slate-300">{integration.purpose}</p>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400">
                <span>Last check: {formatTimestamp(integration.lastCheckAt)}</span>
                <span>{integration.envKeys.length} env vars</span>
                <span>Fallback: {integration.fallback}</span>
              </div>
            </div>
            <span className="mt-1 inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.16em] text-sky-300">
              Open <ChevronRight className="h-3.5 w-3.5" />
            </span>
          </div>
        </button>
      ))}
    </div>
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
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);

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
        eyebrow="Integration detail"
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
                      {configured ? "detected" : missing ? "missing" : "unchecked"}
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
  const [selectedIntegrationId, setSelectedIntegrationId] = useState<string | null>(null);
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

  if (integrations === undefined) {
    return (
      <div className="space-y-5">
        <SectionHeader
          eyebrow="System connections"
          title="Integrations"
          description="Compact connection inventory for CRM, reply intake, auth, models, workflow runtime, and deployment surfaces."
        />
        <ControlPanel className="p-4">
          <p className="text-sm text-slate-300">Loading integration records...</p>
        </ControlPanel>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {!selectedIntegration ? (
        <>
          <SectionHeader
            eyebrow="System connections"
            title="Integrations"
            description="Compact connection inventory for CRM, reply intake, auth, models, workflow runtime, and deployment surfaces."
            actions={overallHealth ? <StatusBadge tone={overallHealth.status === "healthy" ? "green" : overallHealth.status === "warning" ? "amber" : "red"}>{`System ${overallHealth.status}`}</StatusBadge> : undefined}
          />
          {seedError ? (
            <ControlPanel className="border-rose-500/40 p-4">
              <p className="text-sm text-rose-200">{seedError}</p>
            </ControlPanel>
          ) : null}
          {integrations.length ? (
            <IntegrationList integrations={integrations} onSelect={setSelectedIntegrationId} />
          ) : (
            <ControlPanel className="p-4">
              <p className="text-sm text-slate-300">No integration records yet.</p>
            </ControlPanel>
          )}
        </>
      ) : (
        <IntegrationDetail integration={selectedIntegration} onBack={() => setSelectedIntegrationId(null)} canManage={canManageIntegrations} />
      )}
    </div>
  );
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
      setMessage("Manual export packages prepared.");
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
      setMessage("Manual Keap handoff queue updated.");
    } catch {
      setError("Unable to update integration. Check Convex connection.");
    } finally {
      setIsQueueing(false);
    }
  }

  return (
    <div className="space-y-5">
      <SectionHeader
        eyebrow="Handoff control"
        title="Keap Sync"
        description="Sync and export control page for campaign handoff jobs, mappings, manual exports, and fallback operations."
        actions={
          <>
            <button className="rounded-lg disabled:cursor-not-allowed disabled:opacity-60" disabled={!canManageIntegrations || isPreparing || !readyCampaigns.length} onClick={() => void prepareReadyCampaignExports()} type="button">
              <Button><Download className="mr-2 h-4 w-4" /> {isPreparing ? "Preparing..." : "Manual export"}</Button>
            </button>
            <button className="rounded-lg disabled:cursor-not-allowed disabled:opacity-60" disabled={!canManageIntegrations || isQueueing || !readyCampaigns.length} onClick={() => void queueReadyCampaignHandoffs()} type="button">
              <Button variant="secondary"><Send className="mr-2 h-4 w-4" /> {isQueueing ? "Queueing..." : "Queue handoff"}</Button>
            </button>
          </>
        }
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
              <p className="mt-1 text-sm text-slate-300">{keapIntegration?.healthSummary || keapIntegration?.fallback || "Loading Keap integration status..."}</p>
            </div>
            <StatusBadge tone={tone(keapIntegration?.status || "not_configured")}>
              {keapIntegration?.statusLabel || (keapIntegration ? formatStatus(keapIntegration.status) : "loading")}
            </StatusBadge>
          </div>
          <ConsoleTable className="mt-4">
            <TableHead>
              <tr>
                <Th>Campaign</Th>
                <Th>Status</Th>
                <Th>Tag mapping</Th>
                <Th>Pending export</Th>
                <Th>Errors</Th>
              </tr>
            </TableHead>
            <tbody>
              {campaigns === undefined ? (
                <tr>
                  <td className="border-t border-slate-800 px-4 py-3 align-top text-slate-200" colSpan={5}>Loading Keap handoff candidates...</td>
                </tr>
              ) : readyCampaigns.length ? (
                readyCampaigns.map((campaign: CampaignRecord) => (
                  <tr key={campaign.campaignId}>
                    <Td>{campaign.name}</Td>
                    <Td><StatusBadge tone="green">ready for handoff</StatusBadge></Td>
                    <Td>{campaign.keapTagMapping || "pending tag mapping"}</Td>
                    <Td>{latestJobByCampaignId.get(campaign.campaignId)?.status?.replace(/_/g, " ") || "not prepared"}</Td>
                    <Td>{latestJobByCampaignId.get(campaign.campaignId)?.error || "none"}</Td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="border-t border-slate-800 px-4 py-3 align-top text-slate-200" colSpan={5}>No campaigns are currently ready for Keap handoff.</td>
                </tr>
              )}
            </tbody>
          </ConsoleTable>
        </ControlPanel>
        <QueueLane title="Readiness + Controls" count={readyCampaigns.length} tone={keapIntegration?.status === "connected" ? "green" : "blue"} subtitle="Campaigns ready for Keap or manual handoff.">
          <SignalList
            items={[
              { label: "Connection status", value: keapIntegration?.statusLabel || "loading", tone: tone(keapIntegration?.status || "not_configured") },
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
  if (slug?.[1] === "integrations") return <IntegrationsSection />;
  return <KeapOperationsSection />;
}
