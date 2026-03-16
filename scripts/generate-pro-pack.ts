import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

import type { ProProductId } from '@/domain/pro-product';
import type { Report } from '../domain/report';

type Watermark = Readonly<{
  buyerEmail: string;
  orderRef: string;
}>;

type BaseCliArgs = Readonly<{
  product: ProProductId;
  watermark?: Watermark;
}>;

type SingleIssueCliArgs = BaseCliArgs &
  Readonly<{
    product: 'singleIssue';
    slug: string;
  }>;

type MonthlyBundleCliArgs = BaseCliArgs &
  Readonly<{
    product: 'monthlyBundle';
    month: string;
    slugs?: ReadonlyArray<string>;
  }>;

type ProPackCliArgs = SingleIssueCliArgs | MonthlyBundleCliArgs;

type MonthlySummary = Readonly<{
  month: string;
  weeklyReports: ReadonlyArray<Report>;
  averageMarketCapUsd: number;
  averageBtcDominancePct: number;
  averageEthDominancePct: number;
  averageFearGreedIndex: number;
  regimeDistribution: ReadonlyArray<Readonly<{ regime: Report['regime']; count: number }>>;
  topMovers: ReadonlyArray<Readonly<{ symbol: string; name: string; changePct7d: number; reportSlug: string }>>;
  recurringThesis: ReadonlyArray<Readonly<{ item: string; count: number }>>;
}>;

const REPORTS_DIRECTORY_PATH = path.resolve(process.cwd(), 'data/reports');
const OUTPUT_DIRECTORY_PATH = path.resolve(process.cwd(), 'data/pro-packs');

const formatUsd = (value: number): string =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: 'compact',
    maximumFractionDigits: 2
  }).format(value);

const formatPercent = (value: number): string => `${value.toFixed(2)}%`;

const formatList = (items: ReadonlyArray<string>): string => (items.length === 0 ? '- None' : items.map((item) => `- ${item}`).join('\n'));

const formatSubSection = (heading: string, body: string, highlights: ReadonlyArray<string>): string => [
  `### ${heading}`,
  '',
  body,
  '',
  'Highlights',
  '',
  formatList(highlights)
].join('\n');

const formatWatermarkSection = (watermark?: Watermark): string => {
  if (!watermark) {
    return ['## License and watermark', '', 'License: Personal use only. Redistribution is not allowed.'].join('\n');
  }

  return [
    '## License and watermark',
    '',
    'License: Personal use only. Redistribution is not allowed.',
    `Buyer watermark: ${watermark.buyerEmail} · ${watermark.orderRef}`
  ].join('\n');
};

const formatReportHeader = (report: Report): string => {
  const { metadata } = report;

  return [
    '## Report metadata',
    '',
    `- Title: ${metadata.title}`,
    `- Slug: ${metadata.slug}`,
    `- Week: ${metadata.weekLabel}`,
    `- Published at: ${metadata.publishedAt}`,
    `- Regime: ${report.regime}`,
    `- Tags: ${metadata.tags.join(', ')}`
  ].join('\n');
};

const toSingleIssueMarkdown = (report: Report, watermark?: Watermark): string => {
  const { metadata, marketSnapshot, movers, sections, signals } = report;

  const moversBlock = movers
    .map((mover) => `- **${mover.symbol} (${mover.name})**: ${formatPercent(mover.changePct7d)} — ${mover.catalyst}`)
    .join('\n');

  const watchlistBlock = signals.watchlistLevels
    .map((level) => `- **${level.asset}** at \`${level.level}\`: ${level.context}`)
    .join('\n');

  const sectionBlocks = sections.map((section) => formatSubSection(section.heading, section.body, section.highlights)).join('\n\n');

  return [
    '# Weekly Crypto Pulse Pro Pack — Single Issue',
    '',
    formatReportHeader(report),
    '',
    '## Executive summary',
    '',
    metadata.summary,
    '',
    '## Market snapshot',
    '',
    `- Total market cap: ${formatUsd(marketSnapshot.totalMarketCapUsd)}`,
    `- BTC dominance: ${formatPercent(marketSnapshot.btcDominancePct)}`,
    `- ETH dominance: ${formatPercent(marketSnapshot.ethDominancePct)}`,
    `- Fear & Greed index: ${marketSnapshot.fearGreedIndex}`,
    '',
    '## Movers (7d)',
    '',
    moversBlock.length > 0 ? moversBlock : '- None',
    '',
    '## Deep dive sections',
    '',
    sectionBlocks.length > 0 ? sectionBlocks : 'No sections available.',
    '',
    '## Actionable thesis',
    '',
    formatList(signals.thesis),
    '',
    '## Risk checklist',
    '',
    formatList(signals.riskChecklist),
    '',
    '## What changed since last week',
    '',
    formatList(signals.changedSinceLastWeek),
    '',
    '## Watchlist levels',
    '',
    watchlistBlock.length > 0 ? watchlistBlock : '- None',
    '',
    formatWatermarkSection(watermark),
    '',
    '## Fulfillment note',
    '',
    'This markdown is deterministic for a given report slug and input watermark and is suitable for direct delivery or PDF conversion.'
  ].join('\n');
};

const toMonthKey = (publishedAt: string): string => publishedAt.slice(0, 7);

const ensureMonthKey = (value: string): string => {
  if (!/^\d{4}-\d{2}$/.test(value)) {
    throw new Error(`Invalid month "${value}". Expected format YYYY-MM.`);
  }

  return value;
};

const aggregateMonthlySummary = (month: string, weeklyReports: ReadonlyArray<Report>): MonthlySummary => {
  const totalReports = weeklyReports.length;

  const averageMarketCapUsd = weeklyReports.reduce((total, report) => total + report.marketSnapshot.totalMarketCapUsd, 0) / totalReports;
  const averageBtcDominancePct = weeklyReports.reduce((total, report) => total + report.marketSnapshot.btcDominancePct, 0) / totalReports;
  const averageEthDominancePct = weeklyReports.reduce((total, report) => total + report.marketSnapshot.ethDominancePct, 0) / totalReports;
  const averageFearGreedIndex = weeklyReports.reduce((total, report) => total + report.marketSnapshot.fearGreedIndex, 0) / totalReports;

  const regimeCounts = new Map<Report['regime'], number>();

  for (const report of weeklyReports) {
    const current = regimeCounts.get(report.regime) ?? 0;
    regimeCounts.set(report.regime, current + 1);
  }

  const regimeDistribution = [...regimeCounts.entries()]
    .map(([regime, count]) => ({ regime, count }))
    .sort((left, right) => (right.count - left.count === 0 ? left.regime.localeCompare(right.regime) : right.count - left.count));

  const topMovers = weeklyReports
    .flatMap((report) =>
      report.movers.map((mover) => ({
        symbol: mover.symbol,
        name: mover.name,
        changePct7d: mover.changePct7d,
        reportSlug: report.metadata.slug
      }))
    )
    .sort((left, right) => {
      const absoluteDiff = Math.abs(right.changePct7d) - Math.abs(left.changePct7d);

      if (absoluteDiff !== 0) {
        return absoluteDiff;
      }

      return `${left.symbol}-${left.reportSlug}`.localeCompare(`${right.symbol}-${right.reportSlug}`);
    })
    .slice(0, 8);

  const thesisCounts = new Map<string, number>();

  for (const report of weeklyReports) {
    for (const thesisItem of report.signals.thesis) {
      const key = thesisItem.trim();
      const current = thesisCounts.get(key) ?? 0;
      thesisCounts.set(key, current + 1);
    }
  }

  const recurringThesis = [...thesisCounts.entries()]
    .map(([item, count]) => ({ item, count }))
    .sort((left, right) => (right.count - left.count === 0 ? left.item.localeCompare(right.item) : right.count - left.count))
    .slice(0, 10);

  return {
    month,
    weeklyReports,
    averageMarketCapUsd,
    averageBtcDominancePct,
    averageEthDominancePct,
    averageFearGreedIndex,
    regimeDistribution,
    topMovers,
    recurringThesis
  };
};

const toMonthlySummaryMarkdown = (summary: MonthlySummary, watermark?: Watermark): string => {
  const weeklyReferenceLines = summary.weeklyReports
    .map((report) => `- ${report.metadata.weekLabel}: ${report.metadata.title} (\`${report.metadata.slug}\`)`)
    .join('\n');

  const regimeLines = summary.regimeDistribution.map((entry) => `- ${entry.regime}: ${entry.count} week(s)`).join('\n');
  const moversLines = summary.topMovers
    .map((mover) => `- **${mover.symbol} (${mover.name})** ${formatPercent(mover.changePct7d)} in \`${mover.reportSlug}\``)
    .join('\n');
  const recurringThesisLines = summary.recurringThesis
    .map((entry) => `- (${entry.count}x) ${entry.item}`)
    .join('\n');

  return [
    '# Weekly Crypto Pulse Pro — Monthly Summary',
    '',
    `## Month: ${summary.month}`,
    '',
    '## Weekly reports included',
    '',
    weeklyReferenceLines,
    '',
    '## Monthly aggregate snapshot',
    '',
    `- Average total market cap: ${formatUsd(summary.averageMarketCapUsd)}`,
    `- Average BTC dominance: ${formatPercent(summary.averageBtcDominancePct)}`,
    `- Average ETH dominance: ${formatPercent(summary.averageEthDominancePct)}`,
    `- Average Fear & Greed index: ${summary.averageFearGreedIndex.toFixed(2)}`,
    '',
    '## Regime distribution',
    '',
    regimeLines.length > 0 ? regimeLines : '- None',
    '',
    '## Top movers across the month (absolute 7d change)',
    '',
    moversLines.length > 0 ? moversLines : '- None',
    '',
    '## Recurring thesis points',
    '',
    recurringThesisLines.length > 0 ? recurringThesisLines : '- None',
    '',
    formatWatermarkSection(watermark),
    '',
    '## Fulfillment note',
    '',
    'This summary is deterministically assembled from exactly four weekly report artifacts for the requested month.'
  ].join('\n');
};

const toMonthlyBundleAssemblyMarkdown = (month: string, weeklyReports: ReadonlyArray<Report>, monthlySummaryFileName: string, watermark?: Watermark): string => {
  const references = weeklyReports
    .map(
      (report, index) =>
        `${index + 1}. ${report.metadata.weekLabel} — ${report.metadata.title} (slug: \`${report.metadata.slug}\`, published: ${report.metadata.publishedAt})`
    )
    .join('\n');

  return [
    '# Weekly Crypto Pulse Pro Pack — Monthly Bundle',
    '',
    `## Month: ${month}`,
    '',
    '## Weekly report references (4)',
    '',
    references,
    '',
    '## Monthly summary artifact',
    '',
    `- File: \`${monthlySummaryFileName}\``,
    '',
    formatWatermarkSection(watermark),
    '',
    '## Fulfillment note',
    '',
    'This assembly is deterministic for a given month and ordered weekly report slug set.'
  ].join('\n');
};

const parseArtifact = (rawJson: string, sourceFile: string): Report => {
  let parsed: unknown;

  try {
    parsed = JSON.parse(rawJson) as unknown;
  } catch {
    throw new Error(`Invalid JSON in report file "${sourceFile}".`);
  }

  if (typeof parsed !== 'object' || parsed === null) {
    throw new Error(`Invalid report file "${sourceFile}": expected object root.`);
  }

  const root = parsed as Record<string, unknown>;
  const reportNode = 'report' in root ? root.report : root;

  if (typeof reportNode !== 'object' || reportNode === null) {
    throw new Error(`Invalid report file "${sourceFile}": missing report payload.`);
  }

  return reportNode as Report;
};

const readAllReports = async (): Promise<ReadonlyArray<Report>> => {
  const reportFileNames = (await readdir(REPORTS_DIRECTORY_PATH))
    .filter((fileName) => fileName.endsWith('.json'))
    .sort((left, right) => left.localeCompare(right));

  const reports: Array<Report> = [];

  for (const fileName of reportFileNames) {
    const filePath = path.join(REPORTS_DIRECTORY_PATH, fileName);
    const rawJson = await readFile(filePath, 'utf-8');
    const report = parseArtifact(rawJson, fileName);
    reports.push(report);
  }

  return reports;
};

const readReportBySlug = async (slug: string): Promise<Report> => {
  const reports = await readAllReports();
  const matched = reports.find((report) => report.metadata.slug === slug);

  if (!matched) {
    throw new Error(`Report not found for slug "${slug}".`);
  }

  return matched;
};

const selectMonthlyReports = (month: string, reports: ReadonlyArray<Report>, slugs?: ReadonlyArray<string>): ReadonlyArray<Report> => {
  if (slugs && slugs.length > 0) {
    const bySlug = new Map(reports.map((report) => [report.metadata.slug, report]));
    const resolved = slugs.map((slug) => {
      const report = bySlug.get(slug);

      if (!report) {
        throw new Error(`Monthly bundle slug "${slug}" was not found in data/reports.`);
      }

      if (toMonthKey(report.metadata.publishedAt) !== month) {
        throw new Error(`Monthly bundle slug "${slug}" is outside month "${month}".`);
      }

      return report;
    });

    if (resolved.length !== 4) {
      throw new Error('Monthly bundle requires exactly four weekly report slugs.');
    }

    return [...resolved].sort((left, right) => left.metadata.publishedAt.localeCompare(right.metadata.publishedAt));
  }

  const reportsInMonth = reports
    .filter((report) => toMonthKey(report.metadata.publishedAt) === month)
    .sort((left, right) => left.metadata.publishedAt.localeCompare(right.metadata.publishedAt));

  if (reportsInMonth.length !== 4) {
    throw new Error(`Expected exactly four weekly reports for month "${month}", found ${reportsInMonth.length}.`);
  }

  return reportsInMonth;
};

const readFlagValue = (argv: ReadonlyArray<string>, flagName: string): string | undefined => {
  const index = argv.indexOf(flagName);

  if (index === -1) {
    return undefined;
  }

  const value = argv[index + 1]?.trim();

  if (!value || value.startsWith('--')) {
    throw new Error(`Missing value for ${flagName}.`);
  }

  return value;
};

const parseOptionalWatermark = (argv: ReadonlyArray<string>): Watermark | undefined => {
  const buyerEmail = readFlagValue(argv, '--buyerEmail');
  const orderRef = readFlagValue(argv, '--orderRef');

  if (!buyerEmail && !orderRef) {
    return undefined;
  }

  if (!buyerEmail || !orderRef) {
    throw new Error('Watermark inputs require both --buyerEmail and --orderRef.');
  }

  return { buyerEmail, orderRef };
};

const parseArgs = (argv: ReadonlyArray<string>): ProPackCliArgs => {
  const product = (readFlagValue(argv, '--product') ?? 'singleIssue') as ProProductId;
  const watermark = parseOptionalWatermark(argv);

  if (product === 'singleIssue') {
    const slug = readFlagValue(argv, '--slug');

    if (!slug) {
      throw new Error('Missing required flags. Usage: npm run generate:pro -- --product singleIssue --slug <report-slug>');
    }

    return { product, slug, watermark };
  }

  if (product === 'monthlyBundle') {
    const month = readFlagValue(argv, '--month');

    if (!month) {
      throw new Error(
        'Missing required flags. Usage: npm run generate:pro -- --product monthlyBundle --month <YYYY-MM> [--slugs <slug1,slug2,slug3,slug4>]'
      );
    }

    const slugsFlag = readFlagValue(argv, '--slugs');
    const slugs = slugsFlag ? slugsFlag.split(',').map((item) => item.trim()).filter((item) => item.length > 0) : undefined;

    return {
      product,
      month: ensureMonthKey(month),
      slugs,
      watermark
    };
  }

  throw new Error(`Unsupported --product value "${product}". Expected "singleIssue" or "monthlyBundle".`);
};

const writeArtifact = async (outputPath: string, contents: string): Promise<void> => {
  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${contents}\n`, 'utf-8');
};

const runSingleIssueGeneration = async (args: SingleIssueCliArgs): Promise<void> => {
  const report = await readReportBySlug(args.slug);
  const markdown = toSingleIssueMarkdown(report, args.watermark);
  const outputPath = path.join(OUTPUT_DIRECTORY_PATH, `${args.slug}.md`);

  await writeArtifact(outputPath, markdown);

  console.log(`Generated Pro single-issue pack: ${path.relative(process.cwd(), outputPath)}`);
};

const runMonthlyBundleGeneration = async (args: MonthlyBundleCliArgs): Promise<void> => {
  const allReports = await readAllReports();
  const weeklyReports = selectMonthlyReports(args.month, allReports, args.slugs);

  const summary = aggregateMonthlySummary(args.month, weeklyReports);
  const summaryFileName = `${args.month}-summary.md`;
  const bundleFileName = `${args.month}-bundle.md`;

  const summaryMarkdown = toMonthlySummaryMarkdown(summary, args.watermark);
  const assemblyMarkdown = toMonthlyBundleAssemblyMarkdown(args.month, weeklyReports, summaryFileName, args.watermark);

  const summaryPath = path.join(OUTPUT_DIRECTORY_PATH, 'monthly-summaries', summaryFileName);
  const bundlePath = path.join(OUTPUT_DIRECTORY_PATH, 'monthly-bundles', bundleFileName);

  await writeArtifact(summaryPath, summaryMarkdown);
  await writeArtifact(bundlePath, assemblyMarkdown);

  console.log(`Generated Pro monthly bundle assembly: ${path.relative(process.cwd(), bundlePath)}`);
  console.log(`Generated Pro monthly summary: ${path.relative(process.cwd(), summaryPath)}`);
};

const main = async (): Promise<void> => {
  const args = parseArgs(process.argv);

  if (args.product === 'singleIssue') {
    await runSingleIssueGeneration(args);
    return;
  }

  await runMonthlyBundleGeneration(args);
};

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : 'Unknown generation error.';
  console.error(`Failed to generate Pro pack: ${message}`);
  process.exitCode = 1;
});
