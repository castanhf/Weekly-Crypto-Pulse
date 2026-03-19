# Weekly Crypto Pulse

Static-first Next.js scaffold for a weekly crypto editorial web app.

## Environment

- `STRIPE_PAYMENT_LINK_WEEKLY_PRO`: Stripe Payment Link for **Weekly Crypto Pulse Pro — Single Issue** CTA.
- `STRIPE_PAYMENT_LINK_MONTHLY_BUNDLE`: Stripe Payment Link for **Weekly Crypto Pulse Pro — Monthly Bundle** CTA.
- `NEXT_PUBLIC_SITE_URL`: Canonical site URL used for metadata and share links (for example `https://weeklycryptopulse.com`).
- `NEXT_PUBLIC_X_HANDLE`: Optional X handle used in Twitter/X metadata (for example `@weeklycryptopulse`).

Set these environment variables in Vercel for both Preview and Production deployments.

## Editorial tiers

- **Free = orientation:** public pages and report context help readers understand what changed this week.
- **Weekly Pro = decision:** one paid issue turns that week's setup into a decision memo with posture, invalidation, and watchlist levels.
- **Monthly Bundle = continuity:** a one-time bundle extends Weekly Pro across the month with cross-issue follow-through and a month-end summary.

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
- `pnpm generate:pro -- --slug <report-slug> --buyerEmail <email> --orderRef <ref>`
