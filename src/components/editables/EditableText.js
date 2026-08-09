'use client';
/**
 * EditableText
 * src/components/editables/EditableText.js
 *
 * Click any text on the site to edit it. Rewritten to fix real problems in the
 * previous version:
 *
 * 1. AN EMPTY FIELD COULD NOT BE EDITED. With no content the element collapsed
 *    to nothing, so there was no target to click. Empty fields now show a
 *    placeholder in edit mode.
 *
 * 2. LIVE UPDATES WIPED YOUR TYPING. The value effect ran on every Firestore
 *    snapshot, replacing your draft mid-edit — including your own save echoing
 *    back. Incoming values are now ignored while editing.
 *
 * 3. SAVE CLOSED BEFORE IT SAVED. `setIsEditing(false)` ran before the await,
 *    so a failed write looked identical to a successful one. The editor now
 *    stays open on failure with your text intact.
 *
 * 4. NO KEYBOARD ACCESS. There was a click handler and nothing else, so the
 *    site could not be edited without a mouse. Now focusable, with Enter to
 *    open and Escape to cancel.
 *
 * 5. EDITING LOOKED NOTHING LIKE THE RESULT. A white box with black monospace
 *    text replaced your styled heading — unreadable on a dark theme, and the
 *    layout jumped. Plain fields are now edited in place in their own
 *    typography; rich fields open the full editor.
 *
 * Keys: Enter saves single-line fields, Escape cancels, clicking away saves.
 */

import RichContent from '@/components/ui/RichContent';
import RichTextEditorLoader from '@/components/ui/RichTextEditorLoader';
import { useAdmin } from '@/context/AdminContext';
import { updateData } from '@/lib/firestore-helpers';
import { AlertCircle, Check, Loader2, Pencil } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

export default function EditableText({
  collection, docId, fieldPath, value,
  tag: Tag = 'div', className = '', markdown = false, initialValue,
  multiline = false,
  placeholder,
}) {
  const { editMode, showFieldPaths } = useAdmin();

  const val = value !== undefined ? value : initialValue;
  const rich = markdown; // prop name kept for compatibility with existing calls

  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(val || '');
  const [status, setStatus] = useState('idle'); // idle | saving | saved | error
  const [error, setError] = useState(null);

  const inputRef = useRef(null);
  const path = collection && docId ? `${collection}/${docId}` : null;

  // Only accept incoming values when NOT editing, so a snapshot landing
  // mid-edit cannot overwrite what is being typed.
  useEffect(() => {
    if (!isEditing) setDraft(val || '');
  }, [val, isEditing]);

  // Grow the textarea to fit its content instead of a fixed height.
  useEffect(() => {
    const el = inputRef.current;
    if (isEditing && multiline && el && el.tagName === 'TEXTAREA') {
      el.style.height = 'auto';
      el.style.height = `${el.scrollHeight}px`;
    }
  }, [isEditing, draft, multiline]);

  const save = useCallback(async (next) => {
    const value_ = next ?? draft;
    if (value_ === (val || '')) { setIsEditing(false); return; }
    if (!path) { setIsEditing(false); return; }

    setStatus('saving');
    setError(null);
    try {
      await updateData(path, { [fieldPath]: value_ });
      setStatus('saved');
      setIsEditing(false);
      setTimeout(() => setStatus('idle'), 1500);
    } catch (err) {
      setStatus('error');   // stay open so the text is not lost
      setError(err.message);
    }
  }, [draft, val, path, fieldPath]);

  const cancel = useCallback(() => {
    setDraft(val || '');
    setIsEditing(false);
    setStatus('idle');
    setError(null);
  }, [val]);

  // Warn before leaving with unsaved changes.
  useEffect(() => {
    if (!isEditing) return;
    const warn = (e) => {
      if (draft !== (val || '')) { e.preventDefault(); e.returnValue = ''; }
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [isEditing, draft, val]);

  /* ---------------- VIEW MODE ---------------- */
  if (!editMode) {
    if (!val) return null;
    if (rich) return <RichContent content={val} className={className} />;
    return <Tag className={className}>{val}</Tag>;
  }

  /* ---------------- EDITING: RICH ---------------- */
  if (isEditing && rich) {
    return (
      <div className="relative z-40 my-2">
        <RichTextEditorLoader
          value={draft}
          onChange={setDraft}
          placeholder={placeholder || 'Start writing…'}
          autoFocus
        />
        <EditorActions
          status={status}
          error={error}
          onSave={() => save()}
          onCancel={cancel}
          hint="Esc to cancel"
        />
      </div>
    );
  }

  /* ---------------- EDITING: PLAIN, IN PLACE ---------------- */
  if (isEditing) {
    const shared = {
      ref: inputRef,
      value: draft,
      onChange: (e) => setDraft(e.target.value),
      onBlur: () => save(),
      onKeyDown: (e) => {
        if (e.key === 'Escape') { e.preventDefault(); cancel(); }
        if (e.key === 'Enter' && (!multiline || e.ctrlKey || e.metaKey)) {
          e.preventDefault();
          e.currentTarget.blur();
        }
      },
      autoFocus: true,
      placeholder: placeholder || 'Type here…',
      // Inherits the surrounding typography, so the text does not move or
      // change appearance the moment you click it.
      className: `${className} w-full bg-transparent outline-none resize-none rounded px-1 -mx-1 ring-2 ring-[var(--accent)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)]`,
    };

    return (
      <span className="relative block">
        {multiline ? <textarea rows={1} {...shared} /> : <input type="text" {...shared} />}
        <StatusBadge status={status} error={error} />
      </span>
    );
  }

  /* ---------------- EDIT MODE, IDLE ---------------- */
  const isEmpty = !val;
  const open = () => { setDraft(val || ''); setIsEditing(true); };

  return (
    <Tag
      role="button"
      tabIndex={0}
      onClick={open}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); }
      }}
      className={`${className} group relative border border-dashed border-transparent hover:border-[var(--accent)] focus-visible:border-[var(--accent)] focus-visible:outline-none rounded px-1 -mx-1 transition-colors cursor-text ${isEmpty ? 'min-h-[1.75rem] block' : ''
        }`}
    >
      {showFieldPaths && (
        <span className="absolute -top-6 left-0 bg-blue-600 text-white text-[10px] px-2 py-0.5 rounded font-mono z-30 whitespace-nowrap">
          {collection}/{docId} → {fieldPath}
        </span>
      )}

      {/* A span, not a div: this renders inside whatever `tag` is, and a div
          inside a <p> is invalid HTML — the browser moves it, the markup stops
          matching, and hydration fails. */}
      <span className="absolute top-0 right-0 inline-flex items-center gap-1 bg-[var(--accent)] text-[var(--accent-contrast)] px-1.5 py-0.5 rounded-bl text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
        <Pencil size={10} /> Edit
      </span>

      {status === 'saved' && (
        <span className="absolute top-0 left-0 inline-flex items-center gap-1 text-[10px] font-bold text-green-600">
          <Check size={11} /> Saved
        </span>
      )}

      {isEmpty ? (
        <span className="text-[var(--text-muted)] italic opacity-70">
          {placeholder || `Click to add ${fieldPath}`}
        </span>
      ) : rich ? (
        <RichContent content={val} />
      ) : (
        val
      )}
    </Tag>
  );
}

function StatusBadge({ status, error }) {
  if (status === 'saving') {
    return (
      <span className="absolute -top-5 right-0 inline-flex items-center gap-1 text-[10px] font-semibold text-[var(--text-muted)]">
        <Loader2 size={10} className="animate-spin" /> Saving…
      </span>
    );
  }
  if (status === 'error') {
    return (
      <span className="absolute -top-5 right-0 inline-flex items-center gap-1 text-[10px] font-semibold text-red-600" title={error}>
        <AlertCircle size={10} /> Not saved
      </span>
    );
  }
  return null;
}

function EditorActions({ status, error, onSave, onCancel, hint }) {
  return (
    <div className="flex items-center gap-2 mt-2">
      <button
        type="button"
        onClick={onSave}
        disabled={status === 'saving'}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-[var(--accent)] text-[var(--accent-contrast)] hover:opacity-90 disabled:opacity-50"
      >
        {status === 'saving' ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
        {status === 'saving' ? 'Saving…' : 'Save'}
      </button>
      <button
        type="button"
        onClick={onCancel}
        className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]"
      >
        Cancel
      </button>

      {status === 'error' ? (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-600">
          <AlertCircle size={12} /> {error}
        </span>
      ) : (
        <span className="text-[11px] text-[var(--text-muted)]">{hint}</span>
      )}
    </div>
  );
}