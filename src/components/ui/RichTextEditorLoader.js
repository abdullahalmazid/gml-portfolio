'use client';
/**
 * RichTextEditorLoader
 * src/components/ui/RichTextEditorLoader.js
 *
 * Loads the editor only when it is actually rendered — which only happens in
 * edit mode. Tiptap and ProseMirror are around 150KB; shipping that to every
 * visitor who wants to read your papers would cancel out the loading work we
 * just did.
 *
 * `ssr: false` because ProseMirror needs a real DOM.
 *
 * Import THIS everywhere. Never import RichTextEditor directly.
 */

import dynamic from 'next/dynamic';

const RichTextEditorLoader = dynamic(() => import('./RichTextEditor'), {
  ssr: false,
  loading: () => (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] p-4">
      <div className="h-8 w-2/3 bg-black/5 dark:bg-white/10 animate-pulse rounded mb-3" />
      <div className="h-24 bg-black/5 dark:bg-white/10 animate-pulse rounded" />
      <p className="mt-2 text-[11px] text-[var(--text-muted)]">Loading the editor…</p>
    </div>
  ),
});

export default RichTextEditorLoader;
