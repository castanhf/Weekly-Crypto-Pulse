import Link from 'next/link';

import type { DailyArtifact } from '@/domain/daily';
import { PaidBlock } from '@/components/conversion/PaidBlock';
import { PageSection, PageShell, SurfaceCard } from '@/components/layout/page-shell';
import { ArticleNavigation } from '@/components/reports/article-navigation';
import { formatCompactUsd, formatIsoDate, formatPercent } from '@/components/reports/report-formatters';
import type { Artifact } from '@/lib/reports/artifact-types';

type DailyReportPageProps = {
  artifact: DailyArtifact;
  prev?: Artifact | null;
  next?: Artifact | null;
};

const changePctClass = (value: number): string =>
  value >= 0 ? 'text-green-400' : 'text-red-400';

const formatChangePct = (value: number): string =>
  `${value >= 0 ? '+' : ''}${formatPercent(value)}`;

function SnapshotItem({ label, value }: { label: string; value: string }): JSX.Element {
  return (
    <div className="space-y-0.5">
      <p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-muted">{label}</p>
      <p className="text-sm font-semibold text-paper">{value}</p>
    </div>
  );
}

export function DailyReportPage({ artifact, prev = null, next = null }: DailyReportPageProps): JSX.Element {
  const { headline, summary, whatMoved, whyItMoved, worthKnowing, snapshot, tags, publishedAt, weeklyFooter } = artifact;

  return (
    <PageShell className="space-y-10 sm:space-y-12">
      {/* Header */}
      <header className="space-y-4 border-b border-white/10 pb-8 sm:space-y-5 sm:pb-10">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="rounded-full border border-accent/40 bg-accent/10 px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-accent">
            Daily
          </span>
          <p className="text-xs text-muted">Published {formatIsoDate(publishedAt)}</p>
        </div>
        <h1 className="max-w-4xl text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">{headline}</h1>
        <ul className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <li className="rounded-full border border-white/10 px-2.5 py-0.5 text-xs text-muted" key={tag}>
              {tag}
            </li>
          ))}
        </ul>
      </header>

      <PageSection className="grid gap-8 xl:grid-cols-[minmax(0,1.75fr)_minmax(18rem,0.75fr)] xl:items-start">
        <div className="space-y-8">
          {/* 60-second read */}
          <SurfaceCard className="border-accent/20 bg-gradient-to-br from-surface to-canvas/60">
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-accent">60-second read</p>
            <p className="mt-3 text-base leading-8 text-paper">{summary}</p>
          </SurfaceCard>

          {/* What Moved — top 15 */}
          <section className="space-y-4">
            <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">What Moved — Top 15</h2>
            <SurfaceCard className="p-0 sm:p-0 lg:p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="px-4 py-3 text-left text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-muted">Asset</th>
                      <th className="px-4 py-3 text-right text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-muted">Price</th>
                      <th className="px-4 py-3 text-right text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-muted">24h</th>
                      <th className="hidden px-4 py-3 text-right text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-muted sm:table-cell">Mkt Cap</th>
                    </tr>
                  </thead>
                  <tbody>
                    {whatMoved.topTracked.map((asset) => (
                      <tr className="border-b border-white/5 last:border-0" key={asset.symbol}>
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-paper">{asset.symbol}</span>
                            {asset.isStablecoin && (
                              <span className="rounded border border-white/10 px-1 py-0.5 text-[0.6rem] text-muted">stable</span>
                            )}
                          </div>
                          <span className="text-xs text-muted">{asset.name}</span>
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono text-xs text-paper">
                          {formatCompactUsd(asset.priceUsd)}
                        </td>
                        <td className={`px-4 py-2.5 text-right font-mono text-xs ${changePctClass(asset.changePct24h)}`}>
                          {formatChangePct(asset.changePct24h)}
                        </td>
                        <td className="hidden px-4 py-2.5 text-right font-mono text-xs text-muted sm:table-cell">
                          {formatCompactUsd(asset.marketCapUsd)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </SurfaceCard>
          </section>

          {/* Winners and Losers */}
          {(whatMoved.winners.length > 0 || whatMoved.losers.length > 0) && (
            <section className="grid gap-4 sm:grid-cols-2">
              {whatMoved.winners.length > 0 && (
                <div className="space-y-3">
                  <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-green-400">
                    {whatMoved.sectionLabels?.winners ?? 'Winners'}
                  </h2>
                  <ul className="space-y-2">
                    {whatMoved.winners.map((mover) => (
                      <li className="rounded-xl border border-white/10 bg-surface px-4 py-3" key={mover.symbol}>
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium text-paper">{mover.symbol}</span>
                          <span className="font-mono text-sm text-green-400">
                            {formatChangePct(mover.changePct24h)}
                            {mover.priceChange24hUsd !== undefined && (
                              <span className="ml-1.5 text-xs text-muted">
                                / {mover.priceChange24hUsd >= 0 ? '+' : ''}{formatCompactUsd(mover.priceChange24hUsd)}
                              </span>
                            )}
                          </span>
                        </div>
                        <p className="mt-0.5 text-xs text-muted">{mover.catalyst}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {whatMoved.losers.length > 0 && (
                <div className="space-y-3">
                  <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-red-400">
                    {whatMoved.sectionLabels?.losers ?? 'Losers'}
                  </h2>
                  <ul className="space-y-2">
                    {whatMoved.losers.map((mover) => (
                      <li className="rounded-xl border border-white/10 bg-surface px-4 py-3" key={mover.symbol}>
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium text-paper">{mover.symbol}</span>
                          <span className="font-mono text-sm text-red-400">
                            {formatChangePct(mover.changePct24h)}
                            {mover.priceChange24hUsd !== undefined && (
                              <span className="ml-1.5 text-xs text-muted">
                                / {mover.priceChange24hUsd >= 0 ? '+' : ''}{formatCompactUsd(mover.priceChange24hUsd)}
                              </span>
                            )}
                          </span>
                        </div>
                        <p className="mt-0.5 text-xs text-muted">{mover.catalyst}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </section>
          )}

          {/* Why it moved */}
          <section className="space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">Why it moved</h2>
            <SurfaceCard>
              <p className="text-base leading-8 text-muted">{whyItMoved}</p>
            </SurfaceCard>
          </section>

          {/* Worth knowing */}
          {worthKnowing.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">Worth knowing</h2>
              <SurfaceCard>
                <ul className="space-y-3">
                  {worthKnowing.map((item, i) => (
                    <li className="flex gap-3 text-base leading-7 text-muted" key={i}>
                      <span className="mt-0.5 shrink-0 text-muted/50">–</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </SurfaceCard>
            </section>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4 xl:sticky xl:top-36">
          {/* Market snapshot */}
          <SurfaceCard className="space-y-5">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">Market snapshot</p>
            <div className="grid grid-cols-2 gap-4">
              <SnapshotItem label="Total market cap" value={formatCompactUsd(snapshot.totalMarketCapUsd)} />
              <SnapshotItem label="Fear & Greed" value={`${snapshot.fearGreedIndex} / 100`} />
              <SnapshotItem label="BTC dominance" value={formatPercent(snapshot.btcDominancePct)} />
              <SnapshotItem label="ETH dominance" value={formatPercent(snapshot.ethDominancePct)} />
            </div>
          </SurfaceCard>

          {/* Weekly footer */}
          {weeklyFooter && (
            <SurfaceCard className="space-y-3">
              <p className="text-xs text-muted">{weeklyFooter.text}</p>
              <Link
                className="inline-flex items-center text-sm font-medium text-paper underline underline-offset-4 hover:text-muted"
                href={`/reports/${weeklyFooter.weeklySlug}`}
              >
                Read this week&rsquo;s Crypto Pulse &rarr;
              </Link>
            </SurfaceCard>
          )}
        </div>
      </PageSection>

      <PageSection>
        <PaidBlock />
      </PageSection>

      <PageSection>
        <ArticleNavigation next={next} prev={prev} />
      </PageSection>
    </PageShell>
  );
}
