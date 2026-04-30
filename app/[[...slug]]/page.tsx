import Link from "next/link";
import { ArrowRight, CheckCircle2, CircleDashed, ExternalLink, ShieldAlert, Sparkles } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Card, Pill, Button } from "@/components/ui";
import { CampaignRouteSection, DashboardSection } from "@/components/campaign-sections";
import { ReviewRouteSection } from "@/components/review-sections";
import { LibraryRouteSection } from "@/components/library-sections";
import { IntelligenceRouteSection } from "@/components/intelligence-sections";
import { OperationsRouteSection } from "@/components/operations-sections";
import { navGroups } from "@/lib/navigation";
import { getDashboardMetrics, getIntegrationSummary, getLibraryCoverage, getWorkflowPreview } from "@/lib/data";
import { titleFromSlug } from "@/lib/utils";

const routeCopy: Record<string, { eyebrow: string; summary: string; actions: string[] }> = {
  dashboard: {
    eyebrow: "Command center",
    summary: "A focused operating view for approvals, ready-to-send work, response intelligence, integration health, and recent agent activity.",
    actions: ["Create Campaign", "Review Bari Queue", "Check Responses"],
  },
  campaigns: {
    eyebrow: "Campaign lifecycle",
    summary: "Track campaigns from intake through agent drafting, approval, Keap handoff, performance reporting, and learning.",
    actions: ["New Campaign", "Filter by Status", "Open Next Action"],
  },
  reviews: {
    eyebrow: "Human authority",
    summary: "Decision-focused review queues keep Bari, Blue, and internal reviewers out of technical clutter while preserving auditability.",
    actions: ["Approve", "Request Changes", "Save Note"],
  },
  libraries: {
    eyebrow: "Source of truth",
    summary: "Centralized offers, voice examples, sign-offs, audiences, compliance rules, and learnings guide every agent workflow.",
    actions: ["Add Record", "Review Candidate", "Filter Library"],
  },
  intelligence: {
    eyebrow: "AI and learning visibility",
    summary: "Inspect agent runs, LangGraph workflow state, HelpDesk replies, campaign matching, performance signals, and reusable insights.",
    actions: ["View Agent Output", "Open Workflow Node", "Create Learning"],
  },
  operations: {
    eyebrow: "Safe handoffs",
    summary: "Integration cards show setup state, missing credentials, manual fallbacks, sync controls, and Keap/Zapier handoff readiness.",
    actions: ["Test Connection", "Sync Now", "Manual Export"],
  },
  settings: {
    eyebrow: "Admin controls",
    summary: "Configure users, roles, agents, prompts, audit logs, and environment-safe operating controls.",
    actions: ["Manage Roles", "View Audit Logs", "Edit Prompt"],
  },
};

function sectionFor(slug?: string[]) {
  const first = slug?.[0] ?? "dashboard";
  return routeCopy[first] ?? routeCopy.dashboard;
}

export default async function Page({ params }: { params: Promise<{ slug?: string[] }> }) {
  const { slug } = await params;
  const title = titleFromSlug(slug);
  const section = sectionFor(slug);
  const isDashboard = !slug || slug[0] === "dashboard";
  const metrics = getDashboardMetrics();
  const workflow = getWorkflowPreview();
  const integrationSummary = getIntegrationSummary();
  const libraryCoverage = getLibraryCoverage();

  if (!slug || slug[0] === "dashboard") {
    return (
      <AppShell title={title}>
        <div className="mx-auto max-w-7xl space-y-8">
          <section className="glass-panel overflow-hidden rounded-[2rem] p-6 md:p-8">
            <Pill tone="purple">Command center</Pill>
            <h2 className="mt-4 max-w-3xl text-3xl font-bold tracking-tight text-[#172033] md:text-5xl">Marketing command center with human approval built in.</h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-[#5f6676] md:text-lg">A focused operating view for approvals, ready-to-send work, response intelligence, integration health, and recent agent activity.</p>
          </section>
          <DashboardSection />
        </div>
      </AppShell>
    );
  }

  if (slug[0] === "campaigns") {
    return (
      <AppShell title={title}>
        <div className="mx-auto max-w-7xl">
          <CampaignRouteSection slug={slug} />
        </div>
      </AppShell>
    );
  }

  if (slug[0] === "reviews") {
    return (
      <AppShell title={title}>
        <div className="mx-auto max-w-7xl">
          <ReviewRouteSection slug={slug} />
        </div>
      </AppShell>
    );
  }

  if (slug[0] === "libraries") {
    return (
      <AppShell title={title}>
        <div className="mx-auto max-w-7xl">
          <LibraryRouteSection slug={slug} />
        </div>
      </AppShell>
    );
  }

  if (slug[0] === "intelligence") {
    return (
      <AppShell title={title}>
        <div className="mx-auto max-w-7xl">
          <IntelligenceRouteSection slug={slug} />
        </div>
      </AppShell>
    );
  }

  if (slug[0] === "operations") {
    return (
      <AppShell title={title}>
        <div className="mx-auto max-w-7xl">
          <OperationsRouteSection slug={slug} />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title={title}>
      <div className="mx-auto max-w-7xl space-y-8">
        <section className="glass-panel overflow-hidden rounded-[2rem] p-6 md:p-8">
          <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            <div>
              <Pill tone="purple">{section.eyebrow}</Pill>
              <h2 className="mt-4 max-w-3xl text-3xl font-bold tracking-tight text-[#172033] md:text-5xl">{title === "Dashboard" ? "Marketing command center with human approval built in." : title}</h2>
              <p className="mt-4 max-w-2xl text-base leading-7 text-[#5f6676] md:text-lg">{section.summary}</p>
              <div className="mt-6 flex flex-wrap gap-3">
                {section.actions.map((action, index) => <Button key={action} variant={index === 0 ? "primary" : "secondary"}>{action}</Button>)}
              </div>
            </div>
            <Card className="bg-[#172033] text-white">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#f1d9ad]"><Sparkles className="h-4 w-4" /> Demo-safe scaffold</div>
              <p className="mt-4 text-2xl font-bold">No live credentials required.</p>
              <p className="mt-3 text-sm leading-6 text-slate-300">Clerk, Convex, OpenAI, Claude, Keap, Zapier, HelpDesk, and LangGraph are represented as setup-aware integration surfaces before live keys are configured.</p>
              <div className="mt-5 grid gap-2 text-sm">
                {["Manual fallback ready", "Secrets stay server-side", "Human approvals cannot be bypassed"].map((item) => (
                  <div className="flex items-center gap-2" key={item}><CheckCircle2 className="h-4 w-4 text-emerald-300" /> {item}</div>
                ))}
              </div>
            </Card>
          </div>
        </section>

        {isDashboard && (
          <section className="grid gap-4 md:grid-cols-4">
            {metrics.map((metric) => (
              <Card key={metric.label}>
                <Pill tone={metric.tone}>{metric.label}</Pill>
                <p className="mt-4 text-4xl font-bold text-[#172033]">{metric.value}</p>
                <p className="mt-2 text-sm text-[#6f7685]">Seed demo signal for first-build review.</p>
              </Card>
            ))}
          </section>
        )}

        <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <Card>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold text-[#172033]">Primary navigation coverage</h3>
                <p className="mt-2 text-sm leading-6 text-[#6f7685]">Every PRD navigation group has a routed placeholder in this foundation package.</p>
              </div>
              <Pill tone="green">Route shell</Pill>
            </div>
            <div className="mt-5 space-y-4">
              {navGroups.map((group) => (
                <div key={group.title}>
                  <p className="text-xs font-bold uppercase tracking-widest text-[#8a7357]">{group.title}</p>
                  <div className="mt-2 grid gap-2">
                    {group.items.slice(0, 4).map((item) => (
                      <Link href={item.href} key={item.href} className="flex items-center justify-between rounded-2xl border border-[#eadfce] bg-white/70 px-4 py-3 text-sm transition hover:bg-white">
                        <span><span className="font-semibold text-[#172033]">{item.title}</span><span className="block text-xs text-[#6f7685]">{item.description}</span></span>
                        <ArrowRight className="h-4 w-4 text-[#8a7357]" />
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold text-[#172033]">Agent workflow preview</h3>
                <p className="mt-2 text-sm leading-6 text-[#6f7685]">A visual placeholder for the specialist-agent path that later packages will connect to stored runs and node output.</p>
              </div>
              <Pill tone="purple">LangGraph ready</Pill>
            </div>
            <div className="mt-6 grid gap-3 md:grid-cols-2">
              {workflow.map((node) => (
                <div key={node.label} className="rounded-2xl border border-[#eadfce] bg-[#fffaf2] p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-[#172033]">{node.label}</span>
                    {node.status === "complete" ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <CircleDashed className="h-4 w-4 text-[#8a7357]" />}
                  </div>
                  <p className="mt-2 text-xs leading-5 text-[#6f7685]">Stores input snapshot, structured output, risk, confidence, and approval implications.</p>
                </div>
              ))}
            </div>
            <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              <div className="flex gap-2 font-semibold"><ShieldAlert className="h-4 w-4" /> Human approval checkpoint</div>
              <p className="mt-2 leading-6">Risky offers, Bari voice copy, claims, discounts, and blocked compliance checks route to humans before Keap/Zapier handoff.</p>
            </div>
          </Card>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {[
            ["Clerk auth shell", "Role-aware navigation and production key placeholders.", "blue"],
            ["Convex-ready data", `${libraryCoverage.total} library records, ${libraryCoverage.blockingRules} blocking rules, and ${libraryCoverage.candidates} learning candidate are seeded.`, "purple"],
            ["Manual fallbacks", `${integrationSummary.manualMode} integrations are in manual mode and ${integrationSummary.missingCredentials} await credentials without breaking demo use.`, "green"],
          ].map(([heading, body, tone]) => (
            <Card key={heading}>
              <Pill tone={tone}>{heading}</Pill>
              <p className="mt-4 text-sm leading-6 text-[#5f6676]">{body}</p>
              <div className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#172033]">View setup path <ExternalLink className="h-4 w-4" /></div>
            </Card>
          ))}
        </section>
      </div>
    </AppShell>
  );
}
