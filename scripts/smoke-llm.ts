/**
 * smoke-llm.ts
 *
 * Validates the primary LLM provider is reachable and accepting requests.
 * Makes a single minimal API call (no retries, no fallback) and reports
 * the result. Exits non-zero on failure.
 *
 * Run: npm run smoke:llm
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

import { callLlm } from '../lib/llm/client';
import type { LlmRequest } from '../lib/llm/types';

type CheckResult = { label: string; ok: boolean; detail?: string };

const check = (label: string, ok: boolean, detail?: string): CheckResult => ({ label, ok, detail });

const runSmoke = async (): Promise<void> => {
  const results: CheckResult[] = [];

  // 1. Credentials present
  const githubToken = process.env['GITHUB_TOKEN'] ?? '';
  if (!githubToken) {
    console.log('\nLLM Smoke Test');
    console.log('==============');
    console.log('✗ GITHUB_TOKEN must be set (required for the github-models primary provider).');
    process.exitCode = 1;
    return;
  }

  results.push(check('GITHUB_TOKEN present', true));

  // 2. Make a minimal LLM call — single attempt, no fallback
  const request: LlmRequest = {
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: 'Reply with the single word PONG.' }],
    maxTokens: 10,
    temperature: 0
  };

  try {
    const response = await callLlm(request, {
      primary: 'github-models',
      secondary: null,
      retries: 0
    });

    const content = response.content.trim();
    results.push(
      check(
        `github-models responded (${response.usage.inputTokens}in / ${response.usage.outputTokens}out tokens): "${content}"`,
        true
      )
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    results.push(check('github-models responded', false, message));
  }

  // Print results
  console.log('\nLLM Smoke Test');
  console.log('==============');
  let allPassed = true;
  for (const r of results) {
    const icon = r.ok ? '✓' : '✗';
    console.log(`${icon} ${r.label}`);
    if (!r.ok && r.detail) console.log(`  ${r.detail}`);
    if (!r.ok) allPassed = false;
  }
  console.log('');

  if (!allPassed) {
    process.exitCode = 1;
  }
};

runSmoke().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  console.error(`\n[smoke-llm] FATAL: ${message}`);
  process.exitCode = 1;
});
