'use client';
import DynamicSectionManager from '@/components/pages/DynamicSectionManager';
import PageHero from '@/components/pages/PageHero';
import SectionRenderer from '@/components/sections/SectionRenderer';
import MotionDiv from '@/components/ui/MotionDiv';
import { useAdmin } from '@/context/AdminContext';
import { deleteItem, useColl, useDoc } from '@/lib/firestore-helpers';
import { AnimatePresence, motion } from 'framer-motion';
import {
    BookOpen, Calendar, ChevronDown,
    GraduationCap, MapPin, Pencil, Plus, Star, Trash
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

const FIELDS = [
  { key: 'title',       label: 'Degree Title' },
  { key: 'institution', label: 'Institution Name' },
  { key: 'logoUrl',     label: 'Institution Logo', type: 'image' },
  { key: 'location',    label: 'Location' },
  { key: 'duration',    label: 'Duration (e.g. 2018 – 2022)' },
  { key: 'cgpa',        label: 'CGPA / Grade' },
  { key: 'type',        label: 'Type (e.g. Undergraduate / Postgraduate)' },
  { key: 'description', label: 'Short Description', type: 'textarea' },
  { key: 'courses',     label: 'Courses', type: 'course-list' },
];

const TAG_COLORS = {
  core:            'bg-blue-500/10 text-blue-500 border-blue-500/20',
  elective:        'bg-purple-500/10 text-purple-500 border-purple-500/20',
  'project-based': 'bg-green-500/10 text-green-500 border-green-500/20',
  lab:             'bg-orange-500/10 text-orange-500 border-orange-500/20',
  thesis:          'bg-rose-500/10 text-rose-500 border-rose-500/20',
};

function tagClass(tag) {
  return TAG_COLORS[tag?.toLowerCase()] || 'bg-[var(--bg-secondary)] text-[var(--text-muted)] border-[var(--border)]';
}

function parseCourses(val) {
  if (Array.isArray(val)) return val;
  try { return val ? JSON.parse(val) : []; }
  catch (_) { return []; }
}

// ── Course Card ───────────────────────────────────────────────────────────────
function CourseCard({ course, i }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: i * 0.05, duration: 0.2 }}
      className="flex gap-4 p-4 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] hover:border-[var(--text-primary)]/20 transition-colors"
    >
      <div className="w-8 h-8 rounded-lg bg-[var(--card-bg)] border border-[var(--border)] flex items-center justify-center shrink-0 mt-0.5">
        <BookOpen size={13} className="text-[var(--accent)]" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3 mb-1.5">
          <p className="text-sm font-semibold text-[var(--text-primary)] leading-snug">
            {course.name}
          </p>
          {course.tag && (
            <span className={`shrink-0 text-[10px] font-medium px-2 py-0.5 rounded-full border capitalize ${tagClass(course.tag)}`}>
              {course.tag}
            </span>
          )}
        </div>
        {course.description && (
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
            {course.description}
          </p>
        )}
      </div>
    </motion.div>
  );
}

// ── Education Card ────────────────────────────────────────────────────────────
function EducationCard({ item, index, editMode, setEditingItem }) {
  const [open, setOpen] = useState(false);
  const courses = parseCourses(item.courses);

  return (
    <MotionDiv delay={index * 0.1}>
      <Link href={`/education/${item.id}`} className="block relative pl-12 group">

        {/* Timeline dot */}
        <div className="
          absolute left-[14px] top-[22px]
          w-[10px] h-[10px] rounded-full
          bg-[var(--border)] border-2 border-[var(--bg-primary)]
          transition-all duration-200
          group-hover:bg-[var(--accent)] group-hover:scale-125
        " />

        {/* Card */}
        <div className="
          relative overflow-hidden
          bg-[var(--card-bg)] border border-[var(--border)] rounded-xl
          transition-all duration-200
          group-hover:border-[var(--text-primary)]/25
          group-hover:translate-x-1
          before:absolute before:left-0 before:top-0 before:bottom-0 before:w-[2px]
          before:bg-[var(--accent)]
          before:scale-y-0 before:origin-top
          before:transition-transform before:duration-200
          group-hover:before:scale-y-100
        ">
          <div className="p-5 pb-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">

                {/* Type badge */}
                {item.type && (
                  <span className="inline-block text-[10px] font-medium px-2 py-0.5 rounded-full bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20 mb-2">
                    {item.type}
                  </span>
                )}

                {/* Degree title */}
                <h3 className="text-[16px] font-bold text-[var(--text-primary)] leading-snug mb-2">
                  {item.title}
                </h3>

                {/* Institution row — logo + name */}
                <div className="flex items-center gap-2 mb-2">
                  {item.logoUrl && (
                    <img
                      src={item.logoUrl}
                      alt={item.institution}
                      className="w-6 h-6 rounded object-contain border border-[var(--border)] bg-white p-0.5 shrink-0"
                    />
                  )}
                  <p className="text-sm font-medium text-[var(--accent)] flex items-center gap-1.5">
                    {!item.logoUrl && <GraduationCap size={13} />}
                    {item.institution}
                  </p>
                </div>

                {/* Meta row */}
                <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--text-muted)]">
                  {item.duration && (
                    <span className="flex items-center gap-1">
                      <Calendar size={11} /> {item.duration}
                    </span>
                  )}
                  {item.location && (
                    <span className="flex items-center gap-1">
                      <MapPin size={11} /> {item.location}
                    </span>
                  )}
                  {item.cgpa && (
                    <span className="flex items-center gap-1 text-[var(--text-primary)] font-medium">
                      <Star size={11} className="text-yellow-500" /> {item.cgpa}
                    </span>
                  )}
                </div>
              </div>

              {/* Right: logo (large) + edit controls */}
              <div className="flex flex-col items-end gap-2 shrink-0">
                {item.logoUrl && (
                  <div className="w-12 h-12 rounded-lg border border-[var(--border)] bg-white flex items-center justify-center p-1.5 overflow-hidden">
                    <img
                      src={item.logoUrl}
                      alt={item.institution}
                      className="w-full h-full object-contain"
                    />
                  </div>
                )}
                {editMode && (
                  <div className="flex gap-1.5">
                    <button
                      onClick={e => {
                        e.preventDefault();
                        e.stopPropagation();
                        setEditingItem({ collection: 'education', id: item.id, data: item, fields: FIELDS });
                      }}
                      className="p-1.5 bg-white rounded shadow hover:bg-gray-50"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      onClick={e => {
                        e.preventDefault();
                        e.stopPropagation();
                        deleteItem('education', item.id);
                      }}
                      className="p-1.5 bg-white rounded shadow hover:bg-red-50 text-red-600"
                    >
                      <Trash size={13} />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Description */}
            {item.description && (
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed mt-3 line-clamp-2">
                {item.description}
              </p>
            )}
          </div>

          {/* Courses accordion */}
          {courses.length > 0 && (
            <div className="border-t border-[var(--border)]">
              <button
                onClick={e => {
                  e.preventDefault();
                  e.stopPropagation();
                  setOpen(o => !o);
                }}
                className="w-full flex items-center justify-between px-5 py-3 text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors"
              >
                <span className="flex items-center gap-2">
                  <BookOpen size={12} />
                  {open
                    ? 'Hide courses'
                    : `Show ${courses.length} course${courses.length > 1 ? 's' : ''}`
                  }
                </span>
                <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
                  <ChevronDown size={14} />
                </motion.div>
              </button>

              <AnimatePresence initial={false}>
                {open && (
                  <motion.div
                    key="courses"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: 'easeInOut' }}
                    className="overflow-hidden"
                  >
                    <div className="px-5 pb-5 grid sm:grid-cols-2 gap-3 mt-1">
                      {courses.map((course, i) => (
                        <CourseCard key={i} course={course} i={i} />
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </Link>
    </MotionDiv>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function EducationPage() {
  const { data } = useDoc('pages/education');
  const { items } = useColl('education');
  const { editMode, setEditingItem } = useAdmin();

  return (
    <main>
      <PageHero pageId="education" data={data} />

      <section className="container mx-auto px-6 py-24 max-w-3xl">
        {editMode && (
          <button
            onClick={() => setEditingItem({ collection: 'education', id: null, data: {}, fields: FIELDS })}
            className="mb-8 px-4 py-2 bg-green-600 text-white rounded flex items-center gap-2 text-sm"
          >
            <Plus size={15} /> Add Education
          </button>
        )}

        {items.length === 0 ? (
          <p className="text-center text-[var(--text-muted)] py-24">No education entries yet.</p>
        ) : (
          <div className="relative">
            <div className="absolute left-[18px] top-0 bottom-0 w-px bg-[var(--border)]" />
            <div className="flex flex-col gap-4">
              {items.map((item, i) => (
                <EducationCard
                  key={item.id}
                  item={item}
                  index={i}
                  editMode={editMode}
                  setEditingItem={setEditingItem}
                />
              ))}
            </div>
          </div>
        )}
      </section>

      <SectionRenderer pageId="education" />
      <div className="container mx-auto px-6 pb-10">
        <DynamicSectionManager pageId="education" />
      </div>
    </main>
  );
}