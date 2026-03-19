import { describe, expect, it } from 'vitest';

import {
  assertBuyerEmail,
  maskBuyerEmail,
  toBuyerWatermarkLine,
  toPurchasedAtDate,
  truncateOrderRef
} from './pro-pack-watermark';

describe('assertBuyerEmail', () => {
  it('normalizes valid buyer emails', () => {
    expect(assertBuyerEmail(' Buyer+Pro@Example.COM ')).toBe('buyer+pro@example.com');
  });

  it('rejects invalid buyer emails', () => {
    expect(() => assertBuyerEmail('invalid-email')).toThrow('Invalid buyer email');
  });
});

describe('maskBuyerEmail', () => {
  it('masks the local part and registrable domain', () => {
    expect(maskBuyerEmail('buyer@example.com')).toBe('b***r@e***e.com');
  });

  it('keeps the suffix intact for subdomains', () => {
    expect(maskBuyerEmail('buyer@research.example.co.uk')).toBe('b***r@r***h.example.co.uk');
  });
});

describe('toPurchasedAtDate', () => {
  it('extracts the date prefix from an ISO datetime', () => {
    expect(toPurchasedAtDate('2026-03-19T08:15:00.000Z')).toBe('2026-03-19');
  });

  it('returns a stable fallback when purchasedAt is omitted', () => {
    expect(toPurchasedAtDate()).toBe('date-unavailable');
  });

  it('rejects invalid purchasedAt values', () => {
    expect(() => toPurchasedAtDate('03/19/2026')).toThrow('Invalid purchasedAt value');
  });
});

describe('truncateOrderRef', () => {
  it('truncates long order references', () => {
    expect(truncateOrderRef('pi_1234567890_secret_abcdef')).toBe('pi_1…cdef');
  });

  it('returns a stable fallback when orderRef is omitted', () => {
    expect(truncateOrderRef()).toBe('ref-unavailable');
  });
});

describe('toBuyerWatermarkLine', () => {
  it('assembles a deterministic watermark line', () => {
    expect(
      toBuyerWatermarkLine({
        buyerEmail: 'buyer@example.com',
        purchasedAt: '2026-03-19T08:15:00.000Z',
        orderRef: 'pi_1234567890_secret_abcdef'
      })
    ).toBe('> Buyer copy · b***r@e***e.com · 2026-03-19 · pi_1…cdef');
  });

  it('returns undefined when no buyer metadata is provided', () => {
    expect(toBuyerWatermarkLine()).toBeUndefined();
  });
});
