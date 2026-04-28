'use client';
import { db } from '@/lib/firebase';
import { collection, doc, getDoc, getDocs, limit, query, where } from 'firebase/firestore';
import {
    ArrowLeft, ArrowUp, Calendar,
    Check,
    Clock,
    Copy,
    Facebook,
    Twitter
} from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

// ─── Reading Progress Bar ─────────────────────────────────────────────────────
function ReadingProgress() {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const onScroll = () => {
      const el = document.documentElement;
      const scrolled = el.scrollTop;
      const total = el.scrollHeight - el.clientHeight;
      setProgress(total > 0 ? (scrolled / total) * 100 : 0);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-[2px] bg-[var(--border)]">
      <div
        className="h-full bg-[var(--accent)] transition-all duration-100"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}

// ─── Table of Contents ────────────────────────────────────────────────────────
function TableOfContents({ headings, activeId }) {
  if (!headings.length) return null;
  return (
    <nav className="sticky top-24">
      <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-3">On this page</p>
      <ul className="space-y-1">
        {headings.map(h => (
          <li key={h.id}>
            <a
              href={`#${h.id}`}
              className={`
                block text-xs leading-relaxed py-0.5 transition-colors duration-150
                ${h.level === 3 ? 'pl-3' : ''}
                ${activeId === h.id
                  ? 'text-[var(--accent)] font-medium'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
                }
              `}
            >
              {h.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

// ─── Share Button ─────────────────────────────────────────────────────────────
function ShareButtons({ title }) {
  const [copied, setCopied] = useState(false);
  const url = typeof window !== 'undefined' ? window.location.href : '';

  const copy = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-[var(--text-muted)] mr-1">Share</span>
      <a
        href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`}
        target="_blank" rel="noreferrer"
        className="w-8 h-8 rounded-full border border-[var(--border)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--text-primary)] transition-colors"
      >
        <Twitter size={13} />
      </a>
      <a
        href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`}
        target="_blank" rel="noreferrer"
        className="w-8 h-8 rounded-full border border-[var(--border)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--text-primary)] transition-colors"
      >
        <Facebook size={13} />
      </a>
      <button
        onClick={copy}
        className="w-8 h-8 rounded-full border border-[var(--border)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--text-primary)] transition-colors"
      >
        {copied ? <Check size={13} className="text-green-500" /> : <Copy size={13} />}
      </button>
    </div>
  );
}

// ─── Markdown-like content renderer ──────────────────────────────────────────
// Renders plain text stored in Firestore with basic markdown support:
// # H1, ## H2, ### H3, **bold**, *italic*, `code`, ```codeblock```, > blockquote, - list item
function renderContent(content) {
  if (!content) return null;

  const lines = content.split('\n');
  const elements = [];
  let i = 0;
  let listItems = [];

  const flushList = () => {
    if (listItems.length) {
      elements.push(
        <ul key={`ul-${i}`} className="my-5 space-y-2 pl-5">
          {listItems.map((item, j) => (
            <li key={j} className="text-[var(--text-secondary)] leading-relaxed text-[15px] relative before:absolute before:-left-4 before:top-[10px] before:w-1.5 before:h-1.5 before:rounded-full before:bg-[var(--accent)]">
              {inlineFormat(item)}
            </li>
          ))}
        </ul>
      );
      listItems = [];
    }
  };

  const inlineFormat = (text) => {
    // bold, italic, inline code
    const parts = [];
    let remaining = text;
    let key = 0;

    while (remaining) {
      const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
      const italicMatch = remaining.match(/\*(.+?)\*/);
      const codeMatch = remaining.match(/`(.+?)`/);

      const matches = [boldMatch, italicMatch, codeMatch].filter(Boolean);
      if (!matches.length) { parts.push(<span key={key++}>{remaining}</span>); break; }

      const first = matches.reduce((a, b) => (a.index < b.index ? a : b));
      if (first.index > 0) parts.push(<span key={key++}>{remaining.slice(0, first.index)}</span>);

      if (first === boldMatch) parts.push(<strong key={key++} className="font-semibold text-[var(--text-primary)]">{first[1]}</strong>);
      else if (first === italicMatch) parts.push(<em key={key++} className="italic">{first[1]}</em>);
      else parts.push(<code key={key++} className="text-[13px] px-1.5 py-0.5 rounded bg-[var(--bg-secondary)] border border-[var(--border)] font-mono text-[var(--accent)]">{first[1]}</code>);

      remaining = remaining.slice(first.index + first[0].length);
    }
    return parts;
  };

  while (i < lines.length) {
    const line = lines[i];

    // Code block
    if (line.startsWith('```')) {
      flushList();
      const lang = line.slice(3).trim();
      const codeLines = [];
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      elements.push(
        <div key={`code-${i}`} className="my-6 rounded-xl overflow-hidden border border-[var(--border)]">
          {lang && (
            <div className="px-4 py-2 bg-[var(--bg-secondary)] border-b border-[var(--border)] text-[11px] text-[var(--text-muted)] font-mono uppercase tracking-wider">
              {lang}
            </div>
          )}
          <pre className="p-4 bg-[var(--card-bg)] overflow-x-auto text-[13px] leading-relaxed">
            <code className="font-mono text-[var(--text-secondary)]">{codeLines.join('\n')}</code>
          </pre>
        </div>
      );
      i++;
      continue;
    }

    // Headings
    if (line.startsWith('### ')) {
      flushList();
      const text = line.slice(4);
      const id = text.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
      elements.push(<h3 key={i} id={id} className="text-lg font-bold text-[var(--text-primary)] mt-8 mb-3 scroll-mt-24">{text}</h3>);
      i++; continue;
    }
    if (line.startsWith('## ')) {
      flushList();
      const text = line.slice(3);
      const id = text.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
      elements.push(<h2 key={i} id={id} className="text-xl font-bold text-[var(--text-primary)] mt-10 mb-4 scroll-mt-24 pb-2 border-b border-[var(--border)]">{text}</h2>);
      i++; continue;
    }
    if (line.startsWith('# ')) {
      flushList();
      const text = line.slice(2);
      const id = text.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
      elements.push(<h1 key={i} id={id} className="text-2xl font-bold text-[var(--text-primary)] mt-10 mb-4 scroll-mt-24">{text}</h1>);
      i++; continue;
    }

    // Blockquote
    if (line.startsWith('> ')) {
      flushList();
      elements.push(
        <blockquote key={i} className="my-6 pl-5 border-l-2 border-[var(--accent)]">
          <p className="text-[var(--text-secondary)] italic leading-relaxed text-[15px]">{inlineFormat(line.slice(2))}</p>
        </blockquote>
      );
      i++; continue;
    }

    // Divider
    if (line.trim() === '---') {
      flushList();
      elements.push(<hr key={i} className="my-8 border-[var(--border)]" />);
      i++; continue;
    }

    // List item
    if (line.startsWith('- ') || line.startsWith('* ')) {
      listItems.push(line.slice(2));
      i++; continue;
    }

    // Empty line
    if (!line.trim()) {
      flushList();
      elements.push(<div key={i} className="h-3" />);
      i++; continue;
    }

    // Paragraph
    flushList();
    elements.push(
      <p key={i} className="text-[var(--text-secondary)] leading-[1.85] text-[15px] my-1">
        {inlineFormat(line)}
      </p>
    );
    i++;
  }

  flushList();
  return elements;
}

// Extract headings from content for TOC
function extractHeadings(content) {
  if (!content) return [];
  return content.split('\n')
    .filter(l => l.startsWith('## ') || l.startsWith('### '))
    .map(l => {
      const level = l.startsWith('### ') ? 3 : 2;
      const text = l.slice(level === 3 ? 4 : 3);
      const id = text.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
      return { id, text, level };
    });
}

// ─── Related Posts ────────────────────────────────────────────────────────────
function RelatedPosts({ posts }) {
  if (!posts.length) return null;
  return (
    <section className="mt-16 pt-10 border-t border-[var(--border)]">
      <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-6">Related posts</p>
      <div className="grid md:grid-cols-3 gap-5">
        {posts.map(post => (
          <Link
            key={post.id}
            href={`/blog/${post.id}`}
            className="group flex flex-col bg-[var(--card-bg)] border border-[var(--border)] rounded-xl overflow-hidden hover:border-[var(--text-primary)]/25 hover:-translate-y-0.5 transition-all duration-200"
          >
            <div className="h-32 overflow-hidden bg-[var(--bg-secondary)] relative">
              {post.coverImage ? (
                <img src={post.coverImage} alt={post.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[var(--text-muted)]">
                  <svg width="28" height="28" viewBox="0 0 40 40" fill="none">
                    <rect x="4" y="8" width="32" height="24" rx="4" fill="currentColor" fillOpacity="0.1"/>
                  </svg>
                </div>
              )}
            </div>
            <div className="p-4 flex flex-col flex-1">
              <p className="text-[11px] text-[var(--text-muted)] mb-1.5 flex items-center gap-1">
                <Calendar size={10} /> {post.date}
              </p>
              <h4 className="text-sm font-semibold text-[var(--text-primary)] leading-snug line-clamp-2 group-hover:text-[var(--accent)] transition-colors">
                {post.title}
              </h4>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function BlogDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [post, setPost] = useState(null);
  const [relatedPosts, setRelatedPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState('');
  const [showBackToTop, setShowBackToTop] = useState(false);
  const contentRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      const snap = await getDoc(doc(db, 'blogs', id));
      if (snap.exists()) {
        const data = { id: snap.id, ...snap.data() };
        setPost(data);

        // Fetch related posts by same category, excluding current
        try {
          const q = query(
            collection(db, 'blogs'),
            where('category', '==', data.category || ''),
            limit(4)
          );
          const rel = await getDocs(q);
          setRelatedPosts(
            rel.docs
              .map(d => ({ id: d.id, ...d.data() }))
              .filter(p => p.id !== id)
              .slice(0, 3)
          );
        } catch (_) {
          // If no category or index missing, skip related
        }
      }
      setLoading(false);
    };
    fetchData();
  }, [id]);

  // Active heading tracking for TOC
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(e => { if (e.isIntersecting) setActiveId(e.target.id); });
      },
      { rootMargin: '-20% 0% -70% 0%', threshold: 0 }
    );
    const headings = document.querySelectorAll('h2[id], h3[id]');
    headings.forEach(h => observer.observe(h));
    return () => observer.disconnect();
  }, [post]);

  // Back to top visibility
  useEffect(() => {
    const onScroll = () => setShowBackToTop(window.scrollY > 400);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  if (loading) return <div className="min-h-screen flex items-center justify-center text-[var(--text-secondary)]">Loading...</div>;
  if (!post) return <div className="min-h-screen flex items-center justify-center text-[var(--text-secondary)]">Post not found.</div>;

  const headings = extractHeadings(post.content);

  return (
    <>
      <ReadingProgress />

      <main className="min-h-screen">
        {/* Hero */}
        <div className="relative w-full aspect-[16/6] overflow-hidden bg-[var(--bg-secondary)]">
          {post.coverImage && (
            <img src={post.coverImage} alt={post.title} className="absolute inset-0 w-full h-full object-cover" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

          {/* Back button */}
          <div className="absolute top-6 left-6">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-1.5 text-white/80 hover:text-white text-sm transition-colors bg-black/20 hover:bg-black/30 px-3 py-1.5 rounded-full backdrop-blur-sm"
            >
              <ArrowLeft size={14} /> Blog
            </button>
          </div>

          {/* Title area */}
          <div className="absolute bottom-0 left-0 right-0 p-8 max-w-3xl">
            {post.category && (
              <span className="inline-block text-xs font-medium px-2.5 py-1 rounded-full bg-[var(--accent)] text-white mb-3">
                {post.category}
              </span>
            )}
            <h1 className="text-3xl md:text-4xl font-bold text-white leading-tight mb-3">
              {post.title}
            </h1>
            <div className="flex items-center gap-4 text-white/70 text-sm">
              {post.date && <span className="flex items-center gap-1.5"><Calendar size={13} /> {post.date}</span>}
              {post.readTime && <span className="flex items-center gap-1.5"><Clock size={13} /> {post.readTime}</span>}
            </div>
          </div>
        </div>

        {/* Author + share bar */}
        <div className="border-b border-[var(--border)] bg-[var(--card-bg)]">
          <div className="container mx-auto px-6 max-w-5xl py-4 flex items-center justify-between gap-4">
            {post.author && (
              <div className="flex items-center gap-3">
                {post.authorAvatar ? (
                  <img src={post.authorAvatar} alt={post.author} className="w-9 h-9 rounded-full object-cover border border-[var(--border)]" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-[var(--bg-secondary)] border border-[var(--border)] flex items-center justify-center text-sm font-bold text-[var(--text-muted)]">
                    {post.author[0]}
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-[var(--text-primary)]">{post.author}</p>
                  <p className="text-xs text-[var(--text-muted)]">Author</p>
                </div>
              </div>
            )}
            <ShareButtons title={post.title} />
          </div>
        </div>

        {/* Body */}
        <div className="container mx-auto px-6 max-w-5xl py-12">
          <div className="grid lg:grid-cols-[1fr_200px] gap-12 items-start">

            {/* Content */}
            <article ref={contentRef} className="min-w-0">
              {/* Excerpt / lead */}
              {post.excerpt && (
                <p className="text-lg text-[var(--text-secondary)] leading-relaxed mb-8 pb-8 border-b border-[var(--border)] font-medium">
                  {post.excerpt}
                </p>
              )}

              {/* Rendered content */}
              <div className="prose-custom">
                {renderContent(post.content)}
              </div>

              {/* Tags */}
              {post.tags && (
                <div className="mt-10 pt-8 border-t border-[var(--border)]">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-3">Tags</p>
                  <div className="flex flex-wrap gap-2">
                    {post.tags.split(',').map(tag => (
                      <span key={tag} className="text-xs px-3 py-1 rounded-full border border-[var(--border)] text-[var(--text-secondary)] bg-[var(--bg-secondary)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors cursor-default">
                        {tag.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Author card at bottom */}
              {post.author && (
                <div className="mt-10 p-6 bg-[var(--card-bg)] border border-[var(--border)] rounded-xl flex gap-5 items-start">
                  {post.authorAvatar ? (
                    <img src={post.authorAvatar} alt={post.author} className="w-14 h-14 rounded-full object-cover border border-[var(--border)] shrink-0" />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-[var(--bg-secondary)] border border-[var(--border)] flex items-center justify-center text-xl font-bold text-[var(--text-muted)] shrink-0">
                      {post.author[0]}
                    </div>
                  )}
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-1">Written by</p>
                    <p className="text-base font-semibold text-[var(--text-primary)] mb-1">{post.author}</p>
                    {post.authorBio && <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{post.authorBio}</p>}
                  </div>
                </div>
              )}

              {/* Share bar at bottom */}
              <div className="mt-8 flex items-center justify-between pt-6 border-t border-[var(--border)]">
                <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors">
                  <ArrowLeft size={14} /> Back to blog
                </button>
                <ShareButtons title={post.title} />
              </div>

              {/* Related posts */}
              <RelatedPosts posts={relatedPosts} />
            </article>

            {/* Sidebar TOC */}
            <aside className="hidden lg:block">
              <TableOfContents headings={headings} activeId={activeId} />
            </aside>
          </div>
        </div>
      </main>

      {/* Back to top */}
      <button
        onClick={scrollToTop}
        className={`
          fixed bottom-8 right-8 z-40
          w-10 h-10 rounded-full
          bg-[var(--text-primary)] text-[var(--bg-primary)]
          flex items-center justify-center
          shadow-lg transition-all duration-300
          ${showBackToTop ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}
        `}
        title="Back to top"
      >
        <ArrowUp size={16} />
      </button>
    </>
  );
}