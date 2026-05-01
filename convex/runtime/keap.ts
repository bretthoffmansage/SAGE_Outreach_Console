type CampaignLike = {
  campaignId: string;
  name: string;
  audience: string;
  audienceId?: string;
  offer: string;
  offerId?: string;
  goal: string;
  primaryCta?: string;
  sendWindow?: string;
  keapTagMapping?: string;
  allowedClaims: string[];
  knownExclusions: string[];
};

export function buildKeapManualExportPayload(campaign: CampaignLike) {
  return {
    campaignId: campaign.campaignId,
    campaignName: campaign.name,
    audience: {
      label: campaign.audience,
      audienceId: campaign.audienceId,
      exclusions: campaign.knownExclusions,
    },
    offer: {
      label: campaign.offer,
      offerId: campaign.offerId,
      allowedClaims: campaign.allowedClaims,
    },
    keap: {
      tagMapping: campaign.keapTagMapping || "UNMAPPED",
      sendWindow: campaign.sendWindow || "manual scheduling required",
      primaryCta: campaign.primaryCta || "manual CTA review required",
    },
    goal: campaign.goal,
    mode: "manual_export_only",
    note: "Generated for manual Keap export. No live CRM call was made.",
  };
}

export function summarizeKeapManualExportPayload(payload: ReturnType<typeof buildKeapManualExportPayload>) {
  return `${payload.campaignName} prepared for manual export with ${payload.keap.tagMapping} and audience ${payload.audience.label}.`;
}
