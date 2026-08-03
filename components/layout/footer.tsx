import Link from 'next/link';

import { NewsletterSignup } from '@/components/email/newsletter-signup';
import { pageContainerClassName } from '@/components/layout/page-shell';

const primaryFooterLinks = [
  { href: '/reports', label: 'Reports archive' },
  { href: '/pro', label: 'Pro offers' },
  { href: '/methodology', label: 'Methodology' },
  { href: '/disclaimer', label: 'Disclaimer' },
  { href: '/privacy', label: 'Privacy policy' },
  { href: '/terms', label: 'Terms of use' }
] as const;

export function Footer(): JSX.Element {
  return (
    <footer className="border-t border-white/10 bg-canvas">
      <div className={`${pageContainerClassName} py-10 sm:py-12`}>
        <div className="grid gap-9 border border-white/10 bg-surface/70 p-6 sm:rounded-[1.75rem] sm:p-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:gap-12 lg:p-10">
          <div className="space-y-4">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-muted">Crypto Pulse</p>
            <p className="max-w-2xl text-base leading-8 text-muted">
              Static-first weekly crypto research with a clear editorial ladder from free orientation to paid decision and continuity.
            </p>
            <div className="space-y-2 pt-2">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Get it in your inbox</p>
              <NewsletterSignup />
            </div>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 sm:gap-10 lg:justify-items-end">
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Navigate</p>
              <ul className="space-y-2.5 text-sm text-muted">
                {primaryFooterLinks.map((link) => (
                  <li key={link.href}>
                    <Link className="transition hover:text-paper" href={link.href}>
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Positioning</p>
              <ul className="space-y-2.5 text-sm leading-6 text-muted">
                <li>Free: weekly orientation</li>
                <li>Weekly Pro: one decision cycle</li>
                <li>Monthly Bundle: continuity across the month</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
