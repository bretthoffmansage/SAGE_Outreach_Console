# AGENT_RUNTIME_SETUP

## Purpose

This repo-local note defines the concrete runtime setup for the reusable autonomous shell.

It turns the higher-level rules in:

- `shell/control/AGENT_OPERATING_RULES.md`
- `shell/control/PACKAGE_EXPANSION_PROTOCOL.md`
- `shell/control/RUN_LOG_TEMPLATE.md`
- `shell/reusable/REUSABLE_SHELL_WORKFLOW.md`
- `shell/reusable/REUSABLE_SHELL_RUNTIME_SPEC.md`
- `shell/reusable/REUSABLE_SHELL_RESUME_CONTRACT.md`
- `shell/reusable/REUSABLE_SHELL_PACKAGE_CLOSEOUT_CHECKLIST.md`
- `shell/reusable/REUSABLE_SHELL_GENERATED_DRIFT_RULES.md`

into a repeatable working setup for:

- planning generation
- package execution
- blocked-package expansion
- final audit
- hardening
- functional fidelity uplift
- high-end design pass
- final closeout

This file is about how the shell should be run in practice.

---

## Required working pattern

1. Start by inspecting shell artifact state, not by assuming the current phase.
2. **Fresh-run local git:** On a **fresh/new project** at the **shell project root**, when **all** criteria in `shell/reusable/REUSABLE_SHELL_WORKFLOW.md` — **Fresh-run local git repository (automatic `git init`)** are satisfied (including no `.git` at that root, git-aware workflow in play, no operator opt-out, and **no** ambiguous nested-repo layout that forbids silent init), perform **early** in startup—**before** treating git state as authoritative for closeout: if `.git` is missing, run `git init`, verify git works, **acknowledge** in chat and/or `agent_runs/` with **explicit** wording: **newly initialized** vs **repository already present, init skipped** (interpret any tool output accordingly so operators are not left guessing). If `.git` already exists, do **not** re-init. Do **not** add remotes or GitHub. If init is **not** in the narrow safe case, **escalate** rather than continuing a git-dependent workflow without git.
3. If the user typed `begin` or `start`, follow `shell/reusable/REUSABLE_SHELL_RESUME_CONTRACT.md` to determine whether this is:
   - a fresh run
   - a partially initialized run
   - or an in-progress run that should resume
4. If the user typed `continue`, enter resume mode and determine the nearest unresolved unit of work from repo state, artifact state, logs, and git state.
5. Work in the correct shell lifecycle phase:
   - Phase A — Intake
   - Phase B — Planning generation
   - Phase C — Package execution
   - Phase D — Hardening (final audit + hardening planning + hardening execution)
   - Phase E — Functional Fidelity Uplift
   - Phase F — High-End Design Pass
   - Phase G — Post-Uplift Validation (reserved)
   - Phase H — Final closeout
   - Phase I — Optional packaging
6. If the next package is marked `ready`, execute it directly.
7. If the next package is marked `draft`, `not executable`, `not expanded`, or equivalent, enter blocked-package expansion mode and follow `shell/control/PACKAGE_EXPANSION_PROTOCOL.md`.
8. In blocked-package expansion mode, expand only the next draft package, execute that same package, then automatically return to normal execution flow.
9. After each completed package or completed hardening pass, perform closeout using:
   - `shell/reusable/REUSABLE_SHELL_PACKAGE_CLOSEOUT_CHECKLIST.md`
   - `shell/reusable/REUSABLE_SHELL_GENERATED_DRIFT_RULES.md`
10. Record each meaningful execution unit in `agent_runs/YYYY-MM-DD/...`.
11. Confirm target environment safety before any backend-affecting command.
12. Keep diffs scoped to the current unit of work and avoid unrelated edits.
13. Continue automatically from one completed package to the next, and from one completed hardening pass to the next, unless a real blocker or explicit stop occurs.
14. Apply **healthy handoff — same-run auto-continue** (see `shell/reusable/REUSABLE_SHELL_WORKFLOW.md`): when a unit completes successfully with no blocker, no required escalation, no needed user input, and complete enough closeout for that unit, proceed **in the same run** to the next valid unit—including **across phase boundaries** when the next phase’s entry conditions are met (e.g. Phase A done → Phase B)—without pausing only for a completed phase or an idle turn. **Inter-package boundary:** the next package’s **implementation edits** begin only **after** the previous package’s **commit** and **clean-tree** verification; shared files between packages do **not** justify skipping or merging closeouts (`shell/reusable/REUSABLE_SHELL_PACKAGE_CLOSEOUT_CHECKLIST.md` — **Inter-package boundary**).

---

## Shell trigger behavior

### `begin`
Use this to start or initialize shell workflow after state inspection.

### `start`
Treat exactly the same as `begin`.

### `continue`
Use this to resume from the nearest unresolved point after state inspection.

### Important rule
The shell must not treat these as blind commands.

It must first inspect:
- workflow artifacts
- `agent_runs/`
- package status
- hardening artifacts
- current git state

before deciding what to do next.

---

## Required shell phase behavior

### Phase A — Intake
Expected artifact outcome:
- `PRD_SOURCE.md`

### Phase B — Planning generation
Expected artifact outcomes:
- `CURRENT_STATE_AUDIT.md`
- `MASTER_ROADMAP.md`
- `EXECUTION_PACKAGES.md`

### Phase C — Package execution
Expected outcomes:
- completed package work
- package logs
- expansion logs where applicable
- package commits
- clean tree between completed packages

### Phase D — Hardening
Expected artifact outcomes:
- `FINAL_EXECUTION_AUDIT.md`
- `POST_EXECUTION_HARDENING_PLAN.md`
- `POST_EXECUTION_HARDENING_TASKS.md`
- completed hardening passes
- hardening outputs
- commits after changed passes
- clean tree between completed passes

### Phase E — Functional Fidelity Uplift
Expected artifact outcomes:
- `POST_BUILD_FIDELITY_AUDIT.md`
- `FIDELITY_UPLIFT_PLAN.md`
- post-uplift deferred-gap notes kept explicit in those artifacts

### Phase F — High-End Design Pass
Expected artifact outcomes:
- `DESIGN_DIRECTION_BRIEF.md`
- `UI_REFINEMENT_PLAN.md`
- `POST_DESIGN_FUNCTIONAL_VALIDATION.md`
- functionality-preservation evidence for routes/workflows/forms/search/filter/loading/error behavior

### Phase H — Final closeout
Expected outcome:
- clean, reviewable, handoff-ready repo state

---

## Branch and worktree convention

- Primary repo root may stay on `main` or another stable branch.
- Shell execution should happen in a dedicated worktree or isolated branch.
- Branch/worktree names should identify the active shell run or shell packaging effort clearly.
- One active autonomous run should map to one isolated branch/worktree where practical.

### Recommended examples
- `shell-dry-run-microlaunch`
- `shell-packaging-v1`
- `shell-hardening-pass`

### Rule
Do not run the shell autonomously on a protected/shared primary branch.

---

## Recommended folder expectations

The shell expects an organized repo structure.

### Core shell docs
- `shell/control/`
- `shell/reusable/`

### Dry-run and test artifacts
- `dry_runs/`

### Logs
- `agent_runs/`

### Raw PRD (recommended)
- `raw_prd/` — preferred location for the single raw PRD file on a fresh run; see `shell/reusable/REUSABLE_SHELL_RESUME_CONTRACT.md` (canonical raw PRD intake). If this folder is absent, intake uses the existing loose operator-provided PRD behavior.

### CLI config/guidance
- `.codex/`
- `.claude/`

The shell may still operate if the exact directory layout differs, but the runtime must know where to look for its control documents.

---

## Environment assumptions

- local app/config state should be explicit and inspectable
- backend targets must be confirmed before backend-affecting work
- production or canonical data should be treated as read-only unless explicitly authorized by the active unit
- safe-dev or staging validation records may only be created in the explicitly approved safe environment for the current run
- the shell must not assume a specific backend such as Convex unless the project itself requires it

### Important rule
Git behavior is shell-native.
Backend behavior is project-specific.

The shell must infer stack/backend expectations from:
- the PRD
- the codebase
- project docs
- active planning artifacts

For requested external integrations, default to scaffold-now/configure-later when safe: detect PRD-requested providers, scaffold with placeholders/contracts where meaningful, and carry explicit remaining setup into final closeout.

Only escalate before build for integrations that are **true blockers** (explicitly required by the PRD for the active unit, cannot be meaningfully scaffolded, and cannot be safely narrowed).

---

## Stack and language selection rule

The shell must determine implementation stack in this order:

1. if the PRD explicitly defines the stack, use that stack
2. if the repo already exists, infer from the current codebase and preserve it unless later work intentionally changes it
3. if the PRD does not define the stack and there is no meaningful existing codebase, choose the thinnest sensible default stack and record that choice explicitly in planning artifacts

### Rule
The shell must not silently smuggle in arbitrary stack assumptions.

If it chooses a default stack, that choice must be recorded explicitly in the generated planning artifacts.

---

## Logging location

- execution logs live under `agent_runs/`
- expansion logs should be written whenever a draft package is expanded into executable form
- hardening passes that make meaningful changes should also leave traceable evidence
- logs are project artifacts and should remain inside the repo for review, resume, and closeout

### Recommended examples
- `agent_runs/2026-04-14/WP-0.1__runtime-safety-setup.md`
- `agent_runs/2026-04-15/WP-4.1__proposal-system-foundation__expansion.md`
- `agent_runs/2026-04-16/HARDENING_PASS_2__lint-and-validation-baseline.md`

---

## Safe command boundaries

### Allowed by default for active shell work
- read-only inspection commands
- safe git status/branch/worktree commands
- scoped docs or helper-script changes
- scoped implementation changes
- baseline validation commands such as build/lint/test when relevant
- safe backend validation commands against the approved safe environment when relevant
- per-package or per-pass commit commands after truthful closeout

### Not allowed by default
- rewriting shared git history
- force-pushing protected branches
- destructive backend resets or data mutations outside explicit scope
- deleting unrelated local work to obtain a clean state
- expanding multiple future draft packages at once unless explicitly instructed
- inventing broad product direction when package expansion cannot be grounded
- continuing with a dirty tree after a completed package or completed hardening pass

---

## Blocked-package expansion mode

When the next package is draft, the agent must:

1. use `shell/control/PACKAGE_EXPANSION_PROTOCOL.md`
2. expand only the next package in sequence
3. ground expansion in:
   - `EXECUTION_PACKAGES.md`
   - `shell/control/AGENT_OPERATING_RULES.md`
   - `shell/control/PACKAGE_EXPANSION_PROTOCOL.md`
   - `PRD_SOURCE.md`
   - `MASTER_ROADMAP.md`
   - `CURRENT_STATE_AUDIT.md`
   - prior run logs
   - current codebase state
4. choose the thinnest safe executable slice
5. explicitly record what is deferred
6. execute that package immediately after expansion
7. automatically hand control back to the main executor after successful expansion
8. escalate using the structured escalation template only if safe narrowing truly fails

### Important rule
The shell must not require manual log deletion or manual executor/expander restitching.

---

## Safe stop behavior

The shell should stop and leave a reviewable state only if:

- the current package cannot be responsibly expanded even after iterative self-narrowing
- the current unit requires meaningful unresolved product judgment
- required checks still fail after reasonable in-scope repair attempts
- protected-data risk appears
- environment safety becomes unclear
- workflow state is genuinely contradictory and cannot be safely inferred
- the user explicitly chooses Stop through structured escalation
- the full workflow is actually exhausted and closeout is complete

### Invalid stop reasons
The shell should not stop merely because:
- one package completed successfully
- one hardening pass completed successfully
- generated drift appeared
- a blocked package needs narrowing and narrowing has not been attempted yet
- interruption occurred but the state is resumable

---

## Required resume behavior

When the user types `continue`, the shell must inspect:

- `PRD_SOURCE.md`
- `CURRENT_STATE_AUDIT.md`
- `MASTER_ROADMAP.md`
- `EXECUTION_PACKAGES.md`
- `FINAL_EXECUTION_AUDIT.md`
- `POST_EXECUTION_HARDENING_PLAN.md`
- `POST_EXECUTION_HARDENING_TASKS.md`
- `POST_BUILD_FIDELITY_AUDIT.md`
- `FIDELITY_UPLIFT_PLAN.md`
- `DESIGN_DIRECTION_BRIEF.md`
- `UI_REFINEMENT_PLAN.md`
- `POST_DESIGN_FUNCTIONAL_VALIDATION.md`
- `agent_runs/`
- current git branch/worktree
- current `git status`
- current `git diff --stat`

Then it must infer:

- current workflow phase
- active or nearest unresolved package/pass
- whether closeout is still required
- whether blocked-package expansion already occurred
- whether audit or hardening phases should begin

The shell must resume from the nearest unresolved point, not start over.

---

## Package and pass closeout requirements

Before closing a completed package or completed hardening pass, the shell must:

1. confirm completion honestly
2. inspect `git status`
3. inspect `git diff --stat`
4. classify intended files vs recurring generated drift
5. revert non-intentional generated drift
6. verify remaining changes belong to the active unit
7. commit the completed unit
8. run post-commit `git status`
9. confirm a clean tree before continuing

This is mandatory.

### Inter-package boundary

After a package (or pass) is **complete enough to close**, the shell must **not** begin edits for the **next** unit until this unit’s **commit** exists and **`git status`** is **clean**. **Do not** treat “the next package also edits these paths” as a reason to defer closeout or combine two completed units into one commit. If a strict one-commit-per-package boundary is truly impossible, document an explicit checkpoint and disclose any unavoidable exception in the final audit—see `shell/reusable/REUSABLE_SHELL_PACKAGE_CLOSEOUT_CHECKLIST.md`.

### Git write serialization and index lock safety

Closeout must **avoid overlapping git mutations**: for a given completed unit, do not interleave staging, commit, or other **write** git operations with concurrent git commands or with external processes that may hold the repository lock. Treat git inspection and writes for that unit as a **single-writer sequence** (inspect and classify before staging/commit; finish one closeout commit before starting unrelated git writes).

If `.git/index.lock` is present or git reports the index is locked:

- **Do not** delete the lock file or force ahead by default, and **do not** assume the lock is stale without evidence.
- **Conservative posture:** confirm no other legitimate git process is using the repo; a **short** wait and **one** retry of a **read-only** command may be appropriate if a concurrent operation is clearly finishing.
- If the lock persists, provenance is unclear, or the shell cannot **safely** determine the lock is stale, **escalate** using the structured escalation template—do not guess or “bulldoze” the repository state.

Removal of a lock file is only appropriate when the **operator or environment** has **explicitly** confirmed it is safe (e.g. known-crashed process, no other git activity)—not when the shell merely suspects staleness.

Full sequencing detail: `shell/reusable/REUSABLE_SHELL_PACKAGE_CLOSEOUT_CHECKLIST.md`.

### Known generated drift
At minimum, the shell must explicitly account for:
- `next-env.d.ts`

If that file changes but is not part of intentional unit scope, the shell must revert it before commit.

---

## CLI posture expectations

### Codex
The shell expects a non-interrupting autonomous posture equivalent in intent to:
- `approval_policy = "never"`
- `sandbox_mode = "danger-full-access"`

### Claude
The shell expects an equivalent least-friction local posture that preserves the same behavioral outcomes:
- autonomous local repo work where safe
- local validation command execution
- package closeout commits
- interruption recovery
- blocked-package handoff and return

### Important rule
The shell runtime must preserve equivalent behavior outcomes across both CLIs, even if exact config syntax differs.

---

## Structured escalation behavior

If the shell truly needs user input, it must use:
- `shell/reusable/REUSABLE_SHELL_ESCALATION_TEMPLATE.md`

It must present:
- blocked point
- what it already attempted
- why it cannot continue safely
- what the user needs to do or decide
- Continue-ready
- Stop

For external integrations, structured escalation should be used only for **true blockers**; missing live provider setup alone is not a default stop condition when safe scaffold/placeholder progress remains possible.

The shell must only actually stop if the user explicitly chooses Stop.

---

## Baseline close-out expectations

Before closing any completed unit, the shell should confirm:

1. correct branch/worktree context
2. environment safety for the current unit
3. current workflow phase is correctly identified
4. the unit was executed directly or expanded first, if applicable
5. required validation was run
6. regression checks were run where relevant
7. logs or artifacts were updated truthfully
8. generated drift was handled
9. the unit was committed
10. the tree is clean
11. the shell is safe to continue to the next unit

---

## Recommended startup sequence for a fresh shell run

For a fresh run:

1. ensure the shell repo/worktree is isolated
2. ensure the raw project PRD is available: **recommended** — exactly one regular file in `raw_prd/`; **or** omit `raw_prd/` and supply the PRD under the loose convention (see `shell/reusable/REUSABLE_SHELL_RESUME_CONTRACT.md`)
3. ensure shell control docs and reusable shell docs are present
4. type `begin` or `start`
5. allow the shell to inspect state (including `raw_prd/` per the resume contract) and choose the correct first prompt or escalation
6. do not manually select prompts unless a real shell gap is being debugged

---

## Optional packaging (after a fully successful run)

After Phase H (`FORGESHELL_FINAL_CLOSEOUT.md` exists) and only when `.forgeshell/packaging.json` exists, the shell may enter **Phase I — optional packaging** per `shell/reusable/REUSABLE_SHELL_WORKFLOW.md` and `shell/reusable/REUSABLE_SHELL_PROMPTS.md` (optional packaging prompt if the operator did not yet record `FORGESHELL_PACKAGING_CHOICE.md`).

- **Clean for handoff** runs `node scripts/forgeshell-packaging-handoff.mjs --mode clean` from `shell-core` with a clean git tree, after the operator records `choice: clean-for-handoff`.
- **Leave workspace as-is** uses this exact wording in the operator-facing choice: “Keep the finished application inside the full ForgeShell workspace with all shell files intact” — then do **not** run the handoff script.

---

## Recommended resume sequence after interruption

After interruption:

1. reopen the shell worktree/repo
2. do not manually clean state unless the shell explicitly requires a true human action
3. type `continue`
4. allow the shell to inspect state and resume from the nearest unresolved point

---

## Relationship to other shell docs

This runtime setup note must remain aligned with:

- `shell/control/AGENT_OPERATING_RULES.md`
- `shell/control/PACKAGE_EXPANSION_PROTOCOL.md`
- `shell/control/RUN_LOG_TEMPLATE.md`
- `shell/reusable/REUSABLE_SHELL_RUNTIME_SPEC.md`
- `shell/reusable/REUSABLE_SHELL_WORKFLOW.md`
- `shell/reusable/REUSABLE_SHELL_PROMPTS.md`
- `shell/reusable/REUSABLE_SHELL_RESUME_CONTRACT.md`
- `shell/reusable/REUSABLE_SHELL_ESCALATION_TEMPLATE.md`
- `shell/reusable/REUSABLE_SHELL_PACKAGE_CLOSEOUT_CHECKLIST.md`
- `shell/reusable/REUSABLE_SHELL_GENERATED_DRIFT_RULES.md`
- `shell/reusable/REUSABLE_SHELL_CLI_CONFIGS.md`

If those docs change materially, this runtime setup note should be updated.

---

## Final conclusion

The shell runtime setup must make autonomous workflow execution practical.

That means the shell must know:

- where it is in the lifecycle
- how to interpret `begin`, `start`, and `continue`
- how to execute and expand packages
- how to commit after each completed unit
- how to clean recurring drift
- how to continue automatically through hardening
- how to escalate without vague stopping
- and how to finish in a clean closeout state

This document defines that runtime setup contract.