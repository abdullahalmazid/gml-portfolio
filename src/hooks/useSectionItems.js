'use client';
/**
 * useSectionItems
 * src/hooks/useSectionItems.js
 *
 * Turns a section's `source` config into the actual documents a mode renders.
 * Everything about *which* items appear lives here, so no display mode ever
 * has to know about selection, sorting, limits or image joins.
 *
 * Responsibilities:
 *   - subscribe to the source collection (live, so admin edits appear instantly)
 *   - apply selection: auto | manual (hand-picked, in your order) | filter
 *   - apply sort and limit
 *   - resolve images, including the projects -> gallery join
 *   - attach per-item overrides
 *
 * Returns `allItems` as well as `items` — the item picker in the settings
 * panel needs the full unfiltered list, and reusing this hook means the
 * picker and the section can never disagree about what exists.
 */

import { db } from '@/lib/firebase';
import { getCollection, getTitleField } from '@/lib/sections/fieldRegistry';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { useEffect, useMemo, useState } from 'react';

/* ------------------------------------------------------------------ */
/* Live collection subscription                                        */
/* ------------------------------------------------------------------ */

/**
 * Subscribes to a whole collection. Pass null to subscribe to nothing —
 * this keeps the hook order stable when a join isn't needed.
 *
 * No orderBy here on purpose: sorting happens in JS so that `manual` order
 * and alphabetical sort work without composite indexes, and so documents
 * missing `createdAt` don't silently vanish from the query.
 */
function useCollectionDocs(name) {
  const [docs, setDocs] = useState([]);
  const [isLoading, setIsLoading] = useState(Boolean(name));
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!name) {
      setDocs([]);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    const unsub = onSnapshot(
      query(collection(db, name)),
      (snap) => {
        if (cancelled) return;
        setDocs(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setIsLoading(false);
      },
      (err) => {
        if (cancelled) return;
        console.warn(`[useSectionItems] "${name}" failed:`, err.code || err.message);
        setError(err);
        setIsLoading(false);
      }
    );

    return () => { cancelled = true; unsub(); };
  }, [name]);

  return { docs, isLoading, error };
}

/* ------------------------------------------------------------------ */
/* Pure helpers                                                        */
/* ------------------------------------------------------------------ */

/** createdAt is epoch ms in your data, but tolerate Timestamps and dates. */
function timeOf(item) {
  const v = item?.createdAt;
  if (typeof v === 'number') return v;
  if (v?.toDate) return v.toDate().getTime();
  if (v?.seconds) return v.seconds * 1000;
  if (typeof v === 'string') {
    const parsed = Date.parse(v);
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}

function matchesFilter(item, filter) {
  if (!filter?.field) return true;
  const raw = item[filter.field];
  const target = filter.value;
  if (raw === undefined || raw === null) return false;

  const a = String(raw).toLowerCase();
  const b = String(target ?? '').toLowerCase();

  switch (filter.op) {
    case 'eq': return a === b;
    case 'neq': return a !== b;
    case 'contains': return a.includes(b);
    case 'gt': return Number(raw) > Number(target);
    case 'lt': return Number(raw) < Number(target);
    case 'in': return Array.isArray(target) && target.map(String).map((s) => s.toLowerCase()).includes(a);
    default: return true;
  }
}

function sortItems(items, sort, collectionName) {
  const titleKey = getTitleField(collectionName);
  const copy = [...items];

  switch (sort) {
    case 'oldest':
      return copy.sort((a, b) => timeOf(a) - timeOf(b));
    case 'alpha':
      return copy.sort((a, b) =>
        String(a[titleKey] || '').localeCompare(String(b[titleKey] || ''))
      );
    case 'manual':
      return copy; // caller already ordered these
    case 'newest':
    default:
      return copy.sort((a, b) => timeOf(b) - timeOf(a));
  }
}

/**
 * Build a map of documentId -> [imageUrl] for a joined collection.
 * Used for projects, whose images live in `gallery` keyed by relatedProjectId.
 */
function buildImageIndex(joinDocs, joinConfig) {
  const index = new Map();
  if (!joinConfig || joinConfig === 'self') return index;

  for (const doc of joinDocs) {
    const key = doc[joinConfig.matchField];
    const url = doc[joinConfig.imageField];
    if (!key || !url) continue;
    if (!index.has(key)) index.set(key, []);
    index.get(key).push(url);
  }
  return index;
}

/* ------------------------------------------------------------------ */
/* The hook                                                            */
/* ------------------------------------------------------------------ */

export function useSectionItems(section) {
  const source = section?.kind === 'content' ? section.source : null;
  const collectionName = source?.collection || null;

  const meta = collectionName ? getCollection(collectionName) : null;
  const joinConfig = meta?.imageFrom && meta.imageFrom !== 'self' ? meta.imageFrom : null;

  // Both subscriptions are always called; a null name subscribes to nothing.
  const primary = useCollectionDocs(collectionName);
  const joined = useCollectionDocs(joinConfig?.collection || null);

  const items = useMemo(() => {
    if (!source || !meta) return [];

    const { selection, ids = [], filter, sort, limit } = source;
    // Hidden documents never render on the public site. The item picker
    // reads `allItems` (unfiltered) so you can still see and re-show them.
    const all = primary.docs.filter((d) => d.hidden !== true);
    let selected;

    if (selection === 'manual') {
      // Preserve the admin's hand-picked order, and skip ids whose document
      // has since been deleted.
      const byId = new Map(all.map((d) => [d.id, d]));
      selected = ids.map((id) => byId.get(id)).filter(Boolean);
    } else if (selection === 'filter') {
      selected = sortItems(all.filter((d) => matchesFilter(d, filter)), sort, collectionName);
    } else {
      selected = sortItems(all, sort, collectionName);
    }

    selected = selected.slice(0, limit);

    // Attach images and overrides.
    const imageIndex = buildImageIndex(joined.docs, joinConfig);
    const overrides = section.itemOverrides || {};

    return selected.map((doc) => {
      let images = [];
      if (meta.imageFrom === 'self') {
        const selfField = meta.fields.find((f) => f.role === 'image');
        const url = selfField ? doc[selfField.key] : null;
        if (url) images = [url];
      } else if (joinConfig) {
        // The document's own image leads, joined images follow. Duplicates are
        // dropped so a cover image also present in the gallery isn't shown twice.
        const own = joinConfig.self ? doc[joinConfig.self] : null;
        const joinedImages = imageIndex.get(doc.id) || [];
        images = [...new Set([own, ...joinedImages].filter(Boolean))];
      }

      const override = overrides[doc.id] || {};

      return {
        ...doc,
        __images: images,
        __image: images[0] || null,
        __featured: Boolean(override.featured),
        __fieldOverrides: override.fields || null,
      };
    });
  }, [source, meta, joinConfig, primary.docs, joined.docs, section?.itemOverrides, collectionName]);

  // Featured items float to the front without disturbing relative order.
  const ordered = useMemo(() => {
    if (!items.some((i) => i.__featured)) return items;
    return [...items.filter((i) => i.__featured), ...items.filter((i) => !i.__featured)];
  }, [items]);

  return {
    items: ordered,
    allItems: primary.docs,     // unfiltered, for the item picker
    isLoading: primary.isLoading || joined.isLoading,
    error: primary.error || joined.error,
  };
}

export default useSectionItems;