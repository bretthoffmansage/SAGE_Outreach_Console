import { campaigns, integrations, responses } from "@/lib/data/demo-data";
import type { TodayTaskRecord } from "@/lib/domain";

function destinationModeForRoute(route: string): TodayTaskRecord["destinationMode"] {
  if (route.startsWith("/reviews")) return "review";
  if (route.startsWith("/libraries")) return "library";
  if (route.startsWith("/intelligence")) return "intelligence";
  if (route.startsWith("/operations")) return "operations";
  return "campaign";
}

export function buildDefaultTodayTasks(now = Date.now()): TodayTaskRecord[] {
  const firstResponse = responses[0];
  const firstCampaign = campaigns[0];
  const firstIntegrationIssue = integrations.find((integration) => integration.status === "manual_mode" || integration.status === "missing_credentials" || integration.status === "error");

  const tasks: Omit<TodayTaskRecord, "destinationMode" | "updatedAt">[] = [
    {
      taskId: "task-bari-copy-review",
      title: "Approve reactivation founder email",
      context: "Cold Lead Reactivation — May Week 2",
      category: "Bari Copy Review",
      priority: "amber",
      sourceRoute: "/reviews/bari",
      sourceLabel: "Review / Bari Copy Review",
      createdAt: now - 1000 * 60 * 70,
      status: "current",
      sortOrder: 1,
    },
    {
      taskId: "task-blue-review",
      title: "Review webinar promise and urgency language",
      context: "SAGE Webinar Invitation — June",
      category: "Blue Review",
      priority: "red",
      sourceRoute: "/reviews/blue",
      sourceLabel: "Review / Blue Review",
      createdAt: now - 1000 * 60 * 55,
      status: "current",
      sortOrder: 2,
    },
    {
      taskId: "task-internal-approval",
      title: "Confirm Keap handoff checklist",
      context: firstCampaign?.name ?? "Founder Nurture Sequence Refresh",
      category: "Internal Approval",
      priority: "amber",
      sourceRoute: "/reviews/internal",
      sourceLabel: "Review / Internal Approvals",
      createdAt: now - 1000 * 60 * 45,
      status: "current",
      sortOrder: 3,
    },
    {
      taskId: "task-response-intelligence",
      title: "Reply needed from interested lead",
      context: firstResponse?.summary ?? "Lead is interested but unsure whether SAGE is beginner-friendly",
      category: "Response Intelligence",
      priority: "amber",
      sourceRoute: "/intelligence/responses",
      sourceLabel: "Intelligence / Response Intelligence",
      createdAt: now - 1000 * 60 * 40,
      status: "current",
      sortOrder: 4,
    },
    {
      taskId: "task-integrations",
      title: "Configure missing credentials",
      context: firstIntegrationIssue ? `${firstIntegrationIssue.name} is still in manual/demo mode.` : "Some integrations are still in manual/demo mode.",
      category: "Integration",
      priority: "amber",
      sourceRoute: "/operations/integrations",
      sourceLabel: "Operations / Integrations",
      createdAt: now - 1000 * 60 * 30,
      status: "current",
      sortOrder: 5,
    },
    {
      taskId: "task-campaign-export",
      title: "Prepare manual Keap export",
      context: firstCampaign?.name ?? "Founder Nurture Sequence Refresh",
      category: "Campaign",
      priority: "green",
      sourceRoute: "/campaigns",
      sourceLabel: "Control / Campaigns",
      createdAt: now - 1000 * 60 * 20,
      status: "current",
      sortOrder: 6,
    },
  ];

  return tasks.map((task) => ({
    ...task,
    destinationMode: destinationModeForRoute(task.sourceRoute),
    updatedAt: task.createdAt,
  }));
}
