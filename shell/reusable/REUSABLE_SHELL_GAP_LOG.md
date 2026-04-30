# REUSABLE_SHELL_GAP_LOG

## Purpose

This document records gaps discovered while packaging and dry-running the reusable autonomous shell.

Its purpose is to prevent shell refinement from becoming:

- ad hoc
- memory-based
- overly conversational
- patchy
- dishonest about what still fails

The gap log is the shell’s defect-tracking artifact for process behavior.

It is not a product bug tracker.

It is specifically for reusable-shell behavior gaps.

---

## Core objective

When the shell is tested, any meaningful failure, weakness, ambiguity, or rough edge should be captured in a structured way so that:

- the right shell artifact gets fixed
- improvements are traceable
- the dry run stays evidence-based
- shell readiness decisions remain honest

This document exists so the shell can be improved systematically.

---

## What counts as a shell gap

A shell gap is any issue in the shell’s ability to perform its intended workflow.

Examples include:

- wrong phase selection
- wrong prompt selection
- poor `begin` / `start` behavior
- bad `continue` recovery
- blocked-package expander not handing back correctly
- package closeout not cleaning the tree
- generated drift not handled correctly
- structured escalation missing or weak
- audit or hardening not triggered automatically
- CLI-specific runtime mismatch
- shell docs contradicting each other in a way that affects operation

A shell gap is **not** just any product bug in a test project.

The gap log is for shell behavior.

---

## What does not belong here

Do not log these here unless they expose a shell-level issue:

- normal product implementation bugs inside the dry-run project
- project-specific UI preferences
- product feature wishes
- domain-specific scope disagreements that are not shell logic problems
- known intentional shell constraints that are already documented and behaving as designed

If the issue is not about the shell’s process behavior, it does not belong in this log.

---

## Gap severity levels

Use these severity levels consistently.

### Critical
The shell cannot complete a major lifecycle phase correctly.

Examples:
- cannot start from `begin`
- cannot resume from `continue`
- cannot recover from blocked-package expansion
- cannot complete package closeout reliably
- cannot continue through hardening passes
- silently stops without structured escalation

### High
The shell can proceed, but a core behavior is unreliable or misleading.

Examples:
- chooses wrong phase under common conditions
- commits dirty or noisy package state
- misses required closeout step
- generates misleading audit/hardening artifacts
- requires repeated manual rescue

### Medium
The shell works, but with avoidable friction, inconsistency, or clarity issues.

Examples:
- escalation wording unclear
- resume behavior works but requires too much user guidance
- prompt routing works but is more brittle than it should be
- artifact naming or transitions are confusing

### Low
The shell is still correct, but polish or clarity should improve.

Examples:
- redundant wording in shell docs
- minor prompt inconsistency
- unnecessary manual confirmation language
- small organization/traceability improvements

---

## Gap status values

Use these statuses consistently.

- `open`
- `investigating`
- `fix_planned`
- `fix_in_progress`
- `fixed_pending_validation`
- `validated_closed`
- `accepted_caveat`
- `not_a_shell_gap`

---

## Required gap fields

Every gap entry should include all of the following fields.

### 1. Gap ID
A stable unique identifier.

Suggested format:
- `SG-001`
- `SG-002`
- `SG-003`

### 2. Date discovered
When the gap was first observed.

### 3. Detected during
What activity exposed it.

Examples:
- dry run
- shell doc review
- runtime config review
- resume test
- blocked-package expansion test
- hardening pass simulation

### 4. Workflow phase
Which lifecycle phase the shell was in.

Examples:
- Phase A — Intake
- Phase B — Planning generation
- Phase C — Package execution
- Phase D — Final audit
- Phase E — Hardening planning
- Phase F — Hardening execution
- Phase G — Final closeout

### 5. Severity
Use the defined severity levels:
- Critical
- High
- Medium
- Low

### 6. Short title
A brief name for the issue.

### 7. Symptom
What actually happened.

### 8. Expected behavior
What the shell should have done instead.

### 9. Likely responsible shell artifact(s)
Which shell docs/contracts most likely need to be fixed.

Examples:
- `shell/reusable/REUSABLE_SHELL_PROMPTS.md`
- `shell/reusable/REUSABLE_SHELL_RESUME_CONTRACT.md`
- `shell/reusable/REUSABLE_SHELL_PACKAGE_CLOSEOUT_CHECKLIST.md`
- `shell/reusable/REUSABLE_SHELL_GENERATED_DRIFT_RULES.md`
- `shell/reusable/REUSABLE_SHELL_CLI_CONFIGS.md`

### 10. Root cause hypothesis
Best current explanation for why it happened.

### 11. Proposed fix
How the shell should likely be corrected.

### 12. Status
Use the defined status values.

### 13. Validation plan
How the fix will be tested.

### 14. Validation result
What happened when the fix was tested.

### 15. Notes
Optional extra context.

---

# Recommended log structure

Use this structure for each gap entry.

```md
## SG-001 — [short title]

- **Date discovered:** YYYY-MM-DD
- **Detected during:** [dry run / review / resume test / etc.]
- **Workflow phase:** [Phase A-G]
- **Severity:** [Critical / High / Medium / Low]
- **Status:** [open / investigating / fix_planned / fix_in_progress / fixed_pending_validation / validated_closed / accepted_caveat / not_a_shell_gap]

### Symptom
[What happened]

### Expected behavior
[What should have happened]

### Likely responsible shell artifact(s)
- `[artifact 1]`
- `[artifact 2]`

### Root cause hypothesis
[Best current explanation]

### Proposed fix
[What should be changed]

### Validation plan
[How the fix will be tested]

### Validation result
[Result after testing]

### Notes
[Optional notes]
This exact formatting is recommended because it keeps the log consistent and scannable.

---

# Gap triage rules

When a shell gap is logged, it should be triaged before fixing.

## Triage questions

1. Is this truly a shell gap?
2. What phase did it break?
3. Does it block the dry run or only degrade it?
4. Which shell artifact is the likely correction point?
5. Is this a design-doc problem, a prompt/orchestration problem, or a runtime contract problem?
6. Can it be fixed narrowly without changing unrelated shell behavior?

The shell should be improved by fixing the **right control artifact**, not by layering one-off rescue behavior on top.

---

## Gap categories

Gaps should usually fall into one of these categories:

### A. Planning-generation gap
Examples:
- wrong artifact order
- weak PRD normalization behavior
- audit/roadmap/package generation transitions unclear

### B. Prompt/orchestration gap
Examples:
- wrong prompt selected
- wrong phase inferred
- `begin` / `start` / `continue` behavior routed incorrectly

### C. Blocked-package expansion gap
Examples:
- narrowing not attempted
- iterative narrowing too weak
- expander failed to return control to executor

### D. Package closeout gap
Examples:
- package finished but not committed
- tree left dirty
- package boundary blurred

### E. Generated-drift handling gap
Examples:
- `next-env.d.ts` not reverted
- drift misclassified as intentional work
- drift blocks resume/closeout

### F. Resume gap
Examples:
- `continue` restarts instead of resuming
- wrong package/pass resumed
- state inference too weak

### G. Escalation gap
Examples:
- vague stop
- no Continue-ready/Stop structure
- asks for too much user reconstruction

### H. Audit/hardening gap
Examples:
- final audit not triggered
- hardening docs not generated
- hardening passes do not continue automatically

### I. CLI/runtime posture gap
Examples:
- Codex and Claude behavior not equivalent enough
- shell assumptions not supported by CLI runtime posture
- runtime instructions too vague

---

# Gap handling rules

## Rule 1 — Log before patching if the gap is meaningful
If a meaningful shell behavior issue is discovered during dry run, it should be logged before or while fixing it.

Do not silently patch important shell behavior gaps without recording them.

---

## Rule 2 — Fix the right artifact
Each gap should be resolved by updating the shell artifact most responsible for the behavior.

Do not fix a resume problem by stuffing extra behavior into an unrelated prompt if the real issue belongs in:
- `shell/reusable/REUSABLE_SHELL_RESUME_CONTRACT.md`
- or `shell/reusable/REUSABLE_SHELL_WORKFLOW.md`

Do not fix a closeout issue by patching a random runtime note if it truly belongs in:
- `shell/reusable/REUSABLE_SHELL_PACKAGE_CLOSEOUT_CHECKLIST.md`

The gap log helps enforce this discipline.

---

## Rule 3 — Revalidate after fixing
A gap is not closed merely because a doc was updated.

It should be re-tested at the smallest meaningful scope.

Possible validation methods:
- rerun the exact dry-run step
- rerun the relevant prompt path
- rerun the interrupted resume case
- rerun the blocked-package handoff case
- rerun package closeout

Only after that should the gap move to:
- `validated_closed`

---

## Rule 4 — Accepted caveats must be explicit
If a gap is not worth fixing immediately, it may be marked:
- `accepted_caveat`

But the reason must be stated clearly.

This should be used sparingly.

---

## Rule 5 — Non-gaps should be marked clearly
If investigation shows something is not actually a shell gap, mark it:
- `not_a_shell_gap`

Do not silently remove it from the record.

That preserves auditability.

---

# Suggested operating views for the gap log

The gap log can be read in several useful ways.

## By severity
- What must be fixed before shell v1?
- What can wait?

## By phase
- Which lifecycle phases are least stable?

## By artifact
- Which shell docs are causing the most behavioral gaps?

## By status
- What is still open?
- What is pending validation?
- What is closed?

This makes the gap log useful as both a debugging tool and a readiness tool.

---

# Suggested shell v1 gating rule

The shell should not be declared v1 ready if any of the following remain:

- open Critical gaps
- open High gaps affecting:
  - `begin`
  - `continue`
  - blocked-package handoff
  - package closeout
  - final audit generation
  - hardening continuation
  - final closeout

Medium or Low gaps may still be acceptable if they are clearly documented and do not undermine core shell behavior.

---

# Example entries

## SG-001 — Resume restarts planning instead of resuming package execution

- **Date discovered:** YYYY-MM-DD
- **Detected during:** dry run
- **Workflow phase:** Phase C — Package execution
- **Severity:** Critical
- **Status:** open

### Symptom
After interrupting package execution and typing `continue`, the shell restarted planning-generation behavior instead of resuming the active package.

### Expected behavior
The shell should have inspected artifacts and git state, detected the active incomplete package, and resumed that package.

### Likely responsible shell artifact(s)
- `shell/reusable/REUSABLE_SHELL_RESUME_CONTRACT.md`
- `shell/reusable/REUSABLE_SHELL_PROMPTS.md`
- `shell/reusable/REUSABLE_SHELL_WORKFLOW.md`

### Root cause hypothesis
Phase inference rules are too weak and over-prioritize planning artifacts instead of recent package logs and dirty-tree state.

### Proposed fix
Strengthen resume-state inference rules to prioritize recent package execution state and unresolved package-closeout signals.

### Validation plan
Interrupt execution again during a package and rerun `continue`.

### Validation result
Not yet tested.

### Notes
None.

---

## SG-002 — Generated drift not reverted before package commit

- **Date discovered:** YYYY-MM-DD
- **Detected during:** dry run
- **Workflow phase:** Phase C — Package execution
- **Severity:** High
- **Status:** open

### Symptom
`next-env.d.ts` remained dirty after the package appeared complete, and the shell proceeded toward commit without reverting it.

### Expected behavior
The shell should have classified the file as generated drift and reverted it before package closeout.

### Likely responsible shell artifact(s)
- `shell/reusable/REUSABLE_SHELL_GENERATED_DRIFT_RULES.md`
- `shell/reusable/REUSABLE_SHELL_PACKAGE_CLOSEOUT_CHECKLIST.md`

### Root cause hypothesis
Generated-drift handling was documented but not enforced strongly enough during closeout logic.

### Proposed fix
Strengthen closeout sequence to require drift classification before staging and commit.

### Validation plan
Repeat a package closeout scenario where `next-env.d.ts` changes.

### Validation result
Not yet tested.

### Notes
None.

---

# Suggested section for active gaps

If helpful during active testing, the top of the file may include a short live summary like:

## Active gap summary

- Critical open: 0
- High open: 0
- Medium open: 0
- Low open: 0

This section is optional, but useful once multiple gaps exist.

---

# Relationship to other shell docs

This file must remain aligned with:

- `shell/reusable/REUSABLE_SHELL_PACKAGE_PLAN.md`
- `shell/reusable/REUSABLE_SHELL_RUNTIME_SPEC.md`
- `shell/reusable/REUSABLE_SHELL_WORKFLOW.md`
- `shell/reusable/REUSABLE_SHELL_PROMPTS.md`
- `shell/reusable/REUSABLE_SHELL_RESUME_CONTRACT.md`
- `shell/reusable/REUSABLE_SHELL_ESCALATION_TEMPLATE.md`
- `shell/reusable/REUSABLE_SHELL_PACKAGE_CLOSEOUT_CHECKLIST.md`
- `shell/reusable/REUSABLE_SHELL_GENERATED_DRIFT_RULES.md`
- `shell/reusable/REUSABLE_SHELL_IMPLEMENTATION_SEQUENCE.md`
- `shell/reusable/REUSABLE_SHELL_DRY_RUN_PLAN.md`

If those docs change materially, the gap log structure should still remain compatible.

---

# Final conclusion

The reusable shell should be improved through a disciplined gap log, not through random patching.

This document exists to ensure that:
- shell failures are recorded
- shell fixes are traceable
- shell readiness is judged honestly
- and shell v1 is declared only after real behavioral gaps are addressed