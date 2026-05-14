/** Demo trend signals for Section 7 — seeded when table is empty. */

export type TrendSignalSeed = {
  trendId: string;
  title: string;
  summary: string;
  platform: string;
  trendType: string;
  status: string;
  sourceSystem: string;
  sourceUrl?: string;
  sourceLabel?: string;
  observedAt: number;
  timeliness?: string;
  relevanceScore?: number;
  brandFitScore?: number;
  audienceFitScore?: number;
  riskScore?: number;
  effortLevel?: string;
  confidence?: number;
  tags: string[];
  relatedCampaignIds?: string[];
  suggestedUses?: string[];
  adaptationIdeas?: string[];
  hookIdeas?: string[];
  captionIdeas?: string[];
  memeIdeas?: string[];
  creativeBriefNotes?: string;
  platformNotes?: string;
  riskNotes?: string;
};

export const DEMO_TREND_SIGNALS: TrendSignalSeed[] = [
  {
    trendId: "trend_2026_05_instagram_myth_busting_reel_hook",
    title: "Myth-busting reel opener",
    summary:
      "Short reels that open by challenging a common belief, then quickly explain the opposite perspective.",
    platform: "instagram",
    trendType: "reel_format",
    status: "approved",
    sourceSystem: "demo",
    sourceLabel: "Instagram manual observation",
    observedAt: Date.parse("2026-05-01T12:00:00.000Z"),
    timeliness: "current",
    relevanceScore: 82,
    brandFitScore: 88,
    audienceFitScore: 85,
    riskScore: 22,
    effortLevel: "medium",
    confidence: 78,
    tags: ["reels", "myth-busting", "virtual-events", "hook-pattern"],
    suggestedUses: ['Use for a reel opening with “Virtual events are dead? Not even close.”'],
    adaptationIdeas: [
      "Open with on-screen myth text, cut to speaker proof within 5s.",
      "Pair with net-profit or cost-comparison CTA in description.",
    ],
    hookIdeas: ["Virtual events are dead? Not even close.", "Still assuming in-person always wins on margin?"],
    creativeBriefNotes:
      "Ask creative for fast-paced cut: myth line on screen → one proof point → CTA end card.",
    riskNotes: "Keep claims evidence-aligned; avoid absolute guarantees.",
  },
  {
    trendId: "trend_2026_05_cross_platform_pov_event_cost_meme",
    title: "POV event cost meme",
    summary: "POV-style memes that dramatize a painful business realization, such as venue and hotel costs stacking up.",
    platform: "cross_platform",
    trendType: "meme_format",
    status: "candidate",
    sourceSystem: "demo",
    sourceLabel: "Internal brainstorm",
    observedAt: Date.parse("2026-05-02T10:00:00.000Z"),
    timeliness: "current",
    relevanceScore: 70,
    brandFitScore: 58,
    audienceFitScore: 72,
    riskScore: 48,
    effortLevel: "low",
    confidence: 55,
    tags: ["meme", "event-costs", "profit", "social-engagement"],
    suggestedUses: ["Create a light meme around in-person event costs eating profit margin."],
    memeIdeas: ["POV: You open the hotel + venue invoice before registration closes."],
    riskNotes: "May feel gimmicky for Sage — keep tone professional if used.",
  },
  {
    trendId: "trend_2026_05_tiktok_quick_cut_mistake_list",
    title: "Quick-cut mistake list",
    summary: "Fast-paced videos listing mistakes creators make before explaining the better alternative.",
    platform: "tiktok",
    trendType: "short_format",
    status: "candidate",
    sourceSystem: "demo",
    sourceLabel: "TikTok search (manual)",
    observedAt: Date.parse("2026-05-03T14:00:00.000Z"),
    timeliness: "emerging",
    relevanceScore: 76,
    brandFitScore: 72,
    audienceFitScore: 80,
    riskScore: 35,
    effortLevel: "medium",
    confidence: 62,
    tags: ["tiktok", "short-form", "mistakes", "creator-business"],
    suggestedUses: ["3 mistakes creators make when choosing between virtual and in-person events."],
    hookIdeas: ["Stop doing these 3 things before your next launch week."],
  },
  {
    trendId: "trend_2026_05_facebook_comment_prompt_question",
    title: "Comment prompt question post",
    summary: "Simple direct question posts that ask the audience to choose a side or share an experience.",
    platform: "facebook",
    trendType: "engagement_prompt",
    status: "approved",
    sourceSystem: "demo",
    sourceLabel: "Internal observation",
    observedAt: Date.parse("2026-05-04T09:00:00.000Z"),
    timeliness: "evergreen",
    relevanceScore: 74,
    brandFitScore: 86,
    audienceFitScore: 88,
    riskScore: 18,
    effortLevel: "low",
    confidence: 80,
    tags: ["facebook", "engagement", "question-post", "audience-research"],
    suggestedUses: ['Ask “Would you rather host your next event virtually or in person, and why?”'],
    captionIdeas: ["Poll in first line; pin best objections for follow-up content."],
  },
  {
    trendId: "trend_2026_05_pinterest_search_style_title",
    title: "Search-style Pinterest title",
    summary: "Pinterest-friendly titles that read like search queries and promise practical event planning guidance.",
    platform: "pinterest",
    trendType: "search_trend",
    status: "needs_review",
    sourceSystem: "demo",
    sourceLabel: "Competitor swipe (inspiration only)",
    sourceUrl: "https://example.com/inspiration-only",
    observedAt: Date.parse("2026-05-05T11:00:00.000Z"),
    timeliness: "evergreen",
    relevanceScore: 81,
    brandFitScore: 84,
    audienceFitScore: 79,
    riskScore: 25,
    effortLevel: "low",
    confidence: 70,
    tags: ["pinterest", "search", "event-planning", "evergreen"],
    suggestedUses: ['Titles like “How to host a profitable virtual event without hotel costs.”'],
    riskNotes: "Outside example — inspiration only; do not copy verbatim into Sage-owned copy.",
  },
];

/** Extra Meta-oriented demos (Section 10) — inserted only when missing. */
export const DEMO_META_TREND_SIGNALS: TrendSignalSeed[] = [
  {
    trendId: "trend_2026_05_meta_ads_cost_comparison_angle",
    title: "Meta ad creative cost-comparison angle",
    summary: "Ad creative that frames cost differences and margin impact may be useful for event-related offers.",
    platform: "meta_ads",
    trendType: "ad_creative_pattern",
    status: "candidate",
    sourceSystem: "demo",
    sourceLabel: "Manual / demo pattern",
    observedAt: Date.parse("2026-05-06T15:00:00.000Z"),
    timeliness: "current",
    relevanceScore: 72,
    brandFitScore: 70,
    audienceFitScore: 74,
    riskScore: 40,
    effortLevel: "medium",
    confidence: 60,
    tags: ["meta-ads", "cost-framing", "event-offers", "demo-only"],
    suggestedUses: ["Test cost/profit framing against generic event education in controlled spend caps."],
    hookIdeas: ["Same registrations, lower hotel bill — where does the margin go?"],
    riskNotes: "Demo signal — requires finance/compliance review before paid amplification.",
  },
];
