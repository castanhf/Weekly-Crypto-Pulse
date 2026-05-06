const sanitizeOptionalEnvValue = (value: string | undefined): string => {
  if (!value) {
    return '';
  }

  return value.trim();
};

const weeklyProPaymentLink = sanitizeOptionalEnvValue(process.env.STRIPE_PAYMENT_LINK_WEEKLY_PRO);
const monthlyBundlePaymentLink = sanitizeOptionalEnvValue(process.env.STRIPE_PAYMENT_LINK_MONTHLY_BUNDLE);

export const SITE_NAME = 'Crypto Pulse';

// Cadence prefixes for per-artifact metadata (used in R2.1 for <title> and OG title per report).
// Not used in site chrome — site chrome uses SITE_NAME exclusively.
export const WEEKLY_TITLE_PREFIX = 'Weekly Crypto Pulse';
export const DAILY_TITLE_PREFIX = 'Daily Crypto Pulse';

export const siteConfig = {
  name: SITE_NAME,
  description: 'Editorial crypto market summaries and recurring reports.',
  pro: {
    weeklyProPaymentLink,
    monthlyBundlePaymentLink
  }
} as const;
