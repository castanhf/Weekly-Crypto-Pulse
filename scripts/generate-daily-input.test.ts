import { describe, expect, it, vi, beforeEach } from 'vitest';

vi.mock('../lib/llm/client', () => ({ callLlm: vi.fn() }));
vi.mock('../lib/cache/file-cache', () => ({ getCached: vi.fn() }));
vi.mock('node:fs/promises', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:fs/promises')>();
  return {
    ...actual,
    mkdir: vi.fn().mockResolvedValue(undefined),
    readdir: vi.fn().mockResolvedValue([]),
    readFile: vi.fn().mockRejectedValue({ code: 'ENOENT' }),
    writeFile: vi.fn().mockResolvedValue(undefined)
  };
});

import { callLlm } from '../lib/llm/client';
import { getCached } from '../lib/cache/file-cache';
import * as fs from 'node:fs/promises';
import { generateDailyInput } from './generate-daily-input';

const mockedCallLlm = vi.mocked(callLlm);
const mockedGetCached = vi.mocked(getCached);

const TARGET_DATE = '2026-05-07';

const makeMarketEntry = (rank: number, symbol: string, name: string, price: number, change24h: number, marketCap: number) => ({
  id: symbol.toLowerCase(),
  symbol: symbol.toLowerCase(),
  name,
  current_price: price,
  price_change_percentage_24h_in_currency: change24h,
  market_cap: marketCap,
  market_cap_rank: rank
});

const MOCK_TOP50 = [
  makeMarketEntry(1, 'BTC', 'Bitcoin', 95000, 2.1, 1_880_000_000_000),
  makeMarketEntry(2, 'ETH', 'Ethereum', 3500, 1.8, 420_000_000_000),
  makeMarketEntry(3, 'USDT', 'Tether', 1.0, 0.01, 110_000_000_000),
  makeMarketEntry(4, 'BNB', 'BNB', 600, -0.5, 85_000_000_000),
  makeMarketEntry(5, 'SOL', 'Solana', 180, 3.2, 82_000_000_000),
  makeMarketEntry(6, 'USDC', 'USD Coin', 1.0, 0.0, 45_000_000_000),
  makeMarketEntry(7, 'XRP', 'XRP', 2.5, -1.2, 140_000_000_000),
  makeMarketEntry(8, 'DOGE', 'Dogecoin', 0.35, 1.5, 51_000_000_000),
  makeMarketEntry(9, 'ADA', 'Cardano', 0.65, -0.8, 23_000_000_000),
  makeMarketEntry(10, 'TRX', 'TRON', 0.24, 0.3, 21_000_000_000),
  makeMarketEntry(11, 'AVAX', 'Avalanche', 35, 2.1, 14_000_000_000),
  makeMarketEntry(12, 'SHIB', 'Shiba Inu', 0.000025, 0.9, 14_500_000_000),
  makeMarketEntry(13, 'LINK', 'Chainlink', 16, 1.4, 9_800_000_000),
  makeMarketEntry(14, 'DOT', 'Polkadot', 8.5, -0.3, 11_000_000_000),
  makeMarketEntry(15, 'WBTC', 'Wrapped Bitcoin', 94900, 2.09, 12_000_000_000),
  // Rank 16-50 movers
  makeMarketEntry(20, 'SUI', 'Sui', 4.2, 8.5, 3_000_000_000),
  makeMarketEntry(25, 'INJ', 'Injective', 25, -6.2, 2_200_000_000),
  ...Array.from({ length: 33 }, (_, i) =>
    makeMarketEntry(17 + i, `TOK${i}`, `Token${i}`, 1, 0, 1_000_000_000)
  ).filter((_, i) => i !== 3 && i !== 8)
];

const MOCK_GLOBAL = {
  data: {
    total_market_cap: { usd: 3_200_000_000_000 },
    market_cap_percentage: { btc: 58.7, eth: 13.1 }
  }
};

const MOCK_FEAR_GREED = {
  data: [{ value: '72', value_classification: 'Greed' }]
};

const MOCK_CHAINS: Array<{ name: string; tvl: number; change_1d: number | null }> = [];

const MOCK_LLM_RESPONSE = {
  content: JSON.stringify({
    catalysts: {
      SUI: 'Sui network saw increased activity following a major DEX protocol launch.',
      INJ: null
    },
    newsItems: [
      {
        headline: 'Bitcoin ETF sees record inflows this week',
        source: 'CoinDesk',
        summary: 'Bitcoin spot ETFs attracted significant institutional capital.',
        relevance: 'high'
      }
    ]
  }),
  provider: 'github-models' as const,
  model: 'gpt-4o-mini' as const,
  usage: { inputTokens: 500, outputTokens: 200 },
  rawResponse: {}
};

describe('generateDailyInput', () => {
  beforeEach(() => {
    vi.mocked(fs.mkdir).mockResolvedValue(undefined);
    vi.mocked(fs.readdir).mockResolvedValue([]);
    vi.mocked(fs.readFile).mockRejectedValue({ code: 'ENOENT' });
    vi.mocked(fs.writeFile).mockResolvedValue(undefined);

    mockedGetCached.mockImplementation(async (_key, _ttl, fetcher) => fetcher());
    mockedCallLlm.mockResolvedValue(MOCK_LLM_RESPONSE);
  });

  it('produces correctly shaped output for a normal day', async () => {
    mockedGetCached.mockImplementation(async (key, _ttl, fetcher) => {
      if (key === 'coingecko-markets-top50') return MOCK_TOP50;
      if (key === 'coingecko-global') return MOCK_GLOBAL;
      if (key === 'fear-greed') return MOCK_FEAR_GREED;
      if (key === 'defillama-chains') return MOCK_CHAINS;
      return fetcher();
    });

    let writtenJson: string | undefined;
    vi.mocked(fs.writeFile).mockImplementation(async (_path, content) => {
      writtenJson = content as string;
    });

    await generateDailyInput(TARGET_DATE);

    expect(writtenJson).toBeDefined();
    const output = JSON.parse(writtenJson!) as {
      targetDate: string;
      topTracked: Array<{ symbol: string; isStablecoin: boolean; isWrappedOrDerivative: boolean }>;
      movers: { winners: Array<{ changePct24h: number }>; losers: Array<{ changePct24h: number }> };
      marketSnapshot: { fearGreedIndex: number };
    };

    expect(output.targetDate).toBe(TARGET_DATE);
    expect(output.topTracked).toHaveLength(15);
    expect(output.marketSnapshot.fearGreedIndex).toBe(72);
  });

  it('correctly flags USDT as stablecoin and WBTC as wrapped/derivative', async () => {
    mockedGetCached.mockImplementation(async (key, _ttl, fetcher) => {
      if (key === 'coingecko-markets-top50') return MOCK_TOP50;
      if (key === 'coingecko-global') return MOCK_GLOBAL;
      if (key === 'fear-greed') return MOCK_FEAR_GREED;
      if (key === 'defillama-chains') return MOCK_CHAINS;
      return fetcher();
    });

    let writtenJson: string | undefined;
    vi.mocked(fs.writeFile).mockImplementation(async (_path, content) => {
      writtenJson = content as string;
    });

    await generateDailyInput(TARGET_DATE);

    const output = JSON.parse(writtenJson!) as {
      topTracked: Array<{ symbol: string; isStablecoin: boolean; isWrappedOrDerivative: boolean }>;
    };

    const usdt = output.topTracked.find((a) => a.symbol === 'USDT');
    const usdc = output.topTracked.find((a) => a.symbol === 'USDC');
    const wbtc = output.topTracked.find((a) => a.symbol === 'WBTC');
    const btc = output.topTracked.find((a) => a.symbol === 'BTC');

    expect(usdt?.isStablecoin).toBe(true);
    expect(usdc?.isStablecoin).toBe(true);
    expect(wbtc?.isWrappedOrDerivative).toBe(true);
    expect(btc?.isStablecoin).toBe(false);
    expect(btc?.isWrappedOrDerivative).toBe(false);
  });

  it('handles quiet day with no movers meeting threshold', async () => {
    const quietMarkets = MOCK_TOP50.map((m) => ({
      ...m,
      price_change_percentage_24h_in_currency: m.market_cap_rank <= 15 ? m.price_change_percentage_24h_in_currency : 1.0
    }));

    mockedGetCached.mockImplementation(async (key, _ttl, fetcher) => {
      if (key === 'coingecko-markets-top50') return quietMarkets;
      if (key === 'coingecko-global') return MOCK_GLOBAL;
      if (key === 'fear-greed') return MOCK_FEAR_GREED;
      if (key === 'defillama-chains') return MOCK_CHAINS;
      return fetcher();
    });

    let writtenJson: string | undefined;
    vi.mocked(fs.writeFile).mockImplementation(async (_path, content) => {
      writtenJson = content as string;
    });

    await generateDailyInput(TARGET_DATE);

    const output = JSON.parse(writtenJson!) as {
      movers: { winners: unknown[]; losers: unknown[] };
    };

    expect(output.movers.winners).toHaveLength(0);
    expect(output.movers.losers).toHaveLength(0);
  });

  it('writes failure sentinel and throws on critical source failure', async () => {
    mockedGetCached.mockImplementation(async (key, _ttl, fetcher) => {
      if (key === 'coingecko-markets-top50') throw new Error('CoinGecko down');
      if (key === 'coingecko-global') throw new Error('CoinGecko down');
      return fetcher();
    });

    const writeFileSpy = vi.mocked(fs.writeFile);

    await expect(generateDailyInput(TARGET_DATE)).rejects.toThrow();

    // Failure sentinel should have been written
    const sentinelCall = writeFileSpy.mock.calls.find(
      ([filePath]) => typeof filePath === 'string' && filePath.includes(`.failure-${TARGET_DATE}`)
    );
    expect(sentinelCall).toBeDefined();
  });
});
