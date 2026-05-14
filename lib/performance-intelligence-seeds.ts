/**
 * Demo seeds for Performance Intelligence (Section 8).
 * Inserted only when `performanceSnapshots` is empty — clearly labeled sourceSystem: demo.
 */

export type PerformanceSnapshotSeed = {
  snapshotId: string;
  campaignId?: string;
  campaignName?: string;
  productionAssetId?: string;
  trendId?: string;
  libraryRecordId?: string;
  platform: string;
  contentType?: string;
  contentTitle?: string;
  contentUrl?: string;
  metricDate: string;
  dateRangeStart?: string;
  dateRangeEnd?: string;
  sourceSystem: string;
  sourceMode?: string;
  metricStatus?: string;
  impressions?: number;
  reach?: number;
  views?: number;
  uniqueViews?: number;
  watchTimeSeconds?: number;
  averageViewDurationSeconds?: number;
  completionRate?: number;
  clicks?: number;
  clickThroughRate?: number;
  registrations?: number;
  registrationRate?: number;
  leads?: number;
  replies?: number;
  opens?: number;
  openRate?: number;
  emailClicks?: number;
  emailClickRate?: number;
  likes?: number;
  comments?: number;
  shares?: number;
  saves?: number;
  engagement?: number;
  engagementRate?: number;
  followersGained?: number;
  spend?: number;
  costPerClick?: number;
  costPerRegistration?: number;
  revenue?: number;
  conversionValue?: number;
  hookLabel?: string;
  topicLabel?: string;
  ctaLabel?: string;
  audienceLabel?: string;
  copyVariantLabel?: string;
  creativeVariantLabel?: string;
  campaignLabel?: string;
  adSetLabel?: string;
  adLabel?: string;
  placementLabel?: string;
  objectiveLabel?: string;
  notes?: string;
  insights?: string;
};

export const section10MetaAdsDemoSnapshot: PerformanceSnapshotSeed = {
  snapshotId: "perf_2026_05_16_meta_ads_september_registration_warmup",
  campaignId: "camp_webinar_june",
  campaignName: "Event Campaign — September Registration Warmup",
  platform: "meta_ads",
  contentType: "ad",
  contentTitle: "September registration warmup ad concept",
  metricDate: "2026-05-12",
  sourceSystem: "demo",
  sourceMode: "demo",
  metricStatus: "partial",
  impressions: 12000,
  reach: 9200,
  clicks: 310,
  clickThroughRate: 2.58,
  spend: 180,
  registrations: 21,
  costPerRegistration: 8.57,
  hookLabel: "Cost comparison hook",
  ctaLabel: "Register for event",
  audienceLabel: "Warm list / creators",
  campaignLabel: "September registration warmup",
  notes: "Demo Meta Ads snapshot — manual entry pattern for future read-only connector; no live Ads API.",
};

export const defaultPerformanceSnapshotSeeds: PerformanceSnapshotSeed[] = [
  {
    snapshotId: "perf_2026_05_20_youtube_weekly_launch_virtual_event_cost_shift",
    campaignId: "camp_reactivation_may",
    campaignName: "Weekly Launch — Virtual Event Cost Shift",
    productionAssetId: "prod_asset_2026_05_virtual_events_still_a_thing",
    platform: "youtube",
    contentType: "full_video",
    contentTitle: "Are Virtual Events Still Worth It?",
    metricDate: "2026-05-12",
    sourceSystem: "demo",
    sourceMode: "demo",
    metricStatus: "partial",
    views: 842,
    clicks: 96,
    clickThroughRate: 11.4,
    comments: 12,
    shares: 8,
    topicLabel: "Virtual events still matter",
    hookLabel: "Question hook",
    ctaLabel: "Watch full video",
    notes: "Early full-video performance shows stronger engagement around direct question framing.",
  },
  {
    snapshotId: "perf_2026_05_20_email_weekly_launch_virtual_event_cost_shift",
    campaignId: "camp_reactivation_may",
    campaignName: "Weekly Launch — Virtual Event Cost Shift",
    platform: "email",
    contentType: "email",
    contentTitle: "Virtual events are still a thing",
    metricDate: "2026-05-12",
    sourceSystem: "demo",
    sourceMode: "demo",
    metricStatus: "partial",
    opens: 1840,
    openRate: 37.2,
    emailClicks: 214,
    emailClickRate: 11.6,
    registrations: 23,
    hookLabel: "Myth-busting opener",
    ctaLabel: "Watch full video",
    notes: "Email CTA performed well when positioned around the virtual-events myth.",
  },
  {
    snapshotId: "perf_2026_05_21_instagram_reel_weekly_launch_virtual_event_cost_shift",
    campaignId: "camp_reactivation_may",
    campaignName: "Weekly Launch — Virtual Event Cost Shift",
    trendId: "trend_2026_05_instagram_myth_busting_reel_hook",
    platform: "instagram",
    contentType: "reel",
    contentTitle: "Virtual events are dead? Not even close.",
    metricDate: "2026-05-13",
    sourceSystem: "demo",
    sourceMode: "demo",
    metricStatus: "partial",
    views: 3200,
    reach: 2800,
    likes: 144,
    comments: 18,
    shares: 22,
    saves: 31,
    clicks: 46,
    engagement: 261,
    hookLabel: "Myth-busting opener",
    topicLabel: "Virtual events still matter",
    ctaLabel: "Watch full video",
    creativeVariantLabel: "Brandon reel 1",
    notes: "Demo/manual snapshot — myth-busting angle generated strong saves and shares (not live Instagram API).",
  },
  {
    snapshotId: "perf_2026_05_14_facebook_social_hotel_cost_clip",
    campaignId: "camp_nurture_sequence",
    campaignName: "Content Campaign — Hotel Cost Comparison Clip",
    platform: "facebook",
    contentType: "social_post",
    contentTitle: "Would you rather host virtually or in person?",
    metricDate: "2026-05-10",
    sourceSystem: "demo",
    sourceMode: "demo",
    metricStatus: "partial",
    impressions: 2100,
    comments: 41,
    clicks: 68,
    engagement: 93,
    topicLabel: "Event cost comparison",
    hookLabel: "Engagement question",
    ctaLabel: "Comment/reply",
    notes: "Question posts generated conversation but fewer direct clicks.",
  },
  section10MetaAdsDemoSnapshot,
  {
    snapshotId: "perf_2026_05_15_pinterest_social_september_registration_warmup",
    campaignId: "camp_webinar_june",
    campaignName: "Event Campaign — September Registration Warmup",
    platform: "pinterest",
    contentType: "social_post",
    contentTitle: "How to host a profitable virtual event without hotel costs",
    metricDate: "2026-05-11",
    sourceSystem: "demo",
    sourceMode: "demo",
    metricStatus: "partial",
    impressions: 1460,
    saves: 36,
    clicks: 52,
    topicLabel: "Profitable virtual events",
    hookLabel: "Search-style title",
    ctaLabel: "Learn more",
    notes: "Search-style titles may be useful for evergreen Pinterest content.",
  },
];

export const demoPerformanceReviewSeed = {
  reviewId: "perf_review_demo_weekly_launch_virtual_event_cost_shift",
  campaignId: "camp_reactivation_may",
  campaignName: "Weekly Launch — Virtual Event Cost Shift",
  reviewType: "weekly_launch_review",
  status: "needs_review",
  dateRangeStart: "2026-05-10",
  dateRangeEnd: "2026-05-14",
  summary:
    "The launch performed best when the message directly challenged the belief that virtual events are no longer relevant. Email and Instagram saw stronger engagement from myth-busting hooks than generic educational framing.",
  wins: [
    "Myth-busting hook performed well on email and reels.",
    "Direct full-video CTA drove measurable clicks.",
    "Cost/profit framing appears promising.",
  ],
  misses: ["Generic social captions were weaker.", "Facebook question post drove comments but fewer direct clicks."],
  patterns: [
    "Myth-busting framing correlates with higher saves on short-form.",
    "Direct CTAs outperform vague curiosity CTAs where measured.",
  ],
  recommendations: [
    "Use a myth-busting reel for each full-video launch.",
    "Test cost/profit framing more often.",
    "Keep CTA direct when promoting full videos.",
    "Save strongest findings as campaign learning candidates (human approval).",
  ],
  questionsToInvestigate: [
    "Does myth-busting fatigue appear after repeated launches?",
    "How does Pinterest search-style titling compare on registration outcomes?",
  ],
  suggestedLearningCandidates: [
    "Myth-busting hooks create stronger short-form engagement.",
    "Direct watch-video CTAs can outperform vague curiosity CTAs.",
    "Event cost comparison is a promising recurring topic.",
  ],
  sourceMode: "demo",
};
