import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createEmailSender } from '@/lib/email/email-sender-factory';
import { BeehiivEmailSender } from '@/lib/email/beehiiv-email-sender';
import { NoOpEmailSender } from '@/lib/email/no-op-email-sender';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock('@/lib/email/beehiiv', () => ({
  sendBroadcast: vi.fn().mockResolvedValue({ broadcastId: 'bc-test' })
}));

vi.mock('@/lib/email/compose-daily-digest', () => ({
  composeDailyDigest: vi.fn().mockReturnValue({
    subject: 'Daily Test',
    htmlBody: '<p>daily</p>',
    plaintextBody: 'daily'
  })
}));

vi.mock('@/lib/email/compose-weekly-email', () => ({
  composeWeeklyEmail: vi.fn().mockReturnValue({
    subject: 'Weekly Test',
    htmlBody: '<p>weekly</p>',
    plaintextBody: 'weekly'
  })
}));

vi.mock('@/lib/email/compose-sunday-digest', () => ({
  composeSundayDigest: vi.fn().mockReturnValue({
    subject: 'Sunday Test',
    htmlBody: '<p>sunday</p>',
    plaintextBody: 'sunday'
  })
}));

vi.mock('@/lib/reports/daily-repository', () => ({
  loadDailyBySlug: vi.fn().mockReturnValue({
    daily: {
      slug: 'test-slug',
      headline: 'Test headline',
      summary: 'Test summary',
      publishedAt: '2026-05-14',
      worthKnowing: []
    }
  })
}));

// ---------------------------------------------------------------------------
// createEmailSender factory
// ---------------------------------------------------------------------------

describe('createEmailSender', () => {
  afterEach(() => {
    delete process.env.BEEHIIV_BROADCAST_ENABLED;
  });

  it('returns NoOpEmailSender when BEEHIIV_BROADCAST_ENABLED is unset', () => {
    delete process.env.BEEHIIV_BROADCAST_ENABLED;
    expect(createEmailSender()).toBeInstanceOf(NoOpEmailSender);
  });

  it('returns NoOpEmailSender when BEEHIIV_BROADCAST_ENABLED=false', () => {
    process.env.BEEHIIV_BROADCAST_ENABLED = 'false';
    expect(createEmailSender()).toBeInstanceOf(NoOpEmailSender);
  });

  it('returns NoOpEmailSender for any value other than "true"', () => {
    for (const value of ['0', '', 'yes', 'enabled', 'TRUE']) {
      process.env.BEEHIIV_BROADCAST_ENABLED = value;
      expect(createEmailSender()).toBeInstanceOf(NoOpEmailSender);
    }
  });

  it('returns BeehiivEmailSender when BEEHIIV_BROADCAST_ENABLED=true', () => {
    process.env.BEEHIIV_BROADCAST_ENABLED = 'true';
    expect(createEmailSender()).toBeInstanceOf(BeehiivEmailSender);
  });
});

// ---------------------------------------------------------------------------
// NoOpEmailSender
// ---------------------------------------------------------------------------

describe('NoOpEmailSender', () => {
  let logSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);
  });

  afterEach(() => {
    logSpy.mockRestore();
  });

  it('sendDailyDigest logs the deferral message and resolves', async () => {
    const sender = new NoOpEmailSender();
    await expect(sender.sendDailyDigest('some-slug', '2026-05-14')).resolves.toBeUndefined();
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('BEEHIIV_BROADCAST_ENABLED=false'));
  });

  it('sendWeeklyEmail logs the deferral message and resolves', async () => {
    const sender = new NoOpEmailSender();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await expect(sender.sendWeeklyEmail({} as any)).resolves.toBeUndefined();
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('BEEHIIV_BROADCAST_ENABLED=false'));
  });

  it('sendSundayDigest logs the deferral message and resolves', async () => {
    const sender = new NoOpEmailSender();
    await expect(sender.sendSundayDigest([], 'framing text')).resolves.toBeUndefined();
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('BEEHIIV_BROADCAST_ENABLED=false'));
  });

  it('deferral message mentions the docs reference', async () => {
    const sender = new NoOpEmailSender();
    await sender.sendDailyDigest('slug', '2026-05-14');
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('email-distribution.md'));
  });

  it('deferral message mentions Enterprise tier reason', async () => {
    const sender = new NoOpEmailSender();
    await sender.sendDailyDigest('slug', '2026-05-14');
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Enterprise tier'));
  });
});

// ---------------------------------------------------------------------------
// BeehiivEmailSender
// ---------------------------------------------------------------------------

describe('BeehiivEmailSender', () => {
  let logSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);
  });

  afterEach(() => {
    logSpy.mockRestore();
    vi.clearAllMocks();
  });

  it('sendDailyDigest skips on Sundays and logs', async () => {
    const { sendBroadcast } = await import('@/lib/email/beehiiv');
    const sender = new BeehiivEmailSender();
    // 2026-05-17 is a Sunday
    await sender.sendDailyDigest('some-slug', '2026-05-17');
    expect(sendBroadcast).not.toHaveBeenCalled();
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Sunday'));
  });

  it('sendDailyDigest calls sendBroadcast with daily_digest_opt_in on non-Sunday', async () => {
    const { sendBroadcast } = await import('@/lib/email/beehiiv');
    const sender = new BeehiivEmailSender();
    // 2026-05-14 is a Thursday
    await sender.sendDailyDigest('test-slug', '2026-05-14');
    expect(sendBroadcast).toHaveBeenCalledWith(
      expect.objectContaining({ segment: 'daily_digest_opt_in' })
    );
  });

  it('sendWeeklyEmail calls sendBroadcast with segment all', async () => {
    const { sendBroadcast } = await import('@/lib/email/beehiiv');
    const sender = new BeehiivEmailSender();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await sender.sendWeeklyEmail({ report: {} } as any);
    expect(sendBroadcast).toHaveBeenCalledWith(
      expect.objectContaining({ segment: 'all' })
    );
  });

  it('sendSundayDigest calls sendBroadcast with segment all', async () => {
    const { sendBroadcast } = await import('@/lib/email/beehiiv');
    const sender = new BeehiivEmailSender();
    await sender.sendSundayDigest([], 'framing text');
    expect(sendBroadcast).toHaveBeenCalledWith(
      expect.objectContaining({ segment: 'all' })
    );
  });

  it('sendDailyDigest warns and skips when slug not found', async () => {
    const { loadDailyBySlug } = await import('@/lib/reports/daily-repository');
    vi.mocked(loadDailyBySlug).mockReturnValueOnce(undefined);
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const sender = new BeehiivEmailSender();
    await expect(sender.sendDailyDigest('missing-slug', '2026-05-14')).resolves.toBeUndefined();
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('missing-slug'));
    warnSpy.mockRestore();
  });
});
