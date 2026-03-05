const getOptionalEnv = (value: string | undefined): string => {
  if (!value) {
    return '';
  }

  return value.trim();
};

export const siteConfig = {
  name: 'Weekly Crypto Pulse',
  description: 'Editorial crypto market summaries and recurring weekly reports.',
  pro: {
    stripePaymentLink: getOptionalEnv(process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK)
  }
} as const;
