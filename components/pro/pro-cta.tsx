import Link from 'next/link';

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
  const { stripePaymentLink } = siteConfig.pro;

  if (stripePaymentLink.length === 0) {
    return {
      href: '/pro',
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

  return (
    <Link
      className={
        className ??
        'inline-flex border border-ink px-4 py-2 text-sm font-medium transition hover:bg-ink hover:text-paper'
      }
      href={checkoutTarget.href}
      rel={checkoutTarget.isExternal ? 'noopener noreferrer' : undefined}
      target={checkoutTarget.isExternal ? '_blank' : undefined}
    >
      {label}
    </Link>
  );
}
