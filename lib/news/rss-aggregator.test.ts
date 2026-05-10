import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../cache/file-cache', () => ({ getCached: vi.fn() }));

import { getCached } from '../cache/file-cache';
import { fetchRecentNews, fetchRecentNewsWithFallback } from './rss-aggregator';

const mockGetCached = vi.mocked(getCached);

const NOW = new Date('2026-05-10T12:00:00.000Z');
const ONE_HOUR_AGO = '2026-05-10T11:00:00.000Z';
const TWO_HOURS_AGO = '2026-05-10T10:00:00.000Z';
const THIRTY_HOURS_AGO = '2026-05-09T06:00:00.000Z';

type RawItem = { headline: string; url: string; publishedAt: string; source: string };

const makeRaw = (headline: string, source: string, publishedAt = ONE_HOUR_AGO): RawItem => ({
  headline,
  url: `https://example.com/${headline.toLowerCase().replace(/\s+/g, '-')}`,
  publishedAt,
  source
});

const SIX_EMPTY_SOURCES: RawItem[][] = [[], [], [], [], [], []];

const setMockRaw = (rawBySource: RawItem[][]): void => {
  mockGetCached.mockImplementation(async (_key, _ttl, fetcher) => fetcher());
  // We need getCached to return what the fetcher returns.
  // But fetchRecentNews calls getCached with the actual fetch logic.
  // We mock getCached to bypass cache and call the fetcher directly.
  // However, the actual fetcher does real network calls. We need to mock differently.
  // We'll mock getCached to return the rawBySource array directly (simulating cached result).
  mockGetCached.mockResolvedValue(rawBySource);
};

describe('fetchRecentNews', () => {
  beforeEach(() => {
    mockGetCached.mockReset();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('calls getCached with key "rss-news-feeds" and 30-min TTL', async () => {
    mockGetCached.mockResolvedValue(SIX_EMPTY_SOURCES);
    await fetchRecentNews();
    expect(mockGetCached).toHaveBeenCalledWith('rss-news-feeds', 30 * 60 * 1000, expect.any(Function));
  });

  it('returns empty array when all feeds return empty', async () => {
    mockGetCached.mockResolvedValue(SIX_EMPTY_SOURCES);
    const result = await fetchRecentNews();
    expect(result).toEqual([]);
  });

  it('filters out items older than hoursBack', async () => {
    setMockRaw([
      [makeRaw('Recent item', 'CoinDesk', ONE_HOUR_AGO), makeRaw('Old item', 'CoinDesk', THIRTY_HOURS_AGO)],
      [], [], [], [], []
    ]);
    const result = await fetchRecentNews({ hoursBack: 24 });
    expect(result).toHaveLength(1);
    expect(result[0]!.headline).toBe('Recent item');
  });

  it('includes items within hoursBack window', async () => {
    setMockRaw([
      [makeRaw('Item at 2h ago', 'CoinDesk', TWO_HOURS_AGO)],
      [], [], [], [], []
    ]);
    const result = await fetchRecentNews({ hoursBack: 24 });
    expect(result).toHaveLength(1);
  });

  it('filters out items with empty headline', async () => {
    setMockRaw([
      [{ headline: '', url: 'https://example.com', publishedAt: ONE_HOUR_AGO, source: 'CoinDesk' }],
      [], [], [], [], []
    ]);
    const result = await fetchRecentNews();
    expect(result).toHaveLength(0);
  });

  it('filters out items with invalid publishedAt', async () => {
    setMockRaw([
      [{ headline: 'Test headline', url: 'https://example.com', publishedAt: 'not-a-date', source: 'CoinDesk' }],
      [], [], [], [], []
    ]);
    const result = await fetchRecentNews();
    expect(result).toHaveLength(0);
  });

  it('respects perSourceCap', async () => {
    const distinctHeadlines = [
      'Bitcoin price analysis market structure support resistance technical',
      'Ethereum validator rewards decrease after merge protocol changes',
      'Solana network congestion causes transaction delays users frustrated',
      'Cardano smart contract adoption rises institutional interest growing',
      'Polkadot parachain auctions conclude winner announced governance vote',
      'Avalanche gaming platform launches major partnership announced today',
      'Chainlink oracle network expands new blockchain integrations partnerships',
      'Dogecoin community votes governance proposal passes overwhelmingly',
      'XRP legal case resolution expected regulatory clarity market awaits',
      'BNB smart chain total value locked hits new record milestone',
      'Litecoin halving countdown market positioning traders accumulating positions',
      'MATIC polygon zkEVM launch mainnet upgrade successful validators confirm',
      'Near protocol developer activity surges grant program success stories',
      'Aptos blockchain throughput benchmark surpasses previous performance records',
      'Sui network daily active users growth trajectory impressive metrics',
      'Arbitrum governance proposal passed community treasury allocation voted',
      'Optimism retroactive public goods funding round winners announced today',
      'Cosmos inter blockchain communication protocol upgrade version released',
      'Algorand central bank digital currency pilot government partnership signed',
      'Hedera hashgraph enterprise adoption case study published quarterly report'
    ];
    const manyItems = distinctHeadlines.map((h) => makeRaw(h, 'CoinDesk', ONE_HOUR_AGO));
    setMockRaw([manyItems, [], [], [], [], []]);
    const result = await fetchRecentNews({ perSourceCap: 5, maxTotalItems: 100 });
    expect(result.length).toBeLessThanOrEqual(5);
  });

  it('respects maxTotalItems across all sources', async () => {
    const items1 = [
      makeRaw('Bitcoin ETF approval odds increase market analysts bullish outlook', 'CoinDesk', ONE_HOUR_AGO),
      makeRaw('Ethereum staking rate surpasses thirty percent of total supply', 'CoinDesk', ONE_HOUR_AGO),
      makeRaw('Solana mobile phone sales exceed expectations developer interest', 'CoinDesk', ONE_HOUR_AGO)
    ];
    const items2 = [
      makeRaw('Avalanche gaming ecosystem launches major title partnership deal', 'The Block', ONE_HOUR_AGO),
      makeRaw('Polygon zkEVM transaction fees drop significantly upgrade success', 'The Block', ONE_HOUR_AGO),
      makeRaw('Arbitrum treasury diversification vote passes community governance', 'The Block', ONE_HOUR_AGO)
    ];
    setMockRaw([items1, items2, [], [], [], []]);
    const result = await fetchRecentNews({ maxTotalItems: 3 });
    expect(result).toHaveLength(3);
  });

  it('deduplicates near-identical headlines from different sources', async () => {
    const headline = 'Bitcoin ETF inflows hit record high this week';
    setMockRaw([
      [makeRaw(headline, 'CoinDesk', ONE_HOUR_AGO)],
      [makeRaw(headline, 'The Block', ONE_HOUR_AGO)],
      [], [], [], []
    ]);
    const result = await fetchRecentNews({ maxTotalItems: 10 });
    expect(result).toHaveLength(1);
  });

  it('does NOT deduplicate distinct headlines', async () => {
    setMockRaw([
      [makeRaw('Bitcoin ETF inflows rise sharply this week', 'CoinDesk', ONE_HOUR_AGO)],
      [makeRaw('Ethereum upgrade completes successfully on mainnet', 'The Block', ONE_HOUR_AGO)],
      [], [], [], []
    ]);
    const result = await fetchRecentNews({ maxTotalItems: 10 });
    expect(result).toHaveLength(2);
  });

  it('scores cross-source coverage: 3+ sources → high', async () => {
    const headline = 'Major exchange collapses overnight amid liquidity crisis';
    setMockRaw([
      [makeRaw(headline, 'CoinDesk', ONE_HOUR_AGO)],
      [makeRaw(headline, 'The Block', ONE_HOUR_AGO)],
      [makeRaw(headline, 'Decrypt', ONE_HOUR_AGO)],
      [], [], []
    ]);
    const result = await fetchRecentNews({ maxTotalItems: 10 });
    expect(result.length).toBeGreaterThanOrEqual(1);
    expect(result[0]!.importance).toBe('high');
  });

  it('scores cross-source coverage: 2 sources → medium', async () => {
    const headline = 'Solana hits new all time high in daily transaction volume';
    setMockRaw([
      [makeRaw(headline, 'CoinDesk', ONE_HOUR_AGO)],
      [makeRaw(headline, 'The Block', ONE_HOUR_AGO)],
      [], [], [], []
    ]);
    const result = await fetchRecentNews({ maxTotalItems: 10 });
    expect(result.length).toBeGreaterThanOrEqual(1);
    expect(result[0]!.importance).toBe('medium');
  });

  it('scores single-source items as low importance', async () => {
    setMockRaw([
      [makeRaw('Some niche DeFi protocol launches new governance token', 'CoinDesk', ONE_HOUR_AGO)],
      [], [], [], [], []
    ]);
    const result = await fetchRecentNews({ maxTotalItems: 10 });
    expect(result).toHaveLength(1);
    expect(result[0]!.importance).toBe('low');
  });

  it('sorts by importance descending (high before medium before low)', async () => {
    const highHeadline = 'Federal Reserve signals crypto regulation framework landmark decision';
    const mediumHeadline = 'Polygon announces new zkEVM upgrade major network improvement protocol';
    const lowHeadline = 'Small altcoin launches new staking rewards program today';

    setMockRaw([
      [
        makeRaw(lowHeadline, 'CoinDesk', ONE_HOUR_AGO),
        makeRaw(highHeadline, 'CoinDesk', ONE_HOUR_AGO),
        makeRaw(mediumHeadline, 'CoinDesk', ONE_HOUR_AGO)
      ],
      [makeRaw(highHeadline, 'The Block', ONE_HOUR_AGO), makeRaw(highHeadline, 'Decrypt', ONE_HOUR_AGO), makeRaw(mediumHeadline, 'The Block', ONE_HOUR_AGO)],
      [], [], [], []
    ]);
    const result = await fetchRecentNews({ maxTotalItems: 10 });
    const importances = result.map((r) => r.importance);
    const highIdx = importances.indexOf('high');
    const medIdx = importances.indexOf('medium');
    const lowIdx = importances.indexOf('low');
    if (highIdx !== -1 && medIdx !== -1) expect(highIdx).toBeLessThan(medIdx);
    if (medIdx !== -1 && lowIdx !== -1) expect(medIdx).toBeLessThan(lowIdx);
  });

  it('output NewsItems have required fields', async () => {
    setMockRaw([
      [makeRaw('BTC breaks 100k as ETF inflows surge past records', 'CoinDesk', ONE_HOUR_AGO)],
      [], [], [], [], []
    ]);
    const result = await fetchRecentNews();
    expect(result[0]).toMatchObject({
      headline: expect.any(String),
      url: expect.any(String),
      source: expect.any(String),
      publishedAt: expect.any(String),
      importance: expect.stringMatching(/^high|medium|low$/)
    });
  });
});

describe('fetchRecentNewsWithFallback', () => {
  beforeEach(() => {
    mockGetCached.mockReset();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns news items on success', async () => {
    mockGetCached.mockResolvedValue([
      [makeRaw('Good news from crypto world today', 'CoinDesk', ONE_HOUR_AGO)],
      [], [], [], [], []
    ]);
    const result = await fetchRecentNewsWithFallback({ hoursBack: 24, maxTotalItems: 10 });
    expect(result).toHaveLength(1);
  });

  it('returns empty array on total failure (getCached throws)', async () => {
    mockGetCached.mockRejectedValue(new Error('Network failure'));
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const result = await fetchRecentNewsWithFallback();
    expect(result).toEqual([]);
    consoleSpy.mockRestore();
  });

  it('does not throw on total failure', async () => {
    mockGetCached.mockRejectedValue(new Error('total failure'));
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    await expect(fetchRecentNewsWithFallback()).resolves.toEqual([]);
    consoleSpy.mockRestore();
  });

  it('passes options through to fetchRecentNews', async () => {
    const items = [
      makeRaw('Bitcoin ETF sees record inflows from institutional investors', 'CoinDesk', ONE_HOUR_AGO),
      makeRaw('Ethereum layer two adoption grows dramatically across DeFi protocols', 'CoinDesk', ONE_HOUR_AGO),
      makeRaw('Solana validator count reaches new milestone this quarter', 'CoinDesk', ONE_HOUR_AGO)
    ];
    mockGetCached.mockResolvedValue([items, [], [], [], [], []]);
    const result = await fetchRecentNewsWithFallback({ maxTotalItems: 2 });
    expect(result).toHaveLength(2);
  });
});
