import { PageSection, SectionIntro, SurfaceCard } from '@/components/layout/page-shell';
import { CONTENT_TIER_IDS, type ContentTierId, getContentBlockLabel, getContentTierDefinition } from '@/domain/content-tier';
import { TierIcon } from '@/components/pro/tier-icons';

type TierDifferentiationProps = Readonly<{
  description: string;
  title: string;
}>;

type TierPresentation = Readonly<{
  badgeClassName: string;
  cardClassName: string;
  railClassName: string;
  toneLabel: string;
}>;

const TIER_PRESENTATIONS: Readonly<Record<ContentTierId, TierPresentation>> = {
  free: {
    badgeClassName: 'border-white/10 bg-surface text-paper',
    cardClassName: 'border-white/10 bg-surface',
    railClassName: 'border-white/20',
    toneLabel: 'Orientation layer'
  },
  weeklyPro: {
    badgeClassName: 'border-accent/30 bg-brand text-paper',
    cardClassName: 'border-accent/30 bg-gradient-to-br from-brand to-canvas text-paper',
    railClassName: 'border-paper/35',
    toneLabel: 'Decision layer'
  },
  monthlyBundle: {
    badgeClassName: 'border-accent/20 bg-accent/10 text-accent',
    cardClassName: 'border-accent/20 bg-gradient-to-br from-accent/15 via-surface to-surface',
    railClassName: 'border-accent/30',
    toneLabel: 'Continuity layer'
  }
} as const;

const mutedClassByTierId: Readonly<Record<ContentTierId, string>> = {
  free: 'text-muted',
  weeklyPro: 'text-paper/78',
  monthlyBundle: 'text-muted'
};

const listClassByTierId: Readonly<Record<ContentTierId, string>> = {
  free: 'text-paper marker:text-muted',
  weeklyPro: 'text-paper/90 marker:text-paper/45',
  monthlyBundle: 'text-paper marker:text-muted'
};

export function TierDifferentiation({ description, title }: TierDifferentiationProps): JSX.Element {
  return (
    <PageSection aria-labelledby="tier-differentiation-heading" className="space-y-6">
      <SectionIntro description={description} id="tier-differentiation-heading" title={title} />

      <SurfaceCard className="space-y-4 border-white/10 bg-gradient-to-r from-surface via-canvas/30 to-surface px-5 py-5 sm:px-6">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">Usage ladder</p>
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-xl border border-white/10 bg-surface px-4 py-4">
            <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-muted">
              <span className="inline-flex shrink-0" style={{ '--tier-icon-accent': 'var(--color-accent)' } as React.CSSProperties}>
                <TierIcon tierId="free" size={16} />
              </span>
              Free
            </p>
            <p className="mt-2 text-sm leading-7 text-muted">Read first. Free covers what&apos;s happening this week.</p>
          </div>
          <div className="rounded-xl border border-accent/30 bg-brand px-4 py-4 text-paper">
            <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-paper/70">
              <span className="inline-flex shrink-0" style={{ '--tier-icon-accent': 'var(--color-accent)' } as React.CSSProperties}>
                <TierIcon tierId="weeklyPro" size={16} />
              </span>
              Weekly Pro
            </p>
            <p className="mt-2 text-sm leading-7 text-paper/88">Buy when the free summary isn&apos;t enough for this week.</p>
          </div>
          <div className="rounded-xl border border-accent/20 bg-accent/10 px-4 py-4">
            <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-accent">
              <span className="inline-flex shrink-0" style={{ '--tier-icon-accent': 'var(--color-accent)' } as React.CSSProperties}>
                <TierIcon tierId="monthlyBundle" size={16} />
              </span>
              Monthly Bundle
            </p>
            <p className="mt-2 text-sm leading-7 text-muted">Use when you want four weeks connected, not four separate reads.</p>
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
                  <h3 className="flex items-center text-xl font-semibold tracking-tight">
                    <span
                      className="mr-2 inline-flex"
                      style={{ '--tier-icon-accent': 'var(--color-accent)' } as React.CSSProperties}
                    >
                      <TierIcon tierId={tierId} size={24} />
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
