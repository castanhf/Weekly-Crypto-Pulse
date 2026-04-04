import { describe, expect, it } from 'vitest';

import { formatCompactUsd, formatIsoDate, formatIsoDateTime, formatPercent } from '@/components/reports/report-formatters';

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

  it('formats ISO timestamps as UTC date-times', () => {
    expect(formatIsoDateTime('2026-03-03T00:00:00.000Z')).toBe('Mar 3, 2026, 12:00 AM UTC');
  });
});
