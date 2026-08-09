'use client';
/**
 * ListMode
 * src/components/sections/modes/ListMode.js
 *
 * One item per row. The default for text-heavy collections — publications,
 * experience — where a reader scans headlines and metadata rather than images.
 *
 * Options: columns, thumbnail, dividers, showIndex, bodyLines
 */

import MotionDiv from '@/components/ui/MotionDiv';
import { ArrowRight } from 'lucide-react';
import { ItemContent, ItemLinks, resolveItem } from '../ItemFields';
import { CardLink, EmptyItems, ItemThumb } from '../ItemMedia';

export default function ListMode({ section, items = [] }) {
  const opts = section?.display?.options || {};
  const collectionName = section?.source?.collection;

  const columns = Number(opts.columns) === 2 ? 2 : 1;
  const thumbSide = opts.thumbnail || 'left';
  const showThumb = thumbSide !== 'none';
  const bodyLines = Number.isFinite(opts.bodyLines) ? opts.bodyLines : 2;

  if (!items.length) return <EmptyItems />;

  return (
    <div
      className={`grid ${columns === 2 ? 'md:grid-cols-2 gap-x-12' : 'grid-cols-1'} ${opts.dividers
          ? 'divide-y divide-[var(--border)] border-t border-[var(--border)]'
          : 'gap-y-2'
        }`}
    >
      {items.map((item, i) => {
        const parts = resolveItem(collectionName, item, section);

        return (
          <MotionDiv key={item.id} delay={i * 0.06}>
            {/* ItemLinks sits after the CardLink, never inside it. */}
            <CardLink
              href={parts.href}
              className="group flex gap-5 md:gap-6 py-6 items-start -mx-4 px-4 rounded-xl hover:bg-black/[0.02] dark:hover:bg-white/[0.03] transition-colors"
            >
              {opts.showIndex && (
                <span className="shrink-0 mt-1 w-7 text-sm font-bold tabular-nums text-[var(--text-muted)] group-hover:text-[var(--accent)] transition-colors">
                  {String(i + 1).padStart(2, '0')}
                </span>
              )}

              {showThumb && thumbSide === 'left' && parts.image && (
                <ItemThumb src={parts.image} alt={parts.title} className="mt-1" />
              )}

              <ItemContent
                parts={parts}
                titleAs="h3"
                titleSize="md"
                bodyLines={bodyLines}
                className="flex-1 min-w-0"
              />

              {showThumb && thumbSide === 'right' && parts.image && (
                <ItemThumb src={parts.image} alt={parts.title} className="mt-1" />
              )}

              {parts.href && (
                <span className="pt-1 shrink-0">
                  <ArrowRight
                    size={18}
                    className="text-[var(--border)] group-hover:text-[var(--accent)] group-hover:translate-x-1.5 transition-all duration-300"
                  />
                </span>
              )}
            </CardLink>

            {parts.links.length > 0 && (
              <div className={`-mt-3 pb-4 ${opts.showIndex ? 'pl-11' : ''} ${showThumb && thumbSide === 'left' && parts.image ? 'md:pl-[7.25rem]' : ''}`}>
                <ItemLinks links={parts.links} className="mt-0" />
              </div>
            )}
          </MotionDiv>
        );
      })}
    </div>
  );
}