'use client';
import EditableText from '@/components/editables/EditableText';
import { useAdmin } from '@/context/AdminContext';
import { useSettings } from '@/hooks/useSettings';
import {
  ArrowUp,
  Facebook,
  Github,
  Heart,
  Linkedin,
  Mail,
  MapPin,
  Phone,
  Youtube,
} from 'lucide-react';
import Link from 'next/link';

const icons = {
  github: Github,
  linkedin: Linkedin,
  facebook: Facebook,
  youtube: Youtube,
  email: Mail,
};

const socialLabels = {
  github: 'GitHub',
  linkedin: 'LinkedIn',
  facebook: 'Facebook',
  youtube: 'YouTube',
  email: 'Email',
};

const quickLinks = [
  { href: '/', label: 'Home' },
  { href: '/about', label: 'About' },
  { href: '/education', label: 'Education' },
  { href: '/experience', label: 'Experience' },
  { href: '/projects', label: 'Projects' },
  { href: '/publications', label: 'Publications' },
  { href: '/blog', label: 'Blog' },
  { href: '/gallery', label: 'Gallery' },
  { href: '/contact', label: 'Contact' },
];

export default function Footer() {
  const { editMode } = useAdmin();
  const { data } = useSettings('footer');

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  const socials = data?.socials || {
    github: '#',
    linkedin: '#',
    email: 'mailto:hello@example.com',
  };

  const email = data?.contactEmail || 'hello@example.com';
  const phone = data?.contactPhone || '+880 1XXX XXXXXX';
  const location = data?.contactLocation || 'Dhaka, Bangladesh';

  return (
    <footer className="relative overflow-hidden bg-[var(--bg-secondary)] border-t border-[var(--border)] mt-16">
      {/* Top accent line */}
      <div className="h-px bg-gradient-to-r from-transparent via-[var(--accent)] to-transparent" />

      {/* Ambient glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 left-1/2 h-40 w-[40rem] -translate-x-1/2 rounded-full bg-[var(--accent)] opacity-[0.07] blur-3xl"
      />

      <div className="container relative mx-auto px-6 py-10">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-12 md:gap-10">
          {/* Brand */}
          <div className="sm:col-span-2 md:col-span-4">
            {editMode ? (
              <EditableText
                collection="settings"
                docId="footer"
                fieldPath="brandName"
                initialValue={data?.brandName || 'Abdullah Al Mazid'}
                tag="h3"
                className="text-xl font-bold text-[var(--accent)]"
              />
            ) : (
              <h3
                className="text-xl font-bold text-[var(--accent)]"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                {data?.brandName || 'Abdullah Al Mazid'}
              </h3>
            )}

            {editMode ? (
              <EditableText
                collection="settings"
                docId="footer"
                fieldPath="tagline"
                initialValue={data?.tagline || 'Full Stack Developer & Designer.'}
                tag="p"
                className="mt-2 max-w-sm text-sm leading-relaxed text-[var(--text-secondary)]"
                multiline
              />
            ) : (
              <p className="mt-2 max-w-sm text-sm leading-relaxed text-[var(--text-secondary)]">
                {data?.tagline || 'Full Stack Developer & Designer.'}
              </p>
            )}

            {/* Social icons */}
            <div className="mt-4 flex flex-wrap gap-2">
              {Object.entries(socials).map(([key, url]) => {
                const Icon = icons[key];
                if (!Icon || !url) return null;
                const isMail = key === 'email';
                const href = isMail && !url.startsWith('mailto:') ? `mailto:${url}` : url;

                return (
                  <a
                    key={key}
                    href={href}
                    aria-label={socialLabels[key] || key}
                    title={socialLabels[key] || key}
                    target={isMail ? undefined : '_blank'}
                    rel={isMail ? undefined : 'noopener noreferrer'}
                    className="group flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--bg-tertiary)] text-[var(--text-secondary)] transition-all duration-300 hover:-translate-y-0.5 hover:border-[var(--accent)] hover:bg-[var(--accent-light)] hover:text-[var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                  >
                    <Icon size={16} className="transition-transform group-hover:scale-110" />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Quick Links — three columns */}
          <nav aria-label="Footer" className="md:col-span-5">
            <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-[var(--text-primary)]">
              Quick Links
            </h4>
            <ul className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="group inline-flex items-center text-sm text-[var(--text-secondary)] transition-colors hover:text-[var(--accent)]"
                  >
                    <span className="mr-0 h-px w-0 bg-[var(--accent)] transition-all duration-300 group-hover:mr-1.5 group-hover:w-2.5" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Contact */}
          <div className="md:col-span-3">
            <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-[var(--text-primary)]">
              Contact
            </h4>

            {editMode ? (
              <div className="space-y-1.5 text-sm text-[var(--text-secondary)]">
                <EditableText
                  collection="settings"
                  docId="footer"
                  fieldPath="contactEmail"
                  initialValue={email}
                  tag="p"
                />
                <EditableText
                  collection="settings"
                  docId="footer"
                  fieldPath="contactPhone"
                  initialValue={phone}
                  tag="p"
                />
                <EditableText
                  collection="settings"
                  docId="footer"
                  fieldPath="contactLocation"
                  initialValue={location}
                  tag="p"
                />
              </div>
            ) : (
              <ul className="space-y-2 text-sm text-[var(--text-secondary)]">
                <li>
                  <a
                    href={`mailto:${email}`}
                    className="flex items-start gap-2 transition-colors hover:text-[var(--accent)]"
                  >
                    <Mail size={14} className="mt-0.5 shrink-0 text-[var(--accent)]" />
                    <span className="break-all">{email}</span>
                  </a>
                </li>
                <li>
                  <a
                    href={`tel:${phone.replace(/\s+/g, '')}`}
                    className="flex items-start gap-2 transition-colors hover:text-[var(--accent)]"
                  >
                    <Phone size={14} className="mt-0.5 shrink-0 text-[var(--accent)]" />
                    <span>{phone}</span>
                  </a>
                </li>
                <li className="flex items-start gap-2">
                  <MapPin size={14} className="mt-0.5 shrink-0 text-[var(--accent)]" />
                  <span>{location}</span>
                </li>
              </ul>
            )}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-8 flex flex-col items-center justify-between gap-3 border-t border-[var(--border)] pt-4 md:flex-row">
          <p className="flex flex-wrap items-center justify-center gap-1 text-xs text-[var(--text-muted)]">
            &copy; {new Date().getFullYear()}{' '}
            {editMode ? (
              <EditableText
                collection="settings"
                docId="footer"
                fieldPath="copyright"
                initialValue={data?.copyright || 'Abdullah Al Mazid'}
                tag="span"
              />
            ) : (
              data?.copyright || 'Abdullah Al Mazid'
            )}
            . Made with <Heart className="h-3 w-3 fill-red-500 text-red-500" /> All rights reserved.
          </p>

          <button
            type="button"
            onClick={scrollToTop}
            aria-label="Back to top"
            className="group flex items-center gap-1.5 rounded-full border border-[var(--border)] px-3 py-1 text-xs text-[var(--text-muted)] transition-all hover:border-[var(--accent)] hover:text-[var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
          >
            <ArrowUp className="h-3 w-3 transition-transform group-hover:-translate-y-0.5" />
            Back to top
          </button>
        </div>
      </div>
    </footer>
  );
}