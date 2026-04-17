'use client';
import MotionDiv from '@/components/ui/MotionDiv';
import { useAdmin } from '@/context/AdminContext';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useCollection } from '@/hooks/useCollection';
import { useSettings } from '@/hooks/useSettings';
import { updateSettings } from '@/lib/firestore-helpers';
import { COLOR_KEYS, parseCommaSeparatedColors, PRESET_THEMES } from '@/lib/themes';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
// FIX: Changed to lucide-react icons
import {
  Briefcase, Code,
  Eye,
  FileText,
  Image,
  Layers, Palette,
  Pencil,
  Settings
} from 'lucide-react';
import { HexColorPicker } from 'react-colorful';

// --- STAT CARD COMPONENT ---
function StatCard({ icon: Icon, label, count }) {
  return (
    <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-xl p-5 flex items-center gap-4">
      <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-[var(--accent-light)]">
        <Icon className="text-xl text-[var(--accent)]" />
      </div>
      <div>
        <p className="text-2xl font-bold text-[var(--text-primary)]">{count}</p>
        <p className="text-xs text-[var(--text-secondary)]">{label}</p>
      </div>
    </div>
  );
}

// --- THEME PANEL COMPONENT ---
function ThemePanel({ themeId, customColors, setTheme, setCustomColors }) {
  const [editingKey, setEditingKey] = useState(null);
  const [localColors, setLocalColors] = useState(customColors || PRESET_THEMES[0].colors);
  const [bulkInput, setBulkInput] = useState('');

  const handlePresetClick = (preset) => {
    setTheme(preset.id);
    setLocalColors({ ...preset.colors });
    setBulkInput(COLOR_KEYS.map(k => preset.colors[k]).join(', '));
  };

  const handleApplyCustom = () => {
    setCustomColors(localColors);
    toast.success('Custom theme applied!');
  };

  const handleBulkApply = () => {
    const parsed = parseCommaSeparatedColors(bulkInput);
    if (!parsed) {
      toast.error(`Need exactly ${COLOR_KEYS.length} comma-separated hex values.`);
      return;
    }
    setLocalColors(parsed);
    setCustomColors(parsed);
    toast.success('Theme applied from codes!');
  };

  const colorLabels = {
    '--bg-primary': 'BG', '--bg-secondary': 'BG2', '--bg-tertiary': 'BG3',
    '--text-primary': 'Text', '--text-secondary': 'Text2', '--text-muted': 'Muted',
    '--accent': 'Accent', '--accent-hover': 'Accent2', '--accent-light': 'AccentBG',
    '--border': 'Border', '--card-bg': 'Card',
  };

  return (
    <div className="space-y-6">
      {/* Presets */}
      <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-xl p-6">
        <h3 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider mb-4 flex items-center gap-2">
          <Palette className="text-[var(--accent)]" size={16} /> Preset Themes
        </h3>
        <p className="text-xs text-[var(--text-muted)] mb-3">Click a preset to apply it and load its colors into the editor below.</p>
        <div className="grid grid-cols-2 gap-2">
          {PRESET_THEMES.map(t => (
            <button key={t.id} onClick={() => handlePresetClick(t)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium border transition-all ${
                themeId === t.id ? 'border-[var(--accent)] bg-[var(--accent-light)]' : 'border-[var(--border)] hover:border-[var(--accent)]'
              }`}>
              <div className="flex gap-0.5 shrink-0">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: t.colors['--bg-primary'], border: '1px solid #888' }} />
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: t.colors['--accent'] }} />
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: t.colors['--text-primary'] }} />
              </div>
              <span className="text-[var(--text-primary)]">{t.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Custom Color Editor */}
      <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-xl p-6">
        <h3 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider mb-4 flex items-center gap-2">
          <Palette className="text-[var(--accent)]" size={16} /> Custom Colors
        </h3>

        <div className="grid grid-cols-4 gap-2 mb-4">
          {COLOR_KEYS.map(key => (
            <div key={key} className="space-y-1">
              <p className="text-[9px] text-[var(--text-muted)] font-mono truncate">{colorLabels[key]}</p>
              <button onClick={() => setEditingKey(editingKey === key ? null : key)}
                className={`w-full h-7 rounded-lg border cursor-pointer transition-all ${editingKey === key ? 'ring-2 ring-[var(--accent)]' : 'border-[var(--border)] hover:ring-1 hover:ring-[var(--accent)]'}`}
                style={{ backgroundColor: localColors[key] || '#000' }} title={`${key}: ${localColors[key]}`} />
            </div>
          ))}
        </div>

        {editingKey && (
          <div className="mb-4 p-3 bg-[var(--bg-secondary)] rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-[var(--text-secondary)] font-mono">{editingKey}</p>
              <input type="text" value={localColors[editingKey] || ''} onChange={e => setLocalColors({...localColors, [editingKey]: e.target.value})}
                className="w-24 px-2 py-1 bg-[var(--bg-primary)] border border-[var(--border)] rounded text-xs font-mono text-[var(--text-primary)] outline-none" />
            </div>
            <HexColorPicker color={localColors[editingKey]} onChange={c => setLocalColors({...localColors, [editingKey]: c})} />
          </div>
        )}

        <button onClick={handleApplyCustom} className="w-full py-2 bg-[var(--accent)] text-white rounded-lg text-sm font-medium hover:bg-[var(--accent-hover)]">Apply Custom Theme</button>
      </div>

      {/* Bulk hex input */}
      <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-xl p-6">
        <h3 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider mb-2">Quick Apply (Bulk Hex)</h3>
        <p className="text-[10px] text-[var(--text-muted)] mb-3">Paste {COLOR_KEYS.length} hex values, comma-separated: BG, BG2, BG3, Text, Text2, Muted, Accent, AccentHover, AccentBG, Border, Card</p>
        <textarea value={bulkInput} onChange={e => setBulkInput(e.target.value)} rows={2} placeholder="#fafaf9, #f5f5f4, ..."
          className="w-full px-3 py-2 bg-[var(--bg-primary)] border border-[var(--border)] rounded-lg text-xs font-mono outline-none focus:border-[var(--accent)] resize-none" />
        <button onClick={handleBulkApply} className="mt-2 w-full py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700">Apply from Codes</button>
      </div>
    </div>
  );
}

// --- SOCIAL LINKS EDITOR ---
function SocialLinksEditor() {
  const { data } = useSettings('footer');
  const [socials, setSocials] = useState({});
  
  useEffect(() => {
    if (data?.socials) setSocials(data.socials);
  }, [data]);

  const fields = ['github', 'linkedin', 'facebook', 'youtube', 'email'];

  const handleSave = async () => {
    try {
      await updateSettings('footer', { socials });
      toast.success('Saved!');
    } catch { toast.error('Failed.'); }
  };

  return (
    <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-xl p-6">
      <h3 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider mb-4 flex items-center gap-2">
        <Settings className="text-[var(--accent)]" size={16} /> Social Links
      </h3>
      <div className="space-y-3">
        {fields.map(f => (
          <div key={f}>
            <label className="block text-xs text-[var(--text-muted)] mb-1 capitalize">{f}</label>
            <input type="text" value={socials[f] || ''} onChange={e => setSocials({...socials, [f]: e.target.value})}
              className="w-full px-3 py-2 bg-[var(--bg-primary)] border border-[var(--border)] rounded-lg text-sm outline-none focus:border-[var(--accent)]" />
          </div>
        ))}
      </div>
      <button onClick={handleSave} className="mt-4 w-full py-2 bg-[var(--accent)] text-white rounded-lg text-sm">Save Links</button>
    </div>
  );
}

// --- MAIN DASHBOARD ---
export default function AdminDashboard() {
  const { user, loading: al } = useAuth();
  const { editMode, setEditMode, showFieldPaths, setShowFieldPaths } = useAdmin();
  const { themeId, customColors, setTheme, setCustomColors } = useTheme();
  
  // Stats
  const { items: exp } = useCollection('experience');
  const { items: proj } = useCollection('projects');
  const { items: pub } = useCollection('publications');
  const { items: gal } = useCollection('gallery');
  const { items: msg } = useCollection('messages');
  const { items: sec } = useCollection('sections');
  
  const router = useRouter();

  useEffect(() => {
    if (!al && !user) router.push('/login');
  }, [user, al, router]);

  if (al || !user) return null;

  return (
    <section className="container mx-auto px-6 py-12">
      <MotionDiv>
        <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">Admin Dashboard</h1>
        <p className="text-[var(--text-secondary)] mb-8">Manage content, themes, and settings.</p>
      </MotionDiv>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-10">
        <StatCard icon={Briefcase} label="Experience" count={exp.length} />
        <StatCard icon={Code} label="Projects" count={proj.length} />
        <StatCard icon={FileText} label="Publications" count={pub.length} />
        <StatCard icon={Image} label="Gallery" count={gal.length} />
        <StatCard icon={Layers} label="Sections" count={sec.length} />
        <StatCard icon={FileText} label="Messages" count={msg.length} />
      </div>

      {/* Controls */}
      <MotionDiv delay={0.1} className="mb-10">
        <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-xl p-6">
          <h3 className="text-sm font-bold uppercase tracking-wider mb-4">Edit Controls</h3>
          <div className="flex flex-wrap gap-3">
            <button onClick={() => setEditMode(!editMode)} 
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${editMode ? 'bg-amber-500 text-black' : 'bg-[var(--bg-secondary)]'}`}>
              {editMode ? <><Pencil size={16} /> Edit Mode ON</> : <><Eye size={16} /> View Mode</>}
            </button>
            <button onClick={() => setShowFieldPaths(!showFieldPaths)} 
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${showFieldPaths ? 'bg-blue-500 text-white' : 'bg-[var(--bg-secondary)]'}`}>
              <Code size={16} /> {showFieldPaths ? 'Paths ON' : 'Show Paths'}
            </button>
          </div>
          <p className="text-xs text-[var(--text-muted)] mt-3">
            Edit Mode: click any text/image on any page to edit inline. Paths: see Firestore field paths.
          </p>
        </div>
      </MotionDiv>

      {/* Theme + Social */}
      <div className="grid md:grid-cols-2 gap-8 mb-10">
        <MotionDiv delay={0.2}>
          <ThemePanel themeId={themeId} customColors={customColors} setTheme={setTheme} setCustomColors={setCustomColors} />
        </MotionDiv>
        <MotionDiv delay={0.3}>
          <SocialLinksEditor />
        </MotionDiv>
      </div>

      {/* Messages */}
      <MotionDiv delay={0.4}>
        <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-xl p-6">
          <h3 className="text-sm font-bold uppercase tracking-wider mb-4">Recent Messages</h3>
          {msg.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)]">No messages yet.</p>
          ) : (
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {msg.slice(0, 10).map(m => (
                <div key={m.id} className="p-3 bg-[var(--bg-secondary)] rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{m.name}</span>
                    <span className="text-xs text-[var(--text-muted)]">{m.email}</span>
                  </div>
                  {m.subject && <p className="text-xs text-[var(--accent)] mb-1">{m.subject}</p>}
                  <p className="text-xs text-[var(--text-secondary)] line-clamp-2">{m.message}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </MotionDiv>
    </section>
  );
}