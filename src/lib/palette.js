/**
 * PALETTE
 * src/lib/palette.js
 *
 * Generates a full 11-token theme from three inputs — an accent colour, a
 * neutral tint and light/dark — instead of asking anyone to hand-pick eleven
 * related colours.
 *
 * The maths runs in OKLCH rather than HSL. HSL's "lightness" is not perceptual:
 * hsl(60, 100%, 50%) (yellow) and hsl(240, 100%, 50%) (blue) claim the same
 * lightness while yellow is obviously far brighter. Ramps built in HSL come out
 * uneven, which is exactly the "my palette looks wrong and I can't say why"
 * problem. In OKLCH a lightness step looks like the same step at every hue.
 *
 * No dependencies — the conversions are ~60 lines of well-defined maths.
 */

/* ------------------------------------------------------------------ */
/* Colour space conversions                                            */
/* ------------------------------------------------------------------ */

const clamp = (n, min = 0, max = 1) => Math.min(Math.max(n, min), max);

export function hexToRgb(hex) {
  const clean = String(hex || '').trim().replace('#', '');
  const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean;
  if (!/^[0-9a-f]{6}$/i.test(full)) return null;
  return {
    r: parseInt(full.slice(0, 2), 16) / 255,
    g: parseInt(full.slice(2, 4), 16) / 255,
    b: parseInt(full.slice(4, 6), 16) / 255,
  };
}

export function rgbToHex({ r, g, b }) {
  const to = (v) => Math.round(clamp(v) * 255).toString(16).padStart(2, '0');
  return `#${to(r)}${to(g)}${to(b)}`;
}

const toLinear = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const toGamma = (c) => (c <= 0.0031308 ? c * 12.92 : 1.055 * c ** (1 / 2.4) - 0.055);

/** sRGB -> OKLab. */
function rgbToOklab({ r, g, b }) {
  const lr = toLinear(r);
  const lg = toLinear(g);
  const lb = toLinear(b);

  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb);
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb);
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb);

  return {
    L: 0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s,
    a: 1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s,
    b: 0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s,
  };
}

/** OKLab -> sRGB. Values may fall outside 0..1 when out of gamut. */
function oklabToRgb({ L, a, b }) {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.2914855480 * b) ** 3;

  return {
    r: toGamma(+4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
    g: toGamma(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
    b: toGamma(-0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s),
  };
}

export function hexToOklch(hex) {
  const rgb = hexToRgb(hex);
  if (!rgb) return null;
  const { L, a, b } = rgbToOklab(rgb);
  return {
    l: L,
    c: Math.sqrt(a * a + b * b),
    h: (Math.atan2(b, a) * 180) / Math.PI,
  };
}

const inGamut = ({ r, g, b }) =>
  r >= -0.001 && r <= 1.001 && g >= -0.001 && g <= 1.001 && b >= -0.001 && b <= 1.001;

/**
 * OKLCH -> hex. Colours outside sRGB have their chroma reduced until they fit,
 * which preserves hue and lightness — clipping the channels instead would shift
 * the hue and is what makes naive conversions look muddy.
 */
export function oklchToHex({ l, c, h }) {
  const rad = (h * Math.PI) / 180;
  const L = clamp(l, 0, 1);

  let lo = 0;
  let hi = Math.max(c, 0);
  let rgb = oklabToRgb({ L, a: hi * Math.cos(rad), b: hi * Math.sin(rad) });

  if (!inGamut(rgb)) {
    for (let i = 0; i < 24; i += 1) {
      const mid = (lo + hi) / 2;
      rgb = oklabToRgb({ L, a: mid * Math.cos(rad), b: mid * Math.sin(rad) });
      if (inGamut(rgb)) lo = mid;
      else hi = mid;
    }
    rgb = oklabToRgb({ L, a: lo * Math.cos(rad), b: lo * Math.sin(rad) });
  }

  return rgbToHex({ r: clamp(rgb.r), g: clamp(rgb.g), b: clamp(rgb.b) });
}

/* ------------------------------------------------------------------ */
/* Contrast (WCAG 2.1)                                                 */
/* ------------------------------------------------------------------ */

export function relativeLuminance(hex) {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0;
  return 0.2126 * toLinear(rgb.r) + 0.7152 * toLinear(rgb.g) + 0.0722 * toLinear(rgb.b);
}

/** 1 (identical) to 21 (black on white). */
export function contrastRatio(foreground, background) {
  const a = relativeLuminance(foreground);
  const b = relativeLuminance(background);
  const [light, dark] = a > b ? [a, b] : [b, a];
  return (light + 0.05) / (dark + 0.05);
}

/** True when a background is dark enough to need light text on it. */
export function isDarkColor(hex) {
  const oklch = hexToOklch(hex);
  if (!oklch) return false;
  return oklch.l < 0.5;
}

/** Decides whether a whole palette is a dark theme, from its page background. */
export function isDarkPalette(colors = {}) {
  return isDarkColor(colors['--bg-primary'] || '#ffffff');
}

/* ------------------------------------------------------------------ */
/* Generation                                                          */
/* ------------------------------------------------------------------ */

export const TINTS = {
  neutral: { label: 'Neutral grey', chroma: 0, hue: null },
  accent:  { label: 'Tinted by accent', chroma: 0.012, hue: 'accent' },
  warm:    { label: 'Warm', chroma: 0.014, hue: 70 },
  cool:    { label: 'Cool', chroma: 0.014, hue: 250 },
};

export const CONTRAST_LEVELS = {
  normal: { label: 'Normal', body: 4.5, heading: 7 },
  high:   { label: 'High', body: 7, heading: 10 },
};

// Lightness targets per token. Tuned so adjacent surfaces are distinguishable
// without the steps looking like stripes.
const RAMP = {
  light: {
    '--bg-primary': 0.995,
    '--bg-secondary': 0.965,
    '--bg-tertiary': 0.925,
    '--card-bg': 1.0,
    '--border': 0.875,
    '--text-primary': 0.24,
    '--text-secondary': 0.47,
    '--text-muted': 0.62,
  },
  dark: {
    '--bg-primary': 0.17,
    '--bg-secondary': 0.215,
    '--bg-tertiary': 0.27,
    '--card-bg': 0.225,
    '--border': 0.34,
    '--text-primary': 0.97,
    '--text-secondary': 0.80,
    '--text-muted': 0.64,
  },
};

/** Nudge a foreground's lightness until it meets a contrast target. */
function meetContrast(foregroundOklch, backgroundHex, target, direction) {
  let { l, c, h } = foregroundOklch;
  let hex = oklchToHex({ l, c, h });

  for (let i = 0; i < 60; i += 1) {
    if (contrastRatio(hex, backgroundHex) >= target) break;
    l = clamp(l + direction * 0.01, 0, 1);
    hex = oklchToHex({ l, c, h });
    if (l <= 0 || l >= 1) break;
  }
  return hex;
}

/**
 * Build all 11 tokens.
 *
 * @param accent   hex seed colour
 * @param mode     'light' | 'dark'
 * @param tint     key of TINTS — how much of a hue the greys carry
 * @param contrast key of CONTRAST_LEVELS
 */
export function generatePalette({
  accent = '#6d28d9',
  mode = 'light',
  tint = 'accent',
  contrast = 'normal',
} = {}) {
  const seed = hexToOklch(accent) || hexToOklch('#6d28d9');
  const tintSpec = TINTS[tint] || TINTS.accent;
  const targets = CONTRAST_LEVELS[contrast] || CONTRAST_LEVELS.normal;
  const ramp = RAMP[mode] || RAMP.light;

  const neutralHue = tintSpec.hue === 'accent' ? seed.h : (tintSpec.hue ?? seed.h);
  const neutralChroma = tintSpec.chroma;

  const colors = {};

  // Surfaces and text share one neutral ramp, so everything feels related.
  for (const [token, l] of Object.entries(ramp)) {
    // Text carries slightly more tint than surfaces — pure grey text on a
    // tinted background reads as flat.
    const isText = token.startsWith('--text');
    colors[token] = oklchToHex({
      l,
      c: neutralChroma * (isText ? 1.6 : 1),
      h: neutralHue,
    });
  }

  const pageBg = colors['--bg-primary'];
  const cardBg = colors['--card-bg'];

  // Text must clear its contrast target on BOTH the page and card backgrounds.
  const textDirection = mode === 'dark' ? 1 : -1;
  const worstBg = contrastRatio('#000000', pageBg) > contrastRatio('#000000', cardBg) ? cardBg : pageBg;

  colors['--text-primary'] = meetContrast(
    hexToOklch(colors['--text-primary']), worstBg, targets.heading, textDirection
  );
  colors['--text-secondary'] = meetContrast(
    hexToOklch(colors['--text-secondary']), worstBg, targets.body, textDirection
  );
  // Muted text is for de-emphasised labels, so it only needs the 3:1 UI floor.
  colors['--text-muted'] = meetContrast(
    hexToOklch(colors['--text-muted']), worstBg, 3, textDirection
  );

  // Accent: keep the chosen hue, move lightness until it is readable as a link
  // and as a button background.
  const accentLightness = mode === 'dark'
    ? Math.max(seed.l, 0.62)
    : Math.min(seed.l, 0.58);

  colors['--accent'] = meetContrast(
    { l: accentLightness, c: seed.c, h: seed.h },
    pageBg,
    targets.body,
    mode === 'dark' ? 1 : -1
  );

  const accentOklch = hexToOklch(colors['--accent']);

  colors['--accent-hover'] = oklchToHex({
    l: clamp(accentOklch.l + (mode === 'dark' ? 0.08 : -0.08), 0.05, 0.95),
    c: accentOklch.c,
    h: accentOklch.h,
  });

  // Text/icon colour for anything sitting ON the accent. Computed, never
  // hardcoded to white: in dark mode a bright accent must be light enough to
  // read on the page background, which makes white text on it unreadable.
  // Those two requirements are mathematically incompatible, so the on-accent
  // colour has to be chosen per palette.
  colors['--accent-contrast'] =
    contrastRatio('#ffffff', colors['--accent']) >= contrastRatio('#000000', colors['--accent'])
      ? '#ffffff'
      : '#0a0a0a';

  // A tinted surface, not a pale version of the accent — it sits behind text.
  colors['--accent-light'] = oklchToHex({
    l: mode === 'dark' ? 0.27 : 0.945,
    c: Math.min(accentOklch.c * 0.35, 0.05),
    h: accentOklch.h,
  });

  return colors;
}

/* ------------------------------------------------------------------ */
/* Auditing                                                            */
/* ------------------------------------------------------------------ */

const CHECKS = [
  { label: 'Body text on page', fg: '--text-secondary', bg: '--bg-primary', min: 4.5 },
  { label: 'Headings on page', fg: '--text-primary', bg: '--bg-primary', min: 7 },
  { label: 'Body text on cards', fg: '--text-secondary', bg: '--card-bg', min: 4.5 },
  { label: 'Headings on cards', fg: '--text-primary', bg: '--card-bg', min: 7 },
  { label: 'Muted text on page', fg: '--text-muted', bg: '--bg-primary', min: 3 },
  { label: 'Links on page', fg: '--accent', bg: '--bg-primary', min: 4.5 },
  { label: 'Links on cards', fg: '--accent', bg: '--card-bg', min: 4.5 },
  { label: 'Text on accent buttons', fg: '--accent-contrast', bg: '--accent', min: 4.5 },
  { label: 'Accent text on its tint', fg: '--accent', bg: '--accent-light', min: 4.5 },
  { label: 'Borders against page', fg: '--border', bg: '--bg-primary', min: 1.4 },
  { label: 'Cards against page', fg: '--card-bg', bg: '--bg-primary', min: 1.05 },
];

/**
 * Contrast report for a palette. `level` is 'pass' | 'warn' | 'fail`, so the
 * UI can distinguish "unreadable" from "a bit tight".
 */
export function auditPalette(colors = {}) {
  return CHECKS.map((check) => {
    const fg = check.fg.startsWith('#') ? check.fg : colors[check.fg];
    const bg = check.bg.startsWith('#') ? check.bg : colors[check.bg];
    if (!fg || !bg) return { ...check, ratio: 0, level: 'fail' };

    const ratio = contrastRatio(fg, bg);
    const level = ratio >= check.min ? 'pass' : ratio >= check.min * 0.8 ? 'warn' : 'fail';
    return { ...check, ratio, level };
  });
}

export function auditSummary(colors) {
  const results = auditPalette(colors);
  return {
    results,
    failures: results.filter((r) => r.level === 'fail').length,
    warnings: results.filter((r) => r.level === 'warn').length,
    ok: results.every((r) => r.level === 'pass'),
  };
}
