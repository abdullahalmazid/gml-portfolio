'use client';
import { useAdmin } from '@/context/AdminContext';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { Code, Eye, LogOut, Pencil, Settings } from 'lucide-react';
import Link from 'next/link';

export default function AdminToolbar() {
  const { isAdmin, editMode, setEditMode, showFieldPaths, setShowFieldPaths } = useAdmin();
  if (!isAdmin) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-auto">
      {/* Glassmorphism Background Layer */}
      <div className="absolute inset-0 bg-gray-900/80 backdrop-blur-xl rounded-full shadow-2xl shadow-black/30 border border-white/10" />
      
      {/* Content Layer */}
      <div className="relative flex items-center gap-1 px-2 py-2 text-white">
        
        {/* Dashboard Link */}
        <Link 
          href="/admin" 
          className="group flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 transition-all duration-200"
        >
          <Settings size={16} className="group-hover:rotate-90 transition-transform duration-300" />
          <span className="hidden sm:inline">Dashboard</span>
        </Link>

        <div className="w-px h-6 bg-white/10" />

        {/* Edit Mode Toggle - The Main Action */}
        <button 
          onClick={() => setEditMode(!editMode)} 
          className={`relative flex items-center gap-2 px-5 py-2 rounded-full text-sm font-semibold transition-all duration-300 ease-out
            ${editMode 
              ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/40' 
              : 'bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white'
            }`
          }
        >
          {editMode ? <Eye size={16} /> : <Pencil size={16} />}
          {editMode ? 'View Mode' : 'Edit Mode'}
          
          {/* Ping Animation when Active */}
          {editMode && (
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
            </span>
          )}
        </button>

        {/* Show Paths Toggle (Secondary) */}
        {editMode && (
          <button 
            onClick={() => setShowFieldPaths(!showFieldPaths)} 
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200
              ${showFieldPaths 
                ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30' 
                : 'bg-white/5 text-gray-300 hover:bg-white/10'
              }`
            }
          >
            <Code size={16} />
            <span className="hidden sm:inline">Paths</span>
          </button>
        )}

        <div className="w-px h-6 bg-white/10" />

        {/* Logout Button */}
        <button 
          onClick={() => signOut(auth)} 
          className="group flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200"
        >
          <LogOut size={16} className="group-hover:-translate-x-0.5 transition-transform" />
          <span className="hidden sm:inline">Logout</span>
        </button>

      </div>
    </div>
  );
}