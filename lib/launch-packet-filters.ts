import type { Campaign } from "@/lib/domain";

/** Launch packet list / dashboard filters — shared by Campaigns UI and demo metrics helpers. */
export function campaignMatchesLaunchFilter(campaign: Campaign, filter: string): boolean {
  if (filter === "All") return true;
  if (filter === "Blocked") return campaign.status === "blocked" || campaign.readinessStatus === "blocked";
  if (filter === "Published") return campaign.status === "sent";
  if (filter === "Learning") return campaign.status === "learning_complete";
  if (filter === "Ready") return campaign.status === "ready_for_keap";
  if (filter === "At risk") {
    return campaign.riskLevel === "red" || campaign.riskLevel === "yellow" || campaign.readinessStatus === "at_risk";
  }
  if (filter === "Needs review") {
    return (
      campaign.status === "needs_bari_review" ||
      campaign.status === "needs_blue_review" ||
      campaign.status === "needs_internal_review" ||
      (campaign.pendingApprovals?.length ?? 0) > 0
    );
  }
  if (filter === "Bari review") {
    return campaign.pendingApprovals.includes("bari") || campaign.status === "needs_bari_review";
  }
  if (filter === "Blue review") {
    return campaign.pendingApprovals.includes("blue") || campaign.status === "needs_blue_review";
  }
  if (filter === "Active") {
    return (
      campaign.status !== "sent" &&
      campaign.status !== "learning_complete" &&
      campaign.status !== "blocked" &&
      campaign.readinessStatus !== "blocked"
    );
  }
  return true;
}
