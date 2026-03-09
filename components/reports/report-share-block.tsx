'use client';

import { useState } from 'react';

type ReportShareBlockProps = Readonly<{
  title: string;
  url: string;
}>;

const COPIED_FEEDBACK_TIMEOUT_MS = 2000;

const createXShareUrl = (title: string, url: string): string => {
  const query = new URLSearchParams({
    text: title,
    url
  });

  return `https://x.com/intent/tweet?${query.toString()}`;
};

const createLinkedInShareUrl = (url: string): string => {
  const query = new URLSearchParams({ url });

  return `https://www.linkedin.com/sharing/share-offsite/?${query.toString()}`;
};

export function ReportShareBlock({ title, url }: ReportShareBlockProps): JSX.Element {
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'error'>('idle');

  const handleCopyLink = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(url);
      setCopyStatus('copied');

      window.setTimeout(() => {
        setCopyStatus('idle');
      }, COPIED_FEEDBACK_TIMEOUT_MS);
    } catch {
      setCopyStatus('error');
    }
  };

  const xShareUrl = createXShareUrl(title, url);
  const linkedInShareUrl = createLinkedInShareUrl(url);

  return (
    <aside className="space-y-3 border border-line bg-white p-4" aria-label="Share this report">
      <h2 className="text-sm font-semibold tracking-tight">Share this report</h2>
      <div className="flex flex-wrap gap-2 text-sm">
        <button
          className="inline-flex border border-line px-3 py-1.5 font-medium transition hover:border-ink"
          onClick={handleCopyLink}
          type="button"
        >
          Copy link
        </button>
        <a
          className="inline-flex border border-line px-3 py-1.5 font-medium transition hover:border-ink"
          href={xShareUrl}
          rel="noopener noreferrer"
          target="_blank"
        >
          Share on X
        </a>
        <a
          className="inline-flex border border-line px-3 py-1.5 font-medium transition hover:border-ink"
          href={linkedInShareUrl}
          rel="noopener noreferrer"
          target="_blank"
        >
          Share on LinkedIn
        </a>
      </div>
      <p className="text-xs text-muted" role="status">
        {copyStatus === 'copied' && 'Link copied.'}
        {copyStatus === 'error' && 'Could not copy automatically. Please copy from the address bar.'}
      </p>
    </aside>
  );
}
