"use client";

import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { AlertTriangle, BookOpen, Filter, Search, Sparkles, X } from "lucide-react";
import type { LearningInsight, LibraryItem } from "@/lib/domain";
import { Button, ConsoleTable, ControlPanel, InlineAction, SectionHeader, StatusBadge, StatusDot, Td, Th, TableHead } from "@/components/ui";
import { cn } from "@/lib/utils";

type LibraryKey = "offers" | "email" | "voice-rules" | "signoffs" | "audiences" | "compliance" | "learning";

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

const libraryPageConfig: Record<LibraryKey, { title: string; summary: string; tone: string; filters: string[]; columns: string[] }> = {
  offers: {
    title: "Offers & Lead Magnets",
    summary: "Operational inventory of active offers, approvals, channels, and deployment suitability.",
    tone: "blue",
    filters: ["All", "Active", "Approved", "Needs Blue Approval", "Possible Idea", "Paused", "Retired"],
    columns: ["Name", "Type", "Status", "Approval owner", "Allowed channels", "Allowed audiences", "Last used", "Performance", "Action"],
  },
  email: {
    title: "Email Library",
    summary: "Source library for Bari-written, Bari-approved, imported, and agency-written examples.",
    tone: "purple",
    filters: ["All", "Gold", "Silver", "Bronze", "Rejected", "Needs Review"],
    columns: ["Title / Subject", "Rating", "Source Type", "Associated Campaign", "Last Used", "Open"],
  },
  "voice-rules": {
    title: "Bari Voice Rules",
    summary: "Rule control list with blocking, warning, and guidance rules that shape founder voice output.",
    tone: "amber",
    filters: ["All", "Blocking", "Warning", "Guidance"],
    columns: ["Rule", "Severity", "Status", "Summary"],
  },
  signoffs: {
    title: "Sign-off Library",
    summary: "Approved sign-off inventory with usage rules and automation permissions.",
    tone: "green",
    filters: ["All", "Active", "Inactive", "Requires Bari Review", "Auto-selectable"],
    columns: ["Sign-off Text", "Allowed Contexts", "Status", "Agent Auto Choose", "Requires Bari Review", "Example Usage"],
  },
  audiences: {
    title: "Audience Library",
    summary: "Audience, tag, and performance inventory tied to offers and exclusions.",
    tone: "blue",
    filters: ["All", "Active", "Demo", "Manual", "Needs Review"],
    columns: ["Audience", "Source", "Status", "Estimated Size", "Allowed Offers", "Exclusions", "Last Used", "Performance"],
  },
  compliance: {
    title: "Compliance Rules",
    summary: "Blocking, warning, and guidance rules for claims, channels, and approval ownership.",
    tone: "red",
    filters: ["All", "Blocking", "Warning", "Guidance", "Inactive"],
    columns: ["Rule", "Severity", "Claim Type", "Status", "Channels", "Owner", "Examples"],
  },
  learning: {
    title: "Learning Library",
    summary: "Candidate and approved learning signals from edits, replies, performance, and evaluations.",
    tone: "purple",
    filters: ["All", "Candidate", "Approved", "Rejected", "Archived"],
    columns: ["Insight", "Source", "Confidence", "Status", "Applies To", "Last Used"],
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
  type: LibraryItem["type"];
  name: string;
  status: string;
  summary: string;
  tags: string[];
  riskLevel?: LibraryItem["riskLevel"];
  payload?: Record<string, unknown>;
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
}): LearningInsight {
  return {
    id: record.recordId,
    source: record.source,
    status: record.status,
    title: record.title,
    summary: record.summary,
    confidence: record.confidence,
    payload: record.payload,
  };
}

function rowsFor(key: LibraryKey, libraryItems: LibraryItem[], learningInsights: LearningInsight[]): InventoryRecord[] {
  if (key === "learning") {
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

function rowMatchesFilter(key: LibraryKey, record: InventoryRecord, activeFilter: string) {
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

  return formatLabel(record.status).toLowerCase() === normalized;
}

function filterCountFor(key: LibraryKey, filter: string, rows: InventoryRecord[]) {
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

function advancedFilterDefinitionsFor(key: LibraryKey): AdvancedFilterDefinition[] {
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
function filterChipDotTone(key: LibraryKey, filter: string): "green" | "amber" | "red" | "blue" | "purple" | "gray" {
  if (filter === "All") {
    if (key === "learning") return "purple";
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
  if (key === "learning") {
    if (filter === "Candidate") return "amber";
    if (filter === "Approved") return "green";
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

function createRecordId(key: LibraryKey) {
  const prefixMap: Record<LibraryKey, string> = {
    offers: "offer",
    email: "email",
    "voice-rules": "rule",
    signoffs: "signoff",
    audiences: "aud",
    compliance: "comp",
    learning: "learn",
  };
  return `${prefixMap[key]}_${Date.now()}`;
}

function createEmptyDraft(key: LibraryKey): EditorDraft {
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
  if (key === "offers") {
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
  if (key === "voice-rules") {
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
  if (key === "audiences") {
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

function draftFromRecord(key: LibraryKey, record?: InventoryRecord): EditorDraft {
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
  if (key === "offers") {
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
  if (key === "voice-rules") {
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
  if (key === "audiences") {
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

function patchForLibrarySave(key: LibraryKey, draft: EditorDraft, existing?: InventoryRecord) {
  const existingItem = existing?.kind === "library" ? existing.source as LibraryItem : undefined;
  const existingPayload = existingItem?.payload ?? {};
  const tags = existingItem?.tags ?? [];
  const riskLevel = existingItem?.riskLevel;

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
  if (key === "offers") {
    return {
      type: stringFromDraft(draft.type),
      name: stringFromDraft(draft.name),
      status: stringFromDraft(draft.status),
      summary: stringFromDraft(draft.description),
      tags,
      riskLevel,
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
  if (key === "voice-rules") {
    const severity = stringFromDraft(draft.severity).toLowerCase();
    return {
      type: "voice_rule",
      name: stringFromDraft(draft.rule),
      status: severity,
      summary: stringFromDraft(draft.summary),
      tags,
      riskLevel,
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
  if (key === "audiences") {
    return {
      type: "audience",
      name: stringFromDraft(draft.audienceName),
      status: stringFromDraft(draft.status),
      summary: stringFromDraft(draft.description),
      tags,
      riskLevel,
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
  keyName: LibraryKey;
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
          {keyName === "offers" ? (
            <>
              <Field label="Name"><input className={inputStyles} value={stringFromDraft(draft.name)} onChange={(e) => onDraftChange("name", e.target.value)} /></Field>
              <Field label="Type"><select className={inputStyles} value={stringFromDraft(draft.type)} onChange={(e) => onDraftChange("type", e.target.value)}>{["offer", "lead_magnet"].map((option) => <option key={option} value={option}>{formatLabel(option)}</option>)}</select></Field>
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
          {keyName === "voice-rules" ? (
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
          {keyName === "audiences" ? (
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
          {keyName === "learning" ? (
            <>
              <Field label="Insight"><input className={inputStyles} value={stringFromDraft(draft.insight)} onChange={(e) => onDraftChange("insight", e.target.value)} /></Field>
              <Field label="Source"><select className={inputStyles} value={stringFromDraft(draft.source)} onChange={(e) => onDraftChange("source", e.target.value)}>{["bari_edit", "blue_decision", "campaign_performance", "helpdesk_reply", "agent_evaluation"].map((option) => <option key={option} value={option}>{formatLabel(option)}</option>)}</select></Field>
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

  if (keyName === "offers") {
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

  if (keyName === "voice-rules") {
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

  if (keyName === "audiences") {
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

function LibraryInventoryPage({ libraryKey }: { libraryKey: LibraryKey }) {
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

  useEffect(() => {
    if (key === "learning" || convexLibraryItems === undefined || convexLibraryItems.length > 0 || librarySeedAttempted) return;
    setLibrarySeedAttempted(true);
    void seedDefaultLibraryItemsIfEmpty().catch(() => {
      setLoadError("Unable to load library records.");
      setLibrarySeedAttempted(false);
    });
  }, [convexLibraryItems, key, librarySeedAttempted, seedDefaultLibraryItemsIfEmpty]);

  useEffect(() => {
    if (key !== "learning" || convexLearningInsights === undefined || convexLearningInsights.length > 0 || learningSeedAttempted) return;
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

      if (key === "learning") {
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

  return (
    <div className="space-y-5">
      <SectionHeader
        eyebrow="Library inventory"
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

      {key === "learning" ? (
        <ControlPanel className="p-4">
          <div className="flex items-start gap-3">
            <Sparkles className="mt-0.5 h-4 w-4 text-violet-300" />
            <p className="text-sm leading-6 text-slate-300">
              Learning candidates from Bari edits, campaign performance, HelpDesk replies, and offer tests remain reviewable before they become authoritative guidance.
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
            {(key === "learning" ? convexLearningInsights === undefined : convexLibraryItems === undefined) ? (
              <tr>
                <td className="px-4 py-6 text-sm text-slate-300" colSpan={config.columns.length}>Loading library records.</td>
              </tr>
            ) : !filteredRows.length ? (
              <tr>
                <td className="px-4 py-6 text-sm text-slate-300" colSpan={config.columns.length}>
                  {hasSearchOrAdvancedFilters ? "No records match this search." : "No library records found."}
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
          {key === "learning" ? (
            <ControlPanel className="p-4">
              <p className="text-sm font-semibold text-slate-100">Learning actions</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  className="focus-ring rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-100 disabled:opacity-40"
                  disabled={selectedRecord?.status !== "candidate"}
                  onClick={() => setDemoNotice("Demo: Approve insight is disabled until review workflow is wired.")}
                  type="button"
                >
                  Approve insight
                </button>
                <button
                  className="focus-ring rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs font-semibold text-rose-100 disabled:opacity-40"
                  disabled={selectedRecord?.status !== "candidate"}
                  onClick={() => setDemoNotice("Demo: Reject insight is disabled until review workflow is wired.")}
                  type="button"
                >
                  Reject insight
                </button>
                <button
                  className="focus-ring rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-200 disabled:opacity-40"
                  disabled={!selectedRecord}
                  onClick={() => setDemoNotice("Demo: Archive is disabled until persistence is enabled.")}
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

export function LibraryRouteSection({ slug }: { slug?: string[] }) {
  const key = (slug?.[1] ?? "offers") as LibraryKey;
  return <LibraryInventoryPage key={key} libraryKey={key} />;
}
