# VideoGenPro: A Deterministic Motion Graphics Engine an AI Agent Can Author

> Preset-driven video and motion graphics rendering with a CapCut-style browser editor. Multi-renderer across HTML, Three.js and image or video layers, with no AI model anywhere in the render path, so the same project renders identically every single time.

[![License: MIT](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node](https://img.shields.io/badge/Node-18+-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![pnpm](https://img.shields.io/badge/pnpm-F69220?style=for-the-badge&logo=pnpm&logoColor=white)](https://pnpm.io/)

## What it does

Most AI video tools put a generative model in the render path, which means you cannot reproduce a result, cannot fix one frame without re-rolling everything, and cannot trust the output. VideoGenPro takes the opposite approach.

The intelligence lives in the **preset catalog**. An agent, or a person, picks presets, tunes parameters, arranges them on a timeline and sets keyframes. The renderer then does exactly what it is told, deterministically. Same input, same output, every run.

## Why deterministic matters

- **Reproducible**: re-render a project six months later and get the identical file
- **Debuggable**: a wrong frame is a wrong parameter, not a dice roll
- **Reviewable**: diffs on a project file are meaningful
- **Agent-friendly**: an AI agent can author, inspect and correct a composition programmatically

## Features

- **Preset-driven composition**: a catalog of tuned motion presets rather than freeform code
- **Multi-renderer**: HTML/DOM, Three.js for 3D, plus image and video layers in one timeline
- **Browser studio**: a CapCut-grade editor for arranging, trimming and keyframing
- **Keyframe control**: full parameter animation over time
- **CLI rendering**: headless batch renders via Playwright and ffmpeg
- **Agent-authorable**: designed so an AI agent can write and modify projects directly

## Packages

| Package | Purpose |
|---|---|
| `packages/core` | Composition model, presets, keyframe and timing engine |
| `packages/renderer` | Headless frame capture and video encoding |
| `packages/editor` | Browser-based timeline studio |
| `packages/cli` | Command line interface for scripted and batch renders |

## Getting started

### Prerequisites

- Node.js 18 or newer
- pnpm 10 or newer
- ffmpeg available on your PATH

### Installation

```bash
git clone https://github.com/AnubhavChaturvedi-GitHub/videogenpro.git
cd videogenpro
pnpm install
```

### Run the studio

```bash
pnpm dev
```

### Render from the CLI

```bash
pnpm render <project-file>
```

## Documentation

| Document | What it covers |
|---|---|
| [`docs/AGENT-PLAYBOOK.md`](docs/AGENT-PLAYBOOK.md) | The brief to render workflow |
| [`AGENTS.md`](AGENTS.md) | Authoring reference for presets and compositions |
| [`docs/TEST-SHEET.md`](docs/TEST-SHEET.md) | Known bugs and gaps |
| [`docs/design.md`](docs/design.md) | Brand tokens and design system |

## Tech stack

TypeScript, Node.js, pnpm workspaces, Playwright, ffmpeg, Three.js.

## Contributing

Issues and pull requests are welcome. New presets should be deterministic and covered by a test in `tests/`.

## License

Released under the [MIT License](LICENSE).

## Author

**Anubhav Chaturvedi**, founder of [NetHyTech](https://www.youtube.com/@NetHyTech), a developer community of 30,000+ members.

[![YouTube](https://img.shields.io/badge/YouTube-NetHyTech-FF0000?style=flat-square&logo=youtube&logoColor=white)](https://www.youtube.com/@NetHyTech)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-Connect-0A66C2?style=flat-square&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/anubhav-chaturvedi-/)

If this project saved you time, a star on the repo helps other people find it.
