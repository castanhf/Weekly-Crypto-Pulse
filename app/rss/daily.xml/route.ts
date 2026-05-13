import { loadAllArtifacts } from '@/lib/reports/artifact-repository';
import { createDailyRssFeed } from '@/lib/reports/daily-distribution';
import { getSiteOrigin } from '@/lib/seo';

export const dynamic = 'force-static';

const DAILY_FEED_LIMIT = 30;

export function GET(): Response {
  const siteOrigin = getSiteOrigin();
  const feedUrl = `${siteOrigin}/rss/daily.xml`;

  const dailies = loadAllArtifacts()
    .filter((a) => a.kind === 'daily')
    .slice(0, DAILY_FEED_LIMIT)
    .map((a) => a.daily);

  const rssXml = createDailyRssFeed(dailies, siteOrigin, feedUrl);

  return new Response(rssXml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400'
    }
  });
}
