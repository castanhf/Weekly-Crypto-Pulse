import { getAllReports } from '@/lib/reports/report-repository';
import { createDistributionContext, createRssFeed } from '@/lib/reports/distribution';
import { getSiteOrigin } from '@/lib/seo';

export const dynamic = 'force-static';

export function GET(): Response {
  const reports = getAllReports();
  const rssFeed = createRssFeed(reports, createDistributionContext(getSiteOrigin()));

  return new Response(rssFeed, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400'
    }
  });
}
