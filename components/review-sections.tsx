import Link from "next/link";
import { Check, Edit3, FileText, MessageSquare, ShieldCheck, X } from "lucide-react";
import { approvals, campaigns, libraryItems } from "@/lib/data/demo-data";
import type { ApprovalItem } from "@/lib/domain";
import { Card, Pill, Button } from "@/components/ui";

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
  if (owner === "blue") return "red";
  if (owner === "internal") return "green";
  return "gray";
}

function ReviewTabs({ active }: { active: string }) {
  const tabs = active === "bari"
    ? ["Needs Copy Review", "Edited by Bari", "Approved Recently", "Requested Changes", "Voice Notes"]
    : active === "blue"
      ? ["Needs Blue Review", "Approved Recently", "Requested Changes", "Rejected", "Decision History"]
      : ["Pending", "Ready", "Returned", "Blocked", "History"];
  return <div className="flex gap-2 overflow-x-auto pb-2">{tabs.map((tab, index) => <span className="shrink-0 rounded-full border border-[#eadfce] bg-white/75 px-4 py-2 text-sm font-semibold text-[#26324a]" key={tab}>{index === 0 ? '• ' : ''}{tab}</span>)}</div>;
}

function ApprovalCard({ approval, mode }: { approval: ApprovalItem; mode: "bari" | "blue" | "internal" | "all" }) {
  const campaign = campaignFor(approval);
  return (
    <Card>
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div>
          <div className="flex flex-wrap gap-2">
            <Pill tone={toneFor(approval.owner, approval.riskLevel)}>{approval.owner}</Pill>
            <Pill tone={approval.riskLevel === "green" ? "green" : approval.riskLevel === "yellow" ? "amber" : "red"}>{approval.riskLevel} risk</Pill>
          </div>
          <h3 className="mt-3 text-xl font-bold text-[#172033]">{approval.title}</h3>
          <p className="mt-2 text-sm leading-6 text-[#6f7685]">{approval.reason}</p>
          <p className="mt-3 text-sm font-semibold text-[#26324a]">Campaign: <Link className="text-[#4f5f8f]" href={`/campaigns/${approval.campaignId}`}>{campaign?.name ?? approval.campaignId}</Link></p>
          <p className="mt-1 text-sm text-[#6f7685]">Offer/audience: {offerFor(approval)} · {campaign?.audience}</p>
        </div>
        <div className="min-w-52 rounded-2xl border border-[#eadfce] bg-[#fffaf2] p-4 text-sm">
          <p className="font-bold text-[#172033]">AI recommendation</p>
          <p className="mt-1 capitalize text-[#6f7685]">{approval.recommendedDecision.replace(/_/g, " ")}</p>
          {mode === "blue" && <p className="mt-3 text-xs leading-5 text-[#6f7685]">If approved, this decision can unblock campaign direction. If rejected, the operator should revise offer/claim language.</p>}
        </div>
      </div>
    </Card>
  );
}

function BariDetailScaffold() {
  return (
    <Card className="bg-[#172033] text-white">
      <div className="grid gap-6 lg:grid-cols-[1fr_0.8fr]">
        <div>
          <Pill tone="amber">Inline copy review scaffold</Pill>
          <h3 className="mt-4 text-2xl font-bold">Founder-voice edit workspace</h3>
          <div className="mt-5 grid gap-3">
            {["Subject line", "Preview text", "Email body", "Selected sign-off"].map((field) => <div className="rounded-2xl bg-white/10 p-4" key={field}><p className="text-sm font-semibold text-[#f1d9ad]">{field}</p><p className="mt-1 text-sm text-slate-300">Editable demo field for Bari review.</p></div>)}
          </div>
        </div>
        <div className="rounded-3xl bg-white/10 p-5">
          <h4 className="font-bold">Before / after and learning</h4>
          <p className="mt-3 text-sm leading-6 text-slate-300">Later packages will persist original AI draft, Bari-edited draft, final approved copy, diff, notes, changed phrases, and learning candidates.</p>
          <div className="mt-5 flex flex-wrap gap-2"><Button>Approve with edits</Button><Button variant="secondary">Save note</Button></div>
        </div>
      </div>
    </Card>
  );
}

function InternalChecklist() {
  const checks = ["Campaign brief complete", "Copy approved", "Bari approval complete if needed", "Blue approval complete if needed", "Offer active/approved", "Audience confirmed", "Compliance blockers cleared", "Keap export prepared"];
  return <Card><h3 className="text-xl font-bold text-[#172033]">Send readiness checklist</h3><div className="mt-4 grid gap-2 md:grid-cols-2">{checks.map((check, index) => <div className="flex items-center gap-2 rounded-2xl border border-[#eadfce] bg-white/70 p-3 text-sm" key={check}>{index < 3 ? <Check className="h-4 w-4 text-emerald-600" /> : <FileText className="h-4 w-4 text-[#8a7357]" />} {check}</div>)}</div></Card>;
}

export function ReviewRouteSection({ slug }: { slug?: string[] }) {
  const mode = (slug?.[1] ?? "all") as "bari" | "blue" | "internal" | "all";
  const filtered = mode === "all" ? approvals : approvals.filter((approval) => approval.owner === mode);
  const title = mode === "bari" ? "Bari Copy Review" : mode === "blue" ? "Blue Review" : mode === "internal" ? "Internal Approvals" : "All Approvals";
  const summary = mode === "bari"
    ? "A calm, non-technical place for Bari to read, edit inline, leave notes, and approve copy."
    : mode === "blue"
      ? "A focused decision console that explains why Blue is needed and what each decision changes."
      : mode === "internal"
        ? "Operational readiness checks before a campaign is marked ready for Keap or Zapier handoff."
        : "Unified approval queue across Bari, Blue, and internal reviewers.";

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <Pill tone={mode === "bari" ? "amber" : mode === "blue" ? "red" : mode === "internal" ? "green" : "purple"}>{title}</Pill>
          <h2 className="mt-3 text-3xl font-bold text-[#172033]">{title}</h2>
          <p className="mt-2 max-w-3xl text-[#6f7685]">{summary}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button><Check className="mr-2 h-4 w-4" /> Approve</Button>
          <Button variant="secondary"><Edit3 className="mr-2 h-4 w-4" /> Request changes</Button>
          <Button variant="secondary"><X className="mr-2 h-4 w-4" /> Reject</Button>
        </div>
      </div>
      {mode !== "all" && <ReviewTabs active={mode} />}
      {mode === "bari" && <BariDetailScaffold />}
      {mode === "internal" && <InternalChecklist />}
      <div className="grid gap-4">
        {filtered.map((approval) => <ApprovalCard key={approval.id} approval={approval} mode={mode} />)}
      </div>
      {mode === "blue" && <Card><div className="flex gap-3"><ShieldCheck className="h-5 w-5 text-[#be4b49]" /><p className="text-sm leading-6 text-[#6f7685]"><strong className="text-[#172033]">Decision history scaffold:</strong> Blue decisions will store notes, timestamp, related item, and whether the decision should guide future campaigns.</p></div></Card>}
      {mode === "all" && <Card><div className="flex gap-3"><MessageSquare className="h-5 w-5 text-[#4f5f8f]" /><p className="text-sm leading-6 text-[#6f7685]">Unified queue groups all current seeded approvals by owner, risk, status, and campaign relationship.</p></div></Card>}
    </div>
  );
}
