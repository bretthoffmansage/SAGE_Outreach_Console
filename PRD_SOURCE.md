# PRD_SOURCE — AI Campaign Desk

Source: `raw_prd/AI_Campaign_Desk_PRD.md`  
Normalized on: 2026-04-30  
Project: AI Campaign Desk

## PRD-001 — Product Summary
AI Campaign Desk is an internal marketing workflow platform for planning, writing, reviewing, approving, executing, tracking, and learning from marketing campaigns through controlled AI-agent workflows. It must feel like a polished internal marketing command center rather than a loose tool collection.

The product starts with email campaigns and should provide a clear expansion path to ads, landing pages, SMS, and broader multi-channel workflows.

Primary outcome: reduce external marketing dependency, reduce Blue/Bari bottlenecks, preserve Bari's founder voice, and create a marketing system that improves from edits, approvals, replies, performance, and learning loops.

## PRD-002 — Primary Users and Authority Model
### PRD-002.1 — Marketing Operator
Creates campaigns, reviews drafts, prepares Keap/Zapier handoffs, monitors replies/performance, and inspects agent output.

### PRD-002.2 — Bari
Founder and voice authority. Needs a simple copy-review queue, inline editing, approval actions, notes, and conversion of edits/notes into reusable guidance.

### PRD-002.3 — Blue
Strategic/business approval authority. Needs a focused decision console showing only decisions that truly require him, with clear reasons and approve/request-changes/reject actions.

### PRD-002.4 — Admin / Builder
Configures integrations, prompts, roles, rules, API keys, logs, webhook tests, and sync controls.

### PRD-002.5 — Internal Reviewer
Handles operational approval, scheduling readiness, final copy review, and Keap handoff checks.

## PRD-003 — Roles and Permissions
Use Clerk authentication and role-based access control. Required roles:
- `admin`
- `marketing_operator`
- `copy_reviewer`
- `bari`
- `blue`
- `internal_reviewer`
- `viewer`

Permission design must distinguish campaign creation, agent execution, agent-run visibility, copy editing, Bari approvals, Blue approvals, library management, integration management, HelpDesk intelligence, and Keap/Zapier push/handoff.

## PRD-004 — Required Stack and Architecture
### PRD-004.1 — Frontend
- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn/ui-style reusable components
- Lucide icons
- Framer Motion for subtle transitions
- Recharts for dashboard/performance visuals
- Vercel-compatible deployment posture

### PRD-004.2 — Auth
- Clerk
- Organization support if appropriate
- Role-based access through Clerk metadata and/or Convex user profile records

### PRD-004.3 — Backend and State
- Convex tables for campaigns, approvals, agent runs, libraries, integration states, performance snapshots, audit logs, and sync artifacts
- Convex actions for external API calls where needed
- Convex mutations for internal data changes
- Convex scheduled functions for sync jobs where useful

### PRD-004.4 — Agent Orchestration
- OpenAI Agents SDK for specialist agent definitions, structured outputs, guardrails, and tool calls
- LangGraph for graph-based workflows, long-running stateful flows, branching, retries, and human-in-the-loop pauses
- Structured JSON agent outputs stored in Convex

### PRD-004.5 — LLM Providers
- OpenAI for structured outputs, JSON, routing, classification, tool calling, and approval logic
- Claude/Anthropic for long-form copy, Bari voice refinement, critique, and tone-sensitive rewrites
- Future provider flexibility for Gemini or smaller classification models

## PRD-005 — External Integrations and Setup Posture
Requested integrations must be represented in UI/settings and app contracts, but missing optional credentials must not break local/demo operation.

| Integration | Requirement | Build posture |
|---|---|---|
| Clerk | Auth and roles | Scaffold now; requires user setup after build for live keys |
| Convex | State, tables, functions | Scaffold now; requires user setup after build for deployment/env |
| OpenAI | Structured agent outputs and routing | Scaffold contracts/mock fallback now; requires user setup after build for live API |
| Anthropic/Claude | Copywriting and Bari voice | Scaffold contracts/mock fallback now; requires user setup after build for live API |
| LangGraph | Workflow representation/orchestration | Scaffold visual/data model now; live orchestration can be progressive |
| Keap | Tags, segments, handoff, contact counts | Scaffold status/manual fallback now; requires user setup after build for live API |
| Zapier | Webhook notifications/handoffs | Scaffold webhook configuration/manual fallback now; requires user setup after build |
| HelpDesk.com | Ticket/message sync and response intelligence | Scaffold status/manual import now; requires user setup after build |
| Gmail/CSV | Historical import options | Optional/future or manual import scaffold |
| Meta/Google Ads | Phase-two ads extension | Explicitly deferred beyond first email-focused build |

No integration is a true blocker for the first build because the PRD requires graceful disconnected states, mock/demo data, and manual fallbacks.

## PRD-006 — Information Architecture and Routes
The app must use a left sidebar for desktop and responsive drawer/nav on smaller screens. Primary navigation groups:
1. Command Center: Dashboard, Campaigns, Create Campaign
2. Review Queues: Bari Copy Review, Blue Review, Internal Approvals, All Approvals
3. Libraries: Offers & Lead Magnets, Email Library, Bari Voice Rules, Sign-off Library, Audience Library, Compliance Rules, Learning Library
4. Intelligence: Response Intelligence, Performance, Agent Runs, LangGraph Map
5. Operations: Keap Sync, Integrations, Settings

Core route set includes `/`, `/dashboard`, `/campaigns`, `/campaigns/new`, campaign detail subroutes/tabs, review routes, library routes, intelligence routes, operations routes, and settings routes as listed in the raw PRD.

## PRD-007 — Visual and Interaction Requirements
The UI must feel premium, calm, organized, trustworthy, and workflow-oriented. Required patterns:
- Warm neutral surfaces, deep navy/charcoal/muted indigo text/navigation, soft status accents
- Rounded cards, subtle shadows, minimal borders, generous spacing, clear hierarchy
- Header/title/description/action layout on most pages
- Summary cards, filters/search, list/table/cards, detail drawer or detail route
- Status colors: green approved/ready, amber review/warning, red blocked/high-risk, blue in-progress, purple AI intelligence, gray archived/inactive
- Non-technical Bari/Blue pages must avoid exposing implementation jargon by default

## PRD-008 — Campaign Lifecycle
Campaigns must support structured intake, list/detail views, statuses, workflow tabs, approval state, Keap readiness, response summaries, and learning output.

Required statuses include: `intake_draft`, `agent_drafting`, `needs_internal_review`, `needs_bari_review`, `needs_blue_review`, `blocked`, `approved`, `ready_for_keap`, `scheduled`, `sent`, `reporting`, `learning_complete`, `archived`.

Campaign detail tabs: Overview, Brief, Copy, Approvals, Agent Runs, Keap Prep, Responses, Performance, Learning.

Campaign intake fields include name, goal, type, channels, audience/segment, offer/lead magnet, CTA, desired send window, tone, Bari voice requirement, Blue approval expectation, constraints, context, and reference material.

## PRD-009 — Agent Workflow System
The system must model a specialist-agent workflow from intake through strategy, audience, offer, copywriting, Bari voice, brand rules, compliance, skeptic review, performance guidance, approval routing, human approvals, Keap/Zapier prep, HelpDesk response sync, response classification, reporting, and learning.

Required agent roster includes Strategist, Audience, Offer/Lead Magnet, Copywriter, Bari Voice, Brand Rules Checker, Compliance Guard, Skeptic, Performance, Approval Router, Response Classifier, Bari Learning, Performance Reporter, and Learning Agent.

Each agent card should show name, icon, purpose, inputs, outputs, current model, last run, status, and prompt/config access.

## PRD-010 — Agent Output Contract
Every agent output must be structured JSON and stored. Base fields:
- agent_name
- status
- risk_level
- confidence
- summary
- approval_required
- approval_owner
- approval_reason
- blocking_issues
- recommended_next_step
- structured_outputs

## PRD-011 — LangGraph Visualization
Route `/intelligence/langgraph` must display graph nodes/edges for the workflow, current run status, node completion/failure/retry states, human approval pauses, and clickable node input/output details. It must be understandable to non-technical users.

## PRD-012 — Bari Copy Review
Route `/reviews/bari` must provide Bari a clean review queue with tabs for needs review, edited by Bari, approved recently, requested changes, and voice notes. It must support review cards, detail view, inline subject/preview/body/sign-off editing, notes/comments, before/after diff, source examples, applied rules, approval actions, and learning candidate creation from edits/notes.

Learning candidates from Bari edits must not automatically become permanent rules unless configured; they must be reviewable.

## PRD-013 — Blue Review
Route `/reviews/blue` must provide Blue a decision console with focused cards, risk levels, AI recommendations, outcome descriptions, related campaign/offer/audience, and actions: approve, approve with note, request changes, reject. It must store decisions, notes, timestamps, related item, and whether the decision should apply to future campaigns.

## PRD-014 — Internal Approvals
Route `/reviews/internal` must support operational approval items including final campaign check, Keap setup ready, segment confirmed, send window confirmed, copy approved, strategy approved where needed, and integration handoff ready. Actions: mark ready, send to Keap prep, return for changes, block.

## PRD-015 — Source-of-Truth Libraries
Required libraries:
- Offers & Lead Magnets
- Email Library / Bari Voice Library
- Bari Voice Rules
- Sign-off Library
- Audience Library
- Compliance Rules
- Learning Library

Agents must use these libraries before generation. They must not silently invent new offers; proposed new offers must be stored as proposed items requiring Blue approval.

SAGE capitalization must be a default blocking terminology rule.

## PRD-016 — Response Intelligence and HelpDesk
Route `/intelligence/responses` must sync/import HelpDesk tickets/messages, classify messages, match replies to campaigns, identify leads/questions/objections/complaints/unsubscribes/testimonials, draft suggested replies, and feed insights into learning. MVP must not auto-send replies.

## PRD-017 — Performance and Learning
Route `/intelligence/performance` must show campaign, offer, audience, subject-line, reply-intelligence, and learning-recommendation views. Metrics include sent/delivered/open/click/reply/conversion/booking/unsubscribe/spam/revenue where available.

Learning Library must store candidates and approved/rejected/archive statuses for voice rules, patterns, offer insights, audience insights, reply/objection insights, and performance insights.

## PRD-018 — Integrations and Operations
Route `/operations/integrations` must show connection status, purpose, last sync, env/API status, test connection, sync action where applicable, error states, and setup instructions for each integration.

Missing integrations must allow demo/manual operation, e.g. manual audience entry if Keap disconnected, manual response import if HelpDesk disconnected, copy/export if Zapier disconnected, OpenAI fallback if Claude disconnected.

Route `/operations/keap` must support Keap-focused sync status and handoff workflow shell.

## PRD-019 — Data Model Coverage
Use Convex tables or equivalent typed local/demo structures covering:
- users, roles, userRoles
- campaigns, intakes, briefs, variants, copy, send batches, performance snapshots
- agent runs, steps, configs, prompts, LangGraph runs/nodes
- approval items/decisions and Bari/Blue/internal review items
- libraries for offers, lead magnets, assets, audiences, email, voice source ratings, voice rules, signoffs, compliance, learning
- copy reviews, comments, diffs, learning insights, voice examples used, approved/banned phrases, terminology rules
- integration connections, sync jobs, Keap jobs, Zapier webhook events, HelpDesk tickets/messages, response classifications, campaign response matches, reply drafts
- audit logs, change history, system events

## PRD-020 — Approval Logic
Approval levels: 0 auto-pass, 1 internal, 2 Bari/Blue, 3 blocked.

Bari review required when copy is from Bari, founder voice is required, emotionally sensitive, low voice confidence, new/unusual sign-off or tone, or manually requested.

Blue review required for new offers/lead magnets, discounts, guarantees, pricing language, sensitive/new claims, new audience strategy, spend above threshold, major direction, and high-risk compliance flags.

Blocking conditions include SAGE capitalization error, unapproved sign-off, banned claim, missing audience/offer/CTA, missing required approvals, and high-risk compliance blockers.

## PRD-021 — Keap and Zapier Execution
Initial execution is hybrid: Keap API where available, Zapier webhooks for handoffs/notifications, and manual export fallback. Ready-for-Keap requires complete brief, approved copy, required Bari/Blue approvals, internal approval, active approved offer, confirmed audience, cleared compliance blockers, and handoff/export prepared.

## PRD-022 — Error Handling, Empty States, and Auditability
The app must show actionable disconnected/error/rate-limited/auth-expired states, agent failures with retry/manual override where safe, and useful empty states.

Audit logs must track campaign creation, copy edits, Bari changes, Blue decisions, agent outputs, rules applied, final copy, send/export events, replies, learnings, and rule changes. Admins must be able to inspect audit logs.

## PRD-023 — Security and Privacy
- Enforce Clerk auth and role-based access
- Do not expose API keys to frontend
- Store external tokens securely
- Avoid logging token values
- Restrict integration settings to admins
- Avoid auto-sending customer replies in MVP
- Do not allow agents to bypass human approvals for risky actions

## PRD-024 — Seed and Demo Data
Initial build must include seed/demo data for campaigns, Bari review item, Blue review item, offer, lead magnet, voice rules, sign-offs, email records, HelpDesk classifications, agent roster, and LangGraph nodes so the app looks useful without live integrations.

## PRD-025 — MVP Phasing
### PRD-025.1 — MVP 1: Core Platform
Clerk auth shell, app shell/navigation, dashboard, campaign creation/list/detail, mock or real agent workflow, agent run storage, Bari/Blue/internal approvals, offers/lead magnets, Bari voice rules, signoffs, basic email library, integration settings shell.

### PRD-025.2 — MVP 2: Real Agent Workflow
Strategist, Audience, Offer, Copywriter, Bari Voice, Brand Rules Checker, Compliance Guard, Skeptic, Approval Router, LangGraph representation, structured JSON outputs.

### PRD-025.3 — MVP 3: Keap/Zapier
Keap connection status, tags/segments if credentials exist, audience mapping, Zapier trigger, ready-for-Keap handoff, manual export fallback.

### PRD-025.4 — MVP 4: HelpDesk Response Intelligence
HelpDesk shell, sync/import, Response Classifier, response dashboard, campaign matching, learning candidates.

### PRD-025.5 — MVP 5: Performance and Learning
Manual metric entry, Performance Reporter, Learning Library, Bari edit learning extraction, campaign performance summaries.

### PRD-025.6 — MVP 6: Ads Extension
Ad expansion, variants, creative brief, budget approval routing, ad checklist, manual export. Direct paid ad launch is out of scope.

## PRD-026 — Out of Scope for First Build
- Fully autonomous sending without approval
- Direct paid ad launch/spend automation
- Fine-tuned Bari voice model
- Complex multi-tenant enterprise permissions
- Full Keap campaign builder replacement
- Full HelpDesk reply sending
- Revenue attribution if not already available

## PRD-027 — Acceptance Criteria Summary
A successful first build must allow signed-in navigation through a cohesive polished app, campaign creation/viewing, dedicated Bari/Blue/internal queues with actions and stored notes, editable libraries, visible agent roster/LangGraph workflow, simulated or real agent workflow with stored outputs, integration settings with graceful missing-credential states, HelpDesk response dashboard/manual data, and a premium non-technical UX.

## PRD-028 — Ambiguities and Deferred Decisions
- Exact Clerk role-storage method is open: Clerk metadata vs Convex profiles vs hybrid.
- Exact Convex deployment target and live credentials are unavailable; build should use documented env placeholders and local/demo fallbacks.
- Live OpenAI/Anthropic/Keap/Zapier/HelpDesk credentials are unavailable; implement configuration/status/manual fallbacks first.
- shadcn/ui may be implemented through compatible local component primitives if the package registry is not used directly.
- Ads, SMS, landing pages, direct ad launch, automated reply sending, fine-tuned voice models, and advanced attribution are deferred beyond first build unless later packages explicitly pull a scaffold slice forward.
