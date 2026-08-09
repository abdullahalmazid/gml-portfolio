'use client';
/**
 * ItemMedia
 * src/components/sections/ItemMedia.js
 *
 * The two pieces every display mode needs but shouldn't reimplement:
 * an item image, and the link wrapper that degrades to a plain div when an
 * item has no detail page.
 */

import Image from 'next/image';
import Link from 'next/link';

export const ASPECT = {
  '4/3':  'aspect-[4/3]',
  '16/9': 'aspect-[16/9]',
  '1/1':  'aspect-square',
  '3/4':  'aspect-[3/4]',
};

/**
 * `unoptimized` matches the rest of the site: images are served from
 * Cloudinary, which already handles transformation and CDN delivery.
 */
export function ItemImage({
  src,
  alt = '',
  aspect = '4/3',
  className = '',
  imgClassName = '',
  rounded = 'rounded-xl',
  zoom = true,
  priority = false,
  sizes = '(max-width: 768px) 100vw, 33vw',
}) {
  if (!src) return null;

  return (
    <div
      className={`relative overflow-hidden shrink-0 ${ASPECT[aspect] || ASPECT['4/3']} ${rounded} ring-1 ring-black/5 dark:ring-white/10 bg-[var(--bg-tertiary)] ${className}`}
    >
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        unoptimized
        className={`object-cover ${zoom ? 'group-hover:scale-105 transition-transform duration-700 ease-out' : ''} ${imgClassName}`}
      />
    </div>
  );
}

/** Fixed-size thumbnail for list rows, where aspect ratio doesn't apply. */
export function ItemThumb({ src, alt = '', size = 'h-24 w-24', className = '' }) {
  if (!src) return null;
  return (
    <div className={`relative ${size} shrink-0 rounded-xl overflow-hidden ring-1 ring-black/5 dark:ring-white/10 bg-[var(--bg-tertiary)] ${className}`}>
      <Image
        src={src}
        alt={alt}
        fill
        sizes="96px"
        unoptimized
        className="object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
      />
    </div>
  );
}

/**
 * Wraps a card. Renders a Link when the item has a detail route, and a plain
 * div otherwise — so gallery images (which have no detail page in some
 * configurations) don't become dead links.
 */
export function CardLink({ href, children, className = '', ...rest }) {
  if (!href) {
    return <div className={className} {...rest}>{children}</div>;
  }
  return (
    <Link href={href} className={className} {...rest}>
      {children}
    </Link>
  );
}

/** Consistent empty state, shown when a section resolves to nothing. */
export function EmptyItems({ label = 'Nothing to show here yet.' }) {
  return (
    <div className="py-10 text-center text-sm font-medium text-[var(--text-muted)]">
      {label}
    </div>
  );
}
