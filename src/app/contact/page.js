'use client';
import EditableText from '@/components/editables/EditableText';
import PageHero from '@/components/pages/PageHero';
import MotionDiv from '@/components/ui/MotionDiv';
import { useAdmin } from '@/context/AdminContext';
import { useTheme } from '@/context/ThemeContext';
import { addItem, useDoc } from '@/lib/firestore-helpers';
import { Info, Mail, Map, MapPin, Phone, Send, Settings } from 'lucide-react';
import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';

// 1. Define Editable Fields (Includes Map URL)
const FIELDS = [
  { key: 'heroTitle', label: 'Page Title' },
  { key: 'heroSubtitle', label: 'Subtitle' },
  { key: 'mapEmbedUrl', label: 'Google Maps Embed URL', type: 'text' }, // Added type: 'text'
  { key: 'infoTitle', label: 'Info Section Title' },
];

export default function ContactPage() {
  const { data, loading } = useDoc('pages/contact');
  const { data: footerData } = useDoc('settings/footer');
  const { editMode, setEditingItem } = useAdmin();
  const { customColors } = useTheme();
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
  const [sending, setSending] = useState(false);

  // --- Neumorphism Style Helpers ---
  const hexToRgb = (hex) => {
    if (!hex) return { r: 0, g: 0, b: 0 };
    const clean = hex.replace('#', '').trim();
    if (clean.length !== 6) return { r: 0, g: 0, b: 0 };
    return {
      r: parseInt(clean.slice(0, 2), 16),
      g: parseInt(clean.slice(2, 4), 16),
      b: parseInt(clean.slice(4, 6), 16),
    };
  };

  const withAlpha = (hex, alpha) => {
    const rgb = hexToRgb(hex);
    return `rgba(${rgb.r},${rgb.g},${rgb.b},${alpha})`;
  };

  // Determine if we are in dark mode based on background color luminance
  const isDark = useMemo(() => {
    const hex = customColors?.['--bg-primary'] || '#ffffff';
    const rgb = hexToRgb(hex);
    const luminance = 0.2126 * rgb.r + 0.7152 * rgb.g + 0.0722 * rgb.b;
    return luminance < 140;
  }, [customColors]);

  // Dynamic Colors
  const bgColor = customColors?.['--bg-primary'] || '#ffffff';
  const accentColor = customColors?.['--accent'] || '#000000';
  
  const neuroBg = isDark 
    ? withAlpha(bgColor, 1) 
    : withAlpha(accentColor, 0.05);
    
  const neuroShadow = isDark 
    ? `8px 8px 16px ${withAlpha(bgColor, 0.5)}, -8px -8px 16px ${withAlpha(accentColor, 0.15)}`
    : `8px 8px 16px ${withAlpha(accentColor, 0.15)}, -8px -8px 16px ${withAlpha(bgColor, 0.8)}`;

  // Form Submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      toast.error('Please fill required fields.');
      return;
    }
    setSending(true);
    try {
      await addItem('messages', formData);
      toast.success('Message sent successfully!');
      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch (err) {
      toast.error('Failed to send message.');
    } finally {
      setSending(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  const mapEmbedUrl = data?.mapEmbedUrl || '';
  const address = footerData?.contactLocation || data?.address || '';

  return (
    <main>
      <PageHero pageId="contact" data={data} />

      {/* 2. Add Settings Button for Edit Mode */}
      {editMode && (
        <div className="container mx-auto px-6 pt-6 flex justify-end">
          <button 
            onClick={() => setEditingItem({ collection: 'pages', docId: 'contact', data, fields: FIELDS })}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium shadow-lg hover:bg-blue-700 transition-colors"
          >
            <Settings size={16} /> Edit Page Settings
          </button>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-6 py-16 grid grid-cols-1 lg:grid-cols-5 gap-12">
        
        {/* --- Left Column: Info --- */}
        <div className="lg:col-span-2 space-y-6">
          <MotionDiv>
            <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">
              {editMode ? (
                <EditableText collection="pages" docId="contact" fieldPath="infoTitle" value={data?.infoTitle || "Get In Touch"} tag="span" />
              ) : ( data?.infoTitle || "Get In Touch" )}
            </h2>
          </MotionDiv>

          {/* Contact Details */}
          {[
            { icon: MapPin, label: 'Address', value: address },
            { icon: Mail, label: 'Email', value: footerData?.contactEmail || data?.email, href: `mailto:${footerData?.contactEmail || data?.email}` },
            { icon: Phone, label: 'Phone', value: footerData?.contactPhone || data?.phone, href: `tel:${footerData?.contactPhone || data?.phone}` },
          ].filter(item => item.value).map((item, i) => (
            <MotionDiv key={i} delay={i * 0.1} className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-text1)] shrink-0">
                <item.icon size={18} />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-0.5">{item.label}</p>
                {item.href ? (
                  <a href={item.href} className="text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors">{item.value}</a>
                ) : (
                  <p className="text-[var(--text-secondary)]">{item.value}</p>
                )}
              </div>
            </MotionDiv>
          ))}

          {/* Map Section */}
          <MotionDiv delay={0.3} className="mt-6 rounded-2xl p-4 border border-[var(--border)] bg-[var(--card-bg)]">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-text1)] flex items-center justify-center">
                <Map size={16} />
              </div>
              <span className="font-bold text-xs uppercase tracking-wider text-[var(--text-muted)]">Location</span>
            </div>

            

            {mapEmbedUrl ? (
              <iframe
                src={mapEmbedUrl}
                width="100%"
                height="220"
                style={{ border: 0, borderRadius: '12px' }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            ) : (
              <div className="h-[140px] flex flex-col items-center justify-center bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg text-center p-4">
                <Info className="text-[var(--text-muted)] mb-2" size={24} />
                <p className="text-xs text-[var(--text-muted)]">Map link not available.</p>
                {address && (
                  <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`} target="_blank" rel="noreferrer"
                    className="mt-2 text-xs text-[var(--accent)] underline">Open in Google Maps</a>
                )}
              </div>
            )}
          </MotionDiv>
        </div>

        {/* --- Right Column: Form --- */}
        <div className="lg:col-span-3">
          <MotionDiv delay={0.2}>
            <div 
              className="rounded-[28px] p-8 border transition-all duration-300"
              style={{ 
                background: neuroBg, 
                boxShadow: neuroShadow,
                borderColor: 'var(--border)'
              }}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-11 h-11 rounded-2xl flex items-center justify-center bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-text1)]">
                  <Send size={18} />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Direct Contact</p>
                  <p className="text-sm text-[var(--text-secondary)]">Send your query and we will respond soon.</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input 
                    type="text" placeholder="Your Name" required
                    value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border)] outline-none focus:border-[var(--accent)] text-sm"
                  />
                  <input 
                    type="email" placeholder="Your Email" required
                    value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border)] outline-none focus:border-[var(--accent)] text-sm"
                  />
                </div>
                <input 
                  type="text" placeholder="Subject"
                  value={formData.subject} onChange={(e) => setFormData({...formData, subject: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border)] outline-none focus:border-[var(--accent)] text-sm"
                />
                <textarea 
                  rows={5} placeholder="Your Message..." required
                  value={formData.message} onChange={(e) => setFormData({...formData, message: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border)] outline-none focus:border-[var(--accent)] text-sm resize-none"
                />
                <button 
                  type="submit" disabled={sending}
                  className="w-full py-3 bg-[var(--bg-secondary)] text-[var(--text-text1)] border border-[var(--border)] rounded-xl font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {sending ? 'Sending...' : 'Send Message'}
                </button>
              </form>
            </div>
          </MotionDiv>
        </div>
      </div>
    </main>
  );
}