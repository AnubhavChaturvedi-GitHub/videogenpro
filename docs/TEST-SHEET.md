# VideoGenPro — Test Sheet & Audit

> Produced by a QA agent + a developer/architecture agent (read-only audit). No code was changed.
> Status legend: ☐ pending · ☑ pass · ✗ fail · ⚠ partial

## 0. Summary
- **Bugs found:** 26 (3 Critical/High-impact on the core "determinism" promise)
- **Missing features:** ~45 across editing, effects, audio, render, architecture
- **Test cases:** 70 across 14 areas
- **Top risk:** determinism leaks (stale CSS across frames), audio-duration not persisted, export uses stale/unconfigurable state, render robustness (stalls/missing-audio/no-ffmpeg)

---

## 1. Bug Register

| # | Severity | Area (file) | Bug | Repro / Expected vs Actual |
|---|---|---|---|---|
| B01 | 🔴 High | schema + editor + render | **Audio clip `duration` is silently dropped on save** — schema lacks `duration`, Zod strips it; render never trims by it | Trim an audio clip → reload → trim lost. Export ignores it. |
| B02 | 🔴 High | runtime (applyDelta/applySceneDelta) | **CSS props leak across frames** — `css` keys set one frame never cleared → scrub-back ≠ scrub-forward (breaks determinism) | `image.sketch`/`gradient-sweep`/`glitch`: seek end then start → stale `filter`/`color` persists |
| B03 | 🔴 High | editor `derive()` | **Auto-extend only grows, never shrinks** scene duration | Add 8s clip to 5s scene, delete it → scene stays 8s (dead air) |
| B04 | 🟠 Med | editor `runExport` | **Export renders the on-disk file, ignoring unsaved edits** (250ms debounce) | Change color, click Export immediately → old color in mp4 |
| B05 | 🟠 Med | render `seekVideo` 400ms timeout | **Video frame can be captured at wrong time** under decode stall → stale/duplicate frames, no error | Slow-decoding clip in headless render |
| B06 | 🟠 Med | render (ffmpeg) | **Missing audio file / no ffmpeg aborts whole export** with no graceful handling | Audio src missing → render dies; ffmpeg absent → hang/partial file |
| B07 | 🟠 Med | editor split | **Split doesn't offset keyframes / dups exit presets** — 2nd half keyframes fire at wrong local time | Split a keyframed clip |
| B08 | 🟠 Med | editor resize/derive | **Clips can't be lengthened past scene via handle** (capped at scene length) yet scene only grows via overlong clip → unreachable | Drag right handle past scene end |
| B09 | 🟠 Med | runtime exit presets | **`fromEnd` exit with duration > layer duration starts pre-faded** at t=0 | `out.slide-right` dur 2 on 1s clip |
| B10 | 🟠 Med | serve SSE | **Agent edit + UI edit race = last-writer data loss** (watch 60ms vs save 250ms, no merge) | Edit in UI while agent edits file |
| B11 | 🟠 Med | editor undo | **Undo remounts everything (WebGL/audio churn), clears selection, coarse granularity** (debounce collapses edits) | Undo a text tweak → flash; two fast edits = one undo |
| B12 | 🟠 Med | runtime syncAudio | **Backward scrub during playback doesn't reposition audio** (only re-seeks if drift>0.25s) → A/V desync | Scrub back while playing |
| B13 | 🟡 Low | editor selbox | **Selection box ignores `transform.scale`/`rotate` + center anchor** → box ≠ rendered element | Select a scaled/rotated layer |
| B14 | 🟡 Low | preset `image.sketch` | **Dead opacity code** `1 - fade*0` → "dissolve to photo" is a hard cut | Apply image.sketch, watch end |
| B15 | 🟡 Low | runtime renderLayer | **No layer-type guard** — text presets apply to video/shape silently | `text.glitch` on a video layer |
| B16 | 🟡 Low | serve `/api/open` + static | **Path-traversal guard uses `startsWith(root)`** (sibling-prefix bypass) | `…/video gen pro-evil/…` |
| B17 | 🟡 Low | editor `addLayerAtPlayhead` | **New layer at scene end can start past scene** → invisible, no clamp | Add layer with playhead at scene end |
| B18 | 🟡 Low | schema easing | **Any string accepted as easing** → typo silently linearized, no warning | `easing:"wobble"` |
| B19 | 🟡 Low | runtime seek clamp | **Last composition frame (t=dur) unreachable**; frame-count vs round() mismatch | Inspect final frame |
| B20 | 🟡 Low | editor File→New | **Fragile `setDoc() || scheduleSave()`** double-save pattern | New document |
| B21 | 🟡 Low | upload | **Upload type trusts client MIME/ext**, no byte validation; .mov w/ empty MIME → `<img>` | Upload odd file |
| B22 | 🟡 Low | runtime transition | **Only previous scene considered**; long transition on a very short scene freezes prev | tdur > prev-scene duration |
| B23 | 🟡 Low | editor text style | **`text.expand` overwrites a user `letterSpacing`** every frame (css last-writer) | Text w/ letterSpacing + expand |
| B24 | 🟡 Low | editor `fit()` | **Brittle `parentElement.parentElement`** DOM assumption; handle inverse-scale capped 2.4 | Resize window / tiny preview |
| B25 | 🟡 Low | runtime audio active | **`el.duration` NaN before metadata** → track "active" forever until load | First frames before audio loads |
| B26 | 🟡 Low | image.reveal-wipe | **Edge param quantization undocumented** (`from` 0–3 → rounded) | `from:1.5` |

---

## 2. Missing Features Register

### Editing (timeline / canvas)
| Feature | Pri | Effort | Status |
|---|---|---|---|
| Multi-select (marquee / shift-click) | P0 | M | ☐ |
| Copy / paste (incl. cross-scene) | P0 | S | ☐ |
| Snapping / magnetic timeline (playhead, edges, scenes) | P0 | M | ☐ |
| Scene add / delete / reorder UI | P0 | M | ☐ |
| Layer z-order UI (reorder, front/back) | P0 | M | ☐ |
| Layers panel (list, visibility, lock) | P1 | M | ☐ |
| Rotation handle + aspect-lock on canvas | P1 | M | ☐ |
| Alignment / smart guides | P1 | M | ☐ |
| Ripple edit / track lock | P1 | M | ☐ |
| Clip thumbnails / video filmstrip | P1 | M | ☐ |
| Markers / chapters · zoom slider · grouping/nesting | P2 | S–L | ☐ |

### Effects / animation
| Feature | Pri | Effort | Status |
|---|---|---|---|
| Caption / subtitle system synced to audio | P0 | L | ☐ |
| Keyframe easing **editable** + bezier curve editor | P1 | M | ☐ |
| Masking / clip-to-shape / track mattes | P1 | L | ☐ |
| Native color + gradient pickers (currently text inputs) | P1 | S | ☐ |
| WebGL/shader transitions · spring physics · karaoke text | P2 | M | ☐ |

### Audio
| Feature | Pri | Effort | Status |
|---|---|---|---|
| Real decoded waveform on clips | P0 | M | ☐ |
| TTS / voiceover generation in-app | P0 | M | ☐ |
| Transcription → word-timed captions | P0 | L | ☐ |
| Audio upload in UI (currently image/video only) | P1 | S | ☐ |
| Real audio-reactive (decode/FFT, not synthetic BPM) | P1 | M | ☐ |
| Mute / solo · volume fades/keyframes · ducking | P1 | M | ☐ |

### Rendering / export
| Feature | Pri | Effort | Status |
|---|---|---|---|
| Export options UI (fps/res/format/range/alpha) — button is a stub | P0 | M | ☐ |
| Parallel / sharded render (perf — serial screenshots are the wall) | P0 | L | ☐ |
| Transparent / ProRes / WebM-alpha output | P1 | M | ☐ |
| Partial / incremental re-render · cancel · cloud/queue | P1–P2 | M–L | ☐ |

### Architecture / engineering
| Feature | Pri | Effort | Status |
|---|---|---|---|
| **Tests** (golden-frame determinism + per-preset unit) | P0 | M | ☐ |
| **Typecheck gate** (`tsc --noEmit`; runtime is `any`) | P0 | S | ☐ |
| Lint / format config | P1 | S | ☐ |
| Split monolithic `editor.ts` into modules | P1 | L | ☐ |
| **MCP server** (README advertises it; doesn't exist) | P1 | M | ☐ |
| Persistent project versioning / autosave history | P1 | M | ☐ |
| Plugin API for preset packs | P2 | M | ☐ |
| Accessibility (ARIA/focus) · responsive layout | P2 | M | ☐ |

---

## 3. Test Cases

### A. Layers
| ID | Test | Steps | Expected | Status |
|---|---|---|---|---|
| T01 | Text layer | Add text, multi-line, size 120, color #ff0 | Centered, wraps, styled | ☐ |
| T02 | Text no-style | JSON text w/o `style` | Default Inter 80px #fff, no crash | ☐ |
| T03 | Shapes | Add rect/circle/line, set fill | Correct shapes + fill | ☐ |
| T04 | Image fit | cover vs contain | crop vs letterbox | ☐ |
| T05 | Video trim | trimStart=2, scrub | source t = trim + local | ☐ |
| T06 | HTML/SVG | inline SVG layer | renders + scales | ☐ |
| T07 | 3D determinism | particles, scrub fwd/back | same t → same frame | ☐ |
| T08 | No-rect layer | layer w/o rect | fills frame, centered | ☐ |

### B. Presets / Animations
| ID | Test | Steps | Expected | Status |
|---|---|---|---|---|
| T09 | in.fade | scrub 0→dur | opacity 0→1 then hold | ☐ |
| T10 | out.fade (fromEnd) | 0.6s on 2s clip | holds, fades by end | ☐ |
| T11 | exit overflow (B09) | out dur 2 on 1s clip | not pre-faded at t=0 | ☐ |
| T12 | continuous (ken-burns) | over 5s | f(local/dur), deterministic | ☐ |
| T13 | split word-stagger | 4 words | sequential, no center-shift | ☐ |
| T14 | split typewriter | chars L→R, spaces kept | reveal correct | ☐ |
| T15 | stacked presets | in.fade + float + keyed y | combine correctly | ☐ |
| T16 | CSS leak (B02) | sketch hold .5: seek end→start | filter matches time, not stuck | ☐ |
| T17 | gradient-sweep leak | deactivate→reactivate | no persistent color:transparent | ☐ |
| T18 | type mismatch (B15) | text.glitch on video | defined behavior / no-op | ☐ |
| T19 | param clamp | in.scale from=5 | clamped to max 1 | ☐ |

### C. Keyframes
| ID | Test | Steps | Expected | Status |
|---|---|---|---|---|
| T20 | interp | key x 0→200 | eased interp, holds outside range | ☐ |
| T21 | easing | easeOutBack between keys | overshoot visible | ☐ |
| T22 | single key | one keyframe | constant value | ☐ |
| T23 | clear | add then clear | reverts to base | ☐ |

### D. Transitions
| ID | Test | Steps | Expected | Status |
|---|---|---|---|---|
| T24 | crossfade | 2 scenes | prev out / next in | ☐ |
| T25 | wipe (clipInset) | apply | clip animates | ☐ |
| T26 | circle-iris | apply | clipPath circle grows | ☐ |
| T27 | default vs own | scene has transitionIn | own wins | ☐ |
| T28 | short scene (B22) | tdur > prev dur | acceptable behavior | ☐ |
| T29 | reset | scrub past into mid-scene | transform/opacity/clip/filter reset | ☐ |

### E. Timeline editing
| ID | Test | Steps | Expected | Status |
|---|---|---|---|---|
| T30 | drag move | drag clip | start clamps ≥0, ≤scene | ☐ |
| T31 | resize (B08) | right handle | can lengthen as intended | ☐ |
| T32 | auto-extend (B03) | add 8s to 5s, delete | scene shrinks back | ☐ |
| T33 | zoom | ctrl+scroll | pxPerSec changes, anchored | ☐ |
| T34 | ruler seek | click+drag | playhead follows, pauses | ☐ |
| T35 | split | mid-clip, S | two clips sum to original | ☐ |
| T36 | split keyframes (B07) | split keyed clip | 2nd-half keys correct | ☐ |
| T37 | split edge | at clip start | no split, message | ☐ |
| T38 | duplicate | ⌘D | copy at +0.2s, selected | ☐ |

### F. Audio
| ID | Test | Steps | Expected | Status |
|---|---|---|---|---|
| T39 | playback | play | plays at start offset + volume | ☐ |
| T40 | resize persist (B01) | trim, reload | duration persists | ☐ |
| T41 | volume | set 0.3 | preview + export attenuate | ☐ |
| T42 | scrub vs play (B12) | scrub during play | audio repositions | ☐ |
| T43 | autoplay gesture | space before click | first pointer kicks audio | ☐ |
| T44 | lane render | scroll to audio lane | 3 clips at correct times | ☐ |

### G. Undo / Redo
| ID | Test | Steps | Expected | Status |
|---|---|---|---|---|
| T45 | basic | 3 edits, undo×3, redo×3 | exact restore | ☐ |
| T46 | selection (B11) | edit, undo | sensible selection | ☐ |
| T47 | granularity (B11) | 2 edits <250ms | predictable steps | ☐ |

### H. File ops
| ID | Test | Steps | Expected | Status |
|---|---|---|---|---|
| T48 | New | File→New | blank scene, history reset | ☐ |
| T49 | Open | open another json | ir + assetBase swap | ☐ |
| T50 | Import bad | malformed json | ignored, no crash | ☐ |
| T51 | Save | ⌘S | downloads pretty json | ☐ |

### I. Export / Render
| ID | Test | Steps | Expected | Status |
|---|---|---|---|---|
| T52 | basic | export hello | mp4, faststart, duration ok | ☐ |
| T53 | audio mux | 3 tracks | mixed, delayed, volume | ☐ |
| T54 | missing audio (B06) | bad src | graceful failure | ☐ |
| T55 | no ffmpeg (B06) | ffmpeg absent | clean error, no hang/partial | ☐ |
| T56 | unsaved (B04) | edit then export | latest edit included | ☐ |
| T57 | video stall (B05) | slow clip | no stale/dup frames | ☐ |
| T58 | progress | export | live % bar, opens on done | ☐ |

### J. Sync (agent ↔ UI)
| ID | Test | Steps | Expected | Status |
|---|---|---|---|---|
| T59 | agent edit | edit file externally | UI updates, "agent edit" | ☐ |
| T60 | echo | UI edit | no self re-apply/flicker | ☐ |
| T61 | race (B10) | simultaneous edits | defined merge, no loss | ☐ |
| T62 | invalid POST | bad IR | 400, "invalid" status | ☐ |

### K. Preview playback
| ID | Test | Steps | Expected | Status |
|---|---|---|---|---|
| T63 | loop | enable, play past end | wraps to 0 | ☐ |
| T64 | no-loop | disable, play to end | stops, toggles off | ☐ |
| T65 | preview==render (det.) | preview.html vs render at same t | identical (modulo video) | ☐ |

### L. UI / Canvas
| ID | Test | Steps | Expected | Status |
|---|---|---|---|---|
| T66 | canvas drag scale | drag w/ preview <1 | matches cursor (÷scale) | ☐ |
| T67 | selbox scale (B13) | select scaled layer | box matches element | ☐ |
| T68 | resize handles | all 4 corners | rect updates, opposite anchored | ☐ |
| T69 | keyboard | arrows/Del/S/⌘D/⌘Z | each works, ignored in inputs | ☐ |
| T70 | empty/long comp | empty scene; 600s scene | graceful, scrolls, autoFit caps | ☐ |

---

## 4. Recommended fix order (when you give the go)
1. **B02** CSS-leak determinism · **B01** audio-duration persist · **B03/B08** auto-extend/resize
2. **B04** export-uses-stale · **B05/B06** render robustness (stall, missing audio, no-ffmpeg)
3. **B07** split keyframes · **B09** exit overflow · **B12** audio scrub · **B10** edit race
4. Tests + typecheck gate (lock determinism), then export-options UI
5. Remaining Low bugs + P0 missing features (multi-select, snapping, captions/TTS)
