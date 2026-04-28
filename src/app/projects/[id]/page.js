'use client';
import MotionDiv from '@/components/ui/MotionDiv';
import { db } from '@/lib/firebase';
import { collection, doc, getDoc, getDocs, limit, query, where } from 'firebase/firestore';
import {
  ArrowLeft, ArrowUp, Calendar, ChevronLeft, ChevronRight,
  Code2, ExternalLink, Github, RotateCcw, Star, X, ZoomIn, ZoomOut
} from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

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

// ─── Lightbox ─────────────────────────────────────────────────────────────────
function Lightbox({ images, startIndex, onClose }) {
  const [current, setCurrent] = useState(startIndex);
  const [scale, setScale] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const drag = useRef({ active: false, startX: 0, startY: 0, px: 0, py: 0 });
  const stageRef = useRef(null);

  const resetView = useCallback(() => { setScale(1); setPos({ x: 0, y: 0 }); }, []);
  const go = useCallback((dir) => {
    setCurrent(c => (c + dir + images.length) % images.length);
    resetView();
  }, [images.length, resetView]);
  const zoom = useCallback((delta) => {
    setScale(s => Math.min(4, Math.max(0.25, +(s + delta).toFixed(2))));
  }, []);
  const onWheel = useCallback((e) => { e.preventDefault(); zoom(e.deltaY < 0 ? 0.15 : -0.15); }, [zoom]);

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [onWheel]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') go(-1);
      if (e.key === 'ArrowRight') go(1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, go]);

  const onMouseDown = (e) => {
    if (scale <= 1) return;
    drag.current = { active: true, startX: e.clientX, startY: e.clientY, px: pos.x, py: pos.y };
  };
  const onMouseMove = (e) => {
    if (!drag.current.active) return;
    setPos({ x: drag.current.px + (e.clientX - drag.current.startX), y: drag.current.py + (e.clientY - drag.current.startY) });
  };
  const onMouseUp = () => { drag.current.active = false; };

  const img = images[current];

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex flex-col" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="flex items-center justify-between px-5 py-3 shrink-0">
        <span className="text-white/60 text-sm">{current + 1} / {images.length}</span>
        <p className="text-white/80 text-sm font-medium truncate max-w-xs">{img?.title || 'Screenshot'}</p>
        <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
          <X size={16} className="text-white" />
        </button>
      </div>

      <div
        ref={stageRef}
        className="flex-1 relative overflow-hidden"
        style={{ cursor: scale > 1 ? 'grab' : 'default' }}
        onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={onMouseUp} onMouseLeave={onMouseUp}
      >
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
          <img
            src={img?.imageUrl} alt={img?.title || 'Screenshot'}
            style={{
              transform: `translate(${pos.x}px, ${pos.y}px) scale(${scale})`,
              transformOrigin: 'center',
              transition: drag.current.active ? 'none' : 'transform 0.15s ease',
              maxWidth: '90vw', maxHeight: '75vh', objectFit: 'contain', borderRadius: '8px',
            }}
            draggable={false}
          />
        </div>
        {images.length > 1 && (
          <>
            <button onClick={() => go(-1)} className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
              <ChevronLeft size={20} className="text-white" />
            </button>
            <button onClick={() => go(1)} className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
              <ChevronRight size={20} className="text-white" />
            </button>
          </>
        )}
      </div>

      <div className="flex items-center justify-center gap-2 py-4 shrink-0">
        <button onClick={() => zoom(-0.25)} className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"><ZoomOut size={16} className="text-white" /></button>
        <span className="text-white/60 text-xs min-w-[44px] text-center tabular-nums">{Math.round(scale * 100)}%</span>
        <button onClick={() => zoom(0.25)} className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"><ZoomIn size={16} className="text-white" /></button>
        <div className="w-px h-4 bg-white/20 mx-1" />
        <button onClick={resetView} className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"><RotateCcw size={14} className="text-white" /></button>
      </div>

      {images.length > 1 && (
        <div className="flex gap-2 justify-center px-6 pb-4 overflow-x-auto shrink-0">
          {images.map((img, i) => (
            <button key={img.id} onClick={() => { setCurrent(i); resetView(); }}
              className={`shrink-0 w-14 h-10 rounded overflow-hidden border-2 transition-all ${i === current ? 'border-white opacity-100' : 'border-transparent opacity-40 hover:opacity-70'}`}
            >
              <img src={img.imageUrl} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Related Projects ─────────────────────────────────────────────────────────
function RelatedProjects({ projects }) {
  if (!projects.length) return null;
  return (
    <section className="mt-16 pt-10 border-t border-[var(--border)]">
      <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-6">Related Projects</p>
      <div className="grid md:grid-cols-3 gap-5">
        {projects.map(project => (
          <Link
            key={project.id}
            href={`/projects/${project.id}`}
            className="group flex flex-col bg-[var(--card-bg)] border border-[var(--border)] rounded-xl overflow-hidden hover:border-[var(--text-primary)]/25 hover:-translate-y-0.5 transition-all duration-200"
          >
            <div className="h-28 overflow-hidden bg-[var(--bg-secondary)] relative">
              {project.coverImage ? (
                <img src={project.coverImage} alt={project.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[var(--text-muted)]">
                  <Code2 size={24} className="opacity-30" />
                </div>
              )}
            </div>
            <div className="p-4 flex flex-col flex-1">
              {project.type && (
                <span className="text-[10px] font-medium text-[var(--accent)] mb-1">{project.type}</span>
              )}
              <h4 className="text-sm font-semibold text-[var(--text-primary)] leading-snug line-clamp-2 group-hover:text-[var(--accent)] transition-colors">
                {project.title}
              </h4>
              {project.year && (
                <p className="text-[11px] text-[var(--text-muted)] mt-1.5 flex items-center gap-1">
                  <Calendar size={10} /> {project.year}
                </p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

// ─── Feature Highlights ───────────────────────────────────────────────────────
function FeatureList({ features }) {
  if (!features) return null;
  const lines = features.split('\n').map(l => l.replace(/^[-*•]\s*/, '').trim()).filter(Boolean);
  if (!lines.length) return null;
  return (
    <div className="mt-8 pt-8 border-t border-[var(--border)]">
      <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-4 flex items-center gap-1.5">
        <Star size={11} /> Features
      </p>
      <ul className="space-y-2.5">
        {lines.map((line, i) => (
          <li key={i} className="flex items-start gap-3 text-[var(--text-secondary)] text-[14px] leading-relaxed">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] mt-[6px] shrink-0" />
            {line}
          </li>
        ))}
      </ul>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ProjectDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [project, setProject] = useState(null);
  const [images, setImages] = useState([]);
  const [relatedProjects, setRelatedProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState({ open: false, index: 0 });
  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      const snap = await getDoc(doc(db, 'projects', id));
      if (snap.exists()) {
        const data = { id: snap.id, ...snap.data() };
        setProject(data);

        // Gallery images
        const q = query(collection(db, 'gallery'), where('relatedProjectId', '==', id), limit(10));
        const imgSnap = await getDocs(q);
        setImages(imgSnap.docs.map(d => ({ id: d.id, ...d.data() })));

        // Related projects by type
        try {
          const rq = query(collection(db, 'projects'), where('type', '==', data.type || ''), limit(4));
          const rel = await getDocs(rq);
          setRelatedProjects(rel.docs.map(d => ({ id: d.id, ...d.data() })).filter(p => p.id !== id).slice(0, 3));
        } catch (_) {}
      }
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
  if (!project) return <div className="min-h-screen flex items-center justify-center text-[var(--text-secondary)]">Project not found.</div>;

  const coverImage = images[0];
  const screenshots = images.slice(1);

  return (
    <>
      <ReadingProgress />

      <main className="min-h-screen">
        {lightbox.open && (
          <Lightbox images={images} startIndex={lightbox.index} onClose={() => setLightbox({ open: false, index: 0 })} />
        )}

        {/* Hero — full-bleed cover image with gradient overlay */}
        <div className="relative w-full aspect-[16/6] overflow-hidden bg-[var(--bg-secondary)]">
          {coverImage ? (
            <>
              <img
                src={coverImage.imageUrl}
                alt={coverImage.title || project.title}
                className="absolute inset-0 w-full h-full object-cover cursor-pointer"
                onClick={() => setLightbox({ open: true, index: 0 })}
              />
              {/* Hover hint */}
              <div
                className="absolute inset-0 bg-black/0 hover:bg-black/30 transition-colors duration-300 flex items-center justify-center group cursor-pointer"
                onClick={() => setLightbox({ open: true, index: 0 })}
              >
                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center gap-2 px-4 py-2 bg-white/90 rounded-full text-sm font-medium text-black">
                  <ZoomIn size={15} /> Click to view
                </div>
              </div>
            </>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center opacity-10">
              <Code2 size={80} className="text-[var(--text-primary)]" />
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />

          {/* Back button */}
          <div className="absolute top-6 left-6 z-10">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-1.5 text-white/80 hover:text-white text-sm transition-colors bg-black/20 hover:bg-black/30 px-3 py-1.5 rounded-full backdrop-blur-sm"
            >
              <ArrowLeft size={14} /> Projects
            </button>
          </div>

          {/* Title in hero */}
          <div className="absolute bottom-0 left-0 right-0 p-8 max-w-3xl pointer-events-none">
            {project.type && (
              <span className="inline-block text-xs font-medium px-2.5 py-1 rounded-full bg-[var(--accent)] text-white mb-3">
                {project.type}
              </span>
            )}
            <h1 className="text-3xl md:text-4xl font-bold text-white leading-tight mb-2">
              {project.title}
            </h1>
            <div className="flex items-center gap-4 text-white/70 text-sm">
              {project.year && <span className="flex items-center gap-1.5"><Calendar size={13} /> {project.year}</span>}
              {project.status && <span className="flex items-center gap-1.5">· {project.status}</span>}
            </div>
          </div>
        </div>

        {/* Action bar */}
        <div className="border-b border-[var(--border)] bg-[var(--card-bg)]">
          <div className="container mx-auto px-6 max-w-5xl py-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 text-xs text-[var(--text-muted)]">
              {project.role && <span>{project.role}</span>}
              {project.year && <span>· {project.year}</span>}
            </div>
            <div className="flex items-center gap-2">
              {project.github && (
                <a href={project.github} target="_blank" rel="noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 border border-[var(--border)] rounded-full text-xs text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors"
                >
                  <Github size={12} /> Source
                </a>
              )}
              {project.live && (
                <a href={project.live} target="_blank" rel="noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-[var(--text-primary)] text-[var(--bg-primary)] hover:opacity-90 transition-opacity"
                >
                  <ExternalLink size={12} /> Live demo
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="container mx-auto px-6 max-w-5xl py-12">
          <div className="grid lg:grid-cols-[1fr_220px] gap-12 items-start">

            {/* Main content */}
            <article>
              {/* Description */}
              {(project.details || project.description) && (
                <p className="text-lg text-[var(--text-secondary)] leading-relaxed mb-8 pb-8 border-b border-[var(--border)] font-medium">
                  {project.details || project.description}
                </p>
              )}

              {/* Tech stack */}
              {project.tech && (
                <div className="mb-8">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-3">Technologies</p>
                  <div className="flex flex-wrap gap-2">
                    {project.tech.split(',').map((t, i) => (
                      <span key={i} className="px-3 py-1 border border-[var(--border)] rounded-full text-xs text-[var(--text-secondary)] bg-[var(--bg-secondary)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors cursor-default">
                        {t.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Feature list */}
              <FeatureList features={project.features} />

              {/* Screenshots */}
              {screenshots.length > 0 && (
                <div className="mt-10 pt-8 border-t border-[var(--border)]">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-4">
                    Screenshots <span className="text-[var(--text-muted)] font-normal normal-case tracking-normal">({screenshots.length})</span>
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {screenshots.map((img, i) => (
                      <MotionDiv key={img.id} delay={i * 0.07}>
                        <div
                          className="aspect-video rounded-xl overflow-hidden border border-[var(--border)] group cursor-pointer relative"
                          onClick={() => setLightbox({ open: true, index: i + 1 })}
                        >
                          <img
                            src={img.imageUrl}
                            alt={img.title || 'Screenshot'}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-300 flex items-center justify-center">
                            <ZoomIn size={18} className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                          </div>
                          {img.title && (
                            <div className="absolute bottom-0 left-0 right-0 px-3 py-2 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                              <p className="text-white text-[11px] truncate">{img.title}</p>
                            </div>
                          )}
                        </div>
                      </MotionDiv>
                    ))}
                  </div>
                </div>
              )}

              {/* Bottom CTA */}
              <div className="mt-10 pt-8 border-t border-[var(--border)] flex items-center justify-between">
                <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors">
                  <ArrowLeft size={14} /> Back to projects
                </button>
                <div className="flex items-center gap-2">
                  {project.github && (
                    <a href={project.github} target="_blank" rel="noreferrer"
                      className="flex items-center gap-1.5 px-4 py-2 border border-[var(--border)] rounded-lg text-sm text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors"
                    >
                      <Github size={14} /> Source code
                    </a>
                  )}
                  {project.live && (
                    <a href={project.live} target="_blank" rel="noreferrer"
                      className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-[var(--text-primary)] text-[var(--bg-primary)] hover:opacity-90 transition-opacity"
                    >
                      <ExternalLink size={14} /> Live demo
                    </a>
                  )}
                </div>
              </div>

              {/* Related projects */}
              <RelatedProjects projects={relatedProjects} />
            </article>

            {/* Sidebar */}
            <aside className="hidden lg:block sticky top-24">
              <div className="border border-[var(--border)] rounded-xl overflow-hidden text-sm divide-y divide-[var(--border)] shadow-sm">
                {[
                  ['Status', project.status || 'Completed'],
                  ['Year', project.year],
                  ['Role', project.role],
                  ['Type', project.type],
                  ['Team', project.team],
                  ['Client', project.client],
                ].filter(([, v]) => v).map(([label, value]) => (
                  <div key={label} className="px-4 py-3 bg-[var(--card-bg)]">
                    <p className="text-[10px] uppercase tracking-widest text-[var(--text-muted)] mb-0.5">{label}</p>
                    <p className="font-medium text-[var(--text-primary)]">{value}</p>
                  </div>
                ))}
              </div>

              {/* Links */}
              {(project.github || project.live) && (
                <div className="mt-4 space-y-2">
                  {project.github && (
                    <a href={project.github} target="_blank" rel="noreferrer"
                      className="flex items-center justify-center gap-2 w-full px-4 py-2.5 border border-[var(--border)] rounded-xl text-sm text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors"
                    >
                      <Github size={14} /> Source code
                    </a>
                  )}
                  {project.live && (
                    <a href={project.live} target="_blank" rel="noreferrer"
                      className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl text-sm font-medium bg-[var(--text-primary)] text-[var(--bg-primary)] hover:opacity-90 transition-opacity"
                    >
                      <ExternalLink size={14} /> Live demo
                    </a>
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