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

- [ ] `Reports` is active on `/reports`.
- [ ] `Reports` remains active on `/reports/[slug]`.
- [ ] `Pro` is active on `/pro`.
- [ ] `Methodology` is active on `/methodology` and inactive on non-existent descendants.
- [ ] `Disclaimer` is active on `/disclaimer` and inactive on non-existent descendants.
- [ ] No more than one primary nav item is active at the same time.
- [ ] No deprecated `Pricing` nav item appears in primary navigation.
- [ ] Mobile navigation remains readable and horizontally scrollable without clipping active-state styling.

### 2. `/pro` layout clarity and differentiation

- [ ] The page explains the choice before the offer cards: one decision week vs full-month continuity.
- [ ] Single Issue is framed as a one-week decision memo, not a subscription.
- [ ] Monthly Bundle is framed as continuity across the month, not just a discount.
- [ ] Each offer includes distinct "best when" and "not built for" guidance.
- [ ] Copy preserves the one-time Stripe checkout model.
- [ ] Copy does not introduce account, login, entitlement, or subscription expectations.
- [ ] The `Plan comparison` section still reinforces Free vs Single Issue vs Monthly Bundle roles.
- [ ] Primary CTAs remain scoped to the two existing Stripe Payment Link products only.

### 3. Report/archive freshness trust cues

- [ ] `/reports` shows archive trust cues derived from the newest committed report artifact in the build.
- [ ] `/reports/[slug]` shows report trust cues derived from the matching committed artifact.
- [ ] Trust cues display published date, artifact generated timestamp, artifact schema, and render source.
- [ ] Missing `generatedAt` values fall back safely without breaking the page.
- [ ] Copy explicitly states that rendering uses committed local artifacts and does not depend on runtime market-data fetches.
- [ ] Artifact ordering remains newest-first by `publishedAt`, then by slug as tiebreaker.
- [ ] Trust-cue language increases freshness confidence without overstating live or real-time data.

## Week 1 merge gate

### APPROVE only if all of the following are true

- All hard constraints remain true in both code and copy.
- Navigation active-state behavior matches the checklist on `/reports`, `/reports/[slug]`, `/pro`, `/methodology`, and `/disclaimer`.
- `/pro` clearly differentiates Single Issue from Monthly Bundle before checkout decisions are presented.
- Freshness trust cues on archive and report pages are backed by committed local artifact metadata, not runtime fetches.
- Existing Stripe Payment Link behavior and current Vercel delivery model remain unchanged.
- Affected automated coverage exists for:
  - nav active-state behavior
  - `/pro` differentiation surface
  - archive/report trust-cue presence
- No new copy creates expectations for subscriptions, logins, gated runtime access, or live market-data rendering.

### BLOCK if any of the following are true

- Any hard constraint is violated.
- Any primary nav item is active on the wrong route, or exact-match pages incorrectly inherit active state from child 404 paths.
- `/pro` still reads like two nearly identical offers, or the Monthly Bundle value proposition is not visibly about continuity.
- Trust cues are missing from either archive or report detail pages, or are sourced from anything other than committed local artifacts.
- Freshness copy implies live or runtime-updated market data when the page is actually static/build-time rendered.
- The change alters Stripe product behavior, introduces auth/entitlement concepts, or adds runtime render dependency on external APIs.
- Required automated coverage for the touched behavior is missing or regressed.

## Review of submitted engineering outputs

### Review result

APPROVE from static review, pending normal CI and browser verification.

### Policy compliance

- Pass. The reviewed changes reinforce static-first behavior instead of weakening it.
- Pass. The `/pro` copy continues to state one-time Stripe purchases and explicitly avoids subscription and account language.
- Pass. The new freshness UI is tied to committed local JSON artifacts and explicitly says no runtime market-data fetch is required.
- Pass. No database, auth, entitlement, or Stripe/Vercel model changes were introduced in the reviewed files.

### Correctness

- Pass. Navigation logic now requires explicit prefix matching, which fixes false-positive active states for exact-match pages such as `/methodology` and `/disclaimer`.
- Pass. Smoke coverage was added for exact-route nav behavior and for the presence of archive/report trust-cue surfaces.
- Pass. Archive freshness trust cues use the latest sorted artifact, and report detail trust cues use the artifact matching the current slug.
- Pass. Formatter and repository changes support generated timestamp display and artifact metadata access cleanly.

### Maintainability

- Good. `ArtifactTrustCard` centralizes trust-cue presentation instead of duplicating markup across pages.
- Good. Repository access now exposes artifact metadata through a focused record type, which keeps freshness logic close to the file-backed source of truth.
- Acceptable. `/pro` copy additions are more verbose, but the new selection guide makes the differentiation rules explicit and reviewable.

### Risk level

- Overall risk: Low.
- Main residual risk: automated checks were not run in this environment because `node` and `npm` are not available on the current shell path.
- Secondary residual risk: current e2e coverage verifies trust-cue presence more than value accuracy, so CI should remain the final guard for integration regressions.

### Required fixes if BLOCK

- None at this time from static review.
- If CI or browser verification fails, the failure should be treated as merge-blocking under the gate above.
