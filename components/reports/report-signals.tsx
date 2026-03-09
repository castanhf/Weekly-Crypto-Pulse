import type { ReactNode } from 'react';

import type { ReportSignals } from '@/domain/report';

type ReportSignalsProps = Readonly<{
  signals: ReportSignals;
}>;

const SectionCard = ({ title, children }: Readonly<{ title: string; children: ReactNode }>): JSX.Element => (
  <section className="rounded-lg border border-line bg-surface p-5">
    <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
    <div className="mt-3">{children}</div>
  </section>
);

export const ReportSignalsBlock = ({ signals }: ReportSignalsProps): JSX.Element => (
  <div className="space-y-4">
    <SectionCard title="This week’s thesis">
      <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-muted">
        {signals.thesis.map((point) => (
          <li key={point}>{point}</li>
        ))}
      </ul>
    </SectionCard>

    <SectionCard title="Risk checklist">
      <ol className="list-decimal space-y-2 pl-5 text-sm leading-relaxed text-muted">
        {signals.riskChecklist.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ol>
    </SectionCard>

    <SectionCard title="Watchlist / key levels">
      <ul className="space-y-3 text-sm leading-relaxed text-muted">
        {signals.watchlistLevels.map((entry) => (
          <li className="rounded-md border border-line px-3 py-2" key={`${entry.asset}-${entry.level}`}>
            <p className="font-medium text-ink">
              {entry.asset}: <span className="font-semibold">{entry.level}</span>
            </p>
            <p>{entry.context}</p>
          </li>
        ))}
      </ul>
    </SectionCard>
  </div>
);
