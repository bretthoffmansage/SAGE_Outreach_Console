"use client";

import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { AlertTriangle, BookOpen, Copy, Database, Filter, Search, Shield, Sparkles, X } from "lucide-react";
import type { LearningInsight, LibraryItem } from "@/lib/domain";
import { Button, ConsoleTable, ControlPanel, InlineAction, SectionHeader, StatusBadge, StatusDot, Td, Th, TableHead } from "@/components/ui";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useAppUser } from "@/components/auth/app-user-context";
import { libraryItemMatchesSlug, type LibraryRouteSlug } from "@/lib/library-routes";
import { getDriveSyncStatusLabel, getGeneralSyncStatusLabel, getObsidianExportStatusLabel } from "@/lib/obsidian-markdown";

type LibraryPageKey =
  | "offers"
  | "email"
  | "voice-rules"
  | "signoffs"
  | "audiences"
  | "compliance"
  | "learning"
  | "copy-archive"
  | "swipe-file"
  | "voice-style"
  | "audience-intelligence"
  | "cta-library"
  | "platform-playbooks"
  | "campaign-learnings"
  | "source-imports";

type InventoryRecord = {
  id: string;
  title: string;
  status: string;
  summary: string;
  cells: string[];
  source: LibraryItem | LearningInsight;
  kind: "library" | "learning";
};

type EditorDraft = Record<string, string | number | boolean>;
type EditorMode = "view" | "edit" | "create";
type AdvancedFilterDefinition = {
  key: string;
  label: string;
  getValue: (record: InventoryRecord) => string;
};

function displayTitleForItem(item: LibraryItem): string {
  return item.title || item.name;
}

function formatLibraryUpdated(item: LibraryItem): string {
  if (typeof item.updatedAt === "number") return new Date(item.updatedAt).toLocaleDateString();
  return "—";
}

function isStructuredBucketPage(key: LibraryPageKey): boolean {
  return ["copy-archive", "swipe-file", "platform-playbooks", "source-imports"].includes(key);
}

function defaultRecordTypeForStructured(key: LibraryPageKey): string {
  if (key === "swipe-file") return "swipe_example";
  if (key === "source-imports") return "source_doc";
  if (key === "platform-playbooks") return "platform_playbook";
  return "landing_page_copy";
}

function isExtendedSourceTablePage(key: LibraryPageKey): boolean {
  return (
    key === "copy-archive"
    || key === "swipe-file"
    || key === "voice-style"
    || key === "audience-intelligence"
    || key === "cta-library"
    || key === "platform-playbooks"
    || key === "source-imports"
  );
}

const libraryPageConfig: Record<LibraryPageKey, { title: string; summary: string; tone: string; filters: string[]; columns: string[] }> = {
  offers: {
    title: "Offers & Lead Magnets",
    summary:
      "Reusable offers, CTAs, event invitations, lead magnets, and launch conversion assets operators approve and reuse across campaigns.",
    tone: "blue",
    filters: ["All", "Active", "Approved", "Needs Blue Approval", "Possible Idea", "Paused", "Retired"],
    columns: ["Name", "Type", "Status", "Approval owner", "Allowed channels", "Allowed audiences", "Last used", "Performance", "Action"],
  },
  email: {
    title: "Email Library",
    summary:
      "Approved email examples, YouTube and email launch copy references, and source material for future copy agents and builders — human-curated; retrieval stays manual until connected.",
    tone: "purple",
    filters: ["All", "Gold", "Silver", "Bronze", "Rejected", "Needs Review"],
    columns: ["Title / Subject", "Rating", "Source Type", "Associated Campaign", "Last Used", "Open"],
  },
  "voice-rules": {
    title: "Bari Voice Rules",
    summary:
      "Founder-voice and brand-sensitive copy guidance used to help draft copy that sounds like Bari when that tone is needed — blocking, warning, and guidance rules operators apply.",
    tone: "amber",
    filters: ["All", "Blocking", "Warning", "Guidance"],
    columns: ["Rule", "Severity", "Status", "Summary"],
  },
  signoffs: {
    title: "Sign-off Library",
    summary:
      "Approved sign-offs and closing styles that can be selected based on context and voice, with usage rules your team enforces.",
    tone: "green",
    filters: ["All", "Active", "Inactive", "Requires Bari Review", "Auto-selectable"],
    columns: ["Sign-off Text", "Allowed Contexts", "Status", "Agent Auto Choose", "Requires Bari Review", "Example Usage"],
  },
  audiences: {
    title: "Audience Library",
    summary:
      "Audience intelligence for launch targeting: pain points, objections, motivations, exclusions, and segment notes that inform weekly launch packets.",
    tone: "blue",
    filters: ["All", "Active", "Demo", "Manual", "Needs Review"],
    columns: ["Audience", "Source", "Status", "Estimated Size", "Allowed Offers", "Exclusions", "Last Used", "Performance"],
  },
  compliance: {
    title: "Compliance Rules",
    summary:
      "Claims, risk, promise, urgency, and public-facing language guardrails — blocking, warning, and guidance your team applies before launch.",
    tone: "red",
    filters: ["All", "Blocking", "Warning", "Guidance", "Inactive"],
    columns: ["Rule", "Severity", "Claim Type", "Status", "Channels", "Owner", "Examples"],
  },
  learning: {
    title: "Learning Library",
    summary:
      "Approved reusable learnings from human edits, performance outcomes, and campaign reviews — curated signals operators maintain; full auto-learning remains manual until explicitly wired.",
    tone: "purple",
    filters: ["All", "Candidate", "Approved", "Rejected", "Archived"],
    columns: ["Insight", "Source", "Confidence", "Status", "Applies To", "Last Used"],
  },
  "copy-archive": {
    title: "Copy Archive",
    summary:
      "Owned Sage copy from emails, YouTube, social, ads, landing pages, campaigns, and launch packets — structured for future Copy Intelligence and weekly launch reuse.",
    tone: "purple",
    filters: ["All", "Draft", "Active", "Approved", "Needs Review", "Archived", "Rejected"],
    columns: ["Title", "Bucket", "Type", "Status", "Source", "Tags", "Updated"],
  },
  "swipe-file": {
    title: "Swipe File",
    summary:
      "Curated inspiration, hooks, examples, and formats worth learning from or adapting — not owned Sage copy unless explicitly converted. Trend Intelligence can save inspiration-only references here.",
    tone: "amber",
    filters: ["All", "Draft", "Candidate", "Active", "Approved", "Archived"],
    columns: ["Title", "Bucket", "Type", "Status", "Source", "Tags", "Updated"],
  },
  "voice-style": {
    title: "Voice & Style",
    summary:
      "Founder voice, Sage tone, approved phrases, sign-offs, and writing rules — trusted context for Copy Intelligence alongside dedicated Bari Voice Rules and Sign-off Library routes.",
    tone: "amber",
    filters: ["All", "Draft", "Active", "Approved", "Needs Review", "Archived"],
    columns: ["Title", "Bucket", "Type", "Status", "Source", "Tags", "Updated"],
  },
  "audience-intelligence": {
    title: "Audience Intelligence",
    summary:
      "Audience segments, pain points, desires, objections, and messaging notes — expands the Audience Library into a structured knowledge base for launches and future agents.",
    tone: "blue",
    filters: ["All", "Active", "Demo", "Manual", "Needs Review", "Draft", "Archived"],
    columns: ["Title", "Bucket", "Type", "Status", "Source", "Tags", "Updated"],
  },
  "cta-library": {
    title: "Offer / CTA Library",
    summary:
      "Reusable offers, lead magnets, calls to action, urgency notes, and next-step language — complements Offers & Lead Magnets with the same records surfaced for CTA-focused workflows.",
    tone: "blue",
    filters: ["All", "Active", "Approved", "Needs Blue Approval", "Possible Idea", "Paused", "Retired", "Draft"],
    columns: ["Title", "Bucket", "Type", "Status", "Source", "Tags", "Updated"],
  },
  "platform-playbooks": {
    title: "Platform Playbooks",
    summary:
      "Platform-specific rules and patterns for YouTube, email, reels, TikTok, Meta, Pinterest, X.com, and ads — guidance for operators and Trend Intelligence. Promote repeatable trend patterns here after review.",
    tone: "blue",
    filters: ["All", "Draft", "Active", "Approved", "Needs Review", "Archived"],
    columns: ["Title", "Bucket", "Type", "Status", "Source", "Tags", "Updated"],
  },
  "campaign-learnings": {
    title: "Campaign Learnings",
    summary:
      "Approved lessons from campaign performance, human edits, and rollout results — Performance Intelligence may propose candidates; humans approve before trusted reuse.",
    tone: "purple",
    filters: ["All", "Candidate", "Approved", "Rejected", "Archived"],
    columns: ["Insight", "Source", "Confidence", "Status", "Applies To", "Last Used"],
  },
  "source-imports": {
    title: "Source Imports",
    summary:
      "Imported or indexed source material from Drive, Obsidian, campaigns, transcripts, or manual uploads — metadata first; no live ingestion in this build.",
    tone: "gray",
    filters: ["All", "Draft", "Candidate", "Imported", "Active", "Archived"],
    columns: ["Title", "Bucket", "Type", "Status", "Source", "Tags", "Updated"],
  },
};

function formatLabel(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function toneForStatus(status: string) {
  if (["active", "approved", "gold"].includes(status)) return "green";
  if (["needs_blue_approval", "candidate", "warning", "needs_review", "paused", "possible_idea"].includes(status)) return "amber";
  if (["blocking", "rejected"].includes(status)) return "red";
  if (["silver", "bronze"].includes(status)) return "blue";
  if (["retired", "archived", "inactive"].includes(status)) return "gray";
  return "gray";
}

function toneForSeverityCell(cell: string) {
  const normalized = cell.toLowerCase();
  if (normalized === "blocking") return "red";
  if (normalized === "warning") return "amber";
  if (normalized === "guidance") return "blue";
  return "gray";
}

function toneForRatingCell(cell: string) {
  const normalized = cell.toLowerCase();
  if (normalized === "gold") return "green";
  if (normalized === "silver") return "blue";
  if (normalized === "bronze") return "blue";
  if (normalized === "rejected") return "red";
  if (normalized.includes("review")) return "amber";
  return "gray";
}

function sourceRatingKey(value: string) {
  const normalized = value.toLowerCase().replace(/\s+/g, "_");
  if (normalized === "needs_review") return "needs_review";
  if (["gold", "silver", "bronze", "rejected"].includes(normalized)) return normalized;
  return "unknown";
}

function sourceRatingStyles(value: string) {
  const rating = sourceRatingKey(value);
  if (rating === "gold") {
    return { dot: "bg-[#FACC15]", badge: "border-[rgba(250,204,21,0.35)] bg-[rgba(250,204,21,0.10)] text-[#FDE68A]" };
  }
  if (rating === "silver") {
    return { dot: "bg-[#CBD5E1]", badge: "border-[rgba(203,213,225,0.35)] bg-[rgba(203,213,225,0.10)] text-[#E2E8F0]" };
  }
  if (rating === "bronze") {
    return { dot: "bg-[#C08457]", badge: "border-[rgba(192,132,87,0.40)] bg-[rgba(192,132,87,0.11)] text-[#FDBA74]" };
  }
  if (rating === "needs_review") {
    return { dot: "bg-[#F59E0B]", badge: "border-[rgba(245,158,11,0.40)] bg-[rgba(245,158,11,0.10)] text-[#FCD34D]" };
  }
  if (rating === "rejected") {
    return { dot: "bg-[#FB7185]", badge: "border-[rgba(251,113,133,0.40)] bg-[rgba(251,113,133,0.10)] text-[#FDA4AF]" };
  }
  return { dot: "bg-slate-500", badge: "border-slate-700 bg-slate-900/90 text-slate-200" };
}

function SourceRatingBadge({ value }: { value: string }) {
  const styles = sourceRatingStyles(value);
  return (
    <span className={cn("inline-flex items-center gap-2 rounded-md border px-2.5 py-1 text-xs font-semibold", styles.badge)}>
      <span className={cn("h-2.5 w-2.5 rounded-full", styles.dot)} />
      {formatLabel(value)}
    </span>
  );
}

function readPayloadString(item: LibraryItem, key: string, fallback: string) {
  const value = item.payload?.[key];
  return typeof value === "string" ? value : fallback;
}

function readPayloadBoolean(item: LibraryItem, key: string, fallback: boolean) {
  const value = item.payload?.[key];
  return typeof value === "boolean" ? value : fallback;
}

function readPayloadStringArray(item: LibraryItem, key: string, fallback: string[]) {
  const value = item.payload?.[key];
  if (Array.isArray(value) && value.every((entry) => typeof entry === "string")) return value as string[];
  return fallback;
}

function learningPayload(insight: LearningInsight) {
  return insight.payload ?? {};
}

function readLearningString(insight: LearningInsight, key: string, fallback: string) {
  const value = learningPayload(insight)[key];
  return typeof value === "string" ? value : fallback;
}

function readLearningBoolean(insight: LearningInsight, key: string, fallback: boolean) {
  const value = learningPayload(insight)[key];
  return typeof value === "boolean" ? value : fallback;
}

function toLibraryItem(record: {
  recordId: string;
  type: string;
  name: string;
  status: string;
  summary: string;
  tags: string[];
  riskLevel?: LibraryItem["riskLevel"];
  payload?: Record<string, unknown>;
  createdAt?: number;
  updatedAt?: number;
  bucket?: string;
  title?: string;
  sourceSystem?: string;
  sourceUri?: string;
  sourceFileId?: string;
  sourceFolderId?: string;
  sourceLabel?: string;
  contentHash?: string;
  linkedCampaignIds?: string[];
  linkedAssetIds?: string[];
  usageRights?: string;
  confidence?: number;
  priority?: string;
  reviewOwner?: string;
  driveFileId?: string;
  driveFolderId?: string;
  driveMimeType?: string;
  driveWebUrl?: string;
  driveFileName?: string;
  drivePath?: string;
  driveLastModifiedAt?: number;
  driveLastSyncedAt?: number;
  driveSyncStatus?: string;
  driveSyncNotes?: string;
  obsidianPath?: string;
  obsidianNoteTitle?: string;
  obsidianSyncStatus?: string;
  obsidianLastSyncedAt?: number;
  obsidianLastExportedAt?: number;
  obsidianLastPreviewedAt?: number;
  obsidianFrontmatterJson?: string;
  obsidianBacklinks?: string[];
  obsidianTags?: string[];
  obsidianSyncNotes?: string;
  lastIndexedAt?: number;
  lastExportedAt?: number;
  syncStatus?: string;
  syncNotes?: string;
}): LibraryItem {
  return {
    id: record.recordId,
    type: record.type,
    name: record.name,
    status: record.status,
    summary: record.summary,
    tags: record.tags,
    riskLevel: record.riskLevel,
    payload: record.payload,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    bucket: record.bucket,
    title: record.title,
    sourceSystem: record.sourceSystem,
    sourceUri: record.sourceUri,
    sourceFileId: record.sourceFileId,
    sourceFolderId: record.sourceFolderId,
    sourceLabel: record.sourceLabel,
    contentHash: record.contentHash,
    linkedCampaignIds: record.linkedCampaignIds,
    linkedAssetIds: record.linkedAssetIds,
    usageRights: record.usageRights,
    confidence: record.confidence,
    priority: record.priority,
    reviewOwner: record.reviewOwner,
    driveFileId: record.driveFileId,
    driveFolderId: record.driveFolderId,
    driveMimeType: record.driveMimeType,
    driveWebUrl: record.driveWebUrl,
    driveFileName: record.driveFileName,
    drivePath: record.drivePath,
    driveLastModifiedAt: record.driveLastModifiedAt,
    driveLastSyncedAt: record.driveLastSyncedAt,
    driveSyncStatus: record.driveSyncStatus,
    driveSyncNotes: record.driveSyncNotes,
    obsidianPath: record.obsidianPath,
    obsidianNoteTitle: record.obsidianNoteTitle,
    obsidianSyncStatus: record.obsidianSyncStatus,
    obsidianLastSyncedAt: record.obsidianLastSyncedAt,
    obsidianLastExportedAt: record.obsidianLastExportedAt,
    obsidianLastPreviewedAt: record.obsidianLastPreviewedAt,
    obsidianFrontmatterJson: record.obsidianFrontmatterJson,
    obsidianBacklinks: record.obsidianBacklinks,
    obsidianTags: record.obsidianTags,
    obsidianSyncNotes: record.obsidianSyncNotes,
    lastIndexedAt: record.lastIndexedAt,
    lastExportedAt: record.lastExportedAt,
    syncStatus: record.syncStatus,
    syncNotes: record.syncNotes,
  };
}

function toLearningInsight(record: {
  recordId: string;
  source: LearningInsight["source"];
  status: LearningInsight["status"];
  title: string;
  summary: string;
  confidence: number;
  payload?: Record<string, unknown>;
  createdAt?: number;
  updatedAt?: number;
  approvedAt?: number;
  approvedBy?: string;
  rejectedAt?: number;
  rejectedBy?: string;
  archivedAt?: number;
  archivedBy?: string;
}): LearningInsight {
  return {
    id: record.recordId,
    source: record.source,
    status: record.status,
    title: record.title,
    summary: record.summary,
    confidence: record.confidence,
    payload: record.payload,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    approvedAt: record.approvedAt,
    approvedBy: record.approvedBy,
    rejectedAt: record.rejectedAt,
    rejectedBy: record.rejectedBy,
    archivedAt: record.archivedAt,
    archivedBy: record.archivedBy,
  };
}

function rowsFor(key: LibraryPageKey, libraryItems: LibraryItem[], learningInsights: LearningInsight[]): InventoryRecord[] {
  if (key === "learning" || key === "campaign-learnings") {
    return learningInsights.map((insight) => ({
      id: insight.id,
      title: insight.title,
      status: insight.status,
      summary: insight.summary,
      source: insight,
      kind: "learning",
      cells: [
        insight.title,
        formatLabel(insight.source),
        `${Math.round(insight.confidence * 100)}%`,
        formatLabel(insight.status),
        readLearningString(insight, "appliesTo", "founder nurture, reply handling"),
        readLearningString(insight, "lastUsed", "Apr 30"),
      ],
    }));
  }

  if (isExtendedSourceTablePage(key)) {
    return libraryItems
      .filter((item) => libraryItemMatchesSlug(item, key as LibraryRouteSlug))
      .map((item) => ({
        id: item.id,
        title: displayTitleForItem(item),
        status: item.status,
        summary: item.summary,
        source: item,
        kind: "library" as const,
        cells: [
          displayTitleForItem(item),
          item.bucket ? formatLabel(item.bucket) : "—",
          formatLabel(item.type),
          formatLabel(item.status),
          item.sourceSystem ?? readPayloadString(item, "sourceLabel", "manual"),
          item.tags.join(", ") || "—",
          formatLibraryUpdated(item),
        ],
      }));
  }

  const pick = (predicate: (item: LibraryItem) => boolean) => libraryItems.filter(predicate);

  if (key === "offers") {
    return pick((item) => item.type === "offer" || item.type === "lead_magnet").map((item) => ({
      id: item.id,
      title: item.name,
      status: item.status,
      summary: item.summary,
      source: item,
      kind: "library",
      cells: [
        item.name,
        item.type.replace(/_/g, " "),
        formatLabel(item.status),
        readPayloadString(item, "approvalOwner", item.status === "needs_blue_approval" ? "Blue" : "Operator"),
        readPayloadString(item, "allowedChannels", "email, landing page"),
        readPayloadString(item, "allowedAudiences", "General marketing"),
        readPayloadString(item, "lastUsed", "Apr 30"),
        readPayloadString(item, "performanceSignal", "stable"),
      ],
    }));
  }

  if (key === "email") {
    return pick((item) => item.type === "email").map((item) => ({
      id: item.id,
      title: item.name,
      status: item.status,
      summary: item.summary,
      source: item,
      kind: "library",
      cells: [
        readPayloadString(item, "subjectTitle", item.name),
        formatLabel(item.status),
        readPayloadString(item, "sourceType", "unknown"),
        readPayloadString(item, "associatedCampaign", "Unassigned"),
        readPayloadString(item, "lastUsed", "Apr 28"),
      ],
    }));
  }

  if (key === "voice-rules") {
    return pick((item) => item.type === "voice_rule").map((item) => ({
      id: item.id,
      title: item.name,
      status: item.status,
      summary: item.summary,
      source: item,
      kind: "library",
      cells: [
        item.name,
        readPayloadString(item, "severityLabel", item.status === "blocking" ? "Blocking" : formatLabel(item.status)),
        readPayloadString(item, "lifecycleStatus", "Active"),
        item.summary,
      ],
    }));
  }

  if (key === "signoffs") {
    return pick((item) => item.type === "signoff").map((item) => ({
      id: item.id,
      title: item.name,
      status: item.status,
      summary: item.summary,
      source: item,
      kind: "library",
      cells: [
        item.name,
        readPayloadString(item, "allowedContexts", "founder nurture, reactivation"),
        formatLabel(item.status),
        readPayloadBoolean(item, "agentAutoChoose", true) ? "Yes" : "No",
        readPayloadBoolean(item, "requiresBariReview", true) ? "Yes" : "No",
        readPayloadString(item, "exampleUsage", item.summary),
      ],
    }));
  }

  if (key === "audiences") {
    return pick((item) => item.type === "audience").map((item) => ({
      id: item.id,
      title: item.name,
      status: item.status,
      summary: item.summary,
      source: item,
      kind: "library",
      cells: [
        item.name,
        readPayloadString(item, "sourceLabel", "Keap tag"),
        formatLabel(item.status),
        readPayloadString(item, "estimatedSize", "—"),
        readPayloadString(item, "allowedOffers", "—"),
        readPayloadString(item, "exclusions", "—"),
        readPayloadString(item, "lastUsed", "Apr 30"),
        readPayloadString(item, "performanceNotes", "—"),
      ],
    }));
  }

  return pick((item) => item.type === "compliance_rule").map((item) => ({
    id: item.id,
    title: item.name,
    status: item.status,
    summary: item.summary,
    source: item,
    kind: "library",
    cells: [
      item.name,
      readPayloadString(item, "severityLabel", item.status === "blocking" ? "Blocking" : formatLabel(item.status)),
      readPayloadString(item, "claimType", "Claims"),
      readPayloadString(item, "lifecycleStatus", "Active"),
      readPayloadString(item, "channels", "email, landing page"),
      readPayloadString(item, "owner", "Blue / Compliance"),
      item.summary,
    ],
  }));
}

function rowMatchesFilter(key: LibraryPageKey, record: InventoryRecord, activeFilter: string) {
  if (activeFilter === "All") return true;
  const normalized = activeFilter.toLowerCase();

  if (key === "offers") {
    if (normalized === "needs blue approval") return record.status === "needs_blue_approval";
    if (normalized === "approved") return record.status === "active";
    return formatLabel(record.status).toLowerCase() === normalized;
  }

  if (key === "email") return formatLabel(record.status).toLowerCase() === normalized;

  if (key === "voice-rules") {
    const severity = record.cells[1].toLowerCase();
    if (normalized === "blocking") return severity === "blocking";
    if (normalized === "warning") return severity === "warning";
    if (normalized === "guidance") return severity === "guidance";
    return true;
  }

  if (key === "signoffs") {
    if (normalized === "active") return record.status === "active";
    if (normalized === "inactive") return record.status === "inactive";
    if (normalized === "requires bari review") return record.cells[4].toLowerCase() === "yes";
    if (normalized === "auto-selectable") return record.cells[3].toLowerCase() === "yes";
    return true;
  }

  if (key === "audiences") {
    if (normalized === "active") return record.status === "active";
    if (normalized === "demo") return record.status === "demo";
    if (normalized === "manual") return record.status === "manual";
    if (normalized === "needs review") return record.status === "needs_review";
    return true;
  }

  if (key === "compliance") {
    if (normalized === "inactive") return record.status === "inactive";
    const severity = record.cells[1].toLowerCase();
    if (normalized === "blocking") return severity === "blocking" && record.status !== "inactive";
    if (normalized === "warning") return severity === "warning" && record.status !== "inactive";
    if (normalized === "guidance") return severity === "guidance" && record.status !== "inactive";
    return true;
  }

  if (key === "cta-library") {
    if (normalized === "needs blue approval") return record.status === "needs_blue_approval";
    if (normalized === "approved") return record.status === "active";
    return formatLabel(record.status).toLowerCase() === normalized;
  }

  if (isExtendedSourceTablePage(key)) {
    return formatLabel(record.status).toLowerCase() === normalized;
  }

  return formatLabel(record.status).toLowerCase() === normalized;
}

function filterCountFor(key: LibraryPageKey, filter: string, rows: InventoryRecord[]) {
  if (filter === "All") return rows.length;
  return rows.filter((row) => rowMatchesFilter(key, row, filter)).length;
}

function toSearchText(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) return value.map(toSearchText).join(" ");
  if (value && typeof value === "object") return Object.values(value).map(toSearchText).join(" ");
  return "";
}

function recordMatchesSearch(record: InventoryRecord, query: string) {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return true;
  const sourceText = toSearchText(record.source);
  const haystack = [record.title, record.summary, record.status, ...record.cells, sourceText].join(" ").toLowerCase();
  return haystack.includes(normalizedQuery);
}

function advancedFilterDefinitionsFor(key: LibraryPageKey): AdvancedFilterDefinition[] {
  if (key === "email") {
    return [
      {
        key: "sourceType",
        label: "Source Type",
        getValue: (record) => record.kind === "library" ? readPayloadString(record.source as LibraryItem, "sourceType", "Unknown") : "",
      },
      {
        key: "retrieval",
        label: "Bari Retrieval",
        getValue: (record) => record.kind === "library" ? (readPayloadBoolean(record.source as LibraryItem, "allowedForBariVoice", false) ? "Allowed" : "Blocked") : "",
      },
    ];
  }
  if (key === "offers") {
    return [
      {
        key: "type",
        label: "Type",
        getValue: (record) => record.kind === "library" ? formatLabel((record.source as LibraryItem).type) : "",
      },
      {
        key: "approvalOwner",
        label: "Approval Owner",
        getValue: (record) => record.kind === "library" ? readPayloadString(record.source as LibraryItem, "approvalOwner", "Operator") : "",
      },
    ];
  }
  if (key === "voice-rules") {
    return [
      {
        key: "severity",
        label: "Severity",
        getValue: (record) => record.cells[1] ?? "",
      },
      {
        key: "status",
        label: "Status",
        getValue: (record) => record.kind === "library" ? readPayloadString(record.source as LibraryItem, "lifecycleStatus", "Active") : "",
      },
    ];
  }
  if (key === "signoffs") {
    return [
      {
        key: "status",
        label: "Status",
        getValue: (record) => formatLabel(record.status),
      },
      {
        key: "autoChoose",
        label: "Agent Auto Choose",
        getValue: (record) => record.kind === "library" ? (readPayloadBoolean(record.source as LibraryItem, "agentAutoChoose", false) ? "Yes" : "No") : "",
      },
    ];
  }
  if (key === "audiences") {
    return [
      {
        key: "source",
        label: "Source",
        getValue: (record) => record.kind === "library" ? readPayloadString(record.source as LibraryItem, "sourceLabel", readPayloadString(record.source as LibraryItem, "sourceType", "Unknown")) : "",
      },
      {
        key: "performance",
        label: "Performance",
        getValue: (record) => record.kind === "library" ? readPayloadString(record.source as LibraryItem, "performanceNotes", "Unknown") : "",
      },
    ];
  }
  if (key === "compliance") {
    return [
      {
        key: "severity",
        label: "Severity",
        getValue: (record) => record.cells[1] ?? "",
      },
      {
        key: "owner",
        label: "Owner",
        getValue: (record) => record.kind === "library" ? readPayloadString(record.source as LibraryItem, "owner", "Blue / Compliance") : "",
      },
    ];
  }
  if (isExtendedSourceTablePage(key)) {
    return [
      {
        key: "bucket",
        label: "Bucket",
        getValue: (record) => (record.kind === "library" ? formatLabel((record.source as LibraryItem).bucket ?? "") : ""),
      },
      {
        key: "type",
        label: "Type",
        getValue: (record) => (record.kind === "library" ? formatLabel((record.source as LibraryItem).type) : ""),
      },
    ];
  }
  return [
    {
      key: "source",
      label: "Source",
      getValue: (record) => record.kind === "learning" ? formatLabel((record.source as LearningInsight).source) : "",
    },
    {
      key: "status",
      label: "Status",
      getValue: (record) => formatLabel(record.status),
    },
  ];
}

function recordMatchesAdvancedFilters(record: InventoryRecord, definitions: AdvancedFilterDefinition[], values: Record<string, string>) {
  return definitions.every((definition) => {
    const selected = values[definition.key];
    if (!selected) return true;
    return definition.getValue(record) === selected;
  });
}

function uniqueAdvancedFilterOptions(rows: InventoryRecord[], definition: AdvancedFilterDefinition) {
  return [...new Set(rows.map((row) => definition.getValue(row)).filter(Boolean))].sort((left, right) => left.localeCompare(right));
}

/** Semantic dot tone per page filter (matches previous status-strip meaning). */
function filterChipDotTone(key: LibraryPageKey, filter: string): "green" | "amber" | "red" | "blue" | "purple" | "gray" {
  if (filter === "All") {
    if (key === "learning" || key === "campaign-learnings") return "purple";
    return "blue";
  }
  if (key === "offers") {
    if (filter === "Active" || filter === "Approved") return "green";
    if (filter === "Needs Blue Approval") return "amber";
    if (filter === "Possible Idea") return "blue";
    return "gray";
  }
  if (key === "voice-rules") {
    if (filter === "Blocking") return "red";
    if (filter === "Warning") return "amber";
    return "blue";
  }
  if (key === "signoffs") {
    if (filter === "Active" || filter === "Auto-selectable") return "green";
    if (filter === "Requires Bari Review") return "amber";
    return "gray";
  }
  if (key === "audiences") {
    if (filter === "Active") return "green";
    if (filter === "Demo" || filter === "Manual") return "blue";
    if (filter === "Needs Review") return "amber";
    return "gray";
  }
  if (key === "compliance") {
    if (filter === "Blocking") return "red";
    if (filter === "Warning") return "amber";
    if (filter === "Guidance") return "blue";
    return "gray";
  }
  if (key === "learning" || key === "campaign-learnings") {
    if (filter === "Candidate") return "amber";
    if (filter === "Approved") return "green";
    if (filter === "Rejected") return "red";
    return "gray";
  }
  if (isExtendedSourceTablePage(key)) {
    if (filter === "Approved" || filter === "Active") return "green";
    if (filter === "Draft" || filter === "Candidate" || filter === "Needs Review" || filter === "Needs Blue Approval") return "amber";
    if (filter === "Rejected") return "red";
    return "gray";
  }
  return "gray";
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-950/70 px-3 py-2 text-sm text-slate-300">
      <span className="font-semibold text-slate-200">{label}: </span>
      {value}
    </div>
  );
}

const inputStyles = "focus-ring w-full rounded-lg border border-slate-700 bg-slate-950/80 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500";
const textareaStyles = `${inputStyles} min-h-[96px] resize-y`;

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">{label}</span>
      {children}
    </label>
  );
}

function boolFromDraft(value: string | number | boolean | undefined) {
  return value === true;
}

function stringFromDraft(value: string | number | boolean | undefined) {
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  return "";
}

function numberFromDraft(value: string | number | boolean | undefined) {
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value) || 0;
  return 0;
}

function createRecordId(key: LibraryPageKey) {
  const prefixMap: Partial<Record<LibraryPageKey, string>> = {
    offers: "offer",
    email: "email",
    "voice-rules": "rule",
    signoffs: "signoff",
    audiences: "aud",
    compliance: "comp",
    learning: "learn",
    "copy-archive": "ca",
    "swipe-file": "swipe",
    "voice-style": "vs",
    "audience-intelligence": "audai",
    "cta-library": "cta",
    "platform-playbooks": "pp",
    "campaign-learnings": "learn",
    "source-imports": "src",
  };
  return `${prefixMap[key] ?? "lib"}_${Date.now()}`;
}

function createEmptyDraft(key: LibraryPageKey): EditorDraft {
  if (key === "email") {
    return {
      titleSubject: "",
      rating: "needs_review",
      sourceType: "",
      associatedCampaign: "",
      lastUsed: "",
      allowedForBariVoiceRetrieval: false,
      excerpt: "",
      whyThisSourceMatters: "",
      usageNotes: "",
      lastTouched: "",
    };
  }
  if (key === "offers" || key === "cta-library") {
    return {
      name: "",
      type: "offer",
      status: "active",
      approvalOwner: "",
      allowedChannels: "",
      allowedAudiences: "",
      lastUsed: "",
      performance: "",
      description: "",
      usageNotes: "",
      lastTouched: "",
    };
  }
  if (key === "voice-rules" || key === "voice-style") {
    return {
      rule: "",
      severity: "guidance",
      status: "Active",
      summary: "",
      usageNotes: "",
      lastTouched: "",
    };
  }
  if (key === "signoffs") {
    return {
      signoffText: "",
      allowedContexts: "",
      status: "active",
      agentAutoChoose: false,
      requiresBariReview: false,
      exampleUsage: "",
      usageNotes: "",
      lastTouched: "",
    };
  }
  if (key === "audiences" || key === "audience-intelligence") {
    return {
      audienceName: "",
      source: "",
      status: "active",
      estimatedSize: "",
      allowedOffers: "",
      exclusions: "",
      lastUsed: "",
      performance: "",
      description: "",
      usageNotes: "",
      lastTouched: "",
    };
  }
  if (key === "compliance") {
    return {
      rule: "",
      severity: "guidance",
      claimType: "",
      status: "guidance",
      channels: "",
      owner: "",
      examples: "",
      summary: "",
      usageNotes: "",
      lastTouched: "",
    };
  }
  if (isStructuredBucketPage(key)) {
    return {
      recordTitle: "",
      recordSummary: "",
      recordStatus: "draft",
      recordType: defaultRecordTypeForStructured(key),
      tagsComma: "",
      sourceSystem: "manual",
      sourceUri: "",
      usageRights: key === "swipe-file" ? "inspiration_only" : "sage_owned",
      fullContent: "",
      platform: "",
      linkedCampaigns: "",
      lastTouched: "",
    };
  }
  return {
    insight: "",
    source: "bari_edit",
    confidence: 75,
    status: "candidate",
    appliesTo: "",
    lastUsed: "",
    description: "",
    usageNotes: "",
    lastTouched: "",
  };
}

function draftFromRecord(key: LibraryPageKey, record?: InventoryRecord): EditorDraft {
  if (!record) return createEmptyDraft(key);

  if (record.kind === "learning") {
    const insight = record.source as LearningInsight;
    return {
      insight: insight.title,
      source: insight.source,
      confidence: Math.round(insight.confidence * 100),
      status: insight.status,
      appliesTo: readLearningString(insight, "appliesTo", ""),
      lastUsed: readLearningString(insight, "lastUsed", ""),
      description: insight.summary,
      usageNotes: readLearningString(insight, "notes", ""),
      lastTouched: readLearningString(insight, "lastTouched", ""),
    };
  }

  const item = record.source as LibraryItem;
  if (key === "email") {
    return {
      titleSubject: readPayloadString(item, "subjectTitle", item.name),
      rating: item.status,
      sourceType: readPayloadString(item, "sourceType", ""),
      associatedCampaign: readPayloadString(item, "associatedCampaign", ""),
      lastUsed: readPayloadString(item, "lastUsed", ""),
      allowedForBariVoiceRetrieval: readPayloadBoolean(item, "allowedForBariVoice", false),
      excerpt: readPayloadString(item, "excerpt", ""),
      whyThisSourceMatters: readPayloadString(item, "whyItMatters", item.summary),
      usageNotes: readPayloadString(item, "usageNotes", ""),
      lastTouched: readPayloadString(item, "lastTouched", ""),
    };
  }
  if (key === "offers" || key === "cta-library") {
    return {
      name: item.name,
      type: item.type,
      status: item.status,
      approvalOwner: readPayloadString(item, "approvalOwner", ""),
      allowedChannels: readPayloadString(item, "allowedChannels", ""),
      allowedAudiences: readPayloadString(item, "allowedAudiences", ""),
      lastUsed: readPayloadString(item, "lastUsed", ""),
      performance: readPayloadString(item, "performanceSignal", ""),
      description: item.summary,
      usageNotes: readPayloadString(item, "usageNotes", ""),
      lastTouched: readPayloadString(item, "lastTouched", ""),
    };
  }
  if (key === "voice-rules" || key === "voice-style") {
    return {
      rule: item.name,
      severity: readPayloadString(item, "severityLabel", formatLabel(item.status)),
      status: readPayloadString(item, "lifecycleStatus", "Active"),
      summary: item.summary,
      usageNotes: readPayloadString(item, "usageNotes", ""),
      lastTouched: readPayloadString(item, "lastTouched", ""),
    };
  }
  if (key === "signoffs") {
    return {
      signoffText: readPayloadStringArray(item, "approvedVariants", [item.name]).join("\n"),
      allowedContexts: readPayloadString(item, "allowedContexts", ""),
      status: item.status,
      agentAutoChoose: readPayloadBoolean(item, "agentAutoChoose", false),
      requiresBariReview: readPayloadBoolean(item, "requiresBariReview", false),
      exampleUsage: readPayloadString(item, "exampleUsage", ""),
      usageNotes: readPayloadString(item, "notes", ""),
      lastTouched: readPayloadString(item, "lastTouched", ""),
    };
  }
  if (key === "audiences" || key === "audience-intelligence") {
    return {
      audienceName: item.name,
      source: readPayloadString(item, "sourceType", ""),
      status: item.status,
      estimatedSize: readPayloadString(item, "estimatedSize", ""),
      allowedOffers: readPayloadString(item, "allowedOffers", ""),
      exclusions: readPayloadString(item, "exclusions", ""),
      lastUsed: readPayloadString(item, "lastUsed", ""),
      performance: readPayloadString(item, "performanceNotes", ""),
      description: item.summary,
      usageNotes: readPayloadString(item, "riskNotes", ""),
      lastTouched: readPayloadString(item, "lastTouched", ""),
    };
  }
  if (key === "compliance") {
    return {
      rule: item.name,
      severity: readPayloadString(item, "severityLabel", "Guidance"),
      claimType: readPayloadString(item, "claimType", ""),
      status: item.status,
      channels: readPayloadString(item, "channels", ""),
      owner: readPayloadString(item, "owner", ""),
      examples: readPayloadString(item, "examples", ""),
      summary: item.summary,
      usageNotes: readPayloadString(item, "usageNotes", ""),
      lastTouched: readPayloadString(item, "lastTouched", ""),
    };
  }
  if (isStructuredBucketPage(key)) {
    return {
      recordTitle: displayTitleForItem(item),
      recordSummary: item.summary,
      recordStatus: item.status,
      recordType: item.type,
      tagsComma: item.tags.join(", "),
      sourceSystem: item.sourceSystem ?? "manual",
      sourceUri: item.sourceUri ?? "",
      usageRights: item.usageRights ?? (key === "swipe-file" ? "inspiration_only" : "sage_owned"),
      fullContent: readPayloadString(item, "body", ""),
      platform: readPayloadString(item, "platform", ""),
      linkedCampaigns: (item.linkedCampaignIds ?? []).join(", "),
      lastTouched: readPayloadString(item, "lastTouched", ""),
    };
  }
  return createEmptyDraft("compliance");
}

function patchForLibrarySave(key: LibraryPageKey, draft: EditorDraft, existing?: InventoryRecord) {
  const existingItem = existing?.kind === "library" ? existing.source as LibraryItem : undefined;
  const existingPayload = existingItem?.payload ?? {};
  const tags = existingItem?.tags ?? [];
  const riskLevel = existingItem?.riskLevel;

  if (isStructuredBucketPage(key)) {
    const tagsFromDraft = stringFromDraft(draft.tagsComma)
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    const mergedTags = tagsFromDraft.length ? tagsFromDraft : tags;
    const bucket =
      key === "copy-archive"
        ? "copy_archive"
        : key === "swipe-file"
          ? "swipe_file"
          : key === "platform-playbooks"
            ? "platform_playbook"
            : "source_import";
    const type = stringFromDraft(draft.recordType) || defaultRecordTypeForStructured(key);
    const name = stringFromDraft(draft.recordTitle) || "Untitled record";
    return {
      type,
      name,
      title: stringFromDraft(draft.recordTitle) || name,
      bucket,
      status: stringFromDraft(draft.recordStatus) || "draft",
      summary: stringFromDraft(draft.recordSummary),
      tags: mergedTags,
      riskLevel,
      sourceSystem: stringFromDraft(draft.sourceSystem) || "manual",
      sourceUri: stringFromDraft(draft.sourceUri),
      usageRights: stringFromDraft(draft.usageRights) || (key === "swipe-file" ? "inspiration_only" : "sage_owned"),
      linkedCampaignIds: stringFromDraft(draft.linkedCampaigns)
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      payload: {
        ...existingPayload,
        body: stringFromDraft(draft.fullContent),
        platform: stringFromDraft(draft.platform),
        lastTouched: stringFromDraft(draft.lastTouched),
      },
    };
  }

  if (key === "email") {
    return {
      type: "email",
      name: stringFromDraft(draft.titleSubject),
      status: stringFromDraft(draft.rating),
      summary: stringFromDraft(draft.whyThisSourceMatters) || stringFromDraft(draft.excerpt),
      tags,
      riskLevel,
      payload: {
        ...existingPayload,
        subjectTitle: stringFromDraft(draft.titleSubject),
        sourceType: stringFromDraft(draft.sourceType),
        associatedCampaign: stringFromDraft(draft.associatedCampaign),
        lastUsed: stringFromDraft(draft.lastUsed),
        allowedForBariVoice: boolFromDraft(draft.allowedForBariVoiceRetrieval),
        excerpt: stringFromDraft(draft.excerpt),
        whyItMatters: stringFromDraft(draft.whyThisSourceMatters),
        usageNotes: stringFromDraft(draft.usageNotes),
        lastTouched: stringFromDraft(draft.lastTouched),
      },
    };
  }
  if (key === "offers" || key === "cta-library") {
    return {
      type: stringFromDraft(draft.type),
      name: stringFromDraft(draft.name),
      status: stringFromDraft(draft.status),
      summary: stringFromDraft(draft.description),
      tags,
      riskLevel,
      ...(key === "cta-library" ? { bucket: "offer_cta" } : {}),
      payload: {
        ...existingPayload,
        approvalOwner: stringFromDraft(draft.approvalOwner),
        allowedChannels: stringFromDraft(draft.allowedChannels),
        allowedAudiences: stringFromDraft(draft.allowedAudiences),
        lastUsed: stringFromDraft(draft.lastUsed),
        performanceSignal: stringFromDraft(draft.performance),
        usageNotes: stringFromDraft(draft.usageNotes),
        lastTouched: stringFromDraft(draft.lastTouched),
      },
    };
  }
  if (key === "voice-rules" || key === "voice-style") {
    const severity = stringFromDraft(draft.severity).toLowerCase();
    const resolvedType = key === "voice-style" && existingItem?.type ? existingItem.type : "voice_rule";
    return {
      type: resolvedType,
      name: stringFromDraft(draft.rule),
      status: severity,
      summary: stringFromDraft(draft.summary),
      tags,
      riskLevel,
      ...(key === "voice-style" ? { bucket: "voice_style" } : {}),
      payload: {
        ...existingPayload,
        severityLabel: formatLabel(severity),
        lifecycleStatus: stringFromDraft(draft.status),
        usageNotes: stringFromDraft(draft.usageNotes),
        lastTouched: stringFromDraft(draft.lastTouched),
      },
    };
  }
  if (key === "signoffs") {
    return {
      type: "signoff",
      name: stringFromDraft(draft.signoffText).split("\n")[0] || "New sign-off",
      status: stringFromDraft(draft.status),
      summary: stringFromDraft(draft.exampleUsage),
      tags,
      riskLevel,
      payload: {
        ...existingPayload,
        approvedVariants: stringFromDraft(draft.signoffText).split("\n").map((line) => line.trim()).filter(Boolean),
        allowedContexts: stringFromDraft(draft.allowedContexts),
        agentAutoChoose: boolFromDraft(draft.agentAutoChoose),
        requiresBariReview: boolFromDraft(draft.requiresBariReview),
        exampleUsage: stringFromDraft(draft.exampleUsage),
        notes: stringFromDraft(draft.usageNotes),
        lastTouched: stringFromDraft(draft.lastTouched),
      },
    };
  }
  if (key === "audiences" || key === "audience-intelligence") {
    return {
      type: key === "audience-intelligence" && existingItem?.type ? existingItem.type : "audience",
      name: stringFromDraft(draft.audienceName),
      status: stringFromDraft(draft.status),
      summary: stringFromDraft(draft.description),
      tags,
      riskLevel,
      ...(key === "audience-intelligence" ? { bucket: "audience_intelligence" } : {}),
      payload: {
        ...existingPayload,
        sourceType: stringFromDraft(draft.source),
        sourceLabel: stringFromDraft(draft.source),
        estimatedSize: stringFromDraft(draft.estimatedSize),
        allowedOffers: stringFromDraft(draft.allowedOffers),
        exclusions: stringFromDraft(draft.exclusions),
        lastUsed: stringFromDraft(draft.lastUsed),
        performanceNotes: stringFromDraft(draft.performance),
        riskNotes: stringFromDraft(draft.usageNotes),
        lastTouched: stringFromDraft(draft.lastTouched),
      },
    };
  }
  if (key === "compliance") {
    return {
      type: "compliance_rule",
      name: stringFromDraft(draft.rule),
      status: stringFromDraft(draft.status),
      summary: stringFromDraft(draft.summary),
      tags,
      riskLevel,
      payload: {
        ...existingPayload,
        severityLabel: stringFromDraft(draft.severity),
        lifecycleStatus: stringFromDraft(draft.status) === "inactive" ? "Inactive" : "Active",
        claimType: stringFromDraft(draft.claimType),
        channels: stringFromDraft(draft.channels),
        owner: stringFromDraft(draft.owner),
        examples: stringFromDraft(draft.examples),
        usageNotes: stringFromDraft(draft.usageNotes),
        lastTouched: stringFromDraft(draft.lastTouched),
      },
    };
  }
}

function patchForLearningSave(draft: EditorDraft, existing?: InventoryRecord) {
  const existingInsight = existing?.kind === "learning" ? existing.source as LearningInsight : undefined;
  return {
    source: stringFromDraft(draft.source),
    status: stringFromDraft(draft.status),
    title: stringFromDraft(draft.insight),
    summary: stringFromDraft(draft.description),
    confidence: numberFromDraft(draft.confidence) / 100,
    payload: {
      ...(existingInsight?.payload ?? {}),
      appliesTo: stringFromDraft(draft.appliesTo),
      lastUsed: stringFromDraft(draft.lastUsed),
      notes: stringFromDraft(draft.usageNotes),
      lastTouched: stringFromDraft(draft.lastTouched),
    },
  };
}

function EditorActions({
  mode,
  saving,
  onEdit,
  onSave,
  onCancel,
}: {
  mode: EditorMode;
  saving: boolean;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  if (mode === "view") {
    return (
      <button className="focus-ring rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-sm font-semibold text-slate-200 hover:bg-slate-800" onClick={onEdit} type="button">
        Edit
      </button>
    );
  }
  return (
    <div className="flex gap-2">
      <button className="focus-ring rounded-lg border border-sky-500/60 bg-sky-500 px-3 py-1.5 text-sm font-semibold text-slate-950 hover:bg-sky-400 disabled:opacity-60" disabled={saving} onClick={onSave} type="button">
        {mode === "create" ? "Create" : "Save"}
      </button>
      <button className="focus-ring rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-sm font-semibold text-slate-200 hover:bg-slate-800 disabled:opacity-60" disabled={saving} onClick={onCancel} type="button">
        Cancel
      </button>
    </div>
  );
}

function SelectedRecordPanel({
  keyName,
  record,
  mode,
  draft,
  saving,
  error,
  savedMessage,
  onEdit,
  onSave,
  onCancel,
  onDraftChange,
}: {
  keyName: LibraryPageKey;
  record?: InventoryRecord;
  mode: EditorMode;
  draft: EditorDraft;
  saving: boolean;
  error: string | null;
  savedMessage: string | null;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  onDraftChange: (field: string, value: string | number | boolean) => void;
}) {
  const isEditing = mode !== "view";
  const heading = (
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-slate-400">Selected record</p>
        <h3 className="mt-2 text-lg font-semibold text-slate-100">
          {mode === "create" ? `Add ${libraryPageConfig[keyName].title.slice(0, -1) || "Record"}` : record?.title ?? "Select a record"}
        </h3>
      </div>
      <div className="flex flex-col items-end gap-2">
        {mode === "view" && record ? (
          keyName === "email"
            ? <SourceRatingBadge value={record.status} />
            : <StatusBadge tone={toneForStatus(record.status)}>{formatLabel(record.status)}</StatusBadge>
        ) : null}
        <EditorActions mode={mode} saving={saving} onEdit={onEdit} onSave={onSave} onCancel={onCancel} />
      </div>
    </div>
  );

  if (!record && mode === "view") {
    return (
      <ControlPanel className="p-4">
        <p className="text-sm font-semibold text-slate-100">Selected record</p>
        <p className="mt-3 text-sm text-slate-300">No record selected. Choose a row to inspect inventory constraints and usage posture.</p>
      </ControlPanel>
    );
  }

  if (isEditing) {
    return (
      <ControlPanel className="p-4">
        {heading}
        {error ? <div className="mt-4 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-100">{error}</div> : null}
        {savedMessage ? <div className="mt-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-100">{savedMessage}</div> : null}
        <div className="mt-4 grid gap-4 text-sm">
          {keyName === "email" ? (
            <>
              <Field label="Title / Subject"><input className={inputStyles} value={stringFromDraft(draft.titleSubject)} onChange={(e) => onDraftChange("titleSubject", e.target.value)} /></Field>
              <Field label="Rating">
                <select className={inputStyles} value={stringFromDraft(draft.rating)} onChange={(e) => onDraftChange("rating", e.target.value)}>
                  {["gold", "silver", "bronze", "needs_review", "rejected"].map((option) => <option key={option} value={option}>{formatLabel(option)}</option>)}
                </select>
              </Field>
              <Field label="Source Type"><input className={inputStyles} value={stringFromDraft(draft.sourceType)} onChange={(e) => onDraftChange("sourceType", e.target.value)} /></Field>
              <Field label="Associated Campaign"><input className={inputStyles} value={stringFromDraft(draft.associatedCampaign)} onChange={(e) => onDraftChange("associatedCampaign", e.target.value)} /></Field>
              <Field label="Last Used"><input className={inputStyles} value={stringFromDraft(draft.lastUsed)} onChange={(e) => onDraftChange("lastUsed", e.target.value)} /></Field>
              <label className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950/65 px-3 py-2.5 text-sm text-slate-200">
                Allowed for Bari voice retrieval
                <input checked={boolFromDraft(draft.allowedForBariVoiceRetrieval)} onChange={(e) => onDraftChange("allowedForBariVoiceRetrieval", e.target.checked)} type="checkbox" />
              </label>
              <Field label="Excerpt"><textarea className={textareaStyles} value={stringFromDraft(draft.excerpt)} onChange={(e) => onDraftChange("excerpt", e.target.value)} /></Field>
              <Field label="Why This Source Matters"><textarea className={textareaStyles} value={stringFromDraft(draft.whyThisSourceMatters)} onChange={(e) => onDraftChange("whyThisSourceMatters", e.target.value)} /></Field>
              <Field label="Usage Notes"><textarea className={textareaStyles} value={stringFromDraft(draft.usageNotes)} onChange={(e) => onDraftChange("usageNotes", e.target.value)} /></Field>
              <Field label="Last Touched"><input className={inputStyles} value={stringFromDraft(draft.lastTouched)} onChange={(e) => onDraftChange("lastTouched", e.target.value)} /></Field>
            </>
          ) : null}
          {keyName === "offers" || keyName === "cta-library" ? (
            <>
              <Field label="Name"><input className={inputStyles} value={stringFromDraft(draft.name)} onChange={(e) => onDraftChange("name", e.target.value)} /></Field>
              <Field label="Type"><select className={inputStyles} value={stringFromDraft(draft.type)} onChange={(e) => onDraftChange("type", e.target.value)}>{["offer", "lead_magnet", "cta"].map((option) => <option key={option} value={option}>{formatLabel(option)}</option>)}</select></Field>
              <Field label="Status"><select className={inputStyles} value={stringFromDraft(draft.status)} onChange={(e) => onDraftChange("status", e.target.value)}>{["active", "needs_blue_approval", "possible_idea", "paused", "retired"].map((option) => <option key={option} value={option}>{formatLabel(option)}</option>)}</select></Field>
              <Field label="Approval Owner"><input className={inputStyles} value={stringFromDraft(draft.approvalOwner)} onChange={(e) => onDraftChange("approvalOwner", e.target.value)} /></Field>
              <Field label="Allowed Channels"><input className={inputStyles} value={stringFromDraft(draft.allowedChannels)} onChange={(e) => onDraftChange("allowedChannels", e.target.value)} /></Field>
              <Field label="Allowed Audiences"><input className={inputStyles} value={stringFromDraft(draft.allowedAudiences)} onChange={(e) => onDraftChange("allowedAudiences", e.target.value)} /></Field>
              <Field label="Last Used"><input className={inputStyles} value={stringFromDraft(draft.lastUsed)} onChange={(e) => onDraftChange("lastUsed", e.target.value)} /></Field>
              <Field label="Performance"><input className={inputStyles} value={stringFromDraft(draft.performance)} onChange={(e) => onDraftChange("performance", e.target.value)} /></Field>
              <Field label="Description"><textarea className={textareaStyles} value={stringFromDraft(draft.description)} onChange={(e) => onDraftChange("description", e.target.value)} /></Field>
              <Field label="Usage Notes"><textarea className={textareaStyles} value={stringFromDraft(draft.usageNotes)} onChange={(e) => onDraftChange("usageNotes", e.target.value)} /></Field>
              <Field label="Last Touched"><input className={inputStyles} value={stringFromDraft(draft.lastTouched)} onChange={(e) => onDraftChange("lastTouched", e.target.value)} /></Field>
            </>
          ) : null}
          {keyName === "voice-rules" || keyName === "voice-style" ? (
            <>
              <Field label="Rule"><input className={inputStyles} value={stringFromDraft(draft.rule)} onChange={(e) => onDraftChange("rule", e.target.value)} /></Field>
              <Field label="Severity / Type"><select className={inputStyles} value={stringFromDraft(draft.severity)} onChange={(e) => onDraftChange("severity", e.target.value)}>{["Blocking", "Warning", "Guidance"].map((option) => <option key={option} value={option}>{option}</option>)}</select></Field>
              <Field label="Status"><select className={inputStyles} value={stringFromDraft(draft.status)} onChange={(e) => onDraftChange("status", e.target.value)}>{["Active", "Inactive"].map((option) => <option key={option} value={option}>{option}</option>)}</select></Field>
              <Field label="Summary"><textarea className={textareaStyles} value={stringFromDraft(draft.summary)} onChange={(e) => onDraftChange("summary", e.target.value)} /></Field>
              <Field label="Usage Notes"><textarea className={textareaStyles} value={stringFromDraft(draft.usageNotes)} onChange={(e) => onDraftChange("usageNotes", e.target.value)} /></Field>
              <Field label="Last Touched"><input className={inputStyles} value={stringFromDraft(draft.lastTouched)} onChange={(e) => onDraftChange("lastTouched", e.target.value)} /></Field>
            </>
          ) : null}
          {keyName === "signoffs" ? (
            <>
              <Field label="Sign-off Text"><textarea className={textareaStyles} value={stringFromDraft(draft.signoffText)} onChange={(e) => onDraftChange("signoffText", e.target.value)} /></Field>
              <Field label="Allowed Contexts"><input className={inputStyles} value={stringFromDraft(draft.allowedContexts)} onChange={(e) => onDraftChange("allowedContexts", e.target.value)} /></Field>
              <Field label="Status"><select className={inputStyles} value={stringFromDraft(draft.status)} onChange={(e) => onDraftChange("status", e.target.value)}>{["active", "inactive"].map((option) => <option key={option} value={option}>{formatLabel(option)}</option>)}</select></Field>
              <label className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950/65 px-3 py-2.5 text-sm text-slate-200">Agent Auto Choose<input checked={boolFromDraft(draft.agentAutoChoose)} onChange={(e) => onDraftChange("agentAutoChoose", e.target.checked)} type="checkbox" /></label>
              <label className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950/65 px-3 py-2.5 text-sm text-slate-200">Requires Bari Review<input checked={boolFromDraft(draft.requiresBariReview)} onChange={(e) => onDraftChange("requiresBariReview", e.target.checked)} type="checkbox" /></label>
              <Field label="Example Usage"><textarea className={textareaStyles} value={stringFromDraft(draft.exampleUsage)} onChange={(e) => onDraftChange("exampleUsage", e.target.value)} /></Field>
              <Field label="Usage Notes"><textarea className={textareaStyles} value={stringFromDraft(draft.usageNotes)} onChange={(e) => onDraftChange("usageNotes", e.target.value)} /></Field>
              <Field label="Last Touched"><input className={inputStyles} value={stringFromDraft(draft.lastTouched)} onChange={(e) => onDraftChange("lastTouched", e.target.value)} /></Field>
            </>
          ) : null}
          {keyName === "audiences" || keyName === "audience-intelligence" ? (
            <>
              <Field label="Audience Name"><input className={inputStyles} value={stringFromDraft(draft.audienceName)} onChange={(e) => onDraftChange("audienceName", e.target.value)} /></Field>
              <Field label="Source"><input className={inputStyles} value={stringFromDraft(draft.source)} onChange={(e) => onDraftChange("source", e.target.value)} /></Field>
              <Field label="Status"><select className={inputStyles} value={stringFromDraft(draft.status)} onChange={(e) => onDraftChange("status", e.target.value)}>{["active", "demo", "manual", "needs_review"].map((option) => <option key={option} value={option}>{formatLabel(option)}</option>)}</select></Field>
              <Field label="Estimated Size"><input className={inputStyles} value={stringFromDraft(draft.estimatedSize)} onChange={(e) => onDraftChange("estimatedSize", e.target.value)} /></Field>
              <Field label="Allowed Offers"><input className={inputStyles} value={stringFromDraft(draft.allowedOffers)} onChange={(e) => onDraftChange("allowedOffers", e.target.value)} /></Field>
              <Field label="Exclusions"><textarea className={textareaStyles} value={stringFromDraft(draft.exclusions)} onChange={(e) => onDraftChange("exclusions", e.target.value)} /></Field>
              <Field label="Last Used"><input className={inputStyles} value={stringFromDraft(draft.lastUsed)} onChange={(e) => onDraftChange("lastUsed", e.target.value)} /></Field>
              <Field label="Performance"><input className={inputStyles} value={stringFromDraft(draft.performance)} onChange={(e) => onDraftChange("performance", e.target.value)} /></Field>
              <Field label="Description"><textarea className={textareaStyles} value={stringFromDraft(draft.description)} onChange={(e) => onDraftChange("description", e.target.value)} /></Field>
              <Field label="Usage Notes"><textarea className={textareaStyles} value={stringFromDraft(draft.usageNotes)} onChange={(e) => onDraftChange("usageNotes", e.target.value)} /></Field>
              <Field label="Last Touched"><input className={inputStyles} value={stringFromDraft(draft.lastTouched)} onChange={(e) => onDraftChange("lastTouched", e.target.value)} /></Field>
            </>
          ) : null}
          {keyName === "compliance" ? (
            <>
              <Field label="Rule"><input className={inputStyles} value={stringFromDraft(draft.rule)} onChange={(e) => onDraftChange("rule", e.target.value)} /></Field>
              <Field label="Severity / Type"><select className={inputStyles} value={stringFromDraft(draft.severity)} onChange={(e) => onDraftChange("severity", e.target.value)}>{["Blocking", "Warning", "Guidance"].map((option) => <option key={option} value={option}>{option}</option>)}</select></Field>
              <Field label="Claim Type"><input className={inputStyles} value={stringFromDraft(draft.claimType)} onChange={(e) => onDraftChange("claimType", e.target.value)} /></Field>
              <Field label="Status"><select className={inputStyles} value={stringFromDraft(draft.status)} onChange={(e) => onDraftChange("status", e.target.value)}>{["blocking", "warning", "guidance", "inactive"].map((option) => <option key={option} value={option}>{formatLabel(option)}</option>)}</select></Field>
              <Field label="Channels"><input className={inputStyles} value={stringFromDraft(draft.channels)} onChange={(e) => onDraftChange("channels", e.target.value)} /></Field>
              <Field label="Owner"><input className={inputStyles} value={stringFromDraft(draft.owner)} onChange={(e) => onDraftChange("owner", e.target.value)} /></Field>
              <Field label="Examples"><textarea className={textareaStyles} value={stringFromDraft(draft.examples)} onChange={(e) => onDraftChange("examples", e.target.value)} /></Field>
              <Field label="Summary"><textarea className={textareaStyles} value={stringFromDraft(draft.summary)} onChange={(e) => onDraftChange("summary", e.target.value)} /></Field>
              <Field label="Usage Notes"><textarea className={textareaStyles} value={stringFromDraft(draft.usageNotes)} onChange={(e) => onDraftChange("usageNotes", e.target.value)} /></Field>
              <Field label="Last Touched"><input className={inputStyles} value={stringFromDraft(draft.lastTouched)} onChange={(e) => onDraftChange("lastTouched", e.target.value)} /></Field>
            </>
          ) : null}
          {isStructuredBucketPage(keyName) ? (
            <>
              <Field label="Title / name"><input className={inputStyles} value={stringFromDraft(draft.recordTitle)} onChange={(e) => onDraftChange("recordTitle", e.target.value)} /></Field>
              <Field label="Record type (Convex)"><input className={inputStyles} value={stringFromDraft(draft.recordType)} onChange={(e) => onDraftChange("recordType", e.target.value)} /></Field>
              <Field label="Status">
                <select className={inputStyles} value={stringFromDraft(draft.recordStatus)} onChange={(e) => onDraftChange("recordStatus", e.target.value)}>
                  {["draft", "active", "approved", "needs_review", "archived", "rejected", "candidate", "imported", "sync_pending"].map((option) => (
                    <option key={option} value={option}>{formatLabel(option)}</option>
                  ))}
                </select>
              </Field>
              <Field label="Summary"><textarea className={textareaStyles} value={stringFromDraft(draft.recordSummary)} onChange={(e) => onDraftChange("recordSummary", e.target.value)} /></Field>
              <Field label="Tags (comma-separated)"><input className={inputStyles} value={stringFromDraft(draft.tagsComma)} onChange={(e) => onDraftChange("tagsComma", e.target.value)} /></Field>
              <Field label="Source system"><input className={inputStyles} value={stringFromDraft(draft.sourceSystem)} onChange={(e) => onDraftChange("sourceSystem", e.target.value)} /></Field>
              <Field label="Source URI"><input className={inputStyles} value={stringFromDraft(draft.sourceUri)} onChange={(e) => onDraftChange("sourceUri", e.target.value)} /></Field>
              <Field label="Usage rights">
                <select className={inputStyles} value={stringFromDraft(draft.usageRights)} onChange={(e) => onDraftChange("usageRights", e.target.value)}>
                  {["sage_owned", "internal_only", "inspiration_only", "public_reference", "unknown", "needs_review"].map((option) => (
                    <option key={option} value={option}>{formatLabel(option)}</option>
                  ))}
                </select>
              </Field>
              <Field label="Platform"><input className={inputStyles} value={stringFromDraft(draft.platform)} onChange={(e) => onDraftChange("platform", e.target.value)} /></Field>
              <Field label="Linked campaign IDs (comma-separated)"><input className={inputStyles} value={stringFromDraft(draft.linkedCampaigns)} onChange={(e) => onDraftChange("linkedCampaigns", e.target.value)} /></Field>
              <Field label="Full content / body"><textarea className={textareaStyles} value={stringFromDraft(draft.fullContent)} onChange={(e) => onDraftChange("fullContent", e.target.value)} /></Field>
              <Field label="Last touched"><input className={inputStyles} value={stringFromDraft(draft.lastTouched)} onChange={(e) => onDraftChange("lastTouched", e.target.value)} /></Field>
            </>
          ) : null}
          {keyName === "learning" || keyName === "campaign-learnings" ? (
            <>
              <Field label="Insight"><input className={inputStyles} value={stringFromDraft(draft.insight)} onChange={(e) => onDraftChange("insight", e.target.value)} /></Field>
              <Field label="Source"><select className={inputStyles} value={stringFromDraft(draft.source)} onChange={(e) => onDraftChange("source", e.target.value)}>{["bari_edit", "blue_decision", "campaign_performance", "performance_intelligence", "helpdesk_reply", "agent_evaluation"].map((option) => <option key={option} value={option}>{formatLabel(option)}</option>)}</select></Field>
              <Field label="Confidence"><input className={inputStyles} min={0} max={100} type="number" value={numberFromDraft(draft.confidence)} onChange={(e) => onDraftChange("confidence", Number(e.target.value) || 0)} /></Field>
              <Field label="Status"><select className={inputStyles} value={stringFromDraft(draft.status)} onChange={(e) => onDraftChange("status", e.target.value)}>{["candidate", "approved", "rejected", "archived"].map((option) => <option key={option} value={option}>{formatLabel(option)}</option>)}</select></Field>
              <Field label="Applies To"><input className={inputStyles} value={stringFromDraft(draft.appliesTo)} onChange={(e) => onDraftChange("appliesTo", e.target.value)} /></Field>
              <Field label="Last Used"><input className={inputStyles} value={stringFromDraft(draft.lastUsed)} onChange={(e) => onDraftChange("lastUsed", e.target.value)} /></Field>
              <Field label="Description"><textarea className={textareaStyles} value={stringFromDraft(draft.description)} onChange={(e) => onDraftChange("description", e.target.value)} /></Field>
              <Field label="Usage Notes"><textarea className={textareaStyles} value={stringFromDraft(draft.usageNotes)} onChange={(e) => onDraftChange("usageNotes", e.target.value)} /></Field>
              <Field label="Last Touched"><input className={inputStyles} value={stringFromDraft(draft.lastTouched)} onChange={(e) => onDraftChange("lastTouched", e.target.value)} /></Field>
            </>
          ) : null}
        </div>
      </ControlPanel>
    );
  }

  if (!record) return null;

  if (record.kind === "learning") {
    const insight = record.source as LearningInsight;
    const payload = learningPayload(insight);
    return (
      <ControlPanel className="p-4">
        {heading}
        {savedMessage ? <div className="mt-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-100">{savedMessage}</div> : null}
        {error ? <div className="mt-4 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-100">{error}</div> : null}
        <div className="mt-4 grid gap-2 text-sm">
          <DetailRow label="Insight" value={insight.title} />
          <DetailRow label="Source" value={formatLabel(insight.source)} />
          <DetailRow label="Confidence" value={`${Math.round(insight.confidence * 100)}%`} />
          <DetailRow label="Status" value={formatLabel(insight.status)} />
          {typeof insight.approvedAt === "number" ? <DetailRow label="Approved at" value={new Date(insight.approvedAt).toLocaleString()} /> : null}
          {insight.approvedBy ? <DetailRow label="Approved by" value={insight.approvedBy} /> : null}
          {typeof insight.rejectedAt === "number" ? <DetailRow label="Rejected at" value={new Date(insight.rejectedAt).toLocaleString()} /> : null}
          {typeof insight.archivedAt === "number" ? <DetailRow label="Archived at" value={new Date(insight.archivedAt).toLocaleString()} /> : null}
          <DetailRow label="Applies to" value={readLearningString(insight, "appliesTo", "founder nurture, reply handling")} />
          <DetailRow label="Can agents use" value={readLearningBoolean(insight, "canAgentsUse", false) ? "Yes" : "No"} />
          <DetailRow label="Requires review" value={readLearningBoolean(insight, "requiresReview", true) ? "Yes" : "No"} />
          <DetailRow label="Evidence / examples" value={readLearningString(insight, "evidence", insight.summary)} />
          <DetailRow label="Last used" value={readLearningString(insight, "lastUsed", "Apr 30")} />
          {typeof payload.notes === "string" ? <DetailRow label="Notes" value={payload.notes} /> : null}
        </div>
      </ControlPanel>
    );
  }

  const item = record.source as LibraryItem;

  if (isStructuredBucketPage(keyName)) {
    return (
      <ControlPanel className="p-4">
        {heading}
        <div className="mt-3 flex flex-wrap gap-2">
          {item.usageRights === "inspiration_only" ? <StatusBadge tone="amber">Inspiration only</StatusBadge> : null}
          {item.bucket ? <StatusBadge tone="blue">{formatLabel(item.bucket)}</StatusBadge> : null}
          {item.sourceSystem ? <StatusBadge tone="gray">{formatLabel(item.sourceSystem)}</StatusBadge> : null}
        </div>
        <div className="mt-4 grid gap-2 text-sm">
          <DetailRow label="Record type" value={formatLabel(item.type)} />
          <DetailRow label="Status" value={formatLabel(item.status)} />
          <DetailRow label="Summary" value={item.summary} />
          <DetailRow label="Tags" value={item.tags.join(", ") || "—"} />
          <DetailRow label="Source system" value={item.sourceSystem ?? "manual"} />
          <DetailRow label="Source URI" value={item.sourceUri ?? "—"} />
          <DetailRow label="Usage rights" value={formatLabel(item.usageRights ?? "sage_owned")} />
          <DetailRow label="Platform" value={readPayloadString(item, "platform", "—")} />
          <DetailRow label="Linked campaigns" value={(item.linkedCampaignIds ?? []).join(", ") || "—"} />
          <DetailRow label="Full content / body" value={readPayloadString(item, "body", "—")} />
          <DetailRow label="Updated" value={formatLibraryUpdated(item)} />
        </div>
        <p className="mt-4 border-t border-slate-800 pt-3 text-xs leading-5 text-slate-500">
          Trusted Copy Intelligence context should prefer approved or active records. Swipe File items marked inspiration-only are not Sage-owned copy. Google Drive and Obsidian sync are planned; metadata fields prepare for future indexing and Markdown export.
        </p>
      </ControlPanel>
    );
  }

  if (keyName === "email") {
    return (
      <ControlPanel className="p-4">
        {heading}
        <div className="mt-4 grid gap-2 text-sm">
          <DetailRow label="Title / subject" value={readPayloadString(item, "subjectTitle", item.name)} />
          <DetailRow label="Source authority rating" value={formatLabel(item.status)} />
          <DetailRow label="Source type" value={readPayloadString(item, "sourceType", "unknown")} />
          <DetailRow label="Allowed for Bari voice retrieval" value={readPayloadBoolean(item, "allowedForBariVoice", true) ? "Yes" : "No"} />
          <DetailRow label="Associated campaign" value={readPayloadString(item, "associatedCampaign", "Unassigned")} />
          <DetailRow label="Excerpt" value={readPayloadString(item, "excerpt", item.summary)} />
          <DetailRow label="Why this source matters" value={readPayloadString(item, "whyItMatters", item.summary)} />
          <DetailRow label="Last touched" value={readPayloadString(item, "lastTouched", "Apr 30")} />
          <DetailRow label="Last used" value={readPayloadString(item, "lastUsed", "Apr 28")} />
        </div>
      </ControlPanel>
    );
  }

  if (keyName === "offers" || keyName === "cta-library") {
    return (
      <ControlPanel className="p-4">
        {heading}
        <div className="mt-4 grid gap-2 text-sm">
          <DetailRow label="Offer / lead magnet" value={item.name} />
          <DetailRow label="Type" value={item.type.replace(/_/g, " ")} />
          <DetailRow label="Status" value={formatLabel(item.status)} />
          <DetailRow label="Approval owner" value={readPayloadString(item, "approvalOwner", item.status === "needs_blue_approval" ? "Blue" : "Operator")} />
          <DetailRow label="Can agents use automatically" value={readPayloadBoolean(item, "canAgentsUseAutomatically", item.status === "active") ? "Yes" : "No"} />
          <DetailRow label="Requires Blue approval" value={readPayloadBoolean(item, "requiresBlueApproval", item.status === "needs_blue_approval") ? "Yes" : "No"} />
          <DetailRow label="Allowed channels" value={readPayloadString(item, "allowedChannels", "email")} />
          <DetailRow label="Allowed audiences" value={readPayloadString(item, "allowedAudiences", "General")} />
          <DetailRow label="Disallowed audiences / exclusions" value={readPayloadString(item, "disallowedAudiences", "Current clients")} />
          <DetailRow label="Approved claims" value={readPayloadString(item, "approvedClaims", "Approved library claims only")} />
          <DetailRow label="Banned claims" value={readPayloadString(item, "bannedClaims", "Guaranteed transformation")} />
          <DetailRow label="Default CTA" value={readPayloadString(item, "defaultCta", "Book your next step")} />
          <DetailRow label="Last used" value={readPayloadString(item, "lastUsed", "Apr 30")} />
          <DetailRow label="Performance signal" value={readPayloadString(item, "performanceSignal", "stable")} />
        </div>
      </ControlPanel>
    );
  }

  if (keyName === "voice-rules" || keyName === "voice-style") {
    const isSageRule = item.id === "rule_sage_caps";
    return (
      <ControlPanel className="p-4">
        {heading}
        <div className="mt-4 grid gap-2 text-sm">
          <DetailRow label="Rule name" value={item.name} />
          <DetailRow label="Severity" value={readPayloadString(item, "severityLabel", item.status === "blocking" ? "Blocking" : formatLabel(item.status))} />
          <DetailRow label="Rule type / category" value={readPayloadString(item, "ruleCategory", "Terminology")} />
          <DetailRow label="Applies to" value={readPayloadStringArray(item, "appliesToSurfaces", ["email", "ads", "landing pages", "replies"]).join(", ")} />
          <DetailRow label="Enforcement" value={readPayloadString(item, "enforcement", "Blocks final approval")} />
          <DetailRow label="Agent behavior" value={readPayloadString(item, "agentBehavior", "Brand Rules Checker flags; Bari Voice Agent follows")} />
          <DetailRow label="Example violation" value={readPayloadString(item, "exampleViolation", isSageRule ? "Sage" : "Generic corporate phrasing")} />
          <DetailRow label="Approved alternative" value={readPayloadString(item, "approvedAlternative", isSageRule ? "SAGE" : "Direct encouragement")} />
          <DetailRow label="Last touched" value={readPayloadString(item, "lastTouched", "Apr 30")} />
          <DetailRow label="Active status" value={readPayloadString(item, "lifecycleStatus", "Active")} />
        </div>
      </ControlPanel>
    );
  }

  if (keyName === "signoffs") {
    const variants = readPayloadStringArray(item, "approvedVariants", ["You can do this — Bari", "You can do this,\nBari"]);
    return (
      <ControlPanel className="p-4">
        {heading}
        <div className="mt-4 grid gap-2 text-sm">
          <DetailRow label="Sign-off family / name" value={readPayloadString(item, "familyName", item.name)} />
          <div className="rounded-lg border border-slate-800 bg-slate-950/70 px-3 py-2 text-sm text-slate-300">
            <p className="font-semibold text-slate-200">Approved variants</p>
            <ul className="mt-2 list-disc space-y-1 pl-4">
              {variants.map((variant) => (
                <li key={variant}>{variant}</li>
              ))}
            </ul>
          </div>
          <DetailRow label="Allowed contexts" value={readPayloadString(item, "allowedContexts", "founder nurture")} />
          <DetailRow label="Avoid contexts" value={readPayloadString(item, "avoidContexts", "Hard sales closes")} />
          <DetailRow label="Can agent choose automatically" value={readPayloadBoolean(item, "agentAutoChoose", true) ? "Yes" : "No"} />
          <DetailRow label="Requires Bari review" value={readPayloadBoolean(item, "requiresBariReview", true) ? "Yes" : "No"} />
          <DetailRow label="Example usage" value={readPayloadString(item, "exampleUsage", item.summary)} />
          <DetailRow label="Notes" value={readPayloadString(item, "notes", "Keep variants short and human.")} />
          <DetailRow label="Last touched" value={readPayloadString(item, "lastTouched", "Apr 30")} />
        </div>
      </ControlPanel>
    );
  }

  if (keyName === "audiences" || keyName === "audience-intelligence") {
    return (
      <ControlPanel className="p-4">
        {heading}
        <div className="mt-4 grid gap-2 text-sm">
          <DetailRow label="Audience name" value={item.name} />
          <DetailRow label="Source type" value={readPayloadString(item, "sourceType", "Keap tag")} />
          <DetailRow label="Keap tag mapping" value={readPayloadString(item, "keapTag", "TAG_REACTIVATION_DORMANT")} />
          <DetailRow label="Estimated size" value={readPayloadString(item, "estimatedSize", "—")} />
          <DetailRow label="Status" value={formatLabel(item.status)} />
          <DetailRow label="Exclusions" value={readPayloadString(item, "exclusions", "—")} />
          <DetailRow label="Allowed offers" value={readPayloadString(item, "allowedOffers", "—")} />
          <DetailRow label="Disallowed offers" value={readPayloadString(item, "disallowedOffers", "—")} />
          <DetailRow label="Recommended use" value={readPayloadString(item, "recommendedUse", item.summary)} />
          <DetailRow label="Risk notes" value={readPayloadString(item, "riskNotes", "Validate mapping before send.")} />
          <DetailRow label="Last used" value={readPayloadString(item, "lastUsed", "Apr 30")} />
          <DetailRow label="Performance notes" value={readPayloadString(item, "performanceNotes", "warming")} />
        </div>
      </ControlPanel>
    );
  }

  if (keyName === "compliance") {
    const isNoGuarantee = item.id === "comp_no_guarantee";
    return (
      <ControlPanel className="p-4">
        {heading}
        <div className="mt-4 grid gap-2 text-sm">
          <DetailRow label="Rule name" value={item.name} />
          <DetailRow label="Severity" value={readPayloadString(item, "severityLabel", "Blocking")} />
          <DetailRow label="Claim type" value={readPayloadString(item, "claimType", "Claims")} />
          <DetailRow label="Applies to channels" value={readPayloadString(item, "channels", "email, landing page")} />
          <DetailRow label="Owner" value={readPayloadString(item, "owner", "Blue / Compliance")} />
          <DetailRow
            label="Banned pattern / blocked claim"
            value={readPayloadString(item, "bannedPattern", isNoGuarantee ? "Promises of guaranteed results or personal transformation" : "Unsupported guarantee language")}
          />
          <DetailRow label="Allowed alternative wording" value={readPayloadString(item, "allowedAlternative", "Outcome-focused, non-guaranteed language")} />
          <DetailRow
            label="Approval consequence"
            value={readPayloadString(item, "approvalConsequence", isNoGuarantee ? "Blocks or escalates campaign for Blue review" : "Warning surfaced to Compliance Guard")}
          />
          <DetailRow label="Agent enforcement" value={readPayloadString(item, "agentEnforcement", "Compliance Guard flags; Approval Router escalates")} />
          <DetailRow label="Examples" value={readPayloadString(item, "examples", item.summary)} />
          <DetailRow label="Last touched" value={readPayloadString(item, "lastTouched", "Apr 30")} />
        </div>
      </ControlPanel>
    );
  }

  return (
    <ControlPanel className="p-4">
      {heading}
      <p className="mt-4 text-sm text-slate-300">{item.summary}</p>
    </ControlPanel>
  );
}

function LibraryInventoryPage({ libraryKey }: { libraryKey: LibraryPageKey }) {
  const key = libraryKey;
  const config = libraryPageConfig[key] ?? libraryPageConfig.offers;
  const [activeFilter, setActiveFilter] = useState(config.filters[0] ?? "All");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState<Record<string, string>>({});
  const [editorMode, setEditorMode] = useState<EditorMode>("view");
  const [draft, setDraft] = useState<EditorDraft>(() => createEmptyDraft(key));
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [demoNotice, setDemoNotice] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [librarySeedAttempted, setLibrarySeedAttempted] = useState(false);
  const [learningSeedAttempted, setLearningSeedAttempted] = useState(false);
  const convexLibraryItems = useQuery(api.library.listLibraryItems);
  const convexLearningInsights = useQuery(api.library.listLearningInsights);
  const seedDefaultLibraryItemsIfEmpty = useMutation(api.library.seedDefaultLibraryItemsIfEmpty);
  const seedDefaultLearningInsightsIfEmpty = useMutation(api.library.seedDefaultLearningInsightsIfEmpty);
  const upsertLibraryItem = useMutation(api.library.upsertLibraryItem);
  const upsertLearningInsight = useMutation(api.library.upsertLearningInsight);
  const updateLearningInsightStatus = useMutation(api.library.updateLearningInsightStatus);
  const appUser = useAppUser();

  useEffect(() => {
    if (key === "learning" || convexLibraryItems === undefined || convexLibraryItems.length > 0 || librarySeedAttempted) return;
    setLibrarySeedAttempted(true);
    void seedDefaultLibraryItemsIfEmpty().catch(() => {
      setLoadError("Unable to load library records.");
      setLibrarySeedAttempted(false);
    });
  }, [convexLibraryItems, key, librarySeedAttempted, seedDefaultLibraryItemsIfEmpty]);

  useEffect(() => {
    if ((key !== "learning" && key !== "campaign-learnings") || convexLearningInsights === undefined || convexLearningInsights.length > 0 || learningSeedAttempted) return;
    setLearningSeedAttempted(true);
    void seedDefaultLearningInsightsIfEmpty().catch(() => {
      setLoadError("Unable to load library records.");
      setLearningSeedAttempted(false);
    });
  }, [convexLearningInsights, key, learningSeedAttempted, seedDefaultLearningInsightsIfEmpty]);

  const libraryRecords = useMemo(
    () => (convexLibraryItems ?? []).map((record) => toLibraryItem(record as Parameters<typeof toLibraryItem>[0])),
    [convexLibraryItems],
  );
  const learningRecords = useMemo(
    () => (convexLearningInsights ?? []).map((record) => toLearningInsight(record as Parameters<typeof toLearningInsight>[0])),
    [convexLearningInsights],
  );

  const allRows = useMemo(() => rowsFor(key, libraryRecords, learningRecords), [key, libraryRecords, learningRecords]);
  const advancedFilterDefinitions = useMemo(() => advancedFilterDefinitionsFor(key), [key]);
  const filteredRows = useMemo(
    () =>
      allRows.filter(
        (row) =>
          rowMatchesFilter(key, row, activeFilter)
          && recordMatchesSearch(row, searchText)
          && recordMatchesAdvancedFilters(row, advancedFilterDefinitions, advancedFilters),
      ),
    [activeFilter, advancedFilterDefinitions, advancedFilters, allRows, key, searchText],
  );
  const resolvedSelectedId = useMemo(() => {
    if (!filteredRows.length) return null;
    if (selectedId && filteredRows.some((row) => row.id === selectedId)) return selectedId;
    return filteredRows[0].id;
  }, [filteredRows, selectedId]);
  const selectedRecord = filteredRows.find((row) => row.id === resolvedSelectedId);
  const hasSearchOrAdvancedFilters = searchText.trim().length > 0 || Object.values(advancedFilters).some(Boolean);

  useEffect(() => {
    setActiveFilter(config.filters[0] ?? "All");
    setSelectedId(null);
    setSearchOpen(false);
    setSearchText("");
    setFilterOpen(false);
    setAdvancedFilters({});
    setEditorMode("view");
    setDraft(createEmptyDraft(key));
    setSaveError(null);
    setSavedMessage(null);
    setDemoNotice(null);
  }, [config.filters, key]);

  useEffect(() => {
    if (editorMode === "create") return;
    setDraft(draftFromRecord(key, selectedRecord));
  }, [editorMode, key, selectedRecord]);

  useEffect(() => {
    if (!savedMessage) return;
    const timeout = window.setTimeout(() => setSavedMessage(null), 2500);
    return () => window.clearTimeout(timeout);
  }, [savedMessage]);

  const startCreate = () => {
    setEditorMode("create");
    setDraft(createEmptyDraft(key));
    setSaveError(null);
    setSavedMessage(null);
    setDemoNotice(null);
    setActiveFilter("All");
  };

  const startEdit = () => {
    if (!selectedRecord) return;
    setEditorMode("edit");
    setDraft(draftFromRecord(key, selectedRecord));
    setSaveError(null);
    setSavedMessage(null);
  };

  const cancelEditing = () => {
    setEditorMode("view");
    setDraft(draftFromRecord(key, selectedRecord));
    setSaveError(null);
  };

  const handleDraftChange = (field: string, value: string | number | boolean) => {
    setDraft((current) => ({ ...current, [field]: value }));
  };

  const clearSearchAndAdvancedFilters = () => {
    setSearchText("");
    setSearchOpen(false);
    setAdvancedFilters({});
    setFilterOpen(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveError(null);
    setSavedMessage(null);

    try {
      const recordId = editorMode === "create" ? createRecordId(key) : selectedRecord?.id;
      if (!recordId) {
        setSaveError("Unable to save record. Check Convex connection.");
        setIsSaving(false);
        return;
      }

      if (key === "learning" || key === "campaign-learnings") {
        await upsertLearningInsight({
          recordId,
          patch: patchForLearningSave(draft, selectedRecord),
        });
      } else {
        await upsertLibraryItem({
          recordId,
          patch: patchForLibrarySave(key, draft, selectedRecord),
        });
      }

      setSelectedId(recordId);
      setEditorMode("view");
      setSavedMessage(editorMode === "create" ? "Record created." : "Saved.");
      setDemoNotice(null);
    } catch {
      setSaveError("Unable to save record. Check Convex connection.");
    } finally {
      setIsSaving(false);
    }
  };

  const isLearningBucket = key === "learning" || key === "campaign-learnings";

  const applyLearningStatus = async (status: "approved" | "rejected" | "archived") => {
    if (!selectedRecord?.id || selectedRecord.kind !== "learning") return;
    setSaveError(null);
    setDemoNotice(null);
    try {
      const result = await updateLearningInsightStatus({
        recordId: selectedRecord.id,
        status,
        actor: appUser.displayName,
      });
      if (result.success) {
        setSavedMessage(status === "approved" ? "Insight approved." : status === "rejected" ? "Insight rejected." : "Insight archived.");
      } else {
        setSaveError("Learning record not found.");
      }
    } catch {
      setSaveError("Could not update learning status.");
    }
  };

  return (
    <div className="space-y-5">
      <SectionHeader
        eyebrow="Content Library"
        title={config.title}
        description={config.summary}
        actions={
          <>
            <button className="focus-ring" onClick={startCreate} type="button">
              <Button>
                <BookOpen className="mr-2 h-4 w-4" />
                Add record
              </Button>
            </button>
            <button className="focus-ring" onClick={() => setFilterOpen((current) => !current)} type="button">
              <Button variant="secondary">
                <Filter className="mr-2 h-4 w-4" />
                Filter
              </Button>
            </button>
            <button className="focus-ring" onClick={() => setSearchOpen((current) => !current)} type="button">
              <Button variant="secondary">
                <Search className="mr-2 h-4 w-4" />
                Search
              </Button>
            </button>
            {hasSearchOrAdvancedFilters ? (
              <button className="focus-ring" onClick={clearSearchAndAdvancedFilters} type="button">
                <Button variant="secondary">Clear</Button>
              </button>
            ) : null}
          </>
        }
      />

      <ControlPanel className="p-4">
        <div className="flex flex-wrap items-start gap-3">
          <BookOpen className="mt-0.5 h-5 w-5 shrink-0 text-sky-300" />
          <div className="min-w-0 flex-1 space-y-3">
            <div>
              <p className="text-sm font-semibold text-slate-100">Marketing knowledge store</p>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                The Content Library is the reusable knowledge base for campaign creation. It holds approved copy, swipe examples, voice rules, offers, audience notes, compliance guidance, platform playbooks, and learnings that future AI agents and campaign builders can use — operators curate what is authoritative; nothing here auto-syncs or auto-retrieves until integrations are explicitly connected.
              </p>
            </div>
            <p className="border-t border-slate-800 pt-3 text-xs leading-5 text-slate-500">
              Future library sync (planned, not live): index content from Google Drive and export selected records as Obsidian-ready Markdown so this library can sit inside Sage&apos;s broader company knowledge graph. No Drive, Obsidian, or file indexing in this build.
            </p>
          </div>
        </div>
      </ControlPanel>

      <ControlPanel className="p-4">
        <p className="text-sm font-semibold text-slate-100">All buckets & sync</p>
        <p className="mt-2 text-sm text-slate-300">
          Open the <Link className="text-sky-300 underline hover:text-sky-200" href="/libraries">Content Library hub</Link> for Copy Archive, Swipe File, Voice &amp; Style, Audience Intelligence, Offers/CTAs, Platform Playbooks, Campaign Learnings, Source Imports, and Knowledge Sync — with record counts when Convex is connected.
        </p>
      </ControlPanel>

      {loadError ? (
        <ControlPanel className="border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-100">{loadError}</ControlPanel>
      ) : null}

      {demoNotice ? (
        <ControlPanel className="border-sky-500/30 bg-sky-500/10 p-3 text-sm text-sky-100">{demoNotice}</ControlPanel>
      ) : null}

      {searchOpen ? (
        <ControlPanel className="p-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[240px] flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                className="focus-ring w-full rounded-lg border border-slate-700 bg-slate-950/80 py-2 pl-9 pr-10 text-sm text-slate-100 placeholder:text-slate-500"
                onChange={(event) => setSearchText(event.target.value)}
                placeholder="Search this library…"
                value={searchText}
              />
              {searchText ? (
                <button
                  className="focus-ring absolute right-2 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-slate-400 hover:bg-slate-800 hover:text-slate-100"
                  onClick={() => setSearchText("")}
                  type="button"
                >
                  <X className="h-4 w-4" />
                </button>
              ) : null}
            </div>
          </div>
        </ControlPanel>
      ) : null}

      {filterOpen ? (
        <ControlPanel className="p-3">
          <div className="grid gap-3 md:grid-cols-2">
            {advancedFilterDefinitions.map((definition) => {
              const options = uniqueAdvancedFilterOptions(allRows, definition);
              return (
                <Field key={definition.key} label={definition.label}>
                  <select
                    className={inputStyles}
                    onChange={(event) => setAdvancedFilters((current) => ({ ...current, [definition.key]: event.target.value }))}
                    value={advancedFilters[definition.key] ?? ""}
                  >
                    <option value="">All</option>
                    {options.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </Field>
              );
            })}
          </div>
        </ControlPanel>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {config.filters.map((filter) => {
          const isActive = filter === activeFilter;
          const count = filterCountFor(key, filter, allRows);
          const dotTone = key === "email" ? null : filterChipDotTone(key, filter);
          return (
            <button
              className={cn(
                "focus-ring inline-flex items-center gap-2 rounded-md border px-2.5 py-1 text-[0.68rem] font-bold uppercase tracking-[0.16em] transition",
                key === "email" && filter !== "All"
                  ? cn(
                      sourceRatingStyles(filter).badge,
                      isActive ? "ring-1 ring-sky-400/40" : "opacity-90 hover:opacity-100",
                    )
                  : isActive
                    ? "border-sky-400/60 bg-sky-500/15 text-sky-100"
                    : "border-slate-700 bg-slate-950/70 text-slate-200 hover:border-slate-600",
              )}
              key={filter}
              onClick={() => setActiveFilter(filter)}
              type="button"
            >
              {key === "email" && filter !== "All" ? (
                <span className={cn("h-2.5 w-2.5 rounded-full", sourceRatingStyles(filter).dot)} />
              ) : key === "email" ? (
                <StatusDot tone={isActive ? "blue" : "gray"} />
              ) : (
                <StatusDot tone={dotTone ?? "gray"} />
              )}
              {filter}
              <span
                className={cn(
                  "rounded px-1.5 py-0.5 text-[0.62rem] font-bold leading-none",
                  key === "email" && filter !== "All"
                    ? sourceRatingStyles(filter).badge
                    : filter === "All"
                      ? isActive
                        ? "bg-sky-500/25 text-sky-100"
                        : "bg-slate-800 text-slate-300"
                      : isActive
                        ? "bg-sky-500/20 text-sky-100"
                        : "bg-slate-800 text-slate-300",
                )}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {isLearningBucket ? (
        <ControlPanel className="p-4">
          <div className="flex items-start gap-3">
            <Sparkles className="mt-0.5 h-4 w-4 text-violet-300" />
            <p className="text-sm leading-6 text-slate-300">
              Learning candidates from edits, campaign performance, replies, and tests stay reviewable before they graduate into approved, reusable guidance — human gatekeeping; no automatic promotion.
            </p>
          </div>
        </ControlPanel>
      ) : null}

      {key === "voice-rules" ? (
        <ControlPanel className="border-red-500/30 bg-red-500/8 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 text-red-300" />
            <div>
              <p className="text-sm font-semibold text-red-100">Blocking rule</p>
              <p className="mt-1 text-sm leading-6 text-red-100">Always capitalize SAGE. Do not write Sage. SAGE capitalization errors block final approval.</p>
            </div>
          </div>
        </ControlPanel>
      ) : null}

      <section className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
        <ConsoleTable>
          <TableHead>
            <tr>
              {config.columns.map((column) => (
                <Th key={column}>{column}</Th>
              ))}
            </tr>
          </TableHead>
          <tbody>
            {(isLearningBucket ? convexLearningInsights === undefined : convexLibraryItems === undefined) ? (
              <tr>
                <td className="px-4 py-6 text-sm text-slate-300" colSpan={config.columns.length}>Loading library records…</td>
              </tr>
            ) : !filteredRows.length ? (
              <tr>
                <td className="px-4 py-6 text-sm text-slate-300" colSpan={config.columns.length}>
                  {hasSearchOrAdvancedFilters ? "No records match this search." : "No curated records in this bucket yet. Add approved source material so operators and future agents can reuse it."}
                </td>
              </tr>
            ) : filteredRows.map((row) => {
              const isSelected = row.id === resolvedSelectedId;
              return (
                <tr className={cn("cursor-pointer", isSelected ? "bg-slate-900/85" : "")} key={row.id} onClick={() => setSelectedId(row.id)}>
                  {row.cells.map((cell, index) => {
                    const column = config.columns[index] ?? "";
                    const isStatusColumn = column === "Status";
                    const isSeverityColumn = column === "Severity";
                    const isRatingColumn = column === "Rating";
                    const isActionColumn = column === "Action" || column === "Open";
                    if (isStatusColumn) {
                      return (
                        <Td key={`${row.id}-${config.columns[index]}`}>
                          <StatusBadge tone={toneForStatus(row.status)}>{cell}</StatusBadge>
                        </Td>
                      );
                    }
                    if (isSeverityColumn) {
                      return (
                        <Td key={`${row.id}-${column}`}>
                          <StatusBadge tone={toneForSeverityCell(cell)}>{cell}</StatusBadge>
                        </Td>
                      );
                    }
                    if (isRatingColumn) {
                      return (
                        <Td key={`${row.id}-${column}`}>
                          {key === "email" ? <SourceRatingBadge value={cell} /> : <StatusBadge tone={toneForRatingCell(cell)}>{cell}</StatusBadge>}
                        </Td>
                      );
                    }
                    if (isActionColumn) {
                      return (
                        <Td key={`${row.id}-action`}>
                          <button
                            className="focus-ring rounded"
                            onClick={(event) => {
                              event.stopPropagation();
                              setSelectedId(row.id);
                              setEditorMode("view");
                              setSaveError(null);
                              setSavedMessage(null);
                            }}
                            type="button"
                          >
                            <InlineAction>{cell}</InlineAction>
                          </button>
                        </Td>
                      );
                    }
                    return <Td key={`${row.id}-${index}`}>{cell}</Td>;
                  })}
                </tr>
              );
            })}
          </tbody>
        </ConsoleTable>

        <div className="space-y-4">
          <SelectedRecordPanel
            keyName={key}
            record={editorMode === "create" ? undefined : selectedRecord}
            mode={editorMode}
            draft={draft}
            saving={isSaving}
            error={saveError}
            savedMessage={savedMessage}
            onEdit={startEdit}
            onSave={() => {
              void handleSave();
            }}
            onCancel={cancelEditing}
            onDraftChange={handleDraftChange}
          />
          {!isLearningBucket && editorMode !== "create" && selectedRecord?.kind === "library" ? (
            <LibrarySyncKnowledgePanel item={selectedRecord.source as LibraryItem} libraryRecordId={selectedRecord.id} />
          ) : null}
          {isLearningBucket ? (
            <ControlPanel className="p-4">
              <p className="text-sm font-semibold text-slate-100">Learning actions</p>
              <p className="mt-2 text-xs leading-5 text-slate-500">
                Candidates are not trusted for automatic agent context until approved. Changes persist to Convex with reviewer attribution when available.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  className="focus-ring rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-100 disabled:opacity-40"
                  disabled={selectedRecord?.status !== "candidate"}
                  onClick={() => void applyLearningStatus("approved")}
                  type="button"
                >
                  Approve insight
                </button>
                <button
                  className="focus-ring rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs font-semibold text-rose-100 disabled:opacity-40"
                  disabled={selectedRecord?.status !== "candidate"}
                  onClick={() => void applyLearningStatus("rejected")}
                  type="button"
                >
                  Reject insight
                </button>
                <button
                  className="focus-ring rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-200 disabled:opacity-40"
                  disabled={!selectedRecord || selectedRecord.status === "archived"}
                  onClick={() => void applyLearningStatus("archived")}
                  type="button"
                >
                  Archive
                </button>
              </div>
            </ControlPanel>
          ) : null}
        </div>
      </section>
    </div>
  );
}

function LibrarySyncKnowledgePanel({ libraryRecordId, item }: { libraryRecordId: string; item: LibraryItem }) {
  const appUser = useAppUser();
  const exportRows = useQuery(api.obsidianExport.listExportRecords, { libraryRecordId, limit: 5 });
  const generatePreview = useMutation(api.obsidianExport.generateExportPreview);
  const markExportReady = useMutation(api.obsidianExport.markExportReady);
  const markExportedManually = useMutation(api.obsidianExport.markExportedManually);
  const markIgnored = useMutation(api.obsidianExport.markIgnored);
  const markStale = useMutation(api.obsidianExport.markStale);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const latest = exportRows?.[0] as { markdownBody?: string; obsidianPath?: string; exportId?: string; status?: string } | undefined;
  const markdownPreview = typeof latest?.markdownBody === "string" ? latest.markdownBody : "";

  const exportWarnings = useMemo(() => {
    const w: string[] = [];
    if (["candidate", "draft", "needs_review"].includes(item.status)) w.push("This record is still in review — treat any Obsidian note as non-authoritative until approved.");
    if (item.usageRights === "inspiration_only" || item.bucket === "swipe_file") {
      w.push("Inspiration-only content — do not present as Sage-owned copy in the knowledge graph.");
    }
    if (["rejected", "archived"].includes(item.status)) w.push("Rejected or archived — usually not suitable as export-ready.");
    if (item.obsidianSyncStatus === "stale") w.push("Marked stale — regenerate preview after edits.");
    return w;
  }, [item.bucket, item.obsidianSyncStatus, item.status, item.usageRights]);

  const run = async (label: string, fn: () => Promise<unknown>) => {
    setBusy(label);
    setActionError(null);
    try {
      await fn();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Action failed.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <ControlPanel className="p-4">
      <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-slate-400">Sync &amp; Knowledge Graph</p>
      <p className="mt-2 text-sm font-semibold text-slate-100">Google Drive, Obsidian, and Library Sync</p>
      <p className="mt-2 text-xs leading-5 text-slate-500">
        Preview-only Markdown for Obsidian — no vault or Drive writes from Outreach Console. Copy notes manually when satisfied.
      </p>

      <div className="mt-4 grid gap-2 text-sm">
        <DetailRow label="Source system" value={item.sourceSystem ?? "—"} />
        <DetailRow label="Source URI" value={item.sourceUri ?? "—"} />
        <DetailRow label="Google Drive file ID" value={item.driveFileId ?? "—"} />
        <DetailRow label="Google Drive path" value={item.drivePath ?? "—"} />
        <DetailRow label="Drive sync status" value={getDriveSyncStatusLabel(item.driveSyncStatus)} />
        <DetailRow label="Obsidian path" value={item.obsidianPath ?? "—"} />
        <DetailRow label="Obsidian export status" value={getObsidianExportStatusLabel(item.obsidianSyncStatus)} />
        <DetailRow label="Last indexed" value={item.lastIndexedAt ? new Date(item.lastIndexedAt).toLocaleString() : "—"} />
        <DetailRow label="Last exported" value={item.obsidianLastExportedAt ? new Date(item.obsidianLastExportedAt).toLocaleString() : item.lastExportedAt ? new Date(item.lastExportedAt).toLocaleString() : "—"} />
        <DetailRow label="Content hash" value={item.contentHash ?? "—"} />
        <DetailRow label="General sync status" value={getGeneralSyncStatusLabel(item.syncStatus)} />
        <DetailRow label="Sync notes" value={item.syncNotes ?? item.obsidianSyncNotes ?? item.driveSyncNotes ?? "—"} />
      </div>

      {exportWarnings.length ? (
        <div className="mt-4 rounded-lg border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
          <p className="font-semibold text-amber-50">Export readiness</p>
          <ul className="mt-2 list-disc space-y-1 pl-4">
            {exportWarnings.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {actionError ? <div className="mt-3 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-100">{actionError}</div> : null}

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          className="focus-ring rounded-lg border border-sky-500/50 bg-sky-500/15 px-3 py-2 text-xs font-semibold text-sky-100 hover:bg-sky-500/25 disabled:opacity-40"
          disabled={!!busy}
          onClick={() =>
            void run("preview", () =>
              generatePreview({ libraryRecordId, createdBy: appUser.displayName || appUser.email || "operator" }),
            )
          }
          type="button"
        >
          {busy === "preview" ? "Generating…" : "Generate Obsidian Preview"}
        </button>
        <button
          className="focus-ring rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-800 disabled:opacity-40"
          disabled={!!busy || !markdownPreview}
          onClick={() =>
            void run("copy", async () => {
              await navigator.clipboard.writeText(markdownPreview);
            })
          }
          type="button"
        >
          <span className="inline-flex items-center gap-1.5">
            <Copy className="h-3.5 w-3.5" />
            Copy Markdown
          </span>
        </button>
        <button
          className="focus-ring rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-100 hover:bg-emerald-500/20 disabled:opacity-40"
          disabled={!!busy}
          onClick={() => void run("ready", () => markExportReady({ libraryRecordId, exportId: latest?.exportId }))}
          type="button"
        >
          Mark Export Ready
        </button>
        <button
          className="focus-ring rounded-lg border border-violet-500/40 bg-violet-500/10 px-3 py-2 text-xs font-semibold text-violet-100 hover:bg-violet-500/20 disabled:opacity-40"
          disabled={!!busy}
          onClick={() => void run("exported", () => markExportedManually({ libraryRecordId, exportId: latest?.exportId }))}
          type="button"
        >
          Mark Exported Manually
        </button>
        <button
          className="focus-ring rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200 disabled:opacity-40"
          disabled={!!busy}
          onClick={() => void run("ignored", () => markIgnored({ libraryRecordId }))}
          type="button"
        >
          Ignore for Obsidian
        </button>
        <button
          className="focus-ring rounded-lg border border-amber-500/35 bg-amber-500/10 px-3 py-2 text-xs font-semibold text-amber-100 hover:bg-amber-500/20 disabled:opacity-40"
          disabled={!!busy}
          onClick={() => void run("stale", () => markStale({ libraryRecordId }))}
          type="button"
        >
          Mark Stale
        </button>
      </div>

      {exportRows === undefined ? (
        <p className="mt-4 text-xs text-slate-500">Loading export previews…</p>
      ) : markdownPreview ? (
        <div className="mt-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Latest preview</p>
          {latest?.obsidianPath ? <p className="mt-1 text-xs text-slate-400">Path: {latest.obsidianPath}</p> : null}
          <textarea readOnly className="mt-2 max-h-64 w-full resize-y rounded-lg border border-slate-800 bg-slate-950/80 p-3 font-mono text-[0.7rem] leading-relaxed text-slate-200" rows={14} value={markdownPreview} />
        </div>
      ) : (
        <p className="mt-4 text-xs text-slate-500">No Markdown preview yet. Generate a preview to inspect Obsidian-ready output.</p>
      )}
    </ControlPanel>
  );
}

function isLibraryInventorySegment(segment: string): segment is LibraryPageKey {
  return Object.prototype.hasOwnProperty.call(libraryPageConfig, segment);
}

const HUB_PRIMARY_BUCKETS: { slug: LibraryRouteSlug; title: string; blurb: string; status: "Active" | "Planned" | "Sync-ready" }[] = [
  { slug: "copy-archive", title: "Copy Archive", blurb: "Owned emails, YouTube, social, ads, landing pages, and launch copy.", status: "Active" },
  { slug: "swipe-file", title: "Swipe File", blurb: "Outside hooks, formats, and examples — inspiration, not owned copy by default.", status: "Active" },
  { slug: "voice-style", title: "Voice & Style", blurb: "Founder voice, tone rules, phrases to use or avoid — complements Voice Rules & Sign-offs.", status: "Active" },
  { slug: "audience-intelligence", title: "Audience Intelligence", blurb: "Segments, pains, objections, and messaging notes for launches.", status: "Active" },
  { slug: "cta-library", title: "Offer / CTA Library", blurb: "Reusable CTAs, offers, and lead magnets (also under Offers & Lead Magnets).", status: "Active" },
  { slug: "platform-playbooks", title: "Platform Playbooks", blurb: "YouTube, email, reels, TikTok, Meta, Pinterest, X, ads — patterns and guardrails.", status: "Active" },
  { slug: "compliance", title: "Compliance Rules", blurb: "Claims, urgency, and public-facing language guardrails.", status: "Active" },
  { slug: "campaign-learnings", title: "Campaign Learnings", blurb: "Performance and review lessons — approve before trusted reuse.", status: "Active" },
  { slug: "source-imports", title: "Source Imports", blurb: "Drive, Obsidian, transcripts, exports — metadata first.", status: "Planned" },
  { slug: "knowledge-sync", title: "Knowledge Sync", blurb: "Prepare Google Drive indexing and Obsidian Markdown export — preview and metadata only until connectors ship.", status: "Planned" },
];

function ContentLibraryHub() {
  const convexLibraryItems = useQuery(api.library.listLibraryItems);
  const convexLearningInsights = useQuery(api.library.listLearningInsights);
  const knowledgeSyncMappings = useQuery(api.librarySync.listSourceMappings);
  const knowledgeSyncJobsPreview = useQuery(api.librarySync.listSyncJobs, { limit: 80 });

  const countFor = (slug: LibraryRouteSlug) => {
    if (slug === "learning" || slug === "campaign-learnings") return convexLearningInsights?.length ?? 0;
    if (slug === "knowledge-sync") return 0;
    const lib = (convexLibraryItems ?? []).map((record) => toLibraryItem(record as Parameters<typeof toLibraryItem>[0]));
    return lib.filter((item) => libraryItemMatchesSlug(item, slug)).length;
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Libraries"
        title="Content Library"
        description="Reusable copy, voice rules, audience intelligence, offers, platform playbooks, swipe examples, and campaign learnings for stronger launch campaigns — structured for scale and future Copy Intelligence, Performance Intelligence, and knowledge sync."
        actions={null}
      />

      <ControlPanel className="p-4">
        <div className="flex flex-wrap items-start gap-3">
          <Database className="mt-0.5 h-5 w-5 shrink-0 text-sky-300" />
          <div className="min-w-0 flex-1 space-y-2 text-sm leading-6 text-slate-300">
            <p className="font-semibold text-slate-100">Marketing knowledge store</p>
            <p>
              Approved and active records are the default trusted context for future agents; candidates, drafts, and inspiration-only swipe items stay review-gated. Google Drive indexing and Obsidian export are planned — see Knowledge Sync and Operations when those paths go live.
            </p>
          </div>
        </div>
      </ControlPanel>

      <div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Buckets</p>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {HUB_PRIMARY_BUCKETS.map((bucket) => (
            <Link className="focus-ring block rounded-lg border border-slate-800 bg-slate-950/70 p-4 transition hover:border-slate-600 hover:bg-slate-900/80" href={`/libraries/${bucket.slug}`} key={bucket.slug}>
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-semibold text-slate-100">{bucket.title}</p>
                <StatusBadge tone={bucket.status === "Active" ? "green" : bucket.status === "Sync-ready" ? "blue" : "gray"}>{bucket.status}</StatusBadge>
              </div>
              <p className="mt-2 text-xs leading-5 text-slate-400">{bucket.blurb}</p>
              <p className="mt-3 text-[0.65rem] font-semibold uppercase tracking-wide text-slate-500">
                {bucket.slug === "knowledge-sync" ? (
                  knowledgeSyncMappings === undefined || knowledgeSyncJobsPreview === undefined ? (
                    "Loading sync prep…"
                  ) : (
                    `${knowledgeSyncMappings.length} mappings · ${knowledgeSyncJobsPreview.length} jobs`
                  )
                ) : (bucket.slug === "campaign-learnings" ? convexLearningInsights === undefined : convexLibraryItems === undefined) ? (
                  "Loading counts…"
                ) : (
                  `${countFor(bucket.slug)} records`
                )}
              </p>
            </Link>
          ))}
        </div>
      </div>

      <ControlPanel className="p-4">
        <p className="text-sm font-semibold text-slate-100">Classic library routes</p>
        <p className="mt-2 text-xs text-slate-400">Original tabs remain supported for day-to-day workflows.</p>
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          {(["email", "offers", "voice-rules", "signoffs", "audiences", "compliance", "learning"] as const).map((slug) => (
            <Link className="rounded-md border border-slate-800 bg-slate-900/80 px-2.5 py-1 font-semibold text-slate-200 hover:border-slate-600" href={`/libraries/${slug}`} key={slug}>
              {libraryPageConfig[slug].title}
            </Link>
          ))}
        </div>
      </ControlPanel>
    </div>
  );
}

const REFERENCE_DRIVE_TO_LIBRARY_ROWS: { drive: string; bucket: string; mode: string }[] = [
  { drive: "Marketing / Copy Archive", bucket: "Copy Archive", mode: "Planned read-only index" },
  { drive: "Marketing / Swipe File", bucket: "Swipe File", mode: "Planned read-only index" },
  { drive: "Marketing / Platform Playbooks", bucket: "Platform Playbooks", mode: "Planned read-only index" },
  { drive: "Marketing / Campaign Learnings", bucket: "Campaign Learnings", mode: "Planned read-only index" },
];

const REFERENCE_LIBRARY_TO_OBSIDIAN_ROWS: { bucket: string; path: string; mode: string }[] = [
  { bucket: "Copy Archive", path: "Marketing/Copy Archive/", mode: "Preview / manual export" },
  { bucket: "Audience Intelligence", path: "Marketing/Audience Intelligence/", mode: "Preview / manual export" },
  { bucket: "Platform Playbooks", path: "Marketing/Platform Playbooks/", mode: "Preview / manual export" },
  { bucket: "Campaign Learnings", path: "Marketing/Campaign Learnings/", mode: "Preview / manual export" },
];

function KnowledgeSyncScreen() {
  const appUser = useAppUser();
  const convexLibraryItems = useQuery(api.library.listLibraryItems);
  const jobs = useQuery(api.librarySync.listSyncJobs, { limit: 80 });
  const mappings = useQuery(api.librarySync.listSourceMappings);
  const seedKnowledgeSyncDemoIfEmpty = useMutation(api.librarySync.seedKnowledgeSyncDemoIfEmpty);
  const generatePreview = useMutation(api.obsidianExport.generateExportPreview);
  const syncSeedRef = useRef(false);
  const [pickId, setPickId] = useState("");
  const [previewErr, setPreviewErr] = useState<string | null>(null);
  const [previewBusy, setPreviewBusy] = useState(false);

  useEffect(() => {
    if (mappings === undefined || mappings.length > 0 || syncSeedRef.current) return;
    syncSeedRef.current = true;
    void seedKnowledgeSyncDemoIfEmpty().catch(() => {
      syncSeedRef.current = false;
    });
  }, [mappings, seedKnowledgeSyncDemoIfEmpty]);

  const libraryRows = useMemo(
    () => (convexLibraryItems ?? []).map((record) => toLibraryItem(record as Parameters<typeof toLibraryItem>[0])),
    [convexLibraryItems],
  );

  useEffect(() => {
    if (!pickId && libraryRows.length) setPickId(libraryRows[0].id);
  }, [pickId, libraryRows]);

  const stats = useMemo(() => {
    let withSource = 0;
    let withDrive = 0;
    let withObsidianPath = 0;
    let needReview = 0;
    let exportReady = 0;
    let exported = 0;
    let previewGenerated = 0;
    for (const item of libraryRows) {
      if (item.sourceUri || item.sourceLabel) withSource += 1;
      if (item.driveFileId || item.drivePath) withDrive += 1;
      if (item.obsidianPath) withObsidianPath += 1;
      if (["candidate", "draft", "needs_review"].includes(item.status)) needReview += 1;
      if (item.obsidianSyncStatus === "export_ready") exportReady += 1;
      if (item.obsidianSyncStatus === "exported") exported += 1;
      if (item.obsidianSyncStatus === "preview_generated") previewGenerated += 1;
    }
    return { withSource, withDrive, withObsidianPath, needReview, exportReady, exported, previewGenerated };
  }, [libraryRows]);

  const exportRowsForPick = useQuery(api.obsidianExport.listExportRecords, pickId ? { libraryRecordId: pickId, limit: 5 } : "skip");
  const latestPickExport = exportRowsForPick?.[0] as { markdownBody?: string; obsidianPath?: string } | undefined;

  const jobFailed = (jobs ?? []).filter((j) => j.status === "failed").length;
  const jobCompleted = (jobs ?? []).filter((j) => j.status === "completed").length;
  const jobPreview = (jobs ?? []).filter((j) => j.status === "preview_generated" || j.jobType === "obsidian_preview").length;

  return (
    <div className="space-y-5">
      <SectionHeader
        eyebrow="Libraries"
        title="Knowledge Sync"
        description="Prepare Google Drive indexing and Obsidian Markdown export so the Content Library can connect to Sage’s broader knowledge graph."
        actions={
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/35 bg-emerald-500/10 px-3 py-1 text-[0.65rem] font-bold uppercase tracking-wide text-emerald-100">
            <Shield className="h-3.5 w-3.5" />
            Manual / preview-only / no destructive sync
          </span>
        }
      />

      <ControlPanel className="p-4">
        <div className="flex flex-wrap items-start gap-3">
          <BookOpen className="mt-0.5 h-5 w-5 shrink-0 text-sky-300" />
          <div className="min-w-0 flex-1 space-y-3 text-sm leading-6 text-slate-300">
            <p className="font-semibold text-slate-100">How Drive, Outreach Console, and Obsidian relate</p>
            <p>
              Google Drive remains the source for large docs and files. Outreach Console stores structured marketing records, metadata, statuses, and campaign links. Obsidian can receive selected records as Markdown notes for Sage&apos;s company knowledge graph. Sync workflows stay review-first — nothing here writes to Drive or your vault.
            </p>
            <p className="text-xs text-slate-500">
              Operations: see <Link className="text-sky-300 underline hover:text-sky-200" href="/operations/integrations">Integrations</Link> for Google Drive, Obsidian, and Library Sync health cards (planned / preview posture).
            </p>
          </div>
        </div>
      </ControlPanel>

      <div className="grid gap-3 md:grid-cols-2">
        <ControlPanel className="p-4">
          <p className="text-sm font-semibold text-slate-100">Google Drive index</p>
          <p className="mt-1 text-xs text-slate-500">Planned · not connected · read-only future</p>
          <ul className="mt-3 space-y-1.5 text-xs text-slate-300">
            <li>Status: Planned / not connected</li>
            <li>Mode: Read-only future</li>
            <li>Last indexed: none</li>
            <li>Records with Drive metadata: {convexLibraryItems === undefined ? "…" : stats.withDrive}</li>
            <li>Errors: none (no live API)</li>
            <li>Setup: OAuth, parsing, and folder pickers are not implemented in this pass.</li>
          </ul>
        </ControlPanel>
        <ControlPanel className="p-4">
          <p className="text-sm font-semibold text-slate-100">Obsidian export</p>
          <p className="mt-1 text-xs text-slate-500">Preview / manual · no vault writes</p>
          <ul className="mt-3 space-y-1.5 text-xs text-slate-300">
            <li>Status: Preview / manual</li>
            <li>Mode: Markdown preview + clipboard</li>
            <li>Records export-ready: {convexLibraryItems === undefined ? "…" : stats.exportReady}</li>
            <li>Records exported (manual flag): {convexLibraryItems === undefined ? "…" : stats.exported}</li>
            <li>Previews generated: {convexLibraryItems === undefined ? "…" : stats.previewGenerated}</li>
            <li>Target vault path: configure in Obsidian when you paste — suggested paths appear on each preview.</li>
          </ul>
        </ControlPanel>
        <ControlPanel className="p-4">
          <p className="text-sm font-semibold text-slate-100">Library metadata</p>
          <ul className="mt-3 space-y-1.5 text-xs text-slate-300">
            <li>Records with source links: {convexLibraryItems === undefined ? "…" : stats.withSource}</li>
            <li>Records with Drive metadata: {convexLibraryItems === undefined ? "…" : stats.withDrive}</li>
            <li>Records with Obsidian paths: {convexLibraryItems === undefined ? "…" : stats.withObsidianPath}</li>
            <li>Records needing review: {convexLibraryItems === undefined ? "…" : stats.needReview}</li>
            <li>Records export-ready: {convexLibraryItems === undefined ? "…" : stats.exportReady}</li>
          </ul>
        </ControlPanel>
        <ControlPanel className="p-4">
          <p className="text-sm font-semibold text-slate-100">Sync jobs</p>
          <ul className="mt-3 space-y-1.5 text-xs text-slate-300">
            <li>Recent jobs (loaded): {jobs === undefined ? "…" : jobs.length}</li>
            <li>Completed: {jobs === undefined ? "…" : jobCompleted}</li>
            <li>Failed: {jobs === undefined ? "…" : jobFailed}</li>
            <li>Preview-related: {jobs === undefined ? "…" : jobPreview}</li>
          </ul>
        </ControlPanel>
      </div>

      <ControlPanel className="p-4">
        <p className="text-sm font-semibold text-slate-100">Source mappings</p>
        <p className="mt-2 text-xs text-slate-500">Configured rows in Convex plus reference paths for operators (no folder access yet).</p>
        <div className="mt-4 grid gap-6 lg:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Google Drive → Outreach Library</p>
            <ul className="mt-2 space-y-2 text-xs text-slate-300">
              {REFERENCE_DRIVE_TO_LIBRARY_ROWS.map((row) => (
                <li className="rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2" key={row.drive}>
                  <span className="font-semibold text-slate-100">{row.drive}</span>
                  <span className="text-slate-500"> → </span>
                  {row.bucket}
                  <span className="block text-slate-500">{row.mode}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Outreach Library → Obsidian</p>
            <ul className="mt-2 space-y-2 text-xs text-slate-300">
              {REFERENCE_LIBRARY_TO_OBSIDIAN_ROWS.map((row) => (
                <li className="rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2" key={row.bucket}>
                  <span className="font-semibold text-slate-100">{row.bucket}</span>
                  <span className="text-slate-500"> → </span>
                  {row.path}
                  <span className="block text-slate-500">{row.mode}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="mt-6 border-t border-slate-800 pt-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Stored mappings (Convex)</p>
          {mappings === undefined ? (
            <p className="mt-2 text-sm text-slate-400">Loading…</p>
          ) : !mappings.length ? (
            <p className="mt-2 text-sm text-slate-400">No mappings yet. Visit once to seed demo mappings, or add via Convex.</p>
          ) : (
            <ul className="mt-2 space-y-2 text-xs text-slate-300">
              {mappings.map((m) => (
                <li className="rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2" key={String(m.mappingId)}>
                  <span className="font-semibold text-slate-100">{String(m.name)}</span>
                  <span className="block text-slate-500">
                    {String(m.sourceSystem)} → {String(m.targetSystem)}
                    {m.sourcePath ? ` · ${String(m.sourcePath)}` : ""}
                    {m.targetPath ? ` · ${String(m.targetPath)}` : ""}
                  </span>
                  <span className="text-slate-500">
                    status {String(m.status)} · mode {String(m.mode)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </ControlPanel>

      <ControlPanel className="p-4">
        <p className="text-sm font-semibold text-slate-100">Obsidian export preview tool</p>
        <p className="mt-2 text-xs text-slate-500">
          Generates Markdown with YAML frontmatter and bucket-aware sections. Saves an export row and a completed preview job — still no Obsidian vault writes.
        </p>
        <div className="mt-4 space-y-3">
          <Field label="Library record">
            <select className={inputStyles} onChange={(e) => setPickId(e.target.value)} value={pickId}>
              {!libraryRows.length ? <option value="">No library rows</option> : null}
              {libraryRows.map((item) => (
                <option key={item.id} value={item.id}>
                  {displayTitleForItem(item)} ({item.id})
                </option>
              ))}
            </select>
          </Field>
          {previewErr ? <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-100">{previewErr}</div> : null}
          <div className="flex flex-wrap gap-2">
            <button
              className="focus-ring rounded-lg border border-sky-500/50 bg-sky-500/15 px-3 py-2 text-xs font-semibold text-sky-100 hover:bg-sky-500/25 disabled:opacity-40"
              disabled={previewBusy || !pickId}
              onClick={() => {
                setPreviewBusy(true);
                setPreviewErr(null);
                void generatePreview({ libraryRecordId: pickId, createdBy: appUser.displayName || appUser.email || "operator" })
                  .catch((e) => setPreviewErr(e instanceof Error ? e.message : "Preview failed."))
                  .finally(() => setPreviewBusy(false));
              }}
              type="button"
            >
              {previewBusy ? "Generating…" : "Generate Obsidian Preview"}
            </button>
            <button
              className="focus-ring rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-800 disabled:opacity-40"
              disabled={!latestPickExport?.markdownBody}
              onClick={() => {
                const md = latestPickExport?.markdownBody;
                if (md) void navigator.clipboard.writeText(md);
              }}
              type="button"
            >
              <span className="inline-flex items-center gap-1.5">
                <Copy className="h-3.5 w-3.5" />
                Copy Markdown
              </span>
            </button>
          </div>
          {latestPickExport?.markdownBody ? (
            <textarea readOnly className="mt-2 max-h-72 w-full resize-y rounded-lg border border-slate-800 bg-slate-950/80 p-3 font-mono text-[0.7rem] text-slate-200" rows={16} value={latestPickExport.markdownBody} />
          ) : pickId && exportRowsForPick !== undefined ? (
            <p className="text-xs text-slate-500">No preview for this record yet.</p>
          ) : null}
        </div>
      </ControlPanel>

      <ControlPanel className="p-4">
        <p className="text-sm font-semibold text-slate-100">Google Drive indexing (placeholder)</p>
        <p className="mt-2 text-xs leading-5 text-slate-400">
          Planned: index selected folders, attach Drive links and metadata, detect stale rows, keep Drive authoritative for binaries. Not implemented: OAuth, downloads, parsing, auto-index, or any write/delete to Drive.
        </p>
      </ControlPanel>

      <ControlPanel className="p-4">
        <p className="text-sm font-semibold text-slate-100">Sync safety rules</p>
        <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-slate-400">
          <li>Swipe File and external examples stay inspiration-only in exports.</li>
          <li>Export ready means reviewed for manual paste — not automatic vault placement.</li>
          <li>Candidate / draft rows can be previewed but should not be treated as company truth.</li>
          <li>No bidirectional sync, conflict resolution, or scheduled jobs in this build.</li>
        </ul>
      </ControlPanel>

      <ControlPanel className="p-4">
        <p className="text-sm font-semibold text-slate-100">Recent sync / export jobs</p>
        {jobs === undefined ? (
          <p className="mt-3 text-sm text-slate-400">Loading…</p>
        ) : !jobs.length ? (
          <p className="mt-3 text-sm text-slate-400">No sync jobs yet. Future Drive indexing and Obsidian export jobs will appear here.</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-left text-xs text-slate-300">
              <thead>
                <tr className="border-b border-slate-800 text-[0.65rem] font-bold uppercase tracking-wide text-slate-500">
                  <th className="py-2 pr-3">Type</th>
                  <th className="py-2 pr-3">Source</th>
                  <th className="py-2 pr-3">Direction</th>
                  <th className="py-2 pr-3">Status</th>
                  <th className="py-2 pr-3">Mode</th>
                  <th className="py-2 pr-3">Scanned</th>
                  <th className="py-2 pr-3">Created</th>
                  <th className="py-2 pr-3">Updated</th>
                  <th className="py-2 pr-3">Exported</th>
                  <th className="py-2 pr-3">Errors</th>
                  <th className="py-2 pr-3">Started</th>
                  <th className="py-2">Completed</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((job) => (
                  <tr className="border-b border-slate-800/80" key={String(job.syncJobId)}>
                    <td className="py-2 pr-3 align-top">{typeof job.jobType === "string" ? job.jobType : "—"}</td>
                    <td className="py-2 pr-3 align-top">{typeof job.sourceSystem === "string" ? job.sourceSystem : "—"}</td>
                    <td className="py-2 pr-3 align-top">{typeof job.direction === "string" ? job.direction : "—"}</td>
                    <td className="py-2 pr-3 align-top">
                      <StatusBadge tone={job.status === "failed" ? "red" : job.status === "completed" ? "green" : job.status === "queued" ? "gray" : "amber"}>
                        {typeof job.status === "string" ? job.status : "—"}
                      </StatusBadge>
                    </td>
                    <td className="py-2 pr-3 align-top">{typeof job.mode === "string" ? job.mode : "—"}</td>
                    <td className="py-2 pr-3 align-top">{typeof job.recordsScanned === "number" ? job.recordsScanned : "—"}</td>
                    <td className="py-2 pr-3 align-top">{typeof job.recordsCreated === "number" ? job.recordsCreated : "—"}</td>
                    <td className="py-2 pr-3 align-top">{typeof job.recordsUpdated === "number" ? job.recordsUpdated : "—"}</td>
                    <td className="py-2 pr-3 align-top">{typeof job.recordsExported === "number" ? job.recordsExported : "—"}</td>
                    <td className="py-2 pr-3 align-top text-rose-200">
                      {typeof job.recordsErrored === "number" ? job.recordsErrored : typeof job.errorMessage === "string" ? "1" : "—"}
                    </td>
                    <td className="py-2 pr-3 align-top text-slate-500">{typeof job.startedAt === "number" ? new Date(job.startedAt).toLocaleString() : "—"}</td>
                    <td className="py-2 align-top text-slate-500">{typeof job.completedAt === "number" ? new Date(job.completedAt).toLocaleString() : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {jobs.some((j) => typeof j.summary === "string" && j.summary) ? (
              <div className="mt-3 space-y-2 text-xs text-slate-500">
                {jobs.slice(0, 6).map((j) =>
                  typeof j.summary === "string" && j.summary ? (
                    <p key={`${String(j.syncJobId)}-sum`}>
                      <span className="font-semibold text-slate-400">{String(j.syncJobId)}:</span> {j.summary}
                    </p>
                  ) : null,
                )}
              </div>
            ) : null}
          </div>
        )}
      </ControlPanel>

      <ControlPanel className="p-4">
        <p className="text-sm font-semibold text-slate-100">Record export readiness (snapshot)</p>
        {convexLibraryItems === undefined ? (
          <p className="mt-2 text-sm text-slate-400">Loading…</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-left text-xs text-slate-300">
              <thead>
                <tr className="border-b border-slate-800 text-[0.65rem] font-bold uppercase tracking-wide text-slate-500">
                  <th className="py-2 pr-3">Title</th>
                  <th className="py-2 pr-3">Bucket</th>
                  <th className="py-2 pr-3">Status</th>
                  <th className="py-2 pr-3">Obsidian</th>
                  <th className="py-2 pr-3">Drive</th>
                  <th className="py-2">General sync</th>
                </tr>
              </thead>
              <tbody>
                {libraryRows.slice(0, 25).map((item) => (
                  <tr className="border-b border-slate-800/80" key={item.id}>
                    <td className="py-2 pr-3 align-top font-medium text-slate-100">{displayTitleForItem(item)}</td>
                    <td className="py-2 pr-3 align-top text-slate-400">{item.bucket ? formatLabel(item.bucket) : "—"}</td>
                    <td className="py-2 pr-3 align-top">{formatLabel(item.status)}</td>
                    <td className="py-2 pr-3 align-top">{getObsidianExportStatusLabel(item.obsidianSyncStatus)}</td>
                    <td className="py-2 pr-3 align-top">{getDriveSyncStatusLabel(item.driveSyncStatus)}</td>
                    <td className="py-2 align-top">{getGeneralSyncStatusLabel(item.syncStatus)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {libraryRows.length > 25 ? <p className="mt-2 text-xs text-slate-500">Showing first 25 of {libraryRows.length} records. Open a bucket for the full list.</p> : null}
          </div>
        )}
      </ControlPanel>
    </div>
  );
}

export function LibraryRouteSection({ slug }: { slug?: string[] }) {
  const segment = slug?.[1];
  if (!segment) {
    return <ContentLibraryHub />;
  }
  if (segment === "knowledge-sync") {
    return <KnowledgeSyncScreen />;
  }
  if (!isLibraryInventorySegment(segment)) {
    return <ContentLibraryHub />;
  }
  return <LibraryInventoryPage key={segment} libraryKey={segment} />;
}

