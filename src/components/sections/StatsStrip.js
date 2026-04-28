'use client';
import MotionDiv from '@/components/ui/MotionDiv';
import { useEffect, useState } from 'react';

export default function StatsStrip({ section }) {
  const [statsData, setStatsData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchStats = async () => {
      try {
        setIsLoading(true);
        const parsed = JSON.parse(section.content || '[]');
        
        const needsFetch = parsed.some(stat => stat.type !== 'custom');
        
        let collection, getDocs, db;
        if (needsFetch) {
          const firestore = await import('firebase/firestore');
          collection = firestore.collection;
          getDocs = firestore.getDocs;
          const firebaseDb = await import('@/lib/firebase');
          db = firebaseDb.db;
        }

        const results = await Promise.all(parsed.map(async (stat) => {
          if (stat.type === 'custom') return stat;
          
          if (needsFetch && db) {
            const ref = collection(db, stat.source);
            const snap = await getDocs(ref);
            return { ...stat, value: snap.size.toString(), hasPlus: true };
          }
          return stat;
        }));

        if (isMounted) setStatsData(results);
      } catch (error) {
        console.error("Failed to load stats:", error);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchStats();

    return () => { isMounted = false; };
  }, [section.content]);

  const rawColor = section.bgColor || '';
  const cleanColor = rawColor.trim();
  const isCustomColor = cleanColor.startsWith('#') || cleanColor.startsWith('var(');
  const bgStyle = isCustomColor ? { backgroundColor: cleanColor } : {};
  const bgClass = isCustomColor ? '' : 'bg-[var(--bg-primary)]';

  return (
    // REDUCED PADDING: Changed from py-24 to py-12 md:py-16
    <section style={bgStyle} className={`${bgClass} py-12 md:py-16 relative overflow-hidden`}>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-[var(--accent)]/5 blur-[100px] rounded-full pointer-events-none"></div>

      <div className="container mx-auto px-6 lg:px-20 relative z-10">
        
        {section.title && (
          // REDUCED MARGIN: Changed from mb-16 to mb-10
          <div className="mb-10 text-center">
             <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-[var(--text-primary)] inline-block">
               {section.title}
             </h2>
             <div className="h-1 w-12 bg-[var(--accent)] rounded-full mx-auto mt-3 opacity-80"></div>
          </div>
        )}
        
        {isLoading ? (
          // COMPACTED GAPS
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {[1, 2, 3, 4].map(n => (
              <div key={n} className="flex flex-col items-center justify-center p-5 md:p-6 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 animate-pulse">
                <div className="h-10 w-20 bg-black/10 dark:bg-white/10 rounded-lg mb-3"></div>
                <div className="h-3 w-24 bg-black/10 dark:bg-white/10 rounded-full"></div>
              </div>
            ))}
          </div>
        ) : statsData.length === 0 ? (
           <div className="text-center text-[var(--text-muted)] font-medium text-sm">No stats configured.</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {statsData.map((stat, i) => (
              <MotionDiv key={i} delay={i * 0.1} className="h-full">
                {/* REDUCED CARD PADDING: p-8 to p-5 md:p-6 */}
                <div className="group h-full flex flex-col items-center justify-center p-5 md:p-6 text-center rounded-2xl bg-[var(--card-bg)] border border-[var(--border)] shadow-sm hover:shadow-lg hover:-translate-y-1 hover:border-[var(--accent)]/30 transition-all duration-500 ease-out">
                  
                  {/* REDUCED NUMBER SIZE: text-6xl to text-4xl md:text-5xl */}
                  <div className="text-4xl md:text-5xl font-extrabold text-[var(--accent)] mb-2 tracking-tighter tabular-nums flex items-baseline justify-center">
                    <AnimatedNumber value={stat.value || '0'} />
                    {(stat.suffix || stat.hasPlus) && (
                      <span className="text-2xl md:text-3xl text-[var(--accent)] opacity-80 font-bold ml-1">+</span>
                    )}
                  </div>
                  
                  {/* REDUCED LABEL MARGINS */}
                  <div className="text-[10px] md:text-xs uppercase tracking-widest font-bold text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors duration-300">
                    {stat.label}
                  </div>
                  
                </div>
              </MotionDiv>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function AnimatedNumber({ value }) {
  const [displayValue, setDisplayValue] = useState(0);
  
  const target = parseInt(value.toString().replace(/[^0-9]/g, ''), 10);
  const isNumeric = !isNaN(target);

  useEffect(() => {
    if (!isNumeric) {
      setDisplayValue(value);
      return;
    }

    let startTime = null;
    const duration = 2000;

    const updateCounter = (currentTime) => {
      if (!startTime) startTime = currentTime;
      const elapsedTime = currentTime - startTime;
      const progress = Math.min(elapsedTime / duration, 1);

      const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      
      setDisplayValue(Math.floor(easeProgress * target));

      if (progress < 1) {
        requestAnimationFrame(updateCounter);
      } else {
        setDisplayValue(target);
      }
    };

    requestAnimationFrame(updateCounter);
  }, [target, value, isNumeric]);

  return <>{isNumeric ? displayValue : value}</>;
}