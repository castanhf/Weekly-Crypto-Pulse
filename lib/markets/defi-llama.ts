/**
 * DeFiLlama API access — shared module.
 * Used by both the daily researcher and the weekly Market Researcher.
 *
 * Types are imported from domain/market-data.ts (canonical source) to keep
 * the dependency direction correct: lib/ → domain/.
 *
 * DRIFT TRACKING: This module is the canonical DeFiLlama implementation for
 * both pipelines. Changes to fetch logic, thresholds, or caching apply here.
 */

import { getCached } from '../cache/file-cache';
import type { ChainTvlEntry, NotableTvlMovement } from '../../domain/market-data';

export type { ChainTvlEntry, NotableTvlMovement };

// ---------------------------------------------------------------------------
// Internal CoinGecko/DeFiLlama API types (not exported)
// ---------------------------------------------------------------------------

type DeFiLlamaChainRaw = {
  name: string;
  tvl: number;
  change_1d: number | null;
};

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DEFILLAMA_CHAINS_URL = 'https://api.llama.fi/v2/chains';
const CACHE_KEY = 'defillama-chains';
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const fetchJson = async <T>(url: string): Promise<T> => {
  const response = await fetch(url, {
    headers: { Accept: 'application/json', 'User-Agent': 'crypto-pulse/1.0' }
  });
  if (!response.ok) throw new Error(`HTTP ${response.status} fetching ${url}`);
  return (await response.json()) as T;
};

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

/**
 * Fetches top N chains by TVL from DeFiLlama, sorted descending.
 * Caches for 30 minutes with stale fallback.
 */
export async function fetchTopChainsTvl(options?: { topN?: number }): Promise<ChainTvlEntry[]> {
  const topN = options?.topN ?? 15;

  const rawChains = await getCached<DeFiLlamaChainRaw[]>(
    CACHE_KEY,
    CACHE_TTL_MS,
    () => fetchJson<DeFiLlamaChainRaw[]>(DEFILLAMA_CHAINS_URL)
  );

  return rawChains
    .sort((a, b) => b.tvl - a.tvl)
    .slice(0, topN)
    .map((chain) => {
      const changePct = chain.change_1d ?? 0;
      return {
        chain: chain.name,
        tvlUsd: Math.round(chain.tvl),
        changePct24h: Number(changePct.toFixed(2)),
        changeUsd24h: Math.round((chain.tvl * changePct) / 100)
      };
    });
}

/**
 * Identifies notable TVL movements from a list of chain entries.
 *
 * Thresholds:
 * - Percent: top-N chains (default top 10) with >10% absolute 24h change
 * - Absolute: any chain with >$500M absolute 24h USD change
 *
 * A chain can match at most one trigger. Percent threshold takes priority.
 */
export function detectNotableTvlMovements(
  chains: ChainTvlEntry[],
  options?: {
    percentThreshold?: number;       // default 0.10 (10%)
    absoluteUsdThreshold?: number;   // default 500_000_000 ($500M)
    topNForPercentThreshold?: number; // default 10
  }
): NotableTvlMovement[] {
  const pctThreshold = options?.percentThreshold ?? 0.10;
  const absThreshold = options?.absoluteUsdThreshold ?? 500_000_000;
  const topNForPct = options?.topNForPercentThreshold ?? 10;

  const pctThresholdInPercent = pctThreshold * 100;
  const topNChains = new Set(chains.slice(0, topNForPct).map((c) => c.chain));

  const results: NotableTvlMovement[] = [];
  for (const chain of chains) {
    const isInTopN = topNChains.has(chain.chain);
    if (isInTopN && Math.abs(chain.changePct24h) >= pctThresholdInPercent) {
      results.push({ ...chain, trigger: 'percent_threshold' });
    } else if (Math.abs(chain.changeUsd24h) >= absThreshold) {
      results.push({ ...chain, trigger: 'absolute_threshold' });
    }
  }
  return results;
}
