import { stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import sharp from 'sharp';
import { afterAll, describe, expect, it } from 'vitest';

import { exportRegimeHistoryPng, exportSnapshotTrendPng, exportSvgToPng } from './png-export';
import type { RegimeHistoryPoint, SnapshotTrendPoint } from './window';

const TMP_DIR = path.join(tmpdir(), `wcp-chart-tests-${process.pid}`);

const MINIMAL_SVG = '<svg width="200" height="100" viewBox="0 0 200 100" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="100" fill="#F5F7FA"/></svg>';

const SNAPSHOT_DATA: SnapshotTrendPoint[] = Array.from({ length: 4 }, (_, i) => ({
  publishedAt: `2026-0${i + 1}-06`,
  weekLabel: `Jan ${i + 6}`,
  totalMarketCapUsd: 2_000_000_000_000 + i * 100_000_000_000,
  btcDominancePct: 52 + i,
  ethDominancePct: 16 + i * 0.5,
  fearGreedIndex: 50 + i * 5
}));

const REGIME_DATA: RegimeHistoryPoint[] = [
  { publishedAt: '2026-01-06', weekLabel: 'Jan 6', regime: 'risk-on' },
  { publishedAt: '2026-01-13', weekLabel: 'Jan 13', regime: 'range-bound' },
  { publishedAt: '2026-01-20', weekLabel: 'Jan 20', regime: 'risk-off' },
  { publishedAt: '2026-01-27', weekLabel: 'Jan 27', regime: 'transition' }
];

afterAll(async () => {
  const { rm } = await import('node:fs/promises');
  await rm(TMP_DIR, { recursive: true, force: true });
});

describe('exportSvgToPng', () => {
  it('writes a PNG file to the specified path', async () => {
    const outputPath = path.join(TMP_DIR, 'minimal.png');
    await exportSvgToPng(MINIMAL_SVG, outputPath);
    const stats = await stat(outputPath);
    expect(stats.isFile()).toBe(true);
  });

  it('creates parent directories if they do not exist', async () => {
    const outputPath = path.join(TMP_DIR, 'nested', 'deep', 'chart.png');
    await exportSvgToPng(MINIMAL_SVG, outputPath);
    const stats = await stat(outputPath);
    expect(stats.isFile()).toBe(true);
  });

  it('writes a valid PNG (magic bytes: 89 50 4E 47)', async () => {
    const outputPath = path.join(TMP_DIR, 'magic.png');
    await exportSvgToPng(MINIMAL_SVG, outputPath);
    const { readFile } = await import('node:fs/promises');
    const buf = await readFile(outputPath);
    expect(buf[0]).toBe(0x89);
    expect(buf[1]).toBe(0x50); // 'P'
    expect(buf[2]).toBe(0x4e); // 'N'
    expect(buf[3]).toBe(0x47); // 'G'
  });

  it('produced PNG dimensions match the SVG viewBox', async () => {
    const outputPath = path.join(TMP_DIR, 'dimensions.png');
    await exportSvgToPng(MINIMAL_SVG, outputPath);
    const meta = await sharp(outputPath).metadata();
    expect(meta.width).toBe(200);
    expect(meta.height).toBe(100);
  });
});

describe('exportSnapshotTrendPng', () => {
  it('produces a non-empty PNG file (size > 1KB)', async () => {
    const outputPath = path.join(TMP_DIR, 'snapshot.png');
    await exportSnapshotTrendPng({ data: SNAPSHOT_DATA }, outputPath);
    const stats = await stat(outputPath);
    expect(stats.size).toBeGreaterThan(1024);
  });

  it('produced PNG matches requested width and height', async () => {
    const outputPath = path.join(TMP_DIR, 'snapshot-custom.png');
    await exportSnapshotTrendPng({ data: SNAPSHOT_DATA, width: 800, height: 400 }, outputPath);
    const meta = await sharp(outputPath).metadata();
    expect(meta.width).toBe(800);
    expect(meta.height).toBe(400);
  });

  it('works with empty data (no-data chart is still a valid PNG)', async () => {
    const outputPath = path.join(TMP_DIR, 'snapshot-empty.png');
    await exportSnapshotTrendPng({ data: [] }, outputPath);
    const stats = await stat(outputPath);
    expect(stats.isFile()).toBe(true);
  });
});

describe('exportRegimeHistoryPng', () => {
  it('produces a non-empty PNG file (size > 1KB)', async () => {
    const outputPath = path.join(TMP_DIR, 'regime.png');
    await exportRegimeHistoryPng({ data: REGIME_DATA }, outputPath);
    const stats = await stat(outputPath);
    expect(stats.size).toBeGreaterThan(1024);
  });

  it('produced PNG matches requested width and height', async () => {
    const outputPath = path.join(TMP_DIR, 'regime-custom.png');
    await exportRegimeHistoryPng({ data: REGIME_DATA, width: 800, height: 200 }, outputPath);
    const meta = await sharp(outputPath).metadata();
    expect(meta.width).toBe(800);
    expect(meta.height).toBe(200);
  });
});
