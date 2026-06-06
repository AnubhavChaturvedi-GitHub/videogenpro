import type { Preset } from '../preset';
import { ease } from '../easing';

// Generic EXIT (fade-out) animations — play over the LAST `duration` seconds.
// fromEnd:true tells the runtime to run progress 0->1 at the layer's tail.
export const exitPresets: Preset[] = [
  {
    id: 'out.fade', category: 'out', description: 'Simple fade out to transparent.',
    tags: ['exit', 'subtle'], params: {}, defaultDuration: 0.6, fromEnd: true,
    apply: (p) => ({ opacity: 1 - ease('easeIn', p) }),
  },
  {
    id: 'out.slide-right', category: 'out', description: 'Slides off to the right while fading out.',
    tags: ['exit', 'directional'], params: { distance: { default: 120, min: 0, max: 800, unit: 'px' } },
    defaultDuration: 0.6, fromEnd: true,
    apply: (p, prm) => { const e = ease('easeIn', p); return { x: e * prm.distance, opacity: 1 - e }; },
  },
  {
    id: 'out.slide-down', category: 'out', description: 'Drops down and out while fading.',
    tags: ['exit', 'vertical'], params: { distance: { default: 80, min: 0, max: 600, unit: 'px' } },
    defaultDuration: 0.6, fromEnd: true,
    apply: (p, prm) => { const e = ease('easeIn', p); return { y: e * prm.distance, opacity: 1 - e }; },
  },
  {
    id: 'out.scale-down', category: 'out', description: 'Shrinks away while fading out.',
    tags: ['exit', 'punchy'], params: { to: { default: 0.7, min: 0, max: 1, desc: 'end scale' } },
    defaultDuration: 0.6, fromEnd: true,
    apply: (p, prm) => { const e = ease('easeIn', p); return { scale: 1 - (1 - prm.to) * e, opacity: 1 - e }; },
  },
  {
    id: 'out.blur', category: 'out', description: 'Blurs out of focus while fading.',
    tags: ['exit', 'soft'], params: { blur: { default: 16, min: 0, max: 60, unit: 'px' } },
    defaultDuration: 0.6, fromEnd: true,
    apply: (p, prm) => { const e = ease('easeIn', p); return { blur: e * prm.blur, opacity: 1 - e }; },
  },
  {
    id: 'out.zoom-out', category: 'out', description: 'Pushes toward the viewer and fades away.',
    tags: ['exit', 'punchy'], params: { to: { default: 1.4, min: 1, max: 3, desc: 'end scale' } },
    defaultDuration: 0.5, fromEnd: true, apply: (p, prm) => { const e = ease('easeIn', p); return { scale: 1 + (prm.to - 1) * e, opacity: 1 - e }; },
  },
  {
    id: 'out.slide-left', category: 'out', description: 'Slides off to the left while fading out.',
    tags: ['exit', 'directional'], params: { distance: { default: 120, min: 0, max: 800, unit: 'px' } },
    defaultDuration: 0.6, fromEnd: true, apply: (p, prm) => { const e = ease('easeIn', p); return { x: -e * prm.distance, opacity: 1 - e }; },
  },
  {
    id: 'out.slide-up', category: 'out', description: 'Lifts up and out while fading.',
    tags: ['exit', 'vertical'], params: { distance: { default: 90, min: 0, max: 600, unit: 'px' } },
    defaultDuration: 0.6, fromEnd: true, apply: (p, prm) => { const e = ease('easeIn', p); return { y: -e * prm.distance, opacity: 1 - e }; },
  },
  {
    id: 'out.spin', category: 'out', description: 'Spins and shrinks away.',
    tags: ['exit', 'playful'], params: { turns: { default: 0.6, min: 0, max: 3 } },
    defaultDuration: 0.6, fromEnd: true, apply: (p, prm) => { const e = ease('easeIn', p); return { rotate: e * prm.turns * 360, scale: 1 - 0.6 * e, opacity: 1 - e }; },
  },
  {
    id: 'out.pop', category: 'out', description: 'Quick scale-up flicker then vanishes.',
    tags: ['exit', 'snappy'], params: {}, defaultDuration: 0.4, fromEnd: true,
    apply: (p) => { const e = ease('easeIn', p); return { scale: 1 + 0.25 * Math.sin(e * Math.PI), opacity: 1 - e }; },
  },
  {
    id: 'out.zoom-in', category: 'out', description: 'Recedes into the distance, shrinking away as it fades out.',
    tags: ['exit', 'punchy', 'recede'], params: { to: { default: 0.4, min: 0, max: 1, desc: 'end scale (smaller = further away)' } },
    defaultDuration: 0.5, fromEnd: true, apply: (p, prm) => { const e = ease('easeInCubic', p); return { scale: 1 - (1 - prm.to) * e, opacity: 1 - e }; },
  },
  {
    id: 'out.glitch-out', category: 'out', description: 'Tears apart with an RGB-split glitch and horizontal jitter as it fades — a digital crash exit.',
    tags: ['exit', 'glitch', 'tech'], params: { amount: { default: 10, min: 0, max: 40, unit: 'px' } }, defaultDuration: 0.5, fromEnd: true,
    apply: (p, prm, ctx) => {
      const e = ease('easeIn', p); const j = Math.sin(ctx.time * 70) * prm.amount * e;
      return { x: j, opacity: 1 - e, css: { filter: 'url(#vgp-rgb-split)' } };
    },
  },
  {
    id: 'out.dissolve', category: 'out', description: 'Softly blurs and brightens as it dissolves away into light.',
    tags: ['exit', 'soft', 'dreamy'], params: { blur: { default: 14, min: 0, max: 50, unit: 'px' } }, defaultDuration: 0.7, fromEnd: true,
    apply: (p, prm) => { const e = ease('easeInOutCubic', p); return { blur: e * prm.blur, brightness: 1 + e * 0.4, opacity: 1 - e }; },
  },
  {
    id: 'out.fall', category: 'out', description: 'Topples over with a tilt and drops down off-screen, accelerating as it falls away.',
    tags: ['exit', 'gravity', 'playful'], params: { distance: { default: 200, min: 0, max: 800, unit: 'px' }, angle: { default: 25, min: 0, max: 90, unit: 'deg' } },
    defaultDuration: 0.7, fromEnd: true, apply: (p, prm) => { const e = ease('easeInCubic', p); return { y: e * prm.distance, rotate: e * prm.angle, opacity: 1 - ease('easeIn', p) }; },
  },
];
