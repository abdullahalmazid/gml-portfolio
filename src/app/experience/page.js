'use client';
import DynamicSectionManager from '@/components/pages/DynamicSectionManager';
import PageHero from '@/components/pages/PageHero';
import SectionRenderer from '@/components/sections/SectionRenderer';
import MotionDiv from '@/components/ui/MotionDiv';
import { useAdmin } from '@/context/AdminContext';
import { deleteItem, useColl, useDoc } from '@/lib/firestore-helpers';
import { ArrowRight, Briefcase, Calendar, Pencil, Plus, Trash } from 'lucide-react';
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

  return (
    <main>
      <PageHero pageId="experience" data={data} />

      <section className="container mx-auto px-6 py-24 max-w-3xl">
        {editMode && (
          <button
            onClick={() => setEditingItem({ collection: 'experience', id: null, data: {}, fields: FIELDS })}
            className="mb-8 px-4 py-2 bg-green-600 text-white rounded flex items-center gap-2 text-sm"
          >
            <Plus size={15} /> Add Experience
          </button>
        )}

        <div className="relative">
          {/* Timeline rail */}
          <div className="absolute left-[18px] top-0 bottom-0 w-px bg-[var(--border)]" />

          <div className="flex flex-col gap-3">
            {items.map((item, i) => (
              <MotionDiv key={item.id} delay={i * 0.08}>
                <Link
                  href={`/experience/${item.id}`}
                  className="block relative pl-12 group"
                >
                  {/* Timeline dot */}
                  <div className="
                    absolute left-[14px] top-[18px]
                    w-[10px] h-[10px] rounded-full
                    bg-[var(--border)] border-2 border-[var(--bg-primary)]
                    transition-all duration-200
                    group-hover:bg-[var(--text-primary)] group-hover:scale-125
                  " />

                  {/* Card */}
                  <div className="
                    relative overflow-hidden
                    bg-[var(--card-bg)] border border-[var(--border)] rounded-xl p-5
                    transition-all duration-200
                    group-hover:border-[var(--text-primary)]/30
                    group-hover:translate-x-1
                    before:absolute before:left-0 before:top-0 before:bottom-0 before:w-[2px]
                    before:bg-[var(--text-primary)]
                    before:scale-y-0 before:origin-top
                    before:transition-transform before:duration-200
                    group-hover:before:scale-y-100
                  ">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <h3 className="text-[15px] font-semibold text-[var(--text-primary)] mb-1 leading-snug">
                          {item.role}
                        </h3>
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-sm text-[var(--text-secondary)] font-medium flex items-center gap-1.5">
                            <Briefcase size={12} className="shrink-0" /> {item.company}
                          </span>
                          {item.duration && (
                            <>
                              <span className="text-[var(--text-muted)] text-xs">·</span>
                              <span className="text-xs text-[var(--text-muted)] flex items-center gap-1">
                                <Calendar size={11} /> {item.duration}
                              </span>
                            </>
                          )}
                        </div>
                        {item.description && (
                          <p className="text-sm text-[var(--text-secondary)] leading-relaxed line-clamp-2">
                            {item.description}
                          </p>
                        )}
                      </div>

                      {/* View arrow — fades in on hover */}
                      <div className="
                        flex items-center gap-1 text-xs text-[var(--text-muted)] shrink-0
                        opacity-0 -translate-x-2 transition-all duration-200
                        group-hover:opacity-100 group-hover:translate-x-0
                      ">
                        View <ArrowRight size={12} />
                      </div>
                    </div>
                  </div>

                  {/* Edit controls — only in edit mode */}
                  {editMode && (
                    <div className="absolute top-2 right-2 flex gap-1.5 z-10">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          setEditingItem({ collection: 'experience', id: item.id, data: item, fields: FIELDS });
                        }}
                        className="p-1.5 bg-white rounded shadow hover:bg-gray-50"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          deleteItem('experience', item.id);
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
        </div>
      </section>

      <SectionRenderer pageId="experience" />
      <div className="container mx-auto px-6 pb-10">
        <DynamicSectionManager pageId="experience" />
      </div>
    </main>
  );
}