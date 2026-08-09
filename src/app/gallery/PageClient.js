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

  return (
    <main>
      <PageHero pageId="gallery" data={data} />

      <section className="container mx-auto px-6 py-24">
        {editMode && (
          <button
            onClick={() => setEditingItem({ collection: 'gallery', id: null, data: {}, fields: FIELDS })}
            className="mb-8 px-4 py-2 bg-green-600 text-white rounded flex items-center gap-2 text-sm"
          >
            <Plus size={15} /> Add Photo
          </button>
        )}

        {items.length === 0 ? (
          <p className="text-center text-[var(--text-muted)] py-24">No photos yet.</p>
        ) : (
          <div className="columns-2 md:columns-3 lg:columns-4 gap-3 space-y-3">
            {items.map((img, i) => (
              <MotionDiv key={img.id} delay={i * 0.04}>
                <Link
                  href={`/gallery/${img.id}`}
                  className="relative block overflow-hidden rounded-xl break-inside-avoid group cursor-pointer"
                >
                  {/* Edit controls */}
                  {editMode && (
                    <div className="absolute top-2 right-2 z-20 flex gap-1.5">
                      <button
                        onClick={e => { e.preventDefault(); e.stopPropagation(); setEditingItem({ collection: 'gallery', id: img.id, data: img, fields: FIELDS }); }}
                        className="p-1.5 bg-white rounded shadow"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={e => { e.preventDefault(); e.stopPropagation(); deleteItem('gallery', img.id); }}
                        className="p-1.5 bg-white rounded shadow text-red-600"
                      >
                        <Trash size={13} />
                      </button>
                    </div>
                  )}

                  {/* Image */}
                  <Image
                    src={img.imageUrl}
                    alt={img.title}
                    width={600}
                    height={400}
                    className="w-full object-cover block transition-transform duration-500 group-hover:scale-[1.04]"
                    unoptimized
                  />

                  {/* Hover overlay */}
                  <div className="
                    absolute inset-0
                    bg-black/0 group-hover:bg-black/50
                    transition-colors duration-300
                  " />

                  {/* Title + zoom hint */}
                  <div className="
                    absolute inset-x-0 bottom-0 p-3
                    translate-y-2 opacity-0
                    group-hover:translate-y-0 group-hover:opacity-100
                    transition-all duration-250
                  ">
                    <p className="text-white text-sm font-medium leading-snug">{img.title}</p>
                  </div>

                  {/* Zoom hint badge */}
                  <div className="
                    absolute top-2.5 right-2.5
                    w-6 h-6 rounded-full bg-white/90
                    flex items-center justify-center
                    opacity-0 scale-75
                    group-hover:opacity-100 group-hover:scale-100
                    transition-all duration-200
                  ">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <circle cx="5" cy="5" r="3.5" stroke="black" strokeWidth="1.2"/>
                      <path d="M8 8l2.5 2.5" stroke="black" strokeWidth="1.2" strokeLinecap="round"/>
                      <path d="M3.5 5h3M5 3.5v3" stroke="black" strokeWidth="1" strokeLinecap="round"/>
                    </svg>
                  </div>
                </Link>
              </MotionDiv>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}