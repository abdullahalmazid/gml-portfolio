'use client';
/**
 * HScrollMode
 * src/components/sections/modes/HScrollMode.js
 *
 * A horizontally scrolling strip. Good when there are more images than a grid
 * should show, and on narrow screens where swiping beats scrolling past a
 * tall grid.
 *
 * Options: cardWidth, aspect, snap, arrows
 */

import MotionDiv from '@/components/ui/MotionDiv';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ItemContent, resolveItem } from '../ItemFields';
import { CardLink, EmptyItems, ItemImage } from '../ItemMedia';

const CARD_WIDTH = {
  sm: 'w-56 md:w-64',
  md: 'w-72 md:w-80',
  lg: 'w-80 md:w-[26rem]',
};

export default function HScrollMode({ section, items = [] }) {
  const opts = section?.display?.options || {};
  const collectionName = section?.source?.collection;

  const cardWidth = CARD_WIDTH[opts.cardWidth] || CARD_WIDTH.md;
  const aspect = opts.aspect || '4/3';
  const snap = opts.snap !== false;
  const showArrows = opts.arrows !== false;

  const trackRef = useRef(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  // Arrows disable at the ends rather than sitting there doing nothing.
  const updateEdges = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setAtStart(el.scrollLeft <= 4);
    setAtEnd(el.scrollLeft >= max - 4);
  }, []);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    updateEdges();
    el.addEventListener('scroll', updateEdges, { passive: true });
    window.addEventListener('resize', updateEdges);
    return () => {
      el.removeEventListener('scroll', updateEdges);
      window.removeEventListener('resize', updateEdges);
    };
  }, [updateEdges, items.length]);

  const scrollBy = (direction) => {
    const el = trackRef.current;
    if (!el) return;
    // Scroll by roughly one card, measured from the first child so it stays
    // correct whatever the card width setting is.
    const card = el.firstElementChild;
    const step = card ? card.getBoundingClientRect().width + 24 : el.clientWidth * 0.8;
    el.scrollBy({ left: direction * step, behavior: 'smooth' });
  };

  if (!items.length) return <EmptyItems />;

  return (
    <div className="relative group/strip">
      <div
        ref={trackRef}
        className={`flex gap-6 overflow-x-auto pb-4 -mx-6 px-6 lg:-mx-20 lg:px-20 scrollbar-none ${
          snap ? 'snap-x snap-mandatory' : ''
        }`}
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {items.map((item, i) => {
          const parts = resolveItem(collectionName, item, section);

          return (
            <MotionDiv
              key={item.id}
              delay={Math.min(i, 6) * 0.06}
              className={`${cardWidth} shrink-0 ${snap ? 'snap-start' : ''}`}
            >
              <CardLink
                href={parts.href}
                className="group block h-full rounded-2xl overflow-hidden bg-[var(--card-bg)] ring-1 ring-black/5 dark:ring-white/10 shadow-sm hover:shadow-xl hover:ring-[var(--accent)]/40 transition-all duration-500"
              >
                {parts.image && (
                  <ItemImage
                    src={parts.image}
                    alt={parts.title}
                    aspect={aspect}
                    rounded="rounded-none"
                    sizes="320px"
                    className="w-full ring-0"
                  />
                )}
                <div className="p-4 md:p-5">
                  <ItemContent
                    parts={parts}
                    titleAs="h3"
                    titleSize="sm"
                    bodyLines={2}
                    showLinks={false}
                  />
                </div>
              </CardLink>
            </MotionDiv>
          );
        })}
      </div>

      {showArrows && items.length > 1 && (
        <>
          <ArrowButton side="left" disabled={atStart} onClick={() => scrollBy(-1)} />
          <ArrowButton side="right" disabled={atEnd} onClick={() => scrollBy(1)} />
        </>
      )}
    </div>
  );
}

function ArrowButton({ side, disabled, onClick }) {
  const Icon = side === 'left' ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={side === 'left' ? 'Scroll left' : 'Scroll right'}
      className={`hidden md:flex absolute top-1/2 -translate-y-1/2 ${
        side === 'left' ? '-left-3' : '-right-3'
      } z-20 w-11 h-11 items-center justify-center rounded-full bg-[var(--card-bg)] shadow-lg ring-1 ring-black/10 dark:ring-white/15 text-[var(--text-primary)] transition-all duration-300 hover:bg-[var(--accent)] hover:text-white active:scale-95 ${
        disabled
          ? 'opacity-0 pointer-events-none'
          : 'opacity-0 group-hover/strip:opacity-100'
      }`}
    >
      <Icon size={20} />
    </button>
  );
}
