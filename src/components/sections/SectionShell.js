'use client';
/**
 * SectionShell
 * src/components/sections/SectionShell.js
 *
 * The band every section sits in: background, padding, width, heading,
 * subtitle and the optional "Explore All" call to action.
 *
 * Display modes render ONLY their items. Everything around the items lives
 * here, so a heading looks identical whether it sits above a grid, a timeline
 * or a custom block layout — and changing the heading treatment is one edit
 * rather than nine.
 */

import MotionDiv from '@/components/ui/MotionDiv';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

const PADDING = {
  sm: 'py-10 md:py-12',
  md: 'py-14 md:py-20',
  lg: 'py-20 md:py-28',
  xl: 'py-28 md:py-36',
};

const WIDTH = {
  narrow: 'max-w-3xl mx-auto px-6',
  normal: 'container mx-auto px-6 lg:px-20',
  wide:   'max-w-[1400px] mx-auto px-6 lg:px-12',
  full:   'w-full px-4 md:px-8',
};

const ALIGN = {
  left:   { text: 'text-left',   items: 'items-start',  line: 'mr-auto' },
  center: { text: 'text-center', items: 'items-center', line: 'mx-auto' },
  right:  { text: 'text-right',  items: 'items-end',    line: 'ml-auto' },
};

/** A background value is custom when it's a hex colour or a CSS variable. */
function backgroundFor(bgColor) {
  const clean = (bgColor || '').trim();
  const isCustom = clean.startsWith('#') || clean.startsWith('var(');
  return {
    style: isCustom ? { backgroundColor: clean } : {},
    className: isCustom ? '' : 'bg-[var(--bg-primary)]',
  };
}

export default function SectionShell({ section, children, delay = 0, toolbar = null }) {
  const shell = section?.shell || {};
  const align = ALIGN[shell.titleAlign] || ALIGN.left;
  const bg = backgroundFor(shell.bgColor);

  const hasHeading = Boolean(shell.title || shell.subtitle);
  const hasCta = Boolean(shell.showCta && shell.ctaHref);

  // Centre-aligned headings put the CTA underneath; left and right keep it
  // on the opposite side of the title row.
  const stackCta = shell.titleAlign === 'center';

  return (
    <section
      style={bg.style}
      className={`relative ${bg.className} ${PADDING[shell.padding] || PADDING.lg}`}
      data-section-id={section?.id}
    >
      {toolbar}

      <div className={WIDTH[shell.width] || WIDTH.normal}>
        {hasHeading && (
          <MotionDiv delay={delay}>
            <div
              className={`mb-10 md:mb-12 flex gap-6 ${
                stackCta
                  ? `flex-col ${align.items}`
                  : 'flex-col md:flex-row md:items-end md:justify-between'
              }`}
            >
              <div className={`${align.text} ${stackCta ? 'w-full' : ''}`}>
                {shell.title && (
                  <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-[var(--text-primary)] leading-tight">
                    {shell.title}
                  </h2>
                )}

                {shell.subtitle && (
                  <p className="mt-3 text-base md:text-lg text-[var(--text-secondary)] max-w-2xl leading-relaxed">
                    {shell.subtitle}
                  </p>
                )}

                <div
                  className={`h-1 w-14 bg-[var(--accent)] rounded-full mt-5 opacity-80 ${align.line}`}
                />
              </div>

              {hasCta && (
                <Link
                  href={shell.ctaHref}
                  className="group inline-flex items-center gap-2 shrink-0 px-5 py-2.5 rounded-full border border-[var(--border)] text-[var(--text-primary)] hover:border-[var(--accent)] hover:bg-[var(--accent)] hover:text-white transition-all duration-300 font-semibold text-sm shadow-sm hover:shadow-md active:scale-95"
                >
                  {shell.ctaLabel || 'Explore All'}
                  <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </Link>
              )}
            </div>
          </MotionDiv>
        )}

        {children}
      </div>
    </section>
  );
}

/**
 * Matching skeleton, so a loading section occupies the same space as the
 * real one instead of collapsing and shifting the page.
 */
export function SectionShellSkeleton({ section, rows = 3 }) {
  const shell = section?.shell || {};
  const bg = backgroundFor(shell.bgColor);

  return (
    <section
      style={bg.style}
      className={`${bg.className} ${PADDING[shell.padding] || PADDING.lg}`}
    >
      <div className={WIDTH[shell.width] || WIDTH.normal}>
        <div className="flex justify-between items-center mb-12">
          <div className="h-9 w-56 bg-black/5 dark:bg-white/5 animate-pulse rounded-lg" />
          <div className="h-9 w-28 bg-black/5 dark:bg-white/5 animate-pulse rounded-full" />
        </div>
        <div className="space-y-4">
          {Array.from({ length: rows }).map((_, i) => (
            <div
              key={i}
              className="h-24 bg-black/5 dark:bg-white/5 animate-pulse rounded-2xl"
            />
          ))}
        </div>
      </div>
    </section>
  );
}
