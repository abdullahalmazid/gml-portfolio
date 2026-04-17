'use client';
import EditableImage from '@/components/editables/EditableImage';
import EditableText from '@/components/editables/EditableText';
import DynamicSectionManager from '@/components/pages/DynamicSectionManager';
import PageHero from '@/components/pages/PageHero';
import SectionRenderer from '@/components/pages/SectionRenderer';
import MotionDiv from '@/components/ui/MotionDiv';
import { useDoc } from '@/lib/firestore-helpers';

export default function AboutPage() {
  const { data, loading } = useDoc('pages/about');
  if (loading) return <div className="p-10">Loading...</div>;

  return (
    <main>
      <PageHero pageId="about" data={data} />
      
      <section className="container mx-auto px-6 py-24">
        <div className="grid md:grid-cols-2 gap-16 items-start">
          <MotionDiv>
            <EditableImage pageId="about" fieldPath="profileImage" src={data?.profileImage} alt="Profile"
              className="rounded-2xl shadow-xl object-cover" fill={false} />
          </MotionDiv>
          <MotionDiv delay={0.2} className="space-y-6">
            <EditableText collection="pages" docId="about" fieldPath="bioTitle" value={data?.bioTitle || 'Who am I?'} tag="h2" className="text-3xl font-bold" />
            <EditableText collection="pages" docId="about" fieldPath="bio" value={data?.bio || 'Bio...'} tag="div" className="text-[var(--text-secondary)] leading-relaxed" markdown={true} />
          </MotionDiv>
        </div>
      </section>

      {/* RENDER DYNAMIC SECTIONS HERE */}
      <SectionRenderer pageId="about" />

      {/* ADMIN SECTION MANAGER */}
      <div className="container mx-auto px-6 pb-10">
        <DynamicSectionManager pageId="about" />
      </div>
    </main>
  );
}