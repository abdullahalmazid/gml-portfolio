'use client';
/**
 * StatsSection
 * src/components/sections/StatsSection.js
 *
 * Renders a `kind: 'stats'` section. Each stat is either a live count of a
 * collection or a fixed custom value.
 *
 * Two fixes carried over from the old StatsStrip:
 *   - counts use getCountFromServer, so counting 200 documents costs one read
 *     instead of downloading all 200
 *   - the count-up animation cancels on unmount and on value change; the old
 *     one left requestAnimationFrame loops running and set state after unmount
 *
 * Stat shape: { type: 'auto' | 'custom', source, label, value, suffix }
 */

import MotionDiv from '@/components/ui/MotionDiv';
import { useEffect, useState } from 'react';
import SectionShell from './SectionShell';

export default function StatsSection({ section, index = 0, toolbar = null, forceShow = false }) {
  const stats = Array.isArray(section?.stats) ? section.stats : [];
  const [resolved, setResolved] = useState([]);
  const [isLoading, setIsLoading] = useState(stats.length > 0);

  useEffect(() => {
    if (!stats.length) {
      setResolved([]);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    const run = async () => {
      const needsCount = stats.some((s) => s.type !== 'custom' && s.source);
      let firestore = null;
      let db = null;

      if (needsCount) {
        try {
          firestore = await import('firebase/firestore');
          ({ db } = await import('@/lib/firebase'));
        } catch (err) {
          console.warn('[StatsSection] Firestore unavailable:', err?.message);
        }
      }

      const results = await Promise.all(
        stats.map(async (stat) => {
          if (stat.type === 'custom' || !stat.source) return { ...stat };
          if (!db || !firestore?.getCountFromServer) return { ...stat, value: stat.value ?? '0' };

          try {
            const snap = await firestore.getCountFromServer(
              firestore.collection(db, stat.source)
            );
            return { ...stat, value: String(snap.data().count) };
          } catch (err) {
            console.warn(`[StatsSection] count failed for "${stat.source}":`, err?.code || err?.message);
            return { ...stat, value: stat.value ?? '0' };
          }
        })
      );

      if (!cancelled) {
        setResolved(results);
        setIsLoading(false);
      }
    };

    run();
    return () => { cancelled = true; };
  }, [stats]);

  if (!stats.length && !forceShow) return null;

  return (
    <SectionShell section={section} delay={index * 0.05} toolbar={toolbar}>
      <div className="relative">
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[280px] bg-[var(--accent)]/5 blur-[100px] rounded-full pointer-events-none"
          aria-hidden="true"
        />

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {Array.from({ length: Math.min(stats.length || 4, 4) }).map((_, i) => (
              <div
                key={i}
                className="flex flex-col items-center justify-center p-5 md:p-6 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 animate-pulse"
              >
                <div className="h-9 w-20 bg-black/10 dark:bg-white/10 rounded-lg mb-3" />
                <div className="h-3 w-24 bg-black/10 dark:bg-white/10 rounded-full" />
              </div>
            ))}
          </div>
        ) : resolved.length === 0 ? (
          <p className="text-center text-sm font-medium text-[var(--text-muted)]">
            No stats configured.
          </p>
        ) : (
          <div className="relative grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {resolved.map((stat, i) => (
              <MotionDiv key={`${stat.label}-${i}`} delay={i * 0.1} className="h-full">
                <div className="group h-full flex flex-col items-center justify-center p-5 md:p-6 text-center rounded-2xl bg-[var(--card-bg)] border border-[var(--border)] shadow-sm hover:shadow-lg hover:-translate-y-1 hover:border-[var(--accent)]/30 transition-all duration-500 ease-out">
                  <div className="flex items-baseline justify-center text-4xl md:text-5xl font-extrabold tracking-tighter tabular-nums text-[var(--accent)] mb-2">
                    <AnimatedNumber value={stat.value ?? '0'} />
                    {stat.suffix && (
                      <span className="ml-1 text-2xl md:text-3xl font-bold opacity-80">
                        {stat.suffix}
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] md:text-xs uppercase tracking-widest font-bold text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors duration-300">
                    {stat.label}
                  </div>
                </div>
              </MotionDiv>
            ))}
          </div>
        )}
      </div>
    </SectionShell>
  );
}

function AnimatedNumber({ value }) {
  const target = parseInt(String(value).replace(/[^0-9]/g, ''), 10);
  const isNumeric = Number.isFinite(target);
  const [display, setDisplay] = useState(isNumeric ? 0 : value);

  useEffect(() => {
    if (!isNumeric) {
      setDisplay(value);
      return;
    }

    let raf;
    let cancelled = false;
    let start = null;
    const duration = 1600;

    const step = (now) => {
      if (cancelled) return;
      if (start === null) start = now;

      const progress = Math.min((now - start) / duration, 1);
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setDisplay(Math.floor(eased * target));

      if (progress < 1) raf = requestAnimationFrame(step);
      else setDisplay(target);
    };

    raf = requestAnimationFrame(step);
    return () => { cancelled = true; cancelAnimationFrame(raf); };
  }, [target, value, isNumeric]);

  return <>{isNumeric ? display : value}</>;
}
