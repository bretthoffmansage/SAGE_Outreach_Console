import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { buildTrendResearchDryRunOutput } from "../lib/trend-research-dry-run";

export const listTrendResearchRuns = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = Math.min(Math.max(args.limit ?? 40, 1), 100);
    const rows = await ctx.db.query("trendResearchRuns").collect();
    return rows.sort((a, b) => b.startedAt - a.startedAt).slice(0, limit);
  },
});

/**
 * Dry-run trend research: no web/API calls; logs trendResearchRuns + agentRuns.
 */
export const runTrendResearchDryRun = mutation({
  args: {
    platform: v.optional(v.string()),
    campaignId: v.optional(v.string()),
    topic: v.optional(v.string()),
    query: v.optional(v.string()),
    createdBy: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const runId = `trend_research_${now}_${Math.random().toString(36).slice(2, 8)}`;
    const body = buildTrendResearchDryRunOutput({
      platform: args.platform,
      campaignId: args.campaignId,
      topic: args.topic,
      query: args.query,
    });

    await ctx.db.insert("trendResearchRuns", {
      runId,
      runType: "dry_run",
      status: "completed",
      sourceSystem: "manual",
      startedAt: now,
      createdAt: now,
      updatedAt: now,
      platforms: args.platform ? [args.platform] : undefined,
      query: body.query,
      summary: body.summary,
      trendsFound: body.trendsFound,
      trendIdsCreated: body.trendIdsCreated,
      completedAt: now,
      createdBy: args.createdBy,
      rawJson: JSON.stringify(body, null, 2),
    } as never);

    const agentRunId = `run_${runId}`;
    await ctx.db.insert("agentRuns", {
      runId: agentRunId,
      campaignId: args.campaignId,
      agentId: "trend_scout_agent",
      status: "complete",
      groupId: "trend_intelligence",
      runType: "trend_research_dry_run",
      safetyMode: "dry_run",
      appliedToCampaign: false,
      reviewRequired: false,
      createdBy: args.createdBy,
      inputSnapshot: JSON.stringify({ platform: args.platform, campaignId: args.campaignId, topic: args.topic, query: args.query }, null, 2),
      outputSummary: body.summary,
      outputJson: JSON.stringify({ ...body, trendResearchRunId: runId }, null, 2),
      startedAt: now,
      finishedAt: now,
    } as never);

    return { runId, agentRunId, output: body };
  },
});
