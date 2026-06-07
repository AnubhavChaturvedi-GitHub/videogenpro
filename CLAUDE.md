# VideoGenPro — read this first

You are an AI agent (Claude Code, Codex, or similar) working inside **VideoGenPro**, a
deterministic, *agent-authorable* video engine. Your job here is simple to state:

> **Turn a user's brief into a finished video.** Plan the scenes, place the layers
> (text · image · video · shape · 3D · html), choose animations from the preset catalog,
> add audio, preview it, render it to MP4 — and leave it in a clean, well-structured state
> so the user can open the Studio editor and customize anything afterward.

There is **no AI model in the render path.** The intelligence is *you* + the preset catalog.
You don't write motion code; you pick presets by intent, tune them by range, arrange layers,
and keyframe when needed. Every animation is a pure function of time, so what you preview is
exactly what renders.

## The one source of truth
A single **composition JSON file** (the "Scene IR") is the entire video. Code, the editor,
and you all read and write *that one file*. When the Studio dev server is running, your edits
to the file appear live in the browser, and the user's UI edits are written back to the same
file for you to read.

## Reading order (don't skip)
1. **`README.md`** — architecture, repo layout, commands, the full preset catalog count.
2. **`docs/AGENT-PLAYBOOK.md`** — the step-by-step workflow: brief → finished render. **This
   is your operating manual.** Start a real authoring task here.
3. **`AGENTS.md`** — the authoring *contract*: IR fields, presets, keyframes, how to add a new
   preset/effect. Your reference while editing.
4. **`docs/TEST-SHEET.md`** — known bugs/gaps. Check before assuming something is broken.

## The commands you'll actually use
```bash
pnpm install                                  # once
npx playwright install chromium               # once — needed for headless render
pnpm build:runtime                            # rebuild after editing runtime/editor/core
pnpm manifest                                 # the machine-readable preset catalog (search this to pick animations)
pnpm studio your-composition.json 5174        # Studio editor + live two-way sync at :5174
pnpm render your-composition.json out/x.mp4   # headless export (Playwright → ffmpeg, with audio)
pnpm check                                     # tsc --noEmit — keep green before you commit
```

## Golden rules (non-negotiable)
- **Determinism.** No `Date.now()`, no `Math.random()` (seed by `ctx.index`), no `setTimeout`/
  rAF as a source of truth. Same `seek(t)` → same frame, always. This is why `render == preview`.
- **Validate against the schema.** `packages/core/src/schema.ts` (Zod) rejects bad documents on
  save. Every preset/effect id you use must be a *real* registered id — a hallucinated id passes
  type-check but fails validation (by design). Use `pnpm manifest` to get real ids.
- **Assets travel with the project.** Store every media `src` *relative to the composition file*
  (the editor co-locates them in an `assets/` folder). Never hardcode absolute paths.
- **Rebuild after engine edits.** Any change to `runtime.ts` / `editor.ts` / `core/` needs
  `pnpm build:runtime`, then restart `pnpm studio`, then smoke-test.
- **Verify before you claim done.** Render a short pass or load the studio headless and confirm
  no console errors — don't assert "it works" from the JSON alone.

## Reconcile with the user's manual edits BEFORE you change anything

The user edits the same file you do — by hand, in the Studio UI. Those edits are **already
saved to disk** the instant they make them (the editor writes them). They are not "drafts" and
they are not yours to discard. Your job is to *recognize and preserve* them, never silently
overwrite them. Nothing in the engine locks a manual edit, so this discipline is the protection.

**On every new instruction, run this handshake:**

1. **Re-read the composition file first.** Always start from the current saved state, never from
   your memory of what you last wrote. The file is the truth.
2. **Diff it against what you last knew.** *Within this conversation* you have the previous
   version in context — compare, and identify anything that changed that **you didn't do**
   (e.g. the user centered a title, moved a layer, retimed a clip). *If you have no baseline*
   (new session, no saved snapshot), say so plainly — don't invent a change list.
3. **Surface and confirm — when a change is detected or the edit is non-trivial.** Tell the user
   what you see: *"I notice you centered the title in scene 1 and shortened scene 2. Is that the
   full set of manual changes?"* Then wait. (Don't interrogate on tiny, obviously-safe edits.)
4. **Acknowledge.** Once confirmed: *"Got it — I'll treat those as intentional and preserve
   them."* You are **not** re-saving the user's edit (it's already on disk); you are registering
   it so you don't clobber it.
5. **Edit surgically.** Make *only* the change requested. Touch the centered title, the moved
   layer, the retimed clip **only** if the new instruction is specifically about them. Never
   regenerate the whole composition from the original brief — that is how manual edits get lost.

> Rule of thumb: **read → recognize → confirm → preserve → surgical edit.** If you ever can't
> tell whether something was the user's deliberate change, ask before touching it.

Want hard enforcement instead of discipline? A `locked: true` flag on layers (user "pins" an
element; the agent must not modify it) and/or the planned MCP server would make this structural.
Until then, follow the handshake above.

## What "customize" means here
After you build the video, the user opens the **Studio editor** (`pnpm studio`) — a CapCut-style
UI over the *same* IR you wrote: timeline, drag/trim clips, properties with param sliders,
keyframe buttons, an animation library, drag-drop transitions, and MP4 export. Anything you
authored, they can adjust by hand; anything they adjust, you can read back from the file. You
are co-editors of one document.
