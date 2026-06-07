# VideoGenPro — Agent Authoring Guide

This file is the **complete context** an AI agent needs to author and edit VideoGenPro
compositions. The composition file (e.g. `your-composition.json`) is the single source of
truth. When the Studio dev server is running, editing that file pushes changes live into
the browser; the user's edits are written back to the same file.

## 1. The Scene IR

```jsonc
{
  "fps": 30,
  "width": 1920,            // canvas size
  "height": 1080,
  "defaultTransition": { "id": "transition.crossfade", "duration": 0.6 }, // optional, between every scene
  "scenes": [
    {
      "id": "intro",
      "duration": 4,                 // seconds; AUTO-GROWS to fit the latest clip
      "background": "#0b0e16",       // CSS color or gradient
      "transitionIn": { "id": "transition.zoom", "duration": 0.6 }, // optional, into THIS scene
      "layers": [ /* see below */ ]
    }
  ],
  "audio": [ { "src": "voice.wav", "start": 0, "volume": 1 } ]  // optional
}
```

Composition duration = sum of scene durations. The timeline auto-extends to the end of
the last clip in each scene.

## 2. Layers

Every layer shares: `start` (scene-local seconds, default 0), `duration` (seconds, default =
scene duration), `transform`, `presets`, `keyframes`, `rect`, `zIndex`.

```jsonc
{ "type":"text",  "text":"Hello", "style":{"fontSize":"96px","color":"#fff","fontWeight":"800"} }
{ "type":"image", "src":"../assets/x.png", "fit":"cover" }   // src is relative to the comp file
{ "type":"video", "src":"clip.mp4", "trimStart":0, "fit":"cover" }
{ "type":"three", "scene":"particles", "props":{"speed":0.3} }  // registered 3D scenes
{ "type":"shape", "shape":"rect|circle", "fill":"#6366f1", "radius":12 }
{ "type":"html",  "html":"<div>raw html/css</div>" }
```

`transform`: `{ x, y, scale, rotate, opacity, anchor:[0.5,0.5] }` — x/y in px from center.

## 3. Presets (animations)

A preset is a pure function `f(progress, params) -> styleDelta`. Apply by id with optional
param overrides. Presets STACK (e.g. an enter + an ambient + an exit on one layer).

```jsonc
"presets": [
  { "id": "image.ken-burns", "params": { "zoom": 0.25, "panX": 0.08 } },
  { "id": "in.fade", "duration": 0.6 },
  { "id": "out.fade" }                 // out.* play at the END of the layer automatically
]
```

Run `pnpm manifest` for the full machine-readable catalog (id, description, params, ranges).
Categories (also the editor's Animation Library tabs):

- **text** — fade-up, word-stagger, typewriter, pop, blur-in
- **image** (video/image) — ken-burns, float, reveal-wipe, zoom-in, **sketch**, tilt-3d
- **in** (fade-in, any layer) — fade, slide-left/right/up, scale, spin
- **out** (fade-out, any layer) — fade, slide-right/down, scale-down, blur
- **audio** (rhythmic / audio-reactive) — beat-pulse, bass-glow, bounce, shake
- **transition** (scene→scene) — crossfade, slide, zoom, wipe

### Choosing presets (guidance for the AI)
- Headlines → `text.word-stagger` or `text.fade-up`. Photos → `image.ken-burns` (the default
  cinematic move). Punchy entrance → `in.scale` / `image.zoom-in`. Sketch/explainer look →
  `image.sketch`. End a layer cleanly → add an `out.*`.
- Don't put the same preset on everything; vary direction and timing.

## 4. Keyframes — explicit position / opacity control

When a preset isn't enough, hand-key any animatable property. The runtime interpolates
`keyframes` with per-segment easing. Keyframe times are **layer-local seconds**.

Keyable props: `x`, `y`, `scale`, `rotate`, `opacity`.

```jsonc
{
  "type": "image", "src": "../assets/x.png", "start": 0, "duration": 5,
  "keyframes": {
    "x":       [ { "t": 0, "value": -400 }, { "t": 1.2, "value": 0, "easing": "easeOutCubic" } ],
    "scale":   [ { "t": 0, "value": 1 },    { "t": 5,   "value": 1.3, "easing": "easeInOut" } ],
    "opacity": [ { "t": 0, "value": 0 },    { "t": 0.5, "value": 1 } ]
  }
}
```

**Zoom in/out** = keyframe `scale` (1 → 1.3 zoom in; 1.3 → 1 zoom out), or use `image.ken-burns`.
**Move** = keyframe `x`/`y`. **Fade** = keyframe `opacity`.
Easings: `linear, easeIn, easeOut, easeInOut, easeOutCubic, easeInOutCubic, easeOutExpo, easeOutBack`.

Keyframes and presets combine: base transform → keyframes → preset deltas (multiplicative
for scale/opacity, additive for x/y/rotate).

## 5. Creating a NEW preset (when one doesn't exist)

Add a pure function to the right file in `packages/core/src/presets/`:
`text.ts | image.ts | enter.ts | exit.ts | audio.ts | transition.ts`, then it auto-appears
in the manifest AND the editor's Animation Library.

```ts
// packages/core/src/presets/image.ts
{
  id: 'image.glitch',
  category: 'image',
  description: 'RGB-split glitch flickers across the image.',  // the AI reads this to pick it
  tags: ['stylize', 'glitch'],
  continuous: true,                 // spans whole layer (ambient). omit for enter; fromEnd:true for exit
  params: { amount: { default: 6, min: 0, max: 30, unit: 'px' } },
  defaultDuration: 4,
  apply: (p, prm, ctx) => ({        // ctx = { index, count, time, dur }
    x: Math.sin(ctx.time * 40) * prm.amount,
    css: { filter: `hue-rotate(${Math.sin(ctx.time*10)*20}deg)` },
  }),
}
```

`apply` returns a `StyleDelta`: `{ x, y, scale, scaleX, scaleY, rotate, opacity, blur,
brightness, clipInset:[t,r,b,l]%, css:{...raw css escape hatch...} }`.

For an **edge/filter effect** (like sketch), reference an SVG filter via
`css.filter: 'url(#vgp-sketch)'` — filters live in `ensureSvgFilters()` in the runtime; add
new `<filter>` defs there.

## 6. Determinism rules (non-negotiable — keeps render == preview)
- Every animation is a pure function of `progress`/`time` passed in. No `Date.now()`,
  no `Math.random()` (seed by `ctx.index` instead), no `requestAnimationFrame`, no `setTimeout`.
- Don't animate `display`/`visibility` — use `opacity`.
- The runtime drives a single `seek(time)`; the same seek produces the same frame every time.

## 7. How co-editing works
- Edit the composition JSON file → the Studio browser updates live (SSE).
- The user's UI edits are written back to the same file → read it to see what changed.
- Validate mentally against `packages/core/src/schema.ts` (Zod) — invalid docs are rejected on save.
