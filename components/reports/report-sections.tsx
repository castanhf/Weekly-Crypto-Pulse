import type { ReportSection } from '@/domain/report';

import { SectionCard } from '@/components/reports/section-card';

type ReportSectionsProps = {
  sections: ReadonlyArray<ReportSection>;
};

export function ReportSections({ sections }: ReportSectionsProps): JSX.Element | null {
  if (sections.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6 sm:space-y-7">
      {sections.map((section) => (
        <SectionCard key={section.id} title={section.heading}>
          <div className="space-y-4">
            <p className="text-[1.01rem] leading-8 text-muted">{section.body}</p>
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">Key points</p>
              <ul className="space-y-2.5 text-sm leading-7 text-muted">
                {section.highlights.map((highlight) => (
                  <li className="rounded-lg border border-white/10 bg-surface px-3 py-2" key={highlight}>
                    {highlight}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </SectionCard>
      ))}
    </div>
  );
}
