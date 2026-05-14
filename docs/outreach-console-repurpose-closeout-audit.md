# Outreach Console — Repurpose Closeout Audit

**Date:** 2026-05-13  
**Scope:** Sections 1–10 stabilization, coherence, routing, naming, safety, and readiness (no new major feature area).

---

## 1. Product identity and outcome

**Sage Outreach Console** is positioned as a **weekly launch and marketing coordination hub**: plan campaigns, edit Weekly Launch Packets, run Campaign Heartbeat into Today Tasks, organize the Content Library, reference production assets via Production Bridge, use Copy / Trend / Performance / Platform Connector intelligence as **human-controlled** layers, prepare Knowledge Sync (Drive / Obsidian) safely, and see Operations integrations in **honest** modes (manual, planned, read-only future, dry-run).

The npm package name may still read `ai-campaign-desk` in `package.json`; UI and docs use **Outreach Console** / Sage branding.

Internal naming uses **broad** terms (Weekly Launch Packet, Campaign Heartbeat, Content Library, etc.). **TVE** appears in demo campaign copy, event names, and examples—not as a prefix on internal system names (`components/`, `lib/` grep: no `TVE` / `tve` in TS/TSX sources).

**Production Hub** remains separate: Outreach Console **references** asset IDs, titles, Frame.io/Mux fields, and readiness text; it does not claim to own raw files, Frame.io sync, or production versioning.

---

## 2. Sections 1–10 (what shipped)

| Section | Focus |
|--------|--------|
| 1 | Language / layout repurpose toward launch coordination |
| 2 | Editable Weekly Launch Packet on campaign detail |
| 3 | Campaign Heartbeat V1 → checks, tasks, history |
| 4 | Content Library expansion (buckets, hub, inventory) |
| 5 | Production Bridge (cached assets, manual/read-only framing) |
| 6 | Copy Intelligence (multi-agent, draft-only, dry-run) |
| 7 | Trend Intelligence (signals, research dry-run, campaign links) |
| 8 | Performance Intelligence (Convex snapshots, reviews, learnings) |
| 9 | Google Drive / Obsidian sync **preparation** (preview, metadata, no destructive sync) |
| 10 | Meta / Platform Connector **exploration** (integrations, readiness dry-run, `platformInsights`, agents—**no** Meta write or live API) |

---

## 3. Architecture (high level)

- **Frontend:** Next.js App Router (`app/[[...slug]]/page.tsx`), `AppShell`, route sections under `components/*-sections.tsx`.
- **Backend:** Convex (`convex/schema.ts`, queries/mutations per domain).
- **Auth:** Clerk for sign-in; client-side role gating in UI (`useAppUser`, `canApproveReviewItem`, etc.).

**Important:** Convex mutations are not uniformly wrapped in server-side `ctx.auth` / role checks in this codebase. Treat as **high-priority hardening** before any live integration or write path (see §12).

---

## 4. Key routes (verified in code)

| Area | Pattern | Handler |
|------|-----------|---------|
| Home | `/`, `/dashboard` | `DashboardSection` |
| Campaigns | `/campaigns`, `/campaigns/new`, `/campaigns/create` | List; intake; **`create` → same intake as `new`** + **Next redirect** to `/campaigns/new` |
| Campaign detail | `/campaigns/[id]` | `CampaignDetailSection` |
| Reviews | `/reviews/all`, `bari`, `blue`, `internal` | `ReviewRouteSection`; **unknown segment → `all`** |
| Libraries | `/libraries`, `/libraries/[segment]` | Hub; `knowledge-sync` screen; inventory via `libraryPageConfig` keys |
| Intelligence | `/intelligence` (hub), `/intelligence/copy`, `trends`, `heartbeat`, `langgraph`, `agent-runs`, `responses`, `performance`, `platform-connector` | `IntelligenceRouteSection` |
| Operations | `/operations/integrations`, `keap`, `production-bridge` | **Unknown child → explicit “not found” + links** (not Keap, not silent Integrations) |
| Settings | `/settings` | `SettingsSection` (fallback in `page.tsx` for non-matched top-level slugs) |

**Library segments** aligned with `LibraryPageKey` / `library-routes.ts`: `email`, `offers`, `voice-rules`, `signoffs`, `audiences`, `compliance`, `learning`, `copy-archive`, `swipe-file`, `voice-style`, `audience-intelligence`, `cta-library`, `platform-playbooks`, `campaign-learnings`, `source-imports`, plus **`knowledge-sync`** as a dedicated screen.

---

## 5. Key Convex tables (non-exhaustive)

`campaigns`, `todayTasks`, `heartbeatChecks`, `approvalItems`, `approvalEvents`, `libraryItems`, `learningInsights`, `librarySyncJobs`, `obsidianExportRecords`, `knowledgeSourceMappings`, `productionAssets`, `productionBridgeSyncJobs`, `trendSignals`, `trendResearchRuns`, `performanceSnapshots`, `performanceReviews`, `platformInsights`, `agentConfigs`, `agentRuntimeStates`, `agentRuns`, `integrationConnections`, plus existing CRM/helpdesk-related tables as before.

Optional fields on campaigns and snapshots are **optional** for backward compatibility.

---

## 6. Integration and trust modes (current)

| Integration class | Mode in UI / seeds |
|-------------------|------------------|
| Keap, runtime AI, etc. | As per Convex rows + connection checks |
| Google Drive / Obsidian | Planned, preview/manual export, **no** live bidirectional sync claimed |
| Meta / Instagram / Facebook / Meta Ads / MCP | **Planned / manual / read-only future / dry-run**; readiness check **does not** call Meta APIs |

No feature pass should introduce **auto-send**, **auto-post**, **auto-publish**, **ad/campaign writes**, **auto-approval**, or **destructive** Drive/Obsidian behavior.

---

## 7. Closeout code fixes (this audit)

1. **`/campaigns/create`:** `next.config.ts` **permanent redirect** to `/campaigns/new`; `CampaignRouteSection` also treats `create` like `new` so behavior is consistent if redirect is bypassed.
2. **`/operations/unknown`:** No longer defaults to **Integrations** (which implied the wrong page). Renders a clear **not found** panel with links to Integrations, Keap, Production Bridge.
3. **`/reviews/unknown`:** Unknown second segment normalizes to **`all`** so title/filter stay coherent.

---

## 8. Smoke test checklist (manual + automated)

**Automated in repo (2026-05-13):**

- `npx tsc --noEmit` — passing.
- `npm run build` (Next.js 16.2.4) — **completed successfully** after closeout routing changes.

**Manual (operator):**

1. Load Home `/dashboard` — Today Tasks, Heartbeat panel, checkpoints.
2. Run Campaign Heartbeat — tasks dedupe, no external calls (Convex-only).
3. `/campaigns` list and `/campaigns/new` intake; open a real packet; edit/save; refresh persistence.
4. `/campaigns/create` — lands on **new** intake (redirect).
5. Review queues and approve/request changes (Convex).
6. Library hub + several bucket URLs + Knowledge Sync.
7. Intelligence hub + Copy, Trend, Performance, Platform Connector, LangGraph.
8. Operations integrations + Meta readiness dry-run.
9. Global search and notifications — no crash on load.
10. Confirm no UI claims **live** YouTube/Meta/Drive/Obsidian unless row status supports it.

---

## 9. Known limitations (document for stakeholders)

1. **Production Bridge:** Manual cache / read-only planning—not full Production Hub sync.
2. **Google Drive:** Indexing prepared/future; not live connected by default.
3. **Obsidian:** Markdown preview / manual export path; not automatic vault write.
4. **Meta / Platform Connector:** Planned, manual, demo; **no** posting, ads API, OAuth, or webhooks in app.
5. **Performance / Trend:** Manual, demo, and `_future` source labels until real read-only connectors exist.
6. **Copy Intelligence:** Dry-run / demo provider unless real LLM keys and policies are enabled.
7. **Learning candidates:** Require human promotion to trusted learnings.
8. **Blue / Bari:** Escalation paths in copy and reviews—**not** default owners for every task (copy in `review-sections.tsx` reflects this).
9. **Convex auth hardening:** Server-side `ctx.auth` and role checks on mutations/actions should be implemented **before** trusting multi-tenant or live-write scenarios.

---

## 10. Recommended next phase (pick one track)

- **Track A — Real weekly usage:** One launch cycle; fix friction on Home, packet, Heartbeat, handoffs.
- **Track B — Production Hub read-only bridge:** Read-only listing/selection from real API or export.
- **Track C — Copy apply workflow:** Preview + apply selected fields to campaign + review items.
- **Track D — Performance manual workflow:** Habit + learning candidate promotion loop.
- **Track E — Convex auth:** `ctx.auth`, roles, audit logging before live integrations.

**Avoid next:** Auto-posting, auto-emailing, Meta ad writes, full Drive/Obsidian sync, replacing Production Hub, another full UI rewrite.

---

## 11. Acceptance mapping (closeout criteria)

| # | Criterion | Status |
|---|-----------|--------|
| 1 | Implemented routes reviewed | Yes (code + this doc) |
| 2 | Broken nav links fixed or removed | Addressed: `create`, ops unknown, review unknown |
| 3 | Naming not overly TVE | Yes in TS/TSX |
| 4 | Heartbeat / tasks coherent | Prior work; spot-check in Track A |
| 5 | Campaign packet save/display | Prior work; spot-check in Track A |
| 6 | Reviews work | Prior work + invalid route fix |
| 7 | Library / sync safe | Prior work + hub routes |
| 8 | Production Bridge separate | Copy + behavior |
| 9–11 | Intelligence modes | Draft/manual/planned labeled |
| 12 | Knowledge Sync non-destructive | Prior work |
| 13 | Meta no-write | Section 10 + seeds |
| 14 | Operations honest | Cards + readiness + ops unknown fix |
| 15 | Demo data coherent | Seeds across domains; demo labels |
| 16 | Old flows not broken | Regression via build + manual smoke |
| 17 | App builds | **Pass:** `npm run build` (Next 16.2.4, 2026-05-13) |
| 18 | This doc | **This file** |
| 19 | Limitations + next phase | §9–§10 |

---

*End of closeout audit document.*
