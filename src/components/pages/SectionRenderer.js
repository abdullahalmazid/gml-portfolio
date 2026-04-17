'use client';
import EditableText from '@/components/editables/EditableText';
import MotionDiv from '@/components/ui/MotionDiv';
import { useColl } from '@/lib/firestore-helpers';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function SectionRenderer({ pageId }) {
  const { items: allSections } = useColl('sections');
  const sections = allSections.filter(s => s.pageId === pageId).sort((a, b) => (a.order || 0) - (b.order || 0));

  return (
    <>
      {sections.map((sec, i) => {
        if (sec.type === 'linked') {
          return <LinkedLayout key={sec.id} section={sec} index={i} />;
        }
        // Inside the sections.map loop

          if (sec.type === 'stats') {
            return <StatsStrip key={sec.id} section={sec} />;
          }
          
        

        // CUSTOM SECTIONS
        const rawColor = sec.bgColor || '';
        const cleanColor = rawColor.trim();
        const isCustomColor = cleanColor.startsWith('#') || cleanColor.startsWith('var(');
        const bgStyle = isCustomColor ? { backgroundColor: cleanColor } : {};
        const bgClass = isCustomColor ? '' : 'bg-[var(--bg-primary)]';

        // Box Positioning Logic
        let boxClasses = "max-w-3xl"; 
        if (sec.titleAlign === 'Center') boxClasses += " mx-auto text-center";
        else if (sec.titleAlign === 'Right') boxClasses += " ml-auto text-right";
        else boxClasses += " mr-auto text-left";

        return (
          <section key={sec.id} style={bgStyle} className={`${bgClass} py-20`}>
            <MotionDiv delay={i * 0.1}>
              <div className="container mx-auto px-6">
                <div className={boxClasses}>
                  <EditableText collection="sections" docId={sec.id} fieldPath="title" value={sec.title} tag="h2" className="text-3xl font-bold mb-6 text-[var(--text-primary)]" />
                  <EditableText collection="sections" docId={sec.id} fieldPath="content" value={sec.content} tag="div" className="text-lg leading-relaxed text-[var(--text-secondary)]" markdown={true} />
                </div>
              </div>
            </MotionDiv>
          </section>
        );
      })}
    </>
  );
}

// --- SMART LINKED LAYOUT COMPONENT ---
function LinkedLayout({ section, index }) {
  const { linkedPage, linkedCollection, limit = 3, layout } = section;
  
  const [items, setItems] = useState([]);
  const [pageData, setPageData] = useState({});
  const [relatedGallery, setRelatedGallery] = useState([]);
  const [visibleItems, setVisibleItems] = useState([]);

  // Fetch Logic
  useEffect(() => {
    const fetch = async () => {
      const { collection, getDocs, query, orderBy, limit: l, doc, getDoc, where } = await import('firebase/firestore');
      const { db } = await import('@/lib/firebase');
      
      // 1. Fetch Main Items
      const q = query(collection(db, linkedCollection), orderBy('createdAt', 'desc'), l(20)); 
      const snap = await getDocs(q);
      const fetchedItems = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setItems(fetchedItems);

      if (fetchedItems.length > 0) {
        setVisibleItems(fetchedItems.slice(0, limit));
      }

      const pageSnap = await getDoc(doc(db, 'pages', linkedPage));
      if(pageSnap.exists()) setPageData(pageSnap.data());

      // 2. Fetch Related Gallery for ALL fetched items (prevents missing images during rotation)
      if (linkedCollection === 'projects' && fetchedItems.length > 0) {
        const projectIds = fetchedItems.map(p => p.id);
        const gQuery = query(
          collection(db, 'gallery'), 
          where('relatedProjectId', 'in', projectIds), 
          l(50) // Fetch up to 50 screenshots
        );
        const gSnap = await getDocs(gQuery);
        setRelatedGallery(gSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      }
    };
    fetch();
  }, [linkedCollection, limit, linkedPage]);

  // ROTATION LOGIC: Change Project every 5 seconds
  useEffect(() => {
    if (items.length <= limit) return; 
    let currentIdx = 0;
    const rotate = () => {
      currentIdx = (currentIdx + 1) % items.length;
      const newVisible = [];
      for(let i=0; i<limit; i++) { newVisible.push(items[(currentIdx + i) % items.length]); }
      setVisibleItems(newVisible);
    };
    const timer = setInterval(rotate, 5000);
    return () => clearInterval(timer);
  }, [items, limit]);

  // Background Logic
  const rawColor = section.bgColor || '';
  const cleanColor = rawColor.trim();
  const isCustomColor = cleanColor.startsWith('#') || cleanColor.startsWith('var(');
  const bgStyle = isCustomColor ? { backgroundColor: cleanColor } : {};
  const bgClass = isCustomColor ? '' : 'bg-[var(--bg-primary)]';

  // --- SPECIAL RENDER FOR PROJECTS ---
  if (linkedCollection === 'projects') {
    const currentProject = visibleItems[0];
    
    // CRITICAL: Filter screenshots strictly for THIS project
    const projectImages = currentProject ? [
      currentProject.imageUrl, // Cover Image
      ...(relatedGallery
          .filter(g => g.relatedProjectId === currentProject.id) // STRICT FILTER
          .map(g => g.imageUrl) 
      )
    ].filter(Boolean) : [];

    return (
      <section style={bgStyle} className={`${bgClass} py-20`}>
        <div className="container mx-auto px-6">
          <div className="flex justify-between items-center mb-10">
            <h2 className="text-3xl font-bold text-[var(--text-primary)]">{section.title || 'Projects'}</h2>
            
          </div>

          {currentProject && (
            <ProjectDisplay 
              key={currentProject.id} // Resets internal image timer when project changes
              project={currentProject} 
              images={projectImages} 
            />
          )}
        </div>
        <div className="flex justify-center mt-12">
          <Link 
              href={`/${linkedPage}`} 
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border-2 border-[var(--accent)] text-[var(--accent)] hover:bg-[var(--accent)] hover:text-white transition-all duration-300 text-sm font-bold group"
            >
              See All Projects <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
        </div>
        
      </section>
    );
  }

  // --- DEFAULT RENDER (Grid / List / Side-by-Side) ---
  return (
    <section style={bgStyle} className={`${bgClass} py-20`}>
      <div className="container mx-auto px-6">
        <div className="flex justify-between items-center mb-10">
          <h2 className="text-3xl font-bold text-[var(--text-primary)]">
            {section.title || pageData?.heroTitle || `${linkedPage} Highlights`}
          </h2>
        </div>

        {layout === 'grid' && (
          <div className="grid md:grid-cols-3 gap-6">
            {visibleItems.map((item, i) => <ItemCard key={item.id} item={item} index={i} collectionName={linkedCollection} />)}
          </div>
        )}

        {(layout === 'side-left' || layout === 'side-right') && visibleItems[0] && (
          <div className={`grid md:grid-cols-2 gap-12 items-center`}>
            <div className={layout === 'side-right' ? 'order-1' : 'order-2'}>
              <img src={visibleItems[0].imageUrl} className="rounded-xl shadow-lg w-full h-80 object-cover" alt="" />
            </div>
            <div className={layout === 'side-right' ? 'order-2' : 'order-1'}>
              <h3 className="text-2xl font-bold mb-4">{visibleItems[0].title}</h3>
              <p className="text-gray-600 mb-4">{visibleItems[0].description}</p>
              {visibleItems[1] && (
                <div className="mt-4 p-4 border rounded-lg bg-white shadow-sm">
                  <h4 className="font-bold">{visibleItems[1].title}</h4>
                  <p className="text-sm text-gray-500">{visibleItems[1].description?.substring(0, 100)}...</p>
                </div>
              )}
            </div>
          </div>
        )}
        
        {(layout === 'list' || !layout) && (
           <div className="space-y-4">
             {visibleItems.map((item, i) => <ItemCard key={item.id} item={item} index={i} collectionName={linkedCollection} />)}
           </div>
        )}

        <div className="flex justify-center mt-12">
          <Link href={`/${linkedPage}`} className="inline-flex items-center gap-2 px-6 py-3 rounded-full border-2 border-[var(--accent)] text-[var(--accent)] hover:bg-[var(--accent)] hover:text-white transition-all duration-300 text-sm font-bold group">
            Click Here to See More <ArrowUpRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

      </div>
    </section>
  );
}

// --- PROJECT DISPLAY COMPONENT (Handles Image Cycling) ---
function ProjectDisplay({ project, images }) {
  const [currentImageIdx, setCurrentImageIdx] = useState(0);
  const currentImage = images[currentImageIdx];

  // Cycle images every 2.5 seconds
  useEffect(() => {
    if (images.length <= 1) return; // No need to cycle if 0 or 1 image
    
    const interval = setInterval(() => {
      setCurrentImageIdx((prev) => (prev + 1) % images.length);
    }, 2500);

    return () => clearInterval(interval);
  }, [images]);

  return (
    <div className="grid md:grid-cols-2 gap-8 items-stretch">
      
      {/* LEFT: TEXT INFO (Fixed Layout) */}
      <div className="flex flex-col justify-center py-4 order-2 md:order-1">
        <span className="text-xs font-bold text-[var(--accent)] uppercase tracking-wider mb-2">Featured Project</span>
        <h3 className="text-3xl font-bold mb-4 text-[var(--text-primary)]">{project.title}</h3>
        <p className="text-[var(--text-secondary)] mb-6 leading-relaxed">
          {project.description}
        </p>
        <Link 
          href={`/projects/${project.id}`} 
          className="inline-flex items-center gap-2 text-[var(--accent)] font-semibold hover:underline"
        >
          View Case Study <ArrowRight size={18} />
        </Link>
      </div>

      {/* RIGHT: IMAGE FRAME (Strict Dimensions) */}
      <div className="relative h-[350px] md:h-[450px] w-full rounded-2xl overflow-hidden shadow-xl border border-[var(--border)] bg-[var(--bg-tertiary)] order-1 md:order-2">
        
        {currentImage ? (
          <Image 
            key={currentImage} // Key change triggers smooth fade in Next/Image
            src={currentImage} 
            fill 
            className="object-cover transition-opacity duration-500" 
            alt={`${project.title} screenshot ${currentImageIdx + 1}`} 
            unoptimized 
          />
        ) : (
          <div className="flex items-center justify-center h-full text-[var(--text-muted)] text-sm text-center p-4">
            No image available for this project
          </div>
        )}

        {/* Image Counter Badge */}
        {images.length > 1 && (
          <div className="absolute bottom-3 right-3 bg-black/60 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm">
            {currentImageIdx + 1} / {images.length}
          </div>
        )}
      </div>

    </div>
  );
}

// --- ITEM CARD COMPONENT ---
function ItemCard({ item, index, collectionName }) {
  const href = collectionName ? `/${collectionName}/${item.id}` : '#';
  return (
    <MotionDiv delay={index * 0.1}>
      <Link href={href} className="block bg-[var(--card-bg)] rounded-xl border overflow-hidden hover:shadow-md transition-shadow group h-full">
        {item.imageUrl && (
          <div className="relative h-48 w-full">
            <Image src={item.imageUrl} alt={item.title || 'Item'} fill className="object-cover group-hover:scale-105 transition-transform duration-300" unoptimized />
          </div>
        )}
        <div className="p-5">
          <h3 className="font-bold text-lg mb-1 text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors">{item.title || item.role}</h3>
          <p className="text-sm text-gray-500 line-clamp-2">{item.description || item.summary}</p>
        </div>
      </Link>
    </MotionDiv>
  );
}

// Add this function inside SectionRenderer.js

function StatsStrip({ section }) {
  const [statsData, setStatsData] = useState([]);

  useEffect(() => {
    const init = async () => {
      try {
        const parsed = JSON.parse(section.content || '[]');
        const { collection, getDocs } = await import('firebase/firestore');
        const { db } = await import('@/lib/firebase');

        const results = await Promise.all(parsed.map(async (stat) => {
          if (stat.type === 'custom') return stat;
          else {
            const ref = collection(db, stat.source);
            const snap = await getDocs(ref);
            return { ...stat, value: snap.size.toString() };
          }
        }));
        setStatsData(results);
      } catch (e) { console.error("Stats error", e); }
    };
    init();
  }, [section.content]);

  // Background Logic (Same as other sections)
  const rawColor = section.bgColor || '';
  const cleanColor = rawColor.trim();
  const isCustomColor = cleanColor.startsWith('#') || cleanColor.startsWith('var(');
  const bgStyle = isCustomColor ? { backgroundColor: cleanColor } : {};
  const bgClass = isCustomColor ? '' : 'bg-[var(--bg-primary)]';

  return (
    <section style={bgStyle} className={`${bgClass} py-20`}>
      <div className="container mx-auto px-6">
        {section.title && <h2 className="text-2xl font-bold mb-8 text-center text-[var(--text-primary)]">{section.title}</h2>}
        
        {statsData.length === 0 ? (
          <div className="text-center text-gray-400">No stats configured.</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {statsData.map((stat, i) => (
              <MotionDiv key={i} delay={i * 0.1}>
                <div className="text-4xl md:text-5xl font-bold text-[var(--accent)] mb-2">{stat.value || '0'}</div>
                <div className="text-sm uppercase tracking-wider text-[var(--text-muted)]">{stat.label}</div>
              </MotionDiv>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}