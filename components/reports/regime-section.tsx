import type { Regime } from '@/domain/report';

import { SectionCard } from '@/components/reports/section-card';

type RegimeSectionProps = {
  regime: Regime;
};

type RegimeDescriptor = {
  title: string;
  guidance: string;
};

const regimeCopy: Record<Regime, RegimeDescriptor> = {
  'risk-on': {
    title: 'Risk-On',
    guidance: 'Momentum is broad and buyers are comfortable adding exposure across majors and select high beta assets.'
  },
  'risk-off': {
    title: 'Risk-Off',
    guidance: 'Capital is rotating to defensives, volatility is elevated, and downside protection takes priority.'
  },
  'range-bound': {
    title: 'Range-Bound',
    guidance: 'Markets are balanced with two-way flows; selective positioning and disciplined risk limits remain important.'
  },
  transition: {
    title: 'Transition',
    guidance: 'Macro and positioning signals are mixed; conviction should stay moderate until trend strength improves.'
  }
};

export function RegimeSection({ regime }: RegimeSectionProps): JSX.Element {
  const descriptor = regimeCopy[regime];

  return (
    <SectionCard title="Market Regime">
      <p className="text-lg font-semibold">{descriptor.title}</p>
      <p className="leading-relaxed text-muted">{descriptor.guidance}</p>
    </SectionCard>
  );
}
