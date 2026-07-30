"use client";

import { useState } from "react";

export default function ShareBar({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // fallback: select-all in a hidden input — but most browsers support clipboard
    }
  };

  return (
    <div className="flex items-center gap-2 rounded-lg border border-control bg-ink-900/60 p-1.5 pl-3">
      <span className="text-xs uppercase tracking-wider text-ink-400">Share</span>
      <input
        readOnly
        value={url}
        onFocus={e => e.currentTarget.select()}
        className="flex-1 min-w-0 truncate bg-transparent px-2 text-sm text-ink-200 outline-none"
      />
      <button
        onClick={copy}
        className="rounded bg-accent/20 px-3 py-1.5 text-xs font-medium text-accent transition hover:bg-accent/30"
      >
        {copied ? "Copied" : "Copy link"}
      </button>
    </div>
  );
}
