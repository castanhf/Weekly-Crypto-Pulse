# Weekly Crypto Pulse

Static-first Next.js scaffold for a weekly crypto editorial web app.

## Environment

### Site and payment (Vercel)

- `STRIPE_PAYMENT_LINK_WEEKLY_PRO`: Stripe Payment Link for **Weekly Crypto Pulse Pro — Single Issue** CTA.
- `STRIPE_PAYMENT_LINK_MONTHLY_BUNDLE`: Stripe Payment Link for **Weekly Crypto Pulse Pro — Monthly Bundle** CTA.
- `NEXT_PUBLIC_SITE_URL`: Canonical site URL used for metadata and share links (for example `https://weeklycryptopulse.com`).
- `NEXT_PUBLIC_X_HANDLE`: Optional X handle used in Twitter/X metadata (for example `@weeklycryptopulse`).
- `ENABLE_FULFILLMENT_ASSIST`: Server-only flag that enables the internal `/internal/fulfillment` helper. Leave unset in Production; set to `true` only in local development when the helper is needed.

Set these environment variables in Vercel for both Preview and Production deployments, except `ENABLE_FULFILLMENT_ASSIST`, which should stay disabled unless you explicitly need the helper in a non-production environment.

### Pipeline (GitHub Actions / local)

- `GITHUB_TOKEN`: Auto-injected in every GitHub Actions workflow. Required as the primary LLM provider (GitHub Models). For local runs, use a personal access token with read access to your account.
- `OPENAI_API_KEY`: OpenAI API key for LLM fallback when GitHub Models is unavailable. Optional but strongly recommended. **Set a hard usage cap in the OpenAI dashboard** to prevent runaway costs.

## Editorial tiers

- **Free = orientation:** public pages and report context help readers understand what changed this week.
- **Weekly Pro = decision:** one paid issue turns that week's setup into a decision memo with posture, invalidation, and watchlist levels.
- **Monthly Bundle = continuity:** a one-time bundle extends Weekly Pro across the month with cross-issue follow-through and a month-end summary.

## Agent operations

- See `docs/operations/agent-operating-model.md` for the three-agent async operating model, startup checklist, and templates.

## Report data

Reports are loaded from local JSON files in `data/reports`.

- Drop generated artifacts into `data/reports/*.json`.
- Use schema version `1.0` for new generated files.
- See `data/reports/README.md` for the expected artifact format.

## Scripts

- `npm run dev`
- `npm run build`
- `npm run start`
- `npm run lint`
- `npm run test`
- `npm run generate:pro -- --product singleIssue --slug <report-slug> [--buyerEmail <email>] [--orderRef <ref>] [--purchasedAt <ISO-8601>]`
- `npm run generate:pro -- --product monthlyBundle --month <YYYY-MM> [--slugs <slug1,slug2,slug3,slug4>] [--buyerEmail <email>] [--orderRef <ref>] [--purchasedAt <ISO-8601>]`
- `npm run generate:premium` (syncs premium artifacts from current report data: latest Weekly Pro single issue, and Monthly Bundle when the latest month reaches four reports)
