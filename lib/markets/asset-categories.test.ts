import { describe, expect, it } from 'vitest';

import {
  EXCLUDED_FROM_MOVERS,
  STABLECOIN_SYMBOLS,
  WRAPPED_DERIVATIVE_SYMBOLS,
  isExcludedFromMovers,
  isStablecoin,
  isWrappedOrDerivative
} from './asset-categories';

describe('STABLECOIN_SYMBOLS', () => {
  it('contains core stablecoins', () => {
    expect(STABLECOIN_SYMBOLS.has('USDT')).toBe(true);
    expect(STABLECOIN_SYMBOLS.has('USDC')).toBe(true);
    expect(STABLECOIN_SYMBOLS.has('DAI')).toBe(true);
    expect(STABLECOIN_SYMBOLS.has('BUSD')).toBe(true);
  });

  it('does not contain non-stablecoins', () => {
    expect(STABLECOIN_SYMBOLS.has('BTC')).toBe(false);
    expect(STABLECOIN_SYMBOLS.has('ETH')).toBe(false);
    expect(STABLECOIN_SYMBOLS.has('SOL')).toBe(false);
  });
});

describe('WRAPPED_DERIVATIVE_SYMBOLS', () => {
  it('contains core wrapped/derivative tokens', () => {
    expect(WRAPPED_DERIVATIVE_SYMBOLS.has('WBTC')).toBe(true);
    expect(WRAPPED_DERIVATIVE_SYMBOLS.has('WETH')).toBe(true);
    expect(WRAPPED_DERIVATIVE_SYMBOLS.has('STETH')).toBe(true);
    expect(WRAPPED_DERIVATIVE_SYMBOLS.has('WSTETH')).toBe(true);
  });

  it('does not contain native assets', () => {
    expect(WRAPPED_DERIVATIVE_SYMBOLS.has('BTC')).toBe(false);
    expect(WRAPPED_DERIVATIVE_SYMBOLS.has('ETH')).toBe(false);
    expect(WRAPPED_DERIVATIVE_SYMBOLS.has('USDT')).toBe(false);
  });
});

describe('EXCLUDED_FROM_MOVERS', () => {
  it('is the union of stablecoin and wrapped/derivative sets', () => {
    for (const symbol of STABLECOIN_SYMBOLS) {
      expect(EXCLUDED_FROM_MOVERS.has(symbol)).toBe(true);
    }
    for (const symbol of WRAPPED_DERIVATIVE_SYMBOLS) {
      expect(EXCLUDED_FROM_MOVERS.has(symbol)).toBe(true);
    }
  });

  it('does not contain native assets', () => {
    expect(EXCLUDED_FROM_MOVERS.has('BTC')).toBe(false);
    expect(EXCLUDED_FROM_MOVERS.has('ETH')).toBe(false);
    expect(EXCLUDED_FROM_MOVERS.has('SOL')).toBe(false);
  });

  it('size equals union of both sets', () => {
    const union = new Set([...STABLECOIN_SYMBOLS, ...WRAPPED_DERIVATIVE_SYMBOLS]);
    expect(EXCLUDED_FROM_MOVERS.size).toBe(union.size);
  });
});

describe('isStablecoin', () => {
  it('returns true for known stablecoins', () => {
    expect(isStablecoin('USDT')).toBe(true);
    expect(isStablecoin('USDC')).toBe(true);
    expect(isStablecoin('DAI')).toBe(true);
    expect(isStablecoin('FRAX')).toBe(true);
    expect(isStablecoin('PYUSD')).toBe(true);
  });

  it('returns false for non-stablecoins', () => {
    expect(isStablecoin('BTC')).toBe(false);
    expect(isStablecoin('ETH')).toBe(false);
    expect(isStablecoin('SOL')).toBe(false);
    expect(isStablecoin('WBTC')).toBe(false);
  });

  it('normalizes input to uppercase', () => {
    expect(isStablecoin('usdt')).toBe(true);
    expect(isStablecoin('Usdc')).toBe(true);
    expect(isStablecoin('dai')).toBe(true);
  });
});

describe('isWrappedOrDerivative', () => {
  it('returns true for known wrapped/derivative tokens', () => {
    expect(isWrappedOrDerivative('WBTC')).toBe(true);
    expect(isWrappedOrDerivative('WETH')).toBe(true);
    expect(isWrappedOrDerivative('STETH')).toBe(true);
    expect(isWrappedOrDerivative('CBETH')).toBe(true);
    expect(isWrappedOrDerivative('RETH')).toBe(true);
  });

  it('returns false for non-wrapped assets', () => {
    expect(isWrappedOrDerivative('BTC')).toBe(false);
    expect(isWrappedOrDerivative('ETH')).toBe(false);
    expect(isWrappedOrDerivative('USDT')).toBe(false);
  });

  it('normalizes input to uppercase', () => {
    expect(isWrappedOrDerivative('wbtc')).toBe(true);
    expect(isWrappedOrDerivative('Weth')).toBe(true);
    expect(isWrappedOrDerivative('steth')).toBe(true);
  });
});

describe('isExcludedFromMovers', () => {
  it('returns true for stablecoins', () => {
    expect(isExcludedFromMovers('USDT')).toBe(true);
    expect(isExcludedFromMovers('USDC')).toBe(true);
  });

  it('returns true for wrapped/derivative tokens', () => {
    expect(isExcludedFromMovers('WBTC')).toBe(true);
    expect(isExcludedFromMovers('STETH')).toBe(true);
  });

  it('returns false for native assets', () => {
    expect(isExcludedFromMovers('BTC')).toBe(false);
    expect(isExcludedFromMovers('ETH')).toBe(false);
    expect(isExcludedFromMovers('SOL')).toBe(false);
    expect(isExcludedFromMovers('BNB')).toBe(false);
    expect(isExcludedFromMovers('XRP')).toBe(false);
  });

  it('normalizes input to uppercase', () => {
    expect(isExcludedFromMovers('usdt')).toBe(true);
    expect(isExcludedFromMovers('wbtc')).toBe(true);
    expect(isExcludedFromMovers('btc')).toBe(false);
  });
});
