# Vercel operations notes

This note complements `docs/deploy/vercel.md` with quick, deployment-focused triage steps.

## Preview vs Production

- **Preview** deploys are created automatically for pull requests and non-`main` branches.
- **Production** deploys are created from merges to `main`.
- Use Preview to validate content, routing, and environment configuration before merge.
- Keep Production branch set to `main` in **Vercel > Project Settings > Git**.

## Environment variables in Vercel

Configure variables in **Vercel > Project Settings > Environment Variables** and scope them per environment:

- **Production**: canonical values for the live site.
- **Preview**: safe/staging values used in PR validation.
- **Development**: optional values for Vercel-hosted development workflows.

Current variables used by this project:

- `NEXT_PUBLIC_SITE_URL` (required for canonical metadata in Production)
- `NEXT_PUBLIC_STRIPE_PAYMENT_LINK` (optional Pro CTA link)

Because these variables are prefixed with `NEXT_PUBLIC_`, they are exposed to the browser bundle. Do not store secrets in them.

## Diagnosing build failures

1. Open the failed deployment in Vercel and read the first failing step (`Install`, `Build`, or runtime checks).
2. Reproduce locally with the same commands:

```bash
npm ci
npm run verify
```

3. Verify Node compatibility with the repo runtime (`.nvmrc` / Vercel Node setting).
4. If failure is environment-related, confirm each required variable exists in the same environment scope (Preview or Production) that failed.
5. If failures occur only on one branch, compare `package-lock.json`, report artifacts in `data/reports`, and config changes (`next.config.mjs`, `tsconfig*.json`).
