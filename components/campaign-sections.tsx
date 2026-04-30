import Link from "next/link";
import { ArrowRight, Bot, CheckCircle2, ClipboardCheck, MailCheck, MessageCircle, Send, ShieldCheck, TrendingUp } from "lucide-react";
import { approvals, auditEvents, campaigns, integrations, learningInsights, libraryItems, performanceSnapshots, responses, users } from "@/lib/data/demo-data";
import type { Campaign } from "@/lib/domain";
import { Card, Pill, Button } from "@/components/ui";

const statusTone: Record<string, string> = {
  needs_bari_review: "amber",
  needs_blue_review: "red",
  ready_for_keap: "green",
  agent_drafting: "blue",
  intake_draft: "gray",
};

function formatStatus(status: string) {
  return status.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function ownerName(campaign: Campaign) {
  return users.find((user) => user.id === campaign.ownerId)?.name ?? "Unassigned";
}

function offerName(campaign: Campaign) {
  return libraryItems.find((item) => item.id === campaign.offerId)?.name ?? "No offer selected";
}

function campaignApprovals(campaignId: string) {
  return approvals.filter((approval) => approval.campaignId === campaignId);
}

export function DashboardSection() {
  const needsBari = approvals.filter((approval) => approval.owner === "bari" && approval.status === "pending");
  const needsBlue = approvals.filter((approval) => approval.owner === "blue" && approval.status === "pending");
  const readyForKeap = campaigns.filter((campaign) => campaign.status === "ready_for_keap");
  const manualIntegrations = integrations.filter((integration) => integration.status === "manual_mode" || integration.status === "missing_credentials");

  const cards = [
    { title: "Needs Bari", value: needsBari.length, icon: MailCheck, tone: "amber", href: "/reviews/bari" },
    { title: "Needs Blue", value: needsBlue.length, icon: ShieldCheck, tone: "red", href: "/reviews/blue" },
    { title: "Ready to Send", value: readyForKeap.length, icon: Send, tone: "green", href: "/operations/keap" },
    { title: "Replies Needing Attention", value: responses.length, icon: MessageCircle, tone: "blue", href: "/intelligence/responses" },
    { title: "Learning Opportunities", value: learningInsights.filter((item) => item.status === "candidate").length, icon: TrendingUp, tone: "purple", href: "/libraries/learning" },
    { title: "Integration Setup Items", value: manualIntegrations.length, icon: ClipboardCheck, tone: "gray", href: "/operations/integrations" },
  ];

  return (
    <div className="space-y-8">
      <section className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Link key={card.title} href={card.href}>
              <Card className="h-full transition hover:-translate-y-0.5 hover:bg-white">
                <div className="flex items-center justify-between gap-3">
                  <Pill tone={card.tone}>{card.title}</Pill>
                  <Icon className="h-5 w-5 text-[#647094]" />
                </div>
                <p className="mt-4 text-4xl font-bold text-[#172033]">{card.value}</p>
                <p className="mt-2 text-xs text-[#6f7685]">Open focused queue</p>
              </Card>
            </Link>
          );
        })}
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
        <Card>
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold text-[#172033]">Campaigns needing action</h3>
              <p className="mt-2 text-sm text-[#6f7685]">Seeded lifecycle records show status, risk, pending approvals, and next action.</p>
            </div>
            <Link href="/campaigns"><Button variant="secondary">View all</Button></Link>
          </div>
          <div className="mt-5 grid gap-3">
            {campaigns.map((campaign) => <CampaignRow key={campaign.id} campaign={campaign} compact />)}
          </div>
        </Card>
        <Card>
          <h3 className="text-xl font-bold text-[#172033]">Recent activity</h3>
          <div className="mt-5 space-y-4">
            {auditEvents.map((event) => (
              <div className="rounded-2xl border border-[#eadfce] bg-white/70 p-4" key={event.id}>
                <p className="text-sm font-semibold text-[#172033]">{event.actor} {event.action}</p>
                <p className="mt-1 text-sm text-[#6f7685]">{event.target}</p>
              </div>
            ))}
          </div>
        </Card>
      </section>
    </div>
  );
}

function CampaignRow({ campaign, compact = false }: { campaign: Campaign; compact?: boolean }) {
  return (
    <Link href={`/campaigns/${campaign.id}`} className="block rounded-3xl border border-[#eadfce] bg-white/72 p-5 transition hover:bg-white hover:shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Pill tone={statusTone[campaign.status] ?? "gray"}>{formatStatus(campaign.status)}</Pill>
            <Pill tone={campaign.riskLevel === "green" ? "green" : campaign.riskLevel === "yellow" ? "amber" : "red"}>{campaign.riskLevel} risk</Pill>
          </div>
          <h3 className="mt-3 text-lg font-bold text-[#172033]">{campaign.name}</h3>
          <p className="mt-1 text-sm text-[#6f7685]">{campaign.goal} · {campaign.audience} · {offerName(campaign)}</p>
        </div>
        <div className="min-w-0 md:max-w-sm md:text-right">
          {!compact && <p className="text-xs font-bold uppercase tracking-widest text-[#8a7357]">Owner: {ownerName(campaign)}</p>}
          <p className="mt-1 text-sm font-semibold text-[#172033]">{campaign.nextAction}</p>
          <p className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-[#4f5f8f]">Open campaign <ArrowRight className="h-4 w-4" /></p>
        </div>
      </div>
    </Link>
  );
}

export function CampaignListSection() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <Pill tone="blue">Campaign lifecycle</Pill>
          <h2 className="mt-3 text-3xl font-bold text-[#172033]">Campaigns</h2>
          <p className="mt-2 max-w-2xl text-[#6f7685]">Track every campaign from intake through agent drafting, human approval, Keap prep, response intelligence, performance, and learning.</p>
        </div>
        <Link href="/campaigns/new"><Button>Create Campaign</Button></Link>
      </div>
      <div className="grid gap-4">
        {campaigns.map((campaign) => <CampaignRow key={campaign.id} campaign={campaign} />)}
      </div>
    </div>
  );
}

export function CampaignIntakeSection() {
  const sections = [
    ["What are we trying to do?", ["Campaign name", "Campaign goal", "Campaign type"]],
    ["Who is this for?", ["Audience/segment", "Known exclusions", "Keap tag mapping"]],
    ["What are we offering?", ["Offer or lead magnet", "CTA", "Allowed claims"]],
    ["What should the audience do next?", ["Desired send window", "Primary CTA", "Success metric"]],
    ["What rules or approvals might apply?", ["Bari voice required", "Blue approval expected", "Known constraints"]],
    ["Additional context", ["Notes/context", "Reference emails", "Existing campaigns"]],
  ];

  return (
    <div className="space-y-6">
      <div>
        <Pill tone="purple">Guided intake</Pill>
        <h2 className="mt-3 text-3xl font-bold text-[#172033]">Create Campaign</h2>
        <p className="mt-2 max-w-2xl text-[#6f7685]">A non-technical campaign request flow that collects the context agents need while keeping users focused on marketing intent.</p>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {sections.map(([title, fields]) => (
          <Card key={title as string}>
            <h3 className="text-lg font-bold text-[#172033]">{title}</h3>
            <div className="mt-4 grid gap-3">
              {(fields as string[]).map((field) => (
                <label key={field} className="grid gap-1 text-sm font-semibold text-[#26324a]">
                  {field}
                  <span className="rounded-2xl border border-[#eadfce] bg-white/75 px-4 py-3 text-sm font-normal text-[#7b8190]">Demo input placeholder</span>
                </label>
              ))}
            </div>
          </Card>
        ))}
      </div>
      <Card className="flex flex-col justify-between gap-4 bg-[#172033] text-white md:flex-row md:items-center">
        <div>
          <h3 className="text-xl font-bold">Preview then run the campaign agent workflow</h3>
          <p className="mt-2 text-sm text-slate-300">Later packages will persist this intake and start the simulated or live agent graph.</p>
        </div>
        <Button>Run Campaign Agent Workflow</Button>
      </Card>
    </div>
  );
}

export function CampaignDetailSection({ campaignId }: { campaignId?: string }) {
  const campaign = campaigns.find((item) => item.id === campaignId) ?? campaigns[0];
  const relatedApprovals = campaignApprovals(campaign.id);
  const perf = performanceSnapshots.find((item) => item.campaignId === campaign.id);
  const reply = responses.find((item) => item.campaignId === campaign.id);
  const tabs = ["Overview", "Brief", "Copy", "Approvals", "Agent Runs", "Keap Prep", "Responses", "Performance", "Learning"];

  return (
    <div className="space-y-6">
      <div>
        <Link href="/campaigns" className="text-sm font-semibold text-[#4f5f8f]">← Back to campaigns</Link>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Pill tone={statusTone[campaign.status] ?? "gray"}>{formatStatus(campaign.status)}</Pill>
          <Pill tone={campaign.riskLevel === "green" ? "green" : campaign.riskLevel === "yellow" ? "amber" : "red"}>{campaign.riskLevel} risk</Pill>
        </div>
        <h2 className="mt-3 text-3xl font-bold text-[#172033]">{campaign.name}</h2>
        <p className="mt-2 max-w-3xl text-[#6f7685]">{campaign.goal} campaign for {campaign.audience}. Next action: {campaign.nextAction}</p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {tabs.map((tab) => <span key={tab} className="shrink-0 rounded-full border border-[#eadfce] bg-white/75 px-4 py-2 text-sm font-semibold text-[#26324a]">{tab}</span>)}
      </div>

      <section className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
        <Card>
          <h3 className="text-xl font-bold text-[#172033]">Overview</h3>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {[
              ["Goal", campaign.goal],
              ["Channels", campaign.channels.join(", ")],
              ["Audience", campaign.audience],
              ["Offer / Lead magnet", offerName(campaign)],
              ["Owner", ownerName(campaign)],
              ["Keap readiness", campaign.status === "ready_for_keap" ? "Ready for handoff" : "Not ready"],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-[#eadfce] bg-white/70 p-4">
                <p className="text-xs font-bold uppercase tracking-widest text-[#8a7357]">{label}</p>
                <p className="mt-2 text-sm font-semibold text-[#172033]">{value}</p>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <h3 className="text-xl font-bold text-[#172033]">Approvals and signals</h3>
          <div className="mt-5 space-y-3">
            {relatedApprovals.length ? relatedApprovals.map((approval) => (
              <div key={approval.id} className="rounded-2xl border border-[#eadfce] bg-white/70 p-4">
                <Pill tone={approval.owner === "bari" ? "amber" : approval.owner === "blue" ? "red" : "green"}>{approval.owner}</Pill>
                <p className="mt-2 text-sm font-bold text-[#172033]">{approval.title}</p>
                <p className="mt-1 text-sm text-[#6f7685]">{approval.reason}</p>
              </div>
            )) : <p className="text-sm text-[#6f7685]">No pending approval items.</p>}
            {reply && <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900"><MessageCircle className="mb-2 h-4 w-4" /> {reply.summary}</div>}
            {perf && <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900"><TrendingUp className="mb-2 h-4 w-4" /> {perf.summary}</div>}
          </div>
        </Card>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {[
          [Bot, "Agent Runs", "View strategy, copy, compliance, and router outputs for this campaign."],
          [Send, "Keap Prep", "Confirm brief, approvals, offer, audience, compliance, and export readiness."],
          [CheckCircle2, "Learning", "Review reusable insights from edits, replies, and performance."],
        ].map(([Icon, title, body]) => {
          const IconComponent = Icon as typeof Bot;
          return (
            <Card key={title as string}>
              <IconComponent className="h-5 w-5 text-[#4f5f8f]" />
              <h3 className="mt-3 text-lg font-bold text-[#172033]">{title as string}</h3>
              <p className="mt-2 text-sm leading-6 text-[#6f7685]">{body as string}</p>
            </Card>
          );
        })}
      </section>
    </div>
  );
}

export function CampaignRouteSection({ slug }: { slug?: string[] }) {
  if (slug?.[1] === "new") return <CampaignIntakeSection />;
  if (slug?.[1]) return <CampaignDetailSection campaignId={slug[1]} />;
  return <CampaignListSection />;
}
