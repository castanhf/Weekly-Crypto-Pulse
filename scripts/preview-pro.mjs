#!/usr/bin/env node
/**
 * preview:pro
 *
 * Generates the Pro single-issue pack for the most recent weekly report,
 * without a buyer watermark. Useful for reviewing Pro content locally
 * before fulfillment or while developing the pack template.
 *
 * Output: data/pro-packs/<slug>.md
 *
 * Reuses the existing generate:pro pipeline — no parallel path.
 */

import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { execSync } from 'node:child_process';

const reportsDir = join(process.cwd(), 'data', 'reports');

const latestJson = readdirSync(reportsDir)
  .filter((f) => f.endsWith('.json'))
  .sort()
  .at(-1); // ISO-date slugs sort lexicographically — most recent last

if (!latestJson) {
  console.error('[preview:pro] No report JSON files found in data/reports/');
  process.exit(1);
}

const slug = latestJson.replace(/\.json$/, '');
console.log(`[preview:pro] Latest report: ${slug}`);
console.log('[preview:pro] Generating single-issue Pro pack (no watermark)…\n');

execSync(`npm run generate:pro -- --product singleIssue --slug "${slug}"`, { stdio: 'inherit' });

console.log(`\n[preview:pro] Done. Open data/pro-packs/${slug}.md to review.`);
