'use client';
import MessagesPanel from '@/components/admin/MessagesPanel';
import PaletteStudio from '@/components/admin/PaletteStudio';
import VisibilityManager from '@/components/admin/VisibilityManager';
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
  Eye, EyeOff,
  FileText,
  Image,
  Inbox,
  LayoutDashboard,
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
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium border transition-all ${themeId === t.id ? 'border-[var(--accent)] bg-[var(--accent-light)]' : 'border-[var(--border)] hover:border-[var(--accent)]'
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
        <p className="text-xs text-[var(--text-muted)] mb-3">
          Manual override. These are not contrast-checked — use Palette Studio above unless you need one specific token changed.
        </p>

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
              <input type="text" value={localColors[editingKey] || ''} onChange={e => setLocalColors({ ...localColors, [editingKey]: e.target.value })}
                className="w-24 px-2 py-1 bg-[var(--bg-primary)] border border-[var(--border)] rounded text-xs font-mono text-[var(--text-primary)] outline-none" />
            </div>
            <HexColorPicker color={localColors[editingKey]} onChange={c => setLocalColors({ ...localColors, [editingKey]: c })} />
          </div>
        )}

        <button onClick={handleApplyCustom} className="w-full py-2 bg-[var(--accent)] text-[var(--accent-contrast)] rounded-lg text-sm font-medium hover:bg-[var(--accent-hover)]">Apply Custom Theme</button>
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
            <input type="text" value={socials[f] || ''} onChange={e => setSocials({ ...socials, [f]: e.target.value })}
              className="w-full px-3 py-2 bg-[var(--bg-primary)] border border-[var(--border)] rounded-lg text-sm outline-none focus:border-[var(--accent)]" />
          </div>
        ))}
      </div>
      <button onClick={handleSave} className="mt-4 w-full py-2 bg-[var(--accent)] text-[var(--accent-contrast)] rounded-lg text-sm">Save Links</button>
    </div>
  );
}

// --- MAIN DASHBOARD ---
export default function AdminDashboard() {
  const { user, loading: al } = useAuth();
  const { editMode, setEditMode, showFieldPaths, setShowFieldPaths } = useAdmin();
  const { themeId, customColors, setTheme, setCustomColors } = useTheme();
  const [tab, setTab] = useState('overview');

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

  const unread = msg.filter(m => !m.read).length;

  const TABS = [
    { key: 'overview', label: 'Overview', icon: LayoutDashboard },
    { key: 'messages', label: 'Messages', icon: Inbox, badge: unread },
    { key: 'appearance', label: 'Appearance', icon: Palette },
    { key: 'visibility', label: 'Visibility', icon: EyeOff },
    { key: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <section className="container mx-auto px-6 py-12">
      <MotionDiv>
        <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-1">Admin Dashboard</h1>
            <p className="text-[var(--text-secondary)]">Manage content, appearance and settings.</p>
          </div>

          {/* Edit mode is the control used most often, so it lives in the header
              rather than inside a tab. */}
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setEditMode(!editMode)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${editMode ? 'bg-amber-500 text-black' : 'bg-[var(--bg-secondary)] text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]'}`}>
              {editMode ? <><Pencil size={16} /> Edit Mode ON</> : <><Eye size={16} /> View Mode</>}
            </button>
            <button onClick={() => setShowFieldPaths(!showFieldPaths)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${showFieldPaths ? 'bg-blue-500 text-white' : 'bg-[var(--bg-secondary)] text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]'}`}>
              <Code size={16} /> {showFieldPaths ? 'Paths ON' : 'Show Paths'}
            </button>
          </div>
        </div>
      </MotionDiv>

      {/* TABS */}
      <div className="flex gap-1 overflow-x-auto border-b border-[var(--border)] mb-8 -mx-6 px-6">
        {TABS.map(({ key, label, icon: Icon, badge }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold whitespace-nowrap border-b-2 -mb-px transition-colors ${tab === key
                ? 'border-[var(--accent)] text-[var(--accent)]'
                : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
          >
            <Icon size={16} /> {label}
            {badge > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-[var(--accent)] text-[var(--accent-contrast)] text-[10px] font-bold">
                {badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <MotionDiv>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            <StatCard icon={Briefcase} label="Experience" count={exp.length} />
            <StatCard icon={Code} label="Projects" count={proj.length} />
            <StatCard icon={FileText} label="Publications" count={pub.length} />
            <StatCard icon={Image} label="Gallery" count={gal.length} />
            <StatCard icon={Layers} label="Sections" count={sec.length} />
            <StatCard icon={Inbox} label="Messages" count={msg.length} />
          </div>

          <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-xl p-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--text-primary)] mb-2">
              Editing your pages
            </h3>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
              Turn on Edit Mode, then visit any page. Hover a section for its toolbar
              — settings, hide, duplicate, reorder, delete — or use the insert lines
              between sections to add a new one. Click any text or image to edit it
              in place.
            </p>
          </div>
        </MotionDiv>
      )}

      {tab === 'messages' && (
        <MotionDiv><MessagesPanel /></MotionDiv>
      )}

      {tab === 'appearance' && (
        <MotionDiv className="space-y-6">
          <PaletteStudio />
          <ThemePanel themeId={themeId} customColors={customColors} setTheme={setTheme} setCustomColors={setCustomColors} />
        </MotionDiv>
      )}

      {tab === 'visibility' && (
        <MotionDiv><VisibilityManager /></MotionDiv>
      )}

      {tab === 'settings' && (
        <MotionDiv className="max-w-lg"><SocialLinksEditor /></MotionDiv>
      )}
    </section>
  );
}