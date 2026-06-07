# Agent Playbook — from a user brief to a finished, rendered video

This is the **operating manual** for an AI agent building a video in VideoGenPro. `AGENTS.md`
tells you *what the format is*; this file tells you *what to do, in what order*. Read
`CLAUDE.md` and `README.md` first for the architecture and commands.

The whole job is one loop:

> **brief → plan → author IR → preview → render → verify → hand off for customization**

---

## 0. Mental model (10 seconds)

A video is one JSON file: a `Composition` of `scenes`, each scene a stack of `layers`, each
layer optionally carrying `presets` (named animations), `keyframes` (hand-keyed motion), and a
`transform`. The browser **runtime** turns that file into pixels deterministically via a single
`seek(t)`. The **editor** is a GUI over the same file. The **renderer** seeks every frame
headlessly and pipes to ffmpeg. You author by editing the JSON; you never write motion code.

```
Composition ─ scenes[] ─ layers[] ─ { presets[], keyframes{}, transform }
     │                                        │
     └── audio[] (voiceover, bgm)             └── animations chosen from the preset catalog
```

---

## 1. Turn the brief into a plan (before writing any JSON)

Ask yourself, and state back to the user, the answers to these:

| Question | Default if unspecified |
|---|---|
| Aspect / resolution? | `1920×1080` landscape. (Vertical/social → `1080×1920`.) |
| Frame rate? | `30` fps |
| Total length & pacing? | Derive from content; ~3–6s per beat |
| What media exists? | Scan `assets/` — **never regenerate `assets/prism/`** |
| Voiceover / music? | If a script exists, plan for TTS + captions (see §6) |
| Mood / look? | Pick a background palette + a consistent animation language |

Then sketch a **scene list**: one scene per idea/beat. For each scene write a one-line intent
("Scene 2 — show the four languages as clay icons, stagger them in"). This plan is what you
turn into layers. Keep scenes short; the timeline auto-extends to fit the longest clip.

---

## 2. Discover what you can animate (don't guess ids)

Run the catalog and search it by intent — **never invent a preset id** (a fake id fails schema
validation by design):

```bash
pnpm manifest                 # full machine-readable catalog: id, description, params, ranges
```

The catalog is grouped by category (these are also the editor's library tabs):

- **text** — fade-up, word-stagger, typewriter, pop, blur-in, drop, slam, expand, glitch, char-wave, gradient-sweep, neon-glow, highlight
- **image** (image+video) — ken-burns, float, reveal-wipe, zoom-in, sketch, tilt-3d, zoom-out, breathe, grayscale-reveal, blur-reveal, swing, duotone
- **in** (entrance, any layer) — fade, slide-left/right/up, scale, spin, blur, zoom, drop, flip-x/y, skew
- **out** (exit, any layer; plays at the END automatically) — fade, slide-*, scale-down, blur, zoom-out, spin, pop
- **audio** (rhythmic) — beat-pulse, bass-glow, bounce, shake
- **overlay** (adjustment layer over everything below) — blur, black-white, sepia, brighten, darken, contrast, saturate, fade, vignette, invert
- **transition** (scene→scene) — crossfade, slide, zoom, wipe, dissolve, push-up, circle-iris, flip-3d, zoom-blur, dip-black, glitch, spin

In code you can also call `searchPresets(query, category?)` from `@vgp/core` — plain-text scoring,
no model needed.

---

## 3. Author the layers (the craft)

Build each scene's `layers` array. Per-layer fields (all optional except the type's own):
`start`, `duration` (scene-local seconds), `rect{x,y,w,h}`, `transform{x,y,scale,rotate,opacity,anchor}`,
`presets[]`, `keyframes{}`, `zIndex`. Layer types: `text · image · video · html · three · shape ·
overlay · fx`.

**Preset-selection heuristics:**
- **Headlines/titles** → `text.word-stagger` or `text.fade-up`. Reserve `text.slam`/`glitch` for
  punch moments, not every title.
- **Photos** → `image.ken-burns` is the default cinematic move (slow zoom + pan). Vary `panX`/`zoom`
  per shot so it doesn't feel mechanical.
- **Punchy entrance** → `in.scale` or `image.zoom-in`. **Clean exit** → always add an `out.*` so
  layers leave gracefully instead of cutting.
- **Explainer / hand-drawn look** → `image.sketch`.
- Presets **stack**: one entrance + one ambient (`continuous`) + one exit on the same layer is
  normal and good. Don't put the *same* preset on everything — vary direction and timing.

**Stacking example (one image layer):**
```jsonc
{
  "type": "image", "src": "assets/clay-python.png", "fit": "contain",
  "rect": { "x": 360, "y": 240, "w": 480, "h": 480 },
  "presets": [
    { "id": "in.scale", "duration": 0.5 },
    { "id": "image.ken-burns", "params": { "zoom": 0.18, "panX": 0.06 } },
    { "id": "out.fade", "duration": 0.4 }
  ]
}
```

**When a preset isn't enough → keyframes.** Hand-key `x, y, scale, rotate, opacity` in
layer-local seconds, with per-segment easing (`linear, easeIn, easeOut, easeInOut, easeOutCubic,
easeInOutCubic, easeOutExpo, easeOutBack`). Zoom = keyframe `scale`; move = keyframe `x`/`y`;
fade = keyframe `opacity`. Keyframes and presets combine (base → keyframes → preset deltas).

**Layer ordering:** higher `zIndex` is on top. An `overlay` layer affects *everything beneath it*
(it's an adjustment layer). An `fx` layer drives an effect onto the *single content layer directly
below it* and has no visual of its own.

**Scene transitions:** set `defaultTransition` once for the whole comp, and/or `transitionIn` on
individual scenes (the transition *into* that scene). `transition.crossfade` is the safe default;
`transition.match-move` morphs a shared element across the seam (pair via `matchId`).

---

## 4. Wire up assets correctly

- Put media in the project's co-located `assets/` folder and reference it **relative to the
  composition file** (e.g. `"src": "assets/bg1.png"`). The renderer and editor both resolve
  relative to the comp's directory.
- In the running Studio, `POST /api/upload` imports a file into `assets/` and returns the
  relative `src`; `POST /api/collect` ("Collect Files") pulls any external/absolute references
  into `assets/` and rewrites the IR so the project is self-contained.
- Remote `https://` URLs are allowed as-is (e.g. brand SVG icons).

---

## 5. Preview — the editor IS the renderer

```bash
pnpm build:runtime                      # only needed if you changed runtime/editor/core
pnpm studio your-composition.json 5174
```

The preview in the browser is the *same* runtime that renders, so **preview == final frame**.
While the studio runs, your file edits push live into the browser (SSE), and the user's UI edits
are written back to the file — read it to see what they changed. Co-editing is the normal mode.

> **Before acting on any follow-up request, run the reconciliation handshake** in `CLAUDE.md`
> ("Reconcile with the user's manual edits"): re-read the file, recognize what the user changed
> by hand, confirm it with them, then edit surgically so their manual changes are preserved.

---

## 6. Audio & captions (educational-video mission)

- Composition-level `audio[]` carries voiceover/music: `{ src, start, trimStart, duration, volume,
  muted }`. The renderer muxes all tracks (adelay/volume/amix) and runs the video as long as the
  audio tail, so narration is never cut off.
- A `video` layer plays its *own* audio only when `muted: false`.
- For narrated explainers: generate TTS (the user prefers **Pocket-TTS**), then transcribe to
  word timings and place `text` layers (or captions) synced to those times. Caption automation is
  a known P0 gap — until it lands, place caption text layers by hand against the transcript.

---

## 7. Render to MP4

```bash
pnpm render your-composition.json out/your-comp.mp4          # native resolution
pnpm render your-composition.json out/your-comp_720.mp4 720  # scale to 720p height
```

How it works (so you can reason about failures): the timeline is split into N ranges rendered in
**parallel** headless Chromium pages, each seeking frame-by-frame → JPEG → ffmpeg segment; the
segments are concat-copied and audio is muxed once at the end. Tune with `VGP_WORKERS=N`. The
renderer **verifies frame counts and final duration** and refuses to deliver a short/corrupt file
— if it errors with "segment incomplete," a page wedged; retry or lower workers.

Requirements: `pnpm build:runtime` must have produced `packages/renderer/dist/runtime.js`, and
**ffmpeg** must be on PATH.

---

## 8. Verify, then hand off

- **Verify** — never claim success from the JSON alone. Either render a short pass and `ffprobe`
  the duration, or load the studio headless and confirm no console errors. Run `pnpm check`
  (tsc) green if you touched any `.ts`.
- **Hand off for customization** — leave the composition clean and well-named: meaningful scene
  `id`s and layer `id`s, assets collected locally, no dead layers. Tell the user: *"Open
  `pnpm studio <file>` — every scene, layer, animation, and keyframe I created is editable: drag/
  trim clips on the timeline, tune any animation's params with the sliders, add/remove transitions
  on the scene seams, and export MP4 from the File menu."* That editor is the customization surface.

---

## 9. Two complete, valid worked examples

### A) Minimal title card (copy-paste runnable)
```json
{
  "fps": 30,
  "width": 1920,
  "height": 1080,
  "name": "Title Card",
  "scenes": [
    {
      "id": "title",
      "duration": 4,
      "background": "#0b0e16",
      "layers": [
        {
          "type": "text",
          "text": "VideoGenPro",
          "style": { "fontSize": "120px", "color": "#ffffff", "fontWeight": "800" },
          "presets": [
            { "id": "text.word-stagger", "duration": 0.8 },
            { "id": "out.fade", "duration": 0.5 }
          ]
        },
        {
          "type": "text",
          "text": "deterministic, agent-authorable video",
          "start": 0.6,
          "style": { "fontSize": "40px", "color": "#9aa4b2", "fontWeight": "500" },
          "transform": { "y": 110 },
          "presets": [{ "id": "in.fade", "duration": 0.6 }]
        }
      ]
    }
  ]
}
```

### B) Two-scene explainer beat: image with Ken Burns + crossfade + voiceover
```json
{
  "fps": 30,
  "width": 1920,
  "height": 1080,
  "name": "Explainer Beat",
  "defaultTransition": { "id": "transition.crossfade", "duration": 0.6 },
  "audio": [
    { "src": "assets/prism/scene-01.mp3", "start": 0, "volume": 1 }
  ],
  "scenes": [
    {
      "id": "hook",
      "duration": 5,
      "background": "#0a0a0a",
      "layers": [
        {
          "type": "image", "src": "assets/prism/clay-python.png", "fit": "contain",
          "rect": { "x": 560, "y": 180, "w": 800, "h": 600 },
          "presets": [
            { "id": "in.scale", "duration": 0.5 },
            { "id": "image.ken-burns", "params": { "zoom": 0.2, "panX": 0.07 } }
          ]
        },
        {
          "type": "text", "text": "What is an interpreter?",
          "start": 0.4, "duration": 4.6,
          "style": { "fontSize": "72px", "color": "#ffffff", "fontWeight": "800" },
          "transform": { "y": -380 },
          "presets": [{ "id": "text.fade-up", "duration": 0.7 }, { "id": "out.fade", "duration": 0.4 }]
        }
      ]
    },
    {
      "id": "reveal",
      "duration": 5,
      "background": "#0a0a0a",
      "transitionIn": { "id": "transition.zoom", "duration": 0.6 },
      "layers": [
        {
          "type": "image", "src": "assets/prism/interpreter-cutout.png", "fit": "contain",
          "rect": { "x": 660, "y": 220, "w": 600, "h": 600 },
          "keyframes": {
            "scale": [
              { "t": 0, "value": 0.9 },
              { "t": 1.2, "value": 1.05, "easing": "easeOutBack" }
            ],
            "opacity": [ { "t": 0, "value": 0 }, { "t": 0.5, "value": 1 } ]
          }
        },
        {
          "type": "text", "text": "It runs your code line by line.",
          "start": 0.8,
          "style": { "fontSize": "56px", "color": "#e8eef7", "fontWeight": "700" },
          "transform": { "y": 380 },
          "presets": [{ "id": "text.fade-up", "duration": 0.6 }]
        }
      ]
    }
  ]
}
```

Both validate against `packages/core/src/schema.ts`. Adjust `rect`/`src` to the real assets in
your project before rendering.

---

## 10. Quick failure triage

| Symptom | Likely cause |
|---|---|
| Save rejected / 400 on POST | IR fails Zod — a typo'd preset id, out-of-range param, or wrong layer field. Check `schema.ts`. |
| Preset "does nothing" | Hallucinated id that *type-checks* but isn't registered → silent no-op was the old bug; now it fails validation. Run `pnpm manifest`. |
| Render: "segment incomplete" | A headless page wedged (often a video layer). Retry, or `VGP_WORKERS=1`. |
| Render: "ffmpeg not found" | Install ffmpeg / put it on PATH. |
| Render: "runtime not built" | Run `pnpm build:runtime` first. |
| Preview differs from render | You broke determinism (random/time/rAF). Re-read §Golden rules in `CLAUDE.md`. |
| Audio cut off early | It's fine — the renderer extends to the audio tail; if not, set the track's `duration`. |
