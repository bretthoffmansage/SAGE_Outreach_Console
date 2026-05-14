"use client";

import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Braces, ClipboardList, Play, ShieldAlert } from "lucide-react";
import { useAppUser } from "@/components/auth/app-user-context";
import { ConsoleTable, ControlPanel, SectionHeader, StatusBadge, TableHead, Td, Th } from "@/components/ui";
import { COPY_INTELLIGENCE_CONTEXT_BUCKETS, COPY_INTELLIGENCE_PIPELINE_STAGES } from "@/lib/copy-intelligence-pipeline";
import { cn } from "@/lib/utils";

const btnBase =
  "focus-ring inline-flex items-center justify-center gap-2 rounded-lg px-3.5 py-2 text-sm font-semibold transition disabled:opacity-60";
const btnPrimary = `${btnBase} border border-sky-500/60 bg-sky-500 text-slate-950 hover:bg-sky-400`;
const btnSecondary = `${btnBase} border border-slate-700 bg-slate-900 text-slate-100 hover:bg-slate-800`;
const btnGhost = `${btnBase} border border-transparent bg-transparent text-slate-300 hover:bg-slate-900`;

const OUTPUT_TYPES = [
  { value: "full_launch_copy_packet", label: "Full launch copy packet" },
  { value: "youtube_copy", label: "YouTube copy" },
  { value: "email_brief", label: "Emailmarketing.com brief" },
  { value: "creative_brief", label: "Creative / Brandon brief" },
  { value: "social_captions", label: "Social captions" },
  { value: "reels_hooks", label: "Reels hooks" },
  { value: "cta_alternatives", label: "CTA alternatives" },
  { value: "rewrite_existing", label: "Rewrite existing copy" },
  { value: "claims_voice_review", label: "Claims / voice review only" },
] as const;

type CopyRunRow = {
  runId: string;
  campaignId?: string;
  agentId: string;
  status: string;
  groupId?: string;
  runType?: string;
  safetyMode?: string;
  appliedToCampaign?: boolean;
  reviewRequired?: boolean;
  inputSnapshot?: string;
  outputSummary?: string;
  outputJson?: string;
  startedAt: number;
  finishedAt?: number;
};

function formatWhen(ts?: number) {
  if (!ts) return "—";
  return new Date(ts).toLocaleString();
}

function safeParseJson(raw?: string): Record<string, unknown> | null {
  if (!raw?.trim()) return null;
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function CopyIntelligenceSection() {
  const searchParams = useSearchParams();
  const campaignFromUrl = searchParams.get("campaign")?.trim() ?? "";
  const { email: operatorEmail } = useAppUser();

  const [selectedCampaignId, setSelectedCampaignId] = useState(campaignFromUrl);
  const [outputType, setOutputType] = useState<string>(OUTPUT_TYPES[0].value);
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const [runBusy, setRunBusy] = useState(false);
  const [runMessage, setRunMessage] = useState<string | null>(null);

  useEffect(() => {
    if (campaignFromUrl) setSelectedCampaignId(campaignFromUrl);
  }, [campaignFromUrl]);

  const seedCopyAgents = useMutation(api.agents.seedCopyIntelligenceAgentsIfMissing);
  const runCopyDryRun = useMutation(api.agents.runCopyPipelineDryRun);

  const seedOnce = useRef(false);
  useEffect(() => {
    if (seedOnce.current) return;
    seedOnce.current = true;
    void seedCopyAgents({}).catch(() => {
      /* offline / demo */
    });
  }, [seedCopyAgents]);

  const campaigns = useQuery(api.campaigns.listCampaignRecords, {});
  const copyConfigs = useQuery(api.agents.listAgentConfigs, { groupId: "copy_intelligence" });
  const copyRuns = useQuery(api.agents.listRecentAgentRuns, { groupId: "copy_intelligence", limit: 40 });
  const campaignRow = useQuery(
    api.campaigns.getCampaignRecordByCampaignId,
    selectedCampaignId ? { campaignId: selectedCampaignId } : "skip",
  );
  const assetId = campaignRow?.sourceProductionAssetId?.trim();
  const linkedAsset = useQuery(api.productionAssets.getProductionAsset, assetId ? { productionAssetId: assetId } : "skip");

  const runs = (copyRuns ?? []) as CopyRunRow[];

  const latestPipelineForSelection = useMemo(() => {
    return (
      runs.find((r) => r.runType === "copy_pipeline" && r.campaignId === selectedCampaignId) ??
      runs.find((r) => r.runType === "copy_pipeline") ??
      null
    );
  }, [runs, selectedCampaignId]);

  useEffect(() => {
    if (!selectedRunId && latestPipelineForSelection) {
      setSelectedRunId(latestPipelineForSelection.runId);
    }
  }, [latestPipelineForSelection, selectedRunId]);

  const selectedRun = runs.find((r) => r.runId === selectedRunId) ?? latestPipelineForSelection ?? runs[0] ?? null;
  const outputParsed = useMemo(() => safeParseJson(selectedRun?.outputJson), [selectedRun?.outputJson]);

  const runPipeline = useCallback(
    async (type: string) => {
      if (!selectedCampaignId) {
        setRunMessage("No campaign selected. Choose a launch packet before running Copy Intelligence.");
        return;
      }
      setRunBusy(true);
      setRunMessage(null);
      try {
        const res = await runCopyDryRun({
          campaignId: selectedCampaignId,
          outputType: type,
          createdBy: operatorEmail ?? undefined,
        });
        setSelectedRunId(res.runId);
        setRunMessage(res.summary ?? "Dry run complete.");
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        if (msg.includes("CAMPAIGN_NOT_FOUND")) {
          setRunMessage("That campaign was not found in Convex. Pick another packet or sync demo data.");
        } else {
          setRunMessage(`Copy Intelligence run failed: ${msg}`);
        }
      } finally {
        setRunBusy(false);
      }
    },
    [operatorEmail, runCopyDryRun, selectedCampaignId],
  );

  const pipelineLastAt = latestPipelineForSelection?.finishedAt ?? latestPipelineForSelection?.startedAt;

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Intelligence"
        title="Copy Intelligence"
        description="Draft-only multi-agent copy workflow for campaign angles, hooks, YouTube copy, email briefs, creative briefs, social captions, and learning feedback. Humans approve final language before anything is sent or published."
      />

      <div className="flex flex-wrap gap-2">
        <StatusBadge tone="amber">Draft-only</StatusBadge>
        <StatusBadge tone="amber">Human approval required</StatusBadge>
        <StatusBadge tone="gray">No auto-send / post / publish</StatusBadge>
        {outputParsed?.externalModelCall === false ? <StatusBadge tone="blue">No external model call (dry run)</StatusBadge> : null}
      </div>

      <ControlPanel className="border-slate-800 bg-slate-950/60 p-4">
        <p className="text-sm font-semibold text-slate-100">Future Meta and platform context</p>
        <p className="mt-2 text-sm leading-relaxed text-slate-300">
          Meta performance and trend insights can eventually inform hooks, CTAs, topics, and creative patterns here. Only reviewed or approved platform insights
          should become trusted context; manual and demo signals stay labeled. Meta insights do not replace human judgment or compliance review — and this phase
          has no live Meta connector.
        </p>
        <p className="mt-2 text-xs text-slate-500">
          See <Link className="text-sky-400 hover:underline" href="/intelligence/platform-connector">Platform Connector Intelligence</Link> and{" "}
          <Link className="text-sky-400 hover:underline" href="/intelligence/performance">Performance Intelligence</Link> for structured signals.
        </p>
      </ControlPanel>

      <div className="grid gap-4 lg:grid-cols-2">
        <ControlPanel className="p-4">
          <p className="text-sm font-semibold text-slate-100">Campaign</p>
          <p className="mt-1 text-xs text-slate-500">Select a Weekly Launch Packet to anchor inputs. Deep links use <code className="text-sky-300">?campaign=</code>.</p>
          {!selectedCampaignId ? (
            <p className="mt-3 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
              No campaign selected. Choose a launch packet before running Copy Intelligence.
            </p>
          ) : null}
          <label className="mt-3 grid gap-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Launch packet</span>
            <select
              className="console-field-control focus-ring w-full rounded-lg border border-slate-700 bg-slate-950/80 px-3 py-2 text-slate-100"
              onChange={(e) => setSelectedCampaignId(e.target.value)}
              value={selectedCampaignId}
            >
              <option value="">Select campaign…</option>
              {(campaigns ?? []).map((c: { campaignId: string; name: string }) => (
                <option key={c.campaignId} value={c.campaignId}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          {campaignRow ? (
            <dl className="mt-3 grid gap-1 text-xs text-slate-400">
              <div className="flex justify-between gap-2">
                <dt>Publish date</dt>
                <dd className="text-slate-200">{campaignRow.publishDate?.trim() || "—"}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt>Source asset</dt>
                <dd className="text-right text-slate-200">{campaignRow.sourceProductionAssetTitle?.trim() || "—"}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt>Readiness</dt>
                <dd className="text-slate-200">{campaignRow.readinessStatus?.trim() || "—"}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt>Copy status</dt>
                <dd className="text-slate-200">{campaignRow.copyStatus?.trim() || "—"}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt>Last copy run</dt>
                <dd className="text-slate-200">{campaignRow.lastCopyRunId ? formatWhen(campaignRow.lastCopyRunAt) : "—"}</dd>
              </div>
            </dl>
          ) : null}
          <div className="mt-3 flex flex-wrap gap-2">
            <Link className={btnSecondary} href="/campaigns">
              Campaigns
            </Link>
            <Link className={btnGhost} href="/intelligence/langgraph">
              LangGraph map
            </Link>
          </div>
        </ControlPanel>

        <ControlPanel className="p-4">
          <p className="text-sm font-semibold text-slate-100">Output focus</p>
          <p className="mt-1 text-xs text-slate-500">Selects the dry-run focus label stored on the run; full pipeline shape is always returned.</p>
          <label className="mt-3 grid gap-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Output type</span>
            <select
              className="console-field-control focus-ring w-full rounded-lg border border-slate-700 bg-slate-950/80 px-3 py-2 text-slate-100"
              onChange={(e) => setOutputType(e.target.value)}
              value={outputType}
            >
              {OUTPUT_TYPES.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>

          <div className="mt-4 flex flex-col gap-2">
            <button
              className={btnPrimary}
              disabled={runBusy || !selectedCampaignId}
              onClick={() => void runPipeline(outputType)}
              type="button"
            >
              <Play className="h-4 w-4 shrink-0" />
              {runBusy ? "Running…" : "Run copy pipeline dry test"}
            </button>
            <div className="flex flex-wrap gap-2">
              <button
                className={btnSecondary}
                disabled={runBusy || !selectedCampaignId}
                onClick={() => void runPipeline("reels_hooks")}
                type="button"
              >
                Run Hook Lab
              </button>
              <button
                className={btnSecondary}
                disabled={runBusy || !selectedCampaignId}
                onClick={() => void runPipeline("claims_voice_review")}
                type="button"
              >
                Voice + claims review
              </button>
              <button
                className={btnSecondary}
                disabled={runBusy || !selectedCampaignId}
                onClick={() => void runPipeline("full_launch_copy_packet")}
                type="button"
              >
                Generate draft packet
              </button>
            </div>
            {runMessage ? <p className="text-xs text-slate-300">{runMessage}</p> : null}
          </div>
        </ControlPanel>
      </div>

      <ControlPanel className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-semibold text-slate-100">Copy agent stack</p>
          <StatusBadge tone="gray">{copyConfigs?.length ?? 0} agents configured</StatusBadge>
        </div>
        <p className="mt-1 text-xs text-slate-500">
          Specialized layers — not a single generic writer. Orchestrator: <code className="text-sky-300">copy_pipeline</code>.
        </p>
        <div className="mt-4 overflow-x-auto">
          <ConsoleTable>
            <TableHead>
              <tr>
                <Th>Stage</Th>
                <Th>Agent</Th>
                <Th>Purpose</Th>
                <Th>Safety</Th>
                <Th>Status</Th>
                <Th>Last pipeline run</Th>
              </tr>
            </TableHead>
            <tbody>
              {COPY_INTELLIGENCE_PIPELINE_STAGES.map((stage) => {
                const cfg = copyConfigs?.find((c: { agentId: string }) => c.agentId === stage.agentId);
                return (
                  <tr className="border-t border-slate-800" key={stage.key}>
                    <Td className="font-medium text-slate-200">{stage.label}</Td>
                    <Td className="text-slate-300">{cfg?.displayName ?? stage.agentId}</Td>
                    <Td className="max-w-[220px] text-xs text-slate-400">{stage.purpose}</Td>
                    <Td>
                      <StatusBadge tone="amber">{stage.safetyMode}</StatusBadge>
                    </Td>
                    <Td>
                      <StatusBadge tone={cfg?.enabled === false ? "gray" : "green"}>{cfg?.enabled === false ? "Disabled" : "Ready"}</StatusBadge>
                    </Td>
                    <Td className="text-xs text-slate-500">{formatWhen(pipelineLastAt)}</Td>
                  </tr>
                );
              })}
            </tbody>
          </ConsoleTable>
        </div>
      </ControlPanel>

      <div className="grid gap-4 lg:grid-cols-2">
        <ControlPanel className="p-4">
          <p className="text-sm font-semibold text-slate-100">Production Bridge context</p>
          {!assetId ? (
            <p className="mt-2 text-xs text-amber-100/90">
              No source asset linked. Copy Intelligence can still use campaign fields, but source-specific drafts may be weaker.
            </p>
          ) : null}
          {linkedAsset ? (
            <dl className="mt-3 grid gap-2 text-xs text-slate-400">
              <div>
                <dt className="text-slate-500">Title</dt>
                <dd className="text-slate-200">{linkedAsset.title}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Transcript</dt>
                <dd className="text-slate-200">
                  {linkedAsset.transcriptSummary?.trim()
                    ? linkedAsset.transcriptSummary.length > 160
                      ? `${linkedAsset.transcriptSummary.slice(0, 160)}…`
                      : linkedAsset.transcriptSummary
                    : "—"}
                </dd>
              </div>
              <div className="flex flex-wrap gap-3">
                <span>Status: {linkedAsset.transcriptStatus ?? "—"}</span>
                <span>Thumbnail: {linkedAsset.thumbnailStatus ?? "—"}</span>
                <span>
                  Shorts: {linkedAsset.readyShortsCount ?? 0}/{linkedAsset.shortsCount ?? 0}
                </span>
              </div>
              {linkedAsset.notes?.trim() ? (
                <div>
                  <dt className="text-slate-500">Production notes</dt>
                  <dd className="text-slate-300">{linkedAsset.notes}</dd>
                </div>
              ) : null}
            </dl>
          ) : assetId ? (
            <p className="mt-2 text-xs text-slate-500">Asset ID on packet does not match Production Bridge cache yet.</p>
          ) : null}
        </ControlPanel>

        <ControlPanel className="p-4">
          <p className="text-sm font-semibold text-slate-100">Context sources (Content Library)</p>
          <p className="mt-1 text-xs text-slate-500">
            Retrieval uses trust rules in dry-run: active/approved as trusted, drafts labeled caution, swipe as inspiration-only, rejected/archived excluded.
          </p>
          <ul className="mt-3 list-inside list-disc space-y-1 text-xs text-slate-400">
            {COPY_INTELLIGENCE_CONTEXT_BUCKETS.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
        </ControlPanel>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ControlPanel className="p-4">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-slate-400" />
            <p className="text-sm font-semibold text-slate-100">Copy run history</p>
          </div>
          <p className="mt-1 text-xs text-slate-500">Recent runs with <code className="text-sky-300">groupId: copy_intelligence</code>. Nothing here auto-writes packet fields.</p>
          <div className="mt-4 max-h-72 overflow-y-auto rounded-lg border border-slate-800">
            {runs.length === 0 ? (
              <p className="p-3 text-xs text-slate-500">No copy runs yet. Run a dry test after selecting a campaign.</p>
            ) : (
              runs.map((r) => (
                <button
                  className={cn(
                    "flex w-full flex-col gap-0.5 border-b border-slate-800 px-3 py-2 text-left text-xs transition hover:bg-slate-900/80",
                    selectedRun?.runId === r.runId ? "bg-sky-950/40" : "",
                  )}
                  key={r.runId}
                  onClick={() => setSelectedRunId(r.runId)}
                  type="button"
                >
                  <span className="font-semibold text-slate-200">{r.runType ?? r.agentId}</span>
                  <span className="text-slate-500">
                    {r.campaignId ?? "—"} · {r.status} · {formatWhen(r.startedAt)}
                  </span>
                  <span className="flex flex-wrap gap-1 pt-1">
                    {r.safetyMode ? <StatusBadge tone="amber">{String(r.safetyMode)}</StatusBadge> : null}
                    {r.appliedToCampaign ? <StatusBadge tone="green">Applied to campaign</StatusBadge> : <StatusBadge tone="gray">Not applied</StatusBadge>}
                    {r.reviewRequired ? <StatusBadge tone="amber">Review required</StatusBadge> : null}
                  </span>
                </button>
              ))
            )}
          </div>
        </ControlPanel>

        <ControlPanel className="p-4">
          <div className="flex items-center gap-2">
            <Braces className="h-4 w-4 text-slate-400" />
            <p className="text-sm font-semibold text-slate-100">Draft output inspector</p>
          </div>
          {!selectedRun ? (
            <p className="mt-3 text-xs text-slate-500">Select a run from history.</p>
          ) : (
            <div className="mt-3 space-y-3 text-xs">
              <p className="text-slate-400">
                <span className="font-semibold text-slate-300">Summary:</span> {selectedRun.outputSummary ?? "—"}
              </p>
              <div>
                <p className="font-semibold text-slate-300">Input snapshot</p>
                <pre className="mt-1 max-h-40 overflow-auto rounded-md border border-slate-800 bg-slate-950/80 p-2 text-[11px] text-slate-400">
                  {selectedRun.inputSnapshot ?? "—"}
                </pre>
              </div>
              <div>
                <p className="font-semibold text-slate-300">Structured output (outputJson)</p>
                <pre className="mt-1 max-h-56 overflow-auto rounded-md border border-slate-800 bg-slate-950/80 p-2 text-[11px] text-slate-400">
                  {selectedRun.outputJson ?? "—"}
                </pre>
              </div>
              {outputParsed?.reviewRecommendations ? (
                <div>
                  <p className="font-semibold text-slate-300">Review routing (assist only)</p>
                  <pre className="mt-1 overflow-auto rounded-md border border-slate-800 bg-slate-950/80 p-2 text-[11px] text-slate-400">
                    {JSON.stringify(outputParsed.reviewRecommendations, null, 2)}
                  </pre>
                </div>
              ) : null}
              <div className="flex flex-wrap gap-2 border-t border-slate-800 pt-3">
                <button
                  className={btnSecondary}
                  disabled
                  title="Planned: patch only selected campaign fields after explicit confirmation."
                  type="button"
                >
                  Apply selected fields (planned)
                </button>
                <button
                  className={btnGhost}
                  onClick={() => {
                    if (selectedRun.outputJson) void navigator.clipboard.writeText(selectedRun.outputJson);
                  }}
                  type="button"
                >
                  Copy output JSON
                </button>
              </div>
            </div>
          )}
        </ControlPanel>
      </div>

      <ControlPanel className="p-4">
        <div className="flex items-center gap-2">
          <ShieldAlert className="h-4 w-4 text-amber-300" />
          <p className="text-sm font-semibold text-slate-100">Safety and approvals</p>
        </div>
        <ul className="mt-2 list-inside list-disc space-y-1 text-xs text-slate-400">
          <li>Copy Intelligence produces drafts, suggestions, and review notes only.</li>
          <li>Blue / Bari suggestions are sparse and reason-based — never auto-assigned.</li>
          <li>Learning candidates stay unapproved until a human promotes them in the Library.</li>
          <li>
            Labels used on runs: <code className="text-sky-300">draft_only</code>, <code className="text-sky-300">read_only</code>,{" "}
            <code className="text-sky-300">review_assist</code>, <code className="text-sky-300">learning_candidate</code>.
          </li>
        </ul>
      </ControlPanel>
    </div>
  );
}
