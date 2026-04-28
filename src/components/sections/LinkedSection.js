'use client';
import MotionDiv from '@/components/ui/MotionDiv';
import { ArrowRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { useDynamicFirestore } from '@/hooks/useDynamicFirestore';
import { useDoc } from '@/lib/firestore-helpers';
import ProjectDisplay from './ProjectDisplay';

export default function LinkedSection({ section, index }) {
  const { linkedPage, linkedCollection, limit = 3, layout = 'grid' } = section;

  // 1. Data Fetching
  const { data: pageData } = useDoc(`pages/${linkedPage}`);
  const { data: items, isLoading } = useDynamicFirestore(linkedCollection, 20);

  // 2. States
  const [visibleItems, setVisibleItems] = useState([]);
  const [isHovered, setIsHovered] = useState(false);
  const [relatedGallery, setRelatedGallery] = useState([]);

  // 3. Fetch Related Gallery Images specifically for Projects
  useEffect(() => {
    if (linkedCollection === 'projects' && items && items.length > 0) {
      const fetchGallery = async () => {
        try {
          const { collection, getDocs, query, where, limit: l } = await import('firebase/firestore');
          const { db } = await import('@/lib/firebase');
          
          const projectIds = items.map(p => p.id);
          // Firestore 'in' queries only support up to 10 items at a time
          const batchIds = projectIds.slice(0, 10); 
          
          if (batchIds.length > 0) {
            const gQuery = query(collection(db, 'gallery'), where('relatedProjectId', 'in', batchIds), l(50));
            const gSnap = await getDocs(gQuery);
            setRelatedGallery(gSnap.docs.map(d => ({ id: d.id, ...d.data() })));
          }
        } catch (error) {
          console.error("Error fetching project gallery:", error);
        }
      };
      fetchGallery();
    }
  }, [linkedCollection, items]);

  // 4. Smart Rotation Logic
  useEffect(() => {
    if (!items || items.length === 0) return;
    
    if (visibleItems.length === 0) {
      setVisibleItems(items.slice(0, limit));
    }
    
    if (items.length <= limit || isHovered) return;

    const interval = setInterval(() => {
      setVisibleItems(prev => {
        if (!prev.length) return items.slice(0, limit);
        const startIdx = (items.findIndex(i => i.id === prev[0].id) + 1) % items.length;
        const newItems = [];
        for (let i = 0; i < limit; i++) {
          newItems.push(items[(startIdx + i) % items.length]);
        }
        return newItems;
      });
    }, 5000);
    
    return () => clearInterval(interval);
  }, [items, limit, isHovered, visibleItems.length]);

  // 5. Background Styling
  const rawColor = section.bgColor || '';
  const cleanColor = rawColor.trim();
  const isCustomColor = cleanColor.startsWith('#') || cleanColor.startsWith('var(');
  const bgStyle = isCustomColor ? { backgroundColor: cleanColor } : {};
  const bgClass = isCustomColor ? '' : 'bg-[var(--bg-primary)]';

  // --- SKELETON LOADING STATE (High-Fidelity) ---
  if (isLoading) {
    return (
      <section style={bgStyle} className={`${bgClass} py-24`}>
        <div className="container mx-auto px-6 lg:px-20">
           <div className="flex justify-between items-center mb-12">
             <div className="h-10 w-64 bg-black/5 dark:bg-white/5 animate-pulse rounded-lg"></div>
             <div className="h-10 w-28 bg-black/5 dark:bg-white/5 animate-pulse rounded-full"></div>
           </div>
           <div className="grid md:grid-cols-3 gap-8">
             {[1, 2, 3].map(n => (
               <div key={n} className="rounded-2xl border border-[var(--border)] overflow-hidden shadow-sm">
                 <div className="h-48 bg-black/5 dark:bg-white/5 animate-pulse"></div>
                 <div className="p-6 space-y-3">
                   <div className="h-6 w-3/4 bg-black/5 dark:bg-white/5 animate-pulse rounded"></div>
                   <div className="h-4 w-1/3 bg-black/5 dark:bg-white/5 animate-pulse rounded"></div>
                   <div className="h-16 w-full bg-black/5 dark:bg-white/5 animate-pulse rounded mt-4"></div>
                 </div>
               </div>
             ))}
           </div>
        </div>
      </section>
    );
  }

  // Hide if no items exist after loading finishes
  if (!items || items.length === 0) return null;

  const gridCols = linkedCollection === 'gallery' ? 'grid-cols-2 md:grid-cols-4' : 'grid-cols-1 md:grid-cols-3';

  // --- RENDER: ACTUAL CONTENT ---
  return (
    <section style={bgStyle} className={`${bgClass} py-24`}>
      <div 
        className="container mx-auto px-6 lg:px-20"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* HEADER & MAGNETIC CTA */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-4">
          <h2 className="text-4xl font-extrabold tracking-tight text-[var(--text-primary)]">
            {section.title || pageData?.heroTitle || `${linkedPage} Highlights`}
          </h2>
          <Link 
            href={`/${linkedPage}`} 
            className="group inline-flex items-center gap-2 px-6 py-2.5 rounded-full border border-[var(--border)] bg-transparent text-[var(--text-primary)] hover:border-[var(--accent)] hover:bg-[var(--accent)] hover:text-white transition-all duration-300 font-semibold text-sm shadow-sm hover:shadow-md active:scale-95"
          >
            Explore All <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Layout: SPECIAL PROJECTS OVERRIDE */}
        {linkedCollection === 'projects' && visibleItems[0] && (() => {
          const currentProject = visibleItems[0];
          const projectImages = [
            currentProject.imageUrl,
            ...(relatedGallery.filter(g => g.relatedProjectId === currentProject.id).map(g => g.imageUrl))
          ].filter(Boolean);

          return (
            <MotionDiv delay={0.1}>
              <ProjectDisplay key={currentProject.id} project={currentProject} images={projectImages} />
            </MotionDiv>
          );
        })()}

        {/* Layout: GRID (Apple-esque Cards) */}
        {layout === 'grid' && linkedCollection !== 'projects' && (
          <div className={`grid ${gridCols} gap-8`}>
            {visibleItems.map((item, i) => <ItemCard key={item.id} item={item} index={i} collectionName={linkedCollection} />)}
          </div>
        )}

        {/* Layout: SIDE BY SIDE */}
        {(layout === 'side-left' || layout === 'side-right') && visibleItems[0] && linkedCollection !== 'projects' && (
          <div className={`grid md:grid-cols-2 gap-16 items-center`}>
            <div className={`relative ${layout === 'side-right' ? 'order-1 md:order-2' : 'order-2 md:order-1'}`}>
              {/* Decorative background blur to give the image depth */}
              <div className="absolute -inset-4 bg-gradient-to-tr from-[var(--accent)]/20 to-transparent blur-2xl rounded-full opacity-50"></div>
              <img src={visibleItems[0].imageUrl || '/placeholder.jpg'} className="relative rounded-2xl shadow-2xl w-full aspect-[4/3] object-cover ring-1 ring-black/5" alt="" />
            </div>
            <div className={layout === 'side-right' ? 'order-2 md:order-1' : 'order-1 md:order-2'}>
              <h3 className="text-3xl font-bold mb-4 text-[var(--text-primary)] tracking-tight">{visibleItems[0].title}</h3>
              <p className="text-lg text-[var(--text-secondary)] mb-6 leading-relaxed">{visibleItems[0].description}</p>
            </div>
          </div>
        )}

        {/* Layout: LIST (Sleek Index View with Full Metadata) */}
        {(layout === 'list') && linkedCollection !== 'projects' && (
           <div className="grid md:grid-cols-2 gap-x-12 gap-y-0 divide-y divide-[var(--border)] border-t border-[var(--border)] mt-6">
             {visibleItems.map((item) => (
                <Link key={item.id} href={`/${linkedCollection}/${item.id}`} className="flex gap-6 py-6 items-start group hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors -mx-4 px-4 rounded-xl">
                   
                   {/* Optional Image */}
                   {item.imageUrl && (
                      <div className="h-20 w-20 relative rounded-xl overflow-hidden shrink-0 shadow-sm ring-1 ring-black/5 mt-1">
                        <Image src={item.imageUrl} fill className="object-cover group-hover:scale-110 transition-transform duration-700 ease-out" alt="" unoptimized />
                      </div>
                   )}
                   
                   {/* Text Content */}
                   <div className="flex-1">
                     <h4 className="font-bold text-lg text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors leading-tight">
                       {item.title || item.role || item.company}
                     </h4>
                     
                     {/* Smart Metadata Group (Journal, Company, Duration, AND Authors) */}
                     {(item.company || item.journal || item.authors || item.author) && (
                        <div className="mt-1.5">
                          {(item.company || item.journal) && (
                            <p className="text-[var(--accent)] font-bold tracking-wider uppercase text-[10px]">
                              {item.company || item.journal} {item.duration && `• ${item.duration}`}
                            </p>
                          )}
                          {(item.authors || item.author) && (
                            <p className="text-[var(--text-secondary)] text-xs font-medium mt-0.5">
                              {item.authors || item.author}
                            </p>
                          )}
                        </div>
                     )}
                     
                     <p className="text-sm text-[var(--text-secondary)] line-clamp-2 mt-2 leading-relaxed">
                       {item.description || item.summary}
                     </p>
                   </div>
                   
                   {/* Arrow Icon */}
                   <div className="pt-1 shrink-0">
                     <ArrowRight size={18} className="text-[var(--border)] group-hover:text-[var(--accent)] group-hover:translate-x-2 transition-all duration-300" />
                   </div>
                </Link>
             ))}
           </div>
        )}

      </div>
    </section>
  );
}

// --- ITEM CARD COMPONENT (Grid Layout) ---
function ItemCard({ item, index, collectionName }) {
  const href = collectionName ? `/${collectionName}/${item.id}` : '#';
  return (
    <MotionDiv delay={index * 0.1} className="h-full">
      <Link href={href} className="flex flex-col bg-[var(--card-bg)] rounded-2xl overflow-hidden h-full group transition-all duration-500 hover:-translate-y-1.5 hover:shadow-xl shadow-sm ring-1 ring-black/5 dark:ring-white/10 hover:ring-[var(--accent)]/50">
        {item.imageUrl && (
          <div className="relative aspect-[4/3] w-full overflow-hidden shrink-0 border-b border-black/5 dark:border-white/5">
            <Image src={item.imageUrl} alt={item.title || 'Item'} fill className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out" unoptimized />
          </div>
        )}
        <div className="p-6 flex-grow flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-xl mb-1 text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors leading-tight">
              {item.title || item.role || item.company}
            </h3>
            
            {/* Smart Metadata Group for Grid Cards */}
            {(item.company || item.journal || item.authors || item.author) && (
               <div className="mb-3">
                 {(item.company || item.journal) && (
                   <p className="text-[var(--accent)] font-semibold tracking-wide uppercase text-[10px]">
                     {item.company || item.journal} {item.duration && `• ${item.duration}`}
                   </p>
                 )}
                 {(item.authors || item.author) && (
                   <p className="text-[var(--text-secondary)] text-xs mt-1 font-medium">
                     {item.authors || item.author}
                   </p>
                 )}
               </div>
            )}
            
            <p className="text-[var(--text-secondary)] text-sm leading-relaxed line-clamp-3">{item.description || item.summary}</p>
          </div>
          <div className="mt-6 flex items-center text-[var(--accent)] text-sm font-bold opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all duration-300">
            Read More <ArrowRight size={16} className="ml-1" />
          </div>
        </div>
      </Link>
    </MotionDiv>
  );
}