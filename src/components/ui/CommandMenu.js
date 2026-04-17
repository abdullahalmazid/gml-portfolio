'use client';
import { useAdmin } from '@/context/AdminContext';
import { auth } from '@/lib/firebase';
import { Command } from 'cmdk';
import { signOut } from 'firebase/auth';
import { Eye, Folder, Home, LogOut, Pencil } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function CommandMenu() {
  const [open, setOpen] = useState(false);
  const { editMode, setEditMode, isAdmin } = useAdmin();
  const router = useRouter();

  useEffect(() => {
    const down = (e) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  if (!isAdmin) return null;

  return (
    <Command.Dialog open={open} onOpenChange={setOpen} className="fixed top-[20%] left-1/2 -translate-x-1/2 z-50">
      <Command.Input placeholder="Type a command or search..." />
      <Command.List>
        <Command.Empty>No results found.</Command.Empty>
        <Command.Group heading="Actions">
          <Command.Item onSelect={() => { setEditMode(!editMode); setOpen(false); }}>
            {editMode ? <Eye size={16} /> : <Pencil size={16} />}
            {editMode ? 'Switch to View Mode' : 'Switch to Edit Mode'}
          </Command.Item>
          <Command.Item onSelect={() => { router.push('/admin'); setOpen(false); }}>
            <Folder size={16} /> Go to Dashboard
          </Command.Item>
          <Command.Item onSelect={() => { router.push('/'); setOpen(false); }}>
            <Home size={16} /> Go Home
          </Command.Item>
        </Command.Group>
        <Command.Group heading="Account">
          <Command.Item onSelect={() => { signOut(auth); setOpen(false); }}>
            <LogOut size={16} /> Sign Out
          </Command.Item>
        </Command.Group>
      </Command.List>
    </Command.Dialog>
  );
}