import { approvals, campaigns, integrations, langGraphNodes, libraryItems } from "@/lib/data/demo-data";

export function getDashboardMetrics() {
  return [
    { label: "Active campaigns", value: String(campaigns.filter((campaign) => campaign.status !== "archived").length), tone: "blue" },
    { label: "Needs Bari", value: String(approvals.filter((approval) => approval.owner === "bari" && approval.status === "pending").length), tone: "amber" },
    { label: "Needs Blue", value: String(approvals.filter((approval) => approval.owner === "blue" && approval.status === "pending").length), tone: "red" },
    { label: "Ready for Keap", value: String(campaigns.filter((campaign) => campaign.status === "ready_for_keap").length), tone: "green" },
  ];
}

export function getWorkflowPreview() {
  return langGraphNodes.map((node) => ({
    label: node.label,
    status: node.status,
  }));
}

export function getIntegrationSummary() {
  return {
    configured: integrations.filter((integration) => integration.status === "connected").length,
    manualMode: integrations.filter((integration) => integration.status === "manual_mode").length,
    missingCredentials: integrations.filter((integration) => integration.status === "missing_credentials").length,
  };
}

export function getLibraryCoverage() {
  return {
    total: libraryItems.length,
    blockingRules: libraryItems.filter((item) => item.status === "blocking").length,
    candidates: libraryItems.filter((item) => item.status === "candidate").length,
  };
}
