/**
 * FIELD REGISTRY
 * src/lib/sections/fieldRegistry.js
 *
 * One entry per Firestore content collection, declaring which fields exist and
 * what each field *means*. Two things depend on this:
 *
 *   1. The settings panel builds its field toggles from here automatically.
 *      Add a field to a collection -> it becomes toggleable. No admin UI edits.
 *
 *   2. Display modes render by ROLE, not by field name. A mode asks for "the
 *      title role" and "the meta roles" instead of knowing that publications
 *      call it `journal` and experience calls it `company`. That is what lets
 *      one mode work across every collection.
 *
 * ROLES
 *   title    - the headline (exactly one per collection)
 *   subtitle - secondary headline
 *   meta     - short supporting facts (year, duration, company, tech)
 *   body     - long prose, usually truncated in a section
 *   image    - an image URL
 *   link     - an external destination
 *   tags     - comma string or array, rendered as chips
 */

export const COLLECTIONS = {
  publications: {
    label: 'Publications',
    singular: 'Paper',
    route: '/publications',
    // Projects have no image of their own; see `imageFrom` below.
    imageFrom: null,
    defaultSort: 'newest',
    fields: [
      { key: 'title', label: 'Title', role: 'title', type: 'text', default: true },
      { key: 'authors', label: 'Authors', role: 'meta', type: 'text', default: true, truncatable: true },
      { key: 'journal', label: 'Venue / Journal', role: 'meta', type: 'text', default: true, truncatable: true },
      { key: 'year', label: 'Year', role: 'meta', type: 'text', default: true },
      { key: 'abstract', label: 'Abstract', role: 'body', type: 'richtext', default: false, truncatable: true },
      { key: 'link', label: 'DOI / Link', role: 'link', type: 'link', default: false },
    ],
  },

  projects: {
    label: 'Projects',
    singular: 'Project',
    route: '/projects',
    // A project's own cover image comes first; any gallery images linked by
    // relatedProjectId follow it. useSectionItems merges the two.
    imageFrom: {
      self: 'imageUrl',
      collection: 'gallery',
      matchField: 'relatedProjectId',
      imageField: 'imageUrl',
    },
    defaultSort: 'newest',
    fields: [
      { key: 'title', label: 'Title', role: 'title', type: 'text', default: true },
      { key: 'imageUrl', label: 'Cover image', role: 'image', type: 'image', default: true },
      { key: 'description', label: 'Short description', role: 'body', type: 'text', default: true, truncatable: true },
      { key: 'tech', label: 'Tech / Tags', role: 'tags', type: 'tags', default: true },
      { key: 'details', label: 'Full details', role: 'body', type: 'richtext', default: false, truncatable: true },
      { key: 'github', label: 'GitHub link', role: 'link', type: 'link', default: false },
      { key: 'live', label: 'Live link', role: 'link', type: 'link', default: false },
    ],
  },

  gallery: {
    label: 'Gallery',
    singular: 'Image',
    route: '/gallery',
    imageFrom: 'self',
    defaultSort: 'newest',
    fields: [
      { key: 'imageUrl', label: 'Image', role: 'image', type: 'image', default: true, locked: true },
      { key: 'title', label: 'Caption', role: 'title', type: 'text', default: true },
      { key: 'description', label: 'Description', role: 'body', type: 'richtext', default: false, truncatable: true },
      { key: 'relatedProjectId', label: 'Related project', role: 'meta', type: 'ref', default: false },
    ],
  },

  experience: {
    label: 'Experience',
    singular: 'Role',
    route: '/experience',
    imageFrom: null,
    defaultSort: 'newest',
    fields: [
      { key: 'role', label: 'Role', role: 'title', type: 'text', default: true },
      { key: 'company', label: 'Company', role: 'subtitle', type: 'text', default: true },
      { key: 'duration', label: 'Duration', role: 'meta', type: 'text', default: true },
      { key: 'description', label: 'Description', role: 'body', type: 'richtext', default: true, truncatable: true },
    ],
  },

  education: {
    label: 'Education',
    singular: 'Degree',
    route: '/education',
    imageFrom: 'self',
    defaultSort: 'newest',
    fields: [
      { key: 'title', label: 'Degree', role: 'title', type: 'text', default: true },
      { key: 'institution', label: 'Institution', role: 'subtitle', type: 'text', default: true },
      { key: 'duration', label: 'Duration', role: 'meta', type: 'text', default: true },
      { key: 'location', label: 'Location', role: 'meta', type: 'text', default: false },
      { key: 'type', label: 'Level', role: 'meta', type: 'text', default: false },
      { key: 'cgpa', label: 'CGPA', role: 'meta', type: 'text', default: false },
      { key: 'logoUrl', label: 'Logo', role: 'image', type: 'image', default: true },
      { key: 'description', label: 'Description', role: 'body', type: 'richtext', default: false, truncatable: true },
    ],
  },

  blogs: {
    label: 'Blog',
    singular: 'Post',
    route: '/blog',
    imageFrom: 'self',
    defaultSort: 'newest',
    fields: [
      { key: 'title', label: 'Title', role: 'title', type: 'text', default: true },
      { key: 'excerpt', label: 'Excerpt', role: 'body', type: 'text', default: true, truncatable: true },
      { key: 'author', label: 'Author', role: 'meta', type: 'text', default: false },
      { key: 'date', label: 'Date', role: 'meta', type: 'text', default: true },
      { key: 'readTime', label: 'Read time', role: 'meta', type: 'text', default: true },
      { key: 'tags', label: 'Tags', role: 'tags', type: 'tags', default: false },
      { key: 'coverImage', label: 'Cover image', role: 'image', type: 'image', default: true },
      { key: 'content', label: 'Full content', role: 'body', type: 'richtext', default: false, truncatable: true },
    ],
  },
};

/** Collection keys, in the order the wizard should offer them. */
export const COLLECTION_KEYS = Object.keys(COLLECTIONS);

export function getCollection(name) {
  return COLLECTIONS[name] || null;
}

export function getFields(name) {
  return COLLECTIONS[name]?.fields || [];
}

export function getField(name, key) {
  return getFields(name).find((f) => f.key === key) || null;
}

/** Fields carrying a given role, e.g. every `meta` field on publications. */
export function getFieldsByRole(name, role) {
  return getFields(name).filter((f) => f.role === role);
}

/** The single field acting as the headline, used for sorting and fallbacks. */
export function getTitleField(name) {
  return getFieldsByRole(name, 'title')[0]?.key || 'title';
}

/** Whether this collection can produce an image at all. */
export function hasImages(name) {
  return Boolean(COLLECTIONS[name]?.imageFrom);
}

/**
 * The default `fields` object for a new section: every field flagged
 * `default: true` switched on, everything else off.
 */
export function defaultFieldVisibility(name) {
  const visible = {};
  for (const f of getFields(name)) visible[f.key] = Boolean(f.default);
  return visible;
}

/**
 * Reconcile stored visibility against the registry. Fields added to the
 * registry since the section was saved appear with their default; fields
 * removed from the registry are dropped. Keeps old sections from breaking.
 */
export function reconcileFieldVisibility(name, stored = {}) {
  const merged = {};
  for (const f of getFields(name)) {
    merged[f.key] = f.key in stored ? Boolean(stored[f.key]) : Boolean(f.default);
    if (f.locked) merged[f.key] = true;
  }
  return merged;
}

/** Visible field descriptors for a section, in registry order. */
export function visibleFields(name, visibility = {}) {
  return getFields(name).filter((f) => visibility[f.key]);
}

/** Visible fields of one role — how modes ask for what they need. */
export function visibleFieldsByRole(name, visibility, role) {
  return visibleFields(name, visibility).filter((f) => f.role === role);
}