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

// Full-frame scene containers are inset:0 (already filling the frame), so they
// must NOT get the -50% centering that layer boxes use.
function applySceneDelta(el: HTMLElement, d: ReturnType<typeof emptyDelta>) {
  const t = `translate(${px(d.x)}, ${px(d.y)}) scale(${d.scale}) rotate(${d.rotate}deg)`;
  el.style.transformOrigin = 'center center';
  el.style.transform = d.css.transform ? `${t} ${d.css.transform}` : t;
  el.style.opacity = String(clamp01(d.opacity));
  el.style.clipPath = d.clipInset
    ? `inset(${d.clipInset[0]}% ${d.clipInset[1]}% ${d.clipInset[2]}% ${d.clipInset[3]}%)`
    : '';
}

function applyDelta(el: HTMLElement, d: ReturnType<typeof emptyDelta>) {
  const t = `translate(-50%, -50%) translate(${px(d.x)}, ${px(d.y)}) scale(${d.scale}) rotate(${d.rotate}deg)`;
  el.style.transform = d.css.transform ? `${t} ${d.css.transform}` : t;
  el.style.opacity = String(clamp01(d.opacity));
  const filters: string[] = [];
  if (d.blur > 0.01) filters.push(`blur(${px(d.blur)})`);
  if (Math.abs(d.brightness - 1) > 0.01) filters.push(`brightness(${d.brightness})`);
  el.style.filter = filters.join(' ');
  el.style.clipPath = d.clipInset
    ? `inset(${d.clipInset[0]}% ${d.clipInset[1]}% ${d.clipInset[2]}% ${d.clipInset[3]}%)`
    : '';
  for (const [k, v] of Object.entries(d.css)) {
    if (k !== 'transform') (el.style as any)[k] = v;
  }
}

// per-element progress for a preset instance on a layer
function presetProgress(inst: PresetInstance, layerLocalT: number, layerDur: number, continuous: boolean): number {
  if (continuous) return clamp01(layerLocalT / Math.max(0.0001, layerDur));
  const start = inst.start ?? 0;
  const preset = getPreset(inst.id);
  const dur = inst.duration ?? preset?.defaultDuration ?? 0.6;
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
      else if (layer.radius) el.style.borderRadius = px(layer.radius);
      break;
    }
  }
  return node;
}

// ---- public API ----
function mount(c: Composition, opts?: { assetBase?: string }) {
  comp = c;
  assetBase = opts?.assetBase;
  // dispose previous WebGL contexts before rebuilding (avoid context-limit leaks on live edit)
  for (const sn of sceneNodes) for (const ln of sn.layers) ln.three?.dispose?.();
  stage = document.getElementById('stage') as HTMLDivElement;
  stage.style.width = px(c.width);
  stage.style.height = px(c.height);
  stage.style.position = 'relative';
  stage.style.overflow = 'hidden';
  stage.innerHTML = '';
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
    const p = presetProgress(inst, layerLocalT, dur, !!preset.continuous);
    combine(wholeDelta, preset.apply(p, resolveParams(preset, inst.params), { index: 0, count: 1 }));
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
        combine(sd, preset.apply!(p, resolveParams(preset, inst.params), { index: idx, count: ln.spans!.length }));
      }
      applyDelta(span, sd);
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
    const onSeeked = () => { v.removeEventListener('seeked', onSeeked); res(); };
    v.addEventListener('seeked', onSeeked);
    v.currentTime = time;
  });
}

async function seek(time: number): Promise<void> {
  const dur = compositionDuration(comp);
  const t = Math.min(Math.max(0, time), Math.max(0, dur - 0.0001));
  // find active scene
  let i = sceneNodes.length - 1;
  for (let k = 0; k < sceneNodes.length; k++) {
    const n = sceneNodes[k];
    if (t >= n.offset && t < n.offset + n.scene.duration) { i = k; break; }
  }
  const cur = sceneNodes[i];
  const sceneLocalT = t - cur.offset;

  // reset visibility
  sceneNodes.forEach((n) => { n.el.style.display = 'none'; n.el.style.transform = ''; n.el.style.opacity = '1'; n.el.style.clipPath = ''; });

  // transition handling (from previous scene into current)
  const transInst: PresetInstance | undefined = cur.scene.transitionIn ?? (i > 0 ? comp.defaultTransition : undefined);
  let inTransition = false;
  if (i > 0 && transInst) {
    const preset = getPreset(transInst.id);
    const tdur = transInst.duration ?? preset?.defaultDuration ?? 0.6;
    if (preset?.transition && sceneLocalT < tdur) {
      inTransition = true;
      const p = clamp01(sceneLocalT / tdur);
      const { from, to } = preset.transition(p, resolveParams(preset, transInst.params));
      const prev = sceneNodes[i - 1];
      // render prev frozen at its end
      prev.el.style.display = 'block';
      const prevD = emptyDelta(); combine(prevD, from); applySceneDelta(prev.el, prevD);
      prev.layers.forEach((ln) => renderLayer(ln, prev.scene.duration - 0.0001, prev.scene.duration));
      // current with `to`
      cur.el.style.display = 'block';
      const curD = emptyDelta(); combine(curD, to); applySceneDelta(cur.el, curD);
    }
  }
  if (!inTransition) {
    cur.el.style.display = 'block';
    cur.el.style.transform = ''; cur.el.style.opacity = '1'; cur.el.style.clipPath = '';
  }

  // render current scene layers
  cur.layers.forEach((ln) => renderLayer(ln, sceneLocalT, cur.scene.duration));

  // sync any visible videos
  const pending: Promise<void>[] = [];
  for (const ln of cur.layers) {
    if (ln.video && ln.el.style.display !== 'none') {
      const vstart = ln.layer.start ?? 0;
      const vt = (ln.layer.type === 'video' ? (ln.layer.trimStart ?? 0) : 0) + (sceneLocalT - vstart);
      pending.push(seekVideo(ln.video, Math.max(0, vt)));
    }
  }
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

(window as any).VGP = { mount, seek, ready, compositionDuration };
