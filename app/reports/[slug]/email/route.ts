import { getAllReports, getReportBySlug } from '@/lib/reports/report-repository';
import { createDistributionContext, createEmailReportHtml } from '@/lib/reports/distribution';
import { getSiteOrigin } from '@/lib/seo';

type ReportEmailRouteProps = {
  params: {
    slug: string;
  };
};

export const dynamic = 'force-static';

export const generateStaticParams = (): Array<ReportEmailRouteProps['params']> =>
  getAllReports().map((report) => ({ slug: report.metadata.slug }));

export function GET(_request: Request, { params }: ReportEmailRouteProps): Response {
  const report = getReportBySlug(params.slug);

  if (!report) {
    return new Response('Report not found', { status: 404 });
  }

  const html = createEmailReportHtml(report, createDistributionContext(getSiteOrigin()));

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400'
    }
  });
}
