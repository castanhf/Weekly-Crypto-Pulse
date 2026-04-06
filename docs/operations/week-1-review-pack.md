# Week 1 Review Pack

## Scope

- Navigation active-state correctness
- `/pro` layout clarity and differentiation
- Report/archive freshness trust cues

## Hard constraints

- Static-first
- No database
- No auth or entitlement
- No subscriptions
- No runtime external API dependency for page rendering
- Stripe and Vercel decisions unchanged

## Week 1 review checklist

### 1. Navigation active-state correctness

- [ ] `Reports` and only `Reports` is active on `/reports`.
- [ ] `Reports` and only `Reports` is active on `/reports/[slug]`.
- [ ] `Pro` and only `Pro` is active on `/pro`.
- [ ] `Methodology` and only `Methodology` is active on `/methodology`.
- [ ] `Methodology` is inactive on non-existent descendants such as `/methodology/<missing-child>`.
- [ ] `Disclaimer` and only `Disclaimer` is active on `/disclaimer`.
- [ ] `Disclaimer` is inactive on non-existent descendants such as `/disclaimer/<missing-child>`.
- [ ] No more than one primary nav item is active at the same time on any reviewed route.
- [ ] No deprecated `Pricing` nav item appears in primary navigation.
- [ ] Mobile navigation remains readable and horizontally scrollable without clipping active-state styling.

### 2. `/pro` layout clarity and differentiation

- [ ] The page explains the choice before the offer cards: one decision week vs month-long continuity.
- [ ] Single Issue is framed as a one-week decision memo, not a subscription or ongoing plan.
- [ ] Monthly Bundle is framed as continuity across the month, not just as a discount.
- [ ] The two offers do not read as near-duplicates in headline, supporting copy, or CTA context.
- [ ] Each offer includes distinct "best when" and "not built for" guidance.
- [ ] Copy preserves the one-time Stripe Payment Link checkout model.
- [ ] Copy does not introduce account, login, entitlement, or subscription expectations.
- [ ] The `Plan comparison` section still reinforces Free vs Single Issue vs Monthly Bundle roles.
- [ ] Primary CTAs remain scoped to the two existing Stripe Payment Link products only.

### 3. Report/archive freshness trust cues

- [ ] `/reports` shows archive trust cues derived from the newest committed report artifact in the build.
- [ ] `/reports/[slug]` shows report trust cues derived from the matching committed artifact.
- [ ] Trust cues display published date, artifact generated timestamp, artifact schema, and render source.
- [ ] Missing `generatedAt` values fall back safely without breaking the page or leaving trust UI blank.
- [ ] Copy explicitly states that rendering uses committed local artifacts and does not depend on runtime market-data fetches.
- [ ] Artifact ordering remains newest-first by `publishedAt`, then by slug as tiebreaker.
- [ ] Trust-cue language increases freshness confidence without overstating live or real-time data.

## Week 1 merge gate rubric

### APPROVE only if all of the following are true

- All hard constraints remain true in both code and copy.
- Navigation active-state behavior matches the route checklist on `/reports`, `/reports/[slug]`, `/pro`, `/methodology`, and `/disclaimer`.
- `/pro` clearly differentiates Single Issue from Monthly Bundle before checkout decisions are presented.
- Freshness trust cues on archive and report pages are backed by committed local artifact metadata, not runtime fetches.
- Existing Stripe Payment Link behavior and current Vercel delivery model remain unchanged.
- Affected automated coverage exists or is updated for nav active-state behavior, `/pro` differentiation surface, and archive/report trust-cue presence.
- No new copy creates expectations for subscriptions, logins, gated runtime access, or live market-data rendering.

### BLOCK if any of the following are true

- Any hard constraint is violated.
- Any primary nav item is active on the wrong route, or exact-match pages incorrectly inherit active state from child 404 paths.
- `/pro` still reads like two nearly identical offers, or the Monthly Bundle value proposition is not visibly about continuity.
- Trust cues are missing from either archive or report detail pages, or are sourced from anything other than committed local artifacts.
- Freshness copy implies live or runtime-updated market data when the page is actually static/build-time rendered.
- The change alters Stripe product behavior, introduces auth/entitlement concepts, or adds runtime render dependency on external APIs.
- Required automated coverage for the touched behavior is missing or regressed.
