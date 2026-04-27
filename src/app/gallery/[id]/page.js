'use client';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { ArrowRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

const MIN_SCALE = 0.25;
const MAX_SCALE = 4;
const ZOOM_STEP = 0.3;

function ImageViewer({ src, alt }) {
  const stageRef = useRef(null);
  const [scale, setScale] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const drag = useRef({ active: false, startX: 0, startY: 0, startPx: 0, startPy: 0 });

  const applyZoom = useCallback((delta) => {
    setScale(s => Math.min(MAX_SCALE, Math.max(MIN_SCALE, +(s + delta).toFixed(2))));
  }, []);

  const reset = useCallback(() => {
    setScale(1);
    setPos({ x: 0, y: 0 });
  }, []);

  const onWheel = useCallback((e) => {
    e.preventDefault();
    applyZoom(e.deltaY < 0 ? 0.15 : -0.15);
  }, [applyZoom]);

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [onWheel]);

  const onMouseDown = (e) => {
    if (scale <= 1) return;
    drag.current = { active: true, startX: e.clientX, startY: e.clientY, startPx: pos.x, startPy: pos.y };
  };

  const onMouseMove = (e) => {
    if (!drag.current.active) return;
    setPos({
      x: drag.current.startPx + (e.clientX - drag.current.startX),
      y: drag.current.startPy + (e.clientY - drag.current.startY),
    });
  };

  const onMouseUp = () => { drag.current.active = false; };

  return (
    <div className="flex flex-col h-full">
      {/* Stage */}
      <div
        ref={stageRef}
        className={`relative flex-1 overflow-hidden bg-[var(--bg-secondary)] rounded-tl-xl ${scale > 1 ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'}`}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        style={{ minHeight: '360px' }}
      >
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
          <div style={{ transform: `translate(${pos.x}px, ${pos.y}px) scale(${scale})`, transformOrigin: 'center', transition: drag.current.active ? 'none' : 'transform 0.15s ease' }}>
            <Image
              src={src}
              alt={alt}
              width={560}
              height={420}
              className="object-contain max-w-full max-h-full rounded"
              unoptimized
              draggable={false}
            />
          </div>
        </div>
      </div>

      {/* Controls bar */}
      <div className="flex items-center justify-center gap-1.5 py-3 border-t border-[var(--border)]">
        {/* Zoom out */}
        <button
          onClick={() => applyZoom(-ZOOM_STEP)}
          className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] transition-colors"
          title="Zoom out"
        >
          <svg width="15" height="15" viewBox="0 0 14 14" fill="none">
            <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.2"/>
            <path d="M4 6h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
            <path d="M9.5 9.5l2.5 2.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
        </button>

        {/* Zoom level */}
        <span className="text-xs text-[var(--text-muted)] min-w-[44px] text-center tabular-nums">
          {Math.round(scale * 100)}%
        </span>

        {/* Zoom in */}
        <button
          onClick={() => applyZoom(ZOOM_STEP)}
          className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] transition-colors"
          title="Zoom in"
        >
          <svg width="15" height="15" viewBox="0 0 14 14" fill="none">
            <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.2"/>
            <path d="M4 6h4M6 4v4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
            <path d="M9.5 9.5l2.5 2.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
        </button>

        <div className="w-px h-4 bg-[var(--border)] mx-1" />

        {/* Reset */}
        <button
          onClick={reset}
          className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] transition-colors"
          title="Reset view"
        >
          <svg width="15" height="15" viewBox="0 0 14 14" fill="none">
            <path d="M2 7a5 5 0 1 0 1-3M2 2v3h3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
    </div>
  );
}

export default function GalleryDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      const snap = await getDoc(doc(db, 'gallery', id));
      if (snap.exists()) setItem({ id: snap.id, ...snap.data() });
      setLoading(false);
    };
    fetchData();
  }, [id]);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-[var(--text-secondary)]">Loading...</div>;
  if (!item) return <div className="min-h-screen flex items-center justify-center text-[var(--text-secondary)]">Image not found.</div>;

  return (
    <main className="min-h-screen py-12">
      <div className="container mx-auto px-6 max-w-5xl">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors"
          >
            <svg width="15" height="15" viewBox="0 0 12 12" fill="none">
              <path d="M7 1L2 6l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Gallery
          </button>
          <span className="text-[var(--text-muted)]">/</span>
          <span className="text-[var(--text-primary)] font-medium truncate">{item.title}</span>
        </nav>

        {/* Main card */}
        <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-xl overflow-hidden shadow-sm">
          <div className="grid lg:grid-cols-[1fr_260px] min-h-[460px]">

            {/* Left: image viewer */}
            <ImageViewer src={item.imageUrl} alt={item.title} />

            {/* Right: info panel */}
            <div className="flex flex-col gap-5 p-6 border-t lg:border-t-0 lg:border-l border-[var(--border)]">

              {/* Title + desc */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-2">Photo</p>
                <h1 className="text-2xl font-bold text-[var(--text-primary)] leading-snug mb-3">{item.title}</h1>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                  {item.description || 'No description available.'}
                </p>
              </div>

              {/* Meta panel */}
              {(item.dateTaken || item.camera || item.lens) && (
                <div className="border border-[var(--border)] rounded-lg overflow-hidden divide-y divide-[var(--border)]">
                  {[
                    ['Taken', item.dateTaken],
                    ['Camera', item.camera],
                    ['Lens', item.lens],
                  ].filter(([, v]) => v).map(([label, value]) => (
                    <div key={label} className="px-4 py-2.5">
                      <p className="text-[10px] uppercase tracking-widest text-[var(--text-muted)] mb-0.5">{label}</p>
                      <p className="text-xs font-medium text-[var(--text-primary)]">{value}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Zoom hint */}
              <p className="text-[11px] text-[var(--text-muted)] flex items-center gap-1.5">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <circle cx="5" cy="5" r="3.5" stroke="currentColor" strokeWidth="1.1"/>
                  <path d="M8 8l2.5 2.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
                  <path d="M3.5 5h3M5 3.5v3" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
                </svg>
                Scroll or use controls to zoom · drag to pan
              </p>

              {/* Related project CTA */}
              {item.relatedProjectId && (
                <Link
                  href={`/projects/${item.relatedProjectId}`}
                  className="mt-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-[var(--text-primary)] text-[var(--bg-primary)] rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
                >
                  View related project <ArrowRight size={14} />
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}