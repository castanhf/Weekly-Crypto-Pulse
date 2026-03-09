import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

import type { Report } from '../domain/report';

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

const formatSection = (title: string, items: ReadonlyArray<string>): string => {
  if (items.length === 0) {
    return `## ${title}\n\n- None\n`;
  }

  const lines = items.map((item) => `- ${item}`).join('\n');

  return `## ${title}\n\n${lines}\n`;
};

const toProPackMarkdown = (report: Report): string => {
  const { metadata, marketSnapshot, movers, sections, signals } = report;
  const sectionBlocks = sections
    .map(
      (section) =>
        `### ${section.heading}\n\n${section.body}\n\n${section.highlights.map((highlight) => `- ${highlight}`).join('\n')}`
    )
    .join('\n\n');

  const moversBlock = movers
    .map((mover) => `- **${mover.symbol} (${mover.name})**: ${formatPercent(mover.changePct7d)} — ${mover.catalyst}`)
    .join('\n');

  const watchlistBlock = signals.watchlistLevels
    .map((level) => `- **${level.asset}** at \`${level.level}\`: ${level.context}`)
    .join('\n');

  return [
    `# Weekly Crypto Pulse Pro Pack`,
    '',
    `## Report`,
    '',
    `- Title: ${metadata.title}`,
    `- Slug: ${metadata.slug}`,
    `- Week: ${metadata.weekLabel}`,
    `- Published at: ${metadata.publishedAt}`,
    `- Regime: ${report.regime}`,
    `- Tags: ${metadata.tags.join(', ')}`,
    '',
    `## Executive summary`,
    '',
    metadata.summary,
    '',
    `## Market snapshot`,
    '',
    `- Total market cap: ${formatUsd(marketSnapshot.totalMarketCapUsd)}`,
    `- BTC dominance: ${formatPercent(marketSnapshot.btcDominancePct)}`,
    `- ETH dominance: ${formatPercent(marketSnapshot.ethDominancePct)}`,
    `- Fear & Greed index: ${marketSnapshot.fearGreedIndex}`,
    '',
    `## Movers (7d)`,
    '',
    moversBlock.length > 0 ? moversBlock : '- None',
    '',
    `## Deep dive sections`,
    '',
    sectionBlocks.length > 0 ? sectionBlocks : 'No sections available.',
    '',
    formatSection('Actionable thesis', signals.thesis),
    formatSection('Risk checklist', signals.riskChecklist),
    `## Watchlist levels`,
    '',
    watchlistBlock.length > 0 ? watchlistBlock : '- None',
    '',
    `## Manual delivery note`,
    '',
    `Deliver this markdown as-is, or convert to PDF while preserving headings and bullet order.`,
    ''
  ].join('\n');
};

const parseArtifact = (rawJson: string, sourceFile: string): Report => {
  let parsed: unknown;

  try {
    parsed = JSON.parse(rawJson) as unknown;
  } catch {
    throw new Error(`Invalid JSON in report file \"${sourceFile}\".`);
  }

  if (typeof parsed !== 'object' || parsed === null) {
    throw new Error(`Invalid report file \"${sourceFile}\": expected object root.`);
  }

  const root = parsed as Record<string, unknown>;
  const reportNode = 'report' in root ? root.report : root;

  if (typeof reportNode !== 'object' || reportNode === null) {
    throw new Error(`Invalid report file \"${sourceFile}\": missing report payload.`);
  }

  return reportNode as Report;
};

const readReportBySlug = async (slug: string): Promise<Report> => {
  const fileNames = (await readdir(REPORTS_DIRECTORY_PATH)).filter((fileName) => fileName.endsWith('.json')).sort((a, b) => a.localeCompare(b));

  for (const fileName of fileNames) {
    const filePath = path.join(REPORTS_DIRECTORY_PATH, fileName);
    const rawJson = await readFile(filePath, 'utf-8');
    const report = parseArtifact(rawJson, fileName);

    if (report.metadata.slug === slug) {
      return report;
    }
  }

  throw new Error(`Report not found for slug \"${slug}\".`);
};

const parseSlugFromArgs = (argv: ReadonlyArray<string>): string => {
  const slug = argv[2]?.trim();

  if (!slug) {
    throw new Error('Missing slug argument. Usage: npm run generate:pro-pack -- <report-slug>');
  }

  return slug;
};

const main = async (): Promise<void> => {
  const slug = parseSlugFromArgs(process.argv);
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
