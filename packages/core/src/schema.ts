import { z } from 'zod';

// Validation for the IR. Agent edits and hand-written JSON are checked here
// before they ever reach the renderer, so bad documents fail loud and early.
const presetInstance = z.object({
  id: z.string(),
  params: z.record(z.number()).optional(),
  start: z.number().optional(),
  duration: z.number().optional(),
});

// Must match EasingName in ./easing. Typos fail validation instead of being
// silently linearized.
const easingName = z.enum([
  'linear',
  'easeIn', 'easeOut', 'easeInOut',
  'easeOutBack', 'easeOutExpo', 'easeOutCubic', 'easeInOutCubic',
]);

const keyframe = z.object({
  t: z.number(),
  value: z.number(),
  easing: easingName.optional(),
});

const transform = z.object({
  x: z.number().optional(),
  y: z.number().optional(),
  scale: z.number().optional(),
  rotate: z.number().optional(),
  opacity: z.number().optional(),
  anchor: z.tuple([z.number(), z.number()]).optional(),
}).optional();

const rect = z.object({ x: z.number(), y: z.number(), w: z.number(), h: z.number() }).optional();

const baseLayer = {
  id: z.string().optional(),
  start: z.number().optional(),
  duration: z.number().optional(),
  rect,
  transform,
  presets: z.array(presetInstance).optional(),
  keyframes: z.record(z.array(keyframe)).optional(),
  zIndex: z.number().optional(),
};

const layer = z.discriminatedUnion('type', [
  z.object({ ...baseLayer, type: z.literal('text'), text: z.string(), style: z.record(z.string()).optional() }),
  z.object({ ...baseLayer, type: z.literal('image'), src: z.string(), fit: z.enum(['cover', 'contain']).optional() }),
  z.object({ ...baseLayer, type: z.literal('video'), src: z.string(), trimStart: z.number().optional(), fit: z.enum(['cover', 'contain']).optional() }),
  z.object({ ...baseLayer, type: z.literal('html'), html: z.string() }),
  z.object({ ...baseLayer, type: z.literal('three'), scene: z.string(), props: z.record(z.number()).optional() }),
  z.object({ ...baseLayer, type: z.literal('shape'), shape: z.enum(['rect', 'circle', 'line']), fill: z.string().optional(), radius: z.number().optional() }),
  z.object({ ...baseLayer, type: z.literal('overlay'), effect: z.string(), params: z.record(z.number()).optional() }),
  z.object({ ...baseLayer, type: z.literal('fx'), effect: z.string(), params: z.record(z.number()).optional() }),
]);

const scene = z.object({
  id: z.string().optional(),
  duration: z.number().positive(),
  background: z.string().optional(),
  layers: z.array(layer),
  transitionIn: presetInstance.optional(),
});

export const compositionSchema = z.object({
  fps: z.number().positive(),
  width: z.number().positive(),
  height: z.number().positive(),
  scenes: z.array(scene).min(1),
  audio: z.array(z.object({
    src: z.string(),
    start: z.number().optional(),
    trimStart: z.number().optional(),
    duration: z.number().optional(), // clip length (seconds) — lets audio-clip trimming persist
    volume: z.number().optional(),
  })).optional(),
  defaultTransition: presetInstance.optional(),
});

export const validateComposition = (data: unknown) => compositionSchema.parse(data);
