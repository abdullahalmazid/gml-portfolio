'use client';
/**
 * MessagesPanel
 * src/components/admin/MessagesPanel.js
 *
 * The contact-form inbox: unread state, search, a detail modal, reply-by-email
 * and delete.
 *
 * Deleting a message is irreversible and there is no export of these anywhere,
 * so the confirmation is inline and explicit rather than a browser dialog that
 * can be dismissed by reflex.
 */

import { deleteItem, setRead } from '@/lib/firestore-helpers';
import { useCollection } from '@/hooks/useCollection';
import {
  Check,
  Inbox,
  Loader2,
  Mail,
  MailOpen,
  Reply,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';

function formatWhen(value) {
  const ms =
    typeof value === 'number' ? value
      : value?.toDate ? value.toDate().getTime()
      : value?.seconds ? value.seconds * 1000
      : Date.parse(value);

  if (!ms || Number.isNaN(ms)) return '';

  const diff = Date.now() - ms;
  const mins = Math.round(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(ms).toLocaleDateString();
}

export default function MessagesPanel() {
  const { items: messages, loading } = useCollection('messages');

  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all'); // all | unread
  const [open, setOpen] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [confirmId, setConfirmId] = useState(null);

  const unreadCount = messages.filter((m) => !m.read).length;

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return messages
      .filter((m) => (filter === 'unread' ? !m.read : true))
      .filter((m) =>
        q
          ? [m.name, m.email, m.subject, m.message]
              .filter(Boolean)
              .some((v) => String(v).toLowerCase().includes(q))
          : true
      );
  }, [messages, filter, query]);

  const openMessage = async (message) => {
    setOpen(message);
    if (!message.read) {
      try { await setRead(message.id, true); } catch { /* non-critical */ }
    }
  };

  const toggleRead = async (message) => {
    setBusyId(message.id);
    try {
      await setRead(message.id, !message.read);
    } catch {
      toast.error('Could not update.');
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (id) => {
    setBusyId(id);
    try {
      await deleteItem('messages', id);
      toast.success('Message deleted.');
      setConfirmId(null);
      if (open?.id === id) setOpen(null);
    } catch {
      toast.error('Could not delete.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <>
      <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-xl overflow-hidden">
        <div className="flex flex-wrap items-center gap-3 p-5 border-b border-[var(--border)]">
          <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-[var(--text-primary)]">
            <Inbox size={16} className="text-[var(--accent)]" />
            Messages
          </h3>

          {unreadCount > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-[var(--accent)] text-[var(--accent-contrast)] text-[10px] font-bold">
              {unreadCount} unread
            </span>
          )}

          <div className="flex-1" />

          <div className="flex rounded-lg border border-[var(--border)] overflow-hidden">
            {['all', 'unread'].map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setFilter(key)}
                className={`px-3 py-1.5 text-xs font-semibold capitalize transition-colors ${
                  filter === key
                    ? 'bg-[var(--accent)] text-[var(--accent-contrast)]'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]'
                }`}
              >
                {key}
              </button>
            ))}
          </div>

          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search"
              className="w-40 pl-8 pr-3 py-1.5 rounded-lg text-xs bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
            />
          </div>
        </div>

        {loading ? (
          <p className="p-5 text-sm text-[var(--text-muted)]">Loading…</p>
        ) : visible.length === 0 ? (
          <p className="p-5 text-sm text-[var(--text-muted)]">
            {messages.length === 0 ? 'No messages yet.' : 'Nothing matches that.'}
          </p>
        ) : (
          <ul className="divide-y divide-[var(--border)] max-h-[28rem] overflow-y-auto">
            {visible.map((message) => (
              <li
                key={message.id}
                className={`group flex items-start gap-3 px-5 py-3 transition-colors hover:bg-[var(--bg-secondary)] ${
                  message.read ? '' : 'bg-[var(--accent-light)]/40'
                }`}
              >
                <button
                  type="button"
                  onClick={() => openMessage(message)}
                  className="flex-1 min-w-0 text-left"
                >
                  <div className="flex items-center gap-2">
                    {!message.read && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] shrink-0" aria-label="Unread" />
                    )}
                    <span className={`text-sm truncate ${message.read ? 'font-medium text-[var(--text-primary)]' : 'font-bold text-[var(--text-primary)]'}`}>
                      {message.name || 'Unknown sender'}
                    </span>
                    <span className="text-[11px] text-[var(--text-muted)] shrink-0 ml-auto">
                      {formatWhen(message.createdAt)}
                    </span>
                  </div>

                  {message.subject && (
                    <p className="text-xs font-semibold text-[var(--accent)] truncate mt-0.5">
                      {message.subject}
                    </p>
                  )}
                  <p className="text-xs text-[var(--text-secondary)] line-clamp-1 mt-0.5">
                    {message.message}
                  </p>
                </button>

                <div className="flex items-center gap-0.5 shrink-0 pt-0.5">
                  {confirmId === message.id ? (
                    <>
                      <span className="text-[11px] font-bold text-red-600 mr-1">Delete?</span>
                      <button
                        type="button"
                        onClick={() => remove(message.id)}
                        disabled={busyId === message.id}
                        className="px-2 py-0.5 rounded text-[11px] font-bold bg-red-600 text-white hover:bg-red-700"
                      >
                        {busyId === message.id ? <Loader2 size={11} className="animate-spin" /> : 'Yes'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmId(null)}
                        className="px-2 py-0.5 rounded text-[11px] font-semibold text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]"
                      >
                        No
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => toggleRead(message)}
                        title={message.read ? 'Mark unread' : 'Mark read'}
                        aria-label={message.read ? 'Mark unread' : 'Mark read'}
                        className="p-1.5 rounded text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] opacity-0 group-hover:opacity-100 focus:opacity-100"
                      >
                        {message.read ? <Mail size={14} /> : <MailOpen size={14} />}
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmId(message.id)}
                        title="Delete"
                        aria-label="Delete"
                        className="p-1.5 rounded text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 opacity-0 group-hover:opacity-100 focus:opacity-100"
                      >
                        <Trash2 size={14} />
                      </button>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {open && (
        <MessageModal
          message={open}
          busy={busyId === open.id}
          onClose={() => setOpen(null)}
          onDelete={() => remove(open.id)}
        />
      )}
    </>
  );
}

function MessageModal({ message, busy, onClose, onDelete }) {
  const [confirming, setConfirming] = useState(false);

  const replyHref = message.email
    ? `mailto:${message.email}?subject=${encodeURIComponent(`Re: ${message.subject || 'Your message'}`)}`
    : null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-lg max-h-[80vh] flex flex-col rounded-2xl bg-[var(--card-bg)] shadow-2xl ring-1 ring-black/10 dark:ring-white/10 overflow-hidden">
        <div className="flex items-start gap-3 px-5 py-4 border-b border-[var(--border)]">
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-bold text-[var(--text-primary)] truncate">
              {message.subject || 'No subject'}
            </h3>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5 truncate">
              {message.name || 'Unknown'}
              {message.email && (
                <>
                  {' · '}
                  <a href={`mailto:${message.email}`} className="text-[var(--accent)] hover:underline">
                    {message.email}
                  </a>
                </>
              )}
            </p>
            <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
              {formatWhen(message.createdAt)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="p-1.5 -mr-1.5 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {/* whitespace-pre-wrap keeps the sender's own line breaks */}
          <p className="text-sm leading-relaxed text-[var(--text-primary)] whitespace-pre-wrap break-words">
            {message.message || <span className="text-[var(--text-muted)]">Empty message.</span>}
          </p>
        </div>

        <div className="flex items-center gap-2 px-5 py-4 border-t border-[var(--border)]">
          {replyHref && (
            <a
              href={replyHref}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold bg-[var(--accent)] text-[var(--accent-contrast)] hover:opacity-90"
            >
              <Reply size={15} /> Reply
            </a>
          )}

          <div className="flex-1" />

          {confirming ? (
            <>
              <span className="text-xs font-bold text-red-600">Delete permanently?</span>
              <button
                type="button"
                onClick={onDelete}
                disabled={busy}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-bold bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
              >
                {busy ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Yes
              </button>
              <button
                type="button"
                onClick={() => setConfirming(false)}
                className="px-3 py-2 rounded-lg text-sm font-semibold text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]"
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setConfirming(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10"
            >
              <Trash2 size={15} /> Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
