import { afterEach, describe, expect, it, vi } from 'vitest';

const loadOffersModule = async (): Promise<typeof import('@/lib/pro-offers')> => import('@/lib/pro-offers');

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe('pro offers', () => {
  it('returns external checkout targets when both payment links are configured', async () => {
    vi.stubEnv('STRIPE_PAYMENT_LINK_WEEKLY_PRO', 'https://buy.stripe.com/test_single');
    vi.stubEnv('STRIPE_PAYMENT_LINK_MONTHLY_BUNDLE', 'https://buy.stripe.com/test_bundle');

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
    vi.stubEnv('STRIPE_PAYMENT_LINK_WEEKLY_PRO', '');
    vi.stubEnv('STRIPE_PAYMENT_LINK_MONTHLY_BUNDLE', 'https://buy.stripe.com/test_bundle');

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
    expect(getMissingProOfferEnvVarNames()).toEqual(['STRIPE_PAYMENT_LINK_WEEKLY_PRO']);
  });

  it('treats non-stripe links as unavailable checkout', async () => {
    vi.stubEnv('STRIPE_PAYMENT_LINK_WEEKLY_PRO', 'https://example.com/not-stripe');
    vi.stubEnv('STRIPE_PAYMENT_LINK_MONTHLY_BUNDLE', 'http://buy.stripe.com/insecure_link');

    const { getProCheckoutTarget, getMissingProOfferEnvVarNames, hasMissingProOfferPaymentLink } = await loadOffersModule();

    expect(getProCheckoutTarget('singleIssue')).toEqual({
      href: '/pro#checkout-unavailable',
      isExternal: false
    });
    expect(getProCheckoutTarget('monthlyBundle')).toEqual({
      href: '/pro#checkout-unavailable',
      isExternal: false
    });
    expect(hasMissingProOfferPaymentLink()).toBe(true);
    expect(getMissingProOfferEnvVarNames()).toEqual([
      'STRIPE_PAYMENT_LINK_WEEKLY_PRO',
      'STRIPE_PAYMENT_LINK_MONTHLY_BUNDLE'
    ]);
  });
});
