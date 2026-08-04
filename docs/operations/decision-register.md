# Decision Register

This file records architectural and operational decisions that shaped the project — the kind of choices where the context behind them matters as much as the choice itself. New entries are appended; existing entries are updated in place when a decision is revisited.

---

## D-01 — Environment variable policy

**Decision:** Minimal env vars; justified additions only.

**Current set (7 live, excluding auto-injected GITHUB_TOKEN and dev-only ENABLE_FULFILLMENT_ASSIST and NEXT_PUBLIC_ANALYTICS_ENABLED):**

| Variable | Purpose | When added |
|---|---|---|
| `STRIPE_PAYMENT_LINK_WEEKLY_PRO` | Stripe Payment Link for Weekly Pro Single Issue CTA | R1 |
| `STRIPE_PAYMENT_LINK_MONTHLY_BUNDLE` | Stripe Payment Link for Monthly Bundle CTA | R1 |
| `NEXT_PUBLIC_SITE_URL` | Canonical site URL for metadata and share links | R1 |
| `NEXT_PUBLIC_X_HANDLE` | Optional X/Twitter handle for Open Graph metadata | R1 |
| `ANTHROPIC_API_KEY` | Anthropic API key for LLM fallback when GitHub Models is unavailable | R2.0 (WCP-105), swapped R2.1 (WCP-132) |
| `BEEHIIV_API_KEY` | Beehiiv API key for email list management and broadcast sends | R2.1 (WCP-136) |
| `BEEHIIV_PUBLICATION_ID` | Beehiiv publication ID scoping all API calls to the Crypto Pulse publication | R2.1 (WCP-136) |

**R2.1 audit note (WCP-136):** Reconciled actual env var count with documentation. Previous D-01 listed `BEEHIIV_API_KEY` as "planned" and omitted `BEEHIIV_PUBLICATION_ID`. Both are now live. The daily-pipeline.yml workflow was also corrected to use `ANTHROPIC_API_KEY` instead of the legacy `OPENAI_API_KEY` reference (the OpenAI→Anthropic swap happened in WCP-132 but the workflow env var was not updated).

**R2.1 pre-merge audit (WCP-139):** The Stripe Payment Link env vars (`STRIPE_PAYMENT_LINK_WEEKLY_PRO`, `STRIPE_PAYMENT_LINK_MONTHLY_BUNDLE`) were confirmed intentional — the env-var-driven approach was introduced in R1 and is documented in `.env.example`. The "/pro page shows checkout unavailable" behavior is by design when the env vars are not set. Fix is operator-side: populate the vars in Vercel with actual Stripe Payment Link URLs. `NEXT_PUBLIC_ANALYTICS_ENABLED` added to `.env.example` as a dev-only optional var (not counted in live total).

**Original constraint (R1):** "no more than four env vars." Enforced strictly through R1.

**Updated constraint (R2.0):** Minimal env vars; justified additions only. Each addition requires a documented reason in this register.

**Justification for ANTHROPIC_API_KEY (added WCP-105 as OPENAI_API_KEY, swapped to Anthropic in WCP-132):** Pipeline reliability. GitHub Models (the primary LLM provider) is a free tier with rate limits and occasional availability gaps. The weekly pipeline is time-critical (Monday 06:00 UTC automation). Anthropic serves as a fallback provider in `lib/llm/client.ts` — the client retries on the primary, then falls back automatically. A hard usage cap via prepaid credit is set at console.anthropic.com to prevent runaway costs. The key is optional at runtime (the pipeline attempts GitHub Models first), but strongly recommended.

**R2.1 swap: OpenAI → Anthropic Sonnet 4.6 as fallback (WCP-132).** Operator chose Anthropic for editorial quality preference and ecosystem alignment. When fallback fires, output quality must match or exceed primary. Sonnet 4.6 is materially better at editorial writing and instruction-following than Haiku at our small fallback-only usage volume; cost difference is negligible at 100% fallback rate.

**Note on CRYPTOPANIC_API_KEY (added WCP-123, removed WCP-124):** CryptoPanic discontinued their free API tier on 2026-04-01. The integration was removed in WCP-124 and replaced with a multi-source RSS aggregator (`lib/news/rss-aggregator.ts`) requiring no API key. News now comes from public RSS feeds (CoinDesk, The Block, Decrypt, CoinTelegraph, Bloomberg Crypto, Ethereum Foundation Blog). The aggregator uses Jaccard dedup and cross-source coverage to score importance.

---

## D-02 — Schema versioning policy

**Decision:** All artifacts carry a `schemaVersion` field using `{artifact-type}@{major}.{minor}` format.

**Rationale:** Enables validators and repository layers to dispatch per version, supporting additive changes (minor bumps) without breaking existing artifacts. The legacy `"1.0"` string is aliased to `"weekly@1.0"` for backward compatibility with R1-era artifacts.

**Versions in use:**

| Artifact type | Current version | Notes |
|---|---|---|
| Weekly report | `weekly@1.3` | Introduced in WCP-153. Adds optional `sectionLabels` field. `weekly@1.2` = capitalFlows (WCP-123). `weekly@1.1` = plainspokenOpening. `weekly@1.0` = legacy. |
| Daily report | `daily@1.2` | Introduced in WCP-153. Top-N winners/losers (N=1); `MoverEntry` gains `priceUsd`+`priceChange24hUsd`; `whatMoved` gains `sectionLabels`. `daily@1.1` = weeklyFooter (WCP-132). `daily@1.0` = initial (WCP-102). |

**Bump rules:** Minor bumps for additive optional fields. Major bumps for breaking structural changes. A major bump requires a migration plan (new validator branch + documentation update here).

**Coordination checklist:** See `docs/operations/schema-bumps.md` for the full layer-by-layer checklist. The automated guard is `lib/reports/schema-bump-coverage.test.ts` — it walks `VALID_DAILY_SCHEMA_VERSIONS` and `VALID_WEEKLY_SCHEMA_VERSIONS` and verifies that both the artifact validator and repository parser support every listed version.

---

## D-03 — Two-provider LLM architecture

**Decision:** GitHub Models is the primary LLM provider; Anthropic is the sole fallback. No third provider.

**Rationale:** GitHub Models is free and uses `GITHUB_TOKEN` (auto-injected in every Actions workflow), making it zero-marginal-cost for the pipeline. Anthropic adds cost but provides reliability when GitHub Models hits rate limits or is unavailable. Adding a third provider would add complexity without proportionate reliability gain — the bottleneck is prompt quality, not provider diversity.

**Implementation:** `lib/llm/client.ts` with `callGithubModels` and `callAnthropic` as provider functions. Retry policy: 3 retries with exponential backoff (1m, 3m, 9m) on retryable errors before falling back. Both providers use identical request/response types (`LlmRequest`, `LlmResponse` in `lib/llm/types.ts`).

### LLM provider stack (R2.1)

Primary: **GitHub Models** with `gpt-4o-mini`. Free with GITHUB_TOKEN auth.
Fallback: **Anthropic API** with `claude-sonnet-4-6`. Pay-as-you-go with prepaid credit.

Rationale for Sonnet 4.6 over Haiku 4.5 as fallback model: when fallback fires, output quality must match or exceed primary. Haiku may produce noticeably different (lower-quality) editorial output than gpt-4o-mini on GitHub Models. Sonnet is materially better at editorial writing and instruction-following at our small fallback-only usage volume; cost difference is negligible ($30-40/year worst case at 100% fallback rate).

Retry/backoff policy unchanged: 60s/180s/540s exponential backoff on retryable errors, fall through to secondary on persistent or non-retryable failures.

**Constraint:** Do not add a third fallback or speculative providers without revisiting this decision.

---

## D-04 — Brand naming: "Crypto Pulse" vs "Weekly Crypto Pulse"

**Decision (WCP-107):** "Crypto Pulse" is the master brand for all site chrome. "Weekly Crypto Pulse" and "Daily Crypto Pulse" are cadence prefixes reserved for per-artifact metadata (report titles, pro-pack headers, product names).

**Rationale:** The site will eventually host daily and weekly cadences side by side. Using "Weekly Crypto Pulse" in the header, footer, OG tags, and share text would anchor the brand to a single cadence and make rebranding expensive. Separating the site brand from the artifact cadence prefix decouples navigation chrome from content cadence.

**Scope of change:**
- **Category A (site chrome — changed):** `lib/site.ts` (`SITE_NAME`), `components/layout/footer.tsx`, `components/reports/report-share-block.tsx` share text, `lib/fulfillment-assist.ts` email signatures, `lib/site.test.ts`, `README.md` H1
- **Category B (per-artifact — unchanged):** Report JSON `title` fields, pro-pack document headers, `domain/pro-product.ts` product names, `lib/fulfillment-assist.ts` product name lines (e.g. "Weekly Crypto Pulse Pro — Single Issue")
- **Category C (page copy — deferred to Prompt 8):** `/pro` page headings, `/methodology`, `lib/seo.ts` descriptions
- **Category D (historical docs — unchanged):** `docs/`, `.claude/agents/`, LLM system prompts

**Constants scaffolded for R2.1:** `WEEKLY_TITLE_PREFIX = 'Weekly Crypto Pulse'` and `DAILY_TITLE_PREFIX = 'Daily Crypto Pulse'` exported from `lib/site.ts` for use in per-artifact `<title>` and OG title composition.

---

## Editorial decisions

### Voice register: plainspoken on chrome, sophisticated on reports

**Decision (WCP-108, locked decisions Q12 → 12b, Q2 → 2a):** Site chrome copy uses plainspoken voice — assume the reader is intelligent but not specialized. No unexplained jargon. No advisory framing. Educate, don't advise.

**In-scope chrome (plainspoken):** Homepage, methodology, disclaimer, archive page header, /pro explainer prose, SEO meta descriptions, tier-differentiation usage ladder card, shared product prose in `domain/pro-product.ts` that renders as page copy.

**Out-of-scope (unchanged):** Report body content (`sections` field, weekly narrative), Pro signals package content (thesis checklist, risk review, watchlist levels), Pro-pack deliverables. These stay in sophisticated voice — that is the register the primary audience (intermediate-to-veteran retail) expects from the analytical product.

**Voice rules applied (WCP-108):**
- No unexplained jargon: "regime", "flows", "institutional positioning", "decision memo", "thesis", "continuity workflow", "actionable posture" translated or removed from chrome
- No advisory framing: "you should", "we recommend", "this is a good time to" never appear in chrome copy
- No marketing register: "trusted source", "actionable insights", "cutting-edge analysis" not used
- Concrete over abstract: named data sources (CoinGecko, Alternative.me), explicit cadence (weekly on Mondays, shorter daily updates), plain regime definitions
- AI-assisted drafting explicitly disclosed on the methodology page

**Boundary note:** The Monday weekly's plainspoken opening section (decision 23a, R2.1) is the bridge: chrome-register opening on a sophisticated-register body.

---

## Security decisions

### Security baseline established R2.0

**Decision (WCP-109):** Crypto Pulse maintains a documented security baseline focused on the actual threat surface of a static-first editorial product with manual fulfillment.

**Baseline covers:** secret hygiene (inventory, NEXT_PUBLIC_ review, rotation cadence), dependency security (Dependabot, npm audit in CI, Next.js upgrade to 14.2.35), GitHub Actions hardening (SHA pinning, permission scoping, trigger safety), security headers (CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy), LLM prompt injection defenses (documented in researcher agents), Stripe surface integrity (no webhooks, runtime-gated internal page, no PII in repo), and CodeQL SAST.

**Ongoing review cadence and rotation policies** documented in `docs/operations/security.md`.

**Threat model review trigger:** The threat model is reviewed whenever any new persistent state, authentication system, or third-party integration is added. Such additions are explicitly not planned (the architecture constitution prohibits them), but each would change the threat surface materially.

**Constraint:** Do not add commercial SAST scanners (Snyk, Sonarqube, etc.) beyond CodeQL. They add operational cost and complexity without proportionate benefit for this architecture.

---

## Free/Pro content boundary (locked R2.1)

### No content gating — Pro is additive

**Decision (WCP-134, locked):** Free weekly and daily reports are fully readable on the site. No content is hidden, blurred, truncated, or gated mid-article.

**Pro is additive:** The Pro Pack contains content that does not appear on the free site at all — decision memo, thesis checklist, risk review, and watchlist levels. There is no "preview of Pro content followed by a paywall." Free readers see a complete report; Pro buyers receive additional depth by email.

**The conversion surface is end-of-page:** The paid block appears after the full report content on both weekly and daily pages. Readers complete the free report before seeing any conversion prompt. This is deliberate: the free product must feel complete and respected.

**What is forbidden (enforced by test):**
- Blurred or obscured content in any field of any artifact JSON
- Strings that imply gating: "gated", "paywall", "locked content", "preview only"
- Mid-article CTAs that interrupt the reading experience

**Editorial reasoning:** Readers upgrade because they trust what they've been getting for free, not because they were teased. The free product's quality is the conversion mechanism.

---

## D-05 — Email distribution deferred (Option B1 minimal abstraction) (R2.1.1)

**Decision (WCP-150):** Email distribution is disabled via `BEEHIIV_BROADCAST_ENABLED=false`. Pipeline orchestrators are decoupled from any specific ESP via the `EmailSender` interface in `lib/email/email-sender.ts`. Beehiiv-specific code is preserved at `lib/email/beehiiv-email-sender.ts` for future reuse.

**Root cause:** Beehiiv's Send API (programmatic broadcast trigger) is restricted to Enterprise tier. The free/Creator tier supports subscriber management and Beehiiv's own editorial UI, but not API-driven broadcast sends. This was not documented in Beehiiv's public API docs and was only discoverable via a 403 in production.

**Re-enablement options (in order of operator preference):**
1. Upgrade Beehiiv to Enterprise (custom pricing)
2. Migrate to an alternative ESP with a Send API on affordable plans (Resend, Buttondown)
3. Continue deferral indefinitely (current state)

**Architecture constraint:** Do not add ESP-specific send calls directly to pipeline orchestrators. All send calls go through the `EmailSender` interface so the ESP can be swapped without touching orchestration.

**Full checklist:** See `docs/operations/email-distribution.md`.

---

## D-06 — Winners/losers: top-N rule with adaptive section labels (R2.1.1)

**Decision (WCP-153):** Replace the pre-R2.1.1 >5% threshold for including an asset in the winners/losers section with a top-N-by-percent-change rule:
- Daily reports: N=1 (exactly 1 winner + 1 loser, always)
- Weekly reports: N=3 (3+3, always)

Adaptive section labels: on all-positive days (all-loser candidates have positive change), the loser section is labeled "Weakest gainers"; on all-negative days (all-winner candidates have negative change), the winner section is labeled "Smallest losses". Default labels are "Top gainers" and "Biggest losers".

**Rationale:** The threshold rule produced structurally inconsistent output — on quiet days, winners/losers were empty, forcing prose padding and editorial confusion. Top-N always provides context and is editorially honest: the section adapts its label to match the actual market character.

**Single source of truth:** `lib/markets/winners-losers.ts` (`computeMovers`). Schema bump: `daily@1.1 → 1.2`, `weekly@1.2 → 1.3`. Backward compat preserved via validator dispatch.

---

## D-07 — Per-agent LLM configuration (R2.1.1)

**Decision (WCP-152):** Each pipeline script defines its own `*_LLM` constant specifying primary and secondary providers. The writer, editor, and Sunday digest writer use `primary: 'anthropic'` (Sonnet 4.6); the researcher uses `primary: 'github-models'` (gpt-4o-mini).

**Rationale:** Editorial quality requires Sonnet 4.6. Researcher tasks are structured data gathering, where gpt-4o-mini is sufficient and free (via GITHUB_TOKEN). Separating the config per script makes provider routing explicit and auditable.

**Constraint:** Do not create a global LLM config. Each script's routing must be visible at the call site. If a script's requirements change, update its `*_LLM` constant and document the change here.

**Full routing table and cost projections:** See `docs/operations/model-configuration.md`.

---

## D-08 — LLM numeric override for trillion-scale USD values (R2.2)

**Decision (WCP-207):** After LLM output is parsed in `generateReportInput()`, `snapshot.totalMarketCapUsd` is unconditionally overridden with the raw value from the authoritative CoinGecko `/global` endpoint — the LLM's value is discarded.

**Root cause:** LLMs consistently misplace the decimal point when converting trillion-scale numbers from formatted prompt context (e.g. `"$2.316T"`) back to raw USD integers. The LLM produced `2316000000` (2.3 billion) instead of `2316000000000` (2.3 trillion) — a 1000× error that propagated to the homepage widget, the email broadcast, and the stored artifact.

**Implementation:** `scripts/generate-report-input.ts` — after `parseAndValidate(llmOutput)`, the final output object is constructed as:
```typescript
const finalOutput = {
  ...reportInput,
  snapshot: { ...reportInput.snapshot, totalMarketCapUsd: marketData.totalMarketCapUsd },
  capitalFlows,
  sectionLabels
};
```
`marketData.totalMarketCapUsd` is the raw value fetched from `https://api.coingecko.com/api/v3/global` earlier in the same function — never touched by the LLM.

**Regression test:** `scripts/generate-report-input.test.ts` — "overrides totalMarketCapUsd with CoinGecko global value even when LLM returns a wrong-scale number".

**Constraint:** Never trust LLM output for raw numeric values that represent large-scale financial figures. Any field that requires a trillion-scale integer must be sourced from the authoritative data fetch, not from LLM JSON output. Extend this pattern to any new snapshot fields of the same scale.

---

## D-09 — Dependabot PR triage automation (R2.3)

**Decision (WCP-224):** Dependabot PRs are triaged automatically via two GitHub Actions workflows:
1. `dependabot-triage.yml` — triggers on PR open/reopen by `dependabot[bot]`; classifies the update as patch / minor / major; auto-approves and enables auto-merge for patches; posts a manual-review comment for major updates.
2. `dependabot-stuck-ci-watch.yml` — runs Monday 09:00 UTC; flags PRs open >7 days with non-passing CI; opens a GitHub issue with the stuck-PR report.

**Companion scripts:** `scripts/dependabot-triage.mjs`, `scripts/dependabot-stuck-ci-watch.mjs` (Node.js ESM, no added npm dependencies — use `gh` CLI and `node:child_process` only).

**Agent spec:** `.claude/agents/dependabot-triage.md` — for manual triage sweeps or edge cases the automation cannot handle.

**Rationale:** The backlog of Dependabot PRs (#188, #194, #197, #199–#206) grew while the project lacked any automated triage. Manual review of each PR was blocking merge cycles. The automation handles the unambiguous cases (patches) without operator input, surfaces the ambiguous ones (majors, stuck CI) for explicit human decision, and creates an audit trail via GitHub labels and issues.

**Constraint:** The triage workflow must never auto-approve or auto-merge major-version updates. Major bumps require a human to review breaking changes before any merge action. If the version-inference logic in `dependabot-triage.mjs` cannot determine the update type, the PR must be flagged as `dependabot-review-needed` — not approved.

**PR #188 note (postcss bump):** This PR predates the automation and must be triaged manually. Check whether the bumped postcss version is within the Tailwind v4 peer requirement range. If CI passes and it is, approve as minor. See `.claude/agents/dependabot-triage.md` for the full triage checklist.
