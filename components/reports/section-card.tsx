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
        'space-y-5 rounded-2xl border border-line/80 bg-white p-6 shadow-[0_1px_2px_rgba(16,24,40,0.04)] sm:p-8',
        className
      )}
    >
      <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">{title}</h2>
      {contentClassName ? <div className={contentClassName}>{children}</div> : children}
    </section>
  );
}
