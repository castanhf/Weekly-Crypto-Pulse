import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { ChainTvlEntry } from '../../domain/market-data';

vi.mock('../../lib/cache/file-cache', () => ({
  getCached: vi.fn()
}));

import { getCached } from '../../lib/cache/file-cache';
import { detectNotableTvlMovements, fetchTopChainsTvl } from './defi-llama';

const mockGetCached = vi.mocked(getCached);

// fetchTopChainsTvl's getCached stores raw DeFiLlama format before mapping
type RawChain = { name: string; tvl: number; change_1d: number | null };

const makeRaw = (name: string, tvl: number, change_1d: number | null): RawChain => ({
  name,
  tvl,
  change_1d
});

const makeChain = (chain: string, tvlUsd: number, changePct24h: number, changeUsd24h: number): ChainTvlEntry => ({
  chain,
  tvlUsd,
  changePct24h,
  changeUsd24h
});

describe('fetchTopChainsTvl', () => {
  beforeEach(() => {
    mockGetCached.mockReset();
  });

  it('calls getCached with the correct key and TTL', async () => {
    mockGetCached.mockResolvedValue([]);
    await fetchTopChainsTvl();
    expect(mockGetCached).toHaveBeenCalledWith('defillama-chains', 30 * 60 * 1000, expect.any(Function));
  });

  it('maps raw DeFiLlama format to ChainTvlEntry format', async () => {
    const raw: RawChain[] = [makeRaw('Ethereum', 50_000_000_000, 5.0)];
    mockGetCached.mockResolvedValue(raw);
    const result = await fetchTopChainsTvl({ topN: 5 });
    expect(result).toHaveLength(1);
    expect(result[0].chain).toBe('Ethereum');
    expect(result[0].tvlUsd).toBe(50_000_000_000);
    expect(result[0].changePct24h).toBe(5.0);
    expect(typeof result[0].changeUsd24h).toBe('number');
  });

  it('sorts by tvl descending before slicing', async () => {
    const raw: RawChain[] = [
      makeRaw('Small', 1e9, 0),
      makeRaw('Large', 50e9, 0),
      makeRaw('Medium', 4e9, 0)
    ];
    mockGetCached.mockResolvedValue(raw);
    const result = await fetchTopChainsTvl({ topN: 2 });
    expect(result[0].chain).toBe('Large');
    expect(result[1].chain).toBe('Medium');
  });

  it('slices to topN', async () => {
    const raw: RawChain[] = Array.from({ length: 20 }, (_, i) =>
      makeRaw(`Chain${i}`, (20 - i) * 1e9, 0)
    );
    mockGetCached.mockResolvedValue(raw);
    const result = await fetchTopChainsTvl({ topN: 5 });
    expect(result).toHaveLength(5);
  });

  it('defaults topN to 15', async () => {
    const raw: RawChain[] = Array.from({ length: 20 }, (_, i) =>
      makeRaw(`Chain${i}`, (20 - i) * 1e9, 0)
    );
    mockGetCached.mockResolvedValue(raw);
    const result = await fetchTopChainsTvl();
    expect(result).toHaveLength(15);
  });

  it('returns all if topN exceeds available chains', async () => {
    const raw: RawChain[] = [makeRaw('Ethereum', 50e9, 2.5), makeRaw('BSC', 4e9, -1)];
    mockGetCached.mockResolvedValue(raw);
    const result = await fetchTopChainsTvl({ topN: 100 });
    expect(result).toHaveLength(2);
  });

  it('treats null change_1d as 0', async () => {
    const raw: RawChain[] = [makeRaw('Ethereum', 50e9, null)];
    mockGetCached.mockResolvedValue(raw);
    const result = await fetchTopChainsTvl({ topN: 5 });
    expect(result[0].changePct24h).toBe(0);
    expect(result[0].changeUsd24h).toBe(0);
  });

  it('returns empty array when cache returns empty', async () => {
    mockGetCached.mockResolvedValue([]);
    const result = await fetchTopChainsTvl();
    expect(result).toEqual([]);
  });
});

describe('detectNotableTvlMovements', () => {
  it('returns empty array for empty input', () => {
    expect(detectNotableTvlMovements([])).toEqual([]);
  });

  it('detects percent threshold for a chain in top-10', () => {
    const chains: ChainTvlEntry[] = [
      makeChain('Ethereum', 50e9, 12, 6e9), // >10%, rank 1 (in top 10)
      ...Array.from({ length: 9 }, (_, i) => makeChain(`Other${i}`, (9 - i) * 1e9, 2, 2e7))
    ];
    const result = detectNotableTvlMovements(chains);
    expect(result.some((m) => m.chain === 'Ethereum' && m.trigger === 'percent_threshold')).toBe(true);
  });

  it('does NOT fire percent threshold for chain ranked >10', () => {
    const chains: ChainTvlEntry[] = [
      ...Array.from({ length: 10 }, (_, i) => makeChain(`Top${i}`, (10 - i) * 1e10, 2, 2e8)),
      // Rank 11 chain with big percent but small absolute (below absolute threshold)
      makeChain('SmallChain', 1e8, 50, 50_000_000) // rank 11, $50M abs — below $500M threshold
    ];
    const result = detectNotableTvlMovements(chains);
    const smallChainPercentTrigger = result.find(
      (m) => m.chain === 'SmallChain' && m.trigger === 'percent_threshold'
    );
    expect(smallChainPercentTrigger).toBeUndefined();
  });

  it('detects absolute threshold for any chain regardless of rank', () => {
    const chains: ChainTvlEntry[] = [
      ...Array.from({ length: 10 }, (_, i) => makeChain(`Top${i}`, (10 - i) * 1e10, 2, 2e8)),
      makeChain('SmallChain', 1e8, 5, 600_000_000) // >$500M absolute change
    ];
    const result = detectNotableTvlMovements(chains);
    expect(result.some((m) => m.chain === 'SmallChain' && m.trigger === 'absolute_threshold')).toBe(true);
  });

  it('does not flag chains below both thresholds', () => {
    const chains: ChainTvlEntry[] = Array.from({ length: 5 }, (_, i) =>
      makeChain(`Chain${i}`, (5 - i) * 1e9, 3, 100_000_000)
    );
    const result = detectNotableTvlMovements(chains);
    expect(result).toHaveLength(0);
  });

  it('respects custom percentThreshold — chain with TVL that keeps abs change below abs threshold', () => {
    // Chain with TVL $2B, 8% change → changeUsd24h = $160M (below $500M abs threshold)
    // 8% is below default 10% but above custom 5%
    const chains: ChainTvlEntry[] = [
      makeChain('SmallEth', 2e9, 8, 160_000_000), // rank 1
      ...Array.from({ length: 9 }, (_, i) => makeChain(`Other${i}`, (9 - i) * 5e8, 1, 5_000_000))
    ];
    const defaultResult = detectNotableTvlMovements(chains);
    const customResult = detectNotableTvlMovements(chains, { percentThreshold: 0.05 });

    expect(defaultResult.some((m) => m.chain === 'SmallEth')).toBe(false);
    expect(customResult.some((m) => m.chain === 'SmallEth' && m.trigger === 'percent_threshold')).toBe(true);
  });

  it('respects custom absoluteUsdThreshold', () => {
    const chains = [makeChain('BSC', 4e9, 2, 200_000_000)]; // $200M change
    const defaultResult = detectNotableTvlMovements(chains);
    const customResult = detectNotableTvlMovements(chains, { absoluteUsdThreshold: 100_000_000 });

    expect(defaultResult).toHaveLength(0);
    expect(customResult.some((m) => m.chain === 'BSC' && m.trigger === 'absolute_threshold')).toBe(true);
  });

  it('respects custom topNForPercentThreshold', () => {
    const chains: ChainTvlEntry[] = [
      ...Array.from({ length: 3 }, (_, i) => makeChain(`Top${i}`, (3 - i) * 1e10, 2, 200_000_000)),
      // Rank 4, 15% change, but abs change = $500M → exactly at default abs threshold (exclusive)
      // Need abs change below $500M: TVL $3B, 15% = $450M < $500M
      makeChain('FourthChain', 3e9, 15, 450_000_000)
    ];
    const defaultResult = detectNotableTvlMovements(chains, { topNForPercentThreshold: 3 });
    const customResult = detectNotableTvlMovements(chains, { topNForPercentThreshold: 5 });

    expect(defaultResult.some((m) => m.chain === 'FourthChain' && m.trigger === 'percent_threshold')).toBe(false);
    expect(customResult.some((m) => m.chain === 'FourthChain' && m.trigger === 'percent_threshold')).toBe(true);
  });

  it('handles negative changes (losses) with absolute threshold', () => {
    const chains = [makeChain('Solana', 10e9, -12, -600_000_000)]; // large loss
    const result = detectNotableTvlMovements(chains);
    expect(result.some((m) => m.chain === 'Solana')).toBe(true);
  });

  it('preserves all ChainTvlEntry fields in output', () => {
    const chains: ChainTvlEntry[] = [makeChain('Ethereum', 50e9, 15, 7.5e9)];
    const result = detectNotableTvlMovements(chains);
    expect(result[0]).toMatchObject({
      chain: 'Ethereum',
      tvlUsd: 50e9,
      changePct24h: 15,
      changeUsd24h: 7.5e9,
      trigger: 'percent_threshold'
    });
  });

  it('percent threshold takes priority over absolute threshold when both would match', () => {
    const chains: ChainTvlEntry[] = [
      makeChain('Ethereum', 50e9, 15, 7.5e9), // both thresholds met — rank 1 (in top 10)
      ...Array.from({ length: 9 }, (_, i) => makeChain(`Other${i}`, (9 - i) * 1e9, 1, 1e7))
    ];
    const result = detectNotableTvlMovements(chains);
    const eth = result.find((m) => m.chain === 'Ethereum');
    expect(eth?.trigger).toBe('percent_threshold');
  });
});
