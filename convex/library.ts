import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { learningInsights, libraryItems } from "../lib/data/demo-data";

const LIBRARY_ITEM_KEYS = [
  "recordId",
  "type",
  "name",
  "status",
  "summary",
  "tags",
  "riskLevel",
  "payload",
  "createdAt",
  "updatedAt",
  "bucket",
  "title",
  "sourceSystem",
  "sourceUri",
  "sourceFileId",
  "sourceFolderId",
  "sourceLabel",
  "contentHash",
  "linkedCampaignIds",
  "linkedAssetIds",
  "usageRights",
  "confidence",
  "priority",
  "reviewOwner",
  "approvedBy",
  "approvedAt",
  "archivedAt",
  "driveFileId",
  "driveFolderId",
  "driveMimeType",
  "driveWebUrl",
  "driveLastModifiedAt",
  "driveLastSyncedAt",
  "driveSyncStatus",
  "obsidianPath",
  "obsidianNoteTitle",
  "obsidianSyncStatus",
  "obsidianLastSyncedAt",
  "obsidianFrontmatterJson",
  "obsidianBacklinks",
  "obsidianTags",
  "obsidianSyncNotes",
  "driveFileName",
  "drivePath",
  "driveSyncNotes",
  "obsidianLastExportedAt",
  "obsidianLastPreviewedAt",
  "lastIndexedAt",
  "lastExportedAt",
  "syncStatus",
  "syncNotes",
] as const;

const LEARNING_INSIGHT_KEYS = [
  "recordId",
  "source",
  "status",
  "title",
  "summary",
  "confidence",
  "payload",
  "createdAt",
  "updatedAt",
  "approvedAt",
  "approvedBy",
  "rejectedAt",
  "rejectedBy",
  "archivedAt",
  "archivedBy",
] as const;

function stripSystemFields<T extends Record<string, unknown>>(record: T | null | undefined) {
  if (!record) return {};
  const rest = { ...(record as T & { _id?: unknown; _creationTime?: unknown }) };
  delete rest._id;
  delete rest._creationTime;
  return rest;
}

function sanitizeLibraryItemForConvex(record: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  for (const key of LIBRARY_ITEM_KEYS) {
    if (record[key] !== undefined) out[key] = record[key];
  }
  return out;
}

function sanitizeLearningInsightForConvex(record: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  for (const key of LEARNING_INSIGHT_KEYS) {
    if (record[key] !== undefined) out[key] = record[key];
  }
  return out;
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
  args: { type: v.string() },
  handler: async (ctx, args) => {
    const items = await ctx.db.query("libraryItems").withIndex("by_type", (q) => q.eq("type", args.type)).collect();
    return items.sort(sortByCreatedAtDesc);
  },
});

export const listLibraryItemsByBucket = query({
  args: { bucket: v.string() },
  handler: async (ctx, args) => {
    const items = await ctx.db.query("libraryItems").withIndex("by_bucket", (q) => q.eq("bucket", args.bucket)).collect();
    return items.sort(sortByCreatedAtDesc);
  },
});

export const getLibraryItemByRecordId = query({
  args: { recordId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db.query("libraryItems").withIndex("by_record_id", (q) => q.eq("recordId", args.recordId)).unique();
  },
});

function demoLibraryItemToRow(item: (typeof libraryItems)[number], timestamp: number) {
  const row: Record<string, unknown> = {
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
  };
  if (item.bucket) row.bucket = item.bucket;
  if (item.title) row.title = item.title;
  if (item.sourceSystem) row.sourceSystem = item.sourceSystem;
  if (item.sourceUri) row.sourceUri = item.sourceUri;
  if (item.usageRights) row.usageRights = item.usageRights;
  if (item.linkedCampaignIds) row.linkedCampaignIds = item.linkedCampaignIds;
  if (item.priority) row.priority = item.priority;
  if (item.driveSyncStatus) row.driveSyncStatus = item.driveSyncStatus;
  if (item.obsidianSyncStatus) row.obsidianSyncStatus = item.obsidianSyncStatus;
  if (item.obsidianPath) row.obsidianPath = item.obsidianPath;
  return sanitizeLibraryItemForConvex(row);
}

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
      await ctx.db.insert("libraryItems", demoLibraryItemToRow(item, timestamp) as never);
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
    const patch = (args.patch ?? {}) as Record<string, unknown>;
    const next = sanitizeLibraryItemForConvex({
      ...base,
      ...patch,
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
      ...(args.patch as Record<string, unknown>),
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

const learningStatusLiterals = v.union(
  v.literal("candidate"),
  v.literal("approved"),
  v.literal("rejected"),
  v.literal("archived"),
);

export const updateLearningInsightStatus = mutation({
  args: {
    recordId: v.string(),
    status: learningStatusLiterals,
    actor: v.optional(v.string()),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query("learningInsights").withIndex("by_record_id", (q) => q.eq("recordId", args.recordId)).unique();
    if (!existing?._id) {
      return { success: false as const, error: "not_found" as const };
    }

    const base = stripSystemFields(existing) as Record<string, unknown>;
    const now = Date.now();
    const payload = { ...(typeof base.payload === "object" && base.payload !== null ? (base.payload as Record<string, unknown>) : {}) };
    if (args.note && args.status === "rejected") {
      payload.rejectionNote = args.note;
    }

    const merged: Record<string, unknown> = {
      ...base,
      recordId: args.recordId,
      status: args.status,
      payload,
      createdAt: typeof base.createdAt === "number" ? base.createdAt : now,
      updatedAt: now,
    };

    const actor = args.actor ?? "operator";

    if (args.status === "approved") {
      merged.approvedAt = now;
      merged.approvedBy = actor;
      delete merged.rejectedAt;
      delete merged.rejectedBy;
      delete merged.archivedAt;
      delete merged.archivedBy;
    } else if (args.status === "rejected") {
      merged.rejectedAt = now;
      merged.rejectedBy = actor;
      delete merged.approvedAt;
      delete merged.approvedBy;
      delete merged.archivedAt;
      delete merged.archivedBy;
    } else if (args.status === "archived") {
      merged.archivedAt = now;
      merged.archivedBy = actor;
    } else if (args.status === "candidate") {
      delete merged.approvedAt;
      delete merged.approvedBy;
      delete merged.rejectedAt;
      delete merged.rejectedBy;
      delete merged.archivedAt;
      delete merged.archivedBy;
    }

    const next = sanitizeLearningInsightForConvex(merged);
    await ctx.db.replace(existing._id, next as never);
    return { success: true as const, recordId: args.recordId };
  },
});

export const updateLibrarySyncMetadata = mutation({
  args: { recordId: v.string(), patch: v.any() },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query("libraryItems").withIndex("by_record_id", (q) => q.eq("recordId", args.recordId)).unique();
    if (!existing?._id) throw new Error("LIBRARY_RECORD_NOT_FOUND");
    const base = stripSystemFields(existing as Record<string, unknown>);
    const patch = (args.patch ?? {}) as Record<string, unknown>;
    const now = Date.now();
    const merged: Record<string, unknown> = { ...base, ...patch, recordId: args.recordId, updatedAt: now };
    const next = sanitizeLibraryItemForConvex(merged);
    await ctx.db.patch(existing._id, next as never);
    return { success: true as const };
  },
});
