'use client';
/**
 * AddSectionWizard
 * src/components/admin/AddSectionWizard.js
 *
 * The stepped flow for adding a section: where -> what kind -> the specifics.
 *
 * It does NOT create anything in Firestore. It hands a finished config back
 * via `onCreate`, and the caller renders it in place as an unsaved draft with
 * the settings panel open. That is the preview-before-insert step: you see the
 * real section with your real data before anything is written.
 *
 * Choosing a different page navigates there and reopens the wizard, using a
 * sessionStorage flag rather than a query parameter so the URL stays clean.
 */

import { COLLECTION_KEYS, getCollection, hasImages } from '@/lib/sections/fieldRegistry';
import { availableModes, defaultModeOptions, MODES, suggestMode } from '@/lib/sections/modeRegistry';
import {
  createContentSection,
  createCustomSection,
  createStatsSection,
  normalizeSection,
} from '@/lib/sections/schema';
import { instantiate, templatesByIntent, INTENTS } from '@/lib/sections/templateRegistry';
import { ArrowLeft, BarChart3, LayoutGrid, PenLine, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export const REOPEN_KEY = 'section-wizard-reopen';

/** Pages that render a SectionRenderer. */
export const EDITABLE_PAGES = [
  { id: 'home', label: 'Home', path: '/' },
  { id: 'about', label: 'About', path: '/about' },
  { id: 'projects', label: 'Projects', path: '/projects' },
  { id: 'publications', label: 'Publications', path: '/publications' },
  { id: 'experience', label: 'Experience', path: '/experience' },
  { id: 'education', label: 'Education', path: '/education' },
  { id: 'blog', label: 'Blog', path: '/blog' },
];

const KINDS = [
  { key: 'content', label: 'From a collection', icon: LayoutGrid,
    description: 'Publications, projects, gallery, experience — pick items and a layout.' },
  { key: 'custom', label: 'Write it yourself', icon: PenLine,
    description: 'Text, images and buttons. Start from a template.' },
  { key: 'stats', label: 'Numbers strip', icon: BarChart3,
    description: 'Counts of your collections, shown as big figures.' },
];

export default function AddSectionWizard({ pageId, index = null, onCreate, onClose }) {
  const router = useRouter();

  const [step, setStep] = useState('kind');
  const [kind, setKind] = useState(null);
  const [collectionName, setCollectionName] = useState(null);
  const [mode, setMode] = useState(null);
  const [limit, setLimit] = useState(3);
  const [statSources, setStatSources] = useState(['projects', 'publications']);
  const [intent, setIntent] = useState('all');

  const back = () => {
    if (step === 'collection' || step === 'template' || step === 'stats') return setStep('kind');
    if (step === 'layout') return setStep('collection');
    if (step === 'page') return setStep('kind');
    onClose?.();
  };

  const goToPage = (page) => {
    if (page.id === pageId) { setStep('kind'); return; }
    // Survive the navigation, then reopen on the destination page.
    try { sessionStorage.setItem(REOPEN_KEY, page.id); } catch { /* private mode */ }
    onClose?.();
    router.push(page.path);
  };

  const finishContent = (chosenMode) => {
    const section = normalizeSection(
      createContentSection({ pageId, collection: collectionName, mode: chosenMode, limit })
    );
    onCreate?.(section, index);
  };

  const finishCustom = (templateKey) => {
    const { template, blocks, shell } = instantiate(templateKey);
    const base = createCustomSection({ pageId, template, blocks });
    onCreate?.(normalizeSection({ ...base, shell: { ...base.shell, ...shell } }), index);
  };

  const finishStats = () => {
    const stats = statSources.map((source) => ({
      type: 'auto',
      source,
      label: getCollection(source)?.label || source,
    }));
    onCreate?.(normalizeSection(createStatsSection({ pageId, stats })), index);
  };

  const titles = {
    kind: 'What kind of section?',
    page: 'Which page?',
    collection: 'Which collection?',
    layout: 'How should it look?',
    template: 'Pick a starting point',
    stats: 'Which numbers?',
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-3xl max-h-[85vh] flex flex-col rounded-2xl bg-[var(--card-bg)] shadow-2xl ring-1 ring-black/10 dark:ring-white/10 overflow-hidden">
        {/* HEADER */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-[var(--border)] shrink-0">
          {step !== 'kind' && (
            <button type="button" onClick={back} aria-label="Back"
              className="p-1.5 -ml-1.5 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]">
              <ArrowLeft size={18} />
            </button>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-bold text-[var(--text-primary)]">{titles[step]}</h3>
            <p className="text-[11px] text-[var(--text-muted)]">
              Adding to <span className="font-semibold">{pageId}</span>
              {index !== null && ' at the chosen position'}
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close"
            className="p-1.5 -mr-1.5 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]">
            <X size={18} />
          </button>
        </div>

        {/* BODY */}
        <div className="flex-1 overflow-y-auto p-5">
          {step === 'kind' && (
            <>
              <div className="grid sm:grid-cols-3 gap-3">
                {KINDS.map(({ key, label, icon: Icon, description }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      setKind(key);
                      if (key === 'content') setStep('collection');
                      else if (key === 'custom') setStep('template');
                      else setStep('stats');
                    }}
                    className="text-left p-4 rounded-xl border border-[var(--border)] hover:border-[var(--accent)] hover:bg-[var(--accent)]/5 transition-all"
                  >
                    <Icon size={20} className="text-[var(--accent)] mb-2" />
                    <span className="block text-sm font-bold text-[var(--text-primary)]">{label}</span>
                    <span className="block mt-1 text-[11px] leading-snug text-[var(--text-muted)]">{description}</span>
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setStep('page')}
                className="mt-5 text-xs font-semibold text-[var(--accent)] hover:underline underline-offset-4"
              >
                Add to a different page instead →
              </button>
            </>
          )}

          {step === 'page' && (
            <div className="grid sm:grid-cols-3 gap-2">
              {EDITABLE_PAGES.map((page) => (
                <button
                  key={page.id}
                  type="button"
                  onClick={() => goToPage(page)}
                  className={`p-3 rounded-xl border text-sm font-semibold transition-all ${
                    page.id === pageId
                      ? 'border-[var(--accent)] text-[var(--accent)] bg-[var(--accent)]/5'
                      : 'border-[var(--border)] text-[var(--text-primary)] hover:border-[var(--accent)]'
                  }`}
                >
                  {page.label}
                  {page.id === pageId && <span className="block text-[10px] font-normal opacity-70">current page</span>}
                </button>
              ))}
            </div>
          )}

          {step === 'collection' && (
            <div className="grid sm:grid-cols-3 gap-3">
              {COLLECTION_KEYS.map((key) => {
                const meta = getCollection(key);
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      setCollectionName(key);
                      const suggested = suggestMode(key);
                      setMode(suggested);
                      setStep('layout');
                    }}
                    className="text-left p-4 rounded-xl border border-[var(--border)] hover:border-[var(--accent)] hover:bg-[var(--accent)]/5 transition-all"
                  >
                    <span className="block text-sm font-bold text-[var(--text-primary)]">{meta.label}</span>
                    <span className="block mt-0.5 text-[11px] text-[var(--text-muted)]">
                      {hasImages(key) ? 'Has images' : 'Text only'}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {step === 'layout' && collectionName && (
            <>
              <div className="flex items-center gap-3 mb-4">
                <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                  How many items
                </label>
                <input
                  type="number"
                  min={1}
                  max={24}
                  value={limit}
                  onChange={(e) => setLimit(Math.min(Math.max(Number(e.target.value) || 1, 1), 24))}
                  className="w-20 px-3 py-1.5 rounded-lg text-sm bg-[var(--bg-primary)] border border-[var(--border)] outline-none focus:border-[var(--accent)]"
                />
                <span className="text-[11px] text-[var(--text-muted)]">
                  changes which layouts fit
                </span>
              </div>

              <div className="grid sm:grid-cols-3 gap-3">
                {availableModes({ hasImages: hasImages(collectionName), itemCount: limit }).map((key) => {
                  const modeMeta = MODES[key];
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => { setMode(key); finishContent(key); }}
                      className={`text-left p-4 rounded-xl border transition-all ${
                        key === mode
                          ? 'border-[var(--accent)] bg-[var(--accent)]/5'
                          : 'border-[var(--border)] hover:border-[var(--accent)]'
                      }`}
                    >
                      <span className="block text-sm font-bold text-[var(--text-primary)]">{modeMeta.label}</span>
                      <span className="block mt-1 text-[11px] leading-snug text-[var(--text-muted)]">
                        {modeMeta.description}
                      </span>
                    </button>
                  );
                })}
              </div>

              <p className="mt-4 text-[11px] text-[var(--text-muted)]">
                You&apos;ll see it with your real content next, and can change anything before saving.
              </p>
            </>
          )}

          {step === 'template' && (
            <>
              <div className="flex flex-wrap gap-1.5 mb-4">
                {['all', ...Object.keys(INTENTS)].map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setIntent(key)}
                    className={`px-3 py-1 rounded-full text-[11px] font-bold transition-colors ${
                      intent === key
                        ? 'bg-[var(--accent)] text-white'
                        : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    {key === 'all' ? 'All' : INTENTS[key]}
                  </button>
                ))}
              </div>

              <div className="grid sm:grid-cols-3 gap-3">
                {Object.entries(templatesByIntent())
                  .filter(([key]) => intent === 'all' || key === intent)
                  .flatMap(([, list]) => list)
                  .map((template) => (
                    <button
                      key={template.key}
                      type="button"
                      onClick={() => finishCustom(template.key)}
                      className="text-left p-4 rounded-xl border border-[var(--border)] hover:border-[var(--accent)] hover:bg-[var(--accent)]/5 transition-all"
                    >
                      <span className="block text-sm font-bold text-[var(--text-primary)]">{template.label}</span>
                      <span className="block mt-1 text-[11px] leading-snug text-[var(--text-muted)]">
                        {template.description}
                      </span>
                    </button>
                  ))}
              </div>
            </>
          )}

          {step === 'stats' && (
            <>
              <p className="text-xs text-[var(--text-muted)] mb-3">
                Each chosen collection becomes one counted figure.
              </p>
              <div className="grid sm:grid-cols-3 gap-2">
                {COLLECTION_KEYS.map((key) => {
                  const on = statSources.includes(key);
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() =>
                        setStatSources(on ? statSources.filter((s) => s !== key) : [...statSources, key])
                      }
                      className={`p-3 rounded-xl border text-sm font-semibold transition-all ${
                        on
                          ? 'border-[var(--accent)] text-[var(--accent)] bg-[var(--accent)]/5'
                          : 'border-[var(--border)] text-[var(--text-primary)] hover:border-[var(--accent)]'
                      }`}
                    >
                      {getCollection(key).label}
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={finishStats}
                disabled={statSources.length === 0}
                className="mt-5 px-5 py-2.5 rounded-lg text-sm font-bold bg-[var(--accent)] text-white hover:opacity-90 disabled:opacity-40"
              >
                Continue with {statSources.length} figure{statSources.length === 1 ? '' : 's'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
