import type { AssetId, FiatCurrency, MarketDataSnapshot } from '@/domain/market-data';

export interface MarketDataProviderRequest {
  readonly assetIds: ReadonlyArray<AssetId>;
  readonly currency: FiatCurrency;
}

export interface MarketDataProvider {
  fetchSnapshot(request: MarketDataProviderRequest): Promise<MarketDataSnapshot>;
}
