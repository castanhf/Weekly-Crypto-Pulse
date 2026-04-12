import type { ReactNode } from 'react';

type SectionCardProps = Readonly<{
  title: string;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
}>;

const mergeClasses = (...classNames: ReadonlyArray<string | undefined>): string => classNames.filter(Boolean).join(' ');

export function SectionCard({ title, children, className, contentClassName }: SectionCardProps): JSX.Element {
  return (
    <section
      className={mergeClasses(
        'space-y-5 rounded-2xl border border-white/10 bg-surface p-6 shadow-[0_2px_8px_rgba(0,0,0,0.3)] sm:space-y-6 sm:p-8',
        className
      )}
    >
      <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">{title}</h2>
      {contentClassName ? <div className={contentClassName}>{children}</div> : children}
    </section>
  );
}
