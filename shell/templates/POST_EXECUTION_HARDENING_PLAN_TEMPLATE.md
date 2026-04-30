# POST_EXECUTION_HARDENING_PLAN_TEMPLATE

## Purpose

This document defines the first post-execution phase after completion of the execution-package program.

Its purpose is to harden, clean up, and normalize the delivered project **without starting a new feature wave**.

This phase exists to:

- close evidence and validation gaps left by the package program
- reduce technical debt introduced during package-by-package delivery
- improve reliability, consistency, and maintainability
- separate code-complete from environment-complete concerns where relevant
- prepare the project for later reuse, handoff, or packaging

This phase is intentionally **not** a continuation of roadmap feature expansion.

---

## Hardening-plan rules

1. This phase is for hardening, cleanup, validation, evidence normalization, and consistency.
2. This phase is not for broad new features or stealth roadmap expansion.
3. Every proposed workstream should answer:
   - does this strengthen what was already built?
   - or is this secretly new product work?
4. If it is new product work, it does not belong in this phase.
5. The plan should stay grounded in:
   - `FINAL_EXECUTION_AUDIT.md`
   - execution logs
   - final repo state
   - known environment and validation caveats
6. The plan should define hardening workstreams, not tiny ad hoc tasks.
7. This plan should feed directly into `POST_EXECUTION_HARDENING_TASKS.md`.

---

## How to use this template

When generating `POST_EXECUTION_HARDENING_PLAN.md`:

- start from the conclusions in `FINAL_EXECUTION_AUDIT.md`
- identify the most important remaining non-feature work
- group that work into major hardening workstreams
- explain why each workstream matters now
- define scope and out-of-scope boundaries
- define what “done” means for each workstream
- preserve the distinction between:
  - evidence cleanup
  - environment/readiness clarification
  - technical hardening
  - consistency cleanup
  - legacy/transitional clarification

The result should be a strategic hardening plan, not yet the detailed ordered task list.

---

# Document structure

## Purpose

This document defines the first post-execution phase after completion of the execution-package program.

Its purpose is to harden, clean up, and normalize the delivered codebase or project state **without starting a new feature wave**.

---

## Why this phase exists now

The execution-package program has completed or substantially completed its planned package sequence.

The final execution audit identified remaining work in one or more of these categories:

1. **evidence consistency gaps**
2. **environment or readiness caveats**
3. **technical hardening opportunities**
4. **consistency and polish cleanup**
5. **legacy/transitional clarity work**
6. **validation/tooling hardening**

This hardening phase should happen **before**:

- major new product expansion
- external launch claims
- reusable packaging
- broader operational rollout

### Strategic reason
[Explain why hardening should happen now, based on the actual project.]

---

## Phase rule

This phase is for:

- cleanup
- hardening
- validation
- consistency
- evidence normalization
- readiness clarification

This phase is **not** for:

- broad new features
- new product modules
- speculative roadmap expansion
- redesigning the application again
- using cleanup as an excuse to sneak in new functionality

### Decision rule

Any change proposed in this phase must answer:

- does this strengthen what was already built?
- or is this secretly new product work?

If it is new product work, it does not belong in this phase.

---

## Recommended hardening workstreams

This section should define the major workstreams for the hardening phase.

Use as many workstreams as the project truly needs.
Do not force an arbitrary number.
Do not create fake workstreams to look thorough.

A typical hardening plan may include some subset of:

- evidence and closeout consistency
- environment/readiness clarification
- type-safety cleanup
- lint/tooling/CI hardening
- shell/route/UX consistency cleanup
- legacy/transitional containment cleanup
- validation baseline strengthening
- deployment/readiness clarification

---

## H-1 — [Workstream title]

### Goal
[What this workstream exists to accomplish.]

### Why this matters
[Why this issue matters now, based on the final audit and repo state.]

### Scope
- [Scope item 1]
- [Scope item 2]
- [Scope item 3]

### In scope
- [In-scope item 1]
- [In-scope item 2]
- [In-scope item 3]

### Out of scope
- [Out-of-scope item 1]
- [Out-of-scope item 2]
- [Out-of-scope item 3]

### Definition of done
[What must be true for this workstream to count as complete enough.]

---

## H-2 — [Workstream title]

### Goal
[What this workstream exists to accomplish.]

### Why this matters
[Why this issue matters now.]

### Scope
- [Scope item 1]
- [Scope item 2]
- [Scope item 3]

### In scope
- [In-scope item 1]
- [In-scope item 2]
- [In-scope item 3]

### Out of scope
- [Out-of-scope item 1]
- [Out-of-scope item 2]
- [Out-of-scope item 3]

### Definition of done
[What must be true.]

---

## H-3 — [Workstream title]

### Goal
[What this workstream exists to accomplish.]

### Why this matters
[Why this issue matters now.]

### Scope
- [Scope item 1]
- [Scope item 2]
- [Scope item 3]

### In scope
- [In-scope item 1]
- [In-scope item 2]
- [In-scope item 3]

### Out of scope
- [Out-of-scope item 1]
- [Out-of-scope item 2]
- [Out-of-scope item 3]

### Definition of done
[What must be true.]

---

## H-4 — [Workstream title]

### Goal
[What this workstream exists to accomplish.]

### Why this matters
[Why this issue matters now.]

### Scope
- [Scope item 1]
- [Scope item 2]
- [Scope item 3]

### In scope
- [In-scope item 1]
- [In-scope item 2]
- [In-scope item 3]

### Out of scope
- [Out-of-scope item 1]
- [Out-of-scope item 2]
- [Out-of-scope item 3]

### Definition of done
[What must be true.]

---

## Additional workstreams as needed

Repeat the same pattern for any further workstreams the project actually needs.

Only include workstreams that are grounded in the final audit or clear final-state evidence.

---

## Cross-cutting hardening rules

All hardening work in this phase must follow these rules:

1. **No disguised feature work**  
   Hardening is not a license to invent new product behavior.

2. **Prefer smallest coherent cleanup**  
   Do the smallest thing that reduces risk or improves clarity.

3. **Keep evidence truthful**  
   Do not clean up logs or package history dishonestly.

4. **Respect source-of-truth boundaries**  
   Do not create parallel editable systems.

5. **Protect canonical or sensitive data**  
   Environment/data parity work must remain cautious and explicit.

6. **Preserve delivered behavior**  
   Regression discipline still applies.

7. **Preserve sequence discipline**  
   Hardening should not reopen roadmap chapters casually.

---

## Validation expectations for this phase

Each hardening workstream should leave behind evidence.

At minimum, hardening work should verify as relevant:

- build validation
- backend validation if backend code changes
- key route load checks
- key query/action regression checks
- clean-tree closeout
- no protected-data drift
- no accidental broad behavior changes

Where useful, this phase should also improve the repeatability of those checks.

---

## Deliverables of this phase

This hardening phase should produce:

- cleaned and strengthened code or docs
- clearer evidence posture
- clarified environment/readiness caveats
- stronger validation/tooling posture where relevant
- more consistent project surfaces
- clearer legacy/transitional boundaries where relevant

It should also produce:

- a post-hardening closeout summary or equivalent
- inputs for later reuse, packaging, or handoff

---

## What this phase should feed into next

After this phase, the next major step should be:

[Describe the next phase.]

Examples:
- reusable-shell packaging
- launch-readiness evaluation
- environment-completion pass
- controlled externalization
- operational handoff

### Why this phase should happen before that next step
[Explain why hardening belongs before the next phase.]

---

## Suggested hardening-order philosophy

This section should explain the intended ordering logic for the hardening phase.

A common pattern is:

1. evidence normalization first
2. environment/readiness clarification second
3. validation/tooling hardening third
4. type-safety or structural cleanup after validation baseline strengthens
5. shell/UX consistency cleanup later
6. legacy/transitional cleanup last

The exact order should fit the actual project.

This section should prepare the way for the later hardening task list.

---

## Reuse / packaging inputs to preserve during hardening

If the project may later be reused, packaged, templated, or turned into a repeatable shell/process, identify what this hardening phase should preserve and clarify.

Examples:
- core runtime patterns
- shell prompts or workflow contracts
- closeout process
- validation baseline
- route resilience patterns
- access-control patterns
- truthful audit discipline

List only what actually matters for the project.

- [Reusable input 1]
- [Reusable input 2]
- [Reusable input 3]

---

## Final phase conclusion

This phase exists to strengthen and normalize what the execution-package program already delivered.

It should leave the project:

- cleaner
- more consistent
- better evidenced
- more stable
- easier to reuse, hand off, or package

It should not turn into a second hidden feature wave.

---

## Appendix A — Inputs used for this hardening plan

This plan should be generated from evidence such as:

- `FINAL_EXECUTION_AUDIT.md`
- `agent_runs/`
- current repo/worktree state
- validation findings
- closeout caveat docs if present
- environment/readiness gap docs if present

List the actual inputs used.

- [Input 1]
- [Input 2]
- [Input 3]

---

## Minimal completion checklist for generated POST_EXECUTION_HARDENING_PLAN.md

A generated `POST_EXECUTION_HARDENING_PLAN.md` should be considered good enough when:

- it is clearly post-execution and non-feature-focused
- the major hardening workstreams are explicit
- each workstream has a goal, why-now, scope, and definition of done
- cross-cutting hardening rules are clear
- validation expectations are defined
- the plan points cleanly toward the next hardening task list
- the phase’s role in overall closeout is clear

---

## Final note

A good hardening plan should make it easy for later shell phases to answer:

- what cleanup and hardening work is actually needed now?
- why does it matter now?
- what is in scope vs out of scope?
- what should happen before reuse or launch claims?
- what task list should be generated next?

That is the purpose of this template.