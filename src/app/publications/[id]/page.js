'use client';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import {
  ArrowLeft, ArrowUp, BookOpen, Calendar,
  ExternalLink, FileText, Hash, Quote, Users
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

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
      <div className="h-full bg-[var(--accent)] transition-all duration-100" style={{ width: `${progress}%` }} />
    </div>
  );
}

// ─── Citation Block ───────────────────────────────────────────────────────────
function CitationBlock({ item }) {
  const [copied, setCopied] = useState(false);

  const citation = [
    item.authors,
    item.title ? `"${item.title}."` : null,
    item.journal ? `*${item.journal}*` : null,
    item.volume ? `vol. ${item.volume}` : null,
    item.pages ? `pp. ${item.pages}` : null,
    item.year,
  ].filter(Boolean).join(', ');

  const copy = async () => {
    await navigator.clipboard.writeText(citation);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mt-8 p-5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)]">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] flex items-center gap-1.5">
          <Quote size={11} /> Citation
        </p>
        <button
          onClick={copy}
          className="text-xs text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors px-2 py-1 rounded border border-[var(--border)] hover:border-[var(--accent)]"
        >
          {copied ? '✓ Copied' : 'Copy'}
        </button>
      </div>
      <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed font-mono">
        {citation}
      </p>
    </div>
  );
}

// ─── Keywords / Tags ──────────────────────────────────────────────────────────
function KeywordTags({ keywords }) {
  if (!keywords) return null;
  const tags = keywords.split(',').map(k => k.trim()).filter(Boolean);
  if (!tags.length) return null;
  return (
    <div className="mt-8 pt-8 border-t border-[var(--border)]">
      <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-3 flex items-center gap-1.5">
        <Hash size={11} /> Keywords
      </p>
      <div className="flex flex-wrap gap-2">
        {tags.map(tag => (
          <span key={tag} className="text-xs px-3 py-1 rounded-full border border-[var(--border)] text-[var(--text-secondary)] bg-[var(--bg-secondary)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors cursor-default">
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── Hero Banner ──────────────────────────────────────────────────────────────
function HeroBanner({ item }) {
  return (
    <div className="relative w-full overflow-hidden bg-[var(--bg-secondary)] border-b border-[var(--border)]">
      {/* Decorative gradient backdrop */}
      <div className="absolute inset-0 opacity-20 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 80% 40%, var(--accent) 0%, transparent 60%)' }} />

      {/* Back button */}
      <div className="absolute top-6 left-6 z-10">
        <button
          onClick={() => window.history.back()}
          className="flex items-center gap-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-sm transition-colors bg-[var(--card-bg)]/80 hover:bg-[var(--card-bg)] px-3 py-1.5 rounded-full backdrop-blur-sm border border-[var(--border)]"
        >
          <ArrowLeft size={14} /> Publications
        </button>
      </div>

      <div className="container mx-auto px-6 max-w-5xl py-16 pt-20">
        <div className="flex items-start gap-5">
          {/* Icon */}
          <div className="w-14 h-14 rounded-2xl bg-[var(--card-bg)] border border-[var(--border)] flex items-center justify-center shrink-0 shadow-sm">
            <FileText size={22} className="text-[var(--accent)]" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="inline-block text-xs font-medium px-2.5 py-1 rounded-full bg-[var(--accent)]/15 text-[var(--accent)] mb-3">
              {item.type || 'Journal Article'}
            </span>
            <h1 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)] leading-tight mb-3">
              {item.title}
            </h1>
            {item.authors && (
              <p className="text-sm text-[var(--text-muted)] flex items-center gap-1.5">
                <Users size={13} /> {item.authors}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function PublicationDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      const snap = await getDoc(doc(db, 'publications', id));
      if (snap.exists()) setItem({ id: snap.id, ...snap.data() });
      setLoading(false);
    };
    fetchData();
  }, [id]);

  useEffect(() => {
    const onScroll = () => setShowBackToTop(window.scrollY > 400);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-[var(--text-secondary)]">Loading...</div>;
  if (!item) return <div className="min-h-screen flex items-center justify-center text-[var(--text-secondary)]">Publication not found.</div>;

  return (
    <>
      <ReadingProgress />

      <main className="min-h-screen">
        <HeroBanner item={item} />

        {/* Meta bar */}
        <div className="border-b border-[var(--border)] bg-[var(--card-bg)]">
          <div className="container mx-auto px-6 max-w-5xl py-3 flex flex-wrap items-center gap-5 text-xs text-[var(--text-muted)]">
            {item.journal && <span className="flex items-center gap-1.5"><BookOpen size={12} /> {item.journal}</span>}
            {item.year && <span className="flex items-center gap-1.5"><Calendar size={12} /> {item.year}</span>}
            {item.doi && (
              <span className="flex items-center gap-1.5 font-mono">
                DOI: {item.doi}
              </span>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="container mx-auto px-6 max-w-5xl py-12">
          <div className="grid lg:grid-cols-[1fr_230px] gap-12 items-start">

            {/* Main content */}
            <article>
              {/* Abstract */}
              {item.abstract && (
                <div className="mb-8">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-4">Abstract</p>
                  <p className="text-[var(--text-secondary)] leading-[1.9] text-[15px]">
                    {item.abstract}
                  </p>
                </div>
              )}

              {/* Full Text / Summary */}
              {item.summary && (
                <div className="mb-8 pt-8 border-t border-[var(--border)]">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-4">Summary</p>
                  <p className="text-[var(--text-secondary)] leading-[1.9] text-[15px]">
                    {item.summary}
                  </p>
                </div>
              )}

              {/* Citation block */}
              <CitationBlock item={item} />

              {/* Keywords */}
              <KeywordTags keywords={item.keywords || item.tags} />

              {/* CTA */}
              {item.link && (
                <div className="mt-8 pt-8 border-t border-[var(--border)]">
                  <a
                    href={item.link}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium bg-[var(--text-primary)] text-[var(--bg-primary)] hover:opacity-90 transition-opacity"
                  >
                    <ExternalLink size={15} /> View full publication
                  </a>
                </div>
              )}

              {/* Back nav */}
              <div className="mt-10 pt-6 border-t border-[var(--border)]">
                <button
                  onClick={() => router.back()}
                  className="flex items-center gap-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors"
                >
                  <ArrowLeft size={14} /> Back to Publications
                </button>
              </div>
            </article>

            {/* Sidebar meta panel */}
            <aside className="sticky top-24">
              <div className="border border-[var(--border)] rounded-xl overflow-hidden text-sm divide-y divide-[var(--border)] shadow-sm">
                {[
                  ['Journal', item.journal],
                  ['Year', item.year],
                  ['Volume', item.volume],
                  ['Issue', item.issue],
                  ['Pages', item.pages],
                  ['DOI', item.doi],
                  ['Publisher', item.publisher],
                  ['Type', item.type],
                ].filter(([, v]) => v).map(([label, value]) => (
                  <div key={label} className="px-4 py-3 bg-[var(--card-bg)]">
                    <p className="text-[10px] uppercase tracking-widest text-[var(--text-muted)] mb-0.5">{label}</p>
                    <p className="font-medium text-[var(--text-primary)] break-all">{value}</p>
                  </div>
                ))}
              </div>

              {/* Impact / citations */}
              {(item.citations !== undefined || item.impactFactor) && (
                <div className="mt-4 border border-[var(--border)] rounded-xl overflow-hidden text-sm divide-y divide-[var(--border)] shadow-sm">
                  {item.citations !== undefined && (
                    <div className="px-4 py-3 bg-[var(--card-bg)]">
                      <p className="text-[10px] uppercase tracking-widest text-[var(--text-muted)] mb-0.5">Citations</p>
                      <p className="text-2xl font-bold text-[var(--accent)]">{item.citations}</p>
                    </div>
                  )}
                  {item.impactFactor && (
                    <div className="px-4 py-3 bg-[var(--card-bg)]">
                      <p className="text-[10px] uppercase tracking-widest text-[var(--text-muted)] mb-0.5">Impact Factor</p>
                      <p className="font-medium text-[var(--text-primary)]">{item.impactFactor}</p>
                    </div>
                  )}
                </div>
              )}

              {item.link && (
                <div className="mt-4">
                  <a
                    href={item.link}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl text-sm font-medium bg-[var(--text-primary)] text-[var(--bg-primary)] hover:opacity-90 transition-opacity"
                  >
                    <ExternalLink size={14} /> View Publication
                  </a>
                </div>
              )}
            </aside>
          </div>
        </div>
      </main>

      {/* Back to top */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className={`fixed bottom-8 right-8 z-40 w-10 h-10 rounded-full bg-[var(--text-primary)] text-[var(--bg-primary)] flex items-center justify-center shadow-lg transition-all duration-300 ${showBackToTop ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}
        title="Back to top"
      >
        <ArrowUp size={16} />
      </button>
    </>
  );
}