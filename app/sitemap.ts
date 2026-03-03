import type { MetadataRoute } from 'next';

import { getAllReports } from '@/lib/reports/report-repository';
import { getDiscoverableRoutes, getSiteOrigin } from '@/lib/seo';

const toIsoDate = (value: string): string => new Date(value).toISOString();

export default function sitemap(): MetadataRoute.Sitemap {
  const siteOrigin = getSiteOrigin();
  const staticRoutes = getDiscoverableRoutes().map((path) => ({
    url: `${siteOrigin}${path}`
  }));
  const reportRoutes = getAllReports().map((report) => ({
    url: `${siteOrigin}/reports/${report.metadata.slug}`,
    lastModified: toIsoDate(report.metadata.publishedAt)
  }));

  return [...staticRoutes, ...reportRoutes];
}
