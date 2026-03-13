'use client';

import Link from 'next/link';

import { trackEvent } from '@/lib/analytics/events';
import { isStripePaymentLink } from '@/lib/analytics/stripe-link';
import { siteConfig } from '@/lib/site';

type ProOffer = 'singleIssue' | 'monthlyBundle';

type ProCtaProps = Readonly<{
  className?: string;
  label?: string;
  offer?: ProOffer;
}>;

type CheckoutTarget = Readonly<{
  href: string;
  isExternal: boolean;
}>;

const getCheckoutTarget = (offer: ProOffer): CheckoutTarget => {
  if (offer === 'monthlyBundle') {
    if (!siteConfig.pro.hasMonthlyBundlePaymentLink) {
      return {
        href: '/pro#checkout-unavailable',
        isExternal: false
      };
    }

    return {
      href: siteConfig.pro.monthlyBundlePaymentLink,
      isExternal: true
    };
  }

  if (!siteConfig.pro.hasSingleIssuePaymentLink) {
    return {
      href: '/pro#checkout-unavailable',
      isExternal: false
    };
  }

  return {
    href: siteConfig.pro.singleIssuePaymentLink,
    isExternal: true
  };
};

export function ProCta({ className, label = 'Upgrade to Pro', offer = 'singleIssue' }: ProCtaProps): JSX.Element {
  const checkoutTarget = getCheckoutTarget(offer);

  const handleClick = (): void => {
    trackEvent('click_pro_cta', {
      destination: checkoutTarget.href,
      isOutbound: checkoutTarget.isExternal
    });

    if (!checkoutTarget.isExternal || !isStripePaymentLink(checkoutTarget.href)) {
      return;
    }

    trackEvent('outbound_stripe_payment_link', {
      destination: checkoutTarget.href,
      isOutbound: checkoutTarget.isExternal
    });
  };

  return (
    <Link
      className={
        className ??
        'inline-flex border border-ink px-4 py-2 text-sm font-medium transition hover:bg-ink hover:text-paper'
      }
      href={checkoutTarget.href}
      onClick={handleClick}
      rel={checkoutTarget.isExternal ? 'noopener noreferrer' : undefined}
      target={checkoutTarget.isExternal ? '_blank' : undefined}
    >
      {label}
    </Link>
  );
}
