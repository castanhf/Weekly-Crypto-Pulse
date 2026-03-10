import { describe, expect, it } from 'vitest';

import {
  hasCompleteFulfillmentAssistInput,
  toFulfillmentAssistInput,
  toFulfillmentEmailBody,
  toProPackCommand
} from './fulfillment-assist';

describe('toFulfillmentAssistInput', () => {
  it('normalizes string search params', () => {
    const input = toFulfillmentAssistInput({
      buyerEmail: ' buyer@example.com ',
      orderRef: ' order_123 ',
      slug: ' weekly-report '
    });

    expect(input).toEqual({
      buyerEmail: 'buyer@example.com',
      orderRef: 'order_123',
      slug: 'weekly-report'
    });
  });

  it('falls back to empty values for unsupported param types', () => {
    const input = toFulfillmentAssistInput({
      buyerEmail: ['buyer@example.com'],
      orderRef: undefined,
      slug: undefined
    });

    expect(input).toEqual({
      buyerEmail: '',
      orderRef: '',
      slug: ''
    });
  });
});

describe('hasCompleteFulfillmentAssistInput', () => {
  it('returns true only when all required fields are present', () => {
    expect(
      hasCompleteFulfillmentAssistInput({
        buyerEmail: 'buyer@example.com',
        orderRef: 'order_123',
        slug: 'weekly-report'
      })
    ).toBe(true);

    expect(
      hasCompleteFulfillmentAssistInput({
        buyerEmail: '',
        orderRef: 'order_123',
        slug: 'weekly-report'
      })
    ).toBe(false);
  });
});

describe('toProPackCommand', () => {
  it('creates an escaped generate command', () => {
    const command = toProPackCommand({
      buyerEmail: "buy'er@example.com",
      orderRef: 'ch_123',
      slug: '2026-03-02'
    });

    expect(command).toBe(
      "npm run generate:pro -- --slug '2026-03-02' --buyerEmail 'buy'\\''er@example.com' --orderRef 'ch_123'"
    );
  });
});

describe('toFulfillmentEmailBody', () => {
  it('uses the manual fulfillment template copy', () => {
    const body = toFulfillmentEmailBody(
      {
        buyerEmail: 'buyer@example.com',
        orderRef: 'ch_123',
        slug: '2026-03-02'
      },
      'ETF demand supports majors'
    );

    expect(body).toContain('Hi buyer@example.com,');
    expect(body).toContain('Your Pro pack for **ETF demand supports majors** is attached.');
    expect(body).toContain('License: Personal use only. This file includes a buyer-specific watermark.');
  });
});
