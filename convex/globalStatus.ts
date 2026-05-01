import { query } from "./_generated/server";

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

function hrefForApprovalOwner(owner: string) {
  if (owner === "bari") return "/reviews/bari";
  if (owner === "blue") return "/reviews/blue";
  if (owner === "internal") return "/reviews/internal";
  return "/reviews/all";
}

function categoryForLibraryType(type: string) {
  const labels: Record<string, string> = {
    offer: "Offer",
    lead_magnet: "Lead Magnet",
    email: "Email Library",
    voice_rule: "Bari Voice Rule",
    signoff: "Sign-off",
    audience: "Audience",
    compliance_rule: "Compliance Rule",
    learning: "Learning Item",
  };
  return labels[type] ?? "Library Item";
}

function hrefForLibraryType(type: string) {
  const hrefs: Record<string, string> = {
    offer: "/libraries/offers",
    lead_magnet: "/libraries/offers",
    email: "/libraries/email",
    voice_rule: "/libraries/voice-rules",
    signoff: "/libraries/signoffs",
    audience: "/libraries/audiences",
    compliance_rule: "/libraries/compliance",
    learning: "/libraries/learning",
  };
  return hrefs[type] ?? "/libraries/offers";
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
    const [campaigns, approvals, tasks, responses, integrations, libraryItems, learningInsights, agentConfigs] = await Promise.all([
      ctx.db.query("campaigns").collect(),
      ctx.db.query("approvalItems").collect(),
      ctx.db.query("todayTasks").collect(),
      ctx.db.query("responseClassifications").collect(),
      ctx.db.query("integrationConnections").collect(),
      ctx.db.query("libraryItems").collect(),
      ctx.db.query("learningInsights").collect(),
      ctx.db.query("agentConfigs").collect(),
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
      ...libraryItems.map((item) => ({
        id: `library:${item.recordId}`,
        recordId: item.recordId,
        title: item.name,
        type: categoryForLibraryType(item.type),
        description: `${item.status.replace(/_/g, " ")} · ${item.summary}`,
        route: hrefForLibraryType(item.type),
        status: item.status,
        priority: item.riskLevel ?? "gray",
        updatedAt: item.updatedAt,
        keywords: [...item.tags, item.type],
      })),
      ...learningInsights.map((item) => ({
        id: `learning:${item.recordId}`,
        recordId: item.recordId,
        title: item.title,
        type: "Learning Item",
        description: `${item.status} · ${item.summary}`,
        route: "/libraries/learning",
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
        route: "/intelligence/langgraph",
        status: agent.enabled ? "enabled" : "disabled",
        priority: agent.enabled ? "green" : "gray",
        updatedAt: agent.updatedAt,
        keywords: [agent.agentId, agent.preferredProvider, agent.preferredModel],
      })),
    ].sort((left, right) => right.updatedAt - left.updatedAt);
  },
});
