'use client';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { ArrowLeft, BookOpen, ExternalLink } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function PublicationDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      if (!id) return;
      const snap = await getDoc(doc(db, 'publications', id));
      if (snap.exists()) setItem({ id: snap.id, ...snap.data() });
      setLoading(false);
    };
    fetch();
  }, [id]);

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!item) return <div className="min-h-screen flex items-center justify-center">Publication not found.</div>;

  return (
    <main className="min-h-screen py-12">
      <div className="container mx-auto px-6 max-w-3xl">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--accent)] mb-8 transition-colors">
          <ArrowLeft size={18} /> Back to Publications
        </button>

        <article className="bg-[var(--card-bg)] border border-[var(--border)] rounded-xl p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <BookOpen className="text-[var(--accent)]" />
            <h1 className="text-3xl font-bold text-[var(--text-primary)]">{item.title}</h1>
          </div>

          <div className="flex items-center gap-4 text-sm text-[var(--text-secondary)] mb-6">
            <span className="font-medium text-[var(--accent)]">{item.journal}</span>
            <span>·</span>
            <span>{item.year}</span>
          </div>

          {item.authors && (
            <p className="text-xs text-[var(--text-muted)] mb-6">{item.authors}</p>
          )}

          <div className="prose max-w-none text-[var(--text-secondary)] leading-relaxed mb-6">
            <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2">Abstract</h3>
            <p>{item.abstract || 'No abstract available.'}</p>
          </div>

          {item.link && (
            <a href={item.link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--accent)] text-white rounded-lg font-medium hover:opacity-90 transition-opacity">
              View Publication <ExternalLink size={16} />
            </a>
          )}
        </article>
      </div>
    </main>
  );
}