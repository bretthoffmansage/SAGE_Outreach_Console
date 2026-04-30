# REUSABLE_SHELL_IMPLEMENTATION_SEQUENCE

## Purpose

This document defines the implementation sequence for turning the reusable autonomous shell design into an actually operable shell.

It answers:

- what should be built first
- what order the shell artifacts should be finalized in
- what counts as shell v1
- how the shell should be tested
- what must be true before the shell is considered ready for real use

This document is not a product roadmap.

It is the packaging/build sequence for the shell itself.

---

## Core objective

The reusable shell must move from:

- a documented shell design

to:

- a runnable, testable, resumable autonomous workflow that can start from a user PRD and proceed through:
  - planning generation
  - package execution
  - blocked-package expansion
  - package-by-package closeout
  - final audit
  - hardening
  - functional fidelity uplift
  - high-end design pass
  - final closeout
  - optional packaging / handoff (Phase I) after a fully successful run when bootstrap recorded `.forgeshell/packaging.json`

This implementation sequence exists so the shell becomes usable in a controlled, testable order rather than as a loose collection of docs.

---

## Implementation philosophy

The shell should not be “finished” in one leap.

It should be packaged in layers:

1. **control docs**
2. **runtime behavior contracts**
3. **prompt and orchestration layer**
4. **closeout and drift discipline**
5. **dry-run validation**
6. **shell v1 readiness decision**

This layered approach reduces the risk of building a shell that sounds complete but cannot actually run.

---

## Shell implementation stages

The shell packaging effort should be executed in six stages.

- Stage 1 — Freeze and validate the shell design baseline
- Stage 2 — Finalize reusable shell control artifacts
- Stage 3 — Finalize prompt/orchestration behavior
- Stage 4 — Finalize closeout/recovery behavior
- Stage 5 — Run end-to-end shell dry-run validation
- Stage 6 — Declare shell v1 readiness or record gaps

---

# Stage 1 — Freeze and validate the shell design baseline

## Goal

Make sure the shell design docs are complete enough and internally consistent before attempting shell use.

## Inputs
- `shell/reusable/REUSABLE_SHELL_PACKAGE_PLAN.md`
- `shell/reusable/REUSABLE_SHELL_ARTIFACT_MAP.md`
- `shell/reusable/REUSABLE_SHELL_RUNTIME_SPEC.md`
- `shell/reusable/REUSABLE_SHELL_WORKFLOW.md`
- `shell/reusable/REUSABLE_SHELL_PROMPTS.md`
- `shell/reusable/REUSABLE_SHELL_RESUME_CONTRACT.md`
- `shell/reusable/REUSABLE_SHELL_ESCALATION_TEMPLATE.md`
- `shell/reusable/REUSABLE_SHELL_PACKAGE_CLOSEOUT_CHECKLIST.md`
- `shell/reusable/REUSABLE_SHELL_GENERATED_DRIFT_RULES.md`
- `shell/reusable/REUSABLE_SHELL_CLI_CONFIGS.md`

## Required actions
1. verify all core shell docs exist
2. verify the docs do not materially contradict each other
3. verify:
   - `begin` / `start` behavior is defined
   - `continue` behavior is defined
   - blocked-package handoff is defined
   - auto-commit/clean-tree discipline is defined
   - final audit/hardening flow is defined
4. commit the shell design baseline

## Exit condition
- shell design docs are present, coherent, and committed

---

# Stage 2 — Finalize reusable shell control artifacts

## Goal

Make sure the shell has the minimum reusable document set needed to run a project from scratch.

## Required artifact classes

### A. Core control artifacts
- `shell/control/AGENT_OPERATING_RULES.md`
- `shell/control/PACKAGE_EXPANSION_PROTOCOL.md`
- `shell/control/RUN_LOG_TEMPLATE.md`
- runtime setup guidance

### B. Planning-generation artifacts
- PRD normalization structure
- current-state audit structure
- roadmap structure
- execution package structure

### C. Closeout artifacts
- final audit structure
- hardening plan structure
- hardening task structure

## Required actions
1. verify which current docs are already generic enough
2. identify which are still too GoTeamGo-specific
3. generalize wording where needed
4. define which templates the shell must generate on fresh projects

## Important rule
At this stage, the shell must separate:
- reusable process structure
from:
- GoTeamGo product content

## Exit condition
- the shell has a coherent generic artifact stack suitable for fresh-project use

---

# Stage 3 — Finalize prompt and orchestration behavior

## Goal

Make sure the shell can actually choose and apply the right prompts at the right time.

## Why this stage matters

The prompt library by itself is not enough.

The shell must also know:

- when to use each prompt
- how to infer current phase
- how to move from one phase to the next
- how to respond to `begin`, `start`, and `continue`
- how to move from blocked-package expansion back into execution
- how to flow from final package completion into audit and hardening automatically

## Required actions
1. verify the prompt set is complete
2. verify the trigger routing rules are complete
3. verify phase-selection logic is explicit
4. verify prompt-selection logic is explicit
5. verify the shell can move from one phase to the next without manual phase-picking

## Specific checks
- `begin` / `start` → fresh project flow
- `continue` → resume flow
- package execution → package expansion → execution return
- final package completion → final audit
- final audit → hardening plan
- hardening plan → task list
- hardening passes 1 → 2 → 3 → 4 automatically

## Exit condition
- prompt selection and phase transitions are explicit enough to run a dry-run project without the old giant custom prompts

---

# Stage 4 — Finalize closeout and recovery behavior

## Goal

Make sure the shell can preserve progress and recover without manual rescue.

## Required behavior areas

### A. Per-package closeout
- diff/stat review
- generated drift handling
- commit
- clean-tree verification

### B. Generated drift handling
- especially `next-env.d.ts`
- automatic revert when not intentional

### C. Resume behavior
- interrupted package resume
- interrupted hardening pass resume
- package-expanded-but-not-executed recovery
- clean handoff back to executor

### D. Structured escalation
- explicit Continue-ready / Stop choices
- stop only on explicit Stop

## Required actions
1. verify closeout behavior is fully specified
2. verify resume behavior is fully specified
3. verify escalation behavior is fully specified
4. verify Codex and Claude CLI runtime guidance supports those behaviors

## Exit condition
- shell recovery and closeout behavior is explicit enough to survive interruption and blocked-package transitions without manual surgery

---

# Stage 5 — Run end-to-end shell dry-run validation

## Goal

Prove that the shell can operate as a real workflow, not just a set of documents.

## Dry-run philosophy

The first shell dry run should be intentionally small.

It should not be a giant real-world project.

The purpose is to validate shell behavior, not product ambition.

---

## Recommended dry-run project shape

Use a tiny fake or small test project with:

- a modest PRD
- a small repo or skeletal codebase
- 3–8 likely execution packages
- at least one package that starts ready
- at least one package that starts draft and must be narrowed
- at least one package or pass that can test resume behavior

---

## Required dry-run tests

### Test 1 — Fresh start
- user types `begin` or `start`
- shell generates:
  - `PRD_SOURCE.md`
  - `CURRENT_STATE_AUDIT.md`
  - `MASTER_ROADMAP.md`
  - `EXECUTION_PACKAGES.md`

### Test 2 — Package execution
- shell executes earliest ready package
- validates
- logs
- commits
- verifies clean tree

### Test 3 — Blocked-package expansion
- shell encounters draft/underdefined package
- invokes blocked-package expansion
- rewrites package safely
- returns to executor automatically
- completes package

### Test 4 — Generated drift handling
- shell encounters known drift such as `next-env.d.ts`
- reverts it automatically when not intentional
- continues package closeout

### Test 5 — Interruption and resume
- interrupt the shell mid-package or between packages
- user types `continue`
- shell resumes correctly from nearest unresolved point

### Test 6 — Structured escalation
- create a scenario that truly needs user input
- shell raises structured escalation
- user chooses Continue-ready
- shell resumes
- optionally test explicit Stop

### Test 7 — Final audit
- shell finishes package list
- generates `FINAL_EXECUTION_AUDIT.md`

### Test 8 — Hardening generation
- shell generates:
  - `POST_EXECUTION_HARDENING_PLAN.md`
  - `POST_EXECUTION_HARDENING_TASKS.md`

### Test 9 — Hardening execution flow
- shell runs Pass 1 through Pass 4 in order
- continues automatically between passes unless blocked

### Test 10 — Final closeout
- shell runs Phase E fidelity uplift first:
  - `POST_BUILD_FIDELITY_AUDIT.md`
  - `FIDELITY_UPLIFT_PLAN.md`
- shell runs Phase F high-end design pass:
  - `DESIGN_DIRECTION_BRIEF.md`
  - `UI_REFINEMENT_PLAN.md`
  - `POST_DESIGN_FUNCTIONAL_VALIDATION.md`
- shell finishes with:
  - clean repo state
  - committed changes
  - closeout artifacts present

---

## Dry-run success criteria

The dry run is successful only if the shell can:

- start from `begin` / `start`
- generate its initial docs
- execute packages
- expand blocked packages
- commit after packages
- resume with `continue`
- escalate only when truly necessary
- generate audit
- generate hardening
- run functional fidelity uplift
- run high-end design pass with functional preservation checks
- execute hardening passes
- end in a clean closeout state

---

# Stage 6 — Shell v1 readiness decision

## Goal

Determine whether the shell is ready for real reuse or still needs another refinement loop.

## Shell v1 should mean

The shell is “v1 ready” only if all of the following are true:

1. it can start from a fresh PRD
2. it can generate the key planning/control docs
3. it can produce a draft-first execution package list
4. it can execute packages in sequence
5. it can narrow blocked packages safely
6. it can return from expansion to execution automatically
7. it can commit after each completed package
8. it can keep the tree clean between packages
9. it can handle recurring generated drift
10. it can resume after interruption with `continue`
11. it can ask structured questions instead of silently dying
12. it can generate final audit
13. it can generate and execute hardening
14. it can run post-build functional fidelity uplift in bounded scope
15. it can run high-end design pass with explicit functional-preservation validation
16. it can end with a clean closeout state

Anything less than that is still pre-v1 or partial-v1.

---

## If shell v1 is not ready

If the dry run exposes gaps, the shell packaging effort must:

1. document the gap precisely
2. classify whether the gap is:
   - planning artifact gap
   - runtime behavior gap
   - prompt/orchestration gap
   - closeout/recovery gap
   - CLI posture gap
3. patch the correct shell artifact
4. rerun the smallest necessary dry-run proof

The shell should be improved systematically, not patched ad hoc.

---

# Recommended implementation order

## Order of work

### I-1 — Commit current shell design docs
- freeze the current shell control-doc baseline

### I-2 — Verify genericity of shell artifacts
- remove GoTeamGo-specific wording where still present
- ensure templates remain reusable

### I-3 — Finalize orchestration layer
- make sure prompts + workflow + resume logic form a coherent operational system

### I-4 — Finalize closeout/recovery layer
- package closeout
- generated drift
- structured escalation
- continue/resume

### I-5 — Create dry-run project
- small enough to test shell mechanics
- realistic enough to expose orchestration gaps

### I-6 — Run full dry-run
- from `begin` through closeout

### I-7 — Patch observed shell gaps
- update correct shell docs/contracts
- avoid random local hacks

### I-8 — Re-run targeted proof
- verify patched behavior

### I-9 — Declare shell v1 ready
- only after successful full workflow proof

---

# Suggested supporting implementation artifacts

To make shell packaging easier, the project may also add:

- `shell/reusable/REUSABLE_SHELL_DRY_RUN_PLAN.md`
- `shell/reusable/REUSABLE_SHELL_DRY_RUN_RESULTS.md`
- `shell/reusable/REUSABLE_SHELL_GAP_LOG.md`

These are optional but strongly useful.

### Why they help
- keep dry-run testing explicit
- avoid forgetting observed gaps
- preserve packaging evidence
- make shell readiness more truthful

---

# Implementation constraints

The shell packaging effort must not drift into:

- more GoTeamGo product development
- environment parity work for GoTeamGo
- random cleanup unrelated to shell behavior
- overbuilding before first dry-run proof

The goal is to package the process, not to reopen the finished product.

---

# Relationship to other shell docs

This implementation sequence must remain aligned with:

- `shell/reusable/REUSABLE_SHELL_PACKAGE_PLAN.md`
- `shell/reusable/REUSABLE_SHELL_ARTIFACT_MAP.md`
- `shell/reusable/REUSABLE_SHELL_RUNTIME_SPEC.md`
- `shell/reusable/REUSABLE_SHELL_WORKFLOW.md`
- `shell/reusable/REUSABLE_SHELL_PROMPTS.md`
- `shell/reusable/REUSABLE_SHELL_RESUME_CONTRACT.md`
- `shell/reusable/REUSABLE_SHELL_ESCALATION_TEMPLATE.md`
- `shell/reusable/REUSABLE_SHELL_PACKAGE_CLOSEOUT_CHECKLIST.md`
- `shell/reusable/REUSABLE_SHELL_GENERATED_DRIFT_RULES.md`
- `shell/reusable/REUSABLE_SHELL_CLI_CONFIGS.md`

If those docs change materially, this sequence should be updated.

---

# Final conclusion

The reusable shell is not ready merely because its design docs exist.

It becomes real only when:

- the design is frozen
- the runtime behaviors are explicit
- the prompt/orchestration layer is coherent
- closeout and recovery are reliable
- a small end-to-end dry run proves the shell can operate from `begin` to closeout

This implementation sequence defines the order in which that should happen.