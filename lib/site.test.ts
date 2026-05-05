import { describe, expect, it } from 'vitest';

import { DAILY_TITLE_PREFIX, SITE_NAME, WEEKLY_TITLE_PREFIX } from '@/lib/site';

describe('site constants', () => {
  it('SITE_NAME is the master brand', () => {
    expect(SITE_NAME).toBe('Crypto Pulse');
  });

  it('WEEKLY_TITLE_PREFIX preserves cadence prefix for per-artifact metadata', () => {
    expect(WEEKLY_TITLE_PREFIX).toBe('Weekly Crypto Pulse');
  });

  it('DAILY_TITLE_PREFIX preserves cadence prefix for per-artifact metadata', () => {
    expect(DAILY_TITLE_PREFIX).toBe('Daily Crypto Pulse');
  });
});
