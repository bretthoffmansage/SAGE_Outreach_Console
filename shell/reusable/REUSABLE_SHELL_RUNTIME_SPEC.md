# REUSABLE_SHELL_RUNTIME_SPEC

## Purpose

This document defines the runtime behavior requirements for the reusable autonomous shell.

It explains how the shell should behave when run through:

- Codex CLI
- Claude CLI

Its purpose is to standardize execution posture, interruption handling, package progression, blocked-package expansion, commit discipline, and user-escalation behavior.

This is not a project PRD.

It is an operational runtime contract for the shell itself.

---

## Core runtime objective

The shell runtime must support a full autonomous project lifecycle that can:

- begin from a user-supplied PRD
- generate planning and control docs
- execute packages sequentially
- expand blocked packages safely
- commit after each completed package
- recover from interruption
- complete final audit and hardening
- run post-hardening functional fidelity uplift
- run a high-end design/art-direction/UI-system pass
- leave a clean closeout state
- optionally offer ForgeShell packaging (clean for handoff vs leave workspace as-is) after Phase H when `.forgeshell/packaging.json` exists, per `REUSABLE_SHELL_WORKFLOW.md` Phase I

The runtime must reduce manual rescue burden as much as possible.

---

## Runtime design principles

The runtime must preserve these principles:

1. **non-fragile autonomy**
   - the shell should not require constant operator rescue

2. **truthful control**
   - the shell must not fake completion, fake clean trees, or fake passing checks

3. **clean package boundaries**
   - package execution must remain bounded and reviewable

4. **automatic persistence**
   - completed work should be committed and stabilized package-by-package

5. **automatic recovery**
   - interruption should not destroy execution continuity

6. **structured escalation**
   - if input is needed, the shell should ask clearly rather than silently die

7. **model-agnostic posture**
   - the shell should run under both Codex CLI and Claude CLI with equivalent behavioral expectations

---

## Runtime operating modes

The shell should support these runtime modes.

## Mode 1 — Planning generation mode

### Purpose
Generate:
- normalized PRD source
- current-state audit
- roadmap
- draft-first execution packages

### Expected posture
- analytical
- document-generating
- no package execution yet

---

## Mode 2 — Package execution mode

### Purpose
Execute a ready package from `EXECUTION_PACKAGES.md`.

### Expected posture
- scoped
- implementation-oriented
- validation-aware
- commit-aware

---

## Mode 3 — Blocked-package expansion mode

### Purpose
When the next package is draft, underdefined, or blocked by ambiguity, narrow it safely into the thinnest executable slice.

### Expected posture
- non-coding unless package rewrite/output requires doc edits only
- constrained by `shell/control/PACKAGE_EXPANSION_PROTOCOL.md`
- iterative self-narrowing
- no broad product invention

---

## Mode 4 — Resume mode

### Purpose
Recover from interruption and continue from the most recent incomplete point.

### Expected posture
- inspect prior state
- determine last completed package
- determine active or partial package
- resume without duplicating completed work

---

## Mode 5 — Audit mode

### Purpose
Generate final execution audit and closeout evidence.

### Expected posture
- documentation-first
- evidence-based
- non-aspirational

---

## Mode 6 — Hardening mode

### Purpose
Generate hardening plan, generate hardening task list, and execute hardening passes in order.

### Expected posture
- cleanup/hardening only
- no disguised feature work
- pass-by-pass validation discipline

---

## Mode 7 — Functional fidelity uplift mode

### Purpose
Run a structured post-build fidelity pass that compares raw intent, normalized PRD intent, and implemented product state; then execute bounded uplift before closeout.

### Expected posture
- source-hierarchy aware
- artifact-driven and resumable
- bounded uplift scope
- anti-scope-creep
- explicit deferred-gap documentation

---

## Mode 8 — High-end design pass mode

### Purpose
Run a structured design/art-direction/UI-system refinement pass that upgrades product UX quality while preserving existing functionality.

### Expected posture
- design-system and composition focused
- functionality-preservation first
- artifact-driven and resumable
- bounded high-impact UI refinement, not speculative feature expansion
- explicit post-design functional validation

---

## Runtime behavior required across all modes

Across all runtime modes, the shell must:

- respect source hierarchy
- preserve package scope
- keep logs/evidence
- avoid hidden state changes
- preserve a resumable repo state
- prefer explicit state over ambiguous state
- preserve a clean tree between completed units of work whenever possible

### External integration runtime posture

When PRD requirements include external providers/services, the runtime should default to **scaffold now / configure later** when safe.

The runtime should classify requested integrations into practical states (ready now, scaffold only, requires user setup after build, true blocker) and keep that classification visible in planning/closeout artifacts.

The shell must escalate for up-front integration setup only when the dependency is a **true blocker** for meaningful, safe execution and cannot be narrowed with placeholder/contracts.

---

# 1. Codex CLI runtime posture

## Required Codex posture

The shell’s Codex execution environment should be configured for non-interrupting autonomous work where safe.

The intended Codex posture includes:

- approval behavior equivalent to:
  - `approval_policy = "never"`
- sandbox posture equivalent to:
  - `sandbox_mode = "danger-full-access"`

These settings are not product behavior.
They are shell runtime posture.

### Why this posture is required

The shell is designed to:
- inspect docs
- modify repo files
- generate artifacts
- run validation commands
- commit after completed packages
- continue through many sequential steps

A highly interrupt-driven approval mode would undermine the shell’s intended behavior.

### Constraint

This posture is only appropriate in the context of:
- controlled local worktrees
- safe environments
- explicit operator intent to run the autonomous shell

It is not a claim that all projects should always run this way.

---

# 2. Claude CLI runtime posture

## Required Claude posture

The reusable shell must define a Claude CLI runtime posture equivalent in intent to the Codex posture.

The exact Claude CLI configuration mechanism may differ, but the shell must document the Claude-side equivalents for:

- non-interrupting execution where safe
- broad local repo access where safe
- reduced unnecessary confirmation friction
- ability to inspect and modify files
- ability to run validation commands
- ability to commit completed package work

### Required Claude runtime goals

The Claude CLI equivalent must preserve these operational outcomes:

- the shell can continue through many packages without approval churn
- the shell can inspect and update docs and code
- the shell can perform post-package commit steps
- the shell can resume after interruption
- the shell can run blocked-package expansion and return control to the executor

### Important rule

The shell packaging must not be Codex-specific.

If the runtime setup docs currently only describe Codex behavior, the final shell must add the Claude CLI equivalent guidance so the shell can operate under both systems.

---

# 3. Safe execution context requirements

Before any package execution begins, the runtime must confirm:

1. current repo/worktree path
2. current git branch
3. current environment target
4. whether backend-affecting work will touch a safe environment only
5. whether the current package is allowed to proceed

If any of those are unclear, the shell must not proceed into package implementation.

---

# 4. Package-completion commit discipline

This is a required runtime behavior.

After each completed package, the shell must automatically perform a post-package commit sequence.

## Required post-package commit sequence

After package completion:

1. inspect changed files
2. inspect diff/stat
3. identify intended package artifacts and code changes
4. automatically revert known generated drift not intended as package work
5. stage all relevant package changes and new files
6. create a package-level commit
7. run `git status`
8. confirm the tree is clean before continuing

The shell must not continue into the next package with a dirty tree unless:
- the current package is still in progress
- or a real blocker prevents package closeout

---

## Required generated-file drift handling

The shell must explicitly handle recurring generated drift.

### Known example
- `next-env.d.ts`

If a known generated file changes in a recurring, non-intentional way during validation/build steps, the shell must:

- detect that drift
- determine whether it is intentional package work
- if not intentional, revert it automatically before the package commit
- confirm the resulting tree is clean

This should be built in as a runtime behavior, not left to the user.

---

# 5. Package progression behavior

The shell must continue automatically after each completed package.

It must not stop just because:
- a package completed successfully
- logs were written
- a commit was made

Instead, after a successful package closeout, it must:

1. determine the next package in sequence
2. inspect whether it is ready or draft
3. execute or expand as appropriate
4. continue until a real stop condition occurs or the package list is exhausted

---

# 6. Blocked-package expansion runtime behavior

When the executor encounters a package that is draft, underdefined, or too broad:

1. it must invoke the blocked-package expansion stage
2. the expansion stage must use `shell/control/PACKAGE_EXPANSION_PROTOCOL.md`
3. it must attempt iterative self-narrowing
4. if successful, it must rewrite the package
5. it must create the expansion log
6. it must hand control back to the executor
7. the executor must resume automatically on that same package

The user should not need to:
- delete logs
- reset files
- manually re-run the package from scratch
- manually stitch execution back together

This handoff and resume behavior is a required shell runtime feature.

---

# 7. Structured escalation behavior

If the shell truly cannot continue safely even after blocked-package expansion, it must not simply terminate with a vague stop.

Instead it must raise a structured escalation prompt.

## Required escalation output

The runtime must tell the user:

1. what issue is blocking execution
2. why it cannot be safely narrowed further
3. what decision or input is required
4. what the available choices are
5. what “continue-ready” would mean
6. what “stop” would mean

### Required choice model
The shell should offer something like:
- continue-ready
- stop

The shell should only actually stop if the user explicitly chooses stop.

This is a key runtime behavior.

---

# 8. Resume behavior after interruption

The shell must support interruption and resume.

## Supported interruption examples
- CLI credits exhausted
- session closed
- runtime interrupted
- operator temporarily stops the run without abandoning the project

## Required resume behavior
When the user types:
`continue`

the shell must:

1. inspect the current repo state
2. inspect execution logs and package statuses
3. identify the most recent completed package
4. identify the active or partial package if one exists
5. determine whether that package needs:
   - resume execution
   - post-package cleanup
   - blocked-package expansion
   - retry of failed validation
6. continue from that point rather than starting over

### Important rule
Resume must be:
- state-aware
- package-aware
- log-aware
- non-destructive

---

# 9. Determining state on resume

To support resume reliably, the runtime should use these sources in combination:

1. `EXECUTION_PACKAGES.md`
2. current git state
3. recent files/logs under `agent_runs/`
4. presence of uncommitted changes
5. presence of expansion logs
6. current branch/worktree context
7. final audit / hardening docs if already in later lifecycle phase

The runtime should not rely on memory alone.

It should derive its state from artifacts.

---

# 10. Required stop conditions

The shell may stop only for real reasons.

## Valid stop conditions
- package cannot be responsibly narrowed further
- unresolved validation failure remains after reasonable in-scope repair attempts
- protected-data risk appears
- environment safety becomes unclear
- user explicitly chooses stop after structured escalation
- execution package list is exhausted
- hardening, functional fidelity uplift, and high-end design phases are exhausted and closeout is complete

## Invalid stop reasons
- package completed successfully
- package expansion was needed but not yet attempted
- CLI was interrupted but state is resumable
- tree is dirty but can be cleaned
- known generated drift occurred
- user did not explicitly choose stop

---

# 11. Logging and evidence behavior at runtime

The runtime must automatically preserve evidence.

## Required logging behavior
- create execution log for each package attempt
- create expansion log for each expanded package
- create stop log when a real stop occurs
- preserve the logs in the standard repo location
- keep log naming predictable and phase-aware

## Required evidence discipline
- commands run must reflect reality
- validation results must reflect reality
- package completion claims must reflect reality
- later closeout phases must be able to reconstruct execution history from these logs

---

# 12. Runtime behavior for audit, hardening, fidelity, and design phases

The shell’s runtime must include closeout as a real phase.

## Required closeout sequence
After package execution is exhausted:

1. generate final execution audit
2. generate hardening plan
3. generate hardening task list
4. execute hardening passes in order
5. run functional fidelity uplift:
   - generate `POST_BUILD_FIDELITY_AUDIT.md`
   - generate `FIDELITY_UPLIFT_PLAN.md`
   - execute bounded uplift + re-audit
6. run high-end design pass:
   - generate `DESIGN_DIRECTION_BRIEF.md`
   - generate/execute `UI_REFINEMENT_PLAN.md`
   - generate `POST_DESIGN_FUNCTIONAL_VALIDATION.md`

### Reserved later phases

After Phase F design pass, a lifecycle slot for post-uplift validation remains intentionally reserved for future implementation.

## Required hardening pass behavior
Hardening must run in ordered passes:

- Pass 1
- Pass 2
- Pass 3
- Pass 4

The runtime must continue automatically from one completed pass to the next unless:
- a real blocker occurs
- validation fails and cannot be repaired
- or the user explicitly chooses stop

The shell must not require manual re-launch between every hardening pass.

---

# 13. Runtime behavior around environment caveats

The shell must distinguish between:

- **code-complete**
- **environment-complete**

If the project is code-complete but environment-incomplete, the runtime must:
- record that clearly
- not fake environment proof
- allow later hardening/audit artifacts to capture the distinction

The shell should prefer truthful readiness reporting over pretending completeness.

---

# 14. Runtime behavior around protected systems

The runtime must preserve protected-data discipline at all times.

This means:

- do not touch canonical/protected data casually
- prefer safe dev/staging validation when allowed
- document environment caveats honestly
- stop if the next action would create unsafe protected-data risk

This requirement holds under both Codex CLI and Claude CLI.

---

# 15. Runtime behavior around validation

The shell must maintain a truthful validation posture.

## During package execution
- run required package validation
- run regressions
- repair in-scope failures before continuing

## During hardening
- validate according to hardening pass scope
- do not use hardening as an excuse to skip checks

## During final closeout
- document whether the project is:
  - code-complete
  - environment-complete
  - or still caveated
- when integrations were scaffolded or deferred, include a clear **Remaining external setup required** section with concrete operator follow-up tasks (provider setup, keys/secrets/env vars, provider CLI/init, deployment/hosting connection, and final end-to-end verification as applicable)

---

# 16. Runtime artifacts that may need explicit support files

The shell may benefit from explicit runtime support files such as:

- resume cursor / active phase note
- package status index
- known generated drift file list
- CLI config examples for Codex and Claude
- package commit checklist artifact
- structured escalation template

These are not all mandatory, but the runtime should be allowed to add them if they improve reliable autonomy.

---

# 17. Minimum runtime success criteria

The shell runtime should be considered successful only if it can do all of the following:

- execute packages sequentially
- expand blocked packages automatically
- resume after interruption with `continue`
- auto-commit after completed packages
- keep the tree clean between completed packages
- auto-revert known generated drift like `next-env.d.ts`
- escalate structured questions instead of silently dying
- continue through hardening passes automatically
- run bounded functional fidelity uplift with explicit deferred-gap accounting
- run high-end design pass with explicit functionality-preservation validation
- support both Codex CLI and Claude CLI in equivalent operational posture

---

# 18. Runtime constraints

The runtime must not:

- silently invent product direction
- silently ignore failing checks
- continue indefinitely with a dirty tree
- require the user to manually clean recurring generated drift
- require the user to manually stitch executor ↔ expander handoffs together
- treat interruption as fatal when the state is resumable
- assume one CLI tool is the only supported runtime

---

# 19. Recommended runtime outputs to define next

After this spec, the next shell docs should explicitly define:

1. `shell/reusable/REUSABLE_SHELL_WORKFLOW.md`
2. CLI runtime config examples / guidance
3. structured escalation template
4. continue/resume contract
5. per-package commit-closeout contract

These will operationalize this runtime spec.

---

# 20. Final conclusion

The reusable shell runtime must behave like a disciplined autonomous operator.

It must be able to:
- start from planning
- execute safely
- recover intelligently
- commit reliably
- expand blocked work
- ask for input only when truly necessary
- complete hardening, fidelity uplift, design pass, and closeout without manual babysitting

This runtime spec defines that behavioral contract.