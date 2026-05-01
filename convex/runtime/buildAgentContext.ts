type AgentExecutionConfig = {
  agentId: string;
  displayName: string;
  systemPrompt: string;
  taskPromptTemplate: string;
  preferredProvider: "openai" | "anthropic" | "manual" | "demo";
  preferredModel: string;
  requiredContextSources: string[];
  nextAgentIds: string[];
  handoffConditions: string[];
  allowedActions: string[];
  disallowedActions: string[];
};

type CampaignContext = {
  campaignId: string;
  name: string;
  goal: string;
  audience: string;
  offer: string;
  status: string;
  stage: string;
  nextAction: string;
} | null;

type LibraryContextItem = {
  recordId: string;
  type: string;
  name: string;
  summary: string;
};

type LearningInsightItem = {
  recordId: string;
  title: string;
  summary: string;
  confidence: number;
};

export function buildAgentRuntimeContextPayload(args: {
  config: AgentExecutionConfig;
  campaign: CampaignContext;
  libraryItems: LibraryContextItem[];
  learningInsights: LearningInsightItem[];
}) {
  const relevantLibrary = args.libraryItems
    .filter((item) =>
      args.config.requiredContextSources.some((source) =>
        `${item.type} ${item.name} ${item.summary}`.toLowerCase().includes(source.toLowerCase()),
      ),
    )
    .slice(0, 6);

  const relevantLearning = args.learningInsights.slice(0, 4);

  return {
    agentId: args.config.agentId,
    agentName: args.config.displayName,
    provider: args.config.preferredProvider,
    model: args.config.preferredModel,
    campaign: args.campaign,
    requiredContextSources: args.config.requiredContextSources,
    contextSummary: {
      libraryRecords: relevantLibrary.length,
      learningInsights: relevantLearning.length,
      campaignAttached: Boolean(args.campaign),
    },
    libraryContext: relevantLibrary,
    learningContext: relevantLearning,
    handoff: {
      nextAgentIds: args.config.nextAgentIds,
      handoffConditions: args.config.handoffConditions,
    },
    safety: {
      allowedActions: args.config.allowedActions,
      disallowedActions: args.config.disallowedActions,
    },
  };
}
