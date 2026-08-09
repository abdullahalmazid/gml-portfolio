'use client';
/**
 * ImageField
 * src/components/ui/ImageField.js
 *
 * Picking an image the way people expect: click to browse your files, or drag
 * one onto the box. Pasting a URL still works for images already hosted
 * somewhere.
 *
 * It renders a hidden input carrying `id`, because AdminSlideOver collects
 * values on save by reading `document.getElementById('edit-<key>').value`.
 * Keeping that contract means this drops into the existing editor with no
 * change to how saving works.
 */

import { cloudinaryConfig } from '@/lib/cloudinary';
import { ImagePlus, Link2, Loader2, RefreshCw, Trash2, Upload } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

export default function ImageField({
  id,
  defaultValue = '',
  value: controlledValue,
  onChange,
  label = 'image',
}) {
  const isControlled = controlledValue !== undefined;
  const [internal, setInternal] = useState(defaultValue || '');
  const url = isControlled ? controlledValue : internal;

  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [showUrl, setShowUrl] = useState(false);

  const inputRef = useRef(null);
  const dragDepth = useRef(0);

  // Reset when the editor is opened on a different document.
  useEffect(() => {
    if (!isControlled) setInternal(defaultValue || '');
  }, [defaultValue, isControlled]);

  const commit = (next) => {
    if (!isControlled) setInternal(next);
    onChange?.(next);
  };

  const upload = async (file) => {
    setError(null);
    setBusy(true);
    setProgress(0);
    try {
      const uploaded = await cloudinaryConfig.uploadFile(file, setProgress);
      commit(uploaded);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
      setProgress(0);
    }
  };

  const onPick = (e) => {
    const file = e.target.files?.[0];
    if (file) upload(file);
    e.target.value = ''; // allow re-picking the same file
  };

  // dragDepth counters stop the highlight flickering as the pointer moves over
  // child elements, which fire their own dragleave events.
  const onDragEnter = (e) => {
    e.preventDefault();
    dragDepth.current += 1;
    setDragging(true);
  };
  const onDragLeave = (e) => {
    e.preventDefault();
    dragDepth.current -= 1;
    if (dragDepth.current <= 0) setDragging(false);
  };
  const onDrop = (e) => {
    e.preventDefault();
    dragDepth.current = 0;
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) upload(file);
  };

  return (
    <div className="space-y-2">
      {/* The value AdminSlideOver reads on save. */}
      <input type="hidden" id={id} value={url || ''} readOnly />

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={onPick}
        className="hidden"
        aria-hidden="true"
        tabIndex={-1}
      />

      {url && !busy ? (
        <div className="relative rounded-xl overflow-hidden border border-[var(--border)] group">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt="" className="w-full h-40 object-cover bg-[var(--bg-tertiary)]" />

          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/90 text-neutral-900 text-xs font-bold hover:bg-white"
            >
              <RefreshCw size={13} /> Replace
            </button>
            <button
              type="button"
              onClick={() => commit('')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-bold hover:bg-red-700"
            >
              <Trash2 size={13} /> Remove
            </button>
          </div>
        </div>
      ) : (
        <div
          onDragEnter={onDragEnter}
          onDragOver={(e) => e.preventDefault()}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={() => !busy && inputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              inputRef.current?.click();
            }
          }}
          className={`flex flex-col items-center justify-center gap-2 h-40 rounded-xl border-2 border-dashed cursor-pointer transition-colors ${
            dragging
              ? 'border-[var(--accent)] bg-[var(--accent)]/10'
              : 'border-[var(--border)] hover:border-[var(--accent)] hover:bg-[var(--bg-secondary)]'
          }`}
        >
          {busy ? (
            <>
              <Loader2 size={22} className="animate-spin text-[var(--accent)]" />
              <p className="text-xs font-semibold text-[var(--text-secondary)]">
                Uploading… {progress}%
              </p>
              <div className="w-32 h-1 rounded-full bg-[var(--bg-tertiary)] overflow-hidden">
                <div
                  className="h-full bg-[var(--accent)] transition-all duration-200"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </>
          ) : dragging ? (
            <>
              <Upload size={22} className="text-[var(--accent)]" />
              <p className="text-xs font-bold text-[var(--accent)]">Drop it here</p>
            </>
          ) : (
            <>
              <ImagePlus size={22} className="text-[var(--text-muted)]" />
              <p className="text-xs font-semibold text-[var(--text-primary)]">
                Click to choose a {label}
              </p>
              <p className="text-[11px] text-[var(--text-muted)]">or drag one here</p>
            </>
          )}
        </div>
      )}

      {error && (
        <p className="text-[11px] font-semibold text-red-600">{error}</p>
      )}

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setShowUrl(!showUrl)}
          className="inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--text-secondary)] hover:text-[var(--accent)]"
        >
          <Link2 size={12} /> {showUrl ? 'Hide URL field' : 'Paste a URL instead'}
        </button>

        {url && (
          <span className="ml-auto text-[10px] text-[var(--text-muted)] truncate max-w-[10rem]" title={url}>
            {url.split('/').pop()}
          </span>
        )}
      </div>

      {showUrl && (
        <input
          type="text"
          value={url || ''}
          onChange={(e) => commit(e.target.value)}
          placeholder="https://…"
          className="w-full px-3 py-2 rounded-lg text-xs font-mono bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
        />
      )}
    </div>
  );
}
