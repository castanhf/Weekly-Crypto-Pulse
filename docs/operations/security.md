# Security posture

## Threat model summary

Crypto Pulse is a static-first Next.js editorial product with no database, no user authentication, and no server-side entitlement system. The primary threat surface is narrow: secret exposure via the repository or CI/CD environment; supply chain attacks via compromised npm packages or GitHub Actions; GitHub Actions abuse via misconfigured permissions or unpinned action references; prompt injection in the LLM research pipeline via malicious content in WebSearch results; and Stripe surface integrity (ensuring payment link IDs are not leaked to unintended surfaces).

There is no SQL injection surface, no XSS via user-generated content, no IDOR, and no session management to protect — those threats require a database or user state that this architecture deliberately avoids.

---

## Secret hygiene

### Secrets inventory

| Secret | Where it lives | Exposed to client? | Notes |
|---|---|---|---|
| `GITHUB_TOKEN` | Auto-injected by GitHub Actions | No | Never set manually in repo secrets; Actions injects it per-job |
| `OPENAI_API_KEY` | GitHub Actions secret (local: `.env`) | No | Optional fallback LLM provider; set a hard usage cap in OpenAI dashboard |
| `STRIPE_PAYMENT_LINK_WEEKLY_PRO` | GitHub Actions / Vercel env | Yes (in href) | Static Stripe URL; intended public surface; not a secret |
| `STRIPE_PAYMENT_LINK_MONTHLY_BUNDLE` | GitHub Actions / Vercel env | Yes (in href) | Static Stripe URL; intended public surface; not a secret |
| `NEXT_PUBLIC_SITE_URL` | Vercel env | Yes (NEXT_PUBLIC_) | Canonical URL — not sensitive |
| `NEXT_PUBLIC_X_HANDLE` | Vercel env | Yes (NEXT_PUBLIC_) | Twitter handle — not sensitive |
| `ENABLE_FULFILLMENT_ASSIST` | Local dev only | No | Enables internal fulfillment page locally; must not be set in production |
| `BEEHIIV_API_KEY` | Planned R2.1 | No | Not yet live |

### NEXT_PUBLIC_ review

`NEXT_PUBLIC_SITE_URL` and `NEXT_PUBLIC_X_HANDLE` are the only variables with this prefix. Both are safe to expose to the client bundle — a canonical URL and a Twitter handle are public information by design.

### .gitignore posture

`.env*` is gitignored with an explicit `!.env.example` negation to allow the template file. Verified correct.

### Rotation cadence

- **Annual rotation:** OPENAI_API_KEY. Rotate on 1 January of each year.
- **On compromise:** Rotate the affected secret immediately. For OPENAI_API_KEY: revoke in OpenAI dashboard, generate new key, update GitHub Actions secret. For GITHUB_TOKEN: auto-rotated by GitHub per-job; no manual action required.
- **On team change:** Rotate all secrets accessible to the departing team member.

### Lockfile policy

`package-lock.json` is committed. PRs that modify `package-lock.json` must be scrutinized for unexpected transitive dependency changes — the lockfile can introduce updates that are not reflected in `package.json`.

---

## Dependency security

### Dependabot

`.github/dependabot.yml` configures weekly Dependabot scans for both npm packages and GitHub Actions. Non-major updates are batched into a single PR per week to reduce noise. Major version bumps arrive as individual PRs for human review.

### npm audit in CI

`npm audit --production --audit-level=high` runs in CI (`.github/workflows/ci.yml`) before the test suite. CI fails on any high-severity or critical production vulnerability. Moderate and low advisories are tracked via Dependabot and do not block CI.

### Audit baseline (established WCP-109, threshold restored WCP-121)

Next.js was upgraded from 14.2.5 to 14.2.35 in WCP-109 to address critical vulnerabilities. The CI threshold was temporarily lowered to `--audit-level=critical` because five high-severity advisories (GHSA-9g9p-9gw9-jx7f, GHSA-h25m-26qc-wcjf, GHSA-ggv3-7p47-pfv8, GHSA-3x4c-7xq6-9pq8, GHSA-q4gf-8mx6-v5v3) required Next.js 15+ to fix.

In WCP-121, Next.js was upgraded to 16.2.5, resolving all five high-severity advisories. Threshold restored to `--audit-level=high`. Post-upgrade: `npm audit --production --audit-level=high` exits 0. One moderate advisory remains (GHSA-qx2v-qp2m-jg93, postcss bundled inside Next.js); no fix available without downgrading Next.js.

---

## Accepted residual advisories

This section documents security advisories that `npm audit` reports but that we have explicitly accepted as residual risk, with reasoning.

### GHSA-qx2v-qp2m-jg93 — postcss CSS stringify XSS (moderate)

This advisory affects a version of `postcss` bundled inside Next.js itself. It cannot be patched independently of Next.js — `npm audit fix` would suggest downgrading Next.js, which the scanner incorrectly recommends. The Next.js team is tracking the underlying issue and will bump their bundled `postcss` in a future release.

**Risk assessment:** Moderate severity. The advisory describes XSS via `</style>` injection in CSS strings. Crypto Pulse pages do not render user-controlled CSS — all CSS is authored by the project (Tailwind utility classes, no user-submitted styles). The advisory is therefore not exploitable in our application as deployed. We accept the residual risk pending Next.js's upstream fix.

**Tracking:** Re-evaluate on each Next.js minor version bump. Restore `npm audit fix` action if Next.js publishes a release that no longer triggers the advisory.

**Accepted by:** Filipe Castanheira, 2026-05-07.

---

## GitHub Actions

### SHA pinning

All third-party Actions references in `.github/workflows/*.yml` are pinned to full 40-character commit SHAs with the human-readable version as a comment. Tag references can be moved by the action author; SHA references are immutable.

| Action | Version | SHA |
|---|---|---|
| `actions/checkout` | v4.2.2 | `11bd71901bbe5b1630ceea73d27597364c9af683` |
| `actions/setup-node` | v4.4.0 | `49933ea5288caeca8642d1e84afbd3f7d6820020` |
| `github/codeql-action/init` | v4.33.0 | `f0213c31c702f929cf06ddb900ac315d246a8997` |
| `github/codeql-action/analyze` | v4.33.0 | `f0213c31c702f929cf06ddb900ac315d246a8997` |

Dependabot (github-actions ecosystem) keeps SHAs updated automatically.

### Permission scoping

| Workflow | Permissions |
|---|---|
| `ci.yml` | `contents: read` |
| `weekly-report-automation.yml` | `contents: write`, `models: read` |
| `codeql.yml` | `contents: read`, `security-events: write` |

### Workflow trigger safety

No workflow uses `pull_request_target` (which runs untrusted code with repo secrets in scope). The `ci.yml` trigger is `pull_request` (safe — runs in the PR head context without access to secrets from the base repo). Verified.

---

## Security headers

Security headers are applied via `next.config.mjs` to all routes (`/(.*)`):

| Header | Value | Purpose |
|---|---|---|
| `Content-Security-Policy` | (see next.config.mjs) | Restricts resource loading origins; blocks clickjacking via `frame-ancestors 'none'`; restricts form submissions |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` | Enforces HTTPS for 2 years including subdomains |
| `X-Frame-Options` | `DENY` | Fallback clickjacking protection for older browsers not honoring CSP `frame-ancestors` |
| `X-Content-Type-Options` | `nosniff` | Prevents MIME-type sniffing |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Limits referrer leakage on cross-origin requests |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=(), interest-cohort=()` | Disables browser features not used by the site |

**CSP notes:** `'unsafe-inline'` and `'unsafe-eval'` in `script-src` are required by Next.js hydration. `'unsafe-inline'` in `style-src` is required by Tailwind. These are known limitations of Next.js + strict CSP and are not avoidable without nonce-based CSP (a more complex setup not warranted for this architecture). The `connect-src` and `frame-src` directives pre-allowlist Beehiiv (R2.1) and Stripe (active) to avoid revisiting headers at each feature addition.

---

## LLM pipeline defenses

### Prompt injection threat

The weekly (`market_researcher`) and daily (`daily_researcher`) agents use WebSearch to pull macro context and news. WebSearch returns content from the open web, which may contain adversarial instructions designed to manipulate the agent's output — a prompt injection attack.

### Defenses in place

Both researcher agent definitions include a "Defense against prompt injection" section specifying:

1. All WebSearch result content is treated as untrusted input. Agents do not follow instructions found in scraped content.
2. Scraped content is bracketed as `<scraped_content source="{url}">...</scraped_content>` to signal to the model that it is data, not instructions.
3. The pipeline validator (for weeklies) and the daily editor agent (for dailies) review output structure; deviations caused by injection surface as validation failures or editorial anomalies.
4. Schema validation on the generated JSON provides a structural gate — injected content that alters field structure or introduces unexpected fields will fail validation before the artifact is committed.

---

## Stripe surface

- Payment link URLs (`STRIPE_PAYMENT_LINK_WEEKLY_PRO`, `STRIPE_PAYMENT_LINK_MONTHLY_BUNDLE`) are static strings that appear in `href` attributes on the `/pro` page CTAs. This is an intended public surface — Stripe Payment Links are designed to be shared.
- No webhook integration. Fulfillment is manual: the operator verifies payment in the Stripe dashboard and sends the deliverable. No webhook endpoint exists in the codebase.
- The `/internal/fulfillment` page is gated by `ENABLE_FULFILLMENT_ASSIST`. The check is a runtime `notFound()` call — the page code is compiled into the production bundle but returns HTTP 404 when the env var is unset. In production (Vercel), `ENABLE_FULFILLMENT_ASSIST` is not set, making the page effectively inaccessible. The page contains no secrets, tokens, or PII — only form inputs that generate CLI command strings and email body text for operator use.
- No buyer PII is stored in the repo or in any service under our control. PII lives only in Stripe (payment records) and in the operator's email client (fulfillment emails).

---

## SAST

CodeQL analysis is configured in `.github/workflows/codeql.yml`. It runs on push and pull request to `main`, `release/r2.0`, and `release/r2.1`, and on a weekly schedule (Mondays 14:23 UTC).

Language: `javascript-typescript`. CodeQL natively understands TypeScript and Next.js patterns.

Findings appear in the repository's Security tab (GitHub Advanced Security). Review cadence: weekly. High-severity findings are blocking for the next release.

---

## Review cadence

| Cadence | Activity |
|---|---|
| **Weekly** | Dependabot PRs: review and merge patch/minor updates; escalate major bumps |
| **Weekly** | CodeQL findings: review Security tab; high-severity findings block next release |
| **Annually** | Full secret rotation (OPENAI_API_KEY on 1 January) |
| **On trigger** | Any new third-party integration, auth surface, or database added → re-assess threat model |
| **On compromise** | Rotate affected secrets immediately; audit access logs |
