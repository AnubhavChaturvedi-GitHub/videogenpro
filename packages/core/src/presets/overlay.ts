import type { Preset } from '../preset';

// Overlays = constant look/filter applied across the whole layer (drag onto any
// layer). Each holds for the layer's lifetime (continuous) and returns an
// explicit css value so nothing leaks between frames.
export const overlayPresets: Preset[] = [
  {
    id: 'overlay.blur', category: 'overlay', description: 'blur', tags: ['filter'], continuous: true,
    params: { amount: { default: 8, min: 0, max: 40, unit: 'px' } },
    defaultDuration: 5, apply: (_p, prm) => ({ css: { filter: `blur(${prm.amount}px)` } }),
  },
  {
    id: 'overlay.black-white', category: 'overlay', description: 'black & white', tags: ['filter', 'mono'], continuous: true,
    params: { amount: { default: 1, min: 0, max: 1 } },
    defaultDuration: 5, apply: (_p, prm) => ({ css: { filter: `grayscale(${prm.amount})` } }),
  },
  {
    id: 'overlay.sepia', category: 'overlay', description: 'sepia', tags: ['filter', 'warm'], continuous: true,
    params: { amount: { default: 0.8, min: 0, max: 1 } },
    defaultDuration: 5, apply: (_p, prm) => ({ css: { filter: `sepia(${prm.amount})` } }),
  },
  {
    id: 'overlay.brighten', category: 'overlay', description: 'brighten', tags: ['filter'], continuous: true,
    params: { amount: { default: 0.3, min: 0, max: 1 } },
    defaultDuration: 5, apply: (_p, prm) => ({ css: { filter: `brightness(${1 + prm.amount})` } }),
  },
  {
    id: 'overlay.darken', category: 'overlay', description: 'darken', tags: ['filter'], continuous: true,
    params: { amount: { default: 0.4, min: 0, max: 1 } },
    defaultDuration: 5, apply: (_p, prm) => ({ css: { filter: `brightness(${1 - prm.amount})` } }),
  },
  {
    id: 'overlay.contrast', category: 'overlay', description: 'contrast', tags: ['filter'], continuous: true,
    params: { amount: { default: 0.4, min: 0, max: 1.5 } },
    defaultDuration: 5, apply: (_p, prm) => ({ css: { filter: `contrast(${1 + prm.amount})` } }),
  },
  {
    id: 'overlay.saturate', category: 'overlay', description: 'saturate', tags: ['filter', 'color'], continuous: true,
    params: { amount: { default: 1.6, min: 0, max: 3 } },
    defaultDuration: 5, apply: (_p, prm) => ({ css: { filter: `saturate(${prm.amount})` } }),
  },
  {
    id: 'overlay.fade', category: 'overlay', description: 'fade', tags: ['dim'], continuous: true,
    params: { amount: { default: 0.5, min: 0, max: 1 } },
    defaultDuration: 5, apply: (_p, prm) => ({ css: { background: `rgba(0,0,0,${prm.amount})` } }),
  },
  {
    id: 'overlay.vignette', category: 'overlay', description: 'vignette', tags: ['cinematic'], continuous: true,
    params: { amount: { default: 0.7, min: 0, max: 1 } },
    defaultDuration: 5, apply: (_p, prm) => ({ css: { boxShadow: `inset 0 0 140px ${40 * prm.amount}px rgba(0,0,0,${0.85 * prm.amount})` } }),
  },
  {
    id: 'overlay.invert', category: 'overlay', description: 'invert', tags: ['filter'], continuous: true,
    params: { amount: { default: 1, min: 0, max: 1 } },
    defaultDuration: 5, apply: (_p, prm) => ({ css: { filter: `invert(${prm.amount})` } }),
  },
  {
    id: 'overlay.hue-rotate', category: 'overlay', description: 'rotate all hues of everything beneath by a chosen angle (psychedelic / color shift)',
    tags: ['filter', 'color'], continuous: true,
    params: { deg: { default: 90, min: 0, max: 360, unit: 'deg' } },
    defaultDuration: 5, apply: (_p, prm) => ({ css: { filter: `hue-rotate(${prm.deg}deg)` } }),
  },
  {
    id: 'overlay.warmth', category: 'overlay', description: 'warm the whole frame toward golden tones (sunset / cozy color temperature)',
    tags: ['filter', 'color', 'warm', 'grade'], continuous: true,
    params: { amount: { default: 0.5, min: 0, max: 1, desc: 'warmth strength' } },
    defaultDuration: 5, apply: (_p, prm) => ({ css: { filter: `sepia(${prm.amount * 0.5}) saturate(${1 + prm.amount * 0.4}) hue-rotate(${-prm.amount * 12}deg) brightness(${1 + prm.amount * 0.04})` } }),
  },
  {
    id: 'overlay.vibrance', category: 'overlay', description: 'boost color vibrance and punch of everything beneath (richer, more saturated look)',
    tags: ['filter', 'color', 'pop'], continuous: true,
    params: { amount: { default: 0.6, min: 0, max: 1.5, desc: 'vibrance boost' } },
    defaultDuration: 5, apply: (_p, prm) => ({ css: { filter: `saturate(${1 + prm.amount}) contrast(${1 + prm.amount * 0.15})` } }),
  },
  {
    id: 'overlay.duotone-gradient', category: 'overlay',
    description: 'tint everything beneath with a two-color gradient wash (top color hueA, bottom color hueB) — a stylized duotone poster look. hueA/hueB are hue angles 0-360.',
    tags: ['stylize', 'duotone', 'grade', 'color'], continuous: true,
    params: {
      hueA: { default: 280, min: 0, max: 360, unit: 'deg', desc: 'top color hue' },
      hueB: { default: 30, min: 0, max: 360, unit: 'deg', desc: 'bottom color hue' },
      amount: { default: 0.6, min: 0, max: 1, desc: 'tint opacity' },
    },
    defaultDuration: 5, apply: (_p, prm) => ({ css: {
      // paint-on-top gradient blended over content; hsl drives the two stops.
      backgroundImage: `linear-gradient(160deg, hsla(${prm.hueA},85%,55%,${prm.amount}) 0%, hsla(${prm.hueB},90%,55%,${prm.amount}) 100%)`,
      mixBlendMode: 'color',
    } }),
  },
  {
    id: 'overlay.scanlines', category: 'overlay',
    description: 'overlay thin horizontal CRT scanlines over everything beneath, for a retro monitor / VHS broadcast look',
    tags: ['stylize', 'retro', 'scanlines', 'crt'], continuous: true,
    params: {
      amount: { default: 0.35, min: 0, max: 1, desc: 'scanline darkness' },
      gap: { default: 3, min: 2, max: 8, unit: 'px', desc: 'line spacing' },
    },
    defaultDuration: 5, apply: (_p, prm) => {
      const g = Math.round(prm.gap);
      return { css: {
        backgroundImage: `repeating-linear-gradient(0deg, rgba(0,0,0,${prm.amount}) 0px, rgba(0,0,0,${prm.amount}) 1px, rgba(0,0,0,0) ${Math.max(2, g - 1)}px, rgba(0,0,0,0) ${g}px)`,
      } };
    },
  },
  {
    id: 'overlay.grain', category: 'overlay',
    description: 'overlay subtle monochrome film grain over everything beneath using deterministic SVG noise (analog texture; no flicker, stable across frames)',
    tags: ['stylize', 'film', 'grain', 'analog', 'texture'], continuous: true,
    params: { amount: { default: 0.5, min: 0, max: 1, desc: 'grain opacity' } },
    defaultDuration: 5, apply: (_p, prm) => ({
      // Element opacity (numeric StyleDelta field) carries the grain strength — the
      // runtime folds it into the overlay's composed opacity; do NOT set css.opacity
      // (that would clobber the overlay opacity the runtime sets explicitly).
      opacity: 0.06 + prm.amount * 0.22,
      css: {
        // Inline SVG turbulence as a tiled background image (paint-on-top). Fixed seed
        // => identical every frame => deterministic. Tile is small and repeated.
        backgroundImage: "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' seed='7' stitchTiles='stitch'/><feColorMatrix type='matrix' values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0'/></filter><rect width='120' height='120' filter='url(%23n)'/></svg>\")",
        backgroundRepeat: 'repeat',
        mixBlendMode: 'overlay',
      },
    }),
  },
  {
    id: 'overlay.vignette-soft', category: 'overlay',
    description: 'a gentle soft-edged vignette that subtly darkens the corners (lighter than the standard vignette) to settle the frame',
    tags: ['cinematic', 'vignette', 'subtle'], continuous: true,
    params: { amount: { default: 0.45, min: 0, max: 1 } },
    defaultDuration: 5, apply: (_p, prm) => ({ css: { boxShadow: `inset 0 0 220px ${70 * prm.amount}px rgba(0,0,0,${0.5 * prm.amount})` } }),
  },
];
