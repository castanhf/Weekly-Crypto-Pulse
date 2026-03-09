# Launch & Distribution Checklist

This checklist is for shipping each weekly report with a static-first workflow on Vercel.

## Scope and principles

- Publish from committed report artifacts (`data/reports/*.json`).
- Do not fetch crypto APIs at page-request time.
- Keep messaging factual and consistent with report content.
- Prefer one high-quality weekly distribution cycle over daily promotional noise.

## Pre-launch checks (before publishing)

- [ ] Confirm the new report JSON exists in `data/reports/` with the correct date and slug.
- [ ] Run report validation locally (`npm run validate:reports`).
- [ ] Verify generated pages render locally (`npm run dev`) and open:
  - [ ] Home page (`/`)
  - [ ] Reports archive (`/reports`)
  - [ ] New report page (`/reports/[slug]`)
  - [ ] Methodology (`/methodology`)
  - [ ] Disclaimer (`/disclaimer`)
  - [ ] Pro page (`/pro`)
- [ ] Check title/description/share copy for the new report.
- [ ] Confirm no temporary debug text or placeholders remain.

## Vercel readiness

- [ ] Ensure production deployment is green in Vercel.
- [ ] Confirm `NEXT_PUBLIC_SITE_URL` points to the canonical production domain.
- [ ] Validate generated `sitemap.xml`, `robots.txt`, and `rss.xml` endpoints after deploy.
- [ ] Smoke test report pages in both Preview and Production environments.
- [ ] Confirm analytics event tracking is firing (if enabled).

## Distribution workflow (weekly)

1. Publish the report and verify the production URL is live.
2. Send the weekly social posts:
   - X weekly post
   - LinkedIn weekly post
3. Send newsletter with the intro/outro templates in this doc.
4. Monitor for 24 hours:
   - page views per report
   - click-through to `/pro`
   - delivery issues (broken links, formatting)
5. Capture observations in operations notes for next cycle.

## Copy templates

> Tone guide: specific, calm, and evidence-led. Avoid hype words like “moon,” “guaranteed,” or “massive gains.”

### X (weekly post template)

```
Weekly Crypto Pulse — [Week of YYYY-MM-DD]

This week: [1-line market context from report].

Key points:
• [Insight 1]
• [Insight 2]
• [Insight 3]

Read the full report: [Report URL]
Methodology: [Methodology URL]

#Bitcoin #Ethereum #Crypto
```

### LinkedIn (weekly post template)

```
Weekly Crypto Pulse — [Week of YYYY-MM-DD]

We published this week’s report with a focus on signal over noise.

Highlights:
- [Insight 1 with context]
- [Insight 2 with context]
- [Insight 3 with context]

If you want the full framework, data notes, and limitations, read the report here:
[Report URL]

Methodology and disclaimer:
- [Methodology URL]
- [Disclaimer URL]
```

### Newsletter intro template

```
Subject: Weekly Crypto Pulse — [Week of YYYY-MM-DD]

Hi [First Name],

Here is this week’s Weekly Crypto Pulse.

In short: [2-3 sentence summary of what changed this week, grounded in report findings].

In this issue:
- [Section/insight 1]
- [Section/insight 2]
- [Section/insight 3]

Read the full report: [Report URL]
```

### Newsletter outro template

```
If this report was useful, you can share it with someone who follows crypto markets seriously.

For deeper weekly analysis, see Weekly Crypto Pulse Pro:
[Pro URL]

Methodology: [Methodology URL]
Disclaimer: [Disclaimer URL]

Thanks for reading,
Weekly Crypto Pulse
```

## Post-launch QA

- [ ] Open shared links from X, LinkedIn, and email to verify they resolve correctly.
- [ ] Check social preview image/title/description rendering.
- [ ] Confirm all links use the production domain (no Preview links).
- [ ] Log any copy or distribution corrections in `docs/operations/`.
