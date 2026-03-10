import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import {
  hasCompleteFulfillmentAssistInput,
  isFulfillmentAssistEnabled,
  toFulfillmentAssistInput,
  toFulfillmentEmailBody,
  toProPackCommand
} from '@/lib/fulfillment-assist';
import { getAllReports, getReportBySlug } from '@/lib/reports/report-repository';

type FulfillmentAssistPageProps = {
  searchParams: Record<string, string | string[] | undefined>;
};

export const metadata: Metadata = {
  title: 'Fulfillment assist',
  robots: {
    index: false,
    follow: false
  }
};

export default function FulfillmentAssistPage({ searchParams }: FulfillmentAssistPageProps): JSX.Element {
  if (!isFulfillmentAssistEnabled()) {
    notFound();
  }

  const input = toFulfillmentAssistInput(searchParams);
  const report = input.slug ? getReportBySlug(input.slug) : undefined;
  const reportTitle = report?.metadata.title ?? input.slug;
  const shouldRenderOutput = hasCompleteFulfillmentAssistInput(input);
  const command = shouldRenderOutput ? toProPackCommand(input) : '';
  const emailBody = shouldRenderOutput ? toFulfillmentEmailBody(input, reportTitle) : '';

  return (
    <section className="space-y-6">
      <header className="space-y-2 border-b border-line pb-6">
        <p className="text-sm uppercase tracking-[0.18em] text-muted">Internal operations</p>
        <h1 className="text-3xl font-semibold tracking-tight">Pro fulfillment assistant</h1>
        <p className="max-w-3xl text-sm leading-relaxed text-muted">
          Local-only helper to prepare the CLI command and email copy. This page does not send emails and does not store any data.
        </p>
      </header>

      <form className="space-y-4 border border-line bg-white p-4" method="get">
        <label className="block space-y-1" htmlFor="buyerEmail">
          <span className="text-sm font-medium">Buyer email</span>
          <input className="w-full border border-line px-3 py-2 text-sm" defaultValue={input.buyerEmail} id="buyerEmail" name="buyerEmail" required type="email" />
        </label>

        <label className="block space-y-1" htmlFor="orderRef">
          <span className="text-sm font-medium">Order reference</span>
          <input className="w-full border border-line px-3 py-2 text-sm" defaultValue={input.orderRef} id="orderRef" name="orderRef" required type="text" />
        </label>

        <label className="block space-y-1" htmlFor="slug">
          <span className="text-sm font-medium">Report slug</span>
          <input className="w-full border border-line px-3 py-2 text-sm" defaultValue={input.slug} id="slug" list="report-slugs" name="slug" required type="text" />
        </label>

        <datalist id="report-slugs">
          {getAllReports().map((availableReport) => (
            <option key={availableReport.metadata.slug} value={availableReport.metadata.slug} />
          ))}
        </datalist>

        <button className="border border-ink bg-ink px-4 py-2 text-sm font-medium text-paper hover:bg-transparent hover:text-ink" type="submit">
          Generate helper output
        </button>
      </form>

      {input.slug && !report ? <p className="text-sm text-red-700">No report found for slug: {input.slug}</p> : null}

      {shouldRenderOutput ? (
        <section className="space-y-4">
          <article className="space-y-2 border border-line bg-white p-4">
            <h2 className="text-base font-semibold tracking-tight">CLI command</h2>
            <pre className="overflow-x-auto border border-line bg-paper p-3 text-xs">{command}</pre>
          </article>

          <article className="space-y-2 border border-line bg-white p-4">
            <h2 className="text-base font-semibold tracking-tight">Email body</h2>
            <textarea className="h-64 w-full border border-line bg-paper p-3 font-mono text-xs" defaultValue={emailBody} readOnly />
          </article>
        </section>
      ) : null}
    </section>
  );
}
