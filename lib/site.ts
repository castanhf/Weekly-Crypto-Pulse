const sanitizeOptionalEnvValue = (value: string | undefined): string => {
  if (!value) {
    return '';
  }

  return value.trim();
};

const singleIssuePaymentLink = sanitizeOptionalEnvValue(process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK_SINGLE_ISSUE);
const monthlyBundlePaymentLink = sanitizeOptionalEnvValue(process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK_MONTHLY_BUNDLE);

export const siteConfig = {
  name: 'Weekly Crypto Pulse',
  description: 'Editorial crypto market summaries and recurring weekly reports.',
  pro: {
    singleIssuePaymentLink,
    hasSingleIssuePaymentLink: singleIssuePaymentLink.length > 0,
    monthlyBundlePaymentLink,
    hasMonthlyBundlePaymentLink: monthlyBundlePaymentLink.length > 0
  }
} as const;
