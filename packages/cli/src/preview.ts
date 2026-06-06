// Generate a self-contained live-preview HTML (engine running in-browser) and
// print its path. Inlines the bundled runtime + the composition (with assets
// resolved to absolute file:// URLs) so it opens straight from file:// with no
// server and no fetch/CORS issues.
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, resolve } from 'node:path';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { validateComposition, compositionDuration } from '../../core/src/index';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '../../..');

const compPath = process.argv[2] ?? 'examples/hello.json';
const absComp = resolve(process.cwd(), compPath);
const comp: any = validateComposition(JSON.parse(readFileSync(absComp, 'utf8')));

const runtimePath = resolve(root, 'packages/renderer/dist/runtime.js');
if (!existsSync(runtimePath)) { console.error('runtime not built. run: pnpm build:runtime'); process.exit(1); }
const runtimeJs = readFileSync(runtimePath, 'utf8');

// resolve image/video srcs to absolute file:// URLs relative to the comp file
const assetBase = pathToFileURL(dirname(absComp) + '/').href;
for (const s of comp.scenes) for (const l of s.layers) {
  if ((l.type === 'image' || l.type === 'video') && l.src && !/^https?:|^file:/.test(l.src)) {
    l.src = new URL(l.src, assetBase).href;
  }
}
const duration = compositionDuration(comp);

const html = `<!doctype html><html><head><meta charset="utf-8"/>
<title>VideoGenPro — live preview</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  html,body { height:100%; background:#0a0c12; color:#cdd6f4; font-family:Inter,system-ui,sans-serif; overflow:hidden; }
  #wrap { position:fixed; inset:0; display:flex; align-items:center; justify-content:center; }
  #scaler { position:relative; }
  #stage { position:relative; box-shadow:0 20px 80px rgba(0,0,0,.6); border-radius:6px; overflow:hidden; }
  #bar { position:fixed; left:0; right:0; bottom:0; display:flex; align-items:center; gap:14px;
         padding:12px 18px; background:rgba(12,14,20,.85); backdrop-filter:blur(8px); }
  button { background:#3b82f6; color:#fff; border:0; border-radius:8px; padding:8px 16px; font-weight:600; cursor:pointer; }
  button:hover { background:#2563eb; }
  #seek { flex:1; accent-color:#3b82f6; }
  #t { font-variant-numeric:tabular-nums; font-size:13px; opacity:.8; min-width:90px; }
  #title { position:fixed; top:14px; left:18px; font-size:13px; opacity:.6; }
</style></head>
<body>
  <div id="title">VideoGenPro · live preview · ${comp.width}×${comp.height} @ ${comp.fps}fps</div>
  <div id="wrap"><div id="scaler"><div id="stage"></div></div></div>
  <div id="bar">
    <button id="play">⏸ Pause</button>
    <input id="seek" type="range" min="0" max="${duration.toFixed(3)}" step="0.01" value="0"/>
    <span id="t">0.00 / ${duration.toFixed(2)}s</span>
  </div>
  <script>${runtimeJs}</script>
  <script>
    const COMP = ${JSON.stringify(comp)};
    const DURATION = ${duration};
    const stage = document.getElementById('stage'), scaler = document.getElementById('scaler');
    VGP.mount(COMP);
    function fit(){
      const pad=120, sx=(innerWidth-40)/COMP.width, sy=(innerHeight-pad)/COMP.height;
      const s=Math.min(sx,sy,1);
      scaler.style.transform='scale('+s+')';
      scaler.style.width=COMP.width+'px'; scaler.style.height=COMP.height+'px';
    }
    addEventListener('resize', fit); fit();
    let playing=true, t=0, last=performance.now();
    const playBtn=document.getElementById('play'), seek=document.getElementById('seek'), tEl=document.getElementById('t');
    playBtn.onclick=()=>{ playing=!playing; playBtn.textContent=playing?'⏸ Pause':'▶ Play'; last=performance.now(); };
    seek.oninput=()=>{ t=parseFloat(seek.value); playing=false; playBtn.textContent='▶ Play'; VGP.seek(t); };
    async function start(){ await VGP.ready(); requestAnimationFrame(loop); }
    function loop(now){
      if(playing){ t+=(now-last)/1000; if(t>=DURATION) t=0; }
      last=now;
      VGP.seek(t);
      seek.value=t; tEl.textContent=t.toFixed(2)+' / '+DURATION.toFixed(2)+'s';
      requestAnimationFrame(loop);
    }
    start();
  </script>
</body></html>`;

mkdirSync(resolve(root, 'out'), { recursive: true });
const outFile = resolve(root, 'out/preview.html');
writeFileSync(outFile, html);
console.log(outFile);
