'use client';
import EditableImage from '@/components/editables/EditableImage';
import EditableText from '@/components/editables/EditableText';
import SectionRenderer from '@/components/sections/SectionRenderer';
import MotionDiv from '@/components/ui/MotionDiv';
import { useDoc } from '@/lib/firestore-helpers';
import { Facebook, Github, Linkedin, Mail, Send, User, Youtube } from 'lucide-react';
import Link from 'next/link';

export default function HomePage() {
  const { data, loading } = useDoc('pages/home');

  // Define Icons Map
  const icons = {
    github: Github,
    linkedin: Linkedin,
    email: Mail,
    facebook: Facebook,
    youtube: Youtube,
  };

  // Social link display labels for aria
  const iconLabels = {
    github: 'GitHub',
    linkedin: 'LinkedIn',
    email: 'Email',
    facebook: 'Facebook',
    youtube: 'YouTube',
  };

  // Define Socials (fallback to defaults if not in DB)
  const socials = data?.socials || {
    github: '#',
    linkedin: '#',
    facebook: '#',
    youtube: '#',
    email: 'mailto:hello@example.com',
  };

  // ── Beautiful skeleton loader that mirrors the hero layout ──
  if (loading) {
    return (
      <div className="min-h-[90vh] flex items-center">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left skeleton */}
            <div className="space-y-6">
              <div className="h-4 w-24 bg-black/5 dark:bg-white/5 animate-pulse rounded" />
              <div className="h-16 w-3/4 bg-black/5 dark:bg-white/5 animate-pulse rounded-lg" />
              <div className="h-8 w-1/2 bg-black/5 dark:bg-white/5 animate-pulse rounded" />
              <div className="space-y-2 mt-4">
                <div className="h-4 w-full bg-black/5 dark:bg-white/5 animate-pulse rounded" />
                <div className="h-4 w-5/6 bg-black/5 dark:bg-white/5 animate-pulse rounded" />
                <div className="h-4 w-4/5 bg-black/5 dark:bg-white/5 animate-pulse rounded" />
              </div>
              <div className="flex gap-3 mt-6">
                <div className="h-12 w-36 bg-black/5 dark:bg-white/5 animate-pulse rounded-xl" />
                <div className="h-12 w-36 bg-black/5 dark:bg-white/5 animate-pulse rounded-xl" />
              </div>
              <div className="flex gap-3 mt-4">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="w-10 h-10 bg-black/5 dark:bg-white/5 animate-pulse rounded-lg" />
                ))}
              </div>
            </div>
            {/* Right skeleton — profile image */}
            <div className="flex justify-center">
              <div className="w-full max-w-sm aspect-square bg-black/5 dark:bg-white/5 animate-pulse rounded-2xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* --- HERO SECTION --- */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden bg-[var(--bg-primary)]">

        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, var(--text-muted) 1px, transparent 0)', backgroundSize: '40px 40px' }} />
        </div>

        <div className="relative z-10 container mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">

            {/* Left Column: Text Content */}
            <MotionDiv>
              <p className="text-[var(--accent)] font-medium tracking-wide uppercase text-sm mb-4">Hello, I'm</p>

              <EditableText
                collection="pages" docId="home" fieldPath="heroName"
                value={data?.heroName || 'Abdullah Al Mazid'} tag="h1"
                className="text-5xl md:text-7xl font-bold text-[var(--text-primary)] leading-tight"
              />

              <EditableText
                collection="pages" docId="home" fieldPath="heroTagline"
                value={data?.heroTagline || 'Full Stack Developer & Designer'} tag="p"
                className="text-xl md:text-2xl text-[var(--text-secondary)] mt-4"
              />

              <EditableText
                collection="pages" docId="home" fieldPath="heroDescription"
                value={data?.heroDescription || 'I build modern web applications with passion and precision.'} tag="p"
                className="text-[var(--text-secondary)] mt-6 max-w-lg leading-relaxed" multiline
              />

              {/* --- BUTTONS (Fixed CTA hierarchy: Primary filled, Secondary outlined) --- */}
              <div className="flex flex-wrap items-center gap-4 mt-8">
                {/* Primary Button — filled with accent color */}
                <Link
                  href="/contact"
                  className="px-6 py-3 bg-[var(--accent)] text-white rounded-xl font-semibold hover:bg-[var(--accent-hover)] transition-all shadow-lg flex items-center gap-2 group"
                >
                  Contact Me
                  <Send size={18} className="group-hover:translate-x-1 transition-transform" />
                </Link>

                {/* Secondary Button — outlined only */}
                <Link
                  href="/about"
                  className="px-6 py-3 border border-[var(--border)] text-[var(--text-secondary)] rounded-xl font-medium hover:border-[var(--accent)] hover:text-[var(--accent)] transition-all flex items-center gap-2"
                >
                  <User size={18} />
                  About Me
                </Link>
              </div>

              {/* Social Icons — with aria-labels for accessibility */}
              <div className="flex gap-3 mt-8">
                {Object.entries(socials).map(([key, url]) => {
                  const Icon = icons[key];
                  if (!Icon || !url) return null;
                  return (
                    <a
                      key={key}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Visit my ${iconLabels[key] || key} profile`}
                      className="w-10 h-10 rounded-lg bg-[var(--bg-tertiary)] flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--accent)] hover:bg-[var(--accent-light)] transition-all"
                    >
                      <Icon size={18} />
                    </a>
                  );
                })}
              </div>
            </MotionDiv>

            {/* Right Column: Image */}
            <MotionDiv delay={0.2} className="flex justify-center">
              <div className="relative w-full max-w-sm aspect-square rounded-2xl shadow-2xl overflow-hidden border-4 border-[var(--border)] mb-8 md:mb-0">
                <EditableImage
                  pageId="home"
                  fieldPath="heroPhoto"
                  src={data?.heroPhoto}
                  alt="Profile"
                  fill
                  className="object-cover"
                />
              </div>
            </MotionDiv>

          </div>
        </div>
      </section>

      {/* RENDER DYNAMIC SECTIONS HERE */}
      <SectionRenderer pageId="home" />

    </>
  );
}