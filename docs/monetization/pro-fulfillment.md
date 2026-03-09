# Pro fulfillment runbook (no database)

This runbook defines a repeatable, deterministic Pro delivery flow using only committed report artifacts.

## Scope and constraints

- No database, no auth, no webhooks.
- Pro content is generated from `data/reports/*.json` only.
- Fulfillment output is a static markdown artifact at `data/pro-packs/<report-slug>.md`.
- Script output is deterministic for the same report input.

## Generate Pro pack artifact

1. Pull latest `main` and install dependencies.
2. Confirm the target report exists in `data/reports` and note its slug.
3. Run:

```bash
npm run generate:pro-pack -- <report-slug>
```

4. Verify output file:

```bash
data/pro-packs/<report-slug>.md
```

5. Review markdown for formatting regressions (headings, bullets, watchlist levels).
6. Commit the generated Pro pack when ready to deliver.

## Manual delivery steps

1. Open the generated markdown artifact.
2. Optional: convert markdown to PDF in your preferred editor/export tool.
3. Deliver to the buyer through your manual channel (email, support ticket, or private message).
4. Record delivery metadata in your internal ops notes (outside this repository if needed):
   - report slug
   - delivery date
   - delivery channel
   - recipient confirmation status
5. If delivery fails, retry with the same generated artifact (do not regenerate unless report input changed).

## Edge cases checklist

- [ ] Slug typo: script fails with `Report not found for slug`.
- [ ] Missing slug argument: script fails with usage guidance.
- [ ] Duplicate report slugs in repository: resolve source data conflict before fulfillment.
- [ ] Empty sections/movers/thesis/risk data: output remains valid markdown and explicitly renders `None`.
- [ ] Report artifact changed after purchase: decide policy (deliver latest vs original) before running the script.
- [ ] Markdown-to-PDF formatting drift: verify heading and bullet order after conversion.
