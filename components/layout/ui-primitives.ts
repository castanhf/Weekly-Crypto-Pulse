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
  primary: 'border border-ink bg-ink text-paper hover:bg-ink/90',
  secondary: 'border border-line text-ink hover:border-ink',
  inverted: 'border border-white bg-white text-ink hover:bg-paper'
};

const SECTION_TILE_TONE_CLASS_NAMES: Record<SectionTileTone, string> = {
  default: 'border border-line/80 bg-white',
  subtle: 'border border-line/80 bg-paper',
  dark: 'border border-white/10 bg-white/5'
};

export const composeClassNames = (...classValues: ReadonlyArray<ClassValue>): string => classValues.filter(Boolean).join(' ');

export const getCtaClassName = ({ tone = 'primary', fullWidth = false, className }: CtaVariant = {}): string =>
  composeClassNames(CTA_BASE_CLASS_NAME, CTA_TONE_CLASS_NAMES[tone], fullWidth ? 'w-full sm:w-auto' : undefined, className);

export const getSectionTileClassName = (tone: SectionTileTone = 'default', className?: string): string =>
  composeClassNames('rounded-2xl px-4 py-4', SECTION_TILE_TONE_CLASS_NAMES[tone], className);

export const editorialLabelClassName = 'text-xs font-semibold uppercase tracking-[0.12em] text-muted';
