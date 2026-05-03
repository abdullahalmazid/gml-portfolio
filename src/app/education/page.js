'use client';
import DynamicSectionManager from '@/components/pages/DynamicSectionManager';
import PageHero from '@/components/pages/PageHero';
import SectionRenderer from '@/components/sections/SectionRenderer';
import MotionDiv from '@/components/ui/MotionDiv';
import { useAdmin } from '@/context/AdminContext';
import { deleteItem, useColl, useDoc } from '@/lib/firestore-helpers';
import { ArrowRight, BookOpen, GraduationCap, MapPin, Pencil, Plus, Trash } from 'lucide-react';
import Link from 'next/link';

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

const TYPE_STYLES = {
  undergraduate:  { bar: 'bg-blue-500',   badge: 'bg-blue-500/10 text-blue-600 border-blue-200' },
  postgraduate:   { bar: 'bg-violet-500', badge: 'bg-violet-500/10 text-violet-600 border-violet-200' },
  masters:        { bar: 'bg-violet-500', badge: 'bg-violet-500/10 text-violet-600 border-violet-200' },
  phd:            { bar: 'bg-rose-500',   badge: 'bg-rose-500/10 text-rose-600 border-rose-200' },
  diploma:        { bar: 'bg-emerald-500',badge: 'bg-emerald-500/10 text-emerald-600 border-emerald-200' },
};

function getTypeStyle(type) {
  return TYPE_STYLES[type?.toLowerCase()] || {
    bar: 'bg-[var(--accent)]',
    badge: 'bg-[var(--accent)]/10 text-[var(--accent)] border-[var(--accent)]/20',
  };
}

function parseCourses(val) {
  if (Array.isArray(val)) return val;
  try { return val ? JSON.parse(val) : []; }
  catch (_) { return []; }
}

// ── CGPA Arc ──────────────────────────────────────────────────────────────────
function CgpaArc({ cgpa }) {
  const numeric = parseFloat(cgpa);
  if (isNaN(numeric)) {
    return (
      <div className="flex flex-col items-center justify-center w-14 h-14 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] shrink-0">
        <span className="text-[12px] font-bold text-[var(--text-primary)] leading-none">{cgpa}</span>
        <span className="text-[8px] text-[var(--text-muted)] mt-0.5 uppercase tracking-wider">Grade</span>
      </div>
    );
  }

  const max = numeric <= 5 ? 5 : numeric <= 10 ? 10 : 100;
  const pct = Math.min(numeric / max, 1);
  const r = 18;
  const circ = 2 * Math.PI * r;
  const arcFraction = 0.75;
  const filled = pct * circ * arcFraction;
  const empty = circ - filled;

  return (
    <div className="relative w-14 h-14 shrink-0">
      <svg width="56" height="56" viewBox="0 0 56 56" className="-rotate-[135deg]">
        {/* Track */}
        <circle
          cx="28" cy="28" r={r}
          fill="none"
          stroke="var(--border)"
          strokeWidth="3.5"
          strokeDasharray={`${circ * arcFraction} ${circ * (1 - arcFraction)}`}
          strokeLinecap="round"
        />
        {/* Fill */}
        <circle
          cx="28" cy="28" r={r}
          fill="none"
          stroke="var(--accent)"
          strokeWidth="3.5"
          strokeDasharray={`${filled} ${empty + circ * (1 - arcFraction)}`}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[12px] font-bold text-[var(--text-primary)] leading-none">{numeric}</span>
        <span className="text-[8px] text-[var(--text-muted)] mt-0.5 uppercase tracking-wider">GPA</span>
      </div>
    </div>
  );
}

// ── Duration Bar ──────────────────────────────────────────────────────────────
function DurationBar({ duration }) {
  const parts = duration.split(/[–\-]/).map(s => s.trim());
  const start = parts[0];
  const end = parts[1] || 'Present';
  return (
    <div className="flex items-center gap-2 max-w-[180px]">
      <span className="text-[11px] font-semibold text-[var(--text-secondary)] whitespace-nowrap">{start}</span>
      <div className="flex-1 h-[2px] rounded-full bg-[var(--border)] relative overflow-hidden">
        <div className="absolute inset-0 bg-[var(--accent)]/50 rounded-full" />
      </div>
      <span className="text-[11px] font-semibold text-[var(--text-secondary)] whitespace-nowrap">{end}</span>
    </div>
  );
}

// ── Education Card ────────────────────────────────────────────────────────────
function EducationCard({ item, index, editMode, setEditingItem }) {
  const courses = parseCourses(item.courses);
  const style = getTypeStyle(item.type);

  return (
    <MotionDiv delay={index * 0.1}>
      <Link href={`/education/${item.id}`} className="group block">
        <div className="relative flex bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl overflow-hidden transition-all duration-300 hover:border-[var(--accent)]/40 hover:shadow-[0_8px_32px_rgba(0,0,0,0.07)] hover:-translate-y-0.5">

          {/* Left color bar */}
          <div className={`w-[3px] shrink-0 ${style.bar} transition-opacity duration-300 opacity-50 group-hover:opacity-100`} />

          <div className="flex flex-1 gap-5 p-5 md:p-6 min-w-0">

            {/* Institution logo */}
            <div className="shrink-0">
              {item.logoUrl ? (
                <div className="w-[52px] h-[52px] rounded-xl border border-[var(--border)] bg-white flex items-center justify-center p-2 shadow-sm overflow-hidden transition-transform duration-300 group-hover:scale-[1.06]">
                  <img src={item.logoUrl} alt={item.institution} className="w-full h-full object-contain" />
                </div>
              ) : (
                <div className="w-[52px] h-[52px] rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] flex items-center justify-center">
                  <GraduationCap size={20} className="text-[var(--accent)]" />
                </div>
              )}
            </div>

            {/* Text content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-3 mb-1.5">
                <div className="min-w-0 flex-1">
                  {item.type && (
                    <span className={`inline-block text-[10px] font-bold tracking-widest uppercase px-2 py-0.5 rounded-full border mb-1.5 ${style.badge}`}>
                      {item.type}
                    </span>
                  )}
                  <h3 className="text-[15px] font-bold text-[var(--text-primary)] leading-snug group-hover:text-[var(--accent)] transition-colors duration-200">
                    {item.title}
                  </h3>
                </div>

                {/* CGPA arc — top right */}
                {item.cgpa && <CgpaArc cgpa={item.cgpa} />}
              </div>

              {/* Institution name */}
              <p className="text-sm font-semibold text-[var(--accent)] mb-3">{item.institution}</p>

              {/* Duration bar */}
              {item.duration && <DurationBar duration={item.duration} />}

              {/* Description */}
              {item.description && (
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed line-clamp-2 mt-2.5">
                  {item.description}
                </p>
              )}

              {/* Footer */}
              <div className="flex items-center gap-4 flex-wrap mt-3">
                {item.location && (
                  <span className="inline-flex items-center gap-1 text-[11px] text-[var(--text-muted)]">
                    <MapPin size={10} /> {item.location}
                  </span>
                )}
                {courses.length > 0 && (
                  <span className="inline-flex items-center gap-1 text-[11px] text-[var(--text-muted)]">
                    <BookOpen size={10} className="text-[var(--accent)]" />
                    {courses.length} courses
                  </span>
                )}
                <span className="ml-auto inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--accent)] opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  View details <ArrowRight size={11} />
                </span>
              </div>
            </div>
          </div>

          {/* Edit controls */}
          {editMode && (
            <div className="absolute top-4 right-4 flex gap-1.5 z-10">
              <button
                onClick={e => { e.preventDefault(); e.stopPropagation(); setEditingItem({ collection: 'education', id: item.id, data: item, fields: FIELDS }); }}
                className="p-1.5 bg-white rounded-lg shadow-sm hover:bg-gray-50 transition-colors"
              >
                <Pencil size={12} />
              </button>
              <button
                onClick={e => { e.preventDefault(); e.stopPropagation(); deleteItem('education', item.id); }}
                className="p-1.5 bg-white rounded-lg shadow-sm hover:bg-red-50 text-red-500 transition-colors"
              >
                <Trash size={12} />
              </button>
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
  const { items, loading } = useColl('education');
  const { editMode, setEditingItem } = useAdmin();

  return (
    <main>
      <PageHero pageId="education" data={data} />

      <section className="container mx-auto px-6 py-24 max-w-3xl">
        {editMode && (
          <button
            onClick={() => setEditingItem({ collection: 'education', id: null, data: {}, fields: FIELDS })}
            className="mb-8 px-4 py-2 bg-green-600 text-white rounded-lg flex items-center gap-2 text-sm font-medium"
          >
            <Plus size={15} /> Add Education
          </button>
        )}

        {loading ? (
          <div className="flex flex-col gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-28 bg-[var(--bg-secondary)] animate-pulse rounded-2xl" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <div className="w-16 h-16 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border)] flex items-center justify-center">
              <GraduationCap size={28} className="text-[var(--text-muted)]" />
            </div>
            <p className="text-[var(--text-muted)] text-sm">No education entries yet.</p>
          </div>
        ) : (
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
        )}
      </section>

      <SectionRenderer pageId="education" />
      <div className="container mx-auto px-6 pb-10">
        <DynamicSectionManager pageId="education" />
      </div>
    </main>
  );
}