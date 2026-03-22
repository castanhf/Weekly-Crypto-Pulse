import type { ComponentPropsWithoutRef, ReactNode } from 'react';

type ClassValue = string | false | null | undefined;

type WidthSize = 'copy' | 'content' | 'feature' | 'full';

type PageContainerProps = Readonly<{
  as?: 'div' | 'section';
  children: ReactNode;
  className?: string;
}>;

type PageShellProps = Readonly<{
  children: ReactNode;
  className?: string;
}>;

type PageSectionProps = Readonly<{
  id?: string;
  children: ReactNode;
  className?: string;
}> &
  Omit<ComponentPropsWithoutRef<'section'>, 'children' | 'className' | 'id'>;

type ContentWidthProps = Readonly<{
  children: ReactNode;
  className?: string;
  size?: WidthSize;
}>;

type PageHeaderProps = Readonly<{
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
  titleClassName?: string;
}>;

type SectionIntroProps = Readonly<{
  id?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}>;

type SurfaceCardProps = Readonly<{
  children: ReactNode;
  className?: string;
}> &
  Omit<ComponentPropsWithoutRef<'div'>, 'children' | 'className'>;

const CONTENT_WIDTH_CLASS_NAMES: Record<WidthSize, string> = {
  copy: 'max-w-3xl',
  content: 'max-w-4xl',
  feature: 'max-w-5xl',
  full: 'max-w-none'
};

export const pageContainerClassName = 'mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8';

const mergeClasses = (...classValues: ReadonlyArray<ClassValue>): string => classValues.filter(Boolean).join(' ');

export function PageContainer({ as: Component = 'div', children, className }: PageContainerProps): JSX.Element {
  return <Component className={mergeClasses(pageContainerClassName, className)}>{children}</Component>;
}

export function PageShell({ children, className }: PageShellProps): JSX.Element {
  return <div className={mergeClasses('space-y-14 sm:space-y-16 lg:space-y-20', className)}>{children}</div>;
}

export function PageSection({ id, children, className, ...restProps }: PageSectionProps): JSX.Element {
  return (
    <section {...restProps} className={mergeClasses('space-y-6 sm:space-y-8', className)} id={id}>
      {children}
    </section>
  );
}

export function ContentWidth({ children, className, size = 'content' }: ContentWidthProps): JSX.Element {
  return <div className={mergeClasses(CONTENT_WIDTH_CLASS_NAMES[size], className)}>{children}</div>;
}

export function PageHeader({ eyebrow, title, description, actions, className, titleClassName }: PageHeaderProps): JSX.Element {
  return (
    <header className={mergeClasses('space-y-6 border-b border-line/80 pb-8 sm:space-y-7 sm:pb-10', className)}>
      <ContentWidth className="space-y-4" size="feature">
        {eyebrow ? <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted">{eyebrow}</p> : null}
        <div className="space-y-3">
          <h1 className={mergeClasses('text-4xl font-semibold tracking-tight sm:text-5xl', titleClassName)}>{title}</h1>
          {description ? <p className="text-base leading-7 text-muted">{description}</p> : null}
        </div>
      </ContentWidth>
      {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
    </header>
  );
}

export function SectionIntro({ id, title, description, action, className }: SectionIntroProps): JSX.Element {
  return (
    <div className={mergeClasses('flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between', className)}>
      <ContentWidth className="space-y-2" size="feature">
        <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl" id={id}>
          {title}
        </h2>
        {description ? <p className="text-sm leading-7 text-muted">{description}</p> : null}
      </ContentWidth>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function SurfaceCard({ children, className, ...restProps }: SurfaceCardProps): JSX.Element {
  return (
    <div
      {...restProps}
      className={mergeClasses(
        'rounded-2xl border border-line/80 bg-white p-6 shadow-[0_1px_2px_rgba(16,24,40,0.04)] sm:p-8',
        className
      )}
    >
      {children}
    </div>
  );
}
