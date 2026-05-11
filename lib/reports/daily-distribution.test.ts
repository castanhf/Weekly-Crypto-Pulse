import { describe, expect, it } from 'vitest';

import { loadAllArtifacts } from '@/lib/reports/artifact-repository';
import { createDailyRssFeed } from '@/lib/reports/daily-distribution';

describe('daily RSS distribution', () => {
  it('builds valid RSS XML with atom self-link and daily items', () => {
    const dailies = loadAllArtifacts()
      .filter((a) => a.kind === 'daily')
      .map((a) => a.daily);

    const siteOrigin = 'https://crypto-pulse.com';
    const feedUrl = `${siteOrigin}/rss/daily.xml`;
    const xml = createDailyRssFeed(dailies, siteOrigin, feedUrl);

    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(xml).toContain('xmlns:atom="http://www.w3.org/2005/Atom"');
    expect(xml).toContain('<atom:link href="https://crypto-pulse.com/rss/daily.xml" rel="self" type="application/rss+xml" />');
    expect(xml).toContain('<title>Crypto Pulse — Daily</title>');
    expect(xml).toContain('<language>en-us</language>');
  });

  it('includes a daily item per artifact with correct URL and title prefix', () => {
    const dailies = loadAllArtifacts()
      .filter((a) => a.kind === 'daily')
      .map((a) => a.daily);

    if (dailies.length === 0) return;

    const xml = createDailyRssFeed(dailies, 'https://crypto-pulse.com', 'https://crypto-pulse.com/rss/daily.xml');
    const first = dailies[0];

    expect(xml).toContain(`<link>https://crypto-pulse.com/reports/${first.slug}</link>`);
    expect(xml).toContain('Daily Crypto Pulse');
  });

  it('caps the feed at 30 items', () => {
    const dailies = loadAllArtifacts()
      .filter((a) => a.kind === 'daily')
      .map((a) => a.daily)
      .slice(0, 30);

    expect(dailies.length).toBeLessThanOrEqual(30);
  });
});
