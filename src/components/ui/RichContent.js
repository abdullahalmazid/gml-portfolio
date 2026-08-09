'use client';
/**
 * RichContent
 * src/components/ui/RichContent.js
 *
 * Renders saved content on the public site. Handles BOTH formats:
 *
 *   - HTML, produced by the rich text editor
 *   - Markdown, everything written before the editor existed
 *
 * Detecting the format rather than migrating means old content keeps working
 * untouched, and each field converts to HTML the first time you edit and save
 * it. No migration script, no chance of mangling text that is already correct.
 *
 * Nothing from the editor is loaded here — visitors reading your site never
 * download Tiptap.
 */

import DOMPurify from 'isomorphic-dompurify';
import { useMemo } from 'react';
import MarkdownRenderer from './MarkdownRenderer';

/** Content is HTML if it contains a tag the editor would have produced. */
export function isHtmlContent(value) {
  if (!value || typeof value !== 'string') return false;
  return /<(p|h[1-6]|ul|ol|li|blockquote|strong|em|u|s|a|img|table|hr|pre|code|mark|div|span|br)\b[^>]*>/i.test(value);
}

const ALLOWED_TAGS = [
  'p', 'br', 'hr', 'div', 'span',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'strong', 'b', 'em', 'i', 'u', 's', 'mark', 'code', 'pre',
  'ul', 'ol', 'li', 'blockquote',
  'a', 'img',
  'table', 'thead', 'tbody', 'tr', 'th', 'td',
];

const ALLOWED_ATTR = [
  'href', 'target', 'rel', 'title',
  'src', 'alt', 'width', 'height',
  'class', 'style',
  'colspan', 'rowspan',
];

/**
 * Only you can write this content, so the risk is low — but sanitising also
 * strips the styling junk that comes with pasting from Word or a web page,
 * which is the more common problem in practice.
 */
export function sanitize(html) {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOW_DATA_ATTR: false,
  });
}

/**
 * Shared prose classes, so the editor and the live site look identical.
 *
 * Collapsed to a single space-separated line. React tolerates newlines and
 * indentation in className, but ProseMirror splits this string on single
 * spaces and feeds each token to classList.add — where an empty token throws
 * InvalidCharacterError.
 */
export const PROSE_CLASSES = normalizeClasses(`
  prose dark:prose-invert max-w-none
  text-[var(--text-secondary)]
  prose-headings:font-bold prose-headings:tracking-tight prose-headings:text-[var(--text-primary)]
  prose-p:leading-relaxed
  prose-a:text-[var(--accent)] prose-a:font-semibold prose-a:no-underline hover:prose-a:underline hover:prose-a:underline-offset-4
  prose-strong:text-[var(--text-primary)]
  prose-blockquote:border-l-4 prose-blockquote:border-[var(--accent)] prose-blockquote:bg-[var(--bg-secondary)]
  prose-blockquote:px-5 prose-blockquote:py-3 prose-blockquote:rounded-r-xl prose-blockquote:not-italic prose-blockquote:text-[var(--text-primary)]
  prose-code:text-[var(--accent)] prose-code:before:content-none prose-code:after:content-none
  prose-pre:bg-[var(--bg-tertiary)] prose-pre:text-[var(--text-primary)]
  prose-li:marker:text-[var(--accent)]
  prose-img:rounded-xl
  prose-hr:border-[var(--border)]
  prose-th:text-[var(--text-primary)]
`);

function normalizeClasses(value) {
  return value.replace(/\s+/g, ' ').trim();
}

export default function RichContent({ content, className = '', size = 'base' }) {
  const html = useMemo(
    () => (isHtmlContent(content) ? sanitize(content) : null),
    [content]
  );

  if (!content) return null;

  const sizeClass = { sm: 'prose-sm', base: '', lg: 'prose-lg' }[size] || '';

  if (html === null) {
    // Legacy markdown.
    return (
      <div className={`${PROSE_CLASSES} ${sizeClass} ${className}`}>
        <MarkdownRenderer>{content}</MarkdownRenderer>
      </div>
    );
  }

  return (
    <div
      className={`${PROSE_CLASSES} ${sizeClass} ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}