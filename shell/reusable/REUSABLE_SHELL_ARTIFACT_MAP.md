# REUSABLE_SHELL_ARTIFACT_MAP

## Purpose

This document maps the full set of artifacts the reusable autonomous shell must create, maintain, consume, and hand off.

Its purpose is to make the shell concrete.

The shell is not just:
- a prompt
- a CLI config
- a package runner

It is a full document-and-workflow system.

This artifact map defines:
- which artifacts are required
- what each artifact does
- when it is created
- whether it is reusable or project-specific
- which later phases depend on it

---

## Artifact categories

The shell should organize artifacts into these categories:

1. **intake artifacts**
2. **planning artifacts**
3. **execution-control artifacts**
4. **run evidence artifacts**
5. **closeout artifacts**
6. **hardening artifacts**
7. **functional-fidelity uplift artifacts**
8. **high-end design pass artifacts**
9. **runtime and shell-operation artifacts**
10. **optional support artifacts**

---

# 1. Intake artifacts

These are the first artifacts in the shell lifecycle.

They transform a user-supplied PRD or requirement set into shell-usable working inputs.

---

## 1.1 Source PRD input

### Artifact
- user-supplied PRD or equivalent project brief

### Preferred location (fresh run)
- **`raw_prd/`** — exactly **one** regular file at the top level of that folder is the canonical raw PRD when the folder exists; see `shell/reusable/REUSABLE_SHELL_RESUME_CONTRACT.md` (**Canonical raw PRD intake**). Zero or multiple files there require **structured escalation** (no guessing).

### Fallback when `raw_prd/` is absent
- existing loose convention: operator-provided PRD (e.g. chat, or files the operator explicitly indicates) — no new mandatory root-level raw filename introduced by this rule

### Role
- raw project intent
- original source of product requirements

### Created by
- user

### Consumed by
- PRD normalization stage
- roadmap generation stage
- current-state audit stage

### Reusable?
- no
- project-specific

### Notes
- the shell must assume this may be messy, incomplete, or inconsistently formatted

---

## 1.2 `PRD_SOURCE.md`

### Role
- normalized, structured version of the source PRD
- canonical shell-readable requirements document

### Created when
- Phase A: Intake

### Consumed by
- current-state audit
- roadmap generation
- execution package generation
- package expansion
- audit/hardening later

### Reusable?
- template reusable
- file content project-specific

### Minimum responsibilities
- normalize the user’s PRD into a structured working document
- preserve original intent without adding fake certainty
- give section IDs or stable anchors for later citation

---

# 2. Planning artifacts

These are the main planning/control docs produced before execution begins.

---

## 2.1 `CURRENT_STATE_AUDIT.md`

### Role
- describes the actual codebase/project state at the start of execution
- identifies gaps between current reality and PRD intent

### Created when
- Phase B: Planning generation

### Consumed by
- roadmap generation
- package generation
- package expansion
- final audit
- hardening

### Reusable?
- template reusable
- file content project-specific

### Minimum responsibilities
- identify current surfaces
- identify current architecture posture
- identify gaps, inconsistencies, drift, and risks
- distinguish active systems from legacy/transitional systems

---

## 2.2 `MASTER_ROADMAP.md`

### Role
- strategic decomposition of the project into major phases or chapters
- bridge between PRD and execution packages

### Created when
- Phase B: Planning generation

### Consumed by
- execution package generation
- package expansion
- final audit
- hardening

### Reusable?
- template reusable
- file content project-specific

### Minimum responsibilities
- create sequence-correct major work areas
- identify dependency order
- distinguish foundational work from later work
- avoid pretending everything is executable at once

---

## 2.3 `EXECUTION_PACKAGES.md`

### Role
- bounded, operational package list for autonomous execution

### Created when
- Phase B: Planning generation

### Consumed by
- main executor
- blocked-package expansion stage
- final audit
- hardening

### Reusable?
- template reusable
- content project-specific

### Minimum responsibilities
- list packages in dependency order
- mark status honestly
- start as mostly draft-first
- allow only earliest grounded packages to begin ready
- define package scope, checks, regressions, and boundaries

---

# 3. Execution-control artifacts

These are the reusable process-control docs that govern behavior during execution.

These are core shell primitives.

---

## 3.1 `shell/control/AGENT_OPERATING_RULES.md`

### Role
- defines execution discipline, scope rules, safety rules, logging expectations, stop conditions, and package behavior

### Created when
- shell initialization or template provisioning

### Consumed by
- executor
- blocked-package expander
- audit generation
- hardening generation

### Reusable?
- yes
- core reusable primitive

### Minimum responsibilities
- define source hierarchy
- define package discipline
- define truthful completion rules
- define self-correction expectations
- define package expansion behavior
- define structured escalation behavior
- define package commit/clean-tree expectations in final shell version

---

## 3.2 `shell/control/PACKAGE_EXPANSION_PROTOCOL.md`

### Role
- defines how draft or underdefined packages get narrowed into executable slices

### Created when
- shell initialization or template provisioning

### Consumed by
- blocked-package expansion stage
- executor when it hits draft packages
- audit and hardening for process understanding

### Reusable?
- yes
- core reusable primitive

### Minimum responsibilities
- one-package-only expansion
- source grounding order
- narrowing rewrite rules
- iterative self-narrowing rules
- expansion stop conditions
- expansion logging requirements

---

## 3.3 `shell/control/RUN_LOG_TEMPLATE.md`

### Role
- standard structure for execution logs and expansion logs

### Created when
- shell initialization or template provisioning

### Consumed by
- executor
- blocked-package expander
- audit stage

### Reusable?
- yes
- core reusable primitive

### Minimum responsibilities
- define execution log structure
- define evidence expectations
- define completion/stop logging
- make runs auditable and resumable

---

## 3.4 Runtime setup guidance

### Example artifacts
- `shell/control/AGENT_RUNTIME_SETUP.md`
- CLI config guidance docs
- shell runner behavior spec

### Role
- define how the shell should actually be run

### Created when
- shell initialization / packaging phase

### Consumed by
- Codex CLI
- Claude CLI
- future operator

### Reusable?
- yes
- core reusable primitive

### Minimum responsibilities
- define branch/worktree posture
- define safe environment behavior
- define package commit behavior
- define continue/resume behavior
- define blocked-package handoff behavior
- define Codex and Claude CLI equivalents

---

# 4. Run evidence artifacts

These are created during execution and closeout.

---

## 4.1 `agent_runs/YYYY-MM-DD/WP-x.y__*.md`

### Role
- package execution logs
- package expansion logs
- stop logs where needed

### Created when
- throughout package execution

### Consumed by
- resume behavior
- final audit
- hardening
- future maintainers/operators

### Reusable?
- directory pattern reusable
- content project-specific

### Minimum responsibilities
- record actual work
- preserve evidence
- support resumption and audit
- distinguish execution vs expansion vs stop

---

## 4.2 Optional evidence addenda

### Example artifacts
- evidence reconciliation notes
- environment gap notes
- lint findings notes
- readiness gap notes

### Role
- reconcile issues discovered after the main package run

### Created when
- audit phase
- hardening phase

### Consumed by
- final audit
- hardening
- packaging phase

### Reusable?
- templates reusable
- content project-specific

---

# 5. Closeout artifacts

These are created automatically after package execution is complete.

They are mandatory in the final shell.

---

## 5.1 `FINAL_EXECUTION_AUDIT.md`

### Role
- truthful closeout audit of the package program

### Created when
- Phase D: Final audit

### Consumed by
- hardening plan generation
- reusable-shell packaging review
- future maintainers/operators

### Reusable?
- template reusable
- content project-specific

### Minimum responsibilities
- summarize package outcomes
- separate code-complete from environment-complete
- identify caveats
- identify deferred decisions
- identify major delivered architecture outcomes
- define the next phase

---

## 5.2 Optional closeout evidence notes

### Example artifacts
- `POST_EXECUTION_EVIDENCE_RECONCILIATION.md`
- `SAFE_DEV_READINESS_GAP.md`
- equivalent project-specific notes

### Role
- strengthen the truthfulness of closeout state

### Created when
- hardening Pass 1 or equivalent

### Consumed by
- final audit
- later environment/readiness review
- packaging phase

### Reusable?
- templates reusable
- content project-specific

---

# 6. Hardening artifacts

These are also mandatory in the final shell.

---

## 6.1 `POST_EXECUTION_HARDENING_PLAN.md`

### Role
- defines the purpose, boundaries, and workstreams of the hardening phase

### Created when
- Phase E: Hardening planning

### Consumed by
- hardening task generation
- hardening execution

### Reusable?
- template reusable
- content partly reusable / partly project-specific

### Minimum responsibilities
- define hardening scope
- forbid disguised feature work
- define workstreams
- define validations
- feed reusable-shell packaging later

---

## 6.2 `POST_EXECUTION_HARDENING_TASKS.md`

### Role
- operational hardening task list derived from the hardening plan

### Created when
- Phase E: Hardening planning

### Consumed by
- hardening execution passes

### Reusable?
- template reusable
- content project-specific

### Minimum responsibilities
- order hardening work
- define pass structure
- tag tasks by type
- identify safest/highest-value first work
- establish pass checkpoints

---

## 6.3 Hardening pass outputs

### Example artifacts
- lint findings
- validation baseline
- evidence reconciliation
- readiness gap docs
- other hardening notes

### Role
- leave behind evidence of the hardening phase

### Created when
- Phase F: Hardening execution

### Consumed by
- final closeout
- reusable-shell packaging review

### Reusable?
- templates reusable
- content project-specific

---

# 7. Functional-fidelity uplift artifacts

These are mandatory for the post-hardening fidelity phase.

---

## 7.1 `POST_BUILD_FIDELITY_AUDIT.md`

### Role
- audit intent translation and implementation fidelity after hardening
- compare raw PRD, `PRD_SOURCE.md`, and built product state
- classify fidelity outcomes (aligned/thin/partial/misplaced/missing/deferred)

### Created when
- Phase E: Functional Fidelity Uplift

### Consumed by
- fidelity uplift planning/execution
- final closeout and later reserved post-uplift phases

### Reusable?
- template reusable
- content project-specific

---

## 7.2 `FIDELITY_UPLIFT_PLAN.md`

### Role
- define bounded uplift scope that targets material fidelity gaps
- prevent speculative expansion and uncontrolled scope creep
- record explicit deferred gaps that remain after uplift

### Created when
- Phase E: Functional Fidelity Uplift

### Consumed by
- fidelity uplift execution/re-audit
- final closeout and later reserved post-uplift phases

### Reusable?
- template reusable
- content project-specific

---

# 8. High-end design pass artifacts

These artifacts operationalize Phase F as a structured, functionality-preserving design refinement phase.

---

## 8.1 `DESIGN_DIRECTION_BRIEF.md`

### Role
- define art direction, UI personality, and design-system intent for post-fidelity refinement
- record explicit functionality-preservation constraints before visual changes
- define page/workflow/content inventory and visual pain points

### Created when
- Phase F: High-End Design Pass

### Consumed by
- UI refinement planning and implementation
- post-design validation and closeout

### Reusable?
- template reusable
- content project-specific

---

## 8.2 `UI_REFINEMENT_PLAN.md`

### Role
- convert design direction into bounded implementation scope
- organize shared-system and surface-level refinement tasks
- preserve dense/raw data access patterns while improving primary UX

### Created when
- Phase F: High-End Design Pass

### Consumed by
- design execution
- post-design validation and closeout

### Reusable?
- template reusable
- content project-specific

---

## 8.3 `POST_DESIGN_FUNCTIONAL_VALIDATION.md`

### Role
- provide explicit evidence that design updates preserved functionality
- verify routes/workflows/forms/search/filter/loading/error behavior post-refinement

### Created when
- Phase F: High-End Design Pass (after UI refinement execution)

### Consumed by
- final closeout and later reserved post-uplift validation

### Reusable?
- template reusable
- content project-specific

---

# 9. Runtime and shell-operation artifacts

These are the artifacts that make the reusable shell actually usable as a system.

These are not just project docs. They define shell behavior.

---

## 9.1 `shell/reusable/REUSABLE_SHELL_PACKAGE_PLAN.md`

### Role
- defines how the GoTeamGo-derived process becomes a reusable shell

### Created when
- shell packaging phase

### Consumed by
- shell packaging work
- future maintainers/operators

### Reusable?
- yes
- shell-specific planning artifact

---

## 9.2 `shell/reusable/REUSABLE_SHELL_ARTIFACT_MAP.md`

### Role
- defines all shell artifacts and their roles

### Created when
- shell packaging phase

### Consumed by
- shell packaging work
- workflow spec
- runtime spec

### Reusable?
- yes

---

## 9.3 `shell/reusable/REUSABLE_SHELL_RUNTIME_SPEC.md`

### Role
- defines runtime behavior for Codex CLI and Claude CLI

### Created when
- shell packaging phase

### Consumed by
- future shell operators
- automation/runtime configuration

### Reusable?
- yes

### Minimum responsibilities
- define Codex posture
- define Claude CLI equivalent posture
- define continue/resume behavior
- define explicit stop vs continue-ready behavior
- define commit/clean-tree expectations
- define generated-file drift handling
- define blocked-package handoff/resume behavior

---

## 9.4 `shell/reusable/REUSABLE_SHELL_WORKFLOW.md`

### Role
- defines the full end-to-end shell lifecycle from PRD intake through closeout

### Created when
- shell packaging phase

### Consumed by
- shell operators
- shell implementation artifacts
- future automation

### Reusable?
- yes

### Minimum responsibilities
- define phases A through G
- define stage transitions
- define handoff points
- define success conditions
- define final shell closeout

---

## 9.5 Optional shell implementation prompts/docs

### Examples
- continuation prompt
- blocked-package expander prompt
- audit-generation prompt
- hardening-task generation prompt
- pass execution prompts

### Role
- operationalize the shell behavior

### Created when
- shell packaging/implementation phase

### Consumed by
- executor
- expander
- operator

### Reusable?
- yes, but likely with customization layers

---

# 10. Optional support artifacts

These are not always mandatory, but the shell should allow them where useful.

---

## 10.1 Validation docs

### Examples
- `backups/verification/baseline_validation_commands.md`
- protected-data verification docs
- environment safety docs

### Role
- standardize safety and validation behavior

### Reusable?
- mostly yes

---

## 10.2 Resume state notes or package state index

### Examples
- `_package_status_index.md`
- resume cursor/state note
- current active package pointer

### Role
- improve resume reliability

### Reusable?
- yes

### Notes
- the final shell may or may not need a dedicated file if state can be derived from logs and package statuses
- but this remains a strong candidate if resume behavior needs additional explicit support

---

# 11. Artifact lifecycle map

This section shows when each artifact should exist.

| Phase | Artifact |
|---|---|
| Intake | user PRD |
| Intake | `PRD_SOURCE.md` |
| Planning | `CURRENT_STATE_AUDIT.md` |
| Planning | `MASTER_ROADMAP.md` |
| Planning | `EXECUTION_PACKAGES.md` |
| Shell init | `shell/control/AGENT_OPERATING_RULES.md` |
| Shell init | `shell/control/PACKAGE_EXPANSION_PROTOCOL.md` |
| Shell init | `shell/control/RUN_LOG_TEMPLATE.md` |
| Shell init | runtime setup/spec docs |
| Execution | `agent_runs/...` logs |
| Closeout | `FINAL_EXECUTION_AUDIT.md` |
| Hardening planning | `POST_EXECUTION_HARDENING_PLAN.md` |
| Hardening planning | `POST_EXECUTION_HARDENING_TASKS.md` |
| Hardening execution | pass-specific docs/findings artifacts |
| Functional fidelity uplift | `POST_BUILD_FIDELITY_AUDIT.md` |
| Functional fidelity uplift | `FIDELITY_UPLIFT_PLAN.md` |
| High-end design pass | `DESIGN_DIRECTION_BRIEF.md` |
| High-end design pass | `UI_REFINEMENT_PLAN.md` |
| High-end design pass | `POST_DESIGN_FUNCTIONAL_VALIDATION.md` |
| Shell packaging | `shell/reusable/REUSABLE_SHELL_PACKAGE_PLAN.md` |
| Shell packaging | `shell/reusable/REUSABLE_SHELL_ARTIFACT_MAP.md` |
| Shell packaging | `shell/reusable/REUSABLE_SHELL_RUNTIME_SPEC.md` |
| Shell packaging | `shell/reusable/REUSABLE_SHELL_WORKFLOW.md` |

---

# 12. Required shell-generated artifacts vs user-provided artifacts

## User-provided
- raw PRD or equivalent requirement input

## Shell-generated
- `PRD_SOURCE.md`
- `CURRENT_STATE_AUDIT.md`
- `MASTER_ROADMAP.md`
- `EXECUTION_PACKAGES.md`
- execution logs
- expansion logs
- final audit
- hardening plan
- hardening tasks
- fidelity audit
- fidelity uplift plan
- design direction brief
- UI refinement plan
- post-design functional validation
- hardening findings docs
- shell packaging artifacts

The shell should minimize reliance on manually hand-authored intermediary docs.

---

# 13. Artifacts that must remain generic in the final shell

The following must be generalized in the final reusable shell:

- planning doc templates
- execution package structure
- run-log structure
- audit structure
- hardening structure
- blocked-package expansion behavior
- resume/continue behavior
- package commit and clean-tree behavior
- Codex + Claude CLI runtime posture

These must not remain tied to GoTeamGo wording or entity names.

---

# 14. Artifacts that must remain project-specific

These should be regenerated per project and never baked into the shell as fixed content:

- package contents
- entity definitions
- route structure
- product architecture decisions
- domain-specific naming
- system-specific caveats
- project-specific hardening findings
- project-specific environment readiness notes

---

# 15. Artifact quality requirements

Every artifact the shell creates should be:

- truthful
- scoped
- non-aspirational
- structurally consistent
- useful for later phases
- legible to a future operator or model
- explicit about caveats and deferrals where needed

The shell must not generate artifacts that merely sound complete.

They must actually support execution and closeout.

---

# 16. Final conclusion

The reusable shell is fundamentally an artifact-driven system.

Its quality depends on:
- generating the right artifacts
- in the right order
- with the right responsibilities
- and reusing process structure without smuggling in project-specific product content

This artifact map defines that structure.

It should be treated as one of the core control documents for reusable-shell packaging.