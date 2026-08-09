/**
 * SECTION SCHEMA
 * src/lib/sections/schema.js
 *
 * The shape of a section document, its defaults, and `normalizeSection()` —
 * which upgrades older documents on read. Every consumer calls normalize
 * first, so no renderer ever sees a legacy shape and a half-migrated database
 * still renders correctly.
 *
 * ---------------------------------------------------------------------------
 * SHAPE (version 2)
 *
 * {
 *   id, pageId, order, version: 2,
 *   kind: 'content' | 'custom' | 'stats',
 *
 *   shell: {                       // every kind has this
 *     title, subtitle, titleAlign, bgColor,
 *     padding, width, showCta, ctaLabel, ctaHref
 *   },
 *
 *   // kind: 'content'
 *   source:  { collection, selection, ids[], filter, sort, limit },
 *   display: { mode, options{} },
 *   fields:  { [fieldKey]: bool },
 *   truncate:{ [fieldKey]: number },
 *   itemOverrides: { [docId]: { featured, fields{} } },
 *
 *   // kind: 'custom'
 *   template, blocks[],
 *
 *   // kind: 'stats'
 *   stats: [{ type, source, label, value, suffix }]
 * }
 * ---------------------------------------------------------------------------
 */

import {
  defaultFieldVisibility,
  getCollection,
  hasImages,
  reconcileFieldVisibility,
} from './fieldRegistry';
import { reconcileBlock } from './blockRegistry';
import {
  defaultModeOptions,
  getMode,
  reconcileModeOptions,
  suggestMode,
} from './modeRegistry';

export const SCHEMA_VERSION = 2;

export const KINDS = ['content', 'custom', 'stats'];
export const SELECTION_MODES = ['auto', 'manual', 'filter'];
export const SORT_MODES = ['newest', 'oldest', 'manual', 'alpha'];

export const DEFAULT_SHELL = {
  title: '',
  subtitle: '',
  titleAlign: 'left',   // left | center | right
  bgColor: 'var(--bg-primary)',
  padding: 'lg',        // sm | md | lg | xl
  width: 'normal',      // narrow | normal | wide | full
  showCta: true,
  ctaLabel: 'Explore All',
  ctaHref: '',
};

/* ------------------------------------------------------------------ */
/* Creating                                                            */
/* ------------------------------------------------------------------ */

/** A fresh content section, fully populated from the two registries. */
export function createContentSection({ pageId, collection, mode, limit = 3 } = {}) {
  const meta = getCollection(collection);
  const chosenMode = mode || suggestMode(collection);

  return {
    version: SCHEMA_VERSION,
    kind: 'content',
    pageId,
    shell: {
      ...DEFAULT_SHELL,
      title: meta?.label || '',
      ctaHref: meta?.route || '',
    },
    source: {
      collection,
      selection: 'auto',        // auto | manual | filter
      ids: [],                  // used when selection === 'manual'
      filter: null,             // { field, op, value } when selection === 'filter'
      sort: meta?.defaultSort || 'newest',
      limit,
    },
    display: {
      mode: chosenMode,
      options: defaultModeOptions(chosenMode),
    },
    fields: defaultFieldVisibility(collection),
    truncate: {},
    itemOverrides: {},
  };
}

/** A fresh custom section built from a template key. */
export function createCustomSection({ pageId, template = 'rich-text', blocks = [] } = {}) {
  return {
    version: SCHEMA_VERSION,
    kind: 'custom',
    pageId,
    shell: { ...DEFAULT_SHELL, showCta: false },
    template,
    blocks,
  };
}

/** A fresh stats section. */
export function createStatsSection({ pageId, stats = [] } = {}) {
  return {
    version: SCHEMA_VERSION,
    kind: 'stats',
    pageId,
    shell: { ...DEFAULT_SHELL, padding: 'md', showCta: false },
    stats,
  };
}

/* ------------------------------------------------------------------ */
/* Normalising / migrating                                             */
/* ------------------------------------------------------------------ */

// v1 `layout` values -> v2 display modes.
const LEGACY_LAYOUT_TO_MODE = {
  grid: 'grid',
  list: 'list',
  'side-left': 'split',
  'side-right': 'split',
};

const LEGACY_ALIGN = { Left: 'left', Center: 'center', Right: 'right' };

/**
 * Bring any section document up to the current shape.
 *
 * Safe to call on an already-normalised section — it is idempotent, and it
 * also reconciles fields and mode options against the registries, so sections
 * saved before a registry change pick up new defaults instead of rendering
 * with `undefined`.
 */
export function normalizeSection(raw) {
  if (!raw || typeof raw !== 'object') return null;

  const section = raw.version >= SCHEMA_VERSION ? { ...raw } : migrateV1(raw);

  section.version = SCHEMA_VERSION;
  section.shell = { ...DEFAULT_SHELL, ...(section.shell || {}) };
  if (typeof section.order !== 'number') section.order = 0;

  if (section.kind === 'content') {
    const collection = section.source?.collection;

    section.source = {
      collection,
      selection: SELECTION_MODES.includes(section.source?.selection) ? section.source.selection : 'auto',
      ids: Array.isArray(section.source?.ids) ? section.source.ids : [],
      filter: section.source?.filter || null,
      sort: SORT_MODES.includes(section.source?.sort) ? section.source.sort : 'newest',
      limit: clampLimit(section.source?.limit),
    };

    // Unknown mode (renamed or removed from the registry) falls back rather
    // than rendering nothing.
    let mode = section.display?.mode;
    if (!getMode(mode)) mode = suggestMode(collection);
    if (getMode(mode)?.requiresImage && !hasImages(collection)) mode = 'list';

    section.display = {
      mode,
      options: reconcileModeOptions(mode, section.display?.options),
    };

    section.fields = reconcileFieldVisibility(collection, section.fields);
    section.truncate = section.truncate || {};
    section.itemOverrides = section.itemOverrides || {};
  }

  if (section.kind === 'custom') {
    section.template = section.template || 'rich-text';
    section.blocks = (Array.isArray(section.blocks) ? section.blocks : []).map(reconcileBlock);
  }

  if (section.kind === 'stats') {
    section.stats = Array.isArray(section.stats) ? section.stats : [];
  }

  return section;
}

/** Convert an original section document into the v2 shape. */
function migrateV1(doc) {
  const shell = {
    ...DEFAULT_SHELL,
    title: doc.title || '',
    titleAlign: LEGACY_ALIGN[doc.titleAlign] || 'left',
    bgColor: doc.bgColor || DEFAULT_SHELL.bgColor,
  };

  const base = { id: doc.id, pageId: doc.pageId, order: doc.order, createdAt: doc.createdAt };

  if (doc.type === 'linked') {
    const collection = doc.linkedCollection;
    const mode = LEGACY_LAYOUT_TO_MODE[doc.layout] || suggestMode(collection);

    return {
      ...base,
      kind: 'content',
      shell: {
        ...shell,
        showCta: true,
        ctaHref: doc.linkedPage ? `/${doc.linkedPage}` : getCollection(collection)?.route || '',
      },
      source: {
        collection,
        selection: 'auto',
        ids: [],
        filter: null,
        sort: 'newest',
        limit: clampLimit(doc.limit),
      },
      display: {
        mode,
        options: {
          ...defaultModeOptions(mode),
          // side-left / side-right encoded the image side in the layout name.
          ...(mode === 'split' ? { imageSide: doc.layout === 'side-left' ? 'left' : 'right' } : {}),
        },
      },
      fields: defaultFieldVisibility(collection),
      truncate: {},
      itemOverrides: {},
    };
  }

  if (doc.type === 'stats') {
    let stats = [];
    try {
      const parsed = JSON.parse(doc.content || '[]');
      if (Array.isArray(parsed)) stats = parsed;
    } catch {
      stats = [];
    }
    return { ...base, kind: 'stats', shell: { ...shell, padding: 'md', showCta: false }, stats };
  }

  // Everything else was a markdown text section.
  return {
    ...base,
    kind: 'custom',
    shell: { ...shell, showCta: false },
    template: 'rich-text',
    blocks: doc.content
      ? [{ id: 'b1', type: 'richtext', props: { markdown: doc.content } }]
      : [],
  };
}

function clampLimit(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 1) return 3;
  return Math.min(Math.round(n), 24);
}

/* ------------------------------------------------------------------ */
/* Validation                                                          */
/* ------------------------------------------------------------------ */

/**
 * Cheap sanity check for the settings panel. Returns problems worth showing
 * the user, not schema violations — normalize already guarantees the shape.
 */
export function validateSection(section) {
  const issues = [];
  if (!section) return [{ level: 'error', message: 'Section is empty.' }];
  if (!section.pageId) issues.push({ level: 'error', message: 'Section has no page.' });

  if (section.kind === 'content') {
    const { collection, selection, ids, limit } = section.source;
    if (!getCollection(collection)) {
      issues.push({ level: 'error', message: `Unknown collection "${collection}".` });
    }
    if (selection === 'manual' && ids.length === 0) {
      issues.push({ level: 'warn', message: 'No items picked yet, so this section will be empty.' });
    }
    if (selection === 'manual' && ids.length < limit) {
      issues.push({ level: 'info', message: `Showing ${ids.length} picked item(s); the limit of ${limit} is not reached.` });
    }
    const mode = getMode(section.display.mode);
    if (mode && limit < mode.minItems) {
      issues.push({ level: 'warn', message: `"${mode.label}" looks best with at least ${mode.minItems} items.` });
    }
  }

  if (section.kind === 'stats' && section.stats.length === 0) {
    issues.push({ level: 'warn', message: 'No stats configured.' });
  }

  return issues;
}

/* ------------------------------------------------------------------ */
/* Ordering                                                            */
/* ------------------------------------------------------------------ */

/**
 * Fractional ordering: an order value between two neighbours, so inserting
 * or moving a section writes ONE document instead of renumbering the page.
 * Pass null for `before` when inserting at the top, null for `after` at the end.
 */
export function orderBetween(before, after) {
  const a = typeof before === 'number' ? before : null;
  const b = typeof after === 'number' ? after : null;
  if (a === null && b === null) return 1000;
  if (a === null) return b - 1000;
  if (b === null) return a + 1000;
  return (a + b) / 2;
}

/** Sort helper — the single place page order is decided. */
export function sortSections(sections) {
  return [...sections].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

/**
 * Your existing documents contain duplicate order values (2, 1, 1, 4, 4),
 * which makes any swap-based reorder unstable. Run this once during migration
 * to spread them onto a clean scale; after that, `orderBetween` keeps them apart.
 */
export function renumber(sections, step = 1000) {
  return sortSections(sections).map((s, i) => ({ ...s, order: (i + 1) * step }));
}