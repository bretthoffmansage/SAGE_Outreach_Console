# PACKAGE_CLOSEOUT_REFERENCE

## Purpose

This file is a quick runtime reference for how the reusable autonomous shell must close out a completed package or completed hardening pass.

It is a short operational reference.

It does not replace the full logic in:

- `shell/reusable/REUSABLE_SHELL_PACKAGE_CLOSEOUT_CHECKLIST.md`
- `shell/reusable/REUSABLE_SHELL_GENERATED_DRIFT_RULES.md`
- `shell/control/AGENT_OPERATING_RULES.md`
- `shell/control/AGENT_RUNTIME_SETUP.md`

Instead, it provides the short sequence the shell should follow every time a unit of work is complete and ready for closeout.

---

## Core rule

A package or hardening pass is **not complete enough to move on** until closeout has been performed.

Closeout is part of completion.

That means the shell must not treat:

- passing checks
- finished code
- finished docs
- updated logs

as sufficient by themselves.

The shell must also perform:

- git inspection
- drift handling
- commit creation
- clean-tree verification

before moving on.

---

## Inter-package boundary (handoff between packages)

**Prefer:** one completed package → one commit → clean tree → **then** edits for the next package.

- Do **not** begin implementation edits for package *N+1* while package *N* is complete but still **uncommitted** or the tree is **not** clean after *N*’s closeout.
- Do **not** justify delaying *N*’s commit because *N+1* will touch the **same files**. Overlap is expected; it is **not** a reason to merge two package boundaries into one commit.
- Do **not** “keep going” on the same files across a completed package line without closing *N* first—that collapses reviewability and violates the one-unit-one-boundary contract.

If a true **one commit per package** boundary cannot be made safely yet, do **not** silently batch. Document an explicit checkpoint (run log / honest status / escalation) and call out any unavoidable exception in the final audit trail.

---

## What counts as a closeout unit

This reference applies to:

- completed execution packages
- completed hardening passes
- any other completed shell unit that changed repo contents in a meaningful way

It does **not** apply to:

- inspection-only sessions
- quick triage sessions with no meaningful repo changes
- structured escalation messages that produced no repo changes

---

## Required closeout sequence

After a package or pass is complete, the shell must:

1. confirm the active unit is actually complete enough to close, and treat upcoming closeout git work as **single-writer**: no overlapping **mutating** git operations for this unit (no interleaved commits/stash/rebase races with another process); if `.git/index.lock` appears, follow **conservative** handling in `shell/reusable/REUSABLE_SHELL_PACKAGE_CLOSEOUT_CHECKLIST.md` (do not blindly delete the lock; escalate if staleness cannot be verified safely)
2. inspect `git status`
3. inspect `git diff --stat`
4. inspect changed files if classification is unclear
5. classify:
   - intended work
   - generated drift
   - ambiguous leftovers
6. revert non-intentional generated drift where safe
7. verify remaining changes belong to the completed unit
8. ensure required logs/artifacts are updated
9. commit the completed unit
10. inspect `git status` again
11. confirm the tree is clean
12. only then continue to the next package or hardening pass

Steps 1–12 are an ordered sequence: establish what changed **before** staging/commit, then commit, then re-verify—do not bounce between incomplete git write steps.

---

## Clean-tree rule

A completed unit should leave behind a clean tree.

The shell must not continue into the next completed unit with a dirty tree unless:

- the current unit is still actively in progress
- or a true blocker prevents clean closeout and has been escalated truthfully

Normal completed-package continuation requires a clean tree.

---

## Generated drift rule

The shell must explicitly check for recurring generated drift.

### Known example
- `next-env.d.ts`

If a generated file changed but was **not** part of intentional package/pass scope, the shell should revert it before committing.

The operator should not need to manually clean this up during normal shell operation.

---

## Commit rule

The shell should create a commit after each completed package or completed hardening pass when repo changes were made.

That commit should reflect:

- the completed unit of work
- truthful scope
- completed closeout
- no unrelated leftovers

The shell should **not** batch multiple **completed** packages into one commit. **Shared files between adjacent packages are not an excuse** to merge boundaries—close out each package on its own commit, then continue.

The only allowed deviation is a **rare, explicit** exception: documented in run logs and **called out** in the final audit / closeout trail (see **Inter-package boundary** above). There is no “silent” multi-package commit.

---

## Minimum closeout checks

Before continuing, the shell should be able to answer **yes** to all of these:

- Is the package/pass actually complete enough to close?
- Were required checks run?
- Were regression checks run where relevant?
- Was `git status` inspected?
- Was `git diff --stat` inspected?
- Was generated drift checked?
- Was non-intentional generated drift handled?
- Were logs/artifacts updated?
- Was the completed unit committed?
- Is the tree clean now?

If the answer to any of these is no, the shell should not move on yet.

---

## Common bad closeout behaviors to avoid

The shell should not:

- continue after “code looks done” without git inspection
- leave `next-env.d.ts` drift behind unintentionally
- leave updated logs uncommitted
- mix multiple completed units into one sloppy commit (including because the **next** package will edit the **same** paths)
- start the next package’s edits before the current package’s closeout commit and clean-tree check complete
- ignore a dirty tree and jump to the next package
- assume generated files are harmless without checking
- rely on the operator to perform normal closeout manually

---

## Relationship to resume behavior

Closeout is tightly connected to resume behavior.

A cleanly closed package makes `continue` reliable.

A poorly closed package creates ambiguity around:

- what was finished
- what was committed
- what drift was intentional
- what the shell should resume next

That is why closeout is not optional housekeeping.
It is part of workflow correctness.

---

## Relationship to blocked-package expansion

If a package was expanded from draft, normal closeout still applies after execution of that package completes.

The shell must not require:

- manual log deletion
- manual executor/expander stitching
- special manual git cleanup

Expansion is a package-shaping step.
Closeout still happens after the actual package execution is complete.

---

## Operator quick guide

During normal shell behavior, the operator should not need to manually:

- inspect `git status` for closeout
- inspect `git diff --stat` for closeout
- revert recurring generated drift
- commit the completed package
- verify clean-tree state before continuation

Those are shell responsibilities.

The operator should only intervene if:

- the shell raises a true structured escalation
- repo state is genuinely ambiguous in a way the shell cannot safely resolve
- or the user intentionally wants to stop the workflow

---

## Relationship to other shell docs

This file is a quick reference only.

It must remain aligned with:

- `shell/reusable/REUSABLE_SHELL_PACKAGE_CLOSEOUT_CHECKLIST.md`
- `shell/reusable/REUSABLE_SHELL_GENERATED_DRIFT_RULES.md`
- `shell/reusable/REUSABLE_SHELL_RESUME_CONTRACT.md`
- `shell/control/AGENT_OPERATING_RULES.md`
- `shell/control/AGENT_RUNTIME_SETUP.md`

If those docs change materially, this reference should be updated.

---

## Final conclusion

A unit of work is not truly complete until it is cleanly closed out.

For the reusable shell, closeout means:

- inspect git state
- handle drift
- commit the completed unit
- verify clean tree
- then continue

This file is the quick runtime reference for that behavior.