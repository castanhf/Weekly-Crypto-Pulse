import type { Metadata } from 'next';

import { PageSection, PageShell, SectionIntro, SurfaceCard } from '@/components/layout/page-shell';
import { composeClassNames, getCtaClassName } from '@/components/layout/ui-primitives';
import { ProCta } from '@/components/pro/pro-cta';
import { TierDifferentiation } from '@/components/pro/tier-differentiation';
import { getProOffersPageData, type ProOfferCard } from '@/lib/pro-offers';
import { createProMetadata } from '@/lib/seo';

export const metadata: Metadata = createProMetadata();

type FaqItem = Readonly<{
  question: string;
  answer: string;
}>;

type OfferMetric = Readonly<{
  label: string;
  value: string;
}>;

type OfferNarrative = Readonly<{
  emphasis: string;
  metrics: ReadonlyArray<OfferMetric>;
}>;

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
  }
] as const;

const offerCardClassNames: Record<ProOfferCard['pricing']['tier'], string> = {
  entryOffer: 'border-line/80 bg-white text-ink shadow-[0_18px_35px_rgba(16,24,40,0.05)]',
  bestValueOffer: 'border-ink bg-ink text-paper shadow-[0_24px_50px_rgba(16,24,40,0.18)]'
};

const offerSurfaceClassNames: Record<ProOfferCard['pricing']['tier'], string> = {
  entryOffer: 'border-line/80 bg-paper/80 text-ink',
  bestValueOffer: 'border-white/10 bg-white/5 text-paper'
};

const offerMutedTextClassNames: Record<ProOfferCard['pricing']['tier'], string> = {
  entryOffer: 'text-muted',
  bestValueOffer: 'text-paper/75'
};

const offerListClassNames: Record<ProOfferCard['pricing']['tier'], string> = {
  entryOffer: 'text-ink marker:text-muted',
  bestValueOffer: 'text-paper/88 marker:text-paper/45'
};

const offerCtaClassNames: Record<ProOfferCard['pricing']['tier'], string> = {
  entryOffer: getCtaClassName({ tone: 'primary' }),
  bestValueOffer: getCtaClassName({ tone: 'inverted' })
};

const offerSecondaryLinkClassNames: Record<ProOfferCard['pricing']['tier'], string> = {
  entryOffer: getCtaClassName({ tone: 'secondary' }),
  bestValueOffer: getCtaClassName({ className: 'border-white/15 text-paper hover:border-white/40 hover:bg-white/5' })
};

const OFFER_NARRATIVES: Readonly<Record<ProOfferCard['id'], OfferNarrative>> = {
  singleIssue: {
    emphasis: 'Best when one weekly setup needs an actionable posture now.',
    metrics: [
      { label: 'Coverage', value: '1 weekly Pro issue' },
      { label: 'Decision horizon', value: 'This week only' },
      { label: 'Price logic', value: '$29 for the one issue that matters now' }
    ]
  },
  monthlyBundle: {
    emphasis: 'Best when you want each weekly decision to carry forward through month-end.',
    metrics: [
      { label: 'Coverage', value: '4 weekly Pro issues + month-end synthesis' },
      { label: 'Decision horizon', value: 'Full-month continuity' },
      { label: 'Effective rate', value: '$19.75 per issue • saves $37 vs four single issues' }
    ]
  }
} as const;

function OfferCard({ offer }: Readonly<{ offer: ProOfferCard }>): JSX.Element {
  const { pricing, product, checkoutTarget } = offer;
  const narrative = OFFER_NARRATIVES[offer.id];
  const isBestValueOffer = pricing.tier === 'bestValueOffer';

  return (
    <article className={`flex h-full flex-col rounded-[2rem] border p-5 sm:p-8 ${offerCardClassNames[pricing.tier]}`}>
      <div className="space-y-7 sm:space-y-10">
        <header className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p
              className={`inline-flex rounded-full border px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.18em] ${
                isBestValueOffer ? 'border-white/10 bg-white/10 text-paper' : 'border-line/80 bg-paper text-ink'
              }`}
            >
              {pricing.valueLabel}
            </p>
            <p className={`text-sm font-medium ${offerMutedTextClassNames[pricing.tier]}`}>{pricing.comparisonHint}</p>
          </div>

          <div className="space-y-3">
            <h2 className="text-[1.7rem] font-semibold tracking-tight sm:text-[1.95rem]">{product.name}</h2>
            <p className={`text-base leading-8 ${offerMutedTextClassNames[pricing.tier]}`}>{product.shortDescription}</p>
          </div>
        </header>

        <div className={`rounded-[1.5rem] border px-5 py-7 sm:px-7 ${offerSurfaceClassNames[pricing.tier]}`}>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-current/70">One-time price</p>
          <p className="mt-3 text-4xl font-semibold tracking-tight">{pricing.displayPrice}</p>
          <p className={`mt-2 text-base leading-7 ${offerMutedTextClassNames[pricing.tier]}`}>{pricing.displayPeriodLabel}</p>
        </div>

        <div className={`rounded-[1.5rem] border px-5 py-7 sm:px-7 ${offerSurfaceClassNames[pricing.tier]}`}>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-current/70">What this buys</p>
          <p className="mt-3 text-lg font-semibold tracking-tight text-current">{narrative.emphasis}</p>

          <dl className="mt-6 grid gap-3 lg:grid-cols-3">
            {narrative.metrics.map((metric) => (
              <div
                className={`rounded-2xl border px-4 py-4 ${
                  isBestValueOffer ? 'border-white/10 bg-black/10' : 'border-line/80 bg-white'
                }`}
                key={metric.label}
              >
                <dt className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-current/65">{metric.label}</dt>
                <dd className="mt-2 text-base font-medium leading-7 text-current">{metric.value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="space-y-7 sm:space-y-8">
          <div>
            <h3 className="text-base font-semibold text-current">Included in this offer</h3>
            <ul className={`mt-5 list-disc space-y-3.5 pl-5 text-base leading-8 ${offerListClassNames[pricing.tier]}`}>
              {product.includes.map((deliverable) => (
                <li key={deliverable}>{deliverable}</li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-base font-semibold text-current">Best used when</h3>
            <p className={`mt-3 text-base leading-8 ${offerMutedTextClassNames[pricing.tier]}`}>{product.audience}</p>
          </div>

          <div>
            <h3 className="text-base font-semibold text-current">Not included</h3>
            <ul className={`mt-5 list-disc space-y-3.5 pl-5 text-base leading-8 ${offerListClassNames[pricing.tier]}`}>
              {product.excludes.map((exclusion) => (
                <li key={exclusion}>{exclusion}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="mt-10 flex flex-col gap-4 border-t border-current/10 pt-7 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <p className={`max-w-md text-base leading-8 ${offerMutedTextClassNames[pricing.tier]}`}>{product.deliveryModel}</p>
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap">
          <ProCta className={composeClassNames(offerCtaClassNames[pricing.tier], 'w-full sm:w-auto')} checkoutTarget={checkoutTarget} label={product.ctaLabel} />
          <a
            className={composeClassNames(offerSecondaryLinkClassNames[pricing.tier], 'w-full sm:w-auto')}
            href="#tier-differentiation-heading"
          >
            Compare tiers
          </a>
        </div>
      </div>
    </article>
  );
}

export default function ProPage(): JSX.Element {
  const { missingPaymentLinkEnvVarNames, offers } = getProOffersPageData();
  const hasMissingOfferLink = missingPaymentLinkEnvVarNames.length > 0;

  return (
    <PageShell>
      <section className="rounded-[2rem] bg-brand px-6 py-12 sm:px-10 sm:py-16 lg:px-14 lg:py-20">
        <div className="space-y-10 sm:space-y-12">
          <header className="max-w-2xl space-y-4">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-white/60">Pro offers</p>
            <h1 className="text-[2rem] font-semibold tracking-tight text-white sm:text-[2.8rem] sm:leading-[1.1]">
              One issue or the full month.<br />Both are one-time purchases.
            </h1>
            <p className="text-base leading-8 text-white/70">
              No subscription. No account. Stripe checkout confirms your purchase — pick the coverage that fits your decision horizon.
            </p>
          </header>
          <div className="grid gap-7 lg:grid-cols-2 lg:items-stretch">
            {offers.map((offer) => (
              <OfferCard key={offer.id} offer={offer} />
            ))}
          </div>
        </div>

        {hasMissingOfferLink ? (
          <SurfaceCard className="mt-6 space-y-3 border-amber-300 bg-amber-50" id="checkout-unavailable">
            <h2 className="text-base font-semibold">Some checkout options are temporarily unavailable.</h2>
            <p className="text-base leading-8 text-muted">
              One or more Stripe Payment Links are not configured for this environment. Set{' '}
              {missingPaymentLinkEnvVarNames.map((envVarName) => (
                <code className="mx-1 rounded bg-amber-100 px-1 py-0.5 font-mono" key={envVarName}>
                  {envVarName}
                </code>
              ))}
              in Vercel to enable paid checkout.
            </p>
          </SurfaceCard>
        ) : null}
      </section>

      <TierDifferentiation
        description="Free stays public for orientation. Single Issue covers one decision week. Monthly Bundle adds the continuity layer across the month."
        title="Plan comparison"
      />

      <PageSection aria-labelledby="before-you-buy-heading" className="space-y-6">
        <SectionIntro
          description="Everything is structured to keep checkout and fulfillment clear: Stripe handles payment identity, products are one-time purchases, and the site has no account system."
          id="before-you-buy-heading"
          title="Before you buy"
        />

        <SurfaceCard className="border-line/80 bg-white p-0">
          <div className="divide-y divide-line/70">
            {FAQ_ITEMS.map((item) => (
              <article className="space-y-3 px-5 py-5 sm:px-6" key={item.question}>
                <h2 className="text-base font-semibold tracking-tight text-ink">{item.question}</h2>
                <p className="text-base leading-8 text-muted">{item.answer}</p>
              </article>
            ))}
          </div>
        </SurfaceCard>
      </PageSection>
    </PageShell>
  );
}
