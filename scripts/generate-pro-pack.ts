import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { PRO_PRODUCT_IDS, type ProProductId } from '../domain/pro-product';
import type { Report } from '../domain/report';
import { assertBuyerEmail, toBuyerWatermarkLine, type BuyerWatermark } from '../lib/pro-pack-watermark';

type BaseCliArgs = Readonly<{
  product: ProProductId;
  watermark?: BuyerWatermark;
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
  continuityLedger: ReadonlyArray<Readonly<{ weekLabel: string; reportSlug: string; changeLines: ReadonlyArray<string> }>>;
  thesisCarryForward: Readonly<{
    persisted: ReadonlyArray<Readonly<{ item: string; count: number }>>;
    emerging: ReadonlyArray<Readonly<{ item: string; firstSeenWeekLabel: string }>>;
    faded: ReadonlyArray<Readonly<{ item: string; lastSeenWeekLabel: string }>>;
  }>;
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

const createMarkdownSection = (
  heading: string,
  content: string | ReadonlyArray<string>,
  watermark?: BuyerWatermark,
  level = 2
): string => {
  const lines = Array.isArray(content) ? [...content] : [content];
  const watermarkLine = toBuyerWatermarkLine(watermark);
  const headingPrefix = '#'.repeat(level);

  return [
    `${headingPrefix} ${heading}`,
    ...(watermarkLine ? ['', watermarkLine] : []),
    '',
    ...lines
  ].join('\n');
};

const formatSubSection = (heading: string, body: string, highlights: ReadonlyArray<string>, watermark?: BuyerWatermark): string =>
  createMarkdownSection(
    heading,
    [body, '', 'Highlights', '', formatList(highlights)],
    watermark,
    3
  );

const formatWatermarkSection = (watermark?: BuyerWatermark): string =>
  createMarkdownSection(
    'License and watermark',
    [
      'License: Personal use only. Redistribution is not allowed.',
      watermark ? `Buyer watermark: ${toBuyerWatermarkLine(watermark)?.replace(/^>\s*/, '')}` : 'Buyer watermark: Generated only when buyer metadata is supplied.'
    ],
    watermark
  );

const formatReportHeader = (report: Report, watermark?: BuyerWatermark): string => {
  const { metadata } = report;

  return createMarkdownSection(
    'Report metadata',
    [
      `- Title: ${metadata.title}`,
      `- Slug: ${metadata.slug}`,
      `- Week: ${metadata.weekLabel}`,
      `- Published at: ${metadata.publishedAt}`,
      `- Regime: ${report.regime}`,
      `- Tags: ${metadata.tags.join(', ')}`
    ],
    watermark
  );
};

const toSingleIssueMarkdown = (report: Report, watermark?: BuyerWatermark): string => {
  const { metadata, marketSnapshot, movers, sections, signals } = report;

  const moversBlock = movers
    .map((mover) => `- **${mover.symbol} (${mover.name})**: ${formatPercent(mover.changePct7d)} — ${mover.catalyst}`)
    .join('\n');

  const watchlistBlock = signals.watchlistLevels
    .map((level) => `- **${level.asset}** at \`${level.level}\`: ${level.context}`)
    .join('\n');

  const sectionBlocks = sections.map((section) => formatSubSection(section.heading, section.body, section.highlights, watermark)).join('\n\n');

  return [
    '# Weekly Crypto Pulse Pro Pack — Single Issue',
    '',
    formatReportHeader(report, watermark),
    '',
    createMarkdownSection('Executive summary', metadata.summary, watermark),
    '',
    createMarkdownSection(
      'Market snapshot',
      [
        `- Total market cap: ${formatUsd(marketSnapshot.totalMarketCapUsd)}`,
        `- BTC dominance: ${formatPercent(marketSnapshot.btcDominancePct)}`,
        `- ETH dominance: ${formatPercent(marketSnapshot.ethDominancePct)}`,
        `- Fear & Greed index: ${marketSnapshot.fearGreedIndex}`
      ],
      watermark
    ),
    '',
    createMarkdownSection('Movers (7d)', moversBlock.length > 0 ? moversBlock : '- None', watermark),
    '',
    createMarkdownSection('Deep dive sections', sectionBlocks.length > 0 ? sectionBlocks : 'No sections available.', watermark),
    '',
    createMarkdownSection('Actionable thesis', formatList(signals.thesis), watermark),
    '',
    createMarkdownSection('Risk checklist', formatList(signals.riskChecklist), watermark),
    '',
    createMarkdownSection('What changed since last week', formatList(signals.changedSinceLastWeek), watermark),
    '',
    createMarkdownSection('Decision scorecard (single-week)', formatDecisionSupportOverview(report), watermark),
    '',
    createMarkdownSection('Watchlist levels', watchlistBlock.length > 0 ? watchlistBlock : '- None', watermark),
    '',
    formatWatermarkSection(watermark),
    '',
    createMarkdownSection(
      'Fulfillment note',
      'This markdown is deterministic for a given report slug and input watermark and is suitable for direct delivery or PDF conversion.',
      watermark
    )
  ].join('\n');
};

const toMonthKey = (publishedAt: string): string => publishedAt.slice(0, 7);

const ensureMonthKey = (value: string): string => {
  if (!/^\d{4}-\d{2}$/.test(value)) {
    throw new Error(`Invalid month "${value}". Expected format YYYY-MM.`);
  }

  return value;
};

const formatDecisionSupportOverview = (report: Report): string => {
  const primaryPosture = report.signals.thesis[0] ?? 'No primary posture captured in thesis bullets.';
  const invalidationCues = report.signals.riskChecklist.slice(0, 3);
  const executionFocus = report.signals.changedSinceLastWeek.slice(0, 3);

  return [
    `- Primary posture: ${primaryPosture}`,
    `- Invalidation cues: ${invalidationCues.length > 0 ? invalidationCues.join(' | ') : 'No invalidation cues provided.'}`,
    `- Immediate execution focus: ${executionFocus.length > 0 ? executionFocus.join(' | ') : 'No week-over-week changes provided.'}`
  ].join('\n');
};

const collectContinuityLedger = (weeklyReports: ReadonlyArray<Report>): MonthlySummary['continuityLedger'] =>
  weeklyReports.map((report) => ({
    weekLabel: report.metadata.weekLabel,
    reportSlug: report.metadata.slug,
    changeLines:
      report.signals.changedSinceLastWeek.length > 0
        ? report.signals.changedSinceLastWeek
        : ['No explicit change lines were recorded for this issue.']
  }));

const collectThesisCarryForward = (weeklyReports: ReadonlyArray<Report>): MonthlySummary['thesisCarryForward'] => {
  const occurrenceByItem = new Map<
    string,
    {
      count: number;
      firstSeenIndex: number;
      firstSeenWeekLabel: string;
      lastSeenIndex: number;
      lastSeenWeekLabel: string;
    }
  >();

  weeklyReports.forEach((report, index) => {
    report.signals.thesis.forEach((thesisItem) => {
      const item = thesisItem.trim();
      const current = occurrenceByItem.get(item);

      if (!current) {
        occurrenceByItem.set(item, {
          count: 1,
          firstSeenIndex: index,
          firstSeenWeekLabel: report.metadata.weekLabel,
          lastSeenIndex: index,
          lastSeenWeekLabel: report.metadata.weekLabel
        });
        return;
      }

      occurrenceByItem.set(item, {
        count: current.count + 1,
        firstSeenIndex: current.firstSeenIndex,
        firstSeenWeekLabel: current.firstSeenWeekLabel,
        lastSeenIndex: index,
        lastSeenWeekLabel: report.metadata.weekLabel
      });
    });
  });

  const occurrences = [...occurrenceByItem.entries()].map(([item, occurrence]) => ({
    item,
    ...occurrence
  }));
  const finalWeekIndex = weeklyReports.length - 1;

  const persisted = occurrences
    .filter((occurrence) => occurrence.count >= 3)
    .map((occurrence) => ({ item: occurrence.item, count: occurrence.count }))
    .sort((left, right) => (right.count - left.count === 0 ? left.item.localeCompare(right.item) : right.count - left.count))
    .slice(0, 6);

  const emerging = occurrences
    .filter((occurrence) => occurrence.firstSeenIndex >= 2)
    .map((occurrence) => ({ item: occurrence.item, firstSeenWeekLabel: occurrence.firstSeenWeekLabel }))
    .sort((left, right) => left.item.localeCompare(right.item))
    .slice(0, 6);

  const faded = occurrences
    .filter((occurrence) => occurrence.lastSeenIndex < finalWeekIndex)
    .map((occurrence) => ({ item: occurrence.item, lastSeenWeekLabel: occurrence.lastSeenWeekLabel }))
    .sort((left, right) => left.item.localeCompare(right.item))
    .slice(0, 6);

  return { persisted, emerging, faded };
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
  const continuityLedger = collectContinuityLedger(weeklyReports);
  const thesisCarryForward = collectThesisCarryForward(weeklyReports);

  return {
    month,
    weeklyReports,
    averageMarketCapUsd,
    averageBtcDominancePct,
    averageEthDominancePct,
    averageFearGreedIndex,
    regimeDistribution,
    topMovers,
    recurringThesis,
    continuityLedger,
    thesisCarryForward
  };
};

const toMonthlySummaryMarkdown = (summary: MonthlySummary, watermark?: BuyerWatermark): string => {
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
  const continuityLedgerLines = summary.continuityLedger
    .map((entry) => `- **${entry.weekLabel}** (\`${entry.reportSlug}\`): ${entry.changeLines.join(' | ')}`)
    .join('\n');
  const persistedLines = summary.thesisCarryForward.persisted
    .map((entry) => `- (${entry.count}x) ${entry.item}`)
    .join('\n');
  const emergingLines = summary.thesisCarryForward.emerging
    .map((entry) => `- ${entry.item} (first seen: ${entry.firstSeenWeekLabel})`)
    .join('\n');
  const fadedLines = summary.thesisCarryForward.faded
    .map((entry) => `- ${entry.item} (last seen: ${entry.lastSeenWeekLabel})`)
    .join('\n');

  return [
    '# Weekly Crypto Pulse Pro — Monthly Summary',
    '',
    createMarkdownSection('Month', summary.month, watermark),
    '',
    createMarkdownSection('Weekly reports included', weeklyReferenceLines.length > 0 ? weeklyReferenceLines : '- None', watermark),
    '',
    createMarkdownSection(
      'Monthly aggregate snapshot',
      [
        `- Average total market cap: ${formatUsd(summary.averageMarketCapUsd)}`,
        `- Average BTC dominance: ${formatPercent(summary.averageBtcDominancePct)}`,
        `- Average ETH dominance: ${formatPercent(summary.averageEthDominancePct)}`,
        `- Average Fear & Greed index: ${summary.averageFearGreedIndex.toFixed(2)}`
      ],
      watermark
    ),
    '',
    createMarkdownSection('Regime distribution', regimeLines.length > 0 ? regimeLines : '- None', watermark),
    '',
    createMarkdownSection('Top movers across the month (absolute 7d change)', moversLines.length > 0 ? moversLines : '- None', watermark),
    '',
    createMarkdownSection('Recurring thesis points', recurringThesisLines.length > 0 ? recurringThesisLines : '- None', watermark),
    '',
    createMarkdownSection('Continuity ledger (week-to-week)', continuityLedgerLines.length > 0 ? continuityLedgerLines : '- None', watermark),
    '',
    createMarkdownSection(
      'Thesis carry-forward map',
      [
        'Persisted signals',
        '',
        persistedLines.length > 0 ? persistedLines : '- None',
        '',
        'Emerging signals',
        '',
        emergingLines.length > 0 ? emergingLines : '- None',
        '',
        'Faded signals',
        '',
        fadedLines.length > 0 ? fadedLines : '- None'
      ],
      watermark
    ),
    '',
    formatWatermarkSection(watermark),
    '',
    createMarkdownSection(
      'Fulfillment note',
      'This summary is deterministically assembled from exactly four weekly report artifacts for the requested month.',
      watermark
    )
  ].join('\n');
};

const toMonthlyBundleAssemblyMarkdown = (
  month: string,
  weeklyReports: ReadonlyArray<Report>,
  monthlySummaryFileName: string,
  watermark?: BuyerWatermark
): string => {
  const references = weeklyReports
    .map(
      (report, index) =>
        `${index + 1}. ${report.metadata.weekLabel} — ${report.metadata.title} (slug: \`${report.metadata.slug}\`, published: ${report.metadata.publishedAt})`
    )
    .join('\n');

  return [
    '# Weekly Crypto Pulse Pro Pack — Monthly Bundle',
    '',
    createMarkdownSection('Month', month, watermark),
    '',
    createMarkdownSection(
      'Bundle continuity package',
      [
        '- Four weekly Pro decision reports (single-week decision support each)',
        '- One monthly continuity summary (cross-week ledger + thesis carry-forward map)',
        '- One assembly index to keep fulfillment deterministic'
      ],
      watermark
    ),
    '',
    createMarkdownSection('Weekly report references (4)', references, watermark),
    '',
    createMarkdownSection('Monthly summary artifact', `- File: \`${monthlySummaryFileName}\``, watermark),
    '',
    formatWatermarkSection(watermark),
    '',
    createMarkdownSection('Fulfillment note', 'This assembly is deterministic for a given month and ordered weekly report slug set.', watermark)
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

const parseProductId = (value?: string): ProProductId => {
  const product = value ?? 'singleIssue';

  if (!PRO_PRODUCT_IDS.includes(product as ProProductId)) {
    throw new Error(`Unsupported --product value "${product}". Expected "singleIssue" or "monthlyBundle".`);
  }

  return product as ProProductId;
};

const parseOptionalWatermark = (argv: ReadonlyArray<string>): BuyerWatermark | undefined => {
  const buyerEmail = readFlagValue(argv, '--buyerEmail');
  const orderRef = readFlagValue(argv, '--orderRef');
  const purchasedAt = readFlagValue(argv, '--purchasedAt');

  if (!buyerEmail && !orderRef && !purchasedAt) {
    return undefined;
  }

  if (!buyerEmail) {
    throw new Error('Buyer metadata requires --buyerEmail.');
  }

  return {
    buyerEmail: assertBuyerEmail(buyerEmail),
    orderRef,
    purchasedAt
  };
};

const parseArgs = (argv: ReadonlyArray<string>): ProPackCliArgs => {
  const product = parseProductId(readFlagValue(argv, '--product'));
  const watermark = parseOptionalWatermark(argv);

  if (product === 'singleIssue') {
    const slug = readFlagValue(argv, '--slug');

    if (!slug) {
      throw new Error(
        'Missing required flags. Usage: npm run generate:pro -- --product singleIssue --slug <report-slug> [--buyerEmail <email>] [--orderRef <ref>] [--purchasedAt <ISO-8601>]'
      );
    }

    return { product, slug, watermark };
  }

  if (product === 'monthlyBundle') {
    const month = readFlagValue(argv, '--month');

    if (!month) {
      throw new Error(
        'Missing required flags. Usage: npm run generate:pro -- --product monthlyBundle --month <YYYY-MM> [--slugs <slug1,slug2,slug3,slug4>] [--buyerEmail <email>] [--orderRef <ref>] [--purchasedAt <ISO-8601>]'
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
