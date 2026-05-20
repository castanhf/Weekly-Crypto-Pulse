/**
 * generate-daily-placeholder.ts
 *
 * Writes a static placeholder daily artifact when the pipeline cannot
 * assemble a real one (catastrophic failure path — researcher wrote a
 * .failure-{targetDate}.json sentinel).
 *
 * The placeholder shape matches the expectations in
 * lib/agents/placeholder-daily.test.ts.
 */

import { writeFile } from 'node:fs/promises';
import path from 'node:path';

import { DAILY_SCHEMA_V1_0 } from '../domain/schema-version';
import type { DailyArtifact } from '../domain/daily';
import { validateDailyV1_0 } from '../lib/reports/artifact-validator';
import { assertRecord } from '../lib/reports/json-assertions';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DAILIES_DIR = path.resolve(process.cwd(), 'data/dailies');

// ---------------------------------------------------------------------------
// Placeholder builder
// ---------------------------------------------------------------------------

export const buildPlaceholderArtifact = (targetDate: string): DailyArtifact => ({
  schemaVersion: DAILY_SCHEMA_V1_0,
  generatedAt: new Date().toISOString(),
  publishedAt: targetDate,
  slug: `${targetDate}-markets-quiet`,
  headline: 'Markets are quiet today.',
  summary: "Today's daily report could not be assembled. The full pulse will resume tomorrow.",
  whatMoved: { winners: [], losers: [], topTracked: [] },
  whyItMoved:
    "Today's report could not be generated due to upstream data unavailability. Normal coverage resumes tomorrow.",
  worthKnowing: [],
  snapshot: {
    totalMarketCapUsd: 0,
    btcDominancePct: 0,
    ethDominancePct: 0,
    fearGreedIndex: 0
  },
  tags: ['placeholder', 'pipeline-failure']
});

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export const generateDailyPlaceholder = async (targetDate: string): Promise<string> => {
  console.log(`[daily-placeholder] Generating placeholder artifact for ${targetDate}…`);

  const artifact = buildPlaceholderArtifact(targetDate);

  // Validate — placeholder must validate or it can't ship
  const raw = JSON.parse(JSON.stringify(artifact)) as unknown;
  validateDailyV1_0(assertRecord(raw, `${targetDate}-markets-quiet.json`), `${targetDate}-markets-quiet.json`);

  const outputPath = path.join(DAILIES_DIR, `${artifact.slug}.json`);
  await writeFile(outputPath, `${JSON.stringify(artifact, null, 2)}\n`, 'utf-8');
  console.log(`[daily-placeholder] Placeholder written to ${path.relative(process.cwd(), outputPath)}`);

  return outputPath;
};

// ---------------------------------------------------------------------------
// Standalone entry point
// ---------------------------------------------------------------------------

const main = async (): Promise<void> => {
  const targetDate = process.env['DAILY_TARGET_DATE'] ?? new Date().toISOString().slice(0, 10);
  await generateDailyPlaceholder(targetDate);
};

// Guard prevents this entry-point from firing when imported by the orchestrator.
if (require.main === module) {
  main().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : 'Unknown error.';
    console.error(`[daily-placeholder] Error: ${message}`);
    process.exitCode = 1;
  });
}
