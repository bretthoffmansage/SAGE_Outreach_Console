# REUSABLE_SHELL_DRY_RUN_PLAN

## Purpose

This document defines the first end-to-end dry run for the reusable autonomous shell.

Its purpose is to prove that the shell can operate as a real workflow, not merely as a collection of design documents.

The dry run must test whether the shell can move from:

- a raw PRD

to:

- generated planning docs
- draft-first execution packages
- package execution
- blocked-package expansion
- per-package closeout and commits
- interruption recovery with `continue`
- final audit
- hardening plan
- hardening task list
- ordered hardening passes
- final closeout

This is the first real behavioral proof for the reusable shell.

---

## Dry-run philosophy

The first dry run must be:

- intentionally small
- structurally realistic
- easy to inspect
- rich enough to test the shell’s control logic
- not ambitious as a product build

The goal is not to build a big project.

The goal is to validate shell behavior.

The dry run should stress the shell’s workflow mechanics, especially:

- phase selection
- prompt routing
- package expansion
- package closeout
- drift handling
- resume behavior
- hardening continuity
- final closeout discipline

---

## Dry-run objective

The dry run should prove that the shell can:

1. start from `begin` or `start`
2. normalize a raw PRD
3. generate the core planning docs
4. generate a bounded execution package list
5. execute ready packages
6. expand a blocked/draft package via self-narrowing
7. return from the expander to the executor automatically
8. commit after a completed package
9. keep the tree clean between completed packages
10. resume from `continue` after interruption
11. escalate structurally only when truly necessary
12. generate a final execution audit
13. generate a hardening plan
14. generate a hardening task list
15. execute hardening passes in order
16. reach a clean final closeout state

If the shell cannot do those things, it is not yet ready for reuse.

---

## Recommended dry-run project type

The dry run should use a tiny fake or deliberately simple project.

Recommended shape:

- one small repo or test workspace
- one modest PRD
- one simple domain or app concept
- roughly 3 to 6 execution packages
- at least:
  - 1 ready package
  - 1 draft package that needs narrowing
  - 1 package or phase where interruption/resume is tested
  - 1 package or phase where closeout/clean-tree logic is tested
  - 1 post-execution hardening flow

The project should be small enough that the shell behavior is easy to inspect manually afterward.

---

## Dry-run project constraints

The dry-run project must **not** be:

- a huge real production system
- a long roadmap
- a domain with major legal/compliance ambiguity
- something that requires external production credentials
- something that depends on a complex real backend deployment
- something where product ambiguity is the main challenge

The dry run must be chosen to test shell mechanics, not to stretch product complexity.

---

## Recommended dry-run project example shape

The dry-run project can be something like:

- a tiny internal tracker
- a small content organizer
- a miniature scheduling helper
- a small dashboard or workflow tool
- a tiny document organizer

The exact product is not important.

What matters is that it can naturally produce:
- planning docs
- a few packages
- at least one draft package that can be narrowed
- a plausible audit/hardening sequence

---

# Dry-run phases to test

The dry run must explicitly exercise each major shell phase.

---

## Phase A — Intake test

### Goal
Verify that `begin` or `start` triggers the shell correctly on a fresh project.

### Required test
- user types `begin` or `start`
- shell inspects state
- shell determines that the project is fresh
- shell runs the PRD intake / normalization step
- shell creates `PRD_SOURCE.md`

### Pass condition
- `PRD_SOURCE.md` exists
- the shell does not skip directly into later phases
- the shell does not require the user to specify the next prompt manually

---

## Phase B — Planning generation test

### Goal
Verify that the shell can generate its planning docs in the right order.

### Required test sequence
1. create `CURRENT_STATE_AUDIT.md`
2. create `MASTER_ROADMAP.md`
3. create `EXECUTION_PACKAGES.md`

### Pass condition
- all three docs exist
- they are internally consistent
- the package list is dependency-aware
- later packages are not falsely over-specified
- the shell transitions naturally into package execution mode

---

## Phase C — Package execution test

### Goal
Verify that the shell can execute a ready package correctly.

### Required test
- the first ready package is executed
- code/doc changes are made within package scope
- required checks are run
- regressions are run if relevant
- the package log is created
- the package is closed honestly

### Pass condition
- the package completes truthfully
- the repo reflects the package changes
- the shell is ready for package closeout

---

## Package closeout test

### Goal
Verify per-package closeout behavior.

### Required test
After the completed package:
- shell inspects `git status`
- shell inspects `git diff --stat`
- shell identifies intended files
- shell handles generated drift if present
- shell commits the package
- shell verifies clean tree
- shell continues automatically

### Pass condition
- completed package is committed
- tree is clean afterward
- shell does not stop just because one package finished

---

## Blocked-package expansion test

### Goal
Verify that the shell can handle a draft or underdefined next package without manual rescue.

### Required test
- next package is draft or underdefined
- shell invokes blocked-package expansion
- shell applies iterative self-narrowing
- shell rewrites the package into the thinnest safe executable slice
- shell creates expansion log
- shell returns control to the executor automatically
- shell executes the narrowed package

### Pass condition
- no manual log deletion is needed
- no manual reprompting is needed to resume normal execution
- package executes after narrowing

---

## Generated drift handling test

### Goal
Verify that recurring generated drift does not break closeout.

### Required test
- induce or observe a known generated-drift file such as `next-env.d.ts`
- shell classifies it
- shell reverts it automatically if not intentional
- shell continues package closeout normally

### Pass condition
- shell does not ask user to manually clean the drift
- drift does not pollute the completed package commit
- tree ends clean

---

## Interruption and resume test

### Goal
Verify that `continue` behaves correctly after interruption.

### Required test
Interrupt the workflow:
- during a package
- or between packages
- or during a hardening pass

Then:
- user types `continue`
- shell inspects artifact state and git state
- shell infers current phase and active unit of work
- shell resumes near the interrupted point automatically

### Pass condition
- shell does not start over
- shell does not require the user to say the package number
- shell does not duplicate already completed work
- shell resumes cleanly

---

## Structured escalation test

### Goal
Verify that the shell asks for input correctly when it truly needs it.

### Required test
Create one real or synthetic ambiguity that cannot be safely narrowed further.

The shell must:
- raise structured escalation
- explain the blocked point
- explain what it already attempted
- explain what input is needed
- present:
  - Continue-ready
  - Stop

Then test:
- Continue-ready path
- optionally Stop path

### Pass condition
- shell does not stop vaguely
- shell only stops if Stop is explicitly chosen
- shell resumes correctly from Continue-ready

---

## Final audit generation test

### Goal
Verify that the shell automatically enters the final audit phase when package execution is exhausted.

### Required test
- package list reaches exhaustion
- shell generates `FINAL_EXECUTION_AUDIT.md`

### Pass condition
- audit exists
- audit is evidence-based
- audit clearly separates code-complete from environment-complete where relevant
- audit identifies next hardening phase correctly

---

## Hardening plan generation test

### Goal
Verify the shell automatically generates hardening planning artifacts after the final audit.

### Required test
- shell generates `POST_EXECUTION_HARDENING_PLAN.md`
- shell generates `POST_EXECUTION_HARDENING_TASKS.md`

### Pass condition
- hardening plan exists
- hardening tasks exist
- they remain hardening-only, not new feature work

---

## Hardening execution flow test

### Goal
Verify that the shell can run hardening passes in order and continue automatically between them.

### Required pass sequence
- Pass 1
- Pass 2
- Pass 3
- Pass 4

### Required behavior
- shell executes current pass
- validates it
- performs closeout if changes were made
- continues into the next pass automatically unless blocked

### Pass condition
- no manual reprompt required between passes
- passes remain scoped
- final hardening state is clean

---

## Final closeout test

### Goal
Verify that the shell does not stop at “features done,” but actually closes out.

### Required test
At the end of hardening:
- shell verifies artifacts exist
- shell verifies repo cleanliness
- shell verifies workflow completion or explicit caveats
- shell produces closeout-ready state

### Pass condition
- repo is clean
- required shell-generated docs exist
- closeout is truthful
- shell can say the workflow is complete or honestly caveated

---

# Dry-run test sequence

The dry run should be performed in this order:

1. initialize test project and raw PRD
2. type `begin` or `start`
3. observe planning generation
4. observe first package execution
5. observe package closeout commit
6. force or observe draft-package expansion
7. observe handoff back to executor
8. force or observe generated drift handling
9. interrupt the run
10. type `continue`
11. observe resume behavior
12. complete package execution
13. observe final audit generation
14. observe hardening plan and hardening task generation
15. observe hardening passes 1 through 4
16. observe final closeout

This order should be preserved so shell behavior can be inspected clearly.

---

# Dry-run artifacts that should be produced

The dry run should leave behind:

- normalized PRD
- current-state audit
- roadmap
- execution packages
- run logs
- expansion logs
- final audit
- hardening plan
- hardening tasks
- hardening outputs if generated
- committed package history
- clean repo state at end

Optional but recommended:
- dry-run results doc
- gap log

---

# Dry-run pass/fail criteria

The dry run should be considered **pass** only if all of the following are true:

- `begin` / `start` work correctly
- `continue` works correctly
- core planning artifacts are generated in the right order
- draft-first execution packages are generated
- at least one package executes normally
- at least one blocked package is narrowed and returned to execution automatically
- package closeout commits happen correctly
- generated drift is handled automatically
- interruption recovery works
- structured escalation works
- final audit is generated
- hardening plan is generated
- hardening task list is generated
- hardening passes proceed in order
- repo ends clean
- the shell does not require manual stitching between major phases

If any of those fail, the shell is not yet v1 ready.

---

# Gap logging rules during dry run

Any shell failure or rough edge discovered during the dry run should be recorded.

Recommended categories:
- planning-generation gap
- prompt/orchestration gap
- phase-transition gap
- blocked-package expansion gap
- closeout/commit gap
- generated drift handling gap
- resume gap
- escalation gap
- audit/hardening gap
- CLI posture gap

The shell should be improved by patching the correct control artifact or runtime contract, not by one-off rescue behavior.

---

# Recommended supporting dry-run artifacts

The shell project should ideally add:

## `shell/reusable/REUSABLE_SHELL_DRY_RUN_RESULTS.md`
Use this to record:
- what was tested
- what passed
- what failed
- what gaps were found
- what is ready now

## `shell/reusable/REUSABLE_SHELL_GAP_LOG.md`
Use this to record:
- shell behavior gaps
- severity
- affected shell artifact
- proposed fix
- resolution status

These are not strictly required for the first draft, but they are strongly recommended.

---

# Dry-run constraints

During the dry run:
- do not quietly patch shell behavior without recording the gap
- do not widen the test project into a real product build
- do not confuse shell mechanics with product quality
- do not declare shell v1 ready just because some parts worked

The dry run exists to test the shell, not to flatter it.

---

# Dry-run success output

At the end of the dry run, the shell team should be able to say one of the following truthfully:

## Outcome A — Shell v1 ready
- dry run passed fully
- any minor caveats are understood and acceptable
- shell is ready for first real small-project reuse

## Outcome B — Shell nearly ready
- dry run exposed a small number of known gaps
- gaps are documented
- shell needs one focused refinement loop

## Outcome C — Shell not ready
- dry run exposed major orchestration or recovery failures
- shell needs more than a small refinement pass before reuse

The dry run must end with one of those explicit judgments.

---

# Relationship to other shell docs

This dry-run plan must remain aligned with:

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

If those docs change materially, this dry-run plan should be updated.

---

# Final conclusion

The reusable shell should not be declared ready based on design quality alone.

It must prove itself through a small, explicit, end-to-end dry run that exercises:

- start behavior
- planning generation
- execution
- blocked-package expansion
- closeout
- resume
- escalation
- audit
- hardening
- closeout

This document defines that first proof.