'use client';
import EditableText from '@/components/editables/EditableText';
import { useAdmin } from '@/context/AdminContext';
import { useSettings } from '@/hooks/useSettings';
import { ArrowUp, Facebook, Github, Heart, Linkedin, Mail, Youtube } from 'lucide-react'; // Updated imports
import Link from 'next/link';

const icons = {
  github: Github,
  linkedin: Linkedin,
  facebook: Facebook,
  youtube: Youtube,
  email: Mail,
};

const quickLinks = [
  { href: '/', label: 'Home' },
  { href: '/about', label: 'About' },
  { href: '/projects', label: 'Projects' },
  { href: '/publications', label: 'Publications' },
  { href: '/contact', label: 'Contact' },
];

export default function Footer() {
  const { editMode } = useAdmin();
  const { data } = useSettings('footer');

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  const socials = data?.socials || { github: '#', linkedin: '#', email: 'mailto:hello@example.com' };

  return (
    <footer className="bg-[var(--bg-secondary)] border-t border-[var(--border)] mt-20">
      {/* Top accent line */}
      <div className="h-1 bg-gradient-to-r from-transparent via-[var(--accent)] to-transparent" />

      <div className="container mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Brand Column */}
          <div className="md:col-span-2">
            {editMode ? (
              <EditableText collection="settings" docId="footer" fieldPath="brandName" initialValue={data?.brandName || 'Abdullah Al Mazid'} tag="h3" className="text-2xl font-bold text-[var(--accent)]" />
            ) : (
              <h3 className="text-2xl font-bold text-[var(--accent)]" style={{ fontFamily: 'var(--font-heading)' }}>
                {data?.brandName || 'Abdullah Al Mazid'}
              </h3>
            )}
            {editMode ? (
              <EditableText collection="settings" docId="footer" fieldPath="tagline" initialValue={data?.tagline || 'Full Stack Developer & Designer.'} tag="p" className="text-sm text-[var(--text-secondary)] mt-3 max-w-md leading-relaxed" multiline />
            ) : (
              <p className="text-sm text-[var(--text-secondary)] mt-3 max-w-md leading-relaxed">
                {data?.tagline || 'Full Stack Developer & Designer.'}
              </p>
            )}

            {/* Social Icons */}
            <div className="flex gap-3 mt-6">
              {Object.entries(socials).map(([key, url]) => {
                const Icon = icons[key];
                if (!Icon || !url) return null;
                return (
                  <a key={key} href={url} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-lg bg-[var(--bg-tertiary)] flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--accent)] hover:bg-[var(--accent-light)] transition-all">
                    <Icon size={18} />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider mb-4">Quick Links</h4>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider mb-4">Contact</h4>
            <div className="space-y-2 text-sm text-[var(--text-secondary)]">
              {editMode ? (
                <>
                  <EditableText collection="settings" docId="footer" fieldPath="contactEmail" initialValue={data?.contactEmail || 'hello@example.com'} tag="p" />
                  <EditableText collection="settings" docId="footer" fieldPath="contactPhone" initialValue={data?.contactPhone || '+880 1XXX XXXXXX'} tag="p" />
                  <EditableText collection="settings" docId="footer" fieldPath="contactLocation" initialValue={data?.contactLocation || 'Dhaka, Bangladesh'} tag="p" />
                </>
              ) : (
                <>
                  <p>{data?.contactEmail || 'hello@example.com'}</p>
                  <p>{data?.contactPhone || '+880 1XXX XXXXXX'}</p>
                  <p>{data?.contactLocation || 'Dhaka, Bangladesh'}</p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-6 border-t border-[var(--border)] flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-[var(--text-muted)] flex items-center gap-1">
            &copy; {new Date().getFullYear()}{' '}
            {editMode ? (
              <EditableText collection="settings" docId="footer" fieldPath="copyright" initialValue={data?.copyright || 'Abdullah Al Mazid'} tag="span" />
            ) : (
              data?.copyright || 'Abdullah Al Mazid'
            )}
            . Made with <Heart className="text-red-500 w-3 h-3" /> All rights reserved.
          </p>
          <button onClick={scrollToTop} className="flex items-center gap-1 text-xs text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors group">
            <ArrowUp className="w-3 h-3 group-hover:-translate-y-0.5 transition-transform" /> Back to top
          </button>
        </div>
      </div>
    </footer>
  );
}