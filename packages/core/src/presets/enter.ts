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
];
