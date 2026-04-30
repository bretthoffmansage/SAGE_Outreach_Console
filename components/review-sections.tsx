"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Check, Diff, FileWarning, MessageSquare, PencilLine, ShieldAlert, X } from "lucide-react";
import { approvals, campaigns, libraryItems } from "@/lib/data/demo-data";
import type { ApprovalItem } from "@/lib/domain";
import { Button, ConsoleTable, ControlPanel, InlineAction, Pill, QueueLane, SectionHeader, SignalList, StatusBadge, Td, Th, TableHead } from "@/components/ui";

function campaignFor(approval: ApprovalItem) {
  return campaigns.find((campaign) => campaign.id === approval.campaignId);
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

function modeConfig(mode: "bari" | "blue" | "internal" | "all") {
  if (mode === "bari") return { title: "Founder Voice Review Console", tone: "amber", description: "Queue, edit, compare, and approve founder-signed copy with source rules and terminology checks." };
  if (mode === "blue") return { title: "Strategic Decision Console", tone: "blue", description: "Review high-risk positioning, claims, and decisions that require Blue’s approval before campaign release." };
  if (mode === "internal") return { title: "Send Readiness Console", tone: "green", description: "Validate final readiness, exports, handoff controls, and operational blockers before campaigns move forward." };
  return { title: "Master Approval Queue", tone: "purple", description: "Unified approval lane across Bari, Blue, and internal owners." };
}

function ReviewQueueList({
  activeApproval,
  items,
  hrefBase,
  onSelect,
}: {
  activeApproval?: ApprovalItem;
  items: ApprovalItem[];
  hrefBase: string;
  onSelect: (approval: ApprovalItem) => void;
}) {
  return (
    <div className="space-y-2">
      {items.map((approval) => (
        <button
          key={approval.id}
          onClick={() => onSelect(approval)}
          type="button"
          className={`block rounded-lg border px-3 py-3 transition-colors ${activeApproval?.id === approval.id ? "border-sky-500/40 bg-slate-900 shadow-[inset_2px_0_0_0_rgba(56,189,248,0.9)]" : "border-slate-800 bg-slate-950/70 hover:bg-slate-900/70"}`}
        >
          <div className="flex items-center justify-between gap-3">
            <Pill tone={toneFor(approval.owner, approval.riskLevel)}>{approval.owner}</Pill>
            <StatusBadge tone={toneFor(approval.owner, approval.riskLevel)}>{approval.riskLevel}</StatusBadge>
          </div>
          <p className="mt-3 text-sm font-semibold text-slate-100">{approval.title}</p>
          <p className="mt-1 text-xs leading-5 text-slate-400">{campaignFor(approval)?.name}</p>
          <p className="mt-2 text-xs text-sky-300">Open in {hrefBase.replace("/reviews/", "").replace("all", "specialized")} review</p>
        </button>
      ))}
    </div>
  );
}

function BariReviewConsole({ items }: { items: ApprovalItem[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(items[0]?.id ?? null);
  const [note, setNote] = useState("");
  const [saveGuidance, setSaveGuidance] = useState(true);
  const [feedback, setFeedback] = useState<string | null>(null);
  const active = useMemo(() => items.find((item) => item.id === selectedId) ?? items[0], [items, selectedId]);
  const campaign = active ? campaignFor(active) : undefined;
  if (!active) {
    return (
      <ControlPanel className="p-6">
        <p className="text-lg font-semibold text-slate-100">No copy needs Bari review.</p>
      </ControlPanel>
    );
  }

  return (
    <section className="grid gap-4 xl:grid-cols-[0.8fr_1.3fr_0.9fr]">
      <QueueLane title="Bari Queue" count={items.length} tone="amber" subtitle="Founder voice items waiting for human review.">
        <ReviewQueueList activeApproval={active} items={items} hrefBase="/reviews/bari" onSelect={(approval) => setSelectedId(approval.id)} />
      </QueueLane>
      <ControlPanel className="p-4">
        <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-slate-400">Copy Workspace</p>
            <h3 className="mt-1 text-lg font-semibold text-slate-100">{active?.title}</h3>
            <p className="mt-1 text-sm text-slate-300">Review this founder-signed email. Edit anything you want, then approve it or send it back.</p>
          </div>
          <StatusBadge tone="amber">Voice confidence 74%</StatusBadge>
        </div>
        <p className="mt-3 text-xs text-slate-400">Click any field to edit.</p>
        <div className="mt-4 grid gap-3">
          <label className="grid gap-2">
            <span className="text-[0.62rem] font-bold uppercase tracking-[0.18em] text-slate-400">Subject</span>
            <input className="rounded-lg border border-slate-700 bg-slate-950/90 px-3 py-3 text-sm text-slate-100 outline-none" defaultValue="You can do this, and SAGE can help you start cleanly." />
          </label>
          <label className="grid gap-2">
            <span className="text-[0.62rem] font-bold uppercase tracking-[0.18em] text-slate-400">Preview</span>
            <input className="rounded-lg border border-slate-700 bg-slate-950/90 px-3 py-3 text-sm text-slate-100 outline-none" defaultValue="A grounded note from Bari with one low-pressure next step." />
          </label>
          <label className="grid gap-2">
            <span className="text-[0.62rem] font-bold uppercase tracking-[0.18em] text-slate-400">Body</span>
            <textarea className="min-h-[13rem] rounded-lg border border-slate-700 bg-slate-950/90 px-3 py-3 text-sm leading-6 text-slate-100 outline-none" defaultValue="Short paragraph rhythm, direct encouragement, and clear CTA scaffolding appear here as editable seeded content." />
          </label>
          <label className="grid gap-2">
            <span className="text-[0.62rem] font-bold uppercase tracking-[0.18em] text-slate-400">Selected sign-off</span>
            <input className="rounded-lg border border-slate-700 bg-slate-950/90 px-3 py-3 text-sm text-slate-100 outline-none" defaultValue="You can do this — Bari" />
          </label>
        </div>
        <label className="mt-4 flex items-center gap-2 text-sm text-slate-300">
          <input checked={saveGuidance} className="h-4 w-4 rounded border-slate-600 bg-slate-900" onChange={(event) => setSaveGuidance(event.target.checked)} type="checkbox" />
          Save these edits as future guidance
        </label>
        <label className="mt-3 grid gap-2">
          <span className="text-[0.62rem] font-bold uppercase tracking-[0.18em] text-slate-400">Review note</span>
          <textarea className="min-h-[5rem] rounded-lg border border-slate-700 bg-slate-950/90 px-3 py-2 text-sm text-slate-100 outline-none" onChange={(event) => setNote(event.target.value)} placeholder="Add a note for the team or learning loop..." value={note} />
        </label>
        <div className="mt-4 flex flex-wrap gap-2">
          <button onClick={() => setFeedback("Approved for handoff to internal readiness.")} type="button"><Button><Check className="mr-2 h-4 w-4" /> Approve</Button></button>
          <button onClick={() => setFeedback(`Approved with edits${saveGuidance ? " and saved as guidance" : ""}.`)} type="button"><Button variant="secondary"><PencilLine className="mr-2 h-4 w-4" /> Approve with my edits</Button></button>
          <button onClick={() => setFeedback(note ? "Note saved to this review item." : "Add a note, then save.")} type="button"><Button variant="secondary">Save note</Button></button>
          <button onClick={() => setFeedback("Sent back for changes with Bari guidance.")} type="button"><Button variant="secondary">Send back for changes</Button></button>
          <button onClick={() => setFeedback("Rejected and returned to draft queue.")} type="button"><Button variant="danger"><X className="mr-2 h-4 w-4" /> Reject</Button></button>
        </div>
        {feedback ? <p className="mt-3 text-sm text-sky-200">{feedback}</p> : null}
      </ControlPanel>
      <div className="grid gap-4">
        <QueueLane title="Voice Checks" count="4" tone="amber" subtitle="Helpful checks for founder voice review.">
          <SignalList
            items={[
              { label: "Voice confidence", value: "74%", tone: "amber", detail: "Close to approved founder tone." },
              { label: "SAGE capitalization", value: "Pass", tone: "green", detail: "All instances use approved capitalization." },
              { label: "Blocking terms", value: "0", tone: "green", detail: "No current blocked phrase violations." },
              { label: "Approved sign-off", value: "Pass", tone: "green", detail: "Selected sign-off matches approved family." },
              { label: "Source examples used", value: "2", tone: "blue", detail: "Bari-approved nurture email and gold source message." },
              { label: "Rules applied", value: "3", tone: "blue", detail: "Short paragraphs, direct encouragement, no corporate phrasing." },
            ]}
          />
        </QueueLane>
        <ControlPanel className="p-4">
          <div className="flex items-center gap-2">
            <Diff className="h-4 w-4 text-sky-300" />
            <p className="text-sm font-semibold text-slate-100">Before / after diff</p>
          </div>
          <div className="mt-3 rounded-lg border border-slate-800 bg-slate-950/70 px-3 py-3 text-sm leading-6 text-slate-300">
            Before: more polished marketing tone. After: warmer direct language, clearer SAGE capitalization, and Bari-approved sign-off pattern.
          </div>
          <div className="mt-3 rounded-lg border border-slate-800 bg-slate-950/70 px-3 py-3 text-sm leading-6 text-slate-300">
            Learning candidate: Bari prefers grounded encouragement and short CTA framing over aspirational copy. {saveGuidance ? "This review is set to save guidance." : "Guidance saving is currently off."}
          </div>
        </ControlPanel>
        <ControlPanel className="p-4">
          <p className="text-sm font-semibold text-slate-100">Linked campaign</p>
          <p className="mt-2 text-sm text-slate-300">{campaign?.name}</p>
          <p className="mt-1 text-xs text-slate-400">{offerFor(active)} · {campaign?.audience}</p>
        </ControlPanel>
      </div>
    </section>
  );
}

function BlueReviewConsole({ items }: { items: ApprovalItem[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(items[0]?.id ?? null);
  const [blueNote, setBlueNote] = useState("");
  const [showNote, setShowNote] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const active = useMemo(() => items.find((item) => item.id === selectedId) ?? items[0], [items, selectedId]);
  const campaign = active ? campaignFor(active) : undefined;
  if (!active) {
    return (
      <ControlPanel className="p-6">
        <p className="text-lg font-semibold text-slate-100">No strategic decisions waiting for Blue.</p>
      </ControlPanel>
    );
  }

  return (
    <section className="grid gap-4 xl:grid-cols-[0.8fr_1.15fr_0.95fr]">
      <QueueLane title="Blue Queue" count={items.length} tone="blue" subtitle="Strategic decisions requiring Blue approval.">
        <ReviewQueueList activeApproval={active} items={items} hrefBase="/reviews/blue" onSelect={(approval) => setSelectedId(approval.id)} />
      </QueueLane>
      <ControlPanel className="p-4">
        <div className="border-b border-slate-800 pb-3">
          <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-slate-400">Decision Panel</p>
          <h3 className="mt-1 text-lg font-semibold text-slate-100">Decision needed: {active?.title}</h3>
          <p className="mt-2 text-sm leading-6 text-slate-300">{active?.reason}</p>
        </div>
        <div className="mt-4 grid gap-3">
          {[
            ["Why Blue is needed", "This campaign uses higher-risk positioning and urgency language."],
            ["AI recommendation", `Recommendation: ${active?.recommendedDecision?.replace(/_/g, " ") ?? "request changes"}\nReason: Higher-risk transformation language should be softened before release.`],
            ["Approval allows", "Campaign copy can proceed to internal readiness and Keap prep."],
            ["Rejection blocks", "Offer promise and CTA framing stay blocked for send."],
          ].map(([label, value]) => (
            <div key={label as string} className="rounded-lg border border-slate-800 bg-slate-950/70 px-3 py-3">
              <p className="text-[0.62rem] font-bold uppercase tracking-[0.18em] text-slate-400">{label as string}</p>
              <p className="mt-2 text-sm text-slate-100">{value as string}</p>
            </div>
          ))}
        </div>
        {showNote ? (
          <label className="mt-3 grid gap-2">
            <span className="text-[0.62rem] font-bold uppercase tracking-[0.18em] text-slate-400">Blue note / condition</span>
            <textarea className="min-h-[5rem] rounded-lg border border-slate-700 bg-slate-950/90 px-3 py-2 text-sm text-slate-100 outline-none" onChange={(event) => setBlueNote(event.target.value)} placeholder="Add Blue's condition or direction..." value={blueNote} />
          </label>
        ) : null}
        <div className="mt-4 flex flex-wrap gap-2">
          <button onClick={() => setFeedback("Approved and unblocked for internal readiness.")} type="button"><Button><Check className="mr-2 h-4 w-4" /> Approve</Button></button>
          <button onClick={() => { setShowNote(true); setFeedback(blueNote ? "Approved with Blue note saved." : "Add Blue note, then approve."); }} type="button"><Button variant="secondary">Approve with note</Button></button>
          <button onClick={() => { setShowNote(true); setFeedback("Sent back for changes with Blue direction."); }} type="button"><Button variant="secondary">Request changes</Button></button>
          <button onClick={() => setFeedback("Rejected and blocked pending strategic revision.")} type="button"><Button variant="danger"><X className="mr-2 h-4 w-4" /> Reject</Button></button>
        </div>
        {feedback ? <p className="mt-3 text-sm text-sky-200">{feedback}</p> : null}
      </ControlPanel>
      <div className="grid gap-4">
        <QueueLane title="This decision affects" count="3" tone="blue" subtitle="Campaign, offer, and audience context.">
          <SignalList
            items={[
              { label: "Campaign", value: campaign?.name ?? "Unknown", tone: "blue", detail: "Why it matters: campaign promise must match strategic positioning." },
              { label: "Offer", value: offerFor(active), tone: "amber", detail: "Why it matters: offer language controls claim boundaries and risk." },
              { label: "Audience", value: campaign?.audience ?? "Unknown", tone: "purple", detail: "Why it matters: urgency and promise must match audience fit." },
            ]}
          />
        </QueueLane>
      </div>
    </section>
  );
}

function InternalReviewConsole({ items }: { items: ApprovalItem[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(items[0]?.id ?? null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const active = useMemo(() => items.find((item) => item.id === selectedId) ?? items[0], [items, selectedId]);
  const campaign = active ? campaignFor(active) : undefined;
  if (!active) {
    return (
      <ControlPanel className="p-6">
        <p className="text-lg font-semibold text-slate-100">No send readiness checks pending.</p>
      </ControlPanel>
    );
  }

  return (
    <section className="grid gap-4 xl:grid-cols-[0.8fr_1.2fr_1fr]">
      <QueueLane title="Internal Queue" count={items.length} tone="green" subtitle="Operational readiness and handoff checks.">
        <ReviewQueueList activeApproval={active} items={items} hrefBase="/reviews/internal" onSelect={(approval) => setSelectedId(approval.id)} />
      </QueueLane>
      <ControlPanel className="p-4">
        <div className="border-b border-slate-800 pb-3">
          <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-slate-400">Send Readiness Checklist</p>
          <p className="mt-2 text-sm font-semibold text-slate-100">Status: Not ready — 2 items need confirmation</p>
          <p className="mt-2 text-sm text-slate-300">Internal approval confirms campaign, approvals, audience, compliance, and export controls are ready.</p>
        </div>
        <SignalList
          items={[
            { label: "Campaign brief complete", value: "Ready", tone: "green" },
            { label: "Copy approved", value: "Ready", tone: "green" },
            { label: "Bari approval complete", value: "Needs check", tone: "amber" },
            { label: "Blue approval complete", value: "Required", tone: "red" },
            { label: "Offer active / approved", value: "Ready", tone: "green" },
            { label: "Audience confirmed", value: "Needs check", tone: "amber" },
            { label: "Compliance blockers cleared", value: "Blocked", tone: "red" },
            { label: "Keap export prepared", value: "Manual/demo", tone: "blue" },
            { label: "Zapier/manual handoff ready", value: "Manual/demo", tone: "blue" },
          ]}
        />
      </ControlPanel>
      <ControlPanel className="p-4">
        {active ? (
          <>
            <p className="text-sm font-semibold text-slate-100">Selected readiness item</p>
            <div className="mt-4 space-y-3">
              <div className="rounded-lg border border-slate-800 bg-slate-950/70 px-3 py-3">
                <p className="text-[0.62rem] font-bold uppercase tracking-[0.18em] text-slate-400">Next action</p>
                <p className="mt-2 text-sm text-slate-100">Confirm export package and handoff notes.</p>
              </div>
              <div className="rounded-lg border border-slate-800 bg-slate-950/70 px-3 py-3">
                <p className="text-[0.62rem] font-bold uppercase tracking-[0.18em] text-slate-400">Linked campaign</p>
                <p className="mt-2 text-sm text-slate-100">{campaign?.name}</p>
              </div>
              <div className="rounded-lg border border-slate-800 bg-slate-950/70 px-3 py-3">
                <p className="text-[0.62rem] font-bold uppercase tracking-[0.18em] text-slate-400">Readiness status</p>
                <p className="mt-2 text-sm text-slate-100">Waiting on final operator confirmation and handoff review.</p>
              </div>
              <div className="rounded-lg border border-slate-800 bg-slate-950/70 px-3 py-3">
                <p className="text-[0.62rem] font-bold uppercase tracking-[0.18em] text-slate-400">Blockers</p>
                <p className="mt-2 text-sm text-slate-300">{active.reason}</p>
              </div>
              <div className="rounded-lg border border-slate-800 bg-slate-950/70 px-3 py-3">
                <p className="text-[0.62rem] font-bold uppercase tracking-[0.18em] text-slate-400">Required actions</p>
                <p className="mt-2 text-sm text-slate-300">Confirm export package, validate audience mapping, and keep manual/demo handoff notes attached.</p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <button onClick={() => setFeedback("Checklist item marked checked.")} type="button"><Button variant="secondary">Mark checked</Button></button>
              <button onClick={() => setFeedback("Handoff approved for next step.")} type="button"><Button><Check className="mr-2 h-4 w-4" /> Approve handoff</Button></button>
              <button onClick={() => setFeedback("Sent back for operational changes.")} type="button"><Button variant="secondary">Request changes</Button></button>
              <button onClick={() => setFeedback("Rejected and blocked from send readiness.")} type="button"><Button variant="danger"><X className="mr-2 h-4 w-4" /> Reject</Button></button>
            </div>
            {feedback ? <p className="mt-3 text-sm text-sky-200">{feedback}</p> : null}
          </>
        ) : (
          <>
            <p className="text-sm font-semibold text-slate-100">Controls</p>
            <p className="mt-4 rounded-lg border border-dashed border-slate-800 bg-slate-950/70 px-3 py-5 text-sm text-slate-300">Select a readiness item to review controls.</p>
          </>
        )}
      </ControlPanel>
    </section>
  );
}

function AllApprovalsTable({ items }: { items: ApprovalItem[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(items[0]?.id ?? null);
  const [activeFilter, setActiveFilter] = useState("All owners");
  const filteredItems = items.filter((approval) => {
    if (activeFilter === "All owners") return true;
    if (activeFilter === "High risk") return approval.riskLevel === "red";
    return approval.owner === activeFilter.toLowerCase();
  });
  const selected = filteredItems.find((item) => item.id === selectedId) ?? filteredItems[0];
  return (
    <section className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
      <ControlPanel className="p-4">
        <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-3">
          {["All owners", "Internal", "Bari", "Blue", "High risk"].map((filter) => (
            <button key={filter} onClick={() => setActiveFilter(filter)} type="button">
              <Pill tone={filter === "All owners" ? "purple" : filter === "Bari" ? "amber" : filter === "Blue" ? "blue" : filter === "Internal" ? "green" : "red"}>
                {filter}
              </Pill>
            </button>
          ))}
        </div>
        <ConsoleTable className="mt-4">
          <TableHead>
            <tr>
              <Th>Owner</Th>
              <Th>Type</Th>
              <Th>Risk</Th>
              <Th>Status</Th>
              <Th>Linked campaign</Th>
              <Th>Action needed</Th>
              <Th>Open</Th>
            </tr>
          </TableHead>
          <tbody>
            {filteredItems.map((approval) => (
              <tr className={selected?.id === approval.id ? "bg-slate-900/80" : ""} key={approval.id} onClick={() => setSelectedId(approval.id)}>
                <Td><StatusBadge tone={toneFor(approval.owner, approval.riskLevel)}>{approval.owner}</StatusBadge></Td>
                <Td className="text-slate-100">{approval.title}</Td>
                <Td><StatusBadge tone={toneFor(approval.owner, approval.riskLevel)}>{approval.riskLevel}</StatusBadge></Td>
                <Td className="text-slate-300">{approval.status.replace(/_/g, " ")}</Td>
                <Td className="text-slate-300">{campaignFor(approval)?.name}</Td>
                <Td className="max-w-[18rem] text-slate-300">{approval.reason}</Td>
                <Td><Link href={`/reviews/${approval.owner === "internal" ? "internal" : approval.owner}`}><InlineAction>Open</InlineAction></Link></Td>
              </tr>
            ))}
          </tbody>
        </ConsoleTable>
      </ControlPanel>
      <ControlPanel className="p-4">
        {selected ? (
          <>
            <p className="text-sm font-semibold text-slate-100">Selected approval</p>
            <div className="mt-4 space-y-3 text-sm text-slate-300">
              <div className="rounded-lg border border-slate-800 bg-slate-950/70 px-3 py-2">Owner: <span className="text-slate-100">{selected.owner}</span></div>
              <div className="rounded-lg border border-slate-800 bg-slate-950/70 px-3 py-2">Risk: <span className="text-slate-100">{selected.riskLevel}</span></div>
              <div className="rounded-lg border border-slate-800 bg-slate-950/70 px-3 py-2">Status: <span className="text-slate-100">{selected.status.replace(/_/g, " ")}</span></div>
              <div className="rounded-lg border border-slate-800 bg-slate-950/70 px-3 py-2">Linked campaign: <span className="text-slate-100">{campaignFor(selected)?.name}</span></div>
              <div className="rounded-lg border border-slate-800 bg-slate-950/70 px-3 py-2">Action needed: <span className="text-slate-100">{selected.title}</span></div>
              <div className="rounded-lg border border-slate-800 bg-slate-950/70 px-3 py-2">Why review is needed: <span className="text-slate-100">{selected.reason}</span></div>
              <div className="rounded-lg border border-slate-800 bg-slate-950/70 px-3 py-2">AI recommendation: <span className="text-slate-100">{selected.recommendedDecision.replace(/_/g, " ")}</span></div>
              <div className="rounded-lg border border-slate-800 bg-slate-950/70 px-3 py-2">
                Suggested destination:{" "}
                <Link className="text-sky-300" href={`/reviews/${selected.owner === "internal" ? "internal" : selected.owner}`}>
                  Open in {selected.owner === "bari" ? "Bari Copy Review" : selected.owner === "blue" ? "Blue Review" : "Internal Approvals"}
                </Link>
              </div>
            </div>
          </>
        ) : (
          <p className="text-sm text-slate-300">Select an approval to inspect details.</p>
        )}
      </ControlPanel>
    </section>
  );
}

export function ReviewRouteSection({ slug }: { slug?: string[] }) {
  const mode = (slug?.[1] ?? "all") as "bari" | "blue" | "internal" | "all";
  const filtered = mode === "all" ? approvals : approvals.filter((approval) => approval.owner === mode);
  const config = modeConfig(mode);

  return (
    <div className="space-y-5">
      <SectionHeader
        eyebrow="Review control"
        title={config.title}
        description={config.description}
        actions={
          <>
            <StatusBadge tone={config.tone}>{filtered.length} queued</StatusBadge>
          </>
        }
      />

      {mode === "bari" ? <BariReviewConsole items={filtered} /> : null}
      {mode === "blue" ? <BlueReviewConsole items={filtered} /> : null}
      {mode === "internal" ? <InternalReviewConsole items={filtered} /> : null}
      {mode === "all" ? <AllApprovalsTable items={filtered} /> : null}

      {mode === "all" ? (
        <ControlPanel className="p-4">
          <div className="flex items-start gap-3">
            <MessageSquare className="mt-0.5 h-4 w-4 text-sky-300" />
            <p className="text-sm leading-6 text-slate-300">Use the master queue to jump into Bari, Blue, or Internal approval consoles without losing the routed review structure.</p>
          </div>
        </ControlPanel>
      ) : null}

      {mode === "bari" ? (
        <ControlPanel className="p-4">
          <div className="flex items-start gap-3">
            <FileWarning className="mt-0.5 h-4 w-4 text-amber-300" />
            <p className="text-sm leading-6 text-slate-300">Blocking terminology rules, including the SAGE capitalization rule, remain authoritative before final campaign handoff.</p>
          </div>
        </ControlPanel>
      ) : null}

      {mode === "blue" ? (
        <ControlPanel className="p-4">
          <div className="flex items-start gap-3">
            <ShieldAlert className="mt-0.5 h-4 w-4 text-sky-300" />
            <p className="text-sm leading-6 text-slate-300">Blue decisions should clearly capture what gets unblocked, what remains blocked, and whether the decision should guide future campaigns.</p>
          </div>
        </ControlPanel>
      ) : null}
    </div>
  );
}
