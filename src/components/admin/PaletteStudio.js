'use client';
/**
 * PaletteStudio
 * src/components/admin/PaletteStudio.js
 *
 * Builds a complete theme from three choices instead of eleven colour pickers:
 * an accent, how the greys are tinted, and light or dark.
 *
 * Every generated palette is checked against WCAG contrast targets and the
 * results shown before you apply it — so an unreadable theme is caught here
 * rather than by a visitor.
 *
 * Applying goes through `setCustomColors` from ThemeContext, the same path the
 * existing theme panel uses, so it saves to Firestore and takes effect live.
 */

import { useTheme } from '@/context/ThemeContext';
import {
  auditSummary,
  CONTRAST_LEVELS,
  generatePalette,
  isDarkPalette,
  TINTS,
} from '@/lib/palette';
import { AlertTriangle, Check, Palette, RefreshCw, X } from 'lucide-react';
import { useMemo, useState } from 'react';

const SEEDS = [
  { label: 'Violet', value: '#6d28d9' },
  { label: 'Indigo', value: '#4f46e5' },
  { label: 'Sky', value: '#0284c7' },
  { label: 'Teal', value: '#0d9488' },
  { label: 'Emerald', value: '#059669' },
  { label: 'Amber', value: '#d97706' },
  { label: 'Rose', value: '#e11d48' },
  { label: 'Slate', value: '#475569' },
];

const TOKEN_ORDER = [
  '--bg-primary', '--bg-secondary', '--bg-tertiary', '--card-bg', '--border',
  '--text-primary', '--text-secondary', '--text-muted',
  '--accent', '--accent-hover', '--accent-light', '--accent-contrast',
];

export default function PaletteStudio() {
  const { setCustomColors } = useTheme();

  const [accent, setAccent] = useState('#6d28d9');
  const [mode, setMode] = useState('light');
  const [tint, setTint] = useState('accent');
  const [contrast, setContrast] = useState('normal');
  const [applied, setApplied] = useState(false);

  const colors = useMemo(
    () => generatePalette({ accent, mode, tint, contrast }),
    [accent, mode, tint, contrast]
  );

  const audit = useMemo(() => auditSummary(colors), [colors]);

  const apply = async () => {
    await setCustomColors(colors);
    setApplied(true);
    setTimeout(() => setApplied(false), 2500);
  };

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-5">
      <div className="flex items-center gap-2 mb-5">
        <Palette size={18} className="text-[var(--accent)]" />
        <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--text-primary)]">
          Palette studio
        </h3>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* CONTROLS */}
        <div className="space-y-5">
          <div>
            <Label>Accent colour</Label>
            <div className="flex gap-2 mb-2">
              <input
                type="color"
                value={accent}
                onChange={(e) => setAccent(e.target.value)}
                aria-label="Accent colour"
                className="w-11 h-9 rounded-lg border border-[var(--border)] bg-transparent cursor-pointer shrink-0"
              />
              <input
                type="text"
                value={accent}
                onChange={(e) => setAccent(e.target.value)}
                className="flex-1 px-3 py-2 rounded-lg text-sm font-mono bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {SEEDS.map((seed) => (
                <button
                  key={seed.value}
                  type="button"
                  onClick={() => setAccent(seed.value)}
                  title={seed.label}
                  aria-label={seed.label}
                  className={`w-7 h-7 rounded-full ring-2 ring-offset-2 ring-offset-[var(--card-bg)] transition-transform hover:scale-110 ${
                    accent.toLowerCase() === seed.value ? 'ring-[var(--text-primary)]' : 'ring-transparent'
                  }`}
                  style={{ backgroundColor: seed.value }}
                />
              ))}
            </div>
          </div>

          <div>
            <Label>Mode</Label>
            <Choices
              value={mode}
              onChange={setMode}
              options={[{ value: 'light', label: 'Light' }, { value: 'dark', label: 'Dark' }]}
            />
          </div>

          <div>
            <Label>Greys</Label>
            <Choices
              value={tint}
              onChange={setTint}
              options={Object.entries(TINTS).map(([value, v]) => ({ value, label: v.label }))}
            />
          </div>

          <div>
            <Label>Contrast</Label>
            <Choices
              value={contrast}
              onChange={setContrast}
              options={Object.entries(CONTRAST_LEVELS).map(([value, v]) => ({ value, label: v.label }))}
            />
            <p className="mt-1.5 text-[11px] text-[var(--text-muted)]">
              High pushes text further from the background. Easier to read, less subtle.
            </p>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={apply}
              disabled={audit.failures > 0}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold bg-[var(--accent)] text-[var(--accent-contrast)] hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {applied ? <Check size={15} /> : <RefreshCw size={15} />}
              {applied ? 'Applied' : 'Apply this palette'}
            </button>
            {audit.failures > 0 && (
              <span className="text-[11px] font-semibold text-red-600">
                Fix the failing checks first.
              </span>
            )}
          </div>
        </div>

        {/* PREVIEW + AUDIT */}
        <div className="space-y-4">
          {/* A miniature page, painted with the generated values rather than the
              live theme, so you see the result before applying it. */}
          <div
            className="rounded-xl overflow-hidden border"
            style={{ backgroundColor: colors['--bg-primary'], borderColor: colors['--border'] }}
          >
            <div className="p-4 space-y-3">
              <p style={{ color: colors['--text-primary'] }} className="text-lg font-bold leading-tight">
                A heading in this theme
              </p>
              <p style={{ color: colors['--text-secondary'] }} className="text-xs leading-relaxed">
                Body text sits at this weight against the page. Muted labels{' '}
                <span style={{ color: colors['--text-muted'] }}>look like this</span>, and links{' '}
                <span style={{ color: colors['--accent'] }} className="font-semibold">look like this</span>.
              </p>

              <div
                className="rounded-lg p-3 border"
                style={{ backgroundColor: colors['--card-bg'], borderColor: colors['--border'] }}
              >
                <p style={{ color: colors['--text-primary'] }} className="text-xs font-bold">
                  A card
                </p>
                <p style={{ color: colors['--text-secondary'] }} className="text-[11px] mt-0.5">
                  Cards sit slightly apart from the page.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className="px-3 py-1.5 rounded-full text-[11px] font-bold"
                  style={{ backgroundColor: colors['--accent'], color: colors['--accent-contrast'] }}
                >
                  Button
                </span>
                <span
                  className="px-3 py-1.5 rounded-full text-[11px] font-bold"
                  style={{ backgroundColor: colors['--accent-light'], color: colors['--accent'] }}
                >
                  Tinted
                </span>
                <span
                  className="px-3 py-1.5 rounded-full text-[11px] font-semibold border"
                  style={{ borderColor: colors['--border'], color: colors['--text-secondary'] }}
                >
                  Outline
                </span>
              </div>
            </div>
          </div>

          {/* AUDIT */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <Label>Readability</Label>
              <span className={`text-[11px] font-bold ${audit.ok ? 'text-green-600' : audit.failures ? 'text-red-600' : 'text-amber-600'}`}>
                {audit.ok ? 'All checks pass' : `${audit.failures} failing, ${audit.warnings} tight`}
              </span>
            </div>

            <ul className="space-y-0.5 max-h-44 overflow-y-auto pr-1">
              {audit.results.map((check) => (
                <li key={check.label} className="flex items-center gap-2 text-[11px]">
                  {check.level === 'pass' ? (
                    <Check size={12} className="text-green-600 shrink-0" />
                  ) : check.level === 'warn' ? (
                    <AlertTriangle size={12} className="text-amber-600 shrink-0" />
                  ) : (
                    <X size={12} className="text-red-600 shrink-0" />
                  )}
                  <span className="flex-1 text-[var(--text-secondary)] truncate">{check.label}</span>
                  <span className="font-mono tabular-nums text-[var(--text-muted)]">
                    {check.ratio.toFixed(1)}:1
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* TOKENS */}
          <div>
            <Label>Tokens</Label>
            <div className="grid grid-cols-4 gap-1.5 mt-1">
              {TOKEN_ORDER.map((token) => (
                <div key={token} title={`${token} ${colors[token]}`} className="min-w-0">
                  <div
                    className="h-7 rounded border border-[var(--border)]"
                    style={{ backgroundColor: colors[token] }}
                  />
                  <p className="mt-0.5 text-[9px] font-mono text-[var(--text-muted)] truncate">
                    {token.replace('--', '')}
                  </p>
                </div>
              ))}
            </div>
            <p className="mt-2 text-[11px] text-[var(--text-muted)]">
              This palette is {isDarkPalette(colors) ? 'dark' : 'light'}, so the{' '}
              <code className="font-mono">dark</code> class will be{' '}
              {isDarkPalette(colors) ? 'on' : 'off'}.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Label({ children }) {
  return (
    <span className="block text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-1.5">
      {children}
    </span>
  );
}

function Choices({ value, onChange, options }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
            value === option.value
              ? 'border-[var(--accent)] text-[var(--accent)] bg-[var(--accent)]/10'
              : 'border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent)]'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
