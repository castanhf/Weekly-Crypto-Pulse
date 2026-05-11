import type { MetadataRoute } from 'next';

import { loadAllArtifacts } from '@/lib/reports/artifact-repository';
import { getAllReports } from '@/lib/reports/report-repository';
import { getDiscoverableRoutes, getSiteOrigin } from '@/lib/seo';

const DAILY_SITEMAP_LIMIT = 30;

const toIsoDate = (value: string): string => new Date(value).toISOString();

export default function sitemap(): MetadataRoute.Sitemap {
  const siteOrigin = getSiteOrigin();

  const staticRoutes: MetadataRoute.Sitemap = getDiscoverableRoutes().map((path) => ({
    url: `${siteOrigin}${path}`,
    changeFrequency: path === '/' ? 'weekly' : 'monthly',
    priority: path === '/' ? 1.0 : path === '/reports' ? 0.8 : 0.5
  }));

  const weeklyRoutes: MetadataRoute.Sitemap = getAllReports().map((report) => ({
    url: `${siteOrigin}/reports/${report.metadata.slug}`,
    lastModified: toIsoDate(report.metadata.publishedAt),
    changeFrequency: 'never',
    priority: 0.7
  }));

  const dailyRoutes: MetadataRoute.Sitemap = loadAllArtifacts()
    .filter((a) => a.kind === 'daily')
    .slice(0, DAILY_SITEMAP_LIMIT)
    .map((a) => ({
      url: `${siteOrigin}/reports/${a.slug}`,
      lastModified: toIsoDate(a.publishedAt),
      changeFrequency: 'never' as const,
      priority: 0.7
    }));

  return [...staticRoutes, ...weeklyRoutes, ...dailyRoutes];
}
