'use client';
/**
 * ItemFields
 * src/components/sections/ItemFields.js
 *
 * Resolves one document into the pieces a display mode renders, and provides
 * the small presentational components for each piece.
 *
 * This is what lets a single mode work across every collection. A mode asks
 * for "the title" and "the meta line"; it never learns that experience calls
 * its headline `role` while publications call it `title`. Field visibility,
 * per-item overrides and role support are all resolved here, once.
 */

import {
  getCollection,
  visibleFields,
} from '@/lib/sections/fieldRegistry';
import { modeSupportsRole } from '@/lib/sections/modeRegistry';
import { ExternalLink } from 'lucide-react';

/* ------------------------------------------------------------------ */
/* Resolution                                                          */
/* ------------------------------------------------------------------ */

/** Strip light markdown so previews don't show raw ** and ## characters. */
export function toPlainText(value) {
  if (!value) return '';
  return String(value)
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')     // images
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')  // links -> label
    .replace(/[*_`>#]/g, '')                  // emphasis, code, quotes, headings
    .replace(/\s+/g, ' ')
    .trim();
}

/** Tags arrive as "IoT, PHP, SQL" or as an array. Normalise to an array. */
export function toTagList(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.map((v) => String(v).trim()).filter(Boolean);
  return String(value).split(',').map((v) => v.trim()).filter(Boolean);
}

/** Link to the item's own detail page. */
export function itemHref(collectionName, item) {
  const route = getCollection(collectionName)?.route;
  return route && item?.id ? `${route}/${item.id}` : null;
}

/**
 * Which fields are visible for THIS item: section-wide visibility, narrowed by
 * any per-item override, then narrowed again by what the mode can render.
 */
function effectiveVisibility(collectionName, item, section) {
  const base = section?.fields || {};
  const override = item?.__fieldOverrides;
  const merged = override ? { ...base, ...override } : base;

  const mode = section?.display?.mode;
  if (!mode) return merged;

  const out = {};
  for (const field of getCollection(collectionName)?.fields || []) {
    out[field.key] = Boolean(merged[field.key]) && modeSupportsRole(mode, field.role);
  }
  return out;
}

/**
 * Turn a document into render-ready parts.
 *
 * Returns:
 *   title     string
 *   subtitle  string
 *   metas     [{ key, label, value }]
 *   body      string (plain text, ready to clamp)
 *   tags      [string]
 *   links     [{ key, label, href }]
 *   image     url or null
 *   images    [url]
 *   href      detail page link
 *   featured  bool
 */
export function resolveItem(collectionName, item, section) {
  const meta = getCollection(collectionName);
  if (!meta || !item) {
    return { title: '', subtitle: '', metas: [], body: '', tags: [], links: [], image: null, images: [], href: null, featured: false };
  }

  const visibility = effectiveVisibility(collectionName, item, section);
  const fields = visibleFields(collectionName, visibility);

  const parts = {
    title: '',
    subtitle: '',
    metas: [],
    body: '',
    tags: [],
    links: [],
    image: item.__image || null,
    images: item.__images || [],
    href: itemHref(collectionName, item),
    featured: Boolean(item.__featured),
  };

  for (const field of fields) {
    const raw = item[field.key];
    if (raw === undefined || raw === null || raw === '') continue;

    switch (field.role) {
      case 'title':
        if (!parts.title) parts.title = String(raw);
        break;
      case 'subtitle':
        if (!parts.subtitle) parts.subtitle = String(raw);
        break;
      case 'meta':
        parts.metas.push({ key: field.key, label: field.label, value: String(raw) });
        break;
      case 'body':
        // First visible body field wins; later ones would duplicate the card.
        if (!parts.body) parts.body = toPlainText(raw);
        break;
      case 'tags':
        parts.tags.push(...toTagList(raw));
        break;
      case 'link':
        parts.links.push({ key: field.key, label: field.label, href: normalizeHref(String(raw)) });
        break;
      case 'image':
        if (!parts.image) {
          parts.image = String(raw);
          if (!parts.images.length) parts.images = [String(raw)];
        }
        break;
      default:
        break;
    }
  }

  // Never render a completely nameless item.
  if (!parts.title) parts.title = String(item.title || item.role || item.company || 'Untitled');

  return parts;
}

/** DOIs are stored bare ("10.1234/xyz") as well as as full URLs. */
function normalizeHref(value) {
  const v = value.trim();
  if (!v || v === '#') return null;
  if (/^https?:\/\//i.test(v)) return v;
  if (/^10\.\d{4,}/.test(v)) return `https://doi.org/${v}`;
  if (v.startsWith('/')) return v;
  return `https://${v}`;
}

/* ------------------------------------------------------------------ */
/* Presentational pieces                                               */
/* ------------------------------------------------------------------ */

const CLAMP = {
  0: '',
  1: 'line-clamp-1',
  2: 'line-clamp-2',
  3: 'line-clamp-3',
  4: 'line-clamp-4',
  5: 'line-clamp-5',
  6: 'line-clamp-6',
};

export function ItemTitle({ children, as: Tag = 'h3', size = 'md', className = '' }) {
  const sizes = {
    sm: 'text-base',
    md: 'text-lg md:text-xl',
    lg: 'text-2xl md:text-3xl',
    xl: 'text-3xl md:text-4xl',
  };
  return (
    <Tag className={`font-bold tracking-tight leading-tight text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors ${sizes[size]} ${className}`}>
      {children}
    </Tag>
  );
}

export function ItemSubtitle({ children, className = '' }) {
  if (!children) return null;
  return (
    <p className={`text-[var(--accent)] font-bold tracking-wider uppercase text-[10px] md:text-xs mt-1 ${className}`}>
      {children}
    </p>
  );
}

const SEPARATORS = { dot: '•', pipe: '|', comma: ',' };

export function ItemMeta({ metas = [], separator = 'dot', className = '' }) {
  if (!metas.length) return null;
  const sep = SEPARATORS[separator] || SEPARATORS.dot;
  return (
    <p className={`text-[var(--text-secondary)] text-xs font-medium mt-1.5 leading-relaxed ${className}`}>
      {metas.map((m, i) => (
        <span key={m.key}>
          {i > 0 && <span className="opacity-40 mx-1.5">{sep}</span>}
          {m.value}
        </span>
      ))}
    </p>
  );
}

export function ItemBody({ children, lines = 3, className = '' }) {
  if (!children || lines === 0) return null;
  return (
    <p className={`text-[var(--text-secondary)] text-sm leading-relaxed mt-2.5 ${CLAMP[lines] || ''} ${className}`}>
      {children}
    </p>
  );
}

export function ItemTags({ tags = [], max = 4, className = '' }) {
  if (!tags.length) return null;
  const shown = tags.slice(0, max);
  const extra = tags.length - shown.length;
  return (
    <div className={`flex flex-wrap gap-1.5 mt-3 ${className}`}>
      {shown.map((tag) => (
        <span
          key={tag}
          className="px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide bg-[var(--accent)]/10 text-[var(--accent)]"
        >
          {tag}
        </span>
      ))}
      {extra > 0 && (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold text-[var(--text-secondary)]">
          +{extra}
        </span>
      )}
    </div>
  );
}

export function ItemLinks({ links = [], className = '' }) {
  const valid = links.filter((l) => l.href);
  if (!valid.length) return null;
  return (
    <div className={`flex flex-wrap gap-3 mt-3 ${className}`}>
      {valid.map((link) => (
        <a
          key={link.key}
          href={link.href}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--accent)] hover:underline underline-offset-4"
        >
          {link.label}
          <ExternalLink size={12} />
        </a>
      ))}
    </div>
  );
}

/**
 * The standard text stack: title, subtitle, meta, body, tags, links.
 * List, grid, timeline and featured modes all use this, which is why their
 * typography stays consistent without any duplicated markup.
 */
export function ItemContent({
  parts,
  titleAs = 'h3',
  titleSize = 'md',
  bodyLines = 3,
  separator = 'dot',
  showTags = true,
  showLinks = true,
  className = '',
}) {
  return (
    <div className={className}>
      <ItemTitle as={titleAs} size={titleSize}>{parts.title}</ItemTitle>
      <ItemSubtitle>{parts.subtitle}</ItemSubtitle>
      <ItemMeta metas={parts.metas} separator={separator} />
      <ItemBody lines={bodyLines}>{parts.body}</ItemBody>
      {showTags && <ItemTags tags={parts.tags} />}
      {showLinks && <ItemLinks links={parts.links} />}
    </div>
  );
}
