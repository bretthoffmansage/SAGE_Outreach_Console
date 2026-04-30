# PACKAGE_EXPANSION_PROTOCOL

## Purpose

This file defines how the shell must turn a draft or underdefined execution package into an executable package definition without drifting away from:

- the normalized PRD
- the roadmap
- the current-state audit
- prior completed work
- source-of-truth boundaries
- shell resume/closeout discipline
- safe environment constraints

The goal is to let the shell expand **one next draft package at a time** into the **thinnest safe executable slice**, execute it, and then automatically return to the main executor flow.

This protocol exists to prevent these failure modes:

1. stopping too early when a package is actually expandable from current context
2. inventing broad product direction when a package is still underdefined
3. overbuilding a subsystem when a much smaller safe foundation slice would satisfy the package
4. requiring the user to manually restitch executor ↔ expander handoff
5. treating draft-package ambiguity as permission to skip the package or jump ahead

---

## When this protocol must be used

Enter **Package Expansion Mode** when all of the following are true:

- the next package in `EXECUTION_PACKAGES.md` is marked `draft`, `not executable`, `not expanded`, or equivalent
- the package is next in sequence
- the package is not explicitly blocked by a human instruction
- the package may be expandable from current project context

Do **not** enter Package Expansion Mode for multiple future packages at once.

Expand **only the next draft package**.

---

## Required sources for package expansion

When expanding a draft package, consult these sources in this priority order:

1. `EXECUTION_PACKAGES.md`
2. `shell/control/AGENT_OPERATING_RULES.md`
3. `shell/control/PACKAGE_EXPANSION_PROTOCOL.md`
4. `shell/reusable/REUSABLE_SHELL_WORKFLOW.md`
5. `shell/reusable/REUSABLE_SHELL_RUNTIME_SPEC.md`
6. `shell/reusable/REUSABLE_SHELL_RESUME_CONTRACT.md`
7. `PRD_SOURCE.md`
8. `MASTER_ROADMAP.md`
9. `CURRENT_STATE_AUDIT.md`
10. prior run logs in `agent_runs/`
11. current codebase state
12. validation and backup docs if present

If these sources are insufficient even after iterative self-narrowing, stop and escalate using the structured escalation rules.

---

## Expansion rule: one package only

When expanding a draft package:

- expand only the current next package
- do not expand later packages in the same run
- do not rewrite already completed package definitions except for tiny cross-reference corrections if strictly needed
- do not change package order
- do not silently skip the current next draft package unless the active workflow explicitly allows it
- if the package is broad or underdefined, attempt a narrowing rewrite into the thinnest safe executable slice before stopping
- if that first narrowing rewrite is still too broad, continue narrowing iteratively before stopping

---

## Core expansion rubric

Before writing the expanded package, the shell must answer these questions and record the results in the expansion log.

### 1. Why is this package expandable now?
Identify:

- what earlier completed packages unlocked it
- why this package belongs now in the sequence
- why it is not still premature

### 2. What is the minimum PRD promise this package must make real?
Identify:

- the smallest meaningful promise from the PRD and roadmap that this package should now implement
- avoid trying to fulfill the whole future vision in one slice

### 3. What is the thinnest safe executable slice?
Define:

- the smallest internal operational or foundational version of this package
- the smallest schema/backend/UI move that makes the package real
- the smallest validation story that can prove it works

### 4. What must be deferred?
Explicitly list:

- capabilities that belong to later packages
- systems that must not be built yet
- richer product directions intentionally left for later

### 5. What prior completed systems must remain intact?
Identify:

- earlier package outcomes that cannot be broken
- the exact regressions this package must check

### 6. Why is this slice safe?
Explain:

- why the package is grounded in the PRD, roadmap, audit, and prior logs
- why the slice is narrow enough
- why it does not require broad invention or unresolved major product judgment

### 7. How will control return to execution?
Identify:

- whether the package will return directly to the main executor after expansion
- what state/artifacts prove the executor can resume automatically
- whether any package-closeout implications already matter

The user must not need to manually delete logs or manually reprompt the system to stitch execution back together.

---

## Expansion output requirements

The expanded package must be written back into `EXECUTION_PACKAGES.md` in the same style and structure as the rest of the package file.

At minimum, the expanded package must define:

- Status
- Priority
- Depends on
- Blocks
- Human approval required
- Data migration involved
- Purpose
- Why now
- PRD anchors
- Current-state anchors
- Scope
- Out of scope
- Preconditions
- Likely files / systems involved
- Sensitive systems
- Allowed actions
- Forbidden actions
- Required checks
- Regression checks
- Definition of done
- Completion evidence
- Notes for future package expansion

The resulting package must be:

- executable
- narrow
- sequence-correct
- validation-aware
- explicit about what is deferred
- compatible with automatic handoff back to the executor

---

## Expansion boundaries

The shell must **not** do any of the following during package expansion:

- invent broad product systems not clearly supported by the PRD and roadmap
- redesign adjacent packages while expanding the current package
- solve multiple roadmap chapters at once
- use missing details as permission to overbuild
- redefine already completed package outcomes
- expand into full production-grade systems when the package only needs a baseline foundation
- create second editable systems of record when the current source-of-truth boundary should be preserved
- choose between materially different platform directions without grounding in project documents
- leave the package expanded in a way that still requires manual executor cleanup to proceed

---

## Narrowing rewrite rule

When a draft or underdefined package cannot be executed as currently written, the shell must not stop immediately if the package may still be narrowable from current project context.

Before stopping, the shell must attempt a **narrowing rewrite** of that package.

A narrowing rewrite means:

- identify the minimum PRD and roadmap promise that must be made real now
- identify the smallest safe internal operational slice that satisfies that promise
- explicitly defer broader systems, richer UX, external exposure, deeper architecture, and later-package concerns
- rewrite the package definition in `EXECUTION_PACKAGES.md` into that thinner executable form
- record in the expansion log why that narrower slice is justified and what was deferred
- then hand it back for execution

The shell must prefer a narrowing rewrite over stopping when:

- the package is broad but the next safe slice is inferable from the PRD, roadmap, audit, prior run logs, and current codebase
- the unresolved ambiguity can be removed by making the package smaller
- the resulting slice stays sequence-correct and does not invent a broad new system

The shell must stop instead of rewriting only when:

- even the thinnest plausible slice still requires unresolved product judgment
- the package would require choosing between multiple materially different platform directions
- the first safe slice cannot be identified without inventing a new architecture
- protected-data risk or unsafe migration risk would still remain after narrowing

The purpose of this rule is to bias the shell toward **disciplined narrowing** rather than premature stopping, while still preventing speculative product invention.

---

## Iterative self-narrowing rule

When a draft or underdefined package is too broad to execute safely as written, the shell must attempt iterative self-narrowing before stopping.

This means the shell should repeatedly reduce the package to a smaller safe slice until one of two things is true:

1. a grounded executable slice is found
2. further narrowing would still require unresolved product judgment

The shell should prefer these narrowing moves where appropriate:

- internal-only before external or client-facing
- project/event/context-scoped before org-wide or global
- single-item or single-workflow before multi-item or cross-context
- read-only before writable
- suggestion-only before direct-edit
- snapshot generation before live dependency, freshness, or sync systems
- existing route integration before new product surfaces
- single workflow slice before broad subsystem rollout
- minimal structured metadata before full workflow/state engines
- minimal review state before broad collaboration logic
- additive schema before risky migration-heavy redesign
- one default operational mode before configurable multi-mode systems

For each narrowing attempt, the shell must ask:

- Is this slice still grounded in the PRD and roadmap?
- Does this avoid inventing a broad new system?
- Does this preserve existing source-of-truth boundaries?
- Can this slice be validated with current codebase and safe environment constraints?
- Is this narrower than the previous attempt while still meaningful?

The shell must record in the expansion log:

- the original broader package intent
- the narrower slice chosen
- what additional capabilities were deferred by narrowing
- why the final slice was the first safe executable level

The shell should stop only when even the most minimal plausible slice would still require choosing unresolved product direction, permissions, architecture, environment posture, or unsafe migration behavior.

---

## Foundation package default narrowing patterns

When a package describes a large new subsystem or foundation layer, the shell should prefer these default narrowing patterns unless the PRD or package clearly requires something broader now:

- first prefer an **internal-only** slice
- first prefer a **single-context** slice over org-wide or global rollout
- first prefer **read-only** or **minimally writable** behavior
- first prefer **suggestion-only** over direct edit when collaboration boundaries are unresolved
- first prefer **snapshot generation** over live freshness/dependency engines
- first prefer **existing route integration** over entirely new product surfaces
- first prefer **structured data foundation** over richer UI/platform behavior
- first prefer **single-source-of-truth preservation** over dual editable systems
- first prefer **minimal review state** over full workflow engines
- first prefer **one small proof-of-foundation** over a broad full-featured subsystem

These patterns are not permission to invent product direction. They are defaults for finding the smallest safe slice when the package is broad but still grounded.

---

## Expansion stop conditions

Stop package expansion and record `needs_review` or equivalent if any of the following are true:

- the PRD, roadmap, audit, and prior logs do not provide enough grounding even after narrowing attempts
- the package requires a meaningful product decision that is not resolved in the source documents
- the package would require a broad schema or architecture decision that cannot be safely narrowed
- the package would require touching protected systems without a safe migration plan
- the package cannot be reduced to a thin executable slice even after iterative self-narrowing

When this happens:

- do not execute the package
- do not silently leave it half-rewritten
- use the structured escalation model if user input is truly required

---

## Package execution after expansion

If the package was expanded responsibly, then:

- update `EXECUTION_PACKAGES.md`
- create an expansion log
- return automatically to the main executor
- execute that package immediately in the same run when allowed by workflow
- stay strictly within the expanded package scope
- self-correct within package scope before stopping
- run required checks and regression checks
- perform normal package closeout if the package completes
- continue to the next package if the active workflow permits it and the current package completes honestly

### Important rule

The shell must not require:

- manual log deletion
- manual reprompting just to reconnect executor and expander
- manual phase correction after successful narrowing

The expander must hand the package back automatically.

---

## Expansion log requirements

Whenever a draft package is expanded, create a package expansion log.

The expansion log must record:

- why the package was expandable now
- what PRD, roadmap, audit, run-log, and codebase evidence was used
- why the chosen scope is narrow and safe
- what was explicitly deferred
- whether a narrowing rewrite was required
- whether iterative self-narrowing was required
- whether the package was expanded successfully
- whether the repo was ready to execute it immediately
- whether control should return to the executor automatically

---

## Relationship to execution behavior

This protocol changes agent behavior from:

- “stop at draft packages”

to:

- “attempt to responsibly expand the next draft package, narrow it aggressively if needed, return it automatically to the executor, and execute it if it can be done safely”

This protocol does **not** permit free-form product design.

It permits **disciplined next-package expansion** only.

---

## Relationship to resume and escalation behavior

This protocol must remain aligned with:

- `shell/reusable/REUSABLE_SHELL_RESUME_CONTRACT.md`
- `shell/reusable/REUSABLE_SHELL_ESCALATION_TEMPLATE.md`
- `shell/reusable/REUSABLE_SHELL_WORKFLOW.md`
- `shell/reusable/REUSABLE_SHELL_PROMPTS.md`

The expansion stage is not a terminal side road.

It is a bounded stage that must either:

- return control to the executor
- or raise a structured escalation if true unresolved ambiguity remains

---

## Final rule

Expand narrowly.  
Narrow again if needed.  
Return control automatically.  
Execute narrowly.  
Close out cleanly.  
Stop honestly only when truly necessary.