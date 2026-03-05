import { describe, expect, it } from 'vitest';

import type { MarketDataSnapshot } from '@/domain/market-data';
import { MarketDataIngestionError } from '@/lib/market-data/errors';
import { BatchMarketDataIngestion } from '@/lib/market-data/market-data-ingestion';
import type { MarketDataProvider } from '@/lib/market-data/provider';

const buildSnapshot = (): MarketDataSnapshot => ({
  provider: 'stub',
  currency: 'usd',
  capturedAt: '2026-03-01T00:00:00.000Z',
  assets: []
});

describe('BatchMarketDataIngestion', () => {
  it('throws typed error for empty input', async () => {
    const provider: MarketDataProvider = {
      fetchSnapshot: async () => buildSnapshot()
    };

    const ingestion = new BatchMarketDataIngestion(provider);

    await expect(ingestion.ingest({ assetIds: [] })).rejects.toBeInstanceOf(MarketDataIngestionError);
  });

  it('wraps provider failures into ingestion error', async () => {
    const provider: MarketDataProvider = {
      fetchSnapshot: async () => {
        throw new Error('provider failure');
      }
    };

    const ingestion = new BatchMarketDataIngestion(provider);

    await expect(ingestion.ingest()).rejects.toBeInstanceOf(MarketDataIngestionError);
  });
});
