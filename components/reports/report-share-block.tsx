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
    <aside className="space-y-3 border border-line bg-white p-4" aria-label="Share this report">
      <h2 className="text-sm font-semibold tracking-tight">Share this report</h2>
      <div className="flex flex-wrap gap-2 text-sm">
        <button
          aria-label="Copy report link"
          className="inline-flex border border-line px-3 py-1.5 font-medium transition hover:border-ink"
          onClick={handleCopyLink}
          type="button"
        >
          Copy link
        </button>
        <a
          aria-label="Share report on X"
          className="inline-flex border border-line px-3 py-1.5 font-medium transition hover:border-ink"
          href={xShareUrl}
          rel="noopener noreferrer"
          target="_blank"
        >
          Share on X
        </a>
        <a
          aria-label="Share report on LinkedIn"
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
