'use client';

import Link from 'next/link';

import { trackEvent } from '@/lib/analytics/events';
import { siteConfig } from '@/lib/site';

type ProCtaProps = Readonly<{
  className?: string;
  label?: string;
}>;

type CheckoutTarget = Readonly<{
  href: string;
  isExternal: boolean;
}>;

const getCheckoutTarget = (): CheckoutTarget => {
  const { hasStripePaymentLink, stripePaymentLink } = siteConfig.pro;

  if (!hasStripePaymentLink) {
    return {
      href: '/pro#checkout-unavailable',
      isExternal: false
    };
  }

  return {
    href: stripePaymentLink,
    isExternal: true
  };
};

export function ProCta({ className, label = 'Upgrade to Pro' }: ProCtaProps): JSX.Element {
  const checkoutTarget = getCheckoutTarget();

  const handleClick = (): void => {
    trackEvent('click_pro_cta', {
      destination: checkoutTarget.href,
      isOutbound: checkoutTarget.isExternal
    });

    if (!checkoutTarget.isExternal) {
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
