import type { Preset } from '../preset';
import { ease, clamp01 } from '../easing';

// Per-element progress with stagger. staggerFrac in [0,~0.5): fraction of total
// duration that each successive element is delayed by.
const staggered = (p: number, ctx: { index: number; count: number }, staggerFrac: number): number => {
  if (ctx.count <= 1 || staggerFrac <= 0) return clamp01(p);
  const total = 1 + (ctx.count - 1) * staggerFrac;
  const span = 1 / total;
  const startAt = ctx.index * staggerFrac * span;
  return clamp01((p - startAt) / span);
};

export const textPresets: Preset[] = [
  {
    id: 'text.fade-up',
    category: 'text',
    description: 'Text rises from below while fading in, with a soft ease-out.',
    tags: ['enter', 'subtle', 'vertical'],
    params: { distance: { default: 40, min: 0, max: 300, unit: 'px' } },
    defaultDuration: 0.6,
    apply: (p, prm) => {
      const e = ease('easeOutCubic', p);
      return { y: (1 - e) * prm.distance, opacity: e };
    },
  },
  {
    id: 'text.word-stagger',
    category: 'text',
    description: 'Words appear one after another, each fading up — great for headlines.',
    tags: ['enter', 'stagger', 'headline'],
    split: 'word',
    params: {
      distance: { default: 30, min: 0, max: 200, unit: 'px' },
      stagger: { default: 0.18, min: 0, max: 0.5, desc: 'delay fraction per word' },
    },
    defaultDuration: 1.0,
    apply: (p, prm, ctx) => {
      const pe = staggered(p, ctx, prm.stagger);
      const e = ease('easeOutCubic', pe);
      return { y: (1 - e) * prm.distance, opacity: e };
    },
  },
  {
    id: 'text.typewriter',
    category: 'text',
    description: 'Characters reveal left to right like typing.',
    tags: ['enter', 'char', 'retro'],
    split: 'char',
    params: { stagger: { default: 0.04, min: 0, max: 0.3, desc: 'delay fraction per char' } },
    defaultDuration: 1.2,
    apply: (p, prm, ctx) => {
      const pe = staggered(p, ctx, prm.stagger);
      return { opacity: pe > 0 ? 1 : 0 };
    },
  },
  {
    id: 'text.pop',
    category: 'text',
    description: 'Text pops in from small with a springy overshoot.',
    tags: ['enter', 'bouncy', 'emphasis'],
    params: { from: { default: 0.6, min: 0, max: 1, desc: 'starting scale' } },
    defaultDuration: 0.5,
    apply: (p, prm) => {
      const e = ease('easeOutBack', p);
      return { scale: prm.from + (1 - prm.from) * e, opacity: ease('easeOut', p) };
    },
  },
  {
    id: 'text.blur-in',
    category: 'text',
    description: 'Text sharpens into focus from a soft blur while fading in.',
    tags: ['enter', 'soft', 'cinematic'],
    params: { blur: { default: 16, min: 0, max: 60, unit: 'px' } },
    defaultDuration: 0.7,
    apply: (p, prm) => {
      const e = ease('easeOutCubic', p);
      return { blur: (1 - e) * prm.blur, opacity: e };
    },
  },
];
