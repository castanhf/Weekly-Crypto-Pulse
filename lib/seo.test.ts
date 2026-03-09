import { beforeEach, describe, expect, it } from 'vitest';

import type { Report } from '@/domain/report';
import { createReportMetadata, toAbsoluteUrl } from '@/lib/seo';

const baseReport: Report = {
  metadata: {
    title: 'Weekly Crypto Pulse — 2026-01-05',
    slug: '2026-01-05',
    publishedAt: '2026-01-05T00:00:00.000Z',
    weekLabel: 'Week of Jan 5, 2026',
    summary: 'Summary',
    tags: ['BTC', 'ETH']
  },
  regime: 'range-bound',
  marketSnapshot: {
    totalMarketCapUsd: 1,
    btcDominancePct: 1,
    ethDominancePct: 1,
    fearGreedIndex: 1
  },
  movers: [],
  sections: []
};

describe('seo metadata', () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://weeklycryptopulse.com/';
    process.env.NEXT_PUBLIC_X_HANDLE = 'weeklycryptopulse';
  });

  it('creates article metadata for reports', () => {
    const metadata = createReportMetadata(baseReport);

    expect(metadata.alternates?.canonical).toBe('https://weeklycryptopulse.com/reports/2026-01-05');
    expect(metadata.openGraph).toMatchObject({
      type: 'article',
      publishedTime: baseReport.metadata.publishedAt,
      tags: ['BTC', 'ETH']
    });
    expect(metadata.twitter?.site).toBe('@weeklycryptopulse');
    expect(metadata.twitter?.creator).toBe('@weeklycryptopulse');
  });

  it('converts paths to absolute URLs', () => {
    expect(toAbsoluteUrl('/reports')).toBe('https://weeklycryptopulse.com/reports');
  });
});
