import type { Preset } from '../preset';
import { ease } from '../easing';

// Generic ENTER (fade-in) animations — work on any layer type.
export const enterPresets: Preset[] = [
  {
    id: 'in.fade', category: 'in', description: 'Simple fade in from transparent.',
    tags: ['enter', 'subtle'], params: {}, defaultDuration: 0.6,
    apply: (p) => ({ opacity: ease('easeOutCubic', p) }),
  },
  {
    id: 'in.slide-left', category: 'in', description: 'Slides in from the left while fading in.',
    tags: ['enter', 'directional'], params: { distance: { default: 120, min: 0, max: 800, unit: 'px' } },
    defaultDuration: 0.6, apply: (p, prm) => { const e = ease('easeOutCubic', p); return { x: -(1 - e) * prm.distance, opacity: e }; },
  },
  {
    id: 'in.slide-right', category: 'in', description: 'Slides in from the right while fading in.',
    tags: ['enter', 'directional'], params: { distance: { default: 120, min: 0, max: 800, unit: 'px' } },
    defaultDuration: 0.6, apply: (p, prm) => { const e = ease('easeOutCubic', p); return { x: (1 - e) * prm.distance, opacity: e }; },
  },
  {
    id: 'in.slide-up', category: 'in', description: 'Rises up into place while fading in.',
    tags: ['enter', 'vertical'], params: { distance: { default: 80, min: 0, max: 600, unit: 'px' } },
    defaultDuration: 0.6, apply: (p, prm) => { const e = ease('easeOutCubic', p); return { y: (1 - e) * prm.distance, opacity: e }; },
  },
  {
    id: 'in.scale', category: 'in', description: 'Grows in from small while fading in.',
    tags: ['enter', 'punchy'], params: { from: { default: 0.7, min: 0, max: 1, desc: 'start scale' } },
    defaultDuration: 0.6, apply: (p, prm) => { const e = ease('easeOutCubic', p); return { scale: prm.from + (1 - prm.from) * e, opacity: e }; },
  },
  {
    id: 'in.spin', category: 'in', description: 'Spins and scales into place.',
    tags: ['enter', 'playful'], params: { turns: { default: 0.5, min: 0, max: 3, desc: 'rotations' } },
    defaultDuration: 0.7, apply: (p, prm) => { const e = ease('easeOutBack', p); return { rotate: (1 - e) * prm.turns * 360, scale: 0.4 + 0.6 * e, opacity: ease('easeOut', p) }; },
  },
  {
    id: 'in.blur', category: 'in', description: 'Sharpens into focus from a soft blur while fading in.',
    tags: ['enter', 'soft', 'cinematic'], params: { blur: { default: 18, min: 0, max: 60, unit: 'px' } },
    defaultDuration: 0.6, apply: (p, prm) => { const e = ease('easeOutCubic', p); return { blur: (1 - e) * prm.blur, opacity: e }; },
  },
  {
    id: 'in.zoom', category: 'in', description: 'Zooms in from larger than life and settles to size.',
    tags: ['enter', 'punchy'], params: { from: { default: 1.4, min: 1, max: 3, desc: 'start scale' } },
    defaultDuration: 0.6, apply: (p, prm) => { const e = ease('easeOutCubic', p); return { scale: prm.from - (prm.from - 1) * e, opacity: ease('easeOut', p) }; },
  },
  {
    id: 'in.drop', category: 'in', description: 'Drops in from above with a soft bounce.',
    tags: ['enter', 'vertical', 'bouncy'], params: { distance: { default: 120, min: 0, max: 600, unit: 'px' } },
    defaultDuration: 0.6, apply: (p, prm) => { const e = ease('easeOutBack', p); return { y: -(1 - e) * prm.distance, opacity: ease('easeOut', p) }; },
  },
  {
    id: 'in.flip-x', category: 'in', description: 'Flips in around the horizontal axis (3D card flip).',
    tags: ['enter', '3d'], params: {}, defaultDuration: 0.6,
    apply: (p) => { const e = ease('easeOutCubic', p); return { opacity: ease('easeOut', p), css: { transform: `perspective(1000px) rotateX(${(1 - e) * 90}deg)` } }; },
  },
  {
    id: 'in.flip-y', category: 'in', description: 'Flips in around the vertical axis (3D card flip).',
    tags: ['enter', '3d'], params: {}, defaultDuration: 0.6,
    apply: (p) => { const e = ease('easeOutCubic', p); return { opacity: ease('easeOut', p), css: { transform: `perspective(1000px) rotateY(${(1 - e) * 90}deg)` } }; },
  },
  {
    id: 'in.skew', category: 'in', description: 'Slides in with a dynamic skew that straightens out.',
    tags: ['enter', 'energetic'], params: { skew: { default: 20, min: 0, max: 60, unit: 'deg' }, distance: { default: 80, min: 0, max: 400, unit: 'px' } },
    defaultDuration: 0.55, apply: (p, prm) => { const e = ease('easeOutCubic', p); return { x: (1 - e) * prm.distance, opacity: ease('easeOut', p), css: { transform: `skewX(${(1 - e) * -prm.skew}deg)` } }; },
  },
  {
    id: 'in.slide-down', category: 'in', description: 'Descends from above into place while fading in.',
    tags: ['enter', 'vertical', 'directional'], params: { distance: { default: 80, min: 0, max: 600, unit: 'px' } },
    defaultDuration: 0.6, apply: (p, prm) => { const e = ease('easeOutCubic', p); return { y: -(1 - e) * prm.distance, opacity: e }; },
  },
  {
    id: 'in.fade-down', category: 'in', description: 'Gently fades in while drifting down a short distance — soft top-down entrance.',
    tags: ['enter', 'vertical', 'subtle'], params: { distance: { default: 40, min: 0, max: 300, unit: 'px' } },
    defaultDuration: 0.6, apply: (p, prm) => { const e = ease('easeOutCubic', p); return { y: -(1 - e) * prm.distance, opacity: e }; },
  },
  {
    id: 'in.bounce', category: 'in', description: 'Drops in from above and settles with a springy overshoot bounce.',
    tags: ['enter', 'vertical', 'bouncy', 'playful'], params: { distance: { default: 140, min: 0, max: 600, unit: 'px' } },
    defaultDuration: 0.8, apply: (p, prm) => { const e = ease('easeOutBack', p); return { y: -(1 - e) * prm.distance, scale: 0.9 + 0.1 * ease('easeOutBack', p), opacity: ease('easeOut', p) }; },
  },
  {
    id: 'in.unfold', category: 'in', description: 'Unfolds open around the horizontal axis from a closed flap (3D rotateX) while fading in.',
    tags: ['enter', '3d', 'unfold'], params: { angle: { default: 90, min: 0, max: 90, unit: 'deg', desc: 'start fold angle' } },
    defaultDuration: 0.7, apply: (p, prm) => { const e = ease('easeOutCubic', p); return { opacity: ease('easeOut', p), css: { transform: `perspective(1200px) rotateX(${-(1 - e) * prm.angle}deg)`, transformOrigin: 'top center' } }; },
  },
  {
    id: 'in.zoom-blur-in', category: 'in', description: 'Rushes in from oversized with heavy motion blur that snaps into focus — high-impact arrival.',
    tags: ['enter', 'punchy', 'impact', 'blur'], params: { from: { default: 1.6, min: 1, max: 3, desc: 'start scale' }, blur: { default: 20, min: 0, max: 60, unit: 'px' } },
    defaultDuration: 0.55, apply: (p, prm) => { const e = ease('easeOutCubic', p); return { scale: prm.from - (prm.from - 1) * e, blur: (1 - e) * prm.blur, opacity: ease('easeOut', p) }; },
  },
  {
    id: 'in.rise-rotate', category: 'in', description: 'Rises up while un-tilting from a slight rotation — an elegant, slightly off-kilter entrance.',
    tags: ['enter', 'elegant', 'rotate'], params: { distance: { default: 70, min: 0, max: 400, unit: 'px' }, angle: { default: 8, min: 0, max: 30, unit: 'deg' } },
    defaultDuration: 0.7, apply: (p, prm) => { const e = ease('easeOutCubic', p); return { y: (1 - e) * prm.distance, rotate: (1 - e) * prm.angle, opacity: e }; },
  },
];
