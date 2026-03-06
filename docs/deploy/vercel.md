# Vercel deployment guide

This project is static-first and Vercel-friendly by default. Use this runbook to configure **Preview** and **Production** deployments with minimal operational overhead.

For day-2 operational troubleshooting, see `docs/operations/vercel-notes.md`.

## 1) Connect GitHub repository to Vercel

1. Log in to [Vercel](https://vercel.com) and click **Add New... > Project**.
2. Import `castanhf/Weekly-Crypto-Pulse` from GitHub.
3. Confirm these build settings:
   - **Framework Preset**: Next.js
   - **Build Command**: `npm run build`
   - **Install Command**: `npm ci`
   - **Output Directory**: `.next` (default)
4. Create the project.

## 2) Configure Preview deployments (PRs and branches)

Vercel automatically creates Preview deployments for pull requests and non-production branches.

Recommended project settings:

1. In **Project Settings > Git**, ensure the production branch is `main`.
2. Keep **Automatically expose System Environment Variables** enabled (default).
3. Open a test PR and confirm:
   - A Preview deployment is created.
   - The PR receives the Vercel deployment status check.

## 3) Configure Production deployment from `main`

Production deploys should be tied to the `main` branch:

1. In **Project Settings > Git**, set **Production Branch** to `main`.
2. Merge into `main` and verify a Production deployment starts.
3. Confirm the deployment URL and (if configured) your custom domain routing.

## 4) Node version alignment (Vercel + local)

This repository uses `.nvmrc` to pin local Node runtime expectations:

- `.nvmrc`: `20.14.0`

Set Vercel to the same major/minor runtime:

1. Open **Project Settings > General > Node.js Version**.
2. Select Node.js `20.x` (or the closest available `20.14.x`).
3. Locally, run:

```bash
nvm use
```

If Node `20.14.0` is not installed locally:

```bash
nvm install 20.14.0
nvm use 20.14.0
```

## 5) Environment variables

Set variables in **Project Settings > Environment Variables**.

### Public variables (`NEXT_PUBLIC_*`)

These are exposed to browser bundles and should only contain safe, non-secret values.

- `NEXT_PUBLIC_SITE_URL` (required in Production): canonical site URL (example: `https://weeklycryptopulse.com`)
- `NEXT_PUBLIC_STRIPE_PAYMENT_LINK` (optional): Stripe Payment Link used by the Pro CTA

### Server-only variables (no `NEXT_PUBLIC_` prefix)

No server-only variables are currently required by this project.

If server-only variables are introduced later, define them in Vercel for the required environments and never expose secrets via `NEXT_PUBLIC_*`.

## 6) Pre-deploy verification command

Before merging/deploying, run the unified verification command:

```bash
npm run verify
```

This runs:

1. `npm run lint`
2. `npm run typecheck`
3. `npm run build`

## 7) Validate deployment health

After each Preview/Production deployment, validate these routes:

- `/` (home with latest report highlights)
- `/reports` (archive)
- `/reports/<valid-slug>` (a real report page)
- `/methodology`
- `/disclaimer`
- `/pro`
- `/sitemap.xml`
- `/robots.txt`

Quick smoke test example:

```bash
curl -I https://<deployment-url>/
curl -I https://<deployment-url>/reports
curl -I https://<deployment-url>/methodology
```

Expect `200 OK` for valid routes.
