# STACK_SELECTION_REFERENCE

## Purpose

This file is a quick runtime reference for how the reusable autonomous shell must determine implementation stack and backend posture for a project.

It is a short operational reference.

It does not replace the fuller logic in:

- `shell/control/AGENT_RUNTIME_SETUP.md`
- `shell/control/AGENT_OPERATING_RULES.md`
- `PRD_SOURCE.md`
- `CURRENT_STATE_AUDIT.md`

Instead, it gives the shell one clear rule set for answering:

- what stack should this project use?
- what backend should this project use?
- when should the shell preserve an existing stack?
- when is it allowed to choose a default?
- how should that choice be recorded?

---

## Core rule

The shell must **not** hardcode a backend or framework assumption into every project.

The shell must infer implementation stack in this order:

1. from the project PRD
2. from the current codebase
3. from explicit runtime/project docs if present
4. only then, from the thinnest sensible default

This means:

- Convex is **not** a shell-wide default
- Next.js is **not** a shell-wide default
- any specific stack is project-specific unless clearly required

---

## Stack selection priority order

## 1. PRD comes first

If the source PRD explicitly defines the stack, framework, backend, or platform constraints, the shell should use that.

Examples:
- “Build this as a Next.js web app”
- “Use Python and Streamlit”
- “Use Supabase for backend/auth/storage”
- “This should be a CLI tool”
- “This should be docs-only”

### Rule
If the PRD clearly specifies the stack, the shell should not override it casually.

---

## 2. Existing codebase comes second

If the project already has a meaningful codebase, the shell should inspect the current implementation and preserve that stack unless the PRD explicitly demands a migration.

Examples:
- existing `package.json` and `app/` indicate Next.js
- existing backend modules indicate Convex or Supabase or Express
- existing Python package structure indicates a Python app
- existing mobile project structure indicates React Native / Expo / native stack

### Rule
The shell should preserve the current working stack by default.

It should not invent migrations just because another stack seems nicer.

---

## 3. Explicit runtime or project docs come third

If the PRD is vague, but project/runtime docs clearly define the intended stack, the shell may use those as the next-best source.

Examples:
- project README
- operator notes
- shell runtime docs specific to the project
- architecture docs already present in repo

### Rule
These docs can clarify a vague PRD, but they should not silently override a clear PRD.

---

## 4. Only then may the shell choose a default

If:

- the PRD does not specify the stack
- there is no meaningful existing codebase
- and no runtime/project docs define one

then the shell may choose the **thinnest sensible default stack** for the project type.

### Rule
This choice must be:

- minimal
- practical
- easy to validate
- easy to explain
- explicitly recorded in planning artifacts

The shell must not silently choose a stack and proceed as if it was always specified.

---

## Default stack selection rule

If the shell must choose a default, it should choose the narrowest sensible implementation for the actual project type.

### Examples

#### For a small internal web app
A thin web stack may be reasonable.

#### For a docs/process system
A docs-first structure may be enough.

#### For a CLI/data workflow
A small Python or Node CLI may be reasonable.

#### For a tiny CRUD proof
A minimal web app plus lightweight persistence may be enough.

### Important rule
The shell should choose the smallest stack that honestly supports the project, not the most ambitious or trendy one.

---

## Backend selection rule

Backend posture should follow the same logic as stack selection.

The shell must infer backend choice in this order:

1. PRD/backend constraints
2. current codebase
3. explicit project/runtime docs
4. thinnest sensible default if still unspecified

### This means

- Convex is only used when the project actually points to Convex
- Supabase is only used when the project actually points to Supabase
- local-only storage is valid when the project is small enough
- not every project needs a complex backend

---

## Convex-specific rule

Convex should be treated as a **project-specific backend**, not a shell assumption.

If Convex is needed, that should come from:

- the PRD or technical constraints
- the current codebase
- explicit project/runtime docs
- or later generated planning artifacts that record the choice explicitly

The shell must not assume:

- Convex project exists
- Convex environment exists
- Convex credentials exist
- Convex is the right backend for every project

---

## Next.js-specific rule

Next.js should be treated as a **project-specific frontend/runtime choice**, not a shell assumption.

If Next.js is needed, that should come from:

- the PRD
- the current codebase
- explicit project docs
- or a clearly recorded default-stack choice when no better signal exists

The shell must not silently assume every project should become a Next.js app.

---

## When stack choice must be recorded

If the stack is:

- inherited from the PRD
- inferred from the current codebase
- clarified by runtime/project docs
- or chosen as a default

the shell should record that in planning artifacts.

### Best places to record it

- `PRD_SOURCE.md`
- `CURRENT_STATE_AUDIT.md`
- `MASTER_ROADMAP.md` if strategically important
- `EXECUTION_PACKAGES.md` if it materially affects package sequencing

### Rule
A meaningful stack/backend choice should be visible in the planning record, not hidden in implementation behavior.

---

## When the shell must not decide alone

The shell should not choose a stack or backend alone if:

- the PRD clearly implies multiple materially different platform directions
- a migration would be required and the PRD does not authorize it
- backend choice has major cost, compliance, or deployment implications that are unresolved
- the system is high-risk enough that a default would be too speculative

In those cases, the shell should:

- preserve current assumptions if safely possible
- narrow the work to avoid premature architectural commitment
- or escalate structurally if the choice truly blocks progress

---

## Interaction with planning artifacts

## In `PRD_SOURCE.md`
Record:
- explicit stack requirements from the source PRD
- known technical constraints
- whether the stack is unspecified

## In `CURRENT_STATE_AUDIT.md`
Record:
- what stack/backend actually exists today
- what frameworks/services are actually present
- what is inferred vs confirmed

## In `MASTER_ROADMAP.md`
Record:
- architecture direction only if it matters strategically

## In `EXECUTION_PACKAGES.md`
Record:
- stack/backend implications only where they matter to a package’s scope or safety

---

## Practical examples

## Example 1 — Existing Next.js + Convex repo
- PRD does not request migration
- codebase is already Next.js + Convex

### Correct shell behavior
- preserve Next.js + Convex
- record that this stack is inherited from current codebase
- do not treat it as a shell default

---

## Example 2 — Tiny PRD for an internal tracker with no repo
- PRD asks for a tiny internal web app
- no stack specified
- no codebase exists

### Correct shell behavior
- choose a thin sensible web stack
- record that the stack was chosen because none was specified
- avoid overbuilding backend complexity unless needed

---

## Example 3 — PRD says Python CLI
- existing repo is empty
- PRD explicitly says Python CLI

### Correct shell behavior
- use Python CLI
- do not choose Next.js
- do not invent a web backend

---

## Example 4 — Existing project, but PRD suggests future platform shift
- codebase exists in one stack
- PRD hints at broader future direction
- migration is not yet clearly authorized

### Correct shell behavior
- preserve current stack for now
- record future direction in planning
- do not silently migrate the system during early packages

---

## Operator quick guide

The operator should expect the shell to decide stack like this:

1. use the PRD if clear
2. otherwise preserve the current repo’s stack
3. otherwise use explicit project docs
4. otherwise choose the thinnest sensible default and record it

The operator should **not** need to manually force stack choice unless:

- the PRD is genuinely ambiguous in a high-impact way
- or the shell raises a structured escalation

---

## Relationship to other shell docs

This file is a quick runtime reference only.

It must remain aligned with:

- `shell/control/AGENT_RUNTIME_SETUP.md`
- `shell/control/AGENT_OPERATING_RULES.md`
- `shell/templates/PRD_SOURCE_TEMPLATE.md`
- `shell/templates/CURRENT_STATE_AUDIT_TEMPLATE.md`
- `shell/templates/MASTER_ROADMAP_TEMPLATE.md`
- `shell/templates/EXECUTION_PACKAGES_TEMPLATE.md`

If those docs change materially, this reference should be updated.

---

## Final conclusion

The shell must derive stack and backend from the project, not impose them on the project.

The order is:

- PRD first
- codebase second
- runtime/project docs third
- default stack only when necessary

This file is the quick runtime reference for that rule.