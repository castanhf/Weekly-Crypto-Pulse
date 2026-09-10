#!/usr/bin/env node
/**
 * Dependabot PR triage.
 *
 * Reads PR_NUMBER from env, classifies the update as patch / minor / major,
 * applies a label, auto-approves patch and minor updates, and enables
 * auto-merge for patches.
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

// Auto-approve patch and minor; hold major / unknown for manual review.
if (updateType === 'patch' || updateType === 'minor') {
  run(`gh pr review ${PR_NUMBER} --approve --body "Auto-approved by dependabot-triage: **${updateType}** update. Safe to merge."`);
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
    run(`gh pr comment ${PR_NUMBER} --body "${emoji} **Dependabot triage:** This is ${article} **${updateType}** update. Manual review is required before merging."`);
    console.log(`[triage] Manual-review comment posted (${updateType}).`);
  }
}

console.log('[triage] Done.');
