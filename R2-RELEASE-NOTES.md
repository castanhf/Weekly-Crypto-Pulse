# R2 Release Notes

This document tracks all merged PRs across the R2 release phases.

## Release plan

R2 ships in two phases:

- **R2.0** — Invisible-to-readers infrastructure. Schema versioning, repository unification, agent additions, security baseline, brand simplification, plainspoken pass on chrome, build-time chart computation infrastructure.
- **R2.1** — Reader-visible launch. Daily pipeline activation, unified archive, charts on weeklies, merged paid block, /pro restructure, email list, Pro-pack updates.

## Architectural exceptions noted in R2

Two deliberate exceptions to the original "four env vars" line in the architectural constitution:

- `OPENAI_API_KEY` — added as a fallback LLM provider for pipeline reliability when GitHub Models is unavailable. Hard usage cap set in OpenAI dashboard.
- Beehiiv API key — added for email distribution via Beehiiv (newsletter signup and daily/weekly digest emails).

The Decision Register language updates from strict "four env vars" to "minimal env vars, justified additions only."

## R2.0 — Merged PRs

- **WCP-102** — Schema versioning policy adopted (semver, `schemaVersion` field on artifacts). Daily schema v1.0 introduced (`domain/daily.ts`). Weekly schema bumped to v1.1 (additive, optional `plainspokenOpening` field). Validator dispatches per version; legacy `"1.0"` string treated as `weekly@1.0`. PR: #102
- **WCP-103** — Unified repository layer added. New `lib/reports/daily-repository.ts` and `lib/reports/artifact-repository.ts` provide a discriminated-union view over weekly + daily artifacts for surfaces that mix them. Existing weekly repository unchanged. `data/dailies/` directory created (empty until R2.1). PR: #103
- **WCP-104** — Daily pipeline agent definitions added: `daily_researcher.md`, `daily_writer.md`, `daily_editor.md`. Pipeline Runner extended for daily cadence orchestration. Drift-tracking note added to both researchers per decision 22a. Permission for DeFiLlama added to settings. No daily generation scripts yet — those ship in R2.1. PR: #104
- **WCP-105** — LLM client abstraction added at `lib/llm/`. Supports GitHub Models (primary) and OpenAI (fallback) with retry-on-delay, exponential backoff, and provider failover. Existing weekly pipeline refactored to consume the new client (behavior unchanged). `OPENAI_API_KEY` added as 5th env var. Decision Register (`docs/operations/decision-register.md`) created with env var policy, schema versioning policy, and two-provider architecture decision. PR: #105
- **WCP-106** — Chart infrastructure added at `lib/charts/`. Time-series window helpers (as-of-date semantics per locked decision 25c). Static SVG chart rendering for snapshot trend and regime history. PNG export via `sharp` for Pro-pack deliverables. `recharts` dependency added for R2.1 website chart components. Regime color tokens added to Tailwind config. No charts rendered on pages yet — R2.1 wires components and Pro-pack consumption. PR: #106
- **WCP-107** — Brand simplification: "Crypto Pulse" is now the master brand for all site chrome (header wordmark, footer, X share text, email footer signatures, RSS `<title>`, `README.md`). "Weekly Crypto Pulse" / "Daily Crypto Pulse" retained as cadence prefixes in per-artifact metadata and product names. `SITE_NAME`, `WEEKLY_TITLE_PREFIX`, and `DAILY_TITLE_PREFIX` constants exported from `lib/site.ts`. Decision D-04 added to Decision Register. PR: #107
- **WCP-108** — Plainspoken accessibility pass applied to site chrome copy: homepage, methodology, disclaimer, archive page header, /pro explainer prose, SEO meta descriptions, tier-differentiation component, and product prose in `domain/pro-product.ts`. Methodology expanded with named data sources (CoinGecko, Alternative.me), plain-language regime definitions, and AI-assisted drafting disclosure. Editorial decisions documented in Decision Register under "Editorial decisions." Report bodies and Pro signals untouched per decision 12b. /pro structural restructure (15b) deferred to R2.1. PR: #108
- **WCP-109** — Security baseline established: Next.js upgraded 14.2.5 → 14.2.35 (critical vuln fix; remaining high-severity advisories require Next.js 15.x, deferred); Dependabot added for weekly npm + GitHub Actions scanning; CI hardened with SHA-pinned actions, `contents: read` permission scope, and `--audit-level=critical` npm audit step; full CSP + five additional security headers added to `next.config.mjs`; prompt injection defense sections added to `market_researcher.md` and `daily_researcher.md`; CodeQL SAST workflow added (push/PR/weekly schedule); `docs/operations/security.md` created documenting the full posture; security decisions block added to Decision Register. 11 new unit tests (security-headers + actions-sha-pinning suites). PR: #109
- **WCP-110** — R2.0 final cleanup: CI audit threshold annotated with R2.1 restoration TODO in both `ci.yml` and `security.md`; `security.md` corrected (was incorrectly describing `--audit-level=high`); manual CSP verification across all five chrome pages confirmed clean; OG image situation documented (no image exists — text-only OG metadata; not blocking). Final commit before R2.0 → main merge. PR: #110

## R2.0 — Phase complete

Phase merged to `main` on 2026-05-06 as `v2.0.0`. See merged-PRs list above.

R2.1 (reader-visible launch) begins. First work unit: Next.js 14 → 16 upgrade.

## R2.1 — Merged PRs

- **WCP-121** — Synced `release/r2.1` with main (6 interim commits: CodeQL Dependabot fix, 5 Dependabot updates) and upgraded Next.js 14.2.35 → 16.2.5. Resolves 5 high-severity advisories: GHSA-9g9p-9gw9-jx7f, GHSA-h25m-26qc-wcjf, GHSA-ggv3-7p47-pfv8, GHSA-3x4c-7xq6-9pq8, GHSA-q4gf-8mx6-v5v3. ESLint 8 → 9 (required peer dep). Async params/searchParams migration applied to 3 route files. CI audit threshold restored to `--audit-level=high`. Turbopack is now the default build bundler. Bundle size metric format changed (Turbopack does not report webpack-style "First Load JS"). PR: #121
- **WCP-122** — Daily pipeline scripts and GitHub Actions workflow. Implements researcher (`generate-daily-input.ts`; calls CoinGecko Markets + Global, Fear & Greed Index, DeFiLlama chains via 30-min file cache; LLM for catalysts + news items), writer (`generate-daily-report.ts`; LLM → `daily@1.0` draft, self-correction pass, weekly footer appended as last `worthKnowing` item — Option A), editor (`review-daily-report.ts`; 9-item LLM checklist, max 2 revision rounds, auto-approve on round 3), promoter (`promote-daily-artifact.ts`), placeholder (`generate-daily-placeholder.ts`), orchestrator (`run-daily-pipeline.ts`), and validator (`validate-daily-artifacts.ts`). File cache at `lib/cache/file-cache.ts` (30-min TTL, stale fallback). GitHub Actions workflow `daily-pipeline.yml` fires at 06:00 UTC with `workflow_dispatch` fallback (cron activates on merge to main). 242 unit tests all passing. PR: #122
- **WCP-123** — Data-layer expansion: shared asset registry, DeFiLlama TVL integration, CryptoPanic real news. Three work units: (WU1) `lib/markets/asset-categories.ts` — canonical stablecoin/wrapped Sets (24 stablecoins, 23 wrapped/derivative tokens) shared between daily and weekly researchers via predicates. (WU2) `lib/markets/defi-llama.ts` — extracted DeFiLlama fetch + notable movement detection; `domain/market-data.ts` gains `ChainTvlEntry`, `NotableTvlMovement`, `CapitalFlows` types; weekly schema bumped to `weekly@1.2` (optional `capitalFlows` field). (WU3) `lib/news/crypto-panic.ts` — CryptoPanic news fetch with 30-min cache, importance scoring (votes.positive > 50 → high), and empty-array-on-failure semantics; `lib/llm/prompt-helpers.ts` adds `wrapNewsItemsForPrompt()` for prompt-injection-safe XML wrapping. Weekly researcher (`generate-report-input.ts`) expanded from BTC/ETH/SOL-only to top-15 by market cap with stablecoin/wrapped flags, DeFiLlama TVL, and CryptoPanic news; hard-coded mover constraint removed. `generate-local-report.ts` passes through `capitalFlows` + emits `weekly@1.2`. Agent specs, decision register, security.md, `.env.example` updated with `CRYPTOPANIC_API_KEY` (7th env var). 325 tests passing (83 new across 5 new test files). PR: #123
