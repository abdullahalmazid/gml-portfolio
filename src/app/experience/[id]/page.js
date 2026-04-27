'use client';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { ArrowLeft } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function ExperienceDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      const snap = await getDoc(doc(db, 'experience', id));
      if (snap.exists()) setItem({ id: snap.id, ...snap.data() });
      setLoading(false);
    };
    fetchData();
  }, [id]);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-[var(--text-secondary)]">Loading...</div>;
  if (!item) return <div className="min-h-screen flex items-center justify-center text-[var(--text-secondary)]">Experience not found.</div>;

  return (
    <main className="min-h-screen py-12">
      <div className="container mx-auto px-6 max-w-5xl">

<<<<<<< HEAD
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors"
          >
            <ArrowLeft size={15} /> Experience
          </button>
          <span className="text-[var(--text-muted)]">/</span>
          <span className="text-[var(--text-primary)] font-medium truncate">{item.role}</span>
        </nav>
=======
        <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-xl p-8 shadow-sm px-20">
          <div className="flex items-center gap-3 mb-2">
            <Briefcase className="text-[var(--accent)]" />
            <h1 className="text-3xl font-bold text-[var(--text-primary)]">{item.role}</h1>
          </div>
          
          <div className="flex items-center gap-4 text-sm text-[var(--text-secondary)] mb-6">
            <span className="font-medium text-[var(--text-primary)]">{item.company}</span>
            {item.duration && (
              <span className="flex items-center gap-1">
                <Calendar size={14} /> {item.duration}
              </span>
            )}
          </div>
>>>>>>> 25904b6ced89ab7c8dfbfa5d76497ab51e70b073

        <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-xl overflow-hidden shadow-sm">
          <div className="p-8 grid lg:grid-cols-[1fr_220px] gap-10 items-start">

            {/* Left: Main Info */}
            <div>
              {item.type && (
                <span className="inline-block text-xs font-medium px-2.5 py-1 rounded-full bg-[var(--accent)]/10 text-[var(--accent)] mb-3">
                  {item.type}
                </span>
              )}
              <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-1 leading-snug">{item.role}</h1>
              <p className="text-base font-medium text-[var(--text-secondary)] mb-6">{item.company}</p>

              <div className="mb-6">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-2">Responsibilities</p>
                <p className="text-[var(--text-secondary)] leading-relaxed">
                  {item.description || 'No details provided.'}
                </p>
              </div>
            </div>

            {/* Right: Meta Panel */}
            <div className="border border-[var(--border)] rounded-lg overflow-hidden text-sm divide-y divide-[var(--border)]">
              {[
                ['Company', item.company],
                ['Duration', item.duration],
                ['Location', item.location],
                ['Type', item.type],
              ].filter(([, v]) => v).map(([label, value]) => (
                <div key={label} className="px-4 py-3 bg-[var(--card-bg)]">
                  <p className="text-[10px] uppercase tracking-widest text-[var(--text-muted)] mb-0.5">{label}</p>
                  <p className="font-medium text-[var(--text-primary)]">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
