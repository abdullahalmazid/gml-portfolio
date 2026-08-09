'use client';
import { useAdmin } from '@/context/AdminContext';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Code,
  Eye,
  GripVertical,
  LogOut,
  Pencil,
  Settings,
} from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

const STORAGE_KEY = 'admin-toolbar:v1';
const MARGIN = 24;
const DRAG_THRESHOLD = 4;

const clamp = (v, min, max) => Math.min(Math.max(v, min), max);

export default function AdminToolbar() {
  const { isAdmin, editMode, setEditMode, showFieldPaths, setShowFieldPaths } = useAdmin();

  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [side, setSide] = useState('bottom');
  const [collapsed, setCollapsed] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [ready, setReady] = useState(false);

  const rootRef = useRef(null);
  const drag = useRef({ dx: 0, dy: 0, moved: false });

  const isVertical = side === 'left' || side === 'right';

  /* ---------- keep the bar pinned + inside the viewport ---------- */
  const settle = useCallback(
    (nextSide = side) => {
      const el = rootRef.current;
      if (!el) return;
      const { width: w, height: h } = el.getBoundingClientRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;

      setPos((p) => {
        let { x, y } = p;
        if (nextSide === 'left') x = MARGIN;
        if (nextSide === 'right') x = vw - w - MARGIN;
        if (nextSide === 'top') y = MARGIN;
        if (nextSide === 'bottom') y = vh - h - MARGIN;
        return {
          x: clamp(x, MARGIN, Math.max(MARGIN, vw - w - MARGIN)),
          y: clamp(y, MARGIN, Math.max(MARGIN, vh - h - MARGIN)),
        };
      });
    },
    [side]
  );

  /* ---------- restore saved state ---------- */
  useLayoutEffect(() => {
    if (!isAdmin) return;
    let saved = null;
    try {
      saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    } catch {
      saved = null;
    }

    const el = rootRef.current;
    const rect = el?.getBoundingClientRect() || { width: 0, height: 0 };

    if (saved?.side) {
      setSide(saved.side);
      setCollapsed(!!saved.collapsed);
      setPos({ x: saved.x ?? 0, y: saved.y ?? 0 });
    } else {
      setPos({
        x: (window.innerWidth - rect.width) / 2,
        y: window.innerHeight - rect.height - MARGIN,
      });
    }
    setReady(true);
  }, [isAdmin]);

  /* ---------- re-settle whenever the shape changes ---------- */
  useLayoutEffect(() => {
    if (ready) settle();
  }, [ready, side, collapsed, editMode, showFieldPaths, settle]);

  useEffect(() => {
    const onResize = () => settle();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [settle]);

  /* ---------- persist ---------- */
  useEffect(() => {
    if (!ready || dragging) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...pos, side, collapsed }));
    } catch {
      /* storage unavailable — ignore */
    }
  }, [ready, dragging, pos, side, collapsed]);

  /* ---------- drag ---------- */
  const nearestSide = () => {
    const r = rootRef.current.getBoundingClientRect();
    const d = {
      left: r.left,
      right: window.innerWidth - r.right,
      top: r.top,
      bottom: window.innerHeight - r.bottom,
    };
    return Object.keys(d).reduce((a, b) => (d[b] < d[a] ? b : a));
  };

  const onPointerDown = (e) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    const r = rootRef.current.getBoundingClientRect();
    drag.current = { dx: e.clientX - r.left, dy: e.clientY - r.top, moved: false };
    setDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e) => {
    if (!dragging) return;
    const x = e.clientX - drag.current.dx;
    const y = e.clientY - drag.current.dy;
    if (Math.abs(x - pos.x) > DRAG_THRESHOLD || Math.abs(y - pos.y) > DRAG_THRESHOLD) {
      drag.current.moved = true;
    }
    setPos({ x, y });
  };

  const onPointerUp = (e) => {
    if (!dragging) return;
    setDragging(false);
    e.currentTarget.releasePointerCapture?.(e.pointerId);
    const next = nearestSide();
    setSide(next);
    settle(next);
  };

  const onHandleKeyDown = (e) => {
    const step = e.shiftKey ? 60 : 20;
    const map = {
      ArrowLeft: [-step, 0],
      ArrowRight: [step, 0],
      ArrowUp: [0, -step],
      ArrowDown: [0, step],
    };
    if (!map[e.key]) return;
    e.preventDefault();
    const [dx, dy] = map[e.key];
    setPos((p) => ({ x: p.x + dx, y: p.y + dy }));
    requestAnimationFrame(() => {
      const next = nearestSide();
      setSide(next);
      settle(next);
    });
  };

  if (!isAdmin) return null;

  const dragProps = {
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel: onPointerUp,
    style: { touchAction: 'none' },
  };

  const CollapseIcon = { left: ChevronLeft, right: ChevronRight, top: ChevronUp, bottom: ChevronDown }[side];
  const ExpandIcon = { left: ChevronRight, right: ChevronLeft, top: ChevronDown, bottom: ChevronUp }[side];

  const tabRadius = {
    left: 'rounded-r-2xl rounded-l-md',
    right: 'rounded-l-2xl rounded-r-md',
    top: 'rounded-b-2xl rounded-t-md',
    bottom: 'rounded-t-2xl rounded-b-md',
  }[side];

  const label = (text) => (isVertical ? null : <span className="hidden sm:inline">{text}</span>);

  return (
    <div
      ref={rootRef}
      className={`fixed z-50 select-none ${ready ? 'opacity-100' : 'opacity-0'} ${dragging ? 'cursor-grabbing transition-none' : 'transition-[left,top,opacity] duration-300 ease-out'
        }`}
      style={{ left: pos.x, top: pos.y }}
    >
      {collapsed ? (
        /* ---------------- Collapsed tab ---------------- */
        <button
          {...dragProps}
          onClick={() => !drag.current.moved && setCollapsed(false)}
          onKeyDown={onHandleKeyDown}
          aria-label="Expand admin toolbar"
          title="Expand (drag to move)"
          className={`group relative flex items-center gap-1.5 border border-white/10 bg-gray-900/80 px-3 py-3 text-gray-300 shadow-2xl shadow-black/30 backdrop-blur-xl transition-colors hover:text-white ${tabRadius} ${isVertical ? 'flex-col' : 'flex-row'
            }`}
        >
          <Settings size={16} className="transition-transform duration-300 group-hover:rotate-90" />
          <ExpandIcon size={14} className="opacity-60" />
          {editMode && (
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-amber-500" />
            </span>
          )}
        </button>
      ) : (
        /* ---------------- Expanded toolbar ---------------- */
        <div className="relative">
          <div className="absolute inset-0 rounded-full border border-white/10 bg-gray-900/80 shadow-2xl shadow-black/30 backdrop-blur-xl" />

          <div
            className={`relative flex items-center gap-1 p-2 text-white ${isVertical ? 'flex-col' : 'flex-row'
              }`}
          >
            {/* Drag handle */}
            <div
              {...dragProps}
              onKeyDown={onHandleKeyDown}
              role="button"
              tabIndex={0}
              aria-label="Move toolbar (arrow keys supported)"
              title="Drag to move"
              className="flex cursor-grab items-center justify-center rounded-full p-1.5 text-gray-500 hover:bg-white/5 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 active:cursor-grabbing"
            >
              <GripVertical size={16} className={isVertical ? 'rotate-90' : ''} />
            </div>

            {/* Dashboard */}
            <Link
              href="/admin"
              title="Dashboard"
              className="group flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium text-gray-300 transition-all duration-200 hover:bg-white/5 hover:text-white"
            >
              <Settings size={16} className="transition-transform duration-300 group-hover:rotate-90" />
              {label('Dashboard')}
            </Link>

            <div className={isVertical ? 'h-px w-6 bg-white/10' : 'h-6 w-px bg-white/10'} />

            {/* Edit mode */}
            <button
              onClick={() => setEditMode(!editMode)}
              title={editMode ? 'Switch to view mode' : 'Switch to edit mode'}
              className={`relative flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all duration-300 ease-out ${editMode
                  ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/40'
                  : 'bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white'
                }`}
            >
              {editMode ? <Eye size={16} /> : <Pencil size={16} />}
              {label(editMode ? 'View Mode' : 'Edit Mode')}
              {editMode && (
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
                  <span className="relative inline-flex h-3 w-3 rounded-full bg-amber-500" />
                </span>
              )}
            </button>

            {/* Field paths */}
            {editMode && (
              <button
                onClick={() => setShowFieldPaths(!showFieldPaths)}
                title="Toggle field paths"
                className={`flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium transition-all duration-200 ${showFieldPaths
                    ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                    : 'bg-white/5 text-gray-300 hover:bg-white/10'
                  }`}
              >
                <Code size={16} />
                {label('Paths')}
              </button>
            )}

            <div className={isVertical ? 'h-px w-6 bg-white/10' : 'h-6 w-px bg-white/10'} />

            {/* Logout */}
            <button
              onClick={() => signOut(auth)}
              title="Logout"
              className="group flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium text-gray-400 transition-all duration-200 hover:bg-red-500/10 hover:text-red-400"
            >
              <LogOut size={16} className="transition-transform group-hover:-translate-x-0.5" />
              {label('Logout')}
            </button>

            {/* Collapse */}
            <button
              onClick={() => setCollapsed(true)}
              title="Collapse toolbar"
              aria-label="Collapse admin toolbar"
              className="flex items-center justify-center rounded-full p-1.5 text-gray-500 transition-colors hover:bg-white/5 hover:text-white"
            >
              <CollapseIcon size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}