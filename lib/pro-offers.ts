import {
  PRO_PRODUCT_IDS,
  getProProductDefinition,
  type ProProductDefinition,
  type ProProductId
} from '@/domain/pro-product';
import { getProPricingDefinition, type ProPricingDefinition } from '@/domain/pro-pricing';
import { siteConfig } from '@/lib/site';
import { toStripePaymentLink, type StripePaymentLink } from '@/lib/stripe/payment-links';

const CHECKOUT_UNAVAILABLE_TARGET = '/pro#checkout-unavailable';

type ProPaymentLinkEnvVarName = 'STRIPE_PAYMENT_LINK_WEEKLY_PRO' | 'STRIPE_PAYMENT_LINK_MONTHLY_BUNDLE';

type ProCheckoutConfig = Readonly<{
  productId: ProProductId;
  paymentLinkEnvVarName: ProPaymentLinkEnvVarName;
  rawPaymentLink: string;
}>;

export type UnavailableCheckoutTarget = Readonly<{
  href: typeof CHECKOUT_UNAVAILABLE_TARGET;
  kind: 'checkoutUnavailable';
}>;

export type StripeCheckoutTarget = Readonly<{
  href: StripePaymentLink;
  kind: 'stripePaymentLink';
}>;

export type CheckoutTarget = UnavailableCheckoutTarget | StripeCheckoutTarget;

export type ProOfferCard = Readonly<{
  id: ProProductId;
  product: ProProductDefinition;
  pricing: ProPricingDefinition;
  checkoutTarget: CheckoutTarget;
}>;

export type ProOffersPageData = Readonly<{
  offers: ReadonlyArray<ProOfferCard>;
  missingPaymentLinkEnvVarNames: ReadonlyArray<ProPaymentLinkEnvVarName>;
}>;

const PRO_CHECKOUT_CONFIGS: Readonly<Record<ProProductId, ProCheckoutConfig>> = {
  singleIssue: {
    productId: 'singleIssue',
    paymentLinkEnvVarName: 'STRIPE_PAYMENT_LINK_WEEKLY_PRO',
    rawPaymentLink: siteConfig.pro.weeklyProPaymentLink
  },
  monthlyBundle: {
    productId: 'monthlyBundle',
    paymentLinkEnvVarName: 'STRIPE_PAYMENT_LINK_MONTHLY_BUNDLE',
    rawPaymentLink: siteConfig.pro.monthlyBundlePaymentLink
  }
};

const getProCheckoutConfig = (productId: ProProductId): ProCheckoutConfig => PRO_CHECKOUT_CONFIGS[productId];

const toCheckoutTarget = (productId: ProProductId): CheckoutTarget => {
  const paymentLink = toStripePaymentLink(getProCheckoutConfig(productId).rawPaymentLink);

  if (!paymentLink) {
    return {
      href: CHECKOUT_UNAVAILABLE_TARGET,
      kind: 'checkoutUnavailable'
    };
  }

  return {
    href: paymentLink,
    kind: 'stripePaymentLink'
  };
};

const createProOfferCard = (productId: ProProductId): ProOfferCard => ({
  id: productId,
  product: getProProductDefinition(productId),
  pricing: getProPricingDefinition(productId),
  checkoutTarget: toCheckoutTarget(productId)
});

export const getProOfferCard = (productId: ProProductId): ProOfferCard => createProOfferCard(productId);

export const getProOfferCards = (): ReadonlyArray<ProOfferCard> => PRO_PRODUCT_IDS.map(createProOfferCard);

export const getProCheckoutTarget = (productId: ProProductId): CheckoutTarget => getProOfferCard(productId).checkoutTarget;

export const getMissingProOfferEnvVarNames = (): ReadonlyArray<ProPaymentLinkEnvVarName> =>
  PRO_PRODUCT_IDS.filter((productId) => getProCheckoutTarget(productId).kind === 'checkoutUnavailable').map(
    (productId) => getProCheckoutConfig(productId).paymentLinkEnvVarName
  );

export const hasMissingProOfferPaymentLink = (): boolean => getMissingProOfferEnvVarNames().length > 0;

export const getProOffersPageData = (): ProOffersPageData => ({
  offers: getProOfferCards(),
  missingPaymentLinkEnvVarNames: getMissingProOfferEnvVarNames()
});
