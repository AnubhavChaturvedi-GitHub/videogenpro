import type { Preset } from '../preset';
import { ease } from '../easing';

// Transitions style the outgoing scene (from) and incoming scene (to) across p=0..1.
export const transitionPresets: Preset[] = [
  {
    id: 'transition.crossfade',
    category: 'transition',
    description: 'Outgoing scene fades out as the incoming scene fades in.',
    tags: ['classic', 'soft'],
    params: {},
    defaultDuration: 0.6,
    transition: (p) => {
      const e = ease('easeInOut', p);
      return { from: { opacity: 1 - e }, to: { opacity: e } };
    },
  },
  {
    id: 'transition.slide',
    category: 'transition',
    description: 'Incoming scene pushes the old one off to the side.',
    tags: ['directional', 'energetic'],
    params: { dir: { default: 0, min: 0, max: 1, desc: '0=left 1=right' } },
    defaultDuration: 0.7,
    transition: (p, prm) => {
      const e = ease('easeInOutCubic', p);
      const sign = prm.dir >= 0.5 ? 1 : -1;
      return {
        from: { css: { transform: `translateX(${-sign * e * 100}%)` }, opacity: 1 },
        to: { css: { transform: `translateX(${sign * (1 - e) * 100}%)` }, opacity: 1 },
      };
    },
  },
  {
    id: 'transition.zoom',
    category: 'transition',
    description: 'Old scene zooms out while the new scene zooms in through it.',
    tags: ['punchy', 'modern'],
    params: {},
    defaultDuration: 0.6,
    transition: (p) => {
      const e = ease('easeInOutCubic', p);
      return {
        from: { scale: 1 + 0.3 * e, opacity: 1 - e },
        to: { scale: 0.7 + 0.3 * e, opacity: e },
      };
    },
  },
  {
    id: 'transition.wipe',
    category: 'transition',
    description: 'New scene is wiped in over the old one from the left edge.',
    tags: ['clean', 'directional'],
    params: {},
    defaultDuration: 0.6,
    transition: (p) => {
      const e = ease('easeInOutCubic', p);
      return {
        from: { opacity: 1 },
        to: { clipInset: [0, (1 - e) * 100, 0, 0], opacity: 1 },
      };
    },
  },
  {
    id: 'transition.dissolve', category: 'transition', description: 'Soft blurred crossfade — dreamy dissolve between scenes.',
    tags: ['soft', 'blur'], params: { blur: { default: 12, min: 0, max: 40, unit: 'px' } }, defaultDuration: 0.7,
    transition: (p, prm) => { const e = ease('easeInOut', p); return { from: { opacity: 1 - e, blur: e * prm.blur }, to: { opacity: e, blur: (1 - e) * prm.blur } }; },
  },
  {
    id: 'transition.push-up', category: 'transition', description: 'Incoming scene pushes the old one upward off-screen.',
    tags: ['directional', 'energetic'], params: {}, defaultDuration: 0.6,
    transition: (p) => { const e = ease('easeInOutCubic', p); return { from: { css: { transform: `translateY(${-e * 100}%)` } }, to: { css: { transform: `translateY(${(1 - e) * 100}%)` } } }; },
  },
  {
    id: 'transition.circle-iris', category: 'transition', description: 'New scene irises open through an expanding circle.',
    tags: ['shape', 'reveal'], params: {}, defaultDuration: 0.7,
    transition: (p) => { const e = ease('easeInOutCubic', p); return { from: { opacity: 1 }, to: { opacity: 1, css: { clipPath: `circle(${e * 75}% at 50% 50%)` } } }; },
  },
  {
    id: 'transition.flip-3d', category: 'transition', description: 'Scenes flip like the two faces of a rotating card.',
    tags: ['3d', 'modern'], params: {}, defaultDuration: 0.7,
    transition: (p) => {
      const e = ease('easeInOutCubic', p);
      return {
        from: { opacity: e < 0.5 ? 1 : 0, css: { transform: `perspective(1400px) rotateY(${-e * 90}deg)` } },
        to: { opacity: e < 0.5 ? 0 : 1, css: { transform: `perspective(1400px) rotateY(${(1 - e) * 90}deg)` } },
      };
    },
  },
  {
    id: 'transition.zoom-blur', category: 'transition', description: 'Old scene rushes forward with motion blur as the new one zooms in.',
    tags: ['punchy', 'cinematic'], params: {}, defaultDuration: 0.6,
    transition: (p) => { const e = ease('easeInOutCubic', p); return { from: { scale: 1 + 0.5 * e, opacity: 1 - e, blur: e * 14 }, to: { scale: 0.75 + 0.25 * e, opacity: e, blur: (1 - e) * 14 } }; },
  },
  {
    id: 'transition.dip-black', category: 'transition', description: 'Dips through black between scenes (classic film cut).',
    tags: ['classic', 'dramatic'], params: {}, defaultDuration: 0.7,
    transition: (p) => { const e = ease('easeInOut', p); return { from: { opacity: e < 0.5 ? 1 : 0, brightness: Math.max(0, 1 - 2 * e) }, to: { opacity: e < 0.5 ? 0 : 1, brightness: Math.max(0, 2 * e - 1) } }; },
  },
  {
    id: 'transition.glitch', category: 'transition', description: 'Glitchy digital tear between scenes.',
    tags: ['glitch', 'tech'], params: { amount: { default: 16, min: 0, max: 60, unit: 'px' } }, defaultDuration: 0.5,
    transition: (p, prm) => {
      const e = ease('easeInOut', p); const j = Math.sin(p * 90) * prm.amount;
      return { from: { opacity: 1 - e, x: j * (1 - e), css: { filter: `hue-rotate(${(1 - e) * 60}deg)` } }, to: { opacity: e, x: j * e } };
    },
  },
  {
    id: 'transition.spin', category: 'transition', description: 'Scenes whirl out and in with a rotating zoom.',
    tags: ['playful', 'dynamic'], params: {}, defaultDuration: 0.7,
    transition: (p) => { const e = ease('easeInOutCubic', p); return { from: { rotate: e * 35, scale: 1 - 0.5 * e, opacity: 1 - e }, to: { rotate: -(1 - e) * 35, scale: 0.5 + 0.5 * e, opacity: e } }; },
  },
];
