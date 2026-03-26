import type { Metadata } from 'next';

import { PageSection, PageShell, SectionIntro, SurfaceCard } from '@/components/layout/page-shell';
import { ProCta } from '@/components/pro/pro-cta';
import { TierDifferentiation } from '@/components/pro/tier-differentiation';
import { getProOffersPageData, type ProOfferCard } from '@/lib/pro-offers';
import { createProMetadata } from '@/lib/seo';

export const metadata: Metadata = createProMetadata();

type FaqItem = Readonly<{
  question: string;
  answer: string;
}>;

type HeroNote = Readonly<{
  title: string;
  description: string;
}>;

type HierarchyStep = Readonly<{
  role: string;
  title: string;
  description: string;
  className: string;
}>;

type OfferMetric = Readonly<{
  label: string;
  value: string;
}>;

type OfferNarrative = Readonly<{
  emphasis: string;
  metrics: ReadonlyArray<OfferMetric>;
}>;

const HERO_NOTES: ReadonlyArray<HeroNote> = [
  {
    title: 'Single Issue',
    description: 'Entry paid offer for one immediate decision cycle.'
  },
  {
    title: 'Monthly Bundle',
    description: 'Most complete package for continuity across the full month.'
  }
] as const;

const HIERARCHY_STEPS: ReadonlyArray<HierarchyStep> = [
  {
    role: 'Free',
    title: 'Orientation',
    description: 'Read the public issue first to map the current setup.',
    className: 'border-line/80 bg-white text-ink'
  },
  {
    role: 'Weekly Pro',
    title: 'Decision support',
    description: 'Upgrade for one issue when this week needs a clear posture.',
    className: 'border-ink bg-ink text-paper'
  },
  {
    role: 'Monthly Bundle',
    title: 'Continuity',
    description: 'Stay connected across all weekly issues with month-end synthesis.',
    className: 'border-amber-200 bg-amber-50 text-amber-950'
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
  }
] as const;

const offerCardClassNames: Record<ProOfferCard['pricing']['tier'], string> = {
  entryOffer: 'border-line/80 bg-white text-ink shadow-[0_18px_35px_rgba(16,24,40,0.05)]',
  bestValueOffer:
    'border-ink bg-ink text-paper shadow-[0_24px_50px_rgba(16,24,40,0.18)] lg:-translate-y-3 lg:scale-[1.02]'
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
  entryOffer: 'border border-ink bg-ink text-paper hover:bg-ink/90',
  bestValueOffer: 'border border-white bg-white text-ink hover:bg-paper'
};

const offerSecondaryLinkClassNames: Record<ProOfferCard['pricing']['tier'], string> = {
  entryOffer: 'border-line text-ink hover:border-ink',
  bestValueOffer: 'border-white/15 text-paper hover:border-white/40 hover:bg-white/5'
};

const OFFER_NARRATIVES: Readonly<Record<ProOfferCard['id'], OfferNarrative>> = {
  singleIssue: {
    emphasis: 'A focused purchase for one decision cycle.',
    metrics: [
      { label: 'Coverage', value: '1 weekly Pro issue' },
      { label: 'Workflow fit', value: 'One immediate decision memo' },
      { label: 'Effective rate', value: '$29 per issue' }
    ]
  },
  monthlyBundle: {
    emphasis: 'The continuity option for readers who want the thesis to compound across the month.',
    metrics: [
      { label: 'Coverage', value: '4 weekly Pro issues + month-end synthesis' },
      { label: 'Workflow fit', value: 'Connected weekly decisions across the month' },
      { label: 'Effective rate', value: '$19.75 per issue • saves $37 vs four single issues' }
    ]
  }
} as const;

function OfferCard({ offer }: Readonly<{ offer: ProOfferCard }>): JSX.Element {
  const { pricing, product, checkoutTarget } = offer;
  const narrative = OFFER_NARRATIVES[offer.id];
  const isBestValueOffer = pricing.tier === 'bestValueOffer';

  return (
    <article className={`flex h-full flex-col rounded-[2rem] border p-6 sm:p-8 lg:p-9 ${offerCardClassNames[pricing.tier]}`}>
      <div className="flex flex-1 flex-col gap-6">
        <div className="space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-3">
              <p
                className={`inline-flex rounded-full border px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.18em] ${
                  isBestValueOffer ? 'border-white/10 bg-white/10 text-paper' : 'border-line/80 bg-paper text-ink'
                }`}
              >
                {pricing.valueLabel}
              </p>
              <div className="space-y-2">
                <h2 className="text-[1.75rem] font-semibold tracking-tight sm:text-[2.05rem]">{product.name}</h2>
                <p className={`max-w-xl text-base leading-8 ${offerMutedTextClassNames[pricing.tier]}`}>{product.shortDescription}</p>
              </div>
            </div>

            <div
              className={`min-w-[10rem] rounded-[1.5rem] border px-5 py-4 text-left sm:text-right ${offerSurfaceClassNames[pricing.tier]}`}
            >
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-current/70">One-time price</p>
              <p className="mt-3 text-3xl font-semibold tracking-tight">{pricing.displayPrice}</p>
              <p className={`mt-2 text-base leading-7 ${offerMutedTextClassNames[pricing.tier]}`}>{pricing.displayPeriodLabel}</p>
            </div>
          </div>

          <div className={`rounded-[1.5rem] border px-5 py-5 ${offerSurfaceClassNames[pricing.tier]}`}>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-current/70">What this buys</p>
                <p className="text-lg font-semibold tracking-tight text-current">{narrative.emphasis}</p>
              </div>
              <p className={`max-w-md text-base leading-8 ${offerMutedTextClassNames[pricing.tier]}`}>{pricing.comparisonHint}</p>
            </div>

            <dl className="mt-5 grid gap-3 sm:grid-cols-3">
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
        </div>

        <div className="grid gap-3 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
          <div className={`rounded-[1.5rem] border px-5 py-5 ${offerSurfaceClassNames[pricing.tier]}`}>
            <h3 className="text-base font-semibold text-current">Included in this offer</h3>
            <ul className={`mt-4 list-disc space-y-2.5 pl-5 text-base leading-8 ${offerListClassNames[pricing.tier]}`}>
              {product.includes.map((deliverable) => (
                <li key={deliverable}>{deliverable}</li>
              ))}
            </ul>
          </div>

          <div className="grid gap-3">
            <div className={`rounded-[1.5rem] border px-5 py-5 ${offerSurfaceClassNames[pricing.tier]}`}>
              <h3 className="text-base font-semibold text-current">Best used when</h3>
              <p className={`mt-3 text-base leading-8 ${offerMutedTextClassNames[pricing.tier]}`}>{product.audience}</p>
            </div>

            <div className={`rounded-[1.5rem] border px-5 py-5 ${offerSurfaceClassNames[pricing.tier]}`}>
              <h3 className="text-base font-semibold text-current">Not included</h3>
              <ul className={`mt-3 list-disc space-y-2.5 pl-5 text-base leading-8 ${offerListClassNames[pricing.tier]}`}>
                {product.excludes.map((exclusion) => (
                  <li key={exclusion}>{exclusion}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3 border-t border-current/10 pt-6 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <p className={`max-w-md text-base leading-8 ${offerMutedTextClassNames[pricing.tier]}`}>{product.deliveryModel}</p>
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap">
          <ProCta
            className={`inline-flex min-h-11 w-full items-center justify-center rounded-xl px-4 py-3 text-center text-sm font-medium transition sm:w-auto ${offerCtaClassNames[pricing.tier]}`}
            checkoutTarget={checkoutTarget}
            label={product.ctaLabel}
          />
          <a
            className={`inline-flex min-h-11 w-full items-center justify-center rounded-xl border px-4 py-3 text-center text-sm font-medium transition sm:w-auto ${offerSecondaryLinkClassNames[pricing.tier]}`}
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
      <section className="rounded-[2rem] border border-line/80 bg-gradient-to-br from-white via-white to-paper/70 p-5 shadow-[0_20px_50px_rgba(16,24,40,0.06)] sm:p-8 lg:p-10">
        <div className="grid gap-8 xl:grid-cols-[minmax(0,0.78fr)_minmax(0,1.22fr)] xl:items-start">
          <div className="space-y-6 xl:sticky xl:top-24">
            <div className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted">Pro offers</p>
              <div className="space-y-3">
                <h1 className="max-w-2xl text-[2rem] font-semibold tracking-tight sm:text-[3.2rem] sm:leading-[1.06]">
                  Choose the paid scope that matches the job this week.
                </h1>
                <p className="max-w-2xl text-base leading-8 text-muted">
                  Weekly Crypto Pulse keeps the buying decision simple: one issue when you need a single decision memo,
                  or the Monthly Bundle when you want the thesis to stay connected across the month.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">Hierarchy at a glance</p>
              <div className="grid gap-3">
                {HIERARCHY_STEPS.map((step) => (
                  <div className={`rounded-2xl border px-5 py-5 ${step.className}`} key={step.role}>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-current/70">{step.role}</p>
                      <span aria-hidden="true" className="text-current/45">→</span>
                      <p className="text-base font-semibold tracking-tight text-current">{step.title}</p>
                    </div>
                    <p className="mt-2 text-base leading-8 text-current/80">{step.description}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              {HERO_NOTES.map((note) => (
                <div className="rounded-2xl border border-line/80 bg-white px-5 py-5" key={note.title}>
                  <p className="text-base font-semibold tracking-tight text-ink">{note.title}</p>
                  <p className="mt-2 text-base leading-8 text-muted">{note.description}</p>
                </div>
              ))}
            </div>

            <dl className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
              <div className="rounded-xl border border-line/80 bg-paper px-4 py-4">
                <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">Purchase model</dt>
                <dd className="mt-2 text-base font-medium text-ink">One-time Stripe checkout</dd>
              </div>
              <div className="rounded-xl border border-line/80 bg-paper px-4 py-4">
                <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">Buyer identity</dt>
                <dd className="mt-2 text-base font-medium text-ink">Stripe payment details</dd>
              </div>
              <div className="rounded-xl border border-line/80 bg-paper px-4 py-4">
                <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">Site model</dt>
                <dd className="mt-2 text-base font-medium text-ink">Static-first, no accounts</dd>
              </div>
            </dl>

            <div className="rounded-2xl border border-line/80 bg-white px-5 py-5">
              <p className="text-base font-semibold text-ink">Editorial hierarchy</p>
              <p className="mt-2 text-base leading-8 text-muted">
                Free remains orientation. Weekly Pro turns one issue into an actionable decision memo. Monthly Bundle adds the continuity layer that keeps the thesis connected across the month.
              </p>
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-2 lg:items-stretch lg:pt-3">
            {offers.map((offer) => (
              <OfferCard key={offer.id} offer={offer} />
            ))}
          </div>
        </div>

        {hasMissingOfferLink ? (
          <SurfaceCard className="mt-4 space-y-3 border-amber-300 bg-amber-50" id="checkout-unavailable">
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

      <PageSection aria-labelledby="offers-heading">
        <SectionIntro
          description="The paid products stay intentionally simple. Both use Stripe Payment Links, both are one-time purchases, and the real choice is whether you need one weekly decision or continuity across the month."
          id="offers-heading"
          title="Before you buy"
        />

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:items-start">
          <SurfaceCard className="space-y-4 bg-white">
            <h2 className="text-lg font-semibold tracking-tight">Decision guide</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-line/80 bg-paper px-4 py-4">
                <h3 className="text-base font-semibold">Choose Single Issue</h3>
                <p className="mt-2 text-base leading-8 text-muted">
                  You want a focused brief for the current setup and do not need the thesis carried through the rest of the month.
                </p>
              </div>
              <div className="rounded-2xl border border-line/80 bg-paper px-4 py-4">
                <h3 className="text-base font-semibold">Choose Monthly Bundle</h3>
                <p className="mt-2 text-base leading-8 text-muted">
                  You want each weekly decision to build on the last one, with continuity across the month and a closing synthesis.
                </p>
              </div>
            </div>
          </SurfaceCard>

          <div className="grid gap-4">
            {FAQ_ITEMS.map((item) => (
              <SurfaceCard className="space-y-3 bg-paper" key={item.question}>
                <h2 className="text-base font-semibold tracking-tight">{item.question}</h2>
                <p className="text-base leading-8 text-muted">{item.answer}</p>
              </SurfaceCard>
            ))}
          </div>
        </div>
      </PageSection>

      <TierDifferentiation
        description="Each tier answers a different reader need: public orientation, a single-week decision memo, or a continuity workflow that ties the month together."
        title="Editorial hierarchy by function"
      />
    </PageShell>
  );
}
