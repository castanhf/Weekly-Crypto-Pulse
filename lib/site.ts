const sanitizeOptionalEnvValue = (value: string | undefined): string => {
  if (!value) {
    return '';
  }

  return value.trim();
};

const weeklyProPaymentLink = sanitizeOptionalEnvValue(process.env.STRIPE_PAYMENT_LINK_WEEKLY_PRO);
const monthlyBundlePaymentLink = sanitizeOptionalEnvValue(process.env.STRIPE_PAYMENT_LINK_MONTHLY_BUNDLE);

export const siteConfig = {
  name: 'Weekly Crypto Pulse',
  description: 'Editorial crypto market summaries and recurring weekly reports.',
  pro: {
    weeklyProPaymentLink,
    monthlyBundlePaymentLink
  }
} as const;
