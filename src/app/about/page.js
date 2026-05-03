'use client';
import EditableImage from '@/components/editables/EditableImage';
import EditableText from '@/components/editables/EditableText';
import DynamicSectionManager from '@/components/pages/DynamicSectionManager';
import PageHero from '@/components/pages/PageHero';
import SectionRenderer from '@/components/sections/SectionRenderer';
import MotionDiv from '@/components/ui/MotionDiv';
import { useDoc } from '@/lib/firestore-helpers';

export default function AboutPage() {
  const { data, loading } = useDoc('pages/about');

  if (loading) {
    return (
      <main className="min-h-screen">
        <div className="w-full h-[40vh] bg-black/5 dark:bg-white/5 animate-pulse mb-24"></div>
        <section className="container mx-auto px-6 lg:px-20 mb-24">
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-20 items-center">
            {/* Loading Text Left */}
            <div className="lg:col-span-7 order-2 lg:order-1 space-y-6">
              <div className="h-12 w-3/4 bg-black/5 dark:bg-white/5 animate-pulse rounded-lg"></div>
              <div className="space-y-4 mt-10">
                <div className="h-4 w-full bg-black/5 dark:bg-white/5 animate-pulse rounded"></div>
                <div className="h-4 w-full bg-black/5 dark:bg-white/5 animate-pulse rounded"></div>
                <div className="h-4 w-5/6 bg-black/5 dark:bg-white/5 animate-pulse rounded"></div>
              </div>
            </div>
            {/* Loading Square Image Right */}
            <div className="lg:col-span-4 lg:col-start-9 order-1 lg:order-2 aspect-square rounded-3xl bg-black/5 dark:bg-white/5 animate-pulse"></div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen overflow-hidden">
      <PageHero pageId="about" data={data} />
      
      {/* --- REDUCED SQUARE & REORIENTED SECTION --- */}
      <section className="container mx-auto px-6 lg:px-20 py-20 md:py-28 relative">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* TEXT BLOCK (Left on Desktop, Bottom on Mobile) */}
          <div className="lg:col-span-7 order-2 lg:order-1">
            <MotionDiv delay={0.2} className="space-y-8">
              <div>
                <EditableText 
                  collection="pages" 
                  docId="about" 
                  fieldPath="bioTitle" 
                  value={data?.bioTitle || 'Who am I?'} 
                  tag="h2" 
                  className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-[var(--text-primary)] leading-tight" 
                />
                <div className="h-1.5 w-24 bg-[var(--accent)] rounded-full mt-6 opacity-80"></div>
              </div>

              <div className="pt-4 mb-8">
                <EditableText 
                  collection="pages" 
                  docId="about" 
                  fieldPath="bio" 
                  value={data?.bio || 'Bio...'} 
                  tag="div" 
                  className="
                    prose prose-lg md:prose-xl dark:prose-invert max-w-none
                    text-[var(--text-secondary)] leading-relaxed
                    prose-p:mb-6
                    prose-a:text-[var(--accent)] prose-a:font-semibold prose-a:no-underline hover:prose-a:underline hover:prose-a:underline-offset-4
                    prose-strong:text-[var(--text-primary)]
                  " 
                  markdown={true} 
                />
              </div>
            </MotionDiv>
          </div>

          {/* IMAGE BLOCK (Right on Desktop, Top on Mobile) */}
          {/* Changed col-span-5 to col-span-4, added col-start-9 to push it to the far right, and changed aspect to square */}
          <div className="lg:col-span-4 lg:col-start-9 order-1 lg:order-2 relative group perspective-1000">
            <div className="absolute -inset-4 bg-gradient-to-tr from-[var(--accent)]/30 to-transparent blur-3xl rounded-[3rem] opacity-40 group-hover:opacity-70 transition-opacity duration-700"></div>
            <div className="absolute top-6 -left-6 w-full h-full border-2 border-[var(--border)] rounded-3xl hidden md:block"></div>
            
            {/* CHANGED aspect-[3/4] to aspect-square */}
            <MotionDiv delay={0.1} className="relative aspect-square w-full max-w-[400px] mx-auto lg:max-w-none rounded-3xl overflow-hidden shadow-2xl ring-1 ring-black/10 dark:ring-white/10 transition-transform duration-700 ease-out group-hover:-translate-y-2 group-hover:rotate-1 z-10 bg-[var(--bg-secondary)]">
              <EditableImage 
                pageId="about" 
                fieldPath="profileImage" 
                src={data?.profileImage} 
                alt="Profile"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                fill={false} 
              />
            </MotionDiv>
          </div>
          
        </div>
      </section>

      <div className="relative z-20">
        <SectionRenderer pageId="about" />
      </div>

      <div className="container mx-auto px-6 pb-20">
        <DynamicSectionManager pageId="about" />
      </div>
    </main>
  );
}