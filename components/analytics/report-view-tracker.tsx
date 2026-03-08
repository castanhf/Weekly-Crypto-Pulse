'use client';

import { useEffect, useRef } from 'react';

import { trackEvent } from '@/lib/analytics/events';

type ReportViewTrackerProps = Readonly<{
  reportSlug: string;
}>;

export function ReportViewTracker({ reportSlug }: ReportViewTrackerProps): null {
  const hasTrackedView = useRef(false);

  useEffect(() => {
    if (hasTrackedView.current) {
      return;
    }

    trackEvent('view_report', { reportSlug });
    hasTrackedView.current = true;
  }, [reportSlug]);

  return null;
}
