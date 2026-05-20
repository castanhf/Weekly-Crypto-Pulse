/**
 * run-daily-pipeline.ts
 *
 * Top-level orchestrator for the daily pipeline. Runs the full sequence:
 *   1. Researcher  → data/daily-inputs/local-daily-input.json
 *   2. Writer      → data/daily-drafts/draft-{date}.json
 *   3. Editor loop → up to 3 rounds (auto-approve on round 3)
 *   4. Promotion   → data/dailies/{slug}.json
 *   5. Email       → daily digest via EmailSender (non-fatal)
 *
 * On researcher catastrophic failure: runs the placeholder path.
 * On write/promote catastrophic failure: runs the placeholder path.
 * Email failures are non-fatal and do not block artifact commit.
 *
 * Called by the daily-pipeline.yml GitHub Actions workflow and by
 * `npm run run:daily-pipeline` for local testing.
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

import { access, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { generateDailyInput, resolveTargetDate } from './generate-daily-input';
import { generateDailyReport } from './generate-daily-report';
import { reviewDailyReport } from './review-daily-report';
import { promoteDailyArtifact } from './promote-daily-artifact';
import { generateDailyPlaceholder } from './generate-daily-placeholder';
import { createEmailSender } from '../lib/email/email-sender-factory';
import { isStuckLoop } from '../lib/agents/stuck-loop';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const DAILY_INPUT_DIR = path.resolve(process.cwd(), 'data/daily-inputs');

const failureSentinelExists = async (targetDate: string): Promise<boolean> => {
  const sentinelPath = path.join(DAILY_INPUT_DIR, `.failure-${targetDate}.json`);
  try {
    await access(sentinelPath);
    return true;
  } catch {
    return false;
  }
};

const DRAFTS_DIR = path.resolve(process.cwd(), 'data/daily-drafts');

// Overwrites only the headline field in the draft JSON, leaving all other fields intact.
// Used when the best-scoring round's headline differs from the final round's headline.
const patchDraftHeadline = async (targetDate: string, headline: string): Promise<void> => {
  const draftPath = path.join(DRAFTS_DIR, `draft-${targetDate}.json`);
  const raw = await readFile(draftPath, 'utf-8');
  const draft = JSON.parse(raw) as Record<string, unknown>;
  draft['headline'] = headline;
  await writeFile(draftPath, `${JSON.stringify(draft, null, 2)}\n`, 'utf-8');
};

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const main = async (): Promise<void> => {
  const targetDate = resolveTargetDate();
  console.log(`\n=== Daily Pipeline — ${targetDate} ===\n`);

  // Step 1: Researcher
  // A failure sentinel written by the researcher signals total data unavailability (catastrophic).
  // Any other researcher error is unexpected and surfaces as FATAL.
  try {
    await generateDailyInput(targetDate);
  } catch (researcherErr) {
    if (await failureSentinelExists(targetDate)) {
      console.error('\n[pipeline] Researcher failed. Activating catastrophic-failure placeholder path…');
      await generateDailyPlaceholder(targetDate);
      console.log('\n=== Daily Pipeline — PLACEHOLDER SHIPPED ===\n');
      return;
    }
    throw researcherErr;
  }

  // Steps 2–4: Writer, Editor loop, Promotion
  // Any unrecovered failure in this phase activates the placeholder path so today's date
  // always has a published artifact in data/dailies/.
  let outputPath: string;
  try {
    const MAX_ROUNDS = 5;

    let prevHeadline: string | null = null;
    let prevFailedCheckIds: ReadonlyArray<string> | null = null;

    type BestRound = { headline: string; passCount: number; round: number };
    let bestRound: BestRound | null = null;
    let cleanApproval = false;
    let finalRound = 1;

    for (let round = 1; round <= MAX_ROUNDS; round++) {
      finalRound = round;
      console.log(`\n--- Writer pass (round ${round}) ---`);
      try {
        await generateDailyReport(targetDate);
      } catch (writerErr) {
        const msg = writerErr instanceof Error ? writerErr.message : String(writerErr);
        console.error(`[pipeline] Writer failed on round ${round}: ${msg}`);
        if (round === MAX_ROUNDS) throw writerErr; // re-throw to catastrophic handler
        console.log('[pipeline] Retrying writer…');
        continue;
      }

      console.log(`\n--- Editor review (round ${round}) ---`);
      const reviewResult = await reviewDailyReport(targetDate, round);

      // Track the round with the highest passCount as a candidate for best headline.
      if (bestRound === null || reviewResult.passCount > bestRound.passCount) {
        bestRound = { headline: reviewResult.headline, passCount: reviewResult.passCount, round };
      }

      if (reviewResult.verdict === 'approved') {
        cleanApproval = true;
        break;
      }

      // Stuck-loop detection: if the headline and failed check IDs are identical to the
      // previous round, the writer is not making substantive progress — auto-approve early.
      if (
        round >= 2 &&
        prevHeadline !== null &&
        prevFailedCheckIds !== null &&
        isStuckLoop(reviewResult.headline, prevHeadline, reviewResult.failedCheckIds, prevFailedCheckIds)
      ) {
        console.warn(`\n[pipeline] WARNING: Writer appears stuck — round ${round} reproduces round ${round - 1}'s`);
        console.warn(`[pipeline]   headline and editor concerns. Halting iteration and auto-approving.`);
        console.warn(`[pipeline]   Repeated headline: "${reviewResult.headline}"`);
        console.warn(`[pipeline]   Repeated concerns: ${reviewResult.failedCheckIds.join(', ')}`);
        console.warn('[pipeline]   Operator review recommended.');
        break;
      }

      prevHeadline = reviewResult.headline;
      prevFailedCheckIds = reviewResult.failedCheckIds;

      if (round < MAX_ROUNDS) {
        console.log(`[pipeline] Editor requested revisions (round ${round}). Re-running writer…`);
      }
    }

    // When auto-approving (not a clean pass), restore the headline from the round that
    // scored the most passing checks — the final round may have regressed on quality.
    if (!cleanApproval && bestRound !== null && bestRound.round !== finalRound) {
      console.log(`\n[pipeline] Restoring best-round headline (round ${bestRound.round}, ${bestRound.passCount} passes): "${bestRound.headline}"`);
      await patchDraftHeadline(targetDate, bestRound.headline);
    }

    console.log('\n--- Promotion ---');
    outputPath = await promoteDailyArtifact(targetDate);
  } catch (catastrophicErr) {
    const msg = catastrophicErr instanceof Error ? catastrophicErr.message : String(catastrophicErr);
    console.error(`\n[pipeline] Write/promote failed catastrophically: ${msg}`);
    console.error('[pipeline] Activating placeholder path…');
    await generateDailyPlaceholder(targetDate);
    console.log('\n=== Daily Pipeline — PLACEHOLDER SHIPPED ===\n');
    return;
  }

  const slug = path.basename(outputPath, '.json');

  // Step 5: Daily digest email — non-fatal: email failure must not prevent artifact from being committed.
  console.log('\n--- Daily digest email ---');
  try {
    const emailSender = createEmailSender();
    await emailSender.sendDailyDigest(slug, targetDate);
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
