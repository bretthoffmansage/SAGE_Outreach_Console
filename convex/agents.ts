import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { defaultAgentConfigs, defaultAgentRuns, defaultAgentRuntimeStates } from "../lib/agent-config";
import { buildCopyPipelineDryRunOutput } from "../lib/copy-intelligence-dry-run";
import { buildAgentRuntimeContextPayload } from "./runtime/buildAgentContext";

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
    groupId: config.groupId,
    agentRole: config.agentRole,
    inputSources: config.inputSources,
    outputTargets: config.outputTargets,
    safetyMode: config.safetyMode,
    isCore: config.isCore,
  } satisfies Record<string, unknown>;

  return Object.fromEntries(Object.entries(next).filter(([, value]) => value !== undefined));
}

export const listAgentConfigs = query({
  args: { groupId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    let existing = await ctx.db.query("agentConfigs").collect();
    if (args.groupId) {
      existing = existing.filter((row) => row.groupId === args.groupId);
    }
    return existing.sort(configSort);
  },
});

export const getAgentConfigByAgentId = query({
  args: { agentId: v.string() },
  handler: async (ctx, args: { agentId: string }) => {
    return await ctx.db.query("agentConfigs").withIndex("by_agent_id", (q) => q.eq("agentId", args.agentId)).unique();
  },
});

export const getAgentExecutionConfig = query({
  args: { agentId: v.string() },
  handler: async (ctx, args) => {
    const config = await ctx.db.query("agentConfigs").withIndex("by_agent_id", (q) => q.eq("agentId", args.agentId)).unique();
    const fallback = defaultAgentConfigs.find((item) => item.agentId === args.agentId);
    const source = config ?? fallback;
    if (!source) return null;

    return {
      agentId: source.agentId,
      displayName: source.displayName,
      shortDescription: source.shortDescription,
      preferredProvider: source.preferredProvider,
      preferredModel: source.preferredModel,
      systemPrompt: source.systemPrompt,
      taskPromptTemplate: source.taskPromptTemplate,
      requiredContextSources: source.requiredContextSources,
      nextAgentIds: source.nextAgentIds,
      handoffConditions: source.handoffConditions,
      allowedActions: source.allowedActions,
      disallowedActions: source.disallowedActions,
      humanApprovalRequired: source.humanApprovalRequired,
      canTriggerIntegrations: source.canTriggerIntegrations,
      enabled: source.enabled,
    };
  },
});

export const buildAgentRuntimeContext = query({
  args: {
    agentId: v.string(),
    campaignId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const config = await ctx.db.query("agentConfigs").withIndex("by_agent_id", (q) => q.eq("agentId", args.agentId)).unique();
    const fallback = defaultAgentConfigs.find((item) => item.agentId === args.agentId);
    const source = config ?? fallback;
    if (!source) return null;

    const [campaign, libraryItems, learningInsights] = await Promise.all([
      args.campaignId
        ? ctx.db.query("campaigns").withIndex("by_campaign_id", (q) => q.eq("campaignId", args.campaignId as string)).unique()
        : Promise.resolve(null),
      ctx.db.query("libraryItems").collect(),
      ctx.db.query("learningInsights").withIndex("by_status", (q) => q.eq("status", "approved")).collect(),
    ]);

    return buildAgentRuntimeContextPayload({
      config: {
        agentId: source.agentId,
        displayName: source.displayName,
        systemPrompt: source.systemPrompt,
        taskPromptTemplate: source.taskPromptTemplate,
        preferredProvider: source.preferredProvider,
        preferredModel: source.preferredModel,
        requiredContextSources: source.requiredContextSources,
        nextAgentIds: source.nextAgentIds,
        handoffConditions: source.handoffConditions,
        allowedActions: source.allowedActions,
        disallowedActions: source.disallowedActions,
      },
      campaign: campaign
        ? {
            campaignId: campaign.campaignId,
            name: campaign.name,
            goal: campaign.goal,
            audience: campaign.audience,
            offer: campaign.offer,
            status: campaign.status,
            stage: campaign.stage,
            nextAction: campaign.nextAction,
          }
        : null,
      libraryItems: libraryItems.map((item) => ({
        recordId: item.recordId,
        type: item.type,
        name: item.name,
        summary: item.summary,
      })),
      learningInsights: learningInsights.map((item) => ({
        recordId: item.recordId,
        title: item.title,
        summary: item.summary,
        confidence: item.confidence,
      })),
    });
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

    await ctx.db.insert("agentConfigs", next as never);
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
      }) as never);
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

    await ctx.db.insert("agentRuntimeStates", next as never);
    return { success: true, mode: "inserted" as const, agentId: args.agentId };
  },
});

export const updateAgentRuntimeStatus = mutation({
  args: {
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
    isRunning: v.boolean(),
    currentTaskLabel: v.optional(v.string()),
    currentTaskDetail: v.optional(v.string()),
    lastStartedAt: v.optional(v.number()),
    lastFinishedAt: v.optional(v.number()),
    lastRunId: v.optional(v.string()),
    lastError: v.optional(v.string()),
    lastOutputSummary: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query("agentRuntimeStates").withIndex("by_agent_id", (q) => q.eq("agentId", args.agentId)).unique();
    const base = stripSystemFields(existing) as Record<string, unknown>;
    const fallback = defaultAgentRuntimeStates.find((state) => state.agentId === args.agentId);
    const next = {
      ...fallback,
      ...base,
      agentId: args.agentId,
      status: args.status,
      isRunning: args.isRunning,
      currentTaskLabel: args.currentTaskLabel,
      currentTaskDetail: args.currentTaskDetail,
      lastStartedAt: args.lastStartedAt,
      lastFinishedAt: args.lastFinishedAt,
      lastRunId: args.lastRunId,
      lastError: args.lastError,
      lastOutputSummary: args.lastOutputSummary,
      updatedAt: Date.now(),
    };

    if (existing?._id) {
      await ctx.db.patch(existing._id, next as never);
      return { success: true as const, mode: "updated" as const, agentId: args.agentId };
    }

    await ctx.db.insert("agentRuntimeStates", next as never);
    return { success: true as const, mode: "inserted" as const, agentId: args.agentId };
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
  args: {
    groupId: v.optional(v.string()),
    campaignId: v.optional(v.string()),
    runType: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(Math.max(args.limit ?? 25, 1), 100);
    const existing = await ctx.db.query("agentRuns").collect();
    let source = (existing.length ? existing : defaultAgentRuns) as Array<Record<string, unknown> & { startedAt: number }>;
    if (args.groupId) {
      source = source.filter((r) => r.groupId === args.groupId);
    }
    if (args.campaignId) {
      source = source.filter((r) => r.campaignId === args.campaignId);
    }
    if (args.runType) {
      source = source.filter((r) => r.runType === args.runType);
    }
    return [...source].sort(runSort).slice(0, limit);
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
    groupId: v.optional(v.string()),
    runType: v.optional(v.string()),
    outputTarget: v.optional(v.string()),
    safetyMode: v.optional(v.string()),
    appliedToCampaign: v.optional(v.boolean()),
    appliedAt: v.optional(v.number()),
    reviewRequired: v.optional(v.boolean()),
    createdBy: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
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

    await ctx.db.insert("agentRuns", next as never);
    return { success: true, mode: "inserted" as const, runId: args.runId };
  },
});

export const completeAgentRun = mutation({
  args: {
    runId: v.string(),
    outputSummary: v.string(),
    outputJson: v.optional(v.string()),
    finishedAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query("agentRuns").withIndex("by_run_id", (q) => q.eq("runId", args.runId)).unique();
    if (!existing) throw new Error("Agent run not found");
    await ctx.db.patch(existing._id, {
      ...stripSystemFields(existing),
      status: "complete",
      outputSummary: args.outputSummary,
      outputJson: args.outputJson,
      finishedAt: args.finishedAt ?? Date.now(),
    } as never);
    return { success: true as const, runId: args.runId };
  },
});

export const failAgentRun = mutation({
  args: {
    runId: v.string(),
    error: v.string(),
    finishedAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query("agentRuns").withIndex("by_run_id", (q) => q.eq("runId", args.runId)).unique();
    if (!existing) throw new Error("Agent run not found");
    await ctx.db.patch(existing._id, {
      ...stripSystemFields(existing),
      status: "error",
      error: args.error,
      finishedAt: args.finishedAt ?? Date.now(),
    } as never);
    return { success: true as const, runId: args.runId };
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
        }) as never);
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

/** Inserts Copy Intelligence agent configs that are missing (safe to call multiple times). */
export const seedCopyIntelligenceAgentsIfMissing = mutation({
  args: {},
  handler: async (ctx) => {
    const ts = Date.now();
    const targets = defaultAgentConfigs.filter((c) => c.groupId === "copy_intelligence");
    let inserted = 0;
    for (const config of targets) {
      const existing = await ctx.db.query("agentConfigs").withIndex("by_agent_id", (q) => q.eq("agentId", config.agentId)).unique();
      if (existing) continue;
      await ctx.db.insert(
        "agentConfigs",
        sanitizeAgentConfigForConvex({
          ...config,
          updatedAt: ts,
          lastEditedAt: ts,
        }) as never,
      );
      inserted += 1;
    }
    return { inserted };
  },
});

/**
 * Deterministic copy pipeline dry run: builds structured output, logs agentRun, updates campaign pointers.
 * Does not call external models or mutate campaign copy fields.
 */
export const runCopyPipelineDryRun = mutation({
  args: {
    campaignId: v.string(),
    outputType: v.optional(v.string()),
    userInstructions: v.optional(v.string()),
    createdBy: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const campaign = await ctx.db.query("campaigns").withIndex("by_campaign_id", (q) => q.eq("campaignId", args.campaignId)).unique();
    if (!campaign) {
      throw new Error("CAMPAIGN_NOT_FOUND");
    }

    const assetId = campaign.sourceProductionAssetId?.trim();
    const asset = assetId
      ? await ctx.db.query("productionAssets").withIndex("by_production_asset_id", (q) => q.eq("productionAssetId", assetId)).unique()
      : null;

    const libraryItems = await ctx.db.query("libraryItems").collect();

    const out = buildCopyPipelineDryRunOutput({
      campaign: stripSystemFields(campaign) as Record<string, unknown>,
      productionAsset: asset ? (stripSystemFields(asset) as Record<string, unknown>) : null,
      libraryItems: libraryItems.map((row) => stripSystemFields(row) as Record<string, unknown>),
      outputType: args.outputType,
      userInstructions: args.userInstructions,
    });

    const t = Date.now();
    const runId = `copy_run_${t}_${Math.random().toString(36).slice(2, 9)}`;

    await ctx.db.insert("agentRuns", {
      runId,
      campaignId: args.campaignId,
      agentId: "copy_pipeline",
      status: "complete",
      groupId: "copy_intelligence",
      runType: "copy_pipeline",
      safetyMode: "draft_only",
      appliedToCampaign: false,
      reviewRequired: true,
      createdBy: args.createdBy,
      inputSnapshot: JSON.stringify(out.inputMeta, null, 2),
      outputSummary: out.summary,
      outputJson: JSON.stringify(out.body, null, 2),
      startedAt: t,
      finishedAt: t,
    });

    await ctx.db.patch(campaign._id, {
      lastCopyRunId: runId,
      lastCopyRunAt: t,
      copyIntelligenceStatus: "dry_run_complete",
      updatedAt: t,
    } as never);

    return { runId, summary: out.summary, outputJson: out.body };
  },
});

export const seedTrendIntelligenceAgentsIfMissing = mutation({
  args: {},
  handler: async (ctx) => {
    const ts = Date.now();
    const targets = defaultAgentConfigs.filter((c) => c.groupId === "trend_intelligence");
    let inserted = 0;
    for (const config of targets) {
      const existing = await ctx.db.query("agentConfigs").withIndex("by_agent_id", (q) => q.eq("agentId", config.agentId)).unique();
      if (existing) continue;
      await ctx.db.insert(
        "agentConfigs",
        sanitizeAgentConfigForConvex({
          ...config,
          updatedAt: ts,
          lastEditedAt: ts,
        }) as never,
      );
      inserted += 1;
    }
    return { inserted };
  },
});

export const seedPerformanceIntelligenceAgentsIfMissing = mutation({
  args: {},
  handler: async (ctx) => {
    const ts = Date.now();
    const targets = defaultAgentConfigs.filter((c) => c.groupId === "performance_intelligence");
    let inserted = 0;
    for (const config of targets) {
      const existing = await ctx.db.query("agentConfigs").withIndex("by_agent_id", (q) => q.eq("agentId", config.agentId)).unique();
      if (existing) continue;
      await ctx.db.insert(
        "agentConfigs",
        sanitizeAgentConfigForConvex({
          ...config,
          updatedAt: ts,
          lastEditedAt: ts,
        }) as never,
      );
      inserted += 1;
    }
    return { inserted };
  },
});

export const seedPlatformConnectorIntelligenceAgentsIfMissing = mutation({
  args: {},
  handler: async (ctx) => {
    const ts = Date.now();
    const targets = defaultAgentConfigs.filter((c) => c.groupId === "platform_connector_intelligence");
    let inserted = 0;
    for (const config of targets) {
      const existing = await ctx.db.query("agentConfigs").withIndex("by_agent_id", (q) => q.eq("agentId", config.agentId)).unique();
      if (existing) continue;
      await ctx.db.insert(
        "agentConfigs",
        sanitizeAgentConfigForConvex({
          ...config,
          updatedAt: ts,
          lastEditedAt: ts,
        }) as never,
      );
      inserted += 1;
    }
    return { inserted };
  },
});

export const getAgentConfig = getAgentConfigByAgentId;
export const updateAgentConfig = upsertAgentConfig;
export const getAgentRuntimeState = getAgentRuntimeStateByAgentId;
export const updateAgentRuntimeState = upsertAgentRuntimeState;
export const listAgentRunsByAgent = listAgentRunsByAgentId;
export const seedDefaultAgentConfigs = seedDefaultAgentDataIfEmpty;
