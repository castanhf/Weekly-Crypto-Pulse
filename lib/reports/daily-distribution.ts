import type { DailyArtifact } from '../../domain/daily';
import { DAILY_TITLE_PREFIX, SITE_NAME } from '../site';

const SITE_DESCRIPTION = 'Daily crypto market reports from Crypto Pulse.';

const escapeXml = (value: string): string =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');

const toRssDate = (value: string): string => new Date(value).toUTCString();

const renderDailyRssItem = (daily: DailyArtifact, siteOrigin: string): string => {
  const url = `${siteOrigin}/reports/${daily.slug}`;
  const title = escapeXml(`${DAILY_TITLE_PREFIX} — ${daily.headline}`);

  return `<item>
<title>${title}</title>
<link>${url}</link>
<guid isPermaLink="true">${url}</guid>
<pubDate>${toRssDate(daily.publishedAt)}</pubDate>
<description>${escapeXml(daily.summary)}</description>
</item>`;
};

export const createDailyRssFeed = (
  dailies: ReadonlyArray<DailyArtifact>,
  siteOrigin: string,
  feedUrl: string
): string => {
  const items = dailies.map((d) => renderDailyRssItem(d, siteOrigin)).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
<title>${escapeXml(SITE_NAME)} — Daily</title>
<link>${siteOrigin}/reports</link>
<description>${escapeXml(SITE_DESCRIPTION)}</description>
<language>en-us</language>
<atom:link href="${escapeXml(feedUrl)}" rel="self" type="application/rss+xml" />
${items}
</channel>
</rss>`;
};
