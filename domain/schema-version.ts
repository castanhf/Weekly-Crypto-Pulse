/**
 * Artifact schema versioning policy.
 *
 * Format: `{artifact-type}@{major}.{minor}`
 *
 * - Additive changes (new optional fields): minor-bump.
 * - Breaking changes (removed or renamed fields): major-bump.
 * - The validator dispatches per schemaVersion — existing artifacts remain
 *   valid against their original version forever, no forced migrations.
 */
export type SchemaVersion = 'weekly@1.0' | 'weekly@1.1' | 'weekly@1.2' | 'weekly@1.3' | 'daily@1.0' | 'daily@1.1' | 'daily@1.2';

export const WEEKLY_SCHEMA_V1_0 = 'weekly@1.0' as const;
export const WEEKLY_SCHEMA_V1_1 = 'weekly@1.1' as const;
/** weekly@1.2: additive capitalFlows field (DeFiLlama TVL data). Introduced in WCP-123. */
export const WEEKLY_SCHEMA_V1_2 = 'weekly@1.2' as const;
/** weekly@1.3: additive sectionLabels field (adaptive winners/losers labels). Introduced in WCP-153. */
export const WEEKLY_SCHEMA_V1_3 = 'weekly@1.3' as const;
export const DAILY_SCHEMA_V1_0 = 'daily@1.0' as const;
/** daily@1.1: additive weeklyFooter field replacing the worthKnowing[3] hack. Introduced in WCP-132. */
export const DAILY_SCHEMA_V1_1 = 'daily@1.1' as const;
/** daily@1.2: top-N winners/losers rule (N=1); MoverEntry gains priceUsd + priceChange24hUsd;
 *  whatMoved gains sectionLabels. Replaces >5% threshold from WCP-137. Introduced in WCP-153. */
export const DAILY_SCHEMA_V1_2 = 'daily@1.2' as const;

const VALID_SCHEMA_VERSIONS: ReadonlySet<string> = new Set([
  WEEKLY_SCHEMA_V1_0,
  WEEKLY_SCHEMA_V1_1,
  WEEKLY_SCHEMA_V1_2,
  WEEKLY_SCHEMA_V1_3,
  DAILY_SCHEMA_V1_0,
  DAILY_SCHEMA_V1_1,
  DAILY_SCHEMA_V1_2
]);

export const isValidSchemaVersion = (value: unknown): value is SchemaVersion =>
  typeof value === 'string' && VALID_SCHEMA_VERSIONS.has(value);
