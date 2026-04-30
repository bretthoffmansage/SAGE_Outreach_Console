# CURRENT_STATE_AUDIT_TEMPLATE

## Purpose

This file is the structured reality audit of the current project state.

It is designed to answer one question clearly:

**What actually exists right now in the codebase, config, data model, and shipped product surfaces?**

This audit is not aspirational.
It is not a roadmap.
It is not a PRD restatement.

It is a grounded inspection artifact used to support:

- roadmap generation
- execution-package generation
- package sequencing
- expansion decisions
- regression protection
- final audit and hardening later

This template should be used when generating `CURRENT_STATE_AUDIT.md` for a project.

---

## Audit rules

1. Prefer observable codebase reality over assumptions.
2. Label anything not verifiable from the repo or inspected environment as **unclear**.
3. Distinguish clearly between:
   - implemented
   - partial
   - legacy
   - stub
   - planned-only
4. Do not over-credit incomplete systems.
5. Do not hide major risks, drift, or contradictions.
6. If deployment/runtime truth is not available, say so explicitly.
7. Treat this document as the current-state truth source for planning.

---

## How to use this template

When generating `CURRENT_STATE_AUDIT.md`:

- inspect the actual repo structure
- inspect key config files
- inspect major runtime entry points
- inspect schema/data layer if one exists
- inspect primary routes/surfaces
- inspect auth and permissions posture
- inspect integrations and environment assumptions
- identify legacy vs target-direction systems
- record missing systems that the PRD assumes but the codebase does not yet support

This document should help later phases answer:

- what is already built?
- what is only partially built?
- what is legacy?
- what is missing?
- what is risky?
- what should the roadmap sequence protect or replace?

---

# Document structure

## Audit metadata

- **Audit date:** [YYYY-MM-DD]
- **Repository / project name:** [name]
- **Scope:** [what was inspected]
- **Method:** [static analysis / runtime inspection / mixed]
- **Important limitations:** [what could not be verified]

---

## Start here (fastest path to understanding)

List the most important files a future shell or reviewer should read first.

| Order | Path | Why |
|------:|------|-----|
| 1 | `[path]` | [Why it matters] |
| 2 | `[path]` | [Why it matters] |
| 3 | `[path]` | [Why it matters] |
| 4 | `[path]` | [Why it matters] |
| 5 | `[path]` | [Why it matters] |

### Critical wiring note
[Call out the single most important structural or runtime truth discovered during the audit.]

Examples:
- missing middleware wiring
- public backend functions without auth enforcement
- unused schema path
- legacy route still serving as actual operational surface
- planning docs far ahead of shipped code

---

# 1. Executive audit summary

## What the application appears to be
[Short, grounded description of what the project is in practice today.]

## What the main product does in practice today
List the actual main product flows, based on observed implementation.

1. [Flow 1]
2. [Flow 2]
3. [Flow 3]

## What the app appears optimized around right now
- [Optimization 1]
- [Optimization 2]
- [Optimization 3]

## What looks most complete
- [System/surface 1]
- [System/surface 2]
- [System/surface 3]

## What looks least complete
- [Gap 1]
- [Gap 2]
- [Gap 3]

## Biggest apparent architectural strengths
- [Strength 1]
- [Strength 2]

## Biggest apparent product/technical gaps
- [Gap 1]
- [Gap 2]
- [Gap 3]

## Signs of drift from a single product direction
- [Drift sign 1]
- [Drift sign 2]

---

# 2. Repository / project structure

## Top-level tree (conceptual)

```text
[repo-root]/
├── [folder]
├── [folder]
├── [file]
└── ...
## Major folders

| Path | Role | Active vs legacy |
|------|------|------------------|
| `[path]` | [role] | Active / Partial / Legacy / Stub |
| `[path]` | [role] | Active / Partial / Legacy / Stub |

## Duplicated or parallel structures
- [Parallel structure 1]
- [Parallel structure 2]

## Especially important root config files
- `[file]` — [why it matters]
- `[file]` — [why it matters]

---

# 3. Application architecture

## Frameworks and major technologies
- **Frontend:** [frameworks]
- **Backend:** [backend]
- **Auth:** [auth system]
- **Styling/UI:** [styling system]
- **State/data fetching:** [state/fetching approach]

## App / runtime structure
[Describe route groups, main runtime layers, app shell structure, etc.]

## Frontend architecture
[Client-heavy, server-heavy, mixed, modular vs page-heavy, etc.]

## Backend architecture
[Major modules, services, schema layers, API structure.]

## State / data flow
1. [step 1]
2. [step 2]
3. [step 3]

## Server vs client component patterns
[Observed pattern.]

## Conventions
- [Convention 1]
- [Convention 2]

## Inconsistencies / technical debt
- [Debt 1]
- [Debt 2]
- [Debt 3]

---

# 4. Routing / navigation map

## Route table

| Route | File | Purpose | Data source | Notes |
|------|------|---------|-------------|------|
| `[route]` | `[file]` | [purpose] | [source] | [notes] |

## Declared navigation vs visible navigation
[Summarize whether nav config and visible UI match.]

## Auth expectations vs actual code
[Summarize what routes appear protected, and whether that is actually wired.]

## Placeholder / low-value routes
- `[route]` — [why placeholder/stub/legacy]

---

# 5. Authentication / authorization / tenant model

## How auth is implemented
[Describe actual auth implementation.]

## How user identity is used
[Describe user sync, user records, session usage, etc.]

## Organization / tenant model
[Describe whether tenant/org boundaries exist structurally.]

## How tenant scoping is handled in code
[Observed enforcement vs assumptions.]

## Role checks today
[Observed role/permission logic.]

## Missing or partial enforcement
- [Gap 1]
- [Gap 2]

## Multi-tenancy mismatch
[If schema/posture suggests stronger multi-tenancy than shipped behavior, record it.]

---

# 6. Current product surface area

For each major surface, describe what it does, how complete it is, and where it lives.

## [Surface 1]
- **What it does:**  
- **Completeness:**  
- **Production readiness:**  
- **Key files:**  
- **Notes / risks:**  

## [Surface 2]
- **What it does:**  
- **Completeness:**  
- **Production readiness:**  
- **Key files:**  
- **Notes / risks:**  

Repeat for all meaningful product surfaces.

At minimum, include:
- primary operational surfaces
- secondary/supporting surfaces
- legacy surfaces
- placeholder/stub surfaces

---

# 7. Core-domain functionality audit

This section should inspect whether the product truly revolves around its claimed core domain.

## Does the app revolve around its core unit?
[Yes / Partially / No, with explanation.]

## Current primary domain model
[Describe the actual dominant domain model in shipped code.]

## Creation / editing flows
[Describe how core entities are created and edited today.]

## Detail / subview structure
[How operators navigate core records.]

## Operational capabilities matrix

| Capability | State | Where |
|-----------|-------|------|
| [capability] | Implemented / Partial / Missing | [files/modules] |

## Alignment with claimed product identity
- **Aligned:** [what matches]
- **Divergent / early:** [what does not yet match]

---

# 8. Data model / schema audit

If the project has a schema or structured backend, inspect it here.

For each major entity or table, record:

## `[Entity or table name]`
- **Purpose:**  
- **Key fields:**  
- **Relationships:**  
- **Indexes / access paths:**  
- **Used by:**  
- **Anomalies / risks:**  

Repeat for all meaningful entities.

## Loose JSON / unstructured data usage
[Call out `any`, blobs, JSON fields, etc.]

## Enum patterns vs free strings
[Call out where strong enums exist vs weak string-based state.]

## Overall model quality
[Grounded summary.]

If there is no real schema layer, say so explicitly and describe the current persistence shape instead.

---

# 9. Backend / service layer audit

## Public modules / service areas
| Module | Primary responsibilities |
|--------|--------------------------|
| `[module]` | [responsibility] |

## Internal-only or protected modules
[If applicable.]

## Tenant filtering consistency
[Strong / weak / absent, with examples.]

## Duplication / naming confusion
- [Issue 1]
- [Issue 2]

## Migration clues
[Comments, docs, transitional structures, etc.]

---

# 10. Frontend component audit

## Layout layer
[What composes the shell/chrome.]

## Shared UI layer
[What common UI system exists.]

## Core feature components
[What components seem central.]

## Editors / tables / timelines / special interfaces
[What actual interaction patterns exist.]

## Overall component maturity
[Grounded summary.]

---

# 11. State management / data fetching audit

- **Primary data-fetch pattern:**  
- **Local state pattern:**  
- **Global state pattern:**  
- **URL state usage:**  
- **Caching behavior:**  
- **Optimistic update behavior:**  

## Fragility notes
- [Risk 1]
- [Risk 2]

---

# 12. Design system / UI pattern audit

## Visual language
[Brief summary.]

## UI system posture
[Custom, design-system-backed, ad hoc, etc.]

## Common patterns
- [Pattern 1]
- [Pattern 2]

## Polish vs hacked-together assessment
- **Polished:** [what feels coherent]
- **Hacked together:** [what feels brittle or inconsistent]

---

# 13. Templates / blueprints / content systems audit

If the project contains template, library, blueprint, content, or reusable configuration systems, inspect them here.

## `[System 1]`
- **Purpose:**  
- **Data model:**  
- **UI / usage:**  
- **Role in the product:**  
- **Risks / drift:**  

Repeat as needed.

## Assessment
[How central these systems are to the actual shipped product.]

---

# 14. Product-mode / domain-mode audit

If the PRD describes distinct modes, personas, or product postures, audit whether they exist in shipped code.

## Claimed modes
- [Mode 1]
- [Mode 2]

## Actual implementation state
- [What exists]
- [What is missing]
- [What is plans-only]

If this concept does not apply to the project, say so explicitly.

---

# 15. External integration audit

## Expected external systems
| System | Evidence in code | Implementation state |
|--------|------------------|----------------------|
| `[system]` | [evidence] | Implemented / Partial / Static only / Missing |

## Environment-driven integrations
[Which env vars / config-driven integrations are actually present.]

## Integration maturity
[Grounded summary.]

---

# 16. File / storage / upload handling

## File storage posture
[How file upload/storage is handled if at all.]

## Asset/media handling
[What exists vs what is missing.]

## Risks / limitations
- [Limitation 1]
- [Limitation 2]

If not applicable, say so explicitly.

---

# 17. AI / automation audit

## AI features present?
[Yes / Partial / No.]

## Automation present?
[Deterministic workflows, scripts, schedulers, etc.]

## Conclusion
[Grounded summary of AI/automation reality.]

---

# 18. Environment / config / secrets audit

## Verified from code

| Variable | Required? | Consumed by | Notes |
|----------|-----------|-------------|------|
| `[VAR_NAME]` | Yes / No / unclear | `[consumer]` | [notes] |

## Convention-based assumptions
[What is standard but not directly verified.]

## Backend deployment assumptions
[What appears required but not provable from code alone.]

## Optional / stale risk
[Call out dead or probably-unused config paths.]

---

# 19. Deployment / build / operations audit

## Intended hosting / runtime
[Inferred hosting or deployment posture.]

## Scripts
- `[script]` — [purpose]
- `[script]` — [purpose]

## Rendering / runtime posture
[SSR, CSR, mixed, etc.]

## Middleware / gateway complexity
[What exists and what may be missing.]

## Production blockers
1. [Blocker 1]
2. [Blocker 2]

## CI/CD
[What is present, absent, or unclear.]

---

# 20. Known inconsistencies / drift / technical debt

| Topic | Detail |
|------|--------|
| `[topic]` | [detail] |
| `[topic]` | [detail] |

This section should consolidate the most important contradictions or debt signals found in the audit.

---

# 21. Comparison-ready product interpretation

This section should answer:

**What product has actually been built?**

## What product has actually been built
[Short grounded summary.]

## Center of gravity
[What part of the codebase is truly central today.]

## What kind of system is it in practice?
[Grounded interpretation.]

## Primary data backbone
[What actual data backbone is dominant.]

## Pillars that exist meaningfully
- [Pillar 1]
- [Pillar 2]

## Pillars absent or underdeveloped
- [Missing pillar 1]
- [Missing pillar 2]

---

# 22. Feature completion matrix

| Area / Feature | Exists? | Current State | Key Files | Notes / Risks |
|----------------|---------|---------------|-----------|---------------|
| `[feature]` | Yes / Partial / No | [state] | `[files]` | [notes] |

This matrix should be broad enough to support roadmap generation directly.

---

# 23. Recommended reality map of the current app / system

## Core backbone (shipped and wired end-to-end)
- [Backbone area 1]
- [Backbone area 2]

## Supporting systems
- [Support area 1]
- [Support area 2]

## Experimental / partial systems
- [Partial area 1]
- [Partial area 2]

## Incomplete systems
- [Incomplete area 1]
- [Incomplete area 2]

## Legacy or transitional systems
- [Legacy area 1]
- [Legacy area 2]

## Most important files for onboarding
1. `[path]`
2. `[path]`
3. `[path]`
4. `[path]`

---

## End-of-audit note

This document reflects the repository and environment state as inspected.

Deployment-specific behavior, external backend configuration, real production data, or hosting details may differ and should be validated separately if they are important to later planning.

---

## Minimal completion checklist for generated CURRENT_STATE_AUDIT.md

A generated `CURRENT_STATE_AUDIT.md` should be considered good enough when:

- the actual product center of gravity is clear
- major active surfaces are distinguished from legacy/stub surfaces
- the schema/data backbone is clear enough to plan against
- auth/access/tenant posture is described honestly
- major missing systems are called out
- major drift or contradictions are explicit
- the audit is useful for roadmap and package generation
- anything unverified is labeled **unclear**

---

## Final note

A good current-state audit should make it easy for later shell phases to answer:

- what is already real?
- what is fake, stubbed, or legacy?
- what are the major risks?
- what foundations already exist?
- what should later packages preserve, replace, or build on?

That is the purpose of this template.