import type { Preset } from '../preset';

// Audio-reactive style animations. Deterministic rhythmic pulses driven by bpm
// and the layer-local time (ctx.time). When real audio amplitude lands, these
// same presets read the analysed envelope instead of the synthetic beat.
const beat = (time: number, bpm: number) => {
  const phase = (time * bpm) / 60;            // beats elapsed
  const x = phase - Math.floor(phase);        // 0..1 within the beat
  return Math.pow(1 - x, 2);                   // sharp attack, decay = a "thump"
};

export const audioPresets: Preset[] = [
  {
    id: 'audio.beat-pulse', category: 'audio', description: 'Scales up on every beat — punches to the rhythm.',
    tags: ['reactive', 'beat'], continuous: true,
    params: { bpm: { default: 120, min: 40, max: 220, desc: 'beats per minute' }, amount: { default: 0.12, min: 0, max: 0.6, desc: 'scale punch' } },
    defaultDuration: 5, apply: (_p, prm, ctx) => ({ scale: 1 + beat(ctx.time, prm.bpm) * prm.amount }),
  },
  {
    id: 'audio.bass-glow', category: 'audio', description: 'Brightness flashes on the beat — a bass-driven glow.',
    tags: ['reactive', 'glow'], continuous: true,
    params: { bpm: { default: 120, min: 40, max: 220 }, amount: { default: 0.5, min: 0, max: 1.5 } },
    defaultDuration: 5, apply: (_p, prm, ctx) => ({ brightness: 1 + beat(ctx.time, prm.bpm) * prm.amount }),
  },
  {
    id: 'audio.bounce', category: 'audio', description: 'Bounces vertically in time with the beat.',
    tags: ['reactive', 'bounce'], continuous: true,
    params: { bpm: { default: 120, min: 40, max: 220 }, height: { default: 24, min: 0, max: 200, unit: 'px' } },
    defaultDuration: 5, apply: (_p, prm, ctx) => ({ y: -beat(ctx.time, prm.bpm) * prm.height }),
  },
  {
    id: 'audio.shake', category: 'audio', description: 'Jitters/shakes energetically on each beat.',
    tags: ['reactive', 'energetic'], continuous: true,
    params: { bpm: { default: 120, min: 40, max: 220 }, amount: { default: 8, min: 0, max: 40, unit: 'px' } },
    defaultDuration: 5, apply: (_p, prm, ctx) => {
      const b = beat(ctx.time, prm.bpm);
      return { x: Math.sin(ctx.time * 80) * b * prm.amount, rotate: Math.sin(ctx.time * 60) * b * 2 };
    },
  },
];
