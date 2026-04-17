'use client';
import { useAdmin } from '@/context/AdminContext';
import { addItem } from '@/lib/firestore-helpers';
import { ArrowRight, Columns, Layers, LayoutGrid, Link, Plus, Trash, TrendingUp, Type } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';

const PAGES = [
  { id: 'projects', label: 'Projects', collection: 'projects' },
  { id: 'publications', label: 'Publications', collection: 'publications' },
  { id: 'experience', label: 'Experience', collection: 'experience' },
  { id: 'gallery', label: 'Gallery', collection: 'gallery' },
];

const LAYOUTS = [
  { id: 'grid', label: 'Grid (3 Col)', icon: LayoutGrid },
  { id: 'side-left', label: 'Image Left, Text Right', icon: Columns },
  { id: 'side-right', label: 'Text Left, Image Right', icon: Columns },
  { id: 'list', label: 'Simple List', icon: Layers },
];

export default function SectionWizard({ pageId, onClose }) {
  const { setEditingItem } = useAdmin();
  const [step, setStep] = useState(1);
  const [type, setType] = useState(null);
  const [config, setConfig] = useState({
    title: '',
    layout: 'grid',
    sourcePage: null,
    limit: 3,
    content: '',
    bgColor: '',
    titleAlign: 'Left',
    // NEW: Structured stats config
    stats: [{ type: 'auto', source: 'projects', label: 'Projects' }] 
  });

  const handleNext = () => {
    if (step === 1 && !type) return toast.error("Select a section type");
    if (step === 2) handleCreate();
  };

  const handleCreate = async () => {
    const newSection = {
      pageId,
      type,
      title: config.title,
      bgColor: config.bgColor,
      order: Date.now(),
    };

    if (type === 'linked') {
      newSection.linkedPage = config.sourcePage.id;
      newSection.linkedCollection = config.sourcePage.collection;
      newSection.limit = config.limit;
      newSection.layout = config.layout;
    } else if (type === 'stats') {
      // Save structured stats object as JSON string
      newSection.content = JSON.stringify(config.stats);
    } else {
      newSection.content = config.content;
      newSection.titleAlign = config.titleAlign;
    }

    await addItem('sections', newSection);
    toast.success("Section created!");
    onClose();
  };

  // --- STATS MANAGEMENT FUNCTIONS ---
  const addStat = () => {
    setConfig({
      ...config, 
      stats: [...config.stats, { type: 'auto', source: 'projects', label: 'Projects' }]
    });
  };

  const updateStat = (index, key, value) => {
    const newStats = [...config.stats];
    newStats[index][key] = value;
    // Auto-update label if source changes
    if (key === 'source') {
       const found = PAGES.find(p => p.id === value);
       if(found) newStats[index].label = found.label;
    }
    setConfig({ ...config, stats: newStats });
  };

  const removeStat = (index) => {
    const newStats = config.stats.filter((_, i) => i !== index);
    setConfig({ ...config, stats: newStats });
  };

  return (
    <div className="p-6 bg-white h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">{step === 1 ? "Create Section" : "Configure Section"}</h2>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
      </div>

      {/* Progress */}
      <div className="flex gap-2 mb-8">
        {[1, 2].map((s) => (
          <div key={s} className={`flex-1 h-1 rounded ${s <= step ? 'bg-blue-600' : 'bg-gray-200'}`} />
        ))}
      </div>

      {/* Step 1 */}
      {step === 1 && (
        <div className="space-y-4">
          <button onClick={() => { setType('custom'); setStep(2); }} className="w-full p-4 border-2 rounded-lg text-left hover:border-blue-500 flex items-center gap-4 group">
            <div className="p-3 bg-blue-100 rounded-lg text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors"><Type size={24} /></div>
            <div><h3 className="font-bold text-gray-800">Custom Section</h3><p className="text-sm text-gray-500">Write your own title and text.</p></div>
          </button>

          <button onClick={() => { setType('linked'); setStep(2); }} className="w-full p-4 border-2 rounded-lg text-left hover:border-purple-500 flex items-center gap-4 group">
            <div className="p-3 bg-purple-100 rounded-lg text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors"><Link size={24} /></div>
            <div><h3 className="font-bold text-gray-800">Linked Page Content</h3><p className="text-sm text-gray-500">Show items from Projects, Gallery, etc.</p></div>
          </button>

          <button onClick={() => { setType('stats'); setStep(2); }} className="w-full p-4 border-2 rounded-lg text-left hover:border-green-500 flex items-center gap-4 group">
            <div className="p-3 bg-green-100 rounded-lg text-green-600 group-hover:bg-green-600 group-hover:text-white transition-colors"><TrendingUp size={24} /></div>
            <div><h3 className="font-bold text-gray-800">Stats Strip</h3><p className="text-sm text-gray-500">Auto-count projects or add custom stats.</p></div>
          </button>
        </div>
      )}

      {/* Step 2 */}
      {step === 2 && (
        <div className="space-y-6 flex-1 overflow-y-auto">
          
          {type === 'custom' && (
            <>
              <div>
                <label className="block text-sm font-medium mb-1">Section Title</label>
                <input className="w-full p-2 border rounded-lg" placeholder="e.g. About Me" value={config.title} onChange={(e) => setConfig({...config, title: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Title Alignment</label>
                <select className="w-full p-2 border rounded-lg bg-white" value={config.titleAlign} onChange={(e) => setConfig({...config, titleAlign: e.target.value})}>
                  <option>Left</option><option>Center</option><option>Right</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Content</label>
                <textarea className="w-full p-2 border rounded-lg h-40" placeholder="Markdown supported." value={config.content} onChange={(e) => setConfig({...config, content: e.target.value})} />
              </div>
            </>
          )}

                    {/* NEW: STATS CONFIGURATION */}
          {type === 'stats' && (
            <>
              <div>
                <label className="block text-sm font-medium mb-1">Section Title (Optional)</label>
                <input className="w-full p-2 border rounded-lg" placeholder="e.g. My Achievements" value={config.title} onChange={(e) => setConfig({...config, title: e.target.value})} />
              </div>

              {/* ADDED: Background Color Selector */}
              <div>
                <label className="block text-sm font-medium mb-1">Background Color</label>
                <select 
                  className="w-full p-2 border rounded-lg bg-white text-sm"
                  value={config.bgColor}
                  onChange={(e) => setConfig({...config, bgColor: e.target.value})}
                >
                  <option value="">Default (Theme Primary)</option>
                  <option value="var(--bg-secondary)">Theme Secondary (Gray)</option>
                  <option value="var(--bg-tertiary)">Theme Tertiary</option>
                  <option value="var(--accent-light)">Accent Light</option>
                </select>
              </div>

              <div className="space-y-4">
                <label className="block text-sm font-medium">Stat Items</label>
                
                {config.stats.map((stat, index) => (
                  <div key={index} className="p-3 border rounded-lg bg-gray-50 space-y-3 relative">
                    <button onClick={() => removeStat(index)} className="absolute top-2 right-2 text-gray-400 hover:text-red-500"><Trash size={14} /></button>
                    
                    {/* Type Toggle */}
                    <div className="flex gap-2">
                      <button 
                        onClick={() => updateStat(index, 'type', 'auto')}
                        className={`flex-1 p-2 text-xs rounded border ${stat.type === 'auto' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-white'}`}
                      >Auto Count</button>
                      <button 
                        onClick={() => updateStat(index, 'type', 'custom')}
                        className={`flex-1 p-2 text-xs rounded border ${stat.type === 'custom' ? 'bg-purple-50 border-purple-500 text-purple-700' : 'bg-white'}`}
                      >Custom Value</button>
                    </div>

                    {stat.type === 'auto' ? (
                      <select 
                        value={stat.source} 
                        onChange={(e) => updateStat(index, 'source', e.target.value)}
                        className="w-full p-2 border rounded-lg text-sm bg-white"
                      >
                        {PAGES.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
                      </select>
                    ) : (
                      <input 
                        type="text" 
                        placeholder="Value (e.g. 5+)" 
                        value={stat.value || ''} 
                        onChange={(e) => updateStat(index, 'value', e.target.value)}
                        className="w-full p-2 border rounded-lg text-sm"
                      />
                    )}

                    <input 
                      type="text" 
                      placeholder="Label (e.g. Years Exp)" 
                      value={stat.label} 
                      onChange={(e) => updateStat(index, 'label', e.target.value)}
                      className="w-full p-2 border rounded-lg text-sm"
                    />
                  </div>
                ))}

                <button onClick={addStat} className="w-full py-2 border-2 border-dashed rounded-lg text-sm text-gray-500 hover:border-gray-400 flex items-center justify-center gap-2">
                  <Plus size={16} /> Add Stat
                </button>
              </div>
            </>
          )}

          {type === 'linked' && (
            <>
              <div>
                <label className="block text-sm font-medium mb-2">1. Select Source Page</label>
                <div className="grid grid-cols-2 gap-2">
                  {PAGES.map(p => (
                    <button key={p.id} onClick={() => setConfig({...config, sourcePage: p, title: p.label})}
                      className={`p-3 border rounded-lg text-sm text-center transition-all ${config.sourcePage?.id === p.id ? 'border-purple-500 bg-purple-50 ring-1 ring-purple-500' : 'hover:bg-gray-50'}`}>
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">2. Choose Layout</label>
                <div className="grid grid-cols-2 gap-2">
                  {LAYOUTS.map(l => (
                    <button key={l.id} onClick={() => setConfig({...config, layout: l.id})}
                      className={`p-3 border rounded-lg flex flex-col items-center gap-2 transition-all ${config.layout === l.id ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'}`}>
                      <l.icon size={20} className={config.layout === l.id ? 'text-blue-600' : 'text-gray-400'} />
                      <span className="text-xs">{l.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">3. How many items?</label>
                <input type="number" className="w-20 p-2 border rounded" value={config.limit} onChange={(e) => setConfig({...config, limit: parseInt(e.target.value) || 3})} />
              </div>
            </>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="pt-4 border-t mt-4 flex gap-2">
        {step > 1 && <button onClick={() => setStep(step - 1)} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Back</button>}
        <button onClick={handleNext} className="flex-1 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 flex items-center justify-center gap-2">
          {step === 2 ? 'Create Section' : 'Next'} <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}