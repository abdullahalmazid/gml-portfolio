'use client';
/**
 * FeaturedMode
 * src/components/sections/modes/FeaturedMode.js
 *
 * One item shown large, the rest compact beneath or beside it. Useful on the
 * home page where the newest paper or project deserves weight but you still
 * want the others visible.
 *
 * The remainder is rendered by ListMode or GridMode rather than reimplemented,
 * so the small cards look identical to a standalone list or grid section.
 *
 * Options: featuredSide, restLayout, bodyLines
 */

import MotionDiv from '@/components/ui/MotionDiv';
import { defaultModeOptions } from '@/lib/sections/modeRegistry';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { ItemContent, resolveItem } from '../ItemFields';
import { EmptyItems, ItemImage } from '../ItemMedia';
import GridMode from './GridMode';
import ListMode from './ListMode';

export default function FeaturedMode({ section, items = [] }) {
  const opts = section?.display?.options || {};
  const collectionName = section?.source?.collection;

  const side = opts.featuredSide || 'left';
  const restAsGrid = (opts.restLayout || 'list') === 'grid';
  const bodyLines = Number.isFinite(opts.bodyLines) ? opts.bodyLines : 3;

  if (!items.length) return <EmptyItems />;

  const [hero, ...rest] = items;
  const parts = resolveItem(collectionName, hero, section);

  // A synthetic section so the remainder renders with that mode's own
  // defaults rather than inheriting featured-mode options.
  const restMode = restAsGrid ? 'grid' : 'list';
  const restSection = {
    ...section,
    display: {
      mode: restMode,
      options: {
        ...defaultModeOptions(restMode),
        bodyLines: restAsGrid ? 2 : 1,
        ...(restAsGrid ? { columns: 3, gap: 'md' } : { dividers: true, thumbnail: 'left' }),
      },
    },
  };

  const RestComponent = restAsGrid ? GridMode : ListMode;
  const stacked = side === 'top';

  const heroBlock = (
    <MotionDiv delay={0.05}>
      <div className={stacked ? 'grid md:grid-cols-2 gap-8 lg:gap-12 items-center' : ''}>
        {parts.image && (
          <ItemImage
            src={parts.image}
            alt={parts.title}
            aspect={stacked ? '4/3' : '16/9'}
            rounded="rounded-2xl"
            zoom={false}
            priority
            sizes="(max-width: 768px) 100vw, 50vw"
            className="w-full shadow-xl mb-6 md:mb-0"
          />
        )}

        <div>
          <span className="inline-flex items-center gap-1.5 mb-4 px-3 py-1 rounded-full bg-[var(--accent)]/10 text-[var(--accent)] text-[10px] font-bold tracking-widest uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-pulse" />
            Featured
          </span>

          <ItemContent
            parts={parts}
            titleAs="h3"
            titleSize="lg"
            bodyLines={bodyLines + 2}
            showLinks
          />

          {parts.href && (
            <div className="mt-6">
              <Link
                href={parts.href}
                className="group inline-flex items-center gap-2 text-[var(--accent)] font-semibold text-sm hover:opacity-80 transition-opacity"
              >
                Read more
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </MotionDiv>
  );

  const restBlock = rest.length > 0 && (
    <div className={stacked ? 'mt-14' : ''}>
      <RestComponent section={restSection} items={rest} />
    </div>
  );

  if (stacked) {
    return (
      <div>
        {heroBlock}
        {restBlock}
      </div>
    );
  }

  return (
    <div className="grid lg:grid-cols-12 gap-10 lg:gap-14 items-start">
      <div className={`lg:col-span-6 ${side === 'right' ? 'lg:order-2' : 'lg:order-1'}`}>
        {heroBlock}
      </div>
      <div className={`lg:col-span-6 ${side === 'right' ? 'lg:order-1' : 'lg:order-2'}`}>
        {restBlock}
      </div>
    </div>
  );
}