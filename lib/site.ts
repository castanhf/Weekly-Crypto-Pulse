const sanitizeOptionalEnvValue = (value: string | undefined): string => {
  if (!value) {
    return '';
  }

  return value.trim();
};

const weeklyProPaymentLink = sanitizeOptionalEnvValue(process.env.STRIPE_PAYMENT_LINK_WEEKLY_PRO);
const monthlyBundlePaymentLink = sanitizeOptionalEnvValue(process.env.STRIPE_PAYMENT_LINK_MONTHLY_BUNDLE);

export const SITE_NAME = 'Crypto Pulse';

// This is the canonical source for the public URL used in email composers — update here only.
// Web-facing surfaces (sitemap, robots, RSS, metadata) read from NEXT_PUBLIC_SITE_URL env var via lib/seo.ts.
export const SITE_URL = 'https://weekly-crypto-pulse.com';

// Cadence prefixes for per-artifact metadata (used in R2.1 for <title> and OG title per report).
// Not used in site chrome — site chrome uses SITE_NAME exclusively.
export const WEEKLY_TITLE_PREFIX = 'Weekly Crypto Pulse';
export const DAILY_TITLE_PREFIX = 'Daily Crypto Pulse';

export const siteConfig = {
  name: SITE_NAME,
  description: 'Weekly and daily crypto market reports — macro analysis, price action, and key signals. Free to read. Pro-depth coverage available.',
  pro: {
    weeklyProPaymentLink,
    monthlyBundlePaymentLink
  }
} as const;
