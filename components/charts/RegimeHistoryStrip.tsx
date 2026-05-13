'use client';

import type { Regime } from '@/domain/report';
import type { RegimeHistoryPoint } from '@/lib/charts/window';

// ---------------------------------------------------------------------------
// Regime color map — hex values match tailwind.config.ts regime.* tokens
// ---------------------------------------------------------------------------

export const REGIME_COLORS: Record<Regime, string> = {
  'risk-on': '#16a34a',
  'risk-off': '#dc2626',
  'range-bound': '#d97706',
  transition: '#94a3b8'
};

export const REGIME_LABELS: Record<Regime, string> = {
  'risk-on': 'Risk-on',
  'risk-off': 'Risk-off',
  'range-bound': 'Range',
  transition: 'Transition'
};

// ---------------------------------------------------------------------------
// Pure helpers (exported for testing)
// ---------------------------------------------------------------------------

export const getRegimeColor = (regime: Regime): string => REGIME_COLORS[regime];
export const getRegimeLabel = (regime: Regime): string => REGIME_LABELS[regime];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

type Props = {
  data: RegimeHistoryPoint[];
  currentPublishedAt?: string;
  title?: string;
};

export function RegimeHistoryStrip({ data, currentPublishedAt, title }: Props): JSX.Element {
  if (data.length === 0) {
    return (
      <div>
        {title ? <p className="mb-2 text-sm font-medium text-paper">{title}</p> : null}
        <p className="text-sm text-muted">Chart data not yet available.</p>
      </div>
    );
  }

  return (
    <div>
      {title ? <p className="mb-2 text-sm font-medium text-paper">{title}</p> : null}
      {data.length < 4 ? (
        <p className="mb-3 text-xs text-muted">
          Showing {data.length} week{data.length !== 1 ? 's' : ''} of history — strip will fill in as the archive grows.
        </p>
      ) : null}
      <div className="flex gap-1 overflow-x-auto pb-1" role="list" aria-label="Regime history">
        {data.map((point) => {
          const isCurrent = point.publishedAt === currentPublishedAt;
          const color = getRegimeColor(point.regime);
          return (
            <div
              key={point.publishedAt}
              role="listitem"
              className="flex flex-shrink-0 flex-col items-center gap-1"
            >
              <div
                className="h-12 w-12 rounded-md sm:h-14 sm:w-14"
                style={{
                  backgroundColor: color,
                  opacity: isCurrent ? 1 : 0.65,
                  outline: isCurrent ? `2px solid ${color}` : 'none',
                  outlineOffset: 2
                }}
                title={getRegimeLabel(point.regime)}
                aria-label={`${point.weekLabel}: ${getRegimeLabel(point.regime)}`}
              />
              <span className="text-[0.6rem] leading-none text-muted">{point.weekLabel}</span>
            </div>
          );
        })}
      </div>
      <div className="mt-3 flex flex-wrap gap-3">
        {(Object.keys(REGIME_COLORS) as Regime[]).map((regime) => (
          <div key={regime} className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: REGIME_COLORS[regime] }} />
            <span className="text-xs text-muted">{REGIME_LABELS[regime]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
