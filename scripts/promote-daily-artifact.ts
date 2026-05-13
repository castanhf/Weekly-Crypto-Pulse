/**
 * promote-daily-artifact.ts
 *
 * Reads the approved draft from data/daily-drafts/, re-validates it, writes
 * the final artifact to data/dailies/, and cleans up draft files.
 *
 * Called as step 4 (final step) in the daily pipeline, after the editor has
 * approved the draft.
 */

import { readFile, rm, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';

import type { DailyArtifact } from '../domain/daily';
import { validateDailyV1_0 } from '../lib/reports/artifact-validator';
import { assertRecord } from '../lib/reports/json-assertions';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DRAFTS_DIR = path.resolve(process.cwd(), 'data/daily-drafts');
const DAILIES_DIR = path.resolve(process.cwd(), 'data/dailies');

// ---------------------------------------------------------------------------
// Cleanup helpers
// ---------------------------------------------------------------------------

const tryUnlink = async (filePath: string): Promise<void> => {
  try {
    await unlink(filePath);
  } catch {
    // File may not exist — that's fine
  }
};

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export const promoteDailyArtifact = async (targetDate: string): Promise<string> => {
  console.log(`[daily-promote] Promoting artifact for ${targetDate}…`);

  // 1. Verify approval marker exists
  const approvalPath = path.join(DRAFTS_DIR, `.approved-${targetDate}`);
  let approvalContent: string;
  try {
    approvalContent = await readFile(approvalPath, 'utf-8');
  } catch {
    throw new Error(`No approval marker found for ${targetDate}. Editor must approve before promotion.`);
  }

  const approval = JSON.parse(approvalContent) as { autoApproved?: boolean; allChecksPassed: boolean };
  if (approval.autoApproved) {
    console.log('  Note: this draft was auto-approved after 2 revision rounds. Operator review recommended.');
  }

  // 2. Read draft
  const draftPath = path.join(DRAFTS_DIR, `draft-${targetDate}.json`);
  const rawDraft = await readFile(draftPath, 'utf-8');
  const draft = JSON.parse(rawDraft) as DailyArtifact;

  // 3. Re-validate
  const artifact = assertRecord(JSON.parse(rawDraft) as unknown, `draft-${targetDate}.json`);
  validateDailyV1_0(artifact, `draft-${targetDate}.json`);
  console.log('  Re-validation: passed');

  // 4. Determine output path using the artifact's slug
  if (!draft.slug || typeof draft.slug !== 'string') {
    throw new Error(`Draft for ${targetDate} has missing or invalid slug`);
  }
  const outputPath = path.join(DAILIES_DIR, `${draft.slug}.json`);

  // 5. Write final artifact
  await writeFile(outputPath, `${JSON.stringify(draft, null, 2)}\n`, 'utf-8');
  console.log(`[daily-promote] Artifact written to ${path.relative(process.cwd(), outputPath)}`);

  // 6. Clean up draft files
  await tryUnlink(draftPath);
  await tryUnlink(approvalPath);
  await tryUnlink(path.join(DRAFTS_DIR, `.revisions-${targetDate}.json`));
  await tryUnlink(path.join(DRAFTS_DIR, `draft-${targetDate}.errors.json`));
  // Keep auto-approval log and editor-error sentinel for operator review
  console.log('  Draft files cleaned up');

  return outputPath;
};

// ---------------------------------------------------------------------------
// Standalone entry point
// ---------------------------------------------------------------------------

const main = async (): Promise<void> => {
  const targetDate = process.env['DAILY_TARGET_DATE'] ?? new Date().toISOString().slice(0, 10);
  await promoteDailyArtifact(targetDate);
};

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : 'Unknown error.';
  console.error(`[daily-promote] Failed: ${message}`);
  process.exitCode = 1;
});
