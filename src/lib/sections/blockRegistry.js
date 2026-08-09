/**
 * BLOCK REGISTRY
 * src/lib/sections/blockRegistry.js
 *
 * The block types a custom section can contain. Each entry declares its
 * editable props, and the inspector is generated from that declaration
 * rather than hand-written per type.
 *
 * COLUMNS
 * `columns` is the one container type: it holds other blocks in `children`,
 * an array of arrays. Nesting is capped at ONE level — you cannot put columns
 * inside columns. That is a deliberate limit, not an oversight: nested grids
 * are where responsive layouts become impossible to reason about, and a
 * portfolio never needs them.
 *
 * PROP TYPES: text | textarea | markdown | select | number | toggle | image | link
 */

let counter = 0;
export function blockId() {
  return `b-${Date.now().toString(36)}-${(counter += 1).toString(36)}`;
}

const ALIGN_PROP = {
  key: 'align',
  label: 'Alignment',
  type: 'select',
  options: ['left', 'center', 'right'],
  default: 'left',
};

/**
 * Column layouts. Written as full class names because Tailwind scans source
 * text — an interpolated `md:grid-cols-${n}` produces no CSS at build time.
 */
export const COLUMN_LAYOUTS = {
  '1:1': { count: 2, label: 'Two equal', grid: 'md:grid-cols-2', spans: ['', ''] },
  '2:1': { count: 2, label: 'Wide + narrow', grid: 'md:grid-cols-3', spans: ['md:col-span-2', ''] },
  '1:2': { count: 2, label: 'Narrow + wide', grid: 'md:grid-cols-3', spans: ['', 'md:col-span-2'] },
  '1:1:1': { count: 3, label: 'Three equal', grid: 'md:grid-cols-3', spans: ['', '', ''] },
};

export const COLUMN_GAP = { sm: 'gap-4', md: 'gap-6 md:gap-8', lg: 'gap-8 md:gap-12' };
export const COLUMN_VALIGN = { top: 'items-start', center: 'items-center', bottom: 'items-end' };

export const BLOCKS = {
  heading: {
    label: 'Heading',
    description: 'A title within the section.',
    preview: (props) => props.text || 'Heading',
    props: [
      { key: 'text', label: 'Text', type: 'text', default: 'Heading' },
      {
        key: 'level', label: 'Size', type: 'select', options: [
          { value: 1, label: 'Large' }, { value: 2, label: 'Medium' }, { value: 3, label: 'Small' },
        ], default: 2
      },
      ALIGN_PROP,
    ],
  },

  richtext: {
    label: 'Text',
    description: 'A paragraph or more. Markdown is supported.',
    preview: (props) => (props.markdown || 'Empty text block').replace(/[#*_`>]/g, '').slice(0, 60),
    props: [
      {
        key: 'markdown', label: 'Content', type: 'markdown', default: '',
        help: '**bold**, _italic_, - lists, ### subheadings, [links](https://…)'
      },
      ALIGN_PROP,
    ],
  },

  image: {
    label: 'Image',
    description: 'A picture, with an optional caption.',
    preview: (props) => props.caption || props.alt || (props.src ? 'Image' : 'No image chosen'),
    props: [
      { key: 'src', label: 'Image', type: 'image', default: '' },
      {
        key: 'alt', label: 'Alt text', type: 'text', default: '',
        help: 'Describes the image for screen readers and when it fails to load.'
      },
      { key: 'aspect', label: 'Shape', type: 'select', options: ['16/9', '4/3', '1/1', '3/4'], default: '16/9' },
      { key: 'caption', label: 'Caption', type: 'text', default: '' },
      ALIGN_PROP,
    ],
  },

  quote: {
    label: 'Quote',
    description: 'A pull quote with attribution.',
    preview: (props) => props.text || 'Quote',
    props: [
      { key: 'text', label: 'Quote', type: 'textarea', default: '' },
      { key: 'attribution', label: 'Attribution', type: 'text', default: '' },
      ALIGN_PROP,
    ],
  },

  button: {
    label: 'Button',
    description: 'A link styled as a button.',
    preview: (props) => props.label || 'Button',
    props: [
      { key: 'label', label: 'Text', type: 'text', default: 'Learn more' },
      {
        key: 'href', label: 'Links to', type: 'link', default: '',
        help: 'An internal path like /contact, or a full https:// address.'
      },
      {
        key: 'variant', label: 'Style', type: 'select', options: [
          { value: 'solid', label: 'Solid' }, { value: 'outline', label: 'Outline' },
        ], default: 'solid'
      },
      ALIGN_PROP,
    ],
  },

  columns: {
    label: 'Columns',
    description: 'Place blocks side by side. Stacks on mobile.',
    container: true,
    preview: (props, block) => {
      const filled = (block?.children || []).map((c) => c.length);
      return `${COLUMN_LAYOUTS[props.layout]?.label || 'Two equal'} — ${filled.join(' / ')} block(s)`;
    },
    props: [
      {
        key: 'layout', label: 'Split', type: 'select',
        options: Object.entries(COLUMN_LAYOUTS).map(([value, v]) => ({ value, label: v.label })),
        default: '1:1'
      },
      { key: 'gap', label: 'Gap', type: 'select', options: ['sm', 'md', 'lg'], default: 'md' },
      { key: 'valign', label: 'Align', type: 'select', options: ['top', 'center', 'bottom'], default: 'top' },
      {
        key: 'stackOnMobile', label: 'Stack on mobile', type: 'toggle', default: true,
        help: 'Off keeps them side by side on phones — only sensible for small items.'
      },
    ],
  },

  divider: {
    label: 'Divider',
    description: 'A horizontal rule.',
    preview: () => 'Divider',
    props: [],
  },

  spacer: {
    label: 'Spacer',
    description: 'Empty vertical space.',
    preview: (props) => `${props.height || 32}px of space`,
    props: [
      { key: 'height', label: 'Height (px)', type: 'number', default: 32, min: 8, max: 200, step: 8 },
    ],
  },
};

export const BLOCK_KEYS = Object.keys(BLOCKS);

/** Block types allowed inside a column — everything except another container. */
export const NESTABLE_KEYS = BLOCK_KEYS.filter((k) => !BLOCKS[k].container);

export function getBlock(type) {
  return BLOCKS[type] || null;
}

export function isContainer(type) {
  return Boolean(getBlock(type)?.container);
}

export function defaultBlockProps(type) {
  const meta = getBlock(type);
  if (!meta) return {};
  const out = {};
  for (const prop of meta.props) out[prop.key] = prop.default;
  return out;
}

export function columnCount(layout) {
  return COLUMN_LAYOUTS[layout]?.count || 2;
}

export function createBlock(type) {
  const block = { id: blockId(), type, props: defaultBlockProps(type) };
  if (isContainer(type)) {
    block.children = Array.from({ length: columnCount(block.props.layout) }, () => []);
  }
  return block;
}

/**
 * Change how many columns a container has WITHOUT losing content.
 * Growing adds empty columns; shrinking appends the removed columns' blocks
 * onto the last surviving one rather than deleting them.
 */
export function resizeColumns(children = [], count) {
  const current = children.map((c) => (Array.isArray(c) ? c : []));

  if (current.length === count) return current;

  if (current.length < count) {
    return [...current, ...Array.from({ length: count - current.length }, () => [])];
  }

  const kept = current.slice(0, count);
  const dropped = current.slice(count).flat();
  if (dropped.length) kept[count - 1] = [...kept[count - 1], ...dropped];
  return kept;
}

/**
 * Fill in props added to the registry since the block was saved, drop props
 * that no longer exist, and recurse into columns. Blocks of an unknown type
 * are passed through untouched so a newer editor's block can't be destroyed
 * by an older client.
 */
export function reconcileBlock(block) {
  const meta = getBlock(block?.type);
  if (!meta) return block;

  const props = {};
  for (const prop of meta.props) {
    props[prop.key] = block.props && prop.key in block.props ? block.props[prop.key] : prop.default;
  }

  const next = { ...block, id: block.id || blockId(), props };

  if (meta.container) {
    const resized = resizeColumns(block.children, columnCount(props.layout));
    // One level only: strip any nested container that shouldn't be there.
    next.children = resized.map((column) =>
      column.filter((child) => !isContainer(child?.type)).map(reconcileBlock)
    );
  }

  return next;
}

export function describeBlock(block) {
  const meta = getBlock(block?.type);
  if (!meta) return { label: block?.type || 'Unknown', preview: '' };
  return {
    label: meta.label,
    preview: String(meta.preview(block.props || {}, block) || ''),
  };
}