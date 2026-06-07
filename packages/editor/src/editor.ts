// VideoGenPro Studio — CapCut-style editor over the Scene IR.
// IR is the single source of truth, shared with the agent via the dev server.
import { buildManifest, getPreset, resolveParams, ease } from '../../core/src/index';
import lottie from 'lottie-web';

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
// B-fit-longcomp: PX_MIN was 6 px/s, which is far too high for a long composition —
// an 18-minute lesson needs ~1.2 px/s to fit the viewport, so Fit clamped to 6 and
// left ~75% of the timeline scrolled off-screen (Fit didn't fit). Lower the floor so
// Fit can actually show the whole comp (and the wheel can still reach that zoom).
const PX_MIN = 0.5, PX_MAX = 800;
const KF_EASINGS = ['linear', 'easeIn', 'easeOut', 'easeInOut', 'easeOutBack', 'easeOutExpo', 'easeOutCubic', 'easeInOutCubic'];

// ---------- icons (Lucide-style, inline SVG) ----------
const I: Record<string, string> = {
  play: '<polygon points="6 3 20 12 6 21 6 3"/>',
  eye: '<path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"/><circle cx="12" cy="12" r="3"/>',
  'eye-off': '<path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 7 11 7a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-7-11-7a18.45 18.45 0 0 1 5.06-5.94"/><line x1="1" y1="1" x2="23" y2="23"/>',
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
  speaker: '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>',
  mute: '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/>',
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
  // FEATURE 1: multi-selection set. `selected` stays the PRIMARY (drives the props
  // panel / selbox); `multi` holds every selected {scene,layer} when >1 are picked
  // (shift/meta-click or a group). Empty for a plain single selection.
  multi: { s: number; l: number }[];
  playhead: number; playing: boolean; loop: boolean; pxPerSec: number; scale: number;
  offsets: number[]; total: number; lastSyncJson: string;
  panel: 'props' | 'anim'; cat: string;
  history: string[]; histIndex: number;
  sceneBase: number[];
};
const S: State = {
  ir: null, assetBase: '/', assets: [], selected: null, selAudio: null, multi: [], playhead: 0, playing: false, loop: false,
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
// order and z-order never diverge. Overlays are normal z-stack participants now
// (no 9000+ band): an overlay's backdrop-filter affects only the layers painted
// below its z, so moving it up/down changes what it filters. New overlays are
// pushed to the end of the array, so they still default to the top of the stack.
function normalizeZ(sceneIdx: number) {
  const arr = S.ir.scenes[sceneIdx]?.layers; if (!arr) return;
  arr.forEach((L: any, i: number) => { L.zIndex = i; });
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
  // Use the available center-column space more fully: a tighter pad (less dead
  // margin) and a modest upscale cap so small comps grow to fill the stage instead
  // of sitting tiny. Fullscreen keeps the generous cap / zero pad. The scaling
  // mechanism is unchanged (transform:scale on #scaler), so the on-canvas selection-
  // box / hit-test math (which reads S.scale + the scaler transform) is unaffected —
  // only the magnitude of that single scale factor is allowed to grow.
  const cap = document.fullscreenElement ? 8 : 1.5; // allow scaling up in fullscreen / for small comps
  const pad = document.fullscreenElement ? 0 : 20;
  const s = Math.min((wrap.clientWidth - pad) / S.ir.width, (wrap.clientHeight - pad) / S.ir.height, cap);
  S.scale = s;
  const sc = $('scaler'); sc.style.width = S.ir.width + 'px'; sc.style.height = S.ir.height + 'px'; sc.style.transform = `scale(${s})`;
  // size the seekbar to the actual preview (stage) width = comp width * scale, centered.
  const sb = document.getElementById('seekbar'); if (sb) { sb.style.width = Math.round(S.ir.width * s) + 'px'; sb.style.margin = '0 auto'; }
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
// DISABLED UNDO/REDO: reflect history position on the native disabled property of the
// toolbar buttons. can-undo = histIndex > 0; can-redo = histIndex < length - 1. Called
// after every history mutation (pushHistory / undo / redo / setDoc / applyHistory) and
// from updateTime() so the buttons can never look enabled when there's nothing to do.
function refreshHistoryButtons() {
  const u = document.getElementById('undoBtn') as HTMLButtonElement | null;
  const r = document.getElementById('redoBtn') as HTMLButtonElement | null;
  if (u) u.disabled = !(S.histIndex > 0);
  if (r) r.disabled = !(S.histIndex < S.history.length - 1);
}
// undo/redo history — one entry per committed edit (debounced save)
function pushHistory(json: string) {
  if (json === S.history[S.histIndex]) return;
  S.history = S.history.slice(0, S.histIndex + 1);
  S.history.push(json);
  if (S.history.length > 120) S.history.shift();
  S.histIndex = S.history.length - 1;
  refreshHistoryButtons();
}
function applyHistory() {
  const json = S.history[S.histIndex]; if (!json) return;
  // B11: preserve selection across undo/redo when the indices are still valid.
  const prevSel = S.selected; const prevAudio = S.selAudio;
  S.ir = JSON.parse(json); S.lastSyncJson = json;
  S.selected = (prevSel && S.ir.scenes[prevSel.s]?.layers?.[prevSel.l]) ? prevSel : null;
  S.multi = []; // doc shape may have changed; drop the multi-set (primary is re-validated above)
  S.selAudio = (prevAudio != null && S.ir.audio?.[prevAudio]) ? prevAudio : null;
  derive(); mountPreview(); buildTimeline(); renderRight(); updateTime();
  fetch('/api/composition', { method: 'POST', headers: { 'content-type': 'application/json' }, body: json }).catch(() => {});
}
function undo() { if (S.histIndex > 0) { S.histIndex--; applyHistory(); setDot('saved', 'undo ↶'); } else setDot('saved', 'nothing to undo'); }
function redo() { if (S.histIndex < S.history.length - 1) { S.histIndex++; applyHistory(); setDot('saved', 'redo ↷'); } }
const liveEdit = () => { liveSeek(); updateSelBox(); scheduleSave(); }; // updateSelBox so the selection box tracks property-panel edits (rotate/scale/move/crop) too
const timingEdit = () => { liveSeek(); buildTimeline(); scheduleSave(); };
const structuralEdit = () => { mountPreview(); buildTimeline(); renderRight(); scheduleSave(); };
function setDoc(ir: any) { S.ir = ir; S.lastSyncJson = JSON.stringify(ir); S.selected = null; S.multi = []; S.history = [S.lastSyncJson]; S.histIndex = 0; captureSceneBase(); ir.scenes.forEach((_: any, i: number) => normalizeZ(i)); derive(); autoFit(); mountPreview(); buildTimeline(); renderRight(); updateTime(); }

// ---------- layer factories ----------
const newText = () => ({ type: 'text', text: 'New Text', style: { fontSize: '72px', color: '#ffffff' }, duration: 2, presets: [{ id: 'in.fade' }], transform: {} });
const newShape = () => ({ type: 'shape', shape: 'rect', fill: '#ffffff', rect: { x: 440, y: 290, w: 400, h: 140 }, duration: 2, presets: [{ id: 'in.scale' }], transform: {} });
const newLine = () => ({ type: 'shape', shape: 'line', fill: '#ffffff', rect: { x: 340, y: 360, w: 600, h: 6 }, duration: 2, presets: [{ id: 'in.slide-left', params: { distance: 120 } }], transform: {} });
const new3D = () => ({ type: 'three', scene: 'particles', props: { speed: 0.3 }, duration: 3, presets: [], transform: {} });
// overlay duration comes from the preset's authored defaultDuration (B-overlay-dur);
// zIndex is owned solely by normalizeZ (= array index) so we don't stamp a transient
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
function addLayerAtPlayhead(layer: any) { const si = sceneAt(S.playhead); const maxStart = Math.max(0, S.ir.scenes[si].duration - 0.2); layer.start = Math.max(0, Math.min(maxStart, +(S.playhead - S.offsets[si]).toFixed(2))); S.ir.scenes[si].layers.push(layer); normalizeZ(si); S.multi = []; S.selected = { s: si, l: S.ir.scenes[si].layers.length - 1 }; setTab('props'); structuralEdit(); }
function dropLayerAt(clientX: number, layer: any) { const t = Math.max(0, Math.min(S.total, timeAtClientX(clientX))); const si = sceneAt(t); const maxStart = Math.max(0, S.ir.scenes[si].duration - 0.2); layer.start = Math.max(0, Math.min(maxStart, +(t - S.offsets[si]).toFixed(2))); S.ir.scenes[si].layers.push(layer); normalizeZ(si); S.multi = []; S.selected = { s: si, l: S.ir.scenes[si].layers.length - 1 }; setTab('props'); structuralEdit(); }

// ── scene management (add / duplicate / delete) ─────────────────────────────
// Audio uses composition-global starts, so inserting/removing a scene must shift
// every audio track beginning at/after the change point to keep narration in sync.
function shiftAudioFrom(threshold: number, delta: number) {
  if (!S.ir.audio) return;
  for (const a of S.ir.audio) { const s = a.start ?? 0; if (s >= threshold - 1e-6) a.start = +Math.max(0, s + delta).toFixed(3); }
}
function jumpToScene(i: number) { S.playhead = +Math.min(Math.max(0, S.total - 0.01), (S.offsets[i] ?? 0) + 0.02).toFixed(3); positionPlayhead(); liveSeek(); updateTime(); }
// insert a blank scene at `at` (default: append). Shifts later audio so it stays in sync.
function addScene(at: number = S.ir.scenes.length) {
  at = Math.max(0, Math.min(S.ir.scenes.length, at));
  const sc: any = { duration: 4, background: S.ir.scenes[0]?.background ?? '#000000', layers: [] };
  shiftAudioFrom(S.offsets[at] ?? S.total, sc.duration);
  S.ir.scenes.splice(at, 0, sc); S.sceneBase.splice(at, 0, sc.duration);
  S.selected = null; S.multi = []; S.selAudio = null;
  derive(); jumpToScene(at); structuralEdit();
  showToast(`Scene ${at + 1} added`);
}
// duplicate scene `i` right after it (keeps src/text so its elements AUTO-MATCH for
// Match & Move). Shifts later audio by the clone's duration.
function duplicateScene(i: number) {
  if (i < 0 || i >= S.ir.scenes.length) return;
  const clone = JSON.parse(JSON.stringify(S.ir.scenes[i])); delete clone.id;
  (clone.layers || []).forEach((L: any) => delete L.groupId); // a clone is a fresh scene — don't share groups across scenes (would cross-select)
  const dur = S.ir.scenes[i].duration ?? clone.duration ?? 4;
  shiftAudioFrom((S.offsets[i] ?? 0) + dur, dur);
  S.ir.scenes.splice(i + 1, 0, clone); S.sceneBase.splice(i + 1, 0, S.sceneBase[i] ?? dur);
  S.selected = null; S.multi = []; S.selAudio = null;
  derive(); jumpToScene(i + 1); structuralEdit();
  showToast('Scene duplicated — move an element, then drop “match move” on the seam');
}
// delete scene `i` (min one scene). Drops audio inside the removed span, shifts later earlier.
function deleteScene(i: number) {
  if (S.ir.scenes.length <= 1) { showToast('Can’t delete the only scene'); return; }
  if (i < 0 || i >= S.ir.scenes.length) return;
  const off = S.offsets[i] ?? 0, dur = S.ir.scenes[i].duration ?? 0;
  if (S.ir.audio) S.ir.audio = S.ir.audio.filter((a: any) => { const s = a.start ?? 0; return !(s >= off - 1e-6 && s < off + dur - 1e-6); });
  shiftAudioFrom(off + dur, -dur);
  S.ir.scenes.splice(i, 1); S.sceneBase.splice(i, 1);
  S.selected = null; S.multi = []; S.selAudio = null;
  derive(); jumpToScene(Math.max(0, i - 1)); structuralEdit();
  showToast('Scene deleted');
}
// ── apply a transition by dropping its card on a CLIP (not just the tiny seam diamond).
// For match-move, auto-detect how many elements will morph across the seam.
function matchKeyOf(L: any): string | null {
  if (L.matchId) return 'id:' + L.matchId;
  if (L.type === 'image' || L.type === 'video') return 'src:' + L.src;
  if (L.type === 'text') return 'text:' + String(L.text ?? '').trim();
  if (L.type === 'shape') return 'shape:' + L.shape + ':' + (L.fill ?? '');
  return null;
}
function matchMoveCount(si: number): number {
  if (si <= 0) return 0;
  const prev = S.ir.scenes[si - 1].layers, cur = S.ir.scenes[si].layers; const used = new Set<number>(); let n = 0;
  for (const b of cur) { const k = matchKeyOf(b); if (!k) continue; const j = prev.findIndex((p: any, idx: number) => !used.has(idx) && matchKeyOf(p) === k); if (j >= 0) { used.add(j); n++; } }
  return n;
}
function applyTransitionToSceneSeam(si: number, id: string) {
  if (si <= 0) { showToast('Transitions play BETWEEN scenes — drop it on a clip in a later scene (or its seam).'); return; }
  S.ir.scenes[si].transitionIn = { id }; S.selected = null; S.multi = []; S.selAudio = null;
  S.playhead = +((S.offsets[si] ?? 0) + 0.05).toFixed(3);
  structuralEdit(); positionPlayhead(); updateTime();
  if (id === 'transition.match-move') {
    const n = matchMoveCount(si);
    showToast(n > 0 ? `Match & Move → Scene ${si + 1}: ${n} matching element${n > 1 ? 's' : ''} will morph` : `Match & Move → Scene ${si + 1}: no matching elements yet (put the same image/text in both scenes)`);
  } else showToast(`${id.split('.')[1].replace(/-/g, ' ')} → Scene ${si + 1}`);
}

// ---------- assets ----------
async function loadAssets() {
  // SKELETON: show the loading state on the asset grid while the (async) asset list is
  // fetched; renderAssets() clears it once the thumbnails are populated.
  $('assetGrid').classList.add('loading');
  try { S.assets = await (await fetch('/api/assets')).json(); } catch { S.assets = []; }
  renderAssets();
}
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
  S.selAudio = S.ir.audio.length - 1; S.selected = null; S.multi = []; setTab('props'); structuralEdit();
  showToast('Audio track added: ' + src.split('/').pop());
}
function renderAssets() {
  // SKELETON: mark the grid as loading while it's (re)populated, then clear at the end
  // once the thumbnail nodes are in the DOM (their src is set synchronously here).
  const g = $('assetGrid'); g.classList.add('loading'); g.innerHTML = '';
  if (!S.assets.length) {
    // EMPTY-STATE onboarding: a friendly hint pointing at the upload workflow rather
    // than a bare "No assets yet". Kept inside the .empty element for the shared styling.
    const e = el('div', 'empty'); e.style.cssText = 'font-size:11px;padding:14px;line-height:1.6';
    e.innerHTML = '<b>No assets yet</b><br/>Drag media onto the <b>upload box</b> above (or click it) to add images, video & audio. Then drag an asset onto the timeline.';
    g.appendChild(e); g.classList.remove('loading'); return;
  }
  S.assets.forEach((a) => {
    const d = el('div', 'asset'); d.draggable = true; const u = assetUrl(a.src);
    if (a.type === 'video') { const v = el('video') as HTMLVideoElement; v.preload = 'metadata'; v.muted = true; v.src = u; d.appendChild(v); } // preload=metadata: don't fully decode every video thumbnail
    else if (a.type === 'audio') { const ph = el('div'); ph.style.cssText = 'display:flex;align-items:center;justify-content:center;width:100%;height:100%;color:var(--t-audio)'; ph.innerHTML = icon('audio'); d.appendChild(ph); }
    else { const im = el('img') as HTMLImageElement; im.src = u; d.appendChild(im); }
    const b = el('div', 'badge'); b.textContent = a.type; d.appendChild(b);
    const nm = el('div', 'nm'); nm.textContent = a.name; d.appendChild(nm);
    d.ondragstart = (e) => e.dataTransfer!.setData('application/x-vgp-asset', JSON.stringify(a));
    g.appendChild(d);
  });
  g.classList.remove('loading'); // thumbnails populated — drop the skeleton
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
  const eps = minorStep * 1e-3;
  // audio-tail region (when audio runs past the last scene): a faint FLAT tint + a thin neutral
  // hairline at the scene end — subtle, not a loud diagonal hatch, so the ruler stays clean.
  if (eff > S.total + 1e-6) {
    const tailBand = el('div');
    tailBand.style.cssText = `position:absolute;top:0;bottom:0;left:${LABELW + S.total * S.pxPerSec}px;width:${(eff - S.total) * S.pxPerSec}px;background:rgba(128,128,128,.06);pointer-events:none`;
    ruler.appendChild(tailBand);
    const mark = el('div');
    mark.style.cssText = `position:absolute;top:0;bottom:0;left:${LABELW + S.total * S.pxPerSec}px;width:0;border-left:1px solid var(--border);pointer-events:none`;
    mark.title = `scenes end at ${fmtTick(S.total)} — audio continues beyond`;
    ruler.appendChild(mark);
  }
  // major (labelled) + minor (unlabelled) ticks in one pass, the full length of the timeline.
  let lastMajorEl: any = null, lastMajorPx = -1e9;
  for (let t = 0; t < eff - eps; t += minorStep) {
    const isMajor = Math.abs(t / tickStep - Math.round(t / tickStep)) < 1e-6;
    const px = LABELW + t * S.pxPerSec;
    const tk = el('div', isMajor ? 'tick' : 'tick minor');
    tk.style.left = px + 'px';
    if (isMajor) { tk.textContent = fmtTick(t); lastMajorEl = tk; lastMajorPx = px; }
    ruler.appendChild(tk);
  }
  // the very end: total duration, right-anchored so the scale reads correctly to the last frame
  // without the label clipping past the edge. Drop the last regular label if it would collide.
  const endPx = LABELW + eff * S.pxPerSec;
  if (lastMajorEl && endPx - lastMajorPx < 82) lastMajorEl.textContent = ''; // drop the adjacent grid label so the end time isn't crammed against it
  const endk = el('div', 'tick end'); endk.style.left = endPx + 'px'; endk.textContent = fmtTick(eff);
  ruler.appendChild(endk);
  inner.appendChild(ruler); // seeking handled by the unified timeline handler in init()

  S.ir.scenes.forEach((scene: any, si: number) => {
    const sr = el('div', 'scene-row');
    const tag = el('div', 'scene-tag');
    const lbl = el('span', 'scene-lbl'); lbl.innerHTML = icon('film' in I ? 'film' : 'video') + `Scene ${si + 1} · ${fmtClock(scene.duration)}`; tag.appendChild(lbl);
    // per-scene actions (hover): duplicate (the Match & Move workflow) + delete
    const acts = el('span', 'scene-acts');
    const sAct = (ic: string, title: string, fn: () => void) => { const bb = el('button', 'scene-act'); bb.innerHTML = icon(ic); bb.title = title; bb.setAttribute('aria-label', title); bb.onmousedown = (ev) => ev.stopPropagation(); bb.onclick = (ev) => { ev.stopPropagation(); fn(); }; return bb; };
    acts.append(sAct('copy', 'Duplicate scene (for Match & Move)', () => duplicateScene(si)), sAct('plus', 'Add scene after', () => addScene(si + 1)), sAct('trash', 'Delete scene', () => deleteScene(si)));
    tag.appendChild(acts); sr.appendChild(tag);
    inner.appendChild(sr);
    // display front-most layer on top: order rows by paint z (descending), which now
    // equals array index for EVERY layer (overlays included — no 9000+ band). li stays
    // the real array index; stable sort keeps array order among any equal z. Keeping the
    // row order == runtime paint order means moving an overlay up/down moves its row too.
    const effZ = (layer: any, i: number) => layer.zIndex ?? i;
    scene.layers.map((layer: any, li: number) => ({ layer, li, z: effZ(layer, li) }))
      .sort((a: any, b: any) => b.z - a.z)
      .forEach(({ layer, li }: any) => {
      const track = el('div', 'track');
      const fullLabel = layerLabel(layer);
      const label = el('div', 'track-label'); label.title = fullLabel; label.innerHTML = tintIcon(typeIco[layer.type] ?? 'shape', layer.type) + `<span>${fullLabel}</span>`;
      // visibility toggle — hides/shows the layer in the preview (and the render).
      const eye = el('button', 'tl-toggle' + (layer.hidden ? ' off' : '')); eye.innerHTML = icon(layer.hidden ? 'eye-off' : 'eye'); eye.title = layer.hidden ? 'Show layer' : 'Hide layer'; eye.setAttribute('aria-label', eye.title); eye.onmousedown = (ev) => ev.stopPropagation(); eye.onclick = (ev) => { ev.stopPropagation(); layer.hidden = !layer.hidden; structuralEdit(); };
      label.appendChild(eye); if (layer.hidden) track.style.opacity = '.5';
      // video layers carry their own audio — a speaker toggle plays/mutes it (preview + export).
      if (layer.type === 'video') { const on = (layer as any).muted === false; const mb = el('button', 'tl-toggle' + (on ? '' : ' off')); mb.innerHTML = icon(on ? 'speaker' : 'mute'); mb.title = on ? 'Mute video audio' : 'Enable video audio'; mb.setAttribute('aria-label', mb.title); mb.onmousedown = (ev) => ev.stopPropagation(); mb.onclick = (ev) => { ev.stopPropagation(); (layer as any).muted = on ? true : false; structuralEdit(); }; label.appendChild(mb); }
      track.appendChild(label);
      const offset = S.offsets[si] + (layer.start ?? 0); const dur = layer.duration ?? scene.duration;
      const clip = el('div', 'clip');
      clip.style.left = (LABELW + offset * S.pxPerSec) + 'px'; clip.style.width = Math.max(24, dur * S.pxPerSec) + 'px'; clip.style.background = clipColor[layer.type] ?? '#555';
      clip.title = fullLabel;
      clip.innerHTML = tintIcon(typeIco[layer.type] ?? 'shape', layer.type) + `<span>${fullLabel}</span>`;
      if (isSelected(si, li)) clip.classList.add('sel'); // FEATURE 1: highlight every selected clip (primary + multi)
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
      // left-edge head-trim handle (move the START edge; the END stays fixed)
      const lh = el('div', 'handle'); lh.style.cssText = 'right:auto;left:0'; clip.appendChild(lh);
      const handle = el('div', 'handle'); clip.appendChild(handle);
      // drop an effect/overlay preset card directly onto this clip's layer
      clip.addEventListener('dragover', (e: DragEvent) => {
        const ty = e.dataTransfer?.types ?? [];
        // accept presets, overlays AND transitions — a transition dropped on a clip
        // applies to that clip's scene seam (match-move auto-detects matching elements).
        if (ty.includes('application/x-vgp-preset') || ty.includes('application/x-vgp-overlay') || ty.includes('application/x-vgp-transition')) { e.preventDefault(); clip.classList.add('drop-over'); }
      });
      clip.addEventListener('dragleave', () => { clip.classList.remove('drop-over'); });
      clip.addEventListener('drop', (e: DragEvent) => {
        e.preventDefault(); clip.classList.remove('drop-over');
        const tr = e.dataTransfer?.getData('application/x-vgp-transition');
        if (tr) { applyTransitionToSceneSeam(si, tr); return; } // transition → this clip's scene seam (match-move auto-detects)
        const ov = e.dataTransfer?.getData('application/x-vgp-overlay');
        if (ov) { dropLayerAt(e.clientX, overlayLayerFromId(ov)); showToast('Overlay layer added: ' + ov.split('.')[1].replace(/-/g, ' ')); return; }
        const id = e.dataTransfer?.getData('application/x-vgp-preset');
        if (!id) return;
        if (!presetAppliesTo(id, layer.type)) { showToast(layer.type === 'overlay' ? "effects can't target an overlay layer" : 'this effect only works on text layers'); return; }
        scene.layers.splice(li + 1, 0, newFxLayer(layer, scene.duration, id)); normalizeZ(si);
        S.multi = []; S.selected = { s: si, l: li + 1 }; S.playhead = S.offsets[si] + (layer.start ?? 0) + 0.05; structuralEdit(); showToast('Added ' + id.split('.')[1].replace(/-/g, ' '));
      });
      clip.onmousedown = (e: MouseEvent) => {
        if (e.target === handle || e.target === lh || e.button !== 0) return; e.preventDefault();
        // FEATURE 1: capture the modifier at MOUSEDOWN — the up() closure may not get the
        // event, so additive (shift/meta/ctrl) selection is decided here.
        const additive = e.shiftKey || e.metaKey || e.ctrlKey;
        const rectLeft = $('tlInner').getBoundingClientRect().left; // cache before any rebuild (B-clip-click)
        const tl = $('tlScroll');
        const sx = e.clientX, sy = e.clientY, os = layer.start ?? 0, scrollStart = tl.scrollTop, scrollStartX = tl.scrollLeft;
        let cand = os; let dyFinal = 0; let lastY = sy; let lastX = sx; let lastAlt = false; let autoT: any = null;
        // reorder distance is measured in CONTENT space (pointerΔ + scrollΔ) so it keeps
        // growing while the timeline auto-scrolls under a pinned cursor.
        const refreshReorder = () => { dyFinal = (lastY - sy) + (tl.scrollTop - scrollStart); clip.style.transform = `translateY(${dyFinal}px)`; clip.style.zIndex = '60'; clip.style.opacity = '.85'; };
        // recompute the clip's TIME position from the pointer in CONTENT space
        // (pointerΔ + horizontal scrollΔ) so it keeps moving while the timeline auto-
        // scrolls horizontally under a pinned cursor. (uses sceneOff/allowCrossScene/
        // maxStart, declared below — only ever invoked from mv/autoTick, after init.)
        const refreshTime = () => {
          const effDx = (lastX - sx) + (tl.scrollLeft - scrollStartX);
          const snappedAbs = snapTime(sceneOff + os + effDx / S.pxPerSec, allowCrossScene ? [0, S.playhead, ...S.offsets, effectiveTotal()] : sceneSnapTargets(si, scene, li), lastAlt);
          if (allowCrossScene) { cand = clampStart(snappedAbs, Math.max(0, effectiveTotal() - 0.1)); clip.style.left = (LABELW + cand * S.pxPerSec) + 'px'; }
          else { cand = clampStart(snappedAbs - sceneOff, maxStart); clip.style.left = (LABELW + (sceneOff + cand) * S.pxPerSec) + 'px'; }
        };
        // while dragging near an edge, auto-scroll: VERTICAL for a reorder, HORIZONTAL
        // for a time-move; then recompute the respective drag position.
        const autoTick = () => {
          const r = tl.getBoundingClientRect(); const EDGE = 32;
          if (gesture === 'reorder') {
            const max = tl.scrollHeight - tl.clientHeight; let d = 0;
            if (lastY < r.top + EDGE) d = -Math.ceil((r.top + EDGE - lastY) / 4);
            else if (lastY > r.bottom - EDGE) d = Math.ceil((lastY - (r.bottom - EDGE)) / 4);
            const next = Math.max(0, Math.min(max, tl.scrollTop + d));
            if (d && next !== tl.scrollTop) { tl.scrollTop = next; refreshReorder(); }
          } else if (gesture === 'time') {
            const max = tl.scrollWidth - tl.clientWidth; let d = 0;
            if (lastX < r.left + LABELW + EDGE) d = -Math.ceil((r.left + LABELW + EDGE - lastX) / 3);
            else if (lastX > r.right - EDGE) d = Math.ceil((lastX - (r.right - EDGE)) / 3);
            const next = Math.max(0, Math.min(max, tl.scrollLeft + d));
            if (d && next !== tl.scrollLeft) { tl.scrollLeft = next; refreshTime(); }
          }
        };
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
        // every layer — content, overlays AND fx — can be dragged ANYWHERE on the
        // timeline (across scene seams); on drop it's reassigned to the scene at that
        // time. A moved fx re-resolves its target (nearest content below) in that scene.
        const allowCrossScene = true;
        const mv = (ev: MouseEvent) => {
          lastX = ev.clientX; lastY = ev.clientY; lastAlt = ev.altKey;
          const dx = ev.clientX - sx, dy = ev.clientY - sy;
          if (!gesture && (Math.abs(dx) > 4 || Math.abs(dy) > 6)) {
            gesture = (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 6) ? 'reorder' : 'time';
            if (!autoT) autoT = setInterval(autoTick, 16); // edge auto-scroll: vertical for reorder, horizontal for time
          }
          if (gesture === 'time') refreshTime();
          else if (gesture === 'reorder') refreshReorder();
        };
        const up = () => {
          window.removeEventListener('mousemove', mv); window.removeEventListener('mouseup', up); window.removeEventListener('blur', up);
          if (autoT) { clearInterval(autoT); autoT = null; }
          if (gesture === 'time') {
            if (allowCrossScene) {
              // cand is ABSOLUTE: drop the clip into whichever scene holds that time,
              // reassigning scene membership so it can live anywhere on the timeline.
              const targetS = sceneAt(cand);
              const localStart = +Math.max(0, cand - (S.offsets[targetS] ?? 0)).toFixed(3);
              if (targetS === si) { layer.start = localStart; timingEdit(); }
              else {
                const [movedLayer] = S.ir.scenes[si].layers.splice(li, 1);
                movedLayer.start = localStart;
                S.ir.scenes[targetS].layers.push(movedLayer);
                normalizeZ(si); normalizeZ(targetS);
                S.multi = []; S.selected = { s: targetS, l: S.ir.scenes[targetS].layers.length - 1 };
                structuralEdit(); showToast(`Moved to scene ${targetS + 1}`);
              }
            } else {
              layer.start = clampStart(cand, maxStart); timingEdit(); // fx stays scene-local
            }
          } else if (gesture === 'reorder') {
            // reorder by the number of track-rows dragged in CONTENT space (includes any
            // auto-scroll). select() first so arrangeLayer targets this layer; it keeps
            // fx grouped with their content and re-follows the moved layer in S.selected.
            // structuralEdit() rebuilds the timeline, clearing the inline drag feedback.
            select(si, li);
            const steps = Math.round(Math.abs(dyFinal) / trackH);
            const mode: 'up' | 'down' = dyFinal < 0 ? 'up' : 'down';
            for (let k = 0; k < steps; k++) arrangeLayer(mode);
          } else if (additive) {
            // FEATURE 1: shift/meta/ctrl click — add/toggle this clip in the multi-set
            // (don't move the playhead; this is a selection gesture, not a scrub).
            toggleSelect(si, li);
          } else {
            // plain click: select the clip AND move the playhead to the click point
            // (cached mousedown rect so the seek lands under the cursor across relayout).
            select(si, li); seekTo(timeAtClientX(sx, rectLeft));
          }
        };
        window.addEventListener('mousemove', mv); window.addEventListener('mouseup', up);
        window.addEventListener('blur', up, { once: true }); // safety: end the drag if mouseup lands off-window (also clears the auto-scroll timer)
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
      // left-edge head-trim: move the START edge, keep the END fixed (duration adjusts;
      // a video also skips into its footage via trimStart). Mirror of the right handle.
      lh.onmousedown = (e: MouseEvent) => {
        if (e.button !== 0) return; e.preventDefault(); e.stopPropagation();
        if (layer.type === 'video' && videoSrcDuration(layer) == null) { showToast('media still loading…'); return; }
        const sx = e.clientX, os = layer.start ?? 0, od = layer.duration ?? scene.duration, ots = layer.trimStart ?? 0;
        const sceneOff = S.offsets[si] ?? 0; const endLocal = os + od; const minDur = Math.max(0.1, 24 / S.pxPerSec);
        let moved = false; let pStart = os, pDur = od, pTrim = ots;
        const mv = (ev: MouseEvent) => {
          if (Math.abs(ev.clientX - sx) > 3) moved = true; if (!moved) return; // B-trim-threshold
          // snap the absolute START edge; keep the END fixed so duration = endLocal - start.
          const snappedStartAbs = snapTime(sceneOff + os + (ev.clientX - sx) / S.pxPerSec, sceneSnapTargets(si, scene, li), ev.altKey);
          const newStart = Math.max(0, Math.min(snappedStartAbs - sceneOff, endLocal - minDur));
          let dt = newStart - os;
          if (layer.type === 'video') dt = Math.max(dt, -ots); // can't un-trim past the footage head
          pStart = +(os + dt).toFixed(3); pDur = +(od - dt).toFixed(3);
          if (layer.type === 'video') pTrim = +Math.max(0, ots + dt).toFixed(3);
          layer.start = pStart; layer.duration = pDur; if (layer.type === 'video') layer.trimStart = pTrim;
          clip.style.left = (LABELW + (sceneOff + pStart) * S.pxPerSec) + 'px';
          clip.style.width = Math.max(24, pDur * S.pxPerSec) + 'px';
        };
        const up = () => { window.removeEventListener('mousemove', mv); window.removeEventListener('mouseup', up); if (moved) timingEdit(); };
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
      const label = el('div', 'track-label'); label.title = name; label.innerHTML = tintIcon('audio', 'audio') + `<span>${name}</span>`;
      // mute toggle — turns this audio track off/on (preview + export) without losing its volume.
      const mb = el('button', 'tl-toggle' + (a.muted ? ' off' : '')); mb.innerHTML = icon(a.muted ? 'mute' : 'speaker'); mb.title = a.muted ? 'Unmute audio' : 'Mute audio'; mb.setAttribute('aria-label', mb.title); mb.onmousedown = (ev) => ev.stopPropagation(); mb.onclick = (ev) => { ev.stopPropagation(); a.muted = !a.muted; structuralEdit(); };
      label.appendChild(mb); if (a.muted) track.style.opacity = '.55';
      track.appendChild(label);
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
      const volBadge = vol === 0 ? icon('mute') : `${Math.round(vol * 100)}%`;
      clip.title = name;
      clip.innerHTML = icon('audio') + `<span>${name}</span><span style="margin-left:auto;font-size:9px;display:inline-flex;align-items:center;opacity:${vol === 0 ? '.6' : '.85'}">${volBadge}</span>`;
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
function selectAudio(ai: number) { S.selAudio = ai; S.selected = null; S.multi = []; setTab('props'); buildTimeline(); }
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
  if (layer.type === 'overlay' || layer.type === 'fx' || (layer as any).hidden) { box.style.display = 'none'; return; }
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
  // CROP-aware selection: inset the box by the layer's crop so it wraps the VISIBLE (cropped)
  // image — not the full rect — and shrinks/grows live as the edge crop handles are dragged.
  const cp = (layer as any).crop || {};
  const cl = (cp.l || 0) / 100 * w, cr = (cp.r || 0) / 100 * w, ct = (cp.t || 0) / 100 * h, cb = (cp.b || 0) / 100 * h;
  const boxW = Math.max(2, w - cl - cr), boxH = Math.max(2, h - ct - cb);
  box.style.display = 'block';
  box.style.left = (cx - w / 2 + cl) + 'px'; box.style.top = (cy - h / 2 + ct) + 'px';
  box.style.width = boxW + 'px'; box.style.height = boxH + 'px';
  const rot = d.rotate;
  box.style.transform = rot ? `rotate(${rot}deg)` : '';
  // rotate about the LAYER centre (where the runtime rotates), expressed relative to the inset box
  box.style.transformOrigin = `${w / 2 - cl}px ${h / 2 - ct}px`;
  const inv = Math.min(2.4, 1 / (S.scale || 1));
  // FEATURE 2: corner handles now drive a uniform scale that COMPOSES with any active
  // preset (scale multiplies), so they're always live — no more grey/not-allowed
  // affordance while an entrance preset animates. Just keep the screen-constant size.
  box.querySelectorAll('.sh').forEach((h) => { const he = h as HTMLElement; he.style.transform = `scale(${inv})`; he.style.opacity = ''; he.style.cursor = ''; });
}
function initSelHandles() {
  document.querySelectorAll('#selbox .sh').forEach((h) => {
    (h as HTMLElement).addEventListener('mousedown', (e: any) => {
      if (!S.selected) return; e.preventDefault(); e.stopPropagation();
      const layer = S.ir.scenes[S.selected.s].layers[S.selected.l];
      const sceneIdx = S.selected.s;
      // CROP handle (the center dot): drag to crop an image/video via clip-path insets.
      // Horizontal drag crops left+right, vertical drag crops top+bottom (each side % of
      // the rect, clamped). Live + deterministic (runtime applies layer.crop at seek).
      // CROP — standard EDGE handles (crop-t/r/b/l): drag a side inward to crop that side.
      const cropEdge = h.getAttribute('data-h') || '';
      if (cropEdge.startsWith('crop-')) {
        if (layer.type !== 'image' && layer.type !== 'video') { showToast('Crop applies to images & videos.'); return; }
        if (!layer.rect) layer.rect = { x: Math.round(S.ir.width * 0.06), y: Math.round(S.ir.height * 0.06), w: Math.round(S.ir.width * 0.88), h: Math.round(S.ir.height * 0.88) };
        const r = layer.rect; const sc = S.scale || 1; const sx = e.clientX, sy = e.clientY; const side = cropEdge.slice(5);
        const st = { t: layer.crop?.t ?? 0, r: layer.crop?.r ?? 0, b: layer.crop?.b ?? 0, l: layer.crop?.l ?? 0 };
        const cl = (v: number) => Math.max(0, Math.min(95, +v.toFixed(2)));
        const mv = (ev: MouseEvent) => {
          const dxPct = ((ev.clientX - sx) / sc) / r.w * 100, dyPct = ((ev.clientY - sy) / sc) / r.h * 100;
          const c = { t: st.t, r: st.r, b: st.b, l: st.l };
          if (side === 't') c.t = cl(st.t + dyPct);        // drag the top edge DOWN → crop more off the top
          else if (side === 'b') c.b = cl(st.b - dyPct);   // drag the bottom edge UP → crop more off the bottom
          else if (side === 'l') c.l = cl(st.l + dxPct);   // drag the left edge RIGHT → crop more off the left
          else if (side === 'r') c.r = cl(st.r - dxPct);   // drag the right edge LEFT → crop more off the right
          layer.crop = c; liveSeek(); updateSelBox();
        };
        const up = () => { window.removeEventListener('mousemove', mv); window.removeEventListener('mouseup', up); scheduleSave(); buildProps(); };
        window.addEventListener('mousemove', mv); window.addEventListener('mouseup', up);
        return;
      }
      // ROTATION handle (the dot above the box): drag to rotate around the layer centre.
      // Works for every layer type (image/video/text/shape); Shift snaps to 15°.
      if (cropEdge === 'rotate') {
        if (!layer.rect) layer.rect = { x: Math.round(S.ir.width * 0.06), y: Math.round(S.ir.height * 0.06), w: Math.round(S.ir.width * 0.88), h: Math.round(S.ir.height * 0.88) };
        const r = layer.rect; const sc = S.scale || 1; const stageRect = $('stage').getBoundingClientRect();
        const d0 = renderedDelta(layer, sceneIdx);
        const cxScr = stageRect.left + (r.x + r.w / 2 + d0.x) * sc;
        const cyScr = stageRect.top + (r.y + r.h / 2 + d0.y) * sc;
        const rotKeyed = isKeyframed(layer, 'rotate');
        const baseRot = rotKeyed ? tfAt(layer, sceneIdx, 'rotate', 0) : (layer.transform?.rotate ?? 0);
        const startAng = Math.atan2(e.clientY - cyScr, e.clientX - cxScr) * 180 / Math.PI;
        const mv = (ev: MouseEvent) => {
          let rot = baseRot + (Math.atan2(ev.clientY - cyScr, ev.clientX - cxScr) * 180 / Math.PI - startAng);
          if (ev.shiftKey) rot = Math.round(rot / 15) * 15;             // Shift = snap to 15°
          rot = ((Math.round(rot * 10) / 10) % 360 + 540) % 360 - 180;  // wrap to (-180, 180]
          if (rotKeyed) setKeyframeAtPlayhead('rotate', rot);
          else layer.transform = { ...(layer.transform || {}), rotate: rot };
          liveSeek(); updateSelBox();
        };
        const up = () => { window.removeEventListener('mousemove', mv); window.removeEventListener('mouseup', up); if (rotKeyed) buildTimeline(); scheduleSave(); buildProps(); };
        window.addEventListener('mousemove', mv); window.addEventListener('mouseup', up);
        return;
      }
      // FEATURE 2: the 4 corner dots drive a real UNIFORM SCALE that writes
      // layer.transform.scale (the same property the props "scale (zoom)" slider edits),
      // anchored at the rendered layer CENTER. This works WHILE a preset is present —
      // scale MULTIPLIES the preset's scale in renderedDelta() (combine semantics), so
      // composing is correct; we no longer hard-block on an active entrance preset.
      // B-fullframe-handles: seed the SAME inset rect updateSelBox() displays for a
      // no-rect (full-frame) layer so the box the user grabs equals the box being
      // shown (keeps the selbox geometry consistent once they interact).
      if (!layer.rect) layer.rect = { x: Math.round(S.ir.width * 0.06), y: Math.round(S.ir.height * 0.06), w: Math.round(S.ir.width * 0.88), h: Math.round(S.ir.height * 0.88) };
      const r = layer.rect; const sc = S.scale || 1;
      // rendered center in COMP space (rect center + the combined delta x/y) — exactly
      // what updateSelBox() centers the box on, so the scale pivots about the visible
      // element center even under a translating/scaling preset.
      const d0 = renderedDelta(layer, sceneIdx);
      const cxComp = r.x + r.w / 2 + d0.x;
      const cyComp = r.y + r.h / 2 + d0.y;
      // convert that center to SCREEN coords (#scaler is transform:scale(sc) about its
      // top-left) so pointer distances and the center share one space; the ratio of
      // distances is then unit-independent (sc cancels), so uniform scale is robust.
      const stageRect = $('stage').getBoundingClientRect();
      const cxScr = stageRect.left + cxComp * sc;
      const cyScr = stageRect.top + cyComp * sc;
      // when scale is keyframed the runtime ignores transform.scale, so route the gesture
      // to the keyframe at the playhead (mirrors the x/y move handler). Base the gesture
      // on the interpolated value so it grows from what's actually on screen.
      const scaleKeyed = isKeyframed(layer, 'scale');
      const baseScale = scaleKeyed ? tfAt(layer, sceneIdx, 'scale', 1) : (layer.transform?.scale ?? 1);
      // pointer distance from center at gesture START — guard tiny/zero to avoid a
      // divide-by-zero blow-up (clamp to a few px minimum).
      const startDist = Math.max(8, Math.hypot(e.clientX - cxScr, e.clientY - cyScr));
      const mv = (ev: MouseEvent) => {
        const nowDist = Math.hypot(ev.clientX - cxScr, ev.clientY - cyScr);
        const newScale = +Math.max(0.05, baseScale * (nowDist / startDist)).toFixed(3);
        if (scaleKeyed) setKeyframeAtPlayhead('scale', newScale);
        else layer.transform = { ...(layer.transform || {}), scale: newScale };
        liveSeek(); updateSelBox();
      };
      // commit on mouseup and rebuild props (and timeline if keyframed, to refresh the
      // diamonds) so the scale slider/markers reflect the new value.
      const up = () => { window.removeEventListener('mousemove', mv); window.removeEventListener('mouseup', up); if (scaleKeyed) buildTimeline(); scheduleSave(); buildProps(); };
      window.addEventListener('mousemove', mv); window.addEventListener('mouseup', up);
    });
  });
}

// ---------- right panel ----------
function setTab(t: 'props' | 'anim') { S.panel = t; $('tabProps').classList.toggle('on', t === 'props'); $('tabAnim').classList.toggle('on', t === 'anim'); renderRight(); }
function renderRight() { S.panel === 'props' ? buildProps() : buildLibrary(); }
// FEATURE 1: a layer is "selected" if it's the primary OR a member of the multi-set.
function isSelected(s: number, l: number): boolean {
  return (!!S.selected && S.selected.s === s && S.selected.l === l) || S.multi.some((m) => m.s === s && m.l === l);
}
// the full selection as a list (primary folded into multi when present, deduped).
function selectionList(): { s: number; l: number }[] {
  if (S.multi.length) return S.multi.slice();
  return S.selected ? [{ s: S.selected.s, l: S.selected.l }] : [];
}
// ---- alignment / distribution ----
// Aligns the SELECTION to each other (>=2 layers) or to the canvas (single layer).
// Operates on each layer's RENDERED box (base rect + transform offset + scale) and
// writes the result back to rect.x/y, so the visual result matches what's on screen.
function alignableSelection(): any[] {
  return selectionList().map(({ s, l }) => S.ir.scenes[s]?.layers?.[l]).filter((L) => L && L.type !== 'overlay' && L.type !== 'fx');
}
function ensureLayerRect(L: any) {
  if (!L.rect) L.rect = { x: Math.round(S.ir.width * 0.06), y: Math.round(S.ir.height * 0.06), w: Math.round(S.ir.width * 0.88), h: Math.round(S.ir.height * 0.88) };
  return L.rect;
}
const effBox = (L: any) => { const r = ensureLayerRect(L); const sc = L.transform?.scale ?? 1; const cx = r.x + r.w / 2 + (L.transform?.x ?? 0); const cy = r.y + r.h / 2 + (L.transform?.y ?? 0); return { left: cx - r.w * sc / 2, top: cy - r.h * sc / 2, w: r.w * sc, h: r.h * sc, cx, cy }; };
const setBoxLeft = (L: any, left: number) => { const r = L.rect, sc = L.transform?.scale ?? 1; r.x = Math.round(left + r.w * sc / 2 - r.w / 2 - (L.transform?.x ?? 0)); };
const setBoxTop = (L: any, top: number) => { const r = L.rect, sc = L.transform?.scale ?? 1; r.y = Math.round(top + r.h * sc / 2 - r.h / 2 - (L.transform?.y ?? 0)); };
const setBoxCX = (L: any, cx: number) => { L.rect.x = Math.round(cx - L.rect.w / 2 - (L.transform?.x ?? 0)); };
const setBoxCY = (L: any, cy: number) => { L.rect.y = Math.round(cy - L.rect.h / 2 - (L.transform?.y ?? 0)); };
function alignSelected(mode: string) {
  const layers = alignableSelection(); if (!layers.length) { showToast('Select a layer to align.'); return; }
  const boxes = layers.map((L) => ({ L, b: effBox(L) }));
  let ref: { left: number; top: number; right: number; bottom: number; cx: number; cy: number };
  if (layers.length >= 2) {
    const left = Math.min(...boxes.map((x) => x.b.left)), top = Math.min(...boxes.map((x) => x.b.top));
    const right = Math.max(...boxes.map((x) => x.b.left + x.b.w)), bottom = Math.max(...boxes.map((x) => x.b.top + x.b.h));
    ref = { left, top, right, bottom, cx: (left + right) / 2, cy: (top + bottom) / 2 };
  } else ref = { left: 0, top: 0, right: S.ir.width, bottom: S.ir.height, cx: S.ir.width / 2, cy: S.ir.height / 2 };
  for (const { L, b } of boxes) {
    if (mode === 'left') setBoxLeft(L, ref.left);
    else if (mode === 'cx') setBoxCX(L, ref.cx);
    else if (mode === 'right') setBoxLeft(L, ref.right - b.w);
    else if (mode === 'top') setBoxTop(L, ref.top);
    else if (mode === 'cy') setBoxCY(L, ref.cy);
    else if (mode === 'bottom') setBoxTop(L, ref.bottom - b.h);
  }
  mountPreview(); updateSelBox(); scheduleSave(); // re-mount: rect is applied at build time, not seek (see align bug)
}
function distributeSelected(axis: 'h' | 'v') {
  const layers = alignableSelection(); if (layers.length < 3) { showToast('Select 3+ layers to distribute evenly.'); return; }
  const boxes = layers.map((L) => ({ L, b: effBox(L) })).sort((a, b) => (axis === 'h' ? a.b.cx - b.b.cx : a.b.cy - b.b.cy));
  const c0 = axis === 'h' ? boxes[0].b.cx : boxes[0].b.cy;
  const c1 = axis === 'h' ? boxes[boxes.length - 1].b.cx : boxes[boxes.length - 1].b.cy;
  const step = (c1 - c0) / (boxes.length - 1);
  boxes.forEach(({ L }, i) => { const c = c0 + step * i; axis === 'h' ? setBoxCX(L, c) : setBoxCY(L, c); });
  mountPreview(); updateSelBox(); scheduleSave(); // re-mount: rect is applied at build time, not seek (see align bug)
}
// FEATURE 3: monotonic group id from the existing ids (max gN + 1). Deterministic —
// no Math.random / Date.now — so the IR stays render-stable across saves.
function nextGroupId(): string {
  let max = 0;
  for (const sc of S.ir.scenes) for (const L of sc.layers) {
    const g = L.groupId; if (typeof g === 'string') { const n = parseInt(g.replace(/^g/, ''), 10); if (Number.isFinite(n) && n > max) max = n; }
  }
  return 'g' + (max + 1);
}
// FEATURE 3: collect every {s,l} sharing a groupId across all scenes.
function groupMembers(groupId: string): { s: number; l: number }[] {
  const out: { s: number; l: number }[] = [];
  S.ir.scenes.forEach((sc: any, s: number) => sc.layers.forEach((L: any, l: number) => { if (L.groupId === groupId) out.push({ s, l }); }));
  return out;
}
// FEATURE 1/3: standard single select. Clears the multi-set UNLESS the clicked layer
// carries a groupId — then the whole group is selected into multi (group-aware select).
function select(s: number, l: number) {
  S.selAudio = null; S.selected = { s, l };
  const layer = S.ir.scenes[s]?.layers?.[l];
  const gid = layer?.groupId;
  if (gid) { const mem = groupMembers(gid); S.multi = mem.length > 1 ? mem : []; }
  else S.multi = [];
  setTab('props'); buildTimeline(); updateSelBox();
}
// FEATURE 1: shift/meta-click — ADD/toggle {s,l} in the multi-set. Seeds the set with
// the prior primary so the first additive click yields a 2-item selection. Primary
// becomes the last-clicked layer (drives props/selbox).
function toggleSelect(s: number, l: number) {
  S.selAudio = null;
  if (!S.multi.length && S.selected) S.multi = [{ s: S.selected.s, l: S.selected.l }];
  const ix = S.multi.findIndex((m) => m.s === s && m.l === l);
  if (ix >= 0) {
    S.multi.splice(ix, 1);
    // primary follows the last remaining member; if none remain keep the toggled-off
    // layer selected so the panel/selbox always show something.
    S.selected = S.multi.length ? { ...S.multi[S.multi.length - 1] } : { s, l };
  } else {
    S.multi.push({ s, l }); S.selected = { s, l };
  }
  if (S.multi.length <= 1) S.multi = []; // a 0/1-item multi is just a single selection
  setTab('props'); buildTimeline(); updateSelBox();
}
// FEATURE 1/3: multi-aware delete. With >1 selected, remove EVERY selected layer:
// group by scene, splice in DESCENDING layer index per scene (indices stay valid),
// normalizeZ each touched scene, clear selection, commit. Otherwise single-delete.
function deleteSelection() {
  const list = selectionList();
  if (list.length > 1) {
    const byScene = new Map<number, number[]>();
    for (const { s, l } of list) { if (!byScene.has(s)) byScene.set(s, []); byScene.get(s)!.push(l); }
    for (const [s, ls] of byScene) {
      ls.sort((a, b) => b - a); // descending so earlier splices don't shift later indices
      for (const l of ls) S.ir.scenes[s]?.layers?.splice(l, 1);
      normalizeZ(s);
    }
    S.multi = []; S.selected = null; structuralEdit();
    return;
  }
  if (S.selected) { const { s, l } = S.selected; S.ir.scenes[s].layers.splice(l, 1); normalizeZ(s); S.multi = []; S.selected = null; structuralEdit(); }
}
// FEATURE 3: stamp a shared groupId on every currently-selected layer so they select
// as a unit afterwards (select() is group-aware). Reuses an existing shared id if the
// whole selection already carries one; otherwise mints a fresh monotonic id.
function groupSelection() {
  const list = selectionList();
  if (list.length < 2) { showToast('Select at least two layers to group.'); return; }
  // if every selected layer already shares one groupId, keep it (idempotent regroup)
  const existing = new Set(list.map(({ s, l }) => S.ir.scenes[s]?.layers?.[l]?.groupId));
  const gid = (existing.size === 1 && [...existing][0]) ? String([...existing][0]) : nextGroupId();
  for (const { s, l } of list) { const L = S.ir.scenes[s]?.layers?.[l]; if (L) L.groupId = gid; }
  // re-seed multi from the full group so the selection is the whole unit, then commit.
  S.multi = groupMembers(gid);
  structuralEdit();
  showToast(`Grouped ${list.length} layers`);
}

// FEATURE 3: floating right-click menu in the preview. Created lazily, reused, and
// dismissed on outside-click / Esc / after an action. Styled inline to match the
// monochrome dark-glass theme.
let ctxMenuEl: HTMLDivElement | null = null;
function hideContextMenu() {
  if (ctxMenuEl) ctxMenuEl.style.display = 'none';
  window.removeEventListener('mousedown', onCtxOutside, true);
  window.removeEventListener('keydown', onCtxKey, true);
  window.removeEventListener('blur', hideContextMenu);
}
function onCtxOutside(ev: MouseEvent) { if (ctxMenuEl && !ctxMenuEl.contains(ev.target as Node)) hideContextMenu(); }
function onCtxKey(ev: KeyboardEvent) { if (ev.key === 'Escape') { ev.stopPropagation(); hideContextMenu(); } }
function showContextMenu(clientX: number, clientY: number) {
  if (!ctxMenuEl) {
    const m = el('div') as HTMLDivElement;
    m.setAttribute('role', 'menu'); m.setAttribute('aria-label', 'Layer actions'); // ARIA: it's a popup menu
    m.style.cssText = 'position:fixed;z-index:200;min-width:148px;padding:6px;border-radius:12px;'
      + 'background:rgba(18,18,18,.92);backdrop-filter:saturate(110%) blur(20px);-webkit-backdrop-filter:saturate(110%) blur(20px);'
      + 'border:1px solid var(--border);box-shadow:0 24px 60px rgba(0,0,0,.6),inset 0 1px 0 rgba(255,255,255,.2);'
      + 'font-family:inherit;font-size:12px;color:var(--text);user-select:none;';
    const mk = (label: string, onClick: () => void) => {
      const it = el('div') as HTMLDivElement;
      it.textContent = label;
      it.setAttribute('role', 'menuitem'); it.setAttribute('aria-label', label); it.tabIndex = -1; // ARIA: keyboard/AT-addressable menu item
      it.style.cssText = 'padding:8px 11px;border-radius:8px;cursor:pointer;font-weight:600;transition:background .12s;';
      it.onmouseenter = () => { it.style.background = 'var(--glass-3)'; };
      it.onmouseleave = () => { it.style.background = ''; };
      // run on mousedown so the global outside-mousedown listener (capture) doesn't
      // pre-empt a click; stopPropagation keeps that listener from dismissing first.
      it.onmousedown = (ev) => { ev.preventDefault(); ev.stopPropagation(); hideContextMenu(); onClick(); };
      return it;
    };
    m.appendChild(mk('Group', () => groupSelection()));
    m.appendChild(mk('Delete', () => deleteSelection()));
    document.body.appendChild(m);
    ctxMenuEl = m;
  }
  // clamp into the viewport so the menu never opens off-screen at the edges.
  const mw = 160, mh = 84;
  const left = Math.min(clientX, window.innerWidth - mw - 6);
  const top = Math.min(clientY, window.innerHeight - mh - 6);
  ctxMenuEl.style.left = left + 'px'; ctxMenuEl.style.top = top + 'px'; ctxMenuEl.style.display = 'block';
  window.addEventListener('mousedown', onCtxOutside, true);
  window.addEventListener('keydown', onCtxKey, true);
  window.addEventListener('blur', hideContextMenu);
}

function numField(label: string, value: number, min: number, max: number, step: number, onIn: (v: number) => void) {
  const f = el('div', 'field'); const lab = el('label'); lab.textContent = label; f.appendChild(lab);
  const row = el('div', 'row'); const r = el('input') as HTMLInputElement; r.type = 'range'; r.min = String(min); r.max = String(max); r.step = String(step); r.value = String(value);
  // NUMERIC ENTRY: the readout is now an editable <input type="number" class="val"> so
  // exact values can be typed for transform/crop/timing/size/params. Slider and number
  // stay in sync: slider input updates the number, number input updates the slider —
  // both clamp to [min,max] and call the same onIn(v) so the IR write path is identical.
  const v = el('input', 'val') as HTMLInputElement; v.type = 'number'; v.min = String(min); v.max = String(max); v.step = String(step); v.value = (+value).toFixed(2);
  const clampNum = (n: number) => Math.max(min, Math.min(max, n));
  // round the typed value the same way the slider would, so the readout doesn't show
  // spurious precision (matches the prior .toFixed(2) display while honouring step).
  r.oninput = () => { const nv = parseFloat(r.value); v.value = (+nv).toFixed(2); onIn(nv); };
  const onNum = () => {
    const raw = parseFloat(v.value); if (!isFinite(raw)) return; // ignore empty/half-typed
    const nv = clampNum(raw); r.value = String(nv); onIn(nv);
  };
  // live while typing (input) AND on commit (change) — change also re-normalises the
  // displayed text (and re-clamps out-of-range entries) once the field is left.
  v.oninput = onNum;
  v.onchange = () => { const raw = parseFloat(v.value); if (isFinite(raw)) { const nv = clampNum(raw); v.value = (+nv).toFixed(2); r.value = String(nv); onIn(nv); } };
  row.appendChild(r); row.appendChild(v); f.appendChild(row); return f;
}
// color field: native swatch + hex text input, both write through the same handler.
// Only a valid 3/6-digit hex from the text box commits (so half-typed values don't
// thrash the IR); the swatch always emits a valid hex.
function colorField(label: string, value: string, onIn: (v: string) => void) {
  const f = el('div', 'field'); const lab = el('label'); lab.textContent = label; f.appendChild(lab);
  const row = el('div', 'row color-row');
  const safe = (v: string) => /^#[0-9a-fA-F]{6}$/.test(v) ? v : (/^#[0-9a-fA-F]{3}$/.test(v) ? '#' + v.slice(1).split('').map((c) => c + c).join('') : '#ffffff');
  const sw = el('input', 'color-swatch') as HTMLInputElement; sw.type = 'color'; sw.value = safe(value);
  const hex = el('input', 'color-hex') as HTMLInputElement; hex.type = 'text'; hex.value = value; hex.spellcheck = false;
  sw.oninput = () => { hex.value = sw.value; onIn(sw.value); };
  hex.oninput = () => { const v = hex.value.trim(); if (/^#[0-9a-fA-F]{3}([0-9a-fA-F]{3})?$/.test(v)) { sw.value = safe(v); onIn(v); } };
  row.appendChild(sw); row.appendChild(hex); f.appendChild(row); return f;
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
    // ARIA: these are glyph-only buttons (‹ › ✕ ◆) — give each an aria-label so screen
    // readers announce the action, not the bare punctuation glyph.
    const prev = el('button', 'icon-btn'); prev.textContent = '‹'; prev.title = 'prev keyframe'; prev.setAttribute('aria-label', `previous ${label} keyframe`); prev.style.cssText = 'float:right;padding:1px 6px;font-size:11px';
    prev.onclick = () => { const lt = playheadLocal(); const before = [...arr].reverse().find((k: any) => k.t < lt - eps); if (before && layer) seekTo(S.offsets[S.selected!.s] + (layer.start ?? 0) + before.t); };
    const next = el('button', 'icon-btn'); next.textContent = '›'; next.title = 'next keyframe'; next.setAttribute('aria-label', `next ${label} keyframe`); next.style.cssText = 'float:right;padding:1px 6px;font-size:11px';
    next.onclick = () => { const lt = playheadLocal(); const after = arr.find((k: any) => k.t > lt + eps); if (after && layer) seekTo(S.offsets[S.selected!.s] + (layer.start ?? 0) + after.t); };
    const clr = el('button', 'icon-btn'); clr.textContent = '✕'; clr.title = 'clear all keyframes for this property'; clr.setAttribute('aria-label', `clear all ${label} keyframes`); clr.style.cssText = 'float:right;padding:1px 6px;font-size:10px';
    clr.onclick = () => clearKeyframes(prop);
    lab.appendChild(clr); lab.appendChild(next); lab.appendChild(prev);
  }
  const key = el('button', 'icon-btn'); key.innerHTML = n ? `◆ ${n}` : '◆'; key.title = 'toggle keyframe at playhead (alt-click clears all)'; key.setAttribute('aria-label', `toggle ${label} keyframe at playhead${n ? ` (${n} set)` : ''}`);
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
      // FEATURE 2: live SVG curve preview of the selected easing, next to the select.
      // Plots y = ease(name, x) for x in [0,1] using the REAL core ease() so the graph
      // matches the runtime exactly. Re-rendered on every change of the selector.
      const graph = easingGraphEl(at.easing ?? 'linear');
      sel.onchange = () => { at.easing = sel.value; redrawEasingGraph(graph, sel.value); liveEdit(); };
      // B-ease-direction: the easing stored on keyframe N governs the segment ARRIVING
      // into N (from N-1) — both runtime and keyframeValueAt use the END keyframe's
      // easing. The forward arrow was inverted; label it as the incoming segment.
      const elab = el('label'); elab.textContent = 'ease ← (into)'; elab.title = "easing of the segment arriving into this keyframe"; elab.style.cssText = 'font-size:9px;color:var(--dim)';
      const row = el('div', 'row'); row.appendChild(elab); row.appendChild(sel); ef.appendChild(row);
      // graph sits on its own row under the selector so it never squeezes the dropdown.
      const grow = el('div', 'row'); grow.style.cssText = 'margin-top:4px;justify-content:center'; grow.appendChild(graph); ef.appendChild(grow);
      f.appendChild(ef);
    }
  }
  return f;
}
// FEATURE 2 helpers — small inline SVG that draws an easing curve y=ease(name,x).
// Pure editor chrome: it reads the real core ease() so the plot matches the runtime,
// but never touches the IR. Built once via easingGraphEl, redrawn via redrawEasingGraph.
const EG_W = 88, EG_H = 40, EG_PAD = 4; // box + inner padding for the plot area
// build the <svg> (grid + baseline + curve path). Sample ease() across [0,1] and map
// to screen coords (x left->right, y flipped so 0 is bottom). Monochrome theme.
function easingGraphEl(name: string): SVGSVGElement {
  const NS = 'http://www.w3.org/2000/svg';
  // cast the root explicitly: createElementNS with a non-literal namespace widens to
  // Element under strict, but every call below only uses Element APIs (setAttribute /
  // appendChild), so this single cast keeps the helper signature honest.
  const svg = document.createElementNS(NS, 'svg') as SVGSVGElement;
  svg.setAttribute('width', String(EG_W)); svg.setAttribute('height', String(EG_H));
  svg.setAttribute('viewBox', `0 0 ${EG_W} ${EG_H}`);
  svg.style.cssText = `border:1px solid var(--border);border-radius:7px;background:rgba(0,0,0,.25);display:block`;
  // grid: a faint frame + the two diagonals-of-reference (the linear baseline 0->1).
  const inner = document.createElementNS(NS, 'rect');
  inner.setAttribute('x', String(EG_PAD - 1)); inner.setAttribute('y', String(EG_PAD - 1));
  inner.setAttribute('width', String(EG_W - 2 * EG_PAD + 2)); inner.setAttribute('height', String(EG_H - 2 * EG_PAD + 2));
  inner.setAttribute('fill', 'none'); inner.setAttribute('stroke', 'var(--border)'); inner.setAttribute('stroke-width', '1'); inner.setAttribute('rx', '3');
  svg.appendChild(inner);
  const base = document.createElementNS(NS, 'line'); // linear reference (corner to corner)
  base.setAttribute('x1', String(EG_PAD)); base.setAttribute('y1', String(EG_H - EG_PAD));
  base.setAttribute('x2', String(EG_W - EG_PAD)); base.setAttribute('y2', String(EG_PAD));
  base.setAttribute('stroke', 'var(--dim)'); base.setAttribute('stroke-width', '1'); base.setAttribute('stroke-dasharray', '2 3'); base.setAttribute('opacity', '0.5');
  svg.appendChild(base);
  const path = document.createElementNS(NS, 'path');
  path.setAttribute('class', 'eg-curve'); path.setAttribute('fill', 'none');
  path.setAttribute('stroke', 'var(--accent)'); path.setAttribute('stroke-width', '1.5');
  path.setAttribute('stroke-linejoin', 'round'); path.setAttribute('stroke-linecap', 'round');
  svg.appendChild(path);
  redrawEasingGraph(svg, name);
  return svg;
}
// recompute just the curve <path> for a new easing (cheap; reuses the existing svg).
function redrawEasingGraph(svg: SVGSVGElement, name: string) {
  const path = svg.querySelector('.eg-curve') as SVGPathElement | null; if (!path) return;
  const w = EG_W - 2 * EG_PAD, h = EG_H - 2 * EG_PAD, N = 40;
  let d = '';
  for (let i = 0; i <= N; i++) {
    const x = i / N;
    // overshoot eases (easeOutBack) can exceed [0,1]; clamp the plotted y so the
    // curve stays inside the box (the runtime value itself is unchanged).
    const y = Math.max(0, Math.min(1, ease(name as any, x)));
    const sx = EG_PAD + x * w, sy = EG_PAD + (1 - y) * h; // flip y for screen coords
    d += (i === 0 ? 'M' : 'L') + sx.toFixed(2) + ' ' + sy.toFixed(2);
  }
  path.setAttribute('d', d);
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
  delete second.groupId; // split halves are independent — don't silently grow the group
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
function duplicateSelected() { if (!S.selected) return; const { s, l } = S.selected; const scene = S.ir.scenes[s]; const copy = JSON.parse(JSON.stringify(scene.layers[l])); delete copy.zIndex; delete copy.groupId; copy.start = (copy.start ?? 0) + 0.2; scene.layers.splice(l + 1, 0, copy); normalizeZ(s); S.multi = []; S.selected = { s, l: l + 1 }; structuralEdit(); }
// z-order: reorder the selected layer within its scene (array order == paint order; zIndex normalised to match)
function arrangeLayer(mode: 'top' | 'up' | 'down' | 'bottom') {
  if (!S.selected) { showToast('Select a layer to arrange.'); return; }
  const { s, l } = S.selected; const arr = S.ir.scenes[s].layers;
  const moved = arr[l];
  if (!moved) return;
  // Group layers into UNITS, then move the selected layer's unit up/down through the
  // WHOLE stack. An fx travels with the content layer it sits on (so it's never split
  // from its runtime target). Content layers and overlays are each their own unit head.
  // Overlays are full z-stack participants now (no 9000+ band): an overlay sitting
  // lower filters only the layers below it, so the user can place it anywhere.
  const units: any[][] = []; let cur: any[] | null = null;
  arr.forEach((L: any) => {
    if (L.type === 'fx' && cur && cur[0].type !== 'overlay') cur.push(L);
    else { cur = [L]; units.push(cur); }
  });
  const ui = units.findIndex((u) => u.includes(moved)); if (ui < 0) return;
  if (units.length < 2) { showToast('Nothing to reorder — only one layer in this scene.'); return; }
  let ni = ui;
  if (mode === 'top') ni = units.length - 1; else if (mode === 'bottom') ni = 0; else if (mode === 'up') ni = Math.min(units.length - 1, ui + 1); else ni = Math.max(0, ui - 1);
  if (ni === ui) return;
  const [u] = units.splice(ui, 1); units.splice(ni, 0, u);
  S.ir.scenes[s].layers = units.flat();
  normalizeZ(s); // single source of truth for z-order == paint order
  S.multi = []; S.selected = { s, l: S.ir.scenes[s].layers.indexOf(moved) };
  structuralEdit();
}
// project views: Compositions (scenes) / Assets / Code
let projTab = 'comp';
// route through the shared modal helpers so the dialog traps focus, closes on Esc, and
// restores focus to the opener (MODAL focus-trap + Esc). renderProj() must run AFTER
// the modal is shown so its first control is focusable when openModalById focuses it.
function openProj(tab: string) { projTab = tab; renderProj(); openModalById('projModal'); }
function closeProj() { closeModalById('projModal'); }
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
// COLLAPSIBLE PROPERTY SECTIONS — persisted collapsed-state per section title so a
// keyframed layer (many sliders + easing graphs) isn't one giant scroll and the
// open/closed shape survives panel rebuilds. State is keyed by the section's title
// text (stable across rebuilds) in localStorage under vgp.secCollapsed.
const SEC_KEY = 'vgp.secCollapsed';
function loadCollapsedSecs(): Set<string> {
  try { const raw = localStorage.getItem(SEC_KEY); if (raw) return new Set(JSON.parse(raw) as string[]); } catch {}
  return new Set<string>();
}
const collapsedSecs = loadCollapsedSecs();
function persistCollapsedSecs() { try { localStorage.setItem(SEC_KEY, JSON.stringify([...collapsedSecs])); } catch {} }
// empty-state Properties placeholder — an engaging Lottie loop (packages/editor/placeholder.json)
let phAnim: any = null;
function mountPlaceholderLottie() {
  const c = document.getElementById('phLottie'); if (!c) return;
  try { phAnim = lottie.loadAnimation({ container: c, renderer: 'svg', loop: true, autoplay: true, path: '/packages/editor/placeholder.json' }); } catch {}
}
function buildProps() {
  const p = $('rightBody'); p.innerHTML = '';
  try { phAnim?.destroy(); } catch {} phAnim = null; // tear down the placeholder animation on every re-render
  // current append target for section fields — `add(node)` routes a field into the
  // CURRENT section body so every field after a header lands in that header's
  // collapsible body (set by h()). Defaults to the panel root for pre-header content.
  let cur: HTMLElement = p;
  const add = (node: Node) => cur.appendChild(node);
  // h(title): build a collapsible .sec (clickable .sec-head toggling .collapsed on the
  // .sec, plus a .sec-body that becomes the new append target). Returns the body so
  // callers may target it directly; subsequent add() calls land in it automatically.
  const h = (t: string) => {
    const sec = el('div', 'sec'); if (collapsedSecs.has(t)) sec.classList.add('collapsed');
    const head = el('div', 'sec-head'); head.textContent = t;
    head.setAttribute('role', 'button'); head.tabIndex = 0; head.title = 'Click to collapse / expand';
    const body = el('div', 'sec-body');
    const toggle = () => { const nowCollapsed = sec.classList.toggle('collapsed'); if (nowCollapsed) collapsedSecs.add(t); else collapsedSecs.delete(t); persistCollapsedSecs(); };
    head.onclick = toggle;
    head.onkeydown = (ev: KeyboardEvent) => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); ev.stopPropagation(); toggle(); } }; // #20: stop Space bubbling to the global play/pause
    sec.appendChild(head); sec.appendChild(body); p.appendChild(sec);
    cur = body; return body;
  };
  if (S.selAudio != null) {
    const a = S.ir.audio?.[S.selAudio];
    if (!a) { S.selAudio = null; return buildProps(); }
    const head = el('div', 'sel-head');
    const pill = el('span', 'pill'); pill.innerHTML = icon('audio') + 'audio'; pill.style.background = '#2b2b2b'; head.appendChild(pill);
    const title = el('span'); title.textContent = String(a.src).split('/').pop() ?? 'audio'; title.style.cssText = 'flex:1;font-weight:600;overflow:hidden;text-overflow:ellipsis'; head.appendChild(title);
    // mute toggle + delete the selected audio track
    const mute = el('button', 'icon-btn'); mute.innerHTML = icon((a.volume ?? 1) === 0 ? 'mute' : 'speaker'); mute.title = 'mute / unmute'; mute.setAttribute('aria-label', (a.volume ?? 1) === 0 ? 'unmute audio track' : 'mute audio track'); mute.onclick = () => { a.volume = (a.volume ?? 1) === 0 ? 1 : 0; liveEdit(); buildTimeline(); buildProps(); }; head.appendChild(mute);
    const ai = S.selAudio; const del = el('button', 'icon-btn'); del.innerHTML = icon('trash'); del.title = 'delete audio track'; del.setAttribute('aria-label', 'delete audio track'); del.onclick = () => { S.ir.audio.splice(ai, 1); S.selAudio = null; structuralEdit(); }; head.appendChild(del);
    p.appendChild(head);
    h('audio');
    add(numField('volume', a.volume ?? 1, 0, 1, 0.01, (v) => { a.volume = v; liveEdit(); buildTimeline(); }));
    // bound consistent with the lane drag (start up to S.total - 0.1) so both the
    // slider and the lane can reach the same tail positions (B-audio-startmax).
    add(numField('start (s)', a.start ?? 0, 0, Math.max(1, S.total - 0.1, effectiveTotal() - 0.1), 0.05, (v) => { a.start = v; liveSeek(); buildTimeline(); scheduleSave(); }));
    const info = (typeof VGP.audioInfo === 'function' ? VGP.audioInfo() : [])[S.selAudio];
    const fileDur = info?.duration ?? null;
    const curDur = a.duration ?? fileDur ?? Math.max(1, S.total - (a.start ?? 0));
    // cap to the real audio length (file - trimStart) once metadata is known
    const maxDur = fileDur != null ? Math.max(0.2, fileDur - (a.trimStart ?? 0)) : Math.max(curDur, S.total);
    add(numField('duration (s)', Math.min(curDur, maxDur), 0.2, maxDur, 0.05, (v) => { a.duration = v; buildTimeline(); scheduleSave(); }));
    return;
  }
  // EMPTY-STATE onboarding: friendly hint pointing at the workflow when nothing is
  // selected. Kept inside the .empty element so the markup agent's styling applies.
  if (!S.selected) {
    p.innerHTML = '<div class="empty ph-empty">'
      + '<div id="phLottie" class="ph-lottie" aria-hidden="true"></div>'
      + '<div class="ph-hint"><b>Select a clip</b> to edit — or add a layer / drag in media to begin.</div>'
      + '</div>';
    mountPlaceholderLottie();
    return;
  }
  const { s, l } = S.selected; const scene = S.ir.scenes[s]; const layer = scene?.layers[l];
  if (!layer) { S.selected = null; return buildProps(); }

  // fx control-layer: a tracked effect applied to the clip below it
  if (layer.type === 'fx') {
    const entry = MAN.get(layer.effect) as any;
    const head = el('div', 'sel-head');
    const pill = el('span', 'pill'); pill.innerHTML = icon('spark') + 'fx'; pill.style.background = 'var(--clip-fx)'; head.appendChild(pill);
    const title = el('span'); title.textContent = String(layer.effect).split('.')[1].replace(/-/g, ' '); title.style.cssText = 'flex:1;font-weight:600'; head.appendChild(title);
    const del = el('button', 'icon-btn'); del.innerHTML = icon('trash'); del.title = 'delete'; del.setAttribute('aria-label', 'delete effect'); del.onclick = () => deleteSelection(); head.appendChild(del); p.appendChild(head); // FEATURE 1: multi-aware delete
    // resolve the real target using the SAME rule as the runtime (overlay-skipping)
    const tgt = resolveFxTarget(scene, l);
    const note = el('div'); note.style.cssText = 'font-size:11px;color:var(--dim);margin-bottom:8px';
    note.innerHTML = tgt ? `driving: <b>${layerLabel(tgt.layer)}</b>` : '⚠ no target layer below this fx — it renders nothing';
    p.appendChild(note);
    layer.params = layer.params || {};
    if (entry) { h('effect settings'); for (const [pk, spec] of Object.entries<any>(entry.params)) { const min = spec.min ?? 0, max = spec.max ?? (spec.default * 2 || 1); add(numField(pk, layer.params[pk] ?? spec.default, min, max, (max - min) / 100 || 0.01, (v) => { layer.params[pk] = v; liveEdit(); })); } }
    h('timing');
    // bound the fx window to the target/scene window (fx never auto-extends the
    // scene now, so both sliders measure against a stable length).
    const tgtStart = tgt?.layer.start ?? 0; const tgtDur = tgt?.layer.duration ?? scene.duration; const winMax = tgtStart + tgtDur;
    add(numField('start (s)', layer.start ?? 0, 0, Math.max(0, winMax - 0.1), 0.05, (v) => { layer.start = v; timingEdit(); }));
    // B-fx-dur-cap: the fx window can't extend past where its target stops rendering.
    // Cap to (winMax - layer.start), IDENTICAL to the clip-trim handle, so the panel
    // and clip caps agree and a fx window can never run past the target's active span.
    const fxDurMax = Math.max(0.1, winMax - (layer.start ?? 0));
    add(numField('duration (s)', Math.min(layer.duration ?? fxDurMax, fxDurMax), 0.1, fxDurMax, 0.05, (v) => { layer.duration = v; timingEdit(); }));
    return;
  }

  const head = el('div', 'sel-head');
  const pill = el('span', 'pill'); pill.innerHTML = icon(typeIco[layer.type] ?? 'shape') + layer.type; pill.style.background = clipColor[layer.type] ?? '#555'; head.appendChild(pill);
  const title = el('span'); title.textContent = layer.type === 'text' ? String(layer.text).slice(0, 16) : (layer.src ? String(layer.src).split('/').pop() : layer.type); title.style.cssText = 'flex:1;font-weight:600;overflow:hidden;text-overflow:ellipsis'; head.appendChild(title);
  const del = el('button', 'icon-btn'); del.innerHTML = icon('trash'); del.title = 'delete layer'; del.setAttribute('aria-label', 'delete layer'); del.onclick = () => deleteSelection(); head.appendChild(del); p.appendChild(head); // FEATURE 1: multi-aware delete

  // alignment bar — align the selection to each other (>=2 layers) or to the canvas
  // (single). Distribute (even spacing) shows for 3+. Overlays are full-frame → skip.
  if (layer.type !== 'overlay') {
    const cnt = alignableSelection().length;
    if (cnt >= 1) {
      const an = el('div'); an.style.cssText = 'font-size:11px;color:var(--dim);margin:2px 0 6px';
      an.textContent = cnt >= 2 ? `${cnt} layers selected — align / space` : 'Align to canvas';
      p.appendChild(an);
      const aBtn = (title: string, label: string, fn: () => void) => { const b = el('button'); b.title = title; b.setAttribute('aria-label', title); b.textContent = label; b.style.cssText = 'flex:1;min-width:0;padding:5px 2px;font-size:11px;font-weight:600;background:var(--glass-2);color:var(--dim);border:1px solid var(--border);border-radius:7px;cursor:pointer'; b.onmouseenter = () => (b.style.color = '#fff'); b.onmouseleave = () => (b.style.color = 'var(--dim)'); b.onclick = fn; return b; };
      const aRow = () => { const d = el('div'); d.style.cssText = 'display:flex;gap:5px;margin-bottom:6px'; return d; };
      const r1 = aRow(); r1.append(aBtn('Align left edges', 'Left', () => alignSelected('left')), aBtn('Center horizontally', 'Center', () => alignSelected('cx')), aBtn('Align right edges', 'Right', () => alignSelected('right'))); p.appendChild(r1);
      const r2 = aRow(); r2.append(aBtn('Align top edges', 'Top', () => alignSelected('top')), aBtn('Center vertically', 'Middle', () => alignSelected('cy')), aBtn('Align bottom edges', 'Bottom', () => alignSelected('bottom'))); p.appendChild(r2);
      if (cnt >= 3) { const r3 = aRow(); r3.append(aBtn('Distribute evenly — horizontal spacing', 'Distribute H', () => distributeSelected('h')), aBtn('Distribute evenly — vertical spacing', 'Distribute V', () => distributeSelected('v'))); p.appendChild(r3); }
    }
  }

  // arrange / z-order. Every layer — content AND overlays — lives in one z-stack now:
  // use these (or drag the clip vertically) to move it up/down. An overlay is an
  // adjustment layer that filters everything BELOW it, so moving it changes what it
  // affects (it defaults to the top of the stack when first added).
  if (layer.type === 'overlay') {
    const note = el('div'); note.style.cssText = 'font-size:11px;color:var(--dim);margin-bottom:8px';
    note.textContent = 'Adjustment layer — filters everything below it. Move it up/down to change which layers it affects.';
    p.appendChild(note);
  }
  const arrange = el('div', 'arrange');
  ([['arrTop', 'To front', 'top'], ['arrUp', 'Forward', 'up'], ['arrDown', 'Backward', 'down'], ['arrBot', 'To back', 'bottom']] as const).forEach(([ic, lbl, mode]) => {
    // ARIA/title: the icon precedes a text span, but label the button explicitly so the
    // accessible name is the action and a tooltip is available on hover.
    const bn = el('button'); bn.innerHTML = icon(ic) + `<span>${lbl}</span>`; bn.title = lbl; bn.setAttribute('aria-label', lbl); bn.onclick = () => arrangeLayer(mode as any); arrange.appendChild(bn);
  });
  p.appendChild(arrange);

  if (layer.type === 'text') {
    h('text');
    const f = el('div', 'field'); const lab = el('label'); lab.textContent = 'text'; f.appendChild(lab);
    const ta = el('textarea') as HTMLTextAreaElement; ta.value = layer.text; ta.oninput = () => { layer.text = ta.value; structuralEdit(); }; f.appendChild(ta); add(f);
    layer.style = layer.style || {};
    add(numField('font size', parseInt(layer.style.fontSize || '72'), 12, 240, 1, (v) => { layer.style.fontSize = Math.round(v) + 'px'; structuralEdit(); }));
    add(colorField('color', layer.style.color || '#ffffff', (v) => { layer.style.color = v; structuralEdit(); }));
  }
  if (layer.type === 'image' || layer.type === 'video') {
    h('media');
    const cf = el('div', 'field'); const cl = el('label'); cl.textContent = 'fit'; cf.appendChild(cl); const sel = el('select') as HTMLSelectElement; ['cover', 'contain'].forEach((o) => { const op = el('option') as HTMLOptionElement; op.value = o; op.textContent = o; if ((layer.fit ?? 'cover') === o) op.selected = true; sel.appendChild(op); }); sel.onchange = () => { layer.fit = sel.value; structuralEdit(); }; cf.appendChild(sel); add(cf);
    // crop (%): inset each side; live via the runtime (applies layer.crop at seek). Drag
    // the center selbox dot to crop on the preview, or fine-tune per side here.
    h('crop (%)');
    const setCrop = (k: 't' | 'r' | 'b' | 'l', v: number) => { layer.crop = layer.crop || { t: 0, r: 0, b: 0, l: 0 }; (layer.crop as any)[k] = v; liveEdit(); };
    add(numField('top', layer.crop?.t ?? 0, 0, 95, 1, (v) => setCrop('t', v)));
    add(numField('right', layer.crop?.r ?? 0, 0, 95, 1, (v) => setCrop('r', v)));
    add(numField('bottom', layer.crop?.b ?? 0, 0, 95, 1, (v) => setCrop('b', v)));
    add(numField('left', layer.crop?.l ?? 0, 0, 95, 1, (v) => setCrop('l', v)));
  }
  if (layer.type === 'shape') { h('shape'); add(colorField('fill color', layer.fill || '#ffffff', (v) => { layer.fill = v; structuralEdit(); })); }
  if (layer.type === 'overlay') {
    h('overlay');
    const cf = el('div', 'field'); const cl = el('label'); cl.textContent = 'effect'; cf.appendChild(cl); const ci = el('input') as HTMLInputElement; ci.type = 'text'; ci.value = String(layer.effect).replace(/-/g, ' '); ci.readOnly = true; cf.appendChild(ci); add(cf);
    const spec = (MAN.get('overlay.' + layer.effect) as any)?.params?.amount; const min = spec?.min ?? 0, max = spec?.max ?? 1;
    layer.params = layer.params || {};
    add(numField('amount', layer.params.amount ?? (spec?.default ?? 1), min, max, (max - min) / 100 || 0.01, (v) => { layer.params.amount = v; structuralEdit(); }));
  }

  layer.presets = layer.presets || [];
  h('applied animations');
  if (!layer.presets.length) { const e = el('div', 'empty'); e.style.cssText = 'padding:8px 0;font-size:11px'; e.textContent = 'none yet'; add(e); }
  layer.presets.forEach((inst: any, idx: number) => {
    const entry = MAN.get(inst.id); const card = el('div', 'preset-card'); const hd = el('div', 'head'); const b = el('b'); b.textContent = inst.id; hd.appendChild(b);
    const rm = el('button', 'icon-btn'); rm.innerHTML = icon('trash'); rm.title = 'remove animation'; rm.setAttribute('aria-label', `remove ${inst.id} animation`); rm.onclick = () => { layer.presets.splice(idx, 1); structuralEdit(); }; hd.appendChild(rm); card.appendChild(hd);
    if (entry) { inst.params = inst.params || {}; for (const [pk, spec] of Object.entries<any>(entry.params)) { const curVal = inst.params[pk] ?? spec.default; const min = spec.min ?? 0, max = spec.max ?? (spec.default * 2 || 1); card.appendChild(numField(pk, curVal, min, max, (max - min) / 100 || 0.01, (v) => { inst.params[pk] = v; liveEdit(); })); } }
    add(card);
  });
  const browse = el('button', 'btn'); browse.style.cssText = 'width:100%;justify-content:center;margin-top:6px'; browse.innerHTML = icon('spark') + 'Browse animations'; browse.onclick = () => setTab('anim'); add(browse);

  h('timing');
  add(numField('start (s)', layer.start ?? 0, 0, scene.duration, 0.05, (v) => { layer.start = v; timingEdit(); }));
  // B08: allow lengthening past the scene — derive() auto-extends. Generous cap.
  add(numField('duration (s)', layer.duration ?? scene.duration, 0.1, Math.max(scene.duration, S.total), 0.05, (v) => { layer.duration = v; timingEdit(); }));
  h('transform  ·  ◆ = keyframe at playhead');
  layer.transform = layer.transform || {}; const tf = layer.transform;
  add(kfField('x', 'x', tf.x ?? 0, -800, 800, 1, (v) => { tf.x = v; liveEdit(); }));
  add(kfField('y', 'y', tf.y ?? 0, -800, 800, 1, (v) => { tf.y = v; liveEdit(); }));
  add(kfField('scale (zoom)', 'scale', tf.scale ?? 1, 0, 3, 0.01, (v) => { tf.scale = v; liveEdit(); }));
  add(kfField('rotate', 'rotate', tf.rotate ?? 0, -180, 180, 1, (v) => { tf.rotate = v; liveEdit(); }));
  add(kfField('opacity', 'opacity', tf.opacity ?? 1, 0, 1, 0.01, (v) => { tf.opacity = v; liveEdit(); }));
  const tip = el('div'); tip.style.cssText = 'font-size:10px;color:var(--dim);margin-top:6px;line-height:1.5';
  tip.innerHTML = 'drag on canvas to move · arrows nudge · <b>S</b> split · <b>⌘D</b> duplicate · <b>Del</b> remove';
  add(tip);
}

// FEATURE 1 — hover-to-preview state. Holds the in-flight preview so it can be torn
// down from mouseleave, from a card click, OR when the library rebuilds (the old
// .anim-card elements get detached by innerHTML='' and their mouseleave never fires,
// so we MUST cancel here too — otherwise the rAF loop leaks and keeps mounting a
// stale clone). Pure editor chrome: it NEVER calls scheduleSave / writes the IR.
let hoverPreview: { raf: number; savedIR: string; savedPlayhead: number } | null = null;
// categories whose apply path inserts an fx control-layer onto the SELECTED layer —
// these are the ones we can faithfully preview. transition/overlay change scene-level
// or stack-level structure, so we skip live hover-preview for them (per spec).
const HOVER_PREVIEW_CATS = new Set(['text', 'image', 'in', 'out']);
// stop any running preview loop and fully revert to the saved IR + playhead. Idempotent.
function endHoverPreview() {
  if (!hoverPreview) return;
  cancelAnimationFrame(hoverPreview.raf);
  const { savedIR, savedPlayhead } = hoverPreview;
  hoverPreview = null;
  // restore the authoritative IR/playhead and remount from S.ir (NOT the clone).
  try { S.ir = JSON.parse(savedIR); } catch { /* leave S.ir as-is on parse failure */ }
  S.playhead = savedPlayhead;
  mountPreview();
  VGP.seek(S.playhead, { playing: S.playing });
}
// start a live, non-committing preview of `entry` on the selected layer. Deep-clones
// S.ir, inserts the fx control-layer exactly as applyFromLibrary would (newFxLayer),
// mounts the clone, then sweeps the playhead across the preset window via rAF so the
// motion is visible. Nothing here persists.
function startHoverPreview(entry: any) {
  if (hoverPreview) endHoverPreview();           // never stack two previews
  if (!S.selected || !HOVER_PREVIEW_CATS.has(entry.category)) return;
  const { s, l } = S.selected; const scene = S.ir.scenes[s]; const target = scene.layers[l];
  if (!target || !presetAppliesTo(entry.id, target.type)) return; // skip no-op presets silently
  const savedIR = JSON.stringify(S.ir); const savedPlayhead = S.playhead;
  // deep clone via the snapshot we just took (one stringify, no second pass).
  const clone = JSON.parse(savedIR);
  const cScene = clone.scenes[s]; const cTarget = cScene.layers[l];
  const fx = newFxLayer(cTarget, cScene.duration, entry.id);
  cScene.layers.splice(l + 1, 0, fx);
  VGP.mount(clone, { assetBase: baseUrl() });
  // sweep window: from the target's absolute start across the fx layer's duration,
  // capped to the preset's defaultDuration when set so one-shots play at natural speed.
  const startAbs = (S.offsets[s] ?? 0) + (cTarget.start ?? 0);
  const presetEntry: any = MAN.get(entry.id);
  const win = Math.max(0.3, Math.min(fx.duration ?? 1, presetEntry?.defaultDuration ?? fx.duration ?? 1));
  const t0 = performance.now();
  hoverPreview = { raf: 0, savedIR, savedPlayhead };
  const tick = () => {
    if (!hoverPreview) return;                    // cancelled mid-flight
    const elapsed = (performance.now() - t0) / 1000;
    const local = win > 0 ? (elapsed % (win + 0.25)) : 0; // small pause then loop
    VGP.seek(startAbs + Math.min(local, win), { playing: false });
    hoverPreview.raf = requestAnimationFrame(tick);
  };
  hoverPreview.raf = requestAnimationFrame(tick);
}

function buildLibrary() {
  endHoverPreview(); // cancel any in-flight preview before the old cards are detached
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
    // FEATURE 1: live hover preview. mouseenter shows the animation on a throwaway
    // clone; mouseleave reverts. Click first ends the preview (restoring S.ir) so
    // applyFromLibrary operates on the clean saved IR, never the preview clone.
    card.onclick = () => { endHoverPreview(); applyFromLibrary(e); };
    card.onmouseenter = () => {
      if (!HOVER_PREVIEW_CATS.has(e.category)) return; // transitions/overlays: no live preview
      if (!S.selected) { showToast('Select a clip to preview the effect.'); return; }
      if (!presetAppliesTo(e.id, S.ir.scenes[S.selected.s].layers[S.selected.l]?.type)) return;
      startHoverPreview(e);
    };
    card.onmouseleave = () => endHoverPreview();
    card.draggable = true;
    // dragstart must also abort the preview so the drag operates on the real IR.
    card.ondragstart = (ev: any) => { endHoverPreview(); const t = e.category === 'transition' ? 'application/x-vgp-transition' : e.category === 'overlay' ? 'application/x-vgp-overlay' : 'application/x-vgp-preset'; ev.dataTransfer.setData(t, e.id); };
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
  S.multi = []; S.selected = { s, l: l + 1 };
  S.playhead = (S.offsets[s] ?? 0) + (target.start ?? 0) + 0.05;
  setTab('props'); structuralEdit(); positionPlayhead();
  showToast('Added ' + entry.id.split('.')[1].replace(/-/g, ' '));
}

// ---------- playback ----------
// true while any mounted preview <video> hasn't buffered enough to paint the
// current frame (readyState < 2 == HAVE_CURRENT_DATA). Editor chrome only — used
// to flash a buffering stripe on the seek bar. Pure read of live DOM state.
function previewBuffering(): boolean {
  return [...document.querySelectorAll('#stage video')].some((v) => (v as HTMLVideoElement).readyState < 2);
}
// drive the preview progress / seek bar: fill width + knob position from the
// playhead fraction, and toggle the buffering stripe. Called on every seek and on
// every playback tick. `forceLoading` lets the initial mount show buffering until
// VGP.ready() resolves even before a <video> has attached.
function updateSeekbar(forceLoading = false) {
  const bar = document.getElementById('seekbar'); if (!bar) return;
  const tot = effectiveTotal();
  const frac = clamp01(tot > 0 ? S.playhead / tot : 0);
  // fill + knob both live inside the 18px horizontal track inset, so size them
  // against the same (100% - 36px) band — keeps the fill end aligned with the knob
  // and the track's right edge (the track ::before is left:18px right:18px).
  const fill = document.getElementById('seekFill'); if (fill) fill.style.width = `calc(${frac} * (100% - 36px))`;
  const knob = document.getElementById('seekKnob'); if (knob) knob.style.left = `calc(18px + ${frac} * (100% - 36px))`;
  bar.classList.toggle('loading', forceLoading || previewBuffering());
}
function updateTime() { $('tpTime').textContent = fmtClockMs(S.playhead); $('tpTotal').textContent = ' / ' + fmtClockMs(effectiveTotal()); updateSeekbar(); refreshHistoryButtons(); }
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
// B-seek-follow: a DISCRETE seek (transport buttons, keyframe nav, the Scenes modal's
// jump-to-scene) used to leave the playhead wherever it landed without scrolling the
// timeline to it. On a long multi-scene comp the timeline is far wider than the
// viewport, so jumping to a later scene parked the playhead off-screen with the view
// still at 0. Bring it into view via followPlayhead(). `follow` defaults to true; the
// continuous drag-scrubs (timeline background, clip-click, seek bar) pass follow=false
// so seekTo never fights their own edge auto-scroll mid-drag.
function seekTo(t: number, follow = true) { S.playhead = Math.max(0, Math.min(effectiveTotal(), t)); liveSeek(); positionPlayhead(); updateTime(); if (follow) followPlayhead(); }
function setPlayIcon() { $('tpPlay').innerHTML = icon(S.playing ? 'pause' : 'play'); }
function togglePlay() { S.playing = !S.playing; setPlayIcon(); last = performance.now(); VGP.seek(S.playhead, { playing: S.playing }); }
let last = performance.now();
// keep the playhead visible while playing: page the timeline horizontally when the
// cursor reaches the right edge (and snap back when it wraps to the start on loop).
function followPlayhead() {
  const tl = $('tlScroll'); const max = tl.scrollWidth - tl.clientWidth; if (max <= 0) return;
  const phx = LABELW + S.playhead * S.pxPerSec; // playhead x in content coords
  const viewL = tl.scrollLeft + LABELW, viewR = tl.scrollLeft + tl.clientWidth;
  if (phx > viewR - 40 || phx < viewL) tl.scrollLeft = Math.max(0, Math.min(max, phx - LABELW - 24));
}
function loop(now: number) {
  if (S.playing) { const tot = effectiveTotal(); S.playhead += (now - last) / 1000; if (S.playhead >= tot) { if (S.loop) S.playhead = 0; else { S.playhead = tot; togglePlay(); } } VGP.seek(S.playhead, { playing: true }); positionPlayhead(); updateTime(); followPlayhead(); }
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
  item('file', 'New…', '', newComposition);
  item('folder', 'Open…', '', openProjects);
  m.appendChild(el('div', 'menu-sep'));
  item('save', 'Export as JSON', '⌘S', saveJson);
  item('download', 'Export as MP4', '', openExportDialog);
}
// New opens a dialog and creates a SEPARATE file (After-Effects style): the current
// composition is preserved under its own name — New never overwrites what you had open.
function newComposition() {
  const inp = $('newName') as HTMLInputElement; if (inp) inp.value = '';
  openModalById('newModal');
  setTimeout(() => inp?.focus(), 30);
}
async function createNewFile() {
  const nm = (($('newName') as HTMLInputElement)?.value || '').trim() || 'Untitled';
  const [w, h] = (($('newSize') as HTMLSelectElement)?.value || '1920x1080').split('x').map(Number);
  closeModalById('newModal');
  try {
    const r = await (await fetch('/api/new', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ name: nm, width: w, height: h }) })).json();
    if (r.ok) { S.assetBase = r.assetBase; setDoc(r.ir); showToast(`Created “${nm}” → ${r.file}`); }
    else showToast('Could not create file: ' + (r.error || 'error'));
  } catch (e: any) { showToast('Create failed: ' + e.message); }
}
let menuOpen = false;
function closeMenu() { menuOpen = false; $('fileMenu').classList.remove('open'); }
function saveJson() { const nm = (S.ir?.name || 'composition').replace(/[^\w.-]+/g, '_') || 'composition'; const blob = new Blob([JSON.stringify(S.ir, null, 2)], { type: 'application/json' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = nm + '.json'; a.click(); showToast('Exported ' + nm + '.json'); }
// the topbar Export button: a small popup offering JSON or MP4 (click again / outside to close).
let exportMenuClose: (() => void) | null = null;
function openExportMenu() {
  if (exportMenuClose) { exportMenuClose(); return; } // toggle closed (cleans up its own listeners — no leak, #28)
  const btn = $('export'); const r = btn.getBoundingClientRect();
  const m = el('div', 'menu'); m.id = 'exportMenu';
  m.style.cssText = `position:fixed; top:${Math.round(r.bottom + 6)}px; right:${Math.round(Math.max(8, window.innerWidth - r.right))}px; left:auto; display:block; z-index:200; min-width:210px;`;
  const cleanup = () => { m.remove(); document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); exportMenuClose = null; };
  const mi = (ic: string, label: string, fn: () => void) => { const b = el('button', 'menu-item'); b.innerHTML = icon(ic) + `<span>${label}</span>`; b.onclick = () => { cleanup(); fn(); }; m.appendChild(b); };
  mi('save', 'Export as JSON', saveJson);
  mi('download', 'Export as MP4', openExportDialog);
  document.body.appendChild(m);
  const onDown = (ev: MouseEvent) => { if (!m.contains(ev.target as Node) && ev.target !== btn) cleanup(); };
  const onKey = (ev: KeyboardEvent) => { if (ev.key === 'Escape') cleanup(); };
  exportMenuClose = cleanup;
  setTimeout(() => { document.addEventListener('mousedown', onDown); document.addEventListener('keydown', onKey); }, 0);
}
async function openProjects() {
  const list = await (await fetch('/api/projects')).json();
  const pl = $('projList'); pl.innerHTML = '';
  // opening a project closes the modal via the shared helper (restores focus + drops the trap).
  list.forEach((pr: any) => { const d = el('div', 'proj' + (pr.active ? ' active' : '')); d.innerHTML = icon('file') + pr.name; d.onclick = async () => { const r = await (await fetch('/api/open', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ path: pr.path }) })).json(); if (r.ok) { S.assetBase = r.assetBase; setDoc(r.ir); closeModalById('openModal'); } }; pl.appendChild(d); });
  // route through the focus-trap helper (Esc to close, Tab cycles, first control focused).
  openModalById('openModal');
}

// ---------- export with progress ----------
// the user's Lottie (packages/editor/Export.json) plays in the export overlay while
// rendering, with the live percentage below it. Loaded lazily, looped while visible.
let renderAnim: any = null;
function ensureRenderLottie() {
  if (renderAnim) return renderAnim;
  const c = document.getElementById('renderLottie'); if (!c) return null;
  try { renderAnim = lottie.loadAnimation({ container: c, renderer: 'svg', loop: true, autoplay: false, path: '/packages/editor/Export.json' }); } catch { renderAnim = null; }
  return renderAnim;
}
function showRender(show: boolean) {
  const bar = $('renderBar'); const wasShown = bar.classList.contains('show');
  bar.classList.toggle('show', show);
  const a = ensureRenderLottie();
  if (a) { try { if (show && !wasShown) a.goToAndPlay(0, true); else if (!show) a.stop(); } catch {} }
  if (show && !wasShown) { ($('renderActions') as HTMLElement).style.display = 'none'; ($('renderCancel') as HTMLElement).style.display = ''; } // start in the rendering state (Cancel shown)
}
async function cancelRender() {
  $('renderLabel').textContent = 'Cancelling…';
  try { await fetch('/api/render/cancel', { method: 'POST' }); } catch {}
  showRender(false); showToast('Export cancelled');
}
let lastRenderPath = '';
async function runExport(opts: { height?: number; name?: string; dir?: string } = {}) {
  showRender(true); $('renderFill').style.width = '0%'; $('renderPct').textContent = '0%'; $('renderLabel').textContent = 'Starting render…';
  // B04: flush any pending debounced save so the render uses the latest edit, not stale disk.
  clearTimeout(saveTimer);
  const body = JSON.stringify(S.ir); S.lastSyncJson = body;
  try { await fetch('/api/composition', { method: 'POST', headers: { 'content-type': 'application/json' }, body }); } catch {}
  fetch('/api/render', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(opts) }).catch(() => {});
}
// Export-settings dialog — resolution, file name, save location.
async function openExportDialog() {
  ($('exportName') as HTMLInputElement).value = (S.ir?.name || 'render').replace(/[^\w.-]+/g, '_') || 'render';
  const sel = $('exportDir') as HTMLSelectElement; sel.innerHTML = '';
  try { const locs = await (await fetch('/api/locations')).json(); for (const l of locs) { const o = document.createElement('option'); o.value = l.path; o.textContent = `${l.label}  ·  ${l.path}`; sel.appendChild(o); } } catch {}
  openModalById('exportModal');
}

// ---------- resizable panels ----------
// RESIZABLE PANELS: read/write the CSS custom properties that drive the layout grids
// (#app grid rows use --tl-h; the .mid columns use --side-w / --right-w). Each splitter
// is on a specific edge, so the drag direction that GROWS its panel differs:
//   #splitSide      — side panel's RIGHT edge  → drag right grows it (startW + dx)
//   #splitRight     — right panel's LEFT edge  → drag left  grows it (startW - dx)
//   #splitTimeline  — timeline's TOP edge      → drag up    grows it (startH - dy)
// Values are clamped and persisted to localStorage, then restored on load. All purely
// editor chrome — never touches the IR / render path.
const PANEL_CLAMP = { side: [150, 460], right: [240, 520], tl: [160, 640] } as const;
const PANEL_KEYS = { side: 'vgp.sideW', right: 'vgp.rightW', tl: 'vgp.tlH' } as const;
const PANEL_VARS = { side: '--side-w', right: '--right-w', tl: '--tl-h' } as const;
function setPanelVar(which: 'side' | 'right' | 'tl', px: number, persist = true) {
  const [lo, hi] = PANEL_CLAMP[which];
  // #12: also cap to a fraction of the viewport so a persisted size can't crush the
  // preview on a smaller window (inline vars override the CSS @media fallbacks).
  const vpMax = which === 'tl' ? Math.max(lo, window.innerHeight - 200) : Math.max(lo, Math.round(window.innerWidth * 0.42));
  const v = Math.round(Math.max(lo, Math.min(hi, vpMax, px)));
  document.getElementById('app')!.style.setProperty(PANEL_VARS[which], v + 'px');
  if (persist) { try { localStorage.setItem(PANEL_KEYS[which], String(v)); } catch {} }
  return v;
}
// restore any persisted panel sizes onto #app before first paint
function restorePanelSizes() {
  (['side', 'right', 'tl'] as const).forEach((which) => {
    let stored = NaN; try { stored = parseFloat(localStorage.getItem(PANEL_KEYS[which]) || ''); } catch {}
    if (isFinite(stored) && stored > 0) setPanelVar(which, stored, false);
  });
}
// #12: re-apply panel sizes through the viewport-aware clamp on window resize so a
// too-large persisted panel shrinks to fit a smaller window instead of crushing the preview.
function reclampPanels() {
  const app = document.getElementById('app')!;
  (['side', 'right', 'tl'] as const).forEach((w) => { const cur = parseFloat(getComputedStyle(app).getPropertyValue(PANEL_VARS[w])) || 0; if (cur > 0) setPanelVar(w, cur, false); });
}
// current pixel width/height a var resolves to on #app (falls back to the measured
// panel box when the var is unset, so the first drag grows from the real size).
function curPanelPx(which: 'side' | 'right' | 'tl', fallbackEl: HTMLElement | null): number {
  const raw = getComputedStyle(document.getElementById('app')!).getPropertyValue(PANEL_VARS[which]).trim();
  const n = parseFloat(raw); if (isFinite(n) && n > 0) return n;
  if (fallbackEl) { const r = fallbackEl.getBoundingClientRect(); return which === 'tl' ? r.height : r.width; }
  return PANEL_CLAMP[which][0];
}
function initSplitters() {
  const wire = (id: string, which: 'side' | 'right' | 'tl', axis: 'x' | 'y', sign: 1 | -1, panelSel: string) => {
    const sp = document.getElementById(id); if (!sp) return; // markup agent owns the element
    sp.addEventListener('mousedown', (e: MouseEvent) => {
      if (e.button !== 0) return; e.preventDefault();
      const panelEl = document.querySelector(panelSel) as HTMLElement | null;
      const start = axis === 'x' ? e.clientX : e.clientY;
      const base = curPanelPx(which, panelEl);
      sp.classList.add('dragging');
      const prevUserSelect = document.body.style.userSelect; document.body.style.userSelect = 'none';
      const mv = (ev: MouseEvent) => {
        const delta = (axis === 'x' ? ev.clientX : ev.clientY) - start;
        setPanelVar(which, base + sign * delta);
        fit(); // any panel resize changes the center stage box — refit the preview live
      };
      const up = () => {
        window.removeEventListener('mousemove', mv); window.removeEventListener('mouseup', up); window.removeEventListener('blur', up);
        sp.classList.remove('dragging'); document.body.style.userSelect = prevUserSelect;
        fit(); buildTimeline(); // final reflow: preview scale + ruler/clip widths against the new sizes
      };
      window.addEventListener('mousemove', mv); window.addEventListener('mouseup', up); window.addEventListener('blur', up, { once: true });
    });
  };
  wire('splitSide', 'side', 'x', 1, '.side');
  wire('splitRight', 'right', 'x', -1, '.right');
  wire('splitTimeline', 'tl', 'y', -1, '.timeline');
}

// ---------- modal focus management ----------
// MODAL focus-trap + Esc for #openModal / #projModal. On open: remember the opener,
// focus the first control, and install a keydown trap (Esc closes; Tab cycles within
// the modal). On close: remove the trap and restore focus to the opener. The .show
// class is the open signal (added/removed elsewhere); these helpers wrap that.
let modalOpener: HTMLElement | null = null;
let modalTrapEl: HTMLElement | null = null;
function focusablesIn(root: HTMLElement): HTMLElement[] {
  const sel = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
  return Array.from(root.querySelectorAll<HTMLElement>(sel)).filter((e) => e.offsetParent !== null || e === document.activeElement);
}
function onModalKey(ev: KeyboardEvent) {
  if (!modalTrapEl) return;
  if (ev.key === 'Escape') { ev.preventDefault(); closeModalById(modalTrapEl.id); return; }
  if (ev.key !== 'Tab') return;
  const items = focusablesIn(modalTrapEl); if (!items.length) { ev.preventDefault(); return; }
  const first = items[0], last = items[items.length - 1]; const active = document.activeElement as HTMLElement;
  if (ev.shiftKey) { if (active === first || !modalTrapEl.contains(active)) { ev.preventDefault(); last.focus(); } }
  else { if (active === last || !modalTrapEl.contains(active)) { ev.preventDefault(); first.focus(); } }
}
function openModalById(id: string) {
  const m = document.getElementById(id); if (!m) return;
  modalOpener = (document.activeElement as HTMLElement) ?? null;
  m.classList.add('show');
  modalTrapEl = m; window.addEventListener('keydown', onModalKey, true);
  // focus the first control inside the dialog surface on open
  const inner = (m.querySelector('.modal') as HTMLElement) ?? m;
  const items = focusablesIn(inner); (items[0] ?? inner).focus?.();
}
function closeModalById(id: string) {
  const m = document.getElementById(id); if (!m) return;
  m.classList.remove('show');
  if (modalTrapEl === m) { window.removeEventListener('keydown', onModalKey, true); modalTrapEl = null; }
  // restore focus to whatever opened the modal
  modalOpener?.focus?.(); modalOpener = null;
}

// ---------- init ----------
async function init() {
  // restore persisted resizable-panel sizes onto #app before the first layout so the
  // grid is sized correctly from the very first paint (RESIZABLE PANELS).
  restorePanelSizes();
  // static icons
  $('fileIcon').innerHTML = icon('file'); $('expIcon').innerHTML = icon('download'); // logo is the inline animated SVG
  $('i-text').innerHTML = icon('text'); $('i-shape').innerHTML = icon('shape'); $('i-3d').innerHTML = icon('cube'); $('i-up').innerHTML = icon('upload');
  $('i-props').innerHTML = icon('sliders'); $('i-anim').innerHTML = icon('spark'); $('i-line').innerHTML = icon('line');
  $('i-addscene').innerHTML = icon('plus'); $('i-dupscene').innerHTML = icon('copy');
  $('i-undo').innerHTML = icon('undo'); $('i-redo').innerHTML = icon('redo'); $('i-split').innerHTML = icon('split'); $('i-dup').innerHTML = icon('copy'); $('i-del').innerHTML = icon('trash'); $('i-fit').innerHTML = icon('fit');
  $('tpStart').innerHTML = icon('start'); $('tpBack').innerHTML = icon('back'); $('tpFwd').innerHTML = icon('fwd'); $('tpLoop').innerHTML = icon('loop'); setPlayIcon();
  buildFileMenu();
  // SKELETON: show loading placeholders in the right (props) panel and the timeline
  // while the composition loads, mounts and the first build runs; cleared below once
  // buildTimeline()/renderRight() have populated them.
  $('rightBody').classList.add('loading'); $('tlScroll').classList.add('loading');

  const data = await (await fetch('/api/composition')).json();
  S.ir = data.ir; S.assetBase = data.assetBase; S.lastSyncJson = JSON.stringify(S.ir);
  S.history = [S.lastSyncJson]; S.histIndex = 0;
  captureSceneBase(); S.ir.scenes.forEach((_: any, i: number) => normalizeZ(i)); derive(); autoFit(); mountPreview(); await VGP.ready();
  buildTimeline(); renderRight(); updateTime();
  $('rightBody').classList.remove('loading'); $('tlScroll').classList.remove('loading'); // first build done — drop skeletons
  await loadAssets();
  // refresh audio-lane widths once durations load — DEBOUNCED so N tracks loading metadata
  // don't each trigger a full buildTimeline() (19 rebuilds in a burst on a big project).
  let audioReadyTimer: any;
  (window as any).__vgpAudioReady = () => { clearTimeout(audioReadyTimer); audioReadyTimer = setTimeout(() => buildTimeline(), 150); };
  requestAnimationFrame((t) => { last = t; loop(t); });

  // transport
  $('tpPlay').onclick = togglePlay; $('tpStart').onclick = () => seekTo(0); $('tpBack').onclick = () => seekTo(S.playhead - 1); $('tpFwd').onclick = () => seekTo(S.playhead + 1);
  $('tpLoop').onclick = () => { S.loop = !S.loop; $('tpLoop').classList.toggle('on', S.loop); ($('tpLoop') as HTMLElement).style.opacity = S.loop ? '1' : '.5'; };
  // preview seek bar: mousedown + drag scrubs (same window-listener pattern as the
  // clip/trim handlers). fraction = clamp01((clientX - barLeft) / barWidth), seek to
  // fraction * effectiveTotal(). Live-updates while dragging; clears on mouseup.
  const seekbar = $('seekbar');
  const seekFromX = (clientX: number) => { const r = seekbar.getBoundingClientRect(); const frac = clamp01((clientX - r.left) / Math.max(1, r.width)); seekTo(frac * effectiveTotal(), false); };
  seekbar.addEventListener('mousedown', (e: MouseEvent) => {
    if (e.button !== 0) return; e.preventDefault();
    const wasPlaying = S.playing; if (wasPlaying) togglePlay(); // pause while scrubbing so loop() can't fight the drag
    seekbar.classList.add('dragging'); seekFromX(e.clientX);
    const mv = (ev: MouseEvent) => seekFromX(ev.clientX);
    const up = () => { window.removeEventListener('mousemove', mv); window.removeEventListener('mouseup', up); window.removeEventListener('blur', up); seekbar.classList.remove('dragging'); if (wasPlaying) togglePlay(); };
    window.addEventListener('mousemove', mv); window.addEventListener('mouseup', up); window.addEventListener('blur', up);
  });
  // buffering: show the loading stripe until the first VGP.ready() resolves after
  // mount, then reconcile against live <video> readiness. Subsequent buffering (e.g.
  // seeking into an unbuffered region) is picked up by updateSeekbar() per-seek.
  updateSeekbar(true); VGP.ready().then(() => updateSeekbar()).catch(() => updateSeekbar());

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
  $('btnDel').onclick = () => { if (S.selected || S.multi.length) deleteSelection(); }; // FEATURE 1: multi-aware
  initSelHandles();
  initSplitters(); // RESIZABLE PANELS: attach the splitter drag handlers

  // file menu toggle + outside click
  $('fileBtn').onclick = (e) => { e.stopPropagation(); menuOpen = !menuOpen; $('fileMenu').classList.toggle('open', menuOpen); };
  document.addEventListener('click', closeMenu);
  $('export').onclick = () => openExportMenu();
  $('renderCancel').onclick = cancelRender;
  // post-render actions: open the finished file in the OS, or close the dialog
  $('renderOpen').onclick = async () => { if (lastRenderPath) { try { const r = await (await fetch('/api/reveal', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ path: lastRenderPath }) })).json(); if (!r.ok) showToast('Could not open: ' + (r.error || 'file not found')); } catch {} } showRender(false); };
  $('renderClose').onclick = () => showRender(false);
  // export dialog: resolution picker, cancel, backdrop-close, and Export
  $('exportCancel').onclick = () => closeModalById('exportModal');
  $('exportModal').addEventListener('mousedown', (e) => { if (e.target === $('exportModal')) closeModalById('exportModal'); });
  // Browse… — native folder picker so the user can save anywhere (not just the presets)
  $('exportBrowse').onclick = async () => {
    try {
      const r = await (await fetch('/api/pick-folder')).json();
      if (r.ok && r.path) {
        const sel = $('exportDir') as HTMLSelectElement;
        let o = [...sel.options].find((x) => x.value === r.path);
        if (!o) { o = document.createElement('option'); o.value = r.path; o.textContent = 'Chosen  ·  ' + r.path; sel.insertBefore(o, sel.firstChild); }
        sel.value = r.path;
      } else if (r.error) showToast(r.error);
    } catch {}
  };
  $('exportRes').querySelectorAll('.res-opt').forEach((b) => ((b as HTMLElement).onclick = () => { $('exportRes').querySelectorAll('.res-opt').forEach((x) => x.classList.remove('on')); b.classList.add('on'); }));
  $('exportGo').onclick = () => {
    const h = Number(($('exportRes').querySelector('.res-opt.on') as HTMLElement)?.dataset.h) || 1080;
    const name = ($('exportName') as HTMLInputElement).value.trim() || 'render';
    const dir = ($('exportDir') as HTMLSelectElement).value || '';
    closeModalById('exportModal'); runExport({ height: h, name, dir });
  };
  $('openClose').onclick = () => closeModalById('openModal');
  // close the Open modal on backdrop click too (parity with the project modal).
  $('openModal').addEventListener('mousedown', (e) => { if (e.target === $('openModal')) closeModalById('openModal'); });
  $('newModal').addEventListener('mousedown', (e) => { if (e.target === $('newModal')) closeModalById('newModal'); }); // #28: backdrop-close parity
  $('importBtn').onclick = () => { const inp = document.createElement('input'); inp.type = 'file'; inp.accept = '.json'; inp.onchange = () => { const f = inp.files?.[0]; if (!f) return; const rd = new FileReader(); rd.onload = async () => { try { const parsed = JSON.parse(String(rd.result)); const nm = (f.name || 'imported').replace(/\.json$/i, ''); const r = await (await fetch('/api/new', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ name: nm, ir: parsed }) })).json(); if (r.ok) { S.assetBase = r.assetBase; setDoc(r.ir); closeModalById('openModal'); showToast(`Imported as ${r.file}`); } else showToast('Import failed: ' + (r.error || 'invalid JSON')); } catch (e: any) { showToast('Import failed: ' + e.message); } }; rd.readAsText(f); }; inp.click(); };
  $('newCreate').onclick = createNewFile; $('newCancel').onclick = () => closeModalById('newModal'); $('newName').onkeydown = (e: KeyboardEvent) => { if (e.key === 'Enter') createNewFile(); };

  // add-layer
  $('addText').onclick = () => addLayerAtPlayhead(newText()); $('addShape').onclick = () => addLayerAtPlayhead(newShape()); $('addLine').onclick = () => addLayerAtPlayhead(newLine()); $('add3D').onclick = () => addLayerAtPlayhead(new3D());
  $('addScene').onclick = () => addScene(); $('dupScene').onclick = () => duplicateScene(sceneAt(S.playhead));

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
    // recompute time LIVE (no cached rect) so the scrub stays correct while the
    // timeline auto-scrolls horizontally under the cursor.
    const seekFrom = (clientX: number) => seekTo(timeAtClientX(clientX), false); // scrub: don't auto-follow (autoTick owns edge scroll)
    let lastX = e.clientX; let autoT: any = null;
    // when the cursor nears the left/right edge of the timeline, auto-scroll so the
    // playhead can keep scrubbing past the visible edge (both directions).
    const autoTick = () => {
      const r = tl.getBoundingClientRect(); const EDGE = 36, max = tl.scrollWidth - tl.clientWidth;
      let d = 0;
      if (lastX < r.left + LABELW + EDGE) d = -Math.ceil((r.left + LABELW + EDGE - lastX) / 3);
      else if (lastX > r.right - EDGE) d = Math.ceil((lastX - (r.right - EDGE)) / 3);
      const next = Math.max(0, Math.min(max, tl.scrollLeft + d));
      if (d && next !== tl.scrollLeft) { tl.scrollLeft = next; seekFrom(lastX); }
    };
    seekFrom(e.clientX);
    const mv = (ev: MouseEvent) => { lastX = ev.clientX; seekFrom(ev.clientX); if (!autoT) autoT = setInterval(autoTick, 16); };
    const up = () => { window.removeEventListener('mousemove', mv); window.removeEventListener('mouseup', up); window.removeEventListener('blur', up); if (autoT) { clearInterval(autoT); autoT = null; } };
    window.addEventListener('mousemove', mv); window.addEventListener('mouseup', up); window.addEventListener('blur', up, { once: true });
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
      if (L.type === 'overlay' || L.type === 'fx' || (L as any).hidden) continue; // skip adjustment/control AND hidden layers — can't grab the invisible
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
    // FEATURE 1: shift/meta/ctrl click on canvas — add/toggle this layer in the multi-set
    // and STOP (selection gesture only; don't start a move-drag).
    if (e.shiftKey || e.metaKey || e.ctrlKey) { toggleSelect(si, hit); return; }
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

  // FEATURE 3: right-click context menu in the preview — Group / Delete. Hit-test the
  // layer under the cursor; if it isn't part of the current selection, single-select it
  // first (so right-click on a layer targets it), then open the menu if anything is
  // selected. Shares the same hit-test math as the canvas mousedown handler above.
  stage.addEventListener('contextmenu', (e: MouseEvent) => {
    e.preventDefault();
    if (!S.ir) return;
    const rect = stage.getBoundingClientRect(); const sc = S.scale || 1;
    const cx = (e.clientX - rect.left) / sc, cy = (e.clientY - rect.top) / sc;
    const si = sceneAt(S.playhead); const scene = S.ir.scenes[si]; if (!scene) return; const localT = S.playhead - S.offsets[si];
    let hit = -1;
    for (let li = scene.layers.length - 1; li >= 0; li--) {
      const L = scene.layers[li]; const st = L.start ?? 0, du = L.duration ?? scene.duration;
      if (L.type === 'overlay' || L.type === 'fx' || (L as any).hidden) continue;
      if (localT < st - 0.01 || localT > st + du + 0.01) continue;
      const r = L.rect ?? { x: 0, y: 0, w: S.ir.width, h: S.ir.height };
      const d = renderedDelta(L, si);
      const ccx = r.x + r.w / 2 + d.x, ccy = r.y + r.h / 2 + d.y;
      const rot = -(d.rotate) * Math.PI / 180;
      const dxp = cx - ccx, dyp = cy - ccy;
      const lx = dxp * Math.cos(rot) - dyp * Math.sin(rot), ly = dxp * Math.sin(rot) + dyp * Math.cos(rot);
      if (Math.abs(lx) <= r.w * d.scale / 2 && Math.abs(ly) <= r.h * d.scale / 2) { hit = li; break; }
    }
    // right-clicking a layer that isn't already selected targets just that layer.
    if (hit >= 0 && !isSelected(si, hit)) select(si, hit);
    if (!S.selected && !S.multi.length) return; // nothing selected → no menu
    showContextMenu(e.clientX, e.clientY);
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
    if ((e.key === 'Delete' || e.key === 'Backspace') && (S.selected || S.multi.length)) { deleteSelection(); return; } // FEATURE 1: multi-aware
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
  let resizeT: any; window.addEventListener('resize', () => { reclampPanels(); fit(); clearTimeout(resizeT); resizeT = setTimeout(() => buildTimeline(), 120); });

  // browsers block audio until a user gesture — kick playback on first interaction
  const kick = () => { if (S.playing) VGP.seek(S.playhead, { playing: true }); window.removeEventListener('pointerdown', kick); };
  window.addEventListener('pointerdown', kick);

  // live SSE: doc edits (agent) + render progress
  const es = new EventSource('/api/events');
  es.onmessage = (ev) => {
    let m: any; try { m = JSON.parse(ev.data); } catch { return; }
    if (m.t === 'doc') { const j = JSON.stringify(m.ir); if (j === S.lastSyncJson) return; clearTimeout(saveTimer); S.ir = m.ir; S.lastSyncJson = j; S.multi = []; pushHistory(j); captureSceneBase(); S.ir.scenes.forEach((_: any, i: number) => normalizeZ(i)); derive(); mountPreview(); buildTimeline(); renderRight(); setDot('edited', 'agent edit ✦'); setTimeout(() => setDot('saved', 'synced'), 1400); }
    if (m.t === 'render') {
      showRender(true);
      if (m.state === 'rendering') { $('renderFill').style.width = m.pct + '%'; $('renderPct').textContent = m.pct + '%'; $('renderLabel').textContent = `Rendering frame ${m.done}/${m.total}`; }
      else if (m.state === 'cancelled') { showRender(false); }
      else if (m.state === 'done') { lastRenderPath = m.path || ''; $('renderFill').style.width = '100%'; $('renderPct').textContent = '100%'; $('renderLabel').textContent = '✓ Export complete'; ($('renderCancel') as HTMLElement).style.display = 'none'; ($('renderActions') as HTMLElement).style.display = 'flex'; }
      else if (m.state === 'error') { const msg = m.error ? String(m.error).trim().split('\n').filter(Boolean).pop() : ''; $('renderLabel').textContent = '✕ ' + (msg || 'Render failed').slice(0, 110); console.error('[render] export failed:\n', m.error); setTimeout(() => showRender(false), 7000); }
    }
  };
}
init();
