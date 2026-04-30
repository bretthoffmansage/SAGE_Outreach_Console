# REUSABLE_SHELL_PACKAGE_CLOSEOUT_CHECKLIST

## Purpose

This document defines the required closeout sequence the reusable autonomous shell must perform after each completed package.

Its job is to make package completion:

- truthful
- reviewable
- committed
- resumable
- clean

This checklist is not optional in the final shell.

A package is not truly complete just because implementation and validation finished.

A package is only operationally complete when the shell has also:

- reviewed the package diff
- handled recurring generated drift
- committed the package
- verified a clean tree
- left the repo ready for the next package

---

## Core closeout rule

After each completed package, the shell must automatically perform package closeout before moving to the next package.

The shell must not continue into the next package with a dirty tree unless:

- the current package is still actively in progress
- or a real blocker prevents closeout

This checklist defines that closeout contract.

---

## Inter-package boundary (no silent multi-package commits)

**Default:** one honestly completed package → **one** closeout commit → clean tree → **then** start work on the next package.

The shell must **not** treat “the next package also needs these files” as permission to **defer** closeout, **skip** the commit for the current package, or **merge** two completed units into a single commit.

### Required sequencing

- When the **current** package is complete enough to close, the shell must **finish package closeout** (inspect, drift handling, stage, commit, verify clean tree) **before** making **any** further repo edits for the **next** package.
- The shell must **not** “stream” work across the boundary by continuing to edit the same paths after the current package is logically complete but **before** that package’s commit lands.
- **Overlap of file paths between adjacent packages is normal.** Shared files do **not** justify collapsing package boundaries or batching commits. Close out package *N* on its own commit; then begin package *N+1*.

### If a single clean commit per package is truly impossible

This should be rare. When it happens, the shell must **not** silently combine units.

It must create an **explicit, documented** boundary—for example: a truthful note in the package run log, an honest package-status or execution note, and/or structured escalation—stating why one commit cannot yet represent one package, what checkpoint was used instead, and how review should treat the boundary.

### Unavoidable exceptions

If the operator or reality forces an exception (e.g. an emergency fix that must ride with an adjacent package), it must be:

- **explicit** in chat and/or `agent_runs/`
- **honest** in the closeout trail
- **called out** in `FINAL_EXECUTION_AUDIT.md` (or equivalent final closeout summary) so reviewers see the merged boundary on purpose—not as an accident

---

## Git write serialization and index lock safety

### No overlapping git mutations

During closeout for a **single** completed unit, the shell must treat the repo as **single-writer** for **mutating** git operations:

- Do **not** run interleaved or concurrent git **writes** (e.g. multiple `git add` / `git commit` sequences, mixed with `stash`, `merge`, `rebase`, or other index-updating commands) as if they were independent—complete one closeout **commit** sequence before starting unrelated git writes.
- Do **not** overlap closeout git work with other tools or agents that may run git against the same repo in parallel when that risks competing for the index.
- Keep a **stable sequence**: inspect and classify the working tree (**read-only** inspection first where practical), then stage, then commit, then verify—avoid hopping between incomplete write steps.

This reduces `index.lock` failures and other overlapping-mutation fragility observed in real runs.

### If `.git/index.lock` exists or git reports a locked index

- **Do not** remove `.git/index.lock` or force ahead **by default**.
- **Do not** assume the lock is **stale** without evidence the shell can **safely** rely on.

**Conservative recovery posture:**

1. Determine whether another **legitimate** git process is active (same machine/session, IDE, hook, second agent, etc.).
2. If a short-lived concurrent operation is **clearly** finishing, a **brief** wait and **one** retry of a **read-only** inspection (e.g. `git status`) may be appropriate.
3. If the lock **persists**, provenance is **unclear**, or the shell cannot **safely** conclude the lock is stale, **stop mutating git** and **escalate** with structured escalation—do **not** guess, and do **not** delete the lock as a routine fix.

Lock removal is only appropriate when the **operator or environment** has **explicitly** confirmed it is safe (e.g. confirmed crashed process, no other git activity). The shell must not treat “probably stale” as sufficient grounds on its own.

---

## Closeout goals

The package closeout sequence exists to ensure:

1. completed work is preserved
2. package boundaries remain reviewable
3. generated drift does not accumulate
4. resume behavior remains reliable
5. later package work does not blur together with earlier package work
6. the shell leaves behind a clean state after each completed package

---

## When this checklist must run

This checklist must run after:

- a package is marked complete
- a package is completed after blocked-package expansion
- a package is resumed after interruption and then completed
- a package completes after in-scope repair of failed validation

This checklist should not run prematurely while a package still has unresolved validation or unresolved in-scope work.

---

## When this checklist must not run

This checklist must not run as if a package were complete when:

- required validation is still failing
- regression checks are still failing
- the package is blocked or needs_review
- package scope is still actively in progress
- the tree includes incomplete changes from the active package that are not yet ready for commit

In those cases, the shell must continue package work rather than forcing closeout.

---

# Package closeout sequence

The shell must perform the following sequence in order.

## Step 1 — Confirm package completion honestly

Before any commit work begins, the shell must confirm:

- the package is actually complete
- required checks passed
- regression checks passed
- no unresolved blocker remains inside package scope
- the package log reflects reality

If any of those are false, the shell must not begin closeout yet.

---

## Step 2 — Inspect changed files

The shell must inspect which files changed during the package.

Minimum checks:
- `git status`
- `git diff --stat`

Purpose:
- identify package files
- identify new artifacts/logs/docs
- identify possible unrelated drift
- identify whether the dirty tree matches the completed package scope

---

## Step 3 — Identify intended package artifacts

The shell must distinguish between:

### Intended package changes
Examples:
- package code changes
- package docs
- run logs
- expansion logs
- updated control docs if part of the package
- package-related config changes
- package-specific tests/validation artifacts if intentionally created

### Unintended or recurring drift
Examples:
- `next-env.d.ts` drift
- generated files changed only because of build or dev tooling
- unrelated local changes not belonging to the package

This distinction is mandatory.

The shell must not commit noise casually.

---

## Step 4 — Handle recurring generated drift

If a known recurring generated file changed but is not intentional package work, the shell must revert it before staging the package.

### Known example
- `next-env.d.ts`

### Required behavior
1. detect the drift
2. determine whether it belongs to package scope
3. if not intentional, revert it automatically
4. re-check git state afterward

The user should not need to do this manually.

---

## Step 5 — Verify there are no unrelated changes

Before staging, the shell must ask:

- do all remaining changes belong to the completed package?
- is anything leftover from a previous interrupted step?
- is anything obviously unrelated to this package?

If unrelated changes exist, the shell must not blindly commit them.

Instead, it must:
- isolate them
- determine whether they belong to unresolved prior work
- or escalate if state is genuinely ambiguous

---

## Step 6 — Stage all package-relevant files

The shell must stage:

- all intended package code changes
- all intended package docs
- all run logs
- all expansion logs if applicable
- all package-created files
- all package-updated files that truthfully belong to the package outcome

The shell must not leave legitimate package files unstaged if the package is being closed.

---

## Step 7 — Create the package commit

The shell must create a package-level commit after staging.

### Commit content requirements
The commit should:
- correspond to the completed package
- include all intended package artifacts
- exclude unintended noise
- be reviewable as one coherent package unit

### Commit message guidance
The shell should use a concise message that clearly identifies the completed unit.

Examples:
- `Complete WP-4.1 proposal system foundation`
- `Complete hardening Pass 2 lint and validation baseline`
- `Add final execution audit`

The exact wording may vary, but the completed unit must be identifiable.

---

## Step 8 — Verify clean tree after commit

After the commit, the shell must run:

- `git status`

and confirm the working tree is clean.

### If the tree is clean
- package closeout is successful
- the shell may continue to the next package or phase

### If the tree is not clean
The shell must determine why.

Possible reasons:
- recurring generated drift reappeared
- unrelated leftover work exists
- staging was incomplete
- package closeout was partial
- there is a real state problem

The shell must resolve trivial issues automatically where safe.

The shell must not continue into the next package with a dirty tree just because the commit succeeded.

---

## Step 9 — Confirm closeout state for resume safety

After commit and clean-tree verification, the shell should be able to say:

- this package is complete
- its changes are committed
- its logs exist
- the tree is clean
- the next package can start safely
- `continue` later will not need to reconstruct this package manually

That is the true end of package closeout.

---

# Required post-closeout outputs

After a successful package closeout, the shell should have:

- completed package implementation
- truthful execution log
- truthful expansion log if applicable
- committed package changes
- clean tree
- package status updated honestly
- repo ready for next package or next phase

---

# Closeout rules for expanded packages

If a package was completed after blocked-package expansion, the closeout sequence must still treat it as one complete unit.

That means the shell should include:

- package rewrite in `EXECUTION_PACKAGES.md` if intentionally changed for that package
- expansion log
- execution log
- code/docs/config changes produced by that package

The user should not need a separate manual cleanup step between expansion and execution closeout.

---

# Closeout rules for resumed packages

If a package resumed after interruption and then completed, the shell must still perform the same closeout sequence.

Resume is not an excuse to weaken closeout discipline.

The shell must:
- detect the active package
- complete it
- perform full post-package closeout
- only then move on

---

# Closeout rules for hardening passes

This checklist should also apply, in equivalent form, to completed hardening passes.

That means after a hardening pass completes, the shell should:

- inspect diff/stat
- handle generated drift
- commit the pass if it made changes
- verify clean tree
- continue automatically to the next pass unless blocked

---

# Closeout rules for documentation-only units

If a completed unit is documentation-only, the shell must still perform closeout.

That includes:
- diff/stat review
- staging the new/updated docs
- commit
- clean-tree verification

Documentation-only work does not bypass closeout discipline.

---

# Dirty-tree resolution rules

If the tree remains dirty after a package commit attempt, the shell must classify the cause.

## Case 1 — Known generated drift only
Action:
- revert it automatically
- re-check status

## Case 2 — Package file accidentally unstaged
Action:
- stage and amend or recommit as appropriate
- re-check status

## Case 3 — Unrelated leftover changes from a prior incomplete unit
Action:
- determine whether the shell should resume/close that unit first
- do not silently ignore them

## Case 4 — Ambiguous or unsafe mixed state
Action:
- use structured escalation
- do not guess destructively

---

# Minimum shell checks during closeout

At minimum, every closeout should include:

- `git status`
- `git diff --stat`
- generated-drift handling check
- commit creation
- post-commit `git status`

Optional additional checks may be used if helpful, but these are the minimum required ones.

---

# Closeout success criteria

The package closeout sequence is only successful if all of the following are true:

- package completion was honest
- package logs exist
- intended package changes were committed
- unintended generated drift was handled
- the tree is clean
- the shell can safely move to the next package (without having already started the **next** package’s implementation before this package’s commit landed—see **Inter-package boundary**)
- later `continue` calls will not need the user to reconstruct this package manually

---

# Closeout failure conditions

The shell should treat closeout as failed if:

- package is not actually complete
- required checks are still failing
- intended package files were not committed
- unrelated dirty state remains unresolved
- known generated drift remains unresolved
- post-commit tree is not clean
- state is ambiguous and the shell cannot safely classify it

In those cases, the shell must:
- attempt safe cleanup/correction
- or escalate if ambiguity remains real

---

# Suggested implementation checklist form

The shell may operationalize this checklist using a short internal checklist like:

```text
Package closeout checklist

[ ] package completion confirmed
[ ] required validation passed
[ ] regression checks passed
[ ] git status inspected
[ ] git diff --stat inspected
[ ] unintended generated drift reverted
[ ] remaining changes verified as package-relevant
[ ] package files staged
[ ] package commit created
[ ] post-commit git status clean
[ ] next package not started until this package’s commit + clean tree (inter-package boundary)
[ ] safe to continue
```

This exact formatting is optional, but the logic is required.

---

# Relationship to other shell docs

This checklist must remain aligned with:

- `shell/reusable/REUSABLE_SHELL_RUNTIME_SPEC.md`
- `shell/reusable/REUSABLE_SHELL_WORKFLOW.md`
- `shell/reusable/REUSABLE_SHELL_RESUME_CONTRACT.md`
- `shell/reusable/REUSABLE_SHELL_GENERATED_DRIFT_RULES.md`
- `shell/reusable/REUSABLE_SHELL_PROMPTS.md`

If those docs change materially, this checklist should be updated.

---

# Final conclusion

The reusable shell must not treat package completion as merely “the code seems done.”

A package is only truly complete when it has also been:

- reviewed
- logged
- committed
- cleaned
- stabilized for resume
- and separated from the next unit of work

This document defines that closeout contract.