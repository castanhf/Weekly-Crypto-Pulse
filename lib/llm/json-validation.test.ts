import { describe, expect, it } from 'vitest';

import { LlmError } from '@/lib/llm/types';
import { parseAndValidateLlmJson } from './json-validation';

const identity = (x: unknown) => x as { value: number };

describe('parseAndValidateLlmJson', () => {
  it('parses plain JSON and passes it to the validator', () => {
    const result = parseAndValidateLlmJson('{"value": 42}', identity);
    expect(result).toEqual({ value: 42 });
  });

  it('strips leading ```json fence before parsing', () => {
    const result = parseAndValidateLlmJson('```json\n{"value": 1}\n```', identity);
    expect(result).toEqual({ value: 1 });
  });

  it('strips leading ``` fence (no language tag) before parsing', () => {
    const result = parseAndValidateLlmJson('```\n{"value": 2}\n```', identity);
    expect(result).toEqual({ value: 2 });
  });

  it('handles fences without trailing newline', () => {
    const result = parseAndValidateLlmJson('```json{"value": 3}```', identity);
    expect(result).toEqual({ value: 3 });
  });

  it('trims surrounding whitespace', () => {
    const result = parseAndValidateLlmJson('  {"value": 4}  ', identity);
    expect(result).toEqual({ value: 4 });
  });

  it('throws schema-validation LlmError on invalid JSON', () => {
    expect(() => parseAndValidateLlmJson('not json', identity)).toThrow(LlmError);
    expect(() => parseAndValidateLlmJson('not json', identity)).toThrow(
      expect.objectContaining({ kind: 'schema-validation', retryable: true })
    );
  });

  it('throws schema-validation LlmError when validator throws', () => {
    const strictValidator = (x: unknown) => {
      if (typeof (x as Record<string, unknown>)['value'] !== 'number') {
        throw new Error('value must be a number');
      }
      return x as { value: number };
    };

    expect(() => parseAndValidateLlmJson('{"value": "wrong"}', strictValidator)).toThrow(LlmError);
    expect(() =>
      parseAndValidateLlmJson('{"value": "wrong"}', strictValidator)
    ).toThrow(expect.objectContaining({ kind: 'schema-validation', retryable: true }));
  });

  it('propagates validated result from the validator', () => {
    const typedValidator = (x: unknown): { name: string } => {
      const record = x as Record<string, unknown>;
      if (typeof record['name'] !== 'string') throw new Error('name required');
      return { name: record['name'] as string };
    };

    const result = parseAndValidateLlmJson('{"name": "Alice", "extra": true}', typedValidator);
    expect(result).toEqual({ name: 'Alice' });
  });

  it('throws LlmError as an instance of LlmError', () => {
    const err = (() => {
      try {
        parseAndValidateLlmJson('{bad}', identity);
      } catch (e) {
        return e;
      }
    })();
    expect(err).toBeInstanceOf(LlmError);
  });
});
