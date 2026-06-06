// VideoGenPro Studio — CapCut-style editor over the Scene IR.
// IR is the single source of truth, shared with the agent via the dev server.
import { buildManifest } from '../../core/src/index';

declare const VGP: any;
const MANIFEST = buildManifest();
const MAN = new Map(MANIFEST.map((e) => [e.id, e]));
const LABELW = 98;

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
const typeIco: Record<string, string> = { text: 'text', image: 'image', video: 'video', shape: 'shape', three: 'cube', html: 'text' };
const clipColor: Record<string, string> = { text: 'var(--clip-text)', image: 'var(--clip-image)', three: 'var(--clip-three)', shape: 'var(--clip-shape)', html: 'var(--clip-html)', video: 'var(--clip-video)' };
const typeTint: Record<string, string> = { text: 'var(--t-text)', image: 'var(--t-image)', video: 'var(--t-video)', three: 'var(--t-three)', shape: 'var(--t-shape)', html: 'var(--t-html)', audio: 'var(--t-audio)' };
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
    for (const l of sc.layers) if (l.duration != null) maxEnd = Math.max(maxEnd, (l.start ?? 0) + l.duration);
    const base = S.sceneBase[i] ?? 0.5;
    sc.duration = +Math.max(0.5, base, maxEnd).toFixed(2);
  });
  S.offsets = []; let a = 0; for (const sc of S.ir.scenes) { S.offsets.push(a); a += sc.duration; } S.total = a; if (S.playhead > S.total) S.playhead = 0;
}
function sceneAt(t: number) { let si = 0; for (let i = S.offsets.length - 1; i >= 0; i--) if (t >= S.offsets[i]) { si = i; break; } return si; }

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
function setDoc(ir: any) { S.ir = ir; S.lastSyncJson = JSON.stringify(ir); S.selected = null; S.history = [S.lastSyncJson]; S.histIndex = 0; captureSceneBase(); derive(); autoFit(); mountPreview(); buildTimeline(); renderRight(); updateTime(); }

// ---------- layer factories ----------
const newText = () => ({ type: 'text', text: 'New Text', style: { fontSize: '72px', color: '#ffffff' }, duration: 2, presets: [{ id: 'in.fade' }], transform: {} });
const newShape = () => ({ type: 'shape', shape: 'rect', fill: '#ffffff', rect: { x: 440, y: 290, w: 400, h: 140 }, duration: 2, presets: [{ id: 'in.scale' }], transform: {} });
const newLine = () => ({ type: 'shape', shape: 'line', fill: '#ffffff', rect: { x: 340, y: 360, w: 600, h: 6 }, duration: 2, presets: [{ id: 'in.slide-left', params: { distance: 120 } }], transform: {} });
const new3D = () => ({ type: 'three', scene: 'particles', props: { speed: 0.3 }, duration: 3, presets: [], transform: {} });
const newAssetLayer = (a: any) => ({ type: a.type, src: a.src, fit: 'cover', duration: 2.5, presets: (a.type === 'image' ? [{ id: 'image.ken-burns' }] : []), transform: {} });
function addLayerAtPlayhead(layer: any) { const si = sceneAt(S.playhead); const maxStart = Math.max(0, S.ir.scenes[si].duration - 0.2); layer.start = Math.max(0, Math.min(maxStart, +(S.playhead - S.offsets[si]).toFixed(2))); S.ir.scenes[si].layers.push(layer); S.selected = { s: si, l: S.ir.scenes[si].layers.length - 1 }; setTab('props'); structuralEdit(); }
function dropLayerAt(clientX: number, layer: any) { const r = $('tlInner').getBoundingClientRect(); const t = Math.max(0, Math.min(S.total, (clientX - r.left - LABELW) / S.pxPerSec)); const si = sceneAt(t); const maxStart = Math.max(0, S.ir.scenes[si].duration - 0.2); layer.start = Math.max(0, Math.min(maxStart, +(t - S.offsets[si]).toFixed(2))); S.ir.scenes[si].layers.push(layer); S.selected = { s: si, l: S.ir.scenes[si].layers.length - 1 }; setTab('props'); structuralEdit(); }

// ---------- assets ----------
async function loadAssets() { try { S.assets = await (await fetch('/api/assets')).json(); } catch { S.assets = []; } renderAssets(); }
async function uploadFiles(files: FileList | File[]) {
  for (const f of Array.from(files)) {
    const type = f.type.startsWith('video') ? 'video' : 'image';
    try { const a = await (await fetch('/api/upload?name=' + encodeURIComponent(f.name) + '&type=' + type, { method: 'POST', body: f })).json(); if (a?.src) S.assets.unshift(a); } catch {}
  }
  renderAssets();
}
function renderAssets() {
  const g = $('assetGrid'); g.innerHTML = '';
  if (!S.assets.length) { const e = el('div', 'empty'); e.style.cssText = 'font-size:11px;padding:14px'; e.textContent = 'No assets yet'; g.appendChild(e); return; }
  S.assets.forEach((a) => {
    const d = el('div', 'asset'); d.draggable = true; const u = assetUrl(a.src);
    if (a.type === 'video') { const v = el('video') as HTMLVideoElement; v.src = u; v.muted = true; d.appendChild(v); } else { const im = el('img') as HTMLImageElement; im.src = u; d.appendChild(im); }
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
  const width = LABELW + S.total * S.pxPerSec + 40; inner.style.width = width + 'px';

  const ruler = el('div', 'ruler'); ruler.style.width = width + 'px';
  // adaptive tick interval so mm:ss labels never crowd at any zoom level
  const STEPS = [0.5, 1, 2, 5, 10, 15, 30, 60, 120, 300, 600];
  const tickStep = STEPS.find((s) => s * S.pxPerSec >= 64) ?? 600;
  for (let t = 0; t <= S.total + 0.001; t += tickStep) { const tk = el('div', 'tick'); tk.style.left = (LABELW + t * S.pxPerSec) + 'px'; tk.textContent = fmtClock(t); ruler.appendChild(tk); }
  inner.appendChild(ruler); // seeking handled by the unified timeline handler in init()

  S.ir.scenes.forEach((scene: any, si: number) => {
    const sr = el('div', 'scene-row');
    const tag = el('div', 'scene-tag'); tag.innerHTML = icon('film' in I ? 'film' : 'video') + `Scene ${si + 1} · ${fmtClock(scene.duration)}`; sr.appendChild(tag);
    inner.appendChild(sr);
    scene.layers.forEach((layer: any, li: number) => {
      const track = el('div', 'track');
      const label = el('div', 'track-label'); label.innerHTML = tintIcon(typeIco[layer.type] ?? 'shape', layer.type) + `<span>${layer.type === 'text' ? String(layer.text).slice(0, 8) : layer.type}</span>`; track.appendChild(label);
      const offset = S.offsets[si] + (layer.start ?? 0); const dur = layer.duration ?? scene.duration;
      const clip = el('div', 'clip');
      clip.style.left = (LABELW + offset * S.pxPerSec) + 'px'; clip.style.width = Math.max(24, dur * S.pxPerSec) + 'px'; clip.style.background = clipColor[layer.type] ?? '#555';
      clip.innerHTML = icon(typeIco[layer.type] ?? 'shape') + `<span>${layer.type === 'text' ? String(layer.text).slice(0, 12) : layer.type}</span>`;
      if (S.selected && S.selected.s === si && S.selected.l === li) clip.classList.add('sel');
      const handle = el('div', 'handle'); clip.appendChild(handle);
      // drop an effect/overlay preset card directly onto this clip's layer
      clip.addEventListener('dragover', (e: DragEvent) => { if (e.dataTransfer?.types.includes('application/x-vgp-preset')) { e.preventDefault(); clip.style.outline = '2px solid #fff'; } });
      clip.addEventListener('dragleave', () => { clip.style.outline = ''; });
      clip.addEventListener('drop', (e: DragEvent) => { e.preventDefault(); clip.style.outline = ''; const id = e.dataTransfer?.getData('application/x-vgp-preset'); if (id) { layer.presets = layer.presets || []; layer.presets.push({ id, params: {} }); S.selected = { s: si, l: li }; S.playhead = S.offsets[si] + (layer.start ?? 0) + 0.05; structuralEdit(); showToast('Added ' + id.split('.')[1].replace(/-/g, ' ')); } });
      clip.onmousedown = (e: MouseEvent) => {
        if (e.target === handle) return; e.preventDefault();
        const sx = e.clientX, os = layer.start ?? 0; let moved = false;
        const mv = (ev: MouseEvent) => { const dx = ev.clientX - sx; if (Math.abs(dx) > 3) moved = true; layer.start = +Math.max(0, Math.min(scene.duration - 0.1, os + dx / S.pxPerSec)).toFixed(3); clip.style.left = (LABELW + (S.offsets[si] + layer.start) * S.pxPerSec) + 'px'; };
        const up = () => { window.removeEventListener('mousemove', mv); window.removeEventListener('mouseup', up); if (moved) timingEdit(); else { select(si, li); seekTo((sx - $('tlInner').getBoundingClientRect().left - LABELW) / S.pxPerSec); } };
        window.addEventListener('mousemove', mv); window.addEventListener('mouseup', up);
      };
      handle.onmousedown = (e: MouseEvent) => {
        e.preventDefault(); e.stopPropagation(); const sx = e.clientX, od = layer.duration ?? scene.duration;
        // B08: don't cap at scene.duration — derive() auto-extends the scene.
        // Keep a generous sane cap (whole composition length).
        const maxDur = Math.max(scene.duration, S.total) || scene.duration;
        const mv = (ev: MouseEvent) => { layer.duration = +Math.max(0.1, Math.min(maxDur, od + (ev.clientX - sx) / S.pxPerSec)).toFixed(3); clip.style.width = Math.max(24, layer.duration * S.pxPerSec) + 'px'; };
        const up = () => { window.removeEventListener('mousemove', mv); window.removeEventListener('mouseup', up); timingEdit(); };
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
      const dur = a.duration ?? info[ai]?.duration ?? Math.max(2, S.total - start);
      const clip = el('div', 'clip audio-clip');
      clip.style.left = (LABELW + start * S.pxPerSec) + 'px'; clip.style.width = Math.max(24, dur * S.pxPerSec) + 'px';
      clip.innerHTML = icon('audio') + `<span>${name}</span>`;
      if (S.selAudio === ai) clip.classList.add('sel');
      const handle = el('div', 'handle'); clip.appendChild(handle);
      clip.onmousedown = (e: MouseEvent) => {
        if (e.target === handle) return; e.preventDefault();
        const sx = e.clientX, os = start; let moved = false;
        const mv = (ev: MouseEvent) => { const dx = ev.clientX - sx; if (Math.abs(dx) > 3) moved = true; a.start = Math.max(0, +(os + dx / S.pxPerSec).toFixed(2)); clip.style.left = (LABELW + a.start * S.pxPerSec) + 'px'; };
        const up = () => { window.removeEventListener('mousemove', mv); window.removeEventListener('mouseup', up); if (moved) { liveSeek(); scheduleSave(); buildTimeline(); } else selectAudio(ai); };
        window.addEventListener('mousemove', mv); window.addEventListener('mouseup', up);
      };
      handle.onmousedown = (e: MouseEvent) => {
        e.preventDefault(); e.stopPropagation(); const sx = e.clientX, od = dur;
        const mv = (ev: MouseEvent) => { a.duration = Math.max(0.2, +(od + (ev.clientX - sx) / S.pxPerSec).toFixed(2)); clip.style.width = Math.max(24, a.duration * S.pxPerSec) + 'px'; };
        const up = () => { window.removeEventListener('mousemove', mv); window.removeEventListener('mouseup', up); scheduleSave(); };
        window.addEventListener('mousemove', mv); window.addEventListener('mouseup', up);
      };
      track.appendChild(clip); inner.appendChild(track);
    });
  }

  const ph = el('div', 'playhead'); ph.id = 'playhead'; inner.appendChild(ph); positionPlayhead();

  // transition seams: a diamond at each scene boundary — drop a transition card here
  for (let i = 1; i < S.ir.scenes.length; i++) {
    const has = !!S.ir.scenes[i].transitionIn;
    const seam = el('div', 'seam' + (has ? '' : ' empty'));
    seam.style.left = (LABELW + S.offsets[i] * S.pxPerSec - 7) + 'px'; seam.style.height = '46px';
    seam.title = has ? `transition: ${S.ir.scenes[i].transitionIn.id} (click to remove)` : 'drop a transition here';
    const dot = el('div', 'dot'); seam.appendChild(dot);
    seam.addEventListener('dragover', (e: DragEvent) => { if (e.dataTransfer?.types.includes('application/x-vgp-transition')) { e.preventDefault(); seam.classList.add('droptgt'); } });
    seam.addEventListener('dragleave', () => seam.classList.remove('droptgt'));
    seam.addEventListener('drop', (e: DragEvent) => { e.preventDefault(); seam.classList.remove('droptgt'); const id = e.dataTransfer?.getData('application/x-vgp-transition'); if (id) { S.ir.scenes[i].transitionIn = { id }; S.playhead = Math.max(0, S.offsets[i] - 0.25); structuralEdit(); showToast('Transition added: ' + id.split('.')[1]); } });
    seam.addEventListener('click', () => { if (S.ir.scenes[i].transitionIn) { delete S.ir.scenes[i].transitionIn; structuralEdit(); showToast('Transition removed'); } });
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
  const off = S.offsets[sel.s] ?? 0; const st = off + (layer.start ?? 0); const dur = layer.duration ?? S.ir.scenes[sel.s].duration;
  if (S.playhead < st - 0.01 || S.playhead > st + dur + 0.01) { box.style.display = 'none'; return; }
  const r = layer.rect ?? { x: 0, y: 0, w: S.ir.width, h: S.ir.height };
  const tf = layer.transform ?? {};
  // B13: the runtime positions a layer centered on the rect center (translate
  // -50%,-50%) then applies transform.scale/rotate around that center. Mirror
  // that here so the box matches the rendered element: scale the box size about
  // its center and apply rotate via CSS transform (rotation around center).
  const sc = (tf.scale ?? 1);
  const cx = r.x + r.w / 2 + (tf.x ?? 0);
  const cy = r.y + r.h / 2 + (tf.y ?? 0);
  const w = r.w * sc, h = r.h * sc;
  box.style.display = 'block';
  box.style.left = (cx - w / 2) + 'px'; box.style.top = (cy - h / 2) + 'px';
  box.style.width = w + 'px'; box.style.height = h + 'px';
  const rot = tf.rotate ?? 0;
  box.style.transform = rot ? `rotate(${rot}deg)` : '';
  box.style.transformOrigin = 'center center';
  const inv = Math.min(2.4, 1 / (S.scale || 1));
  box.querySelectorAll('.sh').forEach((h) => { (h as HTMLElement).style.transform = `scale(${inv})`; });
}
function initSelHandles() {
  document.querySelectorAll('#selbox .sh').forEach((h) => {
    (h as HTMLElement).addEventListener('mousedown', (e: any) => {
      if (!S.selected) return; e.preventDefault(); e.stopPropagation();
      const layer = S.ir.scenes[S.selected.s].layers[S.selected.l];
      if (!layer.rect) layer.rect = { x: 0, y: 0, w: S.ir.width, h: S.ir.height };
      const corner = h.getAttribute('data-h'); const sx = e.clientX, sy = e.clientY; const r0 = { ...layer.rect }; const sc = S.scale || 1;
      const mv = (ev: MouseEvent) => {
        const dx = (ev.clientX - sx) / sc, dy = (ev.clientY - sy) / sc; let x = r0.x, y = r0.y, w = r0.w, hh = r0.h;
        if (corner === 'se') { w = Math.max(20, r0.w + dx); hh = Math.max(20, r0.h + dy); }
        if (corner === 'sw') { w = Math.max(20, r0.w - dx); hh = Math.max(20, r0.h + dy); x = r0.x + (r0.w - w); }
        if (corner === 'ne') { w = Math.max(20, r0.w + dx); hh = Math.max(20, r0.h - dy); y = r0.y + (r0.h - hh); }
        if (corner === 'nw') { w = Math.max(20, r0.w - dx); hh = Math.max(20, r0.h - dy); x = r0.x + (r0.w - w); y = r0.y + (r0.h - hh); }
        layer.rect = { x: Math.round(x), y: Math.round(y), w: Math.round(w), h: Math.round(hh) };
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
  const f = numField(label, value, min, max, step, onIn);
  const lab = f.querySelector('label') as HTMLElement;
  const layer = S.selected ? S.ir.scenes[S.selected.s].layers[S.selected.l] : null;
  const n = layer?.keyframes?.[prop]?.length ?? 0;
  const key = el('button', 'icon-btn'); key.innerHTML = n ? `◆ ${n}` : '◆'; key.title = 'add keyframe at playhead';
  key.style.cssText = 'float:right;padding:1px 7px;font-size:10px' + (n ? ';color:var(--accent)' : '');
  key.onclick = () => addKeyframe(prop);
  lab.appendChild(key);
  return f;
}
function addKeyframe(prop: string) {
  if (!S.selected) return; const { s, l } = S.selected; const layer = S.ir.scenes[s].layers[l];
  const localT = Math.max(0, +(S.playhead - (S.offsets[s] + (layer.start ?? 0))).toFixed(2));
  const cur = (layer.transform?.[prop]) ?? (prop === 'scale' || prop === 'opacity' ? 1 : 0);
  layer.keyframes = layer.keyframes || {}; const arr = layer.keyframes[prop] || (layer.keyframes[prop] = []);
  const ex = arr.find((k: any) => Math.abs(k.t - localT) < 0.04);
  if (ex) ex.value = cur; else arr.push({ t: localT, value: cur, easing: 'easeInOut' });
  arr.sort((a: any, b: any) => a.t - b.t);
  liveEdit(); buildProps();
}
function clearKeyframes(prop: string) { if (!S.selected) return; const layer = S.ir.scenes[S.selected.s].layers[S.selected.l]; if (layer.keyframes) { delete layer.keyframes[prop]; structuralEdit(); } }
function splitSelected() {
  if (!S.selected) { showToast('Please select a layer to split.'); return; }
  const { s, l } = S.selected; const scene = S.ir.scenes[s]; const layer = scene.layers[l];
  const ls = layer.start ?? 0, ld = layer.duration ?? scene.duration; const local = S.playhead - (S.offsets[s] + ls);
  if (local <= 0.05 || local >= ld - 0.05) { showToast('Move the playhead over the clip to split.'); return; }
  const second = JSON.parse(JSON.stringify(layer));
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
  const isExit = (id: string) => MAN.get(id)?.category === 'out' || id.startsWith('out.');
  const isEnter = (id: string) => !isExit(id) && (MAN.get(id)?.category === 'in' || id.startsWith('in.'));
  if (Array.isArray(layer.presets)) layer.presets = layer.presets.filter((pr: any) => !isExit(pr.id));
  if (Array.isArray(second.presets)) second.presets = second.presets.filter((pr: any) => !isEnter(pr.id));
  scene.layers.splice(l + 1, 0, second); structuralEdit();
}
function duplicateSelected() { if (!S.selected) return; const { s, l } = S.selected; const scene = S.ir.scenes[s]; const copy = JSON.parse(JSON.stringify(scene.layers[l])); copy.start = (copy.start ?? 0) + 0.2; scene.layers.splice(l + 1, 0, copy); S.selected = { s, l: l + 1 }; structuralEdit(); }
// z-order: reorder the selected layer within its scene (array order == paint order; zIndex normalised to match)
function arrangeLayer(mode: 'top' | 'up' | 'down' | 'bottom') {
  if (!S.selected) { showToast('Select a layer to arrange.'); return; }
  const { s, l } = S.selected; const arr = S.ir.scenes[s].layers; if (arr.length < 2) return;
  let ni = l;
  if (mode === 'top') ni = arr.length - 1; else if (mode === 'bottom') ni = 0; else if (mode === 'up') ni = Math.min(arr.length - 1, l + 1); else ni = Math.max(0, l - 1);
  if (ni === l) return;
  const [layer] = arr.splice(l, 1); arr.splice(ni, 0, layer);
  arr.forEach((ly: any, i: number) => { ly.zIndex = i; });
  S.selected = { s, l: ni }; structuralEdit();
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
    p.appendChild(head);
    const h3 = el('h3'); h3.textContent = 'audio'; p.appendChild(h3);
    p.appendChild(numField('volume', a.volume ?? 1, 0, 1, 0.01, (v) => { a.volume = v; liveEdit(); }));
    p.appendChild(numField('start (s)', a.start ?? 0, 0, Math.max(1, S.total), 0.05, (v) => { a.start = v; liveSeek(); buildTimeline(); scheduleSave(); }));
    const info = (typeof VGP.audioInfo === 'function' ? VGP.audioInfo() : [])[S.selAudio];
    const curDur = a.duration ?? info?.duration ?? Math.max(1, S.total - (a.start ?? 0));
    p.appendChild(numField('duration (s)', curDur, 0.2, Math.max(curDur, S.total), 0.05, (v) => { a.duration = v; buildTimeline(); scheduleSave(); }));
    return;
  }
  if (!S.selected) { p.innerHTML = '<div class="empty">Select a clip in the timeline to edit it.<br/><br/>Or open the <b>Animations</b> tab to browse presets.</div>'; return; }
  const { s, l } = S.selected; const scene = S.ir.scenes[s]; const layer = scene?.layers[l];
  if (!layer) { S.selected = null; return buildProps(); }
  const h = (t: string) => { const x = el('h3'); x.textContent = t; p.appendChild(x); };

  const head = el('div', 'sel-head');
  const pill = el('span', 'pill'); pill.innerHTML = icon(typeIco[layer.type] ?? 'shape') + layer.type; pill.style.background = clipColor[layer.type] ?? '#555'; head.appendChild(pill);
  const title = el('span'); title.textContent = layer.type === 'text' ? String(layer.text).slice(0, 16) : (layer.src ? String(layer.src).split('/').pop() : layer.type); title.style.cssText = 'flex:1;font-weight:600;overflow:hidden;text-overflow:ellipsis'; head.appendChild(title);
  const del = el('button', 'icon-btn'); del.innerHTML = icon('trash'); del.onclick = () => { scene.layers.splice(l, 1); S.selected = null; structuralEdit(); }; head.appendChild(del); p.appendChild(head);

  // arrange / z-order
  const arrange = el('div', 'arrange');
  ([['arrTop', 'To front', 'top'], ['arrUp', 'Forward', 'up'], ['arrDown', 'Backward', 'down'], ['arrBot', 'To back', 'bottom']] as const).forEach(([ic, lbl, mode]) => {
    const bn = el('button'); bn.innerHTML = icon(ic) + `<span>${lbl}</span>`; bn.onclick = () => arrangeLayer(mode as any); arrange.appendChild(bn);
  });
  p.appendChild(arrange);

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
    card.ondragstart = (ev: any) => ev.dataTransfer.setData(e.category === 'transition' ? 'application/x-vgp-transition' : 'application/x-vgp-preset', e.id);
    grid.appendChild(card);
  });
  p.appendChild(grid);
}
function applyFromLibrary(entry: any) {
  if (entry.category === 'transition') {
    const si = S.selected ? S.selected.s : sceneAt(S.playhead);
    S.ir.scenes[si].transitionIn = { id: entry.id };
    if (S.selected) S.playhead = Math.max(0, S.offsets[si] - 0.2);
    structuralEdit(); return;
  }
  if (!S.selected) { setDot('edited', 'select a clip!'); return; }
  const layer = S.ir.scenes[S.selected.s].layers[S.selected.l];
  layer.presets = layer.presets || []; layer.presets.push({ id: entry.id, params: {} });
  S.playhead = S.offsets[S.selected.s] + (layer.start ?? 0) + 0.05;
  setTab('props'); structuralEdit(); positionPlayhead();
}

// ---------- playback ----------
function updateTime() { $('tpTime').textContent = fmtClockMs(S.playhead); $('tpTotal').textContent = ' / ' + fmtClockMs(S.total); }
function fitTimeline() { const w = $('tlScroll').clientWidth || 900; S.pxPerSec = Math.max(6, Math.min(400, (w - LABELW - 40) / Math.max(1, S.total))); buildTimeline(); $('tlScroll').scrollLeft = 0; }
function zoomBy(f: number) { S.pxPerSec = Math.max(6, Math.min(800, S.pxPerSec * f)); buildTimeline(); }
function seekTo(t: number) { S.playhead = Math.max(0, Math.min(S.total, t)); liveSeek(); positionPlayhead(); updateTime(); }
function setPlayIcon() { $('tpPlay').innerHTML = icon(S.playing ? 'pause' : 'play'); }
function togglePlay() { S.playing = !S.playing; setPlayIcon(); last = performance.now(); VGP.seek(S.playhead, { playing: S.playing }); }
let last = performance.now();
function loop(now: number) {
  if (S.playing) { S.playhead += (now - last) / 1000; if (S.playhead >= S.total) { if (S.loop) S.playhead = 0; else { S.playhead = S.total; togglePlay(); } } VGP.seek(S.playhead, { playing: true }); positionPlayhead(); updateTime(); }
  last = now; requestAnimationFrame(loop);
}
function autoFit() { const w = $('tlScroll').clientWidth || 900; S.pxPerSec = Math.max(40, Math.min(220, (w - LABELW - 40) / Math.max(1, S.total))); }

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
  captureSceneBase(); derive(); autoFit(); mountPreview(); await VGP.ready();
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
  $('btnDel').onclick = () => { if (S.selected) { const { s, l } = S.selected; S.ir.scenes[s].layers.splice(l, 1); S.selected = null; structuralEdit(); } };
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
    const t = e.target as HTMLElement;
    if (t.closest('.clip') || t.closest('.track-label') || t.closest('.sh')) return;
    const seekFrom = (ev: MouseEvent) => seekTo((ev.clientX - $('tlInner').getBoundingClientRect().left - LABELW) / S.pxPerSec);
    seekFrom(e);
    const mv = (ev: MouseEvent) => seekFrom(ev);
    const up = () => { window.removeEventListener('mousemove', mv); window.removeEventListener('mouseup', up); };
    window.addEventListener('mousemove', mv); window.addEventListener('mouseup', up);
  });
  tl.addEventListener('dragover', (e) => { e.preventDefault(); tl.classList.add('over'); });
  tl.addEventListener('dragleave', () => tl.classList.remove('over'));
  tl.addEventListener('drop', async (e: DragEvent) => { e.preventDefault(); tl.classList.remove('over'); const d = e.dataTransfer?.getData('application/x-vgp-asset'); if (d) { dropLayerAt(e.clientX, newAssetLayer(JSON.parse(d))); return; } if (e.dataTransfer?.files.length) { const before = S.assets.length; await uploadFiles(e.dataTransfer.files); if (S.assets.length > before) dropLayerAt(e.clientX, newAssetLayer(S.assets[0])); } });

  // wheel zoom (ctrl/cmd) — no manual zoom buttons
  tl.addEventListener('wheel', (e: WheelEvent) => {
    if (!(e.ctrlKey || e.metaKey)) return; e.preventDefault();
    const r = $('tlInner').getBoundingClientRect(); const curT = (e.clientX - r.left - LABELW) / S.pxPerSec;
    S.pxPerSec = Math.max(30, Math.min(800, S.pxPerSec * (e.deltaY < 0 ? 1.12 : 0.89)));
    buildTimeline(); tl.scrollLeft = LABELW + curT * S.pxPerSec - (e.clientX - r.left);
  }, { passive: false });

  // canvas editing: click the topmost layer under the cursor to select it, then drag to move
  const stage = $('stage');
  stage.style.cursor = 'move';
  stage.addEventListener('mousedown', (e: MouseEvent) => {
    const rect = stage.getBoundingClientRect(); const sc = S.scale || 1;
    const cx = (e.clientX - rect.left) / sc, cy = (e.clientY - rect.top) / sc; // composition coords
    const si = sceneAt(S.playhead); const scene = S.ir.scenes[si]; const localT = S.playhead - S.offsets[si];
    let hit = -1;
    for (let li = scene.layers.length - 1; li >= 0; li--) {
      const L = scene.layers[li]; const st = L.start ?? 0, du = L.duration ?? scene.duration;
      if (localT < st - 0.01 || localT > st + du + 0.01) continue;
      const r = L.rect ?? { x: 0, y: 0, w: S.ir.width, h: S.ir.height }; const tf = L.transform ?? {}; const scl = tf.scale ?? 1;
      const ccx = r.x + r.w / 2 + (tf.x ?? 0), ccy = r.y + r.h / 2 + (tf.y ?? 0), hw = r.w * scl / 2, hh = r.h * scl / 2;
      if (Math.abs(cx - ccx) <= hw && Math.abs(cy - ccy) <= hh) { hit = li; break; }
    }
    if (hit < 0) return;
    e.preventDefault();
    if (!S.selected || S.selected.s !== si || S.selected.l !== hit) select(si, hit);
    const layer = scene.layers[hit]; layer.transform = layer.transform || {};
    const sx = e.clientX, sy = e.clientY, ox = layer.transform.x ?? 0, oy = layer.transform.y ?? 0; let moved = false;
    const mv = (ev: MouseEvent) => { if (Math.abs(ev.clientX - sx) + Math.abs(ev.clientY - sy) > 2) moved = true; layer.transform.x = Math.round(ox + (ev.clientX - sx) / sc); layer.transform.y = Math.round(oy + (ev.clientY - sy) / sc); liveSeek(); updateSelBox(); };
    const up = () => { window.removeEventListener('mousemove', mv); window.removeEventListener('mouseup', up); if (moved) { scheduleSave(); buildProps(); } };
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
    if (!meta && (e.key === 's' || e.key === 'S')) { splitSelected(); return; }
    if ((e.key === 'Delete' || e.key === 'Backspace') && S.selected) { const { s, l } = S.selected; S.ir.scenes[s].layers.splice(l, 1); S.selected = null; structuralEdit(); return; }
    if (S.selected && e.key.startsWith('Arrow')) {
      e.preventDefault(); const layer = S.ir.scenes[S.selected.s].layers[S.selected.l]; layer.transform = layer.transform || {}; const step = e.shiftKey ? 1 : 10;
      if (e.key === 'ArrowLeft') layer.transform.x = (layer.transform.x ?? 0) - step;
      if (e.key === 'ArrowRight') layer.transform.x = (layer.transform.x ?? 0) + step;
      if (e.key === 'ArrowUp') layer.transform.y = (layer.transform.y ?? 0) - step;
      if (e.key === 'ArrowDown') layer.transform.y = (layer.transform.y ?? 0) + step;
      liveSeek(); scheduleSave(); buildProps();
    }
  });
  window.addEventListener('resize', fit);

  // browsers block audio until a user gesture — kick playback on first interaction
  const kick = () => { if (S.playing) VGP.seek(S.playhead, { playing: true }); window.removeEventListener('pointerdown', kick); };
  window.addEventListener('pointerdown', kick);

  // live SSE: doc edits (agent) + render progress
  const es = new EventSource('/api/events');
  es.onmessage = (ev) => {
    let m: any; try { m = JSON.parse(ev.data); } catch { return; }
    if (m.t === 'doc') { const j = JSON.stringify(m.ir); if (j === S.lastSyncJson) return; clearTimeout(saveTimer); S.ir = m.ir; S.lastSyncJson = j; pushHistory(j); captureSceneBase(); derive(); mountPreview(); buildTimeline(); renderRight(); setDot('edited', 'agent edit ✦'); setTimeout(() => setDot('saved', 'synced'), 1400); }
    if (m.t === 'render') {
      showRender(true);
      if (m.state === 'rendering') { $('renderFill').style.width = m.pct + '%'; $('renderPct').textContent = m.pct + '%'; $('renderLabel').textContent = `Rendering frame ${m.done}/${m.total}`; }
      else if (m.state === 'done') { $('renderFill').style.width = '100%'; $('renderPct').textContent = '100%'; $('renderLabel').textContent = '✓ Export complete'; setTimeout(() => { showRender(false); if (m.url) window.open(m.url, '_blank'); }, 1000); }
      else if (m.state === 'error') { $('renderLabel').textContent = '✕ Render failed'; setTimeout(() => showRender(false), 3000); }
    }
  };
}
init();
