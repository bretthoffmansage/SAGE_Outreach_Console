import type {
  AgentDefinition,
  AgentRunStep,
  ApprovalItem,
  AuditEvent,
  Campaign,
  IntegrationConnection,
  LangGraphNode,
  LearningInsight,
  LibraryItem,
  PerformanceSnapshot,
  ResponseClassification,
  UserProfile,
} from "@/lib/domain";

export const users: UserProfile[] = [
  { id: "user_admin", name: "Alex Admin", email: "admin@example.com", roles: ["admin"], avatarInitials: "AA" },
  { id: "user_operator", name: "Morgan Operator", email: "operator@example.com", roles: ["marketing_operator"], avatarInitials: "MO" },
  { id: "user_bari", name: "Bari", email: "bari@example.com", roles: ["bari"], avatarInitials: "BA" },
  { id: "user_blue", name: "Blue", email: "blue@example.com", roles: ["blue"], avatarInitials: "BL" },
];

export const campaigns: Campaign[] = [
  {
    id: "camp_reactivation_may",
    name: "Cold Lead Reactivation — May Week 2",
    goal: "Reactivation",
    channels: ["email"],
    audience: "Dormant warm leads",
    offerId: "offer_sage_call",
    ownerId: "user_operator",
    status: "needs_bari_review",
    riskLevel: "yellow",
    pendingApprovals: ["bari"],
    nextAction: "Bari should approve the founder-voice draft.",
    updatedAt: "2026-04-30T14:30:00.000Z",
  },
  {
    id: "camp_webinar_june",
    name: "SAGE Webinar Invitation — June",
    goal: "Event registration",
    channels: ["email", "landing_page"],
    audience: "Engaged newsletter subscribers",
    offerId: "lead_sage_webinar",
    ownerId: "user_operator",
    status: "needs_blue_review",
    riskLevel: "red",
    pendingApprovals: ["blue"],
    nextAction: "Blue should review the positioning and guarantee language.",
    updatedAt: "2026-04-30T15:10:00.000Z",
  },
  {
    id: "camp_nurture_sequence",
    name: "Founder Nurture Sequence Refresh",
    goal: "Nurture",
    channels: ["email"],
    audience: "New guide downloads",
    offerId: "lead_founder_guide",
    ownerId: "user_operator",
    status: "ready_for_keap",
    riskLevel: "green",
    pendingApprovals: [],
    nextAction: "Prepare manual Keap export and trigger tag handoff.",
    updatedAt: "2026-04-30T16:00:00.000Z",
  },
];

export const approvals: ApprovalItem[] = [
  {
    id: "approval_bari_voice_001",
    campaignId: "camp_reactivation_may",
    owner: "bari",
    title: "Approve reactivation founder email",
    reason: "Email is sent under Bari’s name and uses founder-voice encouragement.",
    status: "pending",
    riskLevel: "yellow",
    recommendedDecision: "approve_with_edits",
  },
  {
    id: "approval_blue_claim_001",
    campaignId: "camp_webinar_june",
    owner: "blue",
    title: "Review webinar promise and urgency language",
    reason: "Compliance Guard flagged a high-risk transformation claim.",
    status: "pending",
    riskLevel: "red",
    recommendedDecision: "request_changes",
  },
  {
    id: "approval_internal_keap_001",
    campaignId: "camp_nurture_sequence",
    owner: "internal",
    title: "Confirm Keap handoff checklist",
    reason: "Copy is approved and campaign is ready for operations review.",
    status: "pending",
    riskLevel: "green",
    recommendedDecision: "approve",
  },
];

export const libraryItems: LibraryItem[] = [
  { id: "offer_sage_call", type: "offer", name: "Free SAGE Strategy Call", status: "active", summary: "Low-pressure strategy call with approved claims and CTA.", tags: ["offer", "approved", "email"], riskLevel: "green" },
  { id: "lead_sage_webinar", type: "lead_magnet", name: "SAGE Webinar", status: "needs_blue_approval", summary: "Event lead magnet requiring positioning review before launch.", tags: ["lead magnet", "event"], riskLevel: "yellow" },
  { id: "email_gold_001", type: "email", name: "You can do this — Bari", status: "gold", summary: "Approved Bari voice source with warm direct encouragement.", tags: ["gold", "founder voice"], riskLevel: "green" },
  { id: "rule_sage_caps", type: "voice_rule", name: "Always capitalize SAGE", status: "blocking", summary: "Do not write Sage; SAGE capitalization errors block final approval.", tags: ["terminology", "blocking"], riskLevel: "red" },
  { id: "signoff_you_can", type: "signoff", name: "You can do this", status: "approved", summary: "Approved encouraging sign-off family for founder nurture emails.", tags: ["signoff", "bari"], riskLevel: "green" },
  { id: "aud_dormant", type: "audience", name: "Dormant warm leads", status: "active", summary: "Keap tag mapping placeholder for inactive but previously engaged contacts.", tags: ["keap", "reactivation"], riskLevel: "yellow" },
  { id: "comp_no_guarantee", type: "compliance_rule", name: "No guaranteed transformation", status: "blocking", summary: "Avoid promises of guaranteed results or personal transformation.", tags: ["claims", "blocking"], riskLevel: "red" },
  { id: "learn_warm_direct", type: "learning", name: "Warmer, less corporate phrasing", status: "candidate", summary: "Bari edits prefer direct encouragement over polished marketing phrases.", tags: ["bari edit", "candidate"], riskLevel: "green" },
];

export const agents: AgentDefinition[] = [
  { id: "agent_strategy", name: "Strategist Agent", purpose: "Defines campaign angle and objective.", model: "OpenAI structured output", inputs: ["campaign intake", "library context"], outputs: ["objective", "angle", "risks"], status: "demo" },
  { id: "agent_audience", name: "Audience Agent", purpose: "Validates segment and Keap mapping.", model: "OpenAI structured output", inputs: ["campaign", "audience library"], outputs: ["segment", "exclusions", "confidence"], status: "demo" },
  { id: "agent_offer", name: "Offer/Lead Magnet Agent", purpose: "Selects approved offers and flags Blue review.", model: "OpenAI structured output", inputs: ["offer library"], outputs: ["selected offer", "claims", "CTA"], status: "demo" },
  { id: "agent_copywriter", name: "Copywriter Agent", purpose: "Drafts subject, preview, and email body variants.", model: "Claude copy model", inputs: ["brief", "examples"], outputs: ["subject lines", "body", "CTA"], status: "needs_config" },
  { id: "agent_bari_voice", name: "Bari Voice Agent", purpose: "Rewrites with approved Bari examples and rules.", model: "Claude/OpenAI hybrid", inputs: ["copy", "voice rules"], outputs: ["voice draft", "rules applied"], status: "needs_config" },
  { id: "agent_compliance", name: "Compliance Guard", purpose: "Flags risky claims and blockers.", model: "OpenAI structured output", inputs: ["copy", "compliance rules"], outputs: ["risk", "flags", "safer wording"], status: "demo" },
  { id: "agent_router", name: "Approval Router", purpose: "Creates Bari, Blue, and internal approval requirements.", model: "OpenAI structured output", inputs: ["agent outputs"], outputs: ["approval owner", "risk", "reasons"], status: "demo" },
];

export const agentRunSteps: AgentRunStep[] = [
  { id: "step_strategy", agentId: "agent_strategy", agentName: "Strategist Agent", status: "completed", riskLevel: "green", confidence: 0.86, summary: "Reactivation angle is clear and low-pressure.", approvalRequired: false, approvalOwner: "none", structuredOutputs: { objective: "reactivation", channel_priority: "email" } },
  { id: "step_bari_voice", agentId: "agent_bari_voice", agentName: "Bari Voice Agent", status: "waiting_for_human", riskLevel: "yellow", confidence: 0.74, summary: "Draft uses approved sign-off but should be reviewed by Bari.", approvalRequired: true, approvalOwner: "bari", structuredOutputs: { signoff: "You can do this — Bari", rules_applied: ["short paragraphs", "direct encouragement"] } },
  { id: "step_router", agentId: "agent_router", agentName: "Approval Router", status: "completed", riskLevel: "yellow", confidence: 0.82, summary: "Bari review required; Blue not required for this offer.", approvalRequired: true, approvalOwner: "bari", structuredOutputs: { approval_level: 2, blocking_status: false } },
];

export const langGraphNodes: LangGraphNode[] = [
  { id: "intake", label: "Campaign Intake", status: "complete", next: ["strategist"] },
  { id: "strategist", label: "Strategist", status: "complete", next: ["audience"] },
  { id: "audience", label: "Audience", status: "complete", next: ["offer"] },
  { id: "offer", label: "Offer", status: "complete", next: ["copywriter"] },
  { id: "copywriter", label: "Copywriter", status: "complete", next: ["bari_voice"] },
  { id: "bari_voice", label: "Bari Voice", status: "human_pause", next: ["brand_rules"] },
  { id: "brand_rules", label: "Brand Rules", status: "pending", next: ["compliance"] },
  { id: "compliance", label: "Compliance", status: "pending", next: ["approval_router"] },
  { id: "approval_router", label: "Approval Router", status: "pending", next: ["keap_prep"] },
  { id: "keap_prep", label: "Keap/Zapier Prep", status: "pending", next: ["learning"] },
  { id: "learning", label: "Learning Loop", status: "pending", next: [] },
];

export const integrations: IntegrationConnection[] = [
  { id: "clerk", name: "Clerk", purpose: "Authentication and roles", status: "missing_credentials", envKeys: ["NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", "CLERK_SECRET_KEY"], fallback: "Demo role shell" },
  { id: "convex", name: "Convex", purpose: "Realtime app data and functions", status: "missing_credentials", envKeys: ["NEXT_PUBLIC_CONVEX_URL", "CONVEX_DEPLOYMENT"], fallback: "Local read-only demo data" },
  { id: "openai", name: "OpenAI", purpose: "Structured agent outputs", status: "missing_credentials", envKeys: ["OPENAI_API_KEY"], fallback: "Simulated JSON outputs" },
  { id: "anthropic", name: "Claude / Anthropic", purpose: "Long-form copy and Bari voice", status: "missing_credentials", envKeys: ["ANTHROPIC_API_KEY"], fallback: "OpenAI/manual copy fallback" },
  { id: "keap", name: "Keap", purpose: "Segments, tags, and send handoff", status: "manual_mode", envKeys: ["KEAP_CLIENT_ID", "KEAP_CLIENT_SECRET", "KEAP_ACCESS_TOKEN"], fallback: "Manual audience entry/export" },
  { id: "zapier", name: "Zapier", purpose: "Review and approved-campaign webhooks", status: "manual_mode", envKeys: ["ZAPIER_CAMPAIGN_APPROVED_WEBHOOK_URL", "ZAPIER_REVIEW_NEEDED_WEBHOOK_URL"], fallback: "Copy/export handoff" },
  { id: "helpdesk", name: "HelpDesk.com", purpose: "Ticket sync and reply intelligence", status: "manual_mode", envKeys: ["HELPDESK_CLIENT_ID", "HELPDESK_CLIENT_SECRET", "HELPDESK_WEBHOOK_SECRET"], fallback: "Manual response import" },
];

export const responses: ResponseClassification[] = [
  { id: "resp_001", campaignId: "camp_reactivation_may", classification: "marketing_reply", intent: "interested_with_question", sentiment: "positive", urgency: "medium", summary: "Lead is interested but unsure whether SAGE is beginner-friendly.", matchConfidence: 0.78 },
];

export const performanceSnapshots: PerformanceSnapshot[] = [
  { id: "perf_001", campaignId: "camp_nurture_sequence", sent: 1200, delivered: 1172, openRate: 0.46, clickRate: 0.12, replies: 34, conversions: 7, summary: "Warm direct subject line outperformed generic nurture copy." },
];

export const learningInsights: LearningInsight[] = [
  { id: "learn_001", source: "bari_edit", status: "candidate", title: "Use grounded encouragement", summary: "Bari edits removed corporate phrasing and made the CTA more personal.", confidence: 0.81 },
  { id: "learn_002", source: "campaign_performance", status: "candidate", title: "Direct subject lines win", summary: "Specific subject lines generated more replies than inspirational hooks.", confidence: 0.76 },
];

export const auditEvents: AuditEvent[] = [
  { id: "audit_001", actor: "Morgan Operator", action: "created campaign", target: "Cold Lead Reactivation — May Week 2", createdAt: "2026-04-30T14:00:00.000Z" },
  { id: "audit_002", actor: "Approval Router", action: "created approval", target: "Bari copy review", createdAt: "2026-04-30T14:20:00.000Z" },
  { id: "audit_003", actor: "Compliance Guard", action: "flagged claim", target: "SAGE Webinar Invitation — June", createdAt: "2026-04-30T15:05:00.000Z" },
];
