/**
 * TEMPLATE REGISTRY
 * src/lib/sections/templateRegistry.js
 *
 * Presets for custom sections. A template is not code — it is a starting set
 * of blocks plus shell defaults, so adding one is adding one entry here.
 *
 * Scope note: these are built from the block types CustomSection renders today
 * (heading, richtext, image, quote, button, divider, spacer). Templates that
 * need side-by-side columns or card rows arrive with the block canvas, since
 * there is no honest way to express them until multi-column blocks exist.
 *
 * `blocks()` is a function so every insert gets fresh block ids.
 */

let counter = 0;
const uid = (prefix) => `${prefix}-${Date.now().toString(36)}-${(counter += 1).toString(36)}`;

export const INTENTS = {
  writing: 'Writing',
  highlight: 'Highlight',
  media: 'Media',
  action: 'Action',
  structure: 'Structure',
};

export const TEMPLATES = {
  blank: {
    label: 'Blank',
    intent: 'structure',
    description: 'An empty section to build up yourself.',
    shell: { title: '', padding: 'lg' },
    blocks: () => [],
  },

  'rich-text': {
    label: 'Heading + text',
    intent: 'writing',
    description: 'A title and a block of formatted text. The everyday one.',
    shell: { title: 'Section title', padding: 'lg' },
    blocks: () => [
      { id: uid('b'), type: 'richtext', props: { markdown: 'Write your text here. **Bold**, _italic_, [links](https://example.com) and lists all work.' } },
    ],
  },

  'big-statement': {
    label: 'Big statement',
    intent: 'highlight',
    description: 'One large line with a short supporting sentence.',
    shell: { title: '', titleAlign: 'center', padding: 'xl', bgColor: 'var(--bg-secondary)' },
    blocks: () => [
      { id: uid('b'), type: 'heading', props: { text: 'A short, memorable statement.', level: 1, align: 'center' } },
      { id: uid('b'), type: 'richtext', props: { markdown: 'One or two sentences of supporting detail.', align: 'center' } },
    ],
  },

  quote: {
    label: 'Quote',
    intent: 'highlight',
    description: 'A pull quote with attribution.',
    shell: { title: '', padding: 'lg' },
    blocks: () => [
      { id: uid('b'), type: 'quote', props: { text: 'Something worth quoting.', attribution: 'Name, Role' } },
    ],
  },

  'image-caption': {
    label: 'Image + caption',
    intent: 'media',
    description: 'A single wide image with a caption underneath.',
    shell: { title: '', padding: 'lg', width: 'wide' },
    blocks: () => [
      { id: uid('b'), type: 'image', props: { src: '', alt: '', aspect: '16/9', caption: 'Caption text' } },
    ],
  },

  'text-then-image': {
    label: 'Text then image',
    intent: 'media',
    description: 'A written intro followed by a supporting image.',
    shell: { title: 'Section title', padding: 'lg' },
    blocks: () => [
      { id: uid('b'), type: 'richtext', props: { markdown: 'Introduce what the image shows.' } },
      { id: uid('b'), type: 'image', props: { src: '', alt: '', aspect: '16/9' } },
    ],
  },

  'call-to-action': {
    label: 'Call to action',
    intent: 'action',
    description: 'A prompt and a button. Good at the end of a page.',
    shell: { title: '', titleAlign: 'center', padding: 'lg', bgColor: 'var(--accent-light)' },
    blocks: () => [
      { id: uid('b'), type: 'heading', props: { text: 'Want to work together?', level: 2, align: 'center' } },
      { id: uid('b'), type: 'richtext', props: { markdown: 'A sentence explaining what happens next.', align: 'center' } },
      { id: uid('b'), type: 'button', props: { label: 'Get in touch', href: '/contact', align: 'center' } },
    ],
  },

  'list-points': {
    label: 'Bulleted points',
    intent: 'writing',
    description: 'A heading and a bulleted list — skills, services, takeaways.',
    shell: { title: 'What I work on', padding: 'lg' },
    blocks: () => [
      { id: uid('b'), type: 'richtext', props: { markdown: '- First point\n- Second point\n- Third point' } },
    ],
  },

  faq: {
    label: 'Questions and answers',
    intent: 'writing',
    description: 'Repeated question-and-answer pairs.',
    shell: { title: 'Frequently asked', padding: 'lg', width: 'narrow' },
    blocks: () => [
      { id: uid('b'), type: 'richtext', props: { markdown: '### First question?\nThe answer.\n\n### Second question?\nThe answer.' } },
    ],
  },

  'intro-with-button': {
    label: 'Intro + button',
    intent: 'action',
    description: 'A short introduction that links somewhere else.',
    shell: { title: 'About this', padding: 'lg' },
    blocks: () => [
      { id: uid('b'), type: 'richtext', props: { markdown: 'A paragraph of context.' } },
      { id: uid('b'), type: 'button', props: { label: 'Read more', href: '/about', variant: 'outline' } },
    ],
  },

  separator: {
    label: 'Divider',
    intent: 'structure',
    description: 'A thin rule with breathing room. Splits a long page.',
    shell: { title: '', padding: 'sm' },
    blocks: () => [
      { id: uid('b'), type: 'divider', props: {} },
    ],
  },

  spacer: {
    label: 'Spacer',
    intent: 'structure',
    description: 'Empty vertical space between two sections.',
    shell: { title: '', padding: 'sm' },
    blocks: () => [
      { id: uid('b'), type: 'spacer', props: { height: 64 } },
    ],
  },
};

export const TEMPLATE_KEYS = Object.keys(TEMPLATES);

export function getTemplate(key) {
  return TEMPLATES[key] || null;
}

/** Templates grouped by intent, for the gallery's filter tabs. */
export function templatesByIntent() {
  return TEMPLATE_KEYS.reduce((acc, key) => {
    const intent = TEMPLATES[key].intent;
    (acc[intent] ||= []).push({ key, ...TEMPLATES[key] });
    return acc;
  }, {});
}

/** Fresh blocks and shell overrides for a template. */
export function instantiate(key) {
  const template = getTemplate(key) || TEMPLATES.blank;
  return {
    template: key,
    blocks: template.blocks(),
    shell: template.shell || {},
  };
}
