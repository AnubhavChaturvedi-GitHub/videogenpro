// Dev server for VideoGenPro Studio.
// The active composition file on disk is the source of truth shared with the agent:
//   • UI edits  -> POST /api/composition -> file written  (agent reads the diff)
//   • file edits (by the agent) -> SSE {t:'doc'} -> UI updates live
//   • export    -> POST /api/render streams SSE {t:'render', pct} progress
import { createServer, type ServerResponse } from 'node:http';
import { readFileSync, writeFileSync, existsSync, watch, statSync, createReadStream, readdirSync, mkdirSync, copyFileSync, type FSWatcher } from 'node:fs';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, relative, extname, normalize, join, isAbsolute, sep } from 'node:path';
import { homedir } from 'node:os';
import { validateComposition } from '../../core/src/index';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '../../..');

const VIDEO_EXT = new Set(['.mp4', '.webm', '.mov', '.m4v']);
const IMAGE_EXT = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg']);
const AUDIO_EXT = new Set(['.mp3', '.wav', '.m4a', '.ogg']);
const assetType = (f: string) => { const e = extname(f).toLowerCase(); return VIDEO_EXT.has(e) ? 'video' : AUDIO_EXT.has(e) ? 'audio' : 'image'; };
// True only when `f` is `root` itself or strictly contained within it (separator boundary),
// so a sibling dir sharing the prefix (e.g. `<root>-evil`) cannot bypass the guard.
const withinRoot = (f: string) => { const r = relative(root, f); return r === '' || (!r.startsWith('..' + sep) && r !== '..' && !isAbsolute(r)); };

// === After-Effects "one file, assets travel with it" model =================================
// Assets live in an `assets/` folder CO-LOCATED with the active composition, so the IR is
// self-contained: every media `src` is stored RELATIVE to the comp dir (e.g. `assets/foo.png`)
// and therefore still resolves when the project is opened or moved.
const assetsDirFor = (f: string) => join(dirname(f), 'assets');
// Strip any directory parts and keep only a safe basename for a derived on-disk filename.
const sanitizeAssetName = (n: string) => (n.split(/[\\/]/).pop() || 'file').replace(/[^a-zA-Z0-9._-]/g, '_').replace(/^\.+/, '') || 'file';
// Always store paths with forward slashes so the IR is portable across platforms.
const toPosix = (p: string) => p.split(/[\\/]/).join('/');
// Copy `bytes` into the comp's assets/ dir under a de-duped name. If a file with the same name
// already exists AND is byte-identical, reuse it; otherwise append -1/-2/... until unique.
// Returns { name, rel } where rel is the comp-relative path to store in the IR (`assets/<name>`).
function importBytes(compDir: string, rawName: string, bytes: Buffer): { name: string; rel: string } {
  const destDir = join(compDir, 'assets'); mkdirSync(destDir, { recursive: true });
  const safe = sanitizeAssetName(rawName);
  const ext = extname(safe); const stem = ext ? safe.slice(0, -ext.length) : safe;
  let name = safe; let n = 0;
  while (existsSync(join(destDir, name))) {
    try { if (Buffer.compare(readFileSync(join(destDir, name)), bytes) === 0) break; } catch {} // identical bytes → reuse
    name = `${stem}-${++n}${ext}`;
  }
  const full = join(destDir, name);
  if (!existsSync(full)) writeFileSync(full, bytes);
  return { name, rel: 'assets/' + name };
}

let active = resolve(process.cwd(), process.argv[2] ?? 'examples/hello.json');
if (!existsSync(active)) { console.error('composition not found:', active); process.exit(1); }
// The exact bytes we last wrote to / read from `active`. When the file-watcher fires for
// OUR OWN write, the on-disk bytes equal this → we skip the broadcast, so a user's save
// never echoes back as a phantom "agent edit" and can't start the save↔SSE wipe-loop (bug #3).
let knownBytes = '';
const PORT = Number(process.argv[3] ?? 5174);
const projectsDir = dirname(active);
const assetBaseFor = (f: string) => '/' + relative(root, dirname(f)).split(/[\\/]/).join('/') + '/';

const MIME: Record<string, string> = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml',
  '.mp4': 'video/mp4', '.webm': 'video/webm', '.woff2': 'font/woff2', '.gif': 'image/gif', '.webp': 'image/webp',
};

const sse = new Set<ServerResponse>();
const send = (obj: any) => { const s = `data: ${JSON.stringify(obj)}\n\n`; for (const r of sse) r.write(s); };
let renderChild: ReturnType<typeof spawn> | null = null; // the active export child — tracked so the user can cancel it
let renderCancelled = false;
function broadcastDoc() {
  try {
    const txt = readFileSync(active, 'utf8');
    if (txt === knownBytes) return;   // our own write echoing back — don't bounce it to clients (bug #3)
    knownBytes = txt;
    send({ t: 'doc', ir: JSON.parse(txt) });
  } catch {}
}

let watcher: FSWatcher;
let wTimer: any;
function setWatch(file: string) {
  watcher?.close();
  watcher = watch(file, () => { clearTimeout(wTimer); wTimer = setTimeout(broadcastDoc, 60); });
}
setWatch(active);

const json = (res: ServerResponse, code: number, obj: any) => { res.writeHead(code, { 'content-type': 'application/json' }); res.end(JSON.stringify(obj)); };

const server = createServer((req, res) => {
 try {
  const url = new URL(req.url!, `http://localhost:${PORT}`);
  const path = url.pathname;

  if (path === '/api/composition' && req.method === 'GET') {
    const txt = readFileSync(active, 'utf8'); knownBytes = txt;
    return json(res, 200, { ir: JSON.parse(txt), assetBase: assetBaseFor(active), file: relative(root, active) });
  }

  if (path === '/api/composition' && req.method === 'POST') {
    let body = ''; req.on('data', (c) => (body += c));
    req.on('end', () => {
      try { validateComposition(JSON.parse(body)); knownBytes = body; writeFileSync(active, body); json(res, 200, { ok: true }); }
      catch (e: any) { json(res, 400, { ok: false, error: String(e?.message ?? e) }); }
    });
    return;
  }

  // list projects (.json compositions) in the project dir
  if (path === '/api/projects' && req.method === 'GET') {
    const list = readdirSync(projectsDir).filter((f) => f.endsWith('.json'))
      .map((f) => ({ name: f, path: relative(root, join(projectsDir, f)), active: join(projectsDir, f) === active }));
    return json(res, 200, list);
  }
  // open another project file
  if (path === '/api/open' && req.method === 'POST') {
    let body = ''; req.on('data', (c) => (body += c));
    req.on('end', () => {
      try {
        const { path: rel } = JSON.parse(body);
        const f = resolve(root, rel);
        if (!withinRoot(f) || !existsSync(f)) return json(res, 400, { ok: false, error: 'not found' });
        active = f; setWatch(active);
        const txt = readFileSync(active, 'utf8'); knownBytes = txt;
        json(res, 200, { ok: true, ir: JSON.parse(txt), assetBase: assetBaseFor(active), file: relative(root, active) });
      } catch (e: any) { json(res, 400, { ok: false, error: String(e?.message ?? e) }); }
    });
    return;
  }

  // create a NEW composition file and switch to it — the CURRENT file is left untouched
  // (After-Effects style: New makes a separate file, never overwrites what you had open).
  if (path === '/api/new' && req.method === 'POST') {
    let body = ''; req.on('data', (c) => (body += c));
    req.on('end', () => {
      try {
        const { name, width, height, ir } = JSON.parse(body || '{}');
        const dir = dirname(active);
        const base = String(name || 'untitled').trim().replace(/[^\w-]+/g, '-').replace(/(^-+|-+$)/g, '').toLowerCase() || 'untitled';
        let file = join(dir, base + '.json'); let n = 1;
        while (existsSync(file)) file = join(dir, `${base}-${n++}.json`); // never clobber an existing file
        let doc: any;
        if (ir) { doc = JSON.parse(JSON.stringify(ir)); validateComposition(doc); }      // imported content (validated)
        else doc = { fps: 30, width: Number(width) || 1920, height: Number(height) || 1080, scenes: [{ id: 'scene-1', duration: 5, background: '#0a0a0a', layers: [] }] };
        if (!doc.name) doc.name = String(name || 'Untitled').trim() || 'Untitled';
        const out = JSON.stringify(doc, null, 2); knownBytes = out; writeFileSync(file, out);
        mkdirSync(assetsDirFor(file), { recursive: true }); // AE model: a new project owns its own assets/ folder
        active = file; setWatch(active);
        json(res, 200, { ok: true, ir: doc, assetBase: assetBaseFor(active), file: relative(root, active) });
      } catch (e: any) { json(res, 400, { ok: false, error: String(e?.message ?? e) }); }
    });
    return;
  }

  if (path === '/api/assets' && req.method === 'GET') {
    const compDir = dirname(active);
    const out: any[] = []; const seen = new Set<string>();
    const scan = (dir: string, recurse: boolean) => {
      if (!existsSync(dir) || !withinRoot(dir)) return;
      for (const f of readdirSync(dir)) {
        const full = join(dir, f);
        if (statSync(full).isDirectory()) { if (recurse) scan(full, true); continue; }
        const ext = extname(f).toLowerCase();
        if (!VIDEO_EXT.has(ext) && !IMAGE_EXT.has(ext) && !AUDIO_EXT.has(ext)) continue;
        const src = toPosix(relative(compDir, full));
        if (seen.has(src)) continue; seen.add(src);
        out.push({ name: f, src, type: assetType(f) });
      }
    };
    // AE model: the project's CO-LOCATED assets/ folder is the primary source (recurse into it).
    scan(assetsDirFor(active), true);
    // …plus the legacy sibling assets/ dir, so pre-existing media still appears in the panel.
    scan(resolve(compDir, '..', 'assets'), true);
    return json(res, 200, out);
  }

  // Import a media file INTO the project (AE-style): the bytes are copied to the comp's
  // co-located assets/ folder and the returned `src` is RELATIVE to the comp dir
  // (`assets/<name>`), so the IR stays self-contained and the path always resolves.
  if (path === '/api/upload' && req.method === 'POST') {
    const name = sanitizeAssetName(url.searchParams.get('name') ?? 'file');
    // Trust the extension, not the client-provided MIME type: reject anything that
    // isn't a known image/video/audio extension, and derive the stored type from it.
    const ext = extname(name).toLowerCase();
    if (!IMAGE_EXT.has(ext) && !VIDEO_EXT.has(ext) && !AUDIO_EXT.has(ext)) return json(res, 400, { ok: false, error: 'unsupported file type' });
    const chunks: Buffer[] = []; req.on('data', (c) => chunks.push(c));
    req.on('end', () => {
      try {
        const { name: finalName, rel } = importBytes(dirname(active), name, Buffer.concat(chunks));
        json(res, 200, { ok: true, name: finalName, src: rel, type: assetType(finalName) });
      } catch (e: any) { json(res, 400, { ok: false, error: String(e?.message ?? e) }); }
    });
    return;
  }

  // "Collect Files" / make self-contained: copy every external (or non-co-located) media
  // asset referenced by the active comp into the project's assets/ dir, rewrite each path in
  // the IR to the local `assets/<name>`, persist the updated IR, and report how many moved.
  if (path === '/api/collect' && req.method === 'POST') {
    try {
      const txt = readFileSync(active, 'utf8'); knownBytes = txt;
      const ir = JSON.parse(txt);
      const compDir = dirname(active);
      const assetsDir = join(compDir, 'assets'); // assets/ co-located with the comp
      let copied = 0;
      // Resolve a stored src to an absolute on-disk path. Already-local `assets/...` paths
      // resolve under the project; legacy `../assets/...` resolve to the sibling dir; bare
      // names resolve relative to the comp dir too. (We only collect things we can find.)
      const collectSrc = (src: string): string => {
        if (typeof src !== 'string' || !src) return src;
        if (/^(https?:|data:)/i.test(src)) return src; // remote/data — can't copy from disk, leave as-is
        const abs = isAbsolute(src) ? src : resolve(compDir, src);
        // Skip ones already inside the project's assets/ dir.
        const r = relative(assetsDir, abs);
        if (r === '' || (!r.startsWith('..' + sep) && r !== '..' && !isAbsolute(r))) return src;
        if (!existsSync(abs) || statSync(abs).isDirectory()) return src; // missing — leave reference untouched
        const { rel } = importBytes(compDir, abs, readFileSync(abs));
        copied++;
        return rel;
      };
      for (const sc of ir.scenes ?? []) for (const l of sc.layers ?? []) {
        if ((l.type === 'image' || l.type === 'video') && l.src) l.src = collectSrc(l.src);
      }
      for (const a of ir.audio ?? []) { if (a.src) a.src = collectSrc(a.src); }
      const out = JSON.stringify(ir, null, 2); knownBytes = out; writeFileSync(active, out);
      return json(res, 200, { ok: true, ir, copied });
    } catch (e: any) { return json(res, 400, { ok: false, error: String(e?.message ?? e) }); }
  }

  // export with streamed progress over SSE. Body: { height?, name?, dir? } — resolution,
  // filename and save folder chosen in the editor's export dialog.
  if (path === '/api/render' && req.method === 'POST') {
    let body = ''; req.on('data', (c) => (body += c));
    req.on('end', () => {
      let opts: any = {}; try { opts = JSON.parse(body || '{}'); } catch {}
      const relComp = relative(root, active);
      const name = ((String(opts.name || 'render').split(/[\\/]/).pop() || 'render').replace(/\.mp4$/i, '').replace(/[^a-zA-Z0-9._ -]/g, '_').replace(/^\.+/, '').trim() || 'render') + '.mp4';
      let dir = (typeof opts.dir === 'string' && opts.dir) ? opts.dir : resolve(root, 'out');
      try { mkdirSync(dir, { recursive: true }); } catch { dir = resolve(root, 'out'); mkdirSync(dir, { recursive: true }); }
      const outAbs = join(dir, name);
      const height = Number(opts.height) > 0 ? String(Math.round(Number(opts.height))) : '';
      const args = ['tsx', 'packages/cli/src/render.ts', relComp, outAbs]; if (height) args.push(height);
      send({ t: 'render', state: 'start', pct: 0, done: 0, total: 0 });
      const child = spawn('npx', args, { cwd: root, detached: true }); // detached → own group, cancellable as a tree
      renderChild = child; renderCancelled = false;
      let sbuf = '', log = '', replied = false;
      child.stdout.on('data', (d) => {
        sbuf += d; let i;
        while ((i = sbuf.indexOf('\n')) >= 0) {
          const line = sbuf.slice(0, i); sbuf = sbuf.slice(i + 1);
          const m = line.match(/^@P (\d+) (\d+)/);
          if (m) { const done = +m[1], total = +m[2]; send({ t: 'render', state: 'rendering', done, total, pct: Math.round((done / total) * 100) }); }
        }
      });
      child.stderr.on('data', (d) => (log += d));
      child.on('error', (err: any) => {
        renderChild = null; if (replied) return; replied = true;
        const error = String(err?.message ?? err); send({ t: 'render', state: 'error', error }); json(res, 200, { ok: false, error });
      });
      child.on('close', (code) => {
        renderChild = null; if (replied) return; replied = true;
        if (renderCancelled) { send({ t: 'render', state: 'cancelled' }); return json(res, 200, { ok: false, cancelled: true }); }
        if (code === 0) {
          const url2 = withinRoot(outAbs) ? '/' + relative(root, outAbs).split(/[\\/]/).join('/') + '?t=' + Date.now() : null;
          send({ t: 'render', state: 'done', pct: 100, path: outAbs, url: url2 });
          json(res, 200, { ok: true, path: outAbs, url: url2 });
        } else { send({ t: 'render', state: 'error', error: log.slice(-300) }); json(res, 200, { ok: false, error: log.slice(-300) }); }
      });
    });
    return;
  }

  // open a finished render in the OS default app ("open the video in my local system")
  if (path === '/api/reveal' && req.method === 'POST') {
    let body = ''; req.on('data', (c) => (body += c));
    req.on('end', () => {
      try {
        const { path: p } = JSON.parse(body || '{}');
        if (typeof p !== 'string' || !existsSync(p) || !statSync(p).isFile()) return json(res, 400, { ok: false, error: 'file not found' });
        const opener = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'explorer' : 'xdg-open';
        spawn(opener, [p], { detached: true, stdio: 'ignore' }).unref();
        json(res, 200, { ok: true });
      } catch (e: any) { json(res, 400, { ok: false, error: String(e?.message ?? e) }); }
    });
    return;
  }

  // common save locations for the export dialog
  if (path === '/api/locations' && req.method === 'GET') {
    const home = homedir();
    const locs = [
      { label: 'Project folder', path: dirname(active) },
      { label: 'Desktop', path: join(home, 'Desktop') },
      { label: 'Downloads', path: join(home, 'Downloads') },
      { label: 'Movies', path: join(home, 'Movies') },
      { label: 'Project / out', path: resolve(root, 'out') },
    ].filter((l) => { try { return existsSync(l.path) || l.label.startsWith('Project'); } catch { return false; } });
    return json(res, 200, locs);
  }

  // native folder picker so the user can save ANYWHERE, not just the presets ("Browse…").
  // Uses async spawn (never spawnSync) so the dialog blocking on the user doesn't freeze the server.
  if (path === '/api/pick-folder' && req.method === 'GET') {
    if (process.platform !== 'darwin') return json(res, 200, { ok: false, error: 'native folder picker is macOS-only' });
    const child = spawn('osascript', ['-e', 'POSIX path of (choose folder with prompt "Choose a folder to save the export")']);
    let out = '', done = false;
    const finish = (obj: any) => { if (done) return; done = true; json(res, 200, obj); };
    child.stdout.on('data', (d) => (out += d));
    child.on('error', () => finish({ ok: false, error: 'could not open the folder picker' }));
    child.on('close', (code) => { const p = out.trim(); finish(code === 0 && p ? { ok: true, path: p } : { ok: false, cancelled: true }); });
    return;
  }

  // cancel an in-flight export — kill the whole render process group (tsx + chromium + ffmpeg)
  if (path === '/api/render/cancel' && req.method === 'POST') {
    if (renderChild?.pid) { renderCancelled = true; try { process.kill(-renderChild.pid, 'SIGKILL'); } catch { try { renderChild.kill('SIGKILL'); } catch {} } return json(res, 200, { ok: true }); }
    return json(res, 200, { ok: false, error: 'no active render' });
  }

  if (path === '/api/events') {
    res.writeHead(200, { 'content-type': 'text/event-stream', 'cache-control': 'no-cache', connection: 'keep-alive' });
    res.write('retry: 1000\n\n'); sse.add(res); req.on('close', () => sse.delete(res));
    return;
  }

  // static
  let file = path === '/' ? resolve(root, 'packages/editor/index.html') : resolve(root, '.' + normalize(path));
  if (!withinRoot(file)) { res.writeHead(403); return res.end('forbidden'); }
  if (!existsSync(file) || statSync(file).isDirectory()) { res.writeHead(404); return res.end('not found'); }
  res.writeHead(200, { 'content-type': MIME[extname(file)] ?? 'application/octet-stream', 'cache-control': 'no-cache' });
  createReadStream(file).pipe(res);
 } catch (e: any) {
  // A synchronous throw in any handler (e.g. the active file was deleted/renamed out
  // from under us → readFileSync ENOENT) must NOT crash the whole studio. Respond 500
  // and stay up (bug #2).
  try { if (!res.headersSent) json(res, 500, { ok: false, error: String(e?.message ?? e) }); else res.end(); } catch {}
 }
});

server.listen(PORT, () => {
  console.log(`\n  VideoGenPro Studio  →  http://localhost:${PORT}`);
  console.log(`  editing: ${relative(root, active)}   (assetBase ${assetBaseFor(active)})`);
  console.log(`  the agent reads/writes this file to co-edit with you.\n`);
});
