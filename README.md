# VideoGenPro

> A deterministic, **agent-authorable** motion engine. Preset-driven, multi-renderer
> (HTML + Three.js + image/video), with **no AI model in the render path**.
> The intelligence lives in the preset catalog — the agent just picks and tunes.

Think Remotion's determinism + HyperFrames' batteries + a CapCut-grade editor (coming),
but the killer feature is a large, self-describing **preset library** an AI can navigate
by intent.

## Why it's different

- **Preset Contract** — every animation is a pure, deterministic `f(progress, params)`
  with a typed, ranged, self-describing manifest. An agent picks by intent and tunes
  by range; it never writes motion code.
- **One IR, three authors** — code, the (planned) timeline GUI, and the AI agent all
  read/write the same JSON Scene IR. Git-friendly, diffable, no lock-in.
- **Multi-renderer composite** — HTML/CSS, Three.js/WebGL, images (with Ken Burns
  animated crop), video, and shapes all composite into one frame.
- **Deterministic** — every frame is an explicit `seek(time)`. No wall-clock, fully
  reproducible renders.

## Architecture

```
 Code DSL  ·  Timeline GUI  ·  AI Agent (MCP)
                 │
          ┌──────▼───────┐
          │   Scene IR    │  single source of truth (JSON, validated)
          └──────┬───────┘
     ┌───────────┼────────────┐
  Presets    Layout/keyframes  Audio
     └───────────┼────────────┘
          ┌──────▼───────┐
          │  Runtime      │  deterministic seek(time)
          │  (Chromium)   │  HTML + Three.js + image/video composite
          └──────┬───────┘
            ffmpeg → mp4
```

> v0.1 renders via headless Chromium (Playwright) for breadth. A custom WebGPU→Metal
> compositor is the planned v0.4 speed upgrade — the IR and preset contract stay the same.

## Quick start

```bash
pnpm install
npx playwright install chromium
pnpm demo                      # builds runtime + renders examples/hello.json -> out/hello.mp4
```

Render your own composition:

```bash
pnpm build:runtime
pnpm render path/to/comp.json out/video.mp4
pnpm manifest                  # print the AI-facing preset catalog
```

## Packages

- `packages/core` — IR types, the Preset Contract, easing, the preset library, Zod validation, manifest/search.
- `packages/renderer` — browser runtime (`mount` / `seek` / `ready`), host page.
- `packages/cli` — `build` (bundle runtime), `render` (Playwright + ffmpeg), `manifest`.

## Preset catalog (v0.1)

- **text:** fade-up, word-stagger, typewriter, pop, blur-in
- **image:** ken-burns, float, reveal-wipe, zoom-in
- **transition:** crossfade, slide, zoom, wipe

## Roadmap

- v0.1 — IR + preset library + multi-renderer + mp4 ✅
- v0.2 — CapCut-grade timeline editor over the same IR + AI copilot
- v0.3 — MCP server (`searchPresets` / `applyPreset` / `setKeyframe`); audio/voiceover tracks
- v0.4 — WebGPU→Metal native compositor (preview == final); parallel render
- v0.5 — content-addressed asset cache + reproducible-render lockfile; exporters
