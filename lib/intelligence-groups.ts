/**
 * UI-only intelligence grouping for weekly launch / marketing coordination framing.
 * Does not change persisted Convex `agentId` values; grouping is derived here for labels only.
 */

export const INTELLIGENCE_GROUP_LABELS = {
  copy: "Copy Intelligence",
  heartbeat: "Campaign Heartbeat",
  production: "Production Bridge",
  trend: "Trend Intelligence",
  performance: "Performance Intelligence",
  learning: "Learning Loop",
  platform_connector: "Platform Connector Intelligence",
} as const;

export type IntelligenceGroupKey = keyof typeof INTELLIGENCE_GROUP_LABELS;

const AGENT_ID_TO_GROUP: Partial<Record<string, IntelligenceGroupKey>> = {
  campaign_intake: "copy",
  strategist: "heartbeat",
  audience_agent: "trend",
  offer_agent: "copy",
  copywriter: "copy",
  bari_voice_agent: "copy",
  brand_rules_checker: "copy",
  compliance_guard: "copy",
  skeptic: "copy",
  approval_router: "copy",
  human_approval: "copy",
  performance_agent: "performance",
  keap_zapier_prep: "copy",
  production_asset_intake: "production",
  asset_readiness_checker: "production",
  transcript_summary_bridge: "production",
  shorts_availability_checker: "production",
  production_to_campaign_mapper: "production",
  response_classifier: "copy",
  performance_reporter: "performance",
  learning_agent: "learning",
  copy_pipeline: "copy",
  copy_intake_agent: "copy",
  context_retrieval_agent: "copy",
  angle_strategy_agent: "copy",
  hook_agent: "copy",
  voice_matching_agent: "copy",
  offer_cta_agent: "copy",
  structure_agent: "copy",
  draft_generation_agent: "copy",
  claims_compliance_agent: "copy",
  rewrite_strengthening_agent: "copy",
  final_assembly_agent: "copy",
  human_review_routing_agent: "copy",
  learning_feedback_agent: "copy",
  trend_scout_agent: "trend",
  trend_fit_agent: "trend",
  content_adaptation_agent: "trend",
  trend_risk_agent: "trend",
  platform_pattern_agent: "trend",
  trend_to_campaign_mapper: "trend",
  trend_learning_agent: "trend",
  metrics_pull_agent: "performance",
  metrics_normalization_agent: "performance",
  dashboard_writer_agent: "performance",
  campaign_comparison_agent: "performance",
  pattern_analysis_agent: "performance",
  recommendation_agent: "performance",
  learning_capture_agent: "performance",
  performance_qa_agent: "performance",
  meta_readiness_checker: "platform_connector",
  meta_metrics_mapper: "platform_connector",
  meta_creative_pattern_agent: "platform_connector",
  meta_trend_signal_agent: "platform_connector",
  meta_performance_summary_agent: "platform_connector",
  meta_recommendation_draft_agent: "platform_connector",
  meta_safety_guard_agent: "platform_connector",
};

export function intelligenceGroupKeyForAgentId(agentId: string): IntelligenceGroupKey | null {
  return AGENT_ID_TO_GROUP[agentId] ?? null;
}

export function intelligenceGroupLabelForAgentId(agentId: string): string {
  const key = intelligenceGroupKeyForAgentId(agentId);
  return key ? INTELLIGENCE_GROUP_LABELS[key] : "Workflow";
}

export type IntelligenceHubCard = {
  id: IntelligenceGroupKey;
  title: string;
  description: string;
  href: string;
  emphasis?: boolean;
  plannedNote?: string;
};

/** Roadmap layer names for Copy Intelligence — not all are live agents in Convex. */
export const COPY_INTELLIGENCE_PLANNED_LAYER_NAMES = [
  "Copy Intake Agent",
  "Voice Matching Agent",
  "Hook Agent",
  "Offer / CTA Agent",
  "Structure Agent",
  "Claims / Compliance Agent",
  "Rewrite / Strengthening Agent",
  "Final Assembly Agent",
  "Learning Feedback Agent",
] as const;

export const INTELLIGENCE_HUB_CARDS: IntelligenceHubCard[] = [
  {
    id: "copy",
    title: INTELLIGENCE_GROUP_LABELS.copy,
    description:
      "Multi-agent copy workflow: intake, voice, hooks, offer/CTA, structure, claims/compliance, rewrite, assembly, and learning feedback — configurable and dry-run until you promote runs.",
    href: "/intelligence/copy",
    emphasis: true,
  },
  {
    id: "heartbeat",
    title: INTELLIGENCE_GROUP_LABELS.heartbeat,
    description:
      "Scheduler/checker for readiness, daily tasks, missing handoffs, and risk summaries (deterministic in this app). Hermes by Nous on the office Mac mini can eventually coordinate approved heartbeat runs when the Hermes runtime is connected — Campaign Heartbeat stays the feature name.",
    href: "/intelligence/heartbeat",
    plannedNote: "History on Intelligence; run checks from Home.",
  },
  {
    id: "production",
    title: INTELLIGENCE_GROUP_LABELS.production,
    description:
      "References source assets from Production Hub, Frame.io, and future Mux storage so launch packets can use production-ready videos and related creative without merging systems.",
    href: "/operations/production-bridge",
    plannedNote: "Manual cache today; read-only sync planned.",
  },
  {
    id: "trend",
    title: INTELLIGENCE_GROUP_LABELS.trend,
    description:
      "Structured trend signals: platforms, short-form patterns, meme hooks, fit/risk scoring, adaptations, and campaign links — manual and dry-run today; connectors planned via Operations.",
    href: "/intelligence/trends",
  },
  {
    id: "performance",
    title: INTELLIGENCE_GROUP_LABELS.performance,
    description:
      "Structured snapshots, campaign and platform rollups, comparisons, dry-run reviews, and learning candidates — manual and demo until read-only connectors ship.",
    href: "/intelligence/performance",
  },
  {
    id: "learning",
    title: INTELLIGENCE_GROUP_LABELS.learning,
    description:
      "Human edits and outcomes flowing into approved reusable learnings — overlaps Library Learning today; agents here are dry-run/configurable.",
    href: "/libraries/learning",
    plannedNote: "Authoritative records still live in Library.",
  },
  {
    id: "platform_connector",
    title: INTELLIGENCE_GROUP_LABELS.platform_connector,
    description:
      "Explores read-only platform insight connectors (Meta, Instagram, Facebook, Meta Ads first) that can feed Performance, Trend, and Copy Intelligence — no posting, ad edits, or budget changes.",
    href: "/intelligence/platform-connector",
    plannedNote: "Dry-run agents and manual data only in this phase.",
  },
];
