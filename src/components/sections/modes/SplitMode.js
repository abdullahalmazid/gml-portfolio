'use client';
/**
 * SplitMode
 * src/components/sections/modes/SplitMode.js
 *
 * A single item shown large: image on one side, text on the other. This is
 * what the old `side-left` / `side-right` layouts become — the image side is
 * now an option rather than two separate layout names.
 *
 * Options: imageSide, aspect, glow
 */

import MotionDiv from '@/components/ui/MotionDiv';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { ItemContent, resolveItem } from '../ItemFields';
import { EmptyItems, ItemImage } from '../ItemMedia';

export default function SplitMode({ section, items = [] }) {
  const opts = section?.display?.options || {};
  const collectionName = section?.source?.collection;

  const imageOnRight = (opts.imageSide || 'right') === 'right';
  const aspect = opts.aspect || '4/3';
  const glow = opts.glow !== false;

  const item = items[0];
  if (!item) return <EmptyItems />;

  const parts = resolveItem(collectionName, item, section);

  return (
    <MotionDiv delay={0.05}>
      <div className="grid md:grid-cols-2 gap-10 lg:gap-16 items-center">
        {/* IMAGE */}
        <div
          className={`relative order-1 ${imageOnRight ? 'md:order-2' : 'md:order-1'}`}
        >
          {glow && (
            <div
              className="absolute -inset-6 bg-gradient-to-tr from-[var(--accent)]/25 to-transparent blur-3xl rounded-full opacity-60 pointer-events-none"
              aria-hidden="true"
            />
          )}

          {parts.image ? (
            <ItemImage
              src={parts.image}
              alt={parts.title}
              aspect={aspect}
              rounded="rounded-2xl"
              zoom={false}
              priority
              sizes="(max-width: 768px) 100vw, 50vw"
              className="relative w-full shadow-2xl"
            />
          ) : (
            <div className="relative w-full aspect-[4/3] rounded-2xl bg-[var(--bg-tertiary)] ring-1 ring-black/5 dark:ring-white/10 flex items-center justify-center text-sm font-medium text-[var(--text-muted)]">
              No image available
            </div>
          )}
        </div>

        {/* TEXT */}
        <div className={`order-2 ${imageOnRight ? 'md:order-1' : 'md:order-2'}`}>
          <ItemContent
            parts={parts}
            titleAs="h3"
            titleSize="lg"
            bodyLines={6}
            showLinks
          />

          {parts.href && (
            <div className="mt-8">
              <Link
                href={parts.href}
                className="group inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[var(--accent)] text-[var(--accent-contrast)] font-semibold text-sm shadow-md hover:shadow-lg active:scale-95 transition-all duration-300"
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
}