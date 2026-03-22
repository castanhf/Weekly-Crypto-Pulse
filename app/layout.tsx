import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { AnalyticsProvider } from '@/components/analytics/analytics-provider';
import { Footer } from '@/components/layout/footer';
import { Header } from '@/components/layout/header';
import { getSiteOrigin } from '@/lib/seo';
import { siteConfig } from '@/lib/site';

import './globals.css';

export const metadata: Metadata = {
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`
  },
  description: siteConfig.description,
  metadataBase: new URL(getSiteOrigin())
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
          <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-12 lg:px-8">{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
