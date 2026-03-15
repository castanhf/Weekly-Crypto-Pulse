import { siteConfig } from '@/lib/site';
import type { ProProductId } from '@/domain/pro-product';

export type ProOffer = ProProductId;

export type CheckoutTarget = Readonly<{
  href: string;
  isExternal: boolean;
}>;

type ProOfferSettings = Readonly<{
  envVarName: string;
  paymentLink: string;
  hasPaymentLink: boolean;
}>;

const PRO_OFFER_SETTINGS: Readonly<Record<ProOffer, ProOfferSettings>> = {
  singleIssue: {
    envVarName: 'NEXT_PUBLIC_STRIPE_PAYMENT_LINK_SINGLE_ISSUE',
    paymentLink: siteConfig.pro.singleIssuePaymentLink,
    hasPaymentLink: siteConfig.pro.hasSingleIssuePaymentLink
  },
  monthlyBundle: {
    envVarName: 'NEXT_PUBLIC_STRIPE_PAYMENT_LINK_MONTHLY_BUNDLE',
    paymentLink: siteConfig.pro.monthlyBundlePaymentLink,
    hasPaymentLink: siteConfig.pro.hasMonthlyBundlePaymentLink
  }
} as const;

const CHECKOUT_UNAVAILABLE_TARGET = '/pro#checkout-unavailable';

export const getProCheckoutTarget = (offer: ProOffer): CheckoutTarget => {
  const offerSettings = PRO_OFFER_SETTINGS[offer];

  if (!offerSettings.hasPaymentLink) {
    return {
      href: CHECKOUT_UNAVAILABLE_TARGET,
      isExternal: false
    };
  }

  return {
    href: offerSettings.paymentLink,
    isExternal: true
  };
};

export const getMissingProOfferEnvVarNames = (): ReadonlyArray<string> =>
  (Object.values(PRO_OFFER_SETTINGS) as ReadonlyArray<ProOfferSettings>)
    .filter((offerSettings) => !offerSettings.hasPaymentLink)
    .map((offerSettings) => offerSettings.envVarName);

export const hasMissingProOfferPaymentLink = (): boolean => getMissingProOfferEnvVarNames().length > 0;
