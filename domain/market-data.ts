export type AssetId = 'bitcoin' | 'ethereum' | 'solana';

// ---------------------------------------------------------------------------
// DeFiLlama TVL types — canonical source, imported by lib/markets/defi-llama.ts
// and domain/report.ts. Dependency direction: lib/ → domain/ (never reversed).
// ---------------------------------------------------------------------------

export type ChainTvlEntry = Readonly<{
  chain: string;
  tvlUsd: number;
  changePct24h: number;
  changeUsd24h: number;
}>;

export type NotableTvlMovement = Readonly<
  ChainTvlEntry & {
    trigger: 'percent_threshold' | 'absolute_threshold';
  }
>;

export type CapitalFlows = Readonly<{
  topChainsTvl: ReadonlyArray<ChainTvlEntry>;
  notableMovements: ReadonlyArray<NotableTvlMovement>;
}>;

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
