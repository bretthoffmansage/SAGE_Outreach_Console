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
  /** Optional structured demo metadata for richer Library inspector panels. */
  payload?: Record<string, unknown>;
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

export type AgentProvider = "openai" | "anthropic" | "manual" | "demo";
export type AgentRuntimeStatus = "idle" | "ready" | "running" | "human_pause" | "pending" | "blocked" | "complete" | "error";

export type AgentConfigRecord = {
  agentId: string;
  displayName: string;
  shortDescription: string;
  workflowOrder: number;
  category: string;
  enabled: boolean;
  systemPrompt: string;
  taskPromptTemplate: string;
  styleGuidance?: string;
  requiredContextSources: string[];
  exampleReferences?: string[];
  preferredProvider: AgentProvider;
  preferredModel: string;
  temperature: number;
  maxTokens: number;
  structuredOutputRequired: boolean;
  inputSchemaJson: string;
  outputSchemaJson: string;
  requiredInputs: string[];
  optionalInputs: string[];
  requiredOutputs: string[];
  escalationMarkers: string[];
  confidenceField?: string;
  riskField?: string;
  activeRules: string[];
  blockingRules: string[];
  warningRules: string[];
  allowedActions: string[];
  disallowedActions: string[];
  humanApprovalRequired: boolean;
  canCreateApprovalItems: boolean;
  canModifyCopy: boolean;
  canReadLibraries: boolean;
  canTriggerIntegrations: boolean;
  nextAgentIds: string[];
  fallbackAgentId?: string;
  blockedRoute?: string;
  humanPauseRoute?: string;
  handoffConditions: string[];
  retryPolicy?: string;
  maxRetries: number;
  configVersion: number;
  lastEditedBy?: string;
  lastEditedAt: number;
  notes?: string;
};

export type AgentRuntimeStateRecord = {
  agentId: string;
  status: AgentRuntimeStatus;
  isRunning: boolean;
  currentTaskLabel?: string;
  currentTaskDetail?: string;
  lastStartedAt?: number;
  lastFinishedAt?: number;
  lastRunId?: string;
  lastError?: string;
  lastOutputSummary?: string;
  updatedAt: number;
};

export type AgentRunRecord = {
  runId: string;
  campaignId?: string;
  agentId: string;
  status: AgentRuntimeStatus;
  inputSnapshot?: string;
  outputSummary?: string;
  outputJson?: string;
  startedAt: number;
  finishedAt?: number;
  error?: string;
};

export type TodayTaskDestinationMode = "campaign" | "review" | "library" | "intelligence" | "operations";
export type TodayTaskPriority = "green" | "amber" | "red" | "blue" | "gray";
export type TodayTaskStatus = "current" | "completed";

export type TodayTaskRecord = {
  taskId: string;
  title: string;
  context: string;
  category: string;
  priority: TodayTaskPriority;
  sourceRoute: string;
  sourceLabel: string;
  destinationMode: TodayTaskDestinationMode;
  status: TodayTaskStatus;
  createdAt: number;
  completedAt?: number;
  sortOrder: number;
  updatedAt: number;
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
  /** Optional structured demo metadata for richer Learning inspector panels. */
  payload?: Record<string, unknown>;
};

export type AuditEvent = {
  id: string;
  actor: string;
  action: string;
  target: string;
  createdAt: string;
};
