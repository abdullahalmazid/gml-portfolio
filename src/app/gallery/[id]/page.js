'use client';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function GalleryDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      if (!id) return;
      const snap = await getDoc(doc(db, 'gallery', id));
      if (snap.exists()) setItem({ id: snap.id, ...snap.data() });
      setLoading(false);
    };
    fetch();
  }, [id]);

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!item) return <div className="min-h-screen flex items-center justify-center">Image not found.</div>;

  return (
    <main className="min-h-screen py-12">
      <div className="container mx-auto px-6 max-w-5xl">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--accent)] mb-8 transition-colors">
          <ArrowLeft size={18} /> Back to Gallery
        </button>

        <div className="grid md:grid-cols-2 gap-8 items-start">
          {/* Image Side */}
          <div className="relative w-full aspect-square rounded-xl overflow-hidden shadow-lg bg-black flex items-center justify-center">
            <Image src={item.imageUrl} fill className="object-contain" alt={item.title} unoptimized />
          </div>

          {/* Content Side */}
          <div className="flex flex-col">
            <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-4">{item.title}</h1>
            <p className="text-[var(--text-secondary)] leading-relaxed mb-6">
              {item.description || 'No description available.'}
            </p>

            {item.relatedProjectId && (
              <Link 
                href={`/projects/${item.relatedProjectId}`} 
                className="mt-auto inline-flex items-center gap-2 px-4 py-3 bg-[var(--accent)] text-white rounded-lg font-semibold hover:opacity-90 transition-opacity"
              >
                View Related Project <ArrowRight size={18} />
              </Link>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}