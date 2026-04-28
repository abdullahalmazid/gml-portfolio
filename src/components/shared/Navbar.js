'use client';
import EditableText from '@/components/editables/EditableText';
import { useAdmin } from '@/context/AdminContext';
import { useSettings } from '@/hooks/useSettings';
import { AnimatePresence, motion } from 'framer-motion';
import { AlignRight, X } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

const defLinks = [
  { key: 'home',         href: '/',            def: 'Home' },
  { key: 'about',        href: '/about',        def: 'About' },
  { key: 'education',    href: '/education',    def: 'Education' },
  { key: 'experience',   href: '/experience',   def: 'Experience' },
  { key: 'projects',     href: '/projects',     def: 'Projects' },
  { key: 'publications', href: '/publications', def: 'Publications' },
  { key: 'blog',         href: '/blog',         def: 'Blog' },
  { key: 'gallery',      href: '/gallery',      def: 'Gallery' },
  { key: 'contact',      href: '/contact',      def: 'Contact' },
];

export default function Navbar() {
  const [isOpen, setIsOpen]     = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname                = usePathname();
  const { isAdmin, editMode }   = useAdmin();
  const { data: nav }           = useSettings('navbar');

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', h, { passive: true });
    return () => window.removeEventListener('scroll', h);
  }, []);

  // Close sidebar on route change
  useEffect(() => { setIsOpen(false); }, [pathname]);

  // Lock body scroll when sidebar is open
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const links = isAdmin
    ? [...defLinks, { key: 'admin', href: '/admin', def: 'Dashboard' }]
    : defLinks;

  const linkLabel = (link) =>
    nav?.[`link_${link.key}`] || link.def;

  return (
    <>
      {/* ── Top bar ─────────────────────────────────────────────────── */}
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className={`sticky top-0 z-40 transition-all duration-300 ${
          scrolled
            ? 'bg-[var(--bg-primary)]/95 backdrop-blur-xl border-b border-[var(--border)] shadow-sm'
            : 'bg-[var(--bg-primary)]/60 backdrop-blur-lg border-b border-transparent'
        }`}
      >
        <div className="container mx-auto px-6 py-3.5">
          <div className="flex items-center justify-between">

            {/* Brand */}
            <Link
              href="/"
              className="flex items-center gap-1.5 text-xl font-bold text-[var(--text-primary)] tracking-tight"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              {editMode ? (
                <EditableText
                  collection="settings" docId="navbar" fieldPath="brandName"
                  initialValue={nav?.brandName || 'Abdullah.'}
                  tag="span"
                />
              ) : (
                <span>{nav?.brandName || 'Abdullah.'}</span>
              )}
              {/* Accent dot */}
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] mb-3 shrink-0" />
            </Link>

            {/* Desktop links */}
            <div className="hidden md:flex items-center gap-0.5">
              {links.map((link) => {
                const active = pathname === link.href;
                return (
                  <Link
                    key={link.key}
                    href={link.href}
                    className={`
                      relative px-3.5 py-2 text-sm font-medium rounded-lg transition-colors duration-150
                      ${active
                        ? 'text-[var(--accent)]'
                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                      }
                    `}
                  >
                    {editMode && link.key !== 'admin' ? (
                      <EditableText
                        collection="settings" docId="navbar" fieldPath={`link_${link.key}`}
                        initialValue={linkLabel(link)} tag="span"
                      />
                    ) : linkLabel(link)}

                    {/* Animated underline */}
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
            </div>

            {/* Mobile hamburger */}
            <button
              className="md:hidden flex items-center justify-center w-9 h-9 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors"
              onClick={() => setIsOpen(true)}
              aria-label="Open menu"
            >
              <AlignRight size={20} />
            </button>
          </div>
        </div>
      </motion.nav>

      {/* ── Mobile sidebar ───────────────────────────────────────────── */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm md:hidden"
              onClick={() => setIsOpen(false)}
            />

            {/* Sidebar panel */}
            <motion.aside
              key="sidebar"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 35 }}
              className="fixed top-0 right-0 bottom-0 z-50 w-72 bg-[var(--bg-primary)] border-l border-[var(--border)] flex flex-col md:hidden shadow-2xl"
            >
              {/* Sidebar header */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--border)]">
                <Link
                  href="/"
                  className="flex items-center gap-1.5 text-lg font-bold text-[var(--text-primary)]"
                  style={{ fontFamily: 'var(--font-heading)' }}
                >
                  {nav?.brandName || 'Abdullah.'}
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] mb-2.5 shrink-0" />
                </Link>
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors"
                  aria-label="Close menu"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Links */}
              <nav className="flex-1 overflow-y-auto px-4 py-5">
                <ul className="space-y-1">
                  {links.map((link, i) => {
                    const active = pathname === link.href;
                    return (
                      <motion.li
                        key={link.key}
                        initial={{ opacity: 0, x: 24 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.045, duration: 0.25, ease: 'easeOut' }}
                      >
                        <Link
                          href={link.href}
                          className={`
                            flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-150
                            ${active
                              ? 'text-[var(--accent)] bg-[var(--accent-light)] border-l-2 border-[var(--accent)]'
                              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]'
                            }
                          `}
                        >
                          {/* Index number */}
                          <span className={`text-[11px] tabular-nums w-5 ${active ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]'}`}>
                            {String(i + 1).padStart(2, '0')}
                          </span>
                          {linkLabel(link)}
                        </Link>
                      </motion.li>
                    );
                  })}
                </ul>
              </nav>

              {/* Sidebar footer */}
              <div className="px-6 py-4 border-t border-[var(--border)]">
                <p className="text-[11px] text-[var(--text-muted)]">
                  {pathname === '/' ? 'Home' : pathname.replace('/', '').replace(/^\w/, c => c.toUpperCase())}
                  {' · '}
                  <span className="text-[var(--accent)]">
                    {links.findIndex(l => l.href === pathname) + 1}/{links.length}
                  </span>
                </p>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}