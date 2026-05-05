import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const configPath = path.join(process.cwd(), 'next.config.mjs');
const configContent = readFileSync(configPath, 'utf-8');

describe('next.config.mjs security headers', () => {
  it('defines Content-Security-Policy', () => {
    expect(configContent).toContain('Content-Security-Policy');
  });

  it('defines Strict-Transport-Security', () => {
    expect(configContent).toContain('Strict-Transport-Security');
  });

  it('defines X-Frame-Options', () => {
    expect(configContent).toContain('X-Frame-Options');
  });

  it('defines X-Content-Type-Options', () => {
    expect(configContent).toContain('X-Content-Type-Options');
  });

  it('defines Referrer-Policy', () => {
    expect(configContent).toContain('Referrer-Policy');
  });

  it('defines Permissions-Policy', () => {
    expect(configContent).toContain('Permissions-Policy');
  });

  it('CSP includes frame-ancestors none to block clickjacking', () => {
    expect(configContent).toContain("frame-ancestors 'none'");
  });

  it('CSP includes base-uri self to block base tag injection', () => {
    expect(configContent).toContain("base-uri 'self'");
  });
});
