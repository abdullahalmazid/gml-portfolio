'use client';
/**
 * ContentSection
 * src/components/sections/ContentSection.js
 *
 * Renders a `kind: 'content'` section. Its whole job is three steps:
 *   resolve items -> pick the mode renderer -> wrap in the shell.
 *
 * It contains no layout code and no per-collection logic. That is the point:
 * this file should not need to change when you add a mode, a field or a
 * collection. If it ever does, something has leaked out of the registries.
 */

import { useSectionItems } from '@/hooks/useSectionItems';
import { getCollection } from '@/lib/sections/fieldRegistry';
import SectionShell, { SectionShellSkeleton } from './SectionShell';
import { getModeComponent } from './modes';

export default function ContentSection({ section, index = 0, toolbar = null, forceShow = false }) {
  const { items, isLoading } = useSectionItems(section);

  const collectionName = section?.source?.collection;
  const meta = getCollection(collectionName);
  const ModeComponent = getModeComponent(section?.display?.mode);

  if (isLoading) {
    return <SectionShellSkeleton section={section} rows={Math.min(section?.source?.limit || 3, 4)} />;
  }

  // An empty section is hidden on the live site rather than leaving a titled
  // band with nothing under it. In edit mode `forceShow` keeps it visible so
  // it stays selectable while you configure it.
  if (!items.length && !forceShow) return null;

  if (!meta) {
    return forceShow ? (
      <SectionShell section={section} toolbar={toolbar}>
        <p className="py-8 text-center text-sm font-medium text-[var(--text-muted)]">
          Unknown collection &quot;{String(collectionName)}&quot;.
        </p>
      </SectionShell>
    ) : null;
  }

  return (
    <SectionShell section={section} delay={index * 0.05} toolbar={toolbar}>
      <ModeComponent section={section} items={items} />
    </SectionShell>
  );
}