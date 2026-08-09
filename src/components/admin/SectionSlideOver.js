'use client';
/**
 * SectionSlideOver
 * src/components/admin/SectionSlideOver.js
 *
 * The drawer that holds the settings panel. It is intentionally NOT a modal:
 * there is no dimming backdrop over the page, because the whole point is to
 * watch the section update live behind it while you change settings.
 *
 * On mobile it becomes a bottom sheet, since a 384px side drawer would cover
 * the preview entirely.
 */

import { X } from 'lucide-react';
import { useEffect } from 'react';

export default function SectionSlideOver({ open, title, subtitle, onClose, children }) {
  // Escape closes, and the page keeps its scroll position rather than being
  // locked — you need to scroll to the section you are editing.
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return (
    <div
      aria-hidden={!open}
      className={`fixed z-50 transition-transform duration-300 ease-out
        inset-x-0 bottom-0 h-[70vh] md:inset-y-0 md:left-auto md:right-0 md:h-auto md:w-[24rem]
        ${open ? 'translate-y-0 md:translate-x-0' : 'translate-y-full md:translate-y-0 md:translate-x-full'}`}
    >
      <div className="flex flex-col h-full bg-[var(--card-bg)] border-t md:border-t-0 md:border-l border-[var(--border)] shadow-2xl rounded-t-2xl md:rounded-none overflow-hidden">
        <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-[var(--border)] shrink-0">
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-[var(--text-primary)] truncate">
              {title || 'Section settings'}
            </h3>
            {subtitle && (
              <p className="text-[11px] text-[var(--text-muted)] truncate mt-0.5">{subtitle}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close settings"
            className="p-1.5 -mr-1.5 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 min-h-0">{open && children}</div>
      </div>
    </div>
  );
}
