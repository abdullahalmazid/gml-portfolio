'use client';
/**
 * FieldToggles
 * src/components/admin/FieldToggles.js
 *
 * Which pieces of each item are shown in this section. The list is generated
 * from the field registry, so a field added to a collection appears here
 * automatically.
 *
 * Fields whose role the current display mode can't render are shown disabled
 * with the reason, rather than being hidden or silently ignored. That way it's
 * obvious *why* the abstract won't appear in compact mode, instead of looking
 * like a bug.
 */

import { getCollection } from '@/lib/sections/fieldRegistry';
import { getMode, modeSupportsRole } from '@/lib/sections/modeRegistry';
import { Toggle } from './SettingsControls';

const ROLE_LABEL = {
  title: 'Headline',
  subtitle: 'Sub-headline',
  meta: 'Metadata',
  body: 'Description',
  image: 'Image',
  link: 'Link',
  tags: 'Tags',
};

export default function FieldToggles({ collectionName, mode, fields = {}, onChange }) {
  const meta = getCollection(collectionName);
  const modeMeta = getMode(mode);

  if (!meta) {
    return (
      <p className="text-sm text-[var(--text-muted)]">
        Unknown collection &quot;{String(collectionName)}&quot;.
      </p>
    );
  }

  const toggle = (key, next) => onChange({ ...fields, [key]: next });

  // Group by role so related switches sit together.
  const grouped = meta.fields.reduce((acc, field) => {
    (acc[field.role] ||= []).push(field);
    return acc;
  }, {});

  const unsupported = Object.keys(grouped).filter((role) => !modeSupportsRole(mode, role));

  return (
    <div className="space-y-4">
      {Object.entries(grouped).map(([role, roleFields]) => {
        const supported = modeSupportsRole(mode, role);

        return (
          <div key={role}>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-0.5">
              {ROLE_LABEL[role] || role}
            </p>

            <div className="divide-y divide-[var(--border)]/50">
              {roleFields.map((field) => (
                <Toggle
                  key={field.key}
                  checked={Boolean(fields[field.key])}
                  disabled={!supported || field.locked}
                  onChange={(next) => toggle(field.key, next)}
                  label={field.label}
                  help={
                    field.locked
                      ? 'Always shown in this layout.'
                      : !supported
                        ? `${modeMeta?.label || 'This layout'} doesn't show this.`
                        : undefined
                  }
                />
              ))}
            </div>
          </div>
        );
      })}

      {unsupported.length > 0 && (
        <p className="text-[11px] leading-snug text-[var(--text-muted)] border-t border-[var(--border)] pt-3">
          Switch to a different layout on the Layout tab to use the greyed-out fields.
        </p>
      )}
    </div>
  );
}
