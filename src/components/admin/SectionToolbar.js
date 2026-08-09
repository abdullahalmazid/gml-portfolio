'use client';
/**
 * SectionToolbar
 * src/components/admin/SectionToolbar.js
 *
 * The controls that appear over a section in edit mode. Replaces the old
 * manager box at the bottom of the page — you now act on a section while
 * looking at it.
 *
 * Rendered into SectionShell's `toolbar` slot, which sits inside a
 * `relative` section element.
 */

import { ArrowDown, ArrowUp, Copy, Eye, EyeOff, Loader2, Settings2, Trash2 } from 'lucide-react';
import { useState } from 'react';

function ToolButton({ icon: Icon, label, onClick, disabled, danger = false }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={disabled}
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); onClick?.(); }}
      className={`p-1.5 rounded-md transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${danger
          ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-500/15'
          : 'text-white/90 hover:bg-white/20'
        }`}
    >
      <Icon size={15} />
    </button>
  );
}

export default function SectionToolbar({
  section,
  index,
  total,
  active = false,
  busy = false,
  onEdit,
  onDuplicate,
  onDelete,
  onMove,
  onToggleHidden,
}) {
  const [confirming, setConfirming] = useState(false);

  const label =
    section?.shell?.title ||
    (section?.kind === 'content' ? section.source?.collection : section?.kind) ||
    'Section';

  return (
    <div
      className={`absolute top-3 right-3 z-40 transition-opacity duration-200 ${active ? 'opacity-100' : 'opacity-0 focus-within:opacity-100 group-hover/section:opacity-100'
        }`}
    >
      <div
        className={`flex items-center gap-0.5 pl-3 pr-1.5 py-1.5 rounded-full bg-neutral-900/90 backdrop-blur-md shadow-xl ring-1 ${active ? 'ring-[var(--accent)]' : 'ring-white/10'
          }`}
      >
        <span className="text-[11px] font-semibold text-white/70 mr-1.5 max-w-[9rem] truncate">
          {label}
        </span>

        {busy ? (
          <Loader2 size={15} className="text-white/80 animate-spin mx-1.5" />
        ) : confirming ? (
          <>
            <span className="text-[11px] font-bold text-red-300 mr-1">Delete?</span>
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete?.(); }}
              className="px-2 py-0.5 rounded text-[11px] font-bold bg-red-500 text-white hover:bg-red-600"
            >
              Yes
            </button>
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setConfirming(false); }}
              className="px-2 py-0.5 rounded text-[11px] font-semibold text-white/70 hover:bg-white/20"
            >
              No
            </button>
          </>
        ) : (
          <>
            <ToolButton
              icon={ArrowUp}
              label="Move up"
              disabled={index === 0}
              onClick={() => onMove?.('up')}
            />
            <ToolButton
              icon={ArrowDown}
              label="Move down"
              disabled={index === total - 1}
              onClick={() => onMove?.('down')}
            />
            <ToolButton
              icon={section?.hidden ? EyeOff : Eye}
              label={section?.hidden ? 'Show on the site' : 'Hide from the site'}
              onClick={onToggleHidden}
            />
            <ToolButton icon={Copy} label="Duplicate" onClick={onDuplicate} />
            <ToolButton icon={Trash2} label="Delete" danger onClick={() => setConfirming(true)} />
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onEdit?.(); }}
              className="ml-1 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-[var(--accent)] text-[var(--accent-contrast)] hover:opacity-90"
            >
              <Settings2 size={13} />
              Edit
            </button>
          </>
        )}
      </div>
    </div>
  );
}