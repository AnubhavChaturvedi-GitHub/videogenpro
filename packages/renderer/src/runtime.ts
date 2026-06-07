// Browser-side runtime. Bundled by esbuild into dist/runtime.js (IIFE -> window.VGP).
// Consumes the IR + preset library and exposes a DETERMINISTIC seek(time).
// Same engine will back the live editor preview later.
import * as THREE from 'three';
import {
  getPreset, resolveParams, ease, clamp01, compositionDuration,
} from '../../core/src/index';
import type {
  Composition, Scene, Layer, PresetInstance, Keyframe,
} from '../../core/src/index';
import type { StyleDelta } from '../../core/src/preset';

type SceneNode = { el: HTMLDivElement; scene: Scene; layers: LayerNode[]; offset: number };
type LayerNode = {
  el: HTMLDivElement;          // the transformed element
  spans?: HTMLSpanElement[];   // for split text presets
  layer: Layer;
  three?: ThreeHandle;
  video?: HTMLVideoElement;
  media?: HTMLImageElement | HTMLVideoElement; // the img/video element (cropped via clip-path)
  fxLayers?: any[];            // fx control-layers that target THIS layer (drive effects onto it)
};
type ThreeHandle = { render: (t: number, props: Record<string, number>) => void; dispose?: () => void };

let comp: Composition;
let sceneNodes: SceneNode[] = [];
let transOverEl: HTMLDivElement | null = null; // full-frame transition overlay (colour wipe)
let stage: HTMLDivElement;
let assetBase: string | undefined;
let audioEls: { el: HTMLAudioElement; track: any }[] = [];

const isAbsUrl = (s: string) => /^(https?:|data:|file:|blob:)/.test(s);
const resolveSrc = (src: string) => (assetBase && !isAbsUrl(src) ? new URL(src, assetBase).href : src);

// Audio-aware total duration. compositionDuration() sums ONLY scene durations and
// ignores audio[], so a narration tail that runs past the last scene would otherwise
// be clamped away in seek() and never play/scrub. The editor's playhead deliberately
// runs to this effective total (effectiveTotal()) to keep those tails reachable, so the
// runtime must clamp to the same value. Each track's end = start + (track.duration or,
// if known, the loaded element duration minus trimStart). This stays a pure function of
// the IR + loaded metadata (no wall-clock, no randomness), preserving determinism.
function effectiveDuration(c: Composition): number {
  let total = compositionDuration(c);
  for (const a of audioEls) {
    const track = a.track;
    if (!track) continue;
    const start = track.start ?? 0;
    const trimStart = track.trimStart ?? 0;
    let playDur = track.duration;
    if (playDur == null) {
      const meta = a.el.duration;
      playDur = isFinite(meta) ? Math.max(0, meta - trimStart) : 0;
    }
    total = Math.max(total, start + playDur);
  }
  return total;
}

// ---- Three.js demo scenes (registered by id). Deterministic: driven by time. ----
const THREE_SCENES: Record<string, (canvas: HTMLCanvasElement, w: number, h: number) => ThreeHandle> = {
  particles: (canvas, w, h) => {
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setSize(w, h, false);
    const scene = new THREE.Scene();
    const cam = new THREE.PerspectiveCamera(60, w / h, 0.1, 100);
    cam.position.z = 6;
    const N = 1200;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      pos[i * 3] = (Math.sin(i * 12.9898) * 43758.5453 % 1) * 10 - 5;
      pos[i * 3 + 1] = (Math.sin(i * 78.233) * 43758.5453 % 1) * 10 - 5;
      pos[i * 3 + 2] = (Math.sin(i * 37.719) * 43758.5453 % 1) * 10 - 5;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({ color: 0x66ccff, size: 0.06 });
    const pts = new THREE.Points(geo, mat);
    scene.add(pts);
    return {
      render: (t, props) => {
        pts.rotation.y = t * (props.speed ?? 0.3);
        pts.rotation.x = t * 0.12;
        renderer.render(scene, cam);
      },
      dispose: () => {
        geo.dispose(); mat.dispose();
        renderer.dispose();
        renderer.forceContextLoss?.();
      },
    };
  },
};

// ---- helpers ----
const px = (n: number) => `${n}px`;

// Overlay adjustment-layers render through the SINGLE source of truth: the core
// overlayPresets ('overlay.<effect>') apply() functions. They already return
// css.filter / opacity / css.background / css.boxShadow tagged continuous:true.
//
// Every overlay must affect the content painted BENEATH it. There are two
// well-defined ways an overlay does this, and the runtime/schema/editor must agree on
// which presets are valid and which subclass each belongs to:
//
//   (1) BACKDROP-FILTER overlays (blur, B&W, etc.): the preset returns css.filter,
//       which is remapped to `backdrop-filter` (capital-W -webkit- fallback) so it
//       FILTERS the backdrop — the content below is sampled and transformed. This is
//       the literal "adjustment layer" mechanism.
//
//   (2) PAINT-ON-TOP overlays (fade, vignette): the preset returns css.background
//       (rgba) or css.boxShadow (inset), which are applied to the overlay's OWN
//       full-frame box (buildLayer sizes it to the scene/rect bounds; it is
//       position:absolute, pointerEvents:none, sitting above content by z-index).
//       These do not sample the backdrop — they composite a tint/darkening OVER it.
//       This is a legitimate, deterministic "affects everything below" mechanism, just
//       a different subclass from backdrop-filter; it is NOT a filter of the backdrop.
//
// Both subclasses are valid; the distinction is intentional and must be mirrored in the
// overlay schema/editor (fade/vignette are paint-on-top, not backdrop-filter) so that
// validation never rejects them and the "affects everything below" invariant is
// understood per-subclass rather than assumed uniform.
// Result: adding/changing an effect in overlay.ts is enough — no duplication.
//
// `amount` may be keyframed (cast: not in the core Keyable union yet) so the effect
// strength can be ramped over the layer like any other timeline-driven property.
// Determinism: output is a pure function of `amount`, which itself comes from the
// keyframes/params (a pure function of the seek time) — no wall-clock, no randomness.
function overlayStyle(layer: Layer & { type: 'overlay' }, layerLocalT: number, layerDur: number): { css: Record<string, string>; opacity: number } {
  const preset = getPreset(`overlay.${layer.effect}`);
  if (!preset || !preset.apply) {
    // Unknown effect: warn (don't silently no-op) and apply nothing.
    console.warn(`[VGP] unknown overlay effect "${layer.effect}" — no preset overlay.${layer.effect} found`);
    return { css: {}, opacity: 1 };
  }
  // amount: keyframed value (if present) wins over the static param; both fall back
  // to the preset's default via resolveParams.
  const kfs = (layer.keyframes as any)?.amount as Keyframe[] | undefined;
  const params = resolveParams(preset, layer.params);
  if (kfs && kfs.length) params.amount = keyframeValue(kfs, layerLocalT, params.amount);
  const p = presetProgress({ id: preset.id, params }, layerLocalT, layerDur, !!preset.continuous);
  const d = preset.apply(p, params, { index: 0, count: 1, time: layerLocalT, dur: layerDur });
  const css: Record<string, string> = {};
  if (d.css) {
    for (const [k, v] of Object.entries(d.css)) {
      if (k === 'filter') { css.backdropFilter = v; (css as any).WebkitBackdropFilter = v; } // adjustment layer: filter the backdrop (capital W: CSSOM key for -webkit-backdrop-filter)
      else css[k] = v;
    }
  }
  return { css, opacity: d.opacity ?? 1 };
}

// Inject reusable SVG filters (sketch / edge-detect) once per document.
function ensureSvgFilters() {
  if (document.getElementById('vgp-svg-filters')) return;
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.id = 'vgp-svg-filters';
  svg.setAttribute('width', '0'); svg.setAttribute('height', '0');
  svg.style.position = 'absolute';
  svg.innerHTML = `<defs><filter id="vgp-sketch" color-interpolation-filters="sRGB">
    <feColorMatrix type="matrix" values="0.33 0.33 0.33 0 0  0.33 0.33 0.33 0 0  0.33 0.33 0.33 0 0  0 0 0 1 0"/>
    <feConvolveMatrix order="3" preserveAlpha="true" kernelMatrix="0 -1 0 -1 4 -1 0 -1 0"/>
    <feComponentTransfer><feFuncR type="table" tableValues="1 0"/><feFuncG type="table" tableValues="1 0"/><feFuncB type="table" tableValues="1 0"/></feComponentTransfer>
  </filter>
  <filter id="vgp-grain" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">
    <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="7" stitchTiles="stitch" result="noise"/>
    <feColorMatrix in="noise" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.18 0" result="grainAlpha"/>
    <feComposite in="grainAlpha" in2="SourceGraphic" operator="over"/>
  </filter>
  <filter id="vgp-grain-heavy" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">
    <feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="3" seed="19" stitchTiles="stitch" result="noise"/>
    <feColorMatrix in="noise" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.38 0" result="grainAlpha"/>
    <feComposite in="grainAlpha" in2="SourceGraphic" operator="over"/>
  </filter>
  <filter id="vgp-rgb-split" x="-10%" y="-10%" width="120%" height="120%" color-interpolation-filters="sRGB">
    <feOffset in="SourceGraphic" dx="4" dy="0" result="r"/>
    <feColorMatrix in="r" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="rOnly"/>
    <feOffset in="SourceGraphic" dx="-4" dy="0" result="b"/>
    <feColorMatrix in="b" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="bOnly"/>
    <feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="gOnly"/>
    <feBlend in="rOnly" in2="gOnly" mode="screen" result="rg"/>
    <feBlend in="rg" in2="bOnly" mode="screen"/>
  </filter></defs>`;
  document.body.appendChild(svg);
}

function sceneOffsets(c: Composition): number[] {
  const offs: number[] = [];
  let acc = 0;
  for (const s of c.scenes) { offs.push(acc); acc += s.duration; }
  return offs;
}

// Easing semantics: each [a,b] segment is eased by b.easing — i.e. easing belongs to
// the INCOMING segment that ENDS at a keyframe. Consequently the FIRST keyframe's
// easing (index 0) is intentionally inert: no segment ever ends at index 0, so there
// is nothing for it to govern. The editor's easing selector must hide/disable the
// control on the first keyframe of a property (it is a no-op there); every other
// keyframe's easing drives the segment arriving INTO it. Pure function of t -> deterministic.
function keyframeValue(kfs: Keyframe[] | undefined, t: number, fallback: number): number {
  if (!kfs || kfs.length === 0) return fallback;
  if (t <= kfs[0].t) return kfs[0].value;
  if (t >= kfs[kfs.length - 1].t) return kfs[kfs.length - 1].value;
  for (let i = 0; i < kfs.length - 1; i++) {
    const a = kfs[i], b = kfs[i + 1];
    if (t >= a.t && t <= b.t) {
      const local = (t - a.t) / (b.t - a.t);
      const e = ease(b.easing as any, local); // b.easing: easing of the segment ENDING at b
      return a.value + (b.value - a.value) * e;
    }
  }
  return fallback;
}

const emptyDelta = (): Required<Pick<StyleDelta, 'x' | 'y' | 'scale' | 'rotate' | 'opacity' | 'blur' | 'brightness'>> & { clipInset?: [number, number, number, number]; css: Record<string, string> } => ({
  x: 0, y: 0, scale: 1, rotate: 0, opacity: 1, blur: 0, brightness: 1, css: {},
});

function combine(into: ReturnType<typeof emptyDelta>, d: StyleDelta) {
  if (d.x) into.x += d.x;
  if (d.y) into.y += d.y;
  if (d.scale !== undefined) into.scale *= d.scale;
  if (d.scaleX !== undefined) into.scale *= d.scaleX;
  if (d.scaleY !== undefined) into.scale *= d.scaleY;
  if (d.rotate) into.rotate += d.rotate;
  if (d.opacity !== undefined) into.opacity *= d.opacity;
  if (d.blur) into.blur += d.blur;
  if (d.brightness !== undefined) into.brightness *= d.brightness;
  if (d.clipInset) into.clipInset = d.clipInset;
  if (d.css) Object.assign(into.css, d.css);
}

// Clear css keys that were applied on the PREVIOUS frame but are absent this frame,
// so scrubbing backward produces the same result as forward (determinism).
// `managed` are keys this function always sets explicitly (transform/filter/clipPath/opacity)
// and so must never be cleared via the raw-css path.
function clearStaleCss(el: HTMLElement, applied: Set<string>, managed: Set<string>) {
  const prev: Set<string> | undefined = (el as any).__vgpCss;
  if (prev) {
    for (const k of prev) {
      if (!applied.has(k) && !managed.has(k)) (el.style as any)[k] = '';
    }
  }
  (el as any).__vgpCss = applied;
}

// Full-frame scene containers are inset:0 (already filling the frame), so they
// must NOT get the -50% centering that layer boxes use.
function applySceneDelta(el: HTMLElement, d: ReturnType<typeof emptyDelta>) {
  const t = `translate(${px(d.x)}, ${px(d.y)}) scale(${d.scale}) rotate(${d.rotate}deg)`;
  el.style.transformOrigin = 'center center';
  el.style.transform = d.css.transform ? `${t} ${d.css.transform}` : t;
  el.style.opacity = String(clamp01(d.opacity));
  const filters: string[] = [];
  if (d.blur > 0.01) filters.push(`blur(${px(d.blur)})`);
  if (Math.abs(d.brightness - 1) > 0.01) filters.push(`brightness(${d.brightness})`);
  el.style.filter = d.css.filter ?? filters.join(' ');
  el.style.clipPath = d.clipInset
    ? `inset(${d.clipInset[0]}% ${d.clipInset[1]}% ${d.clipInset[2]}% ${d.clipInset[3]}%)`
    : (d.css.clipPath ?? '');
  const applied = new Set<string>();
  for (const [k, v] of Object.entries(d.css)) {
    if (k !== 'transform' && k !== 'clipPath' && k !== 'filter') { (el.style as any)[k] = v; applied.add(k); }
  }
  clearStaleCss(el, applied, new Set(['transform', 'clipPath', 'filter', 'opacity', 'transformOrigin']));
}

// ── Match & Move + transition-overlay helpers ──────────────────────────────
type Box = { cx: number; cy: number; w: number; h: number; rot: number };
// authored "home" box (rect + transform) in comp px — the morph endpoints.
function homeBox(layer: any): Box {
  const r = layer.rect ?? { x: 0, y: 0, w: comp.width, h: comp.height };
  const tf = layer.transform ?? {}; const s = tf.scale ?? 1;
  return { cx: r.x + r.w / 2 + (tf.x ?? 0), cy: r.y + r.h / 2 + (tf.y ?? 0), w: r.w * s, h: r.h * s, rot: tf.rotate ?? 0 };
}
const lerpN = (a: number, b: number, e: number) => a + (b - a) * e;
const lerpBox = (a: Box, b: Box, e: number): Box => ({ cx: lerpN(a.cx, b.cx, e), cy: lerpN(a.cy, b.cy, e), w: lerpN(a.w, b.w, e), h: lerpN(a.h, b.h, e), rot: lerpN(a.rot, b.rot, e) });
// pairing key: explicit matchId wins, else same media src / text / shape.
function matchKey(layer: any): string | null {
  if (layer.matchId) return 'id:' + layer.matchId;
  if (layer.type === 'image' || layer.type === 'video') return 'src:' + layer.src;
  if (layer.type === 'text') return 'text:' + String(layer.text ?? '').trim();
  if (layer.type === 'shape') return 'shape:' + layer.shape + ':' + (layer.fill ?? '');
  return null;
}
// pair outgoing(prev) <-> incoming(cur) layers by key (first-come, one-to-one).
function matchPairs(prev: SceneNode, cur: SceneNode): { a: LayerNode; b: LayerNode }[] {
  const pairs: { a: LayerNode; b: LayerNode }[] = []; const used = new Set<LayerNode>();
  for (const b of cur.layers) {
    const k = matchKey(b.layer); if (!k) continue;
    const a = prev.layers.find((p) => !used.has(p) && matchKey(p.layer) === k);
    if (a) { used.add(a); pairs.push({ a, b }); }
  }
  return pairs;
}
// place a layer element at an arbitrary comp-space box (overrides its own transform).
function applyMorph(ln: LayerNode, t: Box, opacity: number) {
  const layer = ln.layer; const r = layer.rect ?? { x: 0, y: 0, w: comp.width, h: comp.height };
  const baseCx = r.x + r.w / 2, baseCy = r.y + r.h / 2; // == the element's left/top anchor
  const S = r.w ? t.w / r.w : 1;
  ln.el.style.display = (layer.type === 'text') ? 'flex' : 'block';
  ln.el.style.transformOrigin = 'center center';
  ln.el.style.transform = `translate(-50%, -50%) translate(${px(t.cx - baseCx)}, ${px(t.cy - baseCy)}) scale(${S}) rotate(${t.rot}deg)`;
  ln.el.style.opacity = String(clamp01(opacity));
  ln.el.style.filter = ''; ln.el.style.clipPath = '';
}
// full-frame transition overlay (e.g. colour wipe). Call with no arg to clear it.
function applyOver(over?: StyleDelta) {
  if (!transOverEl) return;
  if (!over) { transOverEl.style.display = 'none'; transOverEl.style.opacity = '0'; return; }
  const d = emptyDelta(); combine(d, over); transOverEl.style.display = 'block'; applySceneDelta(transOverEl, d);
}

function applyDelta(el: HTMLElement, d: ReturnType<typeof emptyDelta>) {
  const t = `translate(-50%, -50%) translate(${px(d.x)}, ${px(d.y)}) scale(${d.scale}) rotate(${d.rotate}deg)`;
  el.style.transform = d.css.transform ? `${t} ${d.css.transform}` : t;
  el.style.opacity = String(clamp01(d.opacity));
  const filters: string[] = [];
  if (d.blur > 0.01) filters.push(`blur(${px(d.blur)})`);
  if (Math.abs(d.brightness - 1) > 0.01) filters.push(`brightness(${d.brightness})`);
  el.style.filter = d.css.filter ?? filters.join(' ');
  el.style.clipPath = d.clipInset
    ? `inset(${d.clipInset[0]}% ${d.clipInset[1]}% ${d.clipInset[2]}% ${d.clipInset[3]}%)`
    : (d.css.clipPath ?? '');
  const applied = new Set<string>();
  for (const [k, v] of Object.entries(d.css)) {
    if (k !== 'transform' && k !== 'clipPath' && k !== 'filter') { (el.style as any)[k] = v; applied.add(k); }
  }
  clearStaleCss(el, applied, new Set(['transform', 'clipPath', 'filter', 'opacity']));
}

// per-element progress for a preset instance on a layer
function presetProgress(inst: PresetInstance, layerLocalT: number, layerDur: number, continuous: boolean): number {
  if (continuous) return clamp01(layerLocalT / Math.max(0.0001, layerDur));
  const preset = getPreset(inst.id);
  const dur = inst.duration ?? preset?.defaultDuration ?? 0.6;
  if (preset?.fromEnd) {
    // B09: an exit longer than the layer must not pre-fade at t=0; clamp the
    // effective duration to the layer so progress stays 0 until the tail.
    const effDur = Math.min(dur, layerDur);
    return clamp01((layerLocalT - (layerDur - effDur)) / Math.max(0.0001, effDur));
  }
  const start = inst.start ?? 0;
  return clamp01((layerLocalT - start) / Math.max(0.0001, dur));
}

// ---- build DOM ----
function buildLayer(layer: Layer, sceneDur: number, fxLayers: any[] = []): LayerNode {
  const el = document.createElement('div');
  el.style.position = 'absolute';
  el.style.willChange = 'transform, opacity, filter';
  // box
  if (layer.rect) {
    el.style.left = px(layer.rect.x + layer.rect.w / 2);
    el.style.top = px(layer.rect.y + layer.rect.h / 2);
    el.style.width = px(layer.rect.w);
    el.style.height = px(layer.rect.h);
  } else {
    el.style.left = '50%';
    el.style.top = '50%';
    el.style.width = px(comp.width);
    el.style.height = px(comp.height);
  }
  if (layer.zIndex !== undefined) el.style.zIndex = String(layer.zIndex);

  const node: LayerNode = { el, layer, fxLayers };
  // all preset instances that can affect this layer: its own + the fx layers targeting it
  const allInsts = [...(layer.presets ?? []), ...fxLayers.map((f) => ({ id: f.effect, params: f.params }))];

  switch (layer.type) {
    case 'fx': { el.style.display = 'none'; return node; } // control layer — no visual
    case 'text': {
      el.style.display = 'flex';
      el.style.alignItems = 'center';
      el.style.justifyContent = 'center';
      el.style.textAlign = 'center';
      Object.assign(el.style, {
        fontFamily: 'Inter, system-ui, sans-serif', fontSize: '80px', fontWeight: '800', color: '#fff',
      });
      if (layer.style) Object.assign(el.style, layer.style);
      // NOTE: span STRUCTURE (node.spans) is decided ONCE here, at mount, by scanning
      // allInsts (own presets + fx targeting this layer) for any preset with `.split`.
      // It is NOT recomputed on a live param edit (liveEdit -> liveSeek). Therefore any
      // flow that TOGGLES a layer between split and non-split fx (add/remove a split fx)
      // MUST route through structuralEdit -> mountPreview so this remounts and rebuilds
      // spans. Routing a split-fx add/remove through liveEdit instead would leave stale
      // spans (split DOM with no driving preset, or whole-text with no spans to reveal).
      const splitPreset = allInsts.map((p) => getPreset(p.id)).find((p) => p?.split);
      if (splitPreset?.split) {
        const inner = document.createElement('div');
        const units = splitPreset.split === 'char'
          ? [...layer.text].map((c) => (c === ' ' ? ' ' : c))
          : layer.text.split(' ');
        node.spans = units.map((u, i) => {
          const s = document.createElement('span');
          s.textContent = u;
          s.style.display = 'inline-block';
          s.style.whiteSpace = 'pre';
          if (splitPreset.split === 'word' && i < units.length - 1) s.style.marginRight = '0.25em';
          inner.appendChild(s);
          return s;
        });
        el.appendChild(inner);
      } else {
        el.textContent = layer.text;
      }
      break;
    }
    case 'image': {
      const img = document.createElement('img');
      img.src = resolveSrc(layer.src);
      img.style.width = '100%';
      img.style.height = '100%';
      img.style.objectFit = layer.fit ?? 'cover';
      el.appendChild(img);
      node.media = img;
      // smooth crop edits in the EDITOR. Determinism-safe: crop is static per render, so
      // the clip-path never changes between seeks -> the transition never fires during a
      // render; we seed the initial clip-path here so the first seek doesn't animate either.
      img.style.transition = 'clip-path .16s cubic-bezier(.4,0,.2,1)';
      { const c = (layer as any).crop; if (c && (c.t || c.r || c.b || c.l)) img.style.clipPath = `inset(${c.t || 0}% ${c.r || 0}% ${c.b || 0}% ${c.l || 0}%)`; }
      break;
    }
    case 'video': {
      const v = document.createElement('video');
      v.src = resolveSrc(layer.src);
      v.muted = true;
      v.style.width = '100%';
      v.style.height = '100%';
      v.style.objectFit = layer.fit ?? 'cover';
      el.appendChild(v);
      node.video = v; node.media = v;
      v.style.transition = 'clip-path .16s cubic-bezier(.4,0,.2,1)'; // smooth crop edits (editor); static crop never transitions in render
      { const c = (layer as any).crop; if (c && (c.t || c.r || c.b || c.l)) v.style.clipPath = `inset(${c.t || 0}% ${c.r || 0}% ${c.b || 0}% ${c.l || 0}%)`; }
      break;
    }
    case 'html': {
      el.innerHTML = layer.html;
      break;
    }
    case 'three': {
      const canvas = document.createElement('canvas');
      const w = layer.rect?.w ?? comp.width;
      const h = layer.rect?.h ?? comp.height;
      canvas.width = w; canvas.height = h;
      canvas.style.width = '100%'; canvas.style.height = '100%';
      el.appendChild(canvas);
      const factory = THREE_SCENES[layer.scene];
      if (factory) node.three = factory(canvas, w, h);
      break;
    }
    case 'shape': {
      el.style.background = layer.fill ?? '#fff';
      if (layer.shape === 'circle') el.style.borderRadius = '50%';
      else if (layer.shape === 'line') el.style.borderRadius = '999px';
      else if (layer.radius) el.style.borderRadius = px(layer.radius);
      break;
    }
    case 'overlay': {
      // adjustment layer: affects everything painted beneath it via backdrop-filter.
      // The effect is NOT baked in here — renderLayer() re-derives it from the core
      // overlay preset each frame so the strength can animate / be keyframed and live
      // edits take effect without a remount. (Initial paint happens on the first seek.)
      el.style.pointerEvents = 'none';
      break;
    }
  }
  return node;
}

// ---- public API ----
function mount(c: Composition, opts?: { assetBase?: string }) {
  comp = c;
  assetBase = opts?.assetBase;
  (window as any).__vgpMounts = ((window as any).__vgpMounts || 0) + 1;
  // dispose previous WebGL contexts before rebuilding (avoid context-limit leaks on live edit)
  for (const sn of sceneNodes) for (const ln of sn.layers) ln.three?.dispose?.();
  // AUDIO IS NOT TORN DOWN HERE. The visual DOM (stage) is fully rebuilt on every
  // re-mount (cheap, no playback state), but <audio> elements carry live playback
  // state (currentTime / play state) that must survive structural edits. We reconcile
  // them below instead of disposing+recreating, so narration never restarts on a click.
  reconcileAudio(c);
  stage = document.getElementById('stage') as HTMLDivElement;
  stage.style.width = px(c.width);
  stage.style.height = px(c.height);
  stage.style.position = 'relative';
  stage.style.overflow = 'hidden';
  stage.innerHTML = '';
  ensureSvgFilters();
  sceneNodes = [];
  const offs = sceneOffsets(c);
  c.scenes.forEach((scene, i) => {
    const sEl = document.createElement('div');
    sEl.style.position = 'absolute';
    sEl.style.inset = '0';
    sEl.style.background = scene.background ?? '#000';
    sEl.style.overflow = 'hidden';
    sEl.style.display = 'none';
    stage.appendChild(sEl);
    // map each fx control-layer to the nearest content layer below it (its target)
    const fxByTarget: Record<number, any[]> = {};
    scene.layers.forEach((L: any, idx: number) => {
      if (L.type !== 'fx') return;
      for (let j = idx - 1; j >= 0; j--) { const ty = (scene.layers[j] as any).type; if (ty !== 'fx' && ty !== 'overlay') { (fxByTarget[j] = fxByTarget[j] || []).push(L); break; } }
    });
    // Build and append in source/array order, which equals z-order (the editor stamps
    // zIndex = array index via normalizeZ). All layers are position:absolute siblings
    // with explicit z-index, so z-index governs paint order; overlays are normal
    // participants (no 9000+ band), so a backdrop-filter overlay filters exactly the
    // layers painted below its z. Keeping DOM order == z-order keeps that correct.
    const layers = scene.layers.map((l, idx) => buildLayer(l, scene.duration, fxByTarget[idx] || []));
    for (const ln of layers) sEl.appendChild(ln.el);
    sceneNodes.push({ el: sEl, scene, layers, offset: offs[i] });
  });
  // full-frame overlay above every scene, for transitions that paint over both scenes
  // (colour wipe). Hidden by default; driven by applyOver() during a transition.
  transOverEl = document.createElement('div');
  transOverEl.style.cssText = 'position:absolute;inset:0;pointer-events:none;display:none;z-index:9999;will-change:transform,opacity';
  stage.appendChild(transOverEl);
}

// Reconcile audio tracks across re-mounts so editing/clicking never restarts narration.
//
// ALGORITHM:
//  1. Resolve the new composition's `audio[]` srcs (in order) to absolute URLs.
//  2. Build the list of currently-mounted resolved srcs (in order).
//  3. If the two lists are STRUCTURALLY IDENTICAL (same length, same resolved src at
//     every index), it's a pure-reuse case: keep every existing <audio> element exactly
//     as-is (its currentTime + play state are preserved) and only re-point each kept
//     element's `track` reference to the NEW track object so updated start / volume /
//     duration / trimStart are honored on the next syncAudio() call. No DOM churn.
//  4. Otherwise the audio set genuinely changed (added/removed/reordered/different src):
//     fully recreate. We pause+remove every old element and build fresh ones. (A finer
//     per-src diff is possible, but reorder/dedupe ambiguity makes full recreate the
//     safe, deterministic choice; the common live-edit path is the identical case in 3.)
//
// In all cases the final `audioEls` array has exactly one entry per new track and each
// element is appended to document.body exactly once (no duplicates, no leaks).
function reconcileAudio(c: Composition) {
  const tracks: any[] = (c as any).audio ?? [];
  const newSrcs = tracks.map((t) => resolveSrc(t.src));
  const oldSrcs = audioEls.map((a) => resolveSrc(a.track.src));

  const sameSet = newSrcs.length === oldSrcs.length
    && newSrcs.every((s, i) => s === oldSrcs[i]);

  if (sameSet) {
    // Pure reuse: keep elements & playback, just adopt the new track objects.
    audioEls = audioEls.map((a, i) => ({ el: a.el, track: tracks[i] }));
    return;
  }

  // Structural change: tear down old, build fresh.
  for (const a of audioEls) { a.el.pause(); a.el.remove(); }
  audioEls = tracks.map((track) => {
    const el = document.createElement('audio');
    el.preload = 'auto';
    el.volume = track.volume ?? 1; el.muted = !!track.muted;
    el.addEventListener('loadedmetadata', () => { try { (window as any).__vgpAudioReady?.(); } catch {} });
    document.body.appendChild(el); // appended exactly once (these are brand-new elements)
    const url = resolveSrc(track.src);
    // Fetch the whole clip into a blob URL so the entire track is seekable
    // immediately. HTTP streaming leaves `seekable` = [0,0] until buffered, so a
    // seek to an offset (e.g. 30s) clamps to 0 and audio plays from the start.
    fetch(url).then((r) => r.blob()).then((blob) => { const u = URL.createObjectURL(blob); (el as any).__blobUrl = u; el.src = u; el.load(); })
      .catch(() => { el.src = url; });
    return { el, track };
  });
}

function renderLayer(ln: LayerNode, sceneLocalT: number, sceneDur: number) {
  const layer = ln.layer;
  if (layer.type === 'fx') { ln.el.style.display = 'none'; return; } // control-only layer
  if ((layer as any).hidden) { ln.el.style.display = 'none'; return; } // visibility toggle (honored in render too -> render == preview)
  const start = layer.start ?? 0;
  const dur = layer.duration ?? sceneDur;
  const active = sceneLocalT >= start && sceneLocalT < start + dur + 0.0001;
  if (!active) { ln.el.style.display = 'none'; return; }
  ln.el.style.display = (layer.type === 'text') ? 'flex' : 'block';
  const layerLocalT = sceneLocalT - start;

  // base transform from transform + keyframes
  const tf = layer.transform ?? {};
  const base = emptyDelta();
  base.x = keyframeValue(layer.keyframes?.x, layerLocalT, tf.x ?? 0);
  base.y = keyframeValue(layer.keyframes?.y, layerLocalT, tf.y ?? 0);
  base.scale = keyframeValue(layer.keyframes?.scale, layerLocalT, tf.scale ?? 1);
  base.rotate = keyframeValue(layer.keyframes?.rotate, layerLocalT, tf.rotate ?? 0);
  base.opacity = keyframeValue(layer.keyframes?.opacity, layerLocalT, tf.opacity ?? 1);

  // preset entries: this layer's own presets (timed to the layer) + any active fx
  // control-layers targeting it (timed to the fx layer's own window)
  type PE = { inst: PresetInstance; localT: number; dur: number };
  const entries: PE[] = (layer.presets ?? []).map((inst) => ({ inst, localT: layerLocalT, dur }));
  for (const fx of (ln.fxLayers ?? [])) {
    const fs = fx.start ?? 0, fd = fx.duration ?? sceneDur;
    // B-medium: feed the fx window length as the instance duration so a one-shot
    // (non-continuous, non-split) fx stretched/trimmed on the timeline actually
    // stretches how long its animation takes (presetProgress uses inst.duration),
    // instead of always running at preset.defaultDuration anchored to the window
    // start. Continuous presets ignore inst.duration in presetProgress (they use the
    // localT/dur args), so this is a no-op for them — the clip width now honestly
    // reflects the effect length for one-shots. Still pure in seek time -> deterministic.
    if (sceneLocalT >= fs - 0.0001 && sceneLocalT < fs + fd + 0.0001) entries.push({ inst: { id: fx.effect, params: fx.params, duration: fd }, localT: sceneLocalT - fs, dur: fd });
  }

  const wholeDelta = emptyDelta();
  combine(wholeDelta, base);
  for (const e of entries) {
    const preset = getPreset(e.inst.id);
    if (!preset || !preset.apply || preset.split) continue;
    if (preset.category === 'text' && layer.type !== 'text') continue;
    const p = presetProgress(e.inst, e.localT, e.dur, !!preset.continuous);
    combine(wholeDelta, preset.apply(p, resolveParams(preset, e.inst.params), { index: 0, count: 1, time: e.localT, dur: e.dur }));
  }
  applyDelta(ln.el, wholeDelta);

  // crop (image/video): clip the MEDIA element by inset % — applied here (not on el) so
  // it never fights el's preset clip-path/transform. Pure fn of layer.crop -> deterministic,
  // and live-editable (no remount needed).
  if (ln.media) {
    const c = (layer as any).crop;
    ln.media.style.clipPath = (c && (c.t || c.r || c.b || c.l)) ? `inset(${c.t || 0}% ${c.r || 0}% ${c.b || 0}% ${c.l || 0}%)` : '';
  }

  // overlay adjustment-layer: re-derive the effect each frame from the core overlay
  // preset so the strength can ramp / be keyframed over the clip and live amount edits
  // are honoured without a remount. Output is a pure function of the seek time
  // (via amount keyframes/params), preserving determinism. Tracked in __vgpOverlayCss
  // and cleared like clearStaleCss so backward scrubbing matches forward.
  if (layer.type === 'overlay') {
    const { css, opacity } = overlayStyle(layer, layerLocalT, dur);
    // overlay opacity multiplies whatever applyDelta already set (e.g. an in.fade)
    ln.el.style.opacity = String(clamp01(wholeDelta.opacity * opacity));
    const prev: Set<string> | undefined = (ln.el as any).__vgpOverlayCss;
    const applied = new Set<string>();
    for (const [k, v] of Object.entries(css)) { (ln.el.style as any)[k] = v; applied.add(k); }
    if (prev) for (const k of prev) { if (!applied.has(k)) (ln.el.style as any)[k] = ''; }
    (ln.el as any).__vgpOverlayCss = applied;
  }

  // split text presets -> per span (from own + fx entries).
  //
  // Split entries are gathered INDEPENDENTLY of the fx active-window gate used for
  // `entries` above. A split entrance fx (e.g. text.word-stagger / text.typewriter)
  // is meant to reveal the spans FROM HIDDEN: before its window starts the preset's
  // resting value (apply at progress 0) is the hidden state, and presetProgress()
  // already clamps progress to 0 before start / 1 after a finite window ends. If we
  // only included the fx while its window were active (as `entries` does), the spans
  // would fall back to emptyDelta (opacity 1) and flash fully visible BEFORE the
  // stagger plays and AFTER a finite window ends. Including the split fx at all times
  // and letting presetProgress drive the clamped progress makes the fx timing window
  // actually govern span visibility. Still a pure function of seek time -> deterministic.
  if (ln.spans) {
    const splitEntries: PE[] = (layer.presets ?? [])
      .filter((inst) => getPreset(inst.id)?.split && getPreset(inst.id)?.apply)
      .map((inst) => ({ inst, localT: layerLocalT, dur }));
    for (const fx of (ln.fxLayers ?? [])) {
      const preset = getPreset(fx.effect);
      if (!preset?.split || !preset.apply) continue;
      const fs = fx.start ?? 0, fd = fx.duration ?? sceneDur;
      splitEntries.push({ inst: { id: fx.effect, params: fx.params }, localT: sceneLocalT - fs, dur: fd });
    }
    ln.spans.forEach((span, idx) => {
      const sd = emptyDelta();
      for (const e of splitEntries) {
        const preset = getPreset(e.inst.id)!;
        const p = presetProgress(e.inst, e.localT, e.dur, !!preset.continuous);
        combine(sd, preset.apply!(p, resolveParams(preset, e.inst.params), { index: idx, count: ln.spans!.length, time: e.localT, dur: e.dur }));
      }
      applySceneDelta(span, sd);
    });
  }

  // three.js
  if (ln.three) {
    const props = (layer.type === 'three' ? layer.props : undefined) ?? {};
    ln.three.render(layerLocalT, props);
  }
}

async function seekVideo(v: HTMLVideoElement, time: number): Promise<void> {
  if (Math.abs(v.currentTime - time) < 0.001) return;
  await new Promise<void>((res) => {
    let done = false;
    const finish = () => { if (done) return; done = true; v.removeEventListener('seeked', finish); res(); };
    v.addEventListener('seeked', finish);
    try { v.currentTime = time; } catch { finish(); }
    // never hang the render if 'seeked' doesn't fire (headless decode stalls)
    setTimeout(finish, 400);
  });
}

// Audio tracks: during playback they play naturally (no per-frame reseek);
// while scrubbing/rendering they're paused and positioned to the playhead.
function syncAudio(t: number, playing: boolean) {
  for (const { el, track } of audioEls) {
    const start = track.start ?? 0;
    // B25: before metadata loads el.duration is NaN; don't treat the track as
    // active forever. Fall back to the remaining composition duration from `start`.
    const safeDur = Math.max(0, compositionDuration(comp) - start);
    const dur = track.duration ?? (isFinite(el.duration) ? el.duration : safeDur);
    const local = t - start;
    const active = local >= -0.03 && local < dur;
    const target = (track.trimStart ?? 0) + Math.max(0, local);
    if (!active) { if (!el.paused) el.pause(); continue; }
    el.volume = track.volume ?? 1; el.muted = !!track.muted;
    const e = el as any;
    if (playing) {
      // start once at the right offset, then let it play freely (its own clock stays
      // in sync with the rAF playhead — re-seeking every frame causes stutter/silence)
      if (el.paused && !e.__req) { e.__req = true; const tgt = target; try { el.currentTime = tgt; } catch {} el.play().then(() => { e.__req = false; if (Math.abs(el.currentTime - tgt) > 0.25) { try { el.currentTime = tgt; } catch {} } }).catch(() => { e.__req = false; }); }
      // B12: if the playhead jumped BACKWARD (element is ahead of target by more than
      // ~0.3s), the natural-play clock is now stale — reseek. Forward drift is tolerated.
      else if (!el.paused && el.currentTime - target > 0.3) { try { el.currentTime = target; } catch {} }
    } else {
      e.__req = false;
      if (!el.paused) el.pause();
      if (Math.abs(el.currentTime - target) > 0.05) { try { el.currentTime = target; } catch {} }
    }
  }
}

async function seek(time: number, opts?: { playing?: boolean }): Promise<void> {
  const playing = !!opts?.playing;
  // Clamp to the AUDIO-AWARE total so narration tails that extend past the last scene
  // stay reachable/scrubbable (matches the editor's effectiveTotal playhead). Visual
  // scene selection below still uses scene offsets, so the tail region pins to the last
  // scene's final frame while audio continues to advance via syncAudio(t).
  const dur = effectiveDuration(comp);
  // B19: allow reaching the true final instant (t === dur), not dur - epsilon.
  const t = Math.min(Math.max(0, time), Math.max(0, dur));
  // find active scene. The half-open ranges exclude t === dur, so when at (or past)
  // the very end, fall through to the last scene (handled by the default `i`).
  let i = sceneNodes.length - 1;
  for (let k = 0; k < sceneNodes.length; k++) {
    const n = sceneNodes[k];
    if (t >= n.offset && t < n.offset + n.scene.duration) { i = k; break; }
  }
  const cur = sceneNodes[i];
  const sceneLocalT = t - cur.offset;

  // reset visibility. B02: also clear any raw-css that leaked onto the scene
  // container on a previous frame (e.g. a transition's `to`/`from` css).
  sceneNodes.forEach((n) => {
    n.el.style.display = 'none'; n.el.style.transform = ''; n.el.style.opacity = '1'; n.el.style.clipPath = ''; n.el.style.filter = '';
    clearStaleCss(n.el, new Set<string>(), new Set(['transform', 'clipPath', 'filter', 'opacity', 'transformOrigin']));
  });
  applyOver(); // hide the transition overlay unless this frame's transition paints it

  // transition handling (from previous scene into current)
  const transInst: PresetInstance | undefined = cur.scene.transitionIn ?? (i > 0 ? comp.defaultTransition : undefined);
  let inTransition = false;
  let mm: { e: number; items: { a: LayerNode; b: LayerNode; A: Box; B: Box }[]; matched: Set<LayerNode> } | null = null;
  if (i > 0 && transInst) {
    const preset = getPreset(transInst.id);
    const prev = sceneNodes[i - 1];
    // B22: a transition longer than the previous scene's duration would otherwise
    // freeze the previous scene for longer than it exists. Clamp gracefully so the
    // transition never outlasts the scene it's transitioning from.
    const rawTdur = transInst.duration ?? preset?.defaultDuration ?? 0.6;
    const tdur = Math.max(0.0001, Math.min(rawTdur, prev.scene.duration));
    if (preset?.transition && sceneLocalT < tdur) {
      inTransition = true;
      const p = clamp01(sceneLocalT / tdur);
      const prevEnd = Math.max(0, prev.scene.duration - 0.0001);
      if (preset.matchMove) {
        // ── Match & Move: morph matched elements, cross-fade everything else ──
        const e = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2; // easeInOutCubic
        const pairs = matchPairs(prev, cur);
        const matched = new Set<LayerNode>(); pairs.forEach((x) => { matched.add(x.a); matched.add(x.b); });
        prev.el.style.display = 'block'; prev.el.style.transform = ''; prev.el.style.opacity = '1'; prev.el.style.clipPath = ''; prev.el.style.filter = '';
        prev.layers.forEach((ln) => renderLayer(ln, prevEnd, prev.scene.duration));
        const items = pairs.map(({ a, b }) => ({ a, b, A: homeBox(a.layer), B: homeBox(b.layer) }));
        for (const it of items) applyMorph(it.a, lerpBox(it.A, it.B, e), 1 - e);       // outgoing copy fades out
        for (const ln of prev.layers) if (!matched.has(ln) && ln.el.style.display !== 'none') ln.el.style.opacity = String(1 - e);
        cur.el.style.display = 'block'; cur.el.style.transform = ''; cur.el.style.opacity = '1'; cur.el.style.clipPath = ''; cur.el.style.filter = '';
        applyOver();
        mm = { e, items, matched };
      } else {
        const { from, to, over } = preset.transition(p, resolveParams(preset, transInst.params));
        prev.el.style.display = 'block';
        const prevD = emptyDelta(); combine(prevD, from); applySceneDelta(prev.el, prevD);
        prev.layers.forEach((ln) => renderLayer(ln, prevEnd, prev.scene.duration));
        cur.el.style.display = 'block';
        const curD = emptyDelta(); combine(curD, to); applySceneDelta(cur.el, curD);
        applyOver(over);
      }
    }
  }
  if (!inTransition) {
    cur.el.style.display = 'block';
    cur.el.style.transform = ''; cur.el.style.opacity = '1'; cur.el.style.clipPath = ''; cur.el.style.filter = '';
  }

  // render current scene layers
  cur.layers.forEach((ln) => renderLayer(ln, sceneLocalT, cur.scene.duration));
  // Match & Move: override the incoming matched elements to the morph box and fade the
  // rest in (deterministic — pure function of the eased progress). Done after the normal
  // render so it wins over each layer's own entrance preset.
  if (mm) {
    for (const ln of cur.layers) { if (!mm.matched.has(ln) && ln.el.style.display !== 'none') ln.el.style.opacity = String(mm.e); }
    for (const it of mm.items) applyMorph(it.b, lerpBox(it.A, it.B, mm.e), mm.e); // incoming copy fades in
  }

  // pause videos belonging to other (hidden) scenes
  sceneNodes.forEach((n, k) => { if (k !== i) n.layers.forEach((l) => { if (l.video && !l.video.paused) l.video.pause(); }); });

  // media sync — play naturally while playing, frame-seek while scrubbing/rendering
  const pending: Promise<void>[] = [];
  for (const ln of cur.layers) {
    if (!ln.video) continue;
    const v = ln.video;
    if (ln.el.style.display === 'none') { if (!v.paused) v.pause(); continue; }
    const vstart = ln.layer.start ?? 0;
    const target = Math.max(0, (ln.layer.type === 'video' ? (ln.layer.trimStart ?? 0) : 0) + (sceneLocalT - vstart));
    const vv = v as any;
    if (playing) {
      if (v.paused && !vv.__req) { vv.__req = true; try { v.currentTime = target; } catch {} v.play().then(() => { vv.__req = false; }).catch(() => { vv.__req = false; }); }
      // B12: backward scrub while playing — element ahead of target by >~0.3s means a
      // backward jump; reposition. Forward drift is left to play naturally.
      else if (!v.paused && v.currentTime - target > 0.3) { try { v.currentTime = target; } catch {} }
    } else {
      vv.__req = false;
      if (!v.paused) v.pause();
      pending.push(seekVideo(v, target));
    }
  }
  syncAudio(t, playing);
  await Promise.all(pending);
}

async function ready(): Promise<void> {
  // wait for fonts + images
  const imgs = Array.from(stage.querySelectorAll('img'));
  await Promise.all(imgs.map((img) => img.complete ? Promise.resolve() : new Promise((res) => { img.onload = img.onerror = () => res(null); })));
  if ((document as any).fonts?.ready) { try { await (document as any).fonts.ready; } catch {} }
  // prime videos for the first seek. A failed/aborted/stalled video must NOT hang
  // ready() forever — that would block editor init's buildTimeline()/renderRight()
  // (silent blank UI) and render.ts's `await ready()`. Resolve on 'error' too (mirrors
  // the img onload=onerror above) and cap with a timeout backstop for decodes that
  // never emit an event (same defence as seekVideo's 'seeked' timeout).
  const vids = Array.from(stage.querySelectorAll('video')) as HTMLVideoElement[];
  await Promise.all(vids.map((v) => new Promise<void>((res) => {
    if (v.readyState >= 2) return res();
    let done = false;
    const finish = () => { if (done) return; done = true; v.removeEventListener('loadeddata', finish); v.removeEventListener('error', finish); res(); };
    v.addEventListener('loadeddata', finish, { once: true });
    v.addEventListener('error', finish, { once: true });
    setTimeout(finish, 8000);
    v.load();
  })));
}

function audioInfo() { return audioEls.map((a) => ({ src: a.track.src, duration: isFinite(a.el.duration) ? a.el.duration : null })); }

(window as any).VGP = { mount, seek, ready, compositionDuration, audioInfo };
