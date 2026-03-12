# Vercel operations notes

Quick guardrails for day-to-day Vercel operations on Weekly Crypto Pulse.

## Preview vs Production

- **Preview**: every pull request and non-`main` branch deploys automatically.
- **Production**: deploys from merges to `main` only.
- Keep **Project Settings → Git → Production Branch = `main`**.
- Treat Preview as the release gate for routing, metadata, and Pro CTA checks before merge.

## Where environment variables are configured

Set variables in **Vercel → Project Settings → Environment Variables** and scope each value correctly:

- **Production**: live values.
- **Preview**: staging/safe values for PR validation.
- **Development**: optional Vercel-hosted dev values.

Current variables used by this app:

- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_STRIPE_PAYMENT_LINK_SINGLE_ISSUE`
- `NEXT_PUBLIC_STRIPE_PAYMENT_LINK_MONTHLY_BUNDLE`

`NEXT_PUBLIC_*` values are public in the browser bundle. Never store secrets in them.

## Diagnosing build failures

1. Open the failed deployment and identify the first failing step (`Install`, `Build`, or post-build checks).
2. Reproduce locally from a clean state:

```bash
rm -rf node_modules .next
npm ci
npm run verify
```

3. Confirm Vercel Node version matches repo expectations (`20.x`, aligned with `.nvmrc`).
4. Re-check required environment variables in the exact failing scope (Preview or Production).
5. If failures are branch-specific, compare:
   - `package-lock.json`
   - `next.config.mjs`
   - `tsconfig*.json`
   - latest committed artifacts in `data/reports/`
