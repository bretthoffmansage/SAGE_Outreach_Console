"use client";

import Link from "next/link";
import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { useEffect, useMemo, useState } from "react";
import { Check, Diff, FileWarning, MessageSquare, PencilLine, ShieldAlert, X } from "lucide-react";
import { campaigns, libraryItems } from "@/lib/data/demo-data";
import type { ApprovalItem } from "@/lib/domain";
import { canApproveReviewItem, roleLabel } from "@/lib/auth";
import { useAppUser } from "@/components/auth/app-user-context";
import { Button, ControlPanel, Pill, QueueLane, SectionHeader, SignalList, StatusBadge } from "@/components/ui";
import { cn } from "@/lib/utils";

type ReviewMode = "bari" | "blue" | "internal" | "all";

function riskDisplayLabel(risk: ApprovalItem["riskLevel"]) {
  if (risk === "green") return "Low";
  if (risk === "yellow") return "Medium";
  if (risk === "red") return "High";
  return "—";
}

function statusDisplayLabel(status: ApprovalItem["status"]) {
  const map: Record<string, string> = {
    pending: "Pending review",
    approved: "Approved",
    approved_with_changes: "Approved with edits",
    changes_requested: "Changes requested",
    rejected: "Rejected",
    blocked: "Blocked",
  };
  return map[status] ?? status.replace(/_/g, " ");
}

function reviewLaneLabel(owner: ApprovalItem["owner"]) {
  if (owner === "bari") return "Founder Voice / Bari";
  if (owner === "blue") return "Strategy / Blue";
  return "Internal Readiness";
}

function reviewLaneShort(owner: string) {
  if (owner === "bari") return "Bari";
  if (owner === "blue") return "Blue";
  if (owner === "internal") return "Internal";
  return owner;
}

function recommendedDecisionLabel(raw: string) {
  return raw.replace(/_/g, " ");
}

function toApprovalItem(record: {
  approvalId: string;
  type: string;
  owner: "bari" | "blue" | "internal";
  queue: "bari" | "blue" | "internal";
  linkedCampaignId?: string;
  linkedCampaignName: string;
  title: string;
  description: string;
  context?: string;
  status: ApprovalItem["status"];
  riskLevel: ApprovalItem["riskLevel"];
  recommendedDecision: string;
  actionNeeded: string;
  selectedSignoff?: string;
  subjectLine?: string;
  previewText?: string;
  bodyText?: string;
  editedSubjectLine?: string;
  editedPreviewText?: string;
  editedBodyText?: string;
  notes?: string;
  decisionNotes?: string;
  requestedChanges?: string;
  createdAt: number;
  updatedAt: number;
  decidedAt?: number;
  decidedBy?: string;
  sortOrder: number;
}): ApprovalItem {
  return {
    id: record.approvalId,
    type: record.type,
    owner: record.owner,
    queue: record.queue,
    campaignId: record.linkedCampaignId,
    campaignName: record.linkedCampaignName,
    title: record.title,
    reason: record.description,
    context: record.context,
    status: record.status,
    riskLevel: record.riskLevel,
    recommendedDecision: record.recommendedDecision,
    actionNeeded: record.actionNeeded,
    selectedSignoff: record.selectedSignoff,
    subjectLine: record.subjectLine,
    previewText: record.previewText,
    bodyText: record.bodyText,
    editedSubjectLine: record.editedSubjectLine,
    editedPreviewText: record.editedPreviewText,
    editedBodyText: record.editedBodyText,
    notes: record.notes,
    decisionNotes: record.decisionNotes,
    requestedChanges: record.requestedChanges,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    decidedAt: record.decidedAt,
    decidedBy: record.decidedBy,
    sortOrder: record.sortOrder,
  };
}

function campaignFor(approval: ApprovalItem) {
  return campaigns.find((campaign) => campaign.id === approval.campaignId);
}

function campaignNameFor(approval: ApprovalItem) {
  return campaignFor(approval)?.name ?? approval.campaignName;
}

function offerFor(approval: ApprovalItem) {
  const campaign = campaignFor(approval);
  return libraryItems.find((item) => item.id === campaign?.offerId)?.name ?? "No offer selected";
}

function toneFor(owner: string, risk?: string) {
  if (risk === "red") return "red";
  if (owner === "bari") return "amber";
  if (owner === "blue") return "blue";
  if (owner === "internal") return "green";
  return "gray";
}

function modeConfig(mode: ReviewMode) {
  if (mode === "bari") {
    return {
      title: "Bari Copy Review",
      tone: "amber",
      description:
        "Founder-voice and important copy review. Use Bari when the message needs founder tone, emotional clarity, or sensitive brand judgment. Routine launch work should stay with internal operators unless founder voice is truly needed — Bari is an escalation, not a default gate on every task.",
    };
  }
  if (mode === "blue") {
    return {
      title: "Blue Review",
      tone: "blue",
      description:
        "Strategy, positioning, claims, and big campaign direction. Use Blue for major decisions, strategic clarity, public claims, offer direction, or event positioning that changes the promise. Routine launch execution should not wait on Blue unless the item is strategically sensitive — nothing auto-sends, auto-posts, or auto-publishes from these decisions.",
    };
  }
  if (mode === "internal") {
    return {
      title: "Internal Approvals",
      tone: "green",
      description:
        "Operational readiness and launch packet checks. Confirm the packet can move forward: source asset, YouTube scheduling, Emailmarketing.com handoff, creative handoff, social rollout, review gates, and manual registration or CRM tracking if needed. External systems stay manual until intentionally connected.",
    };
  }
  return {
    title: "All Approvals",
    tone: "purple",
    description:
      "Human approval center for launch packets: copy, strategy, claims, and readiness. Nothing auto-sends, auto-posts, or auto-publishes from this page. Bari and Blue are escalation reviewers; internal review handles routine launch readiness.",
  };
}

function pendingApprovalsFor(items: ApprovalItem[], mode: ReviewMode) {
  const pending = items.filter((item) => item.status === "pending");
  if (mode === "all") return pending;
  return pending.filter((item) => item.owner === mode);
}

function ReviewQueueList({
  activeApproval,
  items,
  onSelect,
}: {
  activeApproval?: ApprovalItem;
  items: ApprovalItem[];
  onSelect: (approval: ApprovalItem) => void;
}) {
  return (
    <div className="space-y-2">
      {items.map((approval) => (
        <button
          key={approval.id}
          onClick={() => onSelect(approval)}
          type="button"
          className={`block rounded-lg border px-3 py-3 text-left transition-colors ${activeApproval?.id === approval.id ? "border-sky-500/40 bg-slate-900 shadow-[inset_2px_0_0_0_rgba(56,189,248,0.9)]" : "border-slate-800 bg-slate-950/70 hover:bg-slate-900/70"}`}
        >
          <div className="flex items-center justify-between gap-3">
            <Pill tone={toneFor(approval.owner, approval.riskLevel)}>{reviewLaneShort(approval.owner)}</Pill>
            <StatusBadge tone={toneFor(approval.owner, approval.riskLevel)}>{riskDisplayLabel(approval.riskLevel)}</StatusBadge>
          </div>
          <p className="mt-3 text-sm font-semibold text-slate-100">{approval.title}</p>
          <p className="mt-1 text-xs leading-5 text-slate-400">{campaignNameFor(approval)}</p>
          <p className="mt-2 text-xs font-medium text-sky-300">Open in {reviewLaneLabel(approval.owner)}</p>
        </button>
      ))}
    </div>
  );
}

const inputStyles = "rounded-lg border border-slate-700 bg-slate-950/90 px-3 py-3 text-sm text-slate-100 outline-none";
const textareaStyles = "min-h-[5rem] rounded-lg border border-slate-700 bg-slate-950/90 px-3 py-2 text-sm text-slate-100 outline-none";

function BariReviewConsole({
  items,
  actorLabel,
  actionsDisabled,
  onApprove,
  onApproveWithEdits,
  onSaveNote,
  onRequestChanges,
  onReject,
}: {
  items: ApprovalItem[];
  actorLabel: string;
  actionsDisabled: boolean;
  onApprove: (approval: ApprovalItem, payload: { notes?: string }) => Promise<void>;
  onApproveWithEdits: (approval: ApprovalItem, payload: { editedSubjectLine?: string; editedPreviewText?: string; editedBodyText?: string; selectedSignoff?: string; decisionNotes?: string; notes?: string }) => Promise<void>;
  onSaveNote: (approval: ApprovalItem, notes: string) => Promise<void>;
  onRequestChanges: (approval: ApprovalItem, payload: { requestedChanges?: string; notes?: string }) => Promise<void>;
  onReject: (approval: ApprovalItem, payload: { decisionNotes?: string; notes?: string }) => Promise<void>;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(items[0]?.id ?? null);
  const [subjectLine, setSubjectLine] = useState("");
  const [previewText, setPreviewText] = useState("");
  const [bodyText, setBodyText] = useState("");
  const [selectedSignoff, setSelectedSignoff] = useState("");
  const [note, setNote] = useState("");
  const [saveGuidance, setSaveGuidance] = useState(true);
  const [feedback, setFeedback] = useState<string | null>(null);
  const active = useMemo(() => items.find((item) => item.id === selectedId) ?? items[0], [items, selectedId]);
  const campaign = active ? campaignFor(active) : undefined;

  useEffect(() => {
    setSubjectLine(active?.editedSubjectLine ?? active?.subjectLine ?? "");
    setPreviewText(active?.editedPreviewText ?? active?.previewText ?? "");
    setBodyText(active?.editedBodyText ?? active?.bodyText ?? "");
    setSelectedSignoff(active?.selectedSignoff ?? "You can do this — Bari");
    setNote(active?.notes ?? "");
    setFeedback(null);
  }, [active]);

  if (!active) {
    return (
      <ControlPanel className="p-6">
        <p className="text-lg font-semibold text-slate-100">No founder voice reviews queued.</p>
        <p className="mt-2 text-sm leading-6 text-slate-400">
          Bari review appears only when founder voice, sign-off, or important public copy needs escalation. Routine launch work stays with internal operators.
        </p>
      </ControlPanel>
    );
  }

  return (
    <section className="grid gap-4 xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1.35fr)_minmax(0,0.95fr)]">
      <QueueLane
        count={items.length}
        subtitle="Bari reviews founder voice, sign-offs, and high-value public copy only when escalation is needed."
        title="Founder Voice Queue"
        tone="amber"
      >
        <ReviewQueueList activeApproval={active} items={items} onSelect={(approval) => setSelectedId(approval.id)} />
      </QueueLane>
      <ControlPanel className="p-4">
        <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-slate-400">Copy Workspace</p>
            <h3 className="mt-1 text-lg font-semibold text-slate-100">{active.title}</h3>
            <p className="mt-1 text-sm text-slate-300">
              Review founder-signed or high-stakes copy. Edits stay in the console until humans approve — nothing auto-sends, posts, or publishes.
            </p>
          </div>
          <StatusBadge tone="amber">Voice confidence 74%</StatusBadge>
        </div>
        <p className="mt-3 text-xs text-slate-400">Click any field to edit.</p>
        <div className="mt-4 grid gap-3">
          <label className="grid gap-2">
            <span className="text-[0.62rem] font-bold uppercase tracking-[0.18em] text-slate-400">Subject</span>
            <input className={inputStyles} onChange={(event) => setSubjectLine(event.target.value)} value={subjectLine} />
          </label>
          <label className="grid gap-2">
            <span className="text-[0.62rem] font-bold uppercase tracking-[0.18em] text-slate-400">Preview</span>
            <input className={inputStyles} onChange={(event) => setPreviewText(event.target.value)} value={previewText} />
          </label>
          <label className="grid gap-2">
            <span className="text-[0.62rem] font-bold uppercase tracking-[0.18em] text-slate-400">Body</span>
            <textarea className="min-h-[13rem] rounded-lg border border-slate-700 bg-slate-950/90 px-3 py-3 text-sm leading-6 text-slate-100 outline-none" onChange={(event) => setBodyText(event.target.value)} value={bodyText} />
          </label>
          <label className="grid gap-2">
            <span className="text-[0.62rem] font-bold uppercase tracking-[0.18em] text-slate-400">Selected sign-off</span>
            <input className={inputStyles} onChange={(event) => setSelectedSignoff(event.target.value)} value={selectedSignoff} />
          </label>
        </div>
        <label className="mt-4 flex items-start gap-2 text-sm text-slate-300">
          <input checked={saveGuidance} className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-600 bg-slate-900" onChange={(event) => setSaveGuidance(event.target.checked)} type="checkbox" />
          <span>
            <span className="font-medium text-slate-200">Save these edits as a guidance candidate</span>
            <span className="mt-1 block text-xs leading-5 text-slate-500">
              Creates a candidate for future voice guidance. It still needs human review before becoming trusted library context — not automatically trusted.
            </span>
          </span>
        </label>
        <label className="mt-3 grid gap-2">
          <span className="text-[0.62rem] font-bold uppercase tracking-[0.18em] text-slate-400">Review note</span>
          <textarea className={textareaStyles} onChange={(event) => setNote(event.target.value)} placeholder="Notes for operators, launch packet, or learning loop…" value={note} />
        </label>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            disabled={actionsDisabled}
            onClick={() => void onApprove(active, { notes: note }).then(() => setFeedback("Approval saved.")).catch(() => setFeedback("Unable to update approval. Check Convex connection."))}
            type="button"
          >
            <Button><Check className="mr-2 h-4 w-4" /> Approve</Button>
          </button>
          <button
            disabled={actionsDisabled}
            onClick={() =>
              void onApproveWithEdits(active, {
                editedSubjectLine: subjectLine,
                editedPreviewText: previewText,
                editedBodyText: bodyText,
                selectedSignoff,
                decisionNotes: saveGuidance ? `${note}${note ? "\n\n" : ""}Save as guidance` : note,
                notes: note,
              }).then(() => setFeedback("Approval saved.")).catch(() => setFeedback("Unable to update approval. Check Convex connection."))
            }
            type="button"
          >
            <Button variant="secondary"><PencilLine className="mr-2 h-4 w-4" /> Approve with my edits</Button>
          </button>
          <button
            disabled={actionsDisabled}
            onClick={() => void onSaveNote(active, note).then(() => setFeedback("Approval saved.")).catch(() => setFeedback("Unable to update approval. Check Convex connection."))}
            type="button"
          >
            <Button variant="secondary">Save note</Button>
          </button>
          <button
            disabled={actionsDisabled}
            onClick={() =>
              void onRequestChanges(active, { requestedChanges: note || "Revise founder voice and sign-off pattern.", notes: note }).then(() => setFeedback("Changes requested.")).catch(() => setFeedback("Unable to update approval. Check Convex connection."))
            }
            type="button"
          >
            <Button variant="secondary">Send back for changes</Button>
          </button>
          <button
            disabled={actionsDisabled}
            onClick={() => void onReject(active, { decisionNotes: note || "Rejected and returned to draft queue.", notes: note }).then(() => setFeedback("Approval saved.")).catch(() => setFeedback("Unable to update approval. Check Convex connection."))}
            type="button"
          >
            <Button variant="danger"><X className="mr-2 h-4 w-4" /> Reject</Button>
          </button>
        </div>
        {actionsDisabled ? <p className="mt-3 text-sm text-amber-200">{actorLabel} can review this queue, but only Bari, an operator, or an admin can change approval status.</p> : null}
        {feedback ? <p className="mt-3 text-sm text-sky-200">{feedback}</p> : null}
      </ControlPanel>
      <div className="grid gap-4">
        <QueueLane count="6" subtitle="Signals support review — not automatic approval." title="Voice checks" tone="amber">
          <SignalList
            items={[
              { label: "Voice confidence", value: "74%", tone: "amber", detail: "Close to approved founder tone." },
              { label: "SAGE capitalization", value: "Pass", tone: "green", detail: "All instances use approved capitalization." },
              { label: "Blocking terms", value: "0", tone: "green", detail: "No current blocked phrase violations." },
              { label: "Approved sign-off", value: selectedSignoff, tone: "green", detail: "Selected sign-off matches approved family." },
              { label: "Source examples used", value: "2", tone: "blue", detail: "Bari-approved weekly launch email and gold source message." },
              { label: "Rules applied", value: "3", tone: "blue", detail: "Short paragraphs, direct encouragement, no corporate phrasing." },
            ]}
          />
        </QueueLane>
        <ControlPanel className="p-4">
          <div className="flex items-center gap-2">
            <Diff className="h-4 w-4 text-sky-300" />
            <p className="text-sm font-semibold text-slate-100">Before / after diff</p>
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-slate-800 bg-slate-950/70 px-3 py-3">
              <p className="text-[0.62rem] font-bold uppercase tracking-[0.18em] text-slate-500">Before</p>
              <p className="mt-2 text-sm leading-6 text-slate-300">{active.subjectLine ?? "Original founder draft subject."}</p>
            </div>
            <div className="rounded-lg border border-slate-800 bg-slate-950/70 px-3 py-3">
              <p className="text-[0.62rem] font-bold uppercase tracking-[0.18em] text-slate-500">After</p>
              <p className="mt-2 text-sm leading-6 text-slate-300">{subjectLine || "No subject set."}</p>
            </div>
          </div>
          <div className="mt-3 rounded-lg border border-slate-800 bg-slate-950/70 px-3 py-3 text-sm leading-6 text-slate-300">
            <p className="text-[0.62rem] font-bold uppercase tracking-[0.18em] text-slate-500">Learning candidate</p>
            <p className="mt-2">
              Example note: grounded encouragement and short CTA framing. {saveGuidance ? "This review is set to save a guidance candidate." : "Guidance candidate saving is off."} Human promotion to library is still required.
            </p>
          </div>
        </ControlPanel>
        <ControlPanel className="p-4">
          <p className="text-sm font-semibold text-slate-100">Linked launch packet</p>
          <p className="mt-2 text-sm text-slate-300">{campaignNameFor(active)}</p>
          <p className="mt-1 text-xs text-slate-400">
            {offerFor(active)} · {campaign?.audience ?? "Audience not set"}
          </p>
          {active.campaignId ? (
            <Link className="mt-3 inline-flex text-xs font-semibold uppercase tracking-[0.14em] text-sky-300 hover:text-sky-200" href={`/campaigns/${active.campaignId}`}>
              Open launch packet
            </Link>
          ) : null}
        </ControlPanel>
      </div>
    </section>
  );
}

function BlueReviewConsole({
  items,
  actorLabel,
  actionsDisabled,
  onApprove,
  onApproveWithNote,
  onRequestChanges,
  onReject,
}: {
  items: ApprovalItem[];
  actorLabel: string;
  actionsDisabled: boolean;
  onApprove: (approval: ApprovalItem, payload: { decisionNotes?: string }) => Promise<void>;
  onApproveWithNote: (approval: ApprovalItem, payload: { decisionNotes?: string }) => Promise<void>;
  onRequestChanges: (approval: ApprovalItem, payload: { requestedChanges?: string }) => Promise<void>;
  onReject: (approval: ApprovalItem, payload: { decisionNotes?: string }) => Promise<void>;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(items[0]?.id ?? null);
  const [blueNote, setBlueNote] = useState("");
  const [showNote, setShowNote] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const active = useMemo(() => items.find((item) => item.id === selectedId) ?? items[0], [items, selectedId]);
  const campaign = active ? campaignFor(active) : undefined;

  useEffect(() => {
    setBlueNote(active?.decisionNotes ?? active?.requestedChanges ?? "");
    setShowNote(Boolean(active?.decisionNotes || active?.requestedChanges));
    setFeedback(null);
  }, [active]);

  if (!active) {
    return (
      <ControlPanel className="p-6">
        <p className="text-lg font-semibold text-slate-100">No strategy reviews queued.</p>
        <p className="mt-2 text-sm leading-6 text-slate-400">
          Blue review appears only when strategy, claims, positioning, or offer direction needs escalation. Routine launch execution continues through internal readiness and manual handoffs.
        </p>
      </ControlPanel>
    );
  }

  return (
    <section className="grid gap-4 xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1.2fr)_minmax(0,0.95fr)]">
      <QueueLane count={items.length} subtitle="Strategy / Blue — escalation for positioning and claims, not every operational step." title="Strategy queue" tone="blue">
        <ReviewQueueList activeApproval={active} items={items} onSelect={(approval) => setSelectedId(approval.id)} />
      </QueueLane>
      <ControlPanel className="p-4">
        <div className="border-b border-slate-800 pb-3">
          <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-slate-400">Decision Panel</p>
          <h3 className="mt-1 text-lg font-semibold text-slate-100">Decision needed: {active.title}</h3>
          <p className="mt-2 text-sm leading-6 text-slate-300">{active.reason}</p>
        </div>
        <div className="mt-4 grid gap-3">
          {[
            ["Why this escalates to Blue", active.context ?? "Higher-risk positioning, urgency, or public promise language needs strategic sign-off before the launch packet advances."],
            ["AI recommendation", `Recommendation: ${recommendedDecisionLabel(active.recommendedDecision)}\nReason: Align claims and urgency with approved positioning before release.`],
            [
              "When approved",
              "Operators move the packet to internal readiness and handoff checks (YouTube link, Emailmarketing.com, creative, social). All steps stay human-triggered inside the console.",
            ],
            [
              "When rejected or changes requested",
              "Strategic language stays gated until humans revise and re-queue. Nothing ships externally from this decision — revisions stay in the console.",
            ],
          ].map(([label, value]) => (
            <div key={label} className="rounded-lg border border-slate-800 bg-slate-950/70 px-3 py-3">
              <p className="text-[0.62rem] font-bold uppercase tracking-[0.18em] text-slate-400">{label}</p>
              <p className="mt-2 whitespace-pre-line text-sm text-slate-100">{value}</p>
            </div>
          ))}
        </div>
        {showNote ? (
          <label className="mt-3 grid gap-2">
            <span className="text-[0.62rem] font-bold uppercase tracking-[0.18em] text-slate-400">Blue note / condition</span>
            <textarea className={textareaStyles} onChange={(event) => setBlueNote(event.target.value)} placeholder="Strategic direction, conditions, or positioning notes for operators…" value={blueNote} />
          </label>
        ) : null}
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            disabled={actionsDisabled}
            onClick={() => void onApprove(active, { decisionNotes: blueNote }).then(() => setFeedback("Approval saved.")).catch(() => setFeedback("Unable to update approval. Check Convex connection."))}
            type="button"
          >
            <Button><Check className="mr-2 h-4 w-4" /> Approve</Button>
          </button>
          <button
            disabled={actionsDisabled}
            onClick={() => {
              setShowNote(true);
              if (!blueNote.trim()) {
                setFeedback("Add Blue note, then approve.");
                return;
              }
              void onApproveWithNote(active, { decisionNotes: blueNote }).then(() => setFeedback("Approval saved.")).catch(() => setFeedback("Unable to update approval. Check Convex connection."));
            }}
            type="button"
          >
            <Button variant="secondary">Approve with note</Button>
          </button>
          <button
            disabled={actionsDisabled}
            onClick={() => {
              setShowNote(true);
              void onRequestChanges(active, { requestedChanges: blueNote || "Revise strategic claim language before release." }).then(() => setFeedback("Changes requested.")).catch(() => setFeedback("Unable to update approval. Check Convex connection."));
            }}
            type="button"
          >
            <Button variant="secondary">Request changes</Button>
          </button>
          <button
            disabled={actionsDisabled}
            onClick={() => void onReject(active, { decisionNotes: blueNote || "Rejected pending strategic revision." }).then(() => setFeedback("Approval saved.")).catch(() => setFeedback("Unable to update approval. Check Convex connection."))}
            type="button"
          >
            <Button variant="danger"><X className="mr-2 h-4 w-4" /> Reject</Button>
          </button>
        </div>
        {actionsDisabled ? <p className="mt-3 text-sm text-amber-200">{actorLabel} can view this queue, but only Blue, an operator, or an admin can decide these approvals.</p> : null}
        {feedback ? <p className="mt-3 text-sm text-sky-200">{feedback}</p> : null}
      </ControlPanel>
      <div className="grid gap-4">
        <QueueLane title="This decision affects" count="3" tone="blue" subtitle="Launch packet, offer, and audience context for positioning and claims judgment.">
          <SignalList
            items={[
              { label: "Launch packet", value: campaignNameFor(active), tone: "blue", detail: "Promise and positioning must match the packet narrative." },
              { label: "Offer / CTA", value: offerFor(active), tone: "amber", detail: "Offer language sets claim boundaries and risk." },
              { label: "Audience", value: campaign?.audience ?? "Not set", tone: "purple", detail: "Urgency and promise must match audience fit." },
            ]}
          />
        </QueueLane>
      </div>
    </section>
  );
}

function InternalReviewConsole({
  items,
  actorLabel,
  actionsDisabled,
  onApprove,
  onRequestChanges,
  onReject,
  onSaveNote,
}: {
  items: ApprovalItem[];
  actorLabel: string;
  actionsDisabled: boolean;
  onApprove: (approval: ApprovalItem, payload: { decisionNotes?: string }) => Promise<void>;
  onRequestChanges: (approval: ApprovalItem, payload: { requestedChanges?: string }) => Promise<void>;
  onReject: (approval: ApprovalItem, payload: { decisionNotes?: string }) => Promise<void>;
  onSaveNote: (approval: ApprovalItem, notes: string) => Promise<void>;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(items[0]?.id ?? null);
  const [note, setNote] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const active = useMemo(() => items.find((item) => item.id === selectedId) ?? items[0], [items, selectedId]);
  const campaign = active ? campaignFor(active) : undefined;

  useEffect(() => {
    setNote(active?.notes ?? "");
    setFeedback(null);
  }, [active]);

  if (!active) {
    return (
      <ControlPanel className="p-6">
        <p className="text-lg font-semibold text-slate-100">No internal readiness checks queued.</p>
        <p className="mt-2 text-sm leading-6 text-slate-400">
          Launch packets that need handoff or readiness confirmation will appear here. Nothing auto-sends, auto-posts, or auto-publishes from this tab.
        </p>
      </ControlPanel>
    );
  }

  return (
    <section className="grid gap-4 xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1.2fr)_minmax(0,1fr)]">
      <QueueLane
        count={items.length}
        subtitle="YouTube scheduling, Emailmarketing.com, Brandon/creative, social rollout, review gates, and manual tracking — routine internal gates."
        title="Internal queue"
        tone="green"
      >
        <ReviewQueueList activeApproval={active} items={items} onSelect={(approval) => setSelectedId(approval.id)} />
      </QueueLane>
      <ControlPanel className="p-4">
        <div className="border-b border-slate-800 pb-3">
          <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-slate-400">Launch readiness checklist</p>
          <p className="mt-2 text-sm font-semibold text-slate-100">Confirm packet handoffs before marking ready</p>
          <p className="mt-2 text-sm text-slate-300">
            Internal review confirms source asset, YouTube scheduling, Emailmarketing.com handoff, creative handoff, social rollout, and review gates. Founder voice / Bari and strategy / Blue appear only when those escalations apply — not universal blockers.
          </p>
        </div>
        <SignalList
          items={[
            { label: "Launch packet brief complete", value: "Ready", tone: "green" },
            {
              label: "Source asset selected",
              value: campaign?.sourceProductionAssetTitle ? "Ready" : "Needs check",
              tone: campaign?.sourceProductionAssetTitle ? "green" : "amber",
            },
            { label: "YouTube scheduled link attached", value: "Needs check", tone: "amber" },
            { label: "Emailmarketing.com handoff ready", value: "Needs check", tone: "amber" },
            { label: "Creative / Brandon handoff ready", value: "Needs check", tone: "amber" },
            { label: "Social rollout notes ready", value: "Ready", tone: "green" },
            {
              label: "Founder voice / Bari (if required)",
              value: active.campaignId === "camp_reactivation_may" ? "Escalation active" : "Not required",
              tone: active.campaignId === "camp_reactivation_may" ? "amber" : "green",
              detail: "Escalation only.",
            },
            {
              label: "Strategy / Blue (if required)",
              value: active.campaignId === "camp_webinar_june" ? "Escalation active" : "Not required",
              tone: active.campaignId === "camp_webinar_june" ? "amber" : "green",
              detail: "Escalation only.",
            },
            { label: "Audience / source mapping", value: "Needs check", tone: "amber" },
            {
              label: "Compliance blockers cleared",
              value: active.riskLevel === "red" ? "Blocked" : "Needs check",
              tone: active.riskLevel === "red" ? "red" : "amber",
            },
            { label: "Registration / CRM tracking (if needed)", value: "Optional", tone: "gray" },
          ]}
        />
      </ControlPanel>
      <ControlPanel className="p-4">
        <p className="text-sm font-semibold text-slate-100">Selected readiness item</p>
        <div className="mt-4 space-y-3">
          <div className="rounded-lg border border-slate-800 bg-slate-950/70 px-3 py-3">
            <p className="text-[0.62rem] font-bold uppercase tracking-[0.18em] text-slate-400">Next action</p>
            <p className="mt-2 text-sm text-slate-100">{active.actionNeeded}</p>
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-950/70 px-3 py-3">
            <p className="text-[0.62rem] font-bold uppercase tracking-[0.18em] text-slate-400">Launch packet</p>
            <p className="mt-2 text-sm text-slate-100">{campaignNameFor(active)}</p>
            {active.campaignId ? (
              <Link className="mt-2 inline-flex text-xs font-semibold uppercase tracking-[0.14em] text-sky-300 hover:text-sky-200" href={`/campaigns/${active.campaignId}`}>
                Open launch packet
              </Link>
            ) : null}
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-950/70 px-3 py-3">
            <p className="text-[0.62rem] font-bold uppercase tracking-[0.18em] text-slate-400">Readiness status</p>
            <p className="mt-2 text-sm text-slate-100">Waiting on final operator confirmation before marking the packet ready for handoff.</p>
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-950/70 px-3 py-3">
            <p className="text-[0.62rem] font-bold uppercase tracking-[0.18em] text-slate-400">Readiness context</p>
            <p className="mt-2 text-sm text-slate-300">{active.reason}</p>
          </div>
          <label className="grid gap-2 rounded-lg border border-slate-800 bg-slate-950/70 px-3 py-3">
            <span className="text-[0.62rem] font-bold uppercase tracking-[0.18em] text-slate-400">Operator note</span>
            <textarea className={textareaStyles} onChange={(event) => setNote(event.target.value)} value={note} placeholder="Confirm scheduled link, handoff notes, audience/source mapping, and any manual tracking details…" />
          </label>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button disabled={actionsDisabled} onClick={() => void onSaveNote(active, note || "Checklist item marked checked.").then(() => setFeedback("Approval saved.")).catch(() => setFeedback("Unable to update approval. Check Convex connection."))} type="button"><Button variant="secondary">Mark checked</Button></button>
          <button disabled={actionsDisabled} onClick={() => void onApprove(active, { decisionNotes: note || "Readiness approved for next step." }).then(() => setFeedback("Approval saved.")).catch(() => setFeedback("Unable to update approval. Check Convex connection."))} type="button"><Button><Check className="mr-2 h-4 w-4" /> Approve readiness</Button></button>
          <button disabled={actionsDisabled} onClick={() => void onRequestChanges(active, { requestedChanges: note || "Operational changes required before handoff." }).then(() => setFeedback("Changes requested.")).catch(() => setFeedback("Unable to update approval. Check Convex connection."))} type="button"><Button variant="secondary">Request changes</Button></button>
          <button disabled={actionsDisabled} onClick={() => void onReject(active, { decisionNotes: note || "Rejected and blocked from send readiness." }).then(() => setFeedback("Approval saved.")).catch(() => setFeedback("Unable to update approval. Check Convex connection."))} type="button"><Button variant="danger"><X className="mr-2 h-4 w-4" /> Reject</Button></button>
        </div>
        {actionsDisabled ? <p className="mt-3 text-sm text-amber-200">{actorLabel} can view readiness, but only operators and admins can complete internal approval actions.</p> : null}
        {feedback ? <p className="mt-3 text-sm text-sky-200">{feedback}</p> : null}
      </ControlPanel>
    </section>
  );
}

const ALL_APPROVAL_FILTERS = [
  { id: "all", label: "All reviews", pillTone: "purple" as const, test: (_a: ApprovalItem) => true },
  { id: "internal", label: "Internal", pillTone: "green" as const, test: (a: ApprovalItem) => a.owner === "internal" },
  { id: "bari", label: "Founder Voice / Bari", pillTone: "amber" as const, test: (a: ApprovalItem) => a.owner === "bari" },
  { id: "blue", label: "Strategy / Blue", pillTone: "blue" as const, test: (a: ApprovalItem) => a.owner === "blue" },
  { id: "high_risk", label: "High risk", pillTone: "red" as const, test: (a: ApprovalItem) => a.riskLevel === "red" },
] as const;

function shortenReviewContext(text: string, max = 140) {
  const t = text.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1).trim()}…`;
}

function AllApprovalsBoard({ items }: { items: ApprovalItem[] }) {
  const [activeFilterId, setActiveFilterId] = useState<(typeof ALL_APPROVAL_FILTERS)[number]["id"]>("all");
  const [selectedId, setSelectedId] = useState<string | null>(items[0]?.id ?? null);

  const filteredItems = useMemo(() => {
    const def = ALL_APPROVAL_FILTERS.find((f) => f.id === activeFilterId) ?? ALL_APPROVAL_FILTERS[0];
    return items.filter((a) => def.test(a));
  }, [items, activeFilterId]);

  useEffect(() => {
    if (filteredItems.length === 0) {
      setSelectedId(null);
      return;
    }
    if (!selectedId || !filteredItems.some((x) => x.id === selectedId)) {
      setSelectedId(filteredItems[0].id);
    }
  }, [filteredItems, selectedId]);

  const selected = filteredItems.find((x) => x.id === selectedId) ?? null;
  const queueEmpty = items.length === 0;
  const filterEmpty = filteredItems.length === 0;

  return (
    <section className="grid gap-4 lg:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)] lg:items-start">
      <ControlPanel className="p-4 md:p-5">
        <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-3">
          {ALL_APPROVAL_FILTERS.map((f) => (
            <button key={f.id} onClick={() => setActiveFilterId(f.id)} type="button">
              <Pill tone={activeFilterId === f.id ? f.pillTone : "gray"}>{f.label}</Pill>
            </button>
          ))}
        </div>
        <div className="mt-4 space-y-3">
          {filterEmpty ? (
            <div className="rounded-xl border border-dashed border-slate-800 bg-slate-950/50 px-4 py-10 text-center text-sm leading-6 text-slate-400">
              {queueEmpty ? (
                <>
                  <p className="font-semibold text-slate-200">No open approvals.</p>
                  <p className="mt-2">Launch packets with pending review gates will appear here.</p>
                </>
              ) : (
                <p>No approvals match this filter. Try another lane or risk view.</p>
              )}
            </div>
          ) : (
            filteredItems.map((approval) => (
              <button
                key={approval.id}
                type="button"
                onClick={() => setSelectedId(approval.id)}
                className={cn(
                  "w-full rounded-xl border px-4 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/50",
                  selectedId === approval.id
                    ? "border-sky-500/50 bg-slate-900 shadow-[inset_3px_0_0_0_rgba(56,189,248,0.85)]"
                    : "border-slate-800 bg-slate-950/70 hover:border-slate-700 hover:bg-slate-900/60",
                )}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Pill tone={toneFor(approval.owner, approval.riskLevel)}>{reviewLaneShort(approval.owner)}</Pill>
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge tone={toneFor(approval.owner, approval.riskLevel)}>{riskDisplayLabel(approval.riskLevel)}</StatusBadge>
                    <StatusBadge tone="gray">{statusDisplayLabel(approval.status)}</StatusBadge>
                  </div>
                </div>
                <p className="mt-2 text-sm font-semibold text-slate-100">{approval.title}</p>
                <p className="mt-1 text-xs text-slate-400">{campaignNameFor(approval)}</p>
                <p className="mt-2 text-xs leading-5 text-slate-500">{shortenReviewContext(`${approval.reason ?? ""}${approval.context ? ` ${approval.context}` : ""}`)}</p>
                <div className="mt-3 flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-[0.14em]">
                  <Link
                    className="text-sky-300 hover:text-sky-200"
                    href={`/reviews/${approval.owner === "internal" ? "internal" : approval.owner}`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    Open in review lane
                  </Link>
                  {approval.campaignId ? (
                    <Link className="text-slate-400 hover:text-slate-200" href={`/campaigns/${approval.campaignId}`} onClick={(e) => e.stopPropagation()}>
                      Launch packet
                    </Link>
                  ) : null}
                </div>
              </button>
            ))
          )}
        </div>
        <div className="mt-4 flex items-start gap-3 border-t border-slate-800 pt-4">
          <MessageSquare className="mt-0.5 h-4 w-4 shrink-0 text-sky-300" />
          <p className="text-xs leading-5 text-slate-400">
            Humans approve public-facing work here. Nothing auto-sends, auto-posts, or auto-publishes from this list. Use Bari or Blue only when an item truly needs founder voice or strategy escalation.
          </p>
        </div>
      </ControlPanel>
      <ControlPanel className="p-4 lg:sticky lg:top-24 lg:self-start">
        {filterEmpty || !selected ? (
          <p className="text-sm leading-6 text-slate-400">
            {queueEmpty
              ? "No open approvals. Launch packets with pending review gates will appear here."
              : "Select an approval from the list, or broaden your filter."}
          </p>
        ) : (
          <div className="space-y-5">
            <p className="text-sm font-semibold text-slate-100">Selected approval</p>
            <div>
              <p className="text-[0.65rem] font-bold uppercase tracking-[0.14em] text-slate-500">Summary</p>
              <div className="mt-2 space-y-2 text-sm text-slate-300">
                <div className="flex justify-between gap-3 border-b border-slate-800/80 py-1.5">
                  <span className="text-slate-500">Review lane</span>
                  <span className="text-right font-medium text-slate-100">{reviewLaneLabel(selected.owner)}</span>
                </div>
                <div className="flex justify-between gap-3 border-b border-slate-800/80 py-1.5">
                  <span className="text-slate-500">Risk</span>
                  <span className="text-right font-medium text-slate-100">{riskDisplayLabel(selected.riskLevel)}</span>
                </div>
                <div className="flex justify-between gap-3 border-b border-slate-800/80 py-1.5">
                  <span className="text-slate-500">Status</span>
                  <span className="text-right font-medium text-slate-100">{statusDisplayLabel(selected.status)}</span>
                </div>
                <div className="flex justify-between gap-3 py-1.5">
                  <span className="text-slate-500">Launch packet</span>
                  <span className="text-right font-medium text-slate-100">{campaignNameFor(selected)}</span>
                </div>
              </div>
            </div>
            <div>
              <p className="text-[0.65rem] font-bold uppercase tracking-[0.14em] text-slate-500">Decision needed</p>
              <div className="mt-2 space-y-3 text-sm text-slate-300">
                <p>
                  <span className="font-semibold text-slate-200">Action: </span>
                  {selected.actionNeeded ?? selected.title}
                </p>
                <p>
                  <span className="font-semibold text-slate-200">Why this gate: </span>
                  {selected.reason}
                </p>
                <p>
                  <span className="font-semibold text-slate-200">AI recommendation: </span>
                  {recommendedDecisionLabel(selected.recommendedDecision)}
                </p>
              </div>
            </div>
            <div>
              <p className="text-[0.65rem] font-bold uppercase tracking-[0.14em] text-slate-500">Next step</p>
              <p className="mt-2 text-sm text-slate-300">Open the specialized review workspace for this lane to approve, edit, or return changes.</p>
              <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                <Link href={`/reviews/${selected.owner === "internal" ? "internal" : selected.owner}`}>
                  <Button className="w-full sm:w-auto" variant="secondary">
                    Open in review lane
                  </Button>
                </Link>
                {selected.campaignId ? (
                  <Link href={`/campaigns/${selected.campaignId}`}>
                    <Button className="w-full sm:w-auto" variant="secondary">
                      Open launch packet
                    </Button>
                  </Link>
                ) : null}
              </div>
            </div>
          </div>
        )}
      </ControlPanel>
    </section>
  );
}

export function ReviewRouteSection({ slug }: { slug?: string[] }) {
  const segment = slug?.[1] ?? "all";
  const mode: ReviewMode =
    segment === "bari" || segment === "blue" || segment === "internal" || segment === "all" ? segment : "all";
  const appUser = useAppUser();
  const [seedAttempted, setSeedAttempted] = useState(false);
  const approvalRecords = useQuery(api.approvals.listApprovalItems);
  const seedDefaultApprovalItemsIfEmpty = useMutation(api.approvals.seedDefaultApprovalItemsIfEmpty);
  const upsertApprovalItem = useMutation(api.approvals.upsertApprovalItem);
  const approveApprovalItem = useMutation(api.approvals.approveApprovalItem);
  const approveApprovalItemWithEdits = useMutation(api.approvals.approveApprovalItemWithEdits);
  const requestApprovalChanges = useMutation(api.approvals.requestApprovalChanges);
  const rejectApprovalItem = useMutation(api.approvals.rejectApprovalItem);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (approvalRecords === undefined || approvalRecords.length > 0 || seedAttempted) return;
    setSeedAttempted(true);
    void seedDefaultApprovalItemsIfEmpty().catch(() => {
      setLoadError("Unable to load approval records.");
      setSeedAttempted(false);
    });
  }, [approvalRecords, seedAttempted, seedDefaultApprovalItemsIfEmpty]);

  const allItems = useMemo(() => (approvalRecords ?? []).map((record: Parameters<typeof toApprovalItem>[0]) => toApprovalItem(record)), [approvalRecords]);
  const filtered = useMemo(() => pendingApprovalsFor(allItems, mode), [allItems, mode]);
  const config = modeConfig(mode);
  const actorName = appUser.displayName;
  const currentRoleLabel = roleLabel(appUser.role);
  const bariActionsDisabled = !canApproveReviewItem(appUser.role, "bari");
  const blueActionsDisabled = !canApproveReviewItem(appUser.role, "blue");
  const internalActionsDisabled = !canApproveReviewItem(appUser.role, "internal");

  const saveNote = async (approval: ApprovalItem, notes: string) => {
    await upsertApprovalItem({
      approvalId: approval.id,
      patch: { notes },
    });
  };

  return (
    <div className="mx-auto w-full max-w-7xl space-y-5">
      <SectionHeader
        eyebrow="Human approval"
        title={config.title}
        description={config.description}
        actions={
          <>
            <StatusBadge tone={config.tone}>{filtered.length} queued</StatusBadge>
          </>
        }
      />

      {loadError ? (
        <ControlPanel className="border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-100">{loadError}</ControlPanel>
      ) : null}

      {approvalRecords === undefined ? (
        <ControlPanel className="p-6">
          <p className="text-sm text-slate-300">Loading approvals…</p>
        </ControlPanel>
      ) : null}

      {approvalRecords !== undefined && mode === "bari" ? (
        <BariReviewConsole
          actorLabel={currentRoleLabel}
          actionsDisabled={bariActionsDisabled}
          items={filtered}
          onApprove={async (approval, payload) => { await approveApprovalItem({ approvalId: approval.id, actor: actorName, notes: payload.notes }); }}
          onApproveWithEdits={async (approval, payload) => {
            await approveApprovalItemWithEdits({
              approvalId: approval.id,
              actor: actorName,
              editedSubjectLine: payload.editedSubjectLine,
              editedPreviewText: payload.editedPreviewText,
              editedBodyText: payload.editedBodyText,
              selectedSignoff: payload.selectedSignoff,
              decisionNotes: payload.decisionNotes,
              notes: payload.notes,
            });
          }}
          onSaveNote={saveNote}
          onRequestChanges={async (approval, payload) => { await requestApprovalChanges({ approvalId: approval.id, actor: actorName, requestedChanges: payload.requestedChanges, notes: payload.notes }); }}
          onReject={async (approval, payload) => { await rejectApprovalItem({ approvalId: approval.id, actor: actorName, decisionNotes: payload.decisionNotes, notes: payload.notes }); }}
        />
      ) : null}

      {approvalRecords !== undefined && mode === "blue" ? (
        <BlueReviewConsole
          actorLabel={currentRoleLabel}
          actionsDisabled={blueActionsDisabled}
          items={filtered}
          onApprove={async (approval, payload) => { await approveApprovalItem({ approvalId: approval.id, actor: actorName, decisionNotes: payload.decisionNotes }); }}
          onApproveWithNote={async (approval, payload) => { await approveApprovalItem({ approvalId: approval.id, actor: actorName, decisionNotes: payload.decisionNotes }); }}
          onRequestChanges={async (approval, payload) => { await requestApprovalChanges({ approvalId: approval.id, actor: actorName, requestedChanges: payload.requestedChanges }); }}
          onReject={async (approval, payload) => { await rejectApprovalItem({ approvalId: approval.id, actor: actorName, decisionNotes: payload.decisionNotes }); }}
        />
      ) : null}

      {approvalRecords !== undefined && mode === "internal" ? (
        <InternalReviewConsole
          actorLabel={currentRoleLabel}
          actionsDisabled={internalActionsDisabled}
          items={filtered}
          onApprove={async (approval, payload) => { await approveApprovalItem({ approvalId: approval.id, actor: actorName, decisionNotes: payload.decisionNotes }); }}
          onRequestChanges={async (approval, payload) => { await requestApprovalChanges({ approvalId: approval.id, actor: actorName, requestedChanges: payload.requestedChanges }); }}
          onReject={async (approval, payload) => { await rejectApprovalItem({ approvalId: approval.id, actor: actorName, decisionNotes: payload.decisionNotes }); }}
          onSaveNote={saveNote}
        />
      ) : null}

      {approvalRecords !== undefined && mode === "all" ? <AllApprovalsBoard items={filtered} /> : null}

      {approvalRecords !== undefined && mode === "bari" ? (
        <ControlPanel className="p-4">
          <div className="flex items-start gap-3">
            <FileWarning className="mt-0.5 h-4 w-4 text-amber-300" />
            <p className="text-sm leading-6 text-slate-300">
              Blocking terminology rules, including the SAGE capitalization rule, stay authoritative for public-facing copy. They support founder-voice quality — not a substitute for routing routine work through internal operators when escalation is unnecessary.
            </p>
          </div>
        </ControlPanel>
      ) : null}

      {approvalRecords !== undefined && mode === "blue" ? (
        <ControlPanel className="p-4">
          <div className="flex items-start gap-3">
            <ShieldAlert className="mt-0.5 h-4 w-4 text-sky-300" />
            <p className="text-sm leading-6 text-slate-300">
              Decisions are recorded here only. Operators still perform Emailmarketing.com, creative, social, and CRM follow-through manually outside the console. Nothing auto-sends or auto-publishes from Blue review.
            </p>
          </div>
        </ControlPanel>
      ) : null}
    </div>
  );
}
