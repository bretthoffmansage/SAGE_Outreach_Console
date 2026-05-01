import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { learningInsights, libraryItems } from "../lib/data/demo-data";

function stripSystemFields<T extends Record<string, unknown>>(record: T | null | undefined) {
  if (!record) return {};
  const rest = { ...(record as T & { _id?: unknown; _creationTime?: unknown }) };
  delete rest._id;
  delete rest._creationTime;
  return rest;
}

function sanitizeLibraryItemForConvex(record: Record<string, unknown>) {
  const next = {
    recordId: record.recordId,
    type: record.type,
    name: record.name,
    status: record.status,
    summary: record.summary,
    tags: record.tags,
    riskLevel: record.riskLevel,
    payload: record.payload,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  } satisfies Record<string, unknown>;

  return Object.fromEntries(Object.entries(next).filter(([, value]) => value !== undefined));
}

function sanitizeLearningInsightForConvex(record: Record<string, unknown>) {
  const next = {
    recordId: record.recordId,
    source: record.source,
    status: record.status,
    title: record.title,
    summary: record.summary,
    confidence: record.confidence,
    payload: record.payload,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  } satisfies Record<string, unknown>;

  return Object.fromEntries(Object.entries(next).filter(([, value]) => value !== undefined));
}

function sortByUpdatedAtDesc<T extends { updatedAt: number }>(left: T, right: T) {
  return right.updatedAt - left.updatedAt;
}

function sortByCreatedAtDesc<T extends { createdAt: number }>(left: T, right: T) {
  return right.createdAt - left.createdAt;
}

export const listLibraryItems = query({
  args: {},
  handler: async (ctx) => {
    const items = await ctx.db.query("libraryItems").collect();
    return items.sort(sortByCreatedAtDesc);
  },
});

export const listLibraryItemsByType = query({
  args: {
    type: v.union(
      v.literal("offer"),
      v.literal("lead_magnet"),
      v.literal("email"),
      v.literal("voice_rule"),
      v.literal("signoff"),
      v.literal("audience"),
      v.literal("compliance_rule"),
      v.literal("learning"),
    ),
  },
  handler: async (ctx, args) => {
    const items = await ctx.db.query("libraryItems").withIndex("by_type", (q) => q.eq("type", args.type)).collect();
    return items.sort(sortByCreatedAtDesc);
  },
});

export const getLibraryItemByRecordId = query({
  args: { recordId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db.query("libraryItems").withIndex("by_record_id", (q) => q.eq("recordId", args.recordId)).unique();
  },
});

export const seedDefaultLibraryItemsIfEmpty = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("libraryItems").collect();
    if (existing.length) {
      return { seeded: false, inserted: 0 };
    }

    const baseTime = Date.now() - libraryItems.length * 1000;
    for (const [index, item] of libraryItems.entries()) {
      const timestamp = baseTime + index * 1000;
      await ctx.db.insert("libraryItems", sanitizeLibraryItemForConvex({
        recordId: item.id,
        type: item.type,
        name: item.name,
        status: item.status,
        summary: item.summary,
        tags: item.tags,
        riskLevel: item.riskLevel,
        payload: item.payload,
        createdAt: timestamp,
        updatedAt: timestamp,
      }) as never);
    }

    return { seeded: true, inserted: libraryItems.length };
  },
});

export const upsertLibraryItem = mutation({
  args: { recordId: v.string(), patch: v.any() },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query("libraryItems").withIndex("by_record_id", (q) => q.eq("recordId", args.recordId)).unique();
    const base = stripSystemFields(existing) as Record<string, unknown>;
    const now = Date.now();
    const next = sanitizeLibraryItemForConvex({
      ...base,
      ...args.patch,
      recordId: args.recordId,
      createdAt: typeof base.createdAt === "number" ? base.createdAt : now,
      updatedAt: now,
    });

    if (existing?._id) {
      await ctx.db.patch(existing._id, next);
      return { success: true as const, mode: "updated" as const, recordId: args.recordId };
    }

    await ctx.db.insert("libraryItems", next as never);
    return { success: true as const, mode: "inserted" as const, recordId: args.recordId };
  },
});

export const listLearningInsights = query({
  args: {},
  handler: async (ctx) => {
    const items = await ctx.db.query("learningInsights").collect();
    return items.sort(sortByUpdatedAtDesc);
  },
});

export const getLearningInsightByRecordId = query({
  args: { recordId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db.query("learningInsights").withIndex("by_record_id", (q) => q.eq("recordId", args.recordId)).unique();
  },
});

export const seedDefaultLearningInsightsIfEmpty = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("learningInsights").collect();
    if (existing.length) {
      return { seeded: false, inserted: 0 };
    }

    const baseTime = Date.now() - learningInsights.length * 1000;
    for (const [index, item] of learningInsights.entries()) {
      const timestamp = baseTime + index * 1000;
      await ctx.db.insert("learningInsights", sanitizeLearningInsightForConvex({
        recordId: item.id,
        source: item.source,
        status: item.status,
        title: item.title,
        summary: item.summary,
        confidence: item.confidence,
        payload: item.payload,
        createdAt: timestamp,
        updatedAt: timestamp,
      }) as never);
    }

    return { seeded: true, inserted: learningInsights.length };
  },
});

export const upsertLearningInsight = mutation({
  args: { recordId: v.string(), patch: v.any() },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query("learningInsights").withIndex("by_record_id", (q) => q.eq("recordId", args.recordId)).unique();
    const base = stripSystemFields(existing) as Record<string, unknown>;
    const now = Date.now();
    const next = sanitizeLearningInsightForConvex({
      ...base,
      ...args.patch,
      recordId: args.recordId,
      createdAt: typeof base.createdAt === "number" ? base.createdAt : now,
      updatedAt: now,
    });

    if (existing?._id) {
      await ctx.db.patch(existing._id, next);
      return { success: true as const, mode: "updated" as const, recordId: args.recordId };
    }

    await ctx.db.insert("learningInsights", next as never);
    return { success: true as const, mode: "inserted" as const, recordId: args.recordId };
  },
});
