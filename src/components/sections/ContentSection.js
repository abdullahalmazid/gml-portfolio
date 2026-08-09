'use client';
/**
 * CustomSection
 * src/components/sections/CustomSection.js
 *
 * Renders a `kind: 'custom'` section — one you write yourself rather than one
 * driven by a collection. Content is a list of blocks, one of which (`columns`)
 * can contain other blocks.
 *
 * The same renderer serves the live site and the editor preview, so the two
 * cannot drift apart.
 *
 * Block shape: { id, type, props, children? }
 * Types: heading | richtext | image | quote | button | columns | divider | spacer
 */

import MarkdownRenderer from '@/components/ui/MarkdownRenderer';
import MotionDiv from '@/components/ui/MotionDiv';
import {
  COLUMN_GAP,
  COLUMN_LAYOUTS,
  COLUMN_VALIGN,
} from '@/lib/sections/blockRegistry';
import { ArrowRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { ASPECT } from './ItemMedia';
import SectionShell from './SectionShell';

const ALIGN = { left: 'text-left', center: 'text-center', right: 'text-right' };
const MAX_WIDTH = { narrow: 'max-w-2xl', normal: 'max-w-4xl', wide: 'max-w-6xl', full: 'max-w-none' };

export function Block({ block, nested = false }) {
  const props = block?.props || {};
  const align = ALIGN[props.align] || '';

  switch (block?.type) {
    case 'heading': {
      const Tag = props.level === 3 ? 'h4' : props.level === 2 ? 'h3' : 'h2';
      const sizes = {
        1: nested ? 'text-2xl md:text-3xl' : 'text-3xl md:text-4xl',
        2: nested ? 'text-xl md:text-2xl' : 'text-2xl md:text-3xl',
        3: 'text-lg md:text-xl',
      };
      return (
        <Tag className={`font-extrabold tracking-tight text-[var(--text-primary)] leading-tight ${sizes[props.level] || sizes[1]} ${align}`}>
          {props.text}
        </Tag>
      );
    }

    case 'richtext':
      return (
        <div
          className={`prose dark:prose-invert max-w-none text-[var(--text-secondary)] leading-relaxed ${nested ? 'prose-base' : 'prose-lg'}
            prose-headings:font-bold prose-headings:tracking-tight prose-headings:text-[var(--text-primary)]
            prose-a:text-[var(--accent)] prose-a:font-semibold prose-a:no-underline hover:prose-a:underline hover:prose-a:underline-offset-4
            prose-blockquote:border-l-4 prose-blockquote:border-[var(--accent)] prose-blockquote:bg-[var(--bg-secondary)]
            prose-blockquote:px-6 prose-blockquote:py-4 prose-blockquote:rounded-r-xl prose-blockquote:italic prose-blockquote:text-[var(--text-primary)]
            prose-strong:text-[var(--text-primary)] ${align}`}
        >
          <MarkdownRenderer>{props.markdown}</MarkdownRenderer>
        </div>
      );

    case 'image':
      if (!props.src) return null;
      return (
        <figure className={align}>
          <div className={`relative w-full overflow-hidden ${ASPECT[props.aspect] || ASPECT['16/9']} ${props.rounded === false ? '' : 'rounded-2xl'} ring-1 ring-black/5 dark:ring-white/10 bg-[var(--bg-tertiary)]`}>
            <Image
              src={props.src}
              alt={props.alt || ''}
              fill
              sizes={nested ? '(max-width: 768px) 100vw, 400px' : '(max-width: 768px) 100vw, 800px'}
              unoptimized
              className="object-cover"
            />
          </div>
          {props.caption && (
            <figcaption className="mt-3 text-xs text-[var(--text-muted)]">{props.caption}</figcaption>
          )}
        </figure>
      );

    case 'quote':
      return (
        <blockquote className={`border-l-4 border-[var(--accent)] bg-[var(--bg-secondary)] px-6 py-5 rounded-r-xl ${align}`}>
          <p className="text-lg italic text-[var(--text-primary)] leading-relaxed">{props.text}</p>
          {props.attribution && (
            <cite className="block mt-3 text-sm not-italic font-semibold text-[var(--text-secondary)]">
              — {props.attribution}
            </cite>
          )}
        </blockquote>
      );

    case 'button': {
      if (!props.href) return null;
      const isOutline = props.variant === 'outline';
      return (
        <div className={align}>
          <Link
            href={props.href}
            className={`group inline-flex items-center gap-2 px-6 py-3 rounded-full font-semibold text-sm transition-all duration-300 active:scale-95 ${isOutline
                ? 'border border-[var(--border)] text-[var(--text-primary)] hover:border-[var(--accent)] hover:bg-[var(--accent)] hover:text-white'
                : 'bg-[var(--accent)] text-white shadow-md hover:shadow-lg'
              }`}
          >
            {props.label || 'Learn more'}
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      );
    }

    case 'columns': {
      // Nesting is capped at one level, so children never contain containers.
      if (nested) return null;

      const layout = COLUMN_LAYOUTS[props.layout] || COLUMN_LAYOUTS['1:1'];
      const columns = Array.isArray(block.children) ? block.children : [];
      const stack = props.stackOnMobile !== false;

      return (
        <div
          className={`grid ${stack ? 'grid-cols-1' : 'grid-cols-2'} ${layout.grid} ${COLUMN_GAP[props.gap] || COLUMN_GAP.md
            } ${COLUMN_VALIGN[props.valign] || COLUMN_VALIGN.top}`}
        >
          {columns.map((column, i) => (
            <div key={i} className={`${layout.spans[i] || ''} space-y-5 min-w-0`}>
              {(column || []).map((child) => (
                <Block key={child.id} block={child} nested />
              ))}
            </div>
          ))}
        </div>
      );
    }

    case 'divider':
      return <hr className="border-0 border-t border-[var(--border)]" />;

    case 'spacer':
      return (
        <div
          style={{ height: `${Math.min(Math.max(Number(props.height) || 32, 8), 200)}px` }}
          aria-hidden="true"
        />
      );

    default:
      return null;
  }
}

export default function CustomSection({ section, index = 0, toolbar = null, forceShow = false }) {
  const blocks = Array.isArray(section?.blocks) ? section.blocks : [];
  const align = section?.shell?.titleAlign || 'left';

  if (!blocks.length && !section?.shell?.title && !forceShow) return null;

  const measure = MAX_WIDTH[section?.shell?.width] || MAX_WIDTH.normal;
  const pull = align === 'center' ? 'mx-auto' : align === 'right' ? 'ml-auto' : 'mr-auto';

  return (
    <SectionShell section={section} delay={index * 0.05} toolbar={toolbar}>
      <div className={`${measure} ${pull} space-y-6`}>
        {blocks.map((block, i) => (
          <MotionDiv key={block.id || i} delay={0.1 + Math.min(i, 6) * 0.08}>
            <Block block={block} />
          </MotionDiv>
        ))}

        {!blocks.length && forceShow && (
          <p className="py-8 text-center text-sm font-medium text-[var(--text-muted)]">
            This section is empty. Add a block to get started.
          </p>
        )}
      </div>
    </SectionShell>
  );
}