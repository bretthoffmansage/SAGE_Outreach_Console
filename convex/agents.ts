import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { defaultAgentConfigs, defaultAgentRuns, defaultAgentRuntimeStates } from "../lib/agent-config";

type IndexQuery = {
  eq: (field: string, value: unknown) => unknown;
};

export const listAgentConfigs = query({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("agentConfigs").collect();
    return existing.length ? existing : defaultAgentConfigs;
  },
});

export const getAgentConfig = query({
  args: { agentId: v.string() },
  handler: async (ctx, args: { agentId: string }) => {
    const existing = await ctx.db.query("agentConfigs").withIndex("by_agent_id", (q: IndexQuery) => q.eq("agentId", args.agentId)).unique();
    return existing ?? defaultAgentConfigs.find((config) => config.agentId === args.agentId) ?? null;
  },
});

export const updateAgentConfig = mutation({
  args: { agentId: v.string(), patch: v.any() },
  handler: async (ctx, args: { agentId: string; patch: Record<string, unknown> }) => {
    const existing = await ctx.db.query("agentConfigs").withIndex("by_agent_id", (q: IndexQuery) => q.eq("agentId", args.agentId)).unique();
    const existingRecord = (existing ?? {}) as Record<string, unknown> & { _id?: unknown };
    const next = { ...existingRecord, ...args.patch, agentId: args.agentId, updatedAt: Date.now() };
    if (existingRecord._id) {
      await ctx.db.patch(existingRecord._id, next);
      return { success: true, mode: "updated", agentId: args.agentId };
    }
    await ctx.db.insert("agentConfigs", next);
    return { success: true, mode: "inserted", agentId: args.agentId };
  },
});

export const getAgentRuntimeState = query({
  args: { agentId: v.string() },
  handler: async (ctx, args: { agentId: string }) => {
    const existing = await ctx.db.query("agentRuntimeStates").withIndex("by_agent_id", (q: IndexQuery) => q.eq("agentId", args.agentId)).unique();
    return existing ?? defaultAgentRuntimeStates.find((state) => state.agentId === args.agentId) ?? null;
  },
});

export const listAgentRuntimeStates = query({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("agentRuntimeStates").collect();
    return existing.length ? existing : defaultAgentRuntimeStates;
  },
});

export const updateAgentRuntimeState = mutation({
  args: { agentId: v.string(), patch: v.any() },
  handler: async (ctx, args: { agentId: string; patch: Record<string, unknown> }) => {
    const existing = await ctx.db.query("agentRuntimeStates").withIndex("by_agent_id", (q: IndexQuery) => q.eq("agentId", args.agentId)).unique();
    const existingRecord = (existing ?? {}) as Record<string, unknown> & { _id?: unknown };
    const next = { ...existingRecord, ...args.patch, agentId: args.agentId, updatedAt: Date.now() };
    if (existingRecord._id) {
      await ctx.db.patch(existingRecord._id, next);
      return { success: true, mode: "updated", agentId: args.agentId };
    }
    await ctx.db.insert("agentRuntimeStates", next);
    return { success: true, mode: "inserted", agentId: args.agentId };
  },
});

export const listAgentRunsByAgent = query({
  args: { agentId: v.string() },
  handler: async (ctx, args: { agentId: string }) => {
    const existing = await ctx.db.query("agentRuns").withIndex("by_agent_id", (q: IndexQuery) => q.eq("agentId", args.agentId)).collect();
    return existing.length ? existing : defaultAgentRuns.filter((run) => run.agentId === args.agentId);
  },
});

export const listRecentAgentRuns = query({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("agentRuns").collect();
    const source = (existing.length ? existing : defaultAgentRuns) as Array<{ startedAt: number }>;
    return [...source].sort((left, right) => right.startedAt - left.startedAt).slice(0, 25);
  },
});

export const createAgentRun = mutation({
  args: {
    runId: v.string(),
    campaignId: v.optional(v.string()),
    agentId: v.string(),
    status: v.union(
      v.literal("idle"),
      v.literal("ready"),
      v.literal("running"),
      v.literal("human_pause"),
      v.literal("pending"),
      v.literal("blocked"),
      v.literal("complete"),
      v.literal("error"),
    ),
    inputSnapshot: v.optional(v.string()),
    outputSummary: v.optional(v.string()),
    outputJson: v.optional(v.string()),
    startedAt: v.number(),
    finishedAt: v.optional(v.number()),
    error: v.optional(v.string()),
  },
  handler: async (
    ctx,
    args: {
      runId: string;
      campaignId?: string;
      agentId: string;
      status: "idle" | "ready" | "running" | "human_pause" | "pending" | "blocked" | "complete" | "error";
      inputSnapshot?: string;
      outputSummary?: string;
      outputJson?: string;
      startedAt: number;
      finishedAt?: number;
      error?: string;
    },
  ) => {
    await ctx.db.insert("agentRuns", args);
    return { success: true, runId: args.runId, mode: "created" as const };
  },
});

export const upsertAgentRun = mutation({
  args: {
    runId: v.string(),
    patch: v.any(),
  },
  handler: async (ctx, args: { runId: string; patch: Record<string, unknown> }) => {
    const existing = await ctx.db.query("agentRuns").withIndex("by_run_id", (q: IndexQuery) => q.eq("runId", args.runId)).unique();
    const existingRecord = (existing ?? {}) as Record<string, unknown> & { _id?: unknown };
    const next = { ...existingRecord, ...args.patch, runId: args.runId };
    if (existingRecord._id) {
      await ctx.db.patch(existingRecord._id, next);
      return { success: true, mode: "updated", runId: args.runId };
    }
    await ctx.db.insert("agentRuns", next);
    return { success: true, mode: "inserted", runId: args.runId };
  },
});

export const resetDemoAgentRuntimeState = mutation({
  args: { agentId: v.string() },
  handler: async (ctx, args: { agentId: string }) => {
    const fallback = defaultAgentRuntimeStates.find((state) => state.agentId === args.agentId);
    if (!fallback) return { success: false, reason: "unknown_agent" as const, agentId: args.agentId };

    const existing = await ctx.db.query("agentRuntimeStates").withIndex("by_agent_id", (q: IndexQuery) => q.eq("agentId", args.agentId)).unique();
    const existingRecord = (existing ?? {}) as { _id?: unknown };
    if (existingRecord._id) {
      await ctx.db.patch(existingRecord._id, fallback);
      return { success: true, mode: "updated", agentId: args.agentId };
    }

    await ctx.db.insert("agentRuntimeStates", fallback);
    return { success: true, mode: "inserted", agentId: args.agentId };
  },
});

export const seedDefaultAgentConfigs = mutation({
  args: {},
  handler: async (ctx) => {
    const existingConfigs = await ctx.db.query("agentConfigs").collect();
    if (!existingConfigs.length) {
      for (const config of defaultAgentConfigs) {
        await ctx.db.insert("agentConfigs", { ...config, updatedAt: config.lastEditedAt, updatedBy: config.lastEditedBy });
      }
    }

    const existingRuntime = await ctx.db.query("agentRuntimeStates").collect();
    if (!existingRuntime.length) {
      for (const runtime of defaultAgentRuntimeStates) {
        await ctx.db.insert("agentRuntimeStates", runtime);
      }
    }

    const existingRuns = await ctx.db.query("agentRuns").collect();
    if (!existingRuns.length) {
      for (const run of defaultAgentRuns) {
        await ctx.db.insert("agentRuns", run);
      }
    }

    return {
      seededConfigs: defaultAgentConfigs.length,
      seededRuntimeStates: defaultAgentRuntimeStates.length,
      seededRuns: defaultAgentRuns.length,
    };
  },
});
