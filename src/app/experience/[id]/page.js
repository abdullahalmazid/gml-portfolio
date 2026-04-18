'use client';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { ArrowLeft, Briefcase, Calendar } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function ExperienceDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      if (!id) return;
      const snap = await getDoc(doc(db, 'experience', id));
      if (snap.exists()) setItem({ id: snap.id, ...snap.data() });
      setLoading(false);
    };
    fetch();
  }, [id]);

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!item) return <div className="min-h-screen flex items-center justify-center">Experience not found.</div>;

  return (
    <main className="min-h-screen py-12">
      <div className="container mx-auto px-6 max-w-3xl">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--accent)] mb-8 transition-colors">
          <ArrowLeft size={18} /> Back to Experience
        </button>

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

          <div className="prose max-w-none text-[var(--text-secondary)] leading-relaxed">
            {item.description ? <p>{item.description}</p> : <p>No details provided.</p>}
          </div>
        </div>
      </div>
    </main>
  );
}
