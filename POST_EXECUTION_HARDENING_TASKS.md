# POST_EXECUTION_HARDENING_TASKS — AI Campaign Desk

Date: 2026-04-30

## H-001 — Validation and dependency hygiene
Status: complete
- Run `npm run lint`.
- Run `npm run build`.
- Run `npm audit --audit-level=moderate` for visibility.
- Do not force breaking dependency upgrades without a clear safe fix.

Completion evidence: `npm audit --audit-level=moderate` initially reported a vulnerable nested `postcss` under Next and suggested a breaking force downgrade. Added an npm override for `next` -> `postcss@8.5.10`, then `npm audit --audit-level=moderate`, `npm run lint`, and `npm run build` all passed.

## H-002 — Route and empty-state review
Status: pending
- Review primary route handlers for dashboard, campaigns, reviews, libraries, intelligence, operations, and settings.
- Confirm missing live credentials are represented as demo/manual state.

## H-003 — Accessibility and semantic review
Status: pending
- Verify skip link exists.
- Verify focus styling exists.
- Verify major pages use clear headings and non-technical Bari/Blue wording.

## H-004 — Documentation and handoff review
Status: pending
- Confirm `.env.example` exists.
- Confirm README route list and validation commands are present.
- Confirm deferred/live setup requirements are explicit.
