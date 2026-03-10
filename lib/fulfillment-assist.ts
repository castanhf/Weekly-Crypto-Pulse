export type FulfillmentAssistInput = Readonly<{
  buyerEmail: string;
  orderRef: string;
  slug: string;
}>;

const REQUIRED_FIELDS: ReadonlyArray<keyof FulfillmentAssistInput> = ['buyerEmail', 'orderRef', 'slug'];

const normalizeValue = (value: string): string => value.trim();

const quoteCliArgument = (value: string): string => `'${value.replace(/'/g, `'\\''`)}'`;

export const isFulfillmentAssistEnabled = (): boolean => process.env.ENABLE_FULFILLMENT_ASSIST === 'true';

export const toFulfillmentAssistInput = (searchParams: Record<string, string | string[] | undefined>): FulfillmentAssistInput => {
  const readValue = (key: keyof FulfillmentAssistInput): string => {
    const rawValue = searchParams[key];

    if (typeof rawValue === 'string') {
      return normalizeValue(rawValue);
    }

    return '';
  };

  return {
    buyerEmail: readValue('buyerEmail'),
    orderRef: readValue('orderRef'),
    slug: readValue('slug')
  };
};

export const hasCompleteFulfillmentAssistInput = (input: FulfillmentAssistInput): boolean =>
  REQUIRED_FIELDS.every((field) => input[field].length > 0);

export const toProPackCommand = (input: FulfillmentAssistInput): string =>
  `npm run generate:pro -- --slug ${quoteCliArgument(input.slug)} --buyerEmail ${quoteCliArgument(input.buyerEmail)} --orderRef ${quoteCliArgument(input.orderRef)}`;

export const toFulfillmentEmailBody = (input: FulfillmentAssistInput, reportTitle: string): string =>
  [
    `Hi ${input.buyerEmail},`,
    '',
    'Thanks for your purchase of Weekly Crypto Pulse Pro.',
    '',
    `Your Pro pack for **${reportTitle}** is attached.`,
    '',
    'If you have any delivery issue, reply to this email and we will help.',
    '',
    'License: Personal use only. This file includes a buyer-specific watermark.',
    '',
    'Best regards,',
    'Weekly Crypto Pulse'
  ].join('\n');
