type ClassValue = string | false | null | undefined;

type CtaTone = 'primary' | 'secondary' | 'inverted';

type CtaVariant = Readonly<{
  tone?: CtaTone;
  fullWidth?: boolean;
  className?: string;
}>;

type SectionTileTone = 'default' | 'subtle' | 'dark';

const CTA_BASE_CLASS_NAME =
  'inline-flex min-h-11 items-center justify-center rounded-xl px-4 py-3 text-center text-sm font-medium transition';

const CTA_TONE_CLASS_NAMES: Record<CtaTone, string> = {
  primary: 'border border-accent bg-accent text-ink hover:bg-accent-hover',
  secondary: 'border border-white/20 text-paper hover:border-white/40 hover:bg-white/5',
  inverted: 'border border-white/15 bg-surface text-paper hover:border-white/30'
};

const SECTION_TILE_TONE_CLASS_NAMES: Record<SectionTileTone, string> = {
  default: 'border border-white/10 bg-surface',
  subtle: 'border border-white/8 bg-canvas',
  dark: 'border border-white/15 bg-brand'
};

export const composeClassNames = (...classValues: ReadonlyArray<ClassValue>): string => classValues.filter(Boolean).join(' ');

export const getCtaClassName = ({ tone = 'primary', fullWidth = false, className }: CtaVariant = {}): string =>
  composeClassNames(CTA_BASE_CLASS_NAME, CTA_TONE_CLASS_NAMES[tone], fullWidth ? 'w-full sm:w-auto' : undefined, className);

export const getSectionTileClassName = (tone: SectionTileTone = 'default', className?: string): string =>
  composeClassNames('rounded-2xl px-4 py-4', SECTION_TILE_TONE_CLASS_NAMES[tone], className);

export const editorialLabelClassName = 'text-xs font-semibold uppercase tracking-[0.12em] text-muted';
