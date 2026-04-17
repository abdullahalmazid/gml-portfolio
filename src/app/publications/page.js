'use client';
import DynamicSectionManager from '@/components/pages/DynamicSectionManager'; // IMPORT
import PageHero from '@/components/pages/PageHero';
import SectionRenderer from '@/components/pages/SectionRenderer'; // IMPORT
import MotionDiv from '@/components/ui/MotionDiv';
import { useAdmin } from '@/context/AdminContext';
import { deleteItem, useColl, useDoc } from '@/lib/firestore-helpers';
import { BookOpen, Pencil, Plus, Trash } from 'lucide-react';
import Link from 'next/link';

const FIELDS = [
  { key: 'title', label: 'Title' },
  { key: 'journal', label: 'Journal/Conference' },
  { key: 'year', label: 'Year' },
  { key: 'authors', label: 'Authors' },
  { key: 'abstract', label: 'Abstract', type: 'textarea' },
  { key: 'link', label: 'Link/DOI' },
];

export default function PublicationsPage() {
  const { data } = useDoc('pages/publications');
  const { items } = useColl('publications');
  const { editMode, setEditingItem } = useAdmin();

  const handleAdd = () => {
    setEditingItem({ collection: 'publications', id: null, data: {}, fields: FIELDS });
  };

  return (
    <main>
      <PageHero pageId="publications" data={data} />
      <section className="container mx-auto px-6 py-24 max-w-4xl">
        {editMode && (
          <button onClick={handleAdd} className="mb-8 px-4 py-2 bg-green-600 text-white rounded flex items-center gap-2">
            <Plus size={16} /> Add Publication
          </button>
        )}
        <div className="mb-6">
          <p className="text-base md:text-lg text-[var(--text-text)] mt-1 flex items-center gap-1 font-medium">
            Click on Any Publication to View Details.
          </p>
        </div>
        <div className="space-y-6">
          {items.length === 0 ? (
            <p className="text-center text-[var(--text-muted)] py-16">No publications yet.</p>
          ) : (
            items.map((item, i) => (
              <MotionDiv key={item.id} delay={i * 0.1}>
                {/* Link wraps the card */}
                <Link href={`/publications/${item.id}`} className="block bg-[var(--card-bg)] border border-[var(--border)] rounded-xl p-6 relative group hover:shadow-md transition-shadow">
                  {editMode && (
                    <div className="absolute top-2 right-2 flex gap-2 z-10">
                      <button onClick={(e) => { e.preventDefault(); setEditingItem({ collection: 'publications', id: item.id, data: item, fields: FIELDS }); }} className="p-2 bg-white rounded shadow"><Pencil size={14} /></button>
                      <button onClick={(e) => { e.preventDefault(); deleteItem('publications', item.id); }} className="p-2 bg-white rounded shadow text-red-600"><Trash size={14} /></button>
                    </div>
                  )}
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-[var(--accent-light)] rounded-lg flex items-center justify-center text-[var(--accent)]">
                       <BookOpen size={20} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors">{item.title}</h3>
                      <p className="text-sm text-[var(--accent)] mt-1">{item.journal} · {item.year}</p>
                      {item.authors && <p className="text-xs text-[var(--text-muted)] mt-1">{item.authors}</p>}
                    </div>
                  </div>
                </Link>
              </MotionDiv>
            ))
          )}
        </div>
      </section>
      {/* ADD THIS: Dynamic Sections */}
      <SectionRenderer pageId="experience" />

      {/* ADD THIS: Admin Manager */}
      <div className="container mx-auto px-6 pb-10">
        <DynamicSectionManager pageId="experience" />
      </div>
    </main>
  );
}