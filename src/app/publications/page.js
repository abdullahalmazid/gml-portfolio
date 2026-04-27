'use client';
import DynamicSectionManager from '@/components/pages/DynamicSectionManager';
import PageHero from '@/components/pages/PageHero';
import SectionRenderer from '@/components/pages/SectionRenderer';
import MotionDiv from '@/components/ui/MotionDiv';
import { useAdmin } from '@/context/AdminContext';
import { deleteItem, useColl, useDoc } from '@/lib/firestore-helpers';
import { ExternalLink, Pencil, Plus, Trash } from 'lucide-react';
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

  return (
    <main>
      <PageHero pageId="publications" data={data} />

      <section className="container mx-auto px-6 py-24 max-w-3xl">
        {editMode && (
          <button
            onClick={() => setEditingItem({ collection: 'publications', id: null, data: {}, fields: FIELDS })}
            className="mb-8 px-4 py-2 bg-green-600 text-white rounded flex items-center gap-2 text-sm"
          >
            <Plus size={15} /> Add Publication
          </button>
        )}

        {items.length === 0 ? (
          <p className="text-center text-[var(--text-muted)] py-24">No publications yet.</p>
        ) : (
          <div className="divide-y divide-[var(--border)] border-t border-[var(--border)]">
            {items.map((item, i) => (
              <MotionDiv key={item.id} delay={i * 0.08}>
                <Link
                  href={`/publications/${item.id}`}
                  className="group relative flex items-start gap-0 py-5 transition-colors"
                >
                  {/* Year column */}
                  <span className="
                    w-14 shrink-0 pt-0.5
                    text-sm font-medium text-[var(--text-muted)]
                    transition-colors duration-150
                    group-hover:text-[var(--text-primary)]
                  ">
                    {item.year}
                  </span>

                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    {/* Title with underline draw effect */}
                    <h3 className="
                      text-[15px] font-semibold text-[var(--text-primary)] leading-snug mb-1
                      [text-decoration:none]
                      bg-gradient-to-r from-[var(--text-primary)] to-[var(--text-primary)]
                      bg-[length:0%_1px] bg-no-repeat bg-[position:0_100%]
                      transition-[background-size] duration-300 ease-out
                      group-hover:bg-[length:100%_1px]
                      inline
                    ">
                      {item.title}
                    </h3>

                    <p className="text-sm text-[var(--text-secondary)] mt-1 mb-1">
                      {item.journal}{item.year ? ` · ${item.year}` : ''}
                    </p>

                    {item.authors && (
                      <p className="text-xs text-[var(--text-muted)] mb-2">{item.authors}</p>
                    )}

                    {/* Abstract preview — expands on hover via max-height */}
                    {item.abstract && (
                      <p className="
                        text-xs text-[var(--text-muted)] leading-relaxed
                        overflow-hidden
                        max-h-0 group-hover:max-h-16
                        opacity-0 group-hover:opacity-100
                        transition-all duration-300 ease-out
                        line-clamp-2
                      ">
                        {item.abstract}
                      </p>
                    )}

                    {/* "View publication" hint */}
                    <span className="
                      inline-flex items-center gap-1
                      text-[11px] text-[var(--text-muted)] mt-2
                      opacity-0 group-hover:opacity-100
                      transition-opacity duration-200
                    ">
                      View publication <ExternalLink size={10} />
                    </span>
                  </div>

                  {/* Edit controls */}
                  {editMode && (
                    <div className="flex gap-1.5 ml-3 z-10 shrink-0">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          setEditingItem({ collection: 'publications', id: item.id, data: item, fields: FIELDS });
                        }}
                        className="p-1.5 bg-white rounded shadow hover:bg-gray-50"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          deleteItem('publications', item.id);
                        }}
                        className="p-1.5 bg-white rounded shadow hover:bg-red-50 text-red-600"
                      >
                        <Trash size={13} />
                      </button>
                    </div>
                  )}
                </Link>
              </MotionDiv>
            ))}
          </div>
        )}
      </section>

      <SectionRenderer pageId="publications" />
      <div className="container mx-auto px-6 pb-10">
        <DynamicSectionManager pageId="publications" />
      </div>
    </main>
  );
}