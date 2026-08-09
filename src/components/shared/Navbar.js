'use client';
/**
 * Navbar
 * src/components/shared/Navbar.js
 *
 * What changed from the previous version, and why:
 *
 * 1. ACTIVE STATE followed `pathname === href`, so opening a project detail
 *    page (/projects/abc) left every link unhighlighted — the visitor lost
 *    their sense of place exactly when they had gone deepest. Now a link is
 *    active for its whole subtree.
 *
 * 2. BREAKPOINT was `md` (768px). Ten links do not fit in 768px, so they
 *    wrapped or overflowed between 768px and roughly 1100px. Moved to `lg`.
 *
 * 3. EDIT MODE nested an editable field inside a <Link>, so clicking a label
 *    to rename it navigated away instead. In edit mode the labels are no
 *    longer links.
 *
 * 4. THE MOBILE DRAWER had no Escape key, no focus trap and did not return
 *    focus to the button that opened it — a keyboard user could tab out of an
 *    open drawer into the page behind.
 *
 * 5. A SKIP LINK was missing, so keyboard users tabbed through ten nav links
 *    on every page before reaching content.
 *
 * Added: a reading-progress line along the bottom edge of the bar, and
 * `aria-current` on the active link.
 */

import EditableText from '@/components/editables/EditableText';
import { useAdmin } from '@/context/AdminContext';
import { useSettings } from '@/hooks/useSettings';
import { AnimatePresence, motion } from 'framer-motion';
import { AlignRight, LayoutDashboard, X } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

const defLinks = [
  { key: 'home', href: '/', def: 'Home' },
  { key: 'about', href: '/about', def: 'About' },
  { key: 'education', href: '/education', def: 'Education' },
  { key: 'experience', href: '/experience', def: 'Experience' },
  { key: 'projects', href: '/projects', def: 'Projects' },
  { key: 'publications', href: '/publications', def: 'Publications' },
  { key: 'blog', href: '/blog', def: 'Blog' },
  { key: 'gallery', href: '/gallery', def: 'Gallery' },
  { key: 'contact', href: '/contact', def: 'Contact' },
];

/** Active for the whole subtree, so /projects/abc still highlights Projects. */
function isActive(pathname, href) {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [progress, setProgress] = useState(0);

  const pathname = usePathname();
  const { isAdmin, editMode } = useAdmin();
  const { data: nav } = useSettings('navbar');

  const openerRef = useRef(null);
  const panelRef = useRef(null);

  // Scroll state + reading progress in one listener.
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 20);

      const max = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? Math.min((y / max) * 100, 100) : 0);
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [pathname]);

  const close = useCallback(() => setIsOpen(false), []);

  useEffect(() => { close(); }, [pathname, close]);

  // Lock scrolling, but restore whatever was there rather than assuming ''.
  useEffect(() => {
    if (!isOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previous; };
  }, [isOpen]);

  // Escape to close, Tab kept inside the panel, focus returned on close.
  useEffect(() => {
    if (!isOpen) return;

    const opener = openerRef.current;
    const panel = panelRef.current;
    panel?.querySelector('a, button')?.focus();

    const onKeyDown = (e) => {
      if (e.key === 'Escape') { close(); return; }
      if (e.key !== 'Tab' || !panel) return;

      const focusable = panel.querySelectorAll(
        'a[href], button:not([disabled]), input, [tabindex]:not([tabindex="-1"])'
      );
      if (!focusable.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      opener?.focus();
    };
  }, [isOpen, close]);

  const links = defLinks;
  const linkLabel = (link) => nav?.[`link_${link.key}`] || link.def;
  const brand = nav?.brandName || 'Abdullah.';

  const currentIndex = links.findIndex((l) => isActive(pathname, l.href));

  return (
    <>
      {/* Keyboard users can jump past ten links. Requires id="main" on your
          page wrapper in layout.js. */}
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[60] focus:px-4 focus:py-2 focus:rounded-lg focus:bg-[var(--accent)] focus:text-[var(--accent-contrast)] focus:text-sm focus:font-bold"
      >
        Skip to content
      </a>

      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className={`sticky top-0 z-40 transition-all duration-300 ${scrolled
            ? 'bg-[var(--bg-primary)]/95 backdrop-blur-xl border-b border-[var(--border)] shadow-sm'
            : 'bg-[var(--bg-primary)]/60 backdrop-blur-lg border-b border-transparent'
          }`}
      >
        <div className="container mx-auto px-6 py-3.5">
          <div className="flex items-center justify-between gap-4">

            {/* Brand */}
            <Link
              href="/"
              className="flex items-baseline gap-1 text-xl font-bold text-[var(--text-primary)] tracking-tight shrink-0 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              {editMode ? (
                <EditableText
                  collection="settings" docId="navbar" fieldPath="brandName"
                  initialValue={brand} tag="span"
                />
              ) : (
                <span>{brand}</span>
              )}
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] shrink-0" />
            </Link>

            {/* Desktop links */}
            <div className="hidden lg:flex items-center gap-0.5">
              {links.map((link) => {
                const active = isActive(pathname, link.href);

                // In edit mode the label is editable, so it must not also be a
                // link — otherwise clicking to rename navigates instead.
                if (editMode) {
                  return (
                    <span
                      key={link.key}
                      className={`relative px-3 py-2 text-sm font-medium rounded-lg ${active ? 'text-[var(--accent)]' : 'text-[var(--text-secondary)]'
                        }`}
                    >
                      <EditableText
                        collection="settings" docId="navbar" fieldPath={`link_${link.key}`}
                        initialValue={linkLabel(link)} tag="span"
                      />
                    </span>
                  );
                }

                return (
                  <Link
                    key={link.key}
                    href={link.href}
                    aria-current={active ? 'page' : undefined}
                    className={`relative px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] ${active
                        ? 'text-[var(--accent)]'
                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]'
                      }`}
                  >
                    {linkLabel(link)}
                    {active && (
                      <motion.span
                        layoutId="nav-underline"
                        className="absolute bottom-0.5 left-3 right-3 h-[1.5px] bg-[var(--accent)] rounded-full"
                        transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                      />
                    )}
                  </Link>
                );
              })}

              {/* Dashboard is set apart — it isn't part of the public journey. */}
              {isAdmin && (
                <>
                  <span className="w-px h-5 bg-[var(--border)] mx-2" aria-hidden="true" />
                  <Link
                    href="/admin"
                    aria-current={isActive(pathname, '/admin') ? 'page' : undefined}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-full border transition-colors ${isActive(pathname, '/admin')
                        ? 'border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-contrast)]'
                        : 'border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-[var(--accent)]'
                      }`}
                  >
                    <LayoutDashboard size={13} /> Dashboard
                  </Link>
                </>
              )}
            </div>

            {/* Hamburger */}
            <button
              ref={openerRef}
              className="lg:hidden flex items-center justify-center w-9 h-9 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
              onClick={() => setIsOpen(true)}
              aria-label="Open menu"
              aria-expanded={isOpen}
              aria-haspopup="dialog"
            >
              <AlignRight size={20} />
            </button>
          </div>
        </div>

        {/* Reading progress. Hidden until the page is long enough to scroll. */}
        {progress > 0 && (
          <div
            className="absolute bottom-0 left-0 h-[2px] bg-[var(--accent)] transition-[width] duration-150 ease-out"
            style={{ width: `${progress}%` }}
            aria-hidden="true"
          />
        )}
      </motion.nav>

      {/* Mobile drawer */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm lg:hidden"
              onClick={close}
            />

            <motion.aside
              key="sidebar"
              ref={panelRef}
              role="dialog"
              aria-modal="true"
              aria-label="Site menu"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 35 }}
              className="fixed top-0 right-0 bottom-0 z-50 w-72 max-w-[85vw] bg-[var(--bg-primary)] border-l border-[var(--border)] flex flex-col lg:hidden shadow-2xl"
            >
              <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--border)]">
                <Link
                  href="/"
                  className="flex items-baseline gap-1 text-lg font-bold text-[var(--text-primary)]"
                  style={{ fontFamily: 'var(--font-heading)' }}
                >
                  {brand}
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] shrink-0" />
                </Link>
                <button
                  onClick={close}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                  aria-label="Close menu"
                >
                  <X size={18} />
                </button>
              </div>

              <nav className="flex-1 overflow-y-auto px-4 py-5">
                <ul className="space-y-1">
                  {links.map((link, i) => {
                    const active = isActive(pathname, link.href);
                    return (
                      <motion.li
                        key={link.key}
                        initial={{ opacity: 0, x: 24 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.04, duration: 0.25, ease: 'easeOut' }}
                      >
                        <Link
                          href={link.href}
                          aria-current={active ? 'page' : undefined}
                          className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-150 ${active
                              ? 'text-[var(--accent)] bg-[var(--accent-light)] border-l-2 border-[var(--accent)]'
                              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]'
                            }`}
                        >
                          <span className={`text-[11px] tabular-nums w-5 ${active ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]'}`}>
                            {String(i + 1).padStart(2, '0')}
                          </span>
                          {linkLabel(link)}
                        </Link>
                      </motion.li>
                    );
                  })}

                  {isAdmin && (
                    <motion.li
                      initial={{ opacity: 0, x: 24 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: links.length * 0.04, duration: 0.25 }}
                      className="pt-2 mt-2 border-t border-[var(--border)]"
                    >
                      <Link
                        href="/admin"
                        className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-[var(--accent)] hover:bg-[var(--bg-secondary)]"
                      >
                        <LayoutDashboard size={15} /> Dashboard
                      </Link>
                    </motion.li>
                  )}
                </ul>
              </nav>

              <div className="px-6 py-4 border-t border-[var(--border)]">
                <p className="text-[11px] text-[var(--text-muted)]">
                  {currentIndex === -1 ? (
                    'Browsing'
                  ) : (
                    <>
                      {linkLabel(links[currentIndex])}
                      {' · '}
                      <span className="text-[var(--accent)]">
                        {currentIndex + 1}/{links.length}
                      </span>
                    </>
                  )}
                </p>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}