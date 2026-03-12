import type { Metadata } from 'next';

import { ProCta } from '@/components/pro/pro-cta';
import { createProMetadata } from '@/lib/seo';
import { siteConfig } from '@/lib/site';

export const metadata: Metadata = createProMetadata();

type PlanComparisonRow = Readonly<{
  feature: string;
  free: string;
  pro: string;
}>;

type Deliverable = Readonly<{
  title: string;
  description: string;
}>;

type FaqItem = Readonly<{
  question: string;
  answer: string;
}>;

const PLAN_COMPARISON_ROWS: ReadonlyArray<PlanComparisonRow> = [
  {
    feature: 'Weekly market snapshot',
    free: 'Included',
    pro: 'Included'
  },
  {
    feature: 'Public report archive',
    free: 'Included',
    pro: 'Included'
  },
  {
    feature: 'Regime and factor-depth analysis',
    free: 'Headline summary only',
    pro: 'Full section with rotational context and risk framing'
  },
  {
    feature: 'Signals package',
    free: 'Not included',
    pro: 'Thesis, risk checklist, and watchlist levels'
  },
  {
    feature: 'Delivery',
    free: 'Read on site',
    pro: 'Immediate access after Stripe checkout'
  }
] as const;

const PRO_DELIVERABLES: ReadonlyArray<Deliverable> = [
  {
    title: 'Full weekly report',
    description:
      'Expanded narrative covering market regime, leadership rotation, and positioning context beyond the public summary.'
  },
  {
    title: 'Action-ready signals',
    description: 'Structured thesis bullets, explicit risk checklist, and watchlist levels to track next-week scenarios.'
  },
  {
    title: 'Consistent publication cadence',
    description: 'One Pro edition is generated each week using the same methodology and committed static report artifacts.'
  }
] as const;

const FAQ_ITEMS: ReadonlyArray<FaqItem> = [
  {
    question: 'Is this a subscription?',
    answer:
      'No. Checkout is handled by a Stripe Payment Link with no account system, entitlements, or recurring subscription management in this app.'
  },
  {
    question: 'How do I access Pro content?',
    answer:
      'Use the Stripe checkout button on this page. After payment, fulfillment follows the Pro operations process documented for Weekly Crypto Pulse.'
  },
  {
    question: 'Do I need to create an account on Weekly Crypto Pulse?',
    answer: 'No. The site does not implement user authentication or account profiles.'
  },
  {
    question: 'Can I still read free content?',
    answer: 'Yes. The free archive and public weekly highlights remain available without payment.'
  }
] as const;

export default function ProPage(): JSX.Element {
  const { hasSingleIssuePaymentLink, hasMonthlyBundlePaymentLink } = siteConfig.pro;
  const hasMissingOfferLink = !hasSingleIssuePaymentLink || !hasMonthlyBundlePaymentLink;

  return (
    <section className="space-y-8">
      <header className="space-y-3 border-b border-line pb-6">
        <p className="text-sm uppercase tracking-[0.18em] text-muted">Pricing</p>
        <h1 className="max-w-3xl text-4xl font-semibold tracking-tight">Clear weekly offer: Free vs Pro.</h1>
        <p className="max-w-2xl text-sm leading-relaxed text-muted">
          Weekly Crypto Pulse keeps the stack simple: free public reports plus a paid Pro layer through Stripe-hosted checkout.
        </p>
        <div className="flex flex-wrap gap-3">
          <ProCta label="Buy Single Issue" offer="singleIssue" />
          <ProCta
            className="inline-flex border border-ink bg-ink px-4 py-2 text-sm font-medium text-paper transition hover:opacity-90"
            label="Buy Monthly Bundle (Best Value)"
            offer="monthlyBundle"
          />
        </div>
      </header>

      {hasMissingOfferLink ? (
        <section className="space-y-2 border border-amber-300 bg-amber-50 p-4" id="checkout-unavailable">
          <h2 className="text-base font-semibold">Some checkout options are temporarily unavailable.</h2>
          <p className="text-sm text-muted">
            One or more Stripe Payment Links are not configured for this environment. Set
            <code className="mx-1 rounded bg-amber-100 px-1 py-0.5 font-mono">NEXT_PUBLIC_STRIPE_PAYMENT_LINK_SINGLE_ISSUE</code>
            and
            <code className="mx-1 rounded bg-amber-100 px-1 py-0.5 font-mono">NEXT_PUBLIC_STRIPE_PAYMENT_LINK_MONTHLY_BUNDLE</code>
            in Vercel to enable paid checkout.
          </p>
        </section>
      ) : null}

      <section aria-labelledby="comparison-heading" className="space-y-3">
        <h2 className="text-2xl font-semibold tracking-tight" id="comparison-heading">
          Free vs Pro comparison
        </h2>
        <div className="overflow-x-auto border border-line bg-white">
          <table className="min-w-full border-collapse text-left text-sm">
            <caption className="sr-only">Weekly Crypto Pulse free versus Pro plan comparison.</caption>
            <thead className="bg-paper">
              <tr>
                <th className="border-b border-line px-4 py-3 font-semibold" scope="col">
                  Feature
                </th>
                <th className="border-b border-line px-4 py-3 font-semibold" scope="col">
                  Free
                </th>
                <th className="border-b border-line px-4 py-3 font-semibold" scope="col">
                  Pro
                </th>
              </tr>
            </thead>
            <tbody>
              {PLAN_COMPARISON_ROWS.map((row) => (
                <tr className="align-top" key={row.feature}>
                  <th className="border-b border-line px-4 py-3 font-medium" scope="row">
                    {row.feature}
                  </th>
                  <td className="border-b border-line px-4 py-3 text-muted">{row.free}</td>
                  <td className="border-b border-line px-4 py-3 text-muted">{row.pro}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section aria-labelledby="deliverables-heading" className="space-y-3">
        <h2 className="text-2xl font-semibold tracking-tight" id="deliverables-heading">
          Exact Pro deliverables
        </h2>
        <ul className="space-y-3 text-sm text-ink">
          {PRO_DELIVERABLES.map((deliverable) => (
            <li className="border border-line bg-white p-4" key={deliverable.title}>
              <h3 className="text-base font-semibold tracking-tight">{deliverable.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-muted">{deliverable.description}</p>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="faq-heading" className="space-y-3">
        <h2 className="text-2xl font-semibold tracking-tight" id="faq-heading">
          FAQs
        </h2>
        <div className="space-y-3">
          {FAQ_ITEMS.map((item) => (
            <article className="border border-line bg-white p-4" key={item.question}>
              <h3 className="text-base font-semibold tracking-tight">{item.question}</h3>
              <p className="mt-1 text-sm leading-relaxed text-muted">{item.answer}</p>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}
