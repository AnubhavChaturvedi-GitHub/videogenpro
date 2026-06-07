# VideoGenPro

> A deterministic, **agent-authorable** motion/video engine with a CapCut-grade browser
> editor. Preset-driven, multi-renderer (HTML + Three.js + image/video), **no AI model
> in the render path** — the intelligence lives in the preset catalog; the agent (or the
> user) just picks, tunes, arranges, and keyframes.

This file is the **single source of truth for context** when starting a new session.
Read this first, then `docs/AGENT-PLAYBOOK.md` (the brief→render workflow), then `AGENTS.md`
(authoring reference), then `docs/TEST-SHEET.md` (known bugs/gaps) and `docs/design.md`
(brand tokens). New AI agent? Start at `CLAUDE.md`.

Location: `~/Desktop/video gen pro` · macOS / Node 25 / pnpm 10 / ffmpeg 8 · not a fresh
git repo? it IS a git repo, commit history is the checkpoint log (see bottom).

---

## 1. Quick start

```bash
pnpm install
npx playwright install chromium          # one-time, for headless render
pnpm build:runtime                       # bundles renderer + editor (esbuild)
pnpm studio your-composition.json 5174   # dev server + editor at http://localhost:5174
# other:
pnpm render your-composition.json out/x.mp4   # headless export (Playwright + ffmpeg, with audio)
pnpm check                               # tsc --noEmit (typecheck gate — keep green)
pnpm manifest                            # print the AI-facing preset catalog (JSON)
pnpm preview your-composition.json         # standalone self-contained preview HTML
```

The Studio dev server edits a real composition JSON file on disk. **That file is shared
with the agent**: UI edits → POST → file; agent edits the file → SSE → live UI update.

---

## 2. Repo layout

```
packages/
  core/src/        # @vgp/core — engine-agnostic IR + preset library + validation
    ir.ts          # the Scene IR types (Composition/Scene/Layer/AudioTrack, all layer types)
    preset.ts      # the Preset Contract (StyleDelta, ApplyCtx, categories)
    easing.ts      # easing functions (EasingName)
    schema.ts      # Zod validation of the IR (overlay effects derived from preset lib)
    presets/       # the catalog: text, image, enter(in), exit(out), audio, overlay, transition
    index.ts       # barrel: getPreset, buildManifest, searchPresets, etc.
  renderer/src/
    runtime.ts     # browser runtime: VGP.mount/seek/ready/audioInfo — the deterministic engine
    index.html     # render host page (also injects SVG sketch filter + Bree Serif font)
    dist/runtime.js# bundled (gitignored-ish; rebuilt by build:runtime)
    BreeSerif.woff2
  editor/
    src/editor.ts  # the Studio editor (one module: state S, timeline, canvas, properties, library, sync)
    index.html     # editor host page + ALL CSS (monochrome theme), logo.svg, favicon
    logo.svg       # animated gradient logo + favicon
    dist/editor.js # bundled
  cli/src/
    build.ts       # esbuild bundle of runtime.ts + editor.ts (IIFE)
    serve.ts       # dev server: static + /api/composition (GET/POST) + SSE + upload + projects + render
    render.ts      # headless export: Playwright drives seek per-frame -> PNG pipe -> ffmpeg (+audio mux)
    preview.ts     # standalone preview HTML generator
    manifest.ts    # prints buildManifest()
    cli.ts         # `videogenpro <studio|render|build|manifest>` dispatcher
bin/videogenpro.mjs # npm bin entry (runs cli.ts via tsx)
tests/             # unit/ + e2e/ + fixtures/ (self-contained sample media & comps)
docs/              # TEST-SHEET.md (bug+feature audit), design.md (Brainfish tokens — historical)
AGENTS.md          # full agent authoring guide (IR, presets, keyframes, how to add effects)
```

---

## 3. Architecture (how it works)

- **Scene IR** (`core/ir.ts`) is the single source of truth: a JSON document of `scenes`,
  each with `layers`, plus composition-level `audio`. Code, the editor, and the agent all
  read/write this. Validated by Zod (`core/schema.ts`).
- **Preset Contract** (`core/preset.ts`): every animation is a **pure, deterministic,
  self-describing** function `apply(progress, params, ctx) -> StyleDelta`. Categories:
  `text · image · in · out · audio · overlay · transition`. Manifest (`buildManifest`)
  exposes id/description/params/ranges so an agent picks by intent and tunes by range.
- **Runtime** (`renderer/runtime.ts`): `VGP.mount(ir,{assetBase})` builds the DOM
  (HTML/Three.js/image/video/shape layers) once; `VGP.seek(time,{playing})` is the single
  **deterministic** driver — same time → same frame. Handles keyframes, presets, fx layers,
  overlay (backdrop-filter) layers, scene transitions, and timeline-synced audio/video.
- **Renderer pipeline** (`cli/render.ts`): headless Chromium (Playwright) seeks frame by
  frame, screenshots `#stage`, pipes PNGs to **ffmpeg**, and **muxes audio** (adelay/volume/
  amix, optional per-track trim). `@P done total` progress lines are parsed by the dev server.
- **Editor** (`editor/editor.ts`): a CapCut-style UI over the same IR — timeline, transport,
  properties, animation library, drag-drop, undo/redo. The preview IS the runtime (`preview
  == final`).
- **Dev server** (`cli/serve.ts`): serves the editor, `GET/POST /api/composition`, SSE
  (`/api/events`) for two-way file↔browser sync, `/api/upload`, `/api/projects`, `/api/open`,
  `/api/render` (streams render progress over SSE).

### Determinism rules (non-negotiable — keep `render == preview`)
- Every visual is a pure function of seek time. **No `Date.now`, no `Math.random`** (seed by
  `ctx.index`), no rAF as source of truth, no setTimeout-driven animation.
- CSS set on one frame is cleared the next (no stale-style leak across scrub directions).
- Audio/video play naturally while playing; frame-seek while scrubbing/rendering.

---

## 4. The Scene IR (authoring format)

```jsonc
{
  "fps": 30, "width": 1280, "height": 720,
  "defaultTransition": { "id": "transition.crossfade", "duration": 0.5 },  // optional, between scenes
  "audio": [ { "src": "../assets/prism/scene-01.mp3", "start": 0, "volume": 1, "duration": 27.28, "trimStart": 0 } ],
  "scenes": [
    { "id": "intro", "duration": 4, "background": "#0b0e16",
      "transitionIn": { "id": "transition.zoom", "duration": 0.6 },        // transition INTO this scene
      "layers": [ /* … */ ] }
  ]
}
```

**Layer types** (all share `start`, `duration`, `rect{x,y,w,h}`, `transform{x,y,scale,rotate,opacity,anchor}`, `presets[]`, `keyframes`, `zIndex`):
- `text` — `{ text, style:{fontSize,color,fontWeight,fontFamily,...} }`
- `image` — `{ src, fit:'cover'|'contain' }`
- `video` — `{ src, trimStart, fit }`
- `html` — `{ html }` (raw HTML/SVG)
- `three` — `{ scene:'particles', props:{speed} }` (registered 3D scenes)
- `shape` — `{ shape:'rect'|'circle'|'line', fill, radius }`
- `overlay` — `{ effect, params:{amount} }` **adjustment layer** (zIndex 9999) that affects
  EVERYTHING beneath it via `backdrop-filter` (blur/B&W/sepia/…) or paint-on-top (fade/vignette).
- `fx` — `{ effect: <presetId>, params }` **control layer** that drives an animation/effect
  onto the **content layer directly below it** in the stack (no visual of its own).

**Presets**: `"presets":[{ "id":"image.ken-burns", "params":{"zoom":0.25}, "start":0, "duration":1.2 }]`.
`in.*` play at layer start; `out.*` play at layer end (`fromEnd`); `continuous` span the layer.

**Keyframes**: `"keyframes":{ "x":[{"t":0,"value":-400},{"t":1.2,"value":0,"easing":"easeOutCubic"}], "opacity":[…] }`
Keyable: `x,y,scale,rotate,opacity` (+ overlay `amount`). Times are layer-local seconds.

See **AGENTS.md** for the full contract and how to add a new preset/effect.

---

## 5. Preset catalog — 73 presets (run `pnpm manifest`)

- **text** (13): fade-up, word-stagger, typewriter, pop, blur-in, drop, slam, expand, glitch, char-wave, gradient-sweep, neon-glow, highlight
- **image** (12): ken-burns, float, reveal-wipe, zoom-in, sketch, tilt-3d, zoom-out, breathe, grayscale-reveal, blur-reveal, swing, duotone
- **in / Fade In** (12): fade, slide-left/right/up, scale, spin, blur, zoom, drop, flip-x, flip-y, skew
- **out / Fade Out** (10): fade, slide-right/down/left/up, scale-down, blur, zoom-out, spin, pop
- **audio** (4, rhythmic/reactive placeholder): beat-pulse, bass-glow, bounce, shake
- **overlay** (10): blur, black-white, sepia, brighten, darken, contrast, saturate, fade, vignette, invert
- **transition** (12): crossfade, slide, zoom, wipe, dissolve, push-up, circle-iris, flip-3d, zoom-blur, dip-black, glitch, spin

---

## 6. The Studio editor (current features)

- **Theme**: monochrome black & white chrome (sharp solid-white accent), but **clips, type
  icons, asset thumbnails, and audio lane stay colorful** for identification. Liquid-glass
  frosted panels. Animated gradient logo + favicon.
- **Timeline**: scene-grouped tracks; **front-most layer on top** (reversed display); mm:ss
  ruler with adaptive tick step; **+/−/Fit zoom** and ⌘/ctrl-scroll; click/drag anywhere to
  move the playhead (never selects clips/text); red→white playhead.
- **Clips**: drag to move, right-edge trim; click selects (and moves playhead).
- **Layers**: Add Text/Shape/Line/3D; upload + drag-drop assets to timeline; **Arrange**
  (To front/Forward/Backward/To back — moves a layer *with its fx*, overlays stay on top).
- **Effects model** (every effect is trackable):
  - animations/filters → **fx layer** targeting the clip below (drag a card onto a clip, or
    click with a clip selected). Has its own track, params, and timing window.
  - **overlays** → overlay layer affecting everything below (drag onto timeline / click).
  - **transitions** → drag a transition card onto a **scene-seam diamond** (click seam to remove).
- **Animations library** (right panel, Animations tab): categories Text / Video-Image /
  Audio / Fade In / Fade Out / Overlays / Transitions — **name-only compact list**, draggable.
- **Properties** (right panel): per-layer fields (text/font/color/fit/shape), applied
  animations with param sliders, **keyframe ◆** buttons on transform, timing, transform;
  fx-layer and overlay-layer panels with effect + params + timing.
- **Canvas editing**: click the topmost layer to select; **drag to move**; **resize handles**
  (scale-aware selection box). Keyboard: arrows nudge, **S / ⌘B** split, **⌘D** duplicate,
  **Del** delete, **Space** play, **⌘Z / ⌘⇧Z** undo/redo.
- **Transport**: play/pause, ⏮ start, ±1s, loop, time readout mm:ss.cs, **fullscreen** preview.
- **Audio lane**: shows the composition's audio tracks (drag/trim/volume), timeline-synced,
  blob-loaded for instant seek; **no new audio added by the editor**.
- **File menu**: New / Open… (project picker + import .json) / Save (.json) / Export MP4
  (streamed % progress). **Top-right views**: Compositions (scenes, current highlighted) /
  Assets (all media used) / Code (live IR JSON). Side panel shows current "Scene N / total".
- **Undo/redo**: history per committed edit (also captures agent edits).

---

## 7. Checkpoints — DONE (commit history = checkpoint log)

```
3981356 overlay blurs everything below; intuitive arrange (front=top); zoom +/-
13aefb7 every effect applies as its own trackable fx layer
877d6de overlays drop in as their own adjustment layer
4d1d6f8 animated gradient logo/favicon, Overlays category, name-only draggable effects
495fb65 B&W chrome + colorful clips/icons, fullscreen preview, drag-drop transitions
af11ddd lock scrub selection, z-order arrange, canvas hit-test edit, project views
3d44542 monochrome black & white UI theme
4ce585f timeline mm:ss labels + adaptive ticks + fit/zoom
cd70515 click anywhere on timeline to move playhead; audio seeks to correct offset
136bf39 Cmd+B split with toast; audio narration no longer restarts on edits
29e2db4 resolve all 26 audited bugs (parallel multi-agent pass) + typecheck gate
c764e49 QA test sheet + bug/feature audit (docs/TEST-SHEET.md)
6f6fc54 audio tracks shown in timeline (real-editor audio lane)
c72a75b standard editor controls — undo/redo + clip toolbar + canvas selection handles
c020c60 line layer + undo/redo (Cmd+Z / Cmd+Shift+Z)
a9ad33e expand effect catalog 30 -> 63 (later 73 with overlays)
a9e31eb live preview now plays video clips + audio (voiceover/bgm)
eb697ea v0.4 Liquid Glass dark theme
998dd01 v0.3 categorized animation library, keyframes, render progress
8ab2c81 v0.2 CapCut-style Studio editor with live two-way agent sync
84583a0 v0.1 deterministic preset-driven multi-renderer engine
```
Plus (uncommitted at time of writing — see §9): a 3-round parallel **timeline-fix-loop**
workflow applied many fixes/improvements (schema derives overlay effects from the preset
library; runtime audio-aware `effectiveDuration`; unified `overlayStyle` renderer). tsc green.

---

## 8. Checkpoints — TODO / what can be done next

**P0 (highest leverage):**
- [ ] **Functional smoke-test + commit the last workflow pass** (see §9 — it's tsc-green but
      not yet manually verified end-to-end). Do this FIRST next session.
- [ ] **Tests**: golden-frame determinism snapshots of `seek(t)` + per-preset unit tests
      (the headline promise has no automated coverage yet).
- [ ] **Export options UI**: fps / resolution / format / range / alpha (currently hardcoded
      in render.ts; the button just triggers a default render).
- [ ] **Parallel/sharded render** (serial screenshot-per-frame is the perf wall; ~3 fps).
- [ ] **Captions/subtitles + TTS (Pocket-TTS) + transcription→word-timed captions** (core to
      the educational-video mission; Lesson-2 voiceover already imported).

**P1:**
- [ ] Real audio: decode waveform on clips; make `audio.*` presets actually amplitude-reactive
      (currently synthetic BPM); audio upload in the UI; mute/solo; volume fades/keyframes.
- [ ] Multi-select, copy/paste, snapping/magnetic timeline.
- [ ] Layers panel (list + visibility/lock); scene add/delete/reorder UI.
- [ ] Keyframe easing editor (currently hardcoded easeInOut on created keyframes); curve editor.
- [ ] Native color/gradient pickers (currently text inputs).
- [ ] **MCP server** so the agent authors via tools (searchPresets/applyPreset/setKeyframe)
      instead of file-poke + SSE.
- [ ] Vertical drag-to-reorder timeline tracks (Arrange buttons exist; drag would be nicer).
- [ ] Clip thumbnails / video filmstrip; markers; rotation handle.

**P2:** shader/WebGL transitions, masking/track-mattes, spring physics, plugin API for preset
packs, project versioning/autosave history, accessibility, responsive layout, render cancel.

Full detail (26 bugs as of that audit, 70 test cases, ~45 feature gaps) in **docs/TEST-SHEET.md**.

---

## 9. Known state / verify next session
- The last action was a **timeline-fix-loop workflow** (3 rounds, 42 agents). It edited
  `editor.ts`, `runtime.ts`, `schema.ts`, `overlay.ts` and **passes `pnpm check` (tsc) +
  build**, but was **not yet functionally smoke-tested** by me. **First task: run
  `pnpm build:runtime`, `pnpm studio your-composition.json`, load it headless/in browser,
  confirm no console errors, and verify the core timeline interactions** (zoom, arrange,
  fx apply, overlay blur, scrub-no-select, seam drop, audio sync, keyframes) before building more.
- The workflow's audit did NOT converge to 0 "bugs" (43→30→35 across rounds) — many are
  subjective/overlapping opinions from independent agents, not all real regressions. Treat
  the test sheet + a real smoke-test as ground truth, not the raw audit counts.
- `assets/prism/` holds the imported Lesson-2 media + voiceover — **never regenerate**; reuse.

---

## 10. Conventions
- **Determinism first** — see §3. Verify with `pnpm check` (tsc gate) before committing.
- After any runtime/editor/core change: `pnpm build:runtime`, restart `pnpm studio`, smoke-test.
- Build is esbuild (no typecheck) → always run `pnpm check` separately.
- Commit messages end with: `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`.
- The user (Anubhav) prefers: direct/concise updates, verified claims (show evidence), and
  monochrome B&W UI with colorful clips/icons. Telegram checkpoint pings when a task is done
  (if a chat is connected).
```
