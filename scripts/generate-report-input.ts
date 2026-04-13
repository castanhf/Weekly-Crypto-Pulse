/**
 * generate-report-input.ts
 *
 * Fetches live market data from CoinGecko and the Alternative.me Fear & Greed
 * index, then calls the Claude API to produce a fresh LocalReportInput JSON
 * that is written to data/report-inputs/local-report-input.json.
 *
 * Called as the first step in the weekly automation workflow, before
 * generate-local-report.ts runs.
 *
 * Required env var: ANTHROPIC_API_KEY
 */

import Anthropic from '@anthropic-ai/sdk';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type FetchFn = typeof fetch;

type CoinGeckoGlobalData = {
  data: {
    total_market_cap: Record<string, number>;
    market_cap_percentage: Record<string, number>;
    total_volume: Record<string, number>;
  };
};

type CoinGeckoMarketEntry = {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  market_cap: number;
  price_change_percentage_7d_in_currency: number;
};

type FearGreedResponse = {
  data: Array<{ value: string; value_classification: string }>;
};

type MarketData = {
  totalMarketCapUsd: number;
  btcDominancePct: number;
  ethDominancePct: number;
  fearGreedIndex: number;
  assets: Array<{
    symbol: string;
    name: string;
    priceUsd: number;
    changePct7d: number;
  }>;
};

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const REPORT_INPUT_PATH = path.resolve(process.cwd(), 'data/report-inputs/local-report-input.json');
const REPORTS_DIR = path.resolve(process.cwd(), 'data/reports');
const COINGECKO_GLOBAL_URL = 'https://api.coingecko.com/api/v3/global';
const COINGECKO_MARKETS_URL =
  'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=bitcoin,ethereum,solana&order=market_cap_desc&price_change_percentage=7d';
const FEAR_GREED_URL = 'https://api.alternative.me/fng/?limit=1';

const DISPLAY_WEEK_LABEL_FORMATTER = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  timeZone: 'UTC'
});

// ---------------------------------------------------------------------------
// Date helpers (mirrors generate-local-report.ts logic)
// ---------------------------------------------------------------------------

const toUtcMonday = (date: Date): Date => {
  const monday = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = monday.getUTCDay();
  const daysSinceMonday = (day + 6) % 7;
  monday.setUTCDate(monday.getUTCDate() - daysSinceMonday);
  return monday;
};

const formatIsoDateUtc = (date: Date): string => date.toISOString().slice(0, 10);

const resolvePublishedAt = (): string => {
  const override = process.env['REPORT_PUBLISHED_AT'];
  if (override) return override.trim();
  return formatIsoDateUtc(toUtcMonday(new Date()));
};

const buildWeekLabel = (publishedAt: string): string => {
  const date = new Date(`${publishedAt}T00:00:00.000Z`);
  return `Week of ${DISPLAY_WEEK_LABEL_FORMATTER.format(date)}`;
};

// ---------------------------------------------------------------------------
// Market data fetching
// ---------------------------------------------------------------------------

const fetchJson = async <T>(url: string, fetchFn: FetchFn): Promise<T> => {
  const response = await fetchFn(url, {
    headers: { Accept: 'application/json' }
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} fetching ${url}`);
  }

  return (await response.json()) as T;
};

const fetchMarketData = async (fetchFn: FetchFn): Promise<MarketData> => {
  const [global_, markets, fearGreed] = await Promise.all([
    fetchJson<CoinGeckoGlobalData>(COINGECKO_GLOBAL_URL, fetchFn),
    fetchJson<CoinGeckoMarketEntry[]>(COINGECKO_MARKETS_URL, fetchFn),
    fetchJson<FearGreedResponse>(FEAR_GREED_URL, fetchFn)
  ]);

  const totalMarketCapUsd = global_.data.total_market_cap['usd'] ?? 0;
  const btcDominancePct = global_.data.market_cap_percentage['btc'] ?? 0;
  const ethDominancePct = global_.data.market_cap_percentage['eth'] ?? 0;
  const fearGreedIndex = Number(fearGreed.data[0]?.value ?? 50);

  const symbolMap: Record<string, string> = { bitcoin: 'BTC', ethereum: 'ETH', solana: 'SOL' };

  const assets = markets.map((entry) => ({
    symbol: symbolMap[entry.id] ?? entry.symbol.toUpperCase(),
    name: entry.name,
    priceUsd: entry.current_price,
    changePct7d: entry.price_change_percentage_7d_in_currency ?? 0
  }));

  return { totalMarketCapUsd, btcDominancePct, ethDominancePct, fearGreedIndex, assets };
};

// ---------------------------------------------------------------------------
// Previous report context
// ---------------------------------------------------------------------------

const loadPreviousReportSummary = async (): Promise<string> => {
  try {
    const files = await readdir(REPORTS_DIR);
    const jsonFiles = files.filter((f) => f.endsWith('.json')).sort();
    const latestFile = jsonFiles[jsonFiles.length - 1];

    if (!latestFile) return 'No previous report available.';

    const raw = await readFile(path.join(REPORTS_DIR, latestFile), 'utf-8');
    const artifact = JSON.parse(raw) as {
      report: {
        metadata: { title: string; publishedAt: string; summary: string };
        regime: string;
        marketSnapshot: { fearGreedIndex: number; btcDominancePct: number; totalMarketCapUsd: number };
      };
    };

    const { metadata, regime, marketSnapshot } = artifact.report;
    return [
      `Previous report: "${metadata.title}" (published ${metadata.publishedAt})`,
      `Summary: ${metadata.summary}`,
      `Regime: ${regime}`,
      `Fear & Greed: ${marketSnapshot.fearGreedIndex}, BTC dominance: ${marketSnapshot.btcDominancePct}%, Total market cap: $${(marketSnapshot.totalMarketCapUsd / 1e12).toFixed(2)}T`
    ].join('\n');
  } catch {
    return 'No previous report available.';
  }
};

// ---------------------------------------------------------------------------
// Claude generation
// ---------------------------------------------------------------------------

const SYSTEM_PROMPT = `You are a professional cryptocurrency market analyst producing a weekly research brief for Weekly Crypto Pulse. Your tone is analytical, factual, and measured — suitable for educated retail investors and sophisticated readers. You do not give direct financial advice. You never say "you should buy/sell". You write in clear prose, not bullet-point fragments.

Your task: given live market data for the current week, generate a complete report input JSON object matching the schema below. Return ONLY the raw JSON — no markdown fences, no commentary before or after.

SCHEMA (all fields required):
{
  "generatedAt": "<ISO 8601 timestamp>",
  "week": {
    "publishedAt": "<YYYY-MM-DD, the UTC Monday for this week>",
    "label": "<e.g. Week of Apr 13, 2026>"
  },
  "headline": "<8–14 word headline, sentence case, no trailing period>",
  "summary": "<2–3 sentence executive summary, factual, mentions key metrics>",
  "tags": ["crypto", "weekly", "<2–3 more relevant lowercase tags>"],
  "regime": "<one of: risk-on | risk-off | range-bound | transition>",
  "snapshot": {
    "totalMarketCapUsd": <number>,
    "btcDominancePct": <number, 2 decimal places>,
    "ethDominancePct": <number, 2 decimal places>,
    "fearGreedIndex": <integer 0–100>
  },
  "movers": [
    {
      "symbol": "<e.g. BTC>",
      "name": "<e.g. Bitcoin>",
      "changePct7d": <number, 2 decimal places>,
      "catalyst": "<1–2 sentence explanation of 7-day price action and drivers>"
    }
    // include BTC, ETH, SOL
  ],
  "sections": [
    {
      "id": "macro",
      "heading": "<Descriptive heading for macro context>",
      "body": "<3–4 paragraph analytical prose covering macro and sentiment>",
      "highlights": ["<3–4 key takeaways as complete sentences>"]
    },
    {
      "id": "btc-eth",
      "heading": "<Descriptive heading for BTC & ETH analysis>",
      "body": "<3–4 paragraph analytical prose covering price action and structure>",
      "highlights": ["<3–4 key takeaways as complete sentences>"]
    },
    {
      "id": "outlook",
      "heading": "<Descriptive heading for the forward outlook>",
      "body": "<3–4 paragraph analytical prose covering regime, risks, and scenarios>",
      "highlights": ["<3–4 key takeaways as complete sentences>"]
    }
  ],
  "signals": {
    "thesis": ["<4 thesis statements — specific, actionable framing, not advice>"],
    "riskChecklist": [
      "<risk item 1>",
      "<risk item 2>",
      "<risk item 3>",
      "<risk item 4>",
      "<risk item 5>"
    ],
    "watchlistLevels": [
      { "asset": "BTC", "level": "<price level>", "context": "<1–2 sentence explanation>" },
      { "asset": "ETH", "level": "<price level>", "context": "<1–2 sentence explanation>" }
    ],
    "changedSinceLastWeek": ["<3–4 bullet descriptions of what materially changed vs last week>"]
  }
}

HARD CONSTRAINTS:
- signals.riskChecklist must have EXACTLY 5 items.
- regime must be exactly one of: risk-on, risk-off, range-bound, transition.
- All numeric fields must be JSON numbers (not strings).
- Do NOT wrap the output in markdown code fences.
- Do NOT include any text before or after the JSON object.`;

const buildUserPrompt = (publishedAt: string, weekLabel: string, market: MarketData, previousReport: string): string => {
  const btc = market.assets.find((a) => a.symbol === 'BTC');
  const eth = market.assets.find((a) => a.symbol === 'ETH');
  const sol = market.assets.find((a) => a.symbol === 'SOL');

  return `Current market data for the week ending ${publishedAt} (${weekLabel}):

MACRO SNAPSHOT
- Total crypto market cap: $${(market.totalMarketCapUsd / 1e12).toFixed(3)}T
- BTC dominance: ${market.btcDominancePct.toFixed(2)}%
- ETH dominance: ${market.ethDominancePct.toFixed(2)}%
- Fear & Greed Index: ${market.fearGreedIndex}

ASSET PRICES (7-day change)
- BTC: $${btc?.priceUsd.toLocaleString('en-US', { maximumFractionDigits: 0 }) ?? 'N/A'} (${btc?.changePct7d.toFixed(2) ?? '?'}% 7d)
- ETH: $${eth?.priceUsd.toLocaleString('en-US', { maximumFractionDigits: 0 }) ?? 'N/A'} (${eth?.changePct7d.toFixed(2) ?? '?'}% 7d)
- SOL: $${sol?.priceUsd.toLocaleString('en-US', { maximumFractionDigits: 0 }) ?? 'N/A'} (${sol?.changePct7d.toFixed(2) ?? '?'}% 7d)

PREVIOUS WEEK CONTEXT
${previousReport}

Use the data above to generate the full report input JSON. The week.publishedAt must be "${publishedAt}" and week.label must be "${weekLabel}".`;
};

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

const VALID_REGIMES = new Set(['risk-on', 'risk-off', 'range-bound', 'transition']);

type RawReportInput = {
  generatedAt: string;
  week: { publishedAt: string; label: string };
  headline: string;
  summary: string;
  tags: string[];
  regime: string;
  snapshot: {
    totalMarketCapUsd: number;
    btcDominancePct: number;
    ethDominancePct: number;
    fearGreedIndex: number;
  };
  movers: Array<{ symbol: string; name: string; changePct7d: number; catalyst: string }>;
  sections: Array<{ id: string; heading: string; body: string; highlights: string[] }>;
  signals: {
    thesis: string[];
    riskChecklist: string[];
    watchlistLevels: Array<{ asset: string; level: string; context: string }>;
    changedSinceLastWeek: string[];
  };
};

const validateReportInput = (input: RawReportInput): void => {
  if (!VALID_REGIMES.has(input.regime)) {
    throw new Error(`Invalid regime: "${input.regime}". Must be one of: ${[...VALID_REGIMES].join(', ')}`);
  }
  if (input.signals.riskChecklist.length !== 5) {
    throw new Error(`signals.riskChecklist must have exactly 5 items, got ${input.signals.riskChecklist.length}`);
  }
  const numericFields: [string, unknown][] = [
    ['snapshot.totalMarketCapUsd', input.snapshot.totalMarketCapUsd],
    ['snapshot.btcDominancePct', input.snapshot.btcDominancePct],
    ['snapshot.ethDominancePct', input.snapshot.ethDominancePct],
    ['snapshot.fearGreedIndex', input.snapshot.fearGreedIndex]
  ];
  for (const [name, value] of numericFields) {
    if (typeof value !== 'number' || Number.isNaN(value)) {
      throw new Error(`Field "${name}" must be a number, got: ${JSON.stringify(value)}`);
    }
  }
};

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const main = async (): Promise<void> => {
  const apiKey = process.env['ANTHROPIC_API_KEY'];
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY environment variable is required.');
  }

  const publishedAt = resolvePublishedAt();
  const weekLabel = buildWeekLabel(publishedAt);

  console.log(`Generating report input for ${weekLabel} (${publishedAt})…`);

  // 1. Fetch market data
  console.log('Fetching live market data…');
  const marketData = await fetchMarketData(fetch);
  console.log(`  Market cap: $${(marketData.totalMarketCapUsd / 1e12).toFixed(3)}T | Fear & Greed: ${marketData.fearGreedIndex} | BTC dom: ${marketData.btcDominancePct.toFixed(2)}%`);

  // 2. Load previous report for context
  const previousReport = await loadPreviousReportSummary();

  // 3. Call Claude
  console.log('Calling Claude API…');
  const client = new Anthropic({ apiKey });

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: buildUserPrompt(publishedAt, weekLabel, marketData, previousReport)
      }
    ]
  });

  const rawContent = message.content[0];
  if (rawContent?.type !== 'text') {
    throw new Error('Unexpected response type from Claude API.');
  }

  const rawJson = rawContent.text.trim();

  // 4. Parse and validate
  let reportInput: RawReportInput;
  try {
    reportInput = JSON.parse(rawJson) as RawReportInput;
  } catch (err) {
    throw new Error(`Claude returned invalid JSON: ${err instanceof Error ? err.message : String(err)}\n\nRaw response:\n${rawJson.slice(0, 500)}`);
  }

  validateReportInput(reportInput);

  // 5. Write output
  await writeFile(REPORT_INPUT_PATH, `${JSON.stringify(reportInput, null, 2)}\n`, 'utf-8');
  console.log(`Report input written to ${path.relative(process.cwd(), REPORT_INPUT_PATH)}`);
  console.log(`  Headline: ${reportInput.headline}`);
  console.log(`  Regime:   ${reportInput.regime}`);
};

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : 'Unknown error.';
  console.error(`Failed to generate report input: ${message}`);
  process.exitCode = 1;
});
