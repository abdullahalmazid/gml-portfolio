'use client';
import EditableImage from '@/components/editables/EditableImage';
import EditableText from '@/components/editables/EditableText';
import DynamicSectionManager from '@/components/pages/DynamicSectionManager';
import SectionRenderer from '@/components/pages/SectionRenderer';
import MotionDiv from '@/components/ui/MotionDiv';
import { useDoc } from '@/lib/firestore-helpers';
import { Facebook, Github, Linkedin, Mail, Send, User, Youtube } from 'lucide-react'; // Added Facebook & Youtube
import Link from 'next/link';

export default function HomePage() {
  const { data, loading } = useDoc('pages/home');

  // Define Icons Map
  const icons = {
    github: Github,
    linkedin: Linkedin,
    email: Mail,
    facebook: Facebook,   // Added
    youtube: Youtube,     // Added
  };

  // Define Socials (fallback to defaults if not in DB)
  const socials = data?.socials || { 
    github: '#', 
    linkedin: '#', 
    facebook: '#',        // Added
    youtube: '#',         // Added
    email: 'mailto:hello@example.com' 
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

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

              {/* --- BUTTONS --- */}
              <div className="flex flex-wrap items-center gap-4 mt-8">
                {/* Primary Button */}
                <Link 
                  href="/contact" 
                  className="px-6 py-3 border border-[var(--accent)] text-[var(--accent)] rounded-xl font-semibold hover:bg-[var(--accent-hover)] transition-all shadow-lg flex items-center gap-2 group"
                >
                  Contact Me 
                  <Send size={18} className="group-hover:translate-x-1 transition-transform" />
                </Link>

                {/* Secondary Button */}
                <Link 
                  href="/about" 
                  className="px-6 py-3 border border-[var(--accent)] text-[var(--accent)] rounded-xl font-medium hover:bg-[var(--accent)] hover:text-white transition-all flex items-center gap-2"
                >
                  <User size={18} /> 
                  About Me
                </Link>
              </div>

              {/* Social Icons */}
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
              <div className="relative w-full max-w-sm aspect-square rounded-2xl shadow-2xl overflow-hidden border-4 border-[var(--border)]">
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

      {/* ADMIN SECTION MANAGER */}
      <div className="container mx-auto px-6 pb-10">
        <DynamicSectionManager pageId="home" />
      </div>
    </>
  );
}