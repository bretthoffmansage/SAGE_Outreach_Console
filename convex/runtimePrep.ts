"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import { api } from "./_generated/api";
import { evaluateIntegrationConnection } from "./runtime/envValidation";
import { normalizeHelpdeskMessage } from "./runtime/helpdesk";
import { createAgentRunId, buildDryRunInputSnapshot, buildDryRunOutputSummary } from "./runtime/agentRuntime";
import { buildDryRunModelResult, validateModelProvider, type ModelProvider } from "./runtime/modelProviders";
import { buildKeapManualExportPayload, summarizeKeapManualExportPayload } from "./runtime/keap";

function providerFromAgent(value: string): ModelProvider {
  if (value === "openai") return "openai";
  if (value === "anthropic") return "anthropic";
  if (value === "manual") return "manual";
  return "demo";
}

export const checkIntegrationConnection = action({
  args: { integrationId: v.string() },
  handler: async (ctx, args): Promise<{
    success: true;
    integrationId: string;
    status: string;
    statusLabel: string;
    result: string;
    configuredEnvVars: string[];
    missingEnvVars: string[];
    healthSummary: string;
    safePingAttempted: boolean;
    safePingSucceeded: boolean;
  }> => {
    const integration = await ctx.runQuery(api.integrations.getIntegrationRecordByIntegrationId, {
      integrationId: args.integrationId,
    });
    if (!integration) {
      throw new Error("Integration not found");
    }

    const evaluation = evaluateIntegrationConnection({
      integrationId: integration.integrationId,
      name: integration.name,
      provider: integration.provider,
      status: integration.status,
      envKeys: integration.envKeys,
      fallback: integration.fallback,
    });

    await ctx.runMutation(api.integrations.upsertIntegrationRecord, {
      integrationId: integration.integrationId,
      patch: {
        status: evaluation.status,
        statusLabel: evaluation.statusLabel,
        configuredEnvVars: evaluation.configuredEnvVars,
        missingEnvVars: evaluation.missingEnvVars,
        lastCheckAt: Date.now(),
        lastCheckResult: evaluation.result,
        healthSummary: evaluation.healthSummary,
        lastSync: Date.now(),
      },
    });

    return {
      success: true as const,
      integrationId: integration.integrationId,
      ...evaluation,
    };
  },
});

export const prepareKeapManualExport = action({
  args: { campaignId: v.string() },
  handler: async (ctx, args): Promise<{
    success: true;
    dryRun: true;
    jobId: string;
    campaignId: string;
    campaignName: string;
    payloadSummary: string;
    payloadJson: string;
  }> => {
    const campaign = await ctx.runQuery(api.campaigns.getCampaignRecordByCampaignId, { campaignId: args.campaignId });
    if (!campaign) {
      throw new Error("Campaign not found");
    }

    const payload = buildKeapManualExportPayload(campaign);
    const payloadJson = JSON.stringify(payload, null, 2);
    const payloadSummary = summarizeKeapManualExportPayload(payload);
    const jobId = `keap:${campaign.campaignId}`;

    await ctx.runMutation(api.keapSync.upsertKeapSyncJob, {
      jobId,
      patch: {
        campaignId: campaign.campaignId,
        campaignName: campaign.name,
        status: "draft",
        action: "manual_export",
        payloadSummary,
        payloadJson,
      },
    });

    await ctx.runMutation(api.campaigns.upsertCampaignRecord, {
      campaignId: campaign.campaignId,
      patch: {
        status: "ready_for_keap",
        stage: "Keap Prep",
        keapPrepStatus: "Manual export prepared",
        nextAction: "Review the dry-run export package, then export manually to Keap.",
      },
    });

    return {
      success: true as const,
      dryRun: true as const,
      jobId,
      campaignId: campaign.campaignId,
      campaignName: campaign.name,
      payloadSummary,
      payloadJson,
    };
  },
});

export const queueKeapManualHandoff = action({
  args: { campaignId: v.string() },
  handler: async (ctx, args): Promise<{
    success: true;
    jobId: string;
    campaignId: string;
    status: "ready_for_manual_export";
  }> => {
    const campaign = await ctx.runQuery(api.campaigns.getCampaignRecordByCampaignId, { campaignId: args.campaignId });
    if (!campaign) {
      throw new Error("Campaign not found");
    }

    const jobId = `keap:${campaign.campaignId}`;
    const payload = buildKeapManualExportPayload(campaign);
    await ctx.runMutation(api.keapSync.upsertKeapSyncJob, {
      jobId,
      patch: {
        campaignId: campaign.campaignId,
        campaignName: campaign.name,
        status: "ready_for_manual_export",
        action: "manual_export",
        payloadSummary: summarizeKeapManualExportPayload(payload),
        payloadJson: JSON.stringify(payload, null, 2),
      },
    });

    await ctx.runMutation(api.campaigns.upsertCampaignRecord, {
      campaignId: campaign.campaignId,
      patch: {
        status: "ready_for_keap",
        stage: "Keap Prep",
        keapPrepStatus: "Ready for manual export",
        nextAction: "Export this campaign manually through Keap and confirm the handoff.",
      },
    });

    return {
      success: true as const,
      jobId,
      campaignId: campaign.campaignId,
      status: "ready_for_manual_export" as const,
    };
  },
});

export const buildZapierHandoffDryRun = action({
  args: { campaignId: v.string() },
  handler: async (ctx, args): Promise<{
    success: true;
    dryRun: true;
    campaignId: string;
    webhookConfigured: boolean;
    urlValid: boolean;
    payload: {
      type: string;
      mode: string;
      campaignId: string;
      campaignName: string;
      stage: string;
      status: string;
      audience: string;
      offer: string;
      nextAction: string;
    };
    note: string;
  }> => {
    const campaign = await ctx.runQuery(api.campaigns.getCampaignRecordByCampaignId, { campaignId: args.campaignId });
    if (!campaign) {
      throw new Error("Campaign not found");
    }

    const webhookUrl = process.env.ZAPIER_CAMPAIGN_APPROVED_WEBHOOK_URL;
    const payload = {
      type: "campaign.approved",
      mode: "dry_run_only",
      campaignId: campaign.campaignId,
      campaignName: campaign.name,
      stage: campaign.stage,
      status: campaign.status,
      audience: campaign.audience,
      offer: campaign.offer,
      nextAction: campaign.nextAction,
    };

    return {
      success: true as const,
      dryRun: true as const,
      campaignId: campaign.campaignId,
      webhookConfigured: Boolean(webhookUrl),
      urlValid: webhookUrl ? /^https?:\/\//.test(webhookUrl) : false,
      payload,
      note: "No webhook was sent. This is a dry-run payload preview only.",
    };
  },
});

export const importHelpdeskMessage = action({
  args: {
    sourceMessageId: v.optional(v.string()),
    helpdeskThreadId: v.optional(v.string()),
    senderName: v.optional(v.string()),
    senderEmail: v.optional(v.string()),
    subject: v.optional(v.string()),
    message: v.string(),
    receivedAt: v.optional(v.number()),
    classification: v.optional(v.string()),
    status: v.optional(v.string()),
    campaignId: v.optional(v.string()),
    campaignName: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<{
    success: true;
    dryRun: false;
    normalized: unknown;
    result: {
      success: true;
      mode: "updated" | "inserted";
      responseId: string;
    };
  }> => {
    const normalized = normalizeHelpdeskMessage(args);
    const result = await ctx.runMutation(api.responses.importHelpdeskResponseRecord, normalized);
    return {
      success: true as const,
      dryRun: false as const,
      normalized,
      result,
    };
  },
});

export const runAgentDryRun = action({
  args: {
    agentId: v.string(),
    campaignId: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<{
    success: true;
    dryRun: true;
    runId: string;
    providerState: {
      provider: ModelProvider;
      model: string;
      requiredEnvVars: string[];
      configuredEnvVars: string[];
      missingEnvVars: string[];
      ready: boolean;
      mode: string;
      summary: string;
    };
    runtimeContext: unknown;
    output: {
      provider: ModelProvider;
      model: string;
      executionMode: string;
      agentId: string;
      agentName: string;
      handoffPreview: {
        nextAgentIds: string[];
        handoffConditions: string[];
      };
      note: string;
    };
  }> => {
    const [config, runtimeContext] = await Promise.all([
      ctx.runQuery(api.agents.getAgentExecutionConfig, { agentId: args.agentId }),
      ctx.runQuery(api.agents.buildAgentRuntimeContext, { agentId: args.agentId, campaignId: args.campaignId }),
    ]);

    if (!config || !runtimeContext) {
      throw new Error("Agent config not found");
    }

    const provider = providerFromAgent(config.preferredProvider);
    const providerState = validateModelProvider(provider, config.preferredModel);
    const runId = createAgentRunId(config.agentId);
    const startedAt = Date.now();

    await ctx.runMutation(api.agents.updateAgentRuntimeStatus, {
      agentId: config.agentId,
      status: "running",
      isRunning: true,
      currentTaskLabel: "Runtime dry run",
      currentTaskDetail: providerState.summary,
      lastStartedAt: startedAt,
      lastRunId: runId,
      lastError: undefined,
      lastOutputSummary: undefined,
    });

    await ctx.runMutation(api.agents.createAgentRun, {
      runId,
      campaignId: args.campaignId,
      agentId: config.agentId,
      status: "running",
      inputSnapshot: buildDryRunInputSnapshot(config.displayName, runtimeContext.campaign?.name),
      outputSummary: "Preparing dry-run runtime output.",
      outputJson: JSON.stringify(runtimeContext, null, 2),
      startedAt,
    });

    const finishedAt = Date.now();
    const output = buildDryRunModelResult({
      provider,
      model: config.preferredModel,
      agentId: config.agentId,
      agentName: config.displayName,
      nextAgentIds: config.nextAgentIds,
      handoffConditions: config.handoffConditions,
    });
    const outputSummary = buildDryRunOutputSummary(config.displayName);

    await ctx.runMutation(api.agents.updateAgentRuntimeStatus, {
      agentId: config.agentId,
      status: "complete",
      isRunning: false,
      currentTaskLabel: "Runtime dry run complete",
      currentTaskDetail: "No external model or LangGraph call was made.",
      lastStartedAt: startedAt,
      lastFinishedAt: finishedAt,
      lastRunId: runId,
      lastError: undefined,
      lastOutputSummary: outputSummary,
    });

    await ctx.runMutation(api.agents.completeAgentRun, {
      runId,
      outputSummary,
      outputJson: JSON.stringify(
        {
          providerState,
          runtimeContext,
          output,
        },
        null,
        2,
      ),
      finishedAt,
    });

    return {
      success: true as const,
      dryRun: true as const,
      runId,
      providerState,
      runtimeContext,
      output,
    };
  },
});
