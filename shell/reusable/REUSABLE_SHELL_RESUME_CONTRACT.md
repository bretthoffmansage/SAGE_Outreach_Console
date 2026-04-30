# REUSABLE_SHELL_RESUME_CONTRACT

## Purpose

This document defines how the reusable autonomous shell must resume work after interruption, how it interprets the user triggers:

- `begin`
- `start`
- `continue`

and how it determines the correct next prompt, phase, package, or hardening pass without requiring the user to manually reconstruct state.

This contract is what turns the reusable shell prompt library into an actual resumable system.

It is not a project PRD.

It is a shell runtime behavior contract.

---

## Core objective

The shell must be able to:

- start correctly on a fresh project
- continue correctly on a partially initialized project
- recover correctly after interruption
- return correctly from blocked-package expansion
- continue correctly through hardening passes
- avoid duplicate work
- avoid losing state
- avoid requiring the user to manually identify the exact next package

This contract exists so the shell behaves like a state-aware autonomous workflow rather than a collection of disconnected prompts.

---

## Core principles

The resume contract must preserve these principles:

1. **artifact-derived state**
   - the shell must derive its state from repo artifacts and git state, not memory alone

2. **phase-aware continuation**
   - the shell must know which lifecycle phase it is in before choosing a prompt

3. **minimal user burden**
   - the user should not need to say:
     - which package was last running
     - which hardening pass was active
     - which prompt to use next

4. **no duplicate package work**
   - the shell must not rerun completed packages unless a current in-scope fix truly requires it

5. **clean handoff recovery**
   - blocked-package expansion must return to executor automatically
   - hardening pass completion must flow into the next pass automatically

6. **explicit ambiguity handling**
   - if state is genuinely ambiguous, the shell may ask a structured clarification question
   - but must not silently guess in a destructive way

---

## Canonical raw PRD intake (`raw_prd/`)

This rule makes raw PRD discovery **deterministic** on a fresh run before `PRD_SOURCE.md` exists.

### When it applies
- The user has triggered `begin` or `start` (or equivalent), and the workspace is **fresh** for intake: `PRD_SOURCE.md` does not yet exist, and the shell is about to run or rely on PRD intake / normalization.

### Required inspection order
1. Inspect **`raw_prd/`** first (at the repo/worktree root where the shell run applies).

### If `raw_prd/` **exists**
Treat **only regular files directly inside `raw_prd/`** as candidates (not nested paths; subdirectories are ignored for counting — if the operator needs nested layout, they must flatten to a single top-level file or use the fallback when the folder is absent).

- **Exactly one** candidate file → that file **is** the raw PRD input for intake.
- **Zero** candidate files → the shell must **not** invent a PRD or pick a file elsewhere automatically. It must raise a **structured escalation** stating that **no raw PRD file was found** in `raw_prd/`.
- **More than one** candidate file → the shell must raise a **structured escalation** stating that **multiple raw PRD candidates** were found and it must **not guess** which file to use.

### If `raw_prd/` **does not exist**
- Fall back to the **existing loose behavior**: operator-provided PRD or project brief (for example content in the user message, or project files the operator explicitly points to).
- Do **not** introduce a new mandatory root-level filename for the raw PRD unless another shell doc already explicitly requires it.

### Relationship to Phase A
- Intake proceeds only when raw input is **unambiguously** resolved: either the single `raw_prd/` file, or a clear operator-provided source under the fallback when `raw_prd/` is absent.
- If `raw_prd/` exists but intake cannot start due to zero or multiple files, **escalate first**; do not run PRD normalization as if a single raw file were known.

---

## Trigger interpretation rules

## 1. `begin`

If the user types:

- `begin`

the shell must treat that as a start-of-workflow trigger.

### Required behavior
The shell must inspect current artifact state before acting.

### Fresh-run local git repository (`git init`)
When the workspace is **fresh** for ForgeShell and the shell will rely on git-aware behavior (status, diff, clean tree, commits), apply **`REUSABLE_SHELL_WORKFLOW.md` — Fresh-run local git repository (automatic `git init`)** **early**—before git-dependent steps: if **all** narrow criteria there are met and `.git` is absent at the **shell project root**, run `git init`, verify git works, acknowledge/log, then continue. **Never** re-init when `.git` exists. **Never** add remotes or GitHub. If nested-repo layout or root is **ambiguous**, **escalate** rather than guessing where to init. If git cannot be established safely, **escalate** rather than silently undermining later closeout expectations.

On a **fresh** intake (`PRD_SOURCE.md` not yet present), it must apply **Canonical raw PRD intake (`raw_prd/`)** before treating file-based raw input as resolved.

It must determine whether the workspace is:

1. **fresh**
   - normalized planning artifacts do not yet establish a later phase
   - and raw PRD input is available: either (a) **`raw_prd/` exists** with exactly **one** top-level regular file, or (b) **`raw_prd/` does not exist** and the operator has supplied a PRD or brief under the loose convention
   - if **`raw_prd/` exists** with **zero** or **more than one** top-level regular file, the shell must **escalate** per that canonical rule instead of proceeding with ambiguous file intake

2. **partially initialized**
   - some shell artifacts already exist but the workflow has not finished

3. **already in-progress**
   - execution or hardening is clearly already underway

### Decision rule
- if fresh and raw PRD intake is **not** blocked by `raw_prd/` (zero or multiple files), start with the PRD intake / normalization prompt
- if fresh and `raw_prd/` requires escalation, use **structured escalation** first; do not run normalization until resolved
- if partially initialized, continue from the earliest missing required phase
- if clearly in-progress, prefer asking whether the user intended:
  - fresh restart
  - or resume

### Important rule
`begin` must not blindly overwrite a mature workspace.

---

## 2. `start`

If the user types:

- `start`

the shell must treat it the same way as `begin`.

### Required behavior
- identical to `begin`
- inspect state first
- choose the earliest valid phase if fresh
- clarify only if current state suggests restart vs resume ambiguity

---

## 3. `continue`

If the user types:

- `continue`

the shell must enter resume mode.

### Required behavior
The shell must:

1. inspect repo state
2. inspect workflow artifacts
3. infer current lifecycle phase
4. identify the most recent incomplete unit of work
5. resume from there automatically

The shell must not require the user to provide:
- package number
- hardening pass number
- last prompt used
- file names to inspect

---

# Lifecycle phase detection

The shell must determine which lifecycle phase it is currently in before selecting a prompt.

The phases are:

- Phase A — Intake
- Phase B — Planning generation
- Phase C — Package execution
- Phase D — Hardening (final audit + hardening planning + hardening execution)
- Phase E — Functional Fidelity Uplift
- Phase F — High-End Design Pass
- Phase G — Post-Uplift Validation (reserved)
- Phase H — Final closeout
- Phase I — Optional packaging (ForgeShell handoff)

---

## Phase detection rules

### Phase A — Intake
Likely active when:
- `PRD_SOURCE.md` does not exist
- and raw PRD input is **resolved** per **Canonical raw PRD intake (`raw_prd/`)**: either a **single** file in `raw_prd/` when that folder exists, or an operator-provided source when `raw_prd/` does **not** exist
- if `raw_prd/` exists but has **zero** or **multiple** top-level regular files, Phase A intake is **blocked** until the operator fixes `raw_prd/` or removes it to use the fallback — handle via **structured escalation**, not guessing

### Phase B — Planning generation
Likely active when:
- `PRD_SOURCE.md` exists
- one or more of these do not exist:
  - `CURRENT_STATE_AUDIT.md`
  - `MASTER_ROADMAP.md`
  - `EXECUTION_PACKAGES.md`

### Phase C — Package execution
Likely active when:
- `EXECUTION_PACKAGES.md` exists
- execution package list is not exhausted
- final audit does not yet exist
- package logs exist or package execution is clearly underway

### Phase D — Hardening
Likely active when:
- execution packages are exhausted
- and one or more of the hardening chain artifacts is still incomplete:
  - `FINAL_EXECUTION_AUDIT.md`
  - `POST_EXECUTION_HARDENING_PLAN.md`
  - `POST_EXECUTION_HARDENING_TASKS.md`
  - hardening pass completion evidence

### Phase E — Functional Fidelity Uplift
Likely active when:
- hardening is complete
- one or both do not yet exist:
  - `POST_BUILD_FIDELITY_AUDIT.md`
  - `FIDELITY_UPLIFT_PLAN.md`
- or fidelity uplift execution/re-audit is incomplete

### Phase F — High-End Design Pass
Likely active when:
- fidelity uplift is complete
- one or more of the design artifacts is incomplete:
  - `DESIGN_DIRECTION_BRIEF.md`
  - `UI_REFINEMENT_PLAN.md`
  - `POST_DESIGN_FUNCTIONAL_VALIDATION.md`
- or UI refinement execution is partial/unclosed

### Phase G — Post-Uplift Validation (reserved)
Likely active when:
- future reserved phase conditions (not implemented in this pass)

### Phase H — Final closeout
Likely active when:
- package execution is exhausted
- hardening artifacts exist and are complete
- fidelity uplift artifacts exist
- shell is verifying closeout state
- `FORGESHELL_FINAL_CLOSEOUT.md` does not yet exist

### Phase I — Optional packaging (ForgeShell handoff)
Likely active when:
- `FORGESHELL_FINAL_CLOSEOUT.md` exists (Phase H complete)
- `.forgeshell/packaging.json` exists (bootstrap recorded an application folder name)
- `FORGESHELL_PACKAGING_CHOICE.md` does not exist yet

If `.forgeshell/packaging.json` is missing, **skip** Phase I — there is no bootstrap packaging target to apply.

---

# State sources the shell must inspect

The shell must determine resume state using artifacts, logs, and git state.

It should inspect these sources in this approximate priority:

1. `EXECUTION_PACKAGES.md`
2. `FINAL_EXECUTION_AUDIT.md`
3. `POST_EXECUTION_HARDENING_PLAN.md`
4. `POST_EXECUTION_HARDENING_TASKS.md`
5. `POST_BUILD_FIDELITY_AUDIT.md`
6. `FIDELITY_UPLIFT_PLAN.md`
7. `DESIGN_DIRECTION_BRIEF.md`
8. `UI_REFINEMENT_PLAN.md`
9. `POST_DESIGN_FUNCTIONAL_VALIDATION.md`
10. `agent_runs/`
11. current git branch/worktree
12. current `git status`
13. current `git diff --stat`
14. presence of phase-specific docs
15. presence of untracked or modified files associated with an incomplete unit of work

It must not rely on conversational memory alone.

---

# Resume state inference rules

## Rule 1 — Prefer the most recent incomplete unit of work

When resuming, the shell should look for the most recent incomplete unit, not just the last thing mentioned in chat.

Examples:
- partially finished package execution
- completed package not yet committed
- package expanded but not yet executed
- hardening pass partially completed
- final audit not yet created even though packages are exhausted

---

## Rule 2 — Dirty tree means unresolved current unit

If the tree is dirty, the shell must assume the current unit of work may not be fully closed.

It must determine whether the dirty state corresponds to:

- an active package not yet validated
- a package completed but not yet committed
- a blocked-package expansion output not yet handed back
- a hardening pass in progress
- a generated drift file that should be reverted
- an abandoned or unrelated change

The shell must not skip past dirty unresolved work.

---

## Rule 3 — Completed package + dirty tree = perform closeout first

If package logs or evidence strongly show a package completed, but the tree is still dirty, the shell must:

1. inspect diff/stat
2. identify package-intended changes
3. revert known unintended generated drift
4. commit the package
5. verify tree cleanliness
6. only then continue to the next package

This is a mandatory resume behavior.

---

## Rule 4 — Expansion log without execution closeout means return to executor

If the shell finds:
- a package expansion log
- updated package definition
- but no completed execution outcome for that package

it must assume the blocked-package expansion stage already ran and must now hand the package back to the main executor.

The user should not need to manually delete logs or restitch the handoff.

---

## Rule 5 — Hardening pass completion should flow forward automatically

If the shell finds that:
- the current hardening pass completed
- and the tree is clean
- and the next hardening pass has not yet begun

it must continue automatically into the next hardening pass unless:
- a real blocker exists
- or the user explicitly chose stop

---

# Phase-specific resume logic

## A. Resume during planning generation

If the shell is still in planning generation, it must resume from the earliest missing planning artifact.

### Required order
1. `PRD_SOURCE.md`
2. `CURRENT_STATE_AUDIT.md`
3. `MASTER_ROADMAP.md`
4. `EXECUTION_PACKAGES.md`

### Rule
Do not regenerate already-finished planning artifacts unless:
- they are clearly corrupted
- or the user explicitly requested regeneration

---

## B. Resume during package execution

If the shell is in package execution, it must determine:

1. the last truly completed package
2. whether the next package is:
   - ready
   - draft
   - blocked
   - partially expanded
   - partially executed

### Required behavior
- if the next package is ready, execute it
- if it is draft/underdefined, invoke blocked-package expansion
- if it is partially executed, resume that package before moving on
- if it is completed but uncommitted, perform closeout before moving on

### Important rule
The shell must not silently skip a package in sequence.

---

## C. Resume after blocked-package expansion

If the expander has already narrowed a package successfully, the shell must:

1. detect the narrowed package in `EXECUTION_PACKAGES.md`
2. confirm expansion log exists
3. return control to the executor automatically
4. execute that package next

No user cleanup should be required.

---

## D. Resume during hardening

If the execution package list is exhausted but the final audit is missing or partially created, the shell must resume by generating or completing `FINAL_EXECUTION_AUDIT.md`.

---

## E. Resume during functional fidelity uplift

If hardening is complete but fidelity uplift artifacts are incomplete, the shell must continue by generating/executing:

1. `POST_BUILD_FIDELITY_AUDIT.md`
2. `FIDELITY_UPLIFT_PLAN.md`
3. bounded fidelity uplift execution + post-uplift re-audit updates

---

## F. Resume during high-end design pass

If fidelity uplift is complete but design pass artifacts are incomplete, the shell must continue by generating/executing:

1. `DESIGN_DIRECTION_BRIEF.md`
2. `UI_REFINEMENT_PLAN.md`
3. bounded design refinement execution
4. `POST_DESIGN_FUNCTIONAL_VALIDATION.md`

with functionality-preservation constraints enforced.

---

## G. Resume during reserved post-uplift validation phase

This phase remains reserved in the lifecycle and intentionally not implemented in this pass.

---

## H. Resume during final closeout

If all packages and hardening passes appear complete but final closeout verification is unfinished, the shell must resume by checking:
- repo cleanliness
- artifact completeness
- final caveat state
- handoff readiness

---

# Prompt selection contract

The shell must choose prompts based on inferred state.

## Prompt selection map

### Fresh project
Use:
- PRD intake / normalization prompt

Only after **Canonical raw PRD intake (`raw_prd/`)** is satisfied or correctly escalated (not when `raw_prd/` exists with zero or multiple top-level files).

### PRD normalized, audit missing
Use:
- current-state audit prompt

### Audit exists, roadmap missing
Use:
- roadmap generation prompt

### Roadmap exists, execution packages missing
Use:
- execution-package generation prompt

### Package execution active
Use:
- main execution / continuation prompt

### Blocked package detected
Use:
- blocked-package expansion prompt

### True unresolved ambiguity remains
Use:
- structured escalation prompt

### Package list exhausted, audit missing
Use:
- final audit prompt

### Audit exists, hardening plan missing
Use:
- hardening-plan prompt

### Hardening plan exists, task list missing
Use:
- hardening-task-list prompt

### Hardening pass active
Use:
- hardening pass prompt

### Hardening complete, fidelity audit missing
Use:
- post-build fidelity audit prompt

### Fidelity audit exists, uplift plan/execution incomplete
Use:
- fidelity uplift plan/execution prompt

### Fidelity uplift complete, design direction missing
Use:
- design direction brief prompt

### Design direction exists, UI refinement/validation incomplete
Use:
- UI refinement execution prompt

### Closeout verification active
Use:
- final closeout prompt

### Final closeout complete, optional packaging pending
Use:
- optional ForgeShell packaging / handoff prompt

Only when:
- `FORGESHELL_FINAL_CLOSEOUT.md` exists
- `FORGESHELL_PACKAGING_CHOICE.md` does not exist
- `.forgeshell/packaging.json` exists

---

# Resume behavior around git state

The shell must use git state as part of resume logic.

## Required git checks on resume
- `git status`
- `git diff --stat`
- current branch
- whether the tree is clean
- whether untracked files appear to belong to the active package/pass

## Required behaviors
- if the tree is clean, move to the next valid unit of work
- if the tree is dirty, determine whether current work must be closed before continuing
- if only known generated drift exists, revert it if appropriate
- if completed work is present but uncommitted, commit it before continuing

---

# Known generated-drift handling during resume

The shell must explicitly account for recurring generated drift.

## Known example
- `next-env.d.ts`

### Resume rule
If the shell detects a generated-drift file that changed but is not intentional package work, it must:
1. recognize it as generated drift
2. revert it before committing the current unit
3. continue normal closeout

The shell must not get stuck just because recurring generated drift exists.

---

# Ambiguity resolution rules

If resume state is ambiguous, the shell must prefer the smallest safe clarification rather than a broad stop.

## Examples of acceptable clarification
- “This workspace appears partially initialized. Do you want to resume the existing run or intentionally restart planning?”
- “A package appears expanded but not executed. I can continue from the narrowed package unless you intended to stop.”

## Examples of unacceptable behavior
- silently starting over
- skipping ahead without state confirmation
- stopping without structured explanation

---

# Structured user interaction rules during resume

If the shell needs user input during resume, it must present a structured choice.

## Required options
- Continue-ready
- Stop

Optional additional choices may be offered if clearly useful, such as:
- Resume existing run
- Restart from planning

But:
- the shell must not stop unless the user explicitly chooses stop

---

# Resume behavior after CLI interruption

If the CLI stopped because of:
- credits exhausted
- session timeout
- interrupted command session
- external halt not caused by a logic failure

then the shell must treat `continue` as a resume signal, not a fresh start signal.

### Required behavior
- inspect phase/package/pass state
- resume from nearest unresolved point
- avoid redoing completed work
- continue forward automatically once resumed

---

# Resume behavior after validation failure

If the shell was interrupted while a package or hardening pass still had unresolved failing validation, resume must bring it back to that same unit of work.

The shell must not skip forward just because interruption occurred.

---

# Resume success criteria

The resume system is only successful if it can do all of the following:

- infer the current lifecycle phase correctly
- detect the current package or hardening pass correctly
- restore executor vs expander handoff correctly
- handle dirty tree vs clean tree correctly
- finish package closeout before moving on
- continue automatically after `continue`
- avoid asking the user for package numbers in normal cases

---

# Resume failure conditions

The shell may only declare resume failure if:
- artifact state is genuinely contradictory
- the repo/worktree appears corrupted or unsafe
- the workflow phase cannot be safely inferred even after inspecting artifacts and git state
- the user explicitly chooses stop

In such cases it must use structured escalation, not vague failure language.

---

# Recommended supporting artifacts

To make resume more reliable, the shell may optionally maintain or generate support artifacts such as:
- package status index
- current phase marker
- active package marker
- known generated-drift file list
- closeout checklist state

These are optional, but may strengthen reliability.

---

# Relationship to other shell docs

This contract depends on and should remain aligned with:

- `shell/reusable/REUSABLE_SHELL_PACKAGE_PLAN.md`
- `shell/reusable/REUSABLE_SHELL_ARTIFACT_MAP.md`
- `shell/reusable/REUSABLE_SHELL_RUNTIME_SPEC.md`
- `shell/reusable/REUSABLE_SHELL_WORKFLOW.md`
- `shell/reusable/REUSABLE_SHELL_PROMPTS.md`

If any of those change materially, this contract should be updated as needed.

---

# Final conclusion

The reusable shell’s resume behavior must be artifact-driven, git-aware, phase-aware, and package-aware.

When the user types:

- `begin`
- `start`
- `continue`

the shell must not merely react to the word.

It must:
- inspect state
- infer position in the workflow
- choose the correct prompt
- resume the correct unit of work
- and continue autonomously from there

That is the contract defined here.