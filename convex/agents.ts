import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { defaultAgentConfigs, defaultAgentRuns, defaultAgentRuntimeStates } from "../lib/agent-config";

type AgentRuntimeStatus = "idle" | "ready" | "running" | "human_pause" | "pending" | "blocked" | "complete" | "error";

function stripSystemFields<T extends Record<string, unknown>>(record: T | null | undefined) {
  if (!record) return {};
  const rest = { ...(record as T & { _id?: unknown; _creationTime?: unknown }) };
  delete rest._id;
  delete rest._creationTime;
  return rest;
}

function configSort(left: { workflowOrder: number }, right: { workflowOrder: number }) {
  return left.workflowOrder - right.workflowOrder;
}

function runSort(left: { startedAt: number }, right: { startedAt: number }) {
  return right.startedAt - left.startedAt;
}

function sanitizeAgentConfigForConvex(config: Record<string, unknown>) {
  const next = {
    agentId: config.agentId,
    displayName: config.displayName,
    shortDescription: config.shortDescription,
    workflowOrder: config.workflowOrder,
    category: config.category,
    enabled: config.enabled,
    systemPrompt: config.systemPrompt,
    taskPromptTemplate: config.taskPromptTemplate,
    styleGuidance: config.styleGuidance,
    requiredContextSources: config.requiredContextSources,
    exampleReferences: config.exampleReferences,
    preferredProvider: config.preferredProvider,
    preferredModel: config.preferredModel,
    temperature: config.temperature,
    maxTokens: config.maxTokens,
    structuredOutputRequired: config.structuredOutputRequired,
    inputSchemaJson: typeof config.inputSchemaJson === "string"
      ? config.inputSchemaJson
      : JSON.stringify(config.inputSchemaJson ?? {}, null, 2),
    outputSchemaJson: typeof config.outputSchemaJson === "string"
      ? config.outputSchemaJson
      : JSON.stringify(config.outputSchemaJson ?? {}, null, 2),
    requiredInputs: config.requiredInputs,
    optionalInputs: config.optionalInputs,
    requiredOutputs: config.requiredOutputs,
    escalationMarkers: config.escalationMarkers,
    confidenceField: config.confidenceField,
    riskField: config.riskField,
    activeRules: config.activeRules,
    blockingRules: config.blockingRules,
    warningRules: config.warningRules,
    allowedActions: config.allowedActions,
    disallowedActions: config.disallowedActions,
    humanApprovalRequired: config.humanApprovalRequired,
    canCreateApprovalItems: config.canCreateApprovalItems,
    canModifyCopy: config.canModifyCopy,
    canReadLibraries: config.canReadLibraries,
    canTriggerIntegrations: config.canTriggerIntegrations,
    nextAgentIds: config.nextAgentIds,
    fallbackAgentId: config.fallbackAgentId,
    blockedRoute: config.blockedRoute,
    humanPauseRoute: config.humanPauseRoute,
    handoffConditions: config.handoffConditions,
    retryPolicy: config.retryPolicy,
    maxRetries: config.maxRetries,
    configVersion: config.configVersion,
    lastEditedBy: config.lastEditedBy,
    lastEditedAt: config.lastEditedAt,
    notes: config.notes,
    updatedAt: config.updatedAt,
    updatedBy: config.updatedBy,
  } satisfies Record<string, unknown>;

  return Object.fromEntries(Object.entries(next).filter(([, value]) => value !== undefined));
}

export const listAgentConfigs = query({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("agentConfigs").collect();
    return existing.sort(configSort);
  },
});

export const getAgentConfigByAgentId = query({
  args: { agentId: v.string() },
  handler: async (ctx, args: { agentId: string }) => {
    return await ctx.db.query("agentConfigs").withIndex("by_agent_id", (q) => q.eq("agentId", args.agentId)).unique();
  },
});

export const upsertAgentConfig = mutation({
  args: { agentId: v.string(), patch: v.any() },
  handler: async (ctx, args: { agentId: string; patch: Record<string, unknown> }) => {
    const existing = await ctx.db.query("agentConfigs").withIndex("by_agent_id", (q) => q.eq("agentId", args.agentId)).unique();
    const base = stripSystemFields(existing) as Record<string, unknown>;
    const fallback = defaultAgentConfigs.find((config) => config.agentId === args.agentId);
    const now = Date.now();
    const next = sanitizeAgentConfigForConvex({
      ...fallback,
      ...base,
      ...args.patch,
      agentId: args.agentId,
      updatedAt: typeof args.patch.updatedAt === "number" ? args.patch.updatedAt : now,
      updatedBy: typeof args.patch.updatedBy === "string" ? args.patch.updatedBy : (args.patch.lastEditedBy as string | undefined),
      lastEditedAt: typeof args.patch.lastEditedAt === "number" ? args.patch.lastEditedAt : now,
    });

    if (existing?._id) {
      await ctx.db.patch(existing._id, next);
      return { success: true, mode: "updated" as const, agentId: args.agentId };
    }

    await ctx.db.insert("agentConfigs", next as any);
    return { success: true, mode: "inserted" as const, agentId: args.agentId };
  },
});

export const seedDefaultAgentConfigsIfEmpty = mutation({
  args: {},
  handler: async (ctx) => {
    const existingConfigs = await ctx.db.query("agentConfigs").collect();
    if (existingConfigs.length) {
      return { seeded: false, inserted: 0 };
    }

    const timestamp = Date.now();
    for (const config of defaultAgentConfigs) {
      await ctx.db.insert("agentConfigs", sanitizeAgentConfigForConvex({
        ...config,
        updatedAt: config.lastEditedAt ?? timestamp,
        updatedBy: config.lastEditedBy,
      }) as any);
    }

    return { seeded: true, inserted: defaultAgentConfigs.length };
  },
});

export const getAgentRuntimeStateByAgentId = query({
  args: { agentId: v.string() },
  handler: async (ctx, args: { agentId: string }) => {
    const existing = await ctx.db.query("agentRuntimeStates").withIndex("by_agent_id", (q) => q.eq("agentId", args.agentId)).unique();
    return existing ?? defaultAgentRuntimeStates.find((state) => state.agentId === args.agentId) ?? null;
  },
});

export const listAgentRuntimeStates = query({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("agentRuntimeStates").collect();
    if (existing.length) return existing.sort((left, right) => left.agentId.localeCompare(right.agentId));
    return defaultAgentRuntimeStates;
  },
});

export const upsertAgentRuntimeState = mutation({
  args: { agentId: v.string(), patch: v.any() },
  handler: async (ctx, args: { agentId: string; patch: Record<string, unknown> }) => {
    const existing = await ctx.db.query("agentRuntimeStates").withIndex("by_agent_id", (q) => q.eq("agentId", args.agentId)).unique();
    const base = stripSystemFields(existing) as Record<string, unknown>;
    const fallback = defaultAgentRuntimeStates.find((state) => state.agentId === args.agentId);
    const next = {
      ...fallback,
      ...base,
      ...args.patch,
      agentId: args.agentId,
      updatedAt: typeof args.patch.updatedAt === "number" ? args.patch.updatedAt : Date.now(),
    };

    if (existing?._id) {
      await ctx.db.patch(existing._id, next);
      return { success: true, mode: "updated" as const, agentId: args.agentId };
    }

    await ctx.db.insert("agentRuntimeStates", next as any);
    return { success: true, mode: "inserted" as const, agentId: args.agentId };
  },
});

export const listAgentRunsByAgentId = query({
  args: { agentId: v.string() },
  handler: async (ctx, args: { agentId: string }) => {
    const existing = await ctx.db.query("agentRuns").withIndex("by_agent_id", (q) => q.eq("agentId", args.agentId)).collect();
    if (existing.length) return existing.sort(runSort);
    return defaultAgentRuns.filter((run) => run.agentId === args.agentId).sort(runSort);
  },
});

export const listRecentAgentRuns = query({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("agentRuns").collect();
    const source = (existing.length ? existing : defaultAgentRuns) as Array<{ startedAt: number }>;
    return [...source].sort(runSort).slice(0, 25);
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
      status: AgentRuntimeStatus;
      inputSnapshot?: string;
      outputSummary?: string;
      outputJson?: string;
      startedAt: number;
      finishedAt?: number;
      error?: string;
    },
  ) => {
    const existing = await ctx.db.query("agentRuns").withIndex("by_run_id", (q) => q.eq("runId", args.runId)).unique();
    if (existing?._id) {
      await ctx.db.patch(existing._id, args);
      return { success: true, runId: args.runId, mode: "updated" as const };
    }

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
    const existing = await ctx.db.query("agentRuns").withIndex("by_run_id", (q) => q.eq("runId", args.runId)).unique();
    const base = stripSystemFields(existing) as Record<string, unknown>;
    const next = { ...base, ...args.patch, runId: args.runId };

    if (existing?._id) {
      await ctx.db.patch(existing._id, next);
      return { success: true, mode: "updated" as const, runId: args.runId };
    }

    await ctx.db.insert("agentRuns", next as any);
    return { success: true, mode: "inserted" as const, runId: args.runId };
  },
});

export const resetDemoAgentRuntimeState = mutation({
  args: { agentId: v.string() },
  handler: async (ctx, args: { agentId: string }) => {
    const fallback = defaultAgentRuntimeStates.find((state) => state.agentId === args.agentId);
    if (!fallback) return { success: false, reason: "unknown_agent" as const, agentId: args.agentId };

    const existing = await ctx.db.query("agentRuntimeStates").withIndex("by_agent_id", (q) => q.eq("agentId", args.agentId)).unique();
    if (existing?._id) {
      await ctx.db.patch(existing._id, fallback);
      return { success: true, mode: "updated" as const, agentId: args.agentId };
    }

    await ctx.db.insert("agentRuntimeStates", fallback);
    return { success: true, mode: "inserted" as const, agentId: args.agentId };
  },
});

export const seedDefaultAgentRuntimeStatesIfEmpty = mutation({
  args: {},
  handler: async (ctx) => {
    const existingRuntime = await ctx.db.query("agentRuntimeStates").collect();
    if (existingRuntime.length) {
      return { seeded: false, inserted: 0 };
    }

    for (const runtime of defaultAgentRuntimeStates) {
      await ctx.db.insert("agentRuntimeStates", runtime);
    }

    return { seeded: true, inserted: defaultAgentRuntimeStates.length };
  },
});

export const seedDefaultAgentRunsIfEmpty = mutation({
  args: {},
  handler: async (ctx) => {
    const existingRuns = await ctx.db.query("agentRuns").collect();
    if (existingRuns.length) {
      return { seeded: false, inserted: 0 };
    }

    for (const run of defaultAgentRuns) {
      await ctx.db.insert("agentRuns", run);
    }

    return { seeded: true, inserted: defaultAgentRuns.length };
  },
});

export const seedDefaultAgentDataIfEmpty = mutation({
  args: {},
  handler: async (ctx) => {
    const existingConfigs = await ctx.db.query("agentConfigs").collect();
    const existingRuntime = await ctx.db.query("agentRuntimeStates").collect();
    const existingRuns = await ctx.db.query("agentRuns").collect();

    let seededConfigs = 0;
    let seededRuntimeStates = 0;
    let seededRuns = 0;
    const timestamp = Date.now();

    if (!existingConfigs.length) {
      for (const config of defaultAgentConfigs) {
        await ctx.db.insert("agentConfigs", sanitizeAgentConfigForConvex({
          ...config,
          updatedAt: config.lastEditedAt ?? timestamp,
          updatedBy: config.lastEditedBy,
        }) as any);
      }
      seededConfigs = defaultAgentConfigs.length;
    }

    if (!existingRuntime.length) {
      for (const runtime of defaultAgentRuntimeStates) {
        await ctx.db.insert("agentRuntimeStates", runtime);
      }
      seededRuntimeStates = defaultAgentRuntimeStates.length;
    }

    if (!existingRuns.length) {
      for (const run of defaultAgentRuns) {
        await ctx.db.insert("agentRuns", run);
      }
      seededRuns = defaultAgentRuns.length;
    }

    return { seededConfigs, seededRuntimeStates, seededRuns };
  },
});

export const getAgentConfig = getAgentConfigByAgentId;
export const updateAgentConfig = upsertAgentConfig;
export const getAgentRuntimeState = getAgentRuntimeStateByAgentId;
export const updateAgentRuntimeState = upsertAgentRuntimeState;
export const listAgentRunsByAgent = listAgentRunsByAgentId;
export const seedDefaultAgentConfigs = seedDefaultAgentDataIfEmpty;
