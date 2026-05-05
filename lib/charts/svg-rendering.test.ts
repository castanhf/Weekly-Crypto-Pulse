import { describe, expect, it } from 'vitest';

import type { RegimeHistoryPoint, SnapshotTrendPoint } from './window';
import { renderRegimeHistorySvg, renderSnapshotTrendSvg } from './svg-rendering';

const makeSnapshotPoint = (publishedAt: string, offset = 0): SnapshotTrendPoint => ({
  publishedAt,
  weekLabel: 'Apr 14',
  totalMarketCapUsd: 2_000_000_000_000 + offset * 1e9,
  btcDominancePct: 52 + offset * 0.1,
  ethDominancePct: 16 + offset * 0.05,
  fearGreedIndex: 55 + offset
});

const makeRegimePoint = (publishedAt: string, regime: RegimeHistoryPoint['regime']): RegimeHistoryPoint => ({
  publishedAt,
  weekLabel: 'Apr 14',
  regime
});

const TWELVE_SNAPSHOT_POINTS = Array.from({ length: 12 }, (_, i) =>
  makeSnapshotPoint(`2026-0${Math.floor(i / 4) + 1}-${String((i % 4) * 7 + 1).padStart(2, '0')}`, i)
);

const TWELVE_REGIME_POINTS: RegimeHistoryPoint[] = [
  makeRegimePoint('2026-01-01', 'risk-on'),
  makeRegimePoint('2026-01-08', 'risk-on'),
  makeRegimePoint('2026-01-15', 'range-bound'),
  makeRegimePoint('2026-01-22', 'risk-off'),
  makeRegimePoint('2026-01-29', 'transition'),
  makeRegimePoint('2026-02-05', 'risk-on'),
  makeRegimePoint('2026-02-12', 'risk-on'),
  makeRegimePoint('2026-02-19', 'range-bound'),
  makeRegimePoint('2026-02-26', 'risk-off'),
  makeRegimePoint('2026-03-05', 'transition'),
  makeRegimePoint('2026-03-12', 'risk-on'),
  makeRegimePoint('2026-03-19', 'range-bound')
];

describe('renderSnapshotTrendSvg', () => {
  it('returns a string starting with <svg', () => {
    const result = renderSnapshotTrendSvg({ data: TWELVE_SNAPSHOT_POINTS });
    expect(result.startsWith('<svg')).toBe(true);
  });

  it('includes the correct viewBox for default dimensions', () => {
    const result = renderSnapshotTrendSvg({ data: TWELVE_SNAPSHOT_POINTS });
    expect(result).toContain('viewBox="0 0 800 400"');
    expect(result).toContain('width="800"');
    expect(result).toContain('height="400"');
  });

  it('respects custom width and height', () => {
    const result = renderSnapshotTrendSvg({ data: TWELVE_SNAPSHOT_POINTS, width: 1000, height: 500 });
    expect(result).toContain('viewBox="0 0 1000 500"');
    expect(result).toContain('width="1000"');
    expect(result).toContain('height="500"');
  });

  it('contains four polylines for the four data series', () => {
    const result = renderSnapshotTrendSvg({ data: TWELVE_SNAPSHOT_POINTS });
    const polylineCount = (result.match(/<polyline/g) ?? []).length;
    expect(polylineCount).toBe(4);
  });

  it('includes axis labels in the output', () => {
    const result = renderSnapshotTrendSvg({ data: TWELVE_SNAPSHOT_POINTS });
    expect(result).toContain('Market Cap');
    expect(result).toContain('% / Index');
  });

  it('includes the title', () => {
    const result = renderSnapshotTrendSvg({ data: TWELVE_SNAPSHOT_POINTS });
    expect(result).toContain('Market snapshot');
  });

  it('uses a custom title when provided', () => {
    const result = renderSnapshotTrendSvg({ data: TWELVE_SNAPSHOT_POINTS, title: 'My custom title' });
    expect(result).toContain('My custom title');
  });

  it('handles empty data gracefully with a no-data message', () => {
    const result = renderSnapshotTrendSvg({ data: [] });
    expect(result.startsWith('<svg')).toBe(true);
    expect(result).toContain('No data available');
    expect(result).not.toContain('<polyline');
  });

  it('handles data shorter than 12 points without throwing', () => {
    const result = renderSnapshotTrendSvg({ data: TWELVE_SNAPSHOT_POINTS.slice(0, 3) });
    expect(result.startsWith('<svg')).toBe(true);
    const polylineCount = (result.match(/<polyline/g) ?? []).length;
    expect(polylineCount).toBe(4);
  });

  it('is deterministic for identical input', () => {
    const a = renderSnapshotTrendSvg({ data: TWELVE_SNAPSHOT_POINTS });
    const b = renderSnapshotTrendSvg({ data: TWELVE_SNAPSHOT_POINTS });
    expect(a).toBe(b);
  });

  it('closes the SVG element', () => {
    const result = renderSnapshotTrendSvg({ data: TWELVE_SNAPSHOT_POINTS });
    expect(result.endsWith('</svg>')).toBe(true);
  });
});

describe('renderRegimeHistorySvg', () => {
  it('returns a string starting with <svg', () => {
    const result = renderRegimeHistorySvg({ data: TWELVE_REGIME_POINTS });
    expect(result.startsWith('<svg')).toBe(true);
  });

  it('includes the correct viewBox for default dimensions', () => {
    const result = renderRegimeHistorySvg({ data: TWELVE_REGIME_POINTS });
    expect(result).toContain('viewBox="0 0 800 200"');
    expect(result).toContain('width="800"');
    expect(result).toContain('height="200"');
  });

  it('contains one rect per data point (plus background and legend)', () => {
    const result = renderRegimeHistorySvg({ data: TWELVE_REGIME_POINTS });
    const rectCount = (result.match(/<rect/g) ?? []).length;
    expect(rectCount).toBe(17); // 1 background + 12 cells + 4 legend swatches
  });

  it('uses green fill for risk-on regime', () => {
    const result = renderRegimeHistorySvg({ data: [makeRegimePoint('2026-01-06', 'risk-on')] });
    expect(result).toContain('#16a34a');
  });

  it('uses red fill for risk-off regime', () => {
    const result = renderRegimeHistorySvg({ data: [makeRegimePoint('2026-01-06', 'risk-off')] });
    expect(result).toContain('#dc2626');
  });

  it('uses amber fill for range-bound regime', () => {
    const result = renderRegimeHistorySvg({ data: [makeRegimePoint('2026-01-06', 'range-bound')] });
    expect(result).toContain('#d97706');
  });

  it('handles empty data gracefully with a no-data message', () => {
    const result = renderRegimeHistorySvg({ data: [] });
    expect(result.startsWith('<svg')).toBe(true);
    expect(result).toContain('No data available');
  });

  it('handles fewer than 12 points without throwing', () => {
    const result = renderRegimeHistorySvg({ data: TWELVE_REGIME_POINTS.slice(0, 3) });
    expect(result.startsWith('<svg')).toBe(true);
    const rectCount = (result.match(/<rect/g) ?? []).length;
    expect(rectCount).toBe(8); // 1 background + 3 cells + 4 legend swatches
  });

  it('is deterministic for identical input', () => {
    const a = renderRegimeHistorySvg({ data: TWELVE_REGIME_POINTS });
    const b = renderRegimeHistorySvg({ data: TWELVE_REGIME_POINTS });
    expect(a).toBe(b);
  });

  it('closes the SVG element', () => {
    const result = renderRegimeHistorySvg({ data: TWELVE_REGIME_POINTS });
    expect(result.endsWith('</svg>')).toBe(true);
  });
});
