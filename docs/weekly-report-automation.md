# Weekly report automation

This repository includes a GitHub Actions workflow at `.github/workflows/weekly-report-automation.yml` that automates weekly report artifact updates.

## Trigger modes

- **Scheduled run**: every Monday at **06:00 UTC**.
- **Manual run**: via **Run workflow** in GitHub Actions.

## Workflow steps

1. Check out the repository.
2. Set up Node.js 20 with npm cache.
3. Install dependencies with `npm ci`.
4. Generate the report artifact with `npm run generate:local-report`.
5. Validate all report artifacts with `npm run validate:reports`.
6. Commit and push `data/reports` changes when files were updated.

If generation does not produce any diff, the workflow exits without creating a commit.

## Publication date source of truth

- The generator derives the report `publishedAt` date from the current **UTC week Monday** by default.
- `generatedAt` is normalized to `YYYY-MM-DDT06:00:00.000Z` for that same Monday to keep reruns stable.
- For backfills or manual overrides, set `REPORT_PUBLISHED_AT=YYYY-MM-DD` when running `npm run generate:local-report`.
- `data/report-inputs/local-report-input.json` is treated as a **content template** for headline/body/signals, not as the publication calendar source.

## Secret handling

The workflow only relies on `secrets.GITHUB_TOKEN` for repository push access. No additional secrets are required.
