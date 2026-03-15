import { afterEach, describe, expect, it, vi } from 'vitest';

const loadOffersModule = async (): Promise<typeof import('@/lib/pro-offers')> => import('@/lib/pro-offers');

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe('pro offers', () => {
  it('returns external checkout targets when both payment links are configured', async () => {
    vi.stubEnv('NEXT_PUBLIC_STRIPE_PAYMENT_LINK_SINGLE_ISSUE', 'https://buy.stripe.com/test_single');
    vi.stubEnv('NEXT_PUBLIC_STRIPE_PAYMENT_LINK_MONTHLY_BUNDLE', 'https://buy.stripe.com/test_bundle');

    const { getProCheckoutTarget, getMissingProOfferEnvVarNames, hasMissingProOfferPaymentLink } = await loadOffersModule();

    expect(getProCheckoutTarget('singleIssue')).toEqual({
      href: 'https://buy.stripe.com/test_single',
      isExternal: true
    });
    expect(getProCheckoutTarget('monthlyBundle')).toEqual({
      href: 'https://buy.stripe.com/test_bundle',
      isExternal: true
    });
    expect(hasMissingProOfferPaymentLink()).toBe(false);
    expect(getMissingProOfferEnvVarNames()).toEqual([]);
  });

  it('falls back to local checkout warning target for missing links', async () => {
    vi.stubEnv('NEXT_PUBLIC_STRIPE_PAYMENT_LINK_SINGLE_ISSUE', '');
    vi.stubEnv('NEXT_PUBLIC_STRIPE_PAYMENT_LINK_MONTHLY_BUNDLE', 'https://buy.stripe.com/test_bundle');

    const { getProCheckoutTarget, getMissingProOfferEnvVarNames, hasMissingProOfferPaymentLink } = await loadOffersModule();

    expect(getProCheckoutTarget('singleIssue')).toEqual({
      href: '/pro#checkout-unavailable',
      isExternal: false
    });
    expect(getProCheckoutTarget('monthlyBundle')).toEqual({
      href: 'https://buy.stripe.com/test_bundle',
      isExternal: true
    });
    expect(hasMissingProOfferPaymentLink()).toBe(true);
    expect(getMissingProOfferEnvVarNames()).toEqual(['NEXT_PUBLIC_STRIPE_PAYMENT_LINK_SINGLE_ISSUE']);
  });
});
