# Outreach Console Full App Audit

**Document purpose:** Map routes, UI, Convex data, and workflows for developers and operators.  
**Basis:** Code inspection of this repository (Next.js App Router, `app/[[...slug]]/page.tsx`, section components under `components/`, Convex under `convex/`, navigation in `lib/navigation.ts`).  
**Not included:** Actual environment variable values or any secrets.

---

## 1. Executive Summary

The **Outreach Console** (package name `ai-campaign-desk` in `package.json`) is an internal **SAGE outreach / marketing command center** for planning campaigns, routing **human approvals** (Bari copy, Blue strategy, internal send readiness), curating **libraries** (email voice, offers, audiences, compliance, learning), monitoring **intelligence** (agent configs, dry-run runs, helpdesk-style responses, performance signals), and **operations** (integration health, Keap handoff preparation).

- **Data:** [Convex](https://convex.dev) backs almost all operational state (`convex/schema.ts`, queries/mutations/actions under `convex/`). Seeding pulls from `lib/data/demo-data.ts` where tables are empty.
- **Auth:** [Clerk](https://clerk.com) (`@clerk/nextjs`) with `ClerkProvider` in `app/layout.tsx`, optional demo mode when publishable key is absent. Next.js **16** uses `proxy.ts` (Clerk `clerkMiddleware`) for route protection when both `CLERK_SECRET_KEY` and `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` are set; public routes `/sign-in`, `/sign-up`.
- **Principle:** AI-assisted workflows with **human approval first**; response records carry `noAutoSend`; Keap flows are **manual / dry-run** oriented, not live ESP sends from this UI.

---

## 2. App Architecture Overview

| Layer | Technology / location |
|--------|------------------------|
| **Frontend** | Next.js 16 (App Router), React, Tailwind, `app/globals.css` |
| **Routing** | Single catch-all page: `app/[[...slug]]/page.tsx` branches on `slug[0]` (`dashboard`, `campaigns`, `reviews`, `libraries`, `intelligence`, `operations`); **all other paths** (e.g. `/settings`) fall through to `SettingsSection` without a `slug[0]` match |
| **Layout / shell** | `components/app-shell.tsx` — `AppShell` wraps all routed content; uses `AppUserProvider`, Convex `useQuery` for global bar, Clerk `SignIn` / `UserButton` / `SignInButton` when configured |
| **Navigation config** | `lib/navigation.ts` — `navGroups` defines categories and child `href`s |
| **Convex** | Client via `components/convex-provider.tsx` (`ConvexProvider` + `NEXT_PUBLIC_CONVEX_URL`); server logic in `convex/*.ts` |
| **Clerk** | `proxy.ts`, `app/sign-in/[[...sign-in]]/page.tsx`, `app/sign-up/[[...sign-up]]/page.tsx`, `components/auth/use-current-app-user.ts`, `convex/users.ts` for profile upsert |
| **Role / access** | `lib/auth.ts` — `canAccessPath`, `filterNavGroupsForRole`, `canApproveReviewItem`, `FULL_ACCESS_FOR_ALL_SIGNED_IN_USERS` + `effectiveRoleForSignedInUser` (temporary full access for signed-in users while flag is true) |

**Data flow (simplified):** Browser → Clerk session (client) → Convex WebSocket/HTTP → queries/mutations update tables → React components re-render. **Actions** (`useAction`) run Node actions in `convex/runtimePrep.ts` (`"use node"`) for env checks, Keap payload prep, agent dry-run orchestration.

---

## 3. Global Shell and Navigation

**Files:** `components/app-shell.tsx`, `lib/navigation.ts`, `lib/branding.ts`, `components/brand/sage-top-bar-logo.tsx`, `convex/globalStatus.ts`

| Element | Behavior |
|---------|----------|
| **Left sidebar** | `Sidebar` — links per **filtered** `navGroups` (`filterNavGroupsForRole` with effective `role` from shell). Logo/title from `appBranding`. Footer blurb about human approval. |
| **Mobile nav** | `MobileNav` — same groups, drawer-style panel. |
| **Top bar** | Search trigger, approvals badge (count → `/reviews/all`), system health badge + popover (`api.globalStatus.getGlobalTopBarState`), optional **Create Campaign** (admin/operator effective role), notifications bell + popover (`getGlobalNotifications`), role pill + avatar + **UserButton** / **SignInButton** (Clerk). |
| **Global search** | Overlay; queries `api.globalStatus.getGlobalSearchRecords`, client-side text filter, role-filtered routes via `canAccessPath`. Selecting a result `router.push(route)`. |
| **Notifications** | Built in `convex/globalStatus.ts` from `approvalItems`, `responseClassifications`, `integrationConnections`, `agentRuntimeStates`, `todayTasks` — not a separate table. |
| **User / auth** | `ClerkShell` / `SignInScreen` when Clerk on and signed out; session stored by Clerk. `AppUserState` includes `role` (effective) and `storedRole` (Clerk/Convex). |
| **“Not authorized”** | Shown when `canAccessPath(role, pathname)` is false (bypassed for signed-in users while full-access flag is on — see `lib/auth.ts`). |
| **Task return context** | `sessionStorage` key `oc_task_return_context`; “Back to Tasks” when navigating from Today into another mode. |

---

## 4. Data Model Summary

Tables are defined in `convex/schema.ts`. Below: **purpose**, **key fields**, **primary UI**, **main API**, **seed**, **notes**.

| Table | Purpose | Key fields | Main pages | Main queries / mutations | Seed | Notes |
|-------|---------|------------|------------|----------------------------|------|-------|
| **users** | Clerk-linked profiles | `clerkUserId`, `email`, `name`, `roles[]` | All (context) | `users.getCurrentUserProfile`, `users.upsertCurrentUserProfile`, `users.listUserProfiles`, `users.updateUserRole` | No auto-seed from demo-data | **No Convex `ctx.auth` checks** on mutations — any client caller can mutate if deployment allows |
| **campaigns** | Campaign system of record | `campaignId`, `status`, approvals flags, `pendingApprovals`, library link ids | Campaign list/detail, intake, Keap, search | `campaigns.listCampaignRecords`, `getCampaignRecordByCampaignId`, `createCampaignRecord`, `upsertCampaignRecord`, `updateCampaignStage`, `updateCampaignStatus`, `seedDefaultCampaignRecordsIfEmpty`, `ensureApprovalItemsForCampaign` | `seedDefaultCampaignRecordsIfEmpty` ← `lib/data/demo-data.ts` | `createCampaignRecord` calls `linking.ensureApprovalItemsForCampaign` |
| **todayTasks** | Today queue | `taskId`, `status` (current/completed), `sourceRoute`, `destinationMode`, `priority` | Home Today | `todayTasks.listTodayTasks`, `completeTodayTask`, `restoreTodayTask`, `seedDefaultTodayTasksIfEmpty` | `lib/today-tasks.ts` via `buildDefaultTodayTasks` | Tasks also created from approvals in `linking.ensureTodayTasksForPendingApprovals` |
| **approvalItems** | Human approval queue | `approvalId`, `owner`/`queue`, `linkedCampaignId`, copy fields, `status` | Review modes, notifications, search | `approvals.listApprovalItems`, `approveApprovalItem`, `approveApprovalItemWithEdits`, `requestApprovalChanges`, `rejectApprovalItem`, `upsertApprovalItem`, `seedDefaultApprovalItemsIfEmpty` | Demo `approvals` array | Decisions call `linking.syncCampaignAfterApprovalDecision`; append **approvalEvents** |
| **approvalEvents** | Audit trail of decisions | `eventId`, `approvalId`, `decision`, `actor`, `snapshotJson` | (implicit) | Written by `approvals.mutateDecision` path | Per decision | |
| **libraryItems** | Typed library inventory | `recordId`, `type` (offer, email, …), `payload`, `tags` | Libraries, campaign intake matching, agent context | `library.listLibraryItems`, `upsertLibraryItem`, `seedDefaultLibraryItemsIfEmpty` | `libraryItems` demo | `type: "learning"` exists in schema but learning UI primarily uses **learningInsights** |
| **learningInsights** | Learning candidates / approved insights | `recordId`, `status`, `confidence`, `payload` | Learning library tab, Performance lane, agent context | `library.listLearningInsights`, `upsertLearningInsight`, `seedDefaultLearningInsightsIfEmpty` | Demo `learningInsights` | Approve/Reject/Archive buttons on Learning page are **demo notices only** (not wired to mutations) |
| **agentConfigs** | Agent definitions | prompts, models, rules, `preferredProvider`, workflow order | LangGraph map / agent detail | `agents.listAgentConfigs`, `getAgentConfigByAgentId`, `getAgentExecutionConfig`, `buildAgentRuntimeContext`, `upsertAgentConfig`, `seedDefaultAgentConfigsIfEmpty` | `lib/agent-config.ts` `defaultAgentConfigs` | |
| **agentRuntimeStates** | Per-agent runtime UI state | `status`, `isRunning`, `lastRunId`, errors | LangGraph, agent runs | `agents.listAgentRuntimeStates`, `updateAgentRuntimeStatus`, `resetDemoAgentRuntimeState`, seeds | Default runtime states | |
| **agentRuns** | Run history | `runId`, `agentId`, `inputSnapshot`, `outputJson` | Agent runs, dry-run | `agents.listAgentRunsByAgentId`, `createAgentRun`, `completeAgentRun`, seeds | Demo runs | |
| **agentRunSteps** | (Schema) step-level run data | — | **Not used** by any `convex/*.ts` in repo | *None found* | — | Table exists; **no CRUD implemented** in current Convex code |
| **langGraphNodes** | (Schema) graph nodes | — | UI uses **demo** `agentRunSteps` from `lib/data/demo-data.ts` for visualization | *None found* | — | **Schema unused** by Convex functions |
| **integrationConnections** | Integration registry | `integrationId`, `status`, `envKeys`, health fields | Integrations, top bar health | `integrations.listIntegrationRecords`, `upsertIntegrationRecord`, `updateIntegrationStatus`, `checkIntegrationConnectionDemo`, `seedDefaultIntegrationRecordsIfEmpty` | `integrations` demo | Live check: `runtimePrep.checkIntegrationConnection` action → `evaluateIntegrationConnection` (`convex/runtime/envValidation.ts`) |
| **keapSyncJobs** | Manual Keap export jobs | `jobId`, `campaignId`, `status`, `payloadJson` | Keap page | `keapSync.listKeapSyncJobs`, `keapSync.upsertKeapSyncJob`, `markKeapSyncJobExported` | Created by actions | **`markKeapSyncJobExported` not called from UI** (only defined server-side) |
| **responseClassifications** | Helpdesk-style responses | `noAutoSend`, `suggestedReply`, `classification`, `campaignId` | Response intelligence, notifications, search | `responses.listResponseRecords`, `updateSuggestedReply`, `updateResponseNotes`, `markResponseResolved`, `markResponseNeedsReply`, `seedDefaultResponseRecordsIfEmpty`, `importHelpdeskResponseRecord` | Demo responses | `importHelpdeskResponseRecord` used from **`importHelpdeskMessage` action** — **no UI** calls that action in `components/` |
| **performanceSnapshots** | (Schema) metrics per campaign | `campaignId` ref to `campaigns` | **Performance UI uses demo** `performanceSnapshots` from `lib/data/demo-data.ts`, not Convex | *No Convex query found* | — | **Table unused** by current app logic |
| **auditLogs** | (Schema) generic audit | actor, action, target | **Unused** in Convex handlers | *None found* | — | |

---

## 5. Page-by-Page Audit

Unless noted, pages render inside `AppShell` from `app/[[...slug]]/page.tsx` with `title` from `lib/utils.ts` `titleFromSlug`.

---

### [Home] → Today

**Route:** `/`, `/dashboard` (both hit `DashboardSection`; `slug` empty or `slug[0] === "dashboard"`)

**Primary purpose:** Operational “today” view — tasks, campaign snapshot signals, quick navigation into other modes.

**Who uses it:** Operators and reviewers daily; same shell for all roles (effective role gates nav/search when enforcement is on).

**What lives on this page:** Implemented in `components/campaign-sections.tsx` as `DashboardSection` — task list lanes, campaign metrics cards, links into campaigns/reviews.

**Main UI sections:** Current vs completed today tasks; campaign summary tiles; deep links (e.g. selected campaign → `/campaigns/:id`, review links).

**Data read:** `api.todayTasks.listTodayTasks`; `api.campaigns.listCampaignRecords` (for dashboard context where used).

**Data written:** `api.todayTasks.completeTodayTask`, `api.todayTasks.restoreTodayTask`; `api.todayTasks.seedDefaultTodayTasksIfEmpty` if empty; `api.campaigns.seedDefaultCampaignRecordsIfEmpty` from parent flows when campaigns empty (pattern also in list section).

**Convex functions used:** `todayTasks.*`, `campaigns.listCampaignRecords`, `campaigns.seedDefaultCampaignRecordsIfEmpty`.

**External integrations:** None direct; copy references Keap/readiness conceptually.

**User actions:** Complete task; restore completed task; navigate via links; optional seed triggers on first load.

**Inputs accepted:** Task row clicks; complete/restore controls.

**Outputs/state changes:** `todayTasks` row `status` / `completedAt` / `updatedAt`; sessionStorage may be written when launching task-driven navigation (see app-shell task return).

**Navigation behavior:** Uses `destinationMode` and routes on tasks to campaign/review/library/intelligence/operations.

**Relationship to other pages:** Feeds review and campaign priorities; notifications can surface high-priority tasks (`globalStatus` excludes some review/response duplicates from task notifications).

**Current limitations / TODOs:** Seeding is idempotent only “if empty” — repeated manual DB clears re-seed. Task content is static defaults from `lib/today-tasks.ts` until approvals create linked tasks.

**Smoke test checklist:** Load `/dashboard`; verify tasks list; complete a task; restore; click a task deep link; reload — persistence via Convex.

---

### [Campaign] → Campaigns (list)

**Route:** `/campaigns` (`CampaignRouteSection` when `slug[1]` absent)

**Primary purpose:** Browse all campaigns, filter/summarize, open detail.

**Who uses it:** Operators, strategists.

**What lives on this page:** `CampaignListSection` in `campaign-sections.tsx` — table/cards, filters, “Open full campaign”.

**Main UI sections:** Campaign roster; risk/status; pending approvals summary; seed-on-empty pattern.

**Data read:** `api.campaigns.listCampaignRecords`.

**Data written:** `api.campaigns.seedDefaultCampaignRecordsIfEmpty` when no rows.

**Convex functions used:** `campaigns.listCampaignRecords`, `campaigns.seedDefaultCampaignRecordsIfEmpty`.

**External integrations:** None.

**User actions:** Select campaign; navigate to detail route; trigger implicit seed.

**Inputs accepted:** Filter controls (client-side where implemented).

**Outputs/state changes:** Possible insert of demo campaigns once per empty DB.

**Navigation behavior:** `/campaigns/:campaignId` for detail.

**Relationship:** Drives review queues via `pendingApprovals` on each campaign.

**Limitations:** List UI does not call `upsertCampaignRecord` for inline edits (edits happen at intake or elsewhere).

**Smoke test:** Open `/campaigns`; confirm data; open a campaign.

---

### [Campaign] → Create Campaign

**Route:** `/campaigns/new` (also nav `activePrefixes` include `/campaigns/create` but route handler only checks `slug[1] === "new"` — **`/campaigns/create` is not handled as intake**; it would fall through to list or wrong branch — **needs verification**: `CampaignRouteSection` is `if (slug?.[1] === "new")` only)

**Primary purpose:** Guided intake → new `campaigns` row + linked `approvalItems` when rules require.

**Who uses it:** Operators (effective role allows Create button in shell).

**What lives on this page:** `CampaignIntakeSection` — multi-section form, checklist, “Save Intake” / “Run Agent Draft”.

**Main UI sections:** Intent, audience, offer, execution fields; readiness checklist.

**Data read:** `api.library.listLibraryItems` (match audience/offer names to `recordId`s).

**Data written:** `api.campaigns.createCampaignRecord` with generated `campaignId` (`createCampaignId()` client-side). Server runs `resolveCampaignLibraryLinks` and `ensureApprovalItemsForCampaign`.

**Convex functions used:** `library.listLibraryItems`, `campaigns.createCampaignRecord`.

**External integrations:** None live; Keap mapping fields stored as strings on campaign.

**User actions:** Fill form; save intake or run agent draft (different `status`/`stage`/`copyStatus`).

**Inputs accepted:** Text fields for name, goal, type, audience, exclusions, source mapping, offer, CTA, claims, send window, metrics; heuristic booleans for Bari/Blue approval requirements from keywords.

**Outputs/state changes:** New `campaigns` document; possible new `approvalItems` per `bariApprovalRequired` / `blueApprovalRequired` / internal; `todayTasks` may be updated via linking when approvals pending.

**Navigation behavior:** On success `router.push("/campaigns")`.

**Relationship:** Creates work for Review pages and Keap prep when status reaches `ready_for_keap`.

**Limitations / TODOs:** Bari/Blue rules are **keyword heuristics**, not policy engine. `/campaigns/create` path mismatch with nav `activePrefixes` — **partial wiring**.

**Smoke test:** Submit minimal valid intake; confirm row in Convex dashboard; confirm approvals exist when flags true.

---

### [Campaign] → Campaign detail

**Route:** `/campaigns/[campaignId]` (`slug[1]` = id)

**Primary purpose:** Read-only overview of one campaign + related approvals/responses; links to reviews/Keap concepts.

**Who uses it:** `CampaignDetailSection`.

**Main UI sections:** Overview grid; related approvals list; response/performance lane.

**Data read:** `api.campaigns.getCampaignRecordByCampaignId`, `api.approvals.listApprovalItems`, `api.campaigns.listCampaignRecords` (fallback map), `api.responses.listResponseRecords`.

**Data written:** `seedDefaultCampaignRecordsIfEmpty` only if DB empty (same pattern as list).

**Convex functions used:** `campaigns.getCampaignRecordByCampaignId`, `approvals.listApprovalItems`, `responses.listResponseRecords`, optional seed mutation.

**External integrations:** None.

**User actions:** Navigate away via links; **no save/edit** of campaign fields on this page (no `upsertCampaignRecord` in component).

**Performance display:** Uses **`performanceSnapshots` from `lib/data/demo-data.ts`**, matched by `campaign.id` — **not** Convex `performanceSnapshots` table.

**Limitations:** Detail page does not persist edits; performance snapshot is demo file, not DB.

**Smoke test:** Open `/campaigns/<existingId>`; verify related approvals; verify Convex-backed fields match.

---

### [Review] → All Approvals

**Route:** `/reviews/all`

**Primary purpose:** Unified queue across owners (filtered client-side by `mode === "all"` in `ReviewRouteSection`).

**Who uses it:** Reviewers, operators.

**What lives on this page:** `ReviewRouteSection` → review queue UI (`review-sections.tsx`) with mode `all`.

**Data read:** `api.approvals.listApprovalItems`.

**Data written:** `seedDefaultApprovalItemsIfEmpty`; decision mutations: `approveApprovalItem`, `approveApprovalItemWithEdits`, `requestApprovalChanges`, `rejectApprovalItem`; draft edits via `upsertApprovalItem` where UI allows.

**Convex functions used:** All under `api.approvals.*` listed above.

**External integrations:** None.

**User actions:** Select item; edit copy fields (owner-specific); approve / approve with edits / request changes / reject (subject to `canApproveReviewItem` with effective role).

**Outputs:** Updates `approvalItems`, inserts `approvalEvents`, updates linked `campaigns` via `syncCampaignAfterApprovalDecision`, refreshes related `todayTasks`.

**Relationship:** Central hub before owner-specific lanes.

**Limitations:** Actor string passed from `useAppUser()` display/id — not verified server-side.

**Smoke test:** Filter queue; approve one item; verify campaign status changed in Convex.

---

### [Review] → Bari Copy Review

**Route:** `/reviews/bari` — `ReviewRouteSection` `mode === "bari"`

**Primary purpose:** Founder-voice copy review queue.

**Data / Convex:** Same queries/mutations as All, filtered to Bari queue in UI.

**User actions:** Copy editing fields; signoff selection where applicable; approval actions (disabled messaging when `canApproveReviewItem` false — mitigated by full-access flag for signed-in).

**Outputs:** Same approval + campaign sync pipeline.

---

### [Review] → Blue Review

**Route:** `/reviews/blue` — `mode === "blue"`

**Primary purpose:** Strategic / positioning review.

**Same stack as Bari** with Blue-specific copy and `owner` alignment.

---

### [Review] → Internal Approvals

**Route:** `/reviews/internal` — `mode === "internal"`

**Primary purpose:** Send readiness / operational approval.

**Notable server behavior (`linking.syncCampaignAfterApprovalDecision`):** When internal approval resolves with no remaining pending approvals, campaign may move toward **`ready_for_keap`** / Keap prep stage.

---

### [Library] → Email Library

**Route:** `/libraries/email` — `LibraryRouteSection` maps `slug[1]` to `LibraryKey`; `email` key.

**Primary purpose:** Curate email/voice examples as `libraryItems` with `type` including `email` (and related).

**Who uses it:** Content / brand.

**What lives on this page:** `LibraryInventoryPage` in `library-sections.tsx` — table, filters, editor panel, save/cancel.

**Data read:** `api.library.listLibraryItems`, `api.library.listLearningInsights` (for learning key only).

**Data written:** `api.library.seedDefaultLibraryItemsIfEmpty`, `api.library.upsertLibraryItem` with `patch` from `patchForLibrarySave` helper.

**Convex:** `library.listLibraryItems`, `upsertLibraryItem`, seed mutation.

**User actions:** Add row; edit; save; filter chips; advanced filters (per key config).

**Outputs:** Insert/patch `libraryItems`; `updatedAt` changes.

**Relationship:** Intake uses audience/offer **name matching** to `recordId`; agent runtime context query reads library summaries.

**Limitations:** Learning insight approve/reject/archive buttons show **demo notices** only (`setDemoNotice`).

**Smoke test:** Edit a row; refresh; confirm persistence.

---

### [Library] → Offers & Lead Magnets

**Route:** `/libraries/offers` — key `offers` (default slug fallback in code is `offers` when `slug[1]` missing — note nav default library href is **email**, not offers)

**Primary purpose:** Offers + lead magnets (`type` `offer` / `lead_magnet` in row model).

**Same component stack as Email Library** with different `libraryPageConfig` filters/columns.

---

### [Library] → Bari Voice Rules

**Route:** `/libraries/voice-rules` — key `voice-rules`

**Purpose:** `voice_rule` library items.

---

### [Library] → Sign-off Library

**Route:** `/libraries/signoffs` — key `signoffs`

**Purpose:** `signoff` items; used conceptually in approvals (selected signoff fields).

---

### [Library] → Audience Library

**Route:** `/libraries/audiences` — key `audiences`

**Purpose:** `audience` items; `campaigns.createCampaignRecord` resolves `audienceId` via name match.

---

### [Library] → Compliance Rules

**Route:** `/libraries/compliance` — key `compliance`

**Purpose:** `compliance_rule` items.

---

### [Library] → Learning Library

**Route:** `/libraries/learning` — key `learning`

**Purpose:** Displays **both** `libraryItems` of type learning **and** `learningInsights` records (see `rowsFor` in `library-sections.tsx`).

**Data read:** `listLibraryItems`, `listLearningInsights`.

**Data written:** `upsertLibraryItem`, `upsertLearningInsight` via save path where applicable; **Approve insight / Reject / Archive** buttons are **explicitly disabled demo messages**, not mutations.

**Limitations:** Candidate approval workflow **not** connected to those buttons.

---

### [Intelligence] → LangGraph Map / Active Agents

**Route:** `/intelligence/langgraph`

**Primary purpose:** Visual workflow + **in-page agent detail** (state `selectedAgentId`, tabs: overview, prompt, I/O, rules, routing, runtime, runs) — **not** separate URLs per agent.

**Data read:** `api.agents.listAgentConfigs`, `listAgentRuntimeStates`, `listAgentRunsByAgentId` (when agent selected); merges with `defaultAgentConfigs` / `getDefaultAgentConfig` from `lib/agent-config.ts` for fallbacks.

**Data written:** `api.agents.seedDefaultAgentConfigsIfEmpty`, `seedDefaultAgentRuntimeStatesIfEmpty`, `seedDefaultAgentRunsIfEmpty`; `api.agents.upsertAgentConfig`; `api.agents.resetDemoAgentRuntimeState`; **`useAction(api.runtimePrep.runAgentDryRun)`** — updates runtime + creates run with **synthetic** output (see action: “No external model or LangGraph call was made.”).

**External integrations:** **None live** for model calls; `validateModelProvider` checks env for OpenAI/Anthropic keys.

**User actions:** Select agent node; edit config fields; Save config; Reset runtime; **Run dry test**.

**Outputs:** `agentConfigs`, `agentRuntimeStates`, `agentRuns` rows updated/inserted.

**Relationship:** Supplies context builder used conceptually for future real runs.

**Limitations:** Graph edges use **demo** `agentRunSteps` from `lib/data/demo-data.ts` for display — not `langGraphNodes` table.

**Smoke test:** Run dry test; inspect new run in `agentRuns` in Convex dashboard.

---

### [Intelligence] → Agent Runs

**Route:** `/intelligence/agent-runs`

**Primary purpose:** List/filter runs and run detail UI (component `AgentRunsSection`).

**Data read:** Agent configs/states/runs queries (same module as LangGraph for run history).

**Data written:** Dry-run action from LangGraph page primarily; seeds on empty.

---

### [Intelligence] → Response Intelligence

**Route:** `/intelligence/responses` — `ResponsesSection`

**Primary purpose:** Triage inbound-style responses (`responseClassifications`).

**Data read:** `api.responses.listResponseRecords`, `api.campaigns.listCampaignRecords` (for context).

**Data written:** `seedDefaultResponseRecordsIfEmpty`; `updateSuggestedReply`, `updateResponseNotes`, `markResponseResolved`, `markResponseNeedsReply`.

**External integrations:** **`importHelpdeskMessage` action** normalizes input via `runtime/helpdesk.ts` and writes via `importHelpdeskResponseRecord` — **no button in `components/`** triggers this action (API exists for future wiring).

**Principle:** Records include `noAutoSend: true` in seeding; UI emphasizes no auto-send.

**User actions:** Select response; edit suggested reply and notes; mark resolved / needs reply.

**Smoke test:** Edit suggested reply; reload; mark resolved.

---

### [Intelligence] → Performance

**Route:** `/intelligence/performance` — `PerformanceSection`

**Primary purpose:** Telemetry-style dashboard.

**Data read:** **Primarily** `performanceSnapshots`, `campaigns`, `learningInsights` from **`lib/data/demo-data.ts`** (static arrays) — **not** Convex `performanceSnapshots` table.

**Data written:** None from this page.

**Limitations:** **Not Convex-backed** for metrics tiles; schema table unused.

**Smoke test:** Visual only; do not expect DB updates.

---

### [Intelligence] → Intelligence hub (fallback)

**Route:** `/intelligence` or `/intelligence/` without recognized `slug[1]`

**Primary purpose:** Card links to LangGraph and Agent Runs (`IntelligenceRouteSection` default branch).

**Data:** None required.

---

### [Operations] → Integrations

**Route:** `/operations/integrations`

**Primary purpose:** Integration roster, detail panel, “check connection”.

**Data read:** `api.integrations.listIntegrationRecords`, `api.integrations.getOverallSystemHealth`.

**Data written:** `api.integrations.seedDefaultIntegrationRecordsIfEmpty`; **`useAction(api.runtimePrep.checkIntegrationConnection)`** which reads env via `evaluateIntegrationConnection` and **`upsertIntegrationRecord`** patch.

**External integrations:** **Env validation only** — optional webhook URL validation for Zapier id in `envValidation.ts`; **no outbound Keap API** call in check handler beyond status derivation from env presence.

**User actions:** Select integration; run check; (detail view) read setup notes.

**Limitations:** `checkIntegrationConnectionDemo` mutation exists — grep shows UI uses **action** path, not necessarily demo mutation.

**Smoke test:** Run check on an integration; observe status fields update in Convex.

---

### [Operations] → Keap Sync

**Route:** `/operations/keap` **and any** `/operations/*` except `integrations` (see `OperationsRouteSection`: non-`integrations` → `KeapOperationsSection`)

**Primary purpose:** Batch **manual export** / **queue handoff** for campaigns in `ready_for_keap`.

**Data read:** `listIntegrationRecords`, `listCampaignRecords`, `listKeapSyncJobs`.

**Data written:** `useAction(api.runtimePrep.prepareKeapManualExport)` and `queueKeapManualHandoff` → internally `keapSync.upsertKeapSyncJob`, `campaigns.upsertCampaignRecord` patches (status/stage/keapPrepStatus/nextAction).

**External integrations:** **Dry-run / manual** — `buildKeapManualExportPayload` in `runtime/keap.ts` builds JSON payload; **no live Keap API send** in inspected action code.

**User actions:** “Manual export” and “Queue handoff” for all ready campaigns (gated by operator/admin effective role).

**Limitations:** `markKeapSyncJobExported` not invoked from UI after real human export.

**Smoke test:** Set a campaign to `ready_for_keap` via approvals flow; run prepare; verify `keapSyncJobs` row.

---

### [Operations] → Settings

**Route:** `/settings` (and any unmatched first segment — **catch-all fallback** in `page.tsx` renders `SettingsSection` for unknown `slug[0]` as well, e.g. typo routes would show Settings)

**Primary purpose:** Static-style console settings presentation.

**What lives on this page:** `components/settings-section.tsx` — uses **`lib/data/demo-data.ts`** for users/agents/audit tables (**not** Convex `users` list for the table body).

**Data read / written:** **No Convex** in this file.

**Limitations:** “Save console defaults” button is **non-functional placeholder** (no handler). **Not** the live user directory for Clerk.

**Smoke test:** Page load only.

---

### [Auth] → Sign-in / Sign-up

**Routes:** `/sign-in/[[...sign-in]]`, `/sign-up/[[...sign-up]]` (`app/sign-in/.../page.tsx`, `app/sign-up/.../page.tsx`)

**Primary purpose:** Clerk hosted components with path routing.

**Data:** Clerk session only; Convex user upsert happens post-sign-in from `use-current-app-user` → `users.upsertCurrentUserProfile`.

**In-app sign-in:** `AppShell` `SignInScreen` uses `<SignIn routing="hash" />` when Clerk configured but user signed out — parallel to dedicated routes.

---

### [Auth] → Not authorized (in-shell)

**Route:** Any path where `canAccessPath` is false for the user’s effective role.

**Behavior:** Banner in `ShellFrame` with “Not authorized” — suppressed for signed-in users while `FULL_ACCESS_FOR_ALL_SIGNED_IN_USERS` is true (`lib/auth.ts` + effective role in hook).

---

### [Global] → Command search overlay

**Not a route:** Modal in `app-shell.tsx`.

**Data:** `getGlobalSearchRecords` — see §3.

---

### [Global] → Notifications popover

**Data:** `getGlobalNotifications`.

---

### [Other] → `_not-found`

**Route:** Next default `app` not-found — **not audited in depth**; standard Next.js behavior.

---

### [Other] → Convex-only / server actions not exposed in UI

| Function | Location | Notes |
|----------|----------|-------|
| `runtimePrep.buildZapierHandoffDryRun` | `convex/runtimePrep.ts` | Returns payload preview; checks `ZAPIER_CAMPAIGN_APPROVED_WEBHOOK_URL` — **no UI** |
| `runtimePrep.importHelpdeskMessage` | same | Writes responses — **no UI** |
| `responses.backfillResponseCampaignLinks` | `convex/responses.ts` | Mutation exists — **no UI** in components |
| `campaigns.upsertCampaignRecord` | Used by actions/runtime, not campaign detail UI | Keap actions patch campaigns |

---

## 6. Main Workflows

### Campaign Creation Flow

1. User opens `/campaigns/new`, fills `CampaignIntakeSection` form (`campaign-sections.tsx`).
2. Client builds `patch` including heuristic `bariApprovalRequired`, `blueApprovalRequired`, `internalApprovalRequired: true`, optional `audienceId` / `offerId` from **exact name match** against `library.listLibraryItems`.
3. `createCampaignRecord` inserts `campaigns` and calls `ensureApprovalItemsForCampaign` (`convex/linking.ts`) inserting missing `approvalItems` per required owner.
4. `ensureTodayTasksForPendingApprovals` may insert/update `todayTasks` linked to approvals.
5. User redirected to `/campaigns`.

### Approval Flow

1. Queues load `listApprovalItems`; optional `seedDefaultApprovalItemsIfEmpty` seeds demo set + today tasks.
2. User selects item; may edit subject/body fields; chooses Approve / Approve with edits / Request changes / Reject (`approvals.ts` → `mutateDecision`).
3. `approvalItems` patched; `approvalEvents` inserted; **`syncCampaignAfterApprovalDecision`** updates linked `campaigns` (`pendingApprovals`, `status`, `stage`, `nextAction`, rejection → `blocked`, etc.).
4. Today tasks reconciled for that approval’s state.

### Library Management Flow

1. User opens a `/libraries/...` route; component seeds library if empty.
2. User edits draft → **Save** calls `upsertLibraryItem` with typed payload from `patchForLibrarySave`.
3. Campaign intake and `buildAgentRuntimeContext` read summaries for future agent execution (when live).

### Today Task Flow

1. `listTodayTasks` sorts current before completed.
2. **Complete** → `completeTodayTask` sets `status: "completed"`, `completedAt`.
3. **Restore** → `restoreTodayTask`.
4. **Navigation:** Task rows include `sourceRoute`; app-shell stores optional session context for “Back to Tasks” when crossing modes.

### Response Intelligence Flow

1. `listResponseRecords` enriches with `resolveResponseCampaignLink` per row.
2. User edits **suggested reply** / **notes** → `updateSuggestedReply` / `updateResponseNotes`.
3. **Mark resolved** / **needs reply** → respective mutations.
4. **No auto-send:** enforced in domain (`noAutoSend` field); UI copy reinforces human send.

### Integration / Operations Flow

1. **Seed** integrations if empty from demo-data.
2. **Check connection** action evaluates env keys (and webhook URL shape for Zapier integration id) → `upsertIntegrationRecord` with new status/labels.
3. **Keap:** Actions build JSON payload and job rows; campaign rows updated to manual-export messaging — **operator performs real export outside app**.

### Agent Configuration Flow

1. Seed configs/runtimes/runs if empty.
2. User edits agent fields in LangGraph UI → `upsertAgentConfig`.
3. **Dry run** action validates provider env, flips runtime to running then complete, writes `agentRuns` with structured JSON — **explicitly no external LLM call** in code comments.

### Global Search / Notifications Flow

1. `getGlobalSearchRecords` aggregates normalized records from multiple tables (see `globalStatus.ts`).
2. Client filters by query string and **role-accessible routes** (`canAccessPath`).
3. Notifications built from subsets of approvals/responses/integrations/runtimes/tasks with priority sort and cap (12).

---

## 7. Known Gaps / Open Items

- **Settings page:** Demo tables only; Save button non-functional; does not manage Clerk users.
- **Performance page:** Uses static `lib/data/demo-data.ts` — **Convex `performanceSnapshots` unused**.
- **Learning Library:** Approve/Reject/Archive UI shows **disabled demo notices**, not `upsertLearningInsight` status transitions for those buttons.
- **Schema tables without Convex CRUD:** `agentRunSteps`, `langGraphNodes`, `auditLogs`, and unused **`performanceSnapshots`** / **`learning`** typed `libraryItems` overlap (learning content split between `libraryItems` and `learningInsights`).
- **Server-side auth:** Convex mutations/queries do **not** use `ctx.auth` / identity — **anyone with Convex client access** could call mutations in a misconfigured deployment.
- **Actions not wired to UI:** `buildZapierHandoffDryRun`, `importHelpdeskMessage`.
- **Keap:** `markKeapSyncJobExported` not called from UI after manual export.
- **Nav vs route:** `/campaigns/create` appears in nav `activePrefixes` but `CampaignRouteSection` only treats `new` as intake — **inconsistent**.
- **Library default slug:** `LibraryRouteSection` defaults missing `slug[1]` to **`offers`**, while nav default is **`/libraries/email`** — visiting `/libraries` alone may land on Offers, not Email.
- **Campaign detail:** No edit persistence; performance tile from demo file.

---

## 8. Risk and Safety Notes

- **No auto-send:** Response entities include `noAutoSend`; product copy states human approval authority.
- **Secrets:** Clerk secret and API keys must stay server-side; integration checks read `process.env` only inside Convex **Node** actions — do not log env values.
- **Dry-run vs live:** `runAgentDryRun`, `prepareKeapManualExport`, `buildZapierHandoffDryRun` are explicitly dry-run or manual-handoff oriented; verify before enabling real outbound calls.
- **Role access:** Client-side gating + Clerk proxy; **Convex does not re-enforce roles** — risk if Convex deployment is public.
- **Duplicate seeding:** Seeds return early if tables non-empty; deleting partial data can yield **partial** demo states.
- **Linking:** `resolveCampaignLibraryLinks` matches by **exact lowercased name** — duplicate library names could cause ambiguous matches (offer matcher uses first non-audience name match in code path — review `linking.ts`).

---

## 9. Recommended Smoke Test Plan

1. **App loads:** `/dashboard` with Convex + env configured.
2. **Auth:** Sign out → sign in; confirm no redirect loop (`proxy.ts` public routes); `UserButton` works.
3. **Today tasks:** Complete and restore a task.
4. **Campaign create:** Intake save; verify `campaigns` + `approvalItems` in Convex.
5. **Review:** Approve one pending item; verify campaign fields and `approvalEvents`.
6. **Library:** Edit row, save, refresh.
7. **Response intelligence:** Update suggested reply and notes; mark resolved.
8. **Integration check:** Run connection check; status updates.
9. **Keap:** With `ready_for_keap` campaign, run **Manual export** action from UI; verify `keapSyncJobs` + campaign patch.
10. **Global search:** Open overlay, query, navigate to result.
11. **Notifications:** Trigger state (e.g. pending approval) and open bell.
12. **Cross-linking:** Create campaign with audience/offer names matching library rows; verify `audienceId` / `offerId` on campaign.
13. **Refresh persistence:** Hard reload after edits.
14. **Duplicate record:** Attempt duplicate `createCampaignRecord` same `campaignId` — expect error from server.
15. **Production build:** `npm run build`.

---

## 10. Final Summary

**What works well today:** Single cohesive shell with global search and notifications driven entirely from Convex aggregates; campaign → approval → campaign sync in `linking.ts` is real and traceable; library and response editors persist to Convex; integration **env-based** health checks and Keap **manual** export pipeline are implemented as **explicit dry-run / operator handoff** flows; agent dry-run produces persisted run records for demos without calling external LLMs.

**What is wired vs demo:** **Wired to Convex:** campaigns, today tasks, approvals (+ events), library items, learning insights (data + upsert, not all buttons), responses, agents (configs/runtimes/runs), integrations, Keap jobs, users upsert from Clerk. **Mostly demo / static UI:** Settings tables, Performance metrics source, parts of LangGraph visualization data, Learning insight action buttons.

**What to build next (suggested):** Server-side Convex auth (`ctx.auth`) + role checks; wire `performanceSnapshots` or remove dead schema; expose `markKeapSyncJobExported` in UI; resolve `/campaigns/create` vs `new` and `/libraries` default slug; connect Learning approve/reject to `upsertLearningInsight`; optional UI for `importHelpdeskMessage` and Zapier dry-run preview; replace campaign-detail performance card with Convex-backed metrics when real data exists.

---

*End of audit. For file-level references: routing `app/[[...slug]]/page.tsx`, shell `components/app-shell.tsx`, sections `components/*-sections.tsx`, Convex API `convex/_generated/api.d.ts` (generated from handlers above).*
