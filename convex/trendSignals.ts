import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { DEMO_TREND_SIGNALS, DEMO_META_TREND_SIGNALS, type TrendSignalSeed } from "../lib/trend-intelligence-seed";

const TREND_PATCH_KEYS = new Set([
  "title",
  "summary",
  "platform",
  "trendType",
  "status",
  "sourceSystem",
  "sourceUrl",
  "sourceLabel",
  "observedAt",
  "expiresAt",
  "timeliness",
  "relevanceScore",
  "brandFitScore",
  "audienceFitScore",
  "riskScore",
  "effortLevel",
  "confidence",
  "tags",
  "relatedCampaignIds",
  "relatedLibraryItemIds",
  "relatedProductionAssetIds",
  "suggestedUses",
  "adaptationIdeas",
  "hookIdeas",
  "captionIdeas",
  "memeIdeas",
  "creativeBriefNotes",
  "platformNotes",
  "riskNotes",
  "approvalNotes",
  "reviewedBy",
  "reviewedAt",
  "usedAt",
  "archivedAt",
  "performanceNotes",
  "rawJson",
]);

function stripPatch(patch: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  for (const [k, val] of Object.entries(patch)) {
    if (TREND_PATCH_KEYS.has(k)) out[k] = val;
  }
  return out;
}

function stripSystemFields<T extends Record<string, unknown>>(record: T | null | undefined) {
  if (!record) return {};
  const rest = { ...(record as T & { _id?: unknown; _creationTime?: unknown }) };
  delete rest._id;
  delete rest._creationTime;
  return rest;
}

export function buildTrendRowFromSeed(seed: TrendSignalSeed, baseTime: number, index: number) {
  const now = baseTime + index * 50;
  return {
    trendId: seed.trendId,
    title: seed.title,
    platform: seed.platform,
    status: seed.status,
    sourceSystem: seed.sourceSystem,
    createdAt: now,
    updatedAt: now,
    summary: seed.summary,
    trendType: seed.trendType,
    sourceUrl: seed.sourceUrl,
    sourceLabel: seed.sourceLabel,
    observedAt: seed.observedAt,
    timeliness: seed.timeliness,
    relevanceScore: seed.relevanceScore,
    brandFitScore: seed.brandFitScore,
    audienceFitScore: seed.audienceFitScore,
    riskScore: seed.riskScore,
    effortLevel: seed.effortLevel,
    confidence: seed.confidence,
    tags: seed.tags,
    relatedCampaignIds: seed.relatedCampaignIds ?? [],
    suggestedUses: seed.suggestedUses ?? [],
    adaptationIdeas: seed.adaptationIdeas ?? [],
    hookIdeas: seed.hookIdeas ?? [],
    captionIdeas: seed.captionIdeas ?? [],
    memeIdeas: seed.memeIdeas ?? [],
    creativeBriefNotes: seed.creativeBriefNotes,
    platformNotes: seed.platformNotes,
    riskNotes: seed.riskNotes,
  };
}

export const listTrendSignals = query({
  args: {
    platform: v.optional(v.string()),
    status: v.optional(v.string()),
    trendType: v.optional(v.string()),
    search: v.optional(v.string()),
    tag: v.optional(v.string()),
    campaignId: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(Math.max(args.limit ?? 120, 1), 300);
    let rows = await ctx.db.query("trendSignals").collect();

    if (args.platform) rows = rows.filter((r) => r.platform === args.platform);
    if (args.status) rows = rows.filter((r) => r.status === args.status);
    if (args.trendType) rows = rows.filter((r) => r.trendType === args.trendType);
    if (args.campaignId) {
      rows = rows.filter((r) => (r.relatedCampaignIds ?? []).includes(args.campaignId!));
    }
    if (args.tag?.trim()) {
      const t = args.tag.trim().toLowerCase();
      rows = rows.filter((r) => (r.tags ?? []).some((tag) => tag.toLowerCase().includes(t)));
    }
    if (args.search?.trim()) {
      const s = args.search.trim().toLowerCase();
      rows = rows.filter(
        (r) =>
          r.title.toLowerCase().includes(s) ||
          (r.summary ?? "").toLowerCase().includes(s) ||
          (r.trendId ?? "").toLowerCase().includes(s),
      );
    }

    rows.sort((a, b) => b.updatedAt - a.updatedAt);
    return rows.slice(0, limit);
  },
});

export const getTrendSignal = query({
  args: { trendId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db.query("trendSignals").withIndex("by_trend_id", (q) => q.eq("trendId", args.trendId)).unique();
  },
});

export const seedDefaultTrendSignalsIfEmpty = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("trendSignals").collect();
    if (existing.length) return { seeded: false, inserted: 0 };

    const base = Date.now() - DEMO_TREND_SIGNALS.length * 2000;
    let inserted = 0;
    for (const [i, seed] of DEMO_TREND_SIGNALS.entries()) {
      await ctx.db.insert("trendSignals", buildTrendRowFromSeed(seed, base, i) as never);
      inserted += 1;
    }
    return { seeded: true, inserted };
  },
});

export const upsertTrendSignal = mutation({
  args: {
    trendId: v.optional(v.string()),
    patch: v.any(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const patch = stripPatch((args.patch ?? {}) as Record<string, unknown>);
    const trendId =
      args.trendId?.trim() ||
      `trend_${now}_${Math.random().toString(36).slice(2, 8)}`;

    const existing = await ctx.db.query("trendSignals").withIndex("by_trend_id", (q) => q.eq("trendId", trendId)).unique();

    if (existing?._id) {
      const next = {
        ...stripSystemFields(existing),
        ...patch,
        trendId,
        updatedAt: now,
      } as Record<string, unknown>;
      await ctx.db.patch(existing._id, next as never);
      return { success: true as const, mode: "updated" as const, trendId };
    }

    const title = typeof patch.title === "string" ? patch.title : "Untitled trend";
    const platform = typeof patch.platform === "string" ? patch.platform : "other";
    const status = typeof patch.status === "string" ? patch.status : "candidate";
    const sourceSystem = typeof patch.sourceSystem === "string" ? patch.sourceSystem : "manual";

    const row = {
      trendId,
      title,
      platform,
      status,
      sourceSystem,
      createdAt: now,
      updatedAt: now,
      summary: patch.summary,
      trendType: patch.trendType,
      sourceUrl: patch.sourceUrl,
      sourceLabel: patch.sourceLabel,
      observedAt: typeof patch.observedAt === "number" ? patch.observedAt : now,
      expiresAt: patch.expiresAt,
      timeliness: patch.timeliness ?? "unknown",
      relevanceScore: patch.relevanceScore,
      brandFitScore: patch.brandFitScore,
      audienceFitScore: patch.audienceFitScore,
      riskScore: patch.riskScore,
      effortLevel: patch.effortLevel,
      confidence: patch.confidence,
      tags: Array.isArray(patch.tags) ? patch.tags : [],
      relatedCampaignIds: Array.isArray(patch.relatedCampaignIds) ? patch.relatedCampaignIds : [],
      relatedLibraryItemIds: Array.isArray(patch.relatedLibraryItemIds) ? patch.relatedLibraryItemIds : [],
      relatedProductionAssetIds: Array.isArray(patch.relatedProductionAssetIds) ? patch.relatedProductionAssetIds : [],
      suggestedUses: Array.isArray(patch.suggestedUses) ? patch.suggestedUses : [],
      adaptationIdeas: Array.isArray(patch.adaptationIdeas) ? patch.adaptationIdeas : [],
      hookIdeas: Array.isArray(patch.hookIdeas) ? patch.hookIdeas : [],
      captionIdeas: Array.isArray(patch.captionIdeas) ? patch.captionIdeas : [],
      memeIdeas: Array.isArray(patch.memeIdeas) ? patch.memeIdeas : [],
      creativeBriefNotes: patch.creativeBriefNotes,
      platformNotes: patch.platformNotes,
      riskNotes: patch.riskNotes,
      approvalNotes: patch.approvalNotes,
      rawJson: patch.rawJson,
    };

    await ctx.db.insert("trendSignals", row as never);
    return { success: true as const, mode: "inserted" as const, trendId };
  },
});

export const updateTrendSignalStatus = mutation({
  args: {
    trendId: v.string(),
    status: v.string(),
    reviewedBy: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query("trendSignals").withIndex("by_trend_id", (q) => q.eq("trendId", args.trendId)).unique();
    if (!existing?._id) throw new Error("TREND_NOT_FOUND");

    const now = Date.now();
    const next: Record<string, unknown> = {
      ...stripSystemFields(existing),
      status: args.status,
      updatedAt: now,
    };

    if (["approved", "rejected", "needs_review", "candidate"].includes(args.status) && args.reviewedBy) {
      next.reviewedBy = args.reviewedBy;
      next.reviewedAt = now;
    }
    if (args.status === "used") {
      next.usedAt = now;
    }
    if (args.status === "archived") {
      next.archivedAt = now;
    }
    if (args.notes !== undefined) {
      next.approvalNotes = args.notes;
    }

    await ctx.db.patch(existing._id, next as never);
    return { success: true as const, trendId: args.trendId };
  },
});

export const linkTrendToCampaign = mutation({
  args: {
    trendId: v.string(),
    campaignId: v.string(),
    alsoLinkOnCampaign: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const trend = await ctx.db.query("trendSignals").withIndex("by_trend_id", (q) => q.eq("trendId", args.trendId)).unique();
    if (!trend?._id) throw new Error("TREND_NOT_FOUND");

    const related = new Set(trend.relatedCampaignIds ?? []);
    related.add(args.campaignId);
    const now = Date.now();
    await ctx.db.patch(trend._id, {
      ...stripSystemFields(trend),
      relatedCampaignIds: [...related],
      updatedAt: now,
    } as never);

    if (args.alsoLinkOnCampaign !== false) {
      const campaign = await ctx.db
        .query("campaigns")
        .withIndex("by_campaign_id", (q) => q.eq("campaignId", args.campaignId))
        .unique();
      if (campaign?._id) {
        const ids = new Set(campaign.linkedTrendIds ?? []);
        ids.add(args.trendId);
        await ctx.db.patch(campaign._id, {
          linkedTrendIds: [...ids],
          updatedAt: now,
        } as never);
      }
    }

    return { success: true as const };
  },
});

/** Creates a Swipe File library row — inspiration_only; not auto-approved. */
export const saveTrendToSwipeFile = mutation({
  args: { trendId: v.string() },
  handler: async (ctx, args) => {
    const trend = await ctx.db.query("trendSignals").withIndex("by_trend_id", (q) => q.eq("trendId", args.trendId)).unique();
    if (!trend?._id) throw new Error("TREND_NOT_FOUND");

    const now = Date.now();
    const recordId = `lib_swipe_trend_${now}_${Math.random().toString(36).slice(2, 7)}`;
    await ctx.db.insert("libraryItems", {
      recordId,
      type: "trend_example",
      name: trend.title,
      status: "candidate",
      summary: trend.summary ?? "Trend reference — inspiration only; do not copy external creative verbatim.",
      tags: [...(trend.tags ?? []), "trend_intelligence", "inspiration_only"],
      bucket: "swipe_file",
      title: trend.title,
      sourceSystem: "trend_intelligence",
      sourceLabel: `From trend signal ${trend.trendId}`,
      sourceUri: trend.sourceUrl,
      usageRights: "inspiration_only",
      linkedCampaignIds: trend.relatedCampaignIds ?? [],
      payload: { linkedTrendId: trend.trendId, platform: trend.platform, trendType: trend.trendType },
      createdAt: now,
      updatedAt: now,
    } as never);

    const libIds = new Set(trend.relatedLibraryItemIds ?? []);
    libIds.add(recordId);
    await ctx.db.patch(trend._id, {
      ...stripSystemFields(trend),
      relatedLibraryItemIds: [...libIds],
      updatedAt: now,
    } as never);

    return { success: true as const, recordId };
  },
});

export const saveTrendAsPlaybookCandidate = mutation({
  args: { trendId: v.string() },
  handler: async (ctx, args) => {
    const trend = await ctx.db.query("trendSignals").withIndex("by_trend_id", (q) => q.eq("trendId", args.trendId)).unique();
    if (!trend?._id) throw new Error("TREND_NOT_FOUND");

    const now = Date.now();
    const recordId = `lib_playbook_trend_${now}_${Math.random().toString(36).slice(2, 7)}`;
    await ctx.db.insert("libraryItems", {
      recordId,
      type: "platform_pattern",
      name: `Pattern: ${trend.title}`,
      status: "candidate",
      summary: trend.platformNotes ?? trend.summary ?? "Platform pattern candidate from Trend Intelligence.",
      tags: [...(trend.tags ?? []), "trend_intelligence", "platform_playbook"],
      bucket: "platform_playbook",
      title: trend.title,
      sourceSystem: "trend_intelligence",
      sourceLabel: `Pattern note from ${trend.trendId}`,
      linkedCampaignIds: trend.relatedCampaignIds ?? [],
      payload: { linkedTrendId: trend.trendId },
      createdAt: now,
      updatedAt: now,
    } as never);

    const libIds = new Set(trend.relatedLibraryItemIds ?? []);
    libIds.add(recordId);
    await ctx.db.patch(trend._id, {
      ...stripSystemFields(trend),
      relatedLibraryItemIds: [...libIds],
      updatedAt: now,
    } as never);

    return { success: true as const, recordId };
  },
});

export const saveTrendAsLearningCandidate = mutation({
  args: { trendId: v.string() },
  handler: async (ctx, args) => {
    const trend = await ctx.db.query("trendSignals").withIndex("by_trend_id", (q) => q.eq("trendId", args.trendId)).unique();
    if (!trend?._id) throw new Error("TREND_NOT_FOUND");

    const now = Date.now();
    const recordId = `learn_trend_${now}_${Math.random().toString(36).slice(2, 7)}`;
    await ctx.db.insert("learningInsights", {
      recordId,
      source: "trend_intelligence",
      status: "candidate",
      title: `Trend usage candidate: ${trend.title}`,
      summary: trend.approvalNotes ?? trend.summary ?? "Candidate learning from a trend signal — requires human approval.",
      confidence: typeof trend.confidence === "number" ? trend.confidence / 100 : 0.5,
      payload: { linkedTrendId: trend.trendId, platform: trend.platform },
      createdAt: now,
      updatedAt: now,
    } as never);

    await ctx.db.patch(trend._id, {
      ...stripSystemFields(trend),
      updatedAt: now,
    } as never);

    return { success: true as const, recordId };
  },
});

export const seedMetaTrendDemosIfMissing = mutation({
  args: {},
  handler: async (ctx) => {
    const base = Date.now();
    let inserted = 0;
    let i = 0;
    for (const seed of DEMO_META_TREND_SIGNALS) {
      const ex = await ctx.db.query("trendSignals").withIndex("by_trend_id", (q) => q.eq("trendId", seed.trendId)).unique();
      if (ex) continue;
      await ctx.db.insert("trendSignals", buildTrendRowFromSeed(seed, base, i) as never);
      inserted += 1;
      i += 1;
    }
    return { inserted };
  },
});
