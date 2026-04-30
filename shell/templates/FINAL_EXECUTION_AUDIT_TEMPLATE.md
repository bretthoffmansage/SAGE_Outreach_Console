# FINAL_EXECUTION_AUDIT_TEMPLATE

## Purpose

This document is the closeout audit of the execution-package program as completed in the active worktree or repo.

It should evaluate the full program using:

1. `EXECUTION_PACKAGES.md`
2. `shell/control/AGENT_OPERATING_RULES.md`
3. `shell/control/PACKAGE_EXPANSION_PROTOCOL.md`
4. `PRD_SOURCE.md`
5. `MASTER_ROADMAP.md`
6. `CURRENT_STATE_AUDIT.md`
7. all relevant logs in `agent_runs/`
8. the final codebase or worktree state
9. final audit-adjacent docs if present
10. post-execution hardening docs if present

It must be intentionally evidence-based, not aspirational.

This document is not a marketing summary.
It is a truthful closeout judgment.

---

## Audit rules

1. Do not claim completion without evidence.
2. Distinguish code-complete from environment-complete where relevant.
3. Distinguish strongly evidenced results from partially evidenced results.
4. Preserve caveats honestly.
5. Do not upgrade weak evidence into strong completion claims just to make the program look cleaner.
6. Record what was intentionally deferred, not just what was built.
7. **PRD coverage accounting:** treat any **material** PRD requirement that is still **unaccounted for** (fits none of: implemented now; scheduled in a package; intentionally deferred; explicitly out of scope; ambiguous / requires clarification) as a **defect in planning or audit quality**—call it out explicitly; do not silently accept orphaned PRD items.
8. The audit should remain useful for:
   - closeout
   - hardening
   - future reuse
   - external review
   - shell packaging

---

## How to use this template

When generating `FINAL_EXECUTION_AUDIT.md`:

- inspect final package statuses
- inspect execution and expansion logs
- inspect the final repo/worktree state
- compare delivered work to the roadmap and PRD
- verify **PRD coverage accounting** (`REUSABLE_SHELL_WORKFLOW.md`): flag **material** PRD items that remain unaccounted for
- identify evidence gaps
- identify environment gaps
- identify major architectural outcomes
- identify what was deferred intentionally
- recommend the next hardening phase
- distinguish what is truly proven from what is merely suggested

This document should help later readers answer:

- what did the execution program actually accomplish?
- what is strongly evidenced?
- what is still caveated?
- what is built in code?
- what still depends on environment or operational follow-up?
- what should hardening focus on next?

---

# Document structure

## Purpose

This document is a closeout audit of the execution-package program as implemented in this worktree or repo.

It is intentionally evidence-based, not aspirational.

---

## Executive conclusion

### Program completion summary
[State whether the execution-package program reached the end of the listed execution packages, and what that means.]

### Main conclusion
[Plain-language overall conclusion.]

### Most important delivered outcomes
- [Outcome 1]
- [Outcome 2]
- [Outcome 3]

### Most important caveats
- [Caveat 1]
- [Caveat 2]
- [Caveat 3]

### Truthful closeout statement
Summarize the program in a form like:

- **code-complete for [scope]**
- **not fully environment-complete for [reason]**
- **substantially complete but with caveats in [area]**
- **not fully complete because [reason]**

This section should be concise but exact.

---

## Scope and evidence limitations

List any limitations that affect the strength of the audit.

### What is strongly evidenced
- [Strong evidence area 1]
- [Strong evidence area 2]
- [Strong evidence area 3]

### What is only partially evidenced
- [Partial evidence area 1]
- [Partial evidence area 2]
- [Partial evidence area 3]

### What is doc-evidenced only
- [Doc-evidenced area 1]
- [Doc-evidenced area 2]

### Audit stance on those gaps
[Explain how the audit treats weak evidence or missing logs.]

If supporting addendum docs exist, cross-reference them here.

Examples:
- evidence reconciliation doc
- environment gap doc
- validation baseline doc
- lint findings doc

---

## Code-complete vs environment-complete

### Code-complete

Describe what is actually implemented in the codebase or repo now.

Examples:
- routes
- domain entities
- feature systems
- access helpers
- runtime flows
- audit/hardening artifacts
- shell mechanics if auditing the shell itself

List the major implemented capabilities:

- [Capability 1]
- [Capability 2]
- [Capability 3]

### Environment-complete

State whether the system is environment-complete for its intended operational use.

If not, explain why.

Common reasons:
- safe-dev only validation
- missing seed data
- missing production-like environment proof
- missing deployment verification
- intentionally deferred external launch work
- unverified integration environments

### Rule
Do not collapse code-complete and environment-complete into a single judgment if they differ materially.

---

## Most important environment or operational caveat

This section should identify the single most important environment or operational caveat still affecting truthful closeout.

### Caveat summary
[Describe the caveat.]

### Evidence
- [Evidence point 1]
- [Evidence point 2]
- [Evidence point 3]

### Why this matters
[Explain why this is the most important remaining non-code caveat.]

### What this does not invalidate
[Clarify what code-level accomplishment still stands.]

---

## Major architecture outcomes

List the major architectural outcomes produced by the execution program.

### 1. [Outcome title]
[Description of what changed architecturally and why it matters.]

### 2. [Outcome title]
[Description.]

### 3. [Outcome title]
[Description.]

### 4. [Outcome title]
[Description.]

Use as many sections as needed, but only for outcomes that actually matter.

Examples:
- auth/access boundaries became real
- the primary domain object became the operational center
- a source-of-truth boundary held through later packages
- legacy systems were contained rather than merged
- internal and external shells separated
- late hardening stayed narrow and sequence-correct

---

## Major deferred decisions

List the most important intentionally unsolved areas.

These should be genuine deferrals, not hidden failures.

- [Deferred decision 1]
- [Deferred decision 2]
- [Deferred decision 3]
- [Deferred decision 4]

Examples:
- external self-serve onboarding
- custom domains
- public launch architecture
- full AI platform
- unresolved legacy migration
- environment seeding follow-up
- full CI/test hardening

---

## Package-by-package completion table

Use a table that evaluates every package honestly.

### Suggested legend

- `Complete` = execution log shows completion
- `Complete (expanded)` = package was expanded from draft and then completed
- `Partial / caveated` = substantial intent satisfied, but evidence or completion status remained caveated
- `Deferred / blocked` = not completed as written
- `Doc-evidenced only` = supporting docs or later practice support it, but standalone execution evidence is weak or missing

### Table

| Package | Title | Audit outcome | Evidence basis | Key caveat |
|---|---|---|---|---|
| `WP-x.y` | [Title] | [Outcome] | [Evidence basis] | [Caveat] |

Repeat for every package in `EXECUTION_PACKAGES.md`.

This is one of the most important sections in the audit.

---

## What the current worktree or repo now contains

Summarize the final state at a high level.

Examples:
- major routes
- major modules
- major backend systems
- major shell/runtime documents
- major hardening artifacts
- critical cross-cutting patterns

### High-level summary
- [Area 1]
- [Area 2]
- [Area 3]

### Why this matters
[Explain how this final state reflects the roadmap arc.]

---

## Protected data and safety handling outcome

State whether the protected-data or protected-system posture appears to have held through the program.

### Evidence
- [Evidence point 1]
- [Evidence point 2]
- [Evidence point 3]

### Important caveat
If the audit did not rerun a protection baseline directly, say so explicitly.

Do not overclaim.

---

## Recommended next phase: post-execution hardening

This section should point forward into hardening.

### Recommended hardening posture
[Explain that the next phase should be hardening, not broad new feature work.]

### Recommended hardening focus areas
1. [Hardening area 1]
2. [Hardening area 2]
3. [Hardening area 3]
4. [Hardening area 4]

Examples:
- evidence cleanup
- environment/readiness clarification
- lint/tooling/CI hardening
- type-safety sweep
- shell/route/UX consistency
- legacy containment cleanup

If hardening plan/task docs already exist, reference them here.

---

## Reusable-shell or packaging inputs

If the project is also a source for reusable shell or reusable subsystem packaging, record the strongest reusable patterns here.

### Strong reusable candidates
- [Reusable candidate 1]
- [Reusable candidate 2]
- [Reusable candidate 3]

### Not yet reusable without more cleanup
- [Not-yet-reusable area 1]
- [Not-yet-reusable area 2]

This section is especially useful if the execution program is expected to generate reusable shells or repeated workflows later.

---

## Final audit judgment

This section should state the final closeout judgment clearly and without hedging.

Use a structure like:

The execution-package program should be considered:

- **[Judgment 1]**
- **[Judgment 2]**
- **[Judgment 3]**
- **[Judgment 4]**

Then identify:

### Most important unresolved non-code issue
[What matters most now if features are no longer the main concern.]

### Most important unresolved program-audit issue
[What evidence or process caveat matters most.]

### Final confidence statement
[Short concluding statement on what the audit proves and what it does not prove.]

---

## Appendix A — Audit inputs used

List the exact categories of evidence used.

- `EXECUTION_PACKAGES.md`
- `PRD_SOURCE.md`
- `CURRENT_STATE_AUDIT.md`
- `MASTER_ROADMAP.md`
- `agent_runs/`
- current code/worktree state
- [other docs if present]

---

## Appendix B — Optional supporting cross-references

List related closeout or hardening docs if they exist.

Examples:
- `POST_EXECUTION_EVIDENCE_RECONCILIATION.md`
- `SAFE_DEV_READINESS_GAP.md`
- `POST_EXECUTION_LINT_FINDINGS.md`
- `POST_EXECUTION_VALIDATION_BASELINE.md`
- `POST_EXECUTION_HARDENING_PLAN.md`
- `POST_EXECUTION_HARDENING_TASKS.md`

---

## Minimal completion checklist for generated FINAL_EXECUTION_AUDIT.md

A generated `FINAL_EXECUTION_AUDIT.md` should be considered good enough when:

- the overall execution-program outcome is clear
- code-complete vs environment-complete is distinguished where necessary
- major evidence gaps are treated honestly
- package-by-package outcomes are evaluated explicitly
- major architectural outcomes are identified
- major deferred decisions are identified
- the next hardening phase is recommended clearly
- the final judgment is useful for closeout and future review

---

## Final note

A good final execution audit should make it easy for later readers to answer:

- what did this program actually accomplish?
- what is truly proven?
- what is only partially evidenced?
- what is still environment-dependent?
- what was intentionally deferred?
- what should hardening do next?

That is the purpose of this template.