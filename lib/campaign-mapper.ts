import type { Campaign, CampaignStatus, RiskLevel } from "@/lib/domain";

type ConvexCampaignRow = Record<string, unknown> & {
  campaignId: string;
  name: string;
  type: string;
  goal: string;
  channels: string[];
  audience: string;
  offer: string;
  allowedClaims: string[];
  knownExclusions: string[];
  ownerName: string;
  stage: string;
  status: CampaignStatus;
  riskLevel: RiskLevel;
  pendingApprovals: Campaign["pendingApprovals"];
  bariApprovalRequired: boolean;
  blueApprovalRequired: boolean;
  internalApprovalRequired: boolean;
  nextAction: string;
  createdAt: number;
  updatedAt: number;
  sortOrder: number;
};

function optStr(r: Record<string, unknown>, key: string): string | undefined {
  const v = r[key];
  return typeof v === "string" ? v : undefined;
}

function optStrArr(r: Record<string, unknown>, key: string): string[] | undefined {
  const v = r[key];
  if (!Array.isArray(v)) return undefined;
  if (!v.every((item) => typeof item === "string")) return undefined;
  return v as string[];
}

function optNum(r: Record<string, unknown>, key: string): number | undefined {
  const v = r[key];
  return typeof v === "number" ? v : undefined;
}

function optBool(r: Record<string, unknown>, key: string): boolean | undefined {
  const v = r[key];
  return typeof v === "boolean" ? v : undefined;
}

/** Maps a Convex `campaigns` row to the domain `Campaign` (includes Weekly Launch Packet fields). */
export function mapConvexCampaignRecordToCampaign(record: ConvexCampaignRow): Campaign {
  const r = record as Record<string, unknown>;
  const lastAct = optNum(r, "lastActivityAt");
  return {
    id: record.campaignId,
    name: record.name,
    type: record.type,
    goal: record.goal,
    channels: record.channels,
    audience: record.audience,
    audienceId: optStr(r, "audienceId"),
    offer: record.offer,
    offerId: optStr(r, "offerId"),
    primaryCta: optStr(r, "primaryCta"),
    sendWindow: optStr(r, "sendWindow"),
    successMetric: optStr(r, "successMetric"),
    allowedClaims: record.allowedClaims,
    knownExclusions: record.knownExclusions,
    sourceMapping: optStr(r, "sourceMapping"),
    keapTagMapping: optStr(r, "keapTagMapping"),
    ownerId: optStr(r, "ownerId"),
    ownerName: record.ownerName,
    stage: record.stage,
    status: record.status,
    riskLevel: record.riskLevel,
    pendingApprovals: record.pendingApprovals,
    bariApprovalRequired: record.bariApprovalRequired,
    blueApprovalRequired: record.blueApprovalRequired,
    internalApprovalRequired: record.internalApprovalRequired,
    bariApprovalStatus: r.bariApprovalStatus as Campaign["bariApprovalStatus"],
    blueApprovalStatus: r.blueApprovalStatus as Campaign["blueApprovalStatus"],
    internalApprovalStatus: r.internalApprovalStatus as Campaign["internalApprovalStatus"],
    copyStatus: optStr(r, "copyStatus"),
    keapPrepStatus: optStr(r, "keapPrepStatus"),
    responseStatus: optStr(r, "responseStatus"),
    learningStatus: optStr(r, "learningStatus"),
    nextAction: record.nextAction,
    createdAt: new Date(record.createdAt).toISOString(),
    updatedAt: new Date(record.updatedAt).toISOString(),
    lastActivityAt: lastAct ? new Date(lastAct).toISOString() : new Date(record.updatedAt).toISOString(),
    sortOrder: record.sortOrder,
    archived: optBool(r, "archived"),
    notes: optStr(r, "notes"),
    campaignKind: optStr(r, "campaignKind"),
    launchType: optStr(r, "launchType"),
    publishDate: optStr(r, "publishDate"),
    prepWeekStart: optStr(r, "prepWeekStart"),
    readinessStatus: optStr(r, "readinessStatus"),
    sourceProductionAssetId: optStr(r, "sourceProductionAssetId"),
    sourceProductionAssetTitle: optStr(r, "sourceProductionAssetTitle"),
    sourceProductionAssetUrl: optStr(r, "sourceProductionAssetUrl"),
    frameIoUrl: optStr(r, "frameIoUrl"),
    muxPlaybackId: optStr(r, "muxPlaybackId"),
    transcriptStatus: optStr(r, "transcriptStatus"),
    thumbnailStatus: optStr(r, "thumbnailStatus"),
    assetReadinessStatus: optStr(r, "assetReadinessStatus"),
    relatedShortsNotes: optStr(r, "relatedShortsNotes"),
    productionNotes: optStr(r, "productionNotes"),
    campaignAngle: optStr(r, "campaignAngle"),
    primaryAudience: optStr(r, "primaryAudience"),
    youtubeTitle: optStr(r, "youtubeTitle"),
    youtubeDescription: optStr(r, "youtubeDescription"),
    youtubePinnedComment: optStr(r, "youtubePinnedComment"),
    youtubeScheduledUrl: optStr(r, "youtubeScheduledUrl"),
    youtubeScheduledAt: optStr(r, "youtubeScheduledAt"),
    youtubeStatus: optStr(r, "youtubeStatus"),
    youtubeNotes: optStr(r, "youtubeNotes"),
    emailBriefStatus: optStr(r, "emailBriefStatus"),
    emailBriefBody: optStr(r, "emailBriefBody"),
    emailBriefSentAt: optStr(r, "emailBriefSentAt"),
    emailBriefConfirmedAt: optStr(r, "emailBriefConfirmedAt"),
    emailCtaLink: optStr(r, "emailCtaLink"),
    emailSequenceNotes: optStr(r, "emailSequenceNotes"),
    emailSubjectIdeas: optStr(r, "emailSubjectIdeas"),
    emailHandoffNotes: optStr(r, "emailHandoffNotes"),
    creativeOwner: optStr(r, "creativeOwner"),
    creativeBriefStatus: optStr(r, "creativeBriefStatus"),
    creativeBriefBody: optStr(r, "creativeBriefBody"),
    creativeBriefSentAt: optStr(r, "creativeBriefSentAt"),
    creativeBriefConfirmedAt: optStr(r, "creativeBriefConfirmedAt"),
    shortsStatus: optStr(r, "shortsStatus"),
    shortFormDeliverablesRequested: optStr(r, "shortFormDeliverablesRequested"),
    shortFormDeliverablesReceived: optStr(r, "shortFormDeliverablesReceived"),
    creativeNotes: optStr(r, "creativeNotes"),
    socialCopyStatus: optStr(r, "socialCopyStatus"),
    rolloutCadenceStatus: optStr(r, "rolloutCadenceStatus"),
    metaCaption: optStr(r, "metaCaption"),
    metaStatus: optStr(r, "metaStatus"),
    facebookCaption: optStr(r, "facebookCaption"),
    facebookStatus: optStr(r, "facebookStatus"),
    metaAdsNotes: optStr(r, "metaAdsNotes"),
    metaPerformanceNotes: optStr(r, "metaPerformanceNotes"),
    instagramCaption: optStr(r, "instagramCaption"),
    instagramStatus: optStr(r, "instagramStatus"),
    tiktokCaption: optStr(r, "tiktokCaption"),
    tiktokStatus: optStr(r, "tiktokStatus"),
    xPost: optStr(r, "xPost"),
    xStatus: optStr(r, "xStatus"),
    pinterestTitle: optStr(r, "pinterestTitle"),
    pinterestDescription: optStr(r, "pinterestDescription"),
    pinterestStatus: optStr(r, "pinterestStatus"),
    youtubeShortsCaption: optStr(r, "youtubeShortsCaption"),
    youtubeShortsStatus: optStr(r, "youtubeShortsStatus"),
    memeEngagementIdeas: optStr(r, "memeEngagementIdeas"),
    rolloutNotes: optStr(r, "rolloutNotes"),
    heartbeatStatus: optStr(r, "heartbeatStatus"),
    heartbeatLastCheckedAt: optNum(r, "heartbeatLastCheckedAt"),
    heartbeatSummary: optStr(r, "heartbeatSummary"),
    blockers: optStrArr(r, "blockers"),
    internalNotes: optStr(r, "internalNotes"),
    riskNotes: optStr(r, "riskNotes"),
    performanceStatus: optStr(r, "performanceStatus"),
    performanceNotes: optStr(r, "performanceNotes"),
    learningNotes: optStr(r, "learningNotes"),
    bestHook: optStr(r, "bestHook"),
    bestPlatform: optStr(r, "bestPlatform"),
    registrationImpactNotes: optStr(r, "registrationImpactNotes"),
    readinessLastCheckedAt: optNum(r, "readinessLastCheckedAt"),
    readinessReasons: optStrArr(r, "readinessReasons"),
    lastCopyRunId: optStr(r, "lastCopyRunId"),
    lastCopyRunAt: optNum(r, "lastCopyRunAt"),
    copyIntelligenceStatus: optStr(r, "copyIntelligenceStatus"),
    linkedTrendIds: optStrArr(r, "linkedTrendIds"),
    trendNotes: optStr(r, "trendNotes"),
    trendAdaptationStatus: optStr(r, "trendAdaptationStatus"),
    performanceSummary: optStr(r, "performanceSummary"),
    lastPerformanceReviewId: optStr(r, "lastPerformanceReviewId"),
    lastPerformanceSnapshotAt: optNum(r, "lastPerformanceSnapshotAt"),
  };
}

/** Convex `upsertCampaignRecord` patch: domain campaign without id / server timestamps. */
export function buildCampaignSavePatch(campaign: Campaign): Record<string, unknown> {
  const skip = new Set(["id", "createdAt", "updatedAt", "lastActivityAt"]);
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(campaign)) {
    if (skip.has(key)) continue;
    if (value === undefined) continue;
    out[key] = value;
  }
  return out;
}
