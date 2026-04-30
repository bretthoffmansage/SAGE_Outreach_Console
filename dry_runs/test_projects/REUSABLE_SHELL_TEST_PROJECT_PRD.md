# REUSABLE_SHELL_TEST_PROJECT_PRD

## Purpose

This document is the intentionally small test PRD for the first end-to-end dry run of the reusable autonomous shell.

Its purpose is **not** to create a complex product.

Its purpose is to give the shell a small but realistic project that is rich enough to test:

- `begin` / `start`
- PRD normalization
- current-state audit generation
- roadmap generation
- execution-package generation
- one or more ready packages
- at least one draft package that should be narrowed
- package closeout and commit behavior
- interruption and `continue`
- final audit generation
- hardening plan and hardening task generation
- hardening pass progression
- final closeout

This PRD is intentionally small so shell behavior is easy to inspect.

---

## Project name

**MicroLaunch Tracker**

---

## Project summary

MicroLaunch Tracker is a tiny internal tool for tracking small launch items for a team.

The first version should let a user:

- create launch items
- view a list of launch items
- mark a launch item as complete
- optionally filter the list by status

The product is intentionally simple.

The shell dry run is about testing the reusable workflow, not product ambition.

---

## Product goals

The first version of MicroLaunch Tracker should:

1. provide a small internal interface for launch-item tracking
2. support a minimal launch-item data model
3. support a basic list/detail or list/update workflow
4. support completion status updates
5. support at least one lightweight view/filter behavior
6. leave behind a believable tiny working product surface

---

## Constraints

This project should stay intentionally small.

Constraints:

- internal-only
- no auth complexity required for the dry run unless the shell decides a minimal placeholder is needed
- no external integrations
- no payment/billing
- no notifications as a core requirement
- no mobile app
- no public-facing site required
- no heavy styling requirements
- no complex role system
- no AI requirement

The shell should avoid overbuilding.

---

## Minimum product scope

The minimum viable version should include:

### Launch item fields
At minimum:
- title
- short description or notes
- status
- optional due date

### Core actions
- create an item
- list items
- mark item complete
- show active vs completed state

### Basic view behavior
At least one of:
- active/all filter
- completed/all filter
- simple grouped status view

The shell may choose the thinnest safe version.

---

## Out of scope

The following are intentionally out of scope for the test project unless the shell chooses an extremely narrow internal placeholder for structural reasons:

- multi-user collaboration
- notifications
- analytics
- dashboards
- file uploads
- comments
- activity history
- AI features
- external portal
- public routing complexity
- advanced filtering/sorting
- labels/tags if not needed
- recurring tasks
- calendar integrations

The shell should not invent extra product layers just because they are common in real products.

---

## Suggested project posture for the shell

This test project is intended to produce a small but useful workflow.

The shell should likely interpret the safest first slices as something like:

- a tiny internal-only app
- one simple list/create/update loop
- maybe one filter or basic view slice
- maybe one cleanup/hardening pass for consistency afterward

But the shell should decide the actual package breakdown itself.

---

## Expected planning behavior

This PRD is intentionally written to encourage a shell package structure where:

- at least one early package is clearly ready
- at least one later package is plausibly draft and narrowable
- the shell has to do some judgment without needing big architecture invention

Examples of plausible package themes for the shell to discover:
- minimal data model + list surface
- create/update workflow
- status filtering or lightweight view behavior
- post-execution hardening

The shell should generate the actual roadmap and package list itself.

---

## Dry-run-specific intent

This PRD is meant to help test shell mechanics.

That means the shell should be able to demonstrate:

### 1. Fresh start behavior
A user should be able to type:
- `begin`
or
- `start`

and the shell should know it needs to start from PRD normalization.

### 2. Draft-first package generation
The shell should not pretend the whole tiny project is fully specified from the start.
It should still create a draft-first package list where appropriate.

### 3. Narrowing behavior
At least one package should plausibly be broad enough that the shell may need to narrow it into the thinnest executable slice.

### 4. Closeout behavior
After at least one completed package, the shell should:
- inspect diff/stat
- commit the package
- ensure a clean tree
- continue automatically

### 5. Resume behavior
The test run should be able to be interrupted and resumed with:
- `continue`

### 6. Closeout lifecycle
After package execution is exhausted, the shell should:
- generate final audit
- generate hardening plan
- generate hardening tasks
- execute hardening passes
- reach final closeout

---

## Non-functional expectations

Because this is a dry-run project, non-functional expectations should stay light.

Still, the shell should aim for:

- clear and small code changes
- truthful package scoping
- buildable state after completed package work
- clean repo state after package closeout
- no fake completion claims
- no product overbuild

---

## Intentional ambiguity allowed

The shell may still need to make some bounded decisions about:
- how simple the UI should be
- whether filter behavior belongs in the first version or a later package
- whether the product uses a tiny list-and-inline-update pattern or a slightly more structured create/list flow

That ambiguity is intentional.

It exists so the shell’s package planning and narrowing behavior can be observed.

However, the ambiguity is deliberately small enough that the shell should not need major human product input.

---

## Dry-run success definition for this test project

For this specific test project, a successful shell run would mean:

1. the shell generated all planning docs
2. the shell generated a reasonable package list
3. the shell completed the small product without needing major human rescue
4. the shell handled at least one package transition cleanly
5. the shell handled at least one draft/narrowing situation cleanly
6. the shell handled interruption and `continue`
7. the shell completed audit + hardening + closeout

The product itself does not need to be impressive.

The shell behavior does.

---

## Final note

This PRD is intentionally tiny.

If the shell behaves well on this project, that is a stronger proof of shell quality than overcomplicating the first dry run.

The shell should prefer:
- disciplined planning
- disciplined execution
- truthful closeout

over building unnecessary sophistication into MicroLaunch Tracker.