# EXECUTION_PACKAGES_TEMPLATE

## Purpose

This document converts `MASTER_ROADMAP.md` into bounded execution packages that an autonomous or semi-autonomous shell can follow.

This file is intentionally more operational than the master roadmap.

It defines:

- package IDs
- package dependency order
- package purpose
- package scope and out-of-scope boundaries
- likely code areas involved
- sensitive systems
- required checks
- regression checks
- definition of done
- completion evidence expectations
- package-level safety expectations

It does not attempt to fully specify every implementation detail.

Packages may begin as:
- `ready`
- `draft`
- `blocked`
- or another allowed status

Draft packages may be expanded by the shell one at a time through `shell/control/PACKAGE_EXPANSION_PROTOCOL.md` as needed during execution.

This file should be used together with:

- `PRD_SOURCE.md`
- `CURRENT_STATE_AUDIT.md`
- `MASTER_ROADMAP.md`
- `shell/control/AGENT_OPERATING_RULES.md`
- `shell/control/PACKAGE_EXPANSION_PROTOCOL.md`
- `shell/control/RUN_LOG_TEMPLATE.md`

---

## Draft package execution note

Packages marked `draft`, `not executable`, `not expanded`, or equivalent must not be executed directly.

When the next package in sequence is draft, the shell must use `shell/control/PACKAGE_EXPANSION_PROTOCOL.md` to determine whether that single package can be safely expanded into executable form.

Only after that expansion may the package be executed.

When possible, the shell should prefer rewriting the next draft package into the thinnest safe executable slice rather than stopping immediately on breadth or ambiguity.

---

## PRD coverage accounting

**Material** PRD and roadmap commitments must **not** be silently omitted from this document. Each must be **traceable** here into **package scope** (a package commits to it or a later draft clearly will), **intentional deferment** (with rationale and PRD anchors), **explicit out-of-scope**, or **ambiguous / needs clarification**—per `REUSABLE_SHELL_WORKFLOW.md` — PRD coverage accounting. (Whether work is **implemented** is judged at final audit.)

---

# EP-00 — Global execution model

## Package status values

Allowed package statuses:

- `draft`
- `ready`
- `in_progress`
- `blocked`
- `needs_review`
- `complete`

## Default package rule

The shell may begin only packages marked `ready`, unless:

- it is actively expanding the next draft package through the package expansion protocol, or
- a human explicitly instructs otherwise

## Required package process

For every package, the shell must:

1. confirm the package is ready, or expand it first if it is draft
2. confirm dependencies are satisfied
3. confirm environment safety
4. inspect likely files and systems involved
5. inspect relevant PRD section IDs
6. inspect relevant audit and roadmap anchors
7. perform scoped implementation only
8. run required checks
9. fix failing checks before continuing where in scope
10. run regression checks
11. write package completion log with evidence
12. perform package closeout if changes were made
13. commit the completed package when appropriate
14. update package status honestly
15. ensure the tree is clean before moving to the next completed package

## Default evidence rule

No package may be marked complete without recorded evidence of:

- required checks
- regression checks
- completion outcome
- closeout outcome where repo changes were made

---

# EP-01 — Package template schema

Every package in this file should follow this structure:

- Package ID
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

---

# EP-02 — Package grouping rule

Packages should be grouped into logical roadmap-aligned groups.

Examples:
- Package group A: Runtime safety and environment setup
- Package group B: Foundation reset
- Package group C: Core domain alignment
- Package group D: Core product spine
- Package group E: Collaboration or expansion systems
- Package group F: Hardening-adjacent late product work

The exact groups should fit the actual roadmap.

Do not force an artificial grouping structure if the roadmap is smaller or simpler.

---

# EP-03 — Package sizing rule

Execution packages should be:

- narrow enough to execute safely
- broad enough to matter
- sequence-correct
- validation-aware
- realistic for autonomous completion

Avoid packages that are:

- too tiny to be meaningful
- too broad to execute safely
- dependent on unresolved product invention
- secretly multiple packages hiding inside one heading

A good package should usually represent:

- one safe transformation slice
- one bounded foundational step
- one meaningful operational feature slice
- or one hardening-grade structural correction

---

# EP-04 — Package generation rule

When generating `EXECUTION_PACKAGES.md`, the shell should derive packages from:

1. `PRD_SOURCE.md`
2. `CURRENT_STATE_AUDIT.md`
3. `MASTER_ROADMAP.md`

Packages should be designed to:

- reinforce the roadmap’s chapter order
- respect actual current-state constraints
- preserve useful existing assets where appropriate
- resolve the most important risks in the right order
- avoid premature externalization or overbuild
- make later package expansion safe and grounded

---

# EP-05 — Package dependency rule

Each package must declare explicit dependencies.

Dependencies should reflect:

- foundational sequencing
- domain prerequisites
- environment prerequisites
- product-surface readiness
- source-of-truth stabilization needs

Packages should not depend on future speculative work.

If a package’s dependency is not satisfied, that package should not be marked `ready`.

---

# EP-06 — Package readiness rule

A package should generally be marked `ready` when:

- its dependencies are complete or otherwise sufficiently satisfied
- the current roadmap stage makes it timely
- the package is narrow enough to execute directly
- no major unresolved product judgment blocks execution

A package should generally be marked `draft` when:

- it is strategically next but not yet thin enough
- its first safe executable slice still needs narrowing
- the chapter direction is clear but the exact first implementation slice is not yet packaged tightly enough

A package should generally be marked `blocked` or `needs_review` when:

- true unresolved product judgment remains
- protected-data risk is too high
- safe execution depends on missing external decisions or conditions

---

# EP-07 — Package authoring guidance

When writing packages:

- keep purpose concise but real
- make “Why now” sequencing-aware
- make scope concrete
- keep out-of-scope explicit
- identify sensitive systems honestly
- define required checks that are actually relevant
- define regression checks that protect previously completed work
- make definition of done testable
- make completion evidence observable

Avoid vague package language like:
- “improve system”
- “clean up architecture”
- “make ready”
- “support future needs”

without bounded meaning.

---

# EP-08 — Package template

Use the following structure for each package.

---

## WP-x.y — [Package title]

**Status:** [draft / ready / in_progress / blocked / needs_review / complete]  
**Priority:** [critical / high / medium / low]  
**Depends on:** [package IDs or none]  
**Blocks:** [package IDs, roadmap areas, or none]  
**Human approval required:** [yes / no / conditional]  
**Data migration involved:** [no / yes / possible / safe-dev only / unclear]

### Purpose

[What this package exists to accomplish.]

### Why now

[Why this package belongs at this point in the sequence.]

### PRD anchors
- [PRD section ID]
- [PRD section ID]
- [PRD section ID]

### Current-state anchors
- [Audit section]
- [Audit section]
- [Audit section]

### Scope
- [In-scope item 1]
- [In-scope item 2]
- [In-scope item 3]

### Out of scope
- [Out-of-scope item 1]
- [Out-of-scope item 2]
- [Out-of-scope item 3]

### Preconditions
- [Precondition 1]
- [Precondition 2]

### Likely files / systems involved
- [File or system 1]
- [File or system 2]
- [File or system 3]

### Sensitive systems
- [Sensitive system 1]
- [Sensitive system 2]

### Allowed actions
- [Allowed action 1]
- [Allowed action 2]
- [Allowed action 3]

### Forbidden actions
- [Forbidden action 1]
- [Forbidden action 2]
- [Forbidden action 3]

### Required checks
- [Required check 1]
- [Required check 2]
- [Required check 3]

### Regression checks
- [Regression check 1]
- [Regression check 2]
- [Regression check 3]

### Definition of done

[What must be true for the package to count as complete.]

### Completion evidence
- [Evidence item 1]
- [Evidence item 2]
- [Evidence item 3]

### Notes for future package expansion

[What future packages may extend, or what later expansion should remember.]

---

# EP-09 — Safety and closeout expectation for every package

Every package implicitly carries the following expectations:

- environment safety must be confirmed before backend-affecting work
- package scope must be respected
- required checks must run
- regression checks must run
- meaningful work must be logged
- package closeout must be performed after completed work
- recurring generated drift must be handled
- completed package work should be committed
- the tree should be clean before continuing

These do not need to be repeated in every package unless the package has special deviations.

---

# EP-10 — Suggested package group preface format

Before each major package group, use a small preface like this:

---

## Package group [letter]: [Group title]

[One short paragraph explaining what this package group is for and why it comes here in the sequence.]

---

This helps later readers understand the package file as a strategic execution system, not just a long list.

---

# EP-11 — Suggested package progression pattern

A typical well-formed package file often begins with:

1. execution safety / runtime setup
2. environment / protected-data safeguards
3. foundation reset
4. core data/domain alignment
5. core operational spine
6. planning / workflow systems
7. collaboration / external-facing layers
8. supporting operational modules
9. advanced platform layers
10. late hardening-adjacent feature slices

This is not mandatory.
It should only be used when it matches the roadmap.

---

# EP-12 — Expansion-friendly authoring rule

Packages that are intentionally not yet executable should still be written in a way that makes later narrowing possible.

That means even draft packages should still include:

- purpose
- why now
- PRD anchors
- current-state anchors
- intended scope direction
- likely files/systems
- obvious out-of-scope boundaries

A draft package should not be empty.

It should be strategically shaped but operationally underdefined.

---

# EP-13 — Package file completion checklist

A generated `EXECUTION_PACKAGES.md` should be considered good enough when:

- roadmap chapters are translated into a real package sequence
- package dependencies are explicit
- early foundational packages are actionable
- later broader packages are packaged honestly as draft where needed
- each package has meaningful scope and boundaries
- sensitive systems are identified
- required checks and regression checks are present
- the file is usable by the shell without needing major reinterpretation

---

# EP-14 — Final note

A good `EXECUTION_PACKAGES.md` should make it easy for later shell phases to answer:

- what is the next safe unit of work?
- what depends on what?
- what is ready now?
- what still needs expansion?
- what systems are sensitive?
- what evidence is required to call a package complete?

That is the purpose of this template.