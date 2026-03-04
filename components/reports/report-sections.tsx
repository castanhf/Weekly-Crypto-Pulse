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
    <div className="space-y-6">
      {sections.map((section) => (
        <SectionCard key={section.id} title={section.heading}>
          <p className="leading-relaxed text-muted">{section.body}</p>
          <ul className="list-disc space-y-1 pl-5 text-sm text-muted">
            {section.highlights.map((highlight) => (
              <li key={highlight}>{highlight}</li>
            ))}
          </ul>
        </SectionCard>
      ))}
    </div>
  );
}
