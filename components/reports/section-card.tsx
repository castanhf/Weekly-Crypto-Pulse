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
    <section className={mergeClasses('space-y-4 rounded-lg border border-line bg-white p-6', className)}>
      <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
      {contentClassName ? <div className={contentClassName}>{children}</div> : children}
    </section>
  );
}
