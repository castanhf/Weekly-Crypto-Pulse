import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

import { validateArtifact } from '../lib/reports/artifact-validator';

const DAILIES_DIR = path.resolve(process.cwd(), 'data/dailies');

const validateFile = async (fileName: string): Promise<void> => {
  const artifactPath = path.join(DAILIES_DIR, fileName);
  const rawArtifact = await readFile(artifactPath, 'utf-8');
  validateArtifact(rawArtifact, fileName);
};

const main = async (): Promise<void> => {
  const entries = await readdir(DAILIES_DIR, { withFileTypes: true });
  const artifactFiles = entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.json') && !entry.name.startsWith('.'))
    .map((entry) => entry.name)
    .sort((left, right) => left.localeCompare(right));

  if (artifactFiles.length === 0) {
    console.log('No daily artifact files found in data/dailies/. Skipping validation.');
    return;
  }

  for (const artifactFile of artifactFiles) {
    await validateFile(artifactFile);
  }

  console.log(`Validated ${artifactFiles.length} daily artifact(s).`);
};

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : 'Unknown validation error.';
  console.error(`Failed to validate daily artifacts: ${message}`);
  process.exitCode = 1;
});
