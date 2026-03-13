# RSS and email distribution

This project uses static report artifacts (`data/reports/*.json`) as the single source of truth for distribution surfaces.

## Goals

- Keep distribution static-first and Vercel-friendly.
- Avoid runtime crypto API dependencies.
- Generate RSS and email-friendly HTML from the same report data layer.

## Routes

- `GET /rss.xml`
  - Returns an RSS 2.0 feed containing all reports in reverse chronological order.
  - Includes a report item enclosure that points to each report’s email-friendly HTML permalink.
  - Content type: `application/rss+xml; charset=utf-8`.
- `GET /reports/:slug/email`
  - Returns a plain HTML version of each report suitable for email clients.
  - Includes report metadata, market snapshot, top movers, and report sections.
  - Content type: `text/html; charset=utf-8`.

Both routes render from shared distribution helpers in `lib/reports/distribution.ts`.

## Data flow

1. `lib/reports/report-repository.ts` loads committed report JSON artifacts.
2. `lib/reports/distribution.ts` transforms typed `Report` entities into:
   - RSS XML (`createRssFeed`)
   - Email HTML (`createEmailReportHtml`)
3. Route handlers return static-friendly responses with CDN cache headers.

## Vercel configuration

Set these environment variables in Vercel:

- `NEXT_PUBLIC_SITE_URL` (required for production canonical links)
  - Example: `https://weeklycryptopulse.com`

No secrets are required for RSS/email distribution.

## Validation checklist

Run before merging:

```bash
npm run lint
npm run typecheck
npm run test -- lib/reports/distribution.test.ts
npm run build
```

Then verify:

```bash
curl -sS http://localhost:3000/rss.xml
curl -sS http://localhost:3000/reports/<slug>/email
```
