// VideoGenPro Studio — CapCut-style editor over the Scene IR.
// IR is the single source of truth, shared with the agent via the dev server.
import { buildManifest, getPreset, resolveParams } from '../../core/src/index';

declare const VGP: any;
const MANIFEST = buildManifest();
const MAN = new Map(MANIFEST.map((e) => [e.id, e]));
// Must equal the rendered .track-label / sticky scene-tag column width (CSS
// .track-label width:104px). Drives ALL time<->pixel mapping (ruler ticks,
// clips, playhead, seams, click-to-seek) so content lines up with the label edge.
const LABELW = 104;
// Single shared zoom range — every zoom mutator (Fit, +/- buttons, ctrl-wheel,
// autoFit) clamps to [PX_MIN, PX_MAX] so the reachable zoom is identical and Fit
// can never leave the timeline in a state the wheel cannot continue from.
const PX_MIN = 6, PX_MAX = 800;
const KF_EASINGS = ['linear', 'easeIn', 'easeOut', 'easeInOut', 'easeOutBack', 'easeOutExpo', 'easeOutCubic', 'easeInOutCubic'];

// ---------- icons (Lucide-style, inline SVG) ----------
const I: Record<string, string> = {
  play: '<polygon points="6 3 20 12 6 21 6 3"/>',
  pause: '<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>',
  start: '<polygon points="19 20 9 12 19 4 19 20"/><line x1="5" y1="19" x2="5" y2="5"/>',
  back: '<polygon points="11 19 2 12 11 5 11 19"/><polygon points="22 19 13 12 22 5 22 19"/>',
  fwd: '<polygon points="13 19 22 12 13 5 13 19"/><polygon points="2 19 11 12 2 5 2 19"/>',
  loop: '<polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>',
  text: '<polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/>',
  image: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>',
  video: '<rect x="2" y="2" width="20" height="20" rx="2"/><path d="M10 8l6 4-6 4V8z"/>',
  shape: '<rect x="4" y="4" width="16" height="16" rx="2"/>',
  line: '<line x1="4" y1="12" x2="20" y2="12"/>',
  undo: '<path d="M3 7v6h6"/><path d="M3 13a9 9 0 1 0 3-7L3 9"/>',
  redo: '<path d="M21 7v6h-6"/><path d="M21 13a9 9 0 1 1-3-7l3 3"/>',
  split: '<circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><line x1="20" y1="4" x2="8.12" y2="15.88"/><line x1="14.47" y1="14.48" x2="20" y2="20"/><line x1="8.12" y1="8.12" x2="12" y2="12"/>',
  copy: '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
  audio: '<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',
  fit: '<polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/>',
  code: '<polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>',
  layers: '<polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>',
  grid: '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>',
  arrTop: '<polyline points="17 11 12 6 7 11"/><polyline points="17 18 12 13 7 18"/>',
  arrUp: '<polyline points="18 15 12 9 6 15"/>',
  arrDown: '<polyline points="6 9 12 15 18 9"/>',
  arrBot: '<polyline points="7 13 12 18 17 13"/><polyline points="7 6 12 11 17 6"/>',
  full: '<path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/>',
  cube: '<path d="M21 8l-9-5-9 5 9 5 9-5z"/><path d="M3 8v8l9 5 9-5V8"/><line x1="12" y1="13" x2="12" y2="21"/>',
  trash: '<polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/>',
  plus: '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
  upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>',
  file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>',
  folder: '<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>',
  save: '<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>',
  download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>',
  spark: '<path d="M12 3l1.9 5.8L20 10.7l-5.1 1.9L12 18l-1.9-5.4L5 10.7l6.1-1.9z"/>',
  sliders: '<line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/>',
};
const icon = (n: string) => `<svg viewBox="0 0 24 24">${I[n] ?? ''}</svg>`;
const typeIco: Record<string, string> = { text: 'text', image: 'image', video: 'video', shape: 'shape', three: 'cube', html: 'text', overlay: 'sliders', fx: 'spark' };
const clipColor: Record<string, string> = { text: 'var(--clip-text)', image: 'var(--clip-image)', three: 'var(--clip-three)', shape: 'var(--clip-shape)', html: 'var(--clip-html)', video: 'var(--clip-video)', overlay: 'var(--clip-overlay)', fx: 'var(--clip-fx)' };
const typeTint: Record<string, string> = { text: 'var(--t-text)', image: 'var(--t-image)', video: 'var(--t-video)', three: 'var(--t-three)', shape: 'var(--t-shape)', html: 'var(--t-html)', audio: 'var(--t-audio)', overlay: 'var(--t-overlay)', fx: 'var(--t-fx)' };
// label shown on a clip/track for a layer
const layerLabel = (l: any) => l.type === 'text' ? String(l.text) : l.type === 'fx' ? String(l.effect).split('.')[1].replace(/-/g, ' ') : l.type === 'overlay' ? ('overlay ' + String(l.effect).replace(/-/g, ' ')) : l.type;
const tintIcon = (n: string, type: string) => `<span style="color:${typeTint[type] || '#fff'}">${icon(n)}</span>`;

// library category tabs → preset categories
const CATS = [
  { key: 'text', label: 'Text', icon: 'text' },
  { key: 'image', label: 'Video / Image', icon: 'video' },
  { key: 'audio', label: 'Audio', icon: 'spark' },
  { key: 'in', label: 'Fade In', icon: 'plus' },
  { key: 'out', label: 'Fade Out', icon: 'plus' },
  { key: 'overlay', label: 'Overlays', icon: 'sliders' },
  { key: 'transition', label: 'Transitions', icon: 'loop' },
];

type State = {
  ir: any; assetBase: string; assets: any[];
  selected: { s: number; l: number } | null; selAudio: number | null;
  playhead: number; playing: boolean; loop: boolean; pxPerSec: number; scale: number;
  offsets: number[]; total: number; lastSyncJson: string;
  panel: 'props' | 'anim'; cat: string;
  history: string[]; histIndex: number;
  sceneBase: number[];
};
const S: State = {
  ir: null, assetBase: '/', assets: [], selected: null, selAudio: null, playhead: 0, playing: false, loop: true,
  pxPerSec: 120, scale: 1, offsets: [], total: 0, lastSyncJson: '', panel: 'props', cat: 'text',
  history: [], histIndex: -1, sceneBase: [],
};

// capture each scene's authored/intended duration so derive() can shrink back
// to it after an over-long clip is removed (B03). Call on load/setDoc/open.
function captureSceneBase() {
  S.sceneBase = S.ir.scenes.map((sc: any) => (sc.duration ?? 0.5));
}

const $ = (id: string) => document.getElementById(id)!;
const el = (tag: string, cls?: string) => { const e = document.createElement(tag); if (cls) e.className = cls; return e; };
const baseUrl = () => new URL(S.assetBase, location.origin).href;
const assetUrl = (src: string) => new URL(src, baseUrl()).href;
// time formatting: m:ss for the ruler, m:ss.cs for the playhead readout
const fmtClock = (s: number) => { s = Math.max(0, s); return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`; };
const fmtClockMs = (s: number) => { s = Math.max(0, s); return `${Math.floor(s / 60)}:${(s % 60).toFixed(2).padStart(5, '0')}`; };

function derive() {
  // auto-extend each scene to fit its latest clip, AND shrink back to its
  // authored base when the over-long clip is removed (B03). Only clips with an
  // EXPLICIT duration extend the scene — full-scene layers (no duration) must
  // not, or the scene would grow every tick (start + sceneDuration always
  // exceeds it). duration = max(0.5, sceneBase, maxExplicitClipEnd).
  if (S.sceneBase.length !== S.ir.scenes.length) captureSceneBase();
  S.ir.scenes.forEach((sc: any, i: number) => {
    let maxEnd = 0;
    // fx control-layers render nothing, so they must not auto-extend the scene
    // (otherwise an effect's timing window inflates the composition length).
    for (const l of sc.layers) if (l.duration != null && l.type !== 'fx') maxEnd = Math.max(maxEnd, (l.start ?? 0) + l.duration);
    const base = S.sceneBase[i] ?? 0.5;
    sc.duration = +Math.max(0.5, base, maxEnd).toFixed(2);
  });
  S.offsets = []; let a = 0; for (const sc of S.ir.scenes) { S.offsets.push(a); a += sc.duration; } S.total = a; if (S.playhead > S.total) S.playhead = 0;
}
function sceneAt(t: number) { let si = 0; for (let i = S.offsets.length - 1; i >= 0; i--) if (t >= S.offsets[i]) { si = i; break; } return si; }
// effective composition length: max of scene total and any audio that runs past
// the last scene, so audio tails are reachable/scrubbable (matches the intent of
// accounting for audio in the playhead range).
function effectiveTotal() {
  let t = S.total;
  // B-eff-audiotail: mirror runtime effectiveDuration() — when a track has no
  // explicit duration, fall back to the loaded file length (meta - trimStart) so the
  // editor playhead/ruler can scrub the full untrimmed audio tail like the renderer.
  const info = (typeof VGP?.audioInfo === 'function' ? VGP.audioInfo() : []) as any[];
  (S.ir?.audio ?? []).forEach((a: any, i: number) => {
    let dur = a.duration;
    if (dur == null) { const fileDur = info?.[i]?.duration ?? null; if (fileDur != null) dur = Math.max(0, fileDur - (a.trimStart ?? 0)); }
    const end = (a.start ?? 0) + (dur ?? 0); if (end > t) t = end;
  });
  return t;
}
// easing functions mirrored from core/src/easing.ts so the editor can show the
// same interpolated value the runtime renders (keyframeValueAt).
const EASE_FNS: Record<string, (p: number) => number> = {
  linear: (p) => p,
  easeIn: (p) => p * p,
  easeOut: (p) => 1 - (1 - p) * (1 - p),
  easeInOut: (p) => (p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2),
  easeOutCubic: (p) => 1 - Math.pow(1 - p, 3),
  easeInOutCubic: (p) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2),
  easeOutExpo: (p) => (p >= 1 ? 1 : 1 - Math.pow(2, -10 * p)),
  easeOutBack: (p) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(p - 1, 3) + c1 * Math.pow(p - 1, 2); },
};
// mirror of runtime keyframeValue(): interpolated value at layer-local time t.
function keyframeValueAt(kfs: any[] | undefined, t: number, fallback: number): number {
  if (!kfs || kfs.length === 0) return fallback;
  if (t <= kfs[0].t) return kfs[0].value;
  if (t >= kfs[kfs.length - 1].t) return kfs[kfs.length - 1].value;
  for (let i = 0; i < kfs.length - 1; i++) {
    const a = kfs[i], b = kfs[i + 1];
    // B-ease-default: core ease() resolves an undefined easing to LINEAR. Mirror
    // that here (was easeInOut) so editor preview == runtime render for any keyframe
    // whose `easing` is unset (hand-authored/imported IR).
    if (t >= a.t && t <= b.t) { const local = (t - a.t) / (b.t - a.t); const e = (EASE_FNS[b.easing] ?? EASE_FNS.linear)(local); return a.value + (b.value - a.value) * e; }
  }
  return fallback;
}
// the interpolated transform value of a layer at the current playhead — matches
// what the runtime renders (used by the selection box, hit-test, drag, sliders).
function tfAt(layer: any, sceneIdx: number, prop: string, fallback: number): number {
  const off = S.offsets[sceneIdx] ?? 0; const localT = S.playhead - (off + (layer.start ?? 0));
  return keyframeValueAt(layer.keyframes?.[prop], localT, fallback);
}
const isKeyframed = (layer: any, prop: string) => (layer?.keyframes?.[prop]?.length ?? 0) > 0;
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
// per-instance progress — mirror of runtime presetProgress() so the editor folds
// the SAME preset deltas the runtime paints (B-selbox-presets).
function presetProgressE(inst: any, layerLocalT: number, layerDur: number, continuous: boolean): number {
  if (continuous) return clamp01(layerLocalT / Math.max(0.0001, layerDur));
  const preset: any = getPreset(inst.id);
  const dur = inst.duration ?? preset?.defaultDuration ?? 0.6;
  if (preset?.fromEnd) { const effDur = Math.min(dur, layerDur); return clamp01((layerLocalT - (layerDur - effDur)) / Math.max(0.0001, effDur)); }
  const start = inst.start ?? 0;
  return clamp01((layerLocalT - start) / Math.max(0.0001, dur));
}
// The actual on-screen transform delta the runtime paints for a layer at the
// current playhead: base (transform + keyframes) combined with EVERY active preset
// (own presets timed to the layer + fx control-layers targeting it, timed to their
// own window) — mirror of runtime renderLayer()'s combine() (B-selbox-presets).
// Split/text-split presets affect spans, not the box, so they're excluded here as
// the runtime excludes them from the whole-layer delta. Pure fn of seek time.
function renderedDelta(layer: any, sceneIdx: number): { x: number; y: number; scale: number; rotate: number; opacity: number } {
  const scene = S.ir.scenes[sceneIdx]; const off = S.offsets[sceneIdx] ?? 0;
  const sceneLocalT = S.playhead - off; const start = layer.start ?? 0; const dur = layer.duration ?? scene.duration;
  const layerLocalT = sceneLocalT - start;
  // base from transform + keyframes (interpolated)
  const out = {
    x: tfAt(layer, sceneIdx, 'x', layer.transform?.x ?? 0),
    y: tfAt(layer, sceneIdx, 'y', layer.transform?.y ?? 0),
    scale: tfAt(layer, sceneIdx, 'scale', layer.transform?.scale ?? 1),
    rotate: tfAt(layer, sceneIdx, 'rotate', layer.transform?.rotate ?? 0),
    opacity: tfAt(layer, sceneIdx, 'opacity', layer.transform?.opacity ?? 1),
  };
  // gather entries exactly like the runtime: own presets (layer-local) + active fx
  const entries: { inst: any; localT: number; dur: number }[] = (layer.presets ?? []).map((inst: any) => ({ inst, localT: layerLocalT, dur }));
  const myIdx = scene.layers.indexOf(layer);
  scene.layers.forEach((fx: any, j: number) => {
    if (fx.type !== 'fx') return; const tgt = resolveFxTarget(scene, j); if (!tgt || tgt.index !== myIdx) return;
    const fs = fx.start ?? 0, fd = fx.duration ?? scene.duration;
    if (sceneLocalT >= fs - 0.0001 && sceneLocalT < fs + fd + 0.0001) entries.push({ inst: { id: fx.effect, params: fx.params }, localT: sceneLocalT - fs, dur: fd });
  });
  for (const e of entries) {
    const preset: any = getPreset(e.inst.id);
    if (!preset || !preset.apply || preset.split) continue;
    if (preset.category === 'text' && layer.type !== 'text') continue;
    const p = presetProgressE(e.inst, e.localT, e.dur, !!preset.continuous);
    const d: any = preset.apply(p, resolveParams(preset, e.inst.params), { index: 0, count: 1, time: e.localT, dur: e.dur });
    // combine() semantics: x/y/rotate add, scale/opacity multiply
    if (d.x) out.x += d.x; if (d.y) out.y += d.y;
    if (d.scale !== undefined) out.scale *= d.scale;
    if (d.scaleX !== undefined) out.scale *= d.scaleX;
    if (d.scaleY !== undefined) out.scale *= d.scaleY;
    if (d.rotate) out.rotate += d.rotate;
    if (d.opacity !== undefined) out.opacity *= d.opacity;
  }
  return out;
}
// B-resize-presetguard: true when the layer is sitting INSIDE an active non-continuous
// transform preset (entrance/offset) at the playhead — i.e. its progress is strictly
// in (0,1) and it actually moves/scales/rotates the box. In that window the visible
// box is in animated space while a resize writes the REST rect, so the committed
// geometry wouldn't match what the user sees. Pure fn of seek time. Considers own
// presets and active fx, mirroring renderedDelta()'s entry gathering.
function activeTransformPreset(layer: any, sceneIdx: number): boolean {
  const scene = S.ir.scenes[sceneIdx]; const off = S.offsets[sceneIdx] ?? 0;
  const sceneLocalT = S.playhead - off; const start = layer.start ?? 0; const dur = layer.duration ?? scene.duration;
  const layerLocalT = sceneLocalT - start;
  const entries: { inst: any; localT: number; dur: number }[] = (layer.presets ?? []).map((inst: any) => ({ inst, localT: layerLocalT, dur }));
  const myIdx = scene.layers.indexOf(layer);
  scene.layers.forEach((fx: any, j: number) => {
    if (fx.type !== 'fx') return; const tgt = resolveFxTarget(scene, j); if (!tgt || tgt.index !== myIdx) return;
    const fs = fx.start ?? 0, fd = fx.duration ?? scene.duration;
    if (sceneLocalT >= fs - 0.0001 && sceneLocalT < fs + fd + 0.0001) entries.push({ inst: { id: fx.effect, params: fx.params }, localT: sceneLocalT - fs, dur: fd });
  });
  for (const e of entries) {
    const preset: any = getPreset(e.inst.id);
    if (!preset || !preset.apply || preset.split || preset.continuous) continue;
    if (preset.category === 'text' && layer.type !== 'text') continue;
    const p = presetProgressE(e.inst, e.localT, e.dur, false);
    if (p <= 0.0001 || p >= 0.9999) continue; // settled (rest) — not mid-animation
    const d: any = preset.apply(p, resolveParams(preset, e.inst.params), { index: 0, count: 1, time: e.localT, dur: e.dur });
    if (d.x || d.y || d.rotate || (d.scale !== undefined && d.scale !== 1) || (d.scaleX !== undefined && d.scaleX !== 1) || (d.scaleY !== undefined && d.scaleY !== 1)) return true;
  }
  return false;
}
// natural source length of a video layer, read from the live preview <video> the
// runtime mounted (matched by resolved src). null until metadata loads / no match.
// Used to cap right-edge trim so a clip can't be trimmed past its footage.
function videoSrcDuration(layer: any): number | null {
  if (layer?.type !== 'video' || !layer.src) return null;
  const want = assetUrl(layer.src);
  const vids = Array.from(document.querySelectorAll('#stage video')) as HTMLVideoElement[];
  for (const v of vids) { if ((v.currentSrc || v.src) === want && isFinite(v.duration) && v.duration > 0) return v.duration; }
  return null;
}
// resolve the content layer an fx at array index `idx` drives, using the SAME
// rule as the runtime (runtime.ts:353 — nearest non-fx, non-overlay layer below).
function resolveFxTarget(scene: any, idx: number): { layer: any; index: number } | null {
  for (let j = idx - 1; j >= 0; j--) { const ty = scene.layers[j]?.type; if (ty !== 'fx' && ty !== 'overlay') return { layer: scene.layers[j], index: j }; }
  return null;
}
// renormalise zIndex to match array (== paint) order across a scene's layers.
// Single source of truth — called by every order-changing operation so paint
// order and z-order never diverge. Overlays keep a high sentinel so they stay on
// top, but ordered by array index among themselves.
function normalizeZ(sceneIdx: number) {
  const arr = S.ir.scenes[sceneIdx]?.layers; if (!arr) return;
  arr.forEach((L: any, i: number) => { L.zIndex = L.type === 'overlay' ? 9000 + i : i; });
}
// single source of truth for client-X -> timeline-time conversion (clip-click
// seek and background scrub must stay mathematically identical). Optional cached
// rect avoids a forced layout read per pointer move during a scrub.
function timeAtClientX(clientX: number, rectLeft?: number): number {
  const left = rectLeft ?? $('tlInner').getBoundingClientRect().left;
  return (clientX - left - LABELW) / S.pxPerSec;
}
// shared clamp policy for the four drag handlers so move/trim can't diverge.
const clampStart = (s: number, max: number) => +Math.max(0, Math.min(max, s)).toFixed(3);
const clampDuration = (d: number, min: number, max: number) => +Math.max(min, Math.min(max, d)).toFixed(3);
// B-snap: snap a candidate ABSOLUTE composition time to nearby significant times
// (playhead, scene boundaries, 0, neighbouring clip edges) within ~8px. Pure fn of
// the inputs (no wall-clock). Pass bypass=true (Alt held) to disable. `targets` are
// absolute times; returns the snapped time (or the original if nothing is in range).
const SNAP_PX = 8;
function snapTime(absT: number, targets: number[], bypass: boolean): number {
  if (bypass) return absT;
  const tol = SNAP_PX / S.pxPerSec;
  let best = absT, bestD = tol;
  for (const t of targets) { const d = Math.abs(t - absT); if (d <= bestD) { bestD = d; best = t; } }
  return best;
}
// collect snap targets for a scene clip edge gesture: 0, playhead, all scene
// boundaries, and the start/end of every OTHER clip in the same scene (absolute).
function sceneSnapTargets(si: number, scene: any, exceptLi: number): number[] {
  const out: number[] = [0, S.playhead, ...S.offsets];
  const sceneOff = S.offsets[si] ?? 0;
  scene.layers.forEach((L: any, j: number) => { if (j === exceptLi) return; const st = sceneOff + (L.start ?? 0); const du = L.duration ?? scene.duration; out.push(st, st + du); });
  return out;
}
// preset applicability against a target layer type (mirrors runtime's no-ops):
// text/split presets only work on text layers; fx never targets overlay layers.
function presetAppliesTo(presetId: string, layerType: string): boolean {
  if (layerType === 'overlay') return false; // runtime resolves fx onto content below, never the overlay
  const e: any = MAN.get(presetId);
  if (e && (e.category === 'text' || e.split) && layerType !== 'text') return false;
  return true;
}

// ---------- preview ----------
function fit() {
  // B24: query .stagewrap directly instead of brittle parentElement chains.
  const wrap = (document.querySelector('.stagewrap') ?? $('scaler').parentElement) as HTMLElement;
  const cap = document.fullscreenElement ? 8 : 1; // allow scaling up in fullscreen
  const pad = document.fullscreenElement ? 0 : 40;
  const s = Math.min((wrap.clientWidth - pad) / S.ir.width, (wrap.clientHeight - pad) / S.ir.height, cap);
  S.scale = s;
  const sc = $('scaler'); sc.style.width = S.ir.width + 'px'; sc.style.height = S.ir.height + 'px'; sc.style.transform = `scale(${s})`;
}
function mountPreview() { VGP.mount(S.ir, { assetBase: baseUrl() }); fit(); VGP.seek(S.playhead, { playing: S.playing }); }
const liveSeek = () => VGP.seek(S.playhead, { playing: S.playing });

// ---------- sync ----------
let saveTimer: any;
function setDot(state: string, text?: string) { $('syncDot').className = 'dot ' + state; $('syncText').textContent = text ?? state; }
// non-blocking top-center toast — auto-hides after ~2s, resets any prior timer
let toastTimer: any;
function showToast(msg: string) {
  const t = $('toast'); t.textContent = msg; t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2000);
}
function scheduleSave() {
  setDot('edited', 'editing');
  clearTimeout(saveTimer);
  saveTimer = setTimeout(async () => {
    const body = JSON.stringify(S.ir); S.lastSyncJson = body; pushHistory(body); setDot('saving', 'saving');
    try { const r = await fetch('/api/composition', { method: 'POST', headers: { 'content-type': 'application/json' }, body }); setDot(r.ok ? 'saved' : 'edited', r.ok ? 'synced' : 'invalid'); }
    catch { setDot('edited', 'offline'); }
  }, 250);
}
// undo/redo history — one entry per committed edit (debounced save)
function pushHistory(json: string) {
  if (json === S.history[S.histIndex]) return;
  S.history = S.history.slice(0, S.histIndex + 1);
  S.history.push(json);
  if (S.history.length > 120) S.history.shift();
  S.histIndex = S.history.length - 1;
}
function applyHistory() {
  const json = S.history[S.histIndex]; if (!json) return;
  // B11: preserve selection across undo/redo when the indices are still valid.
  const prevSel = S.selected; const prevAudio = S.selAudio;
  S.ir = JSON.parse(json); S.lastSyncJson = json;
  S.selected = (prevSel && S.ir.scenes[prevSel.s]?.layers?.[prevSel.l]) ? prevSel : null;
  S.selAudio = (prevAudio != null && S.ir.audio?.[prevAudio]) ? prevAudio : null;
  derive(); mountPreview(); buildTimeline(); renderRight(); updateTime();
  fetch('/api/composition', { method: 'POST', headers: { 'content-type': 'application/json' }, body: json }).catch(() => {});
}
function undo() { if (S.histIndex > 0) { S.histIndex--; applyHistory(); setDot('saved', 'undo ↶'); } else setDot('saved', 'nothing to undo'); }
function redo() { if (S.histIndex < S.history.length - 1) { S.histIndex++; applyHistory(); setDot('saved', 'redo ↷'); } }
const liveEdit = () => { liveSeek(); scheduleSave(); };
const timingEdit = () => { liveSeek(); buildTimeline(); scheduleSave(); };
const structuralEdit = () => { mountPreview(); buildTimeline(); renderRight(); scheduleSave(); };
function setDoc(ir: any) { S.ir = ir; S.lastSyncJson = JSON.stringify(ir); S.selected = null; S.history = [S.lastSyncJson]; S.histIndex = 0; captureSceneBase(); ir.scenes.forEach((_: any, i: number) => normalizeZ(i)); derive(); autoFit(); mountPreview(); buildTimeline(); renderRight(); updateTime(); }

// ---------- layer factories ----------
const newText = () => ({ type: 'text', text: 'New Text', style: { fontSize: '72px', color: '#ffffff' }, duration: 2, presets: [{ id: 'in.fade' }], transform: {} });
const newShape = () => ({ type: 'shape', shape: 'rect', fill: '#ffffff', rect: { x: 440, y: 290, w: 400, h: 140 }, duration: 2, presets: [{ id: 'in.scale' }], transform: {} });
const newLine = () => ({ type: 'shape', shape: 'line', fill: '#ffffff', rect: { x: 340, y: 360, w: 600, h: 6 }, duration: 2, presets: [{ id: 'in.slide-left', params: { distance: 120 } }], transform: {} });
const new3D = () => ({ type: 'three', scene: 'particles', props: { speed: 0.3 }, duration: 3, presets: [], transform: {} });
// overlay duration comes from the preset's authored defaultDuration (B-overlay-dur);
// zIndex is owned solely by normalizeZ (9000+i) so we don't stamp a transient
// sentinel here that would diverge if normalizeZ were ever bypassed (B-overlay-z).
const overlayLayerFromId = (id: string) => { const entry = MAN.get(id) as any; const effect = id.split('.')[1]; return { type: 'overlay', effect, params: { amount: entry?.params?.amount?.default ?? 1 }, duration: entry?.defaultDuration ?? 5, presets: [{ id: 'in.fade' }], transform: {} }; };
// an fx control-layer drives an effect (preset) onto the content layer below it
const newFxLayer = (target: any, sceneDur: number, presetId: string) => {
  const entry: any = MAN.get(presetId);
  const full = target.duration ?? sceneDur;
  // one-shot split presets (word-stagger / typewriter) read naturally at their
  // defaultDuration; continuous presets span the whole target window.
  const dur = (entry?.split && !entry?.continuous && entry?.defaultDuration) ? Math.min(full, entry.defaultDuration) : full;
  return { type: 'fx', effect: presetId, params: {}, start: target.start ?? 0, duration: dur };
};
const newAssetLayer = (a: any) => ({ type: a.type, src: a.src, fit: 'cover', duration: 2.5, presets: (a.type === 'image' ? [{ id: 'image.ken-burns' }] : []), transform: {} });
function addLayerAtPlayhead(layer: any) { const si = sceneAt(S.playhead); const maxStart = Math.max(0, S.ir.scenes[si].duration - 0.2); layer.start = Math.max(0, Math.min(maxStart, +(S.playhead - S.offsets[si]).toFixed(2))); S.ir.scenes[si].layers.push(layer); normalizeZ(si); S.selected = { s: si, l: S.ir.scenes[si].layers.length - 1 }; setTab('props'); structuralEdit(); }
function dropLayerAt(clientX: number, layer: any) { const t = Math.max(0, Math.min(S.total, timeAtClientX(clientX))); const si = sceneAt(t); const maxStart = Math.max(0, S.ir.scenes[si].duration - 0.2); layer.start = Math.max(0, Math.min(maxStart, +(t - S.offsets[si]).toFixed(2))); S.ir.scenes[si].layers.push(layer); normalizeZ(si); S.selected = { s: si, l: S.ir.scenes[si].layers.length - 1 }; setTab('props'); structuralEdit(); }

// ---------- assets ----------
async function loadAssets() { try { S.assets = await (await fetch('/api/assets')).json(); } catch { S.assets = []; } renderAssets(); }
const fileType = (f: File) => f.type.startsWith('video') ? 'video' : f.type.startsWith('audio') ? 'audio' : 'image';
async function uploadOne(f: File, type?: string) {
  const ty = type ?? fileType(f);
  try { const a = await (await fetch('/api/upload?name=' + encodeURIComponent(f.name) + '&type=' + ty, { method: 'POST', body: f })).json(); if (a?.src) S.assets.unshift(a); return a; } catch { return null; }
}
async function uploadFiles(files: FileList | File[]) {
  for (const f of Array.from(files)) await uploadOne(f);
  renderAssets();
}
// add an audio track to the composition at the dropped/clicked time
function addAudioTrack(src: string, clientX?: number) {
  S.ir.audio = S.ir.audio || [];
  // B-audio-dropclamp: clamp the drop start to a sane upper bound (consistent with
  // the move handler / props field) so dropping far past content can't stretch the
  // whole timeline into empty space with no snap-back.
  const maxStart = Math.max(0, S.total - 0.1);
  const start = clientX != null ? Math.min(maxStart, Math.max(0, +timeAtClientX(clientX).toFixed(2))) : 0;
  S.ir.audio.push({ src, start, volume: 1 });
  S.selAudio = S.ir.audio.length - 1; S.selected = null; setTab('props'); structuralEdit();
  showToast('Audio track added: ' + src.split('/').pop());
}
function renderAssets() {
  const g = $('assetGrid'); g.innerHTML = '';
  if (!S.assets.length) { const e = el('div', 'empty'); e.style.cssText = 'font-size:11px;padding:14px'; e.textContent = 'No assets yet'; g.appendChild(e); return; }
  S.assets.forEach((a) => {
    const d = el('div', 'asset'); d.draggable = true; const u = assetUrl(a.src);
    if (a.type === 'video') { const v = el('video') as HTMLVideoElement; v.src = u; v.muted = true; d.appendChild(v); }
    else if (a.type === 'audio') { const ph = el('div'); ph.style.cssText = 'display:flex;align-items:center;justify-content:center;width:100%;height:100%;color:var(--t-audio)'; ph.innerHTML = icon('audio'); d.appendChild(ph); }
    else { const im = el('img') as HTMLImageElement; im.src = u; d.appendChild(im); }
    const b = el('div', 'badge'); b.textContent = a.type; d.appendChild(b);
    const nm = el('div', 'nm'); nm.textContent = a.name; d.appendChild(nm);
    d.ondragstart = (e) => e.dataTransfer!.setData('application/x-vgp-asset', JSON.stringify(a));
    g.appendChild(d);
  });
}

// ---------- timeline (grouped by scene) ----------
function buildTimeline() {
  derive();
  const inner = $('tlInner'); inner.innerHTML = '';
  // size to the effective length (scenes OR audio that runs past the last scene)
  // so audio tails remain reachable; the ruler/clips still position from S.total.
  const eff = effectiveTotal();
  const width = LABELW + eff * S.pxPerSec + 40; inner.style.width = width + 'px';

  const ruler = el('div', 'ruler'); ruler.style.width = width + 'px';
  // adaptive tick interval so mm:ss labels never crowd at any zoom level
  const STEPS = [0.5, 1, 2, 5, 10, 15, 30, 60, 120, 300, 600];
  const tickStep = STEPS.find((s) => s * S.pxPerSec >= 64) ?? 600;
  // sub-second ticks need fractional labels or adjacent 0.5s ticks read identically
  const fmtTick = (t: number) => tickStep < 1 ? `${Math.floor(t / 60)}:${(t % 60).toFixed(1).padStart(4, '0')}` : fmtClock(t);
  // minor (unlabeled) subdivisions between majors for finer time judgement.
  // index.html has no .tick.minor rule, so style minors inline here: shorter
  // (offset from the top), dimmer/thinner border, no label — visually subordinate
  // to the labeled major ticks (B-ruler-minor).
  const minorStep = tickStep / 5;
  for (let t = minorStep; t < eff; t += minorStep) { if (Math.abs((t / tickStep) - Math.round(t / tickStep)) < 1e-6) continue; const mk = el('div', 'tick minor'); mk.style.cssText = `left:${LABELW + t * S.pxPerSec}px;top:14px;height:12px;border-left:1px solid var(--border);opacity:.4;padding:0`; ruler.appendChild(mk); }
  // B-ruler-tail-tint: when audio extends past the last scene, tint the audio-tail
  // region of the ruler so the mm:ss labels there aren't misread as scene time. A
  // subtle band from S.total..eff visually demarcates the scene-backed range.
  if (eff > S.total + 1e-6) {
    const tailBand = el('div');
    tailBand.style.cssText = `position:absolute;top:0;bottom:0;left:${LABELW + S.total * S.pxPerSec}px;width:${(eff - S.total) * S.pxPerSec}px;background:repeating-linear-gradient(45deg,rgba(255,255,255,.04) 0 6px,transparent 6px 12px);pointer-events:none`;
    ruler.appendChild(tailBand);
    // a marker line at S.total so the scene-content end is unambiguous
    const mark = el('div');
    mark.style.cssText = `position:absolute;top:0;bottom:0;left:${LABELW + S.total * S.pxPerSec}px;width:0;border-left:1px dashed var(--t-audio);opacity:.6;pointer-events:none`;
    mark.title = `scenes end at ${fmtTick(S.total)} — audio tail beyond this point`;
    ruler.appendChild(mark);
  }
  // span the full effective length (scenes + audio tail) so the audio-tail region
  // shows labels/subdivisions like the rest of the ruler (B-ruler-tail).
  // remember the last regular major's time so the forced end tick can suppress its
  // label when it would visually collide with it (B-ruler-endcollide).
  let lastMajorT = 0;
  for (let t = 0; t <= eff + 0.001; t += tickStep) { const tk = el('div', 'tick'); tk.style.left = (LABELW + t * S.pxPerSec) + 'px'; tk.textContent = fmtTick(t); ruler.appendChild(tk); lastMajorT = t; }
  // always surface the composition end time so the right edge is readable at any
  // zoom. B-ruler-endcollide: if the forced end tick falls within ~64px of the last
  // regular major, suppress its LABEL (keep only the line) so the two mm:ss labels
  // never overlap at high zoom (tickStep=0.5 → adjacent majors a few px apart).
  if (eff - Math.floor(eff / tickStep) * tickStep > 0.01) {
    const endk = el('div', 'tick'); endk.style.left = (LABELW + eff * S.pxPerSec) + 'px';
    const collides = (eff - lastMajorT) * S.pxPerSec < 64;
    if (collides) { endk.textContent = ''; endk.style.borderColor = 'var(--border)'; }
    else endk.textContent = fmtTick(eff);
    ruler.appendChild(endk);
  }
  inner.appendChild(ruler); // seeking handled by the unified timeline handler in init()

  S.ir.scenes.forEach((scene: any, si: number) => {
    const sr = el('div', 'scene-row');
    const tag = el('div', 'scene-tag'); tag.innerHTML = icon('film' in I ? 'film' : 'video') + `Scene ${si + 1} · ${fmtClock(scene.duration)}`; sr.appendChild(tag);
    inner.appendChild(sr);
    // display front-most layer on top. Order rows by EFFECTIVE paint z, not raw
    // array order: overlays paint at 9000+i so they ALWAYS sit above content
    // regardless of array index (B-overlay-stack). Sorting by effective z (desc)
    // makes the row order match what the runtime actually paints; li stays the
    // real array index. Stable sort keeps array order among equal-class layers.
    const effZ = (layer: any, i: number) => layer.type === 'overlay' ? 9000 + i : i;
    scene.layers.map((layer: any, li: number) => ({ layer, li, z: effZ(layer, li) }))
      .sort((a: any, b: any) => b.z - a.z)
      .forEach(({ layer, li }: any) => {
      const track = el('div', 'track');
      const label = el('div', 'track-label'); label.innerHTML = tintIcon(typeIco[layer.type] ?? 'shape', layer.type) + `<span>${layerLabel(layer).slice(0, 9)}</span>`; track.appendChild(label);
      const offset = S.offsets[si] + (layer.start ?? 0); const dur = layer.duration ?? scene.duration;
      const clip = el('div', 'clip');
      clip.style.left = (LABELW + offset * S.pxPerSec) + 'px'; clip.style.width = Math.max(24, dur * S.pxPerSec) + 'px'; clip.style.background = clipColor[layer.type] ?? '#555';
      clip.innerHTML = tintIcon(typeIco[layer.type] ?? 'shape', layer.type) + `<span>${layerLabel(layer).slice(0, 16)}</span>`;
      if (S.selected && S.selected.s === si && S.selected.l === li) clip.classList.add('sel');
      // fx layers that resolve to no content target are orphaned (the runtime
      // never registers them) — flag them visually.
      if (layer.type === 'fx' && !resolveFxTarget(scene, li)) { clip.style.opacity = '.5'; clip.style.outline = '1px dashed var(--clip-fx)'; clip.title = 'effect has no target layer below it'; }
      // keyframe markers: a diamond per keyframe, positioned within the clip.
      // click seeks to the keyframe; right-click removes that single keyframe.
      if (layer.keyframes) {
        // B-kf-stack: diamonds for DIFFERENT properties keyed at the same time used
        // to render exactly on top of each other (same top + x), so only the topmost
        // was clickable/deletable. Stagger them vertically by property so every
        // property's keyframe at a given time is individually targetable.
        const KF_PROPS = ['x', 'y', 'scale', 'rotate', 'opacity'];
        const propRow = (prop: string) => { const ix = KF_PROPS.indexOf(prop); return ix < 0 ? KF_PROPS.length : ix; };
        for (const prop of Object.keys(layer.keyframes)) {
          for (const k of (layer.keyframes[prop] || [])) {
            const m = el('div', 'kf-marker'); m.style.cssText = `position:absolute;top:${1 + propRow(prop) * 8}px;width:7px;height:7px;background:var(--accent);border:1px solid #000;transform:rotate(45deg);left:${Math.max(0, k.t * S.pxPerSec - 3)}px;z-index:3;cursor:pointer`;
            m.title = `${prop} keyframe @ ${(k.t).toFixed(2)}s (click=seek, right-click=delete)`;
            m.addEventListener('mousedown', (ev) => ev.stopPropagation());
            m.addEventListener('click', (ev) => { ev.stopPropagation(); seekTo(S.offsets[si] + (layer.start ?? 0) + k.t); });
            m.addEventListener('contextmenu', (ev) => { ev.preventDefault(); ev.stopPropagation(); const arr = layer.keyframes[prop]; const ix = arr.indexOf(k); if (ix >= 0) arr.splice(ix, 1); if (!arr.length) delete layer.keyframes[prop]; structuralEdit(); });
            clip.appendChild(m);
          }
        }
      }
      const handle = el('div', 'handle'); clip.appendChild(handle);
      // drop an effect/overlay preset card directly onto this clip's layer
      clip.addEventListener('dragover', (e: DragEvent) => {
        const ty = e.dataTransfer?.types ?? [];
        const presetId = ty.includes('application/x-vgp-preset') ? '__p' : '';
        const overlayDrop = ty.includes('application/x-vgp-overlay');
        // only show the accept outline for valid combinations
        if (overlayDrop) { e.preventDefault(); clip.style.outline = '2px solid #fff'; }
        else if (presetId) { e.preventDefault(); clip.style.outline = '2px solid #fff'; }
      });
      clip.addEventListener('dragleave', () => { clip.style.outline = ''; });
      clip.addEventListener('drop', (e: DragEvent) => {
        e.preventDefault(); clip.style.outline = '';
        const ov = e.dataTransfer?.getData('application/x-vgp-overlay');
        if (ov) { dropLayerAt(e.clientX, overlayLayerFromId(ov)); showToast('Overlay layer added: ' + ov.split('.')[1].replace(/-/g, ' ')); return; }
        const id = e.dataTransfer?.getData('application/x-vgp-preset');
        if (!id) return;
        if (!presetAppliesTo(id, layer.type)) { showToast(layer.type === 'overlay' ? "effects can't target an overlay layer" : 'this effect only works on text layers'); return; }
        scene.layers.splice(li + 1, 0, newFxLayer(layer, scene.duration, id)); normalizeZ(si);
        S.selected = { s: si, l: li + 1 }; S.playhead = S.offsets[si] + (layer.start ?? 0) + 0.05; structuralEdit(); showToast('Added ' + id.split('.')[1].replace(/-/g, ' '));
      });
      clip.onmousedown = (e: MouseEvent) => {
        if (e.target === handle || e.button !== 0) return; e.preventDefault();
        const rectLeft = $('tlInner').getBoundingClientRect().left; // cache before any rebuild (B-clip-click)
        const sx = e.clientX, sy = e.clientY, os = layer.start ?? 0; let cand = os; let dyFinal = 0;
        // The gesture is decided on the first significant movement, then locked:
        //  - mostly-HORIZONTAL drag  -> MOVE the clip in time (start).
        //  - mostly-VERTICAL drag    -> REORDER the layer's z (up = toward front /
        //    top of the reversed timeline, down = toward back). Reuses arrangeLayer
        //    so fx units travel with their content and overlays stay above content.
        //  - plain CLICK (no drag)   -> SELECT the clip AND move the playhead to the
        //    click (revised B-clip-click: clicking a clip now selects it again).
        let gesture: '' | 'time' | 'reorder' = '';
        const trackH = (clip.closest('.track') as HTMLElement)?.getBoundingClientRect().height || clip.getBoundingClientRect().height || 28;
        // move clamps consistently with trim's auto-extend model: allow dragging
        // right up to the composition length; derive() extends the scene on commit.
        // A no-duration (full-scene) layer never extends the scene, so clamp it within
        // the scene so timeline state == render window (B-fullscene).
        const isFullScene = (layer.duration == null && layer.type !== 'fx');
        // B-fx-window: fx is gated by its target's active window at runtime, so clamp
        // its start to the same winMax the props panel uses (editor.ts fx timing).
        let maxStart = isFullScene ? Math.max(0, scene.duration - 0.2) : (Math.max(scene.duration, S.total) || scene.duration);
        if (layer.type === 'fx') { const tgt = resolveFxTarget(scene, li); const winMax = (tgt?.layer.start ?? 0) + (tgt?.layer.duration ?? scene.duration); maxStart = Math.max(0, winMax - 0.1); }
        const sceneOff = S.offsets[si] ?? 0;
        const mv = (ev: MouseEvent) => {
          const dx = ev.clientX - sx, dy = ev.clientY - sy;
          if (!gesture && (Math.abs(dx) > 4 || Math.abs(dy) > 6)) gesture = (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 6) ? 'reorder' : 'time';
          if (gesture === 'time') {
            // B-snap: snap the clip's absolute START to nearby significant times
            // (playhead/scene seams/0/neighbour edges); Alt bypasses.
            const rawAbs = sceneOff + os + dx / S.pxPerSec;
            const snappedAbs = snapTime(rawAbs, sceneSnapTargets(si, scene, li), ev.altKey);
            cand = clampStart(snappedAbs - sceneOff, maxStart);
            clip.style.left = (LABELW + (sceneOff + cand) * S.pxPerSec) + 'px'; // visual only until commit
          } else if (gesture === 'reorder') {
            dyFinal = dy;
            clip.style.transform = `translateY(${dy}px)`; clip.style.zIndex = '60'; clip.style.opacity = '.85'; // drag feedback
          }
        };
        const up = () => {
          window.removeEventListener('mousemove', mv); window.removeEventListener('mouseup', up);
          if (gesture === 'time') {
            // B-commit-reclamp: re-clamp against freshly-derived bounds so a stale
            // gesture basis can never commit an out-of-range start.
            layer.start = clampStart(cand, maxStart); timingEdit();
          } else if (gesture === 'reorder') {
            // reorder by the number of track-rows dragged (drag up = Forward/front,
            // down = Backward/back). select() first so arrangeLayer targets this layer;
            // arrangeLayer keeps fx units + overlay banding correct and re-follows the
            // moved layer in S.selected. buildTimeline() (via structuralEdit) replaces
            // this element, clearing the inline drag feedback.
            select(si, li);
            const steps = Math.round(Math.abs(dyFinal) / trackH);
            const mode: 'up' | 'down' = dyFinal < 0 ? 'up' : 'down';
            for (let k = 0; k < steps; k++) arrangeLayer(mode);
          } else {
            // plain click: select the clip AND move the playhead to the click point
            // (cached mousedown rect so the seek lands under the cursor across relayout).
            select(si, li); seekTo(timeAtClientX(sx, rectLeft));
          }
        };
        window.addEventListener('mousemove', mv); window.addEventListener('mouseup', up);
      };
      // double-click also selects (kept for muscle memory; a plain click selects too now).
      clip.ondblclick = (e: MouseEvent) => { e.stopPropagation(); select(si, li); };
      handle.onmousedown = (e: MouseEvent) => {
        if (e.button !== 0) return; e.preventDefault(); e.stopPropagation(); const sx = e.clientX, od = layer.duration ?? scene.duration;
        const isFx = layer.type === 'fx';
        const isFullSceneTrim = (layer.duration == null && layer.type !== 'fx');
        // B-video-loadguard: when a video's source length isn't known yet (metadata
        // still loading right after mount), block the tail-trim like the audio lane
        // does, so the clip can never be trimmed past available footage during the
        // metadata-load window (avoids a frozen-last-frame tail).
        if (layer.type === 'video' && videoSrcDuration(layer) == null) { showToast('media still loading…'); return; }
        // B-trim-scenecap: by default cap the trim to the CURRENT scene boundary so a
        // single clip in an early scene can't silently lengthen its scene and push
        // every later scene/audio. Hold Shift while starting the drag to grow the
        // scene (the old generous cap). fx/full-scene layers keep their own caps.
        const sceneCap = Math.max(0.1, scene.duration - (layer.start ?? 0));
        const growCap = Math.max(scene.duration, S.total) || scene.duration;
        let maxDur = (isFx || isFullSceneTrim) ? growCap : (e.shiftKey ? growCap : sceneCap);
        // video layers: cap to the real source footage (length - trimStart) so the
        // clip can't be trimmed past the media (avoids a frozen-last-frame tail),
        // mirroring the audio tail-trim's file-length cap (B-video-cap).
        if (layer.type === 'video') { const vd = videoSrcDuration(layer); if (vd != null) maxDur = Math.min(maxDur, Math.max(0.1, vd - (layer.trimStart ?? 0))); }
        // B-fx-window: clamp an fx clip's length to the target window the runtime
        // honors (winMax - layer.start), matching the props panel's fx duration cap,
        // so the visible clip length == the window the renderer actually fires in.
        if (isFx) { const tgt = resolveFxTarget(scene, li); const winMax = (tgt?.layer.start ?? 0) + (tgt?.layer.duration ?? scene.duration); maxDur = Math.max(0.1, winMax - (layer.start ?? 0)); }
        const sceneOff = S.offsets[si] ?? 0; const clipStartAbs = sceneOff + (layer.start ?? 0);
        let moved = false; let pending = od;
        const mv = (ev: MouseEvent) => {
          if (Math.abs(ev.clientX - sx) > 3) moved = true;
          if (!moved) return; // B-trim-threshold: a bare click on the handle is a no-op
          const minDur = Math.max(0.1, 24 / S.pxPerSec);
          // B-snap: snap the clip's absolute END to nearby significant times; convert
          // back to a duration. Alt bypasses snapping.
          const rawEndAbs = clipStartAbs + od + (ev.clientX - sx) / S.pxPerSec;
          const snappedEndAbs = snapTime(rawEndAbs, sceneSnapTargets(si, scene, li), ev.altKey);
          pending = clampDuration(snappedEndAbs - clipStartAbs, minDur, maxDur);
          layer.duration = pending; clip.style.width = Math.max(24, layer.duration * S.pxPerSec) + 'px';
        };
        const up = () => {
          window.removeEventListener('mousemove', mv); window.removeEventListener('mouseup', up);
          // B-trim-threshold: only commit/push history if the pointer actually moved.
          if (!moved) return;
          // B-commit-reclamp: re-clamp the final duration against fresh bounds.
          layer.duration = clampDuration(pending, Math.max(0.1, 24 / S.pxPerSec), maxDur); timingEdit();
        };
        window.addEventListener('mousemove', mv); window.addEventListener('mouseup', up);
      };
      track.appendChild(clip); inner.appendChild(track);
    });
  });

  // ----- audio lane(s): show the composition's existing audio tracks -----
  const audio = S.ir.audio ?? [];
  if (audio.length) {
    const info = (typeof VGP.audioInfo === 'function' ? VGP.audioInfo() : []) as any[];
    const sr = el('div', 'scene-row'); const tag = el('div', 'scene-tag'); tag.innerHTML = tintIcon('audio', 'audio') + 'Audio'; sr.appendChild(tag); inner.appendChild(sr);
    audio.forEach((a: any, ai: number) => {
      const track = el('div', 'track');
      const name = String(a.src).split('/').pop() || 'audio';
      const label = el('div', 'track-label'); label.innerHTML = tintIcon('audio', 'audio') + `<span>${name.slice(0, 9)}</span>`; track.appendChild(label);
      const start = a.start ?? 0;
      const fileDur: number | null = info[ai]?.duration ?? null;          // null until metadata loads
      const metaReady = fileDur != null;
      // resolved baseline: prefer the real audio length; only fall back when meta unknown
      const dur = a.duration ?? fileDur ?? Math.max(2, S.total - start);
      // max trimmable/draggable length given trimStart and the underlying file
      const maxDur = metaReady ? Math.max(0.2, fileDur! - (a.trimStart ?? 0)) : Infinity;
      const clip = el('div', 'clip audio-clip');
      clip.style.left = (LABELW + start * S.pxPerSec) + 'px';
      // neutral 'loading' width until metadata resolves so the clip doesn't snap
      // (and an accidental trim during that window starts from a sane baseline)
      if (!metaReady && a.duration == null) { clip.style.width = '64px'; clip.style.opacity = '.5'; clip.style.backgroundImage = 'repeating-linear-gradient(45deg,rgba(255,255,255,.08) 0 6px,transparent 6px 12px)'; }
      // B-audio-widthcap: when metadata is known, cap the displayed width to the real
      // file length (maxDur) so a persisted a.duration longer than the actual file (e.g.
      // a swapped asset) never renders an over-long clip until the handle is grabbed.
      else clip.style.width = Math.max(24, Math.min(dur, metaReady ? maxDur : dur) * S.pxPerSec) + 'px';
      const vol = a.volume ?? 1;
      const volBadge = vol === 0 ? '🔇' : `${Math.round(vol * 100)}%`;
      clip.innerHTML = icon('audio') + `<span>${name}</span><span style="margin-left:auto;font-size:9px;opacity:${vol === 0 ? '.6' : '.85'}">${volBadge}</span>`;
      if (S.selAudio === ai) clip.classList.add('sel');
      // left-edge head-trim handle (adjusts trimStart + start + duration together)
      const lh = el('div', 'handle'); lh.style.cssText = 'right:auto;left:0'; clip.appendChild(lh);
      const handle = el('div', 'handle'); clip.appendChild(handle);
      const audioRectLeft0 = () => $('tlInner').getBoundingClientRect().left;
      clip.onmousedown = (e: MouseEvent) => {
        if (e.target === handle || e.target === lh || e.button !== 0) return; e.preventDefault();
        const rectLeft = audioRectLeft0();
        const sx = e.clientX, os = start; let moved = false; let cand = os;
        // B-audio-startmax: bound right using effectiveTotal() (matching the props
        // 'start (s)' field) so dragging and the numeric field agree and a track can
        // be dragged into the audio-tail region it can occupy via the panel.
        const maxStart = Math.max(0, effectiveTotal() - 0.1);
        const mv = (ev: MouseEvent) => {
          const dx = ev.clientX - sx; if (Math.abs(dx) > 3) moved = true;
          // B-snap + shared clamp policy (clampStart) so layer & audio lanes map a
          // given pixel drag to the same committed delta. Snap absolute start to the
          // same significant times; Alt bypasses.
          const snapped = snapTime(os + dx / S.pxPerSec, [0, S.playhead, ...S.offsets, S.total], ev.altKey);
          cand = clampStart(snapped, maxStart); clip.style.left = (LABELW + cand * S.pxPerSec) + 'px';
        };
        const up = () => {
          window.removeEventListener('mousemove', mv); window.removeEventListener('mouseup', up);
          // B-clip-click: plain click on an audio clip MOVES the playhead (parity with
          // the layer lane) and must NOT select; selection requires shift/meta-click.
          if (moved) { a.start = clampStart(cand, maxStart); liveSeek(); scheduleSave(); buildTimeline(); if (S.selAudio === ai) buildProps(); }
          else if (e.shiftKey || e.metaKey || e.ctrlKey) selectAudio(ai);
          else seekTo(timeAtClientX(sx, rectLeft));
        };
        window.addEventListener('mousemove', mv); window.addEventListener('mouseup', up);
      };
      // double-click selects the audio track (deliberate selection gesture).
      clip.ondblclick = (e: MouseEvent) => { e.stopPropagation(); selectAudio(ai); };
      // right-edge tail-trim — capture baseline from the resolved duration, cap to file
      handle.onmousedown = (e: MouseEvent) => {
        if (e.button !== 0) return; e.preventDefault(); e.stopPropagation();
        if (!metaReady && a.duration == null) { showToast('audio still loading…'); return; }
        // B-audio-widthcap: baseline from the capped duration when metadata is known,
        // so a stale a.duration longer than the file starts the drag at the real cap.
        const sx = e.clientX, od = metaReady ? Math.min(dur, maxDur) : dur;
        // liveSeek inside the move so the preview audio active/inactive state and
        // panel reflect the trim in real time (parity with live volume edit) (B-audio-live).
        let moved = false;
        const mv = (ev: MouseEvent) => {
          if (Math.abs(ev.clientX - sx) > 3) moved = true; if (!moved) return; // B-trim-threshold
          // B-snap: snap the absolute end of the audio clip to significant times.
          const startAbs = a.start ?? 0; const rawEnd = startAbs + od + (ev.clientX - sx) / S.pxPerSec;
          const snappedEnd = snapTime(rawEnd, [S.playhead, ...S.offsets, S.total], ev.altKey);
          a.duration = +Math.max(0.2, Math.min(maxDur, snappedEnd - startAbs)).toFixed(2); clip.style.width = Math.max(24, a.duration * S.pxPerSec) + 'px'; liveSeek();
        };
        const up = () => { window.removeEventListener('mousemove', mv); window.removeEventListener('mouseup', up); if (!moved) return; scheduleSave(); buildTimeline(); if (S.selAudio === ai) buildProps(); };
        window.addEventListener('mousemove', mv); window.addEventListener('mouseup', up);
      };
      // left-edge head-trim: increase trimStart + start, decrease duration (CapCut-style)
      lh.onmousedown = (e: MouseEvent) => {
        if (e.button !== 0) return; e.preventDefault(); e.stopPropagation();
        if (!metaReady && a.duration == null) { showToast('audio still loading…'); return; }
        const sx = e.clientX, os = start, ots = a.trimStart ?? 0, od = dur;
        const mv = (ev: MouseEvent) => {
          let dt = (ev.clientX - sx) / S.pxPerSec;
          // clamp so trimStart stays >=0 and duration stays >=0.2
          dt = Math.max(-ots, Math.min(od - 0.2, dt));
          if (os + dt < 0) dt = -os;
          a.trimStart = +Math.max(0, ots + dt).toFixed(3); a.start = +Math.max(0, os + dt).toFixed(3); a.duration = +Math.max(0.2, od - dt).toFixed(2);
          clip.style.left = (LABELW + a.start * S.pxPerSec) + 'px'; clip.style.width = Math.max(24, a.duration * S.pxPerSec) + 'px';
          liveSeek(); // preview the trimStart offset live while dragging (B-audio-live)
        };
        const up = () => { window.removeEventListener('mousemove', mv); window.removeEventListener('mouseup', up); liveSeek(); scheduleSave(); buildTimeline(); if (S.selAudio === ai) buildProps(); };
        window.addEventListener('mousemove', mv); window.addEventListener('mouseup', up);
      };
      track.appendChild(clip); inner.appendChild(track);
    });
  }

  const ph = el('div', 'playhead'); ph.id = 'playhead'; inner.appendChild(ph); positionPlayhead();

  // transition seams: a diamond at each scene boundary — drop a transition card here.
  // Reflect the EFFECTIVE transition the renderer plays: scene.transitionIn OR the
  // composition defaultTransition (runtime.ts:538).
  const defTrans = S.ir.defaultTransition;
  for (let i = 1; i < S.ir.scenes.length; i++) {
    const own = S.ir.scenes[i].transitionIn;
    // a transitionIn of {id:'none'} explicitly DISABLES the boundary (suppresses the
    // default). Treat it as 'cleared', not as a real applied transition (B-trans-none).
    const isCleared = !!own && own.id === 'none';
    const effInst = isCleared ? null : (own ?? defTrans); // what the renderer actually plays
    const has = !!effInst;
    const isDefault = !own && !!defTrans;
    const seam = el('div', 'seam' + (has ? '' : ' empty') + (isDefault ? ' is-default' : '') + (isCleared ? ' cleared' : ''));
    // offset below the ruler (26px) so the diamond reads as a scene-row boundary
    seam.style.left = (LABELW + S.offsets[i] * S.pxPerSec - 7) + 'px'; seam.style.top = '28px'; seam.style.height = '40px';
    // distinct 'disabled' affordance for the cleared state so it isn't read as a custom transition
    if (isCleared) seam.style.opacity = '.45';
    seam.title = isCleared ? 'transition disabled (click to restore default)' : own ? `transition: ${own.id} (click to remove)` : isDefault ? `default transition: ${defTrans.id} (click to override/clear on this boundary)` : 'drop a transition here (click to browse)';
    const dot = el('div', 'dot'); seam.appendChild(dot);
    // B-seam-default: index.html has no .seam.is-default rule, so an inherited default
    // boundary looks identical to an explicit per-scene transition. Inline a distinct
    // HOLLOW/outlined diamond for the default-inherited state so the two are visually
    // distinguishable (matches the title text the code already differentiates).
    if (isDefault && !isCleared) { dot.style.background = 'transparent'; dot.style.border = '1.5px solid var(--accent)'; dot.style.boxSizing = 'border-box'; }
    // don't let seam interaction leak to the background scrub handler
    seam.addEventListener('mousedown', (e) => e.stopPropagation());
    seam.addEventListener('dragover', (e: DragEvent) => { if (e.dataTransfer?.types.includes('application/x-vgp-transition')) { e.preventDefault(); seam.classList.add('droptgt'); } });
    seam.addEventListener('dragleave', () => seam.classList.remove('droptgt'));
    seam.addEventListener('drop', (e: DragEvent) => {
      e.preventDefault(); seam.classList.remove('droptgt'); const id = e.dataTransfer?.getData('application/x-vgp-transition');
      if (id) {
        // an effective transition (own non-'none' OR an active default) is being
        // overridden; otherwise it's a fresh add. Matches the seam's 'override'
        // wording so feedback is consistent with what the user saw (B-trans-toast).
        const wasOwn = !!own && own.id !== 'none';
        const hadEffective = wasOwn || (!own && !!defTrans);
        S.ir.scenes[i].transitionIn = { id };
        // B-trans-preview: seek INSIDE the transition window so the just-dropped
        // transition is immediately visible. The runtime plays it during the incoming
        // scene's local window [offsets[i], offsets[i]+tdur), with tdur clamped to the
        // previous scene's duration (runtime.ts:635). Land at the window midpoint.
        const tEntry: any = MAN.get(id); const defDur = tEntry?.defaultDuration ?? 0.6;
        const prevDur = S.ir.scenes[i - 1]?.duration ?? defDur;
        const tdur = Math.min(defDur, prevDur);
        S.playhead = S.offsets[i] + Math.min(tdur, defDur) / 2;
        structuralEdit();
        showToast((hadEffective ? 'Transition overridden: ' : 'Transition added: ') + id.split('.')[1]);
      }
    });
    seam.addEventListener('click', () => {
      if (isCleared) { delete S.ir.scenes[i].transitionIn; structuralEdit(); showToast('Default transition restored'); }
      else if (own) { delete S.ir.scenes[i].transitionIn; structuralEdit(); showToast('Transition removed'); }
      else if (isDefault) { S.ir.scenes[i].transitionIn = { id: 'none' }; structuralEdit(); showToast('Default transition disabled on this boundary'); }
      else { S.cat = 'transition'; setTab('anim'); showToast('Drop a transition here'); }
    });
    inner.appendChild(seam);
  }
}
function selectAudio(ai: number) { S.selAudio = ai; S.selected = null; setTab('props'); buildTimeline(); }
function positionPlayhead() { const ph = document.getElementById('playhead'); if (ph) { ph.style.left = (LABELW + S.playhead * S.pxPerSec) + 'px'; ph.style.height = $('tlInner').scrollHeight + 'px'; } updateSelBox(); const cs = document.getElementById('curScene'); if (cs && S.ir) cs.innerHTML = icon('layers') + `Scene ${sceneAt(S.playhead) + 1} / ${S.ir.scenes.length}`; }
// on-canvas selection box (lives in #scaler comp-space, survives stage re-mounts)
function updateSelBox() {
  const box = document.getElementById('selbox'); if (!box) return;
  const sel = S.selected; const layer = sel ? S.ir.scenes[sel.s]?.layers?.[sel.l] : null;
  if (!sel || !layer) { box.style.display = 'none'; return; }
  // B-selbox-adj: overlay (full-frame backdrop-filter) and fx (display:none control)
  // layers aren't canvas-positioned the way the box implies and the hit-test already
  // refuses to select them on canvas. Hide the resizable box for them so dragging
  // handles can't mutate a meaningless rect.
  if (layer.type === 'overlay' || layer.type === 'fx') { box.style.display = 'none'; return; }
  const off = S.offsets[sel.s] ?? 0; const st = off + (layer.start ?? 0); const dur = layer.duration ?? S.ir.scenes[sel.s].duration;
  if (S.playhead < st - 0.01 || S.playhead > st + dur + 0.01) { box.style.display = 'none'; return; }
  // B-fullframe-handles: a no-rect layer renders full-frame, so a 0,0,w,h box puts all
  // four corner handles exactly at the canvas corners (half off-screen / under the
  // stage chrome) — ungrabbable. INSET the displayed box by ~6% per side so handles
  // stay on-screen. This is display-only; the authored geometry (none) is unchanged
  // until the user actually drags (initSelHandles seeds the inset rect at that point).
  const r = layer.rect ?? { x: Math.round(S.ir.width * 0.06), y: Math.round(S.ir.height * 0.06), w: Math.round(S.ir.width * 0.88), h: Math.round(S.ir.height * 0.88) };
  // B13/B-selbox-presets: the runtime positions a layer centered on the rect center
  // (translate -50%,-50%) then applies the COMBINED delta (transform + keyframes +
  // every active preset/fx) about that center. Mirror that exact delta here so the
  // box matches the rendered element even when a preset (slide/scale/ken-burns/fade-
  // move) is translating/scaling/rotating it. Pure fn of seek time.
  const d = renderedDelta(layer, sel.s);
  const sc = d.scale;
  const cx = r.x + r.w / 2 + d.x;
  const cy = r.y + r.h / 2 + d.y;
  const w = r.w * sc, h = r.h * sc;
  box.style.display = 'block';
  box.style.left = (cx - w / 2) + 'px'; box.style.top = (cy - h / 2) + 'px';
  box.style.width = w + 'px'; box.style.height = h + 'px';
  const rot = d.rotate;
  box.style.transform = rot ? `rotate(${rot}deg)` : '';
  box.style.transformOrigin = 'center center';
  const inv = Math.min(2.4, 1 / (S.scale || 1));
  // B-resize-presetguard: grey the handles while a non-continuous transform preset is
  // mid-animation (resize is blocked then — see initSelHandles) so the affordance
  // matches the behaviour.
  const presetActive = activeTransformPreset(layer, sel.s);
  box.querySelectorAll('.sh').forEach((h) => { const he = h as HTMLElement; he.style.transform = `scale(${inv})`; he.style.opacity = presetActive ? '.3' : ''; he.style.cursor = presetActive ? 'not-allowed' : ''; });
}
function initSelHandles() {
  document.querySelectorAll('#selbox .sh').forEach((h) => {
    (h as HTMLElement).addEventListener('mousedown', (e: any) => {
      if (!S.selected) return; e.preventDefault(); e.stopPropagation();
      const layer = S.ir.scenes[S.selected.s].layers[S.selected.l];
      // B-resize-presetguard: block the resize while a non-continuous transform preset
      // is mid-animation at the playhead — the box is in animated space but the resize
      // writes the REST rect, so the committed geometry wouldn't match what's seen.
      // Guide the user to move the playhead past the entrance window first.
      if (activeTransformPreset(layer, S.selected.s)) { showToast('Move the playhead past the entrance animation to resize.'); return; }
      // B-fullframe-handles: seed the SAME inset rect updateSelBox() displays for a
      // no-rect (full-frame) layer, so the box the user grabs equals the box being
      // written (the old full-frame seed jumped the element on first drag).
      if (!layer.rect) layer.rect = { x: Math.round(S.ir.width * 0.06), y: Math.round(S.ir.height * 0.06), w: Math.round(S.ir.width * 0.88), h: Math.round(S.ir.height * 0.88) };
      const corner = h.getAttribute('data-h'); const sx = e.clientX, sy = e.clientY; const r0 = { ...layer.rect }; const sc = S.scale || 1;
      // Use the SAME combined delta the runtime/box use (transform + keyframes +
      // active presets), so the anchor pins to the actually-rendered scale/rotate/
      // position — not just transform.* (B-resize-anchor / B-resize-scale).
      const d0 = renderedDelta(layer, S.selected.s);
      const tfs = d0.scale || 1;   // rendered element scale at playhead
      const rot = d0.rotate * Math.PI / 180;
      // rendered center = rect center + rendered x/y offset (the runtime re-adds this
      // offset to the rect at paint, so we anchor against it then keep rect offset-free).
      const offX = d0.x, offY = d0.y;
      const cosr = Math.cos(rot), sinr = Math.sin(rot);
      // fixed (anchor) corner in rect-local space (opposite of the dragged one)
      const sgnX = corner!.includes('e') ? 1 : -1; const sgnY = corner!.includes('s') ? 1 : -1;
      const anchorLX = -sgnX * r0.w / 2, anchorLY = -sgnY * r0.h / 2; // local coords rel. to center, in rect units (pre-scale)
      // anchor's screen-space offset from the original RENDERED center: rotate(scale(local))
      const ax = anchorLX * tfs, ay = anchorLY * tfs;
      const anchorSX = ax * cosr - ay * sinr, anchorSY = ax * sinr + ay * cosr;
      const mv = (ev: MouseEvent) => {
        // screen delta -> comp px -> inverse-rotate into the layer's local axes -> /scale.
        // Dividing by tfs converts the on-screen drag into rect units so that the
        // runtime's rect*scale equals the dragged size (no double scale-count).
        let ldx = ((ev.clientX - sx) / sc), ldy = ((ev.clientY - sy) / sc);
        const localDX = (ldx * cosr + ldy * sinr) / tfs;   // inverse rotation
        const localDY = (-ldx * sinr + ldy * cosr) / tfs;
        let w = Math.max(20, r0.w + sgnX * localDX);
        let hh = Math.max(20, r0.h + sgnY * localDY);
        // B-resize-aspect: constrain proportionally following whichever axis the user
        // dragged MORE (by scale factor), so a vertical-dominant drag grows both w & h
        // (the old `hh = w*aspect` only ever drove height from width, so vertical drags
        // barely moved the box). Derive the other axis from the dominant one.
        if (ev.shiftKey) {
          const sW = w / (r0.w || 1), sH = hh / (r0.h || 1);
          const k = Math.abs(sW - 1) >= Math.abs(sH - 1) ? sW : sH; // dominant scale
          w = Math.max(20, r0.w * k); hh = Math.max(20, r0.h * k);
        }
        // keep the anchor (opposite) corner pinned under center+scale+rotate:
        // new center = anchorScreenPoint - rotate(scale(newAnchorLocal))
        const newAnchorLX = -sgnX * w / 2, newAnchorLY = -sgnY * hh / 2;
        const nax = newAnchorLX * tfs, nay = newAnchorLY * tfs;
        const naSX = nax * cosr - nay * sinr, naSY = nax * sinr + nay * cosr;
        // anchor in RENDERED space (rect center + x/y offset); subtract the offset
        // back out when writing rect.x/y so x/y keyframes stay untouched and the
        // runtime doesn't double-apply the offset.
        const c0x = r0.x + r0.w / 2 + offX, c0y = r0.y + r0.h / 2 + offY;
        const ncx = (c0x + anchorSX) - naSX, ncy = (c0y + anchorSY) - naSY;
        layer.rect = { x: Math.round(ncx - offX - w / 2), y: Math.round(ncy - offY - hh / 2), w: Math.round(w), h: Math.round(hh) };
        liveSeek(); updateSelBox();
      };
      const up = () => { window.removeEventListener('mousemove', mv); window.removeEventListener('mouseup', up); scheduleSave(); buildProps(); };
      window.addEventListener('mousemove', mv); window.addEventListener('mouseup', up);
    });
  });
}

// ---------- right panel ----------
function setTab(t: 'props' | 'anim') { S.panel = t; $('tabProps').classList.toggle('on', t === 'props'); $('tabAnim').classList.toggle('on', t === 'anim'); renderRight(); }
function renderRight() { S.panel === 'props' ? buildProps() : buildLibrary(); }
function select(s: number, l: number) { S.selected = { s, l }; S.selAudio = null; setTab('props'); buildTimeline(); }

function numField(label: string, value: number, min: number, max: number, step: number, onIn: (v: number) => void) {
  const f = el('div', 'field'); const lab = el('label'); lab.textContent = label; f.appendChild(lab);
  const row = el('div', 'row'); const r = el('input') as HTMLInputElement; r.type = 'range'; r.min = String(min); r.max = String(max); r.step = String(step); r.value = String(value);
  const v = el('span', 'val'); v.textContent = (+value).toFixed(2);
  r.oninput = () => { const nv = parseFloat(r.value); v.textContent = nv.toFixed(2); onIn(nv); };
  row.appendChild(r); row.appendChild(v); f.appendChild(row); return f;
}
// transform field with a keyframe diamond (keys position/opacity/scale/rotate at the playhead)
function kfField(label: string, prop: string, value: number, min: number, max: number, step: number, onIn: (v: number) => void) {
  const layer = S.selected ? S.ir.scenes[S.selected.s].layers[S.selected.l] : null;
  const keyed = !!layer && isKeyframed(layer, prop);
  // when keyframed, the runtime ignores transform.* — show the INTERPOLATED value
  // at the playhead, and route slider edits to the keyframe at the playhead.
  const shown = (keyed && layer) ? tfAt(layer, S.selected!.s, prop, value) : value;
  const f = numField(label, shown, min, max, step, (v) => {
    if (keyed && layer) setKeyframeAtPlayhead(prop, v); else onIn(v);
  });
  const lab = f.querySelector('label') as HTMLElement;
  const arr = layer?.keyframes?.[prop] ?? []; const n = arr.length;
  if (keyed) lab.title = 'keyframe-driven — editing sets the keyframe at the playhead';
  // controls: prev/next nav, add/toggle diamond, clear
  if (n > 0) {
    // B-kf-epsilon: use the SHARED kfEpsilon() (not a separate 1e-4) so nav, the
    // 'at-playhead' detection, the diamond toggle and the easing selector all agree
    // on which keyframe is current. Nav seeks exactly to the keyframe time.
    const eps = kfEpsilon();
    const prev = el('button', 'icon-btn'); prev.textContent = '‹'; prev.title = 'prev keyframe'; prev.style.cssText = 'float:right;padding:1px 6px;font-size:11px';
    prev.onclick = () => { const lt = playheadLocal(); const before = [...arr].reverse().find((k: any) => k.t < lt - eps); if (before && layer) seekTo(S.offsets[S.selected!.s] + (layer.start ?? 0) + before.t); };
    const next = el('button', 'icon-btn'); next.textContent = '›'; next.title = 'next keyframe'; next.style.cssText = 'float:right;padding:1px 6px;font-size:11px';
    next.onclick = () => { const lt = playheadLocal(); const after = arr.find((k: any) => k.t > lt + eps); if (after && layer) seekTo(S.offsets[S.selected!.s] + (layer.start ?? 0) + after.t); };
    const clr = el('button', 'icon-btn'); clr.textContent = '✕'; clr.title = 'clear all keyframes for this property'; clr.style.cssText = 'float:right;padding:1px 6px;font-size:10px';
    clr.onclick = () => clearKeyframes(prop);
    lab.appendChild(clr); lab.appendChild(next); lab.appendChild(prev);
  }
  const key = el('button', 'icon-btn'); key.innerHTML = n ? `◆ ${n}` : '◆'; key.title = 'toggle keyframe at playhead (alt-click clears all)';
  key.style.cssText = 'float:right;padding:1px 7px;font-size:10px' + (n ? ';color:var(--accent)' : '');
  key.onclick = (ev: MouseEvent) => { if (ev.altKey) clearKeyframes(prop); else addKeyframe(prop); };
  lab.appendChild(key);
  // per-keyframe easing selector for the keyframe at (or nearest before) the playhead
  if (n > 0) {
    const lt = playheadLocal(); const at = arr.find((k: any) => Math.abs(k.t - lt) < kfEpsilon());
    if (at) {
      const ef = el('div', 'field'); ef.style.cssText = 'margin-top:-2px';
      const sel = el('select') as HTMLSelectElement; sel.style.cssText = 'font-size:10px;padding:1px 3px';
      // B-ease-default: an unset easing renders LINEAR (core ease() + keyframeValueAt
      // fall back to linear). Show 'linear' as the default so the dropdown truthfully
      // reflects the current curve and re-confirming the shown value doesn't silently
      // change the motion.
      KF_EASINGS.forEach((nm) => { const op = el('option') as HTMLOptionElement; op.value = nm; op.textContent = nm; if ((at.easing ?? 'linear') === nm) op.selected = true; sel.appendChild(op); });
      sel.onchange = () => { at.easing = sel.value; liveEdit(); };
      // B-ease-direction: the easing stored on keyframe N governs the segment ARRIVING
      // into N (from N-1) — both runtime and keyframeValueAt use the END keyframe's
      // easing. The forward arrow was inverted; label it as the incoming segment.
      const elab = el('label'); elab.textContent = 'ease ← (into)'; elab.title = "easing of the segment arriving into this keyframe"; elab.style.cssText = 'font-size:9px;color:var(--dim)';
      const row = el('div', 'row'); row.appendChild(elab); row.appendChild(sel); ef.appendChild(row); f.appendChild(ef);
    }
  }
  return f;
}
const playheadLocal = () => { if (!S.selected) return 0; const { s, l } = S.selected; const layer = S.ir.scenes[s].layers[l]; return Math.max(0, S.playhead - (S.offsets[s] + (layer.start ?? 0))); };
// frame-aligned epsilon so add/toggle/split use consistent precision
const kfEpsilon = () => Math.max(0.02, 0.5 / (S.ir?.fps ?? 30));
function snapLocalT(layer: any): number {
  const { s } = S.selected!; const ld = layer.duration ?? S.ir.scenes[s].duration;
  let t = S.playhead - (S.offsets[s] + (layer.start ?? 0));
  return +Math.max(0, Math.min(ld, t)).toFixed(3); // clamp to clip window
}
// write/insert a keyframe value at the playhead (used by sliders/canvas/arrows)
function setKeyframeAtPlayhead(prop: string, value: number) {
  if (!S.selected) return; const { s, l } = S.selected; const layer = S.ir.scenes[s].layers[l];
  // B-kf-offclip-guard: same outside-clip guard as addKeyframe. snapLocalT CLAMPS to
  // [0, duration], so without this an edit while the playhead is off-clip would
  // silently create/overwrite the first/last keyframe. No-op + toast instead.
  const off = S.offsets[s] + (layer.start ?? 0); const ld = layer.duration ?? S.ir.scenes[s].duration;
  if (S.playhead < off - 1e-4 || S.playhead > off + ld + 1e-4) { showToast('Move the playhead over the clip to keyframe.'); return; }
  layer.keyframes = layer.keyframes || {}; const arr = layer.keyframes[prop] || (layer.keyframes[prop] = []);
  const localT = snapLocalT(layer);
  const ex = arr.find((k: any) => Math.abs(k.t - localT) < kfEpsilon());
  // B-ease-default: new keyframes default to 'linear' (the curve an unset easing
  // actually renders), so the editor selector and the runtime never disagree.
  if (ex) ex.value = value; else arr.push({ t: localT, value, easing: 'linear' });
  arr.sort((a: any, b: any) => a.t - b.t);
  liveEdit();
}
function addKeyframe(prop: string) {
  if (!S.selected) return; const { s, l } = S.selected; const layer = S.ir.scenes[s].layers[l];
  // warn when the playhead is outside the clip span — keyframe would be unreachable
  const off = S.offsets[s] + (layer.start ?? 0); const ld = layer.duration ?? S.ir.scenes[s].duration;
  if (S.playhead < off - 1e-4 || S.playhead > off + ld + 1e-4) { showToast('Move the playhead over the clip to keyframe.'); return; }
  const localT = snapLocalT(layer);
  const cur = keyed(prop) ? tfAt(layer, s, prop, defForProp(prop)) : ((layer.transform?.[prop]) ?? defForProp(prop));
  layer.keyframes = layer.keyframes || {}; const arr = layer.keyframes[prop] || (layer.keyframes[prop] = []);
  const exIx = arr.findIndex((k: any) => Math.abs(k.t - localT) < kfEpsilon());
  // toggle: clicking the diamond when a keyframe already exists at the playhead removes it
  if (exIx >= 0) { arr.splice(exIx, 1); if (!arr.length) delete layer.keyframes[prop]; }
  else arr.push({ t: localT, value: cur, easing: 'linear' }); // B-ease-default: linear == the unset-easing render
  if (arr.length) arr.sort((a: any, b: any) => a.t - b.t);
  liveEdit(); buildTimeline(); buildProps();
}
const defForProp = (prop: string) => (prop === 'scale' || prop === 'opacity') ? 1 : 0;
const keyed = (prop: string) => { if (!S.selected) return false; const layer = S.ir.scenes[S.selected.s].layers[S.selected.l]; return isKeyframed(layer, prop); };
function clearKeyframes(prop: string) { if (!S.selected) return; const layer = S.ir.scenes[S.selected.s].layers[S.selected.l]; if (layer.keyframes) { delete layer.keyframes[prop]; structuralEdit(); } }
function splitSelected() {
  if (!S.selected) { showToast('Please select a layer to split.'); return; }
  const { s, l } = S.selected; const scene = S.ir.scenes[s]; const layer = scene.layers[l];
  const ls = layer.start ?? 0, ld = layer.duration ?? scene.duration; const local = S.playhead - (S.offsets[s] + ls);
  if (local <= 0.05 || local >= ld - 0.05) { showToast('Move the playhead over the clip to split.'); return; }
  const second = JSON.parse(JSON.stringify(layer));
  delete second.zIndex; // drop stale z — normalizeZ below makes array order authoritative
  layer.duration = +local.toFixed(2); second.start = +(ls + local).toFixed(2); second.duration = +(ld - local).toFixed(2);
  // B07: keyframe times are layer-local, so the second half must shift by -local
  // (clamped ≥0). Also: the first half keeps its enter (in.*) but drops exit
  // (out.*) presets; the second half keeps its exit but drops enter presets so
  // the split reads naturally and exit presets aren't duplicated.
  if (second.keyframes) {
    for (const prop of Object.keys(second.keyframes)) {
      second.keyframes[prop] = second.keyframes[prop].map((k: any) => ({ ...k, t: +Math.max(0, k.t - local).toFixed(3) }));
    }
  }
  // B-split-kf: the FIRST half (the original `layer`) keeps all its keyframes,
  // including any with t > its new duration (local). Those are orphaned: they
  // render past the clip edge and the runtime clamps to the last value. Drop any
  // keyframe past the cut and insert a boundary keyframe holding the interpolated
  // value at the cut, so each property stays in [0, duration] and the held value
  // at the split point is preserved deterministically (pure fn of the cut time).
  if (layer.keyframes) {
    for (const prop of Object.keys(layer.keyframes)) {
      const arr = layer.keyframes[prop] as any[];
      const boundaryVal = keyframeValueAt(arr, local, arr[0]?.value ?? defForProp(prop));
      const kept = arr.filter((k: any) => k.t < local - 1e-4);
      const hadBeyond = kept.length !== arr.length;
      if (hadBeyond) {
        const lastEasing = kept[kept.length - 1]?.easing ?? 'linear'; // B-ease-default
        kept.push({ t: +local.toFixed(3), value: +boundaryVal.toFixed(4), easing: lastEasing });
      }
      kept.sort((a: any, b: any) => a.t - b.t);
      layer.keyframes[prop] = kept;
    }
  }
  const isExit = (id: string) => MAN.get(id)?.category === 'out' || id.startsWith('out.');
  const isEnter = (id: string) => !isExit(id) && (MAN.get(id)?.category === 'in' || id.startsWith('in.'));
  if (Array.isArray(layer.presets)) layer.presets = layer.presets.filter((pr: any) => !isExit(pr.id));
  if (Array.isArray(second.presets)) second.presets = second.presets.filter((pr: any) => !isEnter(pr.id));
  // B-split-fx: fx control-layers driving this target sit at indices ABOVE it and
  // resolve DOWN to the nearest content layer. Inserting `second` directly at l+1
  // would slot it between the target and its fx, so the fx would re-resolve onto
  // `second` (the SECOND half). Insert `second` AFTER any fx layers belonging to
  // the first half so those fx keep driving the first half (index l).
  let insertAt = l + 1;
  while (insertAt < scene.layers.length && scene.layers[insertAt].type === 'fx') insertAt++;
  scene.layers.splice(insertAt, 0, second); normalizeZ(s); structuralEdit();
}
function duplicateSelected() { if (!S.selected) return; const { s, l } = S.selected; const scene = S.ir.scenes[s]; const copy = JSON.parse(JSON.stringify(scene.layers[l])); delete copy.zIndex; copy.start = (copy.start ?? 0) + 0.2; scene.layers.splice(l + 1, 0, copy); normalizeZ(s); S.selected = { s, l: l + 1 }; structuralEdit(); }
// z-order: reorder the selected layer within its scene (array order == paint order; zIndex normalised to match)
function arrangeLayer(mode: 'top' | 'up' | 'down' | 'bottom') {
  if (!S.selected) { showToast('Select a layer to arrange.'); return; }
  const { s, l } = S.selected; const arr = S.ir.scenes[s].layers;
  const moved = arr[l];
  if (!moved) return;
  // B-overlay-arrange: an overlay's backdrop-filter affects everything painted below
  // it (z 9000+arrayIndex). With ONE overlay, order is fixed (nothing to reorder).
  // With TWO+ overlays the stacking order genuinely changes the output (a higher
  // overlay filters the OUTPUT of a lower one — runtime maps overlay -> backdrop-
  // filter), so the user must be able to reorder overlays WITHIN the overlay band.
  // Overlays always stay above all content; only their relative order changes.
  //
  // B-overlay-noside-effect: reorder ONLY within the relevant category and keep
  // every OTHER layer in its original array slot, so arranging content never moves
  // an overlay (and vice versa) and the flatten can't reorder an overlay relative to
  // a neighbouring fx as a side effect.
  const isOverlay = moved.type === 'overlay';
  // index slots in the original array that belong to each category
  const overlaySlots: number[] = []; const contentSlots: number[] = [];
  arr.forEach((L: any, i: number) => { (L.type === 'overlay' ? overlaySlots : contentSlots).push(i); });

  if (isOverlay) {
    if (overlaySlots.length < 2) { showToast('Only one overlay — nothing to reorder. Add another overlay to restack.'); return; }
    // ordered list of overlay layers (by current array order)
    const overlays = overlaySlots.map((i) => arr[i]);
    let oi = overlays.indexOf(moved); if (oi < 0) return;
    let ni = oi;
    if (mode === 'top') ni = overlays.length - 1; else if (mode === 'bottom') ni = 0; else if (mode === 'up') ni = Math.min(overlays.length - 1, oi + 1); else ni = Math.max(0, oi - 1);
    if (ni === oi) return;
    const [u] = overlays.splice(oi, 1); overlays.splice(ni, 0, u);
    // write the reordered overlays back into ONLY the overlay slots; content stays put
    overlaySlots.forEach((slot, k) => { arr[slot] = overlays[k]; });
  } else {
    // group content layers into units so an fx travels with EXACTLY the content layer
    // the runtime drives it onto (nearest non-fx, non-overlay below — runtime.ts:353).
    // Overlays are excluded entirely here so they're never moved as a side effect.
    const contentArr = contentSlots.map((i) => arr[i]);
    const units: any[][] = []; let curContent: any[] | null = null;
    contentArr.forEach((L: any) => {
      if (L.type === 'fx' && curContent) curContent.push(L);
      else { curContent = [L]; units.push(curContent); }
    });
    let ui = units.findIndex((u) => u.includes(moved)); if (ui < 0 || units.length < 2) return;
    let ni = ui;
    if (mode === 'top') ni = units.length - 1; else if (mode === 'bottom') ni = 0; else if (mode === 'up') ni = Math.min(units.length - 1, ui + 1); else ni = Math.max(0, ui - 1);
    if (ni === ui) return;
    const [u] = units.splice(ui, 1); units.splice(ni, 0, u);
    const flat = units.flat();
    // write the reordered content back into ONLY the content slots; overlays stay put
    contentSlots.forEach((slot, k) => { arr[slot] = flat[k]; });
  }
  normalizeZ(s); // single source of truth for z-order == paint order
  S.selected = { s, l: arr.indexOf(moved) };
  structuralEdit();
}
// project views: Compositions (scenes) / Assets / Code
let projTab = 'comp';
function openProj(tab: string) { projTab = tab; $('projModal').classList.add('show'); renderProj(); }
function closeProj() { $('projModal').classList.remove('show'); }
function renderProj() {
  document.querySelectorAll('.proj-tab').forEach((t) => t.classList.toggle('on', t.getAttribute('data-v') === projTab));
  const body = $('projBody'); body.innerHTML = '';
  if (projTab === 'comp') {
    const cur = sceneAt(S.playhead);
    S.ir.scenes.forEach((sc: any, i: number) => {
      const d = el('div', 'scene-item' + (i === cur ? ' cur' : ''));
      d.innerHTML = `<div class="num">${i + 1}</div><div class="meta"><b>${sc.id || ('Scene ' + (i + 1))}</b><span>${fmtClock(sc.duration)} · ${sc.layers.length} layers${i === cur ? ' · ▶ playing' : ''}</span></div>`;
      d.onclick = () => { seekTo(S.offsets[i] + 0.01); closeProj(); };
      body.appendChild(d);
    });
  } else if (projTab === 'assets') {
    const seen = new Map<string, string>();
    S.ir.scenes.forEach((sc: any) => sc.layers.forEach((l: any) => { if ((l.type === 'image' || l.type === 'video') && l.src && !seen.has(l.src)) seen.set(l.src, l.type); }));
    (S.ir.audio || []).forEach((a: any) => { if (a.src && !seen.has(a.src)) seen.set(a.src, 'audio'); });
    if (!seen.size) { body.innerHTML = '<div class="empty">No assets used in this project yet.</div>'; return; }
    const g = el('div', 'pa-grid');
    seen.forEach((type, src) => {
      const d = el('div', 'pa'); const u = assetUrl(src); const name = src.split('/').pop() || src;
      if (type === 'video') { const v = el('video') as HTMLVideoElement; v.src = u; v.muted = true; d.appendChild(v); }
      else if (type === 'image') { const im = el('img') as HTMLImageElement; im.src = u; d.appendChild(im); }
      else { d.style.cssText += 'display:flex;align-items:center;justify-content:center'; d.innerHTML = icon('audio'); }
      const b = el('div', 'badge'); b.textContent = type; d.appendChild(b);
      const lb = el('div', 'lbl'); lb.textContent = name; d.appendChild(lb); g.appendChild(d);
    });
    body.appendChild(g);
  } else {
    const pre = el('pre'); pre.textContent = JSON.stringify(S.ir, null, 2); body.appendChild(pre);
  }
}
function buildProps() {
  const p = $('rightBody'); p.innerHTML = '';
  if (S.selAudio != null) {
    const a = S.ir.audio?.[S.selAudio];
    if (!a) { S.selAudio = null; return buildProps(); }
    const head = el('div', 'sel-head');
    const pill = el('span', 'pill'); pill.innerHTML = icon('audio') + 'audio'; pill.style.background = '#2b2b2b'; head.appendChild(pill);
    const title = el('span'); title.textContent = String(a.src).split('/').pop() ?? 'audio'; title.style.cssText = 'flex:1;font-weight:600;overflow:hidden;text-overflow:ellipsis'; head.appendChild(title);
    // mute toggle + delete the selected audio track
    const mute = el('button', 'icon-btn'); mute.textContent = (a.volume ?? 1) === 0 ? '🔇' : '🔊'; mute.title = 'mute / unmute'; mute.onclick = () => { a.volume = (a.volume ?? 1) === 0 ? 1 : 0; liveEdit(); buildTimeline(); buildProps(); }; head.appendChild(mute);
    const ai = S.selAudio; const del = el('button', 'icon-btn'); del.innerHTML = icon('trash'); del.title = 'delete audio track'; del.onclick = () => { S.ir.audio.splice(ai, 1); S.selAudio = null; structuralEdit(); }; head.appendChild(del);
    p.appendChild(head);
    const h3 = el('h3'); h3.textContent = 'audio'; p.appendChild(h3);
    p.appendChild(numField('volume', a.volume ?? 1, 0, 1, 0.01, (v) => { a.volume = v; liveEdit(); buildTimeline(); }));
    // bound consistent with the lane drag (start up to S.total - 0.1) so both the
    // slider and the lane can reach the same tail positions (B-audio-startmax).
    p.appendChild(numField('start (s)', a.start ?? 0, 0, Math.max(1, S.total - 0.1, effectiveTotal() - 0.1), 0.05, (v) => { a.start = v; liveSeek(); buildTimeline(); scheduleSave(); }));
    const info = (typeof VGP.audioInfo === 'function' ? VGP.audioInfo() : [])[S.selAudio];
    const fileDur = info?.duration ?? null;
    const curDur = a.duration ?? fileDur ?? Math.max(1, S.total - (a.start ?? 0));
    // cap to the real audio length (file - trimStart) once metadata is known
    const maxDur = fileDur != null ? Math.max(0.2, fileDur - (a.trimStart ?? 0)) : Math.max(curDur, S.total);
    p.appendChild(numField('duration (s)', Math.min(curDur, maxDur), 0.2, maxDur, 0.05, (v) => { a.duration = v; buildTimeline(); scheduleSave(); }));
    return;
  }
  if (!S.selected) { p.innerHTML = '<div class="empty">Select a clip in the timeline to edit it.<br/><br/>Or open the <b>Animations</b> tab to browse presets.</div>'; return; }
  const { s, l } = S.selected; const scene = S.ir.scenes[s]; const layer = scene?.layers[l];
  if (!layer) { S.selected = null; return buildProps(); }
  const h = (t: string) => { const x = el('h3'); x.textContent = t; p.appendChild(x); };

  // fx control-layer: a tracked effect applied to the clip below it
  if (layer.type === 'fx') {
    const entry = MAN.get(layer.effect) as any;
    const head = el('div', 'sel-head');
    const pill = el('span', 'pill'); pill.innerHTML = icon('spark') + 'fx'; pill.style.background = 'var(--clip-fx)'; head.appendChild(pill);
    const title = el('span'); title.textContent = String(layer.effect).split('.')[1].replace(/-/g, ' '); title.style.cssText = 'flex:1;font-weight:600'; head.appendChild(title);
    const del = el('button', 'icon-btn'); del.innerHTML = icon('trash'); del.onclick = () => { scene.layers.splice(l, 1); normalizeZ(s); S.selected = null; structuralEdit(); }; head.appendChild(del); p.appendChild(head);
    // resolve the real target using the SAME rule as the runtime (overlay-skipping)
    const tgt = resolveFxTarget(scene, l);
    const note = el('div'); note.style.cssText = 'font-size:11px;color:var(--dim);margin-bottom:8px';
    note.innerHTML = tgt ? `driving: <b>${layerLabel(tgt.layer)}</b>` : '⚠ no target layer below this fx — it renders nothing';
    p.appendChild(note);
    layer.params = layer.params || {};
    if (entry) { h('effect settings'); for (const [pk, spec] of Object.entries<any>(entry.params)) { const min = spec.min ?? 0, max = spec.max ?? (spec.default * 2 || 1); p.appendChild(numField(pk, layer.params[pk] ?? spec.default, min, max, (max - min) / 100 || 0.01, (v) => { layer.params[pk] = v; liveEdit(); })); } }
    h('timing');
    // bound the fx window to the target/scene window (fx never auto-extends the
    // scene now, so both sliders measure against a stable length).
    const tgtStart = tgt?.layer.start ?? 0; const tgtDur = tgt?.layer.duration ?? scene.duration; const winMax = tgtStart + tgtDur;
    p.appendChild(numField('start (s)', layer.start ?? 0, 0, Math.max(0, winMax - 0.1), 0.05, (v) => { layer.start = v; timingEdit(); }));
    // B-fx-dur-cap: the fx window can't extend past where its target stops rendering.
    // Cap to (winMax - layer.start), IDENTICAL to the clip-trim handle, so the panel
    // and clip caps agree and a fx window can never run past the target's active span.
    const fxDurMax = Math.max(0.1, winMax - (layer.start ?? 0));
    p.appendChild(numField('duration (s)', Math.min(layer.duration ?? fxDurMax, fxDurMax), 0.1, fxDurMax, 0.05, (v) => { layer.duration = v; timingEdit(); }));
    return;
  }

  const head = el('div', 'sel-head');
  const pill = el('span', 'pill'); pill.innerHTML = icon(typeIco[layer.type] ?? 'shape') + layer.type; pill.style.background = clipColor[layer.type] ?? '#555'; head.appendChild(pill);
  const title = el('span'); title.textContent = layer.type === 'text' ? String(layer.text).slice(0, 16) : (layer.src ? String(layer.src).split('/').pop() : layer.type); title.style.cssText = 'flex:1;font-weight:600;overflow:hidden;text-overflow:ellipsis'; head.appendChild(title);
  const del = el('button', 'icon-btn'); del.innerHTML = icon('trash'); del.onclick = () => { scene.layers.splice(l, 1); normalizeZ(s); S.selected = null; structuralEdit(); }; head.appendChild(del); p.appendChild(head);

  // arrange / z-order. Overlays always paint above all content (backdrop-filter), but
  // when a scene has 2+ overlays their RELATIVE order is load-bearing (a higher
  // overlay filters the output of a lower one), so arrange is enabled for overlays
  // too — it restacks them WITHIN the overlay band (B-overlay-arrange).
  if (layer.type === 'overlay') {
    const overlayCount = scene.layers.filter((L: any) => L.type === 'overlay').length;
    const note = el('div'); note.style.cssText = 'font-size:11px;color:var(--dim);margin-bottom:8px';
    note.textContent = overlayCount > 1
      ? 'Overlays sit above all content; arrange restacks this overlay relative to other overlays.'
      : 'Overlays sit above all content. Add another overlay to restack them.';
    p.appendChild(note);
    if (overlayCount > 1) {
      const arrange = el('div', 'arrange');
      ([['arrTop', 'To front', 'top'], ['arrUp', 'Forward', 'up'], ['arrDown', 'Backward', 'down'], ['arrBot', 'To back', 'bottom']] as const).forEach(([ic, lbl, mode]) => {
        const bn = el('button'); bn.innerHTML = icon(ic) + `<span>${lbl}</span>`; bn.onclick = () => arrangeLayer(mode as any); arrange.appendChild(bn);
      });
      p.appendChild(arrange);
    }
  } else {
    const arrange = el('div', 'arrange');
    ([['arrTop', 'To front', 'top'], ['arrUp', 'Forward', 'up'], ['arrDown', 'Backward', 'down'], ['arrBot', 'To back', 'bottom']] as const).forEach(([ic, lbl, mode]) => {
      const bn = el('button'); bn.innerHTML = icon(ic) + `<span>${lbl}</span>`; bn.onclick = () => arrangeLayer(mode as any); arrange.appendChild(bn);
    });
    p.appendChild(arrange);
  }

  if (layer.type === 'text') {
    const f = el('div', 'field'); const lab = el('label'); lab.textContent = 'text'; f.appendChild(lab);
    const ta = el('textarea') as HTMLTextAreaElement; ta.value = layer.text; ta.oninput = () => { layer.text = ta.value; structuralEdit(); }; f.appendChild(ta); p.appendChild(f);
    layer.style = layer.style || {};
    p.appendChild(numField('font size', parseInt(layer.style.fontSize || '72'), 12, 240, 1, (v) => { layer.style.fontSize = Math.round(v) + 'px'; structuralEdit(); }));
    const cf = el('div', 'field'); const cl = el('label'); cl.textContent = 'color'; cf.appendChild(cl); const ci = el('input') as HTMLInputElement; ci.type = 'text'; ci.value = layer.style.color || '#ffffff'; ci.oninput = () => { layer.style.color = ci.value; structuralEdit(); }; cf.appendChild(ci); p.appendChild(cf);
  }
  if (layer.type === 'image' || layer.type === 'video') {
    const cf = el('div', 'field'); const cl = el('label'); cl.textContent = 'fit'; cf.appendChild(cl); const sel = el('select') as HTMLSelectElement; ['cover', 'contain'].forEach((o) => { const op = el('option') as HTMLOptionElement; op.value = o; op.textContent = o; if ((layer.fit ?? 'cover') === o) op.selected = true; sel.appendChild(op); }); sel.onchange = () => { layer.fit = sel.value; structuralEdit(); }; cf.appendChild(sel); p.appendChild(cf);
  }
  if (layer.type === 'shape') { const cf = el('div', 'field'); const cl = el('label'); cl.textContent = 'fill color'; cf.appendChild(cl); const ci = el('input') as HTMLInputElement; ci.type = 'text'; ci.value = layer.fill || '#ffffff'; ci.oninput = () => { layer.fill = ci.value; structuralEdit(); }; cf.appendChild(ci); p.appendChild(cf); }
  if (layer.type === 'overlay') {
    const cf = el('div', 'field'); const cl = el('label'); cl.textContent = 'effect'; cf.appendChild(cl); const ci = el('input') as HTMLInputElement; ci.type = 'text'; ci.value = String(layer.effect).replace(/-/g, ' '); ci.readOnly = true; cf.appendChild(ci); p.appendChild(cf);
    const spec = (MAN.get('overlay.' + layer.effect) as any)?.params?.amount; const min = spec?.min ?? 0, max = spec?.max ?? 1;
    layer.params = layer.params || {};
    p.appendChild(numField('amount', layer.params.amount ?? (spec?.default ?? 1), min, max, (max - min) / 100 || 0.01, (v) => { layer.params.amount = v; structuralEdit(); }));
  }

  layer.presets = layer.presets || [];
  h('applied animations');
  if (!layer.presets.length) { const e = el('div', 'empty'); e.style.cssText = 'padding:8px 0;font-size:11px'; e.textContent = 'none yet'; p.appendChild(e); }
  layer.presets.forEach((inst: any, idx: number) => {
    const entry = MAN.get(inst.id); const card = el('div', 'preset-card'); const hd = el('div', 'head'); const b = el('b'); b.textContent = inst.id; hd.appendChild(b);
    const rm = el('button', 'icon-btn'); rm.innerHTML = icon('trash'); rm.onclick = () => { layer.presets.splice(idx, 1); structuralEdit(); }; hd.appendChild(rm); card.appendChild(hd);
    if (entry) { inst.params = inst.params || {}; for (const [pk, spec] of Object.entries<any>(entry.params)) { const cur = inst.params[pk] ?? spec.default; const min = spec.min ?? 0, max = spec.max ?? (spec.default * 2 || 1); card.appendChild(numField(pk, cur, min, max, (max - min) / 100 || 0.01, (v) => { inst.params[pk] = v; liveEdit(); })); } }
    p.appendChild(card);
  });
  const browse = el('button', 'btn'); browse.style.cssText = 'width:100%;justify-content:center;margin-top:6px'; browse.innerHTML = icon('spark') + 'Browse animations'; browse.onclick = () => setTab('anim'); p.appendChild(browse);

  h('timing');
  p.appendChild(numField('start (s)', layer.start ?? 0, 0, scene.duration, 0.05, (v) => { layer.start = v; timingEdit(); }));
  // B08: allow lengthening past the scene — derive() auto-extends. Generous cap.
  p.appendChild(numField('duration (s)', layer.duration ?? scene.duration, 0.1, Math.max(scene.duration, S.total), 0.05, (v) => { layer.duration = v; timingEdit(); }));
  h('transform  ·  ◆ = keyframe at playhead');
  layer.transform = layer.transform || {}; const tf = layer.transform;
  p.appendChild(kfField('x', 'x', tf.x ?? 0, -800, 800, 1, (v) => { tf.x = v; liveEdit(); }));
  p.appendChild(kfField('y', 'y', tf.y ?? 0, -800, 800, 1, (v) => { tf.y = v; liveEdit(); }));
  p.appendChild(kfField('scale (zoom)', 'scale', tf.scale ?? 1, 0, 3, 0.01, (v) => { tf.scale = v; liveEdit(); }));
  p.appendChild(kfField('rotate', 'rotate', tf.rotate ?? 0, -180, 180, 1, (v) => { tf.rotate = v; liveEdit(); }));
  p.appendChild(kfField('opacity', 'opacity', tf.opacity ?? 1, 0, 1, 0.01, (v) => { tf.opacity = v; liveEdit(); }));
  const tip = el('div'); tip.style.cssText = 'font-size:10px;color:var(--dim);margin-top:6px;line-height:1.5';
  tip.innerHTML = 'drag on canvas to move · arrows nudge · <b>S</b> split · <b>⌘D</b> duplicate · <b>Del</b> remove';
  p.appendChild(tip);
}

function buildLibrary() {
  const p = $('rightBody'); p.innerHTML = '';
  const tabs = el('div', 'cat-tabs');
  CATS.forEach((c) => { const t = el('div', 'cat' + (S.cat === c.key ? ' on' : '')); t.textContent = c.label; t.onclick = () => { S.cat = c.key; buildLibrary(); }; tabs.appendChild(t); });
  p.appendChild(tabs);

  const sel = S.selected ? S.ir.scenes[S.selected.s].layers[S.selected.l] : null;
  const note = el('div'); note.style.cssText = 'font-size:11px;color:var(--dim);margin-bottom:10px';
  if (S.cat === 'transition') note.innerHTML = sel ? `applies to <b>Scene ${S.selected!.s + 1}</b>` : 'select a clip — transition applies to its scene';
  else note.innerHTML = sel ? `click to add to <b>${sel.type}</b> layer` : '⚠ select a clip first to apply';
  p.appendChild(note);

  const grid = el('div', 'anim-grid');
  MANIFEST.filter((e) => e.category === S.cat).forEach((e) => {
    const card = el('div', 'anim-card');
    const nm = el('div', 'nm'); nm.innerHTML = icon('spark') + e.id.split('.')[1].replace(/-/g, ' '); card.appendChild(nm);
    card.onclick = () => applyFromLibrary(e);
    card.draggable = true;
    card.ondragstart = (ev: any) => { const t = e.category === 'transition' ? 'application/x-vgp-transition' : e.category === 'overlay' ? 'application/x-vgp-overlay' : 'application/x-vgp-preset'; ev.dataTransfer.setData(t, e.id); };
    grid.appendChild(card);
  });
  p.appendChild(grid);
}
function applyFromLibrary(entry: any) {
  if (entry.category === 'transition') {
    const si = S.selected ? S.selected.s : sceneAt(S.playhead);
    // B-trans-scene0: transitionIn on scene 0 is a complete no-op at runtime
    // (transitions only play for i > 0) AND has no seam to clear it from. Never write
    // it — guide the user to pick a later scene instead.
    if (si < 1) { showToast('Transitions apply between scenes — select scene 2 or later.'); return; }
    S.ir.scenes[si].transitionIn = { id: entry.id };
    // B-trans-preview: land the playhead inside the transition window (parity with the
    // seam-drop path) so the applied transition is immediately visible.
    const tEntry: any = MAN.get(entry.id); const defDur = tEntry?.defaultDuration ?? 0.6;
    const prevDur = S.ir.scenes[si - 1]?.duration ?? defDur; const tdur = Math.min(defDur, prevDur);
    S.playhead = S.offsets[si] + tdur / 2;
    structuralEdit(); return;
  }
  if (entry.category === 'overlay') { addLayerAtPlayhead(overlayLayerFromId(entry.id)); showToast('Overlay layer added: ' + entry.id.split('.')[1].replace(/-/g, ' ')); return; }
  if (!S.selected) { showToast('Select a clip to apply the effect.'); return; }
  const { s, l } = S.selected; const scene = S.ir.scenes[s]; const target = scene.layers[l];
  // gate by applicability so we never create a live-looking fx the runtime no-ops
  if (!presetAppliesTo(entry.id, target.type)) { showToast(target.type === 'overlay' ? "effects can't target an overlay layer" : 'this effect only works on text layers'); return; }
  scene.layers.splice(l + 1, 0, newFxLayer(target, scene.duration, entry.id)); normalizeZ(s);
  S.selected = { s, l: l + 1 };
  S.playhead = (S.offsets[s] ?? 0) + (target.start ?? 0) + 0.05;
  setTab('props'); structuralEdit(); positionPlayhead();
  showToast('Added ' + entry.id.split('.')[1].replace(/-/g, ' '));
}

// ---------- playback ----------
function updateTime() { $('tpTime').textContent = fmtClockMs(S.playhead); $('tpTotal').textContent = ' / ' + fmtClockMs(effectiveTotal()); }
// single zoom mutator — clamps to the shared range, rebuilds, and (optionally)
// keeps the time under the cursor fixed on screen across the zoom step. anchorX is
// in client coords; the anchor offset is measured against the SCROLL VIEWPORT.
function setZoom(px: number, anchorClientX?: number, persist = true) {
  const tl = $('tlScroll'); const vrect = tl.getBoundingClientRect();
  // time under the cursor BEFORE zoom (content origin = viewportLeft - scrollLeft)
  const anchorView = anchorClientX != null ? anchorClientX - vrect.left : null;
  const curT = anchorView != null ? (anchorView + tl.scrollLeft - LABELW) / S.pxPerSec : 0;
  S.pxPerSec = Math.max(PX_MIN, Math.min(PX_MAX, px));
  buildTimeline();
  if (anchorView != null) tl.scrollLeft = LABELW + curT * S.pxPerSec - anchorView; // re-pin the same time under the cursor
  if (persist) { try { localStorage.setItem('vgp.pxPerSec', String(S.pxPerSec)); } catch {} }
}
function fitTimeline() { const w = $('tlScroll').clientWidth || 900; setZoom((w - LABELW - 40) / Math.max(1, effectiveTotal())); $('tlScroll').scrollLeft = 0; }
// B-zoom-anchor: the +/- toolbar buttons and meta-=/meta--/shift+F keyboard zoom
// must anchor like ctrl-wheel so the focused time stays put across the step. Use the
// viewport CENTER as the stable reference (clientX at the middle of the scroll
// viewport), so content no longer jumps sideways under the cursor on each step.
function zoomBy(f: number) { const tl = $('tlScroll'); const vr = tl.getBoundingClientRect(); setZoom(S.pxPerSec * f, vr.left + vr.width / 2); }
function seekTo(t: number) { S.playhead = Math.max(0, Math.min(effectiveTotal(), t)); liveSeek(); positionPlayhead(); updateTime(); }
function setPlayIcon() { $('tpPlay').innerHTML = icon(S.playing ? 'pause' : 'play'); }
function togglePlay() { S.playing = !S.playing; setPlayIcon(); last = performance.now(); VGP.seek(S.playhead, { playing: S.playing }); }
let last = performance.now();
function loop(now: number) {
  if (S.playing) { const tot = effectiveTotal(); S.playhead += (now - last) / 1000; if (S.playhead >= tot) { if (S.loop) S.playhead = 0; else { S.playhead = tot; togglePlay(); } } VGP.seek(S.playhead, { playing: true }); positionPlayhead(); updateTime(); }
  last = now; requestAnimationFrame(loop);
}
function autoFit() {
  // honour a persisted zoom if present, else fit to the viewport (shared clamp)
  let stored = NaN; try { stored = parseFloat(localStorage.getItem('vgp.pxPerSec') || ''); } catch {}
  const w = $('tlScroll').clientWidth || 900;
  const px = isFinite(stored) && stored > 0 ? stored : (w - LABELW - 40) / Math.max(1, effectiveTotal());
  S.pxPerSec = Math.max(PX_MIN, Math.min(PX_MAX, px));
}

// ---------- file menu ----------
function buildFileMenu() {
  const m = $('fileMenu'); m.innerHTML = '';
  const item = (ic: string, label: string, key: string, fn: () => void) => { const b = el('button', 'menu-item'); b.innerHTML = icon(ic) + `<span>${label}</span>` + (key ? `<span class="k">${key}</span>` : ''); b.onclick = () => { closeMenu(); fn(); }; m.appendChild(b); };
  // B20: explicit statements instead of the fragile `setDoc() || scheduleSave()`.
  item('file', 'New', '', () => { setDoc({ fps: 30, width: 1920, height: 1080, scenes: [{ id: 'scene-1', duration: 5, background: '#0a0a0a', layers: [] }] }); scheduleSave(); });
  item('folder', 'Open…', '', openProjects);
  m.appendChild(el('div', 'menu-sep'));
  item('save', 'Save project (.json)', '⌘S', saveJson);
  item('download', 'Export MP4', '', runExport);
}
let menuOpen = false;
function closeMenu() { menuOpen = false; $('fileMenu').classList.remove('open'); }
function saveJson() { const blob = new Blob([JSON.stringify(S.ir, null, 2)], { type: 'application/json' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'composition.json'; a.click(); }
async function openProjects() {
  const list = await (await fetch('/api/projects')).json();
  const pl = $('projList'); pl.innerHTML = '';
  list.forEach((pr: any) => { const d = el('div', 'proj' + (pr.active ? ' active' : '')); d.innerHTML = icon('file') + pr.name; d.onclick = async () => { const r = await (await fetch('/api/open', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ path: pr.path }) })).json(); if (r.ok) { S.assetBase = r.assetBase; setDoc(r.ir); $('openModal').classList.remove('show'); } }; pl.appendChild(d); });
  $('openModal').classList.add('show');
}

// ---------- export with progress ----------
function showRender(show: boolean) { $('renderBar').classList.toggle('show', show); }
async function runExport() {
  showRender(true); $('renderFill').style.width = '0%'; $('renderPct').textContent = '0%'; $('renderLabel').textContent = 'Starting render…';
  // B04: flush any pending debounced save so the render uses the latest edit,
  // not the stale on-disk file. Cancel the timer and write S.ir directly first.
  clearTimeout(saveTimer);
  const body = JSON.stringify(S.ir); S.lastSyncJson = body;
  try { await fetch('/api/composition', { method: 'POST', headers: { 'content-type': 'application/json' }, body }); } catch {}
  fetch('/api/render', { method: 'POST' }).catch(() => {});
}

// ---------- init ----------
async function init() {
  // static icons
  $('fileIcon').innerHTML = icon('file'); $('expIcon').innerHTML = icon('download'); // logo is the inline animated SVG
  $('i-text').innerHTML = icon('text'); $('i-shape').innerHTML = icon('shape'); $('i-3d').innerHTML = icon('cube'); $('i-up').innerHTML = icon('upload');
  $('i-props').innerHTML = icon('sliders'); $('i-anim').innerHTML = icon('spark'); $('i-line').innerHTML = icon('line');
  $('i-undo').innerHTML = icon('undo'); $('i-redo').innerHTML = icon('redo'); $('i-split').innerHTML = icon('split'); $('i-dup').innerHTML = icon('copy'); $('i-del').innerHTML = icon('trash'); $('i-fit').innerHTML = icon('fit');
  $('tpStart').innerHTML = icon('start'); $('tpBack').innerHTML = icon('back'); $('tpFwd').innerHTML = icon('fwd'); $('tpLoop').innerHTML = icon('loop'); setPlayIcon();
  buildFileMenu();

  const data = await (await fetch('/api/composition')).json();
  S.ir = data.ir; S.assetBase = data.assetBase; S.lastSyncJson = JSON.stringify(S.ir);
  S.history = [S.lastSyncJson]; S.histIndex = 0;
  captureSceneBase(); S.ir.scenes.forEach((_: any, i: number) => normalizeZ(i)); derive(); autoFit(); mountPreview(); await VGP.ready();
  buildTimeline(); renderRight(); updateTime(); await loadAssets();
  (window as any).__vgpAudioReady = () => buildTimeline(); // refresh audio-lane widths once durations load
  requestAnimationFrame((t) => { last = t; loop(t); });

  // transport
  $('tpPlay').onclick = togglePlay; $('tpStart').onclick = () => seekTo(0); $('tpBack').onclick = () => seekTo(S.playhead - 1); $('tpFwd').onclick = () => seekTo(S.playhead + 1);
  $('tpLoop').onclick = () => { S.loop = !S.loop; $('tpLoop').classList.toggle('on', S.loop); ($('tpLoop') as HTMLElement).style.opacity = S.loop ? '1' : '.5'; };

  // tabs
  $('tabProps').onclick = () => setTab('props'); $('tabAnim').onclick = () => setTab('anim');

  // standard toolbar: undo/redo + clip actions
  $('undoBtn').onclick = undo; $('redoBtn').onclick = redo;
  $('btnSplit').onclick = splitSelected; $('btnDup').onclick = duplicateSelected;
  $('btnFit').onclick = fitTimeline; $('btnZoomIn').onclick = () => zoomBy(1.3); $('btnZoomOut').onclick = () => zoomBy(1 / 1.3);
  // colourful type tints on the add-layer icons
  $('i-text').style.color = 'var(--t-text)'; $('i-shape').style.color = 'var(--t-shape)'; $('i-line').style.color = 'var(--t-video)'; $('i-3d').style.color = 'var(--t-three)';
  // fullscreen preview
  $('i-full').innerHTML = icon('full');
  $('btnFull').onclick = () => { const w = document.querySelector('.stagewrap') as any; if (!document.fullscreenElement) w.requestFullscreen?.(); else document.exitFullscreen?.(); };
  document.addEventListener('fullscreenchange', () => setTimeout(fit, 80));

  // top-right project views: Compositions / Assets / Code
  $('i-comp').innerHTML = icon('layers'); $('i-assets').innerHTML = icon('grid'); $('i-code').innerHTML = icon('code');
  $('viewComp').onclick = () => openProj('comp'); $('viewAssets').onclick = () => openProj('assets'); $('viewCode').onclick = () => openProj('code');
  $('projClose').onclick = closeProj;
  document.querySelectorAll('.proj-tab').forEach((t) => { (t as HTMLElement).onclick = () => { projTab = t.getAttribute('data-v') || 'comp'; renderProj(); }; });
  $('projModal').addEventListener('mousedown', (e) => { if (e.target === $('projModal')) closeProj(); });
  $('btnDel').onclick = () => { if (S.selected) { const { s, l } = S.selected; S.ir.scenes[s].layers.splice(l, 1); normalizeZ(s); S.selected = null; structuralEdit(); } };
  initSelHandles();

  // file menu toggle + outside click
  $('fileBtn').onclick = (e) => { e.stopPropagation(); menuOpen = !menuOpen; $('fileMenu').classList.toggle('open', menuOpen); };
  document.addEventListener('click', closeMenu);
  $('export').onclick = runExport;
  $('openClose').onclick = () => $('openModal').classList.remove('show');
  $('importBtn').onclick = () => { const inp = document.createElement('input'); inp.type = 'file'; inp.accept = '.json'; inp.onchange = () => { const f = inp.files?.[0]; if (!f) return; const rd = new FileReader(); rd.onload = () => { try { setDoc(JSON.parse(String(rd.result))); scheduleSave(); $('openModal').classList.remove('show'); } catch {} }; rd.readAsText(f); }; inp.click(); };

  // add-layer
  $('addText').onclick = () => addLayerAtPlayhead(newText()); $('addShape').onclick = () => addLayerAtPlayhead(newShape()); $('addLine').onclick = () => addLayerAtPlayhead(newLine()); $('add3D').onclick = () => addLayerAtPlayhead(new3D());

  // upload
  const fi = $('fileInput') as HTMLInputElement; $('drop').onclick = () => fi.click(); fi.onchange = () => fi.files && uploadFiles(fi.files);
  const drop = $('drop'); drop.ondragover = (e) => { e.preventDefault(); drop.classList.add('over'); }; drop.ondragleave = () => drop.classList.remove('over'); drop.ondrop = (e: DragEvent) => { e.preventDefault(); drop.classList.remove('over'); if (e.dataTransfer?.files.length) uploadFiles(e.dataTransfer.files); };

  // drag-drop onto timeline
  const tl = $('tlScroll');
  // click/drag anywhere on the timeline background (ruler, scene rows, empty track
  // space) to move the playhead — clips/handles/labels keep their own behavior
  tl.addEventListener('mousedown', (e: MouseEvent) => {
    if (e.button !== 0) return; // primary button only — no scrub on right/middle click
    const t = e.target as HTMLElement;
    // .scene-tag is the sticky label-column header (position:sticky;left:0) floating
    // over the timeline; like .track-label it must be inert, else clicking it lands
    // in the LABELW column and scrubs the playhead to 0 (B-scenetag).
    if (t.closest('.clip') || t.closest('.track-label') || t.closest('.scene-tag') || t.closest('.sh') || t.closest('.seam') || t.closest('.kf-marker')) return;
    e.preventDefault(); // suppress text/range selection during a drag-scrub
    // cache the rect once — it can't change mid-scrub (no buildTimeline runs)
    const rectLeft = $('tlInner').getBoundingClientRect().left;
    const seekFrom = (ev: MouseEvent) => seekTo(timeAtClientX(ev.clientX, rectLeft));
    seekFrom(e);
    const mv = (ev: MouseEvent) => seekFrom(ev);
    const up = () => { window.removeEventListener('mousemove', mv); window.removeEventListener('mouseup', up); };
    window.addEventListener('mousemove', mv); window.addEventListener('mouseup', up);
  });
  tl.addEventListener('dragover', (e) => { e.preventDefault(); tl.classList.add('over'); });
  tl.addEventListener('dragleave', () => tl.classList.remove('over'));
  tl.addEventListener('drop', async (e: DragEvent) => {
    e.preventDefault(); tl.classList.remove('over');
    const ov = e.dataTransfer?.getData('application/x-vgp-overlay'); if (ov) { dropLayerAt(e.clientX, overlayLayerFromId(ov)); showToast('Overlay layer added: ' + ov.split('.')[1].replace(/-/g, ' ')); return; }
    const d = e.dataTransfer?.getData('application/x-vgp-asset'); if (d) { const a = JSON.parse(d); if (a.type === 'audio') { addAudioTrack(a.src, e.clientX); return; } dropLayerAt(e.clientX, newAssetLayer(a)); return; }
    if (e.dataTransfer?.files.length) {
      const files = Array.from(e.dataTransfer.files);
      const audioFile = files.find((f) => f.type.startsWith('audio'));
      if (audioFile) { const up = await uploadOne(audioFile, 'audio'); if (up?.src) addAudioTrack(up.src, e.clientX); return; }
      const before = S.assets.length; await uploadFiles(files); if (S.assets.length > before) dropLayerAt(e.clientX, newAssetLayer(S.assets[0]));
    }
  });

  // wheel zoom (ctrl/cmd) — cursor-anchored via the shared setZoom() (correct at any scroll offset)
  tl.addEventListener('wheel', (e: WheelEvent) => {
    if (!(e.ctrlKey || e.metaKey)) return; e.preventDefault();
    setZoom(S.pxPerSec * (e.deltaY < 0 ? 1.12 : 0.89), e.clientX);
  }, { passive: false });

  // canvas editing: click the topmost layer under the cursor to select it, then drag to move
  const stage = $('stage');
  stage.style.cursor = 'move';
  stage.addEventListener('mousedown', (e: MouseEvent) => {
    if (e.button !== 0) return;
    const rect = stage.getBoundingClientRect(); const sc = S.scale || 1;
    const cx = (e.clientX - rect.left) / sc, cy = (e.clientY - rect.top) / sc; // composition coords
    const si = sceneAt(S.playhead); const scene = S.ir.scenes[si]; if (!scene) return; const localT = S.playhead - S.offsets[si];
    let hit = -1;
    for (let li = scene.layers.length - 1; li >= 0; li--) {
      const L = scene.layers[li]; const st = L.start ?? 0, du = L.duration ?? scene.duration;
      if (L.type === 'overlay' || L.type === 'fx') continue; // adjustment/control layers aren't canvas-draggable; select via timeline
      if (localT < st - 0.01 || localT > st + du + 0.01) continue;
      const r = L.rect ?? { x: 0, y: 0, w: S.ir.width, h: S.ir.height };
      // fold in the SAME combined delta (transform + keyframes + active presets/fx)
      // the runtime paints so the hit rectangle matches the visible element even
      // under an active translating/scaling/rotating preset (B-selbox-presets).
      const d = renderedDelta(L, si);
      const scl = d.scale;
      const ccx = r.x + r.w / 2 + d.x;
      const ccy = r.y + r.h / 2 + d.y;
      const rot = -(d.rotate) * Math.PI / 180; // inverse-rotate the cursor about the center
      const dxp = cx - ccx, dyp = cy - ccy;
      const lx = dxp * Math.cos(rot) - dyp * Math.sin(rot), ly = dxp * Math.sin(rot) + dyp * Math.cos(rot);
      const hw = r.w * scl / 2, hh = r.h * scl / 2;
      if (Math.abs(lx) <= hw && Math.abs(ly) <= hh) { hit = li; break; }
    }
    if (hit < 0) return;
    e.preventDefault();
    if (!S.selected || S.selected.s !== si || S.selected.l !== hit) select(si, hit);
    const layer = scene.layers[hit]; layer.transform = layer.transform || {};
    // when x/y are keyframed, write the keyframe at the playhead (the runtime
    // ignores transform.x/y once keyframed) so the drag is actually visible.
    const xKeyed = isKeyframed(layer, 'x'), yKeyed = isKeyframed(layer, 'y');
    const baseX = xKeyed ? tfAt(layer, si, 'x', 0) : (layer.transform.x ?? 0);
    const baseY = yKeyed ? tfAt(layer, si, 'y', 0) : (layer.transform.y ?? 0);
    const sx = e.clientX, sy = e.clientY; let moved = false;
    const mv = (ev: MouseEvent) => {
      if (Math.abs(ev.clientX - sx) + Math.abs(ev.clientY - sy) > 2) moved = true;
      const nx = Math.round(baseX + (ev.clientX - sx) / sc), ny = Math.round(baseY + (ev.clientY - sy) / sc);
      if (xKeyed) setKeyframeAtPlayhead('x', nx); else layer.transform.x = nx;
      if (yKeyed) setKeyframeAtPlayhead('y', ny); else layer.transform.y = ny;
      liveSeek(); updateSelBox();
    };
    const up = () => { window.removeEventListener('mousemove', mv); window.removeEventListener('mouseup', up); if (moved) { if (xKeyed || yKeyed) buildTimeline(); scheduleSave(); buildProps(); } };
    window.addEventListener('mousemove', mv); window.addEventListener('mouseup', up);
  });

  // keyboard: space play · arrows nudge · S split · ⌘D dup · ⌘S save · Del remove
  window.addEventListener('keydown', (e) => {
    const tag = (e.target as HTMLElement).tagName; if (tag === 'INPUT' || tag === 'TEXTAREA') return;
    const meta = e.metaKey || e.ctrlKey;
    if (e.code === 'Space') { e.preventDefault(); togglePlay(); return; }
    if (meta && e.key.toLowerCase() === 'z' && !e.shiftKey) { e.preventDefault(); undo(); return; }
    if (meta && (e.key.toLowerCase() === 'y' || (e.key.toLowerCase() === 'z' && e.shiftKey))) { e.preventDefault(); redo(); return; }
    if (meta && e.key.toLowerCase() === 's') { e.preventDefault(); saveJson(); return; }
    if (meta && e.key.toLowerCase() === 'd') { e.preventDefault(); duplicateSelected(); return; }
    if (meta && e.key.toLowerCase() === 'b') { e.preventDefault(); splitSelected(); return; }
    // zoom shortcuts — keyboard parity with the +/- / Fit buttons & wheel-zoom
    if (meta && (e.key === '=' || e.key === '+')) { e.preventDefault(); zoomBy(1.3); return; }
    if (meta && e.key === '-') { e.preventDefault(); zoomBy(1 / 1.3); return; }
    if (meta && e.key === '0') { e.preventDefault(); fitTimeline(); return; }
    if (!meta && e.shiftKey && (e.key === 'F' || e.key === 'f')) { e.preventDefault(); fitTimeline(); return; }
    if (!meta && (e.key === 's' || e.key === 'S')) { splitSelected(); return; }
    if ((e.key === 'Delete' || e.key === 'Backspace') && S.selAudio != null) { S.ir.audio.splice(S.selAudio, 1); S.selAudio = null; structuralEdit(); return; }
    if ((e.key === 'Delete' || e.key === 'Backspace') && S.selected) { const { s, l } = S.selected; S.ir.scenes[s].layers.splice(l, 1); normalizeZ(s); S.selected = null; structuralEdit(); return; }
    if (S.selected && e.key.startsWith('Arrow')) {
      e.preventDefault(); const { s, l } = S.selected; const layer = S.ir.scenes[s].layers[l]; layer.transform = layer.transform || {}; const step = e.shiftKey ? 1 : 10;
      const xKeyed = isKeyframed(layer, 'x'), yKeyed = isKeyframed(layer, 'y');
      const nx = (xKeyed ? tfAt(layer, s, 'x', 0) : (layer.transform.x ?? 0)) + (e.key === 'ArrowRight' ? step : e.key === 'ArrowLeft' ? -step : 0);
      const ny = (yKeyed ? tfAt(layer, s, 'y', 0) : (layer.transform.y ?? 0)) + (e.key === 'ArrowDown' ? step : e.key === 'ArrowUp' ? -step : 0);
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { if (xKeyed) setKeyframeAtPlayhead('x', nx); else layer.transform.x = nx; }
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') { if (yKeyed) setKeyframeAtPlayhead('y', ny); else layer.transform.y = ny; }
      liveSeek(); scheduleSave(); buildTimeline(); buildProps();
    }
  });
  // re-fit the preview AND the timeline on resize (debounced) so the ruler/clips
  // don't overflow/under-fill after a window resize.
  let resizeT: any; window.addEventListener('resize', () => { fit(); clearTimeout(resizeT); resizeT = setTimeout(() => buildTimeline(), 120); });

  // browsers block audio until a user gesture — kick playback on first interaction
  const kick = () => { if (S.playing) VGP.seek(S.playhead, { playing: true }); window.removeEventListener('pointerdown', kick); };
  window.addEventListener('pointerdown', kick);

  // live SSE: doc edits (agent) + render progress
  const es = new EventSource('/api/events');
  es.onmessage = (ev) => {
    let m: any; try { m = JSON.parse(ev.data); } catch { return; }
    if (m.t === 'doc') { const j = JSON.stringify(m.ir); if (j === S.lastSyncJson) return; clearTimeout(saveTimer); S.ir = m.ir; S.lastSyncJson = j; pushHistory(j); captureSceneBase(); S.ir.scenes.forEach((_: any, i: number) => normalizeZ(i)); derive(); mountPreview(); buildTimeline(); renderRight(); setDot('edited', 'agent edit ✦'); setTimeout(() => setDot('saved', 'synced'), 1400); }
    if (m.t === 'render') {
      showRender(true);
      if (m.state === 'rendering') { $('renderFill').style.width = m.pct + '%'; $('renderPct').textContent = m.pct + '%'; $('renderLabel').textContent = `Rendering frame ${m.done}/${m.total}`; }
      else if (m.state === 'done') { $('renderFill').style.width = '100%'; $('renderPct').textContent = '100%'; $('renderLabel').textContent = '✓ Export complete'; setTimeout(() => { showRender(false); if (m.url) window.open(m.url, '_blank'); }, 1000); }
      else if (m.state === 'error') { $('renderLabel').textContent = '✕ Render failed'; setTimeout(() => showRender(false), 3000); }
    }
  };
}
init();
