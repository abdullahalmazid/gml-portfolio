'use client';
/**
 * SectionMigrator
 * src/components/admin/SectionMigrator.js
 *
 * One-off tool: converts every section document from the original shape to
 * schema v2 and renumbers `order` onto clean 1000-step spacing.
 *
 * Runs in the browser rather than as a Node script on purpose — it imports
 * the real `normalizeSection`, so the migration can never drift from the
 * schema the app actually uses. It also means no service account key, and
 * your existing admin auth governs the writes.
 *
 * Nothing is written until you press Apply, and a JSON backup downloads first.
 *
 * TEMPORARY: mount it on the admin page, run it once, then delete the file.
 */

import { useAdmin } from '@/context/AdminContext';
import { db } from '@/lib/firebase';
import { normalizeSection, renumber, SCHEMA_VERSION } from '@/lib/sections/schema';
import { collection, doc, getDocs, writeBatch } from 'firebase/firestore';
import { AlertTriangle, Check, Download, Loader2, RefreshCw } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

/** Firestore rejects `undefined`. Strip it everywhere before writing. */
function stripUndefined(value) {
  if (Array.isArray(value)) return value.map(stripUndefined).filter((v) => v !== undefined);
  if (value && typeof value === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      if (v === undefined) continue;
      out[k] = stripUndefined(v);
    }
    return out;
  }
  return value;
}

/** One-line summary of what a section becomes, for the preview table. */
function describe(section) {
  if (section.kind === 'content') {
    return `${section.source.collection} · ${section.display.mode} · ${section.source.limit} item(s)`;
  }
  if (section.kind === 'stats') {
    return `${section.stats.length} stat(s)`;
  }
  return `${section.template} · ${section.blocks.length} block(s)`;
}

export default function SectionMigrator() {
  const { isAdmin } = useAdmin();

  const [rows, setRows] = useState([]);
  const [status, setStatus] = useState('idle'); // idle | loading | ready | applying | done | error
  const [error, setError] = useState(null);
  const [backedUp, setBackedUp] = useState(false);

  const load = useCallback(async () => {
    setStatus('loading');
    setError(null);
    try {
      const snap = await getDocs(collection(db, 'sections'));
      const raw = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

      // Normalise, then renumber so ordering is clean and collision-free.
      const migrated = renumber(raw.map(normalizeSection).filter(Boolean));

      setRows(
        migrated.map((section) => {
          const before = raw.find((r) => r.id === section.id);
          return {
            id: section.id,
            before,
            after: section,
            alreadyV2: before?.version >= SCHEMA_VERSION,
            orderChanged: before?.order !== section.order,
          };
        })
      );
      setStatus('ready');
    } catch (err) {
      console.error(err);
      setError(err.message);
      setStatus('error');
    }
  }, []);

  useEffect(() => { if (isAdmin) load(); }, [isAdmin, load]);

  const downloadBackup = () => {
    const payload = rows.reduce((acc, r) => ({ ...acc, [r.id]: r.before }), {});
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sections-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setBackedUp(true);
  };

  const apply = async () => {
    if (!rows.length) return;
    setStatus('applying');
    setError(null);

    try {
      const batch = writeBatch(db);

      for (const row of rows) {
        // `id` is the document key, not a field — don't write it into the doc.
        const { id, ...data } = row.after;
        // No merge: the old type-specific fields (type, layout, linkedCollection,
        // content, limit) must be removed, not left alongside the new ones.
        batch.set(doc(db, 'sections', id), stripUndefined(data));
      }

      await batch.commit();
      setStatus('done');
    } catch (err) {
      console.error(err);
      setError(err.message);
      setStatus('error');
    }
  };

  if (!isAdmin) return null;

  const pending = rows.filter((r) => !r.alreadyV2 || r.orderChanged);

  return (
    <div className="my-10 rounded-xl border-2 border-dashed border-amber-400 bg-amber-50/60 dark:bg-amber-500/5 p-5">
      <div className="flex items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-2">
          <AlertTriangle size={18} className="text-amber-600" />
          <h3 className="font-bold text-amber-800 dark:text-amber-400">
            Section migration (schema v{SCHEMA_VERSION})
          </h3>
        </div>
        <button
          type="button"
          onClick={load}
          disabled={status === 'loading' || status === 'applying'}
          className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded border border-amber-400 text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-500/10 disabled:opacity-50"
        >
          <RefreshCw size={13} className={status === 'loading' ? 'animate-spin' : ''} />
          Reload
        </button>
      </div>

      {status === 'loading' && (
        <p className="flex items-center gap-2 text-sm text-amber-800 dark:text-amber-300">
          <Loader2 size={14} className="animate-spin" /> Reading sections…
        </p>
      )}

      {error && (
        <p className="text-sm font-medium text-red-600 mb-3">Error: {error}</p>
      )}

      {status !== 'loading' && rows.length > 0 && (
        <>
          <div className="overflow-x-auto rounded-lg border border-amber-200 dark:border-amber-500/20 bg-white dark:bg-black/20">
            <table className="w-full text-xs">
              <thead className="bg-amber-100/60 dark:bg-amber-500/10 text-amber-900 dark:text-amber-300">
                <tr>
                  <th className="text-left font-bold px-3 py-2">Page</th>
                  <th className="text-left font-bold px-3 py-2">Title</th>
                  <th className="text-left font-bold px-3 py-2">Before</th>
                  <th className="text-left font-bold px-3 py-2">After</th>
                  <th className="text-left font-bold px-3 py-2">Order</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-100 dark:divide-amber-500/10">
                {rows.map((row) => (
                  <tr key={row.id} className="text-gray-700 dark:text-gray-300">
                    <td className="px-3 py-2 font-medium">{row.after.pageId}</td>
                    <td className="px-3 py-2">{row.after.shell.title || <em className="opacity-50">untitled</em>}</td>
                    <td className="px-3 py-2 font-mono opacity-70">
                      {row.alreadyV2 ? `v${row.before.version}` : `type: ${row.before.type || '—'}`}
                    </td>
                    <td className="px-3 py-2 font-mono">
                      <span className="font-bold">{row.after.kind}</span> — {describe(row.after)}
                    </td>
                    <td className="px-3 py-2 font-mono tabular-nums">
                      {row.before?.order ?? '—'}
                      {row.orderChanged && <span className="mx-1 opacity-50">→</span>}
                      {row.orderChanged && <span className="font-bold">{row.after.order}</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="mt-3 text-xs text-amber-800 dark:text-amber-300">
            {pending.length} of {rows.length} document(s) will change. Old fields
            (<code>type</code>, <code>layout</code>, <code>linkedCollection</code>, <code>content</code>, <code>limit</code>)
            are removed, not merged.
          </p>

          <div className="flex flex-wrap items-center gap-3 mt-4">
            <button
              type="button"
              onClick={downloadBackup}
              className="inline-flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-lg bg-white dark:bg-white/10 border border-amber-300 text-amber-900 dark:text-amber-200 hover:bg-amber-50 dark:hover:bg-white/15"
            >
              <Download size={15} />
              1. Download backup
            </button>

            <button
              type="button"
              onClick={apply}
              disabled={!backedUp || status === 'applying' || status === 'done'}
              className="inline-flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-lg bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {status === 'applying' ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
              2. Apply migration
            </button>

            {!backedUp && (
              <span className="text-xs text-amber-700 dark:text-amber-400">
                Download the backup first to enable Apply.
              </span>
            )}

            {status === 'done' && (
              <span className="inline-flex items-center gap-1.5 text-sm font-bold text-green-700 dark:text-green-400">
                <Check size={15} /> Migrated. Reload the page to see the result.
              </span>
            )}
          </div>
        </>
      )}

      {status === 'ready' && rows.length === 0 && (
        <p className="text-sm text-amber-800 dark:text-amber-300">No section documents found.</p>
      )}
    </div>
  );
}
