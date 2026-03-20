import { describe, expect, it } from 'vitest';

import {
  getFulfillmentAssistValidationMessage,
  hasCompleteFulfillmentAssistInput,
  toFulfillmentAssistInput,
  toFulfillmentAssistTarget,
  toFulfillmentEmailBody,
  toProPackCommand
} from './fulfillment-assist';

describe('toFulfillmentAssistInput', () => {
  it('normalizes string search params', () => {
    const input = toFulfillmentAssistInput({
      buyerEmail: ' buyer@example.com ',
      orderRef: ' order_123 ',
      slug: ' weekly-report ',
      month: ' 2026-03 '
    });

    expect(input).toEqual({
      buyerEmail: 'buyer@example.com',
      orderRef: 'order_123',
      slug: 'weekly-report',
      month: '2026-03'
    });
  });

  it('falls back to empty values for unsupported param types', () => {
    const input = toFulfillmentAssistInput({
      buyerEmail: ['buyer@example.com'],
      orderRef: undefined,
      slug: undefined,
      month: undefined
    });

    expect(input).toEqual({
      buyerEmail: '',
      orderRef: '',
      slug: '',
      month: ''
    });
  });
});

describe('toFulfillmentAssistTarget', () => {
  it('returns a single issue target when only slug is provided', () => {
    expect(
      toFulfillmentAssistTarget({
        buyerEmail: 'buyer@example.com',
        orderRef: 'order_123',
        slug: 'weekly-report',
        month: ''
      })
    ).toEqual({
      product: 'singleIssue',
      slug: 'weekly-report'
    });
  });

  it('returns a monthly bundle target when only a valid month is provided', () => {
    expect(
      toFulfillmentAssistTarget({
        buyerEmail: 'buyer@example.com',
        orderRef: 'order_123',
        slug: '',
        month: '2026-03'
      })
    ).toEqual({
      product: 'monthlyBundle',
      month: '2026-03'
    });
  });

  it('rejects ambiguous or invalid target input', () => {
    expect(
      toFulfillmentAssistTarget({
        buyerEmail: 'buyer@example.com',
        orderRef: 'order_123',
        slug: 'weekly-report',
        month: '2026-03'
      })
    ).toBeUndefined();

    expect(
      toFulfillmentAssistTarget({
        buyerEmail: 'buyer@example.com',
        orderRef: 'order_123',
        slug: '',
        month: 'March 2026'
      })
    ).toBeUndefined();
  });
});

describe('hasCompleteFulfillmentAssistInput', () => {
  it('returns true when required fields and a valid slug target are present', () => {
    expect(
      hasCompleteFulfillmentAssistInput({
        buyerEmail: 'buyer@example.com',
        orderRef: 'order_123',
        slug: 'weekly-report',
        month: ''
      })
    ).toBe(true);
  });

  it('returns true when required fields and a valid month target are present', () => {
    expect(
      hasCompleteFulfillmentAssistInput({
        buyerEmail: 'buyer@example.com',
        orderRef: 'order_123',
        slug: '',
        month: '2026-03'
      })
    ).toBe(true);
  });

  it('returns false when the target is invalid', () => {
    expect(
      hasCompleteFulfillmentAssistInput({
        buyerEmail: 'buyer@example.com',
        orderRef: 'order_123',
        slug: 'weekly-report',
        month: '2026-03'
      })
    ).toBe(false);
  });
});

describe('getFulfillmentAssistValidationMessage', () => {
  it('requires exactly one target selector', () => {
    expect(
      getFulfillmentAssistValidationMessage({
        buyerEmail: 'buyer@example.com',
        orderRef: 'order_123',
        slug: '',
        month: ''
      })
    ).toBe('Provide a report slug for a single issue or a month in YYYY-MM format for a monthly bundle.');

    expect(
      getFulfillmentAssistValidationMessage({
        buyerEmail: 'buyer@example.com',
        orderRef: 'order_123',
        slug: 'weekly-report',
        month: '2026-03'
      })
    ).toBe('Provide either a report slug or a bundle month, not both.');
  });

  it('requires YYYY-MM for monthly bundles', () => {
    expect(
      getFulfillmentAssistValidationMessage({
        buyerEmail: 'buyer@example.com',
        orderRef: 'order_123',
        slug: '',
        month: 'March 2026'
      })
    ).toBe('Bundle month must use YYYY-MM format.');
  });
});

describe('toProPackCommand', () => {
  it('creates an escaped single-issue generate command', () => {
    const command = toProPackCommand({
      buyerEmail: "buy'er@example.com",
      orderRef: 'ch_123',
      slug: '2026-03-02',
      month: ''
    });

    expect(command).toBe(
      "npm run generate:pro -- --product singleIssue --buyerEmail 'buy'\\''er@example.com' --orderRef 'ch_123' --slug '2026-03-02'"
    );
  });

  it('creates a monthly bundle generate command', () => {
    const command = toProPackCommand({
      buyerEmail: 'buyer@example.com',
      orderRef: 'ch_123',
      slug: '',
      month: '2026-03'
    });

    expect(command).toBe(
      "npm run generate:pro -- --product monthlyBundle --buyerEmail 'buyer@example.com' --orderRef 'ch_123' --month '2026-03'"
    );
  });
});

describe('toFulfillmentEmailBody', () => {
  it('uses the single issue template copy', () => {
    const body = toFulfillmentEmailBody(
      {
        buyerEmail: 'buyer@example.com',
        orderRef: 'ch_123',
        slug: '2026-03-02',
        month: ''
      },
      'ETF demand supports majors'
    );

    expect(body).toContain('Thank you for your purchase of **Weekly Crypto Pulse Pro — Single Issue**.');
    expect(body).toContain('Your report for **ETF demand supports majors** is attached to this email.');
    expect(body).toContain('Personal use only. Redistribution is not permitted.');
  });

  it('uses the monthly bundle template copy', () => {
    const body = toFulfillmentEmailBody({
      buyerEmail: 'buyer@example.com',
      orderRef: 'ch_123',
      slug: '',
      month: '2026-03'
    });

    expect(body).toContain('Thank you for purchasing **Weekly Crypto Pulse Pro — Monthly Bundle** for **2026-03**.');
    expect(body).toContain('- 4 weekly Pro reports during the month');
    expect(body).toContain('- 1 month-end Pro summary');
  });
});
