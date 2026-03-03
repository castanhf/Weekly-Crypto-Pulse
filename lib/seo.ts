import type { Metadata } from 'next';

import type { Report } from '@/domain/report';
import { siteConfig } from '@/lib/site';

const DEFAULT_OG_IMAGE_PATH = '/og-default.png';

const stripTrailingSlash = (value: string): string => value.replace(/\/$/, '');

const getSiteUrl = (): string => {
  const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();

  if (configuredSiteUrl && configuredSiteUrl.length > 0) {
    return stripTrailingSlash(configuredSiteUrl);
  }

  return 'http://localhost:3000';
};

const toAbsoluteUrl = (path: string): string => `${getSiteUrl()}${path}`;

type PageSeoInput = Readonly<{
  title: string;
  description: string;
  path: string;
}>;

const createPageMetadata = ({ title, description, path }: PageSeoInput): Metadata => ({
  title,
  description,
  alternates: {
    canonical: path
  },
  openGraph: {
    title,
    description,
    url: path,
    siteName: siteConfig.name,
    type: 'website',
    images: [
      {
        url: toAbsoluteUrl(DEFAULT_OG_IMAGE_PATH),
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
    images: [toAbsoluteUrl(DEFAULT_OG_IMAGE_PATH)]
  }
});

export const createHomeMetadata = (): Metadata =>
  createPageMetadata({
    title: 'Weekly crypto market reports',
    description:
      'Weekly Crypto Pulse delivers concise, data-driven crypto market reports covering regime, flows, and positioning.',
    path: '/'
  });

export const createReportsArchiveMetadata = (): Metadata =>
  createPageMetadata({
    title: 'Reports archive',
    description: 'Browse all Weekly Crypto Pulse reports in reverse chronological order.',
    path: '/reports'
  });

export const createMethodologyMetadata = (): Metadata =>
  createPageMetadata({
    title: 'Methodology',
    description: 'Learn the repeatable process and data inputs used to produce Weekly Crypto Pulse reports.',
    path: '/methodology'
  });

export const createDisclaimerMetadata = (): Metadata =>
  createPageMetadata({
    title: 'Disclaimer',
    description: 'Read important informational and risk disclosures for Weekly Crypto Pulse content.',
    path: '/disclaimer'
  });

export const createReportMetadata = (report: Report): Metadata =>
  createPageMetadata({
    title: report.metadata.title,
    description: report.metadata.summary,
    path: `/reports/${report.metadata.slug}`
  });

export const getDiscoverableRoutes = (): ReadonlyArray<string> => ['/', '/reports', '/methodology', '/disclaimer'];

export const getSiteOrigin = (): string => getSiteUrl();
