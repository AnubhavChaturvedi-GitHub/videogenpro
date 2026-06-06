import type { Preset } from '../preset';
import { ease, clamp01 } from '../easing';

export const imagePresets: Preset[] = [
  {
    id: 'image.ken-burns',
    category: 'image',
    description: 'Slow cinematic zoom and pan across the image (the classic documentary move).',
    tags: ['ambient', 'cinematic', 'crop'],
    continuous: true,
    params: {
      zoom: { default: 0.2, min: 0, max: 1, desc: 'extra scale gained over the layer' },
      panX: { default: 0.06, min: -0.5, max: 0.5, desc: 'horizontal drift (fraction)' },
      panY: { default: 0.0, min: -0.5, max: 0.5, desc: 'vertical drift (fraction)' },
    },
    defaultDuration: 5,
    apply: (p, prm) => {
      const e = ease('easeInOut', p);
      return {
        scale: 1 + prm.zoom * e,
        x: prm.panX * 200 * e,
        y: prm.panY * 200 * e,
      };
    },
  },
  {
    id: 'image.float',
    category: 'image',
    description: 'Gentle continuous up-and-down bob, as if floating.',
    tags: ['ambient', 'loop', 'subtle'],
    continuous: true,
    params: {
      amplitude: { default: 12, min: 0, max: 80, unit: 'px' },
      cycles: { default: 1.5, min: 0.25, max: 8, desc: 'oscillations over the layer' },
    },
    defaultDuration: 5,
    apply: (p, prm) => ({ y: Math.sin(p * Math.PI * 2 * prm.cycles) * prm.amplitude }),
  },
  {
    id: 'image.reveal-wipe',
    category: 'image',
    description: 'Image is revealed by a wipe sliding in from a chosen edge.',
    tags: ['enter', 'reveal', 'wipe'],
    params: {
      from: { default: 3, min: 0, max: 3, desc: '0=top 1=right 2=bottom 3=left' },
    },
    defaultDuration: 0.8,
    apply: (p, prm) => {
      const e = ease('easeInOutCubic', p);
      const hidden = (1 - e) * 100;
      const edge = Math.round(clamp01(prm.from / 3) * 3);
      const inset: [number, number, number, number] = [0, 0, 0, 0];
      inset[edge] = hidden; // top,right,bottom,left
      return { clipInset: inset };
    },
  },
  {
    id: 'image.zoom-in',
    category: 'image',
    description: 'Image scales up from slightly small while fading in — punchy entrance.',
    tags: ['enter', 'punchy'],
    params: { from: { default: 0.8, min: 0, max: 1, desc: 'starting scale' } },
    defaultDuration: 0.7,
    apply: (p, prm) => {
      const e = ease('easeOutCubic', p);
      return { scale: prm.from + (1 - prm.from) * e, opacity: e };
    },
  },
  {
    id: 'image.sketch',
    category: 'image',
    description: 'Renders the image as a hand-drawn pencil sketch (edge-detected line art), then dissolves to the real photo.',
    tags: ['stylize', 'sketch', 'line-art', 'reveal'],
    continuous: true,
    params: { hold: { default: 0.6, min: 0, max: 1, desc: 'fraction held as sketch before dissolving (1 = stays a sketch)' } },
    defaultDuration: 4,
    apply: (p, prm) => {
      // Crossfade from the SVG sketch filter to the real image after `hold`.
      const fade = prm.hold >= 1 ? 0 : ease('easeInOutCubic', Math.max(0, (p - prm.hold) / (1 - prm.hold)));
      // Reduce filter strength as we dissolve to the photo.
      return fade >= 1 ? {} : { css: { filter: `url(#vgp-sketch)`, opacity: String(1 - fade * 0) } };
    },
  },
  {
    id: 'image.tilt-3d',
    category: 'image',
    description: 'Gentle 3D perspective tilt that settles flat — gives a photo physical depth.',
    tags: ['3d', 'depth', 'cinematic'],
    params: { angle: { default: 12, min: 0, max: 40, unit: 'deg' } },
    defaultDuration: 1.2,
    apply: (p, prm) => {
      const e = ease('easeOutCubic', p);
      return { css: { transform: `perspective(1200px) rotateY(${(1 - e) * prm.angle}deg)` }, opacity: ease('easeOut', p) };
    },
  },
];
