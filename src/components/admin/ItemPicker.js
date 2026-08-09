'use client';
/**
 * ItemPicker
 * src/components/admin/ItemPicker.js
 *
 * Hand-pick exactly which documents a section shows, and in what order.
 * This is the "I want these three papers, in this order" control.
 *
 * It reads through the same `useSectionItems` hook the live section uses, so
 * the picker and the rendered section can never disagree about what exists.
 *
 * Ordering is up/down buttons for now; drag-to-reorder arrives with the rest
 * of the drag work in phase 3.
 */

import { useSectionItems } from '@/hooks/useSectionItems';
import { getTitleField } from '@/lib/sections/fieldRegistry';
import { ArrowDown, ArrowUp, Search, X } from 'lucide-react';
import { useMemo, useState } from 'react';

export default function ItemPicker({ section, ids = [], onChange }) {
  const { allItems, isLoading } = useSectionItems(section);
  const [query, setQuery] = useState('');

  const collectionName = section?.source?.collection;
  const titleKey = getTitleField(collectionName);

  const labelOf = (item) =>
    String(item?.[titleKey] || item?.title || item?.role || item?.company || item?.id || 'Untitled');

  const byId = useMemo(() => new Map(allItems.map((i) => [i.id, i])), [allItems]);

  // Selected in the admin's chosen order; ids whose document is gone are dropped.
  const selected = ids.map((id) => byId.get(id)).filter(Boolean);

  const available = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allItems
      .filter((item) => !ids.includes(item.id))
      .filter((item) => (q ? labelOf(item).toLowerCase().includes(q) : true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allItems, ids, query, titleKey]);

  const add = (id) => onChange([...ids, id]);
  const remove = (id) => onChange(ids.filter((x) => x !== id));

  const move = (index, direction) => {
    const target = index + direction;
    if (target < 0 || target >= ids.length) return;
    const next = [...ids];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  const missing = ids.length - selected.length;

  if (isLoading) {
    return <p className="text-sm text-[var(--text-muted)] py-3">Loading items…</p>;
  }

  return (
    <div className="space-y-4">
      {/* CHOSEN */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-1.5">
          Showing ({selected.length})
        </p>

        {selected.length === 0 ? (
          <p className="text-xs text-[var(--text-muted)] py-2 px-3 rounded-lg border border-dashed border-[var(--border)]">
            Nothing picked yet — this section will be empty. Add items below.
          </p>
        ) : (
          <ul className="space-y-1.5">
            {selected.map((item, i) => (
              <li
                key={item.id}
                className="flex items-center gap-2 pl-3 pr-1.5 py-1.5 rounded-lg bg-[var(--bg-primary)] border border-[var(--border)]"
              >
                <span className="w-5 shrink-0 text-[11px] font-bold tabular-nums text-[var(--text-muted)]">
                  {i + 1}
                </span>
                <span className="flex-1 min-w-0 truncate text-sm text-[var(--text-primary)]">
                  {labelOf(item)}
                </span>
                <button
                  type="button"
                  onClick={() => move(i, -1)}
                  disabled={i === 0}
                  aria-label="Move up"
                  className="p-1 rounded hover:bg-[var(--bg-tertiary)] disabled:opacity-25"
                >
                  <ArrowUp size={13} />
                </button>
                <button
                  type="button"
                  onClick={() => move(i, 1)}
                  disabled={i === selected.length - 1}
                  aria-label="Move down"
                  className="p-1 rounded hover:bg-[var(--bg-tertiary)] disabled:opacity-25"
                >
                  <ArrowDown size={13} />
                </button>
                <button
                  type="button"
                  onClick={() => remove(item.id)}
                  aria-label="Remove"
                  className="p-1 rounded text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10"
                >
                  <X size={13} />
                </button>
              </li>
            ))}
          </ul>
        )}

        {missing > 0 && (
          <p className="mt-2 text-[11px] text-amber-600">
            {missing} picked item{missing > 1 ? 's are' : ' is'} no longer in the database and will be skipped.
          </p>
        )}
      </div>

      {/* AVAILABLE */}
      <div>
        <div className="relative mb-2">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none"
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search items…"
            className="w-full pl-9 pr-3 py-2 rounded-lg text-sm bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
          />
        </div>

        <ul className="max-h-56 overflow-y-auto space-y-1 pr-1">
          {available.length === 0 ? (
            <li className="text-xs text-[var(--text-muted)] py-2">
              {query ? 'No matches.' : 'Everything is already picked.'}
            </li>
          ) : (
            available.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => add(item.id)}
                  className="w-full text-left px-3 py-1.5 rounded-lg text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)] transition-colors truncate"
                >
                  + {labelOf(item)}
                </button>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
