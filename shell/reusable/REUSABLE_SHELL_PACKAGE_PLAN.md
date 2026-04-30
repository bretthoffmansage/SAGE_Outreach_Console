# REUSABLE_SHELL_PACKAGE_PLAN

## Purpose

This document defines the packaging plan for converting the GoTeamGo autonomous execution process into a reusable shell that can be used on future projects.

The goal of this shell is:

- start from a user-supplied PRD
- generate the required planning and control documents itself
- generate draft execution packages itself
- expand and execute packages autonomously
- commit progress package-by-package
- recover from interruption
- perform final audit and hardening automatically
- reach closeout with minimal or no manual intervention

This shell is not meant to inherit GoTeamGo’s product specifics.

It is meant to inherit the **process architecture** that successfully got GoTeamGo from a PRD-driven plan to a mostly completed product program.

---

## Shell objective

The reusable shell must be able to take a fresh project from:

- raw PRD or user requirements

to:

- normalized PRD source
- current-state audit
- roadmap
- execution package list
- package execution
- blocked-package expansion
- per-package commits
- final audit
- hardening plan
- hardening task list
- hardening execution
- final closeout

without requiring the user to manually run the same rescue and coordination work that was needed during GoTeamGo.

---

## Primary design principles

The shell must preserve the core qualities that made the GoTeamGo process successful:

1. **truthful execution**
   - no fake completion
   - no pretending a package is done when checks fail

2. **package discipline**
   - work in bounded packages
   - do not blur phases together
   - do not use “cleanup” as a pretext for feature sprawl

3. **draft-first planning**
   - execution packages should begin as a mostly draft list
   - the system should expand them one at a time as needed

4. **self-narrowing instead of improvisation**
   - when a package is too broad, shrink it to a safe executable slice
   - do not invent broad product behavior just to keep moving

5. **automatic recovery**
   - support interruption, resume, and blocked-package recovery without manual surgery

6. **clean handoff state**
   - after each completed package, the repo should be committed and clean

7. **full closeout**
   - execution is not done at the last feature package
   - audit and hardening are required parts of the lifecycle

---

## What this shell must do

## 1. Intake and normalization

The shell must begin from a user-supplied PRD or equivalent requirements artifact.

From that input, the shell must generate:

- `PRD_SOURCE.md`
- `CURRENT_STATE_AUDIT.md`
- `MASTER_ROADMAP.md`
- `EXECUTION_PACKAGES.md`

The shell must not assume these already exist.

If the source PRD is messy, incomplete, or not yet normalized, the shell should first normalize it into a structured internal working document before continuing.

---

## 2. Draft-first package generation

The shell must generate a full execution package list in draft-first form.

This means:

- all major packages should be listed
- only the earliest, best-grounded packages may start ready
- most later packages should remain draft initially
- package order and dependencies must be explicit

The purpose of this model is to avoid pretending the whole project is fully specified at the start.

The shell must be able to:

- create the initial package list from the PRD and roadmap
- maintain package status honestly over time
- expand draft packages only when they become next in sequence

---

## 3. Autonomous execution loop

The shell must execute packages in strict sequence.

For each package it must:

1. determine the next real package in sequence
2. inspect package status
3. if ready, execute it
4. if draft or underdefined, hand it to the package expansion stage
5. execute the package after successful expansion
6. run required checks and regressions
7. fix in-scope failures before moving on
8. log the run honestly
9. commit the package changes
10. confirm the tree is clean
11. continue automatically to the next package

The shell must not stop after each completed package.

It should continue until:
- the package list is exhausted
- a real blocker occurs
- or the user explicitly chooses stop

---

## 4. Dedicated blocked-package expansion stage

The shell must include a dedicated blocked-package expansion stage.

This is not optional.

When the main executor encounters a package that is too broad, underdefined, or draft, it must not simply stop.

Instead it must:

1. hand the package to a dedicated package-expander stage
2. apply `shell/control/PACKAGE_EXPANSION_PROTOCOL.md`
3. iteratively self-narrow the package
4. rewrite the package into the thinnest safe executable slice if possible
5. create/update the expansion log
6. hand the package back to the main executor
7. resume normal execution automatically

The user should not need to:
- manually delete logs
- manually reset state
- manually tell the executor how to continue

The shell must handle that handoff and resumption internally.

---

## 5. Iterative self-narrowing behavior

The shell must preserve the self-narrowing behavior that proved successful in GoTeamGo.

When a package is too broad, the shell must attempt progressively smaller safe slices before stopping.

Preferred narrowing moves include:

- internal-only before external
- event-scoped before org-wide/global
- single-workflow before subsystem-wide
- read-only before writable
- suggestion-only before direct edit
- snapshot before live sync/freshness
- existing routes before new surfaces
- structured foundation before richer workflow engine
- minimal review state before full collaboration logic
- additive schema before risky migration-heavy change

The shell must stop only when even the thinnest plausible slice still requires unresolved product judgment or unsafe architectural invention.

---

## 6. Structured user-input escalation instead of silent stop

If the shell truly needs user input even after blocked-package expansion, it must not simply terminate.

Instead, it must raise a structured question to the user that includes:

- what decision is needed
- why the shell cannot safely continue without it
- what choices are available
- a continue-ready option
- an explicit stop option

The shell should only stop if the user explicitly chooses stop.

This is a critical behavior requirement.

---

## 7. Resume-by-continue behavior

The shell must support interruption recovery.

If execution is interrupted because of:
- CLI credit exhaustion
- runtime interruption
- session end
- external stop not caused by logic failure

the user should be able to type:

`continue`

and the shell must:

- inspect current package/run state
- detect the most recent unfinished or active package
- resume near where it left off
- complete that package
- continue forward normally

This behavior must be first-class, not manual.

---

## 8. Per-package commit and clean-tree discipline

After each completed package, the shell must automatically:

1. inspect diff/stat
2. review files changed
3. commit all new and modified package files
4. verify `git status` is clean
5. fix any remaining cleanliness issues before continuing

This includes automatically handling recurring generated drift such as:

- `next-env.d.ts`

If recurring generated drift appears and is not part of intentional package work, the shell must revert it before committing.

The shell must not keep running with a dirty tree between packages unless the current package is still actively in progress.

---

## 9. Runtime behavior for Codex and Claude CLI

The shell must support equivalent execution posture for both:

- Codex CLI
- Claude CLI

The shell packaging must include runtime guidance/config for both, so that each can operate in the same non-interrupting autonomous mode.

This includes documenting the equivalent of the current Codex posture such as:

- approval behavior
- sandbox behavior
- safe autonomous execution expectations
- package-resume behavior
- non-interrupting command posture where appropriate

The shell must not be Codex-only.

---

## 10. Required reusable shell artifacts

The shell should ultimately produce and/or standardize reusable versions of the following artifacts.

### Core control docs
- `shell/control/AGENT_OPERATING_RULES.md`
- `shell/control/PACKAGE_EXPANSION_PROTOCOL.md`
- `shell/control/RUN_LOG_TEMPLATE.md`
- runtime setup guidance
- reusable shell workflow docs

### Planning docs
- `PRD_SOURCE.md`
- `CURRENT_STATE_AUDIT.md`
- `MASTER_ROADMAP.md`
- `EXECUTION_PACKAGES.md`

### Closeout docs
- `FINAL_EXECUTION_AUDIT.md`
- `POST_EXECUTION_HARDENING_PLAN.md`
- `POST_EXECUTION_HARDENING_TASKS.md`

### Supporting closeout / evidence docs
- evidence reconciliation note
- readiness gap note
- lint/tooling findings note
- validation baseline note
- any equivalent generic closeout artifacts needed

The shell should be able to generate the initial versions of these itself.

---

## 11. Generic vs project-specific separation

A major packaging rule:

The shell must distinguish between:

### Reusable process primitives
These should be generalized:
- package execution discipline
- self-narrowing
- blocked-package expansion
- run logs
- audit flow
- hardening flow
- commit/clean-tree discipline
- continue/resume behavior

### Reusable document templates
These should become generic shells:
- PRD normalization template
- current-state audit template
- roadmap template
- execution package template
- final audit template
- hardening plan template
- hardening task template

### Project-specific content
These must not be baked into the reusable shell:
- GoTeamGo route names
- GoTeamGo entity naming
- Convex-specific product assumptions unless the shell is explicitly targeting Convex projects
- product-specific package content
- product-specific architecture decisions
- product-specific UI labels
- legacy GoTeamGo system names

The shell should reuse structure, not product identity.

---

## 12. Required lifecycle of the reusable shell

The packaged shell lifecycle should be:

### Phase A — Intake
- accept user PRD
- normalize it

### Phase B — Planning generation
- generate PRD source
- generate current-state audit
- generate roadmap
- generate execution packages

### Phase C — Execution
- execute ready packages
- expand draft packages when needed
- commit after each completed package
- continue through the package list

### Phase D — Hardening
- generate final execution audit automatically
- generate targeted hardening plan automatically
- generate hardening task list automatically
- execute hardening in ordered passes
- Pass 1 → Pass 2 → Pass 3 → Pass 4
- continue automatically from one pass to the next unless a real blocker occurs

### Phase E — Functional Fidelity Uplift
- run a post-build fidelity audit against raw PRD + `PRD_SOURCE.md` + built product
- define and execute bounded uplift against material fidelity gaps
- explicitly document deferred fidelity gaps

### Phase F — High-End Design Pass
- run a structured design/art-direction/UI-system refinement phase
- produce `DESIGN_DIRECTION_BRIEF.md`
- produce and execute `UI_REFINEMENT_PLAN.md`
- preserve workflows/business logic while improving hierarchy, composition, and responsiveness
- validate functional preservation in `POST_DESIGN_FUNCTIONAL_VALIDATION.md`

### Phase G — Post-Uplift Validation
- reserved for later pass (not implemented here)

### Phase H — Final closeout
- leave a clean committed repo state
- leave completed audit, hardening, fidelity, and design artifacts
- leave a final closeout-ready handoff state

This lifecycle should be built into the shell as the default program arc.

---

## 13. Hardening-phase behavior required in the reusable shell

The hardening phase must be part of the shell by design.

It must:
- happen after the feature/package program completes
- not be treated as optional polish
- run in ordered passes
- continue automatically from one pass to the next unless blocked

The shell’s hardening phase should include at minimum:

### Pass 1
- evidence and closeout consistency
- readiness/library-seeding clarification

### Pass 2
- lint/tooling/CI hardening

### Pass 3
- type-safety cleanup sweep

### Pass 4
- shell/route consistency cleanup
- legacy/transitional containment cleanup

The shell must not stop between passes unless:
- validation fails
- a real blocker appears
- the user explicitly chooses stop

---

## 14. Final audit and hardening are required, not optional

The shell must automatically do all of the following before it considers itself complete:

1. generate final execution audit
2. generate targeted hardening plan
3. generate hardening task list
4. execute hardening passes
5. leave closeout evidence

This is a hard requirement.

The shell is not complete merely because the last feature package finished.

---

## 15. Closeout and packaging completion criteria

The reusable shell should only be considered complete when all of the following are true:

- it can start from a user PRD
- it can generate the required planning docs
- it can generate execution packages
- it can execute them sequentially
- it can expand blocked packages safely
- it can auto-commit after each completed package
- it can resume after interruption with `continue`
- it can escalate structured questions instead of silently stopping
- it can generate final audit
- it can generate and execute hardening
- it can leave a clean closeout state

Anything short of that is an intermediate shell, not the final reusable system.

---

## 16. Constraints on the shell packaging project

This packaging effort must not accidentally:
- re-open GoTeamGo feature work
- turn into environment parity work
- become a new product roadmap
- hardcode GoTeamGo product specifics into the reusable shell
- blur reusable process logic with project-specific content

The packaging project is about **process productization**, not more GoTeamGo feature development.

---

## 17. Known lessons from GoTeamGo that must be preserved

The shell must preserve these lessons learned:

1. draft-first package generation was correct
2. self-narrowing was essential
3. dedicated blocked-package expansion should become a formal stage
4. per-package commits should have been automatic from the start
5. clean-tree enforcement matters
6. `next-env.d.ts` drift should be auto-reverted
7. early evidence rigor should be stronger from the beginning
8. audit and hardening should be automatic
9. interruption recovery must be built in
10. user escalation should require explicit stop, not implicit stop

These lessons are part of the shell requirements.

---

## 18. Recommended packaging work order

The reusable shell should now be built in the following order:

### P-1 — Shell architecture spec
Define:
- shell lifecycle
- stages
- required behavior
- stop/continue logic
- blocked-package expansion behavior
- commit discipline

### P-2 — Artifact map and generic template set
Create:
- reusable doc inventory
- generic document templates
- mapping from user PRD to generated docs

### P-3 — Runtime behavior spec
Define:
- Codex CLI guidance
- Claude CLI guidance
- config equivalents
- interruption behavior
- continue behavior
- user escalation behavior

### P-4 — End-to-end execution flow spec
Define:
- from PRD intake through closeout
- including audit and hardening

### P-5 — Shell implementation layer
Implement:
- the actual reusable shell docs/prompts/workflow artifacts
- package commit behavior
- resume behavior
- blocked-package handoff behavior

This order should be followed.

---

## 19. Recommended first deliverables after this plan

Immediately after this plan, the next best artifacts to create are:

1. `shell/reusable/REUSABLE_SHELL_ARTIFACT_MAP.md`
2. `shell/reusable/REUSABLE_SHELL_RUNTIME_SPEC.md`
3. `shell/reusable/REUSABLE_SHELL_WORKFLOW.md`

Those three docs together will define:
- what the shell consists of
- how it behaves
- how it runs from start to finish

Only after those exist should the implementation-layer shell docs/prompts be finalized.

---

## 20. Final conclusion

The reusable shell should be built as a disciplined autonomous project engine that can reproduce the successful GoTeamGo process without reproducing its manual rescue burden.

Its job is to take a fresh PRD and drive all the way through:

- planning generation
- package execution
- self-narrowing
- commits
- audit
- hardening
- closeout

with truthful stopping behavior, structured escalation, and strong recovery support.

That is the target state for this packaging effort.