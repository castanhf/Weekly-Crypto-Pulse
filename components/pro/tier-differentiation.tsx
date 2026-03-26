import { PageSection, SectionIntro, SurfaceCard } from '@/components/layout/page-shell';
import { CONTENT_TIER_IDS, type ContentTierId, getContentBlockLabel, getContentTierDefinition } from '@/domain/content-tier';

type TierDifferentiationProps = Readonly<{
  description: string;
  title: string;
}>;

type TierPresentation = Readonly<{
  badgeClassName: string;
  cardClassName: string;
  icon: string;
  railClassName: string;
  toneLabel: string;
}>;

const TIER_PRESENTATIONS: Readonly<Record<ContentTierId, TierPresentation>> = {
  free: {
    badgeClassName: 'border-line/80 bg-paper text-ink',
    cardClassName: 'border-line/80 bg-white',
    icon: '◎',
    railClassName: 'border-line',
    toneLabel: 'Orientation layer'
  },
  weeklyPro: {
    badgeClassName: 'border-ink/15 bg-ink text-paper',
    cardClassName: 'border-ink/15 bg-gradient-to-br from-ink to-neutral-800 text-paper',
    icon: '◉',
    railClassName: 'border-paper/35',
    toneLabel: 'Decision layer'
  },
  monthlyBundle: {
    badgeClassName: 'border-amber-200 bg-amber-50 text-amber-900',
    cardClassName: 'border-amber-200 bg-gradient-to-br from-amber-50 via-white to-amber-100/60',
    icon: '◆',
    railClassName: 'border-amber-200',
    toneLabel: 'Continuity layer'
  }
} as const;

const mutedClassByTierId: Readonly<Record<ContentTierId, string>> = {
  free: 'text-muted',
  weeklyPro: 'text-paper/78',
  monthlyBundle: 'text-muted'
};

const listClassByTierId: Readonly<Record<ContentTierId, string>> = {
  free: 'text-ink marker:text-muted',
  weeklyPro: 'text-paper/90 marker:text-paper/45',
  monthlyBundle: 'text-ink marker:text-muted'
};

export function TierDifferentiation({ description, title }: TierDifferentiationProps): JSX.Element {
  return (
    <PageSection aria-labelledby="tier-differentiation-heading" className="space-y-6">
      <SectionIntro description={description} id="tier-differentiation-heading" title={title} />

      <SurfaceCard className="space-y-4 border-line/80 bg-gradient-to-r from-white via-paper/35 to-white px-5 py-5 sm:px-6">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">Usage ladder</p>
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-xl border border-line/80 bg-white px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Free</p>
            <p className="mt-2 text-sm leading-7 text-muted">Read first to orient on regime, flows, and baseline risk.</p>
          </div>
          <div className="rounded-xl border border-ink/15 bg-ink px-4 py-4 text-paper">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-paper/70">Weekly Pro</p>
            <p className="mt-2 text-sm leading-7 text-paper/88">Buy when this week requires a concrete decision memo.</p>
          </div>
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-amber-900">Monthly Bundle</p>
            <p className="mt-2 text-sm leading-7 text-muted">Use for continuity so each weekly decision compounds through month-end.</p>
          </div>
        </div>
      </SurfaceCard>

      <div className="grid gap-4 lg:grid-cols-3">
        {CONTENT_TIER_IDS.map((tierId) => {
          const tier = getContentTierDefinition(tierId);
          const presentation = TIER_PRESENTATIONS[tierId];
          const mutedClassName = mutedClassByTierId[tierId];
          const listClassName = listClassByTierId[tierId];

          return (
            <SurfaceCard className={`space-y-5 border ${presentation.cardClassName}`} key={tier.id}>
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <p className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] ${presentation.badgeClassName}`}>
                    {tier.editorialRole}
                  </p>
                  <p className={`text-xs font-semibold uppercase tracking-[0.14em] ${mutedClassName}`}>{presentation.toneLabel}</p>
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold tracking-tight">
                    <span className="mr-2" aria-hidden="true">
                      {presentation.icon}
                    </span>
                    {tier.name}
                  </h3>
                  <p className={`text-sm leading-7 ${mutedClassName}`}>{tier.purpose}</p>
                </div>
              </div>

              <dl className="space-y-4 text-sm">
                <div>
                  <dt className="font-semibold text-current">Best used when</dt>
                  <dd className={`mt-1 border-l-2 pl-3 leading-7 ${presentation.railClassName} ${mutedClassName}`}>{tier.workflowMoment}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-current">Core question answered</dt>
                  <dd className={`mt-1 leading-7 ${mutedClassName}`}>{tier.primaryQuestion}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-current">Functional outcome</dt>
                  <dd className={`mt-1 leading-7 ${mutedClassName}`}>{tier.primaryOutcome}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-current">Boundary</dt>
                  <dd className={`mt-1 leading-7 ${mutedClassName}`}>{tier.differentiationBoundary}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-current">Included blocks</dt>
                  <dd className="mt-2">
                    <ul className={`list-disc space-y-2 pl-5 leading-7 ${listClassName}`}>
                      {tier.includedContentBlocks.map((contentBlockId) => (
                        <li key={contentBlockId}>{getContentBlockLabel(contentBlockId)}</li>
                      ))}
                    </ul>
                  </dd>
                </div>
              </dl>
            </SurfaceCard>
          );
        })}
      </div>
    </PageSection>
  );
}
