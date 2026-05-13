import { describe, expect, it } from 'vitest';

import type { Regime } from '@/domain/report';
import { REGIME_COLORS, REGIME_LABELS, getRegimeColor, getRegimeLabel } from './RegimeHistoryStrip';

const ALL_REGIMES: Regime[] = ['risk-on', 'risk-off', 'range-bound', 'transition'];

describe('REGIME_COLORS', () => {
  it('has a color for each regime', () => {
    for (const regime of ALL_REGIMES) {
      expect(REGIME_COLORS[regime]).toMatch(/^#[0-9a-fA-F]{6}$/);
    }
  });

  it('uses green for risk-on', () => {
    expect(REGIME_COLORS['risk-on']).toBe('#16a34a');
  });

  it('uses red for risk-off', () => {
    expect(REGIME_COLORS['risk-off']).toBe('#dc2626');
  });

  it('uses amber for range-bound', () => {
    expect(REGIME_COLORS['range-bound']).toBe('#d97706');
  });

  it('has four entries — one per regime', () => {
    expect(Object.keys(REGIME_COLORS)).toHaveLength(4);
  });
});

describe('REGIME_LABELS', () => {
  it('has a label for each regime', () => {
    for (const regime of ALL_REGIMES) {
      expect(typeof REGIME_LABELS[regime]).toBe('string');
      expect(REGIME_LABELS[regime].length).toBeGreaterThan(0);
    }
  });
});

describe('getRegimeColor', () => {
  it('returns correct color for each regime', () => {
    for (const regime of ALL_REGIMES) {
      expect(getRegimeColor(regime)).toBe(REGIME_COLORS[regime]);
    }
  });
});

describe('getRegimeLabel', () => {
  it('returns correct label for each regime', () => {
    for (const regime of ALL_REGIMES) {
      expect(getRegimeLabel(regime)).toBe(REGIME_LABELS[regime]);
    }
  });
});
