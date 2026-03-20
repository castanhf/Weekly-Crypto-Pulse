export type FulfillmentAssistInput = Readonly<{
  buyerEmail: string;
  orderRef: string;
  slug: string;
  month: string;
}>;

export type FulfillmentAssistTarget =
  | Readonly<{
      product: 'singleIssue';
      slug: string;
    }>
  | Readonly<{
      product: 'monthlyBundle';
      month: string;
    }>;

const REQUIRED_FIELDS: ReadonlyArray<keyof Pick<FulfillmentAssistInput, 'buyerEmail' | 'orderRef'>> = ['buyerEmail', 'orderRef'];
const MONTH_PATTERN = /^\d{4}-\d{2}$/;

const normalizeValue = (value: string): string => value.trim();

const quoteCliArgument = (value: string): string => `'${value.replace(/'/g, `'\\''`)}'`;

const readSearchParamValue = (
  searchParams: Record<string, string | string[] | undefined>,
  key: keyof FulfillmentAssistInput
): string => {
  const rawValue = searchParams[key];

  if (typeof rawValue === 'string') {
    return normalizeValue(rawValue);
  }

  return '';
};

const hasRequiredBaseFields = (input: FulfillmentAssistInput): boolean =>
  REQUIRED_FIELDS.every((field) => input[field].length > 0);

export const isFulfillmentAssistEnabled = (): boolean => process.env.ENABLE_FULFILLMENT_ASSIST === 'true';

export const toFulfillmentAssistInput = (
  searchParams: Record<string, string | string[] | undefined>
): FulfillmentAssistInput => ({
  buyerEmail: readSearchParamValue(searchParams, 'buyerEmail'),
  orderRef: readSearchParamValue(searchParams, 'orderRef'),
  slug: readSearchParamValue(searchParams, 'slug'),
  month: readSearchParamValue(searchParams, 'month')
});

export const toFulfillmentAssistTarget = (input: FulfillmentAssistInput): FulfillmentAssistTarget | undefined => {
  const hasSlug = input.slug.length > 0;
  const hasMonth = input.month.length > 0;

  if (hasSlug === hasMonth) {
    return undefined;
  }

  if (hasSlug) {
    return {
      product: 'singleIssue',
      slug: input.slug
    };
  }

  if (!MONTH_PATTERN.test(input.month)) {
    return undefined;
  }

  return {
    product: 'monthlyBundle',
    month: input.month
  };
};

export const hasCompleteFulfillmentAssistInput = (input: FulfillmentAssistInput): boolean =>
  hasRequiredBaseFields(input) && toFulfillmentAssistTarget(input) !== undefined;

export const getFulfillmentAssistValidationMessage = (input: FulfillmentAssistInput): string | undefined => {
  if (!hasRequiredBaseFields(input)) {
    return undefined;
  }

  const hasSlug = input.slug.length > 0;
  const hasMonth = input.month.length > 0;

  if (hasSlug && hasMonth) {
    return 'Provide either a report slug or a bundle month, not both.';
  }

  if (!hasSlug && !hasMonth) {
    return 'Provide a report slug for a single issue or a month in YYYY-MM format for a monthly bundle.';
  }

  if (hasMonth && !MONTH_PATTERN.test(input.month)) {
    return 'Bundle month must use YYYY-MM format.';
  }

  return undefined;
};

export const toProPackCommand = (input: FulfillmentAssistInput): string => {
  const target = toFulfillmentAssistTarget(input);

  if (!target) {
    throw new Error('Fulfillment helper requires either a valid slug or a valid month target.');
  }

  const baseArguments = [
    '--product',
    target.product,
    '--buyerEmail',
    quoteCliArgument(input.buyerEmail),
    '--orderRef',
    quoteCliArgument(input.orderRef)
  ];

  if (target.product === 'singleIssue') {
    return `npm run generate:pro -- ${[...baseArguments, '--slug', quoteCliArgument(target.slug)].join(' ')}`;
  }

  return `npm run generate:pro -- ${[...baseArguments, '--month', quoteCliArgument(target.month)].join(' ')}`;
};

export const toFulfillmentEmailBody = (
  input: FulfillmentAssistInput,
  reportTitle?: string
): string => {
  const target = toFulfillmentAssistTarget(input);

  if (!target) {
    throw new Error('Fulfillment helper requires either a valid slug or a valid month target.');
  }

  if (target.product === 'singleIssue') {
    const resolvedReportTitle = reportTitle ?? target.slug;

    return [
      'Hi,',
      '',
      'Thank you for your purchase of **Weekly Crypto Pulse Pro — Single Issue**.',
      '',
      `Your report for **${resolvedReportTitle}** is attached to this email.`,
      '',
      'If you have any issue opening the file or need the report resent, reply to this message and we will assist.',
      '',
      'Personal use only. Redistribution is not permitted.',
      '',
      'Best regards,',
      'Weekly Crypto Pulse'
    ].join('\n');
  }

  return [
    'Hi,',
    '',
    `Thank you for purchasing **Weekly Crypto Pulse Pro — Monthly Bundle** for **${target.month}**.`,
    '',
    'You will receive:',
    '- 4 weekly Pro reports during the month',
    '- 1 month-end Pro summary',
    '',
    'Each delivery will be sent manually to this email address after the relevant report is prepared.',
    '',
    'Personal use only. Redistribution is not permitted.',
    '',
    'Best regards,',
    'Weekly Crypto Pulse'
  ].join('\n');
};
