# Weekly Crypto Pulse

Static-first Next.js scaffold for a weekly crypto editorial web app.

## Environment

- `NEXT_PUBLIC_STRIPE_PAYMENT_LINK`: Stripe Payment Link used by Pro upgrade CTAs.
- `NEXT_PUBLIC_SITE_URL`: Canonical site URL used for metadata and share links (for example `https://weeklycryptopulse.com`).
- `NEXT_PUBLIC_X_HANDLE`: Optional X handle used in Twitter/X metadata (for example `@weeklycryptopulse`).

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
