# AI Campaign Desk — Product Requirements Document

**Document type:** Product Requirements Document (PRD)  
**Project:** AI Campaign Desk  
**Intended build path:** Autonomous Codex/agentic build process  
**Primary stack:** Next.js, Vercel, Convex, Clerk, OpenAI Agents SDK, LangGraph, Keap API, Zapier, HelpDesk.com API  
**Primary users:** Internal marketing operators, Bari, Blue, technical admins, campaign reviewers  
**Version:** 1.0  
**Date:** 2026-04-30

---

## 1. Executive Summary

AI Campaign Desk is an internal marketing workflow platform designed to help the company plan, write, review, approve, execute, track, and learn from marketing campaigns using a controlled AI-agent workflow.

The system is not intended to be a loose collection of AI tools. It should feel like a polished, organized, multi-user marketing command center with clear workflows, clean navigation, human approval checkpoints, auditability, and integrated campaign memory.

The platform should support email campaigns first, with a clear path to ads, landing pages, SMS, and broader campaign expansion later.

The core purpose is to reduce dependency on external marketing teams, reduce bottlenecks around Blue and Bari, preserve Bari's voice in founder-led copy, and create an internal marketing machine that improves over time from edits, approvals, replies, campaign results, and agent learning loops.

---

## 2. Product Vision

AI Campaign Desk is an internal marketing operating system that uses specialist AI agents, Bari's approved voice library, editable brand and offer rules, Blue/Bari approval consoles, Keap/Zapier execution, HelpDesk response tracking, and a learning loop from copy edits and campaign results to produce better email and ad campaigns over time while reducing the workload on Blue and Bari.

The product should make marketing feel organized, repeatable, reviewable, and safe.

The platform should answer these questions at any time:

- What campaigns are being worked on?
- What copy needs Bari's review?
- What strategic decisions need Blue's approval?
- What offers and lead magnets are available to use?
- What has already been sent?
- What performed well?
- What did people reply with?
- What has the system learned from Bari's edits?
- What rules should future campaigns follow?
- What is ready to push into Keap or Zapier?
- What integrations are connected or need configuration?

---

## 3. Product Ideology and Operating Principles

### 3.1 Human Authority, AI Heavy Lifting

The system should do the heavy lifting while humans remain the authority.

AI should:

- Generate campaign strategy.
- Recommend audiences and offers.
- Draft copy.
- Rewrite copy in Bari's voice.
- Check brand and compliance rules.
- Identify weak logic or generic writing.
- Route approvals.
- Summarize HelpDesk replies.
- Report performance.
- Suggest future improvements.

Humans should:

- Approve strategic decisions.
- Edit and approve founder-voice copy.
- Confirm risky offers or claims.
- Handle replies that require personal attention.
- Decide which learnings should become permanent rules.

### 3.2 Blue and Bari Should Not Receive More Work

The system must reduce work for Blue and Bari.

Blue should not dig through campaign details. He should have one clean review page showing only decisions that truly require him.

Bari should not be asked to write from scratch. She should have one clean review page where she can read, edit inline, leave notes, and approve copy.

The app should convert their decisions, edits, and notes into structured reusable guidance.

### 3.3 Bari's Voice Is a Company Asset

Many outbound emails are sent under Bari's name. The system must preserve and improve Bari's voice over time.

The system should not imitate random marketing copy blindly. It should primarily rely on approved historical emails, Bari's edits, approved voice rules, approved sign-offs, and before/after copy review history.

### 3.4 Source-of-Truth Libraries

The system must include centralized libraries for:

- Offers and lead magnets.
- Bari voice examples.
- Sign-offs.
- Brand rules.
- Compliance rules.
- Audience definitions.
- Campaign history.
- Learning insights.

Agents should use these libraries before generating strategy or copy.

### 3.5 Auditable Agent Workflows

Agent outputs must be visible and inspectable.

Every agent step should be stored with:

- Input snapshot.
- Output JSON.
- Confidence.
- Risk level.
- Recommendations.
- Approval implications.
- Timestamp.
- Model/provider used.

The system should never feel like an unexplained black box.

---

## 4. Target Users

### 4.1 Marketing Operator

A technical or semi-technical team member who creates campaigns, reviews drafts, prepares Keap handoffs, checks responses, and monitors performance.

Needs:

- Easy campaign creation.
- Clear status tracking.
- Agent output visibility.
- Keap/Zapier execution tools.
- Approval status visibility.
- Campaign metrics and reply intelligence.

### 4.2 Bari

Founder and voice authority. Reviews copy that goes out under her name or must sound like her.

Needs:

- Simple review inbox.
- Inline editing.
- Ability to approve quickly.
- Ability to add notes.
- Ability to turn notes into future guidance.
- Ability to manage voice rules and approved sign-offs.
- Minimal technical clutter.

### 4.3 Blue

Strategic/business approval authority. Reviews offers, lead magnets, big strategic decisions, claims, discounts, budgets, and high-risk items.

Needs:

- Simple review inbox.
- Decision-focused cards.
- Clear reason why he is needed.
- Approve/request changes/reject actions.
- Optional notes.
- No need to dig through the full campaign workflow.

### 4.4 Admin / Builder

Technical user configuring integrations, agent prompts, API keys, rules, and data connections.

Needs:

- Integration settings.
- Agent configuration visibility.
- Logs and error states.
- Webhook testing.
- API sync controls.
- Role management.

### 4.5 Internal Reviewer

Team member responsible for routine campaign review, scheduling, and operational approval.

Needs:

- Internal approval queue.
- Campaign summary.
- Final copy review.
- Keap handoff checklist.
- Send readiness validation.

---

## 5. User Roles and Permissions

The app should use Clerk for authentication and role-based access control.

### 5.1 Roles

- `admin`
- `marketing_operator`
- `copy_reviewer`
- `bari`
- `blue`
- `internal_reviewer`
- `viewer`

### 5.2 Permissions Matrix

| Capability | Admin | Marketing Operator | Bari | Blue | Internal Reviewer | Viewer |
|---|---:|---:|---:|---:|---:|---:|
| View dashboard | Yes | Yes | Limited | Limited | Yes | Yes |
| Create campaign | Yes | Yes | Optional | No | Optional | No |
| Run agents | Yes | Yes | No | No | Optional | No |
| View agent runs | Yes | Yes | Limited | Limited | Yes | No |
| Edit copy | Yes | Yes | Yes | No | Yes | No |
| Approve Bari copy | Yes | No | Yes | No | No | No |
| Approve Blue items | Admin override only | No | No | Yes | No | No |
| Manage voice rules | Yes | Optional | Yes | No | No | No |
| Manage offers/lead magnets | Yes | Yes | Optional | Optional approval | No | View only |
| Manage integrations | Yes | No | No | No | No | No |
| View HelpDesk intelligence | Yes | Yes | Optional | Optional | Yes | View only |
| Push to Keap/Zapier | Yes | Yes | No | No | Optional | No |

---

## 6. Recommended Tech Stack

### 6.1 Frontend

- Next.js App Router.
- TypeScript.
- Tailwind CSS.
- shadcn/ui components.
- Lucide icons.
- Framer Motion for subtle transitions.
- Recharts for dashboard and performance visuals.
- Vercel hosting.

### 6.2 Authentication

- Clerk.
- Organization support if appropriate.
- Role-based access through Clerk metadata or Convex user profile records.

### 6.3 Backend and State

- Convex.
- Convex tables for campaigns, approvals, agent runs, libraries, integration states, and performance snapshots.
- Convex actions for external API calls where needed.
- Convex mutations for internal data changes.
- Convex scheduled functions for sync jobs if needed.

### 6.4 Agent Orchestration

- OpenAI Agents SDK for specialist agent definitions, structured outputs, guardrails, and tool calls.
- LangGraph for graph-based workflow orchestration, long-running stateful agent flows, branching, retries, and human-in-the-loop pauses.

### 6.5 LLM Providers

Initial:

- OpenAI for structured outputs, JSON, routing, classification, tool calling, and approval logic.
- Claude for long-form copy, brand voice refinement, critique, and tone-sensitive rewrites.

Future:

- Gemini or other long-context model for larger document/history analysis.
- Small/cheap model for classification, tagging, deduping, and routine checks.

### 6.6 Integrations

- Keap API.
- Zapier webhooks.
- HelpDesk.com API/webhooks.
- Optional Gmail import/export path for historical email ingestion.
- Optional CSV import for historical campaigns and email libraries.
- Future: Meta Ads API, Google Ads API, landing page builder integrations.

### 6.7 Repository and Build Expectations

The autonomous build process should create a production-ready project with:

- Clear directory structure.
- Typed data models.
- Reusable UI components.
- Route-level organization.
- Mock/demo data for local development where credentials are missing.
- Environment variable documentation.
- Graceful disconnected integration states.
- Seed data for rules, sign-offs, agents, and sample campaigns.

---

## 7. App Information Architecture

The app should feel like an elegant operating system, not a toolbox.

### 7.1 Primary Navigation

Use a left sidebar for desktop and a responsive drawer/nav for mobile or narrow screens.

Primary nav groups:

1. **Command Center**
   - Dashboard
   - Campaigns
   - Create Campaign

2. **Review Queues**
   - Bari Copy Review
   - Blue Review
   - Internal Approvals
   - All Approvals

3. **Libraries**
   - Offers & Lead Magnets
   - Email Library
   - Bari Voice Rules
   - Sign-off Library
   - Audience Library
   - Compliance Rules
   - Learning Library

4. **Intelligence**
   - Response Intelligence
   - Performance
   - Agent Runs
   - LangGraph Map

5. **Operations**
   - Keap Sync
   - Integrations
   - Settings

### 7.2 Top Bar

Top bar should include:

- Current page title.
- Global search.
- Quick create button.
- Pending approval count.
- Integration health indicator.
- User menu.

### 7.3 Visual Style

The UI should be premium, calm, and organized.

Suggested style:

- Light neutral background with warm off-white surface tones.
- Deep navy, charcoal, or muted indigo for primary text/navigation.
- Soft accent colors for statuses.
- Rounded cards.
- Subtle shadows.
- Minimal borders.
- Generous spacing.
- Clear typography hierarchy.
- Avoid dense admin-dashboard clutter.

The interface should feel simple enough for non-technical users but powerful enough for technical operators.

### 7.4 Status Colors

Use consistent status semantics:

- Green: approved, ready, successful, low risk.
- Yellow/amber: needs review, medium risk, warning.
- Red: blocked, rejected, high risk.
- Blue: in progress, drafting, syncing.
- Purple: AI/agent-generated intelligence.
- Gray: archived, paused, inactive.

### 7.5 Layout Pattern

Most pages should follow a consistent layout:

- Header with title, description, primary action.
- Summary cards at top.
- Filters/search.
- Main content list/table/cards.
- Right-side detail drawer or full detail route.

The product should use cards for high-level review items and tables for dense libraries/history.

---

## 8. Core Routes

Use Next.js App Router.

Suggested route structure:

```text
/
/dashboard
/campaigns
/campaigns/new
/campaigns/[campaignId]
/campaigns/[campaignId]/brief
/campaigns/[campaignId]/copy
/campaigns/[campaignId]/approvals
/campaigns/[campaignId]/agent-runs
/campaigns/[campaignId]/performance
/reviews/bari
/reviews/blue
/reviews/internal
/reviews/all
/libraries/offers
/libraries/offers/[offerId]
/libraries/email
/libraries/email/[emailId]
/libraries/voice-rules
/libraries/signoffs
/libraries/audiences
/libraries/compliance
/libraries/learning
/intelligence/responses
/intelligence/responses/[ticketId]
/intelligence/performance
/intelligence/agent-runs
/intelligence/agent-runs/[runId]
/intelligence/langgraph
/operations/keap
/operations/integrations
/settings
/settings/users
/settings/roles
/settings/agents
/settings/prompts
```

---

## 9. Core Product Modules

## 9.1 Dashboard

### Purpose

Provide one clear command center for the current state of marketing activity.

### Required Elements

- Active campaigns count.
- Campaigns needing action.
- Bari review count.
- Blue review count.
- Internal approvals count.
- Campaigns ready for Keap.
- Recent HelpDesk marketing replies.
- Integration health summary.
- Recent performance highlights.
- Recent agent runs.

### Dashboard Cards

Cards should include:

- **Needs Bari**
- **Needs Blue**
- **Ready to Send**
- **Replies Needing Attention**
- **Learning Opportunities**
- **Integration Issues**

### Primary CTAs

- Create Campaign.
- Review Bari Queue.
- Review Blue Queue.
- Check Responses.
- View Agent Runs.

---

## 9.2 Campaigns

### Purpose

Track all marketing campaigns from idea to learning loop.

### Campaign Statuses

- `intake_draft`
- `agent_drafting`
- `needs_internal_review`
- `needs_bari_review`
- `needs_blue_review`
- `blocked`
- `approved`
- `ready_for_keap`
- `scheduled`
- `sent`
- `reporting`
- `learning_complete`
- `archived`

### Campaign List View

Columns/cards should show:

- Campaign name.
- Goal.
- Channel(s).
- Audience.
- Offer/lead magnet.
- Owner.
- Status.
- Risk level.
- Pending approvals.
- Last updated.
- Next action.

### Campaign Detail Page

Campaign detail should use tabs:

- Overview.
- Brief.
- Copy.
- Approvals.
- Agent Runs.
- Keap Prep.
- Responses.
- Performance.
- Learning.

### Campaign Overview

Should show:

- Goal.
- Audience.
- Offer/lead magnet.
- CTA.
- Channel plan.
- Current status.
- Agent progress.
- Approval state.
- Keap readiness.
- Response summary if sent.

---

## 9.3 Campaign Creation / Intake

### Purpose

Allow marketing users to create structured campaign requests that agents can process.

### Intake Fields

- Campaign name.
- Campaign goal.
- Campaign type.
- Channel(s): email, ad, SMS, landing page, multi-channel.
- Audience/segment.
- Offer or lead magnet.
- CTA.
- Desired send window.
- Tone.
- Bari voice required: yes/no/unsure.
- Blue approval expected: yes/no/unsure.
- Known constraints.
- Notes/context.
- Existing reference emails or campaigns.

### Campaign Goal Options

- Lead generation.
- Reactivation.
- Nurture.
- Conversion.
- Event/webinar registration.
- Product/service announcement.
- Educational sequence.
- Retargeting.
- Follow-up.
- Customer engagement.

### Campaign Intake UX

The form should feel guided rather than technical.

Use sections:

1. What are we trying to do?
2. Who is this for?
3. What are we offering?
4. What should the audience do next?
5. What rules or approvals might apply?
6. Additional context.

After submission, user should see a preview card and a button:

- Run Campaign Agent Workflow.

---

## 9.4 Agent Workflow System

### Purpose

Run structured specialist agents that transform a campaign intake into a reviewed campaign package.

### Core Workflow

```text
Campaign Intake
   ↓
Strategist Agent
   ↓
Audience/Segment Agent
   ↓
Offer/Lead Magnet Agent
   ↓
Copywriter Agent
   ↓
Bari Voice Agent
   ↓
Brand Rules Checker
   ↓
Compliance Guard
   ↓
Skeptic Agent
   ↓
Performance Agent
   ↓
Approval Router
   ↓
Bari Copy Review, if needed
   ↓
Blue Review, if needed
   ↓
Internal Final Approval
   ↓
Keap/Zapier Send Prep
   ↓
Send / Schedule
   ↓
HelpDesk Response Sync
   ↓
Response Classifier
   ↓
Performance Reporter
   ↓
Learning Loop
   ↓
Bari Voice Memory + Offer/Audience/Response Learnings
```

### LangGraph Requirement

The app must include a visual representation of this workflow.

Route:

```text
/intelligence/langgraph
```

This page should display:

- Graph nodes for each agent.
- Directional edges.
- Current run status.
- Node completion status.
- Failed/retry states.
- Human approval pauses.
- Ability to click a node and view its input/output.

The visual should be clear enough for non-technical people to understand the campaign machine.

### Agent List Visual

There should also be a clear agent roster view, likely within `/settings/agents` or `/intelligence/langgraph`.

Each agent card should show:

- Agent name.
- Icon.
- Purpose.
- Inputs.
- Outputs.
- Current model.
- Last run.
- Status.
- View prompt/config button.

### Agent Roster

#### Strategist Agent

Defines campaign angle and objective.

Outputs:

- Campaign objective.
- Strategy summary.
- Campaign angle.
- Success metrics.
- Recommended channel priority.
- Risks and assumptions.

#### Audience Agent

Chooses or validates segment and reasoning.

Outputs:

- Recommended segment.
- Segment rationale.
- Segment size if available.
- Keap tag/segment mapping.
- Exclusions.
- Confidence.

#### Offer/Lead Magnet Agent

Selects/checks offer or lead magnet against the library.

Outputs:

- Selected offer/lead magnet.
- Whether it is approved/active.
- Whether Blue review is required.
- Allowed claims.
- Banned claims.
- Suggested CTA.

#### Copywriter Agent

Writes initial campaign copy.

Outputs:

- Subject line options.
- Preview text options.
- Email/ad body variants.
- CTA.
- Sign-off suggestion if applicable.

#### Bari Voice Agent

Rewrites copy into Bari's approved voice using only approved examples, rules, sign-offs, and review history.

Outputs:

- Bari-voice draft.
- Voice confidence.
- Source examples used.
- Rules applied.
- Sign-off selected.
- Explanation of voice basis.

#### Brand Rules Checker

Checks mechanical brand and style rules.

Outputs:

- Terminology violations.
- SAGE capitalization check.
- Sign-off validity check.
- Formatting issues.
- Blocking rule violations.

#### Compliance Guard

Flags risky claims or promises.

Outputs:

- Risk level.
- Compliance flags.
- Suggested safer wording.
- Blockers.
- Blue approval requirements.

#### Skeptic Agent

Finds weak logic, generic copy, overclaims, unclear CTA, and low-specificity messaging.

Outputs:

- Weaknesses.
- Overclaim concerns.
- Generic phrases.
- Rewrite recommendations.
- Confidence.

#### Performance Agent

Predicts what to test and defines expected performance signals.

Outputs:

- Test recommendations.
- Subject line test ideas.
- CTA test ideas.
- Segment test ideas.
- Expected success metrics.

#### Approval Router

Determines approval requirements.

Outputs:

- Bari review required.
- Blue review required.
- Internal review required.
- Approval level.
- Risk level.
- Reasons.
- Blocking status.

#### Response Classifier Agent

Classifies HelpDesk replies and matches them to campaigns.

Outputs:

- Reply classification.
- Intent.
- Sentiment.
- Urgency.
- Campaign match confidence.
- Questions.
- Objections.
- Recommended next action.
- Suggested reply draft.

#### Bari Learning Agent

Learns from Bari's edits and notes.

Outputs:

- Edit patterns.
- Reusable voice insights.
- Suggested rules.
- Context-specific guidance.
- Do-not-use patterns.

#### Performance Reporter

Summarizes campaign results after send.

Outputs:

- Metric summary.
- What worked.
- What underperformed.
- Reply summary.
- Next test recommendation.

#### Learning Agent

Turns results, replies, approvals, and edits into future guidance.

Outputs:

- Learning candidates.
- Suggested persistent rules.
- Suggested offer insights.
- Suggested audience insights.
- Confidence and review requirements.

---

## 9.5 Agent Output Contract

Every agent should return structured JSON.

Base schema:

```json
{
  "agent_name": "Approval Router",
  "status": "completed",
  "risk_level": "green | yellow | red",
  "confidence": 0.82,
  "summary": "Short human-readable summary.",
  "approval_required": true,
  "approval_owner": "bari | blue | internal | none",
  "approval_reason": "Why approval is needed.",
  "blocking_issues": [],
  "recommended_next_step": "Send to Bari Copy Review.",
  "structured_outputs": {}
}
```

Agent-specific structured outputs should be nested in `structured_outputs`.

All outputs must be stored in Convex.

---

## 9.6 Bari Copy Review

### Purpose

Give Bari one dedicated place to review copy that needs her voice approval.

### Route

```text
/reviews/bari
```

### UX Requirements

Bari should see a simple, clean review queue.

Tabs:

- Needs Copy Review.
- Edited by Bari.
- Approved Recently.
- Requested Changes.
- Voice Notes.

### Review Card Summary

Each card should show:

- Campaign name.
- Audience.
- Goal.
- Subject line.
- Voice confidence.
- Risk level.
- Selected sign-off.
- Why Bari needs to review.
- Primary action.

### Copy Review Detail

The detail view should show:

- Subject line options.
- Preview text.
- Email body.
- Selected sign-off.
- AI voice explanation.
- Source examples used.
- Rules applied.
- Inline editor.
- Comment/notes panel.
- Before/after diff.
- Approval actions.

### Required Actions

- Approve.
- Approve with edits.
- Request rewrite.
- Reject voice.
- Save note for future.
- Turn note into proposed rule.

### Inline Editing

The inline editor should allow Bari to edit copy directly.

The system must store:

- Original AI draft.
- Bari-edited draft.
- Final approved copy.
- Notes.
- Diff.
- Changed phrases.
- Whether notes should be saved for future.

### Learning from Edits

After Bari approves or edits, the Bari Learning Agent should compare original vs final and create learning candidates.

Learning candidates should not automatically become permanent rules unless configured. They should be reviewable.

---

## 9.7 Blue Review

### Purpose

Give Blue one dedicated place to review strategic/business decisions.

### Route

```text
/reviews/blue
```

### UX Requirements

Blue should see a clean decision console, not a full admin app.

Tabs:

- Needs Blue Review.
- Approved Recently.
- Requested Changes.
- Rejected.
- Decision History.

### Blue Review Card

Each card should show:

- Campaign name.
- Decision needed.
- Why Blue is needed.
- Risk level.
- AI recommendation.
- What happens if approved.
- What happens if rejected.
- Related campaign/offer/audience.

### Blue Review Actions

- Approve.
- Approve with note.
- Request changes.
- Reject.

### Blue Review Item Types

- New offer approval.
- Lead magnet approval.
- Discount approval.
- Campaign direction approval.
- Audience targeting approval.
- Ad spend approval.
- Guarantee/claim approval.
- Major positioning approval.
- High-risk campaign approval.

### Required Storage

Store Blue's decision, notes, timestamp, related item, and whether the decision should apply to future campaigns.

---

## 9.8 Internal Approvals

### Purpose

Give the internal team one place to handle operational approvals.

Route:

```text
/reviews/internal
```

Approval items:

- Final campaign check.
- Keap setup ready.
- Segment confirmed.
- Send window confirmed.
- Copy approved by Bari.
- Strategy approved by Blue if needed.
- Integration handoff ready.

Actions:

- Mark ready.
- Send to Keap prep.
- Return for changes.
- Block.

---

## 9.9 Offers & Lead Magnets Library

### Purpose

Create one source of truth for what is available, possible, active, paused, retired, or previously used in marketing.

### Route

```text
/libraries/offers
```

### Supported Item Types

- Lead magnet.
- Offer.
- Discount.
- Event/webinar.
- Free call.
- Consultation.
- Guide/PDF.
- Challenge.
- Course/module.
- Video training.
- Bundle.
- Bonus.
- Deadline-based promotion.
- Evergreen promotion.

### Statuses

- Draft.
- Possible Idea.
- Needs Blue Approval.
- Approved.
- Active.
- Paused.
- Retired.
- Rejected.
- Archived.

### Required Fields

- Name.
- Type.
- Status.
- Description.
- Approval owner.
- Approved by.
- Approval date.
- Requires Blue approval each use.
- Allowed audiences.
- Disallowed audiences.
- Allowed channels.
- Disallowed channels.
- Default CTA.
- Approved claims.
- Banned claims.
- Related assets/links.
- Notes.
- Last used.
- Performance summary.

### Agent Requirements

The Offer/Lead Magnet Agent must use this library.

Agents should not invent new offers silently. If a new offer is proposed, it must be created as a proposed item with `Needs Blue Approval` status.

### Library Views

- Available Now.
- Needs Approval.
- Ideas / Possibilities.
- Previously Used.
- Retired.
- Performance.

---

## 9.10 Email Library / Bari Voice Library

### Purpose

Store historical emails and approved voice examples.

### Route

```text
/libraries/email
```

### Required Fields

- Subject line.
- Preview text.
- Body.
- Sign-off.
- Sender name.
- Campaign purpose.
- Audience.
- Offer/lead magnet.
- Send date.
- Source.
- Performance metrics.
- Bari approval status.
- Voice source rating.
- Tags.

### Voice Source Ratings

- Gold: written by Bari or directly approved by Bari.
- Silver: edited/approved by Bari.
- Bronze: sent under Bari's name but not confirmed as good voice.
- Rejected: do not imitate.
- Needs Review: imported but not evaluated.

### Retrieval Requirement

When writing founder-voice copy, agents should retrieve relevant Gold and Silver examples first.

Bronze examples may be used only with caution and should be identified as lower authority.

Rejected examples must never be used for voice imitation.

---

## 9.11 Bari Voice Rules

### Purpose

Store editable rules that guide Bari-style copy.

### Route

```text
/libraries/voice-rules
```

### Example Rules

- Always capitalize SAGE.
- Do not write Sage.
- Do not use fake scarcity.
- Avoid sounding overly corporate.
- Avoid generic inspirational fluff.
- Prefer direct encouragement.
- Use contractions naturally.
- Founder emails should feel personal, grounded, and clear.
- Never overpromise transformation.
- Do not use excessive exclamation marks.
- Use short paragraphs.
- Use one clear CTA.

### Rule Fields

- Rule text.
- Category.
- Severity: suggestion, warning, blocking.
- Applies to: email, ads, landing pages, SMS.
- Active/inactive.
- Created by.
- Source: manual, Bari edit, learning loop.
- Examples.

### Blocking Rules

If a blocking rule is violated, the system should not allow final approval until resolved.

SAGE capitalization should be a default blocking terminology rule.

---

## 9.12 Sign-off Library

### Purpose

Store approved sign-offs and context rules.

### Route

```text
/libraries/signoffs
```

### Sign-off Fields

- Name.
- Approved variants.
- Best contexts.
- Avoid contexts.
- Can agent choose automatically.
- Requires Bari review.
- Active/inactive.
- Examples.

### Example Sign-off Family

```json
{
  "name": "You can do this",
  "approved_variants": [
    "You can do this —\nBari",
    "You can do this,\nBari",
    "You can do this.\n\nBari"
  ],
  "best_for": [
    "encouraging emails",
    "confidence-building emails",
    "nurture campaigns",
    "founder voice"
  ],
  "avoid_for": [
    "urgent operational notices",
    "formal announcements",
    "technical updates"
  ],
  "can_agent_choose": true,
  "requires_review": false
}
```

---

## 9.13 Audience Library

### Purpose

Store audience definitions, Keap tag mappings, exclusions, and usage history.

### Route

```text
/libraries/audiences
```

### Required Fields

- Audience name.
- Description.
- Keap tags.
- Inclusion rules.
- Exclusion rules.
- Approximate count.
- Allowed offers.
- Disallowed offers.
- Previous campaigns.
- Performance notes.
- Active/inactive.

---

## 9.14 Compliance Rules

### Purpose

Store risky or banned claims, required disclaimers, and safer wording guidance.

### Route

```text
/libraries/compliance
```

### Fields

- Rule.
- Category.
- Severity.
- Applies to.
- Banned phrase or claim.
- Approved alternative.
- Requires Blue approval.
- Active/inactive.

---

## 9.15 Response Intelligence / HelpDesk Integration

### Purpose

Ingest and analyze replies to marketing emails that arrive through HelpDesk.com.

### Route

```text
/intelligence/responses
```

### Functionality

- Sync HelpDesk tickets/messages.
- Classify messages.
- Match replies to campaigns when possible.
- Identify hot leads.
- Identify objections and questions.
- Identify complaints and unsubscribes.
- Draft suggested replies.
- Feed response insights into campaign learning.

### Response Categories

- Marketing reply.
- General support question.
- Customer service issue.
- Sales inquiry.
- Unsubscribe/request removal.
- Complaint.
- Positive testimonial.
- Confused response.
- Booking intent.
- Not relevant.

### Response Dashboard Tabs

- Needs Reply.
- Hot Leads.
- Questions.
- Objections.
- Complaints.
- Unsubscribes.
- Testimonials.
- Unmatched.
- All Synced.

### Campaign Matching Logic

Use:

- Sender email.
- Timestamp.
- Subject similarity.
- Keap campaign/contact membership.
- Campaign send window.
- UTM/campaign IDs where available.
- Reply-to alias or hidden tracking markers if added later.

Store match confidence and reasons.

### Suggested Reply Drafts

The system may draft suggested replies but should not auto-send at MVP stage.

---

## 9.16 Performance Module

### Purpose

Track campaign metrics and feed performance into future strategy.

### Route

```text
/intelligence/performance
```

### Metrics

- Sent count.
- Delivered count.
- Open rate.
- Click rate.
- Reply count.
- Reply classification breakdown.
- Conversion count.
- Booking count.
- Unsubscribes.
- Spam complaints.
- Revenue if available.
- Winning subject line.
- Winning CTA.
- Winning audience.

### Views

- Campaign performance.
- Offer performance.
- Audience performance.
- Subject line performance.
- Reply intelligence.
- Learning recommendations.

---

## 9.17 Learning Library

### Purpose

Store reusable insights extracted from Bari edits, Blue decisions, campaign performance, HelpDesk replies, offer performance, and agent evaluations.

### Route

```text
/libraries/learning
```

### Learning Types

- Persistent voice rule.
- Context-specific voice guidance.
- One-time campaign note.
- Terminology rule.
- Sign-off preference.
- Do-not-use pattern.
- Successful copy pattern.
- Offer insight.
- Audience insight.
- Reply/objection insight.
- Performance insight.

### Learning Statuses

- Candidate.
- Approved.
- Rejected.
- Archived.

Learning candidates should be reviewable before becoming permanent guidance.

---

## 9.18 Integrations

### Purpose

Provide a dedicated place to configure, test, monitor, and manage external integrations.

### Route

```text
/operations/integrations
```

### Required Integrations

#### Clerk

- Authentication.
- User roles.
- Organization/team support.

#### Keap

- Contacts.
- Tags.
- Segments.
- Campaign trigger tags.
- Contact counts.
- Campaign handoff.
- Future: sequence enrollment where safe.

#### Zapier

- Webhook triggers.
- Approval notifications.
- Keap handoff workflows.
- Slack/email notifications if needed.

#### HelpDesk.com

- Ticket sync.
- Message sync.
- Webhook receiver.
- Response classification.

#### OpenAI

- Structured agent outputs.
- Routing/classification.
- Tool calls.

#### Claude / Anthropic

- Copywriting.
- Bari voice refinement.
- Creative critique.

#### LangGraph

- Workflow orchestration.
- Visual graph representation.
- Run states.

### Integration Page Requirements

Each integration card should show:

- Name.
- Purpose.
- Connection status.
- Last sync.
- API key/env status.
- Test connection button.
- Sync now button if applicable.
- Error state.
- Setup instructions.

### Graceful Missing Credentials

If an integration is not configured, the app should still function in demo/manual mode.

For example:

- Keap disconnected: allow manual audience entry.
- HelpDesk disconnected: allow manual response import.
- Zapier disconnected: allow copy/export.
- Claude disconnected: fallback to OpenAI copy model.

---

## 10. Data Model Requirements

Use Convex tables. Names can be adjusted by implementation, but the system should cover these entities.

### 10.1 User and Role Tables

- `users`
- `roles`
- `userRoles`

### 10.2 Campaign Tables

- `campaigns`
- `campaignIntakes`
- `campaignBriefs`
- `campaignVariants`
- `copyVariants`
- `sendBatches`
- `performanceSnapshots`

### 10.3 Agent Tables

- `agentRuns`
- `agentRunSteps`
- `agentConfigs`
- `agentPrompts`
- `langGraphRuns`
- `langGraphNodes`

### 10.4 Approval Tables

- `approvalItems`
- `approvalDecisions`
- `bariReviewItems`
- `blueReviewItems`
- `internalReviewItems`

### 10.5 Library Tables

- `offerLibrary`
- `leadMagnetLibrary`
- `campaignAssets`
- `audienceLibrary`
- `emailLibrary`
- `voiceSourceRatings`
- `bariVoiceRules`
- `signoffLibrary`
- `complianceRules`
- `learningInsights`

### 10.6 Copy Review Tables

- `copyReviews`
- `copyReviewComments`
- `copyDiffs`
- `copyLearningInsights`
- `voiceExamplesUsed`
- `approvedPhrases`
- `bannedPhrases`
- `terminologyRules`

### 10.7 Integration Tables

- `integrationConnections`
- `integrationSyncJobs`
- `keapSyncJobs`
- `zapierWebhookEvents`
- `helpdeskTickets`
- `helpdeskMessages`
- `responseClassifications`
- `campaignResponseMatches`
- `replyDrafts`

### 10.8 Audit Tables

- `auditLogs`
- `changeHistory`
- `systemEvents`

---

## 11. Example Data Shapes

### 11.1 Campaign

```json
{
  "name": "Cold Lead Reactivation — May Week 2",
  "status": "needs_bari_review",
  "goal": "reactivation",
  "channels": ["email"],
  "audienceId": "aud_123",
  "offerId": "offer_456",
  "riskLevel": "yellow",
  "createdBy": "user_123",
  "createdAt": 1777560000000,
  "updatedAt": 1777560900000
}
```

### 11.2 Approval Item

```json
{
  "campaignId": "campaign_123",
  "approvalType": "offer",
  "approvalLevel": 2,
  "assignedToRole": "blue",
  "status": "pending",
  "title": "Approve free strategy call urgency language",
  "reason": "The campaign uses urgency language tied to an offer.",
  "riskLevel": "yellow",
  "recommendedDecision": "approve_with_changes"
}
```

### 11.3 Copy Review

```json
{
  "campaignId": "campaign_123",
  "reviewerRole": "bari",
  "status": "approved_with_edits",
  "originalCopyId": "copy_abc",
  "finalCopyId": "copy_xyz",
  "notes": "Make this warmer and less corporate.",
  "saveNotesForFuture": true,
  "approvedAt": 1777560000000
}
```

### 11.4 Offer

```json
{
  "name": "Free SAGE Strategy Call",
  "type": "offer",
  "status": "active",
  "approvalStatus": "approved",
  "approvedBy": "Blue",
  "requiresBlueEachUse": false,
  "allowedChannels": ["email", "ads", "landing_page"],
  "allowedAudiences": ["warm leads", "dormant leads"],
  "defaultCta": "Book your call",
  "approvedClaims": ["Talk through your next step"],
  "bannedClaims": ["Guaranteed results"],
  "notes": "Use low-pressure language."
}
```

### 11.5 HelpDesk Classification

```json
{
  "ticketId": "ticket_123",
  "campaignId": "campaign_456",
  "classification": "marketing_reply",
  "intent": "interested_with_question",
  "sentiment": "positive",
  "urgency": "medium",
  "summary": "Lead is interested but unsure whether SAGE is beginner-friendly.",
  "questions": ["Is SAGE beginner-friendly?"],
  "objections": ["Uncertainty about fit"],
  "shouldNotifyTeam": true,
  "learningCandidate": true
}
```

---

## 12. Approval Logic

### 12.1 Approval Levels

- Level 0: Auto-pass.
- Level 1: Internal approval.
- Level 2: Bari or Blue approval.
- Level 3: Blocked.

### 12.2 Bari Review Required When

- Email is from Bari.
- Founder voice is required.
- Copy uses emotionally sensitive messaging.
- AI voice confidence is below threshold.
- Copy introduces a new sign-off or unusual tone.
- Bari review is manually requested.

### 12.3 Blue Review Required When

- New offer.
- New lead magnet.
- Discount.
- Guarantee.
- Pricing language.
- New or sensitive claim.
- New audience targeting strategy.
- Ad spend above threshold.
- Major campaign direction.
- High-risk compliance flag.

### 12.4 Internal Review Required When

- Campaign is ready for execution.
- Keap setup must be verified.
- Segment must be confirmed.
- Schedule must be confirmed.
- Final pre-send checklist must be completed.

### 12.5 Blocking Conditions

- SAGE capitalization error.
- Unapproved sign-off.
- Rejected/banned claim.
- Missing audience.
- Missing offer/CTA.
- Required Bari approval not complete.
- Required Blue approval not complete.
- Compliance Guard marks high-risk blocker.

---

## 13. Keap and Zapier Execution Flow

### 13.1 Initial Execution Model

Use a hybrid approach:

- Keap API for contact/tag/segment operations.
- Zapier webhooks for quick handoffs, notifications, and automation bridges.
- Manual fallback/export for early MVP.

### 13.2 Keap Capabilities

The app should eventually support:

- Pulling Keap tags.
- Pulling approximate segment/contact counts.
- Mapping audiences to tags.
- Creating/applying campaign trigger tags.
- Preparing sequence enrollment where safe.
- Recording campaign metadata locally in Convex.

### 13.3 Zapier Capabilities

The app should support:

- Sending webhook when campaign is approved.
- Sending webhook when Bari review is needed.
- Sending webhook when Blue review is needed.
- Sending webhook when campaign is ready for Keap.
- Sending webhook when important HelpDesk reply is detected.

### 13.4 Send Prep Checklist

Before a campaign can be marked ready for Keap:

- Campaign brief complete.
- Copy approved.
- Bari approval complete if needed.
- Blue approval complete if needed.
- Internal approval complete.
- Offer active/approved.
- Audience confirmed.
- Compliance blockers cleared.
- Keap handoff/export prepared.

---

## 14. HelpDesk Integration Flow

### 14.1 Sync Methods

Support:

- Webhook ingestion if available/configured.
- Scheduled API polling fallback.
- Manual import fallback for MVP/demo.

### 14.2 Sync Steps

1. Pull ticket/message from HelpDesk.
2. Store raw message.
3. Classify message.
4. Attempt campaign match.
5. Create response intelligence record.
6. Notify team if needed.
7. Attach to campaign if matched.
8. Feed into performance and learning modules.

### 14.3 No Auto-Send Replies in MVP

The system may draft suggested replies, but should not send responses automatically in MVP.

---

## 15. Visual and Interaction Requirements

### 15.1 General Feel

The app should feel:

- Clean.
- Calm.
- Premium.
- Organized.
- Simple.
- Trustworthy.
- Aesthetic but not flashy.
- Workflow-oriented.

### 15.2 Component Patterns

Use:

- Sidebar shell.
- Dashboard cards.
- Status pills.
- Review cards.
- Detail drawers.
- Tabbed detail pages.
- Inline editors.
- Diff views.
- Timeline views.
- Agent graph visualization.
- Empty states with useful guidance.

### 15.3 Non-Technical User Design

Bari and Blue pages should avoid technical words like JSON, agent run ID, API, and graph unless hidden behind details.

Operator/admin pages can expose more detail.

### 15.4 Copy Editor UX

The Bari copy editor should support:

- Editable subject line.
- Editable preview text.
- Editable body.
- Editable sign-off selection.
- Notes/comments.
- Save draft.
- Approve.
- Request rewrite.
- View diff.
- View source examples.
- View rules used.

### 15.5 Diff UX

Diff view should show:

- Original AI draft.
- Final approved copy.
- Highlighted edits.
- Learning extraction summary.

---

## 16. MVP Scope

### 16.1 MVP 1 — Core Platform

Must include:

- Clerk auth.
- App shell/navigation.
- Dashboard.
- Campaign creation.
- Campaign list/detail.
- Mock or real agent workflow execution.
- Agent run storage.
- Bari Copy Review.
- Blue Review.
- Internal Approvals.
- Offers & Lead Magnets library.
- Bari Voice Rules.
- Sign-off Library.
- Basic Email Library.
- Integration settings shell.

### 16.2 MVP 2 — Real Agent Workflow

Must include:

- Strategist Agent.
- Audience Agent.
- Offer Agent.
- Copywriter Agent.
- Bari Voice Agent.
- Brand Rules Checker.
- Compliance Guard.
- Skeptic.
- Approval Router.
- LangGraph workflow representation.
- Structured JSON outputs.

### 16.3 MVP 3 — Keap/Zapier

Must include:

- Keap connection status.
- Pull tags/segments if credentials exist.
- Audience mapping.
- Zapier webhook trigger.
- Ready-for-Keap handoff.
- Manual export fallback.

### 16.4 MVP 4 — HelpDesk Response Intelligence

Must include:

- HelpDesk integration shell.
- Ticket/message sync or manual import.
- Response Classifier.
- Response dashboard.
- Campaign matching.
- Learning candidates from replies.

### 16.5 MVP 5 — Performance and Learning

Must include:

- Manual metric entry.
- Performance Reporter.
- Learning Library.
- Bari edit learning extraction.
- Campaign performance summaries.

### 16.6 MVP 6 — Ads Extension

Must include:

- Expand to Ads button.
- Ad copy variants.
- Creative brief generation.
- Budget approval routing.
- Ad-specific approval checklist.
- Manual export.

---

## 17. Ads Extension Requirements

Ads should be a phase-two workflow after email is stable.

### Workflow

```text
Approved Campaign Brief
   ↓
Ad Strategist Agent
   ↓
Audience/Platform Agent
   ↓
Ad Copywriter Agent
   ↓
Creative Brief Agent
   ↓
Compliance Guard
   ↓
Skeptic
   ↓
Approval Router
   ↓
Human/Blue approval
   ↓
Manual launch or API/Zapier handoff
   ↓
Ad performance report
   ↓
Learning Loop
```

### Ad Outputs

- Meta ad copy.
- Google search headlines.
- Google descriptions.
- Retargeting copy.
- Landing page hero copy.
- Creative brief.
- Video hook ideas.
- Audience targeting suggestion.
- Budget recommendation.
- Risk review.
- Blue approval items if needed.

The MVP should not directly launch ad spend.

---

## 18. Environment Variables

Expected environment variables:

```text
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_CONVEX_URL=
CONVEX_DEPLOYMENT=
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
KEAP_CLIENT_ID=
KEAP_CLIENT_SECRET=
KEAP_REDIRECT_URI=
KEAP_ACCESS_TOKEN=
KEAP_REFRESH_TOKEN=
ZAPIER_CAMPAIGN_APPROVED_WEBHOOK_URL=
ZAPIER_REVIEW_NEEDED_WEBHOOK_URL=
HELPDESK_CLIENT_ID=
HELPDESK_CLIENT_SECRET=
HELPDESK_WEBHOOK_SECRET=
HELPDESK_ACCESS_TOKEN=
```

Implementation should gracefully handle missing optional integration variables.

---

## 19. Error Handling and Empty States

### 19.1 Integration Errors

Show:

- Disconnected.
- Missing credentials.
- Last sync failed.
- Rate limited.
- Auth expired.
- Retry available.

### 19.2 Agent Errors

Show:

- Which agent failed.
- Error summary.
- Retry button.
- Skip/manual override if safe.
- View logs for admins.

### 19.3 Empty States

Examples:

- No campaigns yet: prompt to create first campaign.
- No Bari reviews: show clean success state.
- No offers: prompt to add first offer/lead magnet.
- Keap disconnected: show setup instructions and manual mode.
- HelpDesk disconnected: show setup instructions and manual import option.

---

## 20. Auditability Requirements

The app must track:

- Who created campaigns.
- Who edited copy.
- What Bari changed.
- What Blue approved/rejected.
- What agents produced.
- What rules were applied.
- What copy was final.
- What was sent/exported.
- What replies came in.
- What learnings were generated.
- What rules were added/changed.

Audit logs should be visible to admins.

---

## 21. Security and Privacy Requirements

- Use Clerk authentication.
- Enforce role-based access.
- Do not expose API keys to frontend.
- Store external tokens securely.
- Avoid logging sensitive token values.
- Restrict integration settings to admins.
- Avoid auto-sending customer replies in MVP.
- Do not allow agents to bypass human approval for risky actions.

---

## 22. Seed Data Requirements

The initial build should include seed/demo data for:

- Sample campaigns.
- Sample Bari review item.
- Sample Blue review item.
- Sample offer.
- Sample lead magnet.
- Sample Bari voice rules.
- Sample sign-offs.
- Sample email library records.
- Sample HelpDesk response classifications.
- Sample agent roster.
- Sample LangGraph workflow nodes.

This allows the app to look useful immediately without live integrations.

---

## 23. Acceptance Criteria

### 23.1 Core App

- User can sign in with Clerk.
- User can navigate all primary sections.
- Dashboard shows meaningful cards.
- Campaigns can be created and viewed.
- Campaign detail page has required tabs.

### 23.2 Reviews

- Bari has a dedicated review queue.
- Blue has a dedicated review queue.
- Internal approvals exist separately.
- Approval actions update item status.
- Notes are stored.

### 23.3 Libraries

- Offers/lead magnets can be created, edited, viewed, filtered.
- Voice rules can be created, edited, disabled.
- Sign-offs can be created and selected.
- Email library supports voice source ratings.

### 23.4 Agents

- Agent roster is visible.
- LangGraph workflow visual exists.
- A campaign can run through a simulated or real agent workflow.
- Agent outputs are stored and viewable.
- Approval Router creates review items.

### 23.5 Bari Voice

- Copy review supports original and edited copy.
- Diff/learning records can be created.
- SAGE capitalization rule exists as a blocking default.
- Approved sign-off library is used.

### 23.6 Integrations

- Integration settings page exists.
- Keap, Zapier, HelpDesk, OpenAI, Claude statuses are visible.
- Missing integrations do not break the app.
- Manual fallback modes exist.

### 23.7 Response Intelligence

- HelpDesk response dashboard exists.
- Responses can be manually seeded/imported.
- Response classification records are visible.
- Responses can be attached to campaigns.

### 23.8 UX

- App feels cohesive and polished.
- Non-technical users can understand Bari/Blue review pages.
- Technical users can inspect agent runs and integrations.
- Navigation is organized and not tool-clumpy.

---

## 24. Out of Scope for First Build

- Fully autonomous sending without approval.
- Direct paid ad launch/spend automation.
- Fine-tuned Bari voice model.
- Complex multi-tenant enterprise permissions.
- Full Keap campaign builder replacement.
- Full HelpDesk reply sending.
- Revenue attribution if not already available.

---

## 25. Future Enhancements

- Direct Meta Ads integration.
- Direct Google Ads integration.
- Landing page generation.
- SMS campaign workflow.
- Fine-tuned Bari voice model if retrieval/rules are not enough.
- Advanced A/B testing automation.
- Automated reply drafting with approval.
- More advanced segmentation recommendations.
- Performance prediction model.
- Campaign calendar planning.
- Slack notifications.
- Executive weekly digest for Blue/Bari.
- Voice quality score trend over time.

---

## 26. Implementation Guidance for Autonomous Build Agent

Build this as a polished internal SaaS-style application, not as a collection of disconnected pages.

Prioritize:

1. Strong information architecture.
2. Clear review queues for Bari and Blue.
3. Clean campaign lifecycle.
4. Reusable source-of-truth libraries.
5. Agent workflow visibility.
6. Integration framework with graceful disconnected states.
7. Seed data that makes the product understandable immediately.
8. Aesthetic, calm, streamlined UI.

The first build should be functional even if integrations are mocked. Live integrations can be connected progressively.

The app should make it obvious that this is a serious internal marketing command center that can grow into Keap execution, HelpDesk intelligence, and ad campaign expansion.

---

## 27. Recommended First-Build Page Order

The build agent should implement in this order:

1. App shell, theme, navigation, Clerk auth shell.
2. Convex schema and seed data.
3. Dashboard.
4. Campaigns list/detail/new campaign.
5. Bari Copy Review.
6. Blue Review.
7. Internal Approvals.
8. Offers & Lead Magnets.
9. Bari Voice Rules and Sign-off Library.
10. Email Library.
11. Agent Runs and LangGraph visual.
12. Integration settings.
13. Keap Sync shell.
14. Response Intelligence shell.
15. Performance and Learning Library.

---

## 28. Final Product Definition

AI Campaign Desk should become the company's internal marketing memory and execution planner.

It should know:

- What Bari sounds like.
- What Blue has approved.
- What offers exist.
- What lead magnets exist.
- What audiences exist.
- What has been sent.
- What people replied with.
- What worked.
- What failed.
- What rules changed.
- What the next campaign should learn from.

The goal is not only to create better campaigns.

The goal is to create a system that gets better every time the team uses it.
