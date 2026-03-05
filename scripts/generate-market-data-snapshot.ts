import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { CoinGeckoMarketDataProvider } from '@/lib/market-data/coingecko-market-data-provider';
import { BatchMarketDataIngestion } from '@/lib/market-data/market-data-ingestion';

const OUTPUT_DIRECTORY = join(process.cwd(), 'data', 'market-data');

const createOutputPath = (capturedAt: string): string => {
  const safeTimestamp = capturedAt.replace(/[:.]/g, '-');
  return join(OUTPUT_DIRECTORY, `${safeTimestamp}.json`);
};

const run = async (): Promise<void> => {
  const ingestion = new BatchMarketDataIngestion(new CoinGeckoMarketDataProvider());
  const snapshot = await ingestion.ingest();

  mkdirSync(OUTPUT_DIRECTORY, { recursive: true });

  const outputPath = createOutputPath(snapshot.capturedAt);
  writeFileSync(outputPath, `${JSON.stringify(snapshot, null, 2)}\n`, 'utf-8');

  console.log(`Market data snapshot written to ${outputPath}`);
};

run().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : 'Unknown error';
  console.error(`Failed to generate market data snapshot: ${message}`);
  process.exitCode = 1;
});
