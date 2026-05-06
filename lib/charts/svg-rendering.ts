import type { Regime } from '../../domain/report';
import type { RegimeHistoryPoint, SnapshotTrendPoint } from './window';

// ---------------------------------------------------------------------------
// Palette (matches tailwind.config.ts + regime-specific tokens)
// ---------------------------------------------------------------------------

const COLORS = {
  paper: '#F5F7FA',
  ink: '#101828',
  muted: '#94a3b8',
  line: '#CBD5E1',
  brand: '#1e3a5f',
  accent: '#F7931A',
  regimeRiskOn: '#16a34a',
  regimeRiskOff: '#dc2626',
  regimeRangeBound: '#d97706',
  regimeTransition: '#94a3b8'
} as const;

const REGIME_COLORS: Record<Regime, string> = {
  'risk-on': COLORS.regimeRiskOn,
  'risk-off': COLORS.regimeRiskOff,
  'range-bound': COLORS.regimeRangeBound,
  transition: COLORS.regimeTransition
};

// ---------------------------------------------------------------------------
// Chart options
// ---------------------------------------------------------------------------

export type SnapshotTrendChartOptions = Readonly<{
  data: SnapshotTrendPoint[];
  width?: number;
  height?: number;
  title?: string;
}>;

export type RegimeHistoryChartOptions = Readonly<{
  data: RegimeHistoryPoint[];
  width?: number;
  height?: number;
  title?: string;
}>;

// ---------------------------------------------------------------------------
// Geometry helpers
// ---------------------------------------------------------------------------

const linearScale = (
  value: number,
  domainMin: number,
  domainMax: number,
  rangeMin: number,
  rangeMax: number
): number => {
  if (domainMax === domainMin) return (rangeMin + rangeMax) / 2;
  return ((value - domainMin) / (domainMax - domainMin)) * (rangeMax - rangeMin) + rangeMin;
};

const xPosition = (index: number, count: number, plotLeft: number, plotRight: number): number => {
  if (count <= 1) return (plotLeft + plotRight) / 2;
  return linearScale(index, 0, count - 1, plotLeft, plotRight);
};

const roundTwo = (n: number): number => Math.round(n * 100) / 100;

// ---------------------------------------------------------------------------
// SVG primitives
// ---------------------------------------------------------------------------

const polyline = (points: string, stroke: string, strokeWidth = 2): string =>
  `<polyline points="${points}" fill="none" stroke="${stroke}" stroke-width="${strokeWidth}" stroke-linejoin="round" stroke-linecap="round"/>`;

const axisLine = (x1: number, y1: number, x2: number, y2: number): string =>
  `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${COLORS.line}" stroke-width="1"/>`;

const label = (
  x: number,
  y: number,
  text: string,
  opts: { anchor?: string; size?: number; fill?: string; weight?: string; transform?: string } = {}
): string => {
  const anchor = opts.anchor ?? 'middle';
  const size = opts.size ?? 11;
  const fill = opts.fill ?? COLORS.muted;
  const weight = opts.weight ? ` font-weight="${opts.weight}"` : '';
  const transform = opts.transform ? ` transform="${opts.transform}"` : '';
  return `<text x="${x}" y="${y}" text-anchor="${anchor}" font-family="sans-serif" font-size="${size}" fill="${fill}"${weight}${transform}>${escapeXml(text)}</text>`;
};

const escapeXml = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// ---------------------------------------------------------------------------
// Snapshot trend chart
// ---------------------------------------------------------------------------

export const renderSnapshotTrendSvg = (options: SnapshotTrendChartOptions): string => {
  const width = options.width ?? 800;
  const height = options.height ?? 400;
  const title = options.title ?? 'Market snapshot — last 12 weeks';
  const { data } = options;

  const marginLeft = 75;
  const marginRight = 75;
  const marginTop = 55;
  const marginBottom = 65;
  const plotLeft = marginLeft;
  const plotRight = width - marginRight;
  const plotTop = marginTop;
  const plotBottom = height - marginBottom;
  const plotW = plotRight - plotLeft;
  const plotH = plotBottom - plotTop;

  const noData = data.length === 0;

  const svgOpen = `<svg viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">`;
  const bg = `<rect width="${width}" height="${height}" fill="${COLORS.paper}"/>`;
  const titleEl = label(width / 2, 28, title, { size: 14, fill: COLORS.ink, weight: 'bold' });

  if (noData) {
    const msg = label(width / 2, height / 2, 'No data available', { size: 13, fill: COLORS.muted });
    return `${svgOpen}${bg}${titleEl}${msg}</svg>`;
  }

  // Scales
  const capValues = data.map((d) => d.totalMarketCapUsd / 1e12);
  const capMin = Math.min(...capValues);
  const capMax = Math.max(...capValues);
  const capPad = (capMax - capMin) * 0.1 || 0.1;
  const capLow = capMin - capPad;
  const capHigh = capMax + capPad;

  const pctHigh = 100;
  const pctLow = 0;

  const xPos = (i: number): number => xPosition(i, data.length, plotLeft, plotRight);
  const yCapPos = (v: number): number => linearScale(v, capLow, capHigh, plotBottom, plotTop);
  const yPctPos = (v: number): number => linearScale(v, pctLow, pctHigh, plotBottom, plotTop);

  // Axis lines
  const axes = [
    axisLine(plotLeft, plotTop, plotLeft, plotBottom),
    axisLine(plotRight, plotTop, plotRight, plotBottom),
    axisLine(plotLeft, plotBottom, plotRight, plotBottom)
  ].join('');

  // Y ticks — left axis (total cap in T)
  const capTickCount = 5;
  let leftTicks = '';
  for (let i = 0; i <= capTickCount; i++) {
    const v = capLow + (i / capTickCount) * (capHigh - capLow);
    const y = yCapPos(v);
    const capT = roundTwo(v);
    leftTicks += axisLine(plotLeft - 4, y, plotLeft, y);
    leftTicks += label(plotLeft - 8, y + 4, `${capT}T`, { anchor: 'end', size: 10 });
  }

  // Y ticks — right axis (0–100)
  const pctTickCount = 4;
  let rightTicks = '';
  for (let i = 0; i <= pctTickCount; i++) {
    const v = (i / pctTickCount) * 100;
    const y = yPctPos(v);
    rightTicks += axisLine(plotRight, y, plotRight + 4, y);
    rightTicks += label(plotRight + 8, y + 4, `${v}`, { anchor: 'start', size: 10 });
  }

  // X axis tick labels
  let xLabels = '';
  data.forEach((d, i) => {
    const x = xPos(i);
    xLabels += axisLine(x, plotBottom, x, plotBottom + 4);
    xLabels += label(x, plotBottom + 18, d.weekLabel, { anchor: 'middle', size: 9 });
  });

  // Axis titles
  const leftAxisTitle = label(
    14,
    plotTop + plotH / 2,
    'Market Cap (T)',
    { anchor: 'middle', size: 10, fill: COLORS.muted, transform: `rotate(-90, 14, ${plotTop + plotH / 2})` }
  );
  const rightAxisTitle = label(
    width - 12,
    plotTop + plotH / 2,
    '% / Index',
    { anchor: 'middle', size: 10, fill: COLORS.muted, transform: `rotate(90, ${width - 12}, ${plotTop + plotH / 2})` }
  );

  // Data series
  const capPoints = data.map((d, i) => `${xPos(i).toFixed(1)},${yCapPos(d.totalMarketCapUsd / 1e12).toFixed(1)}`).join(' ');
  const btcPoints = data.map((d, i) => `${xPos(i).toFixed(1)},${yPctPos(d.btcDominancePct).toFixed(1)}`).join(' ');
  const ethPoints = data.map((d, i) => `${xPos(i).toFixed(1)},${yPctPos(d.ethDominancePct).toFixed(1)}`).join(' ');
  const fgPoints = data.map((d, i) => `${xPos(i).toFixed(1)},${yPctPos(d.fearGreedIndex).toFixed(1)}`).join(' ');

  const series = [
    polyline(capPoints, COLORS.brand, 2),
    polyline(btcPoints, COLORS.accent, 2),
    polyline(ethPoints, COLORS.muted, 2),
    polyline(fgPoints, COLORS.ink, 1.5)
  ].join('');

  // Data point dots
  let dots = '';
  data.forEach((d, i) => {
    const x = xPos(i);
    dots += `<circle cx="${x.toFixed(1)}" cy="${yCapPos(d.totalMarketCapUsd / 1e12).toFixed(1)}" r="3" fill="${COLORS.brand}"/>`;
  });

  // Legend
  const legendItems: Array<{ color: string; label: string }> = [
    { color: COLORS.brand, label: 'Total Cap (T)' },
    { color: COLORS.accent, label: 'BTC Dom %' },
    { color: COLORS.muted, label: 'ETH Dom %' },
    { color: COLORS.ink, label: 'Fear/Greed' }
  ];
  const legendY = height - 18;
  const legendStartX = plotLeft;
  const legendSpacing = plotW / legendItems.length;
  let legend = '';
  legendItems.forEach((item, i) => {
    const lx = legendStartX + i * legendSpacing;
    legend += `<rect x="${lx}" y="${legendY - 8}" width="16" height="3" fill="${item.color}"/>`;
    legend += label(lx + 20, legendY, item.label, { anchor: 'start', size: 10, fill: COLORS.ink });
  });

  return [
    svgOpen, bg, titleEl,
    axes, leftTicks, rightTicks, xLabels,
    leftAxisTitle, rightAxisTitle,
    series, dots,
    legend,
    '</svg>'
  ].join('');
};

// ---------------------------------------------------------------------------
// Regime history chart
// ---------------------------------------------------------------------------

export const renderRegimeHistorySvg = (options: RegimeHistoryChartOptions): string => {
  const width = options.width ?? 800;
  const height = options.height ?? 200;
  const title = options.title ?? 'Regime history — last 12 weeks';
  const { data } = options;

  const marginLeft = 20;
  const marginRight = 20;
  const marginTop = 45;
  const marginBottom = 50;
  const plotLeft = marginLeft;
  const plotRight = width - marginRight;
  const plotTop = marginTop;
  const plotBottom = height - marginBottom;
  const plotH = plotBottom - plotTop;
  const plotW = plotRight - plotLeft;

  const svgOpen = `<svg viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">`;
  const bg = `<rect width="${width}" height="${height}" fill="${COLORS.paper}"/>`;
  const titleEl = label(width / 2, 26, title, { size: 14, fill: COLORS.ink, weight: 'bold' });

  if (data.length === 0) {
    const msg = label(width / 2, height / 2, 'No data available', { size: 13, fill: COLORS.muted });
    return `${svgOpen}${bg}${titleEl}${msg}</svg>`;
  }

  const n = data.length;
  const cellW = plotW / n;

  let cells = '';
  let cellLabels = '';
  data.forEach((point, i) => {
    const cellX = plotLeft + i * cellW;
    const fill = REGIME_COLORS[point.regime];
    cells += `<rect x="${cellX.toFixed(1)}" y="${plotTop}" width="${cellW.toFixed(1)}" height="${plotH}" fill="${fill}" stroke="${COLORS.paper}" stroke-width="1.5"/>`;
    const labelX = cellX + cellW / 2;
    cellLabels += label(Math.round(labelX), plotBottom + 18, point.weekLabel, { anchor: 'middle', size: 9 });
  });

  // Regime legend
  const regimes: Array<{ regime: Regime; label: string }> = [
    { regime: 'risk-on', label: 'Risk On' },
    { regime: 'risk-off', label: 'Risk Off' },
    { regime: 'range-bound', label: 'Range Bound' },
    { regime: 'transition', label: 'Transition' }
  ];
  const legendY = height - 10;
  const legendSpacing = width / regimes.length;
  let legend = '';
  regimes.forEach((item, i) => {
    const lx = i * legendSpacing + 20;
    legend += `<rect x="${lx}" y="${legendY - 8}" width="12" height="10" rx="2" fill="${REGIME_COLORS[item.regime]}"/>`;
    legend += label(lx + 16, legendY, item.label, { anchor: 'start', size: 10, fill: COLORS.ink });
  });

  return [svgOpen, bg, titleEl, cells, cellLabels, legend, '</svg>'].join('');
};
