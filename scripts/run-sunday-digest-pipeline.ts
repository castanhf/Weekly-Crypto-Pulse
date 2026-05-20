/**
 * run-sunday-digest-pipeline.ts
 *
 * Loads the past week's daily artifacts (Mon–Sat), calls the LLM to produce a framing
 * paragraph, composes the Sunday digest email, and sends it to all subscribers via EmailSender.
 *
 * Run by the daily-pipeline.yml workflow on Sundays after the daily artifact is committed.
 * Also callable locally: npm run run:sunday-digest
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

import { loadAllArtifacts } from '../lib/reports/artifact-repository';
import { callLlm } from '../lib/llm/client';
import { createEmailSender } from '../lib/email/email-sender-factory';
import type { DailyArtifact as RawDailyArtifact } from '../domain/daily';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const isSunday = (isoDate: string): boolean => new Date(isoDate).getDay() === 0;

const getPastWeekDailies = (): ReadonlyArray<RawDailyArtifact> => {
  const allArtifacts = loadAllArtifacts();
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  // Window: last 7 days, excluding today (Sunday) — Mon through Sat
  const windowStart = new Date(today);
  windowStart.setDate(windowStart.getDate() - 7);

  return allArtifacts
    .filter((a) => a.kind === 'daily')
    .filter((a) => {
      const d = new Date(a.publishedAt);
      return d >= windowStart && d < today;
    })
    .filter((a) => !isSunday(a.publishedAt))
    .map((a) => a.daily)
    .slice(0, 6); // at most Mon–Sat (6 dailies)
};

const SYSTEM_PROMPT = `You are the Sunday Digest Writer for Crypto Pulse. You write the framing paragraph for the Sunday weekly digest email.

Voice rules (same as daily_writer):
- No advisory framing ("you should consider")
- No empty causal attribution ("market sentiment was mixed")
- Specific, concrete, narrative-driven
- No "This week saw..." or "The market experienced..." or "Overall, the week was characterized by..."

Your output is a single paragraph of 3–5 sentences that:
1. Identifies the 2–3 most editorially important threads of the week
2. Frames them as a coherent narrative, not a list
3. Sets up the reader to engage with the specific daily links below

If the week had no major thread, say so honestly: e.g., "A quiet week — the most active days were Tuesday (Ripple raise) and Friday (Senate stablecoin vote scheduled)."

Respond with only the framing paragraph. No preamble, no markdown, no headers.`;

const buildUserPrompt = (dailies: ReadonlyArray<RawDailyArtifact>): string => {
  const entries = dailies
    .map(
      (d, i) =>
        `Day ${i + 1} (${d.publishedAt}):
Headline: ${d.headline}
Summary: ${d.summary}
Tags: ${d.tags.join(', ')}`
    )
    .join('\n\n');

  return `Write the framing paragraph for this week's Sunday digest. Here are the daily reports from this week:\n\n${entries}`;
};

const SUNDAY_DIGEST_LLM = {
  model: 'gpt-4o-mini' as const, // used only by github-models fallback; anthropic always uses Sonnet 4.6
  primary: 'anthropic' as const,
  secondary: 'github-models' as const
} as const;

const generateFramingParagraph = async (dailies: ReadonlyArray<RawDailyArtifact>): Promise<string> => {
  const response = await callLlm(
    {
      model: SUNDAY_DIGEST_LLM.model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: buildUserPrompt(dailies) }
      ],
      maxTokens: 400
    },
    { primary: SUNDAY_DIGEST_LLM.primary, secondary: SUNDAY_DIGEST_LLM.secondary, requestId: 'sunday-digest-framing' }
  );

  const text = response.content;
  if (!text.trim()) throw new Error('LLM returned empty framing paragraph.');
  return text.trim();
};

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const main = async (): Promise<void> => {
  console.log('\n=== Sunday Digest Pipeline ===\n');

  const weekDailies = getPastWeekDailies();

  if (weekDailies.length === 0) {
    console.log('[sunday-digest] No daily artifacts found for the past week. Skipping send.');
    return;
  }

  console.log(`[sunday-digest] Found ${weekDailies.length} daily artifact(s) for framing.`);

  const framing = await generateFramingParagraph(weekDailies);
  console.log(`[sunday-digest] Framing paragraph generated (${framing.split(/\s+/).length} words).`);

  const emailSender = createEmailSender();
  await emailSender.sendSundayDigest(weekDailies, framing);

  console.log('\n=== Sunday Digest Pipeline — COMPLETE ===\n');
};

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : 'Unknown error.';
  console.error(`\n[sunday-digest] FATAL: ${message}`);
  process.exitCode = 1;
});
