'use client';
import EditableImage from '@/components/editables/EditableImage';
import EditableText from '@/components/editables/EditableText';

export default function PageHero({ pageId, data }) {
  return (
    <section className="relative h-[45vh] md:h-[55vh] flex items-center justify-center overflow-hidden">
      
      {/* Layer 1: Background Image (z-20) 
          Placed ABOVE gradient so edit buttons are clickable */}
      <div className="absolute inset-0 z-20">
        <EditableImage 
          pageId={pageId} 
          fieldPath="heroImage" 
          src={data?.heroImage} 
          alt="Hero" 
          className="w-full h-full object-cover" 
          fill 
        />
      </div>

      {/* Layer 2: Gradient Overlay (z-10)
          Sits behind image, creates fade effect. 
          Added pointer-events-none so clicks pass through to image if needed */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[var(--bg-primary)]/30 to-[var(--bg-primary)] z-10 pointer-events-none" />

      {/* Layer 3: Content (z-30)
          Sits on top of everything */}
      <div className="relative z-30 text-center px-6 p-8 rounded-2xl bg-[var(--bg-secondary)]/60 backdrop-blur-md border border-[var(--border)]/50 max-w-3xl mx-4">
        
        <EditableText 
          collection="pages" 
          docId={pageId} 
          fieldPath="heroTitle" 
          value={data?.heroTitle || 'Page Title'} 
          tag="h1" 
          className="text-4xl md:text-6xl font-bold text-[var(--text-primary)]" 
        />
        
        <EditableText 
          collection="pages" 
          docId={pageId} 
          fieldPath="heroSubtitle" 
          value={data?.heroSubtitle || 'Subtitle'} 
          tag="p" 
          className="text-lg md:text-xl mt-4 text-[var(--text-secondary)]" 
        />
        
      </div>
    </section>
  );
}