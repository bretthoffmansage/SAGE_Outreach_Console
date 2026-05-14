import { approvals, campaigns, integrations, langGraphNodes, libraryItems } from "@/lib/data/demo-data";
import { campaignMatchesLaunchFilter } from "@/lib/launch-packet-filters";

const pendingReviewStatuses = new Set(["pending", "changes_requested"]);

export function getDashboardMetrics() {
  const pendingApprovals = approvals.filter((approval) => pendingReviewStatuses.has(approval.status));
  const internalPending = pendingApprovals.filter((a) => a.owner === "internal").length;
  const bluePending = pendingApprovals.filter((a) => a.owner === "blue").length;
  const bariPending = pendingApprovals.filter((a) => a.owner === "bari").length;

  return [
    {
      label: "Active launch packets",
      value: String(campaigns.filter((c) => campaignMatchesLaunchFilter(c, "Active")).length),
      tone: "blue" as const,
      helper: "Packets in flight before publish, learning, or hard block.",
    },
    {
      label: "Needs review",
      value: String(pendingApprovals.length),
      tone: "amber" as const,
      helper:
        pendingApprovals.length > 0
          ? `Pending review items — Internal ${internalPending} · Blue ${bluePending} · Bari ${bariPending}.`
          : "Launch packets with pending internal, strategy, founder voice, or readiness review.",
    },
    {
      label: "At risk",
      value: String(campaigns.filter((c) => campaignMatchesLaunchFilter(c, "At risk")).length),
      tone: "amber" as const,
      helper: "Risk or readiness flags need attention before launch.",
    },
    {
      label: "Ready for handoff",
      value: String(campaigns.filter((c) => c.status === "ready_for_keap").length),
      tone: "green" as const,
      helper: "Packets ready for the next manual handoff or launch step.",
    },
    {
      label: "Blocked",
      value: String(campaigns.filter((c) => campaignMatchesLaunchFilter(c, "Blocked")).length),
      tone: "red" as const,
      helper: "Packets blocked by missing source, handoff, review, or readiness items.",
    },
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
