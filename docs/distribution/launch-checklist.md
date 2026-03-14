# Launch & Distribution Checklist

This checklist covers the weekly report launch workflow in a static-first setup on Vercel.

## Scope and principles

- Publish only from committed report artifacts in `data/reports/*.json`.
- Do not fetch crypto APIs at request time.
- Keep distribution copy consistent with published findings.
- Prioritize one clean weekly distribution cycle over frequent low-signal posts.

## Pre-launch checks

- [ ] Confirm the new report JSON exists in `data/reports/` with the expected date and slug.
- [ ] Validate artifacts locally with `npm run validate:reports`.
- [ ] Start the app (`npm run dev`) and verify:
  - [ ] Home page (`/`)
  - [ ] Reports archive (`/reports`)
  - [ ] New report page (`/reports/[slug]`)
  - [ ] Methodology (`/methodology`)
  - [ ] Disclaimer (`/disclaimer`)
  - [ ] Pro page (`/pro`)
- [ ] Confirm the report title, summary, and share copy match the report JSON.
- [ ] Remove placeholder/debug text.

## Vercel readiness

- [ ] Production deployment is green.
- [ ] `NEXT_PUBLIC_SITE_URL` is set to the canonical production domain in Vercel.
- [ ] `sitemap.xml`, `robots.txt`, and `rss.xml` load correctly after deploy.
- [ ] Preview and Production smoke checks pass for the new report URL.
- [ ] Analytics events fire as expected (if enabled).

## Weekly distribution sequence

1. Publish and verify the production report URL.
2. Post weekly updates on X and LinkedIn using `docs/distribution/copy-templates.md`.
3. Send the newsletter using the intro/outro templates in `docs/distribution/copy-templates.md`.
4. Monitor the first 24 hours:
   - page views for the report
   - click-through to `/pro`
   - link and formatting issues
5. Capture improvements in `docs/operations/` for the next cycle.

## Post-launch QA

- [ ] Open all shared links from social and email to confirm they resolve correctly.
- [ ] Check social preview title/description/image rendering.
- [ ] Ensure all links point to production (no Preview domains).
- [ ] Log any fixes or copy adjustments in operations notes.
