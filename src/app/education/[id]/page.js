'use client';
import { db } from '@/lib/firebase';
import { collection, doc, getDoc, getDocs, limit, query } from 'firebase/firestore';
import {
  ArrowLeft, ArrowUp, BookOpen,
  Calendar, GraduationCap, MapPin, Star,
} from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const TAG_COLORS = {
  core:            { pill: 'bg-blue-500/10 text-blue-600 border-blue-200',     dot: 'bg-blue-500'    },
  elective:        { pill: 'bg-violet-500/10 text-violet-600 border-violet-200', dot: 'bg-violet-500' },
  'project-based': { pill: 'bg-emerald-500/10 text-emerald-600 border-emerald-200', dot: 'bg-emerald-500' },
  lab:             { pill: 'bg-orange-500/10 text-orange-600 border-orange-200', dot: 'bg-orange-500' },
  thesis:          { pill: 'bg-rose-500/10 text-rose-600 border-rose-200',     dot: 'bg-rose-500'    },
};
const DEFAULT_TAG = { pill: 'bg-[var(--bg-secondary)] text-[var(--text-muted)] border-[var(--border)]', dot: 'bg-[var(--text-muted)]' };

function getTagStyle(tag) {
  return TAG_COLORS[tag?.toLowerCase()] || DEFAULT_TAG;
}

function parseCourses(val) {
  if (Array.isArray(val)) return val;
  try { return val ? JSON.parse(val) : []; }
  catch (_) { return []; }
}

// ── Reading Progress Bar ───────────────────────────────────────────────────────
function ReadingProgress() {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const onScroll = () => {
      const el = document.documentElement;
      const total = el.scrollHeight - el.clientHeight;
      setProgress(total > 0 ? (el.scrollTop / total) * 100 : 0);
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

// ── Course Group Sidebar Nav (mirrors TOC exactly) ────────────────────────────
function CourseGroupNav({ groups, activeGroup }) {
  if (!groups.length) return null;
  return (
    <nav className="sticky top-24">
      <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-3">
        On this page
      </p>
      <ul className="space-y-1">
        {groups.map(g => (
          <li key={g}>
            <a
              href={`#group-${g.toLowerCase().replace(/\s+/g, '-')}`}
              className={`
                block text-xs leading-relaxed py-0.5 capitalize transition-colors duration-150
                ${activeGroup === g
                  ? 'text-[var(--accent)] font-medium'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
                }
              `}
            >
              {g}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

// ── Related Education Entries ─────────────────────────────────────────────────
function RelatedEntries({ entries }) {
  if (!entries.length) return null;
  return (
    <section className="mt-16 pt-10 border-t border-[var(--border)]">
      <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-6">
        Other education
      </p>
      <div className="grid md:grid-cols-3 gap-5">
        {entries.map(entry => (
          <Link
            key={entry.id}
            href={`/education/${entry.id}`}
            className="group flex flex-col bg-[var(--card-bg)] border border-[var(--border)] rounded-xl overflow-hidden hover:border-[var(--accent)]/25 hover:-translate-y-0.5 transition-all duration-200"
          >
            {/* Logo panel */}
            <div className="h-28 bg-[var(--bg-secondary)] flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent)]/5 to-transparent" />
              {entry.logoUrl ? (
                <div className="relative z-10 w-12 h-12 rounded-xl border border-[var(--border)] bg-white flex items-center justify-center p-2 shadow transition-transform duration-300 group-hover:scale-105">
                  <img src={entry.logoUrl} alt={entry.institution} className="w-full h-full object-contain" />
                </div>
              ) : (
                <GraduationCap size={22} className="relative z-10 text-[var(--accent)]" />
              )}
            </div>
            <div className="p-4">
              {entry.duration && (
                <p className="text-[11px] text-[var(--text-muted)] mb-1 flex items-center gap-1">
                  <Calendar size={10} /> {entry.duration}
                </p>
              )}
              <h4 className="text-sm font-semibold text-[var(--text-primary)] leading-snug line-clamp-2 group-hover:text-[var(--accent)] transition-colors">
                {entry.title}
              </h4>
              <p className="text-xs text-[var(--accent)] font-medium mt-0.5">{entry.institution}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

// ── CGPA Gauge (larger version for detail page) ───────────────────────────────
function CgpaGauge({ cgpa }) {
  const numeric = parseFloat(cgpa);
  if (isNaN(numeric)) return null;

  const max = numeric <= 5 ? 5 : numeric <= 10 ? 10 : 100;
  const pct = Math.min(numeric / max, 1);
  const r = 28;
  const circ = 2 * Math.PI * r;
  const arcFrac = 0.75;
  const filled = pct * circ * arcFrac;
  const empty = circ - filled;

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-[72px] h-[72px]">
        <svg width="72" height="72" viewBox="0 0 72 72" className="-rotate-[135deg]">
          <circle cx="36" cy="36" r={r} fill="none" stroke="var(--border)" strokeWidth="4"
            strokeDasharray={`${circ * arcFrac} ${circ * (1 - arcFrac)}`} strokeLinecap="round" />
          <circle cx="36" cy="36" r={r} fill="none" stroke="var(--accent)" strokeWidth="4"
            strokeDasharray={`${filled} ${empty + circ * (1 - arcFrac)}`} strokeLinecap="round" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[17px] font-bold text-[var(--text-primary)] leading-none">{numeric}</span>
          <span className="text-[9px] text-[var(--text-muted)] mt-0.5 uppercase tracking-wider">GPA</span>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function EducationDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [item, setItem] = useState(null);
  const [relatedEntries, setRelatedEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeGroup, setActiveGroup] = useState('');
  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      const snap = await getDoc(doc(db, 'education', id));
      if (snap.exists()) {
        const data = { id: snap.id, ...snap.data() };
        setItem(data);
        try {
          const q = query(collection(db, 'education'), limit(4));
          const rel = await getDocs(q);
          setRelatedEntries(
            rel.docs.map(d => ({ id: d.id, ...d.data() })).filter(e => e.id !== id).slice(0, 3)
          );
        } catch (_) {}
      }
      setLoading(false);
    };
    fetchData();
  }, [id]);

  // Active group tracking — same as TOC heading observer in blog detail
  useEffect(() => {
    if (!item) return;
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(e => { if (e.isIntersecting) setActiveGroup(e.target.dataset.group || ''); });
      },
      { rootMargin: '-20% 0% -70% 0%', threshold: 0 }
    );
    document.querySelectorAll('[data-group]').forEach(s => observer.observe(s));
    return () => observer.disconnect();
  }, [item]);

  useEffect(() => {
    const onScroll = () => setShowBackToTop(window.scrollY > 400);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-[var(--accent)] border-t-transparent animate-spin" />
        <p className="text-sm text-[var(--text-muted)]">Loading…</p>
      </div>
    </div>
  );

  if (!item) return (
    <div className="min-h-screen flex items-center justify-center text-[var(--text-secondary)]">
      Education entry not found.
    </div>
  );

  const courses = parseCourses(item.courses);
  const grouped = courses.reduce((acc, course) => {
    const key = course.tag || 'Other';
    if (!acc[key]) acc[key] = [];
    acc[key].push(course);
    return acc;
  }, {});
  const groupOrder = ['core', 'project-based', 'lab', 'elective', 'thesis', 'Other'];
  const sortedGroups = Object.keys(grouped).sort((a, b) => {
    const ai = groupOrder.indexOf(a.toLowerCase());
    const bi = groupOrder.indexOf(b.toLowerCase());
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });

  return (
    <>
      <ReadingProgress />

      <main className="min-h-screen">

        {/* ── Full-width header — case study style ──────────────── */}
        <div className="bg-[var(--card-bg)] border-b border-[var(--border)]">
          <div className="container mx-auto px-6 max-w-5xl py-10">

            {/* Back nav */}
            <button
              onClick={() => router.back()}
              className="flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors mb-8 group"
            >
              <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform duration-150" />
              Education
            </button>

            <div className="flex flex-col md:flex-row gap-8 items-start">

              {/* Logo */}
              <div className="shrink-0">
                {item.logoUrl ? (
                  <div className="w-24 h-24 md:w-28 md:h-28 rounded-2xl border-2 border-[var(--border)] bg-white flex items-center justify-center p-4 shadow-md">
                    <img src={item.logoUrl} alt={item.institution} className="w-full h-full object-contain" />
                  </div>
                ) : (
                  <div className="w-24 h-24 md:w-28 md:h-28 rounded-2xl border-2 border-[var(--border)] bg-[var(--bg-secondary)] flex items-center justify-center">
                    <GraduationCap size={36} className="text-[var(--accent)]" />
                  </div>
                )}
              </div>

              {/* Title block */}
              <div className="flex-1 min-w-0">
                {item.type && (
                  <span className="inline-block text-[10px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-full bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20 mb-3">
                    {item.type}
                  </span>
                )}
                <h1 className="text-3xl md:text-4xl font-bold text-[var(--text-primary)] leading-tight mb-2">
                  {item.title}
                </h1>
                <p className="text-lg font-semibold text-[var(--accent)] mb-4">{item.institution}</p>
                {item.description && (
                  <p className="text-[var(--text-secondary)] leading-relaxed max-w-xl text-[15px]">
                    {item.description}
                  </p>
                )}
              </div>

              {/* CGPA gauge */}
              {item.cgpa && (
                <div className="shrink-0 hidden md:block">
                  <CgpaGauge cgpa={item.cgpa} />
                </div>
              )}
            </div>

            {/* ── Horizontal stats strip ────────────────────────── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-8">
              {item.duration && (
                <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl px-4 py-3">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-1">Duration</p>
                  <div className="flex items-center gap-1.5">
                    <Calendar size={12} className="text-[var(--accent)] shrink-0" />
                    <span className="text-sm font-semibold text-[var(--text-primary)] truncate">{item.duration}</span>
                  </div>
                </div>
              )}
              {item.location && (
                <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl px-4 py-3">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-1">Location</p>
                  <div className="flex items-center gap-1.5">
                    <MapPin size={12} className="text-[var(--accent)] shrink-0" />
                    <span className="text-sm font-semibold text-[var(--text-primary)] truncate">{item.location}</span>
                  </div>
                </div>
              )}
              {item.cgpa && (
                <div className="bg-[var(--accent)]/8 border border-[var(--accent)]/20 rounded-xl px-4 py-3">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-[var(--accent)]/70 mb-1">CGPA</p>
                  <div className="flex items-center gap-1.5">
                    <Star size={12} className="text-yellow-500 shrink-0" fill="currentColor" />
                    <span className="text-sm font-bold text-[var(--accent)]">{item.cgpa}</span>
                  </div>
                </div>
              )}
              {courses.length > 0 && (
                <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl px-4 py-3">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-1">Courses</p>
                  <div className="flex items-center gap-1.5">
                    <BookOpen size={12} className="text-[var(--accent)] shrink-0" />
                    <span className="text-sm font-semibold text-[var(--text-primary)]">{courses.length} total</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Body — same two-column layout as blog detail ────── */}
        <div className="container mx-auto px-6 max-w-5xl py-12">
          <div className="grid lg:grid-cols-[1fr_200px] gap-12 items-start">

            {/* Main content */}
            <article className="min-w-0">
              {courses.length > 0 ? (
                <>
                  {/* Tag legend */}
                  <div className="flex flex-wrap gap-2 mb-10">
                    {sortedGroups.map(group => {
                      const s = getTagStyle(group);
                      return (
                        <a
                          key={group}
                          href={`#group-${group.toLowerCase().replace(/\s+/g, '-')}`}
                          className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border capitalize hover:opacity-80 transition-opacity ${s.pill}`}
                        >
                          {group} · {grouped[group].length}
                        </a>
                      );
                    })}
                  </div>

                  {/* Grouped sections */}
                  <div className="space-y-12">
                    {sortedGroups.map(group => {
                      const s = getTagStyle(group);
                      return (
                        <div
                          key={group}
                          id={`group-${group.toLowerCase().replace(/\s+/g, '-')}`}
                          data-group={group}
                          className="scroll-mt-24"
                        >
                          {/* Group header */}
                          <div className="flex items-center gap-3 mb-5">
                            <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${s.dot}`} />
                            <h2 className="text-base font-bold text-[var(--text-primary)] capitalize">{group}</h2>
                            <span className="text-xs text-[var(--text-muted)]">· {grouped[group].length}</span>
                            <div className="flex-1 h-px bg-[var(--border)]" />
                          </div>

                          {/* Course cards */}
                          <div className="grid sm:grid-cols-2 gap-3">
                            {grouped[group].map((course, i) => (
                              <div
                                key={i}
                                className="flex gap-3 p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] hover:border-[var(--accent)]/25 hover:bg-[var(--card-bg)] transition-all duration-200"
                              >
                                <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${s.dot}`} />
                                <div className="min-w-0">
                                  <p className="text-sm font-semibold text-[var(--text-primary)] leading-snug">
                                    {course.name}
                                  </p>
                                  {course.description && (
                                    <p className="text-xs text-[var(--text-secondary)] leading-relaxed mt-0.5">
                                      {course.description}
                                    </p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 gap-3 border border-dashed border-[var(--border)] rounded-2xl">
                  <BookOpen size={24} className="text-[var(--text-muted)]" />
                  <p className="text-sm text-[var(--text-muted)]">No courses listed for this program.</p>
                </div>
              )}

              {/* Bottom nav — same as blog detail */}
              <div className="mt-12 pt-6 border-t border-[var(--border)]">
                <button
                  onClick={() => router.back()}
                  className="flex items-center gap-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors"
                >
                  <ArrowLeft size={14} /> Back to education
                </button>
              </div>

              {/* Related entries — mirrors RelatedPosts */}
              <RelatedEntries entries={relatedEntries} />
            </article>

            {/* Sidebar — same sticky column as blog detail TOC */}
            <aside className="hidden lg:block">
              <CourseGroupNav groups={sortedGroups} activeGroup={activeGroup} />
            </aside>
          </div>
        </div>
      </main>

      {/* Back to top — identical to blog detail */}
      <button
        onClick={scrollToTop}
        className={`
          fixed bottom-8 right-8 z-40
          w-10 h-10 rounded-full
          bg-[var(--text-primary)] text-[var(--bg-primary)]
          flex items-center justify-center shadow-lg
          transition-all duration-300
          ${showBackToTop ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}
        `}
        title="Back to top"
      >
        <ArrowUp size={16} />
      </button>
    </>
  );
}