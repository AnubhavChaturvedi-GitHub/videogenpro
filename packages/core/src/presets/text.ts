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
  {
    id: 'text.drop', category: 'text', description: 'Text drops in from above and settles with a soft bounce.',
    tags: ['enter', 'vertical', 'bouncy'], params: { distance: { default: 80, min: 0, max: 400, unit: 'px' } },
    defaultDuration: 0.6, apply: (p, prm) => { const e = ease('easeOutBack', p); return { y: -(1 - e) * prm.distance, opacity: ease('easeOut', p) }; },
  },
  {
    id: 'text.slam', category: 'text', description: 'Headline slams in from oversized with an impact blur — high energy.',
    tags: ['enter', 'impact', 'bold'], params: { from: { default: 1.8, min: 1, max: 4, desc: 'start scale' } },
    defaultDuration: 0.5, apply: (p, prm) => { const e = ease('easeOutCubic', p); return { scale: prm.from - (prm.from - 1) * e, opacity: ease('easeOut', p), blur: (1 - e) * 12 }; },
  },
  {
    id: 'text.expand', category: 'text', description: 'Letters spread apart from tight tracking while fading in.',
    tags: ['enter', 'elegant', 'tracking'], params: { spacing: { default: 24, min: 0, max: 80, unit: 'px' } },
    defaultDuration: 0.7, apply: (p, prm) => { const e = ease('easeOutCubic', p); return { opacity: e, css: { letterSpacing: `${(1 - e) * -prm.spacing}px` } }; },
  },
  {
    id: 'text.glitch', category: 'text', description: 'Digital glitch with RGB split that snaps into clean text.',
    tags: ['enter', 'glitch', 'tech'], params: { amount: { default: 6, min: 0, max: 24, unit: 'px' } },
    defaultDuration: 0.6, apply: (p, prm, ctx) => {
      const e = ease('easeOutCubic', p); const j = (1 - e) * prm.amount;
      return { x: Math.sin(ctx.time * 60) * j, opacity: ease('easeOut', p), css: { textShadow: `${j}px 0 #ff00d4, ${-j}px 0 #00e5ff` } };
    },
  },
  {
    id: 'text.char-wave', category: 'text', description: 'Characters ripple up and down in a continuous wave.', split: 'char',
    tags: ['ambient', 'loop', 'playful'], continuous: true,
    params: { amplitude: { default: 14, min: 0, max: 60, unit: 'px' }, speed: { default: 3, min: 0.5, max: 10 } },
    defaultDuration: 5, apply: (_p, prm, ctx) => ({ y: Math.sin(ctx.time * prm.speed + ctx.index * 0.5) * prm.amplitude }),
  },
  {
    id: 'text.gradient-sweep', category: 'text', description: 'A color gradient sweeps continuously across the letters.',
    tags: ['ambient', 'loop', 'vibrant'], continuous: true,
    params: { speed: { default: 0.4, min: 0.1, max: 2 } },
    defaultDuration: 5, apply: (_p, prm, ctx) => ({
      css: {
        backgroundImage: 'linear-gradient(90deg,#fff,#a78bfa,#6ea8fe,#34d399,#fff)',
        backgroundSize: '200% 100%', backgroundRepeat: 'no-repeat',
        backgroundPosition: `${(-(ctx.time * prm.speed) % 1) * 200}% 0`,
        webkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent',
      },
    }),
  },
  {
    id: 'text.neon-glow', category: 'text', description: 'Soft neon glow that pulses around the text.',
    tags: ['ambient', 'loop', 'neon'], continuous: true,
    params: { intensity: { default: 14, min: 0, max: 40, unit: 'px' } },
    defaultDuration: 5, apply: (_p, prm, ctx) => ({ css: { textShadow: `0 0 ${prm.intensity * (0.6 + 0.4 * Math.sin(ctx.time * 3))}px currentColor` } }),
  },
  {
    id: 'text.highlight', category: 'text', description: 'A marker sweeps a highlight bar behind the text (best on a fitted box).',
    tags: ['emphasis', 'marker'], params: { color: { default: 0, desc: '0=violet 1=lime 2=pink (visual)' } },
    defaultDuration: 0.8, apply: (p) => {
      const e = ease('easeInOutCubic', p);
      return { css: { backgroundImage: 'linear-gradient(transparent 58%, rgba(167,139,250,.55) 58%)', backgroundRepeat: 'no-repeat', backgroundSize: `${e * 100}% 100%` } };
    },
  },
];
