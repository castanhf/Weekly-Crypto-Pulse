const compactUsdFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  notation: 'compact',
  maximumFractionDigits: 2
});

const decimalFormatter = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1
});

export const formatCompactUsd = (value: number): string => compactUsdFormatter.format(value);

export const formatPercent = (value: number): string => `${decimalFormatter.format(value)}%`;

export const formatIsoDate = (isoDate: string): string =>
  new Date(`${isoDate}T00:00:00.000Z`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC'
  });
