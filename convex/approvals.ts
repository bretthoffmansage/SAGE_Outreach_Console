import { v } from "convex/values";
import { mutation, query, type MutationCtx } from "./_generated/server";
import { approvals } from "../lib/data/demo-data";
import {
  ensureTodayTasksForPendingApprovals as ensureTodayTasksForPendingApprovalsHelper,
  syncCampaignAfterApprovalDecision,
  type ApprovalRecord,
} from "./linking";

const reviewQueue = v.union(v.literal("bari"), v.literal("blue"), v.literal("internal"));
const approvalStatus = v.union(v.literal("pending"), v.literal("approved"), v.literal("approved_with_changes"), v.literal("changes_requested"), v.literal("rejected"), v.literal("blocked"));
const approvalPatchValidator = v.object({
  type: v.optional(v.string()),
  owner: v.optional(reviewQueue),
  queue: v.optional(reviewQueue),
  linkedCampaignId: v.optional(v.string()),
  linkedCampaignName: v.optional(v.string()),
  title: v.optional(v.string()),
  description: v.optional(v.string()),
  context: v.optional(v.string()),
  actionNeeded: v.optional(v.string()),
  status: v.optional(approvalStatus),
  riskLevel: v.optional(v.union(v.literal("green"), v.literal("yellow"), v.literal("red"))),
  recommendedDecision: v.optional(v.string()),
  selectedSignoff: v.optional(v.string()),
  subjectLine: v.optional(v.string()),
  previewText: v.optional(v.string()),
  bodyText: v.optional(v.string()),
  editedSubjectLine: v.optional(v.string()),
  editedPreviewText: v.optional(v.string()),
  editedBodyText: v.optional(v.string()),
  notes: v.optional(v.string()),
  decisionNotes: v.optional(v.string()),
  requestedChanges: v.optional(v.string()),
  decidedAt: v.optional(v.number()),
  decidedBy: v.optional(v.string()),
  sortOrder: v.optional(v.number()),
});

function stripSystemFields<T extends Record<string, unknown>>(record: T | null | undefined) {
  if (!record) return {};
  const rest = { ...(record as T & { _id?: unknown; _creationTime?: unknown }) };
  delete rest._id;
  delete rest._creationTime;
  return rest;
}

function sanitizeApprovalItem(record: Record<string, unknown>) {
  const next = {
    approvalId: record.approvalId,
    type: record.type,
    owner: record.owner,
    queue: record.queue,
    linkedCampaignId: record.linkedCampaignId,
    linkedCampaignName: record.linkedCampaignName,
    title: record.title,
    description: record.description,
    context: record.context,
    actionNeeded: record.actionNeeded,
    status: record.status,
    riskLevel: record.riskLevel,
    recommendedDecision: record.recommendedDecision,
    selectedSignoff: record.selectedSignoff,
    subjectLine: record.subjectLine,
    previewText: record.previewText,
    bodyText: record.bodyText,
    editedSubjectLine: record.editedSubjectLine,
    editedPreviewText: record.editedPreviewText,
    editedBodyText: record.editedBodyText,
    notes: record.notes,
    decisionNotes: record.decisionNotes,
    requestedChanges: record.requestedChanges,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    decidedAt: record.decidedAt,
    decidedBy: record.decidedBy,
    sortOrder: record.sortOrder,
  } satisfies Record<string, unknown>;

  return Object.fromEntries(Object.entries(next).filter(([, value]) => value !== undefined));
}

function sortByPendingThenOrder(left: { status: string; sortOrder: number; updatedAt: number }, right: { status: string; sortOrder: number; updatedAt: number }) {
  if (left.status === "pending" && right.status !== "pending") return -1;
  if (left.status !== "pending" && right.status === "pending") return 1;
  if (left.sortOrder !== right.sortOrder) return left.sortOrder - right.sortOrder;
  return right.updatedAt - left.updatedAt;
}

function payloadForSeed(item: (typeof approvals)[number], index: number) {
  const now = Date.now() - (approvals.length - index) * 1000;
  const shared = {
    approvalId: item.id,
    type: item.owner === "bari" ? "copy_review" : item.owner === "blue" ? "strategic_review" : "readiness_check",
    owner: item.owner,
    queue: item.owner,
    linkedCampaignId: item.campaignId,
    linkedCampaignName: item.campaignName,
    title: item.title,
    description: item.reason,
    context: item.owner === "bari"
      ? "Founder-signed email needs final voice review before release."
      : item.owner === "blue"
        ? "Strategic claims and positioning need approval before internal readiness."
        : "Operational handoff needs validation before export or send.",
    actionNeeded: item.title,
    status: item.status,
    riskLevel: item.riskLevel,
    recommendedDecision: item.recommendedDecision,
    createdAt: now,
    updatedAt: now,
    sortOrder: index,
  };

  if (item.owner === "bari") {
    return sanitizeApprovalItem({
      ...shared,
      subjectLine: "You can do this, and SAGE can help you start cleanly.",
      previewText: "A grounded note from Bari with one low-pressure next step.",
      bodyText: "Short paragraph rhythm, direct encouragement, and clear CTA scaffolding appear here as editable seeded content.",
      selectedSignoff: "You can do this — Bari",
      notes: "",
    });
  }

  if (item.owner === "blue") {
    return sanitizeApprovalItem({
      ...shared,
      notes: "",
      decisionNotes: "",
    });
  }

  return sanitizeApprovalItem({
    ...shared,
    notes: "Confirm export package, validate audience mapping, and keep handoff notes attached.",
  });
}

async function createApprovalEvent(ctx: MutationCtx, args: {
  approvalId: string;
  decision: "approved" | "approved_with_changes" | "changes_requested" | "rejected";
  note?: string;
  actor: string;
  snapshotJson?: string;
}) {
  await ctx.db.insert("approvalEvents", {
    eventId: `evt_${args.approvalId}_${Date.now()}`,
    approvalId: args.approvalId,
    decision: args.decision,
    note: args.note,
    actor: args.actor,
    createdAt: Date.now(),
    snapshotJson: args.snapshotJson,
  });
}

export const listApprovalItems = query({
  args: {},
  handler: async (ctx) => {
    const items = await ctx.db.query("approvalItems").collect();
    return items.sort(sortByPendingThenOrder);
  },
});

export const listApprovalItemsByOwner = query({
  args: { owner: reviewQueue },
  handler: async (ctx, args) => {
    const items = await ctx.db.query("approvalItems").withIndex("by_owner_status", (q) => q.eq("owner", args.owner)).collect();
    return items.sort(sortByPendingThenOrder);
  },
});

export const listPendingApprovalItems = query({
  args: {},
  handler: async (ctx) => {
    const items = await ctx.db.query("approvalItems").collect();
    return items.filter((item) => item.status === "pending").sort(sortByPendingThenOrder);
  },
});

export const getApprovalItemByApprovalId = query({
  args: { approvalId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db.query("approvalItems").withIndex("by_approval_id", (q) => q.eq("approvalId", args.approvalId)).unique();
  },
});

export const listApprovalEventsByApprovalId = query({
  args: { approvalId: v.string() },
  handler: async (ctx, args) => {
    const items = await ctx.db.query("approvalEvents").withIndex("by_approval_id", (q) => q.eq("approvalId", args.approvalId)).collect();
    return items.sort((left, right) => right.createdAt - left.createdAt);
  },
});

export const seedDefaultApprovalItemsIfEmpty = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("approvalItems").collect();
    if (existing.length) return { seeded: false, inserted: 0 };

    for (const [index, item] of approvals.entries()) {
      await ctx.db.insert("approvalItems", payloadForSeed(item, index) as never);
    }

    const seededApprovals = await ctx.db.query("approvalItems").collect();
    await ensureTodayTasksForPendingApprovalsHelper(ctx, seededApprovals);

    return { seeded: true, inserted: approvals.length };
  },
});

export const upsertApprovalItem = mutation({
  args: { approvalId: v.string(), patch: approvalPatchValidator },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query("approvalItems").withIndex("by_approval_id", (q) => q.eq("approvalId", args.approvalId)).unique();
    const base = stripSystemFields(existing) as Record<string, unknown>;
    const now = Date.now();
    const next = sanitizeApprovalItem({
      ...base,
      ...args.patch,
      approvalId: args.approvalId,
      createdAt: typeof base.createdAt === "number" ? base.createdAt : now,
      updatedAt: now,
      sortOrder: typeof base.sortOrder === "number" ? base.sortOrder : 0,
    });

    if (existing?._id) {
      await ctx.db.patch(existing._id, next as never);
      await ensureTodayTasksForPendingApprovalsHelper(ctx, [next as ApprovalRecord]);
      return { success: true as const, mode: "updated" as const, approvalId: args.approvalId };
    }

    await ctx.db.insert("approvalItems", next as never);
    await ensureTodayTasksForPendingApprovalsHelper(ctx, [next as ApprovalRecord]);
    return { success: true as const, mode: "inserted" as const, approvalId: args.approvalId };
  },
});

async function mutateDecision(
  ctx: MutationCtx,
  args: {
    approvalId: string;
    status: "approved" | "approved_with_changes" | "changes_requested" | "rejected";
    actor: string;
    decisionNotes?: string;
    requestedChanges?: string;
    editedSubjectLine?: string;
    editedPreviewText?: string;
    editedBodyText?: string;
    selectedSignoff?: string;
    notes?: string;
  },
) {
  const existing = await ctx.db.query("approvalItems").withIndex("by_approval_id", (q) => q.eq("approvalId", args.approvalId)).unique();
  if (!existing) {
    throw new Error("Approval item not found");
  }

  const now = Date.now();
  const next = sanitizeApprovalItem({
    ...stripSystemFields(existing),
    status: args.status,
    updatedAt: now,
    decidedAt: now,
    decidedBy: args.actor,
    decisionNotes: args.decisionNotes ?? existing.decisionNotes,
    requestedChanges: args.requestedChanges ?? existing.requestedChanges,
    editedSubjectLine: args.editedSubjectLine ?? existing.editedSubjectLine,
    editedPreviewText: args.editedPreviewText ?? existing.editedPreviewText,
    editedBodyText: args.editedBodyText ?? existing.editedBodyText,
    selectedSignoff: args.selectedSignoff ?? existing.selectedSignoff,
    notes: args.notes ?? existing.notes,
  });

  await ctx.db.patch(existing._id, next as never);
  await createApprovalEvent(ctx, {
    approvalId: args.approvalId,
    decision: args.status,
    note: args.decisionNotes ?? args.requestedChanges ?? args.notes,
    actor: args.actor,
    snapshotJson: JSON.stringify(next),
  });

  await syncCampaignAfterApprovalDecision(ctx, next as ApprovalRecord, args.status);
  await ensureTodayTasksForPendingApprovalsHelper(ctx, [next as ApprovalRecord]);

  return { success: true as const, approvalId: args.approvalId, status: args.status };
}

export const ensureTodayTasksForPendingApprovals = mutation({
  args: {},
  handler: async (ctx) => {
    const approvals = await ctx.db.query("approvalItems").collect();
    await ensureTodayTasksForPendingApprovalsHelper(ctx, approvals);
    return { success: true as const, ensured: approvals.length };
  },
});

export const approveApprovalItem = mutation({
  args: {
    approvalId: v.string(),
    actor: v.string(),
    decisionNotes: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => mutateDecision(ctx, { ...args, status: "approved" }),
});

export const approveApprovalItemWithEdits = mutation({
  args: {
    approvalId: v.string(),
    actor: v.string(),
    decisionNotes: v.optional(v.string()),
    notes: v.optional(v.string()),
    editedSubjectLine: v.optional(v.string()),
    editedPreviewText: v.optional(v.string()),
    editedBodyText: v.optional(v.string()),
    selectedSignoff: v.optional(v.string()),
  },
  handler: async (ctx, args) => mutateDecision(ctx, { ...args, status: "approved_with_changes" }),
});

export const requestApprovalChanges = mutation({
  args: {
    approvalId: v.string(),
    actor: v.string(),
    requestedChanges: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => mutateDecision(ctx, { ...args, status: "changes_requested" }),
});

export const rejectApprovalItem = mutation({
  args: {
    approvalId: v.string(),
    actor: v.string(),
    decisionNotes: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => mutateDecision(ctx, { ...args, status: "rejected" }),
});
