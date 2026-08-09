'use client';
/**
 * SectionSettingsPanel
 * src/components/admin/SectionSettingsPanel.js
 *
 * The editor for one section: Content, Layout and Style.
 *
 * It holds a DRAFT in local state and calls `onChange(draft)` on every edit,
 * so the parent can re-render the real section behind the panel — that is the
 * live preview. Nothing reaches Firestore until Save.
 *
 * The Layout tab is generated from the mode registry rather than hand-written,
 * which is why adding a mode or an option needs no changes here.
 */

import { COLLECTION_KEYS, getCollection, getFieldsByRole, hasImages } from '@/lib/sections/fieldRegistry';
import { availableModes, defaultModeOptions, getMode, MODES } from '@/lib/sections/modeRegistry';
import { normalizeSection, SELECTION_MODES, SORT_MODES, validateSection } from '@/lib/sections/schema';
import { AlertTriangle, Check, Info, Loader2, RotateCcw } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import BlockEditor from './BlockEditor';
import FieldToggles from './FieldToggles';
import ItemPicker from './ItemPicker';
import {
  ColorInput,
  Field,
  getIn,
  NumberInput,
  PanelSection,
  Segmented,
  SelectInput,
  setIn,
  TextArea,
  TextInput,
  Toggle,
} from './SettingsControls';

const TABS = [
  { key: 'content', label: 'Content' },
  { key: 'layout', label: 'Layout' },
  { key: 'style', label: 'Style' },
];

// Custom sections have blocks instead of a collection, and no layout options.
const CUSTOM_TABS = [
  { key: 'content', label: 'Blocks' },
  { key: 'style', label: 'Style' },
];

const BG_PRESETS = [
  { label: 'Primary', value: 'var(--bg-primary)' },
  { label: 'Secondary', value: 'var(--bg-secondary)' },
  { label: 'Tertiary', value: 'var(--bg-tertiary)' },
  { label: 'Accent tint', value: 'var(--accent-light)' },
];

const LEVEL_ICON = { error: AlertTriangle, warn: AlertTriangle, info: Info };
const LEVEL_STYLE = {
  error: 'text-red-600 bg-red-50 dark:bg-red-500/10',
  warn: 'text-amber-700 bg-amber-50 dark:bg-amber-500/10',
  info: 'text-[var(--text-secondary)] bg-[var(--bg-tertiary)]',
};

export default function SectionSettingsPanel({ section, onChange, onSave, onCancel, saving = false }) {
  const [tab, setTab] = useState('content');
  const [draft, setDraft] = useState(section);

  // Reset when a different section is selected.
  useEffect(() => {
    setDraft(section);
    setTab('content');
  }, [section?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  /** Every edit funnels through here so the preview always sees a valid config. */
  const update = (path, value) => {
    const next = normalizeSection(setIn(draft, path, value));
    setDraft(next);
    onChange?.(next);
  };

  const issues = useMemo(() => validateSection(draft), [draft]);
  const dirty = useMemo(() => JSON.stringify(draft) !== JSON.stringify(section), [draft, section]);

  if (!draft) return null;

  const isContent = draft.kind === 'content';
  const collectionName = draft.source?.collection;

  return (
    <div className="flex flex-col h-full bg-[var(--card-bg)]">
      {/* TABS */}
      <div className="flex border-b border-[var(--border)] shrink-0">
        {(isContent ? TABS : draft.kind === 'custom' ? CUSTOM_TABS : [TABS[2]]).map((t) => {
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`flex-1 px-4 py-3 text-sm font-semibold transition-colors border-b-2 -mb-px ${tab === t.key
                  ? 'border-[var(--accent)] text-[var(--accent)]'
                  : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {/* BODY */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {tab === 'content' && isContent && (
          <ContentTab draft={draft} update={update} collectionName={collectionName} />
        )}

        {tab === 'content' && draft.kind === 'custom' && (
          <PanelSection title="Blocks">
            <BlockEditor
              blocks={draft.blocks}
              onChange={(blocks) => update('blocks', blocks)}
            />
          </PanelSection>
        )}

        {tab === 'layout' && (
          isContent
            ? <LayoutTab draft={draft} update={update} collectionName={collectionName} />
            : <p className="text-sm text-[var(--text-muted)]">This section type has no layout options.</p>
        )}

        {tab === 'style' && <StyleTab draft={draft} update={update} />}
      </div>

      {/* ISSUES + ACTIONS */}
      <div className="shrink-0 border-t border-[var(--border)] p-4 space-y-3">
        {issues.length > 0 && (
          <ul className="space-y-1.5">
            {issues.map((issue, i) => {
              const Icon = LEVEL_ICON[issue.level] || Info;
              return (
                <li
                  key={i}
                  className={`flex items-start gap-2 text-[11px] leading-snug px-2.5 py-1.5 rounded-lg ${LEVEL_STYLE[issue.level]}`}
                >
                  <Icon size={13} className="mt-px shrink-0" />
                  <span>{issue.message}</span>
                </li>
              );
            })}
          </ul>
        )}

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => { setDraft(section); onChange?.(section); }}
            disabled={!dirty || saving}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] disabled:opacity-40"
          >
            <RotateCcw size={14} /> Revert
          </button>

          <div className="flex-1" />

          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]"
          >
            Close
          </button>

          <button
            type="button"
            onClick={() => onSave?.(draft)}
            disabled={!dirty || saving || issues.some((i) => i.level === 'error')}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold bg-[var(--accent)] text-white hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* CONTENT                                                             */
/* ------------------------------------------------------------------ */

function ContentTab({ draft, update, collectionName }) {
  const meta = getCollection(collectionName);
  const selection = draft.source.selection;

  return (
    <>
      <PanelSection title="Source">
        <Field label="Collection">
          <SelectInput
            value={collectionName}
            options={COLLECTION_KEYS.map((key) => ({ value: key, label: getCollection(key).label }))}
            onChange={(next) => {
              // Changing collection invalidates picked ids and field toggles,
              // so rebuild the source rather than patching one key.
              update('source', {
                ...draft.source,
                collection: next,
                ids: [],
                filter: null,
                sort: getCollection(next)?.defaultSort || 'newest',
              });
            }}
          />
        </Field>

        <Field label="How items are chosen">
          <Segmented
            value={selection}
            onChange={(next) => update('source.selection', next)}
            options={SELECTION_MODES.map((m) => ({
              value: m,
              label: m === 'auto' ? 'Automatic' : m === 'manual' ? 'Pick items' : 'Filter',
            }))}
          />
        </Field>

        {selection !== 'manual' && (
          <Field label="Sort by">
            <SelectInput
              value={draft.source.sort}
              options={SORT_MODES.filter((s) => s !== 'manual').map((s) => ({
                value: s,
                label: s === 'alpha' ? 'A–Z' : s === 'newest' ? 'Newest first' : 'Oldest first',
              }))}
              onChange={(next) => update('source.sort', next)}
            />
          </Field>
        )}

        <Field
          label="How many items"
          help={selection === 'manual' ? 'Caps the picked list below.' : undefined}
        >
          <NumberInput
            value={draft.source.limit}
            min={1}
            max={24}
            onChange={(next) => update('source.limit', next)}
          />
        </Field>
      </PanelSection>

      {selection === 'manual' && (
        <PanelSection title="Pick items">
          <ItemPicker
            section={draft}
            ids={draft.source.ids}
            onChange={(ids) => update('source.ids', ids)}
          />
        </PanelSection>
      )}

      {selection === 'filter' && (
        <PanelSection title="Filter">
          <Field label="Field">
            <SelectInput
              value={getIn(draft, 'source.filter.field', '')}
              placeholder="Choose a field…"
              options={(meta?.fields || []).map((f) => ({ value: f.key, label: f.label }))}
              onChange={(next) => update('source.filter', { ...(draft.source.filter || {}), field: next })}
            />
          </Field>
          <Field label="Condition">
            <SelectInput
              value={getIn(draft, 'source.filter.op', 'contains')}
              options={[
                { value: 'contains', label: 'contains' },
                { value: 'eq', label: 'is exactly' },
                { value: 'neq', label: 'is not' },
                { value: 'gt', label: 'greater than' },
                { value: 'lt', label: 'less than' },
              ]}
              onChange={(next) => update('source.filter', { ...(draft.source.filter || {}), op: next })}
            />
          </Field>
          <Field label="Value">
            <TextInput
              value={getIn(draft, 'source.filter.value', '')}
              placeholder="e.g. 2025"
              onChange={(next) => update('source.filter', { ...(draft.source.filter || {}), value: next })}
            />
          </Field>
        </PanelSection>
      )}

      <PanelSection title="What to show for each item">
        <FieldToggles
          collectionName={collectionName}
          mode={draft.display.mode}
          fields={draft.fields}
          onChange={(next) => update('fields', next)}
        />
      </PanelSection>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* LAYOUT                                                              */
/* ------------------------------------------------------------------ */

function LayoutTab({ draft, update, collectionName }) {
  const currentMode = draft.display.mode;
  const modeMeta = getMode(currentMode);

  const offered = availableModes({
    hasImages: hasImages(collectionName),
    itemCount: draft.source.limit,
  });

  // Modes excluded by the current settings, with the reason — more useful than
  // silently omitting them.
  const excluded = Object.keys(MODES).filter((k) => !offered.includes(k));

  return (
    <>
      <PanelSection title="Layout">
        <div className="grid grid-cols-2 gap-2">
          {offered.map((key) => {
            const mode = MODES[key];
            const active = key === currentMode;
            return (
              <button
                key={key}
                type="button"
                onClick={() =>
                  update('display', { mode: key, options: defaultModeOptions(key) })
                }
                className={`text-left p-3 rounded-xl border transition-all ${active
                    ? 'border-[var(--accent)] bg-[var(--accent)]/5 ring-1 ring-[var(--accent)]'
                    : 'border-[var(--border)] hover:border-[var(--accent)]/50'
                  }`}
              >
                <span className="block text-sm font-bold text-[var(--text-primary)]">{mode.label}</span>
                <span className="block mt-0.5 text-[11px] leading-snug text-[var(--text-muted)]">
                  {mode.description}
                </span>
              </button>
            );
          })}
        </div>

        {excluded.length > 0 && (
          <p className="text-[11px] leading-snug text-[var(--text-muted)]">
            Not available here:{' '}
            {excluded.map((k) => {
              const m = MODES[k];
              const reason = m.requiresImage && !hasImages(collectionName)
                ? 'needs images'
                : `needs ${m.minItems}+ items`;
              return `${m.label} (${reason})`;
            }).join(', ')}.
          </p>
        )}
      </PanelSection>

      {modeMeta?.options?.length > 0 && (
        <PanelSection title={`${modeMeta.label} options`}>
          {modeMeta.options.map((option) => (
            <ModeOption
              key={option.key}
              option={option}
              value={getIn(draft, ['display', 'options', option.key])}
              collectionName={collectionName}
              onChange={(next) => update(['display', 'options', option.key], next)}
            />
          ))}
        </PanelSection>
      )}
    </>
  );
}

/** Renders one option from the mode registry. Option type decides the control. */
function ModeOption({ option, value, collectionName, onChange }) {
  if (option.type === 'toggle') {
    return (
      <Toggle
        checked={Boolean(value)}
        onChange={onChange}
        label={option.label}
        help={option.help}
      />
    );
  }

  if (option.type === 'number') {
    return (
      <Field label={option.label} help={option.help}>
        <NumberInput
          value={value}
          min={option.min ?? 0}
          max={option.max ?? 100}
          onChange={onChange}
        />
      </Field>
    );
  }

  if (option.type === 'field') {
    // A field-typed option picks one of the collection's fields of a role,
    // e.g. which meta field labels each point on a timeline.
    const choices = getFieldsByRole(collectionName, option.role || 'meta');
    return (
      <Field label={option.label} help={option.help}>
        <SelectInput
          value={value ?? ''}
          placeholder="Automatic"
          options={choices.map((f) => ({ value: f.key, label: f.label }))}
          onChange={(next) => onChange(next || null)}
        />
      </Field>
    );
  }

  const options = option.options || [];
  const short = options.length <= 4 && options.every((o) => String(o).length <= 8);

  return (
    <Field label={option.label} help={option.help}>
      {short ? (
        <Segmented value={value} onChange={onChange} options={options} />
      ) : (
        <SelectInput value={value} onChange={onChange} options={options} />
      )}
    </Field>
  );
}

/* ------------------------------------------------------------------ */
/* STYLE                                                               */
/* ------------------------------------------------------------------ */

function StyleTab({ draft, update }) {
  const shell = draft.shell;

  return (
    <>
      <PanelSection title="Heading">
        <Field label="Title">
          <TextInput value={shell.title} onChange={(v) => update('shell.title', v)} placeholder="Section title" />
        </Field>

        <Field label="Subtitle">
          <TextArea rows={2} value={shell.subtitle} onChange={(v) => update('shell.subtitle', v)} placeholder="Optional supporting line" />
        </Field>

        <Field label="Alignment">
          <Segmented
            value={shell.titleAlign}
            onChange={(v) => update('shell.titleAlign', v)}
            options={['left', 'center', 'right']}
          />
        </Field>
      </PanelSection>

      <PanelSection title="Band">
        <Field label="Background">
          <ColorInput value={shell.bgColor} onChange={(v) => update('shell.bgColor', v)} presets={BG_PRESETS} />
        </Field>

        <Field label="Vertical space">
          <Segmented
            value={shell.padding}
            onChange={(v) => update('shell.padding', v)}
            options={['sm', 'md', 'lg', 'xl']}
          />
        </Field>

        <Field label="Width">
          <Segmented
            value={shell.width}
            onChange={(v) => update('shell.width', v)}
            options={['narrow', 'normal', 'wide', 'full']}
          />
        </Field>
      </PanelSection>

      <PanelSection title="Call to action">
        <Toggle
          checked={shell.showCta}
          onChange={(v) => update('shell.showCta', v)}
          label="Show the button"
          help="Links to the full page for this collection."
        />

        {shell.showCta && (
          <>
            <Field label="Button text">
              <TextInput value={shell.ctaLabel} onChange={(v) => update('shell.ctaLabel', v)} placeholder="Explore All" />
            </Field>
            <Field label="Links to">
              <TextInput value={shell.ctaHref} onChange={(v) => update('shell.ctaHref', v)} placeholder="/publications" />
            </Field>
          </>
        )}
      </PanelSection>
    </>
  );
}