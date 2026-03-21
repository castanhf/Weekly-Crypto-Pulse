const STRIPE_HOST_SUFFIX = '.stripe.com';

export type StripePaymentLink = string & {
  readonly __brand: 'StripePaymentLink';
};

const normalizeUrl = (value: string): string => value.trim();

const isHttps = (url: URL): boolean => url.protocol === 'https:';

const isStripeHost = (url: URL): boolean => {
  const hostname = url.hostname.toLowerCase();

  return hostname === 'stripe.com' || hostname.endsWith(STRIPE_HOST_SUFFIX);
};

export const isStripePaymentLink = (url: string): boolean => {
  if (!url) {
    return false;
  }

  try {
    const parsedUrl = new URL(normalizeUrl(url));

    return isHttps(parsedUrl) && isStripeHost(parsedUrl);
  } catch {
    return false;
  }
};

export const toStripePaymentLink = (url: string): StripePaymentLink | undefined => {
  const normalizedUrl = normalizeUrl(url);

  if (!isStripePaymentLink(normalizedUrl)) {
    return undefined;
  }

  return normalizedUrl as StripePaymentLink;
};

export const toStripePaymentLinkOrEmpty = (url: string): string => toStripePaymentLink(url) ?? '';
