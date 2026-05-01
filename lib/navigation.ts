import {
  BarChart3,
  Bot,
  BrainCircuit,
  ClipboardCheck,
  FileText,
  GitBranch,
  Inbox,
  LayoutDashboard,
  Home,
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
      { title: "Today", href: "/dashboard", icon: LayoutDashboard, description: "Today’s campaign command view.", match: "exact" },
    ],
  },
  {
    id: "campaign",
    title: "Campaign",
    icon: Megaphone,
    defaultHref: "/campaigns",
    children: [
      { title: "Campaigns", href: "/campaigns", icon: Megaphone, description: "Lifecycle, status, and next actions.", match: "prefix", excludedPrefixes: ["/campaigns/new", "/campaigns/create"] },
      { title: "Create Campaign", href: "/campaigns/new", icon: PenLine, description: "Guided campaign intake.", match: "prefix", activePrefixes: ["/campaigns/new", "/campaigns/create"] },
    ],
  },
  {
    id: "review",
    title: "Review",
    icon: MailCheck,
    defaultHref: "/reviews/all",
    children: [
      { title: "All Approvals", href: "/reviews/all", icon: Inbox, description: "Unified approval queue.", match: "prefix" },
      { title: "Bari Copy Review", href: "/reviews/bari", icon: MailCheck, description: "Founder voice review inbox.", match: "prefix" },
      { title: "Blue Review", href: "/reviews/blue", icon: ShieldCheck, description: "Strategic decision console.", match: "prefix" },
      { title: "Internal Approvals", href: "/reviews/internal", icon: ClipboardCheck, description: "Operational send readiness.", match: "prefix" },
    ],
  },
  {
    id: "library",
    title: "Library",
    icon: FileText,
    defaultHref: "/libraries/email",
    children: [
      { title: "Email Library", href: "/libraries/email", icon: FileText, description: "Historical voice examples.", match: "prefix" },
      { title: "Offers & Lead Magnets", href: "/libraries/offers", icon: Tags, description: "Approved offers and claims.", match: "prefix" },
      { title: "Bari Voice Rules", href: "/libraries/voice-rules", icon: Sparkles, description: "Founder-voice guidance.", match: "prefix" },
      { title: "Sign-off Library", href: "/libraries/signoffs", icon: PenLine, description: "Approved sign-off patterns.", match: "prefix" },
      { title: "Audience Library", href: "/libraries/audiences", icon: Users, description: "Segments and Keap mappings.", match: "prefix" },
      { title: "Compliance Rules", href: "/libraries/compliance", icon: ShieldCheck, description: "Claims and blocking rules.", match: "prefix" },
      { title: "Learning Library", href: "/libraries/learning", icon: BrainCircuit, description: "Reusable insights and candidates.", match: "prefix" },
    ],
  },
  {
    id: "intelligence",
    title: "Intelligence",
    icon: GitBranch,
    defaultHref: "/intelligence/langgraph",
    children: [
      { title: "LangGraph Map", href: "/intelligence/langgraph", icon: GitBranch, description: "Visual workflow graph.", match: "prefix" },
      { title: "Agent Runs", href: "/intelligence/agent-runs", icon: Bot, description: "Inspect specialist outputs.", match: "prefix" },
      { title: "Response Intelligence", href: "/intelligence/responses", icon: MessageCircle, description: "HelpDesk reply analysis.", match: "prefix" },
      { title: "Performance", href: "/intelligence/performance", icon: BarChart3, description: "Campaign metrics and learnings.", match: "prefix" },
    ],
  },
  {
    id: "operations",
    title: "Operations",
    icon: PlugZap,
    defaultHref: "/operations/integrations",
    children: [
      { title: "Integrations", href: "/operations/integrations", icon: PlugZap, description: "Connection health and setup.", match: "prefix" },
      { title: "Keap Sync", href: "/operations/keap", icon: Send, description: "Handoff and sync readiness.", match: "prefix" },
      { title: "Settings", href: "/settings", icon: Settings, description: "Users, roles, agents, prompts.", match: "prefix", activePrefixes: ["/settings"] },
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
