# POST_BUILD_FIDELITY_AUDIT_TEMPLATE

## Purpose

This document runs the built-in post-build functional fidelity audit after hardening and before final closeout.

It validates:

1. original source intent (raw PRD)
2. normalized interpreted intent (`PRD_SOURCE.md`)
3. implemented product state (built application)
4. planning/audit evidence consistency

The goal is fidelity, not speculative expansion.

---

## Audit rules

1. Preserve source hierarchy:
   - raw PRD -> `PRD_SOURCE.md` -> built product.
2. Check transformed-intent quality (drift, omission, compression, interpretation mismatch).
3. Build a normalized feature/intent map from the validated PRD pair.
4. Evaluate implemented state against that map.
5. Classify each item using:
   - aligned
   - thin
   - partial
   - misplaced
   - missing
   - deferred
6. Distinguish acceptable MVP minimalism from material misalignment.
7. Do not use this phase to justify unsupported scope expansion.

---

## Inputs used

- raw PRD
- `PRD_SOURCE.md`
- `CURRENT_STATE_AUDIT.md`
- `MASTER_ROADMAP.md`
- `EXECUTION_PACKAGES.md`
- `FINAL_EXECUTION_AUDIT.md`
- `POST_EXECUTION_HARDENING_PLAN.md`
- `POST_EXECUTION_HARDENING_TASKS.md`
- relevant `agent_runs/` logs
- current repo/worktree implementation state

---

## Source hierarchy check

### Raw PRD integrity
- [What source intent is explicit and material]

### PRD transformation quality (`PRD_SOURCE.md`)
- [What is preserved well]
- [Where transformation introduced risk]

### Drift/omission/compression/interpretation findings
- [Finding 1]
- [Finding 2]
- [Finding 3]

---

## Normalized feature/intent map

| Intent ID | Raw PRD anchor | `PRD_SOURCE.md` anchor | Intent summary | Priority |
|---|---|---|---|---|
| `INTENT-x` | [anchor] | [anchor] | [summary] | [high/med/low] |

Repeat for material intent items.

---

## Built-product fidelity assessment

| Intent ID | Product evidence | Classification | MVP-minimal acceptable? | Notes |
|---|---|---|---|---|
| `INTENT-x` | [code/docs/workflow evidence] | [aligned/thin/partial/misplaced/missing/deferred] | [yes/no] | [reason] |

---

## Material misalignment summary

List only items that are materially underbuilt or misaligned relative to intended functionality.

- [Gap 1]
- [Gap 2]
- [Gap 3]

---

## Recommended bounded uplift targets

These should feed directly into `FIDELITY_UPLIFT_PLAN.md`.

1. [Target 1]
2. [Target 2]
3. [Target 3]

Out of scope in this phase:
- speculative features unsupported by validated intent
- broad redesign work
- stylistic over-polish unrelated to functional fidelity

---

## Post-uplift re-audit section

Update this section after uplift execution.

### Improved
- [Item]

### Still deferred
- [Item + rationale]

### Remaining misalignment requiring later phases
- [Item + candidate later phase]

---

## Final fidelity judgment

State:
- current fidelity posture versus original intent
- what is now aligned
- what remains intentionally deferred
- whether Phase E is complete enough to proceed

---

## Minimal completion checklist

- source hierarchy explicitly used
- transformed-intent issues audited
- normalized intent map present
- implementation classified with required categories
- acceptable minimalism vs misalignment distinguished
- bounded uplift targets identified
- post-uplift re-audit section updated
- deferred gaps explicitly documented
