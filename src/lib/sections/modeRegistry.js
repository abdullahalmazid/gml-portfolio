/**
 * DISPLAY MODE REGISTRY
 * src/lib/sections/modeRegistry.js
 *
 * One entry per way of arranging a set of items. Adding a new layout later
 * means adding one entry here plus one renderer under
 * `components/sections/modes/` — nothing else in the system changes.
 *
 * Each entry declares:
 *   options       - the settings the mode accepts. The Layout tab of the
 *                   settings panel is generated from this; option types map
 *                   1:1 to inspector controls.
 *   roles         - which field roles the mode can actually render. Roles a
 *                   mode can't show are greyed out in the Content tab rather
 *                   than silently ignored.
 *   requiresImage - mode is only offered for collections that can produce images.
 *   minItems      - mode is only offered when at least this many items are shown.
 *
 * OPTION TYPES: select | number | toggle | color
 */

export const MODES = {
  list: {
    label: 'List',
    description: 'One item per row. Best for text-heavy content like papers.',
    roles: ['title', 'subtitle', 'meta', 'body', 'tags', 'image', 'link'],
    requiresImage: false,
    minItems: 1,
    options: [
      { key: 'columns',    label: 'Columns',      type: 'select', options: [1, 2],                    default: 1 },
      { key: 'thumbnail',  label: 'Thumbnail',    type: 'select', options: ['none', 'left', 'right'], default: 'left' },
      { key: 'dividers',   label: 'Dividers',     type: 'toggle', default: true },
      { key: 'showIndex',  label: 'Number items', type: 'toggle', default: false },
      { key: 'bodyLines',  label: 'Body lines',   type: 'number', default: 2, min: 0, max: 10 },
    ],
  },

  grid: {
    label: 'Grid',
    description: 'Equal cards in a responsive grid.',
    roles: ['title', 'subtitle', 'meta', 'body', 'tags', 'image', 'link'],
    requiresImage: false,
    minItems: 2,
    options: [
      { key: 'columns',   label: 'Columns',      type: 'select', options: [2, 3, 4],                        default: 3 },
      { key: 'aspect',    label: 'Image ratio',  type: 'select', options: ['4/3', '16/9', '1/1', '3/4'],    default: '4/3' },
      { key: 'gap',       label: 'Gap',          type: 'select', options: ['sm', 'md', 'lg'],               default: 'md' },
      { key: 'cardStyle', label: 'Card style',   type: 'select', options: ['elevated', 'outlined', 'flat'], default: 'elevated' },
      { key: 'bodyLines', label: 'Body lines',   type: 'number', default: 3, min: 0, max: 10 },
    ],
  },

  timeline: {
    label: 'Timeline',
    description: 'A vertical spine with markers. Suits papers, roles and degrees.',
    roles: ['title', 'subtitle', 'meta', 'body', 'tags', 'image', 'link'],
    requiresImage: false,
    minItems: 2,
    options: [
      { key: 'side',       label: 'Layout',      type: 'select', options: ['left', 'alternating'], default: 'left' },
      { key: 'markerField', label: 'Marker text', type: 'field', role: 'meta', default: null,
        help: 'Which field labels each point on the spine — usually Year or Duration.' },
      { key: 'connector',  label: 'Connector',   type: 'select', options: ['solid', 'dashed'], default: 'solid' },
      { key: 'bodyLines',  label: 'Body lines',  type: 'number', default: 2, min: 0, max: 10 },
    ],
  },

  mosaic: {
    label: 'Mosaic',
    description: 'Masonry tiles of varying height. Image-first.',
    roles: ['title', 'image', 'link'],
    requiresImage: true,
    minItems: 3,
    options: [
      { key: 'columns',    label: 'Columns',       type: 'select', options: [2, 3, 4],            default: 3 },
      { key: 'gap',        label: 'Gap',           type: 'select', options: ['none', 'sm', 'md'], default: 'sm' },
      { key: 'captionOn',  label: 'Caption',       type: 'select', options: ['hover', 'always', 'never'], default: 'hover' },
    ],
  },

  hscroll: {
    label: 'Horizontal scroll',
    description: 'A swipeable strip. Good for many images on a narrow page.',
    roles: ['title', 'meta', 'image', 'link'],
    requiresImage: true,
    minItems: 3,
    options: [
      { key: 'cardWidth', label: 'Card width', type: 'select', options: ['sm', 'md', 'lg'],       default: 'md' },
      { key: 'aspect',    label: 'Image ratio', type: 'select', options: ['4/3', '16/9', '1/1'],  default: '4/3' },
      { key: 'snap',      label: 'Snap scroll', type: 'toggle', default: true },
      { key: 'arrows',    label: 'Show arrows', type: 'toggle', default: true },
    ],
  },

  carousel: {
    label: 'Carousel',
    description: 'One item at a time with a crossfade and progress bars.',
    roles: ['title', 'subtitle', 'meta', 'body', 'tags', 'image', 'link'],
    requiresImage: true,
    minItems: 1,
    options: [
      { key: 'autoplay',  label: 'Autoplay',     type: 'toggle', default: true },
      { key: 'interval',  label: 'Seconds',      type: 'number', default: 5, min: 2, max: 20 },
      { key: 'textSide',  label: 'Text side',    type: 'select', options: ['left', 'right'], default: 'left' },
      { key: 'indicators', label: 'Progress bars', type: 'toggle', default: true },
    ],
  },

  featured: {
    label: 'Featured + list',
    description: 'One large item, the rest compact beneath it.',
    roles: ['title', 'subtitle', 'meta', 'body', 'tags', 'image', 'link'],
    requiresImage: false,
    minItems: 2,
    options: [
      { key: 'featuredSide', label: 'Feature side', type: 'select', options: ['left', 'right', 'top'], default: 'left' },
      { key: 'restLayout',   label: 'Remaining as', type: 'select', options: ['list', 'grid'],         default: 'list' },
      { key: 'bodyLines',    label: 'Body lines',   type: 'number', default: 3, min: 0, max: 10 },
    ],
  },

  split: {
    label: 'Split',
    description: 'A single item as image on one side, text on the other.',
    roles: ['title', 'subtitle', 'meta', 'body', 'tags', 'image', 'link'],
    requiresImage: true,
    minItems: 1,
    options: [
      { key: 'imageSide', label: 'Image side',  type: 'select', options: ['left', 'right'],             default: 'right' },
      { key: 'aspect',    label: 'Image ratio', type: 'select', options: ['4/3', '16/9', '1/1', '3/4'], default: '4/3' },
      { key: 'glow',      label: 'Accent glow', type: 'toggle', default: true },
    ],
  },

  compact: {
    label: 'Compact',
    description: 'Dense numbered lines. Citation-style, no images.',
    roles: ['title', 'subtitle', 'meta', 'link'],
    requiresImage: false,
    minItems: 2,
    options: [
      { key: 'columns',   label: 'Columns',      type: 'select', options: [1, 2], default: 1 },
      { key: 'showIndex', label: 'Number items', type: 'toggle', default: true },
      { key: 'separator', label: 'Meta separator', type: 'select', options: ['dot', 'pipe', 'comma'], default: 'dot' },
    ],
  },
};

export const MODE_KEYS = Object.keys(MODES);

export function getMode(key) {
  return MODES[key] || null;
}

/** Default options object for a mode, straight from its declared defaults. */
export function defaultModeOptions(key) {
  const mode = getMode(key);
  if (!mode) return {};
  const out = {};
  for (const opt of mode.options) out[opt.key] = opt.default;
  return out;
}

/**
 * Reconcile stored options against the registry, so options added since the
 * section was saved get their default instead of coming back undefined.
 */
export function reconcileModeOptions(key, stored = {}) {
  const mode = getMode(key);
  if (!mode) return {};
  const out = {};
  for (const opt of mode.options) {
    out[opt.key] = opt.key in stored ? stored[opt.key] : opt.default;
  }
  return out;
}

/** Can this mode render this field role? Drives greying-out in the Content tab. */
export function modeSupportsRole(key, role) {
  return Boolean(getMode(key)?.roles.includes(role));
}

/**
 * Which modes to offer for a given collection and item count.
 * `hasImages` comes from the field registry so the two stay in sync.
 */
export function availableModes({ hasImages = true, itemCount = 3 } = {}) {
  return MODE_KEYS.filter((key) => {
    const mode = MODES[key];
    if (mode.requiresImage && !hasImages) return false;
    if (itemCount < mode.minItems) return false;
    return true;
  });
}

/** Sensible starting mode when a collection is first chosen. */
export function suggestMode(collectionName) {
  switch (collectionName) {
    case 'gallery':      return 'mosaic';
    case 'publications': return 'list';
    case 'projects':     return 'carousel';
    case 'experience':   return 'timeline';
    case 'education':    return 'timeline';
    case 'blogs':        return 'grid';
    default:             return 'grid';
  }
}
