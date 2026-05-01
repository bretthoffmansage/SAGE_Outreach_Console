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
  type: string;
  goal: string;
  channels: string[];
  audience: string;
  audienceId?: string;
  offer: string;
  offerId?: string;
  primaryCta?: string;
  sendWindow?: string;
  successMetric?: string;
  allowedClaims: string[];
  knownExclusions: string[];
  sourceMapping?: string;
  keapTagMapping?: string;
  ownerId?: string;
  ownerName: string;
  stage: string;
  status: CampaignStatus;
  riskLevel: RiskLevel;
  pendingApprovals: ApprovalOwner[];
  bariApprovalRequired: boolean;
  blueApprovalRequired: boolean;
  internalApprovalRequired: boolean;
  bariApprovalStatus?: ApprovalStatus;
  blueApprovalStatus?: ApprovalStatus;
  internalApprovalStatus?: ApprovalStatus;
  copyStatus?: string;
  keapPrepStatus?: string;
  responseStatus?: string;
  learningStatus?: string;
  nextAction: string;
  createdAt: string;
  updatedAt: string;
  lastActivityAt?: string;
  sortOrder: number;
  archived?: boolean;
  notes?: string;
};

export type ApprovalItem = {
  id: string;
  type: string;
  owner: Exclude<ApprovalOwner, "none">;
  queue: "bari" | "blue" | "internal";
  campaignId?: string;
  campaignName: string;
  title: string;
  reason: string;
  context?: string;
  status: ApprovalStatus;
  riskLevel: RiskLevel;
  recommendedDecision: string;
  actionNeeded?: string;
  selectedSignoff?: string;
  subjectLine?: string;
  previewText?: string;
  bodyText?: string;
  editedSubjectLine?: string;
  editedPreviewText?: string;
  editedBodyText?: string;
  notes?: string;
  decisionNotes?: string;
  requestedChanges?: string;
  decidedAt?: number;
  decidedBy?: string;
  createdAt?: number;
  updatedAt?: number;
  sortOrder?: number;
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
  provider: string;
  category: string;
  purpose: string;
  status: IntegrationStatus | "demo_fallback" | "not_configured";
  statusLabel: string;
  description: string;
  envKeys: string[];
  configuredEnvVars?: string[];
  missingEnvVars?: string[];
  fallback: string;
  lastCheckResult?: string;
  setupNotes?: string;
  setupInstructions?: string;
  healthSummary?: string;
  enabled: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  lastSync?: string;
  notes?: string;
};

export type ResponseClassification = {
  id: string;
  title: string;
  classification: string;
  status: string;
  sentiment: "positive" | "neutral" | "negative";
  urgency: "low" | "medium" | "high";
  summary: string;
  originalMessage?: string;
  senderName?: string;
  senderEmail?: string;
  receivedAt: string;
  campaignId?: string;
  campaignName?: string;
  matchConfidence?: number;
  recommendedAction: string;
  suggestedReply?: string;
  suggestedReplyStatus?: string;
  noAutoSend: boolean;
  assignedTo?: string;
  source?: string;
  sourceMessageId?: string;
  helpdeskThreadId?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
  notes?: string;
  sortOrder: number;
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
