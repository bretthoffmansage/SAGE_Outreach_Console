/** Demo platform insights (Section 10) — manual/demo only; no live Meta import. */

export type PlatformInsightSeed = {
  insightId: string;
  platform: string;
  sourceSystem: string;
  sourceMode: string;
  insightType: string;
  title: string;
  summary: string;
  evidence?: string;
  status: string;
  riskLevel?: string;
  recommendedActions?: string;
};

export const defaultPlatformInsightSeeds: PlatformInsightSeed[] = [
  {
    insightId: "pi_demo_instagram_myth_hooks",
    platform: "instagram",
    sourceSystem: "demo",
    sourceMode: "demo",
    insightType: "hook_pattern",
    title: "Myth-busting hooks are strong on Instagram",
    summary:
      "Manual/demo snapshots suggest myth-busting openers may produce higher saves and shares for short-form posts.",
    status: "candidate",
    riskLevel: "low",
    recommendedActions: "Test myth-busting openers with clear proof within the first 5 seconds.",
  },
  {
    insightId: "pi_demo_facebook_questions",
    platform: "facebook",
    sourceSystem: "demo",
    sourceMode: "demo",
    insightType: "performance_summary",
    title: "Facebook questions create comments but not always clicks",
    summary:
      "Question posts may be useful for engagement and audience research, but should not be treated as direct conversion posts without supporting CTA strategy.",
    status: "candidate",
    riskLevel: "medium",
    recommendedActions: "Pair question posts with a tracked CTA path when registration is the goal.",
  },
  {
    insightId: "pi_demo_meta_ads_cost_angle",
    platform: "meta_ads",
    sourceSystem: "demo",
    sourceMode: "demo",
    insightType: "recommendation",
    title: "Meta ads cost-comparison angle needs testing",
    summary: "Cost/profit framing could be a promising ad concept, but current data is demo/manual only.",
    status: "candidate",
    riskLevel: "medium",
    recommendedActions: "Run controlled tests with finance review before scaling spend.",
  },
];
