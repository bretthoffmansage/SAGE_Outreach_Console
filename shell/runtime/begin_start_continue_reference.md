# BEGIN_START_CONTINUE_REFERENCE

## Purpose

This file is a quick runtime reference for how the reusable autonomous shell must interpret the three primary user triggers:

- `begin`
- `start`
- `continue`

It is a lightweight operator/runtime reference.

It does not replace the full logic in:

- `shell/reusable/REUSABLE_SHELL_RESUME_CONTRACT.md`
- `shell/reusable/REUSABLE_SHELL_PROMPTS.md`
- `shell/reusable/REUSABLE_SHELL_WORKFLOW.md`

Instead, it provides a short operational summary of how these triggers should behave in practice.

---

## Core rule

These three words are **workflow triggers**, not product commands.

The shell must never respond to them blindly.

Before acting, the shell must inspect:

- repo state
- workflow artifacts
- `agent_runs/`
- current git state
- current phase indicators implied by existing artifacts

The shell must determine what the user most likely intends based on actual state.

---

# `begin`

## Meaning

`begin` means:

- initialize or enter the shell workflow from the beginning **as appropriate after state inspection**

It does **not** mean:
- blindly restart everything
- overwrite an existing shell run
- ignore partially completed work

## Required behavior

When the user types `begin`, the shell must inspect whether the workspace is:

1. **fresh**
   - `PRD_SOURCE.md` and downstream planning artifacts do not yet exist
   - raw PRD intake is resolvable per **`raw_prd/`** in `shell/reusable/REUSABLE_SHELL_RESUME_CONTRACT.md`, or via the fallback when `raw_prd/` is absent

2. **partially initialized**
   - some planning or shell artifacts exist
   - but the workflow has not completed

3. **already in progress**
   - package execution, audit, or hardening is clearly underway

## Decision rule

- if fresh, ensure **Fresh-run local git repository** per `shell/reusable/REUSABLE_SHELL_WORKFLOW.md` (`git init` at shell root only in the narrow safe case, verify, acknowledge; no remotes; escalate if ambiguous), then start from PRD intake / normalization
- if partially initialized, continue from the earliest missing valid phase
- if clearly in-progress, prefer asking whether the user intended:
  - resume existing run
  - or intentionally restart

## Important rule

`begin` must not casually destroy or overwrite meaningful existing workflow state.

---

# `start`

## Meaning

`start` has the same meaning as `begin`.

It is an equivalent shell trigger.

## Required behavior

When the user types `start`, the shell must behave exactly as it would for `begin`:

- inspect artifact state
- determine fresh vs partial vs in-progress state
- choose the correct starting phase
- avoid blindly restarting work

---

# `continue`

## Meaning

`continue` means:

- resume the current shell workflow from the nearest unresolved unit of work after state inspection

It does **not** mean:
- restart the whole project
- jump to the next package without checking current state
- ignore dirty-tree or partial-closeout conditions

## Required behavior

When the user types `continue`, the shell must:

1. inspect repo state
2. inspect workflow artifacts
3. inspect `agent_runs/`
4. inspect current git state
5. infer the current workflow phase
6. identify the most recent incomplete or unresolved unit
7. resume from there automatically

---

# Artifact state the shell should inspect

Before interpreting any trigger, the shell should inspect at minimum:

- `raw_prd/` (on a fresh intake, apply **Canonical raw PRD intake** in `shell/reusable/REUSABLE_SHELL_RESUME_CONTRACT.md`)
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
- `FORGESHELL_FINAL_CLOSEOUT.md`
- `FORGESHELL_PACKAGING_CHOICE.md`
- `.forgeshell/packaging.json` (if present — optional packaging target from bootstrap)
- `agent_runs/`
- `git status`
- `git diff --stat`

The shell must not rely on conversational memory alone.

---

# Trigger-to-phase reference

## If the workspace is fresh
Expected next step after `begin` or `start` (after **Fresh-run local git repository** / `git init` when the narrow safe case applies, then resolving `raw_prd/` per the resume contract, or escalating if ambiguous):
- create `PRD_SOURCE.md`

## If `PRD_SOURCE.md` exists but audit is missing
Expected next step:
- generate `CURRENT_STATE_AUDIT.md`

## If audit exists but roadmap is missing
Expected next step:
- generate `MASTER_ROADMAP.md`

## If roadmap exists but execution packages are missing
Expected next step:
- generate `EXECUTION_PACKAGES.md`

## If execution packages exist and are not exhausted
Expected next step:
- continue package execution

## If the next package is draft
Expected next step:
- invoke blocked-package expansion for only the next package

## If execution packages are exhausted and final audit is missing
Expected next step:
- generate `FINAL_EXECUTION_AUDIT.md`

## If final audit exists but hardening artifacts are missing
Expected next step:
- generate hardening plan and hardening tasks

## If hardening is active
Expected next step:
- continue the current or next hardening pass

## If hardening is complete but fidelity uplift artifacts are incomplete
Expected next step:
- run Phase E functional fidelity uplift artifacts and execution

## If fidelity uplift is complete but design artifacts are incomplete
Expected next step:
- run Phase F design direction + UI refinement + post-design functional validation

## If all phases are complete
Expected next step:
- verify final closeout state

---

# Resume-specific rules for `continue`

## Rule 1 — Prefer the nearest unresolved unit
The shell should resume from:
- active incomplete package
- completed-but-uncommitted package
- expanded-but-not-yet-executed package
- active hardening pass
- missing final audit
- missing hardening planning artifact
- missing fidelity/design phase artifacts
- incomplete closeout state

It should not simply jump to “the next package number.”

---

## Rule 2 — Dirty tree means unresolved work
If `git status` is dirty, the shell must assume something may still need closeout or classification.

It must determine whether the dirty state is:
- intended active work
- completed-but-uncommitted work
- generated drift
- ambiguous mixed state

It must not skip forward carelessly.

---

## Rule 3 — Expanded package must hand back automatically
If the shell finds:
- an expansion log
- updated package definition
- but no completed execution outcome for that package

then it must resume by handing control back to the main executor automatically.

The user should not need to manually delete logs or restitch the workflow.

---

## Rule 4 — Hardening passes should continue automatically
If one hardening pass completed and the tree is clean, the shell should move into the next hardening pass automatically unless:
- a real blocker exists
- or the user explicitly chooses Stop

---

# Structured escalation rule for trigger handling

If trigger interpretation is genuinely ambiguous, the shell may ask a structured clarification question.

Examples:
- whether the user wants to resume or restart
- whether a contradictory workspace state should be treated as resumable or intentionally reset

But the shell must not:
- stop vaguely
- silently overwrite meaningful work
- ask the user to manually rediscover package state

If escalation is needed, use:
- `shell/reusable/REUSABLE_SHELL_ESCALATION_TEMPLATE.md`

---

# Operator quick guide

## Use `begin` when:
- starting a fresh shell run
- entering a partially initialized shell workspace for the first time

## Use `start` when:
- you want the same behavior as `begin`

## Use `continue` when:
- the shell was interrupted
- a session ended
- credits ran out
- the shell paused mid-workflow
- you want it to resume from the nearest unresolved point

---

# Things the operator should not need to do

During normal shell behavior, the operator should not need to:

- manually identify the current package number
- manually tell the shell which phase it is in
- manually delete blocked logs
- manually reconnect the executor after expansion
- manually revert recurring generated drift
- manually reconstruct the closeout state of the last completed package

The shell should infer and handle those things itself.

---

# Relationship to other shell docs

This file is a quick reference only.

It must remain aligned with:

- `shell/reusable/REUSABLE_SHELL_RESUME_CONTRACT.md`
- `shell/reusable/REUSABLE_SHELL_PROMPTS.md`
- `shell/reusable/REUSABLE_SHELL_WORKFLOW.md`
- `shell/control/AGENT_RUNTIME_SETUP.md`

If those docs change materially, this reference should be updated.

---

## Final conclusion

`begin`, `start`, and `continue` are the shell’s core user triggers.

They are simple on purpose.

But the shell must interpret them through artifact state, git state, and workflow phase logic — not as blind restart/resume shortcuts.

This file is the quick runtime reference for that behavior.