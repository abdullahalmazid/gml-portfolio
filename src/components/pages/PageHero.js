'use client';

import EditableText from '@/components/editables/EditableText';
import { useAdmin } from '@/context/AdminContext';
import { useCallback, useEffect, useRef } from 'react';
import styles from './pagehero.module.css';

/* ── easing ── */
const easeInOut = t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
const easeIn    = t => t * t * t;
const lerp      = (a, b, t) => a + (b - a) * t;

function cssVar(name) {
  if (typeof window === 'undefined') return '#000';
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || '#000';
}

function tween(from, to, duration, easeFn, onUpdate, onDone) {
  const start = performance.now();
  function tick(now) {
    const raw = Math.min((now - start) / duration, 1);
    onUpdate(lerp(from, to, easeFn(raw)), raw);
    if (raw < 1) requestAnimationFrame(tick);
    else onDone && onDone();
  }
  requestAnimationFrame(tick);
}

/*
 * CHIBI CAT — kawaii tabby style, theme-aware colors
 * ────────────────────────────────────────────────────
 * ViewBox  : 0 0 72 60
 * Feet y   : 60  (walk baseline)
 * Head top : 0   (ear tips — always fully visible)
 *
 * Color mapping (all from existing theme variables):
 * Body fill        → --bg-secondary    (card surface)
 * Belly / muzzle   → --bg-primary      (lightest bg)
 * Outlines/stripes → --text-secondary  (mid tone)
 * Inner ear        → --accent-light    (soft tint)
 * Nose / cheeks    → --accent          (theme accent)
 * Eyes iris        → --text-primary    (darkest)
 * Border detail    → --border
 *
 * Pencil tip in SVG space ≈ (10, 61)
 */
function CatSVG({ refs }) {
  const {
    svgRef, tailRef, bodyRef,
    legFLRef, legFRRef, legBLRef, legBRRef,
    earLRef, earRRef, eyeLRef, eyeRRef,
    armRef, headRef,
  } = refs;

  return (
    <svg
      ref={svgRef}
      width="72" height="60"
      viewBox="0 0 72 60"
      xmlns="http://www.w3.org/2000/svg"
      style={{ overflow: 'visible', display: 'block' }}
    >
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          TAIL — thick, curls upward, pivots from hip
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <g ref={tailRef} style={{ transformBox: 'fill-box', transformOrigin: '0px 4px' }}>
        {/* outer (stripe/outline) */}
        <path d="M62 50 Q76 40 72 26 Q68 15 74 9"
          stroke="var(--text-secondary)" strokeWidth="6.5"
          fill="none" strokeLinecap="round"/>
        {/* inner (body color) */}
        <path d="M62 50 Q76 40 72 26 Q68 15 74 9"
          stroke="var(--bg-secondary)" strokeWidth="4"
          fill="none" strokeLinecap="round"/>
        {/* fluffy tip */}
        <circle cx="74" cy="9"  r="5.5" fill="var(--bg-secondary)" stroke="var(--text-secondary)" strokeWidth="1.6"/>
      </g>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          HIND LEGS — stubby, behind body
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <g ref={legBLRef} style={{ transformBox: 'fill-box', transformOrigin: 'center top' }}>
        <rect x="12" y="43" width="15" height="15" rx="7.5"
          fill="var(--bg-secondary)" stroke="var(--border)" strokeWidth="1.3"/>
        <ellipse cx="19.5" cy="57.5" rx="8.5" ry="4.2"
          fill="var(--bg-secondary)" stroke="var(--border)" strokeWidth="1.2"/>
        {/* toe lines */}
        <path d="M13 57 Q16.5 59.5 19.5 58 Q22.5 59.5 26 57"
          stroke="var(--text-secondary)" strokeWidth="0.9" fill="none" strokeLinecap="round" opacity="0.5"/>
        <circle cx="17" cy="56.5" r="1.1" fill="var(--accent-light)" opacity="0.5" />
      </g>
      <g ref={legBRRef} style={{ transformBox: 'fill-box', transformOrigin: 'center top' }}>
        <rect x="44" y="43" width="15" height="15" rx="7.5"
          fill="var(--bg-secondary)" stroke="var(--border)" strokeWidth="1.3"/>
        <ellipse cx="51.5" cy="57.5" rx="8.5" ry="4.2"
          fill="var(--bg-secondary)" stroke="var(--border)" strokeWidth="1.2"/>
        <path d="M45 57 Q48.5 59.5 51.5 58 Q54.5 59.5 58 57"
          stroke="var(--text-secondary)" strokeWidth="0.9" fill="none" strokeLinecap="round" opacity="0.5"/>
        <circle cx="49" cy="56.5" r="1.1" fill="var(--accent-light)" opacity="0.5" />
      </g>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          BODY — wide chubby oval
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <g ref={bodyRef} style={{ transformBox: 'fill-box', transformOrigin: 'center 42px' }}>
        {/* body */}
        <ellipse cx="35" cy="42" rx="27" ry="17"
          fill="var(--bg-secondary)" stroke="var(--border)" strokeWidth="1.5"/>
        {/* belly */}
        <ellipse cx="35" cy="46" rx="16" ry="11"
          fill="var(--bg-primary)" stroke="none"/>
        
        {/* collar & dangling bell */}
        <path d="M 22 36 Q 35 39.5 48 36" stroke="var(--accent)" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
        <circle cx="35" cy="37.8" r="2.8" fill="var(--accent-light)" stroke="var(--text-secondary)" strokeWidth="0.8"/>
        <circle cx="35" cy="37.8" r="1.0" fill="var(--bg-secondary)" />

        {/* tabby body marks — 2 curved stripes each side */}
        <path d="M14 34 Q20 29 26 33" stroke="var(--text-secondary)" strokeWidth="2.2" fill="none" strokeLinecap="round" opacity="0.7"/>
        <path d="M18 29 Q23 25 28 29" stroke="var(--text-secondary)" strokeWidth="1.7" fill="none" strokeLinecap="round" opacity="0.6"/>
        <path d="M42 29 Q47 25 52 29" stroke="var(--text-secondary)" strokeWidth="1.7" fill="none" strokeLinecap="round" opacity="0.6"/>
        <path d="M44 34 Q50 29 56 33" stroke="var(--text-secondary)" strokeWidth="2.2" fill="none" strokeLinecap="round" opacity="0.7"/>
      </g>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          WRITING ARM — hidden during walk
          Shoulder pivot at (13, 37)
          Pencil tip ≈ (10, 61)
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <g ref={armRef} style={{ transformBox: 'fill-box', transformOrigin: '13px 37px', opacity: 0 }}>
        {/* outer arm */}
        <path d="M13 37 Q5 47 9 57"
          stroke="var(--border)" strokeWidth="6"
          fill="none" strokeLinecap="round"/>
        {/* inner arm */}
        <path d="M13 37 Q5 47 9 57"
          stroke="var(--bg-secondary)" strokeWidth="4"
          fill="none" strokeLinecap="round"/>
        {/* paw with pink paw pads */}
        <ellipse cx="9" cy="58" rx="6" ry="4"
          fill="var(--bg-secondary)" stroke="var(--border)" strokeWidth="1.2"/>
        <circle cx="7.5" cy="57.5" r="1.2" fill="var(--accent-light)" opacity="0.7" />

        {/* pencil — tip at ~(10, 61) */}
        <g transform="translate(6.5, 54) rotate(-22)">
          {/* body */}
          <rect x="-2.2" y="0"   width="4.4" height="15" rx="1.5"
            fill="var(--text-primary)"/>
          {/* eraser — accent-light */}
          <rect x="-2.2" y="0"   width="4.4" height="5"  rx="1.5"
            fill="var(--accent-light)"/>
          {/* eraser band */}
          <rect x="-2.2" y="4.2" width="4.4" height="1.5"
            fill="var(--accent)"/>
          {/* wood */}
          <rect x="-2.2" y="13" width="4.4" height="3.5" fill="#d4a84b"/>
          {/* tip taper */}
          <polygon points="-2.2,16.5 2.2,16.5 0,22" fill="#c49030"/>
          {/* graphite */}
          <polygon points="-0.9,21 0.9,21 0,24" fill="var(--text-secondary)"/>
        </g>
      </g>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          FRONT LEGS — in front of body
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <g ref={legFLRef} style={{ transformBox: 'fill-box', transformOrigin: 'center top' }}>
        <rect x="18" y="50" width="14" height="12" rx="7"
          fill="var(--bg-secondary)" stroke="var(--border)" strokeWidth="1.3"/>
        <ellipse cx="25" cy="60" rx="8" ry="4"
          fill="var(--bg-secondary)" stroke="var(--border)" strokeWidth="1.2"/>
        <path d="M18 59.5 Q21.5 62 25 60.5 Q28.5 62 32 59.5"
          stroke="var(--text-secondary)" strokeWidth="0.9" fill="none" strokeLinecap="round" opacity="0.5"/>
        <circle cx="23.5" cy="59.5" r="1.2" fill="var(--accent-light)" opacity="0.6" />
      </g>
      <g ref={legFRRef} style={{ transformBox: 'fill-box', transformOrigin: 'center top' }}>
        <rect x="38" y="50" width="14" height="12" rx="7"
          fill="var(--bg-secondary)" stroke="var(--border)" strokeWidth="1.3"/>
        <ellipse cx="45" cy="60" rx="8" ry="4"
          fill="var(--bg-secondary)" stroke="var(--border)" strokeWidth="1.2"/>
        <path d="M38 59.5 Q41.5 62 45 60.5 Q48.5 62 52 59.5"
          stroke="var(--text-secondary)" strokeWidth="0.9" fill="none" strokeLinecap="round" opacity="0.5"/>
        <circle cx="43.5" cy="59.5" r="1.2" fill="var(--accent-light)" opacity="0.6" />
      </g>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          HEAD — oversized chibi, same width as body
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <g ref={headRef} style={{ transformBox: 'fill-box', transformOrigin: 'center 21px' }}>

        {/* EARS — small wide triangles with inner pink */}
        <g ref={earLRef} style={{ transformBox: 'fill-box', transformOrigin: 'center bottom' }}>
          <polygon points="9,23 5,6 22,18"
            fill="var(--bg-secondary)" stroke="var(--border)"
            strokeWidth="1.4" strokeLinejoin="round"/>
          {/* inner ear — accent-light */}
          <polygon points="10,21 7,9 19,17" fill="var(--accent-light)"/>
          {/* ear stripe */}
          <path d="M7 15 Q12 10 18 14"
            stroke="var(--text-secondary)" strokeWidth="1.2"
            fill="none" strokeLinecap="round" opacity="0.6"/>
        </g>
        <g ref={earRRef} style={{ transformBox: 'fill-box', transformOrigin: 'center bottom' }}>
          <polygon points="49,21 67,6 63,18"
            fill="var(--bg-secondary)" stroke="var(--border)"
            strokeWidth="1.4" strokeLinejoin="round"/>
          <polygon points="50,19 64,9 62,17" fill="var(--accent-light)"/>
          <path d="M54 14 Q60 10 65 15"
            stroke="var(--text-secondary)" strokeWidth="1.2"
            fill="none" strokeLinecap="round" opacity="0.6"/>
        </g>

        {/* head circle */}
        <circle cx="36" cy="21" r="22"
          fill="var(--bg-secondary)" stroke="var(--border)" strokeWidth="1.5"/>

        {/* 3 forehead tabby stripes */}
        <path d="M25  8 Q36  5 47  8"
          stroke="var(--text-secondary)" strokeWidth="2"   fill="none" strokeLinecap="round" opacity="0.7"/>
        <path d="M27 12 Q36  9 45 12"
          stroke="var(--text-secondary)" strokeWidth="1.6" fill="none" strokeLinecap="round" opacity="0.6"/>
        <path d="M29 16 Q36 14 43 16"
          stroke="var(--text-secondary)" strokeWidth="1.1" fill="none" strokeLinecap="round" opacity="0.5"/>

        {/* muzzle lighter oval */}
        <ellipse cx="36" cy="31" rx="14" ry="10"
          fill="var(--bg-primary)" stroke="none"/>

        {/* ── EYES — large round chibi ── */}
        <g ref={eyeLRef} style={{ transformBox: 'fill-box', transformOrigin: 'center center' }}>
          <circle cx="26" cy="20" r="6.5"
            fill="white" stroke="var(--border)" strokeWidth="1.4"/>
          <circle cx="26" cy="20" r="4.5" fill="var(--text-secondary)"/>
          <circle cx="26" cy="20" r="2.8" fill="var(--text-primary)"/>
          {/* main shine */}
          <circle cx="27.8" cy="18.2" r="1.6" fill="white"/>
          {/* small secondary shine */}
          <circle cx="24.4" cy="22"   r="0.8" fill="white" opacity="0.55"/>
        </g>
        <g ref={eyeRRef} style={{ transformBox: 'fill-box', transformOrigin: 'center center' }}>
          <circle cx="46" cy="20" r="6.5"
            fill="white" stroke="var(--border)" strokeWidth="1.4"/>
          <circle cx="46" cy="20" r="4.5" fill="var(--text-secondary)"/>
          <circle cx="46" cy="20" r="2.8" fill="var(--text-primary)"/>
          <circle cx="47.8" cy="18.2" r="1.6" fill="white"/>
          <circle cx="44.4" cy="22"   r="0.8" fill="white" opacity="0.55"/>
        </g>

        {/* nose — small triangle, accent color */}
        <polygon points="36,29 33,26 39,26" fill="var(--accent)" stroke="none"/>

        {/* mouth — W shape */}
        <path d="M33,29.5 Q36,33.5 39,29.5"
          stroke="var(--text-secondary)" strokeWidth="1.3"
          fill="none" strokeLinecap="round"/>

        {/* rosy cheeks — accent color, very soft */}
        <circle cx="19" cy="28" r="5.5" fill="var(--accent)" opacity="0.12"/>
        <circle cx="53" cy="28" r="5.5" fill="var(--accent)" opacity="0.12"/>

        {/* whiskers — 3 per side */}
        <line x1="31" y1="27" x2="7"  y2="22"
          stroke="var(--text-muted)" strokeWidth="0.95" strokeLinecap="round"/>
        <line x1="31" y1="30" x2="6"  y2="30"
          stroke="var(--text-muted)" strokeWidth="0.95" strokeLinecap="round"/>
        <line x1="31" y1="33" x2="7"  y2="37"
          stroke="var(--text-muted)" strokeWidth="0.85" strokeLinecap="round"/>
        <line x1="41" y1="27" x2="65" y2="22"
          stroke="var(--text-muted)" strokeWidth="0.95" strokeLinecap="round"/>
        <line x1="41" y1="30" x2="66" y2="30"
          stroke="var(--text-muted)" strokeWidth="0.95" strokeLinecap="round"/>
        <line x1="41" y1="33" x2="65" y2="37"
          stroke="var(--text-muted)" strokeWidth="0.85" strokeLinecap="round"/>
      </g>
    </svg>
  );
}

/* ══════════════════════════════════════════════════════════
   PAGE HERO
══════════════════════════════════════════════════════════ */
export default function PageHero({ pageId, data }) {
  const { editMode } = useAdmin();

  const titleCanvasRef = useRef(null);
  const subCanvasRef   = useRef(null);
  const catStageRef    = useRef(null);
  const hasStarted     = useRef(false);

  const catRefs = {
    svgRef:   useRef(null),
    bodyRef:  useRef(null),
    tailRef:  useRef(null),
    legFLRef: useRef(null),
    legFRRef: useRef(null),
    legBLRef: useRef(null),
    legBRRef: useRef(null),
    earLRef:  useRef(null),
    earRRef:  useRef(null),
    eyeLRef:  useRef(null),
    eyeRRef:  useRef(null),
    armRef:   useRef(null),
    headRef:  useRef(null),
  };

  const animState = useRef({
    phase: 'idle',
    walkT: 0, tailT: 0, bodyT: 0, earT: 0, eyeT: 0,
    armAngle: -20, armDir: 1,
    catX: -100, catY: 0,
    lastTime: null,
    rafId: null,
  });

  const placeCat = useCallback((x, y) => {
    if (!catStageRef.current) return;
    catStageRef.current.style.transform = `translate(${x}px, ${y}px)`;
  }, []);

  /* pencil tip in SVG ≈ (10, 61) */
  const moveCatToWrite = useCallback((penX, penY, canvasTop) => {
    const x = penX - 10;
    const y = canvasTop + penY - 61;
    animState.current.catX = x;
    animState.current.catY = y;
    placeCat(x, y);
  }, [placeCat]);

  const writeOnCanvas = useCallback((canvas, text, fontSize, color, charDelay, startDelay, onChar, onDone) => {
    if (!text) { onDone(); return; }
    const dpr  = window.devicePixelRatio || 1;
    const W    = canvas.offsetWidth || 560;
    const H    = parseInt(canvas.getAttribute('height') || '60');
    canvas.width  = W * dpr;
    canvas.height = H * dpr;
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    const font = `700 ${fontSize}px 'Caveat', cursive`;
    ctx.font = font;
    ctx.textBaseline = 'middle';
    const tw = ctx.measureText(text).width;
    const sx = (W - tw) / 2;
    const my = H / 2;
    const edges = [];
    let cx = sx;
    for (const ch of text) {
      cx += ctx.measureText(ch).width;
      edges.push(cx);
    }
    let i = 0;
    function step() {
      if (i >= text.length) { onDone(); return; }
      ctx.clearRect(0, 0, W, H);
      ctx.font = font;
      ctx.fillStyle = color;
      ctx.textBaseline = 'middle';
      ctx.fillText(text.slice(0, i + 1), sx, my);
      onChar(edges[i], my);
      i++;
      setTimeout(step, charDelay);
    }
    setTimeout(step, startDelay);
  }, []);

  /* ══ ANIMATION LOOP ══ */
  useEffect(() => {
    if (editMode) return;
    const s = animState.current;
    const r = catRefs;

    function applyWalkCycle(dt) {
      s.walkT += dt * 7;
      s.tailT += dt * 2.2;
      s.earT  += dt * 0.8;

      const t = s.walkT;
      // Diagonal pair gait: FL+BR together, then FR+BL
      const pair1 =  Math.sin(t) * 22;
      const pair2 =  Math.sin(t + Math.PI) * 22;

      if (r.legFLRef.current) r.legFLRef.current.style.transform = `rotate(${pair1}deg)`;
      if (r.legBRRef.current) r.legBRRef.current.style.transform = `rotate(${pair1}deg)`;
      if (r.legFRRef.current) r.legFRRef.current.style.transform = `rotate(${pair2}deg)`;
      if (r.legBLRef.current) r.legBLRef.current.style.transform = `rotate(${pair2}deg)`;

      // Body bobs twice per stride (once per step pair) + subtle lean
      const bob = Math.abs(Math.sin(t * 2)) * -3.2;
      if (r.bodyRef.current) r.bodyRef.current.style.transform = `translateY(${bob}px) rotate(${bob * 0.2}deg)`;
      if (r.headRef.current) r.headRef.current.style.transform = `translateY(${bob * 0.5}px)`;

      // Tail sways wide during walk
      if (r.tailRef.current)
        r.tailRef.current.style.transform = `rotate(${Math.sin(s.tailT) * 26}deg)`;

      // Random ear twitch
      const et = Math.sin(s.earT * 0.5);
      if (r.earLRef.current)
        r.earLRef.current.style.transform = `rotate(${et < -0.88 ? -14 : 0}deg)`;
      if (r.earRRef.current)
        r.earRRef.current.style.transform = `rotate(${et > 0.88 ? 11 : 0}deg)`;
    }

    function applyWriteCycle(dt) {
      s.tailT += dt * 1.5;
      s.bodyT += dt * 5;
      s.eyeT  += dt;

      // Gentle purring bounce & dynamic head tilt while writing
      const sway = Math.sin(s.bodyT) * 1.6;
      if (r.bodyRef.current) r.bodyRef.current.style.transform = `translateY(${sway}px)`;
      if (r.headRef.current) r.headRef.current.style.transform = `translateY(${sway * 0.5}px) rotate(${Math.sin(s.bodyT * 0.5) * 3.5}deg)`;

      // Slow tail flick
      if (r.tailRef.current)
        r.tailRef.current.style.transform = `rotate(${Math.sin(s.tailT) * 12}deg)`;

      // Arm strokes back and forth with a small offset
      s.armAngle += s.armDir * 6.5 * dt * 18;
      if (s.armAngle > 2 || s.armAngle < -32) s.armDir *= -1;
      if (r.armRef.current)
        r.armRef.current.style.transform = `rotate(${s.armAngle}deg)`;

      // Blink every ~3.6s
      const blink = s.eyeT % 3.6;
      const sy = blink > 3.4 ? 0.05 : 1;
      if (r.eyeLRef.current) r.eyeLRef.current.style.transform = `scaleY(${sy})`;
      if (r.eyeRRef.current) r.eyeRRef.current.style.transform = `scaleY(${sy})`;
    }

    function applyIdleCycle(dt) {
      s.tailT += dt * 1.2;
      s.earT  += dt * 0.4;
      s.eyeT  += dt;

      // Gentle breathing effect in idle state
      const breathe = Math.sin(s.tailT * 0.7) * 0.8;
      if (r.bodyRef.current) r.bodyRef.current.style.transform = `scale(1, ${1 + breathe * 0.01})`;

      if (r.tailRef.current)
        r.tailRef.current.style.transform = `rotate(${Math.sin(s.tailT) * 9}deg)`;

      [r.legFLRef, r.legFRRef, r.legBLRef, r.legBRRef].forEach(ref => {
        if (ref.current) ref.current.style.transform = 'rotate(0deg)';
      });
      if (r.headRef.current) r.headRef.current.style.transform = '';

      const blink = s.eyeT % 4.5;
      const sy = blink > 4.3 ? 0.05 : 1;
      if (r.eyeLRef.current) r.eyeLRef.current.style.transform = `scaleY(${sy})`;
      if (r.eyeRRef.current) r.eyeRRef.current.style.transform = `scaleY(${sy})`;
    }

    function loop(ts) {
      const dt = s.lastTime ? Math.min((ts - s.lastTime) / 1000, 0.05) : 0;
      s.lastTime = ts;
      if      (s.phase === 'walkin')  applyWalkCycle(dt);
      else if (s.phase === 'writing') applyWriteCycle(dt);
      else if (s.phase === 'walkout') applyWalkCycle(dt);
      else                            applyIdleCycle(dt);
      s.rafId = requestAnimationFrame(loop);
    }

    s.rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(s.rafId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editMode]);

  /* ══ ORCHESTRATION ══ */
  useEffect(() => {
    if (editMode) return;
    const title    = data?.heroTitle    || '';
    const subtitle = data?.heroSubtitle || '';
    if (!title) return;
    if (hasStarted.current) return;
    hasStarted.current = true;

    const tc = titleCanvasRef.current;
    const sc = subCanvasRef.current;
    if (!tc) return;

    document.fonts.ready.then(() => {
      const tColor = cssVar('--text-primary');
      const sColor = cssVar('--text-secondary');
      const s = animState.current;

      const W = tc.offsetWidth || 560;
      const tmp = document.createElement('canvas').getContext('2d');
      tmp.font = `700 44px 'Caveat', cursive`;
      const tw = tmp.measureText(title).width;
      const titleStartX = (W - tw) / 2;

      /*
       * SVG foot baseline = y:60.
       * .writingArea has padding-top: 68px.
       * tc.offsetTop ≈ 68 (canvas top of canvas inside writingArea ).
       * walkY = tc.offsetTop - 60  →  cat feet land on canvas top edge.
       * The 8px above canvas top is the padding buffer, so head is fully visible.
       */
      const walkY = tc.offsetTop - 60;
      s.catX = -100;
      s.catY = walkY;
      placeCat(-100, walkY);

      // pencil tip at SVG x≈10; walk so tip aligns with first char start
      const targetX = titleStartX - 10;
      s.phase = 'walkin';

      tween(-100, targetX, 1200, easeInOut,
        (x) => { s.catX = x; placeCat(x, walkY); },
        () => {
          s.phase = 'writing';
          s.armAngle = -20;
          s.armDir = 1;

          [catRefs.legFLRef, catRefs.legFRRef, catRefs.legBLRef, catRefs.legBRRef].forEach(ref => {
            if (ref.current) ref.current.style.transform = 'rotate(0deg)';
          });
          if (catRefs.bodyRef.current) catRefs.bodyRef.current.style.transform = '';
          if (catRefs.armRef.current)  catRefs.armRef.current.style.opacity = '1';

          writeOnCanvas(tc, title, 44, tColor, 58, 180,
            (px, py) => moveCatToWrite(px, py, tc.offsetTop),
            () => {
              writeOnCanvas(sc, subtitle, 20, sColor, 26, 100,
                (px, py) => moveCatToWrite(px, py, sc.offsetTop),
                () => {
                  if (catRefs.armRef.current) catRefs.armRef.current.style.opacity = '0';
                  setTimeout(() => {
                    s.phase = 'walkout';
                    if (catRefs.svgRef.current)
                      catRefs.svgRef.current.style.transform = 'scaleX(-1)';
                    const paper = tc.closest('[class*="wall"]') || tc.parentElement?.parentElement;
                    
                    // Keep the cat *entirely* inside the wall boundary during mobile mode exit
                    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
                    const wallWidth = paper?.offsetWidth || 350;
                    // The cat's width is about 72px + offset.
                    // Setting exitX 96px less than the width keeps it safely contained without overflowing the padding.
                    const exitX = isMobile
                      ? wallWidth - 96 
                      : (paper?.offsetWidth || 700) + 100;

                    tween(s.catX, exitX, 1000, easeIn,
                      (x) => { s.catX = x; placeCat(x, s.catY); },
                      () => { s.phase = 'idle'; }
                    );
                  }, 800);
                }
              );
            }
          );
        }
      );
    });
  }, [data, editMode, placeCat, moveCatToWrite, writeOnCanvas]);

  if (editMode) {
    return (
      <section className={styles.hero}>
        <div className={styles.wall}>
          <div className="text-center py-4">
            <EditableText
              collection="pages" docId={pageId} fieldPath="heroTitle"
              value={data?.heroTitle || 'Page Title'} tag="h1"
              className="text-4xl md:text-5xl font-bold text-[var(--text-primary)]"
            />
            <EditableText
              collection="pages" docId={pageId} fieldPath="heroSubtitle"
              value={data?.heroSubtitle || 'Subtitle'} tag="p"
              className="text-lg md:text-xl mt-3 text-[var(--text-secondary)]"
            />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className={styles.hero}>
      <div className={styles.wall}>
        <div className={styles.writingArea}>
          <canvas ref={titleCanvasRef} className={styles.titleCanvas} height={60} />
          <canvas ref={subCanvasRef}   className={styles.subCanvas}   height={36} />
          <div ref={catStageRef} className={styles.catStage}>
            <CatSVG refs={catRefs} />
          </div>
        </div>
      </div>
    </section>
  );
}