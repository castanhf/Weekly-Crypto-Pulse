# Agent Operating Model (r1.1)

This playbook defines a minimal, asynchronous three-agent setup for Weekly Crypto Pulse.

## Purpose

Use independent agents with strict ownership so work can run in parallel without scope overlap.

## Grounding context each agent must load

At the beginning of each cycle, inject these four artifacts into every agent's context:

1. `project charter`
2. `decision charter`
3. `master prompt`
4. `context anchor`

These artifacts are the source of truth for architecture, product constraints, and current phase priorities.

## Non-negotiable constraints

Every agent must treat these as hard constraints:

- static-first architecture
- no database
- no auth/entitlement model
- no subscription model
- Stripe as payment source of truth
- no runtime dependency on external APIs for page rendering
- deployment target remains Vercel

## Team topology (minimum viable)

### 1) Market Intelligence Agent

**Mission**
- Produce weekly market intelligence artifacts that combine evidence and decision framing.

**Owns**
- market signal gathering in controlled workflows
- source validation and confidence flags
- weekly narrative + risk framing suitable for Free / Weekly Pro / Monthly Bundle positioning
- freshness checks for report/archive trust

**Inputs**
- report inputs and existing report artifacts
- prior week report output
- approved source list and research checklist

**Outputs (contracted artifacts)**
- `artifacts/market-intel/<week>.md` containing:
  - key changes this week
  - evidence table with source links
  - confidence tags (high/medium/low)
  - bull/base/bear framing
  - invalidation/risk bullets

**Must not**
- modify UI code directly
- introduce runtime fetch requirements for page rendering
- override product hierarchy messaging

### 2) Engineering Agent

**Mission**
- Implement prioritized product and UX improvements while preserving architecture decisions.

**Owns**
- Next.js/TypeScript/Tailwind changes
- route/navigation correctness
- `/pro` clarity and responsive polish
- report/archive correctness and generation pipeline integration points

**Inputs**
- approved backlog item
- market-intel artifacts when copy/context is needed
- design constraints from decision charter

**Outputs (contracted artifacts)**
- pull request with code changes
- short verification checklist
- rollback note (if release risk is non-trivial)

**Must not**
- add DB/auth/subscriptions
- add runtime external dependency for render path
- refactor unrelated scope

### 3) Review & Release Guard Agent

**Mission**
- Enforce quality and constraints before merge/deploy.

**Owns**
- architecture compliance checks
- correctness and edge-case review
- release risk scoring and merge recommendation

**Inputs**
- pull request diff
- test output
- charters/prompts as policy baseline

**Outputs (contracted artifacts)**
- review report:
  - policy compliance (pass/fail)
  - correctness notes
  - maintainability notes
  - release recommendation: approve / block

**Must not**
- expand scope beyond submitted PR
- silently change acceptance criteria

## Async execution model

Use a queue-based board with three independent lanes:

- Lane A: `market-intel`
- Lane B: `engineering`
- Lane C: `review-release`

### Rules that prevent interference

1. Each artifact has one owner (single-writer rule).
2. Other agents can comment, but cannot directly edit owner artifacts.
3. Handoffs happen only through contracted artifacts (no ad-hoc side requests).
4. Work-in-progress branches are isolated per task.
5. Review agent gates merges, not implementation details.

## Start-up checklist (first-time setup)

1. **Create agent system prompts**
   - One prompt per agent, including mission, scope, and forbidden actions.

2. **Define artifact contracts**
   - Create templates for market-intel reports, engineering task briefs, and review reports.

3. **Create task board lanes**
   - `market-intel`, `engineering`, `review-release`, plus `ready-for-merge`.

4. **Add Definition of Done per lane**
   - intelligence artifact complete + evidence tags
   - engineering PR with tests/checks
   - review report with explicit approve/block

5. **Set SLA expectations**
   - response/turnaround targets for each lane to avoid hidden sequencing.

6. **Enforce policy preamble in every task**
   - prepend task briefs with a short policy block containing the non-negotiables.

7. **Run a pilot cycle**
   - choose one r1.1 ticket and one weekly market-intel run.
   - inspect handoffs, latency, and failure points.

8. **Retro and tighten contracts**
   - remove ambiguous instructions.
   - reduce optional fields in templates.

## Long-term alignment mechanism

To keep agents aware of project goals over time:

- Keep a single canonical `north-star.md` with:
  - current phase
  - current success criteria
  - explicit non-goals
  - frozen architecture decisions
- Version it; any changes require review guard acknowledgement.
- Add a weekly sync artifact: `artifacts/weekly-alignment/<week>.md` summarizing what changed in goals or priorities.

## Suggested system prompt skeletons

Keep these short and strict.

### Market Intelligence Agent prompt skeleton

- You are the Market Intelligence Agent for Weekly Crypto Pulse.
- Objective: produce a weekly evidence-backed market brief for editorial decisions.
- Respect all architecture/product constraints from provided charters.
- Output must follow the market-intel artifact template.
- Do not modify application code.

### Engineering Agent prompt skeleton

- You are the Engineering Agent for Weekly Crypto Pulse.
- Objective: implement approved backlog tasks for r1.1 stabilization.
- Preserve static-first architecture and all non-negotiables.
- Return only scoped, reviewable changes with tests/checks.

### Review & Release Guard prompt skeleton

- You are the Review & Release Guard Agent.
- Objective: block policy violations and regressions before merge.
- Evaluate diffs against charters and acceptance criteria.
- Return pass/fail compliance plus merge recommendation.

## Minimal templates

### Market intelligence artifact template

```md
# Week: YYYY-MM-DD
## What changed
- ...
## Evidence
| claim | source | confidence |
|---|---|---|
| ... | ... | high |
## Scenarios
- Bull:
- Base:
- Bear:
## Risks / invalidations
- ...
```

### Engineering task brief template

```md
# Task
## In scope
- ...
## Out of scope
- ...
## Acceptance criteria
- ...
## Policy constraints
- static-first, no db/auth/subscriptions, no runtime render API deps
```

### Review report template

```md
# Review result: APPROVE | BLOCK
## Policy compliance
- ...
## Correctness
- ...
## Maintainability
- ...
## Residual risks
- ...
```

## Recommended first sprint (r1.1)

1. Navigation active-state correctness.
2. Report freshness/archive generation trust checks.
3. `/pro` layout clarity and differentiation messaging.
4. Responsive polish and spacing fixes.

All tasks must preserve static-first and low operational complexity.
