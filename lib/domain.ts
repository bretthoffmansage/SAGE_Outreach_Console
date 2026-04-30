export type Role = "admin" | "marketing_operator" | "copy_reviewer" | "bari" | "blue" | "internal_reviewer" | "viewer";

export type CampaignStatus =
  | "intake_draft"
  | "agent_drafting"
  | "needs_internal_review"
  | "needs_bari_review"
  | "needs_blue_review"
  | "blocked"
  | "approved"
  | "ready_for_keap"
  | "scheduled"
  | "sent"
  | "reporting"
  | "learning_complete"
  | "archived";

export type RiskLevel = "green" | "yellow" | "red";
export type ApprovalOwner = "bari" | "blue" | "internal" | "none";
export type ApprovalStatus = "pending" | "approved" | "approved_with_changes" | "changes_requested" | "rejected" | "blocked";
export type IntegrationStatus = "connected" | "disconnected" | "missing_credentials" | "manual_mode" | "error";
export type LearningStatus = "candidate" | "approved" | "rejected" | "archived";

export type UserProfile = {
  id: string;
  name: string;
  email: string;
  roles: Role[];
  avatarInitials: string;
};

export type Campaign = {
  id: string;
  name: string;
  goal: string;
  channels: string[];
  audience: string;
  offerId: string;
  ownerId: string;
  status: CampaignStatus;
  riskLevel: RiskLevel;
  pendingApprovals: ApprovalOwner[];
  nextAction: string;
  updatedAt: string;
};

export type ApprovalItem = {
  id: string;
  campaignId: string;
  owner: ApprovalOwner;
  title: string;
  reason: string;
  status: ApprovalStatus;
  riskLevel: RiskLevel;
  recommendedDecision: string;
  notes?: string;
};

export type LibraryItem = {
  id: string;
  type: "offer" | "lead_magnet" | "email" | "voice_rule" | "signoff" | "audience" | "compliance_rule" | "learning";
  name: string;
  status: string;
  summary: string;
  tags: string[];
  riskLevel?: RiskLevel;
};

export type AgentDefinition = {
  id: string;
  name: string;
  purpose: string;
  model: string;
  inputs: string[];
  outputs: string[];
  status: "ready" | "needs_config" | "demo";
};

export type AgentRunStep = {
  id: string;
  agentId: string;
  agentName: string;
  status: "queued" | "running" | "completed" | "failed" | "waiting_for_human";
  riskLevel: RiskLevel;
  confidence: number;
  summary: string;
  approvalRequired: boolean;
  approvalOwner: ApprovalOwner;
  structuredOutputs: Record<string, string | number | boolean | string[]>;
};

export type LangGraphNode = {
  id: string;
  label: string;
  status: "complete" | "pending" | "blocked" | "human_pause";
  next: string[];
};

export type IntegrationConnection = {
  id: string;
  name: string;
  purpose: string;
  status: IntegrationStatus;
  envKeys: string[];
  fallback: string;
  lastSync?: string;
};

export type ResponseClassification = {
  id: string;
  campaignId: string;
  classification: string;
  intent: string;
  sentiment: "positive" | "neutral" | "negative";
  urgency: "low" | "medium" | "high";
  summary: string;
  matchConfidence: number;
};

export type PerformanceSnapshot = {
  id: string;
  campaignId: string;
  sent: number;
  delivered: number;
  openRate: number;
  clickRate: number;
  replies: number;
  conversions: number;
  summary: string;
};

export type LearningInsight = {
  id: string;
  source: "bari_edit" | "blue_decision" | "campaign_performance" | "helpdesk_reply" | "agent_evaluation";
  status: LearningStatus;
  title: string;
  summary: string;
  confidence: number;
};

export type AuditEvent = {
  id: string;
  actor: string;
  action: string;
  target: string;
  createdAt: string;
};
