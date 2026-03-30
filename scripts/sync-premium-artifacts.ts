import { spawnSync } from 'node:child_process';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

import type { Report } from '../domain/report';

type MonthSummary = Readonly<{
  month: string;
  reportCount: number;
}>;

const REPORTS_DIRECTORY_PATH = path.resolve(process.cwd(), 'data/reports');
const PRO_PACK_SCRIPT_PATH = path.resolve(process.cwd(), '.generated/scripts/scripts/generate-pro-pack.js');

const toMonthKey = (publishedAt: string): string => publishedAt.slice(0, 7);

const toIsoMonthUtc = (date: Date): string => {
  const month = `${date.getUTCMonth() + 1}`.padStart(2, '0');

  return `${date.getUTCFullYear()}-${month}`;
};

const byPublishedAtDesc = (left: Report, right: Report): number =>
  right.metadata.publishedAt.localeCompare(left.metadata.publishedAt);

const parseReportFromJson = (rawJson: string, fileName: string): Report => {
  let parsed: unknown;

  try {
    parsed = JSON.parse(rawJson) as unknown;
  } catch {
    throw new Error(`Invalid JSON in report file "${fileName}".`);
  }

  if (typeof parsed !== 'object' || parsed === null) {
    throw new Error(`Invalid report file "${fileName}": expected object root.`);
  }

  const root = parsed as Record<string, unknown>;
  const reportNode = 'report' in root ? root.report : root;

  if (typeof reportNode !== 'object' || reportNode === null) {
    throw new Error(`Invalid report file "${fileName}": missing report payload.`);
  }

  return reportNode as Report;
};

const readReports = async (): Promise<ReadonlyArray<Report>> => {
  const files = (await readdir(REPORTS_DIRECTORY_PATH)).filter((file) => file.endsWith('.json')).sort((left, right) => left.localeCompare(right));

  const reports: Array<Report> = [];

  for (const fileName of files) {
    const rawReport = await readFile(path.join(REPORTS_DIRECTORY_PATH, fileName), 'utf-8');
    reports.push(parseReportFromJson(rawReport, fileName));
  }

  return reports.sort(byPublishedAtDesc);
};

const runProPackCommand = (args: ReadonlyArray<string>): void => {
  const command = [PRO_PACK_SCRIPT_PATH, ...args].join(' ');
  const result = spawnSync(process.execPath, [PRO_PACK_SCRIPT_PATH, ...args], {
    cwd: process.cwd(),
    stdio: 'inherit'
  });

  if (result.status !== 0) {
    throw new Error(`Pro pack generation command failed: node ${command}`);
  }
};

const selectTargetMonth = (reports: ReadonlyArray<Report>): MonthSummary | undefined => {
  const latestReport = reports[0];

  if (!latestReport) {
    return undefined;
  }

  const targetMonth = toMonthKey(latestReport.metadata.publishedAt);
  const reportCount = reports.filter((report) => toMonthKey(report.metadata.publishedAt) === targetMonth).length;

  return {
    month: targetMonth,
    reportCount
  };
};

const main = async (): Promise<void> => {
  const reports = await readReports();
  const latestReport = reports[0];

  if (!latestReport) {
    throw new Error('No report artifacts found in data/reports. Generate a weekly report before syncing premium artifacts.');
  }

  runProPackCommand(['--product', 'singleIssue', '--slug', latestReport.metadata.slug]);

  const targetMonth = selectTargetMonth(reports);

  if (!targetMonth) {
    return;
  }

  if (targetMonth.reportCount === 4) {
    runProPackCommand(['--product', 'monthlyBundle', '--month', targetMonth.month]);
    return;
  }

  const currentMonth = toIsoMonthUtc(new Date());
  const reason =
    targetMonth.month === currentMonth
      ? `month is still in progress (${targetMonth.reportCount}/4 reports)`
      : `month has ${targetMonth.reportCount} reports (expected exactly 4)`;

  console.log(`Skipping monthly bundle generation for ${targetMonth.month}: ${reason}.`);
};

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : 'Unknown premium artifact sync error.';
  console.error(`Failed to sync premium artifacts: ${message}`);
  process.exitCode = 1;
});
