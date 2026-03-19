import { CONTENT_TIER_IDS, getContentBlockLabel, getContentTierDefinition } from '@/domain/content-tier';

type TierDifferentiationProps = Readonly<{
  description: string;
  title: string;
}>;

export function TierDifferentiation({ description, title }: TierDifferentiationProps): JSX.Element {
  return (
    <section aria-labelledby="tier-differentiation-heading" className="space-y-4">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight" id="tier-differentiation-heading">
          {title}
        </h2>
        <p className="max-w-3xl text-sm leading-relaxed text-muted">{description}</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {CONTENT_TIER_IDS.map((tierId) => {
          const tier = getContentTierDefinition(tierId);

          return (
            <article className="space-y-4 border border-line bg-white p-5" key={tier.id}>
              <div className="space-y-2">
                <p className="inline-flex bg-paper px-2 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-ink">
                  {tier.editorialRole}
                </p>
                <h3 className="text-xl font-semibold tracking-tight">{tier.name}</h3>
                <p className="text-sm leading-relaxed text-muted">{tier.purpose}</p>
              </div>

              <dl className="space-y-3 text-sm">
                <div>
                  <dt className="font-semibold text-ink">Best used when</dt>
                  <dd className="mt-1 text-muted">{tier.workflowMoment}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-ink">Core question answered</dt>
                  <dd className="mt-1 text-muted">{tier.primaryQuestion}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-ink">Functional outcome</dt>
                  <dd className="mt-1 text-muted">{tier.primaryOutcome}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-ink">Boundary</dt>
                  <dd className="mt-1 text-muted">{tier.differentiationBoundary}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-ink">Included blocks</dt>
                  <dd className="mt-2">
                    <ul className="list-disc space-y-1 pl-5 text-ink">
                      {tier.includedContentBlocks.map((contentBlockId) => (
                        <li key={contentBlockId}>{getContentBlockLabel(contentBlockId)}</li>
                      ))}
                    </ul>
                  </dd>
                </div>
              </dl>
            </article>
          );
        })}
      </div>
    </section>
  );
}
