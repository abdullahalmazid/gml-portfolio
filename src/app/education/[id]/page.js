'use client';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import {
    ArrowLeft, BookOpen, Calendar,
    GraduationCap, MapPin, Star
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

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

export default function EducationDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      const snap = await getDoc(doc(db, 'education', id));
      if (snap.exists()) setItem({ id: snap.id, ...snap.data() });
      setLoading(false);
    };
    fetchData();
  }, [id]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center text-[var(--text-secondary)]">
      Loading...
    </div>
  );
  if (!item) return (
    <div className="min-h-screen flex items-center justify-center text-[var(--text-secondary)]">
      Education entry not found.
    </div>
  );

  const courses = parseCourses(item.courses);

  // Group by tag
  const grouped = courses.reduce((acc, course) => {
    const key = course.tag || 'Other';
    if (!acc[key]) acc[key] = [];
    acc[key].push(course);
    return acc;
  }, {});

  const groupOrder = ['core', 'project-based', 'lab', 'elective', 'thesis', 'Other'];
  const sortedGroups = Object.keys(grouped).sort((a, b) => {
    const ai = groupOrder.indexOf(a.toLowerCase());
    const bi = groupOrder.indexOf(b.toLowerCase());
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });

  return (
    <main className="min-h-screen py-12">
      <div className="container mx-auto px-6 max-w-5xl">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors"
          >
            <ArrowLeft size={15} /> Education
          </button>
          <span className="text-[var(--text-muted)]">/</span>
          <span className="text-[var(--text-primary)] font-medium truncate">{item.title}</span>
        </nav>

        <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-xl overflow-hidden shadow-sm">

          {/* Header */}
          <div className="p-8 border-b border-[var(--border)]">
            <div className="grid lg:grid-cols-[1fr_220px] gap-8 items-start">

              {/* Left */}
              <div>
                {item.type && (
                  <span className="inline-block text-xs font-medium px-2.5 py-1 rounded-full bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20 mb-3">
                    {item.type}
                  </span>
                )}

                <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-3 leading-snug">
                  {item.title}
                </h1>

                {/* Institution with logo */}
                <div className="flex items-center gap-3 mb-4">
                  {item.logoUrl && (
                    <div className="w-10 h-10 rounded-lg border border-[var(--border)] bg-white flex items-center justify-center p-1.5 shrink-0">
                      <img
                        src={item.logoUrl}
                        alt={item.institution}
                        className="w-full h-full object-contain"
                      />
                    </div>
                  )}
                  <p className="text-base font-semibold text-[var(--accent)] flex items-center gap-1.5">
                    {!item.logoUrl && <GraduationCap size={16} />}
                    {item.institution}
                  </p>
                </div>

                {/* Meta */}
                <div className="flex flex-wrap gap-4 text-sm text-[var(--text-muted)] mb-5">
                  {item.duration && (
                    <span className="flex items-center gap-1.5">
                      <Calendar size={13} /> {item.duration}
                    </span>
                  )}
                  {item.location && (
                    <span className="flex items-center gap-1.5">
                      <MapPin size={13} /> {item.location}
                    </span>
                  )}
                  {item.cgpa && (
                    <span className="flex items-center gap-1.5 text-[var(--text-primary)] font-semibold">
                      <Star size={13} className="text-yellow-500" /> {item.cgpa}
                    </span>
                  )}
                </div>

                {item.description && (
                  <p className="text-[var(--text-secondary)] leading-relaxed">
                    {item.description}
                  </p>
                )}
              </div>

              {/* Right: meta panel */}
              <div className="flex flex-col gap-3">
                {/* Logo card */}
                {item.logoUrl && (
                  <div className="w-full p-4 border border-[var(--border)] rounded-lg bg-white flex items-center justify-center">
                    <img
                      src={item.logoUrl}
                      alt={item.institution}
                      className="max-h-16 max-w-full object-contain"
                    />
                  </div>
                )}

                {/* Meta key-value */}
                <div className="border border-[var(--border)] rounded-lg overflow-hidden text-sm divide-y divide-[var(--border)]">
                  {[
                    ['Degree',      item.type],
                    ['Institution', item.institution],
                    ['Duration',    item.duration],
                    ['Location',    item.location],
                    ['CGPA',        item.cgpa],
                    ['Courses',     courses.length > 0 ? `${courses.length} courses` : null],
                  ].filter(([, v]) => v).map(([label, value]) => (
                    <div key={label} className="px-4 py-3 bg-[var(--card-bg)]">
                      <p className="text-[10px] uppercase tracking-widest text-[var(--text-muted)] mb-0.5">{label}</p>
                      <p className="font-medium text-[var(--text-primary)]">{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Courses */}
          {courses.length > 0 && (
            <div className="p-8">
              <div className="flex items-center gap-2 mb-6">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
                  Courses & What I Learned
                </p>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-muted)]">
                  {courses.length} total
                </span>
              </div>

              {/* Tag legend */}
              <div className="flex flex-wrap gap-2 mb-8">
                {sortedGroups.map(group => (
                  <span
                    key={group}
                    className={`text-[11px] font-medium px-2.5 py-1 rounded-full border capitalize ${tagClass(group)}`}
                  >
                    {group} · {grouped[group].length}
                  </span>
                ))}
              </div>

              {/* Grouped */}
              <div className="space-y-8">
                {sortedGroups.map(group => (
                  <div key={group}>
                    <div className="flex items-center gap-3 mb-4">
                      <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border capitalize shrink-0 ${tagClass(group)}`}>
                        {group}
                      </span>
                      <div className="flex-1 h-px bg-[var(--border)]" />
                    </div>

                    <div className="grid sm:grid-cols-2 gap-3">
                      {grouped[group].map((course, i) => (
                        <div
                          key={i}
                          className="flex gap-4 p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] hover:border-[var(--text-primary)]/20 transition-colors"
                        >
                          <div className="w-8 h-8 rounded-lg bg-[var(--card-bg)] border border-[var(--border)] flex items-center justify-center shrink-0 mt-0.5">
                            <BookOpen size={13} className="text-[var(--accent)]" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-[var(--text-primary)] mb-1 leading-snug">
                              {course.name}
                            </p>
                            {course.description && (
                              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                                {course.description}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}