# R2 Release — Crypto Pulse 2.1.0

## R2.0 — Infrastructure (released 2026-05-06 as v2.0.0)

Schema versioning, unified repository layer, daily pipeline agent definitions, LLM client
abstraction (GitHub Models primary + fallback), chart infrastructure, brand simplification,
plainspoken accessibility pass, security baseline (Next.js CVE fixes, Dependabot, CSP, CodeQL).

PRs: #102, #103, #104, #105, #106, #107, #108, #109, #110.

---

## R2.1 — Reader-visible launch (this release, v2.1.0)

### Daily editorial pipeline

- Multi-stage agent flow: researcher (CoinGecko + DeFiLlama + RSS news) → writer (LLM,
  self-correction) → editor (14-item LLM checklist, up to 2 revision rounds, auto-approve on
  round 3) → promoter (commits artifact to `data/dailies/`)
- LLM provider abstraction with retry/backoff; Anthropic Claude Sonnet 4.6 fallback (replacing
  OpenAI)
- Top-50 asset coverage with stablecoin/wrapped exclusion list (24 stablecoins, 23 derivatives)
- DeFiLlama TVL integration for capital-flow detection
- Multi-source RSS aggregation across 6 outlets (CoinDesk, The Block, Decrypt, CoinTelegraph,
  Bloomberg Crypto, Ethereum Foundation Blog) — reactive replacement for CryptoPanic after free
  tier was discontinued
- Schema versioning: `daily@1.0` → `daily@1.1` (`plainspokenOpening` field added); weekly
  schema at `weekly@1.2` (`capitalFlows` optional field)
- Drift-tracking discipline: agent specs in `.claude/agents/` and pipeline script system prompts
  kept in sync manually (both must be updated together)
- Build-time winners/losers validator enforcing that `whatMoved` is populated when eligible
  movers exist in researcher input
- GitHub Actions `daily-pipeline.yml` on 06:00 UTC cron + `workflow_dispatch` fallback

### Content surface expansion

- Daily reports rendered at `/reports/[slug]` with dedicated `DailyReportPage` component
- Unified `/reports` archive with mixed weekly/daily cards, chronological order, regime badges
  on weeklies, compact daily cards
- Interactive charts on weekly pages: snapshot trend (12-week Recharts line chart) + regime
  history (Recharts bar chart)
- Programmatic OG images per report via Next.js file-based convention (`opengraph-image.tsx`)
- Two RSS feeds (`/rss.xml` weekly, `/rss/daily.xml` daily) with `<atom:link>` self-links and
  `<link rel="alternate">` auto-discovery headers in `<head>`
- Sitemap at `/sitemap.xml` covering all weekly reports + last 30 dailies

### Conversion and distribution

- Single paid block per report page (below charts on weeklies; bottom of section grid on
  dailies); all other scattered CTAs removed
- `/pro` page restructured with six-section value proposition
- Content gating policy locked: no paywalls, no teasing, no truncation — the paid block is the
  only conversion surface
- Beehiiv email integration: subscriber API client, homepage and footer signup forms,
  `/api/subscribe` route, tiered subscriptions (Monday weekly + Sunday digest; optional daily
  opt-in via tag)
- Weekly email composition wired into `generate-local-report.ts`
- Sunday digest pipeline (`run-sunday-digest-pipeline.ts`) with LLM framing paragraph
- Daily digest email wired into `run-daily-pipeline.ts` (skipped on Sundays)
- Pro pack deliverables now include embedded market snapshot trend and regime history chart PNGs
  (12-week visual context, rendered server-side via `sharp`)

### Brand and editorial

- "Crypto Pulse" master brand on all site chrome; "Weekly/Daily Crypto Pulse" as cadence
  prefixes on per-artifact metadata and product names
- Title metadata format: `Weekly Crypto Pulse — {headline}` / `Daily Crypto Pulse — {headline}`
- Plainspoken voice rules locked in `daily_writer.md` and `daily_editor.md`: forbidden headline
  patterns, causal attribution rules, tag specificity, summary editorial rules
- Data correctness fixes: `snapshot` and `topTracked.marketCapUsd` overridden from researcher
  data (not LLM output); market cap units handled as USD billions
- Nav active state visibility fix

### Public showcase preparation

- AGPL-3.0 license (full `LICENSE` file; `"license"` field in `package.json`)
- Public-facing `README.md` rewritten: architecture narrative, tech stack table, local dev
  instructions, pipeline commands, project structure directory map
- `CONTRIBUTING.md`: scope (in/out), process, code style, test requirements
- `SECURITY.md`: email contact, 48h response SLA, in/out scope, responsible disclosure policy
- Pre-public security audit: secret scan clean, PII check clean, gitignore gaps patched

---

## Operational improvements

- Test suite grew from 242 (R2.0 close) to 422 (R2.1 close); 15 new tests added in final PRs
- 17 sub-PRs across WCP-121 through WCP-137, plus WCP-138 (closeout)
- Two reactive inserts: CryptoPanic free-tier discontinuation (WCP-124), quality fixes after
  live artifact validation (WCP-125)
- Bundle size monitoring temporarily paused pending Turbopack-native baseline (Next.js 16
  changed bundler format)
- Env var set evolved from 4 → 7 (added `ANTHROPIC_API_KEY`, `BEEHIIV_API_KEY`,
  `BEEHIIV_PUBLICATION_ID`; removed `CRYPTOPANIC_API_KEY`; `OPENAI_API_KEY` swapped for
  `ANTHROPIC_API_KEY`)

---

## R2.1 — Detailed PR log

- **WCP-121** — Next.js 14.2.35 → 16.2.5. Resolves 5 high-severity CVEs. ESLint 8 → 9.
  Async params/searchParams migration. Turbopack becomes default. PR: #121
- **WCP-122** — Daily pipeline scripts and GitHub Actions workflow. Researcher, writer, editor,
  promoter, placeholder, orchestrator, validator. File cache at `lib/cache/file-cache.ts`
  (30-min TTL). PR: #122
- **WCP-123** — Shared asset registry, DeFiLlama TVL integration, CryptoPanic news (later
  replaced). Weekly schema → `weekly@1.2`. PR: #123
- **WCP-124** — News source swap: CryptoPanic → multi-source RSS (`lib/news/rss-aggregator.ts`,
  `fast-xml-parser`, Jaccard dedup). `CRYPTOPANIC_API_KEY` removed. PR: #124
- **WCP-125** — Quality fixes: data correctness (market cap units), brand strings (`SITE_URL`
  from `lib/site.ts`), agent prompt tuning (headlines, summaries, causal attribution, tags).
  Script system prompts updated in sync with agent specs. PR: #125
- **WCP-132** — Reader-visible launch: Anthropic Sonnet 4.6 fallback. `daily@1.1` schema.
  Daily report pages. Unified `/reports` archive. PR: #132
- **WCP-133** — Charts on weekly pages (Recharts snapshot trend + regime history). PR: #133
- **WCP-134** — Conversion surface: paid block, gating policy locked, nav fix, /pro restructure.
  PR: #134
- **WCP-135** — Title metadata format, two RSS feeds, sitemap, programmatic OG images. PR: #135
- **WCP-136** — Beehiiv email integration: tiered subscriptions, weekly/daily/Sunday digest
  sends, signup forms, `/api/subscribe`. PR: #136
- **WCP-137** — Pro pack chart embedding, winners/losers enforcement, public showcase prep
  (AGPL-3.0, README, CONTRIBUTING, SECURITY, security audit). PR: #137
- **WCP-138** — R2.1 closeout: repo audit, release notes consolidation, version bump. PR: #138

---

## R2.1.1 — Follow-up items (post-launch backlog)

Carry this list forward as the starting backlog for R2.1.1.

1. **React 18 → 19 upgrade** — blocked on downstream ecosystem readiness
2. **ESLint 9 flat config migration** — current ESLint 9 runs in legacy compat mode
3. **CRLF line-ending normalization** — add `.gitattributes` for consistent line endings
4. **Bundle size monitoring reactivation** — establish Turbopack-native baseline, then re-wire
   the CI budget check
5. **Component render testing** — jsdom or happy-dom setup for React component tests (currently
   unit + integration only, no DOM)
6. **Live API smoke tests for LLM client** — verify provider failover behavior against real
   endpoints in a non-CI environment
7. **Agent spec vs. script prompt deduplication** — the parallel maintenance burden is high;
   evaluate whether scripts can import from agent spec files at runtime
8. **`parseAndValidateLlmJson` hardcoded provider field** — investigate the hardcoded fallback
   and replace with dynamic provider detection
9. **Email template polish** — review rendered output across Gmail, Outlook, Apple Mail after
   first sends
10. **Custom sending domain** — configure DKIM/SPF/DMARC once production domain is acquired
11. **Deliverability tuning** — monitor open/bounce/complaint rates for first 2-4 weeks
12. **Subscriber management edge cases** — re-subscriptions, tag changes, bounce handling
13. **A/B testing of signup placement and copy** — once subscriber baseline is established
14. **Multi-tier signup analytics instrumentation** — daily opt-in conversion rate tracking
15. **Sunday digest writer prompt tuning** — after first live run
16. **Unsubscribe flow / preference centre link in email footers** — currently relies on
    Beehiiv's auto-appended footer
17. **Beehiiv webhook for delivery confirmation** — currently fire-and-forget
18. **Email open/click analytics integration**
19. **Enable GitHub Code Scanning in repo settings** — CodeQL Action is in place; Settings →
    Code Security → Code Scanning must be enabled manually in the private → public transition
20. **Live Beehiiv integration test** — full end-to-end subscriber + send flow verification
21. **Pro pack smoke run** — generate a pack for a recent weekly, convert to PDF with pandoc,
    verify chart images render
22. **Stripe Payment Link wiring** — replace placeholders with real URLs once Stripe account
    is configured for production
