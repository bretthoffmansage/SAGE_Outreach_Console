/**
 * UI-only operations integration categories and planned placeholders.
 * Does not create Convex rows or call external APIs.
 */

export type OperationsCategoryId =
  | "production_assets"
  | "knowledge_library"
  | "publishing_social"
  | "email_crm"
  | "ai_runtime";

export type PlannedIntegrationPlaceholder = {
  name: string;
  purpose: string;
  relatedWorkflows: string;
};

export type OperationsCategorySection = {
  id: OperationsCategoryId;
  title: string;
  description: string;
  placeholders: PlannedIntegrationPlaceholder[];
};

export const OPERATIONS_CATEGORY_SECTIONS: OperationsCategorySection[] = [
  {
    id: "production_assets",
    title: "Production and Assets",
    description:
      "Future bridges for source assets, production metadata, transcripts, thumbnails, shorts/reels, Frame.io review links, and Mux playback — read-only until connected.",
    placeholders: [
      {
        name: "Sage Production Hub",
        purpose: "Reference hub status, asset IDs, and production metadata without merging systems.",
        relatedWorkflows: "Production Bridge, Campaign Heartbeat",
      },
      {
        name: "Frame.io",
        purpose: "Review links and cut status for creative handoff — no live sync yet.",
        relatedWorkflows: "Production Bridge, Creative handoff",
      },
      {
        name: "Mux",
        purpose: "Playback and source storage references — manual until API wiring.",
        relatedWorkflows: "Production Bridge, YouTube rollout",
      },
      {
        name: "Google Drive",
        purpose: "Source folders and exports — indexing is future-facing only.",
        relatedWorkflows: "Production Bridge, Knowledge and Library",
      },
    ],
  },
  {
    id: "knowledge_library",
    title: "Knowledge and Library",
    description:
      "Planned indexing and export paths for library records, copy archive, swipe files, and company knowledge graph materials — not live.",
    placeholders: [
      {
        name: "Google Drive",
        purpose:
          "Planned read-only index of selected marketing folders. Outreach Console will not modify or delete Drive files in current mode.",
        relatedWorkflows: "Library indexing, Source imports, Production Bridge references",
      },
      {
        name: "Obsidian",
        purpose: "Preview and manual Markdown export for curated library records — no direct vault writes from the console today.",
        relatedWorkflows: "Library export, Knowledge graph mapping, Campaign learning notes",
      },
      {
        name: "Library Sync",
        purpose: "Dry-run jobs, metadata mapping, and Obsidian preview history — manual and preview-only until connectors ship.",
        relatedWorkflows: "Knowledge Sync page, Drive index future, Markdown preview",
      },
    ],
  },
  {
    id: "publishing_social",
    title: "Publishing and Social",
    description:
      "Future publishing, scheduling, captions, and platform-specific rollout tracking — no auto-post.",
    placeholders: [
      {
        name: "YouTube",
        purpose: "Scheduling, descriptions, and Shorts readiness — approval required before any publish.",
        relatedWorkflows: "Social rollout, Campaign launch readiness",
      },
      {
        name: "Meta / Instagram / Facebook",
        purpose:
          "Future connector for Meta-owned social surfaces — performance and content insight workflows; manual and read-only planned. No posting or account changes.",
        relatedWorkflows: "Social rollout, Performance Intelligence, Trend Intelligence",
      },
      {
        name: "Meta Ads",
        purpose: "Future read-only ads intelligence — creative, audience, placement, and campaign performance snapshots; no budget or campaign mutations.",
        relatedWorkflows: "Performance Intelligence, Campaign planning",
      },
      {
        name: "Instagram publishing",
        purpose: "Future scheduling and publishing — not enabled; approval-gated if ever implemented.",
        relatedWorkflows: "Social rollout",
      },
      {
        name: "Meta Insights",
        purpose: "Planned read-only insights layer — observational summaries, not raw credential-backed pulls in this build.",
        relatedWorkflows: "Performance Intelligence, Platform insights",
      },
      {
        name: "Meta Connector / MCP",
        purpose: "Future AI-assisted read/analyze layer where supported — write actions require a separate approval-gated implementation.",
        relatedWorkflows: "Operations checks, Intelligence agents",
      },
      {
        name: "TikTok",
        purpose: "Short-form publishing posture — manual until connected.",
        relatedWorkflows: "Social rollout, Trend Intelligence",
      },
      {
        name: "X.com",
        purpose: "Post and thread drafts — draft-only, no live API.",
        relatedWorkflows: "Social rollout",
      },
      {
        name: "Pinterest",
        purpose: "Pin and board handoff tracking — planned.",
        relatedWorkflows: "Social rollout",
      },
    ],
  },
  {
    id: "email_crm",
    title: "Email and CRM",
    description:
      "Email handoffs, CRM registration tracking, manual exports, webhook prep, and dry-run campaign transfers — human approval first.",
    placeholders: [
      {
        name: "Emailmarketing.com",
        purpose: "ESP / broadcast handoff surface — not wired; no auto-send.",
        relatedWorkflows: "Email handoff, Campaign launch readiness",
      },
    ],
  },
  {
    id: "ai_runtime",
    title: "AI and Runtime",
    description:
      "Model providers, Copy Intelligence / LangGraph orchestration, the planned Hermes by Nous local Mac mini autonomous runtime, auth, backend persistence, and deployment health — configurable; live execution only when keys, HERMES_RUNTIME_URL, and policies allow. Default posture remains dry-run, read-only, and approval-gated for external actions.",
    placeholders: [],
  },
];

/** Maps Convex integration rows into Operations UI categories (by stable integrationId). */
export function operationsCategoryForIntegrationId(integrationId: string): OperationsCategoryId {
  if (
    integrationId === "meta_platform" ||
    integrationId === "meta_ads" ||
    integrationId === "instagram" ||
    integrationId === "facebook" ||
    integrationId === "meta_connector_mcp"
  ) {
    return "publishing_social";
  }
  if (integrationId === "keap" || integrationId === "zapier" || integrationId === "helpdesk") {
    return "email_crm";
  }
  if (
    integrationId === "openai" ||
    integrationId === "claude" ||
    integrationId === "langgraph" ||
    integrationId === "hermes_runtime" ||
    integrationId === "convex" ||
    integrationId === "clerk" ||
    integrationId === "vercel"
  ) {
    return "ai_runtime";
  }
  return "ai_runtime";
}
