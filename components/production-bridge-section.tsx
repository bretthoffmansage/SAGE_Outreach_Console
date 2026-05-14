"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";
import { Button, ConsoleTable, ControlPanel, SectionHeader, StatusBadge, Td, Th, TableHead } from "@/components/ui";
import Link from "next/link";

type ProductionAssetRecord = Doc<"productionAssets">;
type SyncJobRecord = Doc<"productionBridgeSyncJobs">;

function formatTs(value?: number) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(value);
}

function IntegrationStyleCard({
  name,
  status,
  mode,
  lastChecked,
  lastSynced,
  setup,
  safety,
  workflows,
}: {
  name: string;
  status: string;
  mode: string;
  lastChecked: string;
  lastSynced: string;
  setup: string;
  safety: string;
  workflows: string;
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/50 px-3 py-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="text-sm font-semibold text-slate-100">{name}</p>
        <StatusBadge tone="blue">{status}</StatusBadge>
      </div>
      <dl className="mt-2 grid grid-cols-2 gap-x-2 gap-y-1 text-[0.65rem] leading-snug text-slate-500">
        <dt className="text-slate-600">Mode</dt>
        <dd className="text-slate-300">{mode}</dd>
        <dt className="text-slate-600">Last checked</dt>
        <dd className="text-slate-300">{lastChecked}</dd>
        <dt className="text-slate-600">Last synced</dt>
        <dd className="text-slate-300">{lastSynced}</dd>
        <dt className="text-slate-600">Required setup</dt>
        <dd className="text-slate-300">{setup}</dd>
        <dt className="text-slate-600">Safety level</dt>
        <dd className="text-slate-300">{safety}</dd>
        <dt className="col-span-2 text-slate-600">Related workflows</dt>
        <dd className="col-span-2 text-slate-300">{workflows}</dd>
      </dl>
    </div>
  );
}

export function ProductionBridgeSection() {
  const assets = useQuery(api.productionAssets.listProductionAssets, { limit: 200 });
  const syncJobs = useQuery(api.productionBridge.listSyncJobs, { limit: 15 });
  const seedDemo = useMutation(api.productionAssets.seedDefaultProductionAssetsIfEmpty);
  const upsertAsset = useMutation(api.productionAssets.upsertProductionAsset);
  const createSyncJob = useMutation(api.productionBridge.createManualSyncJob);

  const [seedMsg, setSeedMsg] = useState<string | null>(null);
  const [manualOpen, setManualOpen] = useState(false);
  const [manual, setManual] = useState({
    title: "",
    workingTitle: "",
    assetType: "full_video",
    status: "draft",
    readinessStatus: "unknown",
    productionStage: "",
    publishingStage: "",
    sourceUrl: "",
    productionHubUrl: "",
    frameIoUrl: "",
    muxPlaybackId: "",
    transcriptStatus: "",
    thumbnailStatus: "",
    shortsCount: "",
    readyShortsCount: "",
    creativeOwner: "",
    notes: "",
    tags: "",
  });

  useEffect(() => {
    if (assets === undefined || assets.length > 0) return;
    void seedDemo()
      .then((r) => setSeedMsg(r.message))
      .catch(() => setSeedMsg("Could not seed demo assets."));
  }, [assets, seedDemo]);

  const stats = useMemo(() => {
    const list = (assets ?? []) as ProductionAssetRecord[];
    const fullVideos = list.filter((a) => a.assetType === "full_video");
    return {
      total: list.length,
      readyFull: fullVideos.filter((a) => a.status === "ready" || a.readinessStatus === "ready_for_campaign").length,
      withTranscript: list.filter((a) => ["available", "imported", "approved"].includes(a.transcriptStatus ?? "")).length,
      withThumb: list.filter((a) => ["ready", "approved"].includes(a.thumbnailStatus ?? "")).length,
      readyShorts: list.filter((a) => (a.readyShortsCount ?? 0) > 0).length,
      lastSync: list.reduce((m, a) => Math.max(m, a.lastSyncedAt ?? a.updatedAt ?? 0), 0),
    };
  }, [assets]);

  const saveManual = async () => {
    const sc = parseInt(manual.shortsCount, 10);
    const rc = parseInt(manual.readyShortsCount, 10);
    await upsertAsset({
      patch: {
        title: manual.title.trim() || "Untitled asset",
        workingTitle: manual.workingTitle.trim() || undefined,
        assetType: manual.assetType.trim() || "other",
        status: manual.status.trim() || "unknown",
        readinessStatus: manual.readinessStatus.trim() || undefined,
        productionStage: manual.productionStage.trim() || undefined,
        publishingStage: manual.publishingStage.trim() || undefined,
        sourceSystem: "manual",
        sourceUrl: manual.sourceUrl.trim() || undefined,
        productionHubUrl: manual.productionHubUrl.trim() || undefined,
        frameIoUrl: manual.frameIoUrl.trim() || undefined,
        muxPlaybackId: manual.muxPlaybackId.trim() || undefined,
        transcriptStatus: manual.transcriptStatus.trim() || undefined,
        thumbnailStatus: manual.thumbnailStatus.trim() || undefined,
        shortsCount: Number.isFinite(sc) ? sc : undefined,
        readyShortsCount: Number.isFinite(rc) ? rc : undefined,
        creativeOwner: manual.creativeOwner.trim() || undefined,
        notes: manual.notes.trim() || undefined,
        tags: manual.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        lastSyncedAt: Date.now(),
      },
    });
    setManualOpen(false);
  };

  const runDemoSync = async () => {
    await createSyncJob({ sourceSystem: "demo", direction: "refresh", mode: "dry_run" });
  };

  return (
    <div className="space-y-5">
      <SectionHeader
        eyebrow="Operations"
        title="Production Bridge"
        description="Reference source assets from Sage Production Hub, Frame.io, and future Mux storage without merging production and outreach systems."
        actions={
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => void seedDemo().then((r) => setSeedMsg(r.message))}>
              <Button variant="secondary">Seed demo cache</Button>
            </button>
            <button type="button" onClick={() => void runDemoSync()}>
              <Button variant="secondary">Log manual sync job</Button>
            </button>
          </div>
        }
      />
      {seedMsg ? <ControlPanel className="border-sky-500/30 bg-sky-500/10 p-3 text-sm text-sky-100">{seedMsg}</ControlPanel> : null}

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <IntegrationStyleCard
          name="Sage Production Hub"
          status="Not connected"
          mode="Read-only planned"
          lastChecked="—"
          lastSynced="—"
          setup="Production Hub API credentials (future)"
          safety="Read-only"
          workflows="Weekly launch packets, asset readiness, heartbeat"
        />
        <IntegrationStyleCard
          name="Frame.io"
          status="Not connected"
          mode="Manual cache"
          lastChecked="—"
          lastSynced="—"
          setup="OAuth / project mapping (future)"
          safety="Manual only"
          workflows="Review links on cached assets"
        />
        <IntegrationStyleCard
          name="Mux"
          status="Not connected"
          mode="Future active sync"
          lastChecked="—"
          lastSynced="—"
          setup="Mux token + environment (future)"
          safety="Draft/reference only"
          workflows="Playback IDs on cached assets"
        />
        <IntegrationStyleCard
          name="Production Bridge Cache"
          status={stats.total ? "Manual cache" : "Empty"}
          mode="Manual cache"
          lastChecked={formatTs(Date.now())}
          lastSynced={stats.lastSync ? formatTs(stats.lastSync) : "—"}
          setup="Seed demo or add manual rows"
          safety="Reference only"
          workflows="Campaign create/detail selectors, heartbeat"
        />
      </section>

      <ControlPanel className="p-4">
        <p className="text-sm font-semibold text-slate-100">Production Bridge Cache</p>
        <p className="mt-1 text-xs text-slate-500">Marketing-facing reference counts. Production Hub remains authoritative for files and lifecycle.</p>
        <dl className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3 text-xs text-slate-300">
          <div className="rounded-lg border border-slate-800 bg-slate-950/50 px-2 py-2">
            <dt className="text-slate-500">Total cached assets</dt>
            <dd className="text-lg font-semibold text-slate-100">{stats.total}</dd>
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-950/50 px-2 py-2">
            <dt className="text-slate-500">Ready full videos</dt>
            <dd className="text-lg font-semibold text-slate-100">{stats.readyFull}</dd>
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-950/50 px-2 py-2">
            <dt className="text-slate-500">With transcripts</dt>
            <dd className="text-lg font-semibold text-slate-100">{stats.withTranscript}</dd>
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-950/50 px-2 py-2">
            <dt className="text-slate-500">With thumbnails</dt>
            <dd className="text-lg font-semibold text-slate-100">{stats.withThumb}</dd>
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-950/50 px-2 py-2">
            <dt className="text-slate-500">Assets with ready shorts</dt>
            <dd className="text-lg font-semibold text-slate-100">{stats.readyShorts}</dd>
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-950/50 px-2 py-2">
            <dt className="text-slate-500">Recent sync jobs</dt>
            <dd className="text-lg font-semibold text-slate-100">{(syncJobs ?? []).length}</dd>
          </div>
        </dl>
      </ControlPanel>

      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => setManualOpen((v) => !v)}>
          <Button>{manualOpen ? "Close manual asset form" : "Add manual asset"}</Button>
        </button>
        <Link href="/campaigns/new">
          <Button variant="secondary">
            Create launch packet
          </Button>
        </Link>
      </div>

      {manualOpen ? (
        <ControlPanel className="p-4">
          <p className="text-sm font-semibold text-slate-100">Manual cached asset</p>
          <p className="mt-1 text-xs text-amber-200/90">
            This record is an Outreach Console reference. Editing it does not modify Production Hub, Frame.io, or Mux.
          </p>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {(
              [
                ["title", "Title"],
                ["workingTitle", "Working title"],
                ["assetType", "Asset type"],
                ["status", "Status"],
                ["readinessStatus", "Readiness status"],
                ["productionStage", "Production stage"],
                ["publishingStage", "Publishing stage"],
                ["sourceUrl", "Source URL"],
                ["productionHubUrl", "Production Hub URL"],
                ["frameIoUrl", "Frame.io URL"],
                ["muxPlaybackId", "Mux playback ID"],
                ["transcriptStatus", "Transcript status"],
                ["thumbnailStatus", "Thumbnail status"],
                ["shortsCount", "Shorts count"],
                ["readyShortsCount", "Ready shorts count"],
                ["creativeOwner", "Creative owner"],
              ] as const
            ).map(([key, label]) => (
              <label key={key} className="grid gap-1 text-xs text-slate-400">
                {label}
                <input
                  className="rounded-md border border-slate-700 bg-slate-950/90 px-2 py-1.5 text-slate-100"
                  value={manual[key]}
                  onChange={(e) => setManual((m) => ({ ...m, [key]: e.target.value }))}
                />
              </label>
            ))}
            <label className="grid gap-1 text-xs text-slate-400 md:col-span-2">
              Notes
              <textarea
                className="min-h-[4rem] rounded-md border border-slate-700 bg-slate-950/90 px-2 py-1.5 text-slate-100"
                value={manual.notes}
                onChange={(e) => setManual((m) => ({ ...m, notes: e.target.value }))}
              />
            </label>
            <label className="grid gap-1 text-xs text-slate-400 md:col-span-2">
              Tags (comma-separated)
              <input
                className="rounded-md border border-slate-700 bg-slate-950/90 px-2 py-1.5 text-slate-100"
                value={manual.tags}
                onChange={(e) => setManual((m) => ({ ...m, tags: e.target.value }))}
              />
            </label>
          </div>
          <div className="mt-3">
            <button type="button" onClick={() => void saveManual()}>
              <Button>Save to cache</Button>
            </button>
          </div>
        </ControlPanel>
      ) : null}

      <ControlPanel className="p-4">
        <p className="text-sm font-semibold text-slate-100">Cached production assets</p>
        <p className="mt-1 text-xs text-slate-500">Read-only browse. Link assets to launch packets from Campaign Create or Campaign Detail.</p>
        <ConsoleTable className="mt-3">
          <TableHead>
            <tr>
              <Th>Title</Th>
              <Th>Type</Th>
              <Th>Readiness</Th>
              <Th>Source</Th>
              <Th>Linked campaigns</Th>
            </tr>
          </TableHead>
          <tbody>
            {(assets ?? []).length ? (
              ((assets ?? []) as ProductionAssetRecord[]).map((a) => (
                <tr key={a._id}>
                  <Td className="max-w-[200px] truncate">{a.title}</Td>
                  <Td>{a.assetType}</Td>
                  <Td>{a.readinessStatus ?? a.status}</Td>
                  <Td>{a.sourceSystem}</Td>
                  <Td>{(a.linkedCampaignIds ?? []).length}</Td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="border-t border-slate-800 px-4 py-3 text-slate-500" colSpan={5}>
                  No production assets cached yet.
                </td>
              </tr>
            )}
          </tbody>
        </ConsoleTable>
      </ControlPanel>

      <ControlPanel className="p-4">
        <p className="text-sm font-semibold text-slate-100">Recent sync / import jobs</p>
        <ConsoleTable className="mt-2">
          <TableHead>
            <tr>
              <Th>Job</Th>
              <Th>Source</Th>
              <Th>Status</Th>
              <Th>Mode</Th>
              <Th>Completed</Th>
            </tr>
          </TableHead>
          <tbody>
            {(syncJobs ?? []).length ? (
              (syncJobs as SyncJobRecord[]).map((job) => (
                <tr key={job._id}>
                  <Td className="font-mono text-[0.7rem]">{job.syncJobId}</Td>
                  <Td>{job.sourceSystem}</Td>
                  <Td>{job.status}</Td>
                  <Td>{job.mode}</Td>
                  <Td>{formatTs(job.completedAt)}</Td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="border-t border-slate-800 px-4 py-3 text-slate-500" colSpan={5}>
                  No sync jobs logged yet. Use “Log manual sync job” for a placeholder entry.
                </td>
              </tr>
            )}
          </tbody>
        </ConsoleTable>
      </ControlPanel>
    </div>
  );
}
