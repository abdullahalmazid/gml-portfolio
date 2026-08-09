'use client';
/**
 * DropZone
 * src/components/admin/DropZone.js
 *
 * The thin insert point between two sections in edit mode. Clicking one opens
 * the wizard with the position already decided, which is why the wizard never
 * has to ask "where should this go?" for the page you are already looking at.
 *
 * Collapsed to a few pixels until hovered, so edit mode doesn't push the page
 * around and misrepresent how it actually looks.
 */

import { Plus } from 'lucide-react';

export default function DropZone({ onClick, label = 'Add section here', compact = false }) {
  return (
    <div className={`relative group/drop ${compact ? 'h-2' : 'h-3'} z-30`}>
      <button
        type="button"
        onClick={onClick}
        aria-label={label}
        className="absolute inset-x-0 -top-3 -bottom-3 flex items-center justify-center opacity-0 group-hover/drop:opacity-100 focus:opacity-100 transition-opacity duration-200"
      >
        <span className="absolute inset-x-6 h-px bg-[var(--accent)]/60" />
        <span className="relative inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--accent)] text-white text-[11px] font-bold shadow-lg">
          <Plus size={12} strokeWidth={3} />
          {label}
        </span>
      </button>
    </div>
  );
}
