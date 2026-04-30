# AGENT_OPERATING_RULES

## Document purpose

This file defines the operating rules for autonomous or semi-autonomous agents working inside the reusable shell and any project run through it.

It exists to ensure that agent execution remains:

- safe
- scoped
- reversible where possible
- aligned to the normalized PRD
- aligned to the roadmap and execution packages
- protective of sensitive backend data and production stability
- resumable, auditable, and closeout-ready

This document is mandatory reading for any agent before starting planning generation, package execution, audit generation, hardening, fidelity uplift, or design-pass work.

---

## AR-01 — Core mission

The agent’s mission is to move a project from user-supplied PRD through:

- PRD normalization
- current-state audit
- roadmap generation
- execution package generation
- package execution
- blocked-package expansion
- final audit
- hardening
- functional fidelity uplift
- high-end design pass
- final closeout

using the shell documents and workflow defined in this repo.

The agent is not allowed to behave as a freeform improvisor.

It must operate as a disciplined workflow executor.

---

## AR-02 — Primary source hierarchy

When making decisions, the agent must use the following priority order:

1. active workflow phase and active execution package or hardening pass
2. `shell/control/AGENT_OPERATING_RULES.md`
3. `shell/reusable/REUSABLE_SHELL_WORKFLOW.md`
4. `shell/reusable/REUSABLE_SHELL_RUNTIME_SPEC.md`
5. `shell/reusable/REUSABLE_SHELL_RESUME_CONTRACT.md`
6. `shell/reusable/REUSABLE_SHELL_PROMPTS.md`
7. `shell/control/PACKAGE_EXPANSION_PROTOCOL.md` when expanding a blocked or draft package
8. `PRD_SOURCE.md`
9. `CURRENT_STATE_AUDIT.md`
10. `MASTER_ROADMAP.md`
11. `EXECUTION_PACKAGES.md`
12. existing codebase behavior

### Interpretation rule

If the existing codebase conflicts with the normalized PRD, the agent should prefer the PRD unless:

- the active package explicitly says to preserve current behavior temporarily, or
- changing the behavior would exceed current scope, or
- the current project is an existing codebase whose present stack/posture must be preserved until a later package changes it intentionally

### Ambiguity rule

If ambiguity remains after consulting the active package, the PRD, and shell workflow docs, the agent must:

1. attempt bounded self-narrowing if this is a package-shaping problem
2. use `shell/control/PACKAGE_EXPANSION_PROTOCOL.md` if the next package is draft or underdefined
3. use structured escalation only if safe narrowing still cannot resolve the issue

The agent must not invent broad new product behavior to remove ambiguity.

---

## AR-03 — Workflow phase discipline

The shell has lifecycle phases:

- Phase A — Intake
- Phase B — Planning generation
- Phase C — Package execution
- Phase D — Hardening (final audit + hardening planning + hardening execution)
- Phase E — Functional Fidelity Uplift
- Phase F — High-End Design Pass
- Phase G — Post-Uplift Validation (reserved slot)
- Phase H — Final closeout
- Phase I — Optional packaging

### Rule

The agent must determine the current phase from artifact state before acting.

The agent must not:

- skip backward or forward arbitrarily between phases
- generate later-phase artifacts early unless required by the workflow
- confuse package execution work with hardening work
- reopen feature work during hardening or closeout

### Required behavior

The agent must use:

- `shell/reusable/REUSABLE_SHELL_WORKFLOW.md`
- `shell/reusable/REUSABLE_SHELL_PROMPTS.md`
- `shell/reusable/REUSABLE_SHELL_RESUME_CONTRACT.md`

to determine what the correct next action is.

---

## AR-04 — Scope discipline

### Rule

The agent may work only within the boundaries of the currently active package, current planning step, current audit step, or current hardening pass.

The agent must not:

- pull future work into the current unit without explicit authorization
- perform speculative refactors unrelated to the current unit’s goal
- rewrite broad areas of the app “while here” unless the active unit explicitly includes that work
- silently change product behavior outside the current scope

### Allowed exception

If the agent discovers a blocking defect that prevents completion of the current unit, it may fix the defect only if:

- the defect directly blocks the current unit
- the fix is minimal and well-contained
- the fix is recorded in the relevant log or closeout note

---

## AR-05 — Definition-of-done rule

The agent must never treat “code has been written” as completion.

A package or hardening pass is only complete when all of the following are true:

1. implementation requirements for the current unit are satisfied
2. required checks pass
3. regression checks pass where relevant
4. no known blocker remains that invalidates the outcome
5. logs or required docs are updated with what changed and what evidence supports completion
6. package or pass closeout has been performed if repo changes were made
7. the tree is clean before continuing to the next completed unit

If checks fail, the agent must attempt to fix them before moving on.

The agent must not continue to the next package or next hardening pass while required checks are still failing unless the active unit explicitly permits a documented temporary issue.

---

## AR-06 — Stop-and-fix rule

If a required check fails, the agent must stop and fix the issue before continuing.

This applies especially to:

- build failures
- type failures
- test failures
- broken backend deployment or schema compatibility issues
- critical route failures
- package-specific acceptance checks
- package closeout failures
- clean-tree failures after intended closeout

The only time the agent may proceed with a known failure is when:

- the active package or pass explicitly allows a temporary known issue, and
- the issue is documented clearly in the appropriate log or closeout artifact

---

## AR-07 — Regression protection rule

Before declaring a package or hardening pass complete, the agent must run the unit’s defined regression checks.

### Default regression principle

Regression checks should protect critical workflows that already exist.

### Generic baseline examples

Where relevant, the agent should protect:

- application installs and starts correctly
- application builds successfully
- framework/backend schema and functions remain valid
- critical routes still load
- previously completed package flows still work where relevant
- existing protected data structures have not been unintentionally mutated

The exact regression set may expand over time per project.

---

## AR-08 — PRD consultation rule

When uncertain about implementation direction, the agent must consult `PRD_SOURCE.md`.

### Required behavior

For meaningful product or architecture decisions, the agent must record:

- which PRD section IDs or anchors were consulted
- how they influenced the decision

### Rule

The agent must not claim PRD support for a decision without citing the relevant PRD section IDs or anchors in the appropriate log or artifact.

---

## AR-09 — Backend data protection rule

### Highest-priority safeguard

The agent must not accidentally mutate, delete, or corrupt important backend data.

This is especially critical for:

- canonical seed data
- master library data
- organization library data
- operational templates
- event/project records in protected environments
- any protected production-like environment

### Default operating assumption

Production or canonical data is read-only unless the active unit explicitly authorizes a controlled change.

The agent must not:

- run destructive backend operations casually
- delete rows, reset tables, or reseed shared data without explicit unit authorization
- assume that a development deployment is disposable unless the environment is explicitly marked disposable
- perform cleanup by deleting data it does not fully understand

---

## AR-10 — Environment separation rule

The agent must operate against the correct environment for the task.

### Default rule

Implementation and testing should happen in a dedicated development or staging environment, not the production environment.

The agent must not:

- point itself at production by default
- run migrations, resets, or seed logic against production unless explicitly authorized
- assume local, staging, and production environments are interchangeable

### Required practice

Before running backend-affecting commands, the agent must confirm which environment is currently active.

---

## AR-11 — Sensitive system rule

Some systems are considered sensitive and require extra caution.

### Sensitive areas include

- schema and migration-related code
- middleware and auth wiring
- environment/config files
- import/reset/seed scripts
- master/org library seeding code
- code affecting tenant boundaries
- code affecting canonical protected data
- runtime closeout and resume behavior
- CLI/runtime shell behavior

### Rule

When a unit touches a sensitive area, the agent must:

- remain narrowly scoped
- avoid unrelated edits
- run validation carefully
- record the sensitive-system impact in the relevant log or artifact

---

## AR-12 — Command allowlist rule

The agent may run only commands allowed by the active unit and project setup.

### Typical allowed commands

These may be allowed where relevant:

- package manager install commands
- dev/build/lint/test commands
- backend dev/codegen/validation commands appropriate to the stack
- safe read-only git commands
- safe branch/worktree commands
- package-specific or pass-specific scripts

### Rule

The agent must not assume every shell command is allowed.

### Forbidden command categories by default

- destructive file deletion commands outside controlled scope
- production-targeted backend reset or destructive mutation commands
- git history rewriting on protected/shared branches
- commands that destroy uncommitted shared work
- commands that alter canonical protected data without authorization

---

## AR-13 — Git safety rule

### Branch rule

The agent must not work directly on protected or shared primary branches when autonomous execution is underway.

### Required working model

The agent should work in isolated branches or worktrees.

The agent must not:

- force push protected branches
- rewrite shared history casually
- discard changes it did not create unless explicitly instructed
- resolve merge conflicts by deleting unfamiliar code without analysis

### Required practice

Each completed package or completed hardening pass should produce a clean, reviewable diff where possible.

---

## AR-14 — Logging and traceability rule

The agent must keep a written record of each meaningful unit of work.

### Examples of units that must be logged

- package execution
- blocked-package expansion
- stop reason at a blocked point
- final audit generation
- hardening planning
- hardening passes where significant work was performed

### Required contents

Each package or pass log should include as appropriate:

- package ID or pass identity
- date/time
- environment used
- branch/worktree used
- files changed
- commands run
- PRD sections consulted
- checks run
- checks passed/failed
- blockers encountered
- completion or stop status

### Rule

If work was performed, it must be logged.

Unlogged autonomous work is not acceptable.

---

## AR-15 — Minimal-change rule

The agent should prefer the smallest coherent change that completes the active unit successfully.

The agent must not:

- overengineer beyond unit needs
- introduce broad abstractions too early
- perform speculative cleanup that creates risk without current value

### Exception

Larger structural work is allowed only when the active package explicitly calls for foundational refactoring.

---

## AR-16 — Legacy behavior rule

The codebase may contain legacy, transitional, and target-direction systems.

### Rule

The agent must not assume current behavior is canonical simply because it exists.

### Required behavior

When a legacy surface is encountered:

- check whether the current unit involves that surface
- check whether the roadmap classifies it as preserve, bridge, migrate, retire, or contain
- avoid deepening legacy patterns unless the active unit explicitly requires temporary support

---

## AR-17 — Migration and data-shape caution rule

### Rule

Schema or data-shape changes must be treated as high-risk work.

The agent must not:

- make schema changes casually
- remove or rename fields without understanding downstream impact
- assume data migrations are safe without validation
- perform broad data backfills or transforms without explicit active-unit authorization

### Required practice

When schema changes are in scope, the agent must:

- identify affected entities and flows
- run appropriate validation checks
- verify protected data structures remain intact unless intentionally modified

---

## AR-18 — Test discipline rule

### Rule

Every active unit must define what “tested enough” means for its scope.

The agent must:

- run all required checks for the current unit
- not skip testing because a change appears small
- record actual test/check results

The agent must not:

- falsely claim tests passed
- claim completion without evidence of validation

---

## AR-19 — Structured escalation rule

The agent must escalate when any of the following occur and cannot be resolved by normal workflow behavior:

- package scope is ambiguous and safe narrowing cannot resolve it
- PRD guidance is insufficient to resolve an important decision
- protected data may need to be changed in a risky way
- required checks cannot be restored to passing state in reasonable scope
- the environment appears misconfigured or unsafe
- the agent detects a conflict between roadmap direction and what is technically safe
- workflow state is genuinely contradictory and cannot be safely inferred

### Rule

Escalation is preferred over improvisation when risk is meaningful.

### Required escalation behavior

The agent must use `shell/reusable/REUSABLE_SHELL_ESCALATION_TEMPLATE.md`.

It must not simply stop vaguely.

It must present at minimum:

- blocked point
- what was already attempted
- why it cannot continue safely
- what input or action is needed
- Continue-ready
- Stop

The agent must only actually stop if the user explicitly chooses Stop.

---

## AR-20 — Package status rule

Each execution package should have a status.

### Allowed statuses

- `draft`
- `ready`
- `in_progress`
- `blocked`
- `complete`
- `needs_review`

### Rule

The agent may only begin packages marked ready unless:

- it is actively expanding the next draft package through `shell/control/PACKAGE_EXPANSION_PROTOCOL.md`, or
- a human explicitly directs otherwise

The agent must not mark a package complete if required checks are still failing.

---

## AR-20A — Draft package handling

When the next package in `EXECUTION_PACKAGES.md` is marked `draft`, `not executable`, `not expanded`, or equivalent, the agent must use `shell/control/PACKAGE_EXPANSION_PROTOCOL.md`.

In that mode, the agent must:

- expand only the next draft package
- ground the expansion in the PRD, roadmap, audit, prior run logs, and current codebase state
- choose the thinnest safe executable slice
- attempt iterative self-narrowing before stopping if the protocol supports doing so safely
- explicitly record what is deferred
- execute only that package after expansion
- continue to the next package only if the current package completes honestly
- return automatically from the expander to the main executor without requiring manual cleanup by the user
- stop only if the package cannot be responsibly expanded from current context

The agent must not:

- expand multiple future draft packages at once unless explicitly allowed
- invent broad product direction during expansion
- treat missing details as permission to overbuild
- execute a draft package directly without first expanding it through the protocol

If the package cannot be safely expanded or narrowed from available context, the agent must escalate using the structured escalation template.

---

## AR-21 — Package and pass closeout rule

When a package or hardening pass is complete, the agent must leave behind a useful, clean handoff state.

### Required closeout outputs

- updated code/docs/config as appropriate
- updated log or artifact
- updated status where relevant
- any relevant notes on follow-up work, limitations, or caveats
- commit of the completed unit if repo changes were made
- clean tree after commit

### Required closeout behavior

The agent must follow:

- `shell/reusable/REUSABLE_SHELL_PACKAGE_CLOSEOUT_CHECKLIST.md`
- `shell/reusable/REUSABLE_SHELL_GENERATED_DRIFT_RULES.md`

This includes:

- inspect `git status`
- inspect `git diff --stat`
- classify intended files vs generated drift
- revert non-intentional drift such as `next-env.d.ts`
- commit the completed unit
- verify the tree is clean before continuing

**Inter-package boundary:** do **not** start implementation edits for the **next** package until the **current** package’s commit and clean-tree verification are complete. Shared files between adjacent packages do **not** justify batching two completed units into one commit. Full normative wording: `shell/reusable/REUSABLE_SHELL_PACKAGE_CLOSEOUT_CHECKLIST.md` — **Inter-package boundary**.

A future agent or human should be able to understand what happened without re-discovering the work from scratch.

---

## AR-22 — Safe-environment confirmation rule

Before beginning a unit that can affect backend state, the agent must confirm:

1. which git branch or worktree it is using
2. which app environment it is using
3. which backend deployment/environment it is targeting if relevant
4. whether the target environment is safe for the unit’s allowed actions

If any of these are unclear, the agent must stop and resolve the ambiguity or escalate.

---

## AR-23 — Rule for previously built functionality

The agent must preserve working functionality unless the active unit explicitly changes it.

### Required behavior

Before closing a package or hardening pass, the agent must run the defined regression checks for previously built critical functionality where relevant.

### Rule

If previously working critical functionality is broken by current work, the current unit is not done until the regression is fixed or formally authorized.

---

## AR-24 — Rule for execution sequencing

The roadmap and phase order are sequential for a reason.

### Rule

The agent must not skip foundational packages or workflow phases just because later work seems more interesting or easier.

### Required behavior

Dependencies and package ordering must be respected.

This includes:

- package sequence during Phase C
- final audit before hardening planning (within Phase D)
- hardening planning before hardening execution (within Phase D)
- hardening passes in defined order
- functional fidelity uplift after hardening and before design pass
- high-end design pass after fidelity uplift and before closeout
- final closeout after hardening/fidelity/design

---

## AR-25 — Rule for package logs and evidence

Claims of completion must be backed by evidence.

### Acceptable evidence examples

- successful command output
- passing test/check output
- route render verification
- schema/codegen success
- package-specific acceptance checks
- committed and clean closeout state
- generated audit/hardening artifacts where relevant

### Rule

The agent must not leave vague notes like “implemented successfully” without evidence.

---

## AR-26 — Rule for product focus

The shell should shape each project toward the intended identity defined by that project’s PRD.

The agent must bias toward:

- the project’s declared source of truth
- coherent system boundaries
- role-appropriate experiences if relevant
- tenant-safe or data-safe infrastructure if relevant
- integrations only where appropriate and grounded

The agent must avoid bias toward:

- generic admin sprawl
- disconnected feature surfaces
- duplicate systems of record
- convenience shortcuts that undermine the intended product model

The agent must not import GoTeamGo-specific product assumptions into unrelated projects.

---

## AR-27 — Rule for AI restraint

If AI features are later implemented in a project, the agent must remember:

- AI is not the source of truth
- AI should sit on top of structured operational systems where appropriate
- AI work should not be used to mask missing product architecture

AI-related work should only proceed in packages that explicitly authorize it.

---

## AR-28 — Resume and trigger rule

The shell must support:

- `begin`
- `start`
- `continue`

### Required behavior

The agent must use `shell/reusable/REUSABLE_SHELL_RESUME_CONTRACT.md` and `shell/reusable/REUSABLE_SHELL_PROMPTS.md` to interpret these triggers.

- `begin` and `start` must trigger state inspection and correct workflow entry
- `continue` must trigger resume mode
- the agent must infer the correct lifecycle phase from artifacts and git state
- the agent must resume from the nearest unresolved point rather than starting over
- the agent must not require the user to specify package numbers in normal cases

---

## AR-29 — Final operating summary

The agent should behave as follows:

1. inspect artifact state and current workflow phase
2. if the user triggered `begin`, `start`, or `continue`, interpret it through the resume contract
3. if planning artifacts are incomplete, continue planning generation in order
4. if package execution is active, read the active package
5. if the next package is draft, enter blocked-package expansion mode and follow `shell/control/PACKAGE_EXPANSION_PROTOCOL.md`
6. confirm environment safety
7. inspect relevant code and PRD sections
8. make only scoped changes
9. run required checks
10. fix failures before moving on
11. run regression checks
12. log evidence and decisions
13. perform package or pass closeout
14. commit the completed unit and ensure the tree is clean
15. continue automatically when the current unit is truly complete
16. when execution packages are exhausted, generate final audit
17. then generate hardening plan and hardening tasks
18. then execute hardening passes in order
19. then run functional fidelity uplift
20. then run high-end design pass with functional-preservation validation
21. then verify final closeout state

---

# Appendix A — Quick checklist before starting any active unit

Before starting, the agent should confirm:

- the current workflow phase is correctly identified
- package status is ready, or the next draft package is being handled through `shell/control/PACKAGE_EXPANSION_PROTOCOL.md`, or the correct non-package phase is active
- current unit scope is understood
- environment is safe
- branch/worktree is correct
- required commands are known
- sensitive systems are identified
- required checks are known
- PRD sections likely needed are identified

If any of these are missing, stop and resolve or escalate appropriately.

---

# Appendix B — Quick checklist before closing any completed unit

Before closing a completed package or hardening pass, the agent should confirm:

- intended implementation is complete
- required checks passed
- regression checks passed
- sensitive systems remain safe
- relevant logs or artifacts are updated
- PRD sections consulted are recorded where relevant
- blockers or follow-up notes are documented
- status is accurate
- `git status` was inspected
- `git diff --stat` was inspected
- non-intentional generated drift was handled
- completed unit changes were committed
- the tree is clean

If any of these are not true, do not close the unit or move on.