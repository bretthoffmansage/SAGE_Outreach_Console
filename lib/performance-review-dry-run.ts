/**
 * Deterministic dry-run performance review — no external APIs.
 * Produces a structured summary from existing snapshots only.
 */

export type DryRunLearningCandidate = {
  title: string;
  summary: string;
  evidence: string;
  confidence: number;
  relatedCampaignId?: string;
  relatedPlatform?: string;
  relatedContentType?: string;
  recommendation: string;
  status: "candidate";
};

export type PerformanceReviewDryRunBody = {
  summary: string;
  campaignId?: string;
  dateRange?: { start?: string; end?: string };
  platformsIncluded: string[];
  snapshotsUsed: string[];
  wins: string[];
  misses: string[];
  patterns: string[];
  recommendations: string[];
  learningCandidates: DryRunLearningCandidate[];
  dataQualityWarnings: string[];
  nextActions: string[];
  sourceMode: string;
  questionsToInvestigate: string[];
};

export type SnapshotLike = Record<string, unknown>;

function nzNum(v: unknown): number {
  return typeof v === "number" && !Number.isNaN(v) ? v : 0;
}

function nzStr(v: unknown): string {
  return typeof v === "string" ? v : "";
}

function estimatedEngagement(row: SnapshotLike): number {
  const direct = nzNum(row.engagement);
  if (direct > 0) return direct;
  return nzNum(row.likes) + nzNum(row.comments) + nzNum(row.shares) + nzNum(row.saves);
}

function inDateRange(metricDate: string, start?: string, end?: string): boolean {
  if (start && metricDate < start) return false;
  if (end && metricDate > end) return false;
  return true;
}

export function buildPerformanceReviewDryRunOutput(input: {
  snapshots: SnapshotLike[];
  campaignId?: string;
  dateRangeStart?: string;
  dateRangeEnd?: string;
  platform?: string;
  campaignNameById: Record<string, string>;
}): PerformanceReviewDryRunBody {
  const { campaignId, dateRangeStart, dateRangeEnd, platform, campaignNameById } = input;

  let rows = input.snapshots.filter((s) => {
    if (campaignId && nzStr(s.campaignId) !== campaignId) return false;
    if (platform && nzStr(s.platform) !== platform) return false;
    if (!inDateRange(nzStr(s.metricDate), dateRangeStart, dateRangeEnd)) return false;
    return true;
  });

  if (!rows.length) {
    return {
      summary: "No performance snapshots matched the selected filters. Add manual metrics or widen the date range.",
      campaignId,
      dateRange: { start: dateRangeStart, end: dateRangeEnd },
      platformsIncluded: [],
      snapshotsUsed: [],
      wins: [],
      misses: [],
      patterns: [],
      recommendations: ["Add at least one performance snapshot for this campaign or timeframe."],
      learningCandidates: [],
      dataQualityWarnings: ["No snapshots in scope — dry run used zero rows."],
      nextActions: ["Record manual snapshot after publish or import when available."],
      sourceMode: "dry_run",
      questionsToInvestigate: [],
    };
  }

  const snapshotsUsed = rows.map((r) => nzStr(r.snapshotId)).filter(Boolean);
  const platformsIncluded = [...new Set(rows.map((r) => nzStr(r.platform)).filter(Boolean))];

  const byPlatform = new Map<string, { views: number; clicks: number; registrations: number; engagement: number; n: number }>();
  for (const r of rows) {
    const p = nzStr(r.platform) || "unknown";
    const cur = byPlatform.get(p) ?? { views: 0, clicks: 0, registrations: 0, engagement: 0, n: 0 };
    cur.views += nzNum(r.views) + nzNum(r.impressions);
    cur.clicks += nzNum(r.clicks) + nzNum(r.emailClicks);
    cur.registrations += nzNum(r.registrations);
    cur.engagement += estimatedEngagement(r);
    cur.n += 1;
    byPlatform.set(p, cur);
  }

  let topPlatformByViews = "";
  let topViews = -1;
  for (const [p, agg] of byPlatform) {
    if (agg.views > topViews) {
      topViews = agg.views;
      topPlatformByViews = p;
    }
  }

  const wins: string[] = [];
  const misses: string[] = [];
  const patterns: string[] = [];
  const recommendations: string[] = [];
  const dataQualityWarnings: string[] = [];
  const questionsToInvestigate: string[] = [];

  if (topPlatformByViews && topViews > 0) {
    wins.push(`Top platform by views/impressions (combined in this dry run): ${topPlatformByViews} (${Math.round(topViews)}).`);
  }

  const withMyth = rows.filter((r) => /myth/i.test(nzStr(r.hookLabel) + nzStr(r.notes)));
  if (withMyth.length >= 2) {
    patterns.push("Multiple rows reference myth-busting framing — compare their engagement vs. neutral rows manually.");
    wins.push("Myth-busting labeled content appears in more than one channel snapshot (evidence in hook labels / notes).");
  }

  const vagueCta = rows.filter((r) => /vague|generic/i.test(nzStr(r.notes)));
  if (vagueCta.length) {
    misses.push("Some snapshots note weaker generic or vague CTA performance — review those notes.");
  }

  for (const r of rows) {
    if (!nzStr(r.campaignId)) dataQualityWarnings.push(`Snapshot ${nzStr(r.snapshotId)} has no linked campaign.`);
    if (nzStr(r.metricStatus) === "partial" || nzStr(r.metricStatus) === "draft") {
      dataQualityWarnings.push(`Snapshot ${nzStr(r.snapshotId)} is ${nzStr(r.metricStatus) || "unknown"} — treat aggregates as directional only.`);
    }
    if (nzStr(r.sourceSystem) === "demo" || nzStr(r.sourceMode) === "demo") {
      dataQualityWarnings.push(`Snapshot ${nzStr(r.snapshotId)} is demo-labeled — not verified live analytics.`);
    }
  }

  recommendations.push("Promote the strongest patterns only after human review in Campaign Learnings.");
  recommendations.push("Next test: alternate direct registration CTA vs. watch-full-video CTA on the same topic.");
  questionsToInvestigate.push("Which channel is driving registrations vs. top-of-funnel engagement?");

  const cname = campaignId ? campaignNameById[campaignId] : undefined;
  const summary = `Dry-run review across ${rows.length} snapshot(s)${cname ? ` for ${cname}` : ""}. Platforms: ${platformsIncluded.join(", ") || "n/a"}. Evidence is snapshot-local only — no live connector calls.`;

  const learningCandidates: DryRunLearningCandidate[] = [];
  if (withMyth.length >= 2) {
    learningCandidates.push({
      title: "Myth-busting hooks may lift short-form engagement",
      summary: "Several myth-busting labeled snapshots cluster in-channel; validate with more complete metrics.",
      evidence: `Snapshots referencing myth framing: ${withMyth.map((r) => nzStr(r.snapshotId)).join(", ")}.`,
      confidence: 0.55,
      relatedCampaignId: campaignId,
      relatedPlatform: "mixed",
      relatedContentType: "short",
      recommendation: "Design A/B tests with myth-busting openers vs. neutral education for the same asset.",
      status: "candidate",
    });
  }
  learningCandidates.push({
    title: "Keep CTAs explicit when pushing full video",
    summary: "Notes and partial metrics suggest direct watch CTAs behave better than vague curiosity CTAs.",
    evidence: "Derived from snapshot notes and CTA labels in scope — not multi-touch attribution.",
    confidence: 0.5,
    relatedCampaignId: campaignId,
    relatedPlatform: topPlatformByViews || undefined,
    relatedContentType: "full_video",
    recommendation: "Prefer concrete next-step language in email and social supporting the weekly launch.",
    status: "candidate",
  });

  const nextActions = [
    "Verify partial snapshots and mark metric status verified where appropriate.",
    "Link snapshots to production assets and trend signals when known.",
    "Open Campaign Learnings to approve or reject generated candidates.",
  ];

  return {
    summary,
    campaignId,
    dateRange: { start: dateRangeStart, end: dateRangeEnd },
    platformsIncluded,
    snapshotsUsed,
    wins,
    misses,
    patterns,
    recommendations,
    learningCandidates,
    dataQualityWarnings: [...new Set(dataQualityWarnings)],
    nextActions,
    sourceMode: "dry_run",
    questionsToInvestigate,
  };
}
