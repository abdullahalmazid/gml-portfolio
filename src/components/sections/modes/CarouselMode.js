'use client';
/**
 * CarouselMode
 * src/components/sections/modes/CarouselMode.js
 *
 * One item at a time, image crossfading, with progress bars.
 * This is where the old ProjectDisplay lands — rebuilt rather than ported,
 * because it had two bugs worth not carrying forward:
 *
 *   1. TWO COMPETING TIMERS. The section rotated the featured project every
 *      5s while the display rotated images every 3.5s, so a project with four
 *      images never reached image three. Here there is ONE clock: items are
 *      flattened into slides (item x image), and the clock advances slides.
 *
 *   2. HOVER DIDN'T PAUSE. The old progress bar was a CSS transition whose
 *      duration flipped to 0ms on hover, which snapped the bar to full instead
 *      of freezing it. Here progress is driven by requestAnimationFrame and
 *      written straight to the DOM, so hover genuinely pauses mid-fill and
 *      resumes from the same point.
 *
 * Writing progress to a ref rather than state matters: a bar updated through
 * React state would re-render this component ~60 times a second.
 *
 * Options: autoplay, interval, textSide, indicators
 */

import MotionDiv from '@/components/ui/MotionDiv';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ItemContent, resolveItem } from '../ItemFields';
import { EmptyItems } from '../ItemMedia';

export default function CarouselMode({ section, items = [] }) {
  const opts = section?.display?.options || {};
  const collectionName = section?.source?.collection;

  const autoplay = opts.autoplay !== false;
  const interval = Math.max(2, Number(opts.interval) || 5);
  const textOnLeft = (opts.textSide || 'left') === 'left';
  const showIndicators = opts.indicators !== false;

  // Flatten to slides so one clock drives everything.
  const slides = useMemo(
    () =>
      items.flatMap((item, itemIndex) => {
        const images = item.__images?.length ? item.__images : [null];
        return images.map((image, imageIndex) => ({
          item,
          itemIndex,
          image,
          imageIndex,
          imageCount: images.length,
        }));
      }),
    [items]
  );

  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const progressRef = useRef(0);
  const barRefs = useRef([]);

  // Reset when the underlying items change (a different collection, or the
  // admin edited the selection) so we can't point past the end of the array.
  useEffect(() => {
    setIndex(0);
    progressRef.current = 0;
  }, [slides.length]);

  const current = slides[index] || slides[0];

  const goTo = useCallback((next) => {
    progressRef.current = 0;
    setIndex(next);
  }, []);

  const next = useCallback(() => {
    goTo((index + 1) % Math.max(slides.length, 1));
  }, [goTo, index, slides.length]);

  const prev = useCallback(() => {
    goTo((index - 1 + slides.length) % Math.max(slides.length, 1));
  }, [goTo, index, slides.length]);

  /** Paint the bars for a given fractional progress through the current slide. */
  const paintBars = useCallback(
    (progress) => {
      if (!current) return;
      barRefs.current.forEach((bar, itemIndex) => {
        if (!bar) return;
        let pct;
        if (itemIndex < current.itemIndex) pct = 100;
        else if (itemIndex > current.itemIndex) pct = 0;
        else pct = ((current.imageIndex + progress) / current.imageCount) * 100;
        bar.style.width = `${pct}%`;
      });
    },
    [current]
  );

  // Repaint immediately on slide change so a manual jump lands correctly.
  useEffect(() => {
    paintBars(progressRef.current);
  }, [paintBars, index]);

  // The single clock.
  useEffect(() => {
    if (!autoplay || paused || slides.length <= 1) return;

    const duration = interval * 1000;
    let raf;
    let start = null;

    const step = (now) => {
      // Resuming after a pause continues from the stored progress rather
      // than restarting the slide.
      if (start === null) start = now - progressRef.current * duration;

      const progress = Math.min((now - start) / duration, 1);
      progressRef.current = progress;
      paintBars(progress);

      if (progress >= 1) {
        progressRef.current = 0;
        setIndex((i) => (i + 1) % slides.length);
        return; // effect re-runs for the new slide
      }
      raf = requestAnimationFrame(step);
    };

    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [autoplay, paused, interval, slides.length, index, paintBars]);

  if (!slides.length || !current) return <EmptyItems />;

  const parts = resolveItem(collectionName, current.item, section);
  const itemCount = items.length;

  return (
    <MotionDiv delay={0.05}>
      <div className="grid md:grid-cols-12 gap-8 lg:gap-16 items-center">
        {/* TEXT */}
        <div
          className={`flex flex-col justify-center md:col-span-5 order-2 ${
            textOnLeft ? 'md:order-1' : 'md:order-2'
          }`}
        >
          {parts.featured && (
            <span className="inline-flex self-start items-center gap-1.5 mb-5 px-3 py-1 rounded-full bg-[var(--accent)]/10 text-[var(--accent)] text-[10px] font-bold tracking-widest uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-pulse" />
              Featured
            </span>
          )}

          <ItemContent
            parts={parts}
            titleAs="h3"
            titleSize="xl"
            bodyLines={5}
          />

          {parts.href && (
            <div className="mt-8">
              <Link
                href={parts.href}
                className="group inline-flex items-center gap-3 text-[var(--accent)] font-semibold hover:opacity-80 transition-opacity"
              >
                Read more
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[var(--accent)]/10 group-hover:bg-[var(--accent)] group-hover:text-white transition-colors duration-300">
                  <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
                </span>
              </Link>
            </div>
          )}
        </div>

        {/* IMAGE FRAME */}
        <div
          className={`group/frame relative aspect-[4/3] md:aspect-auto md:h-[520px] w-full rounded-[1.75rem] overflow-hidden shadow-2xl ring-1 ring-black/5 dark:ring-white/10 bg-[var(--bg-tertiary)] md:col-span-7 order-1 ${
            textOnLeft ? 'md:order-2' : 'md:order-1'
          }`}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onFocus={() => setPaused(true)}
          onBlur={() => setPaused(false)}
        >
          {slides.some((s) => s.image) ? (
            slides.map((slide, i) =>
              slide.image ? (
                <Image
                  key={`${slide.item.id}-${i}`}
                  src={slide.image}
                  alt={`${parts.title} image ${slide.imageIndex + 1}`}
                  fill
                  sizes="(max-width: 768px) 100vw, 60vw"
                  priority={i === 0}
                  unoptimized
                  className={`object-cover transition-all duration-1000 ease-in-out ${
                    i === index ? 'opacity-100 scale-100 z-10' : 'opacity-0 scale-105 z-0'
                  }`}
                />
              ) : null
            )
          ) : (
            <div className="flex items-center justify-center h-full text-sm font-medium text-[var(--text-muted)]">
              No images available
            </div>
          )}

          <div className="absolute inset-0 z-20 pointer-events-none bg-gradient-to-t from-black/70 via-black/5 to-transparent opacity-80 group-hover/frame:opacity-100 transition-opacity duration-500" />

          {slides.length > 1 && (
            <>
              <NavButton side="left" onClick={prev} />
              <NavButton side="right" onClick={next} />

              {showIndicators && itemCount > 1 && (
                <div className="absolute bottom-5 left-0 right-0 z-30 flex gap-2 px-6">
                  {items.map((item, itemIndex) => (
                    <button
                      key={item.id}
                      type="button"
                      aria-label={`Go to item ${itemIndex + 1}`}
                      onClick={() => goTo(slides.findIndex((s) => s.itemIndex === itemIndex))}
                      className="h-1.5 flex-1 rounded-full overflow-hidden bg-white/30 backdrop-blur-sm"
                    >
                      <span
                        ref={(el) => { barRefs.current[itemIndex] = el; }}
                        className="block h-full w-0 bg-white rounded-full"
                      />
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </MotionDiv>
  );
}

function NavButton({ side, onClick }) {
  const Icon = side === 'left' ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      onClick={(e) => { e.preventDefault(); onClick(); }}
      aria-label={side === 'left' ? 'Previous' : 'Next'}
      className={`absolute top-1/2 -translate-y-1/2 ${
        side === 'left' ? 'left-4' : 'right-4'
      } z-30 w-11 h-11 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white opacity-0 group-hover/frame:opacity-100 hover:bg-white/30 hover:scale-105 active:scale-95 transition-all duration-300`}
    >
      <Icon size={22} />
    </button>
  );
}
