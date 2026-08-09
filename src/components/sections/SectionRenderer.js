'use client';
/**
 * SectionRenderer
 * src/components/sections/SectionRenderer.js
 *
 * Reads the sections for a page, normalises them, dispatches on `kind`, and in
 * edit mode hosts everything the editor needs: the per-section toolbar, the
 * settings drawer, the insert points, and the add-section wizard.
 *
 * A section being ADDED is held as an unsaved draft with no `id`. It renders in
 * place at its chosen position with the settings panel open, so you configure
 * it against your real content and only then press Save. Cancelling writes
 * nothing — no half-created documents to clean up.
 *
 * A section being EDITED substitutes its draft for the saved document, which
 * is what makes the panel a live preview.
 */

import AddSectionWizard, { REOPEN_KEY } from '@/components/admin/AddSectionWizard';
import DropZone from '@/components/admin/DropZone';
import SectionSettingsPanel from '@/components/admin/SectionSettingsPanel';
import SectionSlideOver from '@/components/admin/SectionSlideOver';
import SectionToolbar from '@/components/admin/SectionToolbar';
import { useAdmin } from '@/context/AdminContext';
import { setHidden, useColl } from '@/lib/firestore-helpers';
import { normalizeSection, sortSections } from '@/lib/sections/schema';
import {
  createSection,
  deleteSection,
  duplicateSection,
  moveSection,
  saveSection,
} from '@/lib/sections/sectionsApi';
import { Plus } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import ContentSection from './ContentSection';
import CustomSection from './CustomSection';
import StatsSection from './StatsSection';

const RENDERERS = {
  content: ContentSection,
  custom: CustomSection,
  stats: StatsSection,
};

export default function SectionRenderer({ pageId }) {
  const { editMode } = useAdmin();
  const { items: allSections, loading } = useColl('sections', { includeHidden: true });

  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState(null);
  const [pending, setPending] = useState(null);       // { section, index } — unsaved
  const [wizardAt, setWizardAt] = useState(null);     // insert position, or 'end'
  const [busyId, setBusyId] = useState(null);
  const [saving, setSaving] = useState(false);

  const sections = useMemo(() => {
    const forPage = (allSections || [])
      .filter((s) => s.pageId === pageId)
      // Hidden sections stay visible in edit mode so they can be switched back on.
      .filter((s) => editMode || s.hidden !== true);
    return sortSections(forPage.map(normalizeSection).filter(Boolean));
  }, [allSections, pageId, editMode]);

  // Reopen after the wizard navigated here from another page.
  useEffect(() => {
    if (!editMode) return;
    try {
      if (sessionStorage.getItem(REOPEN_KEY) === pageId) {
        sessionStorage.removeItem(REOPEN_KEY);
        setWizardAt('end');
      }
    } catch { /* private mode */ }
  }, [editMode, pageId]);

  const close = useCallback(() => {
    setEditingId(null);
    setDraft(null);
    setPending(null);
  }, []);

  const handleSave = useCallback(async (next) => {
    setSaving(true);
    try {
      if (next.id) {
        await saveSection(next);
      } else {
        await createSection(next, sections, pending?.index ?? null);
      }
      close();
    } catch (err) {
      console.error('[SectionRenderer] save failed:', err);
      alert(`Could not save: ${err.message}`);
    } finally {
      setSaving(false);
    }
  }, [close, sections, pending]);

  const runAction = useCallback(async (section, action) => {
    setBusyId(section.id);
    try {
      await action();
    } catch (err) {
      console.error('[SectionRenderer] action failed:', err);
      alert(`Action failed: ${err.message}`);
    } finally {
      setBusyId(null);
    }
  }, []);

  const openWizard = (index) => { close(); setWizardAt(index); };

  const startPending = (section, index) => {
    setWizardAt(null);
    setEditingId(null);
    setPending({ section, index: index === 'end' || index === null ? sections.length : index });
    setDraft(section);
  };

  if (loading) return null;

  // Build the render list with any unsaved section slotted into position.
  const list = [...sections];
  if (pending) list.splice(pending.index, 0, { ...pending.section, __pending: true });

  const activeSection = pending ? draft : sections.find((s) => s.id === editingId) || null;
  const panelSection = pending ? (draft || pending.section) : activeSection;

  return (
    <>
      {editMode && <DropZone onClick={() => openWizard(0)} label="Add section at the top" />}

      {list.map((saved, i) => {
        const isPending = Boolean(saved.__pending);
        const section = !isPending && draft && draft.id === saved.id ? draft : isPending ? (draft || saved) : saved;
        const Renderer = RENDERERS[section.kind];

        if (!Renderer) {
          if (process.env.NODE_ENV !== 'production') {
            console.warn(`[SectionRenderer] unknown kind "${section.kind}"`);
          }
          return null;
        }

        const selected = isPending || editingId === saved.id;
        const savedIndex = sections.findIndex((s) => s.id === saved.id);

        return (
          <div key={saved.id || 'pending'}>
            <div
              className={`group/section relative ${section.hidden && !isPending ? 'opacity-45' : ''} ${selected
                  ? 'ring-2 ring-inset ring-[var(--accent)]'
                  : editMode
                    ? 'hover:ring-1 hover:ring-inset hover:ring-[var(--accent)]/40 transition-shadow'
                    : ''
                }`}
            >
              {isPending && (
                <span className="absolute top-3 left-3 z-40 px-2.5 py-1 rounded-full bg-[var(--accent)] text-[var(--accent-contrast)] text-[10px] font-bold tracking-wide uppercase shadow-lg">
                  Not saved yet
                </span>
              )}

              {!isPending && section.hidden && (
                <span className="absolute top-3 left-3 z-40 px-2.5 py-1 rounded-full bg-neutral-900/90 text-white text-[10px] font-bold tracking-wide uppercase shadow-lg">
                  Hidden from site
                </span>
              )}

              <Renderer
                section={{ ...section, __dim: section.hidden }}
                index={i}
                forceShow={editMode}
                toolbar={
                  editMode && !isPending ? (
                    <SectionToolbar
                      section={section}
                      index={savedIndex}
                      total={sections.length}
                      active={editingId === saved.id}
                      busy={busyId === saved.id}
                      onEdit={() => { setPending(null); setEditingId(saved.id); setDraft(saved); }}
                      onMove={(dir) => runAction(saved, () => moveSection(saved, sections, dir))}
                      onDuplicate={() => runAction(saved, () => duplicateSection(saved, sections))}
                      onToggleHidden={() => runAction(saved, () => setHidden('sections', saved.id, !saved.hidden))}
                      onDelete={() => runAction(saved, async () => {
                        await deleteSection(saved.id);
                        if (editingId === saved.id) close();
                      })}
                    />
                  ) : null
                }
              />
            </div>

            {editMode && !isPending && (
              <DropZone onClick={() => openWizard(savedIndex + 1)} />
            )}
          </div>
        );
      })}

      {editMode && (
        <div className="container mx-auto px-6 py-8 flex justify-center">
          <button
            type="button"
            onClick={() => openWizard('end')}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border-2 border-dashed border-[var(--border)] text-sm font-bold text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors"
          >
            <Plus size={16} />
            Add a section
          </button>
        </div>
      )}

      {editMode && wizardAt !== null && (
        <AddSectionWizard
          pageId={pageId}
          index={wizardAt === 'end' ? null : wizardAt}
          onCreate={startPending}
          onClose={() => setWizardAt(null)}
        />
      )}

      {editMode && (
        <SectionSlideOver
          open={Boolean(panelSection)}
          title={pending ? 'New section' : panelSection?.shell?.title || 'Untitled section'}
          subtitle={
            panelSection?.kind === 'content'
              ? `${panelSection.source.collection} · ${panelSection.display.mode}`
              : panelSection?.kind
          }
          onClose={close}
        >
          {panelSection && (
            <SectionSettingsPanel
              section={pending ? pending.section : panelSection}
              saving={saving}
              onChange={setDraft}
              onSave={handleSave}
              onCancel={close}
            />
          )}
        </SectionSlideOver>
      )}
    </>
  );
}