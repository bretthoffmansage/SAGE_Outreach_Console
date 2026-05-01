export function createAgentRunId(agentId: string) {
  return `run:${agentId}:${Date.now()}`;
}

export function buildDryRunInputSnapshot(agentName: string, campaignName?: string | null) {
  return `${agentName} runtime-prep dry run${campaignName ? ` for ${campaignName}` : ""}`;
}

export function buildDryRunOutputSummary(agentName: string) {
  return `${agentName} runtime-prep dry run completed without any external side effects.`;
}
