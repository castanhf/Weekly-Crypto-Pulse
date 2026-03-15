import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

import type { Report } from '../domain/report';

type ProPackCliArgs = {
  slug: string;
};

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

const toProPackMarkdown = (report: Report): string => {
  const { metadata, marketSnapshot, movers, sections, signals } = report;

  const moversBlock = movers
    .map((mover) => `- **${mover.symbol} (${mover.name})**: ${formatPercent(mover.changePct7d)} — ${mover.catalyst}`)
    .join('\n');

  const watchlistBlock = signals.watchlistLevels
    .map((level) => `- **${level.asset}** at \`${level.level}\`: ${level.context}`)
    .join('\n');

  const sectionBlocks = sections.map((section) => formatSubSection(section.heading, section.body, section.highlights)).join('\n\n');

  return [
    '# Weekly Crypto Pulse Pro Pack',
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
    '## Fulfillment note',
    '',
    'This markdown is deterministic for a given report slug and is suitable for direct delivery or PDF conversion.'
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

const readReportBySlug = async (slug: string): Promise<Report> => {
  const reportFileNames = (await readdir(REPORTS_DIRECTORY_PATH))
    .filter((fileName) => fileName.endsWith('.json'))
    .sort((left, right) => left.localeCompare(right));

  for (const fileName of reportFileNames) {
    const filePath = path.join(REPORTS_DIRECTORY_PATH, fileName);
    const rawJson = await readFile(filePath, 'utf-8');
    const report = parseArtifact(rawJson, fileName);

    if (report.metadata.slug === slug) {
      return report;
    }
  }

  throw new Error(`Report not found for slug "${slug}".`);
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

const parseArgs = (argv: ReadonlyArray<string>): ProPackCliArgs => {
  const slug = readFlagValue(argv, '--slug');

  if (!slug) {
    throw new Error('Missing required flags. Usage: npm run generate:pro -- --slug <report-slug>');
  }

  return { slug };
};

const main = async (): Promise<void> => {
  const { slug } = parseArgs(process.argv);
  const report = await readReportBySlug(slug);
  const markdown = toProPackMarkdown(report);
  const outputPath = path.join(OUTPUT_DIRECTORY_PATH, `${slug}.md`);

  await mkdir(OUTPUT_DIRECTORY_PATH, { recursive: true });
  await writeFile(outputPath, markdown, 'utf-8');

  console.log(`Generated Pro pack: ${path.relative(process.cwd(), outputPath)}`);
};

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : 'Unknown generation error.';
  console.error(`Failed to generate Pro pack: ${message}`);
  process.exitCode = 1;
});
