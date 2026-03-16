import type { ProProductId } from '@/domain/pro-product';

export type FulfillmentDeliveryChannel = 'manualEmail';

export type FulfillmentTiming =
  | 'afterPaymentConfirmation'
  | 'acrossPurchasedMonth'
  | 'monthEndPurchasedMonth';

export type FulfillmentDeliverableType = 'weeklyProReport' | 'monthlyProSummary';

export type FulfillmentDeliverable = Readonly<{
  type: FulfillmentDeliverableType;
  quantity: number;
  description: string;
  timing: FulfillmentTiming;
}>;

export type ProductFulfillmentDefinition = Readonly<{
  productId: ProProductId;
  deliveryChannel: FulfillmentDeliveryChannel;
  deliverySummary: string;
  deliverables: ReadonlyArray<FulfillmentDeliverable>;
  operatorSteps: ReadonlyArray<string>;
}>;

type ProductFulfillmentMap = Readonly<Record<ProProductId, ProductFulfillmentDefinition>>;

const OPERATOR_STEPS: ReadonlyArray<string> = [
  'Confirm Stripe payment status is Succeeded and capture buyer email from Stripe.',
  'Identify the purchased product (Single Issue or Monthly Bundle) from Stripe line items.',
  'Generate required Pro artifacts from committed report JSON files using scripts.',
  'Deliver artifacts manually to the buyer email and include the personal-use license note.'
];

export const PRO_FULFILLMENT_DEFINITIONS: ProductFulfillmentMap = {
  singleIssue: {
    productId: 'singleIssue',
    deliveryChannel: 'manualEmail',
    deliverySummary: 'One Pro weekly report delivered once after purchase confirmation.',
    deliverables: [
      {
        type: 'weeklyProReport',
        quantity: 1,
        description: 'Selected Pro weekly report for the purchased issue.',
        timing: 'afterPaymentConfirmation'
      }
    ],
    operatorSteps: OPERATOR_STEPS
  },
  monthlyBundle: {
    productId: 'monthlyBundle',
    deliveryChannel: 'manualEmail',
    deliverySummary: 'Four Pro weekly reports delivered across the purchased month plus one monthly summary at month end.',
    deliverables: [
      {
        type: 'weeklyProReport',
        quantity: 4,
        description: 'Four Pro weekly reports for the purchased month.',
        timing: 'acrossPurchasedMonth'
      },
      {
        type: 'monthlyProSummary',
        quantity: 1,
        description: 'Monthly Pro summary covering the purchased month.',
        timing: 'monthEndPurchasedMonth'
      }
    ],
    operatorSteps: OPERATOR_STEPS
  }
} as const;

export const getProductFulfillmentDefinition = (productId: ProProductId): ProductFulfillmentDefinition =>
  PRO_FULFILLMENT_DEFINITIONS[productId];
