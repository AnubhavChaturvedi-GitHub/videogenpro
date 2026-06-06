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
    defaultDuration: 5, apply: (_p, prm) => ({ opacity: 1 - prm.amount }),
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
];
