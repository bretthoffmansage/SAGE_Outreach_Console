/**
 * Section 6 — deterministic Copy Intelligence dry-run (no external LLM).
 * Produces structured outputJson for agentRuns + UI inspector.
 */

export type LibraryTrust = "trusted" | "caution" | "inspiration_only" | "excluded";

export type LibraryContextRef = {
  recordId: string;
  name: string;
  type: string;
  bucket?: string;
  trust: LibraryTrust;
  reason: string;
};

export type CopyPipelineDryRunArgs = {
  campaign: Record<string, unknown>;
  productionAsset: Record<string, unknown> | null;
  libraryItems: Array<Record<string, unknown>>;
  outputType?: string;
  userInstructions?: string;
};

function nz(s: unknown) {
  return typeof s === "string" ? s.trim() : "";
}

function classifyLibraryItem(item: Record<string, unknown>): LibraryContextRef | null {
  const recordId = nz(item.recordId);
  const name = nz(item.name) || "Untitled";
  const type = nz(item.type) || "unknown";
  const bucket = nz(item.bucket) || undefined;
  const status = (nz(item.status) || "").toLowerCase();
  const b = (bucket || "").toLowerCase();

  if (["rejected", "archived", "sync_error"].includes(status)) {
    return { recordId, name, type, bucket, trust: "excluded", reason: "Status excluded from trusted context." };
  }
  if (b.includes("swipe") || type.toLowerCase().includes("swipe")) {
    return { recordId, name, type, bucket, trust: "inspiration_only", reason: "Swipe / inspiration — do not copy verbatim." };
  }
  if (["active", "approved"].includes(status) || item.approvedAt) {
    return { recordId, name, type, bucket, trust: "trusted", reason: "Active or approved record." };
  }
  if (["draft", "candidate", "needs_review"].includes(status)) {
    return { recordId, name, type, bucket, trust: "caution", reason: "Draft or candidate — labeled in context pack." };
  }
  return { recordId, name, type, bucket, trust: "caution", reason: "Default caution until explicitly approved." };
}

function reviewRouting(complianceRisk: "low" | "medium" | "high", founderVoice: boolean, angleRisky: boolean) {
  const internal = { recommended: true, reason: "Default readiness for launch packet copy and handoffs." };
  const blue = angleRisky || complianceRisk === "high"
    ? { recommended: true, reason: "Strategic angle or high compliance risk warrants Blue only if materially changing positioning or claims." }
    : { recommended: false, reason: "No major strategic repositioning flagged in dry-run heuristics." };
  const bari = founderVoice
    ? { recommended: true, reason: "Founder-led or high-visibility copy may need Bari polish — not every caption." }
    : { recommended: false, reason: "Routine packet copy — Bari not required by default." };
  return { internal, blue, bari, claims: complianceRisk !== "low" };
}

export function buildCopyPipelineDryRunOutput(args: CopyPipelineDryRunArgs) {
  const c = args.campaign;
  const campaignId = nz(c.campaignId);
  const campaignName = nz(c.name) || "Untitled campaign";
  const publishDate = nz(c.publishDate);
  const angle = nz(c.campaignAngle);
  const audience = nz(c.primaryAudience);
  const cta = nz(c.primaryCta);
  const sourceTitle = nz(c.sourceProductionAssetTitle);
  const transcriptSummary = nz(c.transcriptSummary) || nz(args.productionAsset?.transcriptSummary);
  const productionNotes = nz(c.productionNotes) || nz(args.productionAsset?.notes);

  const asset = args.productionAsset;
  const hasAsset = Boolean(asset) || Boolean(nz(c.sourceProductionAssetId));

  const refs = (args.libraryItems ?? []).map(classifyLibraryItem).filter(Boolean) as LibraryContextRef[];
  const trusted = refs.filter((r) => r.trust === "trusted");
  const caution = refs.filter((r) => r.trust === "caution");
  const inspiration = refs.filter((r) => r.trust === "inspiration_only");

  const warnings: string[] = [];
  if (!campaignId) warnings.push("Missing campaign id in row.");
  if (!sourceTitle && !nz(c.sourceProductionAssetId)) warnings.push("No source asset is linked. Source-specific drafts may be weaker.");
  if (!trusted.length) warnings.push("No approved/active library context found — drafts may be more generic.");

  const angleRisky = /guarantee|always|never|best ever|#1|million/i.test(`${angle} ${nz(c.goal)}`);
  const founderVoice = /bari|founder|i wrote|my story/i.test(`${nz(c.emailBriefBody)} ${nz(c.creativeBriefBody)} ${angle}`);

  const complianceRisk: "low" | "medium" | "high" = angleRisky ? "medium" : "low";

  const copyBrief = angle
    ? `This launch should lean on the stated angle while keeping claims evidence-aligned: ${angle}`
    : "Angle not fully set — recommend defining campaign angle before final public copy.";

  const youtubeTitleOptions = [
    `${sourceTitle || campaignName}: what changed for event ROI?`,
    `Virtual vs in-person costs — ${audience || "creators"} takeaways`,
    `Net-profit framing for your next launch week`,
    `Hotel + travel pain → leaner event model`,
    `Registration window: ${publishDate || "TBD"}`,
  ];

  const suggestedCampaignPatches = {
    campaignAngle: angle || undefined,
    youtubeTitle: youtubeTitleOptions[0],
    youtubeDescription: `Draft-only description scaffold for ${campaignName}. CTA: ${cta || "TBD"}.`,
    emailBriefBody: `Draft Emailmarketing.com brief (dry run). Audience: ${audience || "TBD"}. Primary CTA: ${cta || "TBD"}.`,
    creativeBriefBody: `Draft creative / Brandon brief (dry run). Shorts/reels notes: ${nz(c.relatedShortsNotes) || "See packet."}.`,
    metaCaption: `Draft Meta caption (dry run) — hook tied to: ${angle || "weekly launch"}.`,
    instagramCaption: `Draft IG caption (dry run).`,
    tiktokCaption: `Draft TikTok caption (dry run).`,
    xPost: `Draft X post (dry run).`,
  };

  const body = {
    summary: `Copy pipeline dry run completed for ${campaignName}. No external model call was made.`,
    campaignId,
    campaignName,
    runType: "copy_pipeline",
    safetyMode: "draft_only",
    contextUsed: {
      campaignFields: Object.keys(c).filter((k) => typeof c[k] === "string" && nz(c[k])).slice(0, 40),
      productionAsset: hasAsset
        ? {
            title: sourceTitle || nz(asset?.title),
            transcriptStatus: nz(c.transcriptStatus) || nz(asset?.transcriptStatus),
            thumbnailStatus: nz(c.thumbnailStatus) || nz(asset?.thumbnailStatus),
            shorts: `${nz(asset?.readyShortsCount) || "0"}/${nz(asset?.shortsCount) || "0"} ready`,
            transcriptSummary: transcriptSummary || undefined,
            productionNotes: productionNotes || undefined,
          }
        : null,
      libraryRecordIds: {
        trusted: trusted.map((t) => t.recordId),
        caution: caution.map((t) => t.recordId),
        inspiration_only: inspiration.map((t) => t.recordId),
      },
      trustSummary: `Trusted ${trusted.length}, caution ${caution.length}, inspiration-only ${inspiration.length}.`,
    },
    drafts: {
      youtubeTitleOptions,
      youtubeDescription: suggestedCampaignPatches.youtubeDescription,
      youtubePinnedComment: "Pinned comment draft (dry run) — confirm CTA link when YouTube is scheduled.",
      emailBrief: suggestedCampaignPatches.emailBriefBody,
      emailSubjectIdeas: ["This week’s launch angle", "ROI story + one clear CTA", "Founder voice optional opener"],
      emailSequenceNotes: "Sequence outline placeholder — align with Emailmarketing.com cadence.",
      creativeBrief: suggestedCampaignPatches.creativeBriefBody,
      metaCaption: suggestedCampaignPatches.metaCaption,
      instagramCaption: suggestedCampaignPatches.instagramCaption,
      tiktokCaption: suggestedCampaignPatches.tiktokCaption,
      xPost: suggestedCampaignPatches.xPost,
      pinterestTitle: `${campaignName} — save-worthy title draft`,
      pinterestDescription: "Pinterest description draft (dry run).",
      youtubeShortsCaption: "Shorts caption draft (dry run).",
      memeEngagementIdeas: "Meme / engagement ideas placeholder — keep brand-safe.",
    },
    hooks: [
      { hookText: "Still assuming in-person is always cheaper?", format: "youtube_title", why: "Cost-comparison curiosity.", riskLevel: "low", bestUseCase: "YouTube + email" },
      { hookText: "The hidden line item killing event margin", format: "reel", why: "Pattern interrupt.", riskLevel: "medium", bestUseCase: "Short-form" },
    ],
    voiceNotes: ["Maintain Sage clarity; avoid hype adjectives without proof.", founderVoice ? "Founder-voice lane detected — consider Bari for final public polish only if used." : "Routine operator tone acceptable for scaffolding."],
    ctaNotes: ["Confirm single primary CTA across email + social + YouTube description.", "Check transition into CTA after hook."],
    structureNotes: ["YouTube: hook → value → CTA → links", "Email brief: goal → audience → proof points → CTA", "Social: platform-native first line + short body + CTA"],
    complianceNotes: [
      complianceRisk === "medium"
        ? "Medium risk: scan for absolute promises; prefer evidence-backed language."
        : "Low risk in dry-run scan — still verify before publish.",
    ],
    reviewRecommendations: reviewRouting(complianceRisk, founderVoice, angleRisky),
    learningCandidates: [
      {
        title: "Hook pattern: cost-comparison opener",
        summary: "Operator edited final hook toward hotel/travel pain — candidate for Learning Library.",
        status: "candidate",
      },
    ],
    suggestedCampaignPatches,
    warnings,
    nextActions: [
      "Review draft blocks in inspector.",
      "Explicitly apply selected fields to the campaign when ready (no auto-apply).",
      "Promote learnings only after Library human approval.",
    ],
    userInstructions: args.userInstructions || undefined,
    outputType: args.outputType || "full_launch_copy_packet",
    externalModelCall: false,
  };

  const inputMeta = {
    campaignId,
    campaignName,
    publishDate,
    hasSourceAsset: Boolean(nz(c.sourceProductionAssetId) || sourceTitle),
    libraryCounts: { trusted: trusted.length, caution: caution.length, inspiration: inspiration.length },
  };

  return {
    summary: body.summary,
    body,
    copyBrief,
    inputMeta,
  };
}
