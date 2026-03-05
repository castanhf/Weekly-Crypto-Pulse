import type { Metadata } from 'next';

import { ProCta } from '@/components/pro/pro-cta';
import { createProMetadata } from '@/lib/seo';

export const metadata: Metadata = createProMetadata();

const PRO_INCLUSIONS = [
  'Full weekly report with deeper regime and factor-level market breakdowns',
  'Expanded winners/losers context with rotational narrative and relative momentum',
  'Actionable analyst framing focused on positioning risk and next-week scenarios'
] as const;

const PRO_AUDIENCE = [
  'Active traders who need a weekly directional risk check',
  'Operators and founders tracking market structure for planning decisions',
  'Allocators who want a concise macro + crypto positioning brief'
] as const;

const FREE_INCLUSIONS = [
  'Public weekly highlight summary',
  'Core market snapshot and headline context',
  'Access to the historical report archive'
] as const;

export default function ProPage(): JSX.Element {
  return (
    <section className="space-y-8">
      <header className="space-y-3 border-b border-line pb-6">
        <p className="text-sm uppercase tracking-[0.18em] text-muted">Weekly Crypto Pulse Pro</p>
        <h1 className="max-w-3xl text-4xl font-semibold tracking-tight">Get the full Pro report each week.</h1>
        <p className="max-w-2xl text-sm leading-relaxed text-muted">
          Pro is a minimal paid layer powered by Stripe Payment Links. Checkout is hosted by Stripe.
        </p>
        <ProCta label="Upgrade with Stripe" />
      </header>

      <section className="space-y-3" aria-labelledby="pro-included-heading">
        <h2 className="text-2xl font-semibold tracking-tight" id="pro-included-heading">
          What is included in the Pro report
        </h2>
        <ul className="space-y-2 text-sm text-ink">
          {PRO_INCLUSIONS.map((item) => (
            <li className="border-l-2 border-line pl-3" key={item}>
              {item}
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-3" aria-labelledby="pro-audience-heading">
        <h2 className="text-2xl font-semibold tracking-tight" id="pro-audience-heading">
          Who it is for
        </h2>
        <ul className="space-y-2 text-sm text-ink">
          {PRO_AUDIENCE.map((item) => (
            <li className="border-l-2 border-line pl-3" key={item}>
              {item}
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-3 border border-line bg-white p-6" aria-labelledby="free-included-heading">
        <h2 className="text-2xl font-semibold tracking-tight" id="free-included-heading">
          What the free version includes
        </h2>
        <ul className="space-y-2 text-sm text-ink">
          {FREE_INCLUSIONS.map((item) => (
            <li className="border-l-2 border-line pl-3" key={item}>
              {item}
            </li>
          ))}
        </ul>
      </section>
    </section>
  );
}
