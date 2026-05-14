# Section 1 — Language / Layout Repurpose Pass Audit

This audit is based on direct inspection of the repository at `SAGE-Outreach-Console` (Next.js app router, Convex backend, client sections under `components/`). No code was changed during this audit.

---

## 1. Executive Summary

The app is already structured as an **internal marketing console** with the right **skeleton**: `AppShell` (`components/app-shell.tsx`) provides sidebar categories, horizontal child tabs, global search, notifications, role-aware access, and a “Back to Tasks” bridge from Today tasks. Data flows through **Convex** for campaigns, today tasks, approvals, library items, agents, integrations, responses, and global search/top-bar state; **static demo fallbacks** remain in `lib/data/demo-data.ts` for some UI paths (for example `performanceSnapshots` imported directly in `components/campaign-sections.tsx` and `components/intelligence-sections.tsx`).

Section 1 is **mostly additive copy and layout**: new panels on Home, reframed headings and empty states, placeholder sections on campaign create/detail, conceptual grouping on Intelligence and Operations, expanded library framing (and optionally new “future bucket” routes or in-page cards), refreshed demo seeds, and product framing in `lib/branding.ts`, `app/layout.tsx`, and `lib/navigation.ts`. The **technical architecture** (routes, Convex tables, approval queues, dry-run agents, manual Keap posture) can stay intact if naming stays backward-compatible (for example keep sidebar **Campaigns** while page titles say **Weekly Launch Campaigns**).

**Implementation strategy:** sequence work so global framing and navigation copy land first, then Home and Campaigns (highest user visibility), then Reviews, Library, Intelligence, Operations, then demo/seed alignment. Defer true new owner types (Brandon, Emailmarketing.com, etc.) as **display labels** until a later pass touches `approvalItems.owner` / auth roles, because the Convex union today only allows `bari` | `blue` | `internal` (`convex/schema.ts`).

---

## 2. Current App Surfaces Inspected

| Area | Primary files / routes |
|------|-------------------------|
| Routing | `app/[[...slug]]/page.tsx` (catch-all delegates by `slug[0]`) |
| Shell / nav / search | `components/app-shell.tsx`, `lib/navigation.ts`, `lib/branding.ts`, `lib/auth.ts` |
| Global metadata | `app/layout.tsx` |
| Home / dashboard | `components/campaign-sections.tsx` → `DashboardSection` |
| Campaigns list / create / detail | `components/campaign-sections.tsx` → `CampaignListSection`, `CampaignIntakeSection`, `CampaignDetailSection`, `CampaignRouteSection` |
| Reviews | `components/review-sections.tsx` → `ReviewRouteSection`, `modeConfig`, queue consoles |
| Libraries | `components/library-sections.tsx` → `libraryPageConfig`, `LibraryRouteSection`, `LibraryInventoryPage` |
| Intelligence | `components/intelligence-sections.tsx` → `LangGraphSection`, `AgentRunsSection`, `ResponsesSection`, `PerformanceSection`, `IntelligenceRouteSection` |
| Operations | `components/operations-sections.tsx` → `IntegrationsSection`, `KeapOperationsSection`, `OperationsRouteSection` |
| Demo / static data | `lib/data/demo-data.ts` |
| Today task defaults | `lib/today-tasks.ts` (used by `convex/todayTasks.ts`) |
| Agent seed definitions | `lib/agent-config.ts` (large), wired through `convex/agents.ts` |
| Shell search / notifications (Convex) | `lib/shell-data.ts` (demo constants; compare with `convex/globalStatus.ts` — inspected via grep for `getGlobalSearchRecords` / usage from shell) |
| Domain types | `lib/domain.ts` |
| Convex schema & seeds | `convex/schema.ts`, `convex/campaigns.ts`, `convex/todayTasks.ts`, `convex/approvals.ts`, `convex/integrations.ts`, `convex/library.ts`, `convex/agents.ts`, `convex/responses.ts` |

**Note:** `components/settings-section.tsx` exists for `/settings` but was not deep-read; Section 1 copy there is optional if settings should echo the new product description.

---

## 3. Current State vs Required State

### Home

| Topic | Current | Required (Section 1) | Should not change | Likely files | Risks |
|-------|---------|----------------------|-------------------|--------------|-------|
| Layout | Single column: `SectionHeader` + Current/History pills + scrollable task list (`DashboardSection`) | Add **Campaign Heartbeat** panel, **launch readiness snapshot**, **external follow-ups** card; keep task list | Task completion UX, Convex mutations, session return context | `components/campaign-sections.tsx`; optional small presentational components in `components/ui.tsx` | Vertical density; mobile scroll; avoid implying live heartbeat logic is implemented |
| Task copy | Tasks from `buildDefaultTodayTasks()` in `lib/today-tasks.ts`: Bari/Blue/Internal/Response/Integration/Campaign-oriented | Monday–Friday cadence; tags like Heartbeat, Handoff, Copy; owners Brett/Kelsey/Internal/Brandon/Emailmarketing.com/Campaign Heartbeat; Blue/Bari as rare examples | `todayTasks` table shape unless package explicitly adds fields | `lib/today-tasks.ts`, seed mutation `convex/todayTasks.ts`, task row rendering in `DashboardSection` | Existing Convex DBs with seeded tasks will **not** auto-refresh unless migration or manual clear — document for implementers |

### Campaigns

| Topic | Current | Required | Should not change | Likely files | Risks |
|-------|---------|----------|-------------------|--------------|-------|
| Nav label | Sidebar child: “Campaigns”, “Create Campaign” (`lib/navigation.ts`) | Keep **Campaigns** in nav; page title **Weekly Launch Campaigns**; create **Create Launch Packet** (button text can align) | Href `/campaigns`, `/campaigns/new` | `lib/navigation.ts`, `components/campaign-sections.tsx` | `/campaigns/create` appears in `excludedPrefixes` but routing only handles `new` — avoid introducing broken links |
| List | Table: Campaign, Type, Audience, Offer, Stage, Risk, Owner, Next action; filters Needs Bari / Blue / Keap / etc. | Reframe copy; add **placeholder** columns or secondary row for YouTube / email / creative / social / readiness where data missing | Convex list query behavior | `components/campaign-sections.tsx` | Adding many columns hurts responsiveness — use detail drawer or sub-row |
| Create | `CampaignIntakeSection`: intent, audience, offer, execution; inferred Bari/Blue checklist | Add **Production Hub** placeholder block; intro about launch packet | `createCampaignRecord` payload must remain valid for `campaignPatchValidator` | `components/campaign-sections.tsx`, `convex/campaigns.ts` | Do not require new fields for save until schema agreed |
| Detail | `CampaignDetailSection`: overview grid, approval lane, response/performance lane, three promo cards | Placeholder sections: Source Asset, YouTube, Email handoff, Creative, Social, Review gates, Performance + learnings | Route pattern `/campaigns/[id]` | `components/campaign-sections.tsx` | `performanceSnapshots` is **static import** from demo-data, not Convex — placeholders should not claim “live” |

### Reviews

| Topic | Current | Required | Should not change | Likely files | Risks |
|-------|---------|----------|-------------------|--------------|-------|
| Routes | `/reviews/all`, `/reviews/bari`, `/reviews/blue`, `/reviews/internal` via `ReviewRouteSection` | Same routes | URL paths | `components/review-sections.tsx` | None |
| Copy | `modeConfig`: “Founder Voice Review Console”, “Strategic Decision Console”, “Send Readiness Console”, “Master Approval Queue” | Reframe per spec: escalation owners, not universal bottlenecks; internal = launch packet readiness | Convex approval mutations, queue filtering by `owner` | `components/review-sections.tsx` | Copy must not imply new approval **routing** for Brandon/Email — not in schema |

### Libraries

| Topic | Current | Required | Should not change | Likely files | Risks |
|-------|---------|----------|-------------------|--------------|-------|
| Tabs | Seven routes in `lib/navigation.ts`; `libraryPageConfig` titles/summaries per key | Page intro as **Content Library**; note future **Google Drive / Obsidian** sync; add **future bucket** cards or nav entries for Copy Archive, Swipe File, etc. | `libraryItems.type` union in Convex — adding types is a **schema** change | `components/library-sections.tsx`, `lib/navigation.ts`, optionally `convex/schema.ts` (later package) | New tabs need Convex filtering or purely static “coming soon” pages to avoid empty broken editors |

### Intelligence

| Topic | Current | Required | Should not change | Likely files | Risks |
|-------|---------|----------|-------------------|--------------|-------|
| Structure | LangGraph map orders agents by `workflowOrder`; categories are free-form strings on `agentConfigs` | UI grouping into Copy Intelligence, Campaign Heartbeat, Production Bridge, Trend, Performance, Learning Loop; preserve copywriting core | Agent dry-run, `runAgentDryRun`, Convex seeding | `components/intelligence-sections.tsx`, `lib/agent-config.ts`, `convex/agents.ts` | Renaming `agentId` values breaks edges in `nextAgentIds`; prefer **displayName** and `category` string changes |
| Performance | `PerformanceSection`: aggregates `performanceSnapshots` from `lib/data/demo-data.ts` | Reframe as Performance Intelligence + placeholder subsections + demo disclaimer | Route under intelligence | `components/intelligence-sections.tsx`, `lib/data/demo-data.ts` | Do not claim real metrics until wired |

### Performance (as sub-area)

Performance is **not** a top-level sidebar section today; it lives at **`/intelligence/performance`** (`lib/navigation.ts`, `IntelligenceRouteSection`). Section requirements mention “Performance Intelligence” as part of Intelligence — **already partially present**; align copy and add placeholder blocks inside `PerformanceSection`.

### Operations

| Topic | Current | Required | Should not change | Likely files | Risks |
|-------|---------|----------|-------------------|--------------|-------|
| Integrations | Flat `IntegrationList` from Convex-seeded records (Keap, HelpDesk, Zapier, Clerk, LangGraph, OpenAI, Claude, Convex, Vercel) | Grouped categories + many **placeholder** cards (YouTube, Meta, Slack, Mux, Frame.io, etc.) with Manual / Not connected | `checkConnection` action behavior, no live posting | `components/operations-sections.tsx`, `lib/data/demo-data.ts`, `convex/integrations.ts` | Seeding many new rows increases DB size slightly; use `enabled: false` + clear copy for placeholders |
| Keap | `KeapOperationsSection` at `/operations/keap` | Reframe copy as registration/CRM handoff; keep manual export posture | Manual export actions | `components/operations-sections.tsx` | None |

### Demo / default data

| Topic | Current | Required | Likely files |
|-------|---------|----------|--------------|
| Campaigns | Reactivation / Webinar / Nurture examples; owner “Morgan Operator” | Weekly launch style names; owners Brett/Kelsey where shown | `lib/data/demo-data.ts`, Convex seeds via `convex/campaigns.ts` |
| Users | Alex Admin, Morgan Operator, Bari, Blue | Brett, Kelsey as defaults in copy (demo users table is separate from real Clerk) | `lib/data/demo-data.ts` |
| Agents / graph | Strategist, Audience, Copywriter, Bari Voice, Compliance, Router; linear LangGraph demo nodes | Group labels + optional renamed **display** agents; keep architecture | `lib/agent-config.ts`, `lib/data/demo-data.ts` (`langGraphNodes`, `agents` array) |
| Integrations | Nine integrations | Expand list for placeholders | `lib/data/demo-data.ts` |

### Convex schemas (read-only for this audit)

| Table | Relevant today | Gap vs Section 1 optional fields |
|-------|----------------|----------------------------------|
| `campaigns` | Rich email-era fields (`goal`, `channels`, `copyStatus`, `keapPrepStatus`, …) | No `publishDate`, `youtubeScheduledUrl`, handoff structs, `readinessStatus`, Production Hub IDs, etc. |
| `todayTasks` | `title`, `context`, `category`, `priority`, `sourceRoute`, `sourceLabel`, `destinationMode` | No `ownerLabel`, `taskCategory` enum, `dueDay`, `riskLevel`, `externalDependency` |
| `approvalItems` | `owner`: `bari` \| `blue` \| `internal` only | Cannot represent Brandon / Emailmarketing.com as queue owners without schema + app logic |
| `libraryItems` | `type` union of eight literals | New buckets may need `v.literal` additions or a generic `payload` convention |
| `agentConfigs` | `category: string` | Can encode **intelligence group** without migration if values are agreed |
| `integrationConnections` | `category: string` | Sufficient for UI grouping |

### Safety posture

| Mechanism | Evidence | Section 1 expectation |
|-----------|----------|------------------------|
| No auto-send (responses) | UI copy and `noAutoSend` on demo records; save/mark actions in `ResponsesSection` | Preserve; only copy updates |
| Human approval | Sidebar footer in `app-shell.tsx`; approval flows in `review-sections.tsx` | Preserve |
| Manual / dry-run integrations | Statuses `manual_mode`, `missing_credentials`; `IntegrationsSection` | Preserve; new cards default same posture |
| Agent dry-run | `runAgentDryRun` in `LangGraphSection` | Preserve |

---

## 4. Implementation Package Plan

### Package 1: Global language, navigation, and product framing

- **Purpose:** Establish “weekly launch and marketing coordination hub” without renaming routes or the shell.
- **Scope:** `appBranding` subtitle/name as appropriate; `app/layout.tsx` metadata description; optional `lib/navigation.ts` child **descriptions** (if surfaced anywhere — today mainly `titleFromSlug` uses **title** from nav); sign-in copy in `app-shell.tsx` if desired; search panel headings/placeholders in `app-shell.tsx`.
- **Likely files:** `lib/branding.ts`, `app/layout.tsx`, `lib/navigation.ts`, `components/app-shell.tsx`.
- **Exact changes:** Replace generic “campaign command center” phrasing with expanded Sage description; keep **OC** or Sage naming per stakeholder preference; ensure top bar / search strings mention launch coordination, not only email.
- **Do not:** Rename `navGroups` ids (`home`, `campaign`, …) or hrefs; redesign shell.
- **Depends on:** None.
- **Acceptance criteria:** Fresh load shows updated product description in metadata and branding-adjacent copy; sidebar structure unchanged.
- **Risk:** Low.

### Package 2: Home — weekly command center framing

- **Purpose:** Add Campaign Heartbeat, readiness snapshot, external follow-ups; keep Today tasks.
- **Scope:** `DashboardSection` layout only for new cards; use **placeholder or derived** strings (from first active campaign + static risk copy) until heartbeat backend exists.
- **Likely files:** `components/campaign-sections.tsx` (possibly extract subcomponents in same file or colocated files if split is preferred later).
- **Exact changes:** New `ControlPanel` / `QueueLane` blocks; grid layout (e.g. tasks + side column on xl); update `SectionHeader` eyebrow/title/description.
- **Do not:** Change `completeTodayTask` / `restoreTodayTask` contracts.
- **Depends on:** Package 1 optional (can parallelize).
- **Acceptance criteria:** Home visibly answers “what needs attention” beyond the task list; no new required Convex fields.
- **Risk:** Medium (layout regression on small screens).

### Package 3: Campaigns — weekly launch packets (list, create, detail)

- **Purpose:** Reframe list/create/detail for “launch packet” language and placeholder launch sections.
- **Scope:** `CampaignListSection` headers, filters copy, table headers (with “—” or derived values); `CampaignIntakeSection` intro + Production Hub placeholder; `CampaignDetailSection` additional read-only panels.
- **Likely files:** `components/campaign-sections.tsx`.
- **Exact changes:** Section headers, button labels, new placeholder `ControlPanel`s; map existing fields (`copyStatus`, `nextAction`, `channels`) to placeholder “YouTube status” etc. where honest.
- **Do not:** Require new Convex fields for create; do not remove Keap readiness language entirely (still true).
- **Depends on:** None; coordinates with Package 8 for demo names.
- **Acceptance criteria:** Campaign area reads as launch coordination; no broken navigation.
- **Risk:** Medium (wording vs actual data truthfulness — use “TBD” / “Not tracked yet”).

### Package 4: Reviews and escalation-owner language

- **Purpose:** Update `modeConfig` titles/descriptions and empty states so Bari/Blue are **escalation**, internal is **launch readiness**.
- **Scope:** `components/review-sections.tsx` copy; optional helper text under queues.
- **Likely files:** `components/review-sections.tsx`.
- **Do not:** Change `owner` union handling or mutations.
- **Depends on:** None.
- **Acceptance criteria:** `/reviews/*` pages match Section 1 intent; routes unchanged.
- **Risk:** Low.

### Package 5: Library — Content Library framing and future buckets

- **Purpose:** Intro copy + future bucket surfacing without mandatory new Convex types.
- **Scope:** `libraryPageConfig` summaries; optional top-of-page note for Drive/Obsidian; “Coming soon” cards for new bucket names **or** static rows in Learning/Email pages (minimal).
- **Likely files:** `components/library-sections.tsx`, optionally `lib/navigation.ts` (only if new routes are added — increases scope).
- **Do not:** Break CRUD for existing types; avoid new `libraryItems.type` literals until a dedicated schema package.
- **Depends on:** None.
- **Acceptance criteria:** Library reads as long-term knowledge base; existing tabs work.
- **Risk:** Low if new routes are avoided; higher if new routes + empty editors.

### Package 6: Intelligence — category grouping and copy

- **Purpose:** Present six intelligence groups while keeping LangGraph / runs / dry-run.
- **Scope:** `LangGraphSection` layout: group header strips or tabs that filter `orderedConfigs` by `category` string; hub landing `IntelligenceRouteSection` default branch expanded with six cards linking to existing routes; rename **display** fields in `lib/agent-config.ts` seeds.
- **Likely files:** `components/intelligence-sections.tsx`, `lib/agent-config.ts`, possibly `convex/agents.ts` if re-seeding strategy is documented.
- **Do not:** Change `agentId` graph edges without migration plan; do not enable live external calls.
- **Depends on:** Package 8 if Convex-seeded configs must match file defaults for fresh deploys.
- **Acceptance criteria:** Users see Copy Intelligence as primary; other groups visible as planned/dry-run.
- **Risk:** Medium (existing deployments have Convex `agentConfigs` rows — display updates may need `upsert` migration or “reset demo” instruction).

### Package 7: Operations — integration categories and placeholder cards

- **Purpose:** Group integrations and add placeholder systems with safe default statuses.
- **Scope:** `IntegrationsSection` grouping UI; extend `demo-data` integrations array; ensure `seedDefaultIntegrationRecordsIfEmpty` only runs on empty DB — **new envs may not appear** on already-seeded deployments without a separate migration mutation (document).
- **Likely files:** `components/operations-sections.tsx`, `lib/data/demo-data.ts`, optionally new `convex/integrations.ts` mutation for additive seed (future).
- **Do not:** Implement real APIs; do not set `connected` for social/email senders by default.
- **Depends on:** None.
- **Acceptance criteria:** All listed integration names appear as cards or grouped rows with Manual / Not connected posture.
- **Risk:** Medium for **existing Convex data** (seed-if-empty means placeholders need an additive migration path).

### Package 8: Demo data, seeds, and optional schema-safe field prep

- **Purpose:** Align demo campaigns, tasks, agents, integrations, performance copy with weekly launch story; optionally add **optional** Convex fields in a **separate controlled migration** (explicitly not part of “language only” if team wants zero schema drift).
- **Likely files:** `lib/data/demo-data.ts`, `lib/today-tasks.ts`, `lib/domain.ts`, `convex/schema.ts`, `convex/campaigns.ts`, `convex/todayTasks.ts`, `convex/globalStatus.ts` / `lib/shell-data.ts` for notifications alignment.
- **Do not:** Break existing documents: use optional fields and defaults in mutations.
- **Depends on:** Packages 2–7 for coherent narrative.
- **Acceptance criteria:** Fresh Convex seed + UI demo feels like weekly launch; Blue/Bari appear sparingly in examples.
- **Risk:** High if schema migrations are bundled without backfill strategy.

**Recommended order:** 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 (8 can partially overlap 6/7 for demo-only JSON first, Convex schema last).

---

## 5. Data and Schema Impact

### Already present (usable without schema change)

- **`agentConfigs.category`**: string — can drive intelligence group UI if conventions are documented (e.g. `copy_intelligence`, `campaign_heartbeat`).
- **`integrationConnections.category`**: string — can drive Operations grouping.
- **`campaigns` string fields** (`copyStatus`, `keapPrepStatus`, `nextAction`, `notes`): can hold **temporary** human-readable launch status text (hacky but zero migration) — acceptable only as interim if labeled honestly in UI.

### Optional fields **not** present; add only with migration plan

- All Section 1 campaign launch fields (`publishDate`, `youtubeScheduledUrl`, `emailBriefStatus`, …) from the requirements list — **none** in `convex/schema.ts` `campaigns` table today.
- **Today task** extended fields — **none**; only `category` as free text today.
- **Library** sync metadata — **none** in schema; could live in `payload` `v.any()` on `libraryItems` without new literals if UI is demo-only.

### Low-risk schema changes (when team approves Convex edits)

- Add **optional** fields to `campaigns` and `todayTasks` with defaults in `sanitize*` helpers and create mutations.
- Extend `integrationConnections` rows only via insert (no table shape change).

### Defer

- New `approvalItems.owner` values until review routing, auth, and Convex indexes (`by_owner_status`) are redesigned.
- New `libraryItems.type` literals until library CRUD and filters are ready.

### Avoid breaking existing Convex data

- Prefer **additive** optional fields and `v.optional` in validators.
- Avoid renaming stored `agentId` or `integrationId` keys without dual-read period.

---

## 6. Safety and Non-Goals

- **Preserve** `noAutoSend` / draft-only language on response intelligence; do not add auto-post or auto-send buttons.
- **Preserve** manual Keap export / handoff language in Operations.
- **Preserve** human approval queues and role gating (`lib/auth.ts`, `canApproveReviewItem`).
- **Do not** implement Production Hub, Drive, Obsidian, or social APIs in Section 1.
- **Do not** perform visual redesign of tokens, fonts, or shell layout beyond adding panels/cards consistent with existing `ControlPanel` / `SectionHeader` patterns.

---

## 7. Risks and Open Questions

**Risks**

1. **Seeded Convex data drift:** Many flows use `seedDefault*IfEmpty` — existing projects keep old tasks/campaigns/integration rows until manually cleared or migrations added.
2. **Truthfulness:** Mapping missing schema fields to “YouTube: Ready” would be misleading — prefer explicit “Not tracked” states.
3. **Performance data source split:** Campaign detail uses **imported** `performanceSnapshots` from demo-data, while Convex has `performanceSnapshots` table in schema — confirm intended source of truth in a later section to avoid duplicate stories.
4. **`/campaigns/create` vs `/campaigns/new`:** Navigation references `excludedPrefixes` including `/campaigns/create` but the implemented route is `new` — any external bookmarks to `create` may not match routing.
5. **Owner model:** Brett, Kelsey, Brandon, Emailmarketing.com, Campaign Heartbeat cannot be first-class approval **owners** without schema and UI rule changes.

**Questions for stakeholders before implementation**

1. Should branding remain **“Outreach”** / **OC** initials or shift to **“Sage Outreach Console”** in `appBranding.name` while keeping routes stable?
2. For Operations placeholders on **already-seeded** Convex deployments, is a one-time **additive seed mutation** acceptable, or must placeholders be **client-only** until DB reset?
3. Should new library “buckets” be **nav tabs** (more routes) or **in-page roadmap cards** only for Section 1?
4. Is Performance Intelligence required to move to a **top-level** nav item, or stay under `/intelligence/performance`?
5. Confirm **TVE** mention policy for any remaining webinar/event demo names in `demo-data`.

---

## 8. Recommended First Package

**Start with Package 1 (Global language, navigation, and product framing).**

Reason: It sets the vocabulary for all other UI changes, carries no data migration risk, and aligns `app/layout.tsx` metadata and `lib/branding.ts` with the hub positioning before deeper page edits. Package 2 (Home) should follow immediately after because it is the primary “daily command center” surface named in Section 1.
