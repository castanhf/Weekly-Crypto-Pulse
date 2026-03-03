import type { ReactNode } from 'react';

type SectionCardProps = {
  title: string;
  children: ReactNode;
};

export function SectionCard({ title, children }: SectionCardProps): JSX.Element {
  return (
    <section className="space-y-4 rounded-lg border border-line bg-white p-6">
      <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
      {children}
    </section>
  );
}
