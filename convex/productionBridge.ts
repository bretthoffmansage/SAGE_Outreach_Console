import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const listSyncJobs = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = Math.min(Math.max(args.limit ?? 30, 1), 100);
    const rows = await ctx.db.query("productionBridgeSyncJobs").collect();
    rows.sort((a, b) => b.updatedAt - a.updatedAt);
    return rows.slice(0, limit);
  },
});

export const createManualSyncJob = mutation({
  args: {
    sourceSystem: v.optional(v.string()),
    direction: v.optional(v.string()),
    mode: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const syncJobId = `pbridge_sync_${now}_${Math.random().toString(36).slice(2, 8)}`;
    await ctx.db.insert("productionBridgeSyncJobs", {
      syncJobId,
      sourceSystem: args.sourceSystem ?? "manual_import",
      direction: args.direction ?? "import",
      status: "completed",
      mode: args.mode ?? "manual",
      recordsScanned: 0,
      recordsCreated: 0,
      recordsUpdated: 0,
      recordsSkipped: 0,
      errorMessage: undefined,
      startedAt: now,
      completedAt: now,
      createdAt: now,
      updatedAt: now,
    });
    return { syncJobId };
  },
});
