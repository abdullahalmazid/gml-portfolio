'use client';
import SectionWizard from '@/components/ui/SectionWizard';
import { useAdmin } from '@/context/AdminContext';
import { deleteItem, updateData, useColl } from '@/lib/firestore-helpers';
import { ArrowDown, ArrowUp, Plus, Settings, Trash } from 'lucide-react';
import { useState } from 'react';

// Fields for Custom Section
const CUSTOM_FIELDS = [
  { key: 'title', label: 'Section Title' },
  { key: 'titleAlign', label: 'Title Alignment', type: 'select', options: ['Left', 'Center', 'Right'] },
  { key: 'content', label: 'Content', type: 'textarea' },
  { key: 'bgColor', label: 'Background', type: 'bg-color' },
];

// Fields for Linked Section
const LINKED_FIELDS = [
  { key: 'title', label: 'Section Title' },
  { key: 'layout', label: 'Layout', type: 'select', options: ['grid', 'side-left', 'side-right', 'list'] },
  { key: 'limit', label: 'How many items?', type: 'number' },
  { key: 'bgColor', label: 'Background', type: 'bg-color' },
];

// NEW: Fields for Stats Strip
const STATS_FIELDS = [
  { key: 'title', label: 'Section Title' },
  { key: 'bgColor', label: 'Background', type: 'bg-color' },
  // Note: We don't add 'content' here because it's a complex JSON array 
  // that is easier to recreate via the Wizard than edit manually.
];

export default function DynamicSectionManager({ pageId }) {
  const { editMode, setEditingItem } = useAdmin();
  const { items: allSections } = useColl('sections');
  const sections = allSections.filter(s => s.pageId === pageId).sort((a, b) => (a.order || 0) - (b.order || 0));
  
  const [showWizard, setShowWizard] = useState(false);

  if (!editMode) return null;

  if (showWizard) {
    return <SectionWizard pageId={pageId} onClose={() => setShowWizard(false)} />;
  }

  const handleMove = async (id, direction, currentOrder) => {
    const targetIndex = direction === 'up' ? currentOrder - 1 : currentOrder + 1;
    if (targetIndex < 0 || targetIndex >= sections.length) return;
    const targetSection = sections[targetIndex];
    await updateData(`sections/${id}`, { order: targetSection.order });
    await updateData(`sections/${targetSection.id}`, { order: currentOrder });
  };

  const handleOpenSettings = (sec) => {
    let fields;
    if (sec.type === 'linked') {
      fields = LINKED_FIELDS;
    } else if (sec.type === 'stats') {
      fields = STATS_FIELDS; // NEW: Handle Stats type
    } else {
      fields = CUSTOM_FIELDS;
    }
    setEditingItem({ collection: 'sections', id: sec.id, data: sec, fields });
  };

  return (
    <div className="mt-16 border-2 border-dashed border-blue-400 rounded-xl p-6 bg-blue-50/50">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-blue-700">Page Sections</h3>
        <button onClick={() => setShowWizard(true)} className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700">
          <Plus size={16} /> Add Section
        </button>
      </div>

      <div className="space-y-2">
        {sections.length === 0 && <p className="text-sm text-gray-500">No sections yet.</p>}
        {sections.map((sec, i) => (
          <div key={sec.id} className="flex items-center justify-between bg-white p-3 rounded shadow-sm border">
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-800">{sec.title}</span>
              <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">{sec.type}</span>
            </div>
            <div className="flex gap-2">
              <button onClick={() => handleMove(sec.id, 'up', i)} className="p-1 hover:bg-gray-100 rounded"><ArrowUp size={16} /></button>
              <button onClick={() => handleMove(sec.id, 'down', i)} className="p-1 hover:bg-gray-100 rounded"><ArrowDown size={16} /></button>
              <button onClick={() => handleOpenSettings(sec)} className="p-1 hover:bg-gray-100 rounded"><Settings size={16} /></button>
              <button onClick={() => deleteItem('sections', sec.id)} className="p-1 hover:bg-red-50 rounded text-red-500"><Trash size={16} /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}