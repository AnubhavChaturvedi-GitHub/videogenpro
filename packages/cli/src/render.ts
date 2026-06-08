// Headless render: drive the runtime frame-by-frame via Playwright, capture JPEG frames,
// encode with ffmpeg. Deterministic — every frame is an explicit seek() (render == preview).
// FAST: the timeline is split into N contiguous ranges rendered in PARALLEL across N headless
// pages (each → its own video segment), then the segments are concatenated (stream copy) and
// the audio is muxed once at the end.
import { chromium, type Browser } from 'playwright';
import { spawn, spawnSync } from 'node:child_process';
import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join, extname, normalize, sep } from 'node:path';
import { readFileSync, writeFileSync, mkdirSync, existsSync, rmSync, createReadStream, statSync } from 'node:fs';
import { cpus, totalmem } from 'node:os';
import { validateComposition, compositionDuration } from '../../core/src/index';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '../../..');

// Supersampling factor: capture each frame at SSAA× the comp resolution (Playwright
// deviceScaleFactor), then downscale (lanczos) to output. DEFAULT 1 = render at the comp's NATIVE
// resolution — since the comp is authored at 1920×1080 that is already crisp (vector text/SVG/CSS
// render at full res; raster is downscaled from high-res sources), and it is ~4× faster + ~4× less
// memory than SSAA2. Bump VGP_SSAA=1.5 or 2 for extra edge anti-aliasing at a real time/RAM cost.
const SSAA = Math.max(1, Number(process.env.VGP_SSAA) || 1);

// Build the ffmpeg audio inputs + filtergraph for the composition's audio (composition tracks
// PLUS any video layer whose own audio is enabled). Input 0 of the final mux is the video, so
// audio inputs are 1,2,… — these args/filters are reused verbatim in the finalize step.
function buildAudio(comp: any, absComp: string) {
  type ASrc = { src: string; start: number; volume: number; trimStart: number; duration?: number; isVideo: boolean };
  const srcs: ASrc[] = [];
  for (const a of ((comp.audio ?? []) as any[])) { if (a.muted) continue; srcs.push({ src: a.src, start: a.start ?? 0, volume: a.volume ?? 1, trimStart: a.trimStart ?? 0, duration: a.duration, isVideo: false }); }
  { let off = 0; for (const s of comp.scenes) { for (const l of (s.layers as any[])) { if (l.type === 'video' && l.muted === false && l.src) srcs.push({ src: l.src, start: off + (l.start ?? 0), volume: l.volume ?? 1, trimStart: l.trimStart ?? 0, duration: l.duration ?? s.duration, isVideo: true }); } off += s.duration; } }
  const resolveSrc = (src: string) => (/^https?:|^file:/.test(src) ? src : resolve(dirname(absComp), src));
  const hasAudioStream = (file: string): boolean => { try { const r = spawnSync('ffprobe', ['-v', 'error', '-select_streams', 'a', '-show_entries', 'stream=index', '-of', 'csv=p=0', file], { encoding: 'utf8' }); if (r.error || r.status === null) return true; return r.status === 0 && /\d/.test(r.stdout || ''); } catch { return true; } };
  const tracks = srcs.filter((a) => {
    if (/^https?:/.test(a.src)) return true;
    const fp = resolveSrc(a.src).replace(/^file:\/\//, '');
    if (!existsSync(fp)) { console.warn(`⚠ audio source missing, skipping: ${a.src}`); return false; }
    if (a.isVideo && !hasAudioStream(fp)) { console.warn(`⚠ video has no audio stream, skipping its audio: ${a.src}`); return false; }
    return true;
  });
  const audioArgs: string[] = []; const filters: string[] = [];
  tracks.forEach((a, i) => {
    audioArgs.push('-i', resolveSrc(a.src));
    const ms = Math.round(a.start * 1000); const vol = a.volume; const ts = a.trimStart; const trimParts: string[] = [];
    if (ts || a.duration != null) { const endClause = a.duration != null ? `:end=${ts + a.duration}` : ''; trimParts.push(`atrim=start=${ts}${endClause}`, 'asetpts=PTS-STARTPTS'); }
    const trim = trimParts.length ? trimParts.join(',') + ',' : '';
    filters.push(`[${i + 1}:a]${trim}adelay=${ms}|${ms},volume=${vol}[a${i}]`);
  });
  const hasAudio = tracks.length > 0;
  if (hasAudio) filters.push(`${tracks.map((_, i) => `[a${i}]`).join('')}amix=inputs=${tracks.length}:normalize=0[aout]`);
  return { audioArgs, filters, hasAudio };
}

const MIME: Record<string, string> = {
  '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json',
  '.css': 'text/css', '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf',
  '.png': 'image/png', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.gif': 'image/gif', '.webp': 'image/webp', '.mp4': 'video/mp4', '.webm': 'video/webm',
  '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.m4a': 'audio/mp4', '.ogg': 'audio/ogg',
};

// Minimal static file server with HTTP range support. Two mounts: '/__asset/<p>' serves from the
// composition dir; everything else serves from the repo root (the renderer package). Serving over
// HTTP (not file://) gives the render host page AND any embedded hyperframes iframe the SAME origin,
// so the runtime can drive the embed's GSAP timeline cross-frame — file:// gives every frame a
// "null" origin, which the browser treats as cross-origin and blocks (SecurityError).
function startStaticServer(rootDir: string, assetDir: string): Promise<{ port: number; close: () => Promise<void> }> {
  const safeJoin = (base: string, p: string): string | null => {
    const full = normalize(join(base, decodeURIComponent(p)));
    return (full === base || full.startsWith(base + sep)) ? full : null;
  };
  const server = createServer((req, res) => {
    try {
      let pathname = new URL(req.url || '/', 'http://localhost').pathname;
      let base = rootDir;
      if (pathname.startsWith('/__asset/')) { base = assetDir; pathname = pathname.slice('/__asset'.length); }
      const file = safeJoin(base, pathname);
      if (!file) { res.statusCode = 404; res.end('not found'); return; }
      let st; try { st = statSync(file); } catch { res.statusCode = 404; res.end('not found'); return; }
      if (st.isDirectory()) { res.statusCode = 404; res.end('not found'); return; }
      res.setHeader('Content-Type', MIME[extname(file).toLowerCase()] || 'application/octet-stream');
      res.setHeader('Accept-Ranges', 'bytes');
      const m = req.headers.range ? /bytes=(\d*)-(\d*)/.exec(req.headers.range) : null;
      if (m) {
        let start = m[1] ? parseInt(m[1], 10) : 0;
        let end = m[2] ? parseInt(m[2], 10) : st.size - 1;
        if (!Number.isFinite(start)) start = 0;
        if (!Number.isFinite(end) || end >= st.size) end = st.size - 1;
        if (start > end) { res.statusCode = 416; res.setHeader('Content-Range', `bytes */${st.size}`); res.end(); return; }
        res.statusCode = 206;
        res.setHeader('Content-Range', `bytes ${start}-${end}/${st.size}`);
        res.setHeader('Content-Length', String(end - start + 1));
        createReadStream(file, { start, end }).pipe(res);
      } else {
        res.statusCode = 200;
        res.setHeader('Content-Length', String(st.size));
        createReadStream(file).pipe(res);
      }
    } catch { res.statusCode = 500; res.end('error'); }
  });
  return new Promise((res) => server.listen(0, '127.0.0.1', () => res({ port: (server.address() as any).port, close: () => new Promise<void>((r) => server.close(() => r())) })));
}

// Render frames [startF, endF) to `segOut` (video-only). Each segment runs on its own page so
// they render concurrently. onFrame is called once per completed frame (progress + preview).
async function renderSegment(browser: Browser, resolved: any, indexUrl: string, fps: number, startF: number, endF: number, segOut: string, onFrame: (buf: Buffer) => void, scaleFilter: string) {
  const page = await browser.newPage({ viewport: { width: resolved.width, height: resolved.height }, deviceScaleFactor: SSAA });
  page.setDefaultTimeout(20000); // a wedged/crashed page errors out (diagnosable) instead of hanging the export forever
  page.on('pageerror', () => {}); // non-fatal (e.g. browser can't fetch() file:// audio for waveforms)
  // tsx (esbuild keepNames) wraps named inner fns in __name(); that helper is absent in the
  // browser, so page.evaluate'd fns with a named inner fn would throw. Shim it as a no-op.
  await page.addInitScript({ content: 'globalThis.__name = globalThis.__name || function (f) { return f; };' });
  await page.goto(indexUrl);
  await page.evaluate((c) => (window as any).VGP.mount(c), resolved);
  await page.evaluate(() => (window as any).VGP.ready());
  const stage = await page.$('#stage');
  if (!stage) throw new Error('#stage not found');
  const hasVideoLayers = resolved.scenes.some((s: any) => s.layers.some((l: any) => l.type === 'video'));

  let stderr = '';
  // -bf 0 (NO B-frames) → no frame reordering, so the copy-concat of independently-encoded
  // segments joins seamlessly with no timestamp glitch (the corruption risk). -g keyframes
  // each second. Optional scale runs here (in parallel, per segment) to the export resolution.
  // `-c:v mjpeg` on the INPUT: the screenshots are MJPEG, but image2pipe's auto-probe can fail
  // to identify the codec from small/low-detail frames (e.g. a near-black scene) within its probe
  // window → "Could not find codec parameters … Video: none, none" → ffmpeg emits no stream and
  // exits immediately. Once it dies, `stdin.write` returns false and the `drain` event never
  // fires, so the writer below would HANG FOREVER (a full-render wedge, resolution-dependent and
  // flaky). Naming the input codec makes detection deterministic, so this never happens.
  const vf = scaleFilter ? ['-vf', scaleFilter] : [];
  const ff = spawn('ffmpeg', ['-y', '-f', 'image2pipe', '-c:v', 'mjpeg', '-framerate', String(fps), '-i', '-', ...vf, '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-preset', 'veryfast', '-crf', '18', '-bf', '0', '-g', String(Math.max(2, Math.round(fps))), '-profile:v', 'high', '-level', '4.2', segOut], { stdio: ['pipe', 'ignore', 'pipe'] });
  ff.stderr.on('data', (d) => { stderr = (stderr + d).slice(-4000); });
  ff.stdin.on('error', () => {});
  // Defense-in-depth: if the encoder ever exits early (bad args, decode error, OOM-killed), record
  // it so the frame loop can abort instead of blocking on a `drain` that will never arrive.
  let ffExited: number | null = null;
  ff.on('close', (c) => { ffExited = c ?? 0; });

  for (let f = startF; f < endF; f++) {
    const t = f / fps;
    await page.evaluate((tt) => (window as any).VGP.seek(tt), t);
    if (hasVideoLayers) {
      // Wait for the seeked video frame(s) to present — but NEVER hang. The timeout is a HARD
      // CAP that always resolves; we only clearTimeout when we're actually resolving. (The old
      // code cleared the timeout on the FIRST rVFC while still waiting for ALL videos, so a frame
      // with one active + one idle/ended video deadlocked forever — the "stuck at 75%" with one
      // worker wedged on the part of the timeline that has it.)
      await page.evaluate(() => new Promise<void>((res) => {
        const vids = Array.from(document.querySelectorAll('video')) as HTMLVideoElement[];
        const rvfc = vids.filter((v) => typeof (v as any).requestVideoFrameCallback === 'function');
        if (!rvfc.length) { requestAnimationFrame(() => requestAnimationFrame(() => res())); return; }
        let pending = rvfc.length, settled = false;
        const finish = () => { if (settled) return; settled = true; clearTimeout(to); res(); };
        const done = () => { if (--pending <= 0) finish(); };
        const to = setTimeout(finish, 70); // hard cap: even if some videos never present a new frame
        rvfc.forEach((v) => (v as any).requestVideoFrameCallback(() => done()));
      }));
    }
    const buf = await stage.screenshot({ type: 'jpeg', quality: 90 });
    if (ffExited !== null) throw new Error(`ffmpeg segment exited early (${ffExited}): ${stderr.slice(-300)}`);
    // Wait for backpressure to clear, but bail if the encoder dies meanwhile (otherwise `drain`
    // never fires and the export hangs forever).
    if (!ff.stdin.write(buf)) await new Promise<void>((r) => { const done = () => r(); ff.stdin.once('drain', done); ff.once('close', done); });
    onFrame(buf);
  }
  ff.stdin.end();
  const code: number = ffExited ?? await new Promise<number>((res) => ff.on('close', (c) => res(c ?? 0)));
  await page.close();
  if (code !== 0) throw new Error(`ffmpeg segment exited ${code}: ${stderr.slice(-300)}`);
  // INTEGRITY: the segment MUST contain every frame of its range. If even one is missing we
  // abort the whole export rather than deliver a short/glitchy file (point 5: no missing data).
  const want = endF - startF;
  const pr = spawnSync('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-count_packets', '-show_entries', 'stream=nb_read_packets', '-of', 'csv=p=0', segOut], { encoding: 'utf8' });
  const got = parseInt((pr.stdout || '').trim(), 10) || 0;
  if (got < want) throw new Error(`segment incomplete (${got}/${want} frames) — aborting to avoid a corrupt export`);
}

async function main() {
  const [compPath, outPath = 'out/output.mp4', heightArg] = process.argv.slice(2);
  if (!compPath) { console.error('usage: pnpm render <composition.json> [out.mp4] [height]'); process.exit(1); }
  const absComp = resolve(process.cwd(), compPath);
  const absOut = resolve(process.cwd(), outPath);
  mkdirSync(dirname(absOut), { recursive: true });

  const raw = JSON.parse(readFileSync(absComp, 'utf8'));
  const comp = validateComposition(raw);

  // #6: run as long as the preview — include audio tails past the last scene.
  const probeDur = (f: string) => { try { const r = spawnSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f], { encoding: 'utf8' }); const d = parseFloat((r.stdout || '').trim()); return Number.isFinite(d) ? d : 0; } catch { return 0; } };
  let audioEnd = 0;
  for (const a of ((comp.audio ?? []) as any[])) {
    if (a.muted) continue;
    const file = (/^https?:|^file:/.test(a.src) ? a.src : resolve(dirname(absComp), a.src)).replace(/^file:\/\//, '');
    const len = a.duration ?? (probeDur(file) - (a.trimStart ?? 0));
    audioEnd = Math.max(audioEnd, (a.start ?? 0) + (Number.isFinite(len) && len > 0 ? len : 0));
  }
  const totalDur = Math.max(compositionDuration(comp), audioEnd);
  const totalFrames = Math.max(1, Math.round(totalDur * comp.fps));

  // export resolution: scale the comp's native aspect to the requested HEIGHT (even dims for h264).
  const targetH = heightArg ? Math.max(2, Math.round(Number(heightArg))) : comp.height;
  const tH = targetH - (targetH % 2);
  let tW = Math.round((comp.width / comp.height) * tH); tW -= tW % 2;
  // Frames are captured at SSAA× (deviceScaleFactor); always downscale the supersampled capture
  // to the target output (lanczos) — this is what turns the 4K capture into a crisp 1080p.
  const shotW = comp.width * SSAA, shotH = comp.height * SSAA;
  const scaleFilter = (shotW !== tW || shotH !== tH) ? `scale=${tW}:${tH}:flags=lanczos` : '';

  if (!existsSync(resolve(root, 'packages/renderer/dist/runtime.js'))) { console.error('runtime not built. run: pnpm build:runtime'); process.exit(1); }
  if (spawnSync('ffmpeg', ['-version'], { encoding: 'utf8' }).status !== 0) { console.error('ffmpeg not found on PATH — install ffmpeg to export video.'); process.exit(1); }

  // resolve asset paths (image/video AND audio) relative to the composition file for the browser
  // Serve renderer package + composition dir over HTTP so the host page and any embedded
  // hyperframes iframe share an origin (see startStaticServer). Asset srcs resolve to the
  // '/__asset/' mount; the hyperframes embed is resolved the same way as image/video.
  const srv = await startStaticServer(root, dirname(absComp));
  const origin = `http://127.0.0.1:${srv.port}`;
  const assetBase = `${origin}/__asset/`;
  const resolved = JSON.parse(JSON.stringify(comp));
  for (const s of resolved.scenes) for (const l of s.layers) {
    if ((l.type === 'image' || l.type === 'video' || l.type === 'hyperframes') && l.src && !/^https?:|^file:/.test(l.src)) l.src = new URL(l.src, assetBase).href;
  }
  for (const a of ((resolved.audio ?? []) as any[])) { if (a.src && !/^https?:|^file:/.test(a.src)) a.src = new URL(a.src, assetBase).href; }

  const { audioArgs, filters, hasAudio } = buildAudio(comp, absComp);

  // Parallelism: one page per worker. Default to (cores-1) capped at 6 for memory; override with
  // VGP_WORKERS=N to push it harder on a big machine. Tiny renders stay single-threaded.
  const envWorkers = Number(process.env.VGP_WORKERS);
  // Default: one parallel worker per CPU (minus one for the OS/encoder), capped by RAM because
  // each SSAA page is memory-heavy (~2GB budget/worker at 4K). On a 10-core/16GB Mac → 8 workers
  // (was hard-capped at 6). Override with VGP_WORKERS=N to push harder or throttle.
  // Per-worker RAM scales with the capture AREA (~SSAA²): a 4K (SSAA2) page costs ~4× a native
  // 1080p one. Cap workers by RAM so we NEVER oversubscribe into swap — paging is far slower than
  // running fewer workers (that was the regression). 16GB → ~9 workers at SSAA1, ~4 at SSAA2.
  const perWorkerGB = Math.max(1.0, SSAA * SSAA);
  const memCap = Math.max(1, Math.floor(totalmem() / 1e9 / perWorkerGB));
  let workers = Number.isInteger(envWorkers) && envWorkers > 0 ? envWorkers : Math.min(Math.max(1, cpus().length - 1), memCap);
  if (totalFrames < 90) workers = 1;
  const per = Math.ceil(totalFrames / workers);
  const ranges: [number, number][] = [];
  for (let i = 0; i < workers; i++) { const s = i * per, e = Math.min(totalFrames, (i + 1) * per); if (s < e) ranges.push([s, e]); }
  console.log(`▶ ${tW}x${tH} @ ${comp.fps}fps · ${totalDur.toFixed(2)}s · ${totalFrames} frames · ${ranges.length} worker(s) · SSAA ${SSAA}x (capture ${comp.width * SSAA}x${comp.height * SSAA})`);

  const browser = await chromium.launch({ args: ['--disable-gpu-vsync', '--force-color-profile=srgb'] });
  const indexUrl = `${origin}/packages/renderer/index.html`;
  const outDir = dirname(absOut);
  const segPaths = ranges.map((_, i) => resolve(outDir, `._vgpseg_${i}.mp4`));
  let doneCount = 0;
  const onFrame = () => { doneCount++; process.stdout.write(`@P ${doneCount} ${totalFrames}\n`); };

  try {
    await Promise.all(ranges.map((r, i) => renderSegment(browser, resolved, indexUrl, comp.fps, r[0], r[1], segPaths[i], onFrame, scaleFilter)));
  } finally { await browser.close(); await srv.close(); }

  // concat the segments (stream copy — each starts on a keyframe, so it's seamless)
  let videoFile = segPaths[0];
  if (segPaths.length > 1) {
    const listPath = resolve(outDir, '._vgpconcat.txt');
    writeFileSync(listPath, segPaths.map((p) => `file '${p.replace(/'/g, "'\\''")}'`).join('\n'));
    videoFile = resolve(outDir, '._vgpvideo.mp4');
    const c = spawnSync('ffmpeg', ['-y', '-f', 'concat', '-safe', '0', '-i', listPath, '-c', 'copy', videoFile], { encoding: 'utf8' });
    rmSync(listPath, { force: true });
    if (c.status !== 0) { console.error('concat failed:', (c.stderr || '').slice(-400)); process.exit(1); }
  }

  // finalize: mux audio over the (copied) video, or just copy when there's no audio
  const finalArgs = ['-y', '-i', videoFile];
  if (hasAudio) finalArgs.push(...audioArgs, '-filter_complex', filters.join(';'), '-map', '0:v', '-map', '[aout]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-t', String(totalDur));
  else finalArgs.push('-c', 'copy');
  finalArgs.push('-movflags', '+faststart', absOut);
  const fin = spawnSync('ffmpeg', finalArgs, { encoding: 'utf8' });
  if (fin.status !== 0) { console.error('finalize failed:', (fin.stderr || '').slice(-500)); process.exit(1); }

  // INTEGRITY: verify the delivered file exists and is the full length before declaring success
  // (point 5: never hand back a short/corrupt file).
  const outDur = probeDur(absOut);
  if (!existsSync(absOut) || outDur < totalDur - 0.5) { console.error(`✕ output incomplete: ${outDur.toFixed(2)}s of ${totalDur.toFixed(2)}s expected — not delivering a corrupt file`); process.exit(1); }

  for (const p of segPaths) rmSync(p, { force: true });
  if (videoFile !== segPaths[0]) rmSync(videoFile, { force: true });
  console.log(`✓ ${outPath}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
