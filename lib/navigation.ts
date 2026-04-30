import {
  Activity,
  BarChart3,
  BookOpen,
  Bot,
  BrainCircuit,
  ClipboardCheck,
  FileText,
  Gauge,
  GitBranch,
  Inbox,
  LayoutDashboard,
  Library,
  MailCheck,
  Megaphone,
  MessageCircle,
  Network,
  PenLine,
  PlugZap,
  Search,
  Send,
  Settings,
  ShieldCheck,
  Sparkles,
  Tags,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type NavItem = { title: string; href: string; icon: LucideIcon; description: string };
export type NavGroup = { title: string; items: NavItem[] };

export const navGroups: NavGroup[] = [
  {
    title: "Command Center",
    items: [
      { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard, description: "Today’s campaign command view." },
      { title: "Campaigns", href: "/campaigns", icon: Megaphone, description: "Lifecycle, status, and next actions." },
      { title: "Create Campaign", href: "/campaigns/new", icon: PenLine, description: "Guided campaign intake." },
    ],
  },
  {
    title: "Review Queues",
    items: [
      { title: "Bari Copy Review", href: "/reviews/bari", icon: MailCheck, description: "Founder voice review inbox." },
      { title: "Blue Review", href: "/reviews/blue", icon: ShieldCheck, description: "Strategic decision console." },
      { title: "Internal Approvals", href: "/reviews/internal", icon: ClipboardCheck, description: "Operational send readiness." },
      { title: "All Approvals", href: "/reviews/all", icon: Inbox, description: "Unified approval queue." },
    ],
  },
  {
    title: "Libraries",
    items: [
      { title: "Offers & Lead Magnets", href: "/libraries/offers", icon: Tags, description: "Approved offers and claims." },
      { title: "Email Library", href: "/libraries/email", icon: FileText, description: "Historical voice examples." },
      { title: "Bari Voice Rules", href: "/libraries/voice-rules", icon: Sparkles, description: "Founder-voice guidance." },
      { title: "Sign-off Library", href: "/libraries/signoffs", icon: PenLine, description: "Approved sign-off patterns." },
      { title: "Audience Library", href: "/libraries/audiences", icon: Users, description: "Segments and Keap mappings." },
      { title: "Compliance Rules", href: "/libraries/compliance", icon: ShieldCheck, description: "Claims and blocking rules." },
      { title: "Learning Library", href: "/libraries/learning", icon: BrainCircuit, description: "Reusable insights and candidates." },
    ],
  },
  {
    title: "Intelligence",
    items: [
      { title: "Response Intelligence", href: "/intelligence/responses", icon: MessageCircle, description: "HelpDesk reply analysis." },
      { title: "Performance", href: "/intelligence/performance", icon: BarChart3, description: "Campaign metrics and learnings." },
      { title: "Agent Runs", href: "/intelligence/agent-runs", icon: Bot, description: "Inspect specialist outputs." },
      { title: "LangGraph Map", href: "/intelligence/langgraph", icon: GitBranch, description: "Visual workflow graph." },
    ],
  },
  {
    title: "Operations",
    items: [
      { title: "Keap Sync", href: "/operations/keap", icon: Send, description: "Handoff and sync readiness." },
      { title: "Integrations", href: "/operations/integrations", icon: PlugZap, description: "Connection health and setup." },
      { title: "Settings", href: "/settings", icon: Settings, description: "Users, roles, agents, prompts." },
    ],
  },
];

export const quickActions = [
  { label: "Global search", icon: Search },
  { label: "Integration health", icon: Activity },
  { label: "System status", icon: Gauge },
  { label: "Library coverage", icon: Library },
  { label: "Source rules", icon: BookOpen },
  { label: "Workflow map", icon: Network },
];
