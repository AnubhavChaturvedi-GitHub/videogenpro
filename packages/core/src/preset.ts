// The Preset Contract — the heart of VideoGenPro.
// Every animation is a PURE, DETERMINISTIC, SELF-DESCRIBING function of progress.
// This is what makes the catalog "great for AI": typed params + descriptions +
// f(progress) means an agent picks by intent and tunes by range, never writes motion code.

export type StyleDelta = {
  // Transform components (additive / multiplicative, combined by the runtime).
  x?: number;        // px translate
  y?: number;        // px translate
  scale?: number;    // multiplied (1 = no change)
  scaleX?: number;
  scaleY?: number;
  rotate?: number;   // degrees (added)
  opacity?: number;  // multiplied (1 = opaque)
  blur?: number;     // px (added)
  brightness?: number; // multiplied (1 = normal)
  // clip-path inset reveal: [top, right, bottom, left] in percent (0 = fully visible)
  clipInset?: [number, number, number, number];
  // escape hatch for raw CSS
  css?: Record<string, string>;
};

export type ParamSpec = {
  default: number;
  min?: number;
  max?: number;
  unit?: string;
  desc?: string;
};

// Context handed to a preset's apply() — enables per-word / per-char stagger
// and real-time effects (audio-reactive, bpm pulses).
export type ApplyCtx = {
  index: number;   // element index when split (0 for whole)
  count: number;   // total elements (1 for whole)
  time: number;    // layer-local time in seconds
  dur: number;     // layer duration in seconds
};

// Categories double as the Animation Library tabs in the editor:
//   text · image (video) · audio · in (fade-in) · out (fade-out) · transition
export type PresetCategory = 'text' | 'image' | 'audio' | 'in' | 'out' | 'overlay' | 'layer' | 'transition';

export type Preset = {
  id: string;
  category: PresetCategory;
  description: string;        // one-line semantic description — the AI reads this
  tags: string[];
  params: Record<string, ParamSpec>;
  defaultDuration: number;    // seconds, used when the instance omits duration

  // If set, the preset spans the WHOLE layer (progress = time / layerDuration).
  // Used by ambient motion like ken-burns, parallax, float, and audio pulses.
  continuous?: boolean;

  // If set, the preset plays at the END of the layer (exit / fade-out):
  // progress runs 0->1 over the last `duration` seconds.
  fromEnd?: boolean;

  // For text presets: split the element and animate each piece with stagger.
  split?: 'word' | 'char';

  // Match & Move: a "smart" scene transition that MORPHS matching elements (same
  // matchId / src / text) from their position+size+rotation in the outgoing scene to
  // the incoming one, while non-matched elements cross-fade. The runtime special-cases
  // this per-layer (a normal whole-scene transition() can't move individual elements).
  matchMove?: boolean;

  // Enter/emphasis/exit & image presets implement apply().
  apply?: (p: number, params: Record<string, number>, ctx: ApplyCtx) => StyleDelta;

  // Transitions implement transition(): how the outgoing (from) and incoming (to)
  // scene/layer are styled across the crossover. Optional `over` styles a full-frame
  // overlay element above both scenes (e.g. a colour panel sweeping across — Colour Wipe).
  transition?: (p: number, params: Record<string, number>) => { from: StyleDelta; to: StyleDelta; over?: StyleDelta };
};

// Resolve an instance's params against the preset's defaults.
export const resolveParams = (
  preset: Preset,
  given: Record<string, number> | undefined,
): Record<string, number> => {
  const out: Record<string, number> = {};
  for (const [k, spec] of Object.entries(preset.params)) {
    let v = given?.[k] ?? spec.default;
    if (spec.min !== undefined) v = Math.max(spec.min, v);
    if (spec.max !== undefined) v = Math.min(spec.max, v);
    out[k] = v;
  }
  return out;
};
