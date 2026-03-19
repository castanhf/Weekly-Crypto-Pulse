export type BuyerWatermark = Readonly<{
  buyerEmail: string;
  purchasedAt?: string;
  orderRef?: string;
}>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DATE_PREFIX_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const REDACTION = '***';
const DATE_FALLBACK = 'date-unavailable';
const ORDER_REF_FALLBACK = 'ref-unavailable';

const maskSegment = (value: string): string => {
  if (value.length <= 1) {
    return `${value}${REDACTION}`;
  }

  if (value.length === 2) {
    return `${value[0]}${REDACTION}`;
  }

  return `${value[0]}${REDACTION}${value[value.length - 1]}`;
};

const toDatePrefix = (value: string): string => value.slice(0, 10);

export const assertBuyerEmail = (value: string): string => {
  const normalizedValue = value.trim().toLowerCase();

  if (!EMAIL_PATTERN.test(normalizedValue)) {
    throw new Error(`Invalid buyer email \"${value}\".`);
  }

  return normalizedValue;
};

export const maskBuyerEmail = (value: string): string => {
  const normalizedValue = assertBuyerEmail(value);
  const [localPart, domainPart] = normalizedValue.split('@');
  const domainLabels = domainPart.split('.');
  const [registrableDomain, ...suffixLabels] = domainLabels;

  return `${maskSegment(localPart)}@${maskSegment(registrableDomain)}.${suffixLabels.join('.')}`;
};

export const toPurchasedAtDate = (value?: string): string => {
  if (!value) {
    return DATE_FALLBACK;
  }

  const normalizedValue = value.trim();
  const datePrefix = toDatePrefix(normalizedValue);

  if (!DATE_PREFIX_PATTERN.test(datePrefix) || Number.isNaN(Date.parse(`${datePrefix}T00:00:00.000Z`))) {
    throw new Error(`Invalid purchasedAt value \"${value}\". Expected an ISO-8601 date or datetime string.`);
  }

  return datePrefix;
};

export const truncateOrderRef = (value?: string): string => {
  if (!value) {
    return ORDER_REF_FALLBACK;
  }

  const normalizedValue = value.trim();

  if (normalizedValue.length === 0) {
    return ORDER_REF_FALLBACK;
  }

  if (normalizedValue.length <= 12) {
    return normalizedValue;
  }

  return `${normalizedValue.slice(0, 4)}…${normalizedValue.slice(-4)}`;
};

export const toBuyerWatermarkLine = (watermark?: BuyerWatermark): string | undefined => {
  if (!watermark) {
    return undefined;
  }

  return `> Buyer copy · ${maskBuyerEmail(watermark.buyerEmail)} · ${toPurchasedAtDate(watermark.purchasedAt)} · ${truncateOrderRef(watermark.orderRef)}`;
};
