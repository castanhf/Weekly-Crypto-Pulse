# Crypto Pulse — R1 Context Document

> This document is a Claude context aid for R2 planning conversations. It summarises what was built in R1, how the system works, and what gaps carry forward. Feed this into any future session before discussing new work.

---

## 1. What the Project Does

**Crypto Pulse** is a static-first Next.js editorial web application that delivers weekly cryptocurrency market intelligence. It has no database, no authentication, and no server-side runtime dependencies — every page renders from committed JSON artifacts.

### Content Tiers

| Tier | Price | Editorial Role | Delivery |
|------|-------|----------------|----------|
| **Free** | $0 | Orientation — understand what changed this week | Public pages |
| **Weekly Pro Single Issue** | $29 one-time | Decision — concrete posture, invalidation cues, watchlist levels for one week | Manual email after Stripe payment |
| **Monthly Bundle** | $79 one-time | Continuity — cross-week thesis tracking, regime shifts, month-end synthesis across exactly 4 weekly reports | Manual email after Stripe payment |

### Audience
Educated retail investors and sophisticated crypto market participants who want a structured weekly read without the noise.

### Payment Model
Stripe Payment Links are the sole checkout mechanism. No subscriptions. No user accounts. Fulfillment is entirely manual: the operator verifies a Stripe payment and emails the buyer a watermarked Markdown artifact generated via CLI.

### Deployment
Vercel (static generation). GitHub Actions commits report artifacts to the repo every Monday at 06:00 UTC, triggering a Vercel redeploy automatically.

---

## 2. R1 Features Shipped

### Frontend
- **`/`** — Home page: latest report, editorial tier explainer, conversion copy
- **`/reports`** — Archive listing all free reports in reverse chronological order
- **`/reports/[slug]`** — Report detail page with free content sections + Pro upgrade CTAs (2× Single Issue, 2× Monthly Bundle per page)
- **`/pro`** — Offers page with tier differentiation table and Stripe CTA buttons
- **`/methodology`** and **`/disclaimer`** — Supporting editorial pages
- **`/internal/fulfillment`** — Env-gated (`ENABLE_FULFILLMENT_ASSIST`) fulfillment assistant for manual CLI command generation

### SEO & Distribution
- Dynamic sitemap (`/sitemap.xml`), robots.txt, RSS feed (`/rss.xml`)
- Open Graph metadata per report for social sharing

### Report Generation Pipeline (fully automated)
All five pipeline steps wired end-to-end and automated via GitHub Actions (see §3).

### Pro-Pack Artifacts
- **Single Issue** — Decision memo markdown: posture, thesis bullets (4 items), risk checklist (exactly 5 items), watchlist levels with context, decision scorecard
- **Monthly Bundle** — Month-end synthesis: regime distribution, top 8 movers, recurring thesis map (persisted/emerging/faded), week-to-week continuity ledger
- Buyer watermark support: masked email, purchase date, redacted order reference

### Testing
- **Playwright E2E smoke tests** (`e2e/smoke.spec.ts`, 6 cases): homepage, `/reports` archive, report detail, `/pro` page, nav active states, 404
- **Vitest unit tests** (~14 files): formatters, report parsing, watermark masking, market data ingestion, SEO metadata, fulfillment logic, pricing, content tiers
- **GitHub Actions CI** (`.github/workflows/ci.yml`): runs Playwright on every PR and push to `main`

---

## 3. Architecture & Agents

### 3.1 Frontend Stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript 5.5 |
| Styling | Tailwind CSS 3.4 with custom palette |
| Testing | Vitest (unit) + Playwright (E2E) |
| Deployment | Vercel (static generation) |

**Custom color tokens** (`tailwind.config.ts`): `ink` (#101828), `muted` (#94a3b8), `paper` (#F5F7FA), `brand` (#1e3a5f), `canvas` (#0d1b2e), `surface` (#132238), `accent` (#F7931A).

### 3.2 Report Generation Pipeline

Runs every Monday at 06:00 UTC via `.github/workflows/weekly-report-automation.yml`. Can also be triggered manually from the GitHub Actions UI. Uses only the auto-injected `GITHUB_TOKEN` — no additional secrets required.

```
Step 1  npm run generate:report-input
        scripts/generate-report-input.ts
        → Fetches live market data (CoinGecko + Fear & Greed)
        → Reads prior week's report for continuity context
        → Calls GitHub Models API (gpt-4o-mini) to generate narrative
        → Writes: data/report-inputs/local-report-input.json

Step 2  npm run generate:local-report
        scripts/generate-local-report.ts
        → Parses and validates input JSON
        → Builds ReportArtifact schema v1.0
        → Derives publishedAt from UTC Monday (or REPORT_PUBLISHED_AT env override)
        → Normalises generatedAt to T06:00:00.000Z for idempotency
        → Writes: data/reports/{YYYY-MM-DD}-{headline-slug}.json

Step 3  npm run validate:reports
        scripts/validate-reports.ts
        → Validates ALL files in data/reports/ against schema v1.0
        → Fails fast on: wrong regime enum, non-numeric snapshot fields,
          riskChecklist not exactly 5 items

Step 4  npm run generate:premium
        scripts/sync-premium-artifacts.ts
        → Always generates Single Issue for the latest report
        → Generates Monthly Bundle only when the latest month has exactly 4 reports
        → Calls scripts/generate-pro-pack.ts for each artifact

Step 5  GitHub Actions commits
        → Adds data/reports/* + data/pro-packs/*
        → Commit message: "chore: update weekly and premium report artifacts"
        → Skips commit if no diff
```

### 3.3 Market Researcher Data Sources

All sourced from `scripts/generate-report-input.ts`.

| Source | Endpoint | Data Retrieved |
|--------|----------|----------------|
| CoinGecko Global | `https://api.coingecko.com/api/v3/global` | Total market cap (USD), BTC dominance %, ETH dominance % |
| CoinGecko Markets | `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=bitcoin,ethereum,solana&order=market_cap_desc&price_change_percentage=7d` | Current price + 7-day % change for BTC, ETH, SOL |
| Fear & Greed Index | `https://api.alternative.me/fng/?limit=1` | Fear/greed score (0–100) and label (Extreme Fear → Extreme Greed) |
| GitHub Models API | `https://models.inference.ai.azure.com` — model: `gpt-4o-mini`, auth: `GITHUB_TOKEN` | Editorial narrative, regime classification, sections, thesis bullets, risk checklist, watchlist levels, "changed since last week" |
| WebSearch (agent tool) | Via Claude Code `WebSearch` permission | Macro catalysts, top movers context, significant news for the week |

**Hard validation rules enforced after LLM generation:**
- `regime` must be one of: `risk-on`, `risk-off`, `range-bound`, `transition`
- `riskChecklist` must contain **exactly 5** items
- All `snapshot` fields (`totalMarketCapUsd`, `btcDominancePct`, `ethDominancePct`, `fearGreedIndex`) must be numeric (not strings)

### 3.4 Report Input JSON Schema

Output of the market researcher at `data/report-inputs/local-report-input.json`:

```typescript
{
  generatedAt: string,          // "YYYY-MM-DDT06:00:00.000Z"
  week: { publishedAt: string, label: string },
  headline: string,             // 8–14 words, sentence case, no trailing period
  summary: string,              // 2–3 sentence executive summary
  tags: string[],
  regime: "risk-on" | "risk-off" | "range-bound" | "transition",
  snapshot: {
    totalMarketCapUsd: number,
    btcDominancePct: number,
    ethDominancePct: number,
    fearGreedIndex: number      // 0–100
  },
  movers: [{ symbol, name, changePct7d, catalyst }],
  sections: [{ id, heading, body, highlights }],
  signals: {
    thesis: string[],           // 3–5 items
    riskChecklist: string[],    // EXACTLY 5 items
    watchlistLevels: [{ asset, level, context }],
    changedSinceLastWeek: string[]
  }
}
```

### 3.5 Four-Agent Async Model

Defined in `docs/operations/agent-operating-model.md`. Agent definitions live in `.claude/agents/`.

| Agent | File | Mission |
|-------|------|---------|
| **Market Researcher** | `market_researcher.md` | Produce `data/report-inputs/local-report-input.json` weekly with evidence-backed market analysis |
| **Pipeline Runner** | `report_pipeline_runner.md` | Orchestrate the full Monday sequence: market researcher → Steps 2–4 → report outcomes |
| **Review Guard** | `review_guard.md` | APPROVE/BLOCK gate — enforces architecture constraints and schema correctness before any merge |
| **UI Engineer** | `ui_engineer.md` | Scoped Next.js/TypeScript/Tailwind changes to reports, nav, and `/pro` page |

**Settings** (`.claude/settings.json`):
- Experimental agent teams enabled: `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`
- Granted permissions: `WebFetch(api.coingecko.com)`, `WebFetch(api.alternative.me)`, `WebSearch`, `Bash`

### 3.6 Hard Architecture Constraints (non-negotiable)

- No database, no auth system, no subscriptions
- No runtime external API calls at page render time
- Stripe is the sole source of truth for buyer identity
- No new env vars beyond the current four: `STRIPE_PAYMENT_LINK_WEEKLY_PRO`, `STRIPE_PAYMENT_LINK_MONTHLY_BUNDLE`, `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_X_HANDLE`
- All Pro artifacts are generated offline via CLI and delivered by email

---

## 4. Known Gaps & R2 Seeds

Sourced from the UI Engineer agent charter (`.claude/agents/ui_engineer.md`). Listed in priority order.

### P1 — Content Gating on Report Detail
**File:** `app/reports/[slug]/page.tsx`  
`ReportSignalsBlock` currently renders the full signals package (thesis, risk checklist, watchlist levels) for all free readers. These blocks (`signalsPackage`, `weeklyExecutionChecklist`) are Pro-only content. They should be replaced with a teaser: brief description + blurred preview + Pro CTA. This is the highest-priority R2 UI task.

### P2 — Nav Inactive Emphasis Fix
**File:** `components/layout/header.tsx`  
The Pro nav link visually appears "selected" on all pages because both the active and inactive emphasized states use borders. The inactive state needs reduced visual weight.

### P3 — Reports Archive Regime Badges
**File:** `app/reports/page.tsx`  
Archive cards lack regime/market context at a glance. Add a color-coded regime badge to each card: `risk-on` (green), `risk-off` (red), `range-bound` (amber), `transition` (neutral). Optionally surface fear/greed index or BTC dominance.

### P4 — Pro Page Spacing
**File:** `app/pro/page.tsx`  
Offer cards are too densely stacked. Increase padding and add breathing room between the metrics grid and feature list sections.

---

## 5. Key File Map

| Category | Path | Purpose |
|----------|------|---------|
| Overview | `README.md` | Project overview, env vars, npm scripts |
| Automation | `.github/workflows/weekly-report-automation.yml` | Monday 06:00 UTC scheduled pipeline |
| CI | `.github/workflows/ci.yml` | Playwright smoke tests on PR/push |
| Market research | `scripts/generate-report-input.ts` | Data fetch + LLM generation (lines 193–315: prompt + validation) |
| Report generation | `scripts/generate-local-report.ts` | Input JSON → ReportArtifact v1.0 |
| Validation | `scripts/validate-reports.ts` | Schema v1.0 enforcement for all reports |
| Pro-pack generation | `scripts/generate-pro-pack.ts` | Single Issue + Monthly Bundle markdown |
| Premium sync | `scripts/sync-premium-artifacts.ts` | Auto-syncs latest pro-packs |
| Report schema | `domain/report.ts` | TypeScript types: Report, Regime, MarketSnapshot, etc. |
| Content tiers | `domain/content-tier.ts` | Three-tier content block definitions |
| Product definitions | `domain/pro-product.ts` | Product metadata (includes/excludes per tier) |
| Pricing | `domain/pro-pricing.ts` | Price config |
| Fulfillment | `domain/pro-fulfillment.ts` | Deliverable definitions per product |
| Watermark | `lib/pro-pack-watermark.ts` | Buyer watermark masking for email delivery |
| Site config | `lib/site.ts` | Payment links from env, site URL |
| Report loading | `lib/reports/report-repository.ts` | File-based report loading (static) |
| Agents | `.claude/agents/` | Four agent definition files |
| Agent model | `docs/operations/agent-operating-model.md` | Three-agent async operating model |
| Fulfillment runbook | `docs/monetization/pro-fulfillment.md` | Manual fulfillment workflow |
| Email templates | `docs/monetization/email-templates.md` | Copy for Pro delivery emails |
| Stripe checklist | `docs/monetization/stripe-live-checklist.md` | Go-live checklist |
| E2E tests | `e2e/smoke.spec.ts` | 6 Playwright smoke test cases |
| Home page | `app/page.tsx` | |
| Reports archive | `app/reports/page.tsx` | |
| Report detail | `app/reports/[slug]/page.tsx` | |
| Pro offers | `app/pro/page.tsx` | |
| Navigation | `components/layout/header.tsx` | |
| Report components | `components/reports/` | 11 report rendering components |
| Pro components | `components/pro/pro-cta.tsx`, `tier-differentiation.tsx` | |
| Data: reports | `data/reports/` | Committed JSON report artifacts |
| Data: pro-packs | `data/pro-packs/` | Generated Pro markdown deliverables |
| Data: inputs | `data/report-inputs/` | Pipeline input files |
