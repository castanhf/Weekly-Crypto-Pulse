/**
 * review-daily-report.ts
 *
 * Reads the writer's draft and researcher input, runs the 9-item editorial
 * checklist via LLM, and either approves or writes revision notes.
 *
 * Called as step 3 in the daily pipeline (possibly multiple times — up to 5).
 * On round 5, auto-approves regardless of LLM verdict.
 * Orchestrator may also trigger early exit via stuck-loop detection before round 5.
 *
 * EDITOR_ROUND env var controls which round this is (1–5).
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

import { access, mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { callLlm } from '../lib/llm/client';
import { parseAndValidateLlmJson } from '../lib/llm/json-validation';
import { loadAgentSpec } from '../lib/agents/load-spec';
import type { DailyResearcherInput } from './generate-daily-input';

// ---------------------------------------------------------------------------
// LLM config
// ---------------------------------------------------------------------------

const EDITOR_LLM = {
  model: 'gpt-4o-mini' as const, // used only by github-models fallback; anthropic always uses Sonnet 4.6
  primary: 'anthropic' as const,
  secondary: 'github-models' as const
} as const;

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DAILY_INPUT_PATH = path.resolve(process.cwd(), 'data/daily-inputs/local-daily-input.json');
const DRAFTS_DIR = path.resolve(process.cwd(), 'data/daily-drafts');

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type EditorFailedItem = {
  checkItem: string;
  verdict: 'FAIL';
  detail: string;
  quotedText?: string;
};

type EditorLlmOutput = {
  verdict: 'APPROVED' | 'REVISION_REQUESTED';
  failedItems: EditorFailedItem[];
  passingItems: string[];
  summary?: string;
};

export type ReviewOutcome = {
  verdict: 'approved' | 'revision-requested';
  headline: string;
  failedCheckIds: ReadonlyArray<string>;
  passCount: number;
};

// ---------------------------------------------------------------------------
// LLM prompt
// ---------------------------------------------------------------------------

const INLINE_SYSTEM_PROMPT = `You are the final editorial gatekeeper for the Crypto Pulse daily report. Review the writer's draft against the 14-item editorial checklist below. For each item, make an explicit PASS or FAIL decision.

CHECKLIST:
1 — Register Check: Is the prose plainspoken throughout? Does any jargon appear without definition? Is any content condescending (over-explaining ETF, market cap, dominance, TVL — which are assumed known)?
2 — Advisory Framing Check (HARD REJECT): Does the draft tell the reader what to do — explicitly or implicitly? The test is whether the phrasing implies the READER should act, not merely whether it describes investor behavior. Apply these rules in order: (A) ALWAYS FORBIDDEN — direct advisory: "you should", "we recommend", "we'd", "consider adding/selling", "buying/selling opportunity", "be careful", "smart play", "don't panic", "stay long", "stay short", "investors should". (B) FORBIDDEN — prescriptive implied advisory: second-person or future-tense suggestions ("now might be a good time to", "investors may want to"), and forward-looking speculation framed as a prompt to act ("this could signal further decline" when the purpose is to warn). (C) ACCEPTABLE — capital flow descriptions: factual accounts of what market participants did are NOT advisory, even if they mention investor behavior. PASS examples: "traders rotated into XRP", "capital shifted from Bitcoin to altcoins", "investors moved funds into smaller-cap assets", "ETF outflows accelerated as Bitcoin fell", "investors sought alternatives in XRP and NEAR". These describe market mechanics, not reader prescriptions. (D) BORDERLINE — "raised concerns about further declines": PASS if paired with measurable data (Fear & Greed reading, derivative positioning) that supports the claim; FAIL if the sentence's clear purpose is to warn the reader to be cautious without data support.
3 — Winners-and-Losers Check (HARD REQUIREMENT): Cross-reference the researcher's movers.winners and movers.losers arrays against the draft's whatMoved.winners and whatMoved.losers. IMPORTANT: use ONLY movers.winners and movers.losers from the researcher data for this check — do NOT scan topTracked to derive expected movers. The researcher's movers arrays are the authoritative filtered lists. If the researcher's movers.winners is non-empty and the draft's whatMoved.winners is empty — FAIL (data omission). If the researcher's movers.losers is non-empty and the draft's whatMoved.losers is empty — FAIL (data omission). Conversely, if the researcher's movers.winners is empty, the draft's whatMoved.winners MUST also be empty — FAIL if the draft invented winners not present in movers.winners. Same rule for losers. FAIL action: quote the missing or fabricated asset symbols and their changePct24h.
4 — Stablecoin/Derivative Narration Check: Does the draft narrate the price movement of any stablecoin or wrapped/derivative token as market news? (FAIL example: "USDT gained 0.02%, reflecting safe-haven demand." PASS: USDT appears in table but is not narrated.)
5 — Length Check: Is total prose word count within 600-900 words? Count: headline, summary, whyItMoved, each worthKnowing item, inline prose in whatMoved. Note: quiet-day reports ≥510 words may pass with editorial judgment.
6 — Section Completeness: Are all 6 sections present and non-empty? (headline, summary, whatMoved, whyItMoved, worthKnowing, snapshot). worthKnowing is allowed to be empty on quiet days.
7 — Schema Check: Does the draft satisfy the current daily schema structure? schemaVersion must be "daily@1.2" (current) or "daily@1.1" (legacy, still valid — do NOT require the writer to revert to an older version). Also verify: generatedAt, publishedAt, slug, headline, summary, whyItMoved as non-empty strings; whatMoved with 3 sub-arrays; worthKnowing array ≤4 items; snapshot with 4 numeric fields; tags array.
8 — Factual Traceability Check: Do all prose numerical claims trace to the researcher's data? Tolerance: ±0.5 percentage points for percentages, ±2% for USD prices. Acceptable sources: movers.winners[].priceUsd, movers.losers[].priceUsd, topTracked[].priceUsd, topTracked[].marketCapUsd, topTracked[].changePct24h, and snapshot fields. A price found in ANY of these fields is traceable — do not mark it untraceable just because it comes from topTracked rather than movers. (Do not verify table cells — only prose in summary, whyItMoved, worthKnowing.)
9 — Footer Check: Does the draft include a link to the weekly report in worthKnowing or elsewhere? (Look for /reports link or "Crypto Pulse" reference in a footer context.)
10 — Headline Specificity Check: Does the headline name a specific story? PASS if the headline names at least one specific proper noun (asset, company, regulator, legislation, or event) and references a specific catalyst or quantified movement. The headline does NOT need to explain full significance. FAIL if the headline uses only generic terms ("crypto market", "digital assets"), uses empty descriptors ("mixed results", "modest") as its only content, or is pure price restatement ("Bitcoin slightly up, Ethereum down"). Do NOT fail a headline that names a specific asset, legislation, or event merely because it doesn't explain its full significance.
11 — Summary Editorial Check: Does the 60-second read tell the story rather than restate prices? FAIL if the summary's primary content is "BTC went up X%, ETH went down Y%". FAIL if the summary uses generic phrases: "Overall, the market experienced...", "The day was characterized by...", "Investors saw...". The summary must answer: what happened, and why does it matter?
12 — Causal Attribution Check: Does whyItMoved contain empty causal attributions? FAIL if any of these patterns appear: "ongoing interest in the asset" as a cause, "continues to hold a dominant position" as a cause, "market sentiment appears to be stabilizing" without evidence, "investor caution as the market awaits developments" without specifying what. If an asset moved <1%, the prose should not manufacture an explanation.
13 — Tag Specificity Check: Are the tags specific to the day's content? FAIL if the tag list contains any of: "crypto", "daily", "market", "news", "update". These generic tags apply to every daily and must not appear. Tags must name specific subjects from this day's content.
14 — Quiet-Day Honesty Check: If the day had no major movers (all top-15 within ±1%) and no high-relevance news, is the whyItMoved section short and honest, or padded with invented explanations? A brief honest section PASSES. A 200+ word section of manufactured causal attributions for noise FAILS.
15 — Substantive Revision Check (Rounds 2+): If this is round 1, auto-PASS this check. On rounds 2+, has the writer substantively addressed the concerns from the previous revision? A substantive revision rewrites the offending passage — it does not merely swap a synonym or rearrange the same words. FAIL if the previous revision's flagged headline is unchanged or only superficially reworded, or if a flagged advisory phrase was replaced with a near-synonym rather than rewritten.

OUTPUT FORMAT — return only this JSON:
{
  "verdict": "APPROVED" | "REVISION_REQUESTED",
  "failedItems": [
    {
      "checkItem": "2 — Advisory Framing Check",
      "verdict": "FAIL",
      "detail": "The phrase 'you should consider' appears in whyItMoved.",
      "quotedText": "you should consider"
    }
  ],
  "passingItems": ["1 — Register Check", "3 — Winners-and-Losers Check"],
  "summary": "optional one-sentence summary of overall verdict"
}

If all 15 items PASS, verdict is "APPROVED" and failedItems is [].
If any item FAILS, verdict is "REVISION_REQUESTED".
Do not rewrite the report. Flag exact offenses only. Return raw JSON with no markdown fences.`;

// Appended after the spec body to override the ## Outputs section, which describes
// file writing for interactive agent use (not applicable in API mode).
const EDITOR_API_NOTE = `
## API Mode Output (overrides ## Outputs above)
Return ONLY the following JSON — no markdown fences, no preamble:
{
  "verdict": "APPROVED" | "REVISION_REQUESTED",
  "failedItems": [
    {
      "checkItem": "2 — Advisory Framing Check",
      "verdict": "FAIL",
      "detail": "The phrase 'you should consider' appears in whyItMoved.",
      "quotedText": "you should consider"
    }
  ],
  "passingItems": ["1 — Register Check", "3 — Winners-and-Losers Check"],
  "summary": "optional one-sentence summary of overall verdict"
}
If all items PASS, verdict is "APPROVED" and failedItems is [].
If any item FAILS, verdict is "REVISION_REQUESTED".
Do not rewrite the report. Flag exact offenses only. Return raw JSON with no markdown fences.`;

// With Anthropic (200K context) as primary, full spec loading is safe.
// Fall back to the condensed inline prompt if the spec file cannot be found.
const specBody = loadAgentSpec('daily_editor');
const SYSTEM_PROMPT = specBody !== null ? `${specBody}${EDITOR_API_NOTE}` : INLINE_SYSTEM_PROMPT;

const buildReviewPrompt = (
  draft: string,
  researcherInput: string,
  errorsFileContent: string | null,
  revisionRound: number
): string => {
  const errorsSection = errorsFileContent
    ? `\nWRITER'S SELF-DETECTED ERRORS (from errors.json):\n${errorsFileContent}\n`
    : '';

  return `Review the following daily report draft (round ${revisionRound}).

RESEARCHER'S FINDINGS:
${researcherInput}

WRITER'S DRAFT:
${draft}
${errorsSection}
Apply the 15-item editorial checklist and return your verdict JSON.`;
};

// ---------------------------------------------------------------------------
// Approval marker
// ---------------------------------------------------------------------------

const writeApprovalMarker = async (
  targetDate: string,
  allChecksPassed: boolean,
  autoApproved: boolean,
  unresolvedIssues: string[]
): Promise<void> => {
  await mkdir(DRAFTS_DIR, { recursive: true });
  const markerPath = path.join(DRAFTS_DIR, `.approved-${targetDate}`);
  const content: Record<string, unknown> = {
    approvedAt: new Date().toISOString(),
    targetDate,
    allChecksPassed
  };
  if (autoApproved) {
    content['autoApproved'] = true;
    content['unresolvedIssues'] = unresolvedIssues;
  }
  await writeFile(markerPath, `${JSON.stringify(content, null, 2)}\n`, 'utf-8');
};

// ---------------------------------------------------------------------------
// Revision request
// ---------------------------------------------------------------------------

const writeRevisionRequest = async (targetDate: string, revisionRound: number, failedItems: EditorFailedItem[], passingItems: string[]): Promise<void> => {
  await mkdir(DRAFTS_DIR, { recursive: true });
  const revisionsPath = path.join(DRAFTS_DIR, `.revisions-${targetDate}.json`);
  await writeFile(
    revisionsPath,
    JSON.stringify(
      {
        requestedAt: new Date().toISOString(),
        targetDate,
        revisionRound,
        failedItems,
        passingItems
      },
      null,
      2
    ),
    'utf-8'
  );
};

// ---------------------------------------------------------------------------
// Auto-approval log
// ---------------------------------------------------------------------------

const writeAutoApprovalLog = async (targetDate: string, unresolvedIssues: string[]): Promise<void> => {
  const logPath = path.join(DRAFTS_DIR, `.auto-approval-log-${targetDate}.json`);
  await writeFile(
    logPath,
    JSON.stringify(
      {
        loggedAt: new Date().toISOString(),
        targetDate,
        unresolvedIssues
      },
      null,
      2
    ),
    'utf-8'
  );
};

// ---------------------------------------------------------------------------
// Validation of LLM editor response
// ---------------------------------------------------------------------------

const validateEditorResponse = (parsed: unknown): EditorLlmOutput => {
  const typed = parsed as EditorLlmOutput;
  if (typeof typed !== 'object' || typed === null) throw new Error('Editor output is not an object');
  if (typed.verdict !== 'APPROVED' && typed.verdict !== 'REVISION_REQUESTED') {
    throw new Error(`verdict must be APPROVED or REVISION_REQUESTED, got "${typed.verdict}"`);
  }
  if (!Array.isArray(typed.failedItems)) throw new Error('failedItems must be an array');
  if (!Array.isArray(typed.passingItems)) throw new Error('passingItems must be an array');
  return typed;
};

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export const reviewDailyReport = async (targetDate: string, revisionRound: number): Promise<ReviewOutcome> => {
  console.log(`[daily-review] Reviewing draft for ${targetDate} (round ${revisionRound})…`);

  // Check for researcher failure sentinel — editor should not run in this case
  const sentinelPath = path.join(path.dirname(DAILY_INPUT_PATH), `.failure-${targetDate}.json`);
  try {
    await access(sentinelPath);
    console.error('[daily-review] EDITOR SKIP: researcher failed. Placeholder path active.');
    throw new Error(`Researcher failure sentinel exists for ${targetDate}`);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== 'ENOENT') throw err;
  }

  // Read draft — needed for headline extraction in all paths
  const draftPath = path.join(DRAFTS_DIR, `draft-${targetDate}.json`);
  let draftContent: string;
  try {
    draftContent = await readFile(draftPath, 'utf-8');
  } catch {
    const editorErrorPath = path.join(DRAFTS_DIR, `.editor-error-${targetDate}.json`);
    await mkdir(DRAFTS_DIR, { recursive: true });
    await writeFile(editorErrorPath, JSON.stringify({ message: 'draft not found', targetDate }), 'utf-8');
    throw new Error(`Draft not found for ${targetDate}. Editor error sentinel written.`);
  }

  // Read researcher input
  let researcherContent: string;
  try {
    researcherContent = await readFile(DAILY_INPUT_PATH, 'utf-8');
  } catch {
    const editorErrorPath = path.join(DRAFTS_DIR, `.editor-error-${targetDate}.json`);
    await mkdir(DRAFTS_DIR, { recursive: true });
    await writeFile(editorErrorPath, JSON.stringify({ message: 'researcher input not found', targetDate }), 'utf-8');
    throw new Error(`Researcher input not found. Editor error sentinel written.`);
  }

  // Read optional errors file
  let errorsContent: string | null = null;
  try {
    const errorsPath = path.join(DRAFTS_DIR, `draft-${targetDate}.errors.json`);
    await access(errorsPath);
    errorsContent = await readFile(errorsPath, 'utf-8');
  } catch {
    // No errors file — that's fine
  }

  // Round 5: auto-approve without LLM call (stuck-loop detection in orchestrator may fire earlier)
  if (revisionRound >= 5) {
    const draft = JSON.parse(draftContent) as { headline?: string };
    const headline = draft.headline ?? '';
    console.error(`[AUTO-APPROVED WITH ISSUES] ${targetDate} — round ${revisionRound} reached, auto-approving draft: "${headline}"`);
    const unresolvedIssues = ['Auto-approved after 4 revision rounds; operator review recommended'];
    await writeApprovalMarker(targetDate, false, true, unresolvedIssues);
    await writeAutoApprovalLog(targetDate, unresolvedIssues);
    console.log('[daily-review] Auto-approved (round 5 reached). See auto-approval log.');
    return { verdict: 'approved', headline, failedCheckIds: [], passCount: 0 };
  }

  // Format inputs for LLM (truncate researcher for prompt size)
  const researcherInput = JSON.parse(researcherContent) as DailyResearcherInput;
  const researcherSummary = JSON.stringify({
    targetDate: researcherInput.targetDate,
    marketSnapshot: researcherInput.marketSnapshot,
    topTracked: researcherInput.topTracked.map((a) => ({ symbol: a.symbol, changePct24h: a.changePct24h, isStablecoin: a.isStablecoin, isWrappedOrDerivative: a.isWrappedOrDerivative })),
    movers: researcherInput.movers,
    newsItems: researcherInput.newsItems
  }, null, 2);

  // Call LLM
  console.log('  Calling LLM (editor)…');
  const llmResponse = await callLlm(
    {
      model: EDITOR_LLM.model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: buildReviewPrompt(draftContent, researcherSummary, errorsContent, revisionRound) }
      ],
      jsonMode: true,
      maxTokens: 4096
    },
    { primary: EDITOR_LLM.primary, secondary: EDITOR_LLM.secondary, requestId: `daily-review-${targetDate}-r${revisionRound}` }
  );
  console.log(`  LLM: ${llmResponse.provider} | ${llmResponse.usage.inputTokens}in / ${llmResponse.usage.outputTokens}out`);

  const editorOutput = parseAndValidateLlmJson(llmResponse.content, validateEditorResponse, llmResponse.provider);
  const draftParsed = JSON.parse(draftContent) as { headline?: string };
  const headline = draftParsed.headline ?? '';

  if (editorOutput.verdict === 'APPROVED') {
    await writeApprovalMarker(targetDate, true, false, []);
    console.log(`[daily-review] APPROVED: ${targetDate}`);
    return { verdict: 'approved', headline, failedCheckIds: [], passCount: editorOutput.passingItems.length };
  }

  // Revision requested
  const failedCheckIds = editorOutput.failedItems.map((item) => item.checkItem);
  console.log(`[daily-review] REVISION REQUESTED: ${targetDate} — ${editorOutput.failedItems.length} failed check(s)`);
  for (const item of editorOutput.failedItems) {
    console.log(`  FAIL: ${item.checkItem} — ${item.detail}`);
  }
  await writeRevisionRequest(targetDate, revisionRound, editorOutput.failedItems, editorOutput.passingItems);
  return { verdict: 'revision-requested', headline, failedCheckIds, passCount: editorOutput.passingItems.length };
};

// ---------------------------------------------------------------------------
// Standalone entry point
// ---------------------------------------------------------------------------

const main = async (): Promise<void> => {
  const targetDate = process.env['DAILY_TARGET_DATE'] ?? new Date().toISOString().slice(0, 10);
  const revisionRound = Number(process.env['EDITOR_ROUND'] ?? '1');
  const result = await reviewDailyReport(targetDate, revisionRound);
  if (result.verdict === 'revision-requested') {
    process.exitCode = 1;
  }
};

// Guard prevents this entry-point from firing when imported by the orchestrator.
// Without this, the reviewer attempted to run at import time (before any draft
// existed), causing spurious "Failed: Draft not found" startup log lines.
if (require.main === module) {
  main().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : 'Unknown error.';
    console.error(`[daily-review] Error: ${message}`);
    process.exitCode = 1;
  });
}
