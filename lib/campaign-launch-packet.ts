import type { Campaign } from "@/lib/domain";

export function formatEnumLabel(value: string | undefined): string {
  if (!value?.trim()) return "Not set";
  return value.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
}

export const CAMPAIGN_KIND_LABELS: Record<string, string> = {
  weekly_content_launch: "Weekly Content Launch",
  weekly_launch: "Weekly Content Launch",
  event_campaign: "Event Campaign",
  event_invite: "Event Campaign",
  email_campaign: "Email Campaign",
  social_campaign: "Social Campaign",
  ad_campaign: "Ad Campaign",
  content_repurpose: "Content Repurpose",
  content_launch: "Weekly Content Launch",
  manual_campaign: "Manual Campaign",
};

export const LAUNCH_TYPE_LABELS: Record<string, string> = {
  youtube_full_video: "YouTube Full Video",
  shorts_rollout: "Shorts/Reels Rollout",
  email_push: "Email Push",
  social_rollout: "Social Rollout",
  registration_push: "Registration Push",
  mixed_campaign: "Mixed Campaign",
};

export const READINESS_STATUS_LABELS: Record<string, string> = {
  not_started: "Not started",
  drafting: "Drafting",
  in_review: "In review",
  ready: "Ready",
  at_risk: "At risk",
  blocked: "Blocked",
  launched: "Launched",
  complete: "Complete",
};

export const HANDOFF_STATUS_LABELS: Record<string, string> = {
  not_started: "Not started",
  draft_needed: "Draft needed",
  drafted: "Drafted",
  needs_review: "Needs review",
  ready_to_send: "Ready to send",
  sent: "Sent",
  confirmed: "Confirmed",
  waiting: "Waiting",
  blocked: "Blocked",
};

export const YOUTUBE_STATUS_LABELS: Record<string, string> = {
  not_started: "Not started",
  draft_needed: "Draft needed",
  copy_drafted: "Copy drafted",
  needs_review: "Needs review",
  ready_to_schedule: "Ready to schedule",
  scheduled: "Scheduled",
  published: "Published",
  blocked: "Blocked",
};

export const SHORTS_STATUS_LABELS: Record<string, string> = {
  not_requested: "Not requested",
  requested: "Requested",
  in_progress: "In progress",
  first_draft_received: "First draft received",
  revisions_needed: "Revisions needed",
  ready: "Ready",
  scheduled: "Scheduled",
  published: "Published",
  blocked: "Blocked",
};

export const SOCIAL_COPY_STATUS_LABELS: Record<string, string> = {
  not_started: "Not started",
  draft_needed: "Draft needed",
  drafted: "Drafted",
  needs_review: "Needs review",
  ready: "Ready",
  scheduled: "Scheduled",
  published: "Published",
  blocked: "Blocked",
};

export const ROLLOUT_CADENCE_LABELS: Record<string, string> = {
  not_started: "Not started",
  drafted: "Drafted",
  needs_review: "Needs review",
  approved: "Approved",
  scheduled: "Scheduled",
  active: "Active",
  complete: "Complete",
  blocked: "Blocked",
};

export const ASSET_READINESS_LABELS: Record<string, string> = {
  not_selected: "Not selected",
  selected: "Selected",
  needs_review: "Needs review",
  ready: "Ready",
  at_risk: "At risk",
  blocked: "Blocked",
};

export const TRANSCRIPT_STATUS_LABELS: Record<string, string> = {
  missing: "Missing",
  needed: "Needed",
  available: "Available",
  imported: "Imported",
  approved: "Approved",
  not_required: "Not required",
};

export const THUMBNAIL_STATUS_LABELS: Record<string, string> = {
  missing: "Missing",
  needed: "Needed",
  draft: "Draft",
  ready: "Ready",
  approved: "Approved",
  not_required: "Not required",
};

export const APPROVAL_TYPE_LABELS: Record<string, string> = {
  copy_review: "Copy review",
  strategic_review: "Strategy review",
  readiness_check: "Launch readiness",
  campaign_angle: "Campaign angle",
  youtube_copy: "YouTube copy",
  email_brief: "Email brief",
  creative_brief: "Creative brief",
  social_copy: "Social copy",
  founder_voice: "Founder voice",
  strategy: "Strategy",
  claims_review: "Claims review",
  friday_readiness: "Friday readiness",
  launch_readiness: "Launch readiness",
  performance_learning: "Performance learning",
};

export function labelForCampaignKind(value: string | undefined): string {
  if (!value) return "—";
  return CAMPAIGN_KIND_LABELS[value] ?? formatEnumLabel(value);
}

export function labelForLaunchType(value: string | undefined): string {
  if (!value) return "—";
  return LAUNCH_TYPE_LABELS[value] ?? formatEnumLabel(value);
}

export function statusBadgeTone(status: string | undefined): "green" | "amber" | "red" | "blue" | "gray" {
  const s = (status ?? "").toLowerCase();
  if (!s || s === "not_started" || s === "not_requested" || s === "not_selected" || s === "missing") return "gray";
  if (s.includes("blocked") || s.includes("rejected")) return "red";
  if (s.includes("risk") || s.includes("waiting") || s.includes("needs") || s.includes("draft")) return "amber";
  if (s.includes("ready") || s.includes("complete") || s.includes("confirmed") || s.includes("sent") || s.includes("published") || s.includes("scheduled") || s.includes("approved") || s.includes("active")) return "green";
  return "blue";
}

export type ReadinessStripItem = { key: string; label: string; status: string; tone: ReturnType<typeof statusBadgeTone> };

/** Derives strip labels from saved packet fields (Section 3 heartbeat logic stays minimal). */
export function deriveLaunchReadinessStrip(campaign: Campaign | null): ReadinessStripItem[] {
  if (!campaign) {
    return [
      { key: "source", label: "Source asset", status: "Not started", tone: "gray" },
      { key: "youtube", label: "YouTube", status: "Not started", tone: "gray" },
      { key: "email", label: "Email handoff", status: "Not started", tone: "gray" },
      { key: "creative", label: "Creative handoff", status: "Not started", tone: "gray" },
      { key: "social", label: "Social rollout", status: "Not started", tone: "gray" },
      { key: "review", label: "Review gates", status: "—", tone: "gray" },
      { key: "readiness", label: "Launch readiness", status: "Not started", tone: "gray" },
    ];
  }

  const assetStatus =
    campaign.assetReadinessStatus ??
    (campaign.sourceProductionAssetTitle?.trim() || campaign.sourceProductionAssetUrl?.trim() ? "selected" : "not_selected");
  const sourceLabel = ASSET_READINESS_LABELS[assetStatus] ?? formatEnumLabel(assetStatus);

  const yt = campaign.youtubeStatus;
  let youtubeStatus = yt ? (YOUTUBE_STATUS_LABELS[yt] ?? formatEnumLabel(yt)) : "Not started";
  if (campaign.youtubeScheduledUrl?.trim()) {
    youtubeStatus = yt === "scheduled" || yt === "published" ? youtubeStatus : "Scheduled link ready";
  }

  const emailSt = campaign.emailBriefStatus;
  const emailLabel = emailSt ? (HANDOFF_STATUS_LABELS[emailSt] ?? formatEnumLabel(emailSt)) : "Not started";

  const crSt = campaign.creativeBriefStatus;
  const creativeLabel = crSt ? (HANDOFF_STATUS_LABELS[crSt] ?? formatEnumLabel(crSt)) : "Not started";

  const socSt = campaign.socialCopyStatus;
  const cadSt = campaign.rolloutCadenceStatus;
  const socialParts = [socSt && (SOCIAL_COPY_STATUS_LABELS[socSt] ?? formatEnumLabel(socSt)), cadSt && (ROLLOUT_CADENCE_LABELS[cadSt] ?? formatEnumLabel(cadSt))].filter(Boolean);
  const socialLabel = socialParts.length ? socialParts.join(" · ") : "Not started";

  const pending = campaign.pendingApprovals?.length ?? 0;
  const reviewLabel =
    pending > 0
      ? `${pending} pending`
      : campaign.bariApprovalRequired || campaign.blueApprovalRequired || campaign.internalApprovalRequired
        ? "Gates configured"
        : "Clear";

  const read = campaign.readinessStatus;
  const readinessLabel = read ? (READINESS_STATUS_LABELS[read] ?? formatEnumLabel(read)) : formatEnumLabel(campaign.status);

  return [
    { key: "source", label: "Source asset", status: sourceLabel, tone: statusBadgeTone(assetStatus) },
    { key: "youtube", label: "YouTube", status: youtubeStatus, tone: statusBadgeTone(yt ?? (campaign.youtubeScheduledUrl ? "scheduled" : "")) },
    { key: "email", label: "Email handoff", status: emailLabel, tone: statusBadgeTone(emailSt) },
    { key: "creative", label: "Creative handoff", status: creativeLabel, tone: statusBadgeTone(crSt) },
    { key: "social", label: "Social rollout", status: socialLabel, tone: statusBadgeTone(socSt ?? cadSt) },
    { key: "review", label: "Review gates", status: reviewLabel, tone: pending > 0 ? "amber" : "green" },
    { key: "readiness", label: "Launch readiness", status: readinessLabel, tone: statusBadgeTone(read ?? campaign.riskLevel) },
  ];
}

export function selectOptionsFromLabels(labels: Record<string, string>) {
  return Object.entries(labels).map(([value, label]) => ({ value, label }));
}

export function showCreativeHandoffTimelineRisk(campaign: Campaign): boolean {
  const st = campaign.creativeBriefStatus;
  if (!st || ["sent", "confirmed", "not_started", "blocked"].includes(st)) return false;
  if (!campaign.prepWeekStart?.trim()) return false;
  const mon = new Date(`${campaign.prepWeekStart.trim()}T12:00:00`);
  if (Number.isNaN(mon.getTime())) return false;
  const wed = new Date(mon);
  wed.setDate(mon.getDate() + 2);
  return Date.now() > wed.getTime();
}
