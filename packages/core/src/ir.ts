// The Scene IR — the single source of truth.
// Code, the (future) timeline GUI, and the AI agent all read/write THIS.
import type { EasingName } from './easing';

export type Vec2 = [number, number];

export type PresetInstance = {
  id: string;                       // preset id, e.g. "text.fade-up"
  params?: Record<string, number>;  // overrides; missing keys fall back to defaults
  start?: number;                   // seconds, local to the layer (default 0)
  duration?: number;                // seconds (default = preset.defaultDuration)
};

export type Keyframe = {
  t: number;            // seconds, local to the layer
  value: number;
  easing?: EasingName;  // easing INTO this keyframe
};

// Properties that can be hand-keyed alongside presets.
export type Keyable = 'x' | 'y' | 'scale' | 'rotate' | 'opacity';

export type Transform = {
  x?: number;       // px, anchor-relative (0 = centered by default anchor)
  y?: number;
  scale?: number;   // 1 = natural
  rotate?: number;  // degrees
  opacity?: number; // 0..1
  anchor?: Vec2;    // 0..1 within layer box; default [0.5, 0.5]
};

export type LayerType = 'text' | 'image' | 'video' | 'html' | 'three' | 'shape' | 'overlay';

export interface BaseLayer {
  id?: string;
  type: LayerType;
  start?: number;     // scene-local seconds (default 0)
  duration?: number;  // seconds (default = scene duration)
  // box in pixels; if omitted, layer fills the frame
  rect?: { x: number; y: number; w: number; h: number };
  transform?: Transform;
  presets?: PresetInstance[];
  keyframes?: Partial<Record<Keyable, Keyframe[]>>;
  zIndex?: number;
}

export interface TextLayer extends BaseLayer {
  type: 'text';
  text: string;
  style?: Record<string, string>; // raw CSS (fontFamily, fontSize, color, fontWeight...)
}

export interface ImageLayer extends BaseLayer {
  type: 'image';
  src: string;
  fit?: 'cover' | 'contain';
}

export interface VideoLayer extends BaseLayer {
  type: 'video';
  src: string;
  trimStart?: number; // seconds into the source
  fit?: 'cover' | 'contain';
}

export interface HtmlLayer extends BaseLayer {
  type: 'html';
  html: string;       // raw HTML/CSS string
}

export interface ThreeLayer extends BaseLayer {
  type: 'three';
  scene: string;      // id of a registered three scene factory (see runtime)
  props?: Record<string, number>;
}

export interface ShapeLayer extends BaseLayer {
  type: 'shape';
  shape: 'rect' | 'circle' | 'line';
  fill?: string;
  radius?: number;
}

export interface OverlayLayer extends BaseLayer {
  type: 'overlay';
  effect: string;                  // blur | black-white | sepia | brighten | darken | contrast | saturate | invert | vignette | fade
  params?: Record<string, number>; // e.g. { amount }
}

export type Layer = TextLayer | ImageLayer | VideoLayer | HtmlLayer | ThreeLayer | ShapeLayer | OverlayLayer;

export interface Scene {
  id?: string;
  duration: number;       // seconds
  background?: string;    // CSS color/gradient
  layers: Layer[];
  // transition INTO this scene (from the previous one)
  transitionIn?: PresetInstance;
}

export interface AudioTrack {
  src: string;
  start?: number;     // composition-timeline seconds
  trimStart?: number;
  duration?: number;  // clip length (seconds) — persists audio-clip trimming
  volume?: number;    // 0..1
}

export interface Composition {
  fps: number;
  width: number;
  height: number;
  scenes: Scene[];
  audio?: AudioTrack[];
  // optional default transition applied between every scene
  defaultTransition?: PresetInstance;
}

export const compositionDuration = (c: Composition): number =>
  c.scenes.reduce((sum, s) => sum + s.duration, 0);
