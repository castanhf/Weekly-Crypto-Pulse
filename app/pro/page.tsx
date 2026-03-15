import type { Metadata } from 'next';

import { ProCta } from '@/components/pro/pro-cta';
import { createProMetadata } from '@/lib/seo';
import { getMissingProOfferEnvVarNames, hasMissingProOfferPaymentLink, type ProOffer } from '@/lib/pro-offers';

export const metadata: Metadata = createProMetadata();

type PlanComparisonRow = Readonly<{
  feature: string;
  free: string;
  paid: string;
}>;

type OfferCard = Readonly<{
  offer: ProOffer;
  badge?: string;
  title: string;
  positioning: string;
  deliverables: ReadonlyArray<string>;
  ctaLabel: string;
}>;

type FaqItem = Readonly<{
  question: string;
  answer: string;
}>;

const PLAN_COMPARISON_ROWS: ReadonlyArray<PlanComparisonRow> = [
  {
    feature: 'Weekly orientation',
    free: 'Public summary, headline context, and archive browsing',
    paid: 'Action-focused report built for weekly decision support'
  },
  {
    feature: 'Depth of analysis',
    free: 'High-level narrative only',
    paid: 'Full regime, factors, rotations, and scenario framing'
  },
  {
    feature: 'Signals and risk controls',
    free: 'Not included',
    paid: 'Thesis, watchlist levels, and explicit risk checklist'
  },
  {
    feature: 'Monetization model',
    free: 'Free access',
    paid: 'One-time Stripe checkout only (no subscriptions)'
  },
  {
    feature: 'Fulfillment source of truth',
    free: 'Not required',
    paid: 'Stripe payment record'
  }
] as const;

const OFFER_CARDS: ReadonlyArray<OfferCard> = [
  {
    offer: 'singleIssue',
    title: 'Weekly Crypto Pulse Pro — Single Issue',
    positioning: 'Entry offer for one week when you need a focused decision brief.',
    deliverables: [
      'One Pro weekly report for the selected issue',
      'Full narrative: regime, factor flow, and rotation context',
      'Signals package: thesis bullets, risk checklist, and watchlist levels'
    ],
    ctaLabel: 'Buy Single Issue'
  },
  {
    offer: 'monthlyBundle',
    badge: 'Best value',
    title: 'Weekly Crypto Pulse Pro — Monthly Bundle',
    positioning: 'Continuity offer for month-long tracking across weekly updates.',
    deliverables: [
      'Four Pro weekly issues for the active month',
      'Same full report structure each week for consistency',
      'Better per-issue value than buying each issue individually'
    ],
    ctaLabel: 'Buy Monthly Bundle'
  }
] as const;

const FAQ_ITEMS: ReadonlyArray<FaqItem> = [
  {
    question: 'Is this a subscription?',
    answer:
      'No. Both products are one-time purchases through Stripe Payment Links. Weekly Crypto Pulse does not run subscription billing.'
  },
  {
    question: 'Do I need an account or login?',
    answer:
      'No. This site has no user authentication and no entitlement system. Stripe checkout confirms purchase identity and payment status.'
  },
  {
    question: 'How is Pro access delivered?',
    answer:
      'After successful Stripe checkout, fulfillment follows the existing Pro operations workflow. Stripe payment details are the source of truth for fulfillment.'
  },
  {
    question: 'Can I continue reading free content?',
    answer:
      'Yes. Free report summaries, archive pages, methodology, and disclaimer content remain publicly available.'
  }
] as const;

export default function ProPage(): JSX.Element {
  const hasMissingOfferLink = hasMissingProOfferPaymentLink();
  const missingEnvVarNames = getMissingProOfferEnvVarNames();

  return (
    <section className="space-y-8">
      <header className="space-y-3 border-b border-line pb-6">
        <p className="text-sm uppercase tracking-[0.18em] text-muted">Pricing</p>
        <h1 className="max-w-3xl text-4xl font-semibold tracking-tight">Choose a one-time Pro offer.</h1>
        <p className="max-w-3xl text-sm leading-relaxed text-muted">
          Free content is built for orientation. Pro content is built for weekly decision support. Pick a single issue for
          immediate context or choose the monthly bundle for continuity across the month.
        </p>
      </header>

      {hasMissingOfferLink ? (
        <section className="space-y-2 border border-amber-300 bg-amber-50 p-4" id="checkout-unavailable">
          <h2 className="text-base font-semibold">Some checkout options are temporarily unavailable.</h2>
          <p className="text-sm text-muted">
            One or more Stripe Payment Links are not configured for this environment. Set{' '}
            {missingEnvVarNames.map((envVarName) => (
              <code className="mx-1 rounded bg-amber-100 px-1 py-0.5 font-mono" key={envVarName}>
                {envVarName}
              </code>
            ))}
            in Vercel to enable paid checkout.
          </p>
        </section>
      ) : null}

      <section aria-labelledby="offers-heading" className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight" id="offers-heading">
          Paid offers and exact deliverables
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          {OFFER_CARDS.map((offerCard) => (
            <article className="space-y-4 border border-line bg-white p-5" key={offerCard.title}>
              <div className="space-y-2">
                {offerCard.badge ? (
                  <p className="inline-flex bg-ink px-2 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-paper">
                    {offerCard.badge}
                  </p>
                ) : null}
                <h3 className="text-xl font-semibold tracking-tight">{offerCard.title}</h3>
                <p className="text-sm leading-relaxed text-muted">{offerCard.positioning}</p>
              </div>

              <ul className="list-disc space-y-2 pl-5 text-sm text-ink">
                {offerCard.deliverables.map((deliverable) => (
                  <li key={deliverable}>{deliverable}</li>
                ))}
              </ul>

              <ProCta
                className="inline-flex border border-ink px-4 py-2 text-sm font-medium transition hover:bg-ink hover:text-paper"
                label={offerCard.ctaLabel}
                offer={offerCard.offer}
              />
            </article>
          ))}
        </div>
      </section>

      <section aria-labelledby="comparison-heading" className="space-y-3">
        <h2 className="text-2xl font-semibold tracking-tight" id="comparison-heading">
          Free vs paid comparison
        </h2>
        <div className="overflow-x-auto border border-line bg-white">
          <table className="min-w-full border-collapse text-left text-sm">
            <caption className="sr-only">Weekly Crypto Pulse free versus paid offer comparison.</caption>
            <thead className="bg-paper">
              <tr>
                <th className="border-b border-line px-4 py-3 font-semibold" scope="col">
                  Feature
                </th>
                <th className="border-b border-line px-4 py-3 font-semibold" scope="col">
                  Free
                </th>
                <th className="border-b border-line px-4 py-3 font-semibold" scope="col">
                  Paid (Single Issue or Monthly Bundle)
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
                  <td className="border-b border-line px-4 py-3 text-muted">{row.paid}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
