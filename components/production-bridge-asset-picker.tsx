"use client";

import { useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";
import { Button, ControlPanel, StatusBadge } from "@/components/ui";
import { cn } from "@/lib/utils";

export type ProductionAssetDoc = Doc<"productionAssets">;

function formatShort(ts?: number) {
  if (!ts) return "—";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(ts);
}

function labelize(s: string | undefined) {
  if (!s?.trim()) return "—";
  return s.replace(/_/g, " ");
}

export function ProductionBridgeAssetPicker({
  className,
  onSelect,
  showFilters = true,
}: {
  className?: string;
  onSelect: (asset: ProductionAssetDoc) => void;
  showFilters?: boolean;
}) {
  const [search, setSearch] = useState("");
  const [assetType, setAssetType] = useState("");
  const [readinessStatus, setReadinessStatus] = useState("");
  const [hasTranscript, setHasTranscript] = useState(false);
  const [hasShorts, setHasShorts] = useState(false);
  const [onlyUnlinked, setOnlyUnlinked] = useState(false);

  const rows = useQuery(api.productionAssets.listProductionAssets, {
    search: search.trim() || undefined,
    assetType: assetType || undefined,
    readinessStatus: readinessStatus || undefined,
    limit: 60,
    hasTranscript: hasTranscript || undefined,
    hasShorts: hasShorts || undefined,
    onlyUnlinked: onlyUnlinked || undefined,
  });

  const staleMs = 14 * 24 * 60 * 60 * 1000;
  const now = Date.now();

  const body = useMemo(() => {
    if (rows === undefined) {
      return <p className="text-sm text-slate-400">Loading production assets…</p>;
    }
    if (!rows.length) {
      return (
        <p className="text-sm text-slate-400">
          No production assets cached yet. Add a manual source asset or seed demo data from Operations → Production Bridge.
        </p>
      );
    }
    return (
      <div className="max-h-[340px] space-y-2 overflow-y-auto pr-1">
        {rows.map((asset) => {
          const stale = typeof asset.lastSyncedAt === "number" && now - asset.lastSyncedAt > staleMs;
          return (
            <div
              key={asset._id}
              className="flex flex-col gap-2 rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2 text-xs text-slate-300 md:flex-row md:items-center md:justify-between"
            >
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate font-semibold text-slate-100">{asset.title}</p>
                  {stale ? (
                    <StatusBadge tone="amber">Stale cache</StatusBadge>
                  ) : null}
                </div>
                <div className="flex flex-wrap gap-x-3 gap-y-1 text-[0.7rem] text-slate-500">
                  <span>Type: {labelize(asset.assetType)}</span>
                  <span>Readiness: {labelize(asset.readinessStatus ?? asset.status)}</span>
                  <span>Transcript: {labelize(asset.transcriptStatus)}</span>
                  <span>Thumb: {labelize(asset.thumbnailStatus)}</span>
                  <span>
                    Shorts: {asset.readyShortsCount ?? 0}/{asset.shortsCount ?? 0}
                  </span>
                  <span>Source: {labelize(asset.sourceSystem)}</span>
                  <span>Updated: {formatShort(asset.lastSyncedAt ?? asset.updatedAt)}</span>
                </div>
                {asset.frameIoUrl ? (
                  <a className="text-[0.7rem] text-sky-400 underline" href={asset.frameIoUrl} rel="noreferrer" target="_blank">
                    Frame.io
                  </a>
                ) : null}
              </div>
              <button type="button" onClick={() => onSelect(asset)}>
                <Button className="shrink-0" variant="secondary">
                  Select
                </Button>
              </button>
            </div>
          );
        })}
      </div>
    );
  }, [rows, now, staleMs, onSelect]);

  return (
    <ControlPanel className={cn("p-4", className)}>
      <p className="text-sm font-semibold text-slate-100">Select from Production Hub</p>
      <p className="mt-1 text-xs leading-5 text-slate-400">
        Choose a production asset to use as the source for this launch packet. Outreach Console stores a marketing-facing reference while Production Hub
        remains the production source of truth.
      </p>
      {showFilters ? (
        <div className="mt-3 grid gap-2 border-t border-slate-800 pt-3 md:grid-cols-2 lg:grid-cols-3">
          <label className="grid gap-1 text-xs text-slate-400">
            Search title / tags
            <input
              className="rounded-md border border-slate-700 bg-slate-950/90 px-2 py-1.5 text-slate-100"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search…"
            />
          </label>
          <label className="grid gap-1 text-xs text-slate-400">
            Asset type
            <select
              className="rounded-md border border-slate-700 bg-slate-950/90 px-2 py-1.5 text-slate-100"
              value={assetType}
              onChange={(e) => setAssetType(e.target.value)}
            >
              <option value="">Any</option>
              <option value="full_video">Full video</option>
              <option value="short">Short</option>
              <option value="reel">Reel</option>
              <option value="thumbnail">Thumbnail</option>
              <option value="transcript">Transcript</option>
              <option value="other">Other</option>
            </select>
          </label>
          <label className="grid gap-1 text-xs text-slate-400">
            Readiness
            <select
              className="rounded-md border border-slate-700 bg-slate-950/90 px-2 py-1.5 text-slate-100"
              value={readinessStatus}
              onChange={(e) => setReadinessStatus(e.target.value)}
            >
              <option value="">Any</option>
              <option value="ready_for_campaign">Ready for campaign</option>
              <option value="ready_for_publish">Ready for publish</option>
              <option value="needs_review">Needs review</option>
              <option value="not_ready">Not ready</option>
            </select>
          </label>
          <label className="flex items-center gap-2 text-xs text-slate-400">
            <input type="checkbox" checked={hasTranscript} onChange={(e) => setHasTranscript(e.target.checked)} />
            Has transcript
          </label>
          <label className="flex items-center gap-2 text-xs text-slate-400">
            <input type="checkbox" checked={hasShorts} onChange={(e) => setHasShorts(e.target.checked)} />
            Has shorts
          </label>
          <label className="flex items-center gap-2 text-xs text-slate-400">
            <input type="checkbox" checked={onlyUnlinked} onChange={(e) => setOnlyUnlinked(e.target.checked)} />
            Not linked to campaign
          </label>
        </div>
      ) : null}
      <div className="mt-3">{body}</div>
    </ControlPanel>
  );
}

export function applyProductionAssetToFormFields(asset: ProductionAssetDoc) {
  const relatedShortsNotes = [
    asset.shortsCount != null || asset.readyShortsCount != null
      ? `Shorts ready: ${asset.readyShortsCount ?? 0} / ${asset.shortsCount ?? 0}.`
      : "",
    asset.relatedShortIds?.length ? `Related: ${asset.relatedShortIds.join(", ")}.` : "",
  ]
    .filter(Boolean)
    .join(" ");

  return {
    sourceProductionAssetId: asset.productionAssetId,
    sourceProductionAssetTitle: asset.title,
    sourceProductionAssetUrl: asset.sourceUrl?.trim() || asset.productionHubUrl?.trim() || "",
    frameIoUrl: asset.frameIoUrl?.trim() || "",
    muxPlaybackId: asset.muxPlaybackId?.trim() || "",
    transcriptStatus: asset.transcriptStatus?.trim() || "",
    thumbnailStatus: asset.thumbnailStatus?.trim() || "",
    assetReadinessStatus: asset.readinessStatus?.trim() || "",
    relatedShortsNotes: relatedShortsNotes.trim(),
    productionNotes: asset.notes?.trim() || "",
    creativeOwner: asset.creativeOwner?.trim() || "",
  };
}
