'use client';
import MarkdownRenderer from '@/components/ui/MarkdownRenderer'; // IMPORT ADDED
import { useAdmin } from '@/context/AdminContext';
import { updateData } from '@/lib/firestore-helpers';
import { Pencil } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function EditableText({ 
  collection, docId, fieldPath, value, 
  tag: Tag = 'div', className = '', markdown = false, initialValue 
}) {
  const { editMode, showFieldPaths } = useAdmin();
  const [isEditing, setIsEditing] = useState(false);
  // Support both value and initialValue for backward compatibility
  const val = value !== undefined ? value : initialValue;
  const [currentVal, setCurrentVal] = useState(val || '');

  const path = collection && docId ? `${collection}/${docId}` : null;

  useEffect(() => { setCurrentVal(val || ''); }, [val]);

  const handleSave = async () => {
    setIsEditing(false);
    if (currentVal === val) return;
    if (!path) return;
    await updateData(path, { [fieldPath]: currentVal });
  };

  // --- VIEW MODE (RESTORED MARKDOWN) ---
  if (!editMode) {
    // If markdown prop is true, use MarkdownRenderer
    return (
      <Tag className={className}>
        {markdown ? <MarkdownRenderer>{val}</MarkdownRenderer> : val}
      </Tag>
    );
  }

  // --- EDIT MODE ---
  if (isEditing) {
    return (
      <div className="relative bg-white shadow-lg p-2 rounded border border-[var(--accent)] z-50">
        {showFieldPaths && (
          <span className="absolute -top-6 left-0 bg-blue-600 text-white text-[10px] px-2 py-0.5 rounded font-mono z-30 whitespace-nowrap">
            {collection}/{docId} → {fieldPath}
          </span>
        )}
        {markdown ? (
          <textarea 
            value={currentVal} 
            onChange={(e) => setCurrentVal(e.target.value)} 
            className="w-full min-h-[100px] bg-transparent outline-none text-black font-mono text-sm" 
            autoFocus 
          />
        ) : (
          <input 
            value={currentVal} 
            onChange={(e) => setCurrentVal(e.target.value)} 
            className="w-full bg-transparent outline-none text-black" 
            autoFocus 
          />
        )}
        <div className="flex gap-2 mt-2">
          <button onClick={handleSave} className="px-3 py-1 bg-black text-white text-xs rounded">Save</button>
          <button onClick={() => { setCurrentVal(val || ''); setIsEditing(false); }} className="px-3 py-1 text-xs">Cancel</button>
        </div>
      </div>
    );
  }

  // --- EDIT MODE (Idle) ---
  return (
    <Tag 
      className={`${className} group relative border border-dashed border-transparent hover:border-[var(--accent)] p-1 rounded transition-all cursor-text`} 
      onClick={() => setIsEditing(true)}
    >
      {showFieldPaths && (
        <span className="absolute -top-6 left-0 bg-blue-600 text-white text-[10px] px-2 py-0.5 rounded font-mono z-30 whitespace-nowrap">
          {collection}/{docId} → {fieldPath}
        </span>
      )}
      <div className="absolute top-0 right-0 bg-[var(--accent)] text-white p-1 rounded-bl text-xs opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <Pencil size={12} className="inline" /> Edit
      </div>
      
      {/* RENDER CONTENT (Markdown or Plain) */}
      {markdown ? <MarkdownRenderer>{currentVal}</MarkdownRenderer> : currentVal}
    </Tag>
  );
}