# POST_EXECUTION_HARDENING_TASKS_TEMPLATE

## Purpose

This document turns `POST_EXECUTION_HARDENING_PLAN.md` into a concrete, ordered hardening task list for the completed execution-package program.

It is intentionally:

- post-execution hardening only
- not a new feature roadmap
- not a new execution-package program
- not a disguised product expansion plan

This document should make hardening executable in a disciplined, reviewable way.

---

## Hardening task rules

1. Every task below must strengthen, clarify, or stabilize what was already built.
2. No task in this document should introduce broad new product behavior.
3. If a proposed task is secretly feature work, it does not belong here.
4. Tasks should be grouped by hardening workstream from `POST_EXECUTION_HARDENING_PLAN.md`.
5. Tasks should be ordered intentionally.
6. The ordering should reflect risk reduction and execution safety.
7. The task list should support automatic pass-by-pass continuation later.
8. This document should feed directly into actual hardening execution.

---

## How to use this template

When generating `POST_EXECUTION_HARDENING_TASKS.md`:

- start from `POST_EXECUTION_HARDENING_PLAN.md`
- convert each hardening workstream into actionable tasks
- define task order both:
  - across workstreams
  - and within each workstream
- explain why the order matters
- identify safest / highest-value first tasks
- define exit conditions for each workstream
- identify useful phase checkpoints
- preserve the distinction between:
  - documentation-only work
  - code cleanup
  - backend hardening
  - tooling/CI
  - environment/readiness clarification

This document should make it easy for the shell or a human reviewer to understand exactly how the hardening phase should progress.

---

# Document structure

## Purpose

This document turns `POST_EXECUTION_HARDENING_PLAN.md` into a concrete, ordered hardening task list for the completed execution-package program.

It is intentionally:

- post-execution hardening only
- not a new feature roadmap
- not a new package program
- not implementation work outside the hardening phase

---

## Hardening execution principles

Every task below should be evaluated against the same rule:

- does this strengthen, clarify, or stabilize what was already built?
- or does it introduce new product behavior?

If it introduces new product behavior, it does not belong in this phase.

---

## Task type legend

Use task types that fit the actual project.

Typical examples:

- `documentation-only`
- `code cleanup`
- `backend hardening`
- `tooling/CI`
- `environment/readiness documentation`
- `validation hardening`
- `consistency cleanup`

Only use types that are actually useful for the project.

---

## Recommended execution order

List the workstreams in the recommended order they should be executed.

### Recommended order of workstreams
1. `[H-1 Workstream title]`
2. `[H-2 Workstream title]`
3. `[H-3 Workstream title]`
4. `[H-4 Workstream title]`
5. `[H-5 Workstream title]`

Add more only if needed.

### Why this order
Explain why the hardening workstreams are ordered this way.

Typical reasons may include:

- safest/highest-truth work first
- environment caveats before deeper cleanup
- validation baseline before broader code cleanup
- type cleanup after stronger validation posture
- consistency and legacy cleanup later

This section should make the ordering logic explicit.

---

## Safest / highest-value first tasks

List the recommended first tasks across the whole phase.

These should usually be the tasks that:

- reduce ambiguity
- reduce audit risk
- strengthen validation
- improve safety for later hardening work
- do not risk behavior drift

### Recommended first tasks
1. [Task]
   - **Type:** `[task type]`
   - **Value:** [why it matters]

2. [Task]
   - **Type:** `[task type]`
   - **Value:** [why it matters]

3. [Task]
   - **Type:** `[task type]`
   - **Value:** [why it matters]

---

# Ordered hardening task list by workstream

Use the following pattern for each workstream.

---

## H-1 — [Workstream title]

### Objective

[Short objective of this workstream.]

### Tasks

#### H-1.1 [Task title]
- **Type:** `[task type]`
- **Priority:** `[highest / high / medium / low]`
- **Recommended order:** `[first / second / third / etc.]`
- **Task:**
  - [task step 1]
  - [task step 2]
  - [task step 3]
- **Expected output:**
  - [output 1]
  - [output 2]

#### H-1.2 [Task title]
- **Type:** `[task type]`
- **Priority:** `[highest / high / medium / low]`
- **Recommended order:** `[first / second / third / etc.]`
- **Task:**
  - [task step 1]
  - [task step 2]
  - [task step 3]
- **Expected output:**
  - [output 1]
  - [output 2]

#### H-1.3 [Task title]
- **Type:** `[task type]`
- **Priority:** `[highest / high / medium / low]`
- **Recommended order:** `[first / second / third / etc.]`
- **Task:**
  - [task step 1]
  - [task step 2]
  - [task step 3]
- **Expected output:**
  - [output 1]
  - [output 2]

### Exit condition

[What must be true for this workstream to count as complete enough.]

---

## H-2 — [Workstream title]

### Objective

[Short objective of this workstream.]

### Tasks

#### H-2.1 [Task title]
- **Type:** `[task type]`
- **Priority:** `[highest / high / medium / low]`
- **Recommended order:** `[first / second / third / etc.]`
- **Task:**
  - [task step 1]
  - [task step 2]
  - [task step 3]
- **Expected output:**
  - [output 1]
  - [output 2]

#### H-2.2 [Task title]
- **Type:** `[task type]`
- **Priority:** `[highest / high / medium / low]`
- **Recommended order:** `[first / second / third / etc.]`
- **Task:**
  - [task step 1]
  - [task step 2]
  - [task step 3]
- **Expected output:**
  - [output 1]
  - [output 2]

#### H-2.3 [Task title]
- **Type:** `[task type]`
- **Priority:** `[highest / high / medium / low]`
- **Recommended order:** `[first / second / third / etc.]`
- **Task:**
  - [task step 1]
  - [task step 2]
  - [task step 3]
- **Expected output:**
  - [output 1]
  - [output 2]

### Exit condition

[What must be true.]

---

## H-3 — [Workstream title]

### Objective

[Short objective of this workstream.]

### Tasks

#### H-3.1 [Task title]
- **Type:** `[task type]`
- **Priority:** `[highest / high / medium / low]`
- **Recommended order:** `[first / second / third / etc.]`
- **Task:**
  - [task step 1]
  - [task step 2]
  - [task step 3]
- **Expected output:**
  - [output 1]
  - [output 2]

#### H-3.2 [Task title]
- **Type:** `[task type]`
- **Priority:** `[highest / high / medium / low]`
- **Recommended order:** `[first / second / third / etc.]`
- **Task:**
  - [task step 1]
  - [task step 2]
  - [task step 3]
- **Expected output:**
  - [output 1]
  - [output 2]

#### H-3.3 [Task title]
- **Type:** `[task type]`
- **Priority:** `[highest / high / medium / low]`
- **Recommended order:** `[first / second / third / etc.]`
- **Task:**
  - [task step 1]
  - [task step 2]
  - [task step 3]
- **Expected output:**
  - [output 1]
  - [output 2]

### Exit condition

[What must be true.]

---

## Additional workstreams as needed

Repeat the same pattern for all remaining hardening workstreams.

Only include as many workstreams and tasks as the project actually needs.

Do not create filler tasks to make the plan look more complete than it is.

---

## Suggested phase checkpoints

Use checkpoints to organize the hardening phase into meaningful stages.

### Checkpoint A — [Checkpoint title]

Complete first:

- [Task range 1]
- [Task range 2]

### Reason
[Why this checkpoint comes first.]

---

### Checkpoint B — [Checkpoint title]

Complete next:

- [Task range 1]
- [Task range 2]

### Reason
[Why this checkpoint belongs next.]

---

### Checkpoint C — [Checkpoint title]

Complete next:

- [Task range 1]
- [Task range 2]

### Reason
[Why this checkpoint belongs here.]

Add more checkpoints only if they actually improve execution clarity.

---

## Hardening pass execution note

If the project intends to execute hardening in ordered passes, this document should be compatible with that flow.

### Pass progression rule

Hardening should be executable:

- one pass at a time
- in the recommended order
- with automatic continuation from one completed pass to the next

unless:

- a real blocker occurs
- validation fails and cannot be repaired in scope
- or the user explicitly chooses Stop through structured escalation

This task list should therefore be written clearly enough that it can support pass-based execution.

---

## Recommended final outputs from the hardening phase

By the end of this hardening phase, the project should have:

- [Output 1]
- [Output 2]
- [Output 3]
- [Output 4]

Examples:
- reconciled evidence posture
- clearer environment-readiness explanation
- stronger validation repeatability
- reduced type fragility
- more coherent shell or route framing
- clearer legacy containment

Only include outputs that actually match the hardening plan.

---

## Reuse / packaging inputs to preserve during hardening

The hardening phase should preserve and clarify the following because they are likely reusable process or product primitives:

- [Reusable input 1]
- [Reusable input 2]
- [Reusable input 3]
- [Reusable input 4]

Only include inputs that actually matter for later reuse or packaging.

---

## Final recommendation

State the recommended execution posture for the hardening phase.

A common pattern is:

Do **not** start with broad cleanup.

Start with:

1. [highest-truth / highest-safety work]
2. [environment/readiness clarification]
3. [validation/tooling hardening]

Then move into:

4. [type or structural cleanup]
5. [consistency cleanup]
6. [legacy/transitional cleanup]

That sequence gives the highest confidence return with the least risk of turning hardening into untracked product work.

Adjust this to fit the actual project.

---

## Appendix A — Inputs used for this task list

This task list should be generated from:

- `POST_EXECUTION_HARDENING_PLAN.md`
- `FINAL_EXECUTION_AUDIT.md`
- relevant closeout or caveat docs if present
- final repo/worktree state where relevant

List the actual inputs used.

- [Input 1]
- [Input 2]
- [Input 3]

---

## Minimal completion checklist for generated POST_EXECUTION_HARDENING_TASKS.md

A generated `POST_EXECUTION_HARDENING_TASKS.md` should be considered good enough when:

- hardening workstreams are turned into concrete tasks
- task ordering is explicit
- the ordering logic is explained
- safest/highest-value first tasks are identified
- workstream exit conditions are defined
- phase checkpoints are useful
- the task list is compatible with pass-based hardening execution
- the document is actionable without turning into feature work

---

## Final note

A good hardening task list should make it easy for later shell phases to answer:

- what exactly should be done in the hardening phase?
- in what order?
- why that order?
- what should happen before broader cleanup?
- what counts as enough for each workstream?
- what should the shell execute pass by pass?

That is the purpose of this template.