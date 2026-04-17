'use client';
import DynamicSectionManager from '@/components/pages/DynamicSectionManager'; // IMPORT
import PageHero from '@/components/pages/PageHero';
import SectionRenderer from '@/components/pages/SectionRenderer'; // IMPORT
import MotionDiv from '@/components/ui/MotionDiv';
import { useAdmin } from '@/context/AdminContext';
import { deleteItem, useColl, useDoc } from '@/lib/firestore-helpers';
import { Briefcase, Calendar, Pencil, Plus, Trash } from 'lucide-react';
import Link from 'next/link';

const FIELDS = [
  { key: 'role', label: 'Role' },
  { key: 'company', label: 'Company' },
  { key: 'duration', label: 'Duration' },
  { key: 'description', label: 'Description', type: 'textarea' },
];

export default function ExperiencePage() {
  const { data } = useDoc('pages/experience');
  const { items } = useColl('experience');
  const { editMode, setEditingItem } = useAdmin();

  const handleAdd = () => {
    setEditingItem({ collection: 'experience', id: null, data: {}, fields: FIELDS });
  };

  return (
    <main>
      <PageHero pageId="experience" data={data} />
      <section className="container mx-auto px-6 py-24 max-w-4xl">
        {editMode && (
          <button onClick={handleAdd} className="mb-8 px-4 py-2 bg-green-600 text-white rounded flex items-center gap-2">
            <Plus size={16} /> Add Experience
          </button>
        )}
        <div className="mb-6">
          <p className="text-base md:text-lg text-[var(--text-text)] mt-1 flex items-center gap-1 font-medium">
            Click on Any Experience to View Details.
          </p>
        </div>
        
        <div className="relative">
          <div className="absolute left-6 top-0 bottom-0 w-px bg-[var(--border)]" />
          <div className="space-y-10">
            {items.map((item, i) => (
              <MotionDiv key={item.id} delay={i * 0.1}>
                {/* Link wraps the card */}
                <Link href={`/experience/${item.id}`} className="block relative pl-16 group">
                  <div className="absolute left-4 top-1 w-5 h-5 rounded-full bg-[var(--accent)] border-4 border-[var(--bg-primary)] shadow" />
                  <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-bold text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors">{item.role}</h3>
                        <p className="text-[var(--accent)] font-medium flex items-center gap-2 mt-1">
                          <Briefcase size={14}/> {item.company}
                        </p>
                        {item.duration && (
                          <p className="text-xs text-[var(--text-muted)] mt-1 flex items-center gap-1">
                            <Calendar size={12}/> {item.duration}
                          </p>
                        )}
                      </div>
                      {editMode && (
                        <div className="flex gap-2 z-10">
                          <button onClick={(e) => { e.preventDefault(); setEditingItem({ collection: 'experience', id: item.id, data: item, fields: FIELDS }); }} className="p-2 bg-white rounded shadow hover:bg-gray-100"><Pencil size={14} /></button>
                          <button onClick={(e) => { e.preventDefault(); deleteItem('experience', item.id); }} className="p-2 bg-white rounded shadow hover:bg-red-50 text-red-600"><Trash size={14} /></button>
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              </MotionDiv>
            ))}
          </div>
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