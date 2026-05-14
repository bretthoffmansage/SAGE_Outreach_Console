import {
  BarChart3,
  Bot,
  BrainCircuit,
  ClipboardCheck,
  Database,
  FileText,
  GitBranch,
  HeartPulse,
  Inbox,
  LayoutDashboard,
  Home,
  Link2,
  MailCheck,
  Megaphone,
  MessageCircle,
  PenLine,
  PlugZap,
  Send,
  Settings,
  ShieldCheck,
  Sparkles,
  Tags,
  TrendingUp,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type NavChild = {
  title: string;
  href: string;
  icon: LucideIcon;
  description: string;
  match?: "exact" | "prefix";
  activePrefixes?: string[];
  excludedPrefixes?: string[];
};

export type NavCategory = {
  id: "home" | "campaign" | "review" | "library" | "intelligence" | "operations";
  title: string;
  icon: LucideIcon;
  defaultHref: string;
  children: NavChild[];
};

export const navGroups: NavCategory[] = [
  {
    id: "home",
    title: "Home",
    icon: Home,
    defaultHref: "/dashboard",
    children: [
      {
        title: "Today",
        href: "/dashboard",
        icon: LayoutDashboard,
        description: "Daily command center for launch tasks, readiness checks, handoffs, and follow-ups.",
        match: "exact",
      },
    ],
  },
  {
    id: "campaign",
    title: "Campaigns",
    icon: Megaphone,
    defaultHref: "/campaigns",
    children: [
      {
        title: "Campaigns",
        href: "/campaigns",
        icon: Megaphone,
        description:
          "Plan and track weekly launch packets from source asset through email, creative, social rollout, and performance learning.",
        match: "prefix",
        excludedPrefixes: ["/campaigns/new", "/campaigns/create"],
      },
      {
        title: "Create Campaign",
        href: "/campaigns/new",
        icon: PenLine,
        description: "Guided intake for a new launch packet or campaign record.",
        match: "prefix",
        activePrefixes: ["/campaigns/new", "/campaigns/create"],
      },
    ],
  },
  {
    id: "review",
    title: "Reviews",
    icon: MailCheck,
    defaultHref: "/reviews/all",
    children: [
      { title: "All Approvals", href: "/reviews/all", icon: Inbox, description: "Unified approval queue for copy, strategy, claims, and launch readiness.", match: "prefix" },
      { title: "Bari Copy Review", href: "/reviews/bari", icon: MailCheck, description: "Founder voice and high-stakes copy review when needed.", match: "prefix" },
      { title: "Blue Review", href: "/reviews/blue", icon: ShieldCheck, description: "Strategy, positioning, and major campaign direction when needed.", match: "prefix" },
      { title: "Internal Approvals", href: "/reviews/internal", icon: ClipboardCheck, description: "Operational launch readiness and handoff checks.", match: "prefix" },
    ],
  },
  {
    id: "library",
    title: "Libraries",
    icon: FileText,
    defaultHref: "/libraries",
    children: [
      {
        title: "Content Library",
        href: "/libraries",
        icon: Database,
        description: "Hub for Copy Archive, Swipe File, Voice & Style, Audience Intelligence, CTAs, playbooks, learnings, and future sync.",
        match: "exact",
      },
      { title: "Offers & Lead Magnets", href: "/libraries/offers", icon: Tags, description: "Reusable offers, lead magnets, CTAs, and conversion assets for launch packets.", match: "prefix" },
      { title: "Bari Voice Rules", href: "/libraries/voice-rules", icon: Sparkles, description: "Founder-voice and brand-sensitive guidance when Bari tone is needed.", match: "prefix" },
      { title: "Sign-off Library", href: "/libraries/signoffs", icon: PenLine, description: "Approved sign-offs and closings selectable by context and voice.", match: "prefix" },
      { title: "Audience Library", href: "/libraries/audiences", icon: Users, description: "Audience intelligence: segments, pain points, objections, motivations, exclusions.", match: "prefix" },
      { title: "Compliance Rules", href: "/libraries/compliance", icon: ShieldCheck, description: "Claims, promise, urgency, and public-facing language guardrails.", match: "prefix" },
      { title: "Learning Library", href: "/libraries/learning", icon: BrainCircuit, description: "Reusable learnings from edits, outcomes, and reviews — curated, not auto-fed.", match: "prefix" },
    ],
  },
  {
    id: "intelligence",
    title: "Intelligence",
    icon: GitBranch,
    defaultHref: "/intelligence/langgraph",
    children: [
      {
        title: "Trend Intelligence",
        href: "/intelligence/trends",
        icon: TrendingUp,
        description: "Trend signals, short-form patterns, fit/risk scoring, adaptations — manual and dry-run; connectors planned in Operations.",
        match: "prefix",
      },
      {
        title: "Copy Intelligence",
        href: "/intelligence/copy",
        icon: Sparkles,
        description: "Human-controlled multi-agent copy pipeline: angles, hooks, drafts, voice/CTA/claims review, and learning candidates — dry-run by default.",
        match: "prefix",
      },
      {
        title: "Campaign Heartbeat",
        href: "/intelligence/heartbeat",
        icon: HeartPulse,
        description: "Recent heartbeat checks: daily readiness, missing items, and tasks generated from launch packet data.",
        match: "prefix",
      },
      { title: "LangGraph Map", href: "/intelligence/langgraph", icon: GitBranch, description: "Copy Intelligence: active agents, LangGraph handoffs, dry-run tests, and human approval pauses.", match: "prefix" },
      { title: "Agent Runs", href: "/intelligence/agent-runs", icon: Bot, description: "Dry-run traces and configured activity across intelligence lanes — not autonomous execution.", match: "prefix" },
      { title: "Response Intelligence", href: "/intelligence/responses", icon: MessageCircle, description: "Inbound reply classification and draft suggestions — manual send only.", match: "prefix" },
      { title: "Performance Intelligence", href: "/intelligence/performance", icon: BarChart3, description: "Track campaign results, compare launch patterns, and turn performance evidence into reusable learnings — manual and demo until read-only integrations connect.", match: "prefix" },
      {
        title: "Platform Connector Intelligence",
        href: "/intelligence/platform-connector",
        icon: Link2,
        description: "Meta / social connector readiness and dry-run agents — feeds Performance, Trend, and Copy context without posting or ad mutations.",
        match: "prefix",
      },
    ],
  },
  {
    id: "operations",
    title: "Operations",
    icon: PlugZap,
    defaultHref: "/operations/integrations",
    children: [
      {
        title: "Integrations",
        href: "/operations/integrations",
        icon: PlugZap,
        description: "Categorized launch integrations: production, knowledge, social, email/CRM, AI/runtime — manual by default.",
        match: "prefix",
      },
      { title: "Keap Sync", href: "/operations/keap", icon: Send, description: "Keap handoff and registration prep — manual export, no auto-send.", match: "prefix" },
      {
        title: "Production Bridge",
        href: "/operations/production-bridge",
        icon: Link2,
        description: "Cached references to Production Hub, Frame.io, and future Mux assets for launch packets — manual cache, read-only planned.",
        match: "prefix",
      },
      { title: "Settings", href: "/settings", icon: Settings, description: "Auth, roles, and prompts with integration safety in mind.", match: "prefix", activePrefixes: ["/settings"] },
    ],
  },
];

export function isChildActive(pathname: string, child: NavChild) {
  const activePrefixes = child.activePrefixes?.length ? child.activePrefixes : [child.href];
  const excludedPrefixes = child.excludedPrefixes ?? [];

  if (excludedPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))) {
    return false;
  }

  if (child.match === "exact") {
    return activePrefixes.some((prefix) => pathname === prefix);
  }

  return activePrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export function getActiveNavCategory(pathname: string, groups = navGroups) {
  return groups.find((group) => group.children.some((child) => isChildActive(pathname, child))) ?? groups[0] ?? navGroups[0];
}

export function getActiveNavChild(pathname: string, category = getActiveNavCategory(pathname)) {
  return category.children.find((child) => isChildActive(pathname, child)) ?? category.children[0];
}

export function findNavChildByHref(href: string) {
  return navGroups.flatMap((group) => group.children).find((child) => child.href === href);
}
