import { SectionCard } from '@/components/reports/section-card';

type ExecutiveSummaryProps = {
  summary: string;
};

export function ExecutiveSummary({ summary }: ExecutiveSummaryProps): JSX.Element {
  return (
    <SectionCard title="Executive Summary">
      <p className="leading-relaxed text-muted">{summary}</p>
    </SectionCard>
  );
}
