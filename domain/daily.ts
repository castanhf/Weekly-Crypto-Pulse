import type { SchemaVersion } from './schema-version';

export type MoverEntry = Readonly<{
  symbol: string;
  name: string;
  changePct24h: number;
  catalyst: string;
}>;

/** Always-tracked top-15 assets. Stablecoins appear here for snapshot context
 *  but are excluded from winners/losers narration. */
export type TrackedAssetEntry = Readonly<{
  symbol: string;
  name: string;
  priceUsd: number;
  changePct24h: number;
  marketCapUsd: number;
  isStablecoin: boolean;
}>;

export type DailyArtifact = Readonly<{
  schemaVersion: SchemaVersion;
  generatedAt: string;
  publishedAt: string;
  slug: string;
  headline: string;
  /** 60-second read: 2–3 sentences. */
  summary: string;
  whatMoved: Readonly<{
    winners: ReadonlyArray<MoverEntry>;
    losers: ReadonlyArray<MoverEntry>;
    /** Top-15 tracked assets including stablecoins. */
    topTracked: ReadonlyArray<TrackedAssetEntry>;
  }>;
  /** Plainspoken prose, 200–300 words, main driver of the day. */
  whyItMoved: string;
  /** Bulleted notes. Max 4 items; empty array on quiet days. */
  worthKnowing: ReadonlyArray<string>;
  snapshot: Readonly<{
    totalMarketCapUsd: number;
    btcDominancePct: number;
    ethDominancePct: number;
    fearGreedIndex: number;
  }>;
  tags: ReadonlyArray<string>;
}>;
