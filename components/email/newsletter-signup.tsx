'use client';

import { useState } from 'react';

type Status = 'idle' | 'loading' | 'success' | 'error';

type Props = {
  className?: string;
};

export function NewsletterSignup({ className = '' }: Props): JSX.Element {
  const [email, setEmail] = useState('');
  const [dailyOptIn, setDailyOptIn] = useState(false);
  const [status, setStatus] = useState<Status>('idle');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setStatus('loading');

    try {
      const response = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, dailyDigestOptIn: dailyOptIn })
      });

      if (response.ok) {
        setStatus('success');
        setEmail('');
        setDailyOptIn(false);
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  };

  if (status === 'success') {
    return (
      <p className={`text-sm text-muted ${className}`}>
        Subscribed. Check your email for confirmation.
      </p>
    );
  }

  return (
    <form className={`max-w-md space-y-3 ${className}`} onSubmit={(e) => void handleSubmit(e)}>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          required
          aria-label="Email address"
          className="flex-1 rounded-lg border border-white/10 bg-canvas px-3 py-2 text-sm text-paper placeholder:text-muted focus:border-accent/50 focus:outline-none"
          disabled={status === 'loading'}
          placeholder="you@example.com"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button
          className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-canvas transition hover:bg-accent/90 disabled:opacity-60"
          disabled={status === 'loading'}
          type="submit"
        >
          {status === 'loading' ? 'Subscribing…' : 'Subscribe'}
        </button>
      </div>

      <label className="flex cursor-pointer items-start gap-2 text-sm text-muted">
        <input
          checked={dailyOptIn}
          className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer appearance-none rounded border border-white/25 bg-canvas transition checked:border-accent checked:bg-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          disabled={status === 'loading'}
          type="checkbox"
          onChange={(e) => setDailyOptIn(e.target.checked)}
        />
        <span>Also send me daily digest emails (Tue–Sun)</span>
      </label>

      {status === 'error' && (
        <p className="text-sm text-red-400">Something went wrong, please try again.</p>
      )}
    </form>
  );
}
