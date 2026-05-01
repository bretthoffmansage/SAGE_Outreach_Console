type HelpdeskImportInput = {
  sourceMessageId?: string;
  helpdeskThreadId?: string;
  senderName?: string;
  senderEmail?: string;
  subject?: string;
  message: string;
  receivedAt?: number;
  classification?: string;
  status?: string;
  campaignId?: string;
  campaignName?: string;
};

export function normalizeHelpdeskMessage(input: HelpdeskImportInput) {
  const normalizedMessage = input.message.trim();
  const lower = normalizedMessage.toLowerCase();
  const classification =
    input.classification
    ?? (lower.includes("unsubscribe")
      ? "Unsubscribes"
      : lower.includes("refund") || lower.includes("complaint")
        ? "Complaints"
        : lower.includes("?")
          ? "Questions"
          : "Needs Reply");

  const urgency: "low" | "medium" | "high" = lower.includes("asap") || lower.includes("today")
    ? "high"
    : lower.includes("soon")
      ? "medium"
      : "low";
  const sentiment: "positive" | "neutral" | "negative" = lower.includes("love") || lower.includes("interested")
    ? "positive"
    : lower.includes("frustrated") || lower.includes("angry") || lower.includes("unsubscribe")
      ? "negative"
      : "neutral";

  return {
    responseId: input.sourceMessageId || input.helpdeskThreadId || `helpdesk:${Date.now()}`,
    title: input.subject?.trim() || "HelpDesk response import",
    classification,
    status: input.status ?? "needs_reply",
    sentiment,
    urgency,
    summary: normalizedMessage.slice(0, 160),
    originalMessage: normalizedMessage,
    senderName: input.senderName?.trim() || undefined,
    senderEmail: input.senderEmail?.trim() || undefined,
    receivedAt: input.receivedAt ?? Date.now(),
    campaignId: input.campaignId,
    campaignName: input.campaignName,
    matchConfidence: input.campaignId || input.campaignName ? 0.82 : undefined,
    recommendedAction: classification === "Unsubscribes" ? "Review and manually process unsubscribe request." : "Manually review and draft a reply.",
    suggestedReply: undefined,
    suggestedReplyStatus: "draft_only" as const,
    noAutoSend: true as const,
    assignedTo: undefined,
    source: "HelpDesk" as const,
    sourceMessageId: input.sourceMessageId,
    helpdeskThreadId: input.helpdeskThreadId,
    tags: [
      "helpdesk_import",
      classification.toLowerCase().replace(/\s+/g, "_"),
    ],
    notes: "Imported through manual HelpDesk runtime prep. No auto-send allowed.",
  };
}
