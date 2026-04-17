'use client';
import MotionDiv from '@/components/ui/MotionDiv';
import { useColl, useDoc } from '@/lib/firestore-helpers';
import { ArrowRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function LinkedPageSection({ section }) {
  const { linkedPage, linkedCollection, limit = 3 } = section;
  
  const { data: pageData } = useDoc(`pages/${linkedPage}`);
  const { items } = useColl(linkedCollection);

  const [visibleItems, setVisibleItems] = useState([]);

  useEffect(() => {
    if (items.length === 0) return;
    setVisibleItems(items.slice(0, limit));
    const interval = setInterval(() => {
      setVisibleItems(prev => {
        // Simple rotation logic
        const startIdx = (items.findIndex(i => i.id === prev[0]?.id) + 1) % items.length;
        return items.slice(startIdx, startIdx + limit).concat(items.slice(0, Math.max(0, (startIdx + limit) - items.length)));
      });
    }, 5000);
    return () => clearInterval(interval);
  }, [items, limit]);

  if (!pageData && items.length === 0) return null;

  // Determine grid columns based on collection type
  const gridCols = linkedCollection === 'gallery' ? 'grid-cols-2 md:grid-cols-4' : 'grid-cols-1 md:grid-cols-3';

  return (
    <section className={` py-20 ${section.bgColor === 'gray' ? 'bg-[var(--bg-secondary)]' : 'bg-[var(--bg-primary)]'}`}>
      <div className="container mx-auto px-20">
        <div className="flex justify-between items-center mb-10">
          <h2 className="text-3xl font-bold text-[var(--text-primary)]">
            {pageData?.heroTitle || section.title}
          </h2>
          <Link href={`/${linkedPage}`} className="flex items-center gap-1 text-[var(--accent)] hover:underline font-medium">
            See All <ArrowRight size={18} />
          </Link>
        </div>

        <div className={`grid ${gridCols} gap-6`}>
          {visibleItems.map((item, i) => (
            <MotionDiv key={item.id || i} delay={i * 0.1}>
              <div className="bg-[var(--card-bg)] rounded-xl border border-[var(--border)] overflow-hidden hover:shadow-md transition-shadow h-full group">
                
                {/* Render Image if available (Gallery/Projects) */}
                {item.imageUrl && (
                  <div className="relative w-full h-48">
                    <Image 
                      src={item.imageUrl} 
                      alt={item.title || 'Image'} 
                      fill 
                      className="object-cover group-hover:scale-105 transition-transform duration-300" 
                    />
                  </div>
                )}

                <div className="p-5">
                  <h3 className="text-lg font-bold mb-1 text-[var(--text-primary)]">
                    {item.title || item.role || item.company}
                  </h3>
                  {/* Show subtitle if available (Experience/Publications) */}
                  {(item.company || item.journal) && (
                     <p className="text-sm text-[var(--accent)] mb-2">{item.company || item.journal} {item.duration && `• ${item.duration}`}</p>
                  )}
                  <p className="text-sm text-[var(--text-secondary)] line-clamp-3">{item.description || item.summary}</p>
                </div>
              </div>
            </MotionDiv>
          ))}
        </div>
      </div>
    </section>
  );
}