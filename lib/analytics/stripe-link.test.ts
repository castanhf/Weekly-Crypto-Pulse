import { describe, expect, it } from 'vitest';

import { isStripePaymentLink } from '@/lib/analytics/stripe-link';

describe('isStripePaymentLink', () => {
  it('returns true for stripe payment links', () => {
    expect(isStripePaymentLink('https://buy.stripe.com/test_123')).toBe(true);
  });

  it('returns false for internal routes', () => {
    expect(isStripePaymentLink('/pro#checkout-unavailable')).toBe(false);
  });

  it('returns false for non-stripe hosts', () => {
    expect(isStripePaymentLink('https://example.com')).toBe(false);
  });

  it('returns false for non-https links', () => {
    expect(isStripePaymentLink('http://buy.stripe.com/test_123')).toBe(false);
  });
});
