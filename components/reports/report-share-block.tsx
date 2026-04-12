'use client';

import { useState } from 'react';

type ReportShareBlockProps = Readonly<{
  title: string;
  url: string;
}>;

const COPIED_FEEDBACK_TIMEOUT_MS = 2000;

const createXShareUrl = (title: string, url: string): string => {
  const query = new URLSearchParams({
    text: `${title} | Weekly Crypto Pulse`,
    url
  });

  return `https://x.com/intent/tweet?${query.toString()}`;
};

const createLinkedInShareUrl = (url: string): string => {
  const query = new URLSearchParams({ url });

  return `https://www.linkedin.com/sharing/share-offsite/?${query.toString()}`;
};

const copyWithLegacyFallback = (value: string): boolean => {
  const tempInput = document.createElement('input');
  tempInput.value = value;
  tempInput.setAttribute('readonly', '');
  tempInput.style.position = 'absolute';
  tempInput.style.left = '-9999px';

  document.body.appendChild(tempInput);
  tempInput.select();

  const didCopy = document.execCommand('copy');
  document.body.removeChild(tempInput);

  return didCopy;
};

const copyLinkToClipboard = async (value: string): Promise<boolean> => {
  if (!navigator.clipboard?.writeText) {
    return copyWithLegacyFallback(value);
  }

  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    return copyWithLegacyFallback(value);
  }
};

export function ReportShareBlock({ title, url }: ReportShareBlockProps): JSX.Element {
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'error'>('idle');

  const handleCopyLink = async (): Promise<void> => {
    const didCopy = await copyLinkToClipboard(url);

    setCopyStatus(didCopy ? 'copied' : 'error');

    window.setTimeout(() => {
      setCopyStatus('idle');
    }, COPIED_FEEDBACK_TIMEOUT_MS);
  };

  const xShareUrl = createXShareUrl(title, url);
  const linkedInShareUrl = createLinkedInShareUrl(url);

  return (
    <aside className="space-y-3 rounded-2xl border border-white/10 bg-surface p-5 shadow-[0_2px_8px_rgba(0,0,0,0.4)]" aria-label="Share this report">
      <h2 className="text-sm font-semibold tracking-tight text-paper">Share this report</h2>
      <div className="grid gap-2 text-sm sm:grid-cols-3 xl:grid-cols-1">
        <button
          aria-label="Copy report link"
          className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/10 px-3 py-2 font-medium text-paper transition hover:border-white/30 hover:bg-white/5"
          onClick={handleCopyLink}
          type="button"
        >
          Copy link
        </button>
        <a
          aria-label="Share report on X"
          className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/10 px-3 py-2 font-medium text-paper transition hover:border-white/30 hover:bg-white/5"
          href={xShareUrl}
          rel="noopener noreferrer"
          target="_blank"
        >
          Share on X
        </a>
        <a
          aria-label="Share report on LinkedIn"
          className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/10 px-3 py-2 font-medium text-paper transition hover:border-white/30 hover:bg-white/5"
          href={linkedInShareUrl}
          rel="noopener noreferrer"
          target="_blank"
        >
          Share on LinkedIn
        </a>
      </div>
      <p className="min-h-4 text-xs text-muted" role="status">
        {copyStatus === 'copied' && 'Link copied.'}
        {copyStatus === 'error' && 'Could not copy automatically. Please copy from the address bar.'}
      </p>
    </aside>
  );
}
