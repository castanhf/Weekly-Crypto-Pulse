import type { Metadata } from 'next';

import type { DailyArtifact } from '@/domain/daily';
import type { Report } from '@/domain/report';
import { DAILY_TITLE_PREFIX, WEEKLY_TITLE_PREFIX, siteConfig } from '@/lib/site';

const DEFAULT_OG_IMAGE_PATH = '/opengraph-image';

const stripTrailingSlash = (value: string): string => value.replace(/\/$/, '');

const getSiteUrl = (): string => {
  const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  const vercelUrl = process.env.VERCEL_URL?.trim();

  if (configuredSiteUrl && configuredSiteUrl.length > 0) {
    return stripTrailingSlash(configuredSiteUrl);
  }

  if (vercelUrl && vercelUrl.length > 0) {
    const normalizedVercelUrl = vercelUrl.startsWith('http') ? vercelUrl : `https://${vercelUrl}`;

    return stripTrailingSlash(normalizedVercelUrl);
  }

  return 'http://localhost:3000';
};

export const toAbsoluteUrl = (path: string): string => `${getSiteUrl()}${path}`;

const normalizeXHandle = (value: string): string => {
  const trimmedValue = value.trim();

  if (trimmedValue.length === 0) {
    return '';
  }

  return trimmedValue.startsWith('@') ? trimmedValue : `@${trimmedValue}`;
};

type PageSeoInput = Readonly<{
  title: string;
  description: string;
  path: string;
}>;

const createPageMetadata = ({ title, description, path }: PageSeoInput): Metadata => {
  const absolutePageUrl = toAbsoluteUrl(path);
  const openGraphImageUrl = toAbsoluteUrl(DEFAULT_OG_IMAGE_PATH);
  const xHandle = normalizeXHandle(process.env.NEXT_PUBLIC_X_HANDLE ?? '');

  return {
    title,
    description,
    alternates: {
      canonical: absolutePageUrl
    },
    openGraph: {
      title,
      description,
      url: absolutePageUrl,
      siteName: siteConfig.name,
      type: 'website',
      images: [
        {
          url: openGraphImageUrl,
          width: 1200,
          height: 630,
          alt: siteConfig.name
        }
      ]
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [openGraphImageUrl],
      site: xHandle || undefined,
      creator: xHandle || undefined
    }
  };
};

export const createHomeMetadata = (): Metadata => {
  const base = createPageMetadata({
    title: siteConfig.name,
    description: 'Weekly and daily crypto market reports. Free to read. We cover what happened and what it means.',
    path: '/'
  });
  return { ...base, title: { absolute: siteConfig.name } };
};

export const createReportsArchiveMetadata = (): Metadata =>
  createPageMetadata({
    title: 'Reports archive',
    description: 'Every Crypto Pulse report, free to read, newest first.',
    path: '/reports'
  });

export const createMethodologyMetadata = (): Metadata =>
  createPageMetadata({
    title: 'Methodology',
    description: 'How Crypto Pulse reports are put together — data sources, process, and what they cover.',
    path: '/methodology'
  });

export const createDisclaimerMetadata = (): Metadata =>
  createPageMetadata({
    title: 'Disclaimer',
    description: 'Crypto Pulse is informational only. Read this before acting on anything here.',
    path: '/disclaimer'
  });

export const createProMetadata = (): Metadata =>
  createPageMetadata({
    title: 'Crypto Pulse Pro',
    description: 'Weekly Pro and Monthly Bundle: the decision layer on top of the free reports. One-time purchases, delivered by email.',
    path: '/pro'
  });

export const createReportMetadata = (report: Report): Metadata => {
  const rawTitle = report.metadata.title;
  const colonIndex = rawTitle.indexOf(':');
  const headline = colonIndex >= 0 ? rawTitle.slice(colonIndex + 1).trim() : rawTitle;
  const title = `${WEEKLY_TITLE_PREFIX} — ${headline}`;

  const metadata = createPageMetadata({
    title,
    description: report.metadata.summary,
    path: `/reports/${report.metadata.slug}`
  });

  return {
    ...metadata,
    openGraph: {
      ...metadata.openGraph,
      type: 'article',
      publishedTime: report.metadata.publishedAt,
      tags: [...report.metadata.tags]
    }
  };
};

export const createDailyMetadata = (daily: DailyArtifact): Metadata => {
  const title = `${DAILY_TITLE_PREFIX} — ${daily.headline}`;
  const metadata = createPageMetadata({
    title,
    description: daily.summary,
    path: `/reports/${daily.slug}`
  });

  return {
    ...metadata,
    openGraph: {
      ...metadata.openGraph,
      type: 'article',
      publishedTime: daily.publishedAt,
      tags: [...daily.tags]
    }
  };
};

export const getDiscoverableRoutes = (): ReadonlyArray<string> => ['/', '/reports', '/pro', '/methodology', '/disclaimer'];

export const getSiteOrigin = (): string => getSiteUrl();
