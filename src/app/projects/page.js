'use client';
import DynamicSectionManager from '@/components/pages/DynamicSectionManager'; // IMPORT
import PageHero from '@/components/pages/PageHero';
import SectionRenderer from '@/components/pages/SectionRenderer'; // IMPORT
import MotionDiv from '@/components/ui/MotionDiv';
import { useAdmin } from '@/context/AdminContext';
import { deleteItem, useColl, useDoc } from '@/lib/firestore-helpers';
import { Pencil, Plus, Trash } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link'; // Ensure Link is imported

const FIELDS = [
  { key: 'title', label: 'Title' },
  { key: 'description', label: 'Description', type: 'textarea' },
  { key: 'tech', label: 'Tech (comma-separated)' },
  { key: 'github', label: 'GitHub URL' },
  { key: 'live', label: 'Live URL' },
  { key: 'details', label: 'Detailed Description', type: 'textarea' },
];

export default function ProjectsPage() {
  const { data } = useDoc('pages/projects');
  const { items, loading: il } = useColl('projects');
  const { editMode, setEditingItem } = useAdmin();

  const handleAdd = () => {
    setEditingItem({ collection: 'projects', id: null, data: {}, fields: FIELDS });
  };

  const handleEdit = (e, item) => {
    e.preventDefault(); // Prevent Link navigation
    e.stopPropagation(); // Stop event bubbling
    setEditingItem({ collection: 'projects', id: item.id, data: item, fields: FIELDS });
  };

  const handleDelete = (e, id) => {
    e.preventDefault(); // Prevent Link navigation
    e.stopPropagation(); // Stop event bubbling
    deleteItem('projects', id);
  };

  return (
    <main>
      <PageHero pageId="projects" data={{ heroTitle: data?.heroTitle || 'Projects', heroSubtitle: data?.heroSubtitle || 'Things I have built', heroImage: data?.heroImage }} />

      <section className="container mx-auto px-6 py-24">
        {editMode && (
          <button onClick={handleAdd} className="mb-8 px-4 py-2 bg-green-600 text-white rounded flex items-center gap-2">
            <Plus size={16} /> Add Project
          </button>
        )}
        <div className="mb-6">
          <p className="text-base md:text-lg text-[var(--text-text)] mt-1 flex items-center gap-1 font-medium">
            Click on Any Project to View Details.
          </p>
        </div>
        
        {il ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">{[1,2,3].map((i) => <div key={i} className="h-64 bg-gray-100 animate-pulse rounded-xl" />)}</div>
        ) : items.length === 0 ? (
          <p className="text-center text-[var(--text-muted)] py-16">No projects yet.</p>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {items.map((p, i) => (
              <MotionDiv key={p.id} delay={i * 0.1}>
                {/* 
                   CHANGE: Wrapped card in Link.
                   The card itself is now the link to the detail page.
                */}
                <Link 
                  href={`/projects/${p.id}`} 
                  className="block bg-[var(--card-bg)] border border-[var(--border)] rounded-xl overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 h-full flex flex-col group"
                >
                  {p.imageUrl && (
                    <div className="relative h-48 overflow-hidden">
                      <Image src={p.imageUrl} alt={p.title} fill className="object-cover" unoptimized />
                    </div>
                  )}
                  <div className="p-6 flex flex-col flex-1">
                    <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2">{p.title}</h3>
                    <p className="text-sm text-[var(--text-secondary)] leading-relaxed flex-1 line-clamp-3">{p.description}</p>
                    {p.tech && (
                      <div className="flex flex-wrap gap-1.5 mt-4">
                        {p.tech.split(',').map((t) => (
                          <span key={t} className="text-xs px-2 py-0.5 bg-[var(--bg-secondary)] text-[var(--text-muted)] rounded">{t.trim()}</span>
                        ))}
                      </div>
                    )}
                    
                    {/* Admin Controls */}
                    {editMode && (
                      <div className="flex gap-2 mt-4 pt-4 border-t border-[var(--border)]">
                        <button 
                          onClick={(e) => handleEdit(e, p)} 
                          className="flex items-center gap-1 text-[var(--accent)] text-sm hover:underline"
                        >
                          <Pencil size={14} /> Edit
                        </button>
                        <button 
                          onClick={(e) => handleDelete(e, p.id)} 
                          className="flex items-center gap-1 text-red-400 text-sm hover:underline"
                        >
                          <Trash size={14} /> Delete
                        </button>
                      </div>
                    )}
                  </div>
                </Link>
              </MotionDiv>
            ))}
          </div>
        )}
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