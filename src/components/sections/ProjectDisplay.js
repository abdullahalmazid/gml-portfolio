'use client';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

export default function ProjectDisplay({ project, images = [] }) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  // Memoized navigation controls
  const nextImage = useCallback(() => {
    setCurrentIdx((prev) => (prev + 1) % images.length);
  }, [images.length]);

  const prevImage = useCallback(() => {
    setCurrentIdx((prev) => (prev - 1 + images.length) % images.length);
  }, [images.length]);

  // Cinematic pacing: Extended to 3.5s for a more premium, unhurried feel
  useEffect(() => {
    if (images.length <= 1 || isHovered) return; 
    const timer = setInterval(nextImage, 3500);
    return () => clearInterval(timer);
  }, [images.length, isHovered, nextImage]);

  return (
    <div className="grid md:grid-cols-12 gap-8 lg:gap-16 items-center">
      
      {/* LEFT: PREMIUM TEXT INFO (Takes up 5 columns on desktop) */}
      <div className="flex flex-col justify-center py-4 order-2 md:order-1 md:col-span-5">
        <div className="mb-6">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--accent)]/10 text-[var(--accent)] text-xs font-bold tracking-widest uppercase shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-pulse"></span>
            Featured Project
          </span>
        </div>
        
        <h3 className="text-4xl md:text-5xl font-extrabold mb-6 text-[var(--text-primary)] tracking-tight leading-tight">
          {project.title}
        </h3>
        
        <p className="text-lg text-[var(--text-secondary)] mb-10 leading-relaxed">
          {project.description}
        </p>
        
        <div>
          <Link 
            href={`/projects/${project.id}`} 
            className="group inline-flex items-center gap-3 text-[var(--accent)] font-semibold text-lg hover:opacity-80 transition-opacity"
          >
            Read Full Case Study 
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[var(--accent)]/10 group-hover:bg-[var(--accent)] group-hover:text-white transition-colors duration-300">
               <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
            </span>
          </Link>
        </div>
      </div>

      {/* RIGHT: GLASSMORPHISM IMAGE FRAME (Takes up 7 columns on desktop) */}
      <div 
        className="group/frame relative aspect-[4/3] md:aspect-auto md:h-[550px] w-full rounded-[2rem] overflow-hidden shadow-2xl ring-1 ring-black/5 dark:ring-white/10 bg-[var(--bg-tertiary)] order-1 md:order-2 md:col-span-7"
        onMouseEnter={() => setIsHovered(true)} 
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* The Image Stack (Cinematic Crossfades) */}
        {images.length > 0 ? (
          images.map((img, i) => (
            <Image 
              key={`${img}-${i}`} 
              src={img} 
              fill 
              priority={i === 0}
              // The Magic: Absolute positioning with a scale + opacity fade creates a soft 3D "breathing" effect
              className={`object-cover transition-all duration-1000 ease-in-out ${
                i === currentIdx 
                  ? 'opacity-100 scale-100 z-10' 
                  : 'opacity-0 scale-105 z-0'
              }`} 
              alt={`${project.title} screenshot ${i + 1}`} 
              unoptimized 
            />
          ))
        ) : (
          <div className="flex items-center justify-center h-full text-[var(--text-muted)] text-sm font-medium">
            No images available
          </div>
        )}

        {/* Shadow Gradient Overlay (Ensures UI elements are always visible) */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent z-20 pointer-events-none opacity-80 group-hover/frame:opacity-100 transition-opacity duration-500"></div>

        {images.length > 1 && (
          <>
            {/* MANUAL NAVIGATION CONTROLS */}
            <button 
              onClick={(e) => { e.preventDefault(); prevImage(); }}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-30 w-12 h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white opacity-0 group-hover/frame:opacity-100 hover:bg-white/30 hover:scale-105 active:scale-95 transition-all duration-300"
              aria-label="Previous image"
            >
              <ChevronLeft size={24} />
            </button>
            <button 
              onClick={(e) => { e.preventDefault(); nextImage(); }}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-30 w-12 h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white opacity-0 group-hover/frame:opacity-100 hover:bg-white/30 hover:scale-105 active:scale-95 transition-all duration-300"
              aria-label="Next image"
            >
              <ChevronRight size={24} />
            </button>

            {/* INSTAGRAM-STYLE "STORIES" INDICATORS */}
            <div className="absolute bottom-6 left-0 right-0 z-30 flex gap-2 px-8">
              {images.map((_, i) => (
                <div 
                  key={i} 
                  className="h-1.5 flex-1 rounded-full overflow-hidden bg-white/30 backdrop-blur-sm cursor-pointer"
                  onClick={() => setCurrentIdx(i)}
                >
                  <div 
                    className={`h-full bg-white rounded-full transition-all ease-linear ${
                      i === currentIdx 
                        ? 'w-full duration-[3500ms]' // Active bar fills up
                        : i < currentIdx 
                          ? 'w-full duration-0'       // Past bars are full
                          : 'w-0 duration-0'          // Future bars are empty
                    }`}
                    // If hovered, the transition pauses where it is
                    style={{
                      width: i === currentIdx ? (isHovered ? '100%' : '100%') : i < currentIdx ? '100%' : '0%',
                      transitionDuration: i === currentIdx && !isHovered ? '3500ms' : '0ms'
                    }}
                  />
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}