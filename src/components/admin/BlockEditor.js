'use client';
/**
 * BlockEditor
 * src/components/admin/BlockEditor.js
 *
 * The editing surface for a custom section's blocks: add, reorder, edit,
 * duplicate and remove. A `columns` block expands to per-column tabs, each
 * holding its own nested list.
 *
 * BlockList is recursive but capped at one level — nested lists are passed
 * `allowContainers={false}`, so the Columns type simply isn't offered inside a
 * column. The limit is enforced here in the UI and again in `reconcileBlock`,
 * because a config could otherwise arrive from an import or an older client.
 *
 * Reordering supports BOTH drag and up/down buttons. Native HTML5 drag is used
 * so this adds no dependency — but native drag doesn't fire on touch screens,
 * which is why the buttons stay. They are the mobile and keyboard path.
 */

import { cloudinaryConfig } from '@/lib/cloudinary';
import {
  BLOCKS,
  columnCount,
  createBlock,
  describeBlock,
  getBlock,
  isContainer,
  NESTABLE_KEYS,
  BLOCK_KEYS,
  resizeColumns,
} from '@/lib/sections/blockRegistry';
import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  Copy,
  GripVertical,
  ImagePlus,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import { useState } from 'react';
import {
  Field,
  NumberInput,
  Segmented,
  SelectInput,
  TextArea,
  TextInput,
  Toggle,
} from './SettingsControls';

export default function BlockEditor({ blocks = [], onChange }) {
  return <BlockList blocks={blocks} onChange={onChange} allowContainers />;
}

function BlockList({ blocks = [], onChange, allowContainers = false, compact = false }) {
  const [openId, setOpenId] = useState(null);
  const [adding, setAdding] = useState(false);
  const [dragIndex, setDragIndex] = useState(null);
  const [overIndex, setOverIndex] = useState(null);

  const available = allowContainers ? BLOCK_KEYS : NESTABLE_KEYS;

  const replace = (index, block) => onChange(blocks.map((b, i) => (i === index ? block : b)));

  const move = (from, to) => {
    if (to < 0 || to >= blocks.length || from === to) return;
    const next = [...blocks];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onChange(next);
  };

  const add = (type) => {
    const block = createBlock(type);
    onChange([...blocks, block]);
    setOpenId(block.id);
    setAdding(false);
  };

  const duplicate = (index) => {
    const source = blocks[index];
    const copy = { ...createBlock(source.type), props: { ...source.props } };
    if (source.children) {
      // Fresh ids for copied children, or React keys collide.
      copy.children = source.children.map((column) =>
        column.map((child) => ({ ...child, id: createBlock(child.type).id }))
      );
    }
    const next = [...blocks];
    next.splice(index + 1, 0, copy);
    onChange(next);
  };

  const remove = (index) => {
    if (openId === blocks[index]?.id) setOpenId(null);
    onChange(blocks.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-2">
      {blocks.length === 0 && !adding && (
        <p className={`text-[11px] text-[var(--text-muted)] py-2.5 px-3 rounded-lg border border-dashed border-[var(--border)]`}>
          {compact ? 'Empty column.' : 'No blocks yet. Add one below.'}
        </p>
      )}

      <ul className="space-y-1.5">
        {blocks.map((block, index) => {
          const { label, preview } = describeBlock(block);
          const open = openId === block.id;
          const isDropTarget = overIndex === index && dragIndex !== null && dragIndex !== index;

          return (
            <li
              key={block.id}
              draggable
              onDragStart={(e) => { e.stopPropagation(); setDragIndex(index); }}
              onDragEnd={() => { setDragIndex(null); setOverIndex(null); }}
              onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setOverIndex(index); }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (dragIndex !== null) move(dragIndex, index);
                setDragIndex(null);
                setOverIndex(null);
              }}
              className={`rounded-lg border bg-[var(--bg-primary)] transition-all ${open ? 'border-[var(--accent)]' : 'border-[var(--border)]'
                } ${isDropTarget ? 'ring-2 ring-[var(--accent)]' : ''} ${dragIndex === index ? 'opacity-40' : ''
                }`}
            >
              <div className="flex items-center gap-0.5 px-2 py-1.5">
                <span className="cursor-grab active:cursor-grabbing text-[var(--text-muted)] shrink-0" title="Drag to reorder">
                  <GripVertical size={14} />
                </span>

                <button type="button" onClick={() => setOpenId(open ? null : block.id)} className="flex-1 min-w-0 text-left px-1">
                  <span className="block text-xs font-bold text-[var(--text-primary)]">{label}</span>
                  {preview && <span className="block text-[11px] text-[var(--text-muted)] truncate">{preview}</span>}
                </button>

                <button type="button" onClick={() => move(index, index - 1)} disabled={index === 0}
                  aria-label="Move up" className="p-1 rounded hover:bg-[var(--bg-tertiary)] disabled:opacity-25">
                  <ArrowUp size={13} />
                </button>
                <button type="button" onClick={() => move(index, index + 1)} disabled={index === blocks.length - 1}
                  aria-label="Move down" className="p-1 rounded hover:bg-[var(--bg-tertiary)] disabled:opacity-25">
                  <ArrowDown size={13} />
                </button>
                <button type="button" onClick={() => duplicate(index)}
                  aria-label="Duplicate" className="p-1 rounded hover:bg-[var(--bg-tertiary)]">
                  <Copy size={13} />
                </button>
                <button type="button" onClick={() => remove(index)}
                  aria-label="Remove" className="p-1 rounded text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10">
                  <Trash2 size={13} />
                </button>
                <ChevronDown size={14} className={`text-[var(--text-muted)] transition-transform ${open ? 'rotate-180' : ''}`} />
              </div>

              {open && (
                <div className="px-3 pb-3 pt-1 space-y-3 border-t border-[var(--border)]">
                  {(getBlock(block.type)?.props || []).map((prop) => (
                    <BlockProp
                      key={prop.key}
                      prop={prop}
                      value={block.props?.[prop.key]}
                      onChange={(next) => {
                        const updated = { ...block, props: { ...block.props, [prop.key]: next } };
                        // Changing the split resizes columns without losing blocks.
                        if (isContainer(block.type) && prop.key === 'layout') {
                          updated.children = resizeColumns(block.children, columnCount(next));
                        }
                        replace(index, updated);
                      }}
                    />
                  ))}

                  {isContainer(block.type) && (
                    <ColumnTabs
                      block={block}
                      onChange={(children) => replace(index, { ...block, children })}
                    />
                  )}

                  {!isContainer(block.type) && (getBlock(block.type)?.props || []).length === 0 && (
                    <p className="text-[11px] text-[var(--text-muted)]">Nothing to configure.</p>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>

      {adding ? (
        <div className="p-2 rounded-lg border border-[var(--accent)] bg-[var(--bg-primary)]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
              Choose a block
            </span>
            <button type="button" onClick={() => setAdding(false)} aria-label="Cancel"
              className="p-1 rounded text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]">
              <X size={13} />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {available.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => add(type)}
                className="text-left px-2.5 py-2 rounded-lg border border-[var(--border)] hover:border-[var(--accent)] hover:bg-[var(--accent)]/5 transition-colors"
              >
                <span className="block text-xs font-bold text-[var(--text-primary)]">{BLOCKS[type].label}</span>
                <span className="block text-[10px] leading-snug text-[var(--text-muted)]">
                  {BLOCKS[type].description}
                </span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="w-full inline-flex items-center justify-center gap-1.5 py-1.5 rounded-lg border border-dashed border-[var(--border)] text-[11px] font-bold text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors"
        >
          <Plus size={13} /> Add {compact ? 'to this column' : 'a block'}
        </button>
      )}
    </div>
  );
}

/** Per-column editing for a container block. */
function ColumnTabs({ block, onChange }) {
  const [active, setActive] = useState(0);
  const columns = Array.isArray(block.children) ? block.children : [];

  const setColumn = (index, blocks) =>
    onChange(columns.map((c, i) => (i === index ? blocks : c)));

  return (
    <div className="pt-1">
      <div className="flex gap-1 mb-2">
        {columns.map((column, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setActive(i)}
            className={`flex-1 px-2 py-1.5 rounded-md text-[11px] font-bold transition-colors ${active === i
                ? 'bg-[var(--accent)] text-white'
                : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
          >
            Column {i + 1}
            <span className="block text-[9px] font-medium opacity-70">
              {column.length} block{column.length === 1 ? '' : 's'}
            </span>
          </button>
        ))}
      </div>

      <div className="pl-2 border-l-2 border-[var(--accent)]/30">
        <BlockList
          blocks={columns[active] || []}
          onChange={(blocks) => setColumn(active, blocks)}
          allowContainers={false}
          compact
        />
      </div>
    </div>
  );
}

/** Renders one prop from the block registry. Prop type decides the control. */
function BlockProp({ prop, value, onChange }) {
  if (prop.type === 'image') {
    return (
      <Field label={prop.label} help={prop.help}>
        <ImageProp value={value} onChange={onChange} />
      </Field>
    );
  }

  if (prop.type === 'toggle') {
    return <Toggle checked={Boolean(value)} onChange={onChange} label={prop.label} help={prop.help} />;
  }

  if (prop.type === 'number') {
    return (
      <Field label={prop.label} help={prop.help}>
        <NumberInput value={value} min={prop.min ?? 0} max={prop.max ?? 500} step={prop.step ?? 1} onChange={onChange} />
      </Field>
    );
  }

  if (prop.type === 'markdown' || prop.type === 'textarea') {
    return (
      <Field label={prop.label} help={prop.help}>
        <TextArea rows={prop.type === 'markdown' ? 6 : 3} value={value} onChange={onChange} />
      </Field>
    );
  }

  if (prop.type === 'select') {
    const options = prop.options || [];
    const short = options.length <= 4 && options.every((o) => String(o.label ?? o).length <= 8);
    return (
      <Field label={prop.label} help={prop.help}>
        {short
          ? <Segmented value={value} onChange={onChange} options={options} />
          : <SelectInput value={value} onChange={onChange} options={options} />}
      </Field>
    );
  }

  return (
    <Field label={prop.label} help={prop.help}>
      <TextInput
        value={value}
        onChange={onChange}
        placeholder={prop.type === 'link' ? '/contact or https://…' : undefined}
      />
    </Field>
  );
}

/** Uses the same Cloudinary widget as EditableImage, so uploads land in one place. */
function ImageProp({ value, onChange }) {
  const openWidget = () => {
    if (typeof window === 'undefined' || !window.cloudinary) {
      alert('The upload widget has not loaded yet. Paste an image URL instead, or reload the page.');
      return;
    }
    cloudinaryConfig.openWidget((url) => onChange(url));
  };

  return (
    <div className="space-y-2">
      {value ? (
        <div className="relative rounded-lg overflow-hidden border border-[var(--border)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="" className="w-full h-24 object-cover" />
          <button
            type="button"
            onClick={() => onChange('')}
            aria-label="Remove image"
            className="absolute top-1.5 right-1.5 p-1 rounded-full bg-black/60 text-white hover:bg-black/80"
          >
            <X size={12} />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={openWidget}
          className="w-full flex flex-col items-center justify-center gap-1 h-20 rounded-lg border border-dashed border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors"
        >
          <ImagePlus size={18} />
          <span className="text-[11px] font-semibold">Upload an image</span>
        </button>
      )}

      <div className="flex gap-2">
        <TextInput value={value} onChange={onChange} placeholder="…or paste an image URL" />
        {value && (
          <button
            type="button"
            onClick={openWidget}
            className="shrink-0 px-3 rounded-lg text-xs font-semibold border border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-[var(--accent)]"
          >
            Replace
          </button>
        )}
      </div>
    </div>
  );
}