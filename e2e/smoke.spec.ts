import { expect, test } from '@playwright/test';
import { readdirSync } from 'node:fs';
import path from 'node:path';

const reportsDirectory = path.join(process.cwd(), 'data/reports');

const getLatestReportSlug = (): string => {
  const reportSlugs = readdirSync(reportsDirectory)
    .filter((fileName) => fileName.endsWith('.json'))
    .map((fileName) => fileName.replace('.json', ''))
    .sort((left, right) => right.localeCompare(left));

  const latestReportSlug = reportSlugs[0];
  if (!latestReportSlug) {
    throw new Error('Expected at least one report artifact in data/reports.');
  }

  return latestReportSlug;
};

test('homepage renders and links to latest report', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { level: 1 })).toContainText('Weekly coverage with a clear ladder');

  const primaryNavigation = page.getByRole('navigation', { name: 'Primary navigation' });
  await expect(primaryNavigation.getByRole('link', { name: 'Reports' })).toBeVisible();
  await expect(primaryNavigation.getByRole('link', { name: 'Pro' })).toBeVisible();
  await expect(primaryNavigation.getByRole('link', { name: 'Methodology' })).toBeVisible();
  await expect(primaryNavigation.getByRole('link', { name: 'Disclaimer' })).toBeVisible();
  await expect(primaryNavigation.getByRole('link', { name: 'Pricing' })).toHaveCount(0);

  const latestReportLink = page.getByRole('link', { name: 'Read latest free report' });
  await expect(latestReportLink).toBeVisible();
  await expect(latestReportLink).toHaveAttribute('href', `/reports/${getLatestReportSlug()}`);
});

test('/reports lists report items', async ({ page }) => {
  await page.goto('/reports');

  await expect(page.getByRole('heading', { name: 'Reports archive' })).toBeVisible();
  const reportItems = page.getByRole('listitem');
  expect(await reportItems.count()).toBeGreaterThan(0);
});

test('/reports/[slug] renders report headings', async ({ page }) => {
  await page.goto('/reports');

  const firstReportLink = page.getByRole('link', { name: 'Read free report' }).first();
  await expect(firstReportLink).toBeVisible();
  await firstReportLink.click();

  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.getByRole('heading', { level: 2, name: 'Executive summary' })).toBeVisible();
  await expect(page.getByRole('heading', { level: 2, name: 'Market snapshot' })).toBeVisible();
});

test('/pro renders and includes primary CTA', async ({ page }) => {
  await page.goto('/pro');

  await expect(page.getByRole('heading', { level: 1, name: 'Free, Weekly Pro, and Monthly Bundle.' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Buy Single Issue' })).toBeVisible();
});

test('invalid report slug returns 404 content', async ({ page }) => {
  const response = await page.goto('/reports/not-a-real-report-slug');

  expect(response?.status()).toBe(404);
  await expect(page.getByRole('heading', { level: 1, name: 'Report not found' })).toBeVisible();
});
