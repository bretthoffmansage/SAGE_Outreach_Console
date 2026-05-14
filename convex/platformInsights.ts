import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { defaultPlatformInsightSeeds } from "../lib/platform-insight-seeds";

function strip<T extends Record<string, unknown>>(row: T) {
  const { _id, _creationTime, ...rest } = row as T & { _id?: unknown; _creationTime?: unknown };
  return rest;
}

export const listPlatformInsights = query({
  args: {
    platform: v.optional(v.string()),
    insightType: v.optional(v.string()),
    status: v.optional(v.string()),
    sourceSystem: v.optional(v.string()),
    campaignId: v.optional(v.string()),
    search: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const lim = Math.min(Math.max(args.limit ?? 80, 1), 200);
    let rows = await ctx.db.query("platformInsights").collect();
    if (args.platform) rows = rows.filter((r) => r.platform === args.platform);
    if (args.insightType) rows = rows.filter((r) => r.insightType === args.insightType);
    if (args.status) rows = rows.filter((r) => r.status === args.status);
    if (args.sourceSystem) rows = rows.filter((r) => r.sourceSystem === args.sourceSystem);
    if (args.campaignId) {
      rows = rows.filter((r) => (r.relatedCampaignIds ?? []).includes(args.campaignId!));
    }
    if (args.search?.trim()) {
      const s = args.search.trim().toLowerCase();
      rows = rows.filter(
        (r) => r.title.toLowerCase().includes(s) || r.summary.toLowerCase().includes(s) || r.insightId.toLowerCase().includes(s),
      );
    }
    rows.sort((a, b) => b.updatedAt - a.updatedAt);
    return rows.slice(0, lim).map((r) => strip(r as Record<string, unknown>));
  },
});

export const upsertPlatformInsight = mutation({
  args: { insightId: v.string(), patch: v.any() },
  handler: async (ctx, args) => {
    const now = Date.now();
    const patch = (args.patch ?? {}) as Record<string, unknown>;
    const existing = await ctx.db
      .query("platformInsights")
      .withIndex("by_insight_id", (q) => q.eq("insightId", args.insightId))
      .unique();
    const base = existing ? (strip(existing as Record<string, unknown>) as Record<string, unknown>) : {};
    const next = {
      ...base,
      ...patch,
      insightId: args.insightId,
      platform: typeof patch.platform === "string" ? patch.platform : (base.platform as string) ?? "other",
      sourceSystem: typeof patch.sourceSystem === "string" ? patch.sourceSystem : (base.sourceSystem as string) ?? "manual",
      sourceMode: typeof patch.sourceMode === "string" ? patch.sourceMode : (base.sourceMode as string) ?? "manual",
      insightType: typeof patch.insightType === "string" ? patch.insightType : (base.insightType as string) ?? "recommendation",
      title: typeof patch.title === "string" ? patch.title : (base.title as string) ?? args.insightId,
      summary: typeof patch.summary === "string" ? patch.summary : (base.summary as string) ?? "",
      status: typeof patch.status === "string" ? patch.status : (base.status as string) ?? "candidate",
      createdAt: typeof base.createdAt === "number" ? base.createdAt : now,
      updatedAt: now,
    };
    if (existing?._id) {
      await ctx.db.patch(existing._id, next as never);
      return { mode: "updated" as const, insightId: args.insightId };
    }
    await ctx.db.insert("platformInsights", next as never);
    return { mode: "inserted" as const, insightId: args.insightId };
  },
});

export const updatePlatformInsightStatus = mutation({
  args: { insightId: v.string(), status: v.string() },
  handler: async (ctx, args) => {
    const row = await ctx.db
      .query("platformInsights")
      .withIndex("by_insight_id", (q) => q.eq("insightId", args.insightId))
      .unique();
    if (!row?._id) throw new Error("INSIGHT_NOT_FOUND");
    await ctx.db.patch(row._id, { status: args.status, updatedAt: Date.now() } as never);
    return { ok: true as const };
  },
});

export const seedDefaultPlatformInsightsIfEmpty = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("platformInsights").collect();
    if (existing.length) return { seeded: false as const, count: existing.length };
    const now = Date.now();
    let i = 0;
    for (const s of defaultPlatformInsightSeeds) {
      await ctx.db.insert(
        "platformInsights",
        {
          ...s,
          relatedCampaignIds: [],
          relatedSnapshotIds: [],
          relatedTrendIds: [],
          relatedLibraryItemIds: [],
          createdAt: now - i * 100,
          updatedAt: now - i * 100,
        } as never,
      );
      i += 1;
    }
    return { seeded: true as const, inserted: defaultPlatformInsightSeeds.length };
  },
});
