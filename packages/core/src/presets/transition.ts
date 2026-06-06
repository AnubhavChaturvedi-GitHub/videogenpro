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
];
