'use client';
import MotionDiv from '@/components/ui/MotionDiv';
import { db } from '@/lib/firebase';
import { collection, doc, getDoc, getDocs, limit, query, where } from 'firebase/firestore';
import { ArrowLeft, ExternalLink, Github } from 'lucide-react';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function ProjectDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [project, setProject] = useState(null);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      
      // 1. Fetch Project
      const snap = await getDoc(doc(db, 'projects', id));
      if (snap.exists()) {
        setProject({ id: snap.id, ...snap.data() });

        // 2. Fetch Related Gallery Images
        // FIX: Removed .orderBy('createdAt', 'desc') to prevent "Index Required" error.
        const q = query(
          collection(db, 'gallery'),
          where('relatedProjectId', '==', id),
          limit(10)
        );
        const imgSnap = await getDocs(q);
        setImages(imgSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      } else {
        console.log("No such project");
      }
      setLoading(false);
    };

    fetchData();
  }, [id]);

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!project) return <div className="min-h-screen flex items-center justify-center">Project not found.</div>;

  return (
    <main className="min-h-screen py-12">
      <div className="container mx-auto px-6">
        {/* Back Button */}
        <button onClick={() => router.back()} className="flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--accent)] mb-8 transition-colors">
          <ArrowLeft size={18} /> Back to Projects
        </button>

        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Left: Main Info */}
          <div>
            <h1 className="text-4xl font-bold text-[var(--text-primary)] mb-4">{project.title}</h1>
            <p className="text-lg text-[var(--text-secondary)] mb-6 leading-relaxed">
              {project.details || project.description}
            </p>

            {/* Tech Stack */}
            {project.tech && (
              <div className="mb-6">
                <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2">Technologies</h3>
                <div className="flex flex-wrap gap-2">
                  {project.tech.split(',').map((t, i) => (
                    <span key={i} className="px-3 py-1 bg-[var(--bg-secondary)] rounded-full text-xs font-medium text-[var(--text-primary)]">{t.trim()}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Links */}
            <div className="flex gap-4">
              {project.github && (
                <a href={project.github} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-4 py-2 border border-[var(--border)] rounded-lg hover:bg-[var(--bg-secondary)] transition-colors">
                  <Github size={18} /> Source Code
                </a>
              )}
              {project.live && (
                <a href={project.live} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-4 py-2 border border-[var(--border)] text-[var(--text-primary)] rounded-lg hover:opacity-90 transition-opacity">
                  <ExternalLink size={18} /> Live Demo
                </a>
              )}
            </div>
          </div>

          {/* Right: Cover Image */}
          {project.imageUrl && (
            <div className="relative w-full aspect-video rounded-xl overflow-hidden shadow-lg">
              <Image src={project.imageUrl} fill className="object-cover" alt={project.title} unoptimized />
            </div>
          )}
        </div>

        {/* Gallery Section */}
        {images.length > 0 && (
          <section className="mt-16">
            <h2 className="text-2xl font-bold mb-6 text-[var(--text-primary)]">Project Screenshots</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {images.map((img, i) => (
                <MotionDiv key={img.id} delay={i * 0.1}>
                  <div className="relative h-48 rounded-lg overflow-hidden group">
                    <Image 
                      src={img.imageUrl} 
                      alt={img.title || 'Screenshot'} 
                      fill 
                      className="object-cover group-hover:scale-105 transition-transform duration-300" 
                      unoptimized 
                    />
                  </div>
                </MotionDiv>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}