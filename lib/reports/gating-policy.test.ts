import { describe, expect, it } from 'vitest';

import { loadAllArtifacts } from './artifact-repository';

// ---------------------------------------------------------------------------
// Build-time guard: no artifact may contain content-gating markers.
//
// Per decision WCP-134 (locked): free reports are fully readable. No content
// is hidden, blurred, or gated. This test prevents future writers/pipelines
// from accidentally introducing gating language into artifact JSON.
// ---------------------------------------------------------------------------

describe('content gating policy', () => {
  it('no artifact JSON contains gating markers', () => {
    const artifacts = loadAllArtifacts();
    expect(artifacts.length).toBeGreaterThan(0);

    for (const artifact of artifacts) {
      const serialized = JSON.stringify(artifact);
      expect(serialized, `Artifact ${artifact.slug} contains a gating marker`).not.toMatch(
        /gated|paywall|locked content|preview only/i
      );
    }
  });
});
