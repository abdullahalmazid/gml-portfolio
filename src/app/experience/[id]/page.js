'use client';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import {
  ArrowLeft, ArrowUp,
  Award,
  Briefcase, Building2,
  Calendar,
  CheckCircle2,
  Clock, Globe, MapPin
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

// ─── Timeline Entry (for responsibilities / bullet points) ───────────────────
function BulletList({ text }) {
  if (!text) return null;
  // Support both newline-separated and plain paragraph
  const lines = text.split('\n').map(l => l.replace(/^[-*•]\s*/, '').trim()).filter(Boolean);
  if (lines.length <= 1) {
    return <p className="text-[var(--text-secondary)] leading-[1.85] text-[15px]">{text}</p>;
  }
  return (
    <ul className="space-y-3 mt-1">
      {lines.map((line, i) => (
        <li key={i} className="flex items-start gap-3 text-[var(--text-secondary)] text-[15px] leading-relaxed">
          <CheckCircle2 size={15} className="text-[var(--accent)] mt-0.5 shrink-0" />
          <span>{line}</span>
        </li>
      ))}
    </ul>
  );
}

// ─── Skill Tags ───────────────────────────────────────────────────────────────
function SkillTags({ skills }) {
  if (!skills) return null;
  const tags = skills.split(',').map(s => s.trim()).filter(Boolean);
  if (!tags.length) return null;
  return (
    <div className="mt-8 pt-8 border-t border-[var(--border)]">
      <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-3">Skills & Tools</p>
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
      <div className="absolute inset-0 opacity-30 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 20% 50%, var(--accent) 0%, transparent 60%)' }} />

      {/* Back button */}
      <div className="absolute top-6 left-6 z-10">
        <button
          onClick={() => window.history.back()}
          className="flex items-center gap-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-sm transition-colors bg-[var(--card-bg)]/80 hover:bg-[var(--card-bg)] px-3 py-1.5 rounded-full backdrop-blur-sm border border-[var(--border)]"
        >
          <ArrowLeft size={14} /> Experience
        </button>
      </div>

      <div className="container mx-auto px-6 max-w-5xl py-16 pt-20">
        <div className="flex items-start gap-5">
          {/* Company logo placeholder / initials */}
          <div className="w-16 h-16 rounded-2xl bg-[var(--card-bg)] border border-[var(--border)] flex items-center justify-center text-2xl font-bold text-[var(--accent)] shrink-0 shadow-sm">
            {item.company?.[0] ?? <Building2 size={24} />}
          </div>
          <div>
            {item.type && (
              <span className="inline-block text-xs font-medium px-2.5 py-1 rounded-full bg-[var(--accent)]/15 text-[var(--accent)] mb-2">
                {item.type}
              </span>
            )}
            <h1 className="text-3xl md:text-4xl font-bold text-[var(--text-primary)] leading-tight mb-1">
              {item.role}
            </h1>
            <p className="text-lg text-[var(--text-secondary)] font-medium mb-3">{item.company}</p>
            <div className="flex flex-wrap items-center gap-4 text-sm text-[var(--text-muted)]">
              {item.duration && (
                <span className="flex items-center gap-1.5"><Calendar size={13} /> {item.duration}</span>
              )}
              {item.location && (
                <span className="flex items-center gap-1.5"><MapPin size={13} /> {item.location}</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ExperienceDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      const snap = await getDoc(doc(db, 'experience', id));
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
  if (!item) return <div className="min-h-screen flex items-center justify-center text-[var(--text-secondary)]">Experience not found.</div>;

  return (
    <>
      <ReadingProgress />

      <main className="min-h-screen">
        <HeroBanner item={item} />

        {/* Author-style bar */}
        <div className="border-b border-[var(--border)] bg-[var(--card-bg)]">
          <div className="container mx-auto px-6 max-w-5xl py-3 flex items-center gap-6 text-xs text-[var(--text-muted)]">
            <span className="flex items-center gap-1.5"><Briefcase size={12} /> {item.type || 'Position'}</span>
            {item.duration && <span className="flex items-center gap-1.5"><Clock size={12} /> {item.duration}</span>}
            {item.location && <span className="flex items-center gap-1.5"><Globe size={12} /> {item.location}</span>}
          </div>
        </div>

        {/* Body */}
        <div className="container mx-auto px-6 max-w-5xl py-12">
          <div className="grid lg:grid-cols-[1fr_230px] gap-12 items-start">

            {/* Main content */}
            <article>
              {/* Responsibilities */}
              <div className="mb-8">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-4">
                  Responsibilities & Contributions
                </p>
                <BulletList text={item.description} />
              </div>

              {/* Achievements (if any) */}
              {item.achievements && (
                <div className="mb-8 p-5 rounded-xl bg-[var(--accent)]/5 border border-[var(--accent)]/20">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--accent)] mb-3 flex items-center gap-1.5">
                    <Award size={12} /> Key Achievements
                  </p>
                  <BulletList text={item.achievements} />
                </div>
              )}

              {/* Skills */}
              <SkillTags skills={item.skills || item.tech} />

              {/* Back nav */}
              <div className="mt-10 pt-8 border-t border-[var(--border)]">
                <button
                  onClick={() => router.back()}
                  className="flex items-center gap-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors"
                >
                  <ArrowLeft size={14} /> Back to Experience
                </button>
              </div>
            </article>

            {/* Sidebar meta panel */}
            <aside className="sticky top-24">
              <div className="border border-[var(--border)] rounded-xl overflow-hidden text-sm divide-y divide-[var(--border)] shadow-sm">
                {[
                  ['Company', item.company],
                  ['Duration', item.duration],
                  ['Location', item.location],
                  ['Type', item.type],
                  ['Status', item.status],
                ].filter(([, v]) => v).map(([label, value]) => (
                  <div key={label} className="px-4 py-3 bg-[var(--card-bg)]">
                    <p className="text-[10px] uppercase tracking-widest text-[var(--text-muted)] mb-0.5">{label}</p>
                    <p className="font-medium text-[var(--text-primary)]">{value}</p>
                  </div>
                ))}
              </div>

              {/* Quick stats */}
              {(item.teamSize || item.reportingTo) && (
                <div className="mt-4 border border-[var(--border)] rounded-xl overflow-hidden text-sm divide-y divide-[var(--border)] shadow-sm">
                  {item.teamSize && (
                    <div className="px-4 py-3 bg-[var(--card-bg)]">
                      <p className="text-[10px] uppercase tracking-widest text-[var(--text-muted)] mb-0.5">Team Size</p>
                      <p className="font-medium text-[var(--text-primary)]">{item.teamSize}</p>
                    </div>
                  )}
                  {item.reportingTo && (
                    <div className="px-4 py-3 bg-[var(--card-bg)]">
                      <p className="text-[10px] uppercase tracking-widest text-[var(--text-muted)] mb-0.5">Reporting To</p>
                      <p className="font-medium text-[var(--text-primary)]">{item.reportingTo}</p>
                    </div>
                  )}
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