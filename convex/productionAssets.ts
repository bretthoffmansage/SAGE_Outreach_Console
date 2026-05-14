import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const assetPatchFields = {
  externalAssetId: v.optional(v.string()),
  title: v.optional(v.string()),
  workingTitle: v.optional(v.string()),
  assetType: v.optional(v.string()),
  status: v.optional(v.string()),
  readinessStatus: v.optional(v.string()),
  productionStage: v.optional(v.string()),
  publishingStage: v.optional(v.string()),
  sourceSystem: v.optional(v.string()),
  sourceUrl: v.optional(v.string()),
  productionHubUrl: v.optional(v.string()),
  frameIoUrl: v.optional(v.string()),
  frameIoProjectId: v.optional(v.string()),
  frameIoFolderId: v.optional(v.string()),
  frameIoAssetId: v.optional(v.string()),
  muxPlaybackId: v.optional(v.string()),
  muxAssetId: v.optional(v.string()),
  muxStatus: v.optional(v.string()),
  transcriptStatus: v.optional(v.string()),
  transcriptText: v.optional(v.string()),
  transcriptSummary: v.optional(v.string()),
  thumbnailStatus: v.optional(v.string()),
  thumbnailUrl: v.optional(v.string()),
  relatedAssetIds: v.optional(v.array(v.string())),
  relatedShortIds: v.optional(v.array(v.string())),
  relatedFullVideoId: v.optional(v.string()),
  shortsCount: v.optional(v.number()),
  readyShortsCount: v.optional(v.number()),
  owner: v.optional(v.string()),
  creativeOwner: v.optional(v.string()),
  notes: v.optional(v.string()),
  tags: v.optional(v.array(v.string())),
  linkedCampaignIds: v.optional(v.array(v.string())),
  rawJson: v.optional(v.string()),
  lastSyncedAt: v.optional(v.number()),
};

function nz(s: string | undefined) {
  return (s ?? "").trim();
}

function relatedShortsNotesFromAsset(asset: {
  shortsCount?: number;
  readyShortsCount?: number;
  relatedShortIds?: string[];
}) {
  const parts: string[] = [];
  if (asset.shortsCount != null || asset.readyShortsCount != null) {
    parts.push(`Shorts ready: ${asset.readyShortsCount ?? 0} / ${asset.shortsCount ?? 0}.`);
  }
  if (asset.relatedShortIds?.length) {
    parts.push(`Related short IDs: ${asset.relatedShortIds.join(", ")}.`);
  }
  const s = parts.join(" ").trim();
  return s.length ? s : undefined;
}

function campaignSnapshotFromAsset(asset: Record<string, unknown>) {
  const title = typeof asset.title === "string" ? asset.title : "";
  const sourceUrl = typeof asset.sourceUrl === "string" ? asset.sourceUrl : undefined;
  const hubUrl = typeof asset.productionHubUrl === "string" ? asset.productionHubUrl : undefined;
  return {
    sourceProductionAssetId: asset.productionAssetId as string,
    sourceProductionAssetTitle: title,
    sourceProductionAssetUrl: sourceUrl ?? hubUrl,
    frameIoUrl: typeof asset.frameIoUrl === "string" ? asset.frameIoUrl : undefined,
    muxPlaybackId: typeof asset.muxPlaybackId === "string" ? asset.muxPlaybackId : undefined,
    transcriptStatus: typeof asset.transcriptStatus === "string" ? asset.transcriptStatus : undefined,
    thumbnailStatus: typeof asset.thumbnailStatus === "string" ? asset.thumbnailStatus : undefined,
    assetReadinessStatus: typeof asset.readinessStatus === "string" ? asset.readinessStatus : undefined,
    relatedShortsNotes: relatedShortsNotesFromAsset({
      shortsCount: asset.shortsCount as number | undefined,
      readyShortsCount: asset.readyShortsCount as number | undefined,
      relatedShortIds: asset.relatedShortIds as string[] | undefined,
    }),
    productionNotes: typeof asset.notes === "string" ? asset.notes : undefined,
  };
}

const DEMO_ASSETS: Array<Record<string, unknown>> = [
  {
    productionAssetId: "prod_asset_2026_05_virtual_events_still_a_thing",
    title: "Are Virtual Events Still a Thing?",
    assetType: "full_video",
    status: "ready",
    readinessStatus: "ready_for_campaign",
    productionStage: "approved",
    publishingStage: "copy_needed",
    sourceSystem: "demo",
    sourceUrl: "https://example.com/production/virtual-events-still-a-thing",
    productionHubUrl: "https://example.com/hub/assets/virtual-events-still-a-thing",
    frameIoUrl: "https://frame.io/folders/demo-virtual-events-still-a-thing",
    transcriptStatus: "available",
    thumbnailStatus: "ready",
    shortsCount: 3,
    readyShortsCount: 1,
    creativeOwner: "Brandon",
    notes: "First weekly launch source video. Reels are in progress with Brandon.",
    tags: ["virtual-events", "youtube", "full-video", "launch-candidate"],
    relatedShortIds: [
      "prod_asset_2026_05_net_profit_clip",
      "prod_asset_2026_05_virtual_events_teaser_c",
      "prod_asset_2026_05_hotel_cost_short",
    ],
    muxStatus: "not_connected",
  },
  {
    productionAssetId: "prod_asset_2026_05_virtual_events_vs_costs",
    title: "Virtual Events vs In-Person Event Costs",
    assetType: "full_video",
    status: "review",
    readinessStatus: "needs_review",
    productionStage: "review",
    publishingStage: "not_started",
    sourceSystem: "demo",
    frameIoUrl: "https://frame.io/folders/demo-virtual-events-vs-costs",
    transcriptStatus: "available",
    thumbnailStatus: "draft",
    shortsCount: 2,
    readyShortsCount: 0,
    creativeOwner: "Brandon",
    tags: ["event-costs", "virtual-events", "content-candidate"],
    muxStatus: "not_uploaded",
  },
  {
    productionAssetId: "prod_asset_2026_05_net_profit_clip",
    title: "Net Profit Beats Gross Revenue Clip",
    assetType: "reel",
    status: "in_progress",
    readinessStatus: "not_ready",
    relatedFullVideoId: "prod_asset_2026_05_virtual_events_still_a_thing",
    sourceSystem: "demo",
    transcriptStatus: "not_required",
    thumbnailStatus: "not_required",
    tags: ["reel", "net-profit", "short-form"],
    muxStatus: "unknown",
  },
  {
    productionAssetId: "prod_asset_2026_05_hotel_cost_short",
    title: "Hotel Cost Pain Point Short",
    assetType: "short",
    status: "ready",
    readinessStatus: "ready_for_publish",
    relatedFullVideoId: "prod_asset_2026_05_virtual_events_vs_costs",
    sourceSystem: "demo",
    frameIoUrl: "https://frame.io/folders/demo-hotel-cost-short",
    tags: ["short", "hotel-costs", "short-form"],
    muxStatus: "unknown",
  },
  {
    productionAssetId: "prod_asset_2026_05_september_reg_thumbnail",
    title: "September Event Registration Thumbnail",
    assetType: "thumbnail",
    status: "ready",
    readinessStatus: "ready_for_publish",
    thumbnailStatus: "approved",
    sourceSystem: "demo",
    thumbnailUrl: "https://example.com/thumbs/september-registration.png",
    tags: ["thumbnail", "registration", "event-campaign"],
    muxStatus: "not_required",
  },
  {
    productionAssetId: "prod_asset_2026_05_virtual_events_teaser_c",
    title: "Virtual Events Teaser Short C",
    assetType: "short",
    status: "in_progress",
    readinessStatus: "not_ready",
    relatedFullVideoId: "prod_asset_2026_05_virtual_events_still_a_thing",
    sourceSystem: "demo",
    tags: ["short-form", "virtual-events", "teaser"],
    muxStatus: "unknown",
  },
];

export const listProductionAssets = query({
  args: {
    assetType: v.optional(v.string()),
    readinessStatus: v.optional(v.string()),
    status: v.optional(v.string()),
    search: v.optional(v.string()),
    limit: v.optional(v.number()),
    onlyReady: v.optional(v.boolean()),
    onlyUnlinked: v.optional(v.boolean()),
    sourceSystem: v.optional(v.string()),
    hasTranscript: v.optional(v.boolean()),
    hasShorts: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(Math.max(args.limit ?? 80, 1), 200);
    let rows = await ctx.db.query("productionAssets").collect();
    rows.sort((a, b) => b.updatedAt - a.updatedAt);

    const q = nz(args.search).toLowerCase();
    if (q) {
      rows = rows.filter((r) => {
        const inTitle = r.title.toLowerCase().includes(q);
        const inTags = (r.tags ?? []).some((t) => t.toLowerCase().includes(q));
        return inTitle || inTags;
      });
    }
    if (args.assetType) rows = rows.filter((r) => r.assetType === args.assetType);
    if (args.readinessStatus) rows = rows.filter((r) => r.readinessStatus === args.readinessStatus);
    if (args.status) rows = rows.filter((r) => r.status === args.status);
    if (args.sourceSystem) rows = rows.filter((r) => r.sourceSystem === args.sourceSystem);
    if (args.onlyReady) {
      rows = rows.filter((r) => r.status === "ready" || r.status === "approved" || r.readinessStatus === "ready_for_campaign" || r.readinessStatus === "ready_for_publish");
    }
    if (args.onlyUnlinked) {
      rows = rows.filter((r) => !(r.linkedCampaignIds ?? []).length);
    }
    if (args.hasTranscript) {
      rows = rows.filter((r) => ["available", "imported", "approved"].includes(r.transcriptStatus ?? ""));
    }
    if (args.hasShorts) {
      rows = rows.filter((r) => (r.shortsCount ?? 0) > 0 || (r.relatedShortIds?.length ?? 0) > 0);
    }

    return rows.slice(0, limit);
  },
});

export const getProductionAsset = query({
  args: { productionAssetId: v.string() },
  handler: async (ctx, args) => {
    const row = await ctx.db
      .query("productionAssets")
      .withIndex("by_production_asset_id", (q) => q.eq("productionAssetId", args.productionAssetId))
      .unique();
    return row ?? null;
  },
});

export const upsertProductionAsset = mutation({
  args: {
    productionAssetId: v.optional(v.string()),
    patch: v.object(assetPatchFields),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const id = nz(args.productionAssetId) || `prod_asset_${now}_${Math.random().toString(36).slice(2, 8)}`;

    const existing = await ctx.db
      .query("productionAssets")
      .withIndex("by_production_asset_id", (q) => q.eq("productionAssetId", id))
      .unique();

    const patch = Object.fromEntries(
      Object.entries(args.patch).filter(([, val]) => val !== undefined),
    ) as Record<string, unknown>;

    if (existing?._id) {
      const next: Record<string, unknown> = { ...patch, productionAssetId: id, updatedAt: now };
      if (!nz(next.title as string | undefined)) delete next.title;
      if (!nz(next.assetType as string | undefined)) delete next.assetType;
      if (!nz(next.status as string | undefined)) delete next.status;
      if (!nz(next.sourceSystem as string | undefined)) delete next.sourceSystem;
      await ctx.db.patch(existing._id, next as never);
      return { productionAssetId: id, updated: true };
    }

    const title = nz(patch.title as string | undefined) || "Untitled asset";
    const assetType = nz(patch.assetType as string | undefined) || "other";
    const status = nz(patch.status as string | undefined) || "unknown";
    const sourceSystem = nz(patch.sourceSystem as string | undefined) || "manual";

    const insertDoc = {
      ...patch,
      productionAssetId: id,
      title,
      assetType,
      status,
      sourceSystem,
      linkedCampaignIds: Array.isArray(patch.linkedCampaignIds) ? patch.linkedCampaignIds : [],
      createdAt: now,
      updatedAt: now,
    };
    await ctx.db.insert("productionAssets", insertDoc as never);
    return { productionAssetId: id, updated: false };
  },
});

export const linkAssetToCampaign = mutation({
  args: {
    productionAssetId: v.string(),
    campaignId: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const asset = await ctx.db
      .query("productionAssets")
      .withIndex("by_production_asset_id", (q) => q.eq("productionAssetId", args.productionAssetId))
      .unique();
    if (!asset) throw new Error("Production asset not found.");

    const campaign = await ctx.db
      .query("campaigns")
      .withIndex("by_campaign_id", (q) => q.eq("campaignId", args.campaignId))
      .unique();
    if (!campaign) throw new Error("Campaign not found.");

    const snap = campaignSnapshotFromAsset(asset as Record<string, unknown>);
    await ctx.db.patch(campaign._id, {
      ...snap,
      updatedAt: now,
      lastActivityAt: now,
    } as never);

    const links = new Set(asset.linkedCampaignIds ?? []);
    links.add(args.campaignId);
    await ctx.db.patch(asset._id, {
      linkedCampaignIds: [...links],
      updatedAt: now,
    } as never);

    return { ok: true };
  },
});

export const seedDefaultProductionAssetsIfEmpty = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("productionAssets").collect();
    if (existing.length > 0) return { seeded: 0, message: "Cache already has assets." };

    const now = Date.now();
    for (const row of DEMO_ASSETS) {
      await ctx.db.insert("productionAssets", {
        ...row,
        linkedCampaignIds: [],
        lastSyncedAt: now,
        createdAt: now,
        updatedAt: now,
      } as never);
    }
    return { seeded: DEMO_ASSETS.length, message: "Demo production assets seeded." };
  },
});
