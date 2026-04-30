"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, BookOpen, Filter, Search, Sparkles } from "lucide-react";
import type { LearningInsight, LibraryItem } from "@/lib/domain";
import { libraryItems, learningInsights } from "@/lib/data/demo-data";
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

const libraryPageConfig: Record<LibraryKey, { title: string; summary: string; tone: string; filters: string[]; columns: string[] }> = {
  offers: {
    title: "Offers & Lead Magnets",
    summary: "Operational inventory of active offers, approvals, channels, and deployment suitability.",
    tone: "blue",
    filters: ["Active", "Approved", "Needs Blue Approval", "Possible Idea", "Paused", "Retired", "All"],
    columns: ["Name", "Type", "Status", "Approval owner", "Allowed channels", "Allowed audiences", "Last used", "Performance", "Action"],
  },
  email: {
    title: "Email Library",
    summary: "Source library for Bari-written, Bari-approved, imported, and agency-written examples.",
    tone: "purple",
    filters: ["Gold", "Silver", "Bronze", "Rejected", "Needs Review", "All"],
    columns: ["Title / Subject", "Rating", "Source Type", "Associated Campaign", "Last Used", "Open"],
  },
  "voice-rules": {
    title: "Bari Voice Rules",
    summary: "Rule control list with blocking, warning, and guidance rules that shape founder voice output.",
    tone: "amber",
    filters: ["Blocking", "Warning", "Guidance", "All"],
    columns: ["Rule", "Severity", "Status", "Summary"],
  },
  signoffs: {
    title: "Sign-off Library",
    summary: "Approved sign-off inventory with usage rules and automation permissions.",
    tone: "green",
    filters: ["Active", "Inactive", "Requires Bari Review", "Auto-selectable", "All"],
    columns: ["Sign-off Text", "Allowed Contexts", "Status", "Agent Auto Choose", "Requires Bari Review", "Example Usage"],
  },
  audiences: {
    title: "Audience Library",
    summary: "Audience, tag, and performance inventory tied to offers and exclusions.",
    tone: "blue",
    filters: ["Active", "Demo", "Manual", "Needs Review", "All"],
    columns: ["Audience", "Source", "Status", "Estimated Size", "Allowed Offers", "Exclusions", "Last Used", "Performance"],
  },
  compliance: {
    title: "Compliance Rules",
    summary: "Blocking, warning, and guidance rules for claims, channels, and approval ownership.",
    tone: "red",
    filters: ["Blocking", "Warning", "Guidance", "Inactive", "All"],
    columns: ["Rule", "Severity", "Claim Type", "Status", "Channels", "Owner", "Examples"],
  },
  learning: {
    title: "Learning Library",
    summary: "Candidate and approved learning signals from edits, replies, performance, and evaluations.",
    tone: "purple",
    filters: ["Candidate", "Approved", "Rejected", "Archived", "All"],
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

function rowsFor(key: LibraryKey): InventoryRecord[] {
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

function SelectedRecordPanel({ keyName, record }: { keyName: LibraryKey; record?: InventoryRecord }) {
  if (!record) {
    return (
      <ControlPanel className="p-4">
        <p className="text-sm font-semibold text-slate-100">Selected record</p>
        <p className="mt-3 text-sm text-slate-300">No record selected. Choose a row to inspect inventory constraints and usage posture.</p>
      </ControlPanel>
    );
  }

  const heading = (
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-slate-400">Selected record</p>
        <h3 className="mt-2 text-lg font-semibold text-slate-100">{record.title}</h3>
      </div>
      {keyName === "email" ? <SourceRatingBadge value={record.status} /> : <StatusBadge tone={toneForStatus(record.status)}>{formatLabel(record.status)}</StatusBadge>}
    </div>
  );

  if (record.kind === "learning") {
    const insight = record.source as LearningInsight;
    const payload = learningPayload(insight);
    return (
      <ControlPanel className="p-4">
        {heading}
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
  const [activeFilter, setActiveFilter] = useState(config.filters[config.filters.length - 1] ?? "All");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [demoNotice, setDemoNotice] = useState<string | null>(null);

  const allRows = useMemo(() => rowsFor(key), [key]);
  const filteredRows = useMemo(() => allRows.filter((row) => rowMatchesFilter(key, row, activeFilter)), [activeFilter, allRows, key]);
  const resolvedSelectedId = useMemo(() => {
    if (!filteredRows.length) return null;
    if (selectedId && filteredRows.some((row) => row.id === selectedId)) return selectedId;
    return filteredRows[0].id;
  }, [filteredRows, selectedId]);
  const selectedRecord = filteredRows.find((row) => row.id === resolvedSelectedId);

  return (
    <div className="space-y-5">
      <SectionHeader
        eyebrow="Library inventory"
        title={config.title}
        description={config.summary}
        actions={
          <>
            <button className="focus-ring" onClick={() => setDemoNotice("Demo: Add record flow is placeholder until Convex inventory writes are enabled.")} type="button">
              <Button>
                <BookOpen className="mr-2 h-4 w-4" />
                Add record
              </Button>
            </button>
            <button className="focus-ring" onClick={() => setDemoNotice("Demo: Advanced filter drawer not wired; use chips to scope inventory.")} type="button">
              <Button variant="secondary">
                <Filter className="mr-2 h-4 w-4" />
                Filter
              </Button>
            </button>
            <button className="focus-ring" onClick={() => setDemoNotice("Demo: Search scopes seeded records only in this build.")} type="button">
              <Button variant="secondary">
                <Search className="mr-2 h-4 w-4" />
                Search
              </Button>
            </button>
          </>
        }
      />

      {demoNotice ? (
        <ControlPanel className="border-sky-500/30 bg-sky-500/10 p-3 text-sm text-sky-100">{demoNotice}</ControlPanel>
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
            {filteredRows.map((row) => {
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
                              setDemoNotice(`Demo: ${cell} action queued for ${row.title}.`);
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
          <SelectedRecordPanel keyName={key} record={selectedRecord} />
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
