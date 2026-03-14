import { describe, expect, it } from 'vitest';

import { parseReportJson } from '@/lib/reports/report-parser';

const BASE_REPORT = {
  metadata: {
    title: 'Sample report',
    slug: 'sample-report',
    publishedAt: '2026-03-02',
    weekLabel: 'Week of Mar 2, 2026',
    summary: 'Summary',
    tags: ['btc']
  },
  regime: 'range-bound',
  marketSnapshot: {
    totalMarketCapUsd: 10,
    btcDominancePct: 50,
    ethDominancePct: 15,
    fearGreedIndex: 55
  },
  movers: [
    {
      symbol: 'BTC',
      name: 'Bitcoin',
      changePct7d: 1,
      catalyst: 'Catalyst'
    }
  ],
  sections: [
    {
      id: 'overview',
      heading: 'Overview',
      body: 'Body',
      highlights: ['One']
    }
  ],
  signals: {
    thesis: ['Thesis'],
    riskChecklist: ['Risk 1', 'Risk 2', 'Risk 3', 'Risk 4', 'Risk 5'],
    watchlistLevels: [{ asset: 'BTC', level: '90k', context: 'Support test' }],
    changedSinceLastWeek: ['Change']
  }
} as const;

describe('parseReportJson', () => {
  it('parses legacy report shape', () => {
    const report = parseReportJson(JSON.stringify(BASE_REPORT), 'legacy.json');

    expect(report.metadata.slug).toBe('sample-report');
  });

  it('parses versioned artifact shape', () => {
    const artifact = {
      schemaVersion: '1.0',
      report: BASE_REPORT,
      generatedAt: '2026-03-03T00:00:00.000Z'
    };

    const report = parseReportJson(JSON.stringify(artifact), 'artifact.json');

    expect(report.metadata.slug).toBe('sample-report');
  });

  it('rejects unsupported schema versions', () => {
    const artifact = {
      schemaVersion: '2.0',
      report: BASE_REPORT
    };

    expect(() => parseReportJson(JSON.stringify(artifact), 'artifact.json')).toThrow(
      'Invalid report data at "schemaVersion": unsupported version "2.0".'
    );
  });

  it('rejects risk checklists that do not contain exactly five items', () => {
    const invalidReport = {
      ...BASE_REPORT,
      signals: {
        ...BASE_REPORT.signals,
        riskChecklist: ['Risk 1', 'Risk 2']
      }
    };

    expect(() => parseReportJson(JSON.stringify(invalidReport), 'invalid.json')).toThrow(
      'Invalid report data at "signals.riskChecklist": expected exactly 5 items.'
    );
  });
});
