export type AssetId = 'bitcoin' | 'ethereum' | 'solana';

export type FiatCurrency = 'usd';

export interface MarketAssetSnapshot {
  readonly assetId: AssetId;
  readonly price: number;
  readonly marketCap: number;
  readonly volume24h: number;
  readonly change24hPercent: number;
}

export interface MarketDataSnapshot {
  readonly provider: string;
  readonly currency: FiatCurrency;
  readonly capturedAt: string;
  readonly assets: ReadonlyArray<MarketAssetSnapshot>;
}
