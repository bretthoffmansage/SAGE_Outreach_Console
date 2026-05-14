import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import {
  defaultPerformanceSnapshotSeeds,
  demoPerformanceReviewSeed,
  section10MetaAdsDemoSnapshot,
} from "../lib/performance-intelligence-seeds";
import { buildPerformanceReviewDryRunOutput } from "../lib/performance-review-dry-run";

const PERFORMANCE_SNAPSHOT_KEYS = [
  "snapshotId",
  "campaignId",
  "campaignName",
  "productionAssetId",
  "trendId",
  "libraryRecordId",
  "platform",
  "contentType",
  "contentTitle",
  "contentUrl",
  "metricDate",
  "dateRangeStart",
  "dateRangeEnd",
  "sourceSystem",
  "sourceMode",
  "metricStatus",
  "impressions",
  "reach",
  "views",
  "uniqueViews",
  "watchTimeSeconds",
  "averageViewDurationSeconds",
  "completionRate",
  "clicks",
  "clickThroughRate",
  "registrations",
  "registrationRate",
  "leads",
  "replies",
  "opens",
  "openRate",
  "emailClicks",
  "emailClickRate",
  "likes",
  "comments",
  "shares",
  "saves",
  "engagement",
  "engagementRate",
  "followersGained",
  "spend",
  "costPerClick",
  "costPerRegistration",
  "revenue",
  "conversionValue",
  "hookLabel",
  "topicLabel",
  "ctaLabel",
  "audienceLabel",
  "copyVariantLabel",
  "creativeVariantLabel",
  "campaignLabel",
  "adSetLabel",
  "adLabel",
  "placementLabel",
  "objectiveLabel",
  "notes",
  "insights",
  "rawJson",
  "importedAt",
  "createdAt",
  "updatedAt",
] as const;

const PERFORMANCE_REVIEW_KEYS = [
  "reviewId",
  "campaignId",
  "campaignName",
  "reviewType",
  "status",
  "dateRangeStart",
  "dateRangeEnd",
  "summary",
  "wins",
  "misses",
  "patterns",
  "recommendations",
  "questionsToInvestigate",
  "suggestedLearningCandidates",
  "learningCandidateIds",
  "relatedSnapshotIds",
  "dryRunOutputJson",
  "sourceMode",
  "reviewedBy",
  "reviewedAt",
  "createdAt",
  "updatedAt",
] as const;

function stripSystemFields<T extends Record<string, unknown>>(record: T | null | undefined) {
  if (!record) return {};
  const rest = { ...(record as T & { _id?: unknown; _creationTime?: unknown }) };
  delete rest._id;
  delete rest._creationTime;
  return rest;
}

function sanitizeSnapshotRow(record: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  for (const key of PERFORMANCE_SNAPSHOT_KEYS) {
    if (record[key] !== undefined) out[key] = record[key];
  }
  return out;
}

function sanitizeReviewRow(record: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  for (const key of PERFORMANCE_REVIEW_KEYS) {
    if (record[key] !== undefined) out[key] = record[key];
  }
  return out;
}

function nzStr(v: unknown): string {
  return typeof v === "string" ? v : "";
}

function nzNum(v: unknown): number {
  return typeof v === "number" && !Number.isNaN(v) ? v : 0;
}

function estimatedEngagement(row: Record<string, unknown>): number {
  const direct = nzNum(row.engagement);
  if (direct > 0) return direct;
  return nzNum(row.likes) + nzNum(row.comments) + nzNum(row.shares) + nzNum(row.saves);
}

function assertNonNegativeMetrics(patch: Record<string, unknown>) {
  const numericKeys = PERFORMANCE_SNAPSHOT_KEYS.filter((k) => !["snapshotId", "metricDate", "createdAt", "updatedAt", "importedAt"].includes(k));
  for (const key of numericKeys) {
    const val = patch[key];
    if (typeof val === "number" && val < 0) {
      throw new Error(`INVALID_METRIC:${key}`);
    }
  }
  for (const rateKey of ["clickThroughRate", "registrationRate", "openRate", "emailClickRate", "engagementRate", "completionRate"]) {
    const r = patch[rateKey];
    if (typeof r === "number" && (r < 0 || r > 100)) {
      throw new Error(`INVALID_RATE:${rateKey}`);
    }
  }
}

export const listPerformanceSnapshots = query({
  args: {
    campaignId: v.optional(v.string()),
    platform: v.optional(v.string()),
    contentType: v.optional(v.string()),
    sourceSystem: v.optional(v.string()),
    metricStatus: v.optional(v.string()),
    dateRangeStart: v.optional(v.string()),
    dateRangeEnd: v.optional(v.string()),
    search: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const rows = await ctx.db.query("performanceSnapshots").collect();
    const q = (args.search ?? "").trim().toLowerCase();
    const lim = Math.min(Math.max(args.limit ?? 500, 1), 2000);
    let out = rows;
    if (args.campaignId) out = out.filter((r) => r.campaignId === args.campaignId);
    if (args.platform) out = out.filter((r) => r.platform === args.platform);
    if (args.contentType) out = out.filter((r) => r.contentType === args.contentType);
    if (args.sourceSystem) out = out.filter((r) => r.sourceSystem === args.sourceSystem);
    if (args.metricStatus) out = out.filter((r) => r.metricStatus === args.metricStatus);
    const drs = args.dateRangeStart;
    if (drs) out = out.filter((r) => r.metricDate >= drs);
    const dre = args.dateRangeEnd;
    if (dre) out = out.filter((r) => r.metricDate <= dre);
    if (q.length) {
      out = out.filter((r) => {
        const hay = [
          r.snapshotId,
          r.campaignName,
          r.contentTitle,
          r.notes,
          r.hookLabel,
          r.topicLabel,
          r.ctaLabel,
          r.audienceLabel,
          r.campaignLabel,
          r.adSetLabel,
          r.adLabel,
          r.placementLabel,
          r.objectiveLabel,
          r.creativeVariantLabel,
          r.platform,
          r.contentType,
        ]
          .map((x) => (typeof x === "string" ? x.toLowerCase() : ""))
          .join(" ");
        return hay.includes(q);
      });
    }
    out.sort((a, b) => (a.metricDate < b.metricDate ? 1 : a.metricDate > b.metricDate ? -1 : b.updatedAt - a.updatedAt));
    return out.slice(0, lim).map((r) => stripSystemFields(r as Record<string, unknown>));
  },
});

export const getPerformanceSnapshot = query({
  args: { snapshotId: v.string() },
  handler: async (ctx, args) => {
    const row = await ctx.db
      .query("performanceSnapshots")
      .withIndex("by_snapshot_id", (q) => q.eq("snapshotId", args.snapshotId))
      .unique();
    return row ? stripSystemFields(row as Record<string, unknown>) : null;
  },
});

export const upsertPerformanceSnapshot = mutation({
  args: { snapshotId: v.optional(v.string()), patch: v.any() },
  handler: async (ctx, args) => {
    const patch = (args.patch ?? {}) as Record<string, unknown>;
    const now = Date.now();
    const requestedId = typeof args.snapshotId === "string" && args.snapshotId.trim() ? args.snapshotId.trim() : nzStr(patch.snapshotId);
    const existing = requestedId
      ? await ctx.db
          .query("performanceSnapshots")
          .withIndex("by_snapshot_id", (q) => q.eq("snapshotId", requestedId))
          .unique()
      : null;

    const base = existing ? (stripSystemFields(existing as Record<string, unknown>) as Record<string, unknown>) : {};
    const merged: Record<string, unknown> = { ...base, ...patch };
    if (merged.campaignId === "") delete merged.campaignId;

    const snapshotId = requestedId || nzStr(merged.snapshotId) || `perf_manual_${now}_${Math.random().toString(36).slice(2, 10)}`;
    merged.snapshotId = snapshotId;

    const platform = nzStr(merged.platform);
    const metricDate = nzStr(merged.metricDate);
    const sourceSystem = nzStr(merged.sourceSystem);
    if (!platform || !metricDate || !sourceSystem) {
      throw new Error("MISSING_REQUIRED: platform, metricDate, and sourceSystem are required.");
    }

    assertNonNegativeMetrics(merged);

    const next = sanitizeSnapshotRow({
      ...merged,
      snapshotId,
      platform,
      metricDate,
      sourceSystem,
      createdAt: typeof base.createdAt === "number" ? base.createdAt : now,
      updatedAt: now,
    }) as Record<string, unknown>;

    if (existing?._id) {
      await ctx.db.patch(existing._id, next as never);
    } else {
      await ctx.db.insert("performanceSnapshots", next as never);
    }

    const cid = nzStr(next.campaignId);
    if (cid) {
      const campaign = await ctx.db.query("campaigns").withIndex("by_campaign_id", (q) => q.eq("campaignId", cid)).unique();
      if (campaign?._id) {
        await ctx.db.patch(campaign._id, {
          lastPerformanceSnapshotAt: now,
          updatedAt: now,
        } as never);
      }
    }

    return { snapshotId, mode: existing ? ("updated" as const) : ("inserted" as const) };
  },
});

export const deletePerformanceSnapshot = mutation({
  args: { snapshotId: v.string() },
  handler: async (ctx, args) => {
    const row = await ctx.db
      .query("performanceSnapshots")
      .withIndex("by_snapshot_id", (q) => q.eq("snapshotId", args.snapshotId))
      .unique();
    if (!row?._id) return { deleted: false as const };
    await ctx.db.delete(row._id);
    return { deleted: true as const };
  },
});

export const seedDefaultPerformanceSnapshotsIfEmpty = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("performanceSnapshots").collect();
    if (existing.length) {
      return { seededSnapshots: false as const, snapshotCount: existing.length };
    }
    const now = Date.now();
    for (let i = 0; i < defaultPerformanceSnapshotSeeds.length; i++) {
      const seed = defaultPerformanceSnapshotSeeds[i]!;
      await ctx.db.insert(
        "performanceSnapshots",
        sanitizeSnapshotRow({
          ...seed,
          createdAt: now - (defaultPerformanceSnapshotSeeds.length - i) * 1000,
          updatedAt: now - (defaultPerformanceSnapshotSeeds.length - i) * 1000,
        }) as never,
      );
    }

    const reviews = await ctx.db.query("performanceReviews").collect();
    if (!reviews.length) {
      await ctx.db.insert(
        "performanceReviews",
        sanitizeReviewRow({
          ...demoPerformanceReviewSeed,
          learningCandidateIds: [],
          relatedSnapshotIds: defaultPerformanceSnapshotSeeds.slice(0, 3).map((s) => s.snapshotId),
          dryRunOutputJson: undefined,
          createdAt: now,
          updatedAt: now,
        }) as never,
      );
    }

    return { seededSnapshots: true as const, insertedSnapshots: defaultPerformanceSnapshotSeeds.length };
  },
});

/** For DBs seeded before the Section 10 Meta Ads demo snapshot was added to default seeds. */
export const seedSection10MetaPerformanceSnapshotIfMissing = mutation({
  args: {},
  handler: async (ctx) => {
    const id = section10MetaAdsDemoSnapshot.snapshotId;
    const ex = await ctx.db
      .query("performanceSnapshots")
      .withIndex("by_snapshot_id", (q) => q.eq("snapshotId", id))
      .unique();
    if (ex) return { inserted: false as const };
    const now = Date.now();
    await ctx.db.insert(
      "performanceSnapshots",
      sanitizeSnapshotRow({
        ...section10MetaAdsDemoSnapshot,
        createdAt: now,
        updatedAt: now,
      }) as never,
    );
    return { inserted: true as const };
  },
});

export const listCampaignPerformanceSummary = query({
  args: {
    campaignId: v.optional(v.string()),
    dateRangeStart: v.optional(v.string()),
    dateRangeEnd: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const rows = await ctx.db.query("performanceSnapshots").collect();
    let filtered = rows;
    if (args.campaignId) filtered = filtered.filter((r) => r.campaignId === args.campaignId);
    const drs2 = args.dateRangeStart;
    if (drs2) filtered = filtered.filter((r) => r.metricDate >= drs2);
    const dre2 = args.dateRangeEnd;
    if (dre2) filtered = filtered.filter((r) => r.metricDate <= dre2);

    const campaignRecords = await ctx.db.query("campaigns").collect();
    const nameById: Record<string, string> = {};
    for (const c of campaignRecords) nameById[c.campaignId] = c.name;

    const byCamp = new Map<
      string,
      {
        campaignName?: string;
        snapshots: typeof filtered;
      }
    >();
    for (const r of filtered) {
      const cid = r.campaignId ?? "__none__";
      if (!byCamp.has(cid))
        byCamp.set(cid, {
          campaignName: r.campaignName ?? (cid !== "__none__" ? nameById[cid] : undefined),
          snapshots: [],
        });
      byCamp.get(cid)!.snapshots.push(r);
    }

    const summaries: Array<Record<string, unknown>> = [];
    for (const [cid, group] of byCamp) {
      const snaps = group.snapshots;
      let totalViews = 0;
      let totalClicks = 0;
      let totalEmailClicks = 0;
      let totalRegistrations = 0;
      let totalEngagementEst = 0;
      const byPlatform = new Map<string, { views: number; clicks: number }>();
      let latestMetricDate = "";
      let needsReview = 0;
      for (const s of snaps) {
        totalViews += nzNum(s.views) + nzNum(s.impressions);
        totalClicks += nzNum(s.clicks);
        totalEmailClicks += nzNum(s.emailClicks);
        totalRegistrations += nzNum(s.registrations);
        totalEngagementEst += estimatedEngagement(s as Record<string, unknown>);
        const p = s.platform;
        const agg = byPlatform.get(p) ?? { views: 0, clicks: 0 };
        agg.views += nzNum(s.views) + nzNum(s.impressions);
        agg.clicks += nzNum(s.clicks) + nzNum(s.emailClicks);
        byPlatform.set(p, agg);
        if (s.metricDate > latestMetricDate) latestMetricDate = s.metricDate;
        if (s.metricStatus === "needs_review" || s.metricStatus === "draft" || s.metricStatus === "partial") needsReview += 1;
      }
      let topPlatformByViews = "";
      let best = -1;
      for (const [p, agg] of byPlatform) {
        if (agg.views > best) {
          best = agg.views;
          topPlatformByViews = p;
        }
      }
      summaries.push({
        campaignId: cid === "__none__" ? undefined : cid,
        campaignName: group.campaignName ?? (cid !== "__none__" ? nameById[cid] : undefined),
        snapshotCount: snaps.length,
        totalViews,
        totalClicks,
        totalEmailClicks,
        totalRegistrations,
        totalEngagementEstimated: totalEngagementEst,
        engagementEstimateNote: "Sum of engagement field when present; else likes+comments+shares+saves.",
        topPlatformByViews: topPlatformByViews || undefined,
        topPlatformBasis: "Top platform by views (views + impressions combined).",
        latestMetricDate: latestMetricDate || undefined,
        needsReviewSnapshotCount: needsReview,
        publishDate: cid !== "__none__" ? campaignRecords.find((c) => c.campaignId === cid)?.publishDate : undefined,
      });
    }
    summaries.sort((a, b) => (nzNum(b.snapshotCount) - nzNum(a.snapshotCount) === 0 ? nzStr(b.latestMetricDate).localeCompare(nzStr(a.latestMetricDate)) : nzNum(b.snapshotCount) - nzNum(a.snapshotCount)));
    return summaries;
  },
});

export const listPlatformPerformanceSummary = query({
  args: {
    campaignId: v.optional(v.string()),
    dateRangeStart: v.optional(v.string()),
    dateRangeEnd: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const rows = await ctx.db.query("performanceSnapshots").collect();
    let filtered = rows;
    if (args.campaignId) filtered = filtered.filter((r) => r.campaignId === args.campaignId);
    const drs3 = args.dateRangeStart;
    if (drs3) filtered = filtered.filter((r) => r.metricDate >= drs3);
    const dre3 = args.dateRangeEnd;
    if (dre3) filtered = filtered.filter((r) => r.metricDate <= dre3);

    const byPlat = new Map<string, typeof filtered>();
    for (const r of filtered) {
      const p = r.platform || "unknown";
      if (!byPlat.has(p)) byPlat.set(p, []);
      byPlat.get(p)!.push(r);
    }
    const out: Array<Record<string, unknown>> = [];
    for (const [platform, snaps] of byPlat) {
      let viewsImp = 0;
      let clicks = 0;
      let registrations = 0;
      let engagement = 0;
      let spend = 0;
      const sources = new Set<string>();
      const statuses = new Set<string>();
      for (const s of snaps) {
        viewsImp += nzNum(s.views) + nzNum(s.impressions);
        clicks += nzNum(s.clicks) + nzNum(s.emailClicks);
        registrations += nzNum(s.registrations);
        engagement += estimatedEngagement(s as Record<string, unknown>);
        spend += nzNum(s.spend);
        if (s.sourceSystem) sources.add(s.sourceSystem);
        if (s.metricStatus) statuses.add(s.metricStatus);
      }
      out.push({
        platform,
        contentCount: snaps.length,
        viewsOrImpressions: viewsImp,
        clicks,
        registrations,
        engagement,
        engagementNote: "Direct engagement metric when set; else estimated from reactions.",
        spend,
        cpcLabel: "Use per-snapshot CPC where present; aggregate spend/CPC is illustrative only.",
        dataSources: [...sources].join(", ") || "unknown",
        metricStatuses: [...statuses].join(", ") || "unknown",
      });
    }
    out.sort((a, b) => nzNum(b.viewsOrImpressions) - nzNum(a.viewsOrImpressions));
    return out;
  },
});

export const createPerformanceReview = mutation({
  args: { patch: v.any() },
  handler: async (ctx, args) => {
    const patch = (args.patch ?? {}) as Record<string, unknown>;
    const now = Date.now();
    const reviewId =
      nzStr(patch.reviewId) || `perf_review_${now}_${Math.random().toString(36).slice(2, 9)}`;
    const row = sanitizeReviewRow({
      ...patch,
      reviewId,
      reviewType: nzStr(patch.reviewType) || "manual_review",
      status: nzStr(patch.status) || "draft",
      createdAt: now,
      updatedAt: now,
    });
    await ctx.db.insert("performanceReviews", row as never);
    const cid = nzStr(row.campaignId);
    if (cid) {
      const campaign = await ctx.db.query("campaigns").withIndex("by_campaign_id", (q) => q.eq("campaignId", cid)).unique();
      if (campaign?._id) {
        await ctx.db.patch(campaign._id, {
          lastPerformanceReviewId: reviewId,
          performanceSummary: typeof row.summary === "string" ? row.summary.slice(0, 500) : campaign.performanceSummary,
          updatedAt: now,
        } as never);
      }
    }
    return { reviewId };
  },
});

export const listPerformanceReviews = query({
  args: { campaignId: v.optional(v.string()), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const rows = await ctx.db.query("performanceReviews").collect();
    let out = rows;
    if (args.campaignId) out = out.filter((r) => r.campaignId === args.campaignId);
    out.sort((a, b) => b.updatedAt - a.updatedAt);
    const lim = Math.min(Math.max(args.limit ?? 50, 1), 200);
    return out.slice(0, lim).map((r) => stripSystemFields(r as Record<string, unknown>));
  },
});

export const runPerformanceReviewDryRun = mutation({
  args: {
    campaignId: v.optional(v.string()),
    dateRangeStart: v.optional(v.string()),
    dateRangeEnd: v.optional(v.string()),
    platform: v.optional(v.string()),
    createdBy: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const snapshots = await ctx.db.query("performanceSnapshots").collect();
    const campaigns = await ctx.db.query("campaigns").collect();
    const nameById: Record<string, string> = {};
    for (const c of campaigns) nameById[c.campaignId] = c.name;

    const body = buildPerformanceReviewDryRunOutput({
      snapshots: snapshots.map((s) => stripSystemFields(s as Record<string, unknown>)),
      campaignId: args.campaignId,
      dateRangeStart: args.dateRangeStart,
      dateRangeEnd: args.dateRangeEnd,
      platform: args.platform,
      campaignNameById: nameById,
    });

    const now = Date.now();
    const reviewId = `perf_review_dry_${now}_${Math.random().toString(36).slice(2, 8)}`;

    await ctx.db.insert(
      "performanceReviews",
      sanitizeReviewRow({
        reviewId,
        campaignId: args.campaignId,
        campaignName: args.campaignId ? nameById[args.campaignId] : undefined,
        reviewType: "agent_dry_run",
        status: "draft",
        dateRangeStart: args.dateRangeStart,
        dateRangeEnd: args.dateRangeEnd,
        summary: body.summary,
        wins: body.wins,
        misses: body.misses,
        patterns: body.patterns,
        recommendations: body.recommendations,
        questionsToInvestigate: body.questionsToInvestigate,
        suggestedLearningCandidates: body.learningCandidates.map((c) => c.title),
        relatedSnapshotIds: body.snapshotsUsed,
        dryRunOutputJson: JSON.stringify(body, null, 2),
        sourceMode: body.sourceMode,
        createdAt: now,
        updatedAt: now,
      }) as never,
    );

    if (args.campaignId) {
      const campaign = await ctx.db.query("campaigns").withIndex("by_campaign_id", (q) => q.eq("campaignId", args.campaignId!)).unique();
      if (campaign?._id) {
        await ctx.db.patch(campaign._id, {
          lastPerformanceReviewId: reviewId,
          performanceSummary: body.summary.slice(0, 500),
          updatedAt: now,
        } as never);
      }
    }

    const runId = `perf_dry_run_${now}_${Math.random().toString(36).slice(2, 8)}`;
    await ctx.db.insert("agentRuns", {
      runId,
      campaignId: args.campaignId,
      agentId: "dashboard_writer_agent",
      status: "complete",
      groupId: "performance_intelligence",
      runType: "performance_review_dry_run",
      safetyMode: "dry_run",
      appliedToCampaign: false,
      reviewRequired: true,
      createdBy: args.createdBy,
      inputSnapshot: JSON.stringify(
        {
          campaignId: args.campaignId,
          dateRangeStart: args.dateRangeStart,
          dateRangeEnd: args.dateRangeEnd,
          platform: args.platform,
        },
        null,
        2,
      ),
      outputSummary: body.summary,
      outputJson: JSON.stringify(body, null, 2),
      startedAt: now,
      finishedAt: now,
    });

    return { reviewId, runId, body };
  },
});

const LEARNING_KEYS = [
  "recordId",
  "source",
  "status",
  "title",
  "summary",
  "confidence",
  "payload",
  "createdAt",
  "updatedAt",
] as const;

function sanitizeLearningRow(record: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  for (const key of LEARNING_KEYS) {
    if (record[key] !== undefined) out[key] = record[key];
  }
  return out;
}

export const createLearningCandidateFromPerformance = mutation({
  args: {
    title: v.string(),
    summary: v.string(),
    evidence: v.string(),
    recommendation: v.string(),
    confidence: v.number(),
    relatedCampaignId: v.optional(v.string()),
    relatedPlatform: v.optional(v.string()),
    relatedContentType: v.optional(v.string()),
    snapshotIds: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const recordId = `learn_perf_${now}_${Math.random().toString(36).slice(2, 8)}`;
    const linked = args.relatedCampaignId ? [args.relatedCampaignId] : [];
    await ctx.db.insert(
      "learningInsights",
      sanitizeLearningRow({
        recordId,
        source: "performance_intelligence",
        status: "candidate",
        title: args.title,
        summary: args.summary,
        confidence: Math.min(1, Math.max(0, args.confidence)),
        payload: {
          bucket: "campaign_learning",
          sourceSystem: "performance_intelligence",
          appliesTo: "Campaign performance patterns",
          canAgentsUse: false,
          requiresReview: true,
          evidence: args.evidence,
          recommendation: args.recommendation,
          linkedCampaignIds: linked,
          relatedPlatform: args.relatedPlatform,
          relatedContentType: args.relatedContentType,
          evidenceSnapshotIds: args.snapshotIds ?? [],
        },
        createdAt: now,
        updatedAt: now,
      }) as never,
    );
    return { recordId };
  },
});

export const listLearningCandidatesFromPerformance = query({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db.query("learningInsights").collect();
    return rows
      .filter((r) => r.source === "performance_intelligence")
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .map((r) => stripSystemFields(r as Record<string, unknown>));
  },
});
