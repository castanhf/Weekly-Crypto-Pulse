# Decision Register

This file records architectural and operational decisions that shaped the project — the kind of choices where the context behind them matters as much as the choice itself. New entries are appended; existing entries are updated in place when a decision is revisited.

---

## D-01 — Environment variable policy

**Decision:** Minimal env vars; justified additions only.

**Current set (6 planned, 5 live):**

| Variable | Purpose | When added |
|---|---|---|
| `STRIPE_PAYMENT_LINK_WEEKLY_PRO` | Stripe Payment Link for Weekly Pro Single Issue CTA | R1 |
| `STRIPE_PAYMENT_LINK_MONTHLY_BUNDLE` | Stripe Payment Link for Monthly Bundle CTA | R1 |
| `NEXT_PUBLIC_SITE_URL` | Canonical site URL for metadata and share links | R1 |
| `NEXT_PUBLIC_X_HANDLE` | Optional X/Twitter handle for Open Graph metadata | R1 |
| `OPENAI_API_KEY` | OpenAI API key for LLM fallback when GitHub Models is unavailable | R2.0 (WCP-105) |
| `BEEHIIV_API_KEY` | Beehiiv email distribution API key _(planned R2.1)_ | — |

**Original constraint (R1):** "no more than four env vars." Enforced strictly through R1.

**Updated constraint (R2.0):** Minimal env vars; justified additions only. Each addition requires a documented reason in this register.

**Justification for OPENAI_API_KEY (added WCP-105):** Pipeline reliability. GitHub Models (the primary LLM provider) is a free tier with rate limits and occasional availability gaps. The weekly pipeline is time-critical (Monday 06:00 UTC automation). OpenAI serves as a fallback provider in `lib/llm/client.ts` — the client retries on the primary, then falls back automatically. A hard usage cap is required in the OpenAI dashboard to prevent runaway costs. The key is optional at runtime (the pipeline attempts GitHub Models first), but strongly recommended.

---

## D-02 — Schema versioning policy

**Decision:** All artifacts carry a `schemaVersion` field using `{artifact-type}@{major}.{minor}` format.

**Rationale:** Enables validators and repository layers to dispatch per version, supporting additive changes (minor bumps) without breaking existing artifacts. The legacy `"1.0"` string is aliased to `"weekly@1.0"` for backward compatibility with R1-era artifacts.

**Versions in use:**

| Artifact type | Current version | Notes |
|---|---|---|
| Weekly report | `weekly@1.1` | Introduced in WCP-102. `weekly@1.0` = alias for legacy `"1.0"` |
| Daily report | `daily@1.0` | Introduced in WCP-102 |

**Bump rules:** Minor bumps for additive optional fields. Major bumps for breaking structural changes. A major bump requires a migration plan (new validator branch + documentation update here).

---

## D-03 — Two-provider LLM architecture

**Decision:** GitHub Models is the primary LLM provider; OpenAI is the sole fallback. No third provider.

**Rationale:** GitHub Models is free and uses `GITHUB_TOKEN` (auto-injected in every Actions workflow), making it zero-marginal-cost for the pipeline. OpenAI adds cost but provides reliability when GitHub Models hits rate limits or is unavailable. Adding a third provider would add complexity without proportionate reliability gain — the bottleneck is prompt quality, not provider diversity.

**Implementation:** `lib/llm/client.ts` with `callGithubModels` and `callOpenAI` as provider functions. Retry policy: 3 retries with exponential backoff (1m, 3m, 9m) on retryable errors before falling back. Both providers use identical request/response types (`LlmRequest`, `LlmResponse` in `lib/llm/types.ts`).

**Constraint:** Do not add an Anthropic provider, a third fallback, or speculative providers without revisiting this decision.

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
