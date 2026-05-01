import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const keapSyncStatus = v.union(
  v.literal("draft"),
  v.literal("ready_for_manual_export"),
  v.literal("exported_manually"),
  v.literal("error"),
);

const keapSyncPatchValidator = v.object({
  campaignId: v.optional(v.string()),
  campaignName: v.optional(v.string()),
  status: v.optional(keapSyncStatus),
  action: v.optional(v.string()),
  payloadSummary: v.optional(v.string()),
  payloadJson: v.optional(v.string()),
  completedAt: v.optional(v.number()),
  error: v.optional(v.string()),
});

function stripSystemFields<T extends Record<string, unknown>>(record: T | null | undefined) {
  if (!record) return {};
  const rest = { ...(record as T & { _id?: unknown; _creationTime?: unknown }) };
  delete rest._id;
  delete rest._creationTime;
  return rest;
}

function sanitizeJob(record: Record<string, unknown>) {
  const next = {
    jobId: record.jobId,
    campaignId: record.campaignId,
    campaignName: record.campaignName,
    status: record.status,
    action: record.action,
    payloadSummary: record.payloadSummary,
    payloadJson: record.payloadJson,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    completedAt: record.completedAt,
    error: record.error,
  } satisfies Record<string, unknown>;

  return Object.fromEntries(Object.entries(next).filter(([, value]) => value !== undefined));
}

function sortJobs(left: { updatedAt: number; createdAt: number }, right: { updatedAt: number; createdAt: number }) {
  if (left.updatedAt !== right.updatedAt) return right.updatedAt - left.updatedAt;
  return right.createdAt - left.createdAt;
}

export const listKeapSyncJobs = query({
  args: {},
  handler: async (ctx) => {
    const jobs = await ctx.db.query("keapSyncJobs").collect();
    return jobs.sort(sortJobs);
  },
});

export const listKeapSyncJobsByCampaignId = query({
  args: { campaignId: v.string() },
  handler: async (ctx, args) => {
    const jobs = await ctx.db.query("keapSyncJobs").withIndex("by_campaign_id", (q) => q.eq("campaignId", args.campaignId)).collect();
    return jobs.sort(sortJobs);
  },
});

export const upsertKeapSyncJob = mutation({
  args: {
    jobId: v.string(),
    patch: keapSyncPatchValidator,
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query("keapSyncJobs").withIndex("by_job_id", (q) => q.eq("jobId", args.jobId)).unique();
    const now = Date.now();
    const base = stripSystemFields(existing) as Record<string, unknown>;
    const next = sanitizeJob({
      ...base,
      ...args.patch,
      jobId: args.jobId,
      campaignName: args.patch.campaignName ?? base.campaignName ?? "Unknown campaign",
      status: args.patch.status ?? base.status ?? "draft",
      action: args.patch.action ?? base.action ?? "manual_export",
      payloadSummary: args.patch.payloadSummary ?? base.payloadSummary ?? "Manual export package prepared.",
      createdAt: typeof base.createdAt === "number" ? base.createdAt : now,
      updatedAt: now,
      completedAt: args.patch.completedAt,
      error: args.patch.error,
    });

    if (existing?._id) {
      await ctx.db.patch(existing._id, next as never);
      return { success: true as const, mode: "updated" as const, jobId: args.jobId };
    }

    await ctx.db.insert("keapSyncJobs", next as never);
    return { success: true as const, mode: "inserted" as const, jobId: args.jobId };
  },
});

export const markKeapSyncJobExported = mutation({
  args: { jobId: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query("keapSyncJobs").withIndex("by_job_id", (q) => q.eq("jobId", args.jobId)).unique();
    if (!existing) throw new Error("Keap sync job not found");

    const now = Date.now();
    await ctx.db.patch(existing._id, sanitizeJob({
      ...stripSystemFields(existing),
      status: "exported_manually",
      completedAt: now,
      updatedAt: now,
    }) as never);

    return { success: true as const, jobId: args.jobId };
  },
});
