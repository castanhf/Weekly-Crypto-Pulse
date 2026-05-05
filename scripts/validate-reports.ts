import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

import { validateArtifact } from '../lib/reports/artifact-validator';

const REPORTS_DIRECTORY = path.resolve(process.cwd(), 'data/reports');

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
