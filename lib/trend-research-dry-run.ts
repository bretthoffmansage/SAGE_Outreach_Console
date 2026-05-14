/**
 * Section 7 — deterministic trend research dry-run (no web / no platform APIs).
 */

export type TrendResearchDryRunArgs = {
  platform?: string;
  campaignId?: string;
  topic?: string;
  query?: string;
};

export function buildTrendResearchDryRunOutput(args: TrendResearchDryRunArgs) {
  const q = args.query?.trim() || args.topic?.trim() || "general launch / short-form patterns";
  const summary = `Trend research dry run completed for “${q}”. No web browsing, scraping, or external platform API calls were made.`;

  return {
    summary,
    platform: args.platform,
    query: q,
    campaignId: args.campaignId,
    trendSignals: [] as Array<Record<string, unknown>>,
    fitNotes: [
      "Only approved or used trend signals should be treated as trusted downstream context.",
      "Candidate and needs_review trends are optional inspiration — label clearly.",
    ],
    adaptationIdeas: [
      "Map one approved trend to a single primary CTA per packet to avoid mixed messaging.",
      "Prefer adaptation over verbatim reuse of outside examples.",
    ],
    riskNotes: [
      "Avoid copying external creative; Swipe-style references stay inspiration_only.",
      "Meta / TikTok / Pinterest connectors are read-only or planned — no live pulls in this run.",
    ],
    recommendedCampaignLinks: args.campaignId ? [args.campaignId] : [],
    librarySaveSuggestions: [
      { bucket: "swipe_file", note: "Save outside examples as inspiration_only with source URL." },
      { bucket: "platform_playbook", note: "Promote repeatable patterns as playbook candidates after review." },
    ],
    nextActions: [
      "Review candidate trends in Trend Intelligence.",
      "Link approved trends to active Weekly Launch Packets when planning social rollout.",
      "Configure future platform connectors in Operations (manual / planned today).",
    ],
    warnings: ["No external call: dry_run only."],
    trendsFound: 0,
    trendIdsCreated: [] as string[],
    noExternalCall: true,
  };
}
