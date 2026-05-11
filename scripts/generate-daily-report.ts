/**
 * generate-daily-report.ts
 *
 * Reads the researcher's daily input JSON (data/daily-inputs/local-daily-input.json)
 * and calls the LLM to produce a draft daily artifact at
 * data/daily-drafts/draft-{targetDate}.json.
 *
 * Called as step 2 in the daily pipeline, after generate-daily-input.ts and
 * before review-daily-report.ts.
 *
 * Schema decision (Option A): the weekly footer link is included as the last
 * item in worthKnowing (max 3 editorial bullets + 1 footer = 4 total, within
 * the daily@1.0 schema's max of 4). A proper footer field requires a schema
 * bump to daily@1.1 — tracked as TODO for a future prompt.
 */

import { access, mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { DAILY_SCHEMA_V1_0 } from '../domain/schema-version';
import type { DailyArtifact, MoverEntry, TrackedAssetEntry } from '../domain/daily';
import { callLlm } from '../lib/llm/client';
import { parseAndValidateLlmJson } from '../lib/llm/json-validation';
import { validateDailyV1_0 } from '../lib/reports/artifact-validator';
import type { JsonRecord } from '../lib/reports/json-assertions';
import { SITE_URL } from '../lib/site';
import type { DailyResearcherInput } from './generate-daily-input';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DAILY_INPUT_PATH = path.resolve(process.cwd(), 'data/daily-inputs/local-daily-input.json');
const DRAFTS_DIR = path.resolve(process.cwd(), 'data/daily-drafts');
const REPORTS_DIR = path.resolve(process.cwd(), 'data/reports');

// ---------------------------------------------------------------------------
// Slug helpers
// ---------------------------------------------------------------------------

const toSlugSegment = (text: string, maxLen: number): string =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, maxLen);

const buildArtifactSlug = (targetDate: string, headline: string): string => {
  const headlinePart = toSlugSegment(headline, 70);
  return `${targetDate}-${headlinePart}`;
};

// ---------------------------------------------------------------------------
// Weekly footer helpers
// ---------------------------------------------------------------------------

const findMostRecentWeeklySlug = async (): Promise<string | null> => {
  try {
    const files = await readdir(REPORTS_DIR);
    const jsonFiles = files.filter((f) => f.endsWith('.json') && !f.startsWith('.')).sort();
    if (jsonFiles.length === 0) return null;
    const latestFile = jsonFiles[jsonFiles.length - 1];
    const raw = await readFile(path.join(REPORTS_DIR, latestFile), 'utf-8');
    const artifact = JSON.parse(raw) as { report?: { metadata?: { slug?: string } } };
    return artifact.report?.metadata?.slug ?? null;
  } catch {
    return null;
  }
};

const buildFooterString = (weeklySlug: string | null): string => {
  if (weeklySlug) {
    return `For deeper context, see this week's Crypto Pulse: ${SITE_URL}/reports/${weeklySlug}`;
  }
  return `For deeper context, see the Crypto Pulse archive: ${SITE_URL}/reports`;
};

// ---------------------------------------------------------------------------
// Revision notes helpers
// ---------------------------------------------------------------------------

const loadRevisionNotes = async (targetDate: string): Promise<string | null> => {
  const revisionsPath = path.join(DRAFTS_DIR, `.revisions-${targetDate}.json`);
  try {
    await access(revisionsPath);
    const raw = await readFile(revisionsPath, 'utf-8');
    const parsed = JSON.parse(raw) as { revisionRound: number; failedItems: Array<{ checkItem: string; detail: string; quotedText?: string }> };
    const failedList = parsed.failedItems
      .map((item) => `- ${item.checkItem}: ${item.detail}${item.quotedText ? ` (offending text: "${item.quotedText}")` : ''}`)
      .join('\n');
    return `REVISION NOTES (round ${parsed.revisionRound}):\n${failedList}`;
  } catch {
    return null;
  }
};

// ---------------------------------------------------------------------------
// LLM prompts
// ---------------------------------------------------------------------------

const SYSTEM_PROMPT = `You are the voice of the Crypto Pulse daily report. Transform raw market data into a plainspoken daily artifact that a non-specialist reader can understand. You write for intelligent adults who follow markets but are not traders or analysts.

VOICE RULES (critical):
- Plainspoken: would a smart Financial Times reader who doesn't trade crypto understand this without Googling? If no, rewrite.
- Specific over vague: "Bitcoin fell 4.2% to $88,400" not "Bitcoin fell significantly."
- Honest over cheerful: if it was a bad day, say so.
- No advisory framing. FORBIDDEN: "you should", "we recommend", "consider adding", "buying opportunity", "be careful", "smart play", "stay long", "stay short", "don't panic".
- Educational framing OK: explain patterns, cite data, never advise.
- Jargon: ETF, market cap, dominance, TVL are assumed known. Define other terms once in parentheses on first use.

SECTION INSTRUCTIONS:
- headline: 1 sentence capturing the main story. Plain English, no regime classification, no clickbait.
- summary: 2-3 sentences. 60-second read. Extends the headline, self-contained.
- whatMoved.topTracked: exactly the 15 assets provided. Non-stablecoin, non-derivative entries get one line of context. Stablecoins and derivatives appear but are NOT narrated as market news.
- whatMoved.winners / losers: include all from researcher data. Include catalyst if provided. If both arrays are empty, include a note: "No assets in the 16-50 range moved more than 5%."
- whyItMoved: 200-300 words. Plainspoken prose explaining the day's main driver. Weave in news items where relevant.
- worthKnowing: up to 3 bullets (the 4th slot is reserved for a footer link the script adds). Each bullet is one plain-English sentence. Priority: TVL movements first, then regulatory, then protocol events. May be empty on a quiet day.
- snapshot: pass through the 4 numeric fields from researcher data. No prose — just the numbers.
- tags: 3-5 lowercase tags including "crypto" and "daily".

WORD COUNT: 600-900 words total across headline + summary + whyItMoved + worthKnowing prose.

OUTPUT: Return ONLY the raw JSON — no markdown fences.`;

const buildUserPrompt = (input: DailyResearcherInput, revisionNotes: string | null): string => {
  const { targetDate, marketSnapshot, topTracked, movers, capitalFlows, newsItems } = input;

  const trackedLines = topTracked.map((a) =>
    `  ${a.marketCapRank}. ${a.symbol} ${a.name} — $${a.priceUsd.toLocaleString('en-US', { maximumFractionDigits: 4 })} (${a.changePct24h > 0 ? '+' : ''}${a.changePct24h.toFixed(2)}% 24h)${a.isStablecoin ? ' [stablecoin]' : ''}${a.isWrappedOrDerivative ? ' [wrapped/derivative]' : ''}`
  );

  const winnerLines = movers.winners.map((m) =>
    `  ${m.symbol} ${m.name}: +${m.changePct24h.toFixed(2)}% 24h${m.catalyst ? ` — ${m.catalyst}` : ''}`
  );

  const loserLines = movers.losers.map((m) =>
    `  ${m.symbol} ${m.name}: ${m.changePct24h.toFixed(2)}% 24h${m.catalyst ? ` — ${m.catalyst}` : ''}`
  );

  const tvlLines = capitalFlows.notableTvlMovements.map((t) =>
    `  ${t.chain}: ${t.changePct24h > 0 ? '+' : ''}${t.changePct24h}% ($${(Math.abs(t.changeUsd24h) / 1e6).toFixed(0)}M absolute change)`
  );

  const newsLines = newsItems.map((n) => `  [${n.relevance}] ${n.source}: "${n.headline}" — ${n.summary}`);

  const revisionSection = revisionNotes ? `\n${revisionNotes}\n\nFix ALL of the above issues in this new attempt.\n` : '';

  return `${revisionSection}Generate a daily report for ${targetDate}.

MARKET SNAPSHOT
- Total market cap: $${(marketSnapshot.totalMarketCapUsd / 1e12).toFixed(3)}T
- BTC dominance: ${marketSnapshot.btcDominancePct.toFixed(2)}%
- ETH dominance: ${marketSnapshot.ethDominancePct.toFixed(2)}%
- Fear & Greed: ${marketSnapshot.fearGreedIndex} / 100

TOP 15 TRACKED ASSETS:
${trackedLines.join('\n')}

WINNERS (rank 16-50, ≥+5% 24h):
${winnerLines.length > 0 ? winnerLines.join('\n') : '  (none)'}

LOSERS (rank 16-50, ≤-5% 24h):
${loserLines.length > 0 ? loserLines.join('\n') : '  (none)'}

NOTABLE TVL MOVEMENTS (DeFiLlama):
${tvlLines.length > 0 ? tvlLines.join('\n') : '  (none)'}

NEWS ITEMS:
${newsLines.length > 0 ? newsLines.join('\n') : '  (none)'}

Return JSON with this exact shape:
{
  "headline": "string",
  "summary": "string",
  "whatMoved": {
    "winners": [{"symbol": "string", "name": "string", "changePct24h": number, "catalyst": "string"}],
    "losers": [{"symbol": "string", "name": "string", "changePct24h": number, "catalyst": "string"}],
    "topTracked": [{"symbol": "string", "name": "string", "priceUsd": number, "changePct24h": number, "marketCapUsd": number, "isStablecoin": boolean}]
  },
  "whyItMoved": "string",
  "worthKnowing": ["string"],
  "snapshot": {"totalMarketCapUsd": number, "btcDominancePct": number, "ethDominancePct": number, "fearGreedIndex": number},
  "tags": ["string"]
}

Rules for whatMoved:
- topTracked must have exactly 15 entries (from the TOP 15 list above).
- winners and losers must use catalyst as a non-empty string (invent a brief explanation if the researcher had null).
- marketCapUsd for each topTracked entry comes from the researcher data.
- isStablecoin reflects the researcher's classification.
- worthKnowing must have at most 3 items (the script adds a 4th footer item).`;
};

// ---------------------------------------------------------------------------
// LLM response type and validation
// ---------------------------------------------------------------------------

type WriterLlmOutput = {
  headline: string;
  summary: string;
  whatMoved: {
    winners: Array<{ symbol: string; name: string; changePct24h: number; catalyst: string }>;
    losers: Array<{ symbol: string; name: string; changePct24h: number; catalyst: string }>;
    topTracked: Array<{ symbol: string; name: string; priceUsd: number; changePct24h: number; marketCapUsd: number; isStablecoin: boolean }>;
  };
  whyItMoved: string;
  worthKnowing: string[];
  snapshot: { totalMarketCapUsd: number; btcDominancePct: number; ethDominancePct: number; fearGreedIndex: number };
  tags: string[];
};

const validateWriterOutput = (parsed: unknown): WriterLlmOutput => {
  const typed = parsed as WriterLlmOutput;
  if (typeof typed !== 'object' || typed === null) throw new Error('Output is not an object');
  if (typeof typed.headline !== 'string' || !typed.headline) throw new Error('headline must be a non-empty string');
  if (typeof typed.summary !== 'string' || !typed.summary) throw new Error('summary must be a non-empty string');
  if (typeof typed.whyItMoved !== 'string' || !typed.whyItMoved) throw new Error('whyItMoved must be a non-empty string');
  if (!Array.isArray(typed.worthKnowing)) throw new Error('worthKnowing must be an array');
  if (typed.worthKnowing.length > 3) throw new Error(`worthKnowing must have at most 3 items (script adds footer), got ${typed.worthKnowing.length}`);
  if (!Array.isArray(typed.tags) || typed.tags.length === 0) throw new Error('tags must be a non-empty array');
  if (typeof typed.whatMoved !== 'object' || typed.whatMoved === null) throw new Error('whatMoved must be an object');
  if (!Array.isArray(typed.whatMoved.topTracked)) throw new Error('whatMoved.topTracked must be an array');
  if (typed.whatMoved.topTracked.length !== 15) throw new Error(`topTracked must have 15 entries, got ${typed.whatMoved.topTracked.length}`);
  const snap = typed.snapshot;
  if (typeof snap !== 'object' || snap === null) throw new Error('snapshot must be an object');
  for (const f of ['totalMarketCapUsd', 'btcDominancePct', 'ethDominancePct', 'fearGreedIndex'] as const) {
    if (typeof snap[f] !== 'number' || Number.isNaN(snap[f])) throw new Error(`snapshot.${f} must be a number`);
  }
  return typed;
};

// ---------------------------------------------------------------------------
// Artifact assembly
// ---------------------------------------------------------------------------

const assembleDraft = (
  targetDate: string,
  writerOutput: WriterLlmOutput,
  researcherInput: DailyResearcherInput,
  footerString: string
): DailyArtifact => {
  const slug = buildArtifactSlug(targetDate, writerOutput.headline);

  // Build lookup from researcher's topTracked for authoritative numeric values.
  // The LLM misinterprets large numbers (e.g. reads "$2.807T" → outputs 2807000000
  // instead of 2807000000000). Always use researcher data for market cap fields.
  const researcherCapBySymbol = new Map<string, number>(
    researcherInput.topTracked.map((a) => [a.symbol.toUpperCase(), a.marketCapUsd])
  );

  const winners: MoverEntry[] = writerOutput.whatMoved.winners.map((w) => ({
    symbol: w.symbol,
    name: w.name,
    changePct24h: w.changePct24h,
    catalyst: w.catalyst || 'Market movement noted.'
  }));

  const losers: MoverEntry[] = writerOutput.whatMoved.losers.map((l) => ({
    symbol: l.symbol,
    name: l.name,
    changePct24h: l.changePct24h,
    catalyst: l.catalyst || 'Market movement noted.'
  }));

  const topTracked: TrackedAssetEntry[] = writerOutput.whatMoved.topTracked.map((a) => ({
    symbol: a.symbol,
    name: a.name,
    priceUsd: a.priceUsd,
    changePct24h: a.changePct24h,
    marketCapUsd: researcherCapBySymbol.get(a.symbol.toUpperCase()) ?? a.marketCapUsd,
    isStablecoin: a.isStablecoin
  }));

  const worthKnowing = [...writerOutput.worthKnowing, footerString];

  // Use researcher's marketSnapshot directly — LLM-generated snapshot values are
  // unreliable for large numbers (units confusion between billions and trillions).
  const snapshot = {
    totalMarketCapUsd: researcherInput.marketSnapshot.totalMarketCapUsd,
    btcDominancePct: researcherInput.marketSnapshot.btcDominancePct,
    ethDominancePct: researcherInput.marketSnapshot.ethDominancePct,
    fearGreedIndex: researcherInput.marketSnapshot.fearGreedIndex
  };

  return {
    schemaVersion: DAILY_SCHEMA_V1_0,
    generatedAt: new Date().toISOString(),
    publishedAt: targetDate,
    slug,
    headline: writerOutput.headline,
    summary: writerOutput.summary,
    whatMoved: { winners, losers, topTracked },
    whyItMoved: writerOutput.whyItMoved,
    worthKnowing,
    snapshot,
    tags: writerOutput.tags
  };
};

// ---------------------------------------------------------------------------
// Validation wrapper
// ---------------------------------------------------------------------------

const validateDraft = (draft: DailyArtifact): string[] => {
  const errors: string[] = [];
  try {
    validateDailyV1_0(draft as unknown as JsonRecord, `draft-${draft.publishedAt}.json`);
  } catch (err) {
    errors.push(err instanceof Error ? err.message : String(err));
  }
  return errors;
};

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export const generateDailyReport = async (targetDate: string): Promise<void> => {
  console.log(`[daily-report] Generating writer draft for ${targetDate}…`);

  // Check for failure sentinel
  const sentinelPath = path.join(path.dirname(DAILY_INPUT_PATH), `.failure-${targetDate}.json`);
  try {
    await access(sentinelPath);
    throw new Error(`Researcher failure sentinel exists for ${targetDate}. Run placeholder path instead.`);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== 'ENOENT') throw err;
  }

  // Read researcher input
  const rawInput = await readFile(DAILY_INPUT_PATH, 'utf-8');
  const researcherInput = JSON.parse(rawInput) as DailyResearcherInput;

  if (researcherInput.targetDate !== targetDate) {
    throw new Error(`Researcher input targetDate "${researcherInput.targetDate}" does not match requested "${targetDate}"`);
  }

  // Load revision notes (if this is a re-run after editor rejection)
  const revisionNotes = await loadRevisionNotes(targetDate);
  if (revisionNotes) {
    console.log('  Incorporating editor revision notes…');
  }

  // Find weekly footer slug
  const weeklySlug = await findMostRecentWeeklySlug();
  const footerString = buildFooterString(weeklySlug);

  // Call LLM
  console.log('  Calling LLM (writer)…');
  const llmResponse = await callLlm(
    {
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: buildUserPrompt(researcherInput, revisionNotes) }
      ],
      jsonMode: true,
      maxTokens: 4096
    },
    { primary: 'github-models', secondary: 'openai', requestId: `daily-report-${targetDate}` }
  );
  console.log(`  LLM: ${llmResponse.provider} | ${llmResponse.usage.inputTokens}in / ${llmResponse.usage.outputTokens}out`);

  // Parse LLM response — treat parse/shape errors as validation failures for self-correction
  let writerOutput: WriterLlmOutput | null = null;
  let firstParseError: string | null = null;
  try {
    writerOutput = parseAndValidateLlmJson(llmResponse.content, validateWriterOutput);
  } catch (err) {
    firstParseError = err instanceof Error ? err.message : String(err);
  }

  let draft: DailyArtifact | null = null;
  let validationErrors: string[] = firstParseError ? [firstParseError] : [];

  if (writerOutput) {
    draft = assembleDraft(targetDate, writerOutput, researcherInput, footerString);
    validationErrors = validateDraft(draft);
  }

  // Self-correction pass (triggered by parse failure OR assembled draft failing schema)
  if (validationErrors.length > 0) {
    console.log(`  Validation failed (${validationErrors.length} issues). Attempting self-correction…`);
    const correctionPrompt = `Your previous output failed validation:\n${validationErrors.join('\n')}\n\nFix these issues and produce a corrected JSON output.`;
    const correctionResponse = await callLlm(
      {
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: buildUserPrompt(researcherInput, revisionNotes) },
          { role: 'assistant', content: llmResponse.content },
          { role: 'user', content: correctionPrompt }
        ],
        jsonMode: true,
        maxTokens: 4096
      },
      { primary: 'github-models', secondary: 'openai', requestId: `daily-report-correction-${targetDate}` }
    );
    writerOutput = parseAndValidateLlmJson(correctionResponse.content, validateWriterOutput);
    draft = assembleDraft(targetDate, writerOutput, researcherInput, footerString);
    validationErrors = validateDraft(draft);
  }

  // Ensure draft is always defined before writing (use a minimal fallback if both passes failed)
  if (!draft) {
    throw new Error(`Writer produced no valid draft for ${targetDate} after self-correction attempt`);
  }

  // Write draft (always, even if validation still fails)
  await mkdir(DRAFTS_DIR, { recursive: true });
  const draftPath = path.join(DRAFTS_DIR, `draft-${targetDate}.json`);
  await writeFile(draftPath, `${JSON.stringify(draft, null, 2)}\n`, 'utf-8');
  console.log(`  Draft written to ${path.relative(process.cwd(), draftPath)}`);

  // Write errors file if validation still failing after self-correction
  if (validationErrors.length > 0) {
    const errorsPath = path.join(DRAFTS_DIR, `draft-${targetDate}.errors.json`);
    await writeFile(
      errorsPath,
      JSON.stringify(
        {
          targetDate,
          failedChecks: validationErrors.map((e) => ({ check: 'schema-validation', detail: e }))
        },
        null,
        2
      ),
      'utf-8'
    );
    console.error(`  Draft has ${validationErrors.length} validation error(s). Errors written to ${path.relative(process.cwd(), errorsPath)}`);
  }

  console.log(`[daily-report] Headline: "${draft.headline}"`);
};

// ---------------------------------------------------------------------------
// Standalone entry point
// ---------------------------------------------------------------------------

const main = async (): Promise<void> => {
  const targetDate = process.env['DAILY_TARGET_DATE'] ?? new Date().toISOString().slice(0, 10);
  await generateDailyReport(targetDate);
};

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : 'Unknown error.';
  console.error(`[daily-report] Failed: ${message}`);
  process.exitCode = 1;
});
