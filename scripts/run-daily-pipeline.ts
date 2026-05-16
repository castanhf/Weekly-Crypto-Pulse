/**
 * run-daily-pipeline.ts
 *
 * Top-level orchestrator for the daily pipeline. Runs the full sequence:
 *   1. Researcher  → data/daily-inputs/local-daily-input.json
 *   2. Writer      → data/daily-drafts/draft-{date}.json
 *   3. Editor loop → up to 3 rounds (auto-approve on round 3)
 *   4. Promotion   → data/dailies/{slug}.json
 *
 * On total researcher failure: runs the placeholder path.
 *
 * Called by the daily-pipeline.yml GitHub Actions workflow and by
 * `npm run run:daily-pipeline` for local testing.
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

import { access } from 'node:fs/promises';
import path from 'node:path';

import { generateDailyInput, resolveTargetDate } from './generate-daily-input';
import { generateDailyReport } from './generate-daily-report';
import { reviewDailyReport } from './review-daily-report';
import { promoteDailyArtifact } from './promote-daily-artifact';
import { generateDailyPlaceholder } from './generate-daily-placeholder';
import { loadDailyBySlug } from '../lib/reports/daily-repository';
import { composeDailyDigest } from '../lib/email/compose-daily-digest';
import { sendBroadcast } from '../lib/email/beehiiv';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const DAILY_INPUT_DIR = path.resolve(process.cwd(), 'data/daily-inputs');

const isSundayDate = (isoDate: string): boolean => new Date(isoDate).getDay() === 0;

const sendDailyDigestIfConfigured = async (slug: string, targetDate: string): Promise<void> => {
  if (!process.env.BEEHIIV_API_KEY || !process.env.BEEHIIV_PUBLICATION_ID) {
    console.log('[pipeline] Beehiiv not configured — skipping daily digest send.');
    return;
  }

  if (isSundayDate(targetDate)) {
    console.log('[pipeline] Sunday — skipping daily digest (Sunday digest handles this day).');
    return;
  }

  const record = loadDailyBySlug(slug);
  if (!record) {
    console.warn(`[pipeline] Could not find promoted artifact for slug "${slug}" — skipping email.`);
    return;
  }

  const { subject, htmlBody, plaintextBody } = composeDailyDigest(record.daily);
  const { broadcastId } = await sendBroadcast({
    subject,
    htmlBody,
    plaintextBody,
    segment: 'daily_digest_opt_in'
  });

  console.log(`[pipeline] Daily digest sent: ${broadcastId}`);
  console.log(`[pipeline] Subject: ${subject}`);
};

const failureSentinelExists = async (targetDate: string): Promise<boolean> => {
  const sentinelPath = path.join(DAILY_INPUT_DIR, `.failure-${targetDate}.json`);
  try {
    await access(sentinelPath);
    return true;
  } catch {
    return false;
  }
};

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const main = async (): Promise<void> => {
  const targetDate = resolveTargetDate();
  console.log(`\n=== Daily Pipeline — ${targetDate} ===\n`);

  // Step 1: Researcher
  try {
    await generateDailyInput(targetDate);
  } catch (researcherErr) {
    const sentinelPresent = await failureSentinelExists(targetDate);
    if (sentinelPresent) {
      console.error('\n[pipeline] Researcher failed. Activating catastrophic-failure placeholder path…');
      await generateDailyPlaceholder(targetDate);
      console.log('\n=== Daily Pipeline — PLACEHOLDER SHIPPED ===\n');
      return;
    }
    throw researcherErr;
  }

  // Step 2: Writer + Step 3: Editor loop (max 3 rounds)
  const MAX_ROUNDS = 3;
  let editorResult: 'approved' | 'revision-requested' = 'revision-requested';

  for (let round = 1; round <= MAX_ROUNDS; round++) {
    console.log(`\n--- Writer pass (round ${round}) ---`);
    try {
      await generateDailyReport(targetDate);
    } catch (writerErr) {
      console.error(`[pipeline] Writer failed on round ${round}: ${writerErr instanceof Error ? writerErr.message : String(writerErr)}`);
      if (round === MAX_ROUNDS) {
        console.error('[pipeline] Writer exhausted all rounds. Activating placeholder path…');
        await generateDailyPlaceholder(targetDate);
        console.log('\n=== Daily Pipeline — PLACEHOLDER SHIPPED (writer failure) ===\n');
        return;
      }
      continue;
    }

    console.log(`\n--- Editor review (round ${round}) ---`);
    editorResult = await reviewDailyReport(targetDate, round);

    if (editorResult === 'approved') break;

    if (round < MAX_ROUNDS) {
      console.log(`[pipeline] Editor requested revisions (round ${round}). Re-running writer…`);
    }
  }

  // Step 4: Promotion
  console.log('\n--- Promotion ---');
  const outputPath = await promoteDailyArtifact(targetDate);
  const slug = path.basename(outputPath, '.json');

  // Step 5: Daily digest email — non-fatal: email failure must not prevent artifact from being committed.
  console.log('\n--- Daily digest email ---');
  try {
    await sendDailyDigestIfConfigured(slug, targetDate);
  } catch (emailErr) {
    const emailMsg = emailErr instanceof Error ? emailErr.message : String(emailErr);
    // GitHub Actions warning annotation — surfaces as yellow warning in workflow UI without failing the job.
    console.log(`::warning::Daily digest email failed: ${emailMsg}`);
    console.warn(`[pipeline] WARNING: Daily digest email failed: ${emailMsg}`);
    console.warn('[pipeline] The artifact has been published. Email failure does not block artifact commit.');
  }

  console.log(`\n=== Daily Pipeline — COMPLETE ===`);
  console.log(`Artifact: ${path.relative(process.cwd(), outputPath)}\n`);
};

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : 'Unknown error.';
  console.error(`\n[pipeline] FATAL: ${message}`);
  process.exitCode = 1;
});
