# REUSABLE_SHELL_PROMPTS

## Purpose

This document defines the reusable prompt set for the autonomous project shell.

These prompts are the implementation-layer prompt contracts that operationalize:

- `shell/reusable/REUSABLE_SHELL_PACKAGE_PLAN.md`
- `shell/reusable/REUSABLE_SHELL_ARTIFACT_MAP.md`
- `shell/reusable/REUSABLE_SHELL_RUNTIME_SPEC.md`
- `shell/reusable/REUSABLE_SHELL_WORKFLOW.md`

They are designed so the shell can move from:

- user-supplied PRD

to:

- planning artifacts
- execution packages
- autonomous execution
- blocked-package expansion
- audit
- hardening
- functional fidelity uplift
- high-end design pass
- closeout

with minimal manual intervention.

---

## Prompt design principles

All prompts in this file must preserve the shell’s core rules:

- truthful execution
- scoped package discipline
- draft-first planning
- iterative self-narrowing
- structured escalation instead of vague stopping
- per-package commit and clean-tree discipline
- interruption recovery via `continue`
- full closeout including audit, hardening, fidelity uplift, and design pass

These prompts are reusable shell primitives.

They must not assume GoTeamGo-specific entities, routes, or product decisions.

### PRD coverage accounting

Prompts that create or update `PRD_SOURCE.md`, planning docs, `EXECUTION_PACKAGES.md`, execution outcomes, expansions, or `FINAL_EXECUTION_AUDIT.md` must uphold **`REUSABLE_SHELL_WORKFLOW.md` — PRD coverage accounting**. **Material** PRD requirements must **not** be silently dropped: each must be traceable into exactly one of **implemented now**, **scheduled in a package**, **intentionally deferred**, **explicitly out of scope**, or **ambiguous / requires clarification** (see that section for full rules).

### Healthy handoff — same-run auto-continue

When the **current** workflow unit finishes **successfully** and **all** of the following are true:

- no real blocker, failed validation, or protected-data risk
- no structured escalation is required
- no genuine user input or unresolved product/architecture judgment is needed for the **next** step
- any required validation and **unit-appropriate closeout** for that unit are complete (including per-unit git closeout when the unit made repo changes—see `REUSABLE_SHELL_PACKAGE_CLOSEOUT_CHECKLIST.md`)

then the shell must **continue in the same run** to the **next valid** unit (e.g. Phase A intake complete → start Phase B planning generation; one planning artifact done → produce the next required artifact in order; package *N* fully closed out → start package *N+1*; one hardening pass closed out → start the next pass) **without** stopping only because a phase boundary or chat turn ended.

This does **not** override real stop conditions: dirty tree after a completed unit, incomplete checks, ambiguity that requires escalation, or workflow exhaustion stay as documented elsewhere.

**Inter-package boundary:** same-run auto-continue to package *N+1* is allowed only after package *N* **closeout is finished** (commit + clean tree). Do **not** start *N+1* implementation edits while *N* is complete but still uncommitted. **Shared files** between *N* and *N+1* are **not** a reason to merge two packages into one commit; if a single commit per package is truly impossible, document an explicit checkpoint and call out any exception in the final audit—see `REUSABLE_SHELL_PACKAGE_CLOSEOUT_CHECKLIST.md` — **Inter-package boundary**.

### Fresh-run local git repository (`git init`)

On a **fresh/new project** at the **shell project root**, **before** PRD intake or other steps that assume git-backed closeout, apply **`REUSABLE_SHELL_WORKFLOW.md` — Fresh-run local git repository (automatic `git init`)**: when **all** narrow criteria there are met (no `.git` at root, git-aware workflow, no operator opt-out, no ambiguous nested-repo situation), run `git init` only when `.git` was missing, verify git works, then **acknowledge/log** with **explicit** wording: **newly initialized** vs **repository already present, init skipped**—so tooling noise (e.g. messages that look like “reinitialized”) does not stand alone without a clear shell interpretation. **Do not** skip this when the safe case applies and git is required for the documented lifecycle. **Do not** re-init if `.git` exists; **do not** add remotes or GitHub; **escalate** if layout is ambiguous or init is unsafe.

---

## Trigger model

The reusable shell should support simple user triggers.

### Start trigger
If the user types either:

- `begin`
- `start`

the shell should interpret that as:

- enter the shell workflow at the first appropriate phase
- inspect current artifact state
- determine whether it is:
  - a fresh project with only a PRD
  - a partially initialized shell workspace
  - an interrupted project that actually needs resume instead

If the project is fresh, the shell should satisfy **`REUSABLE_SHELL_WORKFLOW.md` — Fresh-run local git repository (automatic `git init`)** before PRD intake when the narrow safe case applies (`git init` if `.git` is missing at the shell root, verify, acknowledge with **newly initialized** vs **already present, init skipped**), then start with the **PRD intake / normalization prompt**.

If the project is partially initialized, the shell should infer the correct starting phase from existing artifacts.

### Continue trigger
If the user types:

- `continue`

the shell should interpret that as:

- enter resume mode
- inspect current state
- determine the most recent incomplete package or hardening pass
- resume near that point automatically

The shell must not require the user to specify the exact package unless state is genuinely ambiguous.

---

# Prompt catalog

The shell prompt set should include:

1. PRD intake / normalization prompt
2. current-state audit prompt
3. roadmap generation prompt
4. execution-package generation prompt
5. main execution / continuation prompt
6. blocked-package expansion prompt
7. structured escalation prompt
8. final audit prompt
9. hardening-plan prompt
10. hardening-task-list prompt
11. hardening pass prompt
12. post-build fidelity audit prompt
13. fidelity uplift plan/execution prompt
14. design direction brief prompt
15. UI refinement execution prompt
16. final closeout prompt
17. optional ForgeShell packaging / handoff prompt

---

# 1. PRD intake / normalization prompt

## Trigger use
Use this when:
- user typed `begin` or `start`
- and no normalized planning artifacts exist yet
- or only the raw PRD exists

## Raw PRD resolution (before running the prompt body)
On a **fresh** intake, apply `shell/reusable/REUSABLE_SHELL_RESUME_CONTRACT.md` — **Canonical raw PRD intake (`raw_prd/`)**:
- If `raw_prd/` **exists** with exactly **one** top-level regular file, read that file as the raw PRD.
- If `raw_prd/` **exists** with **zero** files → do **not** invent a PRD; use `shell/reusable/REUSABLE_SHELL_ESCALATION_TEMPLATE.md` (no raw PRD file found).
- If `raw_prd/` **exists** with **more than one** top-level regular file → escalate (multiple raw PRD candidates; do **not** pick one).
- If `raw_prd/` **does not exist** → use the existing loose convention (PRD or brief from the operator, e.g. chat or paths the operator specifies).

## Purpose
Convert a user-supplied PRD or project brief into a structured `PRD_SOURCE.md`.

## Prompt

```text
You are initializing the reusable autonomous shell on a new project.

Your job in this step is only to normalize the user-supplied PRD or project brief into a structured working requirements document.

Resolve the raw input per the shell resume contract: if `raw_prd/` exists, use the single file there; if it does not exist, use the operator-provided source; do not guess when `raw_prd/` has zero or multiple files — escalate instead.

Do not generate the roadmap yet.
Do not generate execution packages yet.
Do not implement code yet.

Goal:
Create a clean, structured PRD working document that later shell phases can cite reliably.

Required output:
- Create `PRD_SOURCE.md`

Requirements:
- preserve the user’s actual intent
- do not invent certainty that is not present
- normalize messy wording into a structured document
- create stable sections and section anchors/IDs where useful
- separate:
  - goals
  - constraints
  - architecture requirements if present
  - product areas
  - non-functional requirements
  - deferred/unknown items
- if the PRD is incomplete, record the ambiguity explicitly rather than filling in major product decisions
- make **material** requirements traceable for later phases (stable anchors/IDs); do not silently omit **material** items—unresolved ones belong in the ambiguity/deferred buckets per `REUSABLE_SHELL_WORKFLOW.md` PRD coverage accounting
- detect requested external integrations from the PRD and record them explicitly (generic provider-agnostic handling, not only one vendor)
- for each requested integration, classify current posture using the workflow states: **ready now**, **scaffold only**, **requires user setup after build**, or **true blocker**
- prefer **scaffold only** / **requires user setup after build** when safe; do not force up-front setup unless it is a true blocker

Constraints:
- no roadmap generation yet
- no package generation yet
- no code changes
- no fake assumptions

Final output in chat:
Provide a short summary of:
- what `PRD_SOURCE.md` now contains
- what major ambiguities remain
- whether the shell is ready for current-state audit generation```

---

# 2. Current-state audit prompt

## Trigger use

## Use this when:
	•	PRD_SOURCE.md exists
	•	CURRENT_STATE_AUDIT.md does not exist yet
	•	or needs regeneration as part of fresh planning

## Purpose

Create a truthful current-state audit of the project/codebase.

## Prompt

```text 
You are in the planning generation phase of the reusable autonomous shell.

Your job in this step is only to create a truthful current-state audit.

Goal:
Create `CURRENT_STATE_AUDIT.md`.

Use:
- `PRD_SOURCE.md`
- the current repo/codebase state
- existing docs if present

Required output:
- Create `CURRENT_STATE_AUDIT.md`

Requirements:
- describe the actual current project state, not the intended future state
- identify:
  - active surfaces
  - important architecture patterns
  - legacy/transitional areas
  - major gaps vs the PRD
  - risks and blockers
  - places where the codebase posture conflicts with intended product direction
- keep the audit evidence-based
- distinguish real implemented systems from placeholders or partial systems
- surface **material** PRD requirements that are not yet evidenced in code so roadmap and packages can **account** for them (no silent gaps)

Constraints:
- no roadmap generation yet
- no execution package generation yet
- no code changes
- no fake completeness

Final output in chat:
Provide a short summary of:
- the most important current-state findings
- the biggest gaps vs the PRD
- whether the shell is ready for roadmap generation```

---

# 3. Roadmap generation prompt

## Trigger use

Use this when:
	•	PRD_SOURCE.md exists
	•	CURRENT_STATE_AUDIT.md exists
	•	MASTER_ROADMAP.md does not exist yet

## Purpose

Create the strategic roadmap that bridges the PRD and execution packages.

## Prompt

```text
You are in the planning generation phase of the reusable autonomous shell.

Your job in this step is only to create the strategic roadmap.

Goal:
Create `MASTER_ROADMAP.md`.

Use:
- `PRD_SOURCE.md`
- `CURRENT_STATE_AUDIT.md`

Required output:
- Create `MASTER_ROADMAP.md`

Requirements:
- decompose the project into major phases/chapters
- keep the order dependency-aware
- distinguish foundational work from later work
- keep the roadmap strategic rather than package-level
- do not pretend every later chapter is fully specified
- make the roadmap a truthful bridge between PRD intent and future execution packages
- **PRD coverage accounting:** every **material** PRD requirement must appear as roadmap work (a chapter), **explicit deferment**, **explicit out-of-scope**, or **recorded ambiguity**—not silent omission

Constraints:
- no execution package generation yet
- no code changes
- no fake implementation detail

Final output in chat:
Provide a short summary of:
- the major roadmap chapters
- the reasoning behind the sequence
- whether the shell is ready for execution-package generation```

---

# 4. Execution-package generation prompt

## Trigger use

Use this when:
	•	PRD_SOURCE.md
	•	CURRENT_STATE_AUDIT.md
	•	MASTER_ROADMAP.md
exist, and:
	•	EXECUTION_PACKAGES.md does not exist yet

## Purpose

Generate the bounded execution package list.

## Prompt

```text
You are in the planning generation phase of the reusable autonomous shell.

Your job in this step is only to generate bounded execution packages.

Goal:
Create `EXECUTION_PACKAGES.md`.

Use:
- `PRD_SOURCE.md`
- `CURRENT_STATE_AUDIT.md`
- `MASTER_ROADMAP.md`
- `shell/control/AGENT_OPERATING_RULES.md` if already provisioned

Required output:
- Create `EXECUTION_PACKAGES.md`

Requirements:
- generate packages in strict dependency order
- use a draft-first posture
- only the earliest well-grounded packages may begin ready
- later packages should remain draft unless there is strong reason otherwise
- each package must include:
  - purpose
  - why now
  - scope
  - out of scope
  - preconditions
  - likely files/systems involved
  - sensitive systems
  - required checks
  - regression checks
  - completion evidence expectations
- do not over-specify late packages
- do not turn the package list into fake certainty
- **PRD coverage accounting:** **material** PRD/roadmap commitments must be **represented in packages** or **explicitly deferred / out-of-scope** in this document—not silently omitted

Constraints:
- no package execution yet
- no code changes
- no broad invention of future product details

Final output in chat:
Provide a short summary of:
- how many packages were created
- which earliest packages are ready
- which packages remain draft
- whether the shell is ready to enter package execution mode```

---

# 5. Main execution / continuation prompt

## Trigger use

Use this when:
	•	user typed continue
	•	or EXECUTION_PACKAGES.md already exists and execution should proceed
	•	or a prior package/hardening run was interrupted

## Purpose

Run the main autonomous execution loop.

## Prompt

```text
You are working inside the reusable autonomous shell.

Resume autonomous workflow from the current project state.

Primary instruction:
- Continue forward through the shell workflow with best effort to keep going as long as it is safe and grounded to do so.
- Do not stop prematurely if the next package or hardening pass can be completed safely.
- Apply **healthy handoff — same-run auto-continue** (see prompt design principles in this file): after a unit succeeds with no blocker, no required escalation, no needed user input, and complete enough closeout for that unit, proceed immediately to the next valid unit in **this** run—do not pause only for a phase label or an end-of-turn when no real stop condition applies.
- Prefer disciplined narrowing, self-correction, and resumption over early stopping.
- Stop only for a real blocker, failed validation that cannot be repaired in scope, protected-data risk, explicit user stop, or true workflow exhaustion.

First task:
Inspect current state and determine which phase the shell is currently in:
- planning generation
- package execution
- final audit / hardening
- functional fidelity uplift
- high-end design pass
- final closeout

Then resume from the correct point.

State sources to inspect:
1. `PRD_SOURCE.md`
2. `CURRENT_STATE_AUDIT.md`
3. `MASTER_ROADMAP.md`
4. `EXECUTION_PACKAGES.md`
5. `FINAL_EXECUTION_AUDIT.md`
6. `POST_EXECUTION_HARDENING_PLAN.md`
7. `POST_EXECUTION_HARDENING_TASKS.md`
8. `POST_BUILD_FIDELITY_AUDIT.md`
9. `FIDELITY_UPLIFT_PLAN.md`
10. `DESIGN_DIRECTION_BRIEF.md`
11. `UI_REFINEMENT_PLAN.md`
12. `POST_DESIGN_FUNCTIONAL_VALIDATION.md`
13. `shell/control/AGENT_OPERATING_RULES.md`
14. `shell/control/PACKAGE_EXPANSION_PROTOCOL.md`
15. `shell/control/RUN_LOG_TEMPLATE.md`
16. `agent_runs/`
17. current git state

Execution requirements:
- uphold **PRD coverage accounting** (`REUSABLE_SHELL_WORKFLOW.md`): do not silently abandon a **material** PRD commitment when scoping work; deferrals and out-of-scope choices must stay **explicit** and traceable in packages or logs
- if planning artifacts are incomplete, continue planning generation in order
- if execution packages exist, continue package execution in strict sequence
- if the next package is draft/underdefined, invoke blocked-package expansion
- if the package is complete, perform post-package commit closeout
- if execution packages are exhausted and final audit does not exist, generate final audit
- if hardening docs do not exist, generate them
- if hardening passes are incomplete, execute the next pass
- if hardening is complete and fidelity artifacts do not exist, run Phase E fidelity audit then fidelity uplift planning/execution
- if fidelity uplift is complete and design artifacts do not exist, run Phase F design direction and UI refinement flow
- continue automatically through the next valid stage as long as no real stop condition occurs

Package execution rules:
- stay in the current package until it is honestly complete or truly blocked
- self-correct in scope before marking a package blocked or needs_review
- do not continue with a dirty tree after a completed package
- **after** a package is complete, perform full closeout (commit + clean tree) **before** any edits for the **next** package—even when the next package will touch the **same** files; do not merge two completed packages into one commit unless a **documented** exception applies (see `REUSABLE_SHELL_PACKAGE_CLOSEOUT_CHECKLIST.md` — **Inter-package boundary**)
- automatically revert known unintended generated drift before package commit
- inspect diff/stat, commit package work, and verify a clean tree after each completed package

Resume behavior:
- if interrupted previously, infer the active package or pass from artifacts and repo state
- resume near the interrupted point rather than starting over

Final output requirement when you stop:
Provide a concise summary stating:
- current workflow phase reached
- which packages or hardening passes were completed in this run
- which packages were expanded in this run
- what caused the stop, if anything
- what validation passed
- whether protected systems were touched
- whether the repo is clean
- whether the workflow is exhausted/complete```

---

# 6. Blocked-package expansion prompt

## Trigger use

Use this when:
	•	the next package is draft, underdefined, too broad, or otherwise not executable
	•	and the executor needs a dedicated narrowing pass

## Purpose

Rewrite the single next blocked package into the thinnest safe executable slice, or prove that safe narrowing is impossible.

## Prompt

```text
You are the blocked-package expansion stage of the reusable autonomous shell.

You are not doing general execution in this step.

Your only job is to inspect the single next blocked package and determine whether it can be rewritten into the thinnest safe executable slice.

Use:
1. `EXECUTION_PACKAGES.md`
2. `shell/control/PACKAGE_EXPANSION_PROTOCOL.md`
3. `shell/control/AGENT_OPERATING_RULES.md`
4. `PRD_SOURCE.md`
5. `MASTER_ROADMAP.md`
6. `CURRENT_STATE_AUDIT.md`
7. prior run logs in `agent_runs/`
8. current codebase state

Requirements:
- expand only the single next blocked package
- do not expand multiple future packages
- do not implement code in this step
- attempt iterative self-narrowing before concluding the package is not safely expandable
- prefer the thinnest safe slice grounded in documents and current code
- explicitly defer broader systems and unresolved later-package concerns
- when deferring scope, preserve **PRD coverage accounting**: **material** PRD items deferred here must remain **visible** (package text, PRD anchors, or logs)—not silently dropped

Outputs:
- if safe narrowing succeeds:
  - update the package definition in `EXECUTION_PACKAGES.md`
  - create an expansion log
  - state clearly that the package is ready to return to the executor
- if safe narrowing fails:
  - do not fake a rewrite
  - state clearly why even the thinnest plausible slice still requires unresolved product or architecture judgment

Final output in chat:
Provide a concise summary of:
- what package was reviewed
- whether it was successfully narrowed
- what slice was chosen if successful
- what was explicitly deferred
- whether control should return to the main executor ```

---

# 7. Structured escalation prompt

## Trigger use

Use this when:
	•	the shell truly cannot continue safely
	•	even after blocked-package expansion and iterative self-narrowing

## Purpose

Ask the user for the smallest necessary decision without collapsing the run unnecessarily.

## Prompt

 ```text
 A real shell blocker has been reached.

Do not silently stop.
Raise a structured escalation to the user.

Your response must include:

1. the blocked package or phase
2. the exact decision or input needed
3. why the shell cannot safely continue without it
4. what choices are available
5. what “continue-ready” means
6. what “stop” means

Required choice model:
- Continue-ready
- Stop

Rules:
- do not use vague language
- do not make the user rediscover the issue manually
- do not stop unless the user explicitly chooses Stop
- if the user provides the needed decision or chooses Continue-ready, the shell should resume from the blocked point```

---

# 8. Final audit prompt

## Trigger use

Use this when:
	•	execution packages are exhausted
	•	and FINAL_EXECUTION_AUDIT.md does not yet exist

## Purpose

Generate the final execution audit.

## Prompt

```text
You are in the final audit phase of the reusable autonomous shell.

Your job is only to create the closeout audit.

Goal:
Create `FINAL_EXECUTION_AUDIT.md`.

Use:
1. `EXECUTION_PACKAGES.md`
2. `shell/control/AGENT_OPERATING_RULES.md`
3. `shell/control/PACKAGE_EXPANSION_PROTOCOL.md`
4. `PRD_SOURCE.md`
5. `MASTER_ROADMAP.md`
6. `CURRENT_STATE_AUDIT.md`
7. all execution and expansion logs in `agent_runs/`
8. current committed code state

Requirements:
- be truthful and evidence-based
- summarize what the package program completed
- separate code-complete from environment-complete
- identify caveats and deferred decisions
- identify major architecture outcomes
- identify what the next phase should be
- **PRD coverage accounting:** identify any **material** PRD requirements that fit **none** of implemented / scheduled / deferred / out-of-scope / ambiguous, and treat that as a **planning or audit defect** (not silent OK)
- if any **inter-package boundary** was merged or checkpointed outside the default one-package-one-commit rule, state it **explicitly** with evidence (logs, commits)—no silent combination of completed packages
- do not implement code in this step

Output:
- create `FINAL_EXECUTION_AUDIT.md`
- also provide a concise summary in chat of the audit’s main conclusion ```

---

# 9. Hardening-plan prompt

## Trigger use

Use this when:
	•	FINAL_EXECUTION_AUDIT.md exists
	•	POST_EXECUTION_HARDENING_PLAN.md does not exist

## Purpose

Create the targeted post-execution hardening plan.

## Prompt

```text
You are in the hardening planning phase of the reusable autonomous shell.

Your job is only to create the hardening plan.

Goal:
Create `POST_EXECUTION_HARDENING_PLAN.md`.

Use:
1. `FINAL_EXECUTION_AUDIT.md`
2. execution logs and expansion logs
3. current repo state

Requirements:
- this is post-execution hardening only
- do not create a new feature roadmap
- define:
  - purpose
  - why hardening exists now
  - workstreams
  - scope boundaries
  - validation expectations
  - what must feed into final shell closeout
- make clear that hardening is not disguised feature work

Output:
- create `POST_EXECUTION_HARDENING_PLAN.md`
- also provide a concise summary in chat of the hardening workstreams```

---

# 10. Hardening-task-list prompt

## Trigger use

Use this when:
	•	POST_EXECUTION_HARDENING_PLAN.md exists
	•	POST_EXECUTION_HARDENING_TASKS.md does not exist

## Purpose

Turn the hardening plan into an ordered actionable hardening task list.

## Prompt

```text
You are in the hardening planning phase of the reusable autonomous shell.

Your job is only to create the hardening task list.

Goal:
Create `POST_EXECUTION_HARDENING_TASKS.md`.

Use:
1. `POST_EXECUTION_HARDENING_PLAN.md`
2. `FINAL_EXECUTION_AUDIT.md`

Requirements:
- do not implement code yet
- organize the tasks by workstream
- recommend execution order
- identify safest/highest-value first tasks
- tag tasks as appropriate, such as:
  - documentation-only
  - code cleanup
  - backend hardening
  - tooling/CI
  - environment/readiness documentation
- define ordered hardening passes
- keep this hardening-only, not a new roadmap

Output:
- create `POST_EXECUTION_HARDENING_TASKS.md`
- also provide a concise summary in chat of the recommended hardening order```

---

# 11. Hardening pass prompt

## Trigger use

Use this when:
	•	hardening docs exist
	•	and the shell is executing one hardening pass at a time

## Purpose

Execute a single hardening pass within scope.

## Prompt template

```text
You are now in the post-execution hardening phase of the reusable autonomous shell.

This is not new feature work.

Execute only the requested hardening pass from `POST_EXECUTION_HARDENING_TASKS.md`.

Pass to execute:
[INSERT PASS NAME AND INCLUDED TASKS]

Primary goals:
[INSERT PASS GOALS]

Allowed work:
[INSERT PASS-APPROPRIATE ALLOWED WORK]

Not allowed:
- new feature work
- schema/product expansion
- broad refactors outside this pass
- any work belonging to later passes

Use:
1. `POST_EXECUTION_HARDENING_PLAN.md`
2. `POST_EXECUTION_HARDENING_TASKS.md`
3. `FINAL_EXECUTION_AUDIT.md`
4. current repo state
5. relevant logs/docs for this pass

Requirements:
- remain strictly inside this pass
- validate appropriately for this pass
- keep claims truthful
- after pass completion, perform commit/clean-tree closeout if the pass made repo changes
- if this pass completes cleanly, the shell should continue automatically to the next pass unless a real blocker appears or the user explicitly chooses stop

Final output in chat:
Provide a concise summary of:
- what was completed in this pass
- what files changed
- what validation passed
- whether the repo is clean
- whether the shell is ready to continue to the next hardening pass```

---

# 12. Post-build fidelity audit prompt

## Trigger use

Use this when:
	•	hardening passes are complete
	•	`POST_BUILD_FIDELITY_AUDIT.md` does not exist yet

## Purpose

Run the post-hardening functional fidelity audit before closeout.

## Prompt

```text
You are in Phase E (Functional Fidelity Uplift) of the reusable autonomous shell.

Your job in this step is only to create `POST_BUILD_FIDELITY_AUDIT.md`.

Use:
1. raw PRD (original source intent)
2. `PRD_SOURCE.md` (normalized interpreted intent)
3. built application state after hardening
4. planning/audit artifacts (`CURRENT_STATE_AUDIT.md`, `MASTER_ROADMAP.md`, `EXECUTION_PACKAGES.md`, `FINAL_EXECUTION_AUDIT.md`)
5. hardening artifacts/logs in `agent_runs/`

Requirements:
- explicitly establish source hierarchy: raw PRD -> `PRD_SOURCE.md` -> built product
- audit transformed spec vs raw spec for drift/omission/compression/interpretation mismatch
- build a normalized feature/intent map from the validated PRD pair
- audit built product against that map
- classify findings using: aligned, thin, partial, misplaced, missing, deferred
- separate acceptable MVP minimalism from material misalignment
- keep this evidence-based and non-speculative
- do not implement uplift code in this step

Output:
- create `POST_BUILD_FIDELITY_AUDIT.md`
- provide a concise chat summary of major fidelity findings and uplift priorities
```

---

# 13. Fidelity uplift plan/execution prompt

## Trigger use

Use this when:
	•	`POST_BUILD_FIDELITY_AUDIT.md` exists
	•	`FIDELITY_UPLIFT_PLAN.md` does not exist yet, or uplift execution is incomplete

## Purpose

Define and execute a bounded uplift pass that improves functional fidelity without scope creep.

## Prompt

```text
You are in Phase E (Functional Fidelity Uplift) of the reusable autonomous shell.

Use:
1. `POST_BUILD_FIDELITY_AUDIT.md`
2. raw PRD
3. `PRD_SOURCE.md`
4. current repo/worktree state
5. planning/audit artifacts and logs

Primary instruction:
- Uplift fidelity to intended functionality, not speculative expansion.

Required sequence:
1. create `FIDELITY_UPLIFT_PLAN.md` with:
   - bounded uplift scope
   - explicit in-scope and out-of-scope boundaries
   - prioritized uplift work items grounded in Phase E findings
   - explicit deferred items with rationale
2. execute uplift edits only for materially underbuilt intended functionality
3. validate and regress for touched areas
4. re-audit against original intent and update `POST_BUILD_FIDELITY_AUDIT.md` with post-uplift status
5. keep remaining deferred gaps explicit

Guardrails:
- avoid broad redesign
- avoid speculative features unsupported by PRD intent
- keep changes incremental and controlled
- do not enter design-pass behavior in this phase

Final output in chat:
Provide a concise summary of uplift scope, what was improved, what remains deferred, and whether Phase E is complete.
```

---

# 14. Design direction brief prompt

## Trigger use

Use this when:
	•	Phase E fidelity uplift is complete
	•	`DESIGN_DIRECTION_BRIEF.md` does not exist yet

## Purpose

Create a structured high-end product design direction before UI-level implementation changes.

## Prompt

```text
You are in Phase F (High-End Design Pass) of the reusable autonomous shell.

Your job in this step is only to create `DESIGN_DIRECTION_BRIEF.md`.

Use:
1. current built app state after Phase E
2. `POST_BUILD_FIDELITY_AUDIT.md`
3. `FIDELITY_UPLIFT_PLAN.md`
4. current route/page/workflow inventory
5. existing design primitives and shell structure

Requirements:
- this is not a minor CSS cleanup; produce a coherent art direction and product UX intent
- inventory key pages/workflows/content types and visible pain points
- define design system direction for hierarchy, spacing rhythm, typography scale, surfaces, color, composition, navigation clarity, and responsiveness
- define page composition posture for home/dashboard, list/search, and detail/profile-heavy surfaces
- preserve functionality constraints explicitly (routes, workflows, forms, permissions, loading/error behavior, API/data behavior)
- require dense/raw data preservation patterns (collapsible, tabs, drawers, detail/advanced areas) rather than deletion
- keep direction specific enough to drive implementation
- do not implement UI code in this step

Output:
- create `DESIGN_DIRECTION_BRIEF.md`
- provide a concise chat summary of the chosen design direction and preservation constraints
```

---

# 15. UI refinement execution prompt

## Trigger use

Use this when:
	•	`DESIGN_DIRECTION_BRIEF.md` exists
	•	`UI_REFINEMENT_PLAN.md` does not exist yet, or design execution is incomplete

## Purpose

Plan and execute bounded high-end UI refinement while preserving all important functionality.

## Prompt

```text
You are in Phase F (High-End Design Pass) of the reusable autonomous shell.

Use:
1. `DESIGN_DIRECTION_BRIEF.md`
2. current repo/worktree state
3. route/page/workflow inventory
4. current shared design primitives/components
5. Phase E artifacts and planning/audit docs as context

Required sequence:
1. create `UI_REFINEMENT_PLAN.md` with:
   - in-scope and out-of-scope design work
   - shared system updates (typography/spacing/surfaces/color/navigation)
   - page/surface-level refinement plan (home/dashboard, lists/search, detail-heavy views)
   - explicit dense/raw data preservation strategy
2. execute the design refinement in bounded increments
3. preserve all core functionality and business logic
4. run post-design functional validation and record:
   - routes/workflows still usable
   - forms/search/filter behavior preserved
   - loading/error behavior preserved
   - data/API behavior unchanged functionally
   in `POST_DESIGN_FUNCTIONAL_VALIDATION.md`
5. keep remaining design deferrals explicit

Guardrails:
- avoid gimmicky decoration or trend-chasing without purpose
- do not hide/remove valuable information merely because it is visually dense
- do not introduce speculative feature expansion

Final output in chat:
Provide a concise summary of design improvements, preserved functionality evidence, and any deferred design items.
```

---

# 16. Final closeout prompt

## Trigger use

Use this when:
	•	execution packages are complete
	•	final audit exists
	•	hardening plan exists
	•	hardening tasks exist
	•	all hardening passes are complete
	•	`POST_BUILD_FIDELITY_AUDIT.md` exists
	•	`FIDELITY_UPLIFT_PLAN.md` exists
	•	`DESIGN_DIRECTION_BRIEF.md` exists
	•	`UI_REFINEMENT_PLAN.md` exists
	•	`POST_DESIGN_FUNCTIONAL_VALIDATION.md` exists
	•	`FORGESHELL_FINAL_CLOSEOUT.md` does not exist yet

## Purpose

Leave the project in a closeout-ready state, then offer **optional** ForgeShell packaging when bootstrap recorded an application name.

## Prompt

```text
You are in the final closeout phase of the reusable autonomous shell.

Your job in this step is to verify and summarize that the workflow has reached a truthful closeout state.

Do not start new work.
Do not reopen feature execution.

Required checks:
- execution package list exhausted or honestly caveated
- final audit exists
- hardening plan exists
- hardening task list exists
- hardening passes complete or honestly caveated
- `POST_BUILD_FIDELITY_AUDIT.md` exists and reflects post-uplift status
- `FIDELITY_UPLIFT_PLAN.md` exists with explicit deferred-gap recording
- `DESIGN_DIRECTION_BRIEF.md` exists
- `UI_REFINEMENT_PLAN.md` exists
- `POST_DESIGN_FUNCTIONAL_VALIDATION.md` exists with explicit functionality-preservation evidence
- repo is committed and clean
- closeout artifacts are present and coherent
- if requested integrations were scaffolded/deferred (not fully configured live), verify closeout includes explicit remaining user setup items

Required output:
- provide a concise closeout summary stating:
  - whether the workflow is complete
  - what remains caveated if anything
  - whether the repo is clean
  - whether the project is ready for handoff or packaging completion
- include **Remaining external setup required** whenever integrations were scaffolded/deferred; list concrete operator follow-ups (provider project/app creation, API/secret/env configuration, provider CLI/init steps, hosting/deployment connection, and end-to-end auth/backend/billing verification as applicable)

After the checks pass, create `FORGESHELL_FINAL_CLOSEOUT.md` recording:
- `completedAt` as an ISO-8601 timestamp
- a short honest statement that Phase H (final closeout verification for the ForgeShell lifecycle) is complete

Packaging gate (only after Phase H is complete — do not offer earlier):
- If `.forgeshell/packaging.json` exists (bootstrap recorded an application name), present **exactly two** options to the operator and wait for an explicit choice. Do **not** auto-run cleanup.
- If `.forgeshell/packaging.json` is missing, **skip** packaging entirely (no rename prompt).

The two options (exact wording):

### Option 1 — Clean for handoff
Archive ForgeShell runtime logs and final shell artifacts, remove shell internals from the final app repo, rewrite the README for your application, trim shell-specific `.gitignore` entries, and rename `shell-core` to your application name.

### Option 2 — Leave workspace as-is
Keep the finished application inside the full ForgeShell workspace with all shell files intact

Record the decision in `FORGESHELL_PACKAGING_CHOICE.md` with either:
- `choice: clean-for-handoff`
- or `choice: leave-workspace-as-is`
plus an ISO timestamp line.

If the operator chooses **Option 1**:
- ensure the working tree is clean (commit `FORGESHELL_PACKAGING_CHOICE.md` and `FORGESHELL_FINAL_CLOSEOUT.md` if needed)
- from the `shell-core` directory run:
  `node scripts/forgeshell-packaging-handoff.mjs --mode clean`

If the operator chooses **Option 2**:
- commit the choice markers if needed
- do **not** run the handoff script
- leave the workspace unchanged

Handoff script behavior is documented in `shell/reusable/REUSABLE_SHELL_WORKFLOW.md` — Phase I (optional packaging).```

---

# 17. Optional ForgeShell packaging / handoff prompt

## Trigger use

Use this when:
	•	`FORGESHELL_FINAL_CLOSEOUT.md` already exists
	•	`FORGESHELL_PACKAGING_CHOICE.md` does not exist yet
	•	`.forgeshell/packaging.json` exists
	•	the repo is still clean and the ForgeShell lifecycle through Phase H is genuinely complete

## Purpose

Resume the **optional** packaging step only — no new product work.

## Prompt

```text
You are in the optional ForgeShell packaging phase.

The ForgeShell lifecycle through final closeout is already complete (`FORGESHELL_FINAL_CLOSEOUT.md` exists).

Your only job now is packaging, not feature work.

If `.forgeshell/packaging.json` is missing, stop — packaging is not available without bootstrap metadata.

Otherwise present **exactly two** options (same wording as final closeout):

### Option 1 — Clean for handoff
Archive ForgeShell runtime logs and final shell artifacts, remove shell internals from the final app repo, rewrite the README for your application, trim shell-specific `.gitignore` entries, and rename `shell-core` to your application name.

### Option 2 — Leave workspace as-is
Keep the finished application inside the full ForgeShell workspace with all shell files intact

Record the decision in `FORGESHELL_PACKAGING_CHOICE.md` with `choice: clean-for-handoff` or `choice: leave-workspace-as-is` plus an ISO timestamp.

If **Option 1**: ensure a clean tree, then from `shell-core` run `node scripts/forgeshell-packaging-handoff.mjs --mode clean`.

If **Option 2**: commit markers if needed; do not run the handoff script.
```

---

# Trigger routing rules

## Rule A — begin / start

When the user types begin or start, the shell should:
	1.	inspect existing artifact state
	2.	if no planning artifacts exist, start with PRD intake / normalization
	3.	if partial planning artifacts exist, continue from the earliest missing phase
	4.	if execution is already underway and state clearly indicates an interrupted run, prefer asking whether the user intended a fresh start or resume

## Rule B — continue

When the user types continue, the shell should:
	1.	inspect current phase and repo state
	2.	identify the last incomplete unit of work
	3.	resume there automatically
	4.	continue through later phases without requiring a fresh phase selection from the user

## Rule C — healthy handoff (no manual continue required)

When **no** user message is required to unblock the workflow, the shell should still apply **healthy handoff — same-run auto-continue**: after a successful unit with complete enough closeout and no escalation trigger, advance to the next valid unit in the **current** session without requiring the operator to type `continue` solely because a phase completed.

---

# Prompt usage rules

These prompts are not intended to be fired randomly.

The shell should choose them according to workflow phase and artifact state.

The shell must prefer:
	•	state-aware selection
	•	phase-aware selection
	•	artifact-driven selection

over:
	•	user babysitting
	•	manual phase picking
	•	memory-based continuation

---

# Final conclusion

This prompt set is the reusable operational layer of the shell.

It gives the shell a repeatable way to:
	•	start from begin / start
	•	resume from continue
	•	generate its own docs
	•	execute safely
	•	expand blocked work
	•	audit itself
	•	harden itself
	•	close out cleanly

These prompts should be treated as core reusable shell primitives.