# Codex Shell Runtime Instructions

## Purpose

This file tells Codex how to operate inside this reusable autonomous shell repo.

It is not a product PRD.
It is a runtime instruction layer for Codex inside this project.

Codex must treat this repo as a reusable shell system, not as a normal app repo.

## Immediate trigger rule

These trigger words are workflow commands, not conversational prompts.
Do not answer them with a generic readiness question.

If the user message is exactly `begin` or `start`, do **not** reply with a generic readiness question.

Immediately:
1. inspect current repo/artifact state
2. determine the correct shell phase using `shell/reusable/REUSABLE_SHELL_RESUME_CONTRACT.md`
3. begin executing the shell workflow

If the user message is exactly `continue`, do **not** ask what to work on.

Immediately:
1. inspect current repo/artifact/log/git state
2. identify the nearest unresolved unit
3. resume executing from there

---

## Core rule

Before doing meaningful work, read and follow these files in this order:

1. `shell/control/AGENT_OPERATING_RULES.md`
2. `shell/control/AGENT_RUNTIME_SETUP.md`
3. `shell/control/PACKAGE_EXPANSION_PROTOCOL.md`
4. `shell/control/RUN_LOG_TEMPLATE.md`
5. `shell/reusable/REUSABLE_SHELL_WORKFLOW.md`
6. `shell/reusable/REUSABLE_SHELL_RUNTIME_SPEC.md`
7. `shell/reusable/REUSABLE_SHELL_PROMPTS.md`
8. `shell/reusable/REUSABLE_SHELL_RESUME_CONTRACT.md`
9. `shell/reusable/REUSABLE_SHELL_ESCALATION_TEMPLATE.md`
10. `shell/reusable/REUSABLE_SHELL_PACKAGE_CLOSEOUT_CHECKLIST.md`
11. `shell/reusable/REUSABLE_SHELL_GENERATED_DRIFT_RULES.md`
12. `shell/reusable/REUSABLE_SHELL_CLI_CONFIGS.md`
13. `shell/reusable/REUSABLE_SHELL_IMPLEMENTATION_SEQUENCE.md`

If the shell is in dry-run mode, also read:
- `shell/reusable/REUSABLE_SHELL_DRY_RUN_PLAN.md`
- `shell/reusable/REUSABLE_SHELL_GAP_LOG.md`
- `shell/reusable/REUSABLE_SHELL_DRY_RUN_RESULTS.md`
- `dry_runs/test_projects/REUSABLE_SHELL_TEST_PROJECT_PRD.md`

---

## Trigger interpretation

### Raw PRD on a fresh run (`raw_prd/`)
Before PRD intake when `PRD_SOURCE.md` does not exist, follow **`shell/reusable/REUSABLE_SHELL_RESUME_CONTRACT.md`** — **Canonical raw PRD intake (`raw_prd/`)**:
- If `raw_prd/` **exists** with exactly **one** top-level regular file → that file is the raw PRD.
- If `raw_prd/` **exists** with **zero** files → structured escalation (no raw PRD found); do not guess another path.
- If `raw_prd/` **exists** with **more than one** file → structured escalation (multiple candidates); do not guess.
- If `raw_prd/` **does not exist** → fall back to loose operator-provided PRD behavior (e.g. chat); no new mandatory root-level raw filename.

### If the user types `begin` or `start`
You must:
1. inspect artifact state
2. determine whether this is:
   - a fresh run
   - a partially initialized run
   - or an interrupted run that should resume
3. follow `shell/reusable/REUSABLE_SHELL_RESUME_CONTRACT.md`
4. choose the correct prompt/phase from `shell/reusable/REUSABLE_SHELL_PROMPTS.md`

Do not blindly restart work.

### Fresh-run local git (`git init`)
On a **fresh/new project** at the **shell project root**, before PRD intake or other git-dependent steps, follow **`shell/reusable/REUSABLE_SHELL_WORKFLOW.md` — Fresh-run local git repository (automatic `git init`)**: when **all** narrow criteria there are met and `.git` is missing, run `git init`, verify git works, then acknowledge/log with **explicit** wording (**newly initialized** vs **repository already present, init skipped**) so operators are not left interpreting ambiguous tool messages alone. **Never** re-init if `.git` exists. **Never** add remotes or GitHub. **Escalate** if nested-repo/root ambiguity makes init unsafe—do not guess.

### If the user types `continue`
You must:
1. enter resume mode
2. inspect repo state, artifact state, logs, and git state
3. identify the nearest unresolved unit of work
4. resume there automatically
5. continue forward according to `shell/reusable/REUSABLE_SHELL_WORKFLOW.md`

Do not require the user to specify package numbers in normal cases.

---

## Healthy handoff — same-run auto-continue

When the **current** workflow unit completes **successfully** and **all** of the following are true:

- no real blocker, failed validation, or protected-data risk
- no structured escalation is required
- no genuine user input or unresolved judgment is needed for the **next** step
- required validation and **unit-appropriate closeout** are complete (including git closeout when the unit changed the repo)

then **continue in the same run** to the **next valid** unit—including **across phase boundaries** when entry conditions are met (e.g. Phase A complete → Phase B)—without stopping only because a phase finished or the chat turn ended.

Do **not** use this to skip failed checks, dirty tree after a completed unit, ambiguity, or required escalation. Full normative wording: `shell/reusable/REUSABLE_SHELL_WORKFLOW.md` and `shell/reusable/REUSABLE_SHELL_PROMPTS.md`.

---

## Package execution rule

When in execution mode:
- execute packages in strict sequence
- if the next package is draft or underdefined, use `shell/control/PACKAGE_EXPANSION_PROTOCOL.md`
- expand only the next package
- after successful expansion, return automatically to the main executor
- do not require manual log deletion or manual handoff cleanup

---

## Package closeout rule

After each completed package or completed hardening pass:
1. inspect `git status`
2. inspect `git diff --stat`
3. classify intended files vs generated drift
4. revert non-intentional generated drift
5. commit the completed unit
6. verify the tree is clean
7. only then continue

**Git serialization and locks:** perform closeout as **single-writer**—no overlapping **mutating** git operations with other processes or interleaved write sequences. If `index.lock` appears, use the **conservative** rules in `shell/reusable/REUSABLE_SHELL_PACKAGE_CLOSEOUT_CHECKLIST.md` (do not blindly remove the lock; escalate if staleness cannot be verified safely).

You must follow:
- `shell/reusable/REUSABLE_SHELL_PACKAGE_CLOSEOUT_CHECKLIST.md`
- `shell/reusable/REUSABLE_SHELL_GENERATED_DRIFT_RULES.md`

Known recurring generated drift includes:
- `next-env.d.ts`

If `next-env.d.ts` changed but was not intentional package work, revert it before committing.

**Inter-package boundary:** do **not** begin edits for the **next** package until the **current** package’s closeout **commit** and **clean** `git status` are done. **Shared files** between adjacent packages do **not** permit merging two completed units into one commit. If a strict one-commit-per-package boundary is truly impossible, document an explicit checkpoint and disclose any unavoidable exception in the final audit—`shell/reusable/REUSABLE_SHELL_PACKAGE_CLOSEOUT_CHECKLIST.md` — **Inter-package boundary**.

---

## Escalation rule

If you truly cannot continue safely after:
- normal execution
- self-correction
- blocked-package expansion
- iterative self-narrowing
- resume-state reconstruction
- package closeout cleanup

then use:
- `shell/reusable/REUSABLE_SHELL_ESCALATION_TEMPLATE.md`

You must present:
- blocked point
- what you already attempted
- why you cannot continue safely
- what input is needed
- Continue-ready
- Stop

Do not stop unless the user explicitly chooses Stop.

---

## Hardening continuation rule

After execution packages are exhausted:
1. generate final audit if missing
2. generate hardening plan if missing
3. generate hardening tasks if missing
4. execute hardening passes in order
5. continue automatically from one completed pass to the next unless blocked

Do not stop between hardening passes just because one pass completed successfully.

---

## Post-hardening continuation rule

After hardening is complete:
1. run Phase E Functional Fidelity Uplift (`POST_BUILD_FIDELITY_AUDIT.md`, `FIDELITY_UPLIFT_PLAN.md`)
2. run Phase F High-End Design Pass (`DESIGN_DIRECTION_BRIEF.md`, `UI_REFINEMENT_PLAN.md`, `POST_DESIGN_FUNCTIONAL_VALIDATION.md`)
3. treat Phase G as reserved-slot routing per workflow docs
4. only then enter Phase H final closeout
5. only after Phase H, optionally enter Phase I packaging if `.forgeshell/packaging.json` exists

---

## Optional packaging (Phase I — ForgeShell handoff)

After the lifecycle through **final closeout** is genuinely complete, and **only** when `.forgeshell/packaging.json` exists (bootstrap captured PRD path **then** application name), follow **`shell/reusable/REUSABLE_SHELL_WORKFLOW.md` — Phase I** and **`shell/reusable/REUSABLE_SHELL_PROMPTS.md`** (final closeout **#16** / optional **#17** on resume).

Offer **exactly two** operator choices — do **not** auto-run packaging:

1. **Clean for handoff** — archives final shell artifacts into **`_forgeshell_archive/`**, removes shell control directories, rewrites the app **`README.md`**, trims shell-specific **`.gitignore`**, renames **only** the **`shell-core`** directory to the bootstrap-recorded application folder name, and archives ForgeShell-only **`scripts/`** (or only the packaging script when **`scripts/`** is shared). The **outer** `Forgeshell` / `Forgeshell-2` clone folder is **not** renamed.
2. **Leave workspace as-is** — use the exact operator-facing sentence from Phase I in the workflow doc: **Keep the finished application inside the full ForgeShell workspace with all shell files intact**.

If `.forgeshell/packaging.json` is missing, **skip** this phase entirely.

---

## Git and repo hygiene rule

This shell expects:
- isolated branch or worktree
- no protected-branch direct work
- truthful package-by-package commits
- clean tree between completed units
- **single-writer** closeout: avoid overlapping git **mutations** during package/pass closeout; if `index.lock` or lock errors occur, follow `shell/reusable/REUSABLE_SHELL_PACKAGE_CLOSEOUT_CHECKLIST.md` (conservative handling—escalate if staleness is not safely verifiable)

Do not continue into the next completed unit with a dirty tree unless the current unit is still actively in progress.

---

## Final operating rule

Treat this repo as a reusable shell engine.

Your job is not to improvise.
Your job is to:
- inspect state
- choose the correct shell phase
- use the correct shell prompt behavior
- execute narrowly
- close out cleanly
- resume reliably
- escalate structurally only when necessary
- continue through audit, hardening, fidelity uplift, and design pass automatically