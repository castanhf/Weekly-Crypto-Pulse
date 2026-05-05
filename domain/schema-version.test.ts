import { describe, expect, it } from 'vitest';

import { DAILY_SCHEMA_V1_0, WEEKLY_SCHEMA_V1_0, WEEKLY_SCHEMA_V1_1, isValidSchemaVersion } from '@/domain/schema-version';

describe('isValidSchemaVersion', () => {
  it('accepts all current schema versions', () => {
    expect(isValidSchemaVersion(WEEKLY_SCHEMA_V1_0)).toBe(true);
    expect(isValidSchemaVersion(WEEKLY_SCHEMA_V1_1)).toBe(true);
    expect(isValidSchemaVersion(DAILY_SCHEMA_V1_0)).toBe(true);
  });

  it('rejects the legacy "1.0" string (not a canonical SchemaVersion)', () => {
    expect(isValidSchemaVersion('1.0')).toBe(false);
  });

  it('rejects unknown version strings', () => {
    expect(isValidSchemaVersion('weekly@2.0')).toBe(false);
    expect(isValidSchemaVersion('daily@2.0')).toBe(false);
    expect(isValidSchemaVersion('2.0')).toBe(false);
    expect(isValidSchemaVersion('')).toBe(false);
  });

  it('rejects non-string inputs', () => {
    expect(isValidSchemaVersion(undefined)).toBe(false);
    expect(isValidSchemaVersion(null)).toBe(false);
    expect(isValidSchemaVersion(1)).toBe(false);
    expect(isValidSchemaVersion({})).toBe(false);
  });
});
