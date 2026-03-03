import Link from 'next/link';

import { SectionCard } from '@/components/reports/section-card';

export function MethodologyNote(): JSX.Element {
  return (
    <SectionCard title="Methodology Note">
      <p className="leading-relaxed text-muted">
        This report summarizes market structure, relative performance, and directional risk using weekly closes and publicly available
        venue data. It is intended for informational use and should not be treated as investment advice. For full details, see our{' '}
        <Link className="font-medium text-ink underline-offset-2 hover:underline" href="/methodology">
          methodology page
        </Link>
        .
      </p>
    </SectionCard>
  );
}
