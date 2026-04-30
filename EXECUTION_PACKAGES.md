# EXECUTION_PACKAGES — AI Campaign Desk

Date: 2026-04-30  
Sources: `PRD_SOURCE.md`, `CURRENT_STATE_AUDIT.md`, `MASTER_ROADMAP.md`

## Package status vocabulary
- `ready`: executable from current context.
- `draft`: intentionally underdefined until earlier packages reveal implementation details.
- `complete`: finished and closed out.

---

## PKG-001 — Scaffold Next.js App Foundation and Design Shell
Status: ready

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

---

## PKG-002 — Domain Models, Demo Data, and Convex Scaffold
Status: draft

### Purpose
Define shared TypeScript domain models, Convex schema scaffold, seed/demo data, and data access helpers for campaigns, approvals, libraries, agents, integrations, responses, performance, learning, users/roles, and audit logs.

### Why now
UI surfaces need coherent data contracts and PRD seed data (`PRD-019`, `PRD-024`).

### Scope
To be expanded after PKG-001 establishes project structure and dependency choices.

### Out of scope
Live external API credentials and production data migration.

### Required checks
Build/type/lint checks from the scaffold.

---

## PKG-003 — Dashboard and Campaign Lifecycle
Status: draft

### Purpose
Implement dashboard, campaign list, campaign intake, campaign detail tabs, statuses, summary cards, next actions, approval state, and Keap readiness indicators.

### PRD coverage
`PRD-008`, `PRD-025.1`, `PRD-027`

### Scope
To be expanded after PKG-002 data contracts are complete.

---

## PKG-004 — Bari, Blue, Internal, and All Approval Queues
Status: draft

### Purpose
Implement human approval consoles and actions with non-technical UX for Bari/Blue and operational controls for internal reviewers.

### PRD coverage
`PRD-012`, `PRD-013`, `PRD-014`, `PRD-020`

### Scope
To be expanded after campaign and approval data contracts/pages exist.

---

## PKG-005 — Source-of-Truth Libraries
Status: draft

### Purpose
Implement offers/lead magnets, email/voice examples, Bari voice rules, sign-offs, audiences, compliance rules, and learning library basics.

### PRD coverage
`PRD-015`, `PRD-017`, `PRD-020`, `PRD-024`

### Scope
To be expanded after shared library models and core UI patterns exist.

---

## PKG-006 — Agent Runs and LangGraph Workflow Visibility
Status: draft

### Purpose
Implement agent roster, structured agent output displays, simulated campaign workflow execution, approval-router outputs, agent run detail, and LangGraph map visualization.

### PRD coverage
`PRD-009`, `PRD-010`, `PRD-011`, `PRD-025.2`

### Scope
To be expanded after campaign, approval, and library foundations exist.

---

## PKG-007 — Integrations and Keap/Zapier Operations
Status: draft

### Purpose
Implement integration settings/status, setup guidance, disconnected states, Keap sync/handoff shell, Zapier webhook shell, and manual export fallback.

### PRD coverage
`PRD-005`, `PRD-018`, `PRD-021`, `PRD-023`, `PRD-025.3`

### Scope
To be expanded after campaign and approval readiness workflows exist.

---

## PKG-008 — Response Intelligence, Performance, and Learning Loop
Status: draft

### Purpose
Implement HelpDesk response intelligence, manual import, response classifications, campaign matching, suggested reply drafts, performance dashboards/manual metrics, and learning candidates.

### PRD coverage
`PRD-016`, `PRD-017`, `PRD-022`, `PRD-025.4`, `PRD-025.5`

### Scope
To be expanded after campaigns, agents, libraries, and integration shells exist.

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
