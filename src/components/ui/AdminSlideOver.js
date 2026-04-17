'use client';
import { useAdmin } from '@/context/AdminContext';
import { cloudinaryConfig } from '@/lib/cloudinary';
import { db } from '@/lib/firebase';
import { addItem, updateData } from '@/lib/firestore-helpers';
import { Dialog, Transition } from '@headlessui/react';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { Camera, X } from 'lucide-react';
import { Fragment, useEffect, useState } from 'react';
import { HexColorPicker } from 'react-colorful';
import toast from 'react-hot-toast';

// Options for Theme Variables
const THEME_BG_OPTIONS = [
  { label: 'Theme: Primary Background', value: 'var(--bg-primary)' },
  { label: 'Theme: Secondary Background', value: 'var(--bg-secondary)' },
  { label: 'Theme: Accent Light', value: 'var(--accent-light)' },
  { label: 'Theme: Card Background', value: 'var(--card-bg)' },
  { label: 'Custom Color...', value: 'custom' },
];

export default function AdminSlideOver() {
  const { editingItem, setEditingItem } = useAdmin();
  const [projectOptions, setProjectOptions] = useState([]);

  useEffect(() => {
    if (editingItem?.fields.some(f => f.type === 'project-select')) {
      const fetchProjects = async () => {
        const q = query(collection(db, 'projects'), orderBy('title', 'asc'));
        const snap = await getDocs(q);
        setProjectOptions(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      };
      fetchProjects();
    }
  }, [editingItem]);

  if (!editingItem) return null;

  // FIX: Destructure both 'id' and 'docId' from the editing item
  const { collection: colName, id, docId, data, fields } = editingItem;

  const handleSave = async () => {
    const payload = {};
    
    fields.forEach(field => {
      // Special handling for bg-color reads from hidden input
      if (field.type === 'bg-color') {
         const hiddenInput = document.getElementById(`edit-${field.key}-hidden`);
         if (hiddenInput) payload[field.key] = hiddenInput.value.trim();
      } 
      else {
        const el = document.getElementById(`edit-${field.key}`);
        if (el) {
          const val = el.value.trim();
          if (field.type === 'number') {
             payload[field.key] = parseInt(val) || 0;
          } else {
             payload[field.key] = val;
          }
        }
      }
    });

    try {
      // FIX: Use id if available, otherwise use docId
      const documentId = id || docId;
      
      if (documentId) {
        await updateData(`${colName}/${documentId}`, payload);
        toast.success('Saved successfully!');
      } else {
        await addItem(colName, payload);
        toast.success('Created successfully!');
      }
      setEditingItem(null);
    } catch (e) {
      toast.error('Error saving.');
      console.error(e);
    }
  };

  return (
    <Transition.Root show={true} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={() => setEditingItem(null)}>
        <Transition.Child as={Fragment} enter="ease-in-out duration-500" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in-out duration-500" leaveFrom="opacity-100" leaveTo="opacity-0">
          <div className="fixed inset-0 bg-black/50 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
              <Transition.Child as={Fragment} enter="transform transition ease-in-out duration-500 sm:duration-700" enterFrom="translate-x-full" enterTo="translate-x-0" leave="transform transition ease-in-out duration-500 sm:duration-700" leaveFrom="translate-x-0" leaveTo="translate-x-full">
                <Dialog.Panel className="pointer-events-auto w-screen max-w-md">
                  <div className="flex h-full flex-col bg-white shadow-xl">
                    <div className="flex items-center justify-between p-6 border-b">
                      <Dialog.Title className="text-lg font-bold text-gray-900">{id || docId ? 'Edit Item' : 'New Item'}</Dialog.Title>
                      <button onClick={() => setEditingItem(null)} className="rounded-md text-gray-400 hover:text-gray-500"><X className="h-6 w-6" /></button>
                    </div>
                    
                    <div className="relative flex-1 p-6 space-y-4 overflow-y-auto">
                      {fields.map((field) => (
                        <div key={field.key}>
                          <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
                          
                          {/* 1. PROJECT SELECT */}
                          {field.type === 'project-select' && (
                            <select id={`edit-${field.key}`} defaultValue={data?.[field.key] || ''} className="w-full p-2 border rounded-lg text-sm bg-white">
                              <option value="">None (Not Linked)</option>
                              {projectOptions.map(opt => (
                                <option key={opt.id} value={opt.id}>{opt.title}</option>
                              ))}
                            </select>
                          )}

                          {/* 2. BACKGROUND COLOR */}
                          {field.type === 'bg-color' && (
                             <BgColorInput fieldKey={field.key} initialValue={data?.[field.key]} />
                          )}

                          {/* 3. IMAGE UPLOAD */}
                          {field.type === 'image' && (
                            <div className="flex flex-col gap-2">
                              <div className="flex gap-2">
                                <input id={`edit-${field.key}`} type="text" defaultValue={data?.[field.key] || ''} className="flex-1 p-2 border rounded-lg text-sm" />
                                <button 
                                  type="button"
                                  onClick={() => cloudinaryConfig.openWidget((url) => {
                                    const el = document.getElementById(`edit-${field.key}`);
                                    if(el) el.value = url;
                                  })} 
                                  className="p-2 bg-blue-50 text-blue-600 rounded hover:bg-blue-100"
                                >
                                  <Camera size={20} />
                                </button>
                              </div>
                              {data?.[field.key] && <img src={data[field.key]} alt="Preview" className="w-full h-32 object-cover rounded" />}
                            </div>
                          )}

                          {/* 4. STANDARD INPUTS */}
                          {field.type === 'textarea' && (
                            <textarea id={`edit-${field.key}`} defaultValue={data?.[field.key] || ''} rows={4} className="w-full p-2 border rounded-lg text-sm" />
                          )}
                          {field.type === 'number' && (
                            <input id={`edit-${field.key}`} type="number" defaultValue={data?.[field.key] || ''} className="w-full p-2 border rounded-lg text-sm" />
                          )}
                          {field.type === 'select' && (
                            <select id={`edit-${field.key}`} defaultValue={data?.[field.key] || ''} className="w-full p-2 border rounded-lg text-sm bg-white">
                              {field.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                            </select>
                          )}
                          {(!field.type || field.type === 'text') && (
                            <input id={`edit-${field.key}`} type="text" defaultValue={data?.[field.key] || ''} className="w-full p-2 border rounded-lg text-sm" />
                          )}

                        </div>
                      ))}
                    </div>

                    <div className="p-4 border-t bg-gray-50">
                      <button onClick={handleSave} className="w-full py-2 bg-black text-white rounded-lg font-medium hover:bg-gray-800">Save Changes</button>
                    </div>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}

// --- Sub-component for Background Color Logic ---
function BgColorInput({ fieldKey, initialValue }) {
  const getInitialMode = (val) => val?.startsWith('#') ? 'custom' : 'theme';
  
  const [mode, setMode] = useState(getInitialMode(initialValue));
  const [currentValue, setCurrentValue] = useState(initialValue || '');

  useEffect(() => {
    setCurrentValue(initialValue || '');
    setMode(getInitialMode(initialValue));
  }, [initialValue]);

  const handleSelectChange = (e) => {
    const selected = e.target.value;
    if (selected === 'custom') {
      setMode('custom');
      const currentHex = currentValue.startsWith('#') ? currentValue : '#ffffff';
      setCurrentValue(currentHex);
    } else {
      setMode('theme');
      setCurrentValue(selected);
    }
  };

  const handleColorChange = (color) => {
    setCurrentValue(color);
  };

  return (
    <div className="space-y-2">
      {/* HIDDEN INPUT: This is what the form reads. Value is bound to React state. */}
      <input type="hidden" id={`edit-${fieldKey}-hidden`} value={currentValue} readOnly />

      {/* Dropdown */}
      <select 
        value={mode === 'custom' ? 'custom' : currentValue} 
        onChange={handleSelectChange}
        className="w-full p-2 border rounded-lg text-sm bg-white"
      >
        {THEME_BG_OPTIONS.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>

      {/* Color Picker (Only shows if mode is custom) */}
      {mode === 'custom' && (
        <div className="p-2 border rounded-lg">
          <HexColorPicker color={currentValue} onChange={handleColorChange} style={{ width: '100%', height: '100px' }} />
          <input 
            type="text" 
            value={currentValue} 
            onChange={(e) => handleColorChange(e.target.value)}
            className="mt-2 w-full p-1 border rounded text-xs font-mono"
          />
        </div>
      )}
    </div>
  );
}