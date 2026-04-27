'use client';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function PublicationDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      const snap = await getDoc(doc(db, 'publications', id));
      if (snap.exists()) setItem({ id: snap.id, ...snap.data() });
      setLoading(false);
    };
    fetchData();
  }, [id]);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-[var(--text-secondary)]">Loading...</div>;
  if (!item) return <div className="min-h-screen flex items-center justify-center text-[var(--text-secondary)]">Publication not found.</div>;

  return (
    <main className="min-h-screen py-12">
      <div className="container mx-auto px-6 max-w-5xl">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors"
          >
            <ArrowLeft size={15} /> Publications
          </button>
          <span className="text-[var(--text-muted)]">/</span>
          <span className="text-[var(--text-primary)] font-medium truncate">{item.title}</span>
        </nav>

        <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-xl overflow-hidden shadow-sm">
          <div className="p-8 grid lg:grid-cols-[1fr_220px] gap-10 items-start">

            {/* Left: Main Info */}
            <div>
              <span className="inline-block text-xs font-medium px-2.5 py-1 rounded-full bg-[var(--accent)]/10 text-[var(--accent)] mb-3">
                Journal Article
              </span>
              <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-3 leading-snug">{item.title}</h1>

              {item.authors && (
                <p className="text-xs text-[var(--text-muted)] mb-6">{item.authors}</p>
              )}

              <div className="mb-6">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-2">Abstract</p>
                <p className="text-[var(--text-secondary)] leading-relaxed">
                  {item.abstract || 'No abstract available.'}
                </p>
              </div>

              {item.link && (
                <a href={item.link} target="_blank" rel="noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-[var(--text-primary)] text-[var(--bg-primary)] hover:opacity-90 transition-opacity">
                  <ExternalLink size={15} /> View publication
                </a>
              )}
            </div>

            {/* Right: Meta Panel */}
            <div className="border border-[var(--border)] rounded-lg overflow-hidden text-sm divide-y divide-[var(--border)]">
              {[
                ['Journal', item.journal],
                ['Year', item.year],
                ['Volume', item.volume],
                ['Pages', item.pages],
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