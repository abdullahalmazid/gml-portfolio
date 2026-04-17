import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function MarkdownRenderer({ children }) {
  if (!children) return null;
  return (
    <ReactMarkdown 
      remarkPlugins={[remarkGfm]} 
      className="prose prose-sm max-w-none prose-headings:text-[var(--text-primary)] prose-a:text-[var(--accent)]"
      // Disallow <p> wrapping to help with nesting issues if needed
      components={{ p: 'div' }} 
    >
      {children}
    </ReactMarkdown>
  );
}