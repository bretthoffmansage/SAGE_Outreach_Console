# REUSABLE_SHELL_ESCALATION_TEMPLATE

## Purpose

This document defines the structured escalation format the reusable autonomous shell must use when it truly cannot continue safely on its own.

Its job is to prevent vague stopping behavior.

The shell must not simply say:
- “I stopped”
- “I need input”
- “This is blocked”

Instead, it must raise a structured escalation that clearly explains:
- what is blocked
- why it is blocked
- what the user needs to decide or do
- what the available choices are
- what happens next under each choice

This template is a runtime interaction contract, not a product feature spec.

---

## Core escalation rule

The shell should only escalate after all of the following have already been attempted where appropriate:

1. normal package execution
2. in-scope self-correction
3. blocked-package expansion
4. iterative self-narrowing
5. resume-state reconstruction if the issue followed interruption
6. package closeout cleanup if the issue was a dirty-tree or partial-closeout issue

Escalation is not the first move.

It is the final move before a true stop.

---

## Core user-choice rule

When the shell escalates, it must offer a structured choice model.

At minimum, the choices must include:

- **Continue-ready**
- **Stop**

The shell must only actually stop if the user explicitly chooses **Stop**.

If the user provides the needed decision or chooses **Continue-ready**, the shell must resume from the blocked point automatically.

---

## When escalation is allowed

The shell may use this escalation template only when there is a real unresolved issue such as:

- safe narrowing failed even after iterative self-narrowing
- a true product or architecture decision is required
- a protected-data risk prevents safe execution
- environment safety is unclear in a way the shell cannot resolve
- workflow state is genuinely contradictory and cannot be inferred safely
- an external credential, environment variable, or operational precondition is required and the shell cannot provide it itself
- validation cannot be repaired in scope and the next safe action requires a user decision

The shell must **not** escalate for things it can fix itself.

---

## When escalation is not allowed

The shell must not use escalation merely because:

- a package completed successfully
- a draft package needs narrowing and narrowing has not been attempted yet
- the tree is dirty but package closeout cleanup has not been attempted yet
- `next-env.d.ts` drift appeared
- the CLI was interrupted but state is resumable
- the shell has not yet inspected artifacts/logs to determine current phase
- a known recurring issue is already covered by shell rules
- the shell simply prefers not to continue

In these cases, the shell must continue normal workflow behavior.

---

## Required escalation structure

Every structured escalation must contain all of these sections in this order:

1. **Escalation title**
2. **Blocked point**
3. **What the shell already attempted**
4. **Why the shell cannot continue safely**
5. **What input or action is needed**
6. **Available choices**
7. **What happens if you choose Continue-ready**
8. **What happens if you choose Stop**
9. **Suggested default if one exists**

This order is mandatory because it keeps the escalation understandable and actionable.

---

## Required tone

Escalations must be:

- direct
- specific
- concise
- non-dramatic
- non-vague
- non-accusatory

The shell must not sound confused, helpless, or theatrical.

It should sound like a disciplined operator explaining the next required decision.

---

# Escalation template

Use the following structure exactly.

```text
Escalation: [short specific title]

Blocked point:
- [current phase / package / hardening pass / runtime state]

What I already attempted:
- [attempt 1]
- [attempt 2]
- [attempt 3]

Why I cannot continue safely:
- [specific reason]
- [why this cannot be solved by more narrowing / self-correction / resume logic]

What input or action is needed from you:
- [specific decision, credential, confirmation, or operational action]

Available choices:

1. Continue-ready
   - [what the user should provide or confirm]
   - [what the shell will do next]

2. Stop
   - [what stopping means here]
   - [what state the shell will leave behind]

If you choose Continue-ready:
- I will [resume behavior]

If you choose Stop:
- I will [stop behavior]

Suggested default:
- [Continue-ready or Stop, with one-sentence reason if helpful]

# Field requirements

## 1. Escalation title

### Purpose
Provide a short name for the escalation.

### Requirements
- specific
- not generic
- should identify the kind of blocker

### Good examples
- `Escalation: Missing provider credential for internal AI validation`
- `Escalation: First safe external onboarding slice still requires domain posture decision`
- `Escalation: Resume state ambiguous between fresh start and interrupted run`

### Bad examples
- `Escalation: Problem`
- `Escalation: Need help`
- `Escalation: Blocked`

---

## 2. Blocked point

### Purpose
Tell the user exactly where the shell is stuck.

### Requirements
- include current phase
- include package ID or hardening pass if relevant
- include whether this is execution, expansion, audit, hardening, or closeout

### Example
- `Blocked point: Phase C package execution at WP-9.2`
- `Blocked point: Phase F hardening execution at Pass 2`
- `Blocked point: Resume mode before package execution because project state appears ambiguous`

---

## 3. What the shell already attempted

### Purpose
Show the user that the shell did real work before escalating.

### Requirements
- list concrete attempts
- include narrowing/self-correction/inspection steps where relevant
- do not exaggerate or pad the list

### Example
- inspected `EXECUTION_PACKAGES.md`
- applied blocked-package expansion
- attempted iterative self-narrowing
- reran validation
- inspected git state and recent logs
- attempted post-package closeout cleanup

---

## 4. Why the shell cannot continue safely

### Purpose
Explain why continued autonomous action would be unsafe or dishonest.

### Requirements
- must be specific
- must explain why shell rules do not already solve it
- must avoid vague phrases like “it feels risky”

### Good examples
- `The next slice still requires choosing between materially different routing architectures.`
- `The provider credential is required for a live validation step and is not available in the active environment.`
- `The repo state and artifact state disagree in a way that could cause duplicate or skipped package execution.`

---

## 5. What input or action is needed from the user

### Purpose
Convert the blocker into a concrete ask.

### Requirements
- be actionable
- be minimal
- be specific

### Good examples
- `Add OPENAI_API_KEY to the active backend runtime environment and confirm when ready.`
- `Choose whether the first launch slice should be internal-only setup tooling or external customer-admin onboarding.`
- `Confirm whether you want to resume the interrupted run or intentionally restart planning.`

---

## 6. Available choices

The shell must present choices explicitly.

### Required minimum choices
- `Continue-ready`
- `Stop`

Optional additional structured choices are allowed if truly useful, such as:
- `Resume existing run`
- `Restart planning`
- `Use Option A`
- `Use Option B`

But:
- there must always still be a path equivalent to **Continue-ready**
- and a path equivalent to **Stop**

---

## 7. What happens if the user chooses Continue-ready

### Purpose
Tell the user exactly how execution will resume.

### Requirements
- identify what the shell will do next
- identify where it will resume
- identify whether it will re-enter executor, expander, audit, or hardening mode

### Example
- `I will rerun the live AI validation for WP-9.2, close the package if it passes, commit the package, and continue to the next package in sequence.`

---

## 8. What happens if the user chooses Stop

### Purpose
Make stop explicit and non-ambiguous.

### Requirements
- describe what state will be preserved
- describe whether the shell will leave logs/docs/dirty tree/clean tree
- make clear that stop means actual stop

### Example
- `I will stop at WP-9.2, preserve the current logs and repo state, and wait for a later resume command.`

---

## 9. Suggested default

### Purpose
Help the user move forward without forcing a choice.

### Requirements
- optional in spirit, but should be provided whenever one path is clearly better
- should not be manipulative
- should be brief

### Example
- `Suggested default: Continue-ready, because the only blocker is environment credential setup and the package implementation is already in place.`

---

# Example escalations

## Example 1 — Missing provider credential

```text
Escalation: Missing provider credential for internal AI validation

Blocked point:
- Phase C package execution at WP-9.2

What I already attempted:
- implemented the internal-only AI rewrite workflow
- ran package validation
- verified internal access and portal denial
- reran build and Convex validation

Why I cannot continue safely:
- the required live AI invocation check cannot pass without a provider credential in the active backend runtime
- I cannot fabricate successful validation, and I cannot supply that credential myself

What input or action is needed from you:
- Add OPENAI_API_KEY to the active backend runtime environment and confirm when ready

Available choices:

1. Continue-ready
   - Add the credential and reply that it is ready
   - I will rerun the live AI validation, close WP-9.2 if it passes, commit the package, and continue

2. Stop
   - Stop the workflow here
   - I will preserve the current logs and repo state for later resume

If you choose Continue-ready:
- I will resume at WP-9.2 validation and continue forward automatically if it passes

If you choose Stop:
- I will stop here and wait for a later `continue`

Suggested default:
- Continue-ready, because the package implementation is already in place and the blocker is only environment configuration

# Escalation handling rules after user reply

## If the user chooses Continue-ready
The shell must:
1. interpret the user’s provided choice/input
2. return to the blocked point
3. resume the correct phase or package automatically
4. continue normal workflow behavior

## If the user chooses Stop
The shell must:
1. preserve logs and repo state
2. stop the workflow
3. leave a resumable state where possible

## If the user gives incomplete input
The shell may ask one smaller structured clarification question, but should still preserve the same choice model.

---

# Escalation and commit/clean-tree interaction

If escalation occurs while the tree is dirty, the shell must tell the user whether:

- the dirty state belongs to an incomplete current package/pass
- or package closeout still needs to happen
- or only generated drift remains

The escalation must not hide repo state.

If possible, the shell should clean trivial generated drift before escalating.

---

# Relationship to other shell docs

This template must remain aligned with:

- `shell/reusable/REUSABLE_SHELL_RUNTIME_SPEC.md`
- `shell/reusable/REUSABLE_SHELL_WORKFLOW.md`
- `shell/reusable/REUSABLE_SHELL_RESUME_CONTRACT.md`
- `shell/reusable/REUSABLE_SHELL_PROMPTS.md`

If those docs change materially, this template should be updated to match.

---

# Final conclusion

The reusable shell must not fail vaguely.

When the shell truly cannot continue safely, it must raise a structured escalation that is:

- explicit
- actionable
- resumable
- choice-based

The shell should only actually stop if the user explicitly chooses **Stop**.

That is the contract defined here.