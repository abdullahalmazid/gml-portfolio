'use client';
import DynamicSectionManager from '@/components/pages/DynamicSectionManager';
import PageHero from '@/components/pages/PageHero';
import SectionRenderer from '@/components/sections/SectionRenderer';
import MotionDiv from '@/components/ui/MotionDiv';
import { useAdmin } from '@/context/AdminContext';
import { deleteItem, useColl, useDoc } from '@/lib/firestore-helpers';
import { ArrowRight, Calendar, Clock, Pencil, Plus, Trash } from 'lucide-react';
import Link from 'next/link';

const FIELDS = [
  { key: 'title', label: 'Title' },
  { key: 'excerpt', label: 'Excerpt', type: 'textarea' },
  { key: 'content', label: 'Content (markdown)', type: 'textarea' },
  { key: 'coverImage', label: 'Cover Image URL' },
  { key: 'category', label: 'Category' },
  { key: 'tags', label: 'Tags (comma-separated)' },
  { key: 'author', label: 'Author Name' },
  { key: 'authorAvatar', label: 'Author Avatar URL' },
  { key: 'readTime', label: 'Read Time (e.g. 5 min read)' },
  { key: 'date', label: 'Date (e.g. Jan 12, 2025)' },
];

export default function BlogPage() {
  const { data } = useDoc('pages/blog');
  const { items, loading } = useColl('blogs');
  const { editMode, setEditingItem } = useAdmin();

  // Separate featured (first) from the rest
  const featured = items[0];
  const rest = items.slice(1);

  return (
    <main>
      <PageHero pageId="blog" data={data} />

      <section className="container mx-auto px-6 py-24 max-w-5xl">
        {editMode && (
          <button
            onClick={() => setEditingItem({ collection: 'blogs', id: null, data: {}, fields: FIELDS })}
            className="mb-8 px-4 py-2 bg-green-600 text-white rounded flex items-center gap-2 text-sm"
          >
            <Plus size={15} /> Add Post
          </button>
        )}

        {loading ? (
          <div className="space-y-6">
            <div className="h-72 bg-[var(--bg-secondary)] animate-pulse rounded-xl" />
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => <div key={i} className="h-56 bg-[var(--bg-secondary)] animate-pulse rounded-xl" />)}
            </div>
          </div>
        ) : items.length === 0 ? (
          <p className="text-center text-[var(--text-muted)] py-24">No posts yet.</p>
        ) : (
          <>
            {/* Featured post — large card */}
            {featured && (
              <MotionDiv delay={0}>
                <Link
                  href={`/blog/${featured.id}`}
                  className="group block mb-10 bg-[var(--card-bg)] border border-[var(--border)] rounded-xl overflow-hidden hover:border-[var(--text-primary)]/25 hover:-translate-y-0.5 transition-all duration-300"
                >
                  <div className="grid md:grid-cols-[1fr_380px]">
                    {/* Image */}
                    <div className="relative h-64 md:h-auto overflow-hidden bg-[var(--bg-secondary)]">
                      {featured.coverImage ? (
                        <>
                          <img
                            src={featured.coverImage}
                            alt={featured.title}
                            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
                        </>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[var(--text-muted)]">
                          <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                            <rect x="4" y="8" width="32" height="24" rx="4" fill="currentColor" fillOpacity="0.1"/>
                            <circle cx="14" cy="16" r="3" fill="currentColor" fillOpacity="0.2"/>
                            <path d="M4 26l8-6 6 5 5-4 13 9" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                      )}
                      {featured.category && (
                        <span className="absolute top-3 left-3 text-[11px] font-medium px-2.5 py-1 rounded-full bg-[var(--accent)] text-white">
                          {featured.category}
                        </span>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex flex-col p-7">
                      <div className="flex items-center gap-3 text-xs text-[var(--text-muted)] mb-3">
                        {featured.date && <span className="flex items-center gap-1"><Calendar size={11} /> {featured.date}</span>}
                        {featured.readTime && <span className="flex items-center gap-1"><Clock size={11} /> {featured.readTime}</span>}
                      </div>
                      <h2 className="text-xl font-bold text-[var(--text-primary)] leading-snug mb-3 group-hover:text-[var(--accent)] transition-colors">
                        {featured.title}
                      </h2>
                      <p className="text-sm text-[var(--text-secondary)] leading-relaxed flex-1 line-clamp-3 mb-5">
                        {featured.excerpt}
                      </p>
                      {featured.tags && (
                        <div className="flex flex-wrap gap-1.5 mb-5">
                          {featured.tags.split(',').slice(0, 3).map(tag => (
                            <span key={tag} className="text-[11px] px-2 py-0.5 rounded-full border border-[var(--border)] text-[var(--text-muted)]">
                              {tag.trim()}
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="flex items-center justify-between mt-auto">
                        {featured.author && (
                          <div className="flex items-center gap-2">
                            {featured.authorAvatar ? (
                              <img src={featured.authorAvatar} alt={featured.author} className="w-7 h-7 rounded-full object-cover" />
                            ) : (
                              <div className="w-7 h-7 rounded-full bg-[var(--bg-secondary)] border border-[var(--border)] flex items-center justify-center text-[10px] font-bold text-[var(--text-muted)]">
                                {featured.author[0]}
                              </div>
                            )}
                            <span className="text-xs text-[var(--text-secondary)]">{featured.author}</span>
                          </div>
                        )}
                        <span className="flex items-center gap-1 text-xs font-medium text-[var(--accent)] opacity-0 group-hover:opacity-100 transition-opacity">
                          Read more <ArrowRight size={12} />
                        </span>
                      </div>

                      {editMode && (
                        <div className="flex gap-3 mt-4 pt-4 border-t border-[var(--border)]">
                          <button onClick={e => { e.preventDefault(); e.stopPropagation(); setEditingItem({ collection: 'blogs', id: featured.id, data: featured, fields: FIELDS }); }} className="flex items-center gap-1 text-[var(--accent)] text-xs hover:underline"><Pencil size={12} /> Edit</button>
                          <button onClick={e => { e.preventDefault(); e.stopPropagation(); deleteItem('blogs', featured.id); }} className="flex items-center gap-1 text-red-400 text-xs hover:underline"><Trash size={12} /> Delete</button>
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              </MotionDiv>
            )}

            {/* Rest of posts — 3-col grid */}
            {rest.length > 0 && (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {rest.map((post, i) => (
                  <MotionDiv key={post.id} delay={i * 0.08}>
                    <Link
                      href={`/blog/${post.id}`}
                      className="group flex flex-col h-full bg-[var(--card-bg)] border border-[var(--border)] rounded-xl overflow-hidden hover:border-[var(--text-primary)]/25 hover:-translate-y-1 transition-all duration-300"
                    >
                      {/* Cover */}
                      <div className="relative h-40 overflow-hidden bg-[var(--bg-secondary)] shrink-0">
                        {post.coverImage ? (
                          <>
                            <img src={post.coverImage} alt={post.title} className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]" />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-colors duration-300" />
                          </>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[var(--text-muted)]">
                            <svg width="32" height="32" viewBox="0 0 40 40" fill="none">
                              <rect x="4" y="8" width="32" height="24" rx="4" fill="currentColor" fillOpacity="0.1"/>
                              <circle cx="14" cy="16" r="3" fill="currentColor" fillOpacity="0.2"/>
                              <path d="M4 26l8-6 6 5 5-4 13 9" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </div>
                        )}
                        {post.category && (
                          <span className="absolute top-2.5 left-2.5 text-[11px] font-medium px-2 py-0.5 rounded-full bg-[var(--accent)] text-white">
                            {post.category}
                          </span>
                        )}
                        {/* Arrow badge */}
                        <div className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-white/90 flex items-center justify-center opacity-0 scale-75 group-hover:opacity-100 group-hover:scale-100 transition-all duration-200">
                          <ArrowRight size={13} className="text-black" />
                        </div>
                      </div>

                      {/* Content */}
                      <div className="flex flex-col flex-1 p-5">
                        <div className="flex items-center gap-2 text-[11px] text-[var(--text-muted)] mb-2">
                          {post.date && <span className="flex items-center gap-1"><Calendar size={10} /> {post.date}</span>}
                          {post.readTime && <span className="flex items-center gap-1"><Clock size={10} /> {post.readTime}</span>}
                        </div>
                        <h3 className="text-[14px] font-semibold text-[var(--text-primary)] leading-snug mb-2 line-clamp-2 group-hover:text-[var(--accent)] transition-colors">
                          {post.title}
                        </h3>
                        <p className="text-xs text-[var(--text-secondary)] leading-relaxed flex-1 line-clamp-3 mb-3">
                          {post.excerpt}
                        </p>
                        {post.tags && (
                          <div className="flex flex-wrap gap-1">
                            {post.tags.split(',').slice(0, 2).map(tag => (
                              <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded-full border border-[var(--border)] text-[var(--text-muted)]">
                                {tag.trim()}
                              </span>
                            ))}
                          </div>
                        )}

                        {editMode && (
                          <div className="flex gap-3 mt-3 pt-3 border-t border-[var(--border)]">
                            <button onClick={e => { e.preventDefault(); e.stopPropagation(); setEditingItem({ collection: 'blogs', id: post.id, data: post, fields: FIELDS }); }} className="flex items-center gap-1 text-[var(--accent)] text-xs hover:underline"><Pencil size={12} /> Edit</button>
                            <button onClick={e => { e.preventDefault(); e.stopPropagation(); deleteItem('blogs', post.id); }} className="flex items-center gap-1 text-red-400 text-xs hover:underline"><Trash size={12} /> Delete</button>
                          </div>
                        )}
                      </div>
                    </Link>
                  </MotionDiv>
                ))}
              </div>
            )}
          </>
        )}
      </section>

      <SectionRenderer pageId="blog" />
      <div className="container mx-auto px-6 pb-10">
        <DynamicSectionManager pageId="blog" />
      </div>
    </main>
  );
}