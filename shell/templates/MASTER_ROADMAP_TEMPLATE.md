# MASTER_ROADMAP_TEMPLATE

## Purpose

This document is the master strategic roadmap for transforming the current project from its audited current state into the product defined in `PRD_SOURCE.md`.

It is intentionally high-level.

It is not:

- a ticket list
- a technical spec
- a package-by-package execution plan

Its purpose is to define:

- the major chapters of work
- their dependency order
- the product-development spine
- the strategic sequencing logic that should guide all later implementation

This roadmap should be used together with:

- `PRD_SOURCE.md`
- `CURRENT_STATE_AUDIT.md`
- `shell/control/AGENT_OPERATING_RULES.md`
- `EXECUTION_PACKAGES.md` once created

---

## Roadmap generation rules

1. This roadmap must be grounded in both:
   - the normalized PRD
   - the actual current-state audit
2. It must not simply restate the PRD as if the product were already built.
3. It must not simply restate the audit as if no product transformation were needed.
4. It must express a strategic path from current state to intended state.
5. It must define major chapters, not tiny tasks.
6. It must be sequence-aware.
7. It must make dependency logic explicit.
8. It must identify what should be:
   - preserved
   - elevated
   - resolved
   - deferred
9. It must be useful for generating `EXECUTION_PACKAGES.md` later.
10. **PRD coverage accounting:** every **material** PRD requirement must be accounted for in this roadmap as **chaptered work**, **explicit deferment**, **explicit out-of-scope**, or **ambiguity requiring clarification**—not silently skipped. Align with `REUSABLE_SHELL_WORKFLOW.md` — PRD coverage accounting.

---

## How to use this template

When generating `MASTER_ROADMAP.md`:

- start from the product identity and implementation bias in `PRD_SOURCE.md`
- compare that to the real current-state posture in `CURRENT_STATE_AUDIT.md`
- identify the minimum strategic transformation path
- organize that transformation into major logical chapters
- make chapter ordering explicit
- explain why each chapter belongs where it does
- avoid fake certainty when the product direction is still intentionally bounded or phased

The roadmap should be strategic enough to guide package generation, but specific enough that later execution packaging is straightforward.

---

# Document structure

## Document purpose

This document is the master strategic roadmap for transforming the current codebase or project state into the product defined in `PRD_SOURCE.md`.

It is intentionally high-level.

It is not a ticket list, not a technical spec, and not a package-by-package execution plan. Its purpose is to define the major chapters of work, their dependency order, and the product-development spine that should guide future implementation.

This roadmap should be used together with:

- `PRD_SOURCE.md`
- `CURRENT_STATE_AUDIT.md`
- `shell/control/AGENT_OPERATING_RULES.md`
- `EXECUTION_PACKAGES.md` once created

---

# MR-01 — Roadmap objective

## Objective

The objective of this roadmap is to move the project from its current state as described in `CURRENT_STATE_AUDIT.md` into the coherent product or system defined in `PRD_SOURCE.md`.

This transformation must happen in an order that protects:

- architectural integrity
- data safety
- tenant or role safety where relevant
- product clarity
- implementation efficiency
- long-term viability

## Transformation summary
[Short plain-language summary of the transformation being attempted.]

---

# MR-02 — Current-state strategic reading

## What the current codebase or system already has

List the useful structural seeds or working assets that should be treated as valuable starting points.

- [Existing asset 1]
- [Existing asset 2]
- [Existing asset 3]

These should be treated as starting assets, not thrown away casually.

## What the current codebase or system does not yet have in a complete way

List the foundational areas that are still missing, weak, or underdeveloped.

- [Gap 1]
- [Gap 2]
- [Gap 3]

## Strategic conclusion

The project should not be expanded by adding features in whatever order seems convenient.

It should be deliberately reshaped around the intended product spine defined by the PRD.

---

# MR-03 — Canonical product spine

## Canonical product spine

The roadmap assumes the following canonical product spine:

`[Core hierarchy or product spine here]`

Examples:
- Organization → Client → Event → Guide → Derived systems
- Workspace → Record → Review → Published view
- Project → Item → Execution state → Derived outputs

This is the core model that future implementation should reinforce.

## Product meaning of this spine

### [Core unit 1]
[Meaning]

### [Core unit 2]
[Meaning]

### [Core unit 3]
[Meaning]

### [Core unit 4]
[Meaning]

## Roadmap rule

Any future system that weakens this spine should be treated with suspicion.

---

# MR-04 — Roadmap sequencing philosophy

The roadmap should follow a small set of strategic sequencing principles.

### RP-01 — [Principle title]
[Explanation]

### RP-02 — [Principle title]
[Explanation]

### RP-03 — [Principle title]
[Explanation]

### RP-04 — [Principle title]
[Explanation]

Examples of sequencing principles:
- fix the foundation before scaling the product
- establish domain boundaries before layering modules
- make the core operational surface real before adding peripheral systems
- add AI and advanced automation late, not early

---

# MR-05 — Major roadmap chapters

The roadmap is organized into major chapters.

Use as many chapters as the project actually needs.
Ten chapters is not required.
Five chapters is not too few if the project is small.
The chapter structure should fit the real transformation path.

### Recommended chapter list
1. [Chapter 1 title]
2. [Chapter 2 title]
3. [Chapter 3 title]
4. [Chapter 4 title]
5. [Chapter 5 title]
6. [Optional chapter 6]
7. [Optional chapter 7]
8. [Optional chapter 8]
9. [Optional chapter 9]
10. [Optional chapter 10]

These chapters should be sequential in logic, even where some practical overlap may occur.

---

# MR-06 — Chapter 1: [Chapter title]

## Purpose
[What this chapter is for.]

## Why this chapter comes first
[Why this chapter belongs here in sequence.]

## Primary outcomes
- [Outcome 1]
- [Outcome 2]
- [Outcome 3]

## Success condition
[What must be true when this chapter is meaningfully in place.]

---

# MR-07 — Chapter 2: [Chapter title]

## Purpose
[What this chapter is for.]

## Why this chapter follows Chapter 1
[Why it belongs here in dependency order.]

## Primary outcomes
- [Outcome 1]
- [Outcome 2]
- [Outcome 3]

## Success condition
[What must be true when this chapter is meaningfully in place.]

---

# MR-08 — Chapter 3: [Chapter title]

## Purpose
[What this chapter is for.]

## Why this chapter follows earlier chapters
[Dependency and sequencing explanation.]

## Primary outcomes
- [Outcome 1]
- [Outcome 2]
- [Outcome 3]

## Success condition
[What must be true.]

---

# MR-09 — Chapter 4: [Chapter title]

## Purpose
[What this chapter is for.]

## Why this chapter follows earlier chapters
[Dependency and sequencing explanation.]

## Primary outcomes
- [Outcome 1]
- [Outcome 2]
- [Outcome 3]

## Success condition
[What must be true.]

---

# MR-10 — Chapter 5: [Chapter title]

## Purpose
[What this chapter is for.]

## Why this chapter is central or why it belongs here
[Sequencing explanation.]

## Primary outcomes
- [Outcome 1]
- [Outcome 2]
- [Outcome 3]

## Success condition
[What must be true.]

---

# MR-11 — Additional chapters as needed

Repeat the same pattern for the remaining chapters.

For each chapter, define:

- Purpose
- Why this chapter belongs at this point
- Primary outcomes
- Success condition

The generator should create as many chapter sections as the project meaningfully needs.

Do not create filler chapters only to match a fixed number.

---

# MR-12 — Dependency logic across chapters

## Required dependency sequence

For each chapter, describe what it depends on.

### [Chapter 1 title] depends on
[Nothing / starting chapter / prerequisite explanation]

### [Chapter 2 title] depends on
[Dependency explanation]

### [Chapter 3 title] depends on
[Dependency explanation]

### [Chapter 4 title] depends on
[Dependency explanation]

Repeat for all chapters.

## Rule

Dependency order should reflect strategic necessity, not just convenience.

This section should make it obvious why later execution packages must be sequenced the way they are.

---

# MR-13 — Systems to preserve, elevate, or resolve

## Preserve and elevate

List the existing systems, concepts, or assets that should generally be preserved and developed further.

- [System 1]
- [System 2]
- [System 3]

## Elevate substantially

List the systems that exist in partial form and need significant growth to match the PRD.

- [System 1]
- [System 2]
- [System 3]

## Resolve explicitly

List the systems that should not remain permanently ambiguous.

Examples:
- parallel legacy vs target systems
- duplicate sources of truth
- route or mode ambiguity
- conflicting data models
- inactive schema-only entities

- [Ambiguous system 1]
- [Ambiguous system 2]
- [Ambiguous system 3]

---

# MR-14 — What the roadmap is trying to avoid

This roadmap should explicitly state what kinds of mistakes it is trying to prevent.

### Avoidance target 1 — [Title]
[Explanation]

### Avoidance target 2 — [Title]
[Explanation]

### Avoidance target 3 — [Title]
[Explanation]

### Avoidance target 4 — [Title]
[Explanation]

Common examples:
- generic admin sprawl
- duplicate systems of record
- premature AI dependence
- feature-first disorder
- unsafe autonomous implementation

Only include the avoidance targets that actually matter for this project.

---

# MR-15 — Recommended strategic order of execution

At the chapter level, the recommended order is:

1. [Chapter 1]
2. [Chapter 2]
3. [Chapter 3]
4. [Chapter 4]
5. [Chapter 5]
6. [Optional chapter 6]
7. [Optional chapter 7]

This order should be treated as the default strategic sequence unless a human explicitly decides otherwise.

---

# MR-16 — How this roadmap should be used

## For humans

Use this document to keep the overall transformation direction clear.

It should answer:

- what comes next in the big picture
- why that chapter comes next
- what that chapter is trying to accomplish
- how the product is supposed to evolve over time

## For agents

Agents should not use this file alone for execution.

Agents should use:

- `MASTER_ROADMAP.md` for strategic context
- `EXECUTION_PACKAGES.md` for actual actionable package sequencing
- `shell/control/AGENT_OPERATING_RULES.md` for behavior and safety
- `PRD_SOURCE.md` for product-truth decisions
- `CURRENT_STATE_AUDIT.md` for reality constraints

---

# MR-17 — Near-term implementation implication

The next actionable translation of this roadmap is the creation of `EXECUTION_PACKAGES.md`.

That file should break the roadmap into bounded work packages with:

- package IDs
- purpose
- dependencies
- scope
- out-of-scope boundaries
- likely files involved
- sensitive systems
- required checks
- regression checks
- definition of done
- completion evidence expectations

`EXECUTION_PACKAGES.md` is the file that should drive actual package-by-package execution.

---

# MR-18 — Quick chapter reference

## Chapter order
1. [Chapter 1]
2. [Chapter 2]
3. [Chapter 3]
4. [Chapter 4]
5. [Chapter 5]

Add more only if needed.

## Core recurring product themes
- [Theme 1]
- [Theme 2]
- [Theme 3]
- [Theme 4]

## Most important strategic rule
[One strongest strategic rule the roadmap wants future execution to preserve.]

---

# MR-19 — Final summary

[Project name] may already contain useful structural beginnings, but it is still in a transitional state relative to the intended product.

The correct transformation path is not simply “keep adding features.”

It is:

- [Strategic move 1]
- [Strategic move 2]
- [Strategic move 3]
- [Strategic move 4]

This document defines that strategic path.

The execution details should now be expressed in `EXECUTION_PACKAGES.md`.

---

## Appendix A — Source grounding note

This roadmap was generated from:

- `PRD_SOURCE.md`
- `CURRENT_STATE_AUDIT.md`

It should remain grounded in both.

If either changes materially, the roadmap should be re-evaluated.

---

## Minimal completion checklist for generated MASTER_ROADMAP.md

A generated `MASTER_ROADMAP.md` should be considered good enough when:

- the transformation objective is clear
- the canonical product spine is clear
- the major strategic chapters are defined
- chapter ordering and dependency logic are explicit
- preserve/elevate/resolve guidance is explicit
- the roadmap identifies what kinds of mistakes it is trying to avoid
- the document is useful for generating `EXECUTION_PACKAGES.md`

---

## Final note

A good roadmap should make it easy for later shell phases to answer:

- what is the real transformation path?
- what foundational work must come first?
- what should be protected while the system evolves?
- what chapters logically come next?
- what should execution packaging turn into concrete packages?

That is the purpose of this template.