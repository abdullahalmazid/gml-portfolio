'use client';
import EditableText from '@/components/editables/EditableText';
import { useAdmin } from '@/context/AdminContext';
import { useSettings } from '@/hooks/useSettings';
import { AnimatePresence, motion } from 'framer-motion';
import { Menu, X } from 'lucide-react'; // Updated imports
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

const defLinks = [
  { key: 'home', href: '/', def: 'Home' },
  { key: 'about', href: '/about', def: 'About' },
  { key: 'experience', href: '/experience', def: 'Experience' },
  { key: 'projects', href: '/projects', def: 'Projects' },
  { key: 'publications', href: '/publications', def: 'Publications' },
  { key: 'gallery', href: '/gallery', def: 'Gallery' },
  { key: 'contact', href: '/contact', def: 'Contact' },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const { isAdmin, editMode } = useAdmin();
  const { data: nav } = useSettings('navbar');

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', h);
    return () => window.removeEventListener('scroll', h);
  }, []);

  useEffect(() => { setIsOpen(false); }, [pathname]);

  const links = isAdmin ? [...defLinks, { key: 'admin', href: '/admin', def: 'Dashboard' }] : defLinks;

  return (
    <motion.nav
      initial={{ y: -100 }} animate={{ y: 0 }} transition={{ duration: 0.5 }}
      className={`sticky top-0 z-40 backdrop-blur-lg border-b transition-all duration-300 ${scrolled ? 'bg-[var(--bg-primary)]/95 border-[var(--border)] shadow-sm' : 'bg-[var(--bg-primary)]/60 border-transparent'}`}
    >
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-[var(--accent)]" style={{ fontFamily: 'var(--font-heading)' }}>
            {editMode ? (
              <EditableText collection="settings" docId="navbar" fieldPath="brandName" initialValue={nav?.brandName || 'Abdullah.'} tag="span" />
            ) : (
              nav?.brandName || 'Abdullah.'
            )}
          </Link>

          <div className="hidden md:flex items-center space-x-1">
            {links.map((link) => (
              <Link
                key={link.key}
                href={link.href}
                className={`px-3 py-2 text-sm font-medium rounded-lg transition-all ${
                  pathname === link.href
                    ? 'text-[var(--accent)] bg-[var(--accent-light)]'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]'
                }`}
              >
                {editMode && link.key !== 'admin' ? (
                  <EditableText collection="settings" docId="navbar" fieldPath={`link_${link.key}`} initialValue={nav?.[`link_${link.key}`] || link.def} tag="span" />
                ) : (
                  nav?.[`link_${link.key}`] || link.def
                )}
              </Link>
            ))}
          </div>

          <button className="md:hidden text-2xl p-2" onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-[var(--bg-secondary)] border-t border-[var(--border)] overflow-hidden"
          >
            <div className="container mx-auto px-6 py-4 flex flex-col space-y-1">
              {links.map((link) => (
                <Link
                  key={link.key}
                  href={link.href}
                  className={`block px-4 py-3 rounded-lg font-medium ${
                    pathname === link.href ? 'text-[var(--accent)] bg-[var(--accent-light)]' : 'text-[var(--text-primary)]'
                  }`}
                >
                  {nav?.[`link_${link.key}`] || link.def}
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}