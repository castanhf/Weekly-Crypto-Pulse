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

/** daily@1.1 additive field — proper footer link replacing the worthKnowing[3] hack. */
export type WeeklyFooter = Readonly<{
  /** Display text, e.g. "For deeper context, see this week's Crypto Pulse" */
  text: string;
  /** Slug of the most recent weekly artifact, used to build the URL at render time. */
  weeklySlug: string;
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
  /** daily@1.1 additive field. Present on v1.1+ artifacts; absent on v1.0. */
  weeklyFooter?: WeeklyFooter;
}>;
