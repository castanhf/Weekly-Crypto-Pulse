/**
 * Pure update-type classification logic for Dependabot PRs.
 * Exported so the triage runner and vitest tests share the same implementation.
 */

/** @typedef {'patch'|'minor'|'major'|'unknown'} UpdateType */

/**
 * Classify a Dependabot PR by its title and optional body.
 *
 * Handles three title formats:
 *  - Single semver bump: "Bump foo from 1.2.3 to 1.2.4"
 *  - Single major-only bump (Actions): "Bump actions/checkout from 3 to 4"
 *  - Grouped update: "build(deps): bump the patch-and-minor group across 1 directory with N updates"
 *
 * @param {string} title
 * @param {string} [body]
 * @returns {UpdateType}
 */
export function classifyUpdate(title, body = '') {
  // Single-package semver: "... from 1.2.3 to 1.2.4"
  const semverMatch = title.match(/from (\d+)\.(\d+)\.\d+ to (\d+)\.(\d+)\.\d+/);
  if (semverMatch) {
    const [, fromMajor, fromMinor, toMajor, toMinor] = semverMatch;
    if (toMajor !== fromMajor) return 'major';
    if (toMinor !== fromMinor) return 'minor';
    return 'patch';
  }

  // Single-package major-only (GitHub Actions): "... from 3 to 4"
  const majorOnlyMatch = title.match(/from (\d+) to (\d+)/);
  if (majorOnlyMatch) {
    return majorOnlyMatch[1] !== majorOnlyMatch[2] ? 'major' : 'patch';
  }

  // Grouped: "build(deps): bump the <group-name> group ..."
  const groupedMatch = title.match(/bump the (\S+) group/i);
  if (groupedMatch) {
    return classifyGroupedBody(groupedMatch[1], body);
  }

  return 'unknown';
}

/**
 * Determine the highest bump type from a grouped PR body.
 * Falls back to the group name when the body contains no parseable version lines.
 *
 * @param {string} groupName
 * @param {string} body
 * @returns {UpdateType}
 */
function classifyGroupedBody(groupName, body) {
  // Each constituent package appears as: "from X.Y.Z to A.B.C"
  const semverBumps = [...body.matchAll(/from (\d+)\.(\d+)\.\d+ to (\d+)\.(\d+)\.\d+/g)];
  // Actions packages appear as: "from N to M" (whole-number only)
  const majorOnlyBumps = [...body.matchAll(/\bfrom (\d+) to (\d+)\b/g)];

  if (semverBumps.length > 0 || majorOnlyBumps.length > 0) {
    let highest = /** @type {UpdateType} */ ('patch');
    for (const m of semverBumps) {
      if (m[1] !== m[3]) return 'major';
      if (m[2] !== m[4]) highest = 'minor';
    }
    for (const m of majorOnlyBumps) {
      if (m[1] !== m[2]) return 'major';
    }
    return highest;
  }

  // No version lines found — derive from group name (e.g. "patch-and-minor" → minor)
  const name = groupName.toLowerCase();
  if (name.includes('major')) return 'major';
  if (name.includes('minor')) return 'minor';
  if (name.includes('patch')) return 'patch';
  return 'unknown';
}
