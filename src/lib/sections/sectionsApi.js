/**
 * Sections API
 * src/lib/sections/sectionsApi.js
 *
 * Every write to the `sections` collection goes through here, so ordering
 * rules and the undefined-stripping live in one place instead of being
 * re-implemented by each caller.
 *
 * Ordering is fractional: inserting between two sections writes ONE document
 * with an order value halfway between its neighbours. Nothing is renumbered,
 * so a move can't scramble the rest of the page — which is what went wrong
 * with the old swap-based approach.
 */

import { db } from '@/lib/firebase';
import { addDoc, collection, deleteDoc, doc, setDoc, updateDoc } from 'firebase/firestore';
import { orderBetween, sortSections } from './schema';

/** Firestore rejects `undefined` anywhere in a document. */
export function stripUndefined(value) {
  if (Array.isArray(value)) return value.map(stripUndefined).filter((v) => v !== undefined);
  if (value && typeof value === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      if (v === undefined) continue;
      out[k] = stripUndefined(v);
    }
    return out;
  }
  return value;
}

/** `id` is the document key, never a field inside the document. */
function payload(section) {
  const { id, ...rest } = section;
  return stripUndefined(rest);
}

/**
 * Save an existing section. Deliberately replaces rather than merges: when a
 * field is switched off or a mode option disappears, the old key must go, not
 * linger and quietly take effect later.
 */
export async function saveSection(section) {
  if (!section?.id) throw new Error('saveSection needs a section with an id.');
  await setDoc(doc(db, 'sections', section.id), payload(section));
  return section.id;
}

/**
 * Create a section at a position. `siblings` is the page's current sections;
 * `index` is the slot it should occupy (0 = top, omitted = end).
 */
export async function createSection(section, siblings = [], index = null) {
  const sorted = sortSections(siblings);
  const at = index === null || index > sorted.length ? sorted.length : Math.max(index, 0);

  const before = at > 0 ? sorted[at - 1]?.order : null;
  const after = at < sorted.length ? sorted[at]?.order : null;

  const created = {
    ...section,
    order: orderBetween(before ?? null, after ?? null),
    createdAt: Date.now(),
  };

  const ref = await addDoc(collection(db, 'sections'), payload(created));
  return ref.id;
}

/** Copy a section and drop it immediately below the original. */
export async function duplicateSection(section, siblings = []) {
  const sorted = sortSections(siblings);
  const index = sorted.findIndex((s) => s.id === section.id);

  const copy = {
    ...section,
    shell: { ...section.shell, title: section.shell?.title ? `${section.shell.title} (copy)` : '' },
  };

  return createSection(copy, sorted, index === -1 ? null : index + 1);
}

export async function deleteSection(id) {
  await deleteDoc(doc(db, 'sections', id));
}

/**
 * Move one place up or down. Only the moved document is written — its new
 * order lands between the two documents it is jumping over.
 */
export async function moveSection(section, siblings = [], direction = 'up') {
  const sorted = sortSections(siblings);
  const index = sorted.findIndex((s) => s.id === section.id);
  if (index === -1) return null;

  const target = direction === 'up' ? index - 1 : index + 1;
  if (target < 0 || target >= sorted.length) return null;

  let before;
  let after;

  if (direction === 'up') {
    before = target > 0 ? sorted[target - 1].order : null;
    after = sorted[target].order;
  } else {
    before = sorted[target].order;
    after = target + 1 < sorted.length ? sorted[target + 1].order : null;
  }

  const order = orderBetween(before, after);
  await updateDoc(doc(db, 'sections', section.id), { order });
  return order;
}

/**
 * Fractional orders halve the gap each time, so after many inserts in the same
 * spot the values converge. Well before floating point runs out, respace.
 * Returns the writes needed, or an empty array when spacing is still healthy.
 */
export function needsRespacing(siblings = [], minGap = 0.001) {
  const sorted = sortSections(siblings);
  for (let i = 1; i < sorted.length; i += 1) {
    if (Math.abs(sorted[i].order - sorted[i - 1].order) < minGap) return true;
  }
  return false;
}
