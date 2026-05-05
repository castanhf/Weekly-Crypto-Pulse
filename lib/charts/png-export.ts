import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

import sharp from 'sharp';

import { renderRegimeHistorySvg, renderSnapshotTrendSvg } from './svg-rendering';
import type { RegimeHistoryChartOptions, SnapshotTrendChartOptions } from './svg-rendering';

export const exportSvgToPng = async (svgString: string, outputPath: string): Promise<void> => {
  const resolved = path.resolve(outputPath);
  await mkdir(path.dirname(resolved), { recursive: true });
  const pngBuffer = await sharp(Buffer.from(svgString, 'utf-8')).png().toBuffer();
  await writeFile(resolved, pngBuffer);
};

export const exportSnapshotTrendPng = async (
  options: SnapshotTrendChartOptions,
  outputPath: string
): Promise<void> => exportSvgToPng(renderSnapshotTrendSvg(options), outputPath);

export const exportRegimeHistoryPng = async (
  options: RegimeHistoryChartOptions,
  outputPath: string
): Promise<void> => exportSvgToPng(renderRegimeHistorySvg(options), outputPath);
