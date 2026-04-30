# MASTER_ROADMAP — AI Campaign Desk

Date: 2026-04-30  
Sources: `PRD_SOURCE.md`, `CURRENT_STATE_AUDIT.md`

## RM-001 — Roadmap Strategy
This is a greenfield build. The roadmap follows the PRD's recommended first-build order while ensuring early packages create the foundations needed for later modules: app shell, typed data contracts, seed data, campaign lifecycle, review queues, libraries, agent workflow visibility, integrations, response intelligence, performance/learning, and polish.

All live integrations start as scaffolded/disconnected/manual-fallback systems because credentials are not available and the PRD requires graceful missing-credential behavior (`PRD-005`, `PRD-018`).

## RM-002 — Chapter 1: Application Foundation and Design System
PRD coverage: `PRD-004`, `PRD-006`, `PRD-007`, `PRD-023`, `PRD-024`, `PRD-027`

Create the Next.js TypeScript application foundation, install/configure core dependencies, establish Tailwind/design tokens, build reusable UI primitives, set global layout, and create responsive navigation/top bar shell. Include env documentation and demo-safe integration assumptions.

Why first: every later product surface depends on a coherent app structure, route shell, and visual system.

## RM-003 — Chapter 2: Data Contracts, Convex Schema, Seed Data, and Demo State
PRD coverage: `PRD-003`, `PRD-008`, `PRD-009`, `PRD-010`, `PRD-015`, `PRD-019`, `PRD-020`, `PRD-024`

Define typed domain models and Convex schema/functions or equivalent scaffold. Seed demo campaigns, approvals, libraries, agent roster, LangGraph nodes, integrations, responses, performance, and learning. Provide local/demo data access paths so UI work can proceed without live services.

Why now: product pages need realistic shared data and statuses to avoid hard-coded one-off stubs.

## RM-004 — Chapter 3: Dashboard and Campaign Lifecycle
PRD coverage: `PRD-008`, `PRD-025.1`, `PRD-027`

Implement dashboard summary cards/CTAs and campaign list/new/detail surfaces with intake workflow, lifecycle statuses, tabs, next actions, risk/approval status, and Keap readiness indicators.

Why after data foundation: campaigns are the central object that reviews, agents, responses, and learning attach to.

## RM-005 — Chapter 4: Human Approval Queues
PRD coverage: `PRD-012`, `PRD-013`, `PRD-014`, `PRD-020`, `PRD-027`

Implement Bari copy review, Blue strategic review, internal approvals, and all approvals. Include non-technical review cards, detail panels, actions, notes, inline copy editing/diff where scoped, and stored decision state.

Why now: human authority and bottleneck reduction are central product promises.

## RM-006 — Chapter 5: Source-of-Truth Libraries
PRD coverage: `PRD-015`, `PRD-020`, `PRD-024`, `PRD-027`

Implement offers/lead magnets, email/voice library, Bari voice rules, sign-offs, audiences, compliance rules, and learning library basics. Include filtering, statuses, editable records, SAGE blocking rule, approved/rejected/needs-review voice source ratings, and proposed/approval states.

Why after core approvals: libraries drive agent decisions and approval routing.

## RM-007 — Chapter 6: Agent Runs, Structured Outputs, and LangGraph Map
PRD coverage: `PRD-009`, `PRD-010`, `PRD-011`, `PRD-025.2`, `PRD-027`

Implement simulated/stored specialist-agent workflow, structured output display, approval-router behavior, agent roster, agent run detail pages, and visual LangGraph map with clickable node input/output. Live OpenAI/LangGraph can remain scaffolded behind env checks.

Why after libraries/campaigns: agents must reference campaign and library context and create approval items.

## RM-008 — Chapter 7: Integrations and Keap/Zapier Operations
PRD coverage: `PRD-005`, `PRD-018`, `PRD-021`, `PRD-023`, `PRD-025.3`

Implement integration settings cards, env/status detection, setup instructions, test/sync button shells, Keap sync/handoff shell, Zapier webhook configuration, ready-for-Keap checklist, and manual export fallback. Avoid live token exposure.

Why after campaign/approval workflows: integration status should reflect real handoff readiness.

## RM-009 — Chapter 8: Response Intelligence, Performance, and Learning
PRD coverage: `PRD-016`, `PRD-017`, `PRD-022`, `PRD-025.4`, `PRD-025.5`

Implement HelpDesk response dashboard/manual import, response classification records, campaign matching indicators, suggested reply drafts without auto-send, performance dashboards/manual metrics, learning candidates, and learning library flows.

Why after campaigns/agents/integrations: response and performance data close the learning loop.

## RM-010 — Chapter 9: Settings, Roles, Admin, Auditability, and Security Review
PRD coverage: `PRD-003`, `PRD-018`, `PRD-022`, `PRD-023`

Implement settings/users/roles/agents/prompts surfaces, audit log views, safe env handling, and role-aware navigation/action gating. Preserve demo operation while documenting production setup requirements.

Why late: requires complete awareness of app surfaces and actions.

## RM-011 — Chapter 10: UX Cohesion, Accessibility, Responsiveness, and Final Product Polish
PRD coverage: `PRD-007`, `PRD-022`, `PRD-027`

Refine visual consistency, empty/error/loading states, responsive drawer behavior, non-technical copy, keyboard/accessibility basics, and route-level polish so the app feels like a cohesive internal command center.

## RM-012 — Explicitly Deferred / Out-of-Scope Roadmap Items
Per `PRD-026` and `PRD-028`, defer direct autonomous sending, paid ad launch, fine-tuned voice models, complex enterprise permissions, full Keap campaign-builder replacement, HelpDesk reply sending, advanced attribution, direct Meta/Google Ads APIs, SMS, and landing-page generation unless later packages only add navigation/placeholder scaffolds.
