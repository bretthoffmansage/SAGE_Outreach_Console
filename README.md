# Reusable Autonomous Shell

**ForgeShell** — this directory is the **`shell-core`** working tree of the ForgeShell project. Bootstrap creates a clean outer workspace folder such as `ForgeShell` under `Documents/`, then launches the agent inside this `shell-core` directory.

## Purpose

This repo contains a reusable autonomous shell designed to take a project from:

- a user-supplied PRD or project brief (plain markdown is enough)

through:

- PRD normalization
- current-state audit
- roadmap generation
- execution-package generation
- package execution
- blocked-package expansion
- package-by-package closeout and commits
- hardening
- functional fidelity uplift
- high-end design pass
- post-uplift validation posture
- final closeout
- optional packaging / handoff cleanup

The goal is to create a reusable process shell that can run top to bottom with minimal manual intervention.

This repo is **not** a normal product app repo.

It is a **workflow engine and control-doc system** for autonomous project execution.

You do **not** need a rigid PRD schema or a pre-filled `PRD_SOURCE.md` to start. Drop a normal brief into `raw_prd/` as exactly one top-level `.md` file; the shell **normalizes** that input into `PRD_SOURCE.md` and the rest of the planning stack as the workflow runs.

---

## GitHub bootstrap (recommended)

Use bootstrap when you want ForgeShell to set up a fresh workspace from GitHub.

What bootstrap does:

1. checks required dependencies (`git`, `node`, and the selected agent CLI)
2. prompts for your PRD file path (`.md`)
3. prompts for your application name (used later for optional packaging)
4. downloads ForgeShell from GitHub into a temporary staging location, then creates a **clean unpacked workspace** in `~/Documents/ForgeShell` (or `ForgeShell-2`, etc.) **without inheriting source `.git` metadata**
5. copies your PRD into `shell-core/raw_prd/`
6. launches your selected agent in `shell-core`, where you type `begin` or `start`

### macOS — Codex

Run:

`/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/bretthoffman/ForgeShell/main/shell-core/bootstrap/mac/codex.sh)"`

### macOS — Claude

Run:

`/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/bretthoffman/ForgeShell/main/shell-core/bootstrap/mac/claude.sh)"`

### Windows — Codex (PowerShell)

Run:

`iex ((New-Object System.Net.WebClient).DownloadString('https://raw.githubusercontent.com/bretthoffman/ForgeShell/main/shell-core/bootstrap/windows/codex.ps1'))`

### Windows — Claude (PowerShell)

Run:

`iex ((New-Object System.Net.WebClient).DownloadString('https://raw.githubusercontent.com/bretthoffman/ForgeShell/main/shell-core/bootstrap/windows/claude.ps1'))`

---

## What this repo contains

The shell is organized into a few major areas.

### `shell/control/`

Core operating documents that govern runtime behavior.

Expected files include:

- `shell/control/AGENT_OPERATING_RULES.md`
- `shell/control/AGENT_RUNTIME_SETUP.md`
- `shell/control/PACKAGE_EXPANSION_PROTOCOL.md`
- `shell/control/RUN_LOG_TEMPLATE.md`

### `shell/reusable/`

Reusable shell behavior, workflow, prompts, lifecycle docs, and dry-run docs.

Expected files include:

- `shell/reusable/REUSABLE_SHELL_PACKAGE_PLAN.md`
- `shell/reusable/REUSABLE_SHELL_ARTIFACT_MAP.md`
- `shell/reusable/REUSABLE_SHELL_RUNTIME_SPEC.md`
- `shell/reusable/REUSABLE_SHELL_WORKFLOW.md`
- `shell/reusable/REUSABLE_SHELL_PROMPTS.md`
- `shell/reusable/REUSABLE_SHELL_RESUME_CONTRACT.md`
- `shell/reusable/REUSABLE_SHELL_ESCALATION_TEMPLATE.md`
- `shell/reusable/REUSABLE_SHELL_PACKAGE_CLOSEOUT_CHECKLIST.md`
- `shell/reusable/REUSABLE_SHELL_GENERATED_DRIFT_RULES.md`
- `shell/reusable/REUSABLE_SHELL_CLI_CONFIGS.md`
- `shell/reusable/REUSABLE_SHELL_IMPLEMENTATION_SEQUENCE.md`
- `shell/reusable/REUSABLE_SHELL_DRY_RUN_PLAN.md`
- `shell/reusable/REUSABLE_SHELL_GAP_LOG.md`
- `shell/reusable/REUSABLE_SHELL_DRY_RUN_RESULTS.md`

### `shell/templates/`

Reusable templates for generated artifacts.

This now includes the core planning templates plus newer post-build templates such as:

- `POST_BUILD_FIDELITY_AUDIT_TEMPLATE.md`
- `FIDELITY_UPLIFT_PLAN_TEMPLATE.md`
- `DESIGN_DIRECTION_BRIEF_TEMPLATE.md`
- `UI_REFINEMENT_PLAN_TEMPLATE.md`
- `POST_DESIGN_FUNCTIONAL_VALIDATION_TEMPLATE.md`

### `dry_runs/`

Dry-run inputs and related artifacts used to prove shell behavior.

Typical structure:

- `dry_runs/test_projects/`
- `dry_runs/results/`
- `dry_runs/logs/`

### `agent_runs/`

Execution logs, expansion logs, and related shell runtime logs created during runs.

### `raw_prd/` (recommended)

Where you put your **raw** product intent before the first run. Add **exactly one** top-level **`.md`** file in `raw_prd/`. Intake only counts **top-level `.md` files**; subfolders under `raw_prd/` are **not** used. Normative behavior is in `shell/reusable/REUSABLE_SHELL_RESUME_CONTRACT.md`.

### `.codex/`

Codex project config and runtime instructions.

### `.claude/`

Claude project config and runtime instructions.

### `bootstrap/`

GitHub bootstrap launchers and shared bootstrap logic.

### `scripts/`

ForgeShell utility scripts, including optional packaging / handoff logic.

---

## Core shell behavior

The shell is designed to:

1. inspect current artifact and git state
2. determine the current workflow phase
3. choose the correct prompt and behavior automatically
4. execute the next valid unit of work
5. expand draft packages safely when needed
6. commit after each completed package or completed hardening pass
7. revert recurring generated drift when it is not intentional
8. resume after interruption with `continue`
9. escalate structurally only when truly necessary
10. continue automatically through hardening, fidelity uplift, design pass, closeout, and optional packaging when appropriate

### Healthy same-run continuation

ForgeShell should **keep going in the same run** when the **current** phase or unit has finished successfully, no real blocker exists, no structured escalation is needed, no real user input is required for the next step, and validation plus closeout for that unit are complete enough.

It should **not** stop merely because a phase ended or a chat turn ended.

Normative detail:

- `shell/reusable/REUSABLE_SHELL_WORKFLOW.md`
- `shell/reusable/REUSABLE_SHELL_PROMPTS.md`

### Git closeout safety

Git closeout runs in an **ordered, single-writer** sequence: inspect and classify changes, then stage and commit, then verify — without overlapping git writes or racing other git consumers.

If a git lock appears, ForgeShell handles it **conservatively** and escalates rather than guessing when lock safety is unclear.

Full sequencing:

- `shell/reusable/REUSABLE_SHELL_PACKAGE_CLOSEOUT_CHECKLIST.md`
- `shell/control/AGENT_RUNTIME_SETUP.md`

### Local git on fresh projects

On a **new** project folder with **no** `.git` yet, ForgeShell may run **`git init`** at the **project root** early in a fresh run, but only when the narrow conditions in `shell/reusable/REUSABLE_SHELL_WORKFLOW.md` are met.

This is **local only**. ForgeShell does **not** create GitHub repos, add remotes, or connect hosting for you.

---

## External integrations posture

ForgeShell defaults to **scaffold now / configure later** when safe.

During intake and planning, it should identify requested integrations from the PRD and conceptually classify them into states such as:

- ready now
- scaffold only
- requires user setup after build
- true blocker

For tools like Clerk, Convex, Supabase, Stripe, storage providers, analytics providers, or external APIs, ForgeShell should usually:

- scaffold the product around the requested integration
- use placeholders, contracts, and env expectations where appropriate
- continue building unless the integration is truly build-blocking

ForgeShell should only escalate **before build** when:

- the PRD explicitly requires the integration
- it is truly necessary for meaningful generation or execution
- ForgeShell cannot safely scaffold around it

At final closeout, ForgeShell should explicitly report **remaining external setup required** when integrations were scaffolded but not configured live.

---

## Optional packaging (after a successful run)

When bootstrap recorded an application name (`.forgeshell/packaging.json`), after **Phase H** the shell may offer **optional packaging** with exactly two choices:

1. **Clean for handoff** — archives final shell artifacts into **`_forgeshell_archive/`**, removes shell internals such as `shell/`, `.codex/`, `.claude/`, `bootstrap/`, and `dry_runs/`, rewrites the app `README.md`, trims shell-specific `.gitignore` entries, renames **only** `shell-core` to the bootstrap-chosen application folder name, and archives ForgeShell-only `scripts/` behavior appropriately.
2. **Leave workspace as-is** — keep the finished application inside the full ForgeShell workspace with all shell files intact.

The **outer** workspace folder (`ForgeShell`, `ForgeShell-2`, etc.) is **never** renamed by Clean for handoff.

---

## Primary user commands

The shell is designed around three simple user triggers.

### `begin`

Use this to initialize or enter the shell workflow after state inspection.

### `start`

Same meaning as `begin`.

### `continue`

Use this to resume from the nearest unresolved point after interruption, a genuine pause, or a blocker.

### Important rule

These are **workflow triggers**, not product commands.

The shell must inspect current repo and artifact state before deciding what to do.

It must not blindly restart work.

---

## Raw PRD intake (`raw_prd/`)

**What you do:** write a normal project brief or PRD in markdown and save it as **one** top-level `.md` file inside `raw_prd/`.

**What ForgeShell does:** on a fresh run, before `PRD_SOURCE.md` exists, it checks `raw_prd/` first and **normalizes** the chosen top-level `.md` into `PRD_SOURCE.md`.

Rules:

- `raw_prd/` exists with exactly one top-level `.md` file → use it
- `raw_prd/` exists with zero top-level `.md` files → structured escalation
- `raw_prd/` exists with more than one top-level `.md` file → structured escalation
- `raw_prd/` missing → fallback to loose convention, such as PRD in chat

Authoritative details:

- `shell/reusable/REUSABLE_SHELL_RESUME_CONTRACT.md`

---

## Typical workflow lifecycle

### Phase A — Intake

Create:

- `PRD_SOURCE.md`

### Phase B — Planning generation

Create:

- `CURRENT_STATE_AUDIT.md`
- `MASTER_ROADMAP.md`
- `EXECUTION_PACKAGES.md`

### Phase C — Package execution

Execute packages in sequence.

If the next package is draft, expand it through the package expansion protocol.

### Phase D — Hardening

Create and execute:

- `FINAL_EXECUTION_AUDIT.md`
- `POST_EXECUTION_HARDENING_PLAN.md`
- `POST_EXECUTION_HARDENING_TASKS.md`
- hardening passes in order

### Phase E — Functional Fidelity Uplift

Create and execute:

- `POST_BUILD_FIDELITY_AUDIT.md`
- `FIDELITY_UPLIFT_PLAN.md`

This phase compares:

- the raw PRD
- `PRD_SOURCE.md`
- the built application

It is meant to catch drift, omission, compression, thin implementation, partial implementation, and meaningful functional gaps before closeout.

### Phase F — High-End Design Pass

Create and execute:

- `DESIGN_DIRECTION_BRIEF.md`
- `UI_REFINEMENT_PLAN.md`
- `POST_DESIGN_FUNCTIONAL_VALIDATION.md`

This phase is a structured art direction / UI system / product UX pass, not a minor CSS cleanup. It should preserve functionality while making the application feel more polished and intentional.

### Phase G — Post-Uplift Validation

Reserved slot for post-uplift lifecycle posture and validation routing.

### Phase H — Final closeout

Verify:

- workflow completion
- closeout readiness
- remaining external setup required where relevant

### Phase I — Optional packaging choice

Available only after Phase H and only when `.forgeshell/packaging.json` exists.

---

## Required shell rules

The shell must follow the core control documents.

At minimum, runtime behavior should always be governed by:

1. `shell/control/AGENT_OPERATING_RULES.md`
2. `shell/control/AGENT_RUNTIME_SETUP.md`
3. `shell/control/PACKAGE_EXPANSION_PROTOCOL.md`
4. `shell/control/RUN_LOG_TEMPLATE.md`

And the reusable shell behavior docs, especially:

- `shell/reusable/REUSABLE_SHELL_WORKFLOW.md`
- `shell/reusable/REUSABLE_SHELL_RUNTIME_SPEC.md`
- `shell/reusable/REUSABLE_SHELL_PROMPTS.md`
- `shell/reusable/REUSABLE_SHELL_RESUME_CONTRACT.md`
- `shell/reusable/REUSABLE_SHELL_PACKAGE_CLOSEOUT_CHECKLIST.md`
- `shell/reusable/REUSABLE_SHELL_GENERATED_DRIFT_RULES.md`
- `shell/reusable/REUSABLE_SHELL_ESCALATION_TEMPLATE.md`

---

## Package execution rules

When in execution mode, the shell must:

- execute packages in strict sequence
- use blocked-package expansion for the next draft package
- expand only one next package at a time
- return automatically from the expander to the executor
- stay within active package scope
- run required checks and regression checks
- perform package closeout after completion
- commit completed package work
- verify clean tree before continuing
- **not** start the next package’s edits until the current package’s commit and clean-tree check complete
- when closeout is complete and the handoff is healthy, continue **in the same run** to the next package or phase
- run git closeout as a **single-writer**, ordered sequence and avoid overlapping git mutations

The shell must not require manual log deletion or manual executor/expander restitching.

---

## Hardening and post-hardening rules

After package execution is exhausted, the shell must:

1. generate final audit if missing
2. generate hardening plan if missing
3. generate hardening tasks if missing
4. execute hardening passes in order
5. run functional fidelity uplift (Phase E)
6. run high-end design pass with post-design functional validation (Phase F)
7. continue through final closeout (Phase H)
8. offer optional packaging only after closeout and only when applicable (Phase I)

These transitions should continue automatically unless:

- a real blocker occurs
- validation fails and cannot be repaired in scope
- or the user explicitly chooses Stop

---

## Git hygiene expectations

The shell assumes:

- isolated branch or worktree
- no direct autonomous work on protected or shared primary branches
- package-by-package or pass-by-pass commits
- clean tree between completed units

Closeout uses an **ordered** sequence and treats the repo as **single-writer** for mutating git steps.

The shell must inspect:

- `git status`
- `git diff --stat`

before closing completed units of work.

If git reports a locked index or `index.lock` is present, the shell responds **conservatively** and escalates when lock safety is unclear.

---

## Generated drift handling

The shell must handle known recurring generated drift automatically where safe.

### Known example

- `next-env.d.ts`

If such a file changes but is not part of intentional package or pass scope, the shell should revert it before committing the current completed unit.

The user should not need to clean recurring generated drift manually during normal shell operation.

---

## Structured escalation behavior

Healthy phase or unit completion with complete enough closeout does **not** require escalation or a mandatory stop — ForgeShell should advance in the **same run** when the handoff is clean.

If the shell truly cannot continue safely, it must not stop vaguely.

It must raise a structured escalation that includes:

- blocked point
- what it already attempted
- why it cannot continue safely
- what input or action is needed
- Continue-ready
- Stop

The shell should only actually stop if the user explicitly chooses **Stop**.

---

## Codex and Claude support

This shell is designed to support both:

- Codex CLI
- Claude CLI

The exact settings may differ, but the intended behavior should be equivalent.

See:

- `shell/reusable/REUSABLE_SHELL_CLI_CONFIGS.md`
- `.codex/`
- `.claude/`

---

## Dry-run support

This repo includes a dry-run framework so the shell can be proven before real reuse.

Important dry-run files include:

- `shell/reusable/REUSABLE_SHELL_DRY_RUN_PLAN.md`
- `shell/reusable/REUSABLE_SHELL_GAP_LOG.md`
- `shell/reusable/REUSABLE_SHELL_DRY_RUN_RESULTS.md`
- `dry_runs/test_projects/REUSABLE_SHELL_TEST_PROJECT_PRD.md`

The first recommended dry run is intentionally small and is meant to test shell behavior, not product ambition.

---

## Recommended operator usage

### To start a fresh run

1. open the **`shell-core`** working tree, or use the **GitHub bootstrap** flow above
2. make sure there is exactly one top-level `.md` file in `raw_prd/`, unless you are using the loose intake convention
3. type `begin` or `start`

### To resume after interruption

1. reopen the shell repo or worktree
2. type `continue`

You should need this when the session was interrupted, something blocked progress, or the run genuinely paused — not after every successful phase in an uninterrupted healthy run.

### If the shell escalates

1. read the structured escalation
2. provide the needed input or choose Continue-ready
3. choose Stop only if you truly want the workflow to stop

---

## Do not do by default

Unless the shell truly requires a real human action, do not manually:

- delete blocked logs
- reconstruct package order
- revert recurring generated drift
- stitch executor and expander together
- commit completed package work
- restart from scratch after interruption

The shell is designed to handle those behaviors itself.

---

## Recommended current next step

If you are setting up this shell for the first proof run, the normal next sequence is:

1. verify shell control docs are present
2. verify `.codex/` and `.claude/` are present
3. verify `shell/control/RUN_LOG_TEMPLATE.md` exists
4. commit the shell baseline
5. run the first dry run using the test PRD
6. record gaps in `shell/reusable/REUSABLE_SHELL_GAP_LOG.md`
7. record the outcome in `shell/reusable/REUSABLE_SHELL_DRY_RUN_RESULTS.md`

---

## Final note

This shell should be judged by behavior, not just by documentation.

It is only truly ready when it can prove, through a dry run, that it can go from:

- raw PRD

to:

- planning
- execution
- expansion
- closeout
- hardening
- functional fidelity uplift
- high-end design pass
- final clean state

with minimal manual rescue.


## AI Campaign Desk application scaffold

This workspace now contains a Next.js App Router scaffold for AI Campaign Desk. It is intentionally demo-safe: Clerk, Convex, OpenAI, Claude/Anthropic, Keap, Zapier, HelpDesk.com, and LangGraph surfaces are represented with setup-aware status and manual fallbacks, but no real credentials are committed.

### Useful routes

- `/dashboard` — command center
- `/campaigns`, `/campaigns/new`, `/campaigns/camp_reactivation_may` — campaign lifecycle
- `/reviews/bari`, `/reviews/blue`, `/reviews/internal`, `/reviews/all` — approval queues
- `/libraries/offers`, `/libraries/email`, `/libraries/voice-rules`, `/libraries/signoffs`, `/libraries/audiences`, `/libraries/compliance`, `/libraries/learning` — source-of-truth libraries
- `/intelligence/agent-runs`, `/intelligence/langgraph`, `/intelligence/responses`, `/intelligence/performance` — workflow intelligence
- `/operations/keap`, `/operations/integrations` — integration and handoff posture
- `/settings` — admin, roles, audit, and safety posture

### Validation

```bash
npm run lint
npm run build
```

### Environment

Copy `.env.example` to `.env.local` for local live-service setup. Missing keys should leave the app in demo/manual mode rather than breaking the UI.
