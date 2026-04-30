import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const riskLevel = v.union(v.literal("green"), v.literal("yellow"), v.literal("red"));
const approvalOwner = v.union(v.literal("bari"), v.literal("blue"), v.literal("internal"), v.literal("none"));
const approvalStatus = v.union(v.literal("pending"), v.literal("approved"), v.literal("approved_with_changes"), v.literal("changes_requested"), v.literal("rejected"), v.literal("blocked"));
const campaignStatus = v.union(
  v.literal("intake_draft"),
  v.literal("agent_drafting"),
  v.literal("needs_internal_review"),
  v.literal("needs_bari_review"),
  v.literal("needs_blue_review"),
  v.literal("blocked"),
  v.literal("approved"),
  v.literal("ready_for_keap"),
  v.literal("scheduled"),
  v.literal("sent"),
  v.literal("reporting"),
  v.literal("learning_complete"),
  v.literal("archived"),
);

export default defineSchema({
  users: defineTable({
    clerkUserId: v.optional(v.string()),
    name: v.string(),
    email: v.string(),
    roles: v.array(v.string()),
    avatarInitials: v.string(),
  }).index("by_email", ["email"]),

  campaigns: defineTable({
    name: v.string(),
    goal: v.string(),
    channels: v.array(v.string()),
    audience: v.string(),
    offerId: v.optional(v.id("libraryItems")),
    ownerId: v.optional(v.id("users")),
    status: campaignStatus,
    riskLevel,
    pendingApprovals: v.array(approvalOwner),
    nextAction: v.string(),
    updatedAt: v.number(),
  }).index("by_status", ["status"]),

  approvalItems: defineTable({
    campaignId: v.id("campaigns"),
    owner: approvalOwner,
    title: v.string(),
    reason: v.string(),
    status: approvalStatus,
    riskLevel,
    recommendedDecision: v.string(),
    notes: v.optional(v.string()),
  }).index("by_owner_status", ["owner", "status"]),

  libraryItems: defineTable({
    type: v.union(v.literal("offer"), v.literal("lead_magnet"), v.literal("email"), v.literal("voice_rule"), v.literal("signoff"), v.literal("audience"), v.literal("compliance_rule"), v.literal("learning")),
    name: v.string(),
    status: v.string(),
    summary: v.string(),
    tags: v.array(v.string()),
    riskLevel: v.optional(riskLevel),
    payload: v.optional(v.any()),
  }).index("by_type", ["type"]),

  agentConfigs: defineTable({
    name: v.string(),
    purpose: v.string(),
    model: v.string(),
    inputs: v.array(v.string()),
    outputs: v.array(v.string()),
    status: v.union(v.literal("ready"), v.literal("needs_config"), v.literal("demo")),
  }),

  agentRuns: defineTable({
    campaignId: v.optional(v.id("campaigns")),
    status: v.string(),
    startedAt: v.number(),
    completedAt: v.optional(v.number()),
  }).index("by_campaign", ["campaignId"]),

  agentRunSteps: defineTable({
    runId: v.id("agentRuns"),
    agentName: v.string(),
    status: v.string(),
    riskLevel,
    confidence: v.number(),
    summary: v.string(),
    approvalRequired: v.boolean(),
    approvalOwner,
    structuredOutputs: v.any(),
  }).index("by_run", ["runId"]),

  langGraphNodes: defineTable({
    runId: v.optional(v.id("agentRuns")),
    label: v.string(),
    status: v.union(v.literal("complete"), v.literal("pending"), v.literal("blocked"), v.literal("human_pause")),
    next: v.array(v.string()),
    inputSnapshot: v.optional(v.any()),
    outputSnapshot: v.optional(v.any()),
  }).index("by_run", ["runId"]),

  integrationConnections: defineTable({
    name: v.string(),
    purpose: v.string(),
    status: v.union(v.literal("connected"), v.literal("disconnected"), v.literal("missing_credentials"), v.literal("manual_mode"), v.literal("error")),
    envKeys: v.array(v.string()),
    fallback: v.string(),
    lastSync: v.optional(v.number()),
  }).index("by_status", ["status"]),

  responseClassifications: defineTable({
    campaignId: v.optional(v.id("campaigns")),
    classification: v.string(),
    intent: v.string(),
    sentiment: v.union(v.literal("positive"), v.literal("neutral"), v.literal("negative")),
    urgency: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
    summary: v.string(),
    matchConfidence: v.number(),
  }).index("by_campaign", ["campaignId"]),

  performanceSnapshots: defineTable({
    campaignId: v.id("campaigns"),
    sent: v.number(),
    delivered: v.number(),
    openRate: v.number(),
    clickRate: v.number(),
    replies: v.number(),
    conversions: v.number(),
    summary: v.string(),
  }).index("by_campaign", ["campaignId"]),

  learningInsights: defineTable({
    source: v.string(),
    status: v.union(v.literal("candidate"), v.literal("approved"), v.literal("rejected"), v.literal("archived")),
    title: v.string(),
    summary: v.string(),
    confidence: v.number(),
  }).index("by_status", ["status"]),

  auditLogs: defineTable({
    actor: v.string(),
    action: v.string(),
    target: v.string(),
    createdAt: v.number(),
  }).index("by_created_at", ["createdAt"]),
});
