'use client';
/**
 * CompactMode
 * src/components/sections/modes/CompactMode.js
 *
 * Dense numbered lines, no images and no body text. This is the citation view
 * — a publications list that reads like a CV rather than a set of cards.
 *
 * The mode declares only title/subtitle/meta/link support, so ItemFields
 * drops body and image fields even if they are toggled on.
 *
 * Options: columns, showIndex, separator
 */

import MotionDiv from '@/components/ui/MotionDiv';
import { ArrowUpRight } from 'lucide-react';
import { ItemMeta, ItemTitle, resolveItem } from '../ItemFields';
import { CardLink, EmptyItems } from '../ItemMedia';

export default function CompactMode({ section, items = [] }) {
  const opts = section?.display?.options || {};
  const collectionName = section?.source?.collection;

  const twoColumns = Number(opts.columns) === 2;
  const showIndex = opts.showIndex !== false;
  const separator = opts.separator || 'dot';

  if (!items.length) return <EmptyItems />;

  return (
    <ol
      className={`${
        twoColumns ? 'grid md:grid-cols-2 gap-x-12' : ''
      } divide-y divide-[var(--border)] border-y border-[var(--border)]`}
    >
      {items.map((item, i) => {
        const parts = resolveItem(collectionName, item, section);
        const external = parts.links.find((l) => l.href);

        return (
          <li key={item.id}>
            <MotionDiv delay={Math.min(i, 8) * 0.04}>
              <CardLink
                href={parts.href}
                className="group flex gap-4 items-baseline py-4 -mx-3 px-3 rounded-lg hover:bg-black/[0.02] dark:hover:bg-white/[0.03] transition-colors"
              >
                {showIndex && (
                  <span className="shrink-0 w-6 text-xs font-bold tabular-nums text-[var(--text-muted)] group-hover:text-[var(--accent)] transition-colors">
                    {i + 1}.
                  </span>
                )}

                <div className="flex-1 min-w-0">
                  <ItemTitle as="h3" size="sm" className="leading-snug">
                    {parts.title}
                  </ItemTitle>

                  {parts.subtitle && (
                    <span className="text-xs font-semibold text-[var(--accent)]">
                      {parts.subtitle}
                    </span>
                  )}

                  <ItemMeta metas={parts.metas} separator={separator} className="mt-1" />
                </div>

                {external && (
                  <a
                    href={external.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    aria-label={external.label}
                    className="shrink-0 text-[var(--border)] group-hover:text-[var(--accent)] transition-colors"
                  >
                    <ArrowUpRight size={16} />
                  </a>
                )}
              </CardLink>
            </MotionDiv>
          </li>
        );
      })}
    </ol>
  );
}
