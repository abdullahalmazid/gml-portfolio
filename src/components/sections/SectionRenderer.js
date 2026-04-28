'use client';
import { useColl } from '@/lib/firestore-helpers';

// The updated imports pointing to your new clean files
import CustomTextSection from './CustomTextSection';
import LinkedSection from './LinkedSection';
import StatsStrip from './StatsStrip';

export default function SectionRenderer({ pageId }) {
  const { items: allSections } = useColl('sections');
  
  const sections = allSections
    .filter(s => s.pageId === pageId)
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  return (
    <>
      {sections.map((sec, i) => {
        // 1. Render Linked Sections (Using the newly named LinkedSection)
        if (sec.type === 'linked') {
          return <LinkedSection key={sec.id} section={sec} index={i} />;
        }

        // 2. Render Stat Strips
        if (sec.type === 'stats') {
          return <StatsStrip key={sec.id} section={sec} />;
        }

        // 3. Render Custom Text Sections (Default fallback)
        return <CustomTextSection key={sec.id} section={sec} index={i} />;
      })}
    </>
  );
}