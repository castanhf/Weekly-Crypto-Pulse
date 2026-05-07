/**
 * Shared stablecoin and wrapped/derivative token registry.
 *
 * This list requires periodic maintenance.
 *
 * As new stablecoins and wrapped/derivative tokens enter the top 50 by market
 * cap, they need to be added here. Review at minimum quarterly.
 *
 * Last reviewed: 2026-05-07
 *
 * Detection criteria:
 * - Stablecoin: 7-day price change <0.5% by design, fiat-pegged
 * - Wrapped/derivative: price correlation >99% with another top-15 asset
 *
 * Automated detection (e.g., via CoinGecko categories) was considered and
 * rejected for now — adds an API call and failure mode for marginal precision.
 * Revisit if the manual list becomes hard to maintain.
 *
 * DRIFT TRACKING: This module is the canonical source for both the daily
 * researcher (scripts/generate-daily-input.ts) and the weekly Market Researcher
 * (scripts/generate-report-input.ts). Changes here apply to both pipelines.
 */

// Stablecoins: assets pegged to fiat (USD primarily) where 24h price change is near-zero by design
export const STABLECOIN_SYMBOLS: ReadonlySet<string> = new Set([
  'USDT', 'USDC', 'DAI', 'BUSD', 'FDUSD', 'TUSD', 'USDE', 'USDS',
  'PYUSD', 'EURC', 'GUSD', 'USDP', 'FRAX', 'LUSD', 'SUSD', 'CUSD',
  'USDJ', 'USDD', 'CRVUSD', 'GYEN', 'EURT', 'EUROC', 'EURS', 'AGEUR'
]);

// Wrapped/derivative tokens: assets whose price tracks another top-15 asset at >99% correlation
export const WRAPPED_DERIVATIVE_SYMBOLS: ReadonlySet<string> = new Set([
  'WBTC', 'WETH', 'STETH', 'WSTETH', 'CBETH', 'RETH', 'SWETH', 'METH',
  'FRXETH', 'SFRXETH', 'EZETH', 'PUFETH', 'WEETH', 'OSETH', 'OETH',
  'RSETH', 'ETHX', 'LSETH', 'ANKRETH', 'BETH', 'HETH', 'TBTC', 'RENBTC'
]);

// Combined: assets that should be excluded from "what moved" prose narration
export const EXCLUDED_FROM_MOVERS: ReadonlySet<string> = new Set([
  ...STABLECOIN_SYMBOLS,
  ...WRAPPED_DERIVATIVE_SYMBOLS
]);

export function isStablecoin(symbol: string): boolean {
  return STABLECOIN_SYMBOLS.has(symbol.toUpperCase());
}

export function isWrappedOrDerivative(symbol: string): boolean {
  return WRAPPED_DERIVATIVE_SYMBOLS.has(symbol.toUpperCase());
}

export function isExcludedFromMovers(symbol: string): boolean {
  return EXCLUDED_FROM_MOVERS.has(symbol.toUpperCase());
}
