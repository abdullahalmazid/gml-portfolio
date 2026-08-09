/**
 * Sanitize HTML
 * src/lib/sanitize-html.js
 *
 * Cleans stored rich-text HTML before rendering.
 *
 * Written by hand rather than using DOMPurify because the isomorphic build
 * pulls in jsdom, and jsdom's dependency chain uses ESM in a way Vercel's Node
 * runtime cannot `require()` — it works locally and throws ERR_REQUIRE_ESM in
 * the deployed function. This has no dependencies and behaves identically on
 * the server and in the browser, so server and client markup always match.
 *
 * THREAT MODEL, stated plainly: only the authenticated site owner can write
 * this content. This is not defending against a hostile author — it strips
 * scripts, event handlers and dangerous URLs, and removes the styling junk
 * that arrives when pasting from Word or a web page. A regex-based cleaner
 * would not be sufficient if untrusted users could submit HTML; if you ever
 * allow that, switch to a real parser-based sanitizer on the server.
 */

const ALLOWED_TAGS = new Set([
  'p', 'br', 'hr', 'div', 'span',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'strong', 'b', 'em', 'i', 'u', 's', 'mark', 'code', 'pre',
  'ul', 'ol', 'li', 'blockquote',
  'a', 'img',
  'table', 'thead', 'tbody', 'tr', 'th', 'td',
]);

const ALLOWED_ATTRS = new Set([
  'href', 'target', 'rel', 'title',
  'src', 'alt', 'width', 'height',
  'class', 'style',
  'colspan', 'rowspan',
]);

// Elements whose CONTENT must go too, not just their tags.
const STRIP_WITH_CONTENT = /<(script|style|iframe|object|embed|noscript|template)\b[\s\S]*?<\/\1\s*>/gi;

const DANGEROUS_URL = /^\s*(javascript|vbscript|file):/i;

/** Only allow inline styles the editor itself produces. */
const SAFE_STYLE = /^(text-align|font-style|font-weight|text-decoration)\s*:\s*[a-z- ]+$/i;

function cleanStyle(value) {
  return value
    .split(';')
    .map((d) => d.trim())
    .filter((d) => d && SAFE_STYLE.test(d))
    .join('; ');
}

function cleanAttributes(raw) {
  const out = [];
  const attr = /([a-zA-Z-]+)(?:\s*=\s*("[^"]*"|'[^']*'|[^\s>]+))?/g;
  let m;

  while ((m = attr.exec(raw))) {
    const name = m[1].toLowerCase();
    let value = m[2] || '';
    if (value.startsWith('"') || value.startsWith("'")) value = value.slice(1, -1);

    // Event handlers, in every form.
    if (name.startsWith('on')) continue;
    if (!ALLOWED_ATTRS.has(name)) continue;

    if ((name === 'href' || name === 'src') && DANGEROUS_URL.test(value)) continue;

    // data: URLs are a common injection vector; images are the safe exception.
    if (name === 'src' && /^\s*data:/i.test(value) && !/^\s*data:image\//i.test(value)) continue;

    if (name === 'style') {
      const style = cleanStyle(value);
      if (style) out.push(`style="${style}"`);
      continue;
    }

    out.push(value ? `${name}="${value.replace(/"/g, '&quot;')}"` : name);
  }

  return out.length ? ` ${out.join(' ')}` : '';
}

export function sanitizeHtml(input) {
  if (!input || typeof input !== 'string') return '';

  let html = input.replace(STRIP_WITH_CONTENT, '');
  html = html.replace(/<!--[\s\S]*?-->/g, '');

  html = html.replace(/<\s*(\/)?\s*([a-zA-Z][a-zA-Z0-9]*)((?:[^>"']|"[^"]*"|'[^']*')*)>/g,
    (match, closing, tagName, attrs) => {
      const tag = tagName.toLowerCase();
      if (!ALLOWED_TAGS.has(tag)) return '';        // drop the tag, keep its text
      if (closing) return `</${tag}>`;

      const selfClosing = /\/\s*$/.test(attrs);
      const cleaned = cleanAttributes(attrs.replace(/\/\s*$/, ''));

      // Links opening in a new tab need rel, or the new page can reach back
      // through window.opener.
      const rel = tag === 'a' && /target\s*=/.test(cleaned) && !/rel\s*=/.test(cleaned)
        ? ' rel="noopener noreferrer"'
        : '';

      return `<${tag}${cleaned}${rel}${selfClosing || tag === 'br' || tag === 'hr' || tag === 'img' ? ' /' : ''}>`;
    });

  // Anything that survived and still looks like a stray tag opener.
  html = html.replace(/<\s*[a-zA-Z][^>]*$/g, '');

  return html;
}

export default sanitizeHtml;
