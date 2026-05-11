import { describe, expect, it } from 'vitest';

import { CHART_COLORS, getChartFallbackKind, toMarketCapTrillion } from './SnapshotTrendChart';

describe('toMarketCapTrillion', () => {
  it('converts USD value to trillions', () => {
    expect(toMarketCapTrillion(2_000_000_000_000)).toBeCloseTo(2.0);
    expect(toMarketCapTrillion(3_500_000_000_000)).toBeCloseTo(3.5);
    expect(toMarketCapTrillion(0)).toBe(0);
  });
});

describe('getChartFallbackKind', () => {
  it('returns "empty" when data length is 0', () => {
    expect(getChartFallbackKind(0)).toBe('empty');
  });

  it('returns "short" for 1, 2, or 3 data points', () => {
    expect(getChartFallbackKind(1)).toBe('short');
    expect(getChartFallbackKind(2)).toBe('short');
    expect(getChartFallbackKind(3)).toBe('short');
  });

  it('returns "full" for 4 or more data points', () => {
    expect(getChartFallbackKind(4)).toBe('full');
    expect(getChartFallbackKind(12)).toBe('full');
    expect(getChartFallbackKind(100)).toBe('full');
  });
});

describe('CHART_COLORS', () => {
  it('has a color for each chart line', () => {
    expect(CHART_COLORS.marketCap).toMatch(/^#[0-9a-fA-F]{6}$/);
    expect(CHART_COLORS.btcDom).toMatch(/^#[0-9a-fA-F]{6}$/);
    expect(CHART_COLORS.ethDom).toMatch(/^#[0-9a-fA-F]{6}$/);
    expect(CHART_COLORS.fearGreed).toMatch(/^#[0-9a-fA-F]{6}$/);
  });

  it('has four distinct colors', () => {
    const colors = Object.values(CHART_COLORS);
    const unique = new Set(colors);
    expect(unique.size).toBe(colors.length);
  });
});
