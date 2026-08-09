'use client';
/**
 * TimelineMode
 * src/components/sections/modes/TimelineMode.js
 *
 * A vertical spine with a marker per item — the "time rope" view. Suits
 * anything with a date or duration: publications by year, roles by duration,
 * degrees by period.
 *
 * The marker text comes from whichever meta field the section nominates
 * (`markerField`). Whatever is promoted to the marker is removed from the
 * inline meta line so it isn't printed twice.
 *
 * Options: side, markerField, connector, bodyLines
 */

import MotionDiv from '@/components/ui/MotionDiv';
import { ItemContent, ItemLinks, resolveItem } from '../ItemFields';
import { CardLink, EmptyItems, ItemThumb } from '../ItemMedia';

/**
 * Pull the marker out of the resolved meta list.
 * Falls back to the first available meta field when none is nominated, so a
 * freshly created timeline section looks right before anything is configured.
 */
function splitMarker(parts, markerField) {
  if (!parts.metas.length) return { marker: null, metas: parts.metas };

  const index = markerField
    ? parts.metas.findIndex((m) => m.key === markerField)
    : 0;

  if (index === -1) return { marker: null, metas: parts.metas };

  return {
    marker: parts.metas[index].value,
    metas: parts.metas.filter((_, i) => i !== index),
  };
}

export default function TimelineMode({ section, items = [] }) {
  const opts = section?.display?.options || {};
  const collectionName = section?.source?.collection;

  const alternating = opts.side === 'alternating';
  const dashed = opts.connector === 'dashed';
  const bodyLines = Number.isFinite(opts.bodyLines) ? opts.bodyLines : 2;

  if (!items.length) return <EmptyItems />;

  return (
    <div className="relative">
      {/* The spine. Centred when alternating, left-hand otherwise.
          It stops short at top and bottom so it doesn't run past the end dots. */}
      <div
        className={`absolute top-3 bottom-3 w-px ${dashed
            ? 'border-l border-dashed border-[var(--border)]'
            : 'bg-gradient-to-b from-transparent via-[var(--border)] to-transparent'
          } ${alternating ? 'left-4 md:left-1/2 md:-translate-x-px' : 'left-4'}`}
        aria-hidden="true"
      />

      <ol className="space-y-8 md:space-y-10">
        {items.map((item, i) => {
          const parts = resolveItem(collectionName, item, section);
          const { marker, metas } = splitMarker(parts, opts.markerField);
          const flip = alternating && i % 2 === 1;

          return (
            <li key={item.id} className="relative">
              <MotionDiv delay={i * 0.08}>
                <div
                  className={`relative flex ${alternating ? 'md:items-center' : ''
                    } ${flip ? 'md:flex-row-reverse' : ''}`}
                >
                  {/* Dot on the spine */}
                  <span
                    className={`absolute top-2 z-10 flex items-center justify-center ${alternating ? 'left-4 md:left-1/2 md:-translate-x-1/2' : 'left-4'
                      } -translate-x-1/2`}
                    aria-hidden="true"
                  >
                    <span className="w-3 h-3 rounded-full bg-[var(--accent)] ring-4 ring-[var(--bg-primary)]" />
                  </span>

                  {/* Marker: inline on mobile, opposite the card on desktop
                      when alternating. */}
                  {marker && (
                    <div
                      className={`hidden md:block shrink-0 ${alternating
                          ? `md:w-1/2 ${flip ? 'md:pl-12 md:text-left' : 'md:pr-12 md:text-right'}`
                          : 'w-28 pl-10 pr-4 text-left'
                        }`}
                    >
                      <span className="inline-block text-sm font-bold tabular-nums tracking-wide text-[var(--accent)]">
                        {marker}
                      </span>
                    </div>
                  )}

                  {/* Card */}
                  <div
                    className={`flex-1 min-w-0 pl-10 ${alternating
                        ? `md:w-1/2 md:flex-none ${flip ? 'md:pr-12 md:pl-0' : 'md:pl-12'}`
                        : marker
                          ? 'md:pl-0'
                          : 'md:pl-10'
                      }`}
                  >
                    <CardLink
                      href={parts.href}
                      className="group block rounded-2xl p-5 md:p-6 bg-[var(--card-bg)] ring-1 ring-black/5 dark:ring-white/10 shadow-sm hover:shadow-lg hover:ring-[var(--accent)]/40 transition-all duration-500"
                    >
                      {/* Marker repeats on mobile, where the desktop column is hidden */}
                      {marker && (
                        <span className="md:hidden inline-block mb-2 text-xs font-bold tracking-wide text-[var(--accent)]">
                          {marker}
                        </span>
                      )}

                      <div className="flex gap-4 items-start">
                        {parts.image && (
                          <ItemThumb src={parts.image} alt={parts.title} size="h-14 w-14" />
                        )}
                        <ItemContent
                          parts={{ ...parts, metas }}
                          titleAs="h3"
                          titleSize="md"
                          bodyLines={bodyLines}
                          className="flex-1 min-w-0"
                        />
                      </div>
                    </CardLink>

                    {parts.links.length > 0 && (
                      <ItemLinks links={parts.links} className="mt-2 px-5 md:px-6" />
                    )}
                  </div>
                </div>
              </MotionDiv>
            </li>
          );
        })}
      </ol>
    </div>
  );
}