import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { responses as demoResponses } from "../lib/data/demo-data";
import { backfillResponseCampaignLinks as backfillResponseCampaignLinksHelper, resolveResponseCampaignLink } from "./linking";

const responsePatchValidator = v.object({
  title: v.optional(v.string()),
  classification: v.optional(v.string()),
  status: v.optional(v.string()),
  sentiment: v.optional(v.union(v.literal("positive"), v.literal("neutral"), v.literal("negative"))),
  urgency: v.optional(v.union(v.literal("low"), v.literal("medium"), v.literal("high"))),
  summary: v.optional(v.string()),
  originalMessage: v.optional(v.string()),
  senderName: v.optional(v.string()),
  senderEmail: v.optional(v.string()),
  receivedAt: v.optional(v.number()),
  campaignId: v.optional(v.string()),
  campaignName: v.optional(v.string()),
  matchConfidence: v.optional(v.number()),
  recommendedAction: v.optional(v.string()),
  suggestedReply: v.optional(v.string()),
  suggestedReplyStatus: v.optional(v.string()),
  noAutoSend: v.optional(v.boolean()),
  assignedTo: v.optional(v.string()),
  source: v.optional(v.string()),
  sourceMessageId: v.optional(v.string()),
  helpdeskThreadId: v.optional(v.string()),
  tags: v.optional(v.array(v.string())),
  resolvedAt: v.optional(v.number()),
  resolvedBy: v.optional(v.string()),
  notes: v.optional(v.string()),
  sortOrder: v.optional(v.number()),
});

function stripSystemFields<T extends Record<string, unknown>>(record: T | null | undefined) {
  if (!record) return {};
  const rest = { ...(record as T & { _id?: unknown; _creationTime?: unknown }) };
  delete rest._id;
  delete rest._creationTime;
  return rest;
}

function sanitizeResponseRecord(record: Record<string, unknown>) {
  const next = {
    responseId: record.responseId,
    title: record.title,
    classification: record.classification,
    status: record.status,
    sentiment: record.sentiment,
    urgency: record.urgency,
    summary: record.summary,
    originalMessage: record.originalMessage,
    senderName: record.senderName,
    senderEmail: record.senderEmail,
    receivedAt: record.receivedAt,
    campaignId: record.campaignId,
    campaignName: record.campaignName,
    matchConfidence: record.matchConfidence,
    recommendedAction: record.recommendedAction,
    suggestedReply: record.suggestedReply,
    suggestedReplyStatus: record.suggestedReplyStatus,
    noAutoSend: record.noAutoSend,
    assignedTo: record.assignedTo,
    source: record.source,
    sourceMessageId: record.sourceMessageId,
    helpdeskThreadId: record.helpdeskThreadId,
    tags: record.tags,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    resolvedAt: record.resolvedAt,
    resolvedBy: record.resolvedBy,
    notes: record.notes,
    sortOrder: record.sortOrder,
  } satisfies Record<string, unknown>;

  return Object.fromEntries(Object.entries(next).filter(([, value]) => value !== undefined));
}

function sortByOrder(left: { sortOrder: number; updatedAt: number }, right: { sortOrder: number; updatedAt: number }) {
  if (left.sortOrder !== right.sortOrder) return left.sortOrder - right.sortOrder;
  return right.updatedAt - left.updatedAt;
}

function seedPayload(item: (typeof demoResponses)[number]) {
  return sanitizeResponseRecord({
    responseId: item.id,
    title: item.title,
    classification: item.classification,
    status: item.status,
    sentiment: item.sentiment,
    urgency: item.urgency,
    summary: item.summary,
    originalMessage: item.originalMessage,
    senderName: item.senderName,
    senderEmail: item.senderEmail,
    receivedAt: Date.parse(item.receivedAt),
    campaignId: item.campaignId,
    campaignName: item.campaignName,
    matchConfidence: item.matchConfidence,
    recommendedAction: item.recommendedAction,
    suggestedReply: item.suggestedReply,
    suggestedReplyStatus: item.suggestedReplyStatus,
    noAutoSend: item.noAutoSend,
    assignedTo: item.assignedTo,
    source: item.source,
    sourceMessageId: item.sourceMessageId,
    helpdeskThreadId: item.helpdeskThreadId,
    tags: item.tags,
    createdAt: Date.parse(item.createdAt),
    updatedAt: Date.parse(item.updatedAt),
    resolvedAt: item.resolvedAt ? Date.parse(item.resolvedAt) : undefined,
    resolvedBy: item.resolvedBy,
    notes: item.notes,
    sortOrder: item.sortOrder,
  });
}

export const listResponseRecords = query({
  args: {},
  handler: async (ctx) => {
    const items = await ctx.db.query("responseClassifications").collect();
    const next = [];
    for (const item of items) {
      const resolved = await resolveResponseCampaignLink(ctx, item as never);
      next.push({
        ...item,
        campaignId: resolved.campaignId,
        campaignName: resolved.campaignName,
      });
    }
    return next.sort(sortByOrder);
  },
});

export const getResponseRecordByResponseId = query({
  args: { responseId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db.query("responseClassifications").withIndex("by_response_id", (q) => q.eq("responseId", args.responseId)).unique();
  },
});

export const listResponseRecordsByClassification = query({
  args: { classification: v.string() },
  handler: async (ctx, args) => {
    const items = await ctx.db.query("responseClassifications").collect();
    return items.filter((item) => item.classification === args.classification).sort(sortByOrder);
  },
});

export const listUnresolvedResponseRecords = query({
  args: {},
  handler: async (ctx) => {
    const items = await ctx.db.query("responseClassifications").collect();
    return items.filter((item) => item.status !== "resolved").sort(sortByOrder);
  },
});

export const seedDefaultResponseRecordsIfEmpty = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("responseClassifications").collect();
    if (existing.length) return { seeded: false, inserted: 0 };

    for (const item of demoResponses) {
      await ctx.db.insert("responseClassifications", seedPayload(item) as never);
    }

    return { seeded: true, inserted: demoResponses.length };
  },
});

export const upsertResponseRecord = mutation({
  args: { responseId: v.string(), patch: responsePatchValidator },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query("responseClassifications").withIndex("by_response_id", (q) => q.eq("responseId", args.responseId)).unique();
    const now = Date.now();
    const base = stripSystemFields(existing) as Record<string, unknown>;
    const resolvedCampaign = await resolveResponseCampaignLink(
      ctx,
      Object.assign({}, base, args.patch, { responseId: args.responseId }) as never,
    );
    const next = sanitizeResponseRecord({
      ...base,
      ...args.patch,
      campaignId: resolvedCampaign.campaignId,
      campaignName: resolvedCampaign.campaignName,
      responseId: args.responseId,
      createdAt: typeof base.createdAt === "number" ? base.createdAt : now,
      updatedAt: now,
      sortOrder: typeof base.sortOrder === "number" ? base.sortOrder : 0,
    });

    if (existing?._id) {
      await ctx.db.patch(existing._id, next as never);
      return { success: true as const, mode: "updated" as const, responseId: args.responseId };
    }

    await ctx.db.insert("responseClassifications", next as never);
    return { success: true as const, mode: "inserted" as const, responseId: args.responseId };
  },
});

export const markResponseResolved = mutation({
  args: { responseId: v.string(), resolvedBy: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query("responseClassifications").withIndex("by_response_id", (q) => q.eq("responseId", args.responseId)).unique();
    if (!existing) throw new Error("Response not found");
    const now = Date.now();
    await ctx.db.patch(existing._id, sanitizeResponseRecord({
      ...stripSystemFields(existing),
      status: "resolved",
      resolvedAt: now,
      resolvedBy: args.resolvedBy,
      updatedAt: now,
    }) as never);
    return { success: true as const, responseId: args.responseId };
  },
});

export const markResponseNeedsReply = mutation({
  args: { responseId: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query("responseClassifications").withIndex("by_response_id", (q) => q.eq("responseId", args.responseId)).unique();
    if (!existing) throw new Error("Response not found");
    await ctx.db.patch(existing._id, sanitizeResponseRecord({
      ...stripSystemFields(existing),
      classification: "Needs Reply",
      status: "needs_reply",
      updatedAt: Date.now(),
    }) as never);
    return { success: true as const, responseId: args.responseId };
  },
});

export const updateSuggestedReply = mutation({
  args: { responseId: v.string(), suggestedReply: v.string(), suggestedReplyStatus: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query("responseClassifications").withIndex("by_response_id", (q) => q.eq("responseId", args.responseId)).unique();
    if (!existing) throw new Error("Response not found");
    await ctx.db.patch(existing._id, sanitizeResponseRecord({
      ...stripSystemFields(existing),
      suggestedReply: args.suggestedReply,
      suggestedReplyStatus: args.suggestedReplyStatus ?? existing.suggestedReplyStatus,
      updatedAt: Date.now(),
    }) as never);
    return { success: true as const, responseId: args.responseId };
  },
});

export const updateResponseNotes = mutation({
  args: { responseId: v.string(), notes: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query("responseClassifications").withIndex("by_response_id", (q) => q.eq("responseId", args.responseId)).unique();
    if (!existing) throw new Error("Response not found");
    await ctx.db.patch(existing._id, sanitizeResponseRecord({
      ...stripSystemFields(existing),
      notes: args.notes,
      updatedAt: Date.now(),
    }) as never);
    return { success: true as const, responseId: args.responseId };
  },
});

export const importHelpdeskResponseRecord = mutation({
  args: {
    responseId: v.string(),
    title: v.string(),
    classification: v.string(),
    status: v.string(),
    sentiment: v.union(v.literal("positive"), v.literal("neutral"), v.literal("negative")),
    urgency: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
    summary: v.string(),
    originalMessage: v.optional(v.string()),
    senderName: v.optional(v.string()),
    senderEmail: v.optional(v.string()),
    receivedAt: v.number(),
    campaignId: v.optional(v.string()),
    campaignName: v.optional(v.string()),
    matchConfidence: v.optional(v.number()),
    recommendedAction: v.string(),
    suggestedReply: v.optional(v.string()),
    suggestedReplyStatus: v.optional(v.string()),
    noAutoSend: v.boolean(),
    assignedTo: v.optional(v.string()),
    source: v.optional(v.string()),
    sourceMessageId: v.optional(v.string()),
    helpdeskThreadId: v.optional(v.string()),
    tags: v.array(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const existing = await ctx.db.query("responseClassifications").withIndex("by_response_id", (q) => q.eq("responseId", args.responseId)).unique();
    const resolvedCampaign = await resolveResponseCampaignLink(ctx, args as never);
    const next = sanitizeResponseRecord({
      ...stripSystemFields(existing),
      ...args,
      campaignId: resolvedCampaign.campaignId,
      campaignName: resolvedCampaign.campaignName,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
      sortOrder: existing?.sortOrder ?? now,
    });

    if (existing?._id) {
      await ctx.db.patch(existing._id, next as never);
      return { success: true as const, mode: "updated" as const, responseId: args.responseId };
    }

    await ctx.db.insert("responseClassifications", next as never);
    return { success: true as const, mode: "inserted" as const, responseId: args.responseId };
  },
});

export const backfillResponseCampaignLinks = mutation({
  args: {},
  handler: async (ctx) => {
    return await backfillResponseCampaignLinksHelper(ctx);
  },
});
