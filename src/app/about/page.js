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

  // Hardcoded BUET Education Data (so you don't need a CMS for this)
  const myEducation = [
    {
      id: "buet-ipe",
      title: "B.Sc. in Industrial and Production Engineering",
      company: "Bangladesh University of Engineering and Technology (BUET)",
      duration: "Expected 2026",
      authors: "Targeting CGPA: > 3.7 | Undergraduate Thesis Track",
      description: "**Core Academic Focus:** Advanced systems optimization, operations research, and applied machine learning within industrial environments. \n\n**Key Coursework:** Artificial Neural Networks (IPE 465), Queueing Theory, Process Optimization, Facilities Planning, and Systems Simulation."
    }
  ];

  if (loading) {
    return (
      <main className="min-h-screen">
        <div className="w-full h-[40vh] bg-black/5 dark:bg-white/5 animate-pulse mb-24"></div>
        <section className="container mx-auto px-6 lg:px-20 mb-24">
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-20 items-start">
            <div className="lg:col-span-5 aspect-[3/4] rounded-3xl bg-black/5 dark:bg-white/5 animate-pulse"></div>
            <div className="lg:col-span-7 pt-8 space-y-6">
              <div className="h-12 w-3/4 bg-black/5 dark:bg-white/5 animate-pulse rounded-lg"></div>
              <div className="space-y-4 mt-10">
                <div className="h-4 w-full bg-black/5 dark:bg-white/5 animate-pulse rounded"></div>
                <div className="h-4 w-full bg-black/5 dark:bg-white/5 animate-pulse rounded"></div>
                <div className="h-4 w-5/6 bg-black/5 dark:bg-white/5 animate-pulse rounded"></div>
              </div>
            </div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen overflow-hidden">
      <PageHero pageId="about" data={data} />
      
      <section className="container mx-auto px-6 lg:px-20 py-24 md:py-32 relative">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-20 items-center">
          
          <div className="lg:col-span-5 relative group perspective-1000">
            <div className="absolute -inset-4 bg-gradient-to-tr from-[var(--accent)]/30 to-transparent blur-3xl rounded-[3rem] opacity-40 group-hover:opacity-70 transition-opacity duration-700"></div>
            <div className="absolute top-6 -left-6 w-full h-full border-2 border-[var(--border)] rounded-3xl hidden md:block"></div>
            
            <MotionDiv delay={0.1} className="relative aspect-[3/4] w-full rounded-3xl overflow-hidden shadow-2xl ring-1 ring-black/10 dark:ring-white/10 transition-transform duration-700 ease-out group-hover:-translate-y-2 group-hover:rotate-1 z-10 bg-[var(--bg-secondary)]">
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

          <div className="lg:col-span-7">
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

              <div className="pt-4 mb-12">
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

              {/* --- NEW: HARDCODED EDUCATION SECTION USING THE PREMIUM LIST UI --- */}
              <div className="mt-16 border-t border-[var(--border)] pt-12">
                 <h3 className="text-2xl font-bold mb-8 text-[var(--text-primary)]">Academic Foundation</h3>
                 
                 <div className="grid gap-x-12 gap-y-0 divide-y divide-[var(--border)] border-t border-[var(--border)]">
                   {myEducation.map((item) => (
                      <div key={item.id} className="flex gap-6 py-6 items-start group hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors -mx-4 px-4 rounded-xl">
                         <div className="flex-1">
                           <h4 className="font-bold text-xl text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors leading-tight">
                             {item.title}
                           </h4>
                           
                           <div className="mt-2">
                             <p className="text-[var(--accent)] font-bold tracking-wider uppercase text-xs">
                               {item.company} • {item.duration}
                             </p>
                             <p className="text-[var(--text-secondary)] text-sm font-medium mt-1">
                               {item.authors}
                             </p>
                           </div>
                           
                           {/* Renders standard newlines (\n) nicely */}
                           <p className="text-[15px] text-[var(--text-secondary)] mt-4 leading-relaxed whitespace-pre-wrap">
                             {item.description}
                           </p>
                         </div>
                      </div>
                   ))}
                 </div>
              </div>

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