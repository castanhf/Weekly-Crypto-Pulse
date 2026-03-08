const ANALYTICS_ENABLED_VALUE = 'true';

export const isAnalyticsEnabled = (): boolean =>
  process.env.NEXT_PUBLIC_ANALYTICS_ENABLED === ANALYTICS_ENABLED_VALUE;
