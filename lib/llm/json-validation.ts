import { LlmError } from './types';

const stripMarkdownFences = (raw: string): string =>
  raw
    .trim()
    .replace(/^```(?:json)?\n?/, '')
    .replace(/\n?```$/, '')
    .trim();

export const parseAndValidateLlmJson = <T>(
  rawContent: string,
  validator: (parsed: unknown) => T
): T => {
  const stripped = stripMarkdownFences(rawContent);

  let parsed: unknown;
  try {
    parsed = JSON.parse(stripped);
  } catch (err) {
    const underlying = err instanceof Error ? err : new Error(String(err));
    throw new LlmError({
      kind: 'schema-validation',
      provider: 'github-models',
      retryable: true,
      underlying,
      message: `LLM returned invalid JSON: ${underlying.message}`
    });
  }

  try {
    return validator(parsed);
  } catch (err) {
    const underlying = err instanceof Error ? err : new Error(String(err));
    throw new LlmError({
      kind: 'schema-validation',
      provider: 'github-models',
      retryable: true,
      underlying,
      message: `LLM JSON failed validation: ${underlying.message}`
    });
  }
};
