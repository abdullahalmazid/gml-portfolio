'use client';
import DynamicSectionManager from '@/components/pages/DynamicSectionManager';
import PageHero from '@/components/pages/PageHero';
import SectionRenderer from '@/components/sections/SectionRenderer';
import MotionDiv from '@/components/ui/MotionDiv';
import { useAdmin } from '@/context/AdminContext';
import { deleteItem, useColl, useDoc } from '@/lib/firestore-helpers';
import { ArrowRight, Pencil, Plus, Trash } from 'lucide-react';
import Link from 'next/link';

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
  const { items: galleryItems } = useColl('gallery'); // fetch all gallery images
  const { editMode, setEditingItem } = useAdmin();

  // Build a map: projectId → first matching gallery image URL
  const projectThumbnails = {};
  galleryItems.forEach(img => {
    if (img.relatedProjectId && !projectThumbnails[img.relatedProjectId]) {
      projectThumbnails[img.relatedProjectId] = img.imageUrl;
    }
  });

  return (
    <main>
      <PageHero
        pageId="projects"
        data={{
          heroTitle: data?.heroTitle || 'Projects',
          heroSubtitle: data?.heroSubtitle || 'Things I have built',
          heroImage: data?.heroImage,
        }}
      />

      <section className="container mx-auto px-6 py-24">
        {editMode && (
          <button
            onClick={() => setEditingItem({ collection: 'projects', id: null, data: {}, fields: FIELDS })}
            className="mb-8 px-4 py-2 bg-green-600 text-white rounded flex items-center gap-2 text-sm"
          >
            <Plus size={15} /> Add Project
          </button>
        )}

        {il ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-64 bg-[var(--bg-secondary)] animate-pulse rounded-xl" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <p className="text-center text-[var(--text-muted)] py-24">No projects yet.</p>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((project, i) => {
              const thumbnail = projectThumbnails[project.id];
              return (
                <MotionDiv key={project.id} delay={i * 0.08}>
                  <Link
                    href={`/projects/${project.id}`}
                    className="group flex flex-col h-full bg-[var(--card-bg)] border border-[var(--border)] rounded-xl overflow-hidden transition-all duration-300 hover:border-[var(--text-primary)]/25 hover:-translate-y-1"
                  >
                    {/* Image area */}
                    <div className="relative h-44 overflow-hidden bg-[var(--bg-secondary)] shrink-0">
                      {thumbnail ? (
                        <>
                          <img
                            src={thumbnail}
                            alt={project.title}
                            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />

                          {/* Dark scrim on hover */}
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-colors duration-300" />

                          {/* Arrow badge */}
                          <div className="
                            absolute top-2.5 right-2.5
                            w-7 h-7 rounded-full bg-white/90
                            flex items-center justify-center
                            opacity-0 scale-75
                            group-hover:opacity-100 group-hover:scale-100
                            transition-all duration-200
                          ">
                            <ArrowRight size={13} className="text-black" />
                          </div>

                          {/* Tech tags — slide up on hover */}
                          {project.tech && (
                            <div className="
                              absolute bottom-0 left-0 right-0
                              flex flex-wrap gap-1.5 p-2.5
                              translate-y-full group-hover:translate-y-0
                              transition-transform duration-250 ease-out
                            ">
                              {project.tech.split(',').map(t => (
                                <span
                                  key={t}
                                  className="text-[11px] px-2 py-0.5 rounded-full bg-black/70 text-white"
                                >
                                  {t.trim()}
                                </span>
                              ))}
                            </div>
                          )}
                        </>
                      ) : (
                        /* Fallback placeholder when no linked gallery image */
                        <div className="w-full h-full flex items-center justify-center text-[var(--text-muted)]">
                          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                            <rect x="4" y="4" width="24" height="24" rx="4" fill="currentColor" fillOpacity="0.1"/>
                            <rect x="8" y="8" width="16" height="3" rx="1.5" fill="currentColor" fillOpacity="0.2"/>
                            <rect x="8" y="14" width="10" height="2" rx="1" fill="currentColor" fillOpacity="0.15"/>
                            <rect x="8" y="19" width="13" height="2" rx="1" fill="currentColor" fillOpacity="0.15"/>
                          </svg>
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex flex-col flex-1 p-5">
                      <h3 className="text-[15px] font-semibold text-[var(--text-primary)] mb-1.5 leading-snug">
                        {project.title}
                      </h3>
                      <p className="text-sm text-[var(--text-secondary)] leading-relaxed flex-1 line-clamp-3">
                        {project.description}
                      </p>

                      {editMode && (
                        <div className="flex gap-3 mt-4 pt-4 border-t border-[var(--border)]">
                          <button
                            onClick={e => {
                              e.preventDefault();
                              e.stopPropagation();
                              setEditingItem({ collection: 'projects', id: project.id, data: project, fields: FIELDS });
                            }}
                            className="flex items-center gap-1 text-[var(--accent)] text-xs hover:underline"
                          >
                            <Pencil size={12} /> Edit
                          </button>
                          <button
                            onClick={e => {
                              e.preventDefault();
                              e.stopPropagation();
                              deleteItem('projects', project.id);
                            }}
                            className="flex items-center gap-1 text-red-400 text-xs hover:underline"
                          >
                            <Trash size={12} /> Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </Link>
                </MotionDiv>
              );
            })}
          </div>
        )}
      </section>

      <SectionRenderer pageId="projects" />
      <div className="container mx-auto px-6 pb-10">
        <DynamicSectionManager pageId="projects" />
      </div>
    </main>
  );
}