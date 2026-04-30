# PRD_SOURCE_TEMPLATE

## Purpose

This file is the operational source version of the project PRD.

It is designed for agents and implementation workflows, not for presentation.

It translates a raw user PRD or project brief into a structured reference that can be consulted repeatedly during planning, execution, expansion, audit, and hardening.

When implementation decisions are unclear, the shell should use this file as the primary product-truth source.

This template should be used when generating `PRD_SOURCE.md` for a fresh project.

---

## Agent use rules

1. Prefer this file over legacy code behavior when the two conflict, unless the active execution package explicitly says to preserve current behavior temporarily.
2. Cite the exact PRD section IDs or anchors used when making meaningful product, architecture, or workflow decisions.
3. Treat this file as product truth, not implementation truth. It explains what the project should become, not what the current codebase already does.
4. If this file is still ambiguous, the shell should not invent broad product direction. It should:
   - record the ambiguity
   - narrow safely where possible later
   - or escalate when required
5. This file should preserve uncertainty honestly. Do not convert vague source material into fake precision.

---

## How to use this template

When generating `PRD_SOURCE.md`:

- preserve the user’s actual intent
- normalize messy or informal PRD wording into structured sections
- keep section IDs stable and referenceable
- separate true requirements from assumptions
- make later planning easier by organizing material into clear categories
- record unknowns explicitly rather than smoothing them over

If the input PRD is small, some sections may be concise.
If the input PRD is large, sections may be extensive.

Not every template section must be equally long, but the structure should remain intact unless a section is truly not applicable.

---

# Document structure

## Document purpose

This file is the operational source version of the project PRD.

It is designed for agents and implementation workflows, not for presentation. It translates the full PRD or project brief into a structured reference that can be consulted repeatedly during execution.

When implementation decisions are unclear, the agent should use this file as the primary product-truth source.

---

## Project identity

### Project name
[Project name]

### One-sentence definition
[Short definition of what the product/system is]

### Product category
[What kind of product/system this is]

### Core identity rule
[What this product is and what it is not]

### Implementation implication
[What major product and architectural decisions should reinforce]

---

## Strategic principles

List the project’s governing principles as stable, referenceable entries.

### PRD-01 — Strategic principle set
#### SP-01 — [Principle title]
[Principle description]

#### SP-02 — [Principle title]
[Principle description]

#### SP-03 — [Principle title]
[Principle description]

#### SP-04 — [Principle title]
[Principle description]

#### SP-05 — [Principle title]
[Principle description]

### Implementation implication
When uncertain about product direction, prefer:
- [bias 1]
- [bias 2]
- [bias 3]
- [bias 4]

---

## Core users and roles

### PRD-02 — Core users and roles

#### Primary user groups
- [User group 1]
- [User group 2]
- [User group 3]

#### Role definitions
##### [Role 1]
[Definition]

##### [Role 2]
[Definition]

##### [Role 3]
[Definition]

### Implementation implication
[How the system should treat these roles structurally]

---

## Canonical entity hierarchy

### PRD-03 — Canonical entity hierarchy

#### Required hierarchy
[Entity hierarchy if applicable]

#### Definitions
##### [Entity 1]
[Definition]

##### [Entity 2]
[Definition]

##### [Entity 3]
[Definition]

### Implementation implication
[How these entities should behave as real product/system boundaries]

---

## Core workflows

### PRD-04 — Core workflow lifecycle

Describe the major workflow lifecycle the product is supposed to support.

#### Workflow stages
1. [Stage 1]
2. [Stage 2]
3. [Stage 3]
4. [Stage 4]

#### Required transitions
- [Transition rule 1]
- [Transition rule 2]

### Implementation implication
[What the shell should preserve about lifecycle order and source-of-truth behavior]

---

## Source-of-truth model

### PRD-05 — Source-of-truth rules

#### Canonical source(s) of truth
- [System/source 1]
- [System/source 2 if applicable]

#### Derived/read-model behavior
[What should be derived versus directly editable]

#### Duplication rules
[What must not become a second source of truth]

### Implementation implication
[How architecture and package decisions should preserve source-of-truth boundaries]

---

## Collaboration and editing model

### PRD-06 — Collaboration model

#### Collaboration requirements
- [Requirement 1]
- [Requirement 2]

#### Editable vs suggest-only boundaries
- [Boundary 1]
- [Boundary 2]

#### Review/approval model if applicable
[Description]

### Implementation implication
[What shell/package decisions should bias toward when collaboration boundaries are unresolved]

---

## Permissions and access model

### PRD-07 — Permissions and access model

#### Access boundaries
- [Boundary 1]
- [Boundary 2]
- [Boundary 3]

#### Role-based expectations
- [Role rule 1]
- [Role rule 2]

#### Tenant or organization boundary rules if applicable
[Description]

### Implementation implication
[How the system should treat access as a structural concern, not just a UI filter]

---

## Product surfaces

### PRD-08 — Primary product surfaces

List the major product surfaces or operational areas the PRD expects.

#### Surface list
- [Surface 1]
- [Surface 2]
- [Surface 3]
- [Surface 4]

#### Notes per surface
##### [Surface 1]
[Purpose and scope]

##### [Surface 2]
[Purpose and scope]

### Implementation implication
[Which surfaces are primary versus supportive]

---

## Technical architecture direction

### PRD-09 — Technical architecture direction

#### Architecture posture
[High-level architecture direction]

#### Important technical constraints
- [Constraint 1]
- [Constraint 2]
- [Constraint 3]

#### Integration posture
[Integrate vs replicate rules if applicable]

### Implementation implication
[What technical decisions should be preferred later]

---

## Data and persistence expectations

### PRD-10 — Data model and persistence expectations

#### Important data concepts
- [Concept 1]
- [Concept 2]

#### Persistence expectations
- [Expectation 1]
- [Expectation 2]

#### Migration sensitivity
[What data/model changes are high-risk]

### Implementation implication
[What packages should treat as migration-heavy or structurally sensitive]

---

## External integrations

### PRD-11 — Integration direction

#### Expected integrations
- [Integration 1]
- [Integration 2]
- [Integration 3]

#### Integration philosophy
[How much the product should integrate vs replace]

### Implementation implication
[What should be built internally vs integrated externally]

---

## Non-functional requirements

### PRD-12 — Non-functional requirements

#### Stability requirements
- [Requirement 1]
- [Requirement 2]

#### Performance requirements
- [Requirement 1]
- [Requirement 2]

#### Security / safety requirements
- [Requirement 1]
- [Requirement 2]

#### Operational requirements
- [Requirement 1]
- [Requirement 2]

### Implementation implication
[How later packages and hardening should interpret these requirements]

---

## Stack or implementation assumptions

### PRD-13 — Stack guidance

#### Explicitly specified stack
[If the PRD specifies one, record it here]

#### Existing codebase stack
[If inferred from the repo, record it here]

#### If unspecified
If the source PRD did not define a stack and there is no existing codebase constraint, record that the shell may choose the thinnest sensible default stack later during planning.

### Implementation implication
[How stack choice should be treated later]

---

## Deferred or intentionally out-of-scope areas

### PRD-14 — Explicitly deferred work

#### Out of scope now
- [Deferred item 1]
- [Deferred item 2]
- [Deferred item 3]

#### Future expansion areas
- [Expansion area 1]
- [Expansion area 2]

### Implementation implication
[What the shell must not overbuild in early packages]

---

## Ambiguities and unresolved items

### PRD-15 — Known ambiguities

List real ambiguities from the source PRD that were not safely resolved during normalization.

- [Ambiguity 1]
- [Ambiguity 2]
- [Ambiguity 3]

### Rule for later phases
These ambiguities should not be silently invented away.
They should be:
- narrowed safely where possible
- deferred honestly where appropriate
- escalated later only when truly necessary

---

## Canonical implementation bias

### PRD-16 — Canonical implementation bias

When the shell must choose among plausible implementation directions, prefer:

- [Bias 1]
- [Bias 2]
- [Bias 3]
- [Bias 4]

Avoid bias toward:

- [Anti-bias 1]
- [Anti-bias 2]
- [Anti-bias 3]

This section should summarize the project’s deepest directional intent in a way later packages can use quickly.

---

## Quick reference map

### Appendix A — Quick reference map

#### Most important sections for everyday decisions
- [Section ID 1]
- [Section ID 2]
- [Section ID 3]

#### Most important sections for architecture decisions
- [Section ID 1]
- [Section ID 2]
- [Section ID 3]

#### Most important sections for future expansion
- [Section ID 1]
- [Section ID 2]
- [Section ID 3]

---

## Source normalization note

### Appendix B — Source normalization note

#### Raw source inputs used
- [e.g. `raw_prd/<filename>` when canonical intake applied, or note operator-provided / loose source]
- [Additional source only if applicable]

#### Normalization choices made
- [Choice 1]
- [Choice 2]

#### Important caveats
- [Caveat 1]
- [Caveat 2]

This section should explain any major normalization choices if the input PRD was messy, contradictory, or highly informal.

---

## Minimal completion checklist for generated PRD_SOURCE.md

A generated `PRD_SOURCE.md` should be considered good enough when:

- the project identity is clear
- the core users/entities/workflows are clear enough to plan against
- source-of-truth boundaries are stated where relevant
- permissions/access expectations are stated where relevant
- non-functional expectations are recorded where present
- out-of-scope and deferred areas are explicit
- major ambiguities are preserved honestly
- section IDs or anchors are stable enough to cite later

---

## Final note

This template is intentionally structured for execution usefulness, not presentation polish.

A good generated `PRD_SOURCE.md` should make it easy for later shell phases to answer:

- what is this project supposed to become?
- what are its structural boundaries?
- what should later packages reinforce?
- what is intentionally deferred?
- where does ambiguity still remain?

That is the purpose of this template.