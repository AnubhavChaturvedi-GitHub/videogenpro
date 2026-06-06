import type { Preset } from '../preset';
import { ease } from '../easing';

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
    description: 'Image is revealed by a wipe sliding in from a chosen edge. `from` picks the edge: 0=top, 1=right, 2=bottom, 3=left.',
    tags: ['enter', 'reveal', 'wipe'],
    params: {
      // Integer edge selector (rounded in apply). clipInset order is
      // [top, right, bottom, left], so the value maps 1:1 to that index.
      from: { default: 3, min: 0, max: 3, desc: 'integer edge to wipe from: 0=top, 1=right, 2=bottom, 3=left' },
    },
    defaultDuration: 0.8,
    apply: (p, prm) => {
      const e = ease('easeInOutCubic', p);
      const hidden = (1 - e) * 100;
      // Clamp + round to one of the four valid edge indices (deterministic).
      const edge = Math.min(3, Math.max(0, Math.round(prm.from)));
      const inset: [number, number, number, number] = [0, 0, 0, 0];
      inset[edge] = hidden; // [top, right, bottom, left]
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
    description: 'Starts as a hand-drawn pencil sketch (edge-detected line art) and genuinely dissolves to the real photo: the sketch filter holds, then the line-art weight fades out as the photo\'s natural color/contrast blooms back in.',
    tags: ['stylize', 'sketch', 'line-art', 'reveal'],
    continuous: true,
    params: { hold: { default: 0.6, min: 0, max: 1, desc: 'fraction held as full sketch before dissolving (1 = stays a sketch forever)' } },
    defaultDuration: 4,
    apply: (p, prm) => {
      // `fade` goes 0 -> 1 over the post-`hold` portion of the layer.
      const fade = prm.hold >= 1 ? 0 : ease('easeInOutCubic', Math.max(0, (p - prm.hold) / (1 - prm.hold)));
      // A single element can't crossfade a url() filter against itself, so we
      // honestly reveal the photo by ramping the filter chain:
      //   - keep the SVG sketch filter, but drive its weight down via grayscale
      //     + brightness so the white-on-line-art look gives way to the photo;
      //   - let saturate/contrast bloom from washed-out back to the real photo.
      // Always return an explicit `filter` across the whole range (never leave
      // stale CSS) and land on a clean `filter: none` at the end.
      if (fade >= 1) return { css: { filter: 'none' } };
      if (fade <= 0) return { css: { filter: 'url(#vgp-sketch)' } };
      // Mid-dissolve: combine a fading sketch pass with a reviving photo grade.
      const sat = fade;                 // 0 (gray sketch) -> 1 (full color)
      const gray = 1 - fade;            // 1 (line art)    -> 0 (photo)
      return {
        css: {
          filter: `url(#vgp-sketch) grayscale(${gray}) saturate(${0.2 + sat * 0.8}) contrast(${1 + gray * 0.25}) brightness(${1 - gray * 0.08})`,
        },
      };
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
  {
    id: 'image.zoom-out', category: 'image', description: 'Slow continuous zoom OUT — starts close, pulls back.',
    tags: ['ambient', 'cinematic'], continuous: true,
    params: { from: { default: 1.3, min: 1, max: 2, desc: 'start scale' } },
    defaultDuration: 5, apply: (p, prm) => ({ scale: prm.from - (prm.from - 1) * ease('easeInOut', p) }),
  },
  {
    id: 'image.breathe', category: 'image', description: 'Gentle continuous scale pulse, like a slow breath.',
    tags: ['ambient', 'loop', 'subtle'], continuous: true,
    params: { amount: { default: 0.04, min: 0, max: 0.2 }, speed: { default: 1, min: 0.2, max: 4 } },
    defaultDuration: 5, apply: (_p, prm, ctx) => ({ scale: 1 + Math.sin(ctx.time * prm.speed) * prm.amount }),
  },
  {
    id: 'image.grayscale-reveal', category: 'image', description: 'Image starts grayscale and blooms into full color.',
    tags: ['stylize', 'reveal', 'color'], continuous: true,
    params: { hold: { default: 0.3, min: 0, max: 1, desc: 'fraction held gray before color' } },
    defaultDuration: 4, apply: (p, prm) => {
      const e = ease('easeInOutCubic', prm.hold >= 1 ? 0 : Math.max(0, (p - prm.hold) / (1 - prm.hold)));
      return { css: { filter: `saturate(${e}) contrast(${1 + (1 - e) * 0.1})` } };
    },
  },
  {
    id: 'image.blur-reveal', category: 'image', description: 'Image sharpens from a heavy blur while fading in.',
    tags: ['enter', 'soft', 'cinematic'], params: { blur: { default: 24, min: 0, max: 80, unit: 'px' } },
    defaultDuration: 0.8, apply: (p, prm) => { const e = ease('easeOutCubic', p); return { blur: (1 - e) * prm.blur, opacity: e }; },
  },
  {
    id: 'image.swing', category: 'image', description: 'Image swings in on a slight tilt and settles upright.',
    tags: ['enter', 'playful'], params: { angle: { default: 8, min: 0, max: 30, unit: 'deg' } },
    defaultDuration: 0.7, apply: (p, prm) => { const e = ease('easeOutBack', p); return { rotate: -(1 - e) * prm.angle, scale: 0.85 + 0.15 * e, opacity: ease('easeOut', p) }; },
  },
  {
    id: 'image.duotone', category: 'image', description: 'Stylized duotone color grade applied to the image.',
    tags: ['stylize', 'grade'], continuous: true,
    params: { hue: { default: 200, min: 0, max: 360, unit: 'deg' } },
    defaultDuration: 4, apply: (_p, prm) => ({ css: { filter: `grayscale(1) contrast(1.1) sepia(.5) hue-rotate(${prm.hue}deg) saturate(2.2)` } }),
  },
];
