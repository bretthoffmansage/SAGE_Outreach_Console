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
  /** Exact pathname matches only (e.g. `/intelligence` landing without a sub-segment). */
  activeExactPaths?: string[];
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
        title: "Launch Packets",
        href: "/campaigns",
        icon: Megaphone,
        description:
          "Plan and track weekly launch packets from source asset through email, creative, social rollout, and performance learning.",
        match: "prefix",
        excludedPrefixes: ["/campaigns/new", "/campaigns/create"],
      },
      {
        title: "Create Launch Packet",
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
        description: "Hub for Copy Archive, Swipe File, Voice & Style, Audience Intelligence, Offer/CTA, playbooks, learnings, and Knowledge Sync.",
        match: "exact",
      },
      {
        title: "Offer / CTA Library",
        href: "/libraries/offers",
        icon: Tags,
        description: "Reusable offers, CTAs, event invitations, lead magnets, and conversion assets for launch packets.",
        match: "prefix",
      },
      {
        title: "Voice & Style",
        href: "/libraries/voice-rules",
        icon: Sparkles,
        description: "Founder voice, tone rules, and brand-sensitive guidance — one part of the broader voice & style system.",
        match: "prefix",
      },
      {
        title: "Sign-offs",
        href: "/libraries/signoffs",
        icon: PenLine,
        description: "Approved sign-offs and closing lines for weekly launch voice and CTA endings — trusted use stays operator-gated.",
        match: "prefix",
      },
      {
        title: "Audience Intelligence",
        href: "/libraries/audience-intelligence",
        icon: Users,
        description: "Segments, pain points, objections, motivations, exclusions, and messaging notes for launches.",
        match: "prefix",
      },
      { title: "Compliance Rules", href: "/libraries/compliance", icon: ShieldCheck, description: "Claims, promise, urgency, and public-facing language guardrails.", match: "prefix" },
      {
        title: "Campaign Learnings",
        href: "/libraries/campaign-learnings",
        icon: BrainCircuit,
        description: "Approved learnings from performance and reviews — curated, not auto-fed.",
        match: "prefix",
      },
      {
        title: "Knowledge Sync",
        href: "/libraries/knowledge-sync",
        icon: Link2,
        description: "Planned Google Drive indexing and Obsidian Markdown preview — manual until connectors ship.",
        match: "prefix",
      },
    ],
  },
  {
    id: "intelligence",
    title: "Intelligence",
    icon: GitBranch,
    defaultHref: "/intelligence/copy",
    children: [
      {
        title: "Copy Intelligence",
        href: "/intelligence/copy",
        icon: Sparkles,
        description:
          "Human-controlled multi-agent copy pipeline: angles, hooks, drafts, voice/CTA/claims review, and learning candidates — dry-run by default.",
        match: "prefix",
        activeExactPaths: ["/intelligence"],
      },
      {
        title: "Trend Intelligence",
        href: "/intelligence/trends",
        icon: TrendingUp,
        description: "Trend signals, short-form patterns, fit/risk scoring, adaptations — manual and dry-run; connectors planned in Operations.",
        match: "prefix",
      },
      {
        title: "Performance Intelligence",
        href: "/intelligence/performance",
        icon: BarChart3,
        description:
          "Track campaign results, compare launch patterns, and turn performance evidence into reusable learnings — manual and demo until read-only integrations connect.",
        match: "prefix",
      },
      {
        title: "Campaign Heartbeat",
        href: "/intelligence/heartbeat",
        icon: HeartPulse,
        description: "Audit trail for Campaign Heartbeat checks — daily execution stays on Home.",
        match: "prefix",
      },
      {
        title: "Platform Connectors",
        href: "/intelligence/platform-connector",
        icon: Link2,
        description:
          "Meta / social connector readiness and dry-run agents — feeds Performance, Trend, and Copy context without posting or ad mutations.",
        match: "prefix",
      },
      { title: "Response Intelligence", href: "/intelligence/responses", icon: MessageCircle, description: "Inbound reply classification and draft suggestions — manual send only.", match: "prefix" },
      { title: "Agent Runs", href: "/intelligence/agent-runs", icon: Bot, description: "Dry-run traces and configured activity across intelligence lanes — not autonomous execution.", match: "prefix" },
      {
        title: "Runtime Map",
        href: "/intelligence/langgraph",
        icon: GitBranch,
        description:
          "Configured and planned intelligence layers, safety modes, and handoffs — inspection and configuration view; dry-run by default.",
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
      {
        title: "Email / CRM Handoff",
        href: "/operations/keap",
        icon: Send,
        description: "Manual handoff packages for Emailmarketing.com, Keap/CRM tags, and webhook prep — no auto-send or live CRM API calls in this build.",
        match: "prefix",
      },
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

  if (child.activeExactPaths?.some((path) => pathname === path)) {
    return true;
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
