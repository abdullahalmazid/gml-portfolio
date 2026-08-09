'use client';
/**
 * SettingsControls
 * src/components/admin/SettingsControls.js
 *
 * The form primitives the settings panel is built from. They exist so that
 * option types declared in the registries map straight onto controls —
 * `type: 'select'` renders a SelectInput, `type: 'toggle'` renders a Toggle,
 * and adding a new option to a mode never means writing new UI.
 */

import { Check } from 'lucide-react';

/** Immutable nested set: setIn(cfg, 'source.limit', 5) */
export function setIn(object, path, value) {
  const keys = Array.isArray(path) ? path : String(path).split('.');
  if (!keys.length) return value;

  const [head, ...rest] = keys;
  const base = object && typeof object === 'object' ? object : {};

  return {
    ...base,
    [head]: rest.length ? setIn(base[head], rest, value) : value,
  };
}

/** Read a nested value: getIn(cfg, 'display.options.columns') */
export function getIn(object, path, fallback = undefined) {
  const keys = Array.isArray(path) ? path : String(path).split('.');
  let current = object;
  for (const key of keys) {
    if (current === null || current === undefined) return fallback;
    current = current[key];
  }
  return current === undefined ? fallback : current;
}

export function Field({ label, help, children, className = '' }) {
  return (
    <label className={`block ${className}`}>
      <span className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
        {label}
      </span>
      {children}
      {help && <span className="block mt-1 text-[11px] text-[var(--text-muted)] leading-snug">{help}</span>}
    </label>
  );
}

const inputClass =
  'w-full px-3 py-2 rounded-lg text-sm bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-primary)] outline-none focus:border-[var(--accent)] transition-colors';

export function TextInput({ value, onChange, placeholder, ...rest }) {
  return (
    <input
      type="text"
      value={value ?? ''}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className={inputClass}
      {...rest}
    />
  );
}

export function TextArea({ value, onChange, rows = 3, placeholder }) {
  return (
    <textarea
      rows={rows}
      value={value ?? ''}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className={`${inputClass} resize-y leading-relaxed`}
    />
  );
}

export function SelectInput({ value, onChange, options = [], placeholder }) {
  return (
    <select
      value={value ?? ''}
      onChange={(e) => {
        const raw = e.target.value;
        const match = options.find((o) => String(optionValue(o)) === raw);
        onChange(match !== undefined ? optionValue(match) : raw);
      }}
      className={inputClass}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((option) => (
        <option key={String(optionValue(option))} value={String(optionValue(option))}>
          {optionLabel(option)}
        </option>
      ))}
    </select>
  );
}

function optionValue(option) {
  return option && typeof option === 'object' ? option.value : option;
}
function optionLabel(option) {
  return option && typeof option === 'object' ? option.label : String(option);
}

export function NumberInput({ value, onChange, min = 0, max = 100, step = 1 }) {
  return (
    <input
      type="number"
      value={value ?? ''}
      min={min}
      max={max}
      step={step}
      onChange={(e) => {
        const next = Number(e.target.value);
        if (Number.isNaN(next)) return;
        onChange(Math.min(Math.max(next, min), max));
      }}
      className={inputClass}
    />
  );
}

/** Compact alternative to a select when there are only a few short choices. */
export function Segmented({ value, onChange, options = [] }) {
  return (
    <div className="flex rounded-lg border border-[var(--border)] overflow-hidden bg-[var(--bg-primary)]">
      {options.map((option) => {
        const val = optionValue(option);
        const active = String(val) === String(value);
        return (
          <button
            key={String(val)}
            type="button"
            onClick={() => onChange(val)}
            className={`flex-1 px-2.5 py-1.5 text-xs font-semibold capitalize transition-colors ${
              active
                ? 'bg-[var(--accent)] text-white'
                : 'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]'
            }`}
          >
            {optionLabel(option)}
          </button>
        );
      })}
    </div>
  );
}

export function Toggle({ checked, onChange, label, help, disabled = false }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={Boolean(checked)}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={`w-full flex items-start gap-3 text-left py-2 group ${
        disabled ? 'opacity-40 cursor-not-allowed' : ''
      }`}
    >
      <span
        className={`mt-0.5 shrink-0 w-4 h-4 rounded flex items-center justify-center border transition-colors ${
          checked
            ? 'bg-[var(--accent)] border-[var(--accent)] text-white'
            : 'border-[var(--border)] bg-[var(--bg-primary)]'
        }`}
      >
        {checked && <Check size={11} strokeWidth={3} />}
      </span>
      <span className="min-w-0">
        <span className="block text-sm text-[var(--text-primary)] leading-snug">{label}</span>
        {help && <span className="block text-[11px] text-[var(--text-muted)] leading-snug">{help}</span>}
      </span>
    </button>
  );
}

/** Colour swatch plus free-text, since values can be hex or a CSS variable. */
export function ColorInput({ value, onChange, presets = [] }) {
  const isHex = String(value || '').startsWith('#');
  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input
          type="color"
          value={isHex ? value : '#ffffff'}
          onChange={(e) => onChange(e.target.value)}
          className="w-10 h-9 rounded-lg border border-[var(--border)] bg-transparent cursor-pointer shrink-0"
          aria-label="Pick a colour"
        />
        <input
          type="text"
          value={value ?? ''}
          placeholder="var(--bg-primary) or #ffffff"
          onChange={(e) => onChange(e.target.value)}
          className={inputClass}
        />
      </div>
      {presets.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {presets.map((preset) => (
            <button
              key={preset.value}
              type="button"
              onClick={() => onChange(preset.value)}
              className={`px-2 py-1 rounded text-[10px] font-semibold border transition-colors ${
                value === preset.value
                  ? 'border-[var(--accent)] text-[var(--accent)]'
                  : 'border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent)]'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function PanelSection({ title, children, className = '' }) {
  return (
    <div className={`space-y-3 ${className}`}>
      {title && (
        <h4 className="text-[11px] font-bold uppercase tracking-widest text-[var(--text-muted)] pt-1">
          {title}
        </h4>
      )}
      {children}
    </div>
  );
}
