'use client';
/**
 * Skeleton
 * src/components/ui/Skeleton.js
 *
 * Placeholders that hold the shape of the content still loading.
 *
 * The point isn't decoration: a centred "Loading…" collapses the layout, so the
 * page jumps when content arrives and reads as broken while it waits. A
 * skeleton occupies the same space the real thing will, so the only change on
 * arrival is text appearing.
 *
 * Screen readers get a single "Loading" announcement rather than a stream of
 * meaningless boxes, which is what `aria-busy` plus `aria-hidden` children do.
 */

const BASE = 'bg-black/5 dark:bg-white/10 animate-pulse rounded';

export function SkeletonLine({ width = 'w-full', height = 'h-4', className = '' }) {
  return <div className={`${BASE} ${width} ${height} ${className}`} />;
}

export function SkeletonBlock({ className = '' }) {
  return <div className={`${BASE} ${className}`} />;
}

/** A paragraph's worth of lines, last one short like real text. */
export function SkeletonParagraph({ lines = 3, className = '' }) {
  return (
    <div className={`space-y-2.5 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonLine key={i} width={i === lines - 1 ? 'w-2/3' : 'w-full'} height="h-3.5" />
      ))}
    </div>
  );
}

/** Wraps any skeleton so assistive tech announces it once and ignores the rest. */
export function SkeletonRegion({ label = 'Loading', children, className = '' }) {
  return (
    <div role="status" aria-busy="true" aria-live="polite" className={className}>
      <span className="sr-only">{label}</span>
      <div aria-hidden="true">{children}</div>
    </div>
  );
}

/**
 * The shape shared by every detail page: hero band, title, metadata, body,
 * and a supporting image.
 */
export function DetailPageSkeleton({ withImage = true }) {
  return (
    <SkeletonRegion label="Loading page">
      <div className="min-h-screen">
        <SkeletonBlock className="w-full h-[30vh] rounded-none" />

        <div className="container mx-auto px-6 max-w-4xl py-12">
          <SkeletonLine width="w-24" height="h-3" className="mb-6" />
          <SkeletonLine width="w-3/4" height="h-9" className="mb-4" />

          <div className="flex gap-3 mb-10">
            <SkeletonLine width="w-28" height="h-3" />
            <SkeletonLine width="w-20" height="h-3" />
            <SkeletonLine width="w-16" height="h-3" />
          </div>

          {withImage && <SkeletonBlock className="w-full aspect-[16/9] rounded-2xl mb-10" />}

          <SkeletonParagraph lines={4} className="mb-8" />
          <SkeletonParagraph lines={3} />
        </div>
      </div>
    </SkeletonRegion>
  );
}

/** Listing pages: hero band, then a grid of cards. */
export function ListPageSkeleton({ count = 6, columns = 3 }) {
  const grid = { 2: 'md:grid-cols-2', 3: 'md:grid-cols-3', 4: 'md:grid-cols-4' }[columns] || 'md:grid-cols-3';

  return (
    <SkeletonRegion label="Loading page">
      <div className="min-h-screen">
        <SkeletonBlock className="w-full h-[30vh] rounded-none" />

        <div className="container mx-auto px-6 py-14">
          <div className={`grid grid-cols-1 ${grid} gap-8`}>
            {Array.from({ length: count }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-[var(--border)] overflow-hidden">
                <SkeletonBlock className="w-full aspect-[4/3] rounded-none" />
                <div className="p-5 space-y-3">
                  <SkeletonLine width="w-3/4" height="h-5" />
                  <SkeletonLine width="w-1/3" height="h-3" />
                  <SkeletonParagraph lines={2} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </SkeletonRegion>
  );
}

export default SkeletonLine;
