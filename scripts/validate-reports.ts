import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

import { CURRENT_REPORT_SCHEMA_VERSION, type Regime } from '../domain/report';
import {
  assertArray,
  assertNumber,
  assertRecord,
  assertString,
  assertStringArray
} from '../lib/reports/json-assertions';

const REPORTS_DIRECTORY = path.resolve(process.cwd(), 'data/reports');
const VALID_REGIMES: ReadonlySet<Regime> = new Set(['risk-on', 'risk-off', 'range-bound', 'transition']);

const validateRegime = (value: unknown): void => {
  const regime = assertString(value, 'report.regime') as Regime;

  if (!VALID_REGIMES.has(regime)) {
    throw new Error(`Invalid report data at "report.regime": unsupported regime "${regime}".`);
  }
};

const validateReport = (value: unknown): void => {
  const report = assertRecord(value, 'report');
  const metadata = assertRecord(report.metadata, 'report.metadata');
  const marketSnapshot = assertRecord(report.marketSnapshot, 'report.marketSnapshot');

  assertString(metadata.title, 'report.metadata.title');
  assertString(metadata.slug, 'report.metadata.slug');
  assertString(metadata.publishedAt, 'report.metadata.publishedAt');
  assertString(metadata.weekLabel, 'report.metadata.weekLabel');
  assertString(metadata.summary, 'report.metadata.summary');
  assertStringArray(metadata.tags, 'report.metadata.tags');

  validateRegime(report.regime);

  assertNumber(marketSnapshot.totalMarketCapUsd, 'report.marketSnapshot.totalMarketCapUsd');
  assertNumber(marketSnapshot.btcDominancePct, 'report.marketSnapshot.btcDominancePct');
  assertNumber(marketSnapshot.ethDominancePct, 'report.marketSnapshot.ethDominancePct');
  assertNumber(marketSnapshot.fearGreedIndex, 'report.marketSnapshot.fearGreedIndex');

  assertArray(report.movers, 'report.movers');
  assertArray(report.sections, 'report.sections');
};

const validateArtifact = (rawArtifact: string, fileName: string): void => {
  const artifact = assertRecord(JSON.parse(rawArtifact) as unknown, fileName);

  const schemaVersion = assertString(artifact.schemaVersion, `${fileName}.schemaVersion`);

  if (schemaVersion !== CURRENT_REPORT_SCHEMA_VERSION) {
    throw new Error(
      `Invalid report data at "${fileName}.schemaVersion": expected "${CURRENT_REPORT_SCHEMA_VERSION}" and received "${schemaVersion}".`
    );
  }

  validateReport(artifact.report);
};

const validateFile = async (fileName: string): Promise<void> => {
  const reportPath = path.join(REPORTS_DIRECTORY, fileName);
  const rawArtifact = await readFile(reportPath, 'utf-8');

  validateArtifact(rawArtifact, fileName);
};

const main = async (): Promise<void> => {
  const entries = await readdir(REPORTS_DIRECTORY, { withFileTypes: true });
  const artifactFiles = entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.json'))
    .map((entry) => entry.name)
    .sort((left, right) => left.localeCompare(right));

  if (artifactFiles.length === 0) {
    throw new Error('No report artifacts found in data/reports.');
  }

  for (const artifactFile of artifactFiles) {
    await validateFile(artifactFile);
  }

  console.log(`Validated ${artifactFiles.length} report artifact(s).`);
};

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : 'Unknown validation error.';
  console.error(`Failed to validate report artifacts: ${message}`);
  process.exitCode = 1;
});
