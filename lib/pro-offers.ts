import type { ProProductId } from '@/domain/pro-product';
import { siteConfig } from '@/lib/site';
import { toStripePaymentLinkOrEmpty } from '@/lib/stripe/payment-links';

export type CheckoutTarget = Readonly<{
  href: string;
  isExternal: boolean;
}>;

type ProCheckoutConfig = Readonly<{
  productId: ProProductId;
  envVarName: 'STRIPE_PAYMENT_LINK_WEEKLY_PRO' | 'STRIPE_PAYMENT_LINK_MONTHLY_BUNDLE';
  paymentLink: string;
}>;

const CHECKOUT_UNAVAILABLE_TARGET = '/pro#checkout-unavailable';

const createCheckoutConfig = (
  productId: ProProductId,
  envVarName: ProCheckoutConfig['envVarName'],
  rawPaymentLink: string
): ProCheckoutConfig => ({
  productId,
  envVarName,
  paymentLink: toStripePaymentLinkOrEmpty(rawPaymentLink)
});

const PRO_CHECKOUT_CONFIGS: Readonly<Record<ProProductId, ProCheckoutConfig>> = {
  singleIssue: createCheckoutConfig('singleIssue', 'STRIPE_PAYMENT_LINK_WEEKLY_PRO', siteConfig.pro.weeklyProPaymentLink),
  monthlyBundle: createCheckoutConfig(
    'monthlyBundle',
    'STRIPE_PAYMENT_LINK_MONTHLY_BUNDLE',
    siteConfig.pro.monthlyBundlePaymentLink
  )
};

const hasCheckoutLink = (productId: ProProductId): boolean => PRO_CHECKOUT_CONFIGS[productId].paymentLink.length > 0;

export const getProCheckoutTarget = (productId: ProProductId): CheckoutTarget => {
  const checkoutConfig = PRO_CHECKOUT_CONFIGS[productId];

  if (!hasCheckoutLink(productId)) {
    return {
      href: CHECKOUT_UNAVAILABLE_TARGET,
      isExternal: false
    };
  }

  return {
    href: checkoutConfig.paymentLink,
    isExternal: true
  };
};

export const getMissingProOfferEnvVarNames = (): ReadonlyArray<ProCheckoutConfig['envVarName']> =>
  (Object.values(PRO_CHECKOUT_CONFIGS) as ReadonlyArray<ProCheckoutConfig>)
    .filter((checkoutConfig) => checkoutConfig.paymentLink.length === 0)
    .map((checkoutConfig) => checkoutConfig.envVarName);

export const hasMissingProOfferPaymentLink = (): boolean => getMissingProOfferEnvVarNames().length > 0;
