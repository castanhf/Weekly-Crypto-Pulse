#!/usr/bin/env node
/**
 * Dependabot PR triage.
 *
 * Reads PR_NUMBER from env, classifies the update as patch / minor / major,
 * applies a label, auto-approves patch and minor updates, enables auto-merge
 * for patches, and posts an AI risk-research summary (requires ANTHROPIC_API_KEY).
 *
 * Requires: GITHUB_TOKEN (provided automatically in Actions), gh CLI.
 */

import { execSync } from 'node:child_process';
import { classifyUpdate } from './dependabot-classify.mjs';

const PR_NUMBER = process.env.PR_NUMBER;
if (!PR_NUMBER) {
  console.error('[triage] PR_NUMBER env var is required');
  process.exit(1);
}

/** @param {string} cmd */
const run = (cmd) => execSync(cmd, { encoding: 'utf8' }).trim();

/** @param {string} cmd @returns {unknown} */
const runJson = (cmd) => JSON.parse(run(cmd));

/**
 * Build a human-readable description of what packages are being updated.
 * Used as context for the AI risk-research prompt.
 *
 * @param {string} title
 * @param {string} body
 * @returns {string}
 */
function buildPackageContext(title, body) {
  // For grouped PRs, extract individual package lines from body
  const lines = [...body.matchAll(/Updates?\s+`([^`]+)`\s+from\s+(\S+)\s+to\s+(\S+)/g)]
    .map((m) => `- ${m[1]}: ${m[2]} → ${m[3]}`);

  if (lines.length > 0) {
    return lines.join('\n');
  }

  // Fall back to title for single-package PRs
  return title;
}

/**
 * Call the Anthropic Messages API to assess the risk of a dependency update.
 * Returns a concise 2-sentence assessment, or null on any failure (fail-open
 * for research — approve/hold decisions are not gated on this call).
 *
 * Uses web_search_20250305 so Claude can check recent CVEs and release notes.
 * Falls back to training knowledge if the beta is unavailable.
 *
 * @param {string} packageContext
 * @param {string} updateType
 * @returns {Promise<string|null>}
 */
async function researchRisk(packageContext, updateType) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.log('[triage] ANTHROPIC_API_KEY not set — skipping risk research.');
    return null;
  }

  const prompt = [
    'You are a dependency risk analyst for a Next.js crypto news website (no user auth, no database, Stripe payments, Vercel deployment).',
    '',
    `Update type: **${updateType}**`,
    'Packages being updated:',
    packageContext,
    '',
    'Provide a risk assessment in exactly two sentences:',
    '1. **Technical:** what changed (breaking changes, new APIs, security fixes, deprecations)',
    '2. **Plain-English:** what this means for the operator (safe to merge, needs smoke testing, watch out for X)',
    '',
    'Be specific. Do not pad with generic statements. If nothing notable changed, say so briefly.',
  ].join('\n');

  for (const useBeta of [true, false]) {
    try {
      /** @type {Record<string, string>} */
      const headers = {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      };
      if (useBeta) headers['anthropic-beta'] = 'web-search-2025-03-05';

      /** @type {Record<string, unknown>} */
      const requestBody = {
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 512,
        messages: [{ role: 'user', content: prompt }],
      };
      if (useBeta) {
        requestBody.tools = [{ type: 'web_search_20250305', name: 'web_search' }];
      }

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        if (useBeta && (response.status === 400 || response.status === 422)) {
          // Beta not available — retry without web_search
          console.log('[triage] web_search beta unavailable, retrying without it.');
          continue;
        }
        console.warn(`[triage] Risk research API returned ${response.status}: ${errorText.slice(0, 200)}`);
        return null;
      }

      /** @type {{ content: Array<{type: string; text?: string}> }} */
      const data = await response.json();
      const text = data.content?.find((b) => b.type === 'text')?.text?.trim();
      return text ?? null;
    } catch (err) {
      console.warn(`[triage] Risk research request failed: ${err instanceof Error ? err.message : String(err)}`);
      return null;
    }
  }

  return null;
}

async function main() {
  const pr = /** @type {{ title: string; headRefName: string; body: string; comments: Array<{body: string}> }} */ (
    runJson(`gh pr view ${PR_NUMBER} --json title,headRefName,body,comments`)
  );
  const { title, body: prBody, comments } = pr;
  console.log(`[triage] PR #${PR_NUMBER}: "${title}"`);

  const updateType = classifyUpdate(title, prBody);
  console.log(`[triage] Detected update type: ${updateType}`);

  // Ensure labels exist, then apply the relevant one.
  const LABEL_CONFIGS = {
    patch: { name: 'dependabot-patch', color: '0e8a16', description: 'Patch-level dependency bump' },
    minor: { name: 'dependabot-minor', color: 'fbca04', description: 'Minor-level dependency bump' },
    major: { name: 'dependabot-major', color: 'b60205', description: 'Major-level dependency bump — manual review required' },
    unknown: { name: 'dependabot-review-needed', color: 'e4e669', description: 'Dependabot update type could not be determined' },
  };

  const { name: labelName, color, description } = LABEL_CONFIGS[updateType];
  try {
    run(`gh label create "${labelName}" --color "${color}" --description "${description}" 2>/dev/null || true`);
  } catch {
    // label already exists — safe to ignore
  }
  try {
    run(`gh pr edit ${PR_NUMBER} --add-label "${labelName}"`);
    console.log(`[triage] Applied label: ${labelName}`);
  } catch (err) {
    console.warn(`[triage] Could not apply label: ${err instanceof Error ? err.message : String(err)}`);
  }

  // Guard against duplicate comments when a PR is closed and reopened.
  const alreadyCommented = comments?.some(
    (c) => typeof c.body === 'string' && c.body.includes('**Dependabot triage:**')
  );

  // Fetch risk research — non-blocking, fail-open (approve/hold decisions are unaffected).
  const packageContext = buildPackageContext(title, prBody);
  console.log('[triage] Fetching risk research...');
  const riskSummary = await researchRisk(packageContext, updateType);
  if (riskSummary) {
    console.log('[triage] Risk research obtained.');
  }

  const riskSection = riskSummary
    ? `\n\n---\n**Risk research (AI):** ${riskSummary}`
    : '\n\n---\n*Risk research unavailable — ANTHROPIC_API_KEY not configured or API unreachable.*';

  // Auto-approve patch and minor; hold major / unknown for manual review.
  if (updateType === 'patch' || updateType === 'minor') {
    run(`gh pr review ${PR_NUMBER} --approve --body "Auto-approved by dependabot-triage: **${updateType}** update. Safe to merge.${riskSection}"`);
    console.log(`[triage] Approved (${updateType}).`);

    if (updateType === 'patch') {
      try {
        run(`gh pr merge ${PR_NUMBER} --auto --merge`);
        console.log('[triage] Auto-merge enabled.');
      } catch (err) {
        // Auto-merge may be unavailable if branch protection is not configured.
        console.warn(`[triage] Could not enable auto-merge (branch protection may not require it): ${err instanceof Error ? err.message : String(err)}`);
      }
    }
  } else {
    if (alreadyCommented) {
      console.log('[triage] Triage comment already exists — skipping duplicate.');
    } else {
      const article = updateType === 'unknown' ? 'an' : 'a';
      const emoji = updateType === 'major' ? '🔴' : '⚠️';
      run(`gh pr comment ${PR_NUMBER} --body "${emoji} **Dependabot triage:** This is ${article} **${updateType}** update. Manual review is required before merging.${riskSection}"`);
      console.log(`[triage] Manual-review comment posted (${updateType}).`);
    }
  }

  console.log('[triage] Done.');
}

main().catch((err) => {
  console.error('[triage] Fatal:', err);
  process.exit(1);
});
