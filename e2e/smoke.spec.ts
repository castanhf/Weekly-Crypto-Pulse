import { expect, test } from '@playwright/test';
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

const reportsDirectory = path.join(process.cwd(), 'data/reports');

type ReportArtifact = Readonly<{
  report: Readonly<{
    metadata: Readonly<{
      slug: string;
      publishedAt: string;
    }>;
  }>;
}>;

const getLatestReportSlug = (): string => {
  const reportArtifacts = readdirSync(reportsDirectory)
    .filter((fileName) => fileName.endsWith('.json'))
    .map((fileName) => readFileSync(path.join(reportsDirectory, fileName), 'utf-8'))
    .map((rawArtifact) => JSON.parse(rawArtifact) as ReportArtifact)
    .sort((left, right) => {
      const publishedAtSortOrder = right.report.metadata.publishedAt.localeCompare(left.report.metadata.publishedAt);

      if (publishedAtSortOrder !== 0) {
        return publishedAtSortOrder;
      }

      return right.report.metadata.slug.localeCompare(left.report.metadata.slug);
    });

  const latestReport = reportArtifacts[0];
  if (!latestReport) {
    throw new Error('Expected at least one report artifact in data/reports.');
  }

  return latestReport.report.metadata.slug;
};

test('homepage renders and links to latest report', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');

  await expect(page.getByRole('heading', { level: 1, name: /read the market setup, then choose the depth you need this week\./i })).toBeVisible();

  const primaryNavigation = page.getByRole('navigation', { name: 'Primary navigation' });
  await expect(primaryNavigation.getByRole('link', { name: 'Reports' })).toBeVisible();
  await expect(primaryNavigation.getByRole('link', { name: 'Pro' })).toBeVisible();
  await expect(primaryNavigation.getByRole('link', { name: 'Methodology' })).toBeVisible();
  await expect(primaryNavigation.getByRole('link', { name: 'Disclaimer' })).toBeVisible();
  await expect(primaryNavigation.getByRole('link', { name: 'Pricing' })).toHaveCount(0);

  const latestReportLink = page.getByRole('link', { name: 'Read latest free report' });
  await expect(latestReportLink).toBeVisible();
  await expect(latestReportLink).toHaveAttribute('href', `/reports/${getLatestReportSlug()}`);
  await expect(page.getByRole('link', { name: 'Explore Pro products' })).toBeVisible();
});

test('/reports lists report items', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/reports');

  await expect(page.getByRole('heading', { level: 1, name: /public weekly reports, organized for quick scanning\./i })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Compare Weekly Pro and Monthly Bundle' })).toBeVisible();
  await expect(page.getByRole('heading', { level: 2, name: 'Archive trust cues' })).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Primary navigation' }).getByRole('link', { name: 'Reports' })).toHaveAttribute(
    'aria-current',
    'page'
  );
  await expect(page.getByRole('navigation', { name: 'Primary navigation' }).getByRole('link', { name: 'Pro' })).not.toHaveAttribute(
    'aria-current',
    'page'
  );

  const reportItems = page.getByRole('listitem');
  expect(await reportItems.count()).toBeGreaterThan(0);
});

test('/reports/[slug] renders report headings', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/reports');

  const firstReportLink = page.getByRole('link', { name: 'Read free report' }).first();
  await expect(firstReportLink).toBeVisible();
  await firstReportLink.click();

  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.getByRole('heading', { level: 2, name: /executive summary/i })).toBeVisible();
  await expect(page.getByRole('heading', { level: 2, name: /market snapshot/i })).toBeVisible();
  await expect(page.getByRole('heading', { level: 2, name: 'Report trust cues' })).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Primary navigation' }).getByRole('link', { name: 'Reports' })).toHaveAttribute(
    'aria-current',
    'page'
  );

  const singleIssueCtas = page.getByRole('link', { name: 'Buy Single Issue' });
  const monthlyBundleCtas = page.getByRole('link', { name: 'Buy Monthly Bundle' });

  await expect(singleIssueCtas).toHaveCount(2);
  await expect(monthlyBundleCtas).toHaveCount(2);
  await expect(singleIssueCtas.first()).toBeVisible();
  await expect(monthlyBundleCtas.first()).toBeVisible();
});

test('/pro renders and includes primary CTAs', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/pro');

  await expect(
    page.getByRole('heading', {
      level: 1,
      name: /choose your paid research plan\./i
    })
  ).toBeVisible();
  await expect(page.getByRole('heading', { level: 2, name: 'One week or full-month continuity?' })).toBeVisible();
  await expect(page.getByRole('heading', { level: 2, name: 'Weekly Crypto Pulse Pro — Single Issue' })).toBeVisible();
  await expect(page.getByRole('heading', { level: 2, name: 'Weekly Crypto Pulse Pro — Monthly Bundle' })).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Primary navigation' }).getByRole('link', { name: 'Pro' })).toHaveAttribute(
    'aria-current',
    'page'
  );
  await expect(page.getByRole('link', { name: 'Buy Single Issue' })).toHaveCount(1);
  await expect(page.getByRole('link', { name: 'Buy Monthly Bundle' })).toHaveCount(1);
  await expect(page.getByRole('heading', { level: 2, name: 'Before you buy' })).toBeVisible();
  await expect(page.getByRole('heading', { level: 2, name: 'Plan comparison' })).toBeVisible();
});

test('single-page navigation items only activate on their exact routes', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });

  const primaryNavigation = page.getByRole('navigation', { name: 'Primary navigation' });

  await page.goto('/methodology');
  await expect(primaryNavigation.getByRole('link', { name: 'Methodology' })).toHaveAttribute('aria-current', 'page');
  await expect(primaryNavigation.getByRole('link', { name: 'Disclaimer' })).not.toHaveAttribute('aria-current', 'page');

  await page.goto('/disclaimer');
  await expect(primaryNavigation.getByRole('link', { name: 'Disclaimer' })).toHaveAttribute('aria-current', 'page');
  await expect(primaryNavigation.getByRole('link', { name: 'Methodology' })).not.toHaveAttribute('aria-current', 'page');

  const methodologyNotFoundResponse = await page.goto('/methodology/not-a-real-page');
  expect(methodologyNotFoundResponse?.status()).toBe(404);
  await expect(primaryNavigation.getByRole('link', { name: 'Methodology' })).not.toHaveAttribute('aria-current', 'page');

  const disclaimerNotFoundResponse = await page.goto('/disclaimer/not-a-real-page');
  expect(disclaimerNotFoundResponse?.status()).toBe(404);
  await expect(primaryNavigation.getByRole('link', { name: 'Disclaimer' })).not.toHaveAttribute('aria-current', 'page');
});

test('invalid report slug returns 404 content', async ({ page }) => {
  const response = await page.goto('/reports/not-a-real-report-slug');

  expect(response?.status()).toBe(404);
  await expect(page.getByRole('heading', { level: 1, name: 'Report not found' })).toBeVisible();
});
