import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { campaigns as demoCampaigns } from "../lib/data/demo-data";
import { ensureApprovalItemsForCampaign as ensureApprovalItemsForCampaignHelper, resolveCampaignLibraryLinks } from "./linking";

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

const approvalOwner = v.union(v.literal("bari"), v.literal("blue"), v.literal("internal"), v.literal("none"));
const approvalStatus = v.union(v.literal("pending"), v.literal("approved"), v.literal("approved_with_changes"), v.literal("changes_requested"), v.literal("rejected"), v.literal("blocked"));

const campaignPatchValidator = v.object({
  name: v.optional(v.string()),
  type: v.optional(v.string()),
  goal: v.optional(v.string()),
  channels: v.optional(v.array(v.string())),
  audience: v.optional(v.string()),
  audienceId: v.optional(v.string()),
  offer: v.optional(v.string()),
  offerId: v.optional(v.string()),
  primaryCta: v.optional(v.string()),
  sendWindow: v.optional(v.string()),
  successMetric: v.optional(v.string()),
  allowedClaims: v.optional(v.array(v.string())),
  knownExclusions: v.optional(v.array(v.string())),
  sourceMapping: v.optional(v.string()),
  keapTagMapping: v.optional(v.string()),
  ownerId: v.optional(v.string()),
  ownerName: v.optional(v.string()),
  stage: v.optional(v.string()),
  status: v.optional(campaignStatus),
  riskLevel: v.optional(v.union(v.literal("green"), v.literal("yellow"), v.literal("red"))),
  pendingApprovals: v.optional(v.array(approvalOwner)),
  bariApprovalRequired: v.optional(v.boolean()),
  blueApprovalRequired: v.optional(v.boolean()),
  internalApprovalRequired: v.optional(v.boolean()),
  bariApprovalStatus: v.optional(approvalStatus),
  blueApprovalStatus: v.optional(approvalStatus),
  internalApprovalStatus: v.optional(approvalStatus),
  copyStatus: v.optional(v.string()),
  keapPrepStatus: v.optional(v.string()),
  responseStatus: v.optional(v.string()),
  learningStatus: v.optional(v.string()),
  nextAction: v.optional(v.string()),
  lastActivityAt: v.optional(v.number()),
  sortOrder: v.optional(v.number()),
  archived: v.optional(v.boolean()),
  notes: v.optional(v.string()),
});

function stripSystemFields<T extends Record<string, unknown>>(record: T | null | undefined) {
  if (!record) return {};
  const rest = { ...(record as T & { _id?: unknown; _creationTime?: unknown }) };
  delete rest._id;
  delete rest._creationTime;
  return rest;
}

function sanitizeCampaignRecord(record: Record<string, unknown>) {
  const next = {
    campaignId: record.campaignId,
    name: record.name,
    type: record.type,
    goal: record.goal,
    channels: record.channels,
    audience: record.audience,
    audienceId: record.audienceId,
    offer: record.offer,
    offerId: record.offerId,
    primaryCta: record.primaryCta,
    sendWindow: record.sendWindow,
    successMetric: record.successMetric,
    allowedClaims: record.allowedClaims,
    knownExclusions: record.knownExclusions,
    sourceMapping: record.sourceMapping,
    keapTagMapping: record.keapTagMapping,
    ownerId: record.ownerId,
    ownerName: record.ownerName,
    stage: record.stage,
    status: record.status,
    riskLevel: record.riskLevel,
    pendingApprovals: record.pendingApprovals,
    bariApprovalRequired: record.bariApprovalRequired,
    blueApprovalRequired: record.blueApprovalRequired,
    internalApprovalRequired: record.internalApprovalRequired,
    bariApprovalStatus: record.bariApprovalStatus,
    blueApprovalStatus: record.blueApprovalStatus,
    internalApprovalStatus: record.internalApprovalStatus,
    copyStatus: record.copyStatus,
    keapPrepStatus: record.keapPrepStatus,
    responseStatus: record.responseStatus,
    learningStatus: record.learningStatus,
    nextAction: record.nextAction,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    lastActivityAt: record.lastActivityAt,
    sortOrder: record.sortOrder,
    archived: record.archived,
    notes: record.notes,
  } satisfies Record<string, unknown>;

  return Object.fromEntries(Object.entries(next).filter(([, value]) => value !== undefined));
}

function sortByActivity(left: { sortOrder: number; updatedAt: number }, right: { sortOrder: number; updatedAt: number }) {
  if (left.sortOrder !== right.sortOrder) return left.sortOrder - right.sortOrder;
  return right.updatedAt - left.updatedAt;
}

function defaultSeedRecord(campaign: (typeof demoCampaigns)[number]) {
  return sanitizeCampaignRecord({
    campaignId: campaign.id,
    name: campaign.name,
    type: campaign.type,
    goal: campaign.goal,
    channels: campaign.channels,
    audience: campaign.audience,
    audienceId: campaign.audienceId,
    offer: campaign.offer,
    offerId: campaign.offerId,
    primaryCta: campaign.primaryCta,
    sendWindow: campaign.sendWindow,
    successMetric: campaign.successMetric,
    allowedClaims: campaign.allowedClaims,
    knownExclusions: campaign.knownExclusions,
    sourceMapping: campaign.sourceMapping,
    keapTagMapping: campaign.keapTagMapping,
    ownerId: campaign.ownerId,
    ownerName: campaign.ownerName,
    stage: campaign.stage,
    status: campaign.status,
    riskLevel: campaign.riskLevel,
    pendingApprovals: campaign.pendingApprovals,
    bariApprovalRequired: campaign.bariApprovalRequired,
    blueApprovalRequired: campaign.blueApprovalRequired,
    internalApprovalRequired: campaign.internalApprovalRequired,
    bariApprovalStatus: campaign.bariApprovalStatus,
    blueApprovalStatus: campaign.blueApprovalStatus,
    internalApprovalStatus: campaign.internalApprovalStatus,
    copyStatus: campaign.copyStatus,
    keapPrepStatus: campaign.keapPrepStatus,
    responseStatus: campaign.responseStatus,
    learningStatus: campaign.learningStatus,
    nextAction: campaign.nextAction,
    createdAt: Date.parse(campaign.createdAt),
    updatedAt: Date.parse(campaign.updatedAt),
    lastActivityAt: campaign.lastActivityAt ? Date.parse(campaign.lastActivityAt) : Date.parse(campaign.updatedAt),
    sortOrder: campaign.sortOrder,
    archived: campaign.archived,
    notes: campaign.notes,
  });
}

export const listCampaignRecords = query({
  args: {},
  handler: async (ctx) => {
    const items = await ctx.db.query("campaigns").collect();
    return items.sort(sortByActivity);
  },
});

export const getCampaignRecordByCampaignId = query({
  args: { campaignId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db.query("campaigns").withIndex("by_campaign_id", (q) => q.eq("campaignId", args.campaignId)).unique();
  },
});

export const listCampaignRecordsByStage = query({
  args: { status: campaignStatus },
  handler: async (ctx, args) => {
    const items = await ctx.db.query("campaigns").withIndex("by_status", (q) => q.eq("status", args.status)).collect();
    return items.sort(sortByActivity);
  },
});

export const listActiveCampaignRecords = query({
  args: {},
  handler: async (ctx) => {
    const items = await ctx.db.query("campaigns").collect();
    return items.filter((item) => !item.archived && item.status !== "archived").sort(sortByActivity);
  },
});

export const seedDefaultCampaignRecordsIfEmpty = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("campaigns").collect();
    if (existing.length) return { seeded: false, inserted: 0 };

    for (const campaign of demoCampaigns) {
      await ctx.db.insert("campaigns", defaultSeedRecord(campaign) as never);
    }

    return { seeded: true, inserted: demoCampaigns.length };
  },
});

export const createCampaignRecord = mutation({
  args: {
    campaignId: v.string(),
    patch: campaignPatchValidator,
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query("campaigns").withIndex("by_campaign_id", (q) => q.eq("campaignId", args.campaignId)).unique();
    if (existing) {
      throw new Error("Campaign already exists");
    }

    const now = Date.now();
    const resolvedLinks = await resolveCampaignLibraryLinks(ctx, {
      audience: args.patch.audience,
      audienceId: args.patch.audienceId,
      offer: args.patch.offer,
      offerId: args.patch.offerId,
    });
    const next = sanitizeCampaignRecord({
      campaignId: args.campaignId,
      name: args.patch.name ?? "Untitled campaign",
      type: args.patch.type ?? "campaign",
      goal: args.patch.goal ?? "Campaign goal",
      channels: args.patch.channels ?? ["email"],
      audience: args.patch.audience ?? "Unspecified audience",
      audienceId: resolvedLinks.audienceId,
      offer: args.patch.offer ?? "No offer selected",
      offerId: resolvedLinks.offerId,
      primaryCta: args.patch.primaryCta,
      sendWindow: args.patch.sendWindow,
      successMetric: args.patch.successMetric,
      allowedClaims: args.patch.allowedClaims ?? [],
      knownExclusions: args.patch.knownExclusions ?? [],
      sourceMapping: args.patch.sourceMapping,
      keapTagMapping: args.patch.keapTagMapping,
      ownerId: args.patch.ownerId ?? "user_operator",
      ownerName: args.patch.ownerName ?? "Morgan Operator",
      stage: args.patch.stage ?? "Intake",
      status: args.patch.status ?? "intake_draft",
      riskLevel: args.patch.riskLevel ?? "green",
      pendingApprovals: args.patch.pendingApprovals ?? [],
      bariApprovalRequired: args.patch.bariApprovalRequired ?? false,
      blueApprovalRequired: args.patch.blueApprovalRequired ?? false,
      internalApprovalRequired: args.patch.internalApprovalRequired ?? false,
      bariApprovalStatus: args.patch.bariApprovalStatus,
      blueApprovalStatus: args.patch.blueApprovalStatus,
      internalApprovalStatus: args.patch.internalApprovalStatus,
      copyStatus: args.patch.copyStatus,
      keapPrepStatus: args.patch.keapPrepStatus,
      responseStatus: args.patch.responseStatus,
      learningStatus: args.patch.learningStatus,
      nextAction: args.patch.nextAction ?? "Complete campaign intake.",
      createdAt: now,
      updatedAt: now,
      lastActivityAt: now,
      sortOrder: args.patch.sortOrder ?? now,
      archived: args.patch.archived ?? false,
      notes: args.patch.notes,
    });

    await ctx.db.insert("campaigns", next as never);
    await ensureApprovalItemsForCampaignHelper(ctx, args.campaignId);
    return { success: true as const, campaignId: args.campaignId };
  },
});

export const upsertCampaignRecord = mutation({
  args: {
    campaignId: v.string(),
    patch: campaignPatchValidator,
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query("campaigns").withIndex("by_campaign_id", (q) => q.eq("campaignId", args.campaignId)).unique();
    const now = Date.now();
    const base = stripSystemFields(existing) as Record<string, unknown>;
    const resolvedLinks = await resolveCampaignLibraryLinks(ctx, {
      audience: typeof args.patch.audience === "string" ? args.patch.audience : typeof base.audience === "string" ? base.audience : undefined,
      audienceId: typeof args.patch.audienceId === "string" ? args.patch.audienceId : typeof base.audienceId === "string" ? base.audienceId : undefined,
      offer: typeof args.patch.offer === "string" ? args.patch.offer : typeof base.offer === "string" ? base.offer : undefined,
      offerId: typeof args.patch.offerId === "string" ? args.patch.offerId : typeof base.offerId === "string" ? base.offerId : undefined,
    });
    const next = sanitizeCampaignRecord({
      ...base,
      ...args.patch,
      audienceId: resolvedLinks.audienceId,
      offerId: resolvedLinks.offerId,
      campaignId: args.campaignId,
      createdAt: typeof base.createdAt === "number" ? base.createdAt : now,
      updatedAt: now,
      lastActivityAt: now,
      sortOrder: typeof base.sortOrder === "number" ? base.sortOrder : now,
    });

    if (existing?._id) {
      await ctx.db.patch(existing._id, next as never);
      await ensureApprovalItemsForCampaignHelper(ctx, args.campaignId);
      return { success: true as const, mode: "updated" as const, campaignId: args.campaignId };
    }

    await ctx.db.insert("campaigns", next as never);
    await ensureApprovalItemsForCampaignHelper(ctx, args.campaignId);
    return { success: true as const, mode: "inserted" as const, campaignId: args.campaignId };
  },
});

export const ensureApprovalItemsForCampaign = mutation({
  args: { campaignId: v.string() },
  handler: async (ctx, args) => {
    return await ensureApprovalItemsForCampaignHelper(ctx, args.campaignId);
  },
});

export const updateCampaignStage = mutation({
  args: {
    campaignId: v.string(),
    stage: v.string(),
    status: campaignStatus,
    nextAction: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query("campaigns").withIndex("by_campaign_id", (q) => q.eq("campaignId", args.campaignId)).unique();
    if (!existing) throw new Error("Campaign not found");
    await ctx.db.patch(existing._id, sanitizeCampaignRecord({
      ...stripSystemFields(existing),
      stage: args.stage,
      status: args.status,
      nextAction: args.nextAction ?? existing.nextAction,
      updatedAt: Date.now(),
      lastActivityAt: Date.now(),
    }) as never);
    return { success: true as const, campaignId: args.campaignId };
  },
});

export const updateCampaignStatus = mutation({
  args: {
    campaignId: v.string(),
    status: campaignStatus,
    riskLevel: v.optional(v.union(v.literal("green"), v.literal("yellow"), v.literal("red"))),
    nextAction: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query("campaigns").withIndex("by_campaign_id", (q) => q.eq("campaignId", args.campaignId)).unique();
    if (!existing) throw new Error("Campaign not found");
    await ctx.db.patch(existing._id, sanitizeCampaignRecord({
      ...stripSystemFields(existing),
      status: args.status,
      riskLevel: args.riskLevel ?? existing.riskLevel,
      nextAction: args.nextAction ?? existing.nextAction,
      updatedAt: Date.now(),
      lastActivityAt: Date.now(),
    }) as never);
    return { success: true as const, campaignId: args.campaignId };
  },
});
