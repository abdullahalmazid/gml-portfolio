'use client';
import MotionDiv from '@/components/ui/MotionDiv';
import { db } from '@/lib/firebase';
import { collection, doc, getDoc, getDocs, limit, query, where } from 'firebase/firestore';
import { ArrowLeft, ExternalLink, Github } from 'lucide-react';
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
      const snap = await getDoc(doc(db, 'projects', id));
      if (snap.exists()) {
        setProject({ id: snap.id, ...snap.data() });
        const q = query(
          collection(db, 'gallery'),
          where('relatedProjectId', '==', id),
          limit(10)
        );
        const imgSnap = await getDocs(q);
        setImages(imgSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      }
      setLoading(false);
    };
    fetchData();
  }, [id]);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-[var(--text-secondary)]">Loading...</div>;
  if (!project) return <div className="min-h-screen flex items-center justify-center text-[var(--text-secondary)]">Project not found.</div>;

  // First gallery image = cover, rest = screenshots
  const coverImage = images[0];
  const screenshots = images.slice(1);

  return (
    <main className="min-h-screen py-12">
      <div className="container mx-auto px-6 max-w-5xl">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors"
          >
            <ArrowLeft size={15} /> Projects
          </button>
          <span className="text-[var(--text-muted)]">/</span>
          <span className="text-[var(--text-primary)] font-medium truncate">{project.title}</span>
        </nav>

        <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-xl overflow-hidden shadow-sm">

          {/* Cover Image — from first linked gallery image */}
          {coverImage && (
            <div className="w-full aspect-[16/6] border-b border-[var(--border)] overflow-hidden">
              <img
                src={coverImage.imageUrl}
                alt={coverImage.title || project.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <div className="p-8 grid lg:grid-cols-[1fr_220px] gap-10 items-start">

            {/* Left: Main Info */}
            <div>
              {project.type && (
                <span className="inline-block text-xs font-medium px-2.5 py-1 rounded-full bg-[var(--accent)]/10 text-[var(--accent)] mb-3">
                  {project.type}
                </span>
              )}
              <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-3 leading-snug">{project.title}</h1>
              <p className="text-[var(--text-secondary)] leading-relaxed mb-6">
                {project.details || project.description}
              </p>

              {project.tech && (
                <div className="mb-6">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-2">Technologies</p>
                  <div className="flex flex-wrap gap-2">
                    {project.tech.split(',').map((t, i) => (
                      <span key={i} className="px-3 py-1 border border-[var(--border)] rounded-full text-xs text-[var(--text-secondary)] bg-[var(--bg-secondary)]">
                        {t.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                {project.github && (
                  <a href={project.github} target="_blank" rel="noreferrer"
                    className="flex items-center gap-2 px-4 py-2 border border-[var(--border)] rounded-lg text-sm text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors">
                    <Github size={15} /> Source code
                  </a>
                )}
                {project.live && (
                  <a href={project.live} target="_blank" rel="noreferrer"
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-[var(--text-primary)] text-[var(--bg-primary)] hover:opacity-90 transition-opacity">
                    <ExternalLink size={15} /> Live demo
                  </a>
                )}
              </div>
            </div>

            {/* Right: Meta Panel */}
            <div className="border border-[var(--border)] rounded-lg overflow-hidden text-sm divide-y divide-[var(--border)]">
              {[
                ['Status', project.status || 'Completed'],
                ['Year', project.year],
                ['Role', project.role],
                ['Type', project.type],
              ].filter(([, v]) => v).map(([label, value]) => (
                <div key={label} className="px-4 py-3 bg-[var(--card-bg)]">
                  <p className="text-[10px] uppercase tracking-widest text-[var(--text-muted)] mb-0.5">{label}</p>
                  <p className="font-medium text-[var(--text-primary)]">{value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Gallery Screenshots — everything after the first image */}
          {screenshots.length > 0 && (
            <div className="px-8 pb-8">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-3">Screenshots</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {screenshots.map((img, i) => (
                  <MotionDiv key={img.id} delay={i * 0.1}>
                    <div className="aspect-video rounded-lg overflow-hidden border border-[var(--border)] group cursor-pointer">
                      <img
                        src={img.imageUrl}
                        alt={img.title || 'Screenshot'}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  </MotionDiv>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}