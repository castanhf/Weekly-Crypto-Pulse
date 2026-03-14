import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

import type { Report } from '../domain/report';

type ProPackCliArgs = {
  slug: string;
  buyerEmail: string;
  orderRef?: string;
  purchasedAt?: string;
};

type WatermarkDetails = {
  maskedBuyerEmail: string;
  purchaseDateLabel: string;
  truncatedOrderRef: string;
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

const normalizeEmail = (email: string): string => email.trim().toLowerCase();

const assertValidEmail = (email: string): void => {
  const normalized = normalizeEmail(email);

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    throw new Error(`Invalid buyer email: "${email}".`);
  }
};

const maskEmail = (email: string): string => {
  const normalized = normalizeEmail(email);
  const [localPart, domain] = normalized.split('@');

  if (!localPart || !domain) {
    throw new Error(`Invalid buyer email: "${email}".`);
  }

  if (localPart.length === 1) {
    return `${localPart}***@${domain}`;
  }

  return `${localPart[0]}***${localPart[localPart.length - 1]}@${domain}`;
};

const formatPurchasedDate = (purchasedAt?: string): string => {
  if (!purchasedAt) {
    return 'unspecified';
  }

  const timestamp = Date.parse(purchasedAt);

  if (Number.isNaN(timestamp)) {
    throw new Error(`Invalid purchasedAt value: "${purchasedAt}". Use an ISO-8601 date string.`);
  }

  return new Date(timestamp).toISOString().slice(0, 10);
};

const truncateOrderRef = (orderRef?: string): string => {
  const normalized = orderRef?.trim();

  if (!normalized) {
    return 'n/a';
  }

  if (normalized.length <= 14) {
    return normalized;
  }

  return `${normalized.slice(0, 6)}…${normalized.slice(-4)}`;
};

const toWatermarkDetails = (args: ProPackCliArgs): WatermarkDetails => ({
  maskedBuyerEmail: maskEmail(args.buyerEmail),
  purchaseDateLabel: formatPurchasedDate(args.purchasedAt),
  truncatedOrderRef: truncateOrderRef(args.orderRef)
});

const formatWatermark = (details: WatermarkDetails): string =>
  `> _Buyer: ${details.maskedBuyerEmail} · Purchased: ${details.purchaseDateLabel} · Ref: ${details.truncatedOrderRef}_`;

const formatSection = (title: string, items: ReadonlyArray<string>, watermark: string): string => {
  const content = items.length === 0 ? '- None' : items.map((item) => `- ${item}`).join('\n');
  return `## ${title}\n\n${content}\n\n${watermark}\n`;
};

const formatSubSection = (title: string, body: string, highlights: ReadonlyArray<string>, watermark: string): string => {
  const highlightsBlock = highlights.length > 0 ? highlights.map((highlight) => `- ${highlight}`).join('\n') : '- None';
  return `### ${title}\n\n${body}\n\n${highlightsBlock}\n\n${watermark}`;
};

const formatReportSection = (report: Report, watermark: string): string => {
  const { metadata } = report;

  return [
    `## Report`,
    '',
    `- Title: ${metadata.title}`,
    `- Slug: ${metadata.slug}`,
    `- Week: ${metadata.weekLabel}`,
    `- Published at: ${metadata.publishedAt}`,
    `- Regime: ${report.regime}`,
    `- Tags: ${metadata.tags.join(', ')}`,
    '',
    watermark,
    ''
  ].join('\n');
};

const toProPackMarkdown = (report: Report, details: WatermarkDetails): string => {
  const { metadata, marketSnapshot, movers, sections, signals } = report;
  const watermark = formatWatermark(details);

  const sectionBlocks = sections
    .map((section) => formatSubSection(section.heading, section.body, section.highlights, watermark))
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
    formatReportSection(report, watermark),
    `## Executive summary`,
    '',
    metadata.summary,
    '',
    watermark,
    '',
    `## Market snapshot`,
    '',
    `- Total market cap: ${formatUsd(marketSnapshot.totalMarketCapUsd)}`,
    `- BTC dominance: ${formatPercent(marketSnapshot.btcDominancePct)}`,
    `- ETH dominance: ${formatPercent(marketSnapshot.ethDominancePct)}`,
    `- Fear & Greed index: ${marketSnapshot.fearGreedIndex}`,
    '',
    watermark,
    '',
    `## Movers (7d)`,
    '',
    moversBlock.length > 0 ? moversBlock : '- None',
    '',
    watermark,
    '',
    `## Deep dive sections`,
    '',
    sectionBlocks.length > 0 ? sectionBlocks : `No sections available.\n\n${watermark}`,
    '',
    formatSection('Actionable thesis', signals.thesis, watermark),
    formatSection('Risk checklist', signals.riskChecklist, watermark),
    formatSection('What changed since last week', signals.changedSinceLastWeek, watermark),
    `## Watchlist levels`,
    '',
    watchlistBlock.length > 0 ? watchlistBlock : '- None',
    '',
    watermark,
    '',
    `## Manual delivery note`,
    '',
    `Deliver this markdown as-is, or convert to PDF while preserving headings and bullet order.`,
    '',
    watermark,
    ''
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
  const fileNames = (await readdir(REPORTS_DIRECTORY_PATH)).filter((fileName) => fileName.endsWith('.json')).sort((a, b) => a.localeCompare(b));

  for (const fileName of fileNames) {
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
  const buyerEmail = readFlagValue(argv, '--buyerEmail');

  if (!slug || !buyerEmail) {
    throw new Error(
      'Missing required flags. Usage: npm run generate:pro -- --slug <report-slug> --buyerEmail <email> [--orderRef <ref>] [--purchasedAt <ISO-8601>]'
    );
  }

  assertValidEmail(buyerEmail);

  return {
    slug,
    buyerEmail,
    orderRef: readFlagValue(argv, '--orderRef'),
    purchasedAt: readFlagValue(argv, '--purchasedAt')
  };
};

const main = async (): Promise<void> => {
  const args = parseArgs(process.argv);
  const report = await readReportBySlug(args.slug);
  const watermarkDetails = toWatermarkDetails(args);
  const markdown = toProPackMarkdown(report, watermarkDetails);
  const outputPath = path.join(OUTPUT_DIRECTORY_PATH, `${args.slug}.md`);

  await mkdir(OUTPUT_DIRECTORY_PATH, { recursive: true });
  await writeFile(outputPath, markdown, 'utf-8');

  console.log(`Generated Pro pack: ${path.relative(process.cwd(), outputPath)}`);
};

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : 'Unknown generation error.';
  console.error(`Failed to generate Pro pack: ${message}`);
  process.exitCode = 1;
});
