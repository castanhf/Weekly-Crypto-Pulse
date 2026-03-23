'use client';

import Link from 'next/link';

import { trackEvent } from '@/lib/analytics/events';
import type { CheckoutTarget } from '@/lib/pro-offers';

type ProCtaProps = Readonly<{
  className?: string;
  label?: string;
  checkoutTarget: CheckoutTarget;
}>;

export function ProCta({ className, label = 'Upgrade to Pro', checkoutTarget }: ProCtaProps): JSX.Element {
  const isStripeCheckout = checkoutTarget.kind === 'stripePaymentLink';

  const handleClick = (): void => {
    trackEvent('click_pro_cta', {
      destination: checkoutTarget.href,
      isOutbound: isStripeCheckout
    });

    if (!isStripeCheckout) {
      return;
    }

    trackEvent('outbound_stripe_payment_link', {
      destination: checkoutTarget.href,
      isOutbound: true
    });
  };

  return (
    <Link
      className={
        className ??
        'inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-ink px-4 py-3 text-center text-sm font-medium transition hover:bg-ink hover:text-paper sm:w-auto'
      }
      href={checkoutTarget.href}
      onClick={handleClick}
      rel={isStripeCheckout ? 'noopener noreferrer' : undefined}
      target={isStripeCheckout ? '_blank' : undefined}
    >
      {label}
    </Link>
  );
}
