// Headless render: drive the runtime frame-by-frame via Playwright, capture JPEG frames,
// encode with ffmpeg. Deterministic — every frame is an explicit seek() (render == preview).
// FAST: the timeline is split into N contiguous ranges rendered in PARALLEL across N headless
// pages (each → its own video segment), then the segments are concatenated (stream copy) and
// the audio is muxed once at the end.
import { chromium, type Browser } from 'playwright';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, resolve } from 'node:path';
import { readFileSync, writeFileSync, mkdirSync, existsSync, rmSync } from 'node:fs';
import { cpus } from 'node:os';
import { validateComposition, compositionDuration } from '../../core/src/index';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '../../..');

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

// Render frames [startF, endF) to `segOut` (video-only). Each segment runs on its own page so
// they render concurrently. onFrame is called once per completed frame (progress + preview).
async function renderSegment(browser: Browser, resolved: any, indexUrl: string, fps: number, startF: number, endF: number, segOut: string, onFrame: (buf: Buffer) => void, scaleFilter: string) {
  const page = await browser.newPage({ viewport: { width: resolved.width, height: resolved.height }, deviceScaleFactor: 1 });
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
  const scaleFilter = (tH !== comp.height || tW !== comp.width) ? `scale=${tW}:${tH}:flags=lanczos` : '';

  if (!existsSync(resolve(root, 'packages/renderer/dist/runtime.js'))) { console.error('runtime not built. run: pnpm build:runtime'); process.exit(1); }
  if (spawnSync('ffmpeg', ['-version'], { encoding: 'utf8' }).status !== 0) { console.error('ffmpeg not found on PATH — install ffmpeg to export video.'); process.exit(1); }

  // resolve asset paths (image/video AND audio) relative to the composition file for the browser
  const assetBase = pathToFileURL(dirname(absComp) + '/').href;
  const resolved = JSON.parse(JSON.stringify(comp));
  for (const s of resolved.scenes) for (const l of s.layers) {
    if ((l.type === 'image' || l.type === 'video') && l.src && !/^https?:|^file:/.test(l.src)) l.src = new URL(l.src, assetBase).href;
  }
  for (const a of ((resolved.audio ?? []) as any[])) { if (a.src && !/^https?:|^file:/.test(a.src)) a.src = new URL(a.src, assetBase).href; }

  const { audioArgs, filters, hasAudio } = buildAudio(comp, absComp);

  // Parallelism: one page per worker. Default to (cores-1) capped at 6 for memory; override with
  // VGP_WORKERS=N to push it harder on a big machine. Tiny renders stay single-threaded.
  const envWorkers = Number(process.env.VGP_WORKERS);
  let workers = Number.isInteger(envWorkers) && envWorkers > 0 ? envWorkers : Math.min(6, Math.max(1, cpus().length - 1));
  if (totalFrames < 90) workers = 1;
  const per = Math.ceil(totalFrames / workers);
  const ranges: [number, number][] = [];
  for (let i = 0; i < workers; i++) { const s = i * per, e = Math.min(totalFrames, (i + 1) * per); if (s < e) ranges.push([s, e]); }
  console.log(`▶ ${tW}x${tH} @ ${comp.fps}fps · ${totalDur.toFixed(2)}s · ${totalFrames} frames · ${ranges.length} worker(s)${scaleFilter ? ` (scaled from ${comp.width}x${comp.height})` : ''}`);

  const browser = await chromium.launch({ args: ['--disable-gpu-vsync', '--force-color-profile=srgb'] });
  const indexUrl = pathToFileURL(resolve(root, 'packages/renderer/index.html')).href;
  const outDir = dirname(absOut);
  const segPaths = ranges.map((_, i) => resolve(outDir, `._vgpseg_${i}.mp4`));
  let doneCount = 0;
  const onFrame = () => { doneCount++; process.stdout.write(`@P ${doneCount} ${totalFrames}\n`); };

  try {
    await Promise.all(ranges.map((r, i) => renderSegment(browser, resolved, indexUrl, comp.fps, r[0], r[1], segPaths[i], onFrame, scaleFilter)));
  } finally { await browser.close(); }

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
