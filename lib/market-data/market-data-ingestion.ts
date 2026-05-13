import type { AssetId, MarketDataSnapshot } from '../../domain/market-data';
import { MarketDataIngestionError } from './errors';
import type { MarketDataProvider } from './provider';

const DEFAULT_ASSET_IDS: ReadonlyArray<AssetId> = ['bitcoin', 'ethereum', 'solana'];

export interface IngestMarketDataOptions {
  readonly assetIds?: ReadonlyArray<AssetId>;
}

export class BatchMarketDataIngestion {
  private readonly provider: MarketDataProvider;

  public constructor(provider: MarketDataProvider) {
    this.provider = provider;
  }

  public async ingest(options: IngestMarketDataOptions = {}): Promise<MarketDataSnapshot> {
    const assetIds = options.assetIds ?? DEFAULT_ASSET_IDS;

    if (assetIds.length === 0) {
      throw new MarketDataIngestionError('Invalid ingestion input: at least one asset id is required.');
    }

    try {
      return await this.provider.fetchSnapshot({
        assetIds,
        currency: 'usd'
      });
    } catch (error: unknown) {
      throw new MarketDataIngestionError('Market data ingestion failed.', { cause: error });
    }
  }
}
