import { approvals, campaigns, integrations, learningInsights, libraryItems, responses } from "@/lib/data/demo-data";
import { libraryItemHref, librarySearchCategory } from "@/lib/library-routes";

export type SearchRecord = {
  id: string;
  title: string;
  category: string;
  description: string;
  href: string;
  keywords?: string[];
};

export const demoHealthItems = [
  { label: "Demo mode", value: "active" },
  { label: "Keap", value: "manual/demo fallback" },
  { label: "HelpDesk", value: "manual/demo fallback" },
  { label: "Zapier", value: "manual/demo fallback" },
  { label: "Agents", value: "demo seeded outputs" },
  { label: "Human approval", value: "authoritative" },
] as const;

export const headerNotifications = [
  {
    id: "notif_bari_review",
    title: "Founder-voice review queued",
    description: "Founder-voice pass is queued for the weekly launch email draft (escalation, not every send).",
    href: "/reviews/bari",
  },
  {
    id: "notif_blue_review",
    title: "Strategic review queued",
    description: "One strategic claim on the September registration warmup packet still needs Blue review.",
    href: "/reviews/blue",
  },
  {
    id: "notif_compliance",
    title: "Compliance guard flagged claim",
    description: "Strong outcome language should be tightened before the weekly launch packet goes out.",
    href: "/libraries/compliance",
  },
  {
    id: "notif_helpdesk",
    title: "HelpDesk reply needs attention",
    description: "A matched lead reply is waiting for a manual draft response.",
    href: "/intelligence/responses",
  },
  {
    id: "notif_integration",
    title: "Integration setup item pending",
    description: "Manual-mode integrations still need production credentials and sync rules.",
    href: "/operations/integrations",
  },
] as const;

function hrefForApprovalOwner(owner: string) {
  const hrefs: Record<string, string> = {
    bari: "/reviews/bari",
    blue: "/reviews/blue",
    internal: "/reviews/internal",
  };
  return hrefs[owner] ?? "/reviews/all";
}

export const searchRecords: SearchRecord[] = [
  ...campaigns.map((campaign) => ({
    id: campaign.id,
    title: campaign.name,
    category: "Campaign",
    description: `${campaign.goal} campaign · ${campaign.status.replace(/_/g, " ")} · ${campaign.nextAction}`,
    href: `/campaigns/${campaign.id}`,
    keywords: [campaign.audience, campaign.goal, ...campaign.channels],
  })),
  ...approvals.map((approval) => ({
    id: approval.id,
    title: approval.title,
    category: "Approval",
    description: `${approval.owner} review · ${approval.status.replace(/_/g, " ")} · ${approval.reason}`,
    href: hrefForApprovalOwner(approval.owner),
    keywords: [approval.owner, approval.riskLevel, approval.recommendedDecision],
  })),
  ...libraryItems.map((item) => ({
    id: item.id,
    title: item.title || item.name,
    category: librarySearchCategory(item),
    description: `${item.status.replace(/_/g, " ")} · ${item.summary}`,
    href: libraryItemHref(item),
    keywords: [...item.tags, item.type, item.bucket ?? ""].filter(Boolean),
  })),
  ...responses.map((response) => ({
    id: response.id,
    title: response.title,
    category: "Response Intelligence",
    description: `${response.classification} · ${response.summary}`,
    href: "/intelligence/responses",
    keywords: [response.sentiment, response.urgency, ...(response.tags ?? [])],
  })),
  ...learningInsights.map((insight) => ({
    id: insight.id,
    title: insight.title,
    category: "Campaign Learnings",
    description: `${insight.status} · ${insight.summary}`,
    href: "/libraries/campaign-learnings",
    keywords: [insight.source],
  })),
];

export function getPendingApprovalCount() {
  return approvals.filter((approval) => approval.status === "pending").length;
}

export function getSidebarCounts() {
  return {
    bari: approvals.filter((approval) => approval.owner === "bari" && approval.status === "pending").length,
    blue: approvals.filter((approval) => approval.owner === "blue" && approval.status === "pending").length,
    allApprovals: approvals.filter((approval) => approval.status === "pending").length,
    responses: responses.length,
    integrations: integrations.filter((integration) => integration.status === "manual_mode" || integration.status === "missing_credentials" || integration.status === "error").length,
    activeCampaigns: campaigns.filter((campaign) => campaign.status !== "archived").length,
    learning: learningInsights.filter((item) => item.status === "candidate").length,
    library: libraryItems.length,
  };
}

export function getNotificationsCount() {
  return headerNotifications.length;
}

export function getDemoHealthSummary() {
  return integrations.filter((integration) => integration.status === "manual_mode" || integration.status === "missing_credentials").length;
}

export function searchShellRecords(query: string) {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return [];

  return searchRecords.filter((record) => {
    const haystack = [record.title, record.category, record.description, ...(record.keywords ?? [])].join(" ").toLowerCase();
    return haystack.includes(normalizedQuery);
  });
}
