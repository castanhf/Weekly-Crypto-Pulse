import { describe, expect, it } from 'vitest';

import { CoinGeckoMarketDataProvider } from '@/lib/market-data/coingecko-market-data-provider';
import { MarketDataProviderResponseError } from '@/lib/market-data/errors';

describe('CoinGeckoMarketDataProvider', () => {
  it('maps provider response into internal snapshot model', async () => {
    const fetchMock = async (): Promise<Response> =>
      new Response(
        JSON.stringify({
          bitcoin: {
            usd: 65000,
            usd_market_cap: 1200000000,
            usd_24h_vol: 50000000,
            usd_24h_change: 1.2
          }
        }),
        { status: 200 }
      );

    const provider = new CoinGeckoMarketDataProvider(fetchMock);

    const snapshot = await provider.fetchSnapshot({
      assetIds: ['bitcoin'],
      currency: 'usd'
    });

    expect(snapshot.provider).toBe('coingecko');
    expect(snapshot.currency).toBe('usd');
    expect(snapshot.assets).toEqual([
      {
        assetId: 'bitcoin',
        price: 65000,
        marketCap: 1200000000,
        volume24h: 50000000,
        change24hPercent: 1.2
      }
    ]);
  });

  it('throws a typed error when payload is missing required fields', async () => {
    const fetchMock = async (): Promise<Response> =>
      new Response(
        JSON.stringify({
          bitcoin: {
            usd: 65000
          }
        }),
        { status: 200 }
      );

    const provider = new CoinGeckoMarketDataProvider(fetchMock);

    await expect(
      provider.fetchSnapshot({
        assetIds: ['bitcoin'],
        currency: 'usd'
      })
    ).rejects.toBeInstanceOf(MarketDataProviderResponseError);
  });
});
