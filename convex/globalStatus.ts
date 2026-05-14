import { query } from "./_generated/server";
import type { LibraryItem } from "../lib/domain";
import { libraryItemHref, librarySearchCategory } from "../lib/library-routes";

type ApprovalItemRecord = {
  approvalId: string;
  owner: "bari" | "blue" | "internal";
  status: string;
  title: string;
  description: string;
  riskLevel: "green" | "yellow" | "red";
  updatedAt: number;
};

type TodayTaskRecord = {
  taskId: string;
  title: string;
  context: string;
  category: string;
  priority: "green" | "amber" | "red" | "blue" | "gray";
  sourceRoute: string;
  sourceLabel: string;
  status: "current" | "completed";
  updatedAt: number;
};

type ResponseRecord = {
  responseId: string;
  title: string;
  classification: string;
  status: string;
  sentiment: string;
  urgency: string;
  summary: string;
  recommendedAction: string;
  campaignName?: string;
  tags: string[];
  updatedAt: number;
};

type IntegrationRecord = {
  integrationId: string;
  name: string;
  category: string;
  status: string;
  statusLabel: string;
  purpose: string;
  description: string;
  healthSummary?: string;
  updatedAt: number;
  sortOrder: number;
};

type AgentRuntimeStateRecord = {
  agentId: string;
  status: string;
  currentTaskLabel?: string;
  lastError?: string;
  updatedAt: number;
};

function libraryDocToSearchItem(item: {
  recordId: string;
  name: string;
  type: string;
  status: string;
  summary: string;
  tags: string[];
  riskLevel?: LibraryItem["riskLevel"];
  bucket?: string;
  title?: string;
}): LibraryItem {
  return {
    id: item.recordId,
    type: item.type,
    name: item.name,
    status: item.status,
    summary: item.summary,
    tags: item.tags,
    riskLevel: item.riskLevel,
    bucket: item.bucket,
    title: item.title,
  };
}

function hrefForApprovalOwner(owner: string) {
  if (owner === "bari") return "/reviews/bari";
  if (owner === "blue") return "/reviews/blue";
  if (owner === "internal") return "/reviews/internal";
  return "/reviews/all";
}

function riskTone(priority: string) {
  if (priority === "red" || priority === "error") return "red";
  if (priority === "amber" || priority === "yellow" || priority === "warning" || priority === "missing_credentials") return "amber";
  if (priority === "blue" || priority === "manual_mode" || priority === "demo_fallback") return "blue";
  return "green";
}

function priorityWeight(priority: string) {
  if (priority === "red" || priority === "error") return 4;
  if (priority === "amber" || priority === "yellow" || priority === "warning" || priority === "missing_credentials") return 3;
  if (priority === "blue" || priority === "manual_mode" || priority === "demo_fallback") return 2;
  return 1;
}

function buildNotifications(args: {
  approvals: ApprovalItemRecord[];
  responses: ResponseRecord[];
  integrations: IntegrationRecord[];
  runtimes: AgentRuntimeStateRecord[];
  tasks: TodayTaskRecord[];
}) {
  const notifications = [
    ...args.approvals
      .filter((item) => item.status === "pending" || item.status === "changes_requested")
      .map((item) => ({
        notificationId: `approval:${item.approvalId}`,
        title: item.title,
        description: `${item.owner} review · ${item.description}`,
        type: "approval",
        priority: item.riskLevel,
        sourceRoute: hrefForApprovalOwner(item.owner),
        updatedAt: item.updatedAt,
      })),
    ...args.responses
      .filter((item) => item.status === "needs_reply" || item.urgency === "high" || item.classification === "Hot Leads")
      .map((item) => ({
        notificationId: `response:${item.responseId}`,
        title: item.classification === "Hot Leads" ? "Hot lead response" : item.title,
        description: `${item.classification} · ${item.recommendedAction}`,
        type: "response",
        priority: item.urgency === "high" ? "red" : "amber",
        sourceRoute: "/intelligence/responses",
        updatedAt: item.updatedAt,
      })),
    ...args.integrations
      .filter((item) => item.status === "missing_credentials" || item.status === "error")
      .map((item) => ({
        notificationId: `integration:${item.integrationId}`,
        title: `${item.name} setup needed`,
        description: item.healthSummary || item.description,
        type: "integration",
        priority: item.status === "error" ? "red" : "amber",
        sourceRoute: "/operations/integrations",
        updatedAt: item.updatedAt,
      })),
    ...args.runtimes
      .filter((item) => item.status === "blocked" || item.status === "error")
      .map((item) => ({
        notificationId: `runtime:${item.agentId}`,
        title: item.currentTaskLabel || `${item.agentId} needs attention`,
        description: item.lastError || `Agent runtime is ${item.status.replace(/_/g, " ")}.`,
        type: "agent",
        priority: item.status === "error" ? "red" : "amber",
        sourceRoute: "/intelligence/agent-runs",
        updatedAt: item.updatedAt,
      })),
    ...args.tasks
      .filter((item) => item.status === "current" && (item.priority === "red" || item.priority === "amber"))
      .filter((item) => !item.sourceRoute.startsWith("/reviews") && !item.sourceRoute.startsWith("/intelligence/responses"))
      .map((item) => ({
        notificationId: `task:${item.taskId}`,
        taskId: item.taskId,
        title: item.title,
        description: `${item.category} · ${item.context}`,
        type: "task",
        priority: item.priority,
        sourceRoute: item.sourceRoute,
        updatedAt: item.updatedAt,
      })),
  ];

  return notifications
    .sort((left, right) => {
      const priorityDiff = priorityWeight(right.priority) - priorityWeight(left.priority);
      if (priorityDiff !== 0) return priorityDiff;
      return right.updatedAt - left.updatedAt;
    })
    .slice(0, 12);
}

export const getGlobalTopBarState = query({
  args: {},
  handler: async (ctx) => {
    const [approvals, responses, integrations, runtimes, tasks] = await Promise.all([
      ctx.db.query("approvalItems").collect(),
      ctx.db.query("responseClassifications").collect(),
      ctx.db.query("integrationConnections").collect(),
      ctx.db.query("agentRuntimeStates").collect(),
      ctx.db.query("todayTasks").collect(),
    ]);

    const pendingApprovalCount = approvals.filter((item) => item.status === "pending" || item.status === "changes_requested").length;
    const hasError = integrations.some((item) => item.status === "error");
    const hasMissing = integrations.some((item) => item.status === "missing_credentials");
    const hasDemo = integrations.some((item) => item.status === "manual_mode" || item.status === "demo_fallback" || item.status === "not_configured");

    const healthStatus = hasError ? "error" : hasMissing ? "warning" : "healthy";
    const healthLabel = hasError ? "Error" : hasMissing ? "Needs setup" : hasDemo ? "Demo healthy" : "Healthy";
    const healthSummary = hasError
      ? "One or more integrations report errors."
      : hasMissing
        ? "Some integrations are missing required environment variables."
        : hasDemo
          ? "Critical integrations are in demo or manual fallback mode."
          : "Critical integrations are configured.";

    const notifications = buildNotifications({
      approvals: approvals as ApprovalItemRecord[],
      responses: responses as ResponseRecord[],
      integrations: integrations as IntegrationRecord[],
      runtimes: runtimes as AgentRuntimeStateRecord[],
      tasks: tasks as TodayTaskRecord[],
    });

    return {
      pendingApprovalCount,
      notificationCount: notifications.length,
      healthStatus,
      healthLabel,
      healthSummary,
      healthItems: integrations
        .sort((left, right) => left.sortOrder - right.sortOrder)
        .map((item) => ({
          label: item.name,
          value: item.statusLabel || item.status.replace(/_/g, " "),
          tone: riskTone(item.status),
        })),
    };
  },
});

export const getGlobalNotifications = query({
  args: {},
  handler: async (ctx) => {
    const [approvals, responses, integrations, runtimes, tasks] = await Promise.all([
      ctx.db.query("approvalItems").collect(),
      ctx.db.query("responseClassifications").collect(),
      ctx.db.query("integrationConnections").collect(),
      ctx.db.query("agentRuntimeStates").collect(),
      ctx.db.query("todayTasks").collect(),
    ]);

    return buildNotifications({
      approvals: approvals as ApprovalItemRecord[],
      responses: responses as ResponseRecord[],
      integrations: integrations as IntegrationRecord[],
      runtimes: runtimes as AgentRuntimeStateRecord[],
      tasks: tasks as TodayTaskRecord[],
    });
  },
});

export const getGlobalSearchRecords = query({
  args: {},
  handler: async (ctx) => {
    const [campaigns, approvals, tasks, responses, integrations, libraryItems, learningInsights, agentConfigs, productionAssets, trendSignals, performanceSnapshots, performanceReviews, platformInsights] =
      await Promise.all([
        ctx.db.query("campaigns").collect(),
        ctx.db.query("approvalItems").collect(),
        ctx.db.query("todayTasks").collect(),
        ctx.db.query("responseClassifications").collect(),
        ctx.db.query("integrationConnections").collect(),
        ctx.db.query("libraryItems").collect(),
        ctx.db.query("learningInsights").collect(),
        ctx.db.query("agentConfigs").collect(),
        ctx.db.query("productionAssets").collect(),
        ctx.db.query("trendSignals").collect(),
        ctx.db.query("performanceSnapshots").collect(),
        ctx.db.query("performanceReviews").collect(),
        ctx.db.query("platformInsights").collect(),
      ]);

    return [
      ...campaigns.map((campaign) => ({
        id: `campaign:${campaign.campaignId}`,
        campaignId: campaign.campaignId,
        title: campaign.name,
        type: "Campaign",
        description: `${campaign.goal} · ${campaign.status.replace(/_/g, " ")} · ${campaign.nextAction}`,
        route: `/campaigns/${campaign.campaignId}`,
        status: campaign.status,
        priority: campaign.riskLevel,
        updatedAt: campaign.updatedAt,
        keywords: [campaign.audience, campaign.offer, campaign.ownerName, ...campaign.channels],
      })),
      ...approvals.map((approval) => ({
        id: `approval:${approval.approvalId}`,
        approvalId: approval.approvalId,
        campaignId: approval.linkedCampaignId,
        title: approval.title,
        type: "Approval",
        description: `${approval.owner} review · ${approval.status.replace(/_/g, " ")} · ${approval.description}`,
        route: hrefForApprovalOwner(approval.owner),
        status: approval.status,
        priority: approval.riskLevel,
        updatedAt: approval.updatedAt,
        keywords: [approval.owner, approval.linkedCampaignName, approval.recommendedDecision],
      })),
      ...tasks.map((task) => ({
        id: `task:${task.taskId}`,
        taskId: task.taskId,
        title: task.title,
        type: "Today Task",
        description: `${task.category} · ${task.context}`,
        route: task.sourceRoute,
        status: task.status,
        priority: task.priority,
        updatedAt: task.updatedAt,
        keywords: [task.sourceLabel, task.destinationMode],
      })),
      ...responses.map((response) => ({
        id: `response:${response.responseId}`,
        responseId: response.responseId,
        campaignId: response.campaignId,
        title: response.title,
        type: "Response Intelligence",
        description: `${response.classification} · ${response.summary}`,
        route: "/intelligence/responses",
        status: response.status,
        priority: response.urgency,
        updatedAt: response.updatedAt,
        keywords: [response.sentiment, response.campaignName ?? "", response.recommendedAction, ...response.tags],
      })),
      ...integrations.map((integration) => ({
        id: `integration:${integration.integrationId}`,
        integrationId: integration.integrationId,
        title: integration.name,
        type: "Integration",
        description: `${integration.statusLabel || integration.status.replace(/_/g, " ")} · ${integration.purpose}`,
        route: "/operations/integrations",
        status: integration.status,
        priority: integration.status,
        updatedAt: integration.updatedAt,
        keywords: [integration.category, integration.provider, integration.healthSummary ?? ""],
      })),
      ...libraryItems.map((item) => {
        const li = libraryDocToSearchItem(item);
        return {
          id: `library:${item.recordId}`,
          recordId: item.recordId,
          title: item.title ?? item.name,
          type: librarySearchCategory(li),
          description: `${item.status.replace(/_/g, " ")} · ${item.summary}`,
          route: libraryItemHref(li),
          status: item.status,
          priority: item.riskLevel ?? "gray",
          updatedAt: item.updatedAt,
          keywords: [...item.tags, item.type, item.bucket ?? ""].filter(Boolean),
        };
      }),
      ...learningInsights.map((item) => ({
        id: `learning:${item.recordId}`,
        recordId: item.recordId,
        title: item.title,
        type: "Campaign Learnings",
        description: `${item.status} · ${item.summary}`,
        route: "/libraries/campaign-learnings",
        status: item.status,
        priority: item.confidence >= 0.8 ? "green" : item.confidence >= 0.6 ? "amber" : "gray",
        updatedAt: item.updatedAt,
        keywords: [item.source],
      })),
      ...agentConfigs.map((agent) => ({
        id: `agent:${agent.agentId}`,
        agentId: agent.agentId,
        title: agent.displayName,
        type: "Agent Config",
        description: `${agent.category} · ${agent.shortDescription}`,
        route: agent.groupId === "platform_connector_intelligence" ? "/intelligence/platform-connector" : "/intelligence/langgraph",
        status: agent.enabled ? "enabled" : "disabled",
        priority: agent.enabled ? "green" : "gray",
        updatedAt: agent.updatedAt,
        keywords: [agent.agentId, agent.preferredProvider, agent.preferredModel, agent.groupId ?? ""].filter(Boolean),
      })),
      ...productionAssets.map((asset) => ({
        id: `productionAsset:${asset.productionAssetId}`,
        productionAssetId: asset.productionAssetId,
        title: asset.title,
        type: "Production Asset",
        description: `${asset.assetType} · ${asset.readinessStatus ?? asset.status} · ${asset.sourceSystem}`,
        route: "/operations/production-bridge",
        status: asset.status,
        priority: asset.readinessStatus === "blocked" || asset.status === "blocked" ? "red" : "gray",
        updatedAt: asset.updatedAt,
        keywords: [...(asset.tags ?? []), asset.sourceSystem, asset.assetType, ...(asset.linkedCampaignIds ?? [])],
      })),
      ...trendSignals.map((trend) => ({
        id: `trend:${trend.trendId}`,
        trendId: trend.trendId,
        title: trend.title,
        type: "Trend Intelligence",
        description: `${trend.platform} · ${trend.trendType ?? "trend"} · ${trend.status} · ${(trend.summary ?? "").slice(0, 120)}`,
        route: `/intelligence/trends?trend=${encodeURIComponent(trend.trendId)}`,
        status: trend.status,
        priority: (trend.riskScore ?? 0) >= 70 ? "red" : (trend.brandFitScore ?? 0) >= 75 ? "green" : "gray",
        updatedAt: trend.updatedAt,
        keywords: [...(trend.tags ?? []), trend.platform, trend.trendType ?? ""].filter(Boolean),
      })),
      ...performanceSnapshots.map((snap) => ({
        id: `perfSnap:${snap.snapshotId}`,
        snapshotId: snap.snapshotId,
        campaignId: snap.campaignId,
        title: snap.contentTitle?.trim() || snap.snapshotId,
        type: "Performance Snapshot",
        description: `${snap.platform} · ${snap.metricStatus ?? "status unknown"} · ${snap.sourceSystem} · ${(snap.notes ?? "").slice(0, 100)}`,
        route: `/intelligence/performance?snapshot=${encodeURIComponent(snap.snapshotId)}`,
        status: snap.metricStatus ?? "unknown",
        priority: snap.sourceSystem === "demo" ? "amber" : "gray",
        updatedAt: snap.updatedAt,
        keywords: [snap.platform, snap.contentType ?? "", snap.sourceSystem, snap.campaignName ?? ""].filter(Boolean),
      })),
      ...performanceReviews.map((rev) => ({
        id: `perfReview:${rev.reviewId}`,
        reviewId: rev.reviewId,
        campaignId: rev.campaignId,
        title: rev.summary?.trim()?.slice(0, 80) || rev.reviewId,
        type: "Performance Review",
        description: `${rev.reviewType} · ${rev.status} · ${(rev.summary ?? "").slice(0, 120)}`,
        route: `/intelligence/performance`,
        status: rev.status,
        priority: rev.status === "needs_review" ? "amber" : "gray",
        updatedAt: rev.updatedAt,
        keywords: [rev.reviewType, rev.campaignName ?? "", rev.sourceMode ?? ""].filter(Boolean),
      })),
      ...platformInsights.map((ins) => ({
        id: `platformInsight:${ins.insightId}`,
        insightId: ins.insightId,
        title: ins.title,
        type: "Platform Insight",
        description: `${ins.platform} · ${ins.insightType} · ${ins.status} · ${(ins.summary ?? "").slice(0, 120)}`,
        route: "/intelligence/platform-connector",
        status: ins.status,
        priority: ins.sourceMode === "demo" ? "amber" : "gray",
        updatedAt: ins.updatedAt,
        keywords: [ins.platform, ins.sourceSystem, ins.insightType, ins.sourceMode ?? ""].filter(Boolean),
      })),
    ].sort((left, right) => right.updatedAt - left.updatedAt);
  },
});
