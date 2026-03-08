'use client';

import { Analytics } from '@vercel/analytics/react';

import { isAnalyticsEnabled } from '@/lib/analytics/config';

export function AnalyticsProvider(): JSX.Element | null {
  if (!isAnalyticsEnabled()) {
    return null;
  }

  return <Analytics />;
}
