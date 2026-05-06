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
export type SchemaVersion = 'weekly@1.0' | 'weekly@1.1' | 'daily@1.0';

export const WEEKLY_SCHEMA_V1_0 = 'weekly@1.0' as const;
export const WEEKLY_SCHEMA_V1_1 = 'weekly@1.1' as const;
export const DAILY_SCHEMA_V1_0 = 'daily@1.0' as const;

const VALID_SCHEMA_VERSIONS: ReadonlySet<string> = new Set([
  WEEKLY_SCHEMA_V1_0,
  WEEKLY_SCHEMA_V1_1,
  DAILY_SCHEMA_V1_0
]);

export const isValidSchemaVersion = (value: unknown): value is SchemaVersion =>
  typeof value === 'string' && VALID_SCHEMA_VERSIONS.has(value);
