/* eslint-disable @typescript-eslint/no-explicit-any */

type CampaignRecord = {
  _id: unknown;
  campaignId: string;
  name: string;
  goal: string;
  audience: string;
  audienceId?: string;
  offer: string;
  offerId?: string;
  ownerName: string;
  stage: string;
  status:
    | "intake_draft"
    | "agent_drafting"
    | "needs_internal_review"
    | "needs_bari_review"
    | "needs_blue_review"
    | "blocked"
    | "approved"
    | "ready_for_keap"
    | "scheduled"
    | "sent"
    | "reporting"
    | "learning_complete"
    | "archived";
  riskLevel: "green" | "yellow" | "red";
  pendingApprovals: Array<"bari" | "blue" | "internal" | "none">;
  bariApprovalRequired: boolean;
  blueApprovalRequired: boolean;
  internalApprovalRequired: boolean;
  bariApprovalStatus?: string;
  blueApprovalStatus?: string;
  internalApprovalStatus?: string;
  copyStatus?: string;
  keapPrepStatus?: string;
  responseStatus?: string;
  learningStatus?: string;
  nextAction: string;
  createdAt: number;
  updatedAt: number;
  lastActivityAt?: number;
  sortOrder: number;
  archived?: boolean;
  notes?: string;
};

export type ApprovalRecord = {
  _id?: unknown;
  approvalId: string;
  owner: "bari" | "blue" | "internal";
  queue: "bari" | "blue" | "internal";
  linkedCampaignId?: string;
  linkedCampaignName: string;
  title: string;
  description: string;
  actionNeeded: string;
  status: "pending" | "approved" | "approved_with_changes" | "changes_requested" | "rejected" | "blocked";
  riskLevel: "green" | "yellow" | "red";
  recommendedDecision: string;
  context?: string;
  selectedSignoff?: string;
  subjectLine?: string;
  previewText?: string;
  bodyText?: string;
  editedSubjectLine?: string;
  editedPreviewText?: string;
  editedBodyText?: string;
  notes?: string;
  decisionNotes?: string;
  requestedChanges?: string;
  createdAt: number;
  updatedAt: number;
  decidedAt?: number;
  decidedBy?: string;
  sortOrder: number;
};

type ResponseRecord = {
  _id?: unknown;
  responseId: string;
  title: string;
  classification: string;
  status: string;
  sentiment: "positive" | "neutral" | "negative";
  urgency: "low" | "medium" | "high";
  summary: string;
  originalMessage?: string;
  senderName?: string;
  senderEmail?: string;
  receivedAt: number;
  campaignId?: string;
  campaignName?: string;
  matchConfidence?: number;
  recommendedAction: string;
  suggestedReply?: string;
  suggestedReplyStatus?: string;
  noAutoSend: boolean;
  assignedTo?: string;
  source?: string;
  sourceMessageId?: string;
  helpdeskThreadId?: string;
  tags: string[];
  createdAt: number;
  updatedAt: number;
  resolvedAt?: number;
  resolvedBy?: string;
  notes?: string;
  sortOrder: number;
};

function approvalTaskMetadata(owner: "bari" | "blue" | "internal") {
  if (owner === "bari") {
    return {
      category: "Bari Copy Review",
      sourceRoute: "/reviews/bari",
      sourceLabel: "Review / Bari Copy Review",
    };
  }
  if (owner === "blue") {
    return {
      category: "Blue Review",
      sourceRoute: "/reviews/blue",
      sourceLabel: "Review / Blue Review",
    };
  }
  return {
    category: "Internal Approval",
    sourceRoute: "/reviews/internal",
    sourceLabel: "Review / Internal Approvals",
  };
}

function stripSystemFields<T extends Record<string, unknown>>(record: T) {
  const next = { ...record } as T & { _id?: unknown; _creationTime?: unknown };
  delete next._id;
  delete next._creationTime;
  return next;
}

function approvalPriority(riskLevel: "green" | "yellow" | "red") {
  if (riskLevel === "red") return "red";
  if (riskLevel === "yellow") return "amber";
  return "green";
}

function computePendingApprovals(campaign: CampaignRecord) {
  const pending: Array<"bari" | "blue" | "internal"> = [];
  if (campaign.bariApprovalRequired && !["approved", "approved_with_changes"].includes(campaign.bariApprovalStatus ?? "")) pending.push("bari");
  if (campaign.blueApprovalRequired && !["approved", "approved_with_changes"].includes(campaign.blueApprovalStatus ?? "")) pending.push("blue");
  if (campaign.internalApprovalRequired && !["approved", "approved_with_changes"].includes(campaign.internalApprovalStatus ?? "")) pending.push("internal");
  return pending;
}

function nextActionForCampaign(campaign: CampaignRecord, pendingApprovals: Array<"bari" | "blue" | "internal">) {
  if (campaign.status === "blocked") return campaign.nextAction;
  if (pendingApprovals.includes("bari")) return "Bari founder-voice approval is still required.";
  if (pendingApprovals.includes("blue")) return "Blue strategic approval is still required.";
  if (pendingApprovals.includes("internal")) return "Internal send readiness approval is still required.";
  return campaign.keapPrepStatus === "Mapped"
    ? "Prepare manual Keap export and internal handoff."
    : "Finalize handoff mapping and prepare manual export.";
}

export async function resolveCampaignLibraryLinks(
  ctx: any,
  patch: {
    audience?: string;
    audienceId?: string;
    offer?: string;
    offerId?: string;
  },
) {
  const libraryItems = await ctx.db.query("libraryItems").collect();
  const audienceMatch =
    !patch.audienceId && patch.audience
      ? libraryItems.find((item: any) => item.type === "audience" && item.name.trim().toLowerCase() === patch.audience!.trim().toLowerCase())
      : null;
  const offerMatch =
    !patch.offerId && patch.offer
      ? libraryItems.find((item: any) => item.type !== "audience" && item.name.trim().toLowerCase() === patch.offer!.trim().toLowerCase())
      : null;

  return {
    audienceId: patch.audienceId ?? audienceMatch?.recordId,
    offerId: patch.offerId ?? offerMatch?.recordId,
  };
}

export async function ensureTodayTasksForPendingApprovals(ctx: any, approvalRecords?: ApprovalRecord[]) {
  const approvals = approvalRecords ?? await ctx.db.query("approvalItems").collect();
  const existingTasks = await ctx.db.query("todayTasks").collect();
  const now = Date.now();

  for (const approval of approvals) {
    const metadata = approvalTaskMetadata(approval.owner);
    const linkedTask = existingTasks.find(
      (task: any) =>
        task.taskId === `approval:${approval.approvalId}`
        || (task.sourceRoute === metadata.sourceRoute && task.title === approval.title),
    );

    const shouldBeCurrent = approval.status === "pending" || approval.status === "changes_requested";
    if (shouldBeCurrent) {
      if (!linkedTask) {
        await ctx.db.insert("todayTasks", {
          taskId: `approval:${approval.approvalId}`,
          title: approval.title,
          context: approval.linkedCampaignName || approval.description,
          category: metadata.category,
          priority: approvalPriority(approval.riskLevel),
          sourceRoute: metadata.sourceRoute,
          sourceLabel: metadata.sourceLabel,
          destinationMode: "review",
          status: "current",
          createdAt: now,
          sortOrder: now,
          updatedAt: now,
        });
        continue;
      }

      if (linkedTask.status !== "current") {
        const nextTask = {
          ...stripSystemFields(linkedTask),
          status: "current",
          updatedAt: now,
        };
        delete (nextTask as { completedAt?: unknown }).completedAt;
        await ctx.db.replace(linkedTask._id, nextTask);
      }
      continue;
    }

    if (linkedTask && linkedTask.status === "current") {
      await ctx.db.patch(linkedTask._id, {
        status: "completed",
        completedAt: now,
        updatedAt: now,
      });
    }
  }
}

export async function ensureApprovalItemsForCampaign(ctx: any, campaignId: string) {
  const campaign = await ctx.db.query("campaigns").withIndex("by_campaign_id", (q: any) => q.eq("campaignId", campaignId)).unique();
  if (!campaign) return { created: 0 };

  const existingApprovals = await ctx.db.query("approvalItems").collect();
  const requiredOwners = [
    ...(campaign.bariApprovalRequired ? (["bari"] as const) : []),
    ...(campaign.blueApprovalRequired ? (["blue"] as const) : []),
    ...(campaign.internalApprovalRequired ? (["internal"] as const) : []),
  ];

  let created = 0;
  for (const owner of requiredOwners) {
    const existing = existingApprovals.find((item: ApprovalRecord) => item.linkedCampaignId === campaignId && item.owner === owner);
    if (existing) continue;

    const approvalId = `campaign:${campaignId}:${owner}`;
    const title =
      owner === "bari"
        ? `Approve ${campaign.name} founder copy`
        : owner === "blue"
          ? `Review ${campaign.name} strategic positioning`
          : `Confirm ${campaign.name} send readiness`;
    const description =
      owner === "bari"
        ? `${campaign.name} needs founder-voice approval before release.`
        : owner === "blue"
          ? `${campaign.name} needs Blue review on positioning, claims, or urgency.`
          : `${campaign.name} needs internal handoff validation before export or send.`;

    await ctx.db.insert("approvalItems", {
      approvalId,
      type: owner === "bari" ? "copy_review" : owner === "blue" ? "strategic_review" : "readiness_check",
      owner,
      queue: owner,
      linkedCampaignId: campaignId,
      linkedCampaignName: campaign.name,
      title,
      description,
      context: `${campaign.goal} for ${campaign.audience}. Offer: ${campaign.offer}.`,
      actionNeeded: title,
      status: "pending",
      riskLevel: campaign.riskLevel,
      recommendedDecision: owner === "blue" ? "request_changes" : "approve",
      notes: "",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      sortOrder: Date.now(),
    });
    created += 1;
  }

  const approvalsForCampaign = await ctx.db.query("approvalItems").collect();
  await ensureTodayTasksForPendingApprovals(
    ctx,
    approvalsForCampaign.filter((item: ApprovalRecord) => item.linkedCampaignId === campaignId),
  );

  return { created };
}

export async function syncCampaignAfterApprovalDecision(
  ctx: any,
  approval: ApprovalRecord,
  status: "approved" | "approved_with_changes" | "changes_requested" | "rejected",
) {
  if (!approval.linkedCampaignId) return;
  const campaign = await ctx.db.query("campaigns").withIndex("by_campaign_id", (q: any) => q.eq("campaignId", approval.linkedCampaignId)).unique();
  if (!campaign) return;

  const now = Date.now();
  const patch: Record<string, unknown> = {
    updatedAt: now,
    lastActivityAt: now,
  };

  if (approval.owner === "bari") {
    patch.bariApprovalStatus = status;
  } else if (approval.owner === "blue") {
    patch.blueApprovalStatus = status;
  } else {
    patch.internalApprovalStatus = status;
  }

  const nextCampaign = {
    ...campaign,
    ...patch,
  } as CampaignRecord;

  const pendingApprovals = computePendingApprovals(nextCampaign);
  patch.pendingApprovals = pendingApprovals;

  if (status === "rejected") {
    patch.status = "blocked";
    patch.riskLevel = "red";
    patch.nextAction = `${approval.owner === "bari" ? "Bari" : approval.owner === "blue" ? "Blue" : "Internal"} rejected this campaign. Revise and resubmit.`;
  } else if (status === "changes_requested") {
    patch.status = approval.owner === "bari" ? "needs_bari_review" : approval.owner === "blue" ? "needs_blue_review" : "needs_internal_review";
    patch.stage = approval.owner === "bari" ? "Bari Review" : approval.owner === "blue" ? "Blue Review" : "Internal Approval";
    patch.nextAction = `${approval.owner === "bari" ? "Bari" : approval.owner === "blue" ? "Blue" : "Internal"} requested changes. Update the campaign and resubmit.`;
  } else if (approval.owner === "internal" && pendingApprovals.length === 0) {
    patch.status = "ready_for_keap";
    patch.stage = "Keap Prep";
    patch.nextAction = nextActionForCampaign(nextCampaign, pendingApprovals);
  } else if (pendingApprovals.includes("blue")) {
    patch.status = "needs_blue_review";
    patch.stage = "Blue Review";
    patch.nextAction = nextActionForCampaign(nextCampaign, pendingApprovals);
  } else if (pendingApprovals.includes("internal")) {
    patch.status = "needs_internal_review";
    patch.stage = "Internal Approval";
    patch.nextAction = nextActionForCampaign(nextCampaign, pendingApprovals);
  } else if (pendingApprovals.length === 0) {
    patch.status = "ready_for_keap";
    patch.stage = "Keap Prep";
    patch.nextAction = nextActionForCampaign(nextCampaign, pendingApprovals);
  }

  await ctx.db.patch(campaign._id, patch);
}

export async function resolveResponseCampaignLink(ctx: any, response: ResponseRecord) {
  const campaigns = await ctx.db.query("campaigns").collect();
  const linkedById = response.campaignId
    ? campaigns.find((item: CampaignRecord) => item.campaignId === response.campaignId)
    : null;
  if (linkedById) {
    return {
      campaignId: linkedById.campaignId,
      campaignName: response.campaignName ?? linkedById.name,
    };
  }

  if (!response.campaignId && response.campaignName) {
    const matches = campaigns.filter((item: CampaignRecord) => item.name.trim().toLowerCase() === response.campaignName!.trim().toLowerCase());
    if (matches.length === 1) {
      return {
        campaignId: matches[0].campaignId,
        campaignName: matches[0].name,
      };
    }
  }

  return {
    campaignId: response.campaignId,
    campaignName: response.campaignName,
  };
}

export async function backfillResponseCampaignLinks(ctx: any) {
  const responses = await ctx.db.query("responseClassifications").collect();
  let updated = 0;

  for (const response of responses as ResponseRecord[]) {
    const resolved = await resolveResponseCampaignLink(ctx, response);
    if (resolved.campaignId !== response.campaignId || resolved.campaignName !== response.campaignName) {
      await ctx.db.patch((response as any)._id, {
        campaignId: resolved.campaignId,
        campaignName: resolved.campaignName,
        updatedAt: Date.now(),
      });
      updated += 1;
    }
  }

  return { updated };
}
