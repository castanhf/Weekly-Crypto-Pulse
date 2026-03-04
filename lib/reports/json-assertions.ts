export type JsonRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is JsonRecord =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export const assertRecord = (value: unknown, fieldPath: string): JsonRecord => {
  if (!isRecord(value)) {
    throw new Error(`Invalid report data at "${fieldPath}": expected object.`);
  }

  return value;
};

export const assertString = (value: unknown, fieldPath: string): string => {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`Invalid report data at "${fieldPath}": expected non-empty string.`);
  }

  return value;
};

export const assertNumber = (value: unknown, fieldPath: string): number => {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    throw new Error(`Invalid report data at "${fieldPath}": expected number.`);
  }

  return value;
};

export const assertStringArray = (value: unknown, fieldPath: string): ReadonlyArray<string> => {
  if (!Array.isArray(value)) {
    throw new Error(`Invalid report data at "${fieldPath}": expected string array.`);
  }

  return value.map((entry, index) => assertString(entry, `${fieldPath}[${index}]`));
};

export const assertArray = (value: unknown, fieldPath: string): ReadonlyArray<unknown> => {
  if (!Array.isArray(value)) {
    throw new Error(`Invalid report data at "${fieldPath}": expected array.`);
  }

  return value;
};
