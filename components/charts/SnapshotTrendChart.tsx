'use client';

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';

import type { SnapshotTrendPoint } from '@/lib/charts/window';

// ---------------------------------------------------------------------------
// Chart color constants — match tailwind.config.ts chart.* tokens
// ---------------------------------------------------------------------------

export const CHART_COLORS = {
  marketCap: '#F7931A',
  btcDom: '#60a5fa',
  ethDom: '#a78bfa',
  fearGreed: '#94a3b8'
} as const;

// ---------------------------------------------------------------------------
// Pure helpers (exported for testing)
// ---------------------------------------------------------------------------

export const toMarketCapTrillion = (usd: number): number => usd / 1e12;

export type ChartFallbackKind = 'empty' | 'short' | 'full';

export const getChartFallbackKind = (dataLength: number): ChartFallbackKind => {
  if (dataLength === 0) return 'empty';
  if (dataLength < 4) return 'short';
  return 'full';
};

// ---------------------------------------------------------------------------
// Internal types
// ---------------------------------------------------------------------------

type ChartDataPoint = {
  weekLabel: string;
  marketCapTrillion: number;
  btcDominancePct: number;
  ethDominancePct: number;
  fearGreedIndex: number;
};

const toChartData = (data: SnapshotTrendPoint[]): ChartDataPoint[] =>
  data.map((point) => ({
    weekLabel: point.weekLabel,
    marketCapTrillion: toMarketCapTrillion(point.totalMarketCapUsd),
    btcDominancePct: point.btcDominancePct,
    ethDominancePct: point.ethDominancePct,
    fearGreedIndex: point.fearGreedIndex
  }));

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

type Props = {
  data: SnapshotTrendPoint[];
  title?: string;
};

export function SnapshotTrendChart({ data, title }: Props): JSX.Element {
  const fallback = getChartFallbackKind(data.length);

  if (fallback === 'empty') {
    return (
      <div>
        {title ? <p className="mb-2 text-sm font-medium text-paper">{title}</p> : null}
        <p className="text-sm text-muted">Chart data not yet available.</p>
      </div>
    );
  }

  const chartData = toChartData(data);

  return (
    <div>
      {title ? <p className="mb-2 text-sm font-medium text-paper">{title}</p> : null}
      {fallback === 'short' ? (
        <p className="mb-3 text-xs text-muted">
          Showing {data.length} week{data.length !== 1 ? 's' : ''} of history — chart will fill in as the archive grows.
        </p>
      ) : null}
      <div style={{ width: '100%', height: 320 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#CBD5E1" opacity={0.12} />
            <XAxis
              dataKey="weekLabel"
              tick={{ fill: '#94a3b8', fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: '#CBD5E1', opacity: 0.2 }}
            />
            <YAxis
              yAxisId="pct"
              domain={[0, 100]}
              tick={{ fill: '#94a3b8', fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v: number) => `${v}%`}
              width={40}
            />
            <YAxis
              yAxisId="cap"
              orientation="right"
              tick={{ fill: '#94a3b8', fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v: number) => `$${v.toFixed(1)}T`}
              width={52}
            />
            <Tooltip
              contentStyle={{ backgroundColor: '#132238', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }}
              labelStyle={{ color: '#F5F7FA', fontWeight: 600, fontSize: 12 }}
              itemStyle={{ color: '#94a3b8', fontSize: 12 }}
              formatter={(value, name) => {
                const v = typeof value === 'number' ? value : 0;
                const n = String(name);
                if (n === 'Market cap') return [`$${v.toFixed(2)}T`, n];
                if (n === 'Fear & Greed') return [v.toFixed(0), n];
                return [`${v.toFixed(1)}%`, n];
              }}
            />
            <Legend
              wrapperStyle={{ fontSize: 12, color: '#94a3b8', paddingTop: 8 }}
            />
            <Line
              yAxisId="cap"
              type="monotone"
              dataKey="marketCapTrillion"
              name="Market cap"
              stroke={CHART_COLORS.marketCap}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
            <Line
              yAxisId="pct"
              type="monotone"
              dataKey="btcDominancePct"
              name="BTC dominance"
              stroke={CHART_COLORS.btcDom}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
            <Line
              yAxisId="pct"
              type="monotone"
              dataKey="ethDominancePct"
              name="ETH dominance"
              stroke={CHART_COLORS.ethDom}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
            <Line
              yAxisId="pct"
              type="monotone"
              dataKey="fearGreedIndex"
              name="Fear & Greed"
              stroke={CHART_COLORS.fearGreed}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
