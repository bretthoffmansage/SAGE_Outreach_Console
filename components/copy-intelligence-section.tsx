"use client";

import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Braces, ClipboardList, Play, ShieldAlert } from "lucide-react";
import { useAppUser } from "@/components/auth/app-user-context";
import { ControlPanel, SectionHeader, StatusBadge } from "@/components/ui";
import { COPY_INTELLIGENCE_CONTEXT_BUCKETS, COPY_INTELLIGENCE_PIPELINE_GROUPS, COPY_INTELLIGENCE_PIPELINE_STAGES } from "@/lib/copy-intelligence-pipeline";
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

function formatSafetyMode(mode?: string) {
  if (!mode) return "—";
  const map: Record<string, string> = {
    read_only: "Read-only",
    draft_only: "Draft-only",
    review_assist: "Review assist",
    learning_candidate: "Learning candidate",
  };
  return map[mode] ?? mode.replace(/_/g, " ");
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
    <div className="mx-auto max-w-7xl space-y-6">
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

      <ControlPanel className="border-slate-800 bg-slate-950/60 p-3">
        <p className="text-xs leading-relaxed text-slate-400">
          Future Meta and platform context may inform hooks and CTAs here — only reviewed or approved signals become trusted context. This phase has no live Meta connector. See{" "}
          <Link className="text-sky-400 hover:underline" href="/intelligence/platform-connector">
            Platform Connector
          </Link>{" "}
          and{" "}
          <Link className="text-sky-400 hover:underline" href="/intelligence/performance">
            Performance Intelligence
          </Link>
          .
        </p>
      </ControlPanel>

      <div className="grid gap-4 lg:grid-cols-2">
        <ControlPanel className="p-4">
          <p className="text-sm font-semibold text-slate-100">Launch packet context</p>
          <p className="mt-1 text-xs text-slate-500">Select a Weekly Launch Packet first — deep links use <code className="text-sky-300">?campaign=</code>.</p>
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
                <dt>Launch readiness</dt>
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
              Runtime map
            </Link>
          </div>
        </ControlPanel>

        <ControlPanel className="p-4">
          <p className="text-sm font-semibold text-slate-100">Draft controls</p>
          <p className="mt-1 text-xs text-slate-500">Output focus selects the dry-run label stored on the run; the full pipeline shape is still returned.</p>
          <label className="mt-3 grid gap-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Output focus</span>
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
              title={!selectedCampaignId ? "Select a launch packet to run a dry test." : "Dry-run only — no auto-post or auto-send."}
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
                title="Dry-run Hook Lab focus — draft-only."
                type="button"
              >
                Hook Lab dry run
              </button>
              <button
                className={btnSecondary}
                disabled={runBusy || !selectedCampaignId}
                onClick={() => void runPipeline("claims_voice_review")}
                title="Dry-run voice + claims review — review assist only."
                type="button"
              >
                Voice + claims review
              </button>
              <button
                className={btnSecondary}
                disabled={runBusy || !selectedCampaignId}
                onClick={() => void runPipeline("full_launch_copy_packet")}
                title="Dry-run full draft packet — human approval still required before publish."
                type="button"
              >
                Generate draft packet
              </button>
            </div>
            <p className="text-xs text-slate-500">Draft-only. No campaign fields are overwritten unless manually applied later.</p>
            {runMessage ? <p className="text-xs text-slate-300">{runMessage}</p> : null}
          </div>
        </ControlPanel>
      </div>

      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-semibold text-slate-100">Pipeline &amp; layers</p>
          <StatusBadge tone="gray">{copyConfigs?.length ?? 0} agents configured</StatusBadge>
        </div>
        <p className="text-xs text-slate-500">
          Stages are grouped for readability — orchestrator remains <code className="text-sky-300">copy_pipeline</code>.
        </p>
        <div className="space-y-2">
          {COPY_INTELLIGENCE_PIPELINE_GROUPS.map((group) => {
            const stages = COPY_INTELLIGENCE_PIPELINE_STAGES.filter((s) => (group.stageKeys as readonly string[]).includes(s.key));
            const ready = stages.filter((s) => copyConfigs?.find((c: { agentId: string; enabled?: boolean }) => c.agentId === s.agentId)?.enabled !== false).length;
            return (
              <details className="overflow-hidden rounded-xl border border-slate-800 bg-slate-950/55" key={group.id} open={group.id === "intake_context"}>
                <summary className="cursor-pointer list-none px-4 py-3 text-sm font-semibold text-slate-100 marker:content-none hover:bg-slate-900/50 [&::-webkit-details-marker]:hidden">
                  {group.label}
                  <span className="ml-2 text-xs font-normal text-slate-500">
                    {stages.length} stages · {ready}/{stages.length} enabled
                  </span>
                </summary>
                <div className="border-t border-slate-800 px-4 py-3">
                  <ul className="space-y-2 text-xs text-slate-300">
                    {stages.map((stage) => {
                      const cfg = copyConfigs?.find((c: { agentId: string }) => c.agentId === stage.agentId);
                      return (
                        <li className="flex flex-wrap items-start justify-between gap-2 rounded-lg border border-slate-800/80 bg-slate-950/50 px-3 py-2" key={stage.key}>
                          <div>
                            <p className="font-semibold text-slate-100">{cfg?.displayName ?? stage.agentId}</p>
                            <p className="mt-0.5 text-[0.7rem] leading-snug text-slate-500">{stage.purpose}</p>
                          </div>
                          <div className="flex flex-wrap items-center justify-end gap-1">
                            <StatusBadge tone="amber">{formatSafetyMode(stage.safetyMode)}</StatusBadge>
                            <StatusBadge tone={cfg?.enabled === false ? "gray" : "green"}>{cfg?.enabled === false ? "Disabled" : "Ready"}</StatusBadge>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                  <p className="mt-2 text-[0.65rem] text-slate-600">Last pipeline dry test: {formatWhen(pipelineLastAt)}</p>
                </div>
              </details>
            );
          })}
        </div>
      </div>

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
                <dt className="text-slate-500">Source asset title</dt>
                <dd className="text-slate-200">{linkedAsset.title}</dd>
              </div>
              <div className="flex flex-wrap gap-3">
                <span>Transcript: {linkedAsset.transcriptStatus ?? "—"}</span>
                <span>Shorts: {linkedAsset.readyShortsCount ?? 0}/{linkedAsset.shortsCount ?? 0}</span>
                <span>Thumbnail: {linkedAsset.thumbnailStatus ?? "—"}</span>
              </div>
              <div>
                <dt className="text-slate-500">Production readiness</dt>
                <dd className="text-slate-200">{linkedAsset.readinessStatus ?? linkedAsset.status ?? "—"}</dd>
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
            Approved/active Library records are trusted context. Draft or candidate records stay labeled; Swipe File is inspiration-only.
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
              <p className="p-3 text-xs text-slate-500">No copy runs yet. Select a launch packet and run a dry test.</p>
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
                    {r.safetyMode ? <StatusBadge tone="amber">{formatSafetyMode(String(r.safetyMode))}</StatusBadge> : null}
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
            <p className="mt-3 text-xs text-slate-500">Select a run to inspect draft output.</p>
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

      <ControlPanel className="p-3">
        <div className="flex items-center gap-2">
          <ShieldAlert className="h-4 w-4 text-amber-300" />
          <p className="text-sm font-semibold text-slate-100">Safety and approvals</p>
        </div>
        <p className="mt-2 text-xs leading-relaxed text-slate-400">
          Copy Intelligence creates draft copy, suggestions, and review notes only. Humans approve final public-facing copy. Nothing auto-sends, posts, publishes, or
          overwrites launch packet fields. Run labels include Read-only, Draft-only, Review assist, and Learning candidate — all human approval gated.
        </p>
      </ControlPanel>
    </div>
  );
}
