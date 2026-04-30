# REUSABLE_SHELL_CLI_CONFIGS

## Purpose

This document defines the CLI runtime configuration and operating posture required for the reusable autonomous shell.

It covers both:

- Codex CLI
- Claude CLI

Its purpose is to ensure the shell can behave consistently across supported CLI runtimes, with the same expectations around:

- autonomous continuation
- low-friction execution
- package-by-package commits
- blocked-package expansion
- clean-tree enforcement
- interruption recovery
- structured escalation
- audit and hardening closeout

This is not a product configuration file.

It is a runtime behavior and operator guidance document for the shell.

---

## Core requirement

The reusable shell must not be tied to only one CLI.

It must define equivalent operational posture for:

- Codex CLI
- Claude CLI

The exact syntax or config mechanism may differ between CLIs, but the shell must preserve the same behavioral outcomes.

Those outcomes are more important than any single config format.

---

## Runtime posture goals

Both supported CLIs must be able to operate in a way that allows the shell to:

1. inspect and edit repo files freely where safe
2. run local validation commands
3. generate and update markdown control docs
4. execute package work without constant approval friction
5. auto-commit completed package work
6. recover from interruption
7. continue automatically after blocked-package expansion
8. continue automatically between hardening passes unless blocked
9. avoid unnecessary user babysitting

If a CLI posture cannot support those behaviors, it is not a valid shell runtime posture.

---

## Required behavioral outcomes across CLIs

Regardless of CLI implementation details, the reusable shell runtime should behave as if all of the following are true:

- approval friction is minimized for safe local autonomous work
- sandboxing does not prevent necessary local repo operations
- the shell can inspect git state
- the shell can modify docs/code/config in the repo
- the shell can run build/validation commands
- the shell can commit completed units of work
- the shell can resume from `continue`
- the shell can return from blocked-package expansion to the main executor automatically
- the shell can generate closeout artifacts without separate manual prompting at each step

These are the non-negotiable behavioral goals.

---

# 1. Codex CLI guidance

## Intended Codex posture

The reusable shell should document the Codex-side posture equivalent to the one used successfully during GoTeamGo.

### Target behavior
- non-interrupting autonomous local execution where safe
- ability to inspect/modify repo contents
- ability to run validation commands
- ability to commit completed work
- minimal approval interruptions during normal shell operation

### Reference posture
Equivalent to the intent of:

- `approval_policy = "never"`
- `sandbox_mode = "danger-full-access"`

These names reflect the posture used during GoTeamGo and should be documented as the Codex-side reference behavior for the shell.

### Recommended Codex project config
The shell should normally use a project-scoped Codex config that reflects this posture.

Example intent:
- approval behavior equivalent to `never`
- sandbox behavior equivalent to `danger-full-access`
- model selection explicit if the shell operator wants a pinned default model

### Why this posture matters
The shell is designed to:
- work across many sequential phases
- generate many docs
- run repeated validations
- commit frequently
- recover from interruption
- continue with minimal user babysitting

A heavily approval-gated or highly restrictive Codex posture would break the intended shell workflow.

---

## Codex runtime assumptions

When operating under Codex CLI, the shell assumes it can:

- read the repo freely
- write repo files freely where in scope
- run local project commands
- inspect git state
- perform package closeout commits
- re-run validations after repair
- inspect logs and generated artifacts

The shell should not assume network-dependent behavior unless explicitly configured and allowed for the project.

---

## Codex operator guidance

When using the shell under Codex CLI, the operator should:

1. run the shell in a dedicated worktree or isolated branch
2. ensure the target environment is safe
3. use `begin` or `start` for a fresh or partially initialized shell
4. use `continue` after interruption
5. avoid manually cleaning state unless the shell explicitly requires a true human action
6. let the shell perform per-package closeout and commits automatically

---

# 2. Claude CLI guidance

## Intended Claude posture

The shell must define a Claude-side runtime posture equivalent in outcome to the Codex posture.

The exact Claude CLI settings use different syntax and mechanisms than Codex.

The shell should not describe Claude as using literal Codex keys like:

- `approval_policy = "never"`
- `sandbox_mode = "danger-full-access"`

Instead, the shell should describe Claude as using the **nearest behavioral equivalent**.

### Target behavior
- non-interrupting autonomous local execution where safe
- ability to inspect/modify repo contents
- ability to run validation commands
- ability to commit completed work
- minimal approval interruptions during normal shell operation

### Claude equivalence requirement
The shell packaging must explicitly document the Claude-side settings or conventions that produce the same effective behavior as the Codex posture.

That includes equivalents for:

- approval friction reduction
- repo access
- command execution
- continuation without constant manual reauthorization
- package closeout behavior
- sandbox relaxation where safe
- model selection

### Recommended Claude project posture
The shell should normally use a project-scoped Claude setup that aims for:

- broad allowed local repo operations where safe
- sandbox disabled or reduced where safe for local shell work
- a pinned high-capability default model if desired
- project instructions through `.claude/CLAUDE.md`
- shared runtime posture through `.claude/settings.json`

### Important rule
Claude should be treated as behaviorally equivalent to Codex for shell purposes, not syntactically identical.

---

## Claude runtime assumptions

When operating under Claude CLI, the shell should assume it must still be able to:

- inspect repo files
- write repo files
- inspect and use git state
- run local validation/build commands
- perform per-package closeout
- resume from `continue`
- perform blocked-package handoff and return

If the Claude runtime posture cannot support those behaviors, it should not be treated as shell-ready until the equivalent posture is configured.

---

## Claude operator guidance

When using the shell under Claude CLI, the operator should:

1. configure Claude CLI for the least-interrupting safe local posture available
2. use an isolated worktree or branch
3. ensure the environment is safe before backend-affecting work
4. use `begin` / `start` to initialize
5. use `continue` after interruption
6. avoid manually patching state that the shell is designed to infer and recover itself

### Recommended Claude project files
The shell should normally include:

- `.claude/CLAUDE.md`
- `.claude/settings.json`

Optional:
- `.claude/settings.local.json` for machine-local preferences that should not define the shared shell contract

### Recommended Claude model posture
If the operator wants a pinned high-capability default Claude model, that should be set in Claude project settings rather than described vaguely in prose.

---

# 3. CLI-equivalent behavior requirements

The reusable shell must preserve these behaviors under both Codex and Claude.

## 3.1 Start behavior
When the user types:
- `begin`
- `start`

the CLI runtime must allow the shell to:
- inspect current artifact state
- determine fresh start vs partial initialization vs in-progress resume ambiguity
- choose the correct first prompt automatically

---

## 3.2 Continue behavior
When the user types:
- `continue`

the CLI runtime must allow the shell to:
- inspect repo/artifact state
- determine current lifecycle phase
- infer the active package or hardening pass
- resume from there automatically

---

## 3.3 Package closeout behavior
The CLI runtime must allow the shell to:
- inspect diff/stat
- revert recurring generated drift
- stage package files
- commit completed packages
- verify clean tree
- continue

---

## 3.4 Blocked-package expansion behavior
The CLI runtime must allow the shell to:
- invoke blocked-package expansion
- rewrite the next package
- create expansion log
- return control to the executor
- continue normal execution automatically

---

## 3.5 Hardening continuation behavior
The CLI runtime must allow the shell to:
- execute Pass 1
- continue automatically into Pass 2
- continue automatically into Pass 3
- continue automatically into Pass 4
- stop only if a real blocker or failed validation requires it

---

# 4. Required CLI-safe operating context

For both Codex and Claude CLI, the shell should be run only in contexts that are safe for autonomous execution.

## Required safe context
- isolated branch or worktree
- local repo under operator control
- known safe backend environment when backend-affecting commands are allowed
- explicit operator intent to run the shell

## Not suitable by default
- protected/shared branches
- unclear environments
- unknown or unsafe backend targets
- contexts where commit and validation behavior is not allowed

The shell runtime guidance should make these assumptions explicit.

---

# 5. Begin / start / continue usage contract

The CLI docs for the shell must explicitly define the meaning of the three primary user commands.

## `begin`
Meaning:
- initialize or enter the shell workflow from the beginning as appropriate after state inspection

## `start`
Meaning:
- same as `begin`

## `continue`
Meaning:
- resume the current shell workflow from the most recent incomplete unit of work after state inspection

These commands are shell-level workflow triggers, not product commands.

The CLI guidance must make this explicit.

---

# 6. CLI behavior after interruption

The runtime guidance must state clearly that interruption is not the same as stop.

If the CLI session is interrupted because of:
- credits exhausted
- session timeout
- manual interruption
- process termination not caused by a logic blocker

the expected recovery path is:

1. reopen the CLI
2. return to the shell worktree
3. type `continue`

The shell must then:
- reconstruct current state
- resume from the active package/pass
- continue forward automatically

This must be documented identically for both Codex and Claude runtime use.

---

# 7. Structured escalation behavior in CLI usage

If the shell truly needs user input, the CLI interaction must preserve the structured escalation model.

The CLI runtime guidance must make clear that the shell should not just stop.

Instead it must present:
- the blocked point
- what it already attempted
- why it cannot continue safely
- what the user needs to decide or do
- Continue-ready
- Stop

The shell should only actually stop if the user explicitly chooses **Stop**.

This must be treated as a cross-CLI behavior rule.

---

# 8. Package commit behavior in CLI usage

The runtime guidance must state clearly that under both CLIs, the shell should automatically perform package closeout after each completed package.

That includes:
- diff/stat inspection
- generated drift handling
- commit creation
- clean-tree check

The operator should not have to manually run package commits during normal shell operation.

This is a core part of the reusable shell behavior.

---

# 9. Generated drift handling in CLI usage

The CLI guidance must explicitly mention that the shell will handle known recurring generated drift automatically where safe.

### Known example
- `next-env.d.ts`

The operator should not manually intervene for this kind of recurring drift unless:
- the shell escalates a true ambiguity
- or the generated file change is intentionally in scope

This rule should be documented for both supported CLIs.

---

# 10. Minimal operator instructions

A concise operator guide for either CLI should look like this:

## To initialize a new shell run
1. open the shell worktree/repo
2. ensure the raw PRD is available: **recommended** — exactly one regular file in `raw_prd/`; **or** omit `raw_prd/` and provide the PRD under the loose convention (see `shell/reusable/REUSABLE_SHELL_RESUME_CONTRACT.md` — Canonical raw PRD intake)
3. type `begin` or `start`

## To resume after interruption
1. reopen the shell worktree/repo
2. type `continue`

## If the shell escalates
1. read the structured escalation
2. provide the requested input or choose Continue-ready
3. choose Stop only if you truly want the workflow to stop

## Do not do by default
- manually delete blocked logs
- manually reconstruct package sequence
- manually revert recurring generated drift
- manually stitch executor and expander together
- manually commit completed package work unless the shell truly cannot

---

# 11. Recommended CLI config guidance artifact structure

The shell packaging may include CLI-specific subsections or examples such as:

## Codex example config section
- intended approval posture
- intended sandbox posture
- shell-specific usage notes

## Claude example config section
- intended behavioral equivalent posture
- sandbox/permissions guidance
- model guidance
- shell-specific usage notes
- CLI-specific cautions or differences

The exact syntax can vary over time, so this document should preserve the behavioral target even if exact CLI config shapes evolve.

---

# 12. Recommended current project posture

For this shell repo, the current intended runtime posture is:

## Codex
- project config equivalent to:
  - `approval_policy = "never"`
  - `sandbox_mode = "danger-full-access"`
- high-capability default model optional if the operator wants a pinned default
- repo-local instruction file pointing Codex at shell control docs

## Claude
- project instruction file at `.claude/CLAUDE.md`
- project settings in `.claude/settings.json`
- sandbox reduced or disabled where safe for local shell operation
- broad local permissions where safe
- a pinned high-capability Claude model if desired
- behavior intended to be equivalent in outcome to Codex, not identical in syntax

---

# 13. Runtime parity rule

The shell is only properly packaged if both supported CLIs can reach equivalent operational outcomes.

The goal is not:
- identical config syntax

The goal is:
- equivalent shell behavior

That means:
- same workflow stages
- same resume behavior
- same closeout discipline
- same escalation behavior
- same package-progression behavior
- same hardening-pass continuation behavior

---

# 14. Relationship to other shell docs

This file must remain aligned with:

- `shell/reusable/REUSABLE_SHELL_PACKAGE_PLAN.md`
- `shell/reusable/REUSABLE_SHELL_RUNTIME_SPEC.md`
- `shell/reusable/REUSABLE_SHELL_WORKFLOW.md`
- `shell/reusable/REUSABLE_SHELL_RESUME_CONTRACT.md`
- `shell/reusable/REUSABLE_SHELL_ESCALATION_TEMPLATE.md`
- `shell/reusable/REUSABLE_SHELL_PACKAGE_CLOSEOUT_CHECKLIST.md`
- `shell/reusable/REUSABLE_SHELL_GENERATED_DRIFT_RULES.md`
- `shell/reusable/REUSABLE_SHELL_PROMPTS.md`

If those change materially, this file should be updated.

---

# 15. Final conclusion

The reusable shell needs more than prompts and docs.

It needs a CLI runtime posture that actually allows those docs and prompts to function as intended.

This file defines the behavioral contract for that posture across:

- Codex CLI
- Claude CLI

The shell should behave consistently across both, with:

- `begin` / `start` for initialization
- `continue` for resume
- automatic package closeout
- automatic blocked-package return
- structured escalation instead of vague stopping
- automatic progression through hardening and closeout

That is the CLI runtime contract defined here.