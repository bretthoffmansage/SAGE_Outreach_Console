# EXECUTION_PACKAGES — AI Campaign Desk

Date: 2026-04-30  
Sources: `PRD_SOURCE.md`, `CURRENT_STATE_AUDIT.md`, `MASTER_ROADMAP.md`

## Package status vocabulary
- `ready`: executable from current context.
- `draft`: intentionally underdefined until earlier packages reveal implementation details.
- `complete`: finished and closed out.

---

## PKG-001 — Scaffold Next.js App Foundation and Design Shell
Status: complete

### Purpose
Create the production-oriented Next.js foundation for AI Campaign Desk: package/tooling config, App Router structure, Tailwind styling, core layout, responsive sidebar/top bar, base UI primitives, env documentation, and route placeholders for the PRD information architecture.

### Why now
No app exists. All later work depends on a coherent Next.js/TypeScript/Tailwind foundation and navigation structure (`PRD-004`, `PRD-006`, `PRD-007`).

### Scope
- Add `package.json`, lockfile, TypeScript, Next.js, ESLint, Tailwind/PostCSS configs.
- Add `app/` structure with root layout, dashboard redirect/home behavior, global styles, and primary route groups.
- Implement reusable layout components: sidebar, top bar, mobile nav/drawer behavior where feasible, page header, status pill, cards/buttons/tabs/table primitives.
- Create a calm premium visual theme with warm neutral surfaces and PRD status colors.
- Add env example/documentation for required variables without real secrets.
- Add route placeholder pages for all primary PRD routes with consistent empty states.

### Out of scope
- Full Convex schema and dynamic data.
- Live Clerk auth.
- Real agent/integration behavior.
- Full workflow actions beyond placeholder navigation.

### Likely files/systems
- `package.json`, lockfile
- `next.config.*`, `tsconfig.json`, `tailwind.config.*`, `postcss.config.*`
- `app/**`
- `components/**`
- `lib/**`
- `.env.example`, README updates if needed

### Sensitive systems
- Environment variables: document only; do not add secrets.

### Required checks
- Install dependencies.
- `npm run lint` if configured.
- `npm run build`.

### Regression checks
- Root route and core placeholder routes compile.
- Responsive shell does not depend on live credentials.

### Completion evidence
- Build passes.
- Route shell visible in code for PRD IA.
- Git commit with package changes and clean tree.

### Completion notes
Completed on 2026-04-30. Added Next.js 16 App Router foundation, TypeScript/Tailwind tooling, ESLint config, responsive app shell, sidebar/top bar navigation, reusable UI primitives, catch-all routed placeholders for the PRD information architecture, demo-safe hero/dashboard/workflow preview, and `.env.example` documentation.

### Validation evidence
- `npm run lint` passed.
- `npm run build` passed.
- `next-env.d.ts` was generated as an intentional Next.js scaffold file for this package and kept.

---

## PKG-002 — Domain Models, Demo Data, and Convex Scaffold
Status: complete

### Purpose
Define shared TypeScript domain models, Convex schema scaffold, seed/demo data, and data access helpers for campaigns, approvals, libraries, agents, integrations, responses, performance, learning, users/roles, and audit logs.

### Why now
PKG-001 created the Next.js foundation. UI surfaces now need coherent data contracts and seeded demo content before campaign, review, library, agent, and integration pages become dynamic (`PRD-019`, `PRD-024`).

### Expanded scope
- Add Convex dependency and `convex/schema.ts` covering PRD entity groups at a scaffold level.
- Add shared TypeScript domain types for roles, statuses, campaigns, approvals, libraries, agents, integrations, response intelligence, performance, learning, and audit events.
- Add deterministic seed/demo data for at least one campaign, Bari review item, Blue review item, internal approval, offer, lead magnet, Bari voice rules, sign-offs, email records, HelpDesk/response classification, agent roster, LangGraph nodes, integration statuses, performance snapshot, learning insight, users/roles, and audit events.
- Add read-only data access helpers that pages can use without live Convex credentials.
- Update the existing scaffold page to consume the shared demo data for dashboard metrics, workflow preview, and setup/integration messaging.

### Out of scope
- Live Convex deployment, generated Convex client bindings, or production migration.
- Live Clerk user sync.
- Live external API calls.
- Mutating CRUD workflows; later packages will attach actions to these contracts.

### Sensitive systems
- Demo data only; no real customer data or secrets.
- Convex schema must not encode token values.

### Required checks
- `npm run lint`
- `npm run build`

### Regression checks
- Existing route shell still compiles without live credentials.
- Dashboard and route placeholders render from local demo helpers rather than ad-hoc inline data.

### Completion evidence expectations
- Schema/type/demo files exist and map to PRD data requirements.
- Validation commands pass.
- Package status updated and committed with a clean tree.

### Completion notes
Completed on 2026-04-30. Added Convex dependency and schema scaffold, shared domain types, deterministic demo data for campaigns/approvals/libraries/agents/LangGraph/integrations/responses/performance/learning/users/audit events, read-only data helpers, and connected the dashboard scaffold to those helpers.

### Validation evidence
- `npm run lint` passed.
- `npm run build` passed.

---

## PKG-003 — Dashboard and Campaign Lifecycle
Status: complete

### Purpose
Implement dashboard, campaign list, campaign intake, campaign detail tabs, statuses, summary cards, next actions, approval state, and Keap readiness indicators.

### PRD coverage
`PRD-008`, `PRD-025.1`, `PRD-027`

### Why now
PKG-002 added shared campaign, approval, integration, performance, and demo data contracts. The central campaign lifecycle can now become the first real product workflow surface.

### Expanded scope
- Replace generic dashboard placeholders with data-backed command-center cards for active campaigns, Bari/Blue approvals, ready-for-Keap, responses, integration health, and recent activity.
- Implement `/campaigns` as a campaign lifecycle list using seeded campaign records, statuses, risk, owner/audience/offer, pending approvals, and next actions.
- Implement `/campaigns/new` as a guided intake UI scaffold with PRD intake sections and fields, ending with a Run Campaign Agent Workflow CTA.
- Implement `/campaigns/[campaignId]` as a detail view scaffold with tabs/sections for Overview, Brief, Copy, Approvals, Agent Runs, Keap Prep, Responses, Performance, and Learning.
- Keep all state read-only/demo for now; mutating create/update actions are deferred.

### Out of scope
- Persisted create/edit campaign mutations.
- Full review queue actions; PKG-004 owns approval actions.
- Real agent workflow execution; PKG-006 owns execution.

### Required checks
- `npm run lint`
- `npm run build`

### Regression checks
- Dashboard, `/campaigns`, `/campaigns/new`, and seeded campaign detail route compile without live credentials.
- Existing navigation and generic route placeholders still compile.

### Completion notes
Completed on 2026-04-30. Added data-backed dashboard command cards and recent activity, campaign lifecycle list, guided campaign intake scaffold, and seeded campaign detail pages with overview, tabs, approvals/signals, Keap readiness, response/performance, agent-run, and learning placeholders.

### Validation evidence
- `npm run lint` passed.
- `npm run build` passed.

---

## PKG-004 — Bari, Blue, Internal, and All Approval Queues
Status: complete

### Purpose
Implement human approval consoles and actions with non-technical UX for Bari/Blue and operational controls for internal reviewers.

### PRD coverage
`PRD-012`, `PRD-013`, `PRD-014`, `PRD-020`

### Why now
PKG-003 surfaced campaign lifecycle and approval signals. Dedicated review queues are the next PRD-critical bottleneck-reduction workflow.

### Expanded scope
- Implement `/reviews/bari`, `/reviews/blue`, `/reviews/internal`, and `/reviews/all` route-specific views backed by seeded approval records.
- Bari queue: non-technical copy review cards, tabs, inline editor/diff/notes scaffold, approve/request rewrite/reject/save-note actions as UI affordances only.
- Blue queue: decision cards with reason needed, risk, AI recommendation, outcome if approved/rejected, related campaign/offer/audience, and decision action affordances.
- Internal queue: operational checklist cards for final campaign check, Keap setup, segment, send window, approvals, and handoff readiness.
- All approvals: unified queue grouped by owner/status/risk.

### Out of scope
- Persisted approval mutations.
- Full rich-text editor implementation.
- Agent-generated review updates beyond existing demo data.

### Required checks
- `npm run lint`
- `npm run build`

### Regression checks
- Existing dashboard and campaign routes still compile.
- Review routes avoid technical jargon for Bari/Blue by default.

### Completion notes
Completed on 2026-04-30. Added route-specific Bari, Blue, internal, and all-approvals review surfaces backed by seeded approval data, including non-technical Bari copy review scaffold, Blue decision console details, internal send-readiness checklist, unified queue, and approval action affordances.

### Validation evidence
- `npm run lint` passed.
- `npm run build` passed.

---

## PKG-005 — Source-of-Truth Libraries
Status: complete

### Purpose
Implement offers/lead magnets, email/voice examples, Bari voice rules, sign-offs, audiences, compliance rules, and learning library basics.

### PRD coverage
`PRD-015`, `PRD-017`, `PRD-020`, `PRD-024`

### Why now
Campaign and approval surfaces now exist. Source-of-truth libraries must be visible before agent workflow and routing logic are expanded.

### Expanded scope
- Implement route-specific library views for `/libraries/offers`, `/libraries/email`, `/libraries/voice-rules`, `/libraries/signoffs`, `/libraries/audiences`, `/libraries/compliance`, and `/libraries/learning`.
- Display seeded records with status, tags, risk, source-of-truth purpose, filtering/search affordances, and record cards.
- Highlight SAGE capitalization as a blocking default terminology rule.
- Show learning candidate review posture and approved/rejected/manual governance language.
- Keep CRUD/edit persistence out of scope; provide UI affordances only.

### Out of scope
- Persisted create/edit/delete library records.
- Agent retrieval implementation.

### Required checks
- `npm run lint`
- `npm run build`

### Regression checks
- Existing dashboard, campaign, and review routes still compile.

### Completion notes
Completed on 2026-04-30. Added route-specific source-of-truth library views for offers/lead magnets, email, Bari voice rules, sign-offs, audiences, compliance, and learning, with seeded record cards, filtering/search/add affordances, SAGE blocking rule highlight, and learning-candidate governance messaging.

### Validation evidence
- `npm run lint` passed.
- `npm run build` passed.

---

## PKG-006 — Agent Runs and LangGraph Workflow Visibility
Status: complete

### Purpose
Implement agent roster, structured agent output displays, simulated campaign workflow execution, approval-router outputs, agent run detail, and LangGraph map visualization.

### PRD coverage
`PRD-009`, `PRD-010`, `PRD-011`, `PRD-025.2`

### Why now
Campaigns, approvals, and source libraries now exist, giving the agent workflow enough context to display structured run output and workflow state safely.

### Expanded scope
- Implement `/intelligence/agent-runs` with agent roster cards and structured seeded run-step outputs.
- Implement `/intelligence/langgraph` with a readable node/edge workflow map, statuses, human approval pause indicators, and clickable/detail-style cards.
- Surface the base agent output contract fields from seeded data: risk, confidence, approval owner, blocking/next-step summaries, and structured outputs.
- Keep actual provider calls and live LangGraph orchestration out of scope; use demo-safe stored outputs.

### Out of scope
- Live OpenAI/Claude calls.
- Real LangGraph execution engine.
- Mutating workflow run controls.

### Required checks
- `npm run lint`
- `npm run build`

### Regression checks
- Existing dashboard, campaign, review, and library routes still compile.

### Completion notes
Completed on 2026-04-30. Added agent roster and structured output views, plus a readable LangGraph workflow map with node statuses, next edges, and human approval pause messaging, all backed by seeded demo-safe workflow data.

### Validation evidence
- `npm run lint` passed.
- `npm run build` passed.

---

## PKG-007 — Integrations and Keap/Zapier Operations
Status: complete

### Purpose
Implement integration settings/status, setup guidance, disconnected states, Keap sync/handoff shell, Zapier webhook shell, and manual export fallback.

### PRD coverage
`PRD-005`, `PRD-018`, `PRD-021`, `PRD-023`, `PRD-025.3`

### Why now
Campaigns, approvals, and agent visibility now expose readiness signals. Operations pages can safely show integration posture and Keap/Zapier handoff scaffolds without live credentials.

### Expanded scope
- Implement `/operations/integrations` with integration cards, purpose, status, env keys, setup instructions, test/sync affordances, and error/disconnected/manual-fallback language.
- Implement `/operations/keap` with ready-for-Keap checklist, seeded campaign handoff cards, Zapier webhook shell, and manual export fallback.
- Ensure no secrets or token values are displayed.

### Out of scope
- Live API calls, token exchange, webhook posting, or Keap mutations.

### Required checks
- `npm run lint`
- `npm run build`

### Regression checks
- Existing dashboard, campaign, review, library, and intelligence routes still compile.

### Completion notes
Completed on 2026-04-30. Added integration settings cards with purpose, status, required env keys, setup-safe test/sync affordances, and fallback messaging; added Keap/Zapier operations page with ready-for-Keap campaign handoff cards, send-prep checklist, manual export, and webhook shell affordances.

### Validation evidence
- `npm run lint` passed.
- `npm run build` passed.

---

## PKG-008 — Response Intelligence, Performance, and Learning Loop
Status: ready

### Purpose
Implement HelpDesk response intelligence, manual import, response classifications, campaign matching, suggested reply drafts, performance dashboards/manual metrics, and learning candidates.

### PRD coverage
`PRD-016`, `PRD-017`, `PRD-022`, `PRD-025.4`, `PRD-025.5`

### Why now
Campaigns, agents, libraries, and integrations are scaffolded. The post-send intelligence loop can now be visible with demo/manual data.

### Expanded scope
- Implement `/intelligence/responses` with response dashboard tabs, seeded HelpDesk classification record, campaign match confidence, suggested reply/manual-import affordances, and no-auto-send messaging.
- Implement `/intelligence/performance` with seeded performance snapshot cards, manual metric posture, campaign/offer/audience/subject/reply learning categories, and learning recommendations.
- Connect learning candidates visibly to the existing learning-library posture.

### Out of scope
- Live HelpDesk sync/API polling/webhooks.
- Auto-sending replies.
- Persisted manual metric entry.

### Required checks
- `npm run lint`
- `npm run build`

### Regression checks
- Existing routes still compile and no live credentials are required.

---

## PKG-009 — Settings, Roles, Audit Logs, and Admin Safety
Status: draft

### Purpose
Implement settings/users/roles/agents/prompts views, audit logs, role-aware action affordances, and safe environment handling review.

### PRD coverage
`PRD-003`, `PRD-018`, `PRD-022`, `PRD-023`

### Scope
To be expanded after all primary modules expose actions and data.

---

## PKG-010 — UX Cohesion and Final MVP Polish
Status: draft

### Purpose
Refine responsiveness, accessibility, copy, loading/empty/error states, visual cohesion, and non-technical user polish across the product.

### PRD coverage
`PRD-007`, `PRD-022`, `PRD-027`

### Scope
To be expanded after feature surfaces exist.

---

## Explicit deferments
The following PRD items are intentionally deferred beyond first build/package set unless later expansion narrows them to safe scaffolds: autonomous sending without approval, direct paid ad launch, fine-tuned Bari voice model, complex enterprise permissions, full Keap campaign-builder replacement, HelpDesk reply sending, advanced revenue attribution, direct Meta/Google Ads APIs, SMS workflow, and landing-page generation.
