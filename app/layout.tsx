import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { AnalyticsProvider } from '@/components/analytics/analytics-provider';
import { Footer } from '@/components/layout/footer';
import { Header } from '@/components/layout/header';
import { pageContainerClassName } from '@/components/layout/page-shell';
import { getSiteOrigin } from '@/lib/seo';
import { SITE_NAME, siteConfig } from '@/lib/site';

import './globals.css';

const siteOrigin = getSiteOrigin();

export const metadata: Metadata = {
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`
  },
  description: siteConfig.description,
  metadataBase: new URL(siteOrigin),
  alternates: {
    types: {
      'application/rss+xml': [
        { url: `${siteOrigin}/rss.xml`, title: `${SITE_NAME} — Weekly` },
        { url: `${siteOrigin}/rss/daily.xml`, title: `${SITE_NAME} — Daily` }
      ]
    }
  },
  verification: { other: { 'msvalidate.01': '6DD2D23734CE5A78D3D6F34927BD62B3' } }
};

type RootLayoutProps = {
  children: ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps): JSX.Element {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <div className="flex min-h-screen flex-col">
          <AnalyticsProvider />
          <Header />
          <main className={`${pageContainerClassName} flex-1 py-10 sm:py-14 lg:py-16`}>{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
