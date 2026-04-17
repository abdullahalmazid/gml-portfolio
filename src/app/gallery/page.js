'use client';
import PageHero from '@/components/pages/PageHero';
import MotionDiv from '@/components/ui/MotionDiv';
import { useAdmin } from '@/context/AdminContext';
import { deleteItem, useColl, useDoc } from '@/lib/firestore-helpers';
import { Pencil, Plus, Trash } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

const FIELDS = [
  { key: 'title', label: 'Title' },
  { key: 'description', label: 'Description', type: 'textarea' },
  { key: 'imageUrl', label: 'Image', type: 'image' },
  { key: 'relatedProjectId', label: 'Link to Project', type: 'project-select' },
];

export default function GalleryPage() {
  const { data } = useDoc('pages/gallery');
  const { items } = useColl('gallery');
  const { editMode, setEditingItem } = useAdmin();

  const handleAdd = () => {
    setEditingItem({ collection: 'gallery', id: null, data: {}, fields: FIELDS });
  };

  const handleEdit = (e, item) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingItem({ collection: 'gallery', id: item.id, data: item, fields: FIELDS });
  };

  return (
    <main>
      <PageHero pageId="gallery" data={data} />
      <section className="container mx-auto px-6 py-24">
        {editMode && (
          <button onClick={handleAdd} className="mb-8 px-4 py-2 bg-green-600 text-white rounded flex items-center gap-2">
            <Plus size={16} /> Add Photo
          </button>
        )}
        <div className="mb-6">
          <p className="text-base md:text-lg text-[var(--text-text)] mt-1 flex items-center gap-1 font-medium">
            Click on Any Photo to View Details.
          </p>
        </div>
        <div className="columns-2 md:columns-3 gap-4 space-y-4">
          {items.map((img, i) => (
            <MotionDiv key={img.id} delay={i * 0.05}>
              {/* Link wraps the card */}
              <Link 
                href={`/gallery/${img.id}`} 
                className="relative group overflow-hidden rounded-xl mb-4 break-inside-avoid block cursor-pointer"
              >
                {editMode && (
                  <div className="absolute top-2 right-2 z-20 flex gap-2">
                    <button onClick={(e) => handleEdit(e, img)} className="p-2 bg-white rounded shadow"><Pencil size={14} /></button>
                    <button onClick={(e) => { e.preventDefault(); deleteItem('gallery', img.id); }} className="p-2 bg-white rounded shadow text-red-600"><Trash size={14} /></button>
                  </div>
                )}
                <Image src={img.imageUrl} alt={img.title} width={600} height={400} className="w-full object-cover group-hover:scale-105 transition-transform duration-500" unoptimized />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                   <h3 className="text-white font-bold">{img.title}</h3>
                </div>
              </Link>
            </MotionDiv>
          ))}
        </div>
      </section>
    </main>
  );
}