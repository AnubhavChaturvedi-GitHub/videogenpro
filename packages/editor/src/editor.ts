// VideoGenPro Studio — CapCut-style editor over the Scene IR.
// IR is the single source of truth, shared with the agent via the dev server:
//   UI edit -> POST -> disk (agent reads the diff) ; agent edits disk -> SSE -> UI updates live
import { buildManifest } from '../../core/src/index';

declare const VGP: any;
const MANIFEST = buildManifest();
const MAN = new Map(MANIFEST.map((e) => [e.id, e]));
const LABELW = 92;

const clipColor: Record<string, string> = {
  text: 'var(--clip-text)', image: 'var(--clip-image)', three: 'var(--clip-three)',
  shape: 'var(--clip-shape)', html: 'var(--clip-html)', video: 'var(--clip-video)',
};
const typeIcon: Record<string, string> = { text: 'T', image: '🖼', three: '✦', shape: '◼', video: '▶', html: '</>' };

type State = {
  ir: any; assetBase: string; assets: any[];
  selected: { s: number; l: number } | null;
  playhead: number; playing: boolean; loop: boolean; pxPerSec: number;
  offsets: number[]; total: number; lastSyncJson: string;
};
const S: State = {
  ir: null, assetBase: '/', assets: [], selected: null,
  playhead: 0, playing: true, loop: true, pxPerSec: 120,
  offsets: [], total: 0, lastSyncJson: '',
};

const $ = (id: string) => document.getElementById(id)!;
const el = (tag: string, cls?: string) => { const e = document.createElement(tag); if (cls) e.className = cls; return e; };
const baseUrl = () => new URL(S.assetBase, location.origin).href;
const assetUrl = (src: string) => new URL(src, baseUrl()).href;

function derive() {
  S.offsets = []; let acc = 0;
  for (const sc of S.ir.scenes) { S.offsets.push(acc); acc += sc.duration; }
  S.total = acc;
  if (S.playhead > S.total) S.playhead = 0;
}
function sceneAt(t: number) { let si = 0; for (let i = S.offsets.length - 1; i >= 0; i--) if (t >= S.offsets[i]) { si = i; break; } return si; }

// ---------- preview ----------
function fit() {
  const wrap = $('stage').parentElement!.parentElement! as HTMLElement;
  const pad = 36;
  const s = Math.min((wrap.clientWidth - pad) / S.ir.width, (wrap.clientHeight - pad) / S.ir.height, 1);
  const scaler = $('scaler');
  scaler.style.width = S.ir.width + 'px'; scaler.style.height = S.ir.height + 'px';
  scaler.style.transform = `scale(${s})`;
}
function mountPreview() {
  VGP.mount(S.ir, { assetBase: baseUrl() });
  fit(); VGP.seek(S.playhead);
}
const liveSeek = () => VGP.seek(S.playhead);

// ---------- sync ----------
let saveTimer: any;
function setDot(state: 'saved' | 'saving' | 'edited', text?: string) { $('syncDot').className = 'dot ' + state; $('syncText').textContent = text ?? state; }
function scheduleSave() {
  setDot('edited');
  clearTimeout(saveTimer);
  saveTimer = setTimeout(async () => {
    const body = JSON.stringify(S.ir); S.lastSyncJson = body; setDot('saving');
    try {
      const r = await fetch('/api/composition', { method: 'POST', headers: { 'content-type': 'application/json' }, body });
      setDot(r.ok ? 'saved' : 'edited', r.ok ? 'synced' : 'invalid');
    } catch { setDot('edited', 'offline'); }
  }, 250);
}
const liveEdit = () => { liveSeek(); scheduleSave(); };
const timingEdit = () => { liveSeek(); buildTimeline(); scheduleSave(); };
const structuralEdit = () => { mountPreview(); buildTimeline(); buildProps(); scheduleSave(); };

// ---------- layer factories ----------
const newText = () => ({ type: 'text', text: 'New Text', style: { fontSize: '72px', color: '#ffffff' }, duration: 2, presets: [{ id: 'text.fade-up' }], transform: {} });
const newShape = () => ({ type: 'shape', shape: 'rect', fill: '#3b82f6', rect: { x: 440, y: 290, w: 400, h: 140 }, duration: 2, presets: [], transform: {} });
const new3D = () => ({ type: 'three', scene: 'particles', props: { speed: 0.3 }, duration: 3, presets: [], transform: {} });
const newAssetLayer = (a: any) => ({ type: a.type, src: a.src, fit: 'cover', duration: 2.5, presets: [a.type === 'image' ? { id: 'image.ken-burns' } : null].filter(Boolean), transform: {} });

function addLayerAtPlayhead(layer: any) {
  const si = sceneAt(S.playhead);
  layer.start = Math.max(0, +(S.playhead - S.offsets[si]).toFixed(2));
  S.ir.scenes[si].layers.push(layer);
  S.selected = { s: si, l: S.ir.scenes[si].layers.length - 1 };
  structuralEdit();
}
function dropLayerAt(clientX: number, layer: any) {
  const r = $('tlInner').getBoundingClientRect();
  const t = Math.max(0, Math.min(S.total, (clientX - r.left - LABELW) / S.pxPerSec));
  const si = sceneAt(t);
  layer.start = Math.max(0, +(t - S.offsets[si]).toFixed(2));
  S.ir.scenes[si].layers.push(layer);
  S.selected = { s: si, l: S.ir.scenes[si].layers.length - 1 };
  structuralEdit();
}

// ---------- assets ----------
async function loadAssets() { try { const r = await fetch('/api/assets'); S.assets = await r.json(); } catch { S.assets = []; } renderAssets(); }
async function uploadFiles(files: FileList | File[]) {
  for (const f of Array.from(files)) {
    const type = f.type.startsWith('video') ? 'video' : 'image';
    try {
      const r = await fetch('/api/upload?name=' + encodeURIComponent(f.name) + '&type=' + type, { method: 'POST', body: f });
      const a = await r.json(); if (a && a.src) S.assets.unshift(a);
    } catch {}
  }
  renderAssets();
}
function renderAssets() {
  const g = $('assetGrid'); g.innerHTML = '';
  if (!S.assets.length) { const e = el('div', 'empty'); e.style.fontSize = '11px'; e.textContent = 'No assets yet'; g.appendChild(e); return; }
  S.assets.forEach((a) => {
    const d = el('div', 'asset'); d.draggable = true;
    const url = assetUrl(a.src);
    if (a.type === 'video') { const v = el('video') as HTMLVideoElement; v.src = url; v.muted = true; d.appendChild(v); }
    else { const im = el('img') as HTMLImageElement; im.src = url; d.appendChild(im); }
    const b = el('div', 'badge'); b.textContent = a.type; d.appendChild(b);
    const nm = el('div', 'nm'); nm.textContent = a.name; d.appendChild(nm);
    d.ondragstart = (e) => e.dataTransfer!.setData('application/x-vgp-asset', JSON.stringify(a));
    g.appendChild(d);
  });
}

// ---------- timeline ----------
function rows() {
  const out: { s: number; l: number; scene: any; layer: any }[] = [];
  S.ir.scenes.forEach((scene: any, s: number) => scene.layers.forEach((layer: any, l: number) => out.push({ s, l, scene, layer })));
  return out;
}
function buildTimeline() {
  derive();
  const inner = $('tlInner'); inner.innerHTML = '';
  const width = LABELW + S.total * S.pxPerSec + 40;
  inner.style.width = width + 'px';

  const ruler = el('div', 'ruler'); ruler.style.width = width + 'px';
  for (let t = 0; t <= Math.ceil(S.total); t++) {
    const tick = el('div', 'tick'); tick.style.left = (LABELW + t * S.pxPerSec) + 'px'; tick.textContent = t + 's'; ruler.appendChild(tick);
  }
  S.ir.scenes.forEach((sc: any, i: number) => {
    const band = el('div', 'scene-band');
    band.style.left = (LABELW + S.offsets[i] * S.pxPerSec) + 'px';
    band.style.width = (sc.duration * S.pxPerSec) + 'px'; ruler.appendChild(band);
  });
  ruler.onmousedown = (e: MouseEvent) => {
    const seekFrom = (ev: MouseEvent) => {
      const x = ev.clientX - ruler.getBoundingClientRect().left - LABELW;
      seekTo(x / S.pxPerSec); S.playing = false; ($('tpPlay') as HTMLButtonElement).textContent = '▶';
    };
    seekFrom(e);
    const mv = (ev: MouseEvent) => seekFrom(ev);
    const up = () => { window.removeEventListener('mousemove', mv); window.removeEventListener('mouseup', up); };
    window.addEventListener('mousemove', mv); window.addEventListener('mouseup', up);
  };
  inner.appendChild(ruler);

  rows().forEach((r) => {
    const track = el('div', 'track');
    const label = el('div', 'track-label');
    const name = r.layer.type === 'text' ? `T: ${String(r.layer.text).slice(0, 9)}` : r.layer.type;
    label.textContent = name; label.title = name; track.appendChild(label);

    const offset = S.offsets[r.s] + (r.layer.start ?? 0);
    const dur = r.layer.duration ?? r.scene.duration;
    const clip = el('div', 'clip');
    clip.style.left = (LABELW + offset * S.pxPerSec) + 'px';
    clip.style.width = Math.max(22, dur * S.pxPerSec) + 'px';
    clip.style.background = clipColor[r.layer.type] ?? '#555';
    const ic = el('span', 'dotmark'); ic.textContent = typeIcon[r.layer.type] ?? '●'; clip.appendChild(ic);
    const tx = el('span'); tx.textContent = name; clip.appendChild(tx);
    if (S.selected && S.selected.s === r.s && S.selected.l === r.l) clip.classList.add('sel');
    const handle = el('div', 'handle'); clip.appendChild(handle);

    clip.onmousedown = (e: MouseEvent) => {
      if (e.target === handle) return;
      e.preventDefault();
      const startX = e.clientX, origStart = r.layer.start ?? 0; let moved = false;
      const mv = (ev: MouseEvent) => {
        const dx = ev.clientX - startX; if (Math.abs(dx) > 3) moved = true;
        let ns = Math.max(0, Math.min(r.scene.duration - 0.1, origStart + dx / S.pxPerSec));
        r.layer.start = +ns.toFixed(3);
        clip.style.left = (LABELW + (S.offsets[r.s] + r.layer.start) * S.pxPerSec) + 'px';
      };
      const up = () => { window.removeEventListener('mousemove', mv); window.removeEventListener('mouseup', up); if (moved) timingEdit(); else select(r.s, r.l); };
      window.addEventListener('mousemove', mv); window.addEventListener('mouseup', up);
    };
    handle.onmousedown = (e: MouseEvent) => {
      e.preventDefault(); e.stopPropagation();
      const startX = e.clientX, origDur = r.layer.duration ?? r.scene.duration;
      const mv = (ev: MouseEvent) => {
        let nd = Math.max(0.1, Math.min(r.scene.duration - (r.layer.start ?? 0), origDur + (ev.clientX - startX) / S.pxPerSec));
        r.layer.duration = +nd.toFixed(3); clip.style.width = Math.max(22, r.layer.duration * S.pxPerSec) + 'px';
      };
      const up = () => { window.removeEventListener('mousemove', mv); window.removeEventListener('mouseup', up); timingEdit(); };
      window.addEventListener('mousemove', mv); window.addEventListener('mouseup', up);
    };
    track.appendChild(clip); inner.appendChild(track);
  });

  const ph = el('div', 'playhead'); ph.id = 'playhead'; inner.appendChild(ph);
  positionPlayhead();
}
function positionPlayhead() {
  const ph = document.getElementById('playhead'); if (!ph) return;
  ph.style.left = (LABELW + S.playhead * S.pxPerSec) + 'px';
  ph.style.height = $('tlInner').scrollHeight + 'px';
}

// ---------- selection + properties (with animation gallery) ----------
function select(s: number, l: number) { S.selected = { s, l }; buildTimeline(); buildProps(); }

function numField(label: string, value: number, min: number, max: number, step: number, onIn: (v: number) => void) {
  const f = el('div', 'field');
  const lab = el('label'); lab.textContent = label; f.appendChild(lab);
  const row = el('div', 'row');
  const r = el('input') as HTMLInputElement; r.type = 'range'; r.min = String(min); r.max = String(max); r.step = String(step); r.value = String(value);
  const v = el('span', 'val'); v.textContent = (+value).toFixed(2);
  r.oninput = () => { const nv = parseFloat(r.value); v.textContent = nv.toFixed(2); onIn(nv); };
  row.appendChild(r); row.appendChild(v); f.appendChild(row); return f;
}
function buildProps() {
  const p = $('props'); p.innerHTML = '';
  if (!S.selected) { p.innerHTML = '<div class="empty">Select a clip in the timeline to edit it and pick animations.</div>'; return; }
  const { s, l } = S.selected;
  const scene = S.ir.scenes[s]; const layer = scene?.layers[l];
  if (!layer) { S.selected = null; return buildProps(); }
  const h = (t: string) => { const x = el('h3'); x.textContent = t; p.appendChild(x); };

  // header
  const head = el('div', 'sel-head');
  const pill = el('span', 'pill'); pill.textContent = layer.type; pill.style.background = clipColor[layer.type] ?? '#555'; head.appendChild(pill);
  const title = el('span'); title.textContent = layer.type === 'text' ? String(layer.text).slice(0, 18) : (layer.src ? String(layer.src).split('/').pop() : layer.type); title.style.flex = '1'; title.style.fontWeight = '600'; head.appendChild(title);
  const del = el('button'); del.textContent = '🗑'; del.style.background = '#3a2030'; del.style.padding = '4px 8px';
  del.onclick = () => { scene.layers.splice(l, 1); S.selected = null; structuralEdit(); };
  head.appendChild(del); p.appendChild(head);

  // type-specific content
  if (layer.type === 'text') {
    const f = el('div', 'field'); const lab = el('label'); lab.textContent = 'text'; f.appendChild(lab);
    const ta = el('textarea') as HTMLTextAreaElement; ta.value = layer.text;
    ta.oninput = () => { layer.text = ta.value; structuralEdit(); }; f.appendChild(ta); p.appendChild(f);
    layer.style = layer.style || {};
    p.appendChild(numField('font size', parseInt(layer.style.fontSize || '72'), 12, 220, 1, (v) => { layer.style.fontSize = Math.round(v) + 'px'; structuralEdit(); }));
    const cf = el('div', 'field'); const cl = el('label'); cl.textContent = 'color'; cf.appendChild(cl);
    const ci = el('input') as HTMLInputElement; ci.type = 'text'; ci.value = layer.style.color || '#ffffff';
    ci.oninput = () => { layer.style.color = ci.value; structuralEdit(); }; cf.appendChild(ci); p.appendChild(cf);
  }
  if (layer.type === 'image' || layer.type === 'video') {
    const cf = el('div', 'field'); const cl = el('label'); cl.textContent = 'fit'; cf.appendChild(cl);
    const sel = el('select') as HTMLSelectElement;
    ['cover', 'contain'].forEach((o) => { const op = el('option') as HTMLOptionElement; op.value = o; op.textContent = o; if ((layer.fit ?? 'cover') === o) op.selected = true; sel.appendChild(op); });
    sel.onchange = () => { layer.fit = sel.value; structuralEdit(); }; cf.appendChild(sel); p.appendChild(cf);
  }
  if (layer.type === 'shape') {
    const cf = el('div', 'field'); const cl = el('label'); cl.textContent = 'fill color'; cf.appendChild(cl);
    const ci = el('input') as HTMLInputElement; ci.type = 'text'; ci.value = layer.fill || '#3b82f6';
    ci.oninput = () => { layer.fill = ci.value; structuralEdit(); }; cf.appendChild(ci); p.appendChild(cf);
  }

  // ---- APPLIED animations ----
  layer.presets = layer.presets || [];
  h('✦ applied animations');
  if (!layer.presets.length) { const e = el('div', 'empty'); e.style.padding = '6px 0'; e.style.fontSize = '11px'; e.textContent = 'none — pick one below'; p.appendChild(e); }
  layer.presets.forEach((inst: any, idx: number) => {
    const entry = MAN.get(inst.id); const card = el('div', 'preset-card');
    const hd = el('div', 'head'); const b = el('b'); b.textContent = inst.id; hd.appendChild(b);
    const rm = el('button'); rm.textContent = '✕'; rm.onclick = () => { layer.presets.splice(idx, 1); structuralEdit(); }; hd.appendChild(rm); card.appendChild(hd);
    if (entry) {
      inst.params = inst.params || {};
      for (const [pk, spec] of Object.entries<any>(entry.params)) {
        const cur = inst.params[pk] ?? spec.default;
        const min = spec.min ?? 0, max = spec.max ?? (spec.default * 2 || 1);
        card.appendChild(numField(pk, cur, min, max, (max - min) / 100 || 0.01, (v) => { inst.params[pk] = v; liveEdit(); }));
      }
    }
    p.appendChild(card);
  });

  // ---- ADD animation gallery (filtered by layer type) ----
  const cat = layer.type === 'text' ? 'text' : 'image';
  h(`＋ ${cat} animations`);
  const grid = el('div', 'anim-grid');
  MANIFEST.filter((e) => e.category === cat).forEach((e) => {
    const card = el('div', 'anim-card');
    const nm = el('div', 'nm'); nm.textContent = e.id.split('.')[1]; card.appendChild(nm);
    const ds = el('div', 'ds'); ds.textContent = e.description; card.appendChild(ds);
    const pl = el('div', 'plus'); pl.textContent = '＋'; card.appendChild(pl);
    card.onclick = () => { layer.presets.push({ id: e.id, params: {} }); S.playhead = S.offsets[s] + (layer.start ?? 0) + 0.01; structuralEdit(); positionPlayhead(); };
    grid.appendChild(card);
  });
  p.appendChild(grid);

  h('timing');
  p.appendChild(numField('start (s)', layer.start ?? 0, 0, scene.duration, 0.05, (v) => { layer.start = v; timingEdit(); }));
  p.appendChild(numField('duration (s)', layer.duration ?? scene.duration, 0.1, scene.duration, 0.05, (v) => { layer.duration = v; timingEdit(); }));

  h('transform');
  layer.transform = layer.transform || {}; const tf = layer.transform;
  p.appendChild(numField('x', tf.x ?? 0, -600, 600, 1, (v) => { tf.x = v; liveEdit(); }));
  p.appendChild(numField('y', tf.y ?? 0, -600, 600, 1, (v) => { tf.y = v; liveEdit(); }));
  p.appendChild(numField('scale', tf.scale ?? 1, 0, 3, 0.01, (v) => { tf.scale = v; liveEdit(); }));
  p.appendChild(numField('rotate', tf.rotate ?? 0, -180, 180, 1, (v) => { tf.rotate = v; liveEdit(); }));
  p.appendChild(numField('opacity', tf.opacity ?? 1, 0, 1, 0.01, (v) => { tf.opacity = v; liveEdit(); }));
}

// ---------- playback ----------
function updateTime() { $('tpTime').textContent = S.playhead.toFixed(2); $('tpTotal').textContent = ' / ' + S.total.toFixed(2) + 's'; }
function seekTo(t: number) { S.playhead = Math.max(0, Math.min(S.total, t)); liveSeek(); positionPlayhead(); updateTime(); }
function togglePlay() { S.playing = !S.playing; ($('tpPlay') as HTMLButtonElement).textContent = S.playing ? '⏸' : '▶'; last = performance.now(); }
let last = performance.now();
function loop(now: number) {
  if (S.playing) {
    S.playhead += (now - last) / 1000;
    if (S.playhead >= S.total) { if (S.loop) S.playhead = 0; else { S.playhead = S.total; togglePlay(); } }
    liveSeek(); positionPlayhead(); updateTime();
  }
  last = now; requestAnimationFrame(loop);
}

// ---------- init ----------
async function init() {
  const data = await (await fetch('/api/composition')).json();
  S.ir = data.ir; S.assetBase = data.assetBase; S.lastSyncJson = JSON.stringify(S.ir);
  derive(); mountPreview(); await VGP.ready();
  buildTimeline(); buildProps(); updateTime(); await loadAssets();
  requestAnimationFrame((t) => { last = t; loop(t); });

  // transport
  $('tpPlay').onclick = togglePlay;
  $('tpStart').onclick = () => seekTo(0);
  $('tpBack').onclick = () => seekTo(S.playhead - 1);
  $('tpFwd').onclick = () => seekTo(S.playhead + 1);
  $('tpLoop').onclick = () => { S.loop = !S.loop; ($('tpLoop') as HTMLElement).style.opacity = S.loop ? '1' : '.45'; };
  $('zoomIn').onclick = () => { S.pxPerSec = Math.min(600, S.pxPerSec * 1.3); buildTimeline(); };
  $('zoomOut').onclick = () => { S.pxPerSec = Math.max(30, S.pxPerSec / 1.3); buildTimeline(); };
  window.addEventListener('keydown', (e) => { if (e.code === 'Space' && (e.target as HTMLElement).tagName !== 'TEXTAREA' && (e.target as HTMLElement).tagName !== 'INPUT') { e.preventDefault(); togglePlay(); } });
  window.addEventListener('resize', fit);

  // add-layer buttons
  $('addText').onclick = () => addLayerAtPlayhead(newText());
  $('addShape').onclick = () => addLayerAtPlayhead(newShape());
  $('add3D').onclick = () => addLayerAtPlayhead(new3D());

  // upload (panel)
  const fi = $('fileInput') as HTMLInputElement;
  $('drop').onclick = () => fi.click();
  fi.onchange = () => fi.files && uploadFiles(fi.files);
  const drop = $('drop');
  drop.ondragover = (e) => { e.preventDefault(); drop.classList.add('over'); };
  drop.ondragleave = () => drop.classList.remove('over');
  drop.ondrop = (e: DragEvent) => { e.preventDefault(); drop.classList.remove('over'); if (e.dataTransfer?.files.length) uploadFiles(e.dataTransfer.files); };

  // drag-drop onto timeline
  const tl = $('tlScroll');
  tl.addEventListener('dragover', (e) => { e.preventDefault(); tl.classList.add('over'); });
  tl.addEventListener('dragleave', () => tl.classList.remove('over'));
  tl.addEventListener('drop', async (e: DragEvent) => {
    e.preventDefault(); tl.classList.remove('over');
    const data = e.dataTransfer?.getData('application/x-vgp-asset');
    if (data) { dropLayerAt(e.clientX, newAssetLayer(JSON.parse(data))); return; }
    if (e.dataTransfer?.files.length) { const before = S.assets.length; await uploadFiles(e.dataTransfer.files); const added = S.assets[0]; if (S.assets.length > before && added) dropLayerAt(e.clientX, newAssetLayer(added)); }
  });

  // export
  $('export').onclick = async () => {
    const b = $('export') as HTMLButtonElement; const t0 = b.textContent; b.textContent = '⏳ Rendering…'; b.disabled = true;
    try { const j = await (await fetch('/api/render', { method: 'POST' })).json(); if (j.ok) window.open(j.url, '_blank'); else alert('render failed: ' + (j.error || '')); }
    catch { alert('render error'); }
    b.textContent = t0; b.disabled = false;
  };

  // live sync from agent
  const es = new EventSource('/api/events');
  es.onmessage = (ev) => {
    if (ev.data === S.lastSyncJson) return;
    let parsed: any; try { parsed = JSON.parse(ev.data); } catch { return; }
    S.ir = parsed; S.lastSyncJson = ev.data;
    derive(); mountPreview(); buildTimeline(); buildProps();
    setDot('edited', 'agent edit ✦'); setTimeout(() => setDot('saved', 'synced'), 1400);
  };
}
init();
