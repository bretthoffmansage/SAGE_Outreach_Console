import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { integrations as demoIntegrations } from "../lib/data/demo-data";

const integrationStatus = v.union(v.literal("connected"), v.literal("disconnected"), v.literal("missing_credentials"), v.literal("manual_mode"), v.literal("error"), v.literal("demo_fallback"), v.literal("not_configured"));

const integrationPatchValidator = v.object({
  name: v.optional(v.string()),
  provider: v.optional(v.string()),
  category: v.optional(v.string()),
  purpose: v.optional(v.string()),
  description: v.optional(v.string()),
  status: v.optional(integrationStatus),
  statusLabel: v.optional(v.string()),
  envKeys: v.optional(v.array(v.string())),
  configuredEnvVars: v.optional(v.array(v.string())),
  missingEnvVars: v.optional(v.array(v.string())),
  fallback: v.optional(v.string()),
  lastCheckAt: v.optional(v.number()),
  lastCheckResult: v.optional(v.string()),
  setupNotes: v.optional(v.string()),
  setupInstructions: v.optional(v.string()),
  healthSummary: v.optional(v.string()),
  enabled: v.optional(v.boolean()),
  sortOrder: v.optional(v.number()),
  lastSync: v.optional(v.number()),
  notes: v.optional(v.string()),
});

function stripSystemFields<T extends Record<string, unknown>>(record: T | null | undefined) {
  if (!record) return {};
  const rest = { ...(record as T & { _id?: unknown; _creationTime?: unknown }) };
  delete rest._id;
  delete rest._creationTime;
  return rest;
}

function sanitizeIntegrationRecord(record: Record<string, unknown>) {
  const next = {
    integrationId: record.integrationId,
    name: record.name,
    provider: record.provider,
    category: record.category,
    purpose: record.purpose,
    description: record.description,
    status: record.status,
    statusLabel: record.statusLabel,
    envKeys: record.envKeys,
    configuredEnvVars: record.configuredEnvVars,
    missingEnvVars: record.missingEnvVars,
    fallback: record.fallback,
    lastCheckAt: record.lastCheckAt,
    lastCheckResult: record.lastCheckResult,
    setupNotes: record.setupNotes,
    setupInstructions: record.setupInstructions,
    healthSummary: record.healthSummary,
    enabled: record.enabled,
    sortOrder: record.sortOrder,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    lastSync: record.lastSync,
    notes: record.notes,
  } satisfies Record<string, unknown>;

  return Object.fromEntries(Object.entries(next).filter(([, value]) => value !== undefined));
}

function sortByOrder(left: { sortOrder: number; updatedAt: number }, right: { sortOrder: number; updatedAt: number }) {
  if (left.sortOrder !== right.sortOrder) return left.sortOrder - right.sortOrder;
  return right.updatedAt - left.updatedAt;
}

function seedPayload(item: (typeof demoIntegrations)[number]) {
  return sanitizeIntegrationRecord({
    integrationId: item.id,
    name: item.name,
    provider: item.provider,
    category: item.category,
    purpose: item.purpose,
    description: item.description,
    status: item.status,
    statusLabel: item.statusLabel,
    envKeys: item.envKeys,
    configuredEnvVars: item.configuredEnvVars,
    missingEnvVars: item.missingEnvVars,
    fallback: item.fallback,
    lastCheckAt: item.lastSync ? Date.parse(item.lastSync) : undefined,
    lastCheckResult: item.lastCheckResult,
    setupNotes: item.setupNotes,
    setupInstructions: item.setupInstructions,
    healthSummary: item.healthSummary,
    enabled: item.enabled,
    sortOrder: item.sortOrder,
    createdAt: Date.parse(item.createdAt),
    updatedAt: Date.parse(item.updatedAt),
    lastSync: item.lastSync ? Date.parse(item.lastSync) : undefined,
    notes: item.notes,
  });
}

function statusLabelFor(status: string) {
  return status.replace(/_/g, " ");
}

export const listIntegrationRecords = query({
  args: {},
  handler: async (ctx) => {
    const items = await ctx.db.query("integrationConnections").collect();
    return items.sort(sortByOrder);
  },
});

export const getIntegrationRecordByIntegrationId = query({
  args: { integrationId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db.query("integrationConnections").withIndex("by_integration_id", (q) => q.eq("integrationId", args.integrationId)).unique();
  },
});

export const getOverallSystemHealth = query({
  args: {},
  handler: async (ctx) => {
    const items = await ctx.db.query("integrationConnections").collect();
    const hasError = items.some((item) => item.status === "error");
    const hasMissing = items.some((item) => item.status === "missing_credentials");
    const connected = items.filter((item) => item.status === "connected").length;
    const fallback = items.filter((item) => item.status === "manual_mode" || item.status === "demo_fallback").length;
    return {
      status: hasError ? "error" : hasMissing ? "warning" : "healthy",
      connected,
      fallback,
      total: items.length,
      summary: hasError ? "One or more integrations report errors." : hasMissing ? "Some integrations are missing required environment variables." : "Critical integrations are configured or using manual fallback.",
    };
  },
});

export const seedDefaultIntegrationRecordsIfEmpty = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("integrationConnections").collect();
    if (existing.length) return { seeded: false, inserted: 0 };

    for (const item of demoIntegrations) {
      await ctx.db.insert("integrationConnections", seedPayload(item) as never);
    }

    return { seeded: true, inserted: demoIntegrations.length };
  },
});

export const upsertIntegrationRecord = mutation({
  args: { integrationId: v.string(), patch: integrationPatchValidator },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query("integrationConnections").withIndex("by_integration_id", (q) => q.eq("integrationId", args.integrationId)).unique();
    const now = Date.now();
    const base = stripSystemFields(existing) as Record<string, unknown>;
    const next = sanitizeIntegrationRecord({
      ...base,
      ...args.patch,
      integrationId: args.integrationId,
      createdAt: typeof base.createdAt === "number" ? base.createdAt : now,
      updatedAt: now,
      sortOrder: typeof base.sortOrder === "number" ? base.sortOrder : now,
    });

    if (existing?._id) {
      await ctx.db.patch(existing._id, next as never);
      return { success: true as const, mode: "updated" as const, integrationId: args.integrationId };
    }

    await ctx.db.insert("integrationConnections", next as never);
    return { success: true as const, mode: "inserted" as const, integrationId: args.integrationId };
  },
});

export const updateIntegrationStatus = mutation({
  args: {
    integrationId: v.string(),
    status: integrationStatus,
    statusLabel: v.optional(v.string()),
    lastCheckResult: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query("integrationConnections").withIndex("by_integration_id", (q) => q.eq("integrationId", args.integrationId)).unique();
    if (!existing) throw new Error("Integration not found");
    const now = Date.now();
    const next = sanitizeIntegrationRecord({
      ...stripSystemFields(existing),
      status: args.status,
      statusLabel: args.statusLabel ?? statusLabelFor(args.status),
      lastCheckAt: now,
      lastCheckResult: args.lastCheckResult ?? existing.lastCheckResult,
      notes: args.notes ?? existing.notes,
      updatedAt: now,
    });
    await ctx.db.patch(existing._id, next as never);
    return {
      success: true as const,
      integrationId: args.integrationId,
      status: next.status,
      statusLabel: next.statusLabel,
      lastCheckAt: now,
      lastCheckResult: next.lastCheckResult,
    };
  },
});

export const checkIntegrationConnectionDemo = mutation({
  args: { integrationId: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query("integrationConnections").withIndex("by_integration_id", (q) => q.eq("integrationId", args.integrationId)).unique();
    if (!existing) throw new Error("Integration not found");

    const envKeys = existing.envKeys ?? [];
    const configuredEnvVars = envKeys.filter((key) => Boolean(process.env[key]));
    const missingEnvVars = envKeys.filter((key) => !process.env[key]);

    let status = existing.status;
    let result = "Demo check recorded. Real credential validation not enabled yet.";
    if (configuredEnvVars.length === envKeys.length && envKeys.length > 0) {
      status = "connected";
      result = "Required environment variables detected.";
    } else if (missingEnvVars.length > 0) {
      if (existing.status === "manual_mode" || existing.status === "demo_fallback" || existing.status === "not_configured") {
        status = existing.status;
        result = "Manual fallback active. Missing required environment variables.";
      } else {
        status = "missing_credentials";
        result = "Missing required environment variables.";
      }
    }

    const now = Date.now();
    const next = sanitizeIntegrationRecord({
      ...stripSystemFields(existing),
      status,
      statusLabel: statusLabelFor(status),
      configuredEnvVars,
      missingEnvVars,
      lastCheckAt: now,
      lastCheckResult: result,
      healthSummary: result,
      updatedAt: now,
      lastSync: now,
    });

    await ctx.db.patch(existing._id, next as never);
    return {
      success: true as const,
      integrationId: args.integrationId,
      status,
      statusLabel: next.statusLabel,
      result,
      lastCheckAt: now,
      configuredEnvVars,
      missingEnvVars,
    };
  },
});

export const updateIntegrationNotes = mutation({
  args: { integrationId: v.string(), notes: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query("integrationConnections").withIndex("by_integration_id", (q) => q.eq("integrationId", args.integrationId)).unique();
    if (!existing) throw new Error("Integration not found");
    await ctx.db.patch(existing._id, sanitizeIntegrationRecord({
      ...stripSystemFields(existing),
      notes: args.notes,
      updatedAt: Date.now(),
    }) as never);
    return { success: true as const, integrationId: args.integrationId };
  },
});
