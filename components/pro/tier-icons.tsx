import type { ContentTierId } from '@/domain/content-tier';

type TierIconProps = Readonly<{
  tierId: ContentTierId;
  size?: number;
}>;

export function TierIcon({ tierId, size = 24 }: TierIconProps): JSX.Element {
  const svgProps = { width: size, height: size, viewBox: '0 0 32 32', 'aria-hidden': true as const };

  if (tierId === 'free') {
    return (
      <svg {...svgProps}>
        <circle cx="16" cy="16" r="9" fill="none" stroke="currentColor" strokeWidth="2" />
      </svg>
    );
  }

  if (tierId === 'weeklyPro') {
    return (
      <svg {...svgProps}>
        <circle cx="16" cy="16" r="9" fill="none" stroke="currentColor" strokeWidth="2" />
        <circle cx="16" cy="16" r="3.5" fill="var(--tier-icon-accent, currentColor)" />
      </svg>
    );
  }

  return (
    <svg {...svgProps}>
      <circle cx="16" cy="11" r="6" fill="var(--tier-icon-accent, currentColor)" />
      <circle cx="10" cy="21" r="6" fill="none" stroke="currentColor" strokeWidth="1.75" />
      <circle cx="22" cy="21" r="6" fill="none" stroke="currentColor" strokeWidth="1.75" />
    </svg>
  );
}
