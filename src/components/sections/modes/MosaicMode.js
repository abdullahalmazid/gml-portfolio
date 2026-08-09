'use client';
/**
 * MosaicMode
 * src/components/sections/modes/MosaicMode.js
 *
 * Masonry tiles of varying height. Image-first — intended for the gallery.
 *
 * Uses CSS multi-columns and a plain <img> rather than next/image. That is
 * deliberate: next/image needs either fixed dimensions or a `fill` parent with
 * a known height, both of which force every tile to the same aspect ratio and
 * destroy the mosaic. Your images come from Cloudinary and are already served
 * `unoptimized` everywhere else, so nothing is lost by letting the browser use
 * each image's intrinsic height.
 *
 * Options: columns, gap, captionOn
 */

import { getCollection } from '@/lib/sections/fieldRegistry';
import MotionDiv from '@/components/ui/MotionDiv';
import { resolveItem } from '../ItemFields';
import { CardLink, EmptyItems } from '../ItemMedia';

// Full class names so Tailwind's scanner keeps them.
const COLUMNS = {
  2: 'columns-1 sm:columns-2',
  3: 'columns-2 lg:columns-3',
  4: 'columns-2 lg:columns-4',
};

const GAP = {
  none: { cols: 'gap-0',           tile: 'mb-0' },
  sm:   { cols: 'gap-2 md:gap-3',  tile: 'mb-2 md:mb-3' },
  md:   { cols: 'gap-4 md:gap-6',  tile: 'mb-4 md:mb-6' },
};

export default function MosaicMode({ section, items = [] }) {
  const opts = section?.display?.options || {};
  const collectionName = section?.source?.collection;

  const columns = COLUMNS[Number(opts.columns)] || COLUMNS[3];
  const gap = GAP[opts.gap] || GAP.sm;
  const captionOn = opts.captionOn || 'hover';

  const withImages = items.filter((i) => i.__image);
  if (!withImages.length) {
    return <EmptyItems label={`No images to show from ${getCollection(collectionName)?.label || 'this collection'}.`} />;
  }

  return (
    <div className={`${columns} ${gap.cols}`}>
      {withImages.map((item, i) => {
        const parts = resolveItem(collectionName, item, section);
        const showCaption = captionOn !== 'never' && Boolean(parts.title);

        return (
          <MotionDiv key={item.id} delay={i * 0.05} className={`break-inside-avoid ${gap.tile}`}>
            <CardLink
              href={parts.href}
              className="group relative block w-full overflow-hidden rounded-xl ring-1 ring-black/5 dark:ring-white/10 bg-[var(--bg-tertiary)]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={parts.image}
                alt={parts.title || ''}
                loading={i < 4 ? 'eager' : 'lazy'}
                className="w-full h-auto block group-hover:scale-[1.03] transition-transform duration-700 ease-out"
              />

              {showCaption && (
                <>
                  <div
                    className={`absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent pointer-events-none transition-opacity duration-500 ${
                      captionOn === 'always' ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                    }`}
                  />
                  <div
                    className={`absolute inset-x-0 bottom-0 p-4 pointer-events-none transition-all duration-500 ${
                      captionOn === 'always'
                        ? 'opacity-100 translate-y-0'
                        : 'opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0'
                    }`}
                  >
                    <p className="text-white font-semibold text-sm leading-snug line-clamp-2 drop-shadow">
                      {parts.title}
                    </p>
                    {parts.metas.length > 0 && (
                      <p className="text-white/70 text-[11px] mt-0.5 line-clamp-1">
                        {parts.metas.map((m) => m.value).join(' • ')}
                      </p>
                    )}
                  </div>
                </>
              )}
            </CardLink>
          </MotionDiv>
        );
      })}
    </div>
  );
}
