// Dev server for VideoGenPro Studio.
// The active composition file on disk is the source of truth shared with the agent:
//   • UI edits  -> POST /api/composition -> file written  (agent reads the diff)
//   • file edits (by the agent) -> SSE {t:'doc'} -> UI updates live
//   • export    -> POST /api/render streams SSE {t:'render', pct} progress
import { createServer, type ServerResponse } from 'node:http';
import { readFileSync, writeFileSync, existsSync, watch, statSync, createReadStream, readdirSync, mkdirSync, type FSWatcher } from 'node:fs';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, relative, extname, normalize, join, isAbsolute, sep } from 'node:path';
import { validateComposition } from '../../core/src/index';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '../../..');

const VIDEO_EXT = new Set(['.mp4', '.webm', '.mov', '.m4v']);
const IMAGE_EXT = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg']);
const assetType = (f: string) => (VIDEO_EXT.has(extname(f).toLowerCase()) ? 'video' : 'image');
// True only when `f` is `root` itself or strictly contained within it (separator boundary),
// so a sibling dir sharing the prefix (e.g. `<root>-evil`) cannot bypass the guard.
const withinRoot = (f: string) => { const r = relative(root, f); return r === '' || (!r.startsWith('..' + sep) && r !== '..' && !isAbsolute(r)); };

let active = resolve(process.cwd(), process.argv[2] ?? 'examples/hello.json');
if (!existsSync(active)) { console.error('composition not found:', active); process.exit(1); }
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
function broadcastDoc() {
  try { send({ t: 'doc', ir: JSON.parse(readFileSync(active, 'utf8')) }); } catch {}
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
  const url = new URL(req.url!, `http://localhost:${PORT}`);
  const path = url.pathname;

  if (path === '/api/composition' && req.method === 'GET')
    return json(res, 200, { ir: JSON.parse(readFileSync(active, 'utf8')), assetBase: assetBaseFor(active), file: relative(root, active) });

  if (path === '/api/composition' && req.method === 'POST') {
    let body = ''; req.on('data', (c) => (body += c));
    req.on('end', () => {
      try { validateComposition(JSON.parse(body)); writeFileSync(active, body); json(res, 200, { ok: true }); }
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
        json(res, 200, { ok: true, ir: JSON.parse(readFileSync(active, 'utf8')), assetBase: assetBaseFor(active), file: relative(root, active) });
      } catch (e: any) { json(res, 400, { ok: false, error: String(e?.message ?? e) }); }
    });
    return;
  }

  if (path === '/api/assets' && req.method === 'GET') {
    const assetsDir = resolve(dirname(active), '..', 'assets');
    const out: any[] = [];
    const scan = (dir: string) => {
      if (!existsSync(dir)) return;
      for (const f of readdirSync(dir)) {
        const full = join(dir, f);
        if (statSync(full).isDirectory()) { if (f === 'uploads') scan(full); continue; }
        const ext = extname(f).toLowerCase();
        if (!VIDEO_EXT.has(ext) && !IMAGE_EXT.has(ext)) continue;
        out.push({ name: f, src: relative(dirname(active), full).split(/[\\/]/).join('/'), type: assetType(f) });
      }
    };
    scan(assetsDir);
    return json(res, 200, out);
  }

  if (path === '/api/upload' && req.method === 'POST') {
    const name = (url.searchParams.get('name') ?? 'file').replace(/[^a-zA-Z0-9._-]/g, '_');
    // Trust the extension, not the client-provided MIME type: reject anything that
    // isn't a known image/video extension, and derive the stored type from it.
    const ext = extname(name).toLowerCase();
    if (!IMAGE_EXT.has(ext) && !VIDEO_EXT.has(ext)) return json(res, 400, { ok: false, error: 'unsupported file type' });
    const dest = resolve(dirname(active), '..', 'assets', 'uploads'); mkdirSync(dest, { recursive: true });
    const finalName = `${Date.now().toString(36)}-${name}`;
    const chunks: Buffer[] = []; req.on('data', (c) => chunks.push(c));
    req.on('end', () => { writeFileSync(join(dest, finalName), Buffer.concat(chunks)); json(res, 200, { name: finalName, src: `../assets/uploads/${finalName}`, type: assetType(finalName) }); });
    return;
  }

  // export with streamed progress over SSE
  if (path === '/api/render' && req.method === 'POST') {
    const relComp = relative(root, active);
    send({ t: 'render', state: 'start', pct: 0, done: 0, total: 0 });
    const child = spawn('npx', ['tsx', 'packages/cli/src/render.ts', relComp, 'out/studio-render.mp4'], { cwd: root });
    let buf = '', log = '', replied = false;
    child.stdout.on('data', (d) => {
      buf += d; let i;
      while ((i = buf.indexOf('\n')) >= 0) {
        const line = buf.slice(0, i); buf = buf.slice(i + 1);
        const m = line.match(/^@P (\d+) (\d+)/);
        if (m) { const done = +m[1], total = +m[2]; send({ t: 'render', state: 'rendering', done, total, pct: Math.round((done / total) * 100) }); }
      }
    });
    child.stderr.on('data', (d) => (log += d));
    // Spawn failure (e.g. tsx/ffmpeg not found) emits 'error' and may never fire 'close',
    // which would otherwise hang the request forever. Report it and broadcast over SSE.
    child.on('error', (err: any) => {
      if (replied) return; replied = true;
      const error = String(err?.message ?? err);
      send({ t: 'render', state: 'error', error });
      json(res, 200, { ok: false, error });
    });
    child.on('close', (code) => {
      if (replied) return; replied = true;
      if (code === 0) { const url2 = '/out/studio-render.mp4?t=' + Date.now(); send({ t: 'render', state: 'done', pct: 100, url: url2 }); json(res, 200, { ok: true, url: url2 }); }
      else { send({ t: 'render', state: 'error', error: log.slice(-300) }); json(res, 200, { ok: false, error: log.slice(-300) }); }
    });
    return;
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
});

server.listen(PORT, () => {
  console.log(`\n  VideoGenPro Studio  →  http://localhost:${PORT}`);
  console.log(`  editing: ${relative(root, active)}   (assetBase ${assetBaseFor(active)})`);
  console.log(`  the agent reads/writes this file to co-edit with you.\n`);
});
