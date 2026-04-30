# CURRENT_STATE_AUDIT — AI Campaign Desk

Date: 2026-04-30  
Inputs: `PRD_SOURCE.md`, current repository state, raw PRD source.

## CSA-001 — Executive Current-State Summary
The repository currently contains the ForgeShell reusable shell and raw/normalized planning artifacts only. There is no implemented AI Campaign Desk application yet: no Next.js app, no package manifest, no TypeScript source, no Convex backend, no Clerk integration, no UI routes, no seed data, no agent workflow code, and no integration adapters.

This is a fresh greenfield build. The current state is therefore suitable for dependency-aware scaffolding from the PRD rather than refactoring an existing app.

## CSA-002 — Repository Inventory
Present:
- ForgeShell runtime/control docs under `shell/`
- Bootstrap/runtime helper scripts under `bootstrap/` and `scripts/`
- Raw PRD in `raw_prd/AI_Campaign_Desk_PRD.md`
- Normalized requirements in `PRD_SOURCE.md`
- Runtime config folders `.codex/`, `.claude/`, `.forgeshell/`

Missing application artifacts:
- `package.json`
- Next.js app directory/source
- TypeScript configuration
- Tailwind/PostCSS configuration
- UI component library
- Convex schema/functions
- Clerk middleware/provider integration
- Seed/demo data
- Agent and workflow modules
- Integration adapters/status contracts
- Tests or validation scripts

## CSA-003 — Active Product Surfaces
No product surfaces are implemented.

Required PRD surfaces not yet present include:
- App shell/sidebar/top bar (`PRD-006`, `PRD-007`)
- Dashboard (`PRD-025.1`, `PRD-027`)
- Campaign list/detail/new flow (`PRD-008`)
- Bari/Blue/internal review queues (`PRD-012`, `PRD-013`, `PRD-014`)
- Source-of-truth libraries (`PRD-015`)
- Agent runs and LangGraph visualization (`PRD-009`, `PRD-010`, `PRD-011`)
- Integrations/Keap operations (`PRD-018`, `PRD-021`)
- Response intelligence (`PRD-016`)
- Performance and learning (`PRD-017`)
- Settings/users/roles/agents/prompts (`PRD-003`, `PRD-004`, `PRD-018`)

## CSA-004 — Architecture Posture
The PRD specifies a Next.js App Router + TypeScript + Tailwind + Convex + Clerk + OpenAI/LangGraph/Anthropic integration architecture (`PRD-004`). None of this has been scaffolded yet.

Because there is no existing product codebase to preserve, implementation should adopt the PRD stack directly. Credentials are not available, so live integrations should be scaffolded with env documentation, status contracts, mock/demo data, and manual fallbacks per `PRD-005` and `PRD-018`.

## CSA-005 — Data and Backend State
No Convex backend exists yet. The data model requirements in `PRD-019` are fully unimplemented.

Initial backend work must cover typed schemas and seed/demo data for campaigns, approvals, libraries, agent runs, LangGraph nodes, integrations, response intelligence, performance, and learning. Live external API calls should remain safely disabled or mocked until credentials are configured.

## CSA-006 — Auth and Permissions State
No Clerk integration or RBAC exists. `PRD-003` requires roles for admin, marketing operator, copy reviewer, Bari, Blue, internal reviewer, and viewer.

Initial implementation should provide a Clerk-compatible auth shell and a deterministic local/demo role posture so pages can be developed and reviewed without live Clerk credentials.

## CSA-007 — Integration State
No integration contracts are implemented. Required integrations are documented in `PRD-005` and `PRD-018`.

All external integrations should begin in scaffold/demo mode:
- Clerk/Convex/OpenAI/Anthropic/Keap/Zapier/HelpDesk/LangGraph visible in integration settings
- Missing env keys displayed as setup/disconnected states
- Manual export/import/fallback paths for Keap, Zapier, and HelpDesk
- No live token logging or frontend key exposure

## CSA-008 — UX and Design State
No UI exists. The PRD requires a polished internal SaaS command-center style (`PRD-007`, `PRD-027`). Design system foundations must be established before page implementation to avoid a fragmented dashboard.

## CSA-009 — Risks and Blockers
### True blockers
None for a scaffolded/demo-capable first build. The PRD explicitly permits mocked/manual fallback operation when integrations are missing.

### Major risks
- Broad scope could lead to shallow route stubs unless packages prioritize coherent workflows.
- Auth/Convex/live integrations may fail without credentials unless gracefully isolated.
- Agent orchestration could become overbuilt too early; start with typed simulated outputs and stored run steps before live providers.
- Bari/Blue UX must remain non-technical even while admin/operator surfaces expose agent details.
- Package boundaries must preserve PRD traceability across many modules.

## CSA-010 — Planning Implications
The first implementation package should scaffold the application foundation, theme, navigation, route map, data contracts, and seed/demo posture. Subsequent packages should implement core workflows in PRD order: campaign lifecycle, review queues, libraries, agents/LangGraph, integrations, response/performance/learning, then polish/hardening.
