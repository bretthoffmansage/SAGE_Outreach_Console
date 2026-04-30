# RUN_LOG_TEMPLATE

## Purpose

This file defines the standard logging format for autonomous or semi-autonomous shell work.

Every meaningful workflow unit should create or update a log using this structure.

That includes:

- execution package runs
- package expansion runs
- meaningful stop logs
- hardening pass runs where substantial work occurred
- optional quick logs for inspection-only or setup-only sessions

The purpose of these logs is to ensure work remains:

- auditable
- resumable
- reviewable
- evidence-based
- understandable to a future human or agent without rediscovery

This template is mandatory for work performed under:

- `shell/control/AGENT_OPERATING_RULES.md`
- `shell/control/PACKAGE_EXPANSION_PROTOCOL.md`
- `shell/reusable/REUSABLE_SHELL_WORKFLOW.md`
- `shell/reusable/REUSABLE_SHELL_RESUME_CONTRACT.md`

---

# RL-01 — Logging rules

## Rule 1
If meaningful work was performed, it must be logged.

## Rule 2
If package status, phase status, or hardening-pass status changed, the log must record why.

## Rule 3
If a meaningful product, architecture, shell-orchestration, or package-expansion decision was made, the log must cite the relevant PRD sections, workflow docs, or shell control docs used.

## Rule 4
If checks were run, the actual results must be recorded.

## Rule 5
If the active unit was not completed, the log must clearly explain the stop reason, blocker, or failure state.

## Rule 6
If a draft package was expanded, that expansion must be logged separately from the execution log.

## Rule 7
If a hardening pass made meaningful changes, that pass must leave behind a reviewable log or equivalent evidence note.

## Rule 8
The log must reflect reality. It must not claim completion, passing checks, safe status, responsible expansion, clean closeout, or reliable resume state unless there is actual evidence.

---

# RL-02 — Log file naming convention

## Recommended directory
`agent_runs/YYYY-MM-DD/`

## Recommended execution log file name
`WP-x.y__short-name.md`

## Recommended expansion log file name
`WP-x.y__short-name__expansion.md`

## Recommended hardening pass log file name
`HARDENING_PASS_N__short-name.md`

## Recommended stop or blocker log file name
Use the same package/pass naming pattern for the unit where the stop occurred.

## Examples

- `agent_runs/2026-04-14/WP-1.1__route-protection-and-middleware-correctness.md`
- `agent_runs/2026-04-15/WP-4.1__proposal-system-foundation__expansion.md`
- `agent_runs/2026-04-16/HARDENING_PASS_2__lint-and-validation-baseline.md`

## Rule
One package should usually have:

- one primary execution log per meaningful execution session
- one expansion log when that package was expanded from draft into executable form

One hardening pass should usually have:

- one primary pass log per meaningful execution session

---

# RL-03 — Required execution run log template

Use the structure below for each package execution run.

---

# Package run log

## 1. Package identity
- **Package ID:**  
- **Package title:**  
- **Run date:**  
- **Run start time:**  
- **Run end time:**  
- **Agent name / runtime:**  
- **Human operator (if any):**  

## 2. Package status at start
- **Initial package status:**  
- **Was package marked ready before start?:**  
- **Dependencies confirmed?:**  
- **Human approval required?:**  
- **Human approval received?:**  

## 3. Working context
- **Git branch:**  
- **Git worktree or repo path:**  
- **Target app environment:**  
- **Target backend environment / deployment (if relevant):**  
- **Environment safety confirmed?:**  
- **Protected data risk present?:**  

## 4. Package purpose
- **Package objective in this run:**  
- **Why this package is being worked now:**  
- **Expected outcome of this run:**  

## 5. Scope confirmation
- **In-scope work for this run:**  
- **Out-of-scope boundaries respected?:**  
- **Any scope ambiguity discovered?:**  

## 6. Files and systems inspected
- **Files inspected:**  
- **Backend systems inspected:**  
- **Routes/pages inspected:**  
- **Sensitive systems touched or reviewed:**  

## 7. PRD and control-doc references consulted
- **PRD sections consulted:**  
- **Audit sections consulted:**  
- **Roadmap sections consulted:**  
- **Shell/control docs consulted (if relevant):**  
- **How they influenced implementation direction:**  

## 8. Changes made
- **Files changed:**  
- **New files added:**  
- **Files removed:**  
- **High-level summary of changes:**  
- **Any intentional behavior changes:**  
- **Any non-behavioral refactors:**  

## 9. Commands run

List every meaningful command actually executed during the run.

### Example format

```text
npm run build
npm run lint
npx convex dev --once
git status
git diff --stat
## 10. Required checks run

Record each required check and its real outcome.

| Check | Required? | Result | Notes |
|---|---|---|---|
| Build | Yes / No | Pass / Fail / Not Run |  |
| Lint | Yes / No | Pass / Fail / Not Run |  |
| Tests | Yes / No | Pass / Fail / Not Run |  |
| Backend/codegen/deploy validation | Yes / No | Pass / Fail / Not Run |  |
| Package-specific check 1 | Yes / No | Pass / Fail / Not Run |  |
| Package-specific check 2 | Yes / No | Pass / Fail / Not Run |  |

## 11. Regression checks run

Record the regression checks that protect previously working functionality.

| Regression check | Result | Notes |
|---|---|---|
| Critical route still loads | Pass / Fail / Not Run |  |
| Existing core flow still works | Pass / Fail / Not Run |  |
| Previously completed package flow still works | Pass / Fail / Not Run |  |
| Source-of-truth boundary still holds | Pass / Fail / Not Run |  |
| Protected data unchanged where expected | Pass / Fail / Not Run |  |

## 12. Protected data verification

Use this section whenever the package touched or could have touched protected data systems.

- **Protected systems checked:**  
- **Verification method used:**  
- **Unexpected changes detected?:**  
- **If yes, what changed?:**  
- **Containment or rollback performed?:**  

## 13. Issues encountered
- **Blocking issues:**  
- **Non-blocking issues:**  
- **Unexpected behavior observed:**  
- **Any environment problems discovered:**  

## 14. Decisions made during the run

Record only meaningful decisions, not trivial coding steps.

| Decision | Reason | PRD / control docs used | Scope-safe? |
|---|---|---|---|
|  |  |  | Yes / No |

## 15. Package closeout and clean-tree check
- **Was package closeout attempted?:**  
- **Was `git status` inspected?:**  
- **Was `git diff --stat` inspected?:**  
- **Was recurring generated drift checked?:**  
- **Was any non-intentional generated drift reverted?:**  
- **Was the completed package committed?:**  
- **Was the tree clean after commit?:**  
- **If not clean, why not?:**  

## 16. Package completion assessment
- **Was the package completed in this run?:**  
- **If not complete, why not?:**  
- **If complete, what evidence supports completion?:**  
- **Recommended package status after run:** `in_progress / blocked / needs_review / complete`

## 17. Follow-up actions
- **Immediate next step:**  
- **Future package implications:**  
- **Human review needed?:**  
- **If yes, what specifically needs review?:**  

## 18. Final summary

Write a short, plain-language summary of what happened in this run.

---

# RL-04 — Required package expansion log template

Use this when a draft package is expanded into executable form.

---

# Package expansion log

## 1. Package identity
- **Package ID:**  
- **Package title:**  
- **Expansion date:**  
- **Agent name / runtime:**  

## 2. Why this package was expandable now
- **What earlier completed packages unlocked it:**  
- **Why it belongs now in sequence:**  
- **Why it is not still premature:**  

## 3. Evidence used for expansion
- **Package definition source:**  
- **Operating rules consulted:**  
- **PRD anchors consulted:**  
- **Roadmap anchors consulted:**  
- **Current-state anchors consulted:**  
- **Prior run logs consulted:**  
- **Codebase evidence consulted:**  

## 4. Minimum product promise being made real now
- **What smallest meaningful PRD/roadmap promise this package now implements:**  
- **Why that promise is the right thin slice for this moment:**  

## 5. Why the chosen scope is narrow and safe
- **What thin executable slice was chosen:**  
- **Why this slice is grounded:**  
- **Why this slice does not require broad product invention:**  
- **What major risks were avoided by keeping scope narrow:**  

## 6. What was explicitly deferred
- **Capabilities intentionally left for later packages:**  
- **Systems or workflows not being built yet:**  
- **Product decisions intentionally deferred:**  

## 7. Narrowing details
- **Was a narrowing rewrite required?:**  
- **Was iterative self-narrowing required?:**  
- **What broader version of the package was rejected?:**  
- **Why the final slice was the first safe executable level:**  

## 8. Expanded package definition summary
- **Status:**  
- **Priority:**  
- **Depends on:**  
- **Blocks:**  
- **Human approval required:**  
- **Data migration involved:**  
- **Purpose:**  
- **Scope:**  
- **Out of scope:**  

## 9. Expansion stop check
- **Was the package responsibly expandable from current context?:**  
- **If no, why not?:**  
- **If yes, why was execution safe to begin?:**  

## 10. Executor handoff check
- **Was the package updated in `EXECUTION_PACKAGES.md`?:**  
- **Is the package ready to return automatically to the executor?:**  
- **Is manual cleanup or log deletion required?:**  
- **If any handoff caveat exists, what is it?:**  

## 11. Final expansion summary

Write a short, plain-language summary of why this package could be expanded now and why the resulting scope is safe.

---

# RL-05 — Required hardening pass run log template

Use this when a hardening pass makes meaningful changes.

---

# Hardening pass run log

## 1. Pass identity
- **Pass name / number:**  
- **Run date:**  
- **Run start time:**  
- **Run end time:**  
- **Agent name / runtime:**  
- **Human operator (if any):**  

## 2. Pass purpose
- **Hardening objective in this run:**  
- **Why this pass is being worked now:**  
- **Expected outcome of this run:**  

## 3. Working context
- **Git branch:**  
- **Git worktree or repo path:**  
- **Current shell phase confirmed?:**  
- **Environment safety confirmed?:**  

## 4. Files and systems inspected
- **Files inspected:**  
- **Systems inspected:**  
- **Sensitive systems touched or reviewed:**  

## 5. Changes made
- **Files changed:**  
- **New files added:**  
- **Files removed:**  
- **High-level summary of changes:**  

## 6. Commands run

List every meaningful command actually executed during the run.

## 7. Checks run

| Check | Required? | Result | Notes |
|---|---|---|---|
| Build | Yes / No | Pass / Fail / Not Run |  |
| Lint | Yes / No | Pass / Fail / Not Run |  |
| Validation baseline | Yes / No | Pass / Fail / Not Run |  |
| Pass-specific check 1 | Yes / No | Pass / Fail / Not Run |  |
| Pass-specific check 2 | Yes / No | Pass / Fail / Not Run |  |

## 8. Issues encountered
- **Blocking issues:**  
- **Non-blocking issues:**  
- **Unexpected behavior observed:**  

## 9. Pass closeout and clean-tree check
- **Was `git status` inspected?:**  
- **Was `git diff --stat` inspected?:**  
- **Was recurring generated drift checked?:**  
- **Was any non-intentional generated drift reverted?:**  
- **Was the pass committed?:**  
- **Was the tree clean after commit?:**  
- **If not clean, why not?:**  

## 10. Pass completion assessment
- **Was the pass completed in this run?:**  
- **If not complete, why not?:**  
- **What evidence supports completion?:**  
- **Is the shell ready to continue to the next hardening pass?:**  

## 11. Final summary

Write a short, plain-language summary of what happened in this hardening pass.

---

# RL-06 — Minimal quick-log version

Use this only for very small non-implementation sessions such as:

- environment confirmation
- package triage
- state inspection
- resume-state determination
- dry-run setup checks
- shell artifact review without meaningful repo changes

---

# Quick log
- **Unit of work:**  
- **Date/time:**  
- **Agent/runtime:**  
- **Goal of run:**  
- **What was inspected:**  
- **What was changed (if anything):**  
- **Commands run:**  
- **Checks run:**  
- **Outcome:**  
- **Next step:**  

### Rule

If code, schema, backend behavior, routing, permissions, protected data, package-expansion scope, hardening pass changes, or repo closeout behavior were meaningfully affected, do not use the quick log.

Use the full execution log, expansion log, or hardening pass log.

---

# RL-07 — Package and pass closure rule

A package execution log must not mark the package complete unless all of the following are true:

1. in-scope implementation work is finished
2. required checks passed
3. regression checks passed
4. any protected-data verification passed where relevant
5. no unresolved blocker remains that invalidates completion
6. package status recommendation is supported by evidence
7. package closeout was performed honestly
8. the tree is clean after closeout

A package expansion log must not claim the package was safely expandable unless:

1. the expansion was grounded in the PRD, roadmap, audit, prior run logs, and current codebase state
2. the scope was narrowed to the thinnest safe executable slice
3. deferred capabilities were explicitly recorded
4. the expansion did not require broad unresolved product invention
5. the executor can resume from the expanded package without manual user cleanup

A hardening pass log must not mark the pass complete unless:

1. pass-scoped work is finished
2. required checks passed
3. any repo changes were closed out honestly
4. the tree is clean after closeout
5. the shell is genuinely ready to move to the next pass or final closeout

---

# RL-08 — Suggested directory structure

A recommended structure is:

```text
agent_runs/
  2026-04-14/
    WP-0.1__runtime-safety-setup.md
    WP-0.2__environment-separation-and-safety-confirmation.md
  2026-04-15/
    WP-4.1__proposal-system-foundation__expansion.md
    WP-4.1__proposal-system-foundation.md
  2026-04-16/
    HARDENING_PASS_2__lint-and-validation-baseline.md
	Optional later additions may include:

- `agent_runs/_summaries/`
- `agent_runs/_failed_runs/`
- `agent_runs/_package_status_index.md`
- `agent_runs/_expansion_index.md`

---

# RL-09 — Strong recommendation for agents

Before ending any run, the agent should answer these questions honestly in the log:

- Did I stay within the active unit scope?
- Did I verify the correct environment before acting?
- Did I record the PRD or control docs that guided my decisions?
- Did I run the required checks?
- Did I run the regression checks where relevant?
- Did I verify protected systems if relevant?
- If this package was expanded, did I explicitly record what was deferred?
- Did I handle package/pass closeout honestly?
- Is the recommended status or expansion outcome truthful?

If any answer is no, the log should explicitly state that.

---

# RL-10 — Final summary

This template exists so autonomous shell execution remains controlled and reviewable.

A good log should make it easy for a future reader to understand:

- what unit was worked on
- whether it was expanded first
- what changed
- why it changed
- what evidence exists that it worked
- whether closeout was performed
- whether it is safe to continue to the next package or next pass

That is the standard every package execution, expansion, or hardening run log should meet.