/**
 * generate-report-input.ts
 *
 * Fetches live market data from CoinGecko and the Alternative.me Fear & Greed
 * index, then calls the GitHub Models inference API (OpenAI-compatible, free,
 * uses the GITHUB_TOKEN that is auto-injected in every Actions workflow) to
 * produce a fresh LocalReportInput JSON written to
 * data/report-inputs/local-report-input.json.
 *
 * Called as the first step in the weekly automation workflow, before
 * generate-local-report.ts runs.
 *
 * Required env var: GITHUB_TOKEN (auto-injected by GitHub Actions; set locally
 * with a personal access token that has read access to your account)
 */

import OpenAI from 'openai';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type CoinGeckoGlobalData = {
  data: {
    total_market_cap: Record<string, number>;
    market_cap_percentage: Record<string, number>;
  };
};

type CoinGeckoMarketEntry = {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
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

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const REPORT_INPUT_PATH = path.resolve(process.cwd(), 'data/report-inputs/local-report-input.json');
const REPORTS_DIR = path.resolve(process.cwd(), 'data/reports');
const COINGECKO_GLOBAL_URL = 'https://api.coingecko.com/api/v3/global';
const COINGECKO_MARKETS_URL =
  'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=bitcoin,ethereum,solana&order=market_cap_desc&price_change_percentage=7d';
const FEAR_GREED_URL = 'https://api.alternative.me/fng/?limit=1';
const GITHUB_MODELS_BASE_URL = 'https://models.inference.ai.azure.com';
const GITHUB_MODELS_MODEL = 'gpt-4o-mini';
const VALID_REGIMES = new Set(['risk-on', 'risk-off', 'range-bound', 'transition']);

// ---------------------------------------------------------------------------
// Date helpers (mirrors generate-local-report.ts logic)
// ---------------------------------------------------------------------------

const DISPLAY_WEEK_LABEL_FORMATTER = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  timeZone: 'UTC'
});

const toUtcMonday = (date: Date): Date => {
  const monday = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const daysSinceMonday = (monday.getUTCDay() + 6) % 7;
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

const fetchJson = async <T>(url: string): Promise<T> => {
  const response = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error(`HTTP ${response.status} fetching ${url}`);
  return (await response.json()) as T;
};

const fetchMarketData = async (): Promise<MarketData> => {
  const [global_, markets, fearGreed] = await Promise.all([
    fetchJson<CoinGeckoGlobalData>(COINGECKO_GLOBAL_URL),
    fetchJson<CoinGeckoMarketEntry[]>(COINGECKO_MARKETS_URL),
    fetchJson<FearGreedResponse>(FEAR_GREED_URL)
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
// Prompts
// ---------------------------------------------------------------------------

const SYSTEM_PROMPT = `You are a professional cryptocurrency market analyst producing a weekly research brief for Weekly Crypto Pulse. Your tone is analytical, factual, and measured — suitable for educated retail investors and sophisticated readers. You do not give direct financial advice. You never say "you should buy/sell". You write in clear prose, not bullet-point fragments.

Your task: given live market data for the current week, generate a complete report input JSON object matching the schema below. Return ONLY the raw JSON — no markdown fences, no commentary before or after.

SCHEMA (all fields required):
{
  "generatedAt": "<ISO 8601 timestamp>",
  "week": {
    "publishedAt": "<YYYY-MM-DD, the UTC Monday for this week>",
    "label": "<e.g. Week of Apr 14, 2026>"
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
    "changedSinceLastWeek": ["<3–4 descriptions of what materially changed vs last week>"]
  }
}

HARD CONSTRAINTS:
- signals.riskChecklist must have EXACTLY 5 items — no more, no fewer.
- regime must be exactly one of: risk-on, risk-off, range-bound, transition.
- All numeric fields must be JSON numbers (not strings).
- movers must include BTC, ETH, and SOL.
- Do NOT wrap the output in markdown code fences.
- Do NOT include any text before or after the JSON object.`;

const buildUserPrompt = (publishedAt: string, weekLabel: string, market: MarketData, previousReport: string): string => {
  const btc = market.assets.find((a) => a.symbol === 'BTC');
  const eth = market.assets.find((a) => a.symbol === 'ETH');
  const sol = market.assets.find((a) => a.symbol === 'SOL');
  const fmt = (n: number | undefined): string =>
    n !== undefined ? n.toLocaleString('en-US', { maximumFractionDigits: 0 }) : 'N/A';

  return `Current market data for the week of ${publishedAt} (${weekLabel}):

MACRO SNAPSHOT
- Total crypto market cap: $${(market.totalMarketCapUsd / 1e12).toFixed(3)}T
- BTC dominance: ${market.btcDominancePct.toFixed(2)}%
- ETH dominance: ${market.ethDominancePct.toFixed(2)}%
- Fear & Greed Index: ${market.fearGreedIndex} / 100

ASSET PRICES (7-day change)
- BTC: $${fmt(btc?.priceUsd)} (${btc?.changePct7d.toFixed(2) ?? '?'}% 7d)
- ETH: $${fmt(eth?.priceUsd)} (${eth?.changePct7d.toFixed(2) ?? '?'}% 7d)
- SOL: $${fmt(sol?.priceUsd)} (${sol?.changePct7d.toFixed(2) ?? '?'}% 7d)

PREVIOUS WEEK CONTEXT
${previousReport}

Generate the full report input JSON. week.publishedAt must be "${publishedAt}" and week.label must be "${weekLabel}".`;
};

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

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
  const githubToken = process.env['GITHUB_TOKEN'];
  if (!githubToken) {
    throw new Error('GITHUB_TOKEN environment variable is required.');
  }

  const publishedAt = resolvePublishedAt();
  const weekLabel = buildWeekLabel(publishedAt);

  console.log(`Generating report input for ${weekLabel} (${publishedAt})…`);

  // 1. Fetch live market data
  console.log('Fetching live market data…');
  const marketData = await fetchMarketData();
  console.log(
    `  Market cap: $${(marketData.totalMarketCapUsd / 1e12).toFixed(3)}T | ` +
    `Fear & Greed: ${marketData.fearGreedIndex} | ` +
    `BTC dom: ${marketData.btcDominancePct.toFixed(2)}%`
  );

  // 2. Load previous report for context
  const previousReport = await loadPreviousReportSummary();

  // 3. Call GitHub Models (OpenAI-compatible, free, uses GITHUB_TOKEN)
  console.log(`Calling GitHub Models (${GITHUB_MODELS_MODEL})…`);
  const client = new OpenAI({
    baseURL: GITHUB_MODELS_BASE_URL,
    apiKey: githubToken
  });

  const response = await client.chat.completions.create({
    model: GITHUB_MODELS_MODEL,
    max_tokens: 4096,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: buildUserPrompt(publishedAt, weekLabel, marketData, previousReport) }
    ]
  });

  const rawContent = response.choices[0]?.message?.content;
  if (!rawContent) {
    throw new Error('Empty response from GitHub Models API.');
  }

  // Strip markdown fences if the model added them despite instructions
  const rawJson = rawContent.trim().replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();

  // 4. Parse and validate
  let reportInput: RawReportInput;
  try {
    reportInput = JSON.parse(rawJson) as RawReportInput;
  } catch (err) {
    throw new Error(
      `Model returned invalid JSON: ${err instanceof Error ? err.message : String(err)}\n\nRaw response:\n${rawJson.slice(0, 500)}`
    );
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
