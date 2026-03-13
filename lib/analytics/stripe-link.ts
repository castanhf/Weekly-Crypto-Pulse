const STRIPE_HOST_SUFFIX = '.stripe.com';

export const isStripePaymentLink = (url: string): boolean => {
  if (!url) {
    return false;
  }

  try {
    const parsedUrl = new URL(url);

    if (parsedUrl.protocol !== 'https:') {
      return false;
    }

    const hostname = parsedUrl.hostname.toLowerCase();

    return hostname === 'stripe.com' || hostname.endsWith(STRIPE_HOST_SUFFIX);
  } catch {
    return false;
  }
};
