import type { ReportSignals } from '@/domain/report';

import { SectionCard } from '@/components/reports/section-card';

type ReportSignalsProps = Readonly<{
  signals: ReportSignals;
}>;

export const ReportSignalsBlock = ({ signals }: ReportSignalsProps): JSX.Element => (
  <div className="space-y-4">
    <SectionCard className="bg-surface p-5" contentClassName="mt-3" title="This week’s thesis">
      <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-muted">
        {signals.thesis.map((point) => (
          <li key={point}>{point}</li>
        ))}
      </ul>
    </SectionCard>

    <SectionCard className="bg-surface p-5" contentClassName="mt-3" title="Risk checklist">
      <ol className="list-decimal space-y-2 pl-5 text-sm leading-relaxed text-muted">
        {signals.riskChecklist.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ol>
    </SectionCard>

    <SectionCard className="bg-surface p-5" contentClassName="mt-3" title="Watchlist / key levels">
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
