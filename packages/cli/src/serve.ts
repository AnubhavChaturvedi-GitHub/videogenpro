// Dev server for VideoGenPro Studio.
// The composition file on disk is the single source of truth shared with the agent:
//   • UI edits  -> POST /api/composition -> file written  (agent reads the diff)
//   • file edits (by the agent) -> SSE /api/events -> UI updates live
import { createServer } from 'node:http';
import { readFileSync, writeFileSync, existsSync, watch, statSync, createReadStream, readdirSync, mkdirSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, relative, extname, normalize, join } from 'node:path';
import { validateComposition } from '../../core/src/index';

const VIDEO_EXT = new Set(['.mp4', '.webm', '.mov', '.m4v']);
const IMAGE_EXT = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg']);
const assetType = (f: string) => (VIDEO_EXT.has(extname(f).toLowerCase()) ? 'video' : 'image');

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '../../..');

const compPath = resolve(process.cwd(), process.argv[2] ?? 'examples/hello.json');
if (!existsSync(compPath)) { console.error('composition not found:', compPath); process.exit(1); }
const PORT = Number(process.argv[3] ?? 5174);

// asset base = the composition's directory as a URL path, so relative srcs
// like "../assets/x.png" resolve the same way the renderer expects.
const assetBase = '/' + relative(root, dirname(compPath)).split(/[\\/]/).join('/') + '/';

const MIME: Record<string, string> = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml',
  '.mp4': 'video/mp4', '.webm': 'video/webm', '.woff2': 'font/woff2',
};

const sseClients = new Set<import('node:http').ServerResponse>();
function broadcast() {
  let payload: string;
  try { payload = JSON.stringify(JSON.parse(readFileSync(compPath, 'utf8'))); }
  catch { return; } // skip half-written / invalid files
  for (const res of sseClients) res.write(`data: ${payload}\n\n`);
}

// watch the composition file for external (agent) edits
let wTimer: any;
watch(compPath, () => { clearTimeout(wTimer); wTimer = setTimeout(broadcast, 60); });

const server = createServer((req, res) => {
  const url = new URL(req.url!, `http://localhost:${PORT}`);
  const path = url.pathname;

  // ---- API ----
  if (path === '/api/composition' && req.method === 'GET') {
    const ir = JSON.parse(readFileSync(compPath, 'utf8'));
    res.writeHead(200, { 'content-type': 'application/json' });
    return res.end(JSON.stringify({ ir, assetBase }));
  }
  if (path === '/api/composition' && req.method === 'POST') {
    let body = '';
    req.on('data', (c) => (body += c));
    req.on('end', () => {
      try {
        validateComposition(JSON.parse(body));
        writeFileSync(compPath, body);
        res.writeHead(200, { 'content-type': 'application/json' });
        res.end('{"ok":true}');
      } catch (e: any) {
        res.writeHead(400, { 'content-type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: String(e?.message ?? e) }));
      }
    });
    return;
  }
  // list assets in the project's assets dir (top level + uploads/)
  if (path === '/api/assets' && req.method === 'GET') {
    const assetsDir = resolve(dirname(compPath), '..', 'assets');
    const out: any[] = [];
    const scan = (dir: string) => {
      if (!existsSync(dir)) return;
      for (const f of readdirSync(dir)) {
        const full = join(dir, f);
        if (statSync(full).isDirectory()) { if (f === 'uploads') scan(full); continue; }
        const ext = extname(f).toLowerCase();
        if (!VIDEO_EXT.has(ext) && !IMAGE_EXT.has(ext)) continue;
        out.push({ name: f, src: relative(dirname(compPath), full).split(/[\\/]/).join('/'), type: assetType(f) });
      }
    };
    scan(assetsDir);
    res.writeHead(200, { 'content-type': 'application/json' });
    return res.end(JSON.stringify(out));
  }

  // upload a file into assets/uploads/
  if (path === '/api/upload' && req.method === 'POST') {
    const name = (url.searchParams.get('name') ?? 'file').replace(/[^a-zA-Z0-9._-]/g, '_');
    const dest = resolve(dirname(compPath), '..', 'assets', 'uploads');
    mkdirSync(dest, { recursive: true });
    const finalName = `${Date.now().toString(36)}-${name}`;
    const chunks: Buffer[] = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => {
      writeFileSync(join(dest, finalName), Buffer.concat(chunks));
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ name: finalName, src: `../assets/uploads/${finalName}`, type: assetType(finalName) }));
    });
    return;
  }

  // export: render the current composition to mp4
  if (path === '/api/render' && req.method === 'POST') {
    const relComp = relative(root, compPath);
    const child = spawn('npx', ['tsx', 'packages/cli/src/render.ts', relComp, 'out/studio-render.mp4'], { cwd: root });
    let log = '';
    child.stdout.on('data', (d) => (log += d));
    child.stderr.on('data', (d) => (log += d));
    child.on('close', (code) => {
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify(code === 0 ? { ok: true, url: '/out/studio-render.mp4?t=' + Date.now() } : { ok: false, error: log.slice(-400) }));
    });
    return;
  }

  if (path === '/api/events') {
    res.writeHead(200, {
      'content-type': 'text/event-stream', 'cache-control': 'no-cache', connection: 'keep-alive',
    });
    res.write('retry: 1000\n\n');
    sseClients.add(res);
    req.on('close', () => sseClients.delete(res));
    return;
  }

  // ---- static ----
  let file = path === '/' ? resolve(root, 'packages/editor/index.html') : resolve(root, '.' + normalize(path));
  if (!file.startsWith(root)) { res.writeHead(403); return res.end('forbidden'); }
  if (!existsSync(file) || statSync(file).isDirectory()) { res.writeHead(404); return res.end('not found'); }
  res.writeHead(200, { 'content-type': MIME[extname(file)] ?? 'application/octet-stream', 'cache-control': 'no-cache' });
  createReadStream(file).pipe(res);
});

server.listen(PORT, () => {
  console.log(`\n  VideoGenPro Studio  →  http://localhost:${PORT}`);
  console.log(`  editing: ${relative(root, compPath)}   (assetBase ${assetBase})`);
  console.log(`  the agent reads/writes this file to co-edit with you.\n`);
});
