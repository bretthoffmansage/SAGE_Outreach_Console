export type ModelProvider = "openai" | "anthropic" | "manual" | "demo";

const providerEnvMap: Record<ModelProvider, string[]> = {
  openai: ["OPENAI_API_KEY"],
  anthropic: ["ANTHROPIC_API_KEY"],
  manual: [],
  demo: [],
};

export function modelProviderEnvKeys(provider: ModelProvider) {
  return providerEnvMap[provider] ?? [];
}

export function validateModelProvider(provider: ModelProvider, model: string) {
  const requiredEnvVars = modelProviderEnvKeys(provider);
  const configuredEnvVars = requiredEnvVars.filter((key) => Boolean(process.env[key]));
  const missingEnvVars = requiredEnvVars.filter((key) => !process.env[key]);
  const ready = missingEnvVars.length === 0;

  return {
    provider,
    model,
    requiredEnvVars,
    configuredEnvVars,
    missingEnvVars,
    ready,
    mode: provider === "manual" || provider === "demo" ? "dry_run" : ready ? "configured" : "missing_credentials",
    summary:
      provider === "manual" || provider === "demo"
        ? "Manual/demo provider selected. Dry-run output only."
        : ready
          ? `Provider credentials detected for ${provider}.`
          : `Missing required environment variables for ${provider}.`,
  };
}

export function buildDryRunModelResult(args: {
  provider: ModelProvider;
  model: string;
  agentId: string;
  agentName: string;
  nextAgentIds: string[];
  handoffConditions: string[];
}) {
  return {
    provider: args.provider,
    model: args.model,
    executionMode: "dry_run",
    agentId: args.agentId,
    agentName: args.agentName,
    handoffPreview: {
      nextAgentIds: args.nextAgentIds,
      handoffConditions: args.handoffConditions,
    },
    note: "No external model call was made. This is a runtime-prep dry run.",
  };
}
