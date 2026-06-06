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
};
type ThreeHandle = { render: (t: number, props: Record<string, number>) => void; dispose?: () => void };

let comp: Composition;
let sceneNodes: SceneNode[] = [];
let stage: HTMLDivElement;
let assetBase: string | undefined;
let audioEls: { el: HTMLAudioElement; track: any }[] = [];

const isAbsUrl = (s: string) => /^(https?:|data:|file:|blob:)/.test(s);
const resolveSrc = (src: string) => (assetBase && !isAbsUrl(src) ? new URL(src, assetBase).href : src);

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

// overlay adjustment-layer effects -> CSS filter string (applied as backdrop-filter)
const OVERLAY_FILTER: Record<string, (a?: number) => string> = {
  blur: (a) => `blur(${a ?? 8}px)`,
  'black-white': (a) => `grayscale(${a ?? 1})`,
  sepia: (a) => `sepia(${a ?? 0.8})`,
  brighten: (a) => `brightness(${1 + (a ?? 0.3)})`,
  darken: (a) => `brightness(${1 - (a ?? 0.4)})`,
  contrast: (a) => `contrast(${1 + (a ?? 0.4)})`,
  saturate: (a) => `saturate(${a ?? 1.6})`,
  invert: (a) => `invert(${a ?? 1})`,
};

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
  </filter></defs>`;
  document.body.appendChild(svg);
}

function sceneOffsets(c: Composition): number[] {
  const offs: number[] = [];
  let acc = 0;
  for (const s of c.scenes) { offs.push(acc); acc += s.duration; }
  return offs;
}

function keyframeValue(kfs: Keyframe[] | undefined, t: number, fallback: number): number {
  if (!kfs || kfs.length === 0) return fallback;
  if (t <= kfs[0].t) return kfs[0].value;
  if (t >= kfs[kfs.length - 1].t) return kfs[kfs.length - 1].value;
  for (let i = 0; i < kfs.length - 1; i++) {
    const a = kfs[i], b = kfs[i + 1];
    if (t >= a.t && t <= b.t) {
      const local = (t - a.t) / (b.t - a.t);
      const e = ease(b.easing as any, local);
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
function buildLayer(layer: Layer, sceneDur: number): LayerNode {
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

  const node: LayerNode = { el, layer };

  switch (layer.type) {
    case 'text': {
      el.style.display = 'flex';
      el.style.alignItems = 'center';
      el.style.justifyContent = 'center';
      el.style.textAlign = 'center';
      Object.assign(el.style, {
        fontFamily: 'Inter, system-ui, sans-serif', fontSize: '80px', fontWeight: '800', color: '#fff',
      });
      if (layer.style) Object.assign(el.style, layer.style);
      const splitPreset = (layer.presets ?? []).map((p) => getPreset(p.id)).find((p) => p?.split);
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
      node.video = v;
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
      // adjustment layer: affects everything painted beneath it via backdrop-filter
      el.style.pointerEvents = 'none';
      const eff = layer.effect; const a = layer.params?.amount;
      if (eff === 'vignette') el.style.boxShadow = `inset 0 0 140px ${40 * (a ?? 0.7)}px rgba(0,0,0,${0.85 * (a ?? 0.7)})`;
      else if (eff === 'fade') el.style.background = `rgba(0,0,0,${a ?? 0.5})`;
      else {
        const f = OVERLAY_FILTER[eff]?.(a);
        if (f) { el.style.backdropFilter = f; (el.style as any).webkitBackdropFilter = f; }
      }
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
    const layers = scene.layers.map((l) => {
      const ln = buildLayer(l, scene.duration);
      sEl.appendChild(ln.el);
      return ln;
    });
    sceneNodes.push({ el: sEl, scene, layers, offset: offs[i] });
  });
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
    el.volume = track.volume ?? 1;
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

  // split vs whole presets
  const insts = layer.presets ?? [];
  const wholeDelta = emptyDelta();
  combine(wholeDelta, base);
  for (const inst of insts) {
    const preset = getPreset(inst.id);
    if (!preset || !preset.apply || preset.split) continue;
    // B15: text-only presets must not silently affect non-text layers.
    if ((preset.category === 'text' || preset.split) && layer.type !== 'text') continue;
    const p = presetProgress(inst, layerLocalT, dur, !!preset.continuous);
    combine(wholeDelta, preset.apply(p, resolveParams(preset, inst.params), { index: 0, count: 1, time: layerLocalT, dur }));
  }
  applyDelta(ln.el, wholeDelta);

  // split text presets -> per span
  if (ln.spans) {
    const splitInsts = insts.filter((i) => getPreset(i.id)?.split && getPreset(i.id)?.apply);
    ln.spans.forEach((span, idx) => {
      const sd = emptyDelta();
      for (const inst of splitInsts) {
        const preset = getPreset(inst.id)!;
        const p = presetProgress(inst, layerLocalT, dur, !!preset.continuous);
        combine(sd, preset.apply!(p, resolveParams(preset, inst.params), { index: idx, count: ln.spans!.length, time: layerLocalT, dur }));
      }
      // spans are inline-block in normal flow — use the non-centering transform
      // (applyDelta's translate(-50%,-50%) would shift each span by half its width)
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
    el.volume = track.volume ?? 1;
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
  const dur = compositionDuration(comp);
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

  // transition handling (from previous scene into current)
  const transInst: PresetInstance | undefined = cur.scene.transitionIn ?? (i > 0 ? comp.defaultTransition : undefined);
  let inTransition = false;
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
      const { from, to } = preset.transition(p, resolveParams(preset, transInst.params));
      // render prev frozen at its end (guard against a zero/short scene -> no negative time)
      prev.el.style.display = 'block';
      const prevD = emptyDelta(); combine(prevD, from); applySceneDelta(prev.el, prevD);
      prev.layers.forEach((ln) => renderLayer(ln, Math.max(0, prev.scene.duration - 0.0001), prev.scene.duration));
      // current with `to`
      cur.el.style.display = 'block';
      const curD = emptyDelta(); combine(curD, to); applySceneDelta(cur.el, curD);
    }
  }
  if (!inTransition) {
    cur.el.style.display = 'block';
    cur.el.style.transform = ''; cur.el.style.opacity = '1'; cur.el.style.clipPath = ''; cur.el.style.filter = '';
  }

  // render current scene layers
  cur.layers.forEach((ln) => renderLayer(ln, sceneLocalT, cur.scene.duration));

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
  // prime videos for the first seek
  const vids = Array.from(stage.querySelectorAll('video')) as HTMLVideoElement[];
  await Promise.all(vids.map((v) => new Promise<void>((res) => {
    if (v.readyState >= 2) return res();
    v.addEventListener('loadeddata', () => res(), { once: true });
    v.load();
  })));
}

function audioInfo() { return audioEls.map((a) => ({ src: a.track.src, duration: isFinite(a.el.duration) ? a.el.duration : null })); }

(window as any).VGP = { mount, seek, ready, compositionDuration, audioInfo };
