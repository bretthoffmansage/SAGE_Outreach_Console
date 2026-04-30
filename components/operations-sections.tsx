"use client";

import { useState } from "react";
import { ArrowLeft, ChevronRight, Download, KeyRound, Send, Settings2 } from "lucide-react";
import { campaigns } from "@/lib/data/demo-data";
import { Button, ConsoleTable, ControlPanel, QueueLane, SectionHeader, SignalList, StatusBadge, StatusDot, Td, Th, TableHead } from "@/components/ui";

function tone(status: string) {
  if (status === "connected") return "green";
  if (status === "manual_mode") return "blue";
  if (status === "missing_credentials") return "amber";
  if (status === "error") return "red";
  return "gray";
}

const integrationPanels = [
  { id: "keap", name: "Keap", purpose: "CRM audience, tags, and campaign handoff layer.", status: "manual_mode", lastCheck: "Apr 30 12:45", envKeys: ["KEAP_CLIENT_ID", "KEAP_CLIENT_SECRET", "KEAP_ACCESS_TOKEN"], notes: "Manual/demo fallback", fallback: "Manual audience entry/export" },
  { id: "helpdesk", name: "HelpDesk", purpose: "Response intake and reply intelligence.", status: "manual_mode", lastCheck: "Apr 30 12:43", envKeys: ["HELPDESK_CLIENT_ID", "HELPDESK_CLIENT_SECRET"], notes: "Manual/demo fallback", fallback: "Manual response import" },
  { id: "zapier", name: "Zapier", purpose: "Webhook handoff for approvals and exports.", status: "manual_mode", lastCheck: "Apr 30 12:41", envKeys: ["ZAPIER_CAMPAIGN_APPROVED_WEBHOOK_URL"], notes: "Manual/demo fallback", fallback: "Copy/export handoff" },
  { id: "clerk", name: "Clerk", purpose: "Auth and role shell.", status: "missing_credentials", lastCheck: "Apr 30 12:39", envKeys: ["NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", "CLERK_SECRET_KEY"], notes: "Shell scaffold only", fallback: "Demo role shell" },
  { id: "langgraph", name: "LangGraph", purpose: "Visual and runtime workflow orchestration.", status: "manual_mode", lastCheck: "Apr 30 12:36", envKeys: ["LANGGRAPH_API_KEY"], notes: "Visual/demo graph only", fallback: "Seeded workflow state" },
  { id: "openai", name: "OpenAI", purpose: "Structured output and agent orchestration scaffold.", status: "missing_credentials", lastCheck: "Apr 30 12:31", envKeys: ["OPENAI_API_KEY"], notes: "Structured output scaffolding", fallback: "Simulated JSON outputs" },
  { id: "claude", name: "Claude", purpose: "Copy model and Bari voice scaffold.", status: "missing_credentials", lastCheck: "Apr 30 12:30", envKeys: ["ANTHROPIC_API_KEY"], notes: "Copy model scaffold", fallback: "Manual/OpenAI fallback" },
  { id: "convex", name: "Convex", purpose: "Realtime app data and demo persistence layer.", status: "missing_credentials", lastCheck: "Apr 30 12:28", envKeys: ["NEXT_PUBLIC_CONVEX_URL", "CONVEX_DEPLOYMENT"], notes: "Local demo data active", fallback: "Read-only demo data" },
  { id: "vercel", name: "Vercel", purpose: "Deployment metadata and preview runtime.", status: "manual_mode", lastCheck: "Apr 30 12:26", envKeys: ["VERCEL_ENV"], notes: "Deployment metadata placeholder", fallback: "Local preview mode" },
] as const;

function formatStatus(status: string) {
  return status.replace(/_/g, " ");
}

function IntegrationList({
  onSelect,
}: {
  onSelect: (integrationId: string) => void;
}) {
  return (
    <div className="space-y-2">
      {integrationPanels.map((integration) => (
        <button
          key={integration.id}
          type="button"
          onClick={() => onSelect(integration.id)}
          className="focus-ring block w-full rounded-xl border border-slate-800 bg-slate-950/75 px-4 py-3 text-left transition hover:border-slate-700 hover:bg-slate-900/90"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-3">
                <StatusDot tone={tone(integration.status)} />
                <p className="text-sm font-semibold text-slate-100">{integration.name}</p>
                <StatusBadge tone={tone(integration.status)}>{formatStatus(integration.status)}</StatusBadge>
              </div>
              <p className="mt-2 text-sm text-slate-300">{integration.purpose}</p>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400">
                <span>Last check: {integration.lastCheck}</span>
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
  integrationId,
  onBack,
}: {
  integrationId: string;
  onBack: () => void;
}) {
  const integration = integrationPanels.find((item) => item.id === integrationId);
  const [message, setMessage] = useState<string | null>(null);

  if (!integration) return null;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <button type="button" onClick={onBack} className="focus-ring inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-950/80 px-3 py-2 text-sm font-semibold text-slate-200">
          <ArrowLeft className="h-4 w-4" /> Back to integrations
        </button>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setMessage(`Manual/demo check complete for ${integration.name}.`)}
            className="rounded-lg"
          >
            <Button variant="secondary">Check connection</Button>
          </button>
          <button
            type="button"
            onClick={() => setMessage(`Setup instructions opened for ${integration.name}. Review required env vars and fallback notes below.`)}
            className="rounded-lg"
          >
            <Button><Settings2 className="mr-2 h-4 w-4" /> Setup</Button>
          </button>
        </div>
      </div>

      <SectionHeader
        eyebrow="Integration detail"
        title={integration.name}
        description={integration.purpose}
        actions={<StatusBadge tone={tone(integration.status)}>{formatStatus(integration.status)}</StatusBadge>}
      />

      {message ? (
        <ControlPanel className="p-4">
          <p className="text-sm text-slate-200">{message}</p>
        </ControlPanel>
      ) : null}

      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <ControlPanel className="p-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3 text-slate-100">
            <KeyRound className="h-4 w-4 text-sky-300" />
            <p className="text-sm font-semibold">Required environment variables</p>
          </div>
          <div className="mt-4 grid gap-2">
            {integration.envKeys.map((envKey) => (
              <div key={envKey} className="rounded-lg border border-slate-800 bg-slate-950/70 px-3 py-3">
                <p className="text-sm font-mono text-slate-100">{envKey}</p>
              </div>
            ))}
          </div>
        </ControlPanel>

        <div className="grid gap-4">
          <QueueLane title="Connection status" count={formatStatus(integration.status)} tone={tone(integration.status)} subtitle={integration.notes}>
            <SignalList
              items={[
                { label: "Last check", value: integration.lastCheck, tone: "blue", detail: "Most recent seeded health check." },
                { label: "Fallback behavior", value: integration.fallback, tone: "amber", detail: "Used when live credentials are unavailable." },
                { label: "Setup mode", value: integration.notes, tone: tone(integration.status), detail: "Current setup state for this integration." },
              ]}
            />
          </QueueLane>

          <ControlPanel className="p-4">
            <p className="text-sm font-semibold text-slate-100">Setup instructions</p>
            <div className="mt-4 space-y-3 text-sm text-slate-300">
              <div className="rounded-lg border border-slate-800 bg-slate-950/70 px-3 py-3">
                Add the required env vars for {integration.name}, then run a manual/demo connection check from this detail view.
              </div>
              <div className="rounded-lg border border-slate-800 bg-slate-950/70 px-3 py-3">
                Connection notes: {integration.notes}. Future live setup hooks can be added here without changing the Operations tab model.
              </div>
            </div>
          </ControlPanel>
        </div>
      </section>
    </div>
  );
}

export function IntegrationsSection() {
  const [selectedIntegrationId, setSelectedIntegrationId] = useState<string | null>(null);

  return (
    <div className="space-y-5">
      {!selectedIntegrationId ? (
        <>
          <SectionHeader
            eyebrow="System connections"
            title="Integrations"
            description="Compact connection inventory for CRM, reply intake, auth, models, workflow runtime, and deployment surfaces."
          />
          <IntegrationList onSelect={setSelectedIntegrationId} />
        </>
      ) : (
        <IntegrationDetail integrationId={selectedIntegrationId} onBack={() => setSelectedIntegrationId(null)} />
      )}
    </div>
  );
}

export function KeapOperationsSection() {
  const ready = campaigns.filter((campaign) => campaign.status === "ready_for_keap");
  return (
    <div className="space-y-5">
      <SectionHeader
        eyebrow="Handoff control"
        title="Keap Sync"
        description="Sync and export control page for campaign handoff jobs, mappings, manual exports, and fallback operations."
        actions={
          <>
            <Button><Download className="mr-2 h-4 w-4" /> Manual export</Button>
            <Button variant="secondary"><Send className="mr-2 h-4 w-4" /> Queue handoff</Button>
          </>
        }
      />
      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <ControlPanel className="p-4">
          <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div>
              <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-slate-400">Connection + Jobs</p>
              <p className="mt-1 text-sm text-slate-300">Keap remains in manual/demo fallback until credentials are configured.</p>
            </div>
            <StatusBadge tone="blue">manual fallback</StatusBadge>
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
              {ready.map((campaign) => (
                <tr key={campaign.id}>
                  <Td>{campaign.name}</Td>
                  <Td><StatusBadge tone="green">ready for handoff</StatusBadge></Td>
                  <Td>demo tag mapping</Td>
                  <Td>manual export package</Td>
                  <Td>none</Td>
                </tr>
              ))}
            </tbody>
          </ConsoleTable>
        </ControlPanel>
        <QueueLane title="Readiness + Controls" count={ready.length} tone="green" subtitle="Campaigns ready for Keap or manual handoff.">
          <SignalList
            items={[
              { label: "Connection status", value: "manual/demo", tone: "blue" },
              { label: "Last sync", value: "not configured", tone: "amber" },
              { label: "Available tag mappings", value: "demo set", tone: "green" },
              { label: "Pending exports", value: ready.length, tone: "amber" },
              { label: "Errors", value: 0, tone: "green" },
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
