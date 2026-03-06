const getOptionalEnv = (value: string | undefined): string => {
  if (!value) {
    return '';
  }

  return value.trim();
};

const stripePaymentLink = getOptionalEnv(process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK);

export const siteConfig = {
  name: 'Weekly Crypto Pulse',
  description: 'Editorial crypto market summaries and recurring weekly reports.',
  pro: {
    stripePaymentLink,
    hasStripePaymentLink: stripePaymentLink.length > 0
  }
} as const;
