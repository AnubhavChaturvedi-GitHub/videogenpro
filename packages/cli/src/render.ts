// Headless render: drive the runtime frame-by-frame via Playwright, capture
// PNGs, encode with ffmpeg. Deterministic — every frame is an explicit seek.
import { chromium } from 'playwright';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, resolve } from 'node:path';
import { readFileSync, mkdirSync, existsSync } from 'node:fs';
import { validateComposition, compositionDuration } from '../../core/src/index';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '../../..');

async function main() {
  const [compPath, outPath = 'out/output.mp4'] = process.argv.slice(2);
  if (!compPath) {
    console.error('usage: pnpm render <composition.json> [out.mp4]');
    process.exit(1);
  }
  const absComp = resolve(process.cwd(), compPath);
  const absOut = resolve(process.cwd(), outPath);
  mkdirSync(dirname(absOut), { recursive: true });

  const raw = JSON.parse(readFileSync(absComp, 'utf8'));
  const comp = validateComposition(raw);
  const totalDur = compositionDuration(comp);
  // B19: exactly round(totalDur*fps) frames, each at t = f/fps so the loop maps
  // cleanly onto [0, totalDur) — never requests t >= duration (which clamps oddly).
  const totalFrames = Math.max(1, Math.round(totalDur * comp.fps));
  console.log(`▶ ${comp.width}x${comp.height} @ ${comp.fps}fps · ${totalDur.toFixed(2)}s · ${totalFrames} frames`);

  if (!existsSync(resolve(root, 'packages/renderer/dist/runtime.js'))) {
    console.error('runtime not built. run: pnpm build:runtime');
    process.exit(1);
  }

  const browser = await chromium.launch({ args: ['--disable-gpu-vsync', '--force-color-profile=srgb'] });
  const page = await browser.newPage({
    viewport: { width: comp.width, height: comp.height },
    deviceScaleFactor: 1,
  });
  page.on('console', (m) => { if (m.type() === 'error') console.log('  [page error]', m.text()); });
  page.on('pageerror', (e) => console.log('  [pageerror]', e.message));

  const indexUrl = pathToFileURL(resolve(root, 'packages/renderer/index.html')).href;
  await page.goto(indexUrl);
  // resolve asset paths relative to the composition file
  const assetBase = pathToFileURL(dirname(absComp) + '/').href;
  const resolved = JSON.parse(JSON.stringify(comp));
  for (const s of resolved.scenes) for (const l of s.layers) {
    if ((l.type === 'image' || l.type === 'video') && l.src && !/^https?:|^file:/.test(l.src)) {
      l.src = new URL(l.src, assetBase).href;
    }
  }
  await page.evaluate((c) => (window as any).VGP.mount(c), resolved);
  await page.evaluate(() => (window as any).VGP.ready());

  // ffmpeg reads raw PNGs from stdin -> mp4
  // audio tracks (voiceover, music) — mixed in with per-track delay + volume
  // collect EVERY audio source on the timeline: composition audio tracks (unmuted) PLUS
  // any VIDEO layer whose own audio is enabled (muted === false), offset by its scene
  // start and trimmed/limited to its clip window.
  type ASrc = { src: string; start: number; volume: number; trimStart: number; duration?: number; isVideo: boolean };
  const srcs: ASrc[] = [];
  for (const a of ((comp.audio ?? []) as any[])) { if (a.muted) continue; srcs.push({ src: a.src, start: a.start ?? 0, volume: a.volume ?? 1, trimStart: a.trimStart ?? 0, duration: a.duration, isVideo: false }); }
  { let off = 0; for (const s of comp.scenes) { for (const l of (s.layers as any[])) { if (l.type === 'video' && l.muted === false && l.src) srcs.push({ src: l.src, start: off + (l.start ?? 0), volume: l.volume ?? 1, trimStart: l.trimStart ?? 0, duration: l.duration ?? s.duration, isVideo: true }); } off += s.duration; } }
  const resolveSrc = (src: string) => (/^https?:|^file:/.test(src) ? src : resolve(dirname(absComp), src));
  const hasAudioStream = (file: string): boolean => { try { const r = spawnSync('ffprobe', ['-v', 'error', '-select_streams', 'a', '-show_entries', 'stream=index', '-of', 'csv=p=0', file], { encoding: 'utf8' }); return r.status === 0 && /\d/.test(r.stdout || ''); } catch { return true; } };
  // B06: skip missing files; also skip a video whose file has NO audio stream (ffmpeg
  // would abort on a missing [a] pad). Resolve relative paths against the composition dir.
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
    const ms = Math.round(a.start * 1000); const vol = a.volume;
    // B01: trimStart sets where playback begins; duration caps the length. atrim first so
    // the subsequent adelay offsets the already-trimmed clip into the timeline.
    const ts = a.trimStart; const trimParts: string[] = [];
    if (ts || a.duration != null) { const endClause = a.duration != null ? `:end=${ts + a.duration}` : ''; trimParts.push(`atrim=start=${ts}${endClause}`, 'asetpts=PTS-STARTPTS'); }
    const trim = trimParts.length ? trimParts.join(',') + ',' : '';
    filters.push(`[${i + 1}:a]${trim}adelay=${ms}|${ms},volume=${vol}[a${i}]`);
  });
  const hasAudio = tracks.length > 0;
  if (hasAudio) filters.push(`${tracks.map((_, i) => `[a${i}]`).join('')}amix=inputs=${tracks.length}:normalize=0[aout]`);

  const ffArgs = ['-y', '-f', 'image2pipe', '-framerate', String(comp.fps), '-i', '-', ...audioArgs];
  // B06: with no valid audio tracks, render video-only (no -filter_complex / audio map).
  if (hasAudio) ffArgs.push('-filter_complex', filters.join(';'), '-map', '0:v', '-map', '[aout]');
  ffArgs.push('-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-preset', 'slow', '-crf', '15', '-profile:v', 'high', '-level', '4.2', '-movflags', '+faststart');
  if (hasAudio) ffArgs.push('-c:a', 'aac', '-b:a', '192k', '-t', String(totalDur));
  ffArgs.push(absOut);
  const ff = spawn('ffmpeg', ffArgs, { stdio: ['pipe', 'inherit', 'inherit'] });
  // B06: a missing/unspawnable ffmpeg must produce a clear error + non-zero exit,
  // not a silent hang on the stdin pipe.
  let ffFailed = false;
  ff.on('error', (err: NodeJS.ErrnoException) => {
    ffFailed = true;
    if (err.code === 'ENOENT') console.error('ffmpeg not found on PATH — install ffmpeg to export video.');
    else console.error('failed to start ffmpeg:', err.message);
    process.exit(1);
  });
  ff.stdin.on('error', () => { /* swallow EPIPE if ffmpeg died; the error handler reports it */ });

  const stage = await page.$('#stage');
  if (!stage) throw new Error('#stage not found');

  // B05: does the current frame contain any <video> layers? Only then do we pay
  // the extra settle cost — keeps non-video renders fast.
  const hasVideoLayers = resolved.scenes.some((s: any) => s.layers.some((l: any) => l.type === 'video'));

  for (let f = 0; f < totalFrames; f++) {
    if (ffFailed) break;
    const t = f / comp.fps;
    await page.evaluate((tt) => (window as any).VGP.seek(tt), t);
    if (hasVideoLayers) {
      // B05: after seeking, let video layers actually paint the seeked frame before
      // screenshotting, otherwise we can capture a stale/duplicate decode. Prefer
      // requestVideoFrameCallback (fires when a new video frame is presented), fall
      // back to a double rAF settle.
      await page.evaluate(() => new Promise<void>((res) => {
        const vids = Array.from(document.querySelectorAll('video')) as HTMLVideoElement[];
        const rvfc = vids.filter((v) => typeof (v as any).requestVideoFrameCallback === 'function');
        if (rvfc.length) {
          let pending = rvfc.length;
          const done = () => { if (--pending <= 0) res(); };
          // safety timeout so a paused/ended video can't stall the render
          const to = setTimeout(res, 300);
          rvfc.forEach((v) => (v as any).requestVideoFrameCallback(() => { clearTimeout(to); done(); }));
        } else {
          requestAnimationFrame(() => requestAnimationFrame(() => res()));
        }
      }));
    }
    const buf = await stage.screenshot({ type: 'png' });
    if (ffFailed) break;
    if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
    process.stdout.write(`@P ${f + 1} ${totalFrames}\n`); // machine-readable progress (parsed by the dev server)
  }
  ff.stdin.end();
  process.stdout.write(`\r  rendered ${totalFrames}/${totalFrames} frames        \n`);
  await new Promise<void>((res) => ff.on('close', () => res()));
  await browser.close();
  console.log(`✓ ${outPath}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
