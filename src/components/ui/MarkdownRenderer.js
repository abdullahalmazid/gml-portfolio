import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

/**
 * Renders legacy markdown content.
 *
 * Two fixes from the previous version:
 *   - it mapped `p` to `div`, which put a <div> inside a <p> wherever this was
 *     used in a paragraph and broke hydration
 *   - it hardcoded `prose-sm` with no dark variant, so text was small
 *     everywhere and prose colours ignored dark themes
 *
 * Styling now comes from whatever wraps it (RichContent), so markdown and
 * rich-text content look identical.
 */
export default function MarkdownRenderer({ children }) {
  if (!children) return null;
  return <ReactMarkdown remarkPlugins={[remarkGfm]}>{children}</ReactMarkdown>;
}
