import type { ComponentPropsWithoutRef, ReactNode } from 'react';

type ClassValue = string | false | null | undefined;

type PageShellProps = Readonly<{
  children: ReactNode;
  className?: string;
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

const mergeClasses = (...classValues: ReadonlyArray<ClassValue>): string => classValues.filter(Boolean).join(' ');

export function PageShell({ children, className }: PageShellProps): JSX.Element {
  return <div className={mergeClasses('space-y-14 sm:space-y-16 lg:space-y-20', className)}>{children}</div>;
}

export function PageHeader({ eyebrow, title, description, actions, className, titleClassName }: PageHeaderProps): JSX.Element {
  return (
    <header className={mergeClasses('space-y-6 border-b border-line/80 pb-8 sm:pb-10', className)}>
      <div className="space-y-4">
        {eyebrow ? <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted">{eyebrow}</p> : null}
        <div className="space-y-3">
          <h1 className={mergeClasses('max-w-4xl text-4xl font-semibold tracking-tight sm:text-5xl', titleClassName)}>{title}</h1>
          {description ? <p className="max-w-3xl text-base leading-7 text-muted">{description}</p> : null}
        </div>
      </div>
      {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
    </header>
  );
}

export function SectionIntro({ id, title, description, action, className }: SectionIntroProps): JSX.Element {
  return (
    <div className={mergeClasses('flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between', className)}>
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl" id={id}>
          {title}
        </h2>
        {description ? <p className="max-w-3xl text-sm leading-7 text-muted">{description}</p> : null}
      </div>
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
