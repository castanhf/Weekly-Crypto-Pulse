'use client';

import { track } from '@vercel/analytics';

type ReportViewPayload = Readonly<{
  reportSlug: string;
}>;

type ProCtaClickPayload = Readonly<{
  destination: string;
  isOutbound: boolean;
}>;

type AnalyticsEventMap = {
  view_report: ReportViewPayload;
  click_pro_cta: ProCtaClickPayload;
  outbound_stripe_payment_link: ProCtaClickPayload;
};

type AnalyticsEventName = keyof AnalyticsEventMap;

export const trackEvent = <TEventName extends AnalyticsEventName>(
  eventName: TEventName,
  payload: AnalyticsEventMap[TEventName]
): void => {
  track(eventName, payload);
};
