/**
 * Single source of truth for the winners/losers selection rule.
 *
 * Rule (introduced in WCP-153, replacing the >5% threshold from WCP-137):
 *   - Top N by percent change in each direction (positive = winners, negative = losers)
 *   - Daily: N = 1 (1 winner + 1 loser)
 *   - Weekly: N = 3 (3 winners + 3 losers)
 *   - Both arrays are always populated (no empty sections on quiet days)
 *   - Callers must pre-filter stablecoins and wrapped/derivative tokens before passing candidates
 *
 * The rule lives here and is consumed by both the daily and weekly researcher scripts.
 * Writer and editor agent specs describe it in plain language, deferring to this module
 * as the implementation authority.
 */

export type MoverCandidate = Readonly<{
  symbol: string;
  name: string;
  changePct24h: number;
  priceUsd: number;
  marketCapUsd: number;
}>;

export type ComputedMover = MoverCandidate &
  Readonly<{
    /** Approximate USD price change over 24h: priceUsd * changePct24h / 100 */
    priceChange24hUsd: number;
  }>;

export type MarketRegime = 'mixed' | 'all-positive' | 'all-negative';

export type SectionLabels = Readonly<{
  winners: string;
  losers: string;
}>;

export type MoversResult = Readonly<{
  winners: ReadonlyArray<ComputedMover>;
  losers: ReadonlyArray<ComputedMover>;
  marketRegime: MarketRegime;
  sectionLabels: SectionLabels;
}>;

export const DAILY_TOP_N = 1;
export const WEEKLY_TOP_N = 3;

const SECTION_LABELS: Readonly<Record<MarketRegime, SectionLabels>> = {
  mixed: { winners: 'Winners', losers: 'Losers' },
  'all-positive': { winners: 'Winners', losers: 'Weakest gainers' },
  'all-negative': { winners: 'Smallest losses', losers: 'Losers' }
};

const toComputedMover = (candidate: MoverCandidate): ComputedMover => ({
  ...candidate,
  priceChange24hUsd: Math.round(candidate.priceUsd * candidate.changePct24h) / 100
});

const detectRegime = (candidates: ReadonlyArray<MoverCandidate>): MarketRegime => {
  if (candidates.length === 0) return 'mixed';
  if (candidates.every((c) => c.changePct24h > 0)) return 'all-positive';
  if (candidates.every((c) => c.changePct24h < 0)) return 'all-negative';
  return 'mixed';
};

/**
 * Compute top-N winners and losers from pre-filtered candidates.
 *
 * Callers must exclude stablecoins and wrapped/derivative tokens before calling.
 * Returns winners sorted best-first, losers sorted worst-first.
 *
 * Edge case: if fewer candidates than N are available (e.g., only 1 non-stablecoin asset
 * exists in the top-50 — a theoretical impossibility in practice), the function returns
 * what it has rather than throwing. Both arrays will contain the same asset only if
 * exactly 1 candidate is provided.
 */
export const computeMovers = (candidates: ReadonlyArray<MoverCandidate>, cadence: 'daily' | 'weekly'): MoversResult => {
  const topN = cadence === 'daily' ? DAILY_TOP_N : WEEKLY_TOP_N;
  const marketRegime = detectRegime(candidates);
  const sectionLabels = SECTION_LABELS[marketRegime];

  if (candidates.length === 0) {
    return { winners: [], losers: [], marketRegime, sectionLabels };
  }

  const sorted = [...candidates].sort((a, b) => b.changePct24h - a.changePct24h);

  const winners = sorted.slice(0, topN).map(toComputedMover);
  // Bottom-N, ordered worst-first (most negative first)
  const losers = sorted
    .slice(-topN)
    .reverse()
    .map(toComputedMover);

  return { winners, losers, marketRegime, sectionLabels };
};
