# REUSABLE_SHELL_WORKFLOW

## Purpose

This document defines the end-to-end workflow of the reusable autonomous shell.

It explains how the shell should move from:

- a user-supplied PRD

to:

- generated planning/control docs
- bounded execution packages
- autonomous package execution
- blocked-package expansion
- package-by-package commits
- final audit
- hardening
- functional fidelity uplift
- closeout

This workflow is the operational backbone of the reusable shell.

It is not project-specific product logic.

It is the generic execution lifecycle.

---

## Workflow objective

The shell must be able to run a complete project lifecycle with minimal manual intervention.

The intended outcome is:

1. accept a new project PRD
2. normalize it
3. assess current state
4. create a roadmap
5. generate execution packages
6. execute packages one at a time
7. expand blocked packages when needed
8. commit after each completed package
9. recover from interruption with `continue`
10. generate final audit
11. generate hardening plan
12. generate hardening tasks
13. execute hardening passes
14. run functional fidelity uplift before closeout
15. end in a clean, truthful closeout state

---

## Fresh-run local git repository (automatic `git init`)

ForgeShell depends on **git-aware** workflow behavior throughout the lifecycle—for example `git status`, `git diff --stat`, clean-tree checks, and package/pass closeout commits. A **fresh** project directory may not yet have a local git repository; the shell must not silently assume git exists while still expecting those behaviors.

### When automatic `git init` is allowed

The shell may run **`git init`** at the **shell project root** (the repo/worktree directory where the ForgeShell run applies) **only when all** of the following are true:

1. **Fresh/new project run** — the session is starting ForgeShell’s normal lifecycle for this root (e.g. `begin` / `start` on a workspace that is fresh or early enough that git has not been established here yet), not ad-hoc doc-only work that explicitly opts out of git-dependent closeout.
2. **No git repository at that root** — `.git` does **not** exist at the shell project root.
3. **Git-aware workflow is in play** — the shell will use git for inspection and closeout as defined in this workflow and related control docs.
4. **No explicit opt-out** — the operator has not stated (in chat, PRD, or project docs the shell honors) that this workspace must **not** be initialized by the shell.

### Required behavior when the criteria are met

Early in the **fresh-run** startup path—**before** relying on git-dependent closeout or treating git state as authoritative—the shell must:

1. Confirm whether a local git repository exists at the shell project root.
2. If not, run **`git init`** there.
3. Verify git is usable (e.g. `git status` or equivalent succeeds).
4. **Acknowledge** initialization with **unambiguous** operator-visible wording (and/or an entry in `agent_runs/`): state explicitly whether the repo was **newly initialized** in this step **or** git was **already present** and **no** `git init` was run—so messages like “Reinitialized existing repository” are not left unexplained when the shell intended a first-time init.
5. Continue with normal workflow (raw PRD intake, Phase A, etc.).

If git is **required** for the documented workflow but **cannot** be established safely (criteria not met, or ambiguity below), the shell must **escalate** rather than proceed as if commits and clean-tree rules will work.

### What the shell must not do

- **Re-init** when `.git` already exists.
- **Add remotes**, create GitHub repositories, or assume hosting—**local repository only**.
- **Initialize blindly in ambiguous nested-repo situations**—for example if the workspace is inside another git work tree, or it is unclear which directory is the intended shell root; treat that as a **real ambiguity** and **escalate** (or resolve with explicit operator guidance), not as a silent `git init` in the wrong place.
- **Silently ignore** missing git while still expecting package/pass commits and clean-tree discipline.

Normative runtime placement: `shell/control/AGENT_RUNTIME_SETUP.md`. Trigger alignment: `shell/reusable/REUSABLE_SHELL_RESUME_CONTRACT.md`, `shell/reusable/REUSABLE_SHELL_PROMPTS.md`.

---

## PRD coverage accounting

**Material** PRD requirements must **not** be silently dropped or forgotten. Normalizing `PRD_SOURCE.md` (Phase A) is necessary but **not sufficient**: traceability must continue through planning, package execution, blocked-package expansion, and final audit.

Every **material** PRD requirement must end up in **exactly one** of these buckets (and that assignment must be **visible** in roadmap, packages, logs, or audit text—not implied):

1. **Implemented now** — evidenced in shipped work when the audit runs.
2. **Scheduled in a package** — committed by `EXECUTION_PACKAGES.md` (or an explicit roadmap chapter that packages honor).
3. **Intentionally deferred** — recorded with rationale and traceable PRD anchors.
4. **Explicitly out of scope** — recorded as a deliberate product/planning decision.
5. **Ambiguous / requires clarification** — recorded; escalate when blocking.

If something is not implemented yet, it must still be accounted for under (2)–(5). The **final audit** must treat any **material** PRD item that remains **unaccounted for** as a **defect** in planning or audit quality (not as silent acceptance).

### External integration handling (default posture)

When PRD requirements include third-party/external integrations (for example auth, backend, billing, storage, or deployment providers), the shell should classify each requested integration during intake/planning into one of these practical states and keep that state visible in planning/execution/closeout notes:

1. **Ready now** — required project credentials/setup already exist and work can proceed live.
2. **Scaffold only** — meaningful app structure can be built now using placeholders/contracts without live provisioning.
3. **Requires user setup after build** — implementation can proceed now, but final provider setup is explicitly deferred to operator follow-up.
4. **True blocker** — safe, meaningful generation/execution cannot continue without external setup now.

Default behavior is **scaffold now / configure later** when safe. The shell must **not** stop up front for external setup by default.

Escalate before build only when an integration is a **true blocker**: the PRD explicitly requires it for the active unit, meaningful execution cannot proceed with placeholders/contracts, and the shell cannot safely narrow around it.

---

## High-level workflow phases

The shell lifecycle is divided into nine phases:

- Phase A — Intake
- Phase B — Planning generation
- Phase C — Package execution
- Phase D — Hardening (final audit + hardening planning + hardening execution)
- Phase E — Functional Fidelity Uplift
- Phase F — High-End Design Pass
- Phase G — Post-Uplift Validation (reserved; not implemented in this pass)
- Phase H — Final closeout
- Phase I — Optional packaging (ForgeShell handoff), only when `.forgeshell/packaging.json` exists

Each phase has:
- entry conditions
- outputs
- validation expectations
- exit conditions

---

# Phase A — Intake

## Goal

Accept the user’s starting project input and convert it into a shell-usable requirements source.

## Inputs
- raw user PRD, resolved per the **canonical raw PRD intake** rule in `shell/reusable/REUSABLE_SHELL_RESUME_CONTRACT.md`:
  - on a fresh run, inspect `raw_prd/` first
  - if `raw_prd/` **exists**: exactly **one** top-level regular file in that folder is the raw PRD; **zero** files → structured escalation (no raw PRD found); **more than one** → structured escalation (multiple candidates; do not guess)
  - if `raw_prd/` **does not exist**: fall back to the existing loose convention (operator-provided PRD or brief, e.g. chat or files the operator indicates) — no new mandatory root-level filename
- optional project notes or constraints
- optional repo/codebase if the shell is running against an existing codebase

## Outputs
- normalized `PRD_SOURCE.md`

## Required actions
1. on a **fresh** run at the shell project root, apply **Fresh-run local git repository (automatic `git init`)** before relying on git for this phase or later closeout—do not skip `git init` in the narrow safe case; do not init outside that case without resolving ambiguity
2. resolve and ingest the raw PRD per the rule above (escalate if `raw_prd/` exists but is ambiguous or empty)
3. normalize terminology and structure
4. preserve intent without inventing certainty
5. create stable sections/anchors for later reference

## Validation expectations
- the normalized PRD is readable and structured
- major goals, constraints, and scope are preserved
- the output is usable as a source document for later phases

## Exit condition
- `PRD_SOURCE.md` exists and is ready for audit/roadmap generation

---

# Phase B — Planning generation

## Goal

Generate the project’s initial control documents before implementation begins.

## Inputs
- `PRD_SOURCE.md`
- current repo/codebase state if applicable

## Outputs
- `CURRENT_STATE_AUDIT.md`
- `MASTER_ROADMAP.md`
- `EXECUTION_PACKAGES.md`

## Required actions

### B-1 — Current-state audit
Create a truthful description of the current system:
- active surfaces
- architecture posture
- gaps vs PRD
- legacy/transitional areas
- risks and blockers

### B-2 — Roadmap generation
Convert the PRD and current-state gaps into:
- major phases/chapters
- dependency-aware order
- strategic progression

### B-3 — Execution package generation
Convert roadmap chapters into bounded packages:
- in dependency order
- mostly draft-first
- earliest grounded packages may be ready
- later packages should remain draft until expanded

## Validation expectations
- planning docs are internally consistent
- package order matches roadmap logic
- package statuses are honest
- later phases are not falsely over-specified
- **PRD coverage accounting** (see above) is visible across audit, roadmap, and packages—no silent omission of **material** PRD requirements

## Exit condition
- all core planning docs exist and are usable for autonomous execution

---

# Phase C — Package execution

## Goal

Work through `EXECUTION_PACKAGES.md` in strict sequence until the package list is exhausted or a real blocker occurs.

Package execution and blocked-package expansion must uphold **PRD coverage accounting** (see above): **material** PRD commitments must not be silently dropped—explicit deferment, out-of-scope, or ambiguity must remain traceable in packages, logs, or docs.

## Inputs
- `EXECUTION_PACKAGES.md`
- `shell/control/AGENT_OPERATING_RULES.md`
- `shell/control/PACKAGE_EXPANSION_PROTOCOL.md`
- runtime state
- current repo state

## Outputs
- completed package code/docs
- execution logs
- expansion logs
- package status updates
- per-package commits

## Core loop

For each iteration:

1. determine the next package in sequence
2. inspect package status
3. if ready, execute it
4. if draft/underdefined, invoke blocked-package expansion
5. execute the narrowed package after successful expansion
6. validate
7. self-correct in scope if validation fails
8. close the package honestly
9. commit the package
10. ensure clean tree
11. continue automatically to the next package (implementation for the **next** package starts only **after** step 10—see Phase C.5 **Inter-package boundary**)

---

## Phase C.1 — Ready package execution

### Entry condition
- next package is marked ready

### Actions
- inspect package scope and dependencies
- inspect relevant code/docs
- implement within package boundaries
- run required checks
- run regression checks
- fix in-scope failures
- log results
- mark package status honestly

### Exit condition
- package is complete, blocked, or needs_review

---

## Phase C.2 — Blocked-package expansion

### Entry condition
- next package is draft, underdefined, or otherwise not directly executable

### Actions
1. invoke blocked-package expansion stage
2. use `shell/control/PACKAGE_EXPANSION_PROTOCOL.md`
3. attempt iterative self-narrowing
4. rewrite the package into the thinnest safe executable slice if possible
5. create expansion log
6. return control to executor automatically

### Exit condition
- package is now executable
- or shell raises structured escalation because safe narrowing is impossible

---

## Phase C.3 — Iterative self-narrowing behavior

When narrowing is required, the shell should try progressively smaller safe slices.

Preferred narrowing patterns:
- internal-only before external
- read-only before writable
- single-workflow before subsystem-wide
- existing surface before new surface
- structured foundation before richer platform
- additive schema before risky migration
- human-reviewed output before autonomous mutation

The shell should stop only when even the thinnest safe slice still requires unresolved product/architecture judgment.

---

## Phase C.4 — Structured escalation if narrowing fails

If narrowing cannot safely produce an executable package, the shell must raise a structured escalation to the user.

That escalation must include:
- what is blocked
- why narrowing failed
- what decision is required
- available choices
- continue-ready option
- explicit stop option

The shell should only stop if the user explicitly chooses stop.

---

## Phase C.5 — Post-package commit closeout

After each completed package, the shell must automatically:

1. inspect diff/stat
2. review changed files
3. revert known unintended generated drift
4. stage all relevant changes and new files
5. create a package commit
6. run `git status`
7. confirm a clean tree
8. continue to the next package

**Inter-package boundary:** steps 1–7 must complete **before** any new implementation edits for the **next** package. The shell must **not** continue editing (including the same files the next package will touch) after the current package is complete but **before** its commit and clean-tree verification. Adjacent packages often share paths; that overlap **does not** permit merging two package closeouts into one commit. If one commit per package is truly impossible, document an explicit checkpoint and call out any exception in the final audit—never silently combine units.

This is mandatory workflow behavior.

---

## Phase C.6 — Resume behavior during execution

If the shell is interrupted during Phase C and the user later types:

`continue`

the shell must:

1. inspect repo state
2. inspect package logs and package statuses
3. identify the last completed package
4. identify the active or partial package
5. determine whether it needs:
   - resumed implementation
   - validation retry
   - blocked-package expansion
   - post-package cleanup/commit
6. resume from that point automatically

The user should not need to manually reconstruct execution state.

---

## Phase C exit condition

Phase C ends only when:
- the execution package list is exhausted
- or a true stop condition occurs and the user explicitly chooses stop

A completed final package counts as package execution completion, but not overall shell completion.

The workflow must continue into closeout phases.

---

# Phase D — Hardening

Phase D includes three required subphases in order:

- D.1 — Final audit
- D.2 — Hardening planning
- D.3 — Hardening execution

This pass keeps existing final-audit and hardening behavior, but relocates it under one major lifecycle phase so Phase E can run after hardening.

---

## Phase D.1 — Final audit

## Goal

Generate a truthful closeout audit of the completed package execution program.

## Inputs
- all planning docs
- all execution logs
- all expansion logs
- current code state
- package outcomes

## Outputs
- `FINAL_EXECUTION_AUDIT.md`

## Required actions
1. summarize package outcomes
2. identify code-complete vs environment-complete state
3. identify major architecture outcomes
4. identify major deferred decisions
5. identify known caveats
6. identify what hardening should happen next

## Validation expectations
- audit must be evidence-based
- audit must not erase caveats
- audit must not falsely overstate completeness
- audit must apply **PRD coverage accounting** and flag **material** PRD items that are still **unaccounted for** as a planning/audit gap

## Exit condition
- final audit exists and is good enough to drive hardening planning

---

## Phase D.2 — Hardening planning

## Goal

Turn the final audit into a targeted hardening program.

## Inputs
- `FINAL_EXECUTION_AUDIT.md`
- execution logs
- current repo state

## Outputs
- `POST_EXECUTION_HARDENING_PLAN.md`
- `POST_EXECUTION_HARDENING_TASKS.md`

## Required actions

### E-1 — Hardening plan generation
Define:
- why hardening exists now
- workstreams
- scope boundaries
- what is not feature work

### E-2 — Hardening task generation
Convert the plan into:
- ordered workstreams
- ordered passes
- task categories
- safest/highest-value tasks first

## Validation expectations
- the plan must remain hardening-only
- the tasks must not become a new feature roadmap
- pass order must make sense

## Exit condition
- hardening plan and hardening task list exist and are ready for hardening execution

---

## Phase D.3 — Hardening execution

## Goal

Execute the post-execution hardening phase in ordered passes until complete or blocked.

## Inputs
- `POST_EXECUTION_HARDENING_PLAN.md`
- `POST_EXECUTION_HARDENING_TASKS.md`
- final audit
- current repo state

## Outputs
- cleaned/hardened code and docs
- hardening evidence artifacts
- commits after passes or completed hardening units

## Required hardening pass order

### Pass 1 — Evidence and readiness clarification
- evidence reconciliation
- readiness/library-seeding clarification

### Pass 2 — Lint, tooling, and CI hardening
- lint/tooling truthfulness
- minimum validation baseline

### Pass 3 — Type-safety cleanup
- reduce fragile type patches
- improve high-traffic surface stability

### Pass 4 — Shell/route consistency and legacy containment cleanup
- wording consistency
- resilience messaging consistency
- legacy/transitional clarity

---

## Hardening pass behavior

Each pass should:
1. read only the tasks in that pass
2. complete them within scope
3. validate
4. log/commit as appropriate
5. continue automatically to the next pass if successful

The shell must not stop between passes unless:
- a real blocker occurs
- validation fails and cannot be repaired in scope
- the user explicitly chooses stop

---

## Resume behavior during hardening

If interrupted during hardening and the user types:

`continue`

the shell must:
- determine the active hardening pass
- determine completed hardening passes
- inspect current tree/log state
- resume near the interrupted point
- continue through remaining passes automatically

---

## Phase D exit condition

Phase D ends only when:
- all hardening passes are complete
- or a true blocker remains unresolved and the user explicitly chooses stop

---

# Phase E — Functional Fidelity Uplift

## Goal

Raise delivered functionality toward validated original product intent after hardening, before closeout/packaging.

## Inputs
- raw PRD (original source intent)
- `PRD_SOURCE.md` (normalized interpreted intent)
- built application state after hardening
- planning and audit artifacts:
  - `CURRENT_STATE_AUDIT.md`
  - `MASTER_ROADMAP.md`
  - `EXECUTION_PACKAGES.md`
  - `FINAL_EXECUTION_AUDIT.md`
  - hardening artifacts and logs in `agent_runs/`

## Outputs
- `POST_BUILD_FIDELITY_AUDIT.md`
- `FIDELITY_UPLIFT_PLAN.md`

## Required actions
1. establish and preserve source hierarchy:
   - raw PRD = source intent
   - `PRD_SOURCE.md` = normalized interpreted intent
   - built product = current implementation state
2. audit raw PRD vs `PRD_SOURCE.md` for:
   - drift
   - omission
   - compression artifacts
   - interpretation mismatch
3. build a normalized feature/intent map from the validated PRD pair
4. audit the built product against that map
5. classify findings with explicit categories:
   - aligned
   - thin
   - partial
   - misplaced
   - missing
   - deferred
6. distinguish acceptable MVP minimalism from material misalignment
7. define a bounded uplift scope before coding:
   - uplift underbuilt intended functionality
   - avoid speculative expansion not supported by validated intent
   - keep scope incremental and controllable
8. execute uplift work in bounded increments (module/workflow/cross-link strengthening)
9. re-audit product state against original intent after uplift edits
10. record remaining deferred gaps explicitly and truthfully

## Validation expectations
- uplift remains fidelity-focused, not broad product expansion
- findings and uplift scope are evidence-based and traceable to PRD anchors
- deferred items are explicit and documented
- resulting state is coherent enough to proceed toward later post-uplift phases

## Exit condition
- `POST_BUILD_FIDELITY_AUDIT.md` and `FIDELITY_UPLIFT_PLAN.md` exist
- uplifted implementation is re-audited
- remaining deferred gaps are explicit

---

# Phase F — High-End Design Pass

## Goal

Run a structured art direction + UX + UI-system refinement phase that upgrades the product from merely functional to intentionally designed while preserving functionality.

## Inputs
- post-uplift implementation state (after Phase E)
- `POST_BUILD_FIDELITY_AUDIT.md`
- `FIDELITY_UPLIFT_PLAN.md`
- current routes/pages and workflow inventory
- current design primitives and shared shell components
- existing planning/audit artifacts and run logs

## Outputs
- `DESIGN_DIRECTION_BRIEF.md`
- `UI_REFINEMENT_PLAN.md`
- `POST_DESIGN_FUNCTIONAL_VALIDATION.md`

## Required actions
1. audit current UI/UX quality and identify major visual/interaction pain points
2. inventory pages, primary workflows, and content types before redesign
3. lock functionality-preservation constraints before visual changes:
   - routes/pages
   - core workflows
   - data sources/API behavior
   - permissions/access
   - forms/search/filter behavior
   - loading/error behavior
4. produce `DESIGN_DIRECTION_BRIEF.md`:
   - product visual personality and art-direction intent
   - hierarchy/navigation/composition goals
   - readability/accessibility constraints
   - responsiveness and interaction posture
5. produce `UI_REFINEMENT_PLAN.md` with bounded implementation scope:
   - design-system updates (typography, spacing, surfaces, color, layout rhythm)
   - app shell/shared primitives
   - home/dashboard
   - list/search surfaces
   - detail/profile-heavy surfaces
   - dense/raw data preservation pattern (tabs, drawers, collapsibles, advanced panels, or equivalent)
6. execute design refinement in bounded increments while preserving functionality
7. keep dense/raw data access available where valuable; reorganize instead of deleting important information
8. run post-design functional validation and record results in `POST_DESIGN_FUNCTIONAL_VALIDATION.md`
9. document residual design deferrals explicitly (do not hide unfinished polish)

## Validation expectations
- design updates are cohesive and product-intentional, not random decoration
- workflows and business logic remain intact
- dense/raw information remains accessible through clean interaction patterns
- responsiveness is improved, not regressed
- functional validation evidence is explicit in phase artifacts

## Exit condition
- `DESIGN_DIRECTION_BRIEF.md` exists
- `UI_REFINEMENT_PLAN.md` exists
- `POST_DESIGN_FUNCTIONAL_VALIDATION.md` confirms critical functionality remains intact after design updates

---

# Phase G — Post-Uplift Validation (reserved)

This phase is intentionally reserved for a later pass and is not implemented in this change.

---

# Phase H — Final closeout

## Goal

Leave the project in a clean, truthful, handoff-ready state.

## Inputs
- completed execution program
- final audit
- hardening plan/tasks
- hardening outputs
- committed repo state

## Outputs
- clean repo state
- complete closeout artifact set
- closeout-ready branch/worktree state

## Required actions
1. verify package execution is complete or honestly caveated
2. verify hardening is complete or honestly caveated
3. verify audit/hardening docs exist
4. verify the repo is committed and clean
5. include a concise **Remaining external setup required** section in final closeout whenever requested integrations were scaffolded/deferred instead of fully live-configured
6. leave a final handoff-ready state
7. write `FORGESHELL_FINAL_CLOSEOUT.md` to mark Phase H completion (see `shell/reusable/REUSABLE_SHELL_PROMPTS.md` — final closeout prompt)

## Validation expectations
- repo is clean
- closeout docs exist
- caveats are explicit
- remaining external setup is explicit when integrations were scaffolded/deferred
- no hidden unfinished package work remains

## Exit condition
- the shell lifecycle through Phase H is complete (`FORGESHELL_FINAL_CLOSEOUT.md` exists)

---

# Phase I — Optional packaging (ForgeShell handoff)

## Goal

Offer a **non-destructive**, **explicit-operator-choice** packaging step **after** Phase H, only when bootstrap recorded an application folder name (`.forgeshell/packaging.json`).

This phase is **not** product execution. It is optional workspace shaping for handing off an application tree.

## When this phase applies

- Phase H is complete (`FORGESHELL_FINAL_CLOSEOUT.md` exists)
- `.forgeshell/packaging.json` exists
- `FORGESHELL_PACKAGING_CHOICE.md` does **not** yet exist

If `.forgeshell/packaging.json` is **missing**, **skip** Phase I entirely (no rename / cleanup offer).

## Operator choices (exact)

### Option 1 — Clean for handoff

Archive ForgeShell runtime logs and final shell planning/audit artifacts into `shell-core/_forgeshell_archive/` (with `_forgeshell_archive/README.md` explaining the archive), remove shell control directories from the app tree, replace `README.md` with an application-facing README, trim shell-specific `.gitignore` entries, and **rename only** the `shell-core` folder to the bootstrap-recorded application folder name.

**Do not** rename the outer `Forgeshell` (or `Forgeshell-2`, etc.) clone folder.

**Do not** delete archived evidence — moves are archival, not destructive deletion.

Implementation is performed by:

`node scripts/forgeshell-packaging-handoff.mjs --mode clean`

(run from `shell-core`, with a clean git tree, after `FORGESHELL_PACKAGING_CHOICE.md` records `choice: clean-for-handoff`).

### Option 2 — Leave workspace as-is

Keep the finished application inside the full ForgeShell workspace with all shell files intact

Record `choice: leave-workspace-as-is` in `FORGESHELL_PACKAGING_CHOICE.md` and **do not** run the handoff script.

## Exit condition

- `FORGESHELL_PACKAGING_CHOICE.md` exists with a recorded choice

---

## Full workflow transition map

| From phase | To phase | Condition |
|---|---|---|
| A | B | `PRD_SOURCE.md` exists |
| B | C | audit, roadmap, and execution packages exist |
| C | D | execution package list exhausted |
| D | E | final audit + hardening planning + hardening execution complete |
| E | F | functional fidelity uplift complete |
| F | G | design direction + UI refinement + post-design functional validation complete |
| G | H | reserved phase routing (not implemented in this pass; pass-through when no G artifacts are required) |
| H | I | Phase H complete **and** `.forgeshell/packaging.json` exists **and** packaging choice not yet recorded |
| H | end | Phase H complete **and** `.forgeshell/packaging.json` is missing |
| I | end | `FORGESHELL_PACKAGING_CHOICE.md` exists |

---

## Workflow state rules

The shell should always know which phase it is in.

At any time, the shell should be able to infer from artifacts and repo state:

- current phase
- most recent completed phase
- current package/pass
- whether execution is active, blocked, or resumable
- whether the tree is clean
- whether closeout artifacts already exist

The shell should not rely on memory alone.

It should derive state from artifacts and git state.

---

## Healthy handoff — same-run auto-continue

When a phase step or other **major workflow unit** completes **successfully**, and **all** of the following hold:

- no real blocker, failed validation, or protected-data risk
- no structured escalation is required
- no genuine user input or unresolved product/architecture judgment is needed for the next step
- validation and **unit-appropriate closeout** for that unit are complete enough for the workflow (including per-unit git closeout when the unit changed the repo—see `REUSABLE_SHELL_PACKAGE_CLOSEOUT_CHECKLIST.md`)

then the shell must proceed **in the same run** to the **next valid** phase or unit (for example: Phase A exit satisfied → begin Phase B; one planning artifact complete → generate the next in order; package closeout complete → next package; hardening pass closeout complete → next pass) **without** pausing only because a boundary was crossed or the model ended a turn.

**Package handoff:** “Next package” work starts only **after** the previous package’s closeout commit and clean tree—not by extending edits across a completed package line. Same-run auto-continue is **not** permission to blur package boundaries.

This tightens behavior only for **clearly healthy** handoffs. It does **not** permit skipping failed checks, a dirty tree after a completed unit, ambiguous state, or required escalation.

---

## Workflow rules around stopping

The shell should not stop for convenience.

Valid reasons to stop:
- safe narrowing failed
- protected-data risk appeared
- validation failure remains unresolved
- user explicitly chose stop
- workflow is truly complete

Invalid reasons to stop:
- package completed successfully
- a **successful** phase or planning step completed and the next step in sequence is ready (healthy handoff — use **same-run auto-continue** instead of stopping)
- package draft required expansion
- CLI interruption occurred but state is resumable
- one hardening pass completed and the next one was simply not started yet

---

## Workflow rules around user intervention

The operator’s role should be minimal.

The user should mainly provide:
- initial PRD
- occasional explicit decisions if safe narrowing cannot resolve a true ambiguity
- explicit stop if they want the shell to stop
- `continue` after interruption if needed

The shell should not require the user to:
- manually reconstruct state
- manually clean recurring generated files
- manually delete blocked logs
- manually re-wire executor vs expander transitions
- manually launch each hardening pass one by one

---

## Workflow rules around genericity

This workflow must stay reusable.

It should define:
- process
- phase order
- control logic
- evidence logic
- commit logic
- resume logic

It should not bake in:
- GoTeamGo route names
- GoTeamGo entities
- Convex-specific product assumptions unless explicitly generalized
- project-specific package content

---

## Recommended next shell artifacts after this workflow

After `shell/reusable/REUSABLE_SHELL_WORKFLOW.md`, the next best implementation-layer artifacts are:

1. reusable shell prompt set
2. structured escalation template
3. continue/resume contract
4. package closeout/commit checklist
5. generated-file drift handling list
6. Codex/Claude runtime config examples

These will operationalize the workflow into a real reusable shell system.

---

## Final conclusion

The reusable shell workflow is a full project lifecycle.

It is not just:
- package execution
- or prompt orchestration

It is the complete path from:

- PRD intake

through:

- planning
- execution
- expansion
- validation
- audit
- hardening
- functional fidelity uplift
- closeout

This workflow defines that lifecycle and should be treated as a core control document of the reusable shell.