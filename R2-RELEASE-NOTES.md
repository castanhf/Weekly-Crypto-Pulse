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

## R2.1 — Merged PRs

_(populated as PRs land in `release/r2.1`)_
