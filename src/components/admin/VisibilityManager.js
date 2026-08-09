'use client';
/**
 * VisibilityManager
 * src/components/admin/VisibilityManager.js
 *
 * One place to hide anything from the public site without deleting it.
 *
 * Hiding sets `hidden: true` on the document. `useColl` — the read path every
 * public page and section uses — filters those out, so a hidden item disappears
 * everywhere at once: listing pages, home-page sections, related galleries.
 * The admin reads through `useCollection`, which does not filter, so hidden
 * items stay visible and reversible here.
 *
 * Hiding is not deleting. Nothing is lost, and detail pages reached by a direct
 * URL still resolve — see the note in the UI.
 */

import { useCollection } from '@/hooks/useCollection';
import { setHidden } from '@/lib/firestore-helpers';
import { COLLECTIONS, COLLECTION_KEYS, getTitleField } from '@/lib/sections/fieldRegistry';
import { Eye, EyeOff, Info, Layers, Loader2, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';

const TABS = [...COLLECTION_KEYS, 'sections'];

export default function VisibilityManager() {
  const [active, setActive] = useState(COLLECTION_KEYS[0]);
  const [query, setQuery] = useState('');
  const [busyId, setBusyId] = useState(null);

  const { items, loading } = useCollection(active);

  const isSections = active === 'sections';
  const titleKey = isSections ? null : getTitleField(active);

  const labelOf = (item) => {
    if (isSections) {
      return (
        item.shell?.title ||
        item.title ||
        (item.source?.collection ? `${item.source.collection} section` : item.kind || item.type) ||
        'Untitled section'
      );
    }
    return String(item[titleKey] || item.title || item.role || item.company || 'Untitled');
  };

  const subLabelOf = (item) => {
    if (isSections) {
      const page = item.pageId ? `on ${item.pageId}` : '';
      const mode = item.display?.mode || item.layout || item.kind || item.type || '';
      return [page, mode].filter(Boolean).join(' · ');
    }
    return '';
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q ? items.filter((i) => labelOf(i).toLowerCase().includes(q)) : items;
    // Hidden first — they're what you came here to change.
    return [...list].sort((a, b) => Number(Boolean(b.hidden)) - Number(Boolean(a.hidden)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, query, active]);

  const hiddenCount = items.filter((i) => i.hidden).length;

  const toggle = async (item) => {
    setBusyId(item.id);
    try {
      await setHidden(active, item.id, !item.hidden);
      toast.success(item.hidden ? 'Now visible on the site.' : 'Hidden from the site.');
    } catch (err) {
      toast.error(`Could not update: ${err.message}`);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-xl overflow-hidden">
      <div className="p-5 border-b border-[var(--border)]">
        <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-[var(--text-primary)] mb-1">
          <EyeOff size={16} className="text-[var(--accent)]" />
          Visibility
        </h3>
        <p className="text-xs text-[var(--text-muted)]">
          Hide anything from the public site without deleting it.
        </p>

        <div className="flex flex-wrap gap-1.5 mt-4">
          {TABS.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => { setActive(key); setQuery(''); }}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                active === key
                  ? 'border-[var(--accent)] text-[var(--accent)] bg-[var(--accent)]/10'
                  : 'border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent)]'
              }`}
            >
              {key === 'sections' ? <Layers size={12} /> : null}
              {key === 'sections' ? 'Sections' : COLLECTIONS[key].label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3 px-5 py-3 border-b border-[var(--border)]">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search"
            className="w-full pl-8 pr-3 py-1.5 rounded-lg text-xs bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
          />
        </div>
        <span className="text-[11px] text-[var(--text-muted)] shrink-0">
          {hiddenCount} of {items.length} hidden
        </span>
      </div>

      {loading ? (
        <p className="p-5 text-sm text-[var(--text-muted)]">Loading…</p>
      ) : filtered.length === 0 ? (
        <p className="p-5 text-sm text-[var(--text-muted)]">
          {items.length === 0 ? 'Nothing in this collection yet.' : 'Nothing matches that.'}
        </p>
      ) : (
        <ul className="divide-y divide-[var(--border)] max-h-96 overflow-y-auto">
          {filtered.map((item) => (
            <li
              key={item.id}
              className={`flex items-center gap-3 px-5 py-2.5 ${item.hidden ? 'bg-[var(--bg-secondary)]' : ''}`}
            >
              <div className="flex-1 min-w-0">
                <p className={`text-sm truncate ${item.hidden ? 'text-[var(--text-muted)] line-through' : 'text-[var(--text-primary)]'}`}>
                  {labelOf(item)}
                </p>
                {subLabelOf(item) && (
                  <p className="text-[11px] text-[var(--text-muted)] truncate">{subLabelOf(item)}</p>
                )}
              </div>

              {item.hidden && (
                <span className="shrink-0 px-2 py-0.5 rounded-full bg-[var(--bg-tertiary)] text-[var(--text-muted)] text-[10px] font-bold uppercase tracking-wide">
                  Hidden
                </span>
              )}

              <button
                type="button"
                onClick={() => toggle(item)}
                disabled={busyId === item.id}
                aria-label={item.hidden ? 'Show on the site' : 'Hide from the site'}
                title={item.hidden ? 'Show on the site' : 'Hide from the site'}
                className={`shrink-0 p-2 rounded-lg transition-colors disabled:opacity-40 ${
                  item.hidden
                    ? 'text-[var(--accent)] hover:bg-[var(--accent)]/10'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]'
                }`}
              >
                {busyId === item.id
                  ? <Loader2 size={16} className="animate-spin" />
                  : item.hidden ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex items-start gap-2 px-5 py-3 border-t border-[var(--border)] bg-[var(--bg-secondary)]">
        <Info size={13} className="text-[var(--text-muted)] mt-0.5 shrink-0" />
        <p className="text-[11px] leading-snug text-[var(--text-muted)]">
          Hidden items disappear from listing pages and from every section that pulls
          from that collection. They are not deleted, and a detail page reached by its
          direct URL will still open — use delete if something must be unreachable.
        </p>
      </div>
    </div>
  );
}
