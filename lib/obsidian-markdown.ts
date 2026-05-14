/**
 * Obsidian Markdown / path helpers for Knowledge Sync (Section 9).
 * Pure functions — safe to call from Convex or UI. No file I/O.
 */

export type LibraryRowLike = {
  recordId: string;
  type: string;
  name: string;
  status: string;
  summary: string;
  tags: string[];
  bucket?: string;
  title?: string;
  sourceSystem?: string;
  sourceUri?: string;
  usageRights?: string;
  confidence?: number;
  reviewOwner?: string;
  linkedCampaignIds?: string[];
  linkedAssetIds?: string[];
  payload?: Record<string, unknown>;
  createdAt?: number;
  updatedAt?: number;
};

export function normalizeObsidianFileName(title: string, recordId: string): string {
  const base = (title || recordId || "library-record").trim().slice(0, 120);
  const cleaned = base
    .replace(/[/\\?%*:|"<>[\]{}]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const safe = cleaned || recordId.replace(/[/\\]/g, "_");
  return safe.length > 80 ? `${safe.slice(0, 77).trim()}…` : safe;
}

const BUCKET_FOLDER: Record<string, string> = {
  copy_archive: "Marketing/Copy Archive",
  swipe_file: "Marketing/Swipe File",
  voice_style: "Marketing/Voice and Style",
  audience_intelligence: "Marketing/Audience Intelligence",
  offer_cta: "Marketing/Offers and CTAs",
  platform_playbook: "Marketing/Platform Playbooks",
  compliance_rule: "Marketing/Compliance Rules",
  campaign_learning: "Marketing/Campaign Learnings",
  source_import: "Marketing/Source Imports",
};

function readPayloadString(o: Record<string, unknown> | undefined, key: string, fallback = ""): string {
  const v = o?.[key];
  return typeof v === "string" ? v : fallback;
}

/** Suggested Obsidian relative path (with .md) for a library row. */
export function buildObsidianPathForLibraryItem(row: LibraryRowLike): string {
  const title = row.title?.trim() || row.name || row.recordId;
  const safe = normalizeObsidianFileName(title, row.recordId);
  const bucket = row.bucket ?? "";
  const type = row.type ?? "";
  const platform = readPayloadString(row.payload, "platform").trim() || "general";

  if (bucket === "copy_archive") {
    if (type === "email" || type === "email_sequence") return `Marketing/Copy Archive/Emails/${safe}.md`;
    if (type === "youtube_description" || type === "youtube_title") return `Marketing/Copy Archive/YouTube/${safe}.md`;
    if (["social_caption", "reel_caption", "tiktok_caption", "x_post", "pinterest_pin"].includes(type)) {
      return `Marketing/Copy Archive/Social/${safe}.md`;
    }
    return `Marketing/Copy Archive/${safe}.md`;
  }
  if (bucket === "swipe_file") return `Marketing/Swipe File/${safe}.md`;
  if (bucket === "voice_style") return `Marketing/Voice and Style/${safe}.md`;
  if (bucket === "audience_intelligence") return `Marketing/Audience Intelligence/${safe}.md`;
  if (bucket === "offer_cta") return `Marketing/Offers and CTAs/${safe}.md`;
  if (bucket === "platform_playbook") return `Marketing/Platform Playbooks/${normalizeObsidianFileName(platform, "platform")}/${safe}.md`;
  if (bucket === "campaign_learning") return `Marketing/Campaign Learnings/${safe}.md`;
  if (bucket === "source_import") return `Marketing/Source Imports/${safe}.md`;
  if (type === "compliance_rule" || bucket === "compliance") return `Marketing/Compliance Rules/${safe}.md`;

  const folder = BUCKET_FOLDER[bucket] ?? "Marketing/Outreach Library";
  return `${folder}/${safe}.md`;
}

export function buildObsidianNoteTitle(row: LibraryRowLike): string {
  return row.title?.trim() || row.name || row.recordId;
}

export function computeLibraryContentHash(row: LibraryRowLike): string {
  const basis = JSON.stringify({
    title: row.title ?? row.name,
    summary: row.summary,
    status: row.status,
    tags: row.tags,
    bucket: row.bucket,
    type: row.type,
    usageRights: row.usageRights,
    payload: row.payload,
  });
  let h = 5381;
  for (let i = 0; i < basis.length; i++) h = Math.imul(h, 33) ^ basis.charCodeAt(i);
  return `oc_${(h >>> 0).toString(16)}`;
}

function yamlQuote(s: string) {
  if (!/[:\n#'"[\]{}&*]/.test(s) && s.trim() === s) return s;
  return `"${s.replace(/"/g, '\\"')}"`;
}

function toYamlLines(obj: Record<string, unknown>, indent = ""): string[] {
  const lines: string[] = [];
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === null) continue;
    if (Array.isArray(v)) {
      lines.push(`${indent}${k}:`);
      for (const item of v) lines.push(`${indent}  - ${yamlQuote(String(item))}`);
    } else if (typeof v === "object") {
      lines.push(`${indent}${k}:`);
      lines.push(...toYamlLines(v as Record<string, unknown>, `${indent}  `));
    } else if (typeof v === "number" || typeof v === "boolean") {
      lines.push(`${indent}${k}: ${v}`);
    } else {
      lines.push(`${indent}${k}: ${yamlQuote(String(v))}`);
    }
  }
  return lines;
}

export function buildObsidianFrontmatter(row: LibraryRowLike): Record<string, unknown> {
  const exportedAt = row.updatedAt ? new Date(row.updatedAt).toISOString() : undefined;
  return {
    source: "outreach_console",
    record_id: row.recordId,
    bucket: row.bucket ?? "",
    type: row.type,
    status: row.status,
    source_system: row.sourceSystem ?? "manual",
    usage_rights: row.usageRights ?? "",
    tags: row.tags ?? [],
    linked_campaigns: row.linkedCampaignIds ?? [],
    linked_assets: row.linkedAssetIds ?? [],
    created_at: row.createdAt ? new Date(row.createdAt).toISOString() : "",
    updated_at: row.updatedAt ? new Date(row.updatedAt).toISOString() : "",
    exported_at: exportedAt ?? "",
    confidence: row.confidence ?? "",
    review_owner: row.reviewOwner ?? "",
  };
}

export function buildObsidianFrontmatterYaml(row: LibraryRowLike): string {
  const fm = buildObsidianFrontmatter(row);
  return toYamlLines(fm).join("\n");
}

function campaignWikiLinks(ids: string[]): string {
  return ids.map((id) => `- [[Campaign — ${id.replace(/_/g, " ")}]]`).join("\n") || "- _(none linked)_";
}

function assetWikiLinks(ids: string[]): string {
  return ids.map((id) => `- [[Production asset — ${id}]]`).join("\n") || "- _(none linked)_";
}

export function buildObsidianMarkdownBody(row: LibraryRowLike): string {
  const title = buildObsidianNoteTitle(row);
  const p = row.payload ?? {};
  const body = readPayloadString(p, "body", "");
  const platform = readPayloadString(p, "platform", "");
  const inspiration = row.bucket === "swipe_file" || row.usageRights === "inspiration_only";

  const sections: string[] = [];

  sections.push(`# ${title}`);
  sections.push("");
  if (inspiration) {
    sections.push("> **Inspiration only** — not approved Sage-owned copy. Verify usage rights before adapting.");
    sections.push("");
  }

  const bucket = row.bucket ?? "";

  if (bucket === "swipe_file") {
    sections.push("## Summary", row.summary || "_No summary_", "");
    sections.push("## Example / Reference", body || readPayloadString(p, "exampleText", "_No example text_"), "");
    sections.push("## Why It Works", readPayloadString(p, "whyItWorks", readPayloadString(p, "whyItMatters", "_TBD_")), "");
    sections.push("## Adaptation Notes", readPayloadString(p, "adaptationNotes", "_Add operator notes_"), "");
    sections.push("## Usage Rights", row.usageRights || "inspiration_only", "");
    sections.push("## Source Link", row.sourceUri ? `[source](${row.sourceUri})` : "_None_", "");
    sections.push("## Risk Notes", readPayloadString(p, "riskNotes", "_None_"), "");
  } else if (bucket === "voice_style") {
    sections.push("## Summary", row.summary || "_No summary_", "");
    sections.push("## Rule", readPayloadString(p, "rule", row.name), "");
    sections.push("## Examples", readPayloadString(p, "examples", "_None_"), "");
    sections.push("## Counterexamples", readPayloadString(p, "counterExamples", readPayloadString(p, "counterexamples", "_None_")), "");
    sections.push("## Applies To", readPayloadString(p, "appliesTo", "_General_"), "");
    sections.push("## Notes", readPayloadString(p, "notes", "_None_"), "");
  } else if (bucket === "audience_intelligence") {
    sections.push("## Segment Summary", row.summary, "");
    sections.push("## Pain Points", readPayloadString(p, "painPoints", "_TBD_"), "");
    sections.push("## Desires", readPayloadString(p, "desires", "_TBD_"), "");
    sections.push("## Objections", readPayloadString(p, "objections", "_TBD_"), "");
    sections.push("## Messaging Notes", readPayloadString(p, "messagingNotes", "_TBD_"), "");
    sections.push("## Related Campaigns", campaignWikiLinks(row.linkedCampaignIds ?? []), "");
  } else if (bucket === "offer_cta") {
    sections.push("## Offer / CTA", row.name, "");
    sections.push("## Summary", row.summary, "");
    sections.push("## Best Use Cases", readPayloadString(p, "bestUseCases", "_TBD_"), "");
    sections.push("## CTA Text", readPayloadString(p, "ctaText", body || "_TBD_"), "");
    sections.push("## Destination", readPayloadString(p, "destination", "_TBD_"), "");
  } else if (bucket === "platform_playbook") {
    sections.push("## Platform", platform || "_General_", "");
    sections.push("## Summary", row.summary, "");
    sections.push("## Recommended Structure", readPayloadString(p, "structure", "_TBD_"), "");
    sections.push("## Hook Guidance", readPayloadString(p, "hookGuidance", "_TBD_"), "");
    sections.push("## CTA Guidance", readPayloadString(p, "ctaGuidance", "_TBD_"), "");
    sections.push("## Do", readPayloadString(p, "dos", readPayloadString(p, "do", "_TBD_")), "");
    sections.push("## Avoid", readPayloadString(p, "avoid", readPayloadString(p, "donts", "_TBD_")), "");
  } else if (bucket === "campaign_learning") {
    sections.push("## Learning", row.name, "");
    sections.push("## Summary", row.summary, "");
    sections.push("## Evidence", readPayloadString(p, "evidence", "_See Performance Intelligence_"), "");
    sections.push("## Recommendation", readPayloadString(p, "recommendation", "_TBD_"), "");
    sections.push("## Confidence", row.confidence != null ? String(row.confidence) : "_n/a_", "");
    sections.push("## Approval Status", row.status, "");
    sections.push("## Related Campaigns", campaignWikiLinks(row.linkedCampaignIds ?? []), "");
  } else if (bucket === "source_import") {
    sections.push("## Source Summary", row.summary, "");
    sections.push("## Extracted Preview", body || "_No extracted body_", "");
    sections.push("## Source Metadata", `system: ${row.sourceSystem ?? "unknown"}`, "");
    sections.push("## Target Bucket", row.bucket ?? "", "");
  } else if (row.type === "compliance_rule" || bucket === "compliance") {
    sections.push("## Rule", row.name, "");
    sections.push("## Summary", row.summary, "");
    sections.push("## Risk Area", readPayloadString(p, "claimType", readPayloadString(p, "severityLabel", "_Compliance_")), "");
    sections.push("## Examples to Avoid", readPayloadString(p, "examples", readPayloadString(p, "bannedPattern", "_TBD_")), "");
    sections.push("## Safer Alternatives", readPayloadString(p, "allowedAlternative", "_TBD_"), "");
  } else {
    sections.push("## Summary", row.summary || "_No summary_", "");
    sections.push("## Content", body || "_No structured body field; see payload in Outreach Console._", "");
    sections.push("## Notes", readPayloadString(p, "usageNotes", readPayloadString(p, "notes", "_None_")), "");
  }

  sections.push("## Usage Guidance", `status: ${row.status}; rights: ${row.usageRights ?? "unspecified"}`, "");
  sections.push("## Related Campaigns", campaignWikiLinks(row.linkedCampaignIds ?? []), "");
  sections.push("## Related Assets", assetWikiLinks(row.linkedAssetIds ?? []), "");
  sections.push("## Source Links", row.sourceUri ? `- ${row.sourceUri}` : "- _(none)_", "");
  sections.push(
    "## Sync Metadata",
    `- Outreach record ID: \`${row.recordId}\``,
    `- Bucket: ${row.bucket ?? "(unknown)"}`,
    `- Type: ${row.type}`,
    `- Status: ${row.status}`,
    `- Last updated: ${row.updatedAt ? new Date(row.updatedAt).toISOString() : "unknown"}`,
    "",
  );

  return sections.join("\n");
}

export function buildFullObsidianMarkdown(row: LibraryRowLike): string {
  const yaml = buildObsidianFrontmatterYaml(row);
  const body = buildObsidianMarkdownBody(row);
  return `---\n${yaml}\n---\n\n${body}`;
}

const BUCKET_LABELS: Record<string, string> = {
  copy_archive: "Copy Archive",
  swipe_file: "Swipe File",
  voice_style: "Voice & Style",
  audience_intelligence: "Audience Intelligence",
  offer_cta: "Offers & CTAs",
  platform_playbook: "Platform Playbooks",
  campaign_learning: "Campaign Learnings",
  source_import: "Source Imports",
};

export function getLibraryBucketLabel(bucket?: string): string {
  if (!bucket) return "Outreach Library";
  return BUCKET_LABELS[bucket] ?? bucket.replace(/_/g, " ");
}

const OBSIDIAN_STATUS_LABELS: Record<string, string> = {
  not_configured: "Not configured",
  not_exported: "Not exported",
  export_ready: "Export ready",
  preview_generated: "Preview generated",
  exported: "Exported",
  stale: "Stale",
  ignored: "Ignored",
  export_error: "Export error",
};

export function getObsidianExportStatusLabel(status?: string): string {
  if (!status) return "Not configured";
  return OBSIDIAN_STATUS_LABELS[status] ?? status.replace(/_/g, " ");
}

const DRIVE_STATUS_LABELS: Record<string, string> = {
  not_connected: "Not connected",
  not_synced: "Not synced",
  sync_pending: "Sync pending",
  indexed: "Indexed",
  synced: "Synced",
  stale: "Stale",
  ignored: "Ignored",
  sync_error: "Sync error",
};

export function getDriveSyncStatusLabel(status?: string): string {
  if (!status) return "Not connected";
  return DRIVE_STATUS_LABELS[status] ?? status.replace(/_/g, " ");
}

const GENERAL_SYNC_LABELS: Record<string, string> = {
  none: "None",
  pending: "Pending",
  indexed: "Indexed",
  export_ready: "Export ready",
  synced: "Synced",
  stale: "Stale",
  ignored: "Ignored",
  error: "Error",
};

export function getGeneralSyncStatusLabel(status?: string): string {
  if (!status) return "None";
  return GENERAL_SYNC_LABELS[status] ?? status.replace(/_/g, " ");
}
