import type { ComponentPropsWithoutRef, ReactNode } from 'react';

import { composeClassNames } from '@/components/layout/ui-primitives';

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

export function PageContainer({ as: Component = 'div', children, className }: PageContainerProps): JSX.Element {
  return <Component className={composeClassNames(pageContainerClassName, className)}>{children}</Component>;
}

export function PageShell({ children, className }: PageShellProps): JSX.Element {
  return <div className={composeClassNames('space-y-14 sm:space-y-20 lg:space-y-24', className)}>{children}</div>;
}

export function PageSection({ id, children, className, ...restProps }: PageSectionProps): JSX.Element {
  return (
    <section {...restProps} className={composeClassNames('space-y-6 sm:space-y-9', className)} id={id}>
      {children}
    </section>
  );
}

export function ContentWidth({ children, className, size = 'content' }: ContentWidthProps): JSX.Element {
  return <div className={composeClassNames(CONTENT_WIDTH_CLASS_NAMES[size], className)}>{children}</div>;
}

export function PageHeader({ eyebrow, title, description, actions, className, titleClassName }: PageHeaderProps): JSX.Element {
  return (
    <header className={composeClassNames('space-y-6 border-b border-white/10 pb-8 sm:space-y-8 sm:pb-12', className)}>
      <ContentWidth className="space-y-5" size="feature">
        {eyebrow ? <p className="text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-muted">{eyebrow}</p> : null}
        <div className="space-y-4">
          <h1 className={composeClassNames('text-[2rem] font-semibold tracking-tight sm:text-[3.2rem] sm:leading-[1.06]', titleClassName)}>{title}</h1>
          {description ? <p className="max-w-3xl text-base leading-8 text-muted">{description}</p> : null}
        </div>
      </ContentWidth>
      {actions ? <div className="flex flex-col gap-3.5 sm:flex-row sm:flex-wrap">{actions}</div> : null}
    </header>
  );
}

export function SectionIntro({ id, title, description, action, className }: SectionIntroProps): JSX.Element {
  return (
    <div className={composeClassNames('flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between', className)}>
      <ContentWidth className="space-y-2.5" size="feature">
        <h2 className="text-[1.7rem] font-semibold tracking-tight sm:text-[2.2rem]" id={id}>
          {title}
        </h2>
        {description ? <p className="text-base leading-8 text-muted">{description}</p> : null}
      </ContentWidth>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function SurfaceCard({ children, className, ...restProps }: SurfaceCardProps): JSX.Element {
  return (
    <div
      {...restProps}
      className={composeClassNames(
        'rounded-2xl border border-white/10 bg-surface p-5 shadow-[0_2px_8px_rgba(0,0,0,0.4)] sm:p-8 lg:p-9',
        className
      )}
    >
      {children}
    </div>
  );
}
