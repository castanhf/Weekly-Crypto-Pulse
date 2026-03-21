import { afterEach, describe, expect, it, vi } from 'vitest';

const loadOffersModule = async (): Promise<typeof import('@/lib/pro-offers')> => import('@/lib/pro-offers');

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe('pro offers', () => {
  it('returns Stripe checkout targets when both payment links are configured', async () => {
    vi.stubEnv('STRIPE_PAYMENT_LINK_WEEKLY_PRO', 'https://buy.stripe.com/test_single');
    vi.stubEnv('STRIPE_PAYMENT_LINK_MONTHLY_BUNDLE', 'https://buy.stripe.com/test_bundle');

    const {
      getMissingProOfferEnvVarNames,
      getProCheckoutTarget,
      getProOfferCard,
      getProOfferCards,
      getProOffersPageData,
      hasMissingProOfferPaymentLink
    } = await loadOffersModule();

    expect(getProCheckoutTarget('singleIssue')).toEqual({
      href: 'https://buy.stripe.com/test_single',
      kind: 'stripePaymentLink'
    });
    expect(getProCheckoutTarget('monthlyBundle')).toEqual({
      href: 'https://buy.stripe.com/test_bundle',
      kind: 'stripePaymentLink'
    });
    expect(getProOfferCard('singleIssue')).toMatchObject({
      id: 'singleIssue',
      pricing: {
        tier: 'entryOffer'
      },
      product: {
        ctaLabel: 'Buy Single Issue'
      }
    });
    expect(getProOfferCards().map((offer) => offer.id)).toEqual(['singleIssue', 'monthlyBundle']);
    expect(getProOffersPageData()).toMatchObject({
      missingPaymentLinkEnvVarNames: [],
      offers: [
        {
          id: 'singleIssue'
        },
        {
          id: 'monthlyBundle'
        }
      ]
    });
    expect(hasMissingProOfferPaymentLink()).toBe(false);
    expect(getMissingProOfferEnvVarNames()).toEqual([]);
  });

  it('falls back to the local checkout warning target for missing links', async () => {
    vi.stubEnv('STRIPE_PAYMENT_LINK_WEEKLY_PRO', '');
    vi.stubEnv('STRIPE_PAYMENT_LINK_MONTHLY_BUNDLE', 'https://buy.stripe.com/test_bundle');

    const { getMissingProOfferEnvVarNames, getProCheckoutTarget, getProOffersPageData, hasMissingProOfferPaymentLink } =
      await loadOffersModule();

    expect(getProCheckoutTarget('singleIssue')).toEqual({
      href: '/pro#checkout-unavailable',
      kind: 'checkoutUnavailable'
    });
    expect(getProCheckoutTarget('monthlyBundle')).toEqual({
      href: 'https://buy.stripe.com/test_bundle',
      kind: 'stripePaymentLink'
    });
    expect(getProOffersPageData().missingPaymentLinkEnvVarNames).toEqual(['STRIPE_PAYMENT_LINK_WEEKLY_PRO']);
    expect(hasMissingProOfferPaymentLink()).toBe(true);
    expect(getMissingProOfferEnvVarNames()).toEqual(['STRIPE_PAYMENT_LINK_WEEKLY_PRO']);
  });

  it('treats non-Stripe links as unavailable checkout', async () => {
    vi.stubEnv('STRIPE_PAYMENT_LINK_WEEKLY_PRO', 'https://example.com/not-stripe');
    vi.stubEnv('STRIPE_PAYMENT_LINK_MONTHLY_BUNDLE', 'http://buy.stripe.com/insecure_link');

    const { getMissingProOfferEnvVarNames, getProCheckoutTarget, hasMissingProOfferPaymentLink } = await loadOffersModule();

    expect(getProCheckoutTarget('singleIssue')).toEqual({
      href: '/pro#checkout-unavailable',
      kind: 'checkoutUnavailable'
    });
    expect(getProCheckoutTarget('monthlyBundle')).toEqual({
      href: '/pro#checkout-unavailable',
      kind: 'checkoutUnavailable'
    });
    expect(hasMissingProOfferPaymentLink()).toBe(true);
    expect(getMissingProOfferEnvVarNames()).toEqual([
      'STRIPE_PAYMENT_LINK_WEEKLY_PRO',
      'STRIPE_PAYMENT_LINK_MONTHLY_BUNDLE'
    ]);
  });
});
