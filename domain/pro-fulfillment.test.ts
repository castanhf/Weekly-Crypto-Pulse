import { describe, expect, it } from 'vitest';

import { getProductFulfillmentDefinition } from './pro-fulfillment';

describe('getProductFulfillmentDefinition', () => {
  it('returns single issue fulfillment with one weekly report delivered after payment', () => {
    const definition = getProductFulfillmentDefinition('singleIssue');

    expect(definition.deliveryChannel).toBe('manualEmail');
    expect(definition.deliverables).toEqual([
      {
        type: 'weeklyProReport',
        quantity: 1,
        description: 'Selected Pro weekly decision report for the purchased issue.',
        timing: 'afterPaymentConfirmation'
      }
    ]);
  });

  it('returns monthly bundle fulfillment with weekly deliveries and month-end summary', () => {
    const definition = getProductFulfillmentDefinition('monthlyBundle');

    expect(definition.deliveryChannel).toBe('manualEmail');
    expect(definition.deliverables).toEqual([
      {
        type: 'weeklyProReport',
        quantity: 4,
        description: 'Four Pro weekly decision reports for the purchased month.',
        timing: 'acrossPurchasedMonth'
      },
      {
        type: 'monthlyProSummary',
        quantity: 1,
        description: 'Month-end continuity summary covering recurring thesis points, regime shifts, and key movers.',
        timing: 'monthEndPurchasedMonth'
      }
    ]);
  });

  it('keeps shared operator steps for both products', () => {
    const singleIssue = getProductFulfillmentDefinition('singleIssue');
    const monthlyBundle = getProductFulfillmentDefinition('monthlyBundle');

    expect(singleIssue.operatorSteps).toEqual(monthlyBundle.operatorSteps);
    expect(singleIssue.operatorSteps).toHaveLength(4);
  });
});
