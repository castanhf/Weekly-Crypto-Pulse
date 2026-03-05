import { describe, expect, it } from 'vitest';

import { formatCompactUsd, formatIsoDate, formatPercent } from '@/components/reports/report-formatters';

describe('report formatters', () => {
  it('formats compact USD values for dashboard-style summaries', () => {
    expect(formatCompactUsd(1_500_000)).toBe('$1.50M');
  });

  it('formats percentages with one decimal place', () => {
    expect(formatPercent(2)).toBe('2.0%');
    expect(formatPercent(-1.25)).toBe('-1.3%');
  });

  it('formats ISO dates as UTC calendar dates', () => {
    expect(formatIsoDate('2026-02-23')).toBe('Feb 23, 2026');
  });
});
