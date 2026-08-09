'use client';
/**
 * GridMode
 * src/components/sections/modes/GridMode.js
 *
 * Equal cards in a responsive grid. The general-purpose mode — works for any
 * collection, with or without images.
 *
 * Options: columns, aspect, gap, cardStyle, bodyLines
 */

import MotionDiv from '@/components/ui/MotionDiv';
import { ArrowRight } from 'lucide-react';
import { ItemContent, resolveItem } from '../ItemFields';
import { CardLink, EmptyItems, ItemImage } from '../ItemMedia';

// Written out in full rather than interpolated, so Tailwind's scanner keeps them.
const COLUMNS = {
  2: 'grid-cols-1 sm:grid-cols-2',
  3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-2 lg:grid-cols-4',
};

const GAP = { sm: 'gap-4', md: 'gap-6 md:gap-8', lg: 'gap-8 md:gap-12' };

const CARD_STYLE = {
  elevated: 'bg-[var(--card-bg)] shadow-sm ring-1 ring-black/5 dark:ring-white/10 hover:shadow-xl hover:-translate-y-1.5 hover:ring-[var(--accent)]/40',
  outlined: 'bg-transparent border border-[var(--border)] hover:border-[var(--accent)] hover:-translate-y-1',
  flat:     'bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)]',
};

export default function GridMode({ section, items = [] }) {
  const opts = section?.display?.options || {};
  const collectionName = section?.source?.collection;

  const columns = COLUMNS[Number(opts.columns)] || COLUMNS[3];
  const gap = GAP[opts.gap] || GAP.md;
  const cardStyle = CARD_STYLE[opts.cardStyle] || CARD_STYLE.elevated;
  const bodyLines = Number.isFinite(opts.bodyLines) ? opts.bodyLines : 3;
  const aspect = opts.aspect || '4/3';

  if (!items.length) return <EmptyItems />;

  const sizes =
    Number(opts.columns) === 4
      ? '(max-width: 640px) 50vw, 25vw'
      : '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw';

  return (
    <div className={`grid ${columns} ${gap}`}>
      {items.map((item, i) => {
        const parts = resolveItem(collectionName, item, section);

        return (
          <MotionDiv key={item.id} delay={i * 0.08} className="h-full">
            <CardLink
              href={parts.href}
              className={`group flex flex-col h-full rounded-2xl overflow-hidden transition-all duration-500 ${cardStyle}`}
            >
              {parts.image && (
                <ItemImage
                  src={parts.image}
                  alt={parts.title}
                  aspect={aspect}
                  rounded="rounded-none"
                  sizes={sizes}
                  priority={i === 0}
                  className="w-full border-b border-black/5 dark:border-white/5 ring-0"
                />
              )}

              <div className="p-5 md:p-6 flex flex-col flex-grow justify-between">
                <ItemContent
                  parts={parts}
                  titleAs="h3"
                  titleSize="md"
                  bodyLines={bodyLines}
                />

                {parts.href && (
                  <span className="mt-5 inline-flex items-center gap-1 text-sm font-bold text-[var(--accent)] opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                    Read more
                    <ArrowRight size={15} />
                  </span>
                )}
              </div>
            </CardLink>
          </MotionDiv>
        );
      })}
    </div>
  );
}
