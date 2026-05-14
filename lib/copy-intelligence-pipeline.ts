/** Section 6 — Copy Intelligence pipeline stages (UI + documentation). */
export const COPY_INTELLIGENCE_PIPELINE_STAGES = [
  { key: "intake", label: "Copy Intake", agentId: "copy_intake_agent", safetyMode: "read_only", purpose: "Structured copy brief from launch packet." },
  { key: "context", label: "Context Retrieval", agentId: "context_retrieval_agent", safetyMode: "read_only", purpose: "Library + trust-labeled context." },
  { key: "angle", label: "Angle Strategy", agentId: "angle_strategy_agent", safetyMode: "draft_only", purpose: "Angle, pain point, promise framing." },
  { key: "hooks", label: "Hook Lab", agentId: "hook_agent", safetyMode: "draft_only", purpose: "Hooks per platform with risk notes." },
  { key: "voice", label: "Voice Match", agentId: "voice_matching_agent", safetyMode: "draft_only", purpose: "Sage tone + Bari fit; sparse escalation." },
  { key: "cta", label: "Offer / CTA", agentId: "offer_cta_agent", safetyMode: "draft_only", purpose: "CTA clarity and transitions." },
  { key: "structure", label: "Structure", agentId: "structure_agent", safetyMode: "draft_only", purpose: "Outlines per format." },
  { key: "draft", label: "Draft Generation", agentId: "draft_generation_agent", safetyMode: "draft_only", purpose: "First-pass drafts (preview only)." },
  { key: "claims", label: "Claims / Compliance", agentId: "claims_compliance_agent", safetyMode: "review_assist", purpose: "Risk flags and review hints." },
  { key: "rewrite", label: "Rewrite / Strengthen", agentId: "rewrite_strengthening_agent", safetyMode: "draft_only", purpose: "Stronger variants without changing facts." },
  { key: "assembly", label: "Final Assembly", agentId: "final_assembly_agent", safetyMode: "draft_only", purpose: "Package for human review." },
  { key: "routing", label: "Review Routing", agentId: "human_review_routing_agent", safetyMode: "review_assist", purpose: "Internal / Blue / Bari suggestions with reasons." },
  { key: "learning", label: "Learning Feedback", agentId: "learning_feedback_agent", safetyMode: "learning_candidate", purpose: "Candidates only — not auto-approved." },
] as const;

export const COPY_INTELLIGENCE_CONTEXT_BUCKETS = [
  "Copy Archive",
  "Voice & Style",
  "Audience Intelligence",
  "Offer / CTA Library",
  "Platform Playbooks",
  "Compliance Rules",
  "Campaign Learnings",
  "Swipe File (inspiration only)",
] as const;
